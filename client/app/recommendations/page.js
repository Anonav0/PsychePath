"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import recommendationService from "../../services/recommendationService";
import learningPathService from "../../services/learningPathService";
import progressService from "../../services/progressService";
import authService from "../../services/authService";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { CardSkeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import ProgressBar from "@/components/ui/ProgressBar";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Cpu,
  Clock,
  ArrowRight,
  Play,
  Check,
  FastForward,
  Lock,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  BookOpen,
  CheckCircle2,
} from "lucide-react";

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

  const [activePath, setActivePath] = useState(null);
  const [generatingPath, setGeneratingPath] = useState(false);
  const [pathMessage, setPathMessage] = useState(null);
  const [progressData, setProgressData] = useState(null);

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

  const fetchProgress = useCallback(async () => {
    if (!authService.isAuthenticated()) return;
    try {
      const res = await progressService.getCurrentPathProgress();
      if (res.success && res.data) {
        setProgressData(res.data);
      }
    } catch {
      // No active path progress
    }
  }, []);

  const fetchCurrentPath = useCallback(async () => {
    if (!authService.isAuthenticated()) return;
    try {
      const res = await learningPathService.getCurrentPath();
      if (res.success && res.data) {
        setActivePath(res.data);
        await fetchProgress();
      }
    } catch {
      // No active path yet
    }
  }, [fetchProgress]);

  useEffect(() => {
    fetchRecommendations();
    fetchCurrentPath();
    fetchProgress();
  }, [fetchRecommendations, fetchCurrentPath, fetchProgress]);

  const handleSavePath = async () => {
    try {
      setGeneratingPath(true);
      setPathMessage(null);
      const res = activePath
        ? await learningPathService.regeneratePath()
        : await learningPathService.generatePath();

      if (res.success && res.data) {
        setActivePath(res.data);
        const msg = `Official Learning Path (v${res.data.version}) saved to MongoDB! ${res.data.modules.length} modules, ${res.data.estimatedDuration} total hours.`;
        setPathMessage(msg);
        toast.success("Learning Path Generated", msg);
        await fetchProgress();
      }
    } catch (err) {
      const errMsg = err.message || "Failed to generate learning path";
      setError(errMsg);
      toast.error("Path Generation Error", errMsg);
    } finally {
      setGeneratingPath(false);
    }
  };

  const handleStartModule = async (moduleId) => {
    const pathId = activePath?.id || activePath?._id;
    if (!pathId) return;
    try {
      await progressService.startModule(pathId, moduleId);
      toast.info("Module Started", "Module status updated to In Progress");
      await fetchProgress();
    } catch (err) {
      const errMsg = err.message || "Failed to start module";
      setError(errMsg);
      toast.error("Action Failed", errMsg);
    }
  };

  const handleUpdatePercentage = async (moduleId, currentPct) => {
    const pathId = activePath?.id || activePath?._id;
    if (!pathId) return;
    const nextPct = Math.min(100, currentPct + 25);
    try {
      await progressService.updateProgress(pathId, moduleId, nextPct);
      toast.success("Progress Updated", `Progress advanced to ${nextPct}%`);
      await fetchProgress();
    } catch (err) {
      const errMsg = err.message || "Failed to update progress";
      setError(errMsg);
      toast.error("Action Failed", errMsg);
    }
  };

  const handleCompleteModule = async (moduleId) => {
    const pathId = activePath?.id || activePath?._id;
    if (!pathId) return;
    try {
      await progressService.completeModule(pathId, moduleId);
      toast.success("Module Completed", "Module marked completed (100%)");
      await fetchProgress();
    } catch (err) {
      const errMsg = err.message || "Failed to complete module";
      setError(errMsg);
      toast.error("Action Failed", errMsg);
    }
  };

  const handleSkipModule = async (moduleId) => {
    const pathId = activePath?.id || activePath?._id;
    if (!pathId) return;
    try {
      await progressService.skipModule(pathId, moduleId);
      toast.warning("Module Skipped", "Module marked skipped");
      await fetchProgress();
    } catch (err) {
      const errMsg = err.message || "Failed to skip module";
      setError(errMsg);
      toast.error("Action Failed", errMsg);
    }
  };

  const toggleScoreBreakdown = (id) => {
    setExpandedScoreId((prev) => (prev === id ? null : id));
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <EmptyState
          icon={Sparkles}
          title="Personalized Recommendations"
          description="Sign in or create an account to view curriculum modules tailored to your cognitive strengths, learning preferences, and technical goals."
          actionText="Sign In to View Recommendations"
          actionHref="/login"
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Recommended for You
              </h1>
              {data?.source && (
                <Badge
                  variant={data.source === "HYBRID" ? "default" : "secondary"}
                  className="gap-1.5 text-xs font-semibold"
                >
                  {data.source === "HYBRID" ? (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>AI-Personalized (Gemini)</span>
                    </>
                  ) : (
                    <>
                      <Cpu className="h-3.5 w-3.5" />
                      <span>Deterministic (Rule Engine)</span>
                    </>
                  )}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
              {data?.source === "HYBRID"
                ? "AI-synthesized learning sequence and study strategies powered by Gemini, grounded strictly in pre-computed deterministic recommendations."
                : "Deterministic, rule-based curriculum recommendations matching your verified skills, learning goals, cognitive assessment dimensions, and prerequisite readiness."}
            </p>
          </div>
        </div>

        {/* Learning Path Action Bar */}
        {data && data.recommendations && data.recommendations.length > 0 && (
          <Card className="p-4 sm:p-5 bg-card/60 backdrop-blur-sm border-border/80 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  {activePath ? (
                    <div className="flex items-center gap-2 flex-wrap text-sm font-semibold text-foreground">
                      <span>Active Learning Path (v{activePath.version})</span>
                      <StatusBadge status="ACTIVE" size="small" />
                      <span className="text-xs text-muted-foreground">
                        &bull; {activePath.modules?.length || 0} modules &bull;{" "}
                        {activePath.estimatedDuration} hrs
                      </span>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Turn these recommendations into an official versioned
                      Learning Path.
                    </div>
                  )}
                </div>
              </div>

              <Button
                variant="default"
                size="default"
                onClick={handleSavePath}
                loading={generatingPath}
                className="gap-2 shrink-0 shadow-md text-xs sm:text-sm"
              >
                <RefreshCw
                  className={cn("h-4 w-4", generatingPath && "animate-spin")}
                />
                <span>
                  {activePath
                    ? "Regenerate Path"
                    : "Save as Official Learning Path"}
                </span>
              </Button>
            </div>

            {pathMessage && (
              <div className="mt-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{pathMessage}</span>
              </div>
            )}

            {/* Path Progress Widget */}
            {activePath && progressData?.pathSummary && (
              <div className="mt-4 pt-4 border-t space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <span>
                      Progress: {progressData.pathSummary.overallProgress}%
                    </span>
                    {progressData.pathSummary.isComplete && (
                      <Badge variant="success" className="text-[10px]">
                        COMPLETED
                      </Badge>
                    )}
                  </div>
                  <span className="text-muted-foreground">
                    {progressData.pathSummary.completedModules} Done &bull;{" "}
                    {progressData.pathSummary.inProgressModules} Active &bull;{" "}
                    {progressData.pathSummary.skippedModules} Skipped &bull;{" "}
                    {progressData.pathSummary.notStartedModules} To-Do
                  </span>
                </div>
                <ProgressBar
                  value={progressData.pathSummary.overallProgress}
                  height="8px"
                  variant="gradient"
                />
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Filter Controls Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-muted/40 p-3 rounded-xl border border-border/60">
        <div className="w-44">
          <Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat === "ALL" ? "All Categories" : cat.replace("_", " ")}
              </option>
            ))}
          </Select>
        </div>

        <div className="w-44">
          <Select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
          >
            {DIFFICULTIES.map((diff) => (
              <option key={diff} value={diff}>
                {diff === "ALL" ? "All Difficulties" : diff}
              </option>
            ))}
          </Select>
        </div>

        {(selectedCategory !== "ALL" || selectedDifficulty !== "ALL") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedCategory("ALL");
              setSelectedDifficulty("ALL");
            }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Reset Filters
          </Button>
        )}
      </div>

      {/* Profile Not Ready Card */}
      {notReadyError && (
        <Alert variant="warning" className="p-6">
          <AlertCircle className="h-5 w-5 text-amber-500" />
          <AlertTitle className="text-base font-bold">
            Profile Setup Required
          </AlertTitle>
          <AlertDescription className="text-xs text-muted-foreground mt-1 space-y-3">
            <p>
              The recommendation engine requires complete learner signals before
              computing personalized candidates.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              {notReadyError.data?.missingFields?.map((f) => (
                <li key={f}>
                  {f === "learningGoals" &&
                    "Learning Goals (Set your career & technical targets in Profile)"}
                  {f === "currentSkills" &&
                    "Current Skills (Add your existing technical skills in Profile)"}
                  {f === "assessmentDimensions" &&
                    "Psychometric Assessment (Complete a diagnostic assessment)"}
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-2 pt-2">
              <Link href="/profile">
                <Button size="sm" variant="default" className="text-xs">
                  Update Profile
                </Button>
              </Link>
              <Link href="/assessments">
                <Button size="sm" variant="outline" className="text-xs">
                  Take Assessment
                </Button>
              </Link>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && <CardSkeleton count={3} />}

      {/* AI / Deterministic Strategy Summary */}
      {!loading && data && data.summary && (
        <Card className="border-primary/20 bg-primary/5 p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2.5 text-primary">
            {data.source === "HYBRID" ? (
              <Sparkles className="h-5 w-5" />
            ) : (
              <Cpu className="h-5 w-5" />
            )}
            <h2 className="text-base font-bold text-foreground">
              {data.source === "HYBRID"
                ? "Personalized Learning Narrative & Strategy"
                : "Deterministic Recommendation Strategy"}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {data.summary}
          </p>

          {data.focusAreas && data.focusAreas.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap pt-2">
              <span className="text-xs font-semibold text-foreground">
                Focus Areas:
              </span>
              {data.focusAreas.map((fa, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="text-[11px] bg-primary/10 text-primary border-primary/20"
                >
                  {fa}
                </Badge>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Recommendations Cards Grid */}
      {!loading && data && data.recommendations && (
        <>
          {data.recommendations.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No Recommendations Match Filters"
              description="Try adjusting your category or difficulty filter selection."
            />
          ) : (
            <div className="space-y-4">
              {data.recommendations.map((rec) => {
                const isBreakdownOpen = expandedScoreId === rec.module.id;
                const modId = rec.module.id || rec.module._id;
                const modProgress = progressData?.modules?.find(
                  (m) => m.moduleId === modId,
                );

                return (
                  <Card
                    key={rec.module.id}
                    className="p-5 hover:border-primary/40 transition-all shadow-sm"
                  >
                    <div className="flex flex-col md:flex-row md:items-start gap-4 justify-between">
                      {/* Left: Score Badge */}
                      <div className="flex md:flex-col items-center justify-center p-3 rounded-xl border bg-muted/30 shrink-0 w-fit md:w-20 text-center gap-1">
                        <span className="text-2xl font-black text-primary leading-none">
                          {rec.score}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                          Match
                        </span>
                      </div>

                      {/* Middle: Details */}
                      <div className="flex-1 space-y-2.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          {rec.aiPriority && (
                            <Badge
                              variant="default"
                              className="text-[10px] font-bold"
                            >
                              Step #{rec.aiPriority}
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-[10px]">
                            {rec.module.category}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            {rec.module.difficulty}
                          </Badge>
                          <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{rec.module.estimatedDuration} hrs</span>
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-foreground">
                          {rec.module.title}
                        </h3>

                        <div className="p-3 rounded-lg bg-muted/40 border text-xs text-muted-foreground leading-relaxed">
                          💡{" "}
                          <strong className="text-foreground">
                            Why Recommended:
                          </strong>{" "}
                          {rec.reason}
                        </div>

                        {/* Skills and Gaps */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {rec.matchedSkills?.map((s, idx) => (
                            <Badge
                              key={idx}
                              variant="success"
                              className="text-[10px]"
                            >
                              ✓ {s}
                            </Badge>
                          ))}
                          {rec.skillGaps?.map((g, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="text-[10px] bg-amber-500/10 text-amber-500 border-amber-500/20"
                            >
                              + Gap: {g}
                            </Badge>
                          ))}
                        </div>

                        {/* Score Breakdown Toggle */}
                        <button
                          type="button"
                          onClick={() => toggleScoreBreakdown(rec.module.id)}
                          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 pt-1"
                        >
                          <span>
                            {isBreakdownOpen
                              ? "Hide Score Breakdown"
                              : "View Scoring Breakdown"}
                          </span>
                          {isBreakdownOpen ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                        </button>

                        {isBreakdownOpen && rec.scoreBreakdown && (
                          <div className="p-3 rounded-lg bg-muted/30 border grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs mt-2">
                            <div>
                              Goal:{" "}
                              <strong>
                                {rec.scoreBreakdown.goalMatch}/100
                              </strong>
                            </div>
                            <div>
                              Skill:{" "}
                              <strong>
                                {rec.scoreBreakdown.skillMatch}/100
                              </strong>
                            </div>
                            <div>
                              Prereq:{" "}
                              <strong>
                                {rec.scoreBreakdown.prerequisiteReadiness}/100
                              </strong>
                            </div>
                            <div>
                              Assessment:{" "}
                              <strong>
                                {rec.scoreBreakdown.assessmentAlignment}/100
                              </strong>
                            </div>
                            <div>
                              Difficulty:{" "}
                              <strong>
                                {rec.scoreBreakdown.difficultyAlignment}/100
                              </strong>
                            </div>
                            <div>
                              Interests:{" "}
                              <strong>
                                {rec.scoreBreakdown.interestMatch}/100
                              </strong>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right: Progress Controls */}
                      {modProgress && (
                        <div className="shrink-0 p-3 rounded-xl border bg-muted/20 flex flex-col gap-2 min-w-[160px]">
                          <div className="flex items-center justify-between">
                            <StatusBadge
                              status={modProgress.status}
                              size="small"
                            />
                            <span className="text-xs font-bold">
                              {modProgress.percentage}%
                            </span>
                          </div>

                          {(modProgress.status === "NOT_STARTED" ||
                            modProgress.status === "SKIPPED") && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleStartModule(modId)}
                              className="text-xs gap-1 h-8"
                            >
                              <Play className="h-3 w-3" />
                              <span>Start</span>
                            </Button>
                          )}

                          {modProgress.status === "IN_PROGRESS" && (
                            <div className="flex flex-col gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleUpdatePercentage(
                                    modId,
                                    modProgress.percentage,
                                  )
                                }
                                disabled={modProgress.percentage >= 100}
                                className="text-xs h-7"
                              >
                                +25% Progress
                              </Button>
                              <Button
                                size="sm"
                                variant="success"
                                onClick={() => handleCompleteModule(modId)}
                                className="text-xs h-7 gap-1"
                              >
                                <Check className="h-3 w-3" />
                                <span>Complete</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleSkipModule(modId)}
                                className="text-xs text-muted-foreground h-7"
                              >
                                Skip
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Blocked Modules Section */}
          {data.blockedModules && data.blockedModules.length > 0 && (
            <div className="pt-8 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Lock className="h-4 w-4 text-destructive" />
                    <span>
                      Prerequisite-Blocked Modules ({data.blockedModules.length}
                      )
                    </span>
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    These modules match your goals, but require foundational
                    prerequisites first.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBlocked(!showBlocked)}
                  className="text-xs"
                >
                  {showBlocked ? "Hide Blocked" : "Show Blocked"}
                </Button>
              </div>

              {showBlocked && (
                <div className="space-y-3">
                  {data.blockedModules.map((blk) => (
                    <Card
                      key={blk.module.id}
                      className="p-4 border-destructive/30 bg-destructive/5 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive" className="text-[10px]">
                            {blk.module.category}
                          </Badge>
                          <h4 className="text-sm font-bold text-foreground">
                            {blk.module.title}
                          </h4>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Score: {blk.score}
                        </span>
                      </div>
                      <div className="text-xs text-destructive flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          Missing Prerequisite:{" "}
                          {blk.missingPrerequisites
                            ?.map((p) => p.title)
                            .join(", ")}
                        </span>
                      </div>
                    </Card>
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
