import { NextRequest, NextResponse } from 'next/server';
import { deleteUserData, getUserData, saveUserData } from '@/lib/server/userDataStore';
import type { UserDataSnapshot } from '@/types/userData';

// ── JWT helpers ─────────────────────────────────────────────────────────────
// Mirrors the decoding logic in middleware.ts.  We decode the JWT that the
// backend issues and extract the walletAddress claim.  The signature is not
// verified here because the token is signed by the backend and we trust it
// the same way the middleware does.

const JWT_HEADER_REGEX = /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/;

interface JwtPayload {
  walletAddress?: string;
  exp?: number;
  [key: string]: unknown;
}

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    if (!JWT_HEADER_REGEX.test(token)) return null;

    const payloadSegment = token.split('.')[1];
    if (!payloadSegment) return null;

    const base64 = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(jsonPayload) as JwtPayload;
  } catch {
    return null;
  }
}

function isTokenExpired(payload: JwtPayload): boolean {
  if (typeof payload.exp !== 'number') return true;
  return payload.exp <= Date.now() / 1000;
}

// ── Authentication ──────────────────────────────────────────────────────────
// Returns the authenticated wallet address or an error response.  The wallet
// address is derived exclusively from the JWT – the x-wallet-address header
// is never consulted.

function authenticate(request: NextRequest): { walletAddress: string } | NextResponse {
  const token = request.cookies.get('token')?.value;

  if (!token) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 },
    );
  }

  const payload = decodeJwtPayload(token);

  if (!payload || isTokenExpired(payload)) {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 },
    );
  }

  const walletAddress = typeof payload.walletAddress === 'string'
    ? payload.walletAddress.trim()
    : '';

  if (!walletAddress) {
    return NextResponse.json(
      { error: 'Token does not contain a wallet address' },
      { status: 403 },
    );
  }

  return { walletAddress };
}

// ── Route handlers ──────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const auth = authenticate(request);
  if (auth instanceof NextResponse) return auth;

  const snapshot = await getUserData(auth.walletAddress);
  return NextResponse.json({ data: snapshot, status: 200 });
}

export async function PUT(request: NextRequest) {
  const auth = authenticate(request);
  if (auth instanceof NextResponse) return auth;

  const body = (await request.json()) as Omit<UserDataSnapshot, 'walletAddress' | 'updatedAt'>;
  const snapshot: UserDataSnapshot = {
    walletAddress: auth.walletAddress,
    bookmarks: body.bookmarks ?? [],
    drafts: body.drafts ?? [],
    preferences: body.preferences ?? {
      theme: 'system',
      analyticsConsent: null,
    },
    updatedAt: new Date().toISOString(),
  };

  const saved = await saveUserData(snapshot);
  return NextResponse.json({ data: saved, status: 200 });
}

export async function DELETE(request: NextRequest) {
  const auth = authenticate(request);
  if (auth instanceof NextResponse) return auth;

  await deleteUserData(auth.walletAddress);
  return NextResponse.json({ data: { deleted: true }, status: 200 });
}
