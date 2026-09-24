'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Briefcase, Plus, CheckCircle, ExternalLink, Calendar, DollarSign } from 'lucide-react';
import { Portfolio } from '@/lib/supabase/mock-store';
import { formatDate } from '@/lib/utils/formatters';
import Link from 'next/link';

export default function PortfolioManagementPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [benchmark, setBenchmark] = useState('SPY');

  useEffect(() => {
    // Load initial portfolios
    setPortfolios([
      {
        id: 'port-demo-001',
        user_id: 'usr-demo-default',
        name: 'Balanced Global Tech & Growth Portfolio',
        description: 'Diversified core equity portfolio focused on high-conviction tech, healthcare, and enterprise leaders.',
        currency: 'USD',
        benchmark: 'SPY',
        is_default: true,
        created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
  }, []);

  const handleCreatePortfolio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newPort: Portfolio = {
      id: `port-${Date.now()}`,
      user_id: 'usr-demo-default',
      name: name.trim(),
      description: description.trim(),
      currency,
      benchmark,
      is_default: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setPortfolios(prev => [...prev, newPort]);
    setName('');
    setDescription('');
    setIsCreating(false);
  };

  return (
    <AppShell
      title="Portfolio Accounts"
      subtitle="Manage distinct investment portfolios, benchmarks, and reporting profiles"
    >
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold text-slate-900 tracking-tight">Active Accounts</h2>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create New Portfolio</span>
        </button>
      </div>

      {/* Inline Create Form */}
      {isCreating && (
        <form onSubmit={handleCreatePortfolio} className="financial-card p-5 space-y-4 bg-slate-50 border-slate-300 text-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="font-bold text-slate-900">New Portfolio Configuration</h3>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Portfolio Name *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Dividend Income & Value Strategy"
                required
                className="w-full px-3 py-2 rounded border border-slate-300 bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Base Currency</label>
                <select
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-slate-300 bg-white"
                >
                  <option value="USD">USD ($)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Benchmark</label>
                <select
                  value={benchmark}
                  onChange={e => setBenchmark(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-slate-300 bg-white"
                >
                  <option value="SPY">S&P 500 (SPY)</option>
                  <option value="QQQ">Nasdaq 100 (QQQ)</option>
                  <option value="NIFTY50">NIFTY 50</option>
                  <option value="ACWI">MSCI ACWI</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description / Mandate</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Investment goals, risk tolerance constraints, and cash flow requirements..."
              className="w-full px-3 py-2 rounded border border-slate-300 bg-white"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 rounded bg-slate-900 text-white font-semibold hover:bg-slate-800 cursor-pointer"
            >
              Initialize Portfolio
            </button>
          </div>
        </form>
      )}

      {/* Portfolios List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {portfolios.map(p => (
          <div key={p.id} className="financial-card p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
                    <Briefcase className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm tracking-tight">{p.name}</h3>
                </div>
                {p.is_default && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">
                    DEFAULT
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">{p.description}</p>
              
              <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Currency</span>
                  <span className="font-mono font-semibold text-slate-800">{p.currency}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Benchmark</span>
                  <span className="font-mono font-semibold text-slate-800">{p.benchmark}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Established</span>
                  <span className="font-mono text-slate-800">{formatDate(p.created_at)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400 font-mono">ID: {p.id}</span>
              <Link
                href="/dashboard"
                className="text-xs font-semibold px-3 py-1.5 rounded bg-slate-900 text-white hover:bg-slate-800 flex items-center gap-1.5"
              >
                <span>View Dashboard</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
