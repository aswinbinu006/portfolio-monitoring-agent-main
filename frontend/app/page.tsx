"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface AgentNodeInfo {
  step: string;
  name: string;
  subgraph: "Screening" | "Intelligence" | "Synthesis";
  subgraphColor: string;
  role: string;
  description: string;
  tech: string;
  highlight?: boolean;
}

const AGENTS: AgentNodeInfo[] = [
  {
    step: "01",
    name: "Market Agent",
    subgraph: "Screening",
    subgraphColor: "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800",
    role: "Data Ingestion",
    description: "Ingests price series, calculates asset-level daily returns, momentum, and volume trends across positions.",
    tech: "Yahoo Finance API & Pandas",
  },
  {
    step: "02",
    name: "Risk Agent",
    subgraph: "Screening",
    subgraphColor: "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800",
    role: "Risk Quantification",
    description: "Evaluates historical 95% Value-at-Risk (VaR) and peak-to-trough drawdown against investor mandate.",
    tech: "Deterministic Risk Calculus",
  },
  {
    step: "03",
    name: "Anomaly Agent",
    subgraph: "Screening",
    subgraphColor: "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800",
    role: "Statistical Screening",
    description: "Screens returns for statistical tail shocks (Z > 2.0σ) and variance spikes to isolate outliers.",
    tech: "EWMA Variance & Z-Scores",
  },
  {
    step: "04",
    name: "News Agent",
    subgraph: "Intelligence",
    subgraphColor: "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800",
    role: "Web Context Retrieval",
    description: "Queries live financial news for flagged anomaly assets to provide ground-truth causal explanations.",
    tech: "Tavily / DDG Web Search",
  },
  {
    step: "05",
    name: "Rebalance Agent",
    subgraph: "Intelligence",
    subgraphColor: "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800",
    role: "Allocation Drift",
    description: "Measures weight divergence between active holdings and target portfolio mandate thresholds.",
    tech: "Target Mandate Bounds",
  },
  {
    step: "06",
    name: "ML Agent",
    subgraph: "Intelligence",
    subgraphColor: "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800",
    role: "Volatility Forecasting",
    description: "Projects 5-day forward realized volatility trajectories and identifies current volatility regime shifts.",
    tech: "Rolling Volatility Forecaster",
  },
  {
    step: "07",
    name: "Writer Agent",
    subgraph: "Synthesis",
    subgraphColor: "text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800",
    role: "LLM Reasoning (Centerpiece)",
    description: "Consolidates findings from all 6 upstream agents into an actionable, grounded executive briefing memo.",
    tech: "LiteLLM / OpenAI Engine",
    highlight: true,
  },
];

export default function HomePage() {
  const [sectionVisible, setSectionVisible] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const architectureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("portfolio_agent_jwt") : null;
    setIsLoggedIn(!!token);

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setSectionVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    if (architectureRef.current) {
      observer.observe(architectureRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const scrollToArchitecture = () => {
    if (architectureRef.current) {
      architectureRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="space-y-16 py-4">
      {/* ==================================================================== */}
      {/* 1. HERO SECTION WITH VISUAL WEIGHT & AMBIENT MESH GRID */}
      {/* ==================================================================== */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-8 sm:p-14 lg:p-16 shadow-xl transition-colors">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-grid-pattern opacity-70 dark:opacity-35 pointer-events-none" />

        {/* Ambient Gradient Orbs */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[520px] h-[520px] bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 right-10 w-[380px] h-[380px] bg-emerald-500/10 dark:bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-7">
          {/* Glowing Status Pill Badge */}
          <div className="inline-flex flex-wrap items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-slate-50/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 shadow-[0_0_20px_rgba(37,99,235,0.08)] backdrop-blur-md text-xs font-semibold transition-all">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-slate-800 dark:text-slate-200">
              Subject: <strong className="text-blue-600 dark:text-blue-400">Agentic AI</strong>
            </span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="text-slate-700 dark:text-slate-300">
              Orchestrator: <strong className="text-blue-600 dark:text-blue-400">LangGraph StateGraph</strong>
            </span>
          </div>

          {/* High-Impact Typography Header */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-slate-50 tracking-tight leading-[1.12]">
            Autonomous Multi-Agent <br className="hidden sm:inline" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 dark:from-blue-400 dark:via-blue-300 dark:to-indigo-300">
              Portfolio Surveillance
            </span>
          </h1>

          {/* Subtitle Description */}
          <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto text-sm sm:text-base lg:text-lg leading-relaxed font-normal">
            Seven specialized agents collaborate sequentially through a typed state graph.
            Numerical risk screening, live web context retrieval, and volatility forecasting feed
            a Large Language Model (LLM) reasoning centerpiece to produce an executive briefing memo.
          </p>

          {/* Elevated Call-To-Action Buttons — Contextually Aware of Auth State */}
          <div className="pt-3 flex flex-wrap items-center justify-center gap-4">
            {isLoggedIn ? (
              <>
                <Link href="/portfolio" className="group">
                  <button className="relative inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 border border-blue-400/30 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer">
                    <span>Launch Portfolio Monitoring</span>
                    <svg
                      className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </Link>

                <Link href="/dashboard" className="group">
                  <button className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-sm shadow-xs transition-all duration-200 hover:-translate-y-0.5 cursor-pointer">
                    <span>View Monitoring Center</span>
                    <svg
                      className="w-4 h-4 text-slate-400 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M9 19l7-7-7-7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="group">
                  <button className="relative inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 border border-blue-400/30 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer">
                    <span>Get Started / Sign In</span>
                    <svg
                      className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </Link>

                <button
                  onClick={scrollToArchitecture}
                  className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-sm shadow-xs transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                >
                  <span>Explore 7-Agent Architecture</span>
                  <svg
                    className="w-4 h-4 text-slate-400 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 2. SEQUENTIAL GRAPH PIPELINE VISUAL FLOW BAR */}
      {/* ==================================================================== */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Pipeline Topology
            </span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Typed StateGraph Execution Chain
            </h3>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Screening</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Intelligence</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span>LLM Synthesis</span>
            </span>
          </div>
        </div>

        {/* Visual Pipeline Flow Strip */}
        <div className="bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 overflow-x-auto shadow-inner">
          <div className="flex items-center justify-between min-w-[720px] gap-2">
            {AGENTS.map((agent, idx) => (
              <React.Fragment key={agent.step}>
                <div
                  className={`flex-1 flex items-center gap-2.5 px-3 py-2 rounded-xl border text-xs transition-all ${
                    agent.highlight
                      ? "bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-700 ring-1 ring-indigo-400/20"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {agent.step}
                  </span>
                  <div className="min-w-0">
                    <div className="font-bold text-[11px] text-slate-900 dark:text-slate-100 truncate">
                      {agent.name}
                    </div>
                    <div className="text-[9px] text-slate-400 truncate">
                      {agent.role}
                    </div>
                  </div>
                </div>

                {/* Directional Connector Arrow */}
                {idx < AGENTS.length - 1 && (
                  <div className="flex-shrink-0 text-slate-300 dark:text-slate-600 px-0.5">
                    <svg className="w-4 h-4 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 3. SCROLL-TRIGGERED 7-AGENT ARCHITECTURE CARDS WITH HOVER LIFT */}
      {/* ==================================================================== */}
      <section ref={architectureRef} className="space-y-6">
        <div className="text-center space-y-1.5">
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Multi-Agent Architecture &amp; Decision Protocol
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Each agent fulfills a single bounded task, updating the shared <code className="font-mono text-blue-600 dark:text-blue-400 font-semibold">PortfolioMonitoringState</code> before passing execution downstream.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {AGENTS.map((agent, index) => {
            const isRevealed = sectionVisible;

            return (
              <div
                key={agent.step}
                style={{
                  transitionDelay: `${index * 75}ms`,
                }}
                className={`transition-all duration-500 ease-out transform ${
                  isRevealed
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8"
                }`}
              >
                <Card
                  className={`h-full flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl cursor-default ${
                    agent.highlight
                      ? "border-indigo-400 dark:border-indigo-500 ring-2 ring-indigo-500/20 bg-gradient-to-b from-indigo-50/30 to-transparent dark:from-indigo-950/20 hover:border-indigo-500"
                      : "border-slate-200 dark:border-slate-800 hover:border-blue-500/70 dark:hover:border-blue-500 hover:ring-2 hover:ring-blue-500/10"
                  }`}
                >
                  <CardHeader className="pb-3 border-b-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        NODE {agent.step}
                      </span>
                      <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${agent.subgraphColor}`}>
                        {agent.subgraph}
                      </span>
                    </div>

                    <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 mt-2 flex items-center gap-1.5">
                      <span>{agent.name}</span>
                      {agent.highlight && (
                        <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100/80 dark:bg-indigo-950/80 px-1.5 py-0.5 rounded">
                          LLM
                        </span>
                      )}
                    </CardTitle>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {agent.role}
                    </span>
                  </CardHeader>

                  <CardContent className="space-y-4 text-xs pt-0 flex-1 flex flex-col justify-between">
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      {agent.description}
                    </p>

                    <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>Engine:</span>
                      <span className="text-slate-800 dark:text-slate-200 font-semibold truncate ml-2">
                        {agent.tech}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
