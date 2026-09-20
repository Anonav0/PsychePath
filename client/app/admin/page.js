"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AdminLayout from "../../components/admin/AdminLayout";
import adminService from "../../services/adminService";
import StatusBadge from "../../components/ui/StatusBadge";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await adminService.getStats();
        if (res?.success) {
          setStats(res.data);
        }
      } catch (err) {
        setError(err.message || "Failed to load admin statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <AdminLayout
      title="Admin Dashboard Overview"
      subtitle="Real-time platform metrics, learner engagement, and system management."
    >
      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: "4rem",
            color: "var(--text-muted)",
          }}
        >
          Aggregating platform metrics...
        </div>
      ) : error ? (
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
          {error}
        </div>
      ) : stats ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* Top Metrics Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1.25rem",
            }}
          >
            {/* Total Learners */}
            <div
              style={{
                background: "var(--bg-surface, #1e293b)",
                border: "1px solid var(--border-color, #334155)",
                borderRadius: "12px",
                padding: "1.5rem",
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
                <span
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--text-muted)",
                    fontWeight: 600,
                  }}
                >
                  TOTAL LEARNERS
                </span>
                <span style={{ fontSize: "1.25rem" }}>👥</span>
              </div>
              <div
                style={{
                  fontSize: "2rem",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                }}
              >
                {stats.totalLearners}
              </div>
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "#10b981",
                  marginTop: "0.25rem",
                }}
              >
                {stats.activeLearners} active accounts
              </div>
            </div>

            {/* Active Learners */}
            <div
              style={{
                background: "var(--bg-surface, #1e293b)",
                border: "1px solid var(--border-color, #334155)",
                borderRadius: "12px",
                padding: "1.5rem",
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
                <span
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--text-muted)",
                    fontWeight: 600,
                  }}
                >
                  ACTIVE LEARNERS
                </span>
                <span style={{ fontSize: "1.25rem" }}>🟢</span>
              </div>
              <div
                style={{ fontSize: "2rem", fontWeight: 800, color: "#10b981" }}
              >
                {stats.activeLearners}
              </div>
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  marginTop: "0.25rem",
                }}
              >
                Eligible for recommendations
              </div>
            </div>

            {/* Total Assessments */}
            <div
              style={{
                background: "var(--bg-surface, #1e293b)",
                border: "1px solid var(--border-color, #334155)",
                borderRadius: "12px",
                padding: "1.5rem",
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
                <span
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--text-muted)",
                    fontWeight: 600,
                  }}
                >
                  ASSESSMENTS
                </span>
                <span style={{ fontSize: "1.25rem" }}>📋</span>
              </div>
              <div
                style={{
                  fontSize: "2rem",
                  fontWeight: 800,
                  color: "var(--primary, #6366f1)",
                }}
              >
                {stats.totalAssessments}
              </div>
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  marginTop: "0.25rem",
                }}
              >
                Diagnostic & skill evaluations
              </div>
            </div>

            {/* Total Modules */}
            <div
              style={{
                background: "var(--bg-surface, #1e293b)",
                border: "1px solid var(--border-color, #334155)",
                borderRadius: "12px",
                padding: "1.5rem",
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
                <span
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--text-muted)",
                    fontWeight: 600,
                  }}
                >
                  CURRICULUM MODULES
                </span>
                <span style={{ fontSize: "1.25rem" }}>📚</span>
              </div>
              <div
                style={{ fontSize: "2rem", fontWeight: 800, color: "#a855f7" }}
              >
                {stats.totalCurriculumModules}
              </div>
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  marginTop: "0.25rem",
                }}
              >
                Active learning catalog nodes
              </div>
            </div>
          </div>

          {/* Quick Management Links */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1.25rem",
            }}
          >
            <Link
              href="/admin/learners"
              style={{
                background: "var(--bg-surface, #1e293b)",
                border: "1px solid var(--border-color, #334155)",
                borderRadius: "12px",
                padding: "1.5rem",
                textDecoration: "none",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                transition: "border-color 0.2s ease",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <span style={{ fontSize: "1.5rem" }}>👥</span>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                  }}
                >
                  Learner Management
                </h3>
              </div>
              <p
                style={{
                  margin: 0,
                  color: "var(--text-secondary)",
                  fontSize: "0.875rem",
                  lineHeight: 1.4,
                }}
              >
                Search, filter, and inspect learner profiles, assessment
                attempts, and active learning paths.
              </p>
              <span
                style={{
                  fontSize: "0.85rem",
                  color: "var(--primary, #6366f1)",
                  fontWeight: 600,
                  marginTop: "0.5rem",
                }}
              >
                Manage Learners →
              </span>
            </Link>

            <Link
              href="/admin/assessments"
              style={{
                background: "var(--bg-surface, #1e293b)",
                border: "1px solid var(--border-color, #334155)",
                borderRadius: "12px",
                padding: "1.5rem",
                textDecoration: "none",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                transition: "border-color 0.2s ease",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <span style={{ fontSize: "1.5rem" }}>📋</span>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                  }}
                >
                  Assessment Management
                </h3>
              </div>
              <p
                style={{
                  margin: 0,
                  color: "var(--text-secondary)",
                  fontSize: "0.875rem",
                  lineHeight: 1.4,
                }}
              >
                Create and edit diagnostic evaluations, configure dimension
                mappings, and manage question sets.
              </p>
              <span
                style={{
                  fontSize: "0.85rem",
                  color: "var(--primary, #6366f1)",
                  fontWeight: 600,
                  marginTop: "0.5rem",
                }}
              >
                Manage Assessments →
              </span>
            </Link>

            <Link
              href="/admin/curriculum"
              style={{
                background: "var(--bg-surface, #1e293b)",
                border: "1px solid var(--border-color, #334155)",
                borderRadius: "12px",
                padding: "1.5rem",
                textDecoration: "none",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                transition: "border-color 0.2s ease",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <span style={{ fontSize: "1.5rem" }}>📚</span>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                  }}
                >
                  Curriculum Management
                </h3>
              </div>
              <p
                style={{
                  margin: 0,
                  color: "var(--text-secondary)",
                  fontSize: "0.875rem",
                  lineHeight: 1.4,
                }}
              >
                Author curriculum modules, define prerequisite dependency
                graphs, and manage resource links.
              </p>
              <span
                style={{
                  fontSize: "0.85rem",
                  color: "var(--primary, #6366f1)",
                  fontWeight: 600,
                  marginTop: "0.5rem",
                }}
              >
                Manage Curriculum →
              </span>
            </Link>
          </div>

          {/* Tables: Recent Learners & Recent Attempts */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {/* Recent Learners */}
            <div
              style={{
                background: "var(--bg-surface, #1e293b)",
                border: "1px solid var(--border-color, #334155)",
                borderRadius: "12px",
                padding: "1.5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1rem",
                }}
              >
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>
                  Recent Learners
                </h3>
                <Link
                  href="/admin/learners"
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--primary, #6366f1)",
                    textDecoration: "none",
                  }}
                >
                  View All
                </Link>
              </div>

              {stats.recentLearners?.length === 0 ? (
                <p
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "0.875rem",
                    margin: 0,
                  }}
                >
                  No learners registered yet.
                </p>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                  }}
                >
                  {stats.recentLearners?.map((learner) => (
                    <div
                      key={learner._id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "0.75rem",
                        background: "rgba(255, 255, 255, 0.02)",
                        borderRadius: "8px",
                        border: "1px solid var(--border-color)",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                          {learner.firstName} {learner.lastName}
                        </div>
                        <div
                          style={{
                            fontSize: "0.8rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          {learner.email}
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                        }}
                      >
                        <StatusBadge
                          status={learner.isActive ? "ACTIVE" : "INACTIVE"}
                          size="small"
                        />
                        <Link
                          href={`/admin/learners/${learner._id}`}
                          className="btn-secondary-small"
                          style={{
                            fontSize: "0.75rem",
                            padding: "0.25rem 0.6rem",
                          }}
                        >
                          Inspect
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Assessment Attempts */}
            <div
              style={{
                background: "var(--bg-surface, #1e293b)",
                border: "1px solid var(--border-color, #334155)",
                borderRadius: "12px",
                padding: "1.5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1rem",
                }}
              >
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>
                  Recent Assessment Activity
                </h3>
                <span
                  style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}
                >
                  Authoritative Log
                </span>
              </div>

              {stats.recentAttempts?.length === 0 ? (
                <p
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "0.875rem",
                    margin: 0,
                  }}
                >
                  No assessment attempts recorded yet.
                </p>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                  }}
                >
                  {stats.recentAttempts?.map((att) => (
                    <div
                      key={att._id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "0.75rem",
                        background: "rgba(255, 255, 255, 0.02)",
                        borderRadius: "8px",
                        border: "1px solid var(--border-color)",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                          {att.assessment?.title || "Psychometric Assessment"}
                        </div>
                        <div
                          style={{
                            fontSize: "0.8rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          {att.user
                            ? `${att.user.firstName} ${att.user.lastName} (${att.user.email})`
                            : "Student"}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <StatusBadge status={att.status} size="small" />
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--text-muted)",
                            marginTop: "0.25rem",
                          }}
                        >
                          {att.submittedAt
                            ? new Date(att.submittedAt).toLocaleDateString()
                            : new Date(att.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}
