// Заходит ли кто-то под одним аккаунтом с разных устройств.
//
// Прямого «журнала входов» у нас нет, поэтому смотрим два следа:
//   share_events.visitor — анонимный номер браузера из cookie: если у одного
//     user_id их несколько, значит человек открывал приложение с разных
//     устройств или браузеров;
//   push_subscriptions — подписка на уведомления заводится на каждое
//     устройство отдельно.
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

const events = await all("share_events", "user_id,visitor,user_agent,created_at", [["created_at", true]]);
const withUser = events.filter((e) => e.user_id && e.visitor);
const byUser = new Map();
for (const e of withUser) {
  const set = byUser.get(e.user_id) ?? new Set();
  set.add(e.visitor);
  byUser.set(e.user_id, set);
}
const multi = [...byUser.entries()].filter(([, s]) => s.size > 1);
console.log("СЛЕД 1 — cookie устройства в событиях");
console.log("  людей, чьи события вообще записаны:", byUser.size);
console.log("  из них заходили с двух и более устройств:", multi.length);
for (const [id, s] of multi.slice(0, 10)) console.log(`     ${id.slice(0, 8)}… — устройств: ${s.size}`);

let push = [];
try {
  push = await all("push_subscriptions", "user_id,endpoint,created_at", [["created_at", true]]);
} catch (e) {
  console.log("\n  (подписок на уведомления прочитать не удалось: " + e.message + ")");
}
if (push.length) {
  const byUserPush = new Map();
  for (const p of push) {
    if (!p.user_id) continue;
    const set = byUserPush.get(p.user_id) ?? new Set();
    set.add(p.endpoint);
    byUserPush.set(p.user_id, set);
  }
  const multiPush = [...byUserPush.entries()].filter(([, s]) => s.size > 1);
  console.log("\nСЛЕД 2 — подписки на уведомления");
  console.log("  всего подписок:", push.length, "· людей с подписками:", byUserPush.size);
  console.log("  из них с двумя и более устройствами:", multiPush.length);
}

// Сколько устройств приходится на аккаунты, где след есть.
const sizes = [...byUser.values()].map((s) => s.size).sort((a, b) => b - a);
console.log("\nБольше всего устройств у одного аккаунта:", sizes[0] ?? 0);
