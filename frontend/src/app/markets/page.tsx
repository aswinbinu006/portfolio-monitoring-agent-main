'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Globe,
  Compass,
  Layers,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { MarketOverview, MarketIndex } from '@/lib/providers/market-data';
import { NewsArticle, SentimentAnalysis } from '@/lib/providers/news-data';
import { formatCurrency, formatPercent, formatDate } from '@/lib/utils/formatters';

export default function MarketsPage() {
  const [overview, setOverview] = useState<MarketOverview | null>(null);
  const [marketNews, setMarketNews] = useState<NewsArticle[]>([]);
  const [sentiment, setSentiment] = useState<SentimentAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMarketData() {
      try {
        const [mktRes, newsRes] = await Promise.all([
          fetch('/api/market?action=overview'),
          fetch('/api/news?action=market'),
        ]);

        const mktData = await mktRes.json();
        const newsData = await newsRes.json();

        setOverview(mktData);
        setMarketNews(newsData.news || []);
        setSentiment(newsData.sentiment || null);
      } catch (err) {
        console.error('Failed to load market intelligence:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMarketData();
  }, []);

  if (loading || !overview) {
    return (
      <AppShell title="Market Intelligence">
        <div className="py-20 flex flex-col items-center justify-center space-y-2">
          <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-500 font-mono">Aggregating global market data...</span>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Macro Market Intelligence"
      subtitle="Benchmark indices, macro regime classification, sector dispersion, and financial press sentiment"
    >
      {/* 1. Market Environment Regime Classification Banner */}
      <div className="financial-card p-5 bg-slate-900 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">
              Classified Macro Regime
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
              DESCRIPTIVE AUDIT
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            {overview.environment}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            {overview.summary}
          </p>
        </div>

        <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-700 pt-3 md:pt-0 md:pl-6 text-xs font-mono shrink-0">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">CBOE VIX</span>
            <span className="text-base font-bold text-white">{overview.volatilityIndex.value}</span>
            <span className="text-[11px] text-emerald-400 block">Low Volatility</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">A/D Ratio</span>
            <span className="text-base font-bold text-white">{overview.advanceDeclineRatio}x</span>
            <span className="text-[11px] text-slate-300 block">Breadth Positive</span>
          </div>
        </div>
      </div>

      {/* 2. Major Benchmark Indices Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {overview.indices.map(idx => {
          const isUp = idx.change >= 0;
          return (
            <div key={idx.symbol} className="financial-card p-3.5">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-mono text-slate-400 font-medium">{idx.symbol}</span>
                <span className={isUp ? 'financial-badge-pos text-[10px]' : 'financial-badge-neg text-[10px]'}>
                  {formatPercent(idx.changePercent)}
                </span>
              </div>
              <div className="font-bold text-slate-900 text-sm tracking-tight truncate">{idx.name}</div>
              <div className="font-mono font-bold text-base text-slate-900 mt-1">
                {idx.value.toLocaleString()}
              </div>
              <div className={`text-[11px] font-mono mt-0.5 ${isUp ? 'text-emerald-700' : 'text-red-700'}`}>
                {isUp ? '+' : ''}{idx.change.toFixed(2)}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Middle Section: Sector Dispersion + Market Sentiment */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sector Performance Table */}
        <div className="financial-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Sector Dispersion & Rotation</h3>
              <p className="text-xs text-slate-500">Trailing intra-day performance across S&P 500 GICS sectors</p>
            </div>
            <span className="text-xs font-mono text-slate-500">{overview.marketBreadth}</span>
          </div>

          <div className="space-y-2.5">
            {overview.topSectors.map(sec => {
              const isPos = sec.changePercent >= 0;
              return (
                <div key={sec.name} className="flex items-center justify-between text-xs p-2 rounded bg-slate-50 border border-slate-100">
                  <span className="font-semibold text-slate-800">{sec.name}</span>
                  <div className="flex items-center gap-3">
                    {/* Performance bar */}
                    <div className="w-32 bg-slate-200 h-1.5 rounded-full overflow-hidden hidden sm:block">
                      <div
                        className={`h-full rounded-full ${isPos ? 'bg-emerald-600' : 'bg-red-600'}`}
                        style={{ width: `${Math.min(100, Math.abs(sec.changePercent) * 40)}%` }}
                      ></div>
                    </div>
                    <span className={`font-mono font-bold w-14 text-right ${isPos ? 'text-emerald-700' : 'text-red-700'}`}>
                      {formatPercent(sec.changePercent)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Aggregate Market Sentiment Card */}
        {sentiment && (
          <div className="financial-card p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">Financial Press Sentiment</h3>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                  sentiment.label === 'POSITIVE' ? 'bg-emerald-100 text-emerald-800' :
                  sentiment.label === 'NEGATIVE' ? 'bg-red-100 text-red-800' :
                  'bg-slate-100 text-slate-700'
                }`}>
                  {sentiment.label} ({sentiment.score > 0 ? '+' : ''}{sentiment.score})
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-1">
                    Dominant Macro Narratives
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {sentiment.mainThemes.map(t => (
                      <span key={t} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-1">
                    Sentiment Trajectory
                  </span>
                  <div className="flex items-center gap-2 font-mono text-slate-800 font-semibold">
                    <span>Trend: {sentiment.recentTrend}</span>
                    <span>•</span>
                    <span>Confidence: {(sentiment.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
              Evaluated across {sentiment.articleCount} verified institutional releases
            </div>
          </div>
        )}
      </div>

      {/* 4. Global Market News Feed */}
      <div className="financial-card p-5">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-1">Verified Financial Market News</h3>
        <p className="text-xs text-slate-500 mb-4">Central bank disclosures, sovereign yield curves, and corporate developments</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {marketNews.map(item => (
            <div key={item.id} className="p-3.5 rounded border border-slate-200 bg-white space-y-2 text-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                  <span>{item.source}</span>
                  <span className={item.sentiment === 'POSITIVE' ? 'text-emerald-700 font-bold' : item.sentiment === 'NEGATIVE' ? 'text-red-700 font-bold' : 'text-slate-600'}>
                    {item.sentiment}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 leading-snug">{item.title}</h4>
                <p className="text-slate-600 text-[11px] mt-1.5 leading-relaxed">{item.summary}</p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>{formatDate(item.publishedAt)}</span>
                <span className="text-blue-600 hover:underline flex items-center gap-1 cursor-pointer">
                  Financial Wire <ExternalLink className="w-2.5 h-2.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
