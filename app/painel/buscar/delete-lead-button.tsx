"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";

export function DeleteLeadButton({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function handleDelete() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${leadId}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      onBlur={() => setConfirming(false)}
      disabled={loading}
      title={confirming ? "Clique de novo pra confirmar" : "Excluir lead"}
      className={
        confirming
          ? "shrink-0 p-2 rounded-xl bg-bad text-white"
          : "shrink-0 p-2 rounded-xl border border-border text-muted hover:border-bad hover:text-bad transition-colors"
      }
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
    </button>
  );
}
