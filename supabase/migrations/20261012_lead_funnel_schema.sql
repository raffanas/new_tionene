-- =============================================================================
-- TIO NENÊ - TABELA DE LEADS (CAPTURADOS PELO SITE ANTES DO WHATSAPP)
-- Execute este script no SQL Editor do Supabase se ainda não criou a tabela leads.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  source TEXT DEFAULT 'site_tour', -- 'site_tour', 'site_package', 'quiz', 'direto'
  interest_type TEXT DEFAULT 'tour', -- 'tour', 'package', 'geral'
  interest_name TEXT, -- Nome do passeio ou pacote
  interest_slug TEXT,
  selected_items JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  status TEXT DEFAULT 'novo', -- 'novo', 'em_atendimento', 'convertido', 'perdido'
  converted_client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS na tabela leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Permitir que visitantes do site insiram seus dados anonimamente pelo formulário
DROP POLICY IF EXISTS "Public insert leads" ON public.leads;
CREATE POLICY "Public insert leads" ON public.leads FOR INSERT WITH CHECK (true);

-- Permitir leitura completa para o painel administrativo
DROP POLICY IF EXISTS "Admin select leads" ON public.leads;
CREATE POLICY "Admin select leads" ON public.leads FOR SELECT USING (true);

-- Permitir atualização e deleção pelo painel administrativo
DROP POLICY IF EXISTS "Admin update leads" ON public.leads;
CREATE POLICY "Admin update leads" ON public.leads FOR ALL USING (true);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at);
