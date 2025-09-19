import React from 'react';

const PredictionDisplay = ({ prediction }) => {
  if (!prediction) return null;

  return (
    <div>
      <h3>Caption: {prediction.caption}</h3>
      <div>
        {prediction.aslImages &&
          prediction.aslImages.map((img, idx) => (
            <img
              key={idx}
              src={`/static/dataset/${img}`}
              alt={`ASL ${idx}`}
              style={{ width: '64px', height: '64px', margin: '5px' }}
            />
          ))}
      </div>
    </div>
  );
};

export default PredictionDisplay;