// ЭКО показываем всем, у кого беременности сейчас нет, — и семьям с детьми
// тоже: бывает вторичное бесплодие, об этом прямо сказано в карточке.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { error } = await sb.from("measures").update({ criteria: { requiresNotPregnant: true } }).eq("slug", "eko-po-oms");
if (error) throw error;
console.log("ЭКО: показывается всем, кроме тех, кто сейчас ждёт ребёнка");
