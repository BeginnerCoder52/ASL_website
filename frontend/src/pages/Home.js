import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Home({ user }) {
  const [roomCode, setRoomCode] = useState("");
  const navigate = useNavigate();

  const createRoom = () => {
    // Tạo mã ngẫu nhiên 9 ký tự kiểu định dạng abc-def-ghi
    const part = () => Math.random().toString(36).substring(2, 5);
    navigate(`/room/${part()}-${part()}-${part()}`);
  };

  const joinRoom = () => {
    if (roomCode) navigate(`/room/${roomCode}`);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0f172a', color: 'white', alignItems: 'center', justifyContent: 'center', padding: '0 10%' }}>
      
      {/* Cột trái: Thông tin và Nút bấm */}
      <div style={{ flex: 1, paddingRight: '50px' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '20px', color: '#00ffea' }}>EduGlyph</h1>
        <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>Xin chào, {user.fullname || user.name}!</h2>
        <p style={{ color: '#94a3b8', fontSize: '1.2rem', marginBottom: '40px', lineHeight: '1.6' }}>
          Nền tảng hội nghị trực tuyến kết hợp AI nhận diện ngôn ngữ ký hiệu (ASL) dành cho tất cả mọi người. Giao tiếp không rào cản, hoàn toàn miễn phí.
        </p>

        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={createRoom} style={{ background: '#00ffea', color: '#000', padding: '12px 24px', fontSize: '1.1rem', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', transition: '0.2s' }}>
            <span style={{ fontSize: '1.5rem' }}>+</span> Tạo phòng mới
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', padding: '5px 10px', border: '1px solid #334155' }}>
            <span style={{ fontSize: '1.2rem', marginRight: '10px' }}>⌨️</span>
            <input
              placeholder="Nhập mã phòng..."
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '1.1rem', outline: 'none', padding: '8px', width: '180px' }}
            />
            <button onClick={joinRoom} disabled={!roomCode} style={{ background: 'transparent', color: roomCode ? '#00ffea' : '#64748b', border: 'none', fontWeight: 'bold', cursor: roomCode ? 'pointer' : 'not-allowed', fontSize: '1.1rem' }}>
              Tham gia
            </button>
          </div>
        </div>
      </div>

      {/* Cột phải: Hình ảnh trang trí */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '400px', height: '400px', background: 'rgba(0, 255, 234, 0.05)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed rgba(0, 255, 234, 0.5)', boxShadow: '0 0 50px rgba(0, 255, 234, 0.1)' }}>
           <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '5rem', marginBottom: '20px' }}>🤟🌍</div>
              <h3 style={{ color: '#00ffea', fontWeight: 'normal' }}>Giao tiếp không giới hạn</h3>
           </div>
        </div>
      </div>
    </div>
  );
}