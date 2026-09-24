'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Settings, Save, CheckCircle, ShieldAlert, Sliders, Bell, Cpu } from 'lucide-react';

export default function SettingsPage() {
  const [currency, setCurrency] = useState('USD');
  const [benchmark, setBenchmark] = useState('SPY');
  const [riskTolerance, setRiskTolerance] = useState('MODERATE');
  const [dailyLossThreshold, setDailyLossThreshold] = useState(3.0);
  const [concentrationThreshold, setConcentrationThreshold] = useState(25.0);
  const [drawdownThreshold, setDrawdownThreshold] = useState(12.0);
  const [inAppAlerts, setInAppAlerts] = useState(true);
  const [savedMessage, setSavedMessage] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  return (
    <AppShell
      title="System & Portfolio Preferences"
      subtitle="Configure risk limits, notification thresholds, benchmark comparisons, and AI reasoning parameters"
    >
      <form onSubmit={handleSave} className="max-w-4xl space-y-6">
        {/* Success Alert */}
        {savedMessage && (
          <div className="p-3 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Preferences updated successfully across active portfolio session.</span>
          </div>
        )}

        {/* 1. Core Portfolio Settings */}
        <div className="financial-card p-5 space-y-4 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900 border-b border-slate-100 pb-2">
            <Sliders className="w-4 h-4 text-slate-700" />
            <span>General Portfolio Defaults</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Base Currency</label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="w-full px-3 py-2 rounded border border-slate-300 bg-white"
              >
                <option value="USD">USD ($ - United States Dollar)</option>
                <option value="INR">INR (₹ - Indian Rupee)</option>
                <option value="EUR">EUR (€ - Euro)</option>
                <option value="GBP">GBP (£ - British Pound)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Target Benchmark</label>
              <select
                value={benchmark}
                onChange={e => setBenchmark(e.target.value)}
                className="w-full px-3 py-2 rounded border border-slate-300 bg-white"
              >
                <option value="SPY">S&P 500 ETF (SPY)</option>
                <option value="QQQ">Nasdaq 100 ETF (QQQ)</option>
                <option value="NIFTY50">NSE NIFTY 50</option>
                <option value="ACWI">MSCI All Country World Index</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Risk Tolerance Strategy</label>
              <select
                value={riskTolerance}
                onChange={e => setRiskTolerance(e.target.value)}
                className="w-full px-3 py-2 rounded border border-slate-300 bg-white"
              >
                <option value="CONSERVATIVE">Conservative (Capital Preservation)</option>
                <option value="MODERATE">Moderate (Balanced Growth)</option>
                <option value="AGGRESSIVE">Aggressive (High Conviction Growth)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 2. Intelligent Alert Thresholds */}
        <div className="financial-card p-5 space-y-4 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900 border-b border-slate-100 pb-2">
            <Bell className="w-4 h-4 text-slate-700" />
            <span>Autonomous Monitoring & Alert Thresholds</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center justify-between font-semibold text-slate-700 mb-1">
                <span>Daily Holding Swing Limit</span>
                <span className="font-mono text-slate-900">{dailyLossThreshold}%</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="10.0"
                step="0.5"
                value={dailyLossThreshold}
                onChange={e => setDailyLossThreshold(parseFloat(e.target.value))}
                className="w-full"
              />
              <span className="text-[11px] text-slate-500 block mt-1">
                Triggers an alert when any security moves beyond this rate in a single session.
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between font-semibold text-slate-700 mb-1">
                <span>Concentration Warning Cap</span>
                <span className="font-mono text-slate-900">{concentrationThreshold}%</span>
              </div>
              <input
                type="range"
                min="10.0"
                max="50.0"
                step="1.0"
                value={concentrationThreshold}
                onChange={e => setConcentrationThreshold(parseFloat(e.target.value))}
                className="w-full"
              />
              <span className="text-[11px] text-slate-500 block mt-1">
                Triggers when a single stock represents more than this percentage of total portfolio.
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between font-semibold text-slate-700 mb-1">
                <span>Max Drawdown Alert Limit</span>
                <span className="font-mono text-slate-900">{drawdownThreshold}%</span>
              </div>
              <input
                type="range"
                min="5.0"
                max="30.0"
                step="1.0"
                value={drawdownThreshold}
                onChange={e => setDrawdownThreshold(parseFloat(e.target.value))}
                className="w-full"
              />
              <span className="text-[11px] text-slate-500 block mt-1">
                Triggers when peak-to-trough drawdown exceeds this tolerance limit.
              </span>
            </div>
          </div>
        </div>

        {/* 3. AI Agent Configuration */}
        <div className="financial-card p-5 space-y-4 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900 border-b border-slate-100 pb-2">
            <Cpu className="w-4 h-4 text-emerald-600" />
            <span>AI Reasoning & Tool Parameters</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reasoning Model</label>
              <input
                type="text"
                disabled
                value="Google Gemini 2.5 Flash (Vercel Serverless Compatible)"
                className="w-full px-3 py-2 rounded border border-slate-200 bg-slate-100 text-slate-600 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Execution Mode</label>
              <input
                type="text"
                disabled
                value="Structured JSON Tool-Calling (Deterministic Validation)"
                className="w-full px-3 py-2 rounded border border-slate-200 bg-slate-100 text-slate-600 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 rounded bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>
    </AppShell>
  );
}
