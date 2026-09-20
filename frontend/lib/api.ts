import axios from "axios";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:7860";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 180000, // 3 minutes timeout for long multi-agent cycles
});

export interface Holding {
  symbol: string;
  quantity: number;
  weight: number;
  target_weight?: number;
}

export interface PortfolioUploadResponse {
  status: string;
  message: string;
  holdings?: Holding[];
  portfolio_value?: number;
}

export interface MonitorRequest {
  mandate?: string;
  days?: number;
  drawdown_tolerance?: number;
}

export interface MonitorResponse {
  status: string;
  message?: string;
  risk_metrics?: any;
  alerts?: any[];
  news_analyses?: Record<string, any>;
  briefing?: string;
  forecast?: any;
  trace?: string;
  error?: string;
}

export interface SystemStatus {
  portfolio_loaded: boolean;
  portfolio_holdings: number;
  analysis_complete: boolean;
  model: string;
  timestamp: string;
}

/**
 * Upload a CSV portfolio file to the backend
 */
export async function uploadPortfolio(file: File): Promise<PortfolioUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post<PortfolioUploadResponse>(
    "/api/portfolio/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
}

/**
 * Trigger full multi-agent monitoring cycle
 */
export async function runMonitoring(
  mandate: string = "balanced",
  days: number = 90,
  drawdownTolerance: number = -0.15
): Promise<MonitorResponse> {
  const payload: MonitorRequest = {
    mandate,
    days,
    drawdown_tolerance: drawdownTolerance,
  };

  const response = await api.post<MonitorResponse>("/api/monitor/run", payload);
  return response.data;
}

/**
 * Fetch risk metrics for the currently loaded portfolio
 */
export async function getRiskMetrics(): Promise<any> {
  const response = await api.get("/api/portfolio/risk");
  return response.data;
}

/**
 * Fetch ML volatility forecasts
 */
export async function getForecast(): Promise<any> {
  const response = await api.get("/api/forecast");
  return response.data;
}

/**
 * Fetch execution trace of the multi-agent system
 */
export async function getTrace(): Promise<any> {
  const response = await api.get("/api/trace");
  return response.data;
}

/**
 * Fetch system and model health status
 */
export async function getStatus(): Promise<SystemStatus> {
  const response = await api.get<SystemStatus>("/api/status");
  return response.data;
}

export default api;
