/* Service Worker: App-Dateien offline verfügbar machen. Spielen mit anderen braucht weiterhin Internet (WebRTC).
   WICHTIG: Bei jeder Änderung an den Dateien VERSION erhöhen, sonst sehen Geräte mit altem Cache die Änderung nicht
   (bzw. erst nach dem Neuladen im Hintergrund). Neue Dateien auch in APP_FILES eintragen. */
const VERSION = 10;
const APP_CACHE = 'vibing-app-v' + VERSION;      // App-Dateien, wird bei jeder neuen Version ersetzt
const BIG_CACHE = 'vibing-big-v1';               // große Bibliotheken (ogv, transformers, rnnoise.wasm): erst beim ersten Benutzen

const APP_FILES = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
  'fonts/fredoka-latin-wght-normal.woff2', 'fonts/fredoka-latin-ext-wght-normal.woff2',
  'fonts/nunito-latin-wght-normal.woff2', 'fonts/nunito-latin-ext-wght-normal.woff2', 'fonts/nunito-cyrillic-wght-normal.woff2',
  'vendor/peerjs.min.js', 'vendor/jszip.min.js', 'vendor/qrcode.js', 'vendor/mp4-muxer.js', 'vendor/rnnoise/denoise-worklet.js',
  'js/config.js', 'js/util.js', 'js/i18n.js', 'js/analysis.js', 'js/audio.js', 'js/music.js', 'js/vcache.js',
  'js/takestore.js', 'js/net.js', 'js/packs.js',
  'js/ui.js', 'js/denoise.js', 'js/translate.js', 'js/video.js', 'js/export.js', 'js/scene.js', 'js/fx.js', 'js/player.js', 'js/host.js',
  'js/preview.js', 'js/pvclient.js', 'js/hostviews.js', 'js/maker.js', 'js/subtitles.js', 'js/main.js', 'js/whisper-worker.js',
  'js/lang/de.js', 'js/lang/en.js', 'js/lang/es.js', 'js/lang/fr.js', 'js/lang/pt.js', 'js/lang/ru.js', 'js/lang/hi.js'
];
const BIG_RE = /\/(vendor\/(ogv|transformers)\/|vendor\/rnnoise\/rnnoise\.wasm|audio\/music\/)/;

const url = (p) => new URL(p, self.registration.scope).href;

self.addEventListener('install', (e) => {
  // Kein skipWaiting: Eine neue Version wartet, bis der Spieler "Neu laden" wählt (nie mitten in einer Runde)
  e.waitUntil(caches.open(APP_CACHE).then((c) => c.addAll(APP_FILES.map((p) => new Request(url(p), { cache: 'reload' })))));
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('vibing-') && k !== APP_CACHE && k !== BIG_CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('message', (e) => { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });

const ok = (r) => r && r.status === 200 && (r.type === 'basic' || r.type === 'default');

/* stale-while-revalidate: sofort aus dem Cache, im Hintergrund erneuern */
async function swr(req, key) {
  const cache = await caches.open(APP_CACHE);
  const hit = await cache.match(key || req, { ignoreSearch: !!key });
  const net = fetch(req).then((r) => { if (ok(r)) cache.put(key || req, r.clone()); return r; }).catch(() => null);
  return hit || (await net) || Response.error();
}

/* cache first mit Netzwerk-Rückfall; gecacht wird beim ersten Benutzen */
async function cacheFirst(req) {
  const cache = await caches.open(BIG_CACHE);
  const hit = await cache.match(req);
  if (hit) return hit;
  const r = await fetch(req);
  if (ok(r)) cache.put(req, r.clone()).catch(() => {});
  return r;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (u.origin !== self.location.origin) return;            // andere Herkunft (PeerJS, STUN/TURN, Übersetzung, Hugging Face): nie anfassen
  if (req.headers.has('range')) return;                      // Teilabrufe (Video/Audio) direkt ans Netz
  if (BIG_RE.test(u.pathname)) { e.respondWith(cacheFirst(req)); return; }
  if (req.mode === 'navigate') { e.respondWith(swr(req, url('index.html'))); return; }   // ?room=ABCD etc. liefert dieselbe Seite
  e.respondWith(swr(req));
});
