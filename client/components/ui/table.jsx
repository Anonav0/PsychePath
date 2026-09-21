"use client";

import React from "react";
import { cn } from "../../lib/utils";

const Table = React.forwardRef(({ className, style = {}, ...props }, ref) => (
  <div style={{ width: "100%", overflowX: "auto" }}>
    <table
      ref={ref}
      className={cn(
        "w-full caption-bottom text-sm border-collapse text-left",
        className,
      )}
      style={{
        width: "100%",
        borderCollapse: "collapse",
        textAlign: "left",
        fontSize: "0.875rem",
        ...style,
      }}
      {...props}
    />
  </div>
));
Table.displayName = "Table";

const TableHeader = React.forwardRef(
  ({ className, style = {}, ...props }, ref) => (
    <thead
      ref={ref}
      className={cn("[&_tr]:border-b bg-slate-900/60", className)}
      style={{
        background: "rgba(255, 255, 255, 0.03)",
        borderBottom: "1px solid var(--border-color, #334155)",
        ...style,
      }}
      {...props}
    />
  ),
);
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef(
  ({ className, style = {}, ...props }, ref) => (
    <tbody
      ref={ref}
      className={cn("[&_tr:last-child]:border-0", className)}
      style={{ ...style }}
      {...props}
    />
  ),
);
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef(
  ({ className, style = {}, ...props }, ref) => (
    <tfoot
      ref={ref}
      className={cn(
        "border-t bg-slate-900/50 font-medium [&>tr]:last:border-b-0",
        className,
      )}
      style={{ borderTop: "1px solid var(--border-color, #334155)", ...style }}
      {...props}
    />
  ),
);
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef(
  ({ className, style = {}, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        "border-b border-slate-800 transition-colors hover:bg-slate-800/40",
        className,
      )}
      style={{
        borderBottom: "1px solid var(--border-color, #334155)",
        transition: "background 0.15s ease",
        ...style,
      }}
      {...props}
    />
  ),
);
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef(
  ({ className, style = {}, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "h-10 px-4 text-left align-middle font-semibold text-slate-400 text-xs uppercase tracking-wider",
        className,
      )}
      style={{
        padding: "0.75rem 1rem",
        fontSize: "0.75rem",
        fontWeight: 600,
        color: "var(--text-muted, #64748b)",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        ...style,
      }}
      {...props}
    />
  ),
);
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef(
  ({ className, style = {}, ...props }, ref) => (
    <td
      ref={ref}
      className={cn(
        "p-4 align-middle [&:has([role=checkbox])]:pr-0",
        className,
      )}
      style={{
        padding: "0.85rem 1rem",
        color: "var(--text-primary, #f8fafc)",
        ...style,
      }}
      {...props}
    />
  ),
);
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef(
  ({ className, style = {}, ...props }, ref) => (
    <caption
      ref={ref}
      className={cn("mt-4 text-sm text-slate-400", className)}
      style={{
        margin: "0.75rem 0",
        color: "var(--text-muted, #64748b)",
        fontSize: "0.8rem",
        ...style,
      }}
      {...props}
    />
  ),
);
TableCaption.displayName = "TableCaption";

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
