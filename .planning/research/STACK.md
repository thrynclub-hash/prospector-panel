# Stack Research

**Domain:** AI-powered local-business website prospecting & redesign SaaS panel (Hunter of Bad Pages) — additive capabilities on top of existing Next.js 16 + Supabase + Vercel + Resend + Kiwify stack
**Researched:** 2026-07-07
**Confidence:** MEDIUM-HIGH (API pricing and package APIs verified via web search; exact latest model names/prices shift monthly — treat $ figures as order-of-magnitude, re-check before committing to a model in code)

This document does **not** re-cover auth/billing/DB client (already decided — Supabase Auth magic link, Kiwify webhook, `@supabase/supabase-js`). It covers only what's needed to add: (1) Places search + bad-site detection, (2) AI page generation, (3) before/after comparator, (4) in-browser editor, (5) hosting the generated page, (6) outreach message generation.

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Google Places API (New) — `places:searchText` | v1 (REST) | Find local businesses by area/category, read `rating`, `userRatingCount`, `websiteUri` | Already provisioned (`GOOGLE_PLACES_API_KEY`). The "New" Places API (not the legacy one) is what Google is actively developing; legacy Nearby/Text Search is in maintenance mode. Field-mask-driven billing gives direct cost control. |
| Google PageSpeed Insights API | v5 (REST) | Quantify "bad website" objectively (Performance/Accessibility/Best-Practices/SEO scores 0–100) for any business that *does* have a website | Free (25,000 requests/day), no key strictly required (key recommended for reliability), and gives a defensible, numeric "problems detected" list that feeds directly into capability 6 (outreach copy referencing specific issues) instead of a vague AI opinion. |
| Vercel AI SDK (`ai` npm package) | 5.x stable (`generateObject`/`streamObject`) | Structured, schema-validated generation of the redesigned page content + outreach copy | Already the Vercel-native way to call any LLM from Next.js Route Handlers; `generateObject` + Zod guarantees the model's output matches a fixed page-section schema, so you never parse free-form HTML/Markdown from the model. AI SDK 6/7 exist but add agent-loop/tool-calling complexity this feature doesn't need — stick to 5.x's `generateObject` for a single-shot structured-content job. |
| Vercel AI Gateway | current (no separate npm install — routed via model string, e.g. `"google/gemini-2.5-flash"`) | Model provider abstraction + unified billing/cost tracking + failover | You're already 100% on Vercel. AI Gateway passes through provider list pricing at **zero markup**, gives $5/mo free credits per team, and lets you swap the underlying model (Gemini ↔ Claude ↔ GPT) by changing one string — critical for a bootstrapped product where the cheapest-adequate model will change monthly. Avoids managing N separate provider API keys/SDKs. |
| A fast/cheap multimodal LLM (e.g. Gemini 2.5/3 Flash, or Claude Haiku 4.5) via the Gateway | current gen at build time | Generate page JSON + outreach text in one call | This is a short, single-shot structured-content task (not multi-turn reasoning) — a "flash"/"mini"/"haiku" tier model is more than adequate and is 10-50x cheaper than a flagship model. Confirm the current cheapest-adequate model at implementation time (model names/prices rotate every few months). |
| `react-compare-slider` | ^4.0.0 | Before/after visual comparator UI | Zero runtime dependencies, actively maintained (v4 shipped ~2 months before this research), renders arbitrary React children (not just `<img>`) on each side — so the "after" side can be the *live* rendered redesign (interactive) while "before" is a static screenshot image. |
| Tiptap | ^3.x (`@tiptap/react`, `@tiptap/starter-kit`) | Lightweight rich-text editing for the few free-text fields in the generated page (headline, about-us paragraph, CTA) | Headless (you own 100% of the UI), MIT-licensed, ProseMirror-based so it won't corrupt content the way raw `contenteditable` does. Much lighter than pulling in a full page-builder for what is fundamentally "edit 5–8 text fields and swap 2–4 images." |
| Postgres `jsonb` column (Supabase, existing DB) | — | Store the AI-generated page as structured data (`generated_pages.content jsonb`) | The AI SDK already outputs a Zod-validated JS object — storing it as `jsonb` means the editor (capability 4) and the public renderer (capability 5) both read/write the *same* typed shape, no HTML string ever hits the DB, and Postgres/RLS/Supabase tooling you already use works unchanged (no new storage system to learn). |
| Supabase Storage (existing project, new bucket) | — | Store binary assets only: the "before" screenshot image + any user-uploaded replacement photos | You already have a Supabase project; Storage is S3-compatible, has a CDN, and RLS-style policies — no new vendor. Use it *only* for images/binaries, never for the page content itself (see "What NOT to Use"). |
| A hosted screenshot API (e.g. ScreenshotOne, Microlink, or urlbox) | — | Capture a static image of the original site for the "before" side of the comparator | Running headless Chrome/Puppeteer inside a Vercel serverless function is a well-documented pain point (50MB+ Chromium binary near the function size limit, 3–8s cold starts, flaky in production). A hosted screenshot API is a single `fetch()` call, costs fractions of a cent per shot, and you only ever screenshot each lead's original site **once** (cache the result). |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `zod` | ^4.x | Schema for `generateObject` (page sections + outreach copy) | Every AI generation call — this is what makes the AI output safe to store directly and render without sanitization of arbitrary HTML. |
| `@ai-sdk/google` (or omit — use Gateway model strings directly) | latest matching AI SDK 5.x | Direct provider SDK, fallback if you skip the Gateway | Only needed if you decide to call Google directly instead of through AI Gateway (e.g. to dodge Gateway's model-availability constraints). Prefer the Gateway path for cost/observability. |
| `nanoid` | ^5.x | Generate short public slugs for `/p/[slug]` demo URLs | Needed for capability 5's public route — short, URL-safe, collision-resistant. |
| `p-limit` (or a simple in-house counter) | ^6.x | Enforce per-user daily search/generation caps | CONCERNS.md already flags Places API has **no cost guardrail** — this is the code-side half of the fix (paired with a DB-side `SELECT count(*) ... WHERE created_at > today` check against `prospector_customers`). |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Vercel AI Gateway dashboard | Cost observability across all AI calls | Free, ships with any Vercel project — watch this closely in week 1 to catch a runaway generation loop before it costs real money. |
| Google Cloud Console → APIs & Services → Quotas | Hard-cap Places API spend | Set a daily quota / budget alert on `GOOGLE_PLACES_API_KEY` — this is a Google Cloud console setting, not code, but it's the single most important guardrail given CONCERNS.md's flagged risk. |

---

## Installation

```bash
# Core AI generation
npm install ai zod

# Before/after comparator
npm install react-compare-slider

# Lightweight rich-text editing (only for free-text fields)
npm install @tiptap/react @tiptap/starter-kit @tiptap/pm

# Slug generation for public demo URLs
npm install nanoid

# Optional: direct Google provider (skip if using AI Gateway model strings)
npm install @ai-sdk/google
```

No new database, no new hosting platform, no new auth system — everything above is either an HTTP call to an existing-key API (Places, PageSpeed) or a small npm dependency that plugs into the existing Next.js/Supabase/Vercel stack.

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|--------------------------|
| Places API (New) `searchText` | Places API Legacy `nearbysearch`/`textsearch` | Never for new code — legacy is maintenance-mode; only relevant if you inherit code already using it. |
| PageSpeed Insights for "bad site" scoring | AI vision model judging a screenshot ("does this look outdated?") | Use as a *second-pass refinement*, not the default — it costs real money (image-input tokens) per lead and is subjective/unverifiable, whereas PageSpeed gives a numeric, defensible score for free. Reserve AI-vision judgment for leads the user has already shortlisted, not the entire search-results list. |
| `generateObject` (structured JSON page schema) | Have the LLM emit raw HTML/JSX directly | Raw HTML output is harder to validate, easier for the model to break (unbalanced tags, XSS-risk inline scripts), and can't be edited field-by-field in a UI. Structured JSON + a fixed React section-renderer is safer and is what makes capability 4 (editor) and capability 5 (public render) trivial. |
| Gemini/Claude "flash/haiku" tier via AI Gateway | Flagship model (GPT-5.x, Claude Opus, Gemini Pro) | Only escalate to a bigger model for a specific lead if the cheap model's output visibly fails quality review — don't default to flagship for a bulk, low-stakes content task. |
| Hosted screenshot API for "before" image | Self-hosted Puppeteer/Playwright in a Vercel Function | Only if volume gets high enough that per-screenshot API costs exceed running your own headless-browser service (e.g. Browserless) — unlikely at indie-SaaS scale; revisit if screenshot volume crosses ~50k/mo. |
| Postgres `jsonb` for generated page content | Store rendered static HTML file per page (Supabase Storage or Vercel Blob) | Only if you later want to let users download a fully static HTML export (a legitimate future feature) — that's an *export* step generated from the `jsonb`, not the primary storage. |
| `react-compare-slider` | `img-comparison-slider` (web component) | Use if you want a framework-agnostic component (works outside React) or need Vue/Angular compatibility elsewhere in the org — not relevant here since the whole app is Next.js/React. |
| Tiptap for rich-text fields | GrapesJS / Puck / Craft.js full page-builder | Use one of these **only** if the product pivots from "AI generates a fixed template, user tweaks text/images" to "user freely drag-and-drops arbitrary new sections/layouts." That's a materially bigger feature (and a bigger bundle) than what's specified here. |
| wa.me deep link for WhatsApp | WhatsApp Business Cloud API (Meta) | Use the Cloud API only if the product later needs to *automatically send* WhatsApp messages without the user clicking send (bulk automated outreach) — that requires business verification, template message approval, and per-message Meta + BSP fees. The spec explicitly says "WhatsApp copy-paste," which the free `wa.me?text=` link satisfies exactly. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|--------------|
| Puppeteer/Playwright bundled inside a Vercel serverless function for screenshots | Chromium binary pushes near Vercel's function size limit, causes 3–8s cold starts, and is a recurring source of "works locally, breaks in prod" bugs on serverless | A hosted screenshot API (ScreenshotOne/Microlink/urlbox) — a single `fetch()` call |
| Requesting Places `reviews` or `atmosphere` fields "just in case" | Silently moves the *entire* Text Search request from Pro tier ($32/1000) to Enterprise tier ($35–40/1000) — field-mask pricing is billed at the single most expensive field requested, even if you only wanted one cheap field alongside it | Request only the fields you'll actually use: `displayName, formattedAddress, location, rating, userRatingCount, websiteUri, primaryType, photos` (Pro tier) — omit `reviews`/`editorialSummary`/anything atmosphere-related |
| Storing the AI-generated page as a raw HTML string (in DB or as a static file per lead) | Can't be safely re-rendered without XSS sanitization, can't be partially edited field-by-field by the in-browser editor, duplicates logic between "editor preview" and "public page" rendering paths | Structured `jsonb` + one shared React section-renderer component used by both the editor preview and the public `/p/[slug]` route |
| Vercel Blob as the primary store for generated page *content* | Blob is built for files/binaries, not queryable structured records — you'd lose RLS-style per-user scoping, easy "list my leads" queries, and edit-in-place updates that Postgres gives you for free | Postgres `jsonb` column in the existing Supabase project; reserve Blob/Supabase Storage for actual binary assets (screenshots, uploaded photos) |
| WhatsApp Business Cloud API for the "copy-paste" outreach flow | Requires Meta business verification, pre-approved message templates, and per-message fees (~$0.01–0.14 marketing tier + BSP markup) — solving a problem ("send this text FOR the user") the spec doesn't ask for | `https://wa.me/<phone>?text=<url-encoded message>` — free, zero API, opens the user's own WhatsApp with the message pre-filled |
| A flagship/reasoning-tier LLM (GPT-5.x full, Claude Opus, Gemini Pro) as the *default* model for page-copy generation | 10–50x the cost of a flash/mini/haiku-tier model for a task (fill in a fixed content schema from business info) that doesn't require deep reasoning | Flash/mini/haiku-tier model via AI Gateway; reserve flagship models for a manual "regenerate with better quality" button, if you add one later |
| Skipping a per-user/per-day cap on Places searches and AI generations | This is the #1 flagged risk in CONCERNS.md ("Scaling Limits") — with no guardrail, a single confused or malicious user session can generate unbounded Google Cloud billing | Add the cap in the same PR that ships the search endpoint, not as a follow-up — see `p-limit`/counter row above |

---

## Stack Patterns by Variant

**If the business already has a website (has `websiteUri`):**
- Run PageSpeed Insights against it (free) → get 4 numeric scores.
- Only escalate to a screenshot + AI-vision "does this look dated" pass for leads the user has actually opened (not for every search result) — this keeps the expensive step opt-in and low-volume.

**If the business has no `websiteUri` at all:**
- Treat as an automatic "bad lead" (best prospect — no PageSpeed call possible/needed, no "before" screenshot possible). The before/after comparator degrades gracefully to "no current site" placeholder vs. the AI-generated one, still valuable, no billed lookups for a page that doesn't exist.

**If you want to keep per-lead cost near-zero for the initial MVP:**
- Skip AI logo generation entirely (use a CSS/SVG monogram from the business name — zero cost) and source all photography from Places Photos (already-paid-for real photos of the real business) rather than AI-generated imagery. Only add an AI image-generation upsell later if users ask for it.

**If Places search volume grows past a few thousand searches/month:**
- Add a `places_cache` table (query params + location → results, with a ~30-day TTL) in Supabase before optimizing anything else — the same geographic search run twice a week by the same or different users shouldn't be billed twice. This is a cache-first fix, not an infra change.

---

## Cost Awareness (per-unit, bootstrapped-indie context)

All figures are current list prices found during this research (2026-07); re-verify before hard-coding budget assumptions, prices move.

| Item | Unit Cost | Notes |
|------|-----------|-------|
| Places Text Search (New), Pro tier (name/address/location/rating/website, no reviews) | **$32 / 1,000 requests** (~$0.032/call) | First 5,000 calls/month free. Each call returns up to 20 places, so realistic cost-per-*qualifying* lead (after rating/website filtering) is roughly **$0.002–$0.006**. |
| Place Photos (New) | **$7 / 1,000 requests** (~$0.007/photo) | Only fetch 2–4 photos per lead you actually redesign (not per search result) — fetch lazily, on "generate redesign" click, not on every search hit. |
| PageSpeed Insights API | **Free** (25,000 requests/day) | No meaningful cost lever here — use liberally for every lead that has a website. |
| Hosted screenshot ("before" image) | **~$0.001–$0.005/screenshot**, varies by provider/tier | One-time per lead (cache it in Storage), not per view. |
| AI page + outreach copy generation, flash/mini-tier model | **~$0.005–$0.02 per lead** (rough: 2–4k input + 1.5–3k output tokens at ~$0.30/$2.50 per-M-token flash-class pricing) | Batch page-JSON + outreach-copy into a *single* `generateObject` call with a combined schema to cut this in half vs. two separate calls. |
| AI logo generation (optional, if not skipped per pattern above) | **~$0.02–$0.04/image** (flash-tier image model) to **~$0.17/image** (top-quality tier) | Recommend flash/mini-tier image quality by default; this is the single most avoidable cost — see "What NOT to Use." |
| Resend email (auto-sent outreach) | Already budgeted — existing free tier covers first 3,000/mo, ~$20/mo beyond that | No new cost driver; outreach email reuses the existing integration. |
| WhatsApp (copy-paste `wa.me` link) | **$0.00** | By design — no API involved. |

**Rough all-in cost per fully-processed lead** (search share + photos + screenshot + AI generation, before optional logo gen): **≈ $0.02–$0.06**. At, say, 200 leads processed/month across all customers, that's roughly **$4–$12/month** in variable API cost — cheap enough to not need per-plan rationing on day one, but the CONCERNS.md guardrail (per-user daily cap) is still the correct fix *before* launch, because a single runaway loop (bug, or one power user hammering "search" or "regenerate") is what turns $10/month into a surprise $500 bill, not steady-state usage.

---

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|------------------|-------|
| `ai@5.x` | `zod@4.x` | AI SDK 5 added full Zod 4 support (including Zod 4 "mini" schemas); earlier AI SDK versions had known incompatibilities with Zod 4 via `zod-to-json-schema` — don't mix an old AI SDK with Zod 4. |
| `ai@5.x` (Gateway mode) | Next.js 16 App Router Route Handlers | Call `generateObject`/`streamObject` from a Route Handler (`app/api/.../route.ts`), same pattern as the existing Kiwify/Resend routes — no Edge runtime requirement, use Node runtime so `generateObject`'s longer calls aren't constrained by Edge's stricter limits. |
| `@tiptap/react@3.x` | React 19 | Tiptap 3's React bindings target React 18/19; matches this project's React 19.2.4 — no downgrade needed. |
| `react-compare-slider@4.x` | React 19 | Declares React 18/19 as peer deps; zero other runtime dependencies, so no transitive-version conflicts expected. |
| Vercel Fluid Compute default duration (300s) | AI generation calls | A single `generateObject` call for page+copy (a few seconds to ~15s typically) comfortably fits the default timeout — no need to raise `maxDuration` or move to Vercel Workflows/background jobs for this specific step. Only reconsider if you later chain multiple sequential AI calls (e.g. generate → critique → regenerate) in one request. |

---

## Sources

- [Places API Usage and Billing (Google)](https://developers.google.com/maps/documentation/places/web-service/usage-and-billing) — Pro/Enterprise tier field-mask pricing
- [Google Maps Platform core services pricing list](https://developers.google.com/maps/billing-and-pricing/pricing) — official SKU pricing
- [Text Search (New) — Google Developers](https://developers.google.com/maps/documentation/places/web-service/text-search) — `minRating` param, field mask requirement
- [Place Data Fields (New) — Google Developers](https://developers.google.com/maps/documentation/places/web-service/data-fields) — field → SKU tier mapping
- [PageSpeed Insights API — Get Started (Google)](https://developers.google.com/speed/docs/insights/v5/get-started) — free tier, 25k req/day, score bands
- [AI SDK 5 — Vercel blog](https://vercel.com/blog/ai-sdk-5) — Zod 4 support confirmation
- [AI SDK 6 — Vercel blog](https://vercel.com/blog/ai-sdk-6) — unification of generateObject/generateText, agent-loop primitive (not needed here)
- [AI Gateway docs — Vercel](https://vercel.com/docs/ai-gateway) and [AI Gateway pricing](https://vercel.com/docs/ai-gateway/pricing) — zero-markup pass-through pricing, $5/mo free credits
- [Browse AI Gateway Models — Vercel](https://vercel.com/ai-gateway/models) — model string format (`provider/model-name`)
- [Gemini Developer API pricing — Google AI for Developers](https://ai.google.dev/gemini-api/docs/pricing) — Flash/Flash-Lite per-token pricing
- [Claude Platform pricing docs](https://platform.claude.com/docs/en/about-claude/pricing) — Sonnet 5 pricing for comparison
- [AI Image Generation API Pricing 2026 — LaoZhang blog](https://blog.laozhang.ai/en/posts/ai-image-api-pricing-comparison) and [BuildMVPFast API cost tracker](https://www.buildmvpfast.com/api-costs/ai-image) — GPT Image / Gemini image / Imagen per-image costs
- [react-compare-slider — npm](https://www.npmjs.com/package/react-compare-slider) — v4.0.0, zero-dependency confirmation
- [Croct Blog — best React before/after slider libraries of 2026](https://blog.croct.com/post/best-react-before-after-image-comparison-slider-libraries) — comparison of alternatives
- [GrapesJS vs Puck vs Craft.js 2026 verdict — GJS.Market](https://gjs.market/blogs/grapesjs-vs-webflow-vs-builderio-vs-puck-which-visual-builde) — page-builder architecture comparison, supports "skip full page-builder" recommendation
- [Tiptap — React install docs](https://tiptap.dev/docs/editor/getting-started/install/react) — headless architecture, MIT license
- [Vercel Functions limits](https://vercel.com/docs/functions/limitations) and [Configuring Maximum Duration](https://vercel.com/docs/functions/configuring-functions/duration) — Fluid Compute default 300s / up to 800s–30min
- [ScreenshotOne / Microlink Vercel integration coverage — screenshotone.com blog](https://screenshotone.com/blog/nextjs-screenshots/) and [Microlink Node.js screenshot docs](https://microlink.io/screenshot/nodejs) — why serverless Puppeteer is avoided
- [Supabase Storage docs](https://supabase.com/docs/guides/storage) and [Supabase JSON/JSONB guide](https://supabase.com/docs/guides/database/json) — jsonb vs Storage decision basis
- [WhatsApp Business Platform pricing (2026 guides, multiple)](https://respond.io/blog/whatsapp-business-api-pricing) — Cloud API per-message costs, confirms `wa.me` link is free and sufficient for the "copy-paste" requirement
- Project-local: `.planning/codebase/STACK.md`, `.planning/codebase/INTEGRATIONS.md`, `.planning/codebase/CONCERNS.md` — existing brownfield stack and the Places-API cost-guardrail gap this research addresses

---
*Stack research for: AI-powered local-business website prospecting & redesign SaaS panel (additive capabilities)*
*Researched: 2026-07-07*
