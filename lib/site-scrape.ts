// Extração best-effort de fotos e cor de marca do site original do lead
// (REDESENHAR-05) -- mesmo padrão de lib/email-scrape.ts: fetch com timeout,
// regex (sem parser de HTML instalado no projeto), try/catch -> valor vazio,
// nunca lança. Um scrape "sem sucesso" é resultado esperado, não erro --
// quem chama isso (generate/route.ts) já trata null/[] como "cai no
// fallback de hoje: template neutro + fotos do Places".
const IMG_TAG_RE = /<img\b[^>]*>/gi;
const SRC_RE = /\bsrc=["']([^"']+)["']/i;
const WIDTH_RE = /\bwidth=["']?(\d+)/i;
const HEIGHT_RE = /\bheight=["']?(\d+)/i;
const THEME_COLOR_RE = /<meta[^>]+name=["']theme-color["'][^>]*content=["']([^"']+)["']/i;

const IGNORED_FILENAME_PATTERNS = ["icon", "sprite", "favicon", "logo", "pixel", "1x1", "spacer", "avatar"];
const MIN_DIMENSION = 150;
const MAX_PHOTOS = 3;

function isLikelyContentImage(imgTag: string, src: string): boolean {
  if (src.startsWith("data:")) return false;

  const lowerSrc = src.toLowerCase();
  if (IGNORED_FILENAME_PATTERNS.some((pattern) => lowerSrc.includes(pattern))) return false;

  // Rejeita por dimensão declarada só quando o atributo existe -- muitas
  // imagens de conteúdo real não anotam width/height, então ausência não é
  // motivo de rejeição, só presença de um valor pequeno.
  const width = Number(imgTag.match(WIDTH_RE)?.[1]);
  const height = Number(imgTag.match(HEIGHT_RE)?.[1]);
  if (width && width < MIN_DIMENSION) return false;
  if (height && height < MIN_DIMENSION) return false;

  return true;
}

function resolveUrl(src: string, baseUrl: string): string | null {
  try {
    return new URL(src, baseUrl).toString();
  } catch {
    return null;
  }
}

export async function scrapeSiteAssets(
  websiteUrl: string
): Promise<{ photoUrls: string[]; themeColor: string | null }> {
  try {
    const res = await fetch(websiteUrl, {
      signal: AbortSignal.timeout(8_000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; HunterOfBadPages/1.0)" },
    });
    if (!res.ok) return { photoUrls: [], themeColor: null };

    const html = await res.text();

    const photoUrls: string[] = [];
    for (const imgTag of html.match(IMG_TAG_RE) ?? []) {
      if (photoUrls.length >= MAX_PHOTOS) break;
      const src = imgTag.match(SRC_RE)?.[1];
      if (!src || !isLikelyContentImage(imgTag, src)) continue;
      const resolved = resolveUrl(src, websiteUrl);
      if (resolved && !photoUrls.includes(resolved)) photoUrls.push(resolved);
    }

    const themeColor = html.match(THEME_COLOR_RE)?.[1] ?? null;

    return { photoUrls, themeColor };
  } catch {
    // Site fora do ar, timeout, bloqueio de scraping (CORS/anti-bot não
    // afeta fetch server-side, mas WAFs podem recusar) -- "não achou", não
    // erro fatal.
    return { photoUrls: [], themeColor: null };
  }
}
