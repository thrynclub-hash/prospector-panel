# Phase 0 Research: Fundação

**Pergunta:** O que preciso saber pra planejar bem o guard de auth+assinatura e o baseline de migrations?
**Confiança:** ALTA — a maior parte já foi resolvida na pesquisa do milestone (`.planning/research/ARCHITECTURE.md` §1.3 e §4), esta pesquisa só confirma o schema real via introspecção direta do banco (não estava disponível na pesquisa de milestone).

## Schema real de `prospector_customers` (via introspecção OpenAPI do PostgREST)

Consultado direto em `GET /rest/v1/` (Supabase, projeto `bhiggyigsrqfabqhutne`) com a service-role key — não é suposição, é o schema exato hoje:

```
prospector_customers
├── id                uuid, PK, default gen_random_uuid(), NOT NULL
├── user_id           uuid, nullable                          -- FK lógica pra auth.users.id, sem constraint FK declarada
├── email              text, NOT NULL
├── kiwify_order_id    text, nullable
├── status             text, default 'active', NOT NULL
├── zapi_instance_id   text, nullable
├── zapi_token         text, nullable
├── zapi_client_token  text, nullable
└── created_at         timestamptz, default now(), NOT NULL
```

Descrição da tabela no banco: *"Compradores do painel Prospector de Sites - acesso liberado via webhook da Kiwify."*

**Achado não esperado:** as colunas `zapi_instance_id`, `zapi_token`, `zapi_client_token` não são usadas em nenhum lugar do código deste projeto (confirmado via grep) — são do ZapFlow (integração Z-API/WhatsApp), sobrando aqui porque o banco Supabase é compartilhado entre produtos. Ver `.planning/codebase/CONCERNS.md`. Este phase NÃO remove essas colunas (fora de escopo — o objetivo é capturar a realidade como baseline, não limpar schema); só registra o achado pra não ser confundido com um erro da migration.

**Não verificado nesta pesquisa** (a introspecção OpenAPI não expõe isso): políticas RLS ativas na tabela, se `user_id` ou `email` têm constraint UNIQUE declarada. O código (`app/api/kiwify/webhook/route.ts`) assume unicidade de `email` via `.maybeSingle()` mas isso é enforced pela lógica da aplicação, não confirmadamente pelo banco. A migration baseline declara `unique (email)` porque é o comportamento que o código já assume — se o banco real não tiver essa constraint, a migration vai *adicionar* uma nova garantia (mudança de comportamento pequena, mas correta pra o que o código já pressupõe). Se isso quebrar (não deveria, dado que a lógica da app já trata email como único), reverter é trivial.

## Guard compartilhado (`app/painel/layout.tsx`)

Já especificado em `.planning/research/ARCHITECTURE.md` §4 com código completo. Resumo da decisão: Server Component em `app/painel/layout.tsx` que:
1. Busca sessão via `createSupabaseServerClient()` (padrão já usado em `app/painel/page.tsx` hoje)
2. Sem sessão → `redirect("/login")`
3. Com sessão mas sem `prospector_customers.status === "active"` → `redirect("/obrigado")` (reaproveita o fluxo de recuperação de acesso self-service que já existe)
4. `app/painel/page.tsx` perde sua checagem de auth inline (fica só a UI) — o layout já protege toda a subárvore

Isso fecha as duas lacunas apontadas em `CONCERNS.md`: hoje `/painel` só checa sessão (não status), e não há guard compartilhado pra reusar nas próximas 5 páginas do roadmap.

## Ferramenta pra migrations

`npx supabase` (CLI v2.109.1) está disponível via npx, mas `supabase db pull`/`link` exigem login interativo + senha do banco — fricção alta pra uma tarefa que já sabemos o schema exato via introspecção. Decisão: escrever a migration SQL manualmente a partir do schema introspectado acima, em vez de rodar `supabase db pull` interativo. Mais rápido e igualmente correto, já que o schema já foi confirmado byte-a-byte.

## Sources

- Introspecção direta: `GET https://bhiggyigsrqfabqhutne.supabase.co/rest/v1/` com service-role key, 2026-07-08
- `.planning/codebase/CONCERNS.md`, `.planning/research/ARCHITECTURE.md` §1.3/§4 (pesquisa de milestone já existente)
- `app/api/kiwify/webhook/route.ts`, `app/painel/page.tsx` (código atual, lido nesta sessão)

---
*Research Phase 0: 2026-07-08*
