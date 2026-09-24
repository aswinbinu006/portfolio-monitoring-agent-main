'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Briefcase,
  Layers,
  TrendingUp,
  Bookmark,
  Bot,
  Compass,
  ShieldAlert,
  Bell,
  FileText,
  Settings,
  Activity,
  Cpu,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/portfolio', label: 'Portfolios', icon: Briefcase },
  { href: '/holdings', label: 'Holdings & CSV', icon: Layers },
  { href: '/markets', label: 'Market Intelligence', icon: TrendingUp },
  { href: '/watchlist', label: 'Watchlist', icon: Bookmark },
  { href: '/analyst', label: 'AI Portfolio Analyst', icon: Bot, badge: 'Agent' },
  { href: '/forecasts', label: 'Forecasts & Scenarios', icon: Compass },
  { href: '/risk', label: 'Risk & Concentration', icon: ShieldAlert },
  { href: '/alerts', label: 'Alerts Center', icon: Bell },
  { href: '/reports', label: 'Executive Reports', icon: FileText },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col shrink-0 min-h-screen no-print">
      {/* Platform Branding */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 font-bold text-sm tracking-wider">
            <Cpu className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="font-semibold text-sm tracking-tight text-white flex items-center gap-1.5">
              APEX AGENT
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                PRO
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">Portfolio Intelligence</div>
          </div>
        </Link>
      </div>

      {/* Agent Monitoring Status Badge */}
      <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-800/80">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-slate-400 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Agent Engine
          </span>
          <span className="font-mono text-emerald-400 text-[11px]">ACTIVE</span>
        </div>
        <div className="text-[11px] text-slate-400">
          Autonomous 12-step monitoring audit ready
        </div>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 px-3 pb-1">
          Navigation
        </div>
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-slate-800 text-white font-semibold border-l-2 border-emerald-400 pl-2.5'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-blue-900/60 text-blue-300 border border-blue-700/60">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Architecture Footer */}
      <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
        <div className="flex items-center justify-between">
          <span>Deployment</span>
          <span className="font-mono text-slate-300">Vercel Serverless</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Reasoning LLM</span>
          <span className="font-mono text-slate-300">Gemini 2.5 Flash</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Storage</span>
          <span className="font-mono text-slate-300">Supabase PG + RLS</span>
        </div>
      </div>
    </aside>
  );
}
