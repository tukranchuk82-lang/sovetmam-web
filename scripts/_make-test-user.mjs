// Временная учётка для проверки вёрстки анкеты. Удаляется скриптом
// _drop-test-user.mjs — в базе она не остаётся.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const email = process.argv[2];
const { data: exists } = await sb.from("app_users").select("id,email").eq("email", email).maybeSingle();
if (exists) { console.log("уже есть:", exists.id); process.exit(0); }
const { data, error } = await sb.from("app_users").insert({ email, first_name: "Проверка", last_name: "Вёрстки" }).select("id,email").single();
if (error) { console.error("ошибка:", error.message); process.exit(1); }
console.log("создан:", data.id, data.email);
