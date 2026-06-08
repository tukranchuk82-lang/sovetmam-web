import { createClient } from "@supabase/supabase-js";

/**
 * «Анонимный» клиент для публичных чтений без user-сессии.
 * Не использует cookies — подходит для generateStaticParams, generateMetadata,
 * Route Handlers и любого кода, который не зависит от текущего пользователя.
 * RLS-политики действуют как для роли `anon`.
 */
export function createSupabaseAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
