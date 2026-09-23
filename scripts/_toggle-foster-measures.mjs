// Временное скрытие мер про сирот, опеку, усыновление и приёмные семьи —
// по просьбе Тани (23.09.2026), до отдельной команды вернуть обратно.
//
// Список зафиксирован на дату скрытия (title ilike любое из: сирот, приемн,
// приёмн, опекун, патронат, усынов, замещающ) — 117 мер, 116 региональных +
// 1 федеральная («Единовременное пособие при усыновлении ребёнка-инвалида...»).
// Список хранится здесь намеренно жёстко прописанным, а не пересчитывается
// заново при восстановлении: если за это время в базу добавят новые меры на
// ту же тему, повторный поиск по ключевым словам их случайно тоже вернёт из
// небытия, хотя скрывали не их. Восстанавливать нужно ровно то, что скрыли.
//
// Запуск:
//   node scripts/_toggle-foster-measures.mjs hide      — скрыть (is_published=false)
//   node scripts/_toggle-foster-measures.mjs restore   — вернуть (is_published=true)
//   node scripts/_toggle-foster-measures.mjs status     — просто показать текущее состояние

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const SLUGS = [
  "altadd-010", "altadd-011", "amur-018", "amur-019", "bsh-006", "chao-029",
  "chech-009", "chel-003", "chel-019", "chel-020", "chel-021", "chel-022",
  "chuv-003", "chuv-004", "dnr-001", "dnr-002", "dnr-003", "dnr-004",
  "eao-014", "hmao-020", "irkutsk-018", "irkutsk-019", "ivn-028", "kar-011",
  "kar-012", "kar-013", "kbr-008", "kbr-022", "khab-035", "khab-036",
  "kirov-021", "klg-013", "klm-009", "klm-010", "klm-011", "komi-023",
  "komi-025", "komi-026", "komi-027", "komi-028", "komi-029", "komi-030",
  "komi-031", "krasn-022", "krd-009", "krd-021", "krdadd-005", "krdadd-006",
  "krsk-014", "krsk-015", "lenobl-040", "lnr-011", "lpc-002", "mgd-036",
  "mgd-037", "mgd-038", "mgd-039", "mgd-040", "mgd-041", "mgd-042",
  "mgd-043", "mgd-044", "mo-opeka-vyplaty", "mo-priemnaya-semya-vyplaty",
  "mord-009", "mord-010", "mord-013", "mo-usynovlenie-posobiya", "nnov-012",
  "nnov-013", "omsk-019", "oren-012", "orl-013", "orl-014", "orl-015",
  "pnz-009", "posobie-usynovlenie-osobyh-detey", "prim-022",
  "reg-altayskiy-kray-010", "reg-altayskiy-kray-011",
  "reg-kaliningradskaya-oblast-017", "rst-001", "rst-002", "rst-003",
  "rst-004", "rst-005", "rtadd-017", "sah-007", "sah-008", "sah-009",
  "sah-010", "sah-027", "sah-028", "sev-005", "sve-008", "sve-021",
  "sve-022", "tamb-011", "tamb-012", "tamb-013", "tamb-014", "tamb-015",
  "tamb-016", "tamb-017", "tomsk-011", "udm-004", "udm-018", "udm-019",
  "udm-020", "udm-022", "vol-022", "volgograd-014", "voronezh-013",
  "yamal-024", "yamal-025", "yamal-026", "zapor-002",
];

const mode = process.argv[2];
if (!["hide", "restore", "status"].includes(mode)) {
  console.error("Укажите режим: hide | restore | status");
  process.exit(1);
}

const { data: rows, error: selErr } = await sb
  .from("measures")
  .select("slug,is_published")
  .in("slug", SLUGS);
if (selErr) throw selErr;
if (rows.length !== SLUGS.length) {
  const found = new Set(rows.map((r) => r.slug));
  console.warn(
    "Внимание: не найдено в базе:",
    SLUGS.filter((s) => !found.has(s)),
  );
}

if (mode === "status") {
  const hidden = rows.filter((r) => !r.is_published).length;
  console.log(`Найдено ${rows.length} из ${SLUGS.length}. Скрыто: ${hidden}. Опубликовано: ${rows.length - hidden}.`);
  process.exit(0);
}

const { error, data } = await sb
  .from("measures")
  .update({ is_published: mode === "hide" ? false : true })
  .in("slug", SLUGS)
  .select("slug");
if (error) throw error;
console.log(`${mode === "hide" ? "Скрыто" : "Восстановлено"}: ${data.length} мер.`);
// supabase-js на Windows иногда падает с ассертом libuv при закрытии realtime-
// сокета уже ПОСЛЕ того, как запрос отработал и лог напечатан — обрываем
// процесс сами, чтобы не пугать мусорным стектрейсом в конце.
process.exit(0);
