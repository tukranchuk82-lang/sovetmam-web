import "server-only";
import { unstable_cache } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchAllPages } from "@/lib/supabase/paged";

/**
 * Загрузчики «сырья» для отчётов админки.
 *
 * Читаем только нужные колонки и постранично (PostgREST режет выборку на 1000
 * строк молча — см. supabase/paged.ts). Результат держим в кеше пять минут:
 * несколько отчётов подряд не должны каждый раз перекачивать тысячи строк,
 * а для аналитики «свежесть до пяти минут» несущественна. Даты в кеше — строки
 * ISO, разбираются уже в отчётах.
 */

const TTL = 900;

export interface UserLite {
  id: string;
  role: string;
  created_at: string;
  email_verified_at: string | null;
  survey_updated_at: string | null;
  utm_source: string | null;
  messenger_connected: boolean;
  region: string | null;
}

export const loadUsersLite = unstable_cache(
  async (): Promise<UserLite[]> => {
    const sb = createSupabaseAdminClient();
    return fetchAllPages<UserLite>((from, to) =>
      sb
        .from("app_users")
        .select(
          "id, role, created_at, email_verified_at, survey_updated_at, utm_source, messenger_connected, region:survey->>region",
        )
        .order("created_at", { ascending: false })
        .order("id", { ascending: true })
        .range(from, to) as unknown as PromiseLike<{ data: UserLite[] | null; error: { message: string } | null }>,
    );
  },
  ["analytics-users-lite"],
  { revalidate: TTL, tags: ["analytics"] },
);

export interface LoginLite {
  user_id: string;
  created_at: string;
  standalone: boolean | null;
}

export const loadLogins = unstable_cache(
  async (): Promise<LoginLite[]> => {
    const sb = createSupabaseAdminClient();
    return fetchAllPages<LoginLite>((from, to) =>
      sb
        .from("login_events")
        .select("user_id, created_at, standalone")
        .order("created_at", { ascending: false })
        .order("id", { ascending: true })
        .range(from, to),
    );
  },
  ["analytics-logins"],
  { revalidate: TTL, tags: ["analytics"] },
);

export interface DeviceEvent {
  kind: string;
  visitor: string | null;
  created_at: string;
}

/** События устройств: открыли приложение (open) и установили (install). */
export const loadDeviceEvents = unstable_cache(
  async (): Promise<DeviceEvent[]> => {
    const sb = createSupabaseAdminClient();
    return fetchAllPages<DeviceEvent>((from, to) =>
      sb
        .from("share_events")
        .select("kind, visitor, created_at")
        .in("kind", ["open", "install"])
        .order("created_at", { ascending: false })
        .order("id", { ascending: true })
        .range(from, to),
    );
  },
  ["analytics-device-events"],
  { revalidate: TTL, tags: ["analytics"] },
);

export interface InquiryLite {
  id: string;
  region: string | null;
  type: string;
  status: string;
  created_at: string;
  responded_at: string | null;
}

export const loadInquiriesLite = unstable_cache(
  async (): Promise<InquiryLite[]> => {
    const sb = createSupabaseAdminClient();
    return fetchAllPages<InquiryLite>((from, to) =>
      sb
        .from("inquiries")
        .select("id, region, type, status, created_at, responded_at")
        .order("created_at", { ascending: false })
        .order("id", { ascending: true })
        .range(from, to),
    );
  },
  ["analytics-inquiries"],
  { revalidate: TTL, tags: ["analytics"] },
);

export interface SavedLite {
  user_id: string;
  measure_slug: string;
  created_at: string;
}

export const loadSaved = unstable_cache(
  async (): Promise<SavedLite[]> => {
    const sb = createSupabaseAdminClient();
    return fetchAllPages<SavedLite>((from, to) =>
      sb
        .from("saved_measures")
        .select("user_id, measure_slug, created_at")
        .order("created_at", { ascending: false })
        .order("id", { ascending: true })
        .range(from, to),
    );
  },
  ["analytics-saved"],
  { revalidate: TTL, tags: ["analytics"] },
);

export interface SurveyLite {
  id: string;
  survey_updated_at: string | null;
  region: string | null;
  children: number | null;
  youngest: number | null;
  employment: string | null;
  priority: string | null;
  settlement: string | null;
  income: number | null;
  flags: Record<string, boolean | null>;
}

const FLAG_KEYS = [
  "pregnant",
  "lowIncome",
  "singleParent",
  "svoFamily",
  "disabledChild",
  "specialNeedsChild",
  "fosterParent",
  "mortgageIntent",
  "hasMortgage",
  "ownsHome",
  "student",
  "teacher",
  "selfEmployed",
  "entrepreneur",
  "disabledParent",
  "hardship",
] as const;

export const SURVEY_FLAG_KEYS = FLAG_KEYS;

/**
 * Ответы анкет — только нужные поля (а не весь JSON целиком): полная анкета
 * весит около двух килобайт, и тысяча таких строк не помещается в кеш.
 */
export const loadSurveys = unstable_cache(
  async (): Promise<SurveyLite[]> => {
    const sb = createSupabaseAdminClient();
    const flagSelect = FLAG_KEYS.map((k) => `f_${k}:survey->${k}`).join(", ");
    const raw = await fetchAllPages<Record<string, unknown>>((from, to) =>
      sb
        .from("app_users")
        .select(
          `id, survey_updated_at, region:survey->>region, children:survey->childrenCount, youngest:survey->youngestChildAgeYears, employment:survey->>employmentStatus, priority:survey->>prioritySituation, settlement:survey->>settlementType, income:survey->incomePm, ${flagSelect}`,
        )
        .eq("role", "user")
        .not("survey", "is", null)
        .order("id", { ascending: true })
        .range(from, to) as unknown as PromiseLike<{
        data: Record<string, unknown>[] | null;
        error: { message: string } | null;
      }>,
    );
    return raw.map((r) => {
      const flags: Record<string, boolean | null> = {};
      for (const k of FLAG_KEYS) flags[k] = (r[`f_${k}`] as boolean | null) ?? null;
      return {
        id: r.id as string,
        survey_updated_at: r.survey_updated_at as string | null,
        region: (r.region as string | null) ?? null,
        children: typeof r.children === "number" ? r.children : null,
        youngest: typeof r.youngest === "number" ? r.youngest : null,
        employment: (r.employment as string | null) ?? null,
        priority: (r.priority as string | null) ?? null,
        settlement: (r.settlement as string | null) ?? null,
        income: typeof r.income === "number" ? r.income : null,
        flags,
      };
    });
  },
  ["analytics-surveys"],
  { revalidate: TTL, tags: ["analytics"] },
);

export interface ViewLite {
  slug: string;
  visitor: string | null;
  user_id: string | null;
  created_at: string;
}

export const loadViews = unstable_cache(
  async (): Promise<ViewLite[]> => {
    const sb = createSupabaseAdminClient();
    return fetchAllPages<ViewLite>((from, to) =>
      sb
        .from("measure_views")
        .select("slug, visitor, user_id, created_at")
        .order("created_at", { ascending: false })
        .order("id", { ascending: true })
        .range(from, to),
    );
  },
  ["analytics-views"],
  { revalidate: TTL, tags: ["analytics"] },
);
