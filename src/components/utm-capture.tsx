"use client";

import { useEffect } from "react";

// Захват UTM-меток при первом заходе: читаем utm_* из URL и кладём в cookie
// (first-touch — не перезатираем, если метки уже сохранены). При регистрации
// серверный экшен перенесёт их в профиль пользователя.
const KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
];

export function UtmCapture() {
  useEffect(() => {
    if (document.cookie.includes("sm_utm=")) return; // first-touch only
    const sp = new URLSearchParams(window.location.search);
    const found: Record<string, string> = {};
    for (const k of KEYS) {
      const v = sp.get(k);
      if (v) found[k] = v;
    }
    if (Object.keys(found).length === 0) return;
    const maxAge = 60 * 60 * 24 * 90; // 90 дней
    document.cookie = `sm_utm=${encodeURIComponent(
      JSON.stringify(found),
    )}; path=/; max-age=${maxAge}; samesite=lax`;
  }, []);

  return null;
}
