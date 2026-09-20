"use client";

import { useState, useEffect, useCallback } from "react";
import AdminLayout from "../../../components/admin/AdminLayout";
import curriculumService from "../../../services/curriculumService";
import StatusBadge from "../../../components/ui/StatusBadge";
import ConfirmModal from "../../../components/admin/ConfirmModal";
import EmptyState from "../../../components/ui/EmptyState";

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
      fetchModules();
    } catch (err) {
      alert(err.message || "Failed to update module status");
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
      } else {
        await curriculumService.createModule(payload);
      }

      setModuleModal((prev) => ({ ...prev, isOpen: false, loading: false }));
      fetchModules();
    } catch (err) {
      alert(err.message || "Failed to save curriculum module");
      setModuleModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleDeleteModule = async () => {
    if (!deleteModal.item) return;
    try {
      setDeleteModal((prev) => ({ ...prev, loading: true }));
      await curriculumService.deleteModule(deleteModal.item._id);
      setDeleteModal({ isOpen: false, item: null, loading: false });
      fetchModules();
    } catch (err) {
      alert(err.message || "Failed to delete module");
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
      {/* Top Search & Filter Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1.5rem",
          background: "var(--bg-surface, #1e293b)",
          padding: "1rem 1.25rem",
          borderRadius: "12px",
          border: "1px solid var(--border-color, #334155)",
        }}
      >
        <div style={{ flex: 1, minWidth: "220px" }}>
          <input
            type="text"
            placeholder="Search by module title or skill..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "0.5rem 0.75rem",
              borderRadius: "6px",
              background: "rgba(0, 0, 0, 0.2)",
              border: "1px solid var(--border-color)",
              color: "var(--text-primary)",
              fontSize: "0.9rem",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: "0.5rem 0.75rem",
              borderRadius: "6px",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              color: "var(--text-primary)",
              fontSize: "0.85rem",
            }}
          >
            <option value="ALL">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Difficulty Filter */}
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            style={{
              padding: "0.5rem 0.75rem",
              borderRadius: "6px",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              color: "var(--text-primary)",
              fontSize: "0.85rem",
            }}
          >
            <option value="ALL">All Difficulties</option>
            {DIFFICULTIES.map((diff) => (
              <option key={diff} value={diff}>
                {diff}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={openCreateModal}
            className="btn-primary-small"
            style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
          >
            + Create Module
          </button>
        </div>
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
          Loading curriculum catalog...
        </div>
      ) : modules.length === 0 ? (
        <EmptyState
          icon="📚"
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
                  <th style={{ padding: "0.85rem 1.25rem" }}>
                    Title & Category
                  </th>
                  <th style={{ padding: "0.85rem 1rem" }}>Difficulty</th>
                  <th style={{ padding: "0.85rem 1rem" }}>Duration</th>
                  <th style={{ padding: "0.85rem 1rem" }}>Prerequisites</th>
                  <th style={{ padding: "0.85rem 1rem" }}>Status</th>
                  <th
                    style={{ padding: "0.85rem 1.25rem", textAlign: "right" }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {modules.map((mod) => (
                  <tr
                    key={mod._id}
                    style={{ borderBottom: "1px solid var(--border-color)" }}
                  >
                    {/* Title & Category */}
                    <td style={{ padding: "1rem 1.25rem" }}>
                      <div
                        style={{
                          fontWeight: 600,
                          color: "var(--text-primary)",
                        }}
                      >
                        {mod.title}
                      </div>
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        {mod.category} • slug: <code>{mod.slug}</code>
                      </div>
                    </td>

                    {/* Difficulty */}
                    <td style={{ padding: "1rem" }}>
                      <span
                        style={{
                          background:
                            mod.difficulty === "BEGINNER"
                              ? "rgba(16, 185, 129, 0.15)"
                              : mod.difficulty === "INTERMEDIATE"
                                ? "rgba(99, 102, 241, 0.15)"
                                : "rgba(245, 158, 11, 0.15)",
                          color:
                            mod.difficulty === "BEGINNER"
                              ? "#10b981"
                              : mod.difficulty === "INTERMEDIATE"
                                ? "#818cf8"
                                : "#f59e0b",
                          padding: "0.2rem 0.55rem",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                        }}
                      >
                        {mod.difficulty}
                      </span>
                    </td>

                    {/* Duration */}
                    <td
                      style={{
                        padding: "1rem",
                        color: "var(--text-secondary)",
                        fontSize: "0.85rem",
                      }}
                    >
                      {mod.estimatedDuration} mins
                    </td>

                    {/* Prerequisites */}
                    <td style={{ padding: "1rem" }}>
                      {mod.prerequisites?.length > 0 ? (
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "0.25rem",
                          }}
                        >
                          {mod.prerequisites.map((p, i) => (
                            <span
                              key={i}
                              style={{
                                background: "rgba(255, 255, 255, 0.05)",
                                border: "1px solid var(--border-color)",
                                padding: "0.15rem 0.4rem",
                                borderRadius: "4px",
                                fontSize: "0.75rem",
                              }}
                            >
                              {p.title || p}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span
                          style={{
                            color: "var(--text-muted)",
                            fontSize: "0.8rem",
                          }}
                        >
                          None
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td style={{ padding: "1rem" }}>
                      <StatusBadge
                        status={mod.isActive ? "ACTIVE" : "INACTIVE"}
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
                        <button
                          type="button"
                          onClick={() => openEditModal(mod)}
                          className="btn-secondary-small"
                          style={{
                            fontSize: "0.8rem",
                            padding: "0.3rem 0.65rem",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(mod)}
                          style={{
                            background: "transparent",
                            border: "1px solid var(--border-color)",
                            color: mod.isActive ? "#f87171" : "#34d399",
                            padding: "0.3rem 0.65rem",
                            borderRadius: "6px",
                            fontSize: "0.8rem",
                            cursor: "pointer",
                          }}
                        >
                          {mod.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteModal({
                              isOpen: true,
                              item: mod,
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

      {/* Create / Edit Module Modal */}
      {moduleModal.isOpen && (
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
          onClick={() => setModuleModal((prev) => ({ ...prev, isOpen: false }))}
        >
          <div
            style={{
              background: "var(--bg-surface, #1e293b)",
              border: "1px solid var(--border-color, #334155)",
              borderRadius: "12px",
              width: "100%",
              maxWidth: "640px",
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
              {moduleModal.isEdit
                ? "Edit Curriculum Module"
                : "Create Curriculum Module"}
            </h3>

            <form
              onSubmit={handleSaveModule}
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr",
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
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={moduleModal.formData.title}
                    onChange={(e) =>
                      setModuleModal((prev) => ({
                        ...prev,
                        formData: { ...prev.formData, title: e.target.value },
                      }))
                    }
                    style={{
                      width: "100%",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "6px",
                      background: "rgba(0,0,0,0.2)",
                      border: "1px solid var(--border-color)",
                      color: "var(--text-primary)",
                    }}
                    placeholder="e.g. Asynchronous Node.js & Event Loop"
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
                    Slug (optional)
                  </label>
                  <input
                    type="text"
                    value={moduleModal.formData.slug}
                    onChange={(e) =>
                      setModuleModal((prev) => ({
                        ...prev,
                        formData: { ...prev.formData, slug: e.target.value },
                      }))
                    }
                    style={{
                      width: "100%",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "6px",
                      background: "rgba(0,0,0,0.2)",
                      border: "1px solid var(--border-color)",
                      color: "var(--text-primary)",
                    }}
                    placeholder="auto-generated"
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
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "6px",
                    background: "rgba(0,0,0,0.2)",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-primary)",
                    fontFamily: "inherit",
                  }}
                  placeholder="Explains concepts and practical application"
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
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
                    Category
                  </label>
                  <select
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
                    style={{
                      width: "100%",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "6px",
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border-color)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
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
                    Difficulty
                  </label>
                  <select
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
                    style={{
                      width: "100%",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "6px",
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border-color)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {DIFFICULTIES.map((d) => (
                      <option key={d} value={d}>
                        {d}
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
                    Duration (mins)
                  </label>
                  <input
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
                  Skills (comma-separated)
                </label>
                <input
                  type="text"
                  value={moduleModal.formData.skills}
                  onChange={(e) =>
                    setModuleModal((prev) => ({
                      ...prev,
                      formData: { ...prev.formData, skills: e.target.value },
                    }))
                  }
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "6px",
                    background: "rgba(0,0,0,0.2)",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-primary)",
                  }}
                  placeholder="e.g. Node.js, Event Loop, Libuv"
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
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "6px",
                    background: "rgba(0,0,0,0.2)",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-primary)",
                    fontFamily: "inherit",
                  }}
                  placeholder="e.g. Understand task queue vs microtask queue, Avoid blocking the main thread"
                />
              </div>

              {/* Prerequisites Multi-Select */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.85rem",
                    marginBottom: "0.3rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  Prerequisites (Select required predecessor modules)
                </label>
                <div
                  style={{
                    maxHeight: "150px",
                    overflowY: "auto",
                    padding: "0.5rem",
                    background: "rgba(0,0,0,0.2)",
                    borderRadius: "6px",
                    border: "1px solid var(--border-color)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.35rem",
                  }}
                >
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
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            fontSize: "0.85rem",
                            cursor: "pointer",
                            padding: "0.25rem 0.4rem",
                            borderRadius: "4px",
                            background: isSelected
                              ? "rgba(99, 102, 241, 0.15)"
                              : "transparent",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => togglePrereqSelection(otherMod._id)}
                          />
                          <span>{otherMod.title}</span>
                          <span
                            style={{
                              color: "var(--text-muted)",
                              fontSize: "0.75rem",
                            }}
                          >
                            ({otherMod.difficulty})
                          </span>
                        </label>
                      );
                    })}
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
                    setModuleModal((prev) => ({ ...prev, isOpen: false }))
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
                  disabled={moduleModal.loading}
                  className="btn-primary-small"
                  style={{ padding: "0.5rem 1.25rem" }}
                >
                  {moduleModal.loading ? "Saving..." : "Save Module"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
    </AdminLayout>
  );
}
