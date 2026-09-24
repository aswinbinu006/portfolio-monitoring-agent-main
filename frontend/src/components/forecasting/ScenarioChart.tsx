'use client';

import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { MultiScenarioForecast } from '@/lib/math/forecasting';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

interface ScenarioChartProps {
  forecast: MultiScenarioForecast;
}

export function ScenarioChart({ forecast }: ScenarioChartProps) {
  const { timeline, currentPrice, bullCase, baseCase, bearCase } = forecast;

  const minPrice = Math.min(
    ...timeline.map(t => Math.min(t.historicalPrice || 999999, t.bearPrice || 999999))
  ) * 0.95;

  const maxPrice = Math.max(
    ...timeline.map(t => Math.max(t.historicalPrice || 0, t.bullPrice || 0))
  ) * 1.05;

  return (
    <div className="financial-card p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              {forecast.symbol} Multi-Scenario Quantitative Forecast ({forecast.horizon})
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300">
              Current: {formatCurrency(currentPrice)}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Statistical projection ensemble: Linear Trend + Realized Volatility + RSI + Momentum
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 font-medium text-slate-700">
            <span className="w-3 h-0.5 bg-slate-900"></span> Historical
          </span>
          <span className="flex items-center gap-1.5 font-medium text-emerald-700">
            <span className="w-3 h-0.5 bg-emerald-600 border-t border-dashed"></span> Bull Case ({bullCase.impliedReturnPercent > 0 ? '+' : ''}{bullCase.impliedReturnPercent}%)
          </span>
          <span className="flex items-center gap-1.5 font-medium text-blue-700">
            <span className="w-3 h-0.5 bg-blue-600 border-t border-dashed"></span> Base Case ({baseCase.impliedReturnPercent > 0 ? '+' : ''}{baseCase.impliedReturnPercent}%)
          </span>
          <span className="flex items-center gap-1.5 font-medium text-red-700">
            <span className="w-3 h-0.5 bg-red-600 border-t border-dashed"></span> Bear Case ({bearCase.impliedReturnPercent}%)
          </span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={timeline} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis
              dataKey="date"
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
              domain={[minPrice, maxPrice]}
              tickFormatter={v => `$${v.toFixed(0)}`}
              stroke="#94A3B8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              orientation="right"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const p = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white p-3 rounded shadow-lg border border-slate-700 text-xs space-y-1.5">
                      <div className="font-semibold text-slate-300">{formatDate(p.date)}</div>
                      {p.historicalPrice && (
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-400">Historical Close:</span>
                          <span className="font-mono font-bold text-white">{formatCurrency(p.historicalPrice)}</span>
                        </div>
                      )}
                      {p.bullPrice && (
                        <div className="flex justify-between gap-4 text-emerald-400">
                          <span>Bull Scenario:</span>
                          <span className="font-mono font-bold">{formatCurrency(p.bullPrice)}</span>
                        </div>
                      )}
                      {p.basePrice && (
                        <div className="flex justify-between gap-4 text-blue-400">
                          <span>Base Scenario:</span>
                          <span className="font-mono font-bold">{formatCurrency(p.basePrice)}</span>
                        </div>
                      )}
                      {p.bearPrice && (
                        <div className="flex justify-between gap-4 text-red-400">
                          <span>Bear Scenario:</span>
                          <span className="font-mono font-bold">{formatCurrency(p.bearPrice)}</span>
                        </div>
                      )}
                      <div className="text-[10px] text-slate-500 border-t border-slate-800 pt-1">
                        {p.isForecast ? 'Model Projection Point' : 'Audited Historical Price'}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine y={currentPrice} stroke="#94A3B8" strokeDasharray="2 2" />
            
            {/* Historical trajectory */}
            <Line
              type="monotone"
              dataKey="historicalPrice"
              stroke="#0F172A"
              strokeWidth={2.2}
              dot={false}
              connectNulls={false}
            />

            {/* Bull Case trajectory */}
            <Line
              type="monotone"
              dataKey="bullPrice"
              stroke="#16803C"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
            />

            {/* Base Case trajectory */}
            <Line
              type="monotone"
              dataKey="basePrice"
              stroke="#2563EB"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
            />

            {/* Bear Case trajectory */}
            <Line
              type="monotone"
              dataKey="bearPrice"
              stroke="#C62828"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Financial Safety Disclaimer */}
      <div className="flex items-center gap-2 px-3 py-2 rounded bg-amber-50 border border-amber-200 text-amber-900 text-xs">
        <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
        <span className="font-medium">
          <strong>Mandatory Risk Disclaimer:</strong> {forecast.disclaimer}
        </span>
      </div>
    </div>
  );
}
