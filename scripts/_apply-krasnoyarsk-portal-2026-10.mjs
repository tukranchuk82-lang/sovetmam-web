// Красноярский край, полный проход по каталогу sn.kray24.ru (162 меры, 07.10.2026).
// Результаты четырёх агентов лежат в scratchpad (kray_result_1..4.json).
// Запуск: node scripts/_apply-krasnoyarsk-portal-2026-10.mjs          (сухой прогон)
//         node scripts/_apply-krasnoyarsk-portal-2026-10.mjs --apply   (запись, с бэкапом)
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";

const SCRATCH = "C:/Users/user/AppData/Local/Temp/claude/c--------------Dev-SovetMam/ceabb2c2-5a94-4b85-91a1-bb4ad96bd4b9/scratchpad/";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l.includes("=") && !l.startsWith("#")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const apply = process.argv.includes("--apply");

const SRC_NAME = "Социальный кодекс Красноярского края (sn.kray24.ru)";
const LABEL = "октябрь 2026";
const BY = "сверка 07.10.2026 (sn.kray24.ru)";
// Дубли существующих мер — не заводим.
const SKIP_NEW = new Set([469, 3942]);
// Условия подбора приблизительные или возраст на странице не указан — заводим скрытыми, решает Таня.
const HIDDEN_NEW = new Set([1330, 3565, 3850, 1116]);
const COLUMNS = ["title", "short_description", "level", "region", "category", "amount", "segments", "criteria", "eligibility", "how_to_apply", "documents", "tips", "source_url", "source_name", "deadline", "applies_by_child"];

const results = [1, 2, 3, 4].map((i) => JSON.parse(readFileSync(`${SCRATCH}kray_result_${i}.json`, "utf8")));
const updates = results.flatMap((r) => r.updates);
const news = results.flatMap((r) => r.new).filter((n) => !SKIP_NEW.has(n.portalId));

// ---- бэкап ----
const { data: existing } = await sb.from("measures").select("*").ilike("slug", "krasn-%").order("slug");
const bySlug = new Map(existing.map((m) => [m.slug, m]));
const maxN = Math.max(...existing.map((m) => Number(m.slug.slice(6))));
if (apply) writeFileSync("verification/backup-krasnoyarsk-portal-2026-10-07.json", JSON.stringify(existing, null, 1));

const now = new Date().toISOString();
let ok = 0;
for (const u of updates) {
  const cur = bySlug.get(u.slug);
  if (!cur) { console.log("НЕТ меры", u.slug); continue; }
  const patch = {};
  for (const [k, v] of Object.entries(u.changes)) if (COLUMNS.includes(k)) patch[k] = v; else console.log("  пропущено поле", u.slug, k);
  patch.updated_at_label = LABEL; patch.verified_at = now; patch.verified_by = BY;
  console.log("UPD", u.slug, Object.keys(patch).join(","));
  if (apply) { const { error } = await sb.from("measures").update(patch).eq("slug", u.slug); if (error) { console.log("  ОШИБКА", error.message); continue; } }
  ok++;
}

let n = maxN;
for (const c of news) {
  n += 1;
  const slug = `krasn-${String(n).padStart(3, "0")}`;
  const row = { slug, level: "regional", region: "Красноярский край", source_name: SRC_NAME, sort_order: 0 };
  for (const k of COLUMNS) if (c[k] !== undefined) row[k] = c[k];
  row.source_url = c.source_url || `https://sn.kray24.ru/supports/${c.portalId}/`;
  row.source_name = SRC_NAME;
  row.updated_at_label = LABEL; row.verified_at = now; row.verified_by = BY;
  row.is_published = !HIDDEN_NEW.has(c.portalId);
  if (!row.title || !row.short_description || !row.criteria || !row.how_to_apply) { console.log("НЕПОЛНАЯ карточка", c.portalId); continue; }
  console.log("NEW", slug, row.is_published ? "опубл" : "СКРЫТА", "|", row.title);
  if (apply) { const { error } = await sb.from("measures").insert(row); if (error) { console.log("  ОШИБКА", error.message); continue; } }
  ok++;
}

// Спор по krasn-005 решён: портал подтвердил более узкий круг получателей и сумму 4 109 ₽.
if (apply) {
  await sb.from("measure_disputes").update({ status: "resolved", resolved_at: now, resolved_by: "сверка 07.10.2026 (sn.kray24.ru)" }).eq("measure_slug", "krasn-005").eq("status", "open");
}
console.log(apply ? "ЗАПИСАНО" : "СУХОЙ ПРОГОН", ok, "из", updates.length + news.length);
