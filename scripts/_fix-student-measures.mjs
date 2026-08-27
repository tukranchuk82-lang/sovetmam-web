// Меры для студентов — только если студент сам заявитель.
//
// В партии 1 я раскрыла их и на семьи, где студент — ребёнок. Это неверно:
// в приложении заявитель — родитель, а стипендию, академический отпуск и
// выплаты от вуза оформляет сам обучающийся. Родителю такая карточка в
// подборке ничего не даёт, только занимает место.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const SLUGS = [
  "stipendii-gosudarstvennye",
  "stipendii-prezidentskie-imennye",
  "akademicheskiy-otpusk",
  "vyplaty-studencheskim-semyam-ot-vuza",
];
for (const slug of SLUGS) {
  const { error } = await sb.from("measures").update({ criteria: { requiresStudent: true } }).eq("slug", slug);
  if (error) throw new Error(`${slug}: ${error.message}`);
  console.log("только родителю-студенту:", slug);
}
