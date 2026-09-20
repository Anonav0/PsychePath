"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import assessmentService from "../../services/assessmentService";
import authService from "../../services/authService";

export default function AssessmentsPage() {
  const [assessments, setAssessments] = useState([]);
  const [myAttempts, setMyAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const user = authService.getUser();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await assessmentService.getAssessments();
        if (res.success) {
          setAssessments(res.data);
        }

        if (user) {
          try {
            const attemptsRes = await assessmentService.getMyAttempts();
            if (attemptsRes.success) {
              setMyAttempts(attemptsRes.data);
            }
          } catch (e) {
            // Ignore attempt fetch error if guest
          }
        }
      } catch (err) {
        setError(err.message || "Failed to load assessments");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="assessment-page-container">
      <div style={{ marginBottom: "2rem" }}>
        <h1
          style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "0.5rem" }}
        >
          Psychometric Assessments
        </h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Standardized psychometric and learning style diagnostics to determine
          your cognitive strengths and personalized learning journey.
        </p>
      </div>

      {loading && (
        <div
          style={{
            textAlign: "center",
            padding: "3rem",
            color: "var(--text-muted)",
          }}
        >
          Loading assessments...
        </div>
      )}

      {error && (
        <div
          className="alert-box alert-error"
          style={{ marginBottom: "1.5rem" }}
        >
          {error}
        </div>
      )}

      {!loading && assessments.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "3rem",
            color: "var(--text-muted)",
          }}
        >
          No active assessments available at this time.
        </div>
      )}

      <div className="assessment-grid">
        {assessments.map((item) => (
          <div key={item._id} className="assessment-card">
            <div>
              <h2 className="assessment-title">{item.title}</h2>
              <p className="assessment-desc">{item.description}</p>

              {item.dimensions && item.dimensions.length > 0 && (
                <div className="assessment-tags">
                  {item.dimensions.map((dim) => (
                    <span key={dim.key} className="dim-tag">
                      {dim.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="assessment-footer">
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                ⏱ {item.estimatedDuration} mins • {item.questionCount || 12}{" "}
                Questions
              </span>
              <Link
                href={`/assessments/${item._id}`}
                className="btn-primary-small"
                style={{ padding: "0.5rem 1rem" }}
              >
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>

      {user && myAttempts.length > 0 && (
        <div style={{ marginTop: "3.5rem" }}>
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              marginBottom: "1rem",
            }}
          >
            Your Assessment History
          </h2>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
          >
            {myAttempts.map((att) => (
              <div
                key={att._id}
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "10px",
                  padding: "1rem 1.25rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <h3
                    style={{
                      fontSize: "1rem",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                    }}
                  >
                    {att.assessment?.title || "Assessment"}
                  </h3>
                  <span
                    style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}
                  >
                    Status:{" "}
                    <strong
                      style={{
                        color:
                          att.status === "COMPLETED" ? "#34d399" : "#fbbf24",
                      }}
                    >
                      {att.status}
                    </strong>{" "}
                    • {new Date(att.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {att.status === "COMPLETED" ? (
                  <Link
                    href={`/assessments/result/${att._id}`}
                    className="btn-secondary-small"
                  >
                    View Results
                  </Link>
                ) : (
                  <Link
                    href={`/assessments/${att.assessment?._id || att.assessment}/take`}
                    className="btn-primary-small"
                  >
                    Resume
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
