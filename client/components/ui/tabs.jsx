"use client";

import React, { createContext, useContext } from "react";
import { cn } from "../../lib/utils";

const TabsContext = createContext({
  value: "",
  onValueChange: () => {},
});

function Tabs({ value, onValueChange, children, className, ...props }) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={cn("flex flex-col gap-4", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

function TabsList({ className, ...props }) {
  return (
    <div
      className={cn(
        "inline-flex h-9 items-center justify-start rounded-lg bg-slate-100 p-1 text-slate-500 border border-border/80 w-fit",
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({ value, children, className, ...props }) {
  const context = useContext(TabsContext);
  const isActive = context.value === value;

  return (
    <button
      type="button"
      onClick={() => context.onValueChange && context.onValueChange(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs sm:text-sm font-medium transition-all select-none cursor-pointer",
        isActive
          ? "bg-white text-foreground shadow-sm font-semibold"
          : "text-muted-foreground hover:text-foreground hover:bg-white/50",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function TabsContent({ value, children, className, ...props }) {
  const context = useContext(TabsContext);
  if (context.value !== value) return null;

  return (
    <div
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
