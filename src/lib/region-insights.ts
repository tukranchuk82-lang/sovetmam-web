import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

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

export async function listSavedByRegion(region: string | null): Promise<RegionSavedMeasure[]> {
  const supabase = createSupabaseAdminClient();

  // Сначала — кто из региона вообще сохранял меры (без этого пришлось бы
  // тянуть saved_measures целиком и фильтровать в памяти на тысячах строк).
  let usersQuery = supabase
    .from("app_users")
    .select("id, email, first_name, last_name, survey")
    .not("survey", "is", null);
  if (region) usersQuery = usersQuery.eq("survey->>region", region);
  const { data: users, error: usersError } = await usersQuery;
  if (usersError) throw usersError;
  if (!users || users.length === 0) return [];

  const byId = new Map(users.map((u) => [u.id as string, u]));

  const { data: saved, error: savedError } = await supabase
    .from("saved_measures")
    .select("user_id, measure_slug, created_at")
    .in("user_id", [...byId.keys()])
    .order("created_at", { ascending: false })
    .limit(5000);
  if (savedError) throw savedError;
  if (!saved || saved.length === 0) return [];

  const slugs = [...new Set(saved.map((s) => s.measure_slug as string))];
  const { data: measures, error: measuresError } = await supabase
    .from("measures")
    .select("slug, title")
    .in("slug", slugs);
  if (measuresError) throw measuresError;
  const titleBySlug = new Map((measures ?? []).map((m) => [m.slug as string, m.title as string]));

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
