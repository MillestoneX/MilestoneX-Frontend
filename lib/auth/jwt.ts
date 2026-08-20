// lib/auth/jwt.ts
// Server-only JWT verification using Web Crypto API (HS256).
// Designed to work in Next.js edge runtime (middleware) and Node runtimes.
// This file must never be imported from client components.

if (typeof window !== 'undefined') {
  throw new Error('lib/auth/jwt.ts is server-only and cannot be imported from client components');
}

export interface JwtPayload {
  sub?: string;
  userId?: string;
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

function base64UrlDecode(input: string): string {
  let base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  if (pad === 2) {
    base64 += '==';
  } else if (pad === 3) {
    base64 += '=';
  } else if (pad === 1) {
    throw new Error('Invalid base64url string');
  }
  try {
    return atob(base64);
  } catch {
    throw new Error('Invalid base64url encoding');
  }
}

function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i] as number);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function hmacSha256(secret: string, message: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return crypto.subtle.sign('HMAC', key, encoder.encode(message));
}

async function constantTimeCompare(a: string, b: string): Promise<boolean> {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export async function verifyJwt(token: string, secret?: string): Promise<JwtPayload | null> {
  const jwtSecret = secret || process.env.AUTH_SECRET;

  if (!token || typeof token !== 'string') {
    return null;
  }

  const segments = token.split('.');
  if (segments.length !== 3) {
    return null;
  }

  const [headerSegment, payloadSegment, signatureSegment] = segments;

  if (!headerSegment || !payloadSegment || !signatureSegment) {
    return null;
  }

  let header: { alg?: string };
  try {
    header = JSON.parse(base64UrlDecode(headerSegment));
  } catch {
    return null;
  }

  if (header.alg !== 'HS256') {
    return null;
  }

  let payload: JwtPayload;
  try {
    payload = JSON.parse(base64UrlDecode(payloadSegment));
  } catch {
    return null;
  }

  if (typeof payload.exp !== 'number') {
    return null;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  if (payload.exp <= currentTime) {
    return null;
  }

  if (!jwtSecret) {
    return null;
  }

  try {
    const message = `${headerSegment}.${payloadSegment}`;
    const expectedSignature = bufferToBase64Url(await hmacSha256(jwtSecret, message));

    if (!await constantTimeCompare(signatureSegment, expectedSignature)) {
      return null;
    }
  } catch {
    return null;
  }

  return payload;
}
