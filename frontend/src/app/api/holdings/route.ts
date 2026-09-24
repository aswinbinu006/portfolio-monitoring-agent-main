import { NextRequest, NextResponse } from 'next/server';
import {
  getPortfolioHoldings,
  addPortfolioHolding,
  updatePortfolioHolding,
  deletePortfolioHolding,
  getPortfolioSnapshots,
} from '@/lib/supabase/database';
import { calculatePortfolioStats } from '@/lib/math/stats';
import { HoldingCreateSchema } from '@/lib/validators/schemas';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const portfolioId = searchParams.get('portfolioId') || 'port-demo-001';

    const holdings = await getPortfolioHoldings(portfolioId);
    const snapshots = await getPortfolioSnapshots(portfolioId);
    const stats = calculatePortfolioStats(
      holdings,
      snapshots.map(s => s.total_value),
      snapshots.map(s => s.benchmark_value || 50000)
    );

    return NextResponse.json({ holdings, stats, snapshots });
  } catch (error: any) {
    console.error('Holdings GET Error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch holdings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = HoldingCreateSchema.parse(body);

    const created = await addPortfolioHolding(validated);
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error('Holding POST Error:', error);
    return NextResponse.json({ error: error?.message || 'Invalid holding data' }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: 'Holding ID is required' }, { status: 400 });

    const updated = await updatePortfolioHolding(id, updates);
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Holding PATCH Error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to update holding' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Holding ID is required' }, { status: 400 });

    const ok = await deletePortfolioHolding(id);
    return NextResponse.json({ success: ok });
  } catch (error: any) {
    console.error('Holding DELETE Error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to delete holding' }, { status: 500 });
  }
}
