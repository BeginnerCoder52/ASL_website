import React, { useState, useEffect, useRef } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

export default function Microphone({ onSpeechResult, onMicToggle }) {
  const [isMicOn, setIsMicOn] = useState(false);
  const { transcript, browserSupportsSpeechRecognition, listening } =
    useSpeechRecognition();
  const lastLengthRef = useRef(0);

  useEffect(() => {
    if (!transcript) return;
    const words = transcript.split(/\s+/).filter(Boolean);
    const lastWords = words.slice(-30);
    onSpeechResult(lastWords.join(" "));
  }, [transcript, onSpeechResult]);

  // Dừng speech recognition khi component unmount
  useEffect(() => {
    return () => {
      if (listening) SpeechRecognition.stopListening();
    };
  }, [listening]);

  const toggleMic = () => {
    if (isMicOn) {
      SpeechRecognition.stopListening();
      setIsMicOn(false);
      if (onMicToggle) onMicToggle(false);
    } else {
      SpeechRecognition.startListening({ continuous: true, language: "en-US" });
      setIsMicOn(true);
      if (onMicToggle) onMicToggle(true);
    }
  };

  if (!browserSupportsSpeechRecognition) {
    return (
      <button
        onClick={() => alert("Trình duyệt không hỗ trợ!")}
        style={{
          background: "#ef4444",
          color: "white",
          border: "none",
          width: "50px",
          height: "50px",
          borderRadius: "50%",
          fontSize: "20px",
          cursor: "pointer",
        }}
      >
        🚫
      </button>
    );
  }

  return (
    <button
      onClick={toggleMic}
      style={{
        background: isMicOn ? "#f59e0b" : "#334155",
        color: isMicOn ? "#000" : "#fff",
        border: "none",
        width: "50px",
        height: "50px",
        borderRadius: "50%",
        fontSize: "20px",
        cursor: "pointer",
        transition: "0.2s",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {isMicOn ? "🎙️" : "🎤"}
    </button>
  );
}
