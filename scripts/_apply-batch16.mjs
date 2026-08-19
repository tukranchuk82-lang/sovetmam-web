// Разметка пачки №16.
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const CHANGES = {
  // «Семьям с десятью и более детьми» — стояло «три ребёнка ИЛИ приёмная
  // семья», и выплату на машину видели семьи с тремя детьми.
  "saha-017": {
    regions: ["Республика Саха (Якутия)"], requiresChildren: true,
    minChildren: 10,
  },
  // «Студентам до 23 лет из малоимущих и многодетных семей» — стояло
  // «многодетные ИЛИ малоимущие ИЛИ студенческая семья», из-за чего меру
  // видели семьи вообще без студентов.
  "sah-030": {
    regions: ["Сахалинская область"], requiresChildren: true,
    requiresChildStudying: true,
    anyOf: [{ minChildren: 3 }, { requiresLowIncome: true }],
  },
  // «Детям погибших военнослужащих оплачивают обучение в колледжах и вузах».
  "sah-035": {
    regions: ["Сахалинская область"], requiresChildren: true,
    requiresSvoFamily: true, requiresChildStudying: true,
  },
};

const CHECKED = JSON.parse(readFileSync("scripts/_studying-checked.json", "utf8"));
CHECKED.push("bsh-004", "chao-015", "irkutsk-006", "krym-017");
writeFileSync("scripts/_studying-checked.json", JSON.stringify([...new Set(CHECKED)], null, 1), "utf8");

const slugs = Object.keys(CHANGES);
const { data: before, error } = await sb.from("measures").select("slug,title,criteria").in("slug", slugs);
if (error) throw error;
writeFileSync("scripts/_backup-batch16.json", JSON.stringify(before, null, 1), "utf8");
for (const slug of slugs) {
  const { error: e } = await sb.from("measures").update({ criteria: CHANGES[slug] }).eq("slug", slug);
  console.log(e ? `ошибка ${slug}: ${e.message}` : `✔ ${slug}`);
}
