// Чиним обрезание выборок на 1000 строк: пользователи, избранное, согласия
// и события «Поделиться» читаем страницами.
import { readFileSync, writeFileSync } from "node:fs";

const edit = (path, pairs) => {
  let s = readFileSync(path, "utf8");
  const nl = s.includes("\r\n") ? "\r\n" : "\n";
  for (const [from, to] of pairs) {
    const f = from.join(nl), t = to.join(nl);
    if (!s.includes(f)) throw new Error(`${path}: не нашла «${from[0].trim().slice(0, 60)}»`);
    s = s.replace(f, t);
  }
  writeFileSync(path, s, "utf8");
  console.log("правлено:", path);
};

edit("src/lib/users-admin.ts", [
  [
    ['import { createSupabaseAdminClient } from "@/lib/supabase/admin";'],
    [
      'import { createSupabaseAdminClient } from "@/lib/supabase/admin";',
      'import { fetchAllPages } from "@/lib/supabase/paged";',
    ],
  ],
  [
    [
      "  const [users, saved, consents] = await Promise.all([",
      '    sb.from("app_users").select(SELECT).order("created_at", { ascending: false }),',
      '    sb.from("saved_measures").select("user_id"),',
      '    sb.from("user_consents").select("user_id,kind,doc_version,accepted_at,revoked_at"),',
      "  ]);",
      "  if (users.error) throw users.error;",
    ],
    [
      "  // Читаем страницами: людей уже больше тысячи, а PostgREST молча режет",
      "  // выборку ровно на тысяче — из-за этого админка показывала «Всего 1000»",
      "  // при 1268 зарегистрированных. Сортировка с id на конце устойчива:",
      "  // при одинаковом created_at строки не перескакивают между страницами.",
      "  const [users, saved, consents] = await Promise.all([",
      "    fetchAllPages<Row>((from, to) =>",
      "      sb",
      '        .from("app_users")',
      "        .select(SELECT)",
      '        .order("created_at", { ascending: false })',
      '        .order("id", { ascending: true })',
      "        .range(from, to),",
      "    ),",
      "    fetchAllPages<{ user_id: string }>((from, to) =>",
      '      sb.from("saved_measures").select("user_id").order("user_id").range(from, to),',
      "    ),",
      "    fetchAllPages<{",
      "      user_id: string;",
      "      kind: string;",
      "      doc_version: string;",
      "      accepted_at: string;",
      "      revoked_at: string | null;",
      "    }>((from, to) =>",
      "      sb",
      '        .from("user_consents")',
      '        .select("user_id,kind,doc_version,accepted_at,revoked_at")',
      '        .order("user_id")',
      '        .order("accepted_at")',
      "        .range(from, to),",
      "    ),",
      "  ]);",
    ],
  ],
  [
    [
      "  const savedByUser = new Map<string, number>();",
      "  for (const r of (saved.data ?? []) as { user_id: string }[]) {",
    ],
    [
      "  const savedByUser = new Map<string, number>();",
      "  for (const r of saved) {",
    ],
  ],
  [
    [
      "  const consentsByUser = new Map<string, AdminUser[\"consents\"]>();",
      "  for (const c of (consents.data ?? []) as {",
      "    user_id: string;",
      "    kind: string;",
      "    doc_version: string;",
      "    accepted_at: string;",
      "    revoked_at: string | null;",
      "  }[]) {",
    ],
    [
      "  const consentsByUser = new Map<string, AdminUser[\"consents\"]>();",
      "  for (const c of consents) {",
    ],
  ],
  [
    ["  return (users.data as Row[]).map((r) => ({"],
    ["  return users.map((r) => ({"],
  ],
]);

edit("src/lib/share-admin.ts", [
  [
    ['import { createSupabaseAdminClient } from "@/lib/supabase/admin";'],
    [
      'import { createSupabaseAdminClient } from "@/lib/supabase/admin";',
      'import { fetchAllPages } from "@/lib/supabase/paged";',
    ],
  ],
  [
    [
      "  const { data } = await sb",
      '    .from("share_events")',
      '    .select("kind, path, ref, channel, visitor, created_at")',
      '    .order("created_at", { ascending: false })',
      "    .limit(20_000);",
      "",
      "  const allRows = (data ?? []) as EventRow[];",
    ],
    [
      "  // Страницами: .limit(20 000) не помогает — PostgREST всё равно отдаёт",
      "  // не больше тысячи строк за запрос, и отчёт молча недосчитывал заходы.",
      "  const allRows = await fetchAllPages<EventRow>((from, to) =>",
      "    sb",
      '      .from("share_events")',
      '      .select("kind, path, ref, channel, visitor, created_at")',
      '      .order("created_at", { ascending: false })',
      '      .order("id", { ascending: true })',
      "      .range(from, to),",
      "  );",
    ],
  ],
  [
    [
      "  const { data: signupRows } = await sb",
      '    .from("app_users")',
      '    .select("utm_source")',
      '    .not("utm_source", "is", null);',
      "  const signupsBySource = new Map<string, number>();",
      "  for (const u of (signupRows ?? []) as { utm_source: string }[]) {",
    ],
    [
      "  const signupRows = await fetchAllPages<{ utm_source: string }>((from, to) =>",
      "    sb",
      '      .from("app_users")',
      '      .select("utm_source")',
      '      .not("utm_source", "is", null)',
      '      .order("id", { ascending: true })',
      "      .range(from, to),",
      "  );",
      "  const signupsBySource = new Map<string, number>();",
      "  for (const u of signupRows) {",
    ],
  ],
]);

edit("src/lib/measures-admin.ts", [
  [
    [
      "export async function listMeasuresForAdmin(): Promise<MeasureAdminRow[]> {",
      "  const supabase = createSupabaseAdminClient();",
      "  const { data, error } = await supabase",
      '    .from("measures")',
      "    .select(SELECT_FIELDS)",
      '    .order("sort_order", { ascending: true });',
      "  if (error) throw error;",
      "  return (data ?? []).map(rowToAdmin);",
      "}",
    ],
    [
      "export async function listMeasuresForAdmin(): Promise<MeasureAdminRow[]> {",
      "  const supabase = createSupabaseAdminClient();",
      "  // Мер больше двух тысяч — читаем страницами, иначе вернётся ровно",
      "  // тысяча и без всякой ошибки.",
      "  const rows = await fetchAllPages<Record<string, unknown>>((from, to) =>",
      "    supabase",
      '      .from("measures")',
      "      .select(SELECT_FIELDS)",
      '      .order("sort_order", { ascending: true })',
      '      .order("slug", { ascending: true })',
      "      .range(from, to),",
      "  );",
      "  return rows.map(rowToAdmin);",
      "}",
    ],
  ],
  [
    ['import { createSupabaseAdminClient } from "@/lib/supabase/admin";'],
    [
      'import { createSupabaseAdminClient } from "@/lib/supabase/admin";',
      'import { fetchAllPages } from "@/lib/supabase/paged";',
    ],
  ],
]);
