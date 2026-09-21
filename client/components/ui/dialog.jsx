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
      className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in-0"
      onClick={() => onOpenChange && onOpenChange(false)}
    >
      <div
        className="w-full max-w-lg bg-white border border-border rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function DialogHeader({ className, ...props }) {
  return <div className={cn("p-6 pb-2", className)} {...props} />;
}

function DialogTitle({ className, ...props }) {
  return (
    <h2
      className={cn(
        "text-xl font-bold text-foreground tracking-tight",
        className,
      )}
      {...props}
    />
  );
}

function DialogDescription({ className, ...props }) {
  return (
    <p
      className={cn(
        "text-sm text-muted-foreground mt-1 leading-relaxed",
        className,
      )}
      {...props}
    />
  );
}

function DialogContent({ className, ...props }) {
  return <div className={cn("p-6 overflow-y-auto", className)} {...props} />;
}

function DialogFooter({ className, ...props }) {
  return (
    <div
      className={cn(
        "p-6 pt-3 flex justify-end gap-2.5 border-t border-border bg-slate-50/50",
        className,
      )}
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
