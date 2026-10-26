-- =============================================================================
-- TÍO NENÊ - CENTRAL OPERACIONAL DE RESERVAS E CONTROLE DE PERMISSÕES (v0.1.43)
-- Arquivo: supabase/migrations/20261027_operational_reservations_control_and_history.sql
--
-- ATENÇÃO: NÃO EXECUTAR ESTA MIGRATION REMOTAMENTE NESTA TAREFA.
-- Migration local preparada para posterior aprovação e implantação controlada.
-- Preserva integralmente todas as tabelas, RLS e dados de teste existentes.
-- Execução 100% transacional com garantia de idempotência.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. ADIÇÃO DE COLUNAS DE CONTROLE E HISTÓRICO EM operational_reservations
-- -----------------------------------------------------------------------------
ALTER TABLE public.operational_reservations 
  ADD COLUMN IF NOT EXISTS history JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS supplier_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS supplier_request_channel TEXT,
  ADD COLUMN IF NOT EXISTS supplier_confirmed_at TIMESTAMPTZ;

-- -----------------------------------------------------------------------------
-- 2. FUNÇÃO CONTROLADA PARA ATUALIZAÇÃO OPERACIONAL E AUDITORIA (SECURITY DEFINER)
-- -----------------------------------------------------------------------------
-- Caminho oficial de edição operacional.
-- Vendedores e moderadores podem alterar dados de logística e status.
-- Alteração de custos (actual_cost) é exclusiva de administradores.
-- O histórico operacional é acumulado de forma estritamente aditiva.
CREATE OR REPLACE FUNCTION public.update_operational_reservation_authorized(
  p_reservation_id UUID,
  p_status TEXT,
  p_pickup_time TEXT,
  p_pickup_location TEXT,
  p_supplier_confirmation_code TEXT,
  p_voucher_ref TEXT,
  p_special_instructions TEXT,
  p_notes TEXT,
  p_supplier_requested_at TIMESTAMPTZ DEFAULT NULL,
  p_supplier_request_channel TEXT DEFAULT NULL,
  p_supplier_confirmed_at TIMESTAMPTZ DEFAULT NULL,
  p_actual_cost NUMERIC DEFAULT NULL, -- Apenas Admin pode alterar
  p_action_description TEXT DEFAULT 'Atualização operacional'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_is_admin BOOLEAN := false;
  v_is_authorized BOOLEAN := false;
  v_existing RECORD;
  v_new_actual_cost NUMERIC;
  v_new_history JSONB;
  v_history_entry JSONB;
BEGIN
  -- 1. Identificar usuário autenticado via auth.uid()
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: operação requer usuário autenticado.';
  END IF;

  -- 2. Verificar papéis reais na tabela public.user_roles ('admin', 'moderator', 'user')
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = v_user_id AND role = 'admin'
  ) INTO v_is_admin;

  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = v_user_id AND role IN ('admin', 'moderator', 'user')
  ) INTO v_is_authorized;

  IF NOT v_is_authorized THEN
    RAISE EXCEPTION 'Acesso negado: usuário não possui permissão operacional autorizada.';
  END IF;

  -- 3. Obter registro atual com bloqueio de linha
  SELECT * INTO v_existing
  FROM public.operational_reservations
  WHERE id = p_reservation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reserva operacional não encontrada (ID: %)', p_reservation_id;
  END IF;

  -- 4. Proteção Financeira: apenas admin pode alterar custo real do fornecedor
  IF p_actual_cost IS NOT NULL AND p_actual_cost IS DISTINCT FROM v_existing.actual_cost THEN
    IF NOT v_is_admin THEN
      RAISE EXCEPTION 'Acesso negado: apenas administradores podem alterar custos de fornecedores.';
    END IF;
    v_new_actual_cost := p_actual_cost;
  ELSE
    v_new_actual_cost := v_existing.actual_cost;
  END IF;

  -- 5. Montar entrada cronológica no histórico (acumulação estrita)
  v_history_entry := jsonb_build_object(
    'timestamp', now(),
    'user_id', v_user_id,
    'action', p_action_description,
    'status_before', v_existing.status,
    'status_after', COALESCE(p_status, v_existing.status),
    'pickup_time', p_pickup_time,
    'supplier_confirmation_code', p_supplier_confirmation_code,
    'voucher_ref', p_voucher_ref
  );

  v_new_history := COALESCE(v_existing.history, '[]'::jsonb) || jsonb_build_array(v_history_entry);

  -- 6. Definir flag de contexto para sinalizar ao gatilho que a mutação é via RPC oficial
  PERFORM set_config('app.in_rpc_update_op_res', 'true', true);

  -- 7. Executar atualização operacional
  UPDATE public.operational_reservations
  SET
    status = COALESCE(p_status, status),
    pickup_time = p_pickup_time,
    pickup_location = p_pickup_location,
    supplier_confirmation_code = p_supplier_confirmation_code,
    voucher_ref = p_voucher_ref,
    special_instructions = p_special_instructions,
    notes = p_notes,
    supplier_requested_at = COALESCE(p_supplier_requested_at, supplier_requested_at),
    supplier_request_channel = COALESCE(p_supplier_request_channel, supplier_request_channel),
    supplier_confirmed_at = COALESCE(p_supplier_confirmed_at, supplier_confirmed_at),
    actual_cost = v_new_actual_cost,
    history = v_new_history,
    updated_at = now()
  WHERE id = p_reservation_id;

  -- Sincronizar voucher_ref no item do contrato caso informado
  IF p_voucher_ref IS NOT NULL AND p_voucher_ref <> '' AND v_existing.contract_item_id IS NOT NULL THEN
    UPDATE public.contract_items
    SET voucher_ref = p_voucher_ref
    WHERE id = v_existing.contract_item_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'reservation_id', p_reservation_id,
    'status', COALESCE(p_status, v_existing.status),
    'actual_cost', v_new_actual_cost,
    'message', 'Reserva operacional atualizada com sucesso.'
  );
END;
$$;

-- -----------------------------------------------------------------------------
-- 3. GATILHO DE PROTEÇÃO NO UPDATE DE operational_reservations
-- -----------------------------------------------------------------------------
-- Garante que:
-- - Autoridade administrativa é identificada estritamente via auth.uid() e public.user_roles.
--   (Sem liberação automática por current_user para evitar brechas em funções SECURITY DEFINER).
-- - Admin pode alterar actual_cost com sucesso (via RPC ou UPDATE direto).
-- - Usuários não administradores são bloqueados em:
--   estimated_cost, actual_cost, cost_currency, is_unknown_cost,
--   supplier_id, supplier_name, contract_id, contract_item_id, history.
-- - O histórico é estritamente imutável para eventos passados (mesmo com mesma quantidade de itens).
CREATE OR REPLACE FUNCTION public.check_operational_reservation_financial_protection()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_admin BOOLEAN := false;
  v_is_in_rpc BOOLEAN := false;
  v_calling_user UUID;
  v_old_hist_len INT;
  v_new_hist_len INT;
  i INT;
BEGIN
  -- 1. Se for service_role da API Supabase (operações de sistema/backend), permite
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- 2. Identificar usuário autenticado e verificar privilégios administrativos
  -- estritamente através de auth.uid() e da tabela public.user_roles.
  v_calling_user := auth.uid();
  v_is_in_rpc := (current_setting('app.in_rpc_update_op_res', true) = 'true');

  IF v_calling_user IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = v_calling_user AND role = 'admin'
    ) INTO v_is_admin;
  ELSE
    v_is_admin := false;
  END IF;

  -- 3. Proteção Universal do Histórico Operacional:
  -- Garante que nenhum registro anterior do histórico possa ser reescrito, alterado
  -- ou apagado, mesmo que a quantidade total de entradas permaneça a mesma.
  IF NEW.history IS DISTINCT FROM OLD.history THEN
    v_old_hist_len := jsonb_array_length(COALESCE(OLD.history, '[]'::jsonb));
    v_new_hist_len := jsonb_array_length(COALESCE(NEW.history, '[]'::jsonb));

    -- Impede redução de tamanho
    IF v_new_hist_len < v_old_hist_len THEN
      RAISE EXCEPTION 'Acesso negado: registros anteriores do histórico operacional não podem ser apagados ou reescritos.';
    END IF;

    -- Garante que todas as entradas pré-existentes (0 até v_old_hist_len - 1)
    -- sejam rigorosamente idênticas
    IF v_old_hist_len > 0 THEN
      FOR i IN 0 .. (v_old_hist_len - 1) LOOP
        IF (OLD.history -> i) IS DISTINCT FROM (NEW.history -> i) THEN
          RAISE EXCEPTION 'Acesso negado: registros anteriores do histórico operacional não podem ser modificados ou reescritos.';
        END IF;
      END LOOP;
    END IF;
  END IF;

  -- 4. Se for Administrador:
  -- Admin pode atualizar actual_cost e demais campos operacionais.
  -- Bloqueia apenas corrupção acidental de chaves de vínculo do contrato.
  IF v_is_admin THEN
    IF (NEW.contract_id IS DISTINCT FROM OLD.contract_id)
       OR (NEW.contract_item_id IS DISTINCT FROM OLD.contract_item_id) THEN
      RAISE EXCEPTION 'Acesso negado: não é permitido alterar o vínculo de contrato da reserva operacional.';
    END IF;
    RETURN NEW;
  END IF;

  -- 5. Para Usuários NÃO Administradores (moderator, user, vendedor):
  -- 5.1 Bloqueio estrito de custos e moedas
  IF (NEW.estimated_cost IS DISTINCT FROM OLD.estimated_cost)
     OR (NEW.actual_cost IS DISTINCT FROM OLD.actual_cost)
     OR (NEW.cost_currency IS DISTINCT FROM OLD.cost_currency)
     OR (NEW.is_unknown_cost IS DISTINCT FROM OLD.is_unknown_cost) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem alterar valores de custo ou moedas em reservas operacionais.';
  END IF;

  -- 5.2 Bloqueio de fornecedor e contrato estrutural
  IF (NEW.supplier_id IS DISTINCT FROM OLD.supplier_id)
     OR (NEW.supplier_name IS DISTINCT FROM OLD.supplier_name)
     OR (NEW.contract_id IS DISTINCT FROM OLD.contract_id)
     OR (NEW.contract_item_id IS DISTINCT FROM OLD.contract_item_id) THEN
    RAISE EXCEPTION 'Acesso negado: usuários não administradores não podem alterar o fornecedor ou contrato da reserva.';
  END IF;

  -- 5.3 O histórico só pode ser acumulado via RPC autorizada
  IF NEW.history IS DISTINCT FROM OLD.history AND NOT v_is_in_rpc THEN
    RAISE EXCEPTION 'Acesso negado: o histórico operacional só pode ser acumulado via RPC autorizada (update_operational_reservation_authorized).';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_op_res_financials ON public.operational_reservations;
CREATE TRIGGER trg_protect_op_res_financials
  BEFORE UPDATE ON public.operational_reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.check_operational_reservation_financial_protection();

-- -----------------------------------------------------------------------------
-- 4. GRANTS E CONTROLE DE EXECUÇÃO
-- -----------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.update_operational_reservation_authorized FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_operational_reservation_authorized TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.check_operational_reservation_financial_protection FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_operational_reservation_financial_protection TO authenticated, service_role;

COMMIT;
