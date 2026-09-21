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
import ConfirmModal from "../../components/admin/ConfirmModal";
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
import { CardSkeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/components/ui/use-toast";
import {
  Route,
  RefreshCw,
  Play,
  Check,
  FastForward,
  Clock,
  Sparkles,
  History,
  BookOpen,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

      if (pathRes.status === "fulfilled" && pathRes.value?.success) {
        setActivePath(pathRes.value.data);
      } else {
        setActivePath(null);
      }

      if (progressRes.status === "fulfilled" && progressRes.value?.success) {
        setProgressData(progressRes.value.data);
      }

      if (histRes.status === "fulfilled" && histRes.value?.success) {
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
        const msg = `Successfully regenerated to Version ${res.data.version}! Previous version archived.`;
        setActionMessage(msg);
        toast.success("Path Regenerated", msg);
        await fetchPathAndProgress();
      }
    } catch (err) {
      const errMsg = err.message || "Failed to regenerate learning path";
      setError(errMsg);
      toast.error("Regeneration Failed", errMsg);
    } finally {
      setRegenerating(false);
    }
  };

  const handleStartModule = async (moduleId) => {
    const pathId = activePath?.id || activePath?._id;
    if (!pathId) return;
    try {
      await progressService.startModule(pathId, moduleId);
      toast.info("Module Started", "Status set to In Progress");
      await fetchPathAndProgress();
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
      toast.success("Progress Advanced", `Progress updated to ${nextPct}%`);
      await fetchPathAndProgress();
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
      toast.success("Module Completed", "Module status marked as completed!");
      await fetchPathAndProgress();
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
      await fetchPathAndProgress();
    } catch (err) {
      const errMsg = err.message || "Failed to skip module";
      setError(errMsg);
      toast.error("Action Failed", errMsg);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div className="rounded-xl border border-border p-6 bg-white shadow-sm space-y-4">
          <CardSkeleton count={1} />
        </div>
        <CardSkeleton count={3} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Personalized Learning Path
            </h1>
            {activePath && (
              <Badge
                variant="secondary"
                className="font-bold text-xs bg-primary/10 text-primary border-primary/20"
              >
                v{activePath.version}
              </Badge>
            )}
            {activePath && <StatusBadge status={activePath.status} />}
          </div>
          <p className="text-sm text-muted-foreground">
            Curriculum sequence optimized for your skills, goals, and cognitive
            strengths.
          </p>
        </div>

        {activePath && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRegenModal(true)}
            disabled={regenerating}
            className="gap-2 shrink-0 text-xs"
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", regenerating && "animate-spin")}
            />
            <span>{regenerating ? "Regenerating..." : "Regenerate Path"}</span>
          </Button>
        )}
      </div>

      {actionMessage && (
        <Alert variant="success">
          <AlertDescription>{actionMessage}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!activePath ? (
        <EmptyState
          icon={Route}
          title="No Active Learning Path Found"
          description="Your personalized curriculum isn't generated yet. Complete an assessment or view recommendations to build your official path."
          actionText="Generate Learning Path"
          actionHref="/recommendations"
        />
      ) : (
        <>
          {/* 2. Overall Progress Card */}
          {progressData?.pathSummary && (
            <Card className="p-6 space-y-4 bg-white border border-border shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-foreground text-sm">
                  <span>
                    Overall Path Progress:{" "}
                    {progressData.pathSummary.overallProgress}%
                  </span>
                  {progressData.pathSummary.isComplete && (
                    <Badge variant="success" className="text-[10px]">
                      ALL MODULES COMPLETE
                    </Badge>
                  )}
                </div>
                <div className="text-muted-foreground">
                  {progressData.pathSummary.completedModules} Completed &bull;{" "}
                  {progressData.pathSummary.inProgressModules} Active &bull;{" "}
                  {progressData.pathSummary.skippedModules} Skipped (of{" "}
                  {progressData.pathSummary.totalModules} modules &bull;{" "}
                  {activePath.estimatedDuration} hrs)
                </div>
              </div>
              <ProgressBar
                value={progressData.pathSummary.overallProgress}
                height="10px"
              />
            </Card>
          )}

          {/* 3. AI Narrative & Strategy */}
          {activePath.summary && (
            <Card className="border-indigo-100 bg-indigo-50/50 p-6 space-y-3 shadow-sm">
              <div className="flex items-center gap-2 text-indigo-700">
                <Sparkles className="h-5 w-5" />
                <h3 className="text-base font-bold text-slate-900">
                  {activePath.generatedBy === "HYBRID"
                    ? "AI-Synthesized Narrative & Study Strategy"
                    : "Curriculum Strategy"}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {activePath.summary}
              </p>

              {activePath.focusAreas && activePath.focusAreas.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap pt-2">
                  <span className="text-xs font-semibold text-slate-900">
                    Focus Areas:
                  </span>
                  {activePath.focusAreas.map((fa, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="text-[11px] bg-indigo-100 text-indigo-700 border-indigo-200"
                    >
                      {fa}
                    </Badge>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* 4. Ordered Module Sequence Timeline */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground">
              Module Execution Timeline ({activePath.modules?.length || 0}{" "}
              Modules)
            </h2>

            <div className="space-y-4">
              {(progressData?.modules || activePath.modules || []).map(
                (item, idx) => {
                  const mod = item.module || item;
                  const modId = item.moduleId || mod._id || mod.id;
                  const status = item.status || "NOT_STARTED";
                  const percentage = item.percentage || 0;

                  return (
                    <Card
                      key={modId || idx}
                      className="p-6 shadow-sm border border-border bg-white hover:border-indigo-200 transition-all space-y-4"
                    >
                      {/* Top Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant="default"
                            className="text-[10px] font-bold"
                          >
                            STEP #{item.order || idx + 1}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px]">
                            {mod.category}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            {mod.difficulty}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{mod.estimatedDuration} hrs</span>
                          </span>
                          <StatusBadge status={status} size="small" />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="space-y-2">
                        <h3 className="text-base font-bold text-foreground">
                          {mod.title}
                        </h3>
                        {mod.description && (
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {mod.description}
                          </p>
                        )}
                        {item.reason && (
                          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
                            💡{" "}
                            <strong className="text-slate-900">
                              Placement Rationale:
                            </strong>{" "}
                            {item.reason}
                          </div>
                        )}
                      </div>

                      {/* Progress Controls */}
                      <div className="pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1 max-w-sm">
                          <ProgressBar
                            value={percentage}
                            showLabel
                            height="6px"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          {(status === "NOT_STARTED" ||
                            status === "SKIPPED") && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleStartModule(modId)}
                              className="text-xs gap-1 h-8"
                            >
                              <Play className="h-3 w-3" />
                              <span>Start Module</span>
                            </Button>
                          )}

                          {status === "IN_PROGRESS" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleUpdatePercentage(modId, percentage)
                                }
                                disabled={percentage >= 100}
                                className="text-xs h-8"
                              >
                                +25% Progress
                              </Button>
                              <Button
                                size="sm"
                                variant="success"
                                onClick={() => handleCompleteModule(modId)}
                                className="text-xs h-8 gap-1"
                              >
                                <Check className="h-3 w-3" />
                                <span>Complete</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleSkipModule(modId)}
                                className="text-xs text-muted-foreground h-8"
                              >
                                Skip
                              </Button>
                            </>
                          )}

                          {status === "COMPLETED" && (
                            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4" />
                              <span>Completed</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                },
              )}
            </div>
          </div>

          {/* 5. Version History Section */}
          {historyPaths.length > 0 && (
            <div className="pt-6 space-y-4">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-bold text-foreground">
                  Learning Path Version History
                </h2>
              </div>

              <Card className="divide-y divide-border border border-border bg-white overflow-hidden shadow-sm">
                {historyPaths.map((p, idx) => (
                  <div
                    key={p.id || p._id || idx}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-50/70 transition-colors"
                  >
                    <div>
                      <span className="font-bold text-foreground text-sm">
                        Version {p.version}
                      </span>
                      <span className="text-muted-foreground ml-3">
                        {p.modules?.length || 0} modules &bull;{" "}
                        {p.estimatedDuration} hrs &bull; {p.generatedBy}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <StatusBadge status={p.status} size="small" />
                      <span className="text-muted-foreground">
                        {new Date(
                          p.createdAt || p.generatedAt,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          )}
        </>
      )}

      {/* Confirmation Modal for Regeneration */}
      <ConfirmModal
        isOpen={showRegenModal}
        title="Regenerate Learning Path?"
        message={`Regenerating will create Version ${activePath ? activePath.version + 1 : 2} using your latest profile signals. Your current active path (v${activePath?.version}) will be safely ARCHIVED and remain accessible in version history.`}
        confirmLabel="Regenerate Path"
        confirmVariant="primary"
        onConfirm={handleRegeneratePath}
        onCancel={() => setShowRegenModal(false)}
        loading={regenerating}
      />
    </div>
  );
}
