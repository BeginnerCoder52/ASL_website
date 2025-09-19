import React, { useState } from 'react';
import CameraFeed from './components/CameraFeed';
import PredictionDisplay from './components/PredictionDisplay';
import './App.css';

function App() {
  const [prediction, setPrediction] = useState(null);

  return (
    <div className="App">
      <h1>ASL Caption Prediction</h1>
      <CameraFeed setPrediction={setPrediction} />
      <PredictionDisplay prediction={prediction} />
    </div>
  );
}

export default App;