import * as tf from '@tensorflow/tfjs';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [5, 6], [6, 7], [7, 8],
  [9, 10], [10, 11], [11, 12],
  [13, 14], [14, 15], [15, 16],
  [17, 18], [18, 19], [19, 20],
  [0, 5], [5, 9], [9, 13], [13, 17], [0, 17],
];

const CONNECTION_COLORS = {
  thumb: '#ff0000',
  index: '#00ff00',
  middle: '#0000ff',
  ring: '#ffff00',
  pinky: '#ff00ff',
  palm: '#ffffff',
};

function getConnectionColor(startIdx, endIdx) {
  if ((startIdx >= 1 && startIdx <= 4) || (endIdx >= 1 && endIdx <= 4)) return CONNECTION_COLORS.thumb;
  if ((startIdx >= 5 && startIdx <= 8) || (endIdx >= 5 && endIdx <= 8)) return CONNECTION_COLORS.index;
  if ((startIdx >= 9 && startIdx <= 12) || (endIdx >= 9 && endIdx <= 12)) return CONNECTION_COLORS.middle;
  if ((startIdx >= 13 && startIdx <= 16) || (endIdx >= 13 && endIdx <= 16)) return CONNECTION_COLORS.ring;
  if ((startIdx >= 17 && startIdx <= 20) || (endIdx >= 17 && endIdx <= 20)) return CONNECTION_COLORS.pinky;
  return CONNECTION_COLORS.palm;
}

class AslEngine {
  constructor() {
    this.handLandmarker = null;
    this.model = null;
    this.labels = null;
    this.initialized = false;
    this.initFailed = false;
    this.initPromise = null;
    this.retryTimeout = null;
  }

  async initialize() {
    if (this.initialized) return;
    if (this.initFailed) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this._init();
    return this.initPromise;
  }

  async _init() {
    try {
      const labelsRes = await fetch('/labels.json');
      this.labels = await labelsRes.json();

      this.model = await tf.loadLayersModel('/tfjs_model/model.json');

      const wasmFileset = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm'
      );

      this.handLandmarker = await HandLandmarker.createFromOptions(wasmFileset, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 1,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      this.initialized = true;
      console.log('Client-side ASL engine initialized successfully');
    } catch (err) {
      this.initPromise = null;
      this.initFailed = true;
      console.error('ASL engine init failed, will retry in 30s:', err);
      this.retryTimeout = setTimeout(() => {
        this.initFailed = false;
        this.retryTimeout = null;
      }, 30000);
    }
  }

  async predictFromVideo(video) {
    if (!this.initialized) {
      if (this.initFailed) {
        return { label: 'No Hand', confidence: 0, landmarks: null };
      }
      try {
        await this.initialize();
      } catch {
        return { label: 'No Hand', confidence: 0, landmarks: null };
      }
    }

    if (!this.handLandmarker || !this.model) {
      return { label: 'No Hand', confidence: 0, landmarks: null };
    }

    try {
      const result = this.handLandmarker.detectForVideo(video, performance.now());

      if (!result.landmarks || result.landmarks.length === 0) {
        return { label: 'No Hand', confidence: 0, landmarks: null };
      }

      const landmarks = result.landmarks[0];
      const features = [];
      for (const lm of landmarks) {
        features.push(lm.x, lm.y);
      }

      const inputTensor = tf.tensor2d([features]);
      const prediction = this.model.predict(inputTensor);
      const probabilities = prediction.dataSync();
      const probabilitiesArr = Array.from(probabilities);
      const maxIdx = probabilitiesArr.indexOf(Math.max(...probabilitiesArr));
      const confidence = probabilitiesArr[maxIdx];
      const label = this.labels[maxIdx.toString()] || 'Unknown';

      inputTensor.dispose();
      prediction.dispose();

      return { label, confidence, landmarks };
    } catch (err) {
      console.error('ASL prediction error:', err);
      return { label: 'No Hand', confidence: 0, landmarks: null };
    }
  }

  drawSkeleton(ctx, landmarks, width, height) {
    for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
      const p1 = landmarks[startIdx];
      const p2 = landmarks[endIdx];
      ctx.beginPath();
      ctx.moveTo(p1.x * width, p1.y * height);
      ctx.lineTo(p2.x * width, p2.y * height);
      ctx.strokeStyle = getConnectionColor(startIdx, endIdx);
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    for (const lm of landmarks) {
      ctx.beginPath();
      ctx.arc(lm.x * width, lm.y * height, 5, 0, 2 * Math.PI);
      ctx.fillStyle = '#ff0000';
      ctx.fill();
    }

    const xCoords = landmarks.map(lm => lm.x * width);
    const yCoords = landmarks.map(lm => lm.y * height);
    const xMin = Math.min(...xCoords) - 20;
    const xMax = Math.max(...xCoords) + 20;
    const yMin = Math.min(...yCoords) - 20;
    const yMax = Math.max(...yCoords) + 20;

    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.strokeRect(xMin, yMin, xMax - xMin, yMax - yMin);
  }

  isReady() {
    return this.initialized;
  }
}

const aslEngine = new AslEngine();
export default aslEngine;
