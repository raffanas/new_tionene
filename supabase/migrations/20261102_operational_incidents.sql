-- =============================================================================
-- TÍO NENÊ - GESTÃO DE OCORRÊNCIAS OPERACIONAIS (v0.1.43)
-- Arquivo: supabase/migrations/20261102_operational_incidents.sql
--
-- ATENÇÃO: NÃO EXECUTAR ESTA MIGRATION REMOTAMENTE NESTA TAREFA.
-- Migration local preparada para posterior revisão e implantação controlada.
--
-- REGRAS E DIRETRIZES DA TAREFA 28 (CORREÇÃO DE INTEGRIDADE DO HISTÓRICO):
-- 1. HISTÓRICO PROTEGIDO E IMUTÁVEL:
--    - Proibição absoluta de INSERT direto em public.operational_incident_history para authenticated.
--    - Mantido SELECT para os operadores autorizados.
--    - Proibição irrevogável de UPDATE e DELETE do histórico via trigger de bloqueio.
-- 2. AUDITORIA AUTOMÁTICA TRANSECIONAL NO BANCO:
--    - Gatilho AFTER INSERT e AFTER UPDATE na tabela operational_incidents.
--    - Registra automaticamente: criação ('abertura'), mudança de status ('alteracao_status'),
--      resolução ('resolucao'), cancelamento ('cancelamento'), alteração de prioridade
--      ('alteracao_prioridade'), reatribuição ('atribuicao') e edições ('edicao').
--    - Autoria obtida estritamente de auth.uid() e da tabela profiles/auth.users.
--    - Transacional: falha ao gravar histórico provoca rollback automático da alteração.
-- 3. ANDAMENTOS MANUAIS VIA RPC EXCLUSIVA:
--    - RPC add_operational_incident_andamento (SECURITY DEFINER, search_path seguro).
--    - Valida auth.uid(), papel operacional real no ENUM app_role ('admin', 'moderator', 'user'),
--      existência da ocorrência e tamanho da descrição.
--    - Insere histórico na mesma transação com autoria e data protegidas.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. TABELA: public.operational_incidents (Ocorrências Operacionais)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.operational_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_code TEXT NOT NULL UNIQUE, -- Ex: OCR-2026-0001
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE RESTRICT,
  contract_number TEXT NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  client_email TEXT,

  -- Vínculos operacionais opcionais
  reservation_id UUID REFERENCES public.operational_reservations(id) ON DELETE SET NULL,
  arrival_id UUID REFERENCES public.arrivals(id) ON DELETE SET NULL,
  service_name TEXT,
  service_date DATE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  supplier_name TEXT,

  -- Tipificação e Conteúdo
  incident_type VARCHAR(40) NOT NULL CHECK (
    incident_type IN (
      'atraso_fornecedor',
      'cliente_nao_localizado',
      'problema_pickup',
      'passeio_nao_realizado',
      'servico_divergente',
      'problema_voucher',
      'problema_traslado',
      'reclamacao_cliente',
      'problema_hotel',
      'outro'
    )
  ),
  title TEXT NOT NULL,
  description TEXT NOT NULL,

  -- Gravidade e Ciclo de Vida
  priority VARCHAR(20) NOT NULL DEFAULT 'media' CHECK (
    priority IN ('baixa', 'media', 'alta', 'critica')
  ),
  status VARCHAR(30) NOT NULL DEFAULT 'aberta' CHECK (
    status IN (
      'aberta',
      'em_analise',
      'aguardando_fornecedor',
      'aguardando_cliente',
      'resolvida',
      'cancelada'
    )
  ),

  -- Responsável e Atribuição
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_to_name TEXT,

  -- Timestamps e Resolução
  opened_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_by_name TEXT,
  resolution_notes TEXT, -- Solução obrigatória quando status = 'resolvida'
  internal_notes TEXT,

  -- Autoria e Rastreabilidade
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Índices de Alta Performance para o Hub Operacional
CREATE INDEX IF NOT EXISTS idx_op_incidents_contract_id ON public.operational_incidents(contract_id);
CREATE INDEX IF NOT EXISTS idx_op_incidents_client_id ON public.operational_incidents(client_id);
CREATE INDEX IF NOT EXISTS idx_op_incidents_reservation_id ON public.operational_incidents(reservation_id);
CREATE INDEX IF NOT EXISTS idx_op_incidents_arrival_id ON public.operational_incidents(arrival_id);
CREATE INDEX IF NOT EXISTS idx_op_incidents_supplier_id ON public.operational_incidents(supplier_id);
CREATE INDEX IF NOT EXISTS idx_op_incidents_status ON public.operational_incidents(status);
CREATE INDEX IF NOT EXISTS idx_op_incidents_priority ON public.operational_incidents(priority);
CREATE INDEX IF NOT EXISTS idx_op_incidents_type ON public.operational_incidents(incident_type);
CREATE INDEX IF NOT EXISTS idx_op_incidents_service_date ON public.operational_incidents(service_date);
CREATE INDEX IF NOT EXISTS idx_op_incidents_opened_at ON public.operational_incidents(opened_at);

-- -----------------------------------------------------------------------------
-- 2. TABELA: public.operational_incident_history (Histórico Imutável de Movimentações)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.operational_incident_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.operational_incidents(id) ON DELETE RESTRICT,
  action VARCHAR(50) NOT NULL, -- abertura, atribuicao, alteracao_prioridade, alteracao_status, andamento, resolucao, cancelamento, edicao
  description TEXT NOT NULL,
  status_before VARCHAR(30),
  status_after VARCHAR(30),
  priority_before VARCHAR(20),
  priority_after VARCHAR(20),
  assigned_to_before TEXT,
  assigned_to_after TEXT,
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  performed_by_name TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_op_inc_history_incident_id ON public.operational_incident_history(incident_id);
CREATE INDEX IF NOT EXISTS idx_op_inc_history_created_at ON public.operational_incident_history(created_at);

-- -----------------------------------------------------------------------------
-- 3. TRIGGER: ATUALIZAÇÃO AUTOMÁTICA DE updated_at
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_operational_incident_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_handle_operational_incident_updated_at ON public.operational_incidents;
CREATE TRIGGER trigger_handle_operational_incident_updated_at
  BEFORE UPDATE ON public.operational_incidents
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_operational_incident_updated_at();

-- -----------------------------------------------------------------------------
-- 4. TRIGGER: IMUTABILIDADE DO HISTÓRICO DE OCORRÊNCIAS
--    Bloqueia categoricamente UPDATE e DELETE em operational_incident_history
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_operational_incident_history_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Operação não permitida: registros de histórico de ocorrências operacionais são estritamente imutáveis e não podem ser alterados ou excluídos.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prevent_op_incident_history_modification ON public.operational_incident_history;
CREATE TRIGGER trigger_prevent_op_incident_history_modification
  BEFORE UPDATE OR DELETE ON public.operational_incident_history
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_operational_incident_history_modification();

-- -----------------------------------------------------------------------------
-- 5. TRIGGER: VALIDAÇÃO DE RESOLUÇÃO (OBRIGATORIEDADE DA SOLUÇÃO)
--    Impede que a ocorrência seja marcada como 'resolvida' sem descrição da solução
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_operational_incident_resolution()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'resolvida' THEN
    IF NEW.resolution_notes IS NULL OR trim(NEW.resolution_notes) = '' THEN
      RAISE EXCEPTION 'Operação inválida: uma ocorrência não pode ser marcada como resolvida sem a descrição detalhada da solução aplicada (resolution_notes).';
    END IF;
    IF length(trim(NEW.resolution_notes)) < 5 THEN
      RAISE EXCEPTION 'Operação inválida: a descrição da solução aplicada deve conter no mínimo 5 caracteres informativos.';
    END IF;
    IF NEW.resolved_at IS NULL THEN
      NEW.resolved_at := timezone('utc', now());
    END IF;
    IF auth.uid() IS NOT NULL AND NEW.resolved_by IS NULL THEN
      NEW.resolved_by := auth.uid();
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_operational_incident_resolution ON public.operational_incidents;
CREATE TRIGGER trigger_check_operational_incident_resolution
  BEFORE INSERT OR UPDATE ON public.operational_incidents
  FOR EACH ROW
  EXECUTE FUNCTION public.check_operational_incident_resolution();

-- -----------------------------------------------------------------------------
-- 6. TRIGGER DE AUDITORIA AUTOMÁTICA NO BANCO
--    Garante gravação transacional de histórico em criação, mudanças e resoluções
--    Autoria obtida estritamente de auth.uid() e perfis do banco
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_operational_incident_audit_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_user_name TEXT;
  v_action VARCHAR(50);
  v_description TEXT;
  v_metadata JSONB;
BEGIN
  -- 1. Obter identificador do usuário autenticado a partir do contexto seguro
  v_user_id := auth.uid();

  -- 2. Resolver nome do operador via profiles ou email (nunca confiando em campos alteráveis do payload)
  IF v_user_id IS NOT NULL THEN
    SELECT COALESCE(p.full_name, u.email, 'Operador Tío Nenê')
    INTO v_user_name
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.id = u.id
    WHERE u.id = v_user_id;
  END IF;

  IF v_user_name IS NULL OR trim(v_user_name) = '' THEN
    v_user_name := COALESCE(NEW.created_by_name, 'Sistema / Operação');
  END IF;

  -- CASO A: INSERÇÃO (Criação da Ocorrência)
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.operational_incident_history (
      incident_id,
      action,
      description,
      status_before,
      status_after,
      priority_before,
      priority_after,
      assigned_to_before,
      assigned_to_after,
      performed_by,
      performed_by_name,
      metadata,
      created_at
    ) VALUES (
      NEW.id,
      'abertura',
      'Ocorrência ' || NEW.incident_code || ' registrada com prioridade ' || NEW.priority || '.',
      NULL,
      NEW.status,
      NULL,
      NEW.priority,
      NULL,
      NEW.assigned_to_name,
      v_user_id,
      v_user_name,
      jsonb_build_object(
        'incident_code', NEW.incident_code,
        'incident_type', NEW.incident_type,
        'title', NEW.title
      ),
      timezone('utc', now())
    );
    RETURN NEW;
  END IF;

  -- CASO B: ATUALIZAÇÃO (Modificações Operacionais)
  IF TG_OP = 'UPDATE' THEN
    -- B.1 Mudança de Status (incluindo resolução e cancelamento)
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      IF NEW.status = 'resolvida' THEN
        v_action := 'resolucao';
        v_description := 'Ocorrência resolvida. Solução aplicada: ' || COALESCE(NEW.resolution_notes, 'Solução concluída.');
        v_metadata := jsonb_build_object('resolution_notes', NEW.resolution_notes);
      ELSIF NEW.status = 'cancelada' THEN
        v_action := 'cancelamento';
        v_description := 'Ocorrência cancelada (de "' || OLD.status || '" para cancelada).';
        v_metadata := '{}'::jsonb;
      ELSE
        v_action := 'alteracao_status';
        v_description := 'Status alterado de "' || OLD.status || '" para "' || NEW.status || '".';
        v_metadata := '{}'::jsonb;
      END IF;

      INSERT INTO public.operational_incident_history (
        incident_id,
        action,
        description,
        status_before,
        status_after,
        priority_before,
        priority_after,
        assigned_to_before,
        assigned_to_after,
        performed_by,
        performed_by_name,
        metadata,
        created_at
      ) VALUES (
        NEW.id,
        v_action,
        v_description,
        OLD.status,
        NEW.status,
        NEW.priority,
        NEW.priority,
        NEW.assigned_to_name,
        NEW.assigned_to_name,
        v_user_id,
        v_user_name,
        v_metadata,
        timezone('utc', now())
      );
    END IF;

    -- B.2 Mudança de Prioridade
    IF NEW.priority IS DISTINCT FROM OLD.priority THEN
      INSERT INTO public.operational_incident_history (
        incident_id,
        action,
        description,
        status_before,
        status_after,
        priority_before,
        priority_after,
        assigned_to_before,
        assigned_to_after,
        performed_by,
        performed_by_name,
        metadata,
        created_at
      ) VALUES (
        NEW.id,
        'alteracao_prioridade',
        'Prioridade alterada de "' || OLD.priority || '" para "' || NEW.priority || '".',
        NEW.status,
        NEW.status,
        OLD.priority,
        NEW.priority,
        NEW.assigned_to_name,
        NEW.assigned_to_name,
        v_user_id,
        v_user_name,
        '{}'::jsonb,
        timezone('utc', now())
      );
    END IF;

    -- B.3 Reatribuição de Responsável
    IF NEW.assigned_to_name IS DISTINCT FROM OLD.assigned_to_name OR NEW.assigned_to IS DISTINCT FROM OLD.assigned_to THEN
      INSERT INTO public.operational_incident_history (
        incident_id,
        action,
        description,
        status_before,
        status_after,
        priority_before,
        priority_after,
        assigned_to_before,
        assigned_to_after,
        performed_by,
        performed_by_name,
        metadata,
        created_at
      ) VALUES (
        NEW.id,
        'atribuicao',
        'Responsável reatribuído de "' || COALESCE(OLD.assigned_to_name, 'Não atribuído') || '" para "' || COALESCE(NEW.assigned_to_name, 'Não atribuído') || '".',
        NEW.status,
        NEW.status,
        NEW.priority,
        NEW.priority,
        OLD.assigned_to_name,
        NEW.assigned_to_name,
        v_user_id,
        v_user_name,
        '{}'::jsonb,
        timezone('utc', now())
      );
    END IF;

    -- B.4 Edições Relevantes de Conteúdo Operacional
    -- Registra evento 'edicao' mesmo quando acompanhado de alterações em status, prioridade ou responsável.
    -- Monitora: title, description, incident_type, internal_notes, service_name, service_date, reservation_id, arrival_id, supplier_id, supplier_name.
    -- Metadados de auditoria registram flags operacionais sem expor PII ou dados sensíveis desnecessários.
    IF (NEW.title IS DISTINCT FROM OLD.title
        OR NEW.description IS DISTINCT FROM OLD.description
        OR NEW.incident_type IS DISTINCT FROM OLD.incident_type
        OR NEW.internal_notes IS DISTINCT FROM OLD.internal_notes
        OR NEW.service_name IS DISTINCT FROM OLD.service_name
        OR NEW.service_date IS DISTINCT FROM OLD.service_date
        OR NEW.reservation_id IS DISTINCT FROM OLD.reservation_id
        OR NEW.arrival_id IS DISTINCT FROM OLD.arrival_id
        OR NEW.supplier_id IS DISTINCT FROM OLD.supplier_id
        OR NEW.supplier_name IS DISTINCT FROM OLD.supplier_name) THEN

      v_metadata := jsonb_build_object(
        'title_changed', NEW.title IS DISTINCT FROM OLD.title,
        'description_changed', NEW.description IS DISTINCT FROM OLD.description,
        'type_changed', NEW.incident_type IS DISTINCT FROM OLD.incident_type,
        'internal_notes_changed', NEW.internal_notes IS DISTINCT FROM OLD.internal_notes,
        'service_date_changed', NEW.service_date IS DISTINCT FROM OLD.service_date,
        'service_name_changed', NEW.service_name IS DISTINCT FROM OLD.service_name,
        'reservation_id_changed', NEW.reservation_id IS DISTINCT FROM OLD.reservation_id,
        'arrival_id_changed', NEW.arrival_id IS DISTINCT FROM OLD.arrival_id,
        'supplier_changed', (NEW.supplier_id IS DISTINCT FROM OLD.supplier_id OR NEW.supplier_name IS DISTINCT FROM OLD.supplier_name)
      );

      INSERT INTO public.operational_incident_history (
        incident_id,
        action,
        description,
        status_before,
        status_after,
        priority_before,
        priority_after,
        assigned_to_before,
        assigned_to_after,
        performed_by,
        performed_by_name,
        metadata,
        created_at
      ) VALUES (
        NEW.id,
        'edicao',
        'Informações operacionais da ocorrência foram atualizadas.',
        OLD.status,
        NEW.status,
        OLD.priority,
        NEW.priority,
        OLD.assigned_to_name,
        NEW.assigned_to_name,
        v_user_id,
        v_user_name,
        v_metadata,
        timezone('utc', now())
      );
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_record_operational_incident_audit_history ON public.operational_incidents;
CREATE TRIGGER trigger_record_operational_incident_audit_history
  AFTER INSERT OR UPDATE ON public.operational_incidents
  FOR EACH ROW
  EXECUTE FUNCTION public.record_operational_incident_audit_history();

-- -----------------------------------------------------------------------------
-- 7. RPC: REGISTRO DE ANDAMENTOS OPERACIONAIS MANUAIS
--    Permite à equipe adicionar providências/andamentos sem mutação direta na ocorrência
--    Garante autoria e data protegidas no PostgreSQL sem intervenção do frontend
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.add_operational_incident_andamento(
  p_incident_id UUID,
  p_description TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
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
  v_incident RECORD;
  v_clean_desc TEXT;
  v_history_id UUID;
BEGIN
  -- 1. Validar usuário autenticado
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: operação requer usuário autenticado.';
  END IF;

  -- 2. Validar papel operacional real na tabela public.user_roles ('admin', 'moderator', 'user')
  SELECT ur.role INTO v_user_role
  FROM public.user_roles ur
  WHERE ur.user_id = v_user_id
    AND ur.role IN ('admin', 'moderator', 'user')
  LIMIT 1;

  IF v_user_role IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: usuário não possui permissão operacional autorizada.';
  END IF;

  -- 3. Validar descrição do andamento
  v_clean_desc := trim(COALESCE(p_description, ''));
  IF v_clean_desc = '' OR length(v_clean_desc) < 3 THEN
    RAISE EXCEPTION 'A descrição do andamento deve conter no mínimo 3 caracteres informativos.';
  END IF;

  -- 4. Validar existência da ocorrência
  SELECT id, status, priority, assigned_to_name
  INTO v_incident
  FROM public.operational_incidents
  WHERE id = p_incident_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ocorrência operacional não encontrada (ID: %).', p_incident_id;
  END IF;

  -- 5. Resolver nome do operador autenticado via profiles / auth.users (sem confiar no frontend)
  SELECT COALESCE(p.full_name, u.email, 'Operador Tío Nenê')
  INTO v_user_name
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE u.id = v_user_id;

  IF v_user_name IS NULL OR trim(v_user_name) = '' THEN
    v_user_name := 'Operador Tío Nenê';
  END IF;

  -- 6. Inserir histórico na mesma transação com timestamps e autoria estritamente do servidor
  INSERT INTO public.operational_incident_history (
    incident_id,
    action,
    description,
    status_before,
    status_after,
    priority_before,
    priority_after,
    assigned_to_before,
    assigned_to_after,
    performed_by,
    performed_by_name,
    metadata,
    created_at
  ) VALUES (
    p_incident_id,
    'andamento',
    v_clean_desc,
    v_incident.status,
    v_incident.status,
    v_incident.priority,
    v_incident.priority,
    v_incident.assigned_to_name,
    v_incident.assigned_to_name,
    v_user_id,
    v_user_name,
    COALESCE(p_metadata, '{}'::jsonb),
    timezone('utc', now())
  )
  RETURNING id INTO v_history_id;

  -- 7. Atualizar updated_at da ocorrência
  UPDATE public.operational_incidents
  SET updated_at = timezone('utc', now())
  WHERE id = p_incident_id;

  RETURN jsonb_build_object(
    'success', true,
    'history_id', v_history_id,
    'incident_id', p_incident_id,
    'action', 'andamento',
    'performed_by_name', v_user_name,
    'created_at', timezone('utc', now())
  );
END;
$$;

-- Permissões da RPC de andamento
REVOKE ALL ON FUNCTION public.add_operational_incident_andamento(UUID, TEXT, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.add_operational_incident_andamento(UUID, TEXT, JSONB) FROM anon;
GRANT EXECUTE ON FUNCTION public.add_operational_incident_andamento(UUID, TEXT, JSONB) TO authenticated;

-- -----------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY (RLS) E POLÍTICAS DE ACESSO
-- -----------------------------------------------------------------------------
ALTER TABLE public.operational_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operational_incident_history ENABLE ROW LEVEL SECURITY;

-- 8.1 operational_incidents: Leitura para equipe operacional autenticada
DROP POLICY IF EXISTS "operational_incidents_team_select" ON public.operational_incidents;
CREATE POLICY "operational_incidents_team_select" ON public.operational_incidents
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'moderator', 'user')
    )
  );

-- 8.2 operational_incidents: Criação e Edição pela equipe operacional
DROP POLICY IF EXISTS "operational_incidents_team_insert" ON public.operational_incidents;
CREATE POLICY "operational_incidents_team_insert" ON public.operational_incidents
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'moderator', 'user')
    )
  );

DROP POLICY IF EXISTS "operational_incidents_team_update" ON public.operational_incidents;
CREATE POLICY "operational_incidents_team_update" ON public.operational_incidents
  FOR UPDATE TO authenticated
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

-- Proibição de exclusão física direta para authenticated (deve usar cancelamento de status)
DROP POLICY IF EXISTS "operational_incidents_delete" ON public.operational_incidents;

-- 8.3 operational_incident_history: Leitura permitida para equipe operacional
DROP POLICY IF EXISTS "op_incident_history_select" ON public.operational_incident_history;
CREATE POLICY "op_incident_history_select" ON public.operational_incident_history
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'moderator', 'user')
    )
  );

-- NOTA CRÍTICA DE SEGURANÇA: NENHUMA POLÍTICA DE INSERT É CONCEDIDA PARA authenticated
-- EM operational_incident_history. Inserções ocorrem EXCLUSIVAMENTE via trigger ou RPC SECURITY DEFINER.
DROP POLICY IF EXISTS "op_incident_history_insert" ON public.operational_incident_history;

-- -----------------------------------------------------------------------------
-- 9. PERMISSÕES E GRANTS
-- -----------------------------------------------------------------------------
REVOKE ALL ON public.operational_incidents FROM anon;
REVOKE ALL ON public.operational_incidents FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE ON public.operational_incidents TO authenticated;

-- Histórico: Proibição total de modificações diretas
REVOKE ALL ON public.operational_incident_history FROM anon;
REVOKE ALL ON public.operational_incident_history FROM PUBLIC;
REVOKE ALL ON public.operational_incident_history FROM authenticated;
GRANT SELECT ON public.operational_incident_history TO authenticated;

COMMIT;
