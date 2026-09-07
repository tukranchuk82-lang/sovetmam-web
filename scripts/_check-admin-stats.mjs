// Проверка админских сводок после починки постраничного чтения.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function all(table, select, orders) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    let q = sb.from(table).select(select);
    for (const [col, asc] of orders) q = q.order(col, { ascending: asc });
    const { data, error } = await q.range(from, from + 999);
    if (error) throw error;
    out.push(...data);
    if (data.length < 1000) break;
  }
  return out;
}

const users = await all("app_users", "id,created_at,email_verified_at,survey,telegram_id,vk_id,max_id,utm_source", [["created_at", false], ["id", true]]);
const week = Date.now() - 7 * 864e5;
console.log("ПОЛЬЗОВАТЕЛИ");
console.log("  всего:", users.length);
console.log("  за 7 дней:", users.filter((u) => new Date(u.created_at).getTime() >= week).length);
console.log("  с анкетой:", users.filter((u) => u.survey).length);
console.log("  с мессенджером:", users.filter((u) => u.telegram_id || u.vk_id || u.max_id).length);
const dup = new Set(users.map((u) => u.id));
console.log("  уникальных id:", dup.size, dup.size === users.length ? "— дублей нет" : "— ЕСТЬ ДУБЛИ");

const events = await all("share_events", "kind,ref,visitor,created_at", [["created_at", false], ["id", true]]);
console.log("\nОТКУДА ПРИХОДЯТ");
console.log("  событий всего:", events.length);
const visits = events.filter((e) => e.kind === "visit");
console.log("  переходов:", visits.length, "· людей:", new Set(visits.map((v) => v.visitor).filter(Boolean)).size);
const bySource = new Map();
for (const v of visits) {
  const k = v.ref ?? "без метки";
  const c = bySource.get(k) ?? { visits: 0, people: new Set() };
  c.visits += 1; if (v.visitor) c.people.add(v.visitor);
  bySource.set(k, c);
}
for (const [k, c] of [...bySource.entries()].sort((a, b) => b[1].visits - a[1].visits)) {
  console.log(`    ${k}: ${c.people.size} чел. · ${c.visits} переходов`);
}
