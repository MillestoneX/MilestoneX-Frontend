import { NextRequest, NextResponse } from 'next/server';
import {
  requireAdminSession,
  approveFundRelease,
} from '@/lib/api/admin';

/**
 * PUT /api/admin/withdrawals/:id/approve
 *
 * Approves a pending fund-release via the backend.
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

    const withdrawal = await approveFundRelease(backendToken, params.id);

    return NextResponse.json({
      message: 'Withdrawal approved successfully',
      withdrawal,
    });
  } catch (error) {
    console.error('Error approving withdrawal:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to approve withdrawal';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
