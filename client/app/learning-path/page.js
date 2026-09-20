"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import authService from "../../services/authService";
import learningPathService from "../../services/learningPathService";
import progressService from "../../services/progressService";
import ProgressBar from "../../components/ui/ProgressBar";
import StatusBadge from "../../components/ui/StatusBadge";
import EmptyState from "../../components/ui/EmptyState";

export default function LearningPathPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activePath, setActivePath] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [historyPaths, setHistoryPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);
  const [error, setError] = useState(null);

  const fetchPathAndProgress = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch active path, progress, and historical paths
      const [pathRes, progressRes, histRes] = await Promise.allSettled([
        learningPathService.getCurrentPath(),
        progressService.getCurrentPathProgress(),
        learningPathService.getPathHistory(),
      ]);

      if (pathRes.status === "fulfilled" && pathRes.value.success) {
        setActivePath(pathRes.value.data);
      } else {
        setActivePath(null);
      }

      if (progressRes.status === "fulfilled" && progressRes.value.success) {
        setProgressData(progressRes.value.data);
      }

      if (histRes.status === "fulfilled" && histRes.value.success) {
        setHistoryPaths(histRes.value.data || []);
      }
    } catch (err) {
      setError(err.message || "Failed to load learning path");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const currentUser = authService.getUser();
    if (!currentUser) {
      router.push("/login?redirect=/learning-path");
      return;
    }
    setUser(currentUser);
    fetchPathAndProgress();
  }, [router, fetchPathAndProgress]);

  const handleRegeneratePath = async () => {
    try {
      setRegenerating(true);
      setError(null);
      setShowRegenModal(false);

      const res = await learningPathService.regeneratePath();
      if (res.success && res.data) {
        setActionMessage(
          `Successfully regenerated to Version ${res.data.version}! Previous version archived.`,
        );
        await fetchPathAndProgress();
      }
    } catch (err) {
      setError(err.message || "Failed to regenerate learning path");
    } finally {
      setRegenerating(false);
    }
  };

  const handleStartModule = async (moduleId) => {
    const pathId = activePath?.id || activePath?._id;
    if (!pathId) return;
    try {
      await progressService.startModule(pathId, moduleId);
      await fetchPathAndProgress();
    } catch (err) {
      setError(err.message || "Failed to start module");
    }
  };

  const handleUpdatePercentage = async (moduleId, currentPct) => {
    const pathId = activePath?.id || activePath?._id;
    if (!pathId) return;
    const nextPct = Math.min(100, currentPct + 25);
    try {
      await progressService.updateProgress(pathId, moduleId, nextPct);
      await fetchPathAndProgress();
    } catch (err) {
      setError(err.message || "Failed to update progress");
    }
  };

  const handleCompleteModule = async (moduleId) => {
    const pathId = activePath?.id || activePath?._id;
    if (!pathId) return;
    try {
      await progressService.completeModule(pathId, moduleId);
      await fetchPathAndProgress();
    } catch (err) {
      setError(err.message || "Failed to complete module");
    }
  };

  const handleSkipModule = async (moduleId) => {
    const pathId = activePath?.id || activePath?._id;
    if (!pathId) return;
    try {
      await progressService.skipModule(pathId, moduleId);
      await fetchPathAndProgress();
    } catch (err) {
      setError(err.message || "Failed to skip module");
    }
  };

  if (loading) {
    return (
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "4rem 1rem",
          textAlign: "center",
        }}
      >
        <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>
          Loading your personalized learning path...
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: "1050px",
        margin: "0 auto",
        padding: "1.5rem 1rem 4rem",
      }}
    >
      {/* 1. Header & Actions */}
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
              gap: "0.6rem",
              marginBottom: "0.5rem",
            }}
          >
            <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: 0 }}>
              Personalized Learning Path
            </h1>
            {activePath && (
              <span
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 800,
                  padding: "0.25rem 0.65rem",
                  borderRadius: "6px",
                  background: "rgba(99, 102, 241, 0.2)",
                  color: "#a5b4fc",
                  border: "1px solid rgba(99, 102, 241, 0.4)",
                }}
              >
                v{activePath.version}
              </span>
            )}
            {activePath && <StatusBadge status={activePath.status} />}
          </div>
          <p style={{ color: "var(--text-secondary)", margin: 0 }}>
            Curriculum sequence optimized for your skills, goals, and cognitive
            strengths.
          </p>
        </div>

        {activePath && (
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={() => setShowRegenModal(true)}
              disabled={regenerating}
              style={{
                background: "var(--bg-surface-elevated)",
                border: "1px solid var(--border-color)",
                color: "var(--text-primary)",
                padding: "0.6rem 1.25rem",
                borderRadius: "8px",
                fontWeight: 600,
                fontSize: "0.875rem",
                cursor: regenerating ? "not-allowed" : "pointer",
              }}
            >
              {regenerating ? "Regenerating..." : "🔄 Regenerate Path"}
            </button>
          </div>
        )}
      </div>

      {actionMessage && (
        <div
          className="alert-box alert-success"
          style={{ marginBottom: "1.5rem" }}
        >
          ✅ {actionMessage}
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

      {!activePath ? (
        <EmptyState
          icon="🗺️"
          title="No Active Learning Path Found"
          description="Your personalized curriculum isn't generated yet. Complete an assessment or view recommendations to build your official path."
          actionText="Generate Learning Path"
          actionHref="/recommendations"
        />
      ) : (
        <>
          {/* 2. Overall Progress Card */}
          {progressData?.pathSummary && (
            <div
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-color)",
                borderRadius: "12px",
                padding: "1.5rem",
                marginBottom: "2rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                  marginBottom: "0.75rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span style={{ fontSize: "1.2rem" }}>📈</span>
                  <span style={{ fontWeight: 700, fontSize: "1.05rem" }}>
                    Overall Path Progress:{" "}
                    {progressData.pathSummary.overallProgress}%
                  </span>
                  {progressData.pathSummary.isComplete && (
                    <span
                      style={{
                        fontSize: "0.75rem",
                        padding: "0.2rem 0.6rem",
                        borderRadius: "4px",
                        background: "rgba(16, 185, 129, 0.2)",
                        color: "#10b981",
                        fontWeight: 700,
                      }}
                    >
                      🎉 ALL ACTIONABLE MODULES COMPLETE
                    </span>
                  )}
                </div>
                <div
                  style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}
                >
                  {progressData.pathSummary.completedModules} Completed •{" "}
                  {progressData.pathSummary.inProgressModules} In Progress •{" "}
                  {progressData.pathSummary.skippedModules} Skipped (of{" "}
                  {progressData.pathSummary.totalModules} modules •{" "}
                  {activePath.estimatedDuration} hrs)
                </div>
              </div>

              <ProgressBar value={progressData.pathSummary.overallProgress} />
            </div>
          )}

          {/* 3. AI Narrative, Focus Areas & Study Strategy */}
          {activePath.summary && (
            <div
              style={{
                background:
                  activePath.generatedBy === "HYBRID"
                    ? "linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(168, 85, 247, 0.08))"
                    : "var(--bg-surface)",
                border: "1px solid rgba(99, 102, 241, 0.3)",
                borderRadius: "12px",
                padding: "1.75rem",
                marginBottom: "2.5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "0.75rem",
                }}
              >
                <span style={{ fontSize: "1.25rem" }}>
                  {activePath.generatedBy === "HYBRID" ? "✨" : "🎯"}
                </span>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0 }}>
                  {activePath.generatedBy === "HYBRID"
                    ? "AI-Synthesized Narrative & Study Strategy"
                    : "Curriculum Strategy"}
                </h3>
              </div>

              <p
                style={{
                  color: "var(--text-secondary)",
                  lineHeight: 1.6,
                  marginBottom: "1.25rem",
                }}
              >
                {activePath.summary}
              </p>

              {activePath.focusAreas && activePath.focusAreas.length > 0 && (
                <div style={{ marginBottom: "1rem" }}>
                  <span
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: "var(--text-muted)",
                    }}
                  >
                    Focus Areas:{" "}
                  </span>
                  <div
                    style={{
                      display: "inline-flex",
                      flexWrap: "wrap",
                      gap: "0.4rem",
                      marginTop: "0.25rem",
                    }}
                  >
                    {activePath.focusAreas.map((fa, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: "0.8rem",
                          padding: "0.2rem 0.6rem",
                          borderRadius: "6px",
                          background: "rgba(99, 102, 241, 0.15)",
                          color: "#818cf8",
                          fontWeight: 600,
                        }}
                      >
                        {fa}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {activePath.learningStrategy &&
                activePath.learningStrategy.length > 0 && (
                  <div>
                    <span
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        color: "var(--text-muted)",
                        display: "block",
                        marginBottom: "0.35rem",
                      }}
                    >
                      Recommended Study Approach:
                    </span>
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: "1.25rem",
                        color: "var(--text-secondary)",
                        fontSize: "0.9rem",
                        lineHeight: 1.5,
                      }}
                    >
                      {activePath.learningStrategy.map((strat, idx) => (
                        <li key={idx} style={{ marginBottom: "0.25rem" }}>
                          {strat}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          )}

          {/* 4. Ordered Module Sequence Timeline */}
          <div style={{ marginBottom: "3rem" }}>
            <h2
              style={{
                fontSize: "1.35rem",
                fontWeight: 700,
                marginBottom: "1.25rem",
              }}
            >
              Module Execution Timeline ({activePath.modules?.length || 0}{" "}
              Modules)
            </h2>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              {(progressData?.modules || activePath.modules || []).map(
                (item, idx) => {
                  const mod = item.module || item;
                  const modId = item.moduleId || mod._id || mod.id;
                  const status = item.status || "NOT_STARTED";
                  const percentage = item.percentage || 0;

                  return (
                    <div
                      key={modId || idx}
                      style={{
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "12px",
                        padding: "1.5rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "1rem",
                      }}
                    >
                      {/* Top Row: Order, Category, Difficulty, Duration */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: "0.5rem",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.8rem",
                              fontWeight: 800,
                              padding: "0.2rem 0.5rem",
                              borderRadius: "4px",
                              background: "rgba(99, 102, 241, 0.2)",
                              color: "#818cf8",
                            }}
                          >
                            STEP #{item.order || idx + 1}
                          </span>
                          <span className="category-tag">{mod.category}</span>
                          <span className="difficulty-tag">
                            {mod.difficulty}
                          </span>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.85rem",
                              color: "var(--text-muted)",
                            }}
                          >
                            ⏱️ {mod.estimatedDuration} hrs
                          </span>
                          <StatusBadge status={status} />
                        </div>
                      </div>

                      {/* Title and Reason */}
                      <div>
                        <h3
                          style={{
                            fontSize: "1.2rem",
                            fontWeight: 700,
                            margin: "0 0 0.35rem",
                          }}
                        >
                          {mod.title}
                        </h3>
                        {mod.description && (
                          <p
                            style={{
                              color: "var(--text-secondary)",
                              fontSize: "0.9rem",
                              margin: "0 0 0.5rem",
                              lineHeight: 1.5,
                            }}
                          >
                            {mod.description}
                          </p>
                        )}
                        {item.reason && (
                          <div
                            className="rec-reason-box"
                            style={{ fontSize: "0.85rem" }}
                          >
                            💡 <strong>Placement Rationale:</strong>{" "}
                            {item.reason}
                          </div>
                        )}
                      </div>

                      {/* Progress Bar & Actions */}
                      <div
                        style={{
                          paddingTop: "0.75rem",
                          borderTop: "1px solid var(--border-color)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: "1rem",
                        }}
                      >
                        <div style={{ flex: "1 1 200px" }}>
                          <ProgressBar value={percentage} showLabel />
                        </div>

                        <div
                          style={{
                            display: "flex",
                            gap: "0.5rem",
                            flexWrap: "wrap",
                          }}
                        >
                          {(status === "NOT_STARTED" ||
                            status === "SKIPPED") && (
                            <button
                              onClick={() => handleStartModule(modId)}
                              style={{
                                padding: "0.4rem 0.9rem",
                                fontSize: "0.8rem",
                                fontWeight: 600,
                                borderRadius: "6px",
                                border: "1px solid var(--primary)",
                                background: "var(--primary)",
                                color: "#fff",
                                cursor: "pointer",
                              }}
                            >
                              ▶ Start Module
                            </button>
                          )}

                          {status === "IN_PROGRESS" && (
                            <>
                              <button
                                onClick={() =>
                                  handleUpdatePercentage(modId, percentage)
                                }
                                disabled={percentage >= 100}
                                style={{
                                  padding: "0.4rem 0.9rem",
                                  fontSize: "0.8rem",
                                  fontWeight: 600,
                                  borderRadius: "6px",
                                  border: "1px solid rgba(99, 102, 241, 0.4)",
                                  background: "rgba(99, 102, 241, 0.15)",
                                  color: "#818cf8",
                                  cursor: "pointer",
                                }}
                              >
                                +25% Progress
                              </button>
                              <button
                                onClick={() => handleCompleteModule(modId)}
                                style={{
                                  padding: "0.4rem 0.9rem",
                                  fontSize: "0.8rem",
                                  fontWeight: 600,
                                  borderRadius: "6px",
                                  border: "none",
                                  background: "#10b981",
                                  color: "#fff",
                                  cursor: "pointer",
                                }}
                              >
                                ✓ Complete
                              </button>
                              <button
                                onClick={() => handleSkipModule(modId)}
                                style={{
                                  padding: "0.4rem 0.9rem",
                                  fontSize: "0.8rem",
                                  fontWeight: 600,
                                  borderRadius: "6px",
                                  border: "1px solid rgba(245, 158, 11, 0.4)",
                                  background: "transparent",
                                  color: "#f59e0b",
                                  cursor: "pointer",
                                }}
                              >
                                ⏭ Skip
                              </button>
                            </>
                          )}

                          {status === "COMPLETED" && (
                            <span
                              style={{
                                fontSize: "0.85rem",
                                color: "#10b981",
                                fontWeight: 700,
                              }}
                            >
                              ✓ Module Completed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </div>

          {/* 5. Version History Section */}
          {historyPaths.length > 0 && (
            <div style={{ marginTop: "3rem" }}>
              <h2
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  marginBottom: "1rem",
                }}
              >
                Learning Path Version History
              </h2>
              <div
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "12px",
                  overflow: "hidden",
                }}
              >
                {historyPaths.map((p, idx) => (
                  <div
                    key={p.id || p._id || idx}
                    style={{
                      padding: "1rem 1.25rem",
                      borderBottom:
                        idx === historyPaths.length - 1
                          ? "none"
                          : "1px solid var(--border-color)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "0.5rem",
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                        Version {p.version}
                      </span>
                      <span
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "0.85rem",
                          marginLeft: "0.75rem",
                        }}
                      >
                        {p.modules?.length || 0} modules • {p.estimatedDuration}{" "}
                        hrs • Source: {p.generatedBy}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                      }}
                    >
                      <StatusBadge status={p.status} size="small" />
                      <span
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "0.8rem",
                        }}
                      >
                        {new Date(
                          p.createdAt || p.generatedAt,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Confirmation Modal for Regeneration */}
      {showRegenModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            zIndex: 100,
          }}
        >
          <div
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              borderRadius: "14px",
              padding: "2rem",
              maxWidth: "500px",
              width: "100%",
            }}
          >
            <h3
              style={{
                fontSize: "1.3rem",
                fontWeight: 700,
                marginBottom: "0.75rem",
              }}
            >
              Regenerate Learning Path?
            </h3>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "0.9rem",
                lineHeight: 1.6,
                marginBottom: "1.5rem",
              }}
            >
              Regenerating your path will create{" "}
              <strong>Version {activePath ? activePath.version + 1 : 2}</strong>{" "}
              using your latest profile skills, career goals, and assessment
              results.
              <br />
              <br />
              Your current active path (v{activePath?.version}) will be safely{" "}
              <strong>ARCHIVED</strong> and remain accessible in your version
              history.
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.75rem",
              }}
            >
              <button
                onClick={() => setShowRegenModal(false)}
                style={{
                  background: "transparent",
                  border: "1px solid var(--border-color)",
                  color: "var(--text-primary)",
                  padding: "0.6rem 1.2rem",
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleRegeneratePath}
                disabled={regenerating}
                style={{
                  background: "linear-gradient(135deg, #6366f1, #a855f7)",
                  color: "#ffffff",
                  border: "none",
                  padding: "0.6rem 1.4rem",
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  cursor: regenerating ? "not-allowed" : "pointer",
                }}
              >
                {regenerating ? "Generating..." : "Confirm & Regenerate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
