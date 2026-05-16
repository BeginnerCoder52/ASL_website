import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../App.css"; // Dùng chung CSS

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    const users = JSON.parse(localStorage.getItem("asl_users")) || {};
    if (users[username] && users[username].password === password) {
      onLogin(users[username]);
      navigate("/home");
    } else {
      setError("Sai tài khoản hoặc mật khẩu! Vui lòng đăng ký nếu chưa có.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2 style={{ color: "#00ffea", marginBottom: "20px" }}>EDUGLYPH</h2>
        <h3>Đăng nhập</h3>
        {error && <p style={{ color: "#ff4d4d", fontSize: "14px" }}>{error}</p>}
        <form onSubmit={handleLogin}>
          <input
            className="auth-input"
            type="text"
            placeholder="Tên tài khoản"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            className="auth-input"
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button className="auth-btn" type="submit">
            Đăng Nhập
          </button>
        </form>
        <p style={{ marginTop: "15px", color: "#ccc" }}>
          Chưa có tài khoản?{" "}
          <Link to="/register" style={{ color: "#00ffea" }}>
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
