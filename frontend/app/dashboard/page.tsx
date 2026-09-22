"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  getRiskMetrics,
  getHoldings,
  getAlerts,
  HoldingItem,
  AlertItem,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";

const PIPELINE_NODES = [
  { id: 1, name: "Market Agent", role: "Prices & Feeds" },
  { id: 2, name: "Risk Agent", role: "Drawdown & VaR" },
  { id: 3, name: "Anomaly Agent", role: "Z-Score Screening" },
  { id: 4, name: "News Agent", role: "Web Intelligence" },
  { id: 5, name: "Rebalance Agent", role: "Weight Drift" },
  { id: 6, name: "ML Agent", role: "Volatility Projection" },
  { id: 7, name: "Writer Agent", role: "LLM Synthesis", isLlM: true },
];

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [riskData, setRiskData] = useState<any>(null);
  const [holdings, setHoldings] = useState<HoldingItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [showTrace, setShowTrace] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const [rData, hData, aData] = await Promise.allSettled([
          getRiskMetrics(),
          getHoldings(),
          getAlerts(),
        ]);

        if (mounted) {
          if (rData.status === "fulfilled") setRiskData(rData.value);
          if (hData.status === "fulfilled") setHoldings(hData.value);
          if (aData.status === "fulfilled") setAlerts(aData.value);
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
      <div className="space-y-6 py-4">
        <div className="h-8 w-64 bg-slate-200 animate-pulse rounded-md" />
        <div className="h-40 bg-white border border-slate-200 rounded-xl animate-pulse" />
        <TableSkeleton rows={5} />
      </div>
    );
  }

  // If no holdings loaded yet
  if (!holdings || holdings.length === 0) {
    return (
      <div className="py-8">
        <EmptyState
          title="No Active Portfolio Loaded"
          description="Upload a portfolio CSV or load benchmark holdings to run the 7-agent LangGraph monitoring pipeline."
          actionText="Go to Portfolio Upload"
          actionHref="/portfolio"
        />
      </div>
    );
  }

  const metrics = riskData?.metrics || {};
  const briefing = riskData?.briefing;
  const trace = riskData?.trace;
  const orchestratorEngine = riskData?.orchestrator_engine || "LangGraph StateGraph";

  return (
    <div className="space-y-8 py-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Multi-Agent Monitoring Center
            </h1>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-mono text-[11px]">
              {orchestratorEngine}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Autonomous multi-agent surveillance active over {holdings.length} portfolio positions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/portfolio">
            <Button variant="outline" size="sm" className="text-xs font-semibold">
              Update Portfolio &amp; Mandate
            </Button>
          </Link>
        </div>
      </div>

      {/* 7-Agent LangGraph Stepper */}
      <Card className="border-slate-200 bg-white shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <CardTitle className="text-sm font-bold text-slate-900">
                LangGraph Pipeline State Machine
              </CardTitle>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              State: {riskData?.status === "success" ? "Graph Execution Completed" : "Ready / Pending Run"}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {PIPELINE_NODES.map((node, i) => (
              <div
                key={node.id}
                className={`p-3 rounded-lg border text-center relative flex flex-col justify-between ${
                  node.isLlM
                    ? "bg-blue-50/50 border-blue-300 ring-1 ring-blue-400/20"
                    : "bg-slate-50/80 border-slate-200"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-400 mb-1">
                    <span>N{node.id}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </div>
                  <div className="font-bold text-xs text-slate-900 leading-tight">
                    {node.name}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {node.role}
                  </div>
                </div>
                {node.isLlM && (
                  <span className="mt-2 text-[9px] font-black uppercase text-blue-700 bg-blue-100/70 py-0.5 rounded">
                    LLM Synthesis
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Grid: Centerpiece LLM Briefing & Core Risk Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Writer Agent LLM Synthesis Briefing */}
        <Card className="lg:col-span-2 border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/60 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-blue-600 text-white text-[10px] font-bold">
                  AI
                </span>
                <CardTitle className="text-base font-bold text-slate-900">
                  Writer Agent: Executive Monitoring Briefing
                </CardTitle>
              </div>
              <Badge variant="outline" className="text-slate-600 bg-white font-mono text-[11px]">
                Synthesized by LLM
              </Badge>
            </div>
            <CardDescription className="text-xs text-slate-500">
              Generated by the Writer Agent by synthesizing evidence from Market, Risk, Anomaly, News, Rebalance, and ML agents.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {briefing ? (
              <div className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed whitespace-pre-line text-slate-700">
                {briefing}
              </div>
            ) : (
              <div className="text-center py-10 space-y-3">
                <p className="text-xs text-slate-500">
                  No briefing generated yet. Run monitoring from the Portfolio page to invoke the LLM synthesis step.
                </p>
                <Link href="/portfolio">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs">
                    Launch Analysis Now
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Quantitative Evidence Considered by Agents */}
        <div className="space-y-6">
          <Card className="border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900">
                Quantitative Input Evidence
              </CardTitle>
              <CardDescription className="text-[11px] text-slate-500">
                Deterministic stats provided to Risk &amp; Writer agents
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Annualized Volatility</span>
                <span className="font-mono font-bold text-slate-900">
                  {metrics.annualized_volatility ? `${(metrics.annualized_volatility * 100).toFixed(1)}%` : "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Max Portfolio Drawdown</span>
                <span className="font-mono font-bold text-rose-600">
                  {metrics.max_drawdown ? `${(metrics.max_drawdown * 100).toFixed(1)}%` : "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">95% Historical VaR</span>
                <span className="font-mono font-bold text-slate-900">
                  {metrics.historical_var_95 ? `${(metrics.historical_var_95 * 100).toFixed(1)}%` : "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Total Return</span>
                <span className={`font-mono font-bold ${Number(metrics.total_return || 0) >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {metrics.total_return ? `${(metrics.total_return * 100).toFixed(1)}%` : "0.0%"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Flagged Anomaly Alerts */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-slate-900">
                  Flagged Anomalies ({alerts.length})
                </CardTitle>
                <span className="text-[10px] font-mono text-slate-400">Anomaly Agent</span>
              </div>
            </CardHeader>
            <CardContent className="p-4 text-xs space-y-3">
              {alerts.length === 0 ? (
                <p className="text-slate-500 text-[11px] italic">No active anomalies flagged.</p>
              ) : (
                alerts.slice(0, 3).map((a, idx) => (
                  <div key={idx} className="p-2.5 rounded bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between font-mono">
                      <span className="font-bold text-slate-900">{a.ticker}</span>
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-1 rounded font-bold">
                        {a.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">{a.description}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Holdings & Drift Section */}
      <Card className="border-slate-200">
        <CardHeader className="border-b border-slate-100 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Active Portfolio Holdings &amp; Rebalance Drift
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Monitored by Market Agent and Rebalance Agent
              </CardDescription>
            </div>
            <span className="text-xs font-mono text-slate-400">{holdings.length} Positions</span>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px]">
              <tr>
                <th className="px-5 py-3">Ticker Symbol</th>
                <th className="px-5 py-3">Sector</th>
                <th className="px-5 py-3 text-right">Quantity</th>
                <th className="px-5 py-3 text-right">Current Weight</th>
                <th className="px-5 py-3 text-right">Target Weight</th>
                <th className="px-5 py-3 text-right">Rebalance Drift</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {holdings.map((h, i) => {
                const curW = (h.weight || 1.0 / holdings.length) * 100;
                const tgtW = (h.target_weight || 1.0 / holdings.length) * 100;
                const drift = curW - tgtW;
                return (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3 font-bold text-slate-900">{h.symbol}</td>
                    <td className="px-5 py-3 text-slate-500 font-sans">{h.sector || "General"}</td>
                    <td className="px-5 py-3 text-right text-slate-800">{h.quantity.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right font-bold text-slate-900">{curW.toFixed(1)}%</td>
                    <td className="px-5 py-3 text-right text-slate-500">{tgtW.toFixed(1)}%</td>
                    <td className="px-5 py-3 text-right font-sans">
                      {Math.abs(drift) > 3.0 ? (
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {drift > 0 ? `+${drift.toFixed(1)}%` : `${drift.toFixed(1)}%`} Drift
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
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

      {/* Execution Trace Inspector (Collapsible for Evaluators) */}
      <Card className="border-slate-200">
        <CardHeader
          className="cursor-pointer hover:bg-slate-50/50 transition-colors"
          onClick={() => setShowTrace(!showTrace)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                Log
              </span>
              <CardTitle className="text-sm font-bold text-slate-900">
                LangGraph State Execution Trace
              </CardTitle>
            </div>
            <span className="text-xs text-blue-600 font-semibold">
              {showTrace ? "Hide State Log &uarr;" : "Show State Log &darr;"}
            </span>
          </div>
        </CardHeader>
        {showTrace && (
          <CardContent className="p-4 pt-0">
            <div className="bg-slate-950 text-slate-200 rounded-lg p-4 font-mono text-xs overflow-x-auto max-h-72">
              <pre className="whitespace-pre-wrap">{trace || "No execution trace recorded."}</pre>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
