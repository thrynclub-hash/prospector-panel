import { NextResponse } from "next/server";
import { requireActiveUser } from "@/lib/auth-guard";
import { detectSiteProblems } from "@/lib/proposal/detect-problems";
import { generateProposalCopy } from "@/lib/ai/generate-proposal";
import type { RedesignContent } from "@/types/redesign-content";

// PROPOSTA-01: gera os dois formatos (e-mail + WhatsApp) numa passada só e
// persiste em `proposals` -- CONTEXT.md: "persistido na primeira geração e
// reaproveitado nas próximas visitas". Exige is_public=true (a proposta cita
// o link público, Fase 4) -- mesmo gate que PublishButton já renderiza/some.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireActiveUser();
  if ("error" in guard) return guard.error;
  const { supabase, user } = guard;

  const { id } = await params;

  const { data: redesign, error: redesignError } = await supabase
    .from("redesigns")
    .select("id, lead_id, content, is_public, public_slug")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (redesignError || !redesign) {
    return NextResponse.json({ error: "Redesign não encontrado" }, { status: 404 });
  }

  if (!redesign.is_public || !redesign.public_slug) {
    return NextResponse.json({ error: "Publique o redesign antes de gerar a proposta" }, { status: 409 });
  }

  const { data: existing } = await supabase
    .from("proposals")
    .select("id, email_subject, email_body, whatsapp_text, email_sent_at")
    .eq("redesign_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ proposal: existing });
  }

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("has_own_website, pagespeed_score")
    .eq("id", redesign.lead_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (leadError || !lead) {
    return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
  }

  const content = redesign.content as RedesignContent;
  const problems = detectSiteProblems({ hasOwnWebsite: lead.has_own_website, pagespeedScore: lead.pagespeed_score });
  const demoUrl = `${process.env.NEXT_PUBLIC_APP_URL}/demo/${redesign.public_slug}`;

  let generated;
  try {
    generated = await generateProposalCopy({
      name: content.facts.name,
      address: content.facts.address,
      rating: content.facts.rating,
      userRatingCount: content.facts.userRatingCount,
      problems,
      demoUrl,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("redesigns/proposal: erro gerando texto", err);
    return NextResponse.json({ error: `Geração falhou: ${message}` }, { status: 502 });
  }

  const { data: proposal, error: insertError } = await supabase
    .from("proposals")
    .insert({
      redesign_id: id,
      user_id: user.id,
      email_subject: generated.emailSubject,
      email_body: generated.emailBody,
      whatsapp_text: generated.whatsappText,
    })
    .select("id, email_subject, email_body, whatsapp_text, email_sent_at")
    .single();

  if (insertError) {
    console.error("redesigns/proposal: erro salvando proposta", insertError);
    return NextResponse.json({ error: "Erro salvando proposta" }, { status: 500 });
  }

  return NextResponse.json({ proposal }, { status: 201 });
}

// Edição antes de enviar (CONTEXT.md: "editável... textarea simples...
// mesmo padrão do Editor da Fase 3").
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireActiveUser();
  if ("error" in guard) return guard.error;
  const { supabase, user } = guard;

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    emailSubject?: string;
    emailBody?: string;
    whatsappText?: string;
  };

  const { data: proposal, error } = await supabase
    .from("proposals")
    .update({
      ...(body.emailSubject !== undefined && { email_subject: body.emailSubject }),
      ...(body.emailBody !== undefined && { email_body: body.emailBody }),
      ...(body.whatsappText !== undefined && { whatsapp_text: body.whatsappText }),
      updated_at: new Date().toISOString(),
    })
    .eq("redesign_id", id)
    .eq("user_id", user.id)
    .select("id, email_subject, email_body, whatsapp_text, email_sent_at")
    .single();

  if (error) {
    console.error("redesigns/proposal PATCH: erro atualizando", error);
    return NextResponse.json({ error: "Erro salvando edição" }, { status: 500 });
  }

  return NextResponse.json({ proposal });
}
