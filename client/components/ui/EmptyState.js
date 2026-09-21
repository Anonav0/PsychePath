"use client";

import React from "react";
import Link from "next/link";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { Inbox } from "lucide-react";

/**
 * Standardized Empty State Component
 * Upgraded with shadcn tokens and Button component
 */
export default function EmptyState({
  icon: IconOrEmoji = Inbox,
  title = "No items found",
  description = "Get started by taking the first step.",
  actionText = null,
  actionHref = null,
  onAction = null,
  className = "",
  style = {},
}) {
  const isComponent =
    typeof IconOrEmoji === "function" ||
    (typeof IconOrEmoji === "object" && IconOrEmoji !== null);

  return (
    <div
      className={cn(
        "text-center py-12 px-6 bg-card border rounded-2xl my-6 flex flex-col items-center justify-center shadow-sm",
        className,
      )}
      style={style}
    >
      <div className="mb-4 text-muted-foreground flex items-center justify-center p-4 bg-muted/40 rounded-full">
        {isComponent ? (
          React.createElement(IconOrEmoji, {
            className: "h-8 w-8 text-primary",
          })
        ) : (
          <span className="text-3xl leading-none">{IconOrEmoji}</span>
        )}
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-1.5 tracking-tight">
        {title}
      </h3>

      <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6 leading-relaxed">
        {description}
      </p>

      {actionText && actionHref && (
        <Link href={actionHref}>
          <Button variant="default" size="default">
            {actionText}
          </Button>
        </Link>
      )}

      {actionText && onAction && !actionHref && (
        <Button onClick={onAction} variant="default" size="default">
          {actionText}
        </Button>
      )}
    </div>
  );
}
