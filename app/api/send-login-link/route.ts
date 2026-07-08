import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendMagicLinkEmail } from "@/lib/email/resend";

export async function POST(request: Request) {
  const { email } = (await request.json().catch(() => ({}))) as { email?: string };

  if (!email || typeof email !== "string") {
    return NextResponse.json({ ok: false, error: "E-mail obrigatório" }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const admin = createSupabaseAdminClient();

  const { data: customer } = await admin
    .from("prospector_customers")
    .select("status")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (!customer || customer.status !== "active") {
    return NextResponse.json({ ok: false, error: "not_found_or_inactive" }, { status: 404 });
  }

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: normalizedEmail,
  });

  if (linkError || !linkData) {
    console.error("send-login-link: erro gerando link", linkError);
    return NextResponse.json({ ok: false, error: "internal" }, { status: 500 });
  }

  // Link próprio (token_hash) em vez de linkData.properties.action_link -- o action_link
  // aponta pro /verify do Supabase, que usa o fluxo implicit (token na URL como fragmento)
  // e o nosso /auth/callback, sendo servidor, nunca consegue ler esse fragmento.
  const magicLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?token_hash=${linkData.properties.hashed_token}&type=magiclink&next=/painel`;

  try {
    await sendMagicLinkEmail({ to: normalizedEmail, magicLink });
  } catch (emailError) {
    console.error("send-login-link: e-mail falhou", emailError);
    return NextResponse.json({ ok: false, error: "email_failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
