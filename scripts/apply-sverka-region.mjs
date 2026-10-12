// Универсальное внесение результатов сверки регионов (агенты кладут day*_*.json в scratchpad).
// Правила: подтверждённые правки — в базу; неподтверждённые — в очередь «Спорные меры»;
// новые карточки: подтверждённые — видимые, неподтверждённые и «усыновление/опека» — скрытые.
//
// Запуск: node scripts/apply-sverka-region.mjs <config.json>          (сухой прогон)
//         node scripts/apply-sverka-region.mjs <config.json> --apply   (запись, с бэкапом)
//
// config.json: { "day": "02", "by": "сверка 12.10.2026",
//   "files": [ { "file": "day02_altay.json", "region": "Алтайский край", "newPrefix": "altadd-", "hideNew": ["altai-new-03"], "skipNew": [], "hide": [] } ] }
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";

const SCRATCH = "C:/Users/user/AppData/Local/Temp/claude/c--------------Dev-SovetMam/ceabb2c2-5a94-4b85-91a1-bb4ad96bd4b9/scratchpad/";
const cfg = JSON.parse(readFileSync(process.argv[2], "utf8"));
const apply = process.argv.includes("--apply");
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l.includes("=") && !l.startsWith("#")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const engine = readFileSync("src/lib/measures.ts", "utf8");
const KNOWN = new Set([...engine.matchAll(/^\s{2}(\w+)\??:/gm)].map((m) => m[1]));
const COLUMNS = ["title", "short_description", "level", "region", "category", "amount", "segments", "criteria", "eligibility", "how_to_apply", "documents", "tips", "source_url", "source_name", "deadline", "applies_by_child"];
const LABEL = "октябрь 2026";
const BY = cfg.by ?? "сверка 12.10.2026";
const now = new Date().toISOString();

function unknownKeys(c) {
  const out = [];
  const walk = (o) => { for (const [k, v] of Object.entries(o ?? {})) { if (k === "anyOf") v.forEach(walk); else if (!KNOWN.has(k)) out.push(k); } };
  walk(c);
  return out;
}

const log = [];
const disputes = [];
const backups = [];

for (const F of cfg.files) {
  const r = JSON.parse(readFileSync(SCRATCH + F.file, "utf8"));
  const touched = [...r.updates.map((u) => u.slug), ...(r.hide ?? []).map((h) => h.slug), ...(F.hide ?? []).map((h) => h.slug), ...(r.same ?? [])];
  const { data: rows } = await sb.from("measures").select("*").in("slug", touched);
  backups.push(...(rows ?? []));
  const have = new Set((rows ?? []).map((m) => m.slug));
  log.push(`\n== ${F.region}`);

  for (const u of r.updates) {
    if (!have.has(u.slug)) { log.push(`НЕТ меры ${u.slug}`); continue; }
    if (u.confirmed === false) {
      disputes.push({ measure_slug: u.slug, title: `${F.region}: ${u.slug} — правка не подтверждена`, reason: `Сверка ${cfg.day}. Агент предложил правку, но не смог подтвердить её первоисточником, поэтому в карточку не внесена. Что предлагалось: ${u.why}` });
      log.push(`ПРОПУСК (не подтв.) ${u.slug}`);
      continue;
    }
    const patch = {};
    for (const [k, v] of Object.entries(u.changes)) if (COLUMNS.includes(k)) patch[k] = v;
    const bad = patch.criteria ? unknownKeys(patch.criteria) : [];
    if (bad.length) { log.push(`ПРОПУСК (неизвестные критерии ${bad}) ${u.slug}`); disputes.push({ measure_slug: u.slug, title: `${F.region}: ${u.slug} — критерий не поддерживается`, reason: `Сверка ${cfg.day}. Предложенные критерии содержат неподдерживаемые поля ${bad.join(", ")}; правка не внесена. Что предлагалось: ${u.why}` }); continue; }
    patch.updated_at_label = LABEL; patch.verified_at = now; patch.verified_by = BY;
    log.push(`UPD ${u.slug}`);
    if (apply) { const { error } = await sb.from("measures").update(patch).eq("slug", u.slug); if (error) log.push(`  ОШИБКА ${u.slug}: ${error.message}`); }
  }
  for (const s of r.same ?? []) if (apply && have.has(s)) await sb.from("measures").update({ verified_at: now, verified_by: BY }).eq("slug", s);

  for (const h of [...(r.hide ?? []), ...(F.hide ?? [])]) {
    log.push(`HIDE ${h.slug}`);
    disputes.push({ measure_slug: h.slug, title: `${F.region}: ${h.slug} скрыта — перепроверить`, reason: `Сверка ${cfg.day}. Мера скрыта из каталога. Причина: ${h.reason}` });
    if (apply) await sb.from("measures").update({ is_published: false, verified_at: now, verified_by: BY }).eq("slug", h.slug);
  }

  let n = 0;
  if (F.newPrefix) {
    const { data: all } = await sb.from("measures").select("slug").ilike("slug", `${F.newPrefix}%`);
    n = Math.max(0, ...(all ?? []).map((m) => Number(m.slug.slice(F.newPrefix.length)) || 0));
  }
  for (const c of r.new) {
    if ((F.skipNew ?? []).includes(c.slug)) { log.push(`НЕ ЗАВОЖУ ${c.slug}`); continue; }
    let slug = c.slug;
    if (F.newPrefix) { n += 1; slug = `${F.newPrefix}${String(n).padStart(3, "0")}`; }
    const row = { slug, level: F.level ?? "regional", region: F.region, sort_order: 0 };
    for (const k of COLUMNS) if (c[k] !== undefined) row[k] = c[k];
    row.level = F.level ?? "regional"; row.region = F.region;
    const bad = unknownKeys(row.criteria);
    if (bad.length) { log.push(`НЕ ЗАВОЖУ (неизвестные критерии ${bad}) ${c.slug}`); continue; }
    row.updated_at_label = LABEL; row.verified_at = now; row.verified_by = BY;
    row.is_published = c.confirmed !== false && !(F.hideNew ?? []).includes(c.slug);
    if (!row.title || !row.short_description || !row.criteria || !row.how_to_apply || !row.category || !row.source_url) {
      log.push(`НЕПОЛНАЯ ${c.slug} (нет: ${["title", "short_description", "criteria", "how_to_apply", "category", "source_url"].filter((k) => !row[k]).join(",")})`);
      continue;
    }
    log.push(`NEW ${slug}${slug !== c.slug ? ` (было ${c.slug})` : ""} ${row.is_published ? "опубл" : "СКРЫТА"} | ${row.title.slice(0, 70)}`);
    if (apply) { const { error } = await sb.from("measures").insert(row); if (error) { log.push(`  ОШИБКА ${slug}: ${error.message}`); continue; } }
    if (!row.is_published) disputes.push({ measure_slug: apply ? slug : null, title: `${F.region}: ${slug} заведена скрытой`, reason: `Сверка ${cfg.day}. Новая мера заведена скрытой (не подтверждена первоисточником или тема под временным откатом). Откройте после проверки.` });
  }

  for (const d of r.doubtful ?? []) {
    disputes.push({ measure_slug: d.slug && have.has(d.slug) ? d.slug : null, title: `${F.region}: ${d.slug ?? "тема"} — не подтверждено`, reason: `Сверка ${cfg.day}. ${d.reason}` });
  }
}

if (apply) {
  writeFileSync(`verification/backup-sverka-${cfg.day}.json`, JSON.stringify(backups, null, 1));
  for (const d of disputes) {
    const { data: ex } = await sb.from("measure_disputes").select("id").eq("status", "open").eq("title", d.title);
    if (ex?.length) continue;
    const { error } = await sb.from("measure_disputes").insert({ ...d, sources: [] });
    if (error) log.push(`ОШИБКА спор ${d.title}: ${error.message}`);
  }
}
console.log(log.join("\n"));
console.log(apply ? "ЗАПИСАНО" : "СУХОЙ ПРОГОН", "| споров в очередь:", disputes.length);
