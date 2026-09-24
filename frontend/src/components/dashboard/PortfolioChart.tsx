'use client';

import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
} from 'recharts';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';

interface PortfolioChartProps {
  data: Array<{
    snapshot_date: string;
    total_value: number;
    total_invested: number;
    benchmark_value?: number;
  }>;
}

export function PortfolioChart({ data }: PortfolioChartProps) {
  const [timeframe, setTimeframe] = useState<'30D' | '90D' | 'ALL'>('90D');
  const [showBenchmark, setShowBenchmark] = useState(true);

  const filteredData = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    if (timeframe === '30D') return data.slice(-30);
    if (timeframe === '90D') return data.slice(-90);
    return data;
  }, [data, timeframe]);

  const minVal = Math.min(...filteredData.map(d => d.total_value || 0)) * 0.98;
  const maxVal = Math.max(...filteredData.map(d => d.total_value || 0)) * 1.02;

  return (
    <div className="financial-card p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">Portfolio Valuation History</h2>
          <p className="text-xs text-slate-500">Historical equity curve vs. S&P 500 benchmark baseline</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Benchmark Toggle */}
          <button
            onClick={() => setShowBenchmark(!showBenchmark)}
            className={`text-xs px-2.5 py-1 rounded border font-medium transition-colors ${
              showBenchmark
                ? 'bg-slate-100 border-slate-300 text-slate-800'
                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
          >
            SPY Benchmark: {showBenchmark ? 'ON' : 'OFF'}
          </button>

          {/* Timeframe selector */}
          <div className="inline-flex rounded-md border border-slate-200 p-0.5 bg-slate-50 text-xs">
            {(['30D', '90D', 'ALL'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  timeframe === t
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="valGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0F172A" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#0F172A" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis
              dataKey="snapshot_date"
              tickFormatter={d => {
                const parts = d.split('-');
                return `${parts[1]}/${parts[2]}`;
              }}
              stroke="#94A3B8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#CBD5E1' }}
            />
            <YAxis
              domain={[minVal, maxVal]}
              tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
              stroke="#94A3B8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              orientation="right"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white p-3 rounded shadow-lg border border-slate-700 text-xs space-y-1">
                      <div className="font-semibold text-slate-300">{formatDate(item.snapshot_date)}</div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-400">Portfolio Value:</span>
                        <span className="font-mono font-bold text-white">
                          {formatCurrency(item.total_value)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-400">Total Invested:</span>
                        <span className="font-mono text-slate-300">
                          {formatCurrency(item.total_invested)}
                        </span>
                      </div>
                      {showBenchmark && item.benchmark_value && (
                        <div className="flex justify-between gap-4 border-t border-slate-800 pt-1 text-[11px]">
                          <span className="text-slate-400">SPY Baseline:</span>
                          <span className="font-mono text-emerald-400">
                            {formatCurrency(item.benchmark_value)}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="total_value"
              stroke="#0F172A"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#valGrad)"
            />
            {showBenchmark && (
              <Line
                type="monotone"
                dataKey="benchmark_value"
                stroke="#64748B"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                dot={false}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-slate-900"></span> Portfolio Value
          </span>
          {showBenchmark && (
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-slate-400 border-t border-dashed"></span> S&P 500 Baseline
            </span>
          )}
        </div>
        <span className="font-mono">Audited daily at market close</span>
      </div>
    </div>
  );
}
