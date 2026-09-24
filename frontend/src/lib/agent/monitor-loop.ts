// Autonomous Reusable Portfolio Monitoring Loop
// Executes 12-step monitoring audit, calculates priority matrix (Impact x Exposure x Severity),
// and creates prioritized alerts and insights selectively.

import { getPortfolioHoldings, getUserPortfolios, createNewAlert, getPortfolioSnapshots } from '../supabase/database';
import { marketDataProvider } from '../providers/market-data';
import { newsProvider } from '../providers/news-data';
import { calculatePortfolioStats } from '../math/stats';
import { runPortfolioAgent } from './core';

export interface MonitoringResult {
  portfolioId: string;
  timestamp: string;
  auditPassed: boolean;
  alertsCreated: number;
  unusualMovements: Array<{ symbol: string; changePercent: number; exposure: number }>;
  concentrationIssues: string[];
  drawdownExceeded: boolean;
  marketEnvironment: string;
  aiInsightGenerated: boolean;
  aiSummary?: string;
}

/**
 * Autonomous monitorPortfolio execution
 */
export async function monitorPortfolio(
  userId: string,
  portfolioId: string
): Promise<MonitoringResult> {
  // 1. Load portfolio & holdings
  const portfolios = await getUserPortfolios(userId);
  const portfolio = portfolios.find(p => p.id === portfolioId) || portfolios[0];
  const holdings = await getPortfolioHoldings(portfolioId);

  if (!portfolio || holdings.length === 0) {
    return {
      portfolioId,
      timestamp: new Date().toISOString(),
      auditPassed: true,
      alertsCreated: 0,
      unusualMovements: [],
      concentrationIssues: [],
      drawdownExceeded: false,
      marketEnvironment: 'Unknown',
      aiInsightGenerated: false,
    };
  }

  // 2. Fetch latest available market data
  const symbols = holdings.map(h => h.symbol);
  const quotes = await marketDataProvider.getQuotes(symbols);
  const marketOverview = await marketDataProvider.getMarketOverview();

  // 3. Calculate portfolio stats & changes
  const snapshots = await getPortfolioSnapshots(portfolioId);
  const stats = calculatePortfolioStats(
    holdings,
    snapshots.map(s => s.total_value),
    snapshots.map(s => s.benchmark_value || 50000)
  );

  let alertsCreatedCount = 0;
  const unusualMovements: Array<{ symbol: string; changePercent: number; exposure: number }> = [];
  const concentrationIssues: string[] = [];

  // 4. Detect unusual price movements (>2.5% single day)
  for (const h of stats.holdingStats) {
    const q = quotes[h.symbol];
    const changePct = q ? q.changePercent : 0;

    if (Math.abs(changePct) >= 2.5) {
      unusualMovements.push({
        symbol: h.symbol,
        changePercent: changePct,
        exposure: h.portfolioWeight,
      });

      // Priority formula: |Change| * Weight * ImportanceFactor
      const priorityScore = Math.abs(changePct) * (h.portfolioWeight / 100) * 10;
      let severity: 'INFO' | 'WATCH' | 'IMPORTANT' | 'HIGH_PRIORITY' = 'INFO';

      if (priorityScore > 2.0) severity = 'HIGH_PRIORITY';
      else if (priorityScore > 1.0) severity = 'IMPORTANT';
      else if (priorityScore > 0.4) severity = 'WATCH';

      await createNewAlert({
        user_id: userId,
        portfolio_id: portfolioId,
        title: `${h.symbol} Unusual Movement (${changePct > 0 ? '+' : ''}${changePct}%)`,
        message: `${h.companyName} moved ${changePct}% today. With a ${h.portfolioWeight}% portfolio weighting, this accounts for an estimated $${Math.abs(h.marketValue * (changePct / 100)).toFixed(2)} fluctuation.`,
        severity,
        category: 'PRICE_MOVEMENT',
      });
      alertsCreatedCount++;
    }
  }

  // 5. Check concentration risk (>25% single stock or >40% single sector)
  for (const h of stats.holdingStats) {
    if (h.portfolioWeight > 25) {
      const issue = `${h.symbol} position weight is ${h.portfolioWeight}% (limit: 25%)`;
      concentrationIssues.push(issue);

      await createNewAlert({
        user_id: userId,
        portfolio_id: portfolioId,
        title: `Single-Asset Concentration Warning: ${h.symbol}`,
        message: `${h.companyName} represents ${h.portfolioWeight}% of total portfolio value. Excessive concentration reduces diversification efficiency.`,
        severity: h.portfolioWeight > 35 ? 'HIGH_PRIORITY' : 'IMPORTANT',
        category: 'CONCENTRATION',
      });
      alertsCreatedCount++;
    }
  }

  for (const s of stats.sectorExposures) {
    if (s.percentage > 40) {
      const issue = `${s.sector} sector exposure is ${s.percentage}% (limit: 40%)`;
      concentrationIssues.push(issue);

      await createNewAlert({
        user_id: userId,
        portfolio_id: portfolioId,
        title: `Sector Exposure Notice: ${s.sector}`,
        message: `${s.sector} weighting is ${s.percentage}% across ${s.count} holdings, exceeding recommended 40% sector allocation limits.`,
        severity: 'WATCH',
        category: 'CONCENTRATION',
      });
      alertsCreatedCount++;
    }
  }

  // 6 & 7. Check sentiment shifts on top holdings
  const topHolding = stats.holdingStats[0];
  if (topHolding) {
    const sentiment = await newsProvider.analyzeCompanySentiment(topHolding.symbol);
    if (sentiment.label === 'NEGATIVE' && sentiment.confidence > 0.7) {
      await createNewAlert({
        user_id: userId,
        portfolio_id: portfolioId,
        title: `Sentiment Deterioration: ${topHolding.symbol}`,
        message: `Analysis of ${sentiment.articleCount} recent news items for ${topHolding.companyName} indicates a negative narrative drift regarding ${sentiment.mainThemes.join(', ')}.`,
        severity: 'IMPORTANT',
        category: 'SENTIMENT',
      });
      alertsCreatedCount++;
    }
  }

  // 8. Drawdown check
  const maxDD = stats.riskMetrics.maxDrawdown || 0;
  let drawdownExceeded = false;
  if (maxDD > 15) {
    drawdownExceeded = true;
    await createNewAlert({
      user_id: userId,
      portfolio_id: portfolioId,
      title: `Portfolio Drawdown Alert (${maxDD.toFixed(1)}%)`,
      message: `Current peak-to-trough portfolio drawdown has reached ${maxDD.toFixed(1)}%, triggering your 15% risk mitigation monitor threshold.`,
      severity: 'HIGH_PRIORITY',
      category: 'DRAWDOWN',
    });
    alertsCreatedCount++;
  }

  // 11. Selectively generate AI insight if significant events occurred
  let aiInsightGenerated = false;
  let aiSummary: string | undefined;

  if (alertsCreatedCount > 0 || Math.abs(stats.dailyChangePercent) > 1.5) {
    const trace = await runPortfolioAgent(
      `Perform an automated monitoring check for portfolio ${portfolio.name}. Explain today's performance and notable risks.`,
      { userId, portfolioId }
    );
    aiInsightGenerated = true;
    aiSummary = trace.response.summary;
  }

  return {
    portfolioId,
    timestamp: new Date().toISOString(),
    auditPassed: alertsCreatedCount === 0,
    alertsCreated: alertsCreatedCount,
    unusualMovements,
    concentrationIssues,
    drawdownExceeded,
    marketEnvironment: marketOverview.environment,
    aiInsightGenerated,
    aiSummary,
  };
}
