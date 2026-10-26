import fs from "fs";
import path from "path";
import {
  OFFICIAL_SUPPLIERS,
  OFFICIAL_COMMERCIAL_PRODUCTS,
  OFFICIAL_SUPPLIER_RATES,
  OFFICIAL_HOTEL_ZONE_MAPPINGS,
  OFFICIAL_XCARET_SEASONS_2026
} from "../src/data/official-supplier-catalog";

function sqlEscape(val: any): string {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "boolean") return val ? "true" : "false";
  if (typeof val === "number") return String(val);
  return `'${String(val).replace(/'/g, "''")}'`;
}

function sqlArray(arr: string[]): string {
  if (!arr || arr.length === 0) return "'{}'::text[]";
  const escaped = arr.map((item) => `"${item.replace(/"/g, '\\"')}"`).join(",");
  return `'{${escaped}}'::text[]`;
}

function getSupplierIdSubquery(providerCode: string, providerName: string): string {
  const p = sqlEscape(providerName);
  const code = sqlEscape(providerCode);

  return `(SELECT id FROM public.suppliers
   WHERE 
      -- 1. Match exato ou por trade_name
      lower(trim(name)) = lower(trim(${p}))
      OR lower(trim(coalesce(trade_name, ''))) = lower(trim(${p}))
      -- 2. Normalização explícita de Grupo Xcaret -> Xcaret
      OR (${code} = 'XCA' AND (
            lower(trim(name)) IN ('xcaret', 'grupo xcaret', 'experiencias xcaret')
            OR lower(trim(coalesce(trade_name, ''))) IN ('xcaret', 'grupo xcaret')
         ))
      -- 3. Normalização explícita de Parasailing, Jet Ski -> Parasailing & Jet Ski
      OR (${code} = 'PJS' AND (
            lower(replace(replace(replace(name, ' ', ''), ',', ''), '&', '')) IN ('parasailingjetski', 'parasailingejetski')
            OR lower(name) LIKE '%parasailing%'
            OR lower(name) LIKE '%jet ski%'
         ))
      -- 4. Normalização explícita de Playamia -> Playa Mía
      OR (${code} = 'PLY' AND (
            lower(replace(replace(name, ' ', ''), 'í', 'i')) IN ('playamia', 'playamiagrandbeachpark')
            OR lower(name) LIKE '%playa m%'
         ))
      -- 5. Demais operadoras com variações de grafia
      OR (${code} = 'ENV' AND lower(name) LIKE '%envatours%')
      OR (${code} = 'DOL' AND lower(name) LIKE '%dolphin%')
      OR (${code} = 'MIG' AND lower(name) LIKE '%miguel%')
      OR (${code} = 'COC' AND lower(name) LIKE '%coco bongo%')
      OR (${code} = 'BAK' AND lower(name) LIKE '%baktun%')
      OR (${code} = 'MTZ' AND lower(name) LIKE '%mtz%')
      OR (${code} = 'MUS' AND lower(name) LIKE '%musa%')
   ORDER BY
     CASE 
       WHEN ${code} = 'XCA' AND lower(trim(name)) = 'xcaret' THEN 1
       WHEN ${code} = 'PJS' AND lower(trim(name)) = 'parasailing & jet ski' THEN 1
       WHEN ${code} = 'PLY' AND lower(trim(name)) = 'playa mía' THEN 1
       WHEN ${code} = 'ENV' AND lower(trim(name)) = 'envatours' THEN 1
       WHEN lower(trim(name)) = lower(trim(${p})) THEN 1
       ELSE 2 
     END,
     created_at ASC
   LIMIT 1)`;
}

function generateSql(): string {
  const lines: string[] = [];

  lines.push("-- =============================================================================");
  lines.push("-- TÍO NENÊ - CARGA OFICIAL DE DADOS: CATÁLOGO COMERCIAL E TARIFAS (v0.1.43)");
  lines.push("-- Arquivo: supabase/scripts/seed_official_catalog_v0143.sql");
  lines.push("--");
  lines.push("-- ATENÇÃO: NÃO EXECUTAR ESTE SCRIPT REMOTAMENTE NESTA TAREFA.");
  lines.push("-- Script idempotente para carga inicial/sincronização do catálogo oficial v0.1.43.");
  lines.push("-- Preserva alterações manuais (ON CONFLICT DO NOTHING) e nunca converte NULL para zero.");
  lines.push("-- Total: 52 produtos comerciais, 80 tarifas operacionais, 8 zonas e 6 temporadas.");
  lines.push("-- =============================================================================");
  lines.push("");
  lines.push("BEGIN;");
  lines.push("");

  // 1. Produtos Comerciais (52)
  lines.push("-- -----------------------------------------------------------------------------");
  lines.push("-- 1. CARGA DOS 52 PRODUTOS COMERCIAIS (public.commercial_products)");
  lines.push("-- -----------------------------------------------------------------------------");
  for (const p of OFFICIAL_COMMERCIAL_PRODUCTS) {
    const canonicalSupplier = OFFICIAL_SUPPLIERS.find((s) => s.code === p.provider_code);
    const canonicalName = canonicalSupplier ? canonicalSupplier.name : p.provider;
    const providerSql = sqlEscape(canonicalName);
    const supplierIdSubquery = getSupplierIdSubquery(p.provider_code, canonicalName);

    lines.push(`INSERT INTO public.commercial_products (`);
    lines.push(`  tour_id, provider, provider_code, supplier_id, supplier_product_name,`);
    lines.push(`  display_name, product_type, product_subtype, seller_visible, status,`);
    lines.push(`  pricing_model_default, requires_ancillary_booking, ancillary_notes`);
    lines.push(`) VALUES (`);
    lines.push(`  ${sqlEscape(p.tour_id)},`);
    lines.push(`  ${providerSql},`);
    lines.push(`  ${sqlEscape(p.provider_code)},`);
    lines.push(`  ${supplierIdSubquery},`);
    lines.push(`  ${sqlEscape(p.supplier_product_name)},`);
    lines.push(`  ${sqlEscape(p.display_name)},`);
    lines.push(`  ${sqlEscape(p.product_type)},`);
    lines.push(`  ${sqlEscape(p.product_subtype || null)},`);
    lines.push(`  ${sqlEscape(p.seller_visible)},`);
    lines.push(`  ${sqlEscape(p.status)},`);
    lines.push(`  ${sqlEscape(p.pricing_model_default || "Person")},`);
    lines.push(`  ${sqlEscape(p.requires_ancillary_booking || false)},`);
    lines.push(`  ${sqlEscape(p.ancillary_notes || null)}`);
    lines.push(`) ON CONFLICT (tour_id) DO NOTHING;`);
    lines.push("");
  }

  // 2. Tarifas Operacionais de Fornecedores (80)
  lines.push("-- -----------------------------------------------------------------------------");
  lines.push("-- 2. CARGA DAS 80 TARIFAS OFICIAIS DE FORNECEDORES (public.supplier_rates)");
  lines.push("-- -----------------------------------------------------------------------------");
  for (const r of OFFICIAL_SUPPLIER_RATES) {
    const prod = OFFICIAL_COMMERCIAL_PRODUCTS.find((p) => p.tour_id === r.tour_id);
    const providerCode = prod?.provider_code || r.rate_id.substring(0, 3);
    const canonicalSupplier = OFFICIAL_SUPPLIERS.find((s) => s.code === providerCode);
    const canonicalName = canonicalSupplier ? canonicalSupplier.name : (prod ? prod.provider : "Unknown");
    const supplierIdSubquery = getSupplierIdSubquery(providerCode, canonicalName);

    lines.push(`INSERT INTO public.supplier_rates (`);
    lines.push(`  rate_id, tour_id, supplier_id, supplier_rate_name, pricing_basis,`);
    lines.push(`  adult_cost, child_cost, infant_cost, fixed_cost, currency,`);
    lines.push(`  tariff_region, season, days_of_week, departure_area, route,`);
    lines.push(`  min_passengers, max_passengers, transportation_included,`);
    lines.push(`  additional_charges, rate_status, notes`);
    lines.push(`) VALUES (`);
    lines.push(`  ${sqlEscape(r.rate_id)},`);
    lines.push(`  ${sqlEscape(r.tour_id)},`);
    lines.push(`  ${supplierIdSubquery},`);
    lines.push(`  ${sqlEscape(r.supplier_rate_name)},`);
    lines.push(`  ${sqlEscape(r.pricing_basis)},`);
    lines.push(`  ${sqlEscape(r.adult_cost)},`);
    lines.push(`  ${sqlEscape(r.child_cost)},`);
    lines.push(`  ${sqlEscape(r.infant_cost ?? null)},`);
    lines.push(`  ${sqlEscape(r.fixed_cost)},`);
    lines.push(`  ${sqlEscape(r.currency)},`);
    lines.push(`  ${sqlEscape(r.tariff_region || null)},`);
    lines.push(`  ${sqlEscape(r.season || null)},`);
    lines.push(`  ${sqlEscape(r.days_of_week || null)},`);
    lines.push(`  ${sqlEscape(r.departure_area || null)},`);
    lines.push(`  ${sqlEscape(r.route || null)},`);
    lines.push(`  ${sqlEscape(r.min_passengers ?? null)},`);
    lines.push(`  ${sqlEscape(r.max_passengers ?? null)},`);
    lines.push(`  ${sqlEscape(r.transportation_included || false)},`);
    lines.push(`  ${sqlEscape(r.additional_charges || null)},`);
    lines.push(`  ${sqlEscape(r.rate_status)},`);
    lines.push(`  ${sqlEscape(r.notes || null)}`);
    lines.push(`) ON CONFLICT (rate_id) DO NOTHING;`);
    lines.push("");
  }

  // 3. Zonas Hoteleiras
  lines.push("-- -----------------------------------------------------------------------------");
  lines.push("-- 3. MAPEAMENTO DAS 8 ZONAS HOTEL E FORNECEDORES (public.supplier_zone_mappings)");
  lines.push("-- -----------------------------------------------------------------------------");
  for (const z of OFFICIAL_HOTEL_ZONE_MAPPINGS) {
    // Miguel Shuttle mapping
    lines.push(`INSERT INTO public.supplier_zone_mappings (hotel_zone, provider_code, tariff_region, rate_id, notes)`);
    lines.push(`VALUES (${sqlEscape(z.hotel_zone)}, 'MIG', ${sqlEscape(z.miguel_tariff_name)}, ${sqlEscape(z.miguel_rate_id)}, ${sqlEscape("Valor USD van 1-7 pax: " + z.miguel_usd_vehicle)})`);
    lines.push(`ON CONFLICT (hotel_zone, provider_code) DO NOTHING;`);

    // Playa Mia mapping
    lines.push(`INSERT INTO public.supplier_zone_mappings (hotel_zone, provider_code, tariff_region, rate_id, notes)`);
    lines.push(`VALUES (${sqlEscape(z.hotel_zone)}, 'PLY', ${sqlEscape(z.playa_mia_departure)}, ${sqlEscape(z.playa_mia_rate_id)}, ${sqlEscape("Saída padrão para " + z.hotel_zone)})`);
    lines.push(`ON CONFLICT (hotel_zone, provider_code) DO NOTHING;`);

    // Xcaret Core mapping
    lines.push(`INSERT INTO public.supplier_zone_mappings (hotel_zone, provider_code, tariff_region, rate_id, notes)`);
    lines.push(`VALUES (${sqlEscape(z.hotel_zone)}, 'XCA', ${sqlEscape(z.xcaret_core_region)}, NULL, ${sqlEscape("Região tarifária Xcaret Core")})`);
    lines.push(`ON CONFLICT (hotel_zone, provider_code) DO NOTHING;`);
    lines.push("");
  }

  // 4. Temporadas Xcaret 2026
  lines.push("-- -----------------------------------------------------------------------------");
  lines.push("-- 4. JANELAS DE TEMPORADA XCARET 2026 (public.xcaret_season_windows)");
  lines.push("-- -----------------------------------------------------------------------------");
  for (const s of OFFICIAL_XCARET_SEASONS_2026) {
    lines.push(`INSERT INTO public.xcaret_season_windows (effective_year, from_date, to_date, season, applicable_tour_ids)`);
    lines.push(`SELECT 2026, ${sqlEscape(s.from_date)}, ${sqlEscape(s.to_date)}, ${sqlEscape(s.season)}, ${sqlArray(s.applicable_tour_ids)}`);
    lines.push(`WHERE NOT EXISTS (`);
    lines.push(`  SELECT 1 FROM public.xcaret_season_windows`);
    lines.push(`  WHERE effective_year = 2026 AND from_date = ${sqlEscape(s.from_date)} AND to_date = ${sqlEscape(s.to_date)}`);
    lines.push(`);`);
  }

  lines.push("");
  lines.push("COMMIT;");
  lines.push("");

  return lines.join("\n");
}

const outputPath = path.resolve(__dirname, "../supabase/scripts/seed_official_catalog_v0143.sql");
const sql = generateSql();
fs.writeFileSync(outputPath, sql, "utf8");
console.log(`Script de carga oficial gerado com sucesso em: ${outputPath}`);
console.log(`Total de produtos: ${OFFICIAL_COMMERCIAL_PRODUCTS.length}`);
console.log(`Total de tarifas: ${OFFICIAL_SUPPLIER_RATES.length}`);
console.log(`Total de zonas: ${OFFICIAL_HOTEL_ZONE_MAPPINGS.length}`);
console.log(`Total de temporadas Xcaret: ${OFFICIAL_XCARET_SEASONS_2026.length}`);
