// Семейная налоговая выплата: приём заявлений за 2025 год идёт с 1 июня по
// 1 октября 2026 года — то есть прямо сейчас. В карточке об этом не было
// сказано прямо, а до конца срока меньше двух месяцев.
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
const env = {};
for (const l of readFileSync(".env.local", "utf8").split("\n")) {
  const s = l.trim(); if (!s || s.startsWith("#") || !s.includes("=")) continue;
  const i = s.indexOf("="); env[s.slice(0, i)] = s.slice(i + 1);
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");

const { data: before } = await sb.from("measures")
  .select("slug,eligibility,how_to_apply,tips").eq("slug", "semeynaya-nalogovaya-vyplata-2025").single();

const eligibility = before.eligibility.replace(
  "Семейная налоговая выплата действует с 1 января 2026 года: государство возвращает работающим родителям часть уплаченного налога на доходы — разницу между удержанным налогом и налогом по ставке 6 %.",
  "Семейная налоговая выплата действует с 1 января 2026 года: государство возвращает работающим родителям часть уплаченного налога на доходы — разницу между удержанным налогом и налогом по ставке 6 %. Прямо сейчас идёт приём заявлений за 2025 год: он закончится 1 октября 2026 года.",
);

const howToApply = [...before.how_to_apply];
howToApply[0] = "Подайте заявление в окно приёма: с 1 июня по 1 октября года, следующего за отчётным. Сейчас, до 1 октября 2026 года, принимают заявления по налогу, уплаченному в 2025 году.";

const tips = before.tips.map((t) =>
  t.startsWith("Первые заявления по доходам 2026 года")
    ? "Заявления за 2025 год принимают до 1 октября 2026 года — пропустив срок, вернуть налог за этот год уже не получится."
    : t,
);

console.log("правки:");
console.log("  «кому положено» — добавлено про текущий приём");
console.log("  первый шаг переписан:", howToApply[0].slice(0, 80) + "…");
console.log("  заметка про сроки:", tips.find((t) => t.includes("до 1 октября 2026"))?.slice(0, 80) + "…");

if (!APPLY) { console.log("\nСухой прогон. Для записи: --apply"); process.exit(0); }
writeFileSync("scripts/_backup-semeynaya-vyplata.json", JSON.stringify(before, null, 1), "utf8");
const { error } = await sb.from("measures")
  .update({ eligibility, how_to_apply: howToApply, tips })
  .eq("slug", "semeynaya-nalogovaya-vyplata-2025");
if (error) throw error;
console.log("\nзаписано");
