import { NextResponse } from "next/server";
import { requireActiveUser } from "@/lib/auth-guard";
import { checkQuota, recordUsage } from "@/lib/quota";
import { createGooglePlacesClient } from "@/lib/google-places/client";
import { uploadAsset, uploadFromUrl } from "@/lib/storage/assets";
import { captureSiteVisuals } from "@/lib/screenshot";
import { scrapeSiteAssets } from "@/lib/site-scrape";
import { generateRedesignCopy } from "@/lib/ai/generate-redesign";
import type { RedesignContent } from "@/types/redesign-content";

export async function POST(request: Request) {
  const guard = await requireActiveUser();
  if ("error" in guard) return guard.error;
  const { supabase, user } = guard;

  const { leadId } = (await request.json().catch(() => ({}))) as { leadId?: string };
  if (!leadId) {
    return NextResponse.json({ error: "leadId obrigatório" }, { status: 400 });
  }

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("id, place_id, has_own_website, public_email")
    .eq("id", leadId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (leadError || !lead) {
    return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
  }

  const quota = await checkQuota(supabase, user.id, "redesign_generate");
  if (!quota.allowed) {
    return NextResponse.json(
      { error: "Limite diário de gerações atingido", used: quota.used, limit: quota.limit },
      { status: 429 }
    );
  }

  const placesClient = createGooglePlacesClient();
  let placesPhotoUrls: string[];
  let websiteUri: string | null;
  let facts: RedesignContent["facts"];
  let generated: RedesignContent["generated"];

  try {
    const details = await placesClient.getDetails(lead.place_id);
    if (!details) {
      return NextResponse.json({ error: "Negócio não encontrado no Places (place_id inválido/expirado)" }, { status: 404 });
    }

    // Fotos: re-hospedadas no Storage -- nunca a URL de mídia do Places
    // direto (vazaria a API key pro navegador quando isto for exibido
    // publicamente na Fase 4). Continuam sendo o FALLBACK quando o site
    // original não tiver fotos aproveitáveis (REDESENHAR-05) -- ver bloco
    // não-bloqueante logo abaixo do try/catch.
    const photoNames = (details.photos ?? []).slice(0, 3).map((p) => p.name);
    placesPhotoUrls = [];
    for (const photoName of photoNames) {
      const photo = await placesClient.fetchPhotoBytes(photoName).catch(() => null);
      if (!photo) continue;
      const ext = photo.contentType.includes("png") ? "png" : "jpg";
      const url = await uploadAsset(supabase, {
        userId: user.id,
        path: `${leadId}/photo-${placesPhotoUrls.length}.${ext}`,
        bytes: photo.bytes,
        contentType: photo.contentType,
      }).catch(() => null);
      if (url) placesPhotoUrls.push(url);
    }

    websiteUri = details.websiteUri ?? null;

    generated = await generateRedesignCopy({
      name: details.displayName?.text ?? "(sem nome)",
      category: details.primaryType ?? null,
      address: details.formattedAddress ?? null,
      rating: details.rating ?? null,
      userRatingCount: details.userRatingCount ?? null,
      badSiteReason: lead.has_own_website ? "Site próprio com problemas de qualidade/performance" : "Sem site próprio",
    });

    facts = {
      name: details.displayName?.text ?? "(sem nome)",
      category: details.primaryType ?? null,
      address: details.formattedAddress ?? null,
      phone: details.internationalPhoneNumber ?? null,
      websiteUrl: details.websiteUri ?? null,
      rating: details.rating ?? null,
      userRatingCount: details.userRatingCount ?? null,
    };
  } catch (err) {
    // Erros daqui (Places, AI Gateway, Storage) não podem virar um 500 HTML
    // sem corpo JSON -- o cliente não consegue mostrar a mensagem real e cai
    // no fallback genérico "Erro de conexão" (foi exatamente o que aconteceu
    // com o erro de cartão de crédito do AI Gateway).
    const message = err instanceof Error ? err.message : String(err);
    console.error("redesigns/generate: erro na geração", err);
    return NextResponse.json({ error: `Geração falhou: ${message}` }, { status: 502 });
  }

  // REDESENHAR-05: extração do site original (screenshot, logo, fotos, cor
  // de marca) roda FORA do try/catch acima de propósito -- é estritamente
  // aditiva e nunca deve virar um 502 de geração (02.1-RESEARCH.md
  // "Failure/fallback behavior"). Cada chamada já degrada sozinha pra
  // null/[] em qualquer falha (mesmo padrão de lib/email-scrape.ts) -- um
  // site que bloqueia scraping, não tem logo, ou não declara theme-color cai
  // exatamente no comportamento de hoje: template neutro + fotos do Places.
  let beforeScreenshotUrl: string | null = null;
  let finalLogoUrl: string | null = null;
  let finalPhotoUrls = placesPhotoUrls;
  let theme: RedesignContent["theme"] = null;

  if (lead.has_own_website && websiteUri) {
    const siteVisuals = await captureSiteVisuals(websiteUri);
    beforeScreenshotUrl = siteVisuals.screenshotUrl;

    const scraped = await scrapeSiteAssets(websiteUri);

    // Site original é preferido às fotos do Places quando dá pra extrair
    // fotos aproveitáveis (CONTEXT.md) -- re-hospedadas exatamente como as
    // fotos do Places, nunca linkadas direto do site do lead.
    if (scraped.photoUrls.length > 0) {
      const rehosted: string[] = [];
      for (const [index, sourceUrl] of scraped.photoUrls.entries()) {
        const url = await uploadFromUrl(supabase, {
          userId: user.id,
          path: `${leadId}/site-photo-${index}.jpg`,
          sourceUrl,
        });
        if (url) rehosted.push(url);
      }
      if (rehosted.length > 0) finalPhotoUrls = rehosted;
    }

    if (siteVisuals.logoUrl) {
      finalLogoUrl = await uploadFromUrl(supabase, {
        userId: user.id,
        path: `${leadId}/logo.png`,
        sourceUrl: siteVisuals.logoUrl,
      });
    }

    if (scraped.themeColor) {
      theme = { primaryColor: scraped.themeColor };
    }
  }

  const content: RedesignContent = {
    facts,
    generated,
    photos: { logoUrl: finalLogoUrl, photoUrls: finalPhotoUrls },
    theme,
  };

  await recordUsage(supabase, user.id, "redesign_generate");

  const { data: redesign, error: insertError } = await supabase
    .from("redesigns")
    .insert({
      user_id: user.id,
      lead_id: leadId,
      content,
      before_screenshot_url: beforeScreenshotUrl,
      status: "ready",
    })
    .select("id, content, before_screenshot_url, status, created_at")
    .single();

  if (insertError) {
    console.error("redesigns/generate: erro salvando redesign", insertError);
    return NextResponse.json({ error: "Erro salvando redesign" }, { status: 500 });
  }

  await supabase.from("leads").update({ status: "redesigned" }).eq("id", leadId).eq("user_id", user.id);

  return NextResponse.json({ redesign, quota: { used: quota.used + 1, limit: quota.limit } }, { status: 201 });
}
