"use client";

import Link from "next/link";

/**
 * Standardized Empty State Component
 */
export default function EmptyState({
  icon = "📚",
  title = "No items found",
  description = "Get started by taking the first step.",
  actionText = null,
  actionHref = null,
  onAction = null,
  style = {},
}) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "3.5rem 1.5rem",
        background: "var(--bg-surface)",
        border: "1px solid var(--border-color)",
        borderRadius: "12px",
        margin: "1.5rem 0",
        ...style,
      }}
    >
      <div style={{ fontSize: "2.75rem", marginBottom: "1rem" }}>{icon}</div>
      <h3
        style={{
          fontSize: "1.25rem",
          fontWeight: 700,
          color: "var(--text-primary)",
          marginBottom: "0.5rem",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          color: "var(--text-secondary)",
          fontSize: "0.95rem",
          maxWidth: "480px",
          margin: "0 auto 1.5rem",
          lineHeight: 1.5,
        }}
      >
        {description}
      </p>

      {actionText && actionHref && (
        <Link
          href={actionHref}
          style={{
            display: "inline-block",
            background: "linear-gradient(135deg, #6366f1, #a855f7)",
            color: "#ffffff",
            padding: "0.65rem 1.5rem",
            borderRadius: "8px",
            fontWeight: 600,
            fontSize: "0.9rem",
            textDecoration: "none",
          }}
        >
          {actionText}
        </Link>
      )}

      {actionText && onAction && !actionHref && (
        <button
          onClick={onAction}
          style={{
            background: "linear-gradient(135deg, #6366f1, #a855f7)",
            color: "#ffffff",
            border: "none",
            padding: "0.65rem 1.5rem",
            borderRadius: "8px",
            fontWeight: 600,
            fontSize: "0.9rem",
            cursor: "pointer",
          }}
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
