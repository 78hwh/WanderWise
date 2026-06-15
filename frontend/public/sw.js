// WanderWise Service Worker — 离线缓存 + 在线优先策略
const CACHE_NAME = "wanderwise-v1";

const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/manifest.json",
];

// ====== Install: 预缓存核心资源 ======
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

// ====== Activate: 清理旧缓存 ======
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ====== Fetch: 网络优先、缓存兜底 ======
self.addEventListener("fetch", (event) => {
  // 跳过非 GET 请求和 API 请求
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 网络成功 — 缓存一份副本
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(() => {
        // 网络失败 — 从缓存返回
        return caches.match(event.request).then((cached) => {
          return cached || new Response("离线模式 — 请稍后再试", { status: 503 });
        });
      })
  );
});
