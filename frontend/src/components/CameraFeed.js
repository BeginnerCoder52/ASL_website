import React, { useRef, useEffect, useState, useCallback } from "react";
import Webcam from "react-webcam";

export default function CameraFeed({ onResult }) {
  const webcamRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);

  // Ref để kiểm soát tốc độ gửi request (tránh spam server)
  const lastSentRef = useRef(0);
  const intervalRef = useRef(null);

  // Hàm chụp ảnh và gửi về backend
  const captureAndPredict = useCallback(() => {
    const video = webcamRef.current?.video;

    // Chỉ gửi khi camera đã sẵn sàng và đủ thời gian delay (ví dụ 300ms - 500ms)
    if (!video || video.readyState !== 4) return;

    const now = Date.now();
    // Giới hạn gửi 3 lần/giây (300ms) để backend kịp xử lý
    if (now - lastSentRef.current < 300) return;

    lastSentRef.current = now;

    // Vẽ video hiện tại lên canvas tạm để lấy base64
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    const ctx = tempCanvas.getContext("2d");

    // Vẽ full frame (không crop) để backend nhận diện ngữ cảnh và vẽ overlay chuẩn
    ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);

    const imageBase64 = tempCanvas.toDataURL("image/jpeg", 0.7); // Nén chất lượng 0.7 cho nhẹ

    // Gửi API
    if (!process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL === "undefined") {
      return;
    }
    fetch(`${process.env.REACT_APP_BACKEND_URL}/api/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: imageBase64 }),
    })
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (data && data.label) {
          // Truyền cả label, confidence và ảnh đã vẽ (processed_image) lên App.js
          onResult(data.label, data.confidence, data.processed_image);
        }
      })
      .catch(() => {});
  }, [onResult]);

  // Thiết lập vòng lặp gửi ảnh khi camera sẵn sàng
  useEffect(() => {
    if (cameraReady) {
      intervalRef.current = setInterval(captureAndPredict, 300); // Gửi mỗi 300ms
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [cameraReady, captureAndPredict]);

  return (
    <div className="relative w-full max-w-[640px] mx-auto border-2 border-gray-500 rounded-lg overflow-hidden bg-black">
      <Webcam
        ref={webcamRef}
        audio={false}
        mirrored={true}
        className="block w-full h-auto"
        screenshotFormat="image/jpeg"
        videoConstraints={{
          width: 640,
          height: 480,
          facingMode: "user",
        }}
        onUserMedia={() => setCameraReady(true)}
      />

      {!cameraReady && (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-white bg-gray-900 z-10">
          Đang khởi động camera...
        </div>
      )}
    </div>
  );

  return (
    <div className="camera-feed-wrapper">
      {/* Thêm style display: none để ẩn camera gốc nhưng vẫn hoạt động ngầm */}
      <Webcam
        ref={webcamRef}
        audio={false}
        mirrored={true}
        screenshotFormat="image/jpeg"
        videoConstraints={{ width: 640, height: 480, facingMode: "user" }}
        onUserMedia={() => setCameraReady(true)}
        style={{ display: "none" }}
      />
    </div>
  );
}
