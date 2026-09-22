import React from "react";
import { Card, CardContent } from "./Card";

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: string | number;
  changeType?: "positive" | "negative" | "neutral";
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: string;
  className?: string;
}

export function MetricCard({
  label,
  value,
  change,
  changeType = "neutral",
  subtitle,
  icon,
  badge,
  className = "",
}: MetricCardProps) {
  const isPositive = changeType === "positive";
  const isNegative = changeType === "negative";

  return (
    <Card className={`hover:border-slate-300 transition-colors ${className}`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between text-xs text-slate-500 uppercase tracking-wider font-semibold">
          <span>{label}</span>
          {icon && <div className="text-slate-400">{icon}</div>}
          {badge && (
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-medium border border-slate-200">
              {badge}
            </span>
          )}
        </div>

        <div className="mt-2 flex items-baseline justify-between gap-2">
          <div className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
            {value}
          </div>

          {change !== undefined && (
            <span
              className={`inline-flex items-center text-xs font-semibold px-1.5 py-0.5 rounded tabular-nums ${
                isPositive
                  ? "text-emerald-700 bg-emerald-50 border border-emerald-200/80"
                  : isNegative
                  ? "text-rose-700 bg-rose-50 border border-rose-200/80"
                  : "text-slate-600 bg-slate-100"
              }`}
            >
              {isPositive ? "▲" : isNegative ? "▼" : ""} {change}
            </span>
          )}
        </div>

        {subtitle && (
          <p className="mt-1 text-xs text-slate-500 truncate">
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
