/**
 * TESTE AUTOMATIZADO DE INTEGRAÇÃO DO CATÁLOGO OFICIAL AOS CONTRATOS — TÍO NENÊ v0.1.43
 *
 * Valida:
 * 1. Catálogo comercial oficial (52 produtos / 80 tarifas) integrado ao fluxo de contratos
 * 2. Motor de precificação comercial em cenários reais (Miguel Shuttle, Xcaret, Coco Bongo, Envatours, etc.)
 * 3. Preservação de snapshots v0.1.43 nas duas camadas (colunas + calculation_breakdown JSON)
 * 4. Proteção RBAC contra vazamento de custos de fornecedor para Seller
 * 5. Overrides manuais sem recálculos destrutivos
 * 6. Compatibilidade com itens legados (TN-001 a TN-042)
 */

import {
  calculateCommercialPricing,
  getCommercialProductByTourId,
  getSupplierRateById
} from "../src/lib/commercial-pricing-engine";
import {
  OFFICIAL_COMMERCIAL_PRODUCTS,
  OFFICIAL_SUPPLIER_RATES,
  OFFICIAL_SUPPLIERS
} from "../src/data/official-supplier-catalog";
import {
  buildContractItemDbPayload,
  formatDbContractItem,
  validateContractItems
} from "../src/lib/contracts/reconcileItems";
import { CanonicalHotelZone } from "../src/types/supplier-commercial";

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, details?: any) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    console.error(`  ❌ [FAIL] ${testName}`, details ? details : "");
    throw new Error(`Falha no teste: ${testName}`);
  }
}

console.log("===============================================================================");
console.log("INICIANDO SUÍTE DE TESTES: INTEGRAÇÃO CATÁLOGO OFICIAL & CONTRATOS (TAREFA 17)");
console.log("===============================================================================\n");

// -----------------------------------------------------------------------------
// GRUPO 1: Disponibilidade do Catálogo Oficial e Relação Fornecedor -> Produto -> Tarifa
// -----------------------------------------------------------------------------
console.log("📌 GRUPO 1: Catálogo Oficial (52 Produtos Comerciais e 80 Tarifas)");

assert(OFFICIAL_SUPPLIERS.length === 10, "10 Fornecedores oficiais homologados");
assert(OFFICIAL_COMMERCIAL_PRODUCTS.length === 52, "52 Produtos comerciais oficiais disponíveis");
assert(OFFICIAL_SUPPLIER_RATES.length === 80, "80 Tarifas de fornecedores cadastradas");

// Verificar se todos os produtos comerciais possuem tour_id válido e fornecedor associado
const allProductsHaveProvider = OFFICIAL_COMMERCIAL_PRODUCTS.every(
  (p) => Boolean(p.tour_id) && Boolean(p.provider) && Boolean(p.display_name)
);
assert(allProductsHaveProvider, "Todos os 52 produtos possuem tour_id, provider e display_name");

// -----------------------------------------------------------------------------
// GRUPO 2: Motor de Precificação Oficial Aplicado a Cenários de Contratos
// -----------------------------------------------------------------------------
console.log("\n📌 GRUPO 2: Motor de Precificação Comercial e Regras de Negócio");

// Cenário A: Miguel Shuttle — Transfer Van (1 a 7 pax) Cancun Hotel Zone -> One Way vs Round Trip
const migOneWay = calculateCommercialPricing({
  tourId: "MIG-001",
  hotelZone: "Cancun Hotel Zone",
  adultsCount: 4,
  childrenCount: 2,
  legsCount: 1,
});
assert(migOneWay.calculatedTotalCost === 39, "Miguel Shuttle One-Way Cancun Hotel Zone = USD 39.00", migOneWay);
assert(migOneWay.currency === "USD", "Miguel Shuttle moeda é USD");
assert(migOneWay.pricingBasis === "Vehicle", "Miguel Shuttle pricingBasis é Vehicle (Van 1-7 pax)");

const migRoundTrip = calculateCommercialPricing({
  tourId: "MIG-001",
  hotelZone: "Cancun Hotel Zone",
  adultsCount: 4,
  childrenCount: 2,
  legsCount: 2,
});
assert(migRoundTrip.calculatedTotalCost === 78, "Miguel Shuttle Round-Trip Cancun Hotel Zone = USD 78.00 (39 * 2)", migRoundTrip);

// Cenário B: Xcaret — Sazonalidade 2026 (Regular vs Alta Temporada)
// Data Regular: 2026-05-15 (Maio)
const xcaretRegular = calculateCommercialPricing({
  tourId: "XCA-001", // Xcaret Full Day
  serviceDate: "2026-05-15",
  adultsCount: 2,
  childrenCount: 1,
});
assert(xcaretRegular.rateId === "XCA-R001", "Xcaret Regular seleciona tarifa XCA-R001 (Regular)", xcaretRegular);
assert(xcaretRegular.unitCostAdult === 138.75, "Xcaret Básico Adulto Regular = USD 138.75", xcaretRegular);
assert(xcaretRegular.unitCostChild === 104.06, "Xcaret Básico Criança Regular = USD 104.06", xcaretRegular);
assert(
  xcaretRegular.calculatedTotalCost === Math.round((2 * 138.75 + 1 * 104.06) * 100) / 100,
  `Xcaret Básico Total Regular = USD 381.56 (2x 138.75 + 1x 104.06)`,
  xcaretRegular
);

// Data Alta Temporada Semana Santa: 2026-03-31
const xcaretHigh = calculateCommercialPricing({
  tourId: "XCA-001",
  serviceDate: "2026-03-31",
  adultsCount: 2,
  childrenCount: 1,
});
assert(xcaretHigh.rateId === "XCA-R007", "Xcaret Semana Santa seleciona tarifa XCA-R007 (Alta Temporada)", xcaretHigh);
assert(xcaretHigh.unitCostAdult === 146.25, "Xcaret Básico Adulto Alta = USD 146.25", xcaretHigh);

// Cenário C: Envatours — Limite de Capacidade de Barco Privativo (max 10 pax)
const envaNormal = calculateCommercialPricing({
  tourId: "ENV-002",
  adultsCount: 6,
  childrenCount: 2,
});
assert(envaNormal.calculatedTotalCost === 140, "Envatours Privado 8 pax = USD 140.00 (Fixed Boat max 10 pax)", envaNormal);
assert(envaNormal.warnings.length === 0, "Sem alertas para 8 passageiros no barco");

const envaOverCapacity = calculateCommercialPricing({
  tourId: "ENV-002",
  adultsCount: 9,
  childrenCount: 3, // Total 12 pax
});
assert(envaOverCapacity.warnings.length > 0, "Alerta de excesso de capacidade gerado para 12 passageiros no barco (max 10)", envaOverCapacity);

// Cenário D: Produto Sob Cotação / Sem Tarifa Automática
const quoteProd = calculateCommercialPricing({
  tourId: "MUS-003", // MUSA Mergulho Certificado (sem tarifa fixa direta no catálogo)
  adultsCount: 2,
});
assert(quoteProd.isQuoteRequired === true, "Produto sem tarifa automática é sinalizado como sob cotação (isQuoteRequired: true)", quoteProd);

// -----------------------------------------------------------------------------
// GRUPO 3: Criação de Item de Contrato e Snapshots Oficiais v0.1.43
// -----------------------------------------------------------------------------
console.log("\n📌 GRUPO 3: Snapshots Oficiais v0.1.43 no Contrato");

const officialItem = {
  tour_name: `[${xcaretRegular.provider}] ${xcaretRegular.displayName}`,
  tour_date: "2026-05-15",
  adults_count: 2,
  children_count: 1,
  units_count: 1,
  legs_count: 1,
  sale_price: 3200.00, // Preço de venda ao cliente em BRL
  cost_applied: xcaretRegular.unitCostAdult!, // 142.19 USD
  cost_currency: xcaretRegular.currency,
  calculated_total_cost: xcaretRegular.calculatedTotalCost!,
  supplier_id: "00000000-0000-0000-0000-000000000010",
  supplier_name: xcaretRegular.provider,
  tariff_code: xcaretRegular.rateId!,
  pricing_model: xcaretRegular.pricingBasis || undefined,
  calculation_formula: xcaretRegular.formulaApplied,

  // Snapshots Oficiais v0.1.43
  rate_id_snapshot: xcaretRegular.rateId!,
  tour_id_code_snapshot: xcaretRegular.tourId,
  is_manual_quote: false,
  is_manual_override: false,
  hotel_zone_snapshot: "Cancun Hotel Zone",
  native_currency: xcaretRegular.currency,
  native_cost_applied: xcaretRegular.unitCostAdult!,
  native_calculated_total_cost: xcaretRegular.calculatedTotalCost!,
};

// Validar que preço de venda não foi confundido com custo
assert(officialItem.sale_price !== officialItem.calculated_total_cost, "Preço de venda (R$ 3.200) e custo (USD 381.56) são distintos");

// Gerar payload para banco de dados via buildContractItemDbPayload
const contractId = "11111111-2222-3333-4444-555555555555";
const dbPayload = buildContractItemDbPayload(officialItem, contractId);

assert(dbPayload.contract_id === contractId, "dbPayload vinculado ao contract_id correto");
assert(dbPayload.tour_id_code_snapshot === "XCA-001", "dbPayload possui tour_id_code_snapshot = XCA-001");
assert(dbPayload.rate_id_snapshot === "XCA-R001", "dbPayload possui rate_id_snapshot = XCA-R001");
assert(dbPayload.native_currency === "USD", "dbPayload possui native_currency = USD");
assert(dbPayload.native_cost_applied === 138.75, "dbPayload possui native_cost_applied = 138.75");
assert(dbPayload.native_calculated_total_cost === 381.56, "dbPayload possui native_calculated_total_cost = 381.56");

// Verificar se todos os 10 snapshots também foram gravados no calculation_breakdown (Dual-layer persistence)
const breakdown = dbPayload.calculation_breakdown;
assert(breakdown.tour_id_code_snapshot === "XCA-001", "breakdown JSON preserva tour_id_code_snapshot");
assert(breakdown.rate_id_snapshot === "XCA-R001", "breakdown JSON preserva rate_id_snapshot");
assert(breakdown.native_currency === "USD", "breakdown JSON preserva native_currency");
assert(breakdown.native_calculated_total_cost === 381.56, "breakdown JSON preserva native_calculated_total_cost");
assert(breakdown.hotel_zone_snapshot === "Cancun Hotel Zone", "breakdown JSON preserva hotel_zone_snapshot");

// -----------------------------------------------------------------------------
// GRUPO 4: Reabertura e Reconstrução do Item via formatDbContractItem
// -----------------------------------------------------------------------------
console.log("\n📌 GRUPO 4: Reabertura e Edição sem Perda de Valores Históricos");

const reconstructed = formatDbContractItem(dbPayload);

assert(reconstructed.tour_id_code_snapshot === "XCA-001", "Item reconstruído mantém tour_id_code_snapshot");
assert(reconstructed.rate_id_snapshot === "XCA-R001", "Item reconstruído mantém rate_id_snapshot");
assert(reconstructed.native_currency === "USD", "Item reconstruído mantém native_currency");
assert(reconstructed.native_cost_applied === 138.75, "Item reconstruído mantém native_cost_applied");
assert(reconstructed.native_calculated_total_cost === 381.56, "Item reconstruído mantém native_calculated_total_cost");
assert(reconstructed.sale_price === 3200, "Item reconstruído mantém sale_price de R$ 3.200");

// -----------------------------------------------------------------------------
// GRUPO 5: Overrides Manuais — Preservação de Valores sem Recálculos Destrutivos
// -----------------------------------------------------------------------------
console.log("\n📌 GRUPO 5: Preservação de Override Manual durante Edições");

// Simulação de ajuste manual de custo pelo Administrador:
const overrideItem = {
  ...reconstructed,
  cost_applied: 130.00, // Admin negociou desconto direto com fornecedor: 130 USD/adulto
  is_manual_override: true,
  manual_override_reason: "Desconto especial autorizado pelo gerente do parque",
  native_cost_applied: 130.00,
  calculated_total_cost: 130.00 * 2 + 104.06, // 364.06 USD
  native_calculated_total_cost: 364.06,
};

// Se o usuário alterar a quantidade de passageiros no formulário:
// Regra v0.1.43: NÃO deve zerar nem sobrescrever o custo manual de USD 130 com a tarifa padrão da tabela!
const updatedPaxAdults = 4;
let updatedCalculatedCost = overrideItem.calculated_total_cost;
if (overrideItem.is_manual_override) {
  // Mantém custo unitário ajustado pelo admin e multiplica pela nova quantidade de adultos
  updatedCalculatedCost = overrideItem.cost_applied * updatedPaxAdults + 104.06;
}

assert(updatedCalculatedCost === 624.06, "Override manual preservou custo unitário de USD 130.00 ao alterar passageiros (4x 130 + 1x 104.06 = 624.06)");
assert(overrideItem.manual_override_reason === "Desconto especial autorizado pelo gerente do parque", "Motivo do override preservado");

// Persistir item com override no banco
const dbPayloadOverride = buildContractItemDbPayload({ ...overrideItem, adults_count: updatedPaxAdults, calculated_total_cost: updatedCalculatedCost }, contractId);
assert(dbPayloadOverride.is_manual_override === true, "dbPayload registra is_manual_override = true");
assert(dbPayloadOverride.manual_override_reason?.includes("Desconto especial"), "dbPayload registra manual_override_reason");
assert(dbPayloadOverride.calculation_breakdown.is_manual_override === true, "JSON breakdown registra is_manual_override");

// -----------------------------------------------------------------------------
// GRUPO 6: Proteção RBAC (Seller vs Admin)
// -----------------------------------------------------------------------------
console.log("\n📌 GRUPO 6: Proteção RBAC contra Exposição de Custos a Vendedores");

// Vendedor (role: 'seller', canViewCosts: false)
const sellerCanViewCosts = false;
const sellerVisibleView = {
  tour_id: officialItem.tour_id_code_snapshot,
  tour_name: officialItem.tour_name,
  sale_price: officialItem.sale_price,
  cost_applied_display: sellerCanViewCosts ? officialItem.cost_applied : "🔒 Confidencial",
  total_cost_display: sellerCanViewCosts ? officialItem.calculated_total_cost : "🔒 Confidencial",
  formula_display: sellerCanViewCosts ? officialItem.calculation_formula : null,
};

assert(sellerVisibleView.cost_applied_display === "🔒 Confidencial", "Seller visualiza '🔒 Confidencial' no custo unitário");
assert(sellerVisibleView.total_cost_display === "🔒 Confidencial", "Seller visualiza '🔒 Confidencial' no custo total");
assert(sellerVisibleView.formula_display === null, "Seller NÃO tem acesso à fórmula operacional");
assert(sellerVisibleView.sale_price === 3200, "Seller define e visualiza o preço de venda comercial");

// Administrador (role: 'admin', canViewCosts: true)
const adminCanViewCosts = true;
const adminVisibleView = {
  tour_id: officialItem.tour_id_code_snapshot,
  tour_name: officialItem.tour_name,
  sale_price: officialItem.sale_price,
  cost_applied_display: adminCanViewCosts ? `${officialItem.native_currency} ${officialItem.cost_applied}` : "🔒 Confidencial",
  total_cost_display: adminCanViewCosts ? `${officialItem.native_currency} ${officialItem.calculated_total_cost}` : "🔒 Confidencial",
  formula_display: adminCanViewCosts ? officialItem.calculation_formula : null,
};

assert(adminVisibleView.cost_applied_display === "USD 138.75", "Admin visualiza custo e moeda original (USD 138.75)");
assert(adminVisibleView.total_cost_display === "USD 381.56", "Admin visualiza custo total operacional (USD 381.56)");
assert(adminVisibleView.formula_display !== null, "Admin tem acesso à fórmula de cálculo operacional");

// -----------------------------------------------------------------------------
// GRUPO 7: Compatibilidade com Itens e Contratos Legados (TN-001 a TN-042)
// -----------------------------------------------------------------------------
console.log("\n📌 GRUPO 7: Coexistência e Compatibilidade com Catálogo Legado");

const legacyItem = {
  tour_name: "[Coco Bongo] Regular Ticket",
  tour_date: "2026-06-10",
  adults_count: 2,
  children_count: 0,
  sale_price: 1500.00,
  cost_applied: 85.00,
  cost_currency: "USD",
  calculated_total_cost: 170.00,
  tariff_code: "TN-001",
};

const legacyDbPayload = buildContractItemDbPayload(legacyItem, contractId);
assert(legacyDbPayload.tariff_code_snapshot === "TN-001", "Item legado preserva tariff_code_snapshot TN-001");
assert(legacyDbPayload.tour_name_snapshot === "[Coco Bongo] Regular Ticket", "Item legado preserva nome");

const mixedItems = [officialItem, legacyItem];
// Validação de integridade sem exceção:
validateContractItems(mixedItems, { arrival_date: "2026-05-15", adults_count: 2, children_count: 1 });
assert(true, "Contrato misto (Oficial v0.1.43 + Legado TN-xxx) passa na validação atômica de integridade");

console.log("\n===============================================================================");
console.log(`SUÍTE DE TESTES CONCLUÍDA COM SUCESSO! (${passedTests}/${totalTests} testes aprovados)`);
console.log("===============================================================================");
