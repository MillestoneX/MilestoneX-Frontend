import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { FundRelease, ApiResponse } from '@/types/api';

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
).replace(/\/+$/, '');

/**
 * Verify the caller is an authenticated admin.
 * Returns the backend JWT token on success, or null if unauthorized.
 */
export async function requireAdminSession(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (!session?.backendUser || session.backendUser.role !== 'admin') {
    return null;
  }
  return session.backendToken ?? null;
}

/**
 * Build standard headers for backend requests carrying the admin's JWT.
 */
function adminHeaders(backendToken: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${backendToken}`,
  };
}

/* ------------------------------------------------------------------ */
/*  Fund-Release (withdrawal) endpoints                                */
/* ------------------------------------------------------------------ */

/**
 * Fetch all fund-releases across every campaign.
 * Iterates campaigns → milestones → fund-releases since the backend
 * exposes per-campaign endpoints:
 *   GET /campaigns/:campaignId/milestones/fund-releases
 */
export async function fetchAllFundReleases(
  backendToken: string,
  filters?: { status?: string; date?: string },
): Promise<FundRelease[]> {
  // 1. Fetch all campaigns
  const campaignsRes = await fetch(`${BACKEND_URL}/campaigns`, {
    headers: adminHeaders(backendToken),
  });

  if (!campaignsRes.ok) {
    throw new Error(`Failed to fetch campaigns: ${campaignsRes.status}`);
  }

  const campaignsBody: ApiResponse<{ id: string }[]> =
    await campaignsRes.json();
  const campaigns = campaignsBody.data ?? [];

  // 2. For each campaign, fetch its fund-releases
  const allReleases: FundRelease[] = [];

  await Promise.all(
    campaigns.map(async (campaign) => {
      try {
        const res = await fetch(
          `${BACKEND_URL}/campaigns/${campaign.id}/milestones/fund-releases`,
          { headers: adminHeaders(backendToken) },
        );
        if (!res.ok) return;
        const body: ApiResponse<FundRelease[]> = await res.json();
        const releases = body.data ?? [];
        allReleases.push(
          ...releases.map((r) => ({
            ...r,
            campaignId: r.campaignId ?? campaign.id,
          })),
        );
      } catch {
        // Skip campaigns whose fund-releases fail to load
      }
    }),
  );

  // 3. Apply optional filters
  let filtered = allReleases;

  if (filters?.status) {
    filtered = filtered.filter((r) => r.status === filters.status);
  }

  if (filters?.date) {
    const filterDate = new Date(filters.date).toDateString();
    filtered = filtered.filter(
      (r) => new Date(r.createdAt).toDateString() === filterDate,
    );
  }

  // Sort newest first
  filtered.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return filtered;
}

/**
 * Fetch a single fund-release by its ID.
 * Since the backend scopes fund-releases under campaigns, we iterate
 * campaigns to locate the record. For production, a dedicated admin
 * endpoint (e.g. GET /admin/fund-releases/:id) would be preferable.
 */
export async function fetchFundReleaseById(
  backendToken: string,
  fundReleaseId: string,
): Promise<FundRelease | null> {
  const campaignsRes = await fetch(`${BACKEND_URL}/campaigns`, {
    headers: adminHeaders(backendToken),
  });

  if (!campaignsRes.ok) return null;

  const campaignsBody: ApiResponse<{ id: string }[]> =
    await campaignsRes.json();
  const campaigns = campaignsBody.data ?? [];

  for (const campaign of campaigns) {
    try {
      const res = await fetch(
        `${BACKEND_URL}/campaigns/${campaign.id}/milestones/fund-releases`,
        { headers: adminHeaders(backendToken) },
      );
      if (!res.ok) continue;
      const body: ApiResponse<FundRelease[]> = await res.json();
      const found = (body.data ?? []).find((r) => r.id === fundReleaseId);
      if (found) return { ...found, campaignId: found.campaignId ?? campaign.id };
    } catch {
      // continue
    }
  }

  return null;
}

/**
 * Approve a fund-release.
 */
export async function approveFundRelease(
  backendToken: string,
  fundReleaseId: string,
): Promise<FundRelease> {
  const res = await fetch(
    `${BACKEND_URL}/fund-releases/${fundReleaseId}/approve`,
    {
      method: 'PUT',
      headers: adminHeaders(backendToken),
    },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ??
        `Failed to approve fund-release: ${res.status}`,
    );
  }

  const body: ApiResponse<FundRelease> = await res.json();
  return body.data;
}

/**
 * Reject a fund-release with a reason.
 */
export async function rejectFundRelease(
  backendToken: string,
  fundReleaseId: string,
  reason: string,
): Promise<FundRelease> {
  const res = await fetch(
    `${BACKEND_URL}/fund-releases/${fundReleaseId}/reject`,
    {
      method: 'PUT',
      headers: adminHeaders(backendToken),
      body: JSON.stringify({ reason }),
    },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ??
        `Failed to reject fund-release: ${res.status}`,
    );
  }

  const body: ApiResponse<FundRelease> = await res.json();
  return body.data;
}

/**
 * Mark a fund-release as completed with a Stellar transaction hash.
 */
export async function completeFundRelease(
  backendToken: string,
  fundReleaseId: string,
  txHash: string,
): Promise<FundRelease> {
  const res = await fetch(
    `${BACKEND_URL}/fund-releases/${fundReleaseId}/complete`,
    {
      method: 'PUT',
      headers: adminHeaders(backendToken),
      body: JSON.stringify({ txHash }),
    },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ??
        `Failed to complete fund-release: ${res.status}`,
    );
  }

  const body: ApiResponse<FundRelease> = await res.json();
  return body.data;
}
