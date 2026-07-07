"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, Mail, ShieldAlert, Target } from "lucide-react";

type Step = "form" | "checking" | "sent" | "not-found" | "error";

export default function ObrigadoPage() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<Step>("form");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStep("checking");

    try {
      const statusRes = await fetch("/api/access-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const statusData = await statusRes.json();

      if (!statusData.found || !statusData.active) {
        setStep("not-found");
        return;
      }

      const linkRes = await fetch("/api/send-login-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!linkRes.ok) {
        setStep("error");
        return;
      }

      setStep("sent");
    } catch {
      setStep("error");
    }
  }

  return (
    <main className="min-h-screen bg-bg flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent-dim flex items-center justify-center">
            <Target size={20} />
          </div>
          <span className="font-display font-bold text-ink text-lg">Hunter of Bad Pages</span>
        </div>

        <div className="bg-card border border-border rounded-[2rem] p-8 md:p-10 text-center">
          {step === "form" && (
            <>
              <h1 className="font-display font-bold text-2xl text-ink mb-3">Compra confirmada 🎯</h1>
              <p className="text-muted text-sm leading-relaxed mb-7">
                Digite o e-mail que você usou na compra pra liberar o acesso ao painel.
              </p>
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input
                  type="email"
                  required
                  placeholder="Seu e-mail da compra"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-bg border border-border rounded-2xl px-5 py-3.5 text-ink placeholder:text-muted focus:outline-none focus:border-accent/60 text-sm text-center"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 bg-accent text-white px-6 py-3.5 rounded-2xl font-bold text-sm hover:bg-accent-dim transition-colors"
                >
                  Liberar meu acesso
                </button>
              </form>
            </>
          )}

          {step === "checking" && (
            <>
              <Loader2 size={32} className="mx-auto text-accent-dim animate-spin mb-4" />
              <h1 className="font-display font-bold text-xl text-ink mb-2">Conferindo sua compra...</h1>
              <p className="text-muted text-sm">Isso leva só alguns segundos.</p>
            </>
          )}

          {step === "sent" && (
            <>
              <CheckCircle2 size={32} className="mx-auto text-good mb-4" />
              <h1 className="font-display font-bold text-xl text-ink mb-2">Acesso liberado!</h1>
              <p className="text-muted text-sm leading-relaxed flex items-center justify-center gap-2">
                <Mail size={15} /> Mandamos um link de entrada pro seu e-mail. Clica nele pra abrir o painel.
              </p>
            </>
          )}

          {step === "not-found" && (
            <>
              <ShieldAlert size={32} className="mx-auto text-warn mb-4" />
              <h1 className="font-display font-bold text-xl text-ink mb-2">Ainda não encontramos sua compra</h1>
              <p className="text-muted text-sm leading-relaxed mb-6">
                Às vezes a confirmação demora alguns segundos. Espera um pouco e tenta de novo.
              </p>
              <button
                onClick={() => setStep("form")}
                className="inline-flex items-center justify-center gap-2 bg-bg border border-border text-ink px-6 py-3 rounded-xl font-semibold text-sm hover:border-accent/50 transition-colors"
              >
                Tentar de novo
              </button>
            </>
          )}

          {step === "error" && (
            <>
              <ShieldAlert size={32} className="mx-auto text-bad mb-4" />
              <h1 className="font-display font-bold text-xl text-ink mb-2">Algo deu errado</h1>
              <p className="text-muted text-sm leading-relaxed">
                Tenta de novo em instantes, ou fala com a gente se persistir.
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
