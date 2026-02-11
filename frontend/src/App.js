import React, { useState, useEffect, useRef } from "react";
import CameraFeed from "./components/CameraFeed";
import PredictionDisplay from "./components/PredictionDisplay";
import "./App.css";

// Bộ từ điển để chơi
const WORD_LIST = [
  "HELLO",
  "WORLD",
  "AI CODE",
  "REACT JS",
  "COMPUTER",
  "VISION",
  "OPEN CV",
  "GOOD LUCK",
];

export default function App() {
  // --- STATE QUẢN LÝ GAME ---
  const [targetPhrase, setTargetPhrase] = useState(""); // Cụm từ cần đoán (VD: "HELLO")
  const [currentIndex, setCurrentIndex] = useState(0); // Đang đoán đến chữ cái thứ mấy
  const [isCompleted, setIsCompleted] = useState(false); // Đã hoàn thành cả từ chưa

  // --- STATE HIỂN THỊ ---
  const [currentPrediction, setCurrentPrediction] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [holdProgress, setHoldProgress] = useState(0); // % giữ tay (0 -> 100%)
  const [aiImage, setAiImage] = useState(null);

  // --- REFS (Để xử lý logic thời gian thực không gây re-render liên tục) ---
  const holdStartRef = useRef(null); // Thời điểm bắt đầu giữ đúng tay
  const lastProcessedTimeRef = useRef(0);

  // Hàm random từ mới
  const startNewGame = () => {
    const randomWord = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
    setTargetPhrase(randomWord);
    setCurrentIndex(0);
    setIsCompleted(false);
    setHoldProgress(0);
    holdStartRef.current = null;
  };

  // Khởi tạo game lần đầu
  useEffect(() => {
    startNewGame();
  }, []);

  // --- XỬ LÝ KẾT QUẢ TỪ CAMERA ---
  const handleResult = (predictedLabel, conf, processedImage) => {
    // 1. Cập nhật hình ảnh và thông số cơ bản
    setAiImage(processedImage);
    setCurrentPrediction(predictedLabel);
    setConfidence(conf);

    if (isCompleted) return; // Nếu thắng rồi thì không check nữa

    // 2. Lấy chữ cái mục tiêu hiện tại
    const targetChar = targetPhrase[currentIndex];

    // 3. Logic so sánh:
    // - Nếu target là dấu cách " ", model phải trả về 'space'
    // - Nếu target là chữ thường, model phải trả về đúng chữ đó
    let isMatch = false;
    if (targetChar === " ") {
      isMatch = predictedLabel === "space";
    } else {
      isMatch = predictedLabel === targetChar;
    }

    // 4. Logic giữ 2 giây (2000ms)
    const now = Date.now();

    if (isMatch && conf > 0.7) {
      // Độ tin cậy > 70% mới tính
      if (holdStartRef.current === null) {
        // Bắt đầu đếm giờ
        holdStartRef.current = now;
      } else {
        // Đang giữ -> Tính tiến độ
        const holdTime = now - holdStartRef.current;
        const progress = Math.min((holdTime / 2000) * 100, 100);
        setHoldProgress(progress);

        // Nếu giữ đủ 2 giây -> DONE CHỮ CÁI NÀY
        if (holdTime >= 2000) {
          handleCorrectLetter();
        }
      }
    } else {
      // Nếu sai hoặc bỏ tay ra -> Reset tiến độ
      holdStartRef.current = null;
      setHoldProgress(0);
    }
  };

  const handleCorrectLetter = () => {
    // Reset bộ đếm
    holdStartRef.current = null;
    setHoldProgress(0);

    // Chuyển sang chữ tiếp theo
    if (currentIndex < targetPhrase.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Đã xong chữ cuối cùng -> THẮNG
      setIsCompleted(true);
      setTimeout(() => {
        // Tự động qua từ mới sau 3 giây
        startNewGame();
      }, 3000);
    }
  };

  // Lấy URL ảnh ví dụ cho chữ cái đang cần đoán
  const getCurrentExampleUrl = () => {
    if (isCompleted) return "";
    const char = targetPhrase[currentIndex];
    if (char === " ") return "http://localhost:5000/api/example/space";
    return `http://localhost:5000/api/example/${char}`;
  };

  return (
    <div className="App">
      <header className="main-header">
        <h1 className="logo-text">
          ASL <span className="highlight">MASTER</span>
        </h1>
      </header>

      <div
        className="main-display-area"
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "20px",
          flexWrap: "wrap",
        }}
      >
        {/* Camera Feed */}
        <div className="camera-container">
          <CameraFeed onResult={handleResult} />
        </div>

        {/* AI View (Hiển thị ảnh backend trả về) */}
        <div
          className="ai-view-container"
          style={{
            position: "relative",
            width: "640px",
            height: "480px",
            backgroundColor: "#000",
            borderRadius: "12px",
            overflow: "hidden",
            border: "2px solid #00ff00",
          }}
        >
          {aiImage ? (
            <img
              src={aiImage}
              alt="AI Processed"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                transform: "scaleX(-1)",
              }}
            />
          ) : (
            <div
              style={{
                color: "white",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }}
            >
              Initializing AI...
            </div>
          )}

          {/* Hiển thị thanh Progress Bar khi đang giữ đúng */}
          {holdProgress > 0 && !isCompleted && (
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                height: "10px",
                width: `${holdProgress}%`,
                backgroundColor: "#00ff00",
                transition: "width 0.1s linear",
                zIndex: 20,
              }}
            />
          )}
        </div>
      </div>

      {/* Phần hiển thị bài tập */}
      <PredictionDisplay
        targetPhrase={targetPhrase}
        currentIndex={currentIndex}
        isCompleted={isCompleted}
        currentPrediction={currentPrediction}
        exampleUrl={getCurrentExampleUrl()}
        onSkip={startNewGame}
      />
    </div>
  );
}
