import React, { useRef, useEffect, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { Hands } from "@mediapipe/hands";
import * as cam from "@mediapipe/camera_utils";

export default function CameraFeed({ onResult }) {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);
  const requestRef = useRef();
  const handsRef = useRef(null);

  // Cấu hình gửi request về backend (giới hạn tốc độ để không lag)
  const lastSentRef = useRef(0);

  const onResults = useCallback(
    (results) => {
      const canvas = canvasRef.current;
      const video = webcamRef.current?.video;

      if (!canvas || !video || !results) return;

      const ctx = canvas.getContext("2d");
      const { width, height } = canvas;

      // 1. Xóa canvas cũ
      ctx.clearRect(0, 0, width, height);

      // 2. Vẽ landmark (khung xương tay)
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        for (const landmarks of results.multiHandLandmarks) {
          drawConnectors(ctx, landmarks, width, height);
          drawLandmarks(ctx, landmarks, width, height);

          // 3. Gửi ảnh về backend để nhận diện
          // Chỉ gửi khi tìm thấy tay và cách lần trước 300ms (tránh spam server)
          const now = Date.now();
          if (now - lastSentRef.current > 300) {
            lastSentRef.current = now;
            captureAndPredict(video, landmarks, width, height);
          }
        }
      }
    },
    [onResult]
  );

  // Hàm cắt ảnh tay và gửi đi
  const captureAndPredict = (video, landmarks, width, height) => {
    // Tìm vùng bao quanh bàn tay (Bounding Box)
    let minX = width,
      minY = height,
      maxX = 0,
      maxY = 0;
    landmarks.forEach((lm) => {
      const x = lm.x * width;
      const y = lm.y * height;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    });

    // Thêm padding (lề) để không cắt sát quá
    const padding = 40;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(width, maxX + padding);
    maxY = Math.min(height, maxY + padding);
    const w = maxX - minX;
    const h = maxY - minY;

    // Vẽ phần tay lên canvas tạm
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = 64; // Resize luôn về 64x64 cho nhẹ
    tempCanvas.height = 64;
    const tCtx = tempCanvas.getContext("2d");

    // Cắt từ video gốc
    tCtx.drawImage(video, minX, minY, w, h, 0, 0, 64, 64);

    const imageBase64 = tempCanvas.toDataURL("image/jpeg", 0.8);

    // Gửi API
    fetch("http://localhost:5000/api/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: imageBase64 }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.label) {
          onResult(data.label, data.confidence);
        }
      })
      .catch((err) => console.error(err));
  };

  // Hàm vẽ đường nối
  const drawConnectors = (ctx, landmarks, w, h) => {
    const connections = [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [0, 5],
      [5, 6],
      [6, 7],
      [7, 8],
      [5, 9],
      [9, 10],
      [10, 11],
      [11, 12],
      [9, 13],
      [13, 14],
      [14, 15],
      [15, 16],
      [13, 17],
      [17, 18],
      [18, 19],
      [19, 20],
      [0, 17],
    ];
    ctx.strokeStyle = "#00FF00";
    ctx.lineWidth = 2;
    connections.forEach(([i, j]) => {
      const p1 = landmarks[i];
      const p2 = landmarks[j];
      ctx.beginPath();
      ctx.moveTo(p1.x * w, p1.y * h);
      ctx.lineTo(p2.x * w, p2.y * h);
      ctx.stroke();
    });
  };

  const drawLandmarks = (ctx, landmarks, w, h) => {
    ctx.fillStyle = "#FF0000";
    landmarks.forEach((lm) => {
      ctx.beginPath();
      ctx.arc(lm.x * w, lm.y * h, 4, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  // Khởi tạo MediaPipe Hands
  useEffect(() => {
    const hands = new Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });
    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.6,
    });
    hands.onResults(onResults);
    handsRef.current = hands;
  }, [onResults]);

  // Loop xử lý từng frame
  const handleVideoFrame = async () => {
    if (
      webcamRef.current &&
      webcamRef.current.video &&
      webcamRef.current.video.readyState === 4 &&
      handsRef.current
    ) {
      const video = webcamRef.current.video;
      const { videoWidth, videoHeight } = video;

      // Set size canvas bằng size video
      if (canvasRef.current.width !== videoWidth) {
        canvasRef.current.width = videoWidth;
        canvasRef.current.height = videoHeight;
      }

      await handsRef.current.send({ image: video });
    }
    requestRef.current = requestAnimationFrame(handleVideoFrame);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(handleVideoFrame);
    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  return (
    <div className="relative w-full max-w-[720px] mx-auto border-2 border-blue-500 rounded-lg overflow-hidden bg-black shadow-[0_0_20px_rgba(0,200,255,0.3)]">
      {/* 1. Webcam gốc (ẩn hoặc hiện tùy ý, ở đây mình hiện để debug nhưng đè canvas lên) */}
      <Webcam
        ref={webcamRef}
        audio={false}
        mirrored={true} // Lật gương để tự nhiên hơn
        className="block w-full h-auto"
        screenshotFormat="image/jpeg"
        videoConstraints={{
          width: 720,
          height: 540,
          facingMode: "user",
        }}
        onUserMedia={() => setCameraReady(true)}
      />

      {/* 2. Canvas vẽ khung xương (nằm đè lên video) */}
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none transform -scale-x-100" // CSS lật ngược canvas khớp với video mirrored
        style={{ transform: "scaleX(-1)" }}
      />

      {!cameraReady && (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-white">
          Đang khởi động camera...
        </div>
      )}
    </div>
  );
}
