# Roadmap: Hunter of Bad Pages

## Overview

O painel hoje só tem o esqueleto de assinatura (Kiwify + Supabase Auth + `/painel` como placeholder). Este milestone constrói as 5 features que fazem o produto existir de fato — Buscar, Redesenhar, Editor, Publicar, Proposta — mais uma tela de tabela de preço, replicando o fluxo do plugin `ArrecheNeto/PROSPECTOR-DE-SITES` como produto web self-service. A ordem segue a cadeia de dependência real dos dados (um lead precisa existir antes de ser redesenhado; um redesign precisa existir antes de ser editado ou publicado) e coloca as salvaguardas encontradas na pesquisa (conformidade com os termos do Google Places, separação fato/gerado no conteúdo de IA, avisos e não-indexação na demo pública, limite de uso, lista de supressão) dentro da fase que gera cada risco — não como um "phase de compliance" separado no fim.

## Phases

**Phase Numbering:**
- Fases inteiras (0, 1, 2...): trabalho planejado do milestone
- Fases decimais (2.1, 2.2): inserções urgentes (marcadas com INSERTED)

- [x] **Phase 0: Fundação** - Guard de auth+assinatura compartilhado no `/painel` + migrations versionadas do Supabase
- [x] **Phase 1: Buscar** - Busca de leads via Google Maps, compatível com os termos do Places, com limite de uso
- [x] **Phase 2: Redesenhar** - Geração de landing page por IA + comparador antes/depois, com separação fato/gerado
- [x] **Phase 3: Editor** - Edição de texto/imagem da página gerada, com sinalização de campos de IA
- [x] **Phase 4: Publicar** - URL pública de demo com aviso, noindex e slug não-adivinhável
- [ ] **Phase 5: Proposta** - Mensagem de proposta (WhatsApp copiar/colar + e-mail automático) com lista de supressão
- [ ] **Phase 6: Tabela de Preço** - Tela estática com faixa de preço sugerido pro assinante revender

## Phase Details

### Phase 0: Fundação
**Goal**: Fechar as duas dívidas já mapeadas em `.planning/codebase/CONCERNS.md` antes que 5 fases novas construam em cima delas — guard de auth+assinatura compartilhado e schema versionado.
**Depends on**: Nada (primeira fase)
**Requirements**: FOUND-01, FOUND-02
**Success Criteria** (o que precisa ser verdade):
  1. Qualquer página nova sob `/painel/*` fica automaticamente protegida (sessão + `status=active`) sem repetir código de guard
  2. Um assinante com sessão válida mas assinatura cancelada é redirecionado pra `/obrigado`, não vê o painel
  3. `supabase/migrations/` existe e reflete o schema real atual (`prospector_customers`), aplicável do zero em um projeto novo
**Plans**: TBD (refinar em `/gsd:plan-phase 0`)

Plans:
- [x] 00-01: Baseline de migrations (capturar schema atual) + `app/painel/layout.tsx` guard compartilhado

### Phase 1: Buscar
**Goal**: Assinante encontra negócios locais com site ruim e nota alta, sem violar os termos de cache do Google Places.
**Depends on**: Phase 0
**Requirements**: FOUND-03 (metade — busca), BUSCA-01, BUSCA-02, BUSCA-03, BUSCA-04
**Success Criteria** (o que precisa ser verdade):
  1. Assinante busca por localização/categoria e vê negócios com nota ≥ 4.7
  2. Resultados mostram se o negócio não tem site, ou tem site com PageSpeed baixo, e se há e-mail público
  3. Leads salvos aparecem numa lista revisável depois, sem que o painel tenha guardado dados do Places além do `place_id` permanentemente
  4. Assinante vê quantas buscas já usou hoje e é bloqueado ao atingir o limite
**Plans**: 1/1 plan executado — Phase COMPLETE (2026-07-08)

Plans:
- [x] 01-01: Integração Places API (searchText + Place Details) + PageSpeed + scrape de e-mail + schema `leads`/`usage_events` compatível com ToS + rotas de API + UI de busca/lista/quota (implementado como uma unidade, sem separação backend/UI — ver `01-01-SUMMARY.md`)

**Pendência conhecida:** migration `20260708120000_leads_and_usage.sql` ainda não foi aplicada no banco real (`bhiggyigsrqfabqhutne`) — o MCP do Supabase disponível nesta sessão não tem acesso a esse projeto (só enxerga PhotoForge e leonardo-ecossistema). Precisa ser aplicada manualmente (SQL editor do Supabase, ou `supabase link --project-ref bhiggyigsrqfabqhutne && supabase db push`) antes de testar a feature com sessão real.

### Phase 2: Redesenhar
**Goal**: Assinante gera uma versão redesenhada por IA de um lead, com comparador antes/depois, sem inventar fatos sobre o negócio.
**Depends on**: Phase 1
**Requirements**: FOUND-03 (metade — geração), REDESENHAR-01, REDESENHAR-02, REDESENHAR-03, REDESENHAR-04
**Success Criteria** (o que precisa ser verdade):
  1. Assinante clica "gerar" num lead e recebe uma landing page nova com conteúdo real melhorado
  2. A página gerada nunca mostra horário, preço, certificação ou depoimento que não veio de uma fonte real
  3. Comparador mostra o site antigo (screenshot) lado a lado com o gerado
  4. Fotos/logo usados são do próprio negócio (Places Photos) ou um fallback genérico, nunca imagem de terceiro sem checagem
  5. Assinante vê quantas gerações já usou hoje e é bloqueado ao atingir o limite
**Plans**: 1/1 plan executado — Phase COMPLETE (2026-07-08)

Plans:
- [x] 02-01: Schema `redesigns.content` (jsonb, campos fato vs. gerado) + geração via AI Gateway (Gemini Flash) + Places Photos re-hospedadas + screenshot "antes" (Microlink) + comparador visual (`react-compare-slider`) — implementado como uma unidade, sem separação em dois planos. Ver `02-01-SUMMARY.md`.

**Pendências conhecidas:**
- Migration `20260708130000_redesigns.sql` também não aplicada no banco real (mesmo bloqueio da Fase 1 — MCP do Supabase sem acesso a `bhiggyigsrqfabqhutne`).
- `AI_GATEWAY_API_KEY` não configurada em `.env.local` — geração não roda localmente até essa chave existir (em produção na Vercel funciona via OIDC automático, sem variável extra).
- Sem scrape de paleta/logo do site original do lead — o preview usa template neutro + fotos do Places, não a paleta real do negócio (fora do escopo desta fase; ver nota em `redesign-preview.tsx`).

### Phase 3: Editor
**Goal**: Assinante ajusta o que a IA gerou antes de publicar ou enviar.
**Depends on**: Phase 2 (schema `redesigns.content` congelado)
**Requirements**: EDITOR-01, EDITOR-02
**Success Criteria** (o que precisa ser verdade):
  1. Assinante edita texto e troca imagem da página gerada direto no painel
  2. Campos que a IA gerou (não vieram de fonte verificada) ficam visualmente marcados no editor
**Plans**: 1/1 plan executado — Phase COMPLETE (2026-07-08)

Plans:
- [x] 03-01: Editor de campos (inputs/textareas simples, não Tiptap) + upload/remoção de foto + sinalização "gerado por IA" em cada seção editável. Ver `03-01-SUMMARY.md`.

**Extras aproveitados na mesma passada** (pedido explícito do usuário, "não pode esquecer botões necessários"): excluir lead (`leads` list), excluir redesign, e uma página de comparação lado a lado em tela cheia (`/redesenhar/compare`, 50%/50%, cada lado com rolagem própria) pra substituir o comparador de 600px em situações onde ver as duas páginas inteiras importa mais que o efeito de slider.

### Phase 4: Publicar
**Goal**: Redesign vira uma URL pública de demonstração seguro pra mostrar ao dono do negócio, sem risco de parecer o site real dele.
**Depends on**: Phase 2 (schema `redesigns.content` congelado) — não depende da Phase 3
**Requirements**: PUBLICAR-01, PUBLICAR-02, PUBLICAR-03, PUBLICAR-04
**Success Criteria** (o que precisa ser verdade):
  1. Assinante publica um redesign (editado ou não) e recebe uma URL pública
  2. A página pública mostra um aviso visível de que é uma demonstração não-oficial
  3. A página pública não é indexada por buscadores (testável via `robots.txt`/meta)
  4. A URL não usa o nome do negócio nem um ID sequencial — é um slug não-adivinhável
**Plans**: 1/1 plan executado — Phase COMPLETE (2026-07-08)

Plans:
- [x] 04-01: Rota pública `app/demo/[slug]` isolada (client anon-key + view `public_redesigns` com `security_invoker`) + slug via `nanoid(12)` + banner de aviso persistente + `noindex` (meta + robots.txt) + publicar/despublicar no painel. Ver `04-01-SUMMARY.md`.

### Phase 5: Proposta
**Goal**: Assinante recebe um texto de proposta pronto, citando os problemas reais do site antigo, sem risco de reincidir em spam.
**Depends on**: Phase 1 (leads) — sequenciado depois da Phase 4 porque a proposta cita o link público
**Requirements**: PROPOSTA-01, PROPOSTA-02, PROPOSTA-03, PROPOSTA-04
**Success Criteria** (o que precisa ser verdade):
  1. Painel gera um texto citando os problemas específicos detectados naquele site, sem preço
  2. Existe um botão/link que abre o WhatsApp com o texto pré-preenchido (`wa.me`)
  3. Existe um botão que dispara o e-mail automaticamente via Resend
  4. Um negócio que já recebeu e-mail automático (de qualquer assinante) não recebe de novo
**Plans**: TBD

Plans:
- [ ] 05-01: Geração de texto (WhatsApp + e-mail) + lista de supressão + envio via Resend

### Phase 6: Tabela de Preço
**Goal**: Assinante sabe quanto cobrar do cliente final.
**Depends on**: Nada tecnicamente — sem dependência de dados de nenhuma outra fase
**Requirements**: PRECO-01
**Success Criteria** (o que precisa ser verdade):
  1. Existe uma tela no painel mostrando a faixa de preço sugerido (redesign R$500–1.000, manutenção R$97/mês)
**Plans**: 1 plan

Plans:
- [ ] 06-01: Tela estática de tabela de preço

## Progress

**Execution Order:**
Fases executam em ordem numérica: 0 → 1 → 2 → 3 → 4 → 5 → 6
(Fase 3 e Fase 4 dependem só da Fase 2, não uma da outra — podem ser paralelizadas na execução)

| Phase | Plans Complete | Status | Completed |
|-------|-----------------|--------|-----------|
| 0. Fundação | 1/1 | Complete | 2026-07-08 |
| 1. Buscar | 1/1 | Complete (migration pendente de aplicar) | 2026-07-08 |
| 2. Redesenhar | 1/1 | Complete (migration + AI_GATEWAY_API_KEY pendentes) | 2026-07-08 |
| 3. Editor | 1/1 | Complete | 2026-07-08 |
| 4. Publicar | 1/1 | Complete (migration pendente de aplicar) | 2026-07-08 |
| 5. Proposta | 0/1 | Not started | - |
| 6. Tabela de Preço | 0/1 | Not started | - |
