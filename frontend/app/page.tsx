"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const AGENTS = [
  {
    step: "1",
    name: "Market Agent",
    role: "Data Ingestion",
    description: "Fetches price feeds, calculates daily returns, volume, and momentum across assets.",
    tech: "Yahoo Finance API / Pandas",
  },
  {
    step: "2",
    name: "Risk Agent",
    role: "Quantitative Risk",
    description: "Assesses portfolio drawdown against user mandate (conservative/balanced/aggressive).",
    tech: "VaR & Volatility Statistics",
  },
  {
    step: "3",
    name: "Anomaly Agent",
    role: "Statistical Screening",
    description: "Detects return spikes, tail shocks, and statistical outliers to flag for investigation.",
    tech: "EWMA Variance & Z-Scores",
  },
  {
    step: "4",
    name: "News Agent",
    role: "Context Retrieval",
    description: "Searches targeted financial news to retrieve ground truth explaining WHY an anomaly occurred.",
    tech: "Tavily / DDG Web Search",
  },
  {
    step: "5",
    name: "Rebalance Agent",
    role: "Drift Detection",
    description: "Evaluates active portfolio weights vs. target allocation and flags drifting positions.",
    tech: "Tolerance Threshold Checks",
  },
  {
    step: "6",
    name: "ML Agent",
    role: "Regime Forecasting",
    description: "Forecasts forward volatility trajectory and classifies the current market regime.",
    tech: "Rolling Volatility Projections",
  },
  {
    step: "7",
    name: "Writer Agent",
    role: "LLM Synthesis (Centerpiece)",
    description: "Synthesizes evidence from all 6 upstream agents into an executive monitoring briefing.",
    tech: "LiteLLM / OpenAI Engine",
    highlight: true,
  },
];

export default function HomePage() {
  return (
    <div className="space-y-10 py-4">
      {/* Hero Overview */}
      <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 shadow-sm text-center max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          <span>Subject: Agentic AI</span>
          <span className="text-blue-300">•</span>
          <span>Orchestration: LangGraph StateGraph</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Investment Portfolio Monitoring Agent
        </h1>

        <p className="text-slate-600 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
          An autonomous multi-agent system demonstrating graph orchestration, deterministic screening,
          web retrieval, and LLM reasoning. Seven specialized agents collaborate sequentially to monitor
          portfolio risk and deliver an executive briefing memo.
        </p>

        <div className="pt-2 flex flex-wrap justify-center gap-4">
          <Link href="/portfolio">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 shadow-sm">
              Upload Portfolio &amp; Run Agents &rarr;
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" size="lg" className="border-slate-300 font-semibold text-slate-700">
              View Monitoring Center
            </Button>
          </Link>
        </div>
      </div>

      {/* 7-Agent Architecture Section */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-slate-900">Multi-Agent Workflow Architecture</h2>
          <p className="text-xs text-slate-500">
            A state graph passing structured context sequentially through specialized agent nodes
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {AGENTS.map((agent) => (
            <Card
              key={agent.step}
              className={`transition-all hover:shadow-md ${
                agent.highlight ? "border-blue-500 ring-2 ring-blue-500/10 bg-blue-50/20" : "border-slate-200"
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    Node {agent.step}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded">
                    {agent.role}
                  </span>
                </div>
                <CardTitle className="text-base font-bold text-slate-900 mt-2">
                  {agent.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <p className="text-slate-600 leading-relaxed">
                  {agent.description}
                </p>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Engine:</span>
                  <span className="text-slate-700 font-semibold">{agent.tech}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
