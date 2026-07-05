"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { RotateCcw, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { MeasureCard } from "@/components/measure-card";
import { saveSurveyAction } from "@/app/(app)/login/onboarding-actions";
import {
  matchMeasures,
  pluralMeasures,
  REGIONS,
  type SupportMeasure,
  type UserProfile,
} from "@/lib/measures";

/** Кнопка-выбор (используется для «Да/Нет» и вариантов). */
function Choice({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all",
        active
          ? "border-transparent bg-[#1B3A6B] text-white shadow-[0_4px_12px_-4px_rgba(27,58,107,0.45)]"
          : "border-black/[0.08] bg-white text-[#4a4f57] hover:bg-[#f4f5f7]",
      )}
    >
      {children}
    </button>
  );
}

/** Блок вопроса: подпись + варианты ответа. */
function Question({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-sm font-medium">{label}</p>
      <div className="mt-2 flex gap-2">{children}</div>
    </div>
  );
}

function YesNo({
  value,
  onChange,
}: {
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <>
      <Choice active={value === true} onClick={() => onChange(true)}>
        Да
      </Choice>
      <Choice active={value === false} onClick={() => onChange(false)}>
        Нет
      </Choice>
    </>
  );
}

export function PodborForm({ measures }: { measures: SupportMeasure[] }) {
  const [pregnant, setPregnant] = useState<boolean | null>(null);
  const [hasChildren, setHasChildren] = useState<boolean | null>(null);
  const [childrenCount, setChildrenCount] = useState<number | null>(null);
  const [youngestAge, setYoungestAge] = useState<number | null>(null);
  const [isCitizen, setIsCitizen] = useState<boolean | null>(null);
  const [region, setRegion] = useState("");
  const [lowIncome, setLowIncome] = useState<boolean | null>(null);
  const [mortgageIntent, setMortgageIntent] = useState<boolean | null>(null);
  const [singleParent, setSingleParent] = useState<boolean | null>(null);
  const [svoFamily, setSvoFamily] = useState<boolean | null>(null);
  const [student, setStudent] = useState<boolean | null>(null);
  const [disabledChild, setDisabledChild] = useState<boolean | null>(null);

  const [results, setResults] = useState<SupportMeasure[] | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (results) topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [results]);

  function handleSubmit() {
    const profile: UserProfile = {
      pregnant: pregnant ?? false,
      hasChildren: hasChildren ?? false,
      childrenCount: hasChildren ? (childrenCount ?? 1) : 0,
      youngestChildAgeYears: hasChildren ? youngestAge : null,
      region,
      lowIncome: lowIncome ?? false,
      disabledChild: disabledChild ?? false,
      mortgageIntent: mortgageIntent ?? false,
      svoFamily: svoFamily ?? false,
      singleParent: singleParent ?? false,
      student: student ?? false,
    };
    setResults(matchMeasures(profile, measures));
    // Сохраняем анкету в профиль (экшен сам проверит, залогинен ли пользователь;
    // при перезаполнении данные перезапишутся).
    void saveSurveyAction(profile as unknown as Record<string, unknown>);
  }

  function reset() {
    setResults(null);
  }

  // Экран результатов
  if (results) {
    return (
      <div ref={topRef} className="px-4 py-5">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="size-4" /> Изменить ответы
        </button>

        {results.length > 0 ? (
          <>
            <h1
              className="mt-3 text-[26px] font-normal leading-tight text-[#1A1A1A]"
              style={{ fontFamily: "var(--font-playfair), serif" }}
            >
              Вам может подойти
            </h1>
            <p className="mt-1 text-sm font-medium text-[#6b7078]">
              {pluralMeasures(results.length)}
            </p>
            <div className="mt-4 space-y-3">
              {results.map((m) => (
                <MeasureCard key={m.slug} measure={m} />
              ))}
            </div>
            <p className="mt-6 text-center text-xs text-muted-foreground">
              Это предварительный подбор. Точные условия уточняйте в официальных источниках.
            </p>
          </>
        ) : (
          <div className="py-10 text-center">
            <h1
              className="text-[24px] font-normal leading-tight text-[#1A1A1A]"
              style={{ fontFamily: "var(--font-playfair), serif" }}
            >
              Подходящих мер не нашлось
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              По вашим ответам мы пока не нашли мер в нашей базе. База постоянно пополняется —
              загляните в полный каталог.
            </p>
            <Link href="/catalog" className={cn(buttonVariants(), "mt-6 h-11 px-5")}>
              Открыть каталог
            </Link>
          </div>
        )}
      </div>
    );
  }

  // Экран анкеты
  return (
    <div ref={topRef} className="px-4 py-5">
      <h1
        className="text-[26px] font-normal leading-tight text-[#1A1A1A]"
        style={{ fontFamily: "var(--font-playfair), serif" }}
      >
        Подбор мер поддержки
      </h1>
      <p className="mt-1 text-sm text-[#6b7078]">
        Ответьте на несколько вопросов о семье. Мы ничего не сохраняем — подбор работает прямо
        на вашем устройстве.
      </p>

      <div className="mt-6 space-y-6">
        <Question label="Вы в ожидании ребёнка?">
          <YesNo value={pregnant} onChange={setPregnant} />
        </Question>

        <Question label="У вас есть дети?">
          <YesNo value={hasChildren} onChange={setHasChildren} />
        </Question>

        {hasChildren && (
          <>
            <Question label="Сколько у вас детей?">
              <Choice active={childrenCount === 1} onClick={() => setChildrenCount(1)}>
                1
              </Choice>
              <Choice active={childrenCount === 2} onClick={() => setChildrenCount(2)}>
                2
              </Choice>
              <Choice active={childrenCount === 3} onClick={() => setChildrenCount(3)}>
                3 и больше
              </Choice>
            </Question>

            <Question label="Возраст младшего ребёнка?">
              <Choice active={youngestAge === 0} onClick={() => setYoungestAge(0)}>
                до 1 года
              </Choice>
              <Choice active={youngestAge === 2} onClick={() => setYoungestAge(2)}>
                1–3 года
              </Choice>
              <Choice active={youngestAge === 5} onClick={() => setYoungestAge(5)}>
                старше 3 лет
              </Choice>
            </Question>
          </>
        )}

        <Question label="Вы гражданин РФ?">
          <YesNo
            value={isCitizen}
            onChange={(v) => {
              setIsCitizen(v);
              if (!v) setRegion("");
            }}
          />
        </Question>

        {isCitizen === true && (
          <div>
            <p className="text-sm font-medium">Ваш регион</p>
            <div className="relative mt-2">
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className={cn(
                  "w-full appearance-none rounded-xl border border-black/[0.08] bg-white py-2.5 pl-3 pr-8 text-sm shadow-sm focus:border-[#1B3A6B]/40 focus:outline-none",
                  region ? "font-medium text-[#2b2f36]" : "text-[#7a808a]",
                )}
              >
                <option value="">Не указывать</option>
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
        )}

        {isCitizen === false && (
          <p className="rounded-xl border border-dashed bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
            Большинство федеральных и региональных мер господдержки в РФ
            предоставляются гражданам России. Подбор покажет только меры,
            для которых гражданство РФ не требуется.
          </p>
        )}

        <Question label="Доход на человека ниже прожиточного минимума?">
          <YesNo value={lowIncome} onChange={setLowIncome} />
        </Question>

        <Question label="Планируете покупку жилья или ипотеку?">
          <YesNo value={mortgageIntent} onChange={setMortgageIntent} />
        </Question>

        <Question label="Вы единственный родитель (неполная семья)?">
          <YesNo value={singleParent} onChange={setSingleParent} />
        </Question>

        <Question label="Кто-то из членов семьи является участником СВО?">
          <YesNo value={svoFamily} onChange={setSvoFamily} />
        </Question>

        <Question label="Родители учатся очно (студенческая семья)?">
          <YesNo value={student} onChange={setStudent} />
        </Question>

        <Question label="В семье есть ребёнок-инвалид или человек с ОВЗ?">
          <YesNo value={disabledChild} onChange={setDisabledChild} />
        </Question>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        className={cn(buttonVariants(), "mt-8 h-12 w-full text-base")}
      >
        Показать подходящие меры
      </button>
    </div>
  );
}
