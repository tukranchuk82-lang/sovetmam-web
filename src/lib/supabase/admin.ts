import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Только для серверного кода: обходит RLS, делает операции под service_role.
 * Никогда не импортируй из клиентских компонентов или из browser-кода.
 */
export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
