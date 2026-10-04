"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Один раз обновляет страницу после открытия переписки.
 *
 * Меню и кружки считаются раньше, чем сама страница отметит сообщения
 * прочитанными, — без обновления кружок гаснет только при следующем переходе.
 * Рисуем компонент только там, где при открытии реально что-то прочитали.
 */
export function RefreshOnce({ when }: { when: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (when) router.refresh();
    // Один раз за открытие страницы.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
