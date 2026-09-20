"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import recommendationService from "../../services/recommendationService";
import authService from "../../services/authService";

const CATEGORIES = [
  "ALL",
  "FRONTEND",
  "BACKEND",
  "DATABASE",
  "DEVOPS",
  "AI_DATA_SCIENCE",
  "SYSTEM_DESIGN",
];

const DIFFICULTIES = ["ALL", "BEGINNER", "INTERMEDIATE", "ADVANCED"];

export default function RecommendationsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notReadyError, setNotReadyError] = useState(null);

  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedDifficulty, setSelectedDifficulty] = useState("ALL");
  const [expandedScoreId, setExpandedScoreId] = useState(null);
  const [showBlocked, setShowBlocked] = useState(false);

  const user = authService.getUser();

  const fetchRecommendations = useCallback(async () => {
    if (!authService.isAuthenticated()) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setNotReadyError(null);

      const params = {};
      if (selectedCategory !== "ALL") params.category = selectedCategory;
      if (selectedDifficulty !== "ALL") params.difficulty = selectedDifficulty;

      const res = await recommendationService.getRecommendations(params);
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      if (err.data && err.data.errorCode === "PROFILE_NOT_READY") {
        setNotReadyError(err.data);
      } else {
        setError(err.message || "Failed to generate recommendations");
      }
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedDifficulty]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const toggleScoreBreakdown = (id) => {
    setExpandedScoreId((prev) => (prev === id ? null : id));
  };

  if (!user) {
    return (
      <div
        className="recommendation-container"
        style={{ textAlign: "center", padding: "4rem 1rem" }}
      >
        <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "1rem" }}>
          Personalized Recommendations
        </h1>
        <p
          style={{
            color: "var(--text-secondary)",
            marginBottom: "2rem",
            maxWidth: "500px",
            margin: "0 auto 2rem",
          }}
        >
          Sign in or create an account to view curriculum modules tailored to
          your cognitive strengths, learning preferences, and technical goals.
        </p>
        <Link
          href="/login"
          className="login-btn"
          style={{ padding: "0.75rem 2rem", textDecoration: "none" }}
        >
          Sign In to View Recommendations
        </Link>
      </div>
    );
  }

  return (
    <div className="recommendation-container">
      <div style={{ marginBottom: "2rem" }}>
        <h1
          style={{
            fontSize: "2.2rem",
            fontWeight: 800,
            marginBottom: "0.5rem",
          }}
        >
          Recommended for You
        </h1>
        <p style={{ color: "var(--text-secondary)", maxWidth: "750px" }}>
          Deterministic, rule-based curriculum recommendations matching your
          verified skills, learning goals, cognitive assessment dimensions, and
          prerequisite readiness.
        </p>
      </div>

      {/* Filter Controls */}
      <div className="curriculum-filter-bar" style={{ marginBottom: "2rem" }}>
        <div style={{ flex: "1 1 180px" }}>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ width: "100%" }}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat === "ALL" ? "All Categories" : cat.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>

        <div style={{ flex: "1 1 180px" }}>
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            style={{ width: "100%" }}
          >
            {DIFFICULTIES.map((diff) => (
              <option key={diff} value={diff}>
                {diff === "ALL" ? "All Difficulties" : diff}
              </option>
            ))}
          </select>
        </div>

        {(selectedCategory !== "ALL" || selectedDifficulty !== "ALL") && (
          <button
            onClick={() => {
              setSelectedCategory("ALL");
              setSelectedDifficulty("ALL");
            }}
            style={{
              background: "transparent",
              border: "1px solid var(--border-color)",
              color: "var(--text-secondary)",
              padding: "0.6rem 1rem",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Profile Not Ready Card */}
      {notReadyError && (
        <div
          className="profile-card"
          style={{
            borderLeft: "4px solid var(--warning)",
            padding: "2rem",
            marginBottom: "2rem",
          }}
        >
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              marginBottom: "0.5rem",
              color: "#fbbf24",
            }}
          >
            Profile Setup Required
          </h2>
          <p
            style={{ color: "var(--text-secondary)", marginBottom: "1.25rem" }}
          >
            The recommendation engine requires a complete learner profile before
            it can compute personalized candidates.
          </p>

          <div style={{ marginBottom: "1.5rem" }}>
            <div
              style={{
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "var(--text-muted)",
                marginBottom: "0.5rem",
              }}
            >
              Missing Required Signals:
            </div>
            <ul
              style={{
                paddingLeft: "1.2rem",
                color: "var(--text-secondary)",
                fontSize: "0.9rem",
              }}
            >
              {notReadyError.data?.missingFields?.map((f) => (
                <li key={f} style={{ marginBottom: "0.35rem" }}>
                  {f === "learningGoals" &&
                    "Learning Goals (Set your career & technical targets in Profile)"}
                  {f === "currentSkills" &&
                    "Current Skills (Add your existing technical skills in Profile)"}
                  {f === "assessmentDimensions" &&
                    "Psychometric Assessment (Complete a diagnostic assessment)"}
                </li>
              ))}
            </ul>
          </div>

          <div style={{ display: "flex", gap: "1rem" }}>
            <Link
              href="/profile"
              style={{
                background: "var(--primary)",
                color: "#fff",
                padding: "0.6rem 1.25rem",
                borderRadius: "8px",
                textDecoration: "none",
                fontSize: "0.9rem",
                fontWeight: 600,
              }}
            >
              Update Profile
            </Link>
            <Link
              href="/assessments"
              style={{
                background: "var(--bg-surface-elevated)",
                border: "1px solid var(--border-color)",
                color: "var(--text-primary)",
                padding: "0.6rem 1.25rem",
                borderRadius: "8px",
                textDecoration: "none",
                fontSize: "0.9rem",
              }}
            >
              Take Assessment
            </Link>
          </div>
        </div>
      )}

      {error && (
        <div className="alert-box alert-error" style={{ marginBottom: "2rem" }}>
          {error}
        </div>
      )}

      {loading && (
        <div
          style={{
            textAlign: "center",
            padding: "4rem",
            color: "var(--text-muted)",
          }}
        >
          Computing personalized curriculum recommendations...
        </div>
      )}

      {!loading && data && data.recommendations && (
        <>
          {data.recommendations.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "4rem",
                background: "var(--bg-surface)",
                borderRadius: "12px",
                border: "1px solid var(--border-color)",
                marginBottom: "2rem",
              }}
            >
              <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>
                No active recommendations match your current filters.
              </p>
            </div>
          ) : (
            <div>
              {data.recommendations.map((rec) => {
                const isBreakdownOpen = expandedScoreId === rec.module.id;
                const diffClass =
                  rec.module.difficulty === "BEGINNER"
                    ? "difficulty-beginner"
                    : rec.module.difficulty === "INTERMEDIATE"
                      ? "difficulty-intermediate"
                      : "difficulty-advanced";

                return (
                  <div key={rec.module.id} className="rec-card">
                    {/* Score badge */}
                    <div className="rec-score-badge">
                      <span className="rec-score-val">{rec.score}</span>
                      <span className="rec-score-lbl">Score</span>
                    </div>

                    {/* Module content */}
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          marginBottom: "0.5rem",
                        }}
                      >
                        <span className="category-tag">
                          {rec.module.category}
                        </span>
                        <span className={`difficulty-tag ${diffClass}`}>
                          {rec.module.difficulty}
                        </span>
                        <span
                          style={{
                            fontSize: "0.8rem",
                            color: "var(--text-muted)",
                            marginLeft: "auto",
                          }}
                        >
                          ⏱️ {rec.module.estimatedDuration} hrs
                        </span>
                      </div>

                      <h3
                        style={{
                          fontSize: "1.3rem",
                          fontWeight: 700,
                          marginBottom: "0.4rem",
                        }}
                      >
                        {rec.module.title}
                      </h3>

                      {/* Grounded explanation reason */}
                      <div className="rec-reason-box">
                        💡 <strong>Why Recommended:</strong> {rec.reason}
                      </div>

                      {/* Skills match & gap tags */}
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "0.5rem",
                          margin: "0.75rem 0",
                        }}
                      >
                        {rec.matchedSkills &&
                          rec.matchedSkills.map((s, idx) => (
                            <span
                              key={idx}
                              className="skill-pill"
                              style={{ padding: "0.2rem 0.6rem" }}
                            >
                              ✓ {s}
                            </span>
                          ))}
                        {rec.skillGaps &&
                          rec.skillGaps.map((g, idx) => (
                            <span key={idx} className="skill-gap-pill">
                              + Skill Gap: {g}
                            </span>
                          ))}
                      </div>

                      {/* Toggle breakdown */}
                      <button
                        onClick={() => toggleScoreBreakdown(rec.module.id)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "var(--primary)",
                          cursor: "pointer",
                          fontSize: "0.825rem",
                          fontWeight: 600,
                          padding: 0,
                          marginTop: "0.5rem",
                        }}
                      >
                        {isBreakdownOpen
                          ? "Hide Score Breakdown ▲"
                          : "View Scoring Breakdown ▼"}
                      </button>

                      {/* Component score breakdown */}
                      {isBreakdownOpen && rec.scoreBreakdown && (
                        <div
                          style={{
                            marginTop: "0.75rem",
                            padding: "1rem",
                            background: "var(--bg-surface-elevated)",
                            borderRadius: "8px",
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fill, minmax(180px, 1fr))",
                            gap: "0.75rem",
                            fontSize: "0.8rem",
                          }}
                        >
                          <div>
                            <span style={{ color: "var(--text-muted)" }}>
                              Goal Match (25%):{" "}
                            </span>
                            <strong>{rec.scoreBreakdown.goalMatch}/100</strong>
                          </div>
                          <div>
                            <span style={{ color: "var(--text-muted)" }}>
                              Skill Match (25%):{" "}
                            </span>
                            <strong>{rec.scoreBreakdown.skillMatch}/100</strong>
                          </div>
                          <div>
                            <span style={{ color: "var(--text-muted)" }}>
                              Prerequisites (15%):{" "}
                            </span>
                            <strong>
                              {rec.scoreBreakdown.prerequisiteReadiness}/100
                            </strong>
                          </div>
                          <div>
                            <span style={{ color: "var(--text-muted)" }}>
                              Assessment (15%):{" "}
                            </span>
                            <strong>
                              {rec.scoreBreakdown.assessmentAlignment}/100
                            </strong>
                          </div>
                          <div>
                            <span style={{ color: "var(--text-muted)" }}>
                              Difficulty (10%):{" "}
                            </span>
                            <strong>
                              {rec.scoreBreakdown.difficultyAlignment}/100
                            </strong>
                          </div>
                          <div>
                            <span style={{ color: "var(--text-muted)" }}>
                              Interests (5%):{" "}
                            </span>
                            <strong>
                              {rec.scoreBreakdown.interestMatch}/100
                            </strong>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Blocked Modules Section */}
          {data.blockedModules && data.blockedModules.length > 0 && (
            <div style={{ marginTop: "3rem" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1rem",
                }}
              >
                <div>
                  <h2 style={{ fontSize: "1.3rem", fontWeight: 700 }}>
                    Prerequisite-Blocked Relevant Modules (
                    {data.blockedModules.length})
                  </h2>
                  <p
                    style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}
                  >
                    These modules match your goals, but require foundational
                    prerequisites first.
                  </p>
                </div>
                <button
                  onClick={() => setShowBlocked((prev) => !prev)}
                  style={{
                    background: "var(--bg-surface-elevated)",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-primary)",
                    padding: "0.4rem 0.8rem",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                  }}
                >
                  {showBlocked ? "Hide Blocked" : "Show Blocked"}
                </button>
              </div>

              {showBlocked && (
                <div>
                  {data.blockedModules.map((blk) => (
                    <div key={blk.module.id} className="rec-card blocked-card">
                      <div
                        className="rec-score-badge"
                        style={{ borderColor: "var(--text-muted)" }}
                      >
                        <span
                          className="rec-score-val"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {blk.score}
                        </span>
                        <span className="rec-score-lbl">Score</span>
                      </div>

                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            marginBottom: "0.4rem",
                          }}
                        >
                          <span className="category-tag">
                            {blk.module.category}
                          </span>
                          <span className="difficulty-tag difficulty-intermediate">
                            {blk.module.difficulty}
                          </span>
                        </div>

                        <h4
                          style={{
                            fontSize: "1.15rem",
                            fontWeight: 700,
                            marginBottom: "0.4rem",
                          }}
                        >
                          {blk.module.title}
                        </h4>

                        <div
                          style={{
                            fontSize: "0.85rem",
                            color: "#f87171",
                            margin: "0.5rem 0",
                          }}
                        >
                          ⚠️ <strong>Missing Prerequisite:</strong>{" "}
                          {blk.missingPrerequisites
                            .map((p) => p.title)
                            .join(", ")}
                        </div>

                        <p
                          style={{
                            fontSize: "0.825rem",
                            color: "var(--text-secondary)",
                          }}
                        >
                          Complete the prerequisite above to unlock this module.
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
