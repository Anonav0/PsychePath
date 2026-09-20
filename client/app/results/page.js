"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import authService from "../../services/authService";
import assessmentService from "../../services/assessmentService";
import profileService from "../../services/profileService";
import ProgressBar from "../../components/ui/ProgressBar";
import StatusBadge from "../../components/ui/StatusBadge";
import EmptyState from "../../components/ui/EmptyState";

function ResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedAttemptId = searchParams.get("attemptId");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completedAttempts, setCompletedAttempts] = useState([]);
  const [selectedAttemptId, setSelectedAttemptId] = useState(null);
  const [result, setResult] = useState(null);
  const [profile, setProfile] = useState(null);
  const [resultLoading, setResultLoading] = useState(false);

  useEffect(() => {
    const user = authService.getUser();
    if (!user) {
      router.push("/login?redirect=/results");
      return;
    }

    const initData = async () => {
      try {
        setLoading(true);
        const [attemptsRes, profileRes] = await Promise.allSettled([
          assessmentService.getMyAttempts(),
          profileService.getMyProfile(),
        ]);

        let attempts = [];
        if (attemptsRes.status === "fulfilled" && attemptsRes.value?.success) {
          attempts = attemptsRes.value.data || [];
        }

        const completed = attempts.filter((a) => a.status === "COMPLETED");
        setCompletedAttempts(completed);

        if (profileRes.status === "fulfilled" && profileRes.value?.success) {
          setProfile(profileRes.value.data);
        }

        if (completed.length > 0) {
          const targetId =
            requestedAttemptId &&
            completed.some((a) => a._id === requestedAttemptId)
              ? requestedAttemptId
              : completed[0]._id;
          setSelectedAttemptId(targetId);
        }
      } catch (err) {
        setError(err.message || "Failed to load assessment results");
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [router, requestedAttemptId]);

  useEffect(() => {
    if (!selectedAttemptId) return;

    const loadAttemptResult = async () => {
      try {
        setResultLoading(true);
        const res = await assessmentService.getAttemptResult(selectedAttemptId);
        if (res?.success) {
          setResult(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch detailed result", err);
      } finally {
        setResultLoading(false);
      }
    };

    loadAttemptResult();
  }, [selectedAttemptId]);

  if (loading) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "4rem",
          color: "var(--text-muted)",
        }}
      >
        Loading assessment results...
      </div>
    );
  }

  if (completedAttempts.length === 0) {
    return (
      <div className="assessment-page-container">
        <div style={{ marginBottom: "1.5rem" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800 }}>
            Assessment Results
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            Uncover your cognitive strengths, learning preferences, and skill
            alignment.
          </p>
        </div>

        <EmptyState
          icon="📊"
          title="No Assessment Results Found"
          description="You have not completed any diagnostic assessments yet. Complete an assessment to uncover your psychometric profile, identify learning strengths, and generate customized curriculum recommendations."
          actionText="Take an Assessment"
          actionHref="/assessments"
        />
      </div>
    );
  }

  const scores = result?.scores || {};
  const dimensionEntries = Object.entries(scores);

  const formatDimName = (str) =>
    str.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());

  // Derive strengths and growth areas
  const strengths =
    profile?.strengths?.length > 0
      ? profile.strengths
      : dimensionEntries
          .filter(([, val]) => Number(val || 0) >= 70)
          .map(([k]) => `${formatDimName(k)} proficiency`);

  const areasToDevelop =
    profile?.improvementAreas?.length > 0
      ? profile.improvementAreas
      : dimensionEntries
          .filter(([, val]) => Number(val || 0) < 70)
          .map(([k]) => `${formatDimName(k)} development`);

  const overallScore =
    dimensionEntries.length > 0
      ? Math.round(
          dimensionEntries.reduce((sum, [, val]) => sum + Number(val || 0), 0) /
            dimensionEntries.length,
        )
      : 0;

  return (
    <div
      className="assessment-page-container"
      style={{ maxWidth: "860px", margin: "0 auto", padding: "2rem 1rem" }}
    >
      {/* Header & Attempt Switcher */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "0.5rem",
            }}
          >
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800 }}>
              Psychometric Assessment Results
            </h1>
            <StatusBadge status="COMPLETED" />
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            Authoritative cognitive evaluation and dimension alignment.
          </p>
        </div>

        {completedAttempts.length > 1 && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <label
              htmlFor="attempt-select"
              style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}
            >
              Attempt:
            </label>
            <select
              id="attempt-select"
              value={selectedAttemptId}
              onChange={(e) => setSelectedAttemptId(e.target.value)}
              style={{
                background: "var(--bg-surface)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-color)",
                padding: "0.4rem 0.75rem",
                borderRadius: "6px",
                fontSize: "0.85rem",
              }}
            >
              {completedAttempts.map((att, idx) => (
                <option key={att._id} value={att._id}>
                  {att.assessment?.title || "Assessment"} - #
                  {completedAttempts.length - idx} (
                  {new Date(
                    att.submittedAt || att.createdAt,
                  ).toLocaleDateString()}
                  )
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {resultLoading ? (
        <div
          style={{
            textAlign: "center",
            padding: "3rem",
            color: "var(--text-muted)",
          }}
        >
          Loading assessment scores...
        </div>
      ) : result ? (
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
          {/* Hero Card */}
          <div
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              borderRadius: "12px",
              padding: "1.75rem",
              display: "flex",
              alignItems: "center",
              gap: "2rem",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                background: "rgba(99, 102, 241, 0.12)",
                border: "2px solid rgba(99, 102, 241, 0.3)",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 800,
                  color: "var(--primary, #6366f1)",
                }}
              >
                {overallScore}%
              </span>
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                }}
              >
                Alignment
              </span>
            </div>

            <div style={{ flex: 1, minWidth: "220px" }}>
              <div
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-muted)",
                  marginBottom: "0.25rem",
                }}
              >
                {result.assessment?.title || "Psychometric Diagnostic"}
              </div>
              <h2
                style={{
                  fontSize: "1.3rem",
                  fontWeight: 700,
                  marginBottom: "0.5rem",
                }}
              >
                Learning Profile Breakdown
              </h2>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Submitted on:{" "}
                <span style={{ color: "var(--text-secondary)" }}>
                  {result.submittedAt
                    ? new Date(result.submittedAt).toLocaleString()
                    : "Recently"}
                </span>
              </div>
            </div>
          </div>

          {/* Result Narrative Summary */}
          {result.resultSummary && (
            <div
              style={{
                background: "rgba(99, 102, 241, 0.06)",
                border: "1px solid rgba(99, 102, 241, 0.2)",
                borderRadius: "12px",
                padding: "1.5rem",
              }}
            >
              <h3
                style={{
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "#a5b4fc",
                  marginBottom: "0.5rem",
                }}
              >
                Diagnostic Narrative
              </h3>
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.95rem",
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {result.resultSummary}
              </p>
            </div>
          )}

          {/* Dimension Scores */}
          <div
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              borderRadius: "12px",
              padding: "1.5rem",
            }}
          >
            <h3
              style={{
                fontSize: "1.15rem",
                fontWeight: 700,
                marginBottom: "1.25rem",
              }}
            >
              Dimension Scores
            </h3>

            {dimensionEntries.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                No dimension score breakdown available for this attempt.
              </p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.25rem",
                }}
              >
                {dimensionEntries.map(([dimKey, dimScore]) => {
                  const numScore = Number(dimScore || 0);
                  return (
                    <div key={dimKey}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "0.9rem",
                          marginBottom: "0.35rem",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 600,
                            color: "var(--text-primary)",
                          }}
                        >
                          {formatDimName(dimKey)}
                        </span>
                        <span
                          style={{
                            fontWeight: 700,
                            color:
                              numScore >= 70
                                ? "#10b981"
                                : "var(--primary, #6366f1)",
                          }}
                        >
                          {numScore}%
                        </span>
                      </div>
                      <ProgressBar
                        value={numScore}
                        max={100}
                        height="8px"
                        variant={numScore >= 70 ? "success" : "primary"}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Strengths & Development Areas */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1rem",
            }}
          >
            {/* Strengths */}
            <div
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-color)",
                borderRadius: "12px",
                padding: "1.25rem",
              }}
            >
              <h3
                style={{
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "#10b981",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "0.75rem",
                }}
              >
                <span>🌟</span> Your Strengths
              </h3>
              {strengths.length > 0 ? (
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: "1.25rem",
                    color: "var(--text-secondary)",
                    fontSize: "0.9rem",
                  }}
                >
                  {strengths.map((st, i) => (
                    <li key={i} style={{ marginBottom: "0.4rem" }}>
                      {st}
                    </li>
                  ))}
                </ul>
              ) : (
                <p
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "0.85rem",
                    margin: 0,
                  }}
                >
                  Take more assessments to reveal detailed cognitive strengths.
                </p>
              )}
            </div>

            {/* Areas to Develop */}
            <div
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-color)",
                borderRadius: "12px",
                padding: "1.25rem",
              }}
            >
              <h3
                style={{
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "#a855f7",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "0.75rem",
                }}
              >
                <span>🎯</span> Areas to Develop
              </h3>
              {areasToDevelop.length > 0 ? (
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: "1.25rem",
                    color: "var(--text-secondary)",
                    fontSize: "0.9rem",
                  }}
                >
                  {areasToDevelop.map((ar, i) => (
                    <li key={i} style={{ marginBottom: "0.4rem" }}>
                      {ar}
                    </li>
                  ))}
                </ul>
              ) : (
                <p
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "0.85rem",
                    margin: 0,
                  }}
                >
                  All evaluated dimensions show strong foundational alignment.
                </p>
              )}
            </div>
          </div>

          {/* Action CTAs */}
          <div
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              borderRadius: "12px",
              padding: "1.5rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <div>
              <h4
                style={{
                  fontSize: "1rem",
                  fontWeight: 700,
                  marginBottom: "0.25rem",
                }}
              >
                Ready to continue your learning journey?
              </h4>
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: "0.85rem",
                  margin: 0,
                }}
              >
                Explore tailored recommendations or step directly into your
                personalized path.
              </p>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <Link href="/recommendations" className="btn-primary-small">
                View Recommendations →
              </Link>
              <Link href="/learning-path" className="btn-secondary-small">
                Learning Path →
              </Link>
            </div>
          </div>

          {/* Non-Clinical Framing Disclaimer */}
          <div
            style={{
              padding: "1rem",
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid var(--border-color)",
              borderRadius: "8px",
              fontSize: "0.8rem",
              color: "var(--text-muted)",
              lineHeight: 1.5,
              textAlign: "center",
            }}
          >
            🛡️ <strong>Educational Notice:</strong> PsychePath assessments model
            cognitive learning style preferences and domain readiness to
            personalize curriculum recommendations. They do not constitute
            clinical or psychological diagnoses.
          </div>
        </div>
      ) : (
        <EmptyState
          icon="⚠️"
          title="Could Not Load Result"
          description="Unable to load this assessment result. Please try another attempt or retake the assessment."
          actionText="Back to Assessments"
          actionHref="/assessments"
        />
      )}
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            textAlign: "center",
            padding: "4rem",
            color: "var(--text-muted)",
          }}
        >
          Loading assessment results...
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
