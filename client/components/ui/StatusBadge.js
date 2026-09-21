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
 * Polished with clean light-mode SaaS tokens and Lucide icons
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
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          Icon: Check,
          label: "Completed",
        };
      case "IN_PROGRESS":
        return {
          bg: "bg-indigo-50 text-indigo-700 border-indigo-200",
          Icon: Play,
          label: "In Progress",
        };
      case "SKIPPED":
        return {
          bg: "bg-amber-50 text-amber-800 border-amber-200",
          Icon: FastForward,
          label: "Skipped",
        };
      case "ACTIVE":
        return {
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          Icon: CircleDot,
          label: "Active",
        };
      case "ARCHIVED":
        return {
          bg: "bg-slate-100 text-slate-600 border-slate-200",
          Icon: Archive,
          label: "Archived",
        };
      case "ADMIN":
        return {
          bg: "bg-purple-50 text-purple-700 border-purple-200",
          Icon: Shield,
          label: "Admin",
        };
      case "STUDENT":
        return {
          bg: "bg-blue-50 text-blue-700 border-blue-200",
          Icon: Sparkles,
          label: "Student",
        };
      case "NOT_STARTED":
      default:
        return {
          bg: "bg-slate-100 text-slate-600 border-slate-200",
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
