import Link from "next/link";
import { ArrowRight, Target, Search, Sparkles, Send, Check } from "lucide-react";

const CHECKOUT_URL = "https://pay.kiwify.com.br/eGdFlZ3";

export default function Home() {
  return (
    <main className="min-h-screen bg-bg overflow-x-clip">
      {/* ---------- HEADER ---------- */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-bg/75 border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent/10 text-accent-dim flex items-center justify-center">
              <Target size={16} />
            </div>
            <span className="font-display font-bold text-ink text-sm">Hunter of Bad Pages</span>
          </div>
          <div className="flex items-center gap-5">
            <Link
              href="/login"
              className="text-muted hover:text-ink text-sm font-semibold transition-colors hidden sm:block"
            >
              Já sou assinante
            </Link>
            <a
              href={CHECKOUT_URL}
              className="inline-flex items-center gap-1.5 bg-accent text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-accent-dim transition-colors"
            >
              Quero acesso <ArrowRight size={14} />
            </a>
          </div>
        </div>
      </header>

      {/* ---------- HERO ---------- */}
      <section className="relative pt-16 pb-24 md:pt-20 md:pb-32 px-6">
        <div
          className="absolute -top-24 right-0 w-[520px] h-[520px] bg-violet/[0.10] blur-[140px] rounded-full pointer-events-none"
          aria-hidden
        />
        <div
          className="absolute top-1/2 left-0 -translate-y-1/2 w-[420px] h-[420px] bg-accent/[0.10] blur-[120px] rounded-full pointer-events-none"
          aria-hidden
        />

        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.05fr_0.95fr] gap-16 lg:gap-8 items-center relative">
          {/* Copy column */}
          <div className="text-center lg:text-left animate-rise" style={{ animationDelay: "0ms" }}>
            <div className="inline-flex items-center gap-2 text-accent-dim text-xs font-semibold uppercase tracking-[0.2em] px-4 py-2 rounded-full border border-accent/20 bg-accent/[0.06] mb-8">
              <Target size={14} /> Hunter of Bad Pages
            </div>

            <h1 className="font-display font-bold text-[2.5rem] md:text-6xl leading-[1.05] tracking-tight mb-7 text-ink text-balance">
              Todo negócio local tem um site{" "}
              <span className="text-accent-dim">feio demais</span> pra ser verdade.
              <br className="hidden lg:block" /> Você acha, refaz e cobra por isso.
            </h1>

            <p className="text-muted text-lg leading-relaxed mb-10 max-w-xl mx-auto lg:mx-0">
              Um painel só: busca empresas bem avaliadas com site ruim, a IA recria a página com
              design de verdade, e a proposta sai pronta pra WhatsApp e e-mail. Sem precisar saber
              programar.
            </p>

            <div className="flex flex-col items-center lg:items-start gap-3">
              <a
                href={CHECKOUT_URL}
                className="group inline-flex items-center justify-center gap-2.5 bg-accent text-white px-8 py-4 rounded-2xl font-bold text-base hover:bg-accent-dim transition-colors shadow-[0_12px_32px_-8px_rgba(226,63,92,0.55)]"
              >
                Quero acesso agora
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
              </a>
              <p className="text-muted text-xs">
                <span className="text-ink font-semibold">R$10,97</span> no primeiro mês, depois{" "}
                <span className="text-ink font-semibold">R$19,97/mês</span> — cancele quando quiser
              </p>
            </div>
          </div>

          {/* Visual column — before/after mock */}
          <div
            className="relative h-[380px] md:h-[440px] animate-rise"
            style={{ animationDelay: "120ms" }}
            aria-hidden
          >
            <BrowserMock variant="before" className="absolute top-0 left-0 w-[78%] -rotate-3" />
            <BrowserMock variant="after" className="absolute bottom-0 right-0 w-[78%] rotate-2" />
          </div>
        </div>
      </section>

      {/* ---------- HOW IT WORKS ---------- */}
      <section className="py-24 px-6 border-y border-border bg-surface">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display font-bold text-2xl md:text-3xl text-ink text-center mb-16">
            Do lead ao cliente fechado, em três passos
          </h2>

          <ol className="space-y-14">
            <StepRow
              n="01"
              icon={<Search size={20} />}
              title="Prospectar"
              desc="Busca negócios locais nota alta no Google, mas com site fraco ou desatualizado — os leads mais fáceis de fechar."
              align="left"
            />
            <StepRow
              n="02"
              icon={<Sparkles size={20} />}
              title="Redesenhar"
              desc="A IA recria a página com conteúdo real e visual premium — comparador antes/depois pronto pra mostrar."
              align="right"
            />
            <StepRow
              n="03"
              icon={<Send size={20} />}
              title="Enviar proposta"
              desc="Mensagem pronta citando os problemas do site antigo — copia pro WhatsApp, e o e-mail sai sozinho."
              align="left"
            />
          </ol>
        </div>
      </section>

      {/* ---------- EARNING POTENTIAL ---------- */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-ink rounded-[2.5rem] px-8 py-14 md:px-16 md:py-16 text-center relative overflow-hidden">
            <div
              className="absolute -bottom-32 -right-16 w-72 h-72 bg-violet/20 blur-[100px] rounded-full pointer-events-none"
              aria-hidden
            />
            <p className="text-white/50 text-xs font-semibold uppercase tracking-[0.2em] mb-5">
              A conta é simples
            </p>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-white leading-tight mb-8 text-balance">
              A assinatura custa R$19,97/mês.
              <br />
              Um redesign fechado paga isso <span className="text-accent">25 vezes</span>.
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-10 justify-center text-white/80 text-sm mb-10">
              <PriceFact label="Redesign avulso" value="R$500 – R$1.000" />
              <PriceFact label="Manutenção mensal" value="R$97 / cliente" />
            </div>
            <a
              href={CHECKOUT_URL}
              className="inline-flex items-center justify-center gap-2.5 bg-accent text-white px-8 py-4 rounded-2xl font-bold text-base hover:bg-accent-dim transition-colors"
            >
              Começar agora <ArrowRight size={18} />
            </a>
          </div>
        </div>
      </section>

      {/* ---------- FOOTER ---------- */}
      <footer className="px-6 py-10 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent/10 text-accent-dim flex items-center justify-center">
              <Target size={16} />
            </div>
            <span className="font-display font-bold text-ink text-sm">Hunter of Bad Pages</span>
          </div>
          <p className="text-muted text-xs">Encontre. Refaça. Feche.</p>
        </div>
      </footer>
    </main>
  );
}

function BrowserMock({ variant, className = "" }: { variant: "before" | "after"; className?: string }) {
  const isAfter = variant === "after";
  return (
    <div
      className={`rounded-2xl border overflow-hidden shadow-2xl transition-transform hover:rotate-0 hover:scale-[1.02] duration-300 ${
        isAfter ? "border-accent/30 bg-card" : "border-border bg-surface"
      } ${className}`}
    >
      <div
        className={`flex items-center gap-1.5 px-4 py-3 border-b ${
          isAfter ? "border-accent/20 bg-accent/[0.05]" : "border-border bg-bg"
        }`}
      >
        <span className="w-2.5 h-2.5 rounded-full bg-bad/50" />
        <span className="w-2.5 h-2.5 rounded-full bg-warn/50" />
        <span className="w-2.5 h-2.5 rounded-full bg-good/50" />
        <span
          className={`ml-3 text-[10px] font-semibold uppercase tracking-wider ${
            isAfter ? "text-accent-dim" : "text-muted"
          }`}
        >
          {isAfter ? "depois" : "antes"}
        </span>
      </div>
      <div className="p-5 space-y-3">
        {isAfter ? (
          <>
            <div className="h-3 w-2/3 rounded-full bg-accent/60" />
            <div className="h-2 w-full rounded-full bg-ink/15" />
            <div className="h-2 w-5/6 rounded-full bg-ink/15" />
            <div className="flex gap-2 pt-2">
              <div className="h-14 flex-1 rounded-xl bg-violet/15" />
              <div className="h-14 flex-1 rounded-xl bg-accent/10" />
            </div>
            <div className="h-7 w-28 rounded-lg bg-accent mt-1" />
          </>
        ) : (
          <>
            <div className="h-3 w-1/2 rounded-full bg-ink/20" />
            <div className="h-2 w-full rounded-full bg-ink/10" />
            <div className="h-2 w-3/4 rounded-full bg-ink/10" />
            <div className="h-2 w-11/12 rounded-full bg-ink/10" />
            <div className="h-16 w-full rounded bg-ink/5 border border-dashed border-border mt-2" />
          </>
        )}
      </div>
    </div>
  );
}

function StepRow({
  n,
  icon,
  title,
  desc,
  align,
}: {
  n: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  align: "left" | "right";
}) {
  const reversed = align === "right";
  return (
    <li className={`flex items-start gap-6 ${reversed ? "md:flex-row-reverse md:text-right" : ""}`}>
      <span className="font-display font-bold text-5xl md:text-6xl text-ink/[0.08] leading-none shrink-0 select-none">
        {n}
      </span>
      <div className={`flex-1 ${reversed ? "md:items-end md:flex md:flex-col" : ""}`}>
        <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent-dim flex items-center justify-center mb-3">
          {icon}
        </div>
        <h3 className="font-display font-bold text-ink text-lg mb-1.5">{title}</h3>
        <p className="text-muted text-sm leading-relaxed max-w-sm">{desc}</p>
      </div>
    </li>
  );
}

function PriceFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 justify-center">
      <Check size={16} className="text-accent shrink-0" />
      <span>
        {label}: <span className="text-white font-semibold">{value}</span>
      </span>
    </div>
  );
}
