---
phase: 02-redesenhar
plan: 01
subsystem: redesigns
tags: [ai-gateway, gemini, supabase-storage, microlink, react-compare-slider]

requires:
  - phase: 01-buscar
    provides: "leads table + lib/quota.ts + lib/google-places/client.ts"
provides:
  - "types/redesign-content.ts — shape congelado de redesigns.content (facts/generated/photos)"
  - "lib/ai/generate-redesign.ts — geração de copy via AI Gateway (Gemini Flash)"
  - "lib/storage/assets.ts — re-hospeda fotos do Places / screenshots no Supabase Storage"
  - "lib/screenshot.ts — captura 'antes' via Microlink (sem chave)"
  - "app/api/redesigns/generate/route.ts, app/painel/leads/[leadId]/redesenhar/*"
  - "supabase/migrations/20260708130000_redesigns.sql (redesigns + bucket redesign-assets)"
affects: [03-editor, 04-publicar]

tech-stack:
  added: [ai, zod, react-compare-slider]
  patterns:
    - "generateObject (AI SDK) chamado direto, sem factory — não instancia client com estado no module scope, então Anti-Pattern 1 (ARCHITECTURE.md) não se aplica aqui"
    - "Fotos do Places NUNCA viram <img src> direto com a API key na URL — sempre baixadas server-side e re-hospedadas no Supabase Storage antes de qualquer render (nem client, nem futuramente a demo pública)"
    - "content jsonb com separação estrutural facts/generated — sem campo de horário/preço/certificação/depoimento existir no schema, não só 'sem preencher'"

key-files:
  created:
    - types/redesign-content.ts
    - lib/ai/generate-redesign.ts
    - lib/storage/assets.ts
    - lib/screenshot.ts
    - app/api/redesigns/generate/route.ts
    - app/painel/leads/[leadId]/redesenhar/page.tsx
    - app/painel/leads/[leadId]/redesenhar/generate-button.tsx
    - app/painel/leads/[leadId]/redesenhar/comparator.tsx
    - app/painel/leads/[leadId]/redesenhar/redesign-preview.tsx
    - supabase/migrations/20260708130000_redesigns.sql
  modified: [lib/google-places/client.ts, app/painel/buscar/page.tsx]

key-decisions:
  - "Screenshot 'antes' via API gratuita da Microlink (sem chave), não Puppeteer/Playwright self-hosted — segue STACK.md (Chromium num Vercel Function estoura limite de tamanho, cold start 3-8s)"
  - "Sem 'logo' dedicado: Places API não distingue logo de foto comum — content.photos.logoUrl fica null por padrão, UI cai pra monograma tipográfico (skill redesign-premium regra 2: nunca inventar logo)"
  - "Preview do redesign usa template neutro (não a paleta Signal Ledger do painel, nem a paleta real do negócio — essa exigiria scraping do site original, fora do escopo desta fase)"
  - "AI Gateway via string de modelo direta ('google/gemini-2.5-flash'), sem SDK de provider separado — não precisa de factory function porque generateObject não instancia um client com estado"
  - "campo 'telefone' em content.facts fica sempre null nesta fase — Places New API tem nationalPhoneNumber num tier de campo separado, não incluído no field mask atual (mesma disciplina de custo da Fase 1); registrado como gap conhecido, não bug"

patterns-established:
  - "Todo asset binário (foto, screenshot) passa por lib/storage/assets.ts antes de ser referenciado em qualquer conteúdo — nunca URL direta de API externa com chave embutida"

requirements-completed: [REDESENHAR-01, REDESENHAR-02, REDESENHAR-03, REDESENHAR-04]
requirements-partial: []

duration: ~1h
completed: 2026-07-08
---

# Phase 2: Redesenhar Summary

**Geração de landing page por IA (Gemini via AI Gateway) a partir de um lead salvo, com schema `content` jsonb congelado (fato vs. gerado), fotos do Places re-hospedadas no Storage, screenshot "antes" via Microlink, e comparador visual — tudo implementado como uma unidade, sem separação em dois planos, seguindo o mesmo padrão de velocidade da Fase 1.**

## Performance

- **Duration:** ~1h
- **Completed:** 2026-07-08
- **Files:** 10 criados, 2 modificados

## Accomplishments

- Shape `RedesignContent` congelado ANTES de qualquer código de Editor/Publicar (Anti-Pattern 3 do ARCHITECTURE.md evitado por construção)
- Prompt de geração com lista explícita de proibições (nunca horário/preço/certificação/depoimento) em vez de confiar em "bom senso" do modelo — REDESENHAR-02 aplicado no nível do prompt, não só do schema
- Fotos do Places baixadas server-side e re-hospedadas no Supabase Storage — a API key do Places nunca chega a um `<img src>` renderizado
- Comparador antes/depois funcional com `react-compare-slider`, degradando com um placeholder honesto quando o lead não tem site próprio (sem screenshot possível)
- Reaproveitou 100% a infraestrutura da Fase 1 (`lib/quota.ts`, `lib/google-places/client.ts`, `lib/auth-guard.ts`) sem duplicar nada

## Deviations from Plan

Não havia PLAN.md prévio — implementação direta a pedido do usuário, mesmo padrão da Fase 1. 02-01/02-02 do ROADMAP.md original viraram uma única unidade de trabalho.

## Issues Encountered

- **Migration `20260708130000_redesigns.sql` não aplicada no banco real** — mesmo bloqueio já registrado na Fase 1 (MCP do Supabase sem acesso ao projeto `bhiggyigsrqfabqhutne`).
- **`AI_GATEWAY_API_KEY` ausente em `.env.local`** — a geração vai falhar em `npm run dev` local até essa variável existir. Em produção (Vercel) funciona sem configuração extra via OIDC.
- Nenhum bug de runtime encontrado durante o smoke-test desta vez (a lição da Fase 1 sobre `user!.id` foi aplicada preventivamente em `redesenhar/page.tsx` desde o início).

## User Setup Required

- Aplicar `20260708120000_leads_and_usage.sql` E `20260708130000_redesigns.sql` no projeto Supabase real.
- Adicionar `AI_GATEWAY_API_KEY` em `.env.local` (pegar em vercel.com → time → AI Gateway) para testar geração localmente.
- Confirmar que o bucket `redesign-assets` foi criado como público (a migration faz isso via `insert into storage.buckets`, mas vale checar no dashboard após aplicar).

## Next Phase Readiness

- `types/redesign-content.ts` é a base que a Fase 3 (Editor) vai editar por campo e a Fase 4 (Publicar) vai renderizar publicamente — shape já congelado, não deve mudar sem migração de dados.
- `lib/storage/assets.ts` já está pronto pra Fase 4 reusar (a demo pública vai servir as mesmas URLs de Storage, não precisa de rota nova de imagem).
- Bloqueios conhecidos (migration + AI_GATEWAY_API_KEY) — sem eles, Fase 2 não roda contra dados reais, mesmo compilando e com build limpo.

---
*Phase: 02-redesenhar*
*Completed: 2026-07-08*
