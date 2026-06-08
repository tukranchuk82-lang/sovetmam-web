// Партия 15: обновления 2026 по студенческим семьям (Госуслуги/Минобрнауки/ДОМ.РФ).
// Только обогащение существующих мер. Подсказки ДОПИСЫВАЕМ. Запуск: node scripts/load-batch-15.mjs

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
  "edinoe-posobie": {
    addTips: [
      "«Защитный порог» (с 2026): если доход семьи превышает прожиточный минимум не более чем на 10%, единое пособие продлевают ещё на 12 месяцев в размере 50% прожиточного минимума на ребёнка (для тех, кто уже получает пособие).",
    ],
  },
  "posobie-po-beremennosti-i-rodam": {
    addTips: [
      "Студенткам очной формы пособие по беременности и родам считается не от стипендии, а от 100% прожиточного минимума трудоспособного населения в регионе (с сентября 2025): ПМ ÷ 30 × дни отпуска. За 140 дней — порядка 93 000–96 000 ₽.",
    ],
  },
  "obrazovatelnye-garantii-beremennym": {
    addTips: [
      "С 1 сентября 2026 года вузы обязаны предоставлять нуждающимся студенческим семьям изолированные жилые помещения в общежитиях (в пределах имеющегося жилищного фонда) — федеральный закон.",
      "Что доступно именно в вашем вузе, можно узнать через сервис «Меры поддержки студенческих семей» на Госуслугах (Минобрнауки совместно с Минцифры).",
    ],
  },
  "zhilyo-dlya-studencheskih-semey": {
    addTips: [
      "С 1 сентября 2026 года нуждающимся студенческим семьям вузы должны предоставлять изолированные жилые помещения в общежитиях (в пределах имеющегося фонда).",
    ],
  },
  "podderzhka-studencheskih-semey": {
    addTips: [
      "Единовременная выплата при рождении ребёнка студенческой семье — региональная мера (во многих регионах около 200 000 ₽); единой федеральной такой выплаты нет. Уточняйте в соцзащите и на Госуслугах.",
      "Сервис «Меры поддержки студенческих семей» на Госуслугах показывает, какие меры реализует ваш вуз, и ведёт на подачу заявки.",
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
