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
      {/* 1. Hiển thị các ô chữ cái */}
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
          let statusClass = "char-pending";
          if (index < currentIndex) statusClass = "char-done";
          if (index === currentIndex && !isCompleted)
            statusClass = "char-current";

          const displayChar = char === " " ? "␣" : char;

          return (
            <div key={index} className={`char-box ${statusClass}`}>
              {displayChar}
            </div>
          );
        })}
      </div>

      {/* 2. Khu vực trạng thái & Ảnh hướng dẫn */}
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
              gap: "30px",
              justifyContent: "center",
            }}
          >
            {/* ẢNH HƯỚNG DẪN TỪ DATASET */}
            <div className="example-guide" style={{ textAlign: "center" }}>
              <div
                style={{ fontSize: "14px", color: "#aaa", marginBottom: "5px" }}
              >
                Example:
              </div>
              {exampleUrl ? (
                <img
                  src={exampleUrl}
                  alt="Hand Sign Guide"
                  style={{
                    height: "140px", // Tăng kích thước ảnh để nhìn rõ hơn
                    width: "auto",
                    borderRadius: "8px",
                    border: "2px solid #555",
                    objectFit: "contain",
                    backgroundColor: "#fff", // Nền trắng để ảnh trong suốt dễ nhìn
                  }}
                />
              ) : (
                <div
                  style={{
                    height: "140px",
                    width: "140px",
                    background: "#222",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "8px",
                    border: "1px dashed #555",
                    color: "#666",
                  }}
                >
                  No Image
                </div>
              )}
            </div>

            {/* Thông tin Text */}
            <div className="info-text" style={{ textAlign: "left" }}>
              <div>
                Target:{" "}
                <b style={{ fontSize: "24px", color: "yellow" }}>
                  {targetPhrase[currentIndex] === " "
                    ? "SPACE"
                    : targetPhrase[currentIndex]}
                </b>
              </div>
              <div style={{ marginTop: "10px" }}>
                AI Detected:{" "}
                <b style={{ fontSize: "24px", color: "#fff" }}>
                  {currentPrediction}
                </b>
              </div>
              <div
                style={{ fontSize: "12px", color: "#aaa", marginTop: "10px" }}
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

      {/* CSS Styles */}
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
          background-color: #008800;
          border-color: #00ff00;
        }
        .char-current {
          background-color: #333;
          border-color: #ffff00;
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
