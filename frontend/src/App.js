import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./services/firebase";
import { getUserProfile } from "./services/db";
import { emailToUsername } from "./services/usernameToEmail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import MeetingRoom from "./pages/MeetingRoom";
import "./App.css";

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fbError, setFbError] = useState(false);

  useEffect(() => {
    if (!auth) {
      setFbError(true);
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await getUserProfile(firebaseUser.uid);
        if (profile) {
          setCurrentUser({ ...profile, uid: firebaseUser.uid });
        } else {
          setCurrentUser({ uid: firebaseUser.uid, email: firebaseUser.email, fullname: emailToUsername(firebaseUser.email) });
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#0f172a",
        color: "#00ffea",
        fontSize: "1.2rem",
      }}>
        Đang tải...
      </div>
    );
  }

  if (fbError) {
    return (
      <div style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: "#0f172a",
        color: "#ef4444",
        padding: "20px",
        textAlign: "center",
      }}>
        <div style={{ fontSize: "3rem", marginBottom: "20px" }}>⚠️</div>
        <h2 style={{ color: "#fff", marginBottom: "10px" }}>Lỗi kết nối Firebase</h2>
        <p style={{ color: "#94a3b8", maxWidth: "440px", lineHeight: "1.6" }}>
          Kiểm tra 3 nguyên nhân sau:
        </p>
        <ol style={{ color: "#cbd5e1", maxWidth: "440px", textAlign: "left", lineHeight: "2" }}>
          <li>
            <b>Vercel Dashboard:</b> Vào Project Settings → Environment Variables → <span style={{ color: "#fbbf24" }}>XÓA</span> tất cả <code>REACT_APP_FIREBASE_*</code> nếu có (để file <code>.env</code> được dùng).
          </li>
          <li>
            <b>Firebase Console:</b> Vào Authentication → "Get Started" → bật <b>Email/Password</b> sign-in.
          </li>
          <li>
            <b>API Key:</b> Google Cloud Console → APIs & Services → Credentials → kiểm tra key <code>AIzaSyDE...</code> không bị giới hạn domain.
          </li>
        </ol>
        <p style={{ color: "#64748b", fontSize: "12px", marginTop: "20px" }}>
          Mở F12 → Console để xem log chi tiết.
        </p>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login onLogin={setCurrentUser} />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/home"
          element={
            currentUser ? <Home user={currentUser} /> : <Navigate to="/" />
          }
        />
        <Route
          path="/room/:roomId"
          element={
            currentUser ? (
              <MeetingRoom user={currentUser} />
            ) : (
              <Navigate to="/" />
            )
          }
        />
      </Routes>
    </Router>
  );
}
