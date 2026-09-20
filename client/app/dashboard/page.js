"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import authService from "../../services/authService";
import profileService from "../../services/profileService";
import learningPathService from "../../services/learningPathService";
import progressService from "../../services/progressService";
import ProgressBar from "../../components/ui/ProgressBar";
import StatusBadge from "../../components/ui/StatusBadge";
import EmptyState from "../../components/ui/EmptyState";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activePath, setActivePath] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const currentUser = authService.getUser();
    if (!currentUser) {
      router.push("/login?redirect=/dashboard");
      return;
    }
    setUser(currentUser);

    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch Profile, Active Path, and Progress in parallel
        const [profileRes, pathRes, progressRes] = await Promise.allSettled([
          profileService.getMyProfile(),
          learningPathService.getCurrentPath(),
          progressService.getCurrentPathProgress(),
        ]);

        if (profileRes.status === "fulfilled" && profileRes.value.success) {
          setProfile(profileRes.value.data);
        }

        if (pathRes.status === "fulfilled" && pathRes.value.success) {
          setActivePath(pathRes.value.data);

          // Fetch recent audit history for active path
          try {
            const histRes = await progressService.getPathHistory(
              pathRes.value.data.id || pathRes.value.data._id,
              { limit: 5 },
            );
            if (histRes.success && Array.isArray(histRes.data?.history)) {
              setHistory(histRes.data.history);
            }
          } catch {
            // Non-critical audit history failure
          }
        }

        if (progressRes.status === "fulfilled" && progressRes.value.success) {
          setProgressData(progressRes.value.data);
        }
      } catch (err) {
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [router]);

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
          Loading your learning dashboard...
        </p>
      </div>
    );
  }

  // Determine current/next actionable module
  const nextModule = progressData?.modules?.find(
    (m) => m.status === "IN_PROGRESS" || m.status === "NOT_STARTED",
  );

  return (
    <div
      style={{
        maxWidth: "1050px",
        margin: "0 auto",
        padding: "1.5rem 1rem 3rem",
      }}
    >
      {/* 1. Welcome Banner */}
      <div
        style={{
          background:
            "linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(168, 85, 247, 0.12))",
          border: "1px solid rgba(99, 102, 241, 0.3)",
          borderRadius: "14px",
          padding: "2rem",
          marginBottom: "2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "0.35rem",
            }}
          >
            <span style={{ fontSize: "1.25rem" }}>👋</span>
            <span
              style={{
                fontSize: "0.85rem",
                fontWeight: 700,
                textTransform: "uppercase",
                color: "#a5b4fc",
              }}
            >
              Student Portal
            </span>
          </div>
          <h1 style={{ fontSize: "1.85rem", fontWeight: 800, margin: 0 }}>
            Welcome back, {user?.firstName}!
          </h1>
          <p
            style={{
              color: "var(--text-secondary)",
              marginTop: "0.4rem",
              fontSize: "0.95rem",
            }}
          >
            Track your cognitive metrics, follow your personalized curriculum,
            and build technical mastery.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link
            href="/learning-path"
            style={{
              background: "linear-gradient(135deg, #6366f1, #a855f7)",
              color: "#ffffff",
              padding: "0.65rem 1.4rem",
              borderRadius: "8px",
              fontWeight: 600,
              fontSize: "0.9rem",
              textDecoration: "none",
            }}
          >
            Open Learning Path →
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert-box alert-error" style={{ marginBottom: "2rem" }}>
          {error}
        </div>
      )}

      {/* 2. Top Summary Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        {/* Card A: Active Learning Path & Progress */}
        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-color)",
            borderRadius: "12px",
            padding: "1.5rem",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "1rem",
            }}
          >
            <div>
              <span
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}
              >
                Active Path
              </span>
              <h3
                style={{
                  fontSize: "1.15rem",
                  fontWeight: 700,
                  marginTop: "0.25rem",
                }}
              >
                {activePath
                  ? activePath.title || `Learning Path v${activePath.version}`
                  : "No Path Generated"}
              </h3>
            </div>
            {activePath && <StatusBadge status="ACTIVE" />}
          </div>

          {activePath ? (
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "0.5rem",
                  fontSize: "0.85rem",
                }}
              >
                <span style={{ color: "var(--text-secondary)" }}>Progress</span>
                <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                  {progressData?.pathSummary?.overallProgress ?? 0}%
                </span>
              </div>
              <ProgressBar
                value={progressData?.pathSummary?.overallProgress ?? 0}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "0.75rem",
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                }}
              >
                <span>
                  {progressData?.pathSummary?.completedModules ?? 0} of{" "}
                  {progressData?.pathSummary?.totalModules ?? 0} modules
                </span>
                <span>{activePath.estimatedDuration} hrs total</span>
              </div>
            </div>
          ) : (
            <div>
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.85rem",
                  marginBottom: "1rem",
                }}
              >
                Take your assessment or view recommendations to build your
                official personalized learning path.
              </p>
              <Link
                href="/recommendations"
                style={{
                  display: "inline-block",
                  padding: "0.5rem 1rem",
                  background: "var(--bg-surface-elevated)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "6px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  textDecoration: "none",
                }}
              >
                Generate Path →
              </Link>
            </div>
          )}
        </div>

        {/* Card B: Learner Profile Completeness */}
        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-color)",
            borderRadius: "12px",
            padding: "1.5rem",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "1rem",
            }}
          >
            <div>
              <span
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}
              >
                Learner Profile
              </span>
              <h3
                style={{
                  fontSize: "1.15rem",
                  fontWeight: 700,
                  marginTop: "0.25rem",
                }}
              >
                {profile
                  ? `${profile.completeness}% Complete`
                  : "Profile Incomplete"}
              </h3>
            </div>
            <span
              style={{
                fontSize: "0.75rem",
                padding: "0.2rem 0.6rem",
                borderRadius: "9999px",
                background:
                  profile?.completeness === 100
                    ? "rgba(16, 185, 129, 0.15)"
                    : "rgba(245, 158, 11, 0.15)",
                color: profile?.completeness === 100 ? "#10b981" : "#f59e0b",
                fontWeight: 700,
              }}
            >
              {profile?.completeness === 100 ? "Verified" : "Setup Needed"}
            </span>
          </div>

          <ProgressBar
            value={profile?.completeness ?? 20}
            variant={profile?.completeness === 100 ? "success" : "warning"}
          />

          <div
            style={{
              marginTop: "1rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}
            >
              {profile?.currentSkills?.length ?? 0} skills •{" "}
              {profile?.learningGoals?.length ?? 0} goals
            </span>
            <Link
              href="/profile"
              style={{
                fontSize: "0.85rem",
                color: "var(--primary)",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Edit Profile →
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Next Recommended Module / Action Card */}
      {nextModule && (
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
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "0.75rem",
            }}
          >
            <span style={{ fontSize: "1.1rem" }}>🎯</span>
            <span
              style={{
                fontSize: "0.8rem",
                fontWeight: 700,
                textTransform: "uppercase",
                color: "var(--primary)",
              }}
            >
              Current / Next Module
            </span>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "0.35rem",
                }}
              >
                <StatusBadge status={nextModule.status} size="small" />
                <span
                  style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}
                >
                  Step #{nextModule.order} • {nextModule.category} •{" "}
                  {nextModule.estimatedDuration} hrs
                </span>
              </div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>
                {nextModule.title}
              </h3>
              {nextModule.reason && (
                <p
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "0.875rem",
                    marginTop: "0.35rem",
                    maxWidth: "650px",
                  }}
                >
                  💡 {nextModule.reason}
                </p>
              )}
            </div>

            <Link
              href="/learning-path"
              style={{
                background: "linear-gradient(135deg, #6366f1, #a855f7)",
                color: "#ffffff",
                padding: "0.6rem 1.4rem",
                borderRadius: "8px",
                fontWeight: 600,
                fontSize: "0.9rem",
                textDecoration: "none",
              }}
            >
              {nextModule.status === "IN_PROGRESS"
                ? "Continue Learning →"
                : "Start Module →"}
            </Link>
          </div>
        </div>
      )}

      {/* 4. Quick Actions Grid */}
      <div style={{ marginBottom: "2.5rem" }}>
        <h2
          style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" }}
        >
          Quick Actions
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
            gap: "1rem",
          }}
        >
          <Link
            href="/assessments"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              borderRadius: "10px",
              padding: "1.25rem",
              textDecoration: "none",
              color: "inherit",
              display: "block",
            }}
          >
            <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>📝</div>
            <div
              style={{
                fontWeight: 700,
                fontSize: "0.95rem",
                marginBottom: "0.25rem",
              }}
            >
              Take Assessment
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
              Diagnostic psychometrics
            </div>
          </Link>

          <Link
            href="/recommendations"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              borderRadius: "10px",
              padding: "1.25rem",
              textDecoration: "none",
              color: "inherit",
              display: "block",
            }}
          >
            <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>💡</div>
            <div
              style={{
                fontWeight: 700,
                fontSize: "0.95rem",
                marginBottom: "0.25rem",
              }}
            >
              Recommendations
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
              Multi-factor scoring
            </div>
          </Link>

          <Link
            href="/learning-path"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              borderRadius: "10px",
              padding: "1.25rem",
              textDecoration: "none",
              color: "inherit",
              display: "block",
            }}
          >
            <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>📘</div>
            <div
              style={{
                fontWeight: 700,
                fontSize: "0.95rem",
                marginBottom: "0.25rem",
              }}
            >
              Learning Path
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
              Curriculum timeline
            </div>
          </Link>

          <Link
            href="/progress"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              borderRadius: "10px",
              padding: "1.25rem",
              textDecoration: "none",
              color: "inherit",
              display: "block",
            }}
          >
            <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>📈</div>
            <div
              style={{
                fontWeight: 700,
                fontSize: "0.95rem",
                marginBottom: "0.25rem",
              }}
            >
              Progress Hub
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
              Audit activity logs
            </div>
          </Link>
        </div>
      </div>

      {/* 5. Recent Activity Snapshot */}
      {history.length > 0 && (
        <div>
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              marginBottom: "1rem",
            }}
          >
            Recent Learning Activity
          </h2>
          <div
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            {history.map((item, idx) => (
              <div
                key={item.id || idx}
                style={{
                  padding: "0.85rem 1.25rem",
                  borderBottom:
                    idx === history.length - 1
                      ? "none"
                      : "1px solid var(--border-color)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                  fontSize: "0.85rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                  }}
                >
                  <StatusBadge status={item.newStatus} size="small" />
                  <span style={{ fontWeight: 600 }}>
                    {item.moduleTitle || "Curriculum Module"}
                  </span>
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                  {new Date(item.timestamp).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
