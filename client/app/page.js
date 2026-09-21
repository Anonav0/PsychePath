"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import authService from "../services/authService";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Compass,
  Brain,
  UserCheck,
  Target,
  Sparkles,
  Rocket,
  GitFork,
  ShieldCheck,
  Activity,
  ArrowRight,
  Info,
  CheckCircle,
} from "lucide-react";

export default function HomePage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(authService.getUser());
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-16 space-y-16 sm:space-y-24">
      {/* 1. Hero Section */}
      <section className="text-center max-w-4xl mx-auto space-y-6 pt-4">
        <div className="inline-flex items-center gap-2">
          <Badge
            variant="info"
            className="px-3 py-1 text-xs font-semibold uppercase tracking-wider"
          >
            Psychometric Learning Path Platform
          </Badge>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] text-foreground">
          Master Software Engineering <br className="hidden sm:inline" />
          <span className="text-primary">Tailored to How You Learn</span>
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          PsychePath evaluates your cognitive processing style, aligns your
          career goals with prerequisite curriculum graphs, and generates
          verifiable, AI-guided learning paths with verified progress tracking.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {user ? (
            <Link href="/dashboard">
              <Button size="lg" className="gap-2 shadow-md">
                <span>Go to Your Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/register">
                <Button size="lg" className="gap-2 shadow-md">
                  <span>Get Started Free</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg">
                  Sign In
                </Button>
              </Link>
            </>
          )}
          <Link href="/assessments">
            <Button
              variant="ghost"
              size="lg"
              className="text-muted-foreground hover:text-foreground"
            >
              Explore Diagnostics
            </Button>
          </Link>
        </div>
      </section>

      {/* 2. How It Works (5 Steps) */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            The 5-Step Learner Journey
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
            From diagnostic self-discovery to progressive curriculum mastery.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            {
              step: "01",
              title: "Cognitive Assessment",
              desc: "Complete a 12-question diagnostic assessing processing style, learning pace, and structure preference.",
              icon: Brain,
            },
            {
              step: "02",
              title: "Learner Profile",
              desc: "Define your technical goals, existing skills, and weekly commitment hours.",
              icon: UserCheck,
            },
            {
              step: "03",
              title: "Curriculum Scoring",
              desc: "Deterministic multi-factor algorithm filters and scores modules by goals and prerequisite readiness.",
              icon: Target,
            },
            {
              step: "04",
              title: "AI Personalization",
              desc: "Gemini synthesizes a personalized pacing strategy and study approach with DAG integrity guarantees.",
              icon: Sparkles,
            },
            {
              step: "05",
              title: "Progress & Mastery",
              desc: "Execute modules, track monotonic percentages, audit transitions, and earn verified path completion.",
              icon: Rocket,
            },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <Card
                key={s.step}
                className="hover:border-primary/40 hover:shadow-md transition-all relative flex flex-col justify-between"
              >
                <CardContent className="p-5 space-y-3">
                  <div className="text-[11px] font-bold text-primary tracking-wider">
                    STEP {s.step}
                  </div>
                  <div className="p-2.5 rounded-lg bg-primary/10 text-primary w-fit">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground">
                    {s.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {s.desc}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 3. Core Architectural Guarantees */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Engineered for Educational Precision
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
            Built on strict computer science guarantees, deterministic rules,
            and AI guardrails.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:border-primary/30 transition-all">
            <CardContent className="p-6 space-y-3">
              <div className="p-3 rounded-xl bg-indigo-50 text-indigo-700 w-fit">
                <GitFork className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                Deterministic Prerequisite DAG
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Curriculum dependencies form a Directed Acyclic Graph (DAG) with
                Kahn cycle detection. Prerequisite modules are strictly
                scheduled before dependent topics, eliminating learning
                blockers.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/30 transition-all">
            <CardContent className="p-6 space-y-3">
              <div className="p-3 rounded-xl bg-purple-50 text-purple-700 w-fit">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                Zero-Hallucination AI Architecture
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Gemini personalizes narrative and study strategy, but cannot
                invent courses or modify prerequisite rules. All module
                references and duration totals are authoritative in MongoDB.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/30 transition-all">
            <CardContent className="p-6 space-y-3">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 w-fit">
                <Activity className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                Server Source of Truth Progress
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Monotonic progress enforcement prevents accidental regression.
                Every transition is recorded in an immutable audit trail with
                versioned path isolation.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 4. Educational Framing Notice */}
      <section className="rounded-2xl border border-border bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 shrink-0 mt-0.5">
            <Info className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-foreground">
              Educational Scope & Non-Clinical Framing
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              PsychePath diagnostic assessments are designed purely to model
              learning pace, information processing preferences, and technical
              curriculum alignment. They do not constitute medical,
              psychological, or clinical evaluations.
            </p>
          </div>
        </div>
      </section>

      {/* 5. CTA Banner */}
      <section className="rounded-2xl border border-border bg-gradient-to-r from-primary/10 via-primary/5 to-white p-8 sm:p-12 text-center space-y-4 shadow-sm">
        <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          Ready to Personalize Your Engineering Learning?
        </h3>
        <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Take the 5-minute diagnostic assessment to map your learning profile
          and generate your customized curriculum path.
        </p>
        <div className="pt-2">
          <Link href={user ? "/dashboard" : "/register"}>
            <Button size="lg" className="gap-2 shadow-sm">
              <span>
                {user ? "View Your Dashboard" : "Create Free Account"}
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
