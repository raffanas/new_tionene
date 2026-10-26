-- =============================================================================
-- TÍO NENÊ - CANCELAMENTOS, CRÉDITOS E REEMBOLSOS (v0.1.43)
-- Arquivo: supabase/migrations/20261031_cancellations_credits_and_refunds.sql
--
-- ATENÇÃO: NÃO EXECUTAR ESTA MIGRATION REMOTAMENTE NESTA TAREFA.
-- Migration local preparada e corrigida para posterior execução controlada no Supabase.
--
-- REGRAS E DIRETRIZES DA TAREFA 25 (CORREÇÃO DE INTEGRIDADE):
-- 1. UTILIZAÇÃO DE CRÉDITOS (use_client_credit):
--    - Bloqueio FOR UPDATE em client_credits e contracts de destino.
--    - Validação de correspondência de moeda (crédito vs contrato de destino).
--    - Validação estrita de titularidade (crédito deve pertencer ao mesmo cliente do contrato).
--    - Impedimento de uso de crédito expirado (expires_at < CURRENT_DATE), cancelado ou sem saldo.
--    - Atualização atômica de saldo e registro em client_credit_usages sem duplicar recebimentos em dinheiro.
-- 2. CONCESSÃO DE CRÉDITOS (grant_client_credit):
--    - Validação da existência do cliente na tabela clients.
--    - Se o contrato de origem for informado, exigir que exista e pertença ao cliente.
--    - Normalização e validação de moeda permitida ('BRL', 'USD', 'MXN').
-- 3. SOLICITAÇÃO DE REEMBOLSO (request_client_refund):
--    - Restrição a usuários autenticados com papel operacional (admin, moderator, user).
--    - Validação de motivo obrigatório, moeda permitida e valor superior a zero.
--    - Se houver reserva vinculada, validação estrita de que pertence ao contrato.
-- 4. APROVAÇÃO DE REEMBOLSO (approve_client_refund):
--    - Bloqueio FOR UPDATE contra concorrência.
--    - Permitido exclusivamente a partir de status 'solicitado' ou 'em_analise'.
--    - Rejeição explícita para reembolsos já pagos, recusados ou cancelados.
-- 5. PAGAMENTO DE REEMBOLSO (pay_client_refund):
--    - Bloqueio FOR UPDATE. Exigência estrita de status anterior 'aprovado'.
--    - Exigência de método de pagamento e comprovante/referência não vazios.
--    - Bloqueio total a pagamento duplicado, preservando dados do primeiro pagamento.
--    - Preservação intacta de client_payment_entries (não apaga nem estorna recebimentos reais).
-- 6. PERMISSÕES E ISOLAMENTO (RBAC & RLS):
--    - Revogação explícita de INSERT/UPDATE/DELETE direto para 'authenticated' nas tabelas financeiras.
--    - Apenas consultas (SELECT) permitidas para a equipe em créditos e reembolsos.
--    - supplier_recovery_records protegido com RLS estrito a Administradores.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. ATUALIZAÇÃO DE operational_reservations PARA CANCELAMENTOS DETALHADOS
-- -----------------------------------------------------------------------------
ALTER TABLE public.operational_reservations
  ADD COLUMN IF NOT EXISTS cancellation_status VARCHAR(40) DEFAULT 'nenhum', -- 'nenhum', 'solicitado', 'aguardando_fornecedor', 'confirmado', 'recusado', 'concluido'
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
  ADD COLUMN IF NOT EXISTS cancellation_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancellation_requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cancellation_requested_by_name TEXT,
  ADD COLUMN IF NOT EXISTS cancellation_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancellation_supplier_response TEXT,
  ADD COLUMN IF NOT EXISTS penalty_amount NUMERIC(12, 2) DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_op_res_cancellation_status ON public.operational_reservations(cancellation_status);

-- -----------------------------------------------------------------------------
-- 2. ATUALIZAÇÃO DE contracts PARA CONTROLE DE CANCELAMENTO CONTRATUAL
-- -----------------------------------------------------------------------------
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cancelled_by_name TEXT;

-- -----------------------------------------------------------------------------
-- 3. TABELA: public.client_credits (Créditos Concedidos a Clientes)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.client_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL, -- Contrato de origem
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
  balance NUMERIC(12, 2) NOT NULL CHECK (balance >= 0 AND balance <= amount),
  reason TEXT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'disponivel', -- 'disponivel', 'parcialmente_utilizado', 'utilizado', 'expirado', 'cancelado'
  expires_at DATE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_client_credits_client_id ON public.client_credits(client_id);
CREATE INDEX IF NOT EXISTS idx_client_credits_contract_id ON public.client_credits(contract_id);
CREATE INDEX IF NOT EXISTS idx_client_credits_status ON public.client_credits(status);

-- -----------------------------------------------------------------------------
-- 4. TABELA: public.client_credit_usages (Histórico de Utilização dos Créditos)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.client_credit_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_id UUID NOT NULL REFERENCES public.client_credits(id) ON DELETE RESTRICT,
  destination_contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE RESTRICT,
  amount_used NUMERIC(12, 2) NOT NULL CHECK (amount_used > 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
  used_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_by_name TEXT,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_client_credit_usages_credit ON public.client_credit_usages(credit_id);
CREATE INDEX IF NOT EXISTS idx_client_credit_usages_dest_contract ON public.client_credit_usages(destination_contract_id);

-- -----------------------------------------------------------------------------
-- 5. TABELA: public.client_refunds (Solicitações e Pagamentos de Reembolsos)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.client_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE RESTRICT,
  reservation_id UUID REFERENCES public.operational_reservations(id) ON DELETE SET NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
  reason TEXT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'solicitado', -- 'solicitado', 'em_analise', 'aprovado', 'pago', 'recusado', 'cancelado'
  payment_method VARCHAR(50), -- 'pix', 'transferencia', 'estorno_cartao', 'especie', 'wise', 'outro'
  payment_reference TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  requested_by_name TEXT,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by_name TEXT,
  paid_at TIMESTAMPTZ,
  paid_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  paid_by_name TEXT,
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_client_refunds_contract_id ON public.client_refunds(contract_id);
CREATE INDEX IF NOT EXISTS idx_client_refunds_client_id ON public.client_refunds(client_id);
CREATE INDEX IF NOT EXISTS idx_client_refunds_status ON public.client_refunds(status);

-- -----------------------------------------------------------------------------
-- 6. TABELA: public.supplier_recovery_records (Créditos e Reembolsos de Fornecedores)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.supplier_recovery_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  reservation_id UUID REFERENCES public.operational_reservations(id) ON DELETE SET NULL,
  payable_id UUID REFERENCES public.supplier_payables(id) ON DELETE SET NULL,
  recovery_type VARCHAR(30) NOT NULL CHECK (recovery_type IN ('sem_custo', 'multa_aplicada', 'credito_fornecedor', 'reembolso_prometido', 'reembolso_realizado')),
  amount_original NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (amount_original >= 0),
  penalty_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (penalty_amount >= 0),
  recovered_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (recovered_amount >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'MXN', 'BRL')),
  status VARCHAR(30) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_processamento', 'concluido', 'recusado')),
  supplier_response TEXT,
  reference TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_by_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  -- Regra: Recuperação efetiva (recovered_amount > 0) exige data e referência/comprovante
  CONSTRAINT chk_supp_rec_effective_recovery CHECK (
    recovered_amount = 0 OR (resolved_at IS NOT NULL AND reference IS NOT NULL AND trim(reference) <> '')
  ),
  -- Regra: Reembolso prometido NÃO pode ser registrado como dinheiro recebido (recovered_amount deve ser 0)
  CONSTRAINT chk_supp_rec_promised_not_received CHECK (
    recovery_type <> 'reembolso_prometido' OR recovered_amount = 0
  )
);

CREATE INDEX IF NOT EXISTS idx_supp_rec_supplier_id ON public.supplier_recovery_records(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supp_rec_contract_id ON public.supplier_recovery_records(contract_id);
CREATE INDEX IF NOT EXISTS idx_supp_rec_status ON public.supplier_recovery_records(status);

-- Prevenção contra duplicação de registros por cliques repetidos na mesma reserva e tipo de resolução
CREATE UNIQUE INDEX IF NOT EXISTS uq_supp_rec_reservation_recovery
  ON public.supplier_recovery_records(reservation_id, recovery_type)
  WHERE reservation_id IS NOT NULL;

-- Assegura aplicação de constraints caso a tabela já tenha sido criada anteriormente
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_supp_rec_effective_recovery') THEN
    ALTER TABLE public.supplier_recovery_records
      ADD CONSTRAINT chk_supp_rec_effective_recovery CHECK (
        recovered_amount = 0 OR (resolved_at IS NOT NULL AND reference IS NOT NULL AND trim(reference) <> '')
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_supp_rec_promised_not_received') THEN
    ALTER TABLE public.supplier_recovery_records
      ADD CONSTRAINT chk_supp_rec_promised_not_received CHECK (
        recovery_type <> 'reembolso_prometido' OR recovered_amount = 0
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_supp_rec_amounts_non_negative') THEN
    ALTER TABLE public.supplier_recovery_records
      ADD CONSTRAINT chk_supp_rec_amounts_non_negative CHECK (
        amount_original >= 0 AND penalty_amount >= 0 AND recovered_amount >= 0
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_supp_rec_currency_valid') THEN
    ALTER TABLE public.supplier_recovery_records
      ADD CONSTRAINT chk_supp_rec_currency_valid CHECK (
        currency IN ('USD', 'MXN', 'BRL')
      );
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 7. PERMISSÕES E ROW LEVEL SECURITY (RLS)
-- -----------------------------------------------------------------------------
ALTER TABLE public.client_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_credit_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_recovery_records ENABLE ROW LEVEL SECURITY;

-- 7.1 Leitura de créditos e reembolsos de clientes para equipe autenticada
DROP POLICY IF EXISTS "client_credits_team_select" ON public.client_credits;
CREATE POLICY "client_credits_team_select" ON public.client_credits
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'moderator', 'user')
    )
  );

DROP POLICY IF EXISTS "client_credit_usages_team_select" ON public.client_credit_usages;
CREATE POLICY "client_credit_usages_team_select" ON public.client_credit_usages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'moderator', 'user')
    )
  );

DROP POLICY IF EXISTS "client_refunds_team_select" ON public.client_refunds;
CREATE POLICY "client_refunds_team_select" ON public.client_refunds
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'moderator', 'user')
    )
  );

-- 7.2 supplier_recovery_records é EXCLUSIVO de Administrador (leitura e escrita apenas para papel admin)
DROP POLICY IF EXISTS "supplier_recovery_admin_all" ON public.supplier_recovery_records;
CREATE POLICY "supplier_recovery_admin_all" ON public.supplier_recovery_records
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
    )
  );

-- -----------------------------------------------------------------------------
-- 8. RPC: CONCESSÃO SEGURA DE CRÉDITO DE CLIENTE (SECURITY DEFINER)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.grant_client_credit(
  p_client_id UUID,
  p_contract_id UUID,
  p_amount NUMERIC,
  p_currency VARCHAR,
  p_reason TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_user_name TEXT;
  v_credit_id UUID;
  v_contract_client_id UUID;
  v_currency VARCHAR;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: operação requer usuário autenticado.';
  END IF;

  -- Apenas Administradores podem autorizar e emitir créditos financeiros
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = v_user_id AND ur.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem autorizar e emitir créditos de clientes.';
  END IF;

  -- Validar cliente
  IF p_client_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.clients WHERE id = p_client_id) THEN
    RAISE EXCEPTION 'Cliente não encontrado ou inválido.';
  END IF;

  -- Validar contrato de origem se informado
  IF p_contract_id IS NOT NULL THEN
    SELECT client_id INTO v_contract_client_id
    FROM public.contracts
    WHERE id = p_contract_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Contrato de origem não encontrado.';
    END IF;

    IF v_contract_client_id <> p_client_id THEN
      RAISE EXCEPTION 'Inconsistência cadastral: o contrato de origem informado pertence a outro cliente.';
    END IF;
  END IF;

  -- Validar valor
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Valor de crédito inválido: deve ser superior a zero.';
  END IF;

  -- Validar motivo
  IF p_reason IS NULL OR trim(p_reason) = '' THEN
    RAISE EXCEPTION 'Motivo do crédito é obrigatório.';
  END IF;

  -- Validar e normalizar moeda permitida
  v_currency := upper(trim(coalesce(p_currency, 'BRL')));
  IF v_currency NOT IN ('BRL', 'USD', 'MXN') THEN
    RAISE EXCEPTION 'Moeda inválida: %. Moedas aceitas são BRL, USD ou MXN.', v_currency;
  END IF;

  SELECT coalesce(raw_user_meta_data->>'full_name', email) INTO v_user_name
  FROM auth.users WHERE id = v_user_id;

  INSERT INTO public.client_credits (
    client_id,
    contract_id,
    amount,
    currency,
    balance,
    reason,
    status,
    created_by,
    created_by_name,
    notes,
    created_at,
    updated_at
  )
  VALUES (
    p_client_id,
    p_contract_id,
    p_amount,
    v_currency,
    p_amount, -- Saldo inicial = valor integral concedido
    trim(p_reason),
    'disponivel',
    v_user_id,
    v_user_name,
    p_notes,
    timezone('utc', now()),
    timezone('utc', now())
  )
  RETURNING id INTO v_credit_id;

  RETURN jsonb_build_object(
    'success', true,
    'credit_id', v_credit_id,
    'amount', p_amount,
    'balance', p_amount,
    'currency', v_currency,
    'message', 'Crédito financeiro concedido com sucesso ao cliente.'
  );
END;
$$;

-- -----------------------------------------------------------------------------
-- 9. RPC: UTILIZAÇÃO SEGURA DE CRÉDITO DE CLIENTE (ANTI-DUPLICAÇÃO & CAMBIAL)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.use_client_credit(
  p_credit_id UUID,
  p_destination_contract_id UUID,
  p_amount_to_use NUMERIC,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_user_name TEXT;
  v_credit RECORD;
  v_dest_contract RECORD;
  v_new_balance NUMERIC;
  v_new_status VARCHAR;
  v_usage_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: operação requer usuário autenticado.';
  END IF;

  -- Apenas Administradores podem autorizar a utilização de créditos
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = v_user_id AND ur.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem autorizar a utilização de créditos.';
  END IF;

  IF p_amount_to_use IS NULL OR p_amount_to_use <= 0 THEN
    RAISE EXCEPTION 'Valor de utilização inválido: deve ser superior a zero.';
  END IF;

  -- 1. Bloqueio FOR UPDATE no crédito para evitar concorrência e uso duplicado
  SELECT * INTO v_credit
  FROM public.client_credits
  WHERE id = p_credit_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Crédito não encontrado.';
  END IF;

  -- 2. Bloqueio FOR UPDATE no contrato de destino
  SELECT * INTO v_dest_contract
  FROM public.contracts
  WHERE id = p_destination_contract_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contrato de destino não encontrado.';
  END IF;

  IF v_dest_contract.status = 'cancelado' THEN
    RAISE EXCEPTION 'Não é permitido aplicar créditos em contratos com status cancelado.';
  END IF;

  -- 3. Validação de correspondência de moeda (proíbe conversão arbitrária)
  IF upper(trim(v_credit.currency)) <> upper(trim(v_dest_contract.currency)) THEN
    RAISE EXCEPTION 'Incompatibilidade de moedas: o crédito é em % e o contrato de destino é em %. A conversão cambial automática é proibida.',
      v_credit.currency, v_dest_contract.currency;
  END IF;

  -- 4. Validação de titularidade: o crédito deve pertencer ao mesmo cliente do contrato
  IF v_credit.client_id <> v_dest_contract.client_id THEN
    RAISE EXCEPTION 'Incompatibilidade de titularidade: o crédito pertence a outro cliente e não pode ser aplicado ao contrato %.',
      v_dest_contract.contract_number;
  END IF;

  -- 5. Validação de status do crédito
  IF v_credit.status IN ('utilizado', 'cancelado', 'expirado') THEN
    RAISE EXCEPTION 'Este crédito não está disponível para utilização (status: %).', v_credit.status;
  END IF;

  -- 6. Validação de validade/expiração (data de expiração como fonte da verdade)
  IF v_credit.expires_at IS NOT NULL AND v_credit.expires_at < CURRENT_DATE THEN
    RAISE EXCEPTION 'Este crédito expirou em % e não pode ser utilizado.', v_credit.expires_at;
  END IF;

  -- 7. Validação de saldo
  IF v_credit.balance <= 0 OR p_amount_to_use > v_credit.balance THEN
    RAISE EXCEPTION 'Saldo insuficiente: o crédito possui saldo de % %, não sendo possível utilizar % %.',
      v_credit.currency, v_credit.balance, v_credit.currency, p_amount_to_use;
  END IF;

  SELECT coalesce(raw_user_meta_data->>'full_name', email) INTO v_user_name
  FROM auth.users WHERE id = v_user_id;

  v_new_balance := v_credit.balance - p_amount_to_use;
  IF v_new_balance = 0 THEN
    v_new_status := 'utilizado';
  ELSE
    v_new_status := 'parcialmente_utilizado';
  END IF;

  -- 8. Atualização atômica do saldo do crédito
  UPDATE public.client_credits
  SET
    balance = v_new_balance,
    status = v_new_status,
    updated_at = timezone('utc', now())
  WHERE id = p_credit_id;

  -- 9. Inserção do histórico de utilização vinculado ao contrato
  INSERT INTO public.client_credit_usages (
    credit_id,
    destination_contract_id,
    amount_used,
    currency,
    used_at,
    used_by,
    used_by_name,
    notes
  )
  VALUES (
    p_credit_id,
    p_destination_contract_id,
    p_amount_to_use,
    v_credit.currency,
    timezone('utc', now()),
    v_user_id,
    v_user_name,
    p_notes
  )
  RETURNING id INTO v_usage_id;

  RETURN jsonb_build_object(
    'success', true,
    'usage_id', v_usage_id,
    'amount_used', p_amount_to_use,
    'remaining_balance', v_new_balance,
    'status', v_new_status,
    'contract_number', v_dest_contract.contract_number,
    'message', 'Crédito aplicado com sucesso ao contrato.'
  );
END;
$$;

-- -----------------------------------------------------------------------------
-- 10. RPC: SOLICITAÇÃO, APROVAÇÃO E PAGAMENTO DE REEMBOLSOS DE CLIENTES
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.request_client_refund(
  p_contract_id UUID,
  p_reservation_id UUID DEFAULT NULL,
  p_amount NUMERIC DEFAULT NULL,
  p_currency VARCHAR DEFAULT 'BRL',
  p_reason TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_user_name TEXT;
  v_contract RECORD;
  v_refund_id UUID;
  v_currency VARCHAR;
  v_res_contract_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: operação requer usuário autenticado.';
  END IF;

  -- Restringir a perfis operacionais autorizados (admin, moderator, user)
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = v_user_id AND ur.role IN ('admin', 'moderator', 'user')
  ) THEN
    RAISE EXCEPTION 'Acesso negado: usuário não possui perfil operacional autorizado para solicitar reembolsos.';
  END IF;

  -- Validar contrato
  SELECT * INTO v_contract
  FROM public.contracts WHERE id = p_contract_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contrato não encontrado.';
  END IF;

  -- Validar reserva operacional vinculada se informada
  IF p_reservation_id IS NOT NULL THEN
    SELECT contract_id INTO v_res_contract_id
    FROM public.operational_reservations
    WHERE id = p_reservation_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Reserva operacional vinculada não encontrada.';
    END IF;

    IF v_res_contract_id <> p_contract_id THEN
      RAISE EXCEPTION 'Inconsistência cadastral: a reserva operacional informada não pertence ao contrato especificado.';
    END IF;
  END IF;

  -- Validar valor
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Valor de reembolso inválido: deve ser superior a zero.';
  END IF;

  -- Validar motivo obrigatório
  IF p_reason IS NULL OR trim(p_reason) = '' THEN
    RAISE EXCEPTION 'Motivo da solicitação de reembolso é obrigatório.';
  END IF;

  -- Validar e normalizar moeda
  v_currency := upper(trim(coalesce(p_currency, 'BRL')));
  IF v_currency NOT IN ('BRL', 'USD', 'MXN') THEN
    RAISE EXCEPTION 'Moeda inválida: %. Moedas aceitas são BRL, USD ou MXN.', v_currency;
  END IF;

  SELECT coalesce(raw_user_meta_data->>'full_name', email) INTO v_user_name
  FROM auth.users WHERE id = v_user_id;

  INSERT INTO public.client_refunds (
    client_id,
    contract_id,
    reservation_id,
    amount,
    currency,
    reason,
    status,
    requested_by,
    requested_by_name,
    requested_at,
    notes,
    created_at,
    updated_at
  )
  VALUES (
    v_contract.client_id,
    p_contract_id,
    p_reservation_id,
    p_amount,
    v_currency,
    trim(p_reason),
    'solicitado',
    v_user_id,
    v_user_name,
    timezone('utc', now()),
    p_notes,
    timezone('utc', now()),
    timezone('utc', now())
  )
  RETURNING id INTO v_refund_id;

  RETURN jsonb_build_object(
    'success', true,
    'refund_id', v_refund_id,
    'status', 'solicitado',
    'message', 'Solicitação de reembolso cadastrada com sucesso para análise.'
  );
END;
$$;

-- 10.1 Aprovação de Reembolso (Admin Exclusivo com Trava Anticoncorrência)
CREATE OR REPLACE FUNCTION public.approve_client_refund(
  p_refund_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_user_name TEXT;
  v_refund RECORD;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: operação requer usuário autenticado.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = v_user_id AND ur.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem aprovar reembolsos.';
  END IF;

  -- Bloqueio FOR UPDATE para evitar concorrência
  SELECT * INTO v_refund
  FROM public.client_refunds
  WHERE id = p_refund_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Registro de reembolso não encontrado.';
  END IF;

  -- Rejeição de transições inválidas
  IF v_refund.status = 'pago' THEN
    RAISE EXCEPTION 'Operação inválida: o reembolso já foi liquidado/pago e não pode ser reaprovado.';
  END IF;

  IF v_refund.status IN ('recusado', 'cancelado') THEN
    RAISE EXCEPTION 'Operação inválida: o reembolso possui status "%" e não pode ser aprovado diretamente.', v_refund.status;
  END IF;

  IF v_refund.status = 'aprovado' THEN
    RAISE EXCEPTION 'Operação redundante: o reembolso já se encontra aprovado.';
  END IF;

  IF v_refund.status NOT IN ('solicitado', 'em_analise') THEN
    RAISE EXCEPTION 'Status inválido para aprovação: %.', v_refund.status;
  END IF;

  SELECT coalesce(raw_user_meta_data->>'full_name', email) INTO v_user_name
  FROM auth.users WHERE id = v_user_id;

  UPDATE public.client_refunds
  SET
    status = 'aprovado',
    approved_at = timezone('utc', now()),
    approved_by = v_user_id,
    approved_by_name = v_user_name,
    notes = coalesce(p_notes, notes),
    updated_at = timezone('utc', now())
  WHERE id = p_refund_id;

  RETURN jsonb_build_object(
    'success', true,
    'refund_id', p_refund_id,
    'status', 'aprovado',
    'message', 'Reembolso aprovado com sucesso. Liberado para pagamento.'
  );
END;
$$;

-- 10.2 Registro do Pagamento Efetivo de Reembolso (Admin Exclusivo com Anti-Duplicação)
CREATE OR REPLACE FUNCTION public.pay_client_refund(
  p_refund_id UUID,
  p_payment_method VARCHAR,
  p_payment_reference TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_user_name TEXT;
  v_refund RECORD;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: operação requer usuário autenticado.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = v_user_id AND ur.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem registrar pagamento de reembolsos.';
  END IF;

  -- Bloqueio FOR UPDATE para evitar concorrência
  SELECT * INTO v_refund
  FROM public.client_refunds
  WHERE id = p_refund_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Registro de reembolso não encontrado.';
  END IF;

  -- Impedir pagamento duplicado e preservar dados do primeiro pagamento
  IF v_refund.status = 'pago' THEN
    RAISE EXCEPTION 'Operação rejeitada: este reembolso já foi pago anteriormente em % (Comprovante: %). Pagamento duplicado impedido.',
      v_refund.paid_at, v_refund.payment_reference;
  END IF;

  -- Exigir status prévio aprovado
  IF v_refund.status <> 'aprovado' THEN
    RAISE EXCEPTION 'Operação rejeitada: apenas reembolsos com status "aprovado" podem ser liquidados. Status atual: %.',
      v_refund.status;
  END IF;

  -- Exigir método de pagamento
  IF p_payment_method IS NULL OR trim(p_payment_method) = '' THEN
    RAISE EXCEPTION 'Método de pagamento é obrigatório para registrar a liquidação do reembolso.';
  END IF;

  -- Exigir comprovante ou referência bancária
  IF p_payment_reference IS NULL OR trim(p_payment_reference) = '' THEN
    RAISE EXCEPTION 'Referência ou comprovante bancário da operação é obrigatório.';
  END IF;

  SELECT coalesce(raw_user_meta_data->>'full_name', email) INTO v_user_name
  FROM auth.users WHERE id = v_user_id;

  UPDATE public.client_refunds
  SET
    status = 'pago',
    payment_method = trim(p_payment_method),
    payment_reference = trim(p_payment_reference),
    paid_at = timezone('utc', now()),
    paid_by = v_user_id,
    paid_by_name = v_user_name,
    notes = coalesce(p_notes, notes),
    updated_at = timezone('utc', now())
  WHERE id = p_refund_id;

  RETURN jsonb_build_object(
    'success', true,
    'refund_id', p_refund_id,
    'status', 'pago',
    'paid_at', timezone('utc', now()),
    'payment_reference', trim(p_payment_reference),
    'message', 'Pagamento de reembolso liquidado com sucesso com comprovante bancário registrado.'
  );
END;
$$;

-- -----------------------------------------------------------------------------
-- 11. POLÍTICAS DE PERMISSÕES E PROTEÇÃO DE ACESSO DIRETO (GRANTS E REVOKES)
-- -----------------------------------------------------------------------------
-- Revogar permissões perigosas de escrita direta para authenticated nas tabelas financeiras
REVOKE INSERT, UPDATE, DELETE ON public.client_credits FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.client_credit_usages FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.client_refunds FROM authenticated;
REVOKE ALL ON public.supplier_recovery_records FROM authenticated;

-- Conceder apenas leitura (SELECT) para a equipe autenticada
GRANT SELECT ON public.client_credits TO authenticated;
GRANT SELECT ON public.client_credit_usages TO authenticated;
GRANT SELECT ON public.client_refunds TO authenticated;

-- Para supplier_recovery_records, apenas authenticated com papel admin via RLS pode operar
GRANT SELECT, INSERT, UPDATE ON public.supplier_recovery_records TO authenticated;

-- Conceder permissões totais para service_role
GRANT ALL ON public.client_credits TO service_role;
GRANT ALL ON public.client_credit_usages TO service_role;
GRANT ALL ON public.client_refunds TO service_role;
GRANT ALL ON public.supplier_recovery_records TO service_role;

-- Grants de execução das RPCs autorizadas
GRANT EXECUTE ON FUNCTION public.grant_client_credit TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.use_client_credit TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.request_client_refund TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.approve_client_refund TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.pay_client_refund TO authenticated, service_role;

COMMIT;
