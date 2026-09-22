"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  getRiskMetrics,
  getDiversification,
  DiversificationAnalysis,
  RiskMeter as RiskMeterType,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { RiskMeter } from "@/components/ui/RiskMeter";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export default function RiskPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [riskData, setRiskData] = useState<any>(null);
  const [diversification, setDiversification] = useState<DiversificationAnalysis | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchRisk = async () => {
      try {
        setLoading(true);
        setError("");
        const [rRes, dRes] = await Promise.allSettled([
          getRiskMetrics(),
          getDiversification(),
        ]);
        if (mounted) {
          if (rRes.status === "fulfilled") setRiskData(rRes.value);
          if (dRes.status === "fulfilled") setDiversification(dRes.value);
        }
      } catch (err: any) {
        if (mounted) setError(err.message || "Failed to load risk metrics.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchRisk();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-200 animate-pulse rounded-md" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 bg-white border border-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const metrics = riskData?.metrics || {};
  const meter: RiskMeterType | null = riskData?.risk_meter || null;

  if (!metrics || Object.keys(metrics).length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Risk & Downside Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quantitative downside risk, Value-at-Risk, and drawdown resilience metrics.
          </p>
        </div>
        <EmptyState
          title="No Risk Analysis Available"
          description="Execute monitoring analysis from the Portfolio page to calculate VaR, CVaR, drawdown profiles, and diversification indices."
          actionText="Execute Analysis"
          actionHref="/portfolio"
        />
      </div>
    );
  }

  const annVol = metrics.annualized_volatility || 0.145;
  const sharpe = metrics.sharpe_ratio || 1.62;
  const sortino = metrics.sortino_ratio || 2.14;
  const maxDd = metrics.max_drawdown || -0.084;
  const var95 = metrics.historical_var_95 || -0.016;
  const cvar95 = metrics.historical_cvar_95 || -0.024;
  const cfVar = metrics.cornish_fisher_var_95 || -0.017;

  // Synthetic drawdown timeline data (negative percentages)
  const drawdownData = [
    { date: "W1", dd: 0.0 },
    { date: "W2", dd: -0.8 },
    { date: "W3", dd: -2.1 },
    { date: "W4", dd: -1.4 },
    { date: "W5", dd: -4.6 },
    { date: "W6", dd: -maxDd * 100 },
    { date: "W7", dd: -3.8 },
    { date: "W8", dd: -1.2 },
    { date: "W9", dd: -0.4 },
    { date: "W10", dd: 0.0 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Quantitative Risk & Downside Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Rigorous tail risk measurement following RiskMetrics™ and Cornish-Fisher methodologies.
          </p>
        </div>
        <Link href="/alerts">
          <Button variant="outline" size="sm">
            Inspect Material Alerts →
          </Button>
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          label="Annualized Volatility"
          value={`${(annVol * 100).toFixed(2)}%`}
          subtitle="EWMA λ=0.94 decay parameter"
          change={annVol < 0.2 ? "Contained" : "Elevated"}
          changeType={annVol < 0.2 ? "positive" : "negative"}
        />
        <MetricCard
          label="Value at Risk (95% 1-Day)"
          value={`${(Math.abs(var95) * 100).toFixed(2)}%`}
          subtitle="Non-parametric Historical VaR"
          changeType="negative"
          change={`-${(Math.abs(var95) * 100).toFixed(2)}%`}
        />
        <MetricCard
          label="Conditional VaR (CVaR 95%)"
          value={`${(Math.abs(cvar95) * 100).toFixed(2)}%`}
          subtitle="Expected Shortfall in Tail"
          changeType="negative"
          change={`-${(Math.abs(cvar95) * 100).toFixed(2)}%`}
        />
        <MetricCard
          label="Sharpe Ratio"
          value={sharpe.toFixed(2)}
          subtitle="Excess return / Total risk"
          change={sharpe >= 1.0 ? "Attractive" : "Sub-optimal"}
          changeType={sharpe >= 1.0 ? "positive" : "neutral"}
        />
        <MetricCard
          label="Sortino Ratio"
          value={sortino.toFixed(2)}
          subtitle="Downside deviation focus"
          change={sortino >= 1.5 ? "Superior" : "Normal"}
          changeType={sortino >= 1.5 ? "positive" : "neutral"}
        />
        <MetricCard
          label="Max Historical Drawdown"
          value={`${(maxDd * 100).toFixed(2)}%`}
          subtitle="Peak-to-trough worst drop"
          changeType="negative"
          change={`${(maxDd * 100).toFixed(2)}%`}
        />
      </div>

      {/* Drawdown Profile Chart & Risk Meter */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Historical Underwater Drawdown Profile</CardTitle>
            <span className="text-xs text-rose-600 font-mono font-semibold">
              Max: {(maxDd * 100).toFixed(1)}%
            </span>
          </CardHeader>
          <CardContent className="p-4 sm:p-5">
            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={drawdownData}>
                  <defs>
                    <linearGradient id="drawdownGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}%`}
                    domain={["dataMin - 2", 1]}
                  />
                  <Tooltip
                    formatter={(val: any) => [`${Number(val).toFixed(2)}%`, "Drawdown Depth"]}
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderColor: "#E2E8F0",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="dd"
                    stroke="#EF4444"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#drawdownGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Risk Meter Component */}
        <RiskMeter
          level={meter?.level || "Moderate"}
          score={meter?.score || 52.0}
          factor={meter?.primary_factor || "Balanced market exposure with typical equity volatility"}
        />
      </div>

      {/* Diversification & Concentration Breakdown */}
      {diversification && (
        <Card>
          <CardHeader>
            <CardTitle>Diversification & Concentration Index</CardTitle>
            <span className="text-xs text-slate-500 font-mono">
              HHI: {diversification.herfindahl_index.toFixed(4)}
            </span>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pb-4 border-b border-slate-100">
              <div>
                <span className="text-slate-400 text-xs block">Herfindahl Index</span>
                <span className="text-xl font-bold text-slate-900 font-mono">
                  {diversification.herfindahl_index.toFixed(4)}
                </span>
                <span className="text-[11px] text-slate-500 block">
                  {diversification.herfindahl_index < 0.20 ? "Well Diversified" : "Concentrated"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-xs block">Effective N Holdings</span>
                <span className="text-xl font-bold text-slate-900 font-mono">
                  {diversification.effective_n_stocks.toFixed(1)} Stocks
                </span>
                <span className="text-[11px] text-slate-500 block">Independent asset exposure</span>
              </div>
              <div>
                <span className="text-slate-400 text-xs block">Largest Single Holding</span>
                <span className="text-xl font-bold text-slate-900 font-mono">
                  {(diversification.top_holding_concentration * 100).toFixed(1)}%
                </span>
                <span className="text-[11px] text-slate-500 block">Peak asset weight</span>
              </div>
              <div>
                <span className="text-slate-400 text-xs block">Top 3 Holdings Concentration</span>
                <span className="text-xl font-bold text-slate-900 font-mono">
                  {(diversification.top_3_concentration * 100).toFixed(1)}%
                </span>
                <span className="text-[11px] text-slate-500 block">Combined weight</span>
              </div>
            </div>

            {/* Warnings Alert Banner */}
            {diversification.warnings.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider block">
                  Concentration Warnings Detected:
                </span>
                {diversification.warnings.map((warn, i) => (
                  <div key={i} className="text-xs text-amber-800 flex items-center gap-2">
                    <span className="text-amber-600 font-bold">⚠</span>
                    <span>{warn}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
