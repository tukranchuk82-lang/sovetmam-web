// Что уехало в профиль по блоку занятости — новые поля и выведенные старые.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const { data } = await sb.from("app_users").select("survey").eq("email", process.argv[2]).single();
const s = data?.survey ?? {};
console.log("НОВЫЕ ПОЛЯ");
console.log("  статус занятости:", s.employmentStatus, "| до декрета:", s.previousEmployment);
console.log("  виды занятости:  ", JSON.stringify(s.employmentKinds), "| сферы:", JSON.stringify(s.workFields));
console.log("  взносы:", s.voluntaryInsurance, "| статус безработного:", s.unemployedStatus);
console.log("СТАРЫЕ ПОЛЯ (выведены из новых)");
console.log("  employed:", s.employed, "| selfEmployed:", s.selfEmployed, "| entrepreneur:", s.entrepreneur, "| teacher:", s.teacher);
console.log("  taxSystem:", s.taxSystem, "| hasEmployees:", s.hasEmployees, "| доход:", s.incomePm);
