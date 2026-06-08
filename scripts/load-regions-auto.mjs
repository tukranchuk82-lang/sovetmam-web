// Автозагрузчик региональных мер из scripts/_regions_txt/*.txt (чистый текст docx).
// Формат: строки группами «Регион / Мера / ссылки», разделитель — строка с названием региона.
// Категория и сегменты определяются по ключевым словам. Запуск: node scripts/load-regions-auto.mjs

import { readFileSync, existsSync, readdirSync } from "node:fs";
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
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!(k in process.env)) process.env[k] = v;
  }
}

const HEADERS = new Set(["Регион", "Мера поддержки", "Мера социальной поддержки", "Ссылка на открытый источник", "Наименование меры", "Меры поддержки", "№"]);
const REGION_RE = /(область|край|Республика|округ|Москва|Севастополь|Кузбасс|Югра|Якутия|Республике)/;

const TR = { а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"e",ж:"zh",з:"z",и:"i",й:"y",к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"h",ц:"c",ч:"ch",ш:"sh",щ:"sch",ъ:"",ы:"y",ь:"",э:"e",ю:"yu",я:"ya"," ":"-","-":"-" };
function translit(s) {
  return s.toLowerCase().split("").map((c) => (c in TR ? TR[c] : /[a-z0-9]/.test(c) ? c : "")).join("").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function inferCategory(t) {
  const s = t.toLowerCase();
  if (/жил|ипотек|жилищ|жилья|аренд|общежит|земельн|участок|новосел/.test(s)) return "Жильё и ипотека";
  if (/проезд|транспорт|автомобил|такси|парков|перевоз/.test(s)) return "Транспорт";
  if (/налог|вычет/.test(s)) return "Налоги и льготы";
  if (/лечен|медиц|здоров|санатор|оздоровл|лекарств|реабилит|питани|молочн/.test(s)) return "Здоровье";
  if (/обучен|образован|школ|студен|стипенди|учебн|первокласс|детск[а-я]* сад|кружк|секци|дошкол/.test(s)) return "Образование";
  if (/лагер|музе|культур|экскурс|отдых/.test(s)) return "Культура и отдых";
  return "Выплаты и пособия";
}

function inferSegments(t) {
  const s = t.toLowerCase();
  const seg = new Set();
  if (/школ|учени|обучающ[а-я]* в общеобраз|первокласс/.test(s)) seg.add("schoolchild");
  if (/инвалид|овз|ограниченными возможност/.test(s)) seg.add("disability");
  if (/студен|профессиональн[а-я]* образов|вуз/.test(s)) seg.add("student-family");
  if (/сво|военнослуж|мобилизов|специальн[а-я]* военн|боевых действ/.test(s)) seg.add("svo-family");
  if (/опек|попечит|приёмн|приемн|усыновл|удочер|сирот|без попечения/.test(s)) seg.add("foster-family");
  if (/единственн|одинок|неполн[а-я]* семь/.test(s)) seg.add("single-parent");
  if (/многодетн|трёх|трех детей|третьего|3 и более|три и более/.test(s)) seg.add("expecting-third-plus");
  if (/первого ребен|первого, второго/.test(s)) seg.add("expecting-first");
  if (/второго ребен|второго, третьего/.test(s)) seg.add("expecting-second");
  if (seg.size === 0 && /рожден|новорожд|беремен|при рождении|до 1,5|до трёх лет|до 3 лет|малыш/.test(s)) {
    seg.add("expecting-first"); seg.add("expecting-second"); seg.add("expecting-third-plus");
  }
  return [...seg];
}

function firstUrl(lines) {
  for (const l of lines) {
    const m = l.match(/https?:\/\/[^\s)]+/);
    if (m && /gosuslugi\.ru/.test(m[0])) return m[0];
  }
  for (const l of lines) {
    const m = l.match(/https?:\/\/[^\s)]+/);
    if (m) return m[0];
  }
  return null;
}

const SRC_DESC = /^(Сайт|Официальн|Чат-бот|Группа|Канал|Портал|Министерств|в разделе|www\.|Телеграм|Telegram|ВКонтакте|МАХ\b|Раздел|Ссылка|Деятельность|Приложение)/i;
function isUrlLine(l) { return /https?:\/\//.test(l); }
function isJunk(l) { return /%20|Приказ%|^%|^http/i.test(l); }
function looksLikeTitle(l, region) {
  if (HEADERS.has(l) || l === region) return false;
  if (isUrlLine(l) || isJunk(l)) return false;
  if (SRC_DESC.test(l)) return false;
  if (/^\d+(\.\d+)*\.?\s*/.test(l) && !/^\d+\s*[а-яёА-ЯЁ]{4,}/.test(l)) return false; // "1.", "4. Иные меры..." — разделы
  if (!/^[А-ЯЁ]/.test(l)) return false; // мера начинается с заглавной буквы
  if (l.length < 18 || !/\s/.test(l)) return false; // минимум, многословность
  if (l.length < 55 && REGION_RE.test(l) && /^[А-ЯЁ][^.]{0,40}(область|край|округ|Республик)/.test(l)) return false;
  return true;
}
function isContinuation(l) {
  return /^[а-яё(]/.test(l) && !isUrlLine(l) && !isJunk(l) && !SRC_DESC.test(l) && l.length > 2;
}

function parseFile(text) {
  let lines = text.split(/\r?\n/).map((l) => l.replace(/^﻿/, "").trim()).filter((l) => l && !l.startsWith("###"));
  let region = null;
  for (const l of lines) { if (l.length < 55 && REGION_RE.test(l) && !HEADERS.has(l)) { region = l; break; } }
  if (!region) return { region: null, measures: [] };

  const measures = [];
  let cur = null;
  for (const l of lines) {
    if (looksLikeTitle(l, region)) {
      cur = { title: l.replace(/\s+/g, " ").trim(), links: [] };
      measures.push(cur);
    } else if (isUrlLine(l) && cur) {
      cur.links.push(l);
    } else if (cur && cur.links.length === 0 && isContinuation(l)) {
      // строка-продолжение обёрнутого названия — приклеиваем к текущей мере
      cur.title = (cur.title + " " + l).replace(/\s+/g, " ").trim();
    }
  }
  const bareRegion = /^[А-ЯЁ][а-яё]+(ой|ого|ская|ский|ый|ий)?\s+(области|края|округа|Республик[аи]|область|край|округ)\.?$/;
  const withUrl = measures
    .map((m) => ({ title: m.title.length > 220 ? m.title.slice(0, 217) + "…" : m.title, url: firstUrl(m.links) }))
    .filter((m) => m.title.length >= 18 && !bareRegion.test(m.title));
  const seen = new Set();
  const uniq = withUrl.filter((m) => { const k = m.title.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
  return { region, measures: uniq };
}

function buildRows(region, measures) {
  const rslug = translit(region.replace(/^г\.\s*/, ""));
  return measures.map((m, idx) => ({
    slug: `reg-${rslug}-${String(idx + 1).padStart(3, "0")}`,
    title: m.title.length > 200 ? m.title.slice(0, 197) + "…" : m.title,
    short_description: `Региональная мера поддержки семей с детьми (${region}). Размер и условия уточняйте по ссылке на официальный источник или в МФЦ.`,
    level: "regional",
    region,
    category: inferCategory(m.title),
    amount: null,
    segments: inferSegments(m.title),
    criteria: {},
    how_to_apply: [`Оформить через Госуслуги или органы соцзащиты / МФЦ (${region})`],
    documents: [],
    tips: [],
    source_url: m.url || "https://www.gosuslugi.ru/",
    source_name: `${region} — официальный источник`,
    updated_at_label: "2026",
    is_published: true,
  }));
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) { console.error("Нет ключей Supabase"); process.exit(1); }
  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

  // чистим прошлые авто-загрузки (slug reg-*), чтобы не плодить осиротевшие дубли. mo-* не трогаем.
  const { error: delErr } = await supabase.from("measures").delete().like("slug", "reg-%");
  if (delErr) { console.error("Ошибка очистки reg-*: " + delErr.message); process.exit(1); }
  console.log("Очищены прежние reg-* меры.\n");

  const dir = join(__dirname, "_regions_txt");
  const files = readdirSync(dir).filter((f) => f.endsWith(".txt"));
  let total = 0;
  for (const f of files) {
    const text = readFileSync(join(dir, f), "utf8");
    const { region, measures } = parseFile(text);
    if (!region) { console.warn(`${f}: регион не распознан, пропуск`); continue; }
    const rows = buildRows(region, measures);
    if (!rows.length) { console.warn(`${region}: мер не найдено`); continue; }
    const { error } = await supabase.from("measures").upsert(rows, { onConflict: "slug" });
    if (error) { console.error(`${region}: ${error.message}`); continue; }
    total += rows.length;
    const cats = {};
    for (const r of rows) cats[r.category] = (cats[r.category] || 0) + 1;
    console.log(`${region}: ${rows.length} мер  [${Object.entries(cats).map(([k, v]) => `${k}:${v}`).join(", ")}]`);
  }
  console.log(`\nИтого загружено региональных мер: ${total}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
