import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Guard compartilhado pra toda a subárvore /painel/* -- sessão E assinatura
// ativa. Antes só existia checagem de sessão dentro de cada página; sem
// status, um assinante cancelado com cookie ainda válido continuava entrando.
export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: customer } = await supabase
    .from("prospector_customers")
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!customer || customer.status !== "active") {
    redirect("/obrigado");
  }

  return <>{children}</>;
}
