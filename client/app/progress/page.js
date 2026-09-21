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
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { CardSkeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/components/ui/use-toast";
import {
  TrendingUp,
  CheckCircle2,
  Play,
  Check,
  FastForward,
  Clock,
  Activity,
  History,
  Target,
} from "lucide-react";

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
      if (pathRes.status === "fulfilled" && pathRes.value?.success) {
        pathObj = pathRes.value.data;
        setActivePath(pathObj);
      } else {
        setActivePath(null);
      }

      if (progressRes.status === "fulfilled" && progressRes.value?.success) {
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
      const msg = "Module started successfully!";
      setActionSuccess(msg);
      toast.info("Module Started", msg);
      await fetchProgressData();
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
      const msg = `Progress updated to ${nextPct}%!`;
      setActionSuccess(msg);
      toast.success("Progress Updated", msg);
      await fetchProgressData();
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
      const msg = "Module marked as completed!";
      setActionSuccess(msg);
      toast.success("Module Complete", msg);
      await fetchProgressData();
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
      const msg = "Module marked skipped.";
      setActionSuccess(msg);
      toast.warning("Module Skipped", msg);
      await fetchProgressData();
    } catch (err) {
      const errMsg = err.message || "Failed to skip module";
      setError(errMsg);
      toast.error("Action Failed", errMsg);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div className="rounded-2xl border p-8 bg-card/40 space-y-4">
          <CardSkeleton count={1} />
        </div>
        <CardSkeleton count={4} />
      </div>
    );
  }

  const summary = progressData?.pathSummary;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* 1. Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Learning Progress & Analytics
          </h1>
          {activePath && (
            <Badge
              variant="secondary"
              className="font-bold text-xs bg-primary/10 text-primary border-primary/20"
            >
              v{activePath.version}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Verifiable, monotonic execution records tracked against your active
          personalized curriculum.
        </p>
      </div>

      {actionSuccess && (
        <Alert variant="success">
          <AlertDescription>{actionSuccess}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!activePath ? (
        <EmptyState
          icon={TrendingUp}
          title="No Active Progress Records"
          description="You don't have an active learning path yet. Generate your official path to begin tracking module completion."
          actionText="Generate Learning Path"
          actionHref="/recommendations"
        />
      ) : (
        <>
          {/* 2. Metrics Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="p-4 shadow-sm">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Overall Progress
              </span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-500 mt-1">
                {summary?.overallProgress ?? 0}%
              </div>
              <span className="text-xs text-muted-foreground">
                Actionable modules
              </span>
            </Card>

            <Card className="p-4 shadow-sm">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Completed
              </span>
              <div className="text-2xl sm:text-3xl font-black text-foreground mt-1">
                {summary?.completedModules ?? 0}
              </div>
              <span className="text-xs text-muted-foreground">
                of {summary?.totalModules ?? 0} total
              </span>
            </Card>

            <Card className="p-4 shadow-sm">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                In Progress
              </span>
              <div className="text-2xl sm:text-3xl font-black text-primary mt-1">
                {summary?.inProgressModules ?? 0}
              </div>
              <span className="text-xs text-muted-foreground">
                active topics
              </span>
            </Card>

            <Card className="p-4 shadow-sm">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Skipped
              </span>
              <div className="text-2xl sm:text-3xl font-black text-amber-500 mt-1">
                {summary?.skippedModules ?? 0}
              </div>
              <span className="text-xs text-muted-foreground">
                excluded from total
              </span>
            </Card>
          </div>

          {/* 3. Overall Path Progress Bar */}
          <Card className="p-5 shadow-sm space-y-3">
            <div className="flex justify-between items-center text-sm font-semibold">
              <span className="text-foreground">Path Execution Mastery</span>
              <span className="text-emerald-500 font-bold">
                {summary?.overallProgress ?? 0}%
              </span>
            </div>
            <ProgressBar
              value={summary?.overallProgress ?? 0}
              height="10px"
              variant="gradient"
            />
          </Card>

          {/* 4. Module Execution Tracker */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground">
              Module Execution Tracker
            </h2>

            <div className="space-y-3">
              {(progressData?.modules || []).map((item, idx) => {
                const status = item.status || "NOT_STARTED";
                const percentage = item.percentage || 0;

                return (
                  <Card
                    key={item.moduleId || idx}
                    className="p-4 shadow-sm hover:border-primary/40 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="default"
                          className="text-[10px] font-bold"
                        >
                          Step #{item.order || idx + 1}
                        </Badge>
                        <h3 className="text-sm sm:text-base font-bold text-foreground">
                          {item.title}
                        </h3>
                      </div>
                      <StatusBadge status={status} size="small" />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                      <div className="flex-1 max-w-md">
                        <ProgressBar
                          value={percentage}
                          showLabel
                          height="6px"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        {(status === "NOT_STARTED" || status === "SKIPPED") && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleStartModule(item.moduleId)}
                            className="text-xs gap-1 h-7"
                          >
                            <Play className="h-3 w-3" />
                            <span>Start</span>
                          </Button>
                        )}

                        {status === "IN_PROGRESS" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleUpdatePercentage(
                                  item.moduleId,
                                  percentage,
                                )
                              }
                              disabled={percentage >= 100}
                              className="text-xs h-7"
                            >
                              +25%
                            </Button>
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() =>
                                handleCompleteModule(item.moduleId)
                              }
                              className="text-xs h-7 gap-1"
                            >
                              <Check className="h-3 w-3" />
                              <span>Complete</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSkipModule(item.moduleId)}
                              className="text-xs text-muted-foreground h-7"
                            >
                              Skip
                            </Button>
                          </>
                        )}

                        {status === "COMPLETED" && (
                          <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Done</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {(item.startedAt ||
                      item.completedAt ||
                      item.lastAccessedAt) && (
                      <div className="text-[11px] text-muted-foreground flex gap-4 flex-wrap pt-1 border-t">
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
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>

          {/* 5. Immutable Progress History Audit Trail */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-bold text-foreground">
                Immutable Progress Audit Trail
              </h2>
            </div>

            {history.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No progress transitions logged yet. Start or update a module to
                record activity.
              </p>
            ) : (
              <Card className="overflow-hidden shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Module</TableHead>
                      <TableHead>Transition</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((record, idx) => (
                      <TableRow key={record.id || idx}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(record.timestamp).toLocaleString(
                            undefined,
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className="text-[10px] font-bold uppercase tracking-wider"
                          >
                            {record.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-xs text-foreground">
                          {record.moduleTitle || "Curriculum Module"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {record.previousPercentage}% ({record.previousStatus})
                          &rarr;{" "}
                          <strong className="text-foreground">
                            {record.newPercentage}% ({record.newStatus})
                          </strong>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
