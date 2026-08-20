import { NextRequest, NextResponse } from 'next/server';
import {
  requireAdminSession,
  rejectFundRelease,
} from '@/lib/api/admin';

/**
 * PUT /api/admin/withdrawals/:id/reject
 *
 * Rejects a pending fund-release with a reason via the backend.
 * Returns 401 without a valid admin session.
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
    const { reason } = body;

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 },
      );
    }

    const withdrawal = await rejectFundRelease(
      backendToken,
      params.id,
      reason.trim(),
    );

    return NextResponse.json({
      message: 'Withdrawal rejected successfully',
      withdrawal,
    });
  } catch (error) {
    console.error('Error rejecting withdrawal:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to reject withdrawal';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
