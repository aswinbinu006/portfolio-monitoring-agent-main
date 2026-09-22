import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./Card";
import { PortfolioHealthScore } from "@/lib/api";

interface HealthScoreCardProps {
  health: PortfolioHealthScore;
  className?: string;
}

export function HealthScoreCard({ health, className = "" }: HealthScoreCardProps) {
  const getGradeBadge = (grade: string) => {
    if (grade.startsWith("A")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (grade === "B") return "bg-blue-50 text-blue-700 border-blue-200";
    if (grade === "C") return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-rose-50 text-rose-700 border-rose-200";
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Portfolio Health Score</CardTitle>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getGradeBadge(
              health.grade
            )}`}
          >
            GRADE {health.grade}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="text-4xl font-black text-slate-900 tabular-nums">
              {health.score}
              <span className="text-lg font-normal text-slate-400"> / 100</span>
            </div>
            <div className="text-xs font-semibold text-slate-700 mt-0.5">
              {health.rating}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
              Evaluation
            </span>
            <span className="text-xs font-medium text-slate-600">
              Institutional Baseline
            </span>
          </div>
        </div>

        {/* Sub-Score Bars */}
        <div className="mt-4 space-y-3">
          <ScoreBar
            label="Diversification"
            score={health.diversification_score}
            weight="30%"
          />
          <ScoreBar
            label="Volatility Control"
            score={health.volatility_score}
            weight="25%"
          />
          <ScoreBar
            label="Drawdown Resilience"
            score={health.drawdown_score}
            weight="25%"
          />
          <ScoreBar
            label="Concentration Balance"
            score={health.concentration_score}
            weight="20%"
          />
        </div>

        {/* Strengths & Vulnerabilities */}
        {(health.key_strengths.length > 0 || health.key_vulnerabilities.length > 0) && (
          <div className="mt-4 pt-4 border-t border-slate-100 text-xs space-y-2">
            {health.key_strengths.slice(0, 2).map((str, idx) => (
              <div key={idx} className="flex items-start gap-1.5 text-emerald-800">
                <span className="text-emerald-500 font-bold shrink-0">✓</span>
                <span>{str}</span>
              </div>
            ))}
            {health.key_vulnerabilities.slice(0, 2).map((vul, idx) => (
              <div key={idx} className="flex items-start gap-1.5 text-amber-800">
                <span className="text-amber-500 font-bold shrink-0">⚠</span>
                <span>{vul}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ScoreBar({
  label,
  score,
  weight,
}: {
  label: string;
  score: number;
  weight: string;
}) {
  const getBarColor = (val: number) => {
    if (val >= 80) return "bg-emerald-500";
    if (val >= 60) return "bg-blue-500";
    if (val >= 40) return "bg-amber-500";
    return "bg-rose-500";
  };

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-600 font-medium">
          {label} <span className="text-[10px] text-slate-400 font-normal">({weight})</span>
        </span>
        <span className="font-semibold text-slate-800 tabular-nums">
          {score.toFixed(0)}%
        </span>
      </div>
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getBarColor(
            score
          )}`}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
    </div>
  );
}
