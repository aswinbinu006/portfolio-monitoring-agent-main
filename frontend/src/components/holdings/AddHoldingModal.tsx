'use client';

import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

interface AddHoldingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onHoldingAdded: () => void;
  portfolioId?: string;
}

const SECTORS = [
  'Technology',
  'Healthcare',
  'Financial Services',
  'Consumer Cyclical',
  'Communication Services',
  'Industrials',
  'Consumer Defensive',
  'Energy',
  'Utilities',
  'Real Estate',
  'Broad Market',
];

export function AddHoldingModal({
  isOpen,
  onClose,
  onHoldingAdded,
  portfolioId = 'port-demo-001',
}: AddHoldingModalProps) {
  const [symbol, setSymbol] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [sector, setSector] = useState('Technology');
  const [assetType, setAssetType] = useState('Stock');
  const [broker, setBroker] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const qty = parseFloat(quantity);
    const buyP = parseFloat(buyPrice);
    const currP = currentPrice ? parseFloat(currentPrice) : buyP;

    if (!symbol.trim() || !companyName.trim() || isNaN(qty) || isNaN(buyP) || qty <= 0 || buyP < 0) {
      setError('Please fill in valid required fields (Symbol, Company, Quantity > 0, Buy Price >= 0).');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/holdings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portfolio_id: portfolioId,
          symbol: symbol.toUpperCase().trim(),
          company_name: companyName.trim(),
          quantity: qty,
          buy_price: buyP,
          current_price: currP,
          sector,
          asset_type: assetType,
          broker: broker.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add holding');
      }

      onHoldingAdded();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving holding.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-slate-300 shadow-xl max-w-lg w-full overflow-hidden">
        <div className="financial-card-header bg-slate-900 text-white">
          <div>
            <h3 className="text-sm font-bold tracking-tight text-white">Add Security Holding</h3>
            <p className="text-xs text-slate-400">Record an asset position in your portfolio</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 rounded bg-red-50 border border-red-200 text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Ticker Symbol *</label>
              <input
                type="text"
                value={symbol}
                onChange={e => setSymbol(e.target.value.toUpperCase())}
                placeholder="e.g. MSFT, AAPL, TCS"
                required
                className="w-full px-3 py-2 rounded border border-slate-300 font-mono text-xs focus:outline-none focus:border-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Asset Type</label>
              <select
                value={assetType}
                onChange={e => setAssetType(e.target.value)}
                className="w-full px-3 py-2 rounded border border-slate-300 text-xs focus:outline-none focus:border-slate-800"
              >
                <option value="Stock">Equity / Stock</option>
                <option value="ETF">Exchange-Traded Fund (ETF)</option>
                <option value="Mutual Fund">Mutual Fund</option>
                <option value="Crypto">Crypto</option>
                <option value="Cash">Cash Equivalent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Company / Fund Name *</label>
            <input
              type="text"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              placeholder="e.g. Microsoft Corporation"
              required
              className="w-full px-3 py-2 rounded border border-slate-300 text-xs focus:outline-none focus:border-slate-800"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Quantity *</label>
              <input
                type="number"
                step="any"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                placeholder="10"
                required
                className="w-full px-3 py-2 rounded border border-slate-300 font-mono text-xs focus:outline-none focus:border-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Buy Price ($) *</label>
              <input
                type="number"
                step="any"
                value={buyPrice}
                onChange={e => setBuyPrice(e.target.value)}
                placeholder="150.00"
                required
                className="w-full px-3 py-2 rounded border border-slate-300 font-mono text-xs focus:outline-none focus:border-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Current Price ($)</label>
              <input
                type="number"
                step="any"
                value={currentPrice}
                onChange={e => setCurrentPrice(e.target.value)}
                placeholder="Leave blank for buy price"
                className="w-full px-3 py-2 rounded border border-slate-300 font-mono text-xs focus:outline-none focus:border-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Sector</label>
              <select
                value={sector}
                onChange={e => setSector(e.target.value)}
                className="w-full px-3 py-2 rounded border border-slate-300 text-xs focus:outline-none focus:border-slate-800"
              >
                {SECTORS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Broker / Custodian</label>
              <input
                type="text"
                value={broker}
                onChange={e => setBroker(e.target.value)}
                placeholder="Fidelity, Schwab, IBKR..."
                className="w-full px-3 py-2 rounded border border-slate-300 text-xs focus:outline-none focus:border-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Investment Thesis / Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Core thesis, dividend reinvestment, strategic horizon..."
              className="w-full px-3 py-2 rounded border border-slate-300 text-xs focus:outline-none focus:border-slate-800"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded bg-slate-900 hover:bg-slate-800 text-white font-semibold flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Saving...' : 'Save Holding'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
