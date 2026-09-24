'use client';

import React, { useState } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Database,
  Search,
  Cpu,
  Info,
  Layers,
} from 'lucide-react';
import { AgentResponse } from '@/lib/validators/schemas';
import { AgentExecutionTrace } from '@/lib/agent/core';

interface Message {
  id: string;
  sender: 'user' | 'agent';
  text?: string;
  trace?: AgentExecutionTrace;
  timestamp: string;
}

const SAMPLE_QUERIES = [
  'Why is my portfolio down today?',
  'What are the biggest risks in my portfolio?',
  'Which holdings contributed most to recent movement?',
  'What sectors am I overexposed to?',
  'Analyze NVDA and current sentiment.',
  'Show me current market conditions.',
];

export function AgentChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-init',
      sender: 'agent',
      text: 'I am your Portfolio Monitoring & Financial Analysis Agent. I continuously observe your portfolio allocations, analyze risk factors, track market sentiment, and compute multi-scenario forecasts. What would you like to investigate today?',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedTraceId, setExpandedTraceId] = useState<string | null>(null);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text, portfolioId: 'port-demo-001' }),
      });

      if (!res.ok) throw new Error('Agent execution failed');
      const trace: AgentExecutionTrace = await res.json();

      const agentMsg: Message = {
        id: `a-${Date.now()}`,
        sender: 'agent',
        trace,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, agentMsg]);
      setExpandedTraceId(agentMsg.id); // Auto-open reasoning drawer
    } catch {
      const fallbackMsg: Message = {
        id: `a-err-${Date.now()}`,
        sender: 'agent',
        text: 'The portfolio monitoring agent encountered a network timeout while querying remote services. Local telemetry and cached portfolio valuations remain fully accessible.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[750px] financial-card overflow-hidden">
      {/* Agent Chat Header */}
      <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              AI Quantitative Portfolio Analyst
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                TOOL-CALLING ENGINE
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Deterministic calculations + Gemini 2.5 Flash synthesis • No automated trading
            </p>
          </div>
        </div>

        <div className="text-[11px] font-mono text-slate-400 hidden sm:block">
          Risk Disclaimers Enforced
        </div>
      </div>

      {/* Suggested Quick Triggers */}
      <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
        <span className="text-slate-500 font-medium shrink-0 flex items-center gap-1 text-[11px]">
          <Sparkles className="w-3 h-3 text-slate-400" /> Prompts:
        </span>
        {SAMPLE_QUERIES.map(q => (
          <button
            key={q}
            onClick={() => handleSendMessage(q)}
            disabled={isLoading}
            className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 shrink-0 font-medium transition-colors disabled:opacity-50 cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-[#F8FAFC]">
        {messages.map(m => {
          if (m.sender === 'user') {
            return (
              <div key={m.id} className="flex justify-end">
                <div className="max-w-xl bg-slate-900 text-white rounded-lg px-4 py-2.5 text-xs shadow-xs">
                  <p className="font-medium">{m.text}</p>
                  <span className="text-[10px] text-slate-400 mt-1 block text-right font-mono">
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          }

          const trace = m.trace;
          const resp: AgentResponse | undefined = trace?.response;

          return (
            <div key={m.id} className="flex gap-3 max-w-3xl">
              <div className="w-7 h-7 rounded bg-slate-200 border border-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-slate-700" />
              </div>

              <div className="flex-1 space-y-3">
                {/* Standard Message */}
                {m.text && (
                  <div className="bg-white border border-slate-200 rounded-lg p-3.5 text-xs text-slate-800 leading-relaxed shadow-xs">
                    {m.text}
                  </div>
                )}

                {/* Structured Agent Response Card */}
                {resp && (
                  <div className="bg-white border border-slate-200 rounded-lg p-4 text-xs space-y-3.5 shadow-xs">
                    {/* Executive Summary */}
                    <div className="border-b border-slate-100 pb-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Executive Synthesis
                        </span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                          resp.confidence === 'HIGH' ? 'bg-emerald-100 text-emerald-800' :
                          resp.confidence === 'MODERATE' ? 'bg-blue-100 text-blue-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {resp.confidence} CONFIDENCE
                        </span>
                      </div>
                      <p className="text-slate-900 font-medium text-sm leading-snug">
                        {resp.summary}
                      </p>
                    </div>

                    {/* Observations */}
                    {resp.observations && resp.observations.length > 0 && (
                      <div>
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                          Quantitative Observations
                        </h4>
                        <ul className="space-y-1 list-disc list-inside text-slate-700">
                          {resp.observations.map((obs, idx) => (
                            <li key={idx}>{obs}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Key Factors & Risks in two columns */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                      <div>
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                          Key Drivers & Signals
                        </h4>
                        <ul className="space-y-1 text-slate-700">
                          {resp.key_factors?.map((k, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-emerald-600 font-bold">•</span>
                              <span>{k}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                          Identified Risks
                        </h4>
                        <ul className="space-y-1 text-slate-700">
                          {resp.risks?.map((r, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-red-600 font-bold">•</span>
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Forward Scenario */}
                    {resp.forecast && resp.forecast.scenario && (
                      <div className="p-2.5 rounded bg-slate-50 border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-800">
                          <span>Scenario: {resp.forecast.scenario}</span>
                          <span className="font-mono text-slate-500">{resp.forecast.horizon}</span>
                        </div>
                        <p className="text-slate-600 text-[11px]">
                          <strong>Estimated Range:</strong> {resp.forecast.estimated_range}
                        </p>
                      </div>
                    )}

                    {/* High-Level Reasoning Trace Toggle (Transparency Drawer) */}
                    {trace && (
                      <div className="border-t border-slate-100 pt-2">
                        <button
                          onClick={() => setExpandedTraceId(expandedTraceId === m.id ? null : m.id)}
                          className="flex items-center justify-between w-full text-[11px] text-slate-500 hover:text-slate-900 font-medium py-1"
                        >
                          <span className="flex items-center gap-1.5">
                            <Cpu className="w-3.5 h-3.5 text-slate-400" />
                            Reasoning Transparency Audit ({trace.toolsCalled.length} tools executed)
                          </span>
                          {expandedTraceId === m.id ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {expandedTraceId === m.id && (
                          <div className="mt-2 p-3 bg-slate-50 rounded border border-slate-200 space-y-2 text-[11px]">
                            <div>
                              <span className="font-semibold text-slate-700 flex items-center gap-1">
                                <Database className="w-3 h-3 text-slate-500" /> Data Analyzed:
                              </span>
                              <div className="text-slate-600 pl-4">{trace.dataAnalyzed.join(' • ')}</div>
                            </div>

                            <div>
                              <span className="font-semibold text-slate-700 flex items-center gap-1">
                                <Layers className="w-3 h-3 text-slate-500" /> Factors Considered:
                              </span>
                              <div className="text-slate-600 pl-4">{trace.factorsConsidered.join(' • ')}</div>
                            </div>

                            <div>
                              <span className="font-semibold text-slate-700 flex items-center gap-1">
                                <Search className="w-3 h-3 text-slate-500" /> Sources Checked:
                              </span>
                              <div className="text-slate-600 pl-4">{trace.sourcesChecked.join(' • ')}</div>
                            </div>

                            <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200">
                              Data Timestamp: {resp.data_timestamp}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 max-w-xl">
            <div className="w-7 h-7 rounded bg-slate-200 border border-slate-300 flex items-center justify-center shrink-0 animate-pulse">
              <Bot className="w-4 h-4 text-slate-700" />
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-600 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-900 animate-ping"></span>
              <span>Autonomous agent selecting tools and auditing portfolio signals...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Field */}
      <div className="p-3 bg-white border-t border-slate-200">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage(inputValue);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="Ask anything (e.g., 'Why is my portfolio down today?' or 'Analyze NVDA risks')..."
            disabled={isLoading}
            className="flex-1 bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="px-3.5 py-2 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Ask</span>
          </button>
        </form>
      </div>
    </div>
  );
}
