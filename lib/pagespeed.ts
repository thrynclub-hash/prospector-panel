// PageSpeed Insights v5 -- gratuito (25k req/dia), chave opcional. Usamos a
// mesma GOOGLE_PLACES_API_KEY se presente (mesmo projeto GCP costuma ter as
// duas APIs habilitadas); sem ela a chamada ainda funciona, só com rate limit
// menor (STACK.md §Recommended Stack).
export async function getPageSpeedScore(url: string): Promise<number | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  const params = new URLSearchParams({ url, category: "PERFORMANCE", strategy: "MOBILE" });
  if (key) params.set("key", key);

  try {
    const res = await fetch(
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params.toString()}`,
      { signal: AbortSignal.timeout(10_000) }
    );
    if (!res.ok) return null;

    const data = (await res.json()) as {
      lighthouseResult?: { categories?: { performance?: { score?: number } } };
    };
    const score = data.lighthouseResult?.categories?.performance?.score;
    return typeof score === "number" ? Math.round(score * 100) : null;
  } catch {
    // Site fora do ar, timeout, URL inválida -- tratamos como "não foi possível medir",
    // não como erro fatal da busca inteira.
    return null;
  }
}
