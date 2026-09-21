"use client";

import React, { useEffect, createContext, useContext } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

const SheetContext = createContext({
  open: false,
  setOpen: () => {},
});

export function Sheet({ open, onOpenChange, children }) {
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isOpen = isControlled ? open : internalOpen;
  const setOpen = (val) => {
    if (onOpenChange) onOpenChange(val);
    if (!isControlled) setInternalOpen(val);
  };

  return (
    <SheetContext.Provider value={{ open: isOpen, setOpen }}>
      {children}
    </SheetContext.Provider>
  );
}

export function SheetTrigger({ asChild, children, ...props }) {
  const { setOpen } = useContext(SheetContext);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: (e) => {
        children.props?.onClick?.(e);
        setOpen(true);
      },
      ...props,
    });
  }

  return (
    <button type="button" onClick={() => setOpen(true)} {...props}>
      {children}
    </button>
  );
}

export function SheetContent({
  side = "right",
  className,
  children,
  ...props
}) {
  const { open, setOpen } = useContext(SheetContext);

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

  const sideAnimations = {
    right:
      "right-0 top-0 bottom-0 animate-in slide-in-from-right duration-300 border-l",
    left: "left-0 top-0 bottom-0 animate-in slide-in-from-left duration-300 border-r",
    top: "top-0 left-0 right-0 animate-in slide-in-from-top duration-300 border-b",
    bottom:
      "bottom-0 left-0 right-0 animate-in slide-in-from-bottom duration-300 border-t",
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in-0"
      onClick={() => setOpen(false)}
    >
      <div
        className={cn(
          "fixed z-50 bg-card p-6 shadow-2xl transition ease-in-out max-h-screen overflow-y-auto flex flex-col",
          sideAnimations[side] || sideAnimations.right,
          className,
        )}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute right-4 top-4 rounded-md p-1.5 text-muted-foreground opacity-70 hover:opacity-100 hover:bg-muted focus:outline-none transition-all"
          aria-label="Close sheet"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  );
}

export function SheetHeader({ className, ...props }) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 text-left", className)}
      {...props}
    />
  );
}

export function SheetTitle({ className, ...props }) {
  return (
    <h3
      className={cn(
        "text-lg font-bold text-foreground leading-none tracking-tight",
        className,
      )}
      {...props}
    />
  );
}

export function SheetDescription({ className, ...props }) {
  return (
    <p className={cn("text-xs text-muted-foreground", className)} {...props} />
  );
}

export function SheetClose({ asChild, children, ...props }) {
  const { setOpen } = useContext(SheetContext);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: (e) => {
        children.props?.onClick?.(e);
        setOpen(false);
      },
      ...props,
    });
  }

  return (
    <button type="button" onClick={() => setOpen(false)} {...props}>
      {children}
    </button>
  );
}
