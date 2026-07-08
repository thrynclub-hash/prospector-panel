# Phase 5: Proposta - Research

**Researched:** 2026-07-08
**Domain:** Outreach message generation (AI copy, structured dual-format output) + Resend transactional email with suppression/opt-out + `wa.me` deep links, on top of this project's existing Next.js 16 / Supabase / Vercel AI SDK stack
**Confidence:** HIGH (all findings grounded directly in this repo's current code, migrations, and prior-phase research docs; one external fact — Places API field-to-SKU mapping — verified via Google's own docs today)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Conteúdo e tom da proposta:**
- Tom de oportunidade construtiva, nunca "seu site está ruim" (PITFALLS.md Pitfall 6).
- Citar só os problemas que se aplicam a esse lead específico (ex.: site com PageSpeed baixo ≠ "sem site"). Nunca checklist fixo genérico.
- Menciona o link público `/demo/[slug]` explicando o que é — reforça o disclaimer já existente na página pública (Fase 4).
- Personalização: nome do negócio + cidade/bairro, só com dados já disponíveis via `facts`/Place Details, sem exigir dado que o produto não coleta.
- Referência de estrutura/tom: skill `proposta-email` (`~/.claude/skills/proposta-email/SKILL.md`) — sem preço, rapport real e verificável, defeito com delicadeza, "a entrega é o argumento", CTA leve, 120-180 palavras.

**Fluxo WhatsApp vs E-mail:**
- Um botão único gera os dois formatos (WhatsApp + e-mail) de uma vez, a partir do mesmo conteúdo-base.
- Envio do e-mail via Resend NUNCA é automático sem revisão: gera → mostra preview → assinante confirma explicitamente pra disparar.
- Botão de WhatsApp abre `wa.me` já com o número do lead preenchido (`redesigns.content.facts.phone`) + texto da proposta.
- Se faltar o dado de contato de um canal (`facts.phone` nulo ou `leads.public_email` nulo), esconde o botão daquele canal — nunca desabilitado. Se faltarem os dois, só o texto pra copiar manualmente.

**Lista de supressão e opt-out:**
- Chave: `place_id` (único dado do Places permitido a persistir indefinidamente).
- Todo e-mail automático efetivamente enviado via Resend marca o `place_id` como "contatado" — sem precisar de resposta/reclamação.
- Link de opt-out no e-mail marca `place_id` como "pediu pra não ser contatado", prioridade máxima, não reversível por um assinante comum.
- Rota pública dedicada de opt-out (ex. `/unsubscribe/[token]`), sem login, mesmo padrão de isolamento da Fase 4 (client anon-key, sem sessão nem admin), token não-adivinhável gerado no momento do envio.
- Lead suprimido: UI bloqueia só o botão de e-mail automático (desabilitado, aviso "já contatado"/"pediu pra não receber"). WhatsApp continua liberado (disparo manual, fora do controle do painel).

**Onde a proposta vive no painel:**
- Aba/seção dentro de `/painel/leads/[leadId]/redesenhar` (junto de Editor/Publicar), sem rota separada.
- Exige `is_public=true` (Fase 4) — botão de gerar desabilitado com aviso "publique primeiro" até isso ser verdade.
- Texto persistido na primeira geração, reaproveitado nas próximas visitas (não re-gerado do zero a cada abertura).
- Editável antes de enviar: textarea simples, mesmo padrão do Editor da Fase 3 (sem rich-text).

### Claude's Discretion
- Redação exata/copy da mensagem (dentro do tom acima + skill `proposta-email`).
- Mecanismo técnico exato do token de opt-out (formato, expiração ou não).
- Schema exato da tabela/campo de persistência do texto da proposta e da lista de supressão.
- Texto exato de aviso quando um canal está bloqueado.

### Deferred Ideas (OUT OF SCOPE)
- Distinguir "criar site" (leads sem site próprio) de "redesenhar" (leads com site ruim existente) com rótulo/enquadramento/preço próprios — fora do escopo da Fase 5, anotado no backlog do roadmap.
</user_constraints>

<research_summary>
## Summary

Phase 5 is almost entirely "wire existing pieces together, plus one shared-across-users table" — there is no new library to install (Resend, `nanoid`, `ai`/`zod` are already dependencies and already used in exactly this shape elsewhere in the codebase). The real work is: (1) a deterministic, per-lead "what's actually wrong with this site" fact list (not a vague AI guess) that feeds a `generateObject` call producing `{ emailSubject, emailBody, whatsappText }`; (2) a new `proposals` table (1:1 with `redesigns`) to persist that generated+edited text; (3) a new `contacted_businesses` (suppression) table keyed by `place_id`, which breaks this codebase's until-now-universal "every table is `user_id`-scoped RLS" pattern, because it must be readable/writable across subscribers; (4) a public `/unsubscribe/[token]` page that — unlike Fase 4's public route, which is read-only — needs to perform a public **write**, which is a pattern this codebase hasn't needed yet; (5) a distinct Resend send path (separate `from` identity + `List-Unsubscribe` header) instead of reusing `sendMagicLinkEmail`.

The single most important non-obvious finding: **`redesigns.content.facts.phone` is currently always `null`** — `app/api/redesigns/generate/route.ts` hardcodes it, and neither Places field mask (`lib/google-places/client.ts`) requests `nationalPhoneNumber`/`internationalPhoneNumber`. CONTEXT.md's locked decision to use `facts.phone` for the WhatsApp button is written as if the field already exists ("já existe desde a Fase 2") — it does not contain real data yet. Populating it is a prerequisite this phase must include, not an existing given.

**Primary recommendation:** Build a small pure function (e.g. `detectSiteProblems(lead): string[]`) that turns `leads.has_own_website` + `leads.pagespeed_score` into 1-2 concrete, truthful problem statements, feed those (plus name/city/rating) into one `generateObject` call producing both formats at once, persist the result in a new `proposals` table, and add `nationalPhoneNumber`/`internationalPhoneNumber` to the existing Places field masks so the WhatsApp button has a real number to open.
</research_summary>

<standard_stack>
## Standard Stack

No new packages are needed. Everything Phase 5 requires is already an installed dependency, already used in this exact shape somewhere in the codebase:

| Need | Already-installed package | Existing precedent in this repo |
|------|---------------------------|----------------------------------|
| Structured AI output (proposal copy, 2 formats in 1 call) | `ai@^7.0.17` + `zod@^4.4.3` | `lib/ai/generate-redesign.ts` — `generateObject` + Zod schema, same "flash"-tier model string pattern |
| Transactional email send | `resend@^6.17.1` | `lib/email/resend.ts` — `sendMagicLinkEmail()`, function-scoped `new Resend(...)` (never module-scope, see CONCERNS.md "Known Bugs") |
| Unguessable public token (opt-out link, and reusable for proposal-slug if ever needed) | `nanoid@^5.1.16` | `app/api/redesigns/[id]/publish/route.ts` — `nanoid(12)` for `public_slug` |
| WhatsApp deep link | none — `wa.me` is a plain URL, no SDK | STACK.md explicitly rejected WhatsApp Business Cloud API for this exact reason: "the spec explicitly says 'WhatsApp copy-paste,' which the free `wa.me?text=` link satisfies exactly" |
| Public anon-key Supabase access (no session, no admin) | `@supabase/supabase-js` (already a dep) | `lib/supabase/public.ts` — `createSupabasePublicClient()`, used by `app/demo/[slug]/page.tsx` |

**Installation:** none required.
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### 1. Problem detection must be deterministic, not another AI guess

The existing `badSiteReason` input to `generateRedesignCopy()` (`app/api/redesigns/generate/route.ts:79`) is a two-value string: `"Site próprio com problemas de qualidade/performance"` or `"Sem site próprio"`. That's the wrong granularity for PROPOSTA-01/CONTEXT.md's "citar só os problemas que se aplicam a esse lead específico" — it can't distinguish "PageSpeed 31/100" from "PageSpeed 49/100", and it's the same string regardless of the actual score.

The data needed already exists on `leads` (not on `redesigns`): `has_own_website: boolean`, `pagespeed_score: int | null` (set at search time in `app/api/leads/search/route.ts`, persisted via `app/api/leads/route.ts` POST). Recommended pattern — a pure function, not an AI call:

```typescript
// lib/proposal/detect-problems.ts (new)
export function detectSiteProblems(lead: { hasOwnWebsite: boolean; pagespeedScore: number | null }): string[] {
  if (!lead.hasOwnWebsite) {
    return ["o negócio ainda não tem um site próprio"];
  }
  const problems: string[] = [];
  if (lead.pagespeedScore !== null && lead.pagespeedScore < 50) {
    problems.push(`o site atual tem desempenho baixo no Google PageSpeed (${lead.pagespeedScore}/100 no mobile)`);
  }
  return problems.length > 0 ? problems : ["o site atual pode ser modernizado visualmente"];
}
```

This mirrors the existing `REDESENHAR-02` pattern (`generate-redesign.ts`) of feeding the AI **only verified facts**, never letting it infer the problem itself — same "REGRAS INVIOLÁVEIS" mechanism already established for redesign copy.

### 2. Proposal generation route needs `leads` data the redesign route already has, plus the publish gate

New route, e.g. `app/api/redesigns/[id]/proposal/route.ts` (mirrors `publish/route.ts` exactly in shape: `requireActiveUser()` guard, `params: Promise<{ id: string }>`, ownership check via `.eq("user_id", user.id)`).

Must check, before generating:
- `redesigns.is_public === true` (CONTEXT.md: "Gerar a proposta exige que o redesign já esteja publicado") — same gate `PublishButton` already renders/hides on.
- Idempotency: CONTEXT.md says the text is "persisted on first generation and reused on next visits" — so `POST` should be `INSERT ... ON CONFLICT (redesign_id) DO NOTHING` / check-then-insert, returning the existing row if one exists, exactly like `publish/route.ts` already does for `public_slug` ("Idempotente: se já publicado, devolve o slug existente").

### 3. New table: `proposals` (1:1 with `redesigns`), not a new column on `redesigns`

`redesigns.content` is explicitly **frozen** (`types/redesign-content.ts` header comment: "Shape CONGELADO... mudar isso depois exige migração de dados") and is read/written by both Editor (Fase 3) and Publicar (Fase 4) against that exact shape. Adding proposal fields into `content` would violate that freeze for no benefit — proposal text has a different lifecycle (generated once, edited, sent/not-sent, tracked per-channel) that doesn't belong inside the "generated page" shape.

Recommended schema (new migration file, following the existing `redesigns` migration's comment-heavy style):

```sql
create table if not exists proposals (
  id uuid primary key default gen_random_uuid(),
  redesign_id uuid not null unique references redesigns(id) on delete cascade,
  user_id uuid not null references auth.users(id) default auth.uid(),
  email_subject text not null,
  email_body text not null,
  whatsapp_text text not null,
  email_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table proposals enable row level security;
create policy "proposals_select_own" on proposals for select using (auth.uid() = user_id);
create policy "proposals_insert_own" on proposals for insert with check (auth.uid() = user_id);
create policy "proposals_update_own" on proposals for update using (auth.uid() = user_id);
```

`unique (redesign_id)` gives the idempotent "generate once" behavior for free (INSERT fails on retry → route catches `23505` exactly like `leads` POST already does — `if (error.code === "23505")`).

### 4. New table: `contacted_businesses` (suppression) — breaks the `user_id`-scoped RLS pattern on purpose

Every table in this codebase so far (`leads`, `usage_events`, `redesigns`, `proposals` above) is scoped `user_id`-per-row with RLS `using (auth.uid() = user_id)`. Suppression is structurally different: PROPOSTA-04 requires it to be checked and enforced **across every subscriber**, keyed by `place_id`, with no `user_id` column at all (a business contacted by subscriber A must block subscriber B). This is the first genuinely shared/global table the product needs.

```sql
create table if not exists contacted_businesses (
  place_id text primary key,
  contacted_by_user_id uuid references auth.users(id),
  contacted_via text not null default 'email', -- 'email' | 'opt_out'
  opt_out_token text unique,
  opted_out_at timestamptz,
  created_at timestamptz not null default now()
);

alter table contacted_businesses enable row level security;

-- Every authenticated subscriber needs to check suppression before showing/enabling
-- the e-mail button for ANY lead, not just their own -- this is the "shared" read.
create policy "contacted_businesses_select_all_authenticated"
  on contacted_businesses for select
  to authenticated
  using (true);

-- Insert only happens server-side, right after a Resend send actually succeeds
-- (see route pattern below) -- gate it to authenticated (not anon) since it's
-- triggered from inside a requireActiveUser()-guarded route.
create policy "contacted_businesses_insert_authenticated"
  on contacted_businesses for insert
  to authenticated
  with check (true);
```

The **opt-out update**, however, comes from an unauthenticated visitor (the business owner clicking a link in their inbox) — see pattern 5.

### 5. Public opt-out write: extend the Fase 4 pattern from read-only to a scoped write

Fase 4 established: public routes use `lib/supabase/public.ts` (anon key, no cookies, no admin) plus an RLS policy scoped by an unguessable value (`is_public = true` + `public_slug` known only to whoever has the link). CONTEXT.md explicitly locks this same shape for opt-out ("mesmo padrão de isolamento da Fase 4"). The only difference is Fase 4's policy is `select`-only; opt-out needs `update`. The unguessable `opt_out_token` plays the same role `public_slug` plays for demo pages — knowledge of the token *is* the authorization, exactly like the existing pattern already assumes for `public_slug`.

```sql
-- Anon can update ONLY the opt-out fields, and only by presenting the exact
-- token -- the token is generated with nanoid() at send time and is the sole
-- authorization, same trust model as public_redesigns' public_slug.
create policy "contacted_businesses_public_opt_out"
  on contacted_businesses for update
  to anon
  using (opt_out_token is not null)
  with check (opted_out_at is not null);

grant select, update on contacted_businesses to anon;
```

`app/unsubscribe/[token]/page.tsx` (a **page**, not a route handler — mirrors `app/demo/[slug]/page.tsx`, so it can render a human-readable confirmation, and per Next.js's routing rules a `route.ts` cannot coexist with a `page.tsx` at the same segment anyway):

```typescript
// app/unsubscribe/[token]/page.tsx
import { createSupabasePublicClient } from "@/lib/supabase/public";

export default async function UnsubscribePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = createSupabasePublicClient();

  const { data, error } = await supabase
    .from("contacted_businesses")
    .update({ opted_out_at: new Date().toISOString() })
    .eq("opt_out_token", token)
    .is("opted_out_at", null) // idempotent -- clicking twice doesn't error, doesn't re-set the timestamp
    .select("place_id")
    .maybeSingle();

  // render success/already-done/invalid-token states from `data`/`error`
}
```

(Alternative considered: use the admin/service-role client for this write instead of a new anon RLS policy, on the reasoning that CONCERNS.md already carves out "identity-agnostic" operations — like the Kiwify webhook — as the legitimate use case for the admin client, and an unsubscribe-by-token is structurally the same shape. CONTEXT.md's locked decision explicitly rules this out ("sem admin"), so the anon+RLS approach above is what to build — noted here only so the planner understands *why* a new RLS write-policy shape is being introduced instead of reusing the simpler admin-client precedent.)

### 6. Suppression check gates the UI, not just the send

The email-send route must check `contacted_businesses` (by the lead's `place_id`) before sending, but the CONTEXT.md decision is broader — the **button itself** must be disabled with an explanatory message before the assinante even tries. That means the `redesenhar` page's server component needs one more query alongside the existing `redesign`/`quota` fetch:

```typescript
// in app/painel/leads/[leadId]/redesenhar/page.tsx, alongside existing queries
const { data: suppression } = await supabase
  .from("contacted_businesses")
  .select("contacted_via, opted_out_at")
  .eq("place_id", lead.place_id)
  .maybeSingle();
```

`suppression?.opted_out_at` → "pediu pra não receber" (never reversible by a regular assinante, per CONTEXT.md). `suppression && !suppression.opted_out_at` → "já contatado". Either case disables only the e-mail-send action; WhatsApp stays enabled per the locked decision.

### 7. Distinct Resend send path — do not extend `sendMagicLinkEmail`

PITFALLS.md's Integration Gotchas table is explicit: *"Reusing the existing magic-link Resend integration pattern for cold outreach emails without adding unsubscribe/suppression logic... Build a separate outreach-email code path with unsubscribe header/link, suppression-list check, and sender identification distinct from the transactional magic-link sender."*

```typescript
// lib/email/proposal.ts (new, sibling to lib/email/resend.ts)
import { Resend } from "resend";

export async function sendProposalEmail({
  to, subject, body, unsubscribeUrl,
}: { to: string; subject: string; body: string; unsubscribeUrl: string }) {
  const resend = new Resend(process.env.RESEND_API_KEY); // function-scoped -- CONCERNS.md "Known Bugs"
  await resend.emails.send({
    from: "Hunter of Bad Pages <propostas@toqy.com.br>", // distinct from "acesso@toqy.com.br"
    to,
    subject,
    html: `...${body}...<p><a href="${unsubscribeUrl}">Não quero mais receber contatos como este</a></p>`,
    headers: { "List-Unsubscribe": `<${unsubscribeUrl}>` }, // RFC 8058 one-click header, Resend passes headers through
  });
}
```

### 8. Single `generateObject` call produces both formats at once

CONTEXT.md: "Um botão único gera os dois formatos... a partir do mesmo conteúdo-base." Mirrors the existing `generateRedesignCopy()` shape exactly — same model tier, same "REGRAS INVIOLÁVEIS" grounding-facts pattern:

```typescript
// lib/ai/generate-proposal.ts (new)
import { generateObject } from "ai";
import { z } from "zod";

const MODEL = "google/gemini-2.5-flash"; // same tier as generate-redesign.ts

const ProposalSchema = z.object({
  emailSubject: z.string().describe("Assunto específico, sem cara de marketing"),
  emailBody: z.string().describe("120-180 palavras, sem preço, CTA leve"),
  whatsappText: z.string().describe("Versão curta adaptada para WhatsApp, mesmo conteúdo-base"),
});

export async function generateProposalCopy(input: {
  name: string; city: string | null; rating: number | null; userRatingCount: number | null;
  problems: string[]; demoUrl: string;
}) {
  const { object } = await generateObject({
    model: MODEL,
    schema: ProposalSchema,
    prompt: `... (rapport real: nota/avaliações) ... (problema, com delicadeza: ${input.problems.join("; ")}) ... (entrega: ${input.demoUrl}) ... SEM PREÇO. Tom de oportunidade, nunca "seu site está ruim".`,
  });
  return object;
}
```

### 9. UI placement: extend the existing `redesenhar` page, follow `EditorForm`/`PublishButton` component shape

CONTEXT.md: lives in `/painel/leads/[leadId]/redesenhar`, editable via plain `<textarea>` (no rich-text, same as Fase 3's `EditorForm`). A new `proposal-section.tsx` client component follows the exact shape already established by `publish-button.tsx` (local `useState` for generated/editable text + loading/copied booleans, `fetch()` to the new route, no external state library — per ARCHITECTURE.md: "No client-side state management library").
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|--------------|-----|
| Sending WhatsApp messages programmatically | Any WhatsApp Business API integration | `https://wa.me/<phone>?text=<encoded>` link, opened via plain `<a href>` | Already the explicit, locked product decision (v1 is copy/paste-and-send, AUTOMACAO-01 defers real API sending to v2); zero cost, zero API, works today |
| "Is this email real" verification for `leads.public_email` | An email-verification API call before allowing send | Nothing — the existing `findPublicEmail()` scrape already only returns emails found live on the business's own site; treat a Resend bounce as the failure signal, not a pre-check | No existing precedent for this in the codebase, and it's out of scope for what PROPOSTA-03 asks for |
| Proposal-generation retry/regeneration UX | A new "regenerate" flow with versioning | Reuse the exact `redesigns` pattern: "Generate → 409 on duplicate → show DELETE-then-regenerate if the assinante wants a new one" is not required by CONTEXT.md (proposal text is meant to stay stable/persisted); if a regenerate button is wanted later, model it after `GenerateButton`'s "gerar de novo cria uma nova versão" — but this is explicitly not required for v1 |
| Suppression check as an AI/fuzzy match on business name | Any name-similarity matching to catch "the same business, slightly different search result" | Exact `place_id` match only | `place_id` is the one Places identifier that's stable and ToS-permitted to persist indefinitely (BUSCA-04); the whole suppression design is already anchored to it by CONTEXT.md's locked decision |
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: `facts.phone` is not actually populated yet — CONTEXT.md assumes it exists, the code doesn't
**What goes wrong:** Planner reads CONTEXT.md's "usa `redesigns.content.facts.phone`, que já existe desde a Fase 2" at face value and builds the WhatsApp button against a field that will always be `null` for every existing and newly-generated redesign.
**Why it happens:** `app/api/redesigns/generate/route.ts:87` hardcodes `phone: null` in the `facts` object, and neither `PRO_TIER_FIELD_MASK` nor `DETAILS_FIELD_MASK` in `lib/google-places/client.ts` requests a phone field from Places at all.
**How to avoid:** Phase 5's plan must include: (a) add `nationalPhoneNumber` and/or `internationalPhoneNumber` to both field masks in `lib/google-places/client.ts`, (b) add `phone` to the `PlaceResult` interface, (c) populate `facts.phone` from `details.internationalPhoneNumber` (preferred — already includes country code, needed for `wa.me`) in `generate/route.ts`. Existing redesigns generated before this change will still have `phone: null` — the "hide the button if data is missing" rule (already a locked CONTEXT.md decision) covers this gracefully for old rows without any backfill needed.
**Warning signs:** A WhatsApp button that always renders in the "hidden, no phone" state during manual testing, for every lead, even ones with a real phone number on Google.

### Pitfall 2: Adding a phone field to the Places request may not be "free" — verify the SKU tier before assuming it is
**What goes wrong:** `lib/google-places/client.ts`'s comment claims the current field mask sits in the "Pro tier ($32/1000)" and warns against ever adding `reviews`/`editorialSummary`/atmosphere fields because that jumps to Enterprise ($35-40/1000). Adding a phone field without checking its tier could silently push cost up.
**Why it happens:** Field-mask billing is "billed at the highest single field requested," so it's easy to assume phone is cheap and not check.
**How to avoid:** Per Google's own Place Data Fields documentation (verified during this research, 2026-07), `nationalPhoneNumber`/`internationalPhoneNumber` are **Enterprise-tier** fields for both Place Details and Text Search — but so are `rating`, `userRatingCount`, and `websiteUri`, which this codebase's field mask **already requests** today. That means (per current Google docs) this project's Places calls are likely already billed at Enterprise tier regardless of the "Pro tier" comment in the code — i.e., adding phone probably does not change the billing tier, because the request is already in the highest bracket due to fields already in use. This is presented with MEDIUM confidence (SKU-to-field mappings shift and the existing code comment already appears out of date relative to current docs) — re-verify against `https://developers.google.com/maps/documentation/places/web-service/data-fields` at implementation time before treating this as certain, and flag the discrepancy with the existing "Pro tier" code comment either way.
**Warning signs:** A surprise increase in the Google Cloud Places API billing line after this phase ships, or (conversely) discovering the "Pro tier" comment was already wrong before this phase touched anything.

### Pitfall 3: Outreach spam/LGPD exposure (PITFALLS.md Pitfall 6) — this phase IS the mitigation, not an afterthought
**What goes wrong:** Shipping the Resend auto-send button before the suppression table and opt-out link exist, "to see it work end to end first."
**Why it happens:** The generation/preview/send UI is the visible, demoable part; suppression is invisible infrastructure that's tempting to defer.
**How to avoid:** PITFALLS.md is explicit: *"the suppression list and opt-out mechanism are structural (need a schema field/table), so must be designed into that phase, not bolted on after complaints arrive."* Treat `contacted_businesses` + the opt-out route as blocking for the Resend-send button, not a follow-up — this is also directly required by PROPOSTA-04's acceptance criterion.
**Warning signs:** A working "send email" button in a PR that doesn't also touch a suppression table.

### Pitfall 4: Reusing `sendMagicLinkEmail`'s sender identity or omitting the unsubscribe header
**What goes wrong:** Copy-pasting the existing Resend call (`from: "Hunter of Bad Pages <acesso@toqy.com.br>"`) for outreach email — mixes transactional (magic link) and cold-outreach sending under the same identity, and skips the `List-Unsubscribe` header entirely since the magic-link path never needed one.
**How to avoid:** New `lib/email/proposal.ts` (or similarly named) file, separate `from` address, `List-Unsubscribe` header + visible in-body link pointing at `/unsubscribe/[token]` — see Architecture Patterns §7.
**Warning signs:** Both magic-link and proposal emails arriving from the same "From" name/address in an inbox; no unsubscribe link/header on the proposal email.

### Pitfall 5: Treating the suppression table like every other table in this codebase (`user_id`-scoped RLS)
**What goes wrong:** Copy-pasting the `leads`/`redesigns` RLS pattern (`using (auth.uid() = user_id)`) onto `contacted_businesses` — this would let each subscriber see/write only their own suppression rows, defeating PROPOSTA-04's entire point ("mesmo por outro assinante").
**How to avoid:** This table has no `user_id` ownership semantics by design — see Architecture Patterns §4 for the actual RLS shape needed (shared `select`/`insert` for `authenticated`, scoped `update` for `anon` via token).
**Warning signs:** A suppressed business still shows the "send email" button as enabled for a *different* subscriber than the one who originally contacted it.

### Pitfall 6: AI generating the "problem" framing directly from the coarse `badSiteReason` string
**What goes wrong:** Reusing `generate-redesign.ts`'s existing `badSiteReason` input (`"Sem site próprio"` / `"Site próprio com problemas de qualidade/performance"`) as the proposal's problem-citation source produces the same two generic sentences for every lead, violating CONTEXT.md's explicit "nunca um checklist fixo genérico" and PROPOSTA-01's "problemas específicos detectados".
**How to avoid:** Build the dedicated `detectSiteProblems()` function (Architecture Patterns §1) reading `leads.pagespeed_score` directly, not the redesign's `badSiteReason` string.
**Warning signs:** Two different leads (one with PageSpeed 12, one with PageSpeed 48) get near-identical proposal text.

### Pitfall 7: Testing the Resend send path locally without production env vars
**What goes wrong:** `RESEND_API_KEY` (and all other secrets) are confirmed (INTEGRATIONS.md) to be set on Vercel's **Production** environment only — not Preview, not Development. A local `npm run dev` test of the new send route will fail unless `.env.local` is populated manually.
**How to avoid:** Not a code fix — just don't lose time debugging "Resend send silently fails locally" as if it were a logic bug; pull/set `RESEND_API_KEY` locally before testing, same constraint that already existed for the magic-link path.
**Warning signs:** `sendProposalEmail` throwing "Missing API key" only in local dev, never in production.
</common_pitfalls>

<code_examples>
## Code Examples

### `wa.me` link construction with Brazilian phone formatting
```typescript
// The phone from Places (internationalPhoneNumber) looks like "+55 11 99999-9999".
// wa.me needs digits only, no "+", no spaces/dashes.
function toWhatsAppLink(internationalPhone: string, text: string): string {
  const digitsOnly = internationalPhone.replace(/\D/g, "");
  return `https://wa.me/${digitsOnly}?text=${encodeURIComponent(text)}`;
}
```

### Conditional channel buttons (locked CONTEXT.md rule: hide, never disable, per missing-contact-data)
```tsx
{content.facts.phone && (
  <a href={toWhatsAppLink(content.facts.phone, proposal.whatsappText)} target="_blank" rel="noopener noreferrer">
    Enviar por WhatsApp
  </a>
)}
{lead.publicEmail && !suppression?.opted_out_at && (
  <button onClick={handleSendEmail} disabled={Boolean(suppression)}>
    {suppression ? "Já contatado" : "Enviar por e-mail"}
  </button>
)}
{!content.facts.phone && !lead.publicEmail && (
  <p className="text-sm text-muted">Sem WhatsApp nem e-mail disponíveis — copie o texto manualmente.</p>
)}
```

### Idempotent insert pattern for `proposals` (mirrors `leads` POST's `23505` handling)
```typescript
const { data: proposal, error } = await supabase
  .from("proposals")
  .insert({ redesign_id: redesignId, user_id: user.id, email_subject, email_body, whatsapp_text })
  .select()
  .single();

if (error?.code === "23505") {
  const { data: existing } = await supabase.from("proposals").select().eq("redesign_id", redesignId).single();
  return NextResponse.json({ proposal: existing });
}
```
</code_examples>

<open_questions>
## Open Questions

1. **Exact Places API billing tier impact of adding phone fields**
   - What we know: Per Google's current Place Data Fields docs, `nationalPhoneNumber`/`internationalPhoneNumber` are Enterprise-tier; so are `rating`/`userRatingCount`/`websiteUri`, which this codebase already requests — meaning the request is likely already Enterprise-billed today, independent of this phase.
   - What's unclear: Whether the existing "Pro tier ($32/1000)" comment in `lib/google-places/client.ts` was ever accurate, or whether Google's tier assignments have shifted since Phase 1 was researched (2026-07-07).
   - Recommendation: Planner/executor should re-check `https://developers.google.com/maps/documentation/places/web-service/data-fields` at implementation time, update the stale code comment regardless of outcome, and not treat this as a blocking cost concern for Phase 5 specifically (it's a pre-existing Phase 1 question this phase merely surfaces).

2. **`proposals` 1:1 vs 1:many with `redesigns`**
   - What we know: CONTEXT.md locks "generated once, persisted, reused" — no explicit requirement for history/versioning across multiple redesign regenerations.
   - What's unclear: If a subscriber clicks "Gerar de novo" on the redesign (creating a new `redesigns` row per existing `GenerateButton` behavior — "Gerar de novo cria uma nova versão"), should the old proposal carry over, or does the new redesign need its own fresh proposal?
   - Recommendation: Keep `proposals.redesign_id unique` (1:1 with the specific redesign row, not the lead) — this is consistent with how `redesigns` itself already versions per-generation, and avoids a stale proposal citing a `/demo/[slug]` link tied to an old, possibly-unpublished redesign version.

3. **Opt-out token expiration**
   - What we know: CONTEXT.md leaves this at Claude's discretion.
   - What's unclear: Whether a token should ever expire.
   - Recommendation: No expiration — the token's job is one-time identification of "this specific business, this specific outreach," not session security; the `.is("opted_out_at", null)` idempotency check (Architecture Patterns §5) already makes repeated clicks safe.

4. **Where exactly does `contacted_businesses.contacted_by_user_id` get used, if at all?**
   - What we know: Not required by any locked decision or requirement.
   - What's unclear: Whether the UI ever needs to show "you already contacted this one" vs "another subscriber contacted this one" differently.
   - Recommendation: Store it (cheap, useful for future support/debugging), but the v1 UI treats both cases identically per CONTEXT.md ("já contatado" — no distinction required by user_id).
</open_questions>

<sources>
## Sources

### Primary (HIGH confidence — read directly from this repo)
- `supabase/migrations/20260708120000_leads_and_usage.sql`, `20260708130000_redesigns.sql`, `20260708140000_public_redesigns.sql` — existing schema, RLS patterns, comments explaining prior decisions
- `types/redesign-content.ts` — frozen `content` shape, confirms `facts.phone` is part of the type but never populated
- `lib/supabase/public.ts`, `lib/supabase/admin.ts`, `lib/auth-guard.ts` — client factory patterns
- `lib/email/resend.ts`, `app/api/send-login-link/route.ts` — existing Resend integration to NOT reuse as-is
- `lib/ai/generate-redesign.ts`, `app/api/redesigns/generate/route.ts` — `generateObject` pattern, and the discovery that `facts.phone` is hardcoded `null`
- `lib/google-places/client.ts` — field mask confirms no phone field requested today
- `app/api/leads/search/route.ts`, `lib/leads.ts`, `lib/pagespeed.ts` — confirms `pagespeed_score` is the real signal available for problem-detection
- `app/painel/leads/[leadId]/redesenhar/page.tsx`, `publish-button.tsx`, `editar/editor-form.tsx` — UI component shape to follow
- `.planning/codebase/ARCHITECTURE.md`, `CONVENTIONS.md`, `CONCERNS.md` — established patterns (Route Handlers only, no Server Actions, function-scoped clients, `user_id`-scoped RLS as the norm this phase must deviate from)
- `.planning/research/PITFALLS.md` (Pitfall 6, Pitfall-to-Phase Mapping, Integration Gotchas row on Resend) — spam/LGPD constraints already locked into CONTEXT.md
- `.planning/research/STACK.md` — confirms `wa.me` over WhatsApp Business API, confirms all needed packages already installed, confirms field-mask billing mechanics
- `~/.claude/skills/proposta-email/SKILL.md` — tone/structure reference already summarized into CONTEXT.md's locked decisions
- `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md` — confirms `params` remains Promise-based, confirms `route.ts` cannot coexist with `page.tsx` at the same segment (relevant to the `/unsubscribe/[token]` page-vs-route choice)

### Secondary (MEDIUM confidence)
- Google Place Data Fields SKU mapping (`nationalPhoneNumber`/`internationalPhoneNumber` = Enterprise tier, and `rating`/`userRatingCount`/`websiteUri` also Enterprise) — fetched live from `https://developers.google.com/maps/documentation/places/web-service/data-fields` during this research; flagged as needing re-verification at implementation time since it contradicts this codebase's existing "Pro tier" code comment
</sources>

<metadata>
## Metadata

**Research scope:**
- Core technology: Existing Next.js 16 App Router + Supabase + Vercel AI SDK stack (no new tech)
- Ecosystem: Resend (new send path), Google Places field mask (phone field addition)
- Patterns: RLS design for a cross-subscriber shared table, public-write route (new pattern vs. Fase 4's public-read-only)
- Pitfalls: LGPD/spam (PITFALLS.md Pitfall 6), missing `facts.phone` data, Places SKU tier

**Confidence breakdown:**
- Standard stack: HIGH — zero new dependencies, all precedent already in this repo
- Architecture: HIGH — every pattern grounded in an existing analogous route/table in this codebase
- Pitfalls: HIGH for the codebase-internal findings (facts.phone, badSiteReason granularity, env-var-Production-only); MEDIUM for the external Places SKU tier claim
- Code examples: HIGH — derived directly from existing sibling code in this repo, not generic boilerplate

**Research date:** 2026-07-08
**Valid until:** Codebase-internal findings remain valid until Phase 5 code lands (this research describes a gap, not a moving target). The Places SKU tier claim should be re-verified at implementation time regardless of elapsed time.
</metadata>

---

*Phase: 05-proposta*
*Research completed: 2026-07-08*
*Ready for planning: yes*
