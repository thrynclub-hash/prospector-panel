# Phase 6: Tabela de Preço - Context

**Gathered:** 2026-07-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Tela estática no painel (`/painel/precos`) mostrando a faixa de preço sugerida pro assinante cobrar do cliente final (redesign R$500–1.000, manutenção R$97/mês). Sem banco de dados, sem dependência de nenhuma outra fase.

</domain>

<decisions>
## Implementation Decisions

### Onde vive
- Rota própria `/painel/precos`, seguindo o mesmo padrão de `/painel/buscar` (Server Component simples, sem client state).
- Card de acesso na dashboard principal (`app/painel/page.tsx`), no mesmo estilo do card "Buscar" já existente.
- Aproveitando a edição da dashboard: a mensagem "🚧 Próximas seções: Redesenhar, Editor, Publicar, Proposta" está desatualizada (essas fases já foram todas entregues) — substituir por cards/links reais pras seções já existentes (Buscar, Preços) em vez de deixar a mensagem de "em construção" falsa. Não é escopo novo, é corrigir uma informação incorreta que fica ao lado do que está sendo editado.

### Conteúdo
- Só os dois valores do requirement (PRECO-01): redesign R$500–1.000, manutenção R$97/mês — sem inventar script de venda completo ou lista extensa de objeções (isso violaria AGENT-INTEGRITY: não há fonte pra esse conteúdo além do requirement).
- Um parágrafo curto de contexto/orientação (ex.: "use como ponto de partida pra negociar com o cliente final") é aceitável — é enquadramento, não invenção de fato.

### Estilo visual
- Consistente com o design system já em uso (`bg-card`, `border-border`, `text-ink`, `text-muted`, `text-accent`), mesmo padrão de card usado em `/painel/buscar` e na dashboard.
- Estático — sem calculadora, sem interatividade, sem formulário (o requirement diz explicitamente "tela estática").

### Claude's Discretion
- Layout exato dos cards de preço (lado a lado vs. empilhados).
- Ícones específicos (lucide-react, mesma lib já usada em todo o projeto).
- Texto exato do parágrafo de orientação.

</decisions>

<specifics>
## Specific Ideas

Nenhuma referência específica além dos dois valores do requirement.

</specifics>

<deferred>
## Deferred Ideas

Nenhuma — discussão ficou dentro do escopo da fase.

</deferred>

---

*Phase: 06-tabela-de-pre-o*
*Context gathered: 2026-07-08*
