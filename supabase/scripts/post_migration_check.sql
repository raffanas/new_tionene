-- =============================================================================
-- TÍO NENÊ - SCRIPT DE PÓS-VERIFICAÇÃO DIAGNÓSTICA E TESTES DE AUTORIZAÇÃO
-- Arquivo: supabase/scripts/post_migration_check.sql
--
-- Executar no SQL Editor do Supabase APÓS aplicar a migration RBAC.
-- Valida estruturalmente e testa ativamente a segurança das tabelas,
-- funções e RPCs sem criar usuários nem alterar dados remotos.
--
-- ORIENTAÇÃO DE EXECUÇÃO OBRIGATÓRIA:
-- 1. Execute este script COMPLETO em uma ÚNICA execução no SQL Editor do Supabase.
-- 2. Não execute trechos parciais isolados, pois a Seção 7 opera em bloco transacional
--    fechado com troca de papéis ('SET LOCAL ROLE') e variáveis locais de sessão.
-- 3. Se ocorrer qualquer erro imprevisto durante o teste, confirme que a transação
--    foi encerrada antes de prosseguir (execute 'ROLLBACK;' ou 'RESET ROLE;' no editor).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. VERIFICAÇÃO DE RLS NAS 15 TABELAS DO SISTEMA
-- -----------------------------------------------------------------------------
SELECT 
  tablename AS tabela, 
  rowsecurity AS rls_ativo,
  CASE WHEN rowsecurity THEN '✓ OK (RLS Ativo)' ELSE '✗ FALHA CRÍTICA: RLS Desativado' END AS status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'suppliers', 'supplier_tours', 'supplier_cost_options', 
    'supplier_cost_audit_log', 'supplier_payments', 'supplier_payment_allocations',
    'contracts', 'contract_items', 'clients', 'hotels', 'user_roles', 
    'profiles', 'leads', 'curadoria_leads', 'partner_leads'
  )
ORDER BY tablename;

-- -----------------------------------------------------------------------------
-- 2. DETECÇÃO DE POLÍTICAS PERMISSIVAS RESIDUAIS (qual E with_check)
-- Analisa separadamente condições USING (qual) e WITH CHECK (with_check).
-- -----------------------------------------------------------------------------
SELECT 
  tablename AS tabela, 
  policyname AS politica, 
  cmd AS operacao, 
  roles AS papeis_alvo, 
  qual AS condicao_using,
  with_check AS condicao_check,
  CASE 
    -- Permissão pública legítima de captura de leads do site
    WHEN cmd = 'INSERT' 
         AND tablename IN ('leads', 'curadoria_leads', 'partner_leads') 
         AND (with_check = 'true' OR qual = 'true')
      THEN '✓ OK (Captura pública de leads autorizada)'
      
    -- Qualquer outra política irrestrita (true) em tabelas comerciais/administrativas é falha grave
    WHEN qual = 'true' OR with_check = 'true' 
      THEN '✗ ALERTA CRÍTICO: Política permissiva residual detectada! Invalida restrições.'
      
    ELSE '✓ OK (Restritiva e protegida)'
  END AS avaliacao_seguranca
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- -----------------------------------------------------------------------------
-- 2.1 VERIFICAÇÃO DE TRIGGERS E POLÍTICAS DE INTEGRIDADE (CONTRACTS E CONTRACT_ITEMS)
-- -----------------------------------------------------------------------------
-- Garante que Sellers NÃO possuam política de DELETE direto em contract_items
SELECT 
  tablename, 
  policyname, 
  cmd, 
  qual, 
  CASE 
    WHEN cmd = 'DELETE' AND qual LIKE '%is_admin%' THEN '✓ OK (DELETE restrito a Admin)'
    WHEN cmd = 'DELETE' THEN '✗ FALHA: DELETE em contract_items permitido a não-admins!'
    ELSE '✓ OK'
  END AS status_delete_policy
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'contract_items' 
  AND cmd = 'DELETE';

-- Garante que os triggers de proteção ativa estejam operantes no PostgreSQL
SELECT 
  tgname AS trigger_name,
  relname AS tabela,
  CASE WHEN tgenabled = 'O' THEN '✓ OK (Trigger ativo e operante)' ELSE '✗ FALHA: Trigger desativado' END AS status_trigger
FROM pg_trigger
JOIN pg_class ON pg_class.oid = pg_trigger.tgrelid
JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
WHERE pg_namespace.nspname = 'public'
  AND tgname IN ('trg_protect_contracts', 'trg_protect_contract_items')
ORDER BY tgname;

-- -----------------------------------------------------------------------------
-- 3. VERIFICAÇÃO DE FUNÇÕES SECURITY DEFINER E SEARCH_PATH SEGURO
-- -----------------------------------------------------------------------------
SELECT 
  proname AS funcao,
  prosecdef AS is_security_definer,
  proconfig AS configuracao_search_path,
  CASE 
    WHEN prosecdef AND 'search_path=' = ANY(proconfig) 
      THEN '✓ OK (Blindado: search_path imutável vazio)'
    ELSE '✗ FALHA: search_path não fixado ou SECURITY DEFINER ausente'
  END AS status_blindagem
FROM pg_proc
JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
WHERE pg_namespace.nspname = 'public'
  AND proname IN (
    'is_admin', 'get_user_role', 'has_role', 
    'reconcile_contract_items', 'save_contract_with_items', 
    'check_contracts_integrity', 'check_contract_items_integrity'
  )
ORDER BY proname;

-- -----------------------------------------------------------------------------
-- 4. VERIFICAÇÃO DE PRIVILÉGIOS DE EXECUÇÃO DAS RPCS (REVOKE de anon e PUBLIC)
-- -----------------------------------------------------------------------------
SELECT 
  p.proname AS funcao,
  COALESCE(r.grantee, 'NENHUM PRIVILÉGIO PÚBLICO') AS grantee_publico,
  CASE 
    WHEN r.grantee IN ('anon', 'PUBLIC') 
      THEN '✗ FALHA: Execução pública ou anônima permitida!'
    ELSE '✓ OK (Execução restrita a authenticated e service_role)'
  END AS status_execucao
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
LEFT JOIN information_schema.routine_privileges r 
  ON r.routine_schema = n.nspname 
  AND r.routine_name = p.proname 
  AND r.grantee IN ('anon', 'PUBLIC')
WHERE n.nspname = 'public'
  AND p.proname IN (
    'is_admin', 'get_user_role', 'has_role', 
    'reconcile_contract_items', 'save_contract_with_items',
    'check_contracts_integrity', 'check_contract_items_integrity'
  );

-- -----------------------------------------------------------------------------
-- 5. VERIFICAÇÃO DE PRIVILÉGIOS POSTGREST NAS TABELAS (GRANT a authenticated)
-- -----------------------------------------------------------------------------
SELECT 
  table_name AS tabela, 
  grantee AS papel, 
  string_agg(privilege_type, ', ' ORDER BY privilege_type) AS privilegios
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated')
  AND table_name IN (
    'suppliers', 'supplier_tours', 'supplier_cost_options', 
    'supplier_payments', 'contracts', 'contract_items', 'clients', 'hotels', 'user_roles'
  )
GROUP BY table_name, grantee
ORDER BY table_name, grantee;

-- -----------------------------------------------------------------------------
-- 6. VERIFICAÇÃO DE INTEGRIDADE DAS CONTAGENS DE REGISTROS (Zero perda de dados)
-- -----------------------------------------------------------------------------
SELECT 'suppliers' AS tabela, count(*) AS total_registros FROM public.suppliers
UNION ALL
SELECT 'supplier_cost_options', count(*) FROM public.supplier_cost_options
UNION ALL
SELECT 'contracts', count(*) FROM public.contracts
UNION ALL
SELECT 'contract_items', count(*) FROM public.contract_items
UNION ALL
SELECT 'clients', count(*) FROM public.clients
UNION ALL
SELECT 'hotels', count(*) FROM public.hotels
UNION ALL
SELECT 'leads', count(*) FROM public.leads
UNION ALL
SELECT 'user_roles', count(*) FROM public.user_roles;

-- -----------------------------------------------------------------------------
-- 7. TESTES ATIVOS TRIPARTITES DE AUTORIZAÇÃO EM SESSÃO CONTROLADA
-- Executado em bloco transacional que realiza ROLLBACK obrigatório ao final.
--
-- ESTRUTURA METODOLÓGICA CONFORME BOAS PRÁTICAS POSTGRESQL:
-- 1. Preparação de Dados: Executada como papel administrativo (postgres/superuser).
-- 2. Mudança de Papel (Role Switching): Comandos 'SET LOCAL ROLE' no nível de instrução SQL (fora de DO).
-- 4. Reversão Garantida: ROLLBACK obrigatório ao final, sem persistência residual.
-- -----------------------------------------------------------------------------
BEGIN;

-- =============================================================================
-- FASE 7.0: PREPARAÇÃO DE DADOS DE TESTE (EXECUTADO COMO SUPERUSER / POSTGRES)
-- ZERO exclusão de dados preexistentes (eliminação total de DELETE preparatório).
-- Geração dinâmica de identificadores exclusivos com validação preventiva de colisão.
-- Respeita integridade referencial de auth.users e user_roles.
-- =============================================================================
DO $$
DECLARE
  v_admin_user_id uuid;
  v_seller_user_id uuid;
  v_contract_id uuid;
  v_finalized_contract_id uuid;
  v_item1_id uuid;
  v_item2_id uuid;
  v_item3_id uuid;
  v_item4_id uuid;
  v_active_contract_num text;
  v_finalized_contract_num text;
BEGIN
  -- 1. Resolução segura de usuários para os testes (sem DELETE e sem violação de FK)
  -- 1.1 Localiza Admin pré-existente em public.user_roles
  SELECT user_id INTO v_admin_user_id 
  FROM public.user_roles 
  WHERE role = 'admin' 
  LIMIT 1;

  -- 1.2 Localiza Seller (user ou moderator) pré-existente em public.user_roles
  SELECT user_id INTO v_seller_user_id 
  FROM public.user_roles 
  WHERE role IN ('user', 'moderator') 
  LIMIT 1;

  -- 1.3 Caso não haja Seller em user_roles, busca usuário em auth.users para associar temporariamente
  IF v_seller_user_id IS NULL THEN
    SELECT id INTO v_seller_user_id 
    FROM auth.users 
    WHERE id <> COALESCE(v_admin_user_id, '00000000-0000-0000-0000-000000000000'::uuid) 
    LIMIT 1;

    IF v_seller_user_id IS NOT NULL THEN
      INSERT INTO public.user_roles (user_id, role) 
      VALUES (v_seller_user_id, 'user');
    END IF;
  END IF;

  -- 1.4 Se ainda não houver Seller e a tabela user_roles NÃO possuir FK obrigatória para auth.users
  IF v_seller_user_id IS NULL THEN
    IF EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
      WHERE c.conrelid = 'public.user_roles'::regclass
        AND c.contype = 'f'
        AND a.attname = 'user_id'
    ) THEN
      RAISE EXCEPTION 'Abortando testes ativos: não foi encontrado nenhum usuário Seller em auth.users ou public.user_roles para simulação segura.';
    ELSE
      v_seller_user_id := gen_random_uuid();
      INSERT INTO public.user_roles (user_id, role) VALUES (v_seller_user_id, 'user');
    END IF;
  END IF;

  -- 1.5 Caso não haja Admin em user_roles, busca usuário em auth.users para associar temporariamente
  IF v_admin_user_id IS NULL THEN
    SELECT id INTO v_admin_user_id 
    FROM auth.users 
    WHERE id <> v_seller_user_id 
    LIMIT 1;

    IF v_admin_user_id IS NOT NULL THEN
      INSERT INTO public.user_roles (user_id, role) 
      VALUES (v_admin_user_id, 'admin');
    END IF;
  END IF;

  IF v_admin_user_id IS NULL THEN
    IF EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
      WHERE c.conrelid = 'public.user_roles'::regclass
        AND c.contype = 'f'
        AND a.attname = 'user_id'
    ) THEN
      RAISE EXCEPTION 'Abortando testes ativos: não foi encontrado nenhum usuário Admin em auth.users ou public.user_roles para simulação segura.';
    ELSE
      v_admin_user_id := gen_random_uuid();
      INSERT INTO public.user_roles (user_id, role) VALUES (v_admin_user_id, 'admin');
    END IF;
  END IF;

  -- 2. Geração dinâmica de identificadores exclusivos para esta execução
  v_contract_id := gen_random_uuid();
  v_finalized_contract_id := gen_random_uuid();
  v_item1_id := gen_random_uuid();
  v_item2_id := gen_random_uuid();
  v_item3_id := gen_random_uuid();
  v_item4_id := gen_random_uuid();

  v_active_contract_num := 'TN-TEST-ACT-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSMS') || '-' || substr(gen_random_uuid()::text, 1, 6);
  v_finalized_contract_num := 'TN-TEST-FIN-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSMS') || '-' || substr(gen_random_uuid()::text, 1, 6);

  -- 3. Validação preventiva de colisões antes de inserir dados de teste
  IF EXISTS (
    SELECT 1 FROM public.contracts 
    WHERE id IN (v_contract_id, v_finalized_contract_id) 
       OR contract_number IN (v_active_contract_num, v_finalized_contract_num)
  ) THEN
    RAISE EXCEPTION 'Colisão de chave primária ou número de contrato detectada em public.contracts. Abortando para proteger dados preexistentes.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.contract_items 
    WHERE id IN (v_item1_id, v_item2_id, v_item3_id, v_item4_id)
  ) THEN
    RAISE EXCEPTION 'Colisão de chave primária detectada em public.contract_items. Abortando para proteger dados preexistentes.';
  END IF;

  -- 4. Criação dos contratos de teste isolados (ZERO DELETE executado)
  INSERT INTO public.contracts (id, contract_number, client_name, status, total_amount, arrival_date)
  VALUES 
    (v_contract_id, v_active_contract_num, 'Cliente Teste Ativo ' || substr(gen_random_uuid()::text, 1, 6), 'emitido', 1500.00, CURRENT_DATE),
    (v_finalized_contract_id, v_finalized_contract_num, 'Cliente Teste Finalizado ' || substr(gen_random_uuid()::text, 1, 6), 'finalizado', 2000.00, CURRENT_DATE);

  -- 5. Criação dos itens de teste com diferentes estados para validação do RLS e RPC
  -- Item 1: Item ativo mantido
  -- Item 2: Item de rascunho sem vínculos (para testar exclusão legítima via RPC e bloqueio direto via RLS)
  -- Item 3: Item com voucher operacional (não pode ser apagado mesmo via RPC, deve ser cancelado logicamente)
  -- Item 4: Item em contrato finalizado (para validar bloqueio de edição em contratos encerrados)
  INSERT INTO public.contract_items (id, contract_id, tour_name_snapshot, tour_date, status, cost_applied, cost_status)
  VALUES (v_item1_id, v_contract_id, 'Passeio Mantido', CURRENT_DATE, 'agendado', 350.00, 'calculado');

  INSERT INTO public.contract_items (id, contract_id, tour_name_snapshot, tour_date, status, cost_status)
  VALUES (v_item2_id, v_contract_id, 'Passeio Sem Vinculos Rascunho', CURRENT_DATE, 'agendado', 'pendente');

  INSERT INTO public.contract_items (id, contract_id, tour_name_snapshot, tour_date, status, voucher_ref, cost_status)
  VALUES (v_item3_id, v_contract_id, 'Passeio Com Voucher', CURRENT_DATE, 'agendado', 'VOUCH-TEST-' || substr(gen_random_uuid()::text, 1, 6), 'pendente');

  INSERT INTO public.contract_items (id, contract_id, tour_name_snapshot, tour_date, status, cost_applied, cost_status)
  VALUES (v_item4_id, v_finalized_contract_id, 'Passeio Contrato Finalizado', CURRENT_DATE, 'agendado', 400.00, 'calculado');

  -- 6. Exportação dos identificadores de teste para a sessão transacional
  PERFORM set_config('app.test_admin_user_id', v_admin_user_id::text, true);
  PERFORM set_config('app.test_seller_user_id', v_seller_user_id::text, true);
  PERFORM set_config('app.test_contract_id', v_contract_id::text, true);
  PERFORM set_config('app.test_finalized_contract_id', v_finalized_contract_id::text, true);
  PERFORM set_config('app.test_item1_id', v_item1_id::text, true);
  PERFORM set_config('app.test_item2_id', v_item2_id::text, true);
  PERFORM set_config('app.test_item3_id', v_item3_id::text, true);
  PERFORM set_config('app.test_item4_id', v_item4_id::text, true);

  RAISE NOTICE '✓ FASE 7.0 CONCLUÍDA: Dados de teste dinâmicos inicializados (Zero DELETE executado, Zero colisão).';
END $$;

-- =============================================================================
-- FASE 7.1: TESTES DE USUÁRIO ANÔNIMO (anon)
-- Mudança de papel executada no nível de instrução SQL
-- =============================================================================
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claims', '{"role": "anon"}', true);

-- Teste 7.1.1: anon bloqueado de consultar suppliers (deve lançar insufficient_privilege)
DO $$
DECLARE
  v_denied boolean := false;
  v_count int;
BEGIN
  BEGIN
    SELECT count(*) INTO v_count FROM public.suppliers;
  EXCEPTION WHEN insufficient_privilege THEN
    v_denied := true;
  END;

  IF NOT v_denied THEN
    RAISE EXCEPTION 'FALHA DE SEGURANÇA 7.1.1: anon conseguiu executar SELECT em suppliers sem lançar insufficient_privilege!';
  ELSE
    RAISE NOTICE '✓ TESTE 7.1.1 APROVADO: anon bloqueado em suppliers com insufficient_privilege comprovado.';
  END IF;
END $$;

-- Teste 7.1.2: anon bloqueado de consultar custos confidenciais (deve lançar insufficient_privilege)
DO $$
DECLARE
  v_denied boolean := false;
  v_count int;
BEGIN
  BEGIN
    SELECT count(*) INTO v_count FROM public.supplier_cost_options;
  EXCEPTION WHEN insufficient_privilege THEN
    v_denied := true;
  END;

  IF NOT v_denied THEN
    RAISE EXCEPTION 'FALHA DE SEGURANÇA 7.1.2: anon conseguiu executar SELECT em supplier_cost_options sem lançar insufficient_privilege!';
  ELSE
    RAISE NOTICE '✓ TESTE 7.1.2 APROVADO: anon bloqueado em supplier_cost_options com insufficient_privilege comprovado.';
  END IF;
END $$;

-- Teste 7.1.3: anon bloqueado de consultar contratos e itens (deve lançar insufficient_privilege)
DO $$
DECLARE
  v_denied boolean := false;
  v_count int;
BEGIN
  BEGIN
    SELECT count(*) INTO v_count FROM public.contracts;
  EXCEPTION WHEN insufficient_privilege THEN
    v_denied := true;
  END;

  IF NOT v_denied THEN
    RAISE EXCEPTION 'FALHA DE SEGURANÇA 7.1.3: anon conseguiu executar SELECT em contracts sem lançar insufficient_privilege!';
  ELSE
    RAISE NOTICE '✓ TESTE 7.1.3 APROVADO: anon bloqueado em contracts com insufficient_privilege comprovado.';
  END IF;
END $$;

-- Teste 7.1.4: anon bloqueado de executar funções de autorização e RPCs
DO $$
DECLARE
  v_denied boolean := false;
BEGIN
  BEGIN
    PERFORM public.is_admin();
  EXCEPTION WHEN insufficient_privilege THEN
    v_denied := true;
  END;

  IF NOT v_denied THEN
    RAISE EXCEPTION 'FALHA DE SEGURANÇA 7.1.4: anon conseguiu executar is_admin() sem insufficient_privilege!';
  ELSE
    RAISE NOTICE '✓ TESTE 7.1.4 APROVADO: anon bloqueado de executar funções de autorização com insufficient_privilege.';
  END IF;
END $$;

-- Teste 7.1.5: anon PERMITIDO de inserir leads (captura pública do site)
DO $$
DECLARE
  v_lead_email text;
  v_sqlstate text;
  v_sqlerrm text;
BEGIN
  v_lead_email := 'anon_test_' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSMS') || '_' || substr(gen_random_uuid()::text, 1, 6) || '@tionene.com';

  
  INSERT INTO public.leads (name, email, phone, notes, status)
  VALUES ('Lead Teste Anônimo', v_lead_email, '+5511999999999', 'Teste de captura', 'novo');
  
  RAISE NOTICE '✓ TESTE 7.1.5 APROVADO: anon possui permissão de INSERT em leads (captura de site ativa).';
EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS v_sqlstate = RETURNED_SQLSTATE, v_sqlerrm = MESSAGE_TEXT;
  RAISE EXCEPTION 'FALHA 7.1.5: Captura pública de leads falhou para anon (SQLSTATE %): %', v_sqlstate, v_sqlerrm;
END $$;

-- =============================================================================
-- FASE 7.2: TESTES DE VENDEDOR AUTENTICADO (Seller - papel 'authenticated' com role 'user' ou 'moderator')
-- Mudança de papel executada no nível de instrução SQL
-- =============================================================================
RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', current_setting('app.test_seller_user_id', true),
    'role', 'authenticated'
  )::text,
  true
);

-- Teste 7.2.1: RLS filtra custos confidenciais de fornecedores (deve retornar 0 linhas)
DO $$
DECLARE
  v_seller_costs_count int;
BEGIN
  SELECT count(*) INTO v_seller_costs_count FROM public.supplier_cost_options;
  IF v_seller_costs_count > 0 THEN
    RAISE EXCEPTION 'FALHA DE SEGURANÇA 7.2.1: Seller conseguiu visualizar % registros confidenciais de custos!', v_seller_costs_count;
  ELSE
    RAISE NOTICE '✓ TESTE 7.2.1 APROVADO: RLS ativo — Seller consulta supplier_cost_options e recebe 0 registros (confidencialidade garantida).';
  END IF;
END $$;

-- Teste 7.2.2: Acesso comercial legítimo a contratos (deve visualizar contratos existentes)
DO $$
DECLARE
  v_seller_contracts_count int;
BEGIN
  SELECT count(*) INTO v_seller_contracts_count FROM public.contracts;
  IF v_seller_contracts_count = 0 THEN
    RAISE EXCEPTION 'FALHA DE ACESSO 7.2.2: Seller não conseguiu visualizar contratos comerciais compartilhados!';
  ELSE
    RAISE NOTICE '✓ TESTE 7.2.2 APROVADO: Seller possui acesso comercial autorizado a contracts (% registros visíveis).', v_seller_contracts_count;
  END IF;
END $$;

-- Teste 7.2.3: Bloqueio de DELETE direto de contract_items por Seller (RLS sem política de DELETE para Seller)
DO $$
DECLARE
  v_test_item_id uuid;
  v_deleted_count int;
BEGIN
  v_test_item_id := current_setting('app.test_item2_id', true)::uuid;
  
  -- Como Seller não possui política de DELETE em contract_items, a instrução afeta 0 linhas
  DELETE FROM public.contract_items WHERE id = v_test_item_id;
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  IF v_deleted_count > 0 THEN
    RAISE EXCEPTION 'FALHA DE SEGURANÇA 7.2.3: Seller conseguiu executar DELETE direto em contract_items (% linhas excluídas)!', v_deleted_count;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.contract_items WHERE id = v_test_item_id) THEN
    RAISE EXCEPTION 'FALHA DE SEGURANÇA 7.2.3: O item não existe mais após tentativa de DELETE direto por Seller!';
  ELSE
    RAISE NOTICE '✓ TESTE 7.2.3 APROVADO: DELETE direto de contract_items por Seller bloqueado pelo RLS (0 linhas afetadas, item preservado).';
  END IF;
END $$;

-- Teste 7.2.4: Bloqueio de INSERT direto com custos por Seller (RLS WITH CHECK bloqueia custos e vouchers arbitrários)
DO $$
DECLARE
  v_contract_id uuid;
  v_insert_blocked boolean := false;
  v_sqlstate text;
  v_sqlerrm text;
BEGIN
  v_contract_id := current_setting('app.test_contract_id', true)::uuid;

  BEGIN
    INSERT INTO public.contract_items (
      contract_id, tour_name_snapshot, tour_date, cost_applied, calculated_total_cost, status
    )
    VALUES (
      v_contract_id, 'Passeio Manipulado Com Custo', CURRENT_DATE, 999.00, 999.00, 'agendado'
    );
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_sqlstate = RETURNED_SQLSTATE, v_sqlerrm = MESSAGE_TEXT;
    -- Valida que o erro é decorrente da proteção de segurança (RLS WITH CHECK ou Trigger de Integridade)
    -- e não de um erro genérico não relacionado
    IF v_sqlstate IN ('42501', '44000', 'P0001') 
       OR v_sqlerrm ILIKE '%row-level security%' 
       OR v_sqlerrm ILIKE '%Acesso negado%' 
       OR v_sqlerrm ILIKE '%custo%' THEN
      v_insert_blocked := true;
    ELSE
      RAISE EXCEPTION 'FALHA 7.2.4: Erro inesperado ao tentar inserir custos (não foi rejeição de segurança esperada): SQLSTATE %, Mensagem: %', v_sqlstate, v_sqlerrm;
    END IF;
  END;

  IF NOT v_insert_blocked THEN
    RAISE EXCEPTION 'FALHA DE SEGURANÇA 7.2.4: Seller conseguiu inserir custos arbitrários em contract_items via INSERT direto!';
  ELSE
    RAISE NOTICE '✓ TESTE 7.2.4 APROVADO: RLS / Trigger bloqueou INSERT direto de item com custos arbitrários por Seller (SQLSTATE %).', v_sqlstate;
  END IF;
END $$;

-- Teste 7.2.5: Bloqueio de UPDATE direto cancelando contrato por Seller
DO $$
DECLARE
  v_contract_id uuid;
  v_initial_status text;
  v_current_status text;
  v_rows_updated int := 0;
  v_rejected_by_security boolean := false;
  v_sqlstate text;
  v_sqlerrm text;
BEGIN
  v_contract_id := current_setting('app.test_contract_id', true)::uuid;

  -- 1. Confirmação prévia de visibilidade do contrato ativo para o Seller por SELECT
  SELECT status INTO v_initial_status 
  FROM public.contracts 
  WHERE id = v_contract_id;

  IF v_initial_status IS NULL THEN
    RAISE EXCEPTION 'FALHA DE PRÉ-CONDIÇÃO 7.2.5: Contrato ativo de teste (%) NÃO visível para Seller via SELECT.', v_contract_id;
  END IF;

  IF v_initial_status = 'cancelado' THEN
    RAISE EXCEPTION 'FALHA DE PRÉ-CONDIÇÃO 7.2.5: Contrato ativo de teste já se encontra com status cancelado antes do teste.';
  END IF;

  -- 2. Tentativa de cancelamento direto por UPDATE
  BEGIN
    UPDATE public.contracts 
    SET status = 'cancelado' 
    WHERE id = v_contract_id;

    GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_sqlstate = RETURNED_SQLSTATE, v_sqlerrm = MESSAGE_TEXT;
    -- Valida que o erro é rejeição do trigger de integridade ou RLS
    IF v_sqlstate IN ('42501', '44000', 'P0001') 
       OR v_sqlerrm ILIKE '%Acesso negado%' 
       OR v_sqlerrm ILIKE '%cancelamento%' 
       OR v_sqlerrm ILIKE '%row-level security%' THEN
      v_rejected_by_security := true;
    ELSE
      RAISE EXCEPTION 'FALHA 7.2.5: Erro inesperado ao tentar cancelar contrato (não foi rejeição de segurança esperada): SQLSTATE %, Mensagem: %', v_sqlstate, v_sqlerrm;
    END IF;
  END;

  -- 3. Verificação do estado pós-operação e diferenciação explícita
  SELECT status INTO v_current_status 
  FROM public.contracts 
  WHERE id = v_contract_id;

  IF v_current_status = 'cancelado' THEN
    -- Operação alterou o registro indevidamente
    RAISE EXCEPTION 'FALHA DE SEGURANÇA 7.2.5: Operação alterou o registro indevidamente! Seller conseguiu cancelar contrato via UPDATE direto (% linhas atualizadas).', v_rows_updated;
  ELSIF v_rejected_by_security THEN
    -- Operação rejeitada por RLS ou trigger
    IF v_current_status = v_initial_status THEN
      RAISE NOTICE '✓ TESTE 7.2.5 APROVADO: Operação rejeitada por trigger de integridade / RLS (SQLSTATE %, Mensagem: %). Contrato ativo preservado com status intacto (%).', v_sqlstate, v_sqlerrm, v_current_status;
    ELSE
      RAISE EXCEPTION 'FALHA DE INTEGRIDADE 7.2.5: Exceção foi capturada (%), mas o status mudou de % para %!', v_sqlerrm, v_initial_status, v_current_status;
    END IF;
  ELSIF v_rows_updated = 0 THEN
    -- Operação que afetou zero linhas (com visibilidade prévia comprovada por SELECT)
    IF v_current_status = v_initial_status THEN
      RAISE NOTICE '✓ TESTE 7.2.5 APROVADO: Operação afetou zero linhas (bloqueio RLS USING no UPDATE, registro pré-verificado preservado com status intacto: %).', v_current_status;
    ELSE
      RAISE EXCEPTION 'FALHA DE INTEGRIDADE 7.2.5: Zero linhas afetadas reportadas, mas o estado do contrato mudou de % para %!', v_initial_status, v_current_status;
    END IF;
  ELSE
    RAISE EXCEPTION 'FALHA DE SEGURANÇA 7.2.5: UPDATE afetou % linhas sem rejeição e deixou o contrato em estado desconhecido (status: %).', v_rows_updated, v_current_status;
  END IF;
END $$;

-- Teste 7.2.6: Bloqueio de UPDATE direto em contrato finalizado por Seller
DO $$
DECLARE
  v_finalized_contract_id uuid;
  v_initial_client_name text;
  v_initial_status text;
  v_attempted_client_name text;
  v_current_client_name text;
  v_current_status text;
  v_rows_updated int := 0;
  v_rejected_by_security boolean := false;
  v_sqlstate text;
  v_sqlerrm text;
BEGIN
  v_finalized_contract_id := current_setting('app.test_finalized_contract_id', true)::uuid;

  -- 1. Confirmação prévia de visibilidade do contrato finalizado para o Seller por SELECT
  SELECT client_name, status INTO v_initial_client_name, v_initial_status 
  FROM public.contracts 
  WHERE id = v_finalized_contract_id;

  IF v_initial_client_name IS NULL THEN
    RAISE EXCEPTION 'FALHA DE PRÉ-CONDIÇÃO 7.2.6: Contrato finalizado de teste (%) NÃO visível para Seller via SELECT.', v_finalized_contract_id;
  END IF;

  IF v_initial_status <> 'finalizado' THEN
    RAISE EXCEPTION 'FALHA DE PRÉ-CONDIÇÃO 7.2.6: Contrato de teste deveria ter status finalizado, mas está: %', v_initial_status;
  END IF;

  v_attempted_client_name := 'Nome Invasivo Tentativa ' || substr(gen_random_uuid()::text, 1, 6);

  -- 2. Tentativa de alteração direta em contrato finalizado
  BEGIN
    UPDATE public.contracts 
    SET client_name = v_attempted_client_name 
    WHERE id = v_finalized_contract_id;

    GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_sqlstate = RETURNED_SQLSTATE, v_sqlerrm = MESSAGE_TEXT;
    -- Valida que o erro é rejeição do trigger de integridade ou RLS
    IF v_sqlstate IN ('42501', '44000', 'P0001') 
       OR v_sqlerrm ILIKE '%Acesso negado%' 
       OR v_sqlerrm ILIKE '%finalizado%' 
       OR v_sqlerrm ILIKE '%row-level security%' THEN
      v_rejected_by_security := true;
    ELSE
      RAISE EXCEPTION 'FALHA 7.2.6: Erro inesperado ao tentar editar contrato finalizado: SQLSTATE %, Mensagem: %', v_sqlstate, v_sqlerrm;
    END IF;
  END;

  -- 3. Verificação do estado pós-operação e diferenciação explícita
  SELECT client_name, status INTO v_current_client_name, v_current_status 
  FROM public.contracts 
  WHERE id = v_finalized_contract_id;

  IF v_current_client_name = v_attempted_client_name THEN
    -- Operação alterou o registro indevidamente
    RAISE EXCEPTION 'FALHA DE SEGURANÇA 7.2.6: Operação alterou o registro indevidamente! Seller conseguiu modificar client_name de contrato finalizado (% linhas atualizadas).', v_rows_updated;
  ELSIF v_rejected_by_security THEN
    -- Operação rejeitada por RLS ou trigger
    IF v_current_client_name = v_initial_client_name AND v_current_status = 'finalizado' THEN
      RAISE NOTICE '✓ TESTE 7.2.6 APROVADO: Operação rejeitada por trigger de integridade / RLS (SQLSTATE %, Mensagem: %). Contrato finalizado preservado intacto (cliente: %).', v_sqlstate, v_sqlerrm, v_current_client_name;
    ELSE
      RAISE EXCEPTION 'FALHA DE INTEGRIDADE 7.2.6: Exceção foi capturada (%), mas os dados do contrato mudaram (cliente: %, status: %)!', v_sqlerrm, v_current_client_name, v_current_status;
    END IF;
  ELSIF v_rows_updated = 0 THEN
    -- Operação que afetou zero linhas (com visibilidade prévia comprovada por SELECT)
    IF v_current_client_name = v_initial_client_name AND v_current_status = 'finalizado' THEN
      RAISE NOTICE '✓ TESTE 7.2.6 APROVADO: Operação afetou zero linhas (bloqueio RLS USING no UPDATE, registro pré-verificado preservado intacto: %).', v_current_client_name;
    ELSE
      RAISE EXCEPTION 'FALHA DE INTEGRIDADE 7.2.6: Zero linhas afetadas reportadas, mas o estado do contrato mudou (cliente: %, status: %)!', v_current_client_name, v_current_status;
    END IF;
  ELSE
    RAISE EXCEPTION 'FALHA DE SEGURANÇA 7.2.6: UPDATE afetou % linhas sem rejeição e deixou o contrato finalizado em estado inconsistente.', v_rows_updated;
  END IF;
END $$;

-- Teste 7.2.7: Reconciliação Legítima via RPC autorizada (reconcile_contract_items)
DO $$
DECLARE
  v_contract_id uuid;
  v_item1_id uuid;
  v_item2_id uuid;
  v_item3_id uuid;
  v_rpc_result jsonb;
  v_item3_status text;
BEGIN
  v_contract_id := current_setting('app.test_contract_id', true)::uuid;
  v_item1_id := current_setting('app.test_item1_id', true)::uuid;
  v_item2_id := current_setting('app.test_item2_id', true)::uuid;
  v_item3_id := current_setting('app.test_item3_id', true)::uuid;

  -- Executa a reconciliação autorizada passando item 1 e novo item (omitindo item 2 e 3)
  v_rpc_result := public.reconcile_contract_items(
    v_contract_id,
    jsonb_build_array(
      jsonb_build_object(
        'id', v_item1_id::text,
        'tour_name_snapshot', 'Passeio Mantido Atualizado',
        'tour_date', CURRENT_DATE::text,
        'adults_count', 2,
        'sale_price', 700.00
      ),
      jsonb_build_object(
        'tour_name_snapshot', 'Novo Passeio Adicionado',
        'tour_date', (CURRENT_DATE + 1)::text,
        'adults_count', 1,
        'sale_price', 250.00
      )
    )
  );

  -- Valida retorno da RPC
  IF (v_rpc_result->>'updated')::int <> 1 THEN
    RAISE EXCEPTION 'FALHA 7.2.7: RPC deveria atualizar 1 item, retornou: %', v_rpc_result;
  END IF;
  IF (v_rpc_result->>'inserted')::int <> 1 THEN
    RAISE EXCEPTION 'FALHA 7.2.7: RPC deveria inserir 1 item, retornou: %', v_rpc_result;
  END IF;
  IF (v_rpc_result->>'deleted')::int <> 1 THEN
    RAISE EXCEPTION 'FALHA 7.2.7: RPC deveria excluir fisicamente 1 item sem vínculos, retornou: %', v_rpc_result;
  END IF;
  IF (v_rpc_result->>'canceled')::int <> 1 THEN
    RAISE EXCEPTION 'FALHA 7.2.7: RPC deveria preservar e cancelar logicamente 1 item com voucher, retornou: %', v_rpc_result;
  END IF;

  -- Valida estado no banco:
  -- Item 2 (sem vínculos) deve ter sido deletado
  IF EXISTS (SELECT 1 FROM public.contract_items WHERE id = v_item2_id) THEN
    RAISE EXCEPTION 'FALHA 7.2.7: Item 2 (sem vínculos) não foi excluído pela RPC!';
  END IF;

  -- Item 3 (com voucher) deve continuar existindo, com status = 'cancelado'
  SELECT status INTO v_item3_status FROM public.contract_items WHERE id = v_item3_id;
  IF v_item3_status <> 'cancelado' THEN
    RAISE EXCEPTION 'FALHA 7.2.7: Item 3 (com voucher) deveria ter status cancelado, está: %', v_item3_status;
  END IF;

  RAISE NOTICE '✓ TESTE 7.2.7 APROVADO: Reconciliação legítima via RPC executada com sucesso pelo Seller (unlinked deleted, linked canceled).';
END $$;

-- =============================================================================
-- FASE 7.3: TESTES DE ADMINISTRADOR AUTENTICADO (Admin - papel 'authenticated' com role 'admin')
-- Mudança de papel executada no nível de instrução SQL
-- =============================================================================
RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', current_setting('app.test_admin_user_id', true),
    'role', 'authenticated'
  )::text,
  true
);

-- Teste 7.3.1: Admin deve conseguir consultar custos e dados administrativos
DO $$
DECLARE
  v_admin_costs_count int;
BEGIN
  SELECT count(*) INTO v_admin_costs_count FROM public.supplier_cost_options;
  RAISE NOTICE '✓ TESTE 7.3.1 APROVADO: Admin autenticado consultou supplier_cost_options com sucesso (% registros lidos).', v_admin_costs_count;
END $$;

-- Teste 7.3.2: is_admin() deve retornar true
DO $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'FALHA 7.3.2: public.is_admin() retornou false para usuário com role = admin!';
  ELSE
    RAISE NOTICE '✓ TESTE 7.3.2 APROVADO: public.is_admin() confirmou autoridade de Admin.';
  END IF;
END $$;

-- Teste 7.3.3: Admin tem acesso ao financeiro (supplier_payments)
DO $$
DECLARE
  v_payments_count int;
BEGIN
  SELECT count(*) INTO v_payments_count FROM public.supplier_payments;
  RAISE NOTICE '✓ TESTE 7.3.3 APROVADO: Admin possui acesso financeiro a supplier_payments (% registros lidos).', v_payments_count;
END $$;

-- =============================================================================
-- FINALIZAÇÃO E REVERSÃO COMPLETA (ROLLBACK)
-- =============================================================================
RESET ROLE;
ROLLBACK;
-- Fim dos testes ativos tripartites (Sessão e dados 100% restaurados sem persistência residual)


