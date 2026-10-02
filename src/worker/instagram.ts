/**
 * The follower count in the footer, read from Instagram's official API (the Instagram API with
 * Instagram login, which business and creator accounts can use). Greta's account authorises a Meta
 * app once; the long-lived token it gives (valid 60 days) is pasted into the admin, kept in D1 and
 * refreshed here every week, so it never lapses. The cron asks for the count every six hours.
 * Without a token the footer keeps the last number it had: a number typed in the admin, or the
 * one read by hand on 2026-09-16.
 */
import { getSetting, setSetting } from './db';
import { SITE } from './site';
import type { ExtraEnv } from './types';

type IgEnv = Env & ExtraEnv;

const K = {
  token: 'instagram_token',
  refreshed: 'instagram_token_refreshed',
  followers: 'instagram_followers',
  checked: 'instagram_checked',
  username: 'instagram_username',
  source: 'instagram_source',
  error: 'instagram_error',
} as const;

const EVERY = 6 * 3600_000;
const REFRESH_AFTER = 7 * 86_400_000;

export interface InstagramState {
  linked: boolean;
  username: string;
  followers: number;
  /** where the number came from */
  source: 'instagram' | 'manual' | 'seed';
  checkedAt: string;
  /** the last failure, empty once a read succeeds */
  error: string;
}

async function read(db: D1Database): Promise<Record<string, string>> {
  const rows = await db.prepare(`SELECT key, value FROM settings WHERE key LIKE 'instagram_%'`).all<{ key: string; value: string }>();
  return Object.fromEntries((rows.results ?? []).map((r) => [r.key, r.value]));
}

const toCount = (v: string | undefined): number | null => {
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 ? n : null;
};

export async function instagramState(db: D1Database): Promise<InstagramState> {
  const s = await read(db);
  const followers = toCount(s[K.followers]);
  return {
    linked: Boolean(s[K.token]),
    username: s[K.username] ?? '',
    followers: followers ?? SITE.followersSeed,
    source: followers === null ? 'seed' : s[K.source] === 'instagram' ? 'instagram' : 'manual',
    checkedAt: s[K.checked] ?? '',
    error: s[K.error] ?? '',
  };
}

/** The number the footer shows. */
export async function followerCount(db: D1Database): Promise<number> {
  return toCount((await getSetting(db, K.followers)) ?? undefined) ?? SITE.followersSeed;
}

async function ig<T>(env: IgEnv, path: string, token: string): Promise<T> {
  const url = `${env.INSTAGRAM_API || 'https://graph.instagram.com'}/${path}${path.includes('?') ? '&' : '?'}access_token=${encodeURIComponent(token)}`;
  const res = await fetch(url);
  const data = (await res.json().catch(() => ({}))) as T & { error?: { message?: string } };
  if (!res.ok || data.error) throw new Error(data.error?.message ?? `HTTP ${res.status}`);
  return data;
}

const profile = (env: IgEnv, token: string) => ig<{ username?: string; followers_count?: number }>(env, 'me?fields=username,followers_count', token);

async function store(db: D1Database, me: { username?: string; followers_count?: number }): Promise<void> {
  if (typeof me.followers_count !== 'number') throw new Error('Instagram sent no follower count');
  const now = new Date().toISOString();
  await db.batch(
    [
      [K.followers, String(me.followers_count)],
      [K.username, me.username ?? ''],
      [K.source, 'instagram'],
      [K.checked, now],
      [K.error, ''],
    ].map(([k, v]) => db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value').bind(k, v)),
  );
}

/** Pasted in the admin: checked against Instagram before it is kept. Throws when Instagram refuses it. */
export async function linkInstagram(env: IgEnv, token: string): Promise<InstagramState> {
  const me = await profile(env, token);
  await store(env.DB, me);
  await setSetting(env.DB, K.token, token);
  await setSetting(env.DB, K.refreshed, new Date().toISOString());
  return instagramState(env.DB);
}

export async function unlinkInstagram(db: D1Database): Promise<InstagramState> {
  await setSetting(db, K.token, '');
  return instagramState(db);
}

/** Typed by hand in the admin while Instagram is not linked. */
export async function setFollowersByHand(db: D1Database, n: number): Promise<InstagramState> {
  await setSetting(db, K.followers, String(n));
  await setSetting(db, K.source, 'manual');
  await setSetting(db, K.checked, new Date().toISOString());
  return instagramState(db);
}

/**
 * The cron's job (and the admin's "update now", with force): refresh the token once it is a week
 * old, then read the count. A failure is stored for the admin to show, never thrown.
 */
export async function syncInstagram(env: IgEnv, force = false): Promise<InstagramState> {
  const db = env.DB;
  const s = await read(db);
  let token = s[K.token];
  if (!token) return instagramState(db);
  if (!force && Date.now() - (Date.parse(s[K.checked] ?? '') || 0) < EVERY) return instagramState(db);
  try {
    if (Date.now() - (Date.parse(s[K.refreshed] ?? '') || 0) > REFRESH_AFTER) {
      try {
        const r = await ig<{ access_token?: string }>(env, 'refresh_access_token?grant_type=ig_refresh_token', token);
        if (r.access_token) {
          token = r.access_token;
          await setSetting(db, K.token, token);
        }
        await setSetting(db, K.refreshed, new Date().toISOString());
      } catch (e) {
        console.error('instagram refresh', e);
      }
    }
    await store(db, await profile(env, token));
  } catch (e) {
    const now = new Date().toISOString();
    await setSetting(db, K.error, String((e as Error)?.message ?? e).slice(0, 200));
    // try again at the next window rather than every quarter of an hour
    await setSetting(db, K.checked, now);
  }
  return instagramState(db);
}
