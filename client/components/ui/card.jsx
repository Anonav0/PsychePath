"use client";

import React from "react";
import { cn } from "../../lib/utils";

const Card = React.forwardRef(({ className, style = {}, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border border-slate-800 bg-slate-900/70 text-slate-100 shadow-md",
      className,
    )}
    style={{
      background: "var(--bg-surface, #1e293b)",
      border: "1px solid var(--border-color, #334155)",
      borderRadius: "12px",
      color: "var(--text-primary, #f8fafc)",
      boxShadow:
        "0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -2px rgba(0, 0, 0, 0.2)",
      ...style,
    }}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef(
  ({ className, style = {}, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      style={{
        padding: "1.25rem 1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.35rem",
        ...style,
      }}
      {...props}
    />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef(
  ({ className, style = {}, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        "font-semibold leading-none tracking-tight text-lg text-slate-100",
        className,
      )}
      style={{
        margin: 0,
        fontSize: "1.15rem",
        fontWeight: 700,
        color: "var(--text-primary, #f8fafc)",
        ...style,
      }}
      {...props}
    />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef(
  ({ className, style = {}, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-slate-400", className)}
      style={{
        margin: 0,
        fontSize: "0.875rem",
        color: "var(--text-secondary, #94a3b8)",
        lineHeight: 1.4,
        ...style,
      }}
      {...props}
    />
  ),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef(
  ({ className, style = {}, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("p-6 pt-0", className)}
      style={{ padding: "0 1.5rem 1.5rem 1.5rem", ...style }}
      {...props}
    />
  ),
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef(
  ({ className, style = {}, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center p-6 pt-0 border-t border-slate-800",
        className,
      )}
      style={{
        padding: "1rem 1.5rem",
        display: "flex",
        alignItems: "center",
        borderTop: "1px solid var(--border-color, #334155)",
        ...style,
      }}
      {...props}
    />
  ),
);
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
