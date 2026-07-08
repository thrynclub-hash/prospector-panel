# Phase 5: Proposta - Context

**Gathered:** 2026-07-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Assinante recebe um texto de proposta pronto (citando os problemas reais do site do lead, sem preço) pra mandar via WhatsApp (copiar/colar, `wa.me`) ou disparar por e-mail automático (Resend), respeitando uma lista de supressão pra não re-contatar o mesmo negócio (mesmo por outro assinante). Depende da Fase 4 (Publicar) — a proposta cita o link `/demo/[slug]`, não faz sentido sem ele.

</domain>

<decisions>
## Implementation Decisions

### Conteúdo e tom da proposta
- Tom de oportunidade construtiva, não diagnóstico direto de defeito — enquadrar como "o que pode melhorar", nunca "seu site está ruim". (PITFALLS.md Pitfall 6)
- Citar só os problemas que se aplicam a esse lead específico (ex.: se tem site mas PageSpeed baixo, não menciona "sem site"). Nunca um checklist fixo genérico.
- Menciona o link público `/demo/[slug]` com explicação do que é (ex.: "preparei uma versão nova de como o site de vocês poderia ficar: [link]") — reforça o disclaimer que já existe na própria página pública (Fase 4).
- Personalização: nome do negócio + cidade/bairro (dados já disponíveis via `facts` do redesign / Place Details), sem exigir dado que o produto não coleta.
- Referência de estrutura/tom: skill `proposta-email` já existente em `~/.claude/skills/proposta-email/SKILL.md` (baseada no plugin PROSPECTOR-DE-SITES original) — regras aplicáveis: sem preço no texto, rapport real (elogio específico e verificável, ex. nota/quantidade de avaliações do Google), defeito citado com delicadeza, "a entrega é o argumento" (link já pronto, não orçamento abstrato), CTA leve sem urgência artificial, texto curto (120-180 palavras).

### Fluxo WhatsApp vs E-mail
- Um botão único gera os dois formatos (WhatsApp + e-mail) de uma vez a partir do mesmo conteúdo-base — assinante decide depois qual canal usar.
- Envio do e-mail via Resend NUNCA é automático sem revisão: gera o texto → mostra preview → assinante confirma explicitamente pra disparar. (Alinhado com a skill `proposta-email`, que recomenda rascunho por padrão sobre envio direto.)
- Botão de WhatsApp abre `wa.me` já com o número do lead preenchido (usa `redesigns.content.facts.phone`, que já existe desde a Fase 2) + texto da proposta, não só copia.
- Se faltar o dado de contato de um canal (`facts.phone` nulo ou `leads.public_email` nulo), esconde o botão daquele canal especificamente — nunca mostra desabilitado. Se faltarem os dois, mostra só o texto pra copiar manualmente.

### Lista de supressão e opt-out
- Chave da supressão: `place_id` — é o único dado do Places permitido a ficar armazenado indefinidamente (mesma decisão já tomada pra `leads` na Fase 1), e identifica o negócio de forma estável entre assinantes diferentes.
- Toda vez que um e-mail automático é efetivamente enviado via Resend (após confirmação do assinante), o `place_id` já entra na lista de supressão como "contatado" — não precisa de resposta ou reclamação pra isso.
- Um link de opt-out no próprio e-mail marca o `place_id` como "pediu pra não ser contatado", com prioridade sobre qualquer coisa (nunca reversível por um assinante comum).
- O opt-out precisa de rota pública dedicada (ex. `/unsubscribe/[token]`), sem login, seguindo o mesmo padrão de isolamento da Fase 4 (client anon-key, sem sessão nem admin) e token não-adivinhável gerado no momento do envio.
- Quando um lead está suprimido, a UI só bloqueia o botão de e-mail automático (desabilitado, com aviso "já contatado" ou "pediu pra não receber"). O botão de WhatsApp continua liberado — o painel não controla o disparo manual de WhatsApp, então a supressão automática não se aplica a esse canal.

### Onde a proposta vive no painel
- Vive como aba/seção dentro da página existente do redesign (`/painel/leads/[leadId]/redesenhar`), junto de Editor/Publicar — sem navegação pra uma rota separada.
- Gerar a proposta exige que o redesign já esteja publicado (`is_public=true`, Fase 4) — botão de gerar fica desabilitado com aviso "publique o redesign primeiro" até isso ser verdade, já que o texto sempre cita o link público.
- O texto gerado é persistido na primeira geração (novo campo/tabela) e reaproveitado nas próximas visitas à tela, em vez de ser re-gerado do zero a cada abertura — mantém histórico consistente do que foi (ou será) efetivamente enviado.
- Editável antes de enviar: textarea simples sobre o texto gerado, mesmo padrão do Editor da Fase 3 (sem rich-text) — assinante pode ajustar antes de mandar por WhatsApp ou confirmar o envio do e-mail.

### Claude's Discretion
- Redação exata/copy da mensagem (dentro das regras de tom acima e da skill `proposta-email` como referência).
- Mecanismo técnico exato de geração/validação do token de opt-out (formato, expiração ou não).
- Schema exato da tabela/campo de persistência do texto da proposta e da lista de supressão (pesquisa/planejamento decide).
- Exato texto de aviso quando um canal está bloqueado (contato faltando ou suprimido).

</decisions>

<specifics>
## Specific Ideas

- Seguir a skill `proposta-email` (`~/.claude/skills/proposta-email/SKILL.md`) como referência de estrutura: assunto específico sem cara de marketing, parágrafo de rapport/elogio real, parágrafo de observação do estado atual (delicado), parágrafo de entrega ("preparei uma nova versão, já no ar" + link), CTA leve, assinatura.
- "A entrega é o argumento" — o texto deve soar como algo já pronto pra ver (link publicado), não uma proposta abstrata de orçamento.
- Nunca incluir preço no texto (PROPOSTA-01 já exige isso).

</specifics>

<deferred>
## Deferred Ideas

- **Distinguir "criar site" (leads sem site próprio) de "redesenhar" (leads com site ruim existente)** — ideia levantada pelo usuário durante esta discussão: pra leads sem website, em vez de rotular a ação como "Redesenhar" (Fase 2), poderia aparecer "Oferecer site" / "Criar site", com um enquadramento de proposta diferente (não há "antes" pra comparar) e possivelmente uma faixa de preço própria na Fase 6 (Tabela de Preço, hoje só tem redesign R$500-1.000 e manutenção R$97/mês). Fora do escopo da Fase 5 — envolveria mudar rótulos/fluxo já implementados nas Fases 2 e 6. Anotado pro backlog do roadmap, não implementado agora.

</deferred>

---

*Phase: 05-proposta*
*Context gathered: 2026-07-08*
