"use client";

import React, { useEffect } from "react";
import { cn } from "../../lib/utils";

function Dialog({ open, onOpenChange, children }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9990,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(6px)",
      }}
      onClick={() => onOpenChange && onOpenChange(false)}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "540px",
          background: "var(--bg-surface, #1e293b)",
          border: "1px solid var(--border-color, #334155)",
          borderRadius: "14px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          overflow: "hidden",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function DialogHeader({ className, style = {}, ...props }) {
  return (
    <div
      className={cn("p-6 pb-2", className)}
      style={{ padding: "1.5rem 1.5rem 0.5rem 1.5rem", ...style }}
      {...props}
    />
  );
}

function DialogTitle({ className, style = {}, ...props }) {
  return (
    <h2
      className={cn("text-lg font-bold text-slate-100", className)}
      style={{
        margin: 0,
        fontSize: "1.25rem",
        fontWeight: 700,
        color: "var(--text-primary, #f8fafc)",
        ...style,
      }}
      {...props}
    />
  );
}

function DialogDescription({ className, style = {}, ...props }) {
  return (
    <p
      className={cn("text-sm text-slate-400 mt-1", className)}
      style={{
        margin: "0.35rem 0 0 0",
        fontSize: "0.875rem",
        color: "var(--text-secondary, #94a3b8)",
        lineHeight: 1.4,
        ...style,
      }}
      {...props}
    />
  );
}

function DialogContent({ className, style = {}, ...props }) {
  return (
    <div
      className={cn("p-6 overflow-y-auto", className)}
      style={{ padding: "1rem 1.5rem", overflowY: "auto", ...style }}
      {...props}
    />
  );
}

function DialogFooter({ className, style = {}, ...props }) {
  return (
    <div
      className={cn(
        "p-6 pt-2 flex justify-end gap-2 border-t border-slate-800",
        className,
      )}
      style={{
        padding: "1rem 1.5rem",
        display: "flex",
        justifyContent: "flex-end",
        gap: "0.75rem",
        borderTop: "1px solid var(--border-color, #334155)",
        ...style,
      }}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
};
