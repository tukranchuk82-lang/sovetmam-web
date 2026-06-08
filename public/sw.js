// Service worker «Совета матерей».
//
// Главная задача — сделать приложение устанавливаемым: Chrome/Edge показывают
// родное окно установки (событие beforeinstallprompt) только если у сайта есть
// service worker с обработчиком события fetch. Заодно даём базовую офлайн-
// устойчивость по стратегии network-first для собственных страниц.

const CACHE = "sovetmam-v1";

self.addEventListener("install", () => {
  // Новый SW активируется сразу, не дожидаясь закрытия старых вкладок.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Не вмешиваемся в сторонние запросы (Supabase, Google Fonts и т.п.).
  if (url.origin !== self.location.origin) return;

  // Network-first: онлайн всегда отдаём свежее, кеш — только запасной вариант
  // при отсутствии сети. Так контент не «залипает».
  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request)),
  );
});
