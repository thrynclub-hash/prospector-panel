---
phase: 05-proposta
plan: 02
subsystem: database
tags: [supabase, postgres, rls, migration, security-definer]

# Dependency graph
requires:
  - phase: 04-publicar
    provides: "redesigns table with is_public/public_slug, established RLS/public-route patterns this migration follows and deliberately deviates from"
provides:
  - "proposals table: 1:1 with redesigns (unique redesign_id), user_id-scoped RLS (select/insert/update, no delete), persists generated outreach text"
  - "contacted_businesses table: global cross-subscriber suppression list keyed by place_id, no user_id ownership column"
  - "opt_out_business(token) security-definer RPC: sole public write path for opt-out, compares token inside function body instead of via RLS policy"
  - "column-level GRANT excluding opt_out_token from authenticated SELECT"
affects: [05-proposta remaining plans (proposal generation route, send-email route, unsubscribe page, redesenhar page suppression check)]

# Tech tracking
tech-stack:
  added: []
  patterns: ["security-definer RPC as the sole public-write path for a token-authorized action, instead of an anon RLS policy that can't compare the caller's token value", "column-level GRANT as a second layer under RLS to hide a bearer-credential column (opt_out_token) from ordinary SELECT"]

key-files:
  created:
    - supabase/migrations/20260708150000_proposals_and_suppression.sql
  modified: []

key-decisions:
  - "contacted_businesses breaks this codebase's until-now-universal user_id-scoped RLS pattern on purpose -- suppression must be checked/enforced across every subscriber, not per-owner"
  - "No anon SELECT or UPDATE policy on contacted_businesses at all -- a using (opt_out_token is not null) policy would be true for every row (all rows get a token at insert) and would let a direct anon REST UPDATE wipe the entire suppression list; the real token comparison can only happen inside a function body, not in a row-by-row-evaluated policy expression without the caller's parameter"
  - "opt_out_business(token) is security definer (bypasses RLS for this one controlled comparison) but is not the admin/service-role client CONTEXT.md prohibits for this public path -- that client would bypass RLS for any operation, this function only bypasses it for this one token comparison"
  - "Idempotent opt-out via coalesce(opted_out_at, now()) -- clicking the link twice doesn't overwrite an already-set timestamp, and the function returns already_opted_out so the caller can render the right confirmation state"

patterns-established:
  - "Deliberately-shared (non-user_id-scoped) table pattern for cross-subscriber data, documented inline with why the usual RLS shape doesn't apply"
  - "security-definer function as public write authorization boundary when the authorizing value (a token) must be compared against caller input, not just checked for presence"

requirements-completed: [PROPOSTA-01, PROPOSTA-04]

# Metrics
duration: ~5min
completed: 2026-07-08
---

# Phase 5 Plan 2: Proposals and Suppression Schema Summary

**proposals + contacted_businesses schema with security-definer opt-out RPC instead of RLS-based anon write**

## Performance

- **Duration:** ~5 min
- **Completed:** 2026-07-08
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- `proposals` table created: 1:1 with `redesigns` (`unique(redesign_id)`), `user_id`-scoped RLS (select/insert/update, no delete -- proposal text is edited, not deleted), ready to persist the AI-generated email/WhatsApp copy the next plans will produce
- `contacted_businesses` table created: global suppression list keyed by `place_id`, no `user_id` ownership column by design -- shared `select`/`insert` for `authenticated`, zero direct `anon` access
- `opt_out_business(token)` security-definer function: the only public write path on this table, comparing the token inside the function body (not via an RLS `using` clause that can't see the caller's parameter)
- Column-level `GRANT` on `contacted_businesses` excludes `opt_out_token` from `authenticated` SELECT, independent of row-level RLS

## Task Commits

Each task was committed atomically:

1. **Task 1: Criar migration proposals + contacted_businesses** - `414ef5b` (feat)

## Files Created/Modified
- `supabase/migrations/20260708150000_proposals_and_suppression.sql` - New migration: `proposals` table + RLS, `contacted_businesses` table + RLS + column-level grant, `opt_out_business(token)` security-definer function

## Decisions Made
None - plan executed exactly as written (SQL content copied verbatim from the plan's Task 1 action block, not paraphrased, per the plan's explicit instruction that the SQL already went through a security review/revision cycle).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**This migration has not been applied to the real Supabase database.** Same manual process already used for the prior 3 Fase 1-4 migrations (`20260708120000_leads_and_usage.sql`, `20260708130000_redesigns.sql`, `20260708140000_public_redesigns.sql`): the user must run this file's SQL manually via the Supabase Dashboard SQL Editor against the real project. No MCP access to the real Supabase project was available in this execution environment to apply it directly.

## Next Phase Readiness
- Schema is in place for Plan 05-03 (proposal generation lib), 05-04/05-05 (API routes for generate/send), and the `redesenhar` page's suppression check -- all can now reference `proposals`/`contacted_businesses` without waiting on this plan.
- The `opt_out_business` RPC signature (`token text` in, `table(place_id text, already_opted_out boolean)` out) is ready for the `/unsubscribe/[token]` page to call via `supabase.rpc("opt_out_business", { token })`.
- No blockers identified for subsequent Fase 5 plans.

---
*Phase: 05-proposta*
*Completed: 2026-07-08*
