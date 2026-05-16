import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import MeetingRoom from "./pages/MeetingRoom";
import "./App.css";

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);

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
