"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import profileService from "../../services/profileService";
import assessmentService from "../../services/assessmentService";
import authService from "../../services/authService";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Form states
  const [educationLevel, setEducationLevel] = useState("UNDERGRADUATE");
  const [experienceLevel, setExperienceLevel] = useState("BEGINNER");
  const [weeklyHours, setWeeklyHours] = useState(10);
  const [preferredFormat, setPreferredFormat] = useState("MIXED");
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillLevel, setNewSkillLevel] = useState("BEGINNER");
  const [skills, setSkills] = useState([]);
  const [newGoalName, setNewGoalName] = useState("");
  const [goals, setGoals] = useState([]);

  useEffect(() => {
    const user = authService.getUser();
    if (!user) {
      router.push("/login?redirect=/profile");
      return;
    }

    const loadProfileData = async () => {
      try {
        setLoading(true);
        // Load profile
        try {
          const res = await profileService.getMyProfile();
          if (res.success && res.data) {
            const p = res.data;
            setProfile(p);
            setEducationLevel(p.educationLevel || "UNDERGRADUATE");
            setExperienceLevel(p.experienceLevel || "BEGINNER");
            setWeeklyHours(p.weeklyLearningHours || 10);
            setPreferredFormat(
              p.learningPreferences?.preferredFormat || "MIXED",
            );
            setSkills(p.currentSkills || []);
            setGoals(p.learningGoals || []);
          }
        } catch (err) {
          if (err.data?.errorCode === "PROFILE_NOT_FOUND") {
            // Profile not initialized yet; defaults remain in form
          } else {
            throw err;
          }
        }

        // Load attempts to allow sync
        try {
          const attRes = await assessmentService.getMyAttempts();
          if (attRes.success && Array.isArray(attRes.data)) {
            setAttempts(attRes.data);
          }
        } catch (e) {
          // Ignore attempt fetch error
        }
      } catch (err) {
        setError(err.message || "Failed to load learner profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [router]);

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    if (
      skills.some(
        (s) => s.name.toLowerCase() === newSkillName.trim().toLowerCase(),
      )
    ) {
      setError("Skill already exists in your profile");
      return;
    }
    setSkills([...skills, { name: newSkillName.trim(), level: newSkillLevel }]);
    setNewSkillName("");
    setError(null);
  };

  const handleRemoveSkill = (skillIndex) => {
    setSkills(skills.filter((_, idx) => idx !== skillIndex));
  };

  const handleAddGoal = (e) => {
    e.preventDefault();
    if (!newGoalName.trim()) return;
    if (
      goals.some(
        (g) => g.name.toLowerCase() === newGoalName.trim().toLowerCase(),
      )
    ) {
      setError("Goal already exists in your profile");
      return;
    }
    setGoals([...goals, { name: newGoalName.trim(), priority: 2 }]);
    setNewGoalName("");
    setError(null);
  };

  const handleRemoveGoal = (goalIndex) => {
    setGoals(goals.filter((_, idx) => idx !== goalIndex));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setMessage(null);

      const payload = {
        educationLevel,
        experienceLevel,
        weeklyLearningHours: Number(weeklyHours),
        currentSkills: skills,
        learningGoals: goals,
        learningPreferences: {
          preferredFormat,
          preferredDifficulty: experienceLevel,
          preferredSessionDuration: 45,
        },
      };

      const res = await profileService.updateMyProfile(payload);
      if (res.success) {
        setProfile(res.data);
        setMessage("Learner profile saved successfully!");
      }
    } catch (err) {
      setError(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateFromAttempt = async (attemptId) => {
    try {
      setSaving(true);
      setError(null);
      const res = await profileService.generateFromAssessment(attemptId);
      if (res.success) {
        setProfile(res.data);
        setMessage(
          "Profile psychometrics synced successfully from assessment!",
        );
      }
    } catch (err) {
      setError(err.message || "Failed to generate profile from assessment");
    } finally {
      setSaving(false);
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
        Loading learner profile...
      </div>
    );
  }

  const completedAttempts = attempts.filter((a) => a.status === "COMPLETED");

  return (
    <div className="profile-container">
      <div className="profile-header-row">
        <div>
          <h1
            style={{
              fontSize: "1.85rem",
              fontWeight: 800,
              color: "var(--text-primary)",
            }}
          >
            Learner Profile
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Maintain your educational background, skills, and assessment-derived
            psychometrics.
          </p>
        </div>

        {profile && (
          <div style={{ textAlign: "right" }}>
            <span className="completeness-badge">
              {profile.profileCompleteness || 0}% Complete
            </span>
            <span
              style={{
                display: "block",
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                marginTop: "0.25rem",
              }}
            >
              Profile v{profile.profileVersion || 1}
            </span>
          </div>
        )}
      </div>

      {message && (
        <div
          className="alert-box alert-success"
          style={{ marginBottom: "1.5rem" }}
        >
          {message}
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

      {/* Assessment-Derived Attributes Section */}
      <div
        className="profile-card"
        style={{ borderLeft: "4px solid var(--primary)" }}
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
            <h2
              style={{
                fontSize: "1.2rem",
                fontWeight: 700,
                color: "var(--text-primary)",
              }}
            >
              Assessment-Derived Psychometrics
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              Derived authoritatively by the backend scoring engine from your
              completed assessments.
            </p>
          </div>

          {completedAttempts.length > 0 && (
            <button
              onClick={() =>
                handleGenerateFromAttempt(completedAttempts[0]._id)
              }
              disabled={saving}
              className="btn-secondary-small"
              style={{ cursor: "pointer" }}
            >
              Sync from Latest Assessment
            </button>
          )}
        </div>

        {profile?.lastAssessmentAttempt ? (
          <div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1.5rem",
                marginBottom: "1.5rem",
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    color: "#34d399",
                    marginBottom: "0.6rem",
                  }}
                >
                  Demonstrated Strengths (≥ 75%)
                </h3>
                <div
                  style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}
                >
                  {profile.strengths && profile.strengths.length > 0 ? (
                    profile.strengths.map((s) => (
                      <span
                        key={s}
                        className="badge-strength"
                        style={{ textTransform: "capitalize" }}
                      >
                        ★ {s}
                      </span>
                    ))
                  ) : (
                    <span
                      style={{
                        fontSize: "0.85rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      None identified above threshold yet.
                    </span>
                  )}
                </div>
              </div>

              <div>
                <h3
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    color: "#fbbf24",
                    marginBottom: "0.6rem",
                  }}
                >
                  Development Areas (&lt; 60%)
                </h3>
                <div
                  style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}
                >
                  {profile.improvementAreas &&
                  profile.improvementAreas.length > 0 ? (
                    profile.improvementAreas.map((ia) => (
                      <span
                        key={ia}
                        className="badge-development"
                        style={{ textTransform: "capitalize" }}
                      >
                        ▲ {ia}
                      </span>
                    ))
                  ) : (
                    <span
                      style={{
                        fontSize: "0.85rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      No targeted development areas detected.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {profile.assessmentDimensions && (
              <div>
                <h3
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    marginBottom: "0.75rem",
                    textTransform: "uppercase",
                  }}
                >
                  Dimension Alignment Breakdown
                </h3>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                  }}
                >
                  {Object.entries(
                    profile.assessmentDimensions instanceof Map
                      ? Object.fromEntries(profile.assessmentDimensions)
                      : profile.assessmentDimensions,
                  ).map(([dim, score]) => (
                    <div key={dim}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "0.85rem",
                          marginBottom: "0.25rem",
                        }}
                      >
                        <span
                          style={{
                            textTransform: "capitalize",
                            color: "var(--text-primary)",
                          }}
                        >
                          {dim}
                        </span>
                        <span style={{ color: "#a5b4fc", fontWeight: 600 }}>
                          {score}%
                        </span>
                      </div>
                      <div className="dim-bar-track" style={{ height: "6px" }}>
                        <div
                          className="dim-bar-fill"
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              padding: "1rem",
              background: "rgba(255, 255, 255, 0.02)",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontSize: "0.9rem",
                color: "var(--text-muted)",
                marginBottom: "0.75rem",
              }}
            >
              No assessment-derived profile generated yet.
            </p>
            <Link href="/assessments" className="btn-primary-small">
              Take Psychometric Assessment
            </Link>
          </div>
        )}
      </div>

      {/* User-Managed Profile Attributes Section */}
      <form onSubmit={handleSaveProfile} className="profile-card">
        <h2
          style={{
            fontSize: "1.2rem",
            fontWeight: 700,
            marginBottom: "1.25rem",
            color: "var(--text-primary)",
          }}
        >
          User-Managed Information
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1.25rem",
            marginBottom: "1.5rem",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.85rem",
                color: "var(--text-secondary)",
                marginBottom: "0.4rem",
              }}
            >
              Education Level
            </label>
            <select
              value={educationLevel}
              onChange={(e) => setEducationLevel(e.target.value)}
              className="auth-input"
              style={{
                width: "100%",
                background: "var(--bg-surface-elevated)",
              }}
            >
              <option value="HIGH_SCHOOL">High School</option>
              <option value="UNDERGRADUATE">Undergraduate Degree</option>
              <option value="POSTGRADUATE">Postgraduate Degree</option>
              <option value="BOOTCAMP">Bootcamp / Technical Program</option>
              <option value="SELF_TAUGHT">Self-Taught</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.85rem",
                color: "var(--text-secondary)",
                marginBottom: "0.4rem",
              }}
            >
              Overall Experience Level
            </label>
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              className="auth-input"
              style={{
                width: "100%",
                background: "var(--bg-surface-elevated)",
              }}
            >
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </select>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1.25rem",
            marginBottom: "1.5rem",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.85rem",
                color: "var(--text-secondary)",
                marginBottom: "0.4rem",
              }}
            >
              Weekly Learning Hours (1–168)
            </label>
            <input
              type="number"
              min="1"
              max="168"
              value={weeklyHours}
              onChange={(e) => setWeeklyHours(e.target.value)}
              className="auth-input"
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.85rem",
                color: "var(--text-secondary)",
                marginBottom: "0.4rem",
              }}
            >
              Preferred Learning Format
            </label>
            <select
              value={preferredFormat}
              onChange={(e) => setPreferredFormat(e.target.value)}
              className="auth-input"
              style={{
                width: "100%",
                background: "var(--bg-surface-elevated)",
              }}
            >
              <option value="PROJECT">Project-Based</option>
              <option value="VIDEO">Video Tutorials</option>
              <option value="READING">Reading & Documentation</option>
              <option value="PRACTICE">Hands-on Practice</option>
              <option value="MIXED">Mixed Multi-format</option>
            </select>
          </div>
        </div>

        {/* Current Skills Manager */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label
            style={{
              display: "block",
              fontSize: "0.85rem",
              color: "var(--text-secondary)",
              marginBottom: "0.5rem",
            }}
          >
            Current Skills
          </label>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5rem",
              marginBottom: "0.75rem",
            }}
          >
            {skills.map((sk, idx) => (
              <span key={sk.name} className="skill-pill">
                <strong>{sk.name}</strong>
                <span className="skill-pill-level">{sk.level}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(idx)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#f87171",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                  }}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="text"
              placeholder="e.g. JavaScript, Python, SQL"
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              className="auth-input"
              style={{ flex: 1 }}
            />
            <select
              value={newSkillLevel}
              onChange={(e) => setNewSkillLevel(e.target.value)}
              className="auth-input"
              style={{
                width: "140px",
                background: "var(--bg-surface-elevated)",
              }}
            >
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </select>
            <button
              type="button"
              onClick={handleAddSkill}
              className="btn-secondary-small"
            >
              + Add Skill
            </button>
          </div>
        </div>

        {/* Learning Goals Manager */}
        <div style={{ marginBottom: "2rem" }}>
          <label
            style={{
              display: "block",
              fontSize: "0.85rem",
              color: "var(--text-secondary)",
              marginBottom: "0.5rem",
            }}
          >
            Target Learning Goals
          </label>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5rem",
              marginBottom: "0.75rem",
            }}
          >
            {goals.map((g, idx) => (
              <span key={g.name} className="skill-pill">
                <strong>{g.name}</strong>
                <button
                  type="button"
                  onClick={() => handleRemoveGoal(idx)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#f87171",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                  }}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="text"
              placeholder="e.g. Become a Backend Architect"
              value={newGoalName}
              onChange={(e) => setNewGoalName(e.target.value)}
              className="auth-input"
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={handleAddGoal}
              className="btn-secondary-small"
            >
              + Add Goal
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="submit-btn"
          style={{ width: "auto", padding: "0.75rem 2rem" }}
        >
          {saving ? "Saving Profile..." : "Save Profile Changes"}
        </button>
      </form>
    </div>
  );
}
