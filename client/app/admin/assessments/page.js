"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AdminLayout from "../../../components/admin/AdminLayout";
import assessmentService from "../../../services/assessmentService";
import StatusBadge from "../../../components/ui/StatusBadge";
import ConfirmModal from "../../../components/admin/ConfirmModal";
import EmptyState from "../../../components/ui/EmptyState";

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
      fetchAssessments();
    } catch (err) {
      alert(err.message || "Failed to update assessment status");
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
      alert(err.message || "Failed to create assessment");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.item) return;
    try {
      setDeleteModal((prev) => ({ ...prev, loading: true }));
      await assessmentService.deleteAssessment(deleteModal.item._id);
      setDeleteModal({ isOpen: false, item: null, loading: false });
      fetchAssessments();
    } catch (err) {
      alert(err.message || "Failed to delete assessment");
      setDeleteModal((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <AdminLayout
      title="Assessment Management"
      subtitle="Create diagnostic evaluations, define psychometric dimensions, and manage question catalogs."
    >
      {/* Top Actions */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Showing {assessments.length} assessment
          {assessments.length !== 1 ? "s" : ""}
        </div>
        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          className="btn-primary-small"
          style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
        >
          + Create Assessment
        </button>
      </div>

      {error && (
        <div
          style={{
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#f87171",
            padding: "1rem",
            borderRadius: "8px",
            marginBottom: "1.5rem",
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: "4rem",
            color: "var(--text-muted)",
          }}
        >
          Loading assessment catalog...
        </div>
      ) : assessments.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No Assessments Created"
          description="Create your first psychometric assessment to evaluate learner cognitive styles."
          actionText="Create Assessment"
          onAction={() => setCreateModalOpen(true)}
        />
      ) : (
        <div
          style={{
            background: "var(--bg-surface, #1e293b)",
            border: "1px solid var(--border-color, #334155)",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
                fontSize: "0.9rem",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    borderBottom: "1px solid var(--border-color)",
                    color: "var(--text-muted)",
                    fontSize: "0.8rem",
                    textTransform: "uppercase",
                  }}
                >
                  <th style={{ padding: "0.85rem 1.25rem" }}>Title & Type</th>
                  <th style={{ padding: "0.85rem 1rem" }}>Questions</th>
                  <th style={{ padding: "0.85rem 1rem" }}>Dimensions</th>
                  <th style={{ padding: "0.85rem 1rem" }}>Duration</th>
                  <th style={{ padding: "0.85rem 1rem" }}>Status</th>
                  <th
                    style={{ padding: "0.85rem 1.25rem", textAlign: "right" }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {assessments.map((item) => (
                  <tr
                    key={item._id}
                    style={{ borderBottom: "1px solid var(--border-color)" }}
                  >
                    {/* Title */}
                    <td style={{ padding: "1rem 1.25rem" }}>
                      <div
                        style={{
                          fontWeight: 600,
                          color: "var(--text-primary)",
                        }}
                      >
                        {item.title}
                      </div>
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        Type: {item.type}
                      </div>
                    </td>

                    {/* Question Count */}
                    <td style={{ padding: "1rem", fontWeight: 600 }}>
                      {item.questionCount || 0} questions
                    </td>

                    {/* Dimensions */}
                    <td style={{ padding: "1rem" }}>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "0.3rem",
                        }}
                      >
                        {item.dimensions?.map((d, i) => (
                          <span
                            key={i}
                            style={{
                              background: "rgba(99, 102, 241, 0.12)",
                              color: "#a5b4fc",
                              padding: "0.15rem 0.4rem",
                              borderRadius: "4px",
                              fontSize: "0.75rem",
                            }}
                          >
                            {d.name || d.key || d}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Duration */}
                    <td
                      style={{
                        padding: "1rem",
                        color: "var(--text-secondary)",
                        fontSize: "0.85rem",
                      }}
                    >
                      {item.estimatedDuration} mins
                    </td>

                    {/* Status */}
                    <td style={{ padding: "1rem" }}>
                      <StatusBadge
                        status={item.isActive ? "ACTIVE" : "INACTIVE"}
                        size="small"
                      />
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "1rem 1.25rem", textAlign: "right" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: "0.5rem",
                        }}
                      >
                        <Link
                          href={`/admin/assessments/${item._id}`}
                          className="btn-primary-small"
                          style={{
                            fontSize: "0.8rem",
                            padding: "0.3rem 0.65rem",
                          }}
                        >
                          Questions ({item.questionCount || 0})
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(item)}
                          style={{
                            background: "transparent",
                            border: "1px solid var(--border-color)",
                            color: item.isActive ? "#f87171" : "#34d399",
                            padding: "0.3rem 0.65rem",
                            borderRadius: "6px",
                            fontSize: "0.8rem",
                            cursor: "pointer",
                          }}
                        >
                          {item.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteModal({
                              isOpen: true,
                              item,
                              loading: false,
                            })
                          }
                          style={{
                            background: "transparent",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            color: "#f87171",
                            padding: "0.3rem 0.65rem",
                            borderRadius: "6px",
                            fontSize: "0.8rem",
                            cursor: "pointer",
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Assessment Modal */}
      {createModalOpen && (
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
          onClick={() => setCreateModalOpen(false)}
        >
          <div
            style={{
              background: "var(--bg-surface, #1e293b)",
              border: "1px solid var(--border-color, #334155)",
              borderRadius: "12px",
              width: "100%",
              maxWidth: "540px",
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
              Create Psychometric Assessment
            </h3>

            <form
              onSubmit={handleCreateSubmit}
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
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "6px",
                    background: "rgba(0,0,0,0.2)",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-primary)",
                  }}
                  placeholder="e.g. Cognitive Problem Solving Diagnostic"
                />
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
                  Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
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
                  placeholder="Describes evaluation focus and target outcomes"
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
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
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
                    <option value="LEARNING_STYLE">LEARNING_STYLE</option>
                    <option value="SKILLS">SKILLS</option>
                    <option value="PERSONALITY_PROFILE">
                      PERSONALITY_PROFILE
                    </option>
                    <option value="GENERAL">GENERAL</option>
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
                    Est. Duration (mins)
                  </label>
                  <input
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
                    style={{
                      width: "100%",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "6px",
                      background: "rgba(0,0,0,0.2)",
                      border: "1px solid var(--border-color)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
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
                  Dimensions (comma-separated keys) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.dimensions}
                  onChange={(e) =>
                    setFormData({ ...formData, dimensions: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "6px",
                    background: "rgba(0,0,0,0.2)",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-primary)",
                  }}
                  placeholder="analytical, intuitive, structured, collaborative"
                />
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
                  Instructions
                </label>
                <textarea
                  rows={2}
                  value={formData.instructions}
                  onChange={(e) =>
                    setFormData({ ...formData, instructions: e.target.value })
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
                />
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
                  onClick={() => setCreateModalOpen(false)}
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
                  disabled={createLoading}
                  className="btn-primary-small"
                  style={{ padding: "0.5rem 1.25rem" }}
                >
                  {createLoading ? "Creating..." : "Save Assessment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
    </AdminLayout>
  );
}
