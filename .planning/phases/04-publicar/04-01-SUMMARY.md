---
phase: 04-publicar
plan: 01
subsystem: public-demo
tags: [rls, anon-client, nanoid, seo]

requires:
  - phase: 02-redesenhar
    provides: "redesigns table (public_slug, is_public, published_at já existiam desde a Fase 2)"
provides:
  - "app/demo/[slug]/page.tsx — rota pública, sem auth, top-level (não sob /painel)"
  - "lib/supabase/public.ts — client anon-key puro, sem cookies/sessão/admin"
  - "supabase/migrations/20260708140000_public_redesigns.sql (view + RLS)"
  - "app/api/redesigns/[id]/publish/route.ts (POST publica, DELETE despublica)"
  - "app/robots.ts (disallow /demo/)"
affects: [05-proposta]

tech-stack:
  added: [nanoid]
  patterns:
    - "Rota pública nunca usa o client de sessão (/painel) nem o client admin/service-role -- só lib/supabase/public.ts (anon key, sem cookies), seguindo ARCHITECTURE.md Anti-Pattern 2"
    - "Defesa em 2 camadas pra RLS pública: view public_redesigns (só colunas seguras, security_invoker=true) + policy explícita is_public=true pro papel anon direto na tabela redesigns -- mesmo se um código futuro consultar a tabela direto, sem passar pela view, RLS ainda barra"
    - "noindex em 2 camadas: robots.txt (app/robots.ts) + meta robots na própria página (generateMetadata) -- alguns crawlers só respeitam um dos dois"

key-files:
  created:
    - supabase/migrations/20260708140000_public_redesigns.sql
    - lib/supabase/public.ts
    - app/api/redesigns/[id]/publish/route.ts
    - app/demo/[slug]/page.tsx
    - app/robots.ts
    - app/painel/leads/[leadId]/redesenhar/publish-button.tsx
  modified: [app/painel/leads/[leadId]/redesenhar/page.tsx]

key-decisions:
  - "security_invoker=true na view public_redesigns -- sem isso, views no Postgres rodam com o privilégio do DONO por padrão, o que bypassaria a RLS da tabela base e anularia a proteção is_public=true inteira"
  - "Slug via nanoid(12), gerado só na publicação (não em algum passo anterior) e reaproveitado se já existir -- despublicar não invalida o link, só desliga is_public"
  - "Banner de aviso é sticky/persistente no topo da página pública (não rodapé/fine-print) -- PITFALLS.md Pitfall 4 trata isso como bloqueante de lançamento, não polish"
  - "generateMetadata busca o nome do negócio pra incluir no <title> ('[Nome] — demonstração não-oficial') -- Pitfall 4 pede que o disclaimer apareça também em snippets de busca/preview de link, não só na página renderizada"

patterns-established:
  - "Toda rota/página fora de /painel e /demo é implicitamente pública -- qualquer nova rota pública futura deve reusar lib/supabase/public.ts, nunca lib/supabase/server.ts (sessão) ou admin.ts"

requirements-completed: [PUBLICAR-01, PUBLICAR-02, PUBLICAR-03, PUBLICAR-04]
requirements-partial: []

duration: ~40min
completed: 2026-07-08
---

# Phase 4: Publicar Summary

**URL pública de demonstração (`/demo/[slug]`) isolada do painel autenticado, com slug não-adivinhável (nanoid), banner de aviso persistente e não-indexação em duas camadas (robots.txt + meta robots) — as quatro exigências de PITFALLS.md Pitfall 4 tratadas como bloqueantes, não polish.**

## Performance

- **Duration:** ~40 min
- **Completed:** 2026-07-08
- **Files:** 6 criados, 1 modificado

## Accomplishments

- Isolamento real: `app/demo/[slug]` nunca toca o client de sessão nem o admin -- só `lib/supabase/public.ts` (anon key, sem cookies)
- RLS em duas camadas (view `security_invoker=true` + policy direta na tabela) -- proteção não depende só da view estar correta
- Slug não-sequencial (`nanoid(12)`), idempotente ao publicar de novo, preservado ao despublicar (link não quebra se religar)
- Disclaimer sticky no topo + noindex duplo (robots.txt E meta tag) + título da página já avisa que é demo não-oficial
- Publicar/despublicar direto na página do redesign, com link copiável

## Deviations from Plan

Nenhuma -- plano original do ROADMAP (`04-01: Rota pública isolada + slug + aviso + noindex`) cobria exatamente o que foi construído.

## Issues Encountered

- Migration `20260708140000_public_redesigns.sql` foi aplicada no banco real pelo usuário via SQL Editor após o fim da fase (view + policies confirmadas com sucesso) -- `/demo/[slug]` já pode ser testado de verdade.

## User Setup Required

Nenhum -- migration aplicada.

## Next Phase Readiness

- `redesigns.public_slug`/`is_public`/`published_at` (já existentes desde a Fase 2) agora têm uso real -- Fase 5 (Proposta) pode linkar o `public_slug` na mensagem de outreach como planejado no ARCHITECTURE.md (Proposta depende de Publicar por lógica de produto, não por schema).
- Gap de qualidade visual do redesign (logo/paleta do site original, identificado na Fase 2/3) continua em aberto -- agora fica ainda mais visível, já que o redesign com qualidade atual pode ser publicado e mostrado a um negócio real.

---
*Phase: 04-publicar*
*Completed: 2026-07-08*
