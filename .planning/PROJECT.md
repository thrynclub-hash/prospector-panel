# Hunter of Bad Pages

## What This Is

Painel SaaS que substitui o plugin de Claude Code `ArrecheNeto/PROSPECTOR-DE-SITES` por um produto web self-service: o assinante busca negócios locais com site ruim, o painel gera uma versão redesenhada por IA com comparador antes/depois, publica uma URL pública de demonstração, e gera uma mensagem de proposta pronta (WhatsApp + e-mail) citando os problemas reais do site antigo. É vendido como assinatura via Kiwify (R$10,97 primeira cobrança, depois R$19,97/mês).

## Core Value

O assinante consegue achar um negócio local com site ruim, gerar uma versão redesenhada com comparador antes/depois, e mandar uma proposta pronta pro dono do negócio — tudo dentro do painel, sem precisar do Claude Code nem do plugin original.

## Requirements

### Validated

<!-- Inferido do codebase existente (.planning/codebase/) — já em produção antes deste milestone. -->

- ✓ Assinante compra via Kiwify → conta criada automaticamente + link mágico de acesso por e-mail — existing (`app/api/kiwify/webhook/route.ts`)
- ✓ Login sem senha (magic link) via Supabase Auth — existing (`app/login`, `app/auth/callback`)
- ✓ Recuperação de acesso self-service pra quem já comprou (`/obrigado`) — existing
- ✓ Sessão persistente entre requisições (middleware de refresh) — existing (`proxy.ts`)

### Active

<!-- Escopo deste milestone. Hipóteses até serem construídas e validadas. -->

- [ ] **Buscar**: assinante pesquisa negócios locais no Google Maps (nota ≥ 4.7, site ruim, e-mail público) e o painel salva os resultados como leads
- [ ] **Redesenhar**: pra cada lead, o painel gera uma landing page nova por IA (conteúdo real melhorado, fotos/logo originais, seções relevantes) e um comparador visual antes/depois
- [ ] **Editor**: assinante edita textos e imagens da página gerada direto no painel
- [ ] **Publicar**: o site redesenhado ganha uma URL pública de demonstração, hospedada pelo próprio painel (sem depender de hospedagem do assinante)
- [ ] **Proposta**: painel gera um texto de proposta pronto — pra copiar/colar no WhatsApp e disparo automático por e-mail (via Resend) — citando os problemas específicos detectados no site antigo, sem preço embutido
- [ ] **Tabela de preço**: tela dentro do painel mostrando faixa sugerida pra cobrar do cliente final (redesign R$500–1.000, manutenção R$97/mês), baseada no modelo de negócio de referência

### Out of Scope

- Envio automático via WhatsApp Business API — texto fica pronto pra copiar/colar manualmente no v1; automação de envio fica pra v2 (decisão do usuário: evitar custo/complexidade de API de WhatsApp agora)
- Hospedagem definitiva do site no domínio do cliente final (ex: transferir pra Hostinger/HostGator do assinante) — v1 entrega só a URL pública de demo pra pitch; a hospedagem "pra sempre" depois da venda fica pra v2
- Integração com HostGator/cPanel (como o plugin original fazia) — decisão arquitetural: painel multi-tenant hospeda a demo ele mesmo, não depende da hospedagem de terceiros de cada assinante

## Context

**Referência funcional** — plugin Claude Code `ArrecheNeto/PROSPECTOR-DE-SITES` (marketplace de plugins do Helio Arreche), fluxo de 5 comandos: `/prospectar` → `/redesenhar` (+ comparador antes/depois) → `/editor` → `/publicar` (HostGator) → `/proposta` (e-mail via Gmail, sem preço). Este projeto recria esse fluxo como produto web, sem depender do Claude Code do lado do assinante.

**Referência de modelo de negócio** — planilha `modelo_prospector_sites` (Google Sheets): funil de 10 leads prospectados/semana → 30% resposta por e-mail → 33% fecham ≈ 1 cliente novo/semana (~4/mês). Preço de redesign R$500–1.000 (média R$750) + manutenção mensal R$97/cliente. Custo de hospedagem R$15/cliente/mês, ferramentas fixas R$120/mês, churn 3%/mês. Essa é a tabela de preço que o painel deve mostrar ao assinante como sugestão de precificação pros clientes finais dele — não é o preço do próprio painel.

**Estado do código** — Next.js 16 App Router + Supabase + Resend + Kiwify já scaffoldado (auth, webhook de compra, páginas de login/obrigado). `app/painel/page.tsx` é hoje um placeholder ("Próximas seções: Prospectar, Redesenhar, Editor, Publicar, Proposta"). `GOOGLE_PLACES_API_KEY` já está provisionada no `.env.local` mas nenhum código a usa ainda. Ver `.planning/codebase/` para mapeamento completo (STACK, ARCHITECTURE, INTEGRATIONS, CONCERNS).

**Riscos já identificados no mapeamento** (`.planning/codebase/CONCERNS.md`):
- Schema do Supabase (`prospector_customers`) não tem migrations versionadas — vai precisar de tabelas novas (leads, redesigns, mensagens) e isso deve ser corrigido antes de crescer o schema
- Nenhum guardrail de custo/quota na Google Places API — busca sem limite por assinante pode gerar custo inesperado
- `/painel` não tem auth-guard compartilhado — cada página nova nesse fluxo (buscar, redesenhar, editor, publicar, proposta) precisa lembrar de proteger a rota
- Webhook da Kiwify valida segredo por comparação simples de query string, não assinatura criptográfica (risco de segurança pré-existente, fora do escopo deste milestone mas registrado)

## Constraints

- **Tech stack**: Next.js 16 (App Router) + Supabase + Resend + Kiwify — já em produção, não é escolha em aberto
- **Monetização do próprio painel**: assinatura via Kiwify, R$10,97 primeira cobrança + R$19,97/mês recorrente — já parcialmente implementado (webhook), não faz parte do escopo de features deste milestone
- **Custo de IA/busca**: sem orçamento definido ainda para geração de conteúdo por IA nem para chamadas à Places API — precisa de guardrail de uso por assinante antes de lançar (ver CONCERNS.md)
- **Sem servidor próprio de hospedagem**: a URL pública de demo precisa viver dentro da própria infraestrutura Vercel/Supabase do painel — nada de depender de cPanel/HostGator de terceiros

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Redesign gerado por IA (não templates fixos genéricos) | Fidelidade à promessa "estética premium" do plugin original — templates genéricos não entregam isso | — Pending |
| URL pública de demo hospedada no próprio painel, sem integração HostGator/cPanel | Simplifica arquitetura multi-tenant; não depende da hospedagem de cada assinante | — Pending |
| Proposta = texto pronto pra copiar/colar no WhatsApp + envio automático só do e-mail (via Resend, já configurado) | Evita custo e complexidade de integrar WhatsApp Business API no v1 | — Pending |
| Hospedagem definitiva no domínio do cliente final fica pra v2 | MVP foca em fechar a venda com a demo; operar hosting permanente pra clientes de terceiros é um problema maior, adiado | — Pending |

---
*Last updated: 2026-07-07 after initialization*
