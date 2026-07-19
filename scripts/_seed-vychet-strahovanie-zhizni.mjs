// Федеральная мера: налоговый вычет по НДФЛ за долгосрочное страхование жизни.
// Вводится с 1 сентября 2026 года (взносы по договорам от 01.01.2025, срок ≥10 лет),
// входит в общий лимит долгосрочных сбережений 400 000 ₽/год; на детей — до 500 000 ₽.
// Запуск: node scripts/_seed-vychet-strahovanie-zhizni.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
const env = Object.fromEntries(readFileSync(".env.local","utf8").split(/\r?\n/).filter(l=>l&&!l.startsWith("#")).map(l=>{const i=l.indexOf("=");return [l.slice(0,i),l.slice(i+1)];}));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});

const row = {
  slug: "nalogovyy-vychet-strahovanie-zhizni",
  title: "Налоговый вычет по НДФЛ за долгосрочное страхование жизни",
  short_description:
    "С 1 сентября 2026 года можно вернуть НДФЛ со взносов по договорам добровольного страхования жизни сроком от 10 лет, заключённым начиная с 1 января 2025 года.",
  level: "federal",
  category: "Налоги и льготы",
  amount: "Возврат от 52 000 ₽ (ставка 13%) до 88 000 ₽ (прогрессивная шкала НДФЛ) в год",
  segments: [
    "expecting-first","expecting-second","expecting-third","expecting-fourth","expecting-fifth-plus",
    "many-children",
    "topic-taxes","topic-money","class-discount","class-money","class-situational",
  ],
  criteria: { requiresFamily: true },
  how_to_apply: [
    "С 1 сентября 2026 года подать декларацию 3-НДФЛ в личном кабинете ФНС или на Госуслугах",
    "Либо оформить в упрощённом порядке — без 3-НДФЛ: налоговая учтёт сведения, которые страховая компания передаёт напрямую",
  ],
  documents: [
    "Договор добровольного страхования жизни (срок не менее 10 лет)",
    "Документы об уплате страховых взносов",
    "Справка о доходах",
  ],
  tips: [
    "Вычет вводится с 1 сентября 2026 года. Учитываются взносы по договорам, заключённым с 1 января 2025 года на срок не менее 10 лет.",
    "Входит в общий лимит долгосрочных сбережений — 400 000 ₽ в год (вместе с программой долгосрочных сбережений, ИИС-3 и негосударственной пенсией).",
    "Договор должен быть заключён в свою пользу, в пользу супруга, детей (в том числе усыновлённых и подопечных) или родителей.",
    "Взносы в пользу детей учитываются по повышенному лимиту — до 500 000 ₽ в год.",
    "При прогрессивной шкале НДФЛ возврат больше — от 13% до 22% суммы взносов в пределах лимита.",
  ],
  source_url: "https://www.nalog.gov.ru/",
  source_name: "Федеральная налоговая служба (nalog.gov.ru)",
  updated_at_label: "2026",
  is_published: true,
  sort_order: 0,
};

const { error } = await sb.from("measures").upsert(row, { onConflict: "slug" });
if (error) { console.log("FAIL", row.slug, "-", error.message); process.exit(1); }
console.log("OK  ", row.slug, "—", row.title);
const { data } = await sb.from("measures").select("slug,title,category,level,segments").eq("slug", row.slug).single();
console.log("В базе:", JSON.stringify(data, null, 2));
