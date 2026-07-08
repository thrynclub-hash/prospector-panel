"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";

export function DeleteRedesignButton({ redesignId }: { redesignId: string }) {
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
      const res = await fetch(`/api/redesigns/${redesignId}`, { method: "DELETE" });
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
      className={
        confirming
          ? "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-bad text-white text-sm font-medium"
          : "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm text-muted hover:border-bad hover:text-bad transition-colors"
      }
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
      {confirming ? "Confirmar exclusão?" : "Excluir redesign"}
    </button>
  );
}
