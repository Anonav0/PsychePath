"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import AdminLayout from "../../../components/admin/AdminLayout";
import adminService from "../../../services/adminService";
import StatusBadge from "../../../components/ui/StatusBadge";
import ConfirmModal from "../../../components/admin/ConfirmModal";
import EmptyState from "../../../components/ui/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { TableSkeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/components/ui/use-toast";
import { Search, Users, ArrowLeft, ArrowRight, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LearnersDirectoryPage() {
  const [learners, setLearners] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Status toggle confirmation modal state
  const [modalState, setModalState] = useState({
    isOpen: false,
    learner: null,
    targetStatus: false,
    loading: false,
  });

  const fetchLearners = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminService.getLearners({
        search,
        status: statusFilter,
        page: pagination.page,
        limit: pagination.limit,
      });
      if (res?.success) {
        setLearners(res.data.learners || []);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      setError(err.message || "Failed to load learners");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, pagination.page, pagination.limit]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLearners();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchLearners]);

  const handleToggleClick = (learner) => {
    setModalState({
      isOpen: true,
      learner,
      targetStatus: !learner.isActive,
      loading: false,
    });
  };

  const confirmToggleStatus = async () => {
    if (!modalState.learner) return;
    try {
      setModalState((prev) => ({ ...prev, loading: true }));
      await adminService.toggleLearnerStatus(
        modalState.learner._id,
        modalState.targetStatus,
      );
      const actionText = modalState.targetStatus ? "activated" : "deactivated";
      toast.success(
        "Learner Status Updated",
        `${modalState.learner.firstName} ${modalState.learner.lastName} has been ${actionText}.`,
      );
      setModalState({
        isOpen: false,
        learner: null,
        targetStatus: false,
        loading: false,
      });
      fetchLearners();
    } catch (err) {
      const errMsg = err.message || "Failed to update learner status";
      toast.error("Status Update Failed", errMsg);
      setModalState((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <AdminLayout
      title="Learner Directory"
      subtitle="Inspect student profiles, review assessment activity, and manage access status."
    >
      <div className="space-y-6">
        {/* Search & Filter Controls */}
        <Card className="p-4 bg-white border border-border shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className="pl-9"
              />
            </div>

            {/* Status Filter Buttons */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              {["ALL", "ACTIVE", "INACTIVE"].map((st) => (
                <Button
                  key={st}
                  type="button"
                  size="sm"
                  variant={statusFilter === st ? "default" : "outline"}
                  onClick={() => {
                    setStatusFilter(st);
                    setPagination((p) => ({ ...p, page: 1 }));
                  }}
                  className="text-xs h-8 flex-1 sm:flex-initial"
                >
                  {st}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : learners.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No Learners Found"
            description={
              search
                ? `No student matches "${search}".`
                : "No registered learners found."
            }
          />
        ) : (
          <Card className="overflow-hidden bg-white border border-border shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Learner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assessments</TableHead>
                  <TableHead>Learning Path</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {learners.map((learner) => (
                  <TableRow key={learner._id}>
                    {/* Learner Name & Email */}
                    <TableCell>
                      <div className="font-semibold text-foreground text-sm">
                        {learner.firstName} {learner.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {learner.email}
                      </div>
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell>
                      <StatusBadge
                        status={learner.isActive ? "ACTIVE" : "INACTIVE"}
                        size="small"
                      />
                    </TableCell>

                    {/* Assessment Activity */}
                    <TableCell>
                      <div className="font-medium text-xs text-foreground">
                        {learner.completedAttempts} completed
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {learner.totalAttempts} total
                      </div>
                    </TableCell>

                    {/* Active Learning Path */}
                    <TableCell>
                      {learner.hasActiveLearningPath ? (
                        <Badge variant="success" className="text-[10px]">
                          ✓ Active Path
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          None
                        </span>
                      )}
                    </TableCell>

                    {/* Registered Date */}
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(learner.createdAt).toLocaleDateString()}
                    </TableCell>

                    {/* Last Login */}
                    <TableCell className="text-xs text-muted-foreground">
                      {learner.lastLoginAt
                        ? new Date(learner.lastLoginAt).toLocaleDateString()
                        : "Never"}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/learners/${learner._id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs px-2.5 gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            <span>Inspect</span>
                          </Button>
                        </Link>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleClick(learner)}
                          className={cn(
                            "h-7 text-xs px-2.5",
                            learner.isActive
                              ? "text-red-600 hover:bg-red-50"
                              : "text-emerald-600 hover:bg-emerald-50",
                          )}
                        >
                          {learner.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between p-4 border-t border-border text-xs text-muted-foreground bg-slate-50/50">
              <span>
                Showing {learners.length} of {pagination.total} learners (Page{" "}
                {pagination.page} of {pagination.totalPages})
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page - 1 }))
                  }
                  className="h-7 text-xs gap-1"
                >
                  <ArrowLeft className="h-3 w-3" />
                  <span>Previous</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page + 1 }))
                  }
                  className="h-7 text-xs gap-1"
                >
                  <span>Next</span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Toggle Status Confirmation Modal */}
        <ConfirmModal
          isOpen={modalState.isOpen}
          title={
            modalState.targetStatus
              ? "Activate Learner Account"
              : "Deactivate Learner Account"
          }
          message={
            modalState.targetStatus
              ? `Are you sure you want to activate ${modalState.learner?.firstName} ${modalState.learner?.lastName}? They will be able to log in and access learning materials.`
              : `Are you sure you want to deactivate ${modalState.learner?.firstName} ${modalState.learner?.lastName}? They will be prevented from accessing the platform until reactivated.`
          }
          confirmLabel={
            modalState.targetStatus ? "Activate Account" : "Deactivate Account"
          }
          confirmVariant={modalState.targetStatus ? "primary" : "danger"}
          loading={modalState.loading}
          onConfirm={confirmToggleStatus}
          onCancel={() =>
            setModalState({
              isOpen: false,
              learner: null,
              targetStatus: false,
              loading: false,
            })
          }
        />
      </div>
    </AdminLayout>
  );
}
