# External Integrations

**Analysis Date:** 2026-07-07

## APIs & External Services

**Payment Processing:**
- Kiwify - subscription checkout (R$10,97 first charge, then R$19,97/mo recurring, per product decision — not yet encoded in code, Kiwify handles billing itself)
  - Integration method: inbound webhook only, no outbound API calls to Kiwify from this codebase
  - Auth: shared secret `KIWIFY_WEBHOOK_SECRET`, passed as a `?secret=` query param on the webhook URL
  - Endpoint: `app/api/kiwify/webhook/route.ts`

**Local Business Data (provisioned, unused):**
- Google Places API - `GOOGLE_PLACES_API_KEY` is set in `.env.local` but **no code calls it yet**. This is the key for the not-yet-built "Buscar" (prospectar) feature — searching Google Maps for businesses by rating/site quality.

**Email:**
- Resend - transactional email (magic-link delivery only)
  - SDK/Client: `resend` npm package v6.17.1
  - Auth: `RESEND_API_KEY` env var
  - Sender: `Hunter of Bad Pages <acesso@hunterofbadpages.com>` (domain must be verified in Resend dashboard — not confirmed in code)
  - Usage: `lib/email/resend.ts` → `sendMagicLinkEmail()`, called from the Kiwify webhook and from `app/api/send-login-link/route.ts`

## Data Storage

**Databases:**
- PostgreSQL on Supabase (shared project "Marusso Projetos" — same instance is reused across the user's other apps, e.g. ZapFlow)
  - Connection: `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (admin) or `NEXT_PUBLIC_SUPABASE_ANON_KEY` (browser/server session)
  - Client: `@supabase/supabase-js` direct calls, no ORM
  - Known table: `prospector_customers` (columns inferred from code: `id`, `user_id`, `email`, `status`, `kiwify_order_id`) — no migration files in repo, schema lives only in Supabase itself
  - Migrations: none tracked in this repo — schema changes must be made directly in Supabase dashboard/SQL editor and are **not version-controlled**

**File Storage:** None yet.

**Caching:** None.

## Authentication & Identity

**Auth Provider:**
- Supabase Auth, passwordless (magic link only, no password flow at all)
  - Implementation: `@supabase/ssr` for server/proxy, `@supabase/supabase-js` admin client (`auth.admin.generateLink`, `auth.admin.createUser`) for issuing links and provisioning accounts
  - Token storage: httpOnly cookies via `@supabase/ssr`, refreshed on every request in `proxy.ts`
  - Session management: Supabase JWT refresh, no custom session logic

**OAuth Integrations:** None.

## Monitoring & Observability

**Error Tracking:** None (no Sentry or equivalent). Errors are `console.error`-only inside route handlers.

**Analytics:** None.

**Logs:** Vercel's built-in function logs only.

## CI/CD & Deployment

**Hosting:**
- Vercel — Next.js app hosting, project already linked via `.vercel/project.json`
- Deployment: presumably automatic on push to `master` (not verified — no `.github/workflows` in this repo)

**CI Pipeline:** None configured (no GitHub Actions, no test/lint gate before deploy).

## Environment Configuration

**Development:**
- Required env vars: see STACK.md — all present in `.env.local`
- Secrets location: `.env.local` (gitignored)

**Staging:** No staging environment. Vercel Preview deployments exist implicitly (every non-production branch/PR) but **have zero environment variables configured** — see Concerns.

**Production:**
- Secrets management: Vercel project env vars, Production environment only (confirmed via `vercel env ls`: `NEXT_PUBLIC_APP_URL`, `KIWIFY_WEBHOOK_SECRET`, `RESEND_API_KEY`, `GOOGLE_PLACES_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_URL` — all "Production" only, none on Preview/Development)

## Webhooks & Callbacks

**Incoming:**
- Kiwify - `app/api/kiwify/webhook/route.ts` (POST)
  - Verification: shared-secret query param compared with `KIWIFY_WEBHOOK_SECRET` — **not** a cryptographic signature check, just string equality against a query param (see CONCERNS.md)
  - Events handled: `order_approved` / `order_paid` with `order_status === "paid"` — all other events return `{ ok: true, skipped: "not_paid" }`
  - Behavior: idempotent — looks up `prospector_customers` by email first; creates Supabase auth user + customer row on first purchase, just flips `status: "active"` on repeat purchases; always tries to email a fresh magic link (failure here doesn't fail the whole webhook)

**Outgoing:** None.

---

*Integration audit: 2026-07-07*
*Update when adding/removing external services*
