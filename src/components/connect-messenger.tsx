"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2, ArrowRight } from "lucide-react";
import {
  chooseMessenger,
  messengerStatus,
} from "@/app/(app)/login/onboarding-actions";
import type { MessengerChannel } from "@/lib/onboarding-db";

const CHANNELS: {
  id: MessengerChannel;
  label: string;
  bg: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "telegram",
    label: "Telegram",
    bg: "bg-[#229ED9] hover:bg-[#1c8bbf]",
    icon: <Send className="size-5" />,
  },
  {
    id: "vk",
    label: "ВКонтакте",
    bg: "bg-[#0077FF] hover:bg-[#0065d8]",
    icon: <span className="text-base font-extrabold">VK</span>,
  },
  {
    id: "max",
    label: "MAX",
    bg: "bg-[#7C3AED] hover:bg-[#6c2bd9]",
    icon: <span className="text-base font-extrabold">M</span>,
  },
];

export function ConnectMessenger() {
  const router = useRouter();
  const [busy, setBusy] = useState<MessengerChannel | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Пока ждём подтверждения из бота — опрашиваем статус; как подключился,
  // уводим в личный кабинет.
  useEffect(() => {
    if (!waiting) return;
    pollRef.current = setInterval(async () => {
      const s = await messengerStatus();
      if (s.connected) {
        if (pollRef.current) clearInterval(pollRef.current);
        router.replace("/profile");
      }
    }, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [waiting, router]);

  function connect(channel: MessengerChannel) {
    setError(null);
    setBusy(channel);
    // Открываем новую вкладку СРАЗУ по клику (иначе попап-блокировщик зарежет).
    const win = window.open("", "_blank");
    chooseMessenger(channel).then((res) => {
      if (res.ok) {
        if (win && !win.closed) win.location.href = res.url;
        else window.location.href = res.url;
        setWaiting(true); // ждём подтверждения из бота
      } else {
        win?.close();
        setError(res.error);
        setBusy(null);
      }
    });
  }

  // Экран ожидания подтверждения.
  if (waiting) {
    return (
      <div className="w-full max-w-[340px] text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#1B3A6B]/10">
          <Loader2 className="size-6 animate-spin text-[#1B3A6B]" />
        </div>
        <p className="mt-4 text-sm text-[#4D4D4D]">
          Мы открыли бота в новой вкладке. Нажмите там{" "}
          <span className="font-semibold">Start / Начать</span> — и вернитесь
          сюда. Как только подключение подтвердится, откроется личный кабинет.
        </p>
        <button
          type="button"
          onClick={() => router.replace("/profile")}
          className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1B3A6B] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#16305a]"
        >
          Я подключил(а) — в кабинет
          <ArrowRight className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[340px]">
      <div className="space-y-2.5">
        {CHANNELS.map((ch) => (
          <button
            key={ch.id}
            type="button"
            disabled={busy !== null}
            onClick={() => connect(ch.id)}
            className={`flex h-12 w-full items-center justify-center gap-2.5 rounded-xl text-sm font-semibold text-white shadow-sm transition-colors disabled:opacity-60 ${ch.bg}`}
          >
            {busy === ch.id ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              ch.icon
            )}
            Подключить {ch.label}
          </button>
        ))}
      </div>

      {error && <p className="mt-3 text-center text-sm text-[#8E1D2C]">{error}</p>}

      <p className="mt-4 text-center text-xs text-[#9aa0a8]">
        Бот откроется в новой вкладке — приложение останется здесь.
      </p>
    </div>
  );
}
