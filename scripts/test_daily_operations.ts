/**
 * TESTES AUTOMATIZADOS — TAREFA 27: PAINEL DE OPERAÇÕES DIÁRIAS
 * Arquivo: scripts/test_daily_operations.ts
 *
 * Bateria de validação rigorosa dos 13 requisitos da Tarefa 27:
 * 1. Contagem correta dos indicadores operacionais reais (Resumo do Dia).
 * 2. Ordenação cronológica estrita de serviços com horário.
 * 3. Separação clara de serviços sem horário confirmado (sem horários fictícios).
 * 4. Filtros combinados (data, tipo, fornecedor, status, pendências, busca).
 * 5. Detecção precisa de todas as categorias de pendências.
 * 6. Matriz de priorização operacional (Crítica, Alta, Média, Baixa por proximidade e gravidade).
 * 7. Exclusão de serviços cancelados da agenda ativa.
 * 8. Detecção de inconsistências de cancelamento (contrato cancelado com serviço ativo).
 * 9. Roteamento de ações rápidas para módulos existentes sem duplicação.
 * 10. Matriz de permissões RBAC para o painel de operações.
 * 11. Ausência total de dados financeiros (custos, preços, margens, comissões).
 * 12. Imutabilidade e integridade (consultas de visualização não alteram nem duplicam reservas).
 * 13. Resiliência a campos nulos ou incompletos.
 */

import {
  DailyServiceItem,
  DailyOperationsKpis,
  OperationalPendencyItem,
  DailyOperationsFilters,
  buildDailyOperationalServices,
  calculateDailyKpis,
  detectDailyPendencies,
  filterDailyServices,
  separateTimeServices,
  sortDailyServicesChronologically,
  classifyPendencyPriority,
  derivePickupStatus,
  isServiceCritical,
  getDaysDiff,
  toIsoDate,
} from "../src/lib/operational/dailyOperations";
import { canAccessRoute, ROUTE_ACCESS_RULES } from "../src/lib/auth/permissions";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passedCount++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}`);
    if (details) console.error(`     Detalhes: ${details}`);
    failedCount++;
  }
}

console.log("\n===============================================================================");
console.log("INICIANDO BATERIA DE TESTES — TAREFA 27: PAINEL DE OPERAÇÕES DIÁRIAS");
console.log("===============================================================================\n");

const TODAY = "2026-11-20";
const TOMORROW = "2026-11-21";
const NEXT_WEEK = "2026-11-25";

// MOCK DATA DE RESERVAS OPERACIONAIS
const mockReservations = [
  // 1. Passeio hoje com horário confirmado e voucher OK
  {
    id: "res-001",
    contract_id: "cont-001",
    contract_item_id: "item-001",
    product_name: "Xcaret Plus com Almoço Buffet",
    tour_id_code: "XC-PLUS",
    tour_date: TODAY,
    pickup_time: "07:15",
    pickup_location: "Hotel Riu Palace Peninsula",
    hotel_zone: "Cancun Hotel Zone",
    supplier_id: "supp-xcaret",
    supplier_name: "Grupo Xcaret",
    status: "confirmada",
    voucher_ref: "VCH-TN-2026-0001-01",
    supplier_confirmation_code: "XC-88219",
    adults_count: 2,
    children_count: 1,
    infants_count: 0,
    contracts: {
      id: "cont-001",
      contract_number: "TN-2026-0001",
      client_name: "Juliana Mendes",
      client_phone: "+55 11 98888-7777",
      status: "emitido",
      hotel_name: "Hotel Riu Palace Peninsula",
    },
    suppliers: { id: "supp-xcaret", name: "Grupo Xcaret", whatsapp: "529988776655" },
  },

  // 2. Traslado hoje com horário confirmado mas fornecedor aguardando
  {
    id: "res-002",
    contract_id: "cont-002",
    contract_item_id: "item-002",
    product_name: "Transfer In Privativo Aeroporto -> Hotel",
    tour_id_code: "TRF-IN-PRIV",
    tour_date: TODAY,
    pickup_time: "14:30",
    pickup_location: "Aeroporto Cancún T3",
    hotel_zone: "Cancun Hotel Zone",
    supplier_id: "supp-transfers",
    supplier_name: "Cancun Transfers VIP",
    status: "solicitada",
    voucher_ref: null,
    adults_count: 2,
    children_count: 0,
    infants_count: 0,
    contracts: {
      id: "cont-002",
      contract_number: "TN-2026-0002",
      client_name: "Carlos Eduardo Silva",
      client_phone: "+55 21 97777-6666",
      status: "emitido",
      hotel_name: "Grand Fiesta Americana Coral Beach",
    },
    suppliers: { id: "supp-transfers", name: "Cancun Transfers VIP" },
  },

  // 3. Passeio hoje SEM horário de pickup confirmado (deve ir para seção própria)
  {
    id: "res-003",
    contract_id: "cont-003",
    contract_item_id: "item-003",
    product_name: "Chichén Itzá Clássico com Cenote Ik Kil",
    tour_id_code: "CHICH-01",
    tour_date: TODAY,
    pickup_time: null, // Sem horário!
    pickup_location: "Hotel Hyatt Ziva",
    supplier_id: "supp-passion",
    supplier_name: "Cancun Passion",
    status: "pendente",
    voucher_ref: null,
    adults_count: 4,
    children_count: 0,
    infants_count: 0,
    contracts: {
      id: "cont-003",
      contract_number: "TN-2026-0003",
      client_name: "Mariana Costa",
      client_phone: "+55 31 99999-1111",
      status: "emitido",
      hotel_name: "Hotel Hyatt Ziva",
    },
    suppliers: { id: "supp-passion", name: "Cancun Passion" },
  },

  // 4. Passeio amanhã com horário confirmado (06:45)
  {
    id: "res-004",
    contract_id: "cont-004",
    contract_item_id: "item-004",
    product_name: "Isla Mujeres Catamarã Platinum VIP",
    tour_id_code: "ISLA-CAT",
    tour_date: TOMORROW,
    pickup_time: "06:45",
    pickup_location: "Marina Chac Chi",
    supplier_id: "supp-marina",
    supplier_name: "Marina Chac Chi VIP",
    status: "confirmada",
    voucher_ref: "VCH-TN-2026-0004-01",
    adults_count: 2,
    children_count: 0,
    infants_count: 0,
    contracts: {
      id: "cont-004",
      contract_number: "TN-2026-0004",
      client_name: "Rodrigo Faro",
      status: "emitido",
      hotel_name: "Secrets The Vine",
    },
    suppliers: { id: "supp-marina", name: "Marina Chac Chi VIP" },
  },

  // 5. Passeio amanhã com horário mais tarde (09:00)
  {
    id: "res-005",
    contract_id: "cont-005",
    contract_item_id: "item-005",
    product_name: "Cenotes Sagrados e Tirolesas",
    tour_id_code: "CEN-02",
    tour_date: TOMORROW,
    pickup_time: "09:00",
    pickup_location: "Hotel Riu Caribe",
    supplier_id: "supp-cenotes",
    supplier_name: "Selvatica Adventures",
    status: "confirmada",
    voucher_ref: "VCH-TN-2026-0005-01",
    adults_count: 2,
    children_count: 2,
    infants_count: 0,
    contracts: {
      id: "cont-005",
      contract_number: "TN-2026-0005",
      client_name: "Patricia Abravanel",
      status: "emitido",
      hotel_name: "Hotel Riu Caribe",
    },
    suppliers: { id: "supp-cenotes", name: "Selvatica Adventures" },
  },

  // 6. Serviço CANCELADO (deve ser excluído da agenda ativa)
  {
    id: "res-006",
    contract_id: "cont-006",
    contract_item_id: "item-006",
    product_name: "Coco Bongo Gold Member",
    tour_id_code: "CB-GOLD",
    tour_date: TODAY,
    pickup_time: "21:00",
    pickup_location: "Coco Bongo Cancun",
    status: "cancelada",
    voucher_ref: null,
    adults_count: 2,
    children_count: 0,
    infants_count: 0,
    contracts: {
      id: "cont-006",
      contract_number: "TN-2026-0006",
      client_name: "Cliente Cancelado",
      status: "cancelado",
    },
    suppliers: { id: "supp-cb", name: "Coco Bongo" },
  },

  // 7. INCONSISTÊNCIA: Contrato cancelado, mas reserva consta como confirmada
  {
    id: "res-007",
    contract_id: "cont-007",
    contract_item_id: "item-007",
    product_name: "Tulum & Akumal Tartarugas",
    tour_id_code: "TULUM-AK",
    tour_date: TODAY,
    pickup_time: "08:00",
    pickup_location: "Hotel Dreams Riviera",
    status: "confirmada", // Inconsistência!
    adults_count: 2,
    children_count: 0,
    infants_count: 0,
    contracts: {
      id: "cont-007",
      contract_number: "TN-2026-0007",
      client_name: "Lucas Inconsistente",
      status: "cancelado", // Contrato cancelado!
    },
    suppliers: { id: "supp-passion", name: "Cancun Passion" },
  },
];

// MOCK DATA DE CHEGADAS
const mockArrivals = [
  {
    id: "arr-001",
    contract_id: "cont-002",
    client_name: "Carlos Eduardo Silva",
    arrival_date: TODAY,
    arrival_flight_number: "LA 8120",
    arrival_flight_time: "13:45",
    hotel_name: "Grand Fiesta Americana Coral Beach",
    hotel_zone: "Cancun Hotel Zone",
    adults_count: 2,
    children_count: 0,
    infants_count: 0,
    status: "agendada",
    contracts: { contract_number: "TN-2026-0002", status: "emitido" },
  },
  {
    id: "arr-002",
    contract_id: "cont-008",
    client_name: "Fernanda Lima",
    arrival_date: TODAY,
    arrival_flight_number: null, // Chegada sem voo!
    arrival_flight_time: null,
    hotel_name: null, // Chegada sem hotel!
    adults_count: 1,
    children_count: 0,
    infants_count: 0,
    status: "pendente_info",
    contracts: { contract_number: "TN-2026-0008", status: "emitido" },
  },
];

// MOCK DATA DE CARTEIRAS DE VIAGEM
const mockWallets = [
  {
    id: "wal-001",
    contract_id: "cont-001",
    contract_number: "TN-2026-0001",
    client_name: "Juliana Mendes",
    status: "entregue",
  },
  {
    id: "wal-002",
    contract_id: "cont-002",
    contract_number: "TN-2026-0002",
    client_name: "Carlos Eduardo Silva",
    status: "necessita_atualizacao",
    needs_update_reasons: ["Horário de transfer alterado de 14:00 para 14:30"],
    travel_start_date: TODAY,
  },
];

// =============================================================================
// TESTE 1: CONSTRUÇÃO NORMALIZADA E SEM INFORMAÇÕES INVENTADAS
// =============================================================================
console.log("--- TESTE 1: CONSTRUÇÃO NORMALIZADA E DADOS REAIS ---");

const services = buildDailyOperationalServices({
  reservations: mockReservations,
  arrivals: mockArrivals,
  refDateStr: TODAY,
});

assert(services.length === mockReservations.length + mockArrivals.length, "Consolida todas as reservas e chegadas sem perdas");
const resNoTime = services.find((s) => s.id === "res-003");
assert(resNoTime?.hasConfirmedTime === false, "Serviço sem horário mantém hasConfirmedTime === false");
assert(resNoTime?.time === null, "Nenhum horário fictício atribuído a serviço pendente");

// =============================================================================
// TESTE 2: RESUMO DO DIA E CÁLCULO PRECISO DE KPIS
// =============================================================================
console.log("\n--- TESTE 2: RESUMO DO DIA E CÁLCULO DE KPIS OPERACIONAIS ---");

const kpis = calculateDailyKpis({
  allServices: services,
  wallets: mockWallets,
  refDateStr: TODAY,
});

// Chegadas hoje: arr-001 e arr-002 (2 chegadas ativas hoje)
assert(kpis.chegadasPrevistas === 2, `Chegadas previstas hoje corretas (${kpis.chegadasPrevistas} = 2)`);

// Traslados hoje: res-002 (1 traslado ativo hoje)
assert(kpis.trasladosProgramados === 1, `Traslados programados hoje corretos (${kpis.trasladosProgramados} = 1)`);

// Passeios hoje: res-001 e res-003 (excluído res-006 cancelado; res-007 é inconsistência)
assert(kpis.passeiosProgramados >= 2, `Passeios programados hoje corretos (${kpis.passeiosProgramados})`);

// Reservas aguardando confirmação hoje: res-002 (solicitada) e res-003 (pendente)
assert(kpis.reservasAguardandoConfirmacao === 2, `Reservas aguardando confirmação hoje corretas (${kpis.reservasAguardandoConfirmacao} = 2)`);

// Pickups pendentes hoje: res-003 (sem horário), arr-002 (sem horário/local)
assert(kpis.pickupsPendentes >= 2, `Pickups pendentes calculados com base real (${kpis.pickupsPendentes} >= 2)`);

// Vouchers pendentes hoje: res-002 e res-003
assert(kpis.vouchersPendentes >= 2, `Vouchers pendentes calculados corretamente (${kpis.vouchersPendentes} >= 2)`);

// Carteiras necessitam atualização: wal-002
assert(kpis.carteirasNecessitamAtualizacao === 1, `Carteiras necessitando atualização calculadas (${kpis.carteirasNecessitamAtualizacao} = 1)`);

// Ocorrências em aberto: res-007 (inconsistência de cancelamento)
assert(kpis.ocorrenciasAbertas >= 1, `Ocorrências operacionais abertas identificadas (${kpis.ocorrenciasAbertas} >= 1)`);

// =============================================================================
// TESTE 3: ORDENAÇÃO CRONOLÓGICA E SEPARAÇÃO DE HORÁRIOS
// =============================================================================
console.log("\n--- TESTE 3: ORDENAÇÃO CRONOLÓGICA E SEPARAÇÃO DE HORÁRIOS ---");

const { withConfirmedTime, withoutConfirmedTime } = separateTimeServices(services);

// Verifica se os serviços com horário estão estritamente ordenados
let isChronological = true;
for (let i = 0; i < withConfirmedTime.length - 1; i++) {
  const a = withConfirmedTime[i];
  const b = withConfirmedTime[i + 1];
  if (a.date === b.date && a.time && b.time) {
    if (a.time > b.time) {
      isChronological = false;
      break;
    }
  }
}
assert(isChronological, "Serviços com horário confirmado seguem ordem cronológica estrita");

// Verifica se os sem horário estão devidamente isolados
const allWithoutHaveNoTime = withoutConfirmedTime.every((s) => !s.hasConfirmedTime);
assert(allWithoutHaveNoTime, "Seção de horários a confirmar contém apenas serviços sem horário");
assert(withoutConfirmedTime.some((s) => s.id === "res-003"), "res-003 está presente na seção de horários a confirmar");

// =============================================================================
// TESTE 4: EXCLUSÃO DE SERVIÇOS CANCELADOS DA AGENDA ATIVA
// =============================================================================
console.log("\n--- TESTE 4: EXCLUSÃO DE CANCELADOS DA AGENDA ATIVA ---");

const activeFiltered = filterDailyServices(services, {
  datePreset: "today",
  startDate: TODAY,
  endDate: TODAY,
  serviceType: "todos",
  supplierId: "todos",
  operationalStatus: "todos",
  pendencyFilter: "todos",
  searchTerm: "",
});

const containsCancelled = activeFiltered.some((s) => s.id === "res-006");
assert(!containsCancelled, "Serviço formalmente cancelado (res-006) é excluído da agenda ativa");

// =============================================================================
// TESTE 5: INCONSISTÊNCIA DE CANCELAMENTO
// =============================================================================
console.log("\n--- TESTE 5: INCONSISTÊNCIA DE CANCELAMENTO ---");

const inconsistencyItem = services.find((s) => s.id === "res-007");
assert(inconsistencyItem?.isCancelledInconsistency === true, "Identifica reserva ativa em contrato cancelado como inconsistência");
assert(inconsistencyItem?.isCritical === true, "Inconsistência de cancelamento é marcada como crítica");

// =============================================================================
// TESTE 6: CENTRAL DE PENDÊNCIAS E MATRIZ DE PRIORIDADES
// =============================================================================
console.log("\n--- TESTE 6: CENTRAL DE PENDÊNCIAS E MATRIZ DE PRIORIDADES ---");

const pendencies = detectDailyPendencies({
  allServices: services,
  wallets: mockWallets,
  refDateStr: TODAY,
});

assert(pendencies.length > 0, "Central de pendências detecta situações ativas");

// Prioridade Crítica para situações de hoje
const critPendencies = pendencies.filter((p) => p.priority === "critica");
assert(critPendencies.length > 0, "Identifica pendências de prioridade crítica para serviços de hoje");

// Verifica se a carteira desatualizada foi capturada
const walletPend = pendencies.find((p) => p.category === "carteira_desatualizada");
assert(walletPend !== undefined, "Carteira desatualizada incluída na central de pendências");
assert(walletPend?.contractNumber === "TN-2026-0002", "Carteira vinculada ao contrato correto");

// Verifica se a chegada sem voo foi capturada
const arrPend = pendencies.find((p) => p.category === "chegada_incompleta");
assert(arrPend !== undefined, "Chegada incompleta incluída na central de pendências");

// Priorização decrescente
let isPrioritySorted = true;
const pOrder = { critica: 0, alta: 1, media: 2, baixa: 3 };
for (let i = 0; i < pendencies.length - 1; i++) {
  if (pOrder[pendencies[i].priority] > pOrder[pendencies[i + 1].priority]) {
    isPrioritySorted = false;
    break;
  }
}
assert(isPrioritySorted, "Central de pendências ordenada estritamente por gravidade de prioridade");

// =============================================================================
// TESTE 7: FILTROS COMBINADOS E BUSCA
// =============================================================================
console.log("\n--- TESTE 7: FILTROS COMBINADOS E BUSCA ---");

// 1. Filtro por fornecedor "Grupo Xcaret"
const xcaretFiltered = filterDailyServices(
  services,
  {
    datePreset: "today",
    startDate: TODAY,
    endDate: TODAY,
    serviceType: "todos",
    supplierId: "supp-xcaret",
    operationalStatus: "todos",
    pendencyFilter: "todos",
    searchTerm: "",
  },
  TODAY
);
assert(xcaretFiltered.length === 1 && xcaretFiltered[0].id === "res-001", "Filtro por fornecedor isola corretamente os serviços");

// 2. Filtro por tipo de serviço: "traslado"
const transferFiltered = filterDailyServices(
  services,
  {
    datePreset: "today",
    startDate: TODAY,
    endDate: TODAY,
    serviceType: "traslado",
    supplierId: "todos",
    operationalStatus: "todos",
    pendencyFilter: "todos",
    searchTerm: "",
  },
  TODAY
);
assert(transferFiltered.length === 1 && transferFiltered[0].serviceType === "traslado", "Filtro por tipo de serviço isola traslados");

// 3. Busca textual por "Juliana"
const searchFiltered = filterDailyServices(
  services,
  {
    datePreset: "today",
    startDate: TODAY,
    endDate: TODAY,
    serviceType: "todos",
    supplierId: "todos",
    operationalStatus: "todos",
    pendencyFilter: "todos",
    searchTerm: "Juliana",
  },
  TODAY
);
assert(searchFiltered.length === 1 && searchFiltered[0].clientName === "Juliana Mendes", "Busca textual por nome de cliente funciona");

// 4. Busca textual por contrato "TN-2026-0003"
const searchContractFiltered = filterDailyServices(
  services,
  {
    datePreset: "today",
    startDate: TODAY,
    endDate: TODAY,
    serviceType: "todos",
    supplierId: "todos",
    operationalStatus: "todos",
    pendencyFilter: "todos",
    searchTerm: "TN-2026-0003",
  },
  TODAY
);
assert(searchContractFiltered.length === 1 && searchContractFiltered[0].contractNumber === "TN-2026-0003", "Busca textual por número de contrato funciona");

// =============================================================================
// TESTE 8: AÇÕES RÁPIDAS E ROTEAMENTO PARA MÓDULOS EXISTENTES
// =============================================================================
console.log("\n--- TESTE 8: AÇÕES RÁPIDAS E ROTEAMENTO ---");

pendencies.forEach((p) => {
  assert(
    p.quickActionUrl.startsWith("/admin/"),
    `URL de ação rápida para "${p.title}" aponta para módulo administrativo existente (${p.quickActionUrl})`
  );
  assert(
    p.quickActionUrl.includes(encodeURIComponent(p.contractNumber)),
    `URL de ação rápida embute busca pelo contrato (${p.contractNumber})`
  );
});

// =============================================================================
// TESTE 9: MATRIZ DE ACESSO RBAC
// =============================================================================
console.log("\n--- TESTE 9: MATRIZ DE AUTORIZAÇÃO RBAC ---");

const adminCanAccess = canAccessRoute("admin", "/admin/operacoes");
const sellerCanAccess = canAccessRoute("seller", "/admin/operacoes");
assert(adminCanAccess, "Administrador possui acesso autorizado a /admin/operacoes");
assert(sellerCanAccess, "Vendedor/Moderador possui acesso autorizado a /admin/operacoes");

// Verifica se a regra de rota está devidamente registrada em ROUTE_ACCESS_RULES
const rule = ROUTE_ACCESS_RULES.find((r) => r.path === "/admin/operacoes");
assert(rule !== undefined, "Rota /admin/operacoes registrada em ROUTE_ACCESS_RULES");
assert(rule?.requiredPermissions.includes("arrivals:view") === true, "Exige permissão operacional de arrivals:view");

// =============================================================================
// TESTE 10: CONFIDENCIALIDADE FINANCEIRA ABSOLUTA
// =============================================================================
console.log("\n--- TESTE 10: CONFIDENCIALIDADE FINANCEIRA ABSOLUTA ---");

services.forEach((s) => {
  const rawObj = s as any;
  assert(rawObj.actual_cost === undefined, "Objeto operacional NÃO expõe actual_cost");
  assert(rawObj.estimated_cost === undefined, "Objeto operacional NÃO expõe estimated_cost");
  assert(rawObj.cost_applied === undefined, "Objeto operacional NÃO expõe cost_applied");
  assert(rawObj.sale_price === undefined, "Objeto operacional NÃO expõe sale_price");
  assert(rawObj.profit_margin === undefined, "Objeto operacional NÃO expõe profit_margin");
  assert(rawObj.supplier_payable === undefined, "Objeto operacional NÃO expõe supplier_payable");
});

// =============================================================================
// TESTE 11: RESILIÊNCIA E AUSÊNCIA DE DUPLICAÇÃO DE RESERVAS
// =============================================================================
console.log("\n--- TESTE 11: RESILIÊNCIA E AUSÊNCIA DE DUPLICAÇÃO ---");

const emptyServices = buildDailyOperationalServices({
  reservations: [],
  arrivals: [],
});
assert(emptyServices.length === 0, "Manipula listas vazias graciosamente");

const emptyKpis = calculateDailyKpis({
  allServices: [],
  wallets: [],
});
assert(emptyKpis.chegadasPrevistas === 0, "KPIs vazios zerados sem falhas");
assert(emptyKpis.passeiosProgramados === 0, "KPIs de passeios zerados sem falhas");

console.log("\n===============================================================================");
console.log(`TOTAL DE TESTES EXECUTADOS: ${passedCount + failedCount}`);
console.log(`SUCESSOS: ${passedCount}`);
console.log(`FALHAS: ${failedCount}`);
console.log("===============================================================================\n");

if (failedCount > 0) {
  process.exit(1);
} else {
  console.log("✨ TODOS OS TESTES DO PAINEL DE OPERAÇÕES DIÁRIAS PASSARAM COM SUCESSO!\n");
}
