import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./Card";

interface RiskMeterProps {
  level: "Low" | "Moderate" | "High";
  score: number; // 0 to 100
  factor?: string;
  className?: string;
}

export function RiskMeter({ level, score, factor, className = "" }: RiskMeterProps) {
  const getLevelConfig = () => {
    switch (level) {
      case "Low":
        return {
          textColor: "text-emerald-700",
          bgColor: "bg-emerald-50",
          borderColor: "border-emerald-200",
          barColor: "bg-emerald-500",
          desc: "Contained downside risk with stable asset allocation",
        };
      case "Moderate":
        return {
          textColor: "text-amber-700",
          bgColor: "bg-amber-50",
          borderColor: "border-amber-200",
          barColor: "bg-amber-500",
          desc: "Standard market equity volatility with normal tail dispersion",
        };
      case "High":
      default:
        return {
          textColor: "text-rose-700",
          bgColor: "bg-rose-50",
          borderColor: "border-rose-200",
          barColor: "bg-rose-500",
          desc: "Significant downside variance or pronounced drawdown risk",
        };
    }
  };

  const config = getLevelConfig();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Portfolio Risk Meter</CardTitle>
        <span
          className={`text-xs font-bold px-2.5 py-1 rounded-md border ${config.bgColor} ${config.textColor} ${config.borderColor}`}
        >
          {level.toUpperCase()} RISK
        </span>
      </CardHeader>
      <CardContent className="p-5">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-2xl font-bold text-slate-900 tabular-nums">
            {score.toFixed(1)}
            <span className="text-sm font-normal text-slate-400"> / 100</span>
          </span>
          <span className="text-xs font-medium text-slate-500">Composite Risk Index</span>
        </div>

        {/* 3-segment composite meter bar */}
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex gap-0.5">
          <div
            className={`h-full transition-all duration-500 ${
              score <= 40 ? config.barColor : "bg-emerald-300"
            }`}
            style={{ width: "35%" }}
            title="Low Risk Zone (0-40)"
          />
          <div
            className={`h-full transition-all duration-500 ${
              score > 40 && score <= 70 ? config.barColor : "bg-amber-200"
            }`}
            style={{ width: "35%" }}
            title="Moderate Risk Zone (40-70)"
          />
          <div
            className={`h-full transition-all duration-500 ${
              score > 70 ? config.barColor : "bg-rose-200"
            }`}
            style={{ width: "30%" }}
            title="High Risk Zone (70-100)"
          />
        </div>

        <div className="flex justify-between text-[10px] text-slate-400 mt-1.5 font-medium uppercase tracking-wider">
          <span>Low (0-40)</span>
          <span>Moderate (40-70)</span>
          <span>High (70-100)</span>
        </div>

        <p className="mt-3 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
          {factor || config.desc}
        </p>
      </CardContent>
    </Card>
  );
}
