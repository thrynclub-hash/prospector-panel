---
phase: 05-proposta
status: human_needed
verified_at: 2026-07-08
verifier: automated-code-audit
---

# Phase 5 (Proposta) Verification

Phase goal: "Assinante recebe um texto de proposta pronto, citando os problemas reais do site antigo, sem risco de reincidir em spam."

All 6 plans' `must_haves` were checked against the real, current source files (not against the plans' or summaries' own claims). `npm run build` was run fresh and passes. No gaps were found between what the plans claim and what the code actually does. Status is `human_needed` only because real end-to-end proposal generation requires `AI_GATEWAY_API_KEY`/production (same caveat every plan's own `success_criteria` already flags) and because the migration has not been applied to the live Supabase database yet — both are expected, not defects.

## Must-haves checklist (per plan)

### 05-01 — Places phone field (PROPOSTA-02 support)
- ✓ `lib/google-places/client.ts`: `internationalPhoneNumber` added to `PRO_TIER_FIELD_MASK` (line 28), `DETAILS_FIELD_MASK` (line 41), and `PlaceResult` interface (line 54). Billing comment updated with the Enterprise-tier caveat (lines 10-17).
- ✓ `app/api/redesigns/generate/route.ts:87`: `phone: details.internationalPhoneNumber ?? null` — no more hardcoded `null`.

### 05-02 — proposals + contacted_businesses schema (PROPOSTA-01, PROPOSTA-04)
- ✓ `supabase/migrations/20260708150000_proposals_and_suppression.sql` exists with exactly the specified content.
- ✓ `proposals`: `unique(redesign_id)` (line 13), RLS enabled, select/insert/update policies scoped to `auth.uid() = user_id` (lines 27-29), no delete policy.
- ✓ `contacted_businesses`: no `user_id` ownership column (`place_id` is PK, line 39); `contacted_by_user_id` is metadata only.
- ✓ RLS: `select ... to authenticated using (true)` (line 57-60), `insert ... to authenticated with check (contacted_by_user_id = auth.uid())` (line 66-69). **No policy at all for `anon`** — confirmed by grep, only `grant execute ... to anon` on the function (line 108). No `anon` select/update grant on the table.
- ✓ `opt_out_business(token)`: `security definer`, does `where cb.opt_out_token = token` inside the function body (line 102), not in a policy predicate. Idempotent via `coalesce(cb.opted_out_at, now())` (line 101).
- ✓ Column-level grant excludes `opt_out_token` from the `authenticated` select list (line 114).

### 05-03 — proposal copy generation (PROPOSTA-01)
- ✓ `lib/proposal/detect-problems.ts`: pure function, 3 branches (no website / low PageSpeed with score interpolated into the string / generic "pode ser modernizado"). Confirmed a PageSpeed 30 and PageSpeed 90 lead produce different strings (only <50 triggers the specific sentence, and the score value itself is embedded, so different scores <50 also differ).
- ✓ `lib/ai/generate-proposal.ts`: single `generateObject` call producing `emailSubject`/`emailBody`/`whatsappText` in one pass, with explicit "REGRAS INVIOLÁVEIS" banning price and generic checklists in the prompt text.

### 05-04 — proposal route (PROPOSTA-01)
- ✓ POST gates on `redesign.is_public && redesign.public_slug`, returns 409 otherwise (lines 29-31).
- ✓ POST is idempotent: existing proposal (scoped by `redesign_id` + `user_id`) is returned as-is without regenerating (lines 33-42).
- ✓ PATCH updates only the fields present in the body via conditional spread (lines 111-116), scoped by `redesign_id` + `user_id`.
- ✓ AI Gateway errors return JSON with status 502, not a bare 500 (lines 69-73).

### 05-05 — email send + suppression + opt-out (PROPOSTA-03, PROPOSTA-04)
- ✓ `lib/email/proposal.ts` is a standalone function, sender `propostas@toqy.com.br`, distinct from `lib/email/resend.ts`'s `acesso@toqy.com.br`. Includes `List-Unsubscribe` and `List-Unsubscribe-Post` headers plus a visible unsubscribe link in the HTML body.
- ✓ `app/api/redesigns/[id]/proposal/send/route.ts`: suppression check (`contacted_businesses` by `place_id`) happens at lines 58-69, strictly **before** `sendProposalEmail` is called (line 75). The `contacted_businesses` insert (line 92) happens only after the `sendProposalEmail` call completed without throwing — a thrown error returns early (502) before reaching the insert.
- ✓ `app/unsubscribe/[token]/page.tsx`: Server Component, uses `createSupabasePublicClient()` (anon key, no session, no admin), calls `.rpc("opt_out_business", { token })` — no raw `.from("contacted_businesses").update(...)`.
- ✓ `lib/supabase/public.ts`: plain anon-key client, `persistSession: false`, matches the isolation used in Phase 4's public demo pages.

### 05-06 — UI wiring (PROPOSTA-01, 02, 03, 04)
- ✓ `ProposalSection` lives inside `app/painel/leads/[leadId]/redesenhar/page.tsx`, no separate route; only rendered when `redesign` exists (line 115-122 of `page.tsx`, inside the `redesign ? (...)` branch).
- ✓ `!isPublic` branch (lines 114-121 of `proposal-section.tsx`) shows only the "publique primeiro" message — no generate button rendered at all in that state (not merely disabled).
- ✓ WhatsApp button: `{phone && (...)}` (line 189) — absent, not disabled, when `content.facts.phone` is null.
- ✓ Email button: `{publicEmail && (...)}` (line 200) — absent when `lead.public_email` is null; when present but suppressed, `disabled={sending || Boolean(emailBlocked)}` (line 204) with `title={emailBlocked}` and the button label itself shows the blocking reason (line 213) — this is "disabled with message," matching the must-have. WhatsApp is never gated by `emailBlocked`.
- ✓ Two-click confirm: `handleConfirmSend` only proceeds to `fetch(.../send)` on the second call when `confirmingSend` is already `true` (lines 89-93); first click only flips state. Verified structurally identical to `DeleteRedesignButton`'s established two-click pattern (same `onBlur` reset, same conditional class toggle).
- ✓ `page.tsx` queries `public_email` on `leads` (line 26), suppression via `contacted_businesses` by `place_id` (lines 44-48), and the existing `proposals` row keyed by `redesign.id` (lines 51-57) — all three wired into `<ProposalSection>` props (lines 115-122).

No discrepancy was found between any plan's `must_haves.truths`/`artifacts`/`key_links` and the actual file contents.

## Requirement coverage

| Requirement | Covered by | Verified how |
|---|---|---|
| PROPOSTA-01 (proposal text citing real problems, no price) | 05-02 (schema), 05-03 (detection + generation), 05-04 (route), 05-06 (UI) | `detectSiteProblems` reads real `leads.has_own_website`/`pagespeed_score`; prompt forbids price; route persists and UI exposes it |
| PROPOSTA-02 (wa.me-ready text) | 05-01 (phone field), 05-06 (`toWhatsAppLink` + button) | Phone now populated from Places; `toWhatsAppLink` strips non-digits and builds `wa.me/<digits>?text=...`; button only shown when phone exists |
| PROPOSTA-03 (automatic email via Resend) | 05-05 (send route + email lib), 05-06 (confirm-to-send UI) | `sendProposalEmail` really calls Resend; route wires it behind two-click UI confirmation |
| PROPOSTA-04 (cross-subscriber suppression list) | 05-02 (schema + RPC), 05-05 (send route pre-check + post-insert), 05-06 (UI disables email button when suppressed) | `contacted_businesses` has no per-user scoping; send route checks it before Resend and inserts only after success; opt-out only via `security definer` RPC, no anon table access |

All 4 requirements are genuinely satisfied by working code, not just referenced in frontmatter.

## Security re-verification (end-to-end, second pass)

1. **`opt_out_business` RPC does real token comparison in-body, not via RLS**: confirmed — `where cb.opt_out_token = token` is inside the `plpgsql` function body (migration line 102), not a row-security predicate. `app/unsubscribe/[token]/page.tsx` calls it via `supabase.rpc("opt_out_business", { token })` (line 17) — not a raw table update.
2. **`contacted_businesses` has no anon select/update**: confirmed by reading the full migration — the only `anon`-related grant is `grant execute on function opt_out_business(text) to anon` (line 108). No `create policy` targets `anon`, and no `grant select`/`grant update` to `anon` exists on the table.
3. **Send route checks suppression before Resend, inserts into `contacted_businesses` only after success**: confirmed — suppression check at lines 58-69 of `send/route.ts`, `sendProposalEmail` call at line 75 inside a `try`, and the `contacted_businesses` insert at line 92 is unreachable if the `catch` block (lines 81-85) already returned.
4. **Sender identity distinct + `List-Unsubscribe`**: confirmed — `lib/email/proposal.ts` uses `propostas@toqy.com.br`; `lib/email/resend.ts` (magic link) uses `acesso@toqy.com.br`. `List-Unsubscribe` and `List-Unsubscribe-Post` headers present, plus a visible link in the HTML body.
5. **`proposal-section.tsx` hides vs. disables correctly**: confirmed — WhatsApp and email buttons are conditionally rendered (`{phone && ...}`, `{publicEmail && ...}`) i.e. absent when data is missing; only the email button, when data IS present but suppressed, is rendered `disabled` with an explanatory label/title. WhatsApp is never disabled by suppression.
6. **Two-click confirm before send, never automatic on generate**: confirmed — `handleGenerate` (POST `/proposal`) only generates/persists text, never calls `/proposal/send`. `handleConfirmSend` requires `confirmingSend` to already be `true` (i.e., a prior click) before it calls the send endpoint.

No security gaps found on re-verification.

## Build check

`npm run build` (Next.js 16.2.10, Turbopack) run fresh from the working tree: compiled successfully, TypeScript passed, all 16 static/dynamic routes generated including the new `/api/redesigns/[id]/proposal`, `/api/redesigns/[id]/proposal/send`, and `/unsubscribe/[token]` routes. No errors or warnings surfaced.

## Known pending item (not a gap)

`supabase/migrations/20260708150000_proposals_and_suppression.sql` has not yet been applied to the live Supabase project — same manual-SQL-Editor pattern already used for the three prior migrations (Phases 1/2/4). This is expected user action, not a defect in Phase 5's work.

## Why `human_needed` and not `passed`

Everything checkable from static code, schema text, and a real build was verified and is correct. What remains needs a human with a deployed environment and `AI_GATEWAY_API_KEY`/`RESEND_API_KEY` in production:

1. Apply `supabase/migrations/20260708150000_proposals_and_suppression.sql` via the Supabase SQL Editor (same as the prior 3 migrations).
2. On a real lead with a public phone number: generate a redesign (Plan 05-01's phone population), confirm `content.facts.phone` is non-null.
3. Publish the redesign, then click "Gerar proposta" on `/painel/leads/[leadId]/redesenhar` — confirm the email/WhatsApp text actually cites the specific detected problem (not a generic phrase) and contains no price.
4. Confirm "Enviar por WhatsApp" only appears when phone exists, and opens a `wa.me` link with the WhatsApp text pre-filled.
5. Click "Enviar por e-mail" once (button should ask "Confirmar envio?"), click again — confirm the email actually arrives via Resend with the `propostas@toqy.com.br` sender and a working unsubscribe link.
6. Immediately after that first successful send, refresh the page and confirm the email button is now visibly disabled with "Já contatado por e-mail...".
7. Click the unsubscribe link from the received email — confirm the `/unsubscribe/[token]` page shows the success message, and clicking it a second time shows "Pedido já registrado" instead of erroring.
8. As a second (different) subscriber account, save the same business as a lead and confirm the email button also shows as suppressed for them (cross-subscriber enforcement).
