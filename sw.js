const CACHE_NAME="kroma-cache-v1";
const ASSETS=[
"/KromaticaWorkFlow-v2/",
"/KromaticaWorkFlow-v2/index.html",
"/KromaticaWorkFlow-v2/app.js",
"/KromaticaWorkFlow-v2/manifest.json"
];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS)));});
self.addEventListener("fetch",e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));});
