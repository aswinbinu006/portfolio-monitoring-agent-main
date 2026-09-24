'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { PortfolioChart } from '@/components/dashboard/PortfolioChart';
import { AllocationChart } from '@/components/dashboard/AllocationChart';
import {
  TrendingUp,
  TrendingDown,
  Bot,
  Bell,
  ArrowRight,
  ShieldAlert,
  Compass,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { ComprehensivePortfolioStats } from '@/lib/math/stats';
import { Holding, Alert, PortfolioSnapshot } from '@/lib/supabase/mock-store';
import { formatCurrency, formatPercent, formatDate } from '@/lib/utils/formatters';

export default function DashboardPage() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [stats, setStats] = useState<ComprehensivePortfolioStats | null>(null);
  const [snapshots, setSnapshots] = useState<PortfolioSnapshot[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [holdingsRes, alertsRes] = await Promise.all([
          fetch('/api/holdings?portfolioId=port-demo-001'),
          fetch('/api/alerts'),
        ]);

        const holdingsData = await holdingsRes.json();
        const alertsData = await alertsRes.json();

        setHoldings(holdingsData.holdings || []);
        setStats(holdingsData.stats || null);
        setSnapshots(holdingsData.snapshots || []);
        setAlerts(alertsData.alerts?.slice(0, 3) || []);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  if (loading || !stats) {
    return (
      <AppShell title="Portfolio Dashboard">
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-500 font-mono">Loading portfolio analytics...</span>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Investment Portfolio Overview"
      subtitle="Quantitative monitoring, risk allocation, and model scenario tracking"
    >
      {/* 1. Summary Cards */}
      <SummaryCards stats={stats} />

      {/* 2. Primary Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PortfolioChart data={snapshots} />
        </div>
        <div>
          <AllocationChart sectors={stats.sectorExposures} totalValue={stats.totalValue} />
        </div>
      </div>

      {/* 3. AI Agent Insight Highlight Card */}
      <div className="financial-card p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 border-b border-slate-700/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-slate-700 flex items-center justify-center text-emerald-400">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                Autonomous AI Portfolio Analyst
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  REAL-TIME INSIGHT
                </span>
              </h3>
              <p className="text-[11px] text-slate-300">
                Continuous observation across 8 active holdings & macro indices
              </p>
            </div>
          </div>
          <Link
            href="/analyst"
            className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
          >
            <span>Ask Analyst Questions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="text-xs text-slate-200 leading-relaxed space-y-2">
          <p>
            <strong>Core Finding:</strong> Portfolio demonstrates strong positive capital appreciation (+{stats.unrealizedPLPercent.toFixed(1)}% unrealized return), driven primarily by semiconductor compute and healthcare infrastructure. However, Technology sector exposure stands at 54.2%, which exceeds conservative diversification bounds (HHI: {stats.riskMetrics.concentrationHHI}).
          </p>
          <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono pt-1">
            <span>• Primary Driver: NVDA & AAPL earnings growth</span>
            <span>• Volatility: {stats.riskMetrics.volatility || 24.5}%</span>
            <span>• Max Drawdown: {stats.riskMetrics.maxDrawdown || 12.4}%</span>
          </div>
        </div>
      </div>

      {/* 4. Bottom Grid: Top Contributors + Recent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top & Worst Holding Contributors */}
        <div className="financial-card p-5">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Performance Contributors</h3>
              <p className="text-xs text-slate-500">Leading gainers and lagers in current portfolio</p>
            </div>
            <Link href="/holdings" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              <span>All Holdings</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Top Gainers</div>
            {stats.topContributors.map(h => (
              <div key={h.symbol} className="flex items-center justify-between text-xs p-2 rounded bg-slate-50 border border-slate-100">
                <div>
                  <Link href={`/stocks/${h.symbol}`} className="font-bold text-slate-900 hover:text-blue-600 flex items-center gap-1">
                    <span className="font-mono">{h.symbol}</span>
                    <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                  </Link>
                  <div className="text-[11px] text-slate-500">{h.companyName}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-emerald-700">
                    +{h.unrealizedPLPercent.toFixed(1)}%
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">{formatCurrency(h.unrealizedPL)}</div>
                </div>
              </div>
            ))}

            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 pt-2">Lagging Positions</div>
            {stats.worstContributors.map(h => (
              <div key={h.symbol} className="flex items-center justify-between text-xs p-2 rounded bg-slate-50 border border-slate-100">
                <div>
                  <Link href={`/stocks/${h.symbol}`} className="font-bold text-slate-900 hover:text-blue-600 flex items-center gap-1">
                    <span className="font-mono">{h.symbol}</span>
                    <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                  </Link>
                  <div className="text-[11px] text-slate-500">{h.companyName}</div>
                </div>
                <div className="text-right">
                  <div className={`font-mono font-bold ${h.unrealizedPLPercent >= 0 ? 'text-slate-700' : 'text-red-700'}`}>
                    {h.unrealizedPLPercent >= 0 ? '+' : ''}{h.unrealizedPLPercent.toFixed(1)}%
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">{formatCurrency(h.unrealizedPL)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Monitoring Alerts */}
        <div className="financial-card p-5">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Active Portfolio Alerts</h3>
              <p className="text-xs text-slate-500">Autonomous risk & volatility events flagged by agent</p>
            </div>
            <Link href="/alerts" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {alerts.map(a => (
              <div
                key={a.id}
                className="p-3 rounded border border-slate-200 bg-white hover:border-slate-300 transition-colors text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{a.title}</span>
                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                    a.severity === 'HIGH_PRIORITY' ? 'bg-red-100 text-red-800' :
                    a.severity === 'IMPORTANT' ? 'bg-amber-100 text-amber-800' :
                    a.severity === 'WATCH' ? 'bg-blue-100 text-blue-800' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {a.severity.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">{a.message}</p>
                <div className="text-[10px] text-slate-400 font-mono pt-1">
                  Category: {a.category} • {formatDate(a.created_at)}
                </div>
              </div>
            ))}

            {alerts.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-500">
                All monitoring parameters within standard tolerances. No alerts active.
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
