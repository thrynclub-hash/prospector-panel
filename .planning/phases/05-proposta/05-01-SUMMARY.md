---
phase: 05-proposta
plan: 01
subsystem: api
tags: [google-places, field-mask, redesigns, whatsapp, phone]

# Dependency graph
requires:
  - phase: 04-publicar
    provides: "redesigns.content frozen shape, /demo/[slug] public page that the WhatsApp/e-mail proposal will link to"
provides:
  - "lib/google-places/client.ts requests internationalPhoneNumber in both Text Search and Place Details field masks"
  - "PlaceResult.internationalPhoneNumber typed field"
  - "app/api/redesigns/generate/route.ts populates content.facts.phone from real Places data instead of hardcoded null"
affects: [05-proposta remaining plans (WhatsApp button, proposal generation), any future phase touching Places field masks or redesign generation]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Places field mask billing-tier comment kept in sync with actual fields requested"]

key-files:
  created: []
  modified:
    - lib/google-places/client.ts
    - app/api/redesigns/generate/route.ts

key-decisions:
  - "Used internationalPhoneNumber (not nationalPhoneNumber) because it includes the country code required by wa.me links"
  - "No backfill for existing redesigns rows -- CONTEXT.md's hide-button-if-missing rule already covers phone: null gracefully for old rows"

patterns-established:
  - "Places field mask billing-tier comment updated in place rather than removed, flagging that rating/userRatingCount/websiteUri already requested are likely Enterprise-tier per current Google docs, so this addition probably doesn't change the billing tier"

requirements-completed: [PROPOSTA-02]

# Metrics
duration: ~10min
completed: 2026-07-08
---

# Phase 5 Plan 1: Places Phone Field Summary

**Novos redesigns agora têm `content.facts.phone` preenchido a partir de `internationalPhoneNumber` do Google Places, em vez do `null` fixo herdado da Fase 2 -- desbloqueando o botão de WhatsApp que as próximas plans desta fase dependem.**

## Performance

- **Duration:** ~10 min
- **Completed:** 2026-07-08
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- `PRO_TIER_FIELD_MASK` e `DETAILS_FIELD_MASK` (Text Search e Place Details) agora pedem `internationalPhoneNumber`
- `PlaceResult` tipado com `internationalPhoneNumber?: string`
- `app/api/redesigns/generate/route.ts` popula `facts.phone` a partir de `details.internationalPhoneNumber ?? null` em vez de `null` hardcoded
- Comentário de billing tier no topo de `client.ts` atualizado com a nota sobre `rating`/`userRatingCount`/`websiteUri` já serem provavelmente Enterprise-tier hoje, independente desta mudança

## Task Commits

Each task was committed atomically:

1. **Task 1: Adicionar campo de telefone aos field masks do Places + interface** - `71c0bad` (feat)
2. **Task 2: Popular content.facts.phone na rota de geração** - `f544368` (feat)

## Files Created/Modified
- `lib/google-places/client.ts` - Field masks (Text Search + Details) e `PlaceResult` agora incluem `internationalPhoneNumber`; comentário de billing tier atualizado
- `app/api/redesigns/generate/route.ts` - `facts.phone` lido de `details.internationalPhoneNumber ?? null` em vez de `null` fixo

## Decisions Made
- `internationalPhoneNumber` (não `nationalPhoneNumber`) escolhido por já incluir código do país, exigido pelo formato `wa.me/<digits>`.
- Sem backfill de redesigns já existentes: continuam com `phone: null` para sempre -- a regra já travada em CONTEXT.md ("esconder o botão se o dado faltar") cobre isso graciosamente.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. (Places API key já configurada desde Fase 1; nenhuma mudança de tier confirmada nesta tarefa, ver nota no comentário do arquivo para reverificação futura se a fatura do Google Cloud for questionada.)

## Next Phase Readiness
- `facts.phone` agora populado de verdade para redesigns gerados a partir deste commit -- desbloqueia a Plan 05-06 (botão de WhatsApp), que dependia deste dado.
- Verificação end-to-end (gerar um redesign real e confirmar `facts.phone` não-nulo) exige `AI_GATEWAY_API_KEY`/ambiente de produção, per `success_criteria` do plano -- não executável neste ambiente de execução da plan.
- Nenhum bloqueio identificado para as próximas plans da Fase 5.

---
*Phase: 05-proposta*
*Completed: 2026-07-08*
