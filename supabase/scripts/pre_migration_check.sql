-- =============================================================================
-- TÍO NENÊ - SCRIPT DE PRÉ-VERIFICAÇÃO DIAGNÓSTICA (SOMENTE LEITURA)
-- Arquivo: supabase/scripts/pre_migration_check.sql
--
-- Executar no SQL Editor do Supabase ANTES de aplicar a migration RBAC.
-- Este script NÃO realiza nenhuma alteração nem expõe dados sensíveis.
-- =============================================================================

-- 1. Existência das Tabelas do Sistema e Status de RLS
SELECT 
  schemaname, 
  tablename, 
  rowsecurity AS rls_habilitado
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'suppliers', 'supplier_tours', 'supplier_cost_options', 
    'supplier_cost_audit_log', 'supplier_payments', 'supplier_payment_allocations',
    'contracts', 'contract_items', 'clients', 'hotels', 'user_roles', 
    'profiles', 'leads', 'curadoria_leads', 'partner_leads'
  )
ORDER BY tablename;

-- 2. Contagens Atuais de Registros (Baseline para verificar integridade após migração)
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

-- 3. Políticas RLS Existentes Atualmente
SELECT 
  tablename, 
  policyname, 
  cmd, 
  roles, 
  qual AS condicao_using,
  with_check AS condicao_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. Privilégios SQL Atuais nas Tabelas Principais (anon e authenticated)
SELECT 
  table_name, 
  grantee, 
  privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated')
  AND table_name IN (
    'suppliers', 'supplier_cost_options', 'supplier_payments',
    'contracts', 'contract_items', 'clients', 'hotels', 'user_roles'
  )
ORDER BY table_name, grantee, privilege_type;

-- 5. Distribuição Agregada de Papéis de Usuários (sem expor UUIDs ou e-mails)
SELECT 
  role::text AS papel, 
  count(*) AS quantidade_usuarios
FROM public.user_roles
GROUP BY role
ORDER BY papel;

-- 6. Verificação de Funções de Autorização Existentes
SELECT 
  routine_name, 
  routine_type, 
  security_type,
  data_type AS tipo_retorno
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('is_admin', 'get_user_role', 'has_role', 'reconcile_contract_items', 'save_contract_with_items');
