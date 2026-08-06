// Service worker «Совета матерей».
//
// Главная задача — сделать приложение устанавливаемым: Chrome/Edge показывают
// родное окно установки (событие beforeinstallprompt) только если у сайта есть
// service worker с обработчиком события fetch. Заодно даём базовую офлайн-
// устойчивость по стратегии network-first для собственных страниц.

const CACHE = "sovetmam-v3";

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
  //
  // Важно: из обработчика нельзя вернуть undefined. Раньше при отсутствии сети
  // и пустом кеше сюда возвращалось именно оно — браузер считал это сбоем и
  // ронял всю страницу. Внутри Telegram и других встроенных браузеров, где
  // хранилище часто урезано, это выглядело как «приложение открылось на
  // секунду и закрылось с ошибкой».
  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches
          .open(CACHE)
          .then((cache) => cache.put(request, copy))
          .catch(() => {
            // Кеш может быть запрещён политикой браузера — это не повод
            // ломать ответ, он уже получен.
          });
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request).catch(() => undefined);
        if (cached) return cached;

        // Ни сети, ни кеша. Для страниц отвечаем понятной заглушкой, для
        // остального — честной ошибкой, но всегда настоящим Response.
        if (request.mode === "navigate") {
          return new Response(
            `<!doctype html><meta charset="utf-8">
             <title>Нет связи</title>
             <div style="font:16px/1.5 system-ui;padding:24px;color:#23191a">
               <p>Не удалось связаться с приложением.</p>
               <p>Проверьте интернет и обновите страницу.</p>
             </div>`,
            { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } },
          );
        }
        return new Response("", { status: 504, statusText: "offline" });
      }),
  );
});

// ── Пуш-уведомления ────────────────────────────────────────────────────────
// Приходят, даже когда приложение закрыто: браузер будит service worker,
// показывает уведомление, а по нажатию открывает нужную страницу.

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    // Пуш без разбираемого тела — покажем общее уведомление, чем промолчим.
  }

  const title = data.title || "«Совет матерей»";
  const options = {
    body: data.body || "Есть новости в приложении",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    // Тег склеивает уведомления одного типа: три ответа подряд не превратятся
    // в три отдельные плашки.
    tag: data.tag || "sovetmam",
    data: { url: data.url || "/" },
  };

  event.waitUntil(
    self.registration.showNotification(title, options).then(() => {
      // Кружок с числом на иконке приложения, если система это умеет.
      if (typeof data.badge === "number" && self.navigator.setAppBadge) {
        return self.navigator.setAppBadge(data.badge).catch(() => {});
      }
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";

  // Если приложение уже открыто — переводим на нужную страницу, а не плодим
  // вторую вкладку.
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin)) {
          client.focus();
          return client.navigate(url);
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
