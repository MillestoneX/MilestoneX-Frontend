import { NextRequest, NextResponse } from 'next/server';
import {
  requireAdminSession,
  fetchFundReleaseById,
} from '@/lib/api/admin';

/**
 * GET /api/admin/withdrawals/:id
 *
 * Returns a single fund-release record by ID from the backend.
 * Returns 401 without a valid admin session.
 */
export async function GET(
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

    const release = await fetchFundReleaseById(backendToken, params.id);

    if (!release) {
      return NextResponse.json(
        { error: 'Withdrawal not found' },
        { status: 404 },
      );
    }

    return NextResponse.json(release);
  } catch (error) {
    console.error('Error fetching withdrawal:', error);
    return NextResponse.json(
      { error: 'Failed to fetch withdrawal' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/admin/withdrawals/:id
 *
 * Delegates deletion to the backend. Returns 401 without a valid
 * admin session.
 */
export async function DELETE(
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

    const API_URL = (
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
    ).replace(/\/+$/, '');

    const res = await fetch(`${API_URL}/fund-releases/${params.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${backendToken}`,
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const status = res.status;
      return NextResponse.json(
        { error: (err as { message?: string }).message ?? 'Failed to delete withdrawal' },
        { status },
      );
    }

    return NextResponse.json({ message: 'Withdrawal deleted successfully' });
  } catch (error) {
    console.error('Error deleting withdrawal:', error);
    return NextResponse.json(
      { error: 'Failed to delete withdrawal' },
      { status: 500 },
    );
  }
}
