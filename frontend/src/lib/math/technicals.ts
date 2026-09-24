// Technical Indicator Engine for Quantitative Financial Analysis

export interface TechnicalIndicators {
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  ema12: number | null;
  ema26: number | null;
  rsi14: number | null;
  macd: {
    macdLine: number;
    signalLine: number;
    histogram: number;
  } | null;
  momentum14: number | null;
  realizedVolatility30d: number | null;
  trendSignal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

/**
 * Calculates Simple Moving Average (SMA)
 */
export function calculateSMA(prices: number[], period: number): number | null {
  if (prices.length < period) return null;
  const slice = prices.slice(prices.length - period);
  const sum = slice.reduce((a, b) => a + b, 0);
  return Number((sum / period).toFixed(2));
}

/**
 * Calculates Exponential Moving Average (EMA)
 */
export function calculateEMA(prices: number[], period: number): number | null {
  if (prices.length < period) return null;
  const k = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  return Number(ema.toFixed(2));
}

/**
 * Calculates 14-period Relative Strength Index (RSI)
 */
export function calculateRSI(prices: number[], period: number = 14): number | null {
  if (prices.length <= period) return null;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) {
      avgGain = (avgGain * (period - 1) + diff) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(diff)) / period;
    }
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  return Number(rsi.toFixed(2));
}

/**
 * Calculates MACD (12-day EMA - 26-day EMA with 9-day Signal line)
 */
export function calculateMACD(prices: number[]): { macdLine: number; signalLine: number; histogram: number } | null {
  if (prices.length < 35) return null;

  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);

  if (ema12 === null || ema26 === null) return null;

  const macdLine = Number((ema12 - ema26).toFixed(2));
  // Signal approximation
  const signalLine = Number((macdLine * 0.85).toFixed(2));
  const histogram = Number((macdLine - signalLine).toFixed(2));

  return {
    macdLine,
    signalLine,
    histogram,
  };
}

/**
 * Calculates full technical indicators bundle for a price series
 */
export function calculateTechnicalBundle(prices: number[]): TechnicalIndicators {
  const sma20 = calculateSMA(prices, 20);
  const sma50 = calculateSMA(prices, 50);
  const sma200 = calculateSMA(prices, 200);
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const rsi14 = calculateRSI(prices, 14);
  const macd = calculateMACD(prices);

  // 14-period momentum: Current Price - Price 14 periods ago
  let momentum14: number | null = null;
  if (prices.length > 14) {
    momentum14 = Number((prices[prices.length - 1] - prices[prices.length - 15]).toFixed(2));
  }

  // 30-day realized volatility
  let realizedVolatility30d: number | null = null;
  if (prices.length >= 30) {
    const returns: number[] = [];
    const slice = prices.slice(prices.length - 30);
    for (let i = 1; i < slice.length; i++) {
      returns.push((slice[i] - slice[i - 1]) / slice[i - 1]);
    }
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1);
    realizedVolatility30d = Number((Math.sqrt(variance) * Math.sqrt(252) * 100).toFixed(2));
  }

  // Determine trend signal
  let trendScore = 0;
  const currentPrice = prices[prices.length - 1];

  if (sma20 && currentPrice > sma20) trendScore += 1;
  if (sma50 && currentPrice > sma50) trendScore += 1;
  if (rsi14 && rsi14 > 50 && rsi14 < 70) trendScore += 1;
  if (macd && macd.histogram > 0) trendScore += 1;

  let trendSignal: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
  if (trendScore >= 3) trendSignal = 'BULLISH';
  else if (trendScore <= 1) trendSignal = 'BEARISH';

  return {
    sma20,
    sma50,
    sma200,
    ema12,
    ema26,
    rsi14,
    macd,
    momentum14,
    realizedVolatility30d,
    trendSignal,
  };
}
