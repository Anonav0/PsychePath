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
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton, CardSkeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Brain,
  Route,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Target,
  CheckCircle2,
  Clock,
  BookOpen,
  Compass,
} from "lucide-react";

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

        if (profileRes.status === "fulfilled" && profileRes.value?.success) {
          setProfile(profileRes.value.data);
        }

        if (pathRes.status === "fulfilled" && pathRes.value?.success) {
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

        if (progressRes.status === "fulfilled" && progressRes.value?.success) {
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
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="rounded-xl border border-border p-6 bg-white space-y-3 shadow-sm">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <CardSkeleton count={2} />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  // Determine current/next actionable module
  const nextModule = progressData?.modules?.find(
    (m) => m.status === "IN_PROGRESS" || m.status === "NOT_STARTED",
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* 1. Welcome Header */}
      <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Welcome back, {user?.firstName}!
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Track your cognitive metrics, follow your personalized curriculum,
              and build technical mastery.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link href="/learning-path">
              <Button
                variant="default"
                size="default"
                className="gap-2 shadow-sm"
              >
                <span>Open Learning Path</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 2. Top Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card A: Active Learning Path & Progress */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Active Path
                </span>
                <CardTitle className="text-xl mt-1 text-foreground font-bold">
                  {activePath
                    ? activePath.title || `Learning Path v${activePath.version}`
                    : "No Path Generated"}
                </CardTitle>
              </div>
              {activePath && <StatusBadge status="ACTIVE" size="small" />}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {activePath ? (
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-muted-foreground">
                    Overall Progress
                  </span>
                  <span className="text-foreground font-bold">
                    {progressData?.pathSummary?.overallProgress ?? 0}%
                  </span>
                </div>
                <ProgressBar
                  value={progressData?.pathSummary?.overallProgress ?? 0}
                  variant="primary"
                  height="8px"
                />
                <div className="flex justify-between text-xs text-muted-foreground pt-1">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>
                      {progressData?.pathSummary?.completedModules ?? 0} of{" "}
                      {progressData?.pathSummary?.totalModules ?? 0} modules
                    </span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span>{activePath.estimatedDuration} hrs total</span>
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3 py-1">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Take your assessment or view recommendations to build your
                  official personalized learning path.
                </p>
                <Link href="/recommendations">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                  >
                    <span>Generate Path</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card B: Learner Profile Completeness */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Learner Profile
                </span>
                <CardTitle className="text-xl mt-1 text-foreground font-bold">
                  {profile
                    ? `${profile.completeness}% Complete`
                    : "Profile Incomplete"}
                </CardTitle>
              </div>
              <Badge
                variant={profile?.completeness === 100 ? "success" : "warning"}
                className="text-[11px]"
              >
                {profile?.completeness === 100 ? "Verified" : "Setup Needed"}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <ProgressBar
              value={profile?.completeness ?? 20}
              variant={profile?.completeness === 100 ? "success" : "warning"}
              height="8px"
            />
            <div className="flex justify-between items-center text-xs pt-1">
              <span className="text-muted-foreground font-medium">
                {profile?.currentSkills?.length ?? 0} skills &bull;{" "}
                {profile?.learningGoals?.length ?? 0} goals
              </span>
              <Link href="/profile">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-primary hover:text-primary gap-1 px-2 font-semibold"
                >
                  <span>Edit Profile</span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Next Recommended Module / Action Card */}
      {nextModule && (
        <Card className="border-indigo-200 bg-indigo-50/40 shadow-sm">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <StatusBadge status={nextModule.status} size="small" />
                  <span className="text-xs text-muted-foreground font-medium">
                    Step #{nextModule.order} &bull; {nextModule.category} &bull;{" "}
                    {nextModule.estimatedDuration} hrs
                  </span>
                </div>
                <h3 className="text-lg font-bold text-foreground tracking-tight">
                  {nextModule.title}
                </h3>
                {nextModule.reason && (
                  <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                    💡 {nextModule.reason}
                  </p>
                )}
              </div>

              <Link href="/learning-path" className="shrink-0">
                <Button
                  variant="default"
                  size="default"
                  className="gap-2 shadow-sm"
                >
                  <span>
                    {nextModule.status === "IN_PROGRESS"
                      ? "Continue Learning"
                      : "Start Module"}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 4. Quick Actions Grid */}
      <div className="space-y-3">
        <h2 className="text-base font-bold tracking-tight text-foreground">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link href="/assessments">
            <div className="h-full rounded-xl border border-border bg-white p-4 sm:p-5 hover:border-primary/50 hover:shadow-md transition-all group cursor-pointer space-y-2">
              <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-700 w-fit group-hover:scale-105 transition-transform">
                <Brain className="h-5 w-5" />
              </div>
              <div className="font-semibold text-sm text-foreground">
                Take Assessment
              </div>
              <div className="text-xs text-muted-foreground">
                Diagnostic evaluation
              </div>
            </div>
          </Link>

          <Link href="/recommendations">
            <div className="h-full rounded-xl border border-border bg-white p-4 sm:p-5 hover:border-primary/50 hover:shadow-md transition-all group cursor-pointer space-y-2">
              <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-700 w-fit group-hover:scale-105 transition-transform">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="font-semibold text-sm text-foreground">
                Recommendations
              </div>
              <div className="text-xs text-muted-foreground">
                Multi-factor scoring
              </div>
            </div>
          </Link>

          <Link href="/learning-path">
            <div className="h-full rounded-xl border border-border bg-white p-4 sm:p-5 hover:border-primary/50 hover:shadow-md transition-all group cursor-pointer space-y-2">
              <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-700 w-fit group-hover:scale-105 transition-transform">
                <Route className="h-5 w-5" />
              </div>
              <div className="font-semibold text-sm text-foreground">
                Learning Path
              </div>
              <div className="text-xs text-muted-foreground">
                Curriculum timeline
              </div>
            </div>
          </Link>

          <Link href="/progress">
            <div className="h-full rounded-xl border border-border bg-white p-4 sm:p-5 hover:border-primary/50 hover:shadow-md transition-all group cursor-pointer space-y-2">
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700 w-fit group-hover:scale-105 transition-transform">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div className="font-semibold text-sm text-foreground">
                Progress Hub
              </div>
              <div className="text-xs text-muted-foreground">
                Audit activity logs
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* 5. Recent Activity Snapshot */}
      {history.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-bold tracking-tight text-foreground">
            Recent Learning Activity
          </h2>
          <Card className="divide-y divide-border overflow-hidden shadow-sm">
            {history.map((item, idx) => (
              <div
                key={item.id || idx}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <StatusBadge status={item.newStatus} size="small" />
                  <span className="font-semibold text-foreground">
                    {item.moduleTitle || "Curriculum Module"}
                  </span>
                </div>
                <div className="text-muted-foreground">
                  {new Date(item.timestamp).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}
