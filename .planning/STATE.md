# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-07)

**Core value:** O assinante acha um negócio local com site ruim, gera um redesign com comparador antes/depois, e manda uma proposta pronta — tudo dentro do painel.
**Current focus:** Phase 4 (Publicar)

## Current Position

Phase: 4 of 7 (Publicar) — não iniciada
Plan: 1 of 1 completo na Fase 3
Status: Fases 1, 2 e 3 implementadas e rodando localmente (build limpo); migrations pendentes de aplicar no banco real, AI_GATEWAY_API_KEY pendente de propagar totalmente
Last activity: 2026-07-08 — Fase 3 (Editor) completa: edição de texto/foto do redesign com sinalização "gerado por IA", excluir lead/redesign, comparação lado a lado em tela cheia. Ver `03-editor/03-01-SUMMARY.md`.

Progress: [█████░░░░░] ~57% (4/7 fases)

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: -
- Total execution time: -

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: -
- Trend: -

*Updated after each plan completion*

## Accumulated Context

### Decisions

- **Fase 3**: `content.facts` nunca é editável no Editor (só `generated`/`photos`) — a rota PATCH ignora qualquer coisa que o cliente mande pra `facts`, reconstruindo sempre a partir do valor já salvo.
- **Fase 3**: Editor usa inputs/textareas simples em vez de Tiptap (citado no ROADMAP original) — YAGNI, sem necessidade de rich-text pros campos atuais.
- **Gap de qualidade visual identificado (não resolvido ainda)**: o redesign gerado não reusa logo/paleta/fotos do SITE ORIGINAL do lead (só fotos do Google Places) — comparado lado a lado com um site original já bem feito, o redesign atual pode parecer pior visualmente, mesmo tendo conteúdo correto. Corrigir isso exigiria scraping do site original (logo, cores, hero) — combinado com o usuário pra voltar nisso depois da Fase 4.
- **Fase 2**: `redesigns.content` (jsonb) congelado como `types/redesign-content.ts` ANTES de Editor/Publicar existirem (Anti-Pattern 3 do ARCHITECTURE.md) — mudar esse shape depois exige migração de dados.
- **Fase 2**: Screenshot "antes" via Microlink (API gratuita, sem chave) em vez de Puppeteer/Playwright self-hosted.
- **Fase 1**: Corrigida inconsistência entre `ARCHITECTURE.md` (schema `leads` com campos brutos do Places permanentes) e `PITFALLS.md`/`BUSCA-04` (só `place_id` cacheável) — seguido o requirement. Lista de leads salvos re-busca Place Details ao vivo a cada render em vez de ler de coluna cacheada.
- **Fase 0**: Migration baseline escrita a partir de introspecção direta do schema real (PostgREST OpenAPI), não `supabase db pull` — evitou setup interativo do Supabase CLI pra uma tarefa onde o schema já era conhecido com certeza

Decisões completas em PROJECT.md (seção Key Decisions). Recentes:

- Redesign gerado por IA (não templates fixos) — fidelidade à promessa "premium" do plugin original
- URL pública de demo hospedada no próprio painel, sem HostGator/cPanel
- Proposta = texto copiar/colar no WhatsApp + envio automático só de e-mail (Resend)
- Hospedagem definitiva no domínio do cliente final fica pra v2

### Pending Todos

Nenhum ainda.

### Blockers/Concerns

- **Duas migrations não aplicadas no banco real** (`bhiggyigsrqfabqhutne`): `20260708120000_leads_and_usage.sql` e `20260708130000_redesigns.sql` — o MCP do Supabase desta sessão só enxerga PhotoForge e leonardo-ecossistema. Aplicar manualmente (SQL editor ou `supabase link`+`db push`) antes de testar com sessão real.
- **`AI_GATEWAY_API_KEY` ausente em `.env.local`** — geração de redesign (Fase 2) não roda em `npm run dev` local sem essa variável. Pegar em vercel.com → time → AI Gateway.
- **Schema do Places precisa seguir os termos de uso** (só `place_id` cacheável indefinidamente) — resolvido no design da Phase 1 (BUSCA-04), mas é a decisão mais fácil de errar por acidente se alguém "simplificar" o schema depois. Ver `.planning/research/PITFALLS.md` Pitfall 1. `ARCHITECTURE.md` ainda tem o schema desatualizado (com campos brutos permanentes) — vale corrigir esse arquivo numa próxima sessão pra não confundir.
- **`redesigns.content` (schema jsonb) é decisão que trava 3 fases** (Redesenhar escreve, Editor edita, Publicar renderiza) — precisa ser congelado na Phase 2, antes de começar Phase 3/4.
- Sem revisão jurídica formal do LGPD/Places ToS — pesquisa é grounded em fontes públicas mas não substitui parecer legal antes do lançamento (ver `.planning/research/SUMMARY.md` "Gaps to Address").
- **Banco Supabase é compartilhado com outros produtos** (ZapFlow, Toqy) — confirmado na Fase 0: `prospector_customers` tem colunas do ZapFlow (`zapi_*`) sobrando. RLS policies e constraints além do que foi introspectado não foram verificadas — checar antes de criar as tabelas novas da Fase 1+ (`leads`, `redesigns`, etc.), já que elas vão viver no mesmo banco.

## Session Continuity

Last session: 2026-07-08
Stopped at: Fases 1, 2 e 3 implementadas e testadas localmente (dev server + build de produção limpo). Migration real aplicada com sucesso pelo usuário; AI_GATEWAY_API_KEY configurada (1 geração real confirmada em produção). Gap de qualidade visual do redesign (logo/paleta do site original) identificado e combinado de voltar depois da Fase 4. Próximo passo: `/gsd:discuss-phase 4` ou direto `/gsd:plan-phase 4` pra Publicar.
Resume file: .planning/phases/03-editor/03-01-SUMMARY.md
