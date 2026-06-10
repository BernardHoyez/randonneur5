const VERSION = 'randonneur5-v1';
const SCOPE   = '/randonneur5/';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Share Target POST
  if (event.request.method === 'POST' && url.pathname === SCOPE + 'share-target') {
    event.respondWith((async () => {
      const formData = await event.request.formData();
      const file = formData.get('file');
      if (file) {
        const cache = await caches.open(VERSION + '-share');
        await cache.put('/_shared_file_name', new Response(file.name));
        await cache.put('/_shared_file', new Response(file));
      }
      return Response.redirect(SCOPE, 303);
    })());
    return;
  }

  if (event.request.method !== 'GET') return;

  const externe = ['tile.openstreetmap.org','data.geopf.fr','unpkg.com',
                   'fonts.googleapis.com','fonts.gstatic.com','cdnjs.cloudflare.com'];
  if (externe.some(h => url.hostname.includes(h))) return;
  event.respondWith(networkFirst(event.request));
});

async function networkFirst(req) {
  try {
    const res = await fetch(req);
    if (res.ok) (await caches.open(VERSION)).put(req, res.clone());
    return res;
  } catch {
    const cached = await caches.match(req);
    if (cached) return cached;
    return new Response(
      '<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Randonneur5 — Hors ligne</title>'
      +'<style>body{font-family:system-ui;background:#0d1a09;color:#b8d4a0;display:flex;'
      +'align-items:center;justify-content:center;height:100vh;margin:0;text-align:center}'
      +'h1{color:#7aad5a}</style></head><body><div><h1>🏔 Randonneur5</h1>'
      +'<p>Vous êtes hors ligne.<br>Reconnectez-vous pour accéder à l\'application.</p>'
      +'</div></body></html>',
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}
