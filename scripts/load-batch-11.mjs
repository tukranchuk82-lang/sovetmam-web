// Партия 11: беременность вторым ребёнком. Почти всё дублирует партию 10 —
// новое только суммы маткапитала 2026 + ежемесячная выплата + факт про студенток.
// Подсказки ДОПИСЫВАЕМ к существующим (read-modify-write). Запуск: node scripts/load-batch-11.mjs

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

// slug -> { amount?, addTips: [] }  (tips дописываются, дубли отсекаются)
const patches = {
  "materinskiy-kapital": {
    amount: "728 922 ₽ на первого ребёнка; 234 321 ₽ на второго (или 963 243 ₽, если на первого не получали) — 2026",
    addTips: [
      "Размеры на 2026: на первого ребёнка — 728 922 ₽; на второго — 234 321 ₽ (доплата, если на первого уже получали) или 963 243 ₽, если на первого маткапитал не оформляли.",
      "Сертификат выдаётся на имя мамы (на папу — только в исключительных случаях). Заявление подаётся через Госуслуги.",
    ],
  },
  "vyplata-iz-matkapitala": {
    amount: "1 прожиточный минимум на ребёнка в регионе (ежемесячно)",
    addTips: [
      "Доступна, если доход семьи меньше 2 прожиточных минимумов на человека. Размер — 1 прожиточный минимум на ребёнка в регионе.",
      "Деньги можно получать ежемесячно или забрать, когда понадобятся (например, ко дню рождения). Отчитываться за них не нужно. Заявление — через Госуслуги.",
    ],
  },
  "vyplaty-studencheskim-semyam-ot-vuza": {
    addTips: [
      "В отдельных регионах беременным студенткам выплачивают единовременно от 100 000 до 250 000 ₽ — уточняйте в Семейном МФЦ.",
    ],
  },
};

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) { console.error("Нет ключей Supabase"); process.exit(1); }
  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

  const slugs = Object.keys(patches);
  const { data: rows, error } = await supabase.from("measures").select("slug,amount,tips").in("slug", slugs);
  if (error) { console.error("Ошибка чтения: " + error.message); process.exit(1); }
  const bySlug = new Map((rows ?? []).map((r) => [r.slug, r]));

  for (const slug of slugs) {
    const row = bySlug.get(slug);
    if (!row) { console.warn(`${slug}: НЕ НАЙДЕНА (пропущена)`); continue; }
    const p = patches[slug];
    const cur = Array.isArray(row.tips) ? row.tips : [];
    const merged = [...cur];
    for (const t of p.addTips) if (!merged.includes(t)) merged.push(t);
    const fields = { tips: merged };
    if (p.amount) fields.amount = p.amount;
    const { error: e } = await supabase.from("measures").update(fields).eq("slug", slug);
    if (e) console.warn(`${slug}: ${e.message}`);
    else console.log(`${slug}: обогащена (подсказок: ${cur.length} → ${merged.length}${p.amount ? ", сумма обновлена" : ""})`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
