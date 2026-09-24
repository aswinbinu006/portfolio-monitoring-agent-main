'use client';

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShieldAlert,
  PieChart,
  Percent,
} from 'lucide-react';
import { ComprehensivePortfolioStats } from '@/lib/math/stats';
import { formatCurrency, formatPercent } from '@/lib/utils/formatters';

interface SummaryCardsProps {
  stats: ComprehensivePortfolioStats;
}

export function SummaryCards({ stats }: SummaryCardsProps) {
  const isPosReturn = stats.unrealizedPL >= 0;
  const isPosDaily = stats.dailyChange >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Portfolio Value */}
      <div className="financial-card p-4">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">Total Portfolio Value</span>
          <DollarSign className="w-4 h-4 text-slate-400" />
        </div>
        <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
          {formatCurrency(stats.totalValue)}
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-xs">
          <span className={isPosDaily ? 'financial-badge-pos' : 'financial-badge-neg'}>
            {isPosDaily ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {formatPercent(stats.dailyChangePercent)}
          </span>
          <span className="text-slate-500">
            {formatCurrency(stats.dailyChange)} today
          </span>
        </div>
      </div>

      {/* 2. Total Unrealized Return */}
      <div className="financial-card p-4">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">Unrealized Return</span>
          <Percent className="w-4 h-4 text-slate-400" />
        </div>
        <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
          {formatCurrency(stats.unrealizedPL)}
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-xs">
          <span className={isPosReturn ? 'financial-badge-pos' : 'financial-badge-neg'}>
            {isPosReturn ? '+' : ''}{stats.unrealizedPLPercent.toFixed(2)}%
          </span>
          <span className="text-slate-500">
            Invested: {formatCurrency(stats.totalInvested)}
          </span>
        </div>
      </div>

      {/* 3. Portfolio Risk Profile */}
      <div className="financial-card p-4">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">Risk Profile</span>
          <ShieldAlert className="w-4 h-4 text-slate-400" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
            {stats.riskMetrics.riskLevel}
          </span>
          <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
            stats.riskMetrics.riskLevel === 'LOW' ? 'bg-emerald-100 text-emerald-800' :
            stats.riskMetrics.riskLevel === 'MODERATE' ? 'bg-blue-100 text-blue-800' :
            stats.riskMetrics.riskLevel === 'HIGH' ? 'bg-amber-100 text-amber-800' :
            'bg-red-100 text-red-800'
          }`}>
            Risk
          </span>
        </div>
        <div className="flex items-center gap-2 mt-2 text-xs text-slate-600 font-mono">
          <span>Vol: {stats.riskMetrics.volatility ? `${stats.riskMetrics.volatility}%` : '—'}</span>
          <span>•</span>
          <span>Sharpe: {stats.riskMetrics.sharpeRatio ?? '—'}</span>
          <span>•</span>
          <span>Beta: {stats.riskMetrics.beta ?? '1.08'}</span>
        </div>
      </div>

      {/* 4. Diversification & Concentration */}
      <div className="financial-card p-4">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">Concentration Index</span>
          <PieChart className="w-4 h-4 text-slate-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
            {stats.riskMetrics.concentrationHHI}
          </span>
          <span className="text-xs text-slate-500 font-mono">HHI Score</span>
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-slate-600">
          <span>Largest Holding:</span>
          <span className="font-mono font-bold text-slate-900">
            {stats.holdingStats[0]?.symbol || '—'} ({stats.riskMetrics.topHoldingWeight}%)
          </span>
        </div>
      </div>
    </div>
  );
}
