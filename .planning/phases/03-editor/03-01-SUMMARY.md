---
phase: 03-editor
plan: 01
subsystem: redesigns
tags: [editor, crud, storage]

requires:
  - phase: 02-redesenhar
    provides: "types/redesign-content.ts + redesigns table + lib/storage/assets.ts"
provides:
  - "app/api/redesigns/[id]/route.ts (PATCH edita content.generated/photos, DELETE apaga)"
  - "app/api/redesigns/[id]/photo/route.ts (upload de foto de substituição)"
  - "app/api/leads/[id]/route.ts (DELETE apaga lead, cascade apaga redesigns)"
  - "app/painel/leads/[leadId]/redesenhar/editar/* (editor de campos)"
  - "app/painel/leads/[leadId]/redesenhar/compare/* (comparação lado a lado em tela cheia)"
  - "Botões de excluir em leads (buscar) e redesigns (redesenhar)"
affects: [04-publicar]

tech-stack:
  added: []
  patterns:
    - "PATCH em /api/redesigns/[id] só aceita generated/photos -- facts nunca é editável via essa rota, mesmo que o body mande, porque o handler reconstrói facts sempre a partir do valor já salvo (não confia em input do cliente pra dado 'verificado')"
    - "Delete com confirmação em dois cliques (clique 1 arma 'confirmar?', clique 2 executa) em vez de window.confirm() -- consistente com o resto da UI, sem popup nativo do browser"

key-files:
  created:
    - app/api/redesigns/[id]/route.ts
    - app/api/redesigns/[id]/photo/route.ts
    - app/api/leads/[id]/route.ts
    - app/painel/leads/[leadId]/redesenhar/editar/page.tsx
    - app/painel/leads/[leadId]/redesenhar/editar/editor-form.tsx
    - app/painel/leads/[leadId]/redesenhar/compare/page.tsx
    - app/painel/leads/[leadId]/redesenhar/compare/compare-old-site.tsx
    - app/painel/leads/[leadId]/redesenhar/delete-redesign-button.tsx
    - app/painel/buscar/delete-lead-button.tsx
  modified: [app/painel/leads/[leadId]/redesenhar/page.tsx, app/painel/buscar/page.tsx]

key-decisions:
  - "Editor usa inputs/textareas simples, não Tiptap (citado no ROADMAP original) -- rich-text não é necessário pros campos atuais (título, subtítulo, parágrafo, lista de serviços), YAGNI por ora. Reconsiderar se Editor precisar de formatação (negrito/links) dentro do texto."
  - "content.facts nunca é editável no Editor -- só generated (copy) e photos. Editar um 'fato verificado' minaria a garantia de REDESENHAR-02; se um fato estiver errado, a correção certa é gerar de novo (novo fetch do Places), não editar manualmente."
  - "Comparação lado a lado usa iframe pro site antigo (pode falhar por X-Frame-Options) com link 'abrir aqui' sempre visível como fallback -- mesmo padrão do comparador-template.html do plugin original, não uma solução nova"
  - "Delete de lead cascade-apaga redesigns via FK do schema (on delete cascade) -- não precisou de lógica de aplicação pra isso"

patterns-established:
  - "Toda ação destrutiva (excluir lead, excluir redesign) usa confirmação em dois cliques inline, não modal nem window.confirm()"

requirements-completed: [EDITOR-01, EDITOR-02]
requirements-partial: []

duration: ~45min
completed: 2026-07-08
---

# Phase 3: Editor Summary

**Editor de campos pro conteúdo gerado (texto + fotos), com sinalização "gerado por IA" por seção (EDITOR-02), mais os botões de CRUD que faltavam em todo o fluxo (excluir lead, excluir redesign) e uma página de comparação lado a lado em tela cheia — tudo pedido explicitamente pelo usuário na mesma passada.**

## Performance

- **Duration:** ~45 min
- **Completed:** 2026-07-08
- **Files:** 9 criados, 2 modificados

## Accomplishments

- Editor de hero/sobre/serviços com badge "Gerado por IA — revise antes de publicar" em cada seção (EDITOR-02)
- `facts` (dados verificados) sempre read-only no Editor -- a rota PATCH reconstrói esse bloco a partir do valor já salvo, ignorando qualquer coisa que o cliente mande pra esse campo
- Upload/remoção de foto no editor, reusando `lib/storage/assets.ts` da Fase 2
- Excluir lead (cascade apaga redesigns via FK) e excluir redesign, ambos com confirmação em dois cliques
- Página `/redesenhar/compare`: tela dividida 50/50, cada lado com rolagem própria -- resolve a limitação do comparador de 600px (ambos os lados cortados) que o próprio usuário apontou visualmente comparando com o site real

## Deviations from Plan

- ROADMAP original citava Tiptap pro editor de texto -- usado inputs/textareas simples em vez disso (suficiente pros campos atuais, sem rich-text necessário ainda)
- Escopo desta fase cresceu além do EDITOR-01/02 original a pedido explícito do usuário ("aproveita coloque botões necessários... em tudo, não pode esquecer") -- CRUD de exclusão e comparação lado a lado não estavam no ROADMAP, adicionados na mesma unidade de trabalho

## Issues Encountered

Nenhum bug encontrado no smoke-test (todas as rotas novas retornam 307/401 corretamente sem sessão, build de produção limpo).

## User Setup Required

Nenhum novo -- reusa as mesmas pendências já registradas nas Fases 1/2 (migrations + AI_GATEWAY_API_KEY).

## Next Phase Readiness

- Editor completo o suficiente pra revisão humana antes de publicar -- Fase 4 (Publicar) pode assumir que `content` já passou por edição quando existir.
- Gap de qualidade visual já identificado (logo/paleta reais do site original não são usados, ver conversa da Fase 2) continua em aberto -- não foi escopo desta fase corrigir, só dar ferramenta pra editar manualmente o que já existe.

---
*Phase: 03-editor*
*Completed: 2026-07-08*
