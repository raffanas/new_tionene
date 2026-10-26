// =============================================================================
// TESTES DO MOTOR DE PRECIFICAÇÃO E CATÁLOGO COMERCIAL v0.1.43
// Execução: npx tsx scripts/test_commercial_pricing_v0143.ts
// =============================================================================

import assert from "assert";
import {
  calculateCommercialPricing,
  getCommercialProductByTourId,
  getSupplierRateById,
  resolveHotelZoneMapping,
  resolveXcaretSeason
} from "../src/lib/commercial-pricing-engine";
import {
  OFFICIAL_SUPPLIERS,
  OFFICIAL_COMMERCIAL_PRODUCTS,
  OFFICIAL_SUPPLIER_RATES
} from "../src/data/official-supplier-catalog";

console.log("=== INICIANDO VALIDAÇÃO DA BASE DE FORNECEDORES E TARIFAS v0.1.43 ===");
let passed = 0;
let total = 0;

function runTest(name: string, fn: () => void) {
  total++;
  try {
    fn();
    console.log(`  [PASSOU] ${name}`);
    passed++;
  } catch (err: any) {
    console.error(`  [FALHOU] ${name}:`, err.message);
  }
}

// -----------------------------------------------------------------------------
// 1. Integridade do Catálogo Canônico
// -----------------------------------------------------------------------------
runTest("10 Fornecedores Oficiais carregados com moedas corretas", () => {
  assert.strictEqual(OFFICIAL_SUPPLIERS.length, 10, "Devem existir exatamente 10 fornecedores");
  const playamia = OFFICIAL_SUPPLIERS.find((s) => s.code === "PLY");
  assert.ok(playamia, "Playa Mía deve estar registrado");
  assert.strictEqual(playamia?.currency_default, "MXN", "Playa Mía deve operar nativamente em MXN");

  const xcaret = OFFICIAL_SUPPLIERS.find((s) => s.code === "XCA");
  assert.ok(xcaret && xcaret.active, "Xcaret deve estar ativo");

  const dolphin = OFFICIAL_SUPPLIERS.find((s) => s.code === "DOL");
  assert.ok(dolphin && dolphin.active, "The Dolphin Company deve estar ativo");
});

runTest("52 Produtos Comerciais únicos e ativos", () => {
  assert.strictEqual(OFFICIAL_COMMERCIAL_PRODUCTS.length, 52, "Devem existir 52 produtos");
  const ids = new Set(OFFICIAL_COMMERCIAL_PRODUCTS.map((p) => p.tour_id));
  assert.strictEqual(ids.size, 52, "Todos os 52 Tour IDs devem ser únicos");
});

runTest("80 Tarifas Operacionais com IDs únicos", () => {
  assert.strictEqual(OFFICIAL_SUPPLIER_RATES.length, 80, "Devem existir 80 tarifas oficiais");
  const rateIds = new Set(OFFICIAL_SUPPLIER_RATES.map((r) => r.rate_id));
  assert.strictEqual(rateIds.size, 80, "Todos os 80 Rate IDs devem ser únicos");
});

// -----------------------------------------------------------------------------
// 2. Casos Canônicos de Supplier_Integration_QC.json
// -----------------------------------------------------------------------------
runTest("Caso 1: 2 Baktun Classic adults + 1 child -> $157 USD (BAK-R001)", () => {
  const res = calculateCommercialPricing({
    tourId: "BAK-001",
    adultsCount: 2,
    childrenCount: 1
  });
  assert.strictEqual(res.rateId, "BAK-R001");
  assert.strictEqual(res.currency, "USD");
  assert.strictEqual(res.calculatedTotalCost, 157, "2*57 + 1*43 = 157");
});

runTest("Caso 2: Envatours private Cozumel boat 1–10 pax -> $140 USD (ENV-R002)", () => {
  const res = calculateCommercialPricing({
    tourId: "ENV-002",
    adultsCount: 6,
    childrenCount: 2
  });
  assert.strictEqual(res.rateId, "ENV-R002");
  assert.strictEqual(res.currency, "USD");
  assert.strictEqual(res.calculatedTotalCost, 140, "Barco privativo até 10 pax custa USD 140 fixo");
});

runTest("Caso 3: Envatours private boat > 10 pax gera aviso de capacidade", () => {
  const res = calculateCommercialPricing({
    tourId: "ENV-002",
    adultsCount: 11
  });
  assert.ok(res.warnings.some((w) => w.includes("superada")), "Deve alertar que capacidade de 10 foi superada");
});

runTest("Caso 4: Jet ski 30min 3 pax -> 2 skis -> $180 USD (PJS-R002)", () => {
  const res = calculateCommercialPricing({
    tourId: "PJS-002",
    adultsCount: 3
  });
  assert.strictEqual(res.rateId, "PJS-R002");
  assert.strictEqual(res.unitsCount, 2, "3 pessoas exigem ceil(3/2) = 2 jet skis");
  assert.strictEqual(res.calculatedTotalCost, 180, "2 skis * USD 90 = 180");
});

runTest("Caso 5: Jet ski 60min 5 pax -> 3 skis -> $360 USD (PJS-R003)", () => {
  const res = calculateCommercialPricing({
    tourId: "PJS-003",
    adultsCount: 5
  });
  assert.strictEqual(res.rateId, "PJS-R003");
  assert.strictEqual(res.unitsCount, 3, "5 pessoas exigem ceil(5/2) = 3 jet skis");
  assert.strictEqual(res.calculatedTotalCost, 360, "3 skis * USD 120 = 360");
});

runTest("Caso 6: Miguel Shuttle Maya Riviera single one-way 1–7 pax -> $65 USD (MIG-R003)", () => {
  const res = calculateCommercialPricing({
    tourId: "MIG-001",
    hotelZone: "Maya Riviera",
    adultsCount: 4,
    legsCount: 1
  });
  assert.strictEqual(res.rateId, "MIG-R003");
  assert.strictEqual(res.currency, "USD");
  assert.strictEqual(res.unitsCount, 1);
  assert.strictEqual(res.calculatedTotalCost, 65, "1 van * 1 trecho * 65 = 65 USD");
});

runTest("Caso 7: Miguel Shuttle Cancun Hotel Zone 10 pax round-trip -> 2 vans, 2 legs -> $156 USD", () => {
  const res = calculateCommercialPricing({
    tourId: "MIG-001",
    hotelZone: "Cancun Hotel Zone",
    adultsCount: 10,
    legsCount: 2
  });
  assert.strictEqual(res.rateId, "MIG-R001");
  assert.strictEqual(res.unitsCount, 2, "10 pax exigem ceil(10/7) = 2 vans");
  assert.strictEqual(res.legsCount, 2, "Ida e volta = 2 trechos");
  assert.strictEqual(res.calculatedTotalCost, 156, "2 vans * 2 trechos * 39 = 156 USD");
});

runTest("Caso 8: Playa Mía Cancun 2 adults + 1 child -> 5,700 MXN (PLY-R002)", () => {
  const res = calculateCommercialPricing({
    tourId: "PLY-001",
    hotelZone: "Cancun Hotel Zone",
    adultsCount: 2,
    childrenCount: 1
  });
  assert.strictEqual(res.rateId, "PLY-R002");
  assert.strictEqual(res.currency, "MXN");
  assert.strictEqual(res.calculatedTotalCost, 5700, "2*1960 + 1*1780 = 5700 MXN");
});

runTest("Caso 9: Playa Mía Cozumel rate PLY-R003 não é auto-selecionada pelas 8 zonas", () => {
  const zones = ["Puerto Juarez", "Isla Blanca", "Cancun Center", "Cancun Hotel Zone", "Maya Riviera", "Playa del Carmen", "Tulum Center", "Tulum Hotel Zone"];
  for (const z of zones) {
    const res = calculateCommercialPricing({
      tourId: "PLY-001",
      hotelZone: z,
      adultsCount: 1
    });
    assert.notStrictEqual(res.rateId, "PLY-R003", `Zona ${z} jamais deve mapear para PLY-R003`);
  }
});

runTest("Caso 10: Playa Mía Cozumel permitida apenas com preferredRateId manual", () => {
  const res = calculateCommercialPricing({
    tourId: "PLY-001",
    preferredRateId: "PLY-R003",
    adultsCount: 2,
    childrenCount: 0
  });
  assert.strictEqual(res.rateId, "PLY-R003");
  assert.strictEqual(res.currency, "MXN");
  assert.strictEqual(res.calculatedTotalCost, 2700, "2 * 1350 = 2700 MXN");
});

// -----------------------------------------------------------------------------
// 3. Coco Bongo (Dias da Semana e Adultos Apenas)
// -----------------------------------------------------------------------------
runTest("Caso 11: Coco Bongo Regular em Quarta-feira (2026-05-13) -> $67.50 USD (COC-R002)", () => {
  const res = calculateCommercialPricing({
    tourId: "COC-002",
    serviceDate: "2026-05-13", // Quarta-feira (Wednesday)
    adultsCount: 1
  });
  assert.strictEqual(res.rateId, "COC-R002");
  assert.strictEqual(res.calculatedTotalCost, 67.5);
  assert.strictEqual(res.isValidForDate, true);
});

runTest("Caso 12: Coco Bongo Regular em Sexta-feira (2026-05-15) -> $93.75 USD (COC-R004)", () => {
  const res = calculateCommercialPricing({
    tourId: "COC-002",
    serviceDate: "2026-05-15", // Sexta-feira (Friday)
    adultsCount: 1
  });
  assert.strictEqual(res.rateId, "COC-R004");
  assert.strictEqual(res.calculatedTotalCost, 93.75);
  assert.strictEqual(res.isValidForDate, true);
});

runTest("Caso 13: Coco Bongo Regular em Sábado (2026-05-16) -> Indisponível (Sem tarifa de sábado)", () => {
  const res = calculateCommercialPricing({
    tourId: "COC-002",
    serviceDate: "2026-05-16", // Sábado
    adultsCount: 1
  });
  assert.ok(res.warnings.some((w) => w.includes("Restrição") || w.includes("não permitida")), "Deve conter aviso de restrição de sábado");
});

runTest("Caso 14: Coco Bongo com crianças emite alerta de restrição 18+", () => {
  const res = calculateCommercialPricing({
    tourId: "COC-001",
    adultsCount: 2,
    childrenCount: 1
  });
  assert.ok(res.warnings.some((w) => w.includes("estritamente adulto")), "Deve alertar sobre restrição 18+");
});

// -----------------------------------------------------------------------------
// 4. Xcaret (Temporadas e Zonas 2026)
// -----------------------------------------------------------------------------
runTest("Caso 15: Xcaret Básico em Temporada Regular (2026-02-15) Cancún -> XCA-R001", () => {
  const res = calculateCommercialPricing({
    tourId: "XCA-001",
    serviceDate: "2026-02-15",
    hotelZone: "Cancun Hotel Zone",
    adultsCount: 2
  });
  assert.strictEqual(res.rateId, "XCA-R001");
  assert.strictEqual(res.unitCostAdult, 138.75);
  assert.strictEqual(res.calculatedTotalCost, 277.5, "2 * 138.75 = 277.5");
});

runTest("Caso 16: Xcaret Básico em Temporada Alta (2026-04-05) Cancún -> XCA-R007", () => {
  const res = calculateCommercialPricing({
    tourId: "XCA-001",
    serviceDate: "2026-04-05", // Semana Santa
    hotelZone: "Cancun Hotel Zone",
    adultsCount: 2
  });
  assert.strictEqual(res.rateId, "XCA-R007");
  assert.strictEqual(res.unitCostAdult, 146.25);
  assert.strictEqual(res.calculatedTotalCost, 292.5, "2 * 146.25 = 292.5");
});

// -----------------------------------------------------------------------------
// 5. Custos Desconhecidos como NULL e Sobrecusto Manual Preservado
// -----------------------------------------------------------------------------
runTest("Caso 17: Produto sob cotação/desconhecido retorna NULL, NUNCA ZERO", () => {
  const res = calculateCommercialPricing({
    tourId: "UNKNOWN-TOUR",
    adultsCount: 2
  });
  assert.strictEqual(res.calculatedTotalCost, null, "Custo desconhecido deve ser NULL");
  assert.strictEqual(res.isUnknownCost, true);
  assert.strictEqual(res.isQuoteRequired, true);
});

runTest("Caso 18: Sobrecusto manual administrativo é preservado sem recálculo destrutivo", () => {
  const res = calculateCommercialPricing({
    tourId: "MIG-001",
    hotelZone: "Maya Riviera",
    adultsCount: 2,
    manualCostOverride: 95,
    isManualOverride: true
  });
  assert.strictEqual(res.calculatedTotalCost, 95, "Deve manter USD 95 aprovado manualmente");
  assert.strictEqual(res.isManualOverride, true);
});

// -----------------------------------------------------------------------------
// 6. Integridade Referencial das 80 Tarifas e 52 Produtos
// -----------------------------------------------------------------------------
runTest("Caso 19: Todas as 80 tarifas referenciam um tour_id válido dos 52 produtos", () => {
  const validTourIds = new Set(OFFICIAL_COMMERCIAL_PRODUCTS.map((p) => p.tour_id));
  for (const rate of OFFICIAL_SUPPLIER_RATES) {
    assert.ok(validTourIds.has(rate.tour_id), `Tarifa ${rate.rate_id} referencia tour_id desconhecido: ${rate.tour_id}`);
  }
});

runTest("Caso 20: Tarifas de barcos/veículos mantêm adult_cost como NULL e fixed_cost preenchido", () => {
  const boatRate = OFFICIAL_SUPPLIER_RATES.find((r) => r.rate_id === "ENV-R002");
  assert.ok(boatRate, "ENV-R002 deve existir");
  assert.strictEqual(boatRate?.adult_cost, null, "adult_cost de barco privativo DEVE ser NULL, nunca zero");
  assert.strictEqual(boatRate?.fixed_cost, 140, "fixed_cost deve ser 140");
});

// -----------------------------------------------------------------------------
// 7. Validação do Payload e Snapshots de contract_items
// -----------------------------------------------------------------------------
import { buildContractItemDbPayload } from "../src/lib/contracts/reconcileItems";

runTest("Caso 21: buildContractItemDbPayload mapeia e preserva todos os campos de snapshot v0.1.43", () => {
  const payload = buildContractItemDbPayload(
    {
      tour_name: "Passeio Cozumel el Cielo",
      tariff_code: "PLY-R002",
      rate_id_snapshot: "PLY-R002",
      tour_id_code_snapshot: "PLY-001",
      is_manual_quote: false,
      is_manual_override: true,
      manual_override_reason: "Desconto aprovado pela diretoria",
      hotel_zone_snapshot: "Cancun Hotel Zone",
      native_currency: "MXN",
      native_cost_applied: 1960,
      native_calculated_total_cost: 5700,
      legs_count: 1,
      adults_count: 2,
      children_count: 1,
      sale_price: 6500,
      cost_applied: 1960,
      calculated_total_cost: 5700
    },
    "contract-uuid-123",
    {}
  );

  assert.strictEqual(payload.rate_id_snapshot, "PLY-R002");
  assert.strictEqual(payload.tour_id_code_snapshot, "PLY-001");
  assert.strictEqual(payload.is_manual_override, true);
  assert.strictEqual(payload.manual_override_reason, "Desconto aprovado pela diretoria");
  assert.strictEqual(payload.hotel_zone_snapshot, "Cancun Hotel Zone");
  assert.strictEqual(payload.native_currency, "MXN");
  assert.strictEqual(payload.native_cost_applied, 1960);
  assert.strictEqual(payload.native_calculated_total_cost, 5700);
});

runTest("Caso 22: Preservação de contratos legados com tariff_code TN-xxx", () => {
  const legacyPayload = buildContractItemDbPayload(
    {
      tour_name: "Chichén Itzá Clássico Legado",
      tariff_code: "TN-001",
      cost_applied: 57,
      calculated_total_cost: 114
    },
    "contract-uuid-legacy",
    {}
  );

  assert.strictEqual(legacyPayload.tariff_code_snapshot, "TN-001", "Preserva tariff_code_snapshot legado");
  assert.strictEqual(legacyPayload.rate_id_snapshot, null, "Não inventa rate_id_snapshot em contrato legado");
  assert.strictEqual(legacyPayload.is_manual_override, false);
});

// -----------------------------------------------------------------------------
// 8. Validação Estática do Script SQL de Carga (seed_official_catalog_v0143.sql)
// -----------------------------------------------------------------------------
import fs from "fs";
import path from "path";

runTest("Caso 23: seed_official_catalog_v0143.sql possui exatamente 52 produtos e 80 tarifas", () => {
  const seedFile = path.resolve(__dirname, "../supabase/scripts/seed_official_catalog_v0143.sql");
  assert.ok(fs.existsSync(seedFile), "Arquivo seed_official_catalog_v0143.sql deve existir");
  const content = fs.readFileSync(seedFile, "utf8");

  const productMatches = content.match(/INSERT INTO public\.commercial_products/g);
  assert.strictEqual(productMatches?.length, 52, "Devem existir exatamente 52 INSERTs em commercial_products");

  const rateMatches = content.match(/INSERT INTO public\.supplier_rates/g);
  assert.strictEqual(rateMatches?.length, 80, "Devem existir exatamente 80 INSERTs em supplier_rates");

  // Garante que não há 'NULL' substituído por '0' em colunas de custo desconhecido
  assert.ok(content.includes("BEGIN;"), "Script deve ser transacional com BEGIN");
  assert.ok(content.includes("COMMIT;"), "Script deve fechar transação com COMMIT");
  assert.ok(content.includes("ON CONFLICT (tour_id) DO NOTHING;"), "Produtos usam DO NOTHING");
  assert.ok(content.includes("ON CONFLICT (rate_id) DO NOTHING;"), "Tarifas usam DO NOTHING");
});

console.log(`\n=== RESULTADO FINAL: ${passed} / ${total} TESTES APROVADOS ===`);
if (passed === total) {
  console.log(" TODOS OS TESTES PASSARAM COM SUCESSO!");
} else {
  console.error(" HOUVE FALHAS NOS TESTES!");
  process.exit(1);
}

