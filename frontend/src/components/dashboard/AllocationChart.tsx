'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { SectorExposure } from '@/lib/math/stats';
import { formatCurrency } from '@/lib/utils/formatters';

interface AllocationChartProps {
  sectors: SectorExposure[];
  totalValue: number;
}

// Sophisticated institutional color sequence (not neon AI colors)
const SECTOR_COLORS = [
  '#0F172A', // Slate 900
  '#334155', // Slate 700
  '#475569', // Slate 600
  '#64748B', // Slate 500
  '#94A3B8', // Slate 400
  '#0369A1', // Sky 700
  '#0D9488', // Teal 600
  '#B45309', // Amber 700
  '#BE123C', // Rose 700
];

export function AllocationChart({ sectors, totalValue }: AllocationChartProps) {
  const chartData = sectors.map((s, idx) => ({
    name: s.sector,
    value: s.value,
    percentage: s.percentage,
    color: SECTOR_COLORS[idx % SECTOR_COLORS.length],
  }));

  return (
    <div className="financial-card p-5 flex flex-col justify-between">
      <div>
        <h2 className="text-sm font-bold text-slate-900 tracking-tight">Sector Allocation</h2>
        <p className="text-xs text-slate-500 mb-3">Portfolio weighting across economic sectors</p>

        <div className="h-52 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                innerRadius={60}
                outerRadius={85}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#FFFFFF" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-2.5 rounded shadow text-xs border border-slate-700">
                        <div className="font-semibold text-slate-200">{data.name}</div>
                        <div className="flex justify-between gap-4 mt-1">
                          <span className="text-slate-400">Value:</span>
                          <span className="font-mono text-white">{formatCurrency(data.value)}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-400">Weight:</span>
                          <span className="font-mono text-emerald-400">{data.percentage}%</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Center Stat */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Total</span>
            <span className="text-sm font-bold text-slate-900 font-mono">
              ${(totalValue / 1000).toFixed(1)}k
            </span>
          </div>
        </div>
      </div>

      {/* Breakdown Legend Table */}
      <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 max-h-40 overflow-y-auto">
        {sectors.map((s, idx) => (
          <div key={s.sector} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate pr-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: SECTOR_COLORS[idx % SECTOR_COLORS.length] }}
              ></span>
              <span className="truncate text-slate-700 font-medium">{s.sector}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0 font-mono">
              <span className="text-slate-500">{formatCurrency(s.value)}</span>
              <span className="text-slate-900 font-bold w-12 text-right">{s.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
