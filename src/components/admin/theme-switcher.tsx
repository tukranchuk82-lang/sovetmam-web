"use client";

import { useTransition } from "react";
import { Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { setAdminThemeAction } from "@/app/admin/actions";
import type { AdminTheme } from "@/lib/admin-theme";

const OPTIONS: Array<{ id: AdminTheme; label: string; swatch: string }> = [
  { id: "blue", label: "Синяя", swatch: "bg-slate-800" },
  { id: "beige", label: "Бежевая", swatch: "bg-stone-100 border border-stone-400" },
  { id: "dark", label: "Тёмная", swatch: "bg-black" },
];

export function AdminThemeSwitcher({ current }: { current: AdminTheme }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="hidden items-center gap-1 rounded-lg border bg-background p-0.5 sm:flex">
      <Palette className="ml-1.5 size-3 text-muted-foreground" />
      {OPTIONS.map((o) => (
        <button
          key={o.id}
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await setAdminThemeAction(o.id);
            })
          }
          title={o.label}
          aria-label={o.label}
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded transition-all",
            current === o.id ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : "opacity-60 hover:opacity-100",
          )}
        >
          <span className={cn("h-4 w-4 rounded-sm", o.swatch)} />
        </button>
      ))}
    </div>
  );
}
