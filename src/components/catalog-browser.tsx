"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Search,
  X,
  ChevronDown,
  ChevronRight,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { MeasureCard } from "@/components/measure-card";
import { pluralMeasures } from "@/lib/measures";
import { cn } from "@/lib/utils";

// Облегчённая мера — только то, что нужно фильтру и карточке.
export type SlimMeasure = {
  slug: string;
  title: string;
  shortDescription: string;
  category: string;
  amount: string | null;
  level: "federal" | "regional";
  region: string | null;
};

const LEVELS = [
  { value: "", label: "Все" },
  { value: "federal", label: "Федеральные" },
  { value: "regional", label: "Региональные" },
] as const;

const PAGE = 10; // сколько карточек показываем за раз

const chipCls = (active: boolean) =>
  cn(
    "flex-1 rounded-full px-3 py-1.5 text-sm font-medium transition-all",
    active
      ? "bg-[#1B3A6B] text-white shadow-[0_4px_12px_-4px_rgba(27,58,107,0.45)]"
      : "border border-black/[0.08] bg-white text-[#4a4f57] hover:bg-[#f4f5f7]",
  );

function FilterSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={cn(
          "w-full appearance-none rounded-xl border border-black/[0.08] bg-white py-2.5 pl-3 pr-8 text-sm shadow-sm transition-colors focus:border-[#8E1D2C]/40 focus:outline-none disabled:opacity-45",
          value ? "font-medium text-[#2b2f36]" : "text-[#7a808a]",
        )}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-[#9aa0a8]"
      />
    </div>
  );
}

export function CatalogBrowser({
  measures,
  categories,
  regions,
}: {
  measures: SlimMeasure[];
  categories: readonly string[];
  regions: readonly string[];
}) {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("");
  const [region, setRegion] = useState("");
  const [category, setCategory] = useState("");
  const [visible, setVisible] = useState(PAGE);

  // Ширину плашки равняем по длине строки «меры под вашу жизненную» —
  // измеряем её тем же шрифтом скрытым элементом.
  const measureRef = useRef<HTMLSpanElement>(null);
  const [plaqueW, setPlaqueW] = useState<number | undefined>(undefined);
  useEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const update = () => setPlaqueW(el.offsetWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Любая смена фильтра — снова показываем с начала.
  useEffect(() => {
    setVisible(PAGE);
  }, [query, level, region, category]);

  const filtered = useMemo(() => {
    // Ищем ПО СЛОВАМ, а не по фразе целиком: запрос «Питание для многодетных
    // Татарстан» не встречается подряд ни в одном заголовке, и поиск подстрокой
    // не находил ничего. Теперь мера подходит, если в ней есть каждое слово
    // запроса — где угодно: в названии, описании, регионе или категории.
    // Слова короче 3 букв («на», «до», «и») пропускаем: они есть везде и только
    // мешают. Ё/е не различаем — люди набирают и так, и так.
    const norm = (s: string) => s.toLowerCase().replace(/ё/g, "е");
    const words = norm(query)
      .split(/[^a-zа-я0-9]+/i)
      .filter((w) => w.length >= 3);

    return measures.filter((m) => {
      if (level && m.level !== level) return false;
      if (region && m.region !== region) return false;
      if (category && m.category !== category) return false;
      if (words.length) {
        const haystack = norm(
          [m.title, m.shortDescription, m.region ?? "", m.category].join(" "),
        );
        if (!words.every((w) => haystack.includes(w))) return false;
      }
      return true;
    });
  }, [measures, query, level, region, category]);

  const shown = filtered.slice(0, visible);

  function selectLevel(v: string) {
    setLevel(v);
    if (v === "federal") setRegion(""); // у федеральных региона нет
  }
  function selectRegion(v: string) {
    setRegion(v);
    if (v && level === "federal") setLevel("regional"); // регион => региональная
  }

  return (
    <div className="pb-8">
      {/* ГЕРОЙ раздела: планета (ночная Земля) справа, заголовок и описание
          слева. Шапка приложения плавает поверх (прозрачная в этом разделе). */}
      <section
        className="relative overflow-hidden px-4 pb-5"
        style={{
          paddingTop: "calc(var(--hdr-h, 76px) + 12px)",
          // бархатистый светло-серый вверху (за планетой), к низу уводим в
          // цвет Главного раздела — ниже планеты фон однотонный
          background:
            "linear-gradient(180deg, #ECEEF1 0%, #E4E6EB 42%, var(--background) 80%)",
        }}
      >
        {/* мягкое navy-свечение, «сажающее» планету на фон */}
        <div
          aria-hidden
          className="pointer-events-none absolute right-[-100px] h-[440px] w-[440px] rounded-full"
          style={{
            top: "calc(var(--hdr-h, 76px) - 40px)",
            background:
              "radial-gradient(closest-side, rgba(140,165,210,0.20), rgba(140,165,210,0))",
          }}
        />
        {/* планета — крупная, ~1/3 уходит за правый край экрана */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/planet-hero.webp"
          alt=""
          aria-hidden
          className="pointer-events-none absolute right-[-140px] w-[387px] max-w-none"
          style={{ top: "calc(var(--hdr-h, 76px) + 28px)" }}
        />
        <div className="relative z-10">
          <h1
            className="inline-block whitespace-nowrap text-[26px] font-semibold leading-[1.1] tracking-[-0.01em] text-[#16325C]"
            style={{
              fontFamily: "var(--font-playfair), serif",
              textShadow: "0 1px 0 rgba(255,255,255,0.5)",
            }}
          >
            Каталог мер поддержки
          </h1>
          <p
            className="mt-2.5 max-w-[58%] text-sm leading-relaxed text-[#334966]"
            style={{
              textShadow:
                "0 1px 2px rgba(255,255,255,0.95), 0 0 8px rgba(255,255,255,0.8)",
            }}
          >
            Все меры поддержки в одном месте. Найдите нужную, воспользовавшись
            фильтром, или{" "}
            <Link
              href="/podbor"
              className="font-semibold text-[#8E1D2C] underline-offset-2 hover:underline"
            >
              заполните анкету
            </Link>
            , и мы подберём меры под вашу жизненную ситуацию.
          </p>

          {/* скрытый эталон ширины — строка из описания */}
          <span
            ref={measureRef}
            aria-hidden
            className="pointer-events-none invisible absolute whitespace-nowrap text-sm"
          >
            меры под вашу жизненную
          </span>

          {/* CTA под пояснением — переход к анкете индивидуального подбора */}
          <Link
            href="/podbor"
            className="mt-4 inline-flex items-center gap-2 rounded-[10px] px-4 py-3 text-left text-sm font-semibold leading-tight text-white shadow-[0_10px_22px_-14px_rgba(30,32,40,0.4)] transition-transform active:scale-[0.98]"
            style={{
              width: plaqueW,
              background:
                "linear-gradient(135deg, #A32334 0%, #8E1D2C 55%, #74111F 100%)",
            }}
          >
            <Sparkles className="size-4 shrink-0" />
            <span>Индивидуальный подбор мер поддержки</span>
          </Link>
        </div>
      </section>

      {/* ТЕЛО раздела: сплошной фон Главного раздела (var(--background)) */}
      <div className="px-4 pt-4">
        {/* Поиск — отдельный блок уже на белом фоне */}
        <div className="relative">
          <Search
            aria-hidden
            className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#1B3A6B]"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по названию меры поддержки…"
            className="w-full rounded-2xl border-[1.5px] border-[#1B3A6B]/25 bg-white py-4 pl-12 pr-11 text-[15px] font-medium shadow-[0_16px_36px_-14px_rgba(27,58,107,0.55)] transition-all placeholder:font-normal placeholder:text-[#9aa0a8] focus:border-[#1B3A6B]/60 focus:shadow-[0_18px_40px_-14px_rgba(27,58,107,0.6)] focus:ring-4 focus:ring-[#1B3A6B]/10 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              aria-label="Очистить"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-[#9aa0a8] transition-colors hover:bg-black/5 hover:text-[#5b616b]"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      {/* ФИЛЬТР — отдельная тонированная панель (визуально отделён от поиска) */}
      <div className="mt-4 rounded-2xl border border-black/[0.08] bg-[#E9EAEC] p-3.5">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#5b6473]">
            <SlidersHorizontal className="size-3.5" /> Фильтр
          </span>
          {(level || region || category) && (
            <button
              type="button"
              onClick={() => {
                setLevel("");
                setRegion("");
                setCategory("");
              }}
              className="text-xs font-semibold text-[#8E1D2C] hover:underline"
            >
              Сбросить
            </button>
          )}
        </div>

        <div className="mt-3 flex gap-2">
          {LEVELS.map((l) => (
            <button
              key={l.value}
              type="button"
              onClick={() => selectLevel(l.value)}
              className={chipCls(level === l.value)}
            >
              {l.label}
            </button>
          ))}
        </div>

        <div className="mt-2.5 grid grid-cols-2 gap-2">
          <FilterSelect
            value={region}
            onChange={selectRegion}
            options={regions}
            placeholder="Все регионы"
            disabled={level === "federal"}
          />
          <FilterSelect
            value={category}
            onChange={setCategory}
            options={categories}
            placeholder="Все категории"
          />
        </div>
      </div>

      {/* Счётчик */}
      <p className="mt-4 text-sm font-medium text-[#6b7078]">
        Найдено: {pluralMeasures(filtered.length)}
      </p>

      {/* Список */}
      <div className="mt-3 space-y-3">
        {shown.map((m) => (
          <MeasureCard key={m.slug} measure={m} />
        ))}
      </div>

      {filtered.length > visible && (
        <button
          type="button"
          onClick={() => setVisible((v) => v + PAGE)}
          className="mt-4 w-full rounded-xl border border-black/[0.08] bg-white py-3 text-sm font-semibold text-[#3a3f47] shadow-sm transition-colors hover:bg-[#f4f5f7]"
        >
          Показать ещё ({filtered.length - visible})
        </button>
      )}

      {/* Бордовый баннер — приглашение к индивидуальному подбору */}
      {filtered.length > 0 && (
        <Link
          href="/podbor"
          className="group mt-5 block overflow-hidden rounded-xl p-5 text-white shadow-[0_18px_34px_-16px_rgba(116,17,31,0.6)] ring-1 ring-white/10 transition-transform active:scale-[0.99]"
          style={{
            background:
              "linear-gradient(135deg, #A32334 0%, #8E1D2C 55%, #74111F 100%)",
          }}
        >
          <div className="flex items-center gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-white/[0.12] ring-1 ring-white/20">
              <Sparkles className="size-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p
                className="text-[16px] leading-snug"
                style={{ fontFamily: "var(--font-playfair), serif" }}
              >
                Не нашли нужную меру?
              </p>
              <p className="mt-1 text-[13px] leading-snug text-white/80">
                Заполните короткую анкету — и мы подберём меры под вашу
                жизненную ситуацию.
              </p>
            </div>
            <ChevronRight className="size-5 shrink-0 text-white/70 transition-transform group-hover:translate-x-0.5" />
          </div>
        </Link>
      )}

      {filtered.length === 0 && (
        <div className="mt-8 flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/empty-search.svg"
            alt=""
            aria-hidden
            className="w-44"
          />
          <p className="mt-3 font-semibold text-[#1A1A1A]">Ничего не нашлось</p>
          <p className="mt-1 max-w-[260px] text-sm text-[#6b7078]">
            Попробуйте изменить запрос или сбросить фильтры.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setLevel("");
              setRegion("");
              setCategory("");
            }}
            className="mt-4 rounded-xl bg-[#1B3A6B] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#16305a]"
          >
            Сбросить фильтры
          </button>

          {/* Поиск не нашёл — предлагаем подбор: человек искал не название меры,
              а ответ на вопрос «что мне положено». */}
          <Link
            href="/podbor"
            className="mt-5 flex w-full max-w-[340px] items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-white"
            style={{
              background:
                "linear-gradient(135deg, #274A7E 0%, #172A4B 58%, #101D38 100%)",
              boxShadow: "0 14px 28px -12px rgba(23,42,75,0.55)",
            }}
          >
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-white/15">
              <Sparkles className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold leading-tight">
                Не нашли нужное? Подберём меры
              </span>
              <span className="mt-0.5 block text-[12px] leading-snug text-white/85">
                Ответьте на вопросы — покажем, что положено вашей семье
              </span>
            </span>
            <ChevronRight className="size-5 shrink-0 text-white/60" />
          </Link>
        </div>
      )}
      </div>
    </div>
  );
}
