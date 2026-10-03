/**
 * The shop's own visit counts (src/worker/stats.ts): one beacon per page view, without a cookie or
 * any identifier. The first page of a visit (one browser tab, sessionStorage) also says where the
 * visitor came from: a utm_source with its campaign, else Instagram's or Facebook's in-app browser,
 * else the referring site. The checkout sends that source with the order.
 */
const VISIT = 'greta-visit';
const SOURCE = 'greta-source';

const tag = (v: string | null, max: number): string => (v ?? '').toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, max);

function origin(): { src: string; c?: string } {
  const q = new URL(location.href).searchParams;
  const utm = tag(q.get('utm_source'), 40);
  if (utm) return { src: utm, c: tag(q.get('utm_campaign'), 60) || undefined };
  const ua = navigator.userAgent;
  if (/Instagram/i.test(ua)) return { src: 'instagram' };
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) return { src: 'facebook' };
  if (/musical_ly|TikTok|Bytedance/i.test(ua)) return { src: 'tiktok' };
  let host = '';
  try {
    host = new URL(document.referrer).hostname.replace(/^www\./, '');
  } catch {
    /* no referrer */
  }
  if (!host || host === location.hostname.replace(/^www\./, '')) return { src: 'direct' };
  if (/(^|\.)instagram\.com$/.test(host)) return { src: 'instagram' };
  if (/(^|\.)(facebook\.com|fb\.com|fb\.me)$/.test(host)) return { src: 'facebook' };
  if (/(^|\.)google\./.test(host)) return { src: 'google' };
  if (/(^|\.)tiktok\.com$/.test(host)) return { src: 'tiktok' };
  if (/(^|\.)(whatsapp\.com|wa\.me)$/.test(host)) return { src: 'whatsapp' };
  return { src: 'other' };
}

function send(body: object): void {
  // automated browsers say so; their visits are not Greta's customers
  if (navigator.webdriver) return;
  const data = JSON.stringify(body);
  try {
    if (!navigator.sendBeacon?.('/api/hit', new Blob([data], { type: 'text/plain' }))) void fetch('/api/hit', { method: 'POST', body: data, keepalive: true }).catch(() => undefined);
  } catch {
    /* counting is never in the way */
  }
}

/** One page view; the visit's first one carries where it came from. */
export function trackView(kind: string): void {
  let first: { src: string; c?: string } | null = null;
  try {
    if (!sessionStorage.getItem(VISIT)) {
      first = origin();
      sessionStorage.setItem(VISIT, '1');
      sessionStorage.setItem(SOURCE, first.c ? `${first.src}/${first.c}` : first.src);
    }
  } catch {
    /* storage blocked: the view still counts */
  }
  const slug = kind === 'product' ? decodeURIComponent(location.pathname.split('/')[2] ?? '') : undefined;
  send({ t: 'view', k: kind, s: slug, e: first ? true : undefined, src: first?.src, c: first?.c });
}

/** One use of a shop tool (worker/stats.ts USES): nothing about what she chose, only that she did. */
export function trackUse(key: 'size' | 'date' | 'save' | 'share' | 'mark' | 'video' | 'whatsapp'): void {
  send({ t: 'use', k: key });
}

/** The order form: a press of the send button, and the fields that stopped it. */
export function trackForm(t: 'submit' | 'invalid', fields?: string[]): void {
  send({ t, k: 'checkout', f: fields });
}

/** Where this visit came from, for the order. */
export function visitSource(): string {
  try {
    return sessionStorage.getItem(SOURCE) ?? '';
  } catch {
    return '';
  }
}
