import React from 'react';

const PredictionDisplay = ({ predictions }) => {
  return (
    <div className="bg-gray-100 p-4 rounded">
      <h2 className="text-xl font-semibold mb-2">Predictions</h2>
      <ul>
        {predictions.map((pred, idx) => (
          <li key={idx} className="mb-1">
            {pred.prediction} - {new Date(pred.timestamp).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PredictionDisplay;