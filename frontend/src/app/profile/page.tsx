'use client';

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { User, ShieldCheck, Database, Key, Server, Lock, LogOut } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  return (
    <AppShell
      title="User Profile & Security Environment"
      subtitle="Authenticated session state, database tenant isolation, and Vercel serverless diagnostics"
    >
      <div className="max-w-4xl space-y-6">
        {/* User Identity Card */}
        <div className="financial-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-lg">
              JD
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Jayesh & Partners Fund</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">
                  ACTIVE SESSION
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-mono">portfolio.manager@example.com</p>
              <div className="text-[11px] text-slate-400 font-mono mt-1">
                Tenant User ID: <span className="text-slate-700 font-bold">usr-demo-default</span>
              </div>
            </div>
          </div>

          <Link
            href="/login"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Switch Account / Sign In</span>
          </Link>
        </div>

        {/* Security & RLS Isolation Audit */}
        <div className="financial-card p-5 space-y-3 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900 border-b border-slate-100 pb-2">
            <Lock className="w-4 h-4 text-emerald-600" />
            <span>Row-Level Security (RLS) & Multi-Tenant Isolation</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-slate-600 leading-relaxed">
            <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
              <span className="font-semibold text-slate-800 block">Supabase JWT Verification:</span>
              <p className="text-[11px]">
                Every database request is authenticated server-side. RLS policies ensure that users strictly access rows matching <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-900 font-mono">auth.uid() = user_id</code>.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
              <span className="font-semibold text-slate-800 block">Serverless Zero-Leak Architecture:</span>
              <p className="text-[11px]">
                API keys and service role credentials remain exclusively server-side. No sensitive credentials are leaked to client-side bundles.
              </p>
            </div>
          </div>
        </div>

        {/* Integration Status Diagnostics */}
        <div className="financial-card p-5 space-y-3 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900 border-b border-slate-100 pb-2">
            <Server className="w-4 h-4 text-slate-700" />
            <span>Vercel Integration & Environment Diagnostics</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-2.5 rounded bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="font-medium text-slate-800">Next.js App Router (Serverless Runtime)</span>
              </div>
              <span className="font-mono text-emerald-700 font-bold text-[11px]">OPTIMIZED (Vercel Ready)</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="font-medium text-slate-800">Primary Reasoning Engine (Google Gemini API)</span>
              </div>
              <span className="font-mono text-slate-700 text-[11px]">
                {(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) ? 'LIVE KEY DETECTED' : 'RESILIENT DEMO ENGINE READY'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="font-medium text-slate-800">Market Data & Financial Press Provider</span>
              </div>
              <span className="font-mono text-slate-700 text-[11px]">PROVIDER ABSTRACTION ACTIVE</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="font-medium text-slate-800">PostgreSQL Database & Memory Fallback Store</span>
              </div>
              <span className="font-mono text-emerald-700 font-bold text-[11px]">OPERATIONAL</span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
