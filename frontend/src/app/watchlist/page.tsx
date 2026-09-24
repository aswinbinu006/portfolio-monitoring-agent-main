'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import {
  Bookmark,
  Plus,
  Trash2,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Target,
  Search,
} from 'lucide-react';
import { formatCurrency, formatPercent } from '@/lib/utils/formatters';

interface WatchlistSecurity {
  id: string;
  symbol: string;
  company_name: string;
  sector: string;
  target_price?: number;
  notes?: string;
  quote?: {
    price: number;
    change: number;
    changePercent: number;
  };
}

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<WatchlistSecurity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newSymbol, setNewSymbol] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchWatchlist = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/watchlist');
      const data = await res.json();
      setWatchlist(data.watchlist || []);
    } catch (err) {
      console.error('Failed to load watchlist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymbol.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: newSymbol.toUpperCase().trim(),
          targetPrice: newTarget ? parseFloat(newTarget) : undefined,
          notes: newNotes.trim() || undefined,
        }),
      });

      if (res.ok) {
        setNewSymbol('');
        setNewTarget('');
        setNewNotes('');
        setIsAddOpen(false);
        fetchWatchlist();
      }
    } catch (err) {
      console.error('Failed to add to watchlist:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (symbol: string) => {
    try {
      const res = await fetch(`/api/watchlist?symbol=${symbol}`, { method: 'DELETE' });
      if (res.ok) {
        setWatchlist(prev => prev.filter(w => w.symbol !== symbol));
      }
    } catch (err) {
      console.error('Failed to remove from watchlist:', err);
    }
  };

  return (
    <AppShell
      title="Securities Watchlist"
      subtitle="Track potential acquisitions, benchmark constituents, and target price alerts"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-slate-700" />
            Monitored Pipeline
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {watchlist.length} securities tracked outside active portfolio holdings
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add to Watchlist</span>
        </button>
      </div>

      {/* Add Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-300 shadow-xl max-w-md w-full p-5 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900">Add Security to Watchlist</h3>
            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ticker Symbol *</label>
                <input
                  type="text"
                  value={newSymbol}
                  onChange={e => setNewSymbol(e.target.value.toUpperCase())}
                  placeholder="e.g. GOOGL, AMD, BRK.B"
                  required
                  className="w-full px-3 py-2 rounded border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Price ($)</label>
                <input
                  type="number"
                  step="any"
                  value={newTarget}
                  onChange={e => setNewTarget(e.target.value)}
                  placeholder="e.g. 150.00"
                  className="w-full px-3 py-2 rounded border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes / Trigger Condition</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  placeholder="Entry thesis or catalyst..."
                  className="w-full px-3 py-2 rounded border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-3 py-1.5 rounded border border-slate-300 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded bg-slate-900 text-white font-semibold hover:bg-slate-800 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Add Security'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Watchlist Grid */}
      <div className="financial-card overflow-hidden">
        <table className="w-full text-left financial-table">
          <thead>
            <tr>
              <th>Security</th>
              <th>Sector</th>
              <th className="text-right">Market Price</th>
              <th className="text-right">Today's Move</th>
              <th className="text-right">Target Price</th>
              <th>Notes / Thesis</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {watchlist.map(item => {
              const q = item.quote;
              const isPos = (q?.changePercent || 0) >= 0;

              return (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td>
                    <Link
                      href={`/stocks/${item.symbol}`}
                      className="font-bold text-slate-900 hover:text-blue-600 flex items-center gap-1.5 group"
                    >
                      <span className="font-mono">{item.symbol}</span>
                      <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-600" />
                    </Link>
                    <div className="text-[11px] text-slate-500">{item.company_name}</div>
                  </td>
                  <td>
                    <span className="financial-badge-neutral text-[11px]">{item.sector}</span>
                  </td>
                  <td className="text-right font-mono font-bold text-slate-900">
                    {q ? formatCurrency(q.price) : '—'}
                  </td>
                  <td className="text-right">
                    {q ? (
                      <span className={isPos ? 'financial-badge-pos text-xs' : 'financial-badge-neg text-xs'}>
                        {isPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {formatPercent(q.changePercent)}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="text-right font-mono font-semibold text-slate-700">
                    {item.target_price ? formatCurrency(item.target_price) : '—'}
                  </td>
                  <td className="text-xs text-slate-600 max-w-xs truncate">
                    {item.notes || '—'}
                  </td>
                  <td className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Link
                        href={`/stocks/${item.symbol}`}
                        className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                      >
                        Deep Dive
                      </Link>
                      <button
                        onClick={() => handleRemove(item.symbol)}
                        className="p-1 text-slate-400 hover:text-red-600"
                        title="Remove from watchlist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {watchlist.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-xs text-slate-500">
                  No securities currently on watchlist. Add tickers above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
