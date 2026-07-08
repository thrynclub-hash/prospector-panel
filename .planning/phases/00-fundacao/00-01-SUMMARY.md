---
phase: 00-fundacao
plan: 01
subsystem: auth
tags: [supabase, nextjs, rls-adjacent, migrations]

requires: []
provides:
  - "Guard compartilhado de sessão+assinatura em app/painel/layout.tsx"
  - "supabase/migrations/20260708000000_baseline.sql versionando o schema real de prospector_customers"
affects: [01-buscar, 02-redesenhar, 03-editor, 04-publicar, 05-proposta, 06-tabela-preco]

tech-stack:
  added: []
  patterns:
    - "Auth guard vive em layout.tsx, não em cada page.tsx — páginas novas sob /painel/* herdam proteção automaticamente"
    - "Migrations usam IF NOT EXISTS quando documentam uma tabela que já existe em produção com dados reais"

key-files:
  created: [app/painel/layout.tsx, supabase/migrations/20260708000000_baseline.sql]
  modified: [app/painel/page.tsx]

key-decisions:
  - "Guard checa user_id (não email) contra prospector_customers — já vem da sessão, evita um round-trip a mais"
  - "Sem sessão -> /login; com sessão mas sem assinatura ativa -> /obrigado (reaproveita fluxo self-service já existente, não criou tela nova)"
  - "Migration escrita a partir de introspecção direta do schema real (PostgREST OpenAPI), não de supabase db pull — evitou login/link interativo do Supabase CLI pra uma tarefa onde o schema já era conhecido com certeza"
  - "Colunas zapi_* (do ZapFlow, banco compartilhado) mantidas na migration — fora de escopo limpar, o objetivo era documentar a realidade"

patterns-established:
  - "Toda página nova do roadmap (Buscar/Redesenhar/Editor/Publicar/Proposta/Tabela de Preço) fica sob app/painel/* e herda o guard automaticamente, sem precisar repetir a checagem"

requirements-completed: [FOUND-01, FOUND-02]

duration: ~25min
completed: 2026-07-08
---

# Phase 0: Fundação Summary

**Guard de sessão+assinatura em `app/painel/layout.tsx` e migration baseline (`IF NOT EXISTS`) documentando o schema real de `prospector_customers`, incluindo um achado não-previsto (colunas `zapi_*` do ZapFlow no banco compartilhado).**

## Performance

- **Duration:** ~25 min
- **Completed:** 2026-07-08
- **Tasks:** 2
- **Files modified:** 3 (2 criados, 1 modificado)

## Accomplishments
- `/painel` agora bloqueia por assinatura, não só por sessão — testado em produção: sem sessão → 307, com sessão ativa → 200
- Schema de `prospector_customers` confirmado via introspecção direta do banco (não suposição) e versionado pela primeira vez
- Achado registrado: a tabela tem colunas do ZapFlow (`zapi_instance_id`, `zapi_token`, `zapi_client_token`) por causa do banco Supabase compartilhado — documentado, não removido (fora de escopo)

## Files Created/Modified
- `app/painel/layout.tsx` - guard compartilhado (sessão + `status === "active"`)
- `app/painel/page.tsx` - checagem de auth inline removida (agora vive só no layout)
- `supabase/migrations/20260708000000_baseline.sql` - baseline do schema real

## Decisions Made
Ver `key-decisions` no frontmatter.

## Deviations from Plan

None - plan executado como escrito.

## Issues Encountered

Nenhum na implementação em si. Durante a validação manual do fluxo de login (feita antes desta fase, na sessão de correção de bugs), foi corrigido separadamente um bug pré-existente no fluxo de magic link (`token_hash`/`verifyOtp` em vez de `action_link`) — não fazia parte do escopo desta fase, já estava commitado antes de a Fase 0 começar.

## User Setup Required

None - nenhuma configuração externa necessária.

## Next Phase Readiness

- Toda página nova sob `app/painel/*` (Fases 1-6) herda proteção automaticamente, sem precisar repetir código de guard
- `supabase/migrations/` existe como convenção — próximas fases que criam tabelas novas (`leads`, `redesigns`, etc.) devem seguir o mesmo padrão de migration versionada
- Nenhum bloqueio conhecido pra Fase 1 (Buscar)

---
*Phase: 00-fundacao*
*Completed: 2026-07-08*
