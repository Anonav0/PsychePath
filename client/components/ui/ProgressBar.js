"use client";

import React from "react";
import { cn } from "@/lib/utils";

/**
 * Reusable Accessible Progress Bar Component
 * Styled with shadcn tokens and Tailwind transitions
 */
export default function ProgressBar({
  value = 0,
  max = 100,
  height = "8px",
  showLabel = false,
  variant = "gradient", // 'gradient' | 'success' | 'warning' | 'primary' | 'destructive'
  labelPosition = "right",
  className = "",
  style = {},
}) {
  const percentage = Math.min(
    100,
    Math.max(0, Math.round((value / max) * 100)),
  );

  const getVariantClass = () => {
    switch (variant) {
      case "success":
        return "bg-emerald-500";
      case "warning":
        return "bg-amber-500";
      case "destructive":
        return "bg-destructive";
      case "primary":
        return "bg-primary";
      case "gradient":
      default:
        return percentage === 100
          ? "bg-emerald-500"
          : "bg-gradient-to-r from-primary to-accent";
    }
  };

  return (
    <div
      className={cn("flex items-center gap-3 w-full", className)}
      style={style}
    >
      <div
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progress: ${percentage}%`}
        style={{ height }}
        className="flex-1 bg-muted rounded-full overflow-hidden"
      >
        <div
          style={{ width: `${percentage}%` }}
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            getVariantClass(),
          )}
        />
      </div>
      {showLabel && (
        <span
          className={cn(
            "text-xs font-semibold text-muted-foreground min-w-[3rem]",
            labelPosition === "right" ? "text-right" : "text-left",
          )}
        >
          {percentage}%
        </span>
      )}
    </div>
  );
}
