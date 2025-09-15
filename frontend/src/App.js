import React, { useEffect, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import CameraFeed from './components/CameraFeed';
import PredictionDisplay from './components/PredictionDisplay';
import './App.css';

const App = () => {
  const [model, setModel] = useState(null);
  const [predictions, setPredictions] = useState([]);

  useEffect(() => {
    async function loadModel() {
      const loadedModel = await tf.loadLayersModel('http://localhost:5000/models/asl_model/model.json');
      setModel(loadedModel);
    }
    loadModel();

    fetch('http://localhost:5000/predictions')
      .then(res => res.json())
      .then(data => setPredictions(data));
  }, []);

  const handlePrediction = async (image) => {
    if (!model) return;
    const imgTensor = tf.browser.fromPixels(image, 1).resizeNearestNeighbor([64, 64]).div(255.0).expandDims();
    const prediction = await model.predict(imgTensor).data();
    const classIdx = prediction.indexOf(Math.max(...prediction));
    const classes = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const result = classes[classIdx];

    fetch('http://localhost:5000/predictions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prediction: result })
    });

    setPredictions(prev => [...prev, { prediction: result, timestamp: new Date().toISOString() }]);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">ASL Translator</h1>
      <CameraFeed onCapture={handlePrediction} />
      <PredictionDisplay predictions={predictions} />
    </div>
  );
};

export default App;