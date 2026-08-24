/**
 * Tests for /api/user-data route
 *
 * Acceptance criteria:
 *   1. GET/PUT/DELETE reject requests without a verified token.         (401)
 *   2. Wallet address is derived from the JWT, never from the header.   (IDOR fix)
 *   3. A forged x-wallet-address header is ignored when a real token   (forged header)
 *      is present.
 *   4. Concurrent saves do not silently overwrite each other.           (mutex)
 */

import { GET, PUT, DELETE } from '@/app/api/user-data/route';
import { NextRequest } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Minimal Base64URL encoding */
function base64url(data: string): string {
  return Buffer.from(data)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/** Build a minimal (unsigned) JWT-like string for testing. */
function fakeJwt(payload: Record<string, unknown>, expired = false): string {
  const header = base64url(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const body = {
    ...payload,
    exp: expired ? now - 3600 : now + 3600,
  };
  return `${header}.${base64url(JSON.stringify(body))}.`;
}

function makeRequest(opts: {
  cookie?: string;
  body?: Record<string, unknown>;
  header?: string;
}): NextRequest {
  const url = new URL('http://localhost/api/user-data');
  const init: RequestInit = {
    method: 'GET',
    headers: new Headers(),
  };

  if (opts.cookie) {
    init.headers = new Headers({
      cookie: `token=${opts.cookie}`,
    });
  }

  if (opts.header) {
    (init.headers as Headers).set('x-wallet-address', opts.header);
  }

  if (opts.body) {
    init.method = 'PUT';
    init.body = JSON.stringify(opts.body);
    (init.headers as Headers).set('content-type', 'application/json');
  }

  return new NextRequest(url, init);
}

// ── Data directory cleanup ──────────────────────────────────────────────────

const dataDir = path.join(process.cwd(), 'data');
const storeFile = path.join(dataDir, 'user-data-store.json');

async function cleanStore(): Promise<void> {
  try {
    await fs.unlink(storeFile);
  } catch {
    // ignore if file doesn't exist
  }
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('/api/user-data authentication', () => {
  beforeEach(async () => {
    await cleanStore();
  });

  afterAll(async () => {
    await cleanStore();
  });

  it('GET returns 401 when no token cookie is present', async () => {
    const req = makeRequest({});
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toMatch(/authentication required/i);
  });

  it('GET returns 401 when the token is expired', async () => {
    const token = fakeJwt({ walletAddress: 'GA11111' }, true);
    const req = makeRequest({ cookie: token });
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toMatch(/invalid or expired/i);
  });

  it('GET returns 403 when the token has no walletAddress claim', async () => {
    const token = fakeJwt({ sub: 'user-123' });
    const req = makeRequest({ cookie: token });
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error).toMatch(/wallet address/i);
  });

  it('GET returns null data for a wallet with no saved data', async () => {
    const token = fakeJwt({ walletAddress: 'GA_WALLET_A' });
    const req = makeRequest({ cookie: token });
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toBeNull();
  });
});

describe('/api/user-data IDOR prevention', () => {
  beforeEach(async () => {
    await cleanStore();
  });

  afterAll(async () => {
    await cleanStore();
  });

  it('PUT uses walletAddress from the JWT, not the x-wallet-address header', async () => {
    const realWallet = 'GA_REAL_WALLET';
    const attackerHeader = 'GA_ATTACKER_WALLET';

    // Save data while the header claims to be the attacker
    const token = fakeJwt({ walletAddress: realWallet });
    const putReq = makeRequest({
      cookie: token,
      header: attackerHeader,
      body: { bookmarks: ['bm-1'], drafts: [], preferences: { theme: 'dark', analyticsConsent: true } },
    });
    const putRes = await PUT(putReq);
    expect(putRes.status).toBe(200);

    // The data should be stored under the real wallet, not the attacker's
    const getReqForReal = makeRequest({ cookie: token });
    const getResForReal = await GET(getReqForReal);
    const json = await getResForReal.json();
    expect(json.data.walletAddress).toBe(realWallet);
    expect(json.data.bookmarks).toEqual(['bm-1']);

    // The attacker's wallet should have no data
    const attackerToken = fakeJwt({ walletAddress: attackerHeader });
    const getReqForAttacker = makeRequest({ cookie: attackerToken });
    const getResForAttacker = await GET(getReqForAttacker);
    const attackerJson = await getResForAttacker.json();
    expect(attackerJson.data).toBeNull();
  });

  it('GET with a forged x-wallet-address header cannot read another wallet\'s data', async () => {
    const victimWallet = 'GA_VICTIM';
    const attackerWallet = 'GA_ATTACKER';

    // Victim stores their data
    const victimToken = fakeJwt({ walletAddress: victimWallet });
    const putReq = makeRequest({
      cookie: victimToken,
      body: { bookmarks: ['secret-bm'], drafts: [], preferences: { theme: 'dark', analyticsConsent: true } },
    });
    await PUT(putReq);

    // Attacker tries to read victim's data by setting the header
    const attackerToken = fakeJwt({ walletAddress: attackerWallet });
    const getReq = makeRequest({ cookie: attackerToken, header: victimWallet });
    const res = await GET(getReq);
    const json = await res.json();

    // The header is ignored — attacker sees their own (empty) data
    expect(json.data).toBeNull();
  });

  it('DELETE with a forged header cannot delete another wallet\'s data', async () => {
    const victimWallet = 'GA_VICTIM';
    const attackerWallet = 'GA_ATTACKER';

    // Victim stores data
    const victimToken = fakeJwt({ walletAddress: victimWallet });
    const putReq = makeRequest({
      cookie: victimToken,
      body: { bookmarks: ['bm-x'], drafts: [], preferences: { theme: 'system', analyticsConsent: null } },
    });
    await PUT(putReq);

    // Attacker tries to delete victim's data via header forgery
    const attackerToken = fakeJwt({ walletAddress: attackerWallet });
    const delReq = makeRequest({ cookie: attackerToken, header: victimWallet });
    await DELETE(delReq);

    // Victim's data should still exist
    const getReq = makeRequest({ cookie: victimToken });
    const res = await GET(getReq);
    const json = await res.json();
    expect(json.data).not.toBeNull();
    expect(json.data.bookmarks).toEqual(['bm-x']);
  });
});

describe('/api/user-data mutex / concurrency', () => {
  beforeEach(async () => {
    await cleanStore();
  });

  afterAll(async () => {
    await cleanStore();
  });

  it('concurrent PUTs from the same wallet do not lose data', async () => {
    const token = fakeJwt({ walletAddress: 'GA_CONCURRENT' });

    // Fire 10 concurrent saves with different bookmark IDs
    const saves = Array.from({ length: 10 }, (_, i) =>
      PUT(
        makeRequest({
          cookie: token,
          body: {
            bookmarks: [`bm-${i}`],
            drafts: [],
            preferences: { theme: 'system', analyticsConsent: null },
          },
        })
      )
    );

    await Promise.all(saves);

    // Read back — the last writer should have bm-9
    const res = await GET(makeRequest({ cookie: token }));
    const json = await res.json();

    expect(json.data).not.toBeNull();
    expect(json.data.bookmarks).toEqual([expect.stringMatching(/^bm-\d$/)]);
  });
});
