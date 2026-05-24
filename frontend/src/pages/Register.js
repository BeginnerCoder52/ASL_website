import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerWithEmail } from "../services/auth";
import { createUserProfile } from "../services/db";
import { usernameToEmail } from "../services/usernameToEmail";

export default function Register() {
  const [formData, setFormData] = useState({
    username: "",
    fullname: "",
    dob: "",
    password: "",
    confirm: "",
  });
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    if (formData.password !== formData.confirm) {
      return setMessage({ text: "Mật khẩu nhập lại không khớp!", type: "error" });
    }

    if (formData.password.length < 6) {
      return setMessage({ text: "Mật khẩu phải có ít nhất 6 ký tự!", type: "error" });
    }

    setLoading(true);
    try {
      const email = usernameToEmail(formData.username);
      const user = await registerWithEmail(email, formData.password);

      const year = new Date(formData.dob).getFullYear();
      const isTeacher = new Date().getFullYear() - year > 22;

      await createUserProfile(user.uid, {
        username: formData.username,
        fullname: formData.fullname,
        dob: formData.dob,
        isTeacher,
        email,
      });

      setMessage({ text: "Đăng ký thành công! Đang chuyển về đăng nhập...", type: "success" });
      setTimeout(() => navigate("/"), 3000);
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setMessage({ text: "Tên đăng nhập này đã tồn tại!", type: "error" });
      } else if (err.code === "auth/weak-password") {
        setMessage({ text: "Mật khẩu quá yếu! Phải có ít nhất 6 ký tự.", type: "error" });
      } else {
        setMessage({ text: "Đăng ký thất bại: " + err.message, type: "error" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2 style={{ color: "#00ffea" }}>ĐĂNG KÝ</h2>
        {message.text && (
          <p style={{ color: message.type === "error" ? "#ff4d4d" : "#00ffea" }}>
            {message.text}
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <input
            className="auth-input"
            type="text"
            placeholder="Tên đăng nhập"
            required
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          />
          <input
            className="auth-input"
            type="text"
            placeholder="Họ và tên"
            required
            onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
          />
          <input
            className="auth-input"
            type="date"
            required
            onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
          />
          <input
            className="auth-input"
            type="password"
            placeholder="Mật khẩu (ít nhất 6 ký tự)"
            required
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
          <input
            className="auth-input"
            type="password"
            placeholder="Nhập lại mật khẩu"
            required
            onChange={(e) => setFormData({ ...formData, confirm: e.target.value })}
          />
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? "Đang đăng ký..." : "Đăng Ký"}
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
