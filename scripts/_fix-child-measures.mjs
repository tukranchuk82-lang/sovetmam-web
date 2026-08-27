// Пушкинская карта и образовательный кредит — их оформляет сам ребёнок.
// Ставим отметку (отдельный блок в конце подборки) и говорим об этом прямо
// в тексте карточки: первой строкой «кому положено».
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const NOTE = {
  "pushkinskaya-karta": "Карту ребёнок оформляет на себя сам: с 14 лет — через своё подтверждённое приложение «Госуслуги». Родитель может помочь с регистрацией и выбором мероприятий, но заявителем не будет.",
  "obrazovatelnyy-kredit": "Договор с банком подписывает сам студент — он и заёмщик. Родителю поручительство не нужно: кредит выдают без него. Родитель помогает выбрать программу и следит за сроками.",
};

const slugs = Object.keys(NOTE);
const { data, error } = await sb.from("measures").select("slug,title,eligibility").in("slug", slugs);
if (error) throw error;
writeFileSync("scripts/_backup-child-measures.json", JSON.stringify(data, null, 1), "utf8");
for (const m of data) {
  const note = NOTE[m.slug];
  const already = (m.eligibility ?? "").includes(note);
  const eligibility = already ? m.eligibility : [note, m.eligibility].filter(Boolean).join("\n");
  const { error: e } = await sb.from("measures")
    .update({ applies_by_child: true, eligibility })
    .eq("slug", m.slug);
  if (e) throw new Error(`${m.slug}: ${e.message}`);
  console.log(`${m.title} — отметка поставлена${already ? "" : ", текст дополнен"}`);
}
