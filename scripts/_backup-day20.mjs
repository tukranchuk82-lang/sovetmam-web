// Бэкап полных строк мер, попавших в сверку 20-го, — до внесения правок.
// Запуск: node scripts/_backup-day20.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "fs";

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

const REGIONS = ["Ростовская область", "Рязанская область", "Самарская область"];
const { data, error } = await sb.from("measures").select("*").in("region", REGIONS);
if (error) throw error;

writeFileSync("verification/backup-day-20.json", JSON.stringify(data, null, 2));
console.log(`бэкап: ${data.length} мер → verification/backup-day-20.json`);
for (const r of REGIONS) console.log(`  ${r}: ${data.filter((m) => m.region === r).length}`);
