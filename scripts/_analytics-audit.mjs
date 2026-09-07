// Что из запрошенной аналитики уже можно посчитать по имеющимся данным.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const all = async (t, sel, ord) => {
  const out = [];
  for (let f = 0; ; f += 1000) {
    let q = sb.from(t).select(sel);
    for (const [c, a] of ord) q = q.order(c, { ascending: a });
    const { data, error } = await q.range(f, f + 999);
    if (error) throw error;
    out.push(...data); if (data.length < 1000) break;
  }
  return out;
};

const users = await all("app_users", "id,created_at,utm_source,survey", [["id", true]]);
const saved = await all("saved_measures", "user_id,measure_slug,created_at", [["user_id", true], ["measure_slug", true]]);
const events = await all("share_events", "kind,ref,channel,visitor,created_at", [["created_at", true]]);

console.log("ЛЮДИ");
console.log("  в базе:", users.length, "· с меткой:", users.filter((u) => u.utm_source).length, "· без метки:", users.filter((u) => !u.utm_source).length);

const byRegion = new Map();
for (const u of users) {
  const r = u.survey?.region;
  if (r) byRegion.set(r, (byRegion.get(r) ?? 0) + 1);
}
console.log("\nРЕГИОНЫ (из анкеты)");
console.log("  анкету заполнили:", [...byRegion.values()].reduce((a, b) => a + b, 0), "· регион не known у:", users.length - [...byRegion.values()].reduce((a, b) => a + b, 0));
for (const [r, n] of [...byRegion.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)) console.log(`    ${n} · ${r}`);

console.log("\nИЗБРАННОЕ");
console.log("  сохранений всего:", saved.length, "· людей, кто сохранял:", new Set(saved.map((s) => s.user_id)).size);
const bySlug = new Map();
for (const s of saved) bySlug.set(s.measure_slug, (bySlug.get(s.measure_slug) ?? 0) + 1);
console.log("  разных мер сохраняли:", bySlug.size, "· топ-5:");
for (const [slug, n] of [...bySlug.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)) console.log(`    ${n} · ${slug}`);

console.log("\nСОБЫТИЯ");
const kinds = new Map();
for (const e of events) kinds.set(e.kind, (kinds.get(e.kind) ?? 0) + 1);
console.log("  по видам:", [...kinds.entries()].map(([k, n]) => `${k}=${n}`).join(", "));
const shares = events.filter((e) => e.kind === "share");
console.log("  поделились:", shares.length, "· устройств, которые делились:", new Set(shares.map((s) => s.visitor)).size);
const visits = events.filter((e) => e.kind === "visit");
console.log("  переходов по меткам:", visits.length, "· устройств:", new Set(visits.map((v) => v.visitor)).size);
const shareVisits = visits.filter((v) => v.ref === "share");
console.log("  из них по кнопке «Поделиться»:", shareVisits.length, "· устройств:", new Set(shareVisits.map((v) => v.visitor)).size);
console.log("\n  первое событие:", events[0]?.created_at?.slice(0, 10), "· последнее:", events.at(-1)?.created_at?.slice(0, 10));
