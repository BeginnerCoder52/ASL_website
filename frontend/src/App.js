import React, { useState, useEffect, useRef } from "react";
import CameraFeed from "./components/CameraFeed";
import PredictionDisplay from "./components/PredictionDisplay";
import "./App.css";

const ALL_LABELS = [..."0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"];

function randomLabel() {
  return ALL_LABELS[Math.floor(Math.random() * ALL_LABELS.length)];
}

export default function App() {
  const [target, setTarget] = useState(randomLabel());
  const [status, setStatus] = useState({
    state: "idle",
    predicted: "",
    confidence: 0,
  });
  const [subtitle, setSubtitle] = useState("");
  const [exampleUrl, setExampleUrl] = useState("");

  // Throttle refs
  const lastPredictedRef = useRef("");
  const lastTimeRef = useRef(0);

  const handleResult = (predicted, confidence) => {
    const isMatch = predicted === target;
    setStatus({
      state: isMatch ? "correct" : "incorrect",
      predicted,
      confidence,
    });

    const now = Date.now();
    // Tăng độ khó lên: Chỉ nhận khi độ tin cậy > 0.85 (85%)
    // Và thời gian giữa 2 lần nhận diện phải > 1 giây (1000ms) để tránh spam chữ
    if (confidence > 0.85) {
      if (
        predicted !== lastPredictedRef.current ||
        now - lastTimeRef.current > 1000
      ) {
        setSubtitle((prev) => {
          // Nếu chữ mới giống hệt chữ cuối cùng của phụ đề thì không thêm nữa (tránh JJJJJ)
          if (prev.endsWith(predicted)) return prev;

          const newSub = prev + predicted;
          return newSub.slice(-20);
        });
        lastPredictedRef.current = predicted;
        lastTimeRef.current = now;
      }
    }
  };

  const next = () => {
    setTarget(randomLabel());
    setStatus({ state: "idle", predicted: "", confidence: 0 });
    lastPredictedRef.current = "";
  };

  useEffect(() => {
    // Backend Flask của bạn chạy port 5000
    setExampleUrl(`http://localhost:5000/api/example/${target}`);
  }, [target]);

  return (
    <div className="App">
      <header className="main-header">
        <h1 className="logo-text">
          LEARN WITH <span className="highlight">ASL</span>
        </h1>
      </header>
      <div className="teacher-note">
        Teacher Note: Hãy tạo dáng tay giống chữ ở góc dưới bên trái.
      </div>

      <div className="camera-container">
        <CameraFeed onResult={handleResult} />
      </div>

      {/* Subtitle nằm đè lên layer trên cùng, được định vị bằng CSS fixed */}
      {subtitle && <div className="subtitle-overlay">{subtitle}</div>}

      <PredictionDisplay
        target={target}
        status={status}
        onNext={next}
        exampleUrl={exampleUrl}
        // Bỏ prop onClearSubtitle ở đây vì nút đó giờ nằm riêng
      />

      <button className="clear-subtitle-btn" onClick={() => setSubtitle("")}>
        Clear Subtitle
      </button>
    </div>
  );
}
