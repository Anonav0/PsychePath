"use client";

import React from "react";
import { cn } from "../../lib/utils";

const Checkbox = React.forwardRef(
  ({ className, checked, onChange, disabled, style = {}, ...props }, ref) => {
    return (
      <input
        type="checkbox"
        ref={ref}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className={cn(
          "h-4 w-4 rounded border-slate-300 bg-white text-indigo-600 focus:ring-indigo-500 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
          className,
        )}
        style={{
          width: "16px",
          height: "16px",
          accentColor: "var(--primary, #4f46e5)",
          cursor: disabled ? "not-allowed" : "pointer",
          ...style,
        }}
        {...props}
      />
    );
  },
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
