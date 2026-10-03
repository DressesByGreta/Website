/**
 * Product photographs in Workers KV (binding PHOTOS). The admin resizes in the browser and uploads
 * every width at once; the Worker only validates, stores and serves. Keys are never reused, so
 * responses are immutable and the ETag can be derived from the key itself.
 */
import type { Context } from 'hono';
import { PHOTO_MAX_BYTES as MAX_BYTES, VIDEO_MAX_BYTES } from '../shared/catalog';
import type { AppEnv } from './types';

// p/ dresses' photographs, v/ the posters of their videos, l/ lookbook photographs
const KEY_RE = /^[pvl]\/[a-z0-9-]{6,40}\/[a-z0-9-]{6,40}\/\d{3,4}\.(webp|jpg)$/;
const CLIP_RE = /^v\/[a-z0-9-]{6,40}\/[a-z0-9-]{6,40}\/clip\.(mp4|webm)$/;

export async function serveImage(c: Context<AppEnv>): Promise<Response> {
  const key = c.req.path.slice('/img/'.length);
  if (!KEY_RE.test(key)) return c.notFound();
  const etag = `"${key.replace(/[^a-z0-9.]/gi, '-')}"`;
  const headers = new Headers({
    etag,
    'cache-control': 'public, max-age=31536000, immutable',
    'x-content-type-options': 'nosniff',
  });
  if (c.req.header('If-None-Match') === etag) return new Response(null, { status: 304, headers });
  const cache = import.meta.env.PROD ? caches.default : null;
  if (cache) {
    const hitRes = await cache.match(c.req.raw);
    if (hitRes) return hitRes;
  }
  const { value, metadata } = await c.env.PHOTOS.getWithMetadata<{ ct?: string }>(key, { type: 'arrayBuffer', cacheTtl: 86400 });
  if (!value) return c.notFound();
  headers.set('content-type', metadata?.ct ?? (key.endsWith('.jpg') ? 'image/jpeg' : 'image/webp'));
  const res = new Response(value, { headers });
  if (cache) c.executionCtx.waitUntil(cache.put(c.req.raw, res.clone()));
  return res;
}

export interface UploadMeta {
  w: number;
  h: number;
  lqip: string;
  ext: 'webp' | 'jpg';
  widths: number[];
}

export function parseUploadMeta(raw: unknown): UploadMeta | null {
  if (!raw || typeof raw !== 'object') return null;
  const m = raw as Record<string, unknown>;
  const ext = m.ext === 'jpg' ? 'jpg' : m.ext === 'webp' ? 'webp' : null;
  const widths = Array.isArray(m.widths) ? m.widths : [];
  const okWidths =
    widths.length >= 1 &&
    widths.length <= 4 &&
    widths.every((w, i) => Number.isInteger(w) && (w as number) >= 200 && (w as number) <= 2400 && (i === 0 || (w as number) > (widths[i - 1] as number)));
  const w = Number(m.w);
  const h = Number(m.h);
  const lqip = typeof m.lqip === 'string' ? m.lqip : '';
  if (!ext || !okWidths || !Number.isInteger(w) || !Number.isInteger(h) || w < 1 || h < 1 || w > 10000 || h > 10000) return null;
  if (lqip && (!/^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(lqip) || lqip.length > 6000)) return null;
  return { w, h, lqip, ext, widths: widths as number[] };
}

/** Magic bytes, so a renamed HTML or SVG file can never be stored as a photograph. */
async function looksLike(file: File, ext: 'webp' | 'jpg'): Promise<boolean> {
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (ext === 'jpg') return head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
  const ascii = (a: number, b: number) => String.fromCharCode(...head.slice(a, b));
  return ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP';
}

export async function storeVariants(env: Env, key: string, meta: UploadMeta, form: FormData): Promise<string | null> {
  const files: [number, File][] = [];
  for (const width of meta.widths) {
    const f = form.get(`w${width}`);
    if (!(f instanceof File)) return `missing width ${width}`;
    if (f.size === 0 || f.size > MAX_BYTES) return `width ${width} has a bad size`;
    if (!(await looksLike(f, meta.ext))) return `width ${width} is not a ${meta.ext}`;
    files.push([width, f]);
  }
  const contentType = meta.ext === 'jpg' ? 'image/jpeg' : 'image/webp';
  await Promise.all(files.map(async ([width, f]) => env.PHOTOS.put(`${key}/${width}.${meta.ext}`, await f.arrayBuffer(), { metadata: { ct: contentType } })));
  return null;
}

export async function deleteVariants(env: Env, key: string, ext: string, widths: number[]): Promise<void> {
  await Promise.all(widths.map((w) => env.PHOTOS.delete(`${key}/${w}.${ext}`)));
}

/* ------------------------------------------------------------------ videos ------------------------------------------------------------------ */

/**
 * A dress's video from KV. Browsers ask for videos in byte ranges (Safari will not play one that
 * cannot), so a Range request gets exactly its slice (206); a whole request is cached at the edge.
 */
export async function serveVideo(c: Context<AppEnv>): Promise<Response> {
  const key = c.req.path.slice('/vid/'.length);
  if (!CLIP_RE.test(key)) return c.notFound();
  const { value, metadata } = await c.env.PHOTOS.getWithMetadata<{ ct?: string }>(key, { type: 'arrayBuffer', cacheTtl: 86400 });
  if (!value) return c.notFound();
  const headers = new Headers({
    'content-type': metadata?.ct ?? (key.endsWith('.webm') ? 'video/webm' : 'video/mp4'),
    'cache-control': 'public, max-age=31536000, immutable',
    'accept-ranges': 'bytes',
    'x-content-type-options': 'nosniff',
  });
  const size = value.byteLength;
  const range = /^bytes=(\d*)-(\d*)$/.exec(c.req.header('Range') ?? '');
  if (range && (range[1] || range[2])) {
    // "bytes=100-" (from 100), "bytes=100-199", "bytes=-500" (the last 500)
    let start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
    let end = range[1] && range[2] ? Number(range[2]) : size - 1;
    end = Math.min(end, size - 1);
    if (start > end || start >= size) {
      headers.set('content-range', `bytes */${size}`);
      return new Response(null, { status: 416, headers });
    }
    start = Math.max(0, start);
    headers.set('content-range', `bytes ${start}-${end}/${size}`);
    headers.set('content-length', String(end - start + 1));
    return new Response(value.slice(start, end + 1), { status: 206, headers });
  }
  headers.set('content-length', String(size));
  return new Response(value, { headers });
}

/** An MP4 (or the iPhone's MOV, the same container) starts with an ftyp box; WebM with EBML. */
async function looksLikeVideo(file: File, ext: 'mp4' | 'webm'): Promise<boolean> {
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (ext === 'webm') return head[0] === 0x1a && head[1] === 0x45 && head[2] === 0xdf && head[3] === 0xa3;
  return String.fromCharCode(...head.slice(4, 8)) === 'ftyp';
}

/** Stores a clip under v/<product>/<video>/clip.<ext>; returns a problem, or null when stored. */
export async function storeClip(env: Env, key: string, ext: 'mp4' | 'webm', file: unknown): Promise<string | null> {
  if (!(file instanceof File)) return 'missing video';
  if (file.size === 0 || file.size > VIDEO_MAX_BYTES) return 'video too large';
  if (!(await looksLikeVideo(file, ext))) return `not an ${ext}`;
  await env.PHOTOS.put(`${key}/clip.${ext}`, await file.arrayBuffer(), { metadata: { ct: ext === 'webm' ? 'video/webm' : 'video/mp4' } });
  return null;
}
