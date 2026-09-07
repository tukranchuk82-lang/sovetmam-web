"use client";

import { useEffect } from "react";
import { pingOpen, recordInstall } from "@/app/visit-actions";

/**
 * Одна короткая отметка при открытии приложения.
 *
 * Без неё мы видели только тех, кто пришёл по размеченной ссылке, и не могли
 * ответить на простой вопрос: сколько устройств вообще заходит.
 *
 * Отметка ставится раз в сутки на устройство — второй раз за день сервер её
 * молча пропустит (см. visit-actions). В браузере тоже держим дату, чтобы не
 * дёргать сервер лишний раз при переходах между страницами.
 *
 * Установку приложения отмечаем отдельно: браузер присылает appinstalled, а
 * на iPhone такого события нет — там признаком служит первый запуск с
 * домашнего экрана.
 */

const SEEN_KEY = "sm-seen-day";
const INSTALLED_KEY = "sm-install-sent";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const iosStandalone = (
    window.navigator as Navigator & { standalone?: boolean }
  ).standalone;
  return window.matchMedia("(display-mode: standalone)").matches || iosStandalone === true;
}

export function VisitPing() {
  useEffect(() => {
    const standalone = isStandalone();

    try {
      if (localStorage.getItem(SEEN_KEY) !== today()) {
        localStorage.setItem(SEEN_KEY, today());
        void pingOpen({ standalone });
      }
    } catch {
      // Приватный режим или запрет на хранилище: отметку всё равно шлём,
      // сервер сам не даст записать её дважды за день.
      void pingOpen({ standalone });
    }

    const markInstalled = () => {
      try {
        if (localStorage.getItem(INSTALLED_KEY) === "1") return;
        localStorage.setItem(INSTALLED_KEY, "1");
      } catch {
        // Не смогли запомнить — переживём: события установки редкие.
      }
      void recordInstall();
    };

    // Запуск с домашнего экрана: единственный признак установки на iPhone.
    if (standalone) markInstalled();
    window.addEventListener("appinstalled", markInstalled);
    return () => window.removeEventListener("appinstalled", markInstalled);
  }, []);

  return null;
}
