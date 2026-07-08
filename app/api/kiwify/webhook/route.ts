import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendMagicLinkEmail } from "@/lib/email/resend";

// Webhook da Kiwify — Hunter of Bad Pages
// Mesmo padrão comprovado do PhotoForge (app/api/kiwify/webhook/route.ts),
// adaptado pro caso de compra direta (sem conta prévia): cria a conta na
// hora se não existir, em vez de pular quando não encontra o usuário.

type KiwifyWebhookBody = {
  order_id: string;
  webhook_event_type: string;
  order_status: string;
  Customer: { email: string; full_name: string };
};

export async function POST(request: Request) {
  try {
    const secret = new URL(request.url).searchParams.get("secret");
    if (!secret || secret !== process.env.KIWIFY_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as KiwifyWebhookBody;
    const { order_id, webhook_event_type, order_status, Customer } = body;

    const isApproved =
      (webhook_event_type === "order_approved" || webhook_event_type === "order_paid") &&
      order_status === "paid";

    if (!isApproved) {
      return NextResponse.json({ ok: true, skipped: "not_paid" });
    }

    const email = Customer.email.trim().toLowerCase();
    const admin = createSupabaseAdminClient();

    // Idempotência: se essa compra já foi processada, não duplica conta/e-mail.
    const { data: existingCustomer, error: lookupError } = await admin
      .from("prospector_customers")
      .select("id, user_id, kiwify_order_id")
      .eq("email", email)
      .maybeSingle();

    if (lookupError) {
      console.error("Kiwify webhook: erro buscando cliente", lookupError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    let userId: string;

    if (existingCustomer) {
      userId = existingCustomer.user_id;
      // Cliente já existe (ex: cobrança recorrente do mês seguinte) — garante status ativo.
      await admin
        .from("prospector_customers")
        .update({ status: "active", kiwify_order_id: order_id })
        .eq("id", existingCustomer.id);
    } else {
      // Primeira compra — cria a conta na hora, sem exigir cadastro prévio.
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { full_name: Customer.full_name ?? null },
      });

      if (createError || !created.user) {
        console.error("Kiwify webhook: erro criando usuário", createError);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
      }

      userId = created.user.id;

      const { error: insertError } = await admin.from("prospector_customers").insert({
        user_id: userId,
        email,
        kiwify_order_id: order_id,
        status: "active",
      });

      if (insertError) {
        console.error("Kiwify webhook: erro criando cliente", insertError);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
      }
    }

    // Link mágico pra entrar no painel sem precisar de senha.
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

    if (linkError || !linkData) {
      console.error("Kiwify webhook: erro gerando link mágico", linkError);
      return NextResponse.json({ ok: true, warning: "account_created_but_link_failed" });
    }

    // Link próprio (token_hash) em vez de linkData.properties.action_link -- ver
    // comentário equivalente em app/api/send-login-link/route.ts.
    const magicLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?token_hash=${linkData.properties.hashed_token}&type=magiclink&next=/painel`;

    try {
      await sendMagicLinkEmail({ to: email, magicLink });
    } catch (emailError) {
      console.error("Kiwify webhook: e-mail falhou (conta já criada)", emailError);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Kiwify webhook: erro inesperado", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
