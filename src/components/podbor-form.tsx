"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { RotateCcw, ChevronDown, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { MeasureCard } from "@/components/measure-card";
import { saveSurveyAction } from "@/app/(app)/login/onboarding-actions";
import {
  matchMeasures,
  pluralMeasures,
  REGIONS,
  type IncomePm,
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

/**
 * Доход из сохранённой анкеты. Анкеты, заполненные до появления шкалы, знают
 * только булев lowIncome: «да» означало «ниже ПМ», то есть группу «до 1 ПМ».
 * «Нет» не говорит ничего о кратности (1,5 или 2 ПМ) — оставляем null, пока
 * пользователь не переответит.
 */
function toIncomePm(v: Partial<UserProfile>): IncomePm | null {
  if (v.incomePm === 1 || v.incomePm === 1.5 || v.incomePm === 2) return v.incomePm;
  return v.lowIncome ? 1 : null;
}

// Нормализует сохранённую анкету (jsonb из профиля) в полный UserProfile.
function toProfile(v: Partial<UserProfile>): UserProfile {
  const incomePm = toIncomePm(v);
  return {
    pregnant: !!v.pregnant,
    hasChildren: !!v.hasChildren,
    childrenCount: Number(v.childrenCount) || 0,
    youngestChildAgeYears:
      v.youngestChildAgeYears == null ? null : Number(v.youngestChildAgeYears),
    region: String(v.region ?? ""),
    incomePm,
    lowIncome: incomePm === 1,
    disabledChild: !!v.disabledChild,
    mortgageIntent: !!v.mortgageIntent,
    svoFamily: !!v.svoFamily,
    singleParent: !!v.singleParent,
    student: !!v.student,
    parentUnder35: !!v.parentUnder35,
    selfEmployed: !!v.selfEmployed,
    entrepreneur: !!v.entrepreneur,
    disabledParent: !!v.disabledParent,
    fosterParent: !!v.fosterParent,
  };
}

export function PodborForm({
  measures,
  savedSurvey,
}: {
  measures: SupportMeasure[];
  savedSurvey?: Record<string, unknown> | null;
}) {
  // Прошлые ответы из профиля (если анкета уже заполнялась) — восстанавливаем
  // и форму, и результат, чтобы подбор не слетал при возврате к странице.
  const saved = (savedSurvey ?? null) as Partial<UserProfile> | null;
  const hasSaved = !!saved && typeof saved.hasChildren === "boolean";

  const [pregnant, setPregnant] = useState<boolean | null>(saved?.pregnant ?? null);
  const [hasChildren, setHasChildren] = useState<boolean | null>(saved?.hasChildren ?? null);
  const [childrenCount, setChildrenCount] = useState<number | null>(saved?.childrenCount ?? null);
  const [youngestAge, setYoungestAge] = useState<number | null>(saved?.youngestChildAgeYears ?? null);
  const [isCitizen, setIsCitizen] = useState<boolean | null>(saved ? (saved.region ? true : null) : null);
  const [region, setRegion] = useState(saved?.region ?? "");
  // «Выше 2 ПМ» — это не отсутствие ответа, поэтому шкала хранит отдельный
  // флаг «ответил» (incomeAnswered) рядом со значением (null = выше 2 ПМ).
  const [incomePm, setIncomePm] = useState<IncomePm | null>(saved ? toIncomePm(saved) : null);
  const [incomeAnswered, setIncomeAnswered] = useState(
    saved ? saved.incomePm !== undefined || !!saved.lowIncome : false,
  );
  const [mortgageIntent, setMortgageIntent] = useState<boolean | null>(saved?.mortgageIntent ?? null);
  const [singleParent, setSingleParent] = useState<boolean | null>(saved?.singleParent ?? null);
  const [svoFamily, setSvoFamily] = useState<boolean | null>(saved?.svoFamily ?? null);
  const [student, setStudent] = useState<boolean | null>(saved?.student ?? null);
  const [disabledChild, setDisabledChild] = useState<boolean | null>(saved?.disabledChild ?? null);
  const [parentUnder35, setParentUnder35] = useState<boolean | null>(saved?.parentUnder35 ?? null);
  const [selfEmployed, setSelfEmployed] = useState<boolean | null>(saved?.selfEmployed ?? null);
  const [entrepreneur, setEntrepreneur] = useState<boolean | null>(saved?.entrepreneur ?? null);
  const [disabledParent, setDisabledParent] = useState<boolean | null>(saved?.disabledParent ?? null);
  const [fosterParent, setFosterParent] = useState<boolean | null>(saved?.fosterParent ?? null);

  // Если анкета уже была заполнена — сразу показываем сохранённый подбор.
  const [results, setResults] = useState<SupportMeasure[] | null>(() =>
    hasSaved ? matchMeasures(toProfile(saved!), measures) : null,
  );
  const submitted = useRef(false);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Прокручиваем наверх только после отправки анкеты пользователем,
    // а не при первичном показе сохранённого результата.
    if (results && submitted.current) {
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [results]);

  function handleSubmit() {
    const profile: UserProfile = {
      pregnant: pregnant ?? false,
      hasChildren: hasChildren ?? false,
      childrenCount: hasChildren ? (childrenCount ?? 1) : 0,
      youngestChildAgeYears: hasChildren ? youngestAge : null,
      region,
      incomePm,
      // Выводим из шкалы, а не спрашиваем отдельно: 46 мер размечены
      // requiresLowIncome, и «ниже ПМ» — это ровно группа «до 1 ПМ».
      lowIncome: incomePm === 1,
      disabledChild: disabledChild ?? false,
      mortgageIntent: mortgageIntent ?? false,
      svoFamily: svoFamily ?? false,
      singleParent: singleParent ?? false,
      student: student ?? false,
      parentUnder35: parentUnder35 ?? false,
      selfEmployed: selfEmployed ?? false,
      entrepreneur: entrepreneur ?? false,
      disabledParent: disabledParent ?? false,
      fosterParent: fosterParent ?? false,
    };
    submitted.current = true;
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
            {/* Кнопка «Посмотреть все меры» — до списка, чтобы не листать вниз. */}
            <Link
              href="/catalog"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "mt-4 h-11 w-full gap-2 border-[#1B3A6B]/25 text-[#1B3A6B]",
              )}
            >
              <LayoutGrid className="size-4" /> Посмотреть все меры
            </Link>
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
        Ответьте на несколько вопросов о семье. Мы сохраним ваш подбор — сможете
        вернуться к нему в любой момент.
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

            <div>
              <p className="text-sm font-medium">Возраст младшего ребёнка?</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Choice active={youngestAge === 0} onClick={() => setYoungestAge(0)}>
                  до 1 года
                </Choice>
                <Choice active={youngestAge === 2} onClick={() => setYoungestAge(2)}>
                  1–3 года
                </Choice>
                <Choice active={youngestAge === 6} onClick={() => setYoungestAge(6)}>
                  3–7 лет
                </Choice>
                <Choice active={youngestAge === 8} onClick={() => setYoungestAge(8)}>
                  старше 7 лет
                </Choice>
              </div>
            </div>
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

        {/* Доход — шкала, а не да/нет: меры задают потолок «до 1 / 1,5 / 2 ПМ»,
            и мера с потолком 2 ПМ должна показываться и тем, у кого доход
            ниже 1 ПМ. Выбранное значение — верхняя граница группы. */}
        <div>
          <p className="text-sm font-medium">
            Доход на человека в семье (в прожиточных минимумах)
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Choice
              active={incomeAnswered && incomePm === 1}
              onClick={() => {
                setIncomePm(1);
                setIncomeAnswered(true);
              }}
            >
              до 1 ПМ
            </Choice>
            <Choice
              active={incomeAnswered && incomePm === 1.5}
              onClick={() => {
                setIncomePm(1.5);
                setIncomeAnswered(true);
              }}
            >
              от 1 до 1,5 ПМ
            </Choice>
            <Choice
              active={incomeAnswered && incomePm === 2}
              onClick={() => {
                setIncomePm(2);
                setIncomeAnswered(true);
              }}
            >
              от 1,5 до 2 ПМ
            </Choice>
            <Choice
              active={incomeAnswered && incomePm === null}
              onClick={() => {
                setIncomePm(null);
                setIncomeAnswered(true);
              }}
            >
              выше 2 ПМ
            </Choice>
          </div>
        </div>

        <Question label="Возраст родителей">
          <Choice active={parentUnder35 === true} onClick={() => setParentUnder35(true)}>
            до 35 лет
          </Choice>
          <Choice active={parentUnder35 === false} onClick={() => setParentUnder35(false)}>
            35 лет и старше
          </Choice>
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

        <Question label="Кто-то из родителей имеет инвалидность?">
          <YesNo value={disabledParent} onChange={setDisabledParent} />
        </Question>

        <Question label="Вы приёмный родитель, опекун или усыновитель?">
          <YesNo value={fosterParent} onChange={setFosterParent} />
        </Question>

        <Question label="Вы самозанятый?">
          <YesNo value={selfEmployed} onChange={setSelfEmployed} />
        </Question>

        <Question label="Вы индивидуальный предприниматель?">
          <YesNo value={entrepreneur} onChange={setEntrepreneur} />
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
