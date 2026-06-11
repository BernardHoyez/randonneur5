const VERSION = 'randonneur5-v1';
const SCOPE   = '/randonneur5/';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method === 'POST' && url.pathname === SCOPE + 'share-target') {
    event.respondWith((async () => {
      const fd = await event.request.formData();
      const file = fd.get('file');
      if (file) {
        const cache = await caches.open(VERSION+'-share');
        await cache.put('/_shared_file_name', new Response(file.name));
        await cache.put('/_shared_file', new Response(file));
      }
      return Response.redirect(SCOPE, 303);
    })());
    return;
  }
  if (event.request.method !== 'GET') return;
  const externe = ['tile.openstreetmap.org','data.geopf.fr','unpkg.com','fonts.googleapis.com','fonts.gstatic.com','cdnjs.cloudflare.com'];
  if (externe.some(h => url.hostname.includes(h))) return;
  if (url.pathname === SCOPE || url.pathname === SCOPE+'index.html' || url.pathname === SCOPE+'manifest.json' || url.pathname === SCOPE+'sw.js') {
    event.respondWith(fetch(event.request,{cache:'no-store'}).catch(()=>caches.match(event.request)));
    return;
  }
  event.respondWith((async()=>{
    try{const res=await fetch(event.request);if(res.ok)(await caches.open(VERSION)).put(event.request,res.clone());return res;}
    catch{return (await caches.match(event.request))||new Response('Hors ligne',{status:503});}
  })());
});
