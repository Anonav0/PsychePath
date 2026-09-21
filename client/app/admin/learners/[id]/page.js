"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import AdminLayout from "../../../../components/admin/AdminLayout";
import adminService from "../../../../services/adminService";
import StatusBadge from "../../../../components/ui/StatusBadge";
import ProgressBar from "../../../../components/ui/ProgressBar";
import ConfirmModal from "../../../../components/admin/ConfirmModal";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CardSkeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/components/ui/use-toast";
import {
  ArrowLeft,
  User,
  Mail,
  BookOpen,
  Award,
  CheckCircle2,
  Lock,
  Clock,
  Briefcase,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
      const actionText = !data.user.isActive ? "activated" : "deactivated";
      toast.success(
        "Account Status Updated",
        `${data.user.firstName} ${data.user.lastName} has been ${actionText}.`,
      );
      setModalOpen(false);
      fetchDetails();
    } catch (err) {
      const errMsg = err.message || "Failed to update account status";
      toast.error("Status Update Failed", errMsg);
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
        <div className="space-y-6">
          <CardSkeleton count={1} />
          <CardSkeleton count={2} />
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
        <div className="space-y-4 max-w-xl">
          <Alert variant="destructive">
            <AlertDescription>{error || "Learner not found"}</AlertDescription>
          </Alert>
          <Link href="/admin/learners">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Learners Directory</span>
            </Button>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const { user, profile, attempts, learningPath, progressSummary } = data;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Back Navigation */}
        <div>
          <Link href="/admin/learners">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground h-8 px-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Learners Directory</span>
            </Button>
          </Link>
        </div>

        {/* Header Banner */}
        <Card className="p-6 bg-white border border-border shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                  {user.firstName} {user.lastName}
                </h1>
                <StatusBadge status={user.isActive ? "ACTIVE" : "INACTIVE"} />
              </div>
              <div className="text-xs text-muted-foreground">
                {user.email} &bull; Registered{" "}
                {new Date(user.createdAt).toLocaleDateString()}
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(true)}
              className={cn(
                "text-xs h-8 shrink-0",
                user.isActive
                  ? "text-red-600 hover:bg-red-50 border-red-200"
                  : "text-emerald-600 hover:bg-emerald-50 border-emerald-200",
              )}
            >
              {user.isActive ? "Deactivate Account" : "Activate Account"}
            </Button>
          </div>
        </Card>

        {/* Profile & Academic Attributes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profile Overview */}
          <Card className="p-6 bg-white border border-border shadow-sm space-y-4">
            <h3 className="text-base font-bold text-foreground">
              Learner Profile & Preferences
            </h3>
            {profile ? (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5" />
                    <span>Education Level:</span>
                  </span>
                  <span className="font-semibold text-foreground">
                    {profile.educationLevel || "Not specified"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5" />
                    <span>Experience Level:</span>
                  </span>
                  <span className="font-semibold text-foreground">
                    {profile.experienceLevel || "BEGINNER"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Weekly Study Hours:</span>
                  </span>
                  <span className="font-semibold text-foreground">
                    {profile.weeklyLearningHours || 5} hrs/week
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-muted-foreground">
                    Preferred Format:
                  </span>
                  <span className="font-semibold text-foreground">
                    {profile.learningPreferences?.preferredFormat || "MIXED"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-muted-foreground">
                    Preferred Difficulty:
                  </span>
                  <span className="font-semibold text-foreground">
                    {profile.learningPreferences?.preferredDifficulty ||
                      "BEGINNER"}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Learner has not configured their academic profile yet.
              </p>
            )}
          </Card>

          {/* Skills & Goals */}
          <Card className="p-6 bg-white border border-border shadow-sm space-y-4">
            <h3 className="text-base font-bold text-foreground">
              Skills & Target Goals
            </h3>
            {profile ? (
              <div className="space-y-4 text-xs">
                {/* Skills */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Current Skills
                  </span>
                  {profile.currentSkills?.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {profile.currentSkills.map((sk, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="text-[11px]"
                        >
                          {sk.name} ({sk.level})
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">None listed</span>
                  )}
                </div>

                {/* Goals */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Learning Goals
                  </span>
                  {profile.learningGoals?.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {profile.learningGoals.map((g, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="text-[11px] text-emerald-500 border-emerald-500/30"
                        >
                          🎯 {g.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">None listed</span>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No skills or goals configured.
              </p>
            )}
          </Card>
        </div>

        {/* Assessment Attempts */}
        <Card className="p-6 bg-white border border-border shadow-sm space-y-4">
          <h3 className="text-base font-bold text-foreground">
            Psychometric Assessment History ({attempts.length})
          </h3>
          {attempts.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Learner has not initiated any assessments yet.
            </p>
          ) : (
            <div className="space-y-3">
              {attempts.map((att) => (
                <div
                  key={att._id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-foreground text-sm">
                        {att.assessment?.title || "Assessment"}
                      </span>
                      <span className="text-muted-foreground ml-2">
                        ({att.assessment?.type})
                      </span>
                    </div>
                    <StatusBadge status={att.status} size="small" />
                  </div>

                  <div className="text-muted-foreground text-[11px]">
                    Started: {new Date(att.createdAt).toLocaleString()}
                    {att.submittedAt &&
                      ` • Submitted: ${new Date(att.submittedAt).toLocaleString()}`}
                  </div>

                  {att.scores && Object.keys(att.scores).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {Object.entries(att.scores).map(([dim, score]) => (
                        <Badge
                          key={dim}
                          variant="secondary"
                          className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200"
                        >
                          <strong>{dim}:</strong> {score}%
                        </Badge>
                      ))}
                    </div>
                  )}

                  {att.resultSummary && (
                    <p className="text-muted-foreground italic pt-1">
                      &ldquo;{att.resultSummary}&rdquo;
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Active Learning Path & Progress */}
        <Card className="p-6 bg-white border border-border shadow-sm space-y-4">
          <h3 className="text-base font-bold text-foreground">
            Active Learning Path & Progress
          </h3>
          {learningPath ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                <div>
                  <span className="font-bold text-foreground text-sm">
                    Version {learningPath.version}
                  </span>
                  <span className="text-muted-foreground ml-2">
                    Generated by: {learningPath.generatedBy}
                  </span>
                </div>
                <span className="text-muted-foreground">
                  Duration: {learningPath.estimatedDuration} hrs
                </span>
              </div>

              {progressSummary && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-muted-foreground">
                      Overall Path Completion:
                    </span>
                    <span className="text-emerald-600 font-bold">
                      {progressSummary.overallProgress}%
                    </span>
                  </div>
                  <ProgressBar
                    value={progressSummary.overallProgress}
                    height="8px"
                  />
                  <div className="flex gap-3 text-xs text-muted-foreground pt-1">
                    <span>✓ Completed: {progressSummary.completedModules}</span>
                    <span>
                      ▶ In Progress: {progressSummary.inProgressModules}
                    </span>
                    <span>⏭ Skipped: {progressSummary.skippedModules}</span>
                  </div>
                </div>
              )}

              {/* Module List */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Curriculum Sequence ({learningPath.modules?.length} Modules)
                </span>
                <div className="space-y-1.5">
                  {learningPath.modules?.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground font-mono">
                          #{item.order}
                        </span>
                        <span className="font-medium text-foreground">
                          {item.module?.title || "Module"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
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
            <p className="text-xs text-muted-foreground">
              Learner does not currently have an active learning path generated.
            </p>
          )}
        </Card>

        {/* Non-Destructive Administrative Notice */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-center text-xs text-slate-600 flex items-center justify-center gap-2">
          <Lock className="h-4 w-4 shrink-0 text-slate-500" />
          <span>
            <strong>Read-Only Inspection:</strong> Administrative inspection
            preserves the integrity of student-owned execution records.
          </span>
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
