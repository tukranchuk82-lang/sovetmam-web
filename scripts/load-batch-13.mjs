// Партия 13: шпаргалки 1/2/3+ ребёнок (массив). Почти всё дублирует партии 9-12.
// Новое — нормативы «Молодой семьи», земский врач/фельдшер + суммы, субсидии аренды на селе.
// Подсказки ДОПИСЫВАЕМ. Запуск: node scripts/load-batch-13.mjs

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

const patches = {
  "molodaya-semya": {
    addTips: [
      "Размер субсидии зависит от состава семьи: около 30% норматива стоимости жилья без детей (норма 42 кв. м), 35% с одним ребёнком (54 кв. м) и 35% с двумя детьми (72 кв. м). Нужно быть признанным нуждающимся в улучшении жилищных условий.",
    ],
  },
  "zhilishchnye-programmy-specialistov": {
    addTips: [
      "«Земский врач» и «Земский фельдшер» — выплаты медикам, переехавшим работать в сельскую местность; повышенные выплаты — в Дальневосточном федеральном округе, Арктической зоне, новых субъектах РФ, на Крайнем Севере и в труднодоступной местности.",
      "По земским программам (врачи, учителя, тренеры, работники культуры) выплаты обычно составляют от 1 до 2 млн ₽ — их можно направить на покупку жилья. У «Земского учителя» и «Земского тренера» тоже есть допвыплаты в ДФО, Арктике и новых субъектах РФ.",
    ],
  },
  "selskie-vyplaty-krst": {
    addTips: [
      "На сельских территориях также субсидируют строительство арендного жилья — узнавайте условия в местной администрации и по программе «Комплексное развитие сельских территорий».",
    ],
  },
};

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) { console.error("Нет ключей Supabase"); process.exit(1); }
  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

  const slugs = Object.keys(patches);
  const { data: rows, error } = await supabase.from("measures").select("slug,tips").in("slug", slugs);
  if (error) { console.error("Ошибка чтения: " + error.message); process.exit(1); }
  const bySlug = new Map((rows ?? []).map((r) => [r.slug, r]));

  for (const slug of slugs) {
    const row = bySlug.get(slug);
    if (!row) { console.warn(`${slug}: НЕ НАЙДЕНА (пропущена)`); continue; }
    const cur = Array.isArray(row.tips) ? row.tips : [];
    const merged = [...cur];
    for (const t of patches[slug].addTips) if (!merged.includes(t)) merged.push(t);
    const { error: e } = await supabase.from("measures").update({ tips: merged }).eq("slug", slug);
    if (e) console.warn(`${slug}: ${e.message}`);
    else console.log(`${slug}: подсказок ${cur.length} → ${merged.length}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
