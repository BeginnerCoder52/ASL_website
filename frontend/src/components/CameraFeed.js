// import React, { useRef, useEffect } from 'react';

// const CameraFeed = ({ onCapture }) => {
//   const videoRef = useRef(null);
//   const canvasRef = useRef(null);

//   useEffect(() => {
//     async function setupCamera() {
//       const stream = await navigator.mediaDevices.getUserMedia({ video: true });
//       videoRef.current.srcObject = stream;
//       videoRef.current.play();
//     }
//     setupCamera();

//     const interval = setInterval(() => {
//       if (videoRef.current && canvasRef.current) {
//         const ctx = canvasRef.current.getContext('2d');
//         ctx.drawImage(videoRef.current, 0, 0, 640, 480);
//         onCapture(canvasRef.current);
//       }
//     }, 1000);

//     return () => clearInterval(interval);
//   }, [onCapture]);

//   return (
//     <div className="mb-4">
//       <video ref={videoRef} className="w-full max-w-md" />
//       <canvas ref={canvasRef} width="640" height="480" className="hidden" />
//     </div>
//   );
// };

// export default CameraFeed;

import React, { useRef } from 'react';
import axios from 'axios';

const CameraFeed = ({ setPrediction }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startCamera = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      })
      .catch((err) => {
        console.error('Error accessing camera: ', err);
      });
  };

  const captureImage = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const width = video.videoWidth;
    const height = video.videoHeight;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob((blob) => {
      const formData = new FormData();
      formData.append('image', blob, 'capture.jpg');
      axios
        .post('/api/predict', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((response) => {
          setPrediction(response.data);
        })
        .catch((error) => {
          console.error('Prediction error:', error);
        });
    }, 'image/jpeg');
  };

  return (
    <div>
      <button onClick={startCamera}>Start Camera</button>
      <br />
      <video ref={videoRef} style={{ width: '400px' }} />
      <br />
      <button onClick={captureImage}>Capture &amp; Predict</button>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default CameraFeed;