"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AdminLayout from "../../../components/admin/AdminLayout";
import assessmentService from "../../../services/assessmentService";
import StatusBadge from "../../../components/ui/StatusBadge";
import ConfirmModal from "../../../components/admin/ConfirmModal";
import EmptyState from "../../../components/ui/EmptyState";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { ClipboardList, Plus, Clock, Trash2, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminAssessmentsPage() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create Assessment Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "LEARNING_STYLE",
    instructions:
      "Please answer each question honestly based on your learning preferences.",
    estimatedDuration: 15,
    dimensions: "analytical, intuitive, structured, collaborative",
  });
  const [createLoading, setCreateLoading] = useState(false);

  // Delete modal
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    item: null,
    loading: false,
  });

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await assessmentService.getAssessments();
      if (res?.success) {
        setAssessments(res.data || []);
      }
    } catch (err) {
      setError(err.message || "Failed to load assessments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  const handleToggleStatus = async (item) => {
    try {
      await assessmentService.toggleStatus(item._id, !item.isActive);
      toast.success(
        "Status Updated",
        `"${item.title}" is now ${!item.isActive ? "active" : "inactive"}.`,
      );
      fetchAssessments();
    } catch (err) {
      const errMsg = err.message || "Failed to update assessment status";
      toast.error("Update Failed", errMsg);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      setCreateLoading(true);
      const dims = formData.dimensions
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean)
        .map((key) => ({
          key: key.toLowerCase(),
          name: key
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (s) => s.toUpperCase()),
          description: `${key} dimension evaluation`,
        }));

      const payload = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        instructions: formData.instructions,
        estimatedDuration: Number(formData.estimatedDuration) || 15,
        dimensions: dims,
      };

      const res = await assessmentService.createAssessment(payload);
      if (res?.success) {
        toast.success(
          "Assessment Created",
          `"${formData.title}" created successfully.`,
        );
        setCreateModalOpen(false);
        setFormData({
          title: "",
          description: "",
          type: "LEARNING_STYLE",
          instructions:
            "Please answer each question honestly based on your learning preferences.",
          estimatedDuration: 15,
          dimensions: "analytical, intuitive, structured, collaborative",
        });
        fetchAssessments();
      }
    } catch (err) {
      const errMsg = err.message || "Failed to create assessment";
      toast.error("Creation Failed", errMsg);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.item) return;
    try {
      setDeleteModal((prev) => ({ ...prev, loading: true }));
      await assessmentService.deleteAssessment(deleteModal.item._id);
      toast.success(
        "Assessment Removed",
        `"${deleteModal.item.title}" was deleted or deactivated.`,
      );
      setDeleteModal({ isOpen: false, item: null, loading: false });
      fetchAssessments();
    } catch (err) {
      const errMsg = err.message || "Failed to delete assessment";
      toast.error("Deletion Failed", errMsg);
      setDeleteModal((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <AdminLayout
      title="Assessment Management"
      subtitle="Create diagnostic evaluations, define psychometric dimensions, and manage question catalogs."
    >
      <div className="space-y-6">
        {/* Top Actions */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Showing {assessments.length} assessment
            {assessments.length !== 1 ? "s" : ""}
          </div>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            className="gap-1.5 text-xs shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Create Assessment</span>
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : assessments.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No Assessments Created"
            description="Create your first psychometric assessment to evaluate learner cognitive styles."
            actionText="Create Assessment"
            onAction={() => setCreateModalOpen(true)}
          />
        ) : (
          <Card className="overflow-hidden bg-white border border-border shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title & Type</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead>Dimensions</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assessments.map((item) => (
                  <TableRow key={item._id}>
                    {/* Title */}
                    <TableCell>
                      <div className="font-semibold text-foreground text-sm">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Type: {item.type}
                      </div>
                    </TableCell>

                    {/* Question Count */}
                    <TableCell className="font-semibold text-xs text-foreground">
                      {item.questionCount || 0} questions
                    </TableCell>

                    {/* Dimensions */}
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {item.dimensions?.map((d, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="text-[10px]"
                          >
                            {d.name || d.key || d}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>

                    {/* Duration */}
                    <TableCell className="text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{item.estimatedDuration} mins</span>
                      </span>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <StatusBadge
                        status={item.isActive ? "ACTIVE" : "INACTIVE"}
                        size="small"
                      />
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/assessments/${item._id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs px-2.5 gap-1"
                          >
                            <HelpCircle className="h-3 w-3" />
                            <span>Questions ({item.questionCount || 0})</span>
                          </Button>
                        </Link>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(item)}
                          className={cn(
                            "h-7 text-xs px-2.5",
                            item.isActive
                              ? "text-red-600 hover:bg-red-50"
                              : "text-emerald-600 hover:bg-emerald-50",
                          )}
                        >
                          {item.isActive ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setDeleteModal({
                              isOpen: true,
                              item,
                              loading: false,
                            })
                          }
                          className="h-7 text-xs px-2 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* Create Assessment Dialog */}
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Psychometric Assessment</DialogTitle>
              <DialogDescription className="text-xs">
                Configure diagnostic parameters, dimension mappings, and
                duration.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label
                  className="text-xs font-semibold text-foreground"
                  htmlFor="create-title"
                >
                  Title *
                </label>
                <Input
                  id="create-title"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g. Cognitive Problem Solving Diagnostic"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  className="text-xs font-semibold text-foreground"
                  htmlFor="create-desc"
                >
                  Description *
                </label>
                <textarea
                  id="create-desc"
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Describes evaluation focus and target outcomes"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Type
                  </label>
                  <Select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                  >
                    <option value="LEARNING_STYLE">LEARNING_STYLE</option>
                    <option value="SKILLS">SKILLS</option>
                    <option value="PERSONALITY_PROFILE">
                      PERSONALITY_PROFILE
                    </option>
                    <option value="GENERAL">GENERAL</option>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Est. Duration (mins)
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={120}
                    value={formData.estimatedDuration}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        estimatedDuration: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Dimensions (comma-separated keys) *
                </label>
                <Input
                  required
                  value={formData.dimensions}
                  onChange={(e) =>
                    setFormData({ ...formData, dimensions: e.target.value })
                  }
                  placeholder="analytical, intuitive, structured, collaborative"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Instructions
                </label>
                <textarea
                  rows={2}
                  value={formData.instructions}
                  onChange={(e) =>
                    setFormData({ ...formData, instructions: e.target.value })
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  loading={createLoading}
                >
                  Save Assessment
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={deleteModal.isOpen}
          title="Delete Assessment"
          message={`Are you sure you want to delete "${deleteModal.item?.title}"? If students have completed attempts on this assessment, the backend will safely soft-deactivate it instead of hard deletion.`}
          confirmLabel="Delete"
          confirmVariant="danger"
          loading={deleteModal.loading}
          onConfirm={handleDeleteConfirm}
          onCancel={() =>
            setDeleteModal({ isOpen: false, item: null, loading: false })
          }
        />
      </div>
    </AdminLayout>
  );
}
