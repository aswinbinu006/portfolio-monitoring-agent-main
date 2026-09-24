'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Cpu, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      if (supabase) {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (authError) throw authError;
      }
      // Navigate to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Branding Header */}
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded bg-slate-900 flex items-center justify-center text-emerald-400 mx-auto">
            <Cpu className="w-5 h-5 text-emerald-400" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            APEX INVESTMENT MONITORING AGENT
          </h1>
          <p className="text-xs text-slate-500">
            Institutional portfolio analytics, risk modeling, and scenario intelligence
          </p>
        </div>

        {/* Login Box */}
        <div className="financial-card p-6 space-y-5 bg-white">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900">Account Sign In</h2>
            <p className="text-xs text-slate-500">Enter your credentials to access your isolated portfolio</p>
          </div>

          {error && (
            <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Corporate Email Address</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@organization.com"
                  required
                  className="w-full pl-8 pr-3 py-2 rounded border border-slate-300 focus:outline-none focus:border-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-8 pr-3 py-2 rounded border border-slate-300 focus:outline-none focus:border-slate-800"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In with Supabase Auth'}
            </button>
          </form>

          {/* 1-Click Demo Login */}
          <div className="pt-2 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={handleDemoSignIn}
              className="w-full py-2 rounded bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Enter Instant Demo Workspace (Portfolio Manager)</span>
            </button>
            <span className="text-[10px] text-slate-400 block mt-1">
              Zero configuration required • Pre-loaded with AAPL, NVDA, MSFT portfolio
            </span>
          </div>
        </div>

        {/* Switch to Signup */}
        <div className="text-center text-xs text-slate-500">
          <span>Need a new account? </span>
          <Link href="/signup" className="text-slate-900 font-semibold hover:underline">
            Register Account
          </Link>
        </div>
      </div>
    </div>
  );
}
