import { NextRequest, NextResponse } from 'next/server';
import { addPortfolioHolding, getPortfolioHoldings } from '@/lib/supabase/database';
import { parseAndValidateCsv, ValidatedHoldingRow } from '@/lib/utils/csv-parser';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { portfolioId, csvText, rows } = body;

    if (!portfolioId) {
      return NextResponse.json({ error: 'portfolioId is required' }, { status: 400 });
    }

    let holdingsToInsert: ValidatedHoldingRow[] = [];

    if (rows && Array.isArray(rows)) {
      // User reviewed & confirmed edited rows from preview
      holdingsToInsert = rows.filter((r: ValidatedHoldingRow) => r.isValid);
    } else if (csvText) {
      const parsed = parseAndValidateCsv(csvText);
      holdingsToInsert = parsed.rows.filter(r => r.isValid);
    }

    if (holdingsToInsert.length === 0) {
      return NextResponse.json({ error: 'No valid holdings to import' }, { status: 400 });
    }

    const inserted = [];
    for (const h of holdingsToInsert) {
      const res = await addPortfolioHolding({
        portfolio_id: portfolioId,
        symbol: h.symbol,
        company_name: h.company_name,
        quantity: h.quantity,
        buy_price: h.buy_price,
        current_price: h.current_price,
        sector: h.sector || 'General',
        asset_type: h.asset_type || 'Stock',
        currency: h.currency || 'USD',
        purchase_date: h.purchase_date,
        broker: h.broker,
      });
      inserted.push(res);
    }

    const updatedHoldings = await getPortfolioHoldings(portfolioId);

    return NextResponse.json({
      success: true,
      importedCount: inserted.length,
      totalHoldingsCount: updatedHoldings.length,
      holdings: updatedHoldings,
    });
  } catch (error: any) {
    console.error('CSV Import Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to import CSV holdings' },
      { status: 500 }
    );
  }
}
