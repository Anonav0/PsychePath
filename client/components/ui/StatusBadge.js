"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  Check,
  Play,
  FastForward,
  CircleDot,
  Archive,
  Circle,
  Shield,
  Sparkles,
} from "lucide-react";

/**
 * Reusable Status Badge Component
 * Polished with shadcn design tokens and Lucide icons
 */
export default function StatusBadge({
  status = "NOT_STARTED",
  size = "normal",
  className = "",
}) {
  const getBadgeConfig = () => {
    switch (status) {
      case "COMPLETED":
        return {
          bg: "bg-emerald-500/10 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
          Icon: Check,
          label: "Completed",
        };
      case "IN_PROGRESS":
        return {
          bg: "bg-primary/10 text-primary border-primary/30",
          Icon: Play,
          label: "In Progress",
        };
      case "SKIPPED":
        return {
          bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
          Icon: FastForward,
          label: "Skipped",
        };
      case "ACTIVE":
        return {
          bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
          Icon: CircleDot,
          label: "Active",
        };
      case "ARCHIVED":
        return {
          bg: "bg-muted text-muted-foreground border-border",
          Icon: Archive,
          label: "Archived",
        };
      case "ADMIN":
        return {
          bg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
          Icon: Shield,
          label: "Admin",
        };
      case "STUDENT":
        return {
          bg: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30",
          Icon: Sparkles,
          label: "Student",
        };
      case "NOT_STARTED":
      default:
        return {
          bg: "bg-muted/60 text-muted-foreground border-border",
          Icon: Circle,
          label: "Not Started",
        };
    }
  };

  const { bg, Icon, label } = getBadgeConfig();
  const isSmall = size === "small";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-semibold uppercase tracking-wider rounded-full border transition-colors",
        isSmall ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1",
        bg,
        className,
      )}
    >
      <Icon className={cn("shrink-0", isSmall ? "h-2.5 w-2.5" : "h-3 w-3")} />
      <span>{label}</span>
    </span>
  );
}
