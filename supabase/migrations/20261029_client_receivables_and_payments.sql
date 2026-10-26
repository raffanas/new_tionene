-- =============================================================================
-- TÍO NENÊ - CONTAS A RECEBER DOS CLIENTES E CONTROLE CAMBIAL (v0.1.43)
-- Arquivo: supabase/migrations/20261029_client_receivables_and_payments.sql
--
-- ATENÇÃO: NÃO EXECUTAR ESTA MIGRATION REMOTAMENTE NESTA TAREFA.
-- Migration local preparada para posterior execução controlada no Supabase.
--
-- REGRAS E GARANTIAS:
-- 1. RECEBIMENTOS INTEGRADOS AOS CONTRATOS:
--    Múltiplos recebimentos por contrato, permitindo pagamentos parciais e quitação integral.
--    Status financeiro derivado do saldo: 'pendente', 'parcialmente_pago', 'pago', 'vencido', 'cancelado'.
-- 2. CONTROLE CAMBIAL EXPLÍCITO (BRL PARA USD):
--    Recebimento em BRL para contrato em USD exige taxa de câmbio explícita e data/fonte.
--    Fórmula: amortized_amount (USD) = amount_received (BRL) / exchange_rate (BRL por USD).
--    Cotações históricas permanecem imutáveis permanentemente.
-- 3. PERMISSÕES E ISOLAMENTO (RBAC):
--    Vendedores e moderadores podem registrar recebimentos e consultar extratos de clientes.
--    Custos de fornecedores e margens permanecem estritamente invisíveis para não-admins.
--    Estornos de recebimentos são EXCLUSIVOS de administradores.
-- 4. CONCORRÊNCIA E ANTI-DEADLOCK:
--    Ordem estrita de bloqueio: 1º contracts (FOR UPDATE), 2º client_payment_entries (FOR UPDATE).
-- 5. IDEMPOTÊNCIA E AUDITORIA:
--    Chave de idempotência (idempotency_key) impede duplicidade acidental.
--    Estornos auditáveis mantêm registros originais (is_reversed = true).
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. ATUALIZAÇÃO DA TABELA public.contracts PARA CONTROLE DE RECEBÍVEIS
-- -----------------------------------------------------------------------------
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS seller_name TEXT,
  ADD COLUMN IF NOT EXISTS due_date DATE,
  ADD COLUMN IF NOT EXISTS client_paid_amount NUMERIC(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS client_payment_status TEXT DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS last_client_payment_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_contracts_client_payment_status ON public.contracts(client_payment_status);
CREATE INDEX IF NOT EXISTS idx_contracts_due_date ON public.contracts(due_date);

-- -----------------------------------------------------------------------------
-- 2. TABELA: public.client_payment_entries (Lançamentos de Recebimentos dos Clientes)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.client_payment_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE RESTRICT,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  amount_received NUMERIC(12, 2) NOT NULL CHECK (amount_received > 0),
  received_currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
  exchange_rate NUMERIC(12, 4) NOT NULL DEFAULT 1.0000 CHECK (exchange_rate > 0),
  amortized_amount NUMERIC(12, 2) NOT NULL CHECK (amortized_amount > 0),
  contract_currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
  exchange_rate_date DATE,
  exchange_rate_source TEXT,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method VARCHAR(50) NOT NULL DEFAULT 'transferencia', -- 'pix', 'cartao_credito', 'cartao_debito', 'transferencia', 'especie', 'wise', 'link_pagamento', 'outro'
  reference VARCHAR(150),
  notes TEXT,
  idempotency_key TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_reversed BOOLEAN NOT NULL DEFAULT false,
  reversed_at TIMESTAMPTZ,
  reversed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reversal_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Índices operacionais e de idempotência
CREATE INDEX IF NOT EXISTS idx_client_pay_entries_contract_id ON public.client_payment_entries(contract_id);
CREATE INDEX IF NOT EXISTS idx_client_pay_entries_client_id ON public.client_payment_entries(client_id);
CREATE INDEX IF NOT EXISTS idx_client_pay_entries_date ON public.client_payment_entries(payment_date);
CREATE INDEX IF NOT EXISTS idx_client_pay_entries_is_reversed ON public.client_payment_entries(is_reversed);
CREATE UNIQUE INDEX IF NOT EXISTS idx_client_pay_entries_idempotency ON public.client_payment_entries(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 3. PERMISSÕES E RLS EM public.client_payment_entries
-- -----------------------------------------------------------------------------
-- Bloquear mutações diretas via API (INSERT/UPDATE/DELETE) para authenticated e anon
REVOKE ALL ON public.client_payment_entries FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.client_payment_entries TO authenticated;
GRANT ALL ON public.client_payment_entries TO service_role;

ALTER TABLE public.client_payment_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "client_payment_entries_staff_select" ON public.client_payment_entries;

-- Leitura permitida para equipe autenticada (Admin, Moderador, Vendedor)
CREATE POLICY "client_payment_entries_staff_select" ON public.client_payment_entries
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'moderator', 'user')
    )
  );

-- -----------------------------------------------------------------------------
-- 4. RPC: public.record_client_payment
-- -----------------------------------------------------------------------------
-- Permite registrar recebimentos parciais ou integrais de clientes.
-- Acessível por Admin, moderadores e vendedores autorizados.
-- Suporta pagamentos em moeda estrangeira (ex: BRL recebido para contrato em USD)
-- com taxa de câmbio explícita, cálculo no banco e preservação histórica imutável.
CREATE OR REPLACE FUNCTION public.record_client_payment(
  p_contract_id UUID,
  p_amount_received NUMERIC,
  p_received_currency TEXT DEFAULT 'BRL',
  p_exchange_rate NUMERIC DEFAULT 1.0,
  p_amortized_amount NUMERIC DEFAULT NULL,
  p_exchange_rate_date DATE DEFAULT NULL,
  p_exchange_rate_source TEXT DEFAULT NULL,
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
  v_user_role TEXT;
  v_contract RECORD;
  v_existing_entry RECORD;
  v_recv_curr TEXT;
  v_ctr_curr TEXT;
  v_exchange_rate NUMERIC;
  v_amortized NUMERIC;
  v_current_amortized NUMERIC;
  v_pending_balance NUMERIC;
  v_new_amortized NUMERIC;
  v_new_status TEXT;
  v_entry_id UUID;
  v_idem_key TEXT;
  v_is_cross_currency BOOLEAN := false;
BEGIN
  -- 1. Validar autenticação e perfil (admin, moderator ou user)
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: operação requer usuário autenticado.';
  END IF;

  SELECT role INTO v_user_role
  FROM public.user_roles
  WHERE user_id = v_user_id
  LIMIT 1;

  IF v_user_role IS NULL OR v_user_role NOT IN ('admin', 'moderator', 'user') THEN
    RAISE EXCEPTION 'Acesso negado: usuário não possui permissão para registrar recebimentos de clientes.';
  END IF;

  IF p_amount_received IS NULL OR p_amount_received <= 0 THEN
    RAISE EXCEPTION 'Valor recebido deve ser maior que zero.';
  END IF;

  v_idem_key := NULLIF(trim(p_idempotency_key), '');

  -- 2. ORDEM DE BLOQUEIO PADRONIZADA: Bloquear contracts PRIMEIRO
  SELECT * INTO v_contract
  FROM public.contracts
  WHERE id = p_contract_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contrato não encontrado (ID: %)', p_contract_id;
  END IF;

  -- 3. CONTRATOS ELEGÍVEIS: Apenas vendas oficiais (bloquear rascunho e cancelado)
  IF v_contract.status = 'rascunho' THEN
    RAISE EXCEPTION 'Não é permitido registrar recebimento em contrato com status rascunho. O contrato deve ser emitido oficialmente antes de receber pagamentos.';
  END IF;

  IF v_contract.status = 'cancelado' THEN
    RAISE EXCEPTION 'Não é permitido registrar recebimento em contrato cancelado.';
  END IF;

  IF v_contract.status NOT IN ('emitido', 'assinado', 'finalizado', 'concluido') THEN
    RAISE EXCEPTION 'Não é permitido registrar recebimento em contrato no estado "%". Apenas vendas oficiais emitidas, assinadas ou finalizadas são elegíveis.', v_contract.status;
  END IF;

  -- 4. CONTROLE CAMBIAL EXPLÍCITO E CÁLCULO DA AMORTIZAÇÃO NO BANCO
  v_recv_curr := upper(trim(COALESCE(p_received_currency, 'BRL')));
  v_ctr_curr := upper(trim(COALESCE(v_contract.currency, 'USD')));

  IF v_recv_curr = v_ctr_curr THEN
    v_exchange_rate := 1.0000;
    v_amortized := ROUND(p_amount_received, 2);
    v_is_cross_currency := false;

    -- Validar se foi passado valor amortizado arbitrário divergente
    IF p_amortized_amount IS NOT NULL AND abs(p_amortized_amount - v_amortized) > 0.01 THEN
      RAISE EXCEPTION 'Valor amortizado informado (% %) diverge do valor recebido (% %).',
        p_amortized_amount, v_ctr_curr, p_amount_received, v_recv_curr;
    END IF;
  ELSE
    v_is_cross_currency := true;

    -- Exigir taxa maior que zero (sem taxa presumida)
    IF p_exchange_rate IS NULL OR p_exchange_rate <= 0 THEN
      RAISE EXCEPTION 'Para recebimentos em moeda diferente da moeda contratual (%), é obrigatório informar taxa de câmbio válida maior que zero.', v_ctr_curr;
    END IF;
    v_exchange_rate := p_exchange_rate;

    -- Exigir data e origem da cotação
    IF p_exchange_rate_date IS NULL THEN
      RAISE EXCEPTION 'Para operações entre moedas distintas, é obrigatório informar a data de referência da cotação cambial (exchange_rate_date).';
    END IF;

    IF p_exchange_rate_source IS NULL OR trim(p_exchange_rate_source) = '' THEN
      RAISE EXCEPTION 'Para operações entre moedas distintas, é obrigatório informar a fonte ou origem da taxa de câmbio (exchange_rate_source).';
    END IF;

    -- Restringir as conversões às combinações efetivamente suportadas pela aplicação
    IF v_ctr_curr = 'USD' AND v_recv_curr = 'BRL' THEN
      -- Convenção oficial: 1 USD = X BRL. Amortização em USD = BRL recebido / taxa
      v_amortized := ROUND(p_amount_received / v_exchange_rate, 2);
    ELSIF v_ctr_curr = 'BRL' AND v_recv_curr = 'USD' THEN
      -- Convenção oficial: 1 USD = X BRL. Amortização em BRL = USD recebido * taxa
      v_amortized := ROUND(p_amount_received * v_exchange_rate, 2);
    ELSE
      RAISE EXCEPTION 'Conversão cambial não suportada entre % e %. As combinações oficiais suportadas pela aplicação são BRL recebido para contrato em USD ou USD recebido para contrato em BRL.',
        v_recv_curr, v_ctr_curr;
    END IF;

    -- Não aceitar p_amortized_amount arbitrário divergente do cálculo oficial
    IF p_amortized_amount IS NOT NULL AND abs(p_amortized_amount - v_amortized) > 0.01 THEN
      RAISE EXCEPTION 'Valor amortizado informado (% %) diverge do cálculo cambial oficial (% % calculado). Não é permitido informar amortização arbitrária.',
        p_amortized_amount, v_ctr_curr, v_amortized, v_ctr_curr;
    END IF;
  END IF;

  IF v_amortized <= 0 THEN
    RAISE EXCEPTION 'Valor amortizado calculado inválido (deve ser maior que zero).';
  END IF;

  -- 5. IDEMPOTÊNCIA COMPLETA: Validar contrato, montante, moeda, taxa, amortização, data e forma
  IF v_idem_key IS NOT NULL THEN
    -- Bloquear client_payment_entries em 2º lugar
    SELECT * INTO v_existing_entry
    FROM public.client_payment_entries
    WHERE idempotency_key = v_idem_key
    FOR UPDATE;

    IF FOUND THEN
      IF v_existing_entry.contract_id <> p_contract_id
         OR v_existing_entry.amount_received <> p_amount_received
         OR upper(v_existing_entry.received_currency) <> v_recv_curr
         OR v_existing_entry.exchange_rate <> v_exchange_rate
         OR v_existing_entry.amortized_amount <> v_amortized
         OR v_existing_entry.payment_date <> COALESCE(p_payment_date, CURRENT_DATE)
         OR v_existing_entry.payment_method <> COALESCE(p_payment_method, 'transferencia') THEN
        RAISE EXCEPTION 'Conflito de idempotência: a chave "%" já foi utilizada para outra operação financeira com parâmetros divergentes (contrato, valor, moeda, taxa de câmbio, amortização, data ou forma de pagamento).', v_idem_key;
      END IF;

      -- Idempotência confirmada: retorna dados do recebimento existente sem duplicar abatimento
      RETURN jsonb_build_object(
        'success', true,
        'entry_id', v_existing_entry.id,
        'contract_id', v_existing_entry.contract_id,
        'amount_received', v_existing_entry.amount_received,
        'received_currency', v_existing_entry.received_currency,
        'exchange_rate', v_existing_entry.exchange_rate,
        'amortized_amount', v_existing_entry.amortized_amount,
        'contract_currency', v_contract.currency,
        'total_contracted', v_contract.total_amount,
        'total_paid', v_contract.client_paid_amount,
        'pending_balance', GREATEST(0, v_contract.total_amount - COALESCE(v_contract.client_paid_amount, 0)),
        'payment_status', v_contract.client_payment_status,
        'is_idempotent_replay', true,
        'message', 'Recebimento já processado anteriormente (idempotência confirmada).'
      );
    END IF;
  END IF;

  -- 6. Calcular total já pago a partir dos lançamentos ativos
  SELECT COALESCE(SUM(amortized_amount), 0) INTO v_current_amortized
  FROM public.client_payment_entries
  WHERE contract_id = v_contract.id AND is_reversed = false;

  v_pending_balance := v_contract.total_amount - v_current_amortized;

  -- 7. Impedir pagamento superior ao saldo pendente
  IF v_amortized > (v_pending_balance + 0.005) THEN
    RAISE EXCEPTION 'Valor amortizado (% %) excede o saldo pendente do contrato (% %). Pagamentos superiores ao saldo contratual não são permitidos.',
      v_amortized, v_contract.currency, v_pending_balance, v_contract.currency;
  END IF;

  -- 8. Inserir lançamento de recebimento
  INSERT INTO public.client_payment_entries (
    contract_id,
    client_id,
    amount_received,
    received_currency,
    exchange_rate,
    amortized_amount,
    contract_currency,
    exchange_rate_date,
    exchange_rate_source,
    payment_date,
    payment_method,
    reference,
    notes,
    idempotency_key,
    created_by
  ) VALUES (
    v_contract.id,
    v_contract.client_id,
    p_amount_received,
    v_recv_curr,
    v_exchange_rate,
    v_amortized,
    v_ctr_curr,
    CASE WHEN v_is_cross_currency THEN p_exchange_rate_date ELSE NULL END,
    CASE WHEN v_is_cross_currency THEN trim(p_exchange_rate_source) ELSE NULL END,
    COALESCE(p_payment_date, CURRENT_DATE),
    COALESCE(p_payment_method, 'transferencia'),
    p_reference,
    p_notes,
    v_idem_key,
    v_user_id
  ) RETURNING id INTO v_entry_id;

  -- 9. Recalcular total amortizado de todos os lançamentos ativos (mesma transação)
  SELECT COALESCE(SUM(amortized_amount), 0) INTO v_new_amortized
  FROM public.client_payment_entries
  WHERE contract_id = v_contract.id AND is_reversed = false;

  -- 10. Determinar novo status financeiro
  IF (v_contract.total_amount - v_new_amortized) <= 0.005 THEN
    v_new_status := 'pago';
  ELSIF v_new_amortized > 0 THEN
    v_new_status := 'parcialmente_pago';
  ELSIF v_contract.due_date IS NOT NULL AND v_contract.due_date < CURRENT_DATE THEN
    v_new_status := 'vencido';
  ELSE
    v_new_status := 'pendente';
  END IF;

  -- 11. Atualizar contrato exclusivamente via RPC autorizada
  UPDATE public.contracts
  SET
    client_paid_amount = v_new_amortized,
    client_payment_status = v_new_status,
    last_client_payment_at = timezone('utc', now()),
    updated_at = timezone('utc', now())
  WHERE id = p_contract_id;

  RETURN jsonb_build_object(
    'success', true,
    'entry_id', v_entry_id,
    'contract_id', p_contract_id,
    'amount_received', p_amount_received,
    'received_currency', v_recv_curr,
    'exchange_rate', v_exchange_rate,
    'amortized_amount', v_amortized,
    'contract_currency', v_contract.currency,
    'total_contracted', v_contract.total_amount,
    'total_paid', v_new_amortized,
    'pending_balance', GREATEST(0, v_contract.total_amount - v_new_amortized),
    'payment_status', v_new_status,
    'is_idempotent_replay', false,
    'message', 'Recebimento de cliente registrado com sucesso.'
  );
END;
$$;

-- -----------------------------------------------------------------------------
-- 5. RPC: public.reverse_client_payment
-- -----------------------------------------------------------------------------
-- Estorna um recebimento lançado incorretamente mantendo histórico auditável.
-- OPERAÇÃO EXCLUSIVA DE ADMINISTRADOR.
-- Bloqueio estrito anti-deadlock:
-- 1º: Bloqueia contracts (FOR UPDATE)
-- 2º: Bloqueia client_payment_entries (FOR UPDATE)
CREATE OR REPLACE FUNCTION public.reverse_client_payment(
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
  v_contract RECORD;
  v_contract_id UUID;
  v_recalculated_amortized NUMERIC;
  v_new_status TEXT;
BEGIN
  -- 1. Validar autenticação e exigir papel ADMIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: operação requer usuário autenticado.';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = v_user_id AND role = 'admin'
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem estornar recebimentos de clientes.';
  END IF;

  IF p_reversal_reason IS NULL OR trim(p_reversal_reason) = '' THEN
    RAISE EXCEPTION 'É obrigatório informar a justificativa do estorno para fins de auditoria.';
  END IF;

  -- 2. Localizar a qual contrato o recebimento pertence
  SELECT contract_id INTO v_contract_id
  FROM public.client_payment_entries
  WHERE id = p_payment_entry_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lançamento de recebimento não encontrado (ID: %)', p_payment_entry_id;
  END IF;

  -- 3. ORDEM DE BLOQUEIO PADRONIZADA: Bloquear contracts PRIMEIRO
  SELECT * INTO v_contract
  FROM public.contracts
  WHERE id = v_contract_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contrato relacionado não encontrado (ID: %)', v_contract_id;
  END IF;

  IF v_contract.status = 'cancelado' THEN
    RAISE EXCEPTION 'Não é permitido estornar recebimento em contrato cancelado.';
  END IF;

  -- 4. ORDEM DE BLOQUEIO PADRONIZADA: Bloquear client_payment_entries DEPOIS
  SELECT * INTO v_entry
  FROM public.client_payment_entries
  WHERE id = p_payment_entry_id
  FOR UPDATE;

  IF v_entry.is_reversed THEN
    RAISE EXCEPTION 'Este recebimento já foi estornado anteriormente em %.', v_entry.reversed_at;
  END IF;

  -- 5. Marcar estorno auditável preservando registro original
  UPDATE public.client_payment_entries
  SET
    is_reversed = true,
    reversed_at = timezone('utc', now()),
    reversed_by = v_user_id,
    reversal_reason = trim(p_reversal_reason),
    updated_at = timezone('utc', now())
  WHERE id = p_payment_entry_id;

  -- 6. Recalcular total amortizado a partir dos lançamentos ativos restantes (mesma transação)
  SELECT COALESCE(SUM(amortized_amount), 0) INTO v_recalculated_amortized
  FROM public.client_payment_entries
  WHERE contract_id = v_contract.id AND is_reversed = false;

  -- 7. Determinar novo status
  IF (v_contract.total_amount - v_recalculated_amortized) <= 0.005 THEN
    v_new_status := 'pago';
  ELSIF v_recalculated_amortized > 0 THEN
    v_new_status := 'parcialmente_pago';
  ELSIF v_contract.due_date IS NOT NULL AND v_contract.due_date < CURRENT_DATE THEN
    v_new_status := 'vencido';
  ELSE
    v_new_status := 'pendente';
  END IF;

  -- 8. Atualizar contrato exclusivamente via RPC autorizada
  UPDATE public.contracts
  SET
    client_paid_amount = v_recalculated_amortized,
    client_payment_status = v_new_status,
    updated_at = timezone('utc', now())
  WHERE id = v_contract.id;

  RETURN jsonb_build_object(
    'success', true,
    'payment_entry_id', p_payment_entry_id,
    'contract_id', v_contract.id,
    'reversed_amortized_amount', v_entry.amortized_amount,
    'recalculated_paid_amount', v_recalculated_amortized,
    'pending_balance', GREATEST(0, v_contract.total_amount - v_recalculated_amortized),
    'new_payment_status', v_new_status,
    'contract_currency', v_contract.currency,
    'message', 'Recebimento estornado com sucesso mantendo histórico auditável.'
  );
END;
$$;

-- -----------------------------------------------------------------------------
-- 6. PERMISSÕES E EXECUTE NAS RPCS
-- -----------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.record_client_payment FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_client_payment TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.reverse_client_payment FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reverse_client_payment TO authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 7. PROTEÇÃO DE PRIVILÉGIOS EM public.contracts (COLUNAS FINANCEIRAS)
-- -----------------------------------------------------------------------------
-- Protege as colunas financeiras de recebíveis por privilégios reais do PostgreSQL:
-- 1. Revoga UPDATE a nível de tabela para authenticated
REVOKE UPDATE ON TABLE public.contracts FROM authenticated;

-- 2. Concede UPDATE a authenticated exclusivamente nas colunas permitidas para
--    edição normal dos contratos por vendedores e equipe.
--    As colunas de controle financeiro do sistema:
--      - client_paid_amount
--      - client_payment_status
--      - last_client_payment_at
--    e as colunas de auditoria da finalização oficial:
--      - finalized_at
--      - finalized_by
--    permanecem REVOGADAS para authenticated, tornando qualquer tentativa de alteração
--    ou finalização direta via PostgREST/API impossível a nível de motor SQL (permission denied).
GRANT UPDATE (
  contract_number,
  client_id,
  client_name,
  client_cpf,
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
  hotels_schedule,
  deposit_amount,
  deposit_observation,
  balance_amount,
  balance_observation,
  total_amount,
  currency,
  status,
  terms_clauses,
  internal_notes,
  seller_name,
  due_date,
  updated_at
) ON TABLE public.contracts TO authenticated;

-- 3. Garantir permissões completas para o proprietário das RPCs (postgres) e service_role
GRANT ALL ON TABLE public.contracts TO postgres, service_role;

-- -----------------------------------------------------------------------------
-- 8. GATILHO DE INTEGRIDADE DE CONTRATOS (public.check_contracts_integrity)
-- -----------------------------------------------------------------------------
-- Preserva integralmente as regras originais de emissão, integridade e finalização
-- da Tarefa 18, sem dependência de flags de sessão (current_setting).
-- Bloqueia alteração direta de status para 'finalizado'/'cancelado' por vendedores.
-- Assegura que contratos finalizados não sofram alterações cadastrais/contratuais.
CREATE OR REPLACE FUNCTION public.check_contracts_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_is_admin boolean;
  v_calling_user_id uuid;
BEGIN
  v_calling_user_id := auth.uid();
  IF v_calling_user_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  v_is_admin := public.is_admin();

  -- =========================================================================
  -- 1. DELETE
  -- =========================================================================
  IF TG_OP = 'DELETE' THEN
    IF NOT v_is_admin THEN
      RAISE EXCEPTION 'Acesso negado: a exclusão física de contratos é restrita a administradores.';
    END IF;

    -- Bloqueio absoluto se o contrato tiver itens com vínculos financeiros em pagamentos
    IF EXISTS (
      SELECT 1 FROM public.contract_items ci
      JOIN public.supplier_payment_allocations spa ON spa.contract_item_id = ci.id
      WHERE ci.contract_id = OLD.id
    ) THEN
      RAISE EXCEPTION 'Integridade violada: o contrato % possui itens com pagamentos a fornecedores vinculados e não pode ser excluído fisicamente.', OLD.id;
    END IF;

    -- Bloqueio se possuir itens com voucher operacional emitido
    IF EXISTS (
      SELECT 1 FROM public.contract_items
      WHERE contract_id = OLD.id 
        AND voucher_ref IS NOT NULL 
        AND trim(voucher_ref) <> ''
    ) THEN
      RAISE EXCEPTION 'Integridade violada: o contrato % possui passeios com vouchers emitidos e não pode ser excluído fisicamente.', OLD.id;
    END IF;

    RETURN OLD;
  END IF;

  -- =========================================================================
  -- 2. UPDATE
  -- =========================================================================
  IF TG_OP = 'UPDATE' THEN
    -- Imutabilidade do identificador único do contrato
    IF NEW.id <> OLD.id THEN
      RAISE EXCEPTION 'Violação de segurança: o identificador (id) do contrato é imutável.';
    END IF;

    IF NOT v_is_admin THEN
      -- Contratos já finalizados ou cancelados não podem ter dados contratuais alterados por vendedores
      IF OLD.status IN ('cancelado', 'finalizado', 'concluido') THEN
        IF OLD.status = 'cancelado' THEN
          RAISE EXCEPTION 'Acesso negado: contratos cancelados não podem ser alterados.';
        END IF;

        -- Se contrato finalizado/concluido: impede qualquer alteração cadastral ou de termos por vendedores
        IF (NEW.client_name IS DISTINCT FROM OLD.client_name)
           OR (NEW.client_cpf IS DISTINCT FROM OLD.client_cpf)
           OR (NEW.client_email IS DISTINCT FROM OLD.client_email)
           OR (NEW.client_phone IS DISTINCT FROM OLD.client_phone)
           OR (NEW.total_amount IS DISTINCT FROM OLD.total_amount)
           OR (NEW.currency IS DISTINCT FROM OLD.currency)
           OR (NEW.status IS DISTINCT FROM OLD.status)
           OR (NEW.contract_number IS DISTINCT FROM OLD.contract_number)
           OR (NEW.arrival_date IS DISTINCT FROM OLD.arrival_date)
           OR (NEW.departure_date IS DISTINCT FROM OLD.departure_date)
           OR (NEW.adults_count IS DISTINCT FROM OLD.adults_count)
           OR (NEW.children_count IS DISTINCT FROM OLD.children_count)
           OR (NEW.infants_count IS DISTINCT FROM OLD.infants_count)
           OR (NEW.hotels_schedule IS DISTINCT FROM OLD.hotels_schedule)
           OR (NEW.deposit_amount IS DISTINCT FROM OLD.deposit_amount)
           OR (NEW.balance_amount IS DISTINCT FROM OLD.balance_amount)
           OR (NEW.terms_clauses IS DISTINCT FROM OLD.terms_clauses) THEN
          RAISE EXCEPTION 'Acesso negado: contratos finalizados não podem ter dados cadastrais ou valores alterados por vendedores.';
        END IF;
      END IF;

      -- Vendedores não podem cancelar contratos ou substituir 'Finalizar Venda' por UPDATE direto de status
      IF NEW.status IN ('cancelado', 'finalizado', 'concluido') AND NEW.status <> OLD.status THEN
        -- Preserva integralmente a finalização da Tarefa 18:
        -- Permite apenas quando a transação carimba finalized_at e finalized_by (executada pela RPC oficial finalize_contract_sale)
        IF NOT (NEW.status = 'finalizado' AND OLD.status IN ('emitido', 'assinado') AND NEW.finalized_at IS NOT NULL AND NEW.finalized_by IS NOT NULL) THEN
          RAISE EXCEPTION 'Acesso negado: cancelamento ou finalização de contratos é uma operação restrita a administradores. Utilize a função oficial Finalizar Venda.';
        END IF;
      END IF;

      -- Não permite alteração de número de contrato já estabelecido
      IF OLD.contract_number IS NOT NULL AND trim(OLD.contract_number) <> '' 
         AND NEW.contract_number <> OLD.contract_number THEN
        RAISE EXCEPTION 'Acesso negado: o número de um contrato já emitido não pode ser alterado por vendedores.';
      END IF;

      -- Preserva data de criação original
      IF NEW.created_at <> OLD.created_at THEN
        NEW.created_at := OLD.created_at;
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  -- =========================================================================
  -- 3. INSERT
  -- =========================================================================
  IF TG_OP = 'INSERT' THEN
    IF NOT v_is_admin THEN
      IF NEW.status IN ('cancelado', 'finalizado', 'concluido') THEN
        RAISE EXCEPTION 'Acesso negado: novos contratos cadastrados por vendedores não podem iniciar como cancelados ou finalizados.';
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

ALTER FUNCTION public.check_contracts_integrity() OWNER TO postgres;

COMMIT;

