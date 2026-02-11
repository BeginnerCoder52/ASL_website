import React from "react";

export default function PredictionDisplay({
  targetPhrase,
  currentIndex,
  isCompleted,
  currentPrediction,
  exampleUrl,
  onSkip,
}) {
  return (
    <div className="prediction-panel">
      {/* 1. Khu vực hiển thị từ vựng (Challenge) */}
      <div
        className="phrase-container"
        style={{
          display: "flex",
          gap: "10px",
          justifyContent: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        {targetPhrase.split("").map((char, index) => {
          // Xác định trạng thái của từng chữ cái
          let statusClass = "char-pending"; // Chưa đoán
          if (index < currentIndex) statusClass = "char-done"; // Đã xong
          if (index === currentIndex && !isCompleted)
            statusClass = "char-current"; // Đang đoán (Cursor)

          // Hiển thị đặc biệt cho dấu cách
          const displayChar = char === " " ? "␣" : char;

          return (
            <div key={index} className={`char-box ${statusClass}`}>
              {displayChar}
            </div>
          );
        })}
      </div>

      {/* 2. Trạng thái và Hướng dẫn */}
      <div className="status-box">
        {isCompleted ? (
          <div
            style={{ color: "#00ff00", fontSize: "24px", fontWeight: "bold" }}
          >
            🎉 EXCELLENT! NEXT WORD COMING...
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              justifyContent: "center",
            }}
          >
            {/* Ảnh hướng dẫn mẫu */}
            <div className="example-guide">
              <span
                style={{
                  display: "block",
                  fontSize: "12px",
                  color: "#888",
                  marginBottom: "5px",
                }}
              >
                Guide:
              </span>
              {exampleUrl ? (
                <img
                  src={exampleUrl}
                  alt="Guide"
                  style={{
                    height: "100px",
                    borderRadius: "8px",
                    border: "1px solid #444",
                  }}
                />
              ) : (
                <div
                  style={{
                    height: "100px",
                    width: "100px",
                    background: "#222",
                  }}
                >
                  No Image
                </div>
              )}
            </div>

            {/* Thông tin Text */}
            <div className="info-text" style={{ textAlign: "left" }}>
              <div>
                Current Goal:{" "}
                <b style={{ fontSize: "20px", color: "yellow" }}>
                  {targetPhrase[currentIndex] === " "
                    ? "SPACE (Dấu cách)"
                    : targetPhrase[currentIndex]}
                </b>
              </div>
              <div>
                AI Sees: <b>{currentPrediction}</b>
              </div>
              <div
                style={{ fontSize: "12px", color: "#aaa", marginTop: "5px" }}
              >
                Hold for 2 seconds to confirm!
              </div>
            </div>
          </div>
        )}
      </div>

      <button
        className="next-btn"
        onClick={onSkip}
        style={{ marginTop: "20px" }}
      >
        Skip Word
      </button>

      {/* CSS Styles nhúng trực tiếp hoặc bạn copy vào App.css */}
      <style>{`
        .char-box {
          width: 50px;
          height: 60px;
          border: 2px solid #555;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 30px;
          font-weight: bold;
          background-color: #222;
          color: #fff;
          transition: all 0.3s;
        }
        .char-done {
          background-color: #008800; /* Xanh lá */
          border-color: #00ff00;
        }
        .char-current {
          background-color: #333;
          border-color: #ffff00; /* Vàng */
          box-shadow: 0 0 15px rgba(255, 255, 0, 0.5);
          animation: pulse 1s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
