import { describe, it, expect } from 'vitest';
import { verifyJwt, JwtPayload } from './jwt';

function base64UrlEncode(input: string): string {
  return btoa(input)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function createJwt(
  payload: JwtPayload,
  secret: string
): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerSegment = base64UrlEncode(JSON.stringify(header));
  const payloadSegment = base64UrlEncode(JSON.stringify(payload));

  const message = `${headerSegment}.${payloadSegment}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  const signatureArray = new Uint8Array(signature);
  let binary = '';
  for (let i = 0; i < signatureArray.length; i++) {
    binary += String.fromCharCode(signatureArray[i] as number);
  }
  const signatureSegment = btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `${headerSegment}.${payloadSegment}.${signatureSegment}`;
}

const SECRET = 'test-secret-key-that-is-at-least-32-chars-long';
const NOW = Math.floor(Date.now() / 1000);

describe('verifyJwt', () => {
  it('returns payload for a correctly signed, non-expired token', async () => {
    const token = await createJwt(
      { sub: 'user-123', exp: NOW + 3600 },
      SECRET
    );
    const payload = await verifyJwt(token, SECRET);
    expect(payload).not.toBeNull();
    expect(payload?.sub).toBe('user-123');
  });

  it('rejects a token with a tampered signature', async () => {
    const token = await createJwt(
      { sub: 'user-123', exp: NOW + 3600 },
      SECRET
    );
    const tampered = token.slice(0, -10) + 'aaaaaaaaaa';
    const payload = await verifyJwt(tampered, SECRET);
    expect(payload).toBeNull();
  });

  it('rejects a token signed with the wrong secret', async () => {
    const token = await createJwt(
      { sub: 'user-123', exp: NOW + 3600 },
      SECRET
    );
    const payload = await verifyJwt(token, 'wrong-secret-key-that-is-also-32-chars!!');
    expect(payload).toBeNull();
  });

  it('rejects an expired token even with a valid signature', async () => {
    const token = await createJwt(
      { sub: 'user-123', exp: NOW - 10 },
      SECRET
    );
    const payload = await verifyJwt(token, SECRET);
    expect(payload).toBeNull();
  });

  it('rejects a token with a missing signature', async () => {
    const payload = base64UrlEncode(JSON.stringify({ sub: 'user-123', exp: NOW + 3600 }));
    const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const token = `${header}.${payload}.`;
    const result = await verifyJwt(token, SECRET);
    expect(result).toBeNull();
  });

  it('rejects a token with a non-HS256 algorithm', async () => {
    const payload = base64UrlEncode(JSON.stringify({ sub: 'user-123', exp: NOW + 3600 }));
    const header = base64UrlEncode(JSON.stringify({ alg: 'none', typ: 'JWT' }));
    const token = `${header}.${payload}.`;
    const result = await verifyJwt(token, SECRET);
    expect(result).toBeNull();
  });

  it('rejects a malformed token', async () => {
    expect(await verifyJwt('not-a-token', SECRET)).toBeNull();
    expect(await verifyJwt('', SECRET)).toBeNull();
    expect(await verifyJwt('a.b', SECRET)).toBeNull();
  });
});
