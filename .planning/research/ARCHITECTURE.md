# Architecture Research

**Domain:** Multi-tenant Next.js SaaS panel — AI content generation + public demo hosting, integrated into an existing brownfield auth/billing shell
**Researched:** 2026-07-07
**Confidence:** HIGH (grounded directly in this repo's existing code, not generic best-practice — see `.planning/codebase/*.md` for source material)

---

## 0. Existing Foundation (do not re-derive, just extend)

This is not a greenfield architecture. The panel already has:

- Next.js 16 App Router, Route Handlers under `app/api/*/route.ts`, Server Components for pages
- Supabase (Postgres + Auth), passwordless magic-link login, session cookie refreshed by `proxy.ts`
- One table: `prospector_customers` (`id`, `user_id → auth.users.id`, `email`, `status`, `kiwify_order_id`) — **no migrations tracked**
- `app/painel/page.tsx` — a Server Component placeholder, checks `supabase.auth.getUser()` inline, **no shared guard**
- `GOOGLE_PLACES_API_KEY` provisioned, unused
- Client factory pattern is the house style: every Supabase/external client is a *function* that constructs a client per call, never a module-scope singleton (a module-scope `Resend` client already crashed a build once — see `CONCERNS.md`). **Every new integration (Places, AI provider) must follow this same factory-function shape.**

Everything below is designed to slot into this shape, not replace it.

---

## 1. Data Model

### 1.1 Tenancy key: use `user_id`, not `customer_id`

`prospector_customers` is a 1-row-per-purchaser record keyed by `user_id → auth.users.id`. For RLS simplicity and consistency with Supabase's standard `auth.uid()` pattern, **every new table gets its own `user_id uuid not null references auth.users(id) default auth.uid()`** rather than FK-ing through `prospector_customers.id`. This means:

- RLS policies are a one-liner: `using (auth.uid() = user_id)` — no join required, no risk of a bad join leaking rows.
- Business-rule checks (`status = 'active'`, quota remaining) are **application-level** in the Route Handler, layered on top of RLS — not baked into the RLS policy itself. This matches the existing codebase's separation: RLS = ownership, code = business rules.

### 1.2 New tables

```sql
-- 1. Leads found via "Buscar"
create table leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  place_id text not null,              -- Google Places place_id, dedupe key
  name text not null,
  address text,
  phone text,
  website_url text,
  public_email text,                   -- scraped/public email, if found
  rating numeric(2,1),
  category text,
  raw_places_data jsonb,               -- full Places API response, for re-use without re-querying
  status text not null default 'found',-- found | redesigning | redesigned | published | proposed | archived
  created_at timestamptz not null default now(),
  unique (user_id, place_id)           -- same subscriber can't duplicate a lead
);

-- 2. Generated redesign (one lead can have multiple attempts; keep latest as "active")
create table redesigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  lead_id uuid not null references leads(id) on delete cascade,
  version int not null default 1,
  content jsonb not null,              -- structured page content: sections/copy/images-as-data, NOT rendered HTML
  status text not null default 'generating', -- generating | ready | failed
  public_slug text unique,             -- set only at publish time (nanoid, unguessable)
  is_public boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Before/after asset pairs (screenshots, extracted photos/logo)
create table redesign_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  redesign_id uuid not null references redesigns(id) on delete cascade,
  kind text not null,                  -- before_screenshot | after_screenshot | source_photo | source_logo
  storage_path text not null,          -- Supabase Storage object path
  created_at timestamptz not null default now()
);

-- 4. Outreach messages ("Proposta")
create table outreach_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  lead_id uuid not null references leads(id) on delete cascade,
  redesign_id uuid references redesigns(id),  -- nullable: message can theoretically exist before redesign, but see §5
  channel text not null,                -- whatsapp | email
  body_text text not null,
  subject text,                         -- email only
  sent_at timestamptz,                  -- null = not sent yet (whatsapp is always null, copy/paste only per PROJECT.md scope)
  created_at timestamptz not null default now()
);

-- 5. Per-subscriber usage/quota tracking — event log, not a mutable counter
create table usage_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) default auth.uid(),
  action text not null,                 -- 'search' | 'redesign_generate'
  created_at timestamptz not null default now()
);
create index usage_events_user_action_time_idx on usage_events (user_id, action, created_at);
```

**Why an event log for quotas, not a counter column:** an `UPDATE ... SET count = count + 1` counter is one fewer table but races under concurrent requests and has no audit trail (can't answer "when did they burn their quota"). A log table + `COUNT(*) WHERE created_at > now() - interval '1 day'` query is simpler to reason about, self-auditing, and cheap at this scale (a handful of subscribers, low request volume). Revisit only if usage volume ever makes the count query itself a bottleneck (not a near-term concern per `CONCERNS.md`'s Performance section: "too small/early to have any yet").

**Why `content jsonb` on `redesigns`, not rendered HTML:** the editor needs to mutate individual text/image fields, and the public demo page needs to render the *current* state (edited or not) — a single structured-data representation serves both, rendered through one shared React template component. Storing generated HTML would mean the editor either re-parses HTML (fragile) or the system maintains two representations that can drift. This is the one data-model decision worth flagging as load-bearing for Editor+Publicar: **decide the `content` JSON shape before building either.**

**Relation to `prospector_customers`:** none of the new tables FK to it directly. It stays the source of truth for subscription `status`; Route Handlers that mutate `leads`/`redesigns`/quotas check `prospector_customers.status === 'active'` (queried by `user_id`) before allowing writes, alongside RLS's ownership check. Two independent gates, same pattern the codebase already uses for auth (`auth.uid()` = identity, `prospector_customers.status` = entitlement).

### 1.3 Migrations — fix as prerequisite, not afterthought

`CONCERNS.md` already flags this. Concretely, before writing any of the tables above:

1. Run `supabase db pull` (or manually write it) to capture the *actual* current `prospector_customers` schema as `supabase/migrations/00000000000000_baseline.sql` — don't guess columns from code, pull the real DDL including any indexes/constraints that exist only in the dashboard.
2. Every table in §1.2 becomes its own `supabase migration new <name>` file, applied via `supabase db push` (or the `apply_migration` MCP tool if working against the linked project directly).
3. From this point forward, **no more SQL-editor-only schema changes** — this is the enforcement mechanism, not a one-time cleanup.

This must land as its own early unit of work (see §5, Build Order) — every subsequent table in this document depends on the baseline existing first, or the new migrations have no known-good starting point to diff against.

---

## 2. Component Boundaries — Route Handlers & Pages

Following the existing convention (`STRUCTURE.md`: "page + matching API handler, one route.ts per concern, no shared controller layer"):

```
app/
├── painel/
│   ├── layout.tsx                       # NEW — shared auth guard (see §4), wraps entire /painel/* subtree
│   ├── page.tsx                         # dashboard / lead list overview (replaces placeholder)
│   ├── buscar/
│   │   └── page.tsx                     # search form (client island) + results list (server)
│   ├── leads/
│   │   └── [leadId]/
│   │       ├── page.tsx                 # lead detail — links to redesign/editor/publish/proposta
│   │       ├── redesenhar/page.tsx      # before/after comparator, "gerar" trigger
│   │       ├── editor/page.tsx          # client-heavy: edit content jsonb fields
│   │       └── proposta/page.tsx        # generated message + copy/send-email actions
│   └── configuracoes/                   # (not in scope, just noting where quota/plan UI would live)
├── demo/
│   └── [slug]/
│       └── page.tsx                     # NEW — PUBLIC, unauthenticated, outside /painel entirely
├── api/
│   ├── leads/
│   │   └── search/route.ts              # POST — Places API call + quota check + insert leads
│   ├── redesigns/
│   │   ├── generate/route.ts            # POST { leadId } — AI generation, writes redesigns row
│   │   └── [id]/
│   │       ├── route.ts                 # PATCH — editor saves (content jsonb)
│   │       └── publish/route.ts         # POST — sets public_slug + is_public + published_at
│   └── messages/
│       ├── generate/route.ts            # POST { leadId } — AI text generation → outreach_messages
│       └── [id]/send-email/route.ts     # POST — Resend send, sets sent_at
```

**New `lib/` additions, following the existing factory-function convention:**

```
lib/
├── google-places/client.ts    # factory: createGooglePlacesClient() — NOT a module const
├── ai/
│   ├── client.ts               # factory: createAIClient() — same rule, learned from the Resend crash
│   └── generate-redesign.ts    # prompt + call + shape the `content` jsonb
├── storage/assets.ts           # Supabase Storage upload helpers for before/after images
├── quota.ts                    # checkQuota(userId, action) → reads usage_events, throws/returns boolean
└── validation.ts               # NEW — extract the already-duplicated email normalization (CONCERNS.md debt item), reuse for lead email validation too
```

### Component responsibility table

| Component | Responsibility | Notes |
|-----------|-----------------|-------|
| `app/painel/layout.tsx` | Single auth + subscription-status gate for all painel pages | See §4 — this is the fix for the flagged fragility |
| `app/painel/buscar/page.tsx` | Render search form + existing leads list | Server Component fetches leads via session-bound client; form submit is a client island calling the API route |
| `app/api/leads/search/route.ts` | Call Places API, apply quota, filter (rating ≥ 4.7, weak-site heuristic, public email present), upsert `leads` | Uses `lib/google-places/client.ts` + `lib/quota.ts` |
| `app/painel/leads/[leadId]/redesenhar/page.tsx` | Trigger generation, poll/display status, render before/after comparator | Client component polls `redesigns` row status (simplest MVP: `router.refresh()` on interval, or Supabase Realtime subscription if available) |
| `app/api/redesigns/generate/route.ts` | Call AI provider, shape `content` jsonb, capture before-screenshot | Long-running — set `export const maxDuration` per Vercel function limits; status starts `generating`, flips to `ready`/`failed` |
| `app/painel/leads/[leadId]/editor/page.tsx` | Client-side form bound to `redesigns.content` fields | PATCHes `app/api/redesigns/[id]/route.ts` on save |
| `app/api/redesigns/[id]/publish/route.ts` | Generate unguessable slug, flip `is_public`/`published_at` | Ownership check via RLS + explicit `user_id` match before allowing publish |
| `app/demo/[slug]/page.tsx` | Public render of a redesign by slug | **No session, no `/painel` layout** — see §3 |
| `app/api/messages/generate/route.ts` | AI-generate proposal text citing detected problems | Reads `leads` + `redesigns.content`; includes public demo URL if `redesigns.is_public` |
| `app/api/messages/[id]/send-email/route.ts` | Send via existing `lib/email/resend.ts` pattern | Add a second template function alongside `sendMagicLinkEmail()`, same file or a sibling — do not touch the magic-link path |

---

## 3. Public Demo Hosting — Multi-Tenant Isolation

**Question:** how to serve one subscriber's generated page publicly without leaking other subscribers' data or the panel's authenticated surface.

**Routing pattern:** `app/demo/[slug]/page.tsx` — a **top-level route segment, sibling to `app/painel/`, not nested inside it.** This is the entire auth boundary: because it's not under `app/painel/*`, the new `app/painel/layout.tsx` guard (§4) never runs for it, and there is no session cookie requirement anywhere in its render path.

**Data access boundary (the part that actually prevents leakage):**

1. **Slug, not ID, is the lookup key** — `public_slug` is a random, unguessable token (e.g. `nanoid(12)`) generated only at publish time, never the sequential `redesigns.id`. Guessability of an incrementing ID is exactly how multi-tenant apps leak sibling data by accident; a random slug means enumeration is infeasible.
2. **Query through a narrow view, not `select('*')` on the base table:**

```sql
create view public_redesigns as
select id, public_slug, content, published_at
from redesigns
where is_public = true;
```

   `app/demo/[slug]/page.tsx` queries `public_redesigns` by `public_slug`, never `redesigns` directly. This is defense in depth: even if a future code change forgets the `is_public = true` filter in a handler, the view structurally cannot return unpublished rows or non-public columns (`user_id`, `lead_id`, internal status) — the leak is prevented at the schema level, not just the query level.
3. **Client choice:** use the **anon key** client (`lib/supabase/client.ts` equivalent server-side pattern, or a plain anon-key server client), not the service-role admin client, for this one read. `CONCERNS.md` already flags the risk of the admin client being "reused casually in a future route" — a public route is the highest-risk place for that mistake, because a scoping bug there is directly internet-facing. Add an RLS policy on `redesigns` (or the view, if views need it) allowing anonymous `SELECT` only where `is_public = true` — this makes the anon-key path fail closed even if the view/query is later modified carelessly, matching the exact principle `CONCERNS.md` recommends for the admin-client risk.

```
┌─────────────────────────────────────────────────────────────┐
│  UNAUTHENTICATED                                              │
│  app/demo/[slug]/page.tsx                                     │
│       │ query by public_slug (anon key)                       │
│       ▼                                                       │
│  public_redesigns VIEW  (is_public = true, narrow columns)    │
│       │                                                        │
│       ▼                                                       │
│  redesigns table (RLS: anon SELECT only where is_public=true) │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  AUTHENTICATED (/painel/*)                                    │
│  app/painel/layout.tsx  → guard → session-bound client        │
│       │                                                        │
│       ▼                                                       │
│  redesigns table (RLS: auth.uid() = user_id, full columns)    │
└─────────────────────────────────────────────────────────────┘
```

No shared code path between the two — the public page never touches the session-bound client, and the painel pages never touch the anon-key/view path. That separation *is* the isolation guarantee.

---

## 4. Fixing the Two Flagged Gaps as Part of This Build

Both are called out in `CONCERNS.md` as pre-existing debt that "must" be addressed before/while adding the new pages — not optional cleanup:

**No shared auth-guard (`app/painel/page.tsx` fragility):**

Create `app/painel/layout.tsx` as a Server Component:

```ts
// app/painel/layout.tsx
export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // existing /painel/page.tsx only checked session presence — extend to entitlement,
  // since quota + generation features are gated on an active subscription, not just a valid cookie
  const { data: customer } = await supabase
    .from("prospector_customers")
    .select("status")
    .eq("user_id", user.id)
    .single();
  if (customer?.status !== "active") redirect("/obrigado"); // re-enters the existing self-serve recovery flow

  return <>{children}</>;
}
```

Every new page in §2 (`buscar`, `leads/[id]`, `redesenhar`, `editor`, `proposta`) inherits this automatically — zero repeated guard code, and it closes a second, related gap noticed while reading the existing code: today `/painel` checks *session presence* but never *subscription status*, so a canceled subscriber with a still-valid cookie keeps access indefinitely. Worth fixing in the same pass since the layout file is being created anyway.

**No migrations tracked:** see §1.3 — treat as Build Order step 0, not a parallel-track cleanup item. Every table in §1.2 is written as a tracked migration from the start; there is no "add tables now, backfill migrations later" path here, because that just reproduces the exact debt `CONCERNS.md` flags, at 5x the surface area.

---

## 5. Build Order

**Dependency chain, answering the specific questions posed:**

```
[0] Foundation (blocks everything below)
    ├── supabase/migrations/ baseline + tracked migrations for all new tables (§1.3)
    └── app/painel/layout.tsx shared auth+status guard (§4)
         │
         ▼
[1] Buscar  ──────────────────────────────────────────────────
    app/painel/buscar/page.tsx + app/api/leads/search/route.ts
    lib/google-places/client.ts, lib/quota.ts
    Depends on: [0] only. No dependency on any other feature.
         │
         ▼ (produces `leads` rows — required input for everything after)
[2] Redesenhar ───────────────────────────────────────────────
    app/painel/leads/[id]/redesenhar/page.tsx + app/api/redesigns/generate/route.ts
    lib/ai/client.ts, lib/ai/generate-redesign.ts, lib/storage/assets.ts
    Depends on: [1] (needs a `leads` row as generation input).
    THIS is where the `redesigns.content` jsonb shape gets decided —
    that decision is load-bearing for both [3] and [4] below.
         │
         ├──────────────────────┬─────────────────────────────
         ▼                      ▼
[3] Editor                [4] Publicar
    app/painel/…/editor       app/api/redesigns/[id]/publish
    PATCH content jsonb       public_slug + is_public + view (§3)
    Depends on: [2]'s         Depends on: [2]'s content schema
    content schema only       ONLY — does NOT depend on [3].
                               An unedited AI-generated redesign
                               can be published as-is.
    │                              │
    └──────────┬───────────────────┘
               │  [3] and [4] can be built in PARALLEL — neither
               │  blocks the other, both only need [2]'s schema frozen.
               ▼
[5] Proposta ─────────────────────────────────────────────────
    app/api/messages/generate/route.ts + send-email route
    Depends on: [1] (lead problems to cite) at minimum.
    The message SHOULD embed the public demo link (`redesigns.public_slug`)
    per the product's own pitch logic ("before/after" sell) — so while the
    generation *mechanism* only strictly requires [2], shipping a proposta
    that is actually useful requires [4] to exist first. Build [5] last,
    after [4], even though its API code has no hard technical dependency
    on it — the dependency is product-logic, not code-level.
```

**Direct answers to the posed sequencing questions:**

- *Does proposta need publicar to exist first?* Not technically (message generation only needs `leads` + `redesigns`), but **practically yes** — the message's core value proposition is "here's your new site," which requires a live public URL. Sequence `publicar` before `proposta` even though nothing forces it at the type/schema level.
- *Does editor block publicar?* **No.** They share a dependency (redesenhar's `content` schema) but not each other. Publishing an AI-generated, un-edited redesign is a valid v1 path; editing is a refinement layer on the same data, buildable in parallel or even after publicar ships.

---

## Anti-Patterns (specific to this codebase, not generic)

### Anti-Pattern 1: Module-scope client instantiation for the new Places/AI clients

**What people do:** `const placesClient = new PlacesClient(process.env.GOOGLE_PLACES_API_KEY)` at the top of `lib/google-places/client.ts`.
**Why it's wrong:** this exact pattern already crashed a production build once (`Resend` constructor, see `CONCERNS.md`) — Next.js's build-time page-data collection imports the module before env vars are guaranteed present (especially on Vercel Preview, which per `INTEGRATIONS.md` has **zero env vars configured**).
**Do this instead:** export a factory function, construct the client inside it, called fresh per request — exactly the shape `lib/supabase/*.ts` already uses.

### Anti-Pattern 2: Admin/service-role client on the public demo route

**What people do:** reach for `lib/supabase/admin.ts` inside `app/demo/[slug]/page.tsx` because it's "simpler, no RLS to fight."
**Why it's wrong:** it's the one route on the internet with no auth check at all — a scoping bug (wrong `WHERE`, missing `is_public` filter) becomes a full cross-tenant data leak instead of a 403. `CONCERNS.md` already names this exact risk class for the existing three admin-client routes; a public route is strictly worse territory for it.
**Do this instead:** anon-key client + RLS policy restricted to `is_public = true` + narrow view (§3) — fails closed by construction.

### Anti-Pattern 3: Treating `redesigns.content` as an implementation detail decided ad hoc during Editor work

**What people do:** build Redesenhar first with a loose/whatever-shape jsonb, then discover during Editor that the shape doesn't support field-level editing, then discover during Publicar that the shape doesn't cleanly render.
**Why it's wrong:** three features (redesenhar, editor, publicar) all read/write the same `content` column — an undocumented, evolving shape means each feature's implementation silently depends on tribal knowledge of the current shape.
**Do this instead:** freeze the `content` jsonb shape (a typed `type RedesignContent = {...}` in a shared `lib/ai/` or `types/` location) as part of Phase [2]'s plan, before writing Editor or Publicar code.

---

## Sources

- `.planning/codebase/ARCHITECTURE.md`, `STRUCTURE.md`, `CONCERNS.md`, `STACK.md`, `INTEGRATIONS.md`, `CONVENTIONS.md` — direct codebase analysis, 2026-07-07
- `.planning/PROJECT.md` — milestone scope, feature list, referenced business-model spreadsheet
- `package.json` — confirms Next.js 16.2.10, React 19.2.4, Supabase JS 2.110.1, no ORM/queue/AI SDK yet installed

---
*Architecture research for: prospector-panel / Hunter of Bad Pages — Buscar/Redesenhar/Editor/Publicar/Proposta milestone*
*Researched: 2026-07-07*
