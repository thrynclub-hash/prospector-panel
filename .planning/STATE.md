# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-07)

**Core value:** O assinante acha um negócio local com site ruim, gera um redesign com comparador antes/depois, e manda uma proposta pronta — tudo dentro do painel.
**Current focus:** Phase 2 (Redesenhar)

## Current Position

Phase: 2 of 7 (Redesenhar) — não iniciada
Plan: 1 of 1 completo na Fase 1
Status: Fase 1 (Buscar) implementada e rodando localmente; migration pendente de aplicar no banco real
Last activity: 2026-07-08 — Fase 1 (Buscar) completa: Places API (searchText+Details), PageSpeed, scrape de e-mail, schema `leads`/`usage_events` compatível com ToS, UI de busca/lista/quota. Ver `01-buscar/01-01-SUMMARY.md`.

Progress: [██░░░░░░░░] ~29% (2/7 fases)

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

- **Migration `20260708120000_leads_and_usage.sql` não aplicada no banco real** (`bhiggyigsrqfabqhutne`) — o MCP do Supabase desta sessão só enxerga PhotoForge e leonardo-ecossistema. Aplicar manualmente (SQL editor ou `supabase link`+`db push`) antes de testar Buscar com sessão real.
- **Schema do Places precisa seguir os termos de uso** (só `place_id` cacheável indefinidamente) — resolvido no design da Phase 1 (BUSCA-04), mas é a decisão mais fácil de errar por acidente se alguém "simplificar" o schema depois. Ver `.planning/research/PITFALLS.md` Pitfall 1. `ARCHITECTURE.md` ainda tem o schema desatualizado (com campos brutos permanentes) — vale corrigir esse arquivo numa próxima sessão pra não confundir.
- **`redesigns.content` (schema jsonb) é decisão que trava 3 fases** (Redesenhar escreve, Editor edita, Publicar renderiza) — precisa ser congelado na Phase 2, antes de começar Phase 3/4.
- Sem revisão jurídica formal do LGPD/Places ToS — pesquisa é grounded em fontes públicas mas não substitui parecer legal antes do lançamento (ver `.planning/research/SUMMARY.md` "Gaps to Address").
- **Banco Supabase é compartilhado com outros produtos** (ZapFlow, Toqy) — confirmado na Fase 0: `prospector_customers` tem colunas do ZapFlow (`zapi_*`) sobrando. RLS policies e constraints além do que foi introspectado não foram verificadas — checar antes de criar as tabelas novas da Fase 1+ (`leads`, `redesigns`, etc.), já que elas vão viver no mesmo banco.

## Session Continuity

Last session: 2026-07-08
Stopped at: Fase 1 (Buscar) implementada e testada localmente (dev server + smoke test das rotas). Falta aplicar a migration no banco real antes de testar com sessão de verdade. Próximo passo: aplicar migration, depois `/gsd:discuss-phase 2` ou direto `/gsd:plan-phase 2` pra Redesenhar.
Resume file: .planning/phases/01-buscar/01-01-SUMMARY.md
