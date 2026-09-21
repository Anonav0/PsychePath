import React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";

const alertVariants = cva(
  "relative w-full rounded-xl border p-4 text-sm [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground border-border",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive bg-destructive/10",
        success:
          "border-emerald-500/40 text-emerald-700 dark:text-emerald-400 [&>svg]:text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20",
        warning:
          "border-amber-500/40 text-amber-800 dark:text-amber-300 [&>svg]:text-amber-600 bg-amber-50 dark:bg-amber-950/20",
        info: "border-sky-500/40 text-sky-800 dark:text-sky-300 [&>svg]:text-sky-600 bg-sky-50 dark:bg-sky-950/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export function Alert({ className, variant = "default", children, ...props }) {
  const getIcon = () => {
    switch (variant) {
      case "destructive":
        return <AlertCircle className="h-4 w-4" />;
      case "success":
        return <CheckCircle2 className="h-4 w-4" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4" />;
      case "info":
        return <Info className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      {getIcon()}
      <div>{children}</div>
    </div>
  );
}

export function AlertTitle({ className, ...props }) {
  return (
    <h5
      className={cn(
        "mb-1 font-semibold leading-none tracking-tight",
        className,
      )}
      {...props}
    />
  );
}

export function AlertDescription({ className, ...props }) {
  return (
    <div
      className={cn("text-sm [&_p]:leading-relaxed opacity-90", className)}
      {...props}
    />
  );
}
