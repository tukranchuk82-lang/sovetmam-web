// Разбор склеенной федеральной карточки про ЖКУ.
//
// Что было не так: subsidiya-zhku-maloimushchim-svo смешивала три разные меры и
// приписывала малоимущим «не менее 30%» — цифру, которая относится к многодетным
// (п. 6«а» Указа Президента от 23.01.2024 № 63, причём это рекомендация регионам,
// а не федеральная гарантия). У субсидии по ст. 159 ЖК РФ фиксированного процента
// нет вовсе: она считается от превышения максимально допустимой доли расходов.
//
// Что делаем:
//   1) subsidiya-zhku-maloimushchim-svo — переписываем в чистую субсидию по
//      ст. 159 ЖК РФ: без 30%, без участников СВО;
//   2) kompensaciya-zhku-vbd-svo — заводим отдельную меру для ветеранов боевых
//      действий (участники СВО признаны ВБД): 50% ПЛАТЫ ЗА ЖИЛОЕ ПОМЕЩЕНИЕ по
//      пп. 5 п. 1 ст. 16 ФЗ № 5-ФЗ. Коммунальные услуги в неё НЕ входят — это
//      частая ошибка вторичных источников, поэтому оговорено и в описании, и в tips.
//
// Меру «30% многодетным» федеральной картой не заводим: она реализуется актами
// субъектов и уже разложена по регионам (63 карточки в 59 субъектах).
//
// Запуск: node scripts/_fix-zhku-federal.mjs          (сухой прогон)
//         node scripts/_fix-zhku-federal.mjs --apply   (запись)
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const APPLY = process.argv.includes("--apply");

const OLD_SLUG = "subsidiya-zhku-maloimushchim-svo";
const NEW_SLUG = "kompensaciya-zhku-vbd-svo";

// --- бэкап ---------------------------------------------------------------
const { data: before, error: eSel } = await sb
  .from("measures")
  .select("*")
  .in("slug", [OLD_SLUG, NEW_SLUG]);
if (eSel) throw eSel;

const cur = before.find((m) => m.slug === OLD_SLUG);
if (!cur) throw new Error(`не нашёл меру ${OLD_SLUG} — прерываюсь, ничего не трогаю`);

writeFileSync("verification/backup-zhku-federal.json", JSON.stringify(before, null, 2));
console.log(`бэкап: ${before.length} строк → verification/backup-zhku-federal.json\n`);

// --- 1. переписываем субсидию по ст. 159 ЖК РФ ---------------------------
const edit = {
  title: "Субсидия на оплату ЖКУ при высокой доле расходов в доходе семьи",
  short_description:
    "Если расходы на жильё и коммунальные услуги превышают допустимую долю дохода семьи, разницу компенсирует государство. Фиксированного процента у субсидии нет — размер считают индивидуально.",
  amount:
    "Рассчитывается индивидуально: возмещается превышение над максимально допустимой долей расходов (федеральный стандарт — 22% дохода семьи, регионы вправе снижать порог)",
  criteria: { requiresLowIncome: true },
  how_to_apply: [
    "Подать заявление через Госуслуги, МФЦ или орган соцзащиты по месту жительства",
  ],
  documents: [
    "Паспорта членов семьи",
    "Документы о доходах за 6 месяцев",
    "Документ на жильё (собственность или наём)",
    "Квитанции об оплате ЖКУ",
  ],
  tips: [
    "Фиксированных «30%» у этой субсидии нет: считают разницу между вашими расходами на ЖКУ и максимально допустимой долей дохода семьи.",
    "Федеральный стандарт допустимой доли — 22% совокупного дохода, но регион вправе установить ниже (в ряде субъектов 10–15%).",
    "Семьям с доходом ниже прожиточного минимума порог дополнительно снижают по поправочному коэффициенту — субсидия выходит больше.",
    "Субсидию назначают на 6 месяцев, потом её нужно продлевать, подтверждая доходы.",
    "Скидка не ниже 30% — это отдельная льгота для многодетных семей, она не зависит от дохода и устанавливается актами вашего региона.",
  ],
  source_name: "Статья 159 Жилищного кодекса РФ",
  source_url:
    "https://www.consultant.ru/document/cons_doc_LAW_51057/65847e56a3ea5c739de751f60de4523ad97fcdb1/",
  updated_at_label: "20.07.2026",
  verified_at: new Date().toISOString().slice(0, 10),
  verified_by: "сверка (жалоба тестировщика)",
};

// --- 2. новая мера для ВБД / участников СВО -------------------------------
const newMeasure = {
  slug: NEW_SLUG,
  title: "Компенсация 50% платы за жильё ветеранам боевых действий и участникам СВО",
  short_description:
    "Ветеранам боевых действий, включая участников СВО, возвращают половину платы за наём или содержание жилья и взноса на капитальный ремонт. Коммунальные услуги в эту льготу не входят.",
  level: "federal",
  region: null,
  category: "Жильё и ипотека",
  amount:
    "50% платы за наём и (или) содержание жилого помещения, включая взнос на капитальный ремонт",
  segments: ["svo-family"],
  criteria: { requiresSvoFamily: true },
  how_to_apply: [
    "Подать заявление через Госуслуги, МФЦ или орган соцзащиты по месту жительства",
  ],
  documents: [
    "Паспорт",
    "Удостоверение ветерана боевых действий",
    "Документ на жильё (собственность или наём)",
    "Квитанции об оплате жилого помещения",
  ],
  tips: [
    "Льгота покрывает плату за наём и содержание жилья и взнос на капремонт, но НЕ коммунальные услуги: свет, газ, вода и отопление оплачиваются полностью.",
    "Компенсация назначается лично ветерану и не распространяется на остальных членов семьи.",
    "Для семей погибших военнослужащих действует отдельная мера — она заведена в справочнике отдельной карточкой.",
  ],
  source_name: "Подпункт 5 пункта 1 статьи 16 ФЗ от 12.01.1995 № 5-ФЗ «О ветеранах»",
  source_url:
    "https://www.consultant.ru/document/cons_doc_LAW_5490/b0d793e46a33abc42082f106cd84e97d4dbba03f/",
  updated_at_label: "20.07.2026",
  is_published: true,
  sort_order: cur.sort_order,
  verified_at: new Date().toISOString().slice(0, 10),
  verified_by: "сверка (жалоба тестировщика)",
};

// --- показываем и (при --apply) пишем -------------------------------------
console.log(`=== 1. ПРАВКА ${OLD_SLUG} ===`);
for (const [k, v] of Object.entries(edit)) {
  const was = JSON.stringify(cur[k]);
  const now = JSON.stringify(v);
  if (was === now) continue;
  console.log(`\n  ${k}:`);
  console.log(`    было:  ${was}`);
  console.log(`    стало: ${now}`);
}

const exists = before.find((m) => m.slug === NEW_SLUG);
console.log(`\n\n=== 2. НОВАЯ МЕРА ${NEW_SLUG} ===`);
console.log(exists ? "  уже есть в базе — будет обновлена" : "  будет создана");
console.log("  " + newMeasure.title);
console.log("  " + newMeasure.amount);

if (!APPLY) {
  console.log("\n\nСУХОЙ ПРОГОН. Записи не было. Для применения: --apply");
} else {
  const { error: e1 } = await sb.from("measures").update(edit).eq("slug", OLD_SLUG);
  if (e1) throw e1;
  console.log(`\n✓ ${OLD_SLUG} обновлена`);

  const { error: e2 } = await sb.from("measures").upsert(newMeasure, { onConflict: "slug" });
  if (e2) throw e2;
  console.log(`✓ ${NEW_SLUG} записана`);
}
