/**
 * Dresses by Greta: one Worker for the shop, the admin API and the photographs. Static files
 * (the built client, public/) are served by Workers Static Assets before this code runs.
 */
import { Hono } from 'hono';
import { purgeHits } from './db';
import { serveImage, serveVideo } from './images';
import { syncInstagram } from './instagram';
import { releaseExpiredCardOrders } from './orders';
import { purgeRequests } from './requests';
import { adminApi } from './routes/admin-api';
import { notFound, pages } from './routes/pages';
import { publicApi } from './routes/public-api';
import { seo } from './routes/seo';
import type { AppEnv } from './types';

const app = new Hono<AppEnv>();

// Production only: Vite's dev server needs inline scripts and a websocket.
const csp = (scripts: string) =>
  [
    "default-src 'self'",
    "img-src 'self' data: blob:",
    `script-src ${scripts}`,
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self'",
    "connect-src 'self'",
    "form-action 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
const CSP = csp("'self'");
// The admin may compile WebAssembly (only that: JavaScript eval stays blocked): an iPhone, whose
// canvas cannot write WebP, encodes the photographs with libwebp in WebAssembly (src/admin/images.ts).
const ADMIN_CSP = csp("'self' 'wasm-unsafe-eval'");

app.use('*', async (c, next) => {
  await next();
  c.header('x-content-type-options', 'nosniff');
  c.header('referrer-policy', 'strict-origin-when-cross-origin');
  c.header('permissions-policy', 'camera=(), microphone=(), geolocation=()');
  if (import.meta.env.PROD && (c.res.headers.get('content-type') ?? '').includes('text/html')) {
    c.header('content-security-policy', c.req.path === '/admin' || c.req.path.startsWith('/admin/') ? ADMIN_CSP : CSP);
    c.header('x-frame-options', 'DENY');
  }
});

app.get('/img/*', serveImage);
app.get('/vid/*', serveVideo);
app.route('/api/admin', adminApi);
app.route('/api', publicApi);
app.route('/', seo);
app.route('/', pages);
app.notFound((c) => (c.req.path.startsWith('/api/') ? c.json({ error: 'not_found' }, 404) : notFound(c)));
app.onError((err, c) => {
  console.error(err);
  return c.req.path.startsWith('/api/') ? c.json({ error: 'server_error' }, 500) : c.text('Server error', 500);
});

export default {
  fetch: app.fetch,
  // every 15 minutes: release unpaid card orders; the Instagram count is read every six hours
  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(releaseExpiredCardOrders(env));
    // requests delete themselves on the schedule the privacy page states
    ctx.waitUntil(purgeRequests(env.DB).catch((e) => console.error('purge requests', e)));
    ctx.waitUntil(purgeHits(env.DB).catch((e) => console.error('purge hits', e)));
    ctx.waitUntil(syncInstagram(env));
  },
} satisfies ExportedHandler<Env>;
