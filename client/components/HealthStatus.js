"use client";

import { useState, useEffect, useCallback } from "react";
import { checkBackendHealth } from "../services/healthService";
import { API_BASE_URL } from "../services/api";

export default function HealthStatus() {
  const [status, setStatus] = useState("loading"); // 'loading' | 'connected' | 'error'
  const [healthData, setHealthData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [latency, setLatency] = useState(null);

  const verifyHealth = useCallback(async () => {
    setStatus("loading");
    setErrorMessage("");
    const startTime = performance.now();

    try {
      const response = await checkBackendHealth();
      const endTime = performance.now();
      setLatency(Math.round(endTime - startTime));
      setHealthData(response);
      setStatus("connected");
    } catch (err) {
      setStatus("error");
      setHealthData(null);
      setErrorMessage(
        err.message ||
          "Unable to establish connection to backend. Ensure server is running.",
      );
    }
  }, []);

  useEffect(() => {
    verifyHealth();
  }, [verifyHealth]);

  return (
    <div className="status-card">
      <div className="status-header">
        <h3 className="status-title">System Connectivity</h3>
        <button
          onClick={verifyHealth}
          className="refresh-btn"
          disabled={status === "loading"}
          title="Re-check API health"
        >
          {status === "loading" ? "Checking..." : "Refresh Status"}
        </button>
      </div>

      <div className="status-indicator-container">
        <div className="indicator-row">
          <span className="indicator-label">Backend Status:</span>
          {status === "loading" && (
            <span className="badge badge-loading">
              <span className="dot dot-loading"></span> Checking...
            </span>
          )}
          {status === "connected" && (
            <span className="badge badge-success">
              <span className="dot dot-success"></span> Connected
            </span>
          )}
          {status === "error" && (
            <span className="badge badge-error">
              <span className="dot dot-error"></span> Disconnected
            </span>
          )}
        </div>
      </div>

      <div className="status-details">
        <div className="detail-item">
          <span className="detail-key">API Base URL:</span>
          <code className="detail-val">{API_BASE_URL}</code>
        </div>

        {status === "connected" && healthData && (
          <>
            <div className="detail-item">
              <span className="detail-key">API Message:</span>
              <span className="detail-val">{healthData.message}</span>
            </div>
            <div className="detail-item">
              <span className="detail-key">Database State:</span>
              <span className={`detail-val db-state-${healthData.database}`}>
                {healthData.database || "active"}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-key">Server Timestamp:</span>
              <span className="detail-val">{healthData.timestamp}</span>
            </div>
            {latency !== null && (
              <div className="detail-item">
                <span className="detail-key">Response Latency:</span>
                <span className="detail-val">{latency} ms</span>
              </div>
            )}
          </>
        )}

        {status === "error" && (
          <div className="error-box">
            <p className="error-text">
              <strong>Connection Error:</strong> {errorMessage}
            </p>
            <p className="error-hint">
              Tip: Verify that the backend server is running on port 5000 (
              <code>cd server && npm run dev</code>).
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
