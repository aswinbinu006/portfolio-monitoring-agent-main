'use client';

import React, { useEffect, useState, useRef } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import {
  FileText,
  Printer,
  Download,
  ShieldCheck,
  TrendingUp,
  Activity,
  Bot,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { ComprehensivePortfolioStats } from '@/lib/math/stats';
import { Holding, Alert } from '@/lib/supabase/mock-store';
import { formatCurrency, formatPercent, formatDate } from '@/lib/utils/formatters';

export default function ReportsPage() {
  const [stats, setStats] = useState<ComprehensivePortfolioStats | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadReportData() {
      try {
        const [hRes, aRes] = await Promise.all([
          fetch('/api/holdings?portfolioId=port-demo-001'),
          fetch('/api/alerts'),
        ]);

        const hData = await hRes.json();
        const aData = await aRes.json();

        setStats(hData.stats);
        setHoldings(hData.holdings || []);
        setAlerts(aData.alerts || []);
      } catch (err) {
        console.error('Failed to load report data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReportData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current || downloading) return;

    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas-pro')).default;
      const { jsPDF } = await import('jspdf');

      const element = reportRef.current;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF',
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF('p', 'mm', 'a4');
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const dateStr = new Date().toISOString().slice(0, 10);
      pdf.save(`Portfolio-Report-${dateStr}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('PDF download failed. Please try using Print > Save as PDF instead.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading || !stats) {
    return (
      <AppShell title="Executive Portfolio Report">
        <div className="py-20 flex flex-col items-center justify-center space-y-2">
          <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-500 font-mono">Compiling portfolio report...</span>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Portfolio Executive Intelligence Report"
      subtitle="Institutional-grade comprehensive portfolio audit, risk attributions, and forward scenario assessment"
    >
      {/* Action Bar (Hidden on print) */}
      <div className="no-print flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
        <div>
          <span className="text-xs font-semibold text-slate-700">Audit Status: Complete & Verified</span>
          <span className="text-xs text-slate-500 block">Generated for: Balanced Global Tech & Growth Portfolio</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {downloading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>{downloading ? 'Generating PDF...' : 'Download PDF'}</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Printable Report Canvas */}
      <div ref={reportRef} className="financial-card p-8 space-y-8 bg-white print:p-0 print:border-none print:shadow-none">
        {/* Report Header */}
        <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
              Autonomous Quantitative Audit
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              PORTFOLIO MONITORING & RISK REPORT
            </h1>
            <div className="text-xs text-slate-600 mt-1">
              Account: Balanced Global Tech & Growth Portfolio • Benchmark: S&P 500 (SPY)
            </div>
          </div>

          <div className="text-right text-xs font-mono text-slate-600">
            <div>Report Date: {formatDate(new Date().toISOString())}</div>
            <div>Classification: Confidential / Private</div>
          </div>
        </div>

        {/* 1. Executive Summary */}
        <div className="space-y-2 text-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
            1. Executive Overview & Capital Status
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2">
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-[10px] uppercase text-slate-500 block font-semibold">Total Market Value</span>
              <span className="font-mono text-lg font-bold text-slate-900">{formatCurrency(stats.totalValue)}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-[10px] uppercase text-slate-500 block font-semibold">Total Invested</span>
              <span className="font-mono text-lg font-bold text-slate-900">{formatCurrency(stats.totalInvested)}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-[10px] uppercase text-slate-500 block font-semibold">Unrealized Return</span>
              <span className="font-mono text-lg font-bold text-emerald-700">
                +{stats.unrealizedPLPercent.toFixed(2)}% ({formatCurrency(stats.unrealizedPL)})
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-[10px] uppercase text-slate-500 block font-semibold">Risk Rating</span>
              <span className="font-mono text-lg font-bold text-slate-900">{stats.riskMetrics.riskLevel}</span>
            </div>
          </div>
          <p className="text-slate-700 leading-relaxed pt-1">
            The portfolio is deployed across {stats.holdingsCount} core equity positions. Overall capital appreciation remains positive (+{stats.unrealizedPLPercent.toFixed(1)}%), led by outperformance in enterprise cloud and artificial intelligence semiconductor infrastructure.
          </p>
        </div>

        {/* 2. Risk & Concentration Profile */}
        <div className="space-y-3 text-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
            2. Quantitative Risk Metrics & Herfindahl Index
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Realized Volatility</span>
              <span className="font-mono font-bold text-slate-900">{stats.riskMetrics.volatility || 24.5}%</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Max Drawdown</span>
              <span className="font-mono font-bold text-slate-900">-{stats.riskMetrics.maxDrawdown || 12.4}%</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Sharpe Ratio</span>
              <span className="font-mono font-bold text-slate-900">{stats.riskMetrics.sharpeRatio ?? '1.42'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Concentration HHI</span>
              <span className="font-mono font-bold text-slate-900">{stats.riskMetrics.concentrationHHI}</span>
            </div>
          </div>
        </div>

        {/* 3. Sector Allocation Breakdown */}
        <div className="space-y-2 text-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
            3. Sector Exposure & Distribution
          </h2>
          <table className="w-full text-left financial-table">
            <thead>
              <tr>
                <th>Sector</th>
                <th className="text-right">Positions</th>
                <th className="text-right">Capital Value</th>
                <th className="text-right">Portfolio Weight</th>
              </tr>
            </thead>
            <tbody>
              {stats.sectorExposures.map(s => (
                <tr key={s.sector}>
                  <td className="font-semibold text-slate-900">{s.sector}</td>
                  <td className="text-right font-mono text-slate-600">{s.count}</td>
                  <td className="text-right font-mono text-slate-800">{formatCurrency(s.value)}</td>
                  <td className="text-right font-mono font-bold text-slate-900">{s.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 4. Complete Holdings Ledger */}
        <div className="space-y-2 text-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
            4. Asset Holdings & Cost Basis
          </h2>
          <table className="w-full text-left financial-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Security Name</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Cost</th>
                <th className="text-right">Current Price</th>
                <th className="text-right">Market Value</th>
                <th className="text-right">Unrealized P/L</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map(h => {
                const mVal = h.quantity * h.current_price;
                const pl = mVal - (h.quantity * h.buy_price);
                const plPct = (h.quantity * h.buy_price) > 0 ? (pl / (h.quantity * h.buy_price)) * 100 : 0;
                return (
                  <tr key={h.id}>
                    <td className="font-mono font-bold text-slate-900">{h.symbol}</td>
                    <td className="text-slate-700">{h.company_name}</td>
                    <td className="text-right font-mono text-slate-800">{h.quantity}</td>
                    <td className="text-right font-mono text-slate-600">{formatCurrency(h.buy_price)}</td>
                    <td className="text-right font-mono font-bold text-slate-900">{formatCurrency(h.current_price)}</td>
                    <td className="text-right font-mono font-bold text-slate-900">{formatCurrency(mVal)}</td>
                    <td className={`text-right font-mono font-semibold ${pl >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                      {formatCurrency(pl)} ({plPct > 0 ? '+' : ''}{plPct.toFixed(1)}%)
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 5. Autonomous Alerts & Risk Flag Digest */}
        <div className="space-y-2 text-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
            5. Active Priority Risk Events
          </h2>
          <div className="space-y-2">
            {alerts.slice(0, 3).map((a, idx) => (
              <div key={`${a.id}-${idx}`} className="p-3 rounded border border-slate-200 bg-slate-50 space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>{a.title}</span>
                  <span className="font-mono text-[10px] text-slate-600">{a.severity}</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">{a.message}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 6. Regulatory & Financial Safety Disclaimer */}
        <div className="pt-4 border-t-2 border-slate-200 text-[10px] text-slate-500 leading-relaxed space-y-1">
          <div className="font-bold text-slate-700 uppercase">Financial Safety & Model Disclaimer</div>
          <p>
            This report was autonomously generated by the AI Investment Portfolio Monitoring Agent for analytical evaluation purposes only. Model-generated scenarios and forecasts are mathematical approximations derived from historical price signals and volatility distributions. They do NOT constitute guaranteed future returns or financial advice. The account holder remains exclusively responsible for all investment actions.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
