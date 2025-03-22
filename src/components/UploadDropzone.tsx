"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { FiUpload, FiFile, FiX } from "react-icons/fi";

interface UploadDropzoneProps {
  onImageUpload: (imageUrl: string) => void;
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({
  onImageUpload,
}) => {
  const [imageName, setImageName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setError(null);
      const file = acceptedFiles[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        setError("Please upload an image file");
        return;
      }

      setImageName(file.name);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      onImageUpload(objectUrl);
    },
    [onImageUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    multiple: false,
  });

  const removeImage = useCallback(() => {
    setImageName(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }, [previewUrl]);

  return (
    <div>
      <div
        {...getRootProps()}
        style={{
          border: "2px dashed #d1d5db",
          borderRadius: "0.5rem",
          padding: "1.5rem",
          textAlign: "center",
          cursor: "pointer",
          backgroundColor: isDragActive ? "#f3f4f6" : "transparent",
          transition: "all 0.2s ease",
          marginBottom: "1rem"
        }}
      >
        <input {...getInputProps()} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <FiUpload style={{ fontSize: "2.5rem", color: "#4b5563", marginBottom: "0.75rem" }} />
          <p style={{ fontSize: "1rem", color: "#6b7280", fontWeight: 500 }}>
            {isDragActive
              ? "Thả tập tin ở đây"
              : "Kéo & thả ảnh vào đây, hoặc click để chọn file"}
          </p>
          <p style={{ fontSize: "0.875rem", color: "#9ca3af", marginTop: "0.5rem" }}>
            Hỗ trợ các định dạng: JPEG, PNG, WebP
          </p>
        </div>
      </div>

      {error && (
        <div style={{
          padding: "0.75rem",
          backgroundColor: "#fee2e2",
          color: "#b91c1c",
          borderRadius: "0.375rem",
          marginBottom: "1rem",
          display: "flex",
          alignItems: "center"
        }}>
          <FiX style={{ marginRight: "0.5rem", flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {previewUrl && (
        <div style={{ marginTop: "1rem" }}>
          <div style={{
            display: "flex", 
            alignItems: "center", 
            marginBottom: "1rem",
            backgroundColor: "#f3f4f6",
            padding: "0.5rem 0.75rem",
            borderRadius: "0.375rem"
          }}>
            <FiFile style={{ marginRight: "0.5rem", color: "#4b5563" }} />
            <span style={{ color: "#4b5563", fontSize: "0.875rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flexGrow: 1 }}>
              {imageName}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeImage();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#6b7280",
                backgroundColor: "#e5e7eb",
                borderRadius: "9999px",
                padding: "0.375rem",
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s ease",
                flexShrink: 0
              }}
            >
              <FiX style={{ fontSize: "0.875rem" }} />
            </button>
          </div>

          <div style={{
            borderRadius: "0.375rem",
            overflow: "hidden",
            position: "relative",
            maxHeight: "300px",
            display: "flex",
            justifyContent: "center",
            backgroundColor: "#f9fafb",
            border: "1px solid #e5e7eb"
          }}>
            <img
              src={previewUrl}
              alt="Preview"
              style={{
                maxWidth: "100%",
                maxHeight: "300px",
                objectFit: "contain"
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
