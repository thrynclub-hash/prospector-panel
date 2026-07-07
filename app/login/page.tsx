"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, Target } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/send-login-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
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
          {status === "sent" ? (
            <>
              <CheckCircle2 size={32} className="mx-auto text-good mb-4" />
              <h1 className="font-display font-bold text-xl text-ink mb-2">Link enviado</h1>
              <p className="text-muted text-sm">Confira seu e-mail pra entrar no painel.</p>
            </>
          ) : (
            <>
              <h1 className="font-display font-bold text-2xl text-ink mb-3">Entrar no painel</h1>
              <p className="text-muted text-sm leading-relaxed mb-7">
                Digite o e-mail da sua conta — mandamos um link de entrada, sem senha.
              </p>
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input
                  type="email"
                  required
                  placeholder="Seu e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-bg border border-border rounded-2xl px-5 py-3.5 text-ink placeholder:text-muted focus:outline-none focus:border-accent/60 text-sm text-center"
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="inline-flex items-center justify-center gap-2 bg-accent text-white px-6 py-3.5 rounded-2xl font-bold text-sm hover:bg-accent-dim transition-colors disabled:opacity-60"
                >
                  {status === "loading" ? <Loader2 size={16} className="animate-spin" /> : "Enviar link de entrada"}
                </button>
                {status === "error" && (
                  <p className="text-bad text-xs">Não encontramos uma assinatura ativa com esse e-mail.</p>
                )}
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
