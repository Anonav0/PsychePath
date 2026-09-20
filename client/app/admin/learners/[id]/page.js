"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import AdminLayout from "../../../../components/admin/AdminLayout";
import adminService from "../../../../services/adminService";
import StatusBadge from "../../../../components/ui/StatusBadge";
import ProgressBar from "../../../../components/ui/ProgressBar";
import ConfirmModal from "../../../../components/admin/ConfirmModal";

export default function LearnerDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Status toggle modal
  const [modalOpen, setModalOpen] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminService.getLearnerDetails(id);
      if (res?.success) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.message || "Failed to load learner details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDetails();
  }, [id]);

  const handleToggleStatus = async () => {
    if (!data?.user) return;
    try {
      setToggleLoading(true);
      await adminService.toggleLearnerStatus(
        data.user._id,
        !data.user.isActive,
      );
      setModalOpen(false);
      fetchDetails();
    } catch (err) {
      alert(err.message || "Failed to update account status");
    } finally {
      setToggleLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout
        title="Learner Details"
        subtitle="Inspecting student profile and learning activity."
      >
        <div
          style={{
            textAlign: "center",
            padding: "4rem",
            color: "var(--text-muted)",
          }}
        >
          Loading learner data...
        </div>
      </AdminLayout>
    );
  }

  if (error || !data) {
    return (
      <AdminLayout
        title="Learner Not Found"
        subtitle="Requested learner record could not be retrieved."
      >
        <div
          style={{
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#f87171",
            padding: "1rem",
            borderRadius: "8px",
            marginBottom: "1.5rem",
          }}
        >
          {error || "Learner not found"}
        </div>
        <Link href="/admin/learners" className="btn-secondary-small">
          ← Back to Learners Directory
        </Link>
      </AdminLayout>
    );
  }

  const { user, profile, attempts, learningPath, progressSummary } = data;

  return (
    <AdminLayout>
      {/* Back Navigation */}
      <div style={{ marginBottom: "1rem" }}>
        <Link
          href="/admin/learners"
          style={{
            color: "var(--text-muted)",
            fontSize: "0.85rem",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.25rem",
          }}
        >
          ← Back to Learners Directory
        </Link>
      </div>

      {/* Header Banner */}
      <div
        style={{
          background: "var(--bg-surface, #1e293b)",
          border: "1px solid var(--border-color, #334155)",
          borderRadius: "12px",
          padding: "1.75rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
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
              marginBottom: "0.25rem",
            }}
          >
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, margin: 0 }}>
              {user.firstName} {user.lastName}
            </h1>
            <StatusBadge status={user.isActive ? "ACTIVE" : "INACTIVE"} />
          </div>
          <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            {user.email} • Registered{" "}
            {new Date(user.createdAt).toLocaleDateString()}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          style={{
            background: "transparent",
            border: "1px solid var(--border-color)",
            color: user.isActive ? "#f87171" : "#34d399",
            padding: "0.5rem 1rem",
            borderRadius: "6px",
            fontSize: "0.85rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {user.isActive ? "Deactivate Account" : "Activate Account"}
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {/* Profile & Academic Attributes */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {/* Profile Overview */}
          <div
            style={{
              background: "var(--bg-surface, #1e293b)",
              border: "1px solid var(--border-color, #334155)",
              borderRadius: "12px",
              padding: "1.5rem",
            }}
          >
            <h3
              style={{
                margin: "0 0 1rem 0",
                fontSize: "1.1rem",
                fontWeight: 700,
              }}
            >
              Learner Profile & Preferences
            </h3>
            {profile ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                  fontSize: "0.9rem",
                }}
              >
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ color: "var(--text-muted)" }}>
                    Education Level:
                  </span>
                  <span style={{ fontWeight: 600 }}>
                    {profile.educationLevel || "Not specified"}
                  </span>
                </div>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ color: "var(--text-muted)" }}>
                    Experience Level:
                  </span>
                  <span style={{ fontWeight: 600 }}>
                    {profile.experienceLevel || "BEGINNER"}
                  </span>
                </div>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ color: "var(--text-muted)" }}>
                    Weekly Study Hours:
                  </span>
                  <span style={{ fontWeight: 600 }}>
                    {profile.weeklyLearningHours || 5} hrs/week
                  </span>
                </div>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ color: "var(--text-muted)" }}>
                    Preferred Format:
                  </span>
                  <span style={{ fontWeight: 600 }}>
                    {profile.learningPreferences?.preferredFormat || "MIXED"}
                  </span>
                </div>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ color: "var(--text-muted)" }}>
                    Preferred Difficulty:
                  </span>
                  <span style={{ fontWeight: 600 }}>
                    {profile.learningPreferences?.preferredDifficulty ||
                      "BEGINNER"}
                  </span>
                </div>
              </div>
            ) : (
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: "0.875rem",
                  margin: 0,
                }}
              >
                Learner has not configured their academic profile yet.
              </p>
            )}
          </div>

          {/* Skills & Goals */}
          <div
            style={{
              background: "var(--bg-surface, #1e293b)",
              border: "1px solid var(--border-color, #334155)",
              borderRadius: "12px",
              padding: "1.5rem",
            }}
          >
            <h3
              style={{
                margin: "0 0 1rem 0",
                fontSize: "1.1rem",
                fontWeight: 700,
              }}
            >
              Skills & Target Goals
            </h3>
            {profile ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                {/* Skills */}
                <div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      marginBottom: "0.4rem",
                    }}
                  >
                    Current Skills
                  </div>
                  {profile.currentSkills?.length > 0 ? (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "0.4rem",
                      }}
                    >
                      {profile.currentSkills.map((sk, idx) => (
                        <span
                          key={idx}
                          style={{
                            background: "rgba(99, 102, 241, 0.15)",
                            color: "#a5b4fc",
                            border: "1px solid rgba(99, 102, 241, 0.3)",
                            padding: "0.2rem 0.55rem",
                            borderRadius: "4px",
                            fontSize: "0.8rem",
                          }}
                        >
                          {sk.name} ({sk.level})
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span
                      style={{
                        color: "var(--text-muted)",
                        fontSize: "0.85rem",
                      }}
                    >
                      None listed
                    </span>
                  )}
                </div>

                {/* Goals */}
                <div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      marginBottom: "0.4rem",
                    }}
                  >
                    Learning Goals
                  </div>
                  {profile.learningGoals?.length > 0 ? (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "0.4rem",
                      }}
                    >
                      {profile.learningGoals.map((g, idx) => (
                        <span
                          key={idx}
                          style={{
                            background: "rgba(16, 185, 129, 0.12)",
                            color: "#34d399",
                            border: "1px solid rgba(16, 185, 129, 0.25)",
                            padding: "0.2rem 0.55rem",
                            borderRadius: "4px",
                            fontSize: "0.8rem",
                          }}
                        >
                          🎯 {g.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span
                      style={{
                        color: "var(--text-muted)",
                        fontSize: "0.85rem",
                      }}
                    >
                      None listed
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: "0.875rem",
                  margin: 0,
                }}
              >
                No skills or goals configured.
              </p>
            )}
          </div>
        </div>

        {/* Assessment Attempts */}
        <div
          style={{
            background: "var(--bg-surface, #1e293b)",
            border: "1px solid var(--border-color, #334155)",
            borderRadius: "12px",
            padding: "1.5rem",
          }}
        >
          <h3
            style={{
              margin: "0 0 1rem 0",
              fontSize: "1.1rem",
              fontWeight: 700,
            }}
          >
            Psychometric Assessment History ({attempts.length})
          </h3>
          {attempts.length === 0 ? (
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "0.875rem",
                margin: 0,
              }}
            >
              Learner has not initiated any assessments yet.
            </p>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              {attempts.map((att) => (
                <div
                  key={att._id}
                  style={{
                    padding: "1rem",
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                        {att.assessment?.title || "Assessment"}
                      </span>
                      <span
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--text-muted)",
                          marginLeft: "0.5rem",
                        }}
                      >
                        ({att.assessment?.type})
                      </span>
                    </div>
                    <StatusBadge status={att.status} size="small" />
                  </div>

                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--text-muted)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Started: {new Date(att.createdAt).toLocaleString()}
                    {att.submittedAt &&
                      ` • Submitted: ${new Date(att.submittedAt).toLocaleString()}`}
                  </div>

                  {att.scores && Object.keys(att.scores).length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "0.5rem",
                        marginTop: "0.5rem",
                      }}
                    >
                      {Object.entries(att.scores).map(([dim, score]) => (
                        <span
                          key={dim}
                          style={{
                            background: "rgba(255, 255, 255, 0.05)",
                            border: "1px solid var(--border-color)",
                            padding: "0.2rem 0.5rem",
                            borderRadius: "4px",
                            fontSize: "0.75rem",
                          }}
                        >
                          <strong>{dim}:</strong> {score}%
                        </span>
                      ))}
                    </div>
                  )}

                  {att.resultSummary && (
                    <p
                      style={{
                        margin: "0.5rem 0 0 0",
                        fontSize: "0.85rem",
                        color: "var(--text-secondary)",
                        fontStyle: "italic",
                      }}
                    >
                      "{att.resultSummary}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Learning Path & Progress */}
        <div
          style={{
            background: "var(--bg-surface, #1e293b)",
            border: "1px solid var(--border-color, #334155)",
            borderRadius: "12px",
            padding: "1.5rem",
          }}
        >
          <h3
            style={{
              margin: "0 0 1rem 0",
              fontSize: "1.1rem",
              fontWeight: 700,
            }}
          >
            Active Learning Path & Progress
          </h3>
          {learningPath ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
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
                <div>
                  <span style={{ fontWeight: 700, fontSize: "1rem" }}>
                    Version {learningPath.version}
                  </span>
                  <span
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--text-muted)",
                      marginLeft: "0.5rem",
                    }}
                  >
                    Generated by: {learningPath.generatedBy}
                  </span>
                </div>
                <div
                  style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}
                >
                  Duration: {learningPath.estimatedDuration} mins
                </div>
              </div>

              {progressSummary && (
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "0.85rem",
                      marginBottom: "0.4rem",
                    }}
                  >
                    <span style={{ color: "var(--text-muted)" }}>
                      Overall Path Completion:
                    </span>
                    <span style={{ fontWeight: 700, color: "#10b981" }}>
                      {progressSummary.overallProgress}%
                    </span>
                  </div>
                  <ProgressBar
                    value={progressSummary.overallProgress}
                    max={100}
                    height="8px"
                  />
                  <div
                    style={{
                      display: "flex",
                      gap: "1rem",
                      fontSize: "0.8rem",
                      color: "var(--text-muted)",
                      marginTop: "0.4rem",
                    }}
                  >
                    <span>✓ Completed: {progressSummary.completedModules}</span>
                    <span>
                      ▶ In Progress: {progressSummary.inProgressModules}
                    </span>
                    <span>⏭ Skipped: {progressSummary.skippedModules}</span>
                  </div>
                </div>
              )}

              {/* Module List */}
              <div style={{ marginTop: "0.5rem" }}>
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    marginBottom: "0.5rem",
                  }}
                >
                  Curriculum Sequence ({learningPath.modules?.length} Modules)
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                >
                  {learningPath.modules?.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "0.6rem 0.85rem",
                        background: "rgba(255, 255, 255, 0.02)",
                        borderRadius: "6px",
                        border: "1px solid var(--border-color)",
                        fontSize: "0.85rem",
                      }}
                    >
                      <div>
                        <span
                          style={{
                            color: "var(--text-muted)",
                            marginRight: "0.5rem",
                          }}
                        >
                          #{item.order}
                        </span>
                        <span style={{ fontWeight: 600 }}>
                          {item.module?.title || "Module"}
                        </span>
                        <span
                          style={{
                            color: "var(--text-muted)",
                            marginLeft: "0.5rem",
                            fontSize: "0.75rem",
                          }}
                        >
                          ({item.module?.difficulty})
                        </span>
                      </div>
                      <StatusBadge
                        status={item.status || "NOT_STARTED"}
                        size="small"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "0.875rem",
                margin: 0,
              }}
            >
              Learner does not currently have an active learning path generated.
            </p>
          )}
        </div>

        {/* Non-Destructive Administrative Notice */}
        <div
          style={{
            padding: "0.85rem 1rem",
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px solid var(--border-color)",
            borderRadius: "8px",
            fontSize: "0.8rem",
            color: "var(--text-muted)",
            textAlign: "center",
          }}
        >
          🔒 <strong>Read-Only Inspection:</strong> Administrative inspection
          preserves the integrity of student-owned execution records. Module
          progress and assessment attempts cannot be manually modified by
          administrators.
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={modalOpen}
        title={
          user.isActive
            ? "Deactivate Learner Account"
            : "Activate Learner Account"
        }
        message={`Are you sure you want to ${user.isActive ? "deactivate" : "activate"} ${user.firstName} ${user.lastName}'s account?`}
        confirmLabel={user.isActive ? "Deactivate" : "Activate"}
        confirmVariant={user.isActive ? "danger" : "primary"}
        loading={toggleLoading}
        onConfirm={handleToggleStatus}
        onCancel={() => setModalOpen(false)}
      />
    </AdminLayout>
  );
}
