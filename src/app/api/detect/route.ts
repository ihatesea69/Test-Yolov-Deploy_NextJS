import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { exec } from "child_process";
import util from "util";

// Chuyển đổi exec sang Promise
const execAsync = util.promisify(exec);

export async function POST(request: NextRequest) {
  try {
    // Kiểm tra xem có form data không
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Không tìm thấy file" },
        { status: 400 }
      );
    }

    // Kiểm tra loại file
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: "File phải là ảnh hoặc video" },
        { status: 400 }
      );
    }

    // Đọc file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Tạo ID duy nhất cho file
    const id = uuidv4();
    const extension = path.extname(file.name);
    const filename = `${id}${extension}`;

    // Tạo thư mục uploads nếu chưa tồn tại
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const resultDir = path.join(process.cwd(), "public", "results");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    if (!fs.existsSync(resultDir)) {
      fs.mkdirSync(resultDir, { recursive: true });
    }

    // Lưu file
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);

    let resultFilename;

    if (isImage) {
      // Do xử lý ảnh bằng YOLOv ở phía client, nên ở đây chỉ trả về URL của ảnh
      resultFilename = filename;
    } else if (isVideo) {
      // Xử lý video phía server không được hỗ trợ trong bản demo này
      // Trong thực tế, bạn có thể gọi Python script ở đây
      resultFilename = filename;
    }

    // Trả về URL của file đã upload và kết quả
    return NextResponse.json({
      success: true,
      file: `/uploads/${filename}`,
      result: resultFilename ? `/results/${resultFilename}` : null,
      type: isImage ? "image" : "video",
    });
  } catch (error) {
    console.error("Lỗi trong quá trình xử lý:", error);
    return NextResponse.json(
      { error: "Lỗi trong quá trình xử lý" },
      { status: 500 }
    );
  }
}
