"use client";

import { useState } from "react";
import { MapPin, Search, X, Check } from "lucide-react";
import { MeasureCard } from "@/components/measure-card";
import {
  REGIONS,
  pluralMeasures,
  type SupportMeasure,
} from "@/lib/measures";
import { REGION_COOKIE, REGION_COOKIE_MAX_AGE } from "@/lib/region";
import { cn } from "@/lib/utils";

type Level = "" | "federal" | "regional";

const LEVELS: { value: Level; label: string }[] = [
  { value: "", label: "Все" },
  { value: "federal", label: "Федеральные" },
  { value: "regional", label: "Региональные" },
];

const chipClass = (active: boolean) =>
  cn(
    "shrink-0 rounded-full border px-3.5 py-1.5 text-sm whitespace-nowrap transition-all",
    active
      ? "border-[#c9002f] bg-[#c9002f] text-white font-semibold shadow-[0_4px_12px_-4px_rgba(201,0,47,0.45)]"
      : "border-stone-200 bg-white text-foreground hover:bg-stone-50",
  );

/** Подходит ли региональная мера выбранному региону. */
function regionMatches(m: SupportMeasure, region: string | null): boolean {
  if (!region) return false;
  if (m.region === region) return true;
  if (m.criteria?.regions?.includes(region)) return true;
  return false;
}

function persistRegion(r: string) {
  document.cookie = `${REGION_COOKIE}=${encodeURIComponent(
    r,
  )}; path=/; max-age=${REGION_COOKIE_MAX_AGE}; samesite=lax`;
}

export function SegmentMeasures({
  measures,
  initialRegion,
}: {
  measures: SupportMeasure[];
  initialRegion: string | null;
}) {
  const [level, setLevel] = useState<Level>("");
  const [region, setRegion] = useState<string | null>(initialRegion);
  const [pickerOpen, setPickerOpen] = useState(false);

  const hasRegional = measures.some((m) => m.level === "regional");
  const needsRegion = level !== "federal";

  const visible = measures.filter((m) => {
    if (m.level === "federal") return level !== "regional";
    // региональная мера
    if (level === "federal") return false;
    return regionMatches(m, region);
  });

  function chooseRegion(r: string) {
    setRegion(r);
    persistRegion(r);
    setPickerOpen(false);
  }

  function selectLevel(v: Level) {
    setLevel(v);
    // Регион спрашиваем именно при выборе «Региональные», если он ещё не задан.
    if (v === "regional" && !region && hasRegional) {
      setPickerOpen(true);
    }
  }

  return (
    <div className="mt-4">
      {/* Фильтр по уровню меры */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {LEVELS.map((l) => (
          <button
            key={l.value}
            type="button"
            onClick={() => selectLevel(l.value)}
            className={chipClass(level === l.value)}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* Регион — нужен только когда показываем региональные меры */}
      {needsRegion && hasRegional && (
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="mt-3 inline-flex max-w-full items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 py-1.5 pl-2.5 pr-3 text-sm text-foreground transition-colors hover:bg-stone-100"
        >
          <MapPin className="size-4 shrink-0 text-[#c9002f]" />
          {region ? (
            <span className="truncate">
              <span className="text-muted-foreground">Регион: </span>
              <span className="font-semibold">{region}</span>
            </span>
          ) : (
            <span className="font-semibold text-[#c9002f]">
              Указать регион
            </span>
          )}
        </button>
      )}

      <p className="mt-4 text-sm font-medium text-muted-foreground">
        {visible.length > 0
          ? pluralMeasures(visible.length) + " в разделе"
          : "Подходящих мер не найдено"}
      </p>

      <div className="mt-3 space-y-3">
        {visible.map((m) => (
          <MeasureCard key={m.slug} measure={m} />
        ))}
      </div>

      {/* Пустые состояния-подсказки */}
      {visible.length === 0 && (
        <EmptyHint
          level={level}
          region={region}
          hasRegional={hasRegional}
          onPickRegion={() => setPickerOpen(true)}
        />
      )}

      {/* Подсказка про регион в режиме «Все», если регион не указан */}
      {level === "" && !region && hasRegional && visible.length > 0 && (
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="mt-3 flex w-full items-center gap-2.5 rounded-2xl border border-dashed border-[#c9002f]/40 bg-[#c9002f]/5 p-3.5 text-left text-sm transition-colors hover:bg-[#c9002f]/10"
        >
          <MapPin className="size-5 shrink-0 text-[#c9002f]" />
          <span>
            <span className="font-semibold">Укажите ваш регион</span> — покажем
            и региональные меры поддержки
          </span>
        </button>
      )}

      {pickerOpen && (
        <RegionPicker
          current={region}
          onChoose={chooseRegion}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}

function EmptyHint({
  level,
  region,
  hasRegional,
  onPickRegion,
}: {
  level: Level;
  region: string | null;
  hasRegional: boolean;
  onPickRegion: () => void;
}) {
  // Региональный фильтр без выбранного региона
  if (level !== "federal" && !region && hasRegional) {
    return (
      <button
        type="button"
        onClick={onPickRegion}
        className="mt-2 flex w-full flex-col items-center gap-2 rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-center transition-colors hover:bg-stone-100"
      >
        <MapPin className="size-6 text-[#c9002f]" />
        <span className="text-sm font-semibold">Укажите ваш регион</span>
        <span className="text-xs text-muted-foreground">
          Чтобы показать положенные региональные меры
        </span>
      </button>
    );
  }

  // Регион выбран, но мер по нему нет
  if (level === "regional" && region) {
    return (
      <p className="mt-6 px-4 text-center text-sm text-muted-foreground">
        В регионе «{region}» пока нет региональных мер по этой ситуации.
        Попробуйте посмотреть{" "}
        <span className="font-semibold text-[#c9002f]">федеральные</span>.
      </p>
    );
  }

  return (
    <p className="mt-6 px-4 text-center text-sm text-muted-foreground">
      По выбранному фильтру мер не нашлось.
    </p>
  );
}

function RegionPicker({
  current,
  onChoose,
  onClose,
}: {
  current: string | null;
  onChoose: (r: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const list = q
    ? REGIONS.filter((r) => r.toLowerCase().includes(q))
    : REGIONS;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[80dvh] w-full max-w-[480px] flex-col rounded-t-3xl bg-white shadow-2xl sm:max-w-md sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 p-5 pb-3">
          <div>
            <h2 className="text-lg font-extrabold">Ваш регион</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Покажем меры поддержки именно вашего региона
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="-mr-1 inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-stone-100"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="px-5 pb-3">
          <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Найти регион…"
              className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <ul className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
          {list.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-muted-foreground">
              Ничего не найдено
            </li>
          ) : (
            list.map((r) => {
              const active = r === current;
              return (
                <li key={r}>
                  <button
                    type="button"
                    onClick={() => onChoose(r)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-stone-100",
                      active && "bg-[#c9002f]/5 font-semibold text-[#c9002f]",
                    )}
                  >
                    <span>{r}</span>
                    {active && <Check className="size-4 shrink-0" />}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}
