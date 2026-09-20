"use client";

/**
 * Reusable Accessible Progress Bar Component
 */
export default function ProgressBar({
  value = 0,
  max = 100,
  height = "8px",
  showLabel = false,
  variant = "gradient", // 'gradient' | 'success' | 'warning' | 'primary'
  labelPosition = "right",
  style = {},
}) {
  const percentage = Math.min(
    100,
    Math.max(0, Math.round((value / max) * 100)),
  );

  const getBackground = () => {
    switch (variant) {
      case "success":
        return "#10b981";
      case "warning":
        return "#f59e0b";
      case "primary":
        return "var(--primary, #6366f1)";
      case "gradient":
      default:
        return percentage === 100
          ? "#10b981"
          : "linear-gradient(90deg, #6366f1, #a855f7)";
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        width: "100%",
        ...style,
      }}
    >
      <div
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progress: ${percentage}%`}
        style={{
          flex: 1,
          height,
          background: "rgba(255, 255, 255, 0.08)",
          borderRadius: "9999px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: "100%",
            background: getBackground(),
            borderRadius: "9999px",
            transition: "width 0.4s ease",
          }}
        />
      </div>
      {showLabel && (
        <span
          style={{
            fontSize: "0.85rem",
            fontWeight: 600,
            color: "var(--text-secondary)",
            minWidth: "3rem",
            textAlign: labelPosition === "right" ? "right" : "left",
          }}
        >
          {percentage}%
        </span>
      )}
    </div>
  );
}
