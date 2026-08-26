// Лекарства детям: многодетным они положены, пока младшему нет шести лет.
// Стояло просто «трое детей» — мера выпадала многодетным с подростками.
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
const env = {};
for (const l of readFileSync(".env.local", "utf8").split("\n")) {
  const s = l.trim(); if (!s || s.startsWith("#") || !s.includes("=")) continue;
  const i = s.indexOf("="); env[s.slice(0, i)] = s.slice(i + 1);
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");

const CRITERIA = {
  requiresChildren: true,
  anyOf: [
    { maxYoungestChildAgeYears: 3 },
    { minChildren: 3, maxYoungestChildAgeYears: 6 },
  ],
};

const { data: before } = await sb.from("measures").select("slug,criteria").eq("slug", "besplatnye-lekarstva-detyam").single();
console.log("было: ", JSON.stringify(before.criteria));
console.log("станет:", JSON.stringify(CRITERIA));
if (!APPLY) { console.log("\nСухой прогон. Для записи: --apply"); process.exit(0); }
writeFileSync("scripts/_backup-lekarstva.json", JSON.stringify(before, null, 1), "utf8");
const { error } = await sb.from("measures").update({ criteria: CRITERIA }).eq("slug", "besplatnye-lekarstva-detyam");
if (error) throw error;
console.log("записано");
