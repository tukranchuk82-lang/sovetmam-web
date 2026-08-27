// Правки отбора по итогам теста заказчицы (27.08.2026).
//
// Она в Москве, работает, дети не младенцы, не беременна — и получила:
//   1) пособие по безработице (лечится движком: работающий не может стать
//      безработным, см. _patch-engine.mjs);
//   2) сертификат допобразования — в Москве его не выдают;
//   3) трудовые права беременных — она не беременна и не кормит;
//   4) московскую выплату при рождении — дети давно родились;
//   5) московскую выплату на продукты «детям до 3 лет» — детей до 3 нет.
//
// Запуск: node scripts/_fix-otbor-1.mjs [--apply]
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";

const env = {};
for (const l of readFileSync(".env.local", "utf8").split("\n")) {
  const s = l.trim(); if (!s || s.startsWith("#") || !s.includes("=")) continue;
  const i = s.indexOf("="); env[s.slice(0, i)] = s.slice(i + 1);
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const APPLY = process.argv.includes("--apply");

const PATCHES = {
  // В Москве системы сертификатов ПФДО нет: кружки записывают через mos.ru.
  "sertifikat-dopolnitelnogo-obrazovaniya": {
    criteria: {
      requiresChildren: true,
      hasChildAgedFrom: 5,
      hasChildAgedTo: 18,
      excludeRegions: ["Москва"],
    },
  },

  // Права на работе: нужны работающим, и только пока дети маленькие или
  // многодетным — до 14 лет младшему. Беременным тоже.
  "trudovye-prava-roditeley": {
    title: "Трудовые права родителей, беременных и студентов",
    criteria: {
      requiresEmployed: true,
      anyOf: [{ requiresPregnancy: true }, { maxYoungestChildAgeYears: 14 }],
    },
  },

  // Московская выплата при рождении: обращаться в течение полугода со дня
  // рождения, значит показываем только семьям с младенцем и тем, кто ждёт.
  "msk-edinovremennaya-pri-rozhdenii": {
    criteria: {
      regions: ["Москва"],
      requiresFamily: true,
      childAgeToMonths: 6,
      appliesToExpecting: true,
    },
  },

  // Выплата на продукты — только пока ребёнку нет трёх лет.
  "msk-rost-stoimosti-produktov": {
    criteria: {
      regions: ["Москва"],
      requiresChildren: true,
      childAgeToMonths: 36,
    },
  },
};

const slugs = Object.keys(PATCHES);
const { data: before, error } = await sb
  .from("measures").select("slug,title,criteria").in("slug", slugs);
if (error) throw error;
if (before.length !== slugs.length) {
  const found = before.map((m) => m.slug);
  throw new Error("не нашлись: " + slugs.filter((s) => !found.includes(s)).join(", "));
}
for (const m of before) {
  console.log(m.title);
  console.log("  было:", JSON.stringify(m.criteria));
  console.log("  стало:", JSON.stringify(PATCHES[m.slug].criteria));
}
if (!APPLY) { console.log("\nСухой прогон. Для записи: --apply"); process.exit(0); }
writeFileSync("scripts/_backup-otbor-1.json", JSON.stringify(before, null, 1), "utf8");
for (const slug of slugs) {
  const { error: e } = await sb.from("measures").update(PATCHES[slug]).eq("slug", slug);
  if (e) throw new Error(`${slug}: ${e.message}`);
}
console.log("\nзаписано:", slugs.length);
