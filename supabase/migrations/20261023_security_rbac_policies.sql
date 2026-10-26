-- =============================================================================
-- TÍO NENÊ - SEGURANÇA, AUTENTICAÇÃO E PERMISSÕES (RBAC) - V0.1.43
-- SCRIPT DEFINITIVO DE ENDURECIMENTO DE SEGURANÇA E RLS
--
-- ATENÇÃO: ARQUIVO PREPARADO PARA APLICAÇÃO MANUAL CONTROLADA NO SQL EDITOR.
-- NÃO EXECUTAR AUTOMATICAMENTE. APLICAÇÃO CONDICIONADA A AUTORIZAÇÃO EXPRESSA.
--
-- PRINCÍPIOS DESTE SCRIPT:
-- 1. Eliminação total de políticas RLS permissivas legadas (USING true para anônimos).
-- 2. Compatibilidade estrita do PostgreSQL: PostgREST requer GRANT na tabela para
--    o role 'authenticated', enquanto o RLS (public.is_admin()) restringe as linhas e ações.
-- 3. Proteção integral de dados financeiros e de custos de fornecedores (Admin-only).
-- 4. Acesso comercial compartilhado para vendedores (QC42-025 / SC-007 / SC-035).
-- 5. Reconciliação segura de contract_items preservando UUIDs e integridade de pagamentos.
-- 6. Preservação da captura pública de leads nos formulários do site (INSERT anônimo).
-- 7. Funções de autorização SECURITY DEFINER com search_path = '' imutável contra injeção.
-- 8. Bloqueio de inspeção de papéis de terceiros por usuários não-administradores.
-- 9. Preservação do enum app_role existente (sem alteração de labels no banco).
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. FUNÇÕES DE AUTORIZAÇÃO E SEGURANÇA (SECURITY DEFINER ENDURECIDAS)
-- -----------------------------------------------------------------------------

-- 1.1 Função simplificada e sem recursão para verificar se o usuário atual é administrador
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  );
$$;

-- 1.2 Função oficial de resolução de papel com proteção contra inspeção de terceiros
CREATE OR REPLACE FUNCTION public.get_user_role(target_user_id uuid DEFAULT auth.uid())
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
DECLARE
  calling_user_id uuid;
  resolved_role text;
BEGIN
  calling_user_id := auth.uid();

  -- Anônimos não possuem autoridade no sistema
  IF calling_user_id IS NULL THEN
    RETURN 'anon';
  END IF;

  -- Se target_user_id for nulo, assume o próprio chamador autenticado
  IF target_user_id IS NULL THEN
    target_user_id := calling_user_id;
  END IF;

  -- Proteção estrita: Não permitir que usuários consultem papéis de terceiros sem autorização
  IF target_user_id <> calling_user_id THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = calling_user_id AND role = 'admin'
    ) THEN
      RAISE EXCEPTION 'Acesso negado: apenas administradores podem consultar papéis de outros usuários.';
    END IF;
  END IF;

  -- Consulta a autoridade na tabela public.user_roles
  SELECT role::text INTO resolved_role
  FROM public.user_roles
  WHERE user_id = target_user_id
  LIMIT 1;

  IF resolved_role IS NOT NULL THEN
    -- Mapeamento oficial v0.1.43: 'admin' é administrador; demais ('user', 'moderator') mapeiam para 'seller'
    IF resolved_role = 'admin' THEN
      RETURN 'admin';
    ELSE
      RETURN 'seller';
    END IF;
  END IF;

  -- Fallback seguro para contas autenticadas sem registro explícito em user_roles
  RETURN 'seller';
END;
$$;

-- 1.3 Endurecimento da função has_role existente para compatibilidade e segurança
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
DECLARE
  calling_user_id uuid;
BEGIN
  calling_user_id := auth.uid();

  -- Anônimos não podem verificar papéis
  IF calling_user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Usuário comum só pode checar o próprio papel; apenas administradores checam terceiros
  IF _user_id <> calling_user_id THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = calling_user_id AND role = 'admin'
    ) THEN
      RETURN false;
    END IF;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$;

-- Restringe a execução das funções de autorização (REVOKE FROM PUBLIC, anon)
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;
ALTER FUNCTION public.is_admin() OWNER TO postgres;

REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated, service_role;
ALTER FUNCTION public.get_user_role(uuid) OWNER TO postgres;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
ALTER FUNCTION public.has_role(uuid, public.app_role) OWNER TO postgres;

-- -----------------------------------------------------------------------------
-- 2. TABELA: user_roles (Papéis e Autoridade de Acesso)
-- -----------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own role or admin reads all" ON public.user_roles;
DROP POLICY IF EXISTS "Only admin can modify user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow user to read own role" ON public.user_roles;

CREATE POLICY "Users can read own role or admin reads all"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Only admin can modify user_roles"
  ON public.user_roles FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

REVOKE ALL ON TABLE public.user_roles FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_roles TO authenticated;
GRANT ALL ON TABLE public.user_roles TO service_role;

-- -----------------------------------------------------------------------------
-- 3. TABELA: profiles (Perfis de Equipe)
-- -----------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view team profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile or admin updates any" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile or admin inserts any" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;

CREATE POLICY "Authenticated users can view team profiles"
  ON public.profiles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile or admin updates any"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can insert own profile or admin inserts any"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id OR public.is_admin());

REVOKE ALL ON TABLE public.profiles FROM anon;
GRANT SELECT, INSERT, UPDATE ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;

-- -----------------------------------------------------------------------------
-- 4. TABELA: suppliers (Fornecedores Locais)
-- Leitura compartilhada para equipe (necessária para associar a contratos);
-- Gestão cadastral (INSERT, UPDATE, DELETE) exclusiva do Admin.
-- -----------------------------------------------------------------------------
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Admin modify suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Authenticated read suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Admin manage suppliers" ON public.suppliers;

CREATE POLICY "Authenticated read suppliers"
  ON public.suppliers FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin manage suppliers"
  ON public.suppliers FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

REVOKE ALL ON TABLE public.suppliers FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.suppliers TO authenticated;
GRANT ALL ON TABLE public.suppliers TO service_role;

-- -----------------------------------------------------------------------------
-- 5. TABELAS DE CUSTOS E FINANCEIRO DE FORNECEDORES (ADMIN-ONLY)
-- Totalmente inacessíveis para o papel Seller e para visitantes anônimos.
-- -----------------------------------------------------------------------------

-- 5.1 supplier_tours (Regras de Custos de Passeios por Fornecedor)
ALTER TABLE IF EXISTS public.supplier_tours ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read supplier_tours" ON public.supplier_tours;
DROP POLICY IF EXISTS "Admin modify supplier_tours" ON public.supplier_tours;
DROP POLICY IF EXISTS "Admin select supplier_tours" ON public.supplier_tours;
DROP POLICY IF EXISTS "Admin manage supplier_tours" ON public.supplier_tours;

CREATE POLICY "Admin select supplier_tours"
  ON public.supplier_tours FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admin manage supplier_tours"
  ON public.supplier_tours FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

REVOKE ALL ON TABLE public.supplier_tours FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.supplier_tours TO authenticated;
GRANT ALL ON TABLE public.supplier_tours TO service_role;

-- 5.2 supplier_cost_options (Catálogo Canônico de Custos TN-001 a TN-042)
ALTER TABLE IF EXISTS public.supplier_cost_options ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read supplier_cost_options" ON public.supplier_cost_options;
DROP POLICY IF EXISTS "Admin modify supplier_cost_options" ON public.supplier_cost_options;
DROP POLICY IF EXISTS "Admin select supplier_cost_options" ON public.supplier_cost_options;
DROP POLICY IF EXISTS "Admin manage supplier_cost_options" ON public.supplier_cost_options;

CREATE POLICY "Admin select supplier_cost_options"
  ON public.supplier_cost_options FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admin manage supplier_cost_options"
  ON public.supplier_cost_options FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

REVOKE ALL ON TABLE public.supplier_cost_options FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.supplier_cost_options TO authenticated;
GRANT ALL ON TABLE public.supplier_cost_options TO service_role;

-- 5.3 supplier_cost_audit_log (Trilha de Auditoria de Alterações em Custos)
ALTER TABLE IF EXISTS public.supplier_cost_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read supplier_cost_audit_log" ON public.supplier_cost_audit_log;
DROP POLICY IF EXISTS "Admin modify supplier_cost_audit_log" ON public.supplier_cost_audit_log;
DROP POLICY IF EXISTS "Admin select supplier_cost_audit_log" ON public.supplier_cost_audit_log;
DROP POLICY IF EXISTS "Admin manage supplier_cost_audit_log" ON public.supplier_cost_audit_log;

CREATE POLICY "Admin select supplier_cost_audit_log"
  ON public.supplier_cost_audit_log FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admin manage supplier_cost_audit_log"
  ON public.supplier_cost_audit_log FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

REVOKE ALL ON TABLE public.supplier_cost_audit_log FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.supplier_cost_audit_log TO authenticated;
GRANT ALL ON TABLE public.supplier_cost_audit_log TO service_role;

-- 5.4 supplier_payments e supplier_payment_allocations (Contas a Pagar Fornecedores)
ALTER TABLE IF EXISTS public.supplier_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.supplier_payment_allocations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read supplier_payments" ON public.supplier_payments;
DROP POLICY IF EXISTS "Admin modify supplier_payments" ON public.supplier_payments;
DROP POLICY IF EXISTS "Admin select supplier_payments" ON public.supplier_payments;
DROP POLICY IF EXISTS "Admin manage supplier_payments" ON public.supplier_payments;

CREATE POLICY "Admin select supplier_payments"
  ON public.supplier_payments FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admin manage supplier_payments"
  ON public.supplier_payments FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Public read supplier_payment_allocations" ON public.supplier_payment_allocations;
DROP POLICY IF EXISTS "Admin modify supplier_payment_allocations" ON public.supplier_payment_allocations;
DROP POLICY IF EXISTS "Admin select supplier_payment_allocations" ON public.supplier_payment_allocations;
DROP POLICY IF EXISTS "Admin manage supplier_payment_allocations" ON public.supplier_payment_allocations;

CREATE POLICY "Admin select supplier_payment_allocations"
  ON public.supplier_payment_allocations FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admin manage supplier_payment_allocations"
  ON public.supplier_payment_allocations FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

REVOKE ALL ON TABLE public.supplier_payments FROM anon;
REVOKE ALL ON TABLE public.supplier_payment_allocations FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.supplier_payments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.supplier_payment_allocations TO authenticated;
GRANT ALL ON TABLE public.supplier_payments TO service_role;
GRANT ALL ON TABLE public.supplier_payment_allocations TO service_role;

-- -----------------------------------------------------------------------------
-- 6. TABELAS COMERCIAIS COMPARTILHADAS (QC42-025 / SC-007 / SC-035)
-- Vendedores e Administradores compartilham visualização e edição de contratos
-- -----------------------------------------------------------------------------

-- 6.1 contracts (Contratos da Agência)
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read contracts" ON public.contracts;
DROP POLICY IF EXISTS "Admin modify contracts" ON public.contracts;
DROP POLICY IF EXISTS "Staff select contracts" ON public.contracts;
DROP POLICY IF EXISTS "Staff insert contracts" ON public.contracts;
DROP POLICY IF EXISTS "Staff update contracts" ON public.contracts;
DROP POLICY IF EXISTS "Admin delete contracts" ON public.contracts;
DROP POLICY IF EXISTS "Team manage contracts baseline" ON public.contracts;
DROP POLICY IF EXISTS "Team manage contracts recovery" ON public.contracts;
DROP POLICY IF EXISTS "Staff select contracts recovery" ON public.contracts;
DROP POLICY IF EXISTS "Staff insert contracts recovery" ON public.contracts;
DROP POLICY IF EXISTS "Staff update contracts recovery" ON public.contracts;
DROP POLICY IF EXISTS "Admin delete contracts recovery" ON public.contracts;

CREATE POLICY "Staff select contracts"
  ON public.contracts FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Staff insert contracts"
  ON public.contracts FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND (public.is_admin() OR status NOT IN ('cancelado', 'finalizado', 'concluido')));

CREATE POLICY "Staff update contracts"
  ON public.contracts FOR UPDATE
  USING (auth.role() = 'authenticated' AND (public.is_admin() OR status NOT IN ('cancelado', 'finalizado', 'concluido')))
  WITH CHECK (auth.role() = 'authenticated' AND (public.is_admin() OR status NOT IN ('cancelado', 'finalizado', 'concluido')));

CREATE POLICY "Admin delete contracts"
  ON public.contracts FOR DELETE
  USING (public.is_admin());

REVOKE ALL ON TABLE public.contracts FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.contracts TO authenticated;
GRANT ALL ON TABLE public.contracts TO service_role;

-- TRIGGER DE INTEGRIDADE: trg_protect_contracts
-- Impede que vendedores finalizem/cancelem contratos diretamente via PostgREST,
-- alterem contratos já cancelados/finalizados ou modifiquem campos administrativos e de integridade.
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
      -- Contratos já finalizados ou cancelados não podem ser alterados por vendedores
      IF OLD.status IN ('cancelado', 'finalizado', 'concluido') THEN
        RAISE EXCEPTION 'Acesso negado: contratos cancelados ou finalizados não podem ser alterados por vendedores.';
      END IF;

      -- Vendedores não podem cancelar ou finalizar contratos por UPDATE direto
      IF NEW.status IN ('cancelado', 'finalizado', 'concluido') AND NEW.status <> OLD.status THEN
        RAISE EXCEPTION 'Acesso negado: cancelamento ou finalização de contratos é uma operação restrita a administradores.';
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

DROP TRIGGER IF EXISTS trg_protect_contracts ON public.contracts;
CREATE TRIGGER trg_protect_contracts
  BEFORE INSERT OR UPDATE OR DELETE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.check_contracts_integrity();

ALTER FUNCTION public.check_contracts_integrity() OWNER TO postgres;

-- 6.2 contract_items (Itens de Passeios Contratados)
ALTER TABLE public.contract_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read contract_items" ON public.contract_items;
DROP POLICY IF EXISTS "Admin modify contract_items" ON public.contract_items;
DROP POLICY IF EXISTS "Staff select contract_items" ON public.contract_items;
DROP POLICY IF EXISTS "Staff insert contract_items" ON public.contract_items;
DROP POLICY IF EXISTS "Staff update contract_items" ON public.contract_items;
DROP POLICY IF EXISTS "Staff delete contract_items" ON public.contract_items;
DROP POLICY IF EXISTS "Admin delete contract_items" ON public.contract_items;
DROP POLICY IF EXISTS "Team manage contract_items baseline" ON public.contract_items;
DROP POLICY IF EXISTS "Team manage contract_items recovery" ON public.contract_items;
DROP POLICY IF EXISTS "Staff select contract_items recovery" ON public.contract_items;
DROP POLICY IF EXISTS "Staff insert contract_items recovery" ON public.contract_items;
DROP POLICY IF EXISTS "Staff update contract_items recovery" ON public.contract_items;
DROP POLICY IF EXISTS "Staff delete contract_items recovery" ON public.contract_items;
DROP POLICY IF EXISTS "Admin delete contract_items recovery" ON public.contract_items;

CREATE POLICY "Staff select contract_items"
  ON public.contract_items FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Staff insert contract_items"
  ON public.contract_items FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND (
      public.is_admin() OR (
        cost_applied IS NULL AND
        calculated_total_cost IS NULL AND
        (cost_status IS NULL OR cost_status = 'pendente') AND
        (voucher_ref IS NULL OR trim(voucher_ref) = '') AND
        (status IS NULL OR status IN ('agendado', 'pendente'))
      )
    )
  );

CREATE POLICY "Staff update contract_items"
  ON public.contract_items FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- SEGURANÇA ESTRITA: Exclusão direta por vendedores é ESTRITAMENTE PROIBIDA.
-- Apenas administradores possuem política de DELETE direto (e mesmo eles são protegidos
-- pelo trigger trg_protect_contract_items contra exclusão de registros com vínculos).
CREATE POLICY "Admin delete contract_items"
  ON public.contract_items FOR DELETE
  USING (public.is_admin());

REVOKE ALL ON TABLE public.contract_items FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.contract_items TO authenticated;
GRANT ALL ON TABLE public.contract_items TO service_role;

-- -----------------------------------------------------------------------------
-- TRIGGER DE INTEGRIDADE: trg_protect_contract_items
-- Impede contorno de regras via chamadas diretas de UPDATE e DELETE no PostgREST.
-- Garante a nível de banco de dados que vendedores NÃO alterem custos, vouchers,
-- status operacional ou excluam registros com vínculos financeiros/operacionais.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_contract_items_integrity()
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
  -- 1. PROTEÇÃO NO DELETE FÍSICO
  -- =========================================================================
  IF TG_OP = 'DELETE' THEN
    -- Bloqueio absoluto se possuir pagamentos a fornecedores vinculados (inclusive para Admin e na RPC)
    IF EXISTS (
      SELECT 1 FROM public.supplier_payment_allocations 
      WHERE contract_item_id = OLD.id
    ) THEN
      RAISE EXCEPTION 'Integridade violada: o item % possui pagamentos a fornecedores vinculados e não pode ser excluído fisicamente. Marque-o como cancelado.', OLD.id;
    END IF;

    -- Bloqueio absoluto se possuir voucher operacional emitido (inclusive para Admin e na RPC)
    IF OLD.voucher_ref IS NOT NULL AND trim(OLD.voucher_ref) <> '' THEN
      RAISE EXCEPTION 'Integridade violada: o item % possui voucher emitido (%) e não pode ser excluído fisicamente. Marque-o como cancelado.', OLD.id, OLD.voucher_ref;
    END IF;

    -- Bloqueio de exclusão de itens já confirmados ou realizados (inclusive para Admin e na RPC)
    IF OLD.status IN ('confirmado_fornecedor', 'realizado') THEN
      RAISE EXCEPTION 'Integridade violada: o item % está com status % e não pode ser excluído fisicamente. Marque-o como cancelado.', OLD.id, OLD.status;
    END IF;

    RETURN OLD;
  END IF;

  -- =========================================================================
  -- 2. PROTEÇÃO NO UPDATE DIRETO
  -- =========================================================================
  IF TG_OP = 'UPDATE' THEN
    IF NEW.contract_id <> OLD.contract_id THEN
      RAISE EXCEPTION 'Violação de segurança: não é permitido transferir itens entre contratos.';
    END IF;

    -- Não permite alteração de itens se o contrato pai estiver cancelado ou finalizado
    IF EXISTS (
      SELECT 1 FROM public.contracts 
      WHERE id = OLD.contract_id AND status IN ('cancelado', 'finalizado', 'concluido')
    ) AND NOT v_is_admin THEN
      RAISE EXCEPTION 'Acesso negado: itens de contratos cancelados ou finalizados não podem ser alterados por vendedores.';
    END IF;

    -- Restrições estritas a vendedores (não-administradores)
    IF NOT v_is_admin THEN
      -- Custos de fornecedores (auditados ou não): PROIBIDO alterar por vendedores
      IF NEW.cost_applied IS DISTINCT FROM OLD.cost_applied THEN
        RAISE EXCEPTION 'Acesso negado: vendedores não têm permissão para alterar custos de fornecedores em atualizações.';
      END IF;

      IF NEW.calculated_total_cost IS DISTINCT FROM OLD.calculated_total_cost THEN
        RAISE EXCEPTION 'Acesso negado: vendedores não têm permissão para alterar custo total de fornecedores em atualizações.';
      END IF;

      IF NEW.cost_status IS DISTINCT FROM OLD.cost_status THEN
        RAISE EXCEPTION 'Acesso negado: vendedores não têm permissão para alterar status de auditoria de custos em atualizações.';
      END IF;

      IF NEW.cost_currency IS DISTINCT FROM OLD.cost_currency THEN
        RAISE EXCEPTION 'Acesso negado: vendedores não têm permissão para alterar moeda de custos em atualizações.';
      END IF;

      IF NEW.cost_type IS DISTINCT FROM OLD.cost_type THEN
        RAISE EXCEPTION 'Acesso negado: vendedores não têm permissão para alterar modelo de custos em atualizações.';
      END IF;

      -- Vouchers: PROIBIDO forjar ou alterar vouchers operacionais
      IF NEW.voucher_ref IS DISTINCT FROM OLD.voucher_ref THEN
        RAISE EXCEPTION 'Acesso negado: vendedores não têm permissão para criar ou alterar vouchers operacionais.';
      END IF;

      -- Status operacional: PROIBIDO reverter itens confirmados, realizados ou cancelados
      IF OLD.status IN ('confirmado_fornecedor', 'realizado', 'cancelado') AND NEW.status <> OLD.status THEN
        IF NOT (OLD.status = 'confirmado_fornecedor' AND NEW.status = 'cancelado') THEN
          RAISE EXCEPTION 'Acesso negado: status operacional % não pode ser alterado por vendedores.', OLD.status;
        END IF;
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  -- =========================================================================
  -- 3. PROTEÇÃO NO INSERT DIRETO
  -- =========================================================================
  IF TG_OP = 'INSERT' THEN
    IF EXISTS (
      SELECT 1 FROM public.contracts 
      WHERE id = NEW.contract_id AND status IN ('cancelado', 'finalizado', 'concluido')
    ) AND NOT v_is_admin THEN
      RAISE EXCEPTION 'Acesso negado: não é permitido adicionar itens a contratos cancelados ou finalizados.';
    END IF;

    IF NOT v_is_admin THEN
      IF NEW.voucher_ref IS NOT NULL AND trim(NEW.voucher_ref) <> '' THEN
        RAISE EXCEPTION 'Acesso negado: novos itens não podem conter voucher operacional.';
      END IF;

      IF NEW.cost_status = 'auditado' THEN
        RAISE EXCEPTION 'Acesso negado: novos itens cadastrados por vendedores não podem iniciar como auditados.';
      END IF;

      IF NEW.status IN ('confirmado_fornecedor', 'realizado') THEN
        RAISE EXCEPTION 'Acesso negado: novos itens devem iniciar com status agendado.';
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_contract_items ON public.contract_items;
CREATE TRIGGER trg_protect_contract_items
  BEFORE INSERT OR UPDATE OR DELETE ON public.contract_items
  FOR EACH ROW
  EXECUTE FUNCTION public.check_contract_items_integrity();

ALTER FUNCTION public.check_contract_items_integrity() OWNER TO postgres;

-- 6.3 clients (Base Unificada de Clientes)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read clients" ON public.clients;
DROP POLICY IF EXISTS "Admin modify clients" ON public.clients;
DROP POLICY IF EXISTS "Staff select clients" ON public.clients;
DROP POLICY IF EXISTS "Staff insert clients" ON public.clients;
DROP POLICY IF EXISTS "Staff update clients" ON public.clients;
DROP POLICY IF EXISTS "Admin delete clients" ON public.clients;

CREATE POLICY "Staff select clients"
  ON public.clients FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Staff insert clients"
  ON public.clients FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Staff update clients"
  ON public.clients FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin delete clients"
  ON public.clients FOR DELETE
  USING (public.is_admin());

REVOKE ALL ON TABLE public.clients FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.clients TO authenticated;
GRANT ALL ON TABLE public.clients TO service_role;

-- -----------------------------------------------------------------------------
-- 7. TABELAS DE CAPTURA PÚBLICA DE LEADS (SITE PÚBLICO)
-- Visitantes anônimos inserem; Equipe autenticada visualiza e atualiza
-- -----------------------------------------------------------------------------

-- 7.1 leads (Funil de Vendas do Site)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public insert leads" ON public.leads;
DROP POLICY IF EXISTS "Admin select leads" ON public.leads;
DROP POLICY IF EXISTS "Admin update leads" ON public.leads;
DROP POLICY IF EXISTS "Staff select leads" ON public.leads;
DROP POLICY IF EXISTS "Staff update leads" ON public.leads;
DROP POLICY IF EXISTS "Admin delete leads" ON public.leads;

CREATE POLICY "Public insert leads"
  ON public.leads FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Staff select leads"
  ON public.leads FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Staff update leads"
  ON public.leads FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin delete leads"
  ON public.leads FOR DELETE
  USING (public.is_admin());

-- 7.2 curadoria_leads (Solicitações da Curadoria Bella VIP)
ALTER TABLE IF EXISTS public.curadoria_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public insert curadoria_leads" ON public.curadoria_leads;
DROP POLICY IF EXISTS "Staff select curadoria_leads" ON public.curadoria_leads;
DROP POLICY IF EXISTS "Staff update curadoria_leads" ON public.curadoria_leads;
DROP POLICY IF EXISTS "Admin delete curadoria_leads" ON public.curadoria_leads;

CREATE POLICY "Public insert curadoria_leads"
  ON public.curadoria_leads FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Staff select curadoria_leads"
  ON public.curadoria_leads FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Staff update curadoria_leads"
  ON public.curadoria_leads FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin delete curadoria_leads"
  ON public.curadoria_leads FOR DELETE
  USING (public.is_admin());

-- 7.3 partner_leads (Inscrições de Parceiros B2B)
ALTER TABLE IF EXISTS public.partner_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public insert partner_leads" ON public.partner_leads;
DROP POLICY IF EXISTS "Staff select partner_leads" ON public.partner_leads;
DROP POLICY IF EXISTS "Staff update partner_leads" ON public.partner_leads;
DROP POLICY IF EXISTS "Admin delete partner_leads" ON public.partner_leads;

CREATE POLICY "Public insert partner_leads"
  ON public.partner_leads FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Staff select partner_leads"
  ON public.partner_leads FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Staff update partner_leads"
  ON public.partner_leads FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin delete partner_leads"
  ON public.partner_leads FOR DELETE
  USING (public.is_admin());

-- Privilégios para tabelas de leads
REVOKE SELECT, UPDATE, DELETE ON TABLE public.leads FROM anon;
REVOKE SELECT, UPDATE, DELETE ON TABLE public.curadoria_leads FROM anon;
REVOKE SELECT, UPDATE, DELETE ON TABLE public.partner_leads FROM anon;

GRANT INSERT ON TABLE public.leads TO anon;
GRANT INSERT ON TABLE public.curadoria_leads TO anon;
GRANT INSERT ON TABLE public.partner_leads TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.leads TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.curadoria_leads TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.partner_leads TO authenticated;

GRANT ALL ON TABLE public.leads TO service_role;
GRANT ALL ON TABLE public.curadoria_leads TO service_role;
GRANT ALL ON TABLE public.partner_leads TO service_role;

-- -----------------------------------------------------------------------------
-- 8. TABELA: hotels (Catálogo de Hotéis - Leitura da Equipe, Escrita do Admin)
-- -----------------------------------------------------------------------------
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to read hotels" ON public.hotels;
DROP POLICY IF EXISTS "Admin modify hotels" ON public.hotels;

CREATE POLICY "Allow authenticated users to read hotels"
  ON public.hotels FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin modify hotels"
  ON public.hotels FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

REVOKE ALL ON TABLE public.hotels FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.hotels TO authenticated;
GRANT ALL ON TABLE public.hotels TO service_role;

-- -----------------------------------------------------------------------------
-- 9. RPC TRANSACIONAL: Reconciliação Diferencial de Itens de Contrato
-- Execução atômica no banco com preservação de UUIDs, proteção contra perda
-- de referências operacionais e financeiras, e bloqueio de manipulação de IDs.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reconcile_contract_items(
  p_contract_id uuid,
  p_items jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_calling_user_id uuid;
  v_is_admin boolean;
  v_existing_ids uuid[];
  v_kept_ids uuid[] := '{}';
  v_item jsonb;
  v_item_id uuid;
  v_removed_id uuid;
  v_linked_allocations_count int;
  v_cur_voucher text;
  v_cur_status text;
  v_cur_cost_status text;
  v_cur_cost numeric;
  v_cur_total_cost numeric;
  v_cur_cost_currency text;
  v_cur_cost_type text;
  v_item_status text;
  v_cost_applied numeric;
  v_calculated_total_cost numeric;
  v_cost_status text;
  v_cost_currency text;
  v_cost_type text;
  v_voucher_ref text;
  v_lookup_cost numeric;
  v_lookup_currency text;
  v_tour_date date;
  v_tour_name text;
  v_updated_count int := 0;
  v_inserted_count int := 0;
  v_deleted_count int := 0;
  v_canceled_count int := 0;
BEGIN
  -- 1. Verificação de autenticação e papel da equipe
  v_calling_user_id := auth.uid();
  IF v_calling_user_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: operação requer autenticação.';
  END IF;

  v_is_admin := public.is_admin();
  -- Compatibilidade com enum real public.app_role ('admin', 'moderator', 'user'):
  -- Vendedores possuem role = 'user' ou 'moderator'
  IF NOT v_is_admin AND NOT (
    public.has_role(v_calling_user_id, 'user') OR 
    public.has_role(v_calling_user_id, 'moderator')
  ) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores e vendedores autorizados podem reconciliar itens.';
  END IF;

  -- 2. Validação do contrato de destino
  IF p_contract_id IS NULL THEN
    RAISE EXCEPTION 'Parâmetro inválido: p_contract_id não pode ser nulo.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.contracts WHERE id = p_contract_id
  ) THEN
    RAISE EXCEPTION 'Contrato não encontrado: ID % inexistente.', p_contract_id;
  END IF;

  -- Contratos cancelados ou finalizados só podem ter itens modificados por administradores
  IF EXISTS (
    SELECT 1 FROM public.contracts 
    WHERE id = p_contract_id AND status IN ('cancelado', 'finalizado', 'concluido')
  ) AND NOT v_is_admin THEN
    RAISE EXCEPTION 'Acesso negado: itens de contratos cancelados ou finalizados só podem ser alterados por administradores.';
  END IF;

  -- 3. Validação estrutural do payload JSONB
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' THEN
    RAISE EXCEPTION 'Payload inválido: p_items deve ser um array JSON de itens.';
  END IF;

  -- 4. Carregar IDs de itens atualmente pertencentes a este contrato
  SELECT array_agg(id) INTO v_existing_ids
  FROM public.contract_items
  WHERE contract_id = p_contract_id;

  IF v_existing_ids IS NULL THEN
    v_existing_ids := '{}';
  END IF;

  -- 5. Processar cada item do payload
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    IF jsonb_typeof(v_item) <> 'object' THEN
      RAISE EXCEPTION 'Item inválido: cada elemento de p_items deve ser um objeto JSON.';
    END IF;

    -- Validação de campos obrigatórios
    v_tour_name := trim(COALESCE(v_item->>'tour_name_snapshot', ''));
    IF v_tour_name = '' THEN
      RAISE EXCEPTION 'Validação falhou: tour_name_snapshot é obrigatório em todos os itens.';
    END IF;

    IF (v_item->>'tour_date') IS NULL OR trim(v_item->>'tour_date') = '' THEN
      RAISE EXCEPTION 'Validação falhou: tour_date é obrigatório em todos os itens.';
    END IF;

    BEGIN
      v_tour_date := (v_item->>'tour_date')::date;
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'Data inválida para o passeio %: %', v_tour_name, v_item->>'tour_date';
    END;

    -- Identificação de ID e proteção contra sequestro de itens
    v_item_id := NULL;
    IF v_item ? 'id' AND (v_item->>'id') IS NOT NULL AND trim(v_item->>'id') <> '' THEN
      BEGIN
        v_item_id := (v_item->>'id')::uuid;
      EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'ID de item com formato UUID inválido: %', v_item->>'id';
      END;

      -- Proteção estrita contra manipulação de IDs:
      -- O item não pode pertencer a outro contrato!
      IF EXISTS (
        SELECT 1 FROM public.contract_items
        WHERE id = v_item_id AND contract_id <> p_contract_id
      ) THEN
        RAISE EXCEPTION 'Violação de segurança: o item % pertence a outro contrato.', v_item_id;
      END IF;
    END IF;

    IF v_item_id IS NOT NULL AND v_item_id = ANY(v_existing_ids) THEN
      -- =====================================================================
      -- ITEM EXISTENTE: UPDATE PRESERVANDO UUID E CAMPOS RESTRITOS
      -- =====================================================================
      SELECT 
        cost_status, 
        cost_applied, 
        calculated_total_cost, 
        cost_currency, 
        cost_type, 
        voucher_ref, 
        status
      INTO 
        v_cur_cost_status, 
        v_cur_cost, 
        v_cur_total_cost, 
        v_cur_cost_currency, 
        v_cur_cost_type, 
        v_cur_voucher, 
        v_cur_status
      FROM public.contract_items
      WHERE id = v_item_id;

      IF NOT v_is_admin THEN
        -- Proteção contra manipulação por Seller:
        -- Custos (auditados ou não) são estritamente preservados da base de dados
        v_cost_applied := v_cur_cost;
        v_calculated_total_cost := v_cur_total_cost;
        v_cost_status := v_cur_cost_status;
        v_cost_currency := COALESCE(v_cur_cost_currency, 'USD');
        v_cost_type := COALESCE(v_cur_cost_type, 'per_person');
        -- Vouchers operacionais são preservados (Seller não pode alterar/forjar)
        v_voucher_ref := v_cur_voucher;
        -- Confirmações com operadores ou passeios já realizados não podem ser revertidos
        IF v_cur_status IN ('confirmado_fornecedor', 'realizado', 'cancelado') THEN
          v_item_status := v_cur_status;
        ELSE
          v_item_status := COALESCE(v_item->>'status', 'agendado');
        END IF;
      ELSE
        -- Administrador tem permissão para ajustar custos, vouchers e status
        v_cost_applied := CASE 
          WHEN (v_item->>'cost_applied') IS NOT NULL AND trim(v_item->>'cost_applied') <> '' 
            THEN (v_item->>'cost_applied')::numeric 
          ELSE v_cur_cost 
        END;
        v_calculated_total_cost := CASE 
          WHEN (v_item->>'calculated_total_cost') IS NOT NULL AND trim(v_item->>'calculated_total_cost') <> '' 
            THEN (v_item->>'calculated_total_cost')::numeric 
          ELSE v_cur_total_cost 
        END;
        v_cost_status := COALESCE(v_item->>'cost_status', v_cur_cost_status, 'calculado');
        v_cost_currency := COALESCE(v_item->>'cost_currency', v_cur_cost_currency, 'USD');
        v_cost_type := COALESCE(v_item->>'cost_type', v_cur_cost_type, 'per_person');
        v_voucher_ref := v_item->>'voucher_ref';
        v_item_status := COALESCE(v_item->>'status', v_cur_status, 'agendado');
      END IF;

      UPDATE public.contract_items SET
        tour_id = CASE WHEN length(v_item->>'tour_id') = 36 THEN (v_item->>'tour_id')::uuid ELSE NULL END,
        supplier_id = CASE WHEN length(v_item->>'supplier_id') = 36 THEN (v_item->>'supplier_id')::uuid ELSE NULL END,
        tour_date = v_tour_date,
        tour_name_snapshot = v_tour_name,
        tour_included_snapshot = v_item->>'tour_included_snapshot',
        tour_not_included_snapshot = v_item->>'tour_not_included_snapshot',
        supplier_name_snapshot = v_item->>'supplier_name_snapshot',
        adults_count = GREATEST(COALESCE((v_item->>'adults_count')::int, 1), 0),
        children_count = GREATEST(COALESCE((v_item->>'children_count')::int, 0), 0),
        units_count = GREATEST(COALESCE((v_item->>'units_count')::int, 1), 1),
        sale_price = GREATEST(COALESCE((v_item->>'sale_price')::numeric, 0), 0),
        cost_applied = v_cost_applied,
        cost_currency = v_cost_currency,
        cost_type = v_cost_type,
        calculated_total_cost = v_calculated_total_cost,
        cost_status = v_cost_status,
        tariff_code_snapshot = v_item->>'tariff_code_snapshot',
        pricing_model_snapshot = v_item->>'pricing_model_snapshot',
        external_fees_snapshot = v_item->>'external_fees_snapshot',
        calculation_breakdown = COALESCE(v_item->'calculation_breakdown', '{}'::jsonb),
        notes = v_item->>'notes',
        voucher_ref = v_voucher_ref,
        status = v_item_status,
        updated_at = now()
      WHERE id = v_item_id;

      v_kept_ids := array_append(v_kept_ids, v_item_id);
      v_updated_count := v_updated_count + 1;
    ELSE
      -- =====================================================================
      -- NOVO ITEM: INSERT COM REGRAS ESTRITAS POR PAPEL
      -- =====================================================================
      IF NOT v_is_admin THEN
        -- Vendedor não pode gerar vouchers nem definir status confirmado no cadastro
        v_voucher_ref := NULL;
        v_cost_status := 'pendente';
        v_item_status := 'agendado';
        v_cost_currency := COALESCE(v_item->>'cost_currency', 'USD');
        v_cost_type := COALESCE(v_item->>'cost_type', 'per_person');
        -- Não substitui valores desconhecidos de custos por zero:
        v_cost_applied := NULL;
        v_calculated_total_cost := NULL;

        -- Tenta recuperar custo canônico oficial da tabela supplier_cost_options
        IF (v_item->>'tariff_code_snapshot') IS NOT NULL AND trim(v_item->>'tariff_code_snapshot') <> '' THEN
          SELECT cost_value, currency INTO v_lookup_cost, v_lookup_currency
          FROM public.supplier_cost_options
          WHERE option_code = trim(v_item->>'tariff_code_snapshot')
            AND is_active = true
          LIMIT 1;

          IF v_lookup_cost IS NOT NULL THEN
            v_cost_applied := v_lookup_cost;
            v_calculated_total_cost := v_lookup_cost * GREATEST(COALESCE((v_item->>'adults_count')::int, 1), 1);
            v_cost_currency := COALESCE(v_lookup_currency, 'USD');
            v_cost_status := 'calculado';
          END IF;
        END IF;
      ELSE
        -- Administrador tem permissão total
        v_voucher_ref := v_item->>'voucher_ref';
        v_cost_status := COALESCE(v_item->>'cost_status', 'calculado');
        v_item_status := COALESCE(v_item->>'status', 'agendado');
        v_cost_applied := CASE 
          WHEN (v_item->>'cost_applied') IS NOT NULL AND trim(v_item->>'cost_applied') <> '' 
            THEN (v_item->>'cost_applied')::numeric 
          ELSE NULL 
        END;
        v_calculated_total_cost := CASE 
          WHEN (v_item->>'calculated_total_cost') IS NOT NULL AND trim(v_item->>'calculated_total_cost') <> '' 
            THEN (v_item->>'calculated_total_cost')::numeric 
          ELSE NULL 
        END;
        v_cost_currency := COALESCE(v_item->>'cost_currency', 'USD');
        v_cost_type := COALESCE(v_item->>'cost_type', 'per_person');
      END IF;

      INSERT INTO public.contract_items (
        contract_id,
        tour_id,
        supplier_id,
        tour_date,
        tour_name_snapshot,
        tour_included_snapshot,
        tour_not_included_snapshot,
        supplier_name_snapshot,
        adults_count,
        children_count,
        units_count,
        sale_price,
        cost_applied,
        cost_currency,
        cost_type,
        calculated_total_cost,
        cost_status,
        tariff_code_snapshot,
        pricing_model_snapshot,
        external_fees_snapshot,
        calculation_breakdown,
        notes,
        voucher_ref,
        status,
        created_at,
        updated_at
      ) VALUES (
        p_contract_id,
        CASE WHEN length(v_item->>'tour_id') = 36 THEN (v_item->>'tour_id')::uuid ELSE NULL END,
        CASE WHEN length(v_item->>'supplier_id') = 36 THEN (v_item->>'supplier_id')::uuid ELSE NULL END,
        v_tour_date,
        v_tour_name,
        v_item->>'tour_included_snapshot',
        v_item->>'tour_not_included_snapshot',
        v_item->>'supplier_name_snapshot',
        GREATEST(COALESCE((v_item->>'adults_count')::int, 1), 0),
        GREATEST(COALESCE((v_item->>'children_count')::int, 0), 0),
        GREATEST(COALESCE((v_item->>'units_count')::int, 1), 1),
        GREATEST(COALESCE((v_item->>'sale_price')::numeric, 0), 0),
        v_cost_applied,
        v_cost_currency,
        v_cost_type,
        v_calculated_total_cost,
        v_cost_status,
        v_item->>'tariff_code_snapshot',
        v_item->>'pricing_model_snapshot',
        v_item->>'external_fees_snapshot',
        COALESCE(v_item->'calculation_breakdown', '{}'::jsonb),
        v_item->>'notes',
        v_voucher_ref,
        v_item_status,
        now(),
        now()
      );

      v_inserted_count := v_inserted_count + 1;
    END IF;
  END LOOP;

  -- 6. Processar itens removidos do formulário
  FOREACH v_removed_id IN ARRAY v_existing_ids
  LOOP
    IF NOT (v_removed_id = ANY(v_kept_ids)) THEN
      -- Checar vínculos financeiros em pagamentos
      SELECT count(*) INTO v_linked_allocations_count
      FROM public.supplier_payment_allocations
      WHERE contract_item_id = v_removed_id;

      -- Checar vínculos operacionais (voucher emitido ou status executado/confirmado)
      SELECT voucher_ref, status INTO v_cur_voucher, v_cur_status
      FROM public.contract_items
      WHERE id = v_removed_id;

      IF v_linked_allocations_count > 0 
         OR (v_cur_voucher IS NOT NULL AND trim(v_cur_voucher) <> '')
         OR (v_cur_status IN ('confirmado_fornecedor', 'realizado', 'cancelado')) THEN
        -- Preservação lógica: marca como cancelado para manter rastreabilidade contábil e operacional
        UPDATE public.contract_items
        SET status = 'cancelado',
            notes = COALESCE(notes, '') || ' [Item cancelado em revisão contratual - mantido por integridade financeira/operacional]',
            updated_at = now()
        WHERE id = v_removed_id;

        v_canceled_count := v_canceled_count + 1;
      ELSE
        -- Exclusão física segura para itens estritamente não-vinculados
        DELETE FROM public.contract_items WHERE id = v_removed_id;
        v_deleted_count := v_deleted_count + 1;
      END IF;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'contract_id', p_contract_id,
    'updated', v_updated_count,
    'inserted', v_inserted_count,
    'deleted', v_deleted_count,
    'canceled', v_canceled_count
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reconcile_contract_items(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reconcile_contract_items(uuid, jsonb) TO authenticated, service_role;
ALTER FUNCTION public.reconcile_contract_items(uuid, jsonb) OWNER TO postgres;

-- -----------------------------------------------------------------------------
-- 10. RPC TRANSACIONAL ATÔMICA: save_contract_with_items
-- Salva o contrato principal (INSERT ou UPDATE) e reconcilia todos os itens
-- em uma ÚNICA transação atômica no PostgreSQL. Se qualquer validação ou item
-- falhar, NADA é persistido, garantindo atomicidade total e prevenindo
-- estados parciais inconsistentes.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.save_contract_with_items(
  p_contract jsonb,
  p_items jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  calling_user_id uuid;
  v_is_admin boolean;
  v_contract_id uuid;
  v_reconcile_result jsonb;
  v_client_id uuid;
  v_deposit_amount numeric;
  v_balance_amount numeric;
  v_total_amount numeric;
  v_arrival_date date;
  v_departure_date date;
  v_contract_status text;
BEGIN
  -- 1. Autenticação obrigatória
  calling_user_id := auth.uid();
  IF calling_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado: operação restrita a usuários com login ativo.';
  END IF;

  -- 2. Autorização (Admin ou Seller mapeado via enum real public.app_role)
  v_is_admin := public.is_admin();
  IF NOT v_is_admin AND NOT (
    public.has_role(calling_user_id, 'user') OR 
    public.has_role(calling_user_id, 'moderator')
  ) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores e vendedores autorizados podem salvar contratos.';
  END IF;

  IF p_contract IS NULL OR jsonb_typeof(p_contract) <> 'object' THEN
    RAISE EXCEPTION 'Payload inválido: p_contract deve ser um objeto JSON.';
  END IF;

  -- Validação de campos obrigatórios do contrato
  IF (p_contract->>'client_name') IS NULL OR trim(p_contract->>'client_name') = '' THEN
    RAISE EXCEPTION 'Validação falhou: client_name é obrigatório.';
  END IF;

  IF (p_contract->>'contract_number') IS NULL OR trim(p_contract->>'contract_number') = '' THEN
    RAISE EXCEPTION 'Validação falhou: contract_number é obrigatório.';
  END IF;

  -- Parsing e sanitização de valores numéricos e datas
  v_deposit_amount := GREATEST(COALESCE((p_contract->>'deposit_amount')::numeric, 0), 0);
  v_balance_amount := GREATEST(COALESCE((p_contract->>'balance_amount')::numeric, 0), 0);
  v_total_amount := GREATEST(COALESCE((p_contract->>'total_amount')::numeric, 0), 0);

  IF (p_contract->>'client_id') IS NOT NULL AND length(trim(p_contract->>'client_id')) = 36 THEN
    v_client_id := (p_contract->>'client_id')::uuid;
  ELSE
    v_client_id := NULL;
  END IF;

  IF (p_contract->>'arrival_date') IS NOT NULL AND trim(p_contract->>'arrival_date') <> '' THEN
    BEGIN
      v_arrival_date := (p_contract->>'arrival_date')::date;
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'Data de chegada inválida: %', p_contract->>'arrival_date';
    END;
  ELSE
    v_arrival_date := CURRENT_DATE;
  END IF;

  IF (p_contract->>'departure_date') IS NOT NULL AND trim(p_contract->>'departure_date') <> '' THEN
    BEGIN
      v_departure_date := (p_contract->>'departure_date')::date;
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'Data de saída inválida: %', p_contract->>'departure_date';
    END;
  ELSE
    v_departure_date := NULL;
  END IF;

  -- Validação de status solicitado
  v_contract_status := COALESCE(p_contract->>'status', 'rascunho');
  IF NOT v_is_admin AND v_contract_status = 'cancelado' THEN
    RAISE EXCEPTION 'Acesso negado: cancelamento de contrato é uma operação restrita a administradores.';
  END IF;

  -- 3. Identificar se é UPDATE de contrato existente ou INSERT de novo contrato
  IF p_contract ? 'id' AND (p_contract->>'id') IS NOT NULL AND trim(p_contract->>'id') <> '' THEN
    BEGIN
      v_contract_id := (p_contract->>'id')::uuid;
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'ID de contrato com formato UUID inválido: %', p_contract->>'id';
    END;

    IF NOT EXISTS (SELECT 1 FROM public.contracts WHERE id = v_contract_id) THEN
      RAISE EXCEPTION 'Contrato não encontrado: ID % inexistente.', v_contract_id;
    END IF;

    -- Não permite alteração de contratos cancelados ou finalizados por vendedores
    IF EXISTS (
      SELECT 1 FROM public.contracts 
      WHERE id = v_contract_id AND status IN ('cancelado', 'finalizado', 'concluido')
    ) AND NOT v_is_admin THEN
      RAISE EXCEPTION 'Acesso negado: contratos cancelados ou finalizados só podem ser alterados por administradores.';
    END IF;

    UPDATE public.contracts SET
      contract_number = trim(p_contract->>'contract_number'),
      client_id = v_client_id,
      client_name = trim(p_contract->>'client_name'),
      client_cpf = p_contract->>'client_cpf',
      client_phone = p_contract->>'client_phone',
      client_email = p_contract->>'client_email',
      arrival_date = v_arrival_date,
      departure_date = v_departure_date,
      arrival_flight_number = p_contract->>'arrival_flight_number',
      arrival_flight_time = p_contract->>'arrival_flight_time',
      depart_flight_number = p_contract->>'depart_flight_number',
      depart_flight_time = p_contract->>'depart_flight_time',
      adults_count = GREATEST(COALESCE((p_contract->>'adults_count')::int, 1), 1),
      children_count = GREATEST(COALESCE((p_contract->>'children_count')::int, 0), 0),
      infants_count = GREATEST(COALESCE((p_contract->>'infants_count')::int, 0), 0),
      hotels_schedule = COALESCE(p_contract->'hotels_schedule', '[]'::jsonb),
      deposit_amount = v_deposit_amount,
      deposit_observation = p_contract->>'deposit_observation',
      balance_amount = v_balance_amount,
      balance_observation = p_contract->>'balance_observation',
      total_amount = v_total_amount,
      currency = COALESCE(p_contract->>'currency', 'BRL'),
      status = CASE 
        WHEN v_is_admin THEN v_contract_status
        ELSE COALESCE(NULLIF(v_contract_status, 'cancelado'), 'rascunho')
      END,
      terms_clauses = p_contract->>'terms_clauses',
      internal_notes = p_contract->>'internal_notes',
      updated_at = now()
    WHERE id = v_contract_id;
  ELSE
    INSERT INTO public.contracts (
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
      created_at,
      updated_at
    ) VALUES (
      trim(p_contract->>'contract_number'),
      v_client_id,
      trim(p_contract->>'client_name'),
      p_contract->>'client_cpf',
      p_contract->>'client_phone',
      p_contract->>'client_email',
      v_arrival_date,
      v_departure_date,
      p_contract->>'arrival_flight_number',
      p_contract->>'arrival_flight_time',
      p_contract->>'depart_flight_number',
      p_contract->>'depart_flight_time',
      GREATEST(COALESCE((p_contract->>'adults_count')::int, 1), 1),
      GREATEST(COALESCE((p_contract->>'children_count')::int, 0), 0),
      GREATEST(COALESCE((p_contract->>'infants_count')::int, 0), 0),
      COALESCE(p_contract->'hotels_schedule', '[]'::jsonb),
      v_deposit_amount,
      p_contract->>'deposit_observation',
      v_balance_amount,
      p_contract->>'balance_observation',
      v_total_amount,
      COALESCE(p_contract->>'currency', 'BRL'),
      v_contract_status,
      p_contract->>'terms_clauses',
      p_contract->>'internal_notes',
      now(),
      now()
    ) RETURNING id INTO v_contract_id;
  END IF;

  -- 4. Reconciliar itens de forma atômica dentro da mesma transação
  IF p_items IS NOT NULL AND jsonb_typeof(p_items) = 'array' THEN
    v_reconcile_result := public.reconcile_contract_items(v_contract_id, p_items);
  ELSE
    v_reconcile_result := jsonb_build_object(
      'contract_id', v_contract_id,
      'updated', 0,
      'inserted', 0,
      'deleted', 0,
      'canceled', 0
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'contract_id', v_contract_id,
    'items', v_reconcile_result
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.save_contract_with_items(jsonb, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_contract_with_items(jsonb, jsonb) TO authenticated, service_role;
ALTER FUNCTION public.save_contract_with_items(jsonb, jsonb) OWNER TO postgres;

COMMIT;

