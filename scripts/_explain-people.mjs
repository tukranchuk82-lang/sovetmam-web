// Чем «Пришло людей» отличается от числа пользователей.
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

const users = await all("app_users", "id,created_at,utm_source", [["id", true]]);
const events = await all("share_events", "kind,ref,visitor,user_id,created_at", [["created_at", false], ["id", true]]);
const visits = events.filter((e) => e.kind === "visit");

const withUtm = users.filter((u) => u.utm_source);
console.log("ПОЛЬЗОВАТЕЛИ (учётные записи)");
console.log("  всего:", users.length);
console.log("  пришли по размеченной ссылке (метка в профиле):", withUtm.length);
console.log("  без метки — напрямую, из поиска, из бота без метки:", users.length - withUtm.length);

const visitors = new Set(visits.map((v) => v.visitor).filter(Boolean));
console.log("\n«ПРИШЛО ЛЮДЕЙ» (устройства по размеченным ссылкам)");
console.log("  переходов:", visits.length);
console.log("  разных устройств:", visitors.size);
const known = visits.filter((v) => v.user_id);
console.log("  из них переходов от вошедших в приложение:", known.length, "· таких людей:", new Set(known.map((v) => v.user_id)).size);
console.log("  переходов от неизвестных (не вошли или гость):", visits.length - known.length);

const perVisitor = new Map();
for (const v of visits) if (v.visitor) perVisitor.set(v.visitor, (perVisitor.get(v.visitor) ?? 0) + 1);
const many = [...perVisitor.values()].filter((n) => n > 1).length;
console.log("  устройств с несколькими переходами:", many);
