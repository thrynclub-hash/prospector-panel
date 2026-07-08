---
phase: 05-proposta
plan: 04
subsystem: api
tags: [nextjs, supabase, route-handler, ai-sdk, proposal]

# Dependency graph
requires:
  - phase: 05-02
    provides: "proposals table (redesign_id unique, email_subject/email_body/whatsapp_text/email_sent_at columns)"
  - phase: 05-03
    provides: "detectSiteProblems() pure function and generateProposalCopy() AI generation"
provides:
  - "POST /api/redesigns/[id]/proposal -- generates and persists proposal copy, idempotent, gated on redesigns.is_public"
  - "PATCH /api/redesigns/[id]/proposal -- edits email_subject/email_body/whatsapp_text before sending"
affects: ["05-06 (proposal UI)", "05-05 (email send, will read proposals row)"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Route Handler mirrors publish/route.ts shape exactly: requireActiveUser() guard, params Promise, ownership via .eq(user_id), idempotent generate via check-then-insert"
    - "AI Gateway errors mapped to 502 JSON (not 500 without a body) so the client can distinguish generation failure from persistence failure"

key-files:
  created:
    - "app/api/redesigns/[id]/proposal/route.ts"
  modified: []

key-decisions:
  - "None - followed plan as specified"

patterns-established:
  - "Proposal generation gate: is_public + public_slug both required before allowing POST, same check PublishButton already renders/hides on"

requirements-completed: [PROPOSTA-01]

# Metrics
duration: 8min
completed: 2026-07-08
---

# Phase 05-proposta Plan 04: Proposal Generate/Edit Route Summary

**POST/PATCH route.ts for `redesigns.id`'s proposal -- idempotent AI-generated dual-format copy (email + WhatsApp) gated on publish status, editable before send**

## Performance

- **Duration:** 8 min
- **Started:** 2026-07-08T02:24:13-03:00 (prior commit baseline)
- **Completed:** 2026-07-08T02:26:08-03:00
- **Tasks:** 2 completed
- **Files modified:** 1 created

## Accomplishments
- POST handler: ownership-checked fetch of the redesign, 409 if not published, idempotent short-circuit returning the existing `proposals` row if one exists, calls `detectSiteProblems` + `generateProposalCopy`, persists to `proposals`, 502 JSON on AI-generation failure, 201 on success
- PATCH handler: partial update of `email_subject`/`email_body`/`whatsapp_text`, scoped by `redesign_id` + `user_id`, only touches fields present in the request body
- Verified `npm run build` compiles cleanly with the new route registered (`/api/redesigns/[id]/proposal` appears in the build's route table)

## Task Commits

Each task was committed atomically:

1. **Task 1: POST -- gerar e persistir a proposta** - `d6e0d2e` (feat)
2. **Task 2: PATCH -- editar a proposta antes de enviar** - `e340348` (feat)

## Files Created/Modified
- `app/api/redesigns/[id]/proposal/route.ts` - POST (generate+persist, idempotent, gated on `is_public`) and PATCH (edit) handlers for a redesign's proposal

## Decisions Made
None - followed plan as specified.

## Deviations from Plan

None - plan executed exactly as written. Before writing code, cross-checked the plan's assumed signatures/schema against the actual committed dependencies:
- `detectSiteProblems({ hasOwnWebsite, pagespeedScore })` in `lib/proposal/detect-problems.ts` matches the plan's call site exactly (parameter names and types).
- `generateProposalCopy({ name, address, rating, userRatingCount, problems, demoUrl })` in `lib/ai/generate-proposal.ts` matches the plan's call site exactly.
- `proposals` table columns (`redesign_id`, `user_id`, `email_subject`, `email_body`, `whatsapp_text`, `email_sent_at`) in `supabase/migrations/20260708150000_proposals_and_suppression.sql` match the plan's `.select()`/`.insert()`/`.update()` column lists exactly.
- `leads.has_own_website` and `leads.pagespeed_score` (used in the POST handler's lead fetch) confirmed present in `supabase/migrations/20260708120000_leads_and_usage.sql`.

No mismatches found; no reconciliation was necessary.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required. (Route relies on `NEXT_PUBLIC_APP_URL`, already configured per 05-RESEARCH.md/INTEGRATIONS.md, and the AI Gateway credentials already required by Plan 05-03's `generateProposalCopy`.)

## Next Phase Readiness
- Route is ready for Plan 05-06 (proposal UI) to consume via `fetch("/api/redesigns/[id]/proposal", { method: "POST" | "PATCH" })`.
- No blockers identified for Plan 05-05 (email send), which will read the persisted `proposals` row this route creates.

---
*Phase: 05-proposta*
*Completed: 2026-07-08*
