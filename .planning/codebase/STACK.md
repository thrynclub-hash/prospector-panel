# Technology Stack

**Analysis Date:** 2026-07-07

## Languages

**Primary:**
- TypeScript 5.x - All application code (strict mode, per `tsconfig.json`)

**Secondary:**
- CSS (Tailwind v4 `@theme` tokens) - `app/globals.css`

## Runtime

**Environment:**
- Node.js (Next.js 16.2.10 requirements) - no `.nvmrc` present, assume current LTS
- Browser runtime for client components (`"use client"` pages)

**Package Manager:**
- npm - `package-lock.json` present

## Frameworks

**Core:**
- Next.js 16.2.10 (App Router, Turbopack) - full-stack framework, both UI and API routes
- React 19.2.4 / react-dom 19.2.4

**Testing:**
- None configured. No test runner, no test files anywhere in the repo.

**Build/Dev:**
- Turbopack (Next.js built-in bundler, used for both `next dev` and `next build`)
- TypeScript compiler (`tsc` via `next build`'s type-check step)
- ESLint 9 with `eslint-config-next` - `eslint.config.mjs`
- Tailwind CSS 4 via `@tailwindcss/postcss`

## Key Dependencies

**Critical:**
- `@supabase/supabase-js` 2.110.1 - database + auth (admin/service-role client)
- `@supabase/ssr` 0.12.0 - cookie-based Supabase auth for Server Components/Route Handlers/proxy
- `resend` 6.17.1 - transactional email (magic link delivery)
- `lucide-react` 1.23.0 - icon set used across all pages

**Infrastructure:**
- None beyond the above — no ORM, no separate HTTP client, no state management library. Data access is direct Supabase client calls inside route handlers.

## Configuration

**Environment:**
- `.env.local` (gitignored) - all runtime config
- Required vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_PLACES_API_KEY`, `RESEND_API_KEY`, `KIWIFY_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL`
- `.env.local.example` documents the shape (check it stays in sync when adding new vars)
- `GOOGLE_PLACES_API_KEY` is already provisioned but **not yet used anywhere in code** — reserved for the prospecting feature

**Build:**
- `next.config.ts` - currently empty/default (no custom config yet)
- `tsconfig.json` - path alias `@/*` → repo root
- `postcss.config.mjs` - Tailwind v4 plugin only

## Platform Requirements

**Development:**
- Any platform with Node.js; Windows confirmed working (this session)
- No local DB/Docker needed — Supabase is fully remote (shared project "Marusso Projetos")

**Production:**
- Vercel (project linked: `prj_tQw0LCaOx7yErAE9Ob1GY3wsEQWS`, org `team_nMIHLOc4HSj0Fme3dW3fP1iS`)
- Env vars currently configured only for the **Production** environment in Vercel (not Preview/Development) — see INTEGRATIONS.md

---

*Stack analysis: 2026-07-07*
*Update after major dependency changes*
