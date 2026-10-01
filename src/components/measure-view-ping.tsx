"use client";

import { useEffect } from "react";
import { recordMeasureView } from "@/app/measure-view-actions";

/**
 * Тихая отметка при открытии карточки меры (см. measure-view-actions).
 * В браузере держим дату просмотра, чтобы при возвратах на страницу не
 * дёргать сервер лишний раз; сервер всё равно не запишет повтор за сутки.
 */
export function MeasureViewPing({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `sm-mv-${slug}`;
    const today = new Date().toISOString().slice(0, 10);
    try {
      if (localStorage.getItem(key) === today) return;
      localStorage.setItem(key, today);
    } catch {
      // Хранилище закрыто — пошлём отметку, сервер сам отсеет повтор.
    }
    void recordMeasureView(slug);
  }, [slug]);

  return null;
}
