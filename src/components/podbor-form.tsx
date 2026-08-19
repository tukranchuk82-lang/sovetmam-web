"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
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
import { PodborResults } from "@/components/podbor-results";
import { saveSurveyAction } from "@/app/(app)/login/onboarding-actions";
import {
  matchMeasures,
  REGIONS,
  TAX_SYSTEM_LABEL,
  YOUNG_FAMILY_MAX_AGE,
  type IncomePm,
  type SupportMeasure,
  type TaxSystem,
  type EmploymentStatus,
  type EmploymentKind,
  type PreviousEmployment,
  type WorkField,
  type SettlementType,
  type PregnancyStage,
  type SvoRole,
  type StudyLevel,
  type StudyFunding,
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
  className,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
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
        className,
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
function BirthSelect({
  value,
  onChange,
}: {
  value: ChildBirth;
  onChange: (v: ChildBirth) => void;
}) {
  const selectClass = (filled: boolean) =>
    cn(
      "w-full appearance-none rounded-xl border border-black/[0.08] bg-white py-2.5 pl-3 pr-8 text-sm shadow-sm focus:border-[#1B3A6B]/40 focus:outline-none",
      filled ? "font-medium text-[#2b2f36]" : "text-[#7a808a]",
    );
  return (
    <div className="mt-1 grid grid-cols-2 gap-2">
      <div className="relative">
        <select
          value={value.month ?? ""}
          onChange={(e) =>
            onChange({
              ...value,
              month: e.target.value === "" ? null : Number(e.target.value),
            })
          }
          className={selectClass(value.month != null)}
        >
          <option value="">Месяц</option>
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-[#9aa0a8]"
        />
      </div>
      <div className="relative">
        <select
          value={value.year ?? ""}
          onChange={(e) =>
            onChange({
              ...value,
              year: e.target.value === "" ? null : Number(e.target.value),
            })
          }
          className={selectClass(value.year != null)}
        >
          <option value="">Год</option>
          {BIRTH_YEARS.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-[#9aa0a8]"
        />
      </div>
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

/**
 * Черновик ответов — в памяти вкладки.
 *
 * Анкета стала многоэкранной, а ответы живут в состоянии страницы: одно
 * случайное нажатие «Назад» в шапке приложения — и человек теряет всё, что
 * успел заполнить. Черновик это спасает.
 *
 * Именно sessionStorage, а не localStorage: среди ответов есть сведения об
 * инвалидности — особая категория персональных данных, и в политике мы
 * обещаем минимум. Черновик доживает до закрытия вкладки и не оставляет
 * следов в браузере после того, как человек ушёл.
 */
const DRAFT_KEY = "podbor-draft-v1";

/**
 * Есть ли отложенный черновик — читаем через useSyncExternalStore.
 *
 * Сервер о sessionStorage ничего не знает, поэтому серверный снимок всегда
 * «нет». Иначе разметка на сервере и в браузере разошлась бы, и React
 * пожаловался бы на несоответствие при гидратации.
 */
function subscribeToDraft() {
  return () => {};
}

function readDraftFlag(): boolean {
  try {
    return sessionStorage.getItem(DRAFT_KEY) != null;
  } catch {
    return false;
  }
}

function readDraft(): Record<string, unknown> | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

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
/**
 * Ориентир учётной нормы площади, кв. м на человека.
 *
 * Точную норму устанавливает каждый муниципалитет свою, единого справочника
 * не существует. Берём типовое значение: оно нужно не для решения, а для
 * подсказки «похоже, у вас есть основание встать на учёт».
 */
const HOUSING_NORM_HINT = 12;

const SETTLEMENT_OPTIONS: { value: SettlementType; label: string }[] = [
  { value: "city", label: "Город" },
  { value: "small-town", label: "Город до 50 тысяч" },
  { value: "village", label: "Село, посёлок" },
];

const PREGNANCY_OPTIONS: { value: PregnancyStage; label: string }[] = [
  { value: "under12", label: "До 12 недель" },
  { value: "12-27", label: "12–27 недель" },
  { value: "28-35", label: "28–35 недель" },
  { value: "36plus", label: "36 недель и больше" },
];

/**
 * Кто в семье связан со специальной военной операцией.
 *
 * Уточнение обязательно: круг получателей у каждой меры свой, и «участник» и
 * «погибший» открывают совершенно разные наборы. Можно отметить несколько —
 * в семье бывает и ветеран, и погибший родственник.
 */
const SVO_ROLE_OPTIONS: { value: SvoRole; label: string }[] = [
  { value: "active", label: "Участвует сейчас" },
  { value: "veteran", label: "Ветеран боевых действий" },
  { value: "lost", label: "Погиб или пропал без вести" },
  { value: "disabled", label: "Получил инвалидность" },
];

const STUDY_LEVEL_OPTIONS: { value: StudyLevel; label: string }[] = [
  { value: "vuz", label: "Вуз" },
  { value: "college", label: "Колледж, техникум" },
];

const STUDY_FUNDING_OPTIONS: { value: StudyFunding; label: string }[] = [
  { value: "budget", label: "Бюджет" },
  { value: "paid", label: "Платно" },
];

const EMPLOYMENT_OPTIONS: { value: EmploymentStatus; label: string }[] = [
  { value: "working", label: "Работаю" },
  { value: "not-working", label: "Не работаю" },
  { value: "parental-leave", label: "В декрете" },
];

const KIND_OPTIONS: { value: EmploymentKind; label: string }[] = [
  { value: "hired", label: "По найму" },
  { value: "self-employed", label: "Самозанятость" },
  { value: "entrepreneur", label: "ИП" },
];

/**
 * Кем человек был до декрета.
 *
 * Без этого ответа декрет стирал бы источник: ушла в декрет из вуза — положены
 * академический отпуск, семейное общежитие и выплаты вуза; с работы — 40%
 * заработка и меры работодателя; была самозанятой — декретных нет вовсе.
 */
const PREV_EMPLOYMENT_OPTIONS: { value: PreviousEmployment; label: string }[] = [
  { value: "hired", label: "Работала по найму" },
  { value: "self-employed", label: "Самозанятость" },
  { value: "entrepreneur", label: "ИП" },
  { value: "student", label: "Училась очно" },
  { value: "none", label: "Не работала" },
];

const WORK_FIELD_OPTIONS: { value: WorkField; label: string }[] = [
  { value: "education", label: "Образование" },
  { value: "medicine", label: "Медицина" },
  { value: "sport", label: "Спорт" },
  { value: "culture", label: "Культура" },
  { value: "it", label: "ИТ" },
  { value: "public", label: "Госслужба, бюджет" },
  { value: "defense", label: "Оборонная промышленность" },
  { value: "military", label: "Военная служба" },
];

const MONTHS = [
  "январь",
  "февраль",
  "март",
  "апрель",
  "май",
  "июнь",
  "июль",
  "август",
  "сентябрь",
  "октябрь",
  "ноябрь",
  "декабрь",
];

/**
 * Годы рождения — за последние 25 лет. Дальше смысла нет: даже самые «долгие»
 * меры (статус многодетной семьи, пенсия по потере кормильца) держатся
 * максимум до 23 лет ребёнка.
 */
const BIRTH_YEARS = Array.from(
  { length: 26 },
  (_, i) => new Date().getFullYear() - i,
);

/** Ответ про одного ребёнка: месяц и год рождения, плюс учёба для взрослых. */
type ChildBirth = {
  month: number | null;
  year: number | null;
  studies: boolean | null;
};

const EMPTY_BIRTH: ChildBirth = { month: null, year: null, studies: null };

/**
 * Возраст в полных годах на сегодня.
 *
 * Месяц необязателен: если человек его не указал, берём середину года — тогда
 * ошибка не больше полугода, и не приходится блокировать анкету из-за
 * вопроса, ответ на который можно не помнить.
 */
function ageYearsOf(b: ChildBirth): number | null {
  if (b.year == null) return null;
  const now = new Date();
  const months =
    (now.getFullYear() - b.year) * 12 + (now.getMonth() + 1 - (b.month ?? 6));
  return Math.max(0, Math.floor(months / 12));
}

/** Правильное склонение: «1 год», «2 года», «5 лет». */
function pluralYears(n: number): string {
  const d10 = n % 10;
  const d100 = n % 100;
  if (d10 === 1 && d100 !== 11) return `${n} год`;
  if (d10 >= 2 && d10 <= 4 && (d100 < 10 || d100 >= 20)) return `${n} года`;
  return `${n} лет`;
}

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
    children: Array.isArray(v.children) ? v.children : undefined,
    settlementType: v.settlementType ?? null,
    pregnancyStage: v.pregnancyStage ?? null,
    registeredEarly: v.registeredEarly ?? null,
    rareDisease: !!v.rareDisease,
    studyLevel: v.studyLevel ?? null,
    studyFunding: v.studyFunding ?? null,
    targetedContract: v.targetedContract ?? null,
    svoRoles: Array.isArray(v.svoRoles) ? v.svoRoles : [],
    conscriptSpouse: !!v.conscriptSpouse,
    veteranCombat: !!v.veteranCombat,
    radiationAffected: !!v.radiationAffected,
    hardship: !!v.hardship,
    ownsHome: v.ownsHome ?? null,
    homeArea: v.homeArea ?? null,
    residentsCount: v.residentsCount ?? null,
    homeUnfit: v.homeUnfit ?? null,
    housingNeedStatus: v.housingNeedStatus ?? null,
    hasMortgage: v.hasMortgage ?? null,
    employmentStatus: v.employmentStatus ?? null,
    employmentKinds: Array.isArray(v.employmentKinds) ? v.employmentKinds : [],
    previousEmployment: v.previousEmployment ?? null,
    voluntaryInsurance: v.voluntaryInsurance ?? null,
    unemployedStatus: v.unemployedStatus ?? null,
    workFields: Array.isArray(v.workFields) ? v.workFields : null,
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
  const [birthByChild, setBirthByChild] = useState<Record<number, ChildBirth>>(
    () => {
      const out: Record<number, ChildBirth> = {};
      // Анкета заполнена по новой форме — берём даты как есть.
      const kids = Array.isArray(saved?.children) ? saved.children : null;
      if (kids) {
        kids.forEach((c, i) => {
          out[i] = {
            month: typeof c?.birthMonth === "number" ? c.birthMonth : null,
            year: typeof c?.birthYear === "number" ? c.birthYear : null,
            studies:
              typeof c?.studiesFullTime === "boolean" ? c.studiesFullTime : null,
          };
        });
        return out;
      }
      // Старая анкета: был только возраст в годах. Год рождения выводим из
      // него, месяц оставляем пустым — человек уточнит, если захочет.
      (Array.isArray(saved?.childrenAges) ? saved.childrenAges.map(Number) : []).forEach(
        (age, i) => {
          out[i] = {
            month: null,
            year: new Date().getFullYear() - age,
            studies: null,
          };
        },
      );
      return out;
    },
  );
  // Многоплодные роды: 1 — обычные, 2 — двойня, 3 — тройня, 4 — четверни и более.
  const [multipleBirthCount, setMultipleBirthCount] = useState<number | null>(
    saved?.multipleBirthCount ?? null,
  );
  const [isCitizen, setIsCitizen] = useState<boolean | null>(saved ? (saved.region ? true : null) : null);
  // Тип населённого пункта: сельская ипотека под 3%, земские программы и
  // «Гектар» привязаны не к региону, а к тому, город это или село.
  const [settlementType, setSettlementType] = useState<SettlementType | null>(
    saved?.settlementType ?? null,
  );
  // Срок беременности и ранняя постановка на учёт: единое пособие беременным
  // положено только тем, кто встал на учёт до 12 недель.
  const [pregnancyStage, setPregnancyStage] = useState<PregnancyStage | null>(
    saved?.pregnancyStage ?? null,
  );
  const [registeredEarly, setRegisteredEarly] = useState<boolean | null>(
    saved?.registeredEarly ?? null,
  );
  const [rareDisease, setRareDisease] = useState<boolean | null>(
    saved?.rareDisease ?? null,
  );
  // Учёба родителей: от уровня и формы зависят перевод на бюджет, отсрочка
  // оплаты и приостановка отработки по целевому договору.
  const [studyLevel, setStudyLevel] = useState<StudyLevel | null>(
    saved?.studyLevel ?? null,
  );
  const [studyFunding, setStudyFunding] = useState<StudyFunding | null>(
    saved?.studyFunding ?? null,
  );
  const [targetedContract, setTargetedContract] = useState<boolean | null>(
    saved?.targetedContract ?? null,
  );
  // Особые статусы.
  const [svoRoles, setSvoRoles] = useState<SvoRole[]>(() =>
    Array.isArray(saved?.svoRoles) ? saved.svoRoles : [],
  );
  const [conscriptSpouse, setConscriptSpouse] = useState<boolean | null>(
    saved?.conscriptSpouse ?? null,
  );
  const [veteranCombat, setVeteranCombat] = useState<boolean | null>(
    saved?.veteranCombat ?? null,
  );
  const [radiationAffected, setRadiationAffected] = useState<boolean | null>(
    saved?.radiationAffected ?? null,
  );
  const [hardship, setHardship] = useState<boolean | null>(saved?.hardship ?? null);
  const [region, setRegion] = useState(saved?.region ?? "");
  // «Выше 2 ПМ» — это не отсутствие ответа, поэтому шкала хранит отдельный
  // флаг «ответил» (incomeAnswered) рядом со значением (null = выше 2 ПМ).
  const [incomePm, setIncomePm] = useState<IncomePm | null>(saved ? toIncomePm(saved) : null);
  const [incomeAnswered, setIncomeAnswered] = useState(
    saved ? saved.incomePm !== undefined || !!saved.lowIncome : false,
  );
  const [mortgageIntent, setMortgageIntent] = useState<boolean | null>(saved?.mortgageIntent ?? null);
  // Жильё. Блок обязательный: без него 74 меры показываются всем подряд,
  // хотя без статуса нуждающихся они недоступны.
  const [ownsHome, setOwnsHome] = useState<boolean | null>(saved?.ownsHome ?? null);
  const [homeArea, setHomeArea] = useState<string>(
    saved?.homeArea != null ? String(saved.homeArea) : "",
  );
  const [residents, setResidents] = useState<string>(
    saved?.residentsCount != null ? String(saved.residentsCount) : "",
  );
  const [homeUnfit, setHomeUnfit] = useState<boolean | null>(saved?.homeUnfit ?? null);
  const [housingNeed, setHousingNeed] = useState<
    "registered" | "no" | "unknown" | null
  >(saved?.housingNeedStatus ?? null);
  const [hasMortgage, setHasMortgage] = useState<boolean | null>(
    saved?.hasMortgage ?? null,
  );
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
  // Занятость: сначала общий вопрос, потом уточнения — см. EMPLOYMENT_OPTIONS.
  // Анкеты, заполненные по старой форме, восстанавливаем из прежних ответов
  // про наём, самозанятость и ИП.
  const [employmentStatus, setEmploymentStatus] = useState<EmploymentStatus | null>(
    () => {
      if (saved?.employmentStatus) return saved.employmentStatus;
      if (saved?.employed || saved?.selfEmployed || saved?.entrepreneur) {
        return "working";
      }
      return null;
    },
  );
  const [employmentKinds, setEmploymentKinds] = useState<EmploymentKind[]>(() => {
    if (Array.isArray(saved?.employmentKinds)) return saved.employmentKinds;
    const out: EmploymentKind[] = [];
    if (saved?.employed) out.push("hired");
    if (saved?.selfEmployed) out.push("self-employed");
    if (saved?.entrepreneur) out.push("entrepreneur");
    return out;
  });
  const [previousEmployment, setPreviousEmployment] =
    useState<PreviousEmployment | null>(saved?.previousEmployment ?? null);
  const [voluntaryInsurance, setVoluntaryInsurance] = useState<boolean | null>(
    saved?.voluntaryInsurance ?? null,
  );
  const [unemployedStatus, setUnemployedStatus] = useState<boolean | null>(
    saved?.unemployedStatus ?? null,
  );
  // Сферы работы: null — вопрос пропущен, пустой массив — осознанный ответ
  // «не работаем в указанных сферах». Разница важна для подбора.
  const [workFields, setWorkFields] = useState<WorkField[] | null>(() => {
    if (Array.isArray(saved?.workFields)) return saved.workFields;
    if (saved?.teacher) return ["education"];
    return null;
  });
  const [taxSystem, setTaxSystem] = useState<TaxSystem | null>(
    saved?.taxSystem ?? null,
  );
  const [hasEmployees, setHasEmployees] = useState<boolean | null>(
    saved?.hasEmployees ?? null,
  );
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

  // Список окошек идёт за числом детей: добавили ребёнка — появилось пустое,
  // убавили — лишние скрылись, а ответы оставшихся сохранились.
  const childBirths = Array.from(
    { length: childCount },
    (_, i) => birthByChild[i] ?? EMPTY_BIRTH,
  );

  // Для движка: даты рождения (по ним считается возраст в месяцах) и возрасты
  // в годах. Возрасты нужны мерам, размеченным по старым правилам — школьное
  // питание, дошкольные льготы и прочие, где считаются целые годы.
  const childrenInfo = childBirths
    .filter((b) => b.year != null)
    .map((b) => ({
      birthMonth: b.month ?? 6,
      birthYear: b.year as number,
      studiesFullTime: b.studies ?? undefined,
    }));
  const childrenAges = childBirths.map((b) => ageYearsOf(b));

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

  // Прежние поля профиля выводим из новых ответов: на них размечены меры
  // (вычеты по НДФЛ, меры самозанятым, ИП и учителям), и перемечать больше
  // двух тысяч мер ради переименования полей было бы расточительно.
  //
  // Декрет считаем занятостью того вида, из которого человек в него ушёл:
  // место работы за ним сохраняется, а вычеты за отработанные годы доступны.
  const isHired =
    employmentKinds.includes("hired") || previousEmployment === "hired";
  const isSelfEmployed =
    employmentKinds.includes("self-employed") ||
    previousEmployment === "self-employed";
  const isEntrepreneur =
    employmentKinds.includes("entrepreneur") ||
    previousEmployment === "entrepreneur";
  // Уточнения для предпринимателей и самозанятых нужны в любой ветке — и у
  // работающих, и у тех, кто в декрете.
  const needsTaxSystem = isEntrepreneur;
  const needsInsurance = isEntrepreneur || isSelfEmployed;

  /**
   * Смена статуса занятости стирает ответы других ветвей.
   *
   * Иначе они остаются в анкете невидимо: отметил «ИП», передумал и выбрал
   * «в декрете» — а вопросы про налоговый режим и взносы по-прежнему на
   * экране, и в профиль уезжает предпринимательство, которого нет.
   */
  function chooseEmployment(next: EmploymentStatus) {
    setEmploymentStatus(next);
    if (next !== "working") setEmploymentKinds([]);
    if (next !== "parental-leave") setPreviousEmployment(null);
    if (next !== "not-working") setUnemployedStatus(null);
    if (next === "not-working") {
      setTaxSystem(null);
      setHasEmployees(null);
      setVoluntaryInsurance(null);
    }
  }

  // Метры на человека: показываем расчёт человеку и передаём в подбор.
  const areaNum = homeArea.trim() === "" ? null : Number(homeArea);
  const residentsNum = residents.trim() === "" ? null : Number(residents);
  const areaValid = areaNum != null && Number.isFinite(areaNum) && areaNum > 0;
  const residentsValid =
    residentsNum != null && Number.isInteger(residentsNum) && residentsNum > 0;
  const areaPerPerson =
    areaValid && residentsValid ? (areaNum as number) / (residentsNum as number) : null;

  // Блок жилья обязателен — пропустить его нельзя. Метраж при этом можно не
  // указывать: человек может не помнить точную площадь, и блокировать анкету
  // из-за этого неправильно.
  const housingAnswered =
    ownsHome != null &&
    homeUnfit != null &&
    housingNeed != null &&
    mortgageIntent != null &&
    hasMortgage != null;

  function toggleKind(kind: EmploymentKind) {
    setEmploymentKinds((prev) =>
      prev.includes(kind) ? prev.filter((k) => k !== kind) : [...prev, kind],
    );
  }

  function toggleSvoRole(role: SvoRole) {
    setSvoRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  }

  function toggleWorkField(field: WorkField) {
    setWorkFields((prev) => {
      const list = prev ?? [];
      return list.includes(field)
        ? list.filter((f) => f !== field)
        : [...list, field];
    });
  }

  function setBirthAt(i: number, value: ChildBirth) {
    setBirthByChild((prev) => ({ ...prev, [i]: value }));
  }

  // Если анкета уже была заполнена — сразу показываем сохранённый подбор.
  //
  // ignoreRegion включаем ТОЛЬКО когда регион в анкете указан: тогда фильтром
  // занимается сам список, где регион можно переключить. Если региона нет,
  // отсекаем региональные меры сразу — иначе человек получал меры всех
  // регионов страны разом (у одной живой анкеты выходило 1147 мер), а в PDF
  // они уезжали целиком.
  const [step, setStep] = useState(0);
  // Профиль, по которому собрана подборка: нужен экрану результатов, чтобы
  // разложить меры по группам и посчитать сроки под конкретную семью.
  const [resultProfile, setResultProfile] = useState<UserProfile | null>(() =>
    hasSaved ? toProfile(saved!) : null,
  );
  const [results, setResults] = useState<SupportMeasure[] | null>(() =>
    hasSaved
      ? matchMeasures(toProfile(saved!), measures, {
          ignoreRegion: Boolean(toProfile(saved!).region),
        })
      : null,
  );
  const submitted = useRef(false);
  const topRef = useRef<HTMLDivElement>(null);

  // Все ответы одним объектом — его и держим в черновике.
  const answers = {
    step,
    region,
    pregnant,
    expectingNumber,
    hasChildren,
    childrenCount,
    exactCount,
    birthByChild,
    multipleBirthCount,
    isCitizen,
    incomePm,
    incomeAnswered,
    mortgageIntent,
    settlementType,
    pregnancyStage,
    registeredEarly,
    rareDisease,
    studyLevel,
    studyFunding,
    targetedContract,
    svoRoles,
    conscriptSpouse,
    veteranCombat,
    radiationAffected,
    hardship,
    ownsHome,
    homeArea,
    residents,
    homeUnfit,
    housingNeed,
    hasMortgage,
    singleParent,
    svoFamily,
    student,
    disabledChild,
    specialNeedsChild,
    lossOfBreadwinner,
    parentAge,
    spouseAge,
    hasSpouse,
    employmentStatus,
    employmentKinds,
    previousEmployment,
    voluntaryInsurance,
    unemployedStatus,
    workFields,
    taxSystem,
    hasEmployees,
    disabledParent,
    fosterParent,
  };

  // Человек уже что-то ответил? Считаем сравнением с пустой анкетой, а не
  // отдельным флагом: иначе пришлось бы оборачивать три десятка обработчиков.
  const touched =
    step > 0 ||
    Object.entries(answers).some(
      ([key, value]) =>
        key !== "step" &&
        value !== null &&
        value !== "" &&
        !(key === "birthByChild" && Object.keys(value ?? {}).length === 0) &&
        !(key === "incomeAnswered" && value === false),
    );

  // Пишем черновик после каждого изменения — но только когда человек начал
  // заполнять. Иначе пустая форма при открытии затёрла бы прошлый черновик
  // раньше, чем человек успел им воспользоваться.
  useEffect(() => {
    if (!touched) return;
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(answers));
    } catch {
      // Приватный режим может запрещать запись — тогда просто работаем без
      // черновика, ломать из-за этого анкету нельзя.
    }
  });

  // Черновик не подставляем молча: человек мог уйти со страницы намеренно
  // и вернуться, чтобы начать заново. Предлагаем выбрать.
  const hasDraft = useSyncExternalStore(
    subscribeToDraft,
    readDraftFlag,
    () => false,
  );
  const [draftDismissed, setDraftDismissed] = useState(false);
  const draftOffered = hasDraft && !hasSaved && !touched && !draftDismissed;

  function applyDraft() {
    const d = readDraft();
    setDraftDismissed(true);
    if (!d) return;
    const num = (v: unknown) => (typeof v === "number" ? v : null);
    const bool = (v: unknown) => (typeof v === "boolean" ? v : null);
    if (typeof d.step === "number" && d.step >= 0 && d.step < STEPS.length) {
      setStep(d.step);
    }
    if (typeof d.region === "string") setRegion(d.region);
    if (typeof d.exactCount === "string") setExactCount(d.exactCount);
    if (d.birthByChild && typeof d.birthByChild === "object") {
      setBirthByChild(d.birthByChild as Record<number, ChildBirth>);
    }
    if (isTaxSystem(d.taxSystem)) setTaxSystem(d.taxSystem);
    setPregnant(bool(d.pregnant));
    setExpectingNumber(num(d.expectingNumber));
    setHasChildren(bool(d.hasChildren));
    setChildrenCount(num(d.childrenCount));
    setMultipleBirthCount(num(d.multipleBirthCount));
    setIsCitizen(bool(d.isCitizen));
    setMortgageIntent(bool(d.mortgageIntent));
    setOwnsHome(bool(d.ownsHome));
    setRegisteredEarly(bool(d.registeredEarly));
    setRareDisease(bool(d.rareDisease));
    setTargetedContract(bool(d.targetedContract));
    setConscriptSpouse(bool(d.conscriptSpouse));
    setVeteranCombat(bool(d.veteranCombat));
    setRadiationAffected(bool(d.radiationAffected));
    setHardship(bool(d.hardship));
    if (Array.isArray(d.svoRoles)) setSvoRoles(d.svoRoles as SvoRole[]);
    if (d.settlementType === "city" || d.settlementType === "small-town" || d.settlementType === "village") {
      setSettlementType(d.settlementType);
    }
    if (
      d.pregnancyStage === "under12" ||
      d.pregnancyStage === "12-27" ||
      d.pregnancyStage === "28-35" ||
      d.pregnancyStage === "36plus"
    ) {
      setPregnancyStage(d.pregnancyStage);
    }
    if (d.studyLevel === "vuz" || d.studyLevel === "college") {
      setStudyLevel(d.studyLevel);
    }
    if (d.studyFunding === "budget" || d.studyFunding === "paid") {
      setStudyFunding(d.studyFunding);
    }
    setHomeUnfit(bool(d.homeUnfit));
    setHasMortgage(bool(d.hasMortgage));
    if (typeof d.homeArea === "string") setHomeArea(d.homeArea);
    if (typeof d.residents === "string") setResidents(d.residents);
    if (
      d.housingNeed === "registered" ||
      d.housingNeed === "no" ||
      d.housingNeed === "unknown"
    ) {
      setHousingNeed(d.housingNeed);
    }
    setSingleParent(bool(d.singleParent));
    setSvoFamily(bool(d.svoFamily));
    setStudent(bool(d.student));
    setDisabledChild(bool(d.disabledChild));
    setSpecialNeedsChild(bool(d.specialNeedsChild));
    setLossOfBreadwinner(bool(d.lossOfBreadwinner));
    setParentAge(num(d.parentAge));
    setSpouseAge(num(d.spouseAge));
    setHasSpouse(bool(d.hasSpouse));
    if (
      d.employmentStatus === "working" ||
      d.employmentStatus === "not-working" ||
      d.employmentStatus === "parental-leave"
    ) {
      setEmploymentStatus(d.employmentStatus);
    }
    if (Array.isArray(d.employmentKinds)) {
      setEmploymentKinds(d.employmentKinds as EmploymentKind[]);
    }
    if (typeof d.previousEmployment === "string") {
      setPreviousEmployment(d.previousEmployment as PreviousEmployment);
    }
    if (Array.isArray(d.workFields)) setWorkFields(d.workFields as WorkField[]);
    setVoluntaryInsurance(bool(d.voluntaryInsurance));
    setUnemployedStatus(bool(d.unemployedStatus));
    setHasEmployees(bool(d.hasEmployees));
    setDisabledParent(bool(d.disabledParent));
    setFosterParent(bool(d.fosterParent));
    if (d.incomeAnswered === true) {
      setIncomeAnswered(true);
      const pm = d.incomePm;
      setIncomePm(pm === 1 || pm === 1.5 || pm === 2 ? pm : null);
    }
  }

  function forgetDraft() {
    setDraftDismissed(true);
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      // Не смогли стереть — черновик всё равно перекроется следующими ответами.
    }
  }

  // Переход между экранами: прокручиваем к началу анкеты, иначе человек
  // оказывается в середине следующего экрана и не видит его первый вопрос.
  function goToStep(next: number) {
    setStep(next);
    topRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }


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
      children: hasChildren ? childrenInfo : [],
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
      settlementType,
      pregnancyStage: pregnant ? pregnancyStage : null,
      registeredEarly: pregnant ? registeredEarly : null,
      rareDisease: rareDisease ?? false,
      studyLevel: student ? studyLevel : null,
      studyFunding: student ? studyFunding : null,
      targetedContract: student ? targetedContract : null,
      svoRoles: svoFamily ? svoRoles : [],
      conscriptSpouse: conscriptSpouse ?? false,
      veteranCombat: veteranCombat ?? false,
      radiationAffected: radiationAffected ?? false,
      hardship: hardship ?? false,
      ownsHome,
      homeArea: areaValid ? areaNum : null,
      residentsCount: residentsValid ? residentsNum : null,
      homeUnfit,
      housingNeedStatus: housingNeed,
      hasMortgage,
      svoFamily: svoFamily ?? false,
      singleParent: singleParent ?? false,
      student: student ?? false,
      parentAge,
      spouseAge: hasSpouse === false ? null : spouseAge,
      // Флаг выводим по старшему из супругов — см. isYoungFamily. Если
      // возраст не указали вовсе, меры для молодых семей не показываем:
      // лучше не предложить подходящее, чем обнадёжить зря.
      parentUnder35: youngFamily,
      selfEmployed: isSelfEmployed,
      entrepreneur: isEntrepreneur,
      // Наёмная работа: null означает «не спрашивали». Если человек ответил на
      // вопрос о занятости, ответ уже определённый — false, а не пустота.
      employed: employmentStatus == null ? null : isHired,
      employmentStatus,
      employmentKinds,
      previousEmployment: employmentStatus === "parental-leave" ? previousEmployment : null,
      voluntaryInsurance: needsInsurance ? voluntaryInsurance : null,
      unemployedStatus: employmentStatus === "not-working" ? unemployedStatus : null,
      workFields,
      taxSystem: needsTaxSystem ? taxSystem : null,
      hasEmployees: needsTaxSystem
        ? taxSystem === "npd"
          ? false
          : hasEmployees
        : null,
      disabledParent: disabledParent ?? false,
      fosterParent: fosterParent ?? false,
      teacher: (workFields ?? []).includes("education"),
    };
    setResultProfile(profile);
    submitted.current = true;
    // Анкета уехала в профиль — черновик свою работу сделал.
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      // Не смогли стереть — не беда, при следующем открытии его перекроет
      // сохранённый подбор.
    }
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

            {/* Подборка разложена по группам: сначала сроки, затем
                «положено всем» и «положено вам», внутри — деньги, скидки,
                бесплатное. Раньше здесь была плоская лента, общая с разделами
                каталога, и порядок в ней был случайным. */}
            {resultProfile && (
              <PodborResults
                profile={resultProfile}
                measures={results}
                footer={<InquiryLinks />}
              />
            )}
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

      {/* Незаконченная анкета — предлагаем продолжить с того же места. */}
      {draftOffered && (
        <div className="mt-4 rounded-2xl border border-[#1B3A6B]/20 bg-[#1B3A6B]/[0.05] p-3.5">
          <p className="text-sm font-semibold text-[#1B3A6B]">
            У вас есть незаконченная анкета
          </p>
          <p className="mt-1 text-xs leading-snug text-muted-foreground">
            Ответы сохранились, когда вы уходили со страницы. Можно продолжить
            с того же места или начать заново.
          </p>
          <div className="mt-2.5 flex gap-2">
            <button
              type="button"
              onClick={applyDraft}
              className="inline-flex items-center rounded-lg bg-[#1B3A6B] px-3.5 py-2 text-xs font-semibold text-white transition-all hover:bg-[#16305a] active:scale-[0.98]"
            >
              Продолжить
            </button>
            <button
              type="button"
              onClick={forgetDraft}
              className="inline-flex items-center rounded-lg border border-[#1B3A6B]/25 px-3.5 py-2 text-xs font-semibold text-[#1B3A6B] transition-colors hover:bg-white"
            >
              Начать заново
            </button>
          </div>
        </div>
      )}

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

        {/* Город или село — отдельный вопрос, потому что часть программ
            привязана не к региону, а к размеру населённого пункта: сельская
            ипотека под 3% (и 0,1% в приграничье), подъёмные земских программ
            для врачей, учителей и тренеров, «Гектар». */}
        <div>
          <p className="text-sm font-medium">Где вы живёте?</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            От размера населённого пункта зависят сельская ипотека и подъёмные
            земских программ — в городах они не действуют.
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {SETTLEMENT_OPTIONS.map((o) => (
              <Choice
                key={o.value}
                active={settlementType === o.value}
                onClick={() => setSettlementType(o.value)}
              >
                {o.label}
              </Choice>
            ))}
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

        {pregnant && (
          <div className="rounded-2xl border bg-card p-3.5">
            <p className="text-sm font-medium">Какой у вас срок?</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              От срока зависят выплаты: пособие беременной жене призывника
              назначают с 180 дней, а некоторые региональные меры — только на
              ранних сроках.
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {PREGNANCY_OPTIONS.map((o) => (
                <Choice
                  key={o.value}
                  active={pregnancyStage === o.value}
                  onClick={() => setPregnancyStage(o.value)}
                >
                  {o.label}
                </Choice>
              ))}
            </div>

            {/* Двенадцать недель — рубеж, который стоит денег: единое пособие
                беременным положено только тем, кто встал на учёт до этого
                срока, и позже право уже не появится. */}
            <div className="mt-3.5">
              <p className="text-sm font-medium">
                Встали на учёт в женской консультации до 12 недель?
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Это условие единого пособия для беременных. Если срок ещё не
                вышел — успейте встать на учёт, потом право не появится.
              </p>
              <div className="mt-2 flex gap-2">
                <YesNo
                  value={registeredEarly}
                  onChange={setRegisteredEarly}
                  clearable
                />
              </div>
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

            {childCount >= 1 && (
              <div>
                <p className="text-sm font-medium">
                  {childCount === 1
                    ? "Когда родился ребёнок?"
                    : "Когда родились дети?"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Спрашиваем дату, а не возраст: возраст в анкете устаревает, и
                  через год подбор считал бы ребёнка младше, чем он есть. Месяц
                  можно не указывать — он важен только для малышей, у которых
                  меры меняются в полтора года.
                </p>
                <div className="mt-2 space-y-3">
                  {childBirths.map((b, i) => {
                    const years = ageYearsOf(b);
                    return (
                      <div key={i}>
                        <span className="text-xs text-muted-foreground">
                          {childCount === 1 ? "Ребёнок" : `${i + 1}-й ребёнок`}
                          {years != null ? ` — сейчас ${pluralYears(years)}` : ""}
                        </span>
                        <BirthSelect
                          value={b}
                          onChange={(v) => setBirthAt(i, v)}
                        />

                        {/* Взрослый ребёнок остаётся в составе семьи, пока
                            учится очно: до 23 лет держится статус многодетной
                            семьи и часть мер на самого ребёнка. */}
                        {years != null && years >= 18 && (
                          <div className="mt-2 rounded-xl border border-[#D9D2C6] bg-[#F7F4EE] px-3 py-2.5">
                            <p className="text-xs font-semibold text-[#3A4D63]">
                              Учится очно?
                            </p>
                            <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                              До 23 лет очная учёба сохраняет статус многодетной
                              семьи и меры на этого ребёнка.
                            </p>
                            <div className="mt-2 grid grid-cols-2 gap-2">
                              <Choice
                                active={b.studies === true}
                                onClick={() =>
                                  setBirthAt(i, { ...b, studies: true })
                                }
                              >
                                Да
                              </Choice>
                              <Choice
                                active={b.studies === false}
                                onClick={() =>
                                  setBirthAt(i, { ...b, studies: false })
                                }
                              >
                                Нет
                              </Choice>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
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

        {/* Уточнения только для студенческих семей: от уровня и формы обучения
            зависят перевод с платного на бюджет после рождения ребёнка,
            отсрочка оплаты и приостановка отработки по целевому договору. */}
        {student === true && (
          <div className="rounded-2xl border bg-card p-3.5">
            <p className="text-sm font-medium">Где учитесь?</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {STUDY_LEVEL_OPTIONS.map((o) => (
                <Choice
                  key={o.value}
                  active={studyLevel === o.value}
                  onClick={() => setStudyLevel(o.value)}
                >
                  {o.label}
                </Choice>
              ))}
            </div>

            <p className="mt-3.5 text-sm font-medium">Форма обучения</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              У платного обучения свои меры: перевод на бюджет после рождения
              ребёнка и отсрочка оплаты минимум на полгода.
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {STUDY_FUNDING_OPTIONS.map((o) => (
                <Choice
                  key={o.value}
                  active={studyFunding === o.value}
                  onClick={() => setStudyFunding(o.value)}
                >
                  {o.label}
                </Choice>
              ))}
            </div>

            <p className="mt-3.5 text-sm font-medium">
              Учитесь по целевому договору?
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Беременность и уход за ребёнком до трёх лет приостанавливают
              обязательства по договору — отработку не потеряете.
            </p>
            <div className="mt-2 flex gap-2">
              <YesNo value={targetedContract} onChange={setTargetedContract} />
            </div>
          </div>
        )}
          </div>
        )}

        {/* Экран 4: Работа и доход */}
        {step === 3 && (
          <div className="space-y-6">
        {/* Занятость одним деревом: сначала общий вопрос, потом уточнения —
            и только тем, кого они касаются.

            Раньше рядом стояли три отдельных вопроса: наём, самозанятость и
            ИП. Человек в декрете не попадал ни в один, хотя от того, откуда он
            в декрет ушёл, зависит почти всё: из вуза — академический отпуск и
            выплаты вуза, с работы — 40% заработка и меры работодателя, из
            самозанятости — декретных нет вовсе. */}
        <div className="rounded-2xl border bg-card p-3.5">
          <p className="text-sm font-medium">Работаете ли вы сейчас?</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            От занятости зависят выплаты и налоговые вычеты: вернуть можно
            только тот налог, который уже удержали.
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {EMPLOYMENT_OPTIONS.map((o) => (
              <Choice
                key={o.value}
                active={employmentStatus === o.value}
                onClick={() => chooseEmployment(o.value)}
              >
                {o.label}
              </Choice>
            ))}
          </div>

          {employmentStatus === "working" && (
            <div className="mt-3.5">
              <p className="text-sm font-medium">Как оформлены?</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Можно отметить несколько — многие совмещают наём с
                самозанятостью.
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {KIND_OPTIONS.map((o) => (
                  <Choice
                    key={o.value}
                    active={employmentKinds.includes(o.value)}
                    onClick={() => toggleKind(o.value)}
                  >
                    {o.label}
                  </Choice>
                ))}
              </div>
            </div>
          )}

          {employmentStatus === "parental-leave" && (
            <div className="mt-3.5">
              <p className="text-sm font-medium">А до декрета?</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                От этого зависит, что вам положено: у вчерашней студентки —
                академический отпуск, семейное общежитие и выплаты вуза, у
                работавшей по найму — 40% заработка и меры работодателя.
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {PREV_EMPLOYMENT_OPTIONS.map((o) => (
                  <Choice
                    key={o.value}
                    active={previousEmployment === o.value}
                    onClick={() => setPreviousEmployment(o.value)}
                  >
                    {o.label}
                  </Choice>
                ))}
              </div>
            </div>
          )}

          {employmentStatus === "not-working" && (
            <div className="mt-3.5">
              <p className="text-sm font-medium">
                Есть официальный статус безработного?
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Статус присваивает Служба занятости. Если его нет, меры для
                безработных всё равно покажем — с пометкой, что статус нужно
                оформить.
              </p>
              <div className="mt-2 flex gap-2">
                <YesNo value={unemployedStatus} onChange={setUnemployedStatus} />
              </div>
            </div>
          )}
        </div>

        {/* Уточнения для предпринимателей — в любой ветке, включая декрет. */}
        {needsTaxSystem && (
          <div className="rounded-2xl border bg-card p-3.5">
            <p className="text-sm font-medium">Ваша система налогообложения</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Свой НДФЛ предприниматель платит только на общей системе. На УСН,
              АУСН, НПД, патенте и ЕСХН налог другой, и возвращать нечего.
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(
                [
                  "osno",
                  "usn",
                  "ausn",
                  "npd",
                  "patent",
                  "eshn",
                  "unknown",
                ] as TaxSystem[]
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
        )}

        {/* НПД запрещает наёмных работников — спрашивать не о чем. */}
        {needsTaxSystem &&
          (taxSystem === "npd" ? (
            <p className="rounded-2xl border border-dashed bg-card px-3.5 py-3 text-xs text-muted-foreground">
              На НПД наёмных сотрудников быть не может — про них не спрашиваем.
            </p>
          ) : (
            <Question label="У вас есть наёмные сотрудники?">
              <YesNo value={hasEmployees} onChange={setHasEmployees} />
            </Question>
          ))}

        {/* Добровольные взносы: без них у предпринимателя нет права на
            декретные, а у самозанятого — на больничный. Роды добровольное
            страхование самозанятых не покрывает вовсе. */}
        {needsInsurance && (
          <div className="rounded-2xl border bg-card p-3.5">
            <p className="text-sm font-medium">
              Платили добровольные взносы на социальное страхование?
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              У предпринимателя декретные положены только при взносе,
              уплаченном до 31 декабря прошлого года. У самозанятых добровольное
              страхование покрывает больничные, но не беременность и роды.
            </p>
            <div className="mt-2 flex gap-2">
              <YesNo
                value={voluntaryInsurance}
                onChange={setVoluntaryInsurance}
                clearable
              />
            </div>
          </div>
        )}

        {/* Сфера работы вместо прежнего вопроса «вы работаете учителем?»:
            подъёмные по земским программам, IT-ипотека и жилищные кооперативы
            привязаны к профессии, а не к одной только педагогике. */}
        <div>
          <p className="text-sm font-medium">
            Кто-то из родителей работает в этих сферах?
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Можно отметить несколько. От сферы зависят подъёмные земских
            программ, льготная ипотека для ИТ и жилищные кооперативы.
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {WORK_FIELD_OPTIONS.map((o) => (
              <Choice
                key={o.value}
                active={(workFields ?? []).includes(o.value)}
                onClick={() => toggleWorkField(o.value)}
              >
                {o.label}
              </Choice>
            ))}
            <Choice
              active={workFields != null && workFields.length === 0}
              onClick={() => setWorkFields([])}
              className="col-span-2"
            >
              Не работаем в указанных сферах
            </Choice>
          </div>
        </div>

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
        {/* Жильё — обязательный блок.

            74 меры требуют статуса нуждающихся в улучшении жилищных условий, а
            статус присваивает администрация по заявлению. Раньше эти меры
            показывались всем подряд. Спрашивать «состоите на учёте?» одним
            вопросом мало: половина людей не знает ответа. Поэтому сами считаем
            основание по статье 51 Жилищного кодекса — своего жилья нет, метраж
            меньше учётной нормы или жильё аварийное — и показываем меру с
            плашкой «нужно встать на учёт» вместо того, чтобы прятать её. */}
        <div className="rounded-2xl border bg-card p-3.5">
          <p className="text-sm font-medium">Есть ли у вас своё жильё?</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            В собственности или по договору социального найма — у вас или у
            членов семьи.
          </p>
          <div className="mt-2 flex gap-2">
            <YesNo value={ownsHome} onChange={setOwnsHome} />
          </div>

          {ownsHome === true && (
            <div className="mt-3.5">
              <p className="text-sm font-medium">
                Площадь жилья и сколько человек в нём зарегистрировано
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Точную площадь можно не помнить — тогда оставьте поле пустым.
                Метраж нужен, чтобы понять, есть ли основание встать на учёт:
                норму устанавливает муниципалитет, обычно это 10–12 м² на
                человека.
              </p>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs text-muted-foreground">
                    Площадь, м²
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={1}
                    value={homeArea}
                    onChange={(e) => setHomeArea(e.target.value)}
                    placeholder="например, 54"
                    className="mt-1 w-full rounded-xl border border-black/[0.08] bg-white py-2.5 pl-3 pr-3 text-sm shadow-sm focus:border-[#1B3A6B]/40 focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-muted-foreground">
                    Человек прописано
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={residents}
                    onChange={(e) => setResidents(e.target.value)}
                    placeholder="например, 4"
                    className="mt-1 w-full rounded-xl border border-black/[0.08] bg-white py-2.5 pl-3 pr-3 text-sm shadow-sm focus:border-[#1B3A6B]/40 focus:outline-none"
                  />
                </label>
              </div>

              {areaPerPerson != null && (
                <p
                  className={cn(
                    "mt-2.5 rounded-xl px-3 py-2.5 text-xs leading-snug",
                    areaPerPerson < HOUSING_NORM_HINT
                      ? "bg-[#8E1D2C]/[0.06] text-[#8E1D2C]"
                      : "bg-black/[0.03] text-muted-foreground",
                  )}
                >
                  Получается {Math.round(areaPerPerson * 10) / 10} м² на
                  человека.{" "}
                  {areaPerPerson < HOUSING_NORM_HINT
                    ? "Похоже, у вас есть основание встать на учёт как нуждающимся — точную норму уточните в администрации по месту жительства."
                    : "По метражу оснований для постановки на учёт, скорее всего, нет."}
                </p>
              )}
            </div>
          )}
        </div>

        <Question label="Жильё признано аварийным или непригодным?">
          <YesNo value={homeUnfit} onChange={setHomeUnfit} />
        </Question>

        <div className="rounded-2xl border bg-card p-3.5">
          <p className="text-sm font-medium">
            Состоите на учёте как нуждающиеся в жилье?
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Это официальный статус: его присваивает администрация по заявлению.
            От него зависят «Молодая семья», социальный найм и жилищные
            выплаты. Если не знаете — так и ответьте, мы подскажем по метражу.
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <Choice
              active={housingNeed === "registered"}
              onClick={() => setHousingNeed("registered")}
            >
              Да
            </Choice>
            <Choice
              active={housingNeed === "no"}
              onClick={() => setHousingNeed("no")}
            >
              Нет
            </Choice>
            <Choice
              active={housingNeed === "unknown"}
              onClick={() => setHousingNeed("unknown")}
            >
              Не знаю
            </Choice>
          </div>
        </div>

        <Question label="Планируете покупку жилья или ипотеку?">
          <YesNo value={mortgageIntent} onChange={setMortgageIntent} />
        </Question>

        <div className="rounded-2xl border bg-card p-3.5">
          <p className="text-sm font-medium">Есть действующая ипотека?</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            При рождении третьего ребёнка государство погашает 450 000 ₽ по
            ипотеке, а в ряде регионов добавляет свою выплату сверху.
          </p>
          <div className="mt-2 flex gap-2">
            <YesNo value={hasMortgage} onChange={setHasMortgage} />
          </div>
        </div>
          </div>
        )}

        {/* Экран 6: Особые статусы */}
        {step === 5 && (
          <div className="space-y-6">
        <Question label="Кто-то из членов семьи является участником СВО?">
          <YesNo value={svoFamily} onChange={setSvoFamily} />
        </Question>

        {/* Уточнение обязательно: в базе 254 меры для семей участников СВО, и
            круг получателей у каждой свой. «Участвует сейчас» и «погиб»
            открывают совершенно разные наборы — от льгот на детский сад до
            выплаты пяти миллионов и второй пенсии. */}
        {svoFamily === true && (
          <div className="rounded-2xl border bg-card p-3.5">
            <p className="text-sm font-medium">Кто именно?</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Можно отметить несколько. От этого зависит, какие меры вам
              положены: у каждой выплаты свой круг получателей.
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {SVO_ROLE_OPTIONS.map((o) => (
                <Choice
                  key={o.value}
                  active={svoRoles.includes(o.value)}
                  onClick={() => toggleSvoRole(o.value)}
                >
                  {o.label}
                </Choice>
              ))}
            </div>
          </div>
        )}

        {/* Срочная служба — это не СВО, и меры совсем другие: беременной жене
            призывника положено единовременное пособие, а на ребёнка — выплата
            до трёх лет, а не до полутора, как обычно. */}
        <div className="rounded-2xl border bg-card p-3.5">
          <p className="text-sm font-medium">
            Муж проходит срочную службу по призыву?
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            У жён призывников свои выплаты: пособие по беременности и выплата на
            ребёнка до трёх лет. Это отдельные меры, не связанные с СВО.
          </p>
          <div className="mt-2 flex gap-2">
            <YesNo value={conscriptSpouse} onChange={setConscriptSpouse} />
          </div>
        </div>

        <Question label="В семье есть ветеран боевых действий?">
          <YesNo value={veteranCombat} onChange={setVeteranCombat} />
        </Question>

        <Question label="Семья пострадала от радиационных аварий (ЧАЭС, «Маяк»)?">
          <YesNo value={radiationAffected} onChange={setRadiationAffected} />
        </Question>

        {/* Трудная жизненная ситуация — основание для срочной помощи: путёвки
            в лагерь, вещевая помощь, кризисные центры, социальный контракт. */}
        <div className="rounded-2xl border bg-card p-3.5">
          <p className="text-sm font-medium">
            Семья в трудной жизненной ситуации?
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Пожар, чрезвычайная ситуация, потеря жилья или дохода. По этому
            основанию положены срочная помощь, путёвки в лагерь и социальный
            контракт.
          </p>
          <div className="mt-2 flex gap-2">
            <YesNo value={hardship} onChange={setHardship} />
          </div>
        </div>

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

            {/* Редкое заболевание оказалось здесь, а не в блоке про детей,
                хотя в проекте анкеты стояло там: это медицинские сведения, и
                им место в необязательном блоке, про который мы обещали, что
                отвечать не обязательно. */}
            <div>
              <p className="text-sm font-medium">
                У ребёнка редкое (орфанное) заболевание?
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Фонд «Круг добра» закупает дорогие лекарства и медизделия,
                которых нет в обычных региональных списках. Заявку подаёт
                лечащий врач через регион.
              </p>
              <div className="mt-2 flex gap-2">
                <YesNo value={rareDisease} onChange={setRareDisease} clearable />
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
      {/* Жильё пропускать нельзя: без ответов 74 меры показываются наугад. */}
      {step === 4 && !housingAnswered && (
        <p className="mt-6 rounded-xl border border-dashed border-[#1B3A6B]/30 bg-[#1B3A6B]/[0.04] px-4 py-3 text-xs leading-relaxed text-[#1B3A6B]">
          Ответьте на вопросы о жилье — от них зависят самые крупные меры:
          земельный участок, «Молодая семья», социальный найм и выплаты на
          погашение ипотеки.
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
            disabled={
              (step === 0 && !region) ||
              (step === 1 && tooManyChildren) ||
              (step === 4 && !housingAnswered)
            }
            className={cn(
              buttonVariants(),
              "h-12 flex-[2] text-base",
              ((step === 0 && !region) ||
                (step === 1 && tooManyChildren) ||
                (step === 4 && !housingAnswered)) &&
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
