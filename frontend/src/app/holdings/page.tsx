'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { HoldingsTable } from '@/components/holdings/HoldingsTable';
import { AddHoldingModal } from '@/components/holdings/AddHoldingModal';
import { CsvImportModal } from '@/components/holdings/CsvImportModal';
import { Holding } from '@/lib/supabase/mock-store';
import { Layers, Plus, Upload, RefreshCw } from 'lucide-react';

export default function HoldingsPage() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isCsvOpen, setIsCsvOpen] = useState(false);

  const fetchHoldings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/holdings?portfolioId=port-demo-001');
      const data = await res.json();
      setHoldings(data.holdings || []);
    } catch (err) {
      console.error('Failed to load holdings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHoldings();
  }, []);

  const handleDeleteHolding = async (id: string) => {
    if (!confirm('Are you sure you want to remove this security from your portfolio?')) return;
    try {
      const res = await fetch(`/api/holdings?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setHoldings(prev => prev.filter(h => h.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete holding:', err);
    }
  };

  return (
    <AppShell
      title="Portfolio Holdings & CSV Management"
      subtitle="Maintain positions, cost bases, and ingest external brokerage files"
    >
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-700" />
            Security Ledger & Position Registry
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time market valuation, average acquisition cost, and asset classification
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Position</span>
          </button>

          <button
            onClick={() => setIsCsvOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-slate-600" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={fetchHoldings}
            className="p-2 rounded border border-slate-200 hover:bg-slate-100 text-slate-600"
            title="Refresh Quotes"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Holdings Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-2">
          <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-500 font-mono">Loading positions...</span>
        </div>
      ) : (
        <HoldingsTable
          holdings={holdings}
          onDeleteHolding={handleDeleteHolding}
          onOpenAddModal={() => setIsAddOpen(true)}
          onOpenCsvModal={() => setIsCsvOpen(true)}
        />
      )}

      {/* Modals */}
      <AddHoldingModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onHoldingAdded={fetchHoldings}
      />

      <CsvImportModal
        isOpen={isCsvOpen}
        onClose={() => setIsCsvOpen(false)}
        onImportComplete={fetchHoldings}
      />
    </AppShell>
  );
}
