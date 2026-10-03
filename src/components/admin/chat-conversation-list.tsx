"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MapPin, MessageCircle, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ConversationItem {
  userId: string;
  userName: string;
  region: string;
  lastMessage: string;
  lastAuthor: "user" | "coordinator";
  lastAt: string;
  unreadCount: number;
}

type Filter = "all" | "waiting";

/** Две буквы из имени для кружка-аватара (общий Avatar тянет серверный код и сюда не годится). */
function initials(name: string): string {
  const parts = name.trim().split(/s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

function when(iso: string): string {
  const d = new Date(iso);
  return d.toDateString() === new Date().toDateString()
    ? d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("ru-RU", { day: "2-digit", month: "short" });
}

/**
 * Список бесед с поиском и быстрым фильтром «Ждут ответа». Живёт на клиенте
 * только ради поиска: данные приходят готовыми от сервера.
 */
export function ChatConversationList({
  items,
  selectedId,
  showRegion,
  hrefBase = "/admin/region-chat",
}: {
  items: ConversationItem[];
  selectedId?: string;
  showRegion: boolean;
  /** Куда ведёт строка: hrefBase/<id>. */
  hrefBase?: string;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const waiting = items.filter((c) => c.lastAuthor === "user").length;
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((c) => {
      if (filter === "waiting" && c.lastAuthor !== "user") return false;
      if (!q) return true;
      return c.userName.toLowerCase().includes(q) || c.lastMessage.toLowerCase().includes(q);
    });
  }, [items, query, filter]);

  return (
    <>
      <div className="px-3 pb-2">
        <label className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.07] px-3 py-2 focus-within:border-white/40">
          <Search className="size-4 shrink-0 text-white/50" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Имя или текст сообщения"
            className="w-full bg-transparent text-[13px] text-white outline-none placeholder:text-white/45"
          />
        </label>
        <div className="mt-2 flex gap-1.5">
          {(
            [
              ["all", `Все · ${items.length}`],
              ["waiting", `Ждут ответа · ${waiting}`],
            ] as [Filter, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={cn(
                "rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-colors",
                filter === key ? "bg-white text-[#16233F]" : "bg-white/10 text-white/80 hover:bg-white/15",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {items.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <MessageCircle className="mx-auto size-8 text-white/35" strokeWidth={1.5} />
            <p className="mt-2 text-sm font-semibold text-white">Пока никто не писал</p>
            <p className="mt-1 text-xs text-white/55">Когда человек напишет в чат, беседа появится здесь.</p>
          </div>
        ) : shown.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-white/60">Ничего не найдено</p>
        ) : (
          <ul className="space-y-1">
            {shown.map((c) => {
              const active = selectedId === c.userId;
              return (
                <li key={c.userId}>
                  <Link
                    href={`${hrefBase}/${c.userId}`}
                    className={cn(
                      "flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors",
                      active ? "bg-white/[0.14]" : "hover:bg-white/[0.07]",
                    )}
                  >
                    <span
                      aria-hidden
                      className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#5B83C9] to-[#3D5F9E] text-[15px] font-semibold text-white"
                    >
                      {initials(c.userName)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-sm font-semibold leading-snug text-white">{c.userName}</p>
                        <span className="shrink-0 text-[11px] text-white/50">{when(c.lastAt)}</span>
                      </div>
                      {showRegion && (
                        <p className="inline-flex items-center gap-0.5 text-[10.5px] text-white/50">
                          <MapPin className="size-3" />
                          {c.region}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <p className="line-clamp-1 min-w-0 flex-1 text-[13px] text-white/65">
                          {c.lastAuthor === "coordinator" ? "Вы: " : ""}
                          {c.lastMessage}
                        </p>
                        {c.unreadCount > 0 && (
                          <span
                            className="grid min-w-5 shrink-0 place-items-center rounded-full bg-[#C2334A] px-1.5 py-0.5 text-[11px] font-bold leading-none text-white"
                            aria-label={`Новых сообщений: ${c.unreadCount}`}
                          >
                            {c.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
