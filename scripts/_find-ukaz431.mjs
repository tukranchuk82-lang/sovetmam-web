// Разовая проверка: где в базе ссылаемся на Указ № 431 (утратил силу 23.01.2024)
// и есть ли вообще мера «компенсация ЖКУ многодетным не ниже 30%».
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
for (let from = 0; ; from += 1000) {
  const { data, error } = await sb.from("measures").select("*").range(from, from + 999);
  if (error) throw error;
  all = all.concat(data);
  if (data.length < 1000) break;
}
console.log("всего мер в базе:", all.length);

const hay = (m) => JSON.stringify(m).toLowerCase();

const ukaz431 = all.filter((m) => /431/.test(hay(m)) && /указ/.test(hay(m)));
console.log("\n--- ссылаются на Указ 431 (проверить: отменён) ---");
for (const m of ukaz431) console.log(" ", m.slug, "|", m.region || "федеральная", "|", m.title);
if (!ukaz431.length) console.log("  нет");

const zhku30 = all.filter(
  (m) => /жку|коммунальн/.test(hay(m)) && /30\s*%|30 процент/.test(hay(m)),
);
console.log("\n--- меры про ЖКУ с упоминанием 30% ---");
for (const m of zhku30) {
  console.log(" ", m.slug, "|", m.region || "федеральная", "|", m.title);
  console.log("      criteria:", JSON.stringify(m.criteria));
}

const zhkuMnogo = all.filter(
  (m) => /жку|коммунальн/.test(hay(m)) && (m.criteria?.minChildren >= 3),
);
console.log("\n--- меры про ЖКУ, адресованные многодетным (minChildren>=3):", zhkuMnogo.length, "---");
const byRegion = {};
for (const m of zhkuMnogo) (byRegion[m.region || "федеральная"] ??= []).push(m.slug);
console.log(JSON.stringify(byRegion, null, 2));
