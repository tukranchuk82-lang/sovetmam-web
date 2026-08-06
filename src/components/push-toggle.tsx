"use client";

import { useState, useSyncExternalStore } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import {
  subscribeToPushAction,
  unsubscribeFromPushAction,
} from "@/app/(app)/profile/push-actions";

/**
 * Переключатель уведомлений на устройстве.
 *
 * Разрешение спрашиваем только по нажатию — всплывающее окно при первом заходе
 * люди закрывают не глядя, и вернуть его потом уже нельзя: браузер запоминает
 * отказ навсегда.
 *
 * Живёт в личном кабинете рядом с остальными настройками связи.
 */

// Состояние разрешения — свойство браузера, читаем его как внешнее.
function subscribe(onChange: () => void): () => void {
  // Notification.permission меняется без событий; обновляемся при возвращении
  // на вкладку — этого достаточно, разрешение меняют в настройках браузера.
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

function permissionSnapshot(): NotificationPermission | "unsupported" {
  if (typeof Notification === "undefined" || !("serviceWorker" in navigator)) {
    return "unsupported";
  }
  return Notification.permission;
}

export function PushToggle() {
  const permission = useSyncExternalStore(
    subscribe,
    permissionSnapshot,
    () => "unsupported" as const,
  );
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  if (permission === "unsupported") return null;

  async function enable() {
    setBusy(true);
    setNote(null);
    try {
      const granted = await Notification.requestPermission();
      if (granted !== "granted") {
        setNote("Уведомления запрещены в настройках браузера");
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!key) {
        setNote("Уведомления пока не настроены");
        return;
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: key,
      });

      const json = sub.toJSON();
      const res = await subscribeToPushAction({
        endpoint: sub.endpoint,
        p256dh: json.keys?.p256dh ?? "",
        auth: json.keys?.auth ?? "",
        userAgent: navigator.userAgent,
      });
      setNote(res.ok ? "Готово: будем присылать уведомления" : "Не получилось сохранить");
    } catch (e) {
      setNote(`Не получилось включить: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setNote(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await unsubscribeFromPushAction(sub.endpoint);
        await sub.unsubscribe();
      }
      setNote("Уведомления выключены на этом устройстве");
    } finally {
      setBusy(false);
    }
  }

  const on = permission === "granted";

  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
          {on ? <Bell className="size-4" /> : <BellOff className="size-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Уведомления на этом устройстве</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Придут, когда ответим на ваше обращение — даже если приложение закрыто.
          </p>

          {note && <p className="mt-2 text-xs font-medium text-brand">{note}</p>}

          <button
            type="button"
            onClick={on ? disable : enable}
            disabled={busy}
            className="mt-3 inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-sm font-semibold disabled:opacity-60"
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            {on ? "Выключить" : "Включить уведомления"}
          </button>
        </div>
      </div>
    </div>
  );
}
