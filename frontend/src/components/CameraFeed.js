import React, { useRef, useEffect } from 'react';

const CameraFeed = ({ onCapture }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    async function setupCamera() {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    }
    setupCamera();

    const interval = setInterval(() => {
      if (videoRef.current && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0, 640, 480);
        onCapture(canvasRef.current);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [onCapture]);

  return (
    <div className="mb-4">
      <video ref={videoRef} className="w-full max-w-md" />
      <canvas ref={canvasRef} width="640" height="480" className="hidden" />
    </div>
  );
};

export default CameraFeed;