import Link from "next/link";
import { ArrowLeft, Sparkles, RefreshCw } from "lucide-react";

// PRECO-01: tela estática com a faixa de preço sugerida. Sem query de banco,
// sem client state -- os valores são fixos, definidos no requirement. Sem
// guard próprio: app/painel/layout.tsx já protege toda a subárvore /painel/*
// (sessão + assinatura ativa).
export default function PrecosPage() {
  return (
    <main className="min-h-screen bg-bg px-6 py-16">
      <div className="max-w-4xl mx-auto">
        <Link href="/painel" className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink mb-8">
          <ArrowLeft size={16} /> Painel
        </Link>

        <h1 className="font-display font-bold text-3xl text-ink mb-2">Tabela de Preço</h1>
        <p className="text-muted mb-8">
          Use como ponto de partida pra negociar com o cliente final — ajuste conforme o porte do negócio.
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent-dim flex items-center justify-center mb-4">
              <Sparkles size={18} />
            </div>
            <p className="font-display font-bold text-ink mb-1">Redesign</p>
            <p className="font-display font-bold text-3xl text-accent mb-2">R$500 – R$1.000</p>
            <p className="text-sm text-muted">Cobrança única pela criação do novo site.</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent-dim flex items-center justify-center mb-4">
              <RefreshCw size={18} />
            </div>
            <p className="font-display font-bold text-ink mb-1">Manutenção</p>
            <p className="font-display font-bold text-3xl text-accent mb-2">R$97/mês</p>
            <p className="text-sm text-muted">Recorrência mensal por manter o site no ar e atualizado.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
