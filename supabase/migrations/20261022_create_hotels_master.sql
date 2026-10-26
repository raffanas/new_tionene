-- =============================================================================
-- MIGRAÇÃO DEFINITIVA: BASE MESTRE DE HOTÉIS — TÍO NENÊ v0.1.43
-- Arquivo: supabase/migrations/20261022_create_hotels_master.sql
-- Fonte Oficial: Ultimate_Tio_Nene_Hotels_Two_Columns.xlsx (1.125 hotéis, 8 zonas)
-- Requisitos Atendidos: V38-001, QC42-001, QC42-002, QC42-003, CON-003, ARR-002,
--                       RES-020, TRF-002, TRF-003, SC-005, SC-015, SC-032, SC-184
-- =============================================================================

-- 1. Verificação Prévia de Incompatibilidade de Schema (Evitar mascaramento por IF NOT EXISTS)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'hotels'
    ) THEN
        -- Verificar se as colunas essenciais existem na tabela pré-existente
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'hotels' AND column_name = 'zone'
        ) OR NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'hotels' AND column_name = 'name'
        ) THEN
            RAISE EXCEPTION 'INCOMPATIBILIDADE DETECTADA: A tabela public.hotels já existe no banco mas não possui as colunas obrigatórias (name, zone). A migração foi cancelada para evitar corrupção.';
        END IF;
    END IF;
END $$;

-- 2. Criação da Tabela Mestre de Hotéis
CREATE TABLE IF NOT EXISTS public.hotels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    zone TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Restrição de Unicidade de Nome (QC42-001 / SC-184)
    CONSTRAINT hotels_name_unique UNIQUE (name),

    -- Restrição Estrita das 8 Zonas Canônicas Oficiais (QC42-002)
    CONSTRAINT hotels_zone_check CHECK (zone IN (
        'Puerto Juarez',
        'Isla Blanca',
        'Cancun Center',
        'Cancun Hotel Zone',
        'Maya Riviera',
        'Playa del Carmen',
        'Tulum Center',
        'Tulum Hotel Zone'
    ))
);

-- Garantir que as constraints obrigatórias existam mesmo se a tabela já existia sem elas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'hotels_name_unique'
    ) THEN
        ALTER TABLE public.hotels ADD CONSTRAINT hotels_name_unique UNIQUE (name);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'hotels_zone_check'
    ) THEN
        ALTER TABLE public.hotels ADD CONSTRAINT hotels_zone_check CHECK (zone IN (
            'Puerto Juarez',
            'Isla Blanca',
            'Cancun Center',
            'Cancun Hotel Zone',
            'Maya Riviera',
            'Playa del Carmen',
            'Tulum Center',
            'Tulum Hotel Zone'
        ));
    END IF;
END $$;

-- Comentários Descritivos de Arquitetura
COMMENT ON TABLE public.hotels IS 'Catálogo mestre dos 1.125 hotéis oficiais da Tío Nenê em Cancún e Riviera Maya (v0.1.43).';
COMMENT ON COLUMN public.hotels.name IS 'Nome oficial do estabelecimento comercial. Não mesclar com hotéis similares.';
COMMENT ON COLUMN public.hotels.zone IS 'Zona geográfica canônica oficial da agência. Preservada mesmo sob overrides de fornecedores.';
COMMENT ON COLUMN public.hotels.active IS 'Flag de ativação. Hotéis desativados são marcados como false em vez de excluídos fisicamente.';

-- 2. Índices de Otimização para Consultas e Autocompletar
CREATE INDEX IF NOT EXISTS idx_hotels_zone ON public.hotels(zone);
CREATE INDEX IF NOT EXISTS idx_hotels_active ON public.hotels(active);
CREATE INDEX IF NOT EXISTS idx_hotels_name_lower ON public.hotels (lower(name));

-- 3. Função e Trigger para Atualização Automática de updated_at
CREATE OR REPLACE FUNCTION public.update_hotels_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_hotels_timestamp ON public.hotels;
CREATE TRIGGER trigger_hotels_timestamp
BEFORE UPDATE ON public.hotels
FOR EACH ROW
EXECUTE FUNCTION public.update_hotels_timestamp();

-- 4. Políticas de Segurança (Row Level Security - RLS)
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;

-- Limpar quaisquer políticas anteriores para garantir idempotência da migração
DROP POLICY IF EXISTS "Allow authenticated read hotels" ON public.hotels;
DROP POLICY IF EXISTS "Allow anon read active hotels" ON public.hotels;
DROP POLICY IF EXISTS "Allow admin write hotels" ON public.hotels;
DROP POLICY IF EXISTS "Allow service_role manage hotels" ON public.hotels;

-- POLÍTICA 1: LEITURA RESTRITA A USUÁRIOS AUTENTICADOS (Sellers e Admins)
-- O catálogo de hotéis é de uso exclusivamente operacional no backoffice
-- (emissão de contratos, estadias e itinerários). Leitura anônima pública foi
-- removida por não ser necessária nesta fase de backoffice.
CREATE POLICY "Allow authenticated read hotels"
ON public.hotels
FOR SELECT
TO authenticated
USING (true);

-- POLÍTICA 2: ESCRITA EXCLUSIVA PARA CREDENCIAL ADMINISTRATIVA DE SERVIDOR (service_role)
-- Bloqueio total de escrita pelo cliente frontend (anon e authenticated padrão).
-- Jamais confia em 'user_metadata' (editável pelo próprio usuário via cliente).
-- Operações de carga inicial, importações e manutenções cadastrais devem ser
-- executadas via scripts de servidor autenticados com service_role ou por
-- Server Actions autenticadas quando o RBAC definitivo for estabelecido.
CREATE POLICY "Allow service_role manage hotels"
ON public.hotels
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =============================================================================
-- Fim da Migração: 20261022_create_hotels_master.sql
-- =============================================================================
