import React, { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";

export default function VideoTile({
  stream,
  isLocal,
  name,
  isAslOn,
  isCamOn = true,
  isMicOn = false, // <-- Thêm isMicOn
  onAslResult,
  subtitle,
  holdProgress = 0,
  deviceId,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [mediaStream, setMediaStream] = useState(null); // Lưu trữ luồng gốc có chứa Audio
  const mediaStreamRef = useRef(null); // Track stream để cleanup khi unmount
  const streamRef = useRef(stream); // Ổn định callback stream tránh re-render loop

  // Xử lý luồng của người khác
  useEffect(() => {
    if (!isLocal && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, isLocal]);

  // Xử lý vẽ AI và Canvas
  useEffect(() => {
    if (!isLocal) return;
    const video = videoRef.current?.video;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    let errorCount = 0;
    let interval = setInterval(() => {
      if (video.readyState !== 4) return;
      const ctx = canvas.getContext("2d");

      if (!isCamOn) {
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        return;
      }
      if (!isAslOn) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return;
      }

      if (errorCount > 20) return; // Dừng hẳn nếu server lỗi liên tục
      if (!process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL === "undefined") {
        if (errorCount === 0) console.warn("⚠️ REACT_APP_BACKEND_URL chưa được cấu hình! Vào Vercel Dashboard → Environment Variables để thêm.");
        errorCount++; return;
      }

      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = video.videoWidth;
      tempCanvas.height = video.videoHeight;
      tempCanvas.getContext("2d").drawImage(video, 0, 0);

      fetch(`${process.env.REACT_APP_BACKEND_URL}/api/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: tempCanvas.toDataURL("image/jpeg", 0.6),
        }),
      })
        .then((res) => {
          if (!res.ok) { errorCount++; return null; }
          errorCount = 0;
          return res.json();
        })
        .then((data) => {
          if (!data) return;
          if (data.processed_image) {
            const img = new Image();
            img.onload = () =>
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            img.src = data.processed_image;
          }
          if (data.label && onAslResult)
            onAslResult(data.label, data.confidence);
        })
        .catch(() => errorCount++);
    }, 300);

    return () => clearInterval(interval);
  }, [isLocal, isAslOn, isCamOn, onAslResult]);

  // Ổn định callback stream để tránh re-run effect mỗi lần render
  useEffect(() => {
    streamRef.current = stream;
  });

  // GHÉP HÌNH TỪ CANVAS VÀ TIẾNG TỪ MICRO
  useEffect(() => {
    if (isLocal && streamRef.current && canvasRef.current && mediaStream) {
      const canvasStream = canvasRef.current.captureStream(30); // Chỉ có hình
      const audioTracks = mediaStream.getAudioTracks(); // Lấy tiếng

      if (audioTracks.length > 0) {
        canvasStream.addTrack(audioTracks[0]); // Ghép vào làm 1
      }
      streamRef.current(canvasStream); // Đẩy cho PeerJS gửi đi

      return () => {
        canvasStream.getTracks().forEach((t) => t.stop());
      };
    }
  }, [isLocal, mediaStream]);

  // Track stream để cleanup khi unmount
  useEffect(() => {
    mediaStreamRef.current = mediaStream;
  }, [mediaStream]);

  // Dọn dẹp mediaStream khi component unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // ĐỒNG BỘ NÚT TẮT/MỞ MIC VỚI ĐƯỜNG TRUYỀN
  useEffect(() => {
    if (isLocal && mediaStream) {
      mediaStream.getAudioTracks().forEach((track) => {
        track.enabled = isMicOn; // Tắt/Mở truyền âm thanh sang máy khác
      });
    }
  }, [isLocal, isMicOn, mediaStream]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "4/3",
        background: "#1e293b",
        borderRadius: "12px",
        overflow: "hidden",
        border: isLocal ? "3px solid #00ffea" : "2px solid #334155",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          background: "rgba(0,0,0,0.7)",
          color: "white",
          padding: "4px 10px",
          borderRadius: "6px",
          zIndex: 10,
          fontSize: "14px",
        }}
      >
        {name} {isLocal ? "(Bạn)" : ""} {isLocal && !isMicOn && " 🔇"}
      </div>

      {isLocal ? (
        <>
          <Webcam
            key={`cam-${isCamOn}-${deviceId}`} // Force remount khi toggle camera
            ref={videoRef}
            audio={true}
            muted={true}
            onUserMedia={(s) => setMediaStream(s)}
            style={{ display: "none" }}
            videoConstraints={isCamOn ? {
              deviceId: deviceId ? { exact: deviceId } : undefined,
              facingMode: "user",
            } : false}
          />
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: "scaleX(-1)",
            }}
          />
        </>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: "scaleX(-1)",
          }}
        />
      )}

      {!isCamOn && isLocal && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: "3rem",
          }}
        >
          🚫
        </div>
      )}

      {subtitle && (
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(0,0,0,0.8)",
            padding: "8px 20px",
            borderRadius: "20px",
            fontSize: isLocal ? "22px" : "16px",
            fontWeight: "bold",
            width: "max-content",
            maxWidth: "90%",
            textAlign: "center",
            zIndex: 10,
          }}
        >
          {subtitle}
        </div>
      )}

      {isLocal && holdProgress > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            height: "8px",
            width: `${holdProgress}%`,
            backgroundColor: "#00ffea",
            transition: "width 0.1s linear",
            zIndex: 20,
          }}
        />
      )}
    </div>
  );
}
