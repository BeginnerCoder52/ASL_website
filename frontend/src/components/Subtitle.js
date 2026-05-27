import React, { useEffect } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

const Subtitle = ({ isListening, language = "en-US" }) => {
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  useEffect(() => {
    if (isListening) {
      SpeechRecognition.startListening({
        continuous: true,
        language: language,
      });
    } else {
      SpeechRecognition.stopListening();
    }
    return () => {
      SpeechRecognition.stopListening();
    };
  }, [isListening, language]);

  if (!browserSupportsSpeechRecognition) {
    return (
      <div style={containerStyle}>
        <p style={{ color: "#ff6b6b", fontSize: "18px", margin: 0 }}>
          Your browser does not support speech recognition. Please use
          Google Chrome for this feature.
        </p>
      </div>
    );
  }

  return (
    <div className="subtitle-container" style={containerStyle}>
      {/* Thanh Control Mic */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "15px",
          marginBottom: "10px",
        }}
      >
        <span
          style={{
            color: listening ? "#4ade80" : "#f87171",
            fontSize: "14px",
            fontWeight: "bold",
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
        >
          {listening ? "● Mic is ON" : "■ Mic is OFF"}
        </span>

        {/* Manual start button in case browser blocks auto-start */}
        {!listening && (
          <button
            onClick={() =>
              SpeechRecognition.startListening({ continuous: true, language })
            }
            style={btnStyle}
          >
            Start
          </button>
        )}
        {listening && (
          <button onClick={SpeechRecognition.stopListening} style={btnStyle}>
            Stop
          </button>
        )}
        <button onClick={resetTranscript} style={btnStyle}>
          Reset Text
        </button>
      </div>

      {/* Subtitle Content */}
      <p
        style={{
          color: "#fff",
          fontSize: "28px",
          margin: 0,
          fontWeight: "600",
          textShadow: "0 2px 4px rgba(0,0,0,0.5)",
          minHeight: "40px",
        }}
      >
        {transcript || (
          <span style={{ color: "#666", fontSize: "20px" }}>
            Listening for speech...
          </span>
        )}
      </p>
    </div>
  );
};

// Styles
const containerStyle = {
  position: "fixed",
  bottom: "30px",
  left: "50%",
  transform: "translateX(-50%)",
  backgroundColor: "rgba(15, 23, 42, 0.9)", // Dark navy background
  border: "1px solid #334155",
  padding: "15px 30px",
  borderRadius: "16px",
  minWidth: "400px",
  maxWidth: "80%",
  textAlign: "center",
  zIndex: 1000,
  boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
  backdropFilter: "blur(10px)",
};

const btnStyle = {
  background: "transparent",
  border: "1px solid #64748b",
  color: "#cbd5e1",
  padding: "4px 10px",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "12px",
  transition: "all 0.2s",
};

export default Subtitle;
