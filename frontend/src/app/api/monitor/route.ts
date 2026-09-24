import { NextRequest, NextResponse } from 'next/server';
import { monitorPortfolio } from '@/lib/agent/monitor-loop';
import { getActiveUserId, getUserPortfolios } from '@/lib/supabase/database';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const userId = await getActiveUserId();
    const portfolios = await getUserPortfolios(userId);
    const portfolioId = body.portfolioId || portfolios[0]?.id || 'port-demo-001';

    const result = await monitorPortfolio(userId, portfolioId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Monitoring API Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to complete monitoring check' },
      { status: 500 }
    );
  }
}
