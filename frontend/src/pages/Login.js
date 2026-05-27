import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginWithEmail } from "../services/auth";
import { getUserProfile } from "../services/db";
import { usernameToEmail } from "../services/usernameToEmail";
import "../App.css";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const email = usernameToEmail(username);
      const user = await loginWithEmail(email, password);
      const profile = await getUserProfile(user.uid);
      if (profile) {
        onLogin({ ...profile, uid: user.uid });
      } else {
        onLogin({ uid: user.uid, email: user.email, fullname: username, username });
      }
      navigate("/home");
    } catch (err) {
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setError("Incorrect username or password!");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid username!");
      } else {
        setError("Login failed: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2 style={{ color: "#00ffea", marginBottom: "20px" }}>EDUGLYPH</h2>
        <h3>Sign In</h3>
        {error && <p style={{ color: "#ff4d4d", fontSize: "14px" }}>{error}</p>}
        <form onSubmit={handleLogin}>
          <input
            className="auth-input"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            className="auth-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <p style={{ marginTop: "15px", color: "#ccc" }}>
          Don't have an account?{" "}
          <Link to="/register" style={{ color: "#00ffea" }}>
            Register now
          </Link>
        </p>
      </div>
    </div>
  );
}
