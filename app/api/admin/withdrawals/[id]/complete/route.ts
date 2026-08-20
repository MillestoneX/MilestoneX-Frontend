import { NextRequest, NextResponse } from 'next/server';
import {
  requireAdminSession,
  completeFundRelease,
} from '@/lib/api/admin';

/**
 * PUT /api/admin/withdrawals/:id/complete
 *
 * Marks an approved fund-release as completed with a Stellar
 * transaction hash. Returns 401 without a valid admin session.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const backendToken = await requireAdminSession();
    if (!backendToken) {
      return NextResponse.json(
        { error: 'Unauthorized – admin access required' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { transactionHash } = body;

    if (!transactionHash || transactionHash.trim().length === 0) {
      return NextResponse.json(
        { error: 'Transaction hash is required' },
        { status: 400 },
      );
    }

    const withdrawal = await completeFundRelease(
      backendToken,
      params.id,
      transactionHash.trim(),
    );

    return NextResponse.json({
      message: 'Withdrawal completed successfully',
      withdrawal,
    });
  } catch (error) {
    console.error('Error completing withdrawal:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to complete withdrawal';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
