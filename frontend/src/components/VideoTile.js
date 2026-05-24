import React, { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import aslEngine from "../services/aslEngine";

export default function VideoTile({
  stream,
  isLocal,
  name,
  isAslOn,
  isCamOn = true,
  isMicOn = false,
  onAslResult,
  subtitle,
  holdProgress = 0,
  deviceId,
}) {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const [mediaStream, setMediaStream] = useState(null);
  const mediaStreamRef = useRef(null);
  const streamRef = useRef(stream);

  useEffect(() => {
    if (!isLocal && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, isLocal]);

  useEffect(() => {
    streamRef.current = stream;
  });

  useEffect(() => {
    if (!isLocal || !isAslOn) return;
    const video = webcamRef.current?.video;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    aslEngine.initialize();

    const ctx = canvas.getContext("2d");
    let animFrameId;

    const predictFrame = async () => {
      animFrameId = requestAnimationFrame(predictFrame);

      if (video.readyState !== 4) return;

      if (!isCamOn) {
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        return;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const result = await aslEngine.predictFromVideo(video);

      if (result.landmarks) {
        aslEngine.drawSkeleton(ctx, result.landmarks, canvas.width, canvas.height);
      }

      if (result.label && onAslResult) {
        onAslResult(result.label, result.confidence);
      }
    };

    predictFrame();

    return () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
    };
  }, [isLocal, isAslOn, isCamOn, onAslResult]);

  useEffect(() => {
    if (isLocal && !isAslOn && isCamOn && mediaStream && videoRef.current) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [isLocal, isAslOn, isCamOn, mediaStream]);

  useEffect(() => {
    if (!isLocal) return;
    if (!isCamOn || !mediaStream) return;

    let outputStream;
    if (isAslOn && canvasRef.current) {
      outputStream = canvasRef.current.captureStream(30);
    } else {
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (!videoTrack) return;
      outputStream = new MediaStream([videoTrack.clone()]);
    }

    const audioTracks = mediaStream.getAudioTracks();
    if (audioTracks.length > 0) {
      outputStream.addTrack(audioTracks[0].clone());
    }

    streamRef.current(outputStream);

    return () => {
      outputStream.getTracks().forEach((t) => t.stop());
    };
  }, [isLocal, isAslOn, isCamOn, mediaStream]);

  useEffect(() => {
    mediaStreamRef.current = mediaStream;
  }, [mediaStream]);

  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (isLocal && mediaStream) {
      mediaStream.getAudioTracks().forEach((track) => {
        track.enabled = isMicOn;
      });
    }
  }, [isLocal, isMicOn, mediaStream]);

  const showCameraOff = !isCamOn && isLocal;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "4/3",
        background: "#1e293b",
        borderRadius: "12px",
        overflow: "hidden",
        border: isLocal ? "3px solid #00ffea" : "2px solid #334155",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          background: "rgba(0,0,0,0.7)",
          color: "white",
          padding: "4px 10px",
          borderRadius: "6px",
          zIndex: 10,
          fontSize: "14px",
        }}
      >
        {name} {isLocal ? "(Ban)" : ""} {isLocal && !isMicOn && " TAT MIC"}
      </div>

      {isLocal ? (
        <>
          <Webcam
            key={`cam-${isCamOn}-${deviceId}`}
            ref={webcamRef}
            audio={true}
            muted={true}
            onUserMedia={(s) => setMediaStream(s)}
            style={{ display: "none" }}
            videoConstraints={isCamOn ? {
              deviceId: deviceId ? { exact: deviceId } : undefined,
              facingMode: "user",
            } : false}
          />

          {isAslOn && isCamOn && (
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: "scaleX(-1)",
              }}
            />
          )}

          {!isAslOn && isCamOn && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: "scaleX(-1)",
              }}
            />
          )}

          {showCameraOff && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                fontSize: "3rem",
              }}
            >
              {"\uD83D\uDEAB"}
            </div>
          )}
        </>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: "scaleX(-1)",
          }}
        />
      )}

      {subtitle && (
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(0,0,0,0.8)",
            padding: "8px 20px",
            borderRadius: "20px",
            fontSize: isLocal ? "22px" : "16px",
            fontWeight: "bold",
            width: "max-content",
            maxWidth: "90%",
            textAlign: "center",
            zIndex: 10,
          }}
        >
          {subtitle}
        </div>
      )}

      {isLocal && holdProgress > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            height: "8px",
            width: `${holdProgress}%`,
            backgroundColor: "#00ffea",
            transition: "width 0.1s linear",
            zIndex: 20,
          }}
        />
      )}
    </div>
  );
}
