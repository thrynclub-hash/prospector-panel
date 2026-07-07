# Architecture

**Analysis Date:** 2026-07-07

## Pattern Overview

**Overall:** Next.js App Router monolith — Route Handlers as the API layer, Server Components + `"use client"` islands for UI, Supabase as the only backend service.

**Key Characteristics:**
- No separate backend — Route Handlers under `app/api/*` are the entire server-side surface
- Stateless request handling — no in-memory or file-based state, everything durable lives in Supabase
- Passwordless auth as the spine — nearly every flow (webhook, login, thank-you page) ends in "generate a magic link and email it"
- Very thin — this is still scaffolding (auth + billing plumbing), not the product itself yet

## Layers

**Route Handlers (`app/api/*/route.ts`):**
- Purpose: all server-side logic — webhook ingestion, access checks, link issuance
- Contains: `kiwify/webhook`, `send-login-link`, `access-status`
- Depends on: `lib/supabase/admin.ts` (service-role client), `lib/email/resend.ts`
- Used by: Kiwify (webhook), client pages (`fetch()` from `login`, `obrigado`)

**Auth Callback (`app/auth/callback/route.ts`):**
- Purpose: exchanges the magic-link code for a session, then redirects into `/painel`
- Depends on: `lib/supabase/server.ts` (cookie-bound client)
- Used by: the link inside the magic-link email

**Pages (`app/*/page.tsx`):**
- Purpose: UI. `login` and `obrigado` are client components that call the Route Handlers above; `painel` is a Server Component that reads the session directly
- Depends on: `lib/supabase/server.ts` (painel) or `fetch()` to own API (login/obrigado)

**Data Access (`lib/supabase/*.ts`):**
- `admin.ts` - service-role client, bypasses RLS, used only inside Route Handlers for privileged operations (create user, query by email, generate links)
- `server.ts` - cookie-bound client for Server Components/Route Handlers that need the *current user's* session (respects RLS)
- `client.ts` - browser client — declared but **not currently imported anywhere** (no client component reads/writes Supabase directly yet)

**Email (`lib/email/resend.ts`):**
- Purpose: single function, `sendMagicLinkEmail()`, wraps Resend send call with the hardcoded HTML template
- Recently fixed to lazy-instantiate `Resend` inside the function (was module-scope, crashed builds — see CONCERNS.md history)

## Data Flow

**Purchase → Account → Login (the only fully-built flow):**

1. Customer buys on Kiwify → Kiwify POSTs to `/api/kiwify/webhook?secret=...`
2. Handler validates secret, checks `order_status === "paid"`
3. Looks up `prospector_customers` by email (idempotency check)
4. New customer → `admin.auth.admin.createUser()` + insert into `prospector_customers` (`status: "active"`). Repeat customer → just updates `status`/`kiwify_order_id`
5. `admin.auth.admin.generateLink({ type: "magiclink" })` → gets a one-time action link
6. `sendMagicLinkEmail()` fires the email (failure here is swallowed — account still gets created)
7. User clicks the email link → `/auth/callback?code=...` → `exchangeCodeForSession()` → redirect to `/painel`
8. `/painel` (Server Component) reads `supabase.auth.getUser()`; redirects to `/login` if absent

**Self-serve re-entry (`/obrigado` and `/login`):**
- `/obrigado`: user re-enters purchase email → `POST /api/access-status` (checks `prospector_customers.status`) → if active, `POST /api/send-login-link` → same magic-link path as above
- `/login`: same as `/obrigado`'s second step, but skips the access-status check (send-login-link itself re-validates `status === "active"`)

**State Management:**
- No client-side state management library. Each page owns local `useState` for its own form flow.
- Server-side "state" is entirely the Supabase `prospector_customers` table + Supabase Auth's own user table.

## Key Abstractions

**Route Handler = single responsibility endpoint:**
- Purpose: each `route.ts` does exactly one thing (webhook, status check, link send)
- Examples: `app/api/access-status/route.ts`, `app/api/send-login-link/route.ts`
- Pattern: no shared controller/service layer — logic lives directly in the handler, Supabase admin client is instantiated fresh per call (function-scoped, not module-scoped — this is the correct pattern, see CONCERNS.md for the one place it was violated)

**Supabase client factories, not singletons:**
- Purpose: every `lib/supabase/*.ts` file exports a *function* that constructs a client, never a shared instance
- Rationale: request-scoped cookies (server.ts) and lazy env-var reads (admin.ts) both need fresh construction per call — this is the pattern to follow for any new integration (e.g. a future Google Places client should follow the same "factory function, not module constant" shape)

## Entry Points

**Kiwify webhook:**
- Location: `app/api/kiwify/webhook/route.ts`
- Triggers: external POST from Kiwify on any order event
- Responsibilities: full "purchase → account → email" flow

**Magic-link callback:**
- Location: `app/auth/callback/route.ts`
- Triggers: user clicking the emailed link
- Responsibilities: session exchange + redirect

**`proxy.ts` (Next.js Middleware):**
- Location: repo root `proxy.ts`
- Triggers: every request except static assets (see matcher)
- Responsibilities: refresh the Supabase session cookie so it doesn't expire mid-session

## Error Handling

**Strategy:** Try/catch inside each handler, `console.error` + typed JSON error response. No centralized error handler or middleware-level catch.

**Patterns:**
- Kiwify webhook wraps its entire body in one top-level try/catch → 500 on any uncaught error
- Other handlers check specific failure points individually (`if (error) {...}`) rather than wrapping in try/catch
- Client pages use a `status`/`step` state enum (`"idle" | "loading" | "sent" | "error"`) to reflect fetch outcomes in the UI — no toast library, just inline conditional rendering

## Cross-Cutting Concerns

**Logging:** `console.error` only, prefixed with the route name (e.g. `"Kiwify webhook: erro buscando cliente"`). No structured logging, no log aggregation.

**Validation:** Manual, ad-hoc — e.g. `typeof email !== "string"` checks. No schema validation library (no Zod/Yup anywhere).

**Authentication:** Supabase session cookie, refreshed by `proxy.ts` on every request; `/painel` is the only route that actually gates on `user` presence today (future protected routes must repeat this same `redirect("/login")` pattern since there's no shared auth guard/HOC yet).

---

*Architecture analysis: 2026-07-07*
*Update when major patterns change*
