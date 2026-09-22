/**
 * Centralized API Client for Portfolio Monitoring.
 * Features JWT authentication interceptors, SQLite persistent memory calls,
 * automatic error handling, and strict TypeScript contracts.
 */
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:7860";

// ============================================================================
// DATA MODELS
// ============================================================================

export interface User {
  id: number;
  email: string;
  created_at?: string;
}

export interface AuthResponse {
  status: string;
  message: string;
  token: string;
  user: User;
}

export interface HistorySummary {
  id: number;
  session_id: string;
  mandate: string;
  days: number;
  orchestrator_engine: string;
  created_at: string;
  briefing_snippet: string;
  volatility?: number | null;
  max_drawdown?: number | null;
  total_return?: number | null;
  alerts_count: number;
}

export interface HistoryDetail {
  id: number;
  user_id: number;
  session_id: string;
  mandate: string;
  days: number;
  drawdown_tolerance: number;
  portfolio_snapshot: HoldingItem[];
  risk_metrics: Record<string, any>;
  alerts: AlertItem[];
  news_analyses: any[];
  drift_analysis: Record<string, any>;
  forecast: Record<string, any>;
  briefing: string;
  trace: string;
  orchestrator_engine: string;
  created_at: string;
}

export interface HoldingItem {
  symbol: string;
  quantity: number;
  current_price?: number | null;
  current_value?: number | null;
  weight: number;
  target_weight?: number | null;
  sector?: string;
}

export interface PortfolioUploadResponse {
  message: string;
  holdings: HoldingItem[];
  total_holdings: number;
  total_value?: number | null;
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
  category: "DRAWDOWN" | "VOLATILITY" | "RETURN_SPIKE" | "CONCENTRATION";
  title: string;
  description: string;
  trigger_reason?: string;
  return_value?: number;
  z_score?: number;
  citations?: string[];
}

export interface WatchlistItem {
  symbol: string;
  name?: string | null;
  sector?: string;
  added_at: string;
}

export interface MarketStatus {
  is_open: boolean;
  market_name: string;
  local_time: string;
  timezone: string;
  next_event: string;
  gainers_today: Array<{
    symbol: string;
    name: string;
    price: number;
    change_pct: number;
    volume: string;
  }>;
  losers_today: Array<{
    symbol: string;
    name: string;
    price: number;
    change_pct: number;
    volume: string;
  }>;
}

export interface MonitorResponse {
  status: string;
  message: string;
  portfolio_value?: number;
  health_score?: PortfolioHealthScore;
  risk_meter?: RiskMeter;
  diversification?: DiversificationAnalysis;
  risk_metrics?: Record<string, any>;
  alerts?: AlertItem[];
  briefing?: string;
  forecast?: Record<string, any>;
  trace?: string;
  execution_time_ms?: number;
}

export interface SystemStatus {
  status: string;
  database: string;
  orchestrator: string;
  model: string;
  timestamp: string;
}

// ============================================================================
// TOKEN & AUTH STATE HELPERS
// ============================================================================

const TOKEN_KEY = "portfolio_agent_jwt";
const USER_KEY = "portfolio_agent_user";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function clearToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredUser(user: User): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

// ============================================================================
// AXIOS INSTANCE & INTERCEPTORS
// ============================================================================

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach JWT Bearer Token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Error Interceptor: Handle 401 & normalize errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    let message = "Network error. Please verify your connection to the server.";

    if (error.response) {
      const data = error.response.data;
      if (error.response.status === 401) {
        clearToken();
        // Redirect to login if running in browser and not already on /login
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
          window.location.assign("/login");
        }
      }

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
      message = "Unable to reach server. Please ensure the FastAPI backend is running.";
    }

    return Promise.reject(new Error(message));
  }
);

// ============================================================================
// AUTHENTICATION FUNCTIONS
// ============================================================================

export async function signup(email: string, password: string): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/api/auth/signup", { email, password });
  setToken(response.data.token);
  setStoredUser(response.data.user);
  return response.data;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/api/auth/login", { email, password });
  setToken(response.data.token);
  setStoredUser(response.data.user);
  return response.data;
}

export async function getMe(): Promise<User> {
  const response = await api.get<{ status: string; user: User }>("/api/auth/me");
  setStoredUser(response.data.user);
  return response.data.user;
}

export function logout(): void {
  clearToken();
  if (typeof window !== "undefined") {
    window.location.assign("/login");
  }
}

// ============================================================================
// AGENT HISTORY / MEMORY FUNCTIONS (SQLite)
// ============================================================================

export async function getHistory(limit: number = 20): Promise<HistorySummary[]> {
  const response = await api.get<HistorySummary[]>(`/api/history?limit=${limit}`);
  return response.data;
}

export async function getHistoryDetail(runId: number): Promise<HistoryDetail> {
  const response = await api.get<HistoryDetail>(`/api/history/${runId}`);
  return response.data;
}

// ============================================================================
// PORTFOLIO & AGENT EXECUTION FUNCTIONS
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

export async function getStatus(): Promise<SystemStatus> {
  const response = await api.get<SystemStatus>("/api/status");
  return response.data;
}
