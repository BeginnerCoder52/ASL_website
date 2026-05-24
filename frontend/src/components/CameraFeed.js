import React, { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import aslEngine from "../services/aslEngine";

export default function CameraFeed({ onResult }) {
  const webcamRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);

  useEffect(() => {
    if (!cameraReady) return;
    const video = webcamRef.current?.video;
    if (!video) return;

    aslEngine.initialize();

    let animFrameId;

    const predictFrame = async () => {
      animFrameId = requestAnimationFrame(predictFrame);

      if (video.readyState !== 4) return;

      const result = await aslEngine.predictFromVideo(video);

      if (result.label && onResult) {
        onResult(result.label, result.confidence, result.landmarks);
      }
    };

    predictFrame();

    return () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
    };
  }, [cameraReady, onResult]);

  return (
    <div className="relative w-full max-w-[640px] mx-auto border-2 border-gray-500 rounded-lg overflow-hidden bg-black">
      <Webcam
        ref={webcamRef}
        audio={false}
        mirrored={true}
        className="block w-full h-auto"
        screenshotFormat="image/jpeg"
        videoConstraints={{
          width: 640,
          height: 480,
          facingMode: "user",
        }}
        onUserMedia={() => setCameraReady(true)}
      />

      {!cameraReady && (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-white bg-gray-900 z-10">
          Dang khoi dong camera...
        </div>
      )}
    </div>
  );
}
