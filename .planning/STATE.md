# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-07)

**Core value:** O assinante acha um negócio local com site ruim, gera um redesign com comparador antes/depois, e manda uma proposta pronta — tudo dentro do painel.
**Current focus:** Milestone v1.0 completo (7 fases) + Fase 02.1 (gap visual) completa + Fase 02.2 completa (dados + estrutura + editor inline). Próximo: deploy em produção (`vercel --prod --yes`, pendente) + testar `/editar`, `/demo/[slug]` e o comparador de ponta a ponta com um lead real, e finalizar testes manuais da Fase 5.

## Current Position

Phase: 8 fases completas (Fundação, Buscar, Redesenhar, [02.1 INSERTED], Editor, Publicar, Proposta, Preços) + Fase 02.2 (INSERTED) completa: 2/2 waves
Status: Milestone v1.0 100% implementado. Fase 02.1 (reusar logo/paleta/fotos do site original) implementada e verificada no código (`human_needed` — falta testar em produção com um lead real). Fase 02.2 completa no código: wave 1 (02.2-01: `facts.openingHours` + cap de fotos 3→8) e wave 2 (02.2-02: `RedesignPreview` reescrito no padrão `redesign-premium` -- hero 2 CTAs, seção localização/mapa/horário, galeria até 8 fotos, tipografia Playfair+Inter escopada -- + editor inline em `/editar`, substituindo `editor-form.tsx`) ambas implementadas, verificadas (build limpo, 4/4 tasks de cada plano com verify passando) e commitadas. `human_needed`: falta testar em produção com um lead real (contentEditable + autosave, upload de foto, mapa embed, degradação sem telefone). Fase 5 (Proposta) também `human_needed`: WhatsApp confirmado funcionando de ponta a ponta em produção, confirmação em dois cliques do e-mail confirmada; ainda faltam testar envio real via Resend, supressão bloqueando reenvio, opt-out, e cross-subscriber (ver `05-proposta/05-VERIFICATION.md`).
Last activity: 2026-07-08 — Fase 02.2-02 completa: `RedesignPreview` reescrito como client component no padrão completo da skill `redesign-premium` (nav simples, hero 2 colunas com 2 CTAs + card de nota flutuante, barra de confiança, cards de serviço → WhatsApp só em modo leitura, sobre, galeria de até 8 fotos, seção "Localização e Contato" com mapa embed do Google Maps + `facts.openingHours` + CTA final, botão WhatsApp flutuante), tipografia Playfair Display + Inter escopada só a este componente via `next/font/google` + style inline (nunca a identidade Unbounded/Manrope do painel). Editor inline (`editable-field.tsx`: `EditableText`/`EditableImage`) substitui o formulário da Fase 3 (`editor-form.tsx`, removido) -- `/editar` agora renderiza o preview real com `editable redesignId={redesign.id}`, cada edição salva sozinha via PATCH/upload já existentes, sem botão "Salvar". `facts` nunca editável (confirmado via grep). Os 4 call sites de leitura (Comparator, `/compare`, `/preview`, `/demo/[slug]`) confirmados intocados (`git diff --stat`) -- continuam passando só `content`. Ver `02.2-02-SUMMARY.md`. **Ainda não deployado** — falta rodar `vercel --prod --yes` (ver nota abaixo sobre o deploy não ser automático).

Progress: [██████████] 100% (7/7 fases do milestone v1.0) + Fase 02.1 (gap-closure inserida) completa no código, deploy pendente + Fase 02.2 (gap-closure inserida) 2/2 waves completa no código, deploy pendente

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

- **Fase 02.2-02**: Hero CTA #2 é "Ver serviços" (âncora real pra `#servicos`), não "Como funciona" do screenshot de referência -- decisão anti-fabricação do planejador: este produto não tem uma fonte real de "como funciona o atendimento" pra uma clínica específica, só facts verificados + serviços; um CTA "Como funciona" sem conteúdo por trás seria inventar uma narrativa de processo. `/editar` foi mantido como a mesma rota (não substituído por uma nova) -- só o conteúdo interno trocou do formulário (`editor-form.tsx`, removido) pro preview real em modo edição, preservando a navegação existente. `RedesignPreview` virou `"use client"` pra suportar `contentEditable`/upload -- seguro pros 4 call sites Server Component existentes (Next.js renderiza Client Components normalmente quando importados por Server Components, sem exigir mudança neles, confirmado por build limpo + `git diff --stat` mostrando os 4 arquivos intocados).
- **Fase 02.2-01**: `facts.openingHours` usa `regularOpeningHours.weekdayDescriptions` (strings pré-formatadas/localizadas pelo Google) em vez de `regularOpeningHours.periods` (estrutura bruta) -- evita reimplementar formatação de dia-da-semana em português. Confirmado (WebSearch factual, não pesquisa formal) que o campo já está na mesma SKU Enterprise que `internationalPhoneNumber`/`rating`/`userRatingCount`/`websiteUri` (já pedidos desde a Fase 5) -- não muda o tier de billing do `getDetails`. Cap de fotos (3→8) subiu nos dois caminhos (Places fallback + site-scrape) no mesmo plano, de propósito, pra não criar assimetria entre fonte preferida e fallback.
- **Fase 02.1**: Cor de marca (`theme.primaryColor`) entra como chave-irmã de nível superior em `RedesignContent`, nunca aninhada em `photos` — o PATCH do Editor faz `photos: body.photos ?? currentContent.photos` (substituição integral) e `editor-form.tsx` sempre manda um `photos` reconstruído à mão, então qualquer chave nova dentro de `photos` seria apagada no primeiro "Salvar edição". `theme` segue o mesmo padrão read-only já usado por `facts`.
- **Fase 02.1**: Logo extraído reaproveitando a MESMA chamada Microlink que já existia pro screenshot "antes" (`&meta=true`) — zero novo round-trip HTTP, zero nova integração. Fotos/theme-color via novo scrape leve (`lib/site-scrape.ts`, fetch+regex, mesmo padrão de `lib/email-scrape.ts`). Fallback de cor via `sharp`/dominant-color-do-logo foi deliberadamente **deferido** (não implementado) — só `<meta theme-color>` no v1.
- **Fase 6**: Sem script de venda ou tratamento de objeções na tela de preço — só os dois valores do requirement (PRECO-01) + uma frase de contexto. Conteúdo além disso violaria AGENT-INTEGRITY (zero invenção sem fonte).
- **Fase 5**: Lista de supressão (`contacted_businesses`) é a primeira tabela do produto sem `user_id` de ownership — de propósito, cross-subscriber (PROPOSTA-04). Opt-out público via função `security definer` (`opt_out_business(token)`) que compara o token dentro do corpo da função, nunca via policy RLS (uma policy `using (opt_out_token is not null)` pareceria certa mas não validaria o token de verdade — ver `05-RESEARCH.md`/`05-VERIFICATION.md`).
- **Fase 5**: `redesigns.content.facts.phone` estava sempre `null` desde a Fase 2 (nunca populado) — corrigido como pré-requisito da Fase 5 (field mask do Places + generate route), não um bug da Fase 2 em si (o campo nunca tinha sido pedido ao Places antes).
- **Fase 4**: RLS pública em 2 camadas (view `public_redesigns` com `security_invoker=true` + policy direta na tabela `redesigns` pro papel `anon`) — nunca confiar só na view.
- **Fase 4**: Rota pública (`app/demo/[slug]`) só usa `lib/supabase/public.ts` (anon key, sem cookies) — nunca o client de sessão nem o admin.
- **Fase 3**: `content.facts` nunca é editável no Editor (só `generated`/`photos`) — a rota PATCH ignora qualquer coisa que o cliente mande pra `facts`, reconstruindo sempre a partir do valor já salvo.
- **Fase 3**: Editor usa inputs/textareas simples em vez de Tiptap (citado no ROADMAP original) — YAGNI, sem necessidade de rich-text pros campos atuais.
- **Gap de qualidade visual — corrigido no código pela Fase 02.1 (2026-07-08), falta testar em produção**: o redesign gerado agora tenta reaproveitar logo/paleta/fotos do SITE ORIGINAL do lead antes de cair no fallback de Places Photos/template neutro. Só se aplica a redesigns gerados a partir de agora — os já existentes (ex.: o teste da Dra. Tania Higaki que expôs esse gap) continuam como estão.
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

- **Estrutura/editor inline do redesign — implementado (Fase 02.2), falta testar em produção**: código completo e verificado (build limpo, 4 read-only call sites confirmados intocados, `facts` confirmado nunca editável), mas ainda não deployado nem testado com um lead real. Teste real recomendado: abrir `/editar` num redesign real e confirmar contentEditable+autosave, upload de foto, e o mapa embed/seção de localização com um endereço real.
- **Gap de qualidade visual do redesign — implementado (Fase 02.1), falta testar em produção**: código completo e verificado (build limpo, must_haves batem com o código real), mas ainda não deployado nem testado com um lead real. Teste real recomendado: regenerar o redesign da Dra. Tania Higaki (mesmo caso que expôs o gap original) e confirmar que agora usa o logo/cor/fotos reais do site dela, não fotos de estoque.
- **Testes manuais da Fase 5 incompletos**: WhatsApp confirmado funcionando de ponta a ponta em produção; confirmação de dois cliques do e-mail confirmada; envio real via Resend, supressão bloqueando reenvio, opt-out, e cross-subscriber ainda não testados (usuário pausou o teste ao ver a qualidade visual do redesign, não quis mandar e-mail de um redesign que achou ruim).
- **Deploy na Vercel não promove sozinho pro domínio de produção**: pushes pro `master` geram deployments `READY` mas não atualizam o alias `prospector-panel-delta.vercel.app` automaticamente — precisa rodar `vercel --prod --yes` manualmente depois de cada push (descoberto em 2026-07-08 quando a Fase 5 pareceu "não ter aparecido" em produção, mas na verdade o domínio ainda apontava pro deploy da Fase 4). Vale investigar a configuração de Git Integration da Vercel numa sessão futura pra corrigir isso na raiz.
- `AI_GATEWAY_API_KEY` e `RESEND_API_KEY` já configuradas e funcionando em produção.
- **Schema do Places precisa seguir os termos de uso** (só `place_id` cacheável indefinidamente) — resolvido no design da Phase 1 (BUSCA-04), mas é a decisão mais fácil de errar por acidente se alguém "simplificar" o schema depois. Ver `.planning/research/PITFALLS.md` Pitfall 1. `ARCHITECTURE.md` ainda tem o schema desatualizado (com campos brutos permanentes) — vale corrigir esse arquivo numa próxima sessão pra não confundir.
- Sem revisão jurídica formal do LGPD/Places ToS — pesquisa é grounded em fontes públicas mas não substitui parecer legal antes do lançamento (ver `.planning/research/SUMMARY.md` "Gaps to Address").
- **Banco Supabase é compartilhado com outros produtos** (ZapFlow, Toqy) — confirmado na Fase 0: `prospector_customers` tem colunas do ZapFlow (`zapi_*`) sobrando.

## Session Continuity

Last session: 2026-07-08
Stopped at: Fase 02.2-02 (wave 2: estrutura + editor inline) executada e commitada — `RedesignPreview` reescrito no padrão `redesign-premium` completo (hero 2 CTAs, localização/mapa/horário, galeria até 8 fotos, tipografia Playfair+Inter escopada) + editor inline (`editable-field.tsx`) substituindo `editor-form.tsx` (removido) em `/editar`. Build limpo (`npm run build`, todas as 25 rotas), 4/4 tasks com `<verify>` passando, os 4 call sites de leitura (Comparator, `/compare`, `/preview`, `/demo/[slug]`) confirmados intocados por `git diff --stat`, `facts` confirmado nunca editável por grep. `SUMMARY.md` criado (`02.2-02-SUMMARY.md`), `ROADMAP.md`/`STATE.md` atualizados. Nenhuma migration nova (esta plan é só frontend). Fase 02.2 (INSERTED) agora 2/2 waves completa no código.

**Próximo passo direto:** deploy — `vercel --prod --yes` (deploy não é automático nesse projeto, ver Blockers abaixo) pra colocar Fase 02.1 + 02.2 (wave 1 + wave 2) juntas em produção. Depois, teste manual real: abrir `/editar` num lead real, confirmar contentEditable + autosave no blur, upload de foto, mapa embed renderizando com um endereço real, e um redesign sem telefone escondendo todo elemento de WhatsApp.

Pendências que continuam de antes (não mudaram): testes manuais da Fase 5 (envio real/supressão/opt-out/cross-subscriber); Fase 02.1 ainda sem teste real em produção pós-deploy; Fase 02.2 (agora completa no código) também sem teste real em produção.
Resume file: nenhum — próxima ação é deploy + teste manual, não mais planejamento/execução de código pendente nesta fase.
