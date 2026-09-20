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

export default function ProgressPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activePath, setActivePath] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  const fetchProgressData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [pathRes, progressRes] = await Promise.allSettled([
        learningPathService.getCurrentPath(),
        progressService.getCurrentPathProgress(),
      ]);

      let pathObj = null;
      if (pathRes.status === "fulfilled" && pathRes.value.success) {
        pathObj = pathRes.value.data;
        setActivePath(pathObj);
      } else {
        setActivePath(null);
      }

      if (progressRes.status === "fulfilled" && progressRes.value.success) {
        setProgressData(progressRes.value.data);
      }

      if (pathObj) {
        try {
          const histRes = await progressService.getPathHistory(
            pathObj.id || pathObj._id,
            { limit: 20 },
          );
          if (histRes.success && Array.isArray(histRes.data?.history)) {
            setHistory(histRes.data.history);
          }
        } catch {
          // Ignore non-critical history fetch error
        }
      }
    } catch (err) {
      setError(err.message || "Failed to load progress data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const currentUser = authService.getUser();
    if (!currentUser) {
      router.push("/login?redirect=/progress");
      return;
    }
    setUser(currentUser);
    fetchProgressData();
  }, [router, fetchProgressData]);

  const handleStartModule = async (moduleId) => {
    const pathId = activePath?.id || activePath?._id;
    if (!pathId) return;
    try {
      await progressService.startModule(pathId, moduleId);
      setActionSuccess("Module started successfully!");
      await fetchProgressData();
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
      setActionSuccess(`Progress updated to ${nextPct}%!`);
      await fetchProgressData();
    } catch (err) {
      setError(err.message || "Failed to update progress");
    }
  };

  const handleCompleteModule = async (moduleId) => {
    const pathId = activePath?.id || activePath?._id;
    if (!pathId) return;
    try {
      await progressService.completeModule(pathId, moduleId);
      setActionSuccess("Module marked as completed!");
      await fetchProgressData();
    } catch (err) {
      setError(err.message || "Failed to complete module");
    }
  };

  const handleSkipModule = async (moduleId) => {
    const pathId = activePath?.id || activePath?._id;
    if (!pathId) return;
    try {
      await progressService.skipModule(pathId, moduleId);
      setActionSuccess("Module skipped.");
      await fetchProgressData();
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
          Loading your learning progress...
        </p>
      </div>
    );
  }

  const summary = progressData?.pathSummary;

  return (
    <div
      style={{
        maxWidth: "1050px",
        margin: "0 auto",
        padding: "1.5rem 1rem 4rem",
      }}
    >
      {/* 1. Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            marginBottom: "0.5rem",
          }}
        >
          <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: 0 }}>
            Learning Progress & Analytics
          </h1>
          {activePath && (
            <span
              style={{
                fontSize: "0.8rem",
                fontWeight: 800,
                padding: "0.2rem 0.6rem",
                borderRadius: "6px",
                background: "rgba(99, 102, 241, 0.2)",
                color: "#a5b4fc",
              }}
            >
              v{activePath.version}
            </span>
          )}
        </div>
        <p style={{ color: "var(--text-secondary)", margin: 0 }}>
          Verifiable, monotonic execution records tracked against your active
          personalized curriculum.
        </p>
      </div>

      {actionSuccess && (
        <div
          className="alert-box alert-success"
          style={{ marginBottom: "1.5rem" }}
        >
          ✅ {actionSuccess}
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
          icon="📊"
          title="No Active Progress Records"
          description="You don't have an active learning path yet. Generate your official path to begin tracking module completion."
          actionText="Generate Learning Path"
          actionHref="/recommendations"
        />
      ) : (
        <>
          {/* 2. Metrics Cards Grid */}
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
                background: "var(--bg-surface)",
                border: "1px solid var(--border-color)",
                borderRadius: "10px",
                padding: "1.25rem",
              }}
            >
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}
              >
                Overall Progress
              </div>
              <div
                style={{
                  fontSize: "1.85rem",
                  fontWeight: 800,
                  color: "#10b981",
                  marginTop: "0.25rem",
                }}
              >
                {summary?.overallProgress ?? 0}%
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-secondary)",
                  marginTop: "0.25rem",
                }}
              >
                Actionable modules
              </div>
            </div>

            <div
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-color)",
                borderRadius: "10px",
                padding: "1.25rem",
              }}
            >
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}
              >
                Completed
              </div>
              <div
                style={{
                  fontSize: "1.85rem",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  marginTop: "0.25rem",
                }}
              >
                {summary?.completedModules ?? 0}
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-secondary)",
                  marginTop: "0.25rem",
                }}
              >
                of {summary?.totalModules ?? 0} total
              </div>
            </div>

            <div
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-color)",
                borderRadius: "10px",
                padding: "1.25rem",
              }}
            >
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}
              >
                In Progress
              </div>
              <div
                style={{
                  fontSize: "1.85rem",
                  fontWeight: 800,
                  color: "#818cf8",
                  marginTop: "0.25rem",
                }}
              >
                {summary?.inProgressModules ?? 0}
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-secondary)",
                  marginTop: "0.25rem",
                }}
              >
                active topics
              </div>
            </div>

            <div
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-color)",
                borderRadius: "10px",
                padding: "1.25rem",
              }}
            >
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}
              >
                Skipped
              </div>
              <div
                style={{
                  fontSize: "1.85rem",
                  fontWeight: 800,
                  color: "#f59e0b",
                  marginTop: "0.25rem",
                }}
              >
                {summary?.skippedModules ?? 0}
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-secondary)",
                  marginTop: "0.25rem",
                }}
              >
                excluded from total
              </div>
            </div>
          </div>

          {/* 3. Overall Path Progress Bar */}
          <div
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              borderRadius: "12px",
              padding: "1.5rem",
              marginBottom: "2.5rem",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "0.5rem",
              }}
            >
              <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                Path Execution Mastery
              </span>
              <span style={{ fontWeight: 700, color: "#10b981" }}>
                {summary?.overallProgress ?? 0}%
              </span>
            </div>
            <ProgressBar value={summary?.overallProgress ?? 0} />
          </div>

          {/* 4. Module Execution Tracker */}
          <div style={{ marginBottom: "3rem" }}>
            <h2
              style={{
                fontSize: "1.35rem",
                fontWeight: 700,
                marginBottom: "1.25rem",
              }}
            >
              Module Execution Tracker
            </h2>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              {(progressData?.modules || []).map((item, idx) => {
                const status = item.status || "NOT_STARTED";
                const percentage = item.percentage || 0;

                return (
                  <div
                    key={item.moduleId || idx}
                    style={{
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "10px",
                      padding: "1.25rem 1.5rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                    }}
                  >
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
                            fontWeight: 700,
                            color: "#818cf8",
                          }}
                        >
                          Step #{item.order || idx + 1}
                        </span>
                        <h3
                          style={{
                            fontSize: "1.1rem",
                            fontWeight: 700,
                            margin: 0,
                          }}
                        >
                          {item.title}
                        </h3>
                      </div>
                      <StatusBadge status={status} />
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ flex: "1 1 250px" }}>
                        <ProgressBar value={percentage} showLabel />
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          flexWrap: "wrap",
                        }}
                      >
                        {(status === "NOT_STARTED" || status === "SKIPPED") && (
                          <button
                            onClick={() => handleStartModule(item.moduleId)}
                            style={{
                              padding: "0.35rem 0.8rem",
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              borderRadius: "6px",
                              border: "1px solid var(--primary)",
                              background: "var(--primary)",
                              color: "#fff",
                              cursor: "pointer",
                            }}
                          >
                            ▶ Start
                          </button>
                        )}

                        {status === "IN_PROGRESS" && (
                          <>
                            <button
                              onClick={() =>
                                handleUpdatePercentage(
                                  item.moduleId,
                                  percentage,
                                )
                              }
                              disabled={percentage >= 100}
                              style={{
                                padding: "0.35rem 0.8rem",
                                fontSize: "0.8rem",
                                fontWeight: 600,
                                borderRadius: "6px",
                                border: "1px solid rgba(99, 102, 241, 0.4)",
                                background: "rgba(99, 102, 241, 0.15)",
                                color: "#818cf8",
                                cursor: "pointer",
                              }}
                            >
                              +25%
                            </button>
                            <button
                              onClick={() =>
                                handleCompleteModule(item.moduleId)
                              }
                              style={{
                                padding: "0.35rem 0.8rem",
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
                              onClick={() => handleSkipModule(item.moduleId)}
                              style={{
                                padding: "0.35rem 0.8rem",
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
                            ✓ Done
                          </span>
                        )}
                      </div>
                    </div>

                    {(item.startedAt ||
                      item.completedAt ||
                      item.lastAccessedAt) && (
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                          display: "flex",
                          gap: "1rem",
                          flexWrap: "wrap",
                        }}
                      >
                        {item.startedAt && (
                          <span>
                            Started:{" "}
                            {new Date(item.startedAt).toLocaleDateString()}
                          </span>
                        )}
                        {item.completedAt && (
                          <span>
                            Completed:{" "}
                            {new Date(item.completedAt).toLocaleDateString()}
                          </span>
                        )}
                        {item.lastAccessedAt && (
                          <span>
                            Last accessed:{" "}
                            {new Date(item.lastAccessedAt).toLocaleTimeString(
                              [],
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. Immutable Progress History Audit Trail */}
          <div>
            <h2
              style={{
                fontSize: "1.35rem",
                fontWeight: 700,
                marginBottom: "1rem",
              }}
            >
              Immutable Progress Audit Trail
            </h2>

            {history.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                No progress transitions logged yet. Start or update a module to
                record activity.
              </p>
            ) : (
              <div
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "12px",
                  overflowX: "auto",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    textAlign: "left",
                    fontSize: "0.85rem",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        borderBottom: "1px solid var(--border-color)",
                        background: "var(--bg-surface-elevated)",
                      }}
                    >
                      <th style={{ padding: "0.75rem 1rem" }}>Timestamp</th>
                      <th style={{ padding: "0.75rem 1rem" }}>Action</th>
                      <th style={{ padding: "0.75rem 1rem" }}>Module</th>
                      <th style={{ padding: "0.75rem 1rem" }}>Transition</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((record, idx) => (
                      <tr
                        key={record.id || idx}
                        style={{
                          borderBottom:
                            idx === history.length - 1
                              ? "none"
                              : "1px solid var(--border-color)",
                        }}
                      >
                        <td
                          style={{
                            padding: "0.75rem 1rem",
                            color: "var(--text-muted)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {new Date(record.timestamp).toLocaleString(
                            undefined,
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </td>
                        <td style={{ padding: "0.75rem 1rem" }}>
                          <span
                            style={{
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              padding: "0.2rem 0.5rem",
                              borderRadius: "4px",
                              background: "rgba(99, 102, 241, 0.15)",
                              color: "#818cf8",
                            }}
                          >
                            {record.action}
                          </span>
                        </td>
                        <td
                          style={{ padding: "0.75rem 1rem", fontWeight: 600 }}
                        >
                          {record.moduleTitle || "Curriculum Module"}
                        </td>
                        <td
                          style={{
                            padding: "0.75rem 1rem",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {record.previousPercentage}% ({record.previousStatus})
                          →{" "}
                          <strong>
                            {record.newPercentage}% ({record.newStatus})
                          </strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
