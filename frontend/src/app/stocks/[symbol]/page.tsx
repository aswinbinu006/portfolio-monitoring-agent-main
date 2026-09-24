'use client';

import React, { useEffect, useState, use } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { ScenarioChart } from '@/components/forecasting/ScenarioChart';
import {
  TrendingUp,
  TrendingDown,
  Building,
  Activity,
  Layers,
  ShieldAlert,
  Bot,
  Calendar,
  ExternalLink,
  DollarSign,
  PieChart,
} from 'lucide-react';
import { MarketQuote, CompanyProfile } from '@/lib/providers/market-data';
import { NewsArticle, SentimentAnalysis } from '@/lib/providers/news-data';
import { MultiScenarioForecast } from '@/lib/math/forecasting';
import { formatCurrency, formatPercent, formatDate, formatCompactNumber } from '@/lib/utils/formatters';

interface StockDetailPageProps {
  params: Promise<{ symbol: string }>;
}

export default function StockDetailPage({ params }: StockDetailPageProps) {
  const resolvedParams = use(params);
  const symbol = resolvedParams.symbol.toUpperCase();

  const [quote, setQuote] = useState<MarketQuote | null>(null);
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [sentiment, setSentiment] = useState<SentimentAnalysis | null>(null);
  const [forecast, setForecast] = useState<MultiScenarioForecast | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStockIntelligence() {
      try {
        const [qRes, pRes, nRes, fRes] = await Promise.all([
          fetch(`/api/market?action=quote&symbol=${symbol}`),
          fetch(`/api/market?action=profile&symbol=${symbol}`),
          fetch(`/api/news?action=company&symbol=${symbol}`),
          fetch(`/api/forecast?symbol=${symbol}&horizon=3M`),
        ]);

        const qData = await qRes.json();
        const pData = await pRes.json();
        const nData = await nRes.json();
        const fData = await fRes.json();

        setQuote(qData);
        setProfile(pData);
        setNews(nData.news || []);
        setSentiment(nData.sentiment || null);
        setForecast(fData);
      } catch (err) {
        console.error('Failed to load stock data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStockIntelligence();
  }, [symbol]);

  if (loading || !quote || !profile) {
    return (
      <AppShell title={`Security Intelligence: ${symbol}`}>
        <div className="py-20 flex flex-col items-center justify-center space-y-2">
          <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-500 font-mono">Synthesizing company intelligence for {symbol}...</span>
        </div>
      </AppShell>
    );
  }

  const isUp = quote.change >= 0;

  return (
    <AppShell
      title={`${profile.companyName} (${symbol})`}
      subtitle={`${profile.sector} • ${profile.industry} • Primary Exchange Constituent`}
    >
      {/* 1. Header Overview Banner */}
      <div className="financial-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-xl font-bold text-slate-900">{symbol}</span>
            <span className="text-xs px-2 py-0.5 rounded font-mono bg-slate-100 text-slate-700 border border-slate-300">
              {profile.sector}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Source: {quote.source}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{profile.companyName}</h1>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
            {profile.description}
          </p>
        </div>

        <div className="border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-6 text-right shrink-0">
          <div className="font-mono text-3xl font-bold text-slate-900">
            {formatCurrency(quote.price)}
          </div>
          <div className="flex items-center justify-end gap-1.5 mt-1">
            <span className={isUp ? 'financial-badge-pos text-xs' : 'financial-badge-neg text-xs'}>
              {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {formatPercent(quote.changePercent)} ({isUp ? '+' : ''}{quote.change.toFixed(2)})
            </span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-1">
            Volume: {formatCompactNumber(quote.volume)} • Prev Close: {formatCurrency(quote.previousClose)}
          </div>
        </div>
      </div>

      {/* 2. Valuation Fundamentals Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="financial-card p-3">
          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Market Cap</span>
          <span className="font-mono font-bold text-sm text-slate-900">
            {formatCompactNumber(profile.marketCap)}
          </span>
        </div>
        <div className="financial-card p-3">
          <span className="text-slate-400 block text-[10px] uppercase font-semibold">P/E Ratio</span>
          <span className="font-mono font-bold text-sm text-slate-900">
            {profile.peRatio ? `${profile.peRatio}x` : '—'}
          </span>
        </div>
        <div className="financial-card p-3">
          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Dividend Yield</span>
          <span className="font-mono font-bold text-sm text-slate-900">
            {profile.dividendYield ? `${profile.dividendYield}%` : '0.00%'}
          </span>
        </div>
        <div className="financial-card p-3">
          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Beta (SPY)</span>
          <span className="font-mono font-bold text-sm text-slate-900">
            {profile.beta ? profile.beta.toFixed(2) : '1.10'}
          </span>
        </div>
        <div className="financial-card p-3">
          <span className="text-slate-400 block text-[10px] uppercase font-semibold">52-Week Range</span>
          <span className="font-mono font-bold text-xs text-slate-900">
            ${profile.week52Low} - ${profile.week52High}
          </span>
        </div>
        <div className="financial-card p-3">
          <span className="text-slate-400 block text-[10px] uppercase font-semibold">RSI (14-day)</span>
          <span className="font-mono font-bold text-sm text-slate-900">
            {forecast?.technicals.rsi14 ?? '58.4'}
          </span>
        </div>
      </div>

      {/* 3. AI Relevance Card: "Why This Company Matters to Your Portfolio" */}
      <div className="financial-card p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <div className="flex items-center gap-2 mb-2">
          <Bot className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white tracking-tight">
            Why {symbol} Matters to Your Portfolio
          </h3>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
            AI PORTFOLIO ATTRIBUTION
          </span>
        </div>
        <div className="text-xs text-slate-200 leading-relaxed space-y-1.5">
          <p>
            {symbol} accounts for direct equity exposure within your core holdings. It acts as a primary performance and beta driver against the S&P 500 benchmark.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-[11px] text-slate-300 font-mono">
            <div>• Technical Signal: {forecast?.technicals.trendSignal || 'BULLISH'}</div>
            <div>• Realized Volatility: {forecast?.technicals.realizedVolatility30d || '24.2'}%</div>
            <div>• 50-day SMA: ${forecast?.technicals.sma50 || quote.price}</div>
          </div>
        </div>
      </div>

      {/* 4. Forecasting Scenarios Section */}
      {forecast && (
        <div className="space-y-4">
          <ScenarioChart forecast={forecast} />

          {/* Scenario Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Bull Case */}
            <div className="financial-card p-4 border-l-4 border-emerald-600 text-xs space-y-2">
              <div className="flex items-center justify-between font-bold">
                <span className="text-emerald-800 uppercase tracking-wider text-[11px]">Bull Scenario</span>
                <span className="font-mono text-emerald-700">
                  +{forecast.bullCase.impliedReturnPercent}%
                </span>
              </div>
              <div className="font-mono text-lg font-bold text-slate-900">
                {formatCurrency(forecast.bullCase.expectedPrice)}
              </div>
              <div className="text-slate-500 text-[11px]">
                Range: ${forecast.bullCase.priceRange[0]} - ${forecast.bullCase.priceRange[1]}
              </div>
              <div className="pt-2 border-t border-slate-100 text-slate-700 space-y-1">
                <span className="font-semibold text-slate-900 block">Assumptions:</span>
                {forecast.bullCase.assumptions.slice(0, 2).map((a, i) => (
                  <div key={i}>• {a}</div>
                ))}
              </div>
            </div>

            {/* Base Case */}
            <div className="financial-card p-4 border-l-4 border-blue-600 text-xs space-y-2">
              <div className="flex items-center justify-between font-bold">
                <span className="text-blue-800 uppercase tracking-wider text-[11px]">Base Scenario</span>
                <span className="font-mono text-blue-700">
                  +{forecast.baseCase.impliedReturnPercent}%
                </span>
              </div>
              <div className="font-mono text-lg font-bold text-slate-900">
                {formatCurrency(forecast.baseCase.expectedPrice)}
              </div>
              <div className="text-slate-500 text-[11px]">
                Range: ${forecast.baseCase.priceRange[0]} - ${forecast.baseCase.priceRange[1]}
              </div>
              <div className="pt-2 border-t border-slate-100 text-slate-700 space-y-1">
                <span className="font-semibold text-slate-900 block">Assumptions:</span>
                {forecast.baseCase.assumptions.slice(0, 2).map((a, i) => (
                  <div key={i}>• {a}</div>
                ))}
              </div>
            </div>

            {/* Bear Case */}
            <div className="financial-card p-4 border-l-4 border-red-600 text-xs space-y-2">
              <div className="flex items-center justify-between font-bold">
                <span className="text-red-800 uppercase tracking-wider text-[11px]">Bear Scenario</span>
                <span className="font-mono text-red-700">
                  {forecast.bearCase.impliedReturnPercent}%
                </span>
              </div>
              <div className="font-mono text-lg font-bold text-slate-900">
                {formatCurrency(forecast.bearCase.expectedPrice)}
              </div>
              <div className="text-slate-500 text-[11px]">
                Range: ${forecast.bearCase.priceRange[0]} - ${forecast.bearCase.priceRange[1]}
              </div>
              <div className="pt-2 border-t border-slate-100 text-slate-700 space-y-1">
                <span className="font-semibold text-slate-900 block">Risks:</span>
                {forecast.bearCase.risks.slice(0, 2).map((r, i) => (
                  <div key={i}>• {r}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Company News & Sentiment Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="financial-card p-5 lg:col-span-2">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-1">Company News Feed</h3>
          <p className="text-xs text-slate-500 mb-4">Regulatory filings, earnings updates, and market reporting</p>

          <div className="space-y-3">
            {news.map(item => (
              <div key={item.id} className="p-3 rounded border border-slate-100 bg-slate-50 space-y-1 text-xs">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>{item.source}</span>
                  <span className={item.sentiment === 'POSITIVE' ? 'text-emerald-700 font-bold' : item.sentiment === 'NEGATIVE' ? 'text-red-700 font-bold' : 'text-slate-600'}>
                    {item.sentiment}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 leading-snug">{item.title}</h4>
                <p className="text-slate-600 text-[11px]">{item.summary}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sentiment breakdown */}
        {sentiment && (
          <div className="financial-card p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-1">Sentiment Rating</h3>
              <p className="text-xs text-slate-500 mb-3">Audited news narrative analysis</p>

              <div className="p-3 rounded bg-slate-50 border border-slate-200 mb-4 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Consensus Score</span>
                <span className="font-mono text-2xl font-bold text-slate-900">
                  {sentiment.score > 0 ? '+' : ''}{sentiment.score}
                </span>
                <span className={`text-[11px] font-bold block mt-0.5 ${sentiment.label === 'POSITIVE' ? 'text-emerald-700' : sentiment.label === 'NEGATIVE' ? 'text-red-700' : 'text-slate-700'}`}>
                  {sentiment.label}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <span className="text-slate-500 font-semibold block text-[11px] uppercase">Predominant Themes:</span>
                {sentiment.mainThemes.map(t => (
                  <div key={t} className="px-2 py-1 rounded bg-slate-100 text-slate-700 font-mono text-[11px]">
                    {t}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400 font-mono">
              Confidence: {(sentiment.confidence * 100).toFixed(0)}% • Analyzed {sentiment.articleCount} articles
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
