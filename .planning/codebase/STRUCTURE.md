# Codebase Structure

**Analysis Date:** 2026-07-07

## Directory Layout

```
prospector-panel/
├── app/                    # Next.js App Router — pages + API routes
│   ├── api/                # Route Handlers (server-only)
│   │   ├── access-status/  # POST — check if an email has an active subscription
│   │   ├── kiwify/webhook/ # POST — Kiwify purchase webhook
│   │   └── send-login-link/# POST — issue + email a magic link
│   ├── auth/callback/      # GET — magic-link code exchange
│   ├── login/              # Self-serve login page (client component)
│   ├── obrigado/           # Post-purchase "claim your access" page (client component)
│   ├── painel/              # The actual product surface (currently a stub)
│   ├── layout.tsx          # Root layout — fonts, metadata
│   ├── globals.css         # Tailwind v4 theme tokens + base styles
│   └── page.tsx            # Root `/` page (default create-next-app placeholder — unused/unlinked)
├── lib/
│   ├── email/resend.ts     # sendMagicLinkEmail()
│   └── supabase/           # admin.ts, server.ts, client.ts — client factories
├── public/                 # Static assets (default Next.js SVGs, unmodified)
├── proxy.ts                 # Next.js Middleware — Supabase session refresh
├── next.config.ts          # Empty/default
├── .env.local               # Runtime secrets (gitignored)
├── .env.local.example       # Documents required env vars
└── package.json
```

## Directory Purposes

**app/api/:**
- Purpose: all server-side business logic
- Contains: one subdirectory per endpoint, each with a single `route.ts`
- Key files: `kiwify/webhook/route.ts` is the most complex (full account-provisioning flow)
- Subdirectories: flat, one level per endpoint — no nested API versioning

**app/(pages):**
- Purpose: UI screens
- Contains: `login/page.tsx`, `obrigado/page.tsx`, `painel/page.tsx` — each is a standalone page, no shared layout beyond root `layout.tsx`
- Key files: `painel/page.tsx` is the one to grow — it's currently a 35-line placeholder announcing upcoming features

**lib/supabase/:**
- Purpose: the only data-access layer in the app
- Contains: three client factory functions, one per auth context (admin/server/browser)
- Key files: `admin.ts` (privileged), `server.ts` (session-bound, used by Server Components + proxy), `client.ts` (browser — currently unused)

**lib/email/:**
- Purpose: outbound email
- Contains: `resend.ts` only — one function, one email template (magic link)

## Key File Locations

**Entry Points:**
- `app/api/kiwify/webhook/route.ts` - purchase → account → email flow
- `app/auth/callback/route.ts` - magic link redemption
- `proxy.ts` - session refresh middleware, runs on almost every request

**Configuration:**
- `tsconfig.json` - `@/*` path alias → repo root
- `next.config.ts` - default, no custom settings yet
- `.env.local` / `.env.local.example` - all runtime config

**Core Logic:**
- `app/api/*/route.ts` - all business logic
- `lib/supabase/*.ts` - all data access
- `lib/email/resend.ts` - all outbound communication

**Testing:**
- None. No `tests/`, no `__tests__/`, no `*.test.ts` anywhere.

**Documentation:**
- `README.md` - unmodified `create-next-app` boilerplate, does not describe this product
- `CLAUDE.md` → `@AGENTS.md` - warns that this Next.js version has breaking changes vs. training data, points to `node_modules/next/dist/docs/`

## Naming Conventions

**Files:**
- `route.ts` for every API endpoint (Next.js App Router convention, not optional)
- `page.tsx` for every UI route
- kebab-case for multi-word directories (`send-login-link`, `access-status`)
- camelCase for exported functions (`sendMagicLinkEmail`, `createSupabaseAdminClient`)

**Directories:**
- One directory per route segment, matching the URL path exactly (`app/api/access-status/` → `/api/access-status`)

**Special Patterns:**
- `"use client"` directive at the top of any interactive page (`login`, `obrigado`) — Server Components (`painel`, all `route.ts` files) omit it

## Where to Add New Code

**New product feature (e.g. "Buscar" / prospectar):**
- Primary code: new route segment under `app/painel/` (e.g. `app/painel/buscar/page.tsx`) plus a matching `app/api/` handler if it needs server logic (e.g. `app/api/prospectar/route.ts`)
- New external client (Google Places): follow the `lib/supabase/*.ts` pattern — a factory function in `lib/google-places/client.ts`, not a module-scope singleton (see CONCERNS.md for why that matters)
- Tests: none exist yet — if adding a test runner, `*.test.ts` alongside source is the path of least resistance given no existing convention to contradict

**New API route:**
- `app/api/{name}/route.ts`, exporting `POST`/`GET` as needed, following the existing pattern of manual validation + `NextResponse.json()`

**Utilities:**
- No `lib/utils.ts` or shared helpers yet — each route currently duplicates small validation/normalization logic (e.g. `email.trim().toLowerCase()` appears 3 times)

## Special Directories

**public/:**
- Purpose: static assets
- Source: default `create-next-app` SVGs, none replaced with product branding yet
- Committed: Yes

**.next/ (gitignored, not present until first build):**
- Purpose: build output
- Committed: No

---

*Structure analysis: 2026-07-07*
*Update when directory structure changes*
