// Сверка федеральных мер 12.10.2026 (6 тематических групп, результаты агентов в scratchpad).
// Запуск: node scripts/_apply-sverka-federal-2026-10.mjs          (сухой прогон)
//         node scripts/_apply-sverka-federal-2026-10.mjs --apply   (запись, с бэкапом)
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";

const SCRATCH = "C:/Users/user/AppData/Local/Temp/claude/c--------------Dev-SovetMam/ceabb2c2-5a94-4b85-91a1-bb4ad96bd4b9/scratchpad/";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l.includes("=") && !l.startsWith("#")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const apply = process.argv.includes("--apply");

const LABEL = "октябрь 2026";
const BY = "сверка 12.10.2026 (федеральные)";
const COLUMNS = ["title", "short_description", "level", "region", "category", "amount", "segments", "criteria", "eligibility", "how_to_apply", "documents", "tips", "source_url", "source_name", "deadline", "applies_by_child", "sort_order"];

// Читаемые адреса вместо fed-new-N-NN. null — не заводим (дубль существующей меры).
const NEW_SLUGS = {
  "fed-new-1-01": "bolnichnyy-uhod-za-bolnym-rebenkom",
  "fed-new-1-02": "matkapital-na-zhilyo",
  "fed-new-1-03": "matkapital-na-obuchenie-i-detsad",
  "fed-new-1-04": "matkapital-pensiya-mamy-i-tovary-dlya-invalida",
  "fed-new-2-01": "dosrochnaya-pensiya-roditelyam-rebenka-invalida",
  "fed-new-3-01": "ipotechnye-kanikuly-pri-rozhdenii-rebenka",
  "fed-new-4-01": "dopolnitelnye-vyhodnye-roditelyu-rebenka-invalida",
  "fed-new-4-02": "pmpk-i-obuchenie-detey-s-ovz",
  "fed-new-4-03": null, // дубль fond-krug-dobra
  "fed-new-4-04": "palliativnaya-pomoshch-detyam",
  "fed-new-5-01": "besplatnye-shkolnye-uchebniki",
  "fed-new-5-02": "priem-v-shkolu-bratya-i-sestry",
  "fed-new-5-03": null, // дубль kvota-vuz-deti-svo
};
// Заглушки без содержания (нарушают «никаких отсылок») — скрываем.
const HIDE = [
  { slug: "zhilishchnye-programmy-specialistov", reason: "Заглушка без конкретных условий и сумм, не федеральная мера семьям" },
  { slug: "pomoshch-s-zhilyem-ot-rabotodatelya", reason: "Не государственная мера: зависит от работодателя, содержания нет" },
  { slug: "regionalnye-nagrady-mnogodetnym", reason: "Заглушка «узнайте в соцзащите» без конкретики; награды нужно описывать региональными карточками" },
];
// Переопределения критериев после проверки движка.
const CRITERIA_OVERRIDE = {
  // Пособие по беременности и родам: беременным и матерям с новорождённым (заявление в течение 6 месяцев после отпуска).
  "posobie-po-beremennosti-i-rodam": { anyOf: [{ requiresPregnancy: true }, { maxYoungestChildAgeYears: 1 }], gender: "female" },
};

const now = new Date().toISOString();
const log = [];
const disputes = [];
const backups = [];
const results = [1, 2, 3, 4, 5, 6].map((i) => JSON.parse(readFileSync(`${SCRATCH}fed_result_${i}.json`, "utf8")));

const touched = new Set([...results.flatMap((r) => r.updates.map((u) => u.slug)), ...results.flatMap((r) => r.same ?? []), ...HIDE.map((h) => h.slug)]);
const { data: rows } = await sb.from("measures").select("*").in("slug", [...touched]);
backups.push(...(rows ?? []));
const have = new Set((rows ?? []).map((m) => m.slug));

for (const r of results) {
  for (const u of r.updates) {
    if (!have.has(u.slug)) { log.push(`НЕТ меры ${u.slug}`); continue; }
    if (u.confirmed === false) {
      disputes.push({ measure_slug: u.slug, title: `Федеральная ${u.slug}: правка не подтверждена`, reason: `Сверка 12.10.2026. Агент предложил правку, но не смог подтвердить её первоисточником, поэтому в карточку она не внесена. Что предлагалось: ${u.why}` });
      log.push(`ПРОПУСК (не подтв.) ${u.slug}`);
      continue;
    }
    const patch = {};
    for (const [k, v] of Object.entries(u.changes)) if (COLUMNS.includes(k)) patch[k] = v;
    if (CRITERIA_OVERRIDE[u.slug]) patch.criteria = CRITERIA_OVERRIDE[u.slug];
    patch.updated_at_label = LABEL; patch.verified_at = now; patch.verified_by = BY;
    log.push(`UPD ${u.slug}`);
    if (apply) { const { error } = await sb.from("measures").update(patch).eq("slug", u.slug); if (error) log.push(`  ОШИБКА ${u.slug}: ${error.message}`); }
  }
  for (const s of r.same ?? []) if (apply && have.has(s)) await sb.from("measures").update({ verified_at: now, verified_by: BY }).eq("slug", s);

  for (const c of r.new) {
    const slug = NEW_SLUGS[c.slug];
    if (!slug) { log.push(`НЕ ЗАВОЖУ (дубль) ${c.slug}`); continue; }
    const row = { slug, level: "federal", region: null, sort_order: 0 };
    for (const k of COLUMNS) if (c[k] !== undefined) row[k] = c[k];
    row.level = "federal"; row.region = null;
    row.updated_at_label = LABEL; row.verified_at = now; row.verified_by = BY;
    row.is_published = c.confirmed !== false;
    if (!row.title || !row.short_description || !row.criteria || !row.how_to_apply) { log.push(`НЕПОЛНАЯ ${c.slug}`); continue; }
    log.push(`NEW ${slug} ${row.is_published ? "опубл" : "СКРЫТА"} | ${row.title.slice(0, 70)}`);
    if (apply) { const { error } = await sb.from("measures").insert(row); if (error) log.push(`  ОШИБКА ${slug}: ${error.message}`); }
    if (!row.is_published) disputes.push({ measure_slug: slug, title: `Федеральная ${slug}: заведена скрытой — не подтверждена`, reason: `Сверка 12.10.2026. Новая мера заведена скрытой: агент не смог подтвердить её первоисточником. Откройте после проверки.` });
  }

  for (const d of r.doubtful ?? []) {
    const slug = d.slug && have.has(d.slug) ? d.slug : null;
    disputes.push({ measure_slug: slug, title: `Федеральная ${d.slug ?? "тема"} — не подтверждено`, reason: `Сверка 12.10.2026. ${d.reason}` });
  }
}

for (const h of HIDE) {
  log.push(`HIDE ${h.slug}`);
  disputes.push({ measure_slug: h.slug, title: `Федеральная ${h.slug} скрыта`, reason: `Сверка 12.10.2026. Мера скрыта из каталога. Причина: ${h.reason}` });
  if (apply) await sb.from("measures").update({ is_published: false, verified_at: now, verified_by: BY }).eq("slug", h.slug);
}

if (apply) {
  writeFileSync("verification/backup-federal-2026-10-12.json", JSON.stringify(backups, null, 1));
  for (const d of disputes) {
    const { data: ex } = await sb.from("measure_disputes").select("id").eq("status", "open").eq("title", d.title);
    if (ex?.length) continue;
    const { error } = await sb.from("measure_disputes").insert({ ...d, sources: [] });
    if (error) log.push(`ОШИБКА спор ${d.title}: ${error.message}`);
  }
}
console.log(log.join("\n"));
console.log(apply ? "ЗАПИСАНО" : "СУХОЙ ПРОГОН", "| споров в очередь:", disputes.length);
