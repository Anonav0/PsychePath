"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import AdminLayout from "../../../../components/admin/AdminLayout";
import assessmentService from "../../../../services/assessmentService";
import StatusBadge from "../../../../components/ui/StatusBadge";
import ConfirmModal from "../../../../components/admin/ConfirmModal";
import EmptyState from "../../../../components/ui/EmptyState";

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
      } else {
        await assessmentService.addQuestion(id, payload);
      }

      setQuestionModal((prev) => ({ ...prev, isOpen: false, loading: false }));
      fetchData();
    } catch (err) {
      alert(err.message || "Failed to save question");
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
      alert(err.message || "Failed to reorder question");
    }
  };

  const handleDeleteQuestion = async () => {
    if (!deleteModal.item) return;
    try {
      setDeleteModal((prev) => ({ ...prev, loading: true }));
      await assessmentService.deleteQuestion(deleteModal.item._id);
      setDeleteModal({ isOpen: false, item: null, loading: false });
      fetchData();
    } catch (err) {
      alert(err.message || "Failed to delete question");
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
      alert("A question must have at least 2 options.");
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
        <div
          style={{
            textAlign: "center",
            padding: "4rem",
            color: "var(--text-muted)",
          }}
        >
          Loading questions...
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
        <div
          style={{
            background: "rgba(239, 68, 68, 0.1)",
            color: "#f87171",
            padding: "1rem",
            borderRadius: "8px",
            marginBottom: "1.5rem",
          }}
        >
          {error || "Assessment not found"}
        </div>
        <Link href="/admin/assessments" className="btn-secondary-small">
          ← Back to Assessments
        </Link>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Back Navigation */}
      <div style={{ marginBottom: "1rem" }}>
        <Link
          href="/admin/assessments"
          style={{
            color: "var(--text-muted)",
            fontSize: "0.85rem",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.25rem",
          }}
        >
          ← Back to Assessments
        </Link>
      </div>

      {/* Assessment Header */}
      <div
        style={{
          background: "var(--bg-surface, #1e293b)",
          border: "1px solid var(--border-color, #334155)",
          borderRadius: "12px",
          padding: "1.75rem",
          marginBottom: "1.5rem",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "0.5rem",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                marginBottom: "0.25rem",
              }}
            >
              <h1 style={{ fontSize: "1.75rem", fontWeight: 800, margin: 0 }}>
                {assessment.title}
              </h1>
              <StatusBadge
                status={assessment.isActive ? "ACTIVE" : "INACTIVE"}
              />
            </div>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "0.95rem",
                margin: 0,
              }}
            >
              {assessment.description}
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="btn-primary-small"
            style={{ padding: "0.5rem 1.25rem", fontSize: "0.85rem" }}
          >
            + Add Question
          </button>
        </div>

        {/* Dimensions Tags */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginTop: "1rem",
          }}
        >
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Target Dimensions:
          </span>
          {assessment.dimensions?.map((d, i) => (
            <span
              key={i}
              style={{
                background: "rgba(99, 102, 241, 0.12)",
                color: "#a5b4fc",
                padding: "0.2rem 0.5rem",
                borderRadius: "4px",
                fontSize: "0.75rem",
                fontWeight: 600,
              }}
            >
              {d.name || d.key || d}
            </span>
          ))}
        </div>
      </div>

      {/* Questions Sequence List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0 }}>
            Question Set ({questions.length})
          </h2>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Ordered sequentially by execution rank
          </span>
        </div>

        {questions.length === 0 ? (
          <EmptyState
            icon="❓"
            title="No Questions in Assessment"
            description="Add questions with scoring options and psychometric dimension mappings."
            actionText="Add First Question"
            onAction={openAddModal}
          />
        ) : (
          questions.map((q, index) => (
            <div
              key={q._id}
              style={{
                background: "var(--bg-surface, #1e293b)",
                border: "1px solid var(--border-color, #334155)",
                borderRadius: "12px",
                padding: "1.25rem 1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              {/* Question Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "1rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: "0.75rem",
                  }}
                >
                  <span
                    style={{
                      background: "rgba(99, 102, 241, 0.15)",
                      color: "#a5b4fc",
                      fontWeight: 800,
                      fontSize: "0.85rem",
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {index + 1}
                  </span>
                  <div>
                    <h3
                      style={{
                        margin: "0 0 0.25rem 0",
                        fontSize: "1.05rem",
                        fontWeight: 600,
                      }}
                    >
                      {q.questionText}
                    </h3>
                    <div
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        fontSize: "0.75rem",
                      }}
                    >
                      <span style={{ color: "var(--text-muted)" }}>
                        Dimension:{" "}
                        <strong style={{ color: "var(--primary, #6366f1)" }}>
                          {q.dimension}
                        </strong>
                      </span>
                      <span style={{ color: "var(--text-muted)" }}>•</span>
                      <span style={{ color: "var(--text-muted)" }}>
                        Type: {q.questionType}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Reorder and Edit Actions */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                  }}
                >
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => handleReorder(q, "up")}
                    style={{
                      background: "transparent",
                      border: "1px solid var(--border-color)",
                      color:
                        index === 0
                          ? "var(--text-muted)"
                          : "var(--text-primary)",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "4px",
                      cursor: index === 0 ? "not-allowed" : "pointer",
                      fontSize: "0.75rem",
                    }}
                    title="Move Up"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    disabled={index === questions.length - 1}
                    onClick={() => handleReorder(q, "down")}
                    style={{
                      background: "transparent",
                      border: "1px solid var(--border-color)",
                      color:
                        index === questions.length - 1
                          ? "var(--text-muted)"
                          : "var(--text-primary)",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "4px",
                      cursor:
                        index === questions.length - 1
                          ? "not-allowed"
                          : "pointer",
                      fontSize: "0.75rem",
                    }}
                    title="Move Down"
                  >
                    ▼
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal(q)}
                    style={{
                      background: "transparent",
                      border: "1px solid var(--border-color)",
                      color: "var(--text-primary)",
                      padding: "0.25rem 0.6rem",
                      borderRadius: "4px",
                      fontSize: "0.8rem",
                      cursor: "pointer",
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setDeleteModal({ isOpen: true, item: q, loading: false })
                    }
                    style={{
                      background: "transparent",
                      border: "1px solid rgba(239, 68, 68, 0.3)",
                      color: "#f87171",
                      padding: "0.25rem 0.6rem",
                      borderRadius: "4px",
                      fontSize: "0.8rem",
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Options Breakdown */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "0.5rem",
                  padding: "0.75rem",
                  background: "rgba(0, 0, 0, 0.2)",
                  borderRadius: "8px",
                  fontSize: "0.8rem",
                }}
              >
                {q.options?.map((opt, optIdx) => (
                  <div
                    key={optIdx}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <span>{opt.label || opt.text}</span>
                    <span style={{ fontWeight: 700, color: "#a5b4fc" }}>
                      Score: {opt.score ?? opt.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Question Add/Edit Modal */}
      {questionModal.isOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem",
          }}
          onClick={() =>
            setQuestionModal((prev) => ({ ...prev, isOpen: false }))
          }
        >
          <div
            style={{
              background: "var(--bg-surface, #1e293b)",
              border: "1px solid var(--border-color, #334155)",
              borderRadius: "12px",
              width: "100%",
              maxWidth: "580px",
              padding: "1.75rem",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                margin: "0 0 1rem 0",
                fontSize: "1.25rem",
                fontWeight: 700,
              }}
            >
              {questionModal.isEdit ? "Edit Question" : "Add New Question"}
            </h3>

            <form
              onSubmit={handleSaveQuestion}
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.85rem",
                    marginBottom: "0.3rem",
                    color: "var(--text-secondary)",
                  }}
                >
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
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "6px",
                    background: "rgba(0,0,0,0.2)",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-primary)",
                    fontFamily: "inherit",
                  }}
                  placeholder="e.g. When approaching complex technical challenges, do you prioritize modular isolation?"
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.85rem",
                      marginBottom: "0.3rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Target Dimension *
                  </label>
                  <select
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
                    style={{
                      width: "100%",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "6px",
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border-color)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {assessment.dimensions?.map((d, i) => (
                      <option key={i} value={d.key || d}>
                        {d.name || d.key || d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.85rem",
                      marginBottom: "0.3rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Question Type
                  </label>
                  <select
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
                    style={{
                      width: "100%",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "6px",
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border-color)",
                      color: "var(--text-primary)",
                    }}
                  >
                    <option value="LIKERT_SCALE">LIKERT_SCALE</option>
                    <option value="MULTIPLE_CHOICE">MULTIPLE_CHOICE</option>
                    <option value="SINGLE_CHOICE">SINGLE_CHOICE</option>
                  </select>
                </div>
              </div>

              {/* Options List */}
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.5rem",
                  }}
                >
                  <label
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--text-secondary)",
                      fontWeight: 600,
                    }}
                  >
                    Options & Scoring (Min 2)
                  </label>
                  <button
                    type="button"
                    onClick={addOption}
                    style={{
                      background: "transparent",
                      border: "1px solid var(--border-color)",
                      color: "var(--primary, #6366f1)",
                      padding: "0.2rem 0.5rem",
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                    }}
                  >
                    + Add Option
                  </button>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                >
                  {questionModal.formData.options.map((opt, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        alignItems: "center",
                      }}
                    >
                      <input
                        type="text"
                        required
                        placeholder="Option Label"
                        value={opt.label}
                        onChange={(e) =>
                          updateOption(i, "label", e.target.value)
                        }
                        style={{
                          flex: 2,
                          padding: "0.4rem 0.6rem",
                          borderRadius: "4px",
                          background: "rgba(0,0,0,0.2)",
                          border: "1px solid var(--border-color)",
                          color: "var(--text-primary)",
                          fontSize: "0.85rem",
                        }}
                      />
                      <input
                        type="number"
                        placeholder="Score (0-100)"
                        value={opt.score}
                        onChange={(e) =>
                          updateOption(i, "score", e.target.value)
                        }
                        style={{
                          width: "90px",
                          padding: "0.4rem 0.6rem",
                          borderRadius: "4px",
                          background: "rgba(0,0,0,0.2)",
                          border: "1px solid var(--border-color)",
                          color: "var(--text-primary)",
                          fontSize: "0.85rem",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removeOption(i)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#f87171",
                          cursor: "pointer",
                          fontSize: "1rem",
                        }}
                        title="Remove option"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "0.75rem",
                  marginTop: "1rem",
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    setQuestionModal((prev) => ({ ...prev, isOpen: false }))
                  }
                  style={{
                    background: "transparent",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-color)",
                    padding: "0.5rem 1rem",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={questionModal.loading}
                  className="btn-primary-small"
                  style={{ padding: "0.5rem 1.25rem" }}
                >
                  {questionModal.loading ? "Saving..." : "Save Question"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
    </AdminLayout>
  );
}
