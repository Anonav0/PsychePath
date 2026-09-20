"use client";

export default function ConfirmModal({
  isOpen,
  title = "Confirm Action",
  message = "Are you sure you want to proceed? This action cannot be undone.",
  confirmLabel = "Confirm",
  confirmVariant = "danger", // 'danger' | 'primary'
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  loading = false,
}) {
  if (!isOpen) return null;

  const getConfirmStyle = () => {
    if (confirmVariant === "danger") {
      return {
        background: "#ef4444",
        color: "#ffffff",
        border: "none",
        padding: "0.5rem 1rem",
        borderRadius: "6px",
        fontWeight: 600,
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.7 : 1,
      };
    }
    return {
      background: "var(--primary, #6366f1)",
      color: "#ffffff",
      border: "none",
      padding: "0.5rem 1rem",
      borderRadius: "6px",
      fontWeight: 600,
      cursor: loading ? "not-allowed" : "pointer",
      opacity: loading ? 0.7 : 1,
    };
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "1rem",
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: "var(--bg-surface, #1e293b)",
          border: "1px solid var(--border-color, #334155)",
          borderRadius: "12px",
          width: "100%",
          maxWidth: "480px",
          padding: "1.75rem",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            margin: "0 0 0.75rem 0",
            fontSize: "1.2rem",
            fontWeight: 700,
            color:
              confirmVariant === "danger" ? "#f87171" : "var(--text-primary)",
          }}
        >
          {title}
        </h3>
        <p
          style={{
            margin: "0 0 1.5rem 0",
            color: "var(--text-secondary, #94a3b8)",
            fontSize: "0.925rem",
            lineHeight: 1.5,
          }}
        >
          {message}
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.75rem",
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{
              background: "transparent",
              color: "var(--text-primary, #f8fafc)",
              border: "1px solid var(--border-color, #334155)",
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={getConfirmStyle()}
          >
            {loading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
