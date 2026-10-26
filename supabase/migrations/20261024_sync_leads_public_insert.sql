-- =============================================================================
-- TÍO NENÊ - SINCRONIZAÇÃO DE PERMISSÃO DE CAPTURA PÚBLICA DE LEADS
-- Arquivo: supabase/migrations/20261024_sync_leads_public_insert.sql
--
-- REGISTRO DE SINCRONIZAÇÃO DO REPOSITÓRIO COM O BANCO REMOTO:
-- ATENÇÃO: NÃO EXECUTAR ESTA MIGRATION REMOTAMENTE NESTA TAREFA.
-- O ajuste de permissão de INSERT para os papéis anon e authenticated com
-- política RLS WITH CHECK (true) já foi aplicado manualmente no Supabase.
-- Esta migration serve para manter a paridade formal e versionada do repositório.
-- =============================================================================

BEGIN;

-- 1. Garante que o papel pseudo-público (PUBLIC) e anônimos (anon) NÃO tenham
-- permissões excessivas ou acidentais de leitura, alteração ou exclusão
REVOKE ALL ON TABLE public.leads FROM anon;
REVOKE ALL ON TABLE public.curadoria_leads FROM anon;
REVOKE ALL ON TABLE public.partner_leads FROM anon;

REVOKE SELECT, UPDATE, DELETE ON TABLE public.leads FROM anon;
REVOKE SELECT, UPDATE, DELETE ON TABLE public.curadoria_leads FROM anon;
REVOKE SELECT, UPDATE, DELETE ON TABLE public.partner_leads FROM anon;

-- 2. Concede estritamente a permissão de INSERT aos papéis autorizados para captura pública e autenticada
GRANT INSERT ON TABLE public.leads TO anon, authenticated;
GRANT INSERT ON TABLE public.curadoria_leads TO anon, authenticated;
GRANT INSERT ON TABLE public.partner_leads TO anon, authenticated;

-- 3. Habilita RLS em todas as tabelas de captura pública
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curadoria_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_leads ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de INSERT destinadas explicitamente aos papéis anon e authenticated
DROP POLICY IF EXISTS "Public insert leads" ON public.leads;
CREATE POLICY "Public insert leads"
  ON public.leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public insert curadoria_leads" ON public.curadoria_leads;
CREATE POLICY "Public insert curadoria_leads"
  ON public.curadoria_leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public insert partner_leads" ON public.partner_leads;
CREATE POLICY "Public insert partner_leads"
  ON public.partner_leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

COMMIT;
