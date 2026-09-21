"use client";

import React from "react";
import { useToast } from "./use-toast";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import {
  X,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
} from "lucide-react";

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-3 overflow-hidden rounded-xl border p-4 pr-7 shadow-lg transition-all duration-300 animate-in slide-in-from-top-full md:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border-border bg-card text-card-foreground",
        destructive:
          "destructive group border-destructive/50 bg-destructive/10 text-destructive dark:border-destructive",
        success:
          "border-emerald-500/50 bg-emerald-50/95 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-100",
        warning:
          "border-amber-500/50 bg-amber-50/95 dark:bg-amber-950/60 text-amber-900 dark:text-amber-100",
        info: "border-sky-500/50 bg-sky-50/95 dark:bg-sky-950/60 text-sky-900 dark:text-sky-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function ToastIcon({ variant }) {
  switch (variant) {
    case "destructive":
      return (
        <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
      );
    case "success":
      return (
        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
      );
    case "warning":
      return (
        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
      );
    case "info":
      return (
        <Info className="h-5 w-5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
      );
    default:
      return null;
  }
}

export function Toaster() {
  const { toasts, dismiss } = useToast();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      aria-live="assertive"
      className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px] pointer-events-none gap-2"
    >
      {toasts.map((toast) => {
        if (!toast.open) return null;
        return (
          <div
            key={toast.id}
            className={cn(
              toastVariants({ variant: toast.variant }),
              toast.className,
            )}
          >
            <div className="flex items-start gap-3 w-full">
              <ToastIcon variant={toast.variant} />
              <div className="grid gap-1 flex-1">
                {toast.title && (
                  <div className="text-sm font-semibold tracking-tight leading-none">
                    {toast.title}
                  </div>
                )}
                {toast.description && (
                  <div className="text-xs opacity-90 leading-relaxed">
                    {toast.description}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => dismiss(toast.id)}
              className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-70 transition-opacity hover:opacity-100 hover:bg-muted focus:outline-none"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
