const fs = require("fs");
const path = require("path");
const https = require("https");
const { execSync } = require("child_process");

// URLs cho các file cần tải xuống - Sử dụng URL mới
const MODEL_URL = "https://github.com/ultralytics/ultralytics/releases/download/v8.0.0/yolov8n.onnx";
// Dự phòng URL thứ hai nếu URL đầu tiên không hoạt động
const MODEL_URL_BACKUP = "https://huggingface.co/ultralytics/yolov8/resolve/main/yolov8n.onnx";

// URL cho ONNX Runtime WASM files từ phiên bản chính xác
const ORT_VERSION = "1.17.0"; // Phiên bản ổn định của ONNX Runtime
const ORT_BASE_URL = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist`;
const ORT_WASM_URL = `${ORT_BASE_URL}/ort-wasm.wasm`;
const ORT_WASM_SIMD_URL = `${ORT_BASE_URL}/ort-wasm-simd.wasm`;
const ORT_WASM_THREADED_URL = `${ORT_BASE_URL}/ort-wasm-threaded.wasm`;
const ORT_WASM_SIMD_THREADED_URL = `${ORT_BASE_URL}/ort-wasm-simd-threaded.wasm`;

// Tạo thư mục models nếu chưa tồn tại
const modelsDir = path.join(__dirname, "../public/models");
if (!fs.existsSync(modelsDir)) {
  console.log("Tạo thư mục models...");
  fs.mkdirSync(modelsDir, { recursive: true });
}

// Hàm tải xuống file
function downloadFile(url, outputPath) {
  console.log(`Đang tải xuống từ ${url}...`);
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);
    https
      .get(url, (response) => {
        // Kiểm tra mã trạng thái
        if (response.statusCode === 302 || response.statusCode === 301) {
          // Xử lý chuyển hướng
          console.log(`Đang chuyển hướng đến ${response.headers.location}...`);
          file.close();
          downloadFile(response.headers.location, outputPath)
            .then(resolve)
            .catch(reject);
          return;
        }
        
        if (response.statusCode !== 200) {
          file.close();
          fs.unlink(outputPath, () => {});
          reject(new Error(`Lỗi khi tải xuống: Mã trạng thái ${response.statusCode}`));
          return;
        }
        
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          console.log(`Đã tải xong: ${outputPath}`);
          resolve();
        });
      })
      .on("error", (err) => {
        file.close();
        fs.unlink(outputPath, () => {});
        console.error(`Lỗi khi tải xuống ${url}: ${err.message}`);
        reject(err);
      });
  });
}

// Hàm tải xuống với dự phòng
async function downloadWithFallback(primaryUrl, backupUrl, outputPath) {
  try {
    await downloadFile(primaryUrl, outputPath);
  } catch (error) {
    console.log(`Không thể tải từ URL chính: ${error.message}`);
    console.log(`Thử tải từ URL dự phòng: ${backupUrl}`);
    await downloadFile(backupUrl, outputPath);
  }
}

// Tạo mô hình giả nếu tải thất bại
function createDummyModelFile(outputPath) {
  console.log("Tạo file mô hình giả tạm thời để phát triển...");
  
  // Tạo file đơn giản chỉ 10KB
  const buffer = Buffer.alloc(10 * 1024);
  fs.writeFileSync(outputPath, buffer);
  
  console.log("Đã tạo file mô hình giả. Lưu ý đây chỉ là để phát triển UI và sẽ không hoạt động!");
}

// Tải xuống tất cả các file
async function downloadAllFiles() {
  try {
    // Tạo thư mục uploads và results
    const uploadsDir = path.join(__dirname, "../public/uploads");
    const resultsDir = path.join(__dirname, "../public/results");

    if (!fs.existsSync(uploadsDir)) {
      console.log("Tạo thư mục uploads...");
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    if (!fs.existsSync(resultsDir)) {
      console.log("Tạo thư mục results...");
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    const modelPath = path.join(modelsDir, "yolov8n.onnx");
    
    // Tải xuống model với dự phòng
    try {
      await downloadWithFallback(MODEL_URL, MODEL_URL_BACKUP, modelPath);
    } catch (modelError) {
      console.error("Không thể tải mô hình từ cả hai nguồn:", modelError);
      console.log("Đang thử tạo file giả tạm thời để tiếp tục phát triển...");
      createDummyModelFile(modelPath);
    }

    // Tải xuống các file WASM
    try {
      await downloadFile(ORT_WASM_URL, path.join(modelsDir, "ort-wasm.wasm"));
      await downloadFile(ORT_WASM_SIMD_URL, path.join(modelsDir, "ort-wasm-simd.wasm"));
      await downloadFile(ORT_WASM_THREADED_URL, path.join(modelsDir, "ort-wasm-threaded.wasm"));
      await downloadFile(ORT_WASM_SIMD_THREADED_URL, path.join(modelsDir, "ort-wasm-simd-threaded.wasm"));
    } catch (wasmError) {
      console.error("Lỗi khi tải các file WASM:", wasmError);
    }

    console.log("Đã tải xuống tất cả các file có thể tải được!");
    console.log("Kiểm tra kích thước mô hình YOLOv8n...");

    // Kiểm tra kích thước file để đảm bảo tải đúng
    if (fs.existsSync(modelPath)) {
      const stats = fs.statSync(modelPath);
      const fileSizeInMB = stats.size / (1024 * 1024);
      console.log(`Kích thước file mô hình: ${fileSizeInMB.toFixed(2)} MB`);
      
      if (fileSizeInMB < 5) {
        console.warn("CẢNH BÁO: Kích thước file mô hình nhỏ hơn dự kiến. Có thể đã tải không đầy đủ!");
      }
    } else {
      console.error("Không tìm thấy file mô hình sau khi tải xuống!");
    }
  } catch (error) {
    console.error("Lỗi khi tải xuống các file:", error);
    process.exit(1);
  }
}

// Thực thi
downloadAllFiles();
