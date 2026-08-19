// Разметка пачки №20: декрет, срочная служба супруга, село.
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const CHANGES = {
  // Декретные для ИП и самозанятых показывались всем беременным подряд:
  // в условиях стояла только беременность. Право зависит от добровольных
  // взносов — метка оформляемая, поэтому без взносов мера не пропадёт, а
  // выйдет с плашкой, что взнос нужно успеть внести до 31 декабря.
  "dekretnye-dlya-ip-samozanyatyh": {
    requiresFamily: true, requiresPregnancy: true,
    requiresVoluntaryInsurance: true,
    anyOf: [{ requiresSelfEmployed: true }, { requiresEntrepreneur: true }],
  },
  // Пособие беременной жене военнослужащего по призыву тоже показывалось всем
  // беременным. Нужен муж на срочной службе и срок от 180 дней.
  "posobie-beremennoy-zhene-prizyvnika": {
    requiresPregnancy: true, requiresConscriptSpouse: true,
    minPregnancyWeeks: 26,
  },
  // Пособие на ребёнка военнослужащего по призыву стояло с меткой СВО — это
  // разные истории: здесь срочная служба, и выплата идёт до трёх лет.
  "posobie-na-rebenka-voennosluzhashego-po-prizyvu": {
    requiresChildren: true, requiresConscriptSpouse: true,
    childAgeToMonths: 36,
  },
  // «Беременным жёнам участников СВО» — стояло «беременность ИЛИ семья СВО»,
  // из-за чего пособие видела любая беременная области.
  "lenobl-002": {
    regions: ["Ленинградская область"], requiresPregnancy: true,
    requiresSvoFamily: true,
  },
  // Обучение во время отпуска по уходу за ребёнком.
  "pnz-004": {
    regions: ["Пензенская область"], requiresChildren: true,
    requiresParentalLeave: true, childAgeToMonths: 36,
  },
  // Выплата сельским женщинам была исключена из подбора, потому что мы не
  // умели спрашивать про село. Теперь умеем — возвращаем меру в подбор.
  "tat-005": {
    regions: ["Республика Татарстан"], requiresFamily: true,
    requiresSettlement: ["village", "small-town"],
    childAgeToMonths: 12, appliesToExpecting: true,
  },
};

writeFileSync("scripts/_leave-checked.json", JSON.stringify([
  "trudovye-prava-roditeley", "posobie-po-bezrabotice", "besplatnoe-obuchenie-mam",
], null, 1), "utf8");
writeFileSync("scripts/_conscript-checked.json", JSON.stringify([
  // «Дети военнослужащих по призыву» влияет на размер пособия, а не на право.
  "reg-altayskiy-kray-003", "krdadd-001", "saratov-003", "msk-rost-zhizni-otdelnye",
], null, 1), "utf8");
writeFileSync("scripts/_village-checked.json", JSON.stringify([
  // «Отдалённые посёлки» здесь — про районный коэффициент и про доставку в
  // роддом, а не про сельскую местность как условие.
  "nao-024", "transport-do-roddoma", "chao-019", "chao-024", "chao-022",
], null, 1), "utf8");

const slugs = Object.keys(CHANGES);
const { data: before, error } = await sb.from("measures").select("slug,title,criteria").in("slug", slugs);
if (error) throw error;
writeFileSync("scripts/_backup-batch20.json", JSON.stringify(before, null, 1), "utf8");
for (const slug of slugs) {
  const { error: e } = await sb.from("measures").update({ criteria: CHANGES[slug] }).eq("slug", slug);
  console.log(e ? `ошибка ${slug}: ${e.message}` : `✔ ${slug}`);
}
