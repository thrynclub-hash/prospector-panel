---
phase: 05-proposta
plan: 03
subsystem: api
tags: [ai-sdk, generateObject, gemini, zod, proposal-generation]

# Dependency graph
requires:
  - phase: 05-proposta (05-01, 05-02)
    provides: quota/suppression foundation for the proposal flow
provides:
  - "detectSiteProblems(): pure, deterministic function mapping has_own_website/pagespeed_score to lead-specific problem strings"
  - "generateProposalCopy(): generateObject call producing emailSubject/emailBody/whatsappText in a single AI Gateway call"
affects: [05-04, 05-05, 05-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Deterministic fact-detection function feeding a single generateObject call (same split established by generate-redesign.ts / REDESENHAR-02)"

key-files:
  created: [lib/proposal/detect-problems.ts, lib/ai/generate-proposal.ts]
  modified: []

key-decisions:
  - "detectSiteProblems() is a pure function, not an AI call -- only verifiable facts (has_own_website, pagespeed_score) enter the prompt, avoiding generic/fixed copy across different leads (05-RESEARCH.md Pitfall 6)"
  - "generateProposalCopy() takes problems: string[] as input instead of the old badSiteReason (two fixed strings) used by generate-redesign.ts"
  - "Both email and WhatsApp copy are produced in a single generateObject call, matching the CONTEXT.md locked decision of 'um botão único gera os dois formatos'"

patterns-established:
  - "Fact-detection (deterministic) / copy-generation (AI) split: same shape as generate-redesign.ts, now reused for proposal copy"

requirements-completed: [PROPOSTA-01]

# Metrics
duration: 15min
completed: 2026-07-08
---

# Phase 5: Proposta Summary (Plan 03)

**Deterministic detectSiteProblems() + generateProposalCopy() dual-format AI generation via generateObject, mirroring generate-redesign.ts pattern**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-07-08T02:21:00-03:00
- **Completed:** 2026-07-08T02:22:51-03:00
- **Tasks:** 2 completed
- **Files modified:** 2 (both created)

## Accomplishments
- `lib/proposal/detect-problems.ts`: pure function `detectSiteProblems()` that derives lead-specific problem strings from `has_own_website`/`pagespeed_score`, covering the 3 cases (no site, low PageSpeed with score cited, site ok but generic)
- `lib/ai/generate-proposal.ts`: `generateProposalCopy()` using `generateObject` with a Zod schema (`emailSubject`, `emailBody`, `whatsappText`), following the exact "REGRAS INVIOLÁVEIS" pattern from `generate-redesign.ts` (no price, no fixed checklist, constructive-opportunity tone)
- `npm run build` passes cleanly with both new files in place

## Task Commits

Each task was committed atomically:

1. **Task 1: lib/proposal/detect-problems.ts** - `fbc9880` (feat)
2. **Task 2: lib/ai/generate-proposal.ts** - `7c84a7e` (feat)

## Files Created/Modified
- `lib/proposal/detect-problems.ts` - Pure function `detectSiteProblems(lead)` returning `string[]` of lead-specific site problems
- `lib/ai/generate-proposal.ts` - `generateProposalCopy(input)` calling `generateObject` (model `google/gemini-2.5-flash`) to produce email + WhatsApp copy in one shot, consuming `problems: string[]`

## Decisions Made
None beyond what the plan specified — followed the plan's exact code verbatim (both files match the plan's `<action>` blocks exactly).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required. (Note: `AI_GATEWAY_API_KEY` is already a pre-existing requirement from `generate-redesign.ts`/Phase 3, not newly introduced here.)

## Next Phase Readiness
- Both libs are ready for Plan 05-04 to import: the API route will call `detectSiteProblems(lead)` to build `problems: string[]`, then pass that into `generateProposalCopy()` along with `demoUrl` from the published redesign.
- No blockers identified.

---
*Phase: 05-proposta*
*Completed: 2026-07-08*
