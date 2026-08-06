"use client";

import { useEffect } from "react";
import { recordVisitAction } from "@/app/share-actions";

/**
 * Отметка «пришёл по размеченной ссылке».
 *
 * Смотрит метку utm_source в адресе и один раз за визит сообщает о ней серверу.
 * Метку не трогаем и из адреса не убираем: её ждёт UtmCapture, который положит
 * её в cookie и передаст в профиль при регистрации. И если человек перешлёт
 * ссылку дальше вместе с меткой — это по-прежнему приход из пересылки, считать
 * его нужно.
 *
 * Метку читаем из адресной строки напрямую, а не через useSearchParams: тот
 * требует обёртки Suspense на каждой странице, где стоит компонент, а нам нужно
 * поставить его один раз в общий каркас.
 *
 * Один визит — одна отметка: признак храним в sessionStorage, он живёт до
 * закрытия вкладки. Иначе обновление страницы накручивало бы счётчик.
 */
const MARK = "sm-arrival-counted";

export function ShareArrival() {
  useEffect(() => {
    const source = new URLSearchParams(window.location.search).get("utm_source");
    if (!source) return;

    try {
      if (window.sessionStorage.getItem(MARK) === source) return;
      window.sessionStorage.setItem(MARK, source);
    } catch {
      // Хранилище может быть запрещено (строгие настройки, инкогнито) — тогда
      // посчитаем визит ещё раз. Это лучше, чем не посчитать вовсе.
    }

    void recordVisitAction({ path: window.location.pathname, ref: source });
  }, []);

  return null;
}
