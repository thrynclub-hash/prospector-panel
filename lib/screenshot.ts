// Screenshot do site original pro comparador antes/depois (REDESENHAR-03) +
// logo do negócio pro redesign (REDESENHAR-05) -- uma chamada só à Microlink
// (API gratuita, sem chave). meta=true acrescenta metadata normalizada, que
// já inclui um campo `logo` resolvido via a cadeia padrão
// apple-touch-icon/shortcut-icon/favicon -- confirmado ao vivo contra
// stripe.com (02.1-RESEARCH.md, retornou o favicon 180x180 PNG deles). Zero
// nova lib, zero round-trip HTTP extra: mesma chamada que já existia pro
// screenshot "antes".
//
// Ver STACK.md "What NOT to Use": Chromium num Vercel Function estoura o
// limite de tamanho e tem cold start de 3-8s. Se o volume crescer, trocar
// por um provedor pago (ScreenshotOne/urlbox) é só trocar a URL desta função.
export async function captureSiteVisuals(
  url: string
): Promise<{ screenshotUrl: string | null; logoUrl: string | null }> {
  try {
    const res = await fetch(
      `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=true&waitUntil=networkidle2`,
      { signal: AbortSignal.timeout(15_000) }
    );
    if (!res.ok) return { screenshotUrl: null, logoUrl: null };

    const data = (await res.json()) as {
      status: string;
      data?: { screenshot?: { url?: string }; logo?: { url?: string } };
    };
    if (data.status !== "success") return { screenshotUrl: null, logoUrl: null };

    return {
      screenshotUrl: data.data?.screenshot?.url ?? null,
      logoUrl: data.data?.logo?.url ?? null,
    };
  } catch {
    // Site fora do ar, timeout, rate limit da Microlink -- "sem
    // screenshot/logo", não erro fatal da geração inteira (REDESENHAR-03/05
    // degradam bem sem isso).
    return { screenshotUrl: null, logoUrl: null };
  }
}
