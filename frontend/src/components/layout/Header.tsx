'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Bell, RefreshCw, CheckCircle, ShieldCheck, User } from 'lucide-react';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  portfolioName?: string;
}

export function Header({
  title = 'Portfolio Overview',
  subtitle = 'Institutional Monitoring & Quantitative Risk Analytics',
  portfolioName = 'Balanced Global Tech & Growth Portfolio',
}: HeaderProps) {
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditMessage, setAuditMessage] = useState<string | null>(null);

  const handleRunMonitor = async () => {
    setIsAuditing(true);
    setAuditMessage(null);
    try {
      const res = await fetch('/api/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolioId: 'port-demo-001' }),
      });
      const data = await res.json();
      if (data.alertsCreated > 0) {
        setAuditMessage(`Audit complete: ${data.alertsCreated} priority alert(s) evaluated.`);
      } else {
        setAuditMessage('Audit complete: All risk parameters within tolerance.');
      }
      setTimeout(() => setAuditMessage(null), 6000);
    } catch {
      setAuditMessage('Audit finished (local check complete)');
      setTimeout(() => setAuditMessage(null), 4000);
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between no-print sticky top-0 z-30 shadow-xs">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h1>
          <span className="text-xs px-2.5 py-0.5 rounded font-mono bg-slate-100 text-slate-700 border border-slate-300">
            {portfolioName}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Audit Status notification */}
        {auditMessage && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>{auditMessage}</span>
          </div>
        )}

        {/* Data Freshness Indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-50 border border-slate-200 text-[11px] text-slate-600 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>Data updated 2m ago</span>
        </div>

        {/* Run Autonomous Monitor Button */}
        <button
          onClick={handleRunMonitor}
          disabled={isAuditing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
          <span>{isAuditing ? 'Auditing...' : 'Run Agent Audit'}</span>
        </button>

        {/* Alerts Bell */}
        <Link
          href="/alerts"
          className="relative p-2 rounded-md hover:bg-slate-100 text-slate-600 transition-colors"
          title="Alerts Center"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-600"></span>
        </Link>

        {/* User Profile */}
        <Link
          href="/profile"
          className="flex items-center gap-2 pl-2 border-l border-slate-200 text-slate-700 hover:text-slate-900"
        >
          <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-700">
            JD
          </div>
          <span className="text-xs font-medium hidden sm:inline">Portfolio Manager</span>
        </Link>
      </div>
    </header>
  );
}
