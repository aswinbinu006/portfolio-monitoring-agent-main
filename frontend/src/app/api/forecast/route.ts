import { NextRequest, NextResponse } from 'next/server';
import { marketDataProvider } from '@/lib/providers/market-data';
import { generateScenarioForecast } from '@/lib/math/forecasting';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get('symbol') || 'AAPL';
    const horizon = (searchParams.get('horizon') || '3M') as '1M' | '3M' | '6M' | '1Y';

    const history = await marketDataProvider.getHistoricalPrices(symbol, 90);
    const forecast = generateScenarioForecast(symbol, history, horizon);

    return NextResponse.json(forecast);
  } catch (error: any) {
    console.error('Forecast API Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate forecast scenarios' },
      { status: 500 }
    );
  }
}
