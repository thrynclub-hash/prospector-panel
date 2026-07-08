# Requirements: Hunter of Bad Pages

**Defined:** 2026-07-07
**Core Value:** O assinante consegue achar um negócio local com site ruim, gerar uma versão redesenhada com comparador antes/depois, e mandar uma proposta pronta pro dono do negócio — tudo dentro do painel, sem precisar do Claude Code nem do plugin original.

## v1 Requirements

### Foundation

<!-- Pré-requisito estrutural — sem tela própria, mas bloqueante para todo o resto. -->

- [x] **FOUND-01**: Toda página sob `/painel/*` exige sessão ativa E assinatura com `status = "active"` (guard compartilhado, corrige o gap hoje só verifica sessão)
- [x] **FOUND-02**: Schema do Supabase (tabela existente `prospector_customers` + todas as tabelas novas deste milestone) versionado em `supabase/migrations/`
- [ ] **FOUND-03**: Cada assinante tem um limite diário de buscas (Buscar) e de gerações de redesign (Redesenhar), aplicado no servidor e visível na UI

### Buscar

- [x] **BUSCA-01**: Assinante busca negócios locais por localização/categoria via Google Maps
- [x] **BUSCA-02**: Resultados são filtrados por nota ≥ 4.7
- [x] **BUSCA-03**: Resultados sinalizam "site ruim" (sem site próprio, ou site com nota baixa no PageSpeed) e presença de e-mail público
- [x] **BUSCA-04**: Leads salvos ficam numa lista revisável pelo assinante; o `place_id` é a única chave persistida indefinidamente — nome/telefone/nota/horário são re-buscados ou expiram, nunca armazenados como cache permanente (exigência dos termos do Google Places API)

### Redesenhar

- [ ] **REDESENHAR-01**: Assinante gera uma landing page redesenhada por IA a partir de um lead salvo
- [ ] **REDESENHAR-02**: O conteúdo gerado distingue campos reais/verificados (nome, endereço, telefone) de campos sugeridos pela IA (copy/marketing) — a IA nunca inventa horário de funcionamento, preço, certificação/prêmio, tempo de mercado ou depoimento de cliente
- [ ] **REDESENHAR-03**: Painel mostra um comparador visual antes/depois (site antigo vs. página gerada)
- [ ] **REDESENHAR-04**: Fotos/logo usados no redesign vêm preferencialmente do próprio negócio (Places Photos) ou de um fallback genérico (ex: monograma) — nunca de terceiro sem checagem de origem

### Editor

- [ ] **EDITOR-01**: Assinante edita textos e troca imagens da página gerada direto no painel
- [ ] **EDITOR-02**: Campos gerados por IA (não verificados) ficam visualmente sinalizados no editor, pra revisão humana antes de publicar

### Publicar

- [ ] **PUBLICAR-01**: Assinante publica o redesign numa URL pública de demonstração, hospedada pelo próprio painel (sem depender da hospedagem do assinante)
- [ ] **PUBLICAR-02**: Toda página pública tem aviso visível de que é uma demonstração não-oficial, não afiliada ao negócio real
- [ ] **PUBLICAR-03**: Páginas públicas não são indexadas por buscadores (`noindex` + `robots.txt`)
- [ ] **PUBLICAR-04**: A URL pública usa um identificador não-sequencial e não-adivinhável (não o nome do negócio nem um ID incremental)

### Proposta

- [ ] **PROPOSTA-01**: Painel gera um texto de proposta citando os problemas específicos detectados no site antigo, sem preço embutido
- [ ] **PROPOSTA-02**: O texto fica pronto pra copiar/colar num link do WhatsApp (`wa.me`), envio manual pelo assinante
- [ ] **PROPOSTA-03**: Painel também envia a proposta por e-mail automaticamente via Resend
- [ ] **PROPOSTA-04**: Negócio que já foi contatado (ou pediu pra não ser) entra numa lista de supressão e não é re-contatado pelo envio automático de e-mail, mesmo por outro assinante

### Tabela de Preço

- [ ] **PRECO-01**: Painel mostra uma tela com faixa de preço sugerido (redesign R$500–1.000, manutenção R$97/mês) pro assinante usar ao vender pro cliente final

## v2 Requirements

Reconhecidos, mas fora do roadmap deste milestone.

### Automação e Hospedagem Final

- **AUTOMACAO-01**: Envio automático de proposta via WhatsApp Business API (v1 fica manual/copiar-colar)
- **HOSPEDAGEM-01**: Exportar/transferir o site publicado pra hospedagem definitiva do cliente final (v1 entrega só a URL de demo)

## Out of Scope

Excluído deliberadamente. Documentado pra não ser re-adicionado sem essa discussão de novo.

| Feature | Reason |
|---------|--------|
| Integração HostGator/cPanel (como o plugin original) | Decisão arquitetural: painel multi-tenant hospeda a própria demo, não depende da hospedagem de terceiros de cada assinante |
| Editor de arrastar-e-soltar (page builder completo) | Escopo maior que "gerar template fixo + editar campos" — revisitar só se o produto pivotar pra layout livre |
| Geração de logo/imagem por IA como padrão | Custo e risco de direito de imagem maiores que usar fotos reais do Places + fallback gráfico simples |
| Cache permanente de dados brutos do Google Places | Viola os termos de uso do Places API — ver BUSCA-04 |

## Traceability

Preenchido durante a criação do roadmap.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 0 | Complete |
| FOUND-02 | Phase 0 | Complete |
| FOUND-03 | Phase 1 / Phase 2 | Phase 1 half complete (search quota) |
| BUSCA-01 | Phase 1 | Complete |
| BUSCA-02 | Phase 1 | Complete |
| BUSCA-03 | Phase 1 | Complete |
| BUSCA-04 | Phase 1 | Complete |
| REDESENHAR-01 | Phase 2 | Pending |
| REDESENHAR-02 | Phase 2 | Pending |
| REDESENHAR-03 | Phase 2 | Pending |
| REDESENHAR-04 | Phase 2 | Pending |
| EDITOR-01 | Phase 3 | Pending |
| EDITOR-02 | Phase 3 | Pending |
| PUBLICAR-01 | Phase 4 | Pending |
| PUBLICAR-02 | Phase 4 | Pending |
| PUBLICAR-03 | Phase 4 | Pending |
| PUBLICAR-04 | Phase 4 | Pending |
| PROPOSTA-01 | Phase 5 | Pending |
| PROPOSTA-02 | Phase 5 | Pending |
| PROPOSTA-03 | Phase 5 | Pending |
| PROPOSTA-04 | Phase 5 | Pending |
| PRECO-01 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 22 total
- Mapped to phases: 22
- Unmapped: 0 ✓

---
*Requirements defined: 2026-07-07*
*Last updated: 2026-07-07 after initial definition*
