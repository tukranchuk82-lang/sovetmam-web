"use client";

import { useEffect } from "react";

/**
 * Кружок с числом на иконке установленного приложения.
 *
 * Работает там, где система это умеет: Windows, Android, macOS. В браузере на
 * вкладке ничего не показывается — и это нормально, значок в нижнем меню
 * остаётся основным способом заметить ответ.
 *
 * Ничего не рисует: только просит систему обновить иконку.
 */
export function AppBadge({ count }: { count: number }) {
  useEffect(() => {
    const nav = navigator as Navigator & {
      setAppBadge?: (n?: number) => Promise<void>;
      clearAppBadge?: () => Promise<void>;
    };
    if (!nav.setAppBadge) return;

    // Ошибку глушим: часть систем разрешает значок только установленному
    // приложению, и отказ здесь — обычное дело, а не поломка.
    if (count > 0) nav.setAppBadge(count).catch(() => {});
    else nav.clearAppBadge?.().catch(() => {});
  }, [count]);

  return null;
}
