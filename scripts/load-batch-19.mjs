// Партия 19: социальные службы и фонды + обновления налогов 2026.
// 8 новых мер + обогащение налоговых. Запуск: node scripts/load-batch-19.mjs

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "..", ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
      v = v.slice(1, -1);
    if (!(k in process.env)) process.env[k] = v;
  }
}

const ALL_BIRTH = ["expecting-first", "expecting-second", "expecting-third-plus"];
const REG = "На сайте социального министерства вашего региона";

const measures = [
  {
    slug: "fond-krug-dobra",
    title: "Фонд «Круг добра»",
    short_description:
      "Государственный фонд помощи детям с тяжёлыми, жизнеугрожающими и редкими (орфанными) заболеваниями: закупает дорогостоящие лекарства, медизделия и технические средства реабилитации сверх программы госгарантий.",
    level: "federal", region: null, category: "Здоровье", amount: "бесплатно",
    segments: ["disability"], criteria: { requiresDisabledChild: true },
    how_to_apply: ["Заявку обычно подаёт лечащий врач/медорганизация; подробности — на сайте фонда «Круг добра» и в региональном минздраве"],
    documents: ["Медицинские документы ребёнка"],
    tips: ["Фонд оплачивает то, что не входит в стандартную программу госгарантий: дорогие лекарства, медизделия, технические средства реабилитации."],
    source_url: "https://фондкругдобра.рф/", source_name: "Фонд «Круг добра»", updated_at_label: "2026", is_published: true,
  },
  {
    slug: "fond-zashchitniki-otechestva",
    title: "Фонд «Защитники Отечества»",
    short_description:
      "Государственный фонд персонального сопровождения и всесторонней поддержки ветеранов боевых действий (включая участников СВО) и семей погибших и пропавших без вести военнослужащих.",
    level: "federal", region: null, category: "Помощь и сопровождение", amount: "бесплатно",
    segments: ["svo-family"], criteria: { requiresSvoFamily: true },
    how_to_apply: ["Обратиться в региональный филиал фонда «Защитники Отечества» (адрес — на сайте фонда или соцминистерства региона)"],
    documents: [],
    tips: ["За каждой семьёй закрепляется социальный координатор, который помогает с выплатами, лечением, реабилитацией и документами."],
    source_url: "https://гос.фондзо.рф/", source_name: "Фонд «Защитники Отечества»", updated_at_label: "2026", is_published: true,
  },
  {
    slug: "besplatnaya-yuridicheskaya-pomoshch",
    title: "Бесплатная юридическая помощь",
    short_description:
      "Государственная система бесплатной юридической помощи для социально незащищённых граждан: малоимущих, инвалидов, многодетных, сирот, участников СВО.",
    level: "federal", region: null, category: "Помощь и сопровождение", amount: "бесплатно",
    segments: ["disability", "single-parent", "expecting-third-plus", "svo-family", "foster-family"], criteria: {},
    how_to_apply: ["Обратиться в государственное юридическое бюро или к адвокату — участнику системы (адреса — на сайте соцминистерства региона)"],
    documents: ["Документ-основание льготной категории"],
    tips: ["Помогают с назначением пенсий, субсидиями на ЖКХ, защитой прав детей и другими правовыми вопросами."],
    source_url: "https://www.gosuslugi.ru/", source_name: "ФЗ № 324-ФЗ «О бесплатной юридической помощи»", updated_at_label: "2026", is_published: true,
  },
  {
    slug: "prokat-detskih-tovarov",
    title: "Бесплатный прокат детских товаров",
    short_description:
      "Социальная услуга: нуждающиеся семьи могут бесплатно взять во временное пользование коляски, кроватки, стульчики для кормления, игрушки и другие предметы для ухода за детьми.",
    level: "federal", region: null, category: "Помощь и сопровождение", amount: "бесплатно",
    segments: [...ALL_BIRTH, "single-parent", "student-family", "svo-family"], criteria: {},
    how_to_apply: ["Обратиться в пункт проката при центре соцобслуживания (адрес — на сайте соцминистерства региона)"],
    documents: ["Документ-основание льготной категории"],
    tips: ["Обычно доступно многодетным, малоимущим, студенческим семьям и семьям участников СВО — на время взросления детей (чаще до 1,5–3 лет)."],
    source_url: "https://www.gosuslugi.ru/", source_name: REG, updated_at_label: "2026", is_published: true,
  },
  {
    slug: "centry-ranney-pomoshchi",
    title: "Центры ранней помощи",
    short_description:
      "Специализированная служба поддержки детей от рождения до 3 лет с нарушениями или рисками в физическом или психическом развитии: оценка развития, ранняя коррекционная помощь, консультации родителей.",
    level: "federal", region: null, category: "Здоровье", amount: "бесплатно",
    segments: ["disability", ...ALL_BIRTH], criteria: {},
    how_to_apply: ["Узнать адрес ближайшего центра на сайте социального министерства региона"],
    documents: [],
    tips: ["Специалисты (психологи, дефектологи, логопеды, врачи ЛФК, эрготерапевты) помогают вовремя заметить и скорректировать проблемы развития и учат семью общаться с особенным ребёнком."],
    source_url: "https://www.gosuslugi.ru/", source_name: REG, updated_at_label: "2026", is_published: true,
  },
  {
    slug: "centry-semya",
    title: "Многопрофильные центры «Семья»",
    short_description:
      "Комплексные центры соцобслуживания по принципу «одного окна»: консультации психолога, юриста, логопеда и других специалистов для семей с детьми, беременных, ищущих работу и людей с инвалидностью.",
    level: "federal", region: null, category: "Помощь и сопровождение", amount: "бесплатно",
    segments: [...ALL_BIRTH, "single-parent"], criteria: {},
    how_to_apply: ["Узнать адрес ближайшего центра на сайте социального министерства региона"],
    documents: [],
    tips: [
      "В одном месте можно решить бытовые и кризисные вопросы: психолог, юрист, логопед и другие специалисты.",
      "Бесплатную психологическую помощь оказывают также госучреждения и волонтёрские проекты — очно, онлайн или по телефону, в том числе анонимно.",
      "Службы медиации (примирения) помогают мирно урегулировать семейные споры (развод, алименты, раздел имущества) и восстановить детско-родительские отношения.",
    ],
    source_url: "https://www.gosuslugi.ru/", source_name: REG, updated_at_label: "2026", is_published: true,
  },
  {
    slug: "krizisnye-centry",
    title: "Кризисные центры для семей с детьми",
    short_description:
      "Учреждения экстренной комплексной помощи семьям в трудной жизненной ситуации: временное проживание, психологическая и юридическая поддержка, содействие в трудоустройстве и оформлении документов.",
    level: "federal", region: null, category: "Помощь и сопровождение", amount: "бесплатно",
    segments: ["single-parent", ...ALL_BIRTH, "svo-family"], criteria: {},
    how_to_apply: ["Узнать адрес ближайшего центра на сайте социального министерства региона"],
    documents: [],
    tips: ["Цель центра — помочь преодолеть кризис, предотвратить изъятие детей из семьи и восстановить безопасную среду. Есть и центры для подростков 12–18 лет (досуг, психолого-педагогическая помощь, профориентация)."],
    source_url: "https://www.gosuslugi.ru/", source_name: REG, updated_at_label: "2026", is_published: true,
  },
  {
    slug: "detskiy-telefon-doveriya",
    title: "Детский телефон доверия",
    short_description:
      "Бесплатная анонимная круглосуточная психологическая помощь для детей, подростков и родителей по единому номеру 8-800-2000-122 (и короткому номеру 124).",
    level: "federal", region: null, category: "Помощь и сопровождение", amount: "бесплатно",
    segments: ["schoolchild", ...ALL_BIRTH, "single-parent"], criteria: {},
    how_to_apply: ["Позвонить по номеру 8-800-2000-122 или короткому номеру 124 (не требует баланса на счету)"],
    documents: [],
    tips: ["Служба работает круглосуточно, анонимно и бесплатно для детей, подростков и их родителей."],
    source_url: "https://telefon-doveria.ru/", source_name: "Детский телефон доверия", updated_at_label: "2026", is_published: true,
  },
];

const patches = {
  "standartnyy-vychet-na-detey": {
    addTips: ["Вычет действует, пока совокупный годовой доход родителя не превысит 450 000 ₽ (с 2025 года порог повышен)."],
  },
  "semeynaya-nalogovaya-vyplata-2025": {
    addTips: ["Условие — среднедушевой доход семьи не выше 1,5 регионального прожиточного минимума. Государство фактически снижает ставку до 6% и возвращает разницу (7% дохода). Подать заявление в СФР можно с 1 июня по 1 октября 2026 года (ФЗ № 179-ФЗ)."],
  },
  "nalogovyy-vychet-lechenie": {
    addTips: ["С 2026 года при прогрессивной шкале НДФЛ вернуть можно от 13% до 22% расходов — в зависимости от ставки, которой облагается доход. Вид лечения (простое или дорогостоящее) определяют по коду в справке об оплате медуслуг."],
  },
  "nalogovyy-vychet-obuchenie": {
    addTips: [
      "С 2026 года при прогрессивной шкале НДФЛ возврат составляет от 13% до 22% расходов (в пределах лимитов).",
      "Социальные вычеты суммируются в общем лимите 150 000 ₽/год (кроме обучения детей, дорогостоящего лечения и благотворительности): например, заявив 100 000 ₽ за своё образование, на фитнес останется не больше 50 000 ₽.",
    ],
  },
  "nalogovyy-vychet-zhilye": {
    addTips: ["При высокой ставке НДФЛ возврат больше: за покупку жилья — до 260 000–440 000 ₽ на человека, за ипотечные проценты — до 390 000–660 000 ₽. Если квартира дешевле 2 млн ₽, остаток вычета можно добрать расходами на ремонт (в пределах 2 млн ₽)."],
  },
};

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) { console.error("Нет ключей Supabase"); process.exit(1); }
  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

  const slugs = measures.map((m) => m.slug);
  const { data: existing } = await supabase.from("measures").select("slug").in("slug", slugs);
  const had = new Set((existing ?? []).map((r) => r.slug));
  const { error } = await supabase.from("measures").upsert(measures, { onConflict: "slug" });
  if (error) { console.error("Ошибка записи: " + error.message); process.exit(1); }
  const created = slugs.filter((s) => !had.has(s)).length;
  console.log(`Новые меры: ${measures.length} (создано: ${created}, обновлено: ${measures.length - created})`);

  const pslugs = Object.keys(patches);
  const { data: rows } = await supabase.from("measures").select("slug,tips").in("slug", pslugs);
  const bySlug = new Map((rows ?? []).map((r) => [r.slug, r]));
  for (const slug of pslugs) {
    const row = bySlug.get(slug);
    if (!row) { console.warn(`${slug}: НЕ НАЙДЕНА`); continue; }
    const cur = Array.isArray(row.tips) ? row.tips : [];
    const merged = [...cur];
    for (const t of patches[slug].addTips) if (!merged.includes(t)) merged.push(t);
    const { error: e } = await supabase.from("measures").update({ tips: merged }).eq("slug", slug);
    if (e) console.warn(`${slug}: ${e.message}`);
    else console.log(`${slug}: подсказок ${cur.length} → ${merged.length}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
