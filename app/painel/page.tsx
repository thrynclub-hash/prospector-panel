import { Target } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function PainelPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen bg-bg px-6 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent-dim flex items-center justify-center">
            <Target size={20} />
          </div>
          <span className="font-display font-bold text-ink text-lg">Hunter of Bad Pages</span>
        </div>

        <h1 className="font-display font-bold text-3xl text-ink mb-3">Bem-vindo, {user?.email}</h1>
        <p className="text-muted mb-10">
          Seu acesso está ativo. O painel de prospecção completo está sendo construído agora — em breve
          você vai poder buscar leads, gerar propostas e enviar tudo por aqui.
        </p>

        <div className="bg-card border border-border rounded-2xl p-8">
          <p className="text-muted text-sm">🚧 Próximas seções: Prospectar, Redesenhar, Editor, Publicar, Proposta.</p>
        </div>
      </div>
    </main>
  );
}
