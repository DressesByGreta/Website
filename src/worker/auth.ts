/**
 * Admin authentication. One admin (Greta); the password lives only as a PBKDF2 hash in the
 * ADMIN_PASSWORD_HASH secret. Sessions are HMAC-signed cookies, so there is no session table.
 * Local development can skip the password with DEV_LOGIN=1, which is compiled out of production builds.
 */
import type { Context, MiddlewareHandler } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import type { AppEnv } from './types';

export const SESSION_COOKIE = 'gs_admin';
const SESSION_DAYS = 7;
const enc = new TextEncoder();

const b64url = (bytes: ArrayBuffer | Uint8Array): string => {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = '';
  for (const b of arr) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const fromB64 = (s: string): Uint8Array => {
  const norm = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(norm + '='.repeat((4 - (norm.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function createSession(secret: string): Promise<string> {
  const payload = b64url(enc.encode(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + SESSION_DAYS * 86400 })));
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(payload));
  return `${payload}.${b64url(sig)}`;
}

/** When a valid session ends (seconds), or null for a missing, forged or expired one. */
async function sessionEnd(secret: string, token: string | undefined): Promise<number | null> {
  if (!secret || !token) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  try {
    const ok = await crypto.subtle.verify('HMAC', await hmacKey(secret), fromB64(sig), enc.encode(payload));
    if (!ok) return null;
    const { exp } = JSON.parse(new TextDecoder().decode(fromB64(payload))) as { exp?: number };
    return typeof exp === 'number' && exp > Date.now() / 1000 ? exp : null;
  } catch {
    return null;
  }
}

export async function verifySession(secret: string, token: string | undefined): Promise<boolean> {
  return (await sessionEnd(secret, token)) !== null;
}

/** Format: pbkdf2_sha256$<iterations>$<salt b64>$<hash b64>. Workers cap PBKDF2 at 100 000 iterations. */
export async function verifyPassword(stored: string, password: string): Promise<boolean> {
  const [algo, iterStr, saltB64, hashB64] = stored.split('$');
  const iterations = Number(iterStr);
  if (algo !== 'pbkdf2_sha256' || !saltB64 || !hashB64 || !Number.isInteger(iterations) || iterations < 10000 || iterations > 100000) return false;
  const expected = fromB64(hashB64);
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: fromB64(saltB64), iterations }, key, expected.length * 8));
  return bits.length === expected.length && crypto.subtle.timingSafeEqual(bits, expected);
}

const isLocalHost = (c: Context<AppEnv>): boolean => ['localhost', '127.0.0.1'].includes(new URL(c.req.url).hostname);

/** Dev sign-in is available only in a Vite dev build, from localhost, with DEV_LOGIN=1. */
export const devLoginAllowed = (c: Context<AppEnv>): boolean => import.meta.env.DEV && c.env.DEV_LOGIN === '1' && isLocalHost(c);

export async function startSession(c: Context<AppEnv>): Promise<void> {
  setCookie(c, SESSION_COOKIE, await createSession(c.env.SESSION_SECRET), {
    httpOnly: true,
    secure: new URL(c.req.url).protocol === 'https:',
    sameSite: 'Strict',
    path: '/',
    maxAge: SESSION_DAYS * 86400,
  });
}

export const endSession = (c: Context<AppEnv>): void => {
  deleteCookie(c, SESSION_COOKIE, { path: '/' });
};

export const isAdmin = (c: Context<AppEnv>): Promise<boolean> => verifySession(c.env.SESSION_SECRET, getCookie(c, SESSION_COOKIE));

/**
 * A session in use is renewed once a day, so the admin on Greta's home screen stays signed in while
 * she opens it; after seven days without it, she signs in again.
 */
export async function renewSession(c: Context<AppEnv>): Promise<void> {
  const end = await sessionEnd(c.env.SESSION_SECRET, getCookie(c, SESSION_COOKIE));
  if (end !== null && end - Date.now() / 1000 < (SESSION_DAYS - 1) * 86400) await startSession(c);
}

/**
 * Guards /api/admin/*. State-changing requests must also come from this origin: the cookie is
 * SameSite=Strict already; the Origin check is the second lock.
 */
export const requireAdmin: MiddlewareHandler<AppEnv> = async (c, next) => {
  if (c.req.method !== 'GET' && c.req.method !== 'HEAD') {
    const origin = c.req.header('Origin');
    if (!origin || origin !== new URL(c.req.url).origin) return c.json({ error: 'bad_origin' }, 403);
  }
  if (!(await isAdmin(c))) return c.json({ error: 'unauthorized' }, 401);
  await next();
};

export const clientIp = (c: Context<AppEnv>): string => c.req.header('CF-Connecting-IP') ?? 'local';
