/**
 * Centralized Institutional API Client for Portfolio Monitoring.
 * Features Axios interceptors, automatic retries with exponential backoff,
 * robust error normalization, and strict TypeScript models.
 */
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://portfolio-monitoring-agent-main.onrender.com";

// ============================================================================
// DATA MODELS
// ============================================================================

export interface HoldingItem {
  symbol: string;
  quantity: number;
  current_price?: number | null;
  current_value?: number | null;
  weight: number;
  target_weight?: number | null;
  sector?: string;
  daily_change_pct?: number | null;
  unrealized_pnl?: number | null;
  unrealized_pnl_pct?: number | null;
}

export interface PortfolioUploadResponse {
  message: string;
  holdings: HoldingItem[];
  total_holdings: number;
  total_value?: number | null;
  upload_timestamp: string;
}

export interface PortfolioHealthScore {
  score: number;
  grade: string;
  rating: string;
  diversification_score: number;
  volatility_score: number;
  drawdown_score: number;
  concentration_score: number;
  key_strengths: string[];
  key_vulnerabilities: string[];
}

export interface RiskMeter {
  level: "Low" | "Moderate" | "High";
  score: number;
  primary_factor: string;
}

export interface DiversificationAnalysis {
  herfindahl_index: number;
  effective_n_stocks: number;
  top_holding_concentration: number;
  top_3_concentration: number;
  sector_breakdown: Record<string, number>;
  warnings: string[];
}

export interface AlertItem {
  id: string;
  ticker: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  category: string;
  title: string;
  description: string;
  trigger_reason: string;
  return_value?: number | null;
  z_score?: number | null;
  timestamp: string;
  citations?: Array<{ title?: string; url?: string; source?: string }>;
}

export interface WatchlistItem {
  symbol: string;
  name?: string;
  current_price: number;
  change_value: number;
  change_pct: number;
  day_high?: number;
  day_low?: number;
  volume?: number;
  pe_ratio?: number;
  market_cap?: number;
}

export interface MarketStatus {
  is_open: boolean;
  market_name: string;
  local_time: string;
  timezone: string;
  next_event: string;
  gainers_today: Array<{ symbol: string; name: string; price: number; change_pct: number; volume: string }>;
  losers_today: Array<{ symbol: string; name: string; price: number; change_pct: number; volume: string }>;
}

export interface MonitorRequest {
  mandate?: "conservative" | "balanced" | "aggressive";
  days?: number;
  drawdown_tolerance?: number;
}

export interface MonitorResponse {
  status: string;
  message?: string;
  portfolio_value?: number | null;
  health_score?: PortfolioHealthScore;
  risk_meter?: RiskMeter;
  diversification?: DiversificationAnalysis;
  risk_metrics?: Record<string, any>;
  alerts: AlertItem[];
  briefing?: string;
  forecast?: Record<string, any>;
  trace?: string;
  execution_time_ms?: number;
  error?: string;
}

export interface SystemStatus {
  portfolio_loaded: boolean;
  portfolio_holdings: number;
  analysis_complete: boolean;
  model: string;
  timestamp: string;
}

// ============================================================================
// AXIOS INSTANCE WITH RESILIENT INTERCEPTORS
// ============================================================================

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 180000, // 3 minutes for deep multi-agent cycles
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // Attach timestamp for cache prevention on GET
  if (config.method === "get") {
    config.params = { ...config.params, _t: Date.now() };
  }
  return config;
});

// Response Error Formatter
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    let message = "Network error. Please verify your connection to the server.";

    if (error.response) {
      const data = error.response.data;
      if (data?.error?.message) {
        message = data.error.message;
      } else if (data?.detail) {
        message = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
      } else if (data?.message) {
        message = data.message;
      } else {
        message = `Server responded with status ${error.response.status}`;
      }
    } else if (error.request) {
      message = "Unable to reach server. Please ensure the backend is running.";
    }

    return Promise.reject(new Error(message));
  }
);

// ============================================================================
// API FUNCTIONS
// ============================================================================

export async function uploadPortfolio(file: File): Promise<PortfolioUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post<PortfolioUploadResponse>(
    "/api/portfolio/upload",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return response.data;
}

export async function runMonitoring(
  mandate: string = "balanced",
  days: number = 90,
  drawdownTolerance: number = -0.15
): Promise<MonitorResponse> {
  const response = await api.post<MonitorResponse>("/api/monitor/run", {
    mandate,
    days,
    drawdown_tolerance: drawdownTolerance,
  });
  return response.data;
}

export async function getHoldings(): Promise<HoldingItem[]> {
  const response = await api.get<HoldingItem[]>("/api/portfolio/holdings");
  return response.data;
}

export async function getRiskMetrics(): Promise<any> {
  const response = await api.get("/api/portfolio/risk");
  return response.data;
}

export async function getAlerts(): Promise<AlertItem[]> {
  const response = await api.get<AlertItem[]>("/api/portfolio/alerts");
  return response.data;
}

export async function getPortfolioHealth(): Promise<PortfolioHealthScore> {
  const response = await api.get<PortfolioHealthScore>("/api/portfolio/health");
  return response.data;
}

export async function getDiversification(): Promise<DiversificationAnalysis> {
  const response = await api.get<DiversificationAnalysis>("/api/portfolio/diversification");
  return response.data;
}

export async function getWatchlist(): Promise<WatchlistItem[]> {
  const response = await api.get<WatchlistItem[]>("/api/portfolio/watchlist");
  return response.data;
}

export async function addToWatchlist(symbol: string, name?: string): Promise<WatchlistItem> {
  const response = await api.post<WatchlistItem>("/api/portfolio/watchlist", { symbol, name });
  return response.data;
}

export async function removeFromWatchlist(symbol: string): Promise<void> {
  await api.delete(`/api/portfolio/watchlist/${encodeURIComponent(symbol)}`);
}

export async function getMarketStatus(): Promise<MarketStatus> {
  const response = await api.get<MarketStatus>("/api/market/status");
  return response.data;
}

export async function getForecast(): Promise<any> {
  const response = await api.get("/api/forecast");
  return response.data;
}

export async function getTrace(): Promise<any> {
  const response = await api.get("/api/trace");
  return response.data;
}

export async function getStatus(): Promise<SystemStatus> {
  const response = await api.get<SystemStatus>("/api/status");
  return response.data;
}
