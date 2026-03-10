import React, { useState, useEffect, useRef } from "react";
import CameraFeed from "./components/CameraFeed";
import PredictionDisplay from "./components/PredictionDisplay";
import Subtitle from "./components/Subtitle"; // Component mới
import Whiteboard from "./components/Whiteboard"; // Component mới
import "./App.css";

// Cập nhật danh sách từ vựng (thêm số nếu muốn game đoán số)
const WORD_LIST = [
  "HELLO",
  "HELP",
  "RIGHT",
  "THANKS",
  "WORLD",
  "AI CODE",
  "ASL 2026",
  "GOOD LUCK",
];

export default function App() {
  // --- STATE QUẢN LÝ ---
  const [mode, setMode] = useState("game"); // 'game', 'free'
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(false);

  // State Game
  const [targetPhrase, setTargetPhrase] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // State AI & Display
  const [currentPrediction, setCurrentPrediction] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [holdProgress, setHoldProgress] = useState(0);
  const [aiImage, setAiImage] = useState(null);
  const [subtitle, setSubtitle] = useState("");

  const holdStartRef = useRef(null);

  const startNewGame = () => {
    const randomWord = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
    setTargetPhrase(randomWord);
    setCurrentIndex(0);
    setIsCompleted(false);
    setHoldProgress(0);
    holdStartRef.current = null;
  };

  useEffect(() => {
    startNewGame();
  }, []);

  const handleResult = (predictedLabel, conf, processedImage) => {
    setAiImage(processedImage);
    setCurrentPrediction(predictedLabel);
    setConfidence(conf);

    // Nếu không ở chế độ game thì không xử lý logic game
    if (mode !== "game") return;
    if (isCompleted) return;

    const targetChar = targetPhrase[currentIndex];
    let isMatch = false;

    // Logic so sánh (Hỗ trợ space)
    if (targetChar === " ") {
      isMatch = predictedLabel === "space";
    } else {
      isMatch = predictedLabel === targetChar;
    }

    const now = Date.now();
    if (isMatch && conf > 0.8) {
      if (holdStartRef.current === null) {
        holdStartRef.current = now;
      } else {
        const holdTime = now - holdStartRef.current;
        const progress = Math.min((holdTime / 2000) * 100, 100);
        setHoldProgress(progress);

        if (holdTime >= 2000) {
          handleCorrectLetter(targetChar);
        }
      }
    } else {
      holdStartRef.current = null;
      setHoldProgress(0);
    }
  };

  const handleCorrectLetter = (char) => {
    holdStartRef.current = null;
    setHoldProgress(0);
    setSubtitle((prev) => prev + char);

    if (currentIndex < targetPhrase.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
      setTimeout(() => {
        setSubtitle((prev) => prev + " ");
        startNewGame();
      }, 3000);
    }
  };

  const getCurrentExampleUrl = () => {
    if (isCompleted) return "";
    const char = targetPhrase[currentIndex];
    if (char === " ") return "http://localhost:5000/api/example/space";
    return `http://localhost:5000/api/example/${char}`;
  };

  return (
    <div className="App">
      <header
        className="main-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 40px",
        }}
      >
        <h1 className="logo-text">
          ASL <span className="highlight">MASTERCLASS</span>
        </h1>

        {/* THANH CÔNG CỤ (Toolbar) */}
        <div className="toolbar" style={{ display: "flex", gap: "15px" }}>
          <button
            className={`tool-btn ${mode === "game" ? "active" : ""}`}
            onClick={() => setMode(mode === "game" ? "free" : "game")}
          >
            {mode === "game" ? "🎮 Game Mode: ON" : "🎮 Game Mode: OFF"}
          </button>

          <button
            className={`tool-btn ${isSpeechEnabled ? "active" : ""}`}
            onClick={() => setIsSpeechEnabled(!isSpeechEnabled)}
          >
            {isSpeechEnabled ? "🎙️ Speech: ON" : "🎙️ Speech: OFF"}
          </button>

          <button className="tool-btn" onClick={() => setShowWhiteboard(true)}>
            📝 Whiteboard
          </button>
        </div>
      </header>

      {/* --- MÀN HÌNH CHÍNH (SINGLE CAMERA) --- */}
      <div
        className="main-stage"
        style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}
      >
        {/* Component CameraFeed chạy ngầm để lấy ảnh */}
        <CameraFeed onResult={handleResult} />

        {/* AI VIEW - Màn hình chính */}
        <div
          className="ai-screen"
          style={{
            position: "relative",
            width: "800px",
            height: "600px",
            backgroundColor: "#000",
            borderRadius: "15px",
            border: "3px solid #00ffea",
            boxShadow: "0 0 20px rgba(0, 255, 234, 0.3)",
            overflow: "hidden",
          }}
        >
          {aiImage ? (
            <img
              src={aiImage}
              alt="ASL AI"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                transform: "scaleX(-1)",
              }}
            />
          ) : (
            <div className="loading-text">Initializing AI Vision...</div>
          )}

          {/* Thanh Progress Bar khi chơi game */}
          {mode === "game" && holdProgress > 0 && !isCompleted && (
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

      {/* --- GAME DISPLAY SECTION --- */}
      {mode === "game" && (
        <div style={{ marginTop: "20px" }}>
          {/* Thanh Phụ đề Game */}
          <div
            className="subtitle-bar"
            style={{
              backgroundColor: "rgba(0,0,0,0.8)",
              color: "#fff",
              padding: "10px 30px",
              borderRadius: "50px",
              margin: "0 auto 20px auto",
              maxWidth: "600px",
              fontSize: "28px",
              textAlign: "center",
              border: "1px solid #555",
            }}
          >
            {subtitle || (
              <span style={{ color: "#666", fontSize: "20px" }}>
                Predict correct letters to build words...
              </span>
            )}
          </div>

          <PredictionDisplay
            targetPhrase={targetPhrase}
            currentIndex={currentIndex}
            isCompleted={isCompleted}
            currentPrediction={currentPrediction}
            exampleUrl={getCurrentExampleUrl()}
            onSkip={startNewGame}
          />
        </div>
      )}

      {/* --- TÍNH NĂNG PHỤ TRỢ --- */}

      {/* 1. Speech Subtitle (Giáo viên nói) */}
      {isSpeechEnabled && <Subtitle isListening={isSpeechEnabled} />}

      {/* 2. Whiteboard Overlay */}
      {showWhiteboard && (
        <Whiteboard onClose={() => setShowWhiteboard(false)} />
      )}
    </div>
  );
}
