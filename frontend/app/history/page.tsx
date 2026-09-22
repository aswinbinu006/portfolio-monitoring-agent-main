"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getHistory, getHistoryDetail, HistorySummary, HistoryDetail } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import AuthGuard from "@/components/AuthGuard";

function HistoryContent() {
  const [loading, setLoading] = useState(true);
  const [historyList, setHistoryList] = useState<HistorySummary[]>([]);
  const [selectedRun, setSelectedRun] = useState<HistoryDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getHistory(30);
        if (mounted) setHistoryList(data);
      } catch (err: any) {
        if (mounted) setError(err.message || "Failed to load agent history.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchHistory();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSelectRun = async (runId: number) => {
    setLoadingDetail(true);
    try {
      const detail = await getHistoryDetail(runId);
      setSelectedRun(detail);
    } catch (err: any) {
      alert("Failed to load historical run details: " + err.message);
    } finally {
      setLoadingDetail(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="h-8 w-64 bg-slate-200 animate-pulse rounded-md" />
        <TableSkeleton rows={6} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Persistent Agent Memory &amp; Audit Log
            </h1>
            <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 font-mono text-[11px]">
              SQLite Episodic Memory
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Every execution of the 7-agent LangGraph pipeline is persisted. Review past AI risk briefings,
            inspect market snapshots, and track how portfolio vulnerabilities evolve over time.
          </p>
        </div>

        <Link href="/portfolio">
          <Button variant="primary" size="sm">
            Run New Analysis &rarr;
          </Button>
        </Link>
      </div>

      {error && (
        <div className="p-3 text-xs rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}

      {historyList.length === 0 ? (
        <EmptyState
          title="No Historical Agent Runs"
          description="You have not executed any monitoring pipeline cycles yet. Upload a portfolio and launch the agents to record your first episodic run."
          actionText="Upload Portfolio"
          actionHref="/portfolio"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column: Historical Runs Table */}
          <div className="lg:col-span-1 space-y-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
              Archived Runs ({historyList.length})
            </h2>

            <div className="space-y-2.5 max-h-[75vh] overflow-y-auto pr-1">
              {historyList.map((run) => {
                const isSelected = selectedRun?.id === run.id;
                return (
                  <Card
                    key={run.id}
                    onClick={() => handleSelectRun(run.id)}
                    className={`cursor-pointer transition-all border text-left p-3.5 hover:border-blue-400 ${
                      isSelected
                        ? "border-blue-600 ring-2 ring-blue-500/10 bg-blue-50/20 dark:bg-blue-950/40"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1.5 font-mono">
                      <span className="font-bold text-slate-900 dark:text-slate-100">Run #{run.id}</span>
                      <span className="text-slate-400 text-[10px]">
                        {new Date(run.created_at).toLocaleDateString()} {new Date(run.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {run.mandate}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                        Vol: {run.volatility ? `${(run.volatility * 100).toFixed(1)}%` : "N/A"}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {run.briefing_snippet}
                    </p>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Right Column: Full Detail Inspector */}
          <div className="lg:col-span-2">
            {selectedRun ? (
              <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                <CardHeader className="bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold bg-blue-600 text-white px-2 py-0.5 rounded">
                          Run #{selectedRun.id}
                        </span>
                        <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                          Historical AI Briefing Memo
                        </CardTitle>
                      </div>
                      <span className="text-xs text-slate-400 mt-1 block font-mono">
                        Recorded: {new Date(selectedRun.created_at).toLocaleString()} • Mandate: {selectedRun.mandate}
                      </span>
                    </div>
                    <Badge variant="outline" className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
                      {selectedRun.orchestrator_engine}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                  {/* Briefing Memo Content */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Writer Agent Executive Synthesis
                    </h3>
                    <div className="p-4 rounded-lg bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                      {selectedRun.briefing}
                    </div>
                  </div>

                  {/* Quantitative Evidence Snapshot */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Quantitative State Snapshot
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                        <div className="text-[10px] text-slate-400">Annual Volatility</div>
                        <div className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">
                          {selectedRun.risk_metrics?.annualized_volatility
                            ? `${(selectedRun.risk_metrics.annualized_volatility * 100).toFixed(1)}%`
                            : "N/A"}
                        </div>
                      </div>
                      <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                        <div className="text-[10px] text-slate-400">Max Drawdown</div>
                        <div className="text-sm font-bold font-mono text-rose-600 dark:text-rose-400">
                          {selectedRun.risk_metrics?.max_drawdown
                            ? `${(selectedRun.risk_metrics.max_drawdown * 100).toFixed(1)}%`
                            : "N/A"}
                        </div>
                      </div>
                      <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                        <div className="text-[10px] text-slate-400">95% Historical VaR</div>
                        <div className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">
                          {selectedRun.risk_metrics?.historical_var_95
                            ? `${(selectedRun.risk_metrics.historical_var_95 * 100).toFixed(1)}%`
                            : "N/A"}
                        </div>
                      </div>
                      <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                        <div className="text-[10px] text-slate-400">Flagged Anomalies</div>
                        <div className="text-sm font-bold font-mono text-amber-600 dark:text-amber-400">
                          {selectedRun.alerts?.length || 0}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Portfolio Holdings at time of run */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Portfolio Holdings ({selectedRun.portfolio_snapshot?.length || 0})
                    </h3>
                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[10px]">
                          <tr>
                            <th className="px-4 py-2">Symbol</th>
                            <th className="px-4 py-2">Sector</th>
                            <th className="px-4 py-2 text-right">Quantity</th>
                            <th className="px-4 py-2 text-right">Weight</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                          {selectedRun.portfolio_snapshot?.map((p: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                              <td className="px-4 py-2 font-bold text-slate-900 dark:text-slate-100">{p.symbol}</td>
                              <td className="px-4 py-2 text-slate-500 dark:text-slate-400 font-sans">{p.sector || "General"}</td>
                              <td className="px-4 py-2 text-right text-slate-700 dark:text-slate-300">{p.quantity}</td>
                              <td className="px-4 py-2 text-right font-bold text-slate-900 dark:text-slate-100">
                                {p.weight ? `${(p.weight * 100).toFixed(1)}%` : "N/A"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-20 bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-xs">
                Select an archived agent run on the left to inspect its historical AI briefing memo and quantitative evidence.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  return (
    <AuthGuard>
      <HistoryContent />
    </AuthGuard>
  );
}
