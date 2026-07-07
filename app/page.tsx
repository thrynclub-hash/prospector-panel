import { ArrowRight, Target, Search, Sparkles, Send } from "lucide-react";

const CHECKOUT_URL = "https://pay.kiwify.com.br/eGdFlZ3";

export default function Home() {
  return (
    <main className="min-h-screen bg-bg">
      <section className="relative pt-28 pb-20 md:pt-36 md:pb-28 px-6 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-accent/[0.08] blur-[120px] rounded-full pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 text-accent-dim text-xs font-semibold uppercase tracking-[0.2em] px-4 py-2 rounded-full border border-accent/20 bg-accent/[0.06] mb-8">
            <Target size={14} /> Hunter of Bad Pages
          </div>
          <h1 className="font-display font-bold text-4xl md:text-5xl leading-[1.15] tracking-tight mb-7 text-ink">
            Encontre empresas com sites ruins, recrie um site profissional com IA e envie a proposta automaticamente.
          </h1>
          <p className="text-muted text-lg leading-relaxed mb-10 max-w-xl mx-auto">
            Um painel só, sem precisar saber programar: prospecção, redesign com IA e envio de proposta em um fluxo direto.
          </p>
          <a
            href={CHECKOUT_URL}
            className="inline-flex items-center justify-center gap-2.5 bg-accent text-white px-8 py-4 rounded-2xl font-bold text-base hover:bg-accent-dim transition-colors"
          >
            Quero acesso — R$19,97/mês <ArrowRight size={18} />
          </a>
          <p className="text-muted text-xs mt-3">Primeira cobrança de R$10,97</p>
        </div>
      </section>

      <section className="py-16 px-6 bg-surface border-y border-border">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <Step icon={<Search size={20} />} title="1. Prospectar" desc="Busca negócios locais bem avaliados, mas com site fraco." />
          <Step icon={<Sparkles size={20} />} title="2. Redesenhar" desc="IA recria a página com design premium, aproveitando fotos e conteúdo reais." />
          <Step icon={<Send size={20} />} title="3. Enviar proposta" desc="Manda por e-mail e WhatsApp, automaticamente." />
        </div>
      </section>
    </main>
  );
}

function Step({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-7 text-center">
      <div className="w-11 h-11 rounded-xl bg-accent/10 text-accent-dim flex items-center justify-center mx-auto mb-5">
        {icon}
      </div>
      <h3 className="font-display font-bold text-ink mb-2">{title}</h3>
      <p className="text-muted text-sm leading-relaxed">{desc}</p>
    </div>
  );
}
