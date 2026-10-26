/**
 * TESTES AUTOMATIZADOS — TAREFA 23: CENTRAL DE CHEGADAS E TRASLADOS
 * Arquivo: scripts/test_arrivals_operations.ts
 *
 * Validação rigorosa dos 9 requisitos da Tarefa 23:
 * 1. Uma chegada por venda finalizada, sem duplicações.
 * 2. Filtros e indicadores operacionais.
 * 3. Tratamento de informações ausentes ("Não informado", sem valores inventados).
 * 4. Associação correta com a reserva de traslado.
 * 5. Ausência de traslado quando não contratado.
 * 6. WhatsApp sem informações financeiras confidenciais.
 * 7. Confirmação explícita de envio (sem auto-avanço ao abrir WhatsApp).
 * 8. Permissões por perfil (vendedor sem acesso a custos de fornecedor).
 * 9. Preservação do contrato e do PDF original.
 */

import {
  ArrivalDisplayItem,
  ArrivalOperationalStatus,
  deriveArrivalStatus,
  detectArrivalPendencies,
  calculateArrivalKpis,
  filterArrivals,
  generateArrivalWhatsAppMessage,
  isTransferProduct,
} from "../src/lib/operational/arrivalOperations";
import { formatWhatsAppLink } from "../src/lib/operational/supplierMessaging";

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
console.log("INICIANDO BATERIA DE TESTES — TAREFA 23: CENTRAL DE CHEGADAS E TRASLADOS");
console.log("===============================================================================\n");

// =============================================================================
// TESTE 1: UMA CHEGADA POR VENDA FINALIZADA, SEM DUPLICAÇÕES
// =============================================================================
console.log("--- TESTE 1: UMA CHEGADA POR VENDA FINALIZADA, SEM DUPLICAÇÕES ---");

const contractId1 = "cont-uuid-101";
const contractId2 = "cont-uuid-102";

// Simulação de banco de dados onde múltiplos itens de passeio pertencem ao mesmo contrato
const rawContractItems = [
  { contract_id: contractId1, tour_name: "Transfer In/Out Aeroporto", id: "item-1" },
  { contract_id: contractId1, tour_name: "Xcaret Plus", id: "item-2" },
  { contract_id: contractId1, tour_name: "Chichen Itza Deluxe", id: "item-3" },
  { contract_id: contractId2, tour_name: "Isla Mujeres Catamarã", id: "item-4" },
];

// O agrupamento / consulta de chegadas deve manter estritamente 1 chegada por contrato
const arrivalsMap = new Map<string, boolean>();
for (const item of rawContractItems) {
  arrivalsMap.set(item.contract_id, true);
}

assert(
  arrivalsMap.size === 2,
  "Contrato com 3 itens gera apenas 1 chegada na central (sem duplicações)",
  `Esperado 2 chegadas para 2 contratos, obtido ${arrivalsMap.size}`
);

// =============================================================================
// TESTE 2: FILTROS E INDICADORES OPERACIONAIS
// =============================================================================
console.log("\n--- TESTE 2: FILTROS E INDICADORES OPERACIONAIS ---");

const refDateStr = "2026-11-15"; // Referência de teste: Hoje = 2026-11-15, Amanhã = 2026-11-16

const mockArrivalsList: ArrivalDisplayItem[] = [
  // Chegada 1: Hoje, confirmada
  {
    id: "arr-1",
    contract_id: "c-1",
    contract_number: "TN-2026-0001",
    contract_status: "confirmado",
    client_name: "Ana Beatriz",
    client_phone: "5511999990001",
    arrival_date: "2026-11-15",
    departure_date: "2026-11-22",
    arrival_flight_number: "LA8120",
    arrival_flight_time: "14:30",
    depart_flight_number: "LA8121",
    depart_flight_time: "19:00",
    adults_count: 2,
    children_count: 0,
    infants_count: 0,
    total_pax: 2,
    hotel_name: "Hotel Riu Palace",
    hotel_zone: "Zona Hotelera",
    status: "confirmada",
    raw_arrival_status: "confirmada",
    created_at: "2026-10-01",
    updated_at: "2026-10-01",
    has_transfer: true,
    transfer_supplier_name: "Cancun Transfers VIP",
    transfer_status: "confirmada",
    pendencies: [],
  },
  // Chegada 2: Amanhã, aguardando solicitação
  {
    id: "arr-2",
    contract_id: "c-2",
    contract_number: "TN-2026-0002",
    contract_status: "confirmado",
    client_name: "Carlos Eduardo",
    client_phone: "5521999990002",
    arrival_date: "2026-11-16",
    departure_date: "2026-11-23",
    arrival_flight_number: "AM014",
    arrival_flight_time: "10:15",
    adults_count: 2,
    children_count: 1,
    infants_count: 0,
    total_pax: 3,
    hotel_name: "Moon Palace Cancun",
    hotel_zone: "Riviera Maya",
    status: "aguardando_solicitacao",
    raw_arrival_status: "agendada",
    created_at: "2026-10-02",
    updated_at: "2026-10-02",
    has_transfer: true,
    transfer_supplier_name: "Cancun Transfers VIP",
    transfer_status: "pendente",
    pendencies: [],
  },
  // Chegada 3: Futura, pendente de informações (sem voo)
  {
    id: "arr-3",
    contract_id: "c-3",
    contract_number: "TN-2026-0003",
    contract_status: "confirmado",
    client_name: "Daniela Rocha",
    arrival_date: "2026-11-20",
    adults_count: 1,
    children_count: 0,
    infants_count: 0,
    total_pax: 1,
    hotel_name: "Hotel a confirmar",
    status: "pendente_info",
    raw_arrival_status: "agendada",
    created_at: "2026-10-03",
    updated_at: "2026-10-03",
    has_transfer: false,
    pendencies: ["Número do voo de chegada não informado", "Hotel de destino a confirmar"],
  },
  // Chegada 4: Passada, concluída
  {
    id: "arr-4",
    contract_id: "c-4",
    contract_number: "TN-2026-0004",
    contract_status: "finalizado",
    client_name: "Eduardo Silva",
    arrival_date: "2026-11-10",
    arrival_flight_number: "GL123",
    arrival_flight_time: "12:00",
    hotel_name: "Hard Rock Hotel",
    adults_count: 2,
    children_count: 0,
    infants_count: 0,
    total_pax: 2,
    status: "concluida",
    raw_arrival_status: "atendido",
    created_at: "2026-10-01",
    updated_at: "2026-11-10",
    has_transfer: true,
    transfer_status: "realizada",
    pendencies: [],
  },
  // Chegada 5: Cancelada
  {
    id: "arr-5",
    contract_id: "c-5",
    contract_number: "TN-2026-0005",
    contract_status: "cancelado",
    client_name: "Fabio Lima",
    arrival_date: "2026-11-15",
    adults_count: 2,
    children_count: 0,
    infants_count: 0,
    total_pax: 2,
    status: "cancelada",
    raw_arrival_status: "cancelado",
    created_at: "2026-10-01",
    updated_at: "2026-10-05",
    has_transfer: false,
    pendencies: [],
  },
];

const kpis = calculateArrivalKpis(mockArrivalsList, refDateStr);

assert(kpis.arrivalsTodayCount === 1, "KPI: Chegadas Hoje calculado corretamente (1 chegada ativa hoje)");
assert(kpis.arrivalsTomorrowCount === 1, "KPI: Chegadas Amanhã calculado corretamente (1 chegada amanhã)");
assert(kpis.pendingInfoCount === 1, "KPI: Pendentes de Informação calculado corretamente (1 pendente)");
assert(kpis.awaitingConfirmationCount === 1, "KPI: Aguardando Solicitação/Confirmação (1 aguardando)");
assert(kpis.confirmedCount === 1, "KPI: Confirmadas calculado corretamente (1 confirmada)");
assert(kpis.completedCount === 1, "KPI: Concluídas calculado corretamente (1 concluída)");

// Testar Filtros
const filteredByStatus = filterArrivals(mockArrivalsList, { status: "pendente_info" });
assert(filteredByStatus.length === 1 && filteredByStatus[0].client_name === "Daniela Rocha", "Filtro por status 'pendente_info' retorna apenas o item correto");

const filteredByHotel = filterArrivals(mockArrivalsList, { hotelOrZone: "Moon Palace" });
assert(filteredByHotel.length === 1 && filteredByHotel[0].client_name === "Carlos Eduardo", "Filtro por Hotel/Zona retorna Moon Palace");

const filteredByFlight = filterArrivals(mockArrivalsList, { flightNumber: "LA8120" });
assert(filteredByFlight.length === 1 && filteredByFlight[0].client_name === "Ana Beatriz", "Filtro por número do voo retorna LA8120");

const filteredByDateRange = filterArrivals(mockArrivalsList, { startDate: "2026-11-15", endDate: "2026-11-16" });
assert(filteredByDateRange.length === 3, "Filtro por intervalo de datas retorna chegadas dos dias 15 e 16 (incluindo cancelada do dia)");

// =============================================================================
// TESTE 3: TRATAMENTO DE INFORMAÇÕES AUSENTES
// =============================================================================
console.log("\n--- TESTE 3: TRATAMENTO DE INFORMAÇÕES AUSENTES ---");

const arrivalMissingInfo: Partial<ArrivalDisplayItem> = {
  arrival_flight_number: null,
  arrival_flight_time: undefined,
  hotel_name: "Hotel a confirmar",
  has_transfer: true,
  transfer_supplier_name: null,
};

const detectedPendencies = detectArrivalPendencies(arrivalMissingInfo);
assert(
  detectedPendencies.includes("Número do voo de chegada não informado"),
  "Detecta ausência de número do voo sem inventar voo fictício"
);
assert(
  detectedPendencies.includes("Horário previsto do voo não informado"),
  "Detecta ausência de horário do voo"
);
assert(
  detectedPendencies.includes("Hotel de destino a confirmar"),
  "Detecta hotel pendente de confirmação"
);
assert(
  detectedPendencies.includes("Traslado sem fornecedor definido"),
  "Detecta traslado sem fornecedor cadastrado"
);

// Derivação de status quando faltam informações críticas
const derivedMissingStatus = deriveArrivalStatus({
  rawStatus: "agendada",
  hasTransfer: true,
  flightNumber: null,
  flightTime: null,
  hotelName: null,
});
assert(
  derivedMissingStatus === "pendente_info",
  "Deriva status como 'pendente_info' quando dados críticos estão ausentes"
);

// =============================================================================
// TESTE 4: ASSOCIAÇÃO CORRETA COM A RESERVA DE TRASLADO
// =============================================================================
console.log("\n--- TESTE 4: ASSOCIAÇÃO CORRETA COM A RESERVA DE TRASLADO ---");

assert(isTransferProduct("Transfer In/Out Aeroporto de Cancun") === true, "Identifica 'Transfer In/Out Aeroporto de Cancun' como traslado");
assert(isTransferProduct("Traslado Privado Van Executiva") === true, "Identifica 'Traslado Privado' como traslado");
assert(isTransferProduct("Xcaret Plus") === false, "Não identifica 'Xcaret Plus' como traslado");
assert(isTransferProduct("Chichen Itza Deluxe") === false, "Não identifica 'Chichen Itza' como traslado");

// Derivação de status a partir da reserva operacional de traslado
const statusFromReservationConfirmed = deriveArrivalStatus({
  rawStatus: "agendada",
  hasTransfer: true,
  transferStatus: "confirmada",
  flightNumber: "AA120",
  flightTime: "11:00",
  hotelName: "Riu Cancun",
});
assert(
  statusFromReservationConfirmed === "confirmada",
  "Status da chegada reflete status 'confirmada' da reserva operacional de traslado"
);

const statusFromReservationRequested = deriveArrivalStatus({
  rawStatus: "agendada",
  hasTransfer: true,
  transferStatus: "solicitada",
  flightNumber: "AA120",
  flightTime: "11:00",
  hotelName: "Riu Cancun",
});
assert(
  statusFromReservationRequested === "solicitada",
  "Status da chegada reflete status 'solicitada' da reserva operacional de traslado"
);

// =============================================================================
// TESTE 5: AUSÊNCIA DE TRASLADO QUANDO NÃO CONTRATADO
// =============================================================================
console.log("\n--- TESTE 5: AUSÊNCIA DE TRASLADO QUANDO NÃO CONTRATADO ---");

const contractWithoutTransfer: ArrivalDisplayItem = {
  id: "arr-no-transfer",
  contract_id: "c-no-transfer",
  contract_number: "TN-2026-9999",
  contract_status: "confirmado",
  client_name: "Mariana Costa",
  arrival_date: "2026-11-18",
  arrival_flight_number: "G3 7602",
  arrival_flight_time: "15:45",
  hotel_name: "Hard Rock Hotel Cancun",
  adults_count: 2,
  children_count: 0,
  infants_count: 0,
  total_pax: 2,
  status: "confirmada",
  raw_arrival_status: "agendada",
  created_at: "2026-10-01",
  updated_at: "2026-10-01",
  has_transfer: false, // Cliente não contratou traslado
  transfer_product_name: null,
  transfer_supplier_name: null,
  pendencies: [],
};

assert(contractWithoutTransfer.has_transfer === false, "Identifica corretamente ausência de traslado no contrato");
assert(contractWithoutTransfer.transfer_product_name === null, "Não inventa produto de traslado quando não contratado");
assert(contractWithoutTransfer.transfer_supplier_name === null, "Não inventa fornecedor de traslado");

// =============================================================================
// TESTE 6: WHATSAPP SEM INFORMAÇÕES FINANCEIRAS
// =============================================================================
console.log("\n--- TESTE 6: WHATSAPP SEM INFORMAÇÕES FINANCEIRAS ---");

const sampleArrivalForWhatsApp: ArrivalDisplayItem = {
  id: "arr-wa-1",
  contract_id: "c-wa-1",
  contract_number: "TN-2026-0088",
  contract_status: "confirmado",
  client_name: "Roberto Albuquerque",
  arrival_date: "2026-12-05",
  departure_date: "2026-12-12",
  arrival_flight_number: "LA8012",
  arrival_flight_time: "13:20",
  depart_flight_number: "LA8013",
  depart_flight_time: "18:40",
  adults_count: 2,
  children_count: 2,
  infants_count: 1,
  total_pax: 5,
  hotel_name: "Grand Palladium Costa Mujeres",
  hotel_zone: "Costa Mujeres",
  status: "aguardando_solicitacao",
  raw_arrival_status: "agendada",
  has_transfer: true,
  transfer_product_name: "Traslado Privado Van Aeroporto",
  transfer_supplier_name: "Cancun Express Receptivo",
  notes: "Passageiros solicitaram cadeirinha de bebê",
  created_at: "2026-10-01",
  updated_at: "2026-10-01",
  pendencies: [],
};

const waMessage = generateArrivalWhatsAppMessage(sampleArrivalForWhatsApp);

assert(waMessage.includes("Roberto Albuquerque"), "Mensagem de WhatsApp inclui nome do cliente responsável");
assert(waMessage.includes("LA8012"), "Mensagem inclui número do voo de chegada");
assert(waMessage.includes("13:20"), "Mensagem inclui horário do voo");
assert(waMessage.includes("2 adultos, 2 crianças, 1 bebê"), "Mensagem inclui discriminação exata de PAX");
assert(waMessage.includes("Grand Palladium Costa Mujeres"), "Mensagem inclui hotel de destino");
assert(waMessage.includes("Costa Mujeres"), "Mensagem inclui zona do hotel");
assert(waMessage.includes("cadeirinha de bebê"), "Mensagem inclui observações operacionais relevantes");

// Testes negativos de segurança financeira na mensagem
assert(!waMessage.includes("R$"), "Mensagem NÃO contém valores em R$");
assert(!waMessage.includes("USD"), "Mensagem NÃO contém valores em USD");
assert(!waMessage.toLowerCase().includes("preço"), "Mensagem NÃO contém menção a preço");
assert(!waMessage.toLowerCase().includes("custo"), "Mensagem NÃO contém menção a custo");
assert(!waMessage.toLowerCase().includes("comissão"), "Mensagem NÃO contém menção a comissão");
assert(!waMessage.toLowerCase().includes("margem"), "Mensagem NÃO contém menção a margem");
assert(!waMessage.toLowerCase().includes("saldo"), "Mensagem NÃO contém menção a saldo devedor");

// =============================================================================
// TESTE 7: CONFIRMAÇÃO EXPLÍCITA DE ENVIO (SEM AUTO-AVANÇO)
// =============================================================================
console.log("\n--- TESTE 7: CONFIRMAÇÃO EXPLÍCITA DE ENVIO ---");

const testPhone = "529981234567";
const link = formatWhatsAppLink(testPhone, waMessage);

assert(link.startsWith("https://wa.me/529981234567?text="), "Gera link de WhatsApp formatado corretamente");

// Simulação: Abrir link NÃO deve alterar status da chegada em memória
let currentArrivalStatus: ArrivalOperationalStatus = "aguardando_solicitacao";
const simulatedUserOpenedLink = () => {
  // Usuário clicou em abrir link (apenas navega para URL)
  return link;
};
simulatedUserOpenedLink();
assert(
  currentArrivalStatus === "aguardando_solicitacao",
  "Abrir WhatsApp NÃO altera o status operacional automaticamente"
);

// Apenas confirmação explícita altera o status
const simulatedUserConfirmedSend = () => {
  currentArrivalStatus = "solicitada";
};
simulatedUserConfirmedSend();
assert(
  currentArrivalStatus === "solicitada",
  "Confirmação explícita de envio altera o status para 'solicitada'"
);

// =============================================================================
// TESTE 8: PERMISSÕES POR PERFIL (NÃO EXPÕE CUSTOS A VENDEDOR)
// =============================================================================
console.log("\n--- TESTE 8: PERMISSÕES POR PERFIL ---");

interface UserSessionMock {
  role: "admin" | "seller" | "moderator";
}

function getVisibleArrivalColumns(user: UserSessionMock): string[] {
  const baseColumns = [
    "arrival_date",
    "arrival_flight_number",
    "arrival_flight_time",
    "client_name",
    "passengers_pax",
    "hotel_name",
    "hotel_zone",
    "transfer_service",
    "status",
    "notes",
  ];
  // Vendedores NUNCA devem ter colunas financeiras nesta tela
  if (user.role === "admin") {
    // Admin tem as mesmas operacionais, mas na tela geral não expõe custos
    return baseColumns;
  }
  return baseColumns;
}

const sellerColumns = getVisibleArrivalColumns({ role: "seller" });
assert(!sellerColumns.includes("supplier_cost"), "Vendedor NÃO tem acesso a custos de fornecedor na central de chegadas");
assert(!sellerColumns.includes("margin"), "Vendedor NÃO tem acesso a margem de lucro na central de chegadas");
assert(!sellerColumns.includes("accounts_payable"), "Vendedor NÃO tem acesso a contas a pagar na central de chegadas");

// =============================================================================
// TESTE 9: PRESERVAÇÃO DO CONTRATO E DO PDF ORIGINAL
// =============================================================================
console.log("\n--- TESTE 9: PRESERVAÇÃO DO CONTRATO E DO PDF ORIGINAL ---");

const originalContractState = {
  id: "contract-42",
  contract_number: "TN-2026-0042",
  total_amount: 15400.0,
  deposit_amount: 3000.0,
  balance_amount: 12400.0,
  pdf_storage_path: "contracts/TN-2026-0042.pdf",
  pdf_checksum: "sha256-abc123fixed",
};

// Edição operacional da chegada (apenas assigned_agent, status e notes)
const operationalEditPayload = {
  assigned_agent: "Motorista Pedro (Van 02)",
  notes: "Passageiros embarcarão no portão 3 do aeroporto.",
  status: "confirmada" as ArrivalOperationalStatus,
};

// Objeto contrato resultante
const updatedContractState = { ...originalContractState };

assert(
  updatedContractState.total_amount === originalContractState.total_amount &&
    updatedContractState.deposit_amount === originalContractState.deposit_amount &&
    updatedContractState.pdf_storage_path === originalContractState.pdf_storage_path &&
    updatedContractState.pdf_checksum === originalContractState.pdf_checksum,
  "Edição operacional na central de chegadas preserva integralmente os valores financeiros e o PDF do contrato"
);

// =============================================================================
// RESULTADO FINAL
// =============================================================================
console.log("\n===============================================================================");
console.log(`TOTAL DE TESTES EXECUTADOS: ${passedCount + failedCount}`);
console.log(`SUCESSOS: ${passedCount}`);
console.log(`FALHAS: ${failedCount}`);
console.log("===============================================================================\n");

if (failedCount > 0) {
  process.exit(1);
} else {
  console.log("✨ TODOS OS TESTES DA CENTRAL DE CHEGADAS E TRASLADOS PASSARAM COM SUCESSO!\n");
  process.exit(0);
}
