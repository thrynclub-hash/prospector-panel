---
phase: 05-proposta
plan: 05
subsystem: api
tags: [resend, supabase-rpc, suppression, opt-out, nextjs]

# Dependency graph
requires:
  - phase: 05-proposta (plan 05-02)
    provides: "proposals + contacted_businesses migration, opt_out_business(token) RPC"
provides:
  - "sendProposalEmail() distinct sender identity with List-Unsubscribe header"
  - "POST /api/redesigns/[id]/proposal/send -- suppression-gated Resend send"
  - "public /unsubscribe/[token] page via opt_out_business RPC"
affects: [05-06 (send button UI wiring)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Suppression check (contacted_businesses by place_id) happens BEFORE send, insert happens AFTER send succeeds"
    - "Public write via RPC (security definer function), never RLS policy or client .eq() token comparison"

key-files:
  created:
    - lib/email/proposal.ts
    - "app/api/redesigns/[id]/proposal/send/route.ts"
    - "app/unsubscribe/[token]/page.tsx"
  modified: []

key-decisions:
  - "Followed plan's exact code -- no deviations"

patterns-established:
  - "Distinct Resend sender identity per email purpose (transactional vs cold outreach), with List-Unsubscribe header only on outreach path"

requirements-completed: [PROPOSTA-03, PROPOSTA-04]

# Metrics
duration: ~20min
completed: 2026-07-08
---

# Phase 05-proposta Plan 05 Summary

**Resend outreach send path with pre-send suppression check, post-send contacted_businesses insert, and public RPC-based opt-out page**

## Performance

- **Duration:** ~20 min
- **Completed:** 2026-07-08
- **Tasks:** 3 completed
- **Files modified:** 3 created

## Accomplishments
- `lib/email/proposal.ts` sends outreach email from a sender identity (`propostas@toqy.com.br`) distinct from the transactional magic-link sender (`acesso@toqy.com.br`), with `List-Unsubscribe` + `List-Unsubscribe-Post` headers and a visible in-body opt-out link.
- `app/api/redesigns/[id]/proposal/send/route.ts` checks `contacted_businesses` by `place_id` before ever calling Resend (409 with distinct messages for "already contacted" vs "opted out"), and only inserts the suppression row + marks `proposals.email_sent_at` after the send call resolves without throwing.
- `app/unsubscribe/[token]/page.tsx` is a public Server Component using `createSupabasePublicClient()` (anon key, no session, no admin client) that calls `.rpc("opt_out_business", { token })` -- the token comparison happens inside the security-definer function body, never in an RLS policy or a client-side `.eq()`.

## Task Commits

Each task was committed atomically:

1. **Task 1: lib/email/proposal.ts** - `22f81b5` (feat)
2. **Task 2: proposal/send route** - `d1d7fc1` (feat)
3. **Task 3: public unsubscribe page** - `0470953` (feat)

## Files Created/Modified
- `lib/email/proposal.ts` - `sendProposalEmail()`, distinct sender + List-Unsubscribe header, function-scoped Resend client
- `app/api/redesigns/[id]/proposal/send/route.ts` - POST route: ownership/publish/proposal-exists checks -> suppression check -> send -> post-send suppression insert + `email_sent_at`
- `app/unsubscribe/[token]/page.tsx` - public opt-out confirmation page via `opt_out_business` RPC

## Decisions Made
None - followed plan as specified. No naive RLS policy comparing `opt_out_token is not null` was used; the plan's RPC-based approach (already security-reviewed in 05-02's migration) was preserved exactly.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None. All three `<verify>` commands from the plan passed on first attempt, including `npm run build`.

## User Setup Required

None - no external service configuration required. (`RESEND_API_KEY` and `NEXT_PUBLIC_APP_URL` are pre-existing env vars from earlier phases, already covered by prior USER-SETUP docs.)

## Next Phase Readiness
- The send route and opt-out page this plan builds are prerequisites for Plan 05-06's "enviar e-mail" button UI -- both now exist and are wired to the 05-02 migration's schema/RPC.
- No blockers. `npm run build` passes cleanly with all three new routes/pages listed in the route manifest (`/api/redesigns/[id]/proposal/send`, `/unsubscribe/[token]`).

---
*Phase: 05-proposta*
*Completed: 2026-07-08*
