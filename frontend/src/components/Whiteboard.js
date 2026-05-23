import React, { useRef, useState, useEffect } from "react";
import io from "socket.io-client";

// Chỉ connect 1 lần khi component mount
const socket = io(process.env.REACT_APP_BACKEND_URL); // Đổi thành URL thật khi lên host

export default function Whiteboard({ room, onClose }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null); // Container để quản lý thanh cuộn và zoom

  // States vẽ
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(4);
  const [isEraser, setIsEraser] = useState(false);

  // States Zoom
  const [scale, setScale] = useState(1);

  // 1. Khởi tạo Bảng và Socket
  useEffect(() => {
    const canvas = canvasRef.current;
    // Đặt kích thước cố định lớn cho bảng ảo (Virtual Canvas)
    canvas.width = 2500;
    canvas.height = 1500;
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    socket.emit("join_room", { room, username: "User" });
    socket.emit("request_whiteboard", { room });

    socket.on("load_whiteboard", (data) => {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = data.image;
    });

    socket.on("draw_line", (data) => {
      const context = canvasRef.current.getContext("2d");
      context.strokeStyle = data.color;
      context.lineWidth = data.width;
      context.lineTo(data.x, data.y);
      context.stroke();
      context.beginPath();
      context.moveTo(data.x, data.y);
    });

    return () => {
      socket.off("load_whiteboard");
      socket.off("draw_line");
      socket.emit("leave_room", { room, username: "User" });
    };
  }, [room]);

  // Ngăn chặn hành vi cuộn trang mặc định của trình duyệt khi cuộn chuột để zoom
  useEffect(() => {
    const container = containerRef.current;
    const preventDefaultScroll = (e) => {
      if (e.ctrlKey) e.preventDefault(); // Chặn zoom toàn trang của Chrome
    };
    container.addEventListener("wheel", preventDefaultScroll, {
      passive: false,
    });
    return () => container.removeEventListener("wheel", preventDefaultScroll);
  }, []);

  // 2. Lấy tọa độ CHUẨN XÁC sau khi bị Zoom
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect(); // Lấy vị trí thực tế của canvas trên màn hình
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    };
  };

  // 3. Xử lý sự kiện Vẽ
  const startDrawing = (e) => {
    const { x, y } = getCoordinates(e.nativeEvent);
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const { x, y } = getCoordinates(e.nativeEvent);
    const ctx = canvasRef.current.getContext("2d");

    ctx.lineTo(x, y);
    ctx.strokeStyle = isEraser ? "#ffffff" : color;
    ctx.lineWidth = isEraser ? 20 : lineWidth;
    ctx.stroke();

    socket.emit("draw_line", {
      room,
      x,
      y,
      color: isEraser ? "#ffffff" : color,
      width: isEraser ? 20 : lineWidth,
    });
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    canvasRef.current.getContext("2d").beginPath();
    saveBoard();
  };

  const saveBoard = () => {
    const dataUrl = canvasRef.current.toDataURL();
    socket.emit("save_whiteboard", { room, image: dataUrl });
  };

  const clearBoard = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveBoard();
  };

  // 4. Các hàm xử lý ZOOM
  const handleZoomIn = () => setScale((prev) => Math.min(prev * 1.2, 3)); // Zoom max 3x
  const handleZoomOut = () => setScale((prev) => Math.max(prev / 1.2, 0.2)); // Zoom min 0.2x

  const handleWheelZoom = (e) => {
    if (e.deltaY < 0) {
      handleZoomIn(); // Lăn chuột lên
    } else {
      handleZoomOut(); // Lăn chuột xuống
    }
  };

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
        position: "relative",
        width: "100%",
        height: "100%",
        backgroundColor: "#e2e8f0", // Màu nền ngoài bảng
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Vùng Container cuộn và chứa Canvas */}
      <div
        ref={containerRef}
        onWheel={handleWheelZoom}
        style={{
          flex: 1,
          overflow: "auto",
          position: "relative",
        }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          style={{
            display: "block",
            cursor: isEraser ? "cell" : "crosshair",
            transform: `scale(${scale})`, // CSS Zoom
            transformOrigin: "top left", // Bắt buộc để thuật toán tọa độ chính xác
            boxShadow: "0 0 20px rgba(0,0,0,0.1)",
            margin: "20px", // Khoảng cách so với lề
          }}
        />
      </div>

      {/* THANH CÔNG CỤ (Toolbar) */}
      <div
        style={{
          position: "absolute",
          bottom: "15px",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "#1e293b",
          padding: "10px 25px",
          borderRadius: "20px",
          display: "flex",
          gap: "20px",
          alignItems: "center",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          zIndex: 10,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {/* Nhóm chức năng: ZOOM */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            borderRight: "2px solid #334155",
            paddingRight: "20px",
          }}
        >
          <span
            style={{
              color: "#cbd5e1",
              fontSize: "14px",
              alignSelf: "center",
              marginRight: "5px",
            }}
          >
            {Math.round(scale * 100)}%
          </span>
          <button onClick={handleZoomOut} style={getBtnStyle(false)}>
            🔍-
          </button>
          <button onClick={handleZoomIn} style={getBtnStyle(false)}>
            🔍+
          </button>
        </div>

        {/* Nhóm chức năng: MÀU SẮC */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            borderRight: "2px solid #334155",
            paddingRight: "20px",
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
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                backgroundColor: c,
                border:
                  color === c && !isEraser
                    ? "3px solid #fff"
                    : "2px solid transparent",
                cursor: "pointer",
              }}
            />
          ))}
        </div>

        {/* Nhóm chức năng: KÍCH THƯỚC BÚT */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            borderRight: "2px solid #334155",
            paddingRight: "20px",
          }}
        >
          <button
            onClick={() => {
              setLineWidth(4);
              setIsEraser(false);
            }}
            style={getBtnStyle(lineWidth === 4 && !isEraser)}
          >
            Nhỏ
          </button>
          <button
            onClick={() => {
              setLineWidth(10);
              setIsEraser(false);
            }}
            style={getBtnStyle(lineWidth === 10 && !isEraser)}
          >
            Vừa
          </button>
          <button
            onClick={() => {
              setLineWidth(20);
              setIsEraser(false);
            }}
            style={getBtnStyle(lineWidth === 20 && !isEraser)}
          >
            To
          </button>
        </div>

        {/* Nhóm chức năng: HÀNH ĐỘNG */}
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setIsEraser(true)}
            style={getBtnStyle(isEraser)}
          >
            Tẩy
          </button>
          <button onClick={clearBoard} style={getBtnStyle(false)}>
            Xóa hết
          </button>
          <button
            onClick={onClose}
            style={{
              ...getBtnStyle(false),
              backgroundColor: "#ef4444",
              color: "white",
              marginLeft: "10px",
            }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

// Style hỗ trợ cho các nút
const getBtnStyle = (isActive) => ({
  backgroundColor: isActive ? "#3b82f6" : "#334155",
  color: isActive ? "#ffffff" : "#cbd5e1",
  border: "none",
  padding: "8px 12px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "13px",
  transition: "0.2s",
});
