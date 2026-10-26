-- =============================================================================
-- TÍO NENÊ - CARTEIRA DE VIAGEM DO CLIENTE (v0.1.43)
-- Arquivo: supabase/migrations/20261101_travel_wallets.sql
--
-- ATENÇÃO: NÃO EXECUTAR ESTA MIGRATION REMOTAMENTE NESTA TAREFA.
-- Migration local preparada e corrigida para posterior execução controlada no Supabase.
--
-- REGRAS E DIRETRIZES DA TAREFA 26 (CORREÇÃO PONTUAL DE INTEGRIDADE):
-- 1. PRESERVAÇÃO RIGOROSA DO HISTÓRICO:
--    - travel_wallet_deliveries utiliza ON DELETE RESTRICT para travel_wallets e contracts.
--    - Imutabilidade do histórico garantida por ausência de permissões e trigger de bloqueio.
--    - Leitura autorizada exclusivamente para perfis operacionais (admin, moderator, user).
-- 2. ENTREGA ATÔMICA E TRANSAÇÃO SEGURA (RPC SECURITY DEFINER):
--    - RPC public.confirm_travel_wallet_delivery criada com SECURITY DEFINER.
--    - Validação de autenticação (auth.uid()) e papel operacional no início da transação.
--    - Bloqueio explícito com SELECT FOR UPDATE para proteção contra concorrência.
--    - Incremento atômico de delivered_version exatamente uma vez.
--    - Atualização simultânea da carteira e inserção no histórico; rollback automático se falhar.
-- 3. PERMISSÕES E BLINDAGEM DE VENDEDORES:
--    - INSERT, UPDATE e DELETE diretos em travel_wallet_deliveries REVOGADOS para authenticated.
--    - Trigger de proteção em travel_wallets impede vendedores de manipular manualmente
--      versões e metadados de entrega, preservando a edição das personalizações.
-- 4. INDEPENDÊNCIA E NÃO-MUTABILIDADE DO CONTRATO:
--    - Não altera o contrato original, PDFs contratuais nem reservas operacionais.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. TABELA: public.travel_wallets (Carteiras de Viagem dos Clientes)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.travel_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE RESTRICT,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pendente' 
    CHECK (status IN ('pendente', 'em_preparacao', 'pronta', 'entregue', 'necessita_atualizacao')),
  welcome_message TEXT,
  general_guidelines TEXT,
  client_recommendations TEXT,
  emergency_contacts JSONB DEFAULT '[]'::jsonb,
  service_customizations JSONB DEFAULT '{}'::jsonb,
  last_operational_snapshot JSONB DEFAULT '{}'::jsonb,
  version INT NOT NULL DEFAULT 1,
  delivered_version INT NOT NULL DEFAULT 0,
  last_delivered_at TIMESTAMPTZ,
  last_delivered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  last_delivered_by_name TEXT,
  last_delivered_to TEXT,
  last_delivery_channel VARCHAR(30) DEFAULT 'whatsapp'
    CHECK (last_delivery_channel IN ('whatsapp', 'email', 'presencial', 'outro')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT uq_travel_wallets_contract UNIQUE (contract_id)
);

CREATE INDEX IF NOT EXISTS idx_travel_wallets_contract_id ON public.travel_wallets(contract_id);
CREATE INDEX IF NOT EXISTS idx_travel_wallets_client_id ON public.travel_wallets(client_id);
CREATE INDEX IF NOT EXISTS idx_travel_wallets_status ON public.travel_wallets(status);

-- -----------------------------------------------------------------------------
-- 2. TABELA: public.travel_wallet_deliveries (Histórico Imutável de Entregas)
--    Relacionamentos com ON DELETE RESTRICT para preservação de auditoria
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.travel_wallet_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.travel_wallets(id) ON DELETE RESTRICT,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE RESTRICT,
  delivered_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  delivered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  delivered_by_name TEXT NOT NULL,
  delivery_channel VARCHAR(30) NOT NULL DEFAULT 'whatsapp'
    CHECK (delivery_channel IN ('whatsapp', 'email', 'presencial', 'outro')),
  destination_contact TEXT NOT NULL,
  wallet_version INT NOT NULL DEFAULT 1,
  notes TEXT,
  snapshot_summary JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_wallet_deliv_wallet_id ON public.travel_wallet_deliveries(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_deliv_contract_id ON public.travel_wallet_deliveries(contract_id);
CREATE INDEX IF NOT EXISTS idx_wallet_deliv_delivered_at ON public.travel_wallet_deliveries(delivered_at DESC);

-- -----------------------------------------------------------------------------
-- 3. TRIGGER: Atualização automática de updated_at em travel_wallets
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_travel_wallet_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_travel_wallet_updated_at ON public.travel_wallets;
CREATE TRIGGER trigger_travel_wallet_updated_at
  BEFORE UPDATE ON public.travel_wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_travel_wallet_updated_at();

-- -----------------------------------------------------------------------------
-- 4. TRIGGER: IMUTABILIDADE DO HISTÓRICO DE ENTREGAS
--    Bloqueia categoricamente UPDATE e DELETE em travel_wallet_deliveries
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_travel_wallet_deliveries_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Operação não permitida: registros históricos de entrega da carteira de viagem são imutáveis e não podem ser alterados ou excluídos.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prevent_deliveries_modification ON public.travel_wallet_deliveries;
CREATE TRIGGER trigger_prevent_deliveries_modification
  BEFORE UPDATE OR DELETE ON public.travel_wallet_deliveries
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_travel_wallet_deliveries_modification();

-- -----------------------------------------------------------------------------
-- 5. TRIGGER: PROTEÇÃO DE TRANSIÇÃO DE STATUS E INTEGRIDADE DA CARTEIRA
--    Complementa as permissões por coluna impedindo que usuários criem ou
--    alterem diretamente o status para 'entregue' fora da RPC oficial,
--    e impedindo que carteiras já entregues sejam revertidas indevidamente para 'pendente'.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_travel_wallet_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Se for INSERT direto:
  IF TG_OP = 'INSERT' THEN
    -- Impedir criação direta com status 'entregue'
    IF NEW.status = 'entregue' AND current_user = 'authenticated' THEN
      RAISE EXCEPTION 'Acesso negado: a carteira não pode ser criada diretamente com status entregue. Utilize a função oficial confirm_travel_wallet_delivery.';
    END IF;
    RETURN NEW;
  END IF;

  -- 2. Se for UPDATE direto:
  -- Impedir alteração direta de status para 'entregue'
  -- Apenas a RPC confirm_travel_wallet_delivery (SECURITY DEFINER com incremento de versão) pode marcar 'entregue'
  IF NEW.status = 'entregue' THEN
    IF current_user = 'authenticated' OR (NEW.delivered_version <= OLD.delivered_version) THEN
      RAISE EXCEPTION 'Acesso negado: a carteira não pode ser marcada como entregue diretamente. Utilize a função oficial confirm_travel_wallet_delivery.';
    END IF;
  END IF;

  -- Preservar carteiras já entregues contra regressão indevida para 'pendente'
  IF OLD.delivered_version > 0 AND NEW.status = 'pendente' THEN
    RAISE EXCEPTION 'Operação inválida: uma carteira com histórico de entregas não pode ser redefinida para pendente.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_travel_wallet_delivery_metadata ON public.travel_wallets;
DROP TRIGGER IF EXISTS trigger_check_travel_wallet_status_transition ON public.travel_wallets;
CREATE TRIGGER trigger_check_travel_wallet_status_transition
  BEFORE INSERT OR UPDATE ON public.travel_wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.check_travel_wallet_status_transition();

-- -----------------------------------------------------------------------------
-- 6. RPC: CONFIRMAÇÃO ATÔMICA DE ENTREGA DA CARTEIRA (SECURITY DEFINER)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.confirm_travel_wallet_delivery(
  p_wallet_id UUID DEFAULT NULL,
  p_contract_id UUID DEFAULT NULL,
  p_destination_contact TEXT DEFAULT NULL,
  p_delivery_channel VARCHAR DEFAULT 'whatsapp',
  p_delivered_by_name TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_snapshot JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_user_role TEXT;
  v_user_name TEXT;
  v_wallet RECORD;
  v_contract_id UUID;
  v_new_version INT;
  v_delivery_id UUID;
  v_now TIMESTAMPTZ;
  v_clean_phone TEXT;
BEGIN
  -- 1. Validar usuário autenticado
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: operação requer usuário autenticado.';
  END IF;

  -- 2. Validar papel operacional (admin, moderator, user)
  SELECT ur.role INTO v_user_role
  FROM public.user_roles ur
  WHERE ur.user_id = v_user_id
    AND ur.role IN ('admin', 'moderator', 'user')
  LIMIT 1;

  IF v_user_role IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: usuário não possui permissão operacional para entregar carteiras.';
  END IF;

  -- 3. Validar contato de destino obrigatório (mínimo 8 dígitos)
  v_clean_phone := trim(COALESCE(p_destination_contact, ''));
  IF v_clean_phone = '' OR length(regexp_replace(v_clean_phone, '\D', '', 'g')) < 8 THEN
    RAISE EXCEPTION 'Telefone ou contato de destino inválido ou vazio (mínimo 8 dígitos numéricos).';
  END IF;

  -- 4. Validar canal de entrega
  IF p_delivery_channel IS NULL OR p_delivery_channel NOT IN ('whatsapp', 'email', 'presencial', 'outro') THEN
    RAISE EXCEPTION 'Canal de entrega inválido. Canais permitidos: whatsapp, email, presencial, outro.';
  END IF;

  -- Resolver nome do operador
  v_user_name := trim(COALESCE(p_delivered_by_name, ''));
  IF v_user_name = '' THEN
    SELECT COALESCE(full_name, email) INTO v_user_name
    FROM public.profiles
    WHERE id = v_user_id;

    IF v_user_name IS NULL OR trim(v_user_name) = '' THEN
      v_user_name := 'Operador Tío Nenê';
    END IF;
  END IF;

  -- 5. Identificar e bloquear carteira com SELECT FOR UPDATE
  IF p_wallet_id IS NOT NULL THEN
    SELECT * INTO v_wallet
    FROM public.travel_wallets
    WHERE id = p_wallet_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Carteira de viagem (ID: %) não encontrada.', p_wallet_id;
    END IF;
    v_contract_id := v_wallet.contract_id;
  ELSIF p_contract_id IS NOT NULL THEN
    SELECT * INTO v_wallet
    FROM public.travel_wallets
    WHERE contract_id = p_contract_id
    FOR UPDATE;

    IF NOT FOUND THEN
      -- Se ainda não houver registro em travel_wallets, validar que o contrato existe
      IF NOT EXISTS (SELECT 1 FROM public.contracts WHERE id = p_contract_id) THEN
        RAISE EXCEPTION 'Contrato (ID: %) não encontrado.', p_contract_id;
      END IF;

      -- Criar registro inicial da carteira na transação
      INSERT INTO public.travel_wallets (
        contract_id,
        status,
        version,
        delivered_version,
        created_by,
        created_by_name
      ) VALUES (
        p_contract_id,
        'em_preparacao',
        1,
        0,
        v_user_id,
        v_user_name
      )
      RETURNING * INTO v_wallet;
    END IF;
    v_contract_id := p_contract_id;
  ELSE
    RAISE EXCEPTION 'É obrigatório informar p_wallet_id ou p_contract_id.';
  END IF;

  -- 6. Incrementar delivered_version exatamente uma vez
  v_new_version := COALESCE(v_wallet.delivered_version, 0) + 1;
  v_now := timezone('utc', now());

  -- 7. Inserir registro no histórico travel_wallet_deliveries (atômico)
  INSERT INTO public.travel_wallet_deliveries (
    wallet_id,
    contract_id,
    delivered_at,
    delivered_by,
    delivered_by_name,
    delivery_channel,
    destination_contact,
    wallet_version,
    notes,
    snapshot_summary,
    created_at
  ) VALUES (
    v_wallet.id,
    v_contract_id,
    v_now,
    v_user_id,
    v_user_name,
    p_delivery_channel,
    v_clean_phone,
    v_new_version,
    trim(COALESCE(p_notes, '')),
    COALESCE(p_snapshot, '{}'::jsonb),
    v_now
  )
  RETURNING id INTO v_delivery_id;

  -- 8. Atualizar a carteira de viagem na mesma transação
  UPDATE public.travel_wallets
  SET status = 'entregue',
      delivered_version = v_new_version,
      version = GREATEST(COALESCE(version, 1), v_new_version),
      last_operational_snapshot = COALESCE(p_snapshot, '{}'::jsonb),
      last_delivered_at = v_now,
      last_delivered_by = v_user_id,
      last_delivered_by_name = v_user_name,
      last_delivered_to = v_clean_phone,
      last_delivery_channel = p_delivery_channel,
      updated_at = v_now
  WHERE id = v_wallet.id;

  -- 9. Retornar identificador da entrega e versão gerada
  RETURN jsonb_build_object(
    'delivery_id', v_delivery_id,
    'wallet_id', v_wallet.id,
    'contract_id', v_contract_id,
    'wallet_version', v_new_version,
    'status', 'entregue',
    'delivered_at', v_now,
    'delivered_by_name', v_user_name,
    'destination_contact', v_clean_phone,
    'delivery_channel', p_delivery_channel
  );
END;
$$;

-- -----------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS) E POLÍTICAS DE ACESSO
-- -----------------------------------------------------------------------------
ALTER TABLE public.travel_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_wallet_deliveries ENABLE ROW LEVEL SECURITY;

-- 7.1 travel_wallets: Leitura para equipe operacional autenticada
DROP POLICY IF EXISTS "travel_wallets_team_select" ON public.travel_wallets;
CREATE POLICY "travel_wallets_team_select" ON public.travel_wallets
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'moderator', 'user')
    )
  );

-- 7.2 travel_wallets: Inserção e Edição de personalizações pela equipe
DROP POLICY IF EXISTS "travel_wallets_team_manage" ON public.travel_wallets;
CREATE POLICY "travel_wallets_team_manage" ON public.travel_wallets
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'moderator', 'user')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'moderator', 'user')
    )
  );

-- 7.3 travel_wallet_deliveries: EXCLUSIVAMENTE SELECT para authenticated
--     INSERT, UPDATE e DELETE diretos são PROIBIDOS para authenticated.
DROP POLICY IF EXISTS "travel_wallet_deliveries_select" ON public.travel_wallet_deliveries;
CREATE POLICY "travel_wallet_deliveries_select" ON public.travel_wallet_deliveries
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'moderator', 'user')
    )
  );

-- Remover quaisquer políticas antigas de gravação direta no histórico
DROP POLICY IF EXISTS "travel_wallet_deliveries_team_all" ON public.travel_wallet_deliveries;
DROP POLICY IF EXISTS "travel_wallet_deliveries_insert" ON public.travel_wallet_deliveries;

-- -----------------------------------------------------------------------------
-- 8. PERMISSÕES E GRANTS RIGOROSOS POR COLUNA
-- -----------------------------------------------------------------------------
-- Revogações de segurança
REVOKE ALL ON public.travel_wallet_deliveries FROM authenticated, anon;
REVOKE ALL ON public.travel_wallets FROM authenticated, anon;

-- Permissões em travel_wallets: Leitura autorizada
GRANT SELECT ON public.travel_wallets TO authenticated;

-- GRANT INSERT restrito exclusivamente às colunas de personalização e preparação inicial:
-- É categoricamente vedado INSERT direto de authenticated em:
-- delivered_version, last_delivered_at, last_delivered_by, last_delivered_by_name,
-- last_delivered_to, last_delivery_channel, last_operational_snapshot e version.
GRANT INSERT (
  contract_id,
  client_id,
  status,
  welcome_message,
  general_guidelines,
  client_recommendations,
  emergency_contacts,
  service_customizations,
  created_by_name
) ON public.travel_wallets TO authenticated;

-- GRANT UPDATE restrito exclusivamente às colunas de personalização e preparação:
-- É categoricamente vedado UPDATE direto de authenticated em:
-- delivered_version, last_delivered_at, last_delivered_by, last_delivered_by_name,
-- last_delivered_to, last_delivery_channel, last_operational_snapshot e version.
GRANT UPDATE (
  welcome_message,
  general_guidelines,
  client_recommendations,
  emergency_contacts,
  service_customizations,
  status,
  created_by_name,
  updated_at
) ON public.travel_wallets TO authenticated;

-- travel_wallet_deliveries: apenas SELECT concedido a usuários autenticados
GRANT SELECT ON public.travel_wallet_deliveries TO authenticated;

-- Permissão na RPC de confirmação atômica
GRANT EXECUTE ON FUNCTION public.confirm_travel_wallet_delivery TO authenticated;
REVOKE EXECUTE ON FUNCTION public.confirm_travel_wallet_delivery FROM anon;

-- Permissões completas para service_role (tarefas internas e migrações)
GRANT ALL ON public.travel_wallets TO service_role;
GRANT ALL ON public.travel_wallet_deliveries TO service_role;

COMMIT;
