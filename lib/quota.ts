import type { SupabaseClient } from "@supabase/supabase-js";

// FOUND-03: limite diário por assinante, aplicado no servidor. Log de eventos
// (não contador mutável) -- ver comentário na migration usage_events.
export const DAILY_LIMITS: Record<string, number> = {
  search: Number(process.env.DAILY_SEARCH_LIMIT ?? 10),
  redesign_generate: Number(process.env.DAILY_REDESIGN_LIMIT ?? 5),
};

export interface QuotaStatus {
  allowed: boolean;
  used: number;
  limit: number;
}

function startOfTodayISO(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
}

export async function checkQuota(
  supabase: SupabaseClient,
  userId: string,
  action: keyof typeof DAILY_LIMITS
): Promise<QuotaStatus> {
  const limit = DAILY_LIMITS[action];
  const { count, error } = await supabase
    .from("usage_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("action", action)
    .gte("created_at", startOfTodayISO());

  if (error) throw error;

  const used = count ?? 0;
  return { allowed: used < limit, used, limit };
}

export async function recordUsage(
  supabase: SupabaseClient,
  userId: string,
  action: keyof typeof DAILY_LIMITS
): Promise<void> {
  const { error } = await supabase.from("usage_events").insert({ user_id: userId, action });
  if (error) throw error;
}
