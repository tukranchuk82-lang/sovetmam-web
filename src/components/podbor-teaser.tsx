"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, LogIn, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  matchMeasures,
  pluralMeasures,
  REGIONS,
  type IncomePm,
  type SupportMeasure,
  type UserProfile,
} from "@/lib/measures";

/**
 * Короткий квиз без входа: 3 вопроса вместо полной анкеты из 7 экранов.
 * Точный список мер — только после авторизации (там его и сохраняем), здесь
 * лишь честная оценка «сколько вам может быть доступно», чтобы было ради чего
 * регистрироваться. Неотвеченные поля анкеты уходят как «не спрашивали» —
 * подбор в этом случае только теряет меры, но никогда не показывает лишних.
 */

type KidsAnswer = "pregnant" | 1 | 2 | 3 | 4;

const KIDS_OPTIONS: { value: KidsAnswer; label: string }[] = [
  { value: "pregnant", label: "Жду ребёнка" },
  { value: 1, label: "1 ребёнок" },
  { value: 2, label: "2 детей" },
  { value: 3, label: "3 детей" },
  { value: 4, label: "4 и более" },
];

const INCOME_OPTIONS: { value: IncomePm | null; label: string; hint: string }[] = [
  { value: 1, label: "Ниже прожиточного минимума", hint: "на человека в семье" },
  { value: 1.5, label: "От 1 до 1,5 прожиточных минимума", hint: "на человека" },
  { value: 2, label: "От 1,5 до 2 прожиточных минимумов", hint: "на человека" },
  { value: null, label: "Выше или не знаю", hint: "точную сумму спросим в анкете" },
];

function teaserProfile(
  kids: KidsAnswer,
  region: string,
  incomePm: IncomePm | null,
): UserProfile {
  const hasChildren = kids !== "pregnant";
  const childrenCount = hasChildren ? (kids as number) : 0;
  return {
    pregnant: kids === "pregnant",
    expectingChildNumber: null,
    hasChildren,
    childrenCount,
    childrenAges: [],
    youngestChildAgeYears: null,
    multipleBirthCount: 1,
    region,
    incomePm,
    lowIncome: incomePm === 1,
    disabledChild: false,
    specialNeedsChild: false,
    lossOfBreadwinner: false,
    mortgageIntent: false,
    svoFamily: false,
    singleParent: false,
    student: false,
    parentAge: null,
    spouseAge: null,
    parentUnder35: false,
    selfEmployed: false,
    entrepreneur: false,
    employed: null,
    taxSystem: null,
    hasEmployees: null,
    disabledParent: false,
    fosterParent: false,
    teacher: false,
  };
}

export function PodborTeaser({ measures }: { measures: SupportMeasure[] }) {
  const [kids, setKids] = useState<KidsAnswer | null>(null);
  const [region, setRegion] = useState("");
  const [incomeAnswered, setIncomeAnswered] = useState(false);
  const [incomePm, setIncomePm] = useState<IncomePm | null>(null);

  const done = kids != null && region !== "" && incomeAnswered;

  const count = useMemo(() => {
    if (!done) return 0;
    const profile = teaserProfile(kids!, region, incomePm);
    return matchMeasures(profile, measures).length;
  }, [done, kids, region, incomePm, measures]);

  if (done) {
    return (
      <div className="px-4 py-5 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-brand text-white shadow-[0_10px_24px_-8px_rgba(142,29,44,0.55)]">
          <Sparkles className="size-8" />
        </div>
        {count > 0 ? (
          <>
            <p
              className="mt-5 text-[40px] font-semibold leading-none text-[#1A1A1A]"
              style={{ fontFamily: "var(--font-playfair), serif" }}
            >
              {count}
            </p>
            <h1 className="mt-2 text-[20px] font-normal leading-tight text-[#1A1A1A]">
              {pluralMeasures(count)} может быть вам доступно
            </h1>
            <p className="mx-auto mt-2.5 max-w-[300px] text-sm leading-relaxed text-muted-foreground">
              Это только по трём вопросам — реальный список обычно длиннее.
              Точную подборку с суммами, сроками и инструкцией «как получить»
              покажем в личном кабинете.
            </p>
          </>
        ) : (
          <>
            <h1
              className="mt-5 text-[20px] font-normal leading-tight text-[#1A1A1A]"
              style={{ fontFamily: "var(--font-playfair), serif" }}
            >
              По этим ответам ничего не нашлось
            </h1>
            <p className="mx-auto mt-2.5 max-w-[300px] text-sm leading-relaxed text-muted-foreground">
              Мы спросили всего три вещи — полная анкета учитывает куда
              больше: доход, жильё, работу, участие в СВО. В личном кабинете
              она обычно находит меры даже там, где короткий квиз — нет.
            </p>
          </>
        )}
        <Link
          href="/login?next=/podbor"
          className={cn(buttonVariants(), "mt-6 h-11 w-full max-w-[300px] gap-2")}
        >
          <LogIn className="size-4" />
          Войти и увидеть список
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 py-5">
      <h1
        className="text-[22px] font-normal leading-tight text-[#1A1A1A]"
        style={{ fontFamily: "var(--font-playfair), serif" }}
      >
        Быстрый квиз
      </h1>
      <p className="mt-1 text-sm text-[#6b7078]">
        Три вопроса — и мы прикинем, сколько мер поддержки вам может быть
        доступно. Точный список — после входа.
      </p>

      <div className="mt-6">
        <p className="text-sm font-medium">Дети</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {KIDS_OPTIONS.map((o) => (
            <button
              key={String(o.value)}
              type="button"
              onClick={() => setKids(o.value)}
              className={cn(
                "rounded-xl border px-3 py-2.5 text-sm font-medium transition-all",
                kids === o.value
                  ? "border-transparent bg-[#1B3A6B] text-white shadow-[0_4px_12px_-4px_rgba(27,58,107,0.45)]"
                  : "border-black/[0.08] bg-white text-[#4a4f57] hover:bg-[#f4f5f7]",
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <p className="text-sm font-medium">Регион</p>
        <div className="relative mt-2">
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className={cn(
              "w-full appearance-none rounded-xl border bg-white py-2.5 pl-3 pr-8 text-sm shadow-sm focus:border-[#1B3A6B]/40 focus:outline-none",
              region
                ? "border-black/[0.08] font-medium text-[#2b2f36]"
                : "border-black/[0.08] text-[#7a808a]",
            )}
          >
            <option value="">Выберите регион</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden
            className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-[#9aa0a8]"
          />
        </div>
      </div>

      <div className="mt-6">
        <p className="text-sm font-medium">Доход на человека в семье</p>
        <div className="mt-2 space-y-2">
          {INCOME_OPTIONS.map((o) => (
            <button
              key={String(o.value)}
              type="button"
              onClick={() => {
                setIncomePm(o.value);
                setIncomeAnswered(true);
              }}
              className={cn(
                "block w-full rounded-xl border px-3.5 py-2.5 text-left transition-all",
                incomeAnswered && incomePm === o.value
                  ? "border-transparent bg-[#1B3A6B] text-white shadow-[0_4px_12px_-4px_rgba(27,58,107,0.45)]"
                  : "border-black/[0.08] bg-white hover:bg-[#f4f5f7]",
              )}
            >
              <span className="block text-sm font-medium">{o.label}</span>
              <span
                className={cn(
                  "block text-xs",
                  incomeAnswered && incomePm === o.value
                    ? "text-white/75"
                    : "text-muted-foreground",
                )}
              >
                {o.hint}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
