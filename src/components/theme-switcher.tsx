"use client";

import { useState, useSyncExternalStore } from "react";
import { Palette, Check, X } from "lucide-react";
import { THEMES, DEFAULT_THEME } from "@/lib/themes";
import { cn } from "@/lib/utils";

const THEME_EVENT = "sm-theme-change";

function subscribe(cb: () => void) {
  window.addEventListener(THEME_EVENT, cb);
  return () => window.removeEventListener(THEME_EVENT, cb);
}
function getSnapshot() {
  return document.documentElement.getAttribute("data-theme") || DEFAULT_THEME;
}
function getServerSnapshot() {
  return DEFAULT_THEME;
}

/**
 * Переключатель визуальных тем — только для режима прототипа: клиент щёлкает
 * между вариантами дизайна прямо в приложении. Выбор сохраняется в localStorage
 * и применяется атрибутом data-theme на <html>.
 */
export function ThemeSwitcher() {
  const [open, setOpen] = useState(false);
  const active = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  function choose(key: string) {
    document.documentElement.setAttribute("data-theme", key);
    try {
      localStorage.setItem("sm-theme", key);
    } catch {
      // приватный режим — просто не сохраняем
    }
    window.dispatchEvent(new Event(THEME_EVENT));
    setOpen(false);
  }

  return (
    <div className="pointer-events-none absolute bottom-[80px] right-3 z-40 flex flex-col items-end gap-2">
      {open && (
        <div className="pointer-events-auto w-56 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-stone-100 px-3 py-2">
            <span className="text-xs font-bold uppercase tracking-wide text-stone-500">
              Дизайн (прототип)
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Закрыть"
              className="text-stone-400 hover:text-stone-600"
            >
              <X className="size-4" />
            </button>
          </div>
          <ul className="p-1.5">
            {THEMES.map((t) => (
              <li key={t.key}>
                <button
                  type="button"
                  onClick={() => choose(t.key)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left transition-colors",
                    active === t.key
                      ? "bg-stone-100"
                      : "hover:bg-stone-50",
                  )}
                >
                  <span className="flex size-5 shrink-0 items-center justify-center">
                    {active === t.key && (
                      <Check className="size-4 text-emerald-600" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-stone-800">
                      {t.name}
                    </span>
                    <span className="block text-xs text-stone-500">
                      {t.hint}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Сменить дизайн"
        className="pointer-events-auto flex size-12 items-center justify-center rounded-full bg-stone-900 text-white shadow-[0_8px_24px_-6px_rgba(0,0,0,0.5)] transition-transform hover:scale-105 active:scale-95"
      >
        <Palette className="size-5" />
      </button>
    </div>
  );
}
