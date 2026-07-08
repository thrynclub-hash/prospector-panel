// Places API não retorna e-mail de negócio (BUSCA-03 exige "presença de
// e-mail público"). Best-effort: busca a home do site do próprio negócio e
// procura um endereço de e-mail visível em texto/mailto -- não é dado do
// Places, então não cai na restrição de cache do Pitfall 1.
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const IGNORED_DOMAINS = ["sentry.io", "wixpress.com", "example.com", "godaddy.com"];

export async function findPublicEmail(websiteUrl: string): Promise<string | null> {
  try {
    const res = await fetch(websiteUrl, {
      signal: AbortSignal.timeout(6_000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; HunterOfBadPages/1.0)" },
    });
    if (!res.ok) return null;

    const html = await res.text();
    const matches = html.match(EMAIL_RE) ?? [];

    const candidate = matches.find((email) => {
      const domain = email.split("@")[1]?.toLowerCase() ?? "";
      return !IGNORED_DOMAINS.some((ignored) => domain.endsWith(ignored)) && !email.startsWith("data:");
    });

    return candidate?.toLowerCase() ?? null;
  } catch {
    // Site fora do ar, timeout, bloqueio de scraping -- "não achou", não erro fatal.
    return null;
  }
}
