import React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "danger" | "warning" | "outline" | "neutral";
  size?: "sm" | "md";
}

export function Badge({
  children,
  variant = "default",
  size = "sm",
  className = "",
  ...props
}: BadgeProps) {
  const base = "inline-flex items-center font-medium rounded-full border transition-colors";

  const variants = {
    default: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    success: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    danger: "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    warning: "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    outline: "bg-transparent text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700",
    neutral: "bg-slate-800 dark:bg-slate-700 text-slate-100 border-slate-700 dark:border-slate-600",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
  };

  return (
    <span className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </span>
  );
}
