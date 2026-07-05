"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2, Check } from "lucide-react";
import {
  chooseMessenger,
  messengerStatus,
  disconnectMessengerAction,
} from "@/app/(app)/login/onboarding-actions";
import type { MessengerChannel } from "@/lib/onboarding-db";

type ChannelState = { telegram: boolean; vk: boolean; max: boolean };

const CHANNELS: {
  id: MessengerChannel;
  label: string;
  color: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "telegram",
    label: "Telegram",
    color: "#229ED9",
    icon: <Send className="size-5" />,
  },
  {
    id: "vk",
    label: "ВКонтакте",
    color: "#0077FF",
    icon: <span className="text-sm font-extrabold">VK</span>,
  },
  {
    id: "max",
    label: "MAX",
    color: "#7C3AED",
    icon: <span className="text-sm font-extrabold">M</span>,
  },
];

export function MessengerManager({ initial }: { initial: ChannelState }) {
  const router = useRouter();
  const [state, setState] = useState<ChannelState>(initial);
  const [busy, setBusy] = useState<MessengerChannel | null>(null); // подключаем
  const [waiting, setWaiting] = useState<MessengerChannel | null>(null); // ждём бота
  const [disc, setDisc] = useState<MessengerChannel | null>(null); // отключаем
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Пока ждём подтверждения из бота — опрашиваем статус нужного канала.
  useEffect(() => {
    if (!waiting) return;
    pollRef.current = setInterval(async () => {
      const s = await messengerStatus();
      if (s.channels[waiting]) {
        if (pollRef.current) clearInterval(pollRef.current);
        setState(s.channels);
        setWaiting(null);
        setBusy(null);
        router.refresh();
      }
    }, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [waiting, router]);

  function connect(ch: MessengerChannel) {
    setBusy(ch);
    const win = window.open("", "_blank");
    chooseMessenger(ch).then((res) => {
      if (res.ok) {
        if (win && !win.closed) win.location.href = res.url;
        else window.location.href = res.url;
        setWaiting(ch);
      } else {
        win?.close();
        setBusy(null);
      }
    });
  }

  function disconnect(ch: MessengerChannel) {
    setDisc(ch);
    disconnectMessengerAction(ch).then(() => {
      setState((s) => ({ ...s, [ch]: false }));
      setDisc(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      {CHANNELS.map((c) => {
        const connected = state[c.id];
        const isWaiting = waiting === c.id;
        return (
          <div
            key={c.id}
            className="flex items-center gap-3 rounded-2xl border border-black/[0.06] bg-white p-3 shadow-sm"
          >
            <div
              className="grid size-10 shrink-0 place-items-center rounded-xl text-white"
              style={{ background: c.color }}
            >
              {c.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-tight text-[#1A1A1A]">
                {c.label}
              </p>
              <p
                className={`mt-0.5 text-xs ${
                  connected ? "text-emerald-600" : "text-[#9aa0a8]"
                }`}
              >
                {connected
                  ? "Подключён"
                  : isWaiting
                    ? "Ждём подтверждения…"
                    : "Не подключён"}
              </p>
            </div>

            {connected ? (
              <button
                type="button"
                onClick={() => disconnect(c.id)}
                disabled={disc === c.id}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-black/10 px-3 text-xs font-semibold text-[#8E1D2C] transition-colors hover:bg-[#8E1D2C]/[0.06] disabled:opacity-60"
              >
                {disc === c.id ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : null}
                Отключить
              </button>
            ) : (
              <button
                type="button"
                onClick={() => connect(c.id)}
                disabled={busy !== null}
                className="inline-flex h-8 items-center gap-1 rounded-lg bg-[#1B3A6B] px-3 text-xs font-semibold text-white transition-colors hover:bg-[#16305a] disabled:opacity-60"
              >
                {busy === c.id ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Check className="size-3.5 opacity-0" />
                )}
                Подключить
              </button>
            )}
          </div>
        );
      })}

      {waiting && (
        <p className="pt-1 text-center text-xs text-[#9aa0a8]">
          Открыли бота в новой вкладке. Нажмите там{" "}
          <span className="font-semibold">Start</span> — статус здесь обновится
          сам.
        </p>
      )}
    </div>
  );
}
