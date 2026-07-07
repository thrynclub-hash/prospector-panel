# Pitfalls Research

**Domain:** AI-powered local-business website prospecting & redesign SaaS (multi-tenant panel: Google Places search → AI redesign → public demo hosting → outreach message generation)
**Researched:** 2026-07-07
**Confidence:** HIGH (Google Places ToS and LGPD claims verified via current sources; AI-hallucination/trademark claims are well-established legal patterns, not project-specific speculation)

This research assumes the product as scoped in PROJECT.md: subscribers (assinantes) search Google Maps for local businesses with bad websites, get an AI-redesigned landing page with before/after comparator, publish it to a public demo URL hosted by the panel itself, and get a ready-to-send WhatsApp/email pitch citing the old site's real flaws — all before the target business has agreed to anything.

## Critical Pitfalls

### Pitfall 1: Caching Places API results violates Google's ToS and breaks the product's own data model

**What goes wrong:**
The product's core loop requires *persisting* leads — business name, address, phone, rating, website URL — so the subscriber can revisit a search, build a pipeline, and generate a redesign later. Google's Places API terms make this illegal for most of that data: **only the `place_id` may be cached indefinitely; latitude/longitude may be cached for a maximum of 30 days; everything else (name, address, phone, hours, rating, reviews, photos) may not be pre-fetched, cached, or stored at all** outside of a live request-response cycle, unless using a specifically licensed exception. A team builds the `leads` table with columns for name/address/rating/hours, ships it, and only discovers the violation during a Google Cloud API audit or account suspension — by which point the whole "saved leads" UX is built on a table that legally shouldn't exist in that form.

**Why it happens:**
Every other part of the product (Supabase-backed leads list, redesign pipeline, outreach message) assumes the lead's business data is a durable row the subscriber can return to. Nobody reads the Places ToS caching section before designing the schema, because "save the search result to a table" is the obvious, generic SaaS pattern — it just happens to be prohibited here.

**How to avoid:**
- Store `place_id` (permitted indefinitely) as the durable key for a lead, not the raw business data.
- Treat name/address/phone/hours/rating as **display-only, re-fetched on demand** via Places Details calls when the subscriber opens a lead — or refreshed on a schedule that respects the 30-day lat/lng limit and doesn't cache the rest at all.
- If durable display of business info is a hard product requirement (subscriber needs to see "Padaria do João, 4.8★, Rua X" days later without an extra API call), get that data through a source with different terms (e.g., the business's own scraped site/HTML, not Places API fields) or accept the re-fetch cost as a designed-in expense, not an oversight.
- Read `https://developers.google.com/maps/documentation/places/web-service/policies` in full before finalizing the `leads` schema — this is a schema decision, not a later cleanup.

**Warning signs:**
- Any migration file with a `leads` (or similar) table storing `business_name`, `rating`, `phone`, `hours` etc. as plain persisted columns with no re-fetch/expiry logic.
- No code path that re-queries Places Details before displaying "stale" lead data.
- Nobody on the team has read the Places API Policies page end-to-end.

**Phase to address:**
Schema/data-model phase for the "Buscar" (search/leads) feature — before the `leads` table migration is written, not after.

---

### Pitfall 2: AI-generated site content invents facts about a real business (hours, services, claims, reviews)

**What goes wrong:**
The redesign step asks an LLM to produce "conteúdo real melhorado" — improved real content — for a business it has incomplete information about (typically just what Places API + a site scrape yields: name, category, maybe hours, maybe a phone). The model fills gaps plausibly: invents operating hours, invents a tagline like "family-owned since 1998" with no basis, invents a services list, or (if asked to make the page look more trustworthy) synthesizes review-like testimonial text that reads as a real customer quote. The subscriber pitches this demo to the business owner as "look what your new site could say" — and the business owner sees false claims about their own company, including possibly a fabricated quote attributed to a "customer." This is reputationally worse for the subscriber than a plain/ugly redesign: it makes the product look untrustworthy or actively deceptive at the exact moment it's trying to win trust.

**Why it happens:**
LLMs are optimized to produce complete, confident-sounding output. Given a prompt like "write compelling copy for this business's new homepage," a model without hard grounding constraints will pattern-match to generic template copy for that business category and present it as if factual, because nothing in the prompt tells it "leave it blank if you don't know."

**How to avoid:**
- Separate **verified fields** (from Places API / actual site scrape: name, address, phone, category, hours *if present in source data*) from **generated fields** (marketing copy, headlines, CTAs) at the data-model and prompt level.
- Never let the model invent: operating hours, prices, certifications/awards, years-in-business, customer reviews/testimonials, or specific service claims not present in the source. If the scraped site doesn't state hours, the generated page must omit hours or show a clearly-generic placeholder, not a guessed value.
- Add an explicit system-prompt constraint + a post-generation validation pass (even a simple regex/keyword check for review-like quote patterns, or a second LLM call as fact-checker against the source scrape) before a page is allowed to publish.
- Make the before/after comparator show provenance: which fields came from the real site vs. which are AI-suggested marketing copy, so the subscriber (and eventually the business owner) can tell fact from suggestion.

**Warning signs:**
- The AI generation prompt has no explicit "do not invent X" list.
- No field-level distinction in the `redesigns` schema between scraped/verified data and generated copy.
- Generated pages contain specific numbers (hours, years, prices) that don't trace back to any source field.
- No human-visible flag in the editor UI showing which text was AI-generated vs. sourced.

**Phase to address:**
The "Redesenhar" (AI generation) phase — the prompt design and output schema must build in fact/generated separation from the first version, since retrofitting it after subscribers have already sent fabricated-content demos is a trust problem, not just a code fix.

---

### Pitfall 3: Reusing scraped photos/logos without rights creates copyright exposure for the panel operator

**What goes wrong:**
The redesign pulls "fotos/logo originais" (original photos/logo) from the target business's existing site or Google Business listing to use in the new demo page. Those images are typically copyrighted by the business, a photographer, or a stock-photo licensor the business paid for — the panel has no license to reuse them, even for a comparator demo. If the demo becomes public (which it does — it gets a public URL specifically so it can be sent as a pitch), the panel operator is redistributing copyrighted images without a license at scale, across every subscriber's every search. This is a different and more direct risk than most "AI redesign" pitches because the images aren't AI-generated (which has its own separate rights questions) — they're a straight, unlicensed re-hosting of someone else's copyrighted asset by the SaaS platform itself.

**Why it happens:**
"Use their real photo so it looks like their actual redesigned site, not a generic stock template" is the obvious way to make the demo compelling — but compelling-because-real is exactly what makes it legally exposed, since there's no fair-use-like blanket exception for "we're pitching them a redesign."

**How to avoid:**
- Treat this as a rights question, not a technical one: reusing the business's own logo for a *demo shown back to that same business* is lower-risk (arguably implied fair use in a sales-pitch context, common industry practice for redesign mockups) than reusing arbitrary photography that may be third-party licensed (stock photos the business paid for, professional photography, images scraped from their Instagram/Facebook that a photographer owns).
- Prefer AI-generated or licensed stock imagery for anything beyond the logo/wordmark, and limit "real" reuse to the business's own logo and possibly their own product/storefront photos if clearly business-owned (not third-party stock).
- Never let scraped images flow into the *public* demo URL without this distinction being enforced in code — an editor-only preview (private, subscriber-only) is much lower risk than a public URL indexable/shareable by anyone.
- Document this as an explicit product policy the subscriber agrees to (ToS) since the panel can't fully control what subscribers scrape, but should limit what the *system itself* auto-pulls into public pages.

**Warning signs:**
- The redesign pipeline has an image-scraping step with no source-classification (logo vs. stock vs. arbitrary photo) and no filter before those images reach the public demo template.
- No ToS/subscriber agreement language addressing image rights for what they submit or the panel auto-scrapes.

**Phase to address:**
The "Redesenhar" (AI generation) phase, specifically the image-sourcing step — and the "Publicar" (publish) phase should add a policy gate distinguishing what's safe to expose in the *public* URL vs. what stays in the private editor-only preview.

---

### Pitfall 4: A public demo URL bearing a real business's name/branding reads as impersonation, not a "mockup"

**What goes wrong:**
The public demo URL (e.g., `panel.app/demo/padaria-do-joao`) displays the target business's real name, logo, address, and (per Pitfall 2/3) possibly their real photos — built and published by a third party (the subscriber) with zero involvement or consent from the business. To anyone who lands on that URL without context — a customer of that business searching their name, the business owner's competitor, or the business owner themselves finding it via a Google alert before ever being contacted — this looks exactly like the business's real new website, not a "here's a mockup we made you" sales artifact. That's the functional definition of impersonation/unauthorized use of a trade name, independent of intent. It also creates a specific bad scenario: the business owner discovers the site *before* getting the pitch message (e.g., a customer mentions "hey your new site looks great" or it gets indexed and outranks their real site), and the subscriber's first contact with them is now defensive ("why do you have a fake website with my name on it") instead of a sales pitch.

**Why it happens:**
The demo needs to *look real* to be persuasive — that's the entire value proposition (before/after comparator). The team optimizes for "convincing," which is in direct tension with "clearly not the business's actual site," and nobody explicitly designs for the second constraint because it's not in the feature description.

**How to avoid:**
- Every public demo page must carry an unambiguous, hard-to-miss disclaimer (not fine print): e.g., a persistent banner "This is an unofficial concept redesign created by [Subscriber/Panel name], not affiliated with or published by [Business Name]. Not a live website." Consider requiring it in both visual banner and page `<title>`/meta so it also shows in search snippets and link previews.
- Do not let demo URLs get indexed by search engines — `noindex` meta tag and `robots.txt` disallow on the entire demo subdomain/path, specifically to prevent the "customer finds it via Google before the pitch happens" scenario and to avoid it outranking or being confused with the business's real site.
- Consider a time-boxed/access-gated demo (expiring link, or requires the subscriber to share it explicitly) rather than a permanently crawlable public path — reduces both accidental discovery and the surface area of "we're hosting a business's branded impersonation indefinitely."
- Treat the disclaimer + noindex requirement as non-negotiable, launch-blocking scope for the "Publicar" feature, not a nice-to-have added later.

**Warning signs:**
- Demo URLs with no visible disclaimer, or disclaimer only in a footer/small text.
- No `noindex` / `robots.txt` handling for the demo hosting path.
- Demo URL structure/slug uses the business's real name with no "concept"/"demo"/"unofficial" marker in the URL itself.
- No expiry or access-control mechanism — demos live forever at a stable, guessable/discoverable URL.

**Phase to address:**
The "Publicar" (public hosting) phase — this is the single highest-legal/reputational-risk feature in the whole product and should be scoped with the disclaimer + noindex + access-control requirements as acceptance criteria, not left to a follow-up polish pass.

---

### Pitfall 5: No per-subscriber cost guardrails on Places search or AI generation lets one account burn the whole budget

**What goes wrong:**
This is already flagged in CONCERNS.md for Places API specifically, but the same failure mode applies independently — and worse — to AI generation, which is typically far more expensive per call than a Places search. A subscriber (malicious, careless, or just running a bot/script against the panel's own API) triggers repeated searches or repeated redesign generations in a loop. Because both Places API and whatever AI provider generates the redesign content are pay-per-call with no per-user cap in the codebase (confirmed: "no rate-limiting or per-user quota built into this codebase" per CONCERNS.md), a single subscriber paying R$19,97/month can generate unbounded backend cost — potentially thousands of reais in API spend from one account, unnoticed until the monthly Google Cloud / AI provider bill arrives.

**Why it happens:**
Rate-limiting and quota enforcement are the kind of guardrail that's invisible when everything's fine and only matters under abuse or a client-side bug (e.g., a retry loop with no backoff hammering the redesign endpoint) — so it's naturally deprioritized behind visible features during MVP build, especially since the current single-tenant testing never exercises the failure path.

**How to avoid:**
- Add a hard per-subscriber, per-day (and per-month) cap on both Places searches and AI redesign generations, enforced server-side against `prospector_customers`/subscription tier — before either the "Buscar" or "Redesenhar" endpoint ships, not after.
- Make the cap visible in the UI (subscriber sees "12/20 searches used today") so hitting it reads as a normal quota, not a broken feature.
- Add a global daily spend circuit breaker independent of per-user caps (e.g., total AI spend across all subscribers > $X/day triggers an alert or temporary throttle) as defense-in-depth against a bug that bypasses per-user limits.
- Idempotency: ensure retries (client-side double-click, network retry) don't double-charge the quota or trigger duplicate paid API calls for the same request.

**Warning signs:**
- The search/redesign API routes have no rate-limit middleware and no query against a usage-counter table before calling Places/AI.
- No usage/quota column on `prospector_customers` or a separate `usage` table.
- No alerting on daily API spend from Google Cloud / the AI provider's billing dashboard.

**Phase to address:**
Must be built alongside the "Buscar" phase (Places calls) and the "Redesenhar" phase (AI calls) — each expensive endpoint needs its quota check as part of that phase's definition of done, not a separate later "add rate limiting" phase (by then, subscribers already have the unrestricted habit and un-capping mid-flight is a worse UX regression than shipping the cap from day one).

---

### Pitfall 6: Outreach messages that quote a business's own site "flaws" read as unsolicited spam under LGPD/anti-spam norms

**What goes wrong:**
The "Proposta" feature generates a WhatsApp/email message the subscriber sends cold to a business owner, explicitly referencing problems detected in their current site ("seu site não carrega no celular", "sua página demora X segundos para abrir"). This is **unsolicited commercial contact to a person or business who never opted in** — and under Brazil's LGPD, sending marketing/commercial messages via WhatsApp without consent is a recognized violation (confirmed via current sources: "under the LGPD, people should not receive messages from companies via WhatsApp, except if there is explicit consent"; LGPD fines can reach 2% of revenue up to R$50M per infraction). The critique-framing ("your site is broken") compounds the risk: beyond being unsolicited, it can read as disparaging/insulting to a small business owner who takes pride in their site, making the message likely to be reported as spam/abuse on WhatsApp (risking the *subscriber's* number getting banned, and by extension normalizing a pattern that could get the panel's own sending infrastructure — Resend, WhatsApp Business numbers if ever automated — flagged).

**Why it happens:**
The entire business model depends on cold outreach citing a real, specific pain point (that's what makes the pitch credible and not generic spam) — but LGPD/CAN-SPAM-style rules were written assuming outreach is either consented-to or at minimum not framed as "I found a problem with something you own." The tension between "message needs to be specific and pointed to convert" and "unsolicited + critical message about someone's business = spam/compliance risk" isn't something a generic SaaS builder pattern addresses, so it doesn't get raised unless someone specifically checks Brazilian outreach compliance norms — which PROJECT.md's "Out of Scope" section (no automated WhatsApp sending) partially defers but doesn't eliminate: the *email* auto-send via Resend is explicitly in scope for v1, and that's the one legally exposed the same way.

**How to avoid:**
- For the copy/paste-to-WhatsApp text: this is lower legal exposure since the *subscriber* is the one sending it manually from their own number/judgment (the panel is a tool, not the sender) — but the generated message template should still be reviewed for tone (constructive framing — "notei uma oportunidade de melhorar..." — rather than blunt criticism — "seu site está quebrado") to reduce both spam-report risk and business-owner backlash, and the panel's ToS should make clear the subscriber is responsible for outreach-law compliance in their jurisdiction.
- For the **automated email send via Resend** (explicitly in scope per PROJECT.md): since this is the panel's own infrastructure sending on the subscriber's behalf, the panel operator carries more direct exposure. At minimum: this is B2B outreach to a business's public contact email (not a personal consumer), which has somewhat more legal room in most jurisdictions than consumer spam — but LGPD's application depends on whether the email/contact is tied to an identifiable natural person (very likely for a solo/small local business where the "public e-mail" *is* the owner's personal address). Build in: a clear unsubscribe/opt-out mechanism even for a single cold email, sender identification (who is sending and why), and a suppression list so a business that asks not to be contacted again can't be re-targeted by another subscriber's search hitting the same lead.
- Do not let the message template reference LGPD-sensitive personal data beyond what's publicly displayed by the business itself for business purposes (e.g., don't have the AI pull and cite the owner's personal name/data if that wasn't the point of contact).

**Warning signs:**
- No suppression/do-not-contact list shared across subscribers for a given business/lead — i.e., ten different subscribers can independently spam the same business because the panel doesn't track "this business already got a Resend outreach email and declined/ignored it."
- Outreach email template has no unsubscribe/opt-out link.
- No ToS clause assigning outreach-compliance responsibility to the subscriber for manual channels.
- Message copy generation has no tone constraint distinguishing "constructive opportunity" framing from "your site is broken/bad" framing.

**Phase to address:**
The "Proposta" (message generation + Resend auto-send) phase — the suppression list and opt-out mechanism are structural (need a schema field/table), so must be designed into that phase, not bolted on after complaints arrive.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Store full Places API response as-is in `leads` table | Fast to build, simple UI queries | Direct ToS violation → API key revocation risk; forces a painful re-migration once caught | Never — even in early testing, since habits/schema decisions compound |
| Let AI generate full page copy with no fact/generated-field split | Faster prompt engineering, simpler schema | Hallucinated business facts reach real pitches; costly to retrofit provenance tracking after subscribers already have muscle memory for the "just generate it" flow | Only for a fully internal, never-sent prototype demo |
| Skip per-subscriber rate limits on search/generation "until we have real users" | Ships faster, one less system to build | First real abusive/buggy user can generate an unbounded bill before anyone notices | Never for endpoints that call metered external APIs — acceptable only for zero-cost internal endpoints |
| No suppression list for outreach targets | Simpler `messages` table, faster v1 | Same business gets hit repeatedly by different subscribers → LGPD complaint risk compounds with scale | Never once outreach automation (Resend send) is live; borderline-acceptable only while outreach is 100% manual copy/paste with no panel-side send |
| Public demo URL with no noindex/disclaimer "just to see how it looks" | Fastest path to a shareable demo | Search engines index it, business owner finds it out of context before the pitch — most damaging failure mode in the whole product | Never in production; acceptable only behind an auth wall in dev/staging |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|-------------------|
| Google Places API | Persisting full result objects (name, rating, hours, reviews) into app tables as if it were normal third-party API data | Store only `place_id` long-term; re-fetch display fields live or respect the 30-day lat/lng cache limit; read the Policies page before schema design |
| Google Places API | Treating quota/billing as "handled by the API key" with no app-level tracking | Track usage per subscriber in your own DB as the source of truth for quota enforcement — don't rely solely on Google Cloud's billing alerts, which fire *after* spend happens |
| AI generation provider (whichever LLM is used for redesign copy) | No separation between "grounded" fields (from scrape/Places) and "generated" fields (marketing copy) in the prompt or schema | Explicit prompt constraints ("do not invent hours/prices/reviews") + schema-level tagging of field provenance, validated before publish |
| Resend (transactional email) | Reusing the existing magic-link Resend integration pattern for cold outreach emails without adding unsubscribe/suppression logic, since the existing use case (magic link) never needed it | Build a separate outreach-email code path with unsubscribe header/link, suppression-list check, and sender identification distinct from the transactional magic-link sender |
| Public demo hosting (own infra, per PROJECT.md's "no cPanel/HostGator dependency") | Publishing to a publicly crawlable path with the business's real name in the URL slug, no `noindex`, no disclaimer | `noindex` + `robots.txt` disallow on the whole demo path; persistent on-page disclaimer; consider expiring/access-gated links |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Synchronous AI redesign generation blocking the request/response cycle | Panel UI hangs or times out while waiting for LLM + image processing to finish | Move redesign generation to a background job with a polling/webhook status update in the UI | As soon as generation takes more than a few seconds — likely from the first real redesign, given multi-step generation (content + layout + images) |
| Re-fetching full Places Details on every lead-list render (to comply with Pitfall 1's no-caching rule) | Slow lead list, API quota burns faster than expected, contradicts the cost-guardrail goal of Pitfall 5 | Cache only what's legally permitted (place_id, 30-day lat/lng) and design the UI to not require repeated live re-fetch of full details just to render a list — fetch details on-demand when a lead is opened, not on every list render | Once a subscriber has dozens+ of saved leads and opens the list repeatedly |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Admin (service-role) Supabase client used for new `leads`/`redesigns`/`messages` tables the same way it's used for the Kiwify webhook (already flagged in CONCERNS.md) | A scoping bug in a new route lets one subscriber read/mutate another subscriber's leads or generated pages | Use the session-bound client + real RLS policies for all subscriber-owned prospecting data; reserve the admin client for the webhook's genuinely identity-agnostic use case |
| Public demo URLs generated with a predictable slug (e.g., sequential ID or literal business-name slug) | Anyone can enumerate/guess other subscribers' demo URLs — including competitors scraping every demo on the platform, or the target business finding it before the pitch (compounds Pitfall 4) | Use a non-guessable random token in the demo URL in addition to (or instead of) a human-readable slug |
| No suppression/rate-limit tracking shared across the AI generation endpoint | A single compromised or malicious subscriber account can be scripted to drain the AI/Places budget (compounds Pitfall 5) | Server-side quota enforcement independent of client trust, plus anomaly alerting on a single account's usage spike |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|------------------|
| Editor lets subscriber "fix" AI-hallucinated content only after it's already been shown in the before/after comparator and possibly published | Subscriber may not notice a fabricated claim before sending it to a real business owner, since the comparator is designed to be glanced at quickly, not fact-checked | Flag AI-generated (non-sourced) fields visually in the editor *before* publish/send, so the subscriber's attention is drawn to exactly the content that needs a human check |
| No warning at the "Publicar" step about the public-URL/impersonation risk (Pitfall 4) | Subscriber publishes without disclaimer/noindex consideration because the product silently allows it | Show a one-time (or persistent, low-friction) explanation at publish time: "this creates a public page — it will include a disclaimer and won't be indexed by search engines" so the subscriber understands the safety rails exist and why |
| Subscriber can trigger unlimited searches/generations with no visible counter | Subscriber has no signal they're approaching a quota until a hard block appears, feels like a bug | Visible usage counter ("X/Y searches this month") tied to the same guardrail from Pitfall 5 |

## "Looks Done But Isn't" Checklist

- [ ] **Places API integration ("Buscar"):** Often missing the caching/storage compliance boundary — verify the `leads` table only durably stores `place_id` (+ optionally 30-day-expiring lat/lng), not raw name/rating/hours as permanent columns.
- [ ] **AI redesign generation ("Redesenhar"):** Often missing fact/generated-field separation — verify the schema and UI can distinguish "from the real site" vs. "AI-suggested copy," and that hours/prices/reviews are never invented.
- [ ] **Public demo publishing ("Publicar"):** Often missing the disclaimer banner, `noindex`/`robots.txt`, and non-guessable URL — verify all three are present before considering this feature launch-ready, not just "renders correctly."
- [ ] **Outreach message generation ("Proposta"):** Often missing an unsubscribe/suppression mechanism for the automated Resend email path — verify a business that's been contacted (or opts out) can't be re-targeted by the same or another subscriber.
- [ ] **Usage/cost guardrails:** Often missing entirely in MVP — verify both Places search and AI generation have server-enforced per-subscriber caps before opening signups beyond a trusted small group.
- [ ] **Image sourcing in redesigns:** Often missing any distinction between the business's own logo (lower risk to reuse) and arbitrary scraped/stock photography (higher copyright risk) — verify the pipeline classifies image sources before allowing them into a *public* demo.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|-----------------|
| Places API caching violation discovered post-launch | MEDIUM | Purge non-permitted cached fields from the DB, migrate `leads` schema to place_id-first model, re-fetch details live going forward; notify Google if API key was flagged and follow their remediation process |
| A published demo contained hallucinated facts a business owner objected to | MEDIUM–HIGH (reputational) | Immediately un-publish/take down the specific demo, add the fact/generated-field split retroactively before allowing further publishes, consider direct outreach/apology from the subscriber if the business owner was upset — this is a trust incident, not just a bug fix |
| A business owner discovers their public demo before being pitched (impersonation complaint) | HIGH (reputational, possible legal threat) | Take the demo down immediately, honor any takedown request without friction, review whether noindex/disclaimer were actually live for that page (likely they weren't, if this happened), retrofit those guardrails platform-wide before other demos face the same exposure |
| Subscriber ran up unexpected AI/Places API spend via a loop/bug | LOW–MEDIUM (financial) | Add emergency per-account throttle, review billing logs to quantify exposure, retrofit the quota system from Pitfall 5 before re-enabling the account |
| LGPD complaint/report about an outreach email | MEDIUM–HIGH (legal + reputational) | Add the contacted business to a suppression list immediately, respond to any regulatory inquiry with documentation of what was sent and to what (public business) contact, retrofit unsubscribe/suppression mechanism if not already present |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|-------------------|----------------|
| Places API caching ToS violation | "Buscar" (search/leads) schema design | `leads` migration only persists `place_id` + optionally short-lived lat/lng; display fields fetched live or on a compliant refresh cycle |
| AI-hallucinated business facts | "Redesenhar" (AI generation) prompt + schema design | Generated-content schema tags each field's provenance; prompt has explicit do-not-invent constraints; spot-check test pages contain no unsourced hours/prices/reviews |
| Unlicensed image reuse | "Redesenhar" (image sourcing) + "Publicar" (public exposure gate) | Image pipeline classifies logo vs. scraped/stock photo; only logo/business-owned images reach the public demo path by default |
| Public demo impersonation risk | "Publicar" (public hosting) | Every public demo has a visible disclaimer, `noindex` meta + `robots.txt` block, and a non-guessable URL; verified via a test crawl and a manual "does this look like their real site with no context" review |
| No cost guardrails on Places/AI | "Buscar" and "Redesenhar" phases (each endpoint's definition of done) | Per-subscriber daily/monthly cap enforced server-side and visible in UI; a scripted loop against the endpoint in staging gets blocked at the cap |
| Outreach spam/LGPD exposure | "Proposta" (message generation + Resend send) | Suppression-list table exists and is checked before every automated send; outreach email includes opt-out; ToS assigns manual-channel compliance responsibility to the subscriber |

## Sources

- [Policies and attributions for Places API | Google for Developers](https://developers.google.com/maps/documentation/places/web-service/policies) — caching restrictions (place_id indefinite, lat/lng 30-day limit, no caching of other fields)
- [Google Maps Platform Service Specific Terms | Google Cloud](https://cloud.google.com/archive/maps-platform/terms/maps-service-terms-20250501)
- [LGPD e WhatsApp Business 2026: Guia Completo de Conformidade](https://www.socialhub.pro/blog/lgpd-whatsapp-business-guia-conformidade-2026/) — consent requirement for commercial WhatsApp contact under LGPD
- [Desrespeito às normas da LGPD: Empresas usam o WhatsApp sem considerar a privacidade dos consumidores](https://feiradesantana.cdls.org.br/desrespeito-as-normas-da-lgpd-empresas-usam-o-whatsapp-sem-considerar-a-privacidade-dos-consumidores/) — fine scale (up to 2% of revenue, capped at R$50M/infraction)
- [Business name trademark infringement: protect your brand name](https://www.redpoints.com/blog/business-name-trademark-infringement/) — unauthorized brand/name use and confusion-based liability
- [Trademark Infringement and the Tort of Passing Off](https://www.heerlaw.com/trademark-infringement-passing-off) — passing-off exposure even without registered trademark
- [Business Liability for AI Hallucinations: Legal Defense Strategies](https://www.thebulldog.law/business-liability-for-ai-hallucinations-defense-strategies-when-artificial-intelligence-gets-wrong) — accountability for AI-generated false claims doesn't disappear because a model generated them
- Project-internal: `.planning/PROJECT.md`, `.planning/codebase/CONCERNS.md` (existing schema/cost/auth-guard concerns this research extends)

---
*Pitfalls research for: AI-powered local-business website prospecting & redesign SaaS (Hunter of Bad Pages)*
*Researched: 2026-07-07*
