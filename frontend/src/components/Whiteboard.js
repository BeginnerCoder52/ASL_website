import React, { useRef, useState, useEffect } from "react";
import io from "socket.io-client";

const socket = io(process.env.REACT_APP_BACKEND_URL);

const STICKY_COLORS = ["#ffd700", "#ff6b6b", "#74b9ff", "#a29bfe", "#fd79a8", "#00b894"];

export default function Whiteboard({ room, username, onClose, aslSignCallbackRef }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(4);
  const [isEraser, setIsEraser] = useState(false);
  const [scale, setScale] = useState(1);

  const [stickies, setStickies] = useState([]);
  const [stickyMode, setStickyMode] = useState(false);
  const [editingStickyId, setEditingStickyId] = useState(null);
  const [activeStickyMode, setActiveStickyMode] = useState("keyboard");

  const [remoteCursors, setRemoteCursors] = useState({});
  const cursorCleanupRef = useRef(null);

  const draggingStickyRef = useRef(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = 2500;
    canvas.height = 1500;
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    socket.emit("join_room", { room, username: username || "User" });
    socket.emit("request_whiteboard", { room });
    socket.emit("request_stickies", { room });

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

    socket.on("sticky_add", (data) => {
      setStickies((prev) => [...prev, data.sticky]);
    });

    socket.on("sticky_update", (data) => {
      setStickies((prev) =>
        prev.map((s) => (s.id === data.sticky.id ? data.sticky : s))
      );
    });

    socket.on("sticky_remove", (data) => {
      setStickies((prev) => prev.filter((s) => s.id !== data.id));
    });

    socket.on("load_stickies", (data) => {
      if (data.stickies) setStickies(data.stickies);
    });

    socket.on("cursor_move", (data) => {
      setRemoteCursors((prev) => ({
        ...prev,
        [data.username]: { x: data.x, y: data.y, timestamp: Date.now() },
      }));
    });

    return () => {
      socket.off("load_whiteboard");
      socket.off("draw_line");
      socket.off("sticky_add");
      socket.off("sticky_update");
      socket.off("sticky_remove");
      socket.off("load_stickies");
      socket.off("cursor_move");
      socket.emit("leave_room", { room, username: username || "User" });
    };
  }, [room, username]);

  useEffect(() => {
    const container = containerRef.current;
    const preventDefaultScroll = (e) => {
      if (e.ctrlKey) e.preventDefault();
    };
    container.addEventListener("wheel", preventDefaultScroll, { passive: false });
    return () => container.removeEventListener("wheel", preventDefaultScroll);
  }, []);

  useEffect(() => {
    if (cursorCleanupRef.current) clearInterval(cursorCleanupRef.current);
    cursorCleanupRef.current = setInterval(() => {
      setRemoteCursors((prev) => {
        const now = Date.now();
        const cleaned = {};
        for (const [k, v] of Object.entries(prev)) {
          if (now - v.timestamp < 3000) cleaned[k] = v;
        }
        return cleaned;
      });
    }, 1000);
    return () => {
      if (cursorCleanupRef.current) clearInterval(cursorCleanupRef.current);
    };
  }, []);

  // Register ASL callback for sticky notes
  useEffect(() => {
    if (aslSignCallbackRef) {
      aslSignCallbackRef.current = (label) => {
        if (!editingStickyId || activeStickyMode !== "asl") return;
        setStickies((prev) => {
          const updated = prev.map((s) => {
            if (s.id !== editingStickyId) return s;
            let newText = s.text;
            if (label === "space") newText += " ";
            else if (label === "del") newText = newText.slice(0, -1);
            else if (label !== "nothing") newText += label;
            const updatedSticky = { ...s, text: newText };
            socket.emit("sticky_update", { room, sticky: updatedSticky });
            return updatedSticky;
          });
          return updated;
        });
      };
    }
    return () => {
      if (aslSignCallbackRef) aslSignCallbackRef.current = null;
    };
  }, [room, editingStickyId, activeStickyMode, aslSignCallbackRef]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    };
  };

  const getTouchCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0] || e.changedTouches[0];
    return {
      x: (touch.clientX - rect.left) / scale,
      y: (touch.clientY - rect.top) / scale,
    };
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    if (stickyMode) {
      const { x, y } = getTouchCoordinates(e);
      addSticky(x, y);
      return;
    }
    const { x, y } = getTouchCoordinates(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    if (stickyMode || !isDrawing) return;
    const { x, y } = getTouchCoordinates(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineTo(x, y);
    ctx.strokeStyle = isEraser ? "#ffffff" : color;
    ctx.lineWidth = isEraser ? 20 : lineWidth;
    ctx.stroke();

    socket.emit("draw_line", {
      room, x, y,
      color: isEraser ? "#ffffff" : color,
      width: isEraser ? 20 : lineWidth,
    });
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    setIsDrawing(false);
    canvasRef.current.getContext("2d").beginPath();
    saveBoard();
  };

  const startDrawing = (e) => {
    if (stickyMode) {
      const { x, y } = getCoordinates(e.nativeEvent);
      addSticky(x, y);
      return;
    }
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
      room, x, y,
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

  const addSticky = (x, y) => {
    const newSticky = {
      id: "temp_" + Date.now(),
      x,
      y,
      text: "",
      color: STICKY_COLORS[Math.floor(Math.random() * STICKY_COLORS.length)],
      mode: activeStickyMode,
      username: username || "User",
    };
    socket.emit("sticky_add", { ...newSticky, room });
    setEditingStickyId(newSticky.id);
  };

  const handleStickyTextChange = (id, text) => {
    setStickies((prev) => {
      const updated = prev.map((s) =>
        s.id === id ? { ...s, text } : s
      );
      const sticky = updated.find((s) => s.id === id);
      if (sticky) socket.emit("sticky_update", { room, sticky });
      return updated;
    });
  };

  const removeSticky = (e, id) => {
    e.stopPropagation();
    socket.emit("sticky_remove", { room, id });
    if (editingStickyId === id) setEditingStickyId(null);
  };

  const handleStickyMouseDown = (e, id) => {
    e.stopPropagation();
    setEditingStickyId(id);
    const sticky = stickies.find((s) => s.id === id);
    if (!sticky) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    draggingStickyRef.current = id;
    dragOffsetRef.current = {
      x: (e.clientX - rect.left) / scale - sticky.x,
      y: (e.clientY - rect.top) / scale - sticky.y,
    };
  };

  const handleCanvasMouseMove = (e) => {
    const { x, y } = getCoordinates(e.nativeEvent);

    // Emit cursor position for collaborative cursors
    socket.emit("cursor_move", { room, username: username || "User", x, y });

    // Handle sticky dragging
    if (draggingStickyRef.current) {
      setStickies((prev) => {
        const updated = prev.map((s) => {
          if (s.id !== draggingStickyRef.current) return s;
          const newSticky = {
            ...s,
            x: x - dragOffsetRef.current.x,
            y: y - dragOffsetRef.current.y,
          };
          socket.emit("sticky_update", { room, sticky: newSticky });
          return newSticky;
        });
        return updated;
      });
    }
  };

  const handleCanvasMouseUp = () => {
    draggingStickyRef.current = null;
  };

  const downloadPng = () => {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = `whiteboard_${room}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleZoomIn = () => setScale((prev) => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setScale((prev) => Math.max(prev / 1.2, 0.2));

  const handleWheelZoom = (e) => {
    if (e.deltaY < 0) handleZoomIn();
    else handleZoomOut();
  };

  const colors = ["#000000", "#e74c3c", "#3498db", "#2ecc71", "#f1c40f", "#9b59b6"];

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        backgroundColor: "#e2e8f0",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        ref={containerRef}
        onWheel={handleWheelZoom}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
        style={{ flex: 1, overflow: "auto", position: "relative" }}
      >
        <div style={{ position: "relative", display: "inline-block" }}>
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              display: "block",
              cursor: stickyMode ? "cell" : isEraser ? "cell" : "crosshair",
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              boxShadow: "0 0 20px rgba(0,0,0,0.1)",
              margin: "20px",
              touchAction: "none",
            }}
          />

          {stickies.map((sticky) => (
            <div
              key={sticky.id}
              onMouseDown={(e) => handleStickyMouseDown(e, sticky.id)}
              style={{
                position: "absolute",
                left: sticky.x * scale + 20,
                top: sticky.y * scale + 20,
                width: "200px",
                minHeight: "120px",
                backgroundColor: sticky.color,
                borderRadius: "8px",
                padding: "8px",
                boxShadow: "2px 2px 10px rgba(0,0,0,0.3)",
                cursor: "move",
                zIndex: editingStickyId === sticky.id ? 100 : 10,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "4px",
                }}
              >
                <span style={{ fontSize: "10px", opacity: 0.7 }}>
                  {sticky.username}
                  {sticky.mode === "asl" ? " [ASL]" : ""}
                </span>
                <button
                  onClick={(e) => removeSticky(e, sticky.id)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "14px",
                    color: "#333",
                    padding: "0 2px",
                  }}
                >
                  ✕
                </button>
              </div>
              {editingStickyId === sticky.id ? (
                <textarea
                  value={sticky.text}
                  onChange={(e) => handleStickyTextChange(sticky.id, e.target.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                  style={{
                    width: "100%",
                    minHeight: "60px",
                    border: "none",
                    background: "rgba(255,255,255,0.5)",
                    borderRadius: "4px",
                    padding: "4px",
                    fontSize: "13px",
                    resize: "vertical",
                    fontFamily: "inherit",
                    outline: "none",
                  }}
                  placeholder={
                    sticky.mode === "asl"
                      ? "Sign ASL to add text..."
                      : "Type here..."
                  }
                  autoFocus
                />
              ) : (
                <div
                  style={{
                    fontSize: "13px",
                    lineHeight: "1.4",
                    wordBreak: "break-word",
                    minHeight: "60px",
                    padding: "4px",
                    color: "#333",
                  }}
                >
                  {sticky.text || (
                    <span style={{ opacity: 0.5 }}>Click to edit</span>
                  )}
                </div>
              )}
            </div>
          ))}

          {Object.entries(remoteCursors).map(([name, pos]) => (
            <div
              key={name}
              style={{
                position: "absolute",
                left: pos.x * scale + 20,
                top: pos.y * scale + 20,
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                backgroundColor: "#00ffea",
                transform: "translate(-50%, -50%)",
                zIndex: 50,
                pointerEvents: "none",
                transition: "left 0.05s, top 0.05s",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: "-18px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  fontSize: "10px",
                  color: "#00ffea",
                  whiteSpace: "nowrap",
                  textShadow: "0 0 3px rgba(0,0,0,0.8)",
                }}
              >
                {name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Toolbar */}
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
        {/* Zoom */}
        <div style={{ display: "flex", gap: "8px", borderRight: "2px solid #334155", paddingRight: "20px" }}>
          <span style={{ color: "#cbd5e1", fontSize: "14px", alignSelf: "center", marginRight: "5px" }}>
            {Math.round(scale * 100)}%
          </span>
          <button onClick={handleZoomOut} style={getBtnStyle(false)}>🔍-</button>
          <button onClick={handleZoomIn} style={getBtnStyle(false)}>🔍+</button>
        </div>

        {/* Colors */}
        <div style={{ display: "flex", gap: "8px", borderRight: "2px solid #334155", paddingRight: "20px" }}>
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => { setColor(c); setIsEraser(false); }}
              style={{
                width: "28px", height: "28px", borderRadius: "50%",
                backgroundColor: c,
                border: color === c && !isEraser ? "3px solid #fff" : "2px solid transparent",
                cursor: "pointer",
              }}
            />
          ))}
        </div>

        {/* Pen Size */}
        <div style={{ display: "flex", gap: "8px", borderRight: "2px solid #334155", paddingRight: "20px" }}>
          <button onClick={() => { setLineWidth(4); setIsEraser(false); }} style={getBtnStyle(lineWidth === 4 && !isEraser)}>Nhỏ</button>
          <button onClick={() => { setLineWidth(10); setIsEraser(false); }} style={getBtnStyle(lineWidth === 10 && !isEraser)}>Vừa</button>
          <button onClick={() => { setLineWidth(20); setIsEraser(false); }} style={getBtnStyle(lineWidth === 20 && !isEraser)}>To</button>
        </div>

        {/* Sticky Notes */}
        <div style={{ display: "flex", gap: "8px", borderRight: "2px solid #334155", paddingRight: "20px" }}>
          <button
            onClick={() => {
              setStickyMode(!stickyMode);
              if (!stickyMode) setActiveStickyMode("keyboard");
            }}
            style={getBtnStyle(stickyMode && activeStickyMode === "keyboard")}
          >
            📝 Ghi chú
          </button>
          <button
            onClick={() => {
              setStickyMode(!stickyMode);
              if (!stickyMode) setActiveStickyMode("asl");
            }}
            style={getBtnStyle(stickyMode && activeStickyMode === "asl")}
          >
            🤟 ASL
          </button>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => setIsEraser(true)} style={getBtnStyle(isEraser)}>Tẩy</button>
          <button onClick={clearBoard} style={getBtnStyle(false)}>Xóa hết</button>
          <button onClick={downloadPng} style={getBtnStyle(false)}>💾 .PNG</button>
          <button
            onClick={onClose}
            style={{ ...getBtnStyle(false), backgroundColor: "#ef4444", color: "white", marginLeft: "10px" }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

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
