import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchAllPages } from "@/lib/supabase/paged";

// Региональные срезы для координатора: кто в его регионе заполнил анкету и
// какие меры сохраняют в избранное. Регион человека — это survey->>region
// (то, что он указал в /podbor), а не app_users.region (та колонка — только
// у самих координаторов, про их зону ответственности).
//
// region = null означает «без фильтра по региону» — так владелец/техспец
// смотрят координаторский экран «на себе»: у них самих региона нет, и вместо
// пустого экрана они видят срез по всем регионам разом.

export interface RegionSurveyUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  region: string | null;
  childrenCount: number | null;
  surveyUpdatedAt: string | null;
  createdAt: string;
  /** Анкета целиком — для просмотра координатором. */
  survey: Record<string, unknown> | null;
}

export async function countSurveyFillersByRegion(region: string | null): Promise<number> {
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("app_users")
    .select("id", { count: "exact", head: true })
    .not("survey", "is", null);
  if (region) query = query.eq("survey->>region", region);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

export async function listSurveyFillersByRegion(
  region: string | null,
): Promise<RegionSurveyUser[]> {
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("app_users")
    .select("id, email, first_name, last_name, survey, survey_updated_at, created_at")
    .not("survey", "is", null)
    .order("survey_updated_at", { ascending: false, nullsFirst: false })
    .limit(2000);
  if (region) query = query.eq("survey->>region", region);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((r) => {
    const survey = r.survey as Record<string, unknown> | null;
    return {
      id: r.id as string,
      email: r.email as string,
      firstName: r.first_name as string,
      lastName: r.last_name as string,
      region: (survey?.region as string | null) ?? null,
      childrenCount: (survey?.childrenCount as number | null) ?? null,
      surveyUpdatedAt: r.survey_updated_at as string | null,
      createdAt: r.created_at as string,
      survey,
    };
  });
}

export interface RegionSavedMeasure {
  userId: string;
  userName: string;
  userEmail: string;
  region: string | null;
  measureSlug: string;
  measureTitle: string | null;
  savedAt: string;
}

/**
 * `.in("col", ids)` кладёт все id прямо в URL запроса — у координатора
 * пользователей из региона обычно горстка, это безопасно. А вот когда
 * владелец/техспец смотрят этот экран «на себе» (без региона — region=null,
 * см. listSavedByRegion), пользователей с анкетой набирается больше тысячи,
 * и один такой запрос падает с «URI too long». Режем список на пачки и
 * собираем результат — так работает при любом количестве id.
 */
async function selectInChunks<T>(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  table: string,
  select: string,
  column: string,
  ids: string[],
  chunkSize = 150,
): Promise<T[]> {
  const out: T[] = [];
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const { data, error } = await supabase.from(table).select(select).in(column, chunk);
    if (error) throw error;
    out.push(...((data ?? []) as T[]));
  }
  return out;
}

/** Точное общее число (не урезанное лимитом PostgREST в 1000 строк на запрос) — для подписи «всего N» в предпросмотре без региона. */
async function countInChunks(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  table: string,
  column: string,
  ids: string[],
  chunkSize = 150,
): Promise<number> {
  let total = 0;
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const { count, error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true })
      .in(column, chunk);
    if (error) throw error;
    total += count ?? 0;
  }
  return total;
}

/**
 * Все пользователи с анкетой (нужного региона, если он задан) — постранично.
 * PostgREST сам режет любой SELECT на 1000 строк за раз, а без региона (когда
 * владелец/техспец смотрят координаторский экран «на себе») анкет заполнено
 * больше тысячи — обычный запрос без .range() тихо терял бы «лишних».
 */
async function fetchSurveyedUsers<T extends { id: string }>(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  region: string | null,
  select: string,
): Promise<T[]> {
  return fetchAllPages<T>((from, to) => {
    let q = supabase.from("app_users").select(select).not("survey", "is", null).range(from, to);
    if (region) q = q.eq("survey->>region", region);
    return q as unknown as PromiseLike<{ data: T[] | null; error: { message: string } | null }>;
  });
}

export async function countSavedByRegion(region: string | null): Promise<number> {
  const supabase = createSupabaseAdminClient();
  const users = await fetchSurveyedUsers<{ id: string }>(supabase, region, "id");
  if (users.length === 0) return 0;
  return countInChunks(supabase, "saved_measures", "user_id", users.map((u) => u.id));
}

export async function listSavedByRegion(region: string | null): Promise<RegionSavedMeasure[]> {
  const supabase = createSupabaseAdminClient();

  // Сначала — кто из региона вообще сохранял меры (без этого пришлось бы
  // тянуть saved_measures целиком и фильтровать в памяти на тысячах строк).
  const users = await fetchSurveyedUsers<{
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    survey: Record<string, unknown> | null;
  }>(supabase, region, "id, email, first_name, last_name, survey");
  if (users.length === 0) return [];

  const byId = new Map(users.map((u) => [u.id, u]));

  const saved = await selectInChunks<{ user_id: string; measure_slug: string; created_at: string }>(
    supabase,
    "saved_measures",
    "user_id, measure_slug, created_at",
    "user_id",
    [...byId.keys()],
  );
  saved.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  if (saved.length === 0) return [];
  if (saved.length > 5000) saved.length = 5000;

  const slugs = [...new Set(saved.map((s) => s.measure_slug))];
  const measures = await selectInChunks<{ slug: string; title: string }>(
    supabase,
    "measures",
    "slug, title",
    "slug",
    slugs,
  );
  const titleBySlug = new Map(measures.map((m) => [m.slug, m.title]));

  return saved.map((s) => {
    const u = byId.get(s.user_id as string);
    const survey = u?.survey as Record<string, unknown> | null | undefined;
    return {
      userId: s.user_id as string,
      userName: u ? `${u.first_name} ${u.last_name}`.trim() : "—",
      userEmail: u?.email as string,
      region: (survey?.region as string | null) ?? null,
      measureSlug: s.measure_slug as string,
      measureTitle: titleBySlug.get(s.measure_slug as string) ?? null,
      savedAt: s.created_at as string,
    };
  });
}

/** Меры, у которых уже проставлен region координатора — для списков/счётчиков в его кабинете. */
export async function countMeasuresByRegion(region: string | null): Promise<number> {
  const supabase = createSupabaseAdminClient();
  let query = supabase.from("measures").select("slug", { count: "exact", head: true });
  if (region) query = query.eq("region", region);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}
