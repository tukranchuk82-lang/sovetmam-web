"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  RotateCcw,
  ChevronDown,
  LayoutGrid,
  MessageCircle,
  FileEdit,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { SegmentMeasures } from "@/components/segment-measures";
import { saveSurveyAction } from "@/app/(app)/login/onboarding-actions";
import {
  matchMeasures,
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
/**
 * Две плашки под подборкой: обращение в свободной форме и уточнение по мере.
 * Оба ведут в общую форму обращений — и попадают в один раздел админки.
 */
function InquiryLinks() {
  return (
    <div className="mt-5 grid grid-cols-2 gap-2.5">
      <Link
        href="/profile/inquiries/new?type=question"
        className="flex flex-col rounded-2xl border border-black/[0.07] bg-white p-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
      >
        <MessageCircle className="size-5 text-brand" />
        <span className="mt-2 text-[13px] font-semibold leading-snug">
          Появились вопросы? Напишите нам
        </span>
      </Link>
      <Link
        href="/profile/inquiries/new?type=clarification"
        className="flex flex-col rounded-2xl border border-black/[0.07] bg-white p-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
      >
        <FileEdit className="size-5 text-brand" />
        <span className="mt-2 text-[13px] font-semibold leading-snug">
          Сообщить уточнения по мерам поддержки
        </span>
      </Link>
    </div>
  );
}

/** Выпадающий список возраста ребёнка: 0…18, где 18 — «18 и старше». */
function AgeSelect({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <div className="relative mt-1">
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        className={cn(
          "w-full appearance-none rounded-xl border border-black/[0.08] bg-white py-2.5 pl-3 pr-8 text-sm shadow-sm focus:border-[#1B3A6B]/40 focus:outline-none",
          value != null ? "font-medium text-[#2b2f36]" : "text-[#7a808a]",
        )}
      >
        <option value="">Возраст</option>
        {AGE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
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

// Очерёдность ожидаемого ребёнка. 10 означает «10 и более» — дальше дробить
// незачем, мер, привязанных к конкретному числу выше десяти, не бывает.
const EXPECTING_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  { value: 4, label: "4" },
  { value: 5, label: "5" },
  { value: 6, label: "6" },
  { value: 7, label: "7" },
  { value: 8, label: "8" },
  { value: 9, label: "9" },
  { value: 10, label: "10 и более" },
];

// Больше 20 детей вводить незачем: ни одна мера не различает 20 и 25 детей,
// а поле «сколько именно» должно оставаться защищённым от случайного ввода.
const MAX_CHILDREN = 20;

// «Сколько у вас детей»: 1…9 и «10 и более» (10 — маркер, точное число потом
// спрашиваем отдельным полем).
const MANY_CHILDREN = 10;
const COUNT_OPTIONS: { value: number; label: string }[] = [
  ...Array.from({ length: 9 }, (_, i) => ({ value: i + 1, label: String(i + 1) })),
  { value: MANY_CHILDREN, label: "10 и более" },
];

// Возраст ребёнка: 0…18, где 18 — «18 и старше».
const AGE_OPTIONS: { value: number; label: string }[] = Array.from(
  { length: 19 },
  (_, i) => ({ value: i, label: i === 18 ? "18 и старше" : String(i) }),
);

// Нормализует сохранённую анкету (jsonb из профиля) в полный UserProfile.
function toProfile(v: Partial<UserProfile>): UserProfile {
  const incomePm = toIncomePm(v);
  const expecting = Number(v.expectingChildNumber);
  const ages = Array.isArray(v.childrenAges) ? v.childrenAges.map(Number) : [];
  const youngest =
    v.youngestChildAgeYears != null
      ? Number(v.youngestChildAgeYears)
      : ages.length
        ? Math.min(...ages)
        : null;
  return {
    pregnant: !!v.pregnant,
    expectingChildNumber:
      v.pregnant && expecting >= 1 && expecting <= 10 ? expecting : null,
    hasChildren: !!v.hasChildren,
    childrenCount: Number(v.childrenCount) || 0,
    childrenAges: ages,
    youngestChildAgeYears: youngest,
    region: String(v.region ?? ""),
    incomePm,
    lowIncome: incomePm === 1,
    disabledChild: !!v.disabledChild,
    specialNeedsChild: !!v.specialNeedsChild,
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
  const [expectingNumber, setExpectingNumber] = useState<number | null>(
    saved?.expectingChildNumber ?? null,
  );
  const [hasChildren, setHasChildren] = useState<boolean | null>(saved?.hasChildren ?? null);
  // Выбор в плитках «Сколько у вас детей»: 1…9 либо MANY_CHILDREN («10 и более»).
  // Сохранённое число 10+ разворачиваем обратно в «10 и более» + точное поле.
  const savedCount = saved?.childrenCount ?? null;
  const [childrenCount, setChildrenCount] = useState<number | null>(
    savedCount == null ? null : savedCount >= MANY_CHILDREN ? MANY_CHILDREN : savedCount,
  );
  const [exactCount, setExactCount] = useState<string>(
    savedCount != null && savedCount >= MANY_CHILDREN ? String(savedCount) : "",
  );
  const [childrenAges, setChildrenAges] = useState<(number | null)[]>(
    Array.isArray(saved?.childrenAges) ? saved.childrenAges.map(Number) : [],
  );
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
  const [specialNeedsChild, setSpecialNeedsChild] = useState<boolean | null>(
    saved?.specialNeedsChild ?? null,
  );
  const [parentUnder35, setParentUnder35] = useState<boolean | null>(saved?.parentUnder35 ?? null);
  const [selfEmployed, setSelfEmployed] = useState<boolean | null>(saved?.selfEmployed ?? null);
  const [entrepreneur, setEntrepreneur] = useState<boolean | null>(saved?.entrepreneur ?? null);
  const [disabledParent, setDisabledParent] = useState<boolean | null>(saved?.disabledParent ?? null);
  const [fosterParent, setFosterParent] = useState<boolean | null>(saved?.fosterParent ?? null);

  // Сколько окошек возраста показывать. При «10 и более» число берётся из
  // отдельного поля; пока оно пустое или больше 20 — окошек нет.
  const exactNum = exactCount.trim() === "" ? null : Number(exactCount);
  const tooManyChildren = exactNum != null && exactNum > MAX_CHILDREN;
  const childCount =
    childrenCount == null
      ? 0
      : childrenCount < MANY_CHILDREN
        ? childrenCount
        : exactNum != null && exactNum >= 1 && exactNum <= MAX_CHILDREN
          ? exactNum
          : 0;

  // Длина списка возрастов идёт за числом детей: добавили ребёнка — появилось
  // пустое окошко, убавили — лишние отброшены (ответы оставшихся сохраняются).
  useEffect(() => {
    setChildrenAges((prev) => {
      if (prev.length === childCount) return prev;
      const next = prev.slice(0, childCount);
      while (next.length < childCount) next.push(null);
      return next;
    });
  }, [childCount]);

  // Движок подбора смотрит на возраст младшего — выводим его из ответов.
  const filledAges = childrenAges.filter((a): a is number => a != null);
  const youngestAge = filledAges.length ? Math.min(...filledAges) : null;

  function setAgeAt(i: number, value: number | null) {
    setChildrenAges((prev) => prev.map((a, idx) => (idx === i ? value : a)));
  }

  // Если анкета уже была заполнена — сразу показываем сохранённый подбор.
  const [results, setResults] = useState<SupportMeasure[] | null>(() =>
    // ignoreRegion: региональные меры не отсекаем по региону из анкеты — этим
    // занимается сам список (там регион переключается, и его можно указать,
    // если в анкете не указывали).
    hasSaved
      ? matchMeasures(toProfile(saved!), measures, { ignoreRegion: true })
      : null,
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
      expectingChildNumber: pregnant ? expectingNumber : null,
      hasChildren: hasChildren ?? false,
      childrenCount: hasChildren ? (childCount || 1) : 0,
      childrenAges: hasChildren ? filledAges : [],
      youngestChildAgeYears: hasChildren ? youngestAge : null,
      region,
      incomePm,
      // Выводим из шкалы, а не спрашиваем отдельно: 46 мер размечены
      // requiresLowIncome, и «ниже ПМ» — это ровно группа «до 1 ПМ».
      lowIncome: incomePm === 1,
      disabledChild: disabledChild ?? false,
      specialNeedsChild: specialNeedsChild ?? false,
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
    setResults(matchMeasures(profile, measures, { ignoreRegion: true }));
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

            {/* Тот же список, что и в разделах каталога: фильтр «Все /
                Федеральные / Региональные», выбор региона (если в анкете его не
                указали — можно указать прямо здесь) и выдача по 10 штук. */}
            <SegmentMeasures
              measures={results}
              initialRegion={region || null}
              footer={<InquiryLinks />}
            />
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
          <YesNo
            value={pregnant}
            onChange={(v) => {
              setPregnant(v);
              // Ответили «нет» — очерёдность теряет смысл, сбрасываем её,
              // иначе в профиль уедет ответ от прошлого «да».
              if (!v) setExpectingNumber(null);
            }}
          />
        </Question>

        {pregnant && (
          <div>
            <p className="text-sm font-medium">Какого по счёту ребёнка ожидаете?</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {EXPECTING_OPTIONS.map((o) => (
                <Choice
                  key={o.value}
                  active={expectingNumber === o.value}
                  onClick={() => setExpectingNumber(o.value)}
                >
                  {o.label}
                </Choice>
              ))}
            </div>
          </div>
        )}

        <Question label="У вас есть дети?">
          <YesNo value={hasChildren} onChange={setHasChildren} />
        </Question>

        {hasChildren && (
          <>
            <div>
              <p className="text-sm font-medium">Сколько у вас детей?</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {COUNT_OPTIONS.map((o) => (
                  <Choice
                    key={o.value}
                    active={childrenCount === o.value}
                    onClick={() => {
                      setChildrenCount(o.value);
                      // Ушли с «10 и более» — точное число больше не нужно.
                      if (o.value !== MANY_CHILDREN) setExactCount("");
                    }}
                  >
                    {o.label}
                  </Choice>
                ))}
              </div>
            </div>

            {childrenCount === MANY_CHILDREN && (
              <div>
                <p className="text-sm font-medium">Укажите точное число детей</p>
                <input
                  type="number"
                  inputMode="numeric"
                  min={MANY_CHILDREN}
                  max={MAX_CHILDREN}
                  value={exactCount}
                  onChange={(e) => setExactCount(e.target.value)}
                  placeholder="например, 11"
                  aria-invalid={tooManyChildren}
                  className={cn(
                    "mt-2 w-full rounded-xl border bg-white py-2.5 pl-3 pr-3 text-sm shadow-sm focus:outline-none",
                    tooManyChildren
                      ? "border-red-500 text-red-700 focus:border-red-600"
                      : "border-black/[0.08] focus:border-[#1B3A6B]/40",
                  )}
                />
                {tooManyChildren && (
                  <p role="alert" className="mt-2 text-sm font-medium text-red-600">
                    Максимальное число для ввода — 20. Если детей больше, впишите
                    20. Подбор мер от этого не изменится.
                  </p>
                )}
              </div>
            )}

            {childCount === 1 && (
              <div>
                <p className="text-sm font-medium">Укажите возраст ребёнка</p>
                <div className="mt-2">
                  <AgeSelect
                    value={childrenAges[0] ?? null}
                    onChange={(v) => setAgeAt(0, v)}
                  />
                </div>
              </div>
            )}

            {childCount > 1 && (
              <div>
                <p className="text-sm font-medium">Укажите возраст каждого ребёнка</p>
                <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2.5">
                  {childrenAges.map((age, i) => (
                    <label key={i} className="block">
                      <span className="text-xs text-muted-foreground">
                        {i + 1}-й ребёнок
                      </span>
                      <AgeSelect value={age} onChange={(v) => setAgeAt(i, v)} />
                    </label>
                  ))}
                </div>
              </div>
            )}
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

        <Question label="В семье есть ребёнок-инвалид?">
          <YesNo value={disabledChild} onChange={setDisabledChild} />
        </Question>

        <div>
          <p className="text-sm font-medium">
            В семье есть ребёнок с ОВЗ (ограниченными возможностями здоровья)?
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Статус ОВЗ даёт психолого-медико-педагогическая комиссия. Инвалидности
            при этом может не быть.
          </p>
          <div className="mt-2 flex gap-2">
            <YesNo value={specialNeedsChild} onChange={setSpecialNeedsChild} />
          </div>
        </div>

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

      {/* Пока в «точном числе детей» стоит больше 20, окошки возраста не
          показываются — отправлять такую анкету нечему. */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={tooManyChildren}
        className={cn(
          buttonVariants(),
          "mt-8 h-12 w-full text-base",
          tooManyChildren && "pointer-events-none opacity-50",
        )}
      >
        Показать подходящие меры
      </button>
    </div>
  );
}
