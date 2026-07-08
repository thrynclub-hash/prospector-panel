---
phase: 05-proposta
plan: 06
subsystem: ui
tags: [nextjs, react, supabase, whatsapp, resend, client-component]

# Dependency graph
requires:
  - phase: 05-proposta (plan 05-01)
    provides: "content.facts.phone populated on redesign generation, POST/PATCH /api/redesigns/[id]/proposal route"
  - phase: 05-proposta (plan 05-04)
    provides: "generateProposalCopy() + proposal generation/edit route"
  - phase: 05-proposta (plan 05-05)
    provides: "POST /api/redesigns/[id]/proposal/send (suppression-gated Resend send), contacted_businesses table"
provides:
  - "lib/proposal/whatsapp-link.ts -- toWhatsAppLink() pure helper"
  - "ProposalSection client component wired into /painel/leads/[leadId]/redesenhar"
  - "page.tsx now fetches lead.public_email, contacted_businesses suppression row, and existing proposals row"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Hide-vs-disable: WhatsApp/email buttons are omitted (not disabled) when their underlying contact data is missing; email is disabled with an explanatory message only when suppression applies"
    - "Two-click confirm pattern reused from DeleteRedesignButton for the send-email action"
    - "Save-before-send: edits are persisted via PATCH immediately before POST /send, since the send route reads proposal text from the DB row, not from the request body"

key-files:
  created:
    - lib/proposal/whatsapp-link.ts
    - "app/painel/leads/[leadId]/redesenhar/proposal-section.tsx"
  modified:
    - "app/painel/leads/[leadId]/redesenhar/page.tsx"

key-decisions:
  - "Followed plan's exact code for all 3 tasks -- no deviations"
  - "ProposalSection inserted directly after PublishButton and before the Gerar/Editar/Excluir button row (no divider div exists there in the current file, unlike the plan's parenthetical mention of a divider 'seguinte de GenerateButton/Editar/Excluir' -- the actual file only has one divider, positioned before PublishButton, so the insertion point described by the plan's code block is what was followed)"

patterns-established: []

requirements-completed: [PROPOSTA-01, PROPOSTA-02, PROPOSTA-03, PROPOSTA-04]

# Metrics
duration: ~15min
completed: 2026-07-08
---

# Phase 05-proposta Plan 06 Summary

**ProposalSection client component wired into the redesenhar page -- generate/edit/WhatsApp/email-with-suppression UI closing out all 4 Phase 5 requirements**

## Performance

- **Duration:** ~15 min
- **Completed:** 2026-07-08
- **Tasks:** 3 completed
- **Files modified:** 2 created, 1 modified

## Accomplishments
- `lib/proposal/whatsapp-link.ts` exports `toWhatsAppLink()`, a pure function stripping non-digit characters from the Places API's international phone format and building a `wa.me` deep link with prefilled, URL-encoded text.
- `app/painel/leads/[leadId]/redesenhar/proposal-section.tsx` is a new client component covering all 3 states (redesign not published / published but no proposal / proposal generated), with editable subject/body/whatsapp-text fields, a WhatsApp link that's absent (not disabled) when `phone` is null, an email button that's absent when `publicEmail` is null and disabled-with-message when the lead is in `contacted_businesses`, and a two-click confirm before the actual send POST fires.
- `app/painel/leads/[leadId]/redesenhar/page.tsx` now selects `public_email` on `lead`, fetches the `contacted_businesses` suppression row and any existing `proposals` row, and renders `<ProposalSection>` between `PublishButton` and the Gerar/Editar/Excluir row.
- `npm run build` compiles cleanly; the route manifest shows `/api/redesigns/[id]/proposal` and `/api/redesigns/[id]/proposal/send` already present (built in earlier plans) and `/painel/leads/[leadId]/redesenhar` unchanged in kind (still dynamic `ƒ`).

## Task Commits

Each task was committed atomically:

1. **Task 1: lib/proposal/whatsapp-link.ts** - `82804d3` (feat)
2. **Task 2: proposal-section.tsx client component** - `40bd2dd` (feat)
3. **Task 3: wire ProposalSection into page.tsx** - `aa70cd6` (feat)

## Files Created/Modified
- `lib/proposal/whatsapp-link.ts` - `toWhatsAppLink(internationalPhone, text)`, digit-stripping + `wa.me` link builder
- `app/painel/leads/[leadId]/redesenhar/proposal-section.tsx` - `ProposalSection` client component: generate/edit/WhatsApp/email UI, two-click send confirmation, hide-vs-disable logic
- `app/painel/leads/[leadId]/redesenhar/page.tsx` - added `public_email` to lead select, `contacted_businesses` suppression fetch in the existing `Promise.all`, a follow-up `proposals` fetch keyed on `redesign.id`, and the `<ProposalSection>` render

## Decisions Made
None beyond following the plan's exact code. One placement note: the plan's prose described inserting `<ProposalSection>` "before the `<div className="pt-2 border-t border-border" />` seguinte de GenerateButton/Editar/Excluir" -- but the current `page.tsx` only has a single such divider div, and it sits *before* `PublishButton`, not before the Gerar/Editar/Excluir button row. There is no second divider in the real file. Followed the plan's own code block literally instead (insert directly after `<PublishButton>`, before the `<div className="flex items-center gap-3 flex-wrap">` group), which matches every other constraint in the plan (position after PublishButton, position before Gerar/Editar/Excluir) and required no invention.

## Deviations from Plan

None - plan executed exactly as written (code blocks copied verbatim for Tasks 1 and 2; Task 3's 5 edit steps applied as described, with the placement note above being a wording ambiguity in the plan's prose, not a deviation in the resulting code/behavior).

## Issues Encountered
None. All three `<verify>` commands passed on first attempt, including `npm run build`.

## User Setup Required

None - no external service configuration required. All env vars (`RESEND_API_KEY`, `NEXT_PUBLIC_APP_URL`, AI Gateway credentials) were already covered by earlier plans' USER-SETUP docs.

## Next Phase Readiness

Phase 5 (Proposta) is now feature-complete: all 4 requirements (PROPOSTA-01 gerar, PROPOSTA-02 WhatsApp, PROPOSTA-03 e-mail, PROPOSTA-04 supressão) have both backend routes (Plans 05-01/05-02/05-04/05-05) and UI wiring (this plan) in place, and `npm run build` passes cleanly end-to-end.

Two things remain pending before this can be verified live, both external to code:

1. **Manual migration application** -- `supabase/migrations/20260708150000_proposals_and_suppression.sql` (creating `proposals`, `contacted_businesses`, and the `opt_out_business` RPC) still needs to be applied to the real Supabase DB. This is the same pending action already noted in `05-02-SUMMARY.md`.
2. **Manual UI verification once deployed** -- full end-to-end testing (real AI Gateway proposal generation + real Resend send) requires production env vars and can't be exercised in this local/build-only environment, per `05-RESEARCH.md` Pitfall 7.

No code blockers. No further plans scheduled for this phase.

---
*Phase: 05-proposta*
*Completed: 2026-07-08*
