"use client";

import React, { useEffect, useState } from "react";

export interface StepperStep {
  id: number;
  name: string;
  role: string;
  detail: string;
  graphNode: string;
}

const STEPS: StepperStep[] = [
  {
    id: 1,
    name: "Market Agent",
    role: "Market Feeds & Candlesticks",
    detail: "Fetching live close prices and daily returns from Yahoo Finance API...",
    graphNode: "market_data",
  },
  {
    id: 2,
    name: "Risk Agent",
    role: "Drawdown & VaR Quantification",
    detail: "Computing Value-at-Risk (95%), max drawdown, and EWMA portfolio variance...",
    graphNode: "risk_analysis",
  },
  {
    id: 3,
    name: "Anomaly Agent",
    role: "Statistical Outlier Detection",
    detail: "Screening return distribution z-scores for price shocks and volume spikes...",
    graphNode: "anomaly_detection",
  },
  {
    id: 4,
    name: "News Agent",
    role: "Financial News & Sentiment",
    detail: "Analyzing macro web headlines and asset-level sentiment signals...",
    graphNode: "news_sentiment",
  },
  {
    id: 5,
    name: "Rebalance Agent",
    role: "Allocation & Mandate Drift",
    detail: "Measuring weight divergence against target portfolio mandate...",
    graphNode: "drift_analysis",
  },
  {
    id: 6,
    name: "ML Agent",
    role: "Predictive Volatility Modeling",
    detail: "Running forward volatility forecast and trend projections...",
    graphNode: "ml_forecast",
  },
  {
    id: 7,
    name: "Writer Agent",
    role: "LLM Executive Synthesis",
    detail: "Synthesizing multi-agent outputs into cohesive executive monitoring memo...",
    graphNode: "writer_memo",
  },
];

interface PipelineStepperModalProps {
  isOpen: boolean;
  isComplete: boolean;
  onFinished?: () => void;
}

export default function PipelineStepperModal({
  isOpen,
  isComplete,
  onFinished,
}: PipelineStepperModalProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStepIndex(0);
      setLogs([]);
      return;
    }

    setLogs(["[LangGraph] Initializing StateGraph workflow with 7 agent nodes..."]);

    // Advance steps sequentially over time while backend pipeline runs
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < STEPS.length - 1) {
          const next = prev + 1;
          const step = STEPS[next];
          setLogs((l) => [
            ...l,
            `[LangGraph] Executing node: '${step.graphNode}' (${step.name})`,
          ]);
          return next;
        }
        return prev;
      });
    }, 900);

    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    if (isComplete) {
      setCurrentStepIndex(STEPS.length); // All finished
      setLogs((l) => [
        ...l,
        "[LangGraph] Pipeline workflow completed successfully.",
        "[SQLite] Run snapshot and agent state persisted to persistent memory.",
        "[UI] Routing to Executive Dashboard...",
      ]);
    }
  }, [isComplete]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm transition-all animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm animate-pulse">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                LangGraph Multi-Agent Orchestration
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Executing 7 specialized agents sequentially through typed StateGraph
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
            <span className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400">
              {isComplete ? "DONE (100%)" : `NODE ${Math.min(currentStepIndex + 1, 7)} / 7`}
            </span>
          </div>
        </div>

        {/* Modal Body: Stepper List */}
        <div className="p-6 overflow-y-auto space-y-3.5 divide-y divide-slate-100 dark:divide-slate-800">
          {STEPS.map((step, idx) => {
            const isCompleted = isComplete || currentStepIndex > idx;
            const isCurrent = !isComplete && currentStepIndex === idx;
            const isPending = !isComplete && currentStepIndex < idx;

            return (
              <div
                key={step.id}
                className={`pt-3.5 first:pt-0 flex items-start gap-4 transition-all duration-300 ${
                  isCurrent
                    ? "opacity-100 scale-[1.01]"
                    : isCompleted
                    ? "opacity-90"
                    : "opacity-40"
                }`}
              >
                {/* Step Indicator Circle */}
                <div className="pt-0.5 flex-shrink-0">
                  {isCompleted ? (
                    <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : isCurrent ? (
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center ring-4 ring-blue-100 dark:ring-blue-900/50 shadow-md">
                      <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 flex items-center justify-center font-mono text-xs font-bold border border-slate-200 dark:border-slate-700">
                      {step.id}
                    </div>
                  )}
                </div>

                {/* Step Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span>{step.name}</span>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        {step.graphNode}
                      </span>
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {isCompleted ? "COMPLETED" : isCurrent ? "RUNNING..." : "QUEUED"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    {step.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Execution Console Box */}
        <div className="px-6 py-3 bg-slate-900 text-slate-300 font-mono text-[11px] border-t border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 pb-1 border-b border-slate-800 text-[10px] uppercase font-bold tracking-wider">
            <span>StateGraph Event Stream</span>
            <span className="text-emerald-400">Live</span>
          </div>
          <div className="max-h-20 overflow-y-auto space-y-0.5 pr-1 scrollbar-thin">
            {logs.map((log, i) => (
              <div key={i} className="text-slate-300">
                <span className="text-blue-400">&gt;</span> {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
