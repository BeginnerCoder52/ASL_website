import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Home({ user }) {
  const [roomCode, setRoomCode] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const createRoom = () => {
    const part = () => Math.random().toString(36).substring(2, 5);
    navigate(`/room/${part()}-${part()}-${part()}`);
  };

  const joinRoom = () => {
    if (roomCode) navigate(`/room/${roomCode}`);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      height: '100vh',
      background: '#0f172a',
      color: 'white',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '20px' : '0 10%',
      textAlign: isMobile ? 'center' : 'left',
      gap: isMobile ? '30px' : '0',
      overflowY: 'auto',
    }}>
      
      <div style={{
        flex: 1,
        paddingRight: isMobile ? '0' : '50px',
        width: isMobile ? '100%' : 'auto',
      }}>
        <h1 style={{ fontSize: isMobile ? '2rem' : '3rem', marginBottom: '10px', color: '#00ffea' }}>EduGlyph</h1>
        <h2 style={{ fontSize: isMobile ? '1.3rem' : '2rem', marginBottom: '10px' }}>Welcome, {user.fullname || user.name}!</h2>
        <p style={{
          color: '#94a3b8',
          fontSize: isMobile ? '1rem' : '1.2rem',
          marginBottom: '30px',
          lineHeight: '1.6',
        }}>
          AI-powered video conferencing platform with real-time American Sign Language (ASL) recognition for everyone.
        </p>

        <div style={{
          display: 'flex',
          gap: '15px',
          alignItems: 'center',
          flexWrap: 'wrap',
          justifyContent: isMobile ? 'center' : 'flex-start',
          flexDirection: isMobile ? 'column' : 'row',
        }}>
          <button onClick={createRoom} style={{
            background: '#00ffea', color: '#000', padding: '12px 24px',
            fontSize: isMobile ? '1rem' : '1.1rem', borderRadius: '8px',
            border: 'none', fontWeight: 'bold', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '10px',
            transition: '0.2s', width: isMobile ? '100%' : 'auto',
            justifyContent: 'center',
          }}>
            <span style={{ fontSize: '1.5rem' }}>+</span> New Room
          </button>
          
          <div style={{
            display: 'flex', alignItems: 'center',
            background: 'rgba(255,255,255,0.1)', borderRadius: '8px',
            padding: '5px 10px', border: '1px solid #334155',
            width: isMobile ? '100%' : 'auto',
            boxSizing: 'border-box',
          }}>
            <input
              placeholder="Enter room code..."
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              style={{
                background: 'transparent', border: 'none', color: 'white',
                fontSize: isMobile ? '1rem' : '1.1rem', outline: 'none',
                padding: '8px', width: isMobile ? '100%' : '180px',
                flex: 1,
              }}
            />
            <button onClick={joinRoom} disabled={!roomCode} style={{
              background: 'transparent',
              color: roomCode ? '#00ffea' : '#64748b',
              border: 'none', fontWeight: 'bold',
              cursor: roomCode ? 'pointer' : 'not-allowed',
              fontSize: isMobile ? '0.9rem' : '1.1rem',
              whiteSpace: 'nowrap',
            }}>
              Join
            </button>
          </div>
        </div>
      </div>

      {!isMobile && (
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <div style={{
            width: '400px', height: '400px',
            background: 'rgba(0, 255, 234, 0.05)', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px dashed rgba(0, 255, 234, 0.5)',
            boxShadow: '0 0 50px rgba(0, 255, 234, 0.1)',
          }}>
             <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '5rem', marginBottom: '20px' }}>🤟🌍</div>
                <h3 style={{ color: '#00ffea', fontWeight: 'normal' }}>Connect Without Limits</h3>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}