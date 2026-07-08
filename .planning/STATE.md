# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-07)

**Core value:** O assinante acha um negócio local com site ruim, gera um redesign com comparador antes/depois, e manda uma proposta pronta — tudo dentro do painel.
**Current focus:** Milestone v1.0 completo (7 fases). Próximo: gap de qualidade visual do redesign (logo/paleta do site original) e finalizar testes manuais da Fase 5.

## Current Position

Phase: 7 of 7 — todas completas (Fundação, Buscar, Redesenhar, Editor, Publicar, Proposta, Preços)
Status: Milestone v1.0 100% implementado e deployado em produção. Todas as 4 migrations aplicadas no banco real. Fase 5 (Proposta) tem verificação automatizada `human_needed` — testado manualmente em produção: WhatsApp confirmado funcionando de ponta a ponta (wa.me com número+texto reais), confirmação em dois cliques do e-mail confirmada; ainda faltam testar envio real via Resend, supressão bloqueando reenvio, opt-out, e cross-subscriber (ver `05-proposta/05-VERIFICATION.md`).
Last activity: 2026-07-08 — Fase 6 (Tabela de Preço) completa: `/painel/precos` estática + card na dashboard (que também corrigiu mensagem "🚧 Próximas seções" desatualizada). Ver `06-tabela-de-pre-o/06-01-SUMMARY.md`.

Progress: [██████████] 100% (7/7 fases) — milestone v1.0 completo

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: -
- Total execution time: -

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: -
- Trend: -

*Updated after each plan completion*

## Accumulated Context

### Roadmap Evolution

- Phase 02.1 inserida após a Phase 2: reusar logo, paleta de cores e fotos do site original do lead no redesign gerado (URGENT) — fecha o gap de qualidade visual identificado logo abaixo, confirmado num teste manual real em 2026-07-08.

### Decisions

- **Fase 6**: Sem script de venda ou tratamento de objeções na tela de preço — só os dois valores do requirement (PRECO-01) + uma frase de contexto. Conteúdo além disso violaria AGENT-INTEGRITY (zero invenção sem fonte).
- **Fase 5**: Lista de supressão (`contacted_businesses`) é a primeira tabela do produto sem `user_id` de ownership — de propósito, cross-subscriber (PROPOSTA-04). Opt-out público via função `security definer` (`opt_out_business(token)`) que compara o token dentro do corpo da função, nunca via policy RLS (uma policy `using (opt_out_token is not null)` pareceria certa mas não validaria o token de verdade — ver `05-RESEARCH.md`/`05-VERIFICATION.md`).
- **Fase 5**: `redesigns.content.facts.phone` estava sempre `null` desde a Fase 2 (nunca populado) — corrigido como pré-requisito da Fase 5 (field mask do Places + generate route), não um bug da Fase 2 em si (o campo nunca tinha sido pedido ao Places antes).
- **Fase 4**: RLS pública em 2 camadas (view `public_redesigns` com `security_invoker=true` + policy direta na tabela `redesigns` pro papel `anon`) — nunca confiar só na view.
- **Fase 4**: Rota pública (`app/demo/[slug]`) só usa `lib/supabase/public.ts` (anon key, sem cookies) — nunca o client de sessão nem o admin.
- **Fase 3**: `content.facts` nunca é editável no Editor (só `generated`/`photos`) — a rota PATCH ignora qualquer coisa que o cliente mande pra `facts`, reconstruindo sempre a partir do valor já salvo.
- **Fase 3**: Editor usa inputs/textareas simples em vez de Tiptap (citado no ROADMAP original) — YAGNI, sem necessidade de rich-text pros campos atuais.
- **Gap de qualidade visual identificado (não resolvido ainda)**: o redesign gerado não reusa logo/paleta/fotos do SITE ORIGINAL do lead (só fotos do Google Places) — comparado lado a lado com um site original já bem feito, o redesign atual pode parecer pior visualmente, mesmo tendo conteúdo correto. Corrigir isso exigiria scraping do site original (logo, cores, hero) — combinado com o usuário pra voltar nisso depois da Fase 4.
- **Fase 2**: `redesigns.content` (jsonb) congelado como `types/redesign-content.ts` ANTES de Editor/Publicar existirem (Anti-Pattern 3 do ARCHITECTURE.md) — mudar esse shape depois exige migração de dados.
- **Fase 2**: Screenshot "antes" via Microlink (API gratuita, sem chave) em vez de Puppeteer/Playwright self-hosted.
- **Fase 1**: Corrigida inconsistência entre `ARCHITECTURE.md` (schema `leads` com campos brutos do Places permanentes) e `PITFALLS.md`/`BUSCA-04` (só `place_id` cacheável) — seguido o requirement. Lista de leads salvos re-busca Place Details ao vivo a cada render em vez de ler de coluna cacheada.
- **Fase 0**: Migration baseline escrita a partir de introspecção direta do schema real (PostgREST OpenAPI), não `supabase db pull` — evitou setup interativo do Supabase CLI pra uma tarefa onde o schema já era conhecido com certeza

Decisões completas em PROJECT.md (seção Key Decisions). Recentes:

- Redesign gerado por IA (não templates fixos) — fidelidade à promessa "premium" do plugin original
- URL pública de demo hospedada no próprio painel, sem HostGator/cPanel
- Proposta = texto copiar/colar no WhatsApp + envio automático só de e-mail (Resend)
- Hospedagem definitiva no domínio do cliente final fica pra v2

### Pending Todos

Nenhum ainda.

**Ideia adiada (backlog, fora do escopo da Fase 5):** distinguir "criar site" (leads sem site próprio) de "redesenhar" (leads com site ruim existente) — rótulo/fluxo diferente desde a Fase 2, possivelmente faixa de preço própria na Fase 6. Levantado pelo usuário em 2026-07-08, ver `05-proposta/05-CONTEXT.md` seção Deferred Ideas.

### Blockers/Concerns

- **Gap de qualidade visual do redesign (aberto desde a Fase 2, ainda não resolvido)**: o redesign gerado não reusa logo/paleta/fotos do SITE ORIGINAL do lead — só fotos do Google Places + template neutro. Confirmado em teste manual real (2026-07-08, lead "Dra. Tania Higaki"): comparado lado a lado, o redesign usa fotos de estoque genéricas (mulher em escritório, sala com sofá) que não têm nada a ver com o negócio real, enquanto o site original tinha fotos reais da dentista. Usuário achou o resultado "horrível" nesse teste. Corrigir exigiria scraping do site original (logo, cores, hero) — **este é o próximo item de trabalho combinado**, ainda não iniciado.
- **Testes manuais da Fase 5 incompletos**: WhatsApp confirmado funcionando de ponta a ponta em produção; confirmação de dois cliques do e-mail confirmada; envio real via Resend, supressão bloqueando reenvio, opt-out, e cross-subscriber ainda não testados (usuário pausou o teste ao ver a qualidade visual do redesign, não quis mandar e-mail de um redesign que achou ruim).
- **Deploy na Vercel não promove sozinho pro domínio de produção**: pushes pro `master` geram deployments `READY` mas não atualizam o alias `prospector-panel-delta.vercel.app` automaticamente — precisa rodar `vercel --prod --yes` manualmente depois de cada push (descoberto em 2026-07-08 quando a Fase 5 pareceu "não ter aparecido" em produção, mas na verdade o domínio ainda apontava pro deploy da Fase 4). Vale investigar a configuração de Git Integration da Vercel numa sessão futura pra corrigir isso na raiz.
- `AI_GATEWAY_API_KEY` e `RESEND_API_KEY` já configuradas e funcionando em produção.
- **Schema do Places precisa seguir os termos de uso** (só `place_id` cacheável indefinidamente) — resolvido no design da Phase 1 (BUSCA-04), mas é a decisão mais fácil de errar por acidente se alguém "simplificar" o schema depois. Ver `.planning/research/PITFALLS.md` Pitfall 1. `ARCHITECTURE.md` ainda tem o schema desatualizado (com campos brutos permanentes) — vale corrigir esse arquivo numa próxima sessão pra não confundir.
- Sem revisão jurídica formal do LGPD/Places ToS — pesquisa é grounded em fontes públicas mas não substitui parecer legal antes do lançamento (ver `.planning/research/SUMMARY.md` "Gaps to Address").
- **Banco Supabase é compartilhado com outros produtos** (ZapFlow, Toqy) — confirmado na Fase 0: `prospector_customers` tem colunas do ZapFlow (`zapi_*`) sobrando.

## Session Continuity

Last session: 2026-07-08
Stopped at: Milestone v1.0 completo — Fases 0-6 todas implementadas, deployadas em produção, todas as 4 migrations aplicadas no banco real. Fase 5 testada manualmente em parte (WhatsApp confirmado, e-mail two-click confirmado; envio real/supressão/opt-out/cross-subscriber pendentes). Próximo trabalho combinado: gap de qualidade visual do redesign (logo/paleta/fotos do site original do lead, em vez de fotos genéricas do Places) — ainda não iniciado, nem discutido em `/gsd:discuss-phase`.
Resume file: .planning/phases/06-tabela-de-pre-o/06-01-SUMMARY.md
