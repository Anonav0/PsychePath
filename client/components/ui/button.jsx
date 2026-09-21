"use client";

import React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default: "bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm",
        destructive: "bg-red-600 text-white hover:bg-red-500 shadow-sm",
        outline:
          "border border-slate-700 bg-transparent hover:bg-slate-800 text-slate-200",
        secondary:
          "bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700",
        ghost: "hover:bg-slate-800 hover:text-slate-100 text-slate-300",
        link: "text-indigo-400 underline-offset-4 hover:underline",
        success: "bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const Button = React.forwardRef(
  (
    {
      className,
      variant = "default",
      size = "default",
      loading = false,
      disabled,
      children,
      style = {},
      ...props
    },
    ref,
  ) => {
    // Determine inline styles for environments where utility classes are backed by CSS variables
    const getVariantStyles = () => {
      switch (variant) {
        case "destructive":
          return {
            background: "#dc2626",
            color: "#ffffff",
            border: "1px solid #b91c1c",
          };
        case "outline":
          return {
            background: "transparent",
            color: "var(--text-primary, #f8fafc)",
            border: "1px solid var(--border-color, #334155)",
          };
        case "secondary":
          return {
            background: "var(--bg-surface-elevated, #334155)",
            color: "var(--text-primary, #f8fafc)",
            border: "1px solid var(--border-color, #334155)",
          };
        case "ghost":
          return {
            background: "transparent",
            color: "var(--text-secondary, #94a3b8)",
            border: "none",
          };
        case "link":
          return {
            background: "transparent",
            color: "var(--primary, #6366f1)",
            border: "none",
            textDecoration: "underline",
          };
        case "success":
          return {
            background: "#059669",
            color: "#ffffff",
            border: "1px solid #047857",
          };
        case "default":
        default:
          return {
            background: "var(--primary, #6366f1)",
            color: "#ffffff",
            border: "none",
          };
      }
    };

    const getSizeStyles = () => {
      switch (size) {
        case "sm":
          return {
            height: "32px",
            padding: "0 0.75rem",
            fontSize: "0.8rem",
            borderRadius: "6px",
          };
        case "lg":
          return {
            height: "44px",
            padding: "0 1.5rem",
            fontSize: "1rem",
            borderRadius: "8px",
          };
        case "icon":
          return {
            width: "36px",
            height: "36px",
            padding: "0",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "6px",
          };
        case "default":
        default:
          return {
            height: "38px",
            padding: "0 1rem",
            fontSize: "0.875rem",
            borderRadius: "6px",
          };
      }
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(buttonVariants({ variant, size }), className)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          fontWeight: 600,
          cursor: disabled || loading ? "not-allowed" : "pointer",
          opacity: disabled || loading ? 0.6 : 1,
          transition: "all 0.15s ease-in-out",
          fontFamily: "inherit",
          ...getVariantStyles(),
          ...getSizeStyles(),
          ...style,
        }}
        {...props}
      >
        {loading && (
          <svg
            style={{
              animation: "spin 1s linear infinite",
              width: "16px",
              height: "16px",
            }}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              style={{ opacity: 0.25 }}
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              style={{ opacity: 0.75 }}
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
