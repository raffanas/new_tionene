-- =============================================================================
-- TÍO NENÊ - PROCEDIMENTO DE RECUPERAÇÃO EM BASELINE CONTROLADO (ROLLBACK SEGURO)
-- Arquivo: supabase/scripts/rollback_security_policies.sql
--
-- ATENÇÃO E ESCLARECIMENTO DE ESCOPO:
-- 1. Este script NÃO representa uma restauração ingênua do estado pré-migração, pois o estado
--    legado continha vulnerabilidades críticas (políticas USING true que expunham custos a anônimos).
-- 2. Este script aplica um BASELINE OPERACIONAL SEGURO DE RECUPERAÇÃO, projetado para
--    restabelecer a operação comercial legítima da equipe sem comprometer a confidencialidade financeira.
-- 3. LIMITAÇÕES REAIS DA RECUPERAÇÃO (BASELINE CONTROLADO):
--    a) Custos de fornecedores e contas a pagar PERMANECEM ESTRITAMENTE ADMIN-ONLY (não são reabertos para Seller ou anon).
--    b) Exclusão direta de contract_items por vendedores NÃO É REABERTA (apenas Admin possui política DELETE).
--    c) As RPCs save_contract_with_items e reconcile_contract_items SÃO PRESERVADAS para manter o módulo comercial funcional.
--    d) Os triggers trg_protect_contracts e trg_protect_contract_items SÃO PRESERVADOS para impedir corrupção de status e perda de vínculos.
--    e) Inserção e atualização direta de contratos e itens permanecem protegidas contra cancelamentos e injeção de custos por não-admin.
--    f) Para restauração literal de definições legadas se exigido por auditoria, consulte o snapshot do
--       script supabase/scripts/pre_migration_check.sql.
-- 4. O script é 100% transacional: executa dentro de BEGIN ... COMMIT.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. REMOÇÃO DE POLÍTICAS DA MIGRATION RBAC V0.1.43 (E DE BASELINES ANTERIORES)l
-- -----------------------------------------------------------------------------

-- 1.0 Preservação de Integridade e RPCs Operacionais
-- As funções save_contract_with_items, reconcile_contract_items, check_contracts_integrity
-- e check_contract_items_integrity, bem como seus triggers, são PRESERVADAS intactas
-- para garantir a continuidade operacional das vendas e a integridade referencial.

-- 1.1 contracts
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

-- 1.2 contract_items
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

-- 1.3 clients
DROP POLICY IF EXISTS "Staff select clients" ON public.clients;
DROP POLICY IF EXISTS "Staff insert clients" ON public.clients;
DROP POLICY IF EXISTS "Staff update clients" ON public.clients;
DROP POLICY IF EXISTS "Admin delete clients" ON public.clients;
DROP POLICY IF EXISTS "Team manage clients baseline" ON public.clients;
DROP POLICY IF EXISTS "Team manage clients recovery" ON public.clients;
DROP POLICY IF EXISTS "Staff select clients recovery" ON public.clients;
DROP POLICY IF EXISTS "Staff insert clients recovery" ON public.clients;
DROP POLICY IF EXISTS "Staff update clients recovery" ON public.clients;
DROP POLICY IF EXISTS "Admin delete clients recovery" ON public.clients;

-- 1.4 suppliers
DROP POLICY IF EXISTS "Authenticated read suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Admin manage suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Team manage suppliers baseline" ON public.suppliers;
DROP POLICY IF EXISTS "Team manage suppliers recovery" ON public.suppliers;

-- 1.5 supplier_tours (Custos de Passeios - Admin Only)
DROP POLICY IF EXISTS "Admin select supplier_tours" ON public.supplier_tours;
DROP POLICY IF EXISTS "Admin manage supplier_tours" ON public.supplier_tours;
DROP POLICY IF EXISTS "Team read supplier_tours baseline" ON public.supplier_tours;
DROP POLICY IF EXISTS "Team read supplier_tours recovery" ON public.supplier_tours;

-- 1.6 supplier_cost_options (Catálogo de Custos - Admin Only)
DROP POLICY IF EXISTS "Admin select supplier_cost_options" ON public.supplier_cost_options;
DROP POLICY IF EXISTS "Admin manage supplier_cost_options" ON public.supplier_cost_options;
DROP POLICY IF EXISTS "Team read supplier_costs baseline" ON public.supplier_cost_options;
DROP POLICY IF EXISTS "Team read supplier_costs recovery" ON public.supplier_cost_options;

-- 1.7 supplier_cost_audit_log (Auditoria de Custos - Admin Only)
DROP POLICY IF EXISTS "Admin select supplier_cost_audit_log" ON public.supplier_cost_audit_log;
DROP POLICY IF EXISTS "Admin manage supplier_cost_audit_log" ON public.supplier_cost_audit_log;

-- 1.8 supplier_payments e supplier_payment_allocations (Financeiro - Admin Only)
DROP POLICY IF EXISTS "Admin select supplier_payments" ON public.supplier_payments;
DROP POLICY IF EXISTS "Admin manage supplier_payments" ON public.supplier_payments;
DROP POLICY IF EXISTS "Admin select supplier_payment_allocations" ON public.supplier_payment_allocations;
DROP POLICY IF EXISTS "Admin manage supplier_payment_allocations" ON public.supplier_payment_allocations;

-- 1.9 hotels
DROP POLICY IF EXISTS "Allow authenticated users to read hotels" ON public.hotels;
DROP POLICY IF EXISTS "Admin modify hotels" ON public.hotels;
DROP POLICY IF EXISTS "Team read hotels baseline" ON public.hotels;
DROP POLICY IF EXISTS "Team read hotels recovery" ON public.hotels;

-- 1.10 user_roles
DROP POLICY IF EXISTS "Users can read own role or admin reads all" ON public.user_roles;
DROP POLICY IF EXISTS "Only admin can modify user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users read own role baseline" ON public.user_roles;
DROP POLICY IF EXISTS "Users read own role recovery" ON public.user_roles;

-- 1.11 profiles
DROP POLICY IF EXISTS "Authenticated users can view team profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile or admin updates any" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile or admin inserts any" ON public.profiles;

-- 1.12 leads, curadoria_leads, partner_leads
DROP POLICY IF EXISTS "Staff select leads" ON public.leads;
DROP POLICY IF EXISTS "Staff update leads" ON public.leads;
DROP POLICY IF EXISTS "Admin delete leads" ON public.leads;
DROP POLICY IF EXISTS "Team manage leads baseline" ON public.leads;
DROP POLICY IF EXISTS "Staff select curadoria_leads" ON public.curadoria_leads;
DROP POLICY IF EXISTS "Staff update curadoria_leads" ON public.curadoria_leads;
DROP POLICY IF EXISTS "Admin delete curadoria_leads" ON public.curadoria_leads;
DROP POLICY IF EXISTS "Staff select partner_leads" ON public.partner_leads;
DROP POLICY IF EXISTS "Staff update partner_leads" ON public.partner_leads;
DROP POLICY IF EXISTS "Admin delete partner_leads" ON public.partner_leads;

-- -----------------------------------------------------------------------------
-- 2. RESTAURAÇÃO DO BASELINE OPERACIONAL SEGURO (SEM VAZAMENTOS A SELLER OU ANON)
-- -----------------------------------------------------------------------------

-- 2.1 CUSTOS E PAGAMENTOS DE FORNECEDORES: ISOLAMENTO TOTAL AO ADMIN
-- Garantia de que vendedores (Seller) NÃO tenham acesso a custos ou pagamentos.
CREATE POLICY "Admin select supplier_tours recovery"
  ON public.supplier_tours FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admin manage supplier_tours recovery"
  ON public.supplier_tours FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admin select supplier_cost_options recovery"
  ON public.supplier_cost_options FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admin manage supplier_cost_options recovery"
  ON public.supplier_cost_options FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admin select supplier_cost_audit_log recovery"
  ON public.supplier_cost_audit_log FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admin manage supplier_cost_audit_log recovery"
  ON public.supplier_cost_audit_log FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admin select supplier_payments recovery"
  ON public.supplier_payments FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admin manage supplier_payments recovery"
  ON public.supplier_payments FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admin select supplier_payment_allocations recovery"
  ON public.supplier_payment_allocations FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admin manage supplier_payment_allocations recovery"
  ON public.supplier_payment_allocations FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 2.2 FORNECEDORES LOCAIS: Leitura da equipe, gestão exclusiva de Admin
CREATE POLICY "Team read suppliers recovery"
  ON public.suppliers FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin manage suppliers recovery"
  ON public.suppliers FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 2.3 CONTRATOS E CLIENTES: Gestão comercial compartilhada, exclusão exclusiva de Admin
CREATE POLICY "Staff select contracts recovery"
  ON public.contracts FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Staff insert contracts recovery"
  ON public.contracts FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND (public.is_admin() OR status NOT IN ('cancelado', 'finalizado', 'concluido')));

CREATE POLICY "Staff update contracts recovery"
  ON public.contracts FOR UPDATE
  USING (auth.role() = 'authenticated' AND (public.is_admin() OR status NOT IN ('cancelado', 'finalizado', 'concluido')))
  WITH CHECK (auth.role() = 'authenticated' AND (public.is_admin() OR status NOT IN ('cancelado', 'finalizado', 'concluido')));

CREATE POLICY "Admin delete contracts recovery"
  ON public.contracts FOR DELETE
  USING (public.is_admin());

CREATE POLICY "Staff select contract_items recovery"
  ON public.contract_items FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Staff insert contract_items recovery"
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

CREATE POLICY "Staff update contract_items recovery"
  ON public.contract_items FOR UPDATE
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- SEGURANÇA ESTRITA: Exclusão direta de itens é restrita a Administrador
-- (Sellers nunca possuem política de DELETE direto em contract_items)
CREATE POLICY "Admin delete contract_items recovery"
  ON public.contract_items FOR DELETE
  USING (public.is_admin());

CREATE POLICY "Staff select clients recovery"
  ON public.clients FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Staff insert clients recovery"
  ON public.clients FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Staff update clients recovery"
  ON public.clients FOR UPDATE
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin delete clients recovery"
  ON public.clients FOR DELETE
  USING (public.is_admin());

-- 2.4 HOTÉIS: Leitura da equipe, escrita de Admin
CREATE POLICY "Team read hotels recovery"
  ON public.hotels FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin manage hotels recovery"
  ON public.hotels FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 2.5 USER_ROLES E PROFILES
CREATE POLICY "Users read own role recovery"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admin manage user_roles recovery"
  ON public.user_roles FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Team read profiles recovery"
  ON public.profiles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users update own profile recovery"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin()) WITH CHECK (auth.uid() = id OR public.is_admin());

-- 2.6 LEADS: Captura pública anônima intacta, gestão da equipe
DROP POLICY IF EXISTS "Public insert leads" ON public.leads;
DROP POLICY IF EXISTS "Public insert curadoria_leads" ON public.curadoria_leads;
DROP POLICY IF EXISTS "Public insert partner_leads" ON public.partner_leads;

CREATE POLICY "Public insert leads" ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff select leads recovery" ON public.leads FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Staff update leads recovery" ON public.leads FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admin delete leads recovery" ON public.leads FOR DELETE USING (public.is_admin());

CREATE POLICY "Public insert curadoria_leads" ON public.curadoria_leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff select curadoria_leads recovery" ON public.curadoria_leads FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Staff update curadoria_leads recovery" ON public.curadoria_leads FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admin delete curadoria_leads recovery" ON public.curadoria_leads FOR DELETE USING (public.is_admin());

CREATE POLICY "Public insert partner_leads" ON public.partner_leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff select partner_leads recovery" ON public.partner_leads FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Staff update partner_leads recovery" ON public.partner_leads FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admin delete partner_leads recovery" ON public.partner_leads FOR DELETE USING (public.is_admin());

COMMIT;
