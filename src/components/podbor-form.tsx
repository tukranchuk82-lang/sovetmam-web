"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  RotateCcw,
  ChevronDown,
  LayoutGrid,
  MessageCircle,
  FileEdit,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { SegmentMeasures } from "@/components/segment-measures";
import { saveSurveyAction } from "@/app/(app)/login/onboarding-actions";
import {
  matchMeasures,
  REGIONS,
  TAX_SYSTEM_LABEL,
  YOUNG_FAMILY_MAX_AGE,
  type IncomePm,
  type SupportMeasure,
  type TaxSystem,
  type UserProfile,
} from "@/lib/measures";

/** Ответ о системе налогообложения из сохранённой анкеты — с проверкой. */
function isTaxSystem(v: unknown): v is TaxSystem {
  return typeof v === "string" && v in TAX_SYSTEM_LABEL;
}

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
  /**
   * Разрешает снять ответ повторным нажатием.
   *
   * Нужно вопросам о здоровье: мы обещаем в документах, что отвечать на них
   * необязательно, а без возможности передумать это обещание пустое — нажав
   * один раз, человек уже не мог вернуться к «не отвечал».
   */
  clearable = false,
}: {
  value: boolean | null;
  onChange: (v: boolean | null) => void;
  clearable?: boolean;
}) {
  const pick = (v: boolean) => onChange(clearable && value === v ? null : v);

  return (
    <>
      <Choice active={value === true} onClick={() => pick(true)}>
        Да
      </Choice>
      <Choice active={value === false} onClick={() => pick(false)}>
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
/**
 * Экраны анкеты. Раньше все девятнадцать вопросов шли одной простынёй, и до
 * конца доходили не все: часть людей бросала анкету на середине, часть
 * отвечала наугад. Порядок экранов согласован: регион первым (без него подбор
 * теряет три четверти базы), дальше семья, потом всё остальное.
 */
const STEPS = [
  "Где вы живёте",
  "Дети",
  "Родители",
  "Работа и доход",
  "Жильё",
  "Особые статусы",
  "Здоровье",
];

const MAX_CHILDREN = 20;

// «Сколько у вас детей»: 1…9 и «10 и более» (10 — маркер, точное число потом
// спрашиваем отдельным полем).
const MANY_CHILDREN = 10;
const COUNT_OPTIONS: { value: number; label: string }[] = [
  ...Array.from({ length: 9 }, (_, i) => ({ value: i + 1, label: String(i + 1) })),
  { value: MANY_CHILDREN, label: "10 и более" },
];

// Многоплодные роды: сколько детей родилось за одни роды (1 — обычные роды).
const MULTIPLE_BIRTH_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: "Нет" },
  { value: 2, label: "Двойня" },
  { value: 3, label: "Тройня" },
  { value: 4, label: "4 и более" },
];

// Возраст ребёнка: 0…18, где 18 — «18 и старше».
const AGE_OPTIONS: { value: number; label: string }[] = Array.from(
  { length: 19 },
  (_, i) => ({ value: i, label: i === 18 ? "18 и старше" : String(i) }),
);

// Возраст родителей: от 16 до 60, дальше «60 и старше» — точное число там уже
// ни на одну меру не влияет, а список не стоит делать бесконечным.
const PARENT_AGE_OPTIONS = Array.from({ length: 45 }, (_, i) => {
  const age = 16 + i;
  return { value: age, label: age === 60 ? "60 и старше" : String(age) };
});

function ParentAgeSelect({
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
        {PARENT_AGE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}

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
    multipleBirthCount: Number(v.multipleBirthCount) || 1,
    region: String(v.region ?? ""),
    incomePm,
    lowIncome: incomePm === 1,
    disabledChild: !!v.disabledChild,
    specialNeedsChild: !!v.specialNeedsChild,
    lossOfBreadwinner: !!v.lossOfBreadwinner,
    mortgageIntent: !!v.mortgageIntent,
    svoFamily: !!v.svoFamily,
    singleParent: !!v.singleParent,
    student: !!v.student,
    parentAge: typeof v.parentAge === "number" ? v.parentAge : null,
    spouseAge: typeof v.spouseAge === "number" ? v.spouseAge : null,
    parentUnder35: !!v.parentUnder35,
    selfEmployed: !!v.selfEmployed,
    entrepreneur: !!v.entrepreneur,
    // Занятость: null означает «не спрашивали». Отличать это от «нет» важно —
    // на нём держится правило paysNdfl, см. lib/measures.ts.
    employed: typeof v.employed === "boolean" ? v.employed : null,
    taxSystem: isTaxSystem(v.taxSystem) ? v.taxSystem : null,
    hasEmployees: typeof v.hasEmployees === "boolean" ? v.hasEmployees : null,
    disabledParent: !!v.disabledParent,
    fosterParent: !!v.fosterParent,
    teacher: !!v.teacher,
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
  // Возрасты детей держим не списком, а ответами по номеру ребёнка: список
  // нужной длины выводится из числа детей при отрисовке. Раньше длину
  // подгонял эффект, и React справедливо ругался на состояние, которое
  // правится следом за другим состоянием.
  const [agesByChild, setAgesByChild] = useState<Record<number, number | null>>(() =>
    Object.fromEntries(
      (Array.isArray(saved?.childrenAges) ? saved.childrenAges.map(Number) : []).map(
        (age, i) => [i, age],
      ),
    ),
  );
  // Многоплодные роды: 1 — обычные, 2 — двойня, 3 — тройня, 4 — четверни и более.
  const [multipleBirthCount, setMultipleBirthCount] = useState<number | null>(
    saved?.multipleBirthCount ?? null,
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
  const [lossOfBreadwinner, setLossOfBreadwinner] = useState<boolean | null>(
    saved?.lossOfBreadwinner ?? null,
  );
  const [parentAge, setParentAge] = useState<number | null>(
    typeof saved?.parentAge === "number" ? saved.parentAge : null,
  );
  const [spouseAge, setSpouseAge] = useState<number | null>(
    typeof saved?.spouseAge === "number" ? saved.spouseAge : null,
  );
  // null — не спрашивали, false — супруга нет. Отдельный флаг нужен, чтобы
  // отличить «супруга нет» от «возраст супруга не заполнили». В анкету он не
  // сохраняется: для подбора хватает самих возрастов.
  const [hasSpouse, setHasSpouse] = useState<boolean | null>(
    savedSurvey?.singleParent === true ? false : null,
  );
  const [selfEmployed, setSelfEmployed] = useState<boolean | null>(saved?.selfEmployed ?? null);
  const [entrepreneur, setEntrepreneur] = useState<boolean | null>(saved?.entrepreneur ?? null);
  const [employed, setEmployed] = useState<boolean | null>(saved?.employed ?? null);
  const [taxSystem, setTaxSystem] = useState<TaxSystem | null>(
    saved?.taxSystem ?? null,
  );
  const [hasEmployees, setHasEmployees] = useState<boolean | null>(
    saved?.hasEmployees ?? null,
  );
  const [disabledParent, setDisabledParent] = useState<boolean | null>(saved?.disabledParent ?? null);
  const [fosterParent, setFosterParent] = useState<boolean | null>(saved?.fosterParent ?? null);
  const [teacher, setTeacher] = useState<boolean | null>(saved?.teacher ?? null);

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

  // Список окошек идёт за числом детей: добавили ребёнка — появилось пустое,
  // убавили — лишние скрылись, а ответы оставшихся сохранились.
  const childrenAges = Array.from(
    { length: childCount },
    (_, i) => agesByChild[i] ?? null,
  );

  // Движок подбора смотрит на возраст младшего — выводим его из ответов.
  const filledAges = childrenAges.filter((a): a is number => a != null);
  const youngestAge = filledAges.length ? Math.min(...filledAges) : null;

  // «Молодая семья» — если ценз проходят оба супруга. Возраст не указан вовсе —
  // считаем, что не проходят: лучше не предложить, чем обнадёжить зря.
  const parentAges = [parentAge, hasSpouse === false ? null : spouseAge].filter(
    (a): a is number => a != null,
  );
  const youngFamily =
    parentAges.length > 0 && parentAges.every((a) => a <= YOUNG_FAMILY_MAX_AGE);

  function setAgeAt(i: number, value: number | null) {
    setAgesByChild((prev) => ({ ...prev, [i]: value }));
  }

  // Переход между экранами: прокручиваем к началу анкеты, иначе человек
  // оказывается в середине следующего экрана и не видит его первый вопрос.
  function goToStep(next: number) {
    setStep(next);
    topRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  // Если анкета уже была заполнена — сразу показываем сохранённый подбор.
  //
  // ignoreRegion включаем ТОЛЬКО когда регион в анкете указан: тогда фильтром
  // занимается сам список, где регион можно переключить. Если региона нет,
  // отсекаем региональные меры сразу — иначе человек получал меры всех
  // регионов страны разом (у одной живой анкеты выходило 1147 мер), а в PDF
  // они уезжали целиком.
  const [step, setStep] = useState(0);
  const [results, setResults] = useState<SupportMeasure[] | null>(() =>
    hasSaved
      ? matchMeasures(toProfile(saved!), measures, {
          ignoreRegion: Boolean(toProfile(saved!).region),
        })
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
      multipleBirthCount: pregnant || hasChildren ? (multipleBirthCount ?? 1) : 1,
      region,
      incomePm,
      // Выводим из шкалы, а не спрашиваем отдельно: 46 мер размечены
      // requiresLowIncome, и «ниже ПМ» — это ровно группа «до 1 ПМ».
      lowIncome: incomePm === 1,
      disabledChild: disabledChild ?? false,
      specialNeedsChild: specialNeedsChild ?? false,
      lossOfBreadwinner: lossOfBreadwinner ?? false,
      mortgageIntent: mortgageIntent ?? false,
      svoFamily: svoFamily ?? false,
      singleParent: singleParent ?? false,
      student: student ?? false,
      parentAge,
      spouseAge: hasSpouse === false ? null : spouseAge,
      // Флаг выводим по старшему из супругов — см. isYoungFamily. Если
      // возраст не указали вовсе, меры для молодых семей не показываем:
      // лучше не предложить подходящее, чем обнадёжить зря.
      parentUnder35: youngFamily,
      selfEmployed: selfEmployed ?? false,
      entrepreneur: entrepreneur ?? false,
      // Здесь, в отличие от остальных ответов, null сохраняем как есть:
      // «не ответили» и «нет» для налоговых мер значат разное (см. paysNdfl).
      employed,
      taxSystem: entrepreneur ? taxSystem : null,
      // На НПД наёмных работников держать нельзя — вопрос мы не задаём, и
      // отвечаем за человека сами, чтобы ответ не остался пустым.
      hasEmployees: entrepreneur ? (taxSystem === "npd" ? false : hasEmployees) : null,
      disabledParent: disabledParent ?? false,
      fosterParent: fosterParent ?? false,
      teacher: teacher ?? false,
    };
    submitted.current = true;
    setResults(
      matchMeasures(profile, measures, { ignoreRegion: Boolean(profile.region) }),
    );
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
        {/* Подборка уже составлена по сохранённой анкете — говорим об этом прямо
            и даём заметную кнопку сменить ответы, а не бледную строчку. */}
        <div className="flex items-start gap-3 rounded-2xl border border-[#1B3A6B]/15 bg-[#1B3A6B]/[0.05] p-3.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#1B3A6B]/10 text-[#1B3A6B]">
            <FileEdit className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[#1A1A1A]">
              У вас уже есть подборка
            </p>
            <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
              Меры подобраны по вашей анкете. Если что-то изменилось — обновите
              ответы, и мы пересоберём список.
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-[#1B3A6B] px-3.5 py-2 text-xs font-semibold text-white shadow-[0_4px_12px_-4px_rgba(27,58,107,0.45)] transition-all hover:bg-[#16305a] active:scale-[0.98]"
            >
              <RotateCcw className="size-3.5" /> Изменить ответы
            </button>
          </div>
        </div>

        {/* Регион не указан — региональных мер в подборке нет вовсе.
            Молчать об этом нельзя: человек решит, что в его области ничего
            не положено, хотя именно там самые крупные выплаты. */}
        {!region && (
          <div className="mt-3 rounded-2xl border border-[#8E1D2C]/20 bg-[#8E1D2C]/[0.04] p-3.5">
            <p className="text-sm font-semibold text-[#8E1D2C]">
              Регион не указан — показываем только федеральные меры
            </p>
            <p className="mt-1 text-sm leading-snug text-muted-foreground">
              Они действуют по всей стране. Укажите регион, и к ним добавятся
              меры вашей области: губернаторские выплаты, региональный
              материнский капитал, льготы на ЖКУ, проезд и детский сад.
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-[#8E1D2C] px-3.5 py-2 text-xs font-semibold text-white transition-all hover:bg-[#7a1826] active:scale-[0.98]"
            >
              Указать регион
            </button>
          </div>
        )}

        {/* Детей нет и беременности нет — таким людям адресована лишь часть
            базы, и об этом честнее сказать прямо, чем оставить человека гадать,
            почему список короче, чем он ожидал. */}
        {pregnant === false && hasChildren === false && (
          <div className="mt-3 rounded-2xl border border-[#D9D2C6] bg-[#F7F4EE] p-3.5">
            <p className="text-sm font-semibold text-[#3A4D63]">
              Вы указали, что детей пока нет
            </p>
            <p className="mt-1 text-sm leading-snug text-muted-foreground">
              Ниже — меры, которые положены до рождения ребёнка: лечение
              бесплодия и ЭКО, возврат налога за лечение, жильё молодой семье.
              Основная часть поддержки начинается с беременности — если что-то
              изменилось, обновите ответы.
            </p>
            <Link
              href="/situation/planning"
              className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#8E1D2C]"
            >
              Все меры для планирующих →
            </Link>
          </div>
        )}

        {results.length > 0 ? (
          <>
            <h1
              className="mt-3 text-[26px] font-normal leading-tight text-[#1A1A1A]"
              style={{ fontFamily: "var(--font-playfair), serif" }}
            >
              Вам может подойти
            </h1>
            {/* Скачивание — до списка: в соцзащите и МФЦ просят «принесите
                список», и человек ищет эту кнопку сразу, а не после сотни
                карточек. Обычная ссылка, а не действие: файл собирает сервер по
                сохранённой анкете, поэтому работает и на телефоне, и с другого
                устройства. */}
            <a
              href="/podbor/pdf"
              className={cn(
                buttonVariants(),
                "mt-4 h-11 w-full gap-2 bg-[#1B3A6B] text-white hover:bg-[#16305a]",
              )}
            >
              <Download className="size-4" /> Скачать подборку в PDF
            </a>

            {/* Кнопка «Посмотреть все меры» — до списка, чтобы не листать вниз. */}
            <Link
              href="/catalog"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "mt-2.5 h-11 w-full gap-2 border-[#1B3A6B]/25 text-[#1B3A6B]",
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

      {/* Где человек находится и сколько осталось. */}
      <div className="mt-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#1B3A6B]">
            {STEPS[step]}
          </p>
          <p className="text-xs text-muted-foreground">
            шаг {step + 1} из {STEPS.length}
          </p>
        </div>
        <div className="mt-2 flex gap-1">
          {STEPS.map((title, i) => (
            <span
              key={title}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i <= step ? "bg-[#1B3A6B]" : "bg-black/[0.08]",
              )}
            />
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {/* Экран 1: Где вы живёте */}
        {step === 0 && (
          <div className="space-y-6">
        {/* Регион — первым и обязательно. Без него подбор теряет три четверти
            базы: региональных мер 2264 против 109 федеральных. Раньше вариант
            «Не указывать» стоял по умолчанию, и каждая пятая анкета уходила без
            региона — человек получал почти пустой экран и решал, что ему
            ничего не положено. */}
        <div>
          <p className="text-sm font-medium">
            Ваш регион <span className="text-[#8E1D2C]">*</span>
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Самые крупные выплаты — региональные, и в каждой области они свои.
            Без региона мы покажем только федеральные меры.
          </p>
          <div className="relative mt-2">
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className={cn(
                "w-full appearance-none rounded-xl border bg-white py-2.5 pl-3 pr-8 text-sm shadow-sm focus:border-[#1B3A6B]/40 focus:outline-none",
                region
                  ? "border-black/[0.08] font-medium text-[#2b2f36]"
                  : "border-[#8E1D2C]/30 text-[#7a808a]",
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

        {/* Гражданство спрашиваем отдельно от региона: человек без
            гражданства РФ всё равно живёт в конкретной области, и часть мер
            ему доступна. Раньше ответ «нет» стирал уже выбранный регион. */}
        <Question label="Вы гражданин РФ?">
          <YesNo value={isCitizen} onChange={setIsCitizen} />
        </Question>

        {isCitizen === false && (
          <p className="rounded-xl border border-dashed bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
            Большинство федеральных и региональных мер господдержки в РФ
            предоставляются гражданам России. Подбор покажет только меры,
            для которых гражданство РФ не требуется.
          </p>
        )}
          </div>
        )}

        {/* Экран 2: Дети */}
        {step === 1 && (
          <div className="space-y-6">
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

        {(pregnant || hasChildren) && (
          <div>
            <p className="text-sm font-medium">
              Были ли многоплодные роды (двойня, тройня и более)?
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Есть меры именно для семей, где за одни роды родилось несколько
              детей.
            </p>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {MULTIPLE_BIRTH_OPTIONS.map((o) => (
                <Choice
                  key={o.value}
                  active={multipleBirthCount === o.value}
                  onClick={() => setMultipleBirthCount(o.value)}
                >
                  {o.label}
                </Choice>
              ))}
            </div>
          </div>
        )}
          </div>
        )}

        {/* Экран 3: Родители */}
        {step === 2 && (
          <div className="space-y-6">
        {/* Возраст спрашиваем у каждого супруга отдельно: программы для
            молодых семей требуют ценз от обоих, и на общий вопрос «до 35?»
            семья, где одному 33, а другому 37, отвечала «да». */}
        <div>
          <p className="text-sm font-medium">Возраст родителей</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Программы для молодых семей действуют, только если обоим супругам
            не больше 35 лет.
          </p>

          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2.5">
            <label className="block">
              <span className="text-xs text-muted-foreground">Ваш возраст</span>
              <ParentAgeSelect value={parentAge} onChange={setParentAge} />
            </label>

            {hasSpouse !== false && (
              <label className="block">
                <span className="text-xs text-muted-foreground">Возраст супруга</span>
                <ParentAgeSelect value={spouseAge} onChange={setSpouseAge} />
              </label>
            )}
          </div>

          {/* Кнопка стоит под колонкой супруга — чтобы читалось как ответ
              именно на этот вопрос, а не на весь блок. */}
          <div className="mt-2.5 grid grid-cols-2 gap-x-3">
            <div />
            <Choice
              active={hasSpouse === false}
              onClick={() => {
                const next = hasSpouse === false ? null : false;
                setHasSpouse(next);
                if (next === false) setSpouseAge(null);
              }}
            >
              супруга нет
            </Choice>
          </div>
        </div>

        <Question label="Вы единственный родитель (неполная семья)?">
          <YesNo value={singleParent} onChange={setSingleParent} />
        </Question>

        <Question label="Родители учатся очно (студенческая семья)?">
          <YesNo value={student} onChange={setStudent} />
        </Question>
          </div>
        )}

        {/* Экран 4: Работа и доход */}
        {step === 3 && (
          <div className="space-y-6">
        {/* Занятость. От неё зависят налоговые вычеты: вернуть можно только
            уже уплаченный НДФЛ. Спрашиваем «кто-то из родителей», потому что
            вычет за лечение или обучение ребёнка вправе получить любой из
            супругов — семье достаточно одного работающего. */}
        <div className="rounded-2xl border bg-card p-3.5">
          <p className="text-sm font-medium">
            Кто-то из родителей работает по найму с официальной зарплатой?
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            От этого зависят налоговые вычеты: вернуть можно только тот налог,
            который уже удержали с зарплаты.
          </p>
          <div className="mt-2 flex gap-2">
            <YesNo value={employed} onChange={setEmployed} />
          </div>
        </div>

        <Question label="Вы самозанятый?">
          <YesNo value={selfEmployed} onChange={setSelfEmployed} />
        </Question>

        <Question label="Вы индивидуальный предприниматель?">
          <YesNo value={entrepreneur} onChange={setEntrepreneur} />
        </Question>

        {/* Уточнения для ИП появляются только после ответа «да» — остальным
            эти вопросы ни о чём. */}
        {entrepreneur === true && (
          <>
            <div className="rounded-2xl border bg-card p-3.5">
              <p className="text-sm font-medium">Ваша система налогообложения</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Свой НДФЛ предприниматель платит только на общей системе. На
                УСН, НПД, патенте и ЕСХН налог другой, и возвращать нечего.
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(
                  ["osno", "usn", "npd", "patent", "eshn", "unknown"] as TaxSystem[]
                ).map((t) => (
                  <Choice
                    key={t}
                    active={taxSystem === t}
                    onClick={() => setTaxSystem(t)}
                  >
                    {TAX_SYSTEM_LABEL[t]}
                  </Choice>
                ))}
              </div>
            </div>

            {/* НПД запрещает наёмных работников — спрашивать не о чем. */}
            {taxSystem === "npd" ? (
              <p className="rounded-2xl border border-dashed bg-card px-3.5 py-3 text-xs text-muted-foreground">
                На НПД наёмных сотрудников быть не может — про них не
                спрашиваем.
              </p>
            ) : (
              <Question label="У вас есть наёмные сотрудники?">
                <YesNo value={hasEmployees} onChange={setHasEmployees} />
              </Question>
            )}
          </>
        )}

        <Question label="Вы работаете учителем?">
          <YesNo value={teacher} onChange={setTeacher} />
        </Question>

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
          </div>
        )}

        {/* Экран 5: Жильё */}
        {step === 4 && (
          <div className="space-y-6">
        <Question label="Планируете покупку жилья или ипотеку?">
          <YesNo value={mortgageIntent} onChange={setMortgageIntent} />
        </Question>
          </div>
        )}

        {/* Экран 6: Особые статусы */}
        {step === 5 && (
          <div className="space-y-6">
        <Question label="Кто-то из членов семьи является участником СВО?">
          <YesNo value={svoFamily} onChange={setSvoFamily} />
        </Question>

        {/* Отдельный вопрос: «единственный родитель» и «потеря кормильца» —
            разные вещи. Из-за того, что мы не спрашивали про второе, пенсия по
            случаю потери кормильца предлагалась полным семьям. */}
        <Question label="Кто-то из детей потерял одного или обоих родителей?">
          <YesNo value={lossOfBreadwinner} onChange={setLossOfBreadwinner} />
        </Question>

        <Question label="Вы приёмный родитель, опекун или усыновитель?">
          <YesNo value={fosterParent} onChange={setFosterParent} />
        </Question>
          </div>
        )}

        {/* Экран 7: Здоровье */}
        {step === 6 && (
          <div className="space-y-6">
        {/* Вопросы о здоровье собраны в один блок и помечены как
            необязательные.

            Сведения об инвалидности — особая категория персональных данных,
            к ней закон предъявляет повышенные требования, и мы обещаем в
            политике конфиденциальности, что отвечать на эти вопросы не
            обязательно. Обещание должно быть выполнимым: ответ снимается
            повторным нажатием, а пропуск ничего не ломает — просто не покажем
            меры, положенные по этому основанию. */}
        <div className="rounded-2xl border border-[#D9D2C6] bg-[#F7F4EE] p-3.5">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-[#3A4D63]">Здоровье семьи</p>
            <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
              можно пропустить
            </span>
          </div>
          <p className="mt-1 text-xs leading-snug text-muted-foreground">
            Спрашиваем только для подбора: по этим основаниям положены отдельные
            меры. Если отвечать не хотите — пропустите, подбор всё равно
            сработает. Нажмите на выбранный ответ ещё раз, чтобы снять его.
          </p>

          <div className="mt-3 space-y-3">
            <div>
              <p className="text-sm font-medium">В семье есть ребёнок-инвалид?</p>
              <div className="mt-2 flex gap-2">
                <YesNo
                  value={disabledChild}
                  onChange={setDisabledChild}
                  clearable
                />
              </div>
            </div>

            <div>
              <p className="text-sm font-medium">
                В семье есть ребёнок с ОВЗ (ограниченными возможностями
                здоровья)?
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Статус ОВЗ даёт психолого-медико-педагогическая комиссия.
                Инвалидности при этом может не быть.
              </p>
              <div className="mt-2 flex gap-2">
                <YesNo
                  value={specialNeedsChild}
                  onChange={setSpecialNeedsChild}
                  clearable
                />
              </div>
            </div>

            <div>
              <p className="text-sm font-medium">
                Кто-то из родителей имеет инвалидность?
              </p>
              <div className="mt-2 flex gap-2">
                <YesNo
                  value={disabledParent}
                  onChange={setDisabledParent}
                  clearable
                />
              </div>
            </div>
          </div>
        </div>
          </div>
        )}
      </div>

      {/* Регион — единственный обязательный ответ: без него дальше идти
          некуда, три четверти базы просто не покажутся. */}
      {step === 0 && !region && (
        <p className="mt-6 rounded-xl border border-dashed border-[#8E1D2C]/30 bg-[#8E1D2C]/[0.04] px-4 py-3 text-xs leading-relaxed text-[#8E1D2C]">
          Выберите регион, чтобы продолжить.
        </p>
      )}
      {/* «Точное число детей» больше 20 — окошки возраста не показываются,
          отправлять такую анкету нечему. */}
      {tooManyChildren && step === 1 && (
        <p className="mt-6 rounded-xl border border-dashed border-red-500/40 bg-red-50 px-4 py-3 text-xs leading-relaxed text-red-700">
          Впишите не больше 20 детей — подбор мер от этого не изменится.
        </p>
      )}

      <div className="mt-6 flex items-center gap-3">
        {step > 0 && (
          <button
            type="button"
            onClick={() => goToStep(step - 1)}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-12 flex-1 border-[#1B3A6B]/25 text-base text-[#1B3A6B]",
            )}
          >
            Назад
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => goToStep(step + 1)}
            disabled={(step === 0 && !region) || (step === 1 && tooManyChildren)}
            className={cn(
              buttonVariants(),
              "h-12 flex-[2] text-base",
              ((step === 0 && !region) || (step === 1 && tooManyChildren)) &&
                "pointer-events-none opacity-50",
            )}
          >
            Далее
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={tooManyChildren || !region}
            className={cn(
              buttonVariants(),
              "h-12 flex-[2] text-base",
              (tooManyChildren || !region) && "pointer-events-none opacity-50",
            )}
          >
            Показать меры
          </button>
        )}
      </div>

      {/* Последний экран необязательный — даём пропустить его целиком. */}
      {step === STEPS.length - 1 && (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Вопросы о здоровье можно не заполнять — подбор всё равно сработает.
        </p>
      )}
    </div>
  );
}
