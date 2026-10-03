"use client";

import { useEffect, useRef } from "react";
import { recordMeasureView } from "@/app/measure-view-actions";

/**
 * Тихая отметка при открытии карточки меры и учёт того, что человек на ней
 * делает (см. measure-view-actions и app/api/measure-engagement).
 *
 * Считаем: откуда пришёл, сколько секунд страница была на экране, как далеко
 * прокрутил, до каких разделов дошёл («Кому положено», «Как оформить»,
 * «Документы», «Полезно знать») и что нажал: внешнюю ссылку или «Задать вопрос
 * по мере». Итог уходит одним коротким запросом, когда человек уходит со
 * страницы или сворачивает приложение.
 *
 * Сама запись просмотра — не чаще раза в сутки на меру (браузер помнит дату);
 * а вот «поведение» отправляется при каждом заходе: сервер сам сложит их в
 * сегодняшнюю строку.
 */

const SECTION_ATTR = "data-mv-section";
const ACTION_ATTR = "data-mv-action";

/** Откуда пришли: по предыдущей странице внутри приложения, иначе — по адресу, с которого открыли. */
function detectSource(): string {
  let from: string | null = null;
  try {
    from = sessionStorage.getItem("sm-trail-cur");
  } catch {
    // нет доступа к хранилищу — полагаемся на referrer
  }
  let u: URL | null = null;
  try {
    if (from) u = new URL(from, window.location.origin);
    else if (document.referrer) u = new URL(document.referrer);
  } catch {
    u = null;
  }
  if (!u) return "direct";
  if (u.origin !== window.location.origin) return "external";

  const p = u.pathname;
  if (p.startsWith("/podbor")) return "podbor";
  if (p.startsWith("/saved")) return "saved";
  if (p.startsWith("/profile")) return "profile";
  if (p === "/") return "home";
  if (p.startsWith("/catalog")) return u.searchParams.get("q") || u.searchParams.get("search") ? "search" : "catalog";
  if (/^\/(situation|topic|segment|family|class|pyramid)/.test(p)) return "topics";
  return "direct";
}

/** Ближайший родитель, который прокручивается: в приложении листает не окно, а внутренний блок. */
function scrollParent(el: HTMLElement | null): HTMLElement | Window {
  let cur = el?.parentElement ?? null;
  while (cur) {
    const oy = getComputedStyle(cur).overflowY;
    if (oy === "auto" || oy === "scroll") return cur;
    cur = cur.parentElement;
  }
  return window;
}

export function MeasureViewPing({ slug }: { slug: string }) {
  const anchor = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    // ── запись просмотра: раз в сутки на меру ─────────────────────────────
    const key = `sm-mv-${slug}`;
    const today = new Date().toISOString().slice(0, 10);
    let alreadyToday = false;
    try {
      alreadyToday = localStorage.getItem(key) === today;
      if (!alreadyToday) localStorage.setItem(key, today);
    } catch {
      // Хранилище закрыто — пошлём отметку, сервер сам отсеет повтор.
    }
    if (!alreadyToday) void recordMeasureView(slug, detectSource());

    // ── поведение на странице ─────────────────────────────────────────────
    let visibleSince: number | null = document.visibilityState === "visible" ? Date.now() : null;
    let seconds = 0;
    let sentSeconds = 0;
    let maxScroll = 0;
    const sections = new Set<string>();
    const actions = new Set<string>();

    const scroller = scrollParent(anchor.current);
    const onScroll = () => {
      const [top, height, total] =
        scroller instanceof Window
          ? [window.scrollY, window.innerHeight, document.documentElement.scrollHeight]
          : [scroller.scrollTop, scroller.clientHeight, scroller.scrollHeight];
      const depth = total <= height ? 100 : Math.round(((top + height) / total) * 100);
      if (depth > maxScroll) maxScroll = Math.min(100, depth);
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio >= 0.35) {
            const name = (e.target as HTMLElement).getAttribute(SECTION_ATTR);
            if (name) sections.add(name);
          }
        }
      },
      { threshold: [0.35] },
    );
    document.querySelectorAll(`[${SECTION_ATTR}]`).forEach((el) => io.observe(el));

    const onClick = (ev: MouseEvent) => {
      const target = ev.target as HTMLElement | null;
      const marked = target?.closest(`[${ACTION_ATTR}]`);
      if (marked) {
        const a = marked.getAttribute(ACTION_ATTR);
        if (a) actions.add(a);
        return;
      }
      const link = target?.closest("a") as HTMLAnchorElement | null;
      if (link && link.href && new URL(link.href, window.location.href).origin !== window.location.origin) {
        actions.add("link");
      }
    };
    document.addEventListener("click", onClick, true);

    const total = () => seconds + (visibleSince ? Math.round((Date.now() - visibleSince) / 1000) : 0);

    function flush() {
      const now = total();
      const delta = Math.max(0, now - sentSeconds);
      // Ничего нового (мгновенно ушли, ничего не открыли) — не шлём.
      if (delta < 2 && sections.size === 0 && actions.size === 0 && maxScroll < 5) return;
      const payload = JSON.stringify({
        slug,
        seconds: delta,
        scroll: maxScroll,
        sections: [...sections],
        actions: [...actions],
      });
      sentSeconds = now;
      try {
        navigator.sendBeacon("/api/measure-engagement", new Blob([payload], { type: "application/json" }));
      } catch {
        // Не получилось — потеряем один просмотр поведения, на работу страницы это не влияет.
      }
    }

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        if (visibleSince) {
          seconds += Math.round((Date.now() - visibleSince) / 1000);
          visibleSince = null;
        }
        flush();
      } else {
        visibleSince = Date.now();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("click", onClick, true);
      scroller.removeEventListener("scroll", onScroll);
      io.disconnect();
      // Ушли на другую страницу внутри приложения — страница не выгружается,
      // поэтому итог отправляем здесь.
      flush();
    };
  }, [slug]);

  return <span ref={anchor} aria-hidden className="hidden" />;
}
