// Две выплаты «при рождении» без срока — их ловили эталонные анкеты.
//
// chel-003: в описании прямо сказано «до достижения ребёнком одного года»
//   и «второго ребёнка» — ни того, ни другого в условиях не было.
// smol-001: единовременное пособие при рождении; областного срока обращения
//   в карточке нет, ставим общий для таких выплат — пока ребёнку нет года,
//   и показываем тем, кто ждёт ребёнка.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const PATCHES = {
  "chel-003": {
    criteria: {
      regions: ["Челябинская область"], requiresLowIncome: true,
      minChildren: 2, requiresChildren: true, childAgeToMonths: 12,
    },
  },
  "smol-001": {
    criteria: {
      regions: ["Смоленская область"], requiresFamily: true,
      childAgeToMonths: 12, appliesToExpecting: true,
    },
  },
};
for (const [slug, patch] of Object.entries(PATCHES)) {
  const { error } = await sb.from("measures").update(patch).eq("slug", slug);
  if (error) throw new Error(`${slug}: ${error.message}`);
  console.log(slug, "→", JSON.stringify(patch.criteria));
}
