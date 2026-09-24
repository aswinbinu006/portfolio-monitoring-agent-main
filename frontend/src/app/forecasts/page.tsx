'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { ScenarioChart } from '@/components/forecasting/ScenarioChart';
import { Compass, AlertTriangle, RefreshCw, BarChart2, ShieldCheck } from 'lucide-react';
import { MultiScenarioForecast } from '@/lib/math/forecasting';
import { formatCurrency, formatPercent } from '@/lib/utils/formatters';

const POPULAR_TICKERS = ['NVDA', 'AAPL', 'MSFT', 'AMZN', 'TSLA', 'JPM', 'LLY', 'SPY'];

export default function ForecastsPage() {
  const [symbol, setSymbol] = useState('NVDA');
  const [horizon, setHorizon] = useState<'1M' | '3M' | '6M' | '1Y'>('3M');
  const [forecast, setForecast] = useState<MultiScenarioForecast | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchForecast = async (sym: string, hor: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/forecast?symbol=${sym}&horizon=${hor}`);
      const data = await res.json();
      setForecast(data);
    } catch (err) {
      console.error('Failed to load forecast:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast(symbol, horizon);
  }, [symbol, horizon]);

  return (
    <AppShell
      title="Quantitative Forecasts & Scenario Modeling"
      subtitle="Statistical multi-horizon Bull, Base, and Bear scenarios based on technical features and diffusion modeling"
    >
      {/* Ticker & Horizon Selection Bar */}
      <div className="financial-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-700">Security:</span>
          {POPULAR_TICKERS.map(t => (
            <button
              key={t}
              onClick={() => setSymbol(t)}
              className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors ${
                symbol === t
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">Horizon:</span>
          {(['1M', '3M', '6M', '1Y'] as const).map(h => (
            <button
              key={h}
              onClick={() => setHorizon(h)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                horizon === h
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {h}
            </button>
          ))}
        </div>
      </div>

      {/* Main Forecast Canvas */}
      {loading || !forecast ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-2">
          <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-500 font-mono">
            Computing statistical projection ensemble for {symbol} ({horizon})...
          </span>
        </div>
      ) : (
        <div className="space-y-6">
          <ScenarioChart forecast={forecast} />

          {/* Scenario Deep Dive Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bull Case */}
            <div className="financial-card p-5 border-t-4 border-emerald-600 space-y-3 text-xs">
              <div className="flex items-center justify-between font-bold">
                <span className="text-emerald-800 uppercase tracking-wider text-xs">Bull Case Scenario</span>
                <span className="font-mono text-emerald-700 text-sm">
                  +{forecast.bullCase.impliedReturnPercent}%
                </span>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900">
                {formatCurrency(forecast.bullCase.expectedPrice)}
              </div>
              <div className="text-slate-500 font-mono">
                Range: ${forecast.bullCase.priceRange[0]} - ${forecast.bullCase.priceRange[1]}
              </div>
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <span className="font-semibold text-slate-900 block">Core Assumptions:</span>
                {forecast.bullCase.assumptions.map((a, i) => (
                  <p key={i} className="text-slate-600 leading-relaxed">• {a}</p>
                ))}
              </div>
              <div className="pt-2 border-t border-slate-100">
                <span className="font-semibold text-slate-900 block mb-1">Supporting Signals:</span>
                {forecast.bullCase.supportingSignals.map((s, i) => (
                  <p key={i} className="text-slate-600 leading-relaxed">• {s}</p>
                ))}
              </div>
            </div>

            {/* Base Case */}
            <div className="financial-card p-5 border-t-4 border-blue-600 space-y-3 text-xs">
              <div className="flex items-center justify-between font-bold">
                <span className="text-blue-800 uppercase tracking-wider text-xs">Base Case Scenario</span>
                <span className="font-mono text-blue-700 text-sm">
                  +{forecast.baseCase.impliedReturnPercent}%
                </span>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900">
                {formatCurrency(forecast.baseCase.expectedPrice)}
              </div>
              <div className="text-slate-500 font-mono">
                Range: ${forecast.baseCase.priceRange[0]} - ${forecast.baseCase.priceRange[1]}
              </div>
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <span className="font-semibold text-slate-900 block">Core Assumptions:</span>
                {forecast.baseCase.assumptions.map((a, i) => (
                  <p key={i} className="text-slate-600 leading-relaxed">• {a}</p>
                ))}
              </div>
              <div className="pt-2 border-t border-slate-100">
                <span className="font-semibold text-slate-900 block mb-1">Supporting Signals:</span>
                {forecast.baseCase.supportingSignals.map((s, i) => (
                  <p key={i} className="text-slate-600 leading-relaxed">• {s}</p>
                ))}
              </div>
            </div>

            {/* Bear Case */}
            <div className="financial-card p-5 border-t-4 border-red-600 space-y-3 text-xs">
              <div className="flex items-center justify-between font-bold">
                <span className="text-red-800 uppercase tracking-wider text-xs">Bear Case Scenario</span>
                <span className="font-mono text-red-700 text-sm">
                  {forecast.bearCase.impliedReturnPercent}%
                </span>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900">
                {formatCurrency(forecast.bearCase.expectedPrice)}
              </div>
              <div className="text-slate-500 font-mono">
                Range: ${forecast.bearCase.priceRange[0]} - ${forecast.bearCase.priceRange[1]}
              </div>
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <span className="font-semibold text-slate-900 block">Downside Assumptions:</span>
                {forecast.bearCase.assumptions.map((a, i) => (
                  <p key={i} className="text-slate-600 leading-relaxed">• {a}</p>
                ))}
              </div>
              <div className="pt-2 border-t border-slate-100">
                <span className="font-semibold text-slate-900 block mb-1">Downside Catalysts:</span>
                {forecast.bearCase.risks.map((r, i) => (
                  <p key={i} className="text-slate-600 leading-relaxed">• {r}</p>
                ))}
              </div>
            </div>
          </div>

          {/* Model Signals & Methodology Footnote */}
          <div className="financial-card p-4 bg-slate-50 border-slate-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">Methodology & Signals Architecture:</span>
              <span className="font-mono text-[11px] text-slate-500">Uncertainty Rating: {forecast.uncertaintyRating}</span>
            </div>
            <p className="text-slate-600 leading-relaxed">{forecast.methodology}</p>
            <div className="text-[11px] text-slate-500 font-mono pt-1 border-t border-slate-200">
              Timestamp: {forecast.timestamp} • Data verified across historical daily OHLC bars
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
