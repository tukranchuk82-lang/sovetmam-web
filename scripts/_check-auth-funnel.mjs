// Сколько людей бросает вход на шаге с кодом.
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

const users = await all("app_users", "id,email,created_at,email_verified_at,survey,messenger_connected", [["created_at", true]]);
const otps = await all("email_otps", "email,created_at,consumed_at,attempts", [["created_at", true]]);

const verified = users.filter((u) => u.email_verified_at);
console.log("АККАУНТЫ (запись создаётся при запросе кода)");
console.log("  всего:", users.length);
console.log("  дошли до ввода кода:", verified.length);
console.log("  бросили на коде:", users.length - verified.length, `(${Math.round((users.length - verified.length) / users.length * 100)}%)`);

console.log("\nКОДЫ");
console.log("  выпущено:", otps.length);
console.log("  введено верно (погашены):", otps.filter((o) => o.consumed_at).length);
console.log("  не введены:", otps.filter((o) => !o.consumed_at).length);
console.log("  с неудачными попытками:", otps.filter((o) => (o.attempts ?? 0) > 0 && !o.consumed_at).length);

const byEmail = new Map();
for (const o of otps) byEmail.set(o.email, (byEmail.get(o.email) ?? 0) + 1);
const repeat = [...byEmail.values()].filter((n) => n > 1).length;
console.log("  людей, запрашивавших код повторно:", repeat, "из", byEmail.size);

const week = Date.now() - 7 * 864e5;
const recent = users.filter((u) => new Date(u.created_at).getTime() >= week);
console.log("\nЗА 7 ДНЕЙ");
console.log("  новых записей:", recent.length, "· из них дошли до кода:", recent.filter((u) => u.email_verified_at).length);
