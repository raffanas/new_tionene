# Relatório de Análise e Auditoria: Painel Administrativo Tio Nenê

> **Data da Auditoria:** Outubro de 2026  
> **Origem analisada:** `d:\Z_UEB\TIONENE\tionene-antigo`  
> **Destino alvo:** `d:\Z_UEB\TIONENE` (Site Atual em Next.js 15 App Router)

---

## 1. Resumo Executivo & Viabilidade Técnica

### 1.1 O que encontramos no projeto antigo?
O projeto em `tionene-antigo` é uma aplicação completa construída originalmente sobre **TanStack Start (Vite + React 19)** com backend e autenticação via **Supabase**. Dentro dele, existe um **Painel de Administração completo e funcional**, projetado especificamente para a operação da agência Tio Nenê em Cancún.

O painel administrativo possui:
- **Design System refinado:** Utiliza Tailwind CSS com a identidade visual da Tio Nenê (tons de terracota, sage, vinho, primary), ícones Lucide e primitivos Radix UI (Shadcn/UI).
- **Layout administrativo com Sidebar colapsável e responsiva** (com suporte a mobile via Sheet/Drawer).
- **Controle de Acesso (RBAC):** Proteção por rotas autenticadas verificando o papel `admin` na tabela `user_roles` do Supabase.
- **10 Módulos de Gestão Prontos:** Cobrindo desde CMS do site até gestão operacional de vouchers e reservas de passageiros.

### 1.2 É viável implantar no site atual?
**Sim, 100% viável e com excelente sinergia técnica!**
- **Mesmo ecossistema React 19:** Ambos os projetos rodam React 19.
- **Portabilidade para Next.js 15:** O layout e os componentes do admin podem ser migrados diretamente para uma rota dedicada no Next.js (ex: `/admin` com `src/app/admin/layout.tsx` e `page.tsx`).
- **Autenticação e Dados:** As variáveis de conexão do Supabase do projeto antigo já foram transferidas para o arquivo `.env` do projeto atual. O painel pode se comunicar diretamente com o Supabase via `@supabase/supabase-js` (usando Client Components ou Server Actions) ou via Prisma ORM que já está iniciado no projeto atual.

---

## 2. Mapa Completo de Módulos do Painel Administrativo

Abaixo está o inventário detalhado de tudo o que está construído e pronto no admin do `tionene-antigo`:

```text
PAINEL ADMINISTRATIVO (/admin)
├── 📊 1. Dashboard Principal (KPIs & Leads Recentes)
├── 🎨 Conteúdo do Site (CMS)
│   ├── 🏠 2. Editor da Home (Hero, Manifesto, 4 Pilares, 3 Tipos de Viagem)
│   ├── 📍 3. Gestão de Destinos (Cancún, Tulum, Holbox, Oaxaca, Los Cabos)
│   ├── 🧭 4. Catálogo de Passeios (Tours, Preços, Categorias, Itens Inclusos)
│   ├── 🧳 5. Viagem Completa (Pacotes de 6 a 10 dias, Inclusões, Preço)
│   ├── ⭐ 6. Curadoria Bella (Gestão de Leads Qualificados de Alto Padrão)
│   └── 💬 7. Depoimentos & Prova Social (Reviews, TripAdvisor, Avaliações)
├── 💼 Comercial & CRM
│   ├── 👥 8. Leads de Parceiros B2B (Agentes, Operadoras, Creators)
│   └── 📅 9. Operacional de Reservas (Vouchers, Itinerário Dia a Dia, Pickups, Convite de Clientes)
└── ⚙️ 10. Configurações do Sistema
```

---

## 3. Detalhamento de Cada Módulo

### 📊 Módulo 1: Dashboard Geral (`/admin`)
- **Objetivo:** Visão geral de desempenho e entrada de novos contatos.
- **Cards de Métricas (KPIs):**
  - **Total de Leads:** Contagem em tempo real com badge de variação mensal.
  - **Novas Reservas:** Total de reservas operacionais registradas.
  - **Visualizações:** Slot preparado para integração analítica.
- **Tabela de Leads Recentes:** Lista rápida com Data, Nome, Perfil, WhatsApp (link direto) e Badge de Status.
- **Tabelas do banco envolvidas:** `partner_leads`, `reservations`.

---

### 🏠 Módulo 2: CMS da Home (`/admin/home`)
- **Objetivo:** Permite alterar os textos e mídias da página inicial sem mexer no código.
- **Sub-editores:**
  - **Hero Editor:** Eyebrow ("TIO NENÊ · CANCÚN"), Título H1, Subtítulo, Labels e Links dos dois botões de CTA, Imagem de fundo da Hero.
  - **Manifesto Editor:** Título e descrição do manifesto da marca, além da edição dos **4 Pilares Editoriais**:
    1. *Curadoria local*
    2. *Experiências reais*
    3. *Operação própria*
    4. *Suporte completo*
  - **Tipos de Viagem Editor:** Gestão dos 3 cards de posicionamento (Viagem Completa, Passeios Avulsos e Curadoria Bella).
- **Tabela do banco envolvida:** `home_sections` (conteúdo versionado em JSONB).

---

### 📍 Módulo 3: Gestão de Destinos (`/admin/destinos`)
- **Objetivo:** Cadastrar e gerenciar as cidades e regiões atendidas no México.
- **Funcionalidades da Listagem:**
  - Tabela com foto, nome, slug, status (Ativo/Inativo) e ações de edição/remoção.
- **Formulário de Cadastro/Edição (`DestinationForm`):**
  - Nome do destino e **Geração automática de slug** amigável.
  - Subtítulo e Descrição curta.
  - Descrição completa e Ordem de exibição (`sort_order`).
  - **Uploader de Imagem de Capa** (`DestinationImageUploader`) com preview e upload para o Supabase Storage.
  - **Campos de SEO Avançado:** Título SEO (`seo_title`), Meta Descrição (`seo_description`) e Imagem Social (`og_image`).
  - Diálogo de confirmação para exclusão segura (`DeleteDestinationDialog`).
- **Tabela do banco envolvida:** `destinations`.

---

### 🧭 Módulo 4: Catálogo de Passeios / Tours (`/admin/passeios`)
- **Objetivo:** Controle central de todos os passeios avulsos vendidos pela agência.
- **Funcionalidades da Listagem:**
  - Tabela completa com miniatura, nome do tour, destino vinculado, preço, etiquetas de categoria, status ativo e indicador de "Destaque" (Featured).
- **Formulário de Cadastro/Edição (`TourForm`):**
  - **Aba Geral:** Nome, slug com validação regex, Destino vinculado (carregado dinamicamente do banco), Preço por adulto, Preço label (ex: "por adulto"), Switch "Preço sob consulta / Apenas contato", Duração estimada (ex: "Dia todo", "6 horas").
  - **Aba Detalhes:** 
    - Categorias selecionáveis (Natureza, Praias, Cultura, Aventura, Vida Noturna, Cenotes).
    - **Lista dinâmica de Itens Inclusos** (com botão de adicionar/remover itens em tempo real).
    - **Lista dinâmica de Itens NÃO Inclusos**.
    - Descrição detalhada da experiência.
  - **Aba Mídia & Status:** URL da imagem de capa, Switch de Ativo/Inativo e Switch de Destaque na Home.
- **Tabela do banco envolvida:** `tours`.

---

### 🧳 Módulo 5: Pacotes de Viagem Completa (`/admin/viagem-completa`)
- **Objetivo:** Gestão de pacotes estruturados (Cancún Essencial, Roteiro Oficial, etc.).
- **Funcionalidades:**
  - Listagem com duração (dias), preço e status.
  - Formulário com nome do pacote, slug, slogan/subtítulo, descrição, número de dias, valor base, lista de inclusões e estrutura do itinerário.
  - Diálogo de exclusão (`DeletePackageDialog`).
- **Tabela do banco envolvida:** `travel_packages`.

---

### ⭐ Módulo 6: Curadoria Bella (`/admin/curadoria`)
- **Objetivo:** Gerenciar as solicitações de clientes de alto padrão (alto ticket) que procuram a curadoria exclusiva da Bella.
- **Funcionalidades:**
  - Tabela filtrável de leads com informações de contato, data de viagem prevista, composição do grupo e orçamento.
  - **Modal de Detalhes do Lead (`CuradoriaLeadDetails`):** Visualização completa das respostas do formulário/quiz, notas internas e histórico.
  - **Ação rápida WhatsApp:** Abre conversa diretamente com o cliente já com mensagem contextualizada.
  - Mudança de status do lead (Novo, Em atendimento, Proposta Enviada, Fechado, Arquivado).
- **Tabela do banco envolvida:** `curadoria_leads` ou `leads`.

---

### 💬 Módulo 7: Prova Social & Depoimentos (`/admin/depoimentos`)
- **Objetivo:** Gestão de depoimentos reais e avaliações que aparecem na Home e páginas de conversão.
- **Funcionalidades:**
  - Tabela com autor, avaliação (1 a 5 estrelas), trecho do depoimento, origem (TripAdvisor, Google, Instagram) e status de destaque.
  - **Modal de Criação/Edição (`TestimonialDialog`):** Edição rápida com classificação por estrelas, campo de citação e foto do autor.
- **Tabela do banco envolvida:** `testimonials`.

---

### 👥 Módulo 8: CRM de Parceiros B2B (`/admin/leads`)
- **Objetivo:** Canal para receber e gerenciar cadastros de agentes de viagens, operadoras de turismo e criadores de conteúdo (creators).
- **Funcionalidades:**
  - Filtro por perfil de parceiro: `Agente`, `Operadora`, `Grupo`, `Creator`.
  - Filtro por status do funil: `Novo`, `Contatado`, `Documentos`, `Onboarding`, `Ativo`, `Arquivado`.
  - **Modal de Detalhes (`PartnerLeadDetails`):** Exibe CNPJ/Cadastur, número de passageiros que costuma emitir, redes sociais e notas da equipe.
  - Botão de contato rápido por WhatsApp e E-mail.
- **Tabela do banco envolvida:** `partner_leads`.

---

### 📅 Módulo 9: Operacional de Reservas & Clientes (`/admin/reservas`)
- **Objetivo:** É o coração do atendimento ao cliente fechado. Conecta a venda à **Área do Cliente (`/cliente`)**.
- **Funcionalidades Principais:**
  1. **Tabela de Reservas:** Visualização por código da reserva (ex: `TN-2026-8841`), nome do passageiro, destino, período (Check-in / Check-out), total de passageiros e status (`draft`, `confirmed`, `active`, `completed`, `cancelled`).
  2. **Formulário de Reserva (`ReservationForm`):**
     - Vínculo com cliente (usuário cadastrado no Auth).
     - Destino e Pacote vinculado.
     - Hotel / Hospedagem e observações de transfer.
     - Quantidade de adultos, crianças e bebês.
     - Resumo executivo da viagem.
  3. **Montador de Itinerário Dia a Dia:**
     - Permite montar o cronograma diário do cliente (Dia 1: Chegada & Check-in, Dia 2: Chichén Itzá, etc.) com título, horários e ícone.
  4. **Gestão de Passeios Vinculados (`ReservationTourManager`):**
     - Adiciona os passeios contratados pelo cliente com data específica de realização, horário marcado e ponto de encontro / pickup no hotel.
  5. **Envio de Convite ao Cliente (`InviteCustomerDialog`):**
     - O operador insere o nome e e-mail do passageiro.
     - O sistema dispara um convite por e-mail pelo Supabase Auth para o cliente criar sua senha e acessar a Área do Cliente (`/cliente`) para ver seu voucher e roteiro.
- **Tabelas do banco envolvidas:** `reservations`, `reservation_tours`, `profiles`, `auth.users`.

---

### ⚙️ Módulo 10: Configurações do Sistema (`/admin/configuracoes`)
- **Objetivo:** Centralizar dados de contato da agência (telefone de suporte em Cancún, número de WhatsApp padrão, e-mail comercial e termos).
- **Status no antigo:** Rota shell estruturada para expansão.
- **Tabela do banco:** `site_settings`.

---

## 4. Comparativo Técnico: Projeto Antigo vs. Projeto Atual

| Aspecto | Projeto Antigo (`tionene-antigo`) | Projeto Atual (`src/`) | Como fazer no Novo |
| :--- | :--- | :--- | :--- |
| **Framework Base** | TanStack Start (Vite) | **Next.js 15 (App Router)** | Criar a pasta `src/app/admin` com subrotas |
| **Versão do React** | React 19 | **React 19** | Totalmente compatível |
| **Estilização** | Tailwind CSS v4 + Radix UI | Tailwind CSS + CSS customizado | Utilizar o design tokens já prontos |
| **Backend & Banco** | Supabase (PostgreSQL + RLS) | Prisma ORM + Supabase | Conectar direto ao Supabase com `@supabase/supabase-js` ou Prisma |
| **Autenticação Admin** | Supabase Auth (`user_roles`) | Não implementado ainda | Reutilizar o Supabase Auth com login admin |
| **Upload de Mídia** | Supabase Storage (`site-content`) | Arquivos estáticos em `/public` | Manter Supabase Storage para fotos dinâmicas |
| **Área do Cliente** | Alimentada por `reservations` | Alimentada por mocks (`mock-client.ts`) | Pode conectar a reserva do admin direto no cliente novo! |

---

## 5. Como o `.env` foi configurado no Projeto Atual

O arquivo `.env` do projeto atual já foi atualizado com as chaves copiadas do projeto antigo:

- **Instância Supabase Ativa:** `https://pfsgpsvbsfowrtcyckcm.supabase.co`
- **Chave Pública Anon:** Inserida como `NEXT_PUBLIC_SUPABASE_ANON_KEY` e também como `VITE_EXTERNAL_SUPABASE_ANON_KEY`.
- **Instância Secundária Lovable:** Mantida como referência.
- **Configurações do Site:** URLs locais e WhatsApp de suporte mantidos.

---

## 6. Menu de Escolha para o Usuário

Como você mencionou que **muita coisa do antigo não vai usar no novo**, preparamos este menu para você escolher exatamente o que deseja implantar:

| # | Módulo do Admin Antigo | Recomendação Técnica | Sua Decisão (Manter / Descartar) |
| :---: | :--- | :--- | :---: |
| **1** | **Dashboard com Métricas e Resumo** | ⭐ **Recomendado** (Dá visibilidade rápida ao logar) | `[ ] Manter  [ ] Descartar` |
| **2** | **CMS da Home (Hero, Manifesto, Textos)** | ⚠️ **Opcional** (O site novo já tem textos modernos fixos) | `[ ] Manter  [ ] Descartar` |
| **3** | **Gestão de Destinos** | ⚠️ **Opcional** (Útil se você pretende criar novos destinos além de Cancún) | `[ ] Manter  [ ] Descartar` |
| **4** | **Catálogo de Passeios (Tours)** | ⭐ **Altamente Recomendado** (Permite gerenciar preços, fotos e tours sem programar) | `[ ] Manter  [ ] Descartar` |
| **5** | **Pacotes de Viagem Completa** | ⭐ **Recomendado** (Se for manter a venda de pacotes fechados de múltiplos dias) | `[ ] Manter  [ ] Descartar` |
| **6** | **Curadoria Bella (Leads VIP)** | ⭐ **Altamente Recomendado** (Centraliza clientes de alto ticket e respostas do formulário) | `[ ] Manter  [ ] Descartar` |
| **7** | **Depoimentos & Prova Social** | ⚠️ **Opcional** (Útil se quiser adicionar novos reviews facilmente) | `[ ] Manter  [ ] Descartar` |
| **8** | **Leads de Parceiros B2B** | ⭐ **Recomendado** (Se você pretende fechar parcerias com agências/creators) | `[ ] Manter  [ ] Descartar` |
| **9** | **Operacional de Reservas & Vouchers** | 🚀 **Muito Poderoso** (Alimenta o cronograma e passeios da Área do Cliente) | `[ ] Manter  [ ] Descartar` |
| **10** | **Configurações do Sistema** | ⚠️ **Opcional** (Parâmetros globais) | `[ ] Manter  [ ] Descartar` |

---

## 7. Status da Implantação no Projeto Atual

Os 6 módulos solicitados foram implantados com sucesso com um **novo design system boutique** em Next.js 15 App Router:

| # | Módulo | Rota no Next.js 15 | Status | Funcionalidades Principais |
| :-: | :--- | :--- | :-: | :--- |
| **1** | **Dashboard** | [`/admin`](file:///d:/Z_UEB/TIONENE/src/app/admin/page.tsx) | ✅ **Implantado** | KPIs em tempo real, feed unificado de leads e atalhos rápidos |
| **4** | **Passeios (Tours)** | [`/admin/passeios`](file:///d:/Z_UEB/TIONENE/src/app/admin/passeios/page.tsx) | ✅ **Implantado** | CRUD completo de passeios, preços, inclusões, botão de sincronizar catálogo padrão |
| **5** | **Pacotes de Viagem** | [`/admin/viagem-completa`](file:///d:/Z_UEB/TIONENE/src/app/admin/viagem-completa/page.tsx) | ✅ **Implantado** | Gestão de pacotes fechados (Cancún Essencial, Oficial, etc.), preços e dias |
| **6** | **Curadoria Bella VIP** | [`/admin/curadoria`](file:///d:/Z_UEB/TIONENE/src/app/admin/curadoria/page.tsx) | ✅ **Implantado** | Leads de alto ticket, notas internas da equipe, funil e botão direto WhatsApp |
| **8** | **Parceiros B2B** | [`/admin/parceiros`](file:///d:/Z_UEB/TIONENE/src/app/admin/parceiros/page.tsx) | ✅ **Implantado** | CRM de agências, operadoras e creators, filtros e contato WhatsApp |
| **9** | **Reservas & Vouchers** | [`/admin/reservas`](file:///d:/Z_UEB/TIONENE/src/app/admin/reservas/page.tsx) | ✅ **Implantado** | Geração de códigos de voucher, hotéis, passageiros e montador de itinerário dia a dia |

- **Layout e Estilos:** [`src/app/admin/admin.css`](file:///d:/Z_UEB/TIONENE/src/app/admin/admin.css) e [`src/app/admin/layout.tsx`](file:///d:/Z_UEB/TIONENE/src/app/admin/layout.tsx).
- **Acesso no Site:** Link adicionado no rodapé institucional e acessível diretamente em `http://localhost:3000/admin`.

