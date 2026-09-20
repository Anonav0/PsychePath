"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import AdminLayout from "../../../components/admin/AdminLayout";
import adminService from "../../../services/adminService";
import StatusBadge from "../../../components/ui/StatusBadge";
import ConfirmModal from "../../../components/admin/ConfirmModal";
import EmptyState from "../../../components/ui/EmptyState";

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
      setModalState({
        isOpen: false,
        learner: null,
        targetStatus: false,
        loading: false,
      });
      fetchLearners();
    } catch (err) {
      alert(err.message || "Failed to update learner status");
      setModalState((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <AdminLayout
      title="Learner Directory"
      subtitle="Inspect student profiles, review assessment activity, and manage access status."
    >
      {/* Search & Filter Controls */}
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
        {/* Search Input */}
        <div style={{ flex: 1, minWidth: "260px" }}>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            style={{
              width: "100%",
              padding: "0.55rem 0.85rem",
              borderRadius: "6px",
              background: "rgba(0, 0, 0, 0.2)",
              border: "1px solid var(--border-color)",
              color: "var(--text-primary)",
              fontSize: "0.9rem",
            }}
          />
        </div>

        {/* Status Filter Pills */}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {["ALL", "ACTIVE", "INACTIVE"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => {
                setStatusFilter(st);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              style={{
                padding: "0.4rem 0.85rem",
                borderRadius: "6px",
                fontSize: "0.85rem",
                fontWeight: 600,
                border: "1px solid var(--border-color)",
                background:
                  statusFilter === st
                    ? "var(--primary, #6366f1)"
                    : "transparent",
                color:
                  statusFilter === st ? "#ffffff" : "var(--text-secondary)",
                cursor: "pointer",
              }}
            >
              {st}
            </button>
          ))}
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
          Loading learners...
        </div>
      ) : learners.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No Learners Found"
          description={
            search
              ? `No student matches "${search}".`
              : "No registered learners found."
          }
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
                  <th style={{ padding: "0.85rem 1.25rem" }}>Learner</th>
                  <th style={{ padding: "0.85rem 1rem" }}>Status</th>
                  <th style={{ padding: "0.85rem 1rem" }}>Assessments</th>
                  <th style={{ padding: "0.85rem 1rem" }}>Learning Path</th>
                  <th style={{ padding: "0.85rem 1rem" }}>Registered</th>
                  <th style={{ padding: "0.85rem 1rem" }}>Last Login</th>
                  <th
                    style={{ padding: "0.85rem 1.25rem", textAlign: "right" }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {learners.map((learner) => (
                  <tr
                    key={learner._id}
                    style={{
                      borderBottom: "1px solid var(--border-color)",
                      transition: "background 0.15s ease",
                    }}
                  >
                    {/* Learner Name & Email */}
                    <td style={{ padding: "1rem 1.25rem" }}>
                      <div
                        style={{
                          fontWeight: 600,
                          color: "var(--text-primary)",
                        }}
                      >
                        {learner.firstName} {learner.lastName}
                      </div>
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        {learner.email}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td style={{ padding: "1rem" }}>
                      <StatusBadge
                        status={learner.isActive ? "ACTIVE" : "INACTIVE"}
                        size="small"
                      />
                    </td>

                    {/* Assessment Activity */}
                    <td style={{ padding: "1rem" }}>
                      <div style={{ fontWeight: 600 }}>
                        {learner.completedAttempts} completed
                      </div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        {learner.totalAttempts} total attempts
                      </div>
                    </td>

                    {/* Active Learning Path */}
                    <td style={{ padding: "1rem" }}>
                      {learner.hasActiveLearningPath ? (
                        <span
                          style={{
                            background: "rgba(16, 185, 129, 0.15)",
                            color: "#10b981",
                            padding: "0.2rem 0.55rem",
                            borderRadius: "4px",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                          }}
                        >
                          ✓ Active Path
                        </span>
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

                    {/* Registered Date */}
                    <td
                      style={{
                        padding: "1rem",
                        color: "var(--text-secondary)",
                        fontSize: "0.85rem",
                      }}
                    >
                      {new Date(learner.createdAt).toLocaleDateString()}
                    </td>

                    {/* Last Login */}
                    <td
                      style={{
                        padding: "1rem",
                        color: "var(--text-muted)",
                        fontSize: "0.85rem",
                      }}
                    >
                      {learner.lastLoginAt
                        ? new Date(learner.lastLoginAt).toLocaleDateString()
                        : "Never"}
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
                          href={`/admin/learners/${learner._id}`}
                          className="btn-secondary-small"
                          style={{
                            fontSize: "0.8rem",
                            padding: "0.3rem 0.65rem",
                          }}
                        >
                          Inspect
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleToggleClick(learner)}
                          style={{
                            background: "transparent",
                            border: "1px solid var(--border-color)",
                            color: learner.isActive ? "#f87171" : "#34d399",
                            padding: "0.3rem 0.65rem",
                            borderRadius: "6px",
                            fontSize: "0.8rem",
                            cursor: "pointer",
                          }}
                        >
                          {learner.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0.85rem 1.25rem",
              background: "rgba(255, 255, 255, 0.02)",
              borderTop: "1px solid var(--border-color)",
              fontSize: "0.85rem",
            }}
          >
            <span style={{ color: "var(--text-muted)" }}>
              Showing {learners.length} of {pagination.total} learners (Page{" "}
              {pagination.page} of {pagination.totalPages})
            </span>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() =>
                  setPagination((p) => ({ ...p, page: p.page - 1 }))
                }
                style={{
                  background: "transparent",
                  border: "1px solid var(--border-color)",
                  color:
                    pagination.page <= 1
                      ? "var(--text-muted)"
                      : "var(--text-primary)",
                  padding: "0.35rem 0.75rem",
                  borderRadius: "6px",
                  cursor: pagination.page <= 1 ? "not-allowed" : "pointer",
                }}
              >
                ← Previous
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() =>
                  setPagination((p) => ({ ...p, page: p.page + 1 }))
                }
                style={{
                  background: "transparent",
                  border: "1px solid var(--border-color)",
                  color:
                    pagination.page >= pagination.totalPages
                      ? "var(--text-muted)"
                      : "var(--text-primary)",
                  padding: "0.35rem 0.75rem",
                  borderRadius: "6px",
                  cursor:
                    pagination.page >= pagination.totalPages
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                Next →
              </button>
            </div>
          </div>
        </div>
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
    </AdminLayout>
  );
}
