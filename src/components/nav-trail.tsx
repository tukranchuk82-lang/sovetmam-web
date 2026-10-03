"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Запоминает, на какой странице человек был «только что».
 *
 * Приложение переходит между страницами без перезагрузки, поэтому
 * document.referrer остаётся тем, с которого открыли самый первый экран, — по
 * нему не понять, из подборки или из каталога человек открыл меру. Здесь
 * держим адрес текущей страницы в sessionStorage; страница меры читает его
 * раньше, чем он обновится, и получает ту, с которой пришли (см.
 * measure-view-ping).
 */
export function NavTrail() {
  const pathname = usePathname();
  useEffect(() => {
    try {
      sessionStorage.setItem("sm-trail-cur", window.location.pathname + window.location.search);
    } catch {
      // хранилище закрыто — источник определится по referrer
    }
  }, [pathname]);
  return null;
}
