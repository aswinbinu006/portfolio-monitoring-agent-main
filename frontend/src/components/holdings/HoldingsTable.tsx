'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Trash2,
  Plus,
  Upload,
  Search,
  Filter,
} from 'lucide-react';
import { Holding } from '@/lib/supabase/mock-store';
import { formatCurrency, formatPercent } from '@/lib/utils/formatters';

interface HoldingsTableProps {
  holdings: Holding[];
  onDeleteHolding?: (id: string) => void;
  onOpenAddModal?: () => void;
  onOpenCsvModal?: () => void;
}

export function HoldingsTable({
  holdings,
  onDeleteHolding,
  onOpenAddModal,
  onOpenCsvModal,
}: HoldingsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('ALL');

  const sectors = ['ALL', ...Array.from(new Set(holdings.map(h => h.sector || 'General')))];

  const filtered = holdings.filter(h => {
    const matchesSearch =
      h.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.company_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = selectedSector === 'ALL' || h.sector === selectedSector;
    return matchesSearch && matchesSector;
  });

  return (
    <div className="financial-card overflow-hidden">
      {/* Table Toolbar */}
      <div className="financial-card-header flex-col sm:flex-row gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">Active Portfolio Holdings</h2>
          <p className="text-xs text-slate-500">
            {holdings.length} total equity and ETF positions held
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search ticker or name..."
              className="pl-8 pr-3 py-1.5 rounded border border-slate-300 text-xs bg-white text-slate-900 focus:outline-none focus:border-slate-800"
            />
          </div>

          {/* Sector filter */}
          <select
            value={selectedSector}
            onChange={e => setSelectedSector(e.target.value)}
            className="px-2.5 py-1.5 rounded border border-slate-300 text-xs bg-white text-slate-700 focus:outline-none focus:border-slate-800"
          >
            {sectors.map(s => (
              <option key={s} value={s}>
                {s === 'ALL' ? 'All Sectors' : s}
              </option>
            ))}
          </select>

          {/* Actions */}
          {onOpenAddModal && (
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Holding</span>
            </button>
          )}

          {onOpenCsvModal && (
            <button
              onClick={onOpenCsvModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-slate-600" />
              <span>Import CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Holdings Table View */}
      <div className="overflow-x-auto">
        <table className="w-full text-left financial-table">
          <thead>
            <tr>
              <th>Security</th>
              <th>Sector</th>
              <th className="text-right">Quantity</th>
              <th className="text-right">Cost Basis</th>
              <th className="text-right">Current Price</th>
              <th className="text-right">Market Value</th>
              <th className="text-right">Unrealized P/L</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(h => {
              const marketVal = h.quantity * h.current_price;
              const investedVal = h.quantity * h.buy_price;
              const pl = marketVal - investedVal;
              const plPct = investedVal > 0 ? (pl / investedVal) * 100 : 0;
              const isPos = pl >= 0;

              return (
                <tr key={h.id} className="hover:bg-slate-50/80 transition-colors">
                  <td>
                    <Link
                      href={`/stocks/${h.symbol}`}
                      className="font-bold text-slate-900 hover:text-blue-600 flex items-center gap-1.5 group"
                    >
                      <span className="font-mono">{h.symbol}</span>
                      <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-600" />
                    </Link>
                    <div className="text-[11px] text-slate-500 truncate max-w-xs">{h.company_name}</div>
                  </td>
                  <td>
                    <span className="financial-badge-neutral text-[11px]">{h.sector}</span>
                  </td>
                  <td className="text-right font-mono font-medium text-slate-800">
                    {h.quantity}
                  </td>
                  <td className="text-right font-mono text-slate-600">
                    {formatCurrency(h.buy_price)}
                  </td>
                  <td className="text-right font-mono font-bold text-slate-900">
                    {formatCurrency(h.current_price)}
                  </td>
                  <td className="text-right font-mono font-bold text-slate-900">
                    {formatCurrency(marketVal)}
                  </td>
                  <td className="text-right">
                    <div className="font-mono font-semibold text-xs flex items-center justify-end gap-1">
                      <span className={isPos ? 'financial-badge-pos' : 'financial-badge-neg'}>
                        {isPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {formatPercent(plPct)}
                      </span>
                    </div>
                    <div className={`text-[11px] font-mono mt-0.5 ${isPos ? 'text-emerald-700' : 'text-red-700'}`}>
                      {formatCurrency(pl)}
                    </div>
                  </td>
                  <td className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Link
                        href={`/stocks/${h.symbol}`}
                        className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                      >
                        Research
                      </Link>
                      {onDeleteHolding && (
                        <button
                          onClick={() => onDeleteHolding(h.id)}
                          className="p-1 rounded text-slate-400 hover:text-red-600 transition-colors"
                          title="Delete holding"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-8 text-xs text-slate-500">
                  No holdings found matching filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
