import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const [formData, setFormData] = useState({
    fullname: "",
    dob: "",
    username: "",
    password: "",
    confirm: "",
  });
  const [message, setMessage] = useState({ text: "", type: "" });
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirm) {
      return setMessage({
        text: "Mật khẩu nhập lại không khớp!",
        type: "error",
      });
    }

    // Tính tuổi
    const year = new Date(formData.dob).getFullYear();
    const isTeacher = new Date().getFullYear() - year > 22;

    const users = JSON.parse(localStorage.getItem("asl_users")) || {};
    if (users[formData.username]) {
      return setMessage({ text: "Tên tài khoản đã tồn tại!", type: "error" });
    }

    // Lưu User
    users[formData.username] = { ...formData, isTeacher };
    localStorage.setItem("asl_users", JSON.stringify(users));

    setMessage({
      text: "Đăng ký thành công! Đang chuyển về đăng nhập...",
      type: "success",
    });

    // Tự động về Login sau 3s
    setTimeout(() => navigate("/"), 3000);
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2 style={{ color: "#00ffea" }}>ĐĂNG KÝ</h2>
        {message.text && (
          <p
            style={{ color: message.type === "error" ? "#ff4d4d" : "#00ffea" }}
          >
            {message.text}
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <input
            className="auth-input"
            type="text"
            placeholder="Họ và tên"
            required
            onChange={(e) =>
              setFormData({ ...formData, fullname: e.target.value })
            }
          />
          <input
            className="auth-input"
            type="date"
            required
            onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
          />
          <input
            className="auth-input"
            type="text"
            placeholder="Tên tài khoản"
            required
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
          />
          <input
            className="auth-input"
            type="password"
            placeholder="Mật khẩu"
            required
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
          />
          <input
            className="auth-input"
            type="password"
            placeholder="Nhập lại mật khẩu"
            required
            onChange={(e) =>
              setFormData({ ...formData, confirm: e.target.value })
            }
          />
          <button className="auth-btn" type="submit">
            Đăng Ký
          </button>
        </form>
        <p style={{ marginTop: "15px" }}>
          <Link to="/" style={{ color: "#aaa" }}>
            ← Quay lại đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
