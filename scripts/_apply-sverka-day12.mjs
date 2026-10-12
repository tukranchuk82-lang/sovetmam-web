// Сверка 12.10.2026: Ненецкий АО, Нижегородская, Новгородская области.
// Результаты агентов лежат в scratchpad (day12_*.json).
// Запуск: node scripts/_apply-sverka-day12.mjs          (сухой прогон)
//         node scripts/_apply-sverka-day12.mjs --apply   (запись, с бэкапом)
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";

const SCRATCH = "C:/Users/user/AppData/Local/Temp/claude/c--------------Dev-SovetMam/ceabb2c2-5a94-4b85-91a1-bb4ad96bd4b9/scratchpad/";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l.includes("=") && !l.startsWith("#")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const apply = process.argv.includes("--apply");

const LABEL = "октябрь 2026";
const BY = "сверка 12.10.2026";
const COLUMNS = ["title", "short_description", "level", "region", "category", "amount", "segments", "criteria", "eligibility", "how_to_apply", "documents", "tips", "source_url", "source_name", "deadline", "applies_by_child"];

const FILES = [
  { f: "day12_nao.json", region: "Ненецкий автономный округ", prefix: "nao-", renumber: false },
  { f: "day12_nizhny.json", region: "Нижегородская область", prefix: "nnov-", renumber: true, from: "nizh-" },
  { f: "day12_novgorod.json", region: "Новгородская область", prefix: "novg-", renumber: false },
];
// Заводим скрытыми: тема усыновления/опеки под временным откатом; прочее не подтверждено.
const HIDDEN_NEW = new Set(["nizh-004", "nizh-005", "nizh-006"]);
// Городские меры Нижнего Новгорода — без решения заказчика не заводим (в движке нет признака «город»).
const SKIP_NEW = new Set(["nizh-008", "nizh-009", "nizh-010", "nizh-011", "nizh-012", "nizh-013"]);
// «Первый ребёнок»: движок теперь умеет maxChildren.
const FIRST_CHILD = { "novg-001": 1, "novg-004": 1 };
// Те же ограничения — к уже внесённым мерам «при рождении первого ребёнка» (Иваново, Иркутск).
const FIRST_CHILD_EXISTING = ["ivn-005", "ivn-006", "ivn-007", "irkutsk-003"];
const HIDE_EXTRA = [{ slug: "nao-012", reason: "Прокат вещей для новорождённых: ни в одном документе департамента за 2023–2025 такой меры нет" }];

const now = new Date().toISOString();
const log = [];
const backups = [];
const disputes = [];

for (const F of FILES) {
  const r = JSON.parse(readFileSync(SCRATCH + F.f, "utf8"));

  const touched = [...r.updates.map((u) => u.slug), ...(r.hide ?? []).map((h) => h.slug), ...(r.same ?? [])];
  const { data: rows } = await sb.from("measures").select("*").in("slug", touched);
  backups.push(...(rows ?? []));
  const have = new Set((rows ?? []).map((m) => m.slug));

  for (const u of r.updates) {
    if (!have.has(u.slug)) { log.push(`НЕТ меры ${u.slug}`); continue; }
    if (u.confirmed === false) {
      disputes.push({ measure_slug: u.slug, title: `${F.region}: ${u.slug} — правка не подтверждена`, reason: `Сверка 12.10.2026. Агент предложил правку, но не смог подтвердить её первоисточником, поэтому в карточку не внесена. Что предлагалось: ${u.why}` });
      log.push(`ПРОПУСК (не подтв.) ${u.slug}`);
      continue;
    }
    const patch = {};
    for (const [k, v] of Object.entries(u.changes)) if (COLUMNS.includes(k)) patch[k] = v;
    patch.updated_at_label = LABEL; patch.verified_at = now; patch.verified_by = BY;
    log.push(`UPD ${u.slug}`);
    if (apply) { const { error } = await sb.from("measures").update(patch).eq("slug", u.slug); if (error) log.push(`  ОШИБКА ${u.slug}: ${error.message}`); }
  }

  for (const s of r.same ?? []) {
    if (apply && have.has(s)) await sb.from("measures").update({ verified_at: now, verified_by: BY }).eq("slug", s);
  }

  const hides = [...(r.hide ?? []), ...HIDE_EXTRA.filter((h) => h.slug.startsWith(F.prefix))];
  for (const h of hides) {
    log.push(`HIDE ${h.slug}`);
    disputes.push({ measure_slug: h.slug, title: `${F.region}: ${h.slug} скрыта — перепроверить`, reason: `Сверка 12.10.2026. Мера скрыта из каталога. Причина: ${h.reason}` });
    if (apply) await sb.from("measures").update({ is_published: false, verified_at: now, verified_by: BY }).eq("slug", h.slug);
  }

  // новые
  let n = 0;
  if (F.renumber) {
    const { data: all } = await sb.from("measures").select("slug").ilike("slug", `${F.prefix}%`);
    n = Math.max(0, ...(all ?? []).map((m) => Number(m.slug.slice(F.prefix.length)) || 0));
  }
  for (const c of r.new) {
    if (SKIP_NEW.has(c.slug)) {
      disputes.push({ measure_slug: null, title: `${F.region}: городская мера — ${c.title.slice(0, 90)}`, reason: `Сверка 12.10.2026. Мера действует только в городе Нижний Новгород (постановление администрации города от 30.01.2026 № 668), в движке нет признака «только город», поэтому в каталог области не заведена. Суть: ${c.short_description} Размер: ${c.amount}` });
      log.push(`НЕ ЗАВОЖУ (городская) ${c.slug}`);
      continue;
    }
    let slug = c.slug;
    if (F.renumber) { n += 1; slug = `${F.prefix}${String(n).padStart(3, "0")}`; }
    const row = { slug, level: "regional", region: F.region, sort_order: 0 };
    for (const k of COLUMNS) if (c[k] !== undefined) row[k] = c[k];
    if (FIRST_CHILD[c.slug]) row.criteria = { ...row.criteria, maxChildren: FIRST_CHILD[c.slug] };
    row.updated_at_label = LABEL; row.verified_at = now; row.verified_by = BY;
    row.is_published = !(c.confirmed === false || HIDDEN_NEW.has(c.slug));
    if (!row.title || !row.short_description || !row.criteria || !row.how_to_apply) { log.push(`НЕПОЛНАЯ ${c.slug}`); continue; }
    log.push(`NEW ${slug}${F.renumber ? ` (было ${c.slug})` : ""} ${row.is_published ? "опубл" : "СКРЫТА"} | ${row.title.slice(0, 70)}`);
    if (apply) { const { error } = await sb.from("measures").insert(row); if (error) log.push(`  ОШИБКА ${slug}: ${error.message}`); }
  }

  for (const d of r.doubtful ?? []) {
    const slug = d.slug && have.has(d.slug) ? d.slug : null;
    disputes.push({ measure_slug: slug, title: `${F.region}: ${d.slug ?? "тема"} — не подтверждено`, reason: `Сверка 12.10.2026. ${d.reason}` });
  }
}

// «первый ребёнок» у ранее внесённых мер
for (const slug of FIRST_CHILD_EXISTING) {
  const { data: m } = await sb.from("measures").select("criteria").eq("slug", slug).maybeSingle();
  if (!m) continue;
  log.push(`maxChildren:1 → ${slug}`);
  if (apply) await sb.from("measures").update({ criteria: { ...m.criteria, maxChildren: 1 } }).eq("slug", slug);
}

if (apply) {
  writeFileSync("verification/backup-day-12.json", JSON.stringify(backups, null, 1));
  for (const d of disputes) {
    const { data: ex } = await sb.from("measure_disputes").select("id").eq("status", "open").eq("title", d.title);
    if (ex?.length) continue;
    const { error } = await sb.from("measure_disputes").insert({ ...d, sources: [] });
    if (error) log.push(`ОШИБКА спор ${d.title}: ${error.message}`);
  }
}
console.log(log.join("\n"));
console.log(apply ? "ЗАПИСАНО" : "СУХОЙ ПРОГОН", "| споров в очередь:", disputes.length);
