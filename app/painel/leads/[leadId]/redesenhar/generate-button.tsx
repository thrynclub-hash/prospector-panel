"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";

export function GenerateButton({ leadId, disabled }: { leadId: string; disabled: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/redesigns/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Geração falhou");
        return;
      }
      router.refresh();
    } catch {
      setError("Erro de conexão. Tenta de novo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleGenerate}
        disabled={loading || disabled}
        className="px-6 py-3 rounded-xl bg-accent text-white font-medium hover:bg-accent-dim transition-colors disabled:opacity-50 flex items-center gap-2"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
        {loading ? "Gerando..." : "Gerar redesign"}
      </button>
      {error && <p className="text-sm text-bad mt-2">{error}</p>}
    </div>
  );
}
