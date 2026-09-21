"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AdminLayout from "../../components/admin/AdminLayout";
import adminService from "../../services/adminService";
import StatusBadge from "../../components/ui/StatusBadge";
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
import {
  Users,
  CheckCircle2,
  ClipboardList,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Activity,
} from "lucide-react";

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
        <div className="space-y-6">
          <CardSkeleton count={4} />
          <CardSkeleton count={2} />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : stats ? (
        <div className="space-y-8">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Learners */}
            <Card className="p-5 bg-white border border-border shadow-sm space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Total Learners
                </span>
                <Users className="h-4 w-4" />
              </div>
              <div className="text-3xl font-black text-foreground">
                {stats.totalLearners}
              </div>
              <div className="text-xs text-emerald-600 font-medium">
                {stats.activeLearners} active accounts
              </div>
            </Card>

            {/* Active Learners */}
            <Card className="p-5 bg-white border border-border shadow-sm space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Active Learners
                </span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="text-3xl font-black text-emerald-600">
                {stats.activeLearners}
              </div>
              <div className="text-xs text-muted-foreground">
                Eligible for recommendations
              </div>
            </Card>

            {/* Total Assessments */}
            <Card className="p-5 bg-white border border-border shadow-sm space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Assessments
                </span>
                <ClipboardList className="h-4 w-4 text-indigo-600" />
              </div>
              <div className="text-3xl font-black text-indigo-600">
                {stats.totalAssessments}
              </div>
              <div className="text-xs text-muted-foreground">
                Diagnostic evaluations
              </div>
            </Card>

            {/* Total Modules */}
            <Card className="p-5 bg-white border border-border shadow-sm space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Curriculum
                </span>
                <BookOpen className="h-4 w-4 text-indigo-600" />
              </div>
              <div className="text-3xl font-black text-foreground">
                {stats.totalCurriculumModules}
              </div>
              <div className="text-xs text-muted-foreground">
                Catalog graph nodes
              </div>
            </Card>
          </div>

          {/* Quick Management Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Link href="/admin/learners" className="group">
              <Card className="p-5 h-full bg-white border border-border group-hover:border-indigo-300 group-hover:shadow-md transition-all shadow-sm space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600">
                    <Users className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">
                    Learner Management
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Search, filter, and inspect learner profiles, assessment
                  attempts, and active learning paths.
                </p>
                <div className="text-xs font-semibold text-primary flex items-center gap-1 group-hover:underline pt-1">
                  <span>Manage Learners</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              </Card>
            </Link>

            <Link href="/admin/assessments" className="group">
              <Card className="p-5 h-full bg-white border border-border group-hover:border-indigo-300 group-hover:shadow-md transition-all shadow-sm space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">
                    Assessment Management
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Create and edit diagnostic evaluations, configure dimension
                  mappings, and manage question sets.
                </p>
                <div className="text-xs font-semibold text-primary flex items-center gap-1 group-hover:underline pt-1">
                  <span>Manage Assessments</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              </Card>
            </Link>

            <Link href="/admin/curriculum" className="group">
              <Card className="p-5 h-full bg-white border border-border group-hover:border-indigo-300 group-hover:shadow-md transition-all shadow-sm space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">
                    Curriculum Management
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Author curriculum modules, define prerequisite dependency
                  graphs, and manage resource links.
                </p>
                <div className="text-xs font-semibold text-primary flex items-center gap-1 group-hover:underline pt-1">
                  <span>Manage Curriculum</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              </Card>
            </Link>
          </div>

          {/* Tables: Recent Learners & Recent Attempts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Learners */}
            <Card className="p-6 bg-white border border-border shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-foreground">
                  Recent Learners
                </h3>
                <Link href="/admin/learners">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-primary hover:text-primary h-7 px-2"
                  >
                    View All
                  </Button>
                </Link>
              </div>

              {stats.recentLearners?.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No learners registered yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {stats.recentLearners?.map((learner) => (
                    <div
                      key={learner._id}
                      className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-foreground">
                          {learner.firstName} {learner.lastName}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {learner.email}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge
                          status={learner.isActive ? "ACTIVE" : "INACTIVE"}
                          size="small"
                        />
                        <Link href={`/admin/learners/${learner._id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs px-2.5"
                          >
                            Inspect
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Recent Assessment Attempts */}
            <Card className="p-6 bg-white border border-border shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-foreground">
                  Recent Assessment Activity
                </h3>
                <span className="text-[11px] text-muted-foreground">
                  Authoritative Log
                </span>
              </div>

              {stats.recentAttempts?.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No assessment attempts recorded yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {stats.recentAttempts?.map((att) => (
                    <div
                      key={att._id}
                      className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-foreground">
                          {att.assessment?.title || "Psychometric Assessment"}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {att.user
                            ? `${att.user.firstName} ${att.user.lastName} (${att.user.email})`
                            : "Student"}
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <StatusBadge status={att.status} size="small" />
                        <div className="text-[10px] text-muted-foreground">
                          {att.submittedAt
                            ? new Date(att.submittedAt).toLocaleDateString()
                            : new Date(att.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}
