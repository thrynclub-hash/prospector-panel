# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-07)

**Core value:** O assinante acha um negócio local com site ruim, gera um redesign com comparador antes/depois, e manda uma proposta pronta — tudo dentro do painel.
**Current focus:** Milestone v1.0 completo (7 fases) + Fase 02.1 (gap visual) completa + Fase 02.2 completa (dados + estrutura + editor inline) — **deployado em produção**, com 2 bugs reais de scrape corrigidos após teste manual do usuário. Próximo: usuário precisa excluir+regenerar o redesign de teste (lead `2d56ded6-a4b0-40b2-94dc-3b0cfe956a3a`, `drapaulamadalozzo.com.br`) mais uma vez com o fix de scrape no ar, e confirmar se a cor/fotos reais aparecem certas agora. Ver "Session Continuity" pro estado exato de onde parou.

## Current Position

Phase: 8 fases completas (Fundação, Buscar, Redesenhar, [02.1 INSERTED], Editor, Publicar, Proposta, Preços) + Fase 02.2 (INSERTED) completa: 2/2 waves, **deployada e com 2 hotfixes pós-deploy**
Status: Milestone v1.0 100% implementado e deployado. Fase 02.1 (reusar logo/paleta/fotos do site original) implementada — código correto, mas o scrape em si tinha 2 bugs (ver abaixo) que só um teste real revelou. Fase 02.2 completa no código: wave 1 (`facts.openingHours` + cap de fotos 3→8) e wave 2 (`RedesignPreview` reescrito no padrão `redesign-premium` + editor inline), ambas verificadas (28/28 must-haves, build limpo) e commitadas. Verificação automatizada = `human_needed` (relatório em `02.2-VERIFICATION.md`); teste manual real do usuário nesta sessão encontrou 3 problemas reais, todos corrigidos e deployados:
  1. `/preview` tinha um wrapper `max-w-3xl` (resquício da Fase 2) espremendo a landing page nova de largura cheia numa coluna de 768px — corrigido (`2202ce6`).
  2. AI Gateway bloqueava toda geração com 403 "requires a valid credit card on file" (achado via `get_runtime_errors` da Vercel) — não era bug de código, faltava cartão cadastrado na conta Vercel; usuário resolveu adicionando o cartão, confirmado via 3 gerações `201` bem-sucedidas nos runtime logs depois.
  3. `lib/site-scrape.ts` tinha 2 bugs reais (achados testando ao vivo contra `drapaulamadalozzo.com.br`, um site WordPress real): (a) o site usa lazy-load — `src` é um placeholder base64, a foto real está em `data-src`, nunca lido, então 0 fotos reais eram extraídas; (b) `<meta name="theme-color" content="#fff">` (branco, metadado de UI de navegador, não cor de marca) estava sendo usado como `theme.primaryColor`, deixando todo CTA/accent branco-no-branco. Ambos corrigidos (`f8d7b99`) — fallback pra `data-src`/`data-lazy-src`/`data-original`, e rejeição de cores genéricas quase-brancas/quase-pretas (cai em `null` em vez de cor quebrada).
Fase 5 (Proposta) também `human_needed`: WhatsApp confirmado funcionando de ponta a ponta em produção, confirmação em dois cliques do e-mail confirmada; ainda faltam testar envio real via Resend, supressão bloqueando reenvio, opt-out, e cross-subscriber (ver `05-proposta/05-VERIFICATION.md`).
Last activity: 2026-07-08/09 — Deploy de produção rodado 3x nesta sessão (`vercel --prod --yes`, confirmado `target: production` toda vez, alias `prospector-panel-delta.vercel.app`): (1) Fase 02.2 completa pro ar pela primeira vez (nunca tinha sido promovida — todo commit desde a Fase 02.1 só gerava preview deployment), (2) fix do `/preview`, (3) fix do `site-scrape.ts`. Usuário testou ao vivo com um lead real e reportou 3 problemas em sequência; os 3 foram diagnosticados com evidência direta (runtime errors/logs da Vercel via MCP, `curl` no site real, teste da API do Microlink) antes de qualquer fix, não por suposição.

Progress: [██████████] 100% (7/7 fases do milestone v1.0) + Fase 02.1 completa, deployada + Fase 02.2 completa, deployada, 2 hotfixes de scrape aplicados — **aguardando confirmação do usuário** que o resultado agora está bom

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

- **Hotfix pós-02.2 (site-scrape.ts)**: `theme-color` do `<meta>` tag é metadado de UI de navegador (cor da barra de status mobile), não confiável como sinal de cor de marca — muitos temas (WordPress principalmente) deixam isso branco/preto genérico por padrão, independente da paleta real do site. Em vez de tentar extrair a cor real (isso exigiria análise de imagem/CSS, já documentado como deferido na Fase 02.1), o fix apenas REJEITA valores genéricos quase-brancos/quase-pretos (`#fff`, `#ffffff`, `#000`, `#000000`) e cai em `null` (template neutro) — melhor não ter cor de marca do que ter uma cor ativamente quebrada (invisível no fundo branco). Fotos: lazy-load (`data-src` em vez de `src`) é um padrão comum o suficiente (WordPress + plugins de performance) pra justificar suporte de primeira classe, não um edge case — fallback adicionado pra `data-src`/`data-lazy-src`/`data-original` quando `src` é um placeholder `data:`.
- **Hotfix pós-02.2 (`/preview`)**: o wrapper `max-w-3xl mx-auto` em `preview/page.tsx` era da época em que `RedesignPreview` era um bloco de conteúdo simples (Fase 2) — nunca foi atualizado quando a Fase 02.2 reescreveu o componente pra uma landing page de largura cheia com seções full-bleed. Os outros 4 call sites já estavam certos (`/editar` e `/demo/[slug]` sem trava; Comparator/`/compare` travados de propósito, por design, não por engano) — só faltou esse. O plano/checker da Fase 02.2 não pegou isso porque só confirmaram que os call sites ainda compilavam, não que renderizavam corretamente na largura nova do componente.
- **AI Gateway / cartão de crédito**: a Vercel AI Gateway exige um cartão cadastrado na conta pra liberar até as chamadas gratuitas — isso é INDEPENDENTE de ter a API key/OIDC configurado (que já estava). Sem o cartão, toda geração falha com 403 `GatewayInternalServerError` e a rota retorna 502 sem nunca chegar a criar o redesign (nem foto nem texto). Não é um problema de código; usuário resolveu cadastrando o cartão na própria conta Vercel.
- **Deploy não promove sozinho pra produção**: confirmado de novo nesta sessão — todo commit da Fase 02.2 (9 commits) só gerou preview deployments (`target: null`) até eu rodar `vercel --prod --yes` manualmente. O usuário estava testando a Fase 02.1 antiga em produção sem saber que a 02.2 nem tinha ido pro ar ainda. Ver Blockers abaixo, já era um problema conhecido, mas vale reforçar: SEMPRE confirmar `target: production` no output do deploy antes de considerar algo "no ar".
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

- **AGUARDANDO CONFIRMAÇÃO DO USUÁRIO (bloqueador imediato)**: o fix do `site-scrape.ts` foi verificado programaticamente (rodei a lógica corrigida direto contra o HTML real do site da lead e confirmei que agora extrai fotos reais + rejeita a cor branca), mas o usuário AINDA NÃO testou o resultado final no navegador depois desse último deploy. Última instrução dada a ele: excluir o redesign existente do lead `2d56ded6-a4b0-40b2-94dc-3b0cfe956a3a` e gerar de novo. Não presumir que está resolvido até ele confirmar.
- **Estrutura/editor inline do redesign — implementado E deployado (Fase 02.2)**: código verificado (28/28 must-haves) e agora em produção, mas ainda não testado ponta a ponta por um humano num navegador real (contentEditable+autosave, upload de foto, mapa embed com endereço real, degradação sem telefone). Ver `02.2-VERIFICATION.md` seção "Human Verification Required" pra lista completa dos 8 itens.
- **Gap de qualidade visual do redesign — implementado E deployado (Fase 02.1), com 2 bugs de scrape corrigidos nesta sessão**: reaproveitamento de logo/cor/fotos do site original agora no ar, mas só foi testado contra 1 site real até agora (`drapaulamadalozzo.com.br`, que expôs os 2 bugs de lazy-load/theme-color). Vale testar contra mais alguns sites reais variados (outras plataformas: Wix, Squarespace, sites sem WordPress) pra ver se aparecem outros padrões de HTML que o scraper simples (regex, sem parser real) não cobre.
- **Testes manuais da Fase 5 incompletos**: WhatsApp confirmado funcionando de ponta a ponta em produção; confirmação de dois cliques do e-mail confirmada; envio real via Resend, supressão bloqueando reenvio, opt-out, e cross-subscriber ainda não testados (usuário pausou o teste ao ver a qualidade visual do redesign, não quis mandar e-mail de um redesign que achou ruim — retomar depois que a Fase 02.2 estiver confirmada boa).
- **Deploy na Vercel não promove sozinho pro domínio de produção**: confirmado de novo nesta sessão (ver Decisions acima) — SEMPRE rodar `vercel --prod --yes` manualmente depois de qualquer commit relevante, e SEMPRE conferir `target: production` no JSON de saída antes de considerar deployado. Vale investigar a configuração de Git Integration da Vercel numa sessão futura pra corrigir isso na raiz (por que push pro `master` não promove automaticamente).
- **Instalação do GSD incompleta neste ambiente**: `.claude/agents/*.md` (11 arquivos: gsd-planner, gsd-plan-checker, gsd-executor, gsd-verifier, gsd-phase-researcher, gsd-codebase-mapper, gsd-debugger, gsd-integration-checker, gsd-project-researcher, gsd-research-synthesizer, gsd-roadmapper) estão listados em `.claude/gsd-file-manifest.json` mas ausentes do disco — confirmado via diff completo do manifest (126/138 arquivos presentes). Os subagent types `gsd-planner`/`gsd-plan-checker`/`gsd-executor`/`gsd-verifier` também não existem como agent types registrados neste ambiente. Contornado nesta sessão inlinando as instruções de cada papel diretamente no prompt de agentes `general-purpose` — funcionou bem, mas todo `/gsd:plan-phase` e `/gsd:execute-phase` futuro vai precisar do mesmo contorno até alguém rodar `/gsd:update` ou reinstalar esses arquivos.
- `AI_GATEWAY_API_KEY` e `RESEND_API_KEY` já configuradas e funcionando em produção (AI Gateway confirmado funcionando de verdade só depois que o usuário cadastrou o cartão nesta sessão).
- **Schema do Places precisa seguir os termos de uso** (só `place_id` cacheável indefinidamente) — resolvido no design da Phase 1 (BUSCA-04), mas é a decisão mais fácil de errar por acidente se alguém "simplificar" o schema depois. Ver `.planning/research/PITFALLS.md` Pitfall 1. `ARCHITECTURE.md` ainda tem o schema desatualizado (com campos brutos permanentes) — vale corrigir esse arquivo numa próxima sessão pra não confundir.
- Sem revisão jurídica formal do LGPD/Places ToS — pesquisa é grounded em fontes públicas mas não substitui parecer legal antes do lançamento (ver `.planning/research/SUMMARY.md` "Gaps to Address").
- **Banco Supabase é compartilhado com outros produtos** (ZapFlow, Toqy) — confirmado na Fase 0: `prospector_customers` tem colunas do ZapFlow (`zapi_*`) sobrando.

## Session Continuity

Last session: 2026-07-08/09 (madrugada)
Stopped at: depois de 3 deploys de produção e 2 hotfixes, esperando o usuário testar de novo e confirmar se ficou bom. Sequência completa desta sessão (nesta ordem):

1. Executei a Fase 02.2 completa (wave 1 + wave 2, GSD `plan-phase`/`execute-phase` com os agentes de papel faltando no disco — contornado inlinando as instruções, ver Blockers). Verificação automatizada: 28/28 must-haves, `human_needed`.
2. Rodei `vercel --prod --yes` pela primeira vez nesta sessão (commit `b978815`) — descobri que NENHUM commit desde a Fase 02.1 tinha ido pra produção de verdade (só previews). Confirmado `target: production`.
3. Usuário testou e reportou: "não parece um site de 10k". Investiguei: achei o wrapper `max-w-3xl` quebrado em `preview/page.tsx` — fix (`2202ce6`) — redeploy.
4. Usuário pediu pra "zerar" os redesigns — descobri (lendo `page.tsx`) que já existe um botão "Excluir redesign" no painel; não precisei mexer no banco. Também descobri, via `get_runtime_errors` da Vercel, que a AI Gateway estava bloqueando 100% das gerações com 403 "requires a valid credit card" — não é bug de código. Expliquei os dois achados, usuário cadastrou o cartão.
5. Usuário excluiu e gerou de novo, reportou: ainda feio, sem cor, sem fotos reais. Confirmei via runtime logs que a geração agora tinha 3 sucessos (`201`) — a IA estava rodando, então o problema era no CONTEÚDO gerado, não na infra. Investiguei `lib/site-scrape.ts` contra o HTML real do site da lead (`curl` direto) e achei os 2 bugs reais: lazy-load (`data-src`) não lido, e `theme-color` genérico (`#fff`) usado como cor de marca. Fix (`f8d7b99`), verificado programaticamente contra o HTML real ANTES de commitar, redeploy.
6. Usuário pediu pra salvar tudo (esta atualização de STATE.md) antes de abrir outro terminal.

**Próximo passo direto (retomar exatamente aqui):** o usuário ainda precisa excluir o redesign do lead `2d56ded6-a4b0-40b2-94dc-3b0cfe956a3a` (`https://prospector-panel-delta.vercel.app/painel/leads/2d56ded6-a4b0-40b2-94dc-3b0cfe956a3a/redesenhar`, botão "Excluir redesign") e gerar de novo (`drapaulamadalozzo.com.br`), agora com o fix do scrape no ar, e reportar se a cor e as fotos reais do site aparecem certas dessa vez. Se sim: fechar a verificação da Fase 02.2 como aprovada, seguir pro checklist do `02.2-VERIFICATION.md` (editor inline, mapa, etc.) e depois retomar os testes pendentes da Fase 5 (Resend/supressão/opt-out/cross-subscriber). Se ainda não: mais uma rodada de diagnóstico com evidência direta (não assumir causa) — meu instinto seria olhar o conteúdo REAL gerado no banco (`redesigns.content`) pra esse lead, mas não tenho acesso MCP ao Supabase desse projeto (ref `bhiggyigsrqfabqhutne` não está entre os projetos conectados — só `PhotoForge`/`leonardo-ecossistema` aparecem); precisaria ou de outra credencial ou pedir pro usuário rodar uma query.

Estado do git: tudo commitado, working tree limpa (`git status` confirmado antes de escrever este STATE.md). Commits desta sessão, em ordem: `b978815` (fecha fase 02.2 no código) → `2202ce6` (fix max-w-3xl) → `f8d7b99` (fix site-scrape) → `56af573` (verification report). Produção: 3 deploys rodados, o último (`f8d7b99`) é o que está no ar agora em `prospector-panel-delta.vercel.app`.

Pendências que continuam de antes (não mudaram): testes manuais completos da Fase 5 (envio real/supressão/opt-out/cross-subscriber) — pausados pelo usuário até a Fase 02.2 estar confirmada boa.
Resume file: nenhum — próxima ação é o usuário testar de novo, não código pendente.
