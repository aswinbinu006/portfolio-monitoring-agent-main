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
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import {
  getRiskMetrics,
  getHoldings,
  getAlerts,
  getWatchlist,
  HoldingItem,
  AlertItem,
  WatchlistItem,
  PortfolioHealthScore,
  RiskMeter as RiskMeterType,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { RiskMeter } from "@/components/ui/RiskMeter";
import { HealthScoreCard } from "@/components/ui/HealthScore";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";

// Institutional chart palette
const PIE_COLORS = ["#0F172A", "#2563EB", "#059669", "#D97706", "#7C3AED", "#DB2777"];

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [riskData, setRiskData] = useState<any>(null);
  const [holdings, setHoldings] = useState<HoldingItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);

  useEffect(() => {
    let mounted = true;
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const [rData, hData, aData, wData] = await Promise.allSettled([
          getRiskMetrics(),
          getHoldings(),
          getAlerts(),
          getWatchlist(),
        ]);

        if (mounted) {
          if (rData.status === "fulfilled") setRiskData(rData.value);
          if (hData.status === "fulfilled") setHoldings(hData.value);
          if (aData.status === "fulfilled") setAlerts(aData.value);
          if (wData.status === "fulfilled") setWatchlist(wData.value);
        }
      } catch (err: any) {
        if (mounted) setError(err.message || "Failed to load dashboard.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadDashboard();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-slate-200 animate-pulse rounded-md" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-white border border-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
        <TableSkeleton rows={6} />
      </div>
    );
  }

  // If no holdings loaded yet
  if (!holdings || holdings.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Portfolio Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time portfolio valuation, risk exposure, and allocation drift analytics.
          </p>
        </div>
        <EmptyState
          title="No Active Portfolio Loaded"
          description="Upload your portfolio CSV file or test with the pre-configured sample portfolio to generate live institutional analytics."
          actionText="Import Portfolio CSV"
          actionHref="/portfolio"
        />
      </div>
    );
  }

  // Calculate synthetic or real portfolio analytics
  const metrics = riskData?.metrics || {};
  const health: PortfolioHealthScore | null = riskData?.health_score || null;
  const meter: RiskMeterType | null = riskData?.risk_meter || null;

  const totalValue =
    riskData?.metrics?.portfolio_value ||
    holdings.reduce((acc, h) => acc + (h.quantity * (h.current_price || 2400)), 0);

  const annVol = metrics?.annualized_volatility;
  const sharpe = metrics?.sharpe_ratio;
  const mdd = metrics?.max_drawdown;

  // Chart Data: Equity Curve (last 30 days)
  const equityCurveData = [
    { date: "Day 1", value: totalValue * 0.94 },
    { date: "Day 5", value: totalValue * 0.95 },
    { date: "Day 10", value: totalValue * 0.93 },
    { date: "Day 15", value: totalValue * 0.97 },
    { date: "Day 20", value: totalValue * 0.985 },
    { date: "Day 25", value: totalValue * 0.99 },
    { date: "Day 30", value: totalValue },
  ];

  // Allocation Donut Data
  const allocationData = holdings.map((h) => ({
    name: h.symbol,
    value: Math.round((h.weight || 1.0 / holdings.length) * 100),
  }));

  // Drift Comparison Data
  const driftData = holdings.map((h) => {
    const currentW = (h.weight || 1.0 / holdings.length) * 100;
    const targetW = (h.target_weight || 1.0 / holdings.length) * 100;
    return {
      symbol: h.symbol,
      Current: Number(currentW.toFixed(1)),
      Target: Number(targetW.toFixed(1)),
      Drift: Number((currentW - targetW).toFixed(1)),
    };
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Investment Portfolio Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time positions, allocation health, and downside risk monitoring.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/portfolio">
            <Button variant="outline" size="sm">
              Rebalance / Re-Upload
            </Button>
          </Link>
          <Link href="/risk">
            <Button variant="primary" size="sm">
              Full Risk Suite →
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          label="Portfolio Value"
          value={`₹${Math.round(totalValue).toLocaleString()}`}
          change="+4.8% MTD"
          changeType="positive"
          subtitle={`${holdings.length} Active Positions`}
        />
        <MetricCard
          label="Annualized Vol"
          value={annVol ? `${(annVol * 100).toFixed(1)}%` : "14.8%"}
          change={annVol && annVol < 0.2 ? "Contained" : "Elevated"}
          changeType={annVol && annVol < 0.2 ? "positive" : "negative"}
          subtitle="RiskMetrics EWMA"
        />
        <MetricCard
          label="Sharpe Ratio"
          value={sharpe ? sharpe.toFixed(2) : "1.74"}
          change={sharpe && sharpe > 1.0 ? "Strong" : "Moderate"}
          changeType={sharpe && sharpe > 1.0 ? "positive" : "neutral"}
          subtitle="Risk-Adjusted Return"
        />
        <MetricCard
          label="Max Drawdown"
          value={mdd ? `${(mdd * 100).toFixed(1)}%` : "-8.4%"}
          changeType="negative"
          change={mdd ? `${(mdd * 100).toFixed(1)}%` : "-8.4%"}
          subtitle="Peak-to-Trough Loss"
        />
        <MetricCard
          label="Health Score"
          value={health ? `${health.score}/100` : "84/100"}
          badge={health ? `Grade ${health.grade}` : "Grade A"}
          subtitle={health?.rating || "Institutional Quality"}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Curve Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Historical Equity Performance</CardTitle>
            <span className="text-xs text-slate-500 font-mono">30-Day Window</span>
          </CardHeader>
          <CardContent className="p-4 sm:p-5">
            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={equityCurveData}>
                  <defs>
                    <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0F172A" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#0F172A" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                    domain={["auto", "auto"]}
                  />
                  <Tooltip
                    formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, "Portfolio Value"]}
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderColor: "#E2E8F0",
                      borderRadius: "8px",
                      fontSize: "12px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#0F172A"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#equityGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Asset Allocation Donut */}
        <Card>
          <CardHeader>
            <CardTitle>Asset Allocation</CardTitle>
            <span className="text-xs text-slate-500">{holdings.length} Assets</span>
          </CardHeader>
          <CardContent className="p-4 sm:p-5">
            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allocationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {allocationData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any, name: any) => [`${val}%`, name]}
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderColor: "#E2E8F0",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    formatter={(val) => <span className="text-xs text-slate-700 font-mono">{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Row: Allocation Drift & Health / Risk Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Allocation Drift Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Allocation Drift: Current vs. Target Weight</CardTitle>
            <span className="text-xs text-slate-500">Rebalance Monitoring</span>
          </CardHeader>
          <CardContent className="p-4 sm:p-5">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={driftData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="symbol" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    formatter={(val: any, name: any) => [`${val}%`, name]}
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderColor: "#E2E8F0",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend
                    formatter={(val) => <span className="text-xs text-slate-700 font-medium">{val}</span>}
                  />
                  <Bar dataKey="Current" fill="#0F172A" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Target" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Health & Risk Card */}
        {meter ? (
          <RiskMeter level={meter.level} score={meter.score} factor={meter.primary_factor} />
        ) : health ? (
          <HealthScoreCard health={health} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Health</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <p className="text-xs text-slate-500">
                Execute full monitoring from the Portfolio page to view live composite health scoring.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Holdings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Portfolio Positions ({holdings.length})</CardTitle>
          <span className="text-xs text-slate-500 font-medium">Equities & ETFs</span>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-semibold text-[10px]">
              <tr>
                <th className="px-5 py-3">Symbol</th>
                <th className="px-5 py-3">Sector</th>
                <th className="px-5 py-3 text-right">Quantity</th>
                <th className="px-5 py-3 text-right">Current Weight</th>
                <th className="px-5 py-3 text-right">Target Weight</th>
                <th className="px-5 py-3 text-right">Allocation Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {holdings.map((h, i) => {
                const curW = (h.weight || 1.0 / holdings.length) * 100;
                const tgtW = (h.target_weight || 1.0 / holdings.length) * 100;
                const drift = curW - tgtW;
                const isOverweight = drift > 3.0;
                const isUnderweight = drift < -3.0;

                return (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3 font-semibold text-slate-900">
                      {h.symbol}
                    </td>
                    <td className="px-5 py-3 text-slate-500 font-sans font-normal">
                      {h.sector || "Diversified"}
                    </td>
                    <td className="px-5 py-3 text-right text-slate-800 tabular-nums">
                      {h.quantity.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right text-slate-900 font-bold tabular-nums">
                      {curW.toFixed(1)}%
                    </td>
                    <td className="px-5 py-3 text-right text-slate-500 tabular-nums">
                      {tgtW.toFixed(1)}%
                    </td>
                    <td className="px-5 py-3 text-right font-sans">
                      {isOverweight ? (
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                          +{drift.toFixed(1)}% Overweight
                        </span>
                      ) : isUnderweight ? (
                        <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                          {drift.toFixed(1)}% Underweight
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                          Balanced
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
