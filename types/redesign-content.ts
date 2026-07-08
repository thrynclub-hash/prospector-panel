// Shape CONGELADO de redesigns.content (ARCHITECTURE.md Anti-Pattern 3).
// Editor (Fase 3) e Publicar (Fase 4) leem/escrevem exatamente este shape --
// mudar isso depois exige migração de dados, não só código.
//
// REDESENHAR-02: separação explícita entre `facts` (verificado, nunca
// reescrito pela IA) e `generated` (copy de marketing, pode ser regenerado).
// Nenhum campo de horário/preço/certificação/depoimento existe aqui de
// propósito -- omitir é a resposta correta quando a fonte não tem o dado
// (skill redesign-premium, regra 1; Pitfall 2).
//
// REDESENHAR-05 (Fase 02.1): `theme` é uma extensão ADITIVA -- chave-irmã de
// nível superior, opcional/nullable de propósito (02.1-RESEARCH.md "Critical
// finding"). NUNCA aninhar isso dentro de `photos`: o PATCH em
// app/api/redesigns/[id]/route.ts faz `photos: body.photos ?? currentContent.photos`
// (substituição integral, não merge) e editor-form.tsx sempre manda um
// `photos` reconstruído à mão com só logoUrl/photoUrls -- qualquer chave nova
// dentro de `photos` seria apagada no primeiro "Salvar edição". `theme`
// segue o mesmo padrão já usado por `facts`: escrito uma vez na geração,
// read-only depois (nunca aceito do body do PATCH). Redesigns gerados antes
// desta fase não têm essa chave -- por isso é opcional, não só nullable.
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
  theme?: {
    primaryColor: string | null;
  } | null;
}
