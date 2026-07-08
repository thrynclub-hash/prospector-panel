import { CheckCircle2 } from "lucide-react";
import { createSupabasePublicClient } from "@/lib/supabase/public";

// Único WRITE público deste projeto (Fase 4 só tinha leitura pública). O
// token é a autorização, mas a comparação de fato acontece DENTRO da função
// `opt_out_business` (security definer, definida na migration 05-02) --
// nunca numa policy RLS nem num filtro `.eq()` deste cliente. Uma policy RLS
// do tipo `using (opt_out_token is not null)` pareceria certa mas não
// compararia o token recebido contra o token real da linha (toda linha tem
// token preenchido desde o insert); só o corpo da função tem acesso ao
// parâmetro `token` pra fazer essa comparação. Por isso não existe select
// nem update direto pro papel anon nesta tabela -- só `execute` na função.
export default async function UnsubscribePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = createSupabasePublicClient();

  const { data, error } = await supabase.rpc("opt_out_business", { token });

  // Resultado vazio (nenhuma linha casou o token) = token inválido/inexistente.
  const row = data?.[0];
  const success = !error && !!row;
  const alreadyOptedOut = row?.already_opted_out ?? false;

  return (
    <main className="min-h-screen bg-bg flex items-center justify-center px-6">
      <div className="max-w-sm text-center bg-card border border-border rounded-2xl p-8">
        {error || !success ? (
          <p className="text-bad">
            {error
              ? "Não foi possível processar seu pedido agora. Tente de novo mais tarde."
              : "Este link não é válido."}
          </p>
        ) : (
          <>
            <CheckCircle2 className="mx-auto mb-4 text-good" size={40} />
            <h1 className="font-display font-bold text-xl text-ink mb-2">
              {alreadyOptedOut ? "Pedido já registrado" : "Você não receberá mais contatos como este"}
            </h1>
            <p className="text-sm text-muted">
              {alreadyOptedOut
                ? "Este link já foi usado antes -- este contato já estava fora da nossa lista de envio automático."
                : "Removemos este contato da nossa lista de envio automático."}
            </p>
          </>
        )}
      </div>
    </main>
  );
}
