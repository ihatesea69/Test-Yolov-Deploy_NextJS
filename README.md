# Ứng Dụng Demo Nhận Diện Đối Tượng với YOLOv

Đây là một ứng dụng demo nhận diện người và đồ vật sử dụng YOLOv và NextJS. Ứng dụng này cho phép người dùng tải lên ảnh hoặc video và xử lý nó thông qua YOLOv để nhận diện đối tượng.

## Tính năng

- Tải lên ảnh và video
- Nhận diện đối tượng trong ảnh sử dụng YOLOv8n
- Hiển thị kết quả nhận diện với bounding box và nhãn
- Giao diện người dùng thân thiện và đáp ứng

## Công nghệ sử dụng

- Next.js 14
- React
- TensorFlow.js
- ONNX Runtime Web
- Tailwind CSS

## Cài đặt model

Để ứng dụng hoạt động, bạn cần tải xuống model YOLOv8n:

1. Tạo thư mục `public/models` nếu chưa tồn tại
2. Tải xuống file YOLOv8n ONNX từ [Ultralytics](https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.onnx) và đặt vào thư mục `public/models`
3. Tải xuống các file WASM của ONNX Runtime từ [ONNX Runtime Web](https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/) và đặt vào thư mục `public/models`:
   - ort-wasm.wasm
   - ort-wasm-simd.wasm
   - ort-wasm-threaded.wasm
   - ort-wasm-simd-threaded.wasm

## Hướng dẫn sử dụng

### Cài đặt

```bash
# Sao chép repository
git clone https://github.com/your-username/yolov-detection-demo.git
cd yolov-detection-demo

# Cài đặt các phụ thuộc
npm install

# Khởi động ứng dụng ở chế độ development
npm run dev
```

### Sử dụng ứng dụng

1. Mở trình duyệt và truy cập vào `http://localhost:3000`
2. Nhấp vào khu vực tải lên hoặc kéo và thả tệp ảnh
3. Đợi ứng dụng xử lý ảnh và hiển thị kết quả nhận diện

## Deploy lên Vercel

Ứng dụng này được thiết kế để dễ dàng triển khai lên Vercel:

1. Đăng ký tài khoản [Vercel](https://vercel.com) nếu bạn chưa có
2. Kết nối repository của bạn với Vercel
3. Cấu hình các biến môi trường nếu cần
4. Deploy!

## Giấy phép

MIT
