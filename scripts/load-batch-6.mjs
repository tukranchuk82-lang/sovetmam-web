// Партия 6: жилищные меры. 7 новых федеральных (черновики) + подсказки
// к существующим (маткапитал, 450к многодетным). Запуск: node scripts/load-batch-6.mjs

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

const base = {
  level: "federal",
  region: null,
  category: "Жильё и ипотека",
  amount: null,
  documents: [],
  tips: [],
  source_url: "https://www.gosuslugi.ru/",
  source_name: "Госуслуги / ДОМ.РФ",
  updated_at_label: "2026",
  is_published: false,
};

const measures = [
  {
    ...base,
    slug: "semeynaya-ipoteka",
    title: "Семейная ипотека под 6%",
    short_description: "Льготный ипотечный кредит по ставке 6% для семей с детьми.",
    amount: "ставка 6% годовых",
    segments: ALL_BIRTH,
    criteria: { requiresChildren: true, requiresMortgageIntent: true },
    how_to_apply: [
      "Оформляется в банке — участнике программы",
      "Условия и заявку можно посмотреть на Госуслугах, в МФЦ или на ДОМ.РФ",
    ],
    tips: [
      "В регионах бывают дополнительные жилищные меры: региональный семейный капитал на покупку жилья, оплата аренды студенческим семьям, социальный найм для малоимущих. Уточняйте в своём регионе.",
    ],
  },
  {
    ...base,
    slug: "molodaya-semya",
    title: "Программа «Молодая семья»",
    short_description:
      "Субсидия на покупку или строительство жилья молодым семьям: около 30% расчётной стоимости (без детей) и 35% (если есть дети).",
    amount: "30–35% расчётной стоимости жилья",
    segments: ALL_BIRTH,
    criteria: { requiresMortgageIntent: true },
    how_to_apply: [
      "Подать заявление через Госуслуги, МФЦ или органы местного самоуправления",
    ],
  },
  {
    ...base,
    slug: "zemlya-izhs-mnogodetnym",
    title: "Бесплатный земельный участок многодетным семьям (ИЖС)",
    short_description:
      "Многодетным семьям предоставляют земельный участок под строительство дома; в ряде регионов — денежная выплата взамен участка.",
    segments: ["expecting-third-plus"],
    criteria: { requiresChildren: true, minChildren: 3 },
    how_to_apply: [
      "Встать на учёт в органах местного самоуправления или через Госуслуги",
    ],
  },
  {
    ...base,
    slug: "selskaya-ipoteka",
    title: "Сельская ипотека",
    short_description:
      "Льготная ипотека на покупку или строительство дома на сельских и приграничных территориях.",
    amount: "ставка 0,1% (приграничные) – 3% (сельские территории)",
    segments: ALL_BIRTH,
    criteria: { requiresMortgageIntent: true },
    how_to_apply: ["Оформляется в банке — участнике программы"],
  },
  {
    ...base,
    slug: "dalnevostochnaya-arkticheskaya-ipoteka",
    title: "Дальневосточная и арктическая ипотека (до 2%)",
    short_description:
      "Льготная ипотека по ставке до 2% на покупку или строительство жилья в Дальневосточном федеральном округе и Арктической зоне РФ.",
    amount: "ставка до 2% годовых",
    segments: ALL_BIRTH,
    criteria: { requiresMortgageIntent: true },
    how_to_apply: ["Оформляется в банке — участнике программы"],
    source_name: "ДОМ.РФ / Госуслуги",
  },
  {
    ...base,
    slug: "domrf-arenda-dfo-arktika",
    title: "Доступное арендное жильё ДОМ.РФ (Дальний Восток и Арктика)",
    short_description:
      "Программа ПАО «ДОМ.РФ» доступного арендного жилья в Дальневосточном федеральном округе и Арктической зоне РФ.",
    segments: ALL_BIRTH,
    criteria: {},
    how_to_apply: ["Подробности и заявку — на сайте ДОМ.РФ"],
    source_name: "ДОМ.РФ",
  },
  {
    ...base,
    slug: "dalnevostochnyy-gektar",
    title: "Программа «Гектар» (Дальний Восток и Арктика)",
    short_description:
      "Бесплатное предоставление в собственность одного гектара земли на Дальнем Востоке и в Арктической зоне (Карелия, Мурманская, Архангельская области и др.).",
    amount: "бесплатно, 1 гектар",
    segments: ALL_BIRTH,
    criteria: {},
    how_to_apply: ["Подать заявление через портал «НаДальнийВосток.рф» или Госуслуги"],
  },
];

const tipPatches = [
  {
    slug: "materinskiy-kapital",
    tips: [
      "Материнский капитал можно направить на первоначальный взнос по ипотеке или на прямую покупку жилья — через Госуслуги, МФЦ или СоцФонд.",
    ],
  },
  {
    slug: "pogashenie-ipoteki-mnogodetnym",
    tips: [
      "В некоторых регионах есть дополнительная выплата к федеральной — например, +550 000 ₽ многодетным на погашение ипотеки. Уточняйте в своём регионе.",
    ],
  },
];

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
  console.log(`Новые меры: ${measures.length} (новых: ${created}, обновлено: ${measures.length - created})`);

  for (const p of tipPatches) {
    const { data, error: e } = await supabase.from("measures").update({ tips: p.tips }).eq("slug", p.slug).select("slug");
    if (e) console.warn(`${p.slug}: ${e.message}`);
    else if (!data?.length) console.warn(`${p.slug}: не найдена`);
    else console.log(`${p.slug}: +подсказка про жильё`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
