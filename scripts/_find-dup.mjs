// Поиск возможных дублей перед загрузкой региональных мер: node scripts/_find-dup.mjs "питание" "молодая семья"
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

let all = [];
let from = 0;
while (true) {
  const { data, error } = await sb
    .from("measures")
    .select("slug,title,amount,region,level,is_published")
    .range(from, from + 999);
  if (error) throw error;
  all = all.concat(data);
  if (data.length < 1000) break;
  from += 1000;
}

for (const q of process.argv.slice(2)) {
  const hits = all.filter((m) => m.title.toLowerCase().includes(q.toLowerCase()) && m.level === "federal");
  console.log(`\n=== ФЕДЕРАЛЬНЫЕ по запросу "${q}" (${hits.length}) ===`);
  for (const m of hits) console.log(`  ${m.slug}${m.is_published ? "" : " [СКРЫТА]"} — ${m.title} | ${m.amount || "—"}`);
}
