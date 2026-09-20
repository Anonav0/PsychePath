"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import assessmentService from "../../../services/assessmentService";
import authService from "../../../services/authService";

export default function AssessmentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [assessment, setAssessment] = useState(null);
  const [activeAttempt, setActiveAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const user = authService.getUser();

  useEffect(() => {
    const loadDetails = async () => {
      try {
        setLoading(true);
        const res = await assessmentService.getAssessmentById(id);
        if (res.success) {
          setAssessment(res.data);
        }

        if (user) {
          try {
            const actRes = await assessmentService.getActiveAttempt(id);
            if (actRes.success && actRes.data) {
              setActiveAttempt(actRes.data);
            }
          } catch (e) {
            // No active attempt found
          }
        }
      } catch (err) {
        setError(err.message || "Failed to load assessment details");
      } finally {
        setLoading(false);
      }
    };

    if (id) loadDetails();
  }, [id]);

  const handleStartOrResume = async () => {
    if (!user) {
      router.push(`/login?redirect=/assessments/${id}`);
      return;
    }

    try {
      setSubmitting(true);
      await assessmentService.startAttempt(id);
      router.push(`/assessments/${id}/take`);
    } catch (err) {
      setError(err.message || "Failed to start assessment");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "4rem",
          color: "var(--text-muted)",
        }}
      >
        Loading assessment details...
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="assessment-page-container">
        <div className="alert-box alert-error">
          {error || "Assessment not found"}
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

      <div className="quiz-container">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "1rem",
          }}
        >
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              color: "var(--text-primary)",
            }}
          >
            {assessment.title}
          </h1>
          <span
            className="dim-tag"
            style={{ fontSize: "0.8rem", padding: "0.3rem 0.75rem" }}
          >
            {assessment.type}
          </span>
        </div>

        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "1rem",
            lineHeight: 1.6,
            marginBottom: "1.5rem",
          }}
        >
          {assessment.description}
        </p>

        {assessment.instructions && (
          <div
            style={{
              background: "var(--bg-surface-elevated)",
              borderRadius: "8px",
              padding: "1.25rem",
              marginBottom: "1.5rem",
              borderLeft: "4px solid var(--primary)",
            }}
          >
            <h3
              style={{
                fontSize: "0.95rem",
                fontWeight: 700,
                marginBottom: "0.5rem",
                color: "#a5b4fc",
              }}
            >
              Assessment Instructions
            </h3>
            <p
              style={{
                fontSize: "0.9rem",
                color: "var(--text-secondary)",
                lineHeight: 1.5,
              }}
            >
              {assessment.instructions}
            </p>
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "1rem",
            marginBottom: "2rem",
          }}
        >
          <div
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              padding: "1rem",
              borderRadius: "8px",
              border: "1px solid var(--border-color)",
            }}
          >
            <span
              style={{
                fontSize: "0.8rem",
                color: "var(--text-muted)",
                display: "block",
              }}
            >
              Estimated Time
            </span>
            <strong
              style={{ fontSize: "1.2rem", color: "var(--text-primary)" }}
            >
              {assessment.estimatedDuration} Minutes
            </strong>
          </div>
          <div
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              padding: "1rem",
              borderRadius: "8px",
              border: "1px solid var(--border-color)",
            }}
          >
            <span
              style={{
                fontSize: "0.8rem",
                color: "var(--text-muted)",
                display: "block",
              }}
            >
              Question Count
            </span>
            <strong
              style={{ fontSize: "1.2rem", color: "var(--text-primary)" }}
            >
              {assessment.questionCount || 12} Questions
            </strong>
          </div>
          <div
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              padding: "1rem",
              borderRadius: "8px",
              border: "1px solid var(--border-color)",
            }}
          >
            <span
              style={{
                fontSize: "0.8rem",
                color: "var(--text-muted)",
                display: "block",
              }}
            >
              Evaluation Mode
            </span>
            <strong
              style={{ fontSize: "1.2rem", color: "var(--text-primary)" }}
            >
              Psychometric
            </strong>
          </div>
        </div>

        {assessment.dimensions && assessment.dimensions.length > 0 && (
          <div style={{ marginBottom: "2rem" }}>
            <h3
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                marginBottom: "0.75rem",
                color: "var(--text-primary)",
              }}
            >
              Measured Dimensions
            </h3>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              {assessment.dimensions.map((dim) => (
                <div
                  key={dim.key}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    padding: "0.75rem 1rem",
                    background: "rgba(255, 255, 255, 0.02)",
                    borderRadius: "6px",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <strong style={{ fontSize: "0.9rem", color: "#a5b4fc" }}>
                    {dim.name}
                  </strong>
                  {dim.description && (
                    <span
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--text-muted)",
                        marginTop: "0.2rem",
                      }}
                    >
                      {dim.description}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "1rem",
            alignItems: "center",
          }}
        >
          <button
            onClick={handleStartOrResume}
            disabled={submitting}
            className="submit-btn"
            style={{ width: "auto", padding: "0.75rem 2rem" }}
          >
            {submitting
              ? "Preparing Assessment..."
              : activeAttempt
                ? "Resume Active Attempt →"
                : "Begin Assessment →"}
          </button>
        </div>
      </div>
    </div>
  );
}
