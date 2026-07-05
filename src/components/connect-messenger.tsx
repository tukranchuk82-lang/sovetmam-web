"use client";

import { useState, useTransition } from "react";
import { Send, Loader2 } from "lucide-react";
import { chooseMessenger } from "@/app/(app)/login/onboarding-actions";
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
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<MessengerChannel | null>(null);
  const [error, setError] = useState<string | null>(null);

  function connect(channel: MessengerChannel) {
    setError(null);
    setBusy(channel);
    startTransition(async () => {
      const res = await chooseMessenger(channel);
      if (res.ok) {
        // Уводим человека в бота по прокси-ссылке Salebot (с app_id/email).
        // Обратно, какой канал и когда подключён, вернёт вебхук
        // /api/salebot/connect из воронки Salebot.
        window.location.href = res.url;
      } else {
        setError(res.error);
        setBusy(null);
      }
    });
  }

  return (
    <div className="w-full max-w-[340px]">
      <div className="space-y-2.5">
        {CHANNELS.map((ch) => (
          <button
            key={ch.id}
            type="button"
            disabled={pending}
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
    </div>
  );
}
