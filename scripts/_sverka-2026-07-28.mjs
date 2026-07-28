// Сверка 28.07.2026 — резервный день по графику: доработка спорных мер.
// Взят «школьный» блок (до 1 сентября месяц) из 56 мер с пометкой «требует уточнения».
//
// Подтверждено официальными источниками:
//   · Минсоцполитики Калининградской области (social.gov39.ru, раздел мер многодетным):
//     выплата на подготовку к школе — 5 000 ₽ на каждого ребёнка 6–18 лет, назначается
//     беззаявительно в период с 1 июля по 30 ноября тем, кто получает ежемесячную выплату
//     многодетным (2 217 ₽). Та же выплата 5 000 ₽ — детям погибших участников СВО.
//   · Минтруда и соцразвития Новосибирской области (mtsr.nso.ru/page/2134): выплаты
//     ПРИ ПОСТУПЛЕНИИ в колледж в области нет — есть компенсация 20 % (3–4 ребёнка)
//     и 30 % (5+) стоимости платного обучения по программам СПО, она уже заведена
//     как reg-novosibirskaya-oblast-006. Скрытая запись -004 описывает несуществующую меру.
//
// Запуск: node scripts/_sverka-2026-07-28.mjs           (сухой прогон)
//         node scripts/_sverka-2026-07-28.mjs --apply    (запись, с бэкапом)
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const APPLY = process.argv.includes("--apply");

const KLG = "Калининградская область";
const VERIFIED = {
  verified_at: "2026-07-28T12:00:00+00:00",
  verified_by: "сверка 28.07.2026 (резервный день, спорные меры)",
};

const patches = [
  {
    slug: "reg-kaliningradskaya-oblast-005",
    reason: "размер подтверждён: 5 000 ₽ на школьника 6–18 лет, беззаявительно — публикуем",
    fields: {
      ...VERIFIED,
      amount: "5 000 ₽ на каждого ребёнка-школьника",
      short_description:
        "Многодетной семье платят 5 000 ₽ на каждого ребёнка школьного возраста к новому учебному году. Заявление подавать не нужно — деньги приходят сами.",
      is_published: true,
      updated_at_label: "2026",
      criteria: {
        regions: [KLG],
        requiresChildren: true,
        minChildren: 3,
        hasChildAgedFrom: 6,
        hasChildAgedTo: 18,
      },
      how_to_apply: [
        "Ничего подавать не нужно: выплату назначают автоматически тем, кто получает ежемесячную выплату многодетным",
        "Если удостоверение многодетной семьи оформлено позже, обратиться в орган социальной защиты или МФЦ",
      ],
      documents: [
        "Отдельные документы не нужны — выплату назначают по имеющимся сведениям",
        "При обращении после оформления удостоверения: паспорт, удостоверение многодетной семьи, свидетельства о рождении детей",
      ],
      tips: [
        "Возраст ребёнка считают на 1 сентября: право есть на детей от 6 до 18 лет.",
        "Деньги перечисляют в период с 1 июля по 30 ноября, основная часть выплат приходит в начале июля.",
        "Условие — семья получает ежемесячную денежную выплату многодетным (2 217 ₽ в месяц).",
        "Если удостоверение многодетной семьи оформлено до 30 ноября, за выплатой можно обратиться до конца года.",
      ],
    },
  },
  {
    slug: "reg-kaliningradskaya-oblast-016",
    reason: "размер подтверждён: те же 5 000 ₽ на школьника 6–18 лет — публикуем",
    fields: {
      ...VERIFIED,
      amount: "5 000 ₽ на каждого ребёнка-школьника",
      short_description:
        "Семьям погибших участников СВО платят 5 000 ₽ на каждого ребёнка школьного возраста к новому учебному году. Заявление подавать не нужно.",
      is_published: true,
      updated_at_label: "2026",
      how_to_apply: [
        "Ничего подавать не нужно — выплату назначают автоматически по сведениям органов социальной защиты",
      ],
      documents: ["Отдельные документы не нужны — выплату назначают по имеющимся сведениям"],
      tips: [
        "Возраст ребёнка считают на 1 сентября: право есть на детей от 6 до 18 лет.",
        "Деньги перечисляют в период с 1 июля по 30 ноября.",
        "Выплата не заменяет других мер поддержки семьям погибших участников СВО — они назначаются отдельно.",
      ],
    },
  },
  {
    slug: "reg-kaliningradskaya-oblast-006",
    reason: "сумма 2 217 ₽ подтверждена на 28.07.2026 — обновляем метку года",
    fields: {
      ...VERIFIED,
      amount: "2 217 ₽ в месяц",
      updated_at_label: "2026",
    },
  },
];

// Запись описывает меру, которой в области нет (проверено на сайте министерства).
const deletions = [
  {
    slug: "reg-novosibirskaya-oblast-004",
    reason:
      "выплаты при поступлении в колледж в Новосибирской области не существует; действует компенсация 20/30 % стоимости платного обучения СПО — она уже заведена как reg-novosibirskaya-oblast-006",
  },
];

const slugs = [...patches.map((p) => p.slug), ...deletions.map((d) => d.slug)];
const { data: current, error } = await sb.from("measures").select("*").in("slug", slugs);
if (error) throw error;

console.log("=== Правки ===");
for (const p of patches) {
  const cur = current.find((m) => m.slug === p.slug);
  console.log(`~ ${p.slug} — ${cur ? cur.title : "НЕ НАЙДЕНА"}`);
  console.log(`    было: ${cur?.amount ?? "—"}${cur && !cur.is_published ? " [СКРЫТА]" : ""}`);
  console.log(`    станет: ${p.fields.amount ?? cur?.amount}${p.fields.is_published ? " [ОПУБЛИКОВАНА]" : ""}`);
  console.log(`    ${p.reason}`);
}
console.log("\n=== Удаления ===");
for (const d of deletions) {
  const cur = current.find((m) => m.slug === d.slug);
  console.log(`− ${d.slug} — ${cur ? cur.title : "НЕ НАЙДЕНА"}`);
  console.log(`    ${d.reason}`);
}

if (!APPLY) {
  console.log("\nСухой прогон. Для записи: node scripts/_sverka-2026-07-28.mjs --apply");
  process.exit(0);
}

const backup = "verification/backup-2026-07-28-disputed.json";
writeFileSync(backup, JSON.stringify(current, null, 2), "utf8");
console.log(`\nБэкап: ${backup}`);

for (const p of patches) {
  const { error: e } = await sb.from("measures").update(p.fields).eq("slug", p.slug);
  if (e) throw e;
  console.log(`Обновлено: ${p.slug}`);
}
for (const d of deletions) {
  const { error: e } = await sb.from("measures").delete().eq("slug", d.slug);
  if (e) throw e;
  console.log(`Удалено: ${d.slug}`);
}
