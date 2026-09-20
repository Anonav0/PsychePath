"use client";

import { useState, useEffect, useCallback } from "react";
import curriculumService from "../../services/curriculumService";
import authService from "../../services/authService";

const CATEGORIES = [
  "ALL",
  "FRONTEND",
  "BACKEND",
  "DATABASE",
  "DEVOPS",
  "AI_DATA_SCIENCE",
  "SYSTEM_DESIGN",
  "MOBILE",
  "CLOUD",
];

const DIFFICULTIES = ["ALL", "BEGINNER", "INTERMEDIATE", "ADVANCED"];

export default function CurriculumPage() {
  const [modules, setModules] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedDifficulty, setSelectedDifficulty] = useState("ALL");
  const [skillFilter, setSkillFilter] = useState("");
  const [expandedModuleId, setExpandedModuleId] = useState(null);

  const fetchModules = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        setError(null);

        const params = {
          page,
          limit: 12,
          sortBy: "order",
          sortOrder: "asc",
        };

        if (search.trim()) params.search = search.trim();
        if (selectedCategory !== "ALL") params.category = selectedCategory;
        if (selectedDifficulty !== "ALL")
          params.difficulty = selectedDifficulty;
        if (skillFilter.trim()) params.skill = skillFilter.trim();

        const res = await curriculumService.getModules(params);
        if (res.success && res.data) {
          setModules(res.data.modules || []);
          if (res.data.pagination) {
            setPagination(res.data.pagination);
          }
        }
      } catch (err) {
        setError(err.message || "Failed to load curriculum modules");
      } finally {
        setLoading(false);
      }
    },
    [search, selectedCategory, selectedDifficulty, skillFilter],
  );

  useEffect(() => {
    fetchModules(1);
  }, [fetchModules]);

  const toggleExpand = (id) => {
    setExpandedModuleId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="curriculum-container">
      <div style={{ marginBottom: "2rem" }}>
        <h1
          style={{
            fontSize: "2.2rem",
            fontWeight: 800,
            marginBottom: "0.5rem",
          }}
        >
          Curriculum Knowledge Base
        </h1>
        <p style={{ color: "var(--text-secondary)", maxWidth: "700px" }}>
          Explore structured curriculum modules covering foundational to
          advanced software engineering, database architecture, machine
          learning, and DevOps practices with clear prerequisite chains.
        </p>
      </div>

      {/* Filter and Search Controls */}
      <div className="curriculum-filter-bar">
        <div style={{ flex: "1 1 200px" }}>
          <input
            type="text"
            placeholder="Search modules..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ flex: "1 1 150px" }}>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ width: "100%" }}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat === "ALL" ? "All Categories" : cat.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>

        <div style={{ flex: "1 1 150px" }}>
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            style={{ width: "100%" }}
          >
            {DIFFICULTIES.map((diff) => (
              <option key={diff} value={diff}>
                {diff === "ALL" ? "All Difficulties" : diff}
              </option>
            ))}
          </select>
        </div>

        <div style={{ flex: "1 1 160px" }}>
          <input
            type="text"
            placeholder="Filter by skill..."
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>

        {(search ||
          selectedCategory !== "ALL" ||
          selectedDifficulty !== "ALL" ||
          skillFilter) && (
          <button
            onClick={() => {
              setSearch("");
              setSelectedCategory("ALL");
              setSelectedDifficulty("ALL");
              setSkillFilter("");
            }}
            style={{
              background: "transparent",
              border: "1px solid var(--border-color)",
              color: "var(--text-secondary)",
              padding: "0.6rem 1rem",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Reset
          </button>
        )}
      </div>

      {error && (
        <div
          className="alert-box alert-error"
          style={{ marginBottom: "1.5rem" }}
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
          Loading curriculum modules...
        </div>
      ) : modules.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "4rem",
            background: "var(--bg-surface)",
            borderRadius: "12px",
            border: "1px solid var(--border-color)",
          }}
        >
          <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>
            No curriculum modules found matching the selected filters.
          </p>
        </div>
      ) : (
        <>
          <div className="curriculum-grid">
            {modules.map((item) => {
              const isExpanded = expandedModuleId === item._id;
              const diffClass =
                item.difficulty === "BEGINNER"
                  ? "difficulty-beginner"
                  : item.difficulty === "INTERMEDIATE"
                    ? "difficulty-intermediate"
                    : "difficulty-advanced";

              return (
                <div key={item._id} className="curriculum-card">
                  <div>
                    <div className="curriculum-card-header">
                      <span className="category-tag">{item.category}</span>
                      <span className={`difficulty-tag ${diffClass}`}>
                        {item.difficulty}
                      </span>
                    </div>

                    <h3
                      style={{
                        fontSize: "1.15rem",
                        fontWeight: 700,
                        marginBottom: "0.4rem",
                      }}
                    >
                      {item.title}
                    </h3>

                    <p
                      style={{
                        fontSize: "0.85rem",
                        color: "var(--text-secondary)",
                        marginBottom: "1rem",
                        lineHeight: 1.4,
                      }}
                    >
                      {item.description}
                    </p>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        marginBottom: "0.75rem",
                        fontSize: "0.8rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      <span>⏱️ {item.estimatedDuration} hrs</span>
                      <span>•</span>
                      <span>Order #{item.order}</span>
                    </div>

                    {/* Skills pills */}
                    {item.skills && item.skills.length > 0 && (
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "0.4rem",
                          marginBottom: "1rem",
                        }}
                      >
                        {item.skills.map((s, idx) => (
                          <span
                            key={idx}
                            className="skill-pill"
                            style={{ padding: "0.2rem 0.5rem" }}
                          >
                            {s.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Prerequisites */}
                    {item.prerequisites && item.prerequisites.length > 0 && (
                      <div style={{ marginBottom: "1rem" }}>
                        <div
                          style={{
                            fontSize: "0.725rem",
                            textTransform: "uppercase",
                            color: "var(--text-muted)",
                            fontWeight: 700,
                            marginBottom: "0.35rem",
                          }}
                        >
                          Prerequisites
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "0.35rem",
                          }}
                        >
                          {item.prerequisites.map((pre) => (
                            <span key={pre._id || pre} className="prereq-badge">
                              🔗{" "}
                              {typeof pre === "object"
                                ? pre.title
                                : "Module ID"}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Expanded Content: Learning Objectives & Resources */}
                    {isExpanded && (
                      <div
                        style={{
                          marginTop: "1rem",
                          paddingTop: "1rem",
                          borderTop: "1px solid var(--border-color)",
                        }}
                      >
                        {item.learningObjectives &&
                          item.learningObjectives.length > 0 && (
                            <div style={{ marginBottom: "1rem" }}>
                              <div
                                style={{
                                  fontSize: "0.75rem",
                                  fontWeight: 700,
                                  color: "var(--text-muted)",
                                  textTransform: "uppercase",
                                  marginBottom: "0.4rem",
                                }}
                              >
                                Learning Objectives
                              </div>
                              <ul
                                style={{
                                  paddingLeft: "1.2rem",
                                  fontSize: "0.8rem",
                                  color: "var(--text-secondary)",
                                }}
                              >
                                {item.learningObjectives.map((obj, oIdx) => (
                                  <li
                                    key={oIdx}
                                    style={{ marginBottom: "0.25rem" }}
                                  >
                                    {obj}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                        {item.resources && item.resources.length > 0 && (
                          <div>
                            <div
                              style={{
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                color: "var(--text-muted)",
                                textTransform: "uppercase",
                                marginBottom: "0.4rem",
                              }}
                            >
                              Educational Resources
                            </div>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.4rem",
                              }}
                            >
                              {item.resources.map((res, rIdx) => (
                                <a
                                  key={rIdx}
                                  href={res.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    fontSize: "0.8rem",
                                    color: "var(--primary)",
                                    textDecoration: "none",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.3rem",
                                  }}
                                >
                                  📖 {res.title} ({res.type}) ↗
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => toggleExpand(item._id)}
                    style={{
                      marginTop: "1rem",
                      width: "100%",
                      background: isExpanded
                        ? "var(--bg-surface-elevated)"
                        : "transparent",
                      border: "1px solid var(--border-color)",
                      color: "var(--text-primary)",
                      padding: "0.5rem",
                      borderRadius: "8px",
                      fontSize: "0.825rem",
                      cursor: "pointer",
                    }}
                  >
                    {isExpanded
                      ? "Hide Details ▲"
                      : "View Objectives & Resources ▼"}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "1rem",
                marginTop: "2.5rem",
              }}
            >
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchModules(pagination.page - 1)}
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-color)",
                  color:
                    pagination.page <= 1
                      ? "var(--text-muted)"
                      : "var(--text-primary)",
                  padding: "0.5rem 1rem",
                  borderRadius: "8px",
                  cursor: pagination.page <= 1 ? "not-allowed" : "pointer",
                }}
              >
                Previous
              </button>
              <span
                style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}
              >
                Page {pagination.page} of {pagination.totalPages} (
                {pagination.total} modules)
              </span>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchModules(pagination.page + 1)}
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-color)",
                  color:
                    pagination.page >= pagination.totalPages
                      ? "var(--text-muted)"
                      : "var(--text-primary)",
                  padding: "0.5rem 1rem",
                  borderRadius: "8px",
                  cursor:
                    pagination.page >= pagination.totalPages
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
