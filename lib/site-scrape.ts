// Extração best-effort de fotos e cor de marca do site original do lead
// (REDESENHAR-05) -- mesmo padrão de lib/email-scrape.ts: fetch com timeout,
// regex (sem parser de HTML instalado no projeto), try/catch -> valor vazio,
// nunca lança. Um scrape "sem sucesso" é resultado esperado, não erro --
// quem chama isso (generate/route.ts) já trata null/[] como "cai no
// fallback de hoje: template neutro + fotos do Places".
const IMG_TAG_RE = /<img\b[^>]*>/gi;
const SRC_RE = /\bsrc=["']([^"']+)["']/i;
// Muitos sites (principalmente WordPress com plugin de lazy-load) deixam
// `src` como um placeholder base64 1x1 e colocam a URL real da imagem num
// atributo `data-*` -- nomes variam por plugin, então checa os mais comuns.
const LAZY_SRC_RE = /\bdata-(?:src|lazy-src|original|lazy)=["']([^"']+)["']/i;
const WIDTH_RE = /\bwidth=["']?(\d+)/i;
const HEIGHT_RE = /\bheight=["']?(\d+)/i;
const THEME_COLOR_RE = /<meta[^>]+name=["']theme-color["'][^>]*content=["']([^"']+)["']/i;
// "theme-color" é metadado de UI de navegador (cor da barra de status
// mobile), não necessariamente a cor de marca -- muitos temas deixam isso
// branco/preto genérico por padrão. Um valor assim não é sinal de marca
// nenhum; melhor cair em "sem cor" (null, template neutro) do que aplicar
// um accent color invisível/sem contraste na página gerada.
const GENERIC_COLOR_RE = /^#?(f{3}|f{6}|0{3}|0{6})$/i;

const IGNORED_FILENAME_PATTERNS = ["icon", "sprite", "favicon", "logo", "pixel", "1x1", "spacer", "avatar"];
const MIN_DIMENSION = 150;
const MAX_PHOTOS = 8;

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
      let src = imgTag.match(SRC_RE)?.[1];
      if (!src || src.startsWith("data:")) {
        src = imgTag.match(LAZY_SRC_RE)?.[1] ?? src;
      }
      if (!src || !isLikelyContentImage(imgTag, src)) continue;
      const resolved = resolveUrl(src, websiteUrl);
      if (resolved && !photoUrls.includes(resolved)) photoUrls.push(resolved);
    }

    const themeColorRaw = html.match(THEME_COLOR_RE)?.[1] ?? null;
    const themeColor = themeColorRaw && !GENERIC_COLOR_RE.test(themeColorRaw.trim()) ? themeColorRaw : null;

    return { photoUrls, themeColor };
  } catch {
    // Site fora do ar, timeout, bloqueio de scraping (CORS/anti-bot não
    // afeta fetch server-side, mas WAFs podem recusar) -- "não achou", não
    // erro fatal.
    return { photoUrls: [], themeColor: null };
  }
}
