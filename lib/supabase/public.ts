import { createClient } from "@supabase/supabase-js";

// Client anon-key puro, sem cookies/sessão -- uso exclusivo de app/demo/[slug]
// (ARCHITECTURE.md §3: nunca o client admin/service-role numa rota pública,
// nunca o client de sessão de /painel numa rota sem auth).
export function createSupabasePublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
