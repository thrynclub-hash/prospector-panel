# Project Research Summary

**Project:** Hunter of Bad Pages (prospector-panel)
**Domain:** Multi-tenant SaaS panel — local-business lead-gen + AI website redesign + outreach automation, built on an existing Next.js/Supabase brownfield app
**Researched:** 2026-07-07
**Confidence:** MEDIUM-HIGH

## Executive Summary

This is a five-feature milestone (Buscar/Redesenhar/Editor/Publicar/Proposta) added on top of an already-shipping auth+billing shell. The good news: nothing here requires new infrastructure — Places API, an LLM via Vercel AI Gateway, `jsonb` storage in the existing Supabase project, and a public Next.js route cover all five features using the app's existing stack and house conventions (client-factory functions, Route Handler + page per concern). The architecture research is high-confidence because it's grounded directly in this repo's actual code, not generic patterns.

The real risk in this milestone isn't technical, it's compliance and trust. Three of the six pitfalls found are launch-blocking, not polish items: (1) Google's Places API terms forbid caching most business data beyond `place_id` and a 30-day lat/lng window — and the architecture research's own proposed `leads` schema violates this, a contradiction this summary resolves below; (2) an AI redesign that invents business facts (hours, claims, fake testimonials) turns the product's core pitch into something that damages the subscriber's credibility instead of building it; (3) a public demo page bearing a real, non-consenting business's name/branding reads as impersonation unless it carries a disclaimer, is non-indexable, and uses an unguessable URL. None of these are edge cases — they're direct consequences of what the product is designed to do (persist leads, pitch a "real-looking" redesign, publish it to a link).

Recommended approach: keep the five-feature scope as-is, but treat data-retention compliance (Places), fact/generated-content separation (AI), public-page safety rails (disclaimer/noindex/slug), and per-subscriber usage caps as **acceptance criteria of the features that already exist in PROJECT.md**, not as separate cleanup phases bolted on later. The cost math works in the product's favor (roughly $0.02–0.06 per fully-processed lead, see STACK.md) — the risk isn't affordability, it's shipping the guardrails from day one instead of retrofitting them after an API suspension, a hallucination incident, or an impersonation complaint.

## Key Findings

### Recommended Stack

Google Places API (New) for search, Google PageSpeed Insights (free) for objective "bad site" scoring, Vercel AI SDK 5.x (`generateObject` + Zod) via Vercel AI Gateway for structured page-content generation using a cheap flash/haiku-tier model, `react-compare-slider` for the before/after UI, Tiptap for lightweight field-level text editing, a hosted screenshot API (not self-hosted Puppeteer) for the "before" image, and Postgres `jsonb` in the existing Supabase project for the generated page content — no new database, hosting platform, or auth system needed. Full detail, versions, and per-unit cost breakdown: `STACK.md`.

**Core technologies:**
- Google Places API (New) `searchText`: lead discovery — already provisioned (`GOOGLE_PLACES_API_KEY`), but requires a compliant data-retention model (see Gaps)
- Vercel AI SDK 5.x + AI Gateway: structured, schema-validated redesign/outreach content generation — avoids free-form HTML output, keeps model choice swappable
- `react-compare-slider` + Tiptap: the comparator and editor UI — both zero/low-dependency, React-19-compatible, avoid pulling in a full page-builder

### Expected Features

Full detail and complexity/dependency notes: `FEATURES.md`.

**Must have (table stakes):**
- Persistent, revisitable lead list (with a compliant data model — see Gaps)
- Objective, specific "why this site is bad" evidence (not vague AI opinion)
- Shareable public link for the generated redesign
- Basic in-panel editing before anything is published/sent
- Visible usage/quota counter

**Should have (differentiators):**
- Before/after comparator as the hero artifact
- Outreach copy citing the specific detected problems (not generic)
- Built-in pricing guidance for the subscriber's resale (R$500–1.000 redesign / R$97/mo manutenção, from the reference spreadsheet)
- Self-hosted public demo — no dependency on the subscriber's own hosting (the actual improvement over the reference plugin)

**Defer / explicitly not building:**
- Automated WhatsApp sending (WhatsApp stays copy-paste via free `wa.me` link — already Out of Scope in PROJECT.md, doubly confirmed by both cost/complexity (STACK.md) and compliance risk (PITFALLS.md))
- Full drag-and-drop page builder (fixed AI template + field editing instead)
- AI-generated logos/images as the default (real Places photos + SVG monogram fallback)

### Architecture Approach

Five new tables (`leads`, `redesigns`, `redesign_assets`, `outreach_messages`, `usage_events`) all keyed by `user_id` directly (not through `prospector_customers`) for simple one-line RLS, with subscription entitlement checked at the application layer. The public demo route (`app/demo/[slug]/page.tsx`) is a sibling to `/painel`, not nested inside it, using an anon-key client against a narrow `is_public = true` view — never the admin client. Full detail: `ARCHITECTURE.md`.

**Major components:**
1. `app/painel/layout.tsx` (new) — shared auth **and subscription-status** guard for the entire painel subtree, fixing a gap the existing code has today (session-only checks, no entitlement check)
2. `app/api/leads/search`, `app/api/redesigns/generate|[id]|publish`, `app/api/messages/generate|send-email` — one Route Handler per concern, following the existing convention exactly
3. `lib/google-places/client.ts`, `lib/ai/client.ts` — new client factories, explicitly following the existing "function, not module singleton" pattern (the pattern that already caused one production build crash with Resend — see CONCERNS.md)
4. `redesigns.content jsonb` — the one schema decision that's load-bearing for three features at once (Redesenhar writes it, Editor mutates it, Publicar renders it) — must be frozen early, before Editor/Publicar are built

### Critical Pitfalls

Full detail on all six, plus a phase-mapping table: `PITFALLS.md`.

1. **Places API data-retention violation** — the architecture's own proposed schema stores name/rating/phone/hours permanently, which Google's terms don't allow (only `place_id` indefinitely, lat/lng for 30 days). Fix: `leads` durably stores `place_id`; display fields are re-fetched live or on a compliant schedule, not cached as permanent columns.
2. **AI-hallucinated business facts** — an ungrounded generation prompt will invent hours, claims, or testimonial-sounding copy for a real business, which is reputationally worse than a plain redesign when the subscriber pitches it. Fix: schema/prompt-level separation of sourced vs. generated fields, enforced before publish.
3. **Public demo impersonation risk** — a live, real-branded page with no disclaimer, no `noindex`, and a guessable URL can be discovered by the actual business owner (or their customers) before the pitch happens, or reads as a fake competing site. Fix: mandatory disclaimer banner, `noindex`/`robots.txt`, non-guessable slug — treated as acceptance criteria for "Publicar," not optional polish.
4. **No per-subscriber cost guardrail** — already flagged in the existing codebase's CONCERNS.md for Places specifically; applies equally (and more expensively) to AI generation. Fix: hard per-subscriber daily/monthly caps shipped in the same PR as each metered endpoint, not as a follow-up.
5. **Outreach compliance (LGPD/spam)** — an automated email citing a business's own site flaws, sent without consent, carries real LGPD exposure once the Resend auto-send path is live (WhatsApp stays lower-risk because it's manual/subscriber-judgment). Fix: suppression list + opt-out mechanism designed into the "Proposta" schema from the start, not retrofitted after a complaint.

## Implications for Roadmap

This maps closely onto `ARCHITECTURE.md §5`'s dependency chain, with the pitfall-driven guardrails folded into the phase that owns each risk (not a separate "add compliance later" phase — every pitfall source explicitly warns against that pattern).

### Phase 0: Foundation
**Rationale:** Both the migrations gap and the missing auth/entitlement guard are pre-existing debt (CONCERNS.md) that every new table/page in this milestone would otherwise build on top of.
**Delivers:** Tracked `supabase/migrations/` baseline (capturing current `prospector_customers` schema), `app/painel/layout.tsx` shared session+subscription-status guard.
**Addresses:** No feature directly — this is the prerequisite ARCHITECTURE.md §1.3/§4 mark as blocking everything else.
**Avoids:** Compounding the "no migrations tracked" and "no shared auth guard" debt across 5 more tables and 5 more pages instead of 1 and 1.

### Phase 1: Buscar (compliant lead search)
**Rationale:** No dependency on any other feature; produces the `leads` rows every later phase needs.
**Delivers:** Google Places search, weak-site heuristic (rating filter + PageSpeed score for sites that have one), per-subscriber daily search quota, ToS-compliant `leads` schema (place_id-first, not a raw data cache).
**Addresses:** "Buscar" (PROJECT.md), table-stakes "persistent lead list" (FEATURES.md).
**Avoids:** Pitfall 1 (Places caching violation) and half of Pitfall 5 (search-side cost guardrail) — both must be this phase's definition of done, not a later add-on.

### Phase 2: Redesenhar (AI generation + before/after)
**Rationale:** Depends on Phase 1's leads; this phase's schema decision (`redesigns.content` shape, fact/generated field separation) is load-bearing for Phases 3 and 4.
**Delivers:** AI-generated page content (`generateObject` + Zod), before-screenshot capture, before/after comparator UI, generation-side usage quota.
**Uses:** Vercel AI SDK/Gateway, `react-compare-slider`, hosted screenshot API (STACK.md).
**Implements:** `lib/ai/client.ts`, `app/api/redesigns/generate/route.ts` (ARCHITECTURE.md §2).
**Avoids:** Pitfall 2 (hallucinated facts) via explicit provenance separation in the schema/prompt from the first version, and the AI-generation half of Pitfall 5 (cost guardrail).

### Phase 3: Editor and Phase 4: Publicar (parallel)
**Rationale:** Both depend only on Phase 2's frozen content schema, not on each other — ARCHITECTURE.md confirms an unedited AI redesign is a valid publish path.
**Delivers (Editor):** Tiptap-based field editing bound to `redesigns.content`, visual flagging of AI-generated (unverified) fields per PITFALLS.md's UX recommendation.
**Delivers (Publicar):** Non-guessable slug generation, `is_public`/`published_at` flip, anon-key + narrow-view public route (`app/demo/[slug]`), mandatory disclaimer banner, `noindex`/`robots.txt`.
**Avoids:** Pitfall 4 (impersonation) is entirely this phase's responsibility — disclaimer/noindex/unguessable-slug are acceptance criteria, not follow-up polish. Also closes the admin-client-on-a-public-route risk flagged as Anti-Pattern 2 in ARCHITECTURE.md.

### Phase 5: Proposta (outreach message generation)
**Rationale:** Technically only needs Phase 1 (leads), but its value proposition (a live link to show) is weak without Phase 4 — sequence last even though nothing forces it at the code level.
**Delivers:** AI-generated WhatsApp text (`wa.me` copy-paste link) + email generation with Resend auto-send, suppression/opt-out list, tone-constrained prompt (constructive framing, not "your site is broken").
**Uses:** Existing `lib/email/resend.ts` pattern (new template function, not a modified magic-link path).
**Avoids:** Pitfall 6 (LGPD/spam exposure) — suppression list and opt-out are schema-level requirements for this phase, not a later addition.

### Phase 6: Tabela de preço
**Rationale:** Zero dependencies on anything else in the milestone — purely static content sourced from the reference spreadsheet. Lowest-risk phase; can be reordered anywhere, including first, without affecting the rest.
**Delivers:** A pricing-guidance screen inside `/painel` showing suggested redesign/maintenance pricing for the subscriber's own resale.

### Phase Ordering Rationale

- Foundation-first because two independent pieces of debt (migrations, auth guard) get 5x worse if deferred past the point where 5 new tables and 5 new pages already exist without them.
- Buscar → Redesenhar → (Editor ‖ Publicar) → Proposta follows the actual data dependency chain (ARCHITECTURE.md §5); nothing here is arbitrary sequencing.
- Every pitfall-driven guardrail (compliance, cost cap, safety rail) is assigned to the phase that owns the risk, per explicit warnings in PITFALLS.md against a separate "add compliance later" phase — retrofitting after subscribers have habits/data already built on the non-compliant version costs more than building it in from the start.
- Tabela de preço is placed last only because it's inert relative to everything else — it could just as easily ship first as a quick win with zero risk of blocking anything.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1 (Buscar):** the exact re-fetch/refresh policy for lead display data (how often can `place_id`-keyed leads be re-queried against Places Details without re-triggering the same caching ToS issue) needs a closer read of Google's policy page before the migration is finalized — flagged as MEDIUM confidence in PITFALLS.md, not fully resolved here.
- **Phase 2 (Redesenhar):** the exact `content` jsonb shape and the specific AI Gateway model choice are both "decide at implementation time" per STACK.md (model pricing/availability shifts monthly) — needs a fresh check, not a hardcoded assumption from this research date.
- **Phase 4 (Publicar):** whether to add link expiry/access-gating on top of noindex+disclaimer (PITFALLS.md raises it as a "consider" without a firm recommendation) is a product decision, not fully settled by research.

Phases with standard patterns (skip research-phase):
- **Phase 0 (Foundation):** standard Supabase migration workflow, standard Next.js layout guard pattern — no novel research needed.
- **Phase 3 (Editor):** Tiptap's documented integration pattern is standard; no novelty beyond the field-list this project defines.
- **Phase 6 (Tabela de preço):** static content page, no research surface at all.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM-HIGH | API pricing/package choices verified via current web sources; exact model names/prices for AI generation will drift and need re-checking at implementation time |
| Features | MEDIUM | No single directly-comparable competitor exists for this specific niche; inferred from adjacent categories (audit tools, agency panels, cold-outreach platforms) plus the project's own reference plugin/spreadsheet |
| Architecture | HIGH | Grounded directly in this repo's actual code (`.planning/codebase/*.md`), not generic best-practice |
| Pitfalls | HIGH | Google Places ToS and LGPD claims verified via current official/authoritative sources; AI-hallucination and trademark/passing-off risk patterns are well-established, not speculative |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Contradiction between ARCHITECTURE.md's proposed `leads` schema and PITFALLS.md's Pitfall 1**: the former persists raw Places fields permanently, the latter says that's a ToS violation. Resolved in this summary in favor of Pitfalls' compliance finding (place_id-first model) — this must be the schema actually implemented in Phase 1, not ARCHITECTURE.md's `raw_places_data jsonb` column as originally written.
- **`redesigns.content` exact shape**: intentionally left undefined by both ARCHITECTURE.md and STACK.md pending an implementation-time decision — this is correctly deferred to Phase 2 planning, not a gap to fill now, but should be the first thing that phase's plan locks down given three other features read/write it.
- **Legal/ToS review beyond this research's scope**: PITFALLS.md's findings on LGPD and Places ToS are grounded in current public sources but are not a substitute for actual legal review before launch — flagged here as a recommendation, not a requirement this research can itself satisfy.

## Sources

### Primary (HIGH confidence)
- Google Places API Policies page, Places API pricing/billing docs, PageSpeed Insights API docs — official Google sources (see PITFALLS.md/STACK.md for exact URLs)
- This repository's own `.planning/codebase/*.md` (STACK, ARCHITECTURE, INTEGRATIONS, CONCERNS, STRUCTURE, CONVENTIONS) — direct code analysis, 2026-07-07

### Secondary (MEDIUM confidence)
- Vercel AI SDK/Gateway official docs and blog posts (model/pricing details change monthly, re-verify before implementation)
- LGPD/WhatsApp compliance guides (Brazilian legal-guide sources, not primary statute text)
- `react-compare-slider`, Tiptap, GrapesJS/Puck/Craft.js comparison sources (npm/vendor docs and comparison blog posts)

### Tertiary (LOW confidence)
- Features-category inference (no single directly comparable competitor product was found/reviewed — see Features confidence note above)

---
*Research completed: 2026-07-07*
*Ready for roadmap: yes — with the Phase 1 schema correction noted in Gaps applied*
