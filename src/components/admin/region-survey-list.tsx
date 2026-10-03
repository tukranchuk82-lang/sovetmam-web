"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { Drawer } from "@/components/admin/ui/drawer";
import type { SurveyRow } from "@/lib/survey-describe";

export interface SurveyListUser {
  id: string;
  name: string;
  email: string;
  /** Дата заполнения анкеты, уже отформатированная. */
  date: string;
  rows: SurveyRow[];
}

/**
 * Люди региона, заполнившие анкету, — обычным списком на светлом фоне: имя,
 * почта, дата. Значок слева открывает анкету человека сбоку, чтобы не уходить
 * со страницы.
 */
export function RegionSurveyList({ users }: { users: SurveyListUser[] }) {
  const [selected, setSelected] = useState<SurveyListUser | null>(null);

  if (users.length === 0) {
    return (
      <p className="rounded-2xl bg-[#FBF8F3] px-4 py-6 text-center text-sm text-[#6b7078]">
        Пока никто из региона не заполнил анкету.
      </p>
    );
  }

  return (
    <>
      <ul className="divide-y divide-[#E8E1D4] overflow-hidden rounded-2xl bg-[#FBF8F3] text-[#2b2f36]">
        {users.map((u) => (
          <li key={u.id} className="flex items-center gap-3 px-3.5 py-3">
            <button
              type="button"
              onClick={() => setSelected(u)}
              aria-label={`Открыть анкету: ${u.name}`}
              title="Открыть анкету"
              className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#1B3A6B] text-white transition-colors hover:bg-[#244a85]"
            >
              <FileText className="size-[18px]" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold leading-snug">{u.name}</p>
              <p className="truncate text-[13px] text-[#6b7078]">{u.email}</p>
              <p className="text-[12px] tabular-nums text-[#8a8f98] sm:hidden">{u.date}</p>
            </div>
            <span className="hidden shrink-0 text-[13px] tabular-nums text-[#6b7078] sm:block">{u.date}</span>
          </li>
        ))}
      </ul>

      <Drawer
        open={selected != null}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ""}
        subtitle={selected ? `${selected.email} · анкета от ${selected.date}` : undefined}
      >
        {selected &&
          (selected.rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">В анкете пока нет ответов.</p>
          ) : (
            <dl className="divide-y divide-border text-[13.5px]">
              {selected.rows.map((r) => (
                <div key={r.label} className="grid grid-cols-[130px_1fr] gap-3 py-2.5">
                  <dt className="text-muted-foreground">{r.label}</dt>
                  <dd className="min-w-0 break-words font-medium">{r.value}</dd>
                </div>
              ))}
            </dl>
          ))}
      </Drawer>
    </>
  );
}
