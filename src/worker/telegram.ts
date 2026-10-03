/**
 * Order alerts on Telegram. The bot's token is a Worker secret that Luca sets himself
 * (npx wrangler secret put TELEGRAM_BOT_TOKEN). The phones that receive alerts are linked from the
 * admin with a one-time code only a signed-in admin can see, so a stranger who finds the bot can
 * never subscribe to customers' names and numbers. An alert never holds up or breaks an order: it
 * is sent after the response, and a failure is only logged.
 */
import { formatLek } from '../shared/catalog';
import { copy } from '../shared/copy';
import { getSetting, setSetting } from './db';
import { getOrder } from './orders';
import { getRequest } from './requests';
import type { ExtraEnv } from './types';

type TgEnv = Env & ExtraEnv;

const CHATS = 'telegram_chats';
const PENDING = 'telegram_link';
const LINK_MINUTES = 15;

export interface LinkedChat {
  id: number;
  name: string;
  at: string;
}

interface Update {
  update_id: number;
  message?: { text?: string; chat: { id: number; first_name?: string; last_name?: string; title?: string; username?: string } };
}

export const telegramReady = (env: TgEnv): boolean => Boolean(env.TELEGRAM_BOT_TOKEN);

async function call<T>(env: TgEnv, method: string, body?: object): Promise<T> {
  if (!env.TELEGRAM_BOT_TOKEN) throw new Error('telegram_off');
  const res = await fetch(`${env.TELEGRAM_API || 'https://api.telegram.org'}/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; result?: T; description?: string };
  if (!res.ok || !data.ok) throw new Error(`telegram ${method}: ${data.description ?? res.status}`);
  return data.result as T;
}

const send = (env: TgEnv, chatId: number, text: string) => call(env, 'sendMessage', { chat_id: chatId, text, disable_web_page_preview: true });

export async function linkedChats(db: D1Database): Promise<LinkedChat[]> {
  try {
    const list = JSON.parse((await getSetting(db, CHATS)) ?? '[]') as unknown;
    return Array.isArray(list) ? (list as LinkedChat[]).filter((c) => Number.isInteger(c?.id)) : [];
  } catch {
    return [];
  }
}

const saveChats = (db: D1Database, chats: LinkedChat[]) => setSetting(db, CHATS, JSON.stringify(chats));

export async function removeChat(db: D1Database, id: number): Promise<LinkedChat[]> {
  const chats = (await linkedChats(db)).filter((c) => c.id !== id);
  await saveChats(db, chats);
  return chats;
}

/** The bot's @username, for the t.me link the admin shows; null when Telegram does not answer. */
export async function botName(env: TgEnv): Promise<string | null> {
  try {
    return (await call<{ username?: string }>(env, 'getMe')).username ?? null;
  } catch (e) {
    console.error(e);
    return null;
  }
}

/** A fresh one-time code; the phone sends it to the bot (the t.me link does it with one tap). */
export async function startLink(db: D1Database): Promise<string> {
  const code = String(crypto.getRandomValues(new Uint32Array(1))[0]! % 1_000_000).padStart(6, '0');
  await setSetting(db, PENDING, JSON.stringify({ code, exp: Date.now() + LINK_MINUTES * 60_000 }));
  return code;
}

/** Looks for the pending code among the bot's latest messages and links that chat when it is there. */
export async function checkLink(env: TgEnv): Promise<{ state: 'linked'; chat: LinkedChat } | { state: 'waiting' | 'expired' | 'none' }> {
  const db = env.DB;
  type Pending = { code?: string; exp?: number } | null;
  let pending: Pending = null;
  try {
    pending = JSON.parse((await getSetting(db, PENDING)) ?? 'null') as Pending;
  } catch {
    pending = null;
  }
  if (!pending?.code || !pending.exp) return { state: 'none' };
  if (Date.now() > pending.exp) return { state: 'expired' };
  const code = pending.code;
  const updates = await call<Update[]>(env, 'getUpdates', { timeout: 0, allowed_updates: ['message'] });
  // "/start 123456" from the t.me link (or "/start@bot 123456" in a group), or the code typed by hand
  const hit = [...updates].reverse().find((u) => (u.message?.text ?? '').replace(/^\/start(@\w+)?\s*/, '').trim() === code);
  if (!hit?.message) return { state: 'waiting' };
  const c = hit.message.chat;
  const name = c.title || [c.first_name, c.last_name].filter(Boolean).join(' ') || (c.username ? `@${c.username}` : String(c.id));
  const chat: LinkedChat = { id: c.id, name: name.slice(0, 60), at: new Date().toISOString() };
  await saveChats(db, [...(await linkedChats(db)).filter((x) => x.id !== chat.id), chat]);
  await setSetting(db, PENDING, 'null');
  // mark everything read so far as handled, so no old code lingers in the bot's queue
  const last = updates[updates.length - 1]?.update_id;
  if (last !== undefined) await call(env, 'getUpdates', { offset: last + 1, timeout: 0 }).catch((e) => console.error(e));
  await send(env, chat.id, 'Ky telefon do të marrë njoftimet e porosive nga Dresses by Greta.').catch((e) => console.error(e));
  return { state: 'linked', chat };
}

/** Sends the text to every linked phone; returns how many received it. */
async function broadcast(env: TgEnv, text: string): Promise<number> {
  if (!telegramReady(env)) return 0;
  const results = await Promise.allSettled((await linkedChats(env.DB)).map((c) => send(env, c.id, text)));
  results.forEach((r) => r.status === 'rejected' && console.error(r.reason));
  return results.filter((r) => r.status === 'fulfilled').length;
}

export const sendTest = (env: TgEnv): Promise<number> => broadcast(env, 'Provë: njoftimet e porosive punojnë.');

/**
 * The alert for a new order: cash orders as they are placed, card orders once the bank has said
 * paid. It names what to call about (who, which dress, which size, how much) and links to the
 * order in the admin; the full address stays in the admin.
 */
export async function orderAlert(env: TgEnv, origin: string, orderId: string): Promise<void> {
  try {
    if (!telegramReady(env)) return;
    const found = await getOrder(env.DB, orderId);
    if (!found) return;
    const { order: o, items } = found;
    const t = copy.sq.checkout;
    const fee = o.delivery_fee === null ? t.shippingTbc.toLowerCase() : o.delivery_fee === 0 ? t.shippingFree.toLowerCase() : formatLek(o.delivery_fee, 'sq');
    const lines = [
      `Porosi e re nr. ${o.number}`,
      '',
      ...items.map((it) => `${it.name} · masa ${it.size} · ${it.qty} copë · ${formatLek(it.price * it.qty, 'sq')}`),
      `${t.shipping}: ${fee}`,
      `${t.total}: ${formatLek(o.total, 'sq')}`,
      o.payment_method === 'card' ? copy.sq.confirmation.paid : t.cod,
      '',
      o.customer_name,
      o.phone,
      o.zone === 'kosovo' ? `${o.city}, ${t.zones.kosovo}` : o.city,
      ...(o.notes ? [`Shënim: ${o.notes}`] : []),
      '',
      `Hap porosinë: ${origin}/admin/porosi/${o.id}`,
    ];
    await broadcast(env, lines.join('\n'));
  } catch (e) {
    console.error('order alert', e);
  }
}

const day = (iso: string): string => {
  const MONTHS = ['janar', 'shkurt', 'mars', 'prill', 'maj', 'qershor', 'korrik', 'gusht', 'shtator', 'tetor', 'nëntor', 'dhjetor'];
  return `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
};

/** A visitor asked to rent a dress, or to hear when a size is back. */
export async function requestAlert(env: TgEnv, origin: string, id: string): Promise<void> {
  try {
    if (!telegramReady(env)) return;
    const r = await getRequest(env.DB, id);
    if (!r) return;
    const lines =
      r.kind === 'rental'
        ? [`Kërkesë për qira`, '', `${r.product_name} · masa ${r.size}`, `Data: ${day(r.event_date ?? '')}`, '', r.name, r.phone, ...(r.note ? [`Shënim: ${r.note}`] : [])]
        : [`Dikush pret masën ${r.size}`, '', `${r.product_name}`, r.phone, ...(r.name ? [r.name] : [])];
    await broadcast(env, [...lines, '', `Hap kërkesat: ${origin}/admin/kerkesat${r.kind === 'restock' ? '?lloji=kthim' : ''}`].join('\n'));
  } catch (e) {
    console.error('request alert', e);
  }
}

/** A size people were waiting for is back in stock: time to message them. */
export async function restockAlert(env: TgEnv, origin: string, dress: string, waiting: Record<string, number>): Promise<void> {
  try {
    if (!telegramReady(env)) return;
    const sizes = Object.entries(waiting).map(([s, n]) => `masa ${s}: ${n === 1 ? '1 person' : `${n} persona`}`);
    await broadcast(env, [`Masa u kthye në gjendje: ${dress}`, ...sizes, '', `Njoftoji: ${origin}/admin/kerkesat?lloji=kthim`].join('\n'));
  } catch (e) {
    console.error('restock alert', e);
  }
}
