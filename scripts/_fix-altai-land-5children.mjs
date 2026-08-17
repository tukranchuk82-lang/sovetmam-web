// Мера Алтайского края «Компенсационная выплата взамен земельного участка»
// адресована семьям с ПЯТЬЮ и более детьми (так и в названии, и в описании,
// и в источнике — постановление № 451 от 30.11.2022). В условиях подбора
// стояло minChildren 3, из-за чего мера выпадала семьям с тремя детьми,
// которым эти 200 000 ₽ не положены.
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const SLUG = "reg-altayskiy-kray-012";
const { data: before, error: e1 } = await sb.from("measures").select("slug,criteria,segments").eq("slug", SLUG).single();
if (e1) throw e1;
writeFileSync(`scripts/_backup-${SLUG}.json`, JSON.stringify(before, null, 2), "utf8");
console.log("было:", JSON.stringify(before.criteria));

const criteria = { ...before.criteria, minChildren: 5 };
const { error: e2 } = await sb.from("measures").update({ criteria }).eq("slug", SLUG);
if (e2) throw e2;

const { data: after } = await sb.from("measures").select("criteria").eq("slug", SLUG).single();
console.log("стало:", JSON.stringify(after.criteria));
