"use client";

import React from "react";
import { cn } from "../../lib/utils";

const Input = React.forwardRef(
  ({ className, type = "text", error, style = {}, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-slate-700 bg-slate-900/50 px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 text-slate-100",
          error && "border-red-500 focus-visible:ring-red-500",
          className,
        )}
        ref={ref}
        style={{
          width: "100%",
          height: "38px",
          padding: "0.5rem 0.75rem",
          borderRadius: "6px",
          background: "rgba(0, 0, 0, 0.25)",
          border: error
            ? "1px solid #ef4444"
            : "1px solid var(--border-color, #334155)",
          color: "var(--text-primary, #f8fafc)",
          fontSize: "0.875rem",
          outline: "none",
          fontFamily: "inherit",
          transition: "border-color 0.15s ease, box-shadow 0.15s ease",
          ...style,
        }}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
