"use client";

import { useEffect } from "react";

/**
 * Регистрирует service worker (`/sw.js`). Нужен, чтобы Chrome/Edge считали
 * приложение устанавливаемым и показывали родное окно установки.
 * Ничего не рендерит.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Регистрация не критична — без неё просто не предложится установка.
      });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
