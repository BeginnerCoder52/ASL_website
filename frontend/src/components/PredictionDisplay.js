import React from "react";

export default function PredictionDisplay({
  target,
  status,
  onNext,
  exampleUrl,
  subtitle,
  onClearSubtitle,
}) {
  const bg =
    status.state === "correct"
      ? "rgba(50,200,100,0.9)"
      : status.state === "incorrect"
      ? "rgba(220,80,80,0.9)"
      : "rgba(255,255,255,0.9)";

  return (
    <div className="prediction-panel">
      <div className="target-box" style={{ background: bg }}>
        <div className="target-label">{target}</div>
        <div className="status-text">
          {status.state === "correct"
            ? "CORRECT"
            : status.state === "incorrect"
            ? "NOT CORRECT"
            : "WAITING..."}
        </div>
        {status.predicted && (
          <div className="predicted">
            Predicted: {status.predicted} (
            {(status.confidence * 100 || 0).toFixed(0)}%)
          </div>
        )}

        {/* example image for the target */}
        {exampleUrl ? (
          <img
            src={exampleUrl}
            alt={target}
            style={{
              width: 120,
              height: 120,
              objectFit: "contain",
              marginTop: 8,
              borderRadius: 6,
            }}
          />
        ) : (
          <div
            style={{
              width: 120,
              height: 120,
              marginTop: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#666",
            }}
          >
            No example
          </div>
        )}
      </div>
      <button className="next-btn" onClick={onNext}>
        Next
      </button>

      {/* subtitle overlay (center of screen) */}
      {/* <div className="subtitle-overlay">{subtitle || ""}</div> */}

      {/* Clear Subtitle button bottom-right */}
      <button className="clear-subtitle-btn" onClick={onClearSubtitle}>
        Clear Subtitle
      </button>
    </div>
  );
}
