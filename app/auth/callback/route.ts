import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Recebe o link mágico e redireciona pro painel já logado.
//
// Os links que a gente manda por e-mail são gerados via admin.auth.admin.generateLink()
// (webhook da Kiwify e send-login-link), não via signInWithOtp() no navegador -- por isso
// chegam como token_hash+type, não como o `code` do fluxo PKCE. Ver token_hash primeiro;
// `code` fica como fallback caso algum dia um fluxo client-side seja adicionado.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/painel";

  const supabase = await createSupabaseServerClient();

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=link_invalido`);
}
