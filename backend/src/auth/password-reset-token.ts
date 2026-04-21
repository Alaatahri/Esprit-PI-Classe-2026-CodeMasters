import { createHmac, timingSafeEqual } from 'crypto';

type Payload = {
  email: string;
  exp: number; // epoch ms
};

function base64UrlEncode(input: Buffer | string): string {
  const b = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return b
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecodeToBuffer(input: string): Buffer {
  const pad = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4));
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/') + pad;
  return Buffer.from(b64, 'base64');
}

function getSecret(): string {
  return (
    process.env.PASSWORD_RESET_SECRET?.trim() ||
    process.env.JWT_SECRET?.trim() ||
    'dev-password-reset-secret'
  );
}

function sign(data: string): string {
  return base64UrlEncode(createHmac('sha256', getSecret()).update(data).digest());
}

export function createPasswordResetToken(email: string, ttlMs = 60 * 60 * 1000): string {
  const payload: Payload = {
    email: String(email || '').trim().toLowerCase(),
    exp: Date.now() + ttlMs,
  };
  const body = base64UrlEncode(JSON.stringify(payload));
  const sig = sign(body);
  return `${body}.${sig}`;
}

export function verifyPasswordResetToken(token: string): { email: string } | null {
  const t = typeof token === 'string' ? token.trim() : '';
  const parts = t.split('.');
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  if (!body || !sig) return null;

  const expected = sign(body);
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  if (a.length !== b.length) return null;
  if (!timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(base64UrlDecodeToBuffer(body).toString('utf8')) as Partial<Payload>;
    const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
    const exp = typeof payload.exp === 'number' ? payload.exp : 0;
    if (!email || !exp) return null;
    if (Date.now() > exp) return null;
    return { email };
  } catch {
    return null;
  }
}

