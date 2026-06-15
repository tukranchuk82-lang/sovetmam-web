"use client";

import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { loginAsDemoUser } from "@/app/(app)/login/actions";
import type { Channel, Role } from "@/lib/demo-auth";

const CHANNELS: Array<{
  id: Channel;
  label: string;
  bg: string;
  hover: string;
  icon: React.ReactNode;
}> = [
  {
    id: "telegram",
    label: "Войти через Telegram",
    bg: "bg-[#229ED9]",
    hover: "hover:bg-[#1c8bbf]",
    icon: <Send className="size-5" />,
  },
  {
    id: "vk",
    label: "Войти через ВКонтакте",
    bg: "bg-[#0077FF]",
    hover: "hover:bg-[#0065d8]",
    icon: <span className="text-base font-extrabold">VK</span>,
  },
  {
    id: "max",
    label: "Войти через MAX",
    bg: "bg-[#7C3AED]",
    hover: "hover:bg-[#6c2bd9]",
    icon: <span className="text-base font-extrabold">M</span>,
  },
];

const ROLES: Array<{ id: Role; label: string }> = [
  { id: "user", label: "Пользователь" },
  { id: "owner", label: "Заказчик" },
  { id: "tech", label: "Техспец" },
];

export function LoginForm() {
  const [role, setRole] = useState<Role>("user");
  const [pending, startTransition] = useTransition();

  function login(channel: Channel) {
    // Куда вернуться после входа (например, к форме обращения) — берём из ?next.
    const next =
      new URLSearchParams(window.location.search).get("next") ?? undefined;
    startTransition(async () => {
      await loginAsDemoUser(channel, role, next);
    });
  }

  return (
    <div className="mt-7 w-full max-w-[320px]">
      <div className="space-y-2.5">
        {CHANNELS.map((c, idx) => (
          <motion.button
            key={c.id}
            type="button"
            disabled={pending}
            onClick={() => login(c.id)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 + idx * 0.08, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "flex h-12 w-full items-center justify-center gap-2.5 rounded-xl text-sm font-semibold text-white shadow-[0_8px_22px_-10px_rgba(0,0,0,0.45)] transition-shadow hover:shadow-[0_12px_28px_-10px_rgba(0,0,0,0.55)] disabled:opacity-60",
              c.bg,
              c.hover,
            )}
          >
            {c.icon}
            {c.label}
          </motion.button>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-dashed border-white/40 bg-white/10 px-3 py-2.5 text-white/90 backdrop-blur-md">
        <p className="text-[11px] uppercase tracking-wide text-white/80">
          Демо-режим — войти как
        </p>
        <div className="mt-1.5 flex gap-1">
          {ROLES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRole(r.id)}
              className={cn(
                "flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors",
                role === r.id
                  ? "bg-white text-primary"
                  : "bg-white/15 text-white hover:bg-white/25",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[11px] text-white/70">
          В боевой версии роль определится автоматически по вашему ID в боте
        </p>
      </div>
    </div>
  );
}
