import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// app/api/* NÃO é coberto pelo guard de app/painel/layout.tsx (layouts só
// protegem a árvore de páginas, não Route Handlers). Toda rota de API sob o
// domínio do painel precisa repetir esta checagem -- mesmo padrão de "dois
// portões" (sessão + status) que o layout já aplica pras páginas.
export async function requireActiveUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Não autenticado" }, { status: 401 }) } as const;
  }

  const { data: customer } = await supabase
    .from("prospector_customers")
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!customer || customer.status !== "active") {
    return { error: NextResponse.json({ error: "Assinatura inativa" }, { status: 403 }) } as const;
  }

  return { supabase, user } as const;
}
