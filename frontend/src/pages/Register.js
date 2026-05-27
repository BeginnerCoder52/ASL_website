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
      return setMessage({ text: "Passwords do not match!", type: "error" });
    }

    if (formData.password.length < 6) {
      return setMessage({ text: "Password must be at least 6 characters!", type: "error" });
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

      setMessage({ text: "Registration successful! Redirecting to login...", type: "success" });
      setTimeout(() => navigate("/"), 3000);
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setMessage({ text: "This username is already taken!", type: "error" });
      } else if (err.code === "auth/weak-password") {
        setMessage({ text: "Password too weak! Must be at least 6 characters.", type: "error" });
      } else {
        setMessage({ text: "Registration failed: " + err.message, type: "error" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2 style={{ color: "#00ffea" }}>REGISTER</h2>
        {message.text && (
          <p style={{ color: message.type === "error" ? "#ff4d4d" : "#00ffea" }}>
            {message.text}
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <input
            className="auth-input"
            type="text"
            placeholder="Username"
            required
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          />
          <input
            className="auth-input"
            type="text"
            placeholder="Full name"
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
            placeholder="Password (min 6 characters)"
            required
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
          <input
            className="auth-input"
            type="password"
            placeholder="Confirm password"
            required
            onChange={(e) => setFormData({ ...formData, confirm: e.target.value })}
          />
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
        <p style={{ marginTop: "15px" }}>
          <Link to="/" style={{ color: "#aaa" }}>
            ← Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
