"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  loadModel,
  drawDetections,
  Detection,
  ModelWrapper,
  detectObjects,
  CocoClass,
} from "@/utils/detection";
import { FiLoader, FiAlertTriangle, FiCpu } from "react-icons/fi";

interface ImageDetectionProps {
  imageUrl: string;
  onModelLoaded?: (success: boolean) => void;
  onModelLoadingStatus?: (status: string) => void;
}

const styles = {
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "400px",
    padding: "2rem",
    border: "1px solid #bfdbfe",
    borderRadius: "0.5rem",
    backgroundColor: "#eff6ff",
    boxShadow: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)",
  },
  loadingIcon: {
    marginBottom: "1.5rem",
  },
  loadingSpinner: {
    animation: "spin 1s linear infinite",
    color: "#3b82f6",
  },
  loadingText: {
    fontSize: "1.125rem",
    fontWeight: 500,
    color: "#1e40af",
    textAlign: "center",
  },
  progressBar: {
    marginTop: "1rem",
    width: "12rem",
    height: "0.5rem",
    backgroundColor: "#bfdbfe",
    borderRadius: "9999px",
    overflow: "hidden",
  },
  progressBarInner: {
    height: "100%",
    backgroundColor: "#3b82f6",
    animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
    borderRadius: "9999px",
  },
  errorContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "400px",
    padding: "2rem",
    border: "1px solid #fecaca",
    borderRadius: "0.5rem",
    backgroundColor: "#fef2f2",
  },
  errorIcon: {
    color: "#ef4444",
    marginBottom: "1rem",
    fontSize: "3rem",
  },
  errorTitle: {
    fontSize: "1.25rem",
    fontWeight: 600,
    marginBottom: "0.5rem",
    color: "#b91c1c",
  },
  errorText: {
    color: "#b91c1c",
    textAlign: "center",
    maxWidth: "28rem",
  },
  reloadButton: {
    marginTop: "1.5rem",
    padding: "0.5rem 1rem",
    backgroundColor: "#ef4444",
    color: "white",
    borderRadius: "0.375rem",
    boxShadow:
      "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
    transition: "all 0.2s",
  },
  resultContainer: {
    position: "relative",
    border: "1px solid #e5e7eb",
    borderRadius: "0.5rem",
    overflow: "hidden",
    boxShadow:
      "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  },
  statusBadge: {
    position: "absolute",
    top: 0,
    left: 0,
    backgroundColor: "#2563eb",
    color: "white",
    padding: "0.5rem 0.75rem",
    fontSize: "0.875rem",
    zIndex: 10,
    borderBottomRightRadius: "0.5rem",
    boxShadow:
      "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
  },
  imageContainer: {
    position: "relative",
  },
  hiddenImage: {
    visibility: "hidden",
    position: "absolute",
    top: 0,
    left: 0,
  },
  canvas: {
    maxWidth: "100%",
    height: "auto",
  },
  detectionResults: {
    padding: "1rem",
    backgroundColor: "#f9fafb",
    borderTop: "1px solid #e5e7eb",
  },
  resultsTitle: {
    fontSize: "1.125rem",
    fontWeight: 600,
    marginBottom: "1rem",
    color: "#374151",
  },
  resultsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "0.5rem",
  },
  detectionCard: {
    display: "flex",
    alignItems: "center",
    padding: "0.5rem",
    borderRadius: "0.375rem",
    backgroundColor: "white",
    border: "1px solid #e5e7eb",
    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  },
  colorBox: {
    width: "1rem",
    height: "1rem",
    marginRight: "0.5rem",
    borderRadius: "0.25rem",
  },
  detectionInfo: {
    display: "flex",
    flexDirection: "column",
  },
  detectionClass: {
    fontWeight: 500,
  },
  detectionScore: {
    fontSize: "0.75rem",
    color: "#6b7280",
  },
  loading: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
    textAlign: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: "0.5rem",
    border: "1px solid #e5e7eb",
  },
  spinner: {
    width: "2.5rem",
    height: "2.5rem",
    border: "3px solid rgba(63, 131, 248, 0.2)",
    borderTopColor: "#3b82f6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "1rem",
  },
  error: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "1.5rem",
    backgroundColor: "#fef2f2",
    color: "#991b1b",
    borderRadius: "0.5rem",
    border: "1px solid #fecaca",
    marginBottom: "1rem",
  },
  errorMessage: {
    fontSize: "1rem",
    fontWeight: 500,
    marginBottom: "0.5rem",
    textAlign: "center",
  },
  errorDetails: {
    fontSize: "0.875rem",
    textAlign: "center",
    color: "#b91c1c",
  },
  resultContainer: {
    marginTop: "1rem",
  },
  canvasContainer: {
    position: "relative",
    width: "100%",
    overflow: "hidden",
    borderRadius: "0.5rem",
    backgroundColor: "#f9fafb",
    border: "1px solid #e5e7eb",
  },
  canvas: {
    display: "block",
    width: "100%",
    maxHeight: "70vh",
    objectFit: "contain",
  },
  resultsPanel: {
    marginTop: "1rem",
    backgroundColor: "white",
    borderRadius: "0.5rem",
    border: "1px solid #e5e7eb",
    overflow: "hidden",
  },
  resultsPanelHeader: {
    display: "flex",
    alignItems: "center",
    padding: "0.75rem 1rem",
    backgroundColor: "#f9fafb",
    borderBottom: "1px solid #e5e7eb",
  },
  resultsPanelTitle: {
    fontSize: "1rem",
    fontWeight: 600,
    color: "#4b5563",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  resultsList: {
    maxHeight: "200px",
    overflowY: "auto",
    padding: "0.5rem",
  },
  resultItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.5rem 0.75rem",
    borderRadius: "0.375rem",
    margin: "0.25rem 0",
    backgroundColor: "#f3f4f6",
    border: "1px solid #e5e7eb",
  },
  resultName: {
    fontSize: "0.875rem",
    color: "#374151",
    fontWeight: 500,
  },
  resultScore: {
    fontSize: "0.75rem",
    fontWeight: 600,
    padding: "0.25rem 0.5rem",
    borderRadius: "9999px",
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  modelInfo: {
    fontSize: "0.75rem",
    color: "#6b7280",
    marginTop: "0.5rem",
    padding: "0.5rem 0.75rem",
    backgroundColor: "#f3f4f6",
    borderRadius: "0.375rem",
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
  },
};

export default function ImageDetection({
  imageUrl,
  onModelLoaded,
  onModelLoadingStatus,
}: ImageDetectionProps) {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [model, setModel] = useState<ModelWrapper | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>(
    "Đang tải mô hình..."
  );
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [results, setResults] = useState<CocoClass[]>([]);
  const [modelDetails, setModelDetails] = useState<string | null>(null);

  // Theo dõi trạng thái tải mô hình
  useEffect(() => {
    if (onModelLoadingStatus) {
      onModelLoadingStatus(loadingMessage);
    }
  }, [loadingMessage, onModelLoadingStatus]);

  // Tải mô hình khi component được tạo
  useEffect(() => {
    async function initModel() {
      try {
        setLoadingMessage("Đang tải mô hình YOLOv8n...");

        // Bắt đầu theo dõi console.log để cập nhật trạng thái
        const originalConsoleLog = console.log;
        console.log = (message: any, ...args: any[]) => {
          originalConsoleLog(message, ...args);
          if (typeof message === "string") {
            setLoadingMessage(message);
          }
        };

        const loadedModel = await loadModel();
        setModel(loadedModel);
        setLoading(false);
        setLoadingMessage(
          `Đã tải mô hình ${loadedModel.type.toUpperCase()} thành công!`
        );

        // Khôi phục console.log
        console.log = originalConsoleLog;

        if (onModelLoaded) {
          onModelLoaded(true);
        }
      } catch (err) {
        console.error("Lỗi khi tải mô hình:", err);
        setError(`Không thể tải mô hình: ${err.message}`);
        setLoading(false);
        setLoadingMessage("Không thể tải mô hình. Vui lòng thử lại sau.");

        if (onModelLoaded) {
          onModelLoaded(false);
        }
      }
    }

    initModel();
  }, [onModelLoaded]);

  // Xử lý khi ảnh được tải
  useEffect(() => {
    if (!model || !imageUrl) return;

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = imageUrl;

    image.onload = async () => {
      try {
        if (imageRef.current) {
          imageRef.current.src = imageUrl;
          imageRef.current.width = image.width;
          imageRef.current.height = image.height;
        }

        if (canvasRef.current) {
          canvasRef.current.width = image.width;
          canvasRef.current.height = image.height;

          const ctx = canvasRef.current.getContext("2d");
          if (!ctx) return;

          // Vẽ ảnh lên canvas để lấy ImageData
          ctx.drawImage(image, 0, 0);
          const imageData = ctx.getImageData(
            0,
            0,
            canvasRef.current.width,
            canvasRef.current.height
          );

          // Dự đoán các đối tượng
          setLoadingMessage("Đang phát hiện đối tượng...");
          setLoading(true);

          const results = await model.detect(imageData);
          setDetections(results);
          setLoadingMessage(`Đã phát hiện ${results.length} đối tượng.`);
          setLoading(false);

          // Vẽ kết quả lên canvas
          drawDetections(ctx, results);
        }
      } catch (err) {
        console.error("Lỗi khi phát hiện đối tượng:", err);
        setError(`Lỗi khi phát hiện đối tượng: ${err.message}`);
        setLoadingMessage("Lỗi khi phát hiện đối tượng.");
        setLoading(false);
      }
    };

    image.onerror = () => {
      setError("Không thể tải ảnh. Vui lòng kiểm tra đường dẫn và thử lại.");
      setLoadingMessage("Lỗi khi tải ảnh.");
      setLoading(false);
    };
  }, [model, imageUrl]);

  useEffect(() => {
    let isMounted = true;
    let startTime: number;

    const loadAndDetect = async () => {
      if (!isMounted) return;

      try {
        setLoading(true);
        setError(null);
        setResults([]);

        if (onModelLoadingStatus) {
          onModelLoadingStatus("Đang tải mô hình...");
        }

        startTime = Date.now();
        const modelData = await loadModel();

        // Kiểm tra model có tồn tại và có đúng định dạng không
        if (!modelData || typeof modelData !== "object" || !modelData.type) {
          throw new Error("Model không đúng định dạng");
        }

        console.log("Model đã tải:", modelData);
        console.log("Loại model:", modelData.type);

        if (onModelLoaded) {
          onModelLoaded(true);
        }

        const loadTime = ((Date.now() - startTime) / 1000).toFixed(2);
        const modelName = modelData.type === "onnx" ? "YOLOv8" : "COCO-SSD";
        const modelSource =
          modelData.type === "onnx" ? "ONNX" : "TensorFlow.js";

        if (!isMounted) return;

        // Thiết lập thông tin mô hình
        setModelDetails(
          `Mô hình: ${modelName} (${modelSource}) - Thời gian tải: ${loadTime}s`
        );

        if (onModelLoadingStatus) {
          onModelLoadingStatus("Đang xử lý ảnh...");
        }

        // Tạo đối tượng Image
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.src = imageUrl;
        image.onload = async () => {
          if (!isMounted) return;

          try {
            // Thực hiện nhận diện đối tượng
            startTime = Date.now();
            console.log("Bắt đầu nhận diện đối tượng với model:", modelData);
            const detectedObjects = await detectObjects(modelData, image);
            const detectTime = ((Date.now() - startTime) / 1000).toFixed(2);

            if (!isMounted) return;

            // Cập nhật thông tin mô hình với thời gian nhận diện
            setModelDetails(
              `Mô hình: ${modelName} (${modelSource}) - Thời gian tải: ${loadTime}s - Thời gian nhận diện: ${detectTime}s`
            );

            console.log("Đã phát hiện các đối tượng:", detectedObjects);

            // Vẽ kết quả lên canvas
            if (canvasRef.current) {
              const canvas = canvasRef.current;
              const ctx = canvas.getContext("2d");

              if (ctx) {
                // Thiết lập kích thước canvas
                canvas.width = image.width;
                canvas.height = image.height;

                // Vẽ ảnh nền
                ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

                // Vẽ bounding box cho mỗi đối tượng
                detectedObjects.forEach((obj) => {
                  const [x, y, width, height] = obj.bbox;

                  // Vẽ bounding box
                  ctx.strokeStyle = "#22c55e";
                  ctx.lineWidth = Math.max(
                    Math.min(canvas.width, canvas.height) / 100,
                    2
                  );
                  ctx.strokeRect(x, y, width, height);

                  // Vẽ nhãn
                  ctx.fillStyle = "#16a34a";
                  const textWidth = ctx.measureText(
                    `${obj.class} ${Math.round(obj.score * 100)}%`
                  ).width;
                  const textHeight = 20;
                  ctx.fillRect(
                    x,
                    y - textHeight - 5,
                    textWidth + 10,
                    textHeight + 5
                  );

                  // Vẽ tên lớp và độ chính xác
                  ctx.font = "bold 16px Arial";
                  ctx.fillStyle = "white";
                  ctx.fillText(
                    `${obj.class} ${Math.round(obj.score * 100)}%`,
                    x + 5,
                    y - 5
                  );
                });

                // Cập nhật kết quả
                setResults(detectedObjects);
              }
            }

            setLoading(false);
            if (onModelLoadingStatus) {
              onModelLoadingStatus(
                `Đã phát hiện ${detectedObjects.length} đối tượng`
              );
            }
          } catch (detectionError) {
            console.error("Lỗi khi phát hiện đối tượng:", detectionError);
            setError("Lỗi khi phát hiện đối tượng: " + detectionError.message);
            setLoading(false);
          }
        };

        image.onerror = () => {
          if (!isMounted) return;
          setLoading(false);
          setError("Không thể tải ảnh. Vui lòng thử lại.");
          if (onModelLoaded) {
            onModelLoaded(false);
          }
        };
      } catch (err) {
        if (!isMounted) return;
        setLoading(false);
        setError(
          err instanceof Error
            ? err.message
            : "Lỗi không xác định khi tải mô hình"
        );
        if (onModelLoaded) {
          onModelLoaded(false);
        }
      }
    };

    loadAndDetect();

    return () => {
      isMounted = false;
    };
  }, [imageUrl, onModelLoadingStatus, onModelLoaded]);

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <div style={styles.loadingText}>Đang xử lý, vui lòng chờ...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.error}>
        <FiAlertTriangle style={styles.errorIcon} />
        <div style={styles.errorMessage}>Lỗi khi xử lý ảnh</div>
        <div style={styles.errorDetails}>{error}</div>
      </div>
    );
  }

  return (
    <div style={styles.resultContainer}>
      <div style={styles.canvasContainer}>
        <canvas ref={canvasRef} style={styles.canvas} />
      </div>

      {results.length > 0 && (
        <div style={styles.resultsPanel}>
          <div style={styles.resultsPanelHeader}>
            <div style={styles.resultsPanelTitle}>
              <FiCpu />
              <span>Kết quả nhận diện ({results.length} đối tượng)</span>
            </div>
          </div>

          <div style={styles.resultsList}>
            {results.map((result, idx) => (
              <div key={idx} style={styles.resultItem}>
                <div style={styles.resultName}>{result.class}</div>
                <div style={styles.resultScore}>
                  {Math.round(result.score * 100)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {modelDetails && (
        <div style={styles.modelInfo}>
          <FiCpu size={12} />
          <span>{modelDetails}</span>
        </div>
      )}
    </div>
  );
}
