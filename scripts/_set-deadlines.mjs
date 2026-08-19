// Проставляем сроки подачи ключевым федеральным мерам.
// Каждый срок взят из текста самой меры либо из книги Буцкой (главы 5, 8, 20).
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const DEADLINES = {
  // «Подать заявление нужно в течение 6 месяцев после рождения ребёнка,
  // иначе выплата сгорает» — прямо в тексте меры.
  "edinovremennoe-pri-rozhdenii-rebenka": { kind: "after-birth", months: 6 },
  // «Подать заявление в СФР можно с 1 июня по 1 октября» — в тексте меры.
  "semeynaya-nalogovaya-vyplata-2025": {
    kind: "year-window", fromMonth: 6, fromDay: 1, toMonth: 10, toDay: 1,
  },
  // Единое пособие беременным положено вставшим на учёт до 12 недель.
  "edinoe-posobie": { kind: "pregnancy-weeks", weeks: 12 },
  // «Оформить можно не позднее 6 месяцев после окончания срочной службы» —
  // дату окончания службы анкета не знает, поэтому показываем текстом.
  "posobie-na-rebenka-voennosluzhashego-po-prizyvu": {
    kind: "note",
    note: "Оформить можно не позднее 6 месяцев после окончания срочной службы — потом право сгорает",
  },
};

const { data: before, error: e1 } = await sb
  .from("measures").select("slug,title,deadline").in("slug", Object.keys(DEADLINES));
if (e1) throw e1;
writeFileSync("scripts/_backup-deadlines.json", JSON.stringify(before, null, 1), "utf8");

const found = new Set(before.map((m) => m.slug));
for (const slug of Object.keys(DEADLINES)) {
  if (!found.has(slug)) { console.log(`НЕ НАЙДЕНА: ${slug}`); continue; }
  const { error } = await sb.from("measures").update({ deadline: DEADLINES[slug] }).eq("slug", slug);
  console.log(error ? `ошибка ${slug}: ${error.message}` : `✔ ${slug}`);
}

const { data: after } = await sb
  .from("measures").select("slug,title,deadline").not("deadline", "is", null);
console.log(`\nмер со сроком: ${after.length}`);
for (const m of after) console.log(`  ${m.title.slice(0, 55)} → ${JSON.stringify(m.deadline)}`);
