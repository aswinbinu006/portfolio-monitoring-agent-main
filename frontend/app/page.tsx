"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getStatus, getMarketStatus, MarketStatus } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function HomePage() {
  const [systemOnline, setSystemOnline] = useState<boolean | null>(null);
  const [marketData, setMarketData] = useState<MarketStatus | null>(null);

  useEffect(() => {
    let mounted = true;
    const checkSystem = async () => {
      try {
        await getStatus();
        if (mounted) setSystemOnline(true);
      } catch (err) {
        if (mounted) setSystemOnline(false);
      }

      try {
        const m = await getMarketStatus();
        if (mounted) setMarketData(m);
      } catch (e) {
        // quiet fallback
      }
    };
    checkSystem();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-8">
      {/* Live Market Ticker Tape */}
      <div className="w-full bg-white border border-slate-200/90 rounded-xl px-4 py-2.5 shadow-xs overflow-x-auto flex items-center gap-6 text-xs whitespace-nowrap">
        <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] flex items-center gap-1.5 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Live Tickers:
        </span>
        {marketData?.gainers_today.map((g) => (
          <div key={g.symbol} className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">{g.symbol}</span>
            <span className="font-mono text-slate-600">₹{g.price.toFixed(1)}</span>
            <span className="font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded text-[11px]">
              +{g.change_pct}%
            </span>
          </div>
        ))}
        {marketData?.losers_today.slice(0, 2).map((l) => (
          <div key={l.symbol} className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">{l.symbol}</span>
            <span className="font-mono text-slate-600">₹{l.price.toFixed(1)}</span>
            <span className="font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded text-[11px]">
              {l.change_pct}%
            </span>
          </div>
        ))}
      </div>

      {/* Hero Section */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-8 sm:p-12 shadow-sm relative overflow-hidden">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
            <span>Portfolio Intelligence v2.0</span>
            <span className="text-slate-300">•</span>
            <span>
              Engine:{" "}
              {systemOnline === true
                ? "Online"
                : systemOnline === false
                ? "Connecting..."
                : "Checking"}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Investment Portfolio <br className="hidden sm:inline" />
            Monitoring & Risk Intelligence
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl font-normal">
            An institutional-grade risk monitoring engine designed for active portfolios.
            Delivers quantitative downside metrics, multivariate anomaly detection,
            volatility forecasting, and news attribution—without trading noise.
          </p>

          <div className="pt-4 flex flex-wrap items-center gap-3">
            <Link href="/portfolio">
              <Button variant="primary" size="lg">
                Import Portfolio CSV
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="lg">
                View Live Dashboard
              </Button>
            </Link>
            <Link href="/risk">
              <Button variant="ghost" size="lg">
                Risk Analytics Suite →
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Institutional Core Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <PillarCard
          title="Portfolio Health Score"
          metric="0 — 100"
          badge="Composite Index"
          description="Multidimensional evaluation assessing diversification (HHI), volatility control, and single-stock concentration."
          href="/dashboard"
        />
        <PillarCard
          title="Downside Risk Analytics"
          metric="VaR & CVaR 95%"
          badge="RiskMetrics™"
          description="Parametric Cornish-Fisher VaR, historical drawdown duration, Sortino and Sharpe efficiency ratios."
          href="/risk"
        />
        <PillarCard
          title="Two-Stage Anomaly Detection"
          metric="z-score + Isolation Forest"
          badge="Multi-Stage"
          description="Deterministic volatility spikes combined with unsupervised multivariate ML to catch joint tail risk."
          href="/alerts"
        />
        <PillarCard
          title="Volatility Forecasting"
          metric="5-Day Horizon"
          badge="Multi-Model"
          description="Time-series cross-validated forecasts evaluated across Linear Regression, Random Forest, and XGBoost."
          href="/forecast"
        />
      </div>

      {/* Quick Start / Workflow Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Streamlined Portfolio Workflow</CardTitle>
          <span className="text-xs text-slate-500 font-medium">3-Step Onboarding</span>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white font-bold text-sm flex items-center justify-center">
                1
              </div>
              <h4 className="font-semibold text-slate-900 text-sm">Upload Positions</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Provide a simple CSV containing <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">symbol,quantity</code> or load the pre-configured 5-holding sample portfolio.
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white font-bold text-sm flex items-center justify-center">
                2
              </div>
              <h4 className="font-semibold text-slate-900 text-sm">Configure Mandate</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Select your investment tolerance (Conservative, Balanced, or Aggressive) and set custom historical lookback windows.
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white font-bold text-sm flex items-center justify-center">
                3
              </div>
              <h4 className="font-semibold text-slate-900 text-sm">Instant Analytics</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Gain immediate visibility into portfolio health, asset allocation drift, drawdown risks, and ML volatility projections.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance & Institutional Disclaimer */}
      <div className="bg-slate-100/70 border border-slate-200 rounded-xl p-4 text-xs text-slate-500 leading-relaxed flex items-start gap-3">
        <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
          ℹ
        </div>
        <div>
          <span className="font-semibold text-slate-700">Institutional Monitoring Notice: </span>
          This system is an investment analytics, risk monitoring, and anomaly detection platform. It does not execute trades, manage custody of assets, or issue mandatory buy/sell recommendations. All risk calculations follow standardized quantitative finance methodologies.
        </div>
      </div>
    </div>
  );
}

function PillarCard({
  title,
  metric,
  badge,
  description,
  href,
}: {
  title: string;
  metric: string;
  badge: string;
  description: string;
  href: string;
}) {
  return (
    <Link href={href} className="group block">
      <Card className="h-full group-hover:border-slate-400 group-hover:shadow-card transition-all">
        <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {badge}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
              {title}
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed font-normal">
              {description}
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
            <span className="text-sm font-bold text-slate-800 font-mono">
              {metric}
            </span>
            <span className="text-xs text-slate-400 group-hover:text-slate-900 transition-colors font-semibold">
              Explore →
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
