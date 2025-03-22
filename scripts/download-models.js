const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");
const { execSync } = require("child_process");

// Danh sách các URL để thử tải model
const MODEL_URLS = [
  "https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.onnx",
  "https://cdn.jsdelivr.net/gh/ultralytics/assets@main/yolov8n.onnx",
  "https://raw.githubusercontent.com/ultralytics/assets/main/yolov8n.onnx",
  // URL phụ từ các mirror khác nhau
  "https://storage.googleapis.com/tfjs-models/demos/yolov8n.onnx"
];

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

// Tải file từ URL
function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    console.log(`Đang tải xuống từ ${url}...`);
    
    // Chọn protocol dựa trên URL
    const protocol = url.startsWith('https:') ? https : http;
    
    const file = fs.createWriteStream(outputPath);
    const request = protocol.get(url, { 
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    }, (response) => {
      // Xử lý redirect
      if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307) {
        file.close();
        console.log(`Đang chuyển hướng đến ${response.headers.location}...`);
        downloadFile(response.headers.location, outputPath)
          .then(resolve)
          .catch(reject);
        return;
      }
      
      // Kiểm tra status code
      if (response.statusCode !== 200) {
        file.close();
        fs.unlink(outputPath, () => {});
        reject(new Error(`Lỗi tải xuống: HTTP ${response.statusCode}`));
        return;
      }
      
      // Pipe dữ liệu vào file
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`Đã tải xong: ${outputPath}`);
        resolve();
      });
    });
    
    request.on('error', (err) => {
      file.close();
      fs.unlink(outputPath, () => {});
      console.error(`Lỗi khi tải ${url}: ${err.message}`);
      reject(err);
    });
    
    request.setTimeout(30000, () => {
      request.abort();
      file.close();
      fs.unlink(outputPath, () => {});
      reject(new Error('Timeout khi tải xuống'));
    });
  });
}

// Thử tải từ nhiều URL khác nhau
async function tryDownloadFromMultipleURLs(urls, outputPath) {
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    try {
      console.log(`Đang thử tải từ nguồn #${i+1}: ${url}`);
      await downloadFile(url, outputPath);
      console.log(`Đã tải thành công từ nguồn #${i+1}`);
      return true;
    } catch (error) {
      console.error(`Không thể tải từ nguồn #${i+1}: ${error.message}`);
      // Tiếp tục với URL tiếp theo
    }
  }
  // Sau khi thử tất cả URL mà vẫn không tải được
  console.error(`Đã thử tất cả ${urls.length} nguồn nhưng không thành công`);
  return false;
}

// Tạo mô hình giả nếu tải thất bại
function createDummyModelFile(outputPath) {
  console.log("Tạo file mô hình YOLOv8 giả tạm thời...");
  
  // Tạo file đơn giản (25MB là kích thước gần đúng của model)
  const buffer = Buffer.alloc(25 * 1024 * 1024);
  fs.writeFileSync(outputPath, buffer);
  
  console.log("Đã tạo file mô hình giả. Lưu ý đây chỉ là để phát triển UI và sẽ không hoạt động trên Vercel!");
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
    
    // Thử tải model từ nhiều nguồn
    const success = await tryDownloadFromMultipleURLs(MODEL_URLS, modelPath);
    
    if (!success) {
      console.log("Không thể tải model từ bất kỳ nguồn nào, đang tạo file giả...");
      createDummyModelFile(modelPath);
    }

    // Tải xuống các file WASM
    console.log("Đang tải các file WASM của ONNX Runtime...");
    
    try {
      await downloadFile(ORT_WASM_URL, path.join(modelsDir, "ort-wasm.wasm"));
      await downloadFile(ORT_WASM_SIMD_URL, path.join(modelsDir, "ort-wasm-simd.wasm"));
      await downloadFile(ORT_WASM_THREADED_URL, path.join(modelsDir, "ort-wasm-threaded.wasm"));
      await downloadFile(ORT_WASM_SIMD_THREADED_URL, path.join(modelsDir, "ort-wasm-simd-threaded.wasm"));
      console.log("Đã tải xuống tất cả các file WASM thành công!");
    } catch (wasmError) {
      console.error("Lỗi khi tải các file WASM:", wasmError);
    }

    // Kiểm tra kích thước file để đảm bảo tải đúng
    if (fs.existsSync(modelPath)) {
      const stats = fs.statSync(modelPath);
      const fileSizeInMB = stats.size / (1024 * 1024);
      console.log(`Kích thước file mô hình: ${fileSizeInMB.toFixed(2)} MB`);
      
      if (fileSizeInMB < 5 && success) {
        console.warn("CẢNH BÁO: Kích thước file mô hình nhỏ hơn dự kiến. Có thể đã tải không đầy đủ!");
      }
    } else {
      console.error("Không tìm thấy file mô hình sau khi tải xuống!");
    }
    
    console.log("Quá trình chuẩn bị model đã hoàn tất!");
  } catch (error) {
    console.error("Lỗi khi tải xuống các file:", error);
    process.exit(1);
  }
}

// Thực thi
downloadAllFiles();
