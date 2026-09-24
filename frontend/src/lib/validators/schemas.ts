import { z } from 'zod';

// ==========================================
// Portfolio & Holdings Schemas
// ==========================================

export const PortfolioCreateSchema = z.object({
  name: z.string().min(1, 'Portfolio name is required').max(100),
  description: z.string().max(500).optional().default(''),
  currency: z.string().min(1).max(10).default('USD'),
  benchmark: z.string().min(1).max(20).default('SPY'),
  is_default: z.boolean().default(false),
});

export const HoldingCreateSchema = z.object({
  portfolio_id: z.string().min(1),
  symbol: z.string().min(1, 'Symbol is required').max(20).transform(s => s.toUpperCase().trim()),
  company_name: z.string().min(1, 'Company name is required'),
  asset_type: z.enum(['Stock', 'ETF', 'Mutual Fund', 'Crypto', 'Cash', 'Other']).default('Stock'),
  sector: z.string().min(1).default('General'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  buy_price: z.number().nonnegative('Buy price cannot be negative'),
  current_price: z.number().nonnegative('Current price cannot be negative'),
  currency: z.string().default('USD'),
  purchase_date: z.string().optional().default(() => new Date().toISOString().split('T')[0]),
  broker: z.string().optional(),
  notes: z.string().optional(),
});

export const HoldingUpdateSchema = HoldingCreateSchema.partial();

export const CsvRowSchema = z.object({
  Symbol: z.string().min(1, 'Symbol is required').transform(s => s.toUpperCase().trim()),
  Company: z.string().min(1, 'Company name is required'),
  Quantity: z.coerce.number().positive('Quantity must be positive'),
  Buy_Price: z.coerce.number().nonnegative('Buy price must be non-negative'),
  Current_Price: z.coerce.number().nonnegative('Current price must be non-negative').optional(),
  Sector: z.string().optional().default('General'),
  Purchase_Date: z.string().optional(),
  Currency: z.string().optional().default('USD'),
  Asset_Type: z.string().optional().default('Stock'),
  Broker: z.string().optional(),
});

// ==========================================
// Agent Tools Zod Schemas
// ==========================================

export const PortfolioToolInputSchema = z.object({
  portfolioId: z.string().min(1),
});

export const SymbolToolInputSchema = z.object({
  symbol: z.string().min(1).transform(s => s.toUpperCase().trim()),
});

export const HistoricalPricesToolInputSchema = z.object({
  symbol: z.string().min(1).transform(s => s.toUpperCase().trim()),
  days: z.number().int().min(5).max(365).default(90),
});

export const NewsSearchToolInputSchema = z.object({
  query: z.string().min(1),
  limit: z.number().int().min(1).max(20).default(5),
});

export const SentimentToolInputSchema = z.object({
  target: z.string().min(1),
  type: z.enum(['COMPANY', 'SECTOR', 'MARKET']).default('COMPANY'),
});

export const ForecastToolInputSchema = z.object({
  symbol: z.string().min(1).transform(s => s.toUpperCase().trim()),
  horizon: z.enum(['1M', '3M', '6M', '1Y']).default('3M'),
});

export const AlertCreateToolInputSchema = z.object({
  portfolioId: z.string().min(1),
  title: z.string().min(1),
  message: z.string().min(1),
  severity: z.enum(['INFO', 'WATCH', 'IMPORTANT', 'HIGH_PRIORITY']),
  category: z.enum(['PRICE_MOVEMENT', 'CONCENTRATION', 'EARNINGS', 'SENTIMENT', 'VOLATILITY', 'DRAWDOWN', 'NEWS', 'GENERAL']),
});

// ==========================================
// Agent Structured Output Schema
// ==========================================

export const AgentResponseSchema = z.object({
  summary: z.string().describe('Concise high-level executive explanation addressing the user question'),
  observations: z.array(z.string()).describe('Specific factual observations derived from portfolio or market data'),
  key_factors: z.array(z.string()).describe('Primary causal drivers, technical indicators, or corporate events'),
  risks: z.array(z.string()).describe('Identified downside risk factors or sensitivities'),
  forecast: z.object({
    scenario: z.string().optional(),
    estimated_range: z.string().optional(),
    horizon: z.string().optional(),
    assumptions: z.array(z.string()).optional(),
  }).optional().describe('Model-generated forward scenario with uncertainty bounds'),
  confidence: z.enum(['HIGH', 'MODERATE', 'LOW']).describe('Confidence in the analytical synthesis based on data availability'),
  data_timestamp: z.string().describe('ISO timestamp of the underlying data analyzed'),
  sources: z.array(z.string()).describe('Data sources and analytical tools utilized'),
  tools_called: z.array(z.string()).optional().describe('List of tools invoked during reasoning'),
});

export type AgentResponse = z.infer<typeof AgentResponseSchema>;
