"use client";

import React, { useState } from "react";
import Link from "next/link";

interface ChartDataPoint {
  date: string;
  value: number;
}

const TIMEFRAME_DATA: Record<string, { change: string; percent: string; isGain: boolean; data: ChartDataPoint[] }> = {
  "1D": {
    change: "+$1,840.25",
    percent: "+1.30%",
    isGain: true,
    data: [
      { date: "09:30", value: 141010 },
      { date: "10:30", value: 141450 },
      { date: "11:30", value: 141200 },
      { date: "12:30", value: 141850 },
      { date: "13:30", value: 142100 },
      { date: "14:30", value: 142400 },
      { date: "15:30", value: 142650 },
      { date: "16:00", value: 142850 },
    ],
  },
  "1W": {
    change: "+$3,620.10",
    percent: "+2.60%",
    isGain: true,
    data: [
      { date: "Mon", value: 139230 },
      { date: "Tue", value: 139800 },
      { date: "Wed", value: 140450 },
      { date: "Thu", value: 141200 },
      { date: "Fri", value: 142850 },
    ],
  },
  "1M": {
    change: "+$8,410.50",
    percent: "+6.25%",
    isGain: true,
    data: [
      { date: "W1", value: 134440 },
      { date: "W2", value: 136200 },
      { date: "W3", value: 138900 },
      { date: "W4", value: 142850 },
    ],
  },
  "1Y": {
    change: "+$28,520.00",
    percent: "+24.80%",
    isGain: true,
    data: [
      { date: "Q1", value: 114330 },
      { date: "Q2", value: 122400 },
      { date: "Q3", value: 131800 },
      { date: "Q4", value: 142850 },
    ],
  },
  ALL: {
    change: "+$52,140.00",
    percent: "+57.45%",
    isGain: true,
    data: [
      { date: "2023", value: 90710 },
      { date: "2024", value: 112400 },
      { date: "2025", value: 128900 },
      { date: "2026", value: 142850 },
    ],
  },
};

export default function HomePage() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<"1D" | "1W" | "1M" | "1Y" | "ALL">("1M");
  const [hoveredPoint, setHoveredPoint] = useState<ChartDataPoint | null>(null);

  const activeData = TIMEFRAME_DATA[selectedTimeframe];
  const chartPoints = activeData.data;

  // Chart coordinates mapping (SVG 500x180)
  const minVal = Math.min(...chartPoints.map((d) => d.value));
  const maxVal = Math.max(...chartPoints.map((d) => d.value));
  const range = maxVal - minVal || 1;

  const getSvgCoordinates = () => {
    const width = 460;
    const height = 130;
    const paddingX = 20;
    const paddingY = 15;

    return chartPoints.map((pt, idx) => {
      const x = paddingX + (idx / (chartPoints.length - 1)) * (width - 2 * paddingX);
      const y = height - paddingY - ((pt.value - minVal) / range) * (height - 2 * paddingY);
      return { x, y, pt };
    });
  };

  const coords = getSvgCoordinates();
  const pathD = coords.reduce((acc, c, i) => `${acc} ${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`, "");
  const areaD = `${pathD} L ${coords[coords.length - 1].x.toFixed(1)} 145 L ${coords[0].x.toFixed(1)} 145 Z`;

  return (
    <div className="w-full bg-[#F8FAFC] dark:bg-[#0B0F19] text-[#0F172A] dark:text-slate-100 transition-colors">
      {/* ==================================================================== */}
      {/* 2. HERO SECTION */}
      {/* ==================================================================== */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-28 lg:pt-20 lg:pb-32">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
            {/* Left Column: Headline, Subheadline, Buttons & Trust Chips */}
            <div className="lg:col-span-6 space-y-8">
              {/* Category Eyebrow */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFFFFF] dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#059669]" />
                <span className="text-[13px] font-semibold text-[#64748B] dark:text-slate-300">
                  Precision Investment Analytics
                </span>
              </div>

              {/* H1 Heading: 64px desktop, bold, tight line height */}
              <h1 className="text-4xl sm:text-5xl lg:text-[64px] font-bold text-[#0F172A] dark:text-white tracking-tight leading-[1.06]">
                Monitor Your Investments with Confidence
              </h1>

              {/* Subheadline: 18px Body */}
              <p className="text-[18px] text-[#64748B] dark:text-slate-300 leading-relaxed max-w-xl">
                Track your portfolio, understand risk, monitor performance, and stay informed with real-time market insights.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-1">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center text-[15px] font-medium text-white bg-[#1E3A8A] hover:bg-[#0F172A] dark:bg-blue-600 dark:hover:bg-blue-500 px-6 py-3.5 rounded-[14px] shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer"
                >
                  Get Started
                </Link>

                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center text-[15px] font-medium text-[#0F172A] dark:text-white bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 hover:bg-[#F1F5F9] dark:hover:bg-slate-700 px-6 py-3.5 rounded-[14px] shadow-xs hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer"
                >
                  View Demo
                </Link>
              </div>

              {/* Three Small Trust Indicators (Icon-Text Chips) */}
              <div className="pt-2 flex flex-wrap items-center gap-3 text-[13px] text-[#0F172A] dark:text-slate-300">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFFFFF] dark:bg-slate-800/80 border border-[#E2E8F0] dark:border-slate-700 shadow-xs">
                  <svg className="w-3.5 h-3.5 text-[#059669]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="font-medium">Real-Time Market Data</span>
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFFFFF] dark:bg-slate-800/80 border border-[#E2E8F0] dark:border-slate-700 shadow-xs">
                  <svg className="w-3.5 h-3.5 text-[#2563EB]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="font-medium">Risk Monitoring</span>
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFFFFF] dark:bg-slate-800/80 border border-[#E2E8F0] dark:border-slate-700 shadow-xs">
                  <svg className="w-3.5 h-3.5 text-[#1E3A8A] dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="font-medium">Performance Analytics</span>
                </div>
              </div>
            </div>

            {/* Right Column: Premium Fintech Dashboard Mockup */}
            <div className="lg:col-span-6">
              <div className="bg-[#FFFFFF] dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-[14px] shadow-card p-6 space-y-6">
                {/* Mockup Header Row */}
                <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#059669] animate-pulse" />
                    <span className="text-[13px] font-semibold text-[#0F172A] dark:text-white">
                      Live Portfolio View
                    </span>
                    <span className="text-[12px] text-[#64748B] dark:text-slate-400 hidden sm:inline">
                      • Updated just now
                    </span>
                  </div>

                  {/* Timeframe Buttons */}
                  <div className="flex items-center bg-[#F1F5F9] dark:bg-slate-800 p-1 rounded-[10px]">
                    {(["1D", "1W", "1M", "1Y", "ALL"] as const).map((tf) => (
                      <button
                        key={tf}
                        onClick={() => {
                          setSelectedTimeframe(tf);
                          setHoveredPoint(null);
                        }}
                        className={`px-2.5 py-1 text-[12px] font-semibold rounded-[8px] transition-colors ${
                          selectedTimeframe === tf
                            ? "bg-white dark:bg-slate-700 text-[#0F172A] dark:text-white shadow-xs"
                            : "text-[#64748B] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white"
                        }`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Portfolio Value & Gain Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <span className="text-[12px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-slate-400">
                      Total Portfolio Value
                    </span>
                    <div className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0F172A] dark:text-white tabular-nums mt-1">
                      $142,850.40
                    </div>
                  </div>

                  <div className="flex sm:flex-col justify-between sm:justify-center items-start sm:items-end gap-1">
                    <div className="flex items-center gap-1.5 text-[14px] font-semibold text-[#059669]">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                      <span>{hoveredPoint ? `$${hoveredPoint.value.toLocaleString()}` : activeData.change}</span>
                    </div>
                    <span className="text-[12px] text-[#64748B] dark:text-slate-400">
                      {hoveredPoint ? `Snapshot (${hoveredPoint.date})` : `${activeData.percent} (${selectedTimeframe})`}
                    </span>
                  </div>
                </div>

                {/* SVG Performance Chart */}
                <div className="relative pt-2">
                  <svg
                    className="w-full h-36 overflow-visible"
                    viewBox="0 0 460 145"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563EB" stopOpacity="0.14" />
                        <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Subtle horizontal grid lines */}
                    <line x1="20" y1="25" x2="440" y2="25" stroke="#E2E8F0" strokeDasharray="3 3" className="dark:stroke-slate-800" />
                    <line x1="20" y1="75" x2="440" y2="75" stroke="#E2E8F0" strokeDasharray="3 3" className="dark:stroke-slate-800" />
                    <line x1="20" y1="125" x2="440" y2="125" stroke="#E2E8F0" strokeDasharray="3 3" className="dark:stroke-slate-800" />

                    {/* Shaded Area */}
                    <path d={areaD} fill="url(#chartGradient)" />

                    {/* Crisp Line */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#2563EB"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Interactive Data Dots */}
                    {coords.map((c, i) => (
                      <g key={i} className="cursor-pointer">
                        <circle
                          cx={c.x}
                          cy={c.y}
                          r={hoveredPoint?.date === c.pt.date ? "5" : "3.5"}
                          className="fill-white stroke-[#2563EB] transition-all"
                          strokeWidth="2.5"
                          onMouseEnter={() => setHoveredPoint(c.pt)}
                          onMouseLeave={() => setHoveredPoint(null)}
                        />
                      </g>
                    ))}
                  </svg>

                  {/* Horizontal Axis Labels */}
                  <div className="flex justify-between px-2 pt-2 text-[11px] text-[#64748B] dark:text-slate-400 font-mono">
                    {chartPoints.map((p) => (
                      <span key={p.date}>{p.date}</span>
                    ))}
                  </div>
                </div>

                {/* Bottom Snapshot: Allocation & Mini Holdings */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#E2E8F0] dark:border-slate-800">
                  {/* Allocation Segment */}
                  <div className="space-y-2">
                    <span className="text-[12px] font-semibold text-[#0F172A] dark:text-white uppercase tracking-wider">
                      Asset Allocation
                    </span>
                    <div className="w-full h-2.5 rounded-full bg-[#F1F5F9] dark:bg-slate-800 flex overflow-hidden">
                      <div className="h-full bg-[#1E3A8A]" style={{ width: "58%" }} title="Equities 58%" />
                      <div className="h-full bg-[#2563EB]" style={{ width: "22%" }} title="Tech 22%" />
                      <div className="h-full bg-[#059669]" style={{ width: "12%" }} title="Fixed Income 12%" />
                      <div className="h-full bg-[#CBD5E1]" style={{ width: "8%" }} title="Cash 8%" />
                    </div>
                    <div className="flex justify-between text-[11px] text-[#64748B] dark:text-slate-400">
                      <span>Equities 58%</span>
                      <span>Tech 22%</span>
                      <span>Bonds 12%</span>
                    </div>
                  </div>

                  {/* Mini Holdings Snapshot */}
                  <div className="space-y-1.5">
                    <span className="text-[12px] font-semibold text-[#0F172A] dark:text-white uppercase tracking-wider">
                      Active Positions
                    </span>
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="font-semibold text-[#0F172A] dark:text-white">AAPL (Apple)</span>
                      <span className="font-mono text-[#059669] font-medium">+1.8%</span>
                    </div>
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="font-semibold text-[#0F172A] dark:text-white">NVDA (Nvidia)</span>
                      <span className="font-mono text-[#059669] font-medium">+3.4%</span>
                    </div>
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="font-semibold text-[#0F172A] dark:text-white">AMZN (Amazon)</span>
                      <span className="font-mono text-[#DC2626] font-medium">-0.4%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 3. FEATURES SECTION */}
      {/* ==================================================================== */}
      <section id="features" className="py-20 lg:py-28 bg-[#FFFFFF] dark:bg-slate-900 border-t border-[#E2E8F0] dark:border-slate-800 transition-colors">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-6 lg:px-8 space-y-14">
          {/* Header */}
          <div className="max-w-2xl text-left space-y-3">
            <span className="text-[13px] font-semibold uppercase tracking-wider text-[#2563EB]">
              Core Capabilities
            </span>
            <h2 className="text-3xl sm:text-[40px] font-bold text-[#0F172A] dark:text-white tracking-tight leading-tight">
              Everything You Need to Stay on Top of Your Portfolio
            </h2>
            <p className="text-[18px] text-[#64748B] dark:text-slate-300 leading-relaxed">
              Engineered with institutional rigor and consumer-grade clarity for modern equity investors.
            </p>
          </div>

          {/* Five Equal Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-7 bg-[#F8FAFC] dark:bg-slate-800/60 border border-[#E2E8F0] dark:border-slate-700/80 rounded-[14px] shadow-xs hover:-translate-y-1 hover:shadow-card transition-all duration-200 space-y-4">
              <div className="w-11 h-11 rounded-[12px] bg-white dark:bg-slate-700 border border-[#E2E8F0] dark:border-slate-600 flex items-center justify-center text-[#1E3A8A] dark:text-blue-400 shadow-xs">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-[18px] font-bold text-[#0F172A] dark:text-white">
                Portfolio Tracking
              </h3>
              <p className="text-[14px] text-[#64748B] dark:text-slate-300 leading-relaxed">
                Consolidate multi-asset positions with real-time valuation, automated cost-basis tracking, and live cash balances.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-7 bg-[#F8FAFC] dark:bg-slate-800/60 border border-[#E2E8F0] dark:border-slate-700/80 rounded-[14px] shadow-xs hover:-translate-y-1 hover:shadow-card transition-all duration-200 space-y-4">
              <div className="w-11 h-11 rounded-[12px] bg-white dark:bg-slate-700 border border-[#E2E8F0] dark:border-slate-600 flex items-center justify-center text-[#2563EB] shadow-xs">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-[18px] font-bold text-[#0F172A] dark:text-white">
                Risk Monitoring
              </h3>
              <p className="text-[14px] text-[#64748B] dark:text-slate-300 leading-relaxed">
                Continuously evaluate portfolio Value-at-Risk, peak drawdown limits, and concentration exposures against your targets.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-7 bg-[#F8FAFC] dark:bg-slate-800/60 border border-[#E2E8F0] dark:border-slate-700/80 rounded-[14px] shadow-xs hover:-translate-y-1 hover:shadow-card transition-all duration-200 space-y-4">
              <div className="w-11 h-11 rounded-[12px] bg-white dark:bg-slate-700 border border-[#E2E8F0] dark:border-slate-600 flex items-center justify-center text-[#059669] shadow-xs">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <h3 className="text-[18px] font-bold text-[#0F172A] dark:text-white">
                Performance Analytics
              </h3>
              <p className="text-[14px] text-[#64748B] dark:text-slate-300 leading-relaxed">
                Measure benchmark-adjusted alpha, time-weighted returns, and sector-by-sector attribution with institutional accuracy.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-7 bg-[#F8FAFC] dark:bg-slate-800/60 border border-[#E2E8F0] dark:border-slate-700/80 rounded-[14px] shadow-xs hover:-translate-y-1 hover:shadow-card transition-all duration-200 space-y-4">
              <div className="w-11 h-11 rounded-[12px] bg-white dark:bg-slate-700 border border-[#E2E8F0] dark:border-slate-600 flex items-center justify-center text-[#D97706] shadow-xs">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="text-[18px] font-bold text-[#0F172A] dark:text-white">
                Smart Alerts
              </h3>
              <p className="text-[14px] text-[#64748B] dark:text-slate-300 leading-relaxed">
                Receive instant notifications when asset allocations drift or price volatility breaches your specified tolerance bounds.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-7 bg-[#F8FAFC] dark:bg-slate-800/60 border border-[#E2E8F0] dark:border-slate-700/80 rounded-[14px] shadow-xs hover:-translate-y-1 hover:shadow-card transition-all duration-200 space-y-4 md:col-span-2 lg:col-span-1">
              <div className="w-11 h-11 rounded-[12px] bg-white dark:bg-slate-700 border border-[#E2E8F0] dark:border-slate-600 flex items-center justify-center text-[#1E3A8A] dark:text-blue-400 shadow-xs">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <h3 className="text-[18px] font-bold text-[#0F172A] dark:text-white">
                Market Insights
              </h3>
              <p className="text-[14px] text-[#64748B] dark:text-slate-300 leading-relaxed">
                Stay informed with curated macro context, earnings catalysts, and actionable intelligence mapped to your holdings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 4. PORTFOLIO SHOWCASE SECTION */}
      {/* ==================================================================== */}
      <section className="py-20 lg:py-28 bg-[#F8FAFC] dark:bg-[#0B0F19] border-t border-[#E2E8F0] dark:border-slate-800 transition-colors">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left: Phone Mockup */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-[320px] bg-white dark:bg-slate-900 border-4 border-[#0F172A] dark:border-slate-700 rounded-[36px] shadow-2xl overflow-hidden p-5 space-y-4">
                {/* Speaker Notch */}
                <div className="w-20 h-3 bg-[#0F172A] dark:bg-slate-700 rounded-full mx-auto" />

                {/* Mobile App Header */}
                <div className="flex items-center justify-between pt-1">
                  <div className="text-[13px] font-bold text-[#0F172A] dark:text-white">
                    Holdings Overview
                  </div>
                  <span className="w-2 h-2 rounded-full bg-[#059669]" />
                </div>

                {/* Mobile Balance Card */}
                <div className="p-3.5 bg-[#F1F5F9] dark:bg-slate-800 rounded-[14px] space-y-1">
                  <span className="text-[11px] text-[#64748B] dark:text-slate-400 font-medium">Net Valuation</span>
                  <div className="text-xl font-bold text-[#0F172A] dark:text-white tabular-nums">
                    $142,850.40
                  </div>
                  <div className="text-[12px] font-semibold text-[#059669]">
                    +$1,840.25 (+1.30%) Today
                  </div>
                </div>

                {/* Mini Allocation Pill */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-[#64748B] dark:text-slate-400 font-semibold uppercase">
                    <span>Equities 80%</span>
                    <span>Bonds 20%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#E2E8F0] dark:bg-slate-800 flex overflow-hidden">
                    <div className="h-full bg-[#1E3A8A]" style={{ width: "80%" }} />
                    <div className="h-full bg-[#059669]" style={{ width: "20%" }} />
                  </div>
                </div>

                {/* Mobile Holdings List */}
                <div className="space-y-2 pt-1">
                  <div className="p-2.5 rounded-[10px] border border-[#E2E8F0] dark:border-slate-800 flex items-center justify-between text-[12px]">
                    <div>
                      <div className="font-bold text-[#0F172A] dark:text-white">AAPL</div>
                      <div className="text-[10px] text-[#64748B]">45 shares</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-[#0F172A] dark:text-white">$8,525.25</div>
                      <div className="text-[10px] text-[#059669] font-semibold">+3.9%</div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-[10px] border border-[#E2E8F0] dark:border-slate-800 flex items-center justify-between text-[12px]">
                    <div>
                      <div className="font-bold text-[#0F172A] dark:text-white">NVDA</div>
                      <div className="text-[10px] text-[#64748B]">60 shares</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-[#0F172A] dark:text-white">$7,476.00</div>
                      <div className="text-[10px] text-[#059669] font-semibold">+9.4%</div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-[10px] border border-[#E2E8F0] dark:border-slate-800 flex items-center justify-between text-[12px]">
                    <div>
                      <div className="font-bold text-[#0F172A] dark:text-white">MSFT</div>
                      <div className="text-[10px] text-[#64748B]">30 shares</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-[#0F172A] dark:text-white">$12,843.00</div>
                      <div className="text-[10px] text-[#059669] font-semibold">+1.5%</div>
                    </div>
                  </div>
                </div>

                {/* Home Indicator */}
                <div className="w-24 h-1 bg-[#CBD5E1] dark:bg-slate-700 rounded-full mx-auto mt-3" />
              </div>
            </div>

            {/* Right: Pitch & Bullets */}
            <div className="lg:col-span-7 space-y-6">
              <span className="text-[13px] font-semibold uppercase tracking-wider text-[#2563EB]">
                Responsive Surveillance
              </span>
              <h2 className="text-3xl sm:text-[40px] font-bold text-[#0F172A] dark:text-white tracking-tight leading-tight">
                Clear Insights. Better Decisions.
              </h2>
              <p className="text-[18px] text-[#64748B] dark:text-slate-300 leading-relaxed">
                Whether tracking holdings from your desk or reviewing portfolio health on mobile, Portfolio Monitor delivers unbroken situational awareness.
              </p>

              {/* Three Bullets */}
              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#ECFDF5] dark:bg-emerald-950/60 border border-[#A7F3D0] dark:border-emerald-800 text-[#059669] flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-[15px] font-bold text-[#0F172A] dark:text-white">
                      Unified Asset Visibility
                    </h4>
                    <p className="text-[14px] text-[#64748B] dark:text-slate-300">
                      Consolidate domestic equities, international stocks, and cash reserves in a single clean dashboard without fragmented logins.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#ECFDF5] dark:bg-emerald-950/60 border border-[#A7F3D0] dark:border-emerald-800 text-[#059669] flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-[15px] font-bold text-[#0F172A] dark:text-white">
                      Automated Rebalancing Thresholds
                    </h4>
                    <p className="text-[14px] text-[#64748B] dark:text-slate-300">
                      Spot target allocation drift before risk profiles diverge, allowing timely rebalancing aligned with your investment mandate.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#ECFDF5] dark:bg-emerald-950/60 border border-[#A7F3D0] dark:border-emerald-800 text-[#059669] flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-[15px] font-bold text-[#0F172A] dark:text-white">
                      Stress-Tested Exposure Metrics
                    </h4>
                    <p className="text-[14px] text-[#64748B] dark:text-slate-300">
                      Understand how macroeconomic interest rate adjustments and volatility shocks impact portfolio resilience and risk-adjusted returns.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center text-[15px] font-medium text-white bg-[#1E3A8A] hover:bg-[#0F172A] dark:bg-blue-600 dark:hover:bg-blue-500 px-6 py-3.5 rounded-[14px] shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer"
                >
                  Explore Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 5. WHY CHOOSE THIS PLATFORM */}
      {/* ==================================================================== */}
      <section id="why-choose" className="py-20 lg:py-28 bg-[#F1F5F9] dark:bg-slate-900/60 border-t border-[#E2E8F0] dark:border-slate-800 transition-colors">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left: Short Paragraph */}
            <div className="lg:col-span-5 space-y-4">
              <span className="text-[13px] font-semibold uppercase tracking-wider text-[#2563EB]">
                Engineered for Precision
              </span>
              <h2 className="text-3xl sm:text-[40px] font-bold text-[#0F172A] dark:text-white tracking-tight leading-tight">
                A Platform Built for Modern Investors
              </h2>
              <p className="text-[18px] text-[#64748B] dark:text-slate-300 leading-relaxed">
                Most portfolio tools are either too simplistic for serious investors or excessively convoluted with institutional clutter. Portfolio Monitor bridges the gap—delivering institutional-grade analytics with consumer-grade speed, elegance, and clarity.
              </p>
            </div>

            {/* Right: Checklist */}
            <div className="lg:col-span-7 bg-[#FFFFFF] dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-[14px] p-8 shadow-xs space-y-4">
              {[
                { title: "Real-time updates", desc: "Sub-second price updates and automated portfolio revaluations throughout active market hours." },
                { title: "Diversification analysis", desc: "Detailed breakdown across sectors, asset classes, and concentration weights to eliminate unrewarded risk." },
                { title: "Volatility monitoring", desc: "Downside risk calculations and volatility regime tracking to maintain capital stability." },
                { title: "Interactive dashboards", desc: "Modular, responsive data views and interactive charts designed for rapid inspection." },
                { title: "Secure architecture", desc: "Encrypted session tokens, authenticated workspace storage, and zero credential sharing." },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3.5 pb-3.5 border-b border-[#E2E8F0] dark:border-slate-700 last:border-none last:pb-0">
                  <div className="w-5 h-5 rounded-full bg-[#ECFDF5] dark:bg-emerald-950/60 border border-[#A7F3D0] dark:border-emerald-800 text-[#059669] flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-[15px] font-bold text-[#0F172A] dark:text-white">
                      {item.title}
                    </h4>
                    <p className="text-[14px] text-[#64748B] dark:text-slate-300 mt-0.5">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 6. HOW IT WORKS */}
      {/* ==================================================================== */}
      <section id="how-it-works" className="py-20 lg:py-28 bg-[#FFFFFF] dark:bg-slate-900 border-t border-[#E2E8F0] dark:border-slate-800 transition-colors">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-6 lg:px-8 space-y-16 text-center">
          {/* Header */}
          <div className="max-w-2xl mx-auto space-y-3">
            <span className="text-[13px] font-semibold uppercase tracking-wider text-[#2563EB]">
              Simple Onboarding
            </span>
            <h2 className="text-3xl sm:text-[40px] font-bold text-[#0F172A] dark:text-white tracking-tight leading-tight">
              Get Started in Three Simple Steps
            </h2>
            <p className="text-[18px] text-[#64748B] dark:text-slate-300 leading-relaxed">
              Transition from fragmented spreadsheets to continuous portfolio surveillance in under two minutes.
            </p>
          </div>

          {/* Three Connected Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="p-8 bg-[#F8FAFC] dark:bg-slate-800/60 border border-[#E2E8F0] dark:border-slate-700 rounded-[14px] space-y-5 text-center relative shadow-xs">
              <div className="w-14 h-14 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center text-xl font-bold mx-auto shadow-xs">
                1
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">
                Create Portfolio
              </h3>
              <p className="text-[14px] text-[#64748B] dark:text-slate-300 leading-relaxed">
                Upload your positions CSV or import holdings in one click to establish your baseline asset allocation.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-8 bg-[#F8FAFC] dark:bg-slate-800/60 border border-[#E2E8F0] dark:border-slate-700 rounded-[14px] space-y-5 text-center relative shadow-xs">
              <div className="w-14 h-14 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center text-xl font-bold mx-auto shadow-xs">
                2
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">
                Track Investments
              </h3>
              <p className="text-[14px] text-[#64748B] dark:text-slate-300 leading-relaxed">
                Monitor real-time prices, sector exposure, and automated P&amp;L calculations updated throughout trading hours.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-8 bg-[#F8FAFC] dark:bg-slate-800/60 border border-[#E2E8F0] dark:border-slate-700 rounded-[14px] space-y-5 text-center relative shadow-xs">
              <div className="w-14 h-14 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center text-xl font-bold mx-auto shadow-xs">
                3
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">
                Monitor Performance
              </h3>
              <p className="text-[14px] text-[#64748B] dark:text-slate-300 leading-relaxed">
                Review periodic risk evaluations, receive proactive alerts, and make confident capital allocation decisions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 7. STATISTICS SECTION */}
      {/* ==================================================================== */}
      <section className="py-16 sm:py-20 bg-[#FFFFFF] dark:bg-slate-900 border-t border-[#E2E8F0] dark:border-slate-800 transition-colors">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-y sm:divide-y-0 sm:divide-x divide-[#E2E8F0] dark:divide-slate-800">
            {/* Stat 1 */}
            <div className="pt-4 sm:pt-0 space-y-1">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0F172A] dark:text-white tracking-tight tabular-nums">
                50K+
              </div>
              <div className="text-[14px] font-medium text-[#64748B] dark:text-slate-400">
                Portfolios Analyzed
              </div>
            </div>

            {/* Stat 2 */}
            <div className="pt-4 sm:pt-0 space-y-1">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0F172A] dark:text-white tracking-tight tabular-nums">
                99.9%
              </div>
              <div className="text-[14px] font-medium text-[#64748B] dark:text-slate-400">
                System Availability
              </div>
            </div>

            {/* Stat 3 */}
            <div className="pt-4 sm:pt-0 space-y-1">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0F172A] dark:text-white tracking-tight">
                Real-Time
              </div>
              <div className="text-[14px] font-medium text-[#64748B] dark:text-slate-400">
                Market Monitoring
              </div>
            </div>

            {/* Stat 4 */}
            <div className="pt-4 sm:pt-0 space-y-1">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0F172A] dark:text-white tracking-tight">
                24/7
              </div>
              <div className="text-[14px] font-medium text-[#64748B] dark:text-slate-400">
                Risk Detection
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 8. CALL-TO-ACTION BANNER */}
      {/* ==================================================================== */}
      <section id="pricing" className="py-16 sm:py-20 bg-[#F8FAFC] dark:bg-[#0B0F19] border-t border-[#E2E8F0] dark:border-slate-800 transition-colors">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-6 lg:px-8">
          <div className="bg-[#EFF6FF] dark:bg-slate-800/80 border border-[#DBEAFE] dark:border-slate-700 rounded-[14px] p-8 sm:p-14 lg:p-16 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xs">
            <div className="max-w-xl space-y-3 text-left">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0F172A] dark:text-white tracking-tight">
                Take Control of Your Financial Future
              </h2>
              <p className="text-[16px] text-[#64748B] dark:text-slate-300 leading-relaxed">
                Start monitoring your portfolio with institutional clarity today. Setup takes less than two minutes.
              </p>
            </div>

            <div className="shrink-0">
              <Link
                href="/login"
                className="inline-flex items-center justify-center text-[15px] font-medium text-white bg-[#1E3A8A] hover:bg-[#0F172A] dark:bg-blue-600 dark:hover:bg-blue-500 px-7 py-4 rounded-[14px] shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
