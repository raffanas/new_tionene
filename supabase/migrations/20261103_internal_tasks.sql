-- =============================================================================
-- TÍO NENÊ - GESTÃO DE TAREFAS E ACOMPANHAMENTOS INTERNOS (v0.1.43)
-- Arquivo: supabase/migrations/20261103_internal_tasks.sql
--
-- ATENÇÃO: NÃO EXECUTAR ESTA MIGRATION REMOTAMENTE NESTA TAREFA.
-- Migration local preparada para posterior revisão e implantação controlada.
--
-- REGRAS E DIRETRIZES DA TAREFA 29 (REVISÃO DE INTEGRIDADE, AUTORIA E PERMISSÕES):
-- 1. PROTEÇÃO RIGOROSA DE AUTORIA E ACESSO NO BANCO (TRIGGER BEFORE INSERT/UPDATE):
--    - created_by é definido AUTOMATICAMENTE como auth.uid() na criação para usuários autenticados,
--      ignorando categoricamente qualquer valor enviado pelo frontend.
--    - created_by é ESTRITAMENTE IMUTÁVEL após a criação, inclusive em edições por administradores.
--    - shared_with só pode ser definido ou alterado por administradores. Usuários não administradores
--      não podem modificar shared_with para conceder acesso arbitrário a terceiros.
--    - assigned_to:
--      * Administradores podem atribuir tarefas a qualquer operador autorizado (user_roles.role IN ('admin','moderator','user')).
--      * Operadores não administradores NÃO podem atribuir tarefas a terceiros, NÃO podem alterar o responsável
--        de uma tarefa já atribuída a outro operador (autoatribuição indevida), e só podem autoatribuir tarefas
--        não atribuídas caso sejam o criador ou tenham a tarefa compartilhada com eles.
--      * Preserva o funcionamento normal das tarefas já atribuídas.
-- 2. PRESERVAÇÃO E IMUTABILIDADE DO HISTÓRICO:
--    - FK internal_task_history.task_id com ON DELETE RESTRICT (impede exclusão de tarefas com histórico).
--    - Nenhum DELETE concedido a usuários authenticated em internal_tasks (deve usar status 'cancelada').
--    - Trigger de proteção bloqueia incondicionalmente UPDATE e DELETE em internal_task_history.
-- 3. MATRIZ DE VISIBILIDADE E PERMISSÕES GRANULARES (RLS):
--    - Admin: visualizar e gerenciar todas as tarefas.
--    - Operador/Vendedor: visualizar e editar apenas tarefas criadas por ele, atribuídas a ele
--      ou explicitamente compartilhadas com ele (coluna shared_with UUID[]).
--    - Usuário sem papel operacional: nenhum acesso a tarefas ou histórico.
--    - Regras espelhadas em internal_tasks e internal_task_history.
-- 4. AUDITORIA MÍNIMA E PROTEÇÃO DE PRIVACIDADE:
--    - Na criação ('criacao'), histórico grava apenas metadados operacionais mínimos.
--    - Não armazena conteúdo completo de internal_notes nem dados pessoais desnecessários.
--    - Preserva auditoria transacional de status, prioridade, responsável, prazo, conclusão,
--      reabertura, cancelamento e edições de conteúdo relevante sem duplicidades.
-- 5. RPC DE ANDAMENTOS PROTEGIDA:
--    - add_internal_task_andamento valida auth.uid(), papel operacional real no ENUM app_role,
--      e verifica se o usuário tem acesso à tarefa específica.
--    - Bloqueia andamentos em tarefas inacessíveis.
--    - Autoria (auth.uid()) e data (timezone('utc', now())) geradas estritamente pelo servidor.
--    - EXECUTE revogado de PUBLIC e anon; concedido exclusivamente a authenticated.
-- 6. INTEGRIDADE DOS VÍNCULOS:
--    - FKs opcionais para clients, contracts, operational_reservations, arrivals e operational_incidents
--      com ON DELETE SET NULL, garantindo independência operacional de tarefas avulsas.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. TABELA: public.internal_tasks (Tarefas Internas Administrativas e Operacionais)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.internal_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_code TEXT NOT NULL UNIQUE, -- Ex: TAR-2026-0001
  title TEXT NOT NULL,
  description TEXT,

  -- Prioridade e Status
  priority VARCHAR(20) NOT NULL DEFAULT 'media' CHECK (
    priority IN ('baixa', 'media', 'alta', 'critica')
  ),
  status VARCHAR(30) NOT NULL DEFAULT 'pendente' CHECK (
    status IN ('pendente', 'em_andamento', 'aguardando_terceiro', 'concluida', 'cancelada')
  ),

  -- Prazo e Conclusão
  due_date DATE,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  completed_by_name TEXT,

  -- Observações e Notas Internas
  internal_notes TEXT,

  -- Atribuição e Responsabilidade
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_to_name TEXT,

  -- Criador da Tarefa (Imutável após criação, definido pelo servidor)
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_name TEXT,

  -- Mecanismo de Compartilhamento Explícito (Gerenciado exclusivamente por administradores)
  shared_with UUID[] NOT NULL DEFAULT '{}',

  -- Vínculos Opcionais (Tarefas podem existir sem nenhum vínculo ou com vínculos combinados)
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  client_name TEXT,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  contract_number TEXT,
  reservation_id UUID REFERENCES public.operational_reservations(id) ON DELETE SET NULL,
  service_name TEXT,
  arrival_id UUID REFERENCES public.arrivals(id) ON DELETE SET NULL,
  incident_id UUID REFERENCES public.operational_incidents(id) ON DELETE SET NULL,
  incident_code TEXT,

  -- Timestamps de Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Índices de Alta Performance para a Central de Tarefas
CREATE INDEX IF NOT EXISTS idx_internal_tasks_assigned_to ON public.internal_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_internal_tasks_created_by ON public.internal_tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_internal_tasks_shared_with ON public.internal_tasks USING GIN(shared_with);
CREATE INDEX IF NOT EXISTS idx_internal_tasks_status ON public.internal_tasks(status);
CREATE INDEX IF NOT EXISTS idx_internal_tasks_priority ON public.internal_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_internal_tasks_due_date ON public.internal_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_internal_tasks_contract_id ON public.internal_tasks(contract_id);
CREATE INDEX IF NOT EXISTS idx_internal_tasks_client_id ON public.internal_tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_internal_tasks_incident_id ON public.internal_tasks(incident_id);
CREATE INDEX IF NOT EXISTS idx_internal_tasks_reservation_id ON public.internal_tasks(reservation_id);
CREATE INDEX IF NOT EXISTS idx_internal_tasks_arrival_id ON public.internal_tasks(arrival_id);
CREATE INDEX IF NOT EXISTS idx_internal_tasks_created_at ON public.internal_tasks(created_at);

-- -----------------------------------------------------------------------------
-- 2. TABELA: public.internal_task_history (Histórico Imutável com ON DELETE RESTRICT)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.internal_task_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.internal_tasks(id) ON DELETE RESTRICT,
  action VARCHAR(50) NOT NULL, -- criacao, alteracao_status, alteracao_prioridade, atribuicao, alteracao_prazo, conclusao, reabertura, cancelamento, edicao, andamento
  description TEXT NOT NULL,
  status_before VARCHAR(30),
  status_after VARCHAR(30),
  priority_before VARCHAR(20),
  priority_after VARCHAR(20),
  assigned_to_before TEXT,
  assigned_to_after TEXT,
  due_date_before DATE,
  due_date_after DATE,
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  performed_by_name TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_int_task_history_task_id ON public.internal_task_history(task_id);
CREATE INDEX IF NOT EXISTS idx_int_task_history_created_at ON public.internal_task_history(created_at);

-- -----------------------------------------------------------------------------
-- 3. TRIGGER: ATUALIZAÇÃO AUTOMÁTICA DE updated_at
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_internal_task_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_handle_internal_task_updated_at ON public.internal_tasks;
CREATE TRIGGER trigger_handle_internal_task_updated_at
  BEFORE UPDATE ON public.internal_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_internal_task_updated_at();

-- -----------------------------------------------------------------------------
-- 4. TRIGGER: PROTEÇÃO DOS CAMPOS DE AUTORIA E ACESSO (BEFORE INSERT OR UPDATE)
--    Garante que created_by, shared_with e assigned_to sejam estritamente
--    controlados pelo PostgreSQL sem confiar no frontend.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_internal_task_authorship_and_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_is_admin BOOLEAN := FALSE;
  v_user_role TEXT;
BEGIN
  v_user_id := auth.uid();

  -- Se executado sem contexto autenticado (ex: script de seed/migração direta do superuser),
  -- permite a operação preservando os valores
  IF v_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Obter papel real do usuário na tabela public.user_roles ('admin', 'moderator', 'user')
  SELECT ur.role::text INTO v_user_role
  FROM public.user_roles ur
  WHERE ur.user_id = v_user_id
  LIMIT 1;

  v_is_admin := (v_user_role = 'admin');

  -- =========================================================================
  -- REGRAS PARA INSERÇÃO (TG_OP = 'INSERT')
  -- =========================================================================
  IF TG_OP = 'INSERT' THEN
    -- 1. created_by é definido AUTOMATICAMENTE como auth.uid(), ignorando qualquer valor enviado pelo frontend
    NEW.created_by := v_user_id;

    -- Resolver nome oficial do criador via profiles / auth.users
    SELECT COALESCE(p.full_name, u.email, 'Operador Tío Nenê')
    INTO NEW.created_by_name
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.id = u.id
    WHERE u.id = v_user_id;

    -- 2. shared_with: apenas administradores podem definir compartilhamentos iniciais
    IF NOT v_is_admin THEN
      IF NEW.shared_with IS NOT NULL AND cardinality(NEW.shared_with) > 0 THEN
        RAISE EXCEPTION 'Acesso negado: apenas administradores podem definir compartilhamento inicial de tarefas (shared_with).';
      END IF;
      NEW.shared_with := '{}';
    ELSE
      NEW.shared_with := COALESCE(NEW.shared_with, '{}');
    END IF;

    -- 3. assigned_to:
    -- Administradores podem atribuir a qualquer operador autorizado
    -- Operadores podem autoatribuir para si mesmos ou criar a tarefa sem atribuição (NULL)
    IF NEW.assigned_to IS NOT NULL THEN
      IF NOT v_is_admin THEN
        IF NEW.assigned_to <> v_user_id THEN
          RAISE EXCEPTION 'Acesso negado: apenas administradores podem atribuir tarefas a outros operadores.';
        END IF;
      END IF;

      -- Validar que o usuário atribuído possui papel operacional real ('admin', 'moderator', 'user')
      IF NOT EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = NEW.assigned_to
          AND ur.role IN ('admin', 'moderator', 'user')
      ) THEN
        RAISE EXCEPTION 'Operação não permitida: o responsável atribuído deve possuir papel operacional autorizado.';
      END IF;

      -- Sincronizar assigned_to_name com os dados do banco
      SELECT COALESCE(p.full_name, u.email, 'Operador Tío Nenê')
      INTO NEW.assigned_to_name
      FROM auth.users u
      LEFT JOIN public.profiles p ON p.id = u.id
      WHERE u.id = NEW.assigned_to;
    ELSE
      NEW.assigned_to_name := NULL;
    END IF;

    RETURN NEW;
  END IF;

  -- =========================================================================
  -- REGRAS PARA ATUALIZAÇÃO (TG_OP = 'UPDATE')
  -- =========================================================================
  IF TG_OP = 'UPDATE' THEN
    -- 1. created_by é ESTRITAMENTE IMUTÁVEL após a criação, inclusive para administradores
    IF NEW.created_by IS DISTINCT FROM OLD.created_by THEN
      RAISE EXCEPTION 'Operação não permitida: o campo created_by é estritamente imutável após a criação da tarefa.';
    END IF;

    -- Preservar created_by_name original
    NEW.created_by_name := OLD.created_by_name;

    -- 2. shared_with: apenas administradores podem modificar
    IF NEW.shared_with IS DISTINCT FROM OLD.shared_with THEN
      IF NOT v_is_admin THEN
        RAISE EXCEPTION 'Acesso negado: apenas administradores podem modificar o compartilhamento de tarefas (shared_with).';
      END IF;
      NEW.shared_with := COALESCE(NEW.shared_with, '{}');
    END IF;

    -- 3. assigned_to:
    IF NEW.assigned_to IS DISTINCT FROM OLD.assigned_to THEN
      IF v_is_admin THEN
        -- Admin pode atribuir a operadores autorizados ou desatribuir (NULL)
        IF NEW.assigned_to IS NOT NULL THEN
          IF NOT EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = NEW.assigned_to
              AND ur.role IN ('admin', 'moderator', 'user')
          ) THEN
            RAISE EXCEPTION 'Operação não permitida: o responsável atribuído deve possuir papel operacional autorizado.';
          END IF;
        END IF;
      ELSE
        -- Operadores não administradores:
        -- a) Não podem reatribuir a um terceiro (NEW.assigned_to <> v_user_id)
        IF NEW.assigned_to IS NOT NULL AND NEW.assigned_to <> v_user_id THEN
          RAISE EXCEPTION 'Acesso negado: apenas administradores podem reatribuir tarefas a outros operadores.';
        END IF;

        -- b) Não podem tomar uma tarefa já atribuída a outro operador (autoatribuição indevida)
        IF OLD.assigned_to IS NOT NULL AND OLD.assigned_to <> v_user_id THEN
          RAISE EXCEPTION 'Acesso negado: não é permitido alterar o responsável de uma tarefa já atribuída a outro operador.';
        END IF;

        -- c) Não podem autoatribuir uma tarefa sobre a qual não possuem autorização (nem criador nem compartilhado)
        IF NEW.assigned_to = v_user_id AND OLD.assigned_to IS NULL THEN
          IF OLD.created_by <> v_user_id AND NOT (v_user_id = ANY(OLD.shared_with)) THEN
            RAISE EXCEPTION 'Acesso negado: autoatribuição não autorizada em tarefa inacessível.';
          END IF;
        END IF;
      END IF;

      -- Sincronizar assigned_to_name
      IF NEW.assigned_to IS NOT NULL THEN
        SELECT COALESCE(p.full_name, u.email, 'Operador Tío Nenê')
        INTO NEW.assigned_to_name
        FROM auth.users u
        LEFT JOIN public.profiles p ON p.id = u.id
        WHERE u.id = NEW.assigned_to;
      ELSE
        NEW.assigned_to_name := NULL;
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_protect_internal_task_authorship_and_access ON public.internal_tasks;
CREATE TRIGGER trigger_protect_internal_task_authorship_and_access
  BEFORE INSERT OR UPDATE ON public.internal_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_internal_task_authorship_and_access();

-- -----------------------------------------------------------------------------
-- 5. TRIGGER: IMUTABILIDADE DO HISTÓRICO DE TAREFAS
--    Bloqueia categoricamente UPDATE e DELETE em internal_task_history
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_internal_task_history_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Operação não permitida: registros de histórico de tarefas internas são estritamente imutáveis e não podem ser alterados ou excluídos.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prevent_internal_task_history_modification ON public.internal_task_history;
CREATE TRIGGER trigger_prevent_internal_task_history_modification
  BEFORE UPDATE OR DELETE ON public.internal_task_history
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_internal_task_history_modification();

-- -----------------------------------------------------------------------------
-- 6. TRIGGER DE AUDITORIA AUTOMÁTICA NO BANCO (AFTER INSERT OR UPDATE)
--    Garante registro seguro com autoria via auth.uid() e metadados operacionais mínimos
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_internal_task_audit_history()
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
  -- 1. Obter identificador do usuário autenticado no contexto seguro
  v_user_id := auth.uid();

  -- 2. Resolver nome do operador via perfis ou auth.users (sem confiar no frontend)
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

  -- CASO A: INSERÇÃO (Criação da Tarefa)
  -- Registra metadados operacionais mínimos sem conteúdo completo de notas ou dados pessoais desnecessários
  IF TG_OP = 'INSERT' THEN
    v_metadata := jsonb_build_object(
      'task_code', NEW.task_code,
      'title', NEW.title,
      'priority', NEW.priority,
      'status', NEW.status,
      'assigned_to', NEW.assigned_to,
      'due_date', NEW.due_date,
      'has_contract', NEW.contract_id IS NOT NULL,
      'has_client', NEW.client_id IS NOT NULL,
      'has_incident', NEW.incident_id IS NOT NULL,
      'has_reservation', NEW.reservation_id IS NOT NULL,
      'has_arrival', NEW.arrival_id IS NOT NULL,
      'has_internal_notes', (NEW.internal_notes IS NOT NULL AND length(trim(NEW.internal_notes)) > 0),
      'shared_with_count', cardinality(NEW.shared_with)
    );

    INSERT INTO public.internal_task_history (
      task_id,
      action,
      description,
      status_before,
      status_after,
      priority_before,
      priority_after,
      assigned_to_before,
      assigned_to_after,
      due_date_before,
      due_date_after,
      performed_by,
      performed_by_name,
      metadata,
      created_at
    ) VALUES (
      NEW.id,
      'criacao',
      'Tarefa ' || NEW.task_code || ' criada com prioridade ' || NEW.priority || '.',
      NULL,
      NEW.status,
      NULL,
      NEW.priority,
      NULL,
      NEW.assigned_to_name,
      NULL,
      NEW.due_date,
      v_user_id,
      v_user_name,
      v_metadata,
      timezone('utc', now())
    );
    RETURN NEW;
  END IF;

  -- CASO B: ATUALIZAÇÃO (Modificações de Tarefa)
  IF TG_OP = 'UPDATE' THEN
    -- B.1 Alteração de Status (incluindo conclusão, reabertura e cancelamento)
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      IF NEW.status = 'concluida' THEN
        v_action := 'conclusao';
        v_description := 'Tarefa concluída por ' || v_user_name || '.';
        v_metadata := jsonb_build_object('completed_at', NEW.completed_at);
      ELSIF OLD.status = 'concluida' AND NEW.status != 'concluida' THEN
        v_action := 'reabertura';
        v_description := 'Tarefa reaberta (status retornado para "' || NEW.status || '").';
        v_metadata := jsonb_build_object('previous_completed_at', OLD.completed_at);
      ELSIF NEW.status = 'cancelada' THEN
        v_action := 'cancelamento';
        v_description := 'Tarefa cancelada.';
        v_metadata := '{}'::jsonb;
      ELSE
        v_action := 'alteracao_status';
        v_description := 'Status alterado de "' || OLD.status || '" para "' || NEW.status || '".';
        v_metadata := '{}'::jsonb;
      END IF;

      INSERT INTO public.internal_task_history (
        task_id,
        action,
        description,
        status_before,
        status_after,
        priority_before,
        priority_after,
        assigned_to_before,
        assigned_to_after,
        due_date_before,
        due_date_after,
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
        OLD.priority,
        NEW.priority,
        OLD.assigned_to_name,
        NEW.assigned_to_name,
        OLD.due_date,
        NEW.due_date,
        v_user_id,
        v_user_name,
        v_metadata,
        timezone('utc', now())
      );
    END IF;

    -- B.2 Alteração de Prioridade
    IF NEW.priority IS DISTINCT FROM OLD.priority THEN
      INSERT INTO public.internal_task_history (
        task_id,
        action,
        description,
        status_before,
        status_after,
        priority_before,
        priority_after,
        assigned_to_before,
        assigned_to_after,
        due_date_before,
        due_date_after,
        performed_by,
        performed_by_name,
        metadata,
        created_at
      ) VALUES (
        NEW.id,
        'alteracao_prioridade',
        'Prioridade alterada de "' || OLD.priority || '" para "' || NEW.priority || '".',
        OLD.status,
        NEW.status,
        OLD.priority,
        NEW.priority,
        OLD.assigned_to_name,
        NEW.assigned_to_name,
        OLD.due_date,
        NEW.due_date,
        v_user_id,
        v_user_name,
        jsonb_build_object('priority_before', OLD.priority, 'priority_after', NEW.priority),
        timezone('utc', now())
      );
    END IF;

    -- B.3 Reatribuição de Responsável
    IF NEW.assigned_to_name IS DISTINCT FROM OLD.assigned_to_name OR NEW.assigned_to IS DISTINCT FROM OLD.assigned_to THEN
      INSERT INTO public.internal_task_history (
        task_id,
        action,
        description,
        status_before,
        status_after,
        priority_before,
        priority_after,
        assigned_to_before,
        assigned_to_after,
        due_date_before,
        due_date_after,
        performed_by,
        performed_by_name,
        metadata,
        created_at
      ) VALUES (
        NEW.id,
        'atribuicao',
        'Responsável reatribuído de "' || COALESCE(OLD.assigned_to_name, 'Não atribuído') || '" para "' || COALESCE(NEW.assigned_to_name, 'Não atribuído') || '".',
        OLD.status,
        NEW.status,
        OLD.priority,
        NEW.priority,
        OLD.assigned_to_name,
        NEW.assigned_to_name,
        OLD.due_date,
        NEW.due_date,
        v_user_id,
        v_user_name,
        jsonb_build_object('assigned_to_before', OLD.assigned_to, 'assigned_to_after', NEW.assigned_to),
        timezone('utc', now())
      );
    END IF;

    -- B.4 Alteração de Prazo (due_date)
    IF NEW.due_date IS DISTINCT FROM OLD.due_date THEN
      INSERT INTO public.internal_task_history (
        task_id,
        action,
        description,
        status_before,
        status_after,
        priority_before,
        priority_after,
        assigned_to_before,
        assigned_to_after,
        due_date_before,
        due_date_after,
        performed_by,
        performed_by_name,
        metadata,
        created_at
      ) VALUES (
        NEW.id,
        'alteracao_prazo',
        'Prazo de entrega alterado de "' || COALESCE(to_char(OLD.due_date, 'YYYY-MM-DD'), 'Sem prazo') || '" para "' || COALESCE(to_char(NEW.due_date, 'YYYY-MM-DD'), 'Sem prazo') || '".',
        OLD.status,
        NEW.status,
        OLD.priority,
        NEW.priority,
        OLD.assigned_to_name,
        NEW.assigned_to_name,
        OLD.due_date,
        NEW.due_date,
        v_user_id,
        v_user_name,
        jsonb_build_object('due_date_before', OLD.due_date, 'due_date_after', NEW.due_date),
        timezone('utc', now())
      );
    END IF;

    -- B.5 Edições Relevantes de Conteúdo Operacional
    -- Monitora alterações sem expor o texto completo de notas internas no histórico
    IF (NEW.title IS DISTINCT FROM OLD.title
        OR NEW.description IS DISTINCT FROM OLD.description
        OR NEW.internal_notes IS DISTINCT FROM OLD.internal_notes
        OR NEW.client_id IS DISTINCT FROM OLD.client_id
        OR NEW.contract_id IS DISTINCT FROM OLD.contract_id
        OR NEW.reservation_id IS DISTINCT FROM OLD.reservation_id
        OR NEW.arrival_id IS DISTINCT FROM OLD.arrival_id
        OR NEW.incident_id IS DISTINCT FROM OLD.incident_id
        OR NEW.shared_with IS DISTINCT FROM OLD.shared_with) THEN

      v_metadata := jsonb_build_object(
        'title_changed', NEW.title IS DISTINCT FROM OLD.title,
        'description_changed', NEW.description IS DISTINCT FROM OLD.description,
        'internal_notes_changed', NEW.internal_notes IS DISTINCT FROM OLD.internal_notes,
        'client_changed', NEW.client_id IS DISTINCT FROM OLD.client_id,
        'contract_changed', NEW.contract_id IS DISTINCT FROM OLD.contract_id,
        'reservation_changed', NEW.reservation_id IS DISTINCT FROM OLD.reservation_id,
        'arrival_changed', NEW.arrival_id IS DISTINCT FROM OLD.arrival_id,
        'incident_changed', NEW.incident_id IS DISTINCT FROM OLD.incident_id,
        'shared_with_changed', NEW.shared_with IS DISTINCT FROM OLD.shared_with,
        'shared_with_count', cardinality(NEW.shared_with)
      );

      INSERT INTO public.internal_task_history (
        task_id,
        action,
        description,
        status_before,
        status_after,
        priority_before,
        priority_after,
        assigned_to_before,
        assigned_to_after,
        due_date_before,
        due_date_after,
        performed_by,
        performed_by_name,
        metadata,
        created_at
      ) VALUES (
        NEW.id,
        'edicao',
        'Informações operacionais da tarefa foram atualizadas.',
        OLD.status,
        NEW.status,
        OLD.priority,
        NEW.priority,
        OLD.assigned_to_name,
        NEW.assigned_to_name,
        OLD.due_date,
        NEW.due_date,
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

DROP TRIGGER IF EXISTS trigger_record_internal_task_audit_history ON public.internal_tasks;
CREATE TRIGGER trigger_record_internal_task_audit_history
  AFTER INSERT OR UPDATE ON public.internal_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.record_internal_task_audit_history();

-- -----------------------------------------------------------------------------
-- 7. RPC: REGISTRO DE ANDAMENTOS OPERACIONAIS MANUAIS EM TAREFAS
--    Valida auth.uid(), papel operacional real e acesso específico à tarefa
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.add_internal_task_andamento(
  p_task_id UUID,
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
  v_is_admin BOOLEAN := FALSE;
  v_user_name TEXT;
  v_task RECORD;
  v_clean_desc TEXT;
  v_history_id UUID;
BEGIN
  -- 1. Validar usuário autenticado
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: operação requer usuário autenticado.';
  END IF;

  -- 2. Validar papel operacional real na tabela public.user_roles ('admin', 'moderator', 'user')
  SELECT ur.role::text INTO v_user_role
  FROM public.user_roles ur
  WHERE ur.user_id = v_user_id
    AND ur.role IN ('admin', 'moderator', 'user')
  LIMIT 1;

  IF v_user_role IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: usuário não possui permissão operacional autorizada.';
  END IF;

  v_is_admin := (v_user_role = 'admin');

  -- 3. Validar descrição do andamento
  v_clean_desc := trim(COALESCE(p_description, ''));
  IF v_clean_desc = '' OR length(v_clean_desc) < 3 THEN
    RAISE EXCEPTION 'A descrição do andamento deve conter no mínimo 3 caracteres informativos.';
  END IF;

  -- 4. Validar existência da tarefa e autorização de acesso específico
  -- Admin acessa todas; operadores/vendedores acessam tarefas próprias, atribuídas ou compartilhadas
  IF v_is_admin THEN
    SELECT id, status, priority, assigned_to_name, due_date
    INTO v_task
    FROM public.internal_tasks
    WHERE id = p_task_id
    FOR UPDATE;
  ELSE
    SELECT id, status, priority, assigned_to_name, due_date
    INTO v_task
    FROM public.internal_tasks
    WHERE id = p_task_id
      AND (
        created_by = v_user_id
        OR assigned_to = v_user_id
        OR v_user_id = ANY(shared_with)
      )
    FOR UPDATE;
  END IF;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Acesso negado: tarefa não encontrada ou usuário não autorizado para registrar andamento.';
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

  -- 6. Inserir histórico na mesma transação com autoria e timestamps do servidor
  INSERT INTO public.internal_task_history (
    task_id,
    action,
    description,
    status_before,
    status_after,
    priority_before,
    priority_after,
    assigned_to_before,
    assigned_to_after,
    due_date_before,
    due_date_after,
    performed_by,
    performed_by_name,
    metadata,
    created_at
  ) VALUES (
    p_task_id,
    'andamento',
    v_clean_desc,
    v_task.status,
    v_task.status,
    v_task.priority,
    v_task.priority,
    v_task.assigned_to_name,
    v_task.assigned_to_name,
    v_task.due_date,
    v_task.due_date,
    v_user_id,
    v_user_name,
    COALESCE(p_metadata, '{}'::jsonb),
    timezone('utc', now())
  )
  RETURNING id INTO v_history_id;

  -- 7. Atualizar updated_at da tarefa
  UPDATE public.internal_tasks
  SET updated_at = timezone('utc', now())
  WHERE id = p_task_id;

  RETURN jsonb_build_object(
    'success', true,
    'history_id', v_history_id,
    'task_id', p_task_id,
    'action', 'andamento',
    'performed_by_name', v_user_name,
    'created_at', timezone('utc', now())
  );
END;
$$;

-- Permissões da RPC de andamento: revogado de PUBLIC e anon; concedido somente a authenticated
REVOKE ALL ON FUNCTION public.add_internal_task_andamento(UUID, TEXT, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.add_internal_task_andamento(UUID, TEXT, JSONB) FROM anon;
GRANT EXECUTE ON FUNCTION public.add_internal_task_andamento(UUID, TEXT, JSONB) TO authenticated;

-- -----------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY (RLS) E POLÍTICAS DE ACESSO GRANULARES
-- -----------------------------------------------------------------------------
ALTER TABLE public.internal_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_task_history ENABLE ROW LEVEL SECURITY;

-- 8.1 internal_tasks: Leitura (SELECT)
-- Admin lê todas; Vendedor/Operador lê criadas por ele, atribuídas a ele ou compartilhadas
DROP POLICY IF EXISTS "internal_tasks_team_select" ON public.internal_tasks;
DROP POLICY IF EXISTS "internal_tasks_select" ON public.internal_tasks;
CREATE POLICY "internal_tasks_select" ON public.internal_tasks
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'moderator', 'user')
    )
    AND (
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.role = 'admin'
      )
      OR created_by = auth.uid()
      OR assigned_to = auth.uid()
      OR auth.uid() = ANY(shared_with)
    )
  );

-- 8.2 internal_tasks: Criação (INSERT)
-- Usuários operacionais autenticados podem criar tarefas
DROP POLICY IF EXISTS "internal_tasks_team_insert" ON public.internal_tasks;
DROP POLICY IF EXISTS "internal_tasks_insert" ON public.internal_tasks;
CREATE POLICY "internal_tasks_insert" ON public.internal_tasks
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'moderator', 'user')
    )
    AND (
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.role = 'admin'
      )
      OR created_by = auth.uid()
    )
  );

-- 8.3 internal_tasks: Atualização (UPDATE)
-- Admin atualiza qualquer tarefa; Operador atualiza tarefas que criou, que lhe foram atribuídas ou compartilhadas
DROP POLICY IF EXISTS "internal_tasks_team_update" ON public.internal_tasks;
DROP POLICY IF EXISTS "internal_tasks_update" ON public.internal_tasks;
CREATE POLICY "internal_tasks_update" ON public.internal_tasks
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'moderator', 'user')
    )
    AND (
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.role = 'admin'
      )
      OR created_by = auth.uid()
      OR assigned_to = auth.uid()
      OR auth.uid() = ANY(shared_with)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'moderator', 'user')
    )
    AND (
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.role = 'admin'
      )
      OR created_by = auth.uid()
      OR assigned_to = auth.uid()
      OR auth.uid() = ANY(shared_with)
    )
  );

-- Bloqueio estrito de exclusão física direta para authenticated (deve usar cancelamento de status)
DROP POLICY IF EXISTS "internal_tasks_delete" ON public.internal_tasks;

-- 8.4 internal_task_history: Leitura permitida estritamente para tarefas autorizadas
DROP POLICY IF EXISTS "internal_task_history_team_select" ON public.internal_task_history;
DROP POLICY IF EXISTS "internal_task_history_select" ON public.internal_task_history;
CREATE POLICY "internal_task_history_select" ON public.internal_task_history
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'moderator', 'user')
    )
    AND (
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.role = 'admin'
      )
      OR EXISTS (
        SELECT 1 FROM public.internal_tasks t
        WHERE t.id = internal_task_history.task_id
          AND (
            t.created_by = auth.uid()
            OR t.assigned_to = auth.uid()
            OR auth.uid() = ANY(t.shared_with)
          )
      )
    )
  );

-- NOTA CRÍTICA DE SEGURANÇA: NENHUMA POLÍTICA DE INSERT/UPDATE/DELETE É CONCEDIDA
-- PARA authenticated EM internal_task_history. Inserções ocorrem EXCLUSIVAMENTE via trigger ou RPC.
DROP POLICY IF EXISTS "internal_task_history_insert" ON public.internal_task_history;
DROP POLICY IF EXISTS "internal_task_history_update" ON public.internal_task_history;
DROP POLICY IF EXISTS "internal_task_history_delete" ON public.internal_task_history;

-- -----------------------------------------------------------------------------
-- 9. PERMISSÕES E GRANTS
-- -----------------------------------------------------------------------------
REVOKE ALL ON public.internal_tasks FROM anon;
REVOKE ALL ON public.internal_tasks FROM PUBLIC;
REVOKE DELETE ON public.internal_tasks FROM authenticated;
GRANT SELECT, INSERT, UPDATE ON public.internal_tasks TO authenticated;

-- Histórico: Proibição total de modificações diretas
REVOKE ALL ON public.internal_task_history FROM anon;
REVOKE ALL ON public.internal_task_history FROM PUBLIC;
REVOKE ALL ON public.internal_task_history FROM authenticated;
GRANT SELECT ON public.internal_task_history TO authenticated;

COMMIT;
