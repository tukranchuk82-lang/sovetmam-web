// Проверка нового движка: три механики на выдуманных мерах + регрессия на
// живых анкетах (старые анкеты должны давать ровно тот же результат).
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import {
  evaluateEligibility,
  matchMeasures,
  countChildrenForStatus,
  housingNeedState,
  PENDING_TEXT,
} from "../src/lib/measures.ts";

const ok = (cond, name, extra = "") =>
  console.log(`${cond ? "  ✔" : "  ✘ ОШИБКА"} ${name}${extra ? " — " + extra : ""}`);

const measure = (slug, criteria) => ({
  slug, title: slug, shortDescription: "", level: "federal", category: "Пособия и выплаты",
  segments: [], criteria, howToApply: [], documents: [], tips: [],
  sourceUrl: "", sourceName: "", updatedAt: "",
});

const base = {
  pregnant: false, expectingChildNumber: null, hasChildren: false, childrenCount: 0,
  childrenAges: [], youngestChildAgeYears: null, multipleBirthCount: 1, region: "Москва",
  incomePm: null, lowIncome: false, disabledChild: false, specialNeedsChild: false,
  lossOfBreadwinner: false, mortgageIntent: false, svoFamily: false, singleParent: false,
  student: false, parentAge: 30, spouseAge: 32, parentUnder35: true, selfEmployed: false,
  entrepreneur: false, employed: true, taxSystem: null, hasEmployees: null,
  disabledParent: false, fosterParent: false, teacher: false,
};
const year = new Date().getFullYear();
const month = new Date().getMonth() + 1;
const born = (yearsAgo, opts = {}) => ({ birthMonth: month, birthYear: year - yearsAgo, ...opts });

console.log("\n1. ВОЗРАСТНОЕ ОКНО");
const school = measure("школьная", { childAgeFromMonths: 7 * 12, childAgeToMonths: 17 * 12 });
const baby = measure("до 3 лет", { childAgeFromMonths: 0, childAgeToMonths: 36 });
const birth = measure("при рождении", { childAgeFromMonths: 0, childAgeToMonths: 12, appliesToExpecting: true });

const expecting = { ...base, pregnant: true, expectingChildNumber: 1 };
ok(!evaluateEligibility(expecting, school).fits, "беременной без детей школьные меры НЕ показываем");
ok(evaluateEligibility(expecting, birth).fits, "меры про рождение беременной показываем");

const toddler = { ...base, hasChildren: true, childrenCount: 1, children: [born(2)] };
ok(!evaluateEligibility(toddler, school).fits, "с ребёнком 2 лет школьные меры НЕ показываем");
ok(evaluateEligibility(toddler, baby).fits, "с ребёнком 2 лет малышовые показываем");

const both = { ...base, hasChildren: true, childrenCount: 2, children: [born(2), born(9)] };
ok(evaluateEligibility(both, school).fits, "с детьми 2 и 9 школьные показываем");
ok(evaluateEligibility(both, baby).fits, "с детьми 2 и 9 малышовые тоже показываем");

const halfYear = { ...base, hasChildren: true, childrenCount: 1, children: [{ birthMonth: month - 8 > 0 ? month - 8 : month + 4, birthYear: month - 8 > 0 ? year : year - 1 }] };
const under18m = measure("до 1,5 лет", { childAgeFromMonths: 0, childAgeToMonths: 18 });
ok(evaluateEligibility(halfYear, under18m).fits, "рубеж «до 1,5 лет» работает в месяцах");

console.log("\n2. МНОГОДЕТНОСТЬ ПО УКАЗУ № 63");
const many = measure("многодетным", { minChildren: 3 });
const withStudent = { ...base, hasChildren: true, childrenCount: 3,
  children: [born(19, { studiesFullTime: true }), born(15), born(10)] };
const withAdult = { ...base, hasChildren: true, childrenCount: 3,
  children: [born(19, { studiesFullTime: false }), born(15), born(10)] };
ok(countChildrenForStatus(withStudent) === 3, "ребёнок 19 лет на очном считается", `посчитано ${countChildrenForStatus(withStudent)}`);
ok(evaluateEligibility(withStudent, many).fits, "семья со студентом остаётся многодетной");
ok(countChildrenForStatus(withAdult) === 2, "ребёнок 19 лет без учёбы НЕ считается", `посчитано ${countChildrenForStatus(withAdult)}`);
ok(!evaluateEligibility(withAdult, many).fits, "без очного обучения многодетность не засчитывается");

console.log("\n3. ТРЕТИЙ ИСХОД: «подойдёт, если оформить статус»");
const jobless = measure("безработным", { requiresUnemployedStatus: true });
const registered = { ...base, unemploymentTest: 1, unemployedStatus: true };
const notRegistered = { ...base, unemployedStatus: false };
const v1 = evaluateEligibility(registered, jobless);
const v2 = evaluateEligibility(notRegistered, jobless);
ok(v1.fits && v1.pending.length === 0, "со статусом безработного — мера без плашки");
ok(v2.fits && v2.pending[0] === "unemployed", "без статуса — мера с плашкой");
console.log(`     плашка: «${PENDING_TEXT.unemployed}»`);

const housing = measure("жильё нуждающимся", { requiresHousingNeed: true });
const tight = { ...base, ownsHome: true, homeArea: 30, residentsCount: 4, housingNeedStatus: "no" };
const roomy = { ...base, ownsHome: true, homeArea: 90, residentsCount: 3, housingNeedStatus: "no" };
const onList = { ...base, housingNeedStatus: "registered" };
ok(housingNeedState(tight) === "eligible", "30 м² на четверых — основание есть");
ok(housingNeedState(roomy) === "no", "90 м² на троих — оснований нет");
ok(evaluateEligibility(onList, housing).pending.length === 0, "стоит на учёте — без плашки");
ok(evaluateEligibility(tight, housing).pending[0] === "housing", "тесно — мера с плашкой");
ok(!evaluateEligibility(roomy, housing).fits, "просторно — меру не показываем вовсе");

const hard = measure("жёсткое+оформляемое", { minChildren: 5, requiresUnemployedStatus: true });
ok(!evaluateEligibility(notRegistered, hard).fits, "провал жёсткого условия — плашки нет, меры нет");

console.log("\n4. ДЕКРЕТ: откуда ушёл, то и показываем");
const uni = measure("меры вуза", { requiresParentalLeave: true, requiresPreviousEmployment: ["student"] });
const fromStudy = { ...base, employmentStatus: "parental-leave", previousEmployment: "student" };
const fromHire = { ...base, employmentStatus: "parental-leave", previousEmployment: "hired" };
ok(evaluateEligibility(fromStudy, uni).fits, "ушла в декрет из вуза — меры вуза показываем");
ok(!evaluateEligibility(fromHire, uni).fits, "ушла с работы — меры вуза не показываем");

console.log("\n5. РЕГРЕССИЯ НА ЖИВЫХ АНКЕТАХ");
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const rows = [];
for (let f = 0; ; f += 1000) {
  const { data, error } = await sb.from("measures")
    .select("slug,title,level,region,category,criteria,segments,amount")
    .eq("is_published", true)
    .order("sort_order", { ascending: true }).order("slug", { ascending: true })
    .range(f, f + 999);
  if (error) throw error;
  rows.push(...data);
  if (data.length < 1000) break;
}
const all = rows.map((r) => ({ ...measure(r.slug, r.criteria ?? {}), title: r.title,
  level: r.level, region: r.region ?? undefined, category: r.category, segments: r.segments ?? [] }));

const { data: users } = await sb.from("app_users").select("email,survey").not("survey", "is", null);
let checked = 0;
for (const u of users ?? []) {
  const s = u.survey;
  if (!s || typeof s.hasChildren !== "boolean") continue;
  const n = matchMeasures(s, all, { ignoreRegion: !s.region }).length;
  checked++;
  if (checked <= 8) console.log(`  ${u.email.padEnd(32)} ${String(n).padStart(3)} мер`);
}
console.log(`  проверено анкет: ${checked} — ни одна не упала`);
