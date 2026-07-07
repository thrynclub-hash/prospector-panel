# Codebase Concerns

**Analysis Date:** 2026-07-07

## Tech Debt

**No schema/migrations tracked in the repo:**
- Issue: The `prospector_customers` table (columns inferred from code: `id`, `user_id`, `email`, `status`, `kiwify_order_id`) exists only in the Supabase dashboard. There is no `supabase/migrations/` directory, no SQL file, nothing version-controlled.
- Why: Fast-moving MVP, schema was probably created by hand in the Supabase SQL editor.
- Impact: No way to recreate the schema from git, no history of schema changes, easy to drift between environments if a second Supabase project is ever needed (staging).
- Fix approach: Add `supabase/migrations/` (via `supabase db diff` or manual SQL files) and commit the current schema as the baseline before building more tables for the new features (leads, redesigns, generated messages).

**No shared validation/normalization helper:**
- Issue: `email.trim().toLowerCase()` is duplicated in `app/api/kiwify/webhook/route.ts`, `app/api/send-login-link/route.ts`, `app/api/access-status/route.ts`. Same for the `typeof email !== "string"` check.
- Files: the three routes above.
- Why: each route was added independently, no shared `lib/` helper extracted.
- Impact: low today (3 call sites), but will compound as more endpoints are added for the prospecting features.
- Fix approach: extract `lib/validation.ts` with a `normalizeEmail()`/`requireEmail()` helper before adding the next batch of routes.

## Known Bugs

**Fixed this session — Resend module-scope instantiation crashed builds:**
- Symptoms: `next build` failed with "Missing API key. Pass it to the constructor `new Resend("re_123")`" during "Collecting page data" for `/api/kiwify/webhook`.
- Root cause: `lib/email/resend.ts` originally did `const resend = new Resend(process.env.RESEND_API_KEY);` at module scope, so importing the module (which happens during Next.js's build-time page-data collection) executed the constructor immediately — before any request, and before Vercel Preview environments (which have zero env vars configured, see below) get a chance to have `RESEND_API_KEY` at all.
- Fix: moved instantiation inside `sendMagicLinkEmail()` (commit `8448863`). Verified via local `npm run build`.
- Residual risk: any *new* external client (Google Places, whatever generates the redesigned sites) must follow the same "construct inside the function, not at module scope" rule, or this exact class of bug recurs.

## Security Considerations

**Kiwify webhook secret is a plain query-string comparison, not a signature:**
- Risk: `?secret=...` is compared with `===` against `KIWIFY_WEBHOOK_SECRET`. This is a shared-secret check, not HMAC signature verification of the payload. If the URL (including the secret) ever leaks — logs, browser history, a screenshot, a support ticket — anyone can POST fabricated "paid" events and provision free accounts.
- File: `app/api/kiwify/webhook/route.ts`
- Current mitigation: the secret itself (not in code, only in Vercel env vars + `.env.local`)
- Recommendation: check whether Kiwify offers HMAC payload signing (many webhook providers do) and switch to verifying a signature header instead of/in addition to the query param. At minimum, treat this URL as a secret on par with an API key — never log it, never share it outside Vercel's dashboard.

**Service-role Supabase client used directly in Route Handlers, no RLS relied upon:**
- Risk: `lib/supabase/admin.ts` creates a client with `SUPABASE_SERVICE_ROLE_KEY`, which bypasses Row Level Security entirely. This is appropriate for the webhook (needs to create users/rows regardless of the requester's identity), but if this same `createSupabaseAdminClient()` gets reused casually in a future route that takes user input more directly, it's easy to accidentally expose or mutate another user's row.
- Files: `app/api/kiwify/webhook/route.ts`, `app/api/access-status/route.ts`, `app/api/send-login-link/route.ts` — all three use the admin client, and all three take a raw `email` from the request body and query by it directly.
- Current mitigation: none beyond "the queries happen to be scoped correctly today."
- Recommendation: when adding the prospecting features (leads, generated sites, messages — all genuinely user-owned data), prefer the session-bound `lib/supabase/server.ts` client + real RLS policies over the admin client, so a bug in query-scoping fails closed instead of open.

## Performance Bottlenecks

None observed — the app is too small/early to have any yet. Nothing to measure.

## Fragile Areas

**`app/painel/page.tsx` has no shared auth-guard pattern:**
- Why fragile: the `redirect("/login")` check is written inline in this one Server Component. There's no middleware-level or layout-level protection.
- Common failures: every new page added under `app/painel/*` (which is exactly what's coming next — buscar, redesenhar, editor, publicar, proposta) must remember to copy this exact `if (!user) redirect("/login")` block, or it'll be an unprotected page by accident.
- Safe modification: before adding the next pages, extract this into a shared layout at `app/painel/layout.tsx` that does the auth check once for the whole `/painel/*` subtree.
- Test coverage: none.

## Scaling Limits

**Google Places API is provisioned but has no usage/cost guardrails:**
- Current capacity: unknown quota/billing tier on the `GOOGLE_PLACES_API_KEY` — not inspected as part of this codebase (it's a Google Cloud console setting, not code).
- Limit: Places API is pay-per-request past the free tier. Once the "Buscar" feature ships, every subscriber's search burns real money with no rate-limiting or per-user quota built into this codebase.
- Symptoms at limit: unexpected Google Cloud billing, or hard API failures if a hard cap is set.
- Scaling path: when building the prospecting endpoint, add a per-user/per-day search cap tied to `prospector_customers` before shipping — this is a cost-control feature, not an optimization.

## Dependencies at Risk

None flagged — `next`, `react`, `resend`, `@supabase/*` are all current/actively maintained majors.

## Missing Critical Features

**Everything the product is actually for is unbuilt:**
- Problem: `app/painel/page.tsx` is a static placeholder. None of "Prospectar" (search), "Redesenhar" (regenerate site + before/after), "Editor," "Publicar," or "Proposta" (ready-made WhatsApp/email message) exist in code yet — no routes, no Supabase tables, no external calls beyond the provisioned-but-unused `GOOGLE_PLACES_API_KEY`.
- Current workaround: none — subscribers who pay today get an auth shell and a "coming soon" message.
- Blocks: this is the entire reason the product exists; it's the next body of work (see PROJECT.md / ROADMAP.md).
- Implementation complexity: high — spans a Places API integration, an AI-generation step for the "redesigned" site + before/after comparator, an in-browser editor, a publish/hosting step, and message-template generation for WhatsApp + email. This is the milestone this GSD project plans.

## Test Coverage Gaps

**Everything:**
- What's not tested: the entire app — including the two flows (Kiwify webhook, magic-link issuance) that already handle real money and already broke once.
- Risk: silent regressions in the purchase→account→access flow are the highest-cost possible bug (a paying customer can't get in).
- Priority: High for the existing money-path flows; will get higher as more surface area (Places API calls, generated content, publishing) is added.
- Difficulty to test: low for the existing routes (pure functions of request → Supabase calls, easily mocked); will get harder once real external AI/Places calls are involved (needs fixtures/mocking strategy decided upfront).

---

*Concerns audit: 2026-07-07*
*Update as issues are fixed or new ones discovered*
