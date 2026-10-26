# AUDITORIA TÉCNICA DO SISTEMA ATUAL — TÍO NENÊ

> **Documento:** Relatório de Auditoria Técnica e Diagnóstico de Arquitetura  
> **Data de Execução:** 21 de Outubro de 2026  
> **Projeto:** Tío Nenê — Viagens & Operação Cancún  
> **Repositório Inspecionado:** `d:\Z_UEB\TIONENE`  
> **Status:** Inspeção estática de código e schemas locais (somente leitura)

---

## 1. Resumo Executivo

O sistema **Tío Nenê** é uma aplicação híbrida de alta complexidade desenvolvida sobre **Next.js 15 (App Router)** e **React 19**, projetada para atender a duas frentes distintas:
1. **Vitrine Pública (B2C & B2B):** Páginas institucionais, catálogo de passeios, pacotes de viagem completa, curadoria personalizada e formulários de captura de leads com integração ao WhatsApp.
2. **Backoffice Operacional (/admin):** Painel administrativo para emissão e gestão de contratos, cadastro de clientes, controle de chegadas mensais, cálculo e auditoria de custos operacionais com fornecedores locais de Cancún/Riviera Maya.

### Principais Conclusões do Diagnóstico:
- **Separação Abrupta entre Vitrine e Backoffice:** Embora o painel administrativo (`/admin`) possua recursos avançados de integração com o banco PostgreSQL via [Supabase Client](file:///d:/Z_UEB/TIONENE/src/lib/supabase.ts) para contratos, clientes e fornecedores, a **vitrine pública de passeios (`/passeios` e `/passeios/[slug]`) opera com dados estáticos codificados em arquivos TypeScript** ([`src/data/tours.ts`](file:///d:/Z_UEB/TIONENE/src/data/tours.ts)). Alterações de preços ou passeios feitas no admin não se refletem na vitrine pública.
- **Motor de Cálculo Especializado:** Existe um motor determinístico de regras de negócio em [`src/lib/cost-calculator.ts`](file:///d:/Z_UEB/TIONENE/src/lib/cost-calculator.ts) e um catálogo canônico em [`src/data/supplier-catalog.ts`](file:///d:/Z_UEB/TIONENE/src/data/supplier-catalog.ts) cobrindo as 42 opções tarifárias (TN-001 a TN-042) dos 9 fornecedores homologados, com validações de dias da semana (ex: regras específicas de dias do Coco Bongo) e modelos de precificação variados (por pessoa, embarcação privativa, jet ski e veículo/trecho).
- **Inconsistências Críticas de Persistência:**
  - O schema do [Prisma](file:///d:/Z_UEB/TIONENE/prisma/schema.prisma) está desatualizado, desconectado do banco em produção (as variáveis `DATABASE_URL` e `DIRECT_URL` estão comentadas no [`.env`](file:///d:/Z_UEB/TIONENE/.env)) e nunca é chamado pelas rotas da aplicação.
  - A tabela `supplier_cost_audit_log` possui colunas no SQL (`option_code`, `change_type`, `previous_data`, `new_data`, `notes`) completamente divergentes dos campos enviados pelo frontend em [`src/app/admin/fornecedores/page.tsx`](file:///d:/Z_UEB/TIONENE/src/app/admin/fornecedores/page.tsx) (`tariff_code`, `field_changed`, `old_value`, `new_value`, `change_reason`), o que provoca falha silenciosa ou erro de execução na gravação de logs de auditoria.
  - Ao salvar edições de contratos em [`src/app/admin/contratos/page.tsx`](file:///d:/Z_UEB/TIONENE/src/app/admin/contratos/page.tsx), os itens existentes em `contract_items` são excluídos (`delete().eq("contract_id", id)`) e reinseridos, o que acarreta a perda em cascata de eventuais alocações de pagamentos a fornecedores (`supplier_payment_allocations`).
  - Telas legadas como [`/admin/reservas`](file:///d:/Z_UEB/TIONENE/src/app/admin/reservas/page.tsx) e [`/admin/parceiros`](file:///d:/Z_UEB/TIONENE/src/app/admin/parceiros/page.tsx) fazem consultas a tabelas inexistentes nas migrações SQL locais (`reservations`, `partner_leads`, `curadoria_leads`, `destinations`).

---

## 2. Arquitetura Atual do Projeto

### 2.1 Stack Tecnológico e Dependências
Conforme verificado em [`package.json`](file:///d:/Z_UEB/TIONENE/package.json):
- **Framework Principal:** Next.js `15.2.1` (App Router)
- **Biblioteca de UI:** React `19.0.0` e React DOM `19.0.0`
- **Linguagem:** TypeScript `5.8.2`
- **BaaS / Banco de Dados:** `@supabase/supabase-js` `2.117.3`
- **ORM Declarado:** Prisma `@prisma/client` `6.4.1` (em desuso operacional)
- **Ícones:** `lucide-react` `1.55.0`
- **Estilização:** CSS puro / Vanilla CSS estruturado via [`src/app/globals.css`](file:///d:/Z_UEB/TIONENE/src/app/globals.css) e [`src/app/admin/admin.css`](file:///d:/Z_UEB/TIONENE/src/app/admin/admin.css). Não há Tailwind CSS configurado.

### 2.2 Organização de Pastas
```text
TIONENE/
├── prisma/
│   └── schema.prisma                    # Schema de referência Prisma (não utilizado em runtime)
├── public/
│   ├── images/                          # Banners, fotos e vetores
│   ├── img/                             # SVGs de logotipos e fotos institucionais
│   └── passeios/                        # Fotos temáticas dos passeios
├── scripts/
│   ├── build_tours_catalog.py           # Script Python para compilação de catálogo
│   └── generate_sql_and_sync.cjs        # Script CJS para sincronizar catálogo via Supabase API
├── src/
│   ├── app/                             # Next.js App Router
│   │   ├── admin/                       # Portal Administrativo
│   │   │   ├── chegadas/page.tsx        # Ledger de chegadas por mês
│   │   │   ├── clientes/page.tsx        # Gestão de clientes e histórico 360°
│   │   │   ├── contratos/page.tsx       # Emissão e gestão de contratos
│   │   │   ├── curadoria/page.tsx       # Leads de Curadoria Bella
│   │   │   ├── custos-fornecedores/page.tsx # Controle financeiro e contas a pagar
│   │   │   ├── fornecedores/page.tsx    # Fornecedores e Catálogo TN-001 a TN-042
│   │   │   ├── layout.tsx               # Shell da administração com sidebar e auth gate
│   │   │   ├── leads/page.tsx           # Triagem e conversão de leads
│   │   │   ├── login/page.tsx           # Tela de autenticação admin
│   │   │   ├── page.tsx                 # Dashboard principal com KPIs
│   │   │   ├── parceiros/page.tsx       # Gestão de parceiros B2B
│   │   │   ├── passeios/page.tsx        # Gestão de passeios (tabela tours)
│   │   │   ├── reservas/page.tsx        # Tela legada de reservas
│   │   │   └── viagem-completa/page.tsx # Gestão de pacotes
│   │   ├── auth/login/page.tsx          # Redirecionador para /admin/login
│   │   ├── cliente/page.tsx             # Área do cliente (atualmente dados mock)
│   │   ├── curadoria-bella/page.tsx     # Landing page Curadoria Bella
│   │   ├── descubra-sua-viagem/page.tsx # Quiz de perfil de viagem
│   │   ├── login/page.tsx               # Redirecionador para /admin/login
│   │   ├── page.tsx                     # Página Inicial institucional
│   │   ├── passeios/                    # Catálogo público e página dinâmica [slug]
│   │   ├── programacao-de-viagem/page.tsx # Roteiro do cliente (mock)
│   │   ├── seja-parceiro/page.tsx       # Página B2B de parcerias
│   │   ├── sobre-nos/page.tsx           # Institucional sobre a agência
│   │   └── viagem-completa/page.tsx     # Pacotes fechados de 6 a 10 dias
│   ├── components/                      # Componentes reutilizáveis e modais
│   ├── config/site.ts                   # Metadados e variáveis de contato globais
│   ├── context/                         # Contextos React (TravelPlannerQuizContext)
│   ├── data/                            # Catálogos canônicos e mocks em TypeScript
│   └── lib/                             # Utilitários (supabase.ts, cost-calculator.ts, prisma.ts)
└── supabase/
    ├── backoffice_v1_schema.sql         # DDL da versão 1 do backoffice
    ├── import_tours_catalog.sql         # Carga SQL do catálogo de passeios
    ├── lead_funnel_schema.sql           # DDL do funil de captura de leads
    └── migrations/                      # Migrações versionadas (V1, Catálogo V2)
```

### 2.3 Estrutura de Rotas, APIs e Server Actions
- **Ausência de APIs e Server Actions:** Não existem manipuladores de rota em `src/app/api/` e não há nenhuma Server Action (`"use server"`) implementada.
- **Modelo de Comunicação:** Todas as páginas interativas utilizam a diretiva `"use client"` e invocam diretamente os métodos do SDK `@supabase/supabase-js` a partir do navegador do cliente ou utilizam dados estáticos em memória.
- **Ausência de Middleware Server-Side:** Não há arquivo `middleware.ts` na raiz ou em `src/`. As requisições HTTP não são interceptadas no nível de borda ou servidor.

### 2.4 Sistema de Autenticação e Permissões
- Implementado em [`src/app/admin/layout.tsx`](file:///d:/Z_UEB/TIONENE/src/app/admin/layout.tsx) através de um efeito React (`useEffect`) que executa `supabase.auth.getSession()`.
- Se não houver sessão ativa, o navegador é redirecionado via `window.location.href = "/admin/login"`.
- O login é processado em [`src/app/admin/login/page.tsx`](file:///d:/Z_UEB/TIONENE/src/app/admin/login/page.tsx) com `supabase.auth.signInWithPassword({ email, password })`.
- **Fragilidade de Segurança:** A proteção é exclusivamente client-side (SPA). Usuários sem autenticação que desabilitem JavaScript ou inspecionem os bundles podem carregar o código dos componentes. Além disso, as políticas de banco RLS no Supabase estão configuradas com `FOR ALL USING (true)`, permitindo operações de escrita mesmo com a chave anônima pública.

### 2.5 Integrações Externas
1. **Supabase Cloud:** Autenticação de usuários administrativos e banco de dados PostgreSQL.
2. **WhatsApp Web (wa.me):** Disparo de mensagens pré-formatadas para atendimento humano a partir dos formulários e modais.
3. **Google Fonts:** Tipografias *Alegreya Sans* e *Ibarra Real Nova*.

---

## 3. Inventário de Módulos e Funcionalidades

| Módulo / Funcionalidade | Status | Telas Existentes | Tabelas / Serviços | O que está implementado | O que parece incompleto / Riscos |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Painel Dashboard Geral** | IMPLEMENTADA NO CÓDIGO | [`/admin`](file:///d:/Z_UEB/TIONENE/src/app/admin/page.tsx) | `leads`, `clients`, `contracts`, `suppliers`, `tours` | Cards com contadores de leads, clientes, contratos, chegadas do mês, fornecedores e passeios. Tabelas de leads e contratos recentes. | Não possui gráficos analíticos; contagem de passeios recorre a fallback estático se o banco retornar vazio. |
| **Gestão de Clientes** | IMPLEMENTADA NO CÓDIGO | [`/admin/clientes`](file:///d:/Z_UEB/TIONENE/src/app/admin/clientes/page.tsx) | `clients`, `contracts`, `contract_items` | CRUD cadastral de clientes (nome, CPF, documento, telefone, e-mail, hotel). Modal de Ficha 360° exibindo histórico de contratos e passeios contratados. Ação de emissão de novo contrato vinculado. | Sem máscara/validação estrita de CPF/Passaporte; sem histórico de alterações de dados cadastrais. |
| **Emissão de Contratos** | IMPLEMENTADA NO CÓDIGO | [`/admin/contratos`](file:///d:/Z_UEB/TIONENE/src/app/admin/contratos/page.tsx) | `contracts`, `contract_items`, `clients`, `leads`, `suppliers`, `tours` | Emissão de contratos completos com número gerado (TN-AAAA-XXXX), vinculação a clientes e leads, cronograma de hotéis (JSONB), voos, cálculo de sinal (30%) e saldo. Motor de cálculo de custos integrado (TN-001 a TN-042). Cláusulas contratuais editáveis (1ª a 18ª). Modal de impressão formatado. | A edição de contratos deleta todos os `contract_items` e os recria, o que quebra relacionamentos com `supplier_payment_allocations`. |
| **Chegadas no Mês** | IMPLEMENTADA NO CÓDIGO | [`/admin/chegadas`](file:///d:/Z_UEB/TIONENE/src/app/admin/chegadas/page.tsx) | `contracts`, `contract_items` | Calendário/ledger mensal navegável por ano/mês. Agrupamento por dia de chegada, listagem de passageiros (adultos/crianças/infantes), voos, hotéis, status de depósito/saldo e lista de passeios. | Modo estritamente de consulta; não permite registrar check-in operacional do cliente diretamente nesta tela. |
| **Custos por Fornecedor** | IMPLEMENTADA NO CÓDIGO | [`/admin/custos-fornecedores`](file:///d:/Z_UEB/TIONENE/src/app/admin/custos-fornecedores/page.tsx) | `contract_items`, `contracts`, `suppliers` | Apuração de contas a pagar por competência (data do passeio). Filtro por fornecedor e mês. Totalizadores multimoeda (USD, BRL, MXN). Itens calculados vs. pendentes de revisão. Impressão de espelho de custos. | Não permite registrar pagamentos ou abater saldos das tabelas `supplier_payments` e `supplier_payment_allocations`. |
| **Gestão de Fornecedores & Tarifas** | PARCIALMENTE IMPLEMENTADA | [`/admin/fornecedores`](file:///d:/Z_UEB/TIONENE/src/app/admin/fornecedores/page.tsx) | `suppliers`, `supplier_cost_options`, `supplier_cost_audit_log` | Aba 1: CRUD de fornecedores locais. Aba 2: Tabela de 42 opções de custo (TN-001 a TN-042) com filtros de modelo e status. Edição de valores unitários e regras de precificação. | O formulário de auditoria envia colunas divergentes do schema SQL (`tariff_code` em vez de `option_code`, etc.), gerando erro na gravação da auditoria. |
| **Catálogo de Passeios (Admin)** | PARCIALMENTE IMPLEMENTADA | [`/admin/passeios`](file:///d:/Z_UEB/TIONENE/src/app/admin/passeios/page.tsx) | `tours`, `destinations` | Formulário para criar, editar e desativar passeios no Supabase. Inclusão de itens inclusos/não inclusos e upload de imagem. | A vitrine pública (`/passeios`) não consome a tabela `tours`, tornando as alterações do admin invisíveis aos clientes finais. Consulta tabela `destinations` inexistente nas migrations locais. |
| **Vitrine Pública de Passeios** | PARCIALMENTE IMPLEMENTADA | [`/passeios`](file:///d:/Z_UEB/TIONENE/src/app/passeios/page.tsx), [`/passeios/[slug]`](file:///d:/Z_UEB/TIONENE/src/app/passeios/%5Bslug%5D/page.tsx) | Dados estáticos em [`src/data/tours.ts`](file:///d:/Z_UEB/TIONENE/src/data/tours.ts) | Listagem com filtros de categorias, modal de detalhes do passeio, montador de roteiro dinâmico, página completa por slug com galeria, itinerário e FAQ. | Totalmente desconectada do banco de dados do Supabase. Preços e passeios são hardcoded. |
| **Captura de Leads (Site)** | IMPLEMENTADA NO CÓDIGO | [`LeadCaptureModal.tsx`](file:///d:/Z_UEB/TIONENE/src/components/LeadCaptureModal.tsx), [`/admin/leads`](file:///d:/Z_UEB/TIONENE/src/app/admin/leads/page.tsx) | `leads`, `clients` | Captura modal no catálogo de passeios com salvamento imediato em `public.leads` antes de abrir o WhatsApp. No admin: listagem, alteração de status e botão "Converter em Cliente". | Leads originados do quiz em [`TravelPlannerQuiz.tsx`](file:///d:/Z_UEB/TIONENE/src/components/TravelPlannerQuiz.tsx) e de pacotes em [`TripPackageModal.tsx`](file:///d:/Z_UEB/TIONENE/src/components/TripPackageModal.tsx) não gravam em `leads` (apenas abrem WhatsApp ou gravam em sessionStorage). |
| **Pacotes de Viagem Completa** | PARCIALMENTE IMPLEMENTADA | [`/admin/viagem-completa`](file:///d:/Z_UEB/TIONENE/src/app/admin/viagem-completa/page.tsx), [`/viagem-completa`](file:///d:/Z_UEB/TIONENE/src/app/viagem-completa/page.tsx) | `travel_packages` (apenas Prisma/Admin) | Tela administrativa para gerenciar pacotes de viagem. No site público: apresentação visual dos pacotes Essencial, Oficial, Completo e Assinatura. | A tabela `travel_packages` não possui DDL em nenhum arquivo SQL na pasta `supabase/`. O modal público [`TripPackageModal.tsx`](file:///d:/Z_UEB/TIONENE/src/components/TripPackageModal.tsx) usa dados estáticos e não grava leads no banco. |
| **Curadoria Bella VIP** | PARCIALMENTE IMPLEMENTADA | [`/admin/curadoria`](file:///d:/Z_UEB/TIONENE/src/app/admin/curadoria/page.tsx), [`/curadoria-bella`](file:///d:/Z_UEB/TIONENE/src/app/curadoria-bella/page.tsx) | `curadoria_leads` | Tela administrativa para visualizar e alterar status de leads de alto padrão. Landing page com manifesto e chamada ao quiz. | A tabela `curadoria_leads` não existe nas migrações SQL. O quiz público redireciona diretamente ao WhatsApp sem gravar registro no banco. |
| **Parceiros B2B** | PARCIALMENTE IMPLEMENTADA | [`/admin/parceiros`](file:///d:/Z_UEB/TIONENE/src/app/admin/parceiros/page.tsx), [`/seja-parceiro`](file:///d:/Z_UEB/TIONENE/src/app/seja-parceiro/page.tsx) | `partner_leads` | Painel para acompanhar agentes de viagem, operadoras e creators. Página pública com formulário e modal. | A tabela `partner_leads` não existe nas migrações SQL locais. O componente [`PartnerModal.tsx`](file:///d:/Z_UEB/TIONENE/src/components/PartnerModal.tsx) gera texto para WhatsApp sem gravar no banco. |
| **Operacional de Reservas** | NÃO ENCONTRADA (LEGADA) | [`/admin/reservas`](file:///d:/Z_UEB/TIONENE/src/app/admin/reservas/page.tsx) | `reservations` | Código de tela herdado para controle de reservas com booking code e itinerário. | Removida da navegação lateral do admin (`NAV_ITEMS`). Tabela `reservations` não existe no schema atual. A operação oficial foi absorvida por `contracts`. |
| **Área do Cliente** | PARCIALMENTE IMPLEMENTADA | [`/cliente`](file:///d:/Z_UEB/TIONENE/src/app/cliente/page.tsx), [`/programacao-de-viagem`](file:///d:/Z_UEB/TIONENE/src/app/programacao-de-viagem/page.tsx) | Dados estáticos em [`src/data/mock-client-2.ts`](file:///d:/Z_UEB/TIONENE/src/data/mock-client-2.ts) | Layout moderno com timeline de viagem, cards de passeios confirmados, voucher visual e resumo financeiro. | 100% estático. Não aceita ID/token de cliente ou contrato via URL e não busca dados do Supabase. |
| **Pagamentos a Fornecedores** | PARCIALMENTE IMPLEMENTADA | Nenhuma tela de UI | `supplier_payments`, `supplier_payment_allocations` | Estrutura de tabelas e modelos Prisma criados na migração V2 para quitações financeiras. | Nenhuma tela administrativa ou endpoint implementa inserção, visualização ou baixa de pagamentos a fornecedores. |
| **Configurações Administrativas** | NÃO ENCONTRADA | Nenhuma | `site_settings` (apenas Prisma) | Apenas modelo no `schema.prisma`. | Sem tela ou funcionalidade implementada no código. Dados de contato são lidos de [`src/config/site.ts`](file:///d:/Z_UEB/TIONENE/src/config/site.ts). |

---

## 4. Estrutura do Banco de Dados

> **Nota sobre o Ambiente:** A análise a seguir foi realizada estritamente a partir da inspeção dos arquivos DDL, migrações SQL locais e mapeamentos de código, em total conformidade com as regras de leitura e proteção de credenciais.

### 4.1 Tabelas Estruturadas e Migradas no Supabase

#### 1. `public.suppliers` (Fornecedores Locais)
- **Origem:** [`supabase/backoffice_v1_schema.sql`](file:///d:/Z_UEB/TIONENE/supabase/backoffice_v1_schema.sql) e [`supabase/migrations/20261020_supplier_catalog_v2.sql`](file:///d:/Z_UEB/TIONENE/supabase/migrations/20261020_supplier_catalog_v2.sql)
- **Campos:** `id` (UUID PK), `name` (TEXT UNIQUE), `trade_name` (TEXT), `contact_name` (TEXT), `phone` (TEXT), `whatsapp` (TEXT), `email` (TEXT), `category` (TEXT), `currency_default` (TEXT), `payment_terms` (TEXT), `notes` (TEXT), `active` (BOOLEAN), `status` (TEXT), `created_at`, `updated_at`.
- **Relacionamentos:** 1:N com `supplier_cost_options`, 1:N com `contract_items`, 1:N com `supplier_payments`.
- **Regras:** 9 fornecedores aprovados pelo catálogo comercial: *Baktun, Coco Bongo, Envatours, MTZ Tours, MUSA, Parasailing & Jet Ski, Playamia, Puerto Maya, Miguel Shuttle*. Fornecedores históricos desativados com status `'excluido_historico'` (*Grupo Xcaret, The Dolphin Company, Neftali Transportes, Aquatours, Francisco Murrieta, Tamyfer Locadora*).

#### 2. `public.supplier_cost_options` (Catálogo Canônico TN-001 a TN-042)
- **Origem:** [`supabase/migrations/20261020_supplier_catalog_v2.sql`](file:///d:/Z_UEB/TIONENE/supabase/migrations/20261020_supplier_catalog_v2.sql)
- **Campos:** `id` (UUID PK), `code` (TEXT UNIQUE, ex: 'TN-001'), `supplier_id` (FK `suppliers.id`), `supplier_name` (TEXT), `service_name` (TEXT), `variant` (TEXT), `pricing_model` (TEXT: `per_person`, `fixed_vessel`, `fixed_jetski`, `per_vehicle_leg`, `quote_required`), `cost_adult` (NUMERIC), `cost_child` (NUMERIC), `cost_infant` (NUMERIC), `cost_fixed` (NUMERIC), `currency` (TEXT), `pricing_rule` (TEXT), `external_fees_note` (TEXT), `operation_days` (TEXT), `operation_hours` (TEXT), `duration` (TEXT), `description` (TEXT), `included` (TEXT), `not_included` (TEXT), `operational_notes` (TEXT), `commercial_notes` (TEXT), `pending_issues` (TEXT), `source_reference` (TEXT), `validation_status` (TEXT: `revisado`, `ressalva_conteudo`, `ressalva_tarifa`, `horario_pendente`, `info_pendente`, `estimado`, `sob_cotacao`), `public_tour_slug` (TEXT), `active` (BOOLEAN), `created_at`, `updated_at`.
- **Relacionamentos:** N:1 com `suppliers`, 1:N com `contract_items`, 1:N com `supplier_cost_audit_log`.

#### 3. `public.supplier_cost_audit_log` (Auditoria de Custos)
- **Origem:** [`supabase/migrations/20261020_supplier_catalog_v2.sql`](file:///d:/Z_UEB/TIONENE/supabase/migrations/20261020_supplier_catalog_v2.sql)
- **Campos:** `id` (UUID PK), `supplier_cost_option_id` (FK `supplier_cost_options.id`), `option_code` (TEXT), `changed_by` (TEXT), `change_type` (TEXT), `previous_data` (JSONB), `new_data` (JSONB), `notes` (TEXT), `created_at`.
- **Nota Crítica:** Conforme detalhado na seção 5, há divergência de nomenclatura entre as colunas deste DDL e o código que executa o `insert` no frontend.

#### 4. `public.clients` (Cadastro Central de Clientes)
- **Origem:** [`supabase/backoffice_v1_schema.sql`](file:///d:/Z_UEB/TIONENE/supabase/backoffice_v1_schema.sql)
- **Campos:** `id` (UUID PK), `name` (TEXT), `cpf` (TEXT), `document_id` (TEXT), `email` (TEXT), `phone` (TEXT), `whatsapp` (TEXT), `default_hotel` (TEXT), `notes` (TEXT), `created_at`, `updated_at`.
- **Relacionamentos:** 1:N com `contracts`, 1:N com `leads` (via `converted_client_id`).

#### 5. `public.contracts` (Contratos / Reservas-Mãe da Agência)
- **Origem:** [`supabase/backoffice_v1_schema.sql`](file:///d:/Z_UEB/TIONENE/supabase/backoffice_v1_schema.sql)
- **Campos:** `id` (UUID PK), `contract_number` (TEXT UNIQUE), `client_id` (FK `clients.id`), `client_name` (TEXT), `client_cpf` (TEXT), `client_phone` (TEXT), `client_email` (TEXT), `arrival_date` (DATE), `departure_date` (DATE), `arrival_flight_number` (TEXT), `arrival_flight_time` (TEXT), `depart_flight_number` (TEXT), `depart_flight_time` (TEXT), `adults_count` (INT), `children_count` (INT), `infants_count` (INT), `hotels_schedule` (JSONB), `deposit_amount` (NUMERIC), `deposit_observation` (TEXT), `balance_amount` (NUMERIC), `balance_observation` (TEXT), `total_amount` (NUMERIC), `currency` (TEXT), `status` (TEXT: `rascunho`, `emitido`, `assinado`, `cancelado`), `terms_clauses` (TEXT), `internal_notes` (TEXT), `created_at`, `updated_at`.
- **Relacionamentos:** N:1 com `clients`, 1:N com `contract_items`.

#### 6. `public.contract_items` (Itens de Passeios e Snapshots de Custo)
- **Origem:** [`supabase/backoffice_v1_schema.sql`](file:///d:/Z_UEB/TIONENE/supabase/backoffice_v1_schema.sql) e [`supabase/migrations/20261020_supplier_catalog_v2.sql`](file:///d:/Z_UEB/TIONENE/supabase/migrations/20261020_supplier_catalog_v2.sql)
- **Campos:** `id` (UUID PK), `contract_id` (FK `contracts.id` ON DELETE CASCADE), `tour_id` (UUID FK `tours.id`), `supplier_id` (UUID FK `suppliers.id`), `supplier_cost_option_id` (UUID FK `supplier_cost_options.id`), `tour_date` (DATE), `tour_name_snapshot` (TEXT), `tour_included_snapshot` (TEXT), `tour_not_included_snapshot` (TEXT), `supplier_name_snapshot` (TEXT), `tariff_code_snapshot` (TEXT), `pricing_model_snapshot` (TEXT), `adults_count` (INT), `children_count` (INT), `infants_count` (INT), `units_count` (INT), `sale_price` (NUMERIC), `cost_applied` (NUMERIC), `cost_currency` (TEXT), `calculated_total_cost` (NUMERIC), `cost_status` (TEXT), `external_fees_snapshot` (TEXT), `currency_exchange_rate` (NUMERIC), `calculation_breakdown` (JSONB), `voucher_ref` (TEXT), `status` (TEXT: `agendado`, `confirmado_fornecedor`, `realizado`, `cancelado`), `notes` (TEXT), `created_at`, `updated_at`.
- **Relacionamentos:** N:1 com `contracts`, N:1 com `suppliers`, N:1 com `supplier_cost_options`, 1:N com `supplier_payment_allocations`.

#### 7. `public.supplier_payments` e `public.supplier_payment_allocations`
- **Origem:** [`supabase/migrations/20261020_supplier_catalog_v2.sql`](file:///d:/Z_UEB/TIONENE/supabase/migrations/20261020_supplier_catalog_v2.sql)
- **Tabela `supplier_payments`:** `id` (UUID PK), `supplier_id` (FK `suppliers.id`), `payment_date` (DATE), `amount` (NUMERIC), `currency` (TEXT), `payment_method` (TEXT), `reference_code` (TEXT), `notes` (TEXT), `created_by` (TEXT), `created_at`.
- **Tabela `supplier_payment_allocations`:** `id` (UUID PK), `payment_id` (FK `supplier_payments.id` ON DELETE CASCADE), `contract_item_id` (FK `contract_items.id` ON DELETE CASCADE), `allocated_amount` (NUMERIC), `created_at`, `UNIQUE(payment_id, contract_item_id)`.

#### 8. `public.leads` (Funil de Captura)
- **Origem:** [`supabase/lead_funnel_schema.sql`](file:///d:/Z_UEB/TIONENE/supabase/lead_funnel_schema.sql)
- **Campos:** `id` (UUID PK), `name` (TEXT), `phone` (TEXT), `email` (TEXT), `source` (TEXT), `interest_type` (TEXT), `interest_name` (TEXT), `interest_slug` (TEXT), `selected_items` (JSONB), `notes` (TEXT), `status` (TEXT: `novo`, `em_atendimento`, `convertido`, `perdido`), `converted_client_id` (FK `clients.id`), `created_at`, `updated_at`.

#### 9. `public.tours` (Catálogo no Banco)
- **Origem:** [`supabase/import_tours_catalog.sql`](file:///d:/Z_UEB/TIONENE/supabase/import_tours_catalog.sql)
- **Campos:** `id` (UUID PK), `slug` (TEXT UNIQUE), `name` (TEXT), `category` (TEXT[]), `description` (TEXT), `short_description` (TEXT), `price` (NUMERIC), `price_label` (TEXT), `contact_only` (BOOLEAN), `duration` (TEXT), `start_time` (TEXT), `end_time` (TEXT), `location` (TEXT), `minimum_age` (TEXT), `infant_policy` (TEXT), `included` (TEXT[]), `not_included` (TEXT[]), `what_to_bring` (TEXT[]), `important_info` (TEXT[]), `highlights` (TEXT[]), `cancellation_policy` (TEXT), `accessibility` (TEXT), `image_url` (TEXT), `gallery` (TEXT[]), `categories` (TEXT[]), `faqs` (JSONB), `itinerary` (JSONB), `active` (BOOLEAN), `featured` (BOOLEAN), `destination_id` (UUID), `created_at`, `updated_at`.

### 4.2 Políticas de Segurança (Row Level Security - RLS)
Todas as tabelas do banco possuem RLS habilitado, porém as políticas criadas em desenvolvimento são excessivamente permissivas:
```sql
CREATE POLICY "Public read suppliers" ON public.suppliers FOR SELECT USING (true);
CREATE POLICY "Admin modify suppliers" ON public.suppliers FOR ALL USING (true);
CREATE POLICY "Public read contracts" ON public.contracts FOR SELECT USING (true);
CREATE POLICY "Admin modify contracts" ON public.contracts FOR ALL USING (true);
CREATE POLICY "Public insert leads" ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin select leads" ON public.leads FOR SELECT USING (true);
CREATE POLICY "Admin update leads" ON public.leads FOR ALL USING (true);
```
**Implicação Técnica:** Qualquer usuário munido da chave anônima pública (`anon key`) consegue ler ou modificar diretamente contratos, fornecedores, itens e dados sensíveis de clientes via chamadas REST na API do Supabase sem necessidade de autenticação.

---

## 5. Regras de Negócio Identificadas

1. **Snapshots Imutáveis de Reserva:** Ao emitir um contrato, as informações do passeio (`tour_name_snapshot`, `tour_included_snapshot`, `supplier_name_snapshot`, `tariff_code_snapshot`, `calculated_total_cost`) são gravadas como valores fixos em `contract_items`. Modificações futuras no catálogo de fornecedores não alteram o histórico contratado do cliente.
2. **Automação de Sinal e Saldo:** O valor de entrada (`deposit_amount`) é pré-calculado em **30% do total da venda**, gerando automaticamente a observação `"Sinal via PIX"`. O saldo remanescente de **70%** (`balance_amount`) recebe a observação `"Saldo a acertar no check-in em Cancún"`.
3. **Sincronização Bidirecional Lead ↔ Cliente:** Quando um lead é convertido em cliente, o sistema insere o registro na tabela `clients` e grava a referência `converted_client_id` em `leads`. Ao emitir um contrato para um lead, as notas estruturadas (voos, hotéis, contagem de passageiros) são automaticamente analisadas via Expressões Regulares (`parseLeadNotes`) e transferidas para os campos correspondentes do contrato.
4. **Validações Específicas por Fornecedor:**
   - **Coco Bongo:** Regras estritas por dia da semana (`validateCocoBongoDay` em [`src/lib/cost-calculator.ts`](file:///d:/Z_UEB/TIONENE/src/lib/cost-calculator.ts)): opções TN-004, 007, 009, 010, 012 somente de domingo a quarta; TN-005 de domingo a quinta; TN-006 exclusiva para sextas-feiras; TN-008, 011, 013 apenas de quinta a sábado.
   - **Miguel Shuttle:** Vans privativas com capacidade estrita de até 7 passageiros. Grupos maiores de 7 passageiros acionam aviso de dimensionamento para múltiplos veículos (`suggestedVehicles = Math.ceil(pax / 7)`).
   - **Puerto Maya Jungle Tour (TN-036):** Transporte de USD 8 por pessoa já é somado internamente ao custo do operador (Adulto USD 25+8 = 33; Criança USD 15+8 = 23).
   - **MUSA (TN-028):** Dispara alerta operacional caso o serviço seja agendado para um domingo.

---

## 6. Flexibilidade Administrativa Existente

| Ação Administrativa | É Possível Fazer Manualmente? | Como Funciona no Código | Limitações Identificadas |
| :--- | :--- | :--- | :--- |
| **Edição de Fornecedores** | SIM | Modal em [`/admin/fornecedores`](file:///d:/Z_UEB/TIONENE/src/app/admin/fornecedores/page.tsx) atualiza dados cadastrais, termos de pagamento e status ativo/inativo. | Não impede a exclusão lógica de fornecedores que possuam contratos ativos vinculados. |
| **Alteração de Custos do Catálogo** | SIM | Modal de edição de opção tarifária (TN-xxx) em [`/admin/fornecedores`](file:///d:/Z_UEB/TIONENE/src/app/admin/fornecedores/page.tsx). | A gravação do log de auditoria falha por divergência de nomes de colunas no SQL. |
| **Sobrescrita Manual de Custos no Contrato** | SIM | Em [`/admin/contratos`](file:///d:/Z_UEB/TIONENE/src/app/admin/contratos/page.tsx), os campos `cost_applied`, `sale_price` e `calculated_total_cost` são editáveis linha por linha para cada passeio. | Não exige justificativa obrigatória ao alterar valores abaixo da tabela de custo. |
| **Edição de Reservas e Contratos** | SIM | O administrador pode reabrir qualquer contrato, alterar datas de voos, hotéis, passageiros e status (`rascunho`, `emitido`, `assinado`, `cancelado`). | Recriar itens do contrato apaga em cascata eventuais alocações de quitação financeira. |
| **Ajuste de Cláusulas Contratuais** | SIM | Campo de texto rico em [`/admin/contratos`](file:///d:/Z_UEB/TIONENE/src/app/admin/contratos/page.tsx) pré-carregado com as 18 cláusulas padrão, permitindo edição pontual. | Modificações não possuem versionamento de minutas. |
| **Histórico e Auditoria** | PARCIAL | Tela de Ficha do Cliente exibe contratos anteriores. | A tabela `supplier_cost_audit_log` não é visualizável em nenhuma tela e sua gravação está com erro de schema. |

---

## 7. Funcionalidades Incompletas ou Ausentes

1. **Gestão Financeira de Pagamentos a Fornecedores (Quitações):**
   - As tabelas `supplier_payments` e `supplier_payment_allocations` foram concebidas no DDL V2, mas não existe nenhuma interface para registrar pagamentos parciais, adiantamentos ou conciliação bancária aos operadores.
2. **Sincronização entre Vitrine Pública e Catálogo do Admin:**
   - A vitrine de passeios ([`/passeios`](file:///d:/Z_UEB/TIONENE/src/app/passeios/page.tsx) e [`/passeios/[slug]`](file:///d:/Z_UEB/TIONENE/src/app/passeios/%5Bslug%5D/page.tsx)) opera exclusivamente sobre [`src/data/tours.ts`](file:///d:/Z_UEB/TIONENE/src/data/tours.ts), ignorando por completo as inclusões e edições realizadas no módulo [`/admin/passeios`](file:///d:/Z_UEB/TIONENE/src/app/admin/passeios/page.tsx).
3. **Portal do Cliente / Programação de Viagem (`/cliente` e `/programacao-de-viagem`):**
   - Atualmente consomem objetos estáticos de mock ([`src/data/mock-client-2.ts`](file:///d:/Z_UEB/TIONENE/src/data/mock-client-2.ts)). Não há mecanismo de consulta por token ou código de contrato.
4. **Captura Unificada de Leads nos Quizzes e Pacotes:**
   - [`src/components/TravelPlannerQuiz.tsx`](file:///d:/Z_UEB/TIONENE/src/components/TravelPlannerQuiz.tsx), [`src/components/PartnerModal.tsx`](file:///d:/Z_UEB/TIONENE/src/components/PartnerModal.tsx) e [`src/components/TripPackageModal.tsx`](file:///d:/Z_UEB/TIONENE/src/components/TripPackageModal.tsx) não gravam no banco de dados; dependem exclusivamente do envio manual via WhatsApp pelo usuário.
5. **Módulos com Tabelas Ausentes nas Migrações:**
   - [`/admin/curadoria`](file:///d:/Z_UEB/TIONENE/src/app/admin/curadoria/page.tsx) busca a tabela `curadoria_leads` (inexistente nos arquivos SQL).
   - [`/admin/parceiros`](file:///d:/Z_UEB/TIONENE/src/app/admin/parceiros/page.tsx) busca a tabela `partner_leads` (inexistente nos arquivos SQL).
   - [`/admin/viagem-completa`](file:///d:/Z_UEB/TIONENE/src/app/admin/viagem-completa/page.tsx) busca a tabela `travel_packages` (inexistente nos arquivos SQL).
   - [`/admin/reservas`](file:///d:/Z_UEB/TIONENE/src/app/admin/reservas/page.tsx) busca a tabela `reservations` (inexistente nos arquivos SQL).

---

## 8. Riscos Técnicos e Problemas Identificados

| Problema Identificado | Arquivos Envolvidos | Nível de Criticidade | Impacto no Negócio |
| :--- | :--- | :--- | :--- |
| **Exclusão e recriação de itens de contrato ao salvar** | [`src/app/admin/contratos/page.tsx`](file:///d:/Z_UEB/TIONENE/src/app/admin/contratos/page.tsx#L1048-L1050), [`supabase/migrations/20261020_supplier_catalog_v2.sql`](file:///d:/Z_UEB/TIONENE/supabase/migrations/20261020_supplier_catalog_v2.sql#L137) | **CRÍTICO** | Ao editar um contrato existente, a exclusão de `contract_items` dispara um `ON DELETE CASCADE` que apaga definitivamente qualquer histórico de pagamento associado na tabela `supplier_payment_allocations`. |
| **Inconsistência de colunas no log de auditoria** | [`src/app/admin/fornecedores/page.tsx`](file:///d:/Z_UEB/TIONENE/src/app/admin/fornecedores/page.tsx#L276-L295), [`supabase/migrations/20261020_supplier_catalog_v2.sql`](file:///d:/Z_UEB/TIONENE/supabase/migrations/20261020_supplier_catalog_v2.sql#L94-L104) | **CRÍTICO** | O código tenta inserir `tariff_code`, `field_changed`, `old_value`, `new_value`, `change_reason`, enquanto a tabela no banco espera `option_code`, `change_type`, `previous_data`, `new_data`, `notes`. O Supabase rejeitará a gravação com erro de coluna inexistente. |
| **Políticas RLS públicas sem autenticação real** | [`supabase/backoffice_v1_schema.sql`](file:///d:/Z_UEB/TIONENE/supabase/backoffice_v1_schema.sql#L151-L175), [`supabase/migrations/20261020_supplier_catalog_v2.sql`](file:///d:/Z_UEB/TIONENE/supabase/migrations/20261020_supplier_catalog_v2.sql#L162-L181) | **ALTO** | O RLS permite leitura e gravação universal (`USING (true)`). Qualquer pessoa com a URL do Supabase e a anon key pública pode ler a tabela `contracts` (contendo CPF, voos, telefones e e-mails de clientes) ou alterar tarifas de custos. |
| **Desconexão entre Vitrine e Backoffice** | [`src/app/passeios/page.tsx`](file:///d:/Z_UEB/TIONENE/src/app/passeios/page.tsx), [`src/app/passeios/[slug]/page.tsx`](file:///d:/Z_UEB/TIONENE/src/app/passeios/%5Bslug%5D/page.tsx), [`src/app/admin/passeios/page.tsx`](file:///d:/Z_UEB/TIONENE/src/app/admin/passeios/page.tsx) | **ALTO** | O administrador atualiza valores ou desativa passeios no admin, mas os clientes continuam vendo os preços e passeios antigos fixados no código estático. |
| **Perda de leads nos formulários do quiz e pacotes** | [`src/components/TravelPlannerQuiz.tsx`](file:///d:/Z_UEB/TIONENE/src/components/TravelPlannerQuiz.tsx), [`src/components/TripPackageModal.tsx`](file:///d:/Z_UEB/TIONENE/src/components/TripPackageModal.tsx), [`src/components/PartnerModal.tsx`](file:///d:/Z_UEB/TIONENE/src/components/PartnerModal.tsx) | **ALTO** | Se o visitante preencher o formulário e desistir de enviar a mensagem no WhatsApp, o contato e as respostas do quiz não ficam armazenados em nenhum lugar. |
| **Prisma configurado mas inoperante** | [`prisma/schema.prisma`](file:///d:/Z_UEB/TIONENE/prisma/schema.prisma), [`.env`](file:///d:/Z_UEB/TIONENE/.env) | **MÉDIO** | Cria confusão de manutenção: desenvolvedores podem presumir que o Prisma está sincronizando o banco, quando na verdade as strings de conexão estão comentadas e o Prisma não é chamado em runtime. |
| **Ausência total de suíte de testes automatizados** | [`package.json`](file:///d:/Z_UEB/TIONENE/package.json) | **MÉDIO** | Não há testes unitários para validar a exatidão das 42 fórmulas de cálculo de fornecedores e cenários de contratos. |

---

## 9. Limitações da Análise

- A auditoria baseou-se inteiramente no repositório de código e nos arquivos SQL locais existentes em `d:\Z_UEB\TIONENE`.
- Não foram executadas consultas diretas de leitura na instância remota do Supabase para verificar se tabelas ausentes nas migrações locais (`curadoria_leads`, `partner_leads`, `travel_packages`) foram criadas de forma ad-hoc via dashboard web pelo cliente.
- Conforme instrução expressa da tarefa, a versão em arquivo ZIP `Tio_Nene_Phase_1_v0.1.43` não foi analisada nem comparada neste relatório.

---

## 10. Recomendações de Áreas para Investigação Posterior

1. **Auditoria de Tabelas Remotas no Supabase:**
   - Verificar via consulta estrita de leitura (`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`) se as tabelas `curadoria_leads`, `partner_leads` e `travel_packages` já existem no ambiente de produção.
2. **Refatoração da Persistência de `contract_items`:**
   - Substituir a estratégia destrutiva de `delete().eq("contract_id", id)` por um algoritmo de *upsert* diferencial (atualizar itens mantendo o mesmo UUID e remover apenas os expressamente excluídos pelo usuário), garantindo a integridade referencial com pagamentos a fornecedores.
3. **Correção Imediata da Nomenclatura no Log de Auditoria:**
   - Equalizar os campos enviados em [`src/app/admin/fornecedores/page.tsx`](file:///d:/Z_UEB/TIONENE/src/app/admin/fornecedores/page.tsx) com o schema SQL de `supplier_cost_audit_log`.
4. **Unificação do Catálogo de Passeios:**
   - Decidir se o catálogo público deve ler a tabela `tours` do Supabase via Server Component com revalidação de cache ou se deve permanecer como catálogo estático versionado via Git.
5. **Implementação de RLS Restritivo:**
   - Criar políticas RLS no Supabase baseadas em papéis (`auth.jwt() -> role = 'authenticated'`) para impedir leitura pública de contratos, fornecedores e clientes por usuários anônimos.
6. **Fechamento do Funil de Leads:**
   - Conectar [`TravelPlannerQuiz.tsx`](file:///d:/Z_UEB/TIONENE/src/components/TravelPlannerQuiz.tsx) e [`TripPackageModal.tsx`](file:///d:/Z_UEB/TIONENE/src/components/TripPackageModal.tsx) à tabela `public.leads` com o mesmo padrão já validado em [`LeadCaptureModal.tsx`](file:///d:/Z_UEB/TIONENE/src/components/LeadCaptureModal.tsx).
