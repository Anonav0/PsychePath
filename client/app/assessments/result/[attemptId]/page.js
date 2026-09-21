"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import assessmentService from "../../../../services/assessmentService";

export default function AssessmentResultPage() {
  const { attemptId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);
        const res = await assessmentService.getAttemptResult(attemptId);
        if (res.success) {
          setResult(res.data);
        }
      } catch (err) {
        setError(err.message || "Failed to load assessment result");
      } finally {
        setLoading(false);
      }
    };

    if (attemptId) fetchResult();
  }, [attemptId]);

  if (loading) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "4rem",
          color: "var(--text-muted)",
        }}
      >
        Calculating and loading psychometric scores...
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="assessment-page-container">
        <div className="alert-box alert-error">
          {error || "Result not found"}
        </div>
        <Link
          href="/assessments"
          className="btn-secondary-small"
          style={{ display: "inline-block", marginTop: "1rem" }}
        >
          ← Back to Assessments
        </Link>
      </div>
    );
  }

  const scores = result.scores || {};
  const dimensionEntries = Object.entries(scores);

  // Compute overall average percentage
  const overallAverage =
    dimensionEntries.length > 0
      ? Math.round(
          dimensionEntries.reduce((sum, [, val]) => sum + Number(val || 0), 0) /
            dimensionEntries.length,
        )
      : 0;

  const formatDimName = (str) =>
    str.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());

  return (
    <div className="assessment-page-container">
      <div style={{ marginBottom: "1.5rem" }}>
        <Link
          href="/assessments"
          style={{
            color: "var(--text-muted)",
            fontSize: "0.85rem",
            textDecoration: "none",
          }}
        >
          ← Back to Assessments
        </Link>
      </div>

      <div className="result-card">
        <div className="result-hero">
          <div className="score-badge-circle">
            <span className="score-number">{overallAverage}%</span>
            <span className="score-label">Alignment</span>
          </div>

          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              marginBottom: "0.5rem",
            }}
          >
            Assessment Result
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            {result.assessment?.title || "Psychometric Evaluation"}
          </p>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Submitted:{" "}
            {result.submittedAt
              ? new Date(result.submittedAt).toLocaleDateString()
              : "Recently"}
          </span>
        </div>

        {/* Educational Result Summary */}
        {result.resultSummary && (
          <div
            style={{
              background: "#eef2ff",
              border: "1px solid #c7d2fe",
              borderRadius: "12px",
              padding: "1.5rem",
              marginBottom: "2rem",
            }}
          >
            <h2
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                color: "#4338ca",
                marginBottom: "0.5rem",
              }}
            >
              Educational Diagnostic Summary
            </h2>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "0.925rem",
                lineHeight: 1.6,
              }}
            >
              {result.resultSummary}
            </p>
          </div>
        )}

        {/* Dimension Breakdown */}
        <div style={{ marginBottom: "2rem" }}>
          <h2
            style={{
              fontSize: "1.2rem",
              fontWeight: 700,
              marginBottom: "1rem",
            }}
          >
            Dimension Breakdown
          </h2>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            {dimensionEntries.map(([dimKey, dimScore]) => {
              const numScore = Number(dimScore || 0);
              return (
                <div key={dimKey} className="dimension-row">
                  <div className="dimension-meta">
                    <span style={{ color: "var(--text-primary)" }}>
                      {formatDimName(dimKey)}
                    </span>
                    <span
                      style={{ color: numScore >= 70 ? "#059669" : "#4f46e5" }}
                    >
                      {numScore}%
                    </span>
                  </div>
                  <div className="dim-bar-track">
                    <div
                      className="dim-bar-fill"
                      style={{ width: `${numScore}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: "1.5rem",
            borderTop: "1px solid var(--border-color)",
          }}
        >
          <Link href="/assessments" className="btn-secondary-small">
            ← Explore Assessments
          </Link>

          <Link href="/" className="btn-primary-small">
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
