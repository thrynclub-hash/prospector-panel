// Client factory pro Google Places API (New). Função, não singleton de módulo
// -- um client de módulo (Resend) já derrubou um build nesta sessão (ver
// ARCHITECTURE.md §0). Toda nova integração externa segue essa forma.
//
// Field mask restrito aos campos do tier Pro ($32/1000). NUNCA adicionar
// `reviews`, `editorialSummary` ou qualquer campo de atmosphere -- isso muda o
// preço da chamada inteira pro tier Enterprise ($35-40/1000), mesmo que só um
// campo caro tenha sido pedido (STACK.md §"What NOT to Use").
const PRO_TIER_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.websiteUri",
  "places.primaryType",
  "places.photos",
].join(",");

const DETAILS_FIELD_MASK = [
  "id",
  "displayName",
  "formattedAddress",
  "location",
  "rating",
  "userRatingCount",
  "websiteUri",
  "primaryType",
  "photos",
].join(",");

export interface PlaceResult {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  websiteUri?: string;
  primaryType?: string;
  photos?: Array<{ name: string }>;
}

export function createGooglePlacesClient() {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_PLACES_API_KEY não configurada");
  }

  return {
    /**
     * Text Search (New) -- `places:searchText`. `minRating` filtra direto na
     * API (BUSCA-02), evitando trazer resultados que seriam descartados no
     * cliente mesmo assim.
     */
    async searchText(params: { textQuery: string; minRating?: number }): Promise<PlaceResult[]> {
      const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": PRO_TIER_FIELD_MASK,
        },
        body: JSON.stringify({
          textQuery: params.textQuery,
          minRating: params.minRating ?? 4.7,
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Places searchText falhou (${res.status}): ${body}`);
      }

      const data = (await res.json()) as { places?: PlaceResult[] };
      return data.places ?? [];
    },

    /**
     * Place Details (New). Usado só pra re-exibir leads já salvos -- nunca
     * pra persistir os campos retornados (ver comentário na migration:
     * PITFALLS.md Pitfall 1, só place_id pode ser cacheado indefinidamente).
     */
    async getDetails(placeId: string): Promise<PlaceResult | null> {
      const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": DETAILS_FIELD_MASK,
        },
      });

      if (res.status === 404) return null;
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Places getDetails falhou (${res.status}): ${body}`);
      }

      return (await res.json()) as PlaceResult;
    },

    /**
     * Baixa os bytes de uma foto do Places (Photo Media, New). Retorna o
     * Buffer -- NUNCA construir a URL de mídia direto num <img src> no
     * cliente, isso vazaria a API key pro navegador do visitante. Quem chama
     * isto deve re-hospedar o resultado (ver lib/storage/assets.ts).
     */
    async fetchPhotoBytes(photoName: string, maxWidthPx = 800): Promise<{ bytes: Buffer; contentType: string } | null> {
      const res = await fetch(
        `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxWidthPx}&key=${apiKey}&skipHttpRedirect=false`
      );
      if (!res.ok) return null;
      const arrayBuffer = await res.arrayBuffer();
      return { bytes: Buffer.from(arrayBuffer), contentType: res.headers.get("content-type") ?? "image/jpeg" };
    },
  };
}
