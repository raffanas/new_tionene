-- =============================================================================
-- TÍO NENÊ - FINANCEIRO DE FORNECEDORES E CONTAS A PAGAR (v0.1.43)
-- Arquivo: supabase/migrations/20261028_supplier_payables_and_payments.sql
--
-- ATENÇÃO: NÃO EXECUTAR ESTA MIGRATION REMOTAMENTE NESTA TAREFA.
-- Migration local preparada para posterior execução controlada no Supabase.
--
-- REGRAS E GARANTIAS:
-- 1. AUTORIZAÇÃO DE MUTAÇÕES:
--    Mutações (INSERT/UPDATE/DELETE) em supplier_payment_entries são proibidas
--    para authenticated e anon via REVOKE e RLS. Mutações ocorrem exclusivamente
--    através das RPCs SECURITY DEFINER com verificação de auth.uid() e papel admin.
--    Leitura dos extratos permitida apenas para administradores.
-- 2. ORDEM DE BLOQUEIO (CONCORRÊNCIA E ANTI-DEADLOCK):
--    Padronizada a ordem estrita de locks:
--    1º: Primeiro bloquear supplier_payables (FOR UPDATE).
--    2º: Depois bloquear supplier_payment_entries (FOR UPDATE), quando necessário.
--    Aplicada em record_supplier_payment e reverse_supplier_payment.
-- 3. IDEMPOTÊNCIA ROBUSTA:
--    Preserva idempotency_key. Valida se a chave pertence à mesma obrigação
--    e representa a mesma operação (mesmo payable_id, amount e currency)
--    antes de confirmar sucesso idempotente.
-- 4. VALIDAÇÕES DE CUSTO E PAGAMENTO:
--    - Exige amount_final aprovado e não nulo antes de registrar pagamento.
--    - Custo estimado não autoriza pagamentos. Obrigações canceladas são bloqueadas.
--    - Impede pagamentos superiores ao saldo aprovado.
--    - Impede redução de amount_final abaixo do total já pago.
--    - Impede remoção de aprovação com pagamentos ativos.
--    - Estornos mantêm registros originais (is_reversed = true) com justificativa.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. AUDITORIA DE CUSTO EM public.supplier_payables
-- -----------------------------------------------------------------------------
ALTER TABLE public.supplier_payables
  ADD COLUMN IF NOT EXISTS cost_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cost_approved_by UUID,
  ADD COLUMN IF NOT EXISTS cost_approval_notes TEXT;

-- -----------------------------------------------------------------------------
-- 2. TABELA: public.supplier_payment_entries (Lançamentos de Pagamento)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.supplier_payment_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payable_id UUID NOT NULL REFERENCES public.supplier_payables(id) ON DELETE RESTRICT,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method VARCHAR(50) NOT NULL DEFAULT 'transferencia',
  reference VARCHAR(150),
  notes TEXT,
  idempotency_key TEXT,
  created_by UUID,
  is_reversed BOOLEAN NOT NULL DEFAULT false,
  reversed_at TIMESTAMPTZ,
  reversed_by UUID,
  reversal_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Índices operacionais e de idempotência
CREATE INDEX IF NOT EXISTS idx_supp_pay_entries_payable_id ON public.supplier_payment_entries(payable_id);
CREATE INDEX IF NOT EXISTS idx_supp_pay_entries_supplier_id ON public.supplier_payment_entries(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supp_pay_entries_date ON public.supplier_payment_entries(payment_date);
CREATE INDEX IF NOT EXISTS idx_supp_pay_entries_is_reversed ON public.supplier_payment_entries(is_reversed);
CREATE UNIQUE INDEX IF NOT EXISTS idx_supp_pay_entries_idempotency ON public.supplier_payment_entries(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 3. PERMISSÕES E RLS: LEITURA EXCLUSIVA ADMIN E BLOQUEIO TOTAL DE ESCRITA DIRETA
-- -----------------------------------------------------------------------------
-- Bloquear expressamente qualquer INSERT, UPDATE ou DELETE direto por authenticated ou anon
REVOKE ALL ON public.supplier_payment_entries FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.supplier_payment_entries TO authenticated;
GRANT ALL ON public.supplier_payment_entries TO service_role;

ALTER TABLE public.supplier_payment_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "supplier_payment_entries_admin_select" ON public.supplier_payment_entries;
DROP POLICY IF EXISTS "supplier_payment_entries_admin_only" ON public.supplier_payment_entries;

-- Leitura de extratos restrita aos administradores
CREATE POLICY "supplier_payment_entries_admin_select" ON public.supplier_payment_entries
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Limpeza de triggers legados de flag de sessão se existirem
DROP TRIGGER IF EXISTS trg_supplier_payment_entries_protect ON public.supplier_payment_entries;
DROP FUNCTION IF EXISTS public.trg_enforce_supplier_payment_entries_rpc_only();

-- -----------------------------------------------------------------------------
-- 4. RPC: public.approve_supplier_payable_cost
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.approve_supplier_payable_cost(
  p_payable_id UUID,
  p_amount_final NUMERIC,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_is_admin BOOLEAN := false;
  v_payable RECORD;
  v_new_status TEXT;
  v_paid NUMERIC;
BEGIN
  -- 1. Validar autenticação e perfil administrador
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: operação requer usuário autenticado.';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = v_user_id AND role = 'admin'
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem aprovar ou ajustar custos de fornecedores.';
  END IF;

  IF p_amount_final IS NOT NULL AND p_amount_final < 0 THEN
    RAISE EXCEPTION 'Valor de custo inválido: não pode ser negativo.';
  END IF;

  -- 2. Bloquear supplier_payables PRIMEIRO
  SELECT * INTO v_payable
  FROM public.supplier_payables
  WHERE id = p_payable_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Obrigação financeira de fornecedor não encontrada (ID: %)', p_payable_id;
  END IF;

  -- 3. Buscar total já pago a partir dos lançamentos ativos
  SELECT COALESCE(SUM(amount), 0) INTO v_paid
  FROM public.supplier_payment_entries
  WHERE payable_id = v_payable.id AND is_reversed = false;

  v_paid := GREATEST(v_paid, COALESCE(v_payable.paid_amount, 0));

  -- Validação de consistência: não remover aprovação se houver pagamentos ativos
  IF p_amount_final IS NULL AND v_paid > 0 THEN
    RAISE EXCEPTION 'Não é permitido desaprovar ou remover o custo final pois existem pagamentos ativos registrados no total de % %. Estorne os pagamentos antes de desaprovar o custo.',
      v_paid, v_payable.currency;
  END IF;

  -- Validação de consistência: não reduzir abaixo do total pago
  IF p_amount_final IS NOT NULL AND p_amount_final < v_paid THEN
    RAISE EXCEPTION 'O custo final aprovado (% %) não pode ser inferior ao total já pago (% %). Estorne os pagamentos excedentes antes de reduzir o custo.',
      p_amount_final, v_payable.currency, v_paid, v_payable.currency;
  END IF;

  -- 4. Definir novo status financeiro
  IF p_amount_final IS NULL THEN
    v_new_status := 'aguardando_aprovacao';
  ELSIF v_paid >= p_amount_final AND p_amount_final > 0 THEN
    v_new_status := 'pago';
  ELSIF v_paid > 0 THEN
    v_new_status := 'parcialmente_pago';
  ELSE
    v_new_status := 'aprovado';
  END IF;

  -- 5. Atualizar registro financeiro preservando amount_estimated intacto
  UPDATE public.supplier_payables
  SET
    amount_final = p_amount_final,
    is_unknown_cost = CASE WHEN p_amount_final IS NOT NULL THEN false ELSE is_unknown_cost END,
    payment_status = v_new_status,
    cost_approved_at = CASE WHEN p_amount_final IS NOT NULL THEN timezone('utc', now()) ELSE NULL END,
    cost_approved_by = CASE WHEN p_amount_final IS NOT NULL THEN v_user_id ELSE NULL END,
    cost_approval_notes = COALESCE(p_notes, cost_approval_notes),
    updated_at = timezone('utc', now())
  WHERE id = p_payable_id;

  -- 6. Sincronizar actual_cost na reserva operacional vinculada
  IF v_payable.reservation_id IS NOT NULL THEN
    UPDATE public.operational_reservations
    SET
      actual_cost = p_amount_final,
      updated_at = timezone('utc', now())
    WHERE id = v_payable.reservation_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'payable_id', p_payable_id,
    'amount_final', p_amount_final,
    'paid_amount', v_paid,
    'pending_balance', CASE WHEN p_amount_final IS NOT NULL THEN GREATEST(0, p_amount_final - v_paid) ELSE NULL END,
    'payment_status', v_new_status,
    'currency', v_payable.currency,
    'message', 'Custo final aprovado com sucesso.'
  );
END;
$$;

-- -----------------------------------------------------------------------------
-- 5. RPC: public.record_supplier_payment
-- -----------------------------------------------------------------------------
-- Bloqueio estrito:
-- 1º: Bloqueia supplier_payables
-- 2º: Bloqueia/insere em supplier_payment_entries
CREATE OR REPLACE FUNCTION public.record_supplier_payment(
  p_payable_id UUID,
  p_amount NUMERIC,
  p_payment_method TEXT DEFAULT 'transferencia',
  p_payment_date DATE DEFAULT CURRENT_DATE,
  p_reference TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_is_admin BOOLEAN := false;
  v_payable RECORD;
  v_existing_entry RECORD;
  v_effective_amount NUMERIC;
  v_current_paid NUMERIC;
  v_pending_balance NUMERIC;
  v_new_paid NUMERIC;
  v_new_status TEXT;
  v_entry_id UUID;
  v_idem_key TEXT;
BEGIN
  -- 1. Validar autenticação e perfil administrador
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: operação requer usuário autenticado.';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = v_user_id AND role = 'admin'
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem registrar pagamentos a fornecedores.';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Valor do pagamento deve ser maior que zero.';
  END IF;

  v_idem_key := NULLIF(trim(p_idempotency_key), '');

  -- 2. ORDEM DE BLOQUEIO PADRONIZADA: Bloquear supplier_payables PRIMEIRO
  SELECT * INTO v_payable
  FROM public.supplier_payables
  WHERE id = p_payable_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Obrigação financeira de fornecedor não encontrada (ID: %)', p_payable_id;
  END IF;

  -- 3. Idempotência: verificar se lançamento com a mesma chave já existe
  IF v_idem_key IS NOT NULL THEN
    -- Bloquear supplier_payment_entries DEPOIS
    SELECT * INTO v_existing_entry
    FROM public.supplier_payment_entries
    WHERE idempotency_key = v_idem_key
    FOR UPDATE;

    IF FOUND THEN
      -- Validar se pertence à mesma obrigação e mesma operação (mesmo valor e moeda)
      IF v_existing_entry.payable_id <> p_payable_id
         OR v_existing_entry.amount <> p_amount
         OR v_existing_entry.currency <> v_payable.currency THEN
        RAISE EXCEPTION 'Conflito de idempotência: a chave "%" já foi utilizada para outra operação financeira ou valor/obrigação divergente.', v_idem_key;
      END IF;

      -- Idempotência confirmada: retorna dados do pagamento já registrado
      RETURN jsonb_build_object(
        'success', true,
        'entry_id', v_existing_entry.id,
        'payable_id', v_existing_entry.payable_id,
        'amount_paid', v_existing_entry.amount,
        'total_paid', v_payable.paid_amount,
        'pending_balance', GREATEST(0, COALESCE(v_payable.amount_final, 0) - COALESCE(v_payable.paid_amount, 0)),
        'payment_status', v_payable.payment_status,
        'currency', v_payable.currency,
        'is_idempotent_replay', true,
        'message', 'Pagamento já processado anteriormente (idempotência confirmada).'
      );
    END IF;
  END IF;

  -- 4. Validar restrições da obrigação
  IF v_payable.payment_status = 'cancelado' THEN
    RAISE EXCEPTION 'Não é possível registrar pagamento em obrigação financeira cancelada.';
  END IF;

  IF v_payable.amount_final IS NULL THEN
    RAISE EXCEPTION 'Pagamento bloqueado: o custo final deve ser previamente aprovado pelo administrador (amount_final não pode ser nulo). O custo estimado não autoriza pagamentos.';
  END IF;

  v_effective_amount := v_payable.amount_final;

  -- Recalcular total pago a partir dos lançamentos ativos
  SELECT COALESCE(SUM(amount), 0) INTO v_current_paid
  FROM public.supplier_payment_entries
  WHERE payable_id = v_payable.id AND is_reversed = false;

  v_current_paid := GREATEST(v_current_paid, COALESCE(v_payable.paid_amount, 0));
  v_pending_balance := v_effective_amount - v_current_paid;

  -- Impedir pagamentos superiores ao saldo aprovado
  IF p_amount > (v_pending_balance + 0.005) THEN
    RAISE EXCEPTION 'Valor do pagamento (% %) excede o saldo pendente aprovado (% %). Pagamentos superiores ao saldo aprovado não são permitidos.',
      p_amount, v_payable.currency, v_pending_balance, v_payable.currency;
  END IF;

  -- 5. Inserir lançamento individual de pagamento
  INSERT INTO public.supplier_payment_entries (
    payable_id,
    supplier_id,
    amount,
    currency,
    payment_date,
    payment_method,
    reference,
    notes,
    idempotency_key,
    created_by
  ) VALUES (
    v_payable.id,
    v_payable.supplier_id,
    p_amount,
    v_payable.currency,
    COALESCE(p_payment_date, CURRENT_DATE),
    COALESCE(p_payment_method, 'transferencia'),
    p_reference,
    p_notes,
    v_idem_key,
    v_user_id
  ) RETURNING id INTO v_entry_id;

  -- 6. Recalcular total pago a partir de todos os lançamentos ativos (mesma transação)
  SELECT COALESCE(SUM(amount), 0) INTO v_new_paid
  FROM public.supplier_payment_entries
  WHERE payable_id = v_payable.id AND is_reversed = false;

  IF v_new_paid >= v_effective_amount THEN
    v_new_status := 'pago';
  ELSE
    v_new_status := 'parcialmente_pago';
  END IF;

  -- 7. Atualizar obrigação financeira
  UPDATE public.supplier_payables
  SET
    paid_amount = v_new_paid,
    paid_at = timezone('utc', now()),
    payment_status = v_new_status,
    payment_reference = COALESCE(p_reference, payment_reference),
    updated_at = timezone('utc', now())
  WHERE id = p_payable_id;

  RETURN jsonb_build_object(
    'success', true,
    'entry_id', v_entry_id,
    'payable_id', p_payable_id,
    'amount_paid', p_amount,
    'total_paid', v_new_paid,
    'pending_balance', GREATEST(0, v_effective_amount - v_new_paid),
    'payment_status', v_new_status,
    'currency', v_payable.currency,
    'is_idempotent_replay', false,
    'message', 'Pagamento registrado com sucesso.'
  );
END;
$$;

-- -----------------------------------------------------------------------------
-- 6. RPC: public.reverse_supplier_payment
-- -----------------------------------------------------------------------------
-- Bloqueio estrito anti-deadlock:
-- 1º: Bloqueia supplier_payables
-- 2º: Bloqueia supplier_payment_entries
CREATE OR REPLACE FUNCTION public.reverse_supplier_payment(
  p_payment_entry_id UUID,
  p_reversal_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_is_admin BOOLEAN := false;
  v_entry RECORD;
  v_payable RECORD;
  v_payable_id UUID;
  v_recalculated_paid NUMERIC;
  v_effective_amount NUMERIC;
  v_new_status TEXT;
  v_paid_at TIMESTAMPTZ;
BEGIN
  -- 1. Validar autenticação e perfil administrador
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: operação requer usuário autenticado.';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = v_user_id AND role = 'admin'
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem estornar pagamentos de fornecedores.';
  END IF;

  IF p_reversal_reason IS NULL OR trim(p_reversal_reason) = '' THEN
    RAISE EXCEPTION 'É obrigatório informar a justificativa do estorno para fins de auditoria.';
  END IF;

  -- 2. Descobrir a qual obrigação o lançamento pertence
  SELECT payable_id INTO v_payable_id
  FROM public.supplier_payment_entries
  WHERE id = p_payment_entry_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lançamento de pagamento não encontrado (ID: %)', p_payment_entry_id;
  END IF;

  -- 3. ORDEM DE BLOQUEIO PADRONIZADA: Bloquear supplier_payables PRIMEIRO
  SELECT * INTO v_payable
  FROM public.supplier_payables
  WHERE id = v_payable_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Obrigação financeira relacionada não encontrada (ID: %)', v_payable_id;
  END IF;

  -- 4. ORDEM DE BLOQUEIO PADRONIZADA: Bloquear supplier_payment_entries DEPOIS
  SELECT * INTO v_entry
  FROM public.supplier_payment_entries
  WHERE id = p_payment_entry_id
  FOR UPDATE;

  IF v_entry.is_reversed THEN
    RAISE EXCEPTION 'Este pagamento já foi estornado anteriormente em %.', v_entry.reversed_at;
  END IF;

  -- 5. Marcar estorno auditável preservando registro original
  UPDATE public.supplier_payment_entries
  SET
    is_reversed = true,
    reversed_at = timezone('utc', now()),
    reversed_by = v_user_id,
    reversal_reason = trim(p_reversal_reason),
    updated_at = timezone('utc', now())
  WHERE id = p_payment_entry_id;

  -- 6. Recalcular total pago a partir dos lançamentos ativos restantes (mesma transação)
  SELECT COALESCE(SUM(amount), 0) INTO v_recalculated_paid
  FROM public.supplier_payment_entries
  WHERE payable_id = v_payable.id AND is_reversed = false;

  v_effective_amount := v_payable.amount_final;

  IF v_recalculated_paid <= 0 THEN
    v_recalculated_paid := 0;
    v_new_status := CASE WHEN v_payable.amount_final IS NOT NULL THEN 'aprovado' ELSE 'aguardando_aprovacao' END;
    v_paid_at := NULL;
  ELSIF v_effective_amount IS NOT NULL AND v_recalculated_paid >= v_effective_amount THEN
    v_new_status := 'pago';
    v_paid_at := v_payable.paid_at;
  ELSE
    v_new_status := 'parcialmente_pago';
    v_paid_at := v_payable.paid_at;
  END IF;

  -- 7. Atualizar obrigação
  UPDATE public.supplier_payables
  SET
    paid_amount = v_recalculated_paid,
    payment_status = v_new_status,
    paid_at = v_paid_at,
    updated_at = timezone('utc', now())
  WHERE id = v_payable.id;

  RETURN jsonb_build_object(
    'success', true,
    'payment_entry_id', p_payment_entry_id,
    'payable_id', v_payable.id,
    'reversed_amount', v_entry.amount,
    'recalculated_paid_amount', v_recalculated_paid,
    'pending_balance', CASE WHEN v_effective_amount IS NOT NULL THEN GREATEST(0, v_effective_amount - v_recalculated_paid) ELSE NULL END,
    'new_payment_status', v_new_status,
    'currency', v_payable.currency,
    'message', 'Pagamento estornado com sucesso mantendo histórico auditável.'
  );
END;
$$;

-- -----------------------------------------------------------------------------
-- 7. PERMISSÕES E EXECUTE NAS RPCS
-- -----------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.approve_supplier_payable_cost FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_supplier_payable_cost TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.record_supplier_payment FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_supplier_payment TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.reverse_supplier_payment FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reverse_supplier_payment TO authenticated, service_role;

COMMIT;
