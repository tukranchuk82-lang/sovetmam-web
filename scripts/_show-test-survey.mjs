import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const { data } = await sb.from("app_users").select("survey").eq("email", process.argv[2]).single();
const s = data?.survey ?? {};
console.log("children:      ", JSON.stringify(s.children));
console.log("childrenAges:  ", JSON.stringify(s.childrenAges));
console.log("младший:       ", s.youngestChildAgeYears, "| детей:", s.childrenCount, "| регион:", s.region);
