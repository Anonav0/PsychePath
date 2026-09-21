"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import AdminLayout from "../../../../components/admin/AdminLayout";
import assessmentService from "../../../../services/assessmentService";
import StatusBadge from "../../../../components/ui/StatusBadge";
import ConfirmModal from "../../../../components/admin/ConfirmModal";
import EmptyState from "../../../../components/ui/EmptyState";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CardSkeleton } from "@/components/ui/skeleton";
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
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  ChevronUp,
  ChevronDown,
  HelpCircle,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AssessmentQuestionsPage() {
  const { id } = useParams();
  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Question Modal (Add / Edit)
  const [questionModal, setQuestionModal] = useState({
    isOpen: false,
    isEdit: false,
    questionId: null,
    loading: false,
    formData: {
      questionText: "",
      questionType: "LIKERT_SCALE",
      dimension: "",
      order: 1,
      options: [
        { label: "Strongly Disagree", value: "1", score: 20 },
        { label: "Disagree", value: "2", score: 40 },
        { label: "Neutral", value: "3", score: 60 },
        { label: "Agree", value: "4", score: 80 },
        { label: "Strongly Agree", value: "5", score: 100 },
      ],
    },
  });

  // Delete question modal
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    item: null,
    loading: false,
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [assessRes, questRes] = await Promise.all([
        assessmentService.getAssessmentById(id),
        assessmentService.getQuestions(id),
      ]);

      if (assessRes?.success) {
        setAssessment(assessRes.data);
      }
      if (questRes?.success) {
        setQuestions(questRes.data || []);
      }
    } catch (err) {
      setError(err.message || "Failed to load assessment and questions");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchData();
  }, [id, fetchData]);

  const openAddModal = () => {
    const defaultDim = assessment?.dimensions?.[0]?.key || "general";
    setQuestionModal({
      isOpen: true,
      isEdit: false,
      questionId: null,
      loading: false,
      formData: {
        questionText: "",
        questionType: "LIKERT_SCALE",
        dimension: defaultDim,
        order: questions.length + 1,
        options: [
          { label: "Strongly Disagree", value: "1", score: 20 },
          { label: "Disagree", value: "2", score: 40 },
          { label: "Neutral", value: "3", score: 60 },
          { label: "Agree", value: "4", score: 80 },
          { label: "Strongly Agree", value: "5", score: 100 },
        ],
      },
    });
  };

  const openEditModal = (q) => {
    setQuestionModal({
      isOpen: true,
      isEdit: true,
      questionId: q._id,
      loading: false,
      formData: {
        questionText: q.questionText,
        questionType: q.questionType,
        dimension: q.dimension,
        order: q.order || 1,
        options: q.options || [
          { label: "Option 1", value: "1", score: 50 },
          { label: "Option 2", value: "2", score: 100 },
        ],
      },
    });
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    try {
      setQuestionModal((prev) => ({ ...prev, loading: true }));
      const payload = {
        questionText: questionModal.formData.questionText,
        questionType: questionModal.formData.questionType,
        dimension: questionModal.formData.dimension,
        order: Number(questionModal.formData.order) || 1,
        options: questionModal.formData.options.map((opt) => ({
          label: opt.label,
          value: opt.value,
          score: Number(opt.score) || 0,
        })),
      };

      if (questionModal.isEdit) {
        await assessmentService.updateQuestion(
          questionModal.questionId,
          payload,
        );
        toast.success(
          "Question Updated",
          "Question was modified successfully.",
        );
      } else {
        await assessmentService.addQuestion(id, payload);
        toast.success("Question Added", "New question added to catalog.");
      }

      setQuestionModal((prev) => ({ ...prev, isOpen: false, loading: false }));
      fetchData();
    } catch (err) {
      const errMsg = err.message || "Failed to save question";
      toast.error("Save Failed", errMsg);
      setQuestionModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleReorder = async (q, direction) => {
    const currentIndex = questions.findIndex((item) => item._id === q._id);
    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    try {
      const targetOrder = questions[targetIndex].order || targetIndex + 1;
      await assessmentService.reorderQuestion(q._id, targetOrder);
      fetchData();
    } catch (err) {
      toast.error(
        "Reorder Failed",
        err.message || "Failed to reorder question",
      );
    }
  };

  const handleDeleteQuestion = async () => {
    if (!deleteModal.item) return;
    try {
      setDeleteModal((prev) => ({ ...prev, loading: true }));
      await assessmentService.deleteQuestion(deleteModal.item._id);
      toast.success("Question Removed", "Question deleted from assessment.");
      setDeleteModal({ isOpen: false, item: null, loading: false });
      fetchData();
    } catch (err) {
      toast.error("Delete Failed", err.message || "Failed to delete question");
      setDeleteModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const updateOption = (index, field, value) => {
    setQuestionModal((prev) => {
      const newOpts = [...prev.formData.options];
      newOpts[index] = { ...newOpts[index], [field]: value };
      return {
        ...prev,
        formData: { ...prev.formData, options: newOpts },
      };
    });
  };

  const addOption = () => {
    setQuestionModal((prev) => ({
      ...prev,
      formData: {
        ...prev.formData,
        options: [
          ...prev.formData.options,
          {
            label: `Option ${prev.formData.options.length + 1}`,
            value: `${prev.formData.options.length + 1}`,
            score: 50,
          },
        ],
      },
    }));
  };

  const removeOption = (index) => {
    if (questionModal.formData.options.length <= 2) {
      toast.warning(
        "Minimum Options",
        "A question must have at least 2 options.",
      );
      return;
    }
    setQuestionModal((prev) => {
      const newOpts = prev.formData.options.filter((_, i) => i !== index);
      return {
        ...prev,
        formData: { ...prev.formData, options: newOpts },
      };
    });
  };

  if (loading) {
    return (
      <AdminLayout
        title="Question Management"
        subtitle="Loading assessment configuration..."
      >
        <div className="space-y-6">
          <CardSkeleton count={1} />
          <CardSkeleton count={3} />
        </div>
      </AdminLayout>
    );
  }

  if (error || !assessment) {
    return (
      <AdminLayout
        title="Assessment Not Found"
        subtitle="Requested assessment could not be loaded."
      >
        <div className="space-y-4 max-w-xl">
          <Alert variant="destructive">
            <AlertDescription>
              {error || "Assessment not found"}
            </AlertDescription>
          </Alert>
          <Link href="/admin/assessments">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Assessments</span>
            </Button>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Back Navigation */}
        <div>
          <Link href="/admin/assessments">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground h-8 px-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Assessments</span>
            </Button>
          </Link>
        </div>

        {/* Assessment Header Card */}
        <Card className="p-6 bg-white border border-border shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                  {assessment.title}
                </h1>
                <StatusBadge
                  status={assessment.isActive ? "ACTIVE" : "INACTIVE"}
                />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {assessment.description}
              </p>
            </div>

            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={openAddModal}
              className="gap-1.5 text-xs shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Add Question</span>
            </Button>
          </div>

          {/* Dimensions Tags */}
          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-border">
            <span className="text-xs font-semibold text-foreground">
              Target Dimensions:
            </span>
            {assessment.dimensions?.map((d, i) => (
              <Badge
                key={i}
                variant="secondary"
                className="text-[11px] bg-indigo-50 text-indigo-700 border-indigo-200"
              >
                {d.name || d.key || d}
              </Badge>
            ))}
          </div>
        </Card>

        {/* Questions Sequence List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">
              Question Set ({questions.length})
            </h2>
            <span className="text-xs text-muted-foreground">
              Ordered sequentially by execution rank
            </span>
          </div>

          {questions.length === 0 ? (
            <EmptyState
              icon={HelpCircle}
              title="No Questions in Assessment"
              description="Add questions with scoring options and psychometric dimension mappings."
              actionText="Add First Question"
              onAction={openAddModal}
            />
          ) : (
            <div className="space-y-3">
              {questions.map((q, index) => (
                <Card
                  key={q._id}
                  className="p-5 bg-white border border-border shadow-sm space-y-3"
                >
                  {/* Question Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="h-7 w-7 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-200">
                        {index + 1}
                      </span>
                      <div className="space-y-1">
                        <h3 className="font-semibold text-sm sm:text-base text-foreground">
                          {q.questionText}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                          <span>
                            Dimension:{" "}
                            <strong className="text-indigo-600 font-medium">
                              {q.dimension}
                            </strong>
                          </span>
                          <span>&bull;</span>
                          <span>Type: {q.questionType}</span>
                        </div>
                      </div>
                    </div>

                    {/* Reorder and Edit Actions */}
                    <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={index === 0}
                        onClick={() => handleReorder(q, "up")}
                        className="h-7 w-7 p-0"
                        title="Move Up"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={index === questions.length - 1}
                        onClick={() => handleReorder(q, "down")}
                        className="h-7 w-7 p-0"
                        title="Move Down"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(q)}
                        className="h-7 text-xs px-2.5 gap-1"
                      >
                        <Edit2 className="h-3 w-3" />
                        <span>Edit</span>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setDeleteModal({
                            isOpen: true,
                            item: q,
                            loading: false,
                          })
                        }
                        className="h-7 text-xs px-2 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Options Breakdown */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 p-3 bg-slate-50/70 rounded-lg border border-slate-100 text-xs">
                    {q.options?.map((opt, optIdx) => (
                      <div
                        key={optIdx}
                        className="flex flex-col justify-between p-2 rounded bg-white border border-slate-200"
                      >
                        <span className="font-medium text-slate-800 truncate">
                          {opt.label || opt.text}
                        </span>
                        <span className="text-[11px] font-bold text-indigo-600 mt-1">
                          Score: {opt.score ?? opt.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Question Add/Edit Modal */}
        <Dialog
          open={questionModal.isOpen}
          onOpenChange={(open) =>
            setQuestionModal((prev) => ({ ...prev, isOpen: open }))
          }
        >
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {questionModal.isEdit ? "Edit Question" : "Add New Question"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Configure question wording, dimension target, and option scores.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveQuestion} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Question Text *
                </label>
                <textarea
                  required
                  rows={2}
                  value={questionModal.formData.questionText}
                  onChange={(e) =>
                    setQuestionModal((prev) => ({
                      ...prev,
                      formData: {
                        ...prev.formData,
                        questionText: e.target.value,
                      },
                    }))
                  }
                  className="w-full rounded-md border border-input bg-white px-3 py-2 text-xs text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="e.g. When approaching complex technical challenges, do you prioritize modular isolation?"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Target Dimension *
                  </label>
                  <Select
                    value={questionModal.formData.dimension}
                    onChange={(e) =>
                      setQuestionModal((prev) => ({
                        ...prev,
                        formData: {
                          ...prev.formData,
                          dimension: e.target.value,
                        },
                      }))
                    }
                  >
                    {assessment.dimensions?.map((d, i) => (
                      <option key={i} value={d.key || d}>
                        {d.name || d.key || d}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Question Type
                  </label>
                  <Select
                    value={questionModal.formData.questionType}
                    onChange={(e) =>
                      setQuestionModal((prev) => ({
                        ...prev,
                        formData: {
                          ...prev.formData,
                          questionType: e.target.value,
                        },
                      }))
                    }
                  >
                    <option value="LIKERT_SCALE">LIKERT_SCALE</option>
                    <option value="MULTIPLE_CHOICE">MULTIPLE_CHOICE</option>
                    <option value="SINGLE_CHOICE">SINGLE_CHOICE</option>
                  </Select>
                </div>
              </div>

              {/* Options List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">
                    Options & Scoring (Min 2)
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addOption}
                    className="h-6 text-[11px] px-2"
                  >
                    + Add Option
                  </Button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {questionModal.formData.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        type="text"
                        required
                        placeholder="Option Label"
                        value={opt.label}
                        onChange={(e) =>
                          updateOption(i, "label", e.target.value)
                        }
                        className="flex-1 h-8 text-xs"
                      />
                      <Input
                        type="number"
                        placeholder="Score"
                        value={opt.score}
                        onChange={(e) =>
                          updateOption(i, "score", e.target.value)
                        }
                        className="w-20 h-8 text-xs"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOption(i)}
                        className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                        title="Remove option"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setQuestionModal((prev) => ({ ...prev, isOpen: false }))
                  }
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  loading={questionModal.loading}
                >
                  Save Question
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Question Confirmation Modal */}
        <ConfirmModal
          isOpen={deleteModal.isOpen}
          title="Delete Question"
          message="Are you sure you want to remove this question from the assessment? This will reduce the assessment question count."
          confirmLabel="Delete Question"
          confirmVariant="danger"
          loading={deleteModal.loading}
          onConfirm={handleDeleteQuestion}
          onCancel={() =>
            setDeleteModal({ isOpen: false, item: null, loading: false })
          }
        />
      </div>
    </AdminLayout>
  );
}
