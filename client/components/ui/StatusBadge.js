"use client";

/**
 * Reusable Status Badge Component
 */
export default function StatusBadge({
  status = "NOT_STARTED",
  size = "normal",
}) {
  const getStyles = () => {
    switch (status) {
      case "COMPLETED":
        return {
          bg: "rgba(16, 185, 129, 0.15)",
          color: "#10b981",
          border: "rgba(16, 185, 129, 0.3)",
          icon: "✓",
          label: "Completed",
        };
      case "IN_PROGRESS":
        return {
          bg: "rgba(99, 102, 241, 0.15)",
          color: "#818cf8",
          border: "rgba(99, 102, 241, 0.3)",
          icon: "▶",
          label: "In Progress",
        };
      case "SKIPPED":
        return {
          bg: "rgba(245, 158, 11, 0.15)",
          color: "#f59e0b",
          border: "rgba(245, 158, 11, 0.3)",
          icon: "⏭",
          label: "Skipped",
        };
      case "ACTIVE":
        return {
          bg: "rgba(16, 185, 129, 0.15)",
          color: "#10b981",
          border: "rgba(16, 185, 129, 0.3)",
          icon: "●",
          label: "Active",
        };
      case "ARCHIVED":
        return {
          bg: "rgba(100, 116, 139, 0.15)",
          color: "#94a3b8",
          border: "rgba(100, 116, 139, 0.3)",
          icon: "📦",
          label: "Archived",
        };
      case "NOT_STARTED":
      default:
        return {
          bg: "rgba(148, 163, 184, 0.1)",
          color: "#94a3b8",
          border: "rgba(148, 163, 184, 0.2)",
          icon: "○",
          label: "Not Started",
        };
    }
  };

  const conf = getStyles();
  const isSmall = size === "small";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35rem",
        fontSize: isSmall ? "0.7rem" : "0.75rem",
        fontWeight: 700,
        padding: isSmall ? "0.15rem 0.45rem" : "0.25rem 0.6rem",
        borderRadius: "9999px",
        background: conf.bg,
        color: conf.color,
        border: `1px solid ${conf.border}`,
        textTransform: "uppercase",
        letterSpacing: "0.03em",
      }}
    >
      <span>{conf.icon}</span>
      <span>{conf.label}</span>
    </span>
  );
}
