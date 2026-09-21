"use client";

import React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 select-none",
  {
    variants: {
      variant: {
        default: "border-transparent bg-indigo-600 text-white",
        secondary: "border-transparent bg-slate-800 text-slate-200",
        destructive:
          "border-transparent bg-red-900/50 text-red-300 border-red-800",
        outline: "text-slate-300 border-slate-700",
        success:
          "border-transparent bg-emerald-950/60 text-emerald-400 border-emerald-800",
        warning:
          "border-transparent bg-amber-950/60 text-amber-400 border-amber-800",
        info: "border-transparent bg-sky-950/60 text-sky-400 border-sky-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant = "default",
  style = {},
  children,
  ...props
}) {
  const getStyles = () => {
    switch (variant) {
      case "secondary":
        return {
          background: "rgba(255, 255, 255, 0.08)",
          color: "var(--text-secondary, #94a3b8)",
          border: "1px solid var(--border-color, #334155)",
        };
      case "destructive":
        return {
          background: "rgba(239, 68, 68, 0.15)",
          color: "#f87171",
          border: "1px solid rgba(239, 68, 68, 0.3)",
        };
      case "outline":
        return {
          background: "transparent",
          color: "var(--text-secondary, #94a3b8)",
          border: "1px solid var(--border-color, #334155)",
        };
      case "success":
        return {
          background: "rgba(16, 185, 129, 0.15)",
          color: "#10b981",
          border: "1px solid rgba(16, 185, 129, 0.3)",
        };
      case "warning":
        return {
          background: "rgba(245, 158, 11, 0.15)",
          color: "#f59e0b",
          border: "1px solid rgba(245, 158, 11, 0.3)",
        };
      case "info":
        return {
          background: "rgba(56, 189, 248, 0.15)",
          color: "#38bdf8",
          border: "1px solid rgba(56, 189, 248, 0.3)",
        };
      case "default":
      default:
        return {
          background: "rgba(99, 102, 241, 0.15)",
          color: "#a5b4fc",
          border: "1px solid rgba(99, 102, 241, 0.3)",
        };
    }
  };

  return (
    <span
      className={cn(badgeVariants({ variant }), className)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35rem",
        padding: "0.2rem 0.6rem",
        borderRadius: "9999px",
        fontSize: "0.75rem",
        fontWeight: 600,
        lineHeight: 1,
        ...getStyles(),
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
}

export { Badge, badgeVariants };
