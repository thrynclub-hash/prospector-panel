import { NextResponse } from "next/server";
import { requireActiveUser } from "@/lib/auth-guard";
import { checkQuota, recordUsage } from "@/lib/quota";
import { createGooglePlacesClient } from "@/lib/google-places/client";
import { uploadAsset } from "@/lib/storage/assets";
import { captureScreenshot } from "@/lib/screenshot";
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
  let content: RedesignContent;
  let beforeScreenshotUrl: string | null;

  try {
    const details = await placesClient.getDetails(lead.place_id);
    if (!details) {
      return NextResponse.json({ error: "Negócio não encontrado no Places (place_id inválido/expirado)" }, { status: 404 });
    }

    // Fotos: re-hospedadas no Storage -- nunca a URL de mídia do Places direto
    // (vazaria a API key pro navegador quando isto for exibido publicamente na
    // Fase 4). Sem logo dedicado (Places não distingue "logo" de foto comum) --
    // a UI cai pra composição tipográfica quando photoUrls está vazio, nunca
    // inventa um logo (skill redesign-premium, regra 2).
    const photoNames = (details.photos ?? []).slice(0, 3).map((p) => p.name);
    const photoUrls: string[] = [];
    for (const photoName of photoNames) {
      const photo = await placesClient.fetchPhotoBytes(photoName).catch(() => null);
      if (!photo) continue;
      const ext = photo.contentType.includes("png") ? "png" : "jpg";
      const url = await uploadAsset(supabase, {
        userId: user.id,
        path: `${leadId}/photo-${photoUrls.length}.${ext}`,
        bytes: photo.bytes,
        contentType: photo.contentType,
      }).catch(() => null);
      if (url) photoUrls.push(url);
    }

    beforeScreenshotUrl = lead.has_own_website && details.websiteUri
      ? await captureScreenshot(details.websiteUri)
      : null;

    const generated = await generateRedesignCopy({
      name: details.displayName?.text ?? "(sem nome)",
      category: details.primaryType ?? null,
      address: details.formattedAddress ?? null,
      rating: details.rating ?? null,
      userRatingCount: details.userRatingCount ?? null,
      badSiteReason: lead.has_own_website ? "Site próprio com problemas de qualidade/performance" : "Sem site próprio",
    });

    content = {
      facts: {
        name: details.displayName?.text ?? "(sem nome)",
        category: details.primaryType ?? null,
        address: details.formattedAddress ?? null,
        phone: details.internationalPhoneNumber ?? null,
        websiteUrl: details.websiteUri ?? null,
        rating: details.rating ?? null,
        userRatingCount: details.userRatingCount ?? null,
      },
      generated,
      photos: { logoUrl: null, photoUrls },
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
