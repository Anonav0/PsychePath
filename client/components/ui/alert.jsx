import React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";

const alertVariants = cva(
  "relative w-full rounded-xl border p-4 text-sm [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4",
  {
    variants: {
      variant: {
        default: "bg-white text-foreground border-border",
        destructive:
          "border-red-200 text-red-800 [&>svg]:text-red-600 bg-red-50/90",
        success:
          "border-emerald-200 text-emerald-800 [&>svg]:text-emerald-600 bg-emerald-50/90",
        warning:
          "border-amber-200 text-amber-900 [&>svg]:text-amber-600 bg-amber-50/90",
        info: "border-indigo-200 text-indigo-900 [&>svg]:text-indigo-600 bg-indigo-50/90",
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
      className={cn("text-sm [&_p]:leading-relaxed", className)}
      {...props}
    />
  );
}
