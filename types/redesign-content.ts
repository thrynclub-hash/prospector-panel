// Shape CONGELADO de redesigns.content (ARCHITECTURE.md Anti-Pattern 3).
// Editor (Fase 3) e Publicar (Fase 4) leem/escrevem exatamente este shape --
// mudar isso depois exige migração de dados, não só código.
//
// REDESENHAR-02: separação explícita entre `facts` (verificado, nunca
// reescrito pela IA) e `generated` (copy de marketing, pode ser regenerado).
// Nenhum campo de horário/preço/certificação/depoimento existe aqui de
// propósito -- omitir é a resposta correta quando a fonte não tem o dado
// (skill redesign-premium, regra 1; Pitfall 2).
export interface RedesignContent {
  facts: {
    name: string;
    category: string | null;
    address: string | null;
    phone: string | null;
    websiteUrl: string | null;
    rating: number | null;
    userRatingCount: number | null;
  };
  generated: {
    heroHeadline: string;
    heroSubheadline: string;
    aboutCopy: string;
    services: Array<{ title: string; description: string }>;
  };
  photos: {
    logoUrl: string | null;
    photoUrls: string[];
  };
}
