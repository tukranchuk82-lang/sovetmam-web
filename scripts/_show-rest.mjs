// Что уехало в профиль по новым вопросам анкеты v2.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const { data } = await sb.from("app_users").select("survey").eq("email", process.argv[2]).single();
const s = data?.survey ?? {};
console.log("населённый пункт:", s.settlementType, "| регион:", s.region);
console.log("беременность:", s.pregnant, "| срок:", s.pregnancyStage, "| учёт до 12 недель:", s.registeredEarly);
console.log("учёба:", s.student, "| уровень:", s.studyLevel, "| форма:", s.studyFunding, "| целевой:", s.targetedContract);
console.log("СВО:", s.svoFamily, "| роли:", JSON.stringify(s.svoRoles));
console.log("призывник:", s.conscriptSpouse, "| ветеран БД:", s.veteranCombat, "| радиация:", s.radiationAffected, "| ТЖС:", s.hardship);
console.log("жильё: своё —", s.ownsHome, "| аварийное:", s.homeUnfit, "| учёт:", s.housingNeedStatus, "| ипотека:", s.hasMortgage);
console.log("редкое заболевание:", s.rareDisease);
