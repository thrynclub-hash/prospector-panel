// Screenshot do site original pro comparador antes/depois (REDESENHAR-03).
// Usa a API gratuita da Microlink (sem chave, rate limit baixo mas suficiente
// pro volume de um assinante processando leads manualmente) em vez de
// Puppeteer/Playwright self-hosted -- ver STACK.md "What NOT to Use":
// Chromium num Vercel Function estoura o limite de tamanho e tem cold start
// de 3-8s. Se o volume crescer, trocar por um provedor pago (ScreenshotOne/
// urlbox) é só trocar a URL desta função.
export async function captureScreenshot(url: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&waitUntil=networkidle2`,
      { signal: AbortSignal.timeout(15_000) }
    );
    if (!res.ok) return null;

    const data = (await res.json()) as { status: string; data?: { screenshot?: { url?: string } } };
    if (data.status !== "success") return null;

    return data.data?.screenshot?.url ?? null;
  } catch {
    // Site fora do ar, timeout, rate limit da Microlink -- "sem screenshot",
    // não erro fatal da geração inteira (REDESENHAR-03 degrada bem sem isso).
    return null;
  }
}
