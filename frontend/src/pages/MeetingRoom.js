import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import VideoTile from "../components/VideoTile";
import Whiteboard from "../components/Whiteboard";
import Microphone from "../components/Microphone";
import PredictionDisplay from "../components/PredictionDisplay";
import {
  connectToRoom,
  disconnectFromRoom,
  publishLocalVideo,
  setAudioEnabled,
} from "../services/livekitService";

const socket = io(process.env.REACT_APP_BACKEND_URL);

const WORD_LIST = [
  "HELLO",
  "HELP",
  "RIGHT",
  "THANKS",
  "WORLD",
  "AI CODE",
  "COMPUTER",
  "VISION",
  "OPEN CV",
  "GOOD LUCK",
];

export default function MeetingRoom({ user }) {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [peers, setPeers] = useState({});
  const [subtitles, setSubtitles] = useState({});

  const [isAslOn, setIsAslOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(false); // Mic state
  const [isShowSubtitle, setIsShowSubtitle] = useState(true);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const [mode, setMode] = useState("free");
  const [targetPhrase, setTargetPhrase] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentPrediction, setCurrentPrediction] = useState("");
  const [holdProgress, setHoldProgress] = useState(0);

  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  const [timerEndTime, setTimerEndTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [showTimerConfig, setShowTimerConfig] = useState(false);
  const [timerInput, setTimerInput] = useState({ minutes: 5, seconds: 0 });

  // State cho Camera Selection
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState("");
  const [showCamMenu, setShowCamMenu] = useState(false); // Toggle Menu Camera

  const localStreamRef = useRef(null);
  const roomRef = useRef(null);
  const mySidRef = useRef("");
  const holdStartRef = useRef(null);
  const lastLabelRef = useRef("");
  const newGameTimeoutRef = useRef(null);
  const aslSignCallbackRef = useRef(null);

  // PHASE 5: Mobile detection
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Enumerate camera devices
  useEffect(() => {
    const getCameras = async () => {
      try {
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(
          (device) => device.kind === "videoinput",
        );
        setCameras(videoDevices);
        if (videoDevices.length > 0) {
          setSelectedCamera(videoDevices[0].deviceId);
        }
        tempStream.getTracks().forEach((t) => t.stop()); // Stop stream immediately after enumerate
      } catch (err) {
        console.error("Error finding camera devices: ", err);
      }
    };
    getCameras();
  }, []);

  const playBell = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gainNode.gain.setValueAtTime(1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 2);
      osc.onended = () => ctx.close();
    } catch (e) {
      console.error(e);
    }
  };

  const startNewGame = () => {
    const randomWord = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
    setTargetPhrase(randomWord);
    setCurrentIndex(0);
    setIsCompleted(false);
    setHoldProgress(0);
    holdStartRef.current = null;
  };

  useEffect(() => {
    startNewGame();
    return () => {
      if (newGameTimeoutRef.current) clearTimeout(newGameTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const room = await connectToRoom(roomId, user.fullname, {
          onTrackSubscribed: (sid, stream, name) => {
            if (cancelled) return;
            setPeers((prev) => ({ ...prev, [sid]: { stream, name } }));
          },
          onParticipantConnected: (sid, name) => {
            if (cancelled) return;
            setPeers((prev) => {
              if (prev[sid]) return prev;
              return { ...prev, [sid]: { stream: null, name } };
            });
          },
          onTrackUnsubscribed: (sid) => {
            if (cancelled) return;
            setPeers((prev) => {
              const next = { ...prev };
              delete next[sid];
              return next;
            });
          },
          onParticipantDisconnected: (sid) => {
            if (cancelled) return;
            setPeers((prev) => {
              const next = { ...prev };
              delete next[sid];
              return next;
            });
          },
          onDisconnected: () => {
            if (cancelled) return;
          },
        });
        if (cancelled) {
          disconnectFromRoom();
          return;
        }
        roomRef.current = room;
        mySidRef.current = room.localParticipant.sid;

        if (localStreamRef.current) {
          try {
            await publishLocalVideo(localStreamRef.current);
          } catch (err) {
            console.error("Loi publish local video sau connect:", err);
          }
        }

        socket.emit("join_room", {
          room: roomId,
          username: user.fullname,
          peerId: room.localParticipant.sid,
        });
      } catch (err) {
        console.error("Loi ket noi LiveKit:", err);
      }
    };

    init();

    socket.on("subtitle_update", (data) =>
      setSubtitles((prev) => ({
        ...prev,
        [data.peerId]: { asl: data.asl, speech: data.speech },
      })),
    );
    socket.on("chat_message", (msg) => setMessages((prev) => [...prev, msg]));
    socket.on("meeting_ended", (data) => {
      alert(data.message);
      window.location.href = "/home";
    });
    socket.on("timer_started", (data) => {
      setTimerEndTime(data.endTime);
      setTimeLeft(data.endTime - Date.now());
    });
    socket.on("timer_stopped", () => {
      setTimerEndTime(null);
      setTimeLeft(null);
    });

    return () => {
      cancelled = true;
      disconnectFromRoom();
      socket.off("subtitle_update");
      socket.off("chat_message");
      socket.off("meeting_ended");
      socket.off("timer_started");
      socket.off("timer_stopped");
    };
  }, [roomId, user]);



  useEffect(() => {
    if (!timerEndTime) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = timerEndTime - now;
      if (diff <= 0) {
        clearInterval(interval);
        setTimeLeft(0);
        setTimerEndTime(null);
        playBell();
      } else {
        setTimeLeft(diff);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [timerEndTime]);

  const limitWords = (text, max) => {
    const words = (text || "").split(/\s+/).filter(Boolean);
    return words.slice(-max).join(" ");
  };

  const broadcastSubtitle = (newAsl, newSpeech) => {
    const asl = limitWords(newAsl, 20);
    const speech = limitWords(newSpeech, 30);
    socket.emit("subtitle_update", {
      room: roomId,
      peerId: mySidRef.current,
      asl,
      speech,
    });
    setSubtitles((prev) => ({
      ...prev,
      [mySidRef.current]: { asl, speech },
    }));
  };

  const handleAslResult = (label, confidence) => {
    setCurrentPrediction(label);
    if (confidence < 0.85 || label === "nothing") {
      holdStartRef.current = null;
      lastLabelRef.current = "";
      setHoldProgress(0);
      return;
    }
    const now = Date.now();
    if (label !== lastLabelRef.current) {
      holdStartRef.current = now;
      lastLabelRef.current = label;
      return;
    }

    if (holdStartRef.current && now - holdStartRef.current >= 1500) {
      let newAsl = subtitles[mySidRef.current]?.asl || "";
      if (label === "space") newAsl += " ";
      else if (label === "del") newAsl = newAsl.slice(0, -1);
      else newAsl += label;

      const words = newAsl.split(" ");
      if (words.length > 20) newAsl = words.slice(words.length - 20).join(" ");
      broadcastSubtitle(newAsl, subtitles[mySidRef.current]?.speech || "");

      if (mode === "game" && !isCompleted) {
        const targetChar = targetPhrase[currentIndex];
        let isMatch =
          (targetChar === " " && label === "space") || label === targetChar;
        if (isMatch) {
          if (currentIndex < targetPhrase.length - 1)
            setCurrentIndex((prev) => prev + 1);
          else {
            setIsCompleted(true);
            newGameTimeoutRef.current = setTimeout(() => {
              startNewGame();
            }, 3000);
          }
        }
      }

      // PHASE 6: Notify whiteboard sticky note (ASL mode)
      if (aslSignCallbackRef.current) {
        aslSignCallbackRef.current(label);
      }

      holdStartRef.current = null;
      lastLabelRef.current = "";
      setHoldProgress(0);
    } else if (holdStartRef.current) {
      setHoldProgress(
        Math.min(((now - holdStartRef.current) / 1500) * 100, 100),
      );
    }
  };

  const handleSpeechResult = (transcript) =>
    broadcastSubtitle(
      subtitles[mySidRef.current]?.asl || "",
      transcript
    );
  const handleBackspaceASL = () =>
    broadcastSubtitle(
      (subtitles[mySidRef.current]?.asl || "").slice(0, -1),
      subtitles[mySidRef.current]?.speech || "",
    );
  const handleClearAll = () => broadcastSubtitle("", "");

  const sendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    socket.emit("chat_message", {
      room: roomId,
      sender: user.fullname,
      text: chatInput,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    });
    setChatInput("");
  };

  const handleLocalStreamReady = async (mediaStream) => {
    localStreamRef.current = mediaStream;
    if (roomRef.current) {
      try {
        await publishLocalVideo(mediaStream);
      } catch (err) {
        console.error("Loi publish local video:", err);
      }
    }
  };

  useEffect(() => {
    setAudioEnabled(isMicOn);
  }, [isMicOn]);

  const stopAllMedia = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    disconnectFromRoom();
    roomRef.current = null;
  };

  const handleLeaveOnly = () => {
    stopAllMedia();
    socket.emit("leave_room", {
      room: roomId,
      username: user.fullname,
      peerId: mySidRef.current,
    });
    navigate("/home");
  };

  const handleEndMeeting = () => {
    stopAllMedia();
    socket.emit("end_meeting", { room: roomId });
    navigate("/home");
  };

  const startTimer = () => {
    const durationMs =
      (parseInt(timerInput.minutes || 0) * 60 +
        parseInt(timerInput.seconds || 0)) *
      1000;
    if (durationMs > 0) {
      const endTime = Date.now() + durationMs;
      socket.emit("start_timer", { room: roomId, endTime });
      setTimerEndTime(endTime);
      setTimeLeft(durationMs);
      setShowTimerConfig(false);
    }
  };

  const formatTime = (ms) => {
    if (ms === null) return null;
    const totalSeconds = Math.ceil(ms / 1000);
    const m = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (totalSeconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const renderSubtitleText = (peerId) => {
    if (!isShowSubtitle) return null;
    const data = subtitles[peerId];
    if (!data || (!data.asl && !data.speech)) return null;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {data.asl && <span style={{ color: "#00ffea" }}>[ASL] {data.asl}</span>}
        {data.speech && (
          <span style={{ color: "#f59e0b" }}>[Voice] {data.speech}</span>
        )}
      </div>
    );
  };

  const getCurrentExampleUrl = () => {
    if (isCompleted) return "";
    const char = targetPhrase[currentIndex];
    if (char === " ")
      return `${process.env.REACT_APP_BACKEND_URL}/api/example/space`;
    return `${process.env.REACT_APP_BACKEND_URL}/api/example/${char}`;
  };

  const totalUsers = 1 + Object.keys(peers).length;
  // PHASE 5: Dynamic video grid columns
  const gridCols = useMemo(() => {
    if (isMobile) return totalUsers <= 2 ? 1 : 2;
    if (totalUsers <= 2) return 2;
    if (totalUsers <= 4) return 2;
    if (totalUsers <= 6) return 3;
    return 4;
  }, [totalUsers, isMobile]);

  return (
    <div
      style={{
        height: "100vh",
        background: "#0f172a",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* WIDGET TIMER */}
      {timeLeft !== null && (
        <div
          style={{
            position: "fixed",
            top: isMobile ? "10px" : "20px",
            left: "50%",
            transform: "translateX(-50%)",
            background: timeLeft <= 10000 ? "#ef4444" : "rgba(30, 41, 59, 0.9)",
            color: "white",
            padding: isMobile ? "6px 16px" : "10px 30px",
            borderRadius: "30px",
            fontSize: isMobile ? "16px" : "24px",
            fontWeight: "bold",
            zIndex: 10000,
            boxShadow: "0 5px 15px rgba(0,0,0,0.5)",
            border: "2px solid #00ffea",
            display: "flex",
            alignItems: "center",
            gap: isMobile ? "8px" : "15px",
          }}
        >
          ⏳ {formatTime(timeLeft)}
          {user.isTeacher && (
            <button
              onClick={() => socket.emit("stop_timer", { room: roomId })}
              style={{
                background: "transparent",
                border: "none",
                color: "white",
                cursor: "pointer",
                fontSize: isMobile ? "14px" : "18px",
              }}
            >
              ✖
            </button>
          )}
        </div>
      )}

      {/* MAIN AREA */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          padding: "10px",
          gap: "10px",
        }}
      >
        {mode === "game" && (
          <div
            style={{
              background: "#1e293b",
              borderRadius: "12px",
              padding: "10px",
              border: "1px solid #334155",
            }}
          >
            <PredictionDisplay
              targetPhrase={targetPhrase}
              currentIndex={currentIndex}
              isCompleted={isCompleted}
              currentPrediction={currentPrediction}
              exampleUrl={getCurrentExampleUrl()}
              onSkip={startNewGame}
            />
          </div>
        )}

        <div
          style={{
            flex: 1,
            display: "flex",
            gap: "10px",
            overflow: "hidden",
            flexDirection: isMobile && showChat ? "column" : "row",
          }}
        >
          {/* PHASE 5: Dynamic video grid — CSS Grid layout */}
          <div
            style={{
              flex: showWhiteboard ? 1.5 : 1,
              display: "grid",
              gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
              justifyItems: "center",
              alignItems: "stretch",
              gap: isMobile ? "8px" : "20px",
              overflowY: "auto",
              padding: isMobile ? "8px" : "20px",
            }}
          >
            <VideoTile
              isLocal={true}
              name={user.fullname}
              isAslOn={isAslOn}
              isCamOn={isCamOn}
              isMicOn={isMicOn}
              onAslResult={handleAslResult}
              subtitle={renderSubtitleText(mySidRef.current)}
              holdProgress={holdProgress}
              onLocalStreamReady={handleLocalStreamReady}
              deviceId={selectedCamera}
            />

            {Object.keys(peers).map((peerId) => (
              <VideoTile
                key={peerId}
                isLocal={false}
                name={peers[peerId].name}
                stream={peers[peerId].stream}
                subtitle={renderSubtitleText(peerId)}
              />
            ))}
          </div>

          {/* PHASE 5: Whiteboard — fullscreen overlay on mobile */}
          {showWhiteboard && (
            <div
              style={{
                flex: isMobile ? "none" : 1,
                minWidth: isMobile ? "100%" : "400px",
                maxWidth: isMobile ? "100%" : "600px",
                border: "2px solid #334155",
                borderRadius: "12px",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                ...(isMobile
                  ? {
                      position: "fixed",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      zIndex: 9999,
                      background: "#0f172a",
                      borderRadius: 0,
                    }
                  : {}),
              }}
            >
              <Whiteboard
                room={roomId}
                username={user.fullname}
                onClose={() => setShowWhiteboard(false)}
                aslSignCallbackRef={aslSignCallbackRef}
              />
            </div>
          )}

          {/* PHASE 5: Chat — fullscreen overlay on mobile */}
          {showChat && (
            <div
              style={{
                width: isMobile ? "100%" : "320px",
                background: "#1e293b",
                borderRadius: "12px",
                display: "flex",
                flexDirection: "column",
                border: "1px solid #334155",
                ...(isMobile
                  ? {
                      position: "fixed",
                      top: 0,
                      left: 0,
                      height: "100%",
                      zIndex: 9999,
                      borderRadius: 0,
                    }
                  : {}),
              }}
            >
              <div
                style={{
                  padding: "15px",
                  borderBottom: "1px solid #334155",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <h3 style={{ margin: 0, color: "white" }}>Chat</h3>
                <button
                  onClick={() => setShowChat(false)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "white",
                    cursor: "pointer",
                    fontSize: "20px",
                  }}
                >
                  ✖
                </button>
              </div>
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "15px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "15px",
                }}
              >
                {messages.map((msg, i) => {
                  const isMe = msg.sender === user.fullname;
                  return (
                    <div
                      key={i}
                      style={{
                        alignSelf: isMe ? "flex-end" : "flex-start",
                        maxWidth: "85%",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#94a3b8",
                          marginBottom: "4px",
                          textAlign: isMe ? "right" : "left",
                        }}
                      >
                        {isMe ? "You" : msg.sender} • {msg.time}
                      </div>
                      <div
                        style={{
                          background: isMe ? "#00ffea" : "#334155",
                          color: isMe ? "#000" : "#fff",
                          padding: "10px 14px",
                          borderRadius: isMe
                            ? "15px 15px 0 15px"
                            : "15px 15px 15px 0",
                          boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
                          lineHeight: "1.4",
                          wordWrap: "break-word",
                        }}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
              </div>
              <form
                onSubmit={sendMessage}
                style={{
                  padding: "10px",
                  borderTop: "1px solid #334155",
                  display: "flex",
                }}
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a message..."
                  style={{
                    flex: 1,
                    padding: "10px 15px",
                    borderRadius: "20px",
                    border: "none",
                    outline: "none",
                    background: "rgba(255,255,255,0.1)",
                    color: "white",
                  }}
                />
              </form>
            </div>
          )}
        </div>
      </div>

      {/* PHASE 5: Bottom control bar — compact on mobile */}
      <div
        style={{
          height: isMobile ? "60px" : "80px",
          background: "#1e293b",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: isMobile ? "0 10px" : "0 30px",
          zIndex: 100,
          gap: isMobile ? "4px" : "0",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: isMobile ? "4px" : "15px",
            width: isMobile ? "auto" : "380px",
            alignItems: "center",
          }}
        >
          {!isMobile && (
            <>
              <div
                style={{
                  color: "#00ffea",
                  fontSize: "24px",
                  fontFamily:
                    '\"Comic Sans MS\", \"Chalkboard SE\", \"Comic Neue\", cursive',
                  fontWeight: "bold",
                }}
              >
                EduGlyph
              </div>
              <div
                style={{
                  color: "#94a3b8",
                  borderLeft: "1px solid #334155",
                  paddingLeft: "15px",
                }}
              >
                {roomId}
              </div>
            </>
          )}

          <div style={{ display: "flex", gap: "5px", marginLeft: isMobile ? 0 : "10px" }}>
            <button onClick={handleBackspaceASL} style={isMobile ? miniBtnMobile : miniBtnStyle}>
              ⌫
            </button>
            <button
              onClick={handleClearAll}
              style={isMobile ? { ...miniBtnMobile, background: "#ef4444" } : { ...miniBtnStyle, background: "#ef4444" }}
            >
              Clear
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: isMobile ? "6px" : "15px", alignItems: "center" }}>
          <Microphone
            onSpeechResult={handleSpeechResult}
            onMicToggle={(status) => setIsMicOn(status)}
          />

          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
            }}
          >
            <button
              onClick={() => setIsCamOn(!isCamOn)}
              style={isMobile ? circleBtnMobile(isCamOn ? "#334155" : "#ef4444", "#fff") : circleBtnStyle(isCamOn ? "#334155" : "#ef4444", "#fff")}
            >
              {isCamOn ? "📹" : "🚫"}
            </button>

            {cameras.length > 1 && (
              <button
                onClick={() => setShowCamMenu(!showCamMenu)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "white",
                  cursor: "pointer",
                  marginLeft: "3px",
                  padding: "3px",
                  fontSize: isMobile ? "10px" : "inherit",
                }}
              >
                ▲
              </button>
            )}

            {showCamMenu && cameras.length > 1 && (
              <div
                style={{
                  position: "absolute",
                  bottom: isMobile ? "50px" : "60px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "12px",
                  padding: "10px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  minWidth: isMobile ? "160px" : "180px",
                  zIndex: 1000,
                  boxShadow: "0 5px 15px rgba(0,0,0,0.5)",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    color: "#94a3b8",
                    fontWeight: "bold",
                    paddingBottom: "5px",
                    borderBottom: "1px solid #334155",
                  }}
                >
                  Select Camera
                </div>
                {cameras.map((cam, idx) => (
                  <button
                    key={cam.deviceId}
                    onClick={() => {
                      setSelectedCamera(cam.deviceId);
                      setShowCamMenu(false);
                    }}
                    style={{
                      background:
                        selectedCamera === cam.deviceId
                          ? "#00ffea"
                          : "transparent",
                      color: selectedCamera === cam.deviceId ? "#000" : "#fff",
                      border: "none",
                      padding: "8px 10px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      textAlign: "left",
                      fontSize: "14px",
                    }}
                  >
                    {cam.label || `Camera ${idx + 1}`}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setIsAslOn(!isAslOn)}
            style={isMobile ? circleBtnMobile(isAslOn ? "#00ffea" : "#334155", isAslOn ? "#000" : "#fff") : circleBtnStyle(isAslOn ? "#00ffea" : "#334155", isAslOn ? "#000" : "#fff")}
          >
            ✨
          </button>
          <button
            onClick={() => setIsShowSubtitle(!isShowSubtitle)}
            style={isMobile ? circleBtnMobile(isShowSubtitle ? "#00ffea" : "#334155", isShowSubtitle ? "#000" : "#fff") : circleBtnStyle(isShowSubtitle ? "#00ffea" : "#334155", isShowSubtitle ? "#000" : "#fff")}
          >
            📝
          </button>

          {user.isTeacher && (
            <button
              onClick={() => setShowTimerConfig(true)}
              style={{
                background: "transparent",
                color: "#fbbf24",
                border: "1px solid #fbbf24",
                padding: isMobile ? "4px 8px" : "10px 15px",
                borderRadius: "25px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: isMobile ? "12px" : "inherit",
              }}
            >
              ⏱
            </button>
          )}
          <button
            onClick={() => setMode(mode === "game" ? "free" : "game")}
            style={isMobile ? circleBtnMobile(mode === "game" ? "#00ffea" : "#334155", mode === "game" ? "#000" : "#fff") : circleBtnStyle(mode === "game" ? "#00ffea" : "#334155", mode === "game" ? "#000" : "#fff")}
          >
            🎮
          </button>
          <button
            onClick={() => setShowWhiteboard(!showWhiteboard)}
            style={isMobile ? circleBtnMobile(showWhiteboard ? "#00ffea" : "#334155", showWhiteboard ? "#000" : "#fff") : circleBtnStyle(showWhiteboard ? "#00ffea" : "#334155", showWhiteboard ? "#000" : "#fff")}
          >
            🎨
          </button>
          <button
            onClick={() => setShowChat(!showChat)}
            style={isMobile ? circleBtnMobile(showChat ? "#00ffea" : "#334155", showChat ? "#000" : "#fff") : circleBtnStyle(showChat ? "#00ffea" : "#334155", showChat ? "#000" : "#fff")}
          >
            💬
          </button>
          <button
            onClick={() => setShowLeaveModal(true)}
            style={{
              background: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "25px",
              padding: isMobile ? "8px 12px" : "10px 20px",
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: isMobile ? "12px" : "inherit",
            }}
          >
            {isMobile ? "☎" : "☎ Leave"}
          </button>
        </div>
      </div>

      {/* MODAL CONFIG TIMER */}
      {showTimerConfig && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 10001,
            padding: isMobile ? "16px" : "0",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              background: "#1e293b",
              padding: isMobile ? "20px" : "30px",
              borderRadius: "15px",
              color: "white",
              width: isMobile ? "100%" : "300px",
              maxWidth: "300px",
              textAlign: "center",
              border: "1px solid #00ffea",
            }}
          >
            <h3 style={{ color: "#00ffea", marginTop: 0 }}>
              Set Timer
            </h3>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "10px",
                marginBottom: "20px",
                alignItems: "center",
              }}
            >
              <input
                type="number"
                min="0"
                value={timerInput.minutes}
                onChange={(e) =>
                  setTimerInput({ ...timerInput, minutes: e.target.value })
                }
                style={{
                  width: "50px",
                  padding: "5px",
                  background: "#334155",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                }}
              />{" "}
              min
              <input
                type="number"
                min="0"
                max="59"
                value={timerInput.seconds}
                onChange={(e) =>
                  setTimerInput({ ...timerInput, seconds: e.target.value })
                }
                style={{
                  width: "50px",
                  padding: "5px",
                  background: "#334155",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                }}
              />{" "}
              sec
            </div>
            <div
              style={{ display: "flex", gap: "10px", justifyContent: "center" }}
            >
              <button
                onClick={startTimer}
                style={modalBtnStyle("#00ffea", "#000")}
              >
                Start
              </button>
              <button
                onClick={() => setShowTimerConfig(false)}
                style={modalBtnStyle("transparent", "#fff")}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LEAVE MEETING */}
      {showLeaveModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
            padding: isMobile ? "16px" : "0",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              background: "#1e293b",
              padding: isMobile ? "20px" : "30px",
              borderRadius: "15px",
              color: "white",
              width: isMobile ? "100%" : "400px",
              maxWidth: "400px",
              textAlign: "center",
            }}
          >
            <h2>Leave meeting?</h2>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "15px",
                marginTop: "20px",
              }}
            >
              <button
                onClick={handleLeaveOnly}
                style={modalBtnStyle("#334155", "#fff")}
              >
                Leave only
              </button>
              {user.isTeacher && (
                <button
                  onClick={handleEndMeeting}
                  style={modalBtnStyle("#ef4444", "#fff")}
                >
                  End meeting for all
                </button>
              )}
              <button
                onClick={() => setShowLeaveModal(false)}
                style={{
                  ...modalBtnStyle("transparent", "#fff"),
                  border: "1px solid #64748b",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Style Functions
const circleBtnStyle = (bg, color) => ({
  background: bg,
  color: color,
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
});
const modalBtnStyle = (bg, color) => ({
  padding: "12px",
  borderRadius: "8px",
  background: bg,
  color: color,
  border: "none",
  cursor: "pointer",
  fontWeight: "bold",
});
const miniBtnStyle = {
  background: "#475569",
  color: "white",
  border: "none",
  padding: "8px 12px",
  cursor: "pointer",
  borderRadius: "8px",
  fontWeight: "bold",
  fontSize: "14px",
};
// PHASE 5: Smaller buttons for mobile
const miniBtnMobile = {
  background: "#475569",
  color: "white",
  border: "none",
  padding: "4px 8px",
  cursor: "pointer",
  borderRadius: "6px",
  fontWeight: "bold",
  fontSize: "11px",
};
const circleBtnMobile = (bg, color) => ({
  background: bg,
  color: color,
  border: "none",
  width: "36px",
  height: "36px",
  borderRadius: "50%",
  fontSize: "14px",
  cursor: "pointer",
  transition: "0.2s",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
});
