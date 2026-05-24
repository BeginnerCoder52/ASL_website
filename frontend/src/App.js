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

  useEffect(() => {
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
