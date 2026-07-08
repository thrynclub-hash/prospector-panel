---
phase: 01-buscar
plan: 01
subsystem: leads
tags: [google-places, pagespeed, nextjs, supabase, quota]

requires:
  - phase: 00-fundacao
    provides: "Guard compartilhado em app/painel/layout.tsx"
provides:
  - "lib/google-places/client.ts — factory searchText/getDetails, field mask tier Pro"
  - "lib/pagespeed.ts, lib/email-scrape.ts, lib/quota.ts, lib/leads.ts, lib/auth-guard.ts"
  - "app/api/leads/search/route.ts (busca ao vivo), app/api/leads/route.ts (salvar/listar)"
  - "app/painel/buscar/page.tsx + search-form.tsx"
  - "supabase/migrations/20260708120000_leads_and_usage.sql (leads, usage_events)"
affects: [02-redesenhar]

tech-stack:
  added: []
  patterns:
    - "Places/PageSpeed clients são factory functions (createGooglePlacesClient()), nunca singleton de módulo — mesma regra do Resend (ARCHITECTURE.md §0)"
    - "app/api/* repete a checagem de sessão+assinatura (lib/auth-guard.ts) porque layout.tsx só protege páginas, não Route Handlers"
    - "leads guarda só place_id + dados derivados pelo próprio painel (public_email, pagespeed_score) — nunca campos brutos do Places (nome/rating/endereço/website); exibição sempre re-busca via Place Details ao vivo (lib/leads.ts)"
    - "Quota via log de eventos (usage_events) + COUNT(*) por dia, não contador mutável"

key-files:
  created:
    - supabase/migrations/20260708120000_leads_and_usage.sql
    - lib/google-places/client.ts
    - lib/pagespeed.ts
    - lib/email-scrape.ts
    - lib/quota.ts
    - lib/leads.ts
    - lib/auth-guard.ts
    - app/api/leads/search/route.ts
    - app/api/leads/route.ts
    - app/painel/buscar/page.tsx
    - app/painel/buscar/search-form.tsx
  modified: [app/painel/page.tsx]

key-decisions:
  - "Corrigida inconsistência entre ARCHITECTURE.md (schema leads com name/phone/rating/raw_places_data permanentes) e PITFALLS.md Pitfall 1 / BUSCA-04 (só place_id cacheável indefinidamente) — seguido o requirement (fonte de verdade), não o rascunho de arquitetura"
  - "E-mail de negócio não vem do Places API — scrape best-effort da home do próprio site (lib/email-scrape.ts), não é dado do Places então não cai na restrição de cache"
  - "'Site ruim' = sem website OU PageSpeed performance < 50 (limiar escolhido, não vindo de nenhum requirement numérico específico)"
  - "Limite diário de busca = 10/dia (env DAILY_SEARCH_LIMIT, default), valor não especificado em requirements — escolha de MVP, ajustável sem migration"
  - "Busca é sempre ao vivo (nunca persiste resultado até o assinante clicar Salvar); lista de leads salvos re-busca Place Details a cada render — aceitável no volume esperado (PITFALLS.md nota isso como otimização só necessária com 'dezenas+' de leads)"

patterns-established:
  - "Toda integração externa nova (Places, PageSpeed, scrape) fica em lib/ como função pura, sem estado de módulo"

requirements-completed: [BUSCA-01, BUSCA-02, BUSCA-03, BUSCA-04]
requirements-partial: ["FOUND-03 (metade de busca feita; metade de redesign fica pra Fase 2)"]

duration: ~1h
completed: 2026-07-08
---

# Phase 1: Buscar Summary

**Busca de leads via Google Places (Text Search New) com filtro de nota ≥4.7, detecção de "site ruim" via PageSpeed, scrape best-effort de e-mail público, e lista de leads salvos compatível com os termos de cache do Places (só `place_id` persistido) — tudo implementado como uma unidade (backend + UI), sem separação em dois planos.**

## Performance

- **Duration:** ~1h
- **Completed:** 2026-07-08
- **Files:** 11 criados, 1 modificado

## Accomplishments

- Client factory do Google Places (New) com field mask restrito ao tier Pro (evita pular pra tier Enterprise sem querer)
- Detecção de site ruim via PageSpeed Insights (score < 50 ou ausência de site)
- Scrape best-effort de e-mail público na home do site do negócio (Places API não fornece e-mail)
- Schema `leads`/`usage_events` com RLS, corrigido pra respeitar os termos do Google Places (só `place_id` permanente)
- Quota diária de busca (FOUND-03, metade) aplicada no servidor e visível na UI
- UI de busca + resultados + lista de leads salvos, dentro dos tokens visuais Signal Ledger já existentes
- Bug real encontrado e corrigido durante smoke-test: `user!.id` quebrava em runtime em `/painel/buscar` sem sessão (non-null assertion não é seguro mesmo com o guard do layout) — trocado por checagem explícita + redirect

## Deviations from Plan

Não havia PLAN.md prévio pra esta fase — pesquisa (`.planning/research/`) já cobria o essencial (STACK.md, PITFALLS.md), então implementação foi direto ao ponto a pedido explícito do usuário ("pular pra parte de já começar a fazer, sem pesquisar"). 01-01 e 01-02 do ROADMAP.md original foram implementados juntos como uma única unidade de trabalho, não dois planos separados.

## Issues Encountered

- **Migration `20260708120000_leads_and_usage.sql` não foi aplicada no banco real.** O MCP do Supabase disponível nesta sessão só enxerga os projetos "PhotoForge" e "leonardo-ecossistema" — nenhum bate com `bhiggyigsrqfabqhutne` (o projeto real do prospector-panel, "Marusso Projetos"). Precisa ser aplicada manualmente (SQL editor do Supabase Dashboard, ou `supabase link --project-ref bhiggyigsrqfabqhutne && supabase db push` com a CLI autenticada na conta certa) antes de testar a feature com uma sessão real — sem isso, `/painel/buscar` vai falhar ao consultar a tabela `leads`.
- Conflito entre `ARCHITECTURE.md` (research) e `PITFALLS.md`/`REQUIREMENTS.md` sobre o schema de `leads` — resolvido a favor do requirement (ver key-decisions). Vale corrigir `ARCHITECTURE.md` numa próxima sessão pra não confundir alguém que leia só esse arquivo.

## User Setup Required

- Aplicar a migration `20260708120000_leads_and_usage.sql` no projeto Supabase real (`bhiggyigsrqfabqhutne`) — ver Issues Encountered.
- Confirmar que `GOOGLE_PLACES_API_KEY` (já provisionada em `.env.local`) tem a Places API (New) e a PageSpeed Insights API habilitadas no Google Cloud Console do mesmo projeto.

## Next Phase Readiness

- `lib/google-places/client.ts` e o padrão de factory function ficam prontos pra Fase 2 (Redesenhar) reusar pra Places Photos.
- `lib/quota.ts` já suporta a ação `redesign_generate` (limite via `DAILY_REDESIGN_LIMIT`) — Fase 2 só precisa chamar `checkQuota`/`recordUsage` com essa action, sem migration nova.
- Bloqueio conhecido: migration pendente de aplicar (ver acima) — sem isso, Fase 1 não funciona contra dados reais, mesmo compilando e rodando localmente.

---
*Phase: 01-buscar*
*Completed: 2026-07-08*
