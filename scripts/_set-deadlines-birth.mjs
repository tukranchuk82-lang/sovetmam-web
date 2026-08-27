// Будильник: сроки обращения после рождения ребёнка.
//
// В базе было девять машинных сроков на 2377 мер, поэтому плашка «скоро
// истечёт срок действия» в подборке почти никому не показывалась. Здесь —
// сроки, названные прямо в тексте карточек: их я вычитала по предложениям,
// а не по заголовкам.
//
// Заодно выравниваю возрастное окно в условиях: если по закону обратиться
// можно шесть месяцев, а в отборе стояло двенадцать, семья с восьмимесячным
// ребёнком видела меру, на которую права уже нет.
//
// Запуск: node scripts/_set-deadlines-birth.mjs [--apply]
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const APPLY = process.argv.includes("--apply");

/** slug → сколько месяцев со дня рождения есть на обращение. */
const MONTHS = {
  // Один месяц: набор новорождённому выдают в роддоме, при родах вне
  // медорганизации — обратиться в течение месяца.
  "vol-030": 1,

  // Полгода — самый частый региональный срок.
  "irkutsk-003": 6,
  "lenobl-006": 6,
  "msk-edinovremennaya-pri-rozhdenii": 6,
  "reg-altayskiy-kray-003": 6,
  "reg-altayskiy-kray-004": 6,
  "reg-altayskiy-kray-005": 6,
  "reg-kaliningradskaya-oblast-003": 6,
  "reg-novosibirskaya-oblast-013": 6,
  "spb-001": 6,
  "tat-005": 6,
  "volgograd-002": 6,
  "volgograd-003": 6,
  "volgograd-019": 6,
  "voronezh-002": 6,
  "voronezh-003": 6,
  "voronezh-005": 6,

  "chech-002": 9,

  // Год.
  "chel-002": 12,
  "dagestan-001": 12,
  "dagestan-002": 12,
  "dagestan-003": 12,
  "dagestan-004": 12,
  "moskva-vyplata-molodoy-semye": 12,
  "nnov-001": 12,
  "reg-kaliningradskaya-oblast-009": 12,
  "samara-001": 12,
  "tuva-001": 12,
  "vol-001": 12,
  "vol-002": 12,
  "vol-007": 12,

  // Полтора года: сюда же «зарплаты мам» — их платят до полутора лет
  // ребёнка, значит и обращаться есть смысл только до этого возраста.
  "reg-kaliningradskaya-oblast-002": 18,
  "spb-007": 18,
  "mrm-001": 18,
  "mrm-018": 18,
  "psk-032": 18,

  // Три года — ежемесячные выплаты на третьего ребёнка и капитал Тюмени.
  "bur-012": 36,
  "sve-002": 36,
  "tyumen-002": 36,
};

const NOTE = {
  "vol-030": "Набор выдают в роддоме при выписке. Если роды прошли вне медорганизации — обратиться нужно в течение месяца",
  "msk-edinovremennaya-pri-rozhdenii": "Шесть месяцев со дня рождения — жёсткий срок, после него право теряется",
  "voronezh-002": "Шесть месяцев со дня рождения — жёсткий срок, после него право теряется",
};

const slugs = Object.keys(MONTHS);
const { data: before, error } = await sb
  .from("measures")
  .select("slug,title,region,criteria,deadline")
  .in("slug", slugs);
if (error) throw error;
if (before.length !== slugs.length) {
  const found = before.map((m) => m.slug);
  throw new Error("не нашлись: " + slugs.filter((s) => !found.includes(s)).join(", "));
}

const updates = [];
for (const m of before) {
  const months = MONTHS[m.slug];
  const deadline = { kind: "after-birth", months, ...(NOTE[m.slug] ? { note: NOTE[m.slug] } : {}) };
  const c = { ...(m.criteria ?? {}) };
  let criteriaChanged = false;
  // Возрастное окно не должно быть шире срока обращения.
  if (c.childAgeToMonths != null && c.childAgeToMonths > months && months <= 18) {
    c.childAgeToMonths = months;
    criteriaChanged = true;
  }
  updates.push({ slug: m.slug, title: m.title, deadline, criteria: criteriaChanged ? c : null });
  console.log(
    `${m.slug.padEnd(34)} ${String(months).padStart(2)} мес.  ${criteriaChanged ? "· окно отбора сужено до " + months : ""}`,
  );
}
if (!APPLY) {
  console.log(`\nвсего: ${updates.length}. Сухой прогон, для записи: --apply`);
  process.exit(0);
}
writeFileSync("scripts/_backup-deadlines-birth.json", JSON.stringify(before, null, 1), "utf8");
for (const u of updates) {
  const patch = u.criteria ? { deadline: u.deadline, criteria: u.criteria } : { deadline: u.deadline };
  const { error: e } = await sb.from("measures").update(patch).eq("slug", u.slug);
  if (e) throw new Error(`${u.slug}: ${e.message}`);
}
console.log(`\nпроставлено сроков: ${updates.length}`);
