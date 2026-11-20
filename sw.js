// Lets the game run with no internet once it has been opened: everything it
// needs is kept on the tablet. A newer version, when there is internet, is
// fetched quietly and used the next time the game is opened.
const CACHE = 'tornado-alley-20261120084447';
const FILES = ['./', 'index.html', 'play.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];

self.addEventListener('install', (e) => {
  // Straight from the website, never an older copy the browser kept.
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  // The game page itself: the newest from the internet when there is some
  // (so a new version shows at once), the kept copy when there is not.
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request.url, { cache: 'no-cache', credentials: 'same-origin' })
        .then(async (r) => {
          if (r.ok) await (await caches.open(CACHE)).put('./', r.clone());
          return r;
        })
        .catch(() => caches.match('./').then((r) => r || new Response('Open the game once with internet first.', { status: 503 }))),
    );
    return;
  }
  const fresh = fetch(e.request)
    .then(async (r) => {
      if (r.ok) await (await caches.open(CACHE)).put(e.request, r.clone());
      return r;
    })
    .catch(() => null);
  e.waitUntil(fresh);
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true })
      .then((hit) => hit || fresh.then((r) => r || caches.match('./')))
      .then((r) => r || new Response('Open the game once with internet first.', { status: 503 })),
  );
});
