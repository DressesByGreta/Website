// The admin installed on a phone's home screen (admin.webmanifest). Pages come from the network as
// always and nothing is cached; with no connection, a short page in Albanian says so in place of the
// browser's error, with a link that tries again.
const OFFLINE = `<!doctype html>
<html lang="sq">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#f3f3e7">
<title>Pa lidhje, Admin</title>
<style>
  body { margin: 0; min-height: 100svh; display: grid; place-items: center; background: #eae7d8; color: #1f1b14;
    font: 15px/1.5 'Helvetica Neue', Helvetica, Arial, sans-serif; }
  main { max-width: 340px; padding: 24px; }
  h1 { margin: 0 0 8px; font-size: 12px; font-weight: 400; letter-spacing: 0.08em; text-transform: uppercase; }
  p { margin: 0 0 24px; }
  a { display: inline-flex; align-items: center; height: 44px; padding: 0 18px; background: #857240; color: #fff;
    font-size: 12px; letter-spacing: 0.02em; text-transform: uppercase; text-decoration: none; }
</style>
</head>
<body>
<main>
  <h1>Pa lidhje interneti</h1>
  <p>Admini punon vetëm me internet. Kur telefoni të lidhet përsëri, provo sërish.</p>
  <a href="">Provo përsëri</a>
</main>
</body>
</html>`;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (e) => {
  if (e.request.mode !== 'navigate') return;
  e.respondWith(fetch(e.request).catch(() => new Response(OFFLINE, { headers: { 'content-type': 'text/html; charset=utf-8' } })));
});
