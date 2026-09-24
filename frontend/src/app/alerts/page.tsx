'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Bell, CheckCircle, RefreshCw, Filter, ShieldAlert, Check } from 'lucide-react';
import { Alert } from '@/lib/supabase/mock-store';
import { formatDate } from '@/lib/utils/formatters';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [isAuditing, setIsAuditing] = useState(false);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/alerts');
      const data = await res.json();
      setAlerts(data.alerts || []);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleMarkRead = async (alertId: string) => {
    try {
      const res = await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId }),
      });
      if (res.ok) {
        setAlerts(prev => prev.map(a => (a.id === alertId ? { ...a, is_read: true } : a)));
      }
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleRunAudit = async () => {
    setIsAuditing(true);
    try {
      await fetch('/api/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolioId: 'port-demo-001' }),
      });
      await fetchAlerts();
    } catch (err) {
      console.error('Audit failed:', err);
    } finally {
      setIsAuditing(false);
    }
  };

  const filtered = alerts.filter(a => {
    if (filterSeverity === 'ALL') return true;
    return a.severity === filterSeverity;
  });

  return (
    <AppShell
      title="Intelligent Alerts & Risk Notifications"
      subtitle="Prioritized events evaluated by the autonomous agent: Impact × Portfolio Exposure × Event Severity"
    >
      {/* Control Bar */}
      <div className="financial-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="font-semibold text-slate-700 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" /> Filter:
          </span>
          {(['ALL', 'HIGH_PRIORITY', 'IMPORTANT', 'WATCH', 'INFO'] as const).map(sev => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                filterSeverity === sev
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {sev.replace('_', ' ')}
            </button>
          ))}
        </div>

        <button
          onClick={handleRunAudit}
          disabled={isAuditing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
          <span>{isAuditing ? 'Auditing Portfolio...' : 'Trigger Agent Audit'}</span>
        </button>
      </div>

      {/* Alerts Stream */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-2">
          <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-500 font-mono">Loading active alerts...</span>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((alert, idx) => (
            <div
              key={`${alert.id}-${idx}`}
              className={`financial-card p-5 border-l-4 transition-colors ${
                alert.severity === 'HIGH_PRIORITY' ? 'border-l-red-600' :
                alert.severity === 'IMPORTANT' ? 'border-l-amber-600' :
                alert.severity === 'WATCH' ? 'border-l-blue-600' :
                'border-l-slate-400'
              } ${alert.is_read ? 'opacity-70 bg-slate-50/50' : 'bg-white'}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      alert.severity === 'HIGH_PRIORITY' ? 'bg-red-100 text-red-800' :
                      alert.severity === 'IMPORTANT' ? 'bg-amber-100 text-amber-800' :
                      alert.severity === 'WATCH' ? 'bg-blue-100 text-blue-800' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {alert.severity.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Category: {alert.category}
                    </span>
                    {alert.is_read && (
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                        READ
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm tracking-tight">{alert.title}</h3>
                </div>

                {!alert.is_read && (
                  <button
                    onClick={() => handleMarkRead(alert.id)}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium shrink-0 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Mark as Read</span>
                  </button>
                )}
              </div>

              <p className="text-xs text-slate-700 leading-relaxed max-w-4xl">
                {alert.message}
              </p>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>Timestamp: {formatDate(alert.created_at)}</span>
                <span>Prioritization Score: Evaluated</span>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="financial-card p-12 text-center text-xs text-slate-500">
              No alerts match the selected priority filter.
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
