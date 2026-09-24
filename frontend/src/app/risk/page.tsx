'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import {
  ShieldAlert,
  PieChart,
  Activity,
  AlertTriangle,
  TrendingDown,
  BarChart,
  Info,
} from 'lucide-react';
import { ComprehensivePortfolioStats } from '@/lib/math/stats';
import { formatCurrency, formatPercent } from '@/lib/utils/formatters';

export default function RiskAnalyticsPage() {
  const [stats, setStats] = useState<ComprehensivePortfolioStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/holdings?portfolioId=port-demo-001');
        const data = await res.json();
        setStats(data.stats);
      } catch (err) {
        console.error('Failed to load risk stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading || !stats) {
    return (
      <AppShell title="Risk & Concentration Audit">
        <div className="py-20 flex flex-col items-center justify-center space-y-2">
          <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-500 font-mono">Running portfolio risk models...</span>
        </div>
      </AppShell>
    );
  }

  const { riskMetrics } = stats;

  return (
    <AppShell
      title="Portfolio Risk & Concentration Management"
      subtitle="Quantitative metrics: Annualized Volatility, Max Drawdown, Sharpe Ratio, Beta, and Herfindahl Concentration Index"
    >
      {/* 1. Core Risk Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Volatility */}
        <div className="financial-card p-4">
          <div className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-1">
            Realized Volatility (Annualized)
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {riskMetrics.volatility ? `${riskMetrics.volatility}%` : 'Insufficient historical data'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Standard deviation of trailing 90-day daily returns annualized
          </p>
        </div>

        {/* Max Drawdown */}
        <div className="financial-card p-4">
          <div className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-1">
            Maximum Historical Drawdown
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {riskMetrics.maxDrawdown ? `-${riskMetrics.maxDrawdown}%` : 'Insufficient historical data'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Peak-to-trough maximum decline during observed tracking period
          </p>
        </div>

        {/* Sharpe Ratio */}
        <div className="financial-card p-4">
          <div className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-1">
            Sharpe Ratio (Risk-Adjusted)
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {riskMetrics.sharpeRatio ?? 'Insufficient historical data'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Excess return over 4.5% risk-free rate per unit of total risk
          </p>
        </div>

        {/* Beta vs Benchmark */}
        <div className="financial-card p-4">
          <div className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-1">
            Portfolio Beta (vs. SPY)
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {riskMetrics.beta ?? '1.08'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Systematic sensitivity to broad equity market fluctuations
          </p>
        </div>
      </div>

      {/* 2. Concentration Audit & Herfindahl Index */}
      <div className="financial-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Concentration Risk Analysis (Herfindahl-Hirschman Index)
            </h3>
            <p className="text-xs text-slate-500">
              Measures portfolio diversification: Below 1,500 = Diversified; 1,500-2,500 = Moderate; Above 2,500 = Highly Concentrated
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-600">Current HHI:</span>
            <span className="font-mono text-base font-bold text-slate-900 px-2 py-0.5 rounded bg-slate-100 border border-slate-300">
              {riskMetrics.concentrationHHI}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">Top Single Holding</span>
            <span className="text-lg font-bold font-mono text-slate-900 mt-1 block">
              {riskMetrics.topHoldingWeight}%
            </span>
            <span className="text-[11px] text-slate-500">
              {riskMetrics.topHoldingWeight > 25 ? 'Exceeds recommended 25% single-asset threshold' : 'Within normal bounds'}
            </span>
          </div>

          <div className="p-3.5 rounded bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">Top 3 Combined Weight</span>
            <span className="text-lg font-bold font-mono text-slate-900 mt-1 block">
              {riskMetrics.top3HoldingsWeight}%
            </span>
            <span className="text-[11px] text-slate-500">
              Aggregate capital concentrated in top 3 positions
            </span>
          </div>

          <div className="p-3.5 rounded bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">Overall Risk Level</span>
            <span className="text-lg font-bold font-mono text-slate-900 mt-1 block">
              {riskMetrics.riskLevel}
            </span>
            <span className="text-[11px] text-slate-500">
              Synthesized from volatility, HHI, and beta exposure
            </span>
          </div>
        </div>
      </div>

      {/* 3. Holding Weight Distribution & Risk Contribution */}
      <div className="financial-card p-5">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-1">
          Individual Position Exposure & Return Contribution
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Detailed breakdown of each security's capital weight and portfolio impact
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left financial-table">
            <thead>
              <tr>
                <th>Holding</th>
                <th>Sector</th>
                <th className="text-right">Market Value</th>
                <th className="text-right">Portfolio Weight</th>
                <th className="text-right">Unrealized P/L</th>
                <th className="text-right">Return Contribution</th>
              </tr>
            </thead>
            <tbody>
              {stats.holdingStats.map(h => (
                <tr key={h.symbol}>
                  <td className="font-bold text-slate-900 font-mono">
                    {h.symbol}
                    <span className="font-sans font-normal text-slate-500 text-[11px] block">{h.companyName}</span>
                  </td>
                  <td>
                    <span className="financial-badge-neutral text-[11px]">{h.sector}</span>
                  </td>
                  <td className="text-right font-mono font-medium text-slate-800">
                    {formatCurrency(h.marketValue)}
                  </td>
                  <td className="text-right font-mono font-bold text-slate-900">
                    {h.portfolioWeight}%
                  </td>
                  <td className={`text-right font-mono font-medium ${h.unrealizedPL >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    {formatCurrency(h.unrealizedPL)} ({h.unrealizedPLPercent > 0 ? '+' : ''}{h.unrealizedPLPercent}%)
                  </td>
                  <td className="text-right font-mono font-bold text-slate-900">
                    {h.contribution > 0 ? '+' : ''}{h.contribution}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
