import { NextRequest, NextResponse } from 'next/server';
import {
  requireAdminSession,
  fetchAllFundReleases,
} from '@/lib/api/admin';
import { FundRelease } from '@/types/api';

/**
 * GET /api/admin/withdrawals
 *
 * Returns real fund-release records from the backend when an admin
 * token is present. Returns 401 without a valid admin session.
 *
 * Query params:
 *   status – filter by PENDING | APPROVED | REJECTED | COMPLETED
 *   date   – filter by request date (ISO string, matched by day)
 */
export async function GET(request: NextRequest) {
  try {
    const backendToken = await requireAdminSession();
    if (!backendToken) {
      return NextResponse.json(
        { error: 'Unauthorized – admin access required' },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') ?? undefined;
    const date = searchParams.get('date') ?? undefined;

    const releases: FundRelease[] = await fetchAllFundReleases(backendToken, {
      status,
      date,
    });

    return NextResponse.json(releases);
  } catch (error) {
    console.error('Error fetching withdrawals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch withdrawals' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/admin/withdrawals
 *
 * Forwards a withdrawal (fund-release) creation request to the backend.
 * The body must include at least milestoneId and amount.
 */
export async function POST(request: NextRequest) {
  try {
    const backendToken = await requireAdminSession();
    if (!backendToken) {
      return NextResponse.json(
        { error: 'Unauthorized – admin access required' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { milestoneId, amount, releaseReason } = body;

    if (!milestoneId || amount === undefined) {
      return NextResponse.json(
        { error: 'milestoneId and amount are required' },
        { status: 400 },
      );
    }

    const API_URL = (
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
    ).replace(/\/+$/, '');

    const res = await fetch(`${API_URL}/fund-releases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${backendToken}`,
      },
      body: JSON.stringify({ milestoneId, amount, releaseReason }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: (err as { message?: string }).message ?? 'Failed to create withdrawal' },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data.data ?? data, { status: 201 });
  } catch (error) {
    console.error('Error creating withdrawal:', error);
    return NextResponse.json(
      { error: 'Failed to create withdrawal' },
      { status: 500 },
    );
  }
}
