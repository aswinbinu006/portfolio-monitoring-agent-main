import Papa from 'papaparse';
import { CsvRowSchema } from '../validators/schemas';

export interface ValidatedHoldingRow {
  symbol: string;
  company_name: string;
  quantity: number;
  buy_price: number;
  current_price: number;
  sector: string;
  asset_type: 'Stock' | 'ETF' | 'Mutual Fund' | 'Crypto' | 'Cash' | 'Other';
  purchase_date: string;
  currency: string;
  broker?: string;
  isValid: boolean;
  errors: string[];
}

export interface CsvParseResult {
  rows: ValidatedHoldingRow[];
  totalRows: number;
  validCount: number;
  invalidCount: number;
  hasErrors: boolean;
  duplicateSymbols: string[];
}

/**
 * Normalizes CSV headers to standard format
 */
function normalizeHeader(header: string): string {
  const h = header.trim().toLowerCase().replace(/[\s_-]+/g, '');
  if (['symbol', 'ticker', 'code', 'stock'].includes(h)) return 'Symbol';
  if (['company', 'companyname', 'name', 'security'].includes(h)) return 'Company';
  if (['quantity', 'shares', 'qty', 'units'].includes(h)) return 'Quantity';
  if (['buyprice', 'purchaseprice', 'cost', 'avgcost', 'averagecost', 'costbasis'].includes(h)) return 'Buy_Price';
  if (['currentprice', 'marketprice', 'price', 'lastprice'].includes(h)) return 'Current_Price';
  if (['sector', 'industry', 'category'].includes(h)) return 'Sector';
  if (['purchasedate', 'date', 'boughtdate'].includes(h)) return 'Purchase_Date';
  if (['currency', 'curr'].includes(h)) return 'Currency';
  if (['assettype', 'type', 'asset'].includes(h)) return 'Asset_Type';
  if (['broker', 'exchange', 'account'].includes(h)) return 'Broker';
  return header.trim();
}

/**
 * Parses and validates CSV content
 */
export function parseAndValidateCsv(csvText: string): CsvParseResult {
  const parsed = Papa.parse<Record<string, any>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: normalizeHeader,
  });

  const rows: ValidatedHoldingRow[] = [];
  const symbolCount = new Map<string, number>();

  parsed.data.forEach((rawRow, idx) => {
    const errors: string[] = [];

    // Parse and validate with Zod
    const result = CsvRowSchema.safeParse(rawRow);
    const sym = (rawRow.Symbol || '').toUpperCase().trim();

    if (!sym) {
      errors.push('Missing or empty ticker symbol');
    } else {
      symbolCount.set(sym, (symbolCount.get(sym) || 0) + 1);
    }

    if (!rawRow.Company) {
      errors.push('Missing company name');
    }

    const qty = Number(rawRow.Quantity);
    if (isNaN(qty) || qty <= 0) {
      errors.push('Invalid quantity (must be a positive number)');
    }

    const buyPrice = Number(rawRow.Buy_Price);
    if (isNaN(buyPrice) || buyPrice < 0) {
      errors.push('Invalid buy price (must be >= 0)');
    }

    const currentPrice = rawRow.Current_Price ? Number(rawRow.Current_Price) : buyPrice;
    if (isNaN(currentPrice) || currentPrice < 0) {
      errors.push('Invalid current price');
    }

    const assetType = (['Stock', 'ETF', 'Mutual Fund', 'Crypto', 'Cash'].includes(rawRow.Asset_Type)
      ? rawRow.Asset_Type
      : 'Stock') as ValidatedHoldingRow['asset_type'];

    rows.push({
      symbol: sym || `UNKNOWN-${idx + 1}`,
      company_name: rawRow.Company || sym || 'Unnamed Asset',
      quantity: isNaN(qty) ? 0 : qty,
      buy_price: isNaN(buyPrice) ? 0 : buyPrice,
      current_price: isNaN(currentPrice) ? (isNaN(buyPrice) ? 0 : buyPrice) : currentPrice,
      sector: rawRow.Sector || 'General',
      asset_type: assetType,
      purchase_date: rawRow.Purchase_Date || new Date().toISOString().split('T')[0],
      currency: rawRow.Currency || 'USD',
      broker: rawRow.Broker || undefined,
      isValid: errors.length === 0,
      errors,
    });
  });

  // Check duplicates
  const duplicateSymbols: string[] = [];
  symbolCount.forEach((count, sym) => {
    if (count > 1) duplicateSymbols.push(sym);
  });

  rows.forEach(r => {
    if (duplicateSymbols.includes(r.symbol)) {
      r.errors.push(`Duplicate ticker symbol ${r.symbol} detected in CSV file`);
      r.isValid = false;
    }
  });

  const validCount = rows.filter(r => r.isValid).length;
  const invalidCount = rows.length - validCount;

  return {
    rows,
    totalRows: rows.length,
    validCount,
    invalidCount,
    hasErrors: invalidCount > 0,
    duplicateSymbols,
  };
}
