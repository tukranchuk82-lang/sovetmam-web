// Разметка пачки №19: трудная жизненная ситуация.
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const CHANGES = {
  // «Малоимущим семьям, пострадавшим от пожара».
  "krg-009": {
    regions: ["Курганская область"], requiresChildren: true,
    requiresLowIncome: true, requiresHardship: true,
  },
  // «Приёмным семьям, чьё жильё признано непригодным после пожара».
  "prim-022": {
    regions: ["Приморский край"], requiresChildren: true,
    requiresFosterParent: true, requiresHardship: true,
  },
  // «Если многодетная семья пострадала от пожара; доход не проверяют».
  "kostroma-008": {
    regions: ["Костромская область"], minChildren: 3, requiresChildren: true,
    requiresHardship: true,
  },
};

// Здесь «пожар» — про профилактику (установка извещателей, ремонт печей) либо
// про повышенный размер уже назначенной помощи, а не про условие меры.
writeFileSync("scripts/_hardship-checked.json", JSON.stringify([
  "ulyan-009", "lenobl-049", "ulyan-028", "mari-015", "kbr-010",
  "oren-023", "tver-008", "ryaz-008",
], null, 1), "utf8");

const slugs = Object.keys(CHANGES);
const { data: before, error } = await sb.from("measures").select("slug,title,criteria").in("slug", slugs);
if (error) throw error;
writeFileSync("scripts/_backup-batch19.json", JSON.stringify(before, null, 1), "utf8");
for (const slug of slugs) {
  const { error: e } = await sb.from("measures").update({ criteria: CHANGES[slug] }).eq("slug", slug);
  console.log(e ? `ошибка ${slug}: ${e.message}` : `✔ ${slug}`);
}
