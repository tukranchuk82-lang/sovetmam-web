// Тульская область: региональная карта поддержки «Zабота» — скидки у партнёров.
// Источник (клиент): zabota71.ru/regional-card. Для многодетных и семей СВО.
//
// Список партнёров огромный (десятки страниц по области) и постоянно меняется —
// не встраиваем его, описываем саму программу: скидки по категориям + льготное
// посещение спорт/культ-учреждений. Ссылку кладём только в source_url.
//
// Запуск: node scripts/_seed-tula-zabota.mjs [--apply]

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const TULA = "Тульская область";
const row = {
  slug: "tula-028",
  title: "Карта «Zабота» — скидки в магазинах и услугах (Тульская область)",
  short_description:
    "Региональная карта поддержки «Zабота» даёт многодетным семьям и семьям участников СВО скидки от 3 до 25% у партнёров проекта — магазинов, аптек, оптик и сервисов, а также бесплатное посещение муниципальных и региональных спортивных и культурных учреждений.",
  level: "regional",
  region: TULA,
  category: "Скидки в магазинах",
  amount:
    "Скидки 3–25% у партнёров (одежда, обувь, аптеки, оптика, стоматология, мебель, товары для дома и др.) + бесплатное посещение муниципальных и региональных спортивных и культурных учреждений",
  segments: ["class-discount", "topic-shops", "many-children", "svo-family"],
  criteria: {
    regions: [TULA],
    anyOf: [{ minChildren: 3 }, { requiresSvoFamily: true }],
  },
  how_to_apply: [
    "Подать заявление на региональном портале «Госуслуги71», отметив карту «Zабота», либо в МФЦ",
    "Выбрать удобный МФЦ для получения карты",
    "Получить карту и предъявлять её у партнёров, чтобы получить скидку",
  ],
  documents: [
    "Паспорт заявителя",
    "СНИЛС",
    "Документы, подтверждающие статус: удостоверение многодетной семьи либо документы участника СВО (члена его семьи)",
  ],
  tips: [
    "Скидка предоставляется при предъявлении карты у партнёра проекта.",
    "Кроме скидок, по карте можно бесплатно посещать муниципальные и региональные спортивные и культурные учреждения.",
    "К членам семьи участника СВО относятся супруг(а), дети и совместно проживающие родители.",
    "Партнёров много по всей области, и список регулярно пополняется — скидки действуют в магазинах одежды и обуви, аптеках, оптиках, у бытовых и медицинских услуг.",
  ],
  source_name: "Региональная карта поддержки «Zабота» (Тульская область)",
  source_url: "https://zabota71.ru/regional-card/shops",
  updated_at_label: "2026",
  is_published: true,
  sort_order: 0,
};

const APPLY = process.argv.includes("--apply");
if (!APPLY) {
  console.log("Сухой прогон — 1 мера:\n");
  console.log(" ", row.slug, JSON.stringify(row.criteria));
  console.log(" ", row.title);
  console.log("  amount:", row.amount);
  console.log("\nДля записи: node scripts/_seed-tula-zabota.mjs --apply");
  process.exit(0);
}

const { error } = await sb.from("measures").upsert(row, { onConflict: "slug" });
if (error) {
  console.log("FAIL", row.slug, "-", error.message);
  process.exit(1);
}
await sb
  .from("measures")
  .update({ verified_at: "2026-07-16T12:00:00+03:00", verified_by: "sverka" })
  .eq("slug", row.slug);
console.log("OK  ", row.slug, "— добавлена и помечена проверенной");
