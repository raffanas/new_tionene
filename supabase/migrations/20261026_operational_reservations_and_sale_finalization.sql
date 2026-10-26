-- =============================================================================
-- TÍO NENÊ - FINALIZAÇÃO DE VENDA E RESERVAS OPERACIONAIS (v0.1.43)
-- Arquivo: supabase/migrations/20261026_operational_reservations_and_sale_finalization.sql
--
-- ATENÇÃO: NÃO EXECUTAR ESTA MIGRATION REMOTAMENTE NESTA TAREFA.
-- Migration local preparada para posterior aprovação e implantação controlada.
-- Preserva integralmente todas as tabelas, RLS e dados de teste existentes.
-- Execução 100% transacional com garantia de idempotência absoluta.
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. ATUALIZAÇÃO E COMPATIBILIZAÇÃO DAS TABELAS contracts E contract_items
-- -----------------------------------------------------------------------------
-- Garante colunas de rastreio de finalização de venda em contracts
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMPTZ;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS finalized_by UUID;

-- Garante existência de todas as colunas de snapshot e operacionais em contract_items
ALTER TABLE public.contract_items ADD COLUMN IF NOT EXISTS rate_id_snapshot TEXT;
ALTER TABLE public.contract_items ADD COLUMN IF NOT EXISTS tour_id_code_snapshot TEXT;
ALTER TABLE public.contract_items ADD COLUMN IF NOT EXISTS tariff_code_snapshot TEXT;
ALTER TABLE public.contract_items ADD COLUMN IF NOT EXISTS hotel_zone_snapshot TEXT;
ALTER TABLE public.contract_items ADD COLUMN IF NOT EXISTS native_currency TEXT DEFAULT 'USD';
ALTER TABLE public.contract_items ADD COLUMN IF NOT EXISTS native_cost_applied NUMERIC;
ALTER TABLE public.contract_items ADD COLUMN IF NOT EXISTS native_calculated_total_cost NUMERIC;
ALTER TABLE public.contract_items ADD COLUMN IF NOT EXISTS is_manual_quote BOOLEAN DEFAULT false;
ALTER TABLE public.contract_items ADD COLUMN IF NOT EXISTS is_manual_override BOOLEAN DEFAULT false;
ALTER TABLE public.contract_items ADD COLUMN IF NOT EXISTS manual_override_reason TEXT;
ALTER TABLE public.contract_items ADD COLUMN IF NOT EXISTS legs_count INT DEFAULT 1;
ALTER TABLE public.contract_items ADD COLUMN IF NOT EXISTS units_count INT DEFAULT 1;
ALTER TABLE public.contract_items ADD COLUMN IF NOT EXISTS calculation_breakdown JSONB DEFAULT '{}'::jsonb;

-- -----------------------------------------------------------------------------
-- 2. TABELA: public.arrivals (Registro de Chegada e Logística de Atendimento)
-- -----------------------------------------------------------------------------
-- Cada contrato finalizado possui exatamente UM registro de chegada/atendimento
CREATE TABLE IF NOT EXISTS public.arrivals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  client_email TEXT,
  arrival_date DATE NOT NULL,
  departure_date DATE,
  arrival_flight_number TEXT,
  arrival_flight_time TEXT,
  depart_flight_number TEXT,
  depart_flight_time TEXT,
  adults_count INT DEFAULT 1,
  children_count INT DEFAULT 0,
  infants_count INT DEFAULT 0,
  hotel_name TEXT,
  hotel_zone TEXT,
  hotels_schedule JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'agendada', -- 'agendada', 'em_transito', 'atendido', 'cancelado'
  assigned_agent TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_arrivals_contract_id UNIQUE (contract_id)
);

CREATE INDEX IF NOT EXISTS idx_arrivals_arrival_date ON public.arrivals(arrival_date);
CREATE INDEX IF NOT EXISTS idx_arrivals_status ON public.arrivals(status);
CREATE INDEX IF NOT EXISTS idx_arrivals_client_id ON public.arrivals(client_id);
CREATE INDEX IF NOT EXISTS idx_arrivals_hotel_zone ON public.arrivals(hotel_zone);

-- -----------------------------------------------------------------------------
-- 3. TABELA: public.operational_reservations (Reservas Operacionais por Passeio)
-- -----------------------------------------------------------------------------
-- Cada item do contrato gera exatamente UMA reserva operacional para o fornecedor
CREATE TABLE IF NOT EXISTS public.operational_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  contract_item_id UUID NOT NULL REFERENCES public.contract_items(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  supplier_name TEXT,
  product_name TEXT NOT NULL,
  tour_id_code TEXT, -- Ex: 'XCA-001', 'MIG-001', 'TN-001'
  rate_id_code TEXT, -- Ex: 'XCA-R001', 'MIG-R001'
  tour_date DATE NOT NULL,
  pickup_time TEXT, -- Horário de pickup (inicialmente NULL / pendente de confirmação)
  pickup_location TEXT, -- Hotel / Ponto de encontro
  hotel_zone TEXT,
  adults_count INT DEFAULT 1,
  children_count INT DEFAULT 0,
  infants_count INT DEFAULT 0,
  units_count INT DEFAULT 1,
  legs_count INT DEFAULT 1,
  supplier_confirmation_code TEXT, -- Código de confirmação / Voucher do fornecedor
  voucher_ref TEXT,
  status TEXT NOT NULL DEFAULT 'pendente', -- 'pendente', 'solicitada', 'confirmada', 'realizada', 'cancelada'
  is_unknown_cost BOOLEAN DEFAULT false,
  cost_currency TEXT DEFAULT 'USD',
  estimated_cost NUMERIC, -- Custo previsto na moeda original (NULL se desconhecido, nunca 0 forçado)
  actual_cost NUMERIC, -- Custo real confirmado posteriormente pelo Admin
  special_instructions TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_operational_reservations_item_id UNIQUE (contract_item_id)
);

CREATE INDEX IF NOT EXISTS idx_op_res_tour_date ON public.operational_reservations(tour_date);
CREATE INDEX IF NOT EXISTS idx_op_res_supplier_id ON public.operational_reservations(supplier_id);
CREATE INDEX IF NOT EXISTS idx_op_res_status ON public.operational_reservations(status);
CREATE INDEX IF NOT EXISTS idx_op_res_contract_id ON public.operational_reservations(contract_id);
CREATE INDEX IF NOT EXISTS idx_op_res_tour_id_code ON public.operational_reservations(tour_id_code);

-- -----------------------------------------------------------------------------
-- 4. TABELA: public.supplier_payables (Obrigações Financeiras Previstas para Fornecedores)
-- -----------------------------------------------------------------------------
-- Registra o compromisso financeiro previsto na moeda original do operador
CREATE TABLE IF NOT EXISTS public.supplier_payables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  contract_item_id UUID NOT NULL REFERENCES public.contract_items(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES public.operational_reservations(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  supplier_name TEXT,
  service_date DATE NOT NULL,
  description TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  amount_estimated NUMERIC, -- Previsto (NULL se desconhecido)
  amount_final NUMERIC, -- Aprovado pelo Admin para pagamento
  is_unknown_cost BOOLEAN DEFAULT false,
  payment_status TEXT NOT NULL DEFAULT 'previsto', -- 'previsto', 'aprovado', 'pago', 'cancelado' (NUNCA marcado automaticamente como pago)
  paid_amount NUMERIC DEFAULT 0,
  paid_at TIMESTAMPTZ,
  payment_reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_supplier_payables_item_id UNIQUE (contract_item_id)
);

CREATE INDEX IF NOT EXISTS idx_supp_pay_supplier_id ON public.supplier_payables(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supp_pay_service_date ON public.supplier_payables(service_date);
CREATE INDEX IF NOT EXISTS idx_supp_pay_status ON public.supplier_payables(payment_status);
CREATE INDEX IF NOT EXISTS idx_supp_pay_contract_id ON public.supplier_payables(contract_id);

-- -----------------------------------------------------------------------------
-- 5. RPC TRANSACIONAL: public.finalize_contract_sale(p_contract_id UUID)
-- -----------------------------------------------------------------------------
-- Executa a finalização atômica e estritamente idempotente da venda:
-- 1. Exige auth.uid() válido e papel real do projeto ('admin', 'moderator', 'user')
-- 2. Bloqueia linha do contrato (FOR UPDATE)
-- 3. Se já finalizado, retorna resultado existente sem alterar dados operacionais/financeiros
-- 4. Valida que o contrato NÃO está em rascunho
-- 5. Upsert na tabela public.arrivals (exatamente 1 chegada)
-- 6. Upsert em public.operational_reservations para cada item ativo (preservando pickup, voucher, confirmação)
-- 7. Upsert em public.supplier_payables para cada item ativo (preservando status e pagamentos)
-- 8. Atualiza status do contrato para 'finalizado' com carimbo finalized_at
CREATE OR REPLACE FUNCTION public.finalize_contract_sale(p_contract_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_is_authorized BOOLEAN := false;
  v_contract RECORD;
  v_item RECORD;
  v_arrival_id UUID;
  v_res_id UUID;
  v_pay_id UUID;
  v_first_hotel TEXT := NULL;
  v_first_zone TEXT := NULL;
  v_res_count INT := 0;
  v_pay_count INT := 0;
  v_is_unknown BOOLEAN;
  v_cost_val NUMERIC;
  v_currency TEXT;
BEGIN
  -- 1. Exige auth.uid() válido (não permite execução anônima)
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: operação de finalização de venda requer usuário autenticado.';
  END IF;

  -- 2. Autorização estrita conforme os papéis reais do projeto ('admin', 'moderator', 'user')
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = v_user_id
      AND role IN ('admin', 'moderator', 'user')
  ) INTO v_is_authorized;

  IF NOT v_is_authorized THEN
    RAISE EXCEPTION 'Acesso negado: usuário não possui permissão autorizada (admin, moderator ou user) para finalizar vendas.';
  END IF;

  -- 3. Validação do parâmetro de entrada
  IF p_contract_id IS NULL THEN
    RAISE EXCEPTION 'Parâmetro inválido: p_contract_id não pode ser nulo.';
  END IF;

  -- 4. Buscar e bloquear contrato para operação transacional
  SELECT * INTO v_contract
  FROM public.contracts
  WHERE id = p_contract_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contrato não encontrado (ID: %)', p_contract_id;
  END IF;

  -- 5. Se o contrato já estiver finalizado, retornar o resultado existente sem recriar ou modificar reservas
  IF v_contract.status = 'finalizado' THEN
    SELECT id INTO v_arrival_id
    FROM public.arrivals
    WHERE contract_id = p_contract_id
    LIMIT 1;

    SELECT COUNT(*) INTO v_res_count
    FROM public.operational_reservations
    WHERE contract_id = p_contract_id;

    SELECT COUNT(*) INTO v_pay_count
    FROM public.supplier_payables
    WHERE contract_id = p_contract_id;

    RETURN jsonb_build_object(
      'success', true,
      'contract_id', p_contract_id,
      'contract_number', v_contract.contract_number,
      'arrival_id', v_arrival_id,
      'reservations_count', v_res_count,
      'payables_count', v_pay_count,
      'status', 'finalizado',
      'already_finalized', true,
      'message', format('Contrato já finalizado anteriormente. Registros operacionais e financeiros preservados (%s reservas, %s obrigações a pagar).', v_res_count, v_pay_count)
    );
  END IF;

  -- 6. Regra: Contratos em rascunho NÃO podem ser finalizados
  IF v_contract.status = 'rascunho' THEN
    RAISE EXCEPTION 'Contratos em rascunho não podem gerar reservas operacionais. Salve o contrato oficial antes de finalizar a venda.';
  END IF;

  -- Extrair primeiro hotel e zona canônica do schedule
  IF v_contract.hotels_schedule IS NOT NULL AND jsonb_array_length(v_contract.hotels_schedule) > 0 THEN
    v_first_hotel := v_contract.hotels_schedule->0->>'hotel_name';
    v_first_zone := v_contract.hotels_schedule->0->>'zone';
  END IF;

  -- 7. Inserir ou atualizar Registro de Chegada (public.arrivals) — 100% IDEMPOTENTE
  INSERT INTO public.arrivals (
    contract_id,
    client_id,
    client_name,
    client_phone,
    client_email,
    arrival_date,
    departure_date,
    arrival_flight_number,
    arrival_flight_time,
    depart_flight_number,
    depart_flight_time,
    adults_count,
    children_count,
    infants_count,
    hotel_name,
    hotel_zone,
    hotels_schedule,
    status,
    notes,
    updated_at
  )
  VALUES (
    v_contract.id,
    v_contract.client_id,
    v_contract.client_name,
    v_contract.client_phone,
    v_contract.client_email,
    v_contract.arrival_date,
    v_contract.departure_date,
    v_contract.arrival_flight_number,
    v_contract.arrival_flight_time,
    v_contract.depart_flight_number,
    v_contract.depart_flight_time,
    COALESCE(v_contract.adults_count, 1),
    COALESCE(v_contract.children_count, 0),
    COALESCE(v_contract.infants_count, 0),
    v_first_hotel,
    v_first_zone,
    COALESCE(v_contract.hotels_schedule, '[]'::jsonb),
    'agendada',
    v_contract.internal_notes,
    now()
  )
  ON CONFLICT (contract_id) DO UPDATE SET
    client_name = EXCLUDED.client_name,
    client_phone = EXCLUDED.client_phone,
    client_email = EXCLUDED.client_email,
    arrival_date = EXCLUDED.arrival_date,
    departure_date = EXCLUDED.departure_date,
    arrival_flight_number = EXCLUDED.arrival_flight_number,
    arrival_flight_time = EXCLUDED.arrival_flight_time,
    depart_flight_number = EXCLUDED.depart_flight_number,
    depart_flight_time = EXCLUDED.depart_flight_time,
    adults_count = EXCLUDED.adults_count,
    children_count = EXCLUDED.children_count,
    infants_count = EXCLUDED.infants_count,
    hotel_name = EXCLUDED.hotel_name,
    hotel_zone = EXCLUDED.hotel_zone,
    hotels_schedule = EXCLUDED.hotels_schedule,
    status = public.arrivals.status,
    notes = COALESCE(public.arrivals.notes, EXCLUDED.notes),
    updated_at = now()
  RETURNING id INTO v_arrival_id;

  -- 8. Processar itens de contrato e gerar reservas operacionais + obrigações financeiras
  FOR v_item IN
    SELECT 
      ci.id,
      ci.contract_id,
      ci.supplier_id,
      ci.supplier_name_snapshot,
      ci.tour_name_snapshot,
      ci.tour_date,
      ci.adults_count,
      ci.children_count,
      ci.infants_count,
      ci.notes,
      ci.voucher_ref,
      COALESCE(ci.tour_id_code_snapshot, ci.calculation_breakdown->>'tour_id_code_snapshot', ci.tariff_code_snapshot) AS eff_tour_code,
      COALESCE(ci.rate_id_snapshot, ci.calculation_breakdown->>'rate_id_snapshot') AS eff_rate_code,
      COALESCE(ci.hotel_zone_snapshot, ci.calculation_breakdown->>'hotel_zone_snapshot', v_first_zone) AS eff_zone,
      COALESCE(ci.native_currency, ci.calculation_breakdown->>'native_currency', ci.cost_currency, 'USD') AS eff_currency,
      COALESCE(ci.native_calculated_total_cost, 
               CASE WHEN ci.calculation_breakdown->>'native_calculated_total_cost' IS NOT NULL 
                    THEN (ci.calculation_breakdown->>'native_calculated_total_cost')::numeric 
                    ELSE ci.calculated_total_cost END) AS eff_total_cost,
      COALESCE(ci.is_manual_quote, (ci.calculation_breakdown->>'is_manual_quote')::boolean, false) AS eff_quote_req,
      COALESCE(ci.legs_count, (ci.calculation_breakdown->>'legs_count')::int, 1) AS eff_legs,
      COALESCE(ci.units_count, 1) AS eff_units
    FROM public.contract_items ci
    WHERE ci.contract_id = p_contract_id
      AND (ci.status IS NULL OR ci.status != 'cancelado')
  LOOP
    -- Determinar se o custo é desconhecido ou sob consulta
    IF v_item.eff_total_cost IS NULL OR (v_item.eff_quote_req AND (v_item.eff_total_cost = 0 OR v_item.eff_total_cost IS NULL)) THEN
      v_is_unknown := true;
      v_cost_val := NULL;
    ELSE
      v_is_unknown := false;
      v_cost_val := v_item.eff_total_cost;
    END IF;

    v_currency := v_item.eff_currency;

    -- 8.1 Upsert em public.operational_reservations (Idempotência por contract_item_id)
    INSERT INTO public.operational_reservations (
      contract_id,
      contract_item_id,
      client_id,
      client_name,
      supplier_id,
      supplier_name,
      product_name,
      tour_id_code,
      rate_id_code,
      tour_date,
      pickup_location,
      hotel_zone,
      adults_count,
      children_count,
      infants_count,
      units_count,
      legs_count,
      voucher_ref,
      status,
      is_unknown_cost,
      cost_currency,
      estimated_cost,
      special_instructions,
      updated_at
    )
    VALUES (
      v_contract.id,
      v_item.id,
      v_contract.client_id,
      v_contract.client_name,
      v_item.supplier_id,
      v_item.supplier_name_snapshot,
      v_item.tour_name_snapshot,
      v_item.eff_tour_code,
      v_item.eff_rate_code,
      v_item.tour_date,
      v_first_hotel,
      v_item.eff_zone,
      COALESCE(v_item.adults_count, 1),
      COALESCE(v_item.children_count, 0),
      COALESCE(v_item.infants_count, 0),
      v_item.eff_units,
      v_item.eff_legs,
      v_item.voucher_ref,
      'pendente',
      v_is_unknown,
      v_currency,
      v_cost_val,
      v_item.notes,
      now()
    )
    ON CONFLICT (contract_item_id) DO UPDATE SET
      client_name = EXCLUDED.client_name,
      supplier_id = EXCLUDED.supplier_id,
      supplier_name = EXCLUDED.supplier_name,
      product_name = EXCLUDED.product_name,
      tour_id_code = EXCLUDED.tour_id_code,
      rate_id_code = EXCLUDED.rate_id_code,
      tour_date = EXCLUDED.tour_date,
      hotel_zone = EXCLUDED.hotel_zone,
      adults_count = EXCLUDED.adults_count,
      children_count = EXCLUDED.children_count,
      infants_count = EXCLUDED.infants_count,
      units_count = EXCLUDED.units_count,
      legs_count = EXCLUDED.legs_count,
      -- Preserva campos operacionais preenchidos após a finalização
      pickup_time = COALESCE(public.operational_reservations.pickup_time, EXCLUDED.pickup_time),
      pickup_location = COALESCE(public.operational_reservations.pickup_location, EXCLUDED.pickup_location),
      supplier_confirmation_code = COALESCE(public.operational_reservations.supplier_confirmation_code, EXCLUDED.supplier_confirmation_code),
      voucher_ref = COALESCE(public.operational_reservations.voucher_ref, EXCLUDED.voucher_ref),
      status = public.operational_reservations.status,
      actual_cost = public.operational_reservations.actual_cost,
      notes = COALESCE(public.operational_reservations.notes, EXCLUDED.notes),
      special_instructions = COALESCE(public.operational_reservations.special_instructions, EXCLUDED.special_instructions),
      updated_at = now()
    RETURNING id INTO v_res_id;

    v_res_count := v_res_count + 1;

    -- 8.2 Upsert em public.supplier_payables (Idempotência por contract_item_id)
    INSERT INTO public.supplier_payables (
      contract_id,
      contract_item_id,
      reservation_id,
      supplier_id,
      supplier_name,
      service_date,
      description,
      currency,
      amount_estimated,
      is_unknown_cost,
      payment_status,
      notes,
      updated_at
    )
    VALUES (
      v_contract.id,
      v_item.id,
      v_res_id,
      v_item.supplier_id,
      v_item.supplier_name_snapshot,
      v_item.tour_date,
      v_item.tour_name_snapshot || COALESCE(' [' || v_item.eff_tour_code || ']', ''),
      v_currency,
      v_cost_val,
      v_is_unknown,
      'previsto',
      'Obrigação operacional gerada na finalização do contrato ' || v_contract.contract_number,
      now()
    )
    ON CONFLICT (contract_item_id) DO UPDATE SET
      reservation_id = EXCLUDED.reservation_id,
      supplier_id = EXCLUDED.supplier_id,
      supplier_name = EXCLUDED.supplier_name,
      service_date = EXCLUDED.service_date,
      description = EXCLUDED.description,
      currency = EXCLUDED.currency,
      -- Preservar valores ajustados, pagamentos e status
      amount_final = public.supplier_payables.amount_final,
      payment_status = public.supplier_payables.payment_status,
      paid_amount = public.supplier_payables.paid_amount,
      paid_at = public.supplier_payables.paid_at,
      payment_reference = public.supplier_payables.payment_reference,
      notes = COALESCE(public.supplier_payables.notes, EXCLUDED.notes),
      updated_at = now()
    RETURNING id INTO v_pay_id;

    v_pay_count := v_pay_count + 1;
  END LOOP;

  -- 9. Atualizar status do contrato para 'finalizado'
  UPDATE public.contracts
  SET 
    status = 'finalizado',
    finalized_at = now(),
    finalized_by = v_user_id,
    updated_at = now()
  WHERE id = p_contract_id;

  RETURN jsonb_build_object(
    'success', true,
    'contract_id', p_contract_id,
    'contract_number', v_contract.contract_number,
    'arrival_id', v_arrival_id,
    'reservations_count', v_res_count,
    'payables_count', v_pay_count,
    'status', 'finalizado',
    'already_finalized', false,
    'message', format('Venda finalizada com sucesso. 1 chegada e %s reservas operacionais registradas.', v_res_count)
  );
END;
$$;

-- -----------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) E PERMISSÕES
-- -----------------------------------------------------------------------------
ALTER TABLE public.arrivals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operational_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_payables ENABLE ROW LEVEL SECURITY;

-- 6.1 Políticas para public.arrivals
-- Admin possui acesso irrestrito
DROP POLICY IF EXISTS "arrivals_admin_all" ON public.arrivals;
CREATE POLICY "arrivals_admin_all" ON public.arrivals
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Papéis reais 'moderator' e 'user' podem consultar e atualizar chegadas operacionais
DROP POLICY IF EXISTS "arrivals_seller_select_update" ON public.arrivals;
DROP POLICY IF EXISTS "arrivals_seller_update" ON public.arrivals;
DROP POLICY IF EXISTS "arrivals_team_select" ON public.arrivals;
CREATE POLICY "arrivals_team_select" ON public.arrivals
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'moderator', 'user')
    )
  );

DROP POLICY IF EXISTS "arrivals_team_update" ON public.arrivals;
CREATE POLICY "arrivals_team_update" ON public.arrivals
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'moderator', 'user')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'moderator', 'user')
    )
  );

-- 6.2 Políticas para public.operational_reservations
-- Admin possui acesso irrestrito
DROP POLICY IF EXISTS "operational_reservations_admin_all" ON public.operational_reservations;
CREATE POLICY "operational_reservations_admin_all" ON public.operational_reservations
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Papéis reais 'moderator' e 'user' podem consultar e atualizar dados operacionais de passeios
DROP POLICY IF EXISTS "operational_reservations_seller_access" ON public.operational_reservations;
DROP POLICY IF EXISTS "operational_reservations_seller_update" ON public.operational_reservations;
DROP POLICY IF EXISTS "operational_reservations_team_select" ON public.operational_reservations;
CREATE POLICY "operational_reservations_team_select" ON public.operational_reservations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'moderator', 'user')
    )
  );

DROP POLICY IF EXISTS "operational_reservations_team_update" ON public.operational_reservations;
CREATE POLICY "operational_reservations_team_update" ON public.operational_reservations
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'moderator', 'user')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'moderator', 'user')
    )
  );

-- 6.3 Políticas para public.supplier_payables (Admin Only)
DROP POLICY IF EXISTS "supplier_payables_admin_only" ON public.supplier_payables;
CREATE POLICY "supplier_payables_admin_only" ON public.supplier_payables
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- -----------------------------------------------------------------------------
-- 7. GRANTS E CONTROLE DE EXECUÇÃO
-- -----------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON public.arrivals TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.operational_reservations TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.supplier_payables TO authenticated, service_role;

-- Revoga explicitamente permissão de execução de PUBLIC e anon
REVOKE EXECUTE ON FUNCTION public.finalize_contract_sale(UUID) FROM PUBLIC, anon;
-- Concede permissão de execução apenas para authenticated e service_role
GRANT EXECUTE ON FUNCTION public.finalize_contract_sale(UUID) TO authenticated, service_role;

COMMIT;
