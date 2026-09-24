import Link from 'next/link';
import {
  Cpu,
  Bot,
  TrendingUp,
  ShieldAlert,
  Compass,
  Layers,
  ArrowRight,
  ShieldCheck,
  Activity,
  CheckCircle,
  FileSpreadsheet,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F7F8FA] text-slate-900 font-sans flex flex-col justify-between">
      {/* Top Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md px-6 py-4 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center text-emerald-400">
              <Cpu className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-slate-900">
                APEX PORTFOLIO AGENT
              </span>
              <span className="text-[10px] font-mono ml-2 px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-300">
                ENTERPRISE
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-semibold px-3 py-1.5 rounded text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="text-xs font-semibold px-4 py-2 rounded bg-slate-900 hover:bg-slate-800 text-white transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <span>Launch Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-16 space-y-16 flex-1 w-full">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Vercel Serverless Architecture • Gemini 2.5 Flash Tool-Calling Engine
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            AI INVESTMENT PORTFOLIO MONITORING AGENT
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
            An autonomous quantitative monitoring agent designed for professional capital management. Continuously observes holdings, evaluates concentration risks, analyzes news sentiment, and computes multi-horizon scenario forecasts with quantified uncertainty.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-6 py-3 rounded bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs tracking-wide transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Enter Portfolio Workspace</span>
            </Link>
            <Link
              href="/analyst"
              className="w-full sm:w-auto px-6 py-3 rounded bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-semibold text-xs tracking-wide transition-all flex items-center justify-center gap-2 shadow-xs"
            >
              <Bot className="w-4 h-4 text-slate-600" />
              <span>AI Analyst Tool Engine</span>
            </Link>
          </div>

          {/* Safety Notice */}
          <div className="pt-2 text-[11px] text-slate-500 font-mono flex items-center justify-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Strict Financial Safety Principle: Zero Automated Order Routing • Analytical Monitoring Only</span>
          </div>
        </div>

        {/* 6 Core Functional Architecture Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Pillar 1: Autonomous Monitoring Loop */}
          <div className="financial-card p-6 space-y-3">
            <div className="w-9 h-9 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 tracking-tight">
              Autonomous 12-Step Monitor
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Executes continuous multi-factor audits: holding movements, concentration drifts, sentiment shifts, and drawdown checks. Prioritizes alerts using Impact × Exposure × Severity.
            </p>
          </div>

          {/* Pillar 2: 30+ Zod Tool Layer */}
          <div className="financial-card p-6 space-y-3">
            <div className="w-9 h-9 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900">
              <Bot className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 tracking-tight">
              Gemini 2.5 Tool-Calling Agent
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              A real agent architecture (Observe → Select Tools → Fetch Data → Analyze → Risk Check → Synthesize). All numerical metrics are computed deterministically rather than hallucinated.
            </p>
          </div>

          {/* Pillar 3: Quantitative Risk Engine */}
          <div className="financial-card p-6 space-y-3">
            <div className="w-9 h-9 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 tracking-tight">
              Deterministic Quantitative Risk
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Computes Annualized Volatility, Maximum Drawdown, Sharpe Ratio (vs 4.5% risk-free rate), Beta against SPY, and Herfindahl-Hirschman (HHI) Concentration Index.
            </p>
          </div>

          {/* Pillar 4: Statistical Forecast Ensemble */}
          <div className="financial-card p-6 space-y-3">
            <div className="w-9 h-9 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900">
              <Compass className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 tracking-tight">
              Multi-Horizon Scenario Forecasts
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Ensemble of Linear Regression, Realized Volatility Diffusion, 14-day RSI, and MACD Momentum. Generates Bull, Base, and Bear scenarios with explicit confidence bounds.
            </p>
          </div>

          {/* Pillar 5: CSV Ingestion with Inline Validation */}
          <div className="financial-card p-6 space-y-3">
            <div className="w-9 h-9 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 tracking-tight">
              CSV Validation & Ingestion
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Drag-and-drop brokerage CSV imports with header normalization, error detection, duplicate identification, and inline correction before committing to database.
            </p>
          </div>

          {/* Pillar 6: Vercel & Supabase Architecture */}
          <div className="financial-card p-6 space-y-3">
            <div className="w-9 h-9 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 tracking-tight">
              Vercel Serverless Ready
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Designed for zero-server persistent dependencies. Next.js App Router route handlers, Supabase PostgreSQL Row Level Security, and resilient mock store fallback.
            </p>
          </div>
        </div>

        {/* Terminal Teaser Table */}
        <div className="financial-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Pre-Configured Core Equity Portfolio
              </h2>
              <p className="text-xs text-slate-500">Live test data ready for immediate evaluation</p>
            </div>
            <Link
              href="/dashboard"
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
            >
              <span>Explore Live Models</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-[10px] uppercase text-slate-500 block font-semibold">Active Value</span>
              <span className="font-mono text-base font-bold text-slate-900">$51,324.75</span>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-[10px] uppercase text-slate-500 block font-semibold">Net Unrealized P/L</span>
              <span className="font-mono text-base font-bold text-emerald-700">+$6,412.35 (+14.28%)</span>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-[10px] uppercase text-slate-500 block font-semibold">Risk Classification</span>
              <span className="font-mono text-base font-bold text-slate-900">MODERATE GROWTH</span>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-[10px] uppercase text-slate-500 block font-semibold">Concentration HHI</span>
              <span className="font-mono text-base font-bold text-slate-900">2,254 (Tech Weight 54%)</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">APEX PORTFOLIO AGENT</span>
            <span>•</span>
            <span>Production Serverless Financial Intelligence</span>
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            Next.js App Router • Supabase RLS • Gemini 2.5 Flash • Vercel Compatible
          </div>
        </div>
      </footer>
    </div>
  );
}
