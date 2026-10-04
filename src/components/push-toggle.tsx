"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
 * Состояние берём не из одного разрешения, а из самой подписки устройства:
 * разрешение могло быть выдано раньше, а подписки на этом адресе нет — тогда
 * уведомления фактически выключены, и кнопка должна предлагать их включить.
 * Всё, что идёт не так (запрещено в браузере, нет фонового режима, нет связи),
 * показываем текстом: молча «ничего не происходит» — худший исход.
 */

type Support = "checking" | "unsupported" | "ready";

const READY_TIMEOUT_MS = 8000;

/** Ждём фоновый режим приложения, но не вечно: иначе кнопка зависает без объяснений. */
function serviceWorkerReady(): Promise<ServiceWorkerRegistration> {
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) =>
      window.setTimeout(() => reject(new Error("timeout")), READY_TIMEOUT_MS),
    ),
  ]);
}

export function PushToggle({
  description = "Придут, когда ответим на ваше обращение — даже если приложение закрыто.",
  bare = false,
}: {
  description?: string;
  /** Без рамки карточки — когда переключатель стоит внутри другой панели. */
  bare?: boolean;
}) {
  const router = useRouter();
  const [support, setSupport] = useState<Support>("checking");
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  // Что на самом деле включено на этом устройстве.
  const refresh = useCallback(async () => {
    if (typeof Notification === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setSupport("unsupported");
      return;
    }
    setSupport("ready");
    setPermission(Notification.permission);
    try {
      const reg = await serviceWorkerReady();
      setSubscribed(Boolean(await reg.pushManager.getSubscription()));
    } catch {
      setSubscribed(false);
    }
  }, []);

  useEffect(() => {
    // Читаем состояние браузера и подписки — внешнюю систему; setState происходит после await.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
    const onVisible = () => void refresh();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refresh]);

  if (support === "unsupported") {
    return bare ? (
      <p className="text-xs text-muted-foreground">
        Этот браузер не поддерживает уведомления. На iPhone они работают только в приложении, добавленном на
        домашний экран.
      </p>
    ) : null;
  }

  async function enable() {
    setBusy(true);
    setNote(null);
    try {
      const granted = await Notification.requestPermission();
      setPermission(granted);
      if (granted !== "granted") {
        setNote("Уведомления запрещены в настройках браузера — разрешите их для этого сайта и нажмите ещё раз.");
        return;
      }

      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!key) {
        setNote("Уведомления на этом сайте пока не настроены.");
        return;
      }

      let reg: ServiceWorkerRegistration;
      try {
        reg = await serviceWorkerReady();
      } catch {
        setNote("Не готов фоновый режим приложения. Обновите страницу и попробуйте ещё раз.");
        return;
      }

      const existing = await reg.pushManager.getSubscription();
      const sub =
        existing ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key }));

      const json = sub.toJSON();
      const res = await subscribeToPushAction({
        endpoint: sub.endpoint,
        p256dh: json.keys?.p256dh ?? "",
        auth: json.keys?.auth ?? "",
        userAgent: navigator.userAgent,
      });
      if (!res.ok) {
        setNote("Не получилось сохранить: войдите в приложение заново и повторите.");
        return;
      }
      setSubscribed(true);
      setNote("Готово: уведомления включены на этом устройстве.");
      router.refresh();
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
      const reg = await serviceWorkerReady();
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await unsubscribeFromPushAction(sub.endpoint);
        await sub.unsubscribe();
      }
      setSubscribed(false);
      setNote("Уведомления выключены на этом устройстве.");
    } catch (e) {
      setNote(`Не получилось выключить: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  const denied = permission === "denied";
  const on = permission === "granted" && subscribed;

  return (
    <div className={bare ? "" : "rounded-2xl border bg-card p-4"}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
          {on ? <Bell className="size-4" /> : <BellOff className="size-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            Уведомления на этом устройстве
            {on && <span className="ml-2 text-xs font-medium text-emerald-600">включены</span>}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>

          {denied && (
            <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-2 text-xs leading-snug text-amber-900">
              Браузер блокирует уведомления для этого сайта. Нажмите на значок слева от адреса (замок или настройки) →
              «Уведомления» → «Разрешить», затем вернитесь и нажмите «Включить».
            </p>
          )}
          {note && <p className="mt-2 text-xs font-medium text-brand">{note}</p>}

          <button
            type="button"
            onClick={on ? disable : enable}
            disabled={busy || support === "checking"}
            className="mt-3 inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-sm font-semibold disabled:opacity-60"
          >
            {(busy || support === "checking") && <Loader2 className="size-4 animate-spin" />}
            {on ? "Выключить" : "Включить уведомления"}
          </button>
        </div>
      </div>
    </div>
  );
}
