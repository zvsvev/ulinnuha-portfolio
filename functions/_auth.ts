// Shared auth helpers for Pages Functions (admin session via HMAC-signed cookie).
import type { PagesFunction } from '@cloudflare/workers-types';

export interface Env {
  ADMIN_USER?: string;
  ADMIN_PASS?: string;
  SESSION_SECRET?: string;
  TURNSTILE_SITE_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
  MEDIA_KV: KVNamespace;
  MEDIA_BUCKET: R2Bucket;
}

const COOKIE = 'admin_session';

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

async function sign(data: string, secret: string): Promise<string> {
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function createSession(env: Env): Promise<string> {
  const secret = env.SESSION_SECRET || env.ADMIN_PASS || 'dev-secret';
  const token = crypto.randomUUID();
  const payload = `${token}.${Date.now()}`;
  const sig = await sign(payload, secret);
  return `${payload}.${sig}`;
}

export async function verifySession(token: string | null, env: Env): Promise<boolean> {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [id, ts, sig] = parts;
  const secret = env.SESSION_SECRET || env.ADMIN_PASS || 'dev-secret';
  const expected = await sign(`${id}.${ts}`, secret);
  if (sig !== expected) return false;
  const age = Date.now() - Number(ts);
  return Number.isFinite(age) && age > 0 && age < 1000 * 60 * 60 * 24 * 7; // 7 days
}

export function getCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return null;
}

export function isAuthed(req: Request, env: Env): Promise<boolean> {
  return verifySession(getCookie(req.headers.get('Cookie'), COOKIE), env);
}

export async function verifyTurnstile(token: string | undefined, env: Env): Promise<boolean> {
  if (!env.TURNSTILE_SECRET_KEY) return true; // Turnstile optional
  if (!token) return false;
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: env.TURNSTILE_SECRET_KEY, response: token }),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

export function setSessionCookie(value: string): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${60 * 60 * 24 * 7}${secure}`;
}

export function clearSessionCookie(): string {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;
}

export type { PagesFunction };
