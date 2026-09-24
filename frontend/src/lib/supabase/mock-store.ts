// In-Memory / Local Storage Store for Seamless Evaluation and Fallback Execution
// Provides realistic financial data, holdings, alerts, and snapshots.

export interface Portfolio {
  id: string;
  user_id: string;
  name: string;
  description: string;
  currency: string;
  benchmark: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Holding {
  id: string;
  portfolio_id: string;
  symbol: string;
  company_name: string;
  asset_type: string;
  sector: string;
  quantity: number;
  buy_price: number;
  current_price: number;
  currency: string;
  purchase_date: string;
  broker?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Alert {
  id: string;
  user_id: string;
  portfolio_id: string;
  title: string;
  message: string;
  severity: 'INFO' | 'WATCH' | 'IMPORTANT' | 'HIGH_PRIORITY';
  category: 'PRICE_MOVEMENT' | 'CONCENTRATION' | 'EARNINGS' | 'SENTIMENT' | 'VOLATILITY' | 'DRAWDOWN' | 'NEWS' | 'GENERAL';
  is_read: boolean;
  data_payload?: Record<string, unknown>;
  created_at: string;
}

export interface AgentRun {
  id: string;
  user_id: string;
  portfolio_id?: string;
  query: string;
  tools_used: string[];
  findings: string;
  result: string;
  confidence: string;
  data_timestamp: string;
  created_at: string;
}

export interface WatchlistItem {
  id: string;
  user_id: string;
  symbol: string;
  company_name: string;
  sector: string;
  target_price?: number;
  notes?: string;
  created_at: string;
}

export interface PortfolioSnapshot {
  snapshot_date: string;
  total_value: number;
  total_invested: number;
  unrealized_pl: number;
  benchmark_value?: number;
}

// Initial demo portfolio
const INITIAL_PORTFOLIO: Portfolio = {
  id: 'port-demo-001',
  user_id: 'usr-demo-default',
  name: 'Balanced Global Tech & Growth Portfolio',
  description: 'Diversified core equity portfolio focused on high-conviction tech, healthcare, and enterprise leaders.',
  currency: 'USD',
  benchmark: 'SPY',
  is_default: true,
  created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
  updated_at: new Date().toISOString(),
};

const INITIAL_HOLDINGS: Holding[] = [
  {
    id: 'h-01',
    portfolio_id: 'port-demo-001',
    symbol: 'AAPL',
    company_name: 'Apple Inc.',
    asset_type: 'Stock',
    sector: 'Technology',
    quantity: 45,
    buy_price: 182.50,
    current_price: 228.40,
    currency: 'USD',
    purchase_date: '2024-01-15',
    broker: 'Fidelity',
    notes: 'Core ecosystem holding',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'h-02',
    portfolio_id: 'port-demo-001',
    symbol: 'NVDA',
    company_name: 'NVIDIA Corporation',
    asset_type: 'Stock',
    sector: 'Technology',
    quantity: 60,
    buy_price: 88.00,
    current_price: 132.80,
    currency: 'USD',
    purchase_date: '2024-02-10',
    broker: 'Interactive Brokers',
    notes: 'AI infrastructure compute leader',
    created_at: '2024-02-10T11:00:00Z',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'h-03',
    portfolio_id: 'port-demo-001',
    symbol: 'MSFT',
    company_name: 'Microsoft Corporation',
    asset_type: 'Stock',
    sector: 'Technology',
    quantity: 30,
    buy_price: 375.20,
    current_price: 432.15,
    currency: 'USD',
    purchase_date: '2024-01-22',
    broker: 'Fidelity',
    notes: 'Enterprise cloud and Copilot monetization',
    created_at: '2024-01-22T09:30:00Z',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'h-04',
    portfolio_id: 'port-demo-001',
    symbol: 'AMZN',
    company_name: 'Amazon.com, Inc.',
    asset_type: 'Stock',
    sector: 'Consumer Cyclical',
    quantity: 35,
    buy_price: 165.00,
    current_price: 189.50,
    currency: 'USD',
    purchase_date: '2024-03-01',
    broker: 'Robinhood',
    notes: 'AWS cloud margin expansion and retail logistics efficiency',
    created_at: '2024-03-01T14:00:00Z',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'h-05',
    portfolio_id: 'port-demo-001',
    symbol: 'JPM',
    company_name: 'JPMorgan Chase & Co.',
    asset_type: 'Stock',
    sector: 'Financial Services',
    quantity: 25,
    buy_price: 178.40,
    current_price: 215.30,
    currency: 'USD',
    purchase_date: '2024-02-15',
    broker: 'Charles Schwab',
    notes: 'Premier net interest margin and fortress balance sheet',
    created_at: '2024-02-15T10:00:00Z',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'h-06',
    portfolio_id: 'port-demo-001',
    symbol: 'LLY',
    company_name: 'Eli Lilly and Company',
    asset_type: 'Stock',
    sector: 'Healthcare',
    quantity: 12,
    buy_price: 720.00,
    current_price: 890.20,
    currency: 'USD',
    purchase_date: '2024-03-12',
    broker: 'Charles Schwab',
    notes: 'GLP-1 therapeutics franchise pipeline',
    created_at: '2024-03-12T13:30:00Z',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'h-07',
    portfolio_id: 'port-demo-001',
    symbol: 'TSLA',
    company_name: 'Tesla, Inc.',
    asset_type: 'Stock',
    sector: 'Consumer Cyclical',
    quantity: 20,
    buy_price: 245.00,
    current_price: 232.50,
    currency: 'USD',
    purchase_date: '2024-04-05',
    broker: 'Robinhood',
    notes: 'Autonomous robotaxi and energy storage segment',
    created_at: '2024-04-05T15:00:00Z',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'h-08',
    portfolio_id: 'port-demo-001',
    symbol: 'SPY',
    company_name: 'SPDR S&P 500 ETF Trust',
    asset_type: 'ETF',
    sector: 'Broad Market',
    quantity: 20,
    buy_price: 505.00,
    current_price: 565.40,
    currency: 'USD',
    purchase_date: '2024-01-08',
    broker: 'Vanguard',
    notes: 'Macro market anchor hedge',
    created_at: '2024-01-08T09:30:00Z',
    updated_at: new Date().toISOString(),
  },
];

const INITIAL_ALERTS: Alert[] = [
  {
    id: 'alt-01',
    user_id: 'usr-demo-default',
    portfolio_id: 'port-demo-001',
    title: 'Technology Concentration Notice',
    message: 'Technology sector weighting represents 54.2% of total portfolio value, exceeding your 40% target threshold.',
    severity: 'WATCH',
    category: 'CONCENTRATION',
    is_read: false,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'alt-02',
    user_id: 'usr-demo-default',
    portfolio_id: 'port-demo-001',
    title: 'NVIDIA Semi-Cap Volatility Warning',
    message: 'NVDA 14-day realized volatility increased to 38.4% ahead of the upcoming datacenter revenue report.',
    severity: 'IMPORTANT',
    category: 'VOLATILITY',
    is_read: false,
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    id: 'alt-03',
    user_id: 'usr-demo-default',
    portfolio_id: 'port-demo-001',
    title: 'Apple Services Revenue Sentiment Shift',
    message: 'Recent regulatory filings and antitrust commentary triggered a 12% negative sentiment drift across major news sources.',
    severity: 'INFO',
    category: 'SENTIMENT',
    is_read: true,
    created_at: new Date(Date.now() - 3600000 * 42).toISOString(),
  },
];

const INITIAL_WATCHLIST: WatchlistItem[] = [
  {
    id: 'wl-01',
    user_id: 'usr-demo-default',
    symbol: 'GOOGL',
    company_name: 'Alphabet Inc.',
    sector: 'Technology',
    target_price: 165.00,
    notes: 'Waiting for AI search monetization clarity',
    created_at: new Date().toISOString(),
  },
  {
    id: 'wl-02',
    user_id: 'usr-demo-default',
    symbol: 'AMD',
    company_name: 'Advanced Micro Devices, Inc.',
    sector: 'Technology',
    target_price: 140.00,
    notes: 'MI300 GPU ramp monitoring',
    created_at: new Date().toISOString(),
  },
  {
    id: 'wl-03',
    user_id: 'usr-demo-default',
    symbol: 'BRK.B',
    company_name: 'Berkshire Hathaway Inc.',
    sector: 'Financial Services',
    target_price: 440.00,
    notes: 'Defensive cash-rich balance sheet option',
    created_at: new Date().toISOString(),
  },
];

// Helper to generate 90-day realistic historical performance snapshots
function generateHistoricalSnapshots(holdings: Holding[]): PortfolioSnapshot[] {
  const snapshots: PortfolioSnapshot[] = [];
  const days = 90;
  const currentTotalValue = holdings.reduce((sum, h) => sum + h.quantity * h.current_price, 0);
  const totalInvested = holdings.reduce((sum, h) => sum + h.quantity * h.buy_price, 0);

  // Generate smooth walk backward
  let simulatedValue = currentTotalValue;
  const benchmarkBase = 50000;

  for (let i = days; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dateStr = d.toISOString().split('T')[0];

    // deterministic pseudo-random market fluctuation
    const dailyDrift = Math.sin(i * 0.18) * 450 + Math.cos(i * 0.08) * 300 + (days - i) * 60;
    const value = Math.max(totalInvested * 0.9, currentTotalValue - (days - i) * 110 + dailyDrift);
    const benchValue = benchmarkBase * (1 + ((days - i) * 0.0018) + Math.sin(i * 0.12) * 0.02);

    snapshots.push({
      snapshot_date: dateStr,
      total_value: Number(value.toFixed(2)),
      total_invested: Number(totalInvested.toFixed(2)),
      unrealized_pl: Number((value - totalInvested).toFixed(2)),
      benchmark_value: Number(benchValue.toFixed(2)),
    });
  }

  return snapshots;
}

// Global In-Memory state for the session
class MemoryDataStore {
  private portfolios: Portfolio[] = [INITIAL_PORTFOLIO];
  private holdings: Holding[] = [...INITIAL_HOLDINGS];
  private alerts: Alert[] = [...INITIAL_ALERTS];
  private watchlist: WatchlistItem[] = [...INITIAL_WATCHLIST];
  private agentRuns: AgentRun[] = [];

  getPortfolios(userId: string = 'usr-demo-default'): Portfolio[] {
    return this.portfolios.filter(p => p.user_id === userId);
  }

  getPortfolioById(id: string): Portfolio | undefined {
    return this.portfolios.find(p => p.id === id);
  }

  createPortfolio(data: Omit<Portfolio, 'id' | 'created_at' | 'updated_at'>): Portfolio {
    const newPort: Portfolio = {
      ...data,
      id: `port-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.portfolios.push(newPort);
    return newPort;
  }

  getHoldings(portfolioId: string): Holding[] {
    return this.holdings.filter(h => h.portfolio_id === portfolioId);
  }

  getAllHoldings(): Holding[] {
    return this.holdings;
  }

  addHolding(holding: Omit<Holding, 'id' | 'created_at' | 'updated_at'>): Holding {
    const newH: Holding = {
      ...holding,
      id: `h-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.holdings.push(newH);
    return newH;
  }

  updateHolding(id: string, updates: Partial<Holding>): Holding | null {
    const idx = this.holdings.findIndex(h => h.id === id);
    if (idx === -1) return null;
    this.holdings[idx] = {
      ...this.holdings[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    return this.holdings[idx];
  }

  deleteHolding(id: string): boolean {
    const initialLen = this.holdings.length;
    this.holdings = this.holdings.filter(h => h.id !== id);
    return this.holdings.length < initialLen;
  }

  getAlerts(userId: string = 'usr-demo-default'): Alert[] {
    return [...this.alerts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  private alertCounter = 0;

  createAlert(alert: Omit<Alert, 'id' | 'created_at' | 'is_read'>): Alert {
    this.alertCounter++;
    const newAlert: Alert = {
      ...alert,
      id: `alt-${Date.now()}-${this.alertCounter}`,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    this.alerts.unshift(newAlert);
    return newAlert;
  }

  markAlertRead(id: string): boolean {
    const alert = this.alerts.find(a => a.id === id);
    if (alert) {
      alert.is_read = true;
      return true;
    }
    return false;
  }

  getWatchlist(userId: string = 'usr-demo-default'): WatchlistItem[] {
    return this.watchlist.filter(w => w.user_id === userId);
  }

  addToWatchlist(item: Omit<WatchlistItem, 'id' | 'created_at'>): WatchlistItem {
    const existing = this.watchlist.find(w => w.symbol.toUpperCase() === item.symbol.toUpperCase());
    if (existing) return existing;
    const newItem: WatchlistItem = {
      ...item,
      symbol: item.symbol.toUpperCase(),
      id: `wl-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    this.watchlist.push(newItem);
    return newItem;
  }

  removeFromWatchlist(symbol: string): boolean {
    const len = this.watchlist.length;
    this.watchlist = this.watchlist.filter(w => w.symbol.toUpperCase() !== symbol.toUpperCase());
    return this.watchlist.length < len;
  }

  getSnapshots(portfolioId: string): PortfolioSnapshot[] {
    const holdings = this.getHoldings(portfolioId);
    return generateHistoricalSnapshots(holdings);
  }

  getAgentRuns(userId: string = 'usr-demo-default'): AgentRun[] {
    return this.agentRuns;
  }

  logAgentRun(run: Omit<AgentRun, 'id' | 'created_at'>): AgentRun {
    const newRun: AgentRun = {
      ...run,
      id: `run-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    this.agentRuns.unshift(newRun);
    return newRun;
  }
}

// Global singleton instance for serverless invocations within memory lifetime
export const memoryStore = new MemoryDataStore();
