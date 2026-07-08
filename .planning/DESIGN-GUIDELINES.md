# Design Guidelines: Hunter of Bad Pages

**Criado:** 2026-07-07
**Propósito:** Diretriz permanente de qualidade visual/copy pra qualquer página pública deste projeto (landing page, páginas de venda, e futuramente as páginas de redesign geradas pro produto). Consultar antes de criar ou revisar qualquer página nova.

## Regra de marca (inegociável)

Manter sempre a identidade visual "Signal Ledger" já usada no Toqy e no ZapFlow — mesmas fontes e paleta, definidas em `app/globals.css`:

- **Fontes:** Unbounded (display/headlines) + Manrope (corpo) — nunca trocar por Inter/Roboto/system fonts
- **Paleta:** fundo `--color-bg #f7f5f1` (creme), tinta `--color-ink #17141a`, accent coral `--color-accent #ff4d6d` / `--color-accent-dim #e23f5c`, violeta raro `--color-violet #8b5cf6`, semânticas good/warn/bad já definidas
- Não inventar nova paleta ou tipografia por página — todo novo componente usa os tokens já existentes em `@theme`

## O checklist "$10 mil" (referência de qualidade)

Fonte: field guide "The $10K Checklist" (Metics Media). Os 8 pontos que separam um site de R$10 mil de um de R$200 — usar como critério de aceite visual antes de considerar qualquer página pronta:

1. **Ponto de vista, não template** — a página assume uma direção de design específica e executa sem hesitar. Não pode parecer "SaaS genérico" (badge pill + hero centralizado + grid de 3 colunas é o padrão a evitar, não a seguir).
2. **Tipografia que trabalha** — hierarquia carregada por escala/peso, títulos que parecem escolhidos, não padrão.
3. **Paleta restrita** — 3 a 5 cores usadas com consistência (já temos: bg/ink/accent/accent-dim/violet). Nada de arco-íris.
4. **Hierarquia que respira** — espaço em branco, escala e contraste guiam o olho sem esforço. Primário/secundário/terciário claros.
5. **Imagens com intenção** — nunca placeholder genérico de banco de imagens. Sem fotos reais disponíveis, preferir mockups ilustrativos construídos em CSS/SVG que reforcem o produto (ex: comparador antes/depois) em vez de ícone-em-caixinha repetido.
6. **Movimento sutil** — microinterações que parecem artesanais, não fade-up genérico de biblioteca de animação.
7. **Mobile desenhado, não encolhido** — decisões de layout próprias pra mobile, não a versão desktop comprimida.
8. **O caro invisível** — carregamento rápido, contraste AA, navegação por teclado, HTML semântico, meta tags reais.

## Skills disponíveis pra design

- **`frontend-design`** (`.claude/skills/frontend-design/`) — já instalada nesse ambiente (parte da coleção oficial `anthropics/skills`), usar sempre antes de qualquer trabalho visual. Framework: Propósito & Audiência → Tom Estético → Restrições Técnicas → Diferenciação.
- **`ui-ux-pro-max-skill`** (github.com/nextlevelbuilder/ui-ux-pro-max-skill) — não instalada ainda. Gera sistema de design completo (paleta/tipografia/padrões por nicho) a partir de reasoning rules. Instalar de dentro do Claude Code com:
  ```
  /plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill
  /plugin install ui-ux-pro-max@ui-ux-pro-max-skill
  ```
  (comando precisa ser digitado pelo usuário — é um comando nativo do CLI, não uma skill que o assistente aciona sozinho)
- **21st.dev** — biblioteca de componentes de referência visual (não é uma skill pra instalar, é pra navegar e copiar padrões manualmente quando precisar de inspiração de um componente específico)
- **`anthropics/skills`** (repo raiz, `spec/`, `template/`, `.claude-plugin/`) — referência de como skills são estruturadas; é a fonte de onde `frontend-design` já vem. Útil só se formos criar uma skill nova do zero.

## Biblioteca de prompts (briefing → copy → finalização)

Guardada pra reuso em qualquer página nova deste projeto ou de outros (Toqy, ZapFlow, etc). 4 fases:

**Fase 1 — Briefing:** briefing reverso (15 perguntas estratégicas por segmento) + análise de concorrentes (5 padrões comuns + 3 oportunidades de diferenciação).

**Fase 2 — Estrutura:** arquitetura do site (lista de páginas, seções em ordem, justificativa).

**Fase 3 — Copy:** headline+subheadline do hero (5 opções, ≤12/20 palavras), seção "Sobre" (reescrita, ≤3 parágrafos), descrição de serviços (título+2 frases+3 bullets por serviço), FAQ por objeções (8 perguntas + 5 objeções).

**Fase 4 — Finalização:** microcopy de formulário (botões/placeholders/mensagens), SEO técnico (title≤60/meta≤155/5 keywords/alt text por página), crítica honesta (3 pontos fortes, 5 fracos com sugestão, 2 elementos faltando).

Os prompts completos (texto exato) estão no histórico da conversa de 2026-07-07 — se precisar do texto literal de novo, é só pedir pra recuperar.

---
*Última atualização: 2026-07-07*
