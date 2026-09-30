const CACHE='child-reading-v3'
const PRECACHE=['./','./manifest.webmanifest']
const isFreshData=(request)=>{const url=new URL(request.url);return url.pathname.endsWith('/index.json')||url.pathname.endsWith('/book.json')||url.pathname.endsWith('/upload.html')||url.pathname.endsWith('/manage.html')}
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(PRECACHE)).then(()=>self.skipWaiting())))
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())))
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;if(isFreshData(event.request)){event.respondWith(fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response}).catch(()=>caches.match(event.request)));return}event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response})))})
