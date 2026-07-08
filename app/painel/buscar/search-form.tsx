"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, Mail, Phone, AlertTriangle, CheckCircle2, Star } from "lucide-react";
import type { SearchResultItem } from "@/app/api/leads/search/route";

export function SearchForm({ initialQuota }: { initialQuota: { used: number; limit: number } }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResultItem[] | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [quota, setQuota] = useState(initialQuota);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim().length < 3) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/leads/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Busca falhou");
        if (data.limit) setQuota({ used: data.used, limit: data.limit });
        return;
      }

      setResults(data.results);
      setQuota(data.quota);
    } catch {
      setError("Erro de conexão. Tenta de novo.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(item: SearchResultItem) {
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        placeId: item.placeId,
        hasOwnWebsite: item.hasOwnWebsite,
        pagespeedScore: item.pagespeedScore,
        publicEmail: item.publicEmail,
      }),
    });

    if (res.ok || res.status === 409) {
      setSavedIds((prev) => new Set(prev).add(item.placeId));
      router.refresh();
    }
  }

  const quotaExhausted = quota.used >= quota.limit;

  return (
    <div className="mb-10">
      <form onSubmit={handleSearch} className="flex gap-3 mb-2">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex: restaurantes em Pinheiros, São Paulo"
            disabled={quotaExhausted}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-card text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-50"
          />
        </div>
        <button
          type="submit"
          disabled={loading || quotaExhausted || query.trim().length < 3}
          className="px-6 py-3 rounded-xl bg-accent text-white font-medium hover:bg-accent-dim transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
          Buscar
        </button>
      </form>

      <p className="text-sm text-muted mb-6">
        {quota.used}/{quota.limit} buscas usadas hoje
        {quotaExhausted && <span className="text-bad"> — limite diário atingido</span>}
      </p>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-bad-bg text-bad text-sm">{error}</div>
      )}

      {results && results.length === 0 && (
        <p className="text-muted text-sm mb-6">Nenhum resultado com nota ≥ 4.7 pra essa busca.</p>
      )}

      {results && results.length > 0 && (
        <div className="space-y-3">
          {results.map((item) => (
            <div
              key={item.placeId}
              className="flex items-start justify-between gap-4 bg-card border border-border rounded-2xl p-5"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-display font-bold text-ink">{item.name}</h3>
                  {item.rating && (
                    <span className="flex items-center gap-1 text-sm text-warn">
                      <Star size={14} fill="currentColor" /> {item.rating} ({item.userRatingCount})
                    </span>
                  )}
                </div>
                {item.address && <p className="text-sm text-muted mb-2">{item.address}</p>}
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  {item.isBadSite ? (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-bad-bg text-bad">
                      <AlertTriangle size={12} />
                      {item.hasOwnWebsite ? `Site ruim (PageSpeed ${item.pagespeedScore})` : "Sem site próprio"}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-good-bg text-good">
                      <CheckCircle2 size={12} />
                      Site OK (PageSpeed {item.pagespeedScore})
                    </span>
                  )}
                  {item.publicEmail && (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-surface border border-border text-muted">
                      <Mail size={12} />
                      {item.publicEmail}
                    </span>
                  )}
                  {item.phone && (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-surface border border-border text-muted">
                      <Phone size={12} />
                      {item.phone}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleSave(item)}
                disabled={savedIds.has(item.placeId)}
                className="shrink-0 px-4 py-2 rounded-xl border border-border text-sm font-medium text-ink hover:border-accent hover:text-accent transition-colors disabled:opacity-50 disabled:hover:border-border disabled:hover:text-ink"
              >
                {savedIds.has(item.placeId) ? "Salvo ✓" : "Salvar"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
