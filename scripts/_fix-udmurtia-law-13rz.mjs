// Удмуртия: сверка с Законом УР от 05.05.2006 № 13-РЗ «О мерах по социальной поддержке многодетных семей», ст. 3 и 4
// (текст прислан командой 12.10.2026, открыт на docs.cntd.ru/document/960009513).
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l.includes("=") && !l.startsWith("#")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const R = "Удмуртская Республика";
const LAW = "https://docs.cntd.ru/document/960009513";
const SRC = "Закон Удмуртской Республики от 05.05.2006 № 13-РЗ «О мерах по социальной поддержке многодетных семей», статья 3";
const now = new Date().toISOString();
const by = "сверка с законом 13-РЗ 12.10.2026";

const { data: before } = await sb.from("measures").select("*").in("slug", ["udm-012", "udm-024"]);
writeFileSync("verification/backup-udm-law-13rz.json", JSON.stringify(before, null, 1));

const INCOME_NOTE = "Среднедушевой доход семьи не должен превышать прожиточный минимум на душу населения в Удмуртии. Если семья получает единое пособие (ежемесячное пособие в связи с рождением и воспитанием ребёнка), доход отдельно не проверяют.";

const updates = {
  "udm-012": {
    eligibility: `Положено многодетным семьям (трое и более детей). ${INCOME_NOTE} Проездные билеты выдают учащимся школ и профессиональных образовательных организаций, а также обучающимся по программам подготовки квалифицированных рабочих (служащих). Основание: ${SRC}, часть 2, пункт 3.`,
    source_url: LAW, source_name: SRC,
  },
  "udm-024": {
    title: "Бесплатные лекарства детям из малоимущих многодетных семей до 6,5 лет (Удмуртская Республика)",
    short_description: "Многодетным семьям с доходом не выше прожиточного минимума на человека лекарства по рецептам врача для детей до 6 лет и 6 месяцев выдают бесплатно.",
    eligibility: `Положено многодетным семьям (трое и более детей) на детей до 6 лет и 6 месяцев. ${INCOME_NOTE} Основание: ${SRC}, часть 2, пункт 2.`,
    criteria: { regions: [R], minChildren: 3, requiresChildren: true, requiresLowIncome: true, maxYoungestChildAgeYears: 6 },
    tips: ["Для детей до 3 лет действует и федеральное бесплатное обеспечение лекарствами.", "Нужен рецепт врача или фельдшера."],
    documents: ["Паспорт", "Удостоверение многодетной семьи", "Рецепт врача", "Свидетельство о рождении ребёнка"],
    source_url: LAW, source_name: SRC,
  },
};
for (const [slug, patch] of Object.entries(updates)) {
  const { error } = await sb.from("measures").update({ ...patch, updated_at_label: "октябрь 2026", verified_at: now, verified_by: by }).eq("slug", slug);
  console.log("UPD", slug, error?.message ?? "ok");
}

const base = { level: "regional", region: R, sort_order: 0, is_published: true, source_url: LAW, source_name: SRC, updated_at_label: "октябрь 2026", verified_at: now, verified_by: by, tips: [], documents: ["Паспорт", "Удостоверение многодетной семьи"] };
const apply = ["Подать заявление в орган социальной защиты по месту жительства, МФЦ или через Госуслуги"];
const fresh = [
  {
    slug: "udm-032", category: "Культура и отдых",
    title: "Бесплатное посещение музеев и парков многодетными семьями (Удмуртская Республика)",
    short_description: "Любой член многодетной семьи бесплатно ходит в государственные музеи и парки культуры и отдыха Удмуртии, а также на выставки, которые проводят государственные органы и учреждения республики.",
    amount: "Бесплатно", segments: ["many-children", "expecting-third", "expecting-fourth", "expecting-fifth-plus", "topic-leisure", "topic-culture", "class-free", "class-situational"],
    criteria: { regions: [R], minChildren: 3, requiresChildren: true },
    eligibility: `Положено любому члену многодетной семьи, независимо от места жительства в России, и дохода. Основание: ${SRC}, часть 1, пункт 1 (в редакции от 21.03.2025).`,
    how_to_apply: ["Показать удостоверение многодетной семьи на входе в музей или парк"], documents: ["Удостоверение многодетной семьи"],
  },
  {
    slug: "udm-033", category: "Помощь и сопровождение",
    title: "Бесплатная юридическая помощь многодетным семьям (Удмуртская Республика)",
    short_description: "Многодетным семьям Удмуртии предоставляют бесплатную юридическую помощь (мера введена в 2025 году).",
    amount: "Бесплатно", segments: ["many-children", "expecting-third", "expecting-fourth", "expecting-fifth-plus", "topic-social", "class-free", "class-situational"],
    criteria: { regions: [R], minChildren: 3, requiresChildren: true },
    eligibility: `Положено многодетным семьям без проверки дохода. Основание: ${SRC}, часть 1, пункт 9 (введён законом от 05.11.2025 № 64-РЗ).`,
    how_to_apply: apply,
  },
  {
    slug: "udm-034", category: "Образование",
    title: "Бесплатное питание школьников из многодетных семей — раз в учебный день (Удмуртская Республика)",
    short_description: "Ученикам школ из многодетных семей положено бесплатное питание один раз в учебный день.",
    amount: "Бесплатное питание один раз в учебный день", segments: ["schoolchild", "many-children", "expecting-third", "expecting-fourth", "expecting-fifth-plus", "topic-education", "class-free", "class-situational"],
    criteria: { regions: [R], minChildren: 3, requiresChildren: true, minSchoolChildren: 1 },
    eligibility: `Положено обучающимся общеобразовательных организаций из многодетных семей без проверки дохода. Основание: ${SRC}, часть 1, пункт 7.`,
    how_to_apply: ["Подать заявление в школу, где учится ребёнок"], documents: ["Паспорт", "Удостоверение многодетной семьи", "Справка об обучении"],
  },
  {
    slug: "udm-035", category: "Образование",
    title: "Скидка 50 % на детский сад для малоимущих многодетных семей (Удмуртская Республика)",
    short_description: "Многодетным семьям с доходом не выше прожиточного минимума на человека платят за присмотр и уход за ребёнком в государственном детском саду вдвое меньше: скидка 50 % от установленной платы.",
    amount: "Скидка 50 % от платы за присмотр и уход", segments: ["many-children", "low-income", "expecting-third", "expecting-fourth", "expecting-fifth-plus", "topic-money", "topic-education", "class-discount", "class-situational"],
    criteria: { regions: [R], minChildren: 3, requiresChildren: true, requiresLowIncome: true, hasChildAgedFrom: 1, hasChildAgedTo: 7 },
    eligibility: `Положено на детей, которые ходят в государственные детские сады республики. ${INCOME_NOTE} Основание: ${SRC}, часть 2, пункт 5.`,
    how_to_apply: ["Подать заявление в детский сад или орган социальной защиты по месту жительства"], documents: ["Паспорт", "Удостоверение многодетной семьи", "Сведения о доходах семьи"],
  },
];
for (const c of fresh) {
  const { error } = await sb.from("measures").insert({ ...base, ...c });
  console.log("NEW", c.slug, error?.message ?? "ok");
}
