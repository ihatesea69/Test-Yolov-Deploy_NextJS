"use client";

import { useState, useCallback } from "react";
import { UploadDropzone } from "@/components/UploadDropzone";
import ImageDetection from "@/components/ImageDetection";
import {
  FiAlertCircle,
  FiCheck,
  FiUpload,
  FiImage,
  FiCpu,
} from "react-icons/fi";
import Script from "next/script";

export default function Home() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [modelStatus, setModelStatus] = useState<string>(
    "Đang khởi tạo ứng dụng..."
  );
  const [modelLoaded, setModelLoaded] = useState<boolean | null>(null);
  const [tensorflowLoaded, setTensorflowLoaded] = useState(false);

  const handleImageUpload = useCallback((url: string) => {
    setImageUrl(url);
  }, []);

  const handleModelLoadingStatus = useCallback((status: string) => {
    setModelStatus(status);
  }, []);

  const handleModelLoaded = useCallback((success: boolean) => {
    setModelLoaded(success);
  }, []);

  const getStatusStyle = () => {
    const base = {
      display: "flex",
      alignItems: "center",
      padding: "12px 16px", 
      borderRadius: "8px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)",
      border: "1px solid",
    };

    if (modelLoaded === true) {
      return {
        ...base,
        backgroundColor: "#ecfdf5",
        color: "#065f46",
        borderColor: "#a7f3d0",
      };
    } else if (modelLoaded === false) {
      return {
        ...base,
        backgroundColor: "#fef2f2",
        color: "#991b1b", 
        borderColor: "#fecaca",
      };
    }
    
    return {
      ...base,
      backgroundColor: "#eff6ff",
      color: "#1e40af",
      borderColor: "#bfdbfe",
    };
  };

  return (
    <main style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "1rem",
      background: "linear-gradient(to bottom, #ebf5ff, #ffffff)"
    }}>
      {/* Tải TensorFlow.js và WebGL backend */}
      <Script
        src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.17.0/dist/tf.min.js"
        strategy="beforeInteractive"
        onLoad={() => {
          console.log("TensorFlow.js đã được tải");
          setTensorflowLoaded(true);
          setModelStatus("Đã tải TensorFlow.js, đang chuẩn bị mô hình...");
        }}
        onError={(e) => {
          console.error("Lỗi khi tải TensorFlow.js:", e);
          setModelStatus("Lỗi tải TensorFlow.js");
          setModelLoaded(false);
        }}
      />

      {/* Tải WebGL backend */}
      <Script
        src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-webgl@4.17.0/dist/tf-backend-webgl.min.js"
        strategy="beforeInteractive"
        onLoad={() => {
          console.log("TensorFlow.js WebGL backend đã được tải");
          setModelStatus(
            "Đã tải TensorFlow.js WebGL, đang chuẩn bị mô hình..."
          );
        }}
        onError={(e) => console.error("Lỗi khi tải WebGL backend:", e)}
      />

      <div style={{ 
        width: "100%", 
        maxWidth: "64rem", 
        fontSize: "0.875rem",
        display: "flex",
        flexDirection: "column"
      }}>
        <div style={{ marginBottom: "2rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "2.25rem", fontWeight: 700, marginBottom: "1rem", color: "#1d4ed8" }}>
            <FiCpu style={{ display: "inline-block", marginRight: "0.5rem", marginBottom: "0.25rem" }} />
            YOLOv8 - Nhận diện đối tượng
          </h1>
          <p style={{ fontSize: "1.125rem", marginBottom: "1rem", color: "#4b5563" }}>
            Tải lên ảnh để nhận diện các đối tượng với mô hình YOLOv8 hoặc
            COCO-SSD
          </p>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginTop: "1rem" }}>
            <div style={getStatusStyle()}>
              {modelLoaded === true ? (
                <FiCheck style={{ marginRight: "0.5rem", fontSize: "1.25rem" }} />
              ) : modelLoaded === false ? (
                <FiAlertCircle style={{ marginRight: "0.5rem", fontSize: "1.25rem", color: "#ef4444" }} />
              ) : (
                <div style={{ 
                  width: "1.25rem", 
                  height: "1.25rem", 
                  borderRadius: "50%",
                  border: "2px solid #3b82f6",
                  borderTopColor: "transparent",
                  animation: "spin 1s linear infinite",
                  marginRight: "0.5rem"
                }}></div>
              )}
              <span style={{ fontSize: "1rem" }}>{modelStatus}</span>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gap: "2rem" }}>
          <div style={{ 
            backgroundColor: "white",
            borderRadius: "0.5rem", 
            boxShadow: "0 4px 6px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.08)",
            overflow: "hidden",
            border: "1px solid #e5e7eb",
            marginBottom: "2rem"
          }}>
            <div style={{
              padding: "1rem",
              borderBottom: "1px solid #e5e7eb",
              background: "linear-gradient(to right, #f0f7ff, white)"
            }}>
              <h2 style={{ 
                fontSize: "1.25rem", 
                fontWeight: 600, 
                color: "#1d4ed8", 
                display: "flex", 
                alignItems: "center" 
              }}>
                <FiUpload style={{ marginRight: "0.5rem" }} />
                Tải lên ảnh
              </h2>
            </div>
            <div style={{ padding: "1.5rem" }}>
              <UploadDropzone onImageUpload={handleImageUpload} />
            </div>
          </div>

          {imageUrl && (
            <div style={{ 
              backgroundColor: "white",
              borderRadius: "0.5rem", 
              boxShadow: "0 4px 6px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.08)",
              overflow: "hidden",
              border: "1px solid #e5e7eb",
              marginBottom: "2rem"
            }}>
              <div style={{
                padding: "1rem",
                borderBottom: "1px solid #e5e7eb",
                background: "linear-gradient(to right, #f0f7ff, white)"
              }}>
                <h2 style={{ 
                  fontSize: "1.25rem", 
                  fontWeight: 600, 
                  color: "#1d4ed8", 
                  display: "flex", 
                  alignItems: "center" 
                }}>
                  <FiImage style={{ marginRight: "0.5rem" }} />
                  Kết quả nhận diện
                </h2>
              </div>
              <div style={{ padding: "1.5rem" }}>
                <ImageDetection
                  imageUrl={imageUrl}
                  onModelLoadingStatus={handleModelLoadingStatus}
                  onModelLoaded={handleModelLoaded}
                />
              </div>
            </div>
          )}
        </div>

        <footer style={{
          marginTop: "3rem",
          textAlign: "center",
          color: "#6b7280",
          fontSize: "0.875rem",
          padding: "1rem 0",
          borderTop: "1px solid #e5e7eb"
        }}>
          <p>
            Demo nhận diện đối tượng sử dụng YOLOv8 ONNX hoặc COCO-SSD
            TensorFlow.js
          </p>
        </footer>
      </div>
    </main>
  );
}
