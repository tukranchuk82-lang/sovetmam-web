// Разметка пачки №18: статус безработного, декрет, возраст подростков.
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// Временное трудоустройство подростков: одна и та же мера в трёх регионах.
const TEEN_JOB = (region) => ({
  regions: [region], requiresChildren: true,
  childAgeFromMonths: 14 * 12, childAgeToMonths: 18 * 12,
});

const CHANGES = {
  // Пособие платят до полутора лет ребёнка — в годах этот рубеж выразить было
  // нельзя, стояло «до года», и семьи с детьми 1–1,5 лет меру теряли.
  "posobie-po-uhodu-do-1-5-let": { requiresChildren: true, childAgeToMonths: 18 },
  // «Женщины в отпуске по уходу до 3 лет и неработающие мамы детей 0–7 лет».
  "besplatnoe-obuchenie-mam": { requiresFamily: true, childAgeToMonths: 7 * 12 },
  // «Многодетным родителям, зарегистрированным как ищущие работу».
  "ivn-021": {
    regions: ["Ивановская область"], minChildren: 3, requiresChildren: true,
    requiresUnemployedStatus: true,
  },
  // Пособие платят только тем, кого служба занятости признала безработным.
  // Метка оформляемая: без статуса меру покажем с плашкой, а не спрячем.
  "posobie-po-bezrabotice": {
    requiresFamily: true, requiresUnemployedStatus: true,
  },
  // Обучение во время отпуска по уходу за ребёнком.
  "amur-022": {
    regions: ["Амурская область"], requiresChildren: true,
    requiresParentalLeave: true, childAgeToMonths: 36,
  },
  "psk-008": {
    regions: ["Псковская область"], requiresChildren: true,
    requiresParentalLeave: true, childAgeToMonths: 36,
  },
  // Работа для подростков — мера про возраст ребёнка, а не про безработицу.
  "smol-022": TEEN_JOB("Смоленская область"),
  "brn-001": TEEN_JOB("Брянская область"),
  "ivn-023": TEEN_JOB("Ивановская область"),
  "chao-032": TEEN_JOB("Чукотский автономный округ"),
};

writeFileSync("scripts/_unemployed-checked.json", JSON.stringify([
  // Профобучение многодетных и семей участников СВО: статуса безработного не
  // требуется, достаточно обратиться в центр занятости.
  "saha-027", "ivn-039",
  // Разобраны и поправлены в этой же пачке.
  "posobie-po-uhodu-do-1-5-let", "besplatnoe-obuchenie-mam", "amur-022",
  "psk-008", "smol-022", "brn-001", "ivn-023", "chao-032",
], null, 1), "utf8");

const slugs = Object.keys(CHANGES);
const { data: before, error } = await sb.from("measures").select("slug,title,criteria").in("slug", slugs);
if (error) throw error;
writeFileSync("scripts/_backup-batch18.json", JSON.stringify(before, null, 1), "utf8");
for (const slug of slugs) {
  const { error: e } = await sb.from("measures").update({ criteria: CHANGES[slug] }).eq("slug", slug);
  console.log(e ? `ошибка ${slug}: ${e.message}` : `✔ ${slug}`);
}
