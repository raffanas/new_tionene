-- =============================================================================
-- TIO NENÊ - BACKOFFICE & CONTRATOS (V1)
-- Migração de Tabelas: Fornecedores, Custos, Clientes, Contratos e Itens
-- Data: Outubro de 2026
-- =============================================================================

-- Habilita extensão pgcrypto para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. TABELA: suppliers (Fornecedores e Operadores Locais)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  trade_name TEXT,
  contact_name TEXT,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  category TEXT DEFAULT 'Passeios & Atrações',
  currency_default TEXT DEFAULT 'BRL', -- BRL, USD, MXN
  payment_terms TEXT,
  notes TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 2. TABELA: supplier_tours (Regras de Custos de Passeios por Fornecedor)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.supplier_tours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  cost_type TEXT DEFAULT 'per_adult', -- per_adult, per_child, per_person, fixed_total, vehicle_private
  cost_adult NUMERIC DEFAULT 0,
  cost_child NUMERIC DEFAULT 0,
  cost_infant NUMERIC DEFAULT 0,
  cost_fixed NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'BRL', -- BRL, USD, MXN
  notes TEXT,
  is_default BOOLEAN DEFAULT true,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 3. TABELA: clients (Base Unificada de Clientes)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cpf TEXT,
  document_id TEXT, -- RG ou Passaporte
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  default_hotel TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 4. TABELA: contracts (Contratos / Reservas-Mãe da Agência)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number TEXT UNIQUE NOT NULL, -- Ex: TN-2026-1001
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_cpf TEXT,
  client_phone TEXT,
  client_email TEXT,
  arrival_date DATE NOT NULL, -- Data de chegada (Chave do Client Ledger)
  departure_date DATE,
  arrival_flight_number TEXT,
  arrival_flight_time TEXT,
  depart_flight_number TEXT,
  depart_flight_time TEXT,
  adults_count INT DEFAULT 1,
  children_count INT DEFAULT 0,
  infants_count INT DEFAULT 0,
  hotels_schedule JSONB DEFAULT '[]'::jsonb, -- Array de [{ hotel_name, checkin, checkout }]
  deposit_amount NUMERIC DEFAULT 0,
  deposit_observation TEXT,
  balance_amount NUMERIC DEFAULT 0,
  balance_observation TEXT,
  total_amount NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'BRL',
  status TEXT DEFAULT 'emitido', -- rascunho, emitido, assinado, cancelado
  terms_clauses TEXT, -- Cláusulas 1ª a 12ª formatadas (editáveis)
  internal_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 5. TABELA: contract_items (Itens de Passeios Contratados / Base de Custos)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contract_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  tour_id UUID REFERENCES public.tours(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  tour_date DATE NOT NULL, -- Data do passeio (Chave da Competência do Fornecedor)
  tour_name_snapshot TEXT NOT NULL, -- Snapshot: Nome do passeio gravado no momento da venda
  tour_included_snapshot TEXT, -- Snapshot: O que inclui
  tour_not_included_snapshot TEXT, -- Snapshot: O que não inclui
  supplier_name_snapshot TEXT, -- Snapshot: Nome do fornecedor no momento da venda
  adults_count INT DEFAULT 1,
  children_count INT DEFAULT 0,
  infants_count INT DEFAULT 0,
  sale_price NUMERIC DEFAULT 0,
  cost_applied NUMERIC DEFAULT 0,
  cost_type TEXT DEFAULT 'per_adult',
  cost_currency TEXT DEFAULT 'BRL',
  calculated_total_cost NUMERIC DEFAULT 0, -- Total calculado: pax × custo unitário
  cost_status TEXT DEFAULT 'calculado', -- 'calculado', 'incompleto_requer_revisao'
  voucher_ref TEXT, -- Referência de voucher / confirmação do fornecedor
  status TEXT DEFAULT 'agendado', -- agendado, confirmado_fornecedor, realizado, cancelado
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 6. ÍNDICES DE PERFORMANCE
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_contracts_arrival_date ON public.contracts(arrival_date);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON public.contracts(status);
CREATE INDEX IF NOT EXISTS idx_contract_items_tour_date ON public.contract_items(tour_date);
CREATE INDEX IF NOT EXISTS idx_contract_items_supplier ON public.contract_items(supplier_id);
CREATE INDEX IF NOT EXISTS idx_contract_items_contract ON public.contract_items(contract_id);
CREATE INDEX IF NOT EXISTS idx_supplier_tours_tour ON public.supplier_tours(tour_id);
CREATE INDEX IF NOT EXISTS idx_supplier_tours_supplier ON public.supplier_tours(supplier_id);

-- -----------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS)
-- -----------------------------------------------------------------------------
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_items ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas para leitura e gravação no painel administrativo
DROP POLICY IF EXISTS "Public read suppliers" ON public.suppliers;
CREATE POLICY "Public read suppliers" ON public.suppliers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin modify suppliers" ON public.suppliers;
CREATE POLICY "Admin modify suppliers" ON public.suppliers FOR ALL USING (true);

DROP POLICY IF EXISTS "Public read supplier_tours" ON public.supplier_tours;
CREATE POLICY "Public read supplier_tours" ON public.supplier_tours FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin modify supplier_tours" ON public.supplier_tours;
CREATE POLICY "Admin modify supplier_tours" ON public.supplier_tours FOR ALL USING (true);

DROP POLICY IF EXISTS "Public read clients" ON public.clients;
CREATE POLICY "Public read clients" ON public.clients FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin modify clients" ON public.clients;
CREATE POLICY "Admin modify clients" ON public.clients FOR ALL USING (true);

DROP POLICY IF EXISTS "Public read contracts" ON public.contracts;
CREATE POLICY "Public read contracts" ON public.contracts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin modify contracts" ON public.contracts;
CREATE POLICY "Admin modify contracts" ON public.contracts FOR ALL USING (true);

DROP POLICY IF EXISTS "Public read contract_items" ON public.contract_items;
CREATE POLICY "Public read contract_items" ON public.contract_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin modify contract_items" ON public.contract_items;
CREATE POLICY "Admin modify contract_items" ON public.contract_items FOR ALL USING (true);

-- -----------------------------------------------------------------------------
-- 8. CARGA INICIAL (SEED) DOS PRINCIPAIS FORNECEDORES
-- -----------------------------------------------------------------------------
INSERT INTO public.suppliers (name, trade_name, category, currency_default, notes)
VALUES
  ('Grupo Xcaret', 'Xcaret Parques', 'Parques Temáticos', 'USD', 'Parques Xcaret, Xel-Há, Xplor, Xenotes e Xoximilco.'),
  ('Envatours', 'Envatours Cancún', 'Operadora Náutica & Passeios', 'BRL', 'Passeios de catamarã, Isla Mujeres e Cozumel.'),
  ('The Dolphin Company', 'Dolphin Discovery', 'Delfinários & Parques', 'USD', 'Nado com golfinhos em Isla Mujeres, Cozumel e Maroma.'),
  ('Neftali Transportes', 'Neftali Transfers', 'Transporte & Privativo', 'USD', 'Transfers privativos de aeroporto e vans com motorista na Riviera Maya.'),
  ('Aquatours', 'Aquatours Marina', 'Náutica & Lagoa Nichupté', 'USD', 'Jungle Tour, Columbus Lobster Dinner e passeios de lancha.'),
  ('Coco Bongo', 'Coco Bongo Show & Disco', 'Vida Noturna & Shows', 'USD', 'Ingressos regulares, Gold Member e Front Row Cancún e Playa del Carmen.'),
  ('Baktun Tours', 'Baktun Operadora', 'Arqueologia & Cultura', 'BRL', 'Tours arqueológicos para Chichén Itzá, Tulum e Cobá com guia.'),
  ('MTZ Tours', 'MTZ Operações', 'Receptivo Cancún', 'BRL', 'Operações locais e passeios combinados.'),
  ('Francisco Murrieta', 'Murrieta Náutica', 'Embarcações & Pesca', 'USD', 'Iates privativos e charters de pesca.'),
  ('Tamyfer Locadora', 'Tamyfer Rent a Car', 'Locação de Veículos', 'USD', 'Aluguel de carros e utilitários em Cancún.')
ON CONFLICT DO NOTHING;
