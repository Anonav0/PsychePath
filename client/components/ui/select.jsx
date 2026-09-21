"use client";

import React from "react";
import { cn } from "../../lib/utils";

const Select = React.forwardRef(
  ({ className, children, error, style = {}, ...props }, ref) => {
    return (
      <div style={{ position: "relative", width: "100%" }}>
        <select
          className={cn(
            "flex h-9 w-full appearance-none rounded-md border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 text-slate-100 pr-8",
            error && "border-red-500",
            className,
          )}
          ref={ref}
          style={{
            width: "100%",
            height: "38px",
            padding: "0.5rem 2rem 0.5rem 0.75rem",
            borderRadius: "6px",
            background: "var(--bg-surface, #1e293b)",
            border: error
              ? "1px solid #ef4444"
              : "1px solid var(--border-color, #334155)",
            color: "var(--text-primary, #f8fafc)",
            fontSize: "0.875rem",
            outline: "none",
            cursor: "pointer",
            appearance: "none",
            fontFamily: "inherit",
            ...style,
          }}
          {...props}
        >
          {children}
        </select>
        <div
          style={{
            position: "absolute",
            right: "10px",
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
            color: "var(--text-muted, #64748b)",
            fontSize: "0.75rem",
          }}
        >
          ▼
        </div>
      </div>
    );
  },
);
Select.displayName = "Select";

export { Select };
