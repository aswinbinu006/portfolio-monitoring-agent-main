"use client";

import React, { useState, useEffect } from "react";
import { getTrace } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";

const AGENT_STEPS = [
  { id: 1, name: "Market Agent", role: "Fetch historical market data & asset prices", status: "Executed" },
  { id: 2, name: "Risk Agent", role: "Compute EWMA variance, Sharpe, VaR & CVaR", status: "Executed" },
  { id: 3, name: "Anomaly Agent", role: "Deterministic z-score & Isolation Forest detection", status: "Executed" },
  { id: 4, name: "News Agent", role: "Search verified news citations & financial causality", status: "Executed" },
  { id: 5, name: "Rebalance Agent", role: "Check portfolio target drift & rebalance bounds", status: "Executed" },
  { id: 6, name: "ML Agent", role: "5-day volatility forecast via TimeSeriesSplit", status: "Executed" },
  { id: 7, name: "Writer Agent", role: "Synthesize Morningstar-format executive briefing", status: "Executed" },
];

export default function TracePage() {
  const [loading, setLoading] = useState(true);
  const [traceData, setTraceData] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");

  useEffect(() => {
    let mounted = true;
    const fetchTrace = async () => {
      try {
        setLoading(true);
        const data = await getTrace();
        if (mounted && data.status === "success" && data.trace) {
          setTraceData(data.trace);
        }
      } catch (err) {
        // quiet fallback
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchTrace();
    return () => {
      mounted = false;
    };
  }, []);

  const handleCopyTrace = () => {
    if (traceData) {
      navigator.clipboard.writeText(traceData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-slate-200 animate-pulse rounded-md" />
        <TableSkeleton rows={5} />
      </div>
    );
  }

  const filteredLines = traceData
    ? traceData
        .split("\n")
        .filter((line) => line.toLowerCase().includes(filterQuery.toLowerCase()))
        .join("\n")
    : "";

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Multi-Agent Execution Telemetry
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Step-by-step audit log of specialist agents, tool calls, and model reasoning.
          </p>
        </div>
        <Badge variant="neutral">Deterministic + LLM Engine</Badge>
      </div>

      {/* Agent Workflow Stepper */}
      <Card>
        <CardHeader>
          <CardTitle>Multi-Agent Execution Pipeline</CardTitle>
          <span className="text-xs text-slate-500">Sequential Coordination</span>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {AGENT_STEPS.map((step) => (
              <div
                key={step.id}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center">
                    {step.id}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                    {step.status}
                  </span>
                </div>
                <h4 className="font-bold text-xs text-slate-900">{step.name}</h4>
                <p className="text-[11px] text-slate-500 leading-tight">{step.role}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Execution Log Viewer */}
      {!traceData ? (
        <EmptyState
          title="No Execution Trace Recorded"
          description="Execute monitoring analysis from the Portfolio page to inspect agent telemetry and tool invocation timestamps."
          actionText="Run Monitoring"
          actionHref="/portfolio"
        />
      ) : (
        <Card>
          <CardHeader className="flex-col sm:flex-row gap-3 items-start sm:items-center">
            <CardTitle>Runtime Telemetry Log</CardTitle>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Filter logs..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900 w-full sm:w-48 font-mono"
              />
              <Button variant="outline" size="sm" onClick={handleCopyTrace}>
                {copied ? "Copied ✓" : "Copy Log"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <pre className="p-4 sm:p-5 bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto max-h-[500px] leading-relaxed select-text rounded-b-xl">
              {filteredLines || "No log lines matching filter."}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
