-- =============================================================================
-- TÍO NENÊ - CARGA OFICIAL DE DADOS: CATÁLOGO COMERCIAL E TARIFAS (v0.1.43)
-- Arquivo: supabase/scripts/seed_official_catalog_v0143.sql
--
-- ATENÇÃO: NÃO EXECUTAR ESTE SCRIPT REMOTAMENTE NESTA TAREFA.
-- Script idempotente para carga inicial/sincronização do catálogo oficial v0.1.43.
-- Preserva alterações manuais (ON CONFLICT DO NOTHING) e nunca converte NULL para zero.
-- Total: 52 produtos comerciais, 80 tarifas operacionais, 8 zonas e 6 temporadas.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. CARGA DOS 52 PRODUTOS COMERCIAIS (public.commercial_products)
-- -----------------------------------------------------------------------------
INSERT INTO public.commercial_products (
  tour_id, provider, provider_code, supplier_id, supplier_product_name,
  display_name, product_type, product_subtype, seller_visible, status,
  pricing_model_default, requires_ancillary_booking, ancillary_notes
) VALUES (
  'BAK-001',
  'Baktun',
  'BAK',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Baktun'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Baktun'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('BAK' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('BAK' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('BAK' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('BAK' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('BAK' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('BAK' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('BAK' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('BAK' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('BAK' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('BAK' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'BAK' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'BAK' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'BAK' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'BAK' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Baktun')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Chichén Itzá Clássico',
  'Chichén Itzá Clássico',
  'Tour',
  NULL,
  true,
  'Active',
  'Person',
  false,
  NULL
) ON CONFLICT (tour_id) DO NOTHING;

INSERT INTO public.commercial_products (
  tour_id, provider, provider_code, supplier_id, supplier_product_name,
  display_name, product_type, product_subtype, seller_visible, status,
  pricing_model_default, requires_ancillary_booking, ancillary_notes
) VALUES (
  'BAK-002',
  'Baktun',
  'BAK',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Baktun'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Baktun'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('BAK' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('BAK' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('BAK' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('BAK' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('BAK' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('BAK' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('BAK' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('BAK' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('BAK' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('BAK' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'BAK' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'BAK' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'BAK' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'BAK' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Baktun')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Chichén Itzá Deluxe',
  'Chichén Itzá Deluxe',
  'Tour',
  NULL,
  true,
  'Active',
  'Person',
  false,
  NULL
) ON CONFLICT (tour_id) DO NOTHING;

INSERT INTO public.commercial_products (
  tour_id, provider, provider_code, supplier_id, supplier_product_name,
  display_name, product_type, product_subtype, seller_visible, status,
  pricing_model_default, requires_ancillary_booking, ancillary_notes
) VALUES (
  'BAK-003',
  'Baktun',
  'BAK',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Baktun'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Baktun'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('BAK' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('BAK' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('BAK' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('BAK' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('BAK' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('BAK' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('BAK' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('BAK' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('BAK' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('BAK' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'BAK' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'BAK' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'BAK' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'BAK' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Baktun')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Chichén Itzá 2 Cenotes',
  'Chichén Itzá 2 Cenotes',
  'Tour',
  NULL,
  true,
  'Active',
  'Person',
  false,
  NULL
) ON CONFLICT (tour_id) DO NOTHING;

INSERT INTO public.commercial_products (
  tour_id, provider, provider_code, supplier_id, supplier_product_name,
  display_name, product_type, product_subtype, seller_visible, status,
  pricing_model_default, requires_ancillary_booking, ancillary_notes
) VALUES (
  'COC-001',
  'Coco Bongo',
  'COC',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Coco Bongo'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Coco Bongo'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('COC' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('COC' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('COC' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('COC' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('COC' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('COC' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('COC' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('COC' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('COC' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('COC' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'COC' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'COC' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'COC' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'COC' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Coco Bongo')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Coco Bongo Drink Pack',
  'Coco Bongo Drink Pack',
  'Activity',
  'Nightclub Ticket',
  true,
  'Active',
  'Person',
  false,
  NULL
) ON CONFLICT (tour_id) DO NOTHING;

INSERT INTO public.commercial_products (
  tour_id, provider, provider_code, supplier_id, supplier_product_name,
  display_name, product_type, product_subtype, seller_visible, status,
  pricing_model_default, requires_ancillary_booking, ancillary_notes
) VALUES (
  'COC-002',
  'Coco Bongo',
  'COC',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Coco Bongo'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Coco Bongo'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('COC' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('COC' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('COC' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('COC' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('COC' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('COC' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('COC' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('COC' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('COC' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('COC' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'COC' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'COC' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'COC' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'COC' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Coco Bongo')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Coco Bongo Regular',
  'Coco Bongo Regular',
  'Activity',
  'Nightclub Ticket',
  true,
  'Active',
  'Person',
  false,
  NULL
) ON CONFLICT (tour_id) DO NOTHING;

INSERT INTO public.commercial_products (
  tour_id, provider, provider_code, supplier_id, supplier_product_name,
  display_name, product_type, product_subtype, seller_visible, status,
  pricing_model_default, requires_ancillary_booking, ancillary_notes
) VALUES (
  'COC-003',
  'Coco Bongo',
  'COC',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Coco Bongo'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Coco Bongo'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('COC' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('COC' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('COC' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('COC' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('COC' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('COC' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('COC' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('COC' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('COC' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('COC' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'COC' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'COC' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'COC' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'COC' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Coco Bongo')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Coco Bongo Premium',
  'Coco Bongo Premium',
  'Activity',
  'Nightclub Ticket',
  true,
  'Active',
  'Person',
  false,
  NULL
) ON CONFLICT (tour_id) DO NOTHING;

INSERT INTO public.commercial_products (
  tour_id, provider, provider_code, supplier_id, supplier_product_name,
  display_name, product_type, product_subtype, seller_visible, status,
  pricing_model_default, requires_ancillary_booking, ancillary_notes
) VALUES (
  'COC-004',
  'Coco Bongo',
  'COC',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Coco Bongo'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Coco Bongo'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('COC' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('COC' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('COC' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('COC' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('COC' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('COC' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('COC' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('COC' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('COC' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('COC' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'COC' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'COC' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'COC' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'COC' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Coco Bongo')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Coco Bongo Royal Service',
  'Coco Bongo Royal Service',
  'Activity',
  'Nightclub Ticket',
  true,
  'Active',
  'Person',
  false,
  NULL
) ON CONFLICT (tour_id) DO NOTHING;

INSERT INTO public.commercial_products (
  tour_id, provider, provider_code, supplier_id, supplier_product_name,
  display_name, product_type, product_subtype, seller_visible, status,
  pricing_model_default, requires_ancillary_booking, ancillary_notes
) VALUES (
  'COC-005',
  'Coco Bongo',
  'COC',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Coco Bongo'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Coco Bongo'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('COC' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('COC' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('COC' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('COC' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('COC' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('COC' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('COC' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('COC' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('COC' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('COC' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'COC' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'COC' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'COC' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'COC' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Coco Bongo')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Coco Bongo Gold Member',
  'Coco Bongo Gold Member',
  'Activity',
  'Nightclub Ticket',
  true,
  'Active',
  'Person',
  false,
  NULL
) ON CONFLICT (tour_id) DO NOTHING;

INSERT INTO public.commercial_products (
  tour_id, provider, provider_code, supplier_id, supplier_product_name,
  display_name, product_type, product_subtype, seller_visible, status,
  pricing_model_default, requires_ancillary_booking, ancillary_notes
) VALUES (
  'COC-006',
  'Coco Bongo',
  'COC',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Coco Bongo'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Coco Bongo'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('COC' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('COC' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('COC' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('COC' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('COC' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('COC' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('COC' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('COC' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('COC' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('COC' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'COC' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'COC' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'COC' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'COC' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Coco Bongo')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Coco Bongo Front Row',
  'Coco Bongo Front Row',
  'Activity',
  'Nightclub Ticket',
  true,
  'Active',
  'Person',
  false,
  NULL
) ON CONFLICT (tour_id) DO NOTHING;

INSERT INTO public.commercial_products (
  tour_id, provider, provider_code, supplier_id, supplier_product_name,
  display_name, product_type, product_subtype, seller_visible, status,
  pricing_model_default, requires_ancillary_booking, ancillary_notes
) VALUES (
  'ENV-001',
  'Envatours',
  'ENV',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Envatours'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Envatours'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('ENV' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('ENV' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('ENV' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('ENV' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('ENV' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('ENV' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('ENV' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('ENV' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('ENV' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('ENV' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'ENV' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'ENV' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'ENV' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'ENV' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Envatours')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Barco de Vidro – Bajo el Mar Cozumel (Coletivo)',
  'Barco de Vidro – Bajo el Mar Cozumel',
  'Tour',
  'Shared Boat',
  true,
  'Active',
  'Person',
  false,
  NULL
) ON CONFLICT (tour_id) DO NOTHING;

INSERT INTO public.commercial_products (
  tour_id, provider, provider_code, supplier_id, supplier_product_name,
  display_name, product_type, product_subtype, seller_visible, status,
  pricing_model_default, requires_ancillary_booking, ancillary_notes
) VALUES (
  'ENV-002',
  'Envatours',
  'ENV',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Envatours'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Envatours'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('ENV' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('ENV' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('ENV' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('ENV' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('ENV' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('ENV' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('ENV' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('ENV' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('ENV' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('ENV' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'ENV' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'ENV' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'ENV' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'ENV' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Envatours')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Barco de Vidro – Bajo el Mar Cozumel (Privado 10 pax)',
  'Barco de Vidro – Bajo el Mar Cozumel (Privado 10 pax)',
  'Tour',
  'Private Boat',
  true,
  'Active',
  'Person',
  false,
  NULL
) ON CONFLICT (tour_id) DO NOTHING;

INSERT INTO public.commercial_products (
  tour_id, provider, provider_code, supplier_id, supplier_product_name,
  display_name, product_type, product_subtype, seller_visible, status,
  pricing_model_default, requires_ancillary_booking, ancillary_notes
) VALUES (
  'ENV-003',
  'Envatours',
  'ENV',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Envatours'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Envatours'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('ENV' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('ENV' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('ENV' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('ENV' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('ENV' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('ENV' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('ENV' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('ENV' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('ENV' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('ENV' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'ENV' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'ENV' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'ENV' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'ENV' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Envatours')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Barco de Vidro – Colores de Cancún (Coletivo)',
  'Barco de Vidro – Colores de Cancún',
  'Tour',
  'Shared Boat',
  true,
  'Active',
  'Person',
  false,
  NULL
) ON CONFLICT (tour_id) DO NOTHING;

INSERT INTO public.commercial_products (
  tour_id, provider, provider_code, supplier_id, supplier_product_name,
  display_name, product_type, product_subtype, seller_visible, status,
  pricing_model_default, requires_ancillary_booking, ancillary_notes
) VALUES (
  'ENV-004',
  'Envatours',
  'ENV',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Envatours'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Envatours'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('ENV' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('ENV' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('ENV' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('ENV' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('ENV' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('ENV' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('ENV' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('ENV' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('ENV' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('ENV' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'ENV' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'ENV' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'ENV' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'ENV' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Envatours')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Barco de Vidro – Colores de Cancún (Privado 10pax)',
  'Barco de Vidro – Colores de Cancún (Privado 10pax)',
  'Tour',
  'Private Boat',
  true,
  'Active',
  'Person',
  false,
  NULL
) ON CONFLICT (tour_id) DO NOTHING;

INSERT INTO public.commercial_products (
  tour_id, provider, provider_code, supplier_id, supplier_product_name,
  display_name, product_type, product_subtype, seller_visible, status,
  pricing_model_default, requires_ancillary_booking, ancillary_notes
) VALUES (
  'ENV-005',
  'Envatours',
  'ENV',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Envatours'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Envatours'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('ENV' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('ENV' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('ENV' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('ENV' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('ENV' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('ENV' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('ENV' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('ENV' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('ENV' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('ENV' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'ENV' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'ENV' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'ENV' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'ENV' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Envatours')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Barco de Vidro – Tour Isla Mujeres (Coletivo)',
  'Barco de Vidro – Tour Isla Mujeres',
  'Tour',
  'Shared Boat',
  true,
  'Active',
  'Person',
  false,
  NULL
) ON CONFLICT (tour_id) DO NOTHING;

INSERT INTO public.commercial_products (
  tour_id, provider, provider_code, supplier_id, supplier_product_name,
  display_name, product_type, product_subtype, seller_visible, status,
  pricing_model_default, requires_ancillary_booking, ancillary_notes
) VALUES (
  'ENV-006',
  'Envatours',
  'ENV',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Envatours'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Envatours'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('ENV' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('ENV' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('ENV' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('ENV' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('ENV' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('ENV' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('ENV' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('ENV' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('ENV' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('ENV' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'ENV' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'ENV' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'ENV' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'ENV' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Envatours')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Barco de Vidro – Tour Isla Mujeres (Privado 10 pax)',
  'Barco de Vidro – Tour Isla Mujeres (Privado 10 pax)',
  'Tour',
  'Private Boat',
  true,
  'Active',
  'Person',
  false,
  NULL
) ON CONFLICT (tour_id) DO NOTHING;

INSERT INTO public.commercial_products (
  tour_id, provider, provider_code, supplier_id, supplier_product_name,
  display_name, product_type, product_subtype, seller_visible, status,
  pricing_model_default, requires_ancillary_booking, ancillary_notes
) VALUES (
  'MIG-001',
  'Miguel Shuttle',
  'MIG',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Miguel Shuttle'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Miguel Shuttle'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('MIG' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('MIG' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('MIG' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('MIG' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('MIG' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('MIG' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('MIG' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('MIG' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('MIG' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('MIG' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'MIG' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'MIG' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'MIG' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'MIG' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Miguel Shuttle')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Cancún Airport ↔ Hotel',
  'Transfer Privado Aeroporto ↔ Hotel',
  'Transfer',
  'Airport Transfer',
  true,
  'Active',
  'Person',
  false,
  NULL
) ON CONFLICT (tour_id) DO NOTHING;

INSERT INTO public.commercial_products (
  tour_id, provider, provider_code, supplier_id, supplier_product_name,
  display_name, product_type, product_subtype, seller_visible, status,
  pricing_model_default, requires_ancillary_booking, ancillary_notes
) VALUES (
  'MTZ-001',
  'MTZ Tours',
  'MTZ',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('MTZ Tours'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('MTZ Tours'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('MTZ' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('MTZ' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('MTZ' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('MTZ' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('MTZ' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('MTZ' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('MTZ' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('MTZ' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('MTZ' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('MTZ' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'MTZ' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'MTZ' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'MTZ' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'MTZ' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('MTZ Tours')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Tulum Casa Tortuga Silver',
  'Tulum Casa Tortuga Silver',
  'Tour',
  NULL,
  true,
  'Active',
  'Person',
  false,
  NULL
) ON CONFLICT (tour_id) DO NOTHING;

INSERT INTO public.commercial_products (
  tour_id, provider, provider_code, supplier_id, supplier_product_name,
  display_name, product_type, product_subtype, seller_visible, status,
  pricing_model_default, requires_ancillary_booking, ancillary_notes
) VALUES (
  'MTZ-002',
  'MTZ Tours',
  'MTZ',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('MTZ Tours'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('MTZ Tours'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('MTZ' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('MTZ' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('MTZ' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('MTZ' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('MTZ' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('MTZ' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('MTZ' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('MTZ' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('MTZ' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('MTZ' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'MTZ' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'MTZ' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'MTZ' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'MTZ' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('MTZ Tours')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Tulum Casa Tortuga Econômico',
  'Tulum Casa Tortuga Econômico',
  'Tour',
  NULL,
  true,
  'Active',
  'Person',
  false,
  NULL
) ON CONFLICT (tour_id) DO NOTHING;

INSERT INTO public.commercial_products (
  tour_id, provider, provider_code, supplier_id, supplier_product_name,
  display_name, product_type, product_subtype, seller_visible, status,
  pricing_model_default, requires_ancillary_booking, ancillary_notes
) VALUES (
  'MTZ-003',
  'MTZ Tours',
  'MTZ',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('MTZ Tours'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('MTZ Tours'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('MTZ' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('MTZ' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('MTZ' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('MTZ' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('MTZ' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('MTZ' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('MTZ' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('MTZ' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('MTZ' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('MTZ' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'MTZ' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'MTZ' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'MTZ' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'MTZ' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('MTZ Tours')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Tulum + Casa Tortuga + Madre Naturaleza',
  'Tulum + Casa Tortuga + Madre Naturaleza',
  'Tour',
  NULL,
  true,
  'Active',
  'Person',
  false,
  NULL
) ON CONFLICT (tour_id) DO NOTHING;

INSERT INTO public.commercial_products (
  tour_id, provider, provider_code, supplier_id, supplier_product_name,
  display_name, product_type, product_subtype, seller_visible, status,
  pricing_model_default, requires_ancillary_booking, ancillary_notes
) VALUES (
  'MTZ-004',
  'MTZ Tours',
  'MTZ',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('MTZ Tours'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('MTZ Tours'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('MTZ' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('MTZ' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('MTZ' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('MTZ' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('MTZ' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('MTZ' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('MTZ' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('MTZ' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('MTZ' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('MTZ' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'MTZ' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'MTZ' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'MTZ' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'MTZ' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('MTZ Tours')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Tulum Dos Ojos e Grand Cenote',
  'Tulum Dos Ojos e Grand Cenote',
  'Tour',
  NULL,
  true,
  'Active',
  'Person',
  false,
  NULL
) ON CONFLICT (tour_id) DO NOTHING;

INSERT INTO public.commercial_products (
  tour_id, provider, provider_code, supplier_id, supplier_product_name,
  display_name, product_type, product_subtype, seller_visible, status,
  pricing_model_default, requires_ancillary_booking, ancillary_notes
) VALUES (
  'MUS-001',
  'MUSA',
  'MUS',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('MUSA'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('MUSA'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('MUS' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('MUS' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('MUS' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('MUS' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('MUS' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('MUS' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('MUS' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('MUS' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('MUS' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('MUS' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'MUS' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'MUS' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'MUS' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'MUS' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('MUSA')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Musa Cilindro',
  'Musa Cilindro',
  'Tour',
  NULL,
  true,
  'Active',
  'Person',
  false,
  NULL
) ON CONFLICT (tour_id) DO NOTHING;

INSERT INTO public.commercial_products (
  tour_id, provider, provider_code, supplier_id, supplier_product_name,
  display_name, product_type, product_subtype, seller_visible, status,
  pricing_model_default, requires_ancillary_booking, ancillary_notes
) VALUES (
  'PJS-001',
  'Parasailing & Jet Ski',
  'PJS',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Parasailing & Jet Ski'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Parasailing & Jet Ski'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('PJS' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('PJS' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('PJS' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('PJS' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('PJS' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('PJS' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('PJS' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('PJS' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('PJS' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('PJS' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'PJS' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'PJS' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'PJS' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'PJS' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Parasailing & Jet Ski')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Parasailing',
  'Parasailing',
  'Activity',
  'Parasailing',
  true,
  'Active',
  'Person',
  false,
  NULL
) ON CONFLICT (tour_id) DO NOTHING;

INSERT INTO public.commercial_products (
  tour_id, provider, provider_code, supplier_id, supplier_product_name,
  display_name, product_type, product_subtype, seller_visible, status,
  pricing_model_default, requires_ancillary_booking, ancillary_notes
) VALUES (
  'PJS-002',
  'Parasailing & Jet Ski',
  'PJS',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Parasailing & Jet Ski'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Parasailing & Jet Ski'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('PJS' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('PJS' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('PJS' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('PJS' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('PJS' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('PJS' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('PJS' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('PJS' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('PJS' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('PJS' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'PJS' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'PJS' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'PJS' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'PJS' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Parasailing & Jet Ski')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Jet ski 30min',
  'Jet ski 30min',
  'Activity',
  'Jet Ski',
  true,
  'Active',
  'Person',
  false,
  NULL
) ON CONFLICT (tour_id) DO NOTHING;

INSERT INTO public.commercial_products (
  tour_id, provider, provider_code, supplier_id, supplier_product_name,
  display_name, product_type, product_subtype, seller_visible, status,
  pricing_model_default, requires_ancillary_booking, ancillary_notes
) VALUES (
  'PJS-003',
  'Parasailing & Jet Ski',
  'PJS',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Parasailing & Jet Ski'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Parasailing & Jet Ski'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('PJS' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('PJS' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('PJS' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('PJS' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('PJS' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('PJS' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('PJS' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('PJS' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('PJS' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('PJS' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'PJS' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'PJS' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'PJS' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'PJS' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Parasailing & Jet Ski')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Jet ski 60min',
  'Jet ski 60min',
  'Activity',
  'Jet Ski',
  true,
  'Active',
  'Person',
  false,
  NULL
) ON CONFLICT (tour_id) DO NOTHING;

INSERT INTO public.commercial_products (
  tour_id, provider, provider_code, supplier_id, supplier_product_name,
  display_name, product_type, product_subtype, seller_visible, status,
  pricing_model_default, requires_ancillary_booking, ancillary_notes
) VALUES (
  'PLY-001',
  'Playa Mía',
  'PLY',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Playa Mía'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Playa Mía'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('PLY' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('PLY' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('PLY' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('PLY' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('PLY' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('PLY' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('PLY' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('PLY' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('PLY' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('PLY' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'PLY' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'PLY' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'PLY' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'PLY' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Playa Mía')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Cozumel el Cielo',
  'Cozumel el Cielo',
  'Tour',
  NULL,
  true,
  'Active',
  'Person',
  false,
  NULL
) ON CONFLICT (tour_id) DO NOTHING;

INSERT INTO public.commercial_products (
  tour_id, provider, provider_code, supplier_id, supplier_product_name,
  display_name, product_type, product_subtype, seller_visible, status,
  pricing_model_default, requires_ancillary_booking, ancillary_notes
) VALUES (
  'DOL-001',
  'The Dolphin Company',
  'DOL',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('The Dolphin Company'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('The Dolphin Company'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('DOL' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('DOL' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('DOL' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('DOL' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('DOL' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('DOL' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('DOL' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('DOL' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('DOL' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('DOL' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'DOL' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'DOL' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'DOL' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'DOL' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('The Dolphin Company')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Garrafón VIP + Dolphin Royal Connection',
  'Garrafón VIP + Dolphin Royal Connection',
  'Tour',
  NULL,
  true,
  'Active',
  'Person',
  false,
  NULL
) ON CONFLICT (tour_id) DO NOTHING;

INSERT INTO public.commercial_products (
  tour_id, provider, provider_code, supplier_id, supplier_product_name,
  display_name, product_type, product_subtype, seller_visible, status,
  pricing_model_default, requires_ancillary_booking, ancillary_notes
) VALUES (
  'DOL-002',
  'The Dolphin Company',
  'DOL',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('The Dolphin Company'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('The Dolphin Company'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('DOL' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('DOL' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('DOL' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('DOL' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('DOL' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('DOL' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('DOL' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('DOL' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('DOL' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('DOL' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'DOL' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'DOL' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'DOL' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'DOL' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('The Dolphin Company')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Royal Garrafón + Dolphin Connection',
  'Royal Garrafón + Dolphin Connection',
  'Tour',
  NULL,
  true,
  'Active',
  'Person',
  false,
  NULL
) ON CONFLICT (tour_id) DO NOTHING;

INSERT INTO public.commercial_products (
  tour_id, provider, provider_code, supplier_id, supplier_product_name,
  display_name, product_type, product_subtype, seller_visible, status,
  pricing_model_default, requires_ancillary_booking, ancillary_notes
) VALUES (
  'DOL-003',
  'The Dolphin Company',
  'DOL',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('The Dolphin Company'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('The Dolphin Company'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('DOL' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('DOL' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('DOL' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('DOL' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('DOL' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('DOL' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('DOL' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('DOL' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('DOL' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('DOL' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'DOL' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'DOL' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'DOL' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'DOL' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('The Dolphin Company')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Royal Garrafón + Dolphin Encounter',
  'Royal Garrafón + Dolphin Encounter',
  'Tour',
  NULL,
  true,
  'Active',
  'Person',
  false,
  NULL
) ON CONFLICT (tour_id) DO NOTHING;

INSERT INTO public.commercial_products (
  tour_id, provider, provider_code, supplier_id, supplier_product_name,
  display_name, product_type, product_subtype, seller_visible, status,
  pricing_model_default, requires_ancillary_booking, ancillary_notes
) VALUES (
  'DOL-004',
  'The Dolphin Company',
  'DOL',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('The Dolphin Company'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('The Dolphin Company'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('DOL' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('DOL' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('DOL' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('DOL' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('DOL' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('DOL' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('DOL' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('DOL' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('DOL' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('DOL' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'DOL' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'DOL' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'DOL' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'DOL' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('The Dolphin Company')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Garrafón VIP',
  'Garrafón VIP',
  'Tour',
  NULL,
  true,
  'Active',
  'Person',
  false,
  NULL
) ON CONFLICT (tour_id) DO NOTHING;

INSERT INTO public.commercial_products (
  tour_id, provider, provider_code, supplier_id, supplier_product_name,
  display_name, product_type, product_subtype, seller_visible, status,
  pricing_model_default, requires_ancillary_booking, ancillary_notes
) VALUES (
  'DOL-005',
  'The Dolphin Company',
  'DOL',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('The Dolphin Company'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('The Dolphin Company'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('DOL' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('DOL' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('DOL' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('DOL' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('DOL' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('DOL' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('DOL' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('DOL' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('DOL' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('DOL' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'DOL' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'DOL' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'DOL' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'DOL' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('The Dolphin Company')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Royal Garrafón',
  'Royal Garrafón',
  'Tour',
  NULL,
  true,
  'Active',
  'Person',
  false,
  NULL
) ON CONFLICT (tour_id) DO NOTHING;

INSERT INTO public.commercial_products (
  tour_id, provider, provider_code, supplier_id, supplier_product_name,
  display_name, product_type, product_subtype, seller_visible, status,
  pricing_model_default, requires_ancillary_booking, ancillary_notes
) VALUES (
  'DOL-006',
  'The Dolphin Company',
  'DOL',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('The Dolphin Company'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('The Dolphin Company'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('DOL' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('DOL' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('DOL' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('DOL' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('DOL' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('DOL' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('DOL' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('DOL' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('DOL' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('DOL' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'DOL' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'DOL' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'DOL' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'DOL' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('The Dolphin Company')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Dolphin Cat + Dolphin Royal Connection',
  'Dolphin Cat + Dolphin Royal Connection',
  'Tour',
  NULL,
  true,
  'Active',
  'Person',
  false,
  NULL
) ON CONFLICT (tour_id) DO NOTHING;

INSERT INTO public.commercial_products (
  tour_id, provider, provider_code, supplier_id, supplier_product_name,
  display_name, product_type, product_subtype, seller_visible, status,
  pricing_model_default, requires_ancillary_booking, ancillary_notes
) VALUES (
  'DOL-007',
  'The Dolphin Company',
  'DOL',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('The Dolphin Company'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('The Dolphin Company'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('DOL' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('DOL' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('DOL' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('DOL' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('DOL' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('DOL' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('DOL' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('DOL' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('DOL' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('DOL' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'DOL' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'DOL' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'DOL' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'DOL' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('The Dolphin Company')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Dolphin Cat + Dolphin Connection',
  'Dolphin Cat + Dolphin Connection',
  'Tour',
  NULL,
  true,
  'Active',
  'Person',
  false,
  NULL
) ON CONFLICT (tour_id) DO NOTHING;

INSERT INTO public.commercial_products (
  tour_id, provider, provider_code, supplier_id, supplier_product_name,
  display_name, product_type, product_subtype, seller_visible, status,
  pricing_model_default, requires_ancillary_booking, ancillary_notes
) VALUES (
  'DOL-008',
  'The Dolphin Company',
  'DOL',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('The Dolphin Company'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('The Dolphin Company'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('DOL' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('DOL' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('DOL' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('DOL' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('DOL' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('DOL' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('DOL' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('DOL' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('DOL' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('DOL' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'DOL' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'DOL' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'DOL' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'DOL' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('The Dolphin Company')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Dolphin Cat + Dolphin Encounter',
  'Dolphin Cat + Dolphin Encounter',
  'Tour',
  NULL,
  true,
  'Active',
  'Person',
  false,
  NULL
) ON CONFLICT (tour_id) DO NOTHING;

INSERT INTO public.commercial_products (
  tour_id, provider, provider_code, supplier_id, supplier_product_name,
  display_name, product_type, product_subtype, seller_visible, status,
  pricing_model_default, requires_ancillary_booking, ancillary_notes
) VALUES (
  'DOL-009',
  'The Dolphin Company',
  'DOL',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('The Dolphin Company'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('The Dolphin Company'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('DOL' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('DOL' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('DOL' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('DOL' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('DOL' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('DOL' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('DOL' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('DOL' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('DOL' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('DOL' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'DOL' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'DOL' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'DOL' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'DOL' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('The Dolphin Company')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Dolphin Cat (básico)',
  'Dolphin Cat (básico)',
  'Tour',
  NULL,
  true,
  'Active',
  'Person',
  false,
  NULL
) ON CONFLICT (tour_id) DO NOTHING;

INSERT INTO public.commercial_products (
  tour_id, provider, provider_code, supplier_id, supplier_product_name,
  display_name, product_type, product_subtype, seller_visible, status,
  pricing_model_default, requires_ancillary_booking, ancillary_notes
) VALUES (
  'DOL-010',
  'The Dolphin Company',
  'DOL',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('The Dolphin Company'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('The Dolphin Company'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('DOL' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('DOL' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('DOL' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('DOL' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('DOL' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('DOL' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('DOL' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('DOL' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('DOL' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('DOL' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'DOL' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'DOL' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'DOL' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'DOL' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('The Dolphin Company')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Isla Mujeres Pleasure',
  'Isla Mujeres Pleasure',
  'Tour',
  NULL,
  true,
  'Active',
  'Person',
  false,
  NULL
) ON CONFLICT (tour_id) DO NOTHING;

INSERT INTO public.commercial_products (
  tour_id, provider, provider_code, supplier_id, supplier_product_name,
  display_name, product_type, product_subtype, seller_visible, status,
  pricing_model_default, requires_ancillary_booking, ancillary_notes
) VALUES (
  'DOL-011',
  'The Dolphin Company',
  'DOL',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('The Dolphin Company'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('The Dolphin Company'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('DOL' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('DOL' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('DOL' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('DOL' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('DOL' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('DOL' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('DOL' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('DOL' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('DOL' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('DOL' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'DOL' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'DOL' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'DOL' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'DOL' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('The Dolphin Company')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Isla Mujeres Pleasure VIP',
  'Isla Mujeres Pleasure VIP',
  'Tour',
  NULL,
  true,
  'Active',
  'Person',
  false,
  NULL
) ON CONFLICT (tour_id) DO NOTHING;

INSERT INTO public.commercial_products (
  tour_id, provider, provider_code, supplier_id, supplier_product_name,
  display_name, product_type, product_subtype, seller_visible, status,
  pricing_model_default, requires_ancillary_booking, ancillary_notes
) VALUES (
  'DOL-012',
  'The Dolphin Company',
  'DOL',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('The Dolphin Company'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('The Dolphin Company'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('DOL' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('DOL' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('DOL' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('DOL' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('DOL' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('DOL' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('DOL' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('DOL' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('DOL' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('DOL' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'DOL' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'DOL' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'DOL' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'DOL' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('The Dolphin Company')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Dolphin Royal Connection',
  'Dolphin Royal Connection',
  'Tour',
  NULL,
  true,
  'Active',
  'Person',
  false,
  NULL
) ON CONFLICT (tour_id) DO NOTHING;

INSERT INTO public.commercial_products (
  tour_id, provider, provider_code, supplier_id, supplier_product_name,
  display_name, product_type, product_subtype, seller_visible, status,
  pricing_model_default, requires_ancillary_booking, ancillary_notes
) VALUES (
  'DOL-013',
  'The Dolphin Company',
  'DOL',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('The Dolphin Company'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('The Dolphin Company'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('DOL' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('DOL' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('DOL' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('DOL' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('DOL' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('DOL' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('DOL' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('DOL' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('DOL' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('DOL' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'DOL' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'DOL' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'DOL' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'DOL' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('The Dolphin Company')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Dolphin Connection',
  'Dolphin Connection',
  'Tour',
  NULL,
  true,
  'Active',
  'Person',
  false,
  NULL
) ON CONFLICT (tour_id) DO NOTHING;

INSERT INTO public.commercial_products (
  tour_id, provider, provider_code, supplier_id, supplier_product_name,
  display_name, product_type, product_subtype, seller_visible, status,
  pricing_model_default, requires_ancillary_booking, ancillary_notes
) VALUES (
  'DOL-014',
  'The Dolphin Company',
  'DOL',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('The Dolphin Company'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('The Dolphin Company'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('DOL' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('DOL' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('DOL' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('DOL' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('DOL' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('DOL' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('DOL' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('DOL' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('DOL' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('DOL' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'DOL' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'DOL' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'DOL' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'DOL' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('The Dolphin Company')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Dolphin Encounter',
  'Dolphin Encounter',
  'Tour',
  NULL,
  true,
  'Active',
  'Person',
  false,
  NULL
) ON CONFLICT (tour_id) DO NOTHING;

INSERT INTO public.commercial_products (
  tour_id, provider, provider_code, supplier_id, supplier_product_name,
  display_name, product_type, product_subtype, seller_visible, status,
  pricing_model_default, requires_ancillary_booking, ancillary_notes
) VALUES (
  'DOL-015',
  'The Dolphin Company',
  'DOL',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('The Dolphin Company'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('The Dolphin Company'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('DOL' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('DOL' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('DOL' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('DOL' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('DOL' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('DOL' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('DOL' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('DOL' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('DOL' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('DOL' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'DOL' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'DOL' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'DOL' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'DOL' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('The Dolphin Company')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Discovery Especies (Lobos Marinos y Manatíes)',
  'Discovery Especies (Lobos Marinos y Manatíes)',
  'Tour',
  NULL,
  true,
  'Active',
  'Person',
  false,
  NULL
) ON CONFLICT (tour_id) DO NOTHING;

INSERT INTO public.commercial_products (
  tour_id, provider, provider_code, supplier_id, supplier_product_name,
  display_name, product_type, product_subtype, seller_visible, status,
  pricing_model_default, requires_ancillary_booking, ancillary_notes
) VALUES (
  'DOL-016',
  'The Dolphin Company',
  'DOL',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('The Dolphin Company'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('The Dolphin Company'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('DOL' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('DOL' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('DOL' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('DOL' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('DOL' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('DOL' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('DOL' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('DOL' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('DOL' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('DOL' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'DOL' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'DOL' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'DOL' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'DOL' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('The Dolphin Company')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Experiencia Discovery (Meet and Greet)',
  'Experiencia Discovery (Meet and Greet)',
  'Tour',
  NULL,
  true,
  'Active',
  'Person',
  false,
  NULL
) ON CONFLICT (tour_id) DO NOTHING;

INSERT INTO public.commercial_products (
  tour_id, provider, provider_code, supplier_id, supplier_product_name,
  display_name, product_type, product_subtype, seller_visible, status,
  pricing_model_default, requires_ancillary_booking, ancillary_notes
) VALUES (
  'DOL-017',
  'The Dolphin Company',
  'DOL',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('The Dolphin Company'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('The Dolphin Company'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('DOL' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('DOL' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('DOL' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('DOL' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('DOL' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('DOL' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('DOL' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('DOL' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('DOL' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('DOL' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'DOL' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'DOL' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'DOL' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'DOL' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('The Dolphin Company')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Isla Discovery',
  'Isla Discovery',
  'Tour',
  NULL,
  true,
  'Active',
  'Person',
  false,
  NULL
) ON CONFLICT (tour_id) DO NOTHING;

INSERT INTO public.commercial_products (
  tour_id, provider, provider_code, supplier_id, supplier_product_name,
  display_name, product_type, product_subtype, seller_visible, status,
  pricing_model_default, requires_ancillary_booking, ancillary_notes
) VALUES (
  'XCA-001',
  'Xcaret',
  'XCA',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Xcaret'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Xcaret'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('XCA' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('XCA' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('XCA' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('XCA' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('XCA' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('XCA' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('XCA' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('XCA' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('XCA' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('XCA' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'XCA' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'XCA' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'XCA' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'XCA' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Xcaret')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Tour Xcaret Full Day',
  'Xcaret Full Day',
  'Tour',
  NULL,
  true,
  'Active',
  'Person',
  false,
  NULL
) ON CONFLICT (tour_id) DO NOTHING;

INSERT INTO public.commercial_products (
  tour_id, provider, provider_code, supplier_id, supplier_product_name,
  display_name, product_type, product_subtype, seller_visible, status,
  pricing_model_default, requires_ancillary_booking, ancillary_notes
) VALUES (
  'XCA-002',
  'Xcaret',
  'XCA',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Xcaret'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Xcaret'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('XCA' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('XCA' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('XCA' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('XCA' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('XCA' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('XCA' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('XCA' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('XCA' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('XCA' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('XCA' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'XCA' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'XCA' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'XCA' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'XCA' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Xcaret')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Tour Xcaret Plus',
  'Xcaret Plus',
  'Tour',
  NULL,
  true,
  'Active',
  'Person',
  false,
  NULL
) ON CONFLICT (tour_id) DO NOTHING;

INSERT INTO public.commercial_products (
  tour_id, provider, provider_code, supplier_id, supplier_product_name,
  display_name, product_type, product_subtype, seller_visible, status,
  pricing_model_default, requires_ancillary_booking, ancillary_notes
) VALUES (
  'XCA-003',
  'Xcaret',
  'XCA',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Xcaret'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Xcaret'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('XCA' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('XCA' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('XCA' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('XCA' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('XCA' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('XCA' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('XCA' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('XCA' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('XCA' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('XCA' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'XCA' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'XCA' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'XCA' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'XCA' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Xcaret')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Tour Xcaret De Noche',
  'Xcaret de Noche',
  'Tour',
  NULL,
  true,
  'Active',
  'Person',
  false,
  NULL
) ON CONFLICT (tour_id) DO NOTHING;

INSERT INTO public.commercial_products (
  tour_id, provider, provider_code, supplier_id, supplier_product_name,
  display_name, product_type, product_subtype, seller_visible, status,
  pricing_model_default, requires_ancillary_booking, ancillary_notes
) VALUES (
  'XCA-004',
  'Xcaret',
  'XCA',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Xcaret'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Xcaret'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('XCA' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('XCA' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('XCA' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('XCA' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('XCA' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('XCA' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('XCA' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('XCA' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('XCA' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('XCA' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'XCA' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'XCA' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'XCA' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'XCA' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Xcaret')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Tour Xel-Há All Inclusive',
  'Xel-Há All Inclusive',
  'Tour',
  NULL,
  true,
  'Active',
  'Person',
  false,
  NULL
) ON CONFLICT (tour_id) DO NOTHING;

INSERT INTO public.commercial_products (
  tour_id, provider, provider_code, supplier_id, supplier_product_name,
  display_name, product_type, product_subtype, seller_visible, status,
  pricing_model_default, requires_ancillary_booking, ancillary_notes
) VALUES (
  'XCA-005',
  'Xcaret',
  'XCA',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Xcaret'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Xcaret'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('XCA' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('XCA' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('XCA' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('XCA' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('XCA' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('XCA' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('XCA' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('XCA' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('XCA' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('XCA' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'XCA' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'XCA' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'XCA' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'XCA' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Xcaret')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Tour Tulum Xel-Há All Inclusive',
  'Tulum + Xel-Há All Inclusive',
  'Tour',
  NULL,
  true,
  'Active',
  'Person',
  false,
  NULL
) ON CONFLICT (tour_id) DO NOTHING;

INSERT INTO public.commercial_products (
  tour_id, provider, provider_code, supplier_id, supplier_product_name,
  display_name, product_type, product_subtype, seller_visible, status,
  pricing_model_default, requires_ancillary_booking, ancillary_notes
) VALUES (
  'XCA-006',
  'Xcaret',
  'XCA',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Xcaret'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Xcaret'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('XCA' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('XCA' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('XCA' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('XCA' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('XCA' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('XCA' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('XCA' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('XCA' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('XCA' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('XCA' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'XCA' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'XCA' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'XCA' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'XCA' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Xcaret')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Tour Xplor',
  'Xplor',
  'Tour',
  NULL,
  true,
  'Active',
  'Person',
  false,
  NULL
) ON CONFLICT (tour_id) DO NOTHING;

INSERT INTO public.commercial_products (
  tour_id, provider, provider_code, supplier_id, supplier_product_name,
  display_name, product_type, product_subtype, seller_visible, status,
  pricing_model_default, requires_ancillary_booking, ancillary_notes
) VALUES (
  'XCA-007',
  'Xcaret',
  'XCA',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Xcaret'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Xcaret'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('XCA' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('XCA' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('XCA' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('XCA' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('XCA' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('XCA' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('XCA' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('XCA' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('XCA' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('XCA' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'XCA' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'XCA' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'XCA' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'XCA' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Xcaret')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Tour Xplor Fuego',
  'Xplor Fuego',
  'Tour',
  NULL,
  true,
  'Active',
  'Person',
  false,
  NULL
) ON CONFLICT (tour_id) DO NOTHING;

INSERT INTO public.commercial_products (
  tour_id, provider, provider_code, supplier_id, supplier_product_name,
  display_name, product_type, product_subtype, seller_visible, status,
  pricing_model_default, requires_ancillary_booking, ancillary_notes
) VALUES (
  'XCA-008',
  'Xcaret',
  'XCA',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Xcaret'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Xcaret'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('XCA' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('XCA' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('XCA' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('XCA' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('XCA' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('XCA' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('XCA' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('XCA' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('XCA' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('XCA' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'XCA' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'XCA' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'XCA' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'XCA' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Xcaret')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Tour Xenotes Oasis Maya',
  'Xenotes Oasis Maya',
  'Tour',
  NULL,
  true,
  'Active',
  'Person',
  false,
  NULL
) ON CONFLICT (tour_id) DO NOTHING;

INSERT INTO public.commercial_products (
  tour_id, provider, provider_code, supplier_id, supplier_product_name,
  display_name, product_type, product_subtype, seller_visible, status,
  pricing_model_default, requires_ancillary_booking, ancillary_notes
) VALUES (
  'XCA-009',
  'Xcaret',
  'XCA',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Xcaret'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Xcaret'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('XCA' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('XCA' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('XCA' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('XCA' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('XCA' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('XCA' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('XCA' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('XCA' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('XCA' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('XCA' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'XCA' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'XCA' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'XCA' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'XCA' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Xcaret')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Tour Xoximilco',
  'Xoximilco',
  'Tour',
  NULL,
  true,
  'Active',
  'Person',
  false,
  NULL
) ON CONFLICT (tour_id) DO NOTHING;

INSERT INTO public.commercial_products (
  tour_id, provider, provider_code, supplier_id, supplier_product_name,
  display_name, product_type, product_subtype, seller_visible, status,
  pricing_model_default, requires_ancillary_booking, ancillary_notes
) VALUES (
  'XCA-010',
  'Xcaret',
  'XCA',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Xcaret'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Xcaret'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('XCA' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('XCA' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('XCA' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('XCA' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('XCA' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('XCA' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('XCA' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('XCA' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('XCA' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('XCA' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'XCA' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'XCA' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'XCA' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'XCA' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Xcaret')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Tour Xenses',
  'Xenses',
  'Tour',
  NULL,
  true,
  'Active',
  'Person',
  false,
  NULL
) ON CONFLICT (tour_id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 2. CARGA DAS 80 TARIFAS OFICIAIS DE FORNECEDORES (public.supplier_rates)
-- -----------------------------------------------------------------------------
INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'BAK-R001',
  'BAK-001',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Baktun'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Baktun'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('BAK' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('BAK' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('BAK' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('BAK' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('BAK' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('BAK' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('BAK' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('BAK' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('BAK' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('BAK' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'BAK' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'BAK' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'BAK' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'BAK' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Baktun')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Chichén Itzá Clássico',
  'Person',
  57,
  43,
  NULL,
  NULL,
  'USD',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  'Active',
  NULL
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'BAK-R002',
  'BAK-002',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Baktun'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Baktun'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('BAK' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('BAK' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('BAK' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('BAK' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('BAK' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('BAK' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('BAK' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('BAK' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('BAK' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('BAK' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'BAK' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'BAK' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'BAK' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'BAK' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Baktun')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Chichén Itzá Deluxe',
  'Person',
  67,
  55,
  NULL,
  NULL,
  'USD',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  'Active',
  NULL
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'BAK-R003',
  'BAK-003',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Baktun'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Baktun'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('BAK' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('BAK' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('BAK' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('BAK' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('BAK' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('BAK' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('BAK' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('BAK' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('BAK' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('BAK' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'BAK' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'BAK' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'BAK' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'BAK' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Baktun')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Chichén Itzá 2 Cenotes',
  'Person',
  82,
  61,
  NULL,
  NULL,
  'USD',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  'Active',
  NULL
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'COC-R001',
  'COC-001',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Coco Bongo'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Coco Bongo'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('COC' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('COC' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('COC' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('COC' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('COC' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('COC' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('COC' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('COC' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('COC' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('COC' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'COC' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'COC' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'COC' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'COC' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Coco Bongo')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Coco Bongo Drink Pack (Mon–Wed)',
  'Person',
  64,
  NULL,
  NULL,
  NULL,
  'USD',
  NULL,
  NULL,
  'Monday;Tuesday;Wednesday',
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  'Active',
  'Adults only (18+). Net supplier cost from supplier public-price flyer: 20% commission. Approved: only Monday–Wednesday.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'COC-R002',
  'COC-002',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Coco Bongo'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Coco Bongo'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('COC' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('COC' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('COC' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('COC' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('COC' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('COC' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('COC' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('COC' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('COC' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('COC' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'COC' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'COC' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'COC' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'COC' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Coco Bongo')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Coco Bongo Regular (Mon–Wed)',
  'Person',
  67.5,
  NULL,
  NULL,
  NULL,
  'USD',
  NULL,
  NULL,
  'Monday;Tuesday;Wednesday',
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  'Active',
  'Adults only (18+). Net supplier cost from supplier public-price flyer: 25% commission. Replaces original source Dom–Qui grouping.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'COC-R003',
  'COC-002',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Coco Bongo'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Coco Bongo'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('COC' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('COC' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('COC' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('COC' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('COC' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('COC' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('COC' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('COC' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('COC' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('COC' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'COC' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'COC' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'COC' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'COC' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Coco Bongo')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Coco Bongo Regular (Sun & Thu)',
  'Person',
  75,
  NULL,
  NULL,
  NULL,
  'USD',
  NULL,
  NULL,
  'Sunday;Thursday',
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  'Active',
  'Adults only (18+). Net supplier cost from supplier public-price flyer: 25% commission. New split required by supplier price flyer; unavailable Saturday.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'COC-R004',
  'COC-002',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Coco Bongo'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Coco Bongo'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('COC' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('COC' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('COC' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('COC' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('COC' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('COC' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('COC' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('COC' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('COC' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('COC' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'COC' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'COC' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'COC' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'COC' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Coco Bongo')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Coco Bongo Regular (Friday)',
  'Person',
  93.75,
  NULL,
  NULL,
  NULL,
  'USD',
  NULL,
  NULL,
  'Friday',
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  'Active',
  'Adults only (18+). Net supplier cost from supplier public-price flyer: 25% commission. Unavailable Saturday.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'COC-R005',
  'COC-003',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Coco Bongo'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Coco Bongo'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('COC' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('COC' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('COC' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('COC' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('COC' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('COC' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('COC' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('COC' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('COC' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('COC' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'COC' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'COC' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'COC' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'COC' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Coco Bongo')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Coco Bongo Premium (Sun–Wed)',
  'Person',
  93.75,
  NULL,
  NULL,
  NULL,
  'USD',
  NULL,
  NULL,
  'Sunday;Monday;Tuesday;Wednesday',
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  'Active',
  'Adults only (18+). Net supplier cost from supplier public-price flyer: 25% commission. '
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'COC-R006',
  'COC-003',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Coco Bongo'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Coco Bongo'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('COC' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('COC' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('COC' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('COC' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('COC' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('COC' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('COC' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('COC' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('COC' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('COC' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'COC' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'COC' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'COC' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'COC' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Coco Bongo')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Coco Bongo Premium (Thu–Sat)',
  'Person',
  105,
  NULL,
  NULL,
  NULL,
  'USD',
  NULL,
  NULL,
  'Thursday;Friday;Saturday',
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  'Active',
  'Adults only (18+). Net supplier cost from supplier public-price flyer: 25% commission. '
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'COC-R007',
  'COC-004',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Coco Bongo'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Coco Bongo'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('COC' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('COC' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('COC' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('COC' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('COC' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('COC' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('COC' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('COC' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('COC' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('COC' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'COC' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'COC' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'COC' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'COC' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Coco Bongo')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Coco Bongo Royal Service (Sun–Wed)',
  'Person',
  131.25,
  NULL,
  NULL,
  NULL,
  'USD',
  NULL,
  NULL,
  'Sunday;Monday;Tuesday;Wednesday',
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  'Active',
  'Adults only (18+). Net supplier cost from supplier public-price flyer: 25% commission. Unavailable Thursday–Saturday.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'COC-R008',
  'COC-005',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Coco Bongo'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Coco Bongo'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('COC' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('COC' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('COC' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('COC' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('COC' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('COC' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('COC' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('COC' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('COC' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('COC' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'COC' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'COC' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'COC' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'COC' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Coco Bongo')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Coco Bongo Gold Member (Sun–Wed)',
  'Person',
  120,
  NULL,
  NULL,
  NULL,
  'USD',
  NULL,
  NULL,
  'Sunday;Monday;Tuesday;Wednesday',
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  'Active',
  'Adults only (18+). Net supplier cost from supplier public-price flyer: 25% commission. '
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'COC-R009',
  'COC-005',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Coco Bongo'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Coco Bongo'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('COC' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('COC' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('COC' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('COC' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('COC' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('COC' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('COC' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('COC' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('COC' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('COC' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'COC' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'COC' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'COC' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'COC' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Coco Bongo')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Coco Bongo Gold Member (Thu–Sat)',
  'Person',
  127.5,
  NULL,
  NULL,
  NULL,
  'USD',
  NULL,
  NULL,
  'Thursday;Friday;Saturday',
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  'Active',
  'Adults only (18+). Net supplier cost from supplier public-price flyer: 25% commission. '
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'COC-R010',
  'COC-006',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Coco Bongo'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Coco Bongo'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('COC' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('COC' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('COC' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('COC' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('COC' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('COC' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('COC' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('COC' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('COC' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('COC' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'COC' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'COC' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'COC' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'COC' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Coco Bongo')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Coco Bongo Front Row (Sun–Wed)',
  'Person',
  146.25,
  NULL,
  NULL,
  NULL,
  'USD',
  NULL,
  NULL,
  'Sunday;Monday;Tuesday;Wednesday',
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  'Active',
  'Adults only (18+). Net supplier cost from supplier public-price flyer: 25% commission. '
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'COC-R011',
  'COC-006',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Coco Bongo'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Coco Bongo'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('COC' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('COC' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('COC' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('COC' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('COC' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('COC' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('COC' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('COC' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('COC' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('COC' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'COC' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'COC' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'COC' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'COC' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Coco Bongo')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Coco Bongo Front Row (Thu–Sat)',
  'Person',
  157.5,
  NULL,
  NULL,
  NULL,
  'USD',
  NULL,
  NULL,
  'Thursday;Friday;Saturday',
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  'Active',
  'Adults only (18+). Net supplier cost from supplier public-price flyer: 25% commission. '
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'ENV-R001',
  'ENV-001',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Envatours'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Envatours'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('ENV' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('ENV' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('ENV' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('ENV' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('ENV' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('ENV' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('ENV' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('ENV' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('ENV' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('ENV' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'ENV' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'ENV' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'ENV' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'ENV' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Envatours')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Barco de Vidro – Bajo el Mar Cozumel (Coletivo)',
  'Person',
  14,
  14,
  NULL,
  NULL,
  'USD',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  'Active',
  NULL
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'ENV-R002',
  'ENV-002',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Envatours'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Envatours'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('ENV' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('ENV' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('ENV' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('ENV' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('ENV' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('ENV' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('ENV' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('ENV' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('ENV' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('ENV' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'ENV' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'ENV' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'ENV' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'ENV' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Envatours')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Barco de Vidro – Bajo el Mar Cozumel (Privado 10 pax)',
  'Boat',
  NULL,
  NULL,
  NULL,
  140,
  'USD',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  1,
  10,
  false,
  NULL,
  'Active',
  'User confirmed total fixed price per private boat for 1–10 passengers; original XLSX duplicated this amount in adult and child columns.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'ENV-R003',
  'ENV-003',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Envatours'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Envatours'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('ENV' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('ENV' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('ENV' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('ENV' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('ENV' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('ENV' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('ENV' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('ENV' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('ENV' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('ENV' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'ENV' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'ENV' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'ENV' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'ENV' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Envatours')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Barco de Vidro – Colores de Cancún (Coletivo)',
  'Person',
  27,
  27,
  NULL,
  NULL,
  'USD',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  'Active',
  NULL
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'ENV-R004',
  'ENV-004',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Envatours'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Envatours'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('ENV' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('ENV' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('ENV' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('ENV' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('ENV' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('ENV' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('ENV' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('ENV' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('ENV' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('ENV' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'ENV' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'ENV' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'ENV' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'ENV' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Envatours')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Barco de Vidro – Colores de Cancún (Privado 10pax)',
  'Boat',
  NULL,
  NULL,
  NULL,
  270,
  'USD',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  1,
  10,
  false,
  NULL,
  'Active',
  'User confirmed total fixed price per private boat for 1–10 passengers; original XLSX duplicated this amount in adult and child columns.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'ENV-R005',
  'ENV-005',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Envatours'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Envatours'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('ENV' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('ENV' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('ENV' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('ENV' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('ENV' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('ENV' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('ENV' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('ENV' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('ENV' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('ENV' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'ENV' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'ENV' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'ENV' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'ENV' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Envatours')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Barco de Vidro – Tour Isla Mujeres (Coletivo)',
  'Person',
  20,
  20,
  NULL,
  NULL,
  'USD',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  'Active',
  NULL
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'ENV-R006',
  'ENV-006',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Envatours'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Envatours'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('ENV' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('ENV' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('ENV' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('ENV' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('ENV' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('ENV' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('ENV' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('ENV' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('ENV' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('ENV' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'ENV' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'ENV' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'ENV' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'ENV' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Envatours')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Barco de Vidro – Tour Isla Mujeres (Privado 10 pax)',
  'Boat',
  NULL,
  NULL,
  NULL,
  200,
  'USD',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  1,
  10,
  false,
  NULL,
  'Active',
  'User confirmed total fixed price per private boat for 1–10 passengers; original XLSX duplicated this amount in adult and child columns.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'MIG-R001',
  'MIG-001',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Miguel Shuttle'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Miguel Shuttle'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('MIG' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('MIG' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('MIG' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('MIG' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('MIG' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('MIG' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('MIG' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('MIG' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('MIG' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('MIG' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'MIG' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'MIG' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'MIG' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'MIG' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Miguel Shuttle')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Cancún Airport ↔ Cancún Hotel Zone / Downtown',
  'Vehicle',
  NULL,
  NULL,
  NULL,
  39,
  'USD',
  'Cancún Hotel Zone / Downtown',
  NULL,
  NULL,
  NULL,
  'Cancún Airport ↔ Cancún Hotel Zone / Downtown',
  1,
  7,
  false,
  NULL,
  'Active',
  'One-way per vehicle; same price either direction. Return is 2 separately costed legs. Canonical hotel-zone mapping maintained in developer logic. No hotel-to-hotel automatic quote.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'MIG-R002',
  'MIG-001',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Miguel Shuttle'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Miguel Shuttle'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('MIG' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('MIG' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('MIG' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('MIG' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('MIG' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('MIG' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('MIG' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('MIG' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('MIG' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('MIG' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'MIG' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'MIG' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'MIG' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'MIG' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Miguel Shuttle')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Cancún Airport ↔ Costa Mujeres',
  'Vehicle',
  NULL,
  NULL,
  NULL,
  60,
  'USD',
  'Costa Mujeres',
  NULL,
  NULL,
  NULL,
  'Cancún Airport ↔ Costa Mujeres',
  1,
  7,
  false,
  NULL,
  'Active',
  'One-way per vehicle; same price either direction. Return is 2 separately costed legs. Canonical hotel-zone mapping maintained in developer logic. No hotel-to-hotel automatic quote.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'MIG-R003',
  'MIG-001',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Miguel Shuttle'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Miguel Shuttle'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('MIG' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('MIG' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('MIG' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('MIG' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('MIG' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('MIG' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('MIG' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('MIG' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('MIG' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('MIG' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'MIG' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'MIG' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'MIG' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'MIG' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Miguel Shuttle')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Cancún Airport ↔ Playa del Carmen',
  'Vehicle',
  NULL,
  NULL,
  NULL,
  65,
  'USD',
  'Playa del Carmen',
  NULL,
  NULL,
  NULL,
  'Cancún Airport ↔ Playa del Carmen',
  1,
  7,
  false,
  NULL,
  'Active',
  'One-way per vehicle; same price either direction. Return is 2 separately costed legs. Canonical hotel-zone mapping maintained in developer logic. No hotel-to-hotel automatic quote.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'MIG-R004',
  'MIG-001',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Miguel Shuttle'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Miguel Shuttle'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('MIG' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('MIG' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('MIG' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('MIG' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('MIG' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('MIG' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('MIG' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('MIG' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('MIG' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('MIG' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'MIG' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'MIG' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'MIG' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'MIG' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Miguel Shuttle')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Cancún Airport ↔ Tulum Centre',
  'Vehicle',
  NULL,
  NULL,
  NULL,
  120,
  'USD',
  'Tulum Centre',
  NULL,
  NULL,
  NULL,
  'Cancún Airport ↔ Tulum Centre',
  1,
  7,
  false,
  NULL,
  'Active',
  'One-way per vehicle; same price either direction. Return is 2 separately costed legs. Canonical hotel-zone mapping maintained in developer logic. No hotel-to-hotel automatic quote.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'MIG-R005',
  'MIG-001',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Miguel Shuttle'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Miguel Shuttle'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('MIG' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('MIG' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('MIG' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('MIG' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('MIG' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('MIG' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('MIG' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('MIG' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('MIG' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('MIG' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'MIG' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'MIG' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'MIG' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'MIG' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Miguel Shuttle')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Cancún Airport ↔ Tulum Hotel Zone',
  'Vehicle',
  NULL,
  NULL,
  NULL,
  135,
  'USD',
  'Tulum Hotel Zone',
  NULL,
  NULL,
  NULL,
  'Cancún Airport ↔ Tulum Hotel Zone',
  1,
  7,
  false,
  NULL,
  'Active',
  'One-way per vehicle; same price either direction. Return is 2 separately costed legs. Canonical hotel-zone mapping maintained in developer logic. No hotel-to-hotel automatic quote.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'MTZ-R001',
  'MTZ-001',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('MTZ Tours'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('MTZ Tours'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('MTZ' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('MTZ' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('MTZ' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('MTZ' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('MTZ' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('MTZ' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('MTZ' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('MTZ' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('MTZ' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('MTZ' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'MTZ' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'MTZ' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'MTZ' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'MTZ' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('MTZ Tours')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Tulum Casa Tortuga Silver',
  'Person',
  76,
  71,
  NULL,
  NULL,
  'USD',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  'Active',
  NULL
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'MTZ-R002',
  'MTZ-002',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('MTZ Tours'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('MTZ Tours'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('MTZ' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('MTZ' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('MTZ' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('MTZ' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('MTZ' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('MTZ' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('MTZ' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('MTZ' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('MTZ' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('MTZ' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'MTZ' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'MTZ' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'MTZ' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'MTZ' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('MTZ Tours')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Tulum Casa Tortuga Econômico',
  'Person',
  47,
  41,
  NULL,
  NULL,
  'USD',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  'Active',
  NULL
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'MTZ-R003',
  'MTZ-003',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('MTZ Tours'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('MTZ Tours'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('MTZ' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('MTZ' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('MTZ' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('MTZ' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('MTZ' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('MTZ' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('MTZ' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('MTZ' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('MTZ' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('MTZ' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'MTZ' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'MTZ' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'MTZ' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'MTZ' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('MTZ Tours')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Tulum + Casa Tortuga + Madre Naturaleza',
  'Person',
  74,
  68,
  NULL,
  NULL,
  'USD',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  'Active',
  NULL
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'MTZ-R004',
  'MTZ-004',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('MTZ Tours'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('MTZ Tours'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('MTZ' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('MTZ' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('MTZ' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('MTZ' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('MTZ' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('MTZ' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('MTZ' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('MTZ' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('MTZ' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('MTZ' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'MTZ' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'MTZ' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'MTZ' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'MTZ' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('MTZ Tours')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Tulum Dos Ojos e Grand Cenote',
  'Person',
  103,
  97,
  NULL,
  NULL,
  'USD',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  'Active',
  NULL
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'MUS-R001',
  'MUS-001',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('MUSA'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('MUSA'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('MUS' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('MUS' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('MUS' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('MUS' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('MUS' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('MUS' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('MUS' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('MUS' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('MUS' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('MUS' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'MUS' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'MUS' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'MUS' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'MUS' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('MUSA')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Musa Cilindro',
  'Person',
  89,
  89,
  NULL,
  NULL,
  'USD',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  'Active',
  NULL
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'PJS-R001',
  'PJS-001',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Parasailing & Jet Ski'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Parasailing & Jet Ski'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('PJS' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('PJS' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('PJS' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('PJS' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('PJS' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('PJS' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('PJS' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('PJS' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('PJS' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('PJS' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'PJS' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'PJS' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'PJS' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'PJS' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Parasailing & Jet Ski')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Parasailing',
  'Person',
  55,
  55,
  NULL,
  NULL,
  'USD',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  'Active',
  'User confirmed price per person; age/eligibility must not be inferred from equal adult/child cost.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'PJS-R002',
  'PJS-002',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Parasailing & Jet Ski'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Parasailing & Jet Ski'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('PJS' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('PJS' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('PJS' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('PJS' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('PJS' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('PJS' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('PJS' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('PJS' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('PJS' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('PJS' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'PJS' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'PJS' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'PJS' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'PJS' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Parasailing & Jet Ski')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Jet ski 30min',
  'Equipment',
  NULL,
  NULL,
  NULL,
  90,
  'USD',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  1,
  2,
  false,
  NULL,
  'Active',
  'Approved: supplier cost per jet ski (equipment unit); maximum 2 people per ski. Seller selects 30/60-minute product and passenger count. Units = ROUNDUP(passengers / 2), total supplier cost = units × Fixed Cost. For different rider allocation, authorized individual booking override required.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'PJS-R003',
  'PJS-003',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Parasailing & Jet Ski'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Parasailing & Jet Ski'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('PJS' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('PJS' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('PJS' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('PJS' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('PJS' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('PJS' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('PJS' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('PJS' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('PJS' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('PJS' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'PJS' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'PJS' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'PJS' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'PJS' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Parasailing & Jet Ski')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Jet ski 60min',
  'Equipment',
  NULL,
  NULL,
  NULL,
  120,
  'USD',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  1,
  2,
  false,
  NULL,
  'Active',
  'Approved: supplier cost per jet ski (equipment unit); maximum 2 people per ski. Seller selects 30/60-minute product and passenger count. Units = ROUNDUP(passengers / 2), total supplier cost = units × Fixed Cost. For different rider allocation, authorized individual booking override required.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'PLY-R001',
  'PLY-001',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Playa Mía'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Playa Mía'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('PLY' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('PLY' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('PLY' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('PLY' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('PLY' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('PLY' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('PLY' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('PLY' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('PLY' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('PLY' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'PLY' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'PLY' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'PLY' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'PLY' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Playa Mía')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Cozumel el Cielo (playa de carmen)',
  'Person',
  1660,
  1480,
  NULL,
  NULL,
  'MXN',
  'Playa del Carmen',
  NULL,
  NULL,
  'Playa del Carmen',
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  'Active',
  'Approved zone-to-departure mapping centrally: four northern zones → Cancún, four southern zones → Playa del Carmen. Cozumel departure is authorized manual selection only.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'PLY-R002',
  'PLY-001',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Playa Mía'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Playa Mía'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('PLY' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('PLY' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('PLY' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('PLY' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('PLY' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('PLY' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('PLY' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('PLY' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('PLY' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('PLY' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'PLY' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'PLY' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'PLY' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'PLY' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Playa Mía')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Cozumel el Cielo (saindo de Cancun)',
  'Person',
  1960,
  1780,
  NULL,
  NULL,
  'MXN',
  'Cancún',
  NULL,
  NULL,
  'Cancún',
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  'Active',
  'Approved zone-to-departure mapping centrally: four northern zones → Cancún, four southern zones → Playa del Carmen. Cozumel departure is authorized manual selection only.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'PLY-R003',
  'PLY-001',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Playa Mía'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Playa Mía'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('PLY' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('PLY' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('PLY' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('PLY' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('PLY' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('PLY' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('PLY' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('PLY' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('PLY' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('PLY' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'PLY' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'PLY' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'PLY' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'PLY' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Playa Mía')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Cozumel el Cielo (de Cozumel)',
  'Person',
  1350,
  1170,
  NULL,
  NULL,
  'MXN',
  'Cozumel',
  NULL,
  NULL,
  'Cozumel',
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  'Manual Only',
  'Approved zone-to-departure mapping centrally: four northern zones → Cancún, four southern zones → Playa del Carmen. Cozumel departure is authorized manual selection only.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'DOL-R001',
  'DOL-001',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('The Dolphin Company'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('The Dolphin Company'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('DOL' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('DOL' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('DOL' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('DOL' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('DOL' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('DOL' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('DOL' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('DOL' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('DOL' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('DOL' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'DOL' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'DOL' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'DOL' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'DOL' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('The Dolphin Company')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Garrafón VIP + Dolphin Royal Connection',
  'Person',
  101.46,
  54.62,
  NULL,
  NULL,
  'USD',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  'Active',
  'Supplier base cost only; ancillary charges intentionally outside this dataset.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'DOL-R002',
  'DOL-002',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('The Dolphin Company'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('The Dolphin Company'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('DOL' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('DOL' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('DOL' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('DOL' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('DOL' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('DOL' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('DOL' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('DOL' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('DOL' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('DOL' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'DOL' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'DOL' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'DOL' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'DOL' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('The Dolphin Company')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Royal Garrafón + Dolphin Connection',
  'Person',
  85.85,
  54.62,
  NULL,
  NULL,
  'USD',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  'Active',
  'Supplier base cost only; ancillary charges intentionally outside this dataset.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'DOL-R003',
  'DOL-003',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('The Dolphin Company'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('The Dolphin Company'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('DOL' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('DOL' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('DOL' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('DOL' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('DOL' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('DOL' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('DOL' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('DOL' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('DOL' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('DOL' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'DOL' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'DOL' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'DOL' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'DOL' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('The Dolphin Company')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Royal Garrafón + Dolphin Encounter',
  'Person',
  70.23,
  54.62,
  NULL,
  NULL,
  'USD',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  'Active',
  'Supplier base cost only; ancillary charges intentionally outside this dataset.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'DOL-R004',
  'DOL-004',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('The Dolphin Company'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('The Dolphin Company'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('DOL' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('DOL' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('DOL' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('DOL' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('DOL' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('DOL' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('DOL' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('DOL' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('DOL' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('DOL' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'DOL' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'DOL' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'DOL' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'DOL' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('The Dolphin Company')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Garrafón VIP',
  'Person',
  62.42,
  39,
  NULL,
  NULL,
  'USD',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  'Active',
  'Supplier base cost only; ancillary charges intentionally outside this dataset.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'DOL-R005',
  'DOL-005',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('The Dolphin Company'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('The Dolphin Company'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('DOL' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('DOL' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('DOL' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('DOL' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('DOL' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('DOL' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('DOL' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('DOL' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('DOL' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('DOL' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'DOL' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'DOL' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'DOL' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'DOL' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('The Dolphin Company')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Royal Garrafón',
  'Person',
  54.62,
  39,
  NULL,
  NULL,
  'USD',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  'Active',
  'Supplier base cost only; ancillary charges intentionally outside this dataset.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'DOL-R006',
  'DOL-006',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('The Dolphin Company'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('The Dolphin Company'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('DOL' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('DOL' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('DOL' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('DOL' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('DOL' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('DOL' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('DOL' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('DOL' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('DOL' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('DOL' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'DOL' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'DOL' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'DOL' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'DOL' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('The Dolphin Company')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Dolphin Cat + Dolphin Royal Connection',
  'Person',
  101.46,
  54.62,
  NULL,
  NULL,
  'USD',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  'Active',
  'Supplier base cost only; ancillary charges intentionally outside this dataset.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'DOL-R007',
  'DOL-007',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('The Dolphin Company'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('The Dolphin Company'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('DOL' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('DOL' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('DOL' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('DOL' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('DOL' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('DOL' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('DOL' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('DOL' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('DOL' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('DOL' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'DOL' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'DOL' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'DOL' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'DOL' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('The Dolphin Company')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Dolphin Cat + Dolphin Connection',
  'Person',
  85.85,
  54.62,
  NULL,
  NULL,
  'USD',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  'Active',
  'Supplier base cost only; ancillary charges intentionally outside this dataset.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'DOL-R008',
  'DOL-008',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('The Dolphin Company'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('The Dolphin Company'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('DOL' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('DOL' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('DOL' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('DOL' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('DOL' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('DOL' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('DOL' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('DOL' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('DOL' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('DOL' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'DOL' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'DOL' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'DOL' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'DOL' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('The Dolphin Company')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Dolphin Cat + Dolphin Encounter',
  'Person',
  70.23,
  54.62,
  NULL,
  NULL,
  'USD',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  'Active',
  'Supplier base cost only; ancillary charges intentionally outside this dataset.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'DOL-R009',
  'DOL-009',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('The Dolphin Company'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('The Dolphin Company'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('DOL' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('DOL' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('DOL' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('DOL' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('DOL' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('DOL' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('DOL' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('DOL' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('DOL' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('DOL' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'DOL' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'DOL' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'DOL' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'DOL' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('The Dolphin Company')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Dolphin Cat (básico)',
  'Person',
  50.71,
  39,
  NULL,
  NULL,
  'USD',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  'Active',
  'Supplier base cost only; ancillary charges intentionally outside this dataset.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'DOL-R010',
  'DOL-010',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('The Dolphin Company'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('The Dolphin Company'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('DOL' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('DOL' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('DOL' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('DOL' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('DOL' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('DOL' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('DOL' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('DOL' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('DOL' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('DOL' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'DOL' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'DOL' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'DOL' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'DOL' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('The Dolphin Company')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Isla Mujeres Pleasure',
  'Person',
  25,
  25,
  NULL,
  NULL,
  'USD',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  'Active',
  'Supplier base cost only; ancillary charges intentionally outside this dataset.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'DOL-R011',
  'DOL-011',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('The Dolphin Company'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('The Dolphin Company'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('DOL' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('DOL' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('DOL' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('DOL' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('DOL' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('DOL' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('DOL' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('DOL' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('DOL' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('DOL' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'DOL' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'DOL' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'DOL' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'DOL' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('The Dolphin Company')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Isla Mujeres Pleasure VIP',
  'Person',
  58.52,
  39,
  NULL,
  NULL,
  'USD',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  'Active',
  'Supplier base cost only; ancillary charges intentionally outside this dataset.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'DOL-R012',
  'DOL-012',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('The Dolphin Company'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('The Dolphin Company'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('DOL' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('DOL' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('DOL' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('DOL' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('DOL' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('DOL' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('DOL' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('DOL' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('DOL' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('DOL' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'DOL' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'DOL' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'DOL' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'DOL' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('The Dolphin Company')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Dolphin Royal Connection',
  'Person',
  85.85,
  54.62,
  NULL,
  NULL,
  'USD',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  'Active',
  'Supplier base cost only; ancillary charges intentionally outside this dataset.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'DOL-R013',
  'DOL-013',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('The Dolphin Company'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('The Dolphin Company'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('DOL' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('DOL' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('DOL' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('DOL' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('DOL' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('DOL' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('DOL' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('DOL' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('DOL' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('DOL' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'DOL' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'DOL' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'DOL' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'DOL' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('The Dolphin Company')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Dolphin Connection',
  'Person',
  74.14,
  54.62,
  NULL,
  NULL,
  'USD',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  'Active',
  'Supplier base cost only; ancillary charges intentionally outside this dataset.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'DOL-R014',
  'DOL-014',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('The Dolphin Company'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('The Dolphin Company'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('DOL' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('DOL' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('DOL' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('DOL' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('DOL' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('DOL' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('DOL' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('DOL' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('DOL' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('DOL' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'DOL' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'DOL' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'DOL' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'DOL' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('The Dolphin Company')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Dolphin Encounter',
  'Person',
  62.42,
  54.62,
  NULL,
  NULL,
  'USD',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  'Active',
  'Supplier base cost only; ancillary charges intentionally outside this dataset.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'DOL-R015',
  'DOL-015',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('The Dolphin Company'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('The Dolphin Company'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('DOL' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('DOL' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('DOL' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('DOL' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('DOL' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('DOL' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('DOL' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('DOL' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('DOL' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('DOL' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'DOL' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'DOL' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'DOL' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'DOL' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('The Dolphin Company')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Discovery Especies (Lobos Marinos y Manatíes)',
  'Person',
  62.42,
  54.62,
  NULL,
  NULL,
  'USD',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  'Active',
  'Supplier base cost only; ancillary charges intentionally outside this dataset.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'DOL-R016',
  'DOL-016',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('The Dolphin Company'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('The Dolphin Company'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('DOL' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('DOL' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('DOL' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('DOL' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('DOL' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('DOL' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('DOL' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('DOL' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('DOL' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('DOL' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'DOL' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'DOL' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'DOL' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'DOL' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('The Dolphin Company')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Experiencia Discovery (Meet and Greet)',
  'Person',
  50.71,
  39,
  NULL,
  NULL,
  'USD',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  'Active',
  'Supplier base cost only; ancillary charges intentionally outside this dataset.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'DOL-R017',
  'DOL-017',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('The Dolphin Company'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('The Dolphin Company'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('DOL' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('DOL' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('DOL' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('DOL' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('DOL' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('DOL' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('DOL' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('DOL' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('DOL' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('DOL' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'DOL' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'DOL' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'DOL' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'DOL' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('The Dolphin Company')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Isla Discovery',
  'Person',
  39,
  31.19,
  NULL,
  NULL,
  'USD',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  'Active',
  'Supplier base cost only; ancillary charges intentionally outside this dataset.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'XCA-R001',
  'XCA-001',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Xcaret'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Xcaret'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('XCA' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('XCA' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('XCA' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('XCA' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('XCA' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('XCA' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('XCA' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('XCA' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('XCA' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('XCA' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'XCA' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'XCA' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'XCA' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'XCA' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Xcaret')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Tour Xcaret Full Day Cun/ Rm — Temporada Baja',
  'Person',
  138.75,
  104.06,
  NULL,
  NULL,
  'USD',
  'CUN/RM',
  'Regular',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  true,
  NULL,
  'Active',
  'Apply Xcaret product-specific hotel-zone tariff mapping and the 2026 year-specific season calendar in existing developer annex. Do not reuse 2026 calendar for future years; if unconfigured, require review. Transportation included in supplier package.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'XCA-R002',
  'XCA-002',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Xcaret'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Xcaret'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('XCA' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('XCA' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('XCA' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('XCA' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('XCA' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('XCA' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('XCA' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('XCA' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('XCA' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('XCA' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'XCA' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'XCA' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'XCA' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'XCA' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Xcaret')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Tour Xcaret Plus Cun/ Rm — Temporada Baja',
  'Person',
  161.25,
  120.94,
  NULL,
  NULL,
  'USD',
  'CUN/RM',
  'Regular',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  true,
  NULL,
  'Active',
  'Apply Xcaret product-specific hotel-zone tariff mapping and the 2026 year-specific season calendar in existing developer annex. Do not reuse 2026 calendar for future years; if unconfigured, require review. Transportation included in supplier package.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'XCA-R003',
  'XCA-003',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Xcaret'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Xcaret'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('XCA' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('XCA' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('XCA' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('XCA' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('XCA' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('XCA' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('XCA' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('XCA' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('XCA' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('XCA' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'XCA' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'XCA' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'XCA' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'XCA' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Xcaret')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Tour Xcaret De Noche Rm — Temporada Baja',
  'Person',
  108.75,
  81.56,
  NULL,
  NULL,
  'USD',
  'RM',
  'Regular',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  true,
  NULL,
  'Active',
  'Apply Xcaret product-specific hotel-zone tariff mapping and the 2026 year-specific season calendar in existing developer annex. Do not reuse 2026 calendar for future years; if unconfigured, require review. Transportation included in supplier package.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'XCA-R004',
  'XCA-001',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Xcaret'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Xcaret'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('XCA' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('XCA' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('XCA' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('XCA' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('XCA' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('XCA' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('XCA' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('XCA' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('XCA' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('XCA' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'XCA' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'XCA' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'XCA' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'XCA' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Xcaret')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Tour Xcaret Full Day Pyc/Pdc — Temporada Baja',
  'Person',
  131.25,
  98.44,
  NULL,
  NULL,
  'USD',
  'PYC/PDC',
  'Regular',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  true,
  NULL,
  'Active',
  'Apply Xcaret product-specific hotel-zone tariff mapping and the 2026 year-specific season calendar in existing developer annex. Do not reuse 2026 calendar for future years; if unconfigured, require review. Transportation included in supplier package.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'XCA-R005',
  'XCA-002',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Xcaret'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Xcaret'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('XCA' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('XCA' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('XCA' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('XCA' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('XCA' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('XCA' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('XCA' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('XCA' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('XCA' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('XCA' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'XCA' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'XCA' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'XCA' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'XCA' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Xcaret')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Tour Xcaret Plus Pyc/Pdc — Temporada Baja',
  'Person',
  150.75,
  113.06,
  NULL,
  NULL,
  'USD',
  'PYC/PDC',
  'Regular',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  true,
  NULL,
  'Active',
  'Apply Xcaret product-specific hotel-zone tariff mapping and the 2026 year-specific season calendar in existing developer annex. Do not reuse 2026 calendar for future years; if unconfigured, require review. Transportation included in supplier package.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'XCA-R006',
  'XCA-003',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Xcaret'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Xcaret'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('XCA' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('XCA' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('XCA' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('XCA' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('XCA' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('XCA' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('XCA' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('XCA' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('XCA' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('XCA' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'XCA' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'XCA' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'XCA' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'XCA' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Xcaret')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Tour Xcaret De Noche Pyc/Pdc — Temporada Baja',
  'Person',
  101.25,
  75.94,
  NULL,
  NULL,
  'USD',
  'PYC/PDC',
  'Regular',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  true,
  NULL,
  'Active',
  'Apply Xcaret product-specific hotel-zone tariff mapping and the 2026 year-specific season calendar in existing developer annex. Do not reuse 2026 calendar for future years; if unconfigured, require review. Transportation included in supplier package.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'XCA-R007',
  'XCA-001',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Xcaret'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Xcaret'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('XCA' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('XCA' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('XCA' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('XCA' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('XCA' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('XCA' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('XCA' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('XCA' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('XCA' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('XCA' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'XCA' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'XCA' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'XCA' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'XCA' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Xcaret')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Tour Xcaret Full Day Cun/ Rm — Temporada Alta',
  'Person',
  146.25,
  109.69,
  NULL,
  NULL,
  'USD',
  'CUN/RM',
  'High',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  true,
  NULL,
  'Active',
  'Apply Xcaret product-specific hotel-zone tariff mapping and the 2026 year-specific season calendar in existing developer annex. Do not reuse 2026 calendar for future years; if unconfigured, require review. Transportation included in supplier package.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'XCA-R008',
  'XCA-002',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Xcaret'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Xcaret'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('XCA' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('XCA' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('XCA' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('XCA' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('XCA' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('XCA' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('XCA' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('XCA' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('XCA' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('XCA' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'XCA' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'XCA' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'XCA' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'XCA' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Xcaret')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Tour Xcaret Plus Cun/ Rm — Temporada Alta',
  'Person',
  168.75,
  126.56,
  NULL,
  NULL,
  'USD',
  'CUN/RM',
  'High',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  true,
  NULL,
  'Active',
  'Apply Xcaret product-specific hotel-zone tariff mapping and the 2026 year-specific season calendar in existing developer annex. Do not reuse 2026 calendar for future years; if unconfigured, require review. Transportation included in supplier package.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'XCA-R009',
  'XCA-003',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Xcaret'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Xcaret'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('XCA' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('XCA' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('XCA' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('XCA' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('XCA' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('XCA' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('XCA' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('XCA' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('XCA' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('XCA' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'XCA' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'XCA' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'XCA' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'XCA' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Xcaret')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Tour Xcaret De Noche Rm — Temporada Alta',
  'Person',
  116.25,
  87.19,
  NULL,
  NULL,
  'USD',
  'RM',
  'High',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  true,
  NULL,
  'Active',
  'Apply Xcaret product-specific hotel-zone tariff mapping and the 2026 year-specific season calendar in existing developer annex. Do not reuse 2026 calendar for future years; if unconfigured, require review. Transportation included in supplier package.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'XCA-R010',
  'XCA-001',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Xcaret'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Xcaret'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('XCA' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('XCA' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('XCA' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('XCA' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('XCA' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('XCA' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('XCA' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('XCA' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('XCA' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('XCA' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'XCA' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'XCA' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'XCA' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'XCA' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Xcaret')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Tour Xcaret Full Day Pyc/Pdc — Temporada Alta',
  'Person',
  138.75,
  104.06,
  NULL,
  NULL,
  'USD',
  'PYC/PDC',
  'High',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  true,
  NULL,
  'Active',
  'Apply Xcaret product-specific hotel-zone tariff mapping and the 2026 year-specific season calendar in existing developer annex. Do not reuse 2026 calendar for future years; if unconfigured, require review. Transportation included in supplier package.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'XCA-R011',
  'XCA-002',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Xcaret'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Xcaret'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('XCA' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('XCA' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('XCA' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('XCA' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('XCA' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('XCA' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('XCA' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('XCA' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('XCA' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('XCA' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'XCA' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'XCA' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'XCA' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'XCA' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Xcaret')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Tour Xcaret Plus Pyc/Pdc — Temporada Alta',
  'Person',
  158.25,
  118.69,
  NULL,
  NULL,
  'USD',
  'PYC/PDC',
  'High',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  true,
  NULL,
  'Active',
  'Apply Xcaret product-specific hotel-zone tariff mapping and the 2026 year-specific season calendar in existing developer annex. Do not reuse 2026 calendar for future years; if unconfigured, require review. Transportation included in supplier package.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'XCA-R012',
  'XCA-003',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Xcaret'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Xcaret'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('XCA' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('XCA' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('XCA' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('XCA' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('XCA' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('XCA' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('XCA' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('XCA' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('XCA' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('XCA' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'XCA' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'XCA' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'XCA' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'XCA' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Xcaret')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Tour Xcaret De Noche Pyc/Pdc — Temporada Alta',
  'Person',
  108.75,
  81.56,
  NULL,
  NULL,
  'USD',
  'PYC/PDC',
  'High',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  true,
  NULL,
  'Active',
  'Apply Xcaret product-specific hotel-zone tariff mapping and the 2026 year-specific season calendar in existing developer annex. Do not reuse 2026 calendar for future years; if unconfigured, require review. Transportation included in supplier package.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'XCA-R013',
  'XCA-004',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Xcaret'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Xcaret'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('XCA' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('XCA' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('XCA' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('XCA' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('XCA' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('XCA' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('XCA' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('XCA' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('XCA' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('XCA' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'XCA' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'XCA' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'XCA' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'XCA' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Xcaret')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Tour Xel-Há All Inclusive — Temporada Baja',
  'Person',
  107.25,
  80.44,
  NULL,
  NULL,
  'USD',
  NULL,
  'Regular',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  true,
  NULL,
  'Active',
  'Apply Xcaret product-specific hotel-zone tariff mapping and the 2026 year-specific season calendar in existing developer annex. Do not reuse 2026 calendar for future years; if unconfigured, require review. Transportation included in supplier package.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'XCA-R014',
  'XCA-005',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Xcaret'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Xcaret'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('XCA' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('XCA' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('XCA' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('XCA' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('XCA' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('XCA' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('XCA' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('XCA' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('XCA' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('XCA' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'XCA' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'XCA' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'XCA' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'XCA' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Xcaret')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Tour Tulum Xel-Há All Inclusive — Temporada Baja',
  'Person',
  116.35,
  87.26,
  NULL,
  NULL,
  'USD',
  NULL,
  'Regular',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  true,
  NULL,
  'Active',
  'Apply Xcaret product-specific hotel-zone tariff mapping and the 2026 year-specific season calendar in existing developer annex. Do not reuse 2026 calendar for future years; if unconfigured, require review. Transportation included in supplier package.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'XCA-R015',
  'XCA-004',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Xcaret'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Xcaret'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('XCA' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('XCA' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('XCA' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('XCA' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('XCA' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('XCA' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('XCA' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('XCA' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('XCA' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('XCA' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'XCA' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'XCA' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'XCA' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'XCA' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Xcaret')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Tour Xel-Há All Inclusive — Temporada Alta',
  'Person',
  113.75,
  85.31,
  NULL,
  NULL,
  'USD',
  NULL,
  'High',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  true,
  NULL,
  'Active',
  'Apply Xcaret product-specific hotel-zone tariff mapping and the 2026 year-specific season calendar in existing developer annex. Do not reuse 2026 calendar for future years; if unconfigured, require review. Transportation included in supplier package.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'XCA-R016',
  'XCA-005',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Xcaret'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Xcaret'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('XCA' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('XCA' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('XCA' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('XCA' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('XCA' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('XCA' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('XCA' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('XCA' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('XCA' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('XCA' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'XCA' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'XCA' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'XCA' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'XCA' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Xcaret')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Tour Tulum Xel-Há All Inclusive — Temporada Alta',
  'Person',
  122.85,
  92.14,
  NULL,
  NULL,
  'USD',
  NULL,
  'High',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  true,
  NULL,
  'Active',
  'Apply Xcaret product-specific hotel-zone tariff mapping and the 2026 year-specific season calendar in existing developer annex. Do not reuse 2026 calendar for future years; if unconfigured, require review. Transportation included in supplier package.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'XCA-R017',
  'XCA-006',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Xcaret'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Xcaret'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('XCA' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('XCA' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('XCA' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('XCA' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('XCA' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('XCA' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('XCA' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('XCA' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('XCA' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('XCA' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'XCA' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'XCA' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'XCA' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'XCA' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Xcaret')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Tour Xplor Cun/Rm — Temporada Baja',
  'Person',
  126.75,
  95.06,
  NULL,
  NULL,
  'USD',
  'CUN/RM',
  'Regular',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  true,
  NULL,
  'Active',
  'Apply Xcaret product-specific hotel-zone tariff mapping and the 2026 year-specific season calendar in existing developer annex. Do not reuse 2026 calendar for future years; if unconfigured, require review. Transportation included in supplier package.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'XCA-R018',
  'XCA-006',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Xcaret'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Xcaret'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('XCA' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('XCA' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('XCA' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('XCA' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('XCA' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('XCA' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('XCA' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('XCA' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('XCA' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('XCA' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'XCA' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'XCA' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'XCA' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'XCA' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Xcaret')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Tour Xplor Pyc/Pdc — Temporada Baja',
  'Person',
  120.25,
  90.19,
  NULL,
  NULL,
  'USD',
  'PYC/PDC',
  'Regular',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  true,
  NULL,
  'Active',
  'Apply Xcaret product-specific hotel-zone tariff mapping and the 2026 year-specific season calendar in existing developer annex. Do not reuse 2026 calendar for future years; if unconfigured, require review. Transportation included in supplier package.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'XCA-R019',
  'XCA-006',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Xcaret'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Xcaret'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('XCA' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('XCA' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('XCA' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('XCA' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('XCA' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('XCA' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('XCA' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('XCA' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('XCA' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('XCA' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'XCA' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'XCA' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'XCA' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'XCA' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Xcaret')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Tour Xplor Cun/Rm — Temporada Alta',
  'Person',
  133.25,
  99.94,
  NULL,
  NULL,
  'USD',
  'CUN/RM',
  'High',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  true,
  NULL,
  'Active',
  'Apply Xcaret product-specific hotel-zone tariff mapping and the 2026 year-specific season calendar in existing developer annex. Do not reuse 2026 calendar for future years; if unconfigured, require review. Transportation included in supplier package.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'XCA-R020',
  'XCA-006',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Xcaret'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Xcaret'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('XCA' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('XCA' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('XCA' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('XCA' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('XCA' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('XCA' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('XCA' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('XCA' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('XCA' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('XCA' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'XCA' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'XCA' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'XCA' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'XCA' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Xcaret')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Tour Xplor Pyc/Pdc — Temporada Alta',
  'Person',
  126.75,
  95.06,
  NULL,
  NULL,
  'USD',
  'PYC/PDC',
  'High',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  true,
  NULL,
  'Active',
  'Apply Xcaret product-specific hotel-zone tariff mapping and the 2026 year-specific season calendar in existing developer annex. Do not reuse 2026 calendar for future years; if unconfigured, require review. Transportation included in supplier package.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'XCA-R021',
  'XCA-007',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Xcaret'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Xcaret'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('XCA' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('XCA' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('XCA' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('XCA' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('XCA' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('XCA' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('XCA' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('XCA' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('XCA' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('XCA' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'XCA' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'XCA' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'XCA' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'XCA' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Xcaret')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Tour Xplor Fuego Cun/RM',
  'Person',
  113.75,
  85.31,
  NULL,
  NULL,
  'USD',
  'CUN/RM',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  true,
  NULL,
  'Active',
  'Apply Xcaret product-specific hotel-zone tariff mapping and the 2026 year-specific season calendar in existing developer annex. Do not reuse 2026 calendar for future years; if unconfigured, require review. Transportation included in supplier package.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'XCA-R022',
  'XCA-007',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Xcaret'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Xcaret'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('XCA' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('XCA' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('XCA' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('XCA' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('XCA' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('XCA' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('XCA' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('XCA' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('XCA' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('XCA' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'XCA' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'XCA' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'XCA' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'XCA' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Xcaret')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Tour Xplor Fuego Pyc',
  'Person',
  107.25,
  80.44,
  NULL,
  NULL,
  'USD',
  'PYC/PDC',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  true,
  NULL,
  'Active',
  'Apply Xcaret product-specific hotel-zone tariff mapping and the 2026 year-specific season calendar in existing developer annex. Do not reuse 2026 calendar for future years; if unconfigured, require review. Transportation included in supplier package. Source abbreviation Pyc normalized to PYC/PDC bucket; original rate name preserved.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'XCA-R023',
  'XCA-008',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Xcaret'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Xcaret'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('XCA' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('XCA' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('XCA' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('XCA' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('XCA' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('XCA' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('XCA' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('XCA' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('XCA' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('XCA' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'XCA' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'XCA' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'XCA' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'XCA' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Xcaret')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Tour Xenotes Oasis Maya',
  'Person',
  103.35,
  77.51,
  NULL,
  NULL,
  'USD',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  true,
  NULL,
  'Active',
  'Apply Xcaret product-specific hotel-zone tariff mapping and the 2026 year-specific season calendar in existing developer annex. Do not reuse 2026 calendar for future years; if unconfigured, require review. Transportation included in supplier package.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'XCA-R024',
  'XCA-009',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Xcaret'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Xcaret'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('XCA' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('XCA' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('XCA' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('XCA' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('XCA' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('XCA' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('XCA' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('XCA' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('XCA' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('XCA' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'XCA' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'XCA' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'XCA' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'XCA' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Xcaret')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Tour Xoximilco Cun/Playa Mujeres',
  'Person',
  94.25,
  70.69,
  NULL,
  NULL,
  'USD',
  'CUN/Playa Mujeres',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  true,
  NULL,
  'Active',
  'Apply Xcaret product-specific hotel-zone tariff mapping and the 2026 year-specific season calendar in existing developer annex. Do not reuse 2026 calendar for future years; if unconfigured, require review. Transportation included in supplier package.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'XCA-R025',
  'XCA-009',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Xcaret'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Xcaret'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('XCA' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('XCA' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('XCA' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('XCA' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('XCA' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('XCA' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('XCA' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('XCA' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('XCA' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('XCA' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'XCA' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'XCA' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'XCA' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'XCA' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Xcaret')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Tour Xoximilco RM/ Playa del Carmen',
  'Person',
  100.75,
  75.56,
  NULL,
  NULL,
  'USD',
  'RM/Playa del Carmen',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  true,
  NULL,
  'Active',
  'Apply Xcaret product-specific hotel-zone tariff mapping and the 2026 year-specific season calendar in existing developer annex. Do not reuse 2026 calendar for future years; if unconfigured, require review. Transportation included in supplier package.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'XCA-R026',
  'XCA-010',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Xcaret'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Xcaret'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('XCA' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('XCA' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('XCA' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('XCA' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('XCA' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('XCA' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('XCA' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('XCA' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('XCA' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('XCA' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'XCA' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'XCA' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'XCA' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'XCA' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Xcaret')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Tour Xenses Cun/Rm',
  'Person',
  81.25,
  60.94,
  NULL,
  NULL,
  'USD',
  'CUN/RM',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  true,
  NULL,
  'Active',
  'Apply Xcaret product-specific hotel-zone tariff mapping and the 2026 year-specific season calendar in existing developer annex. Do not reuse 2026 calendar for future years; if unconfigured, require review. Transportation included in supplier package.'
) ON CONFLICT (rate_id) DO NOTHING;

INSERT INTO public.supplier_rates (
  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,
  adult_cost, child_cost, infant_cost, fixed_cost, currency,
  tariff_region, season, days_of_week, departure_area, route,
  min_passengers, max_passengers, transportation_included,
  additional_charges, rate_status, notes
) VALUES (
  'XCA-R027',
  'XCA-010',
  (SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim('Xcaret'))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim('Xcaret'))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR ('XCA' = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR ('XCA' = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR ('XCA' = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR ('XCA' = 'ENV' AND lower(name) LIKE '%envatours%')
      OR ('XCA' = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR ('XCA' = 'MIG' AND lower(name) LIKE '%miguel%')
      OR ('XCA' = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR ('XCA' = 'BAK' AND lower(name) LIKE '%baktun%')
      OR ('XCA' = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR ('XCA' = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN 'XCA' = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN 'XCA' = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN 'XCA' = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN 'XCA' = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim('Xcaret')) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1),
  'Tour Xenses Pyc/Pdc',
  'Person',
  74.75,
  56.06,
  NULL,
  NULL,
  'USD',
  'PYC/PDC',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  true,
  NULL,
  'Active',
  'Apply Xcaret product-specific hotel-zone tariff mapping and the 2026 year-specific season calendar in existing developer annex. Do not reuse 2026 calendar for future years; if unconfigured, require review. Transportation included in supplier package.'
) ON CONFLICT (rate_id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 3. MAPEAMENTO DAS 8 ZONAS HOTEL E FORNECEDORES (public.supplier_zone_mappings)
-- -----------------------------------------------------------------------------
INSERT INTO public.supplier_zone_mappings (hotel_zone, provider_code, tariff_region, rate_id, notes)
VALUES ('Puerto Juarez', 'MIG', 'Cancún Hotel Zone / Downtown', 'MIG-R001', 'Valor USD van 1-7 pax: 39')
ON CONFLICT (hotel_zone, provider_code) DO NOTHING;
INSERT INTO public.supplier_zone_mappings (hotel_zone, provider_code, tariff_region, rate_id, notes)
VALUES ('Puerto Juarez', 'PLY', 'Cancún', 'PLY-R002', 'Saída padrão para Puerto Juarez')
ON CONFLICT (hotel_zone, provider_code) DO NOTHING;
INSERT INTO public.supplier_zone_mappings (hotel_zone, provider_code, tariff_region, rate_id, notes)
VALUES ('Puerto Juarez', 'XCA', 'CUN/RM', NULL, 'Região tarifária Xcaret Core')
ON CONFLICT (hotel_zone, provider_code) DO NOTHING;

INSERT INTO public.supplier_zone_mappings (hotel_zone, provider_code, tariff_region, rate_id, notes)
VALUES ('Isla Blanca', 'MIG', 'Costa Mujeres', 'MIG-R002', 'Valor USD van 1-7 pax: 60')
ON CONFLICT (hotel_zone, provider_code) DO NOTHING;
INSERT INTO public.supplier_zone_mappings (hotel_zone, provider_code, tariff_region, rate_id, notes)
VALUES ('Isla Blanca', 'PLY', 'Cancún', 'PLY-R002', 'Saída padrão para Isla Blanca')
ON CONFLICT (hotel_zone, provider_code) DO NOTHING;
INSERT INTO public.supplier_zone_mappings (hotel_zone, provider_code, tariff_region, rate_id, notes)
VALUES ('Isla Blanca', 'XCA', 'CUN/RM', NULL, 'Região tarifária Xcaret Core')
ON CONFLICT (hotel_zone, provider_code) DO NOTHING;

INSERT INTO public.supplier_zone_mappings (hotel_zone, provider_code, tariff_region, rate_id, notes)
VALUES ('Cancun Center', 'MIG', 'Cancún Hotel Zone / Downtown', 'MIG-R001', 'Valor USD van 1-7 pax: 39')
ON CONFLICT (hotel_zone, provider_code) DO NOTHING;
INSERT INTO public.supplier_zone_mappings (hotel_zone, provider_code, tariff_region, rate_id, notes)
VALUES ('Cancun Center', 'PLY', 'Cancún', 'PLY-R002', 'Saída padrão para Cancun Center')
ON CONFLICT (hotel_zone, provider_code) DO NOTHING;
INSERT INTO public.supplier_zone_mappings (hotel_zone, provider_code, tariff_region, rate_id, notes)
VALUES ('Cancun Center', 'XCA', 'CUN/RM', NULL, 'Região tarifária Xcaret Core')
ON CONFLICT (hotel_zone, provider_code) DO NOTHING;

INSERT INTO public.supplier_zone_mappings (hotel_zone, provider_code, tariff_region, rate_id, notes)
VALUES ('Cancun Hotel Zone', 'MIG', 'Cancún Hotel Zone / Downtown', 'MIG-R001', 'Valor USD van 1-7 pax: 39')
ON CONFLICT (hotel_zone, provider_code) DO NOTHING;
INSERT INTO public.supplier_zone_mappings (hotel_zone, provider_code, tariff_region, rate_id, notes)
VALUES ('Cancun Hotel Zone', 'PLY', 'Cancún', 'PLY-R002', 'Saída padrão para Cancun Hotel Zone')
ON CONFLICT (hotel_zone, provider_code) DO NOTHING;
INSERT INTO public.supplier_zone_mappings (hotel_zone, provider_code, tariff_region, rate_id, notes)
VALUES ('Cancun Hotel Zone', 'XCA', 'CUN/RM', NULL, 'Região tarifária Xcaret Core')
ON CONFLICT (hotel_zone, provider_code) DO NOTHING;

INSERT INTO public.supplier_zone_mappings (hotel_zone, provider_code, tariff_region, rate_id, notes)
VALUES ('Maya Riviera', 'MIG', 'Playa del Carmen', 'MIG-R003', 'Valor USD van 1-7 pax: 65')
ON CONFLICT (hotel_zone, provider_code) DO NOTHING;
INSERT INTO public.supplier_zone_mappings (hotel_zone, provider_code, tariff_region, rate_id, notes)
VALUES ('Maya Riviera', 'PLY', 'Playa del Carmen', 'PLY-R001', 'Saída padrão para Maya Riviera')
ON CONFLICT (hotel_zone, provider_code) DO NOTHING;
INSERT INTO public.supplier_zone_mappings (hotel_zone, provider_code, tariff_region, rate_id, notes)
VALUES ('Maya Riviera', 'XCA', 'CUN/RM', NULL, 'Região tarifária Xcaret Core')
ON CONFLICT (hotel_zone, provider_code) DO NOTHING;

INSERT INTO public.supplier_zone_mappings (hotel_zone, provider_code, tariff_region, rate_id, notes)
VALUES ('Playa del Carmen', 'MIG', 'Playa del Carmen', 'MIG-R003', 'Valor USD van 1-7 pax: 65')
ON CONFLICT (hotel_zone, provider_code) DO NOTHING;
INSERT INTO public.supplier_zone_mappings (hotel_zone, provider_code, tariff_region, rate_id, notes)
VALUES ('Playa del Carmen', 'PLY', 'Playa del Carmen', 'PLY-R001', 'Saída padrão para Playa del Carmen')
ON CONFLICT (hotel_zone, provider_code) DO NOTHING;
INSERT INTO public.supplier_zone_mappings (hotel_zone, provider_code, tariff_region, rate_id, notes)
VALUES ('Playa del Carmen', 'XCA', 'PYC/PDC', NULL, 'Região tarifária Xcaret Core')
ON CONFLICT (hotel_zone, provider_code) DO NOTHING;

INSERT INTO public.supplier_zone_mappings (hotel_zone, provider_code, tariff_region, rate_id, notes)
VALUES ('Tulum Center', 'MIG', 'Tulum Centre', 'MIG-R004', 'Valor USD van 1-7 pax: 120')
ON CONFLICT (hotel_zone, provider_code) DO NOTHING;
INSERT INTO public.supplier_zone_mappings (hotel_zone, provider_code, tariff_region, rate_id, notes)
VALUES ('Tulum Center', 'PLY', 'Playa del Carmen', 'PLY-R001', 'Saída padrão para Tulum Center')
ON CONFLICT (hotel_zone, provider_code) DO NOTHING;
INSERT INTO public.supplier_zone_mappings (hotel_zone, provider_code, tariff_region, rate_id, notes)
VALUES ('Tulum Center', 'XCA', 'CUN/RM', NULL, 'Região tarifária Xcaret Core')
ON CONFLICT (hotel_zone, provider_code) DO NOTHING;

INSERT INTO public.supplier_zone_mappings (hotel_zone, provider_code, tariff_region, rate_id, notes)
VALUES ('Tulum Hotel Zone', 'MIG', 'Tulum Hotel Zone', 'MIG-R005', 'Valor USD van 1-7 pax: 135')
ON CONFLICT (hotel_zone, provider_code) DO NOTHING;
INSERT INTO public.supplier_zone_mappings (hotel_zone, provider_code, tariff_region, rate_id, notes)
VALUES ('Tulum Hotel Zone', 'PLY', 'Playa del Carmen', 'PLY-R001', 'Saída padrão para Tulum Hotel Zone')
ON CONFLICT (hotel_zone, provider_code) DO NOTHING;
INSERT INTO public.supplier_zone_mappings (hotel_zone, provider_code, tariff_region, rate_id, notes)
VALUES ('Tulum Hotel Zone', 'XCA', 'CUN/RM', NULL, 'Região tarifária Xcaret Core')
ON CONFLICT (hotel_zone, provider_code) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 4. JANELAS DE TEMPORADA XCARET 2026 (public.xcaret_season_windows)
-- -----------------------------------------------------------------------------
INSERT INTO public.xcaret_season_windows (effective_year, from_date, to_date, season, applicable_tour_ids)
SELECT 2026, '2026-01-01', '2026-03-29', 'Regular', '{"XCA-001","XCA-002","XCA-003","XCA-004","XCA-005","XCA-006"}'::text[]
WHERE NOT EXISTS (
  SELECT 1 FROM public.xcaret_season_windows
  WHERE effective_year = 2026 AND from_date = '2026-01-01' AND to_date = '2026-03-29'
);
INSERT INTO public.xcaret_season_windows (effective_year, from_date, to_date, season, applicable_tour_ids)
SELECT 2026, '2026-03-30', '2026-04-12', 'High', '{"XCA-001","XCA-002","XCA-003","XCA-004","XCA-005","XCA-006"}'::text[]
WHERE NOT EXISTS (
  SELECT 1 FROM public.xcaret_season_windows
  WHERE effective_year = 2026 AND from_date = '2026-03-30' AND to_date = '2026-04-12'
);
INSERT INTO public.xcaret_season_windows (effective_year, from_date, to_date, season, applicable_tour_ids)
SELECT 2026, '2026-04-13', '2026-06-30', 'Regular', '{"XCA-001","XCA-002","XCA-003","XCA-004","XCA-005","XCA-006"}'::text[]
WHERE NOT EXISTS (
  SELECT 1 FROM public.xcaret_season_windows
  WHERE effective_year = 2026 AND from_date = '2026-04-13' AND to_date = '2026-06-30'
);
INSERT INTO public.xcaret_season_windows (effective_year, from_date, to_date, season, applicable_tour_ids)
SELECT 2026, '2026-07-01', '2026-08-15', 'High', '{"XCA-001","XCA-002","XCA-003","XCA-004","XCA-005","XCA-006"}'::text[]
WHERE NOT EXISTS (
  SELECT 1 FROM public.xcaret_season_windows
  WHERE effective_year = 2026 AND from_date = '2026-07-01' AND to_date = '2026-08-15'
);
INSERT INTO public.xcaret_season_windows (effective_year, from_date, to_date, season, applicable_tour_ids)
SELECT 2026, '2026-08-16', '2026-12-25', 'Regular', '{"XCA-001","XCA-002","XCA-003","XCA-004","XCA-005","XCA-006"}'::text[]
WHERE NOT EXISTS (
  SELECT 1 FROM public.xcaret_season_windows
  WHERE effective_year = 2026 AND from_date = '2026-08-16' AND to_date = '2026-12-25'
);
INSERT INTO public.xcaret_season_windows (effective_year, from_date, to_date, season, applicable_tour_ids)
SELECT 2026, '2026-12-26', '2026-12-31', 'High', '{"XCA-001","XCA-002","XCA-003","XCA-004","XCA-005","XCA-006"}'::text[]
WHERE NOT EXISTS (
  SELECT 1 FROM public.xcaret_season_windows
  WHERE effective_year = 2026 AND from_date = '2026-12-26' AND to_date = '2026-12-31'
);

COMMIT;
