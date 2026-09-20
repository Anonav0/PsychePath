"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import HealthStatus from "../components/HealthStatus";
import AuthStatusCard from "../components/AuthStatusCard";
import authService from "../services/authService";

export default function HomePage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(authService.getUser());
  }, []);

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "1rem 0" }}>
      {/* 1. Hero Section */}
      <section style={{ textAlign: "center", padding: "3rem 1rem 4rem" }}>
        <div
          style={{
            display: "inline-block",
            fontSize: "0.8rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            padding: "0.35rem 0.9rem",
            borderRadius: "9999px",
            background: "rgba(99, 102, 241, 0.15)",
            color: "#818cf8",
            border: "1px solid rgba(99, 102, 241, 0.3)",
            marginBottom: "1.5rem",
          }}
        >
          Psychometric Learning Path Recommender
        </div>

        <h1
          style={{
            fontSize: "clamp(2.2rem, 5vw, 3.75rem)",
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: "-0.03em",
            marginBottom: "1.25rem",
            background:
              "linear-gradient(135deg, #ffffff 0%, #cbd5e1 60%, #94a3b8 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Master Software Engineering <br />
          Tailored to How Your Brain Learns
        </h1>

        <p
          style={{
            fontSize: "1.15rem",
            color: "var(--text-secondary)",
            maxWidth: "680px",
            margin: "0 auto 2.5rem",
            lineHeight: 1.6,
          }}
        >
          PsychePath maps your cognitive strengths, aligns technical goals with
          prerequisite curriculum graphs, and generates personalized, AI-guided
          learning paths with verifiable progress tracking.
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          {user ? (
            <Link
              href="/dashboard"
              style={{
                background: "linear-gradient(135deg, #6366f1, #a855f7)",
                color: "#ffffff",
                padding: "0.85rem 2rem",
                borderRadius: "10px",
                fontWeight: 700,
                fontSize: "1rem",
                textDecoration: "none",
                boxShadow: "0 10px 25px -5px rgba(99, 102, 241, 0.4)",
              }}
            >
              Go to Your Dashboard →
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                style={{
                  background: "linear-gradient(135deg, #6366f1, #a855f7)",
                  color: "#ffffff",
                  padding: "0.85rem 2rem",
                  borderRadius: "10px",
                  fontWeight: 700,
                  fontSize: "1rem",
                  textDecoration: "none",
                  boxShadow: "0 10px 25px -5px rgba(99, 102, 241, 0.4)",
                }}
              >
                Get Started Free →
              </Link>
              <Link
                href="/login"
                style={{
                  background: "var(--bg-surface-elevated)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-color)",
                  padding: "0.85rem 2rem",
                  borderRadius: "10px",
                  fontWeight: 600,
                  fontSize: "1rem",
                  textDecoration: "none",
                }}
              >
                Sign In
              </Link>
            </>
          )}
          <Link
            href="/assessments"
            style={{
              background: "transparent",
              color: "var(--text-secondary)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              padding: "0.85rem 1.5rem",
              borderRadius: "10px",
              fontWeight: 600,
              fontSize: "1rem",
              textDecoration: "none",
            }}
          >
            Explore Diagnostics
          </Link>
        </div>
      </section>

      {/* 2. How It Works (5 Steps) */}
      <section style={{ marginBottom: "5rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <h2
            style={{
              fontSize: "1.85rem",
              fontWeight: 800,
              marginBottom: "0.5rem",
            }}
          >
            The 5-Step Learner Journey
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "1rem" }}>
            From diagnostic self-discovery to progressive curriculum mastery.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
            gap: "1rem",
          }}
        >
          {[
            {
              step: "01",
              title: "Cognitive Assessment",
              desc: "Complete a 12-question diagnostic assessing processing style, learning pace, and structure preference.",
              icon: "🧠",
            },
            {
              step: "02",
              title: "Learner Profile",
              desc: "Define your technical goals, existing skills, and weekly commitment hours.",
              icon: "👤",
            },
            {
              step: "03",
              title: "Curriculum Scoring",
              desc: "Deterministic multi-factor algorithm filters and scores modules by goals and prerequisite readiness.",
              icon: "🎯",
            },
            {
              step: "04",
              title: "AI Personalization",
              desc: "Gemini synthesizes a personalized pacing strategy and study approach with DAG integrity guarantees.",
              icon: "✨",
            },
            {
              step: "05",
              title: "Progress & Mastery",
              desc: "Execute modules, track monotonic percentages, audit transitions, and earn verified path completion.",
              icon: "🚀",
            },
          ].map((s) => (
            <div
              key={s.step}
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-color)",
                borderRadius: "12px",
                padding: "1.5rem",
                position: "relative",
              }}
            >
              <div
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  color: "var(--primary)",
                  marginBottom: "0.75rem",
                }}
              >
                STEP {s.step}
              </div>
              <div style={{ fontSize: "1.75rem", marginBottom: "0.75rem" }}>
                {s.icon}
              </div>
              <h3
                style={{
                  fontSize: "1.05rem",
                  fontWeight: 700,
                  marginBottom: "0.5rem",
                }}
              >
                {s.title}
              </h3>
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.85rem",
                  lineHeight: 1.5,
                }}
              >
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Core Architectural Features */}
      <section style={{ marginBottom: "5rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <h2
            style={{
              fontSize: "1.85rem",
              fontWeight: 800,
              marginBottom: "0.5rem",
            }}
          >
            Engineered for Educational Precision
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "1rem" }}>
            Built on strict computer science guarantees, deterministic rules,
            and AI guardrails.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "1.5rem",
          }}
        >
          <div
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              borderRadius: "12px",
              padding: "2rem",
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>📐</div>
            <h3
              style={{
                fontSize: "1.2rem",
                fontWeight: 700,
                marginBottom: "0.5rem",
              }}
            >
              Deterministic Prerequisite DAG
            </h3>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "0.9rem",
                lineHeight: 1.6,
              }}
            >
              Curriculum dependencies form a Directed Acyclic Graph (DAG) with
              Kahn cycle detection. Prerequisite modules are strictly scheduled
              before dependent topics, eliminating learning blockers.
            </p>
          </div>

          <div
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              borderRadius: "12px",
              padding: "2rem",
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🛡️</div>
            <h3
              style={{
                fontSize: "1.2rem",
                fontWeight: 700,
                marginBottom: "0.5rem",
              }}
            >
              Zero-Hallucination AI Architecture
            </h3>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "0.9rem",
                lineHeight: 1.6,
              }}
            >
              Gemini personalizes narrative and study strategy, but cannot
              invent courses or modify prerequisite rules. All module references
              and duration totals are authoritative in MongoDB.
            </p>
          </div>

          <div
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              borderRadius: "12px",
              padding: "2rem",
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>📊</div>
            <h3
              style={{
                fontSize: "1.2rem",
                fontWeight: 700,
                marginBottom: "0.5rem",
              }}
            >
              Server Source of Truth Progress
            </h3>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "0.9rem",
                lineHeight: 1.6,
              }}
            >
              Monotonic progress enforcement prevents accidental regression.
              Every transition is recorded in an immutable audit trail with
              versioned path isolation.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Educational Framing Notice */}
      <section
        style={{
          background: "rgba(99, 102, 241, 0.05)",
          border: "1px solid rgba(99, 102, 241, 0.2)",
          borderRadius: "12px",
          padding: "1.75rem 2rem",
          marginBottom: "4rem",
        }}
      >
        <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
          <span style={{ fontSize: "1.5rem" }}>ℹ️</span>
          <div>
            <h4
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                marginBottom: "0.35rem",
                color: "#a5b4fc",
              }}
            >
              Educational Scope & Non-Clinical Framing
            </h4>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "0.875rem",
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              PsychePath diagnostic assessments are designed purely to model
              learning pace, information processing preferences, and technical
              curriculum alignment. They do not constitute medical,
              psychological, or clinical evaluations.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Live Architecture & System Status */}
      <section style={{ marginBottom: "3rem" }}>
        <h3
          style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1rem" }}
        >
          Live System Health & API Telemetry
        </h3>
        <div className="status-grid-container">
          <HealthStatus />
          <AuthStatusCard />
        </div>
      </section>
    </div>
  );
}
