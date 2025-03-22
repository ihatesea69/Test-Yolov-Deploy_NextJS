# YOLOv8 Nhận Diện Đối Tượng

Ứng dụng demo nhận diện đối tượng sử dụng YOLOv8 và COCO-SSD với Next.js.

## Tính năng

- Nhận diện đối tượng với YOLOv8 (ONNX)
- Dự phòng với COCO-SSD (TensorFlow.js)
- Tải lên ảnh qua kéo-thả
- Giao diện người dùng thân thiện
- Hiển thị kết quả nhận diện với các khung bao quanh và nhãn đối tượng

## Công nghệ sử dụng

- Next.js (React Framework)
- ONNX Runtime Web
- TensorFlow.js
- React Dropzone

## Hướng dẫn cài đặt và chạy local

1. Clone repository:
```bash
git clone [url-repository]
cd yolov-deploy
```

2. Cài đặt các gói phụ thuộc:
```bash
npm install
```

3. Tải các models:
```bash
npm run download-models
```

4. Khởi chạy ứng dụng:
```bash
npm run dev
```

5. Truy cập ứng dụng tại: http://localhost:3000

## Triển khai lên Vercel

### 1. Chuẩn bị Repository

- Đảm bảo code đã được đẩy lên GitHub

### 2. Tạo tài khoản Vercel

1. Truy cập [vercel.com](https://vercel.com)
2. Đăng ký tài khoản bằng email hoặc đăng nhập bằng GitHub
3. Xác nhận email nếu cần

### 3. Triển khai

1. Từ dashboard Vercel, nhấn **Add New** > **Project**
2. Kết nối với GitHub và chọn repository
3. Cấu hình triển khai:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build` (mặc định)
   - **Install Command**: `npm install` (mặc định)
   - **Output Directory**: `.next` (mặc định)

4. Cấu hình Biến Môi Trường (nếu cần)

5. Nhấn **Deploy**

### 4. Xác minh triển khai

- Kiểm tra logs để đảm bảo quá trình xây dựng thành công
- Truy cập URL Vercel được cung cấp
- Thử tải lên ảnh để kiểm tra chức năng nhận diện

## Lưu ý khi triển khai

- File model YOLOv8n.onnx đã được tạo sẵn (dummy file) để phát triển UI
- Khi triển khai production, cần đảm bảo có model thực tế
- Có thể tải model thực tế từ Hugging Face hoặc Ultralytics
- Các file WASM của ONNX Runtime đã được tải sẵn trong `/public/models`

## License

MIT

## Liên hệ

Nếu có bất kỳ câu hỏi hoặc góp ý, vui lòng tạo issue trong repository.
