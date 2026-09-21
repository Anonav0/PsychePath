"use client";

import React, { createContext, useContext } from "react";
import { cn } from "../../lib/utils";

const TabsContext = createContext({
  value: "",
  onValueChange: () => {},
});

function Tabs({
  value,
  onValueChange,
  children,
  className,
  style = {},
  ...props
}) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div
        className={cn("flex flex-col gap-4", className)}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
}

function TabsList({ className, style = {}, ...props }) {
  return (
    <div
      className={cn(
        "inline-flex h-10 items-center justify-start rounded-lg bg-slate-900 p-1 text-slate-400 border border-slate-800",
        className,
      )}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.25rem",
        background: "rgba(0, 0, 0, 0.3)",
        padding: "0.25rem",
        borderRadius: "8px",
        border: "1px solid var(--border-color, #334155)",
        width: "fit-content",
        ...style,
      }}
      {...props}
    />
  );
}

function TabsTrigger({ value, children, className, style = {}, ...props }) {
  const context = useContext(TabsContext);
  const isActive = context.value === value;

  return (
    <button
      type="button"
      onClick={() => context.onValueChange && context.onValueChange(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all select-none",
        isActive
          ? "bg-indigo-600 text-white shadow-sm font-semibold"
          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50",
        className,
      )}
      style={{
        padding: "0.35rem 0.85rem",
        borderRadius: "6px",
        fontSize: "0.85rem",
        fontWeight: isActive ? 700 : 500,
        background: isActive ? "var(--primary, #6366f1)" : "transparent",
        color: isActive ? "#ffffff" : "var(--text-secondary, #94a3b8)",
        border: "none",
        cursor: "pointer",
        transition: "all 0.15s ease",
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}

function TabsContent({ value, children, className, style = {}, ...props }) {
  const context = useContext(TabsContext);
  if (context.value !== value) return null;

  return (
    <div
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2",
        className,
      )}
      style={{ marginTop: "0.5rem", ...style }}
      {...props}
    >
      {children}
    </div>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
