// ЭКО возвращаем в подбор, но только тем, у кого детей ещё нет: анкета про
// бесплодие не спрашивает, а для планирующих это одна из главных мер.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { error } = await sb.from("measures").update({ criteria: { requiresNoChildren: true } }).eq("slug", "eko-po-oms");
if (error) throw error;
console.log("ЭКО: показывается семьям без детей");
