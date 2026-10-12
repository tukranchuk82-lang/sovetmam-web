// Досев: 7 новых федеральных карточек, которые не вставились (не было category / source_url).
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
const SCRATCH = "C:/Users/user/AppData/Local/Temp/claude/c--------------Dev-SovetMam/ceabb2c2-5a94-4b85-91a1-bb4ad96bd4b9/scratchpad/";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l.includes("=") && !l.startsWith("#")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const COLUMNS = ["title", "short_description", "category", "amount", "segments", "criteria", "eligibility", "how_to_apply", "documents", "tips", "source_url", "source_name", "deadline", "applies_by_child"];
const MAP = {
  "fed-new-2-01": { slug: "dosrochnaya-pensiya-roditelyam-rebenka-invalida", category: "Выплаты и пособия", source_url: "https://sfr.gov.ru/" },
  "fed-new-3-01": { slug: "ipotechnye-kanikuly-pri-rozhdenii-rebenka", category: "Жильё и ипотека", source_url: "https://xn--d1aqf.xn--p1ai/" },
  "fed-new-4-01": { slug: "dopolnitelnye-vyhodnye-roditelyu-rebenka-invalida", category: "Работа и занятость", source_url: "https://sfr.gov.ru/" },
  "fed-new-4-02": { slug: "pmpk-i-obuchenie-detey-s-ovz", category: "Образование", source_url: "https://edu.gov.ru/" },
  "fed-new-4-04": { slug: "palliativnaya-pomoshch-detyam", category: "Здоровье", source_url: "https://minzdrav.gov.ru/" },
  "fed-new-5-01": { slug: "besplatnye-shkolnye-uchebniki", category: "Образование", source_url: "https://edu.gov.ru/" },
  "fed-new-5-02": { slug: "priem-v-shkolu-bratya-i-sestry", category: "Образование", source_url: "https://edu.gov.ru/" },
};
const now = new Date().toISOString();
for (let i = 1; i <= 6; i++) {
  const r = JSON.parse(readFileSync(`${SCRATCH}fed_result_${i}.json`, "utf8"));
  for (const c of r.new) {
    const m = MAP[c.slug];
    if (!m) continue;
    const row = { slug: m.slug, level: "federal", region: null, sort_order: 0 };
    for (const k of COLUMNS) if (c[k] !== undefined) row[k] = c[k];
    row.category = c.category ?? m.category;
    row.source_url = c.source_url ?? m.source_url;
    row.updated_at_label = "октябрь 2026"; row.verified_at = now; row.verified_by = "сверка 12.10.2026 (федеральные)";
    row.is_published = c.confirmed !== false;
    const { error } = await sb.from("measures").insert(row);
    console.log(m.slug, row.is_published ? "опубл" : "СКРЫТА", error ? "ОШИБКА " + error.message : "ok");
    if (!error && !row.is_published) {
      await sb.from("measure_disputes").insert({ measure_slug: m.slug, title: `Федеральная ${m.slug}: заведена скрытой — не подтверждена`, reason: "Сверка 12.10.2026. Новая мера заведена скрытой: агент не смог подтвердить её первоисточником. Откройте после проверки.", sources: [] });
    }
  }
}
