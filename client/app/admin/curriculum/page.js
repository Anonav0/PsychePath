"use client";

import { useState, useEffect, useCallback } from "react";
import AdminLayout from "../../../components/admin/AdminLayout";
import curriculumService from "../../../services/curriculumService";
import StatusBadge from "../../../components/ui/StatusBadge";
import ConfirmModal from "../../../components/admin/ConfirmModal";
import EmptyState from "../../../components/ui/EmptyState";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { BookOpen, Plus, Search, Trash2, Edit, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "FRONTEND",
  "BACKEND",
  "DATABASE",
  "DEVOPS",
  "AI_DATA_SCIENCE",
  "SYSTEM_DESIGN",
  "MOBILE",
  "CLOUD",
  "FOUNDATIONS",
];

const DIFFICULTIES = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

export default function AdminCurriculumPage() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [difficultyFilter, setDifficultyFilter] = useState("ALL");

  // Create / Edit Modal
  const [moduleModal, setModuleModal] = useState({
    isOpen: false,
    isEdit: false,
    moduleId: null,
    loading: false,
    formData: {
      title: "",
      slug: "",
      description: "",
      category: "FRONTEND",
      difficulty: "BEGINNER",
      estimatedDuration: 60,
      skills: "",
      learningObjectives: "",
      prerequisites: [],
    },
  });

  // Delete modal
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    item: null,
    loading: false,
  });

  const fetchModules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (categoryFilter !== "ALL") params.category = categoryFilter;
      if (difficultyFilter !== "ALL") params.difficulty = difficultyFilter;
      if (search.trim()) params.search = search.trim();

      const res = await curriculumService.getModules(params);
      if (res?.success) {
        setModules(res.data.modules || []);
      }
    } catch (err) {
      setError(err.message || "Failed to load curriculum modules");
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, difficultyFilter, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchModules();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchModules]);

  const handleToggleStatus = async (mod) => {
    try {
      await curriculumService.toggleStatus(mod._id, !mod.isActive);
      toast.success(
        "Module Status Updated",
        `"${mod.title}" is now ${!mod.isActive ? "active" : "inactive"}.`,
      );
      fetchModules();
    } catch (err) {
      const errMsg = err.message || "Failed to update module status";
      toast.error("Update Failed", errMsg);
    }
  };

  const openCreateModal = () => {
    setModuleModal({
      isOpen: true,
      isEdit: false,
      moduleId: null,
      loading: false,
      formData: {
        title: "",
        slug: "",
        description: "",
        category: "FRONTEND",
        difficulty: "BEGINNER",
        estimatedDuration: 60,
        skills: "JavaScript, React",
        learningObjectives: "Understand components, hooks, and props",
        prerequisites: [],
      },
    });
  };

  const openEditModal = (mod) => {
    const skillsStr = mod.skills?.map((s) => s.name || s).join(", ") || "";
    const objectivesStr = mod.learningObjectives?.join(", ") || "";
    const prereqIds =
      mod.prerequisites?.map((p) => (p._id || p).toString()) || [];

    setModuleModal({
      isOpen: true,
      isEdit: true,
      moduleId: mod._id,
      loading: false,
      formData: {
        title: mod.title,
        slug: mod.slug,
        description: mod.description,
        category: mod.category,
        difficulty: mod.difficulty,
        estimatedDuration: mod.estimatedDuration || 60,
        skills: skillsStr,
        learningObjectives: objectivesStr,
        prerequisites: prereqIds,
      },
    });
  };

  const handleSaveModule = async (e) => {
    e.preventDefault();
    try {
      setModuleModal((prev) => ({ ...prev, loading: true }));
      const skillsArray = moduleModal.formData.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((name) => ({ name, level: moduleModal.formData.difficulty }));

      const objectivesArray = moduleModal.formData.learningObjectives
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean);

      const generatedSlug =
        moduleModal.formData.slug.trim() ||
        moduleModal.formData.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");

      const payload = {
        title: moduleModal.formData.title,
        slug: generatedSlug,
        description: moduleModal.formData.description,
        category: moduleModal.formData.category,
        difficulty: moduleModal.formData.difficulty,
        estimatedDuration: Number(moduleModal.formData.estimatedDuration) || 60,
        skills: skillsArray,
        learningObjectives: objectivesArray,
        prerequisites: moduleModal.formData.prerequisites,
      };

      if (moduleModal.isEdit) {
        await curriculumService.updateModule(moduleModal.moduleId, payload);
        toast.success(
          "Module Updated",
          `"${payload.title}" saved successfully.`,
        );
      } else {
        await curriculumService.createModule(payload);
        toast.success(
          "Module Created",
          `"${payload.title}" created in curriculum catalog.`,
        );
      }

      setModuleModal((prev) => ({ ...prev, isOpen: false, loading: false }));
      fetchModules();
    } catch (err) {
      const errMsg = err.message || "Failed to save curriculum module";
      toast.error("Save Failed", errMsg);
      setModuleModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleDeleteModule = async () => {
    if (!deleteModal.item) return;
    try {
      setDeleteModal((prev) => ({ ...prev, loading: true }));
      await curriculumService.deleteModule(deleteModal.item._id);
      toast.success(
        "Module Removed",
        `"${deleteModal.item.title}" was deleted or deactivated.`,
      );
      setDeleteModal({ isOpen: false, item: null, loading: false });
      fetchModules();
    } catch (err) {
      const errMsg = err.message || "Failed to delete module";
      toast.error("Deletion Failed", errMsg);
      setDeleteModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const togglePrereqSelection = (modId) => {
    setModuleModal((prev) => {
      const current = prev.formData.prerequisites;
      const updated = current.includes(modId)
        ? current.filter((id) => id !== modId)
        : [...current, modId];
      return {
        ...prev,
        formData: { ...prev.formData, prerequisites: updated },
      };
    });
  };

  return (
    <AdminLayout
      title="Curriculum Management"
      subtitle="Author catalog modules, configure prerequisite DAG relationships, and manage learning objectives."
    >
      <div className="space-y-6">
        {/* Top Search & Filter Bar */}
        <Card className="p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search module or skill..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
              <div className="w-36">
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="ALL">All Categories</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="w-36">
                <Select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                >
                  <option value="ALL">All Difficulties</option>
                  {DIFFICULTIES.map((diff) => (
                    <option key={diff} value={diff}>
                      {diff}
                    </option>
                  ))}
                </Select>
              </div>

              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={openCreateModal}
                className="gap-1.5 text-xs shadow-sm h-9"
              >
                <Plus className="h-4 w-4" />
                <span>Create Module</span>
              </Button>
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
        ) : modules.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No Curriculum Modules Found"
            description={
              search
                ? `No modules match "${search}".`
                : "No curriculum modules created yet."
            }
            actionText="Create First Module"
            onAction={openCreateModal}
          />
        ) : (
          <Card className="overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title & Category</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Prerequisites</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modules.map((mod) => (
                  <TableRow key={mod._id}>
                    {/* Title & Category */}
                    <TableCell>
                      <div className="font-semibold text-foreground text-sm">
                        {mod.title}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {mod.category} &bull;{" "}
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">
                          {mod.slug}
                        </code>
                      </div>
                    </TableCell>

                    {/* Difficulty */}
                    <TableCell>
                      <Badge
                        variant={
                          mod.difficulty === "BEGINNER"
                            ? "success"
                            : mod.difficulty === "INTERMEDIATE"
                              ? "default"
                              : "warning"
                        }
                        className="text-[10px]"
                      >
                        {mod.difficulty}
                      </Badge>
                    </TableCell>

                    {/* Duration */}
                    <TableCell className="text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{mod.estimatedDuration} hrs</span>
                      </span>
                    </TableCell>

                    {/* Prerequisites */}
                    <TableCell>
                      {mod.prerequisites?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {mod.prerequisites.map((p, i) => (
                            <Badge
                              key={i}
                              variant="secondary"
                              className="text-[10px]"
                            >
                              {p.title || p}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          None
                        </span>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <StatusBadge
                        status={mod.isActive ? "ACTIVE" : "INACTIVE"}
                        size="small"
                      />
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(mod)}
                          className="h-7 text-xs px-2.5 gap-1"
                        >
                          <Edit className="h-3 w-3" />
                          <span>Edit</span>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(mod)}
                          className={cn(
                            "h-7 text-xs px-2.5",
                            mod.isActive
                              ? "text-destructive hover:bg-destructive/10"
                              : "text-emerald-500 hover:bg-emerald-500/10",
                          )}
                        >
                          {mod.isActive ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setDeleteModal({
                              isOpen: true,
                              item: mod,
                              loading: false,
                            })
                          }
                          className="h-7 text-xs px-2 text-destructive hover:bg-destructive/10"
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

        {/* Create / Edit Module Dialog */}
        <Dialog
          open={moduleModal.isOpen}
          onOpenChange={(open) =>
            setModuleModal((prev) => ({ ...prev, isOpen: open }))
          }
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {moduleModal.isEdit
                  ? "Edit Curriculum Module"
                  : "Create Curriculum Module"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Author module metadata, competencies, and prerequisite
                dependency requirements.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveModule} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Title *
                  </label>
                  <Input
                    required
                    value={moduleModal.formData.title}
                    onChange={(e) =>
                      setModuleModal((prev) => ({
                        ...prev,
                        formData: { ...prev.formData, title: e.target.value },
                      }))
                    }
                    placeholder="e.g. Asynchronous Node.js & Event Loop"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Slug (optional)
                  </label>
                  <Input
                    value={moduleModal.formData.slug}
                    onChange={(e) =>
                      setModuleModal((prev) => ({
                        ...prev,
                        formData: { ...prev.formData, slug: e.target.value },
                      }))
                    }
                    placeholder="auto-generated"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Description *
                </label>
                <textarea
                  required
                  rows={2}
                  value={moduleModal.formData.description}
                  onChange={(e) =>
                    setModuleModal((prev) => ({
                      ...prev,
                      formData: {
                        ...prev.formData,
                        description: e.target.value,
                      },
                    }))
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Explains concepts and practical application"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Category
                  </label>
                  <Select
                    value={moduleModal.formData.category}
                    onChange={(e) =>
                      setModuleModal((prev) => ({
                        ...prev,
                        formData: {
                          ...prev.formData,
                          category: e.target.value,
                        },
                      }))
                    }
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Difficulty
                  </label>
                  <Select
                    value={moduleModal.formData.difficulty}
                    onChange={(e) =>
                      setModuleModal((prev) => ({
                        ...prev,
                        formData: {
                          ...prev.formData,
                          difficulty: e.target.value,
                        },
                      }))
                    }
                  >
                    {DIFFICULTIES.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Duration (hrs)
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={moduleModal.formData.estimatedDuration}
                    onChange={(e) =>
                      setModuleModal((prev) => ({
                        ...prev,
                        formData: {
                          ...prev.formData,
                          estimatedDuration: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Skills (comma-separated)
                </label>
                <Input
                  value={moduleModal.formData.skills}
                  onChange={(e) =>
                    setModuleModal((prev) => ({
                      ...prev,
                      formData: { ...prev.formData, skills: e.target.value },
                    }))
                  }
                  placeholder="e.g. Node.js, Event Loop, Libuv"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Learning Objectives (comma-separated)
                </label>
                <textarea
                  rows={2}
                  value={moduleModal.formData.learningObjectives}
                  onChange={(e) =>
                    setModuleModal((prev) => ({
                      ...prev,
                      formData: {
                        ...prev.formData,
                        learningObjectives: e.target.value,
                      },
                    }))
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="e.g. Understand task queue vs microtask queue, Avoid blocking main thread"
                />
              </div>

              {/* Prerequisites Multi-Select */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground block">
                  Prerequisites (Select predecessor modules)
                </label>
                <div className="max-h-40 overflow-y-auto p-2 rounded-lg border bg-muted/20 space-y-1">
                  {modules
                    .filter(
                      (m) =>
                        !moduleModal.isEdit || m._id !== moduleModal.moduleId,
                    )
                    .map((otherMod) => {
                      const isSelected =
                        moduleModal.formData.prerequisites.includes(
                          otherMod._id,
                        );
                      return (
                        <label
                          key={otherMod._id}
                          className={cn(
                            "flex items-center gap-2.5 p-2 rounded-md cursor-pointer text-xs transition-colors",
                            isSelected
                              ? "bg-primary/10 text-primary font-medium"
                              : "hover:bg-muted/40 text-foreground",
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => togglePrereqSelection(otherMod._id)}
                            className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                          />
                          <span>{otherMod.title}</span>
                          <span className="text-[10px] text-muted-foreground ml-auto">
                            ({otherMod.difficulty})
                          </span>
                        </label>
                      );
                    })}
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setModuleModal((prev) => ({ ...prev, isOpen: false }))
                  }
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  loading={moduleModal.loading}
                >
                  {moduleModal.isEdit ? "Save Changes" : "Create Module"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={deleteModal.isOpen}
          title="Delete Curriculum Module"
          message={`Are you sure you want to delete "${deleteModal.item?.title}"? If other active modules depend on this as a prerequisite, the backend will safely soft-deactivate it instead of hard deletion.`}
          confirmLabel="Delete"
          confirmVariant="danger"
          loading={deleteModal.loading}
          onConfirm={handleDeleteModule}
          onCancel={() =>
            setDeleteModal({ isOpen: false, item: null, loading: false })
          }
        />
      </div>
    </AdminLayout>
  );
}
