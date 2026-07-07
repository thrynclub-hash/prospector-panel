# Coding Conventions

**Analysis Date:** 2026-07-07

## Naming Patterns

**Files:**
- kebab-case directories matching URL segments (`send-login-link`, `access-status`)
- `route.ts` / `page.tsx` fixed names (Next.js App Router requirement)
- Library files: short, purpose-named (`resend.ts`, `admin.ts`, `server.ts`, `client.ts`)

**Functions:**
- camelCase, verb-first for actions (`sendMagicLinkEmail`, `createSupabaseAdminClient`, `handleSubmit`)
- Route Handler exports use HTTP verb names exactly: `POST`, `GET` (Next.js convention)

**Variables:**
- camelCase throughout
- No constants file yet — no `UPPER_SNAKE_CASE` constants observed (magic strings like `"active"`, `"order_approved"` are inlined)

**Types:**
- Inline `type` aliases at the point of use (e.g. `type KiwifyWebhookBody = {...}` at the top of the webhook route) rather than a shared `types/` directory
- No interfaces observed — always `type`

## Code Style

**Formatting:**
- No `.prettierrc` — relies on `eslint-config-next` defaults
- Double quotes for strings (consistent across all files)
- Semicolons required
- 2-space indentation

**Linting:**
- ESLint 9 flat config (`eslint.config.mjs`), extends `next/core-web-vitals` + `next/typescript`
- Run: `npm run lint`
- Not currently run in CI (no CI configured at all)

## Import Organization

**Order:** Not strictly enforced, but observed pattern:
1. Next.js/React imports (`next/server`, `react`)
2. Third-party packages (`resend`, `lucide-react`)
3. Internal `@/` alias imports (`@/lib/supabase/admin`)

**Path Aliases:**
- `@/*` → repo root (only alias defined, in `tsconfig.json`)

## Error Handling

**Patterns:**
- Route Handlers return `NextResponse.json({ error: "..." }, { status: N })` on failure — no thrown custom error classes
- Kiwify webhook wraps everything in one top-level try/catch as a last-resort 500; other routes check `if (error)` per-call instead of try/catch
- Client components use a `status: "idle" | "loading" | "sent" | "error"` (or similar) state enum, never `try/catch` around the actual UI logic beyond the fetch call

**Error Types:**
- No custom Error subclasses anywhere
- Supabase errors are logged (`console.error("<route>: erro <context>", error)`) then translated to a generic `{ error: "Erro interno" }` response — the real Supabase error is never leaked to the client

## Logging

**Framework:** `console.error` only, no logging library.

**Patterns:**
- Format: `console.error("<route name in Portuguese>: <what failed>", error)` — e.g. `"Kiwify webhook: erro buscando cliente"`
- No `console.log` for normal-path tracing — only errors are logged

## Comments

**When to Comment:**
- Sparse, used only for non-obvious rationale — e.g. the comment in `proxy.ts` explaining *why* the session refresh pattern is mandatory (`@supabase/ssr` requirement), or the comment in `resend.ts`'s call site noting the Kiwify webhook mirrors "the same proven pattern from PhotoForge"
- No comments explaining *what* code does — code is expected to be self-explanatory

**JSDoc/TSDoc:** None used.

**TODO Comments:** None found — the one open item (`app/painel/page.tsx`) is expressed as user-facing copy ("🚧 Próximas seções...") rather than a code comment.

## Function Design

**Size:** Small — every function so far is under ~40 lines (the Kiwify webhook `POST` handler is the largest, ~90 lines including whitespace/comments, but linear/no nested abstraction)

**Parameters:**
- Route Handlers take the standard Next.js `Request`/`NextRequest` — no custom parameter objects
- Internal helpers take a single destructured object (`sendMagicLinkEmail({ to, magicLink })`)

**Return Values:**
- Route Handlers always return `NextResponse.json(...)` explicitly — no implicit returns
- Early returns / guard clauses used consistently (validate input → return 400 before doing any work)

## Module Design

**Exports:**
- Named exports for all functions (`export function createSupabaseAdminClient`, `export async function sendMagicLinkEmail`)
- Default exports reserved for React page/layout components only (Next.js requirement)

**Barrel Files:** None — no `index.ts` re-export files anywhere. Every import is a direct path (`@/lib/supabase/admin`, not `@/lib/supabase`).

---

*Convention analysis: 2026-07-07*
*Update when patterns change*
