# Features Research

**Domain:** SaaS panel for local-business lead-gen + AI website redesign + outreach (agency/freelancer tool — subscriber resells redesigns to their own local-business clients)
**Researched:** 2026-07-07
**Confidence:** MEDIUM (category patterns from adjacent tools — website-audit/"snapshot report" generators, agency white-label panels, cold-outreach platforms — combined with this project's own reference plugin and business-model spreadsheet; not sourced from a single directly-comparable competitor since "AI redesign demo as the outreach hook" is a fairly specific niche)

This document maps features for the milestone already scoped in `.planning/PROJECT.md`. It validates/challenges that scope rather than starting from zero — the Active requirements there were set by direct product decision (user + assistant discussion), not derived from this research; this document exists to sanity-check them against how comparable tools are built and to flag gaps.

---

## Table Stakes

Features subscribers of a tool in this category expect by default — missing these makes the product feel broken or incomplete, independent of the AI-redesign hook.

- **Lead list persistence with status tracking** — every category comparable (CRM-lite panels, audit-report tools) lets the user come back to a saved list, not just a one-shot search result. Maps to PROJECT.md's "Buscar." *Caveat: per PITFALLS.md Pitfall 1, this cannot be a raw Places-data cache — see Gaps below.*
- **Objective "why this site is bad" evidence, not just a vague AI opinion** — audit/snapshot-report tools in this space live or die on having a defensible, specific list of problems (load time, mobile-friendliness, missing SSL, outdated design signals) rather than "AI thinks it's ugly." STACK.md independently arrived at the same conclusion (PageSpeed Insights scores) — this is both a UX table-stake and a legal one (Pitfall 2: specific, sourced claims vs. invented ones).
- **A shareable link for the generated output** — any tool whose value proposition is "look what we made for you" needs a link, not just an in-app view, because the whole point is showing it to someone outside the tool (the end business owner). Maps to "Publicar."
- **Basic editing before anything goes out the door** — table stakes for any AI-generates-then-you-review workflow; users don't trust raw AI output enough to send/publish unedited. Maps to "Editor."
- **A ready-to-send outreach artifact, not just a generated asset** — tools that generate "here's a redesign" without also handing the user words to say alongside it force the user to do the hardest part (the pitch) themselves. Maps to "Proposta."
- **Usage visibility (quota/counter)** — any SaaS wrapping metered external APIs (this one wraps two: Places + an AI provider) needs the user to see their usage, or "it just stopped working" reads as a bug. Confirmed independently by both STACK.md (cost control) and PITFALLS.md (Pitfall 5) as a hard requirement, not a nice-to-have.

## Differentiators

Features that would set this apart from a generic "website audit tool" or generic "AI site builder," specific to the resell/agency use case this product targets.

- **Before/after comparator as the centerpiece artifact** — most audit tools show a score (numbers); most AI site builders show only the new thing. Showing *both*, side by side, specifically to persuade a third party (the business owner) who never asked for this, is the product's actual differentiator per PROJECT.md's Core Value. Worth protecting as the hero feature, not a minor UI detail.
- **Outreach copy that cites the specific detected problems** — generic cold-outreach tools send generic templates. Tying the message text to the actual PageSpeed/heuristic findings for *that* lead (per STACK.md's PageSpeed integration) is what makes the pitch credible instead of spammy — this is also, per PITFALLS.md Pitfall 6, the exact thing that needs the most careful tone-handling, so it's a differentiator with a built-in risk that must be designed for from day one, not after.
- **Built-in pricing guidance for the subscriber's own resale** — the "Tabela de preço" requirement (redesign R$500-1.000, manutenção R$97/mês, sourced from the reference business-model spreadsheet) is unusual: most tools in this space help you *do* the work but don't help you *price* it for your own client. This directly serves the "assinante resells to local businesses" business model this product is built around, not a generic feature checklist.
- **Zero dependency on the subscriber's own hosting** — the reference plugin (ArrecheNeto/PROSPECTOR-DE-SITES) requires the user's own HostGator/cPanel. This product's decision to self-host the public demo (per PROJECT.md's Key Decisions) removes that setup friction entirely — a real differentiator vs. the plugin it's replacing, not just an implementation detail.

## Anti-Features

Things deliberately NOT built, either because PROJECT.md already excluded them or because this research surfaces a reason to actively avoid them.

- **Automated WhatsApp sending (Business API)** — already Out of Scope in PROJECT.md. STACK.md independently confirms the free `wa.me` copy-paste link fully satisfies the stated requirement at zero cost/complexity, and PITFALLS.md's Pitfall 6 shows automating this specific outreach pattern (citing a business's own flaws, unsolicited) carries real LGPD/spam exposure that manual, subscriber-judgment sending mitigates. Two independent research threads agree: don't build this.
- **Full drag-and-drop page builder for the editor** — STACK.md explicitly recommends against GrapesJS/Puck/Craft.js-style builders in favor of a fixed AI-generated template with field-level text/image editing (Tiptap). Anti-feature *for this milestone* — revisit only if the product pivots to "user freely redesigns layout," which isn't the current Core Value.
- **AI-generated logos/images by default** — STACK.md's cost-minimization pattern recommends real Places Photos + a CSS/SVG monogram fallback over AI image generation as the default, both for cost and (per PITFALLS.md Pitfall 3) to sidestep unlicensed-image-reuse risk on arbitrary AI-generated business imagery.
- **Permanent/indexable public demo pages** — actively dangerous per PITFALLS.md Pitfall 4 (impersonation risk if a business finds their own "site" before being pitched). Not a feature to build cautiously — the *absence* of indexing/permanence is itself a required anti-feature-shaped constraint on "Publicar."
- **Persisting raw Places API result data indefinitely** — see Gaps below; this one isn't a product decision, it's close to a legal requirement.

## Gaps in Current Scope (flag for Requirements/Roadmap)

These aren't in PROJECT.md's Active requirements as stated, but this research (particularly cross-referencing ARCHITECTURE.md against PITFALLS.md) surfaces them as necessary companion work, not optional additions:

1. **Lead data-retention model conflicts with Google's ToS as currently drafted.** ARCHITECTURE.md's proposed `leads` table stores `name`, `address`, `phone`, `rating`, `raw_places_data jsonb` as permanent columns. PITFALLS.md's Pitfall 1 states Places API terms permit only `place_id` (indefinitely) and lat/lng (30 days) to be cached — everything else must be re-fetched live or not stored. **This is a direct contradiction between the two research documents that must be resolved before the "Buscar" schema is finalized** — not a nice-to-have fix, since violation risks Google Cloud API key revocation (i.e., the entire "Buscar" feature stops working for every subscriber at once). Recommend: `leads` table stores `place_id` + subscriber-entered/re-fetched display fields with a documented refresh policy, not a permanent raw cache.
2. **Fact/generated-field provenance is not yet a stated requirement.** PROJECT.md's "Redesenhar" requirement says "conteúdo real melhorado" but doesn't specify that the schema/UI must distinguish sourced-fact fields from AI-invented ones. PITFALLS.md's Pitfall 2 makes clear this is launch-blocking, not polish — recommend adding it explicitly to Requirements.
3. **Public-demo safety rails (disclaimer, noindex, non-guessable slug) aren't yet stated as acceptance criteria for "Publicar."** Currently implicit in "URL pública de demo." PITFALLS.md's Pitfall 4 argues this is the single highest-risk feature in the product and should have these as explicit, testable requirements.
4. **Outreach suppression/opt-out list isn't in scope anywhere yet**, but is required the moment the automated-email half of "Proposta" ships (WhatsApp is manual/subscriber-judgment, lower risk; email is panel-automated, per PITFALLS.md Pitfall 6 higher exposure).
5. **Per-subscriber usage quota isn't in PROJECT.md's Active list as a standalone requirement** — it's implied by Constraints ("precisa de guardrail de uso") but should probably be its own explicit, testable requirement given three independent sources (CONCERNS.md, STACK.md, PITFALLS.md) all flag it as launch-blocking.

## Complexity Notes

Rough relative sizing, for roadmap phase-splitting — not effort estimates in hours:

| Feature | Complexity | Why |
|---------|------------|-----|
| Buscar | Medium | Straightforward API integration, but the ToS-compliant data model (Gap 1) adds real design work beyond "call API, save rows" |
| Redesenhar | High | The riskiest and most novel piece — AI generation + fact/generated separation (Gap 2) + image sourcing/rights classification + defines the schema everything else depends on (per ARCHITECTURE.md §5) |
| Editor | Low–Medium | Once Redesenhar's content schema is frozen, this is "a form bound to fields" — genuinely low complexity per STACK.md's Tiptap recommendation, not a page-builder |
| Publicar | Medium | Simple mechanically (flip a flag, generate a slug) but carries the safety-rail requirements (Gap 3) as real, non-optional scope |
| Proposta | Medium | Text generation is simple; the suppression-list/compliance layer (Gap 4) is where the real scope is, especially for the automated-email half |
| Tabela de preço | Low | Static content screen — no new data model, no external API, lowest-risk feature in the milestone |

## Dependencies Between Features

Matches ARCHITECTURE.md §5's build-order analysis — repeated here from a features (not implementation) lens:

- Redesenhar depends on Buscar (needs a lead to redesign).
- Editor and Publicar both depend on Redesenhar's frozen content schema, but not on each other — either can ship first.
- Proposta has no *technical* dependency on Publicar, but its value proposition (pitching a live before/after link) is weak without it — sequence Publicar before Proposta even though nothing forces it at the code level.
- Tabela de preço depends on nothing — it's static content and could ship first or last with zero effect on the rest of the build.

---
*Features research for: Hunter of Bad Pages — Buscar/Redesenhar/Editor/Publicar/Proposta milestone*
*Researched: 2026-07-07*
