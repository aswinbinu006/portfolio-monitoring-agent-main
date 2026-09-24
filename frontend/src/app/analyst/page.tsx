'use client';

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { AgentChat } from '@/components/analyst/AgentChat';
import { Bot, ShieldAlert, Cpu, Sparkles, Database } from 'lucide-react';

export default function AnalystPage() {
  return (
    <AppShell
      title="AI Portfolio Analyst"
      subtitle="Autonomous tool-calling quantitative strategist powered by Gemini 2.5 Flash & deterministic financial engines"
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Agent Chat (3 cols) */}
        <div className="lg:col-span-3">
          <AgentChat />
        </div>

        {/* Analytical Framework & Architecture Panel (1 col) */}
        <div className="space-y-4">
          <div className="financial-card p-4 space-y-3 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-900 border-b border-slate-100 pb-2">
              <Cpu className="w-4 h-4 text-emerald-600" />
              <span>Agent Architecture</span>
            </div>
            <div className="space-y-2 text-slate-600 leading-relaxed">
              <div className="flex items-start gap-1.5">
                <span className="font-mono text-emerald-600 font-bold">1.</span>
                <span><strong>Observation:</strong> Evaluates holdings, live market data, and sector exposure.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="font-mono text-emerald-600 font-bold">2.</span>
                <span><strong>Tool Selection:</strong> Dynamically selects from 30+ Zod-validated financial tools.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="font-mono text-emerald-600 font-bold">3.</span>
                <span><strong>Deterministic Math:</strong> Computes Sharpe, Beta, HHI, and Drawdown in code.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="font-mono text-emerald-600 font-bold">4.</span>
                <span><strong>Synthesis:</strong> Structures outputs with explicit confidence and sources.</span>
              </div>
            </div>
          </div>

          <div className="financial-card p-4 space-y-2.5 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-900 border-b border-slate-100 pb-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Financial Safety Protocol</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              The AI agent functions strictly as an analytical monitor. It does not execute trades, place orders, or promise guaranteed future prices.
            </p>
            <div className="p-2 rounded bg-amber-50 border border-amber-200 text-amber-900 text-[11px]">
              All scenarios reflect quantitative modeling with bounded uncertainty.
            </div>
          </div>

          <div className="financial-card p-4 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-900 border-b border-slate-100 pb-2">
              <Database className="w-4 h-4 text-slate-600" />
              <span>Available Toolset (30+)</span>
            </div>
            <div className="flex flex-wrap gap-1 text-[10px] font-mono">
              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">getPortfolio</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">getHoldings</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">calculateRiskMetrics</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">calculateConcentration</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">detectUnusualMovement</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">generatePriceForecast</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">analyzeNewsSentiment</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">calculateDrawdown</span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
