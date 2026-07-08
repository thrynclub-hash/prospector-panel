import { NextResponse } from "next/server";
import { requireActiveUser } from "@/lib/auth-guard";
import { checkQuota, recordUsage } from "@/lib/quota";
import { createGooglePlacesClient, type PlaceResult } from "@/lib/google-places/client";
import { getPageSpeedScore } from "@/lib/pagespeed";
import { findPublicEmail } from "@/lib/email-scrape";

// Score do PageSpeed abaixo disso conta como "site ruim" mesmo tendo site
// próprio (BUSCA-03). Sem site = ruim automaticamente, sem custo de chamada.
const BAD_SITE_THRESHOLD = 50;

export interface SearchResultItem {
  placeId: string;
  name: string;
  address?: string;
  rating?: number;
  userRatingCount?: number;
  websiteUrl?: string;
  hasOwnWebsite: boolean;
  pagespeedScore: number | null;
  isBadSite: boolean;
  publicEmail: string | null;
}

async function enrich(place: PlaceResult): Promise<SearchResultItem> {
  const hasOwnWebsite = Boolean(place.websiteUri);
  const [pagespeedScore, publicEmail] = await Promise.all([
    hasOwnWebsite ? getPageSpeedScore(place.websiteUri!) : Promise.resolve(null),
    hasOwnWebsite ? findPublicEmail(place.websiteUri!) : Promise.resolve(null),
  ]);

  const isBadSite = !hasOwnWebsite || (pagespeedScore !== null && pagespeedScore < BAD_SITE_THRESHOLD);

  return {
    placeId: place.id,
    name: place.displayName?.text ?? "(sem nome)",
    address: place.formattedAddress,
    rating: place.rating,
    userRatingCount: place.userRatingCount,
    websiteUrl: place.websiteUri,
    hasOwnWebsite,
    pagespeedScore,
    isBadSite,
    publicEmail,
  };
}

export async function POST(request: Request) {
  const guard = await requireActiveUser();
  if ("error" in guard) return guard.error;
  const { supabase, user } = guard;

  const { query } = (await request.json().catch(() => ({}))) as { query?: string };
  if (!query || typeof query !== "string" || query.trim().length < 3) {
    return NextResponse.json({ error: "Busca precisa de ao menos 3 caracteres" }, { status: 400 });
  }

  const quota = await checkQuota(supabase, user.id, "search");
  if (!quota.allowed) {
    return NextResponse.json(
      { error: "Limite diário de buscas atingido", used: quota.used, limit: quota.limit },
      { status: 429 }
    );
  }

  let places: PlaceResult[];
  try {
    const client = createGooglePlacesClient();
    places = await client.searchText({ textQuery: query.trim(), minRating: 4.7 });
  } catch (err) {
    console.error("leads/search: Places API falhou", err);
    return NextResponse.json({ error: "Busca no Google Places falhou" }, { status: 502 });
  }

  await recordUsage(supabase, user.id, "search");

  const results = await Promise.all(places.map(enrich));

  return NextResponse.json({
    results,
    quota: { used: quota.used + 1, limit: quota.limit },
  });
}
