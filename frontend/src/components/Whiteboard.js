import React, { useRef, useState, useEffect } from "react";

const Whiteboard = ({ onClose }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000"); // Màu đen mặc định
  const [lineWidth, setLineWidth] = useState(4);
  const [isEraser, setIsEraser] = useState(false);

  // Setup Canvas Fullscreen
  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d");

    // Giúp nét vẽ tròn, mượt mà hơn
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Đổ nền trắng toàn bộ
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const startDrawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineTo(offsetX, offsetY);

    // Nếu là tẩy thì dùng màu trắng để đè lên, ngược lại dùng màu đã chọn
    ctx.strokeStyle = isEraser ? "#ffffff" : color;
    ctx.lineWidth = isEraser ? 30 : lineWidth; // Tẩy sẽ to hơn bình thường
    ctx.stroke();
  };

  const stopDrawing = () => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.closePath();
    setIsDrawing(false);
  };

  const clearBoard = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  // Các màu mặc định
  const colors = [
    "#000000",
    "#e74c3c",
    "#3498db",
    "#2ecc71",
    "#f1c40f",
    "#9b59b6",
  ];

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 2000,
        backgroundColor: "#fff",
      }}
    >
      {/* Vùng Canvas Vẽ */}
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        style={{
          display: "block",
          cursor: isEraser ? "cell" : "crosshair",
        }}
      />

      {/* THANH CÔNG CỤ NỔI (Floating Toolbar phong cách ClassroomScreen) */}
      <div
        style={{
          position: "absolute",
          bottom: "40px",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "#1e293b", // Nền toolbar tối màu
          padding: "15px 25px",
          borderRadius: "20px",
          display: "flex",
          gap: "25px",
          alignItems: "center",
          boxShadow: "0 15px 35px rgba(0,0,0,0.3)",
          border: "1px solid #334155",
        }}
      >
        {/* 1. Bảng chọn Màu */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            borderRight: "2px solid #334155",
            paddingRight: "25px",
          }}
        >
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => {
                setColor(c);
                setIsEraser(false);
              }}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                backgroundColor: c,
                border:
                  color === c && !isEraser
                    ? "3px solid #fff"
                    : "2px solid transparent",
                cursor: "pointer",
                transition: "all 0.2s",
                padding: 0,
                boxShadow:
                  color === c && !isEraser
                    ? "0 0 10px rgba(255,255,255,0.5)"
                    : "none",
              }}
            />
          ))}
        </div>

        {/* 2. Kích thước nét vẽ */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "center",
            borderRight: "2px solid #334155",
            paddingRight: "25px",
          }}
        >
          <button
            onClick={() => {
              setLineWidth(4);
              setIsEraser(false);
            }}
            style={getBtnStyle(lineWidth === 4 && !isEraser)}
          >
            Small
          </button>
          <button
            onClick={() => {
              setLineWidth(10);
              setIsEraser(false);
            }}
            style={getBtnStyle(lineWidth === 10 && !isEraser)}
          >
            Medium
          </button>
          <button
            onClick={() => {
              setLineWidth(20);
              setIsEraser(false);
            }}
            style={getBtnStyle(lineWidth === 20 && !isEraser)}
          >
            Large
          </button>
        </div>

        {/* 3. Công cụ & Hành động */}
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={() => setIsEraser(true)}
            style={getBtnStyle(isEraser)}
          >
            Eraser
          </button>
          <button onClick={clearBoard} style={getBtnStyle(false)}>
            Clear Board
          </button>
          <button
            onClick={onClose}
            style={{
              ...getBtnStyle(false),
              backgroundColor: "#ef4444",
              color: "white",
              marginLeft: "20px",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Hàm tạo style tự động cho các nút trong Toolbar
const getBtnStyle = (isActive) => ({
  backgroundColor: isActive ? "#3b82f6" : "#334155",
  color: isActive ? "#ffffff" : "#cbd5e1",
  border: "none",
  padding: "10px 16px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "14px",
  transition: "all 0.2s ease",
});

export default Whiteboard;
