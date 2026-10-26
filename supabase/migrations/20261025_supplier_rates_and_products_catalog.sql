-- =============================================================================
-- TÍO NENÊ - ESTRUTURA COMERCIAL: FORNECEDORES, PRODUTOS E TARIFAS (v0.1.43)
-- Arquivo: supabase/migrations/20261025_supplier_rates_and_products_catalog.sql
--
-- ATENÇÃO: NÃO EXECUTAR ESTA MIGRATION REMOTAMENTE NESTA TAREFA.
-- Migration local preparada para posterior aprovação e implantação controlada.
-- Preserva integralmente todas as 15 tabelas, RLS e dados de teste existentes.
-- Execução transacional com integridade defensiva.
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. VERIFICAÇÃO E INSERÇÃO SEGURA DOS 10 FORNECEDORES OFICIAIS (public.suppliers)
-- -----------------------------------------------------------------------------
-- Garante a existência das colunas necessárias sem quebrar schemas preexistentes
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ativo';
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS currency_default TEXT DEFAULT 'USD';

-- Inserção defensiva e idempotente dos 10 fornecedores oficiais.
-- REGRA DE PRESERVAÇÃO: Se o fornecedor já existir no banco (mesmo com grafia
-- variante como 'Playamia' / 'Playa Mía', ou com caixa diferente), NENHUM dado
-- existente é sobrescrito (preserva trade_name, notes, active, contatos e IDs históricos).
DO $$
DECLARE
  v_rec RECORD;
  v_official_suppliers CONSTANT JSONB := '[
    {"name": "Baktun", "trade_name": "Baktun Operadora", "category": "Arqueologia & Cultura", "currency_default": "USD", "notes": "Fornecedor oficial de Chichén Itzá e tours culturais."},
    {"name": "Coco Bongo", "trade_name": "Coco Bongo Show & Disco", "category": "Vida Noturna & Shows", "currency_default": "USD", "notes": "Ingressos oficiais de shows noturnos, packs e open bar em Cancún."},
    {"name": "Envatours", "trade_name": "Envatours Cancún", "category": "Operadora Náutica & Passeios", "currency_default": "USD", "notes": "Barcos de vidro coletivos e privativos (1–10 pax) em Cancún, Isla Mujeres e Cozumel."},
    {"name": "Miguel Shuttle", "trade_name": "Miguel Shuttle Transfers", "category": "Transporte & Privativo", "currency_default": "USD", "notes": "Transfers privativos aeroporto ↔ hotel em van (1–7 passageiros). Tarifas por trecho e zona."},
    {"name": "MTZ Tours", "trade_name": "MTZ Operações", "category": "Receptivo Cancún", "currency_default": "USD", "notes": "Tours arqueológicos Tulum, Casa Tortuga, cenotes e Cirque du Soleil JOYÀ."},
    {"name": "MUSA", "trade_name": "MUSA Museu Subaquático", "category": "Mergulho & Náutica", "currency_default": "USD", "notes": "Mergulho com cilindro e museu subaquático em Cancún."},
    {"name": "Parasailing & Jet Ski", "trade_name": "Parasailing & Jet Ski Cancún", "category": "Aventura & Náutica", "currency_default": "USD", "notes": "Atividades náuticas de voo panorâmico e jet ski (máx 2 pax/ski)."},
    {"name": "Playa Mía", "trade_name": "Playa Mía Grand Beach Park", "category": "Operadora Náutica & Passeios", "currency_default": "MXN", "notes": "Passeio Cozumel el Cielo com saídas Cancún, Playa del Carmen e Cozumel (manual). Moeda MXN."},
    {"name": "The Dolphin Company", "trade_name": "The Dolphin Company", "category": "Vida Marinha & Parques", "currency_default": "USD", "notes": "17 produtos oficiais com nado de golfinhos e habitats marinhos."},
    {"name": "Xcaret", "trade_name": "Grupo Xcaret", "category": "Parques & Ecoturismo", "currency_default": "USD", "notes": "10 produtos oficiais de parques e ecoturismo, 27 tarifas regionais com transporte incluso."}
  ]'::jsonb;
BEGIN
  FOR v_rec IN SELECT * FROM jsonb_to_recordset(v_official_suppliers) AS (
    name TEXT,
    trade_name TEXT,
    category TEXT,
    currency_default TEXT,
    notes TEXT
  )
  LOOP
    -- Insere APENAS se não houver fornecedor com mesmo nome ou equivalente legado
    -- (ex: 'Grupo Xcaret' -> 'Xcaret', 'Parasailing, Jet Ski' -> 'Parasailing & Jet Ski', 'Playamia' -> 'Playa Mía')
    IF NOT EXISTS (
      SELECT 1 FROM public.suppliers
      WHERE lower(trim(name)) = lower(trim(v_rec.name))
         OR lower(trim(coalesce(trade_name, ''))) = lower(trim(v_rec.name))
         OR (v_rec.name = 'Xcaret' AND (
               lower(trim(name)) IN ('grupo xcaret', 'xcaret', 'experiencias xcaret')
               OR lower(trim(coalesce(trade_name, ''))) IN ('grupo xcaret', 'xcaret')
             ))
         OR (v_rec.name = 'Parasailing & Jet Ski' AND (
               lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
               OR lower(name) LIKE '%parasailing%'
             ))
         OR (v_rec.name = 'Playa Mía' AND (
               lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
               OR lower(name) LIKE '%playa m%'
             ))
         OR (v_rec.name = 'The Dolphin Company' AND lower(name) LIKE '%dolphin%')
         OR (v_rec.name = 'Miguel Shuttle' AND lower(name) LIKE '%miguel%')
         OR (v_rec.name = 'Coco Bongo' AND lower(name) LIKE '%coco bongo%')
         OR (v_rec.name = 'Baktun' AND lower(name) LIKE '%baktun%')
         OR (v_rec.name = 'Envatours' AND lower(name) LIKE '%envatours%')
         OR (v_rec.name = 'MTZ Tours' AND lower(name) LIKE '%mtz%')
         OR (v_rec.name = 'MUSA' AND lower(name) LIKE '%musa%')
    ) THEN
      INSERT INTO public.suppliers (name, trade_name, category, currency_default, notes, active, status)
      VALUES (v_rec.name, v_rec.trade_name, v_rec.category, v_rec.currency_default, v_rec.notes, true, 'ativo');
    END IF;
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 2. TABELA: commercial_products (Catálogo Comercial dos 52 Produtos para Vendedores)
-- -----------------------------------------------------------------------------
-- Desacopla o nome comercial visível na venda (display_name) do nome operacional (supplier_product_name)
CREATE TABLE IF NOT EXISTS public.commercial_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id TEXT UNIQUE NOT NULL, -- Identificador estável (ex: 'BAK-001', 'XCA-001', 'PLY-001')
  provider TEXT NOT NULL,
  provider_code TEXT NOT NULL, -- BAK, COC, ENV, MIG, MTZ, MUS, PJS, PLY, DOL, XCA
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  supplier_product_name TEXT NOT NULL, -- Nome operacional interno do fornecedor
  display_name TEXT NOT NULL, -- Nome comercial visível na busca de vendedores e contratos
  product_type TEXT NOT NULL DEFAULT 'Tour', -- Tour, Activity, Transfer, Package
  product_subtype TEXT, -- Private Boat, Jet Ski, Nightclub Ticket, Airport Transfer, etc.
  seller_visible BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'Active', -- Active, Inactive
  pricing_model_default TEXT DEFAULT 'Person', -- Person, Boat, Vehicle, Equipment, Package
  requires_ancillary_booking BOOLEAN DEFAULT false, -- Ex: Iate que requer transfer hotel-marina separado
  ancillary_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 3. TABELA: supplier_rates (Catálogo Confidencial das 80 Tarifas Oficiais de Fornecedores)
-- -----------------------------------------------------------------------------
-- Tarifas com moeda original (USD/MXN), vigência, sazonalidade e condições operacionais.
-- Valores desconhecidos são gravados estritamente como NULL, NUNCA convertidos para zero.
CREATE TABLE IF NOT EXISTS public.supplier_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rate_id TEXT UNIQUE NOT NULL, -- Identificador estável (ex: 'BAK-R001', 'PLY-R002', 'MIG-R001')
  tour_id TEXT NOT NULL REFERENCES public.commercial_products(tour_id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
  supplier_rate_name TEXT NOT NULL,
  pricing_basis TEXT NOT NULL, -- 'Person', 'Boat', 'Vehicle', 'Equipment', 'Package'
  adult_cost NUMERIC NULL, -- NULL quando desconhecido ou sob cotação (NUNCA forçado para 0)
  child_cost NUMERIC NULL,
  infant_cost NUMERIC NULL,
  fixed_cost NUMERIC NULL, -- Custo fixo por veículo/embarcação/equipamento
  currency TEXT NOT NULL DEFAULT 'USD', -- USD para 77 tarifas, MXN para 3 tarifas de Playa Mía
  tariff_region TEXT, -- Região no fornecedor (ex: 'CUN/RM', 'PYC/PDC')
  season TEXT, -- 'Regular', 'High'
  days_of_week TEXT, -- Dias permitidos (ex: 'Monday;Tuesday;Wednesday')
  departure_area TEXT,
  route TEXT,
  min_passengers INT,
  max_passengers INT,
  transportation_included BOOLEAN DEFAULT false,
  additional_charges TEXT,
  effective_from DATE,
  effective_to DATE,
  rate_status TEXT NOT NULL DEFAULT 'Active', -- 'Active', 'Manual Only', 'Review Required', 'Inactive'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 4. TABELA: supplier_zone_mappings (Mapeamento Oficial das 8 Zonas Hoteleiras)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.supplier_zone_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_zone TEXT NOT NULL,
  provider_code TEXT NOT NULL, -- 'MIG', 'PLY', 'XCA'
  tariff_region TEXT NOT NULL,
  rate_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(hotel_zone, provider_code)
);

-- -----------------------------------------------------------------------------
-- 5. TABELA: xcaret_season_windows (Janelas Oficiais de Temporada Xcaret 2026)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.xcaret_season_windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  effective_year INT NOT NULL DEFAULT 2026,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  season TEXT NOT NULL, -- 'Regular', 'High'
  applicable_tour_ids TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 6. EVOLUÇÃO DE public.contract_items (Snapshots e Proteção de Orçamentos Manuais)
-- -----------------------------------------------------------------------------
ALTER TABLE public.contract_items
  ADD COLUMN IF NOT EXISTS rate_id_snapshot TEXT,
  ADD COLUMN IF NOT EXISTS tour_id_code_snapshot TEXT,
  ADD COLUMN IF NOT EXISTS is_manual_quote BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_manual_override BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS manual_override_reason TEXT,
  ADD COLUMN IF NOT EXISTS hotel_zone_snapshot TEXT,
  ADD COLUMN IF NOT EXISTS native_currency TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS native_cost_applied NUMERIC,
  ADD COLUMN IF NOT EXISTS native_calculated_total_cost NUMERIC,
  ADD COLUMN IF NOT EXISTS legs_count INT DEFAULT 1;

-- -----------------------------------------------------------------------------
-- 7. ÍNDICES DE PERFORMANCE
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_comm_products_tour_id ON public.commercial_products(tour_id);
CREATE INDEX IF NOT EXISTS idx_comm_products_provider ON public.commercial_products(provider_code);
CREATE INDEX IF NOT EXISTS idx_comm_products_seller_visible ON public.commercial_products(seller_visible);
CREATE INDEX IF NOT EXISTS idx_supplier_rates_rate_id ON public.supplier_rates(rate_id);
CREATE INDEX IF NOT EXISTS idx_supplier_rates_tour_id ON public.supplier_rates(tour_id);
CREATE INDEX IF NOT EXISTS idx_supplier_rates_supplier_id ON public.supplier_rates(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_rates_status ON public.supplier_rates(rate_status);
CREATE INDEX IF NOT EXISTS idx_zone_mappings_zone ON public.supplier_zone_mappings(hotel_zone);
CREATE INDEX IF NOT EXISTS idx_contract_items_rate_id ON public.contract_items(rate_id_snapshot);
CREATE INDEX IF NOT EXISTS idx_contract_items_tour_code ON public.contract_items(tour_id_code_snapshot);

-- -----------------------------------------------------------------------------
-- 8. SEGURANÇA RBAC: GRANTS E POLÍTICAS RLS CONJUNTAS
-- -----------------------------------------------------------------------------
ALTER TABLE public.commercial_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_zone_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xcaret_season_windows ENABLE ROW LEVEL SECURITY;

-- 8.1. anon: Revogação completa de acesso aos catálogos internos da agência
REVOKE ALL ON TABLE public.commercial_products FROM anon;
REVOKE ALL ON TABLE public.supplier_rates FROM anon;
REVOKE ALL ON TABLE public.supplier_zone_mappings FROM anon;
REVOKE ALL ON TABLE public.xcaret_season_windows FROM anon;

-- 8.2. authenticated: Permissões de tabela no nível de PostgreSQL
-- O papel authenticated precisa de GRANT para que o RLS filtre as operações do Admin e do Seller
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.commercial_products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.supplier_rates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.supplier_zone_mappings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.xcaret_season_windows TO authenticated;

-- 8.3. commercial_products RLS:
-- Vendedores consultam apenas produtos visíveis/ativos; Admins têm acesso completo.
DROP POLICY IF EXISTS "commercial_products_select_policy" ON public.commercial_products;
CREATE POLICY "commercial_products_select_policy"
  ON public.commercial_products FOR SELECT
  TO authenticated
  USING (
    seller_visible = true OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "commercial_products_insert_policy" ON public.commercial_products;
CREATE POLICY "commercial_products_insert_policy"
  ON public.commercial_products FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "commercial_products_update_policy" ON public.commercial_products;
CREATE POLICY "commercial_products_update_policy"
  ON public.commercial_products FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "commercial_products_delete_policy" ON public.commercial_products;
CREATE POLICY "commercial_products_delete_policy"
  ON public.commercial_products FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 8.4. supplier_rates RLS (TARIFAS CONFIDENCIAIS):
-- Restrição total para Sellers. Apenas Admin pode SELECT, INSERT, UPDATE ou DELETE tarifas operacionais.
DROP POLICY IF EXISTS "supplier_rates_select_policy" ON public.supplier_rates;
CREATE POLICY "supplier_rates_select_policy"
  ON public.supplier_rates FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "supplier_rates_insert_policy" ON public.supplier_rates;
CREATE POLICY "supplier_rates_insert_policy"
  ON public.supplier_rates FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "supplier_rates_update_policy" ON public.supplier_rates;
CREATE POLICY "supplier_rates_update_policy"
  ON public.supplier_rates FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "supplier_rates_delete_policy" ON public.supplier_rates;
CREATE POLICY "supplier_rates_delete_policy"
  ON public.supplier_rates FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 8.5. supplier_zone_mappings RLS:
-- Vendedores e Admins podem consultar para cálculo de transfer e passeios; apenas Admin altera.
DROP POLICY IF EXISTS "supplier_zone_mappings_select_policy" ON public.supplier_zone_mappings;
CREATE POLICY "supplier_zone_mappings_select_policy"
  ON public.supplier_zone_mappings FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "supplier_zone_mappings_insert_policy" ON public.supplier_zone_mappings;
CREATE POLICY "supplier_zone_mappings_insert_policy"
  ON public.supplier_zone_mappings FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "supplier_zone_mappings_update_policy" ON public.supplier_zone_mappings;
CREATE POLICY "supplier_zone_mappings_update_policy"
  ON public.supplier_zone_mappings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "supplier_zone_mappings_delete_policy" ON public.supplier_zone_mappings;
CREATE POLICY "supplier_zone_mappings_delete_policy"
  ON public.supplier_zone_mappings FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 8.6. xcaret_season_windows RLS:
-- Vendedores e Admins consultam janelas sazonais; apenas Admin altera.
DROP POLICY IF EXISTS "xcaret_season_windows_select_policy" ON public.xcaret_season_windows;
CREATE POLICY "xcaret_season_windows_select_policy"
  ON public.xcaret_season_windows FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "xcaret_season_windows_insert_policy" ON public.xcaret_season_windows;
CREATE POLICY "xcaret_season_windows_insert_policy"
  ON public.xcaret_season_windows FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "xcaret_season_windows_update_policy" ON public.xcaret_season_windows;
CREATE POLICY "xcaret_season_windows_update_policy"
  ON public.xcaret_season_windows FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "xcaret_season_windows_delete_policy" ON public.xcaret_season_windows;
CREATE POLICY "xcaret_season_windows_delete_policy"
  ON public.xcaret_season_windows FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

COMMIT;
