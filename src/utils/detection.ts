import * as tf from "@tensorflow/tfjs";
import * as ort from "onnxruntime-web";
import "@tensorflow/tfjs-backend-webgl";

// Load COCO-SSD model as a fallback
let cocoSsdModel: any = null;

// Interface cho kết quả nhận diện từ COCO-SSD
export interface CocoClass {
  bbox: [number, number, number, number]; // [x, y, width, height]
  class: string;
  score: number;
}

// Function to lazy load COCO-SSD model
async function loadCocoSsdModel() {
  if (!cocoSsdModel) {
    try {
      console.log("Đang tải mô hình COCO-SSD từ TensorFlow.js...");
      // Dynamically import the COCO-SSD model
      const cocoSsd = await import("@tensorflow-models/coco-ssd");
      cocoSsdModel = await cocoSsd.load();
      console.log("Đã tải mô hình COCO-SSD thành công!");
    } catch (error) {
      console.error("Lỗi khi tải mô hình COCO-SSD:", error);
      throw error;
    }
  }
  return cocoSsdModel;
}

// Danh sách các lớp COCO mà YOLOv nhận diện được
const COCO_CLASSES = [
  "person",
  "bicycle",
  "car",
  "motorcycle",
  "airplane",
  "bus",
  "train",
  "truck",
  "boat",
  "traffic light",
  "fire hydrant",
  "stop sign",
  "parking meter",
  "bench",
  "bird",
  "cat",
  "dog",
  "horse",
  "sheep",
  "cow",
  "elephant",
  "bear",
  "zebra",
  "giraffe",
  "backpack",
  "umbrella",
  "handbag",
  "tie",
  "suitcase",
  "frisbee",
  "skis",
  "snowboard",
  "sports ball",
  "kite",
  "baseball bat",
  "baseball glove",
  "skateboard",
  "surfboard",
  "tennis racket",
  "bottle",
  "wine glass",
  "cup",
  "fork",
  "knife",
  "spoon",
  "bowl",
  "banana",
  "apple",
  "sandwich",
  "orange",
  "broccoli",
  "carrot",
  "hot dog",
  "pizza",
  "donut",
  "cake",
  "chair",
  "couch",
  "potted plant",
  "bed",
  "dining table",
  "toilet",
  "tv",
  "laptop",
  "mouse",
  "remote",
  "keyboard",
  "cell phone",
  "microwave",
  "oven",
  "toaster",
  "sink",
  "refrigerator",
  "book",
  "clock",
  "vase",
  "scissors",
  "teddy bear",
  "hair drier",
  "toothbrush",
];

// Tạo các màu ngẫu nhiên cho các lớp
const COLORS = Array.from(
  { length: COCO_CLASSES.length },
  () =>
    "#" +
    Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, "0")
);

// Interface cho kết quả nhận diện
export interface Detection {
  bbox: [number, number, number, number]; // [x, y, width, height]
  class: string;
  score: number;
  color: string;
}

// Interface cho model wrapper
export interface ModelWrapper {
  type: "onnx" | "tensorflow";
  model: ort.InferenceSession | any;
  detect: (imageData: ImageData) => Promise<Detection[]>;
}

// Danh sách các URL mô hình có thể sử dụng
const MODEL_URLS = [
  // Mô hình từ Hugging Face - YOLOv8n
  "https://huggingface.co/Xenova/yolov8/resolve/main/yolov8n.onnx",
  // Mô hình YOLOv8s (nhỏ hơn YOLOv8n) từ Hugging Face
  "https://huggingface.co/Xenova/yolov8/resolve/main/yolov8s.onnx",
  // Mô hình từ Ultralytics
  "https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.onnx",
  // Mô hình từ YOLOv8 ONNX chính thức
  "https://huggingface.co/chansung/yolov8-onnx/resolve/main/yolov8n.onnx",
];

// Hàm tải model YOLOv8n
export const loadModel = async (): Promise<ModelWrapper> => {
  try {
    // Cấu hình đường dẫn các file WASM của ONNX Runtime
    ort.env.wasm.wasmPaths = {
      "ort-wasm.wasm": "/models/ort-wasm.wasm",
      "ort-wasm-simd.wasm": "/models/ort-wasm-simd.wasm",
      "ort-wasm-threaded.wasm": "/models/ort-wasm-threaded.wasm",
      "ort-wasm-simd-threaded.wasm": "/models/ort-wasm-simd-threaded.wasm",
    };

    // Cấu hình session options
    const sessionOptions = {
      executionProviders: ["wasm"],
      graphOptimizationLevel: "all" as const,
      enableCpuMemArena: true,
      logSeverityLevel: 0, // Tăng mức log để gỡ lỗi
      logVerbosityLevel: 0,
    };

    // Đầu tiên thử tải từ local
    console.log("Đang thử tải mô hình YOLOv8n từ local...");
    try {
      const model = await ort.InferenceSession.create(
        "/models/yolov8n.onnx",
        sessionOptions
      );
      console.log("Đã tải mô hình ONNX local thành công!");

      return {
        type: "onnx",
        model,
        detect: async (imageData: ImageData) => {
          const inputTensor = await preprocess(imageData);
          const outputs = await model.run({ images: inputTensor });
          const outputTensor = outputs[Object.keys(outputs)[0]] as ort.Tensor;
          return processOutput(outputTensor, imageData.width, imageData.height);
        },
      };
    } catch (localError) {
      console.error("Lỗi khi tải mô hình ONNX từ local:", localError);

      // Thử tải lần lượt từ các URL CDN
      let lastError = localError;
      for (let i = 0; i < MODEL_URLS.length; i++) {
        const url = MODEL_URLS[i];
        console.log(
          `Thử tải mô hình từ URL (${i + 1}/${MODEL_URLS.length}): ${url}`
        );

        try {
          // Thêm tham số ngẫu nhiên để tránh cache
          const urlWithNonce = `${url}?nonce=${Date.now()}`;
          console.log(`Đang tải từ URL: ${urlWithNonce}`);

          // Thiết lập timeout cho việc tải mô hình
          const abortController = new AbortController();
          const timeoutId = setTimeout(() => abortController.abort(), 30000); // 30 giây timeout

          const fetchOptions = {
            method: "GET",
            cache: "no-cache",
            signal: abortController.signal,
            headers: {
              Accept: "*/*",
              "Cache-Control": "no-cache",
            },
          };

          // Tạo session, truyền trực tiếp fetchOptions
          const model = await ort.InferenceSession.create(urlWithNonce, {
            ...sessionOptions,
            fetchOptions,
          });

          clearTimeout(timeoutId);
          console.log(`Đã tải mô hình ONNX từ ${url} thành công!`);

          return {
            type: "onnx",
            model,
            detect: async (imageData: ImageData) => {
              const inputTensor = await preprocess(imageData);
              const outputs = await model.run({ images: inputTensor });
              const outputTensor = outputs[
                Object.keys(outputs)[0]
              ] as ort.Tensor;
              return processOutput(
                outputTensor,
                imageData.width,
                imageData.height
              );
            },
          };
        } catch (error) {
          lastError = error;
          console.error(`Lỗi khi tải mô hình ONNX từ ${url}:`, error);
        }
      }

      // Nếu đã thử tất cả các URL ONNX mà vẫn thất bại, thử sử dụng TensorFlow.js COCO-SSD
      console.log(
        "Đang thử dùng TensorFlow.js COCO-SSD làm phương án dự phòng..."
      );

      try {
        const cocoModel = await loadCocoSsdModel();
        console.log(
          "Sử dụng mô hình COCO-SSD từ TensorFlow.js như một phương án dự phòng"
        );

        return {
          type: "tensorflow",
          model: cocoModel,
          detect: async (imageData: ImageData) => {
            // Chuyển đổi ImageData sang HTMLImageElement bằng canvas
            const canvas = document.createElement("canvas");
            canvas.width = imageData.width;
            canvas.height = imageData.height;
            const ctx = canvas.getContext("2d");
            ctx?.putImageData(imageData, 0, 0);

            // Thực hiện dự đoán bằng COCO-SSD
            const predictions = await cocoModel.detect(canvas);

            // Chuyển đổi kết quả sang định dạng Detection
            return predictions.map((pred: any, index: number) => {
              const [x, y, width, height] = pred.bbox;
              return {
                bbox: [x, y, width, height] as [number, number, number, number],
                class: pred.class,
                score: pred.score,
                color: COLORS[index % COLORS.length],
              };
            });
          },
        };
      } catch (cocoError) {
        console.error("Lỗi khi tải mô hình COCO-SSD:", cocoError);
        throw new Error(
          `Đã thử tất cả các phương án mô hình nhưng không thành công! Lỗi ONNX cuối cùng: ${lastError.message}, Lỗi COCO-SSD: ${cocoError.message}`
        );
      }
    }
  } catch (error) {
    console.error("Lỗi khi tải model:", error);
    throw new Error(`Không thể tải mô hình: ${error.message}`);
  }
};

// Hàm tiền xử lý ảnh
export const preprocess = async (
  imageData: ImageData,
  modelWidth: number = 640,
  modelHeight: number = 640
): Promise<ort.Tensor> => {
  // Chuyển ImageData sang tensor
  const imgTensor = tf.browser.fromPixels(imageData);

  // Resize và chuẩn hóa
  const resized = tf.image.resizeBilinear(imgTensor, [modelHeight, modelWidth]);
  const normalized = resized.div(255.0);

  // Chuyển thành định dạng batch [1, 3, height, width]
  const transposed = normalized.transpose([2, 0, 1]); // HWC -> CHW
  const batched = transposed.expandDims(0);

  // Chuyển sang định dạng Float32Array cho ONNX
  const data = await batched.data();

  // Giải phóng bộ nhớ
  imgTensor.dispose();
  resized.dispose();
  normalized.dispose();
  transposed.dispose();
  batched.dispose();

  // Tạo Tensor ONNX
  return new ort.Tensor("float32", new Float32Array(data), [
    1,
    3,
    modelHeight,
    modelWidth,
  ]);
};

// Hàm xử lý kết quả từ model
export const processOutput = (
  output: ort.Tensor,
  imageWidth: number,
  imageHeight: number,
  threshold: number = 0.25
): Detection[] => {
  // Kiểm tra và ghi kích thước tensor đầu ra
  console.log("Output tensor shape:", output.dims);

  const data = output.data as Float32Array;

  // Thay đổi cách xử lý đầu ra tùy thuộc vào phiên bản YOLOv
  let detections: Detection[] = [];

  // Xử lý cho YOLOv8
  try {
    // YOLOv8 có định dạng output là [1, n_boxes, n_classes+4]
    const numBoxes = output.dims[1]; // số lượng bounding boxes
    const dimensions = output.dims[2]; // số lượng thông tin mỗi box: 4 (bbox) + số lớp

    for (let i = 0; i < numBoxes; i++) {
      const boxOffset = i * dimensions;

      // Lấy điểm số cho mỗi lớp
      const scores: number[] = [];
      const startOffset = boxOffset + 4; // bỏ qua 4 giá trị đầu tiên (x, y, w, h)

      for (
        let j = 0;
        j < COCO_CLASSES.length && startOffset + j < data.length;
        j++
      ) {
        scores.push(data[startOffset + j]);
      }

      // Tìm lớp có điểm số cao nhất
      const maxScoreIndex = scores.indexOf(Math.max(...scores));
      const score = scores[maxScoreIndex];

      if (score > threshold) {
        // Lấy thông tin bounding box
        const x = data[boxOffset];
        const y = data[boxOffset + 1];
        const w = data[boxOffset + 2];
        const h = data[boxOffset + 3];

        // Chuyển đổi thành tọa độ thực tế trên ảnh
        const scaledX = (x / 640) * imageWidth;
        const scaledY = (y / 640) * imageHeight;
        const scaledW = (w / 640) * imageWidth;
        const scaledH = (h / 640) * imageHeight;

        detections.push({
          bbox: [scaledX, scaledY, scaledW, scaledH],
          class: COCO_CLASSES[maxScoreIndex],
          score: score,
          color: COLORS[maxScoreIndex],
        });
      }
    }
  } catch (error) {
    console.error("Lỗi khi xử lý kết quả từ model:", error);
    // Trả về mảng rỗng nếu có lỗi
    return [];
  }

  return detections;
};

// Hàm vẽ kết quả lên canvas
export const drawDetections = (
  ctx: CanvasRenderingContext2D,
  detections: Detection[]
) => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  detections.forEach((detection) => {
    const [x, y, width, height] = detection.bbox;
    const label = `${detection.class} ${Math.round(detection.score * 100)}%`;

    // Vẽ bounding box
    ctx.strokeStyle = detection.color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    // Vẽ nền cho nhãn
    ctx.fillStyle = detection.color;
    const textWidth = ctx.measureText(label).width;
    ctx.fillRect(x, y - 20, textWidth + 10, 20);

    // Vẽ nhãn
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "16px Arial";
    ctx.fillText(label, x + 5, y - 5);
  });
};

// Hàm phát hiện đối tượng từ model và ảnh
export const detectObjects = async (
  model: any,
  image: HTMLImageElement
): Promise<CocoClass[]> => {
  if (!model) {
    console.error("Model không được cung cấp");
    throw new Error("Model không được cung cấp");
  }

  // Thêm debug để kiểm tra model
  console.log("Model được cung cấp:", model);
  console.log("Model type:", model?.type);
  
  try {
    // Nếu model là ModelWrapper theo định nghĩa của chúng ta
    if (model.type === "tensorflow") {
      // Sử dụng COCO-SSD
      console.log("Sử dụng model TensorFlow COCO-SSD");
      const predictions = await model.model.detect(image);
      return predictions.map((pred: any) => ({
        bbox: [pred.bbox[0], pred.bbox[1], pred.bbox[2], pred.bbox[3]],
        class: pred.class,
        score: pred.score,
      }));
    } else if (model.type === "onnx") {
      // Sử dụng ONNX model
      console.log("Sử dụng model ONNX");
      
      // Tạo canvas để chuyển ảnh thành ImageData
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Không thể tạo context cho canvas");
      }
      
      ctx.drawImage(image, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Kiểm tra hàm detect có tồn tại không
      if (typeof model.detect !== 'function') {
        console.error("Model không có phương thức detect:", model);
        throw new Error("Model ONNX không có phương thức detect");
      }
      
      // Sử dụng phương thức detect của ONNX model
      const detections = await model.detect(imageData);
      return detections.map((det) => ({
        bbox: det.bbox,
        class: det.class,
        score: det.score,
      }));
    } else {
      // Kiểm tra nếu model trực tiếp là COCO-SSD model (không có wrapper)
      if (model.detect && typeof model.detect === 'function') {
        console.log("Sử dụng model trực tiếp với phương thức detect");
        try {
          const predictions = await model.detect(image);
          return predictions.map((pred: any) => ({
            bbox: [pred.bbox[0], pred.bbox[1], pred.bbox[2], pred.bbox[3]],
            class: pred.class,
            score: pred.score,
          }));
        } catch (detectError) {
          console.error("Lỗi khi gọi model.detect trực tiếp:", detectError);
        }
      }
      
      console.error("Chi tiết model không hợp lệ:", model);
      throw new Error(`Không hỗ trợ loại model này: ${model.type || 'không xác định'}`);
    }
  } catch (error) {
    console.error("Lỗi khi phát hiện đối tượng:", error);
    throw error;
  }
};
