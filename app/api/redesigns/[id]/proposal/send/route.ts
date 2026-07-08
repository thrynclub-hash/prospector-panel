import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { requireActiveUser } from "@/lib/auth-guard";
import { sendProposalEmail } from "@/lib/email/proposal";

// PROPOSTA-03/04: envio de e-mail automático só acontece depois de checar a
// lista de supressão (contacted_businesses) -- e só DEPOIS de um envio
// efetivamente bem-sucedido é que o place_id entra na lista (CONTEXT.md:
// "não precisa de resposta ou reclamação pra isso").
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireActiveUser();
  if ("error" in guard) return guard.error;
  const { supabase, user } = guard;

  const { id } = await params;

  const { data: redesign, error: redesignError } = await supabase
    .from("redesigns")
    .select("id, lead_id, is_public")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (redesignError || !redesign) {
    return NextResponse.json({ error: "Redesign não encontrado" }, { status: 404 });
  }

  if (!redesign.is_public) {
    return NextResponse.json({ error: "Publique o redesign antes de enviar a proposta" }, { status: 409 });
  }

  const { data: proposal } = await supabase
    .from("proposals")
    .select("id, email_subject, email_body")
    .eq("redesign_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!proposal) {
    return NextResponse.json({ error: "Gere a proposta antes de enviar" }, { status: 404 });
  }

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("place_id, public_email")
    .eq("id", redesign.lead_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (leadError || !lead) {
    return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
  }

  if (!lead.public_email) {
    return NextResponse.json({ error: "Este lead não tem e-mail público" }, { status: 400 });
  }

  const { data: suppression } = await supabase
    .from("contacted_businesses")
    .select("opted_out_at")
    .eq("place_id", lead.place_id)
    .maybeSingle();

  if (suppression) {
    const message = suppression.opted_out_at
      ? "Este negócio pediu pra não receber contatos automáticos"
      : "Este negócio já foi contatado por e-mail (por você ou outro assinante)";
    return NextResponse.json({ error: message }, { status: 409 });
  }

  const token = nanoid(32);
  const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe/${token}`;

  try {
    await sendProposalEmail({
      to: lead.public_email,
      subject: proposal.email_subject,
      body: proposal.email_body,
      unsubscribeUrl,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("redesigns/proposal/send: erro enviando e-mail", err);
    return NextResponse.json({ error: `Envio falhou: ${message}` }, { status: 502 });
  }

  // Só entra na lista de supressão DEPOIS do envio ter sucesso de fato. Uma
  // corrida entre dois assinantes enviando pro mesmo place_id ao mesmo tempo
  // é uma janela teórica aceita nesta escala de produto -- o pre-check acima
  // cobre o caso comum (sequencial), e um erro aqui não desfaz o e-mail já
  // enviado, só falha silenciosamente em registrar a supressão (logado).
  const { error: suppressionError } = await supabase.from("contacted_businesses").insert({
    place_id: lead.place_id,
    contacted_by_user_id: user.id,
    contacted_via: "email",
    opt_out_token: token,
  });
  if (suppressionError) {
    console.error("redesigns/proposal/send: erro registrando supressão", suppressionError);
  }

  await supabase.from("proposals").update({ email_sent_at: new Date().toISOString() }).eq("id", proposal.id);

  return NextResponse.json({ ok: true });
}
