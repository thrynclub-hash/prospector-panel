import type { SupabaseClient } from "@supabase/supabase-js";
import { createGooglePlacesClient } from "@/lib/google-places/client";

export interface EnrichedLead {
  id: string;
  placeId: string;
  status: string;
  createdAt: string;
  hasOwnWebsite: boolean;
  pagespeedScore: number | null;
  publicEmail: string | null;
  name: string;
  address: string | null;
  rating: number | null;
  websiteUrl: string | null;
}

// Compartilhado entre app/api/leads (GET) e app/painel/buscar/page.tsx --
// re-busca dados de exibição ao vivo via Place Details a cada chamada
// (nunca lidos de coluna cacheada, ver Pitfall 1 na migration).
export async function getEnrichedLeads(supabase: SupabaseClient, userId: string): Promise<EnrichedLead[]> {
  const { data: leads, error } = await supabase
    .from("leads")
    .select("id, place_id, has_own_website, pagespeed_score, public_email, status, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!leads || leads.length === 0) return [];

  const client = createGooglePlacesClient();
  return Promise.all(
    leads.map(async (lead) => {
      const details = await client.getDetails(lead.place_id).catch(() => null);
      return {
        id: lead.id,
        placeId: lead.place_id,
        status: lead.status,
        createdAt: lead.created_at,
        hasOwnWebsite: lead.has_own_website,
        pagespeedScore: lead.pagespeed_score,
        publicEmail: lead.public_email,
        name: details?.displayName?.text ?? "(não encontrado no Places)",
        address: details?.formattedAddress ?? null,
        rating: details?.rating ?? null,
        websiteUrl: details?.websiteUri ?? null,
      };
    })
  );
}
