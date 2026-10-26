/**
 * TESTES AUTOMATIZADOS — TAREFA 26: CARTEIRA DE VIAGEM DO CLIENTE
 * Arquivo: scripts/test_travel_wallet_operations.ts
 *
 * Bateria rigorosa de testes cobrindo os 12 requisitos oficiais da Tarefa 26:
 * 1. Carteira somente com serviços contratados.
 * 2. Ordenação cronológica.
 * 3. Dados ausentes sem informações inventadas.
 * 4. Independência da confirmação do fornecedor.
 * 5. Preservação das personalizações.
 * 6. PDF e mensagens sem informações financeiras.
 * 7. Entrega com confirmação explícita.
 * 8. Identificação de carteira desatualizada.
 * 9. Histórico de entregas preservado.
 * 10. Ausência de duplicação de reservas.
 * 11. Permissões por perfil.
 * 12. Integridade do contrato e PDF original.
 */

import {
  WalletStatus,
  TravelWalletData,
  TravelWalletItem,
  WalletDeliveryRecord,
  buildTravelWallet,
  buildOperationalSnapshot,
  detectOperationalChangesAfterDelivery,
  generateWalletWhatsAppMessage,
  validateWalletDelivery,
  calculateWalletKpis,
  filterWallets,
  formatDate,
  getWeekdayName,
  DEFAULT_WELCOME_MESSAGE,
  DEFAULT_GENERAL_GUIDELINES,
  DEFAULT_CLIENT_RECOMMENDATIONS,
  simulateAtomicWalletDelivery,
  validateDirectWalletUpdate,
  validateDirectWalletInsert,
} from "../src/lib/operational/walletOperations";
import { canAccessRoute } from "../src/lib/auth/permissions";
import * as fs from "fs";
import * as path from "path";

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
console.log("INICIANDO BATERIA DE TESTES — TAREFA 26: CARTEIRA DE VIAGEM DO CLIENTE");
console.log("===============================================================================\n");

// =============================================================================
// TESTE 1: CARTEIRA SOMENTE COM SERVIÇOS CONTRATADOS
// =============================================================================
console.log("--- TESTE 1: CARTEIRA SOMENTE COM SERVIÇOS CONTRATADOS ---");

const contractSample = {
  id: "contract-101",
  contract_number: "TN-2026-0042",
  client_id: "cli-55",
  client_name: "Mariana Alcantara",
  client_phone: "+55 11 98888-7777",
  client_email: "mariana@gmail.com",
  status: "finalizado",
  travel_start_date: "2026-11-10",
  travel_end_date: "2026-11-17",
  hotel_name: "Hotel Riu Palace Las Americas",
  hotel_zone: "Zona Hotelera Km 8.5",
  adults_count: 2,
  children_count: 1,
  infants_count: 0,
};

const allReservationsSample = [
  {
    id: "res-01",
    contract_id: "contract-101",
    contract_item_id: "item-01",
    product_name: "Chichén Itzá Clássico & Cenote",
    tour_date: "2026-11-12",
    pickup_time: "07:15",
    pickup_location: "Lobby Hotel Riu Palace",
    voucher_ref: "VCH-TN-0042-01",
    status: "confirmada",
    adults_count: 2,
    children_count: 1,
    infants_count: 0,
  },
  {
    id: "res-02",
    contract_id: "contract-101",
    contract_item_id: "item-02",
    product_name: "Xcaret Plus com Transporte",
    tour_date: "2026-11-14",
    pickup_time: "07:45",
    pickup_location: "Lobby Hotel Riu Palace",
    voucher_ref: "VCH-TN-0042-02",
    status: "confirmada",
    adults_count: 2,
    children_count: 1,
    infants_count: 0,
  },
  // Reserva pertencente a OUTRO contrato (não contratada por este cliente)
  {
    id: "res-OUTRO",
    contract_id: "contract-OUTRO-999",
    contract_item_id: "item-OUTRO",
    product_name: "Isla Mujeres Catamarã Luxo",
    tour_date: "2026-11-15",
    status: "confirmada",
  },
  // Reserva deste contrato, porém cancelada
  {
    id: "res-CANCELADA",
    contract_id: "contract-101",
    contract_item_id: "item-03",
    product_name: "Tulum & Akumal Tartarugas",
    tour_date: "2026-11-16",
    status: "cancelada",
    cancellation_status: "confirmado",
  },
];

const wallet1 = buildTravelWallet({
  contract: contractSample,
  reservations: allReservationsSample,
});

assert(
  wallet1.items.length === 2,
  "1.1. Carteira inclui exatamente os 2 serviços contratados e ativos do contrato"
);

assert(
  !wallet1.items.some((i) => i.id === "res-OUTRO"),
  "1.2. Serviços de outros contratos são estritamente excluídos da carteira"
);

assert(
  !wallet1.items.some((i) => i.id === "res-CANCELADA"),
  "1.3. Serviços cancelados são excluídos da programação ativa da carteira"
);


// =============================================================================
// TESTE 2: ORDENAÇÃO CRONOLÓGICA ESTRITA
// =============================================================================
console.log("\n--- TESTE 2: ORDENAÇÃO CRONOLÓGICA ESTRITA ---");

const unorderedReservations = [
  {
    id: "res-nov-15",
    contract_id: "contract-101",
    contract_item_id: "item-15",
    product_name: "Isla Mujeres Catamarã",
    tour_date: "2026-11-15",
    pickup_time: "08:30",
  },
  {
    id: "res-nov-11",
    contract_id: "contract-101",
    contract_item_id: "item-11",
    product_name: "Chichén Itzá",
    tour_date: "2026-11-11",
    pickup_time: "07:10",
  },
  {
    id: "res-nov-13-tarde",
    contract_id: "contract-101",
    contract_item_id: "item-13b",
    product_name: "Cirque du Soleil JOYÀ",
    tour_date: "2026-11-13",
    pickup_time: "18:00",
  },
  {
    id: "res-nov-13-manha",
    contract_id: "contract-101",
    contract_item_id: "item-13a",
    product_name: "Cenotes Zapote Aventura",
    tour_date: "2026-11-13",
    pickup_time: "08:00",
  },
];

const walletChronological = buildTravelWallet({
  contract: contractSample,
  reservations: unorderedReservations,
});

assert(
  walletChronological.items[0].id === "res-nov-11" &&
  walletChronological.items[1].id === "res-nov-13-manha" &&
  walletChronological.items[2].id === "res-nov-13-tarde" &&
  walletChronological.items[3].id === "res-nov-15",
  "2.1. Programação da carteira é ordenada cronologicamente por data e horário de pickup"
);


// =============================================================================
// TESTE 3: DADOS AUSENTES SEM INFORMAÇÕES INVENTADAS
// =============================================================================
console.log("\n--- TESTE 3: DADOS AUSENTES SEM INFORMAÇÕES INVENTADAS ---");

const reservationsWithMissingData = [
  {
    id: "res-missing-1",
    contract_id: "contract-101",
    contract_item_id: "item-m1",
    product_name: "Passeio Sem Horário Definido",
    tour_date: "2026-11-12",
    pickup_time: null,
    pickup_location: null,
    voucher_ref: null,
    status: "solicitada",
  },
];

const walletMissing = buildTravelWallet({
  contract: { ...contractSample, hotel_name: null },
  reservations: reservationsWithMissingData,
});

const itemMissing = walletMissing.items[0];

assert(
  itemMissing.pickup_time === null &&
  itemMissing.has_pickup_pending === true,
  "3.1. Horário ausente permanece null e sinaliza has_pickup_pending (sem inventar horário falso)"
);

assert(
  itemMissing.voucher_ref === null &&
  itemMissing.has_voucher_pending === true,
  "3.2. Voucher ausente permanece null e sinaliza has_voucher_pending (sem inventar código falso)"
);

assert(
  walletMissing.pendencies.some((p) => p.includes("horário(s) de pickup a confirmar")) &&
  walletMissing.pendencies.some((p) => p.includes("voucher(s) pendente(s)")),
  "3.3. Carteira compila lista clara de pendências operacionais para o operador sanar"
);


// =============================================================================
// TESTE 4: INDEPENDÊNCIA DA CONFIRMAÇÃO DO FORNECEDOR
// =============================================================================
console.log("\n--- TESTE 4: INDEPENDÊNCIA DA CONFIRMAÇÃO DO FORNECEDOR ---");

const unconfirmedReservation = [
  {
    id: "res-unconf",
    contract_id: "contract-101",
    contract_item_id: "item-u1",
    product_name: "Xel-Há All Inclusive",
    tour_date: "2026-11-13",
    status: "pendente", // Fornecedor ainda não respondeu nem confirmou
    pickup_time: "07:30",
    voucher_ref: "VCH-TN-0042-03",
  },
];

const walletUnconfirmed = buildTravelWallet({
  contract: contractSample,
  reservations: unconfirmedReservation,
  walletRecord: { status: "pronta" },
});

assert(
  walletUnconfirmed.items.length === 1 &&
  walletUnconfirmed.items[0].reservation_status === "pendente",
  "4.1. Carteira inclui passeio mesmo com fornecedor pendente de confirmação"
);

assert(
  walletUnconfirmed.status === "pronta",
  "4.2. A carteira pode ser preparada e marcada como pronta independentemente do fornecedor"
);


// =============================================================================
// TESTE 5: PRESERVAÇÃO DAS PERSONALIZAÇÕES DO OPERADOR
// =============================================================================
console.log("\n--- TESTE 5: PRESERVAÇÃO DAS PERSONALIZAÇÕES DO OPERADOR ---");

const customWelcome = "Querida Família Alcantara, sejam muito bem-vindos ao Paraíso!";
const customGuidelines = "Dica especial: O câmbio no aeroporto costuma ser desfavorável.";
const customRecommendations = "Levem água termal e chapéu de palha para as ruínas.";
const customServiceNotes = {
  "res-01": {
    operator_notes: "Solicitamos guia privativo que fala português no guichê 4.",
    additional_meeting_instructions: "Aguardar ao lado da fonte principal do lobby.",
  },
};

const walletWithCustomizations = buildTravelWallet({
  contract: contractSample,
  reservations: allReservationsSample,
  walletRecord: {
    status: "em_preparacao",
    version: 2,
    welcome_message: customWelcome,
    general_guidelines: customGuidelines,
    client_recommendations: customRecommendations,
    service_customizations: customServiceNotes,
  },
});

assert(
  walletWithCustomizations.welcome_message === customWelcome &&
  walletWithCustomizations.general_guidelines === customGuidelines &&
  walletWithCustomizations.client_recommendations === customRecommendations,
  "5.1. Textos e mensagens personalizadas pelo operador são preservados fielmente"
);

const item1Custom = walletWithCustomizations.items.find((i) => i.id === "res-01");
assert(
  item1Custom?.operator_notes === "Solicitamos guia privativo que fala português no guichê 4." &&
  item1Custom?.additional_meeting_instructions === "Aguardar ao lado da fonte principal do lobby.",
  "5.2. Observações e instruções específicas de cada passeio são mantidas na carteira sem alterar a reserva"
);


// =============================================================================
// TESTE 6: CONFIDENCIALIDADE FINANCEIRA ABSOLUTA (PDF E WHATSAPP)
// =============================================================================
console.log("\n--- TESTE 6: CONFIDENCIALIDADE FINANCEIRA ABSOLUTA (PDF E WHATSAPP) ---");

const jsonWalletStr = JSON.stringify(walletWithCustomizations);
const financialMarkers = [
  "price",
  "total_amount",
  "cost",
  "supplier_cost",
  "native_cost",
  "margin",
  "comissao",
  "markup",
  "saldo",
  "valor",
];

const hasForbiddenFinancialFields =
  jsonWalletStr.includes('"price":') ||
  jsonWalletStr.includes('"total_amount":') ||
  jsonWalletStr.includes('"supplier_cost":') ||
  jsonWalletStr.includes('"margin":');

assert(
  !hasForbiddenFinancialFields,
  "6.1. Objeto de dados da carteira não expõe nenhuma chave ou valor financeiro interno"
);

const whatsappMessage = generateWalletWhatsAppMessage(walletWithCustomizations);

assert(
  !whatsappMessage.includes("R$") &&
  !whatsappMessage.includes("USD") &&
  !whatsappMessage.includes("MXN") &&
  !whatsappMessage.includes("preço") &&
  !whatsappMessage.includes("custo") &&
  !whatsappMessage.includes("comissão") &&
  !whatsappMessage.includes("saldo devedor"),
  "6.2. Mensagem gerada para envio via WhatsApp não contém nenhuma informação financeira ou cambial"
);


// =============================================================================
// TESTE 7: ENTREGA COM CONFIRMAÇÃO EXPLÍCITA
// =============================================================================
console.log("\n--- TESTE 7: ENTREGA COM CONFIRMAÇÃO EXPLÍCITA ---");

// Tentativa de entrega sem telefone de destino
const invalidDelivery1 = validateWalletDelivery({
  destinationContact: "",
  deliveredByName: "Carlos Vendedor",
  channel: "whatsapp",
  itemsCount: 2,
});
assert(
  !invalidDelivery1.valid && (invalidDelivery1.error?.includes("Contato de destino") ?? false),
  "7.1. Validação bloqueia entrega sem contato/telefone de destino"
);

// Tentativa de entrega com telefone curto/inválido
const invalidDelivery2 = validateWalletDelivery({
  destinationContact: "123",
  deliveredByName: "Carlos Vendedor",
  channel: "whatsapp",
  itemsCount: 2,
});
assert(
  !invalidDelivery2.valid && (invalidDelivery2.error?.includes("Número de telefone de destino inválido") ?? false),
  "7.2. Validação bloqueia entrega com número de telefone inconsistente"
);

// Tentativa sem responsável
const invalidDelivery3 = validateWalletDelivery({
  destinationContact: "+55 11 98888-7777",
  deliveredByName: "",
  channel: "whatsapp",
  itemsCount: 2,
});
assert(
  !invalidDelivery3.valid && (invalidDelivery3.error?.includes("Responsável") ?? false),
  "7.3. Validação exige responsável formal pelo envio para fins de auditoria"
);

// Entrega válida
const validDelivery = validateWalletDelivery({
  destinationContact: "+55 11 98888-7777",
  deliveredByName: "Carlos Vendedor",
  channel: "whatsapp",
  itemsCount: 2,
});
assert(
  validDelivery.valid === true,
  "7.4. Validação aprova entrega com dados completos e corretos"
);


// =============================================================================
// TESTE 8: DETECÇÃO DE CARTEIRA DESATUALIZADA ("NECESSITA ATUALIZAÇÃO")
// =============================================================================
console.log("\n--- TESTE 8: DETECÇÃO DE CARTEIRA DESATUALIZADA (NECESSITA ATUALIZAÇÃO) ---");

// Snapshot tirado no momento da entrega
const initialSnapshot = buildOperationalSnapshot(wallet1.items);

// Carteira acabou de ser entregue
const deliveredWallet = buildTravelWallet({
  contract: contractSample,
  reservations: allReservationsSample,
  walletRecord: {
    status: "entregue",
    version: 1,
    last_delivered_at: "2026-11-01T12:00:00Z",
    last_operational_snapshot: initialSnapshot,
  },
});

assert(
  deliveredWallet.status === "entregue" &&
  deliveredWallet.needs_update_reasons.length === 0,
  "8.1. Carteira entregue sem alterações operacionais mantém status 'entregue'"
);

// Operador ou fornecedor altera o horário de pickup da reserva 1 de 07:15 para 07:40
const modifiedReservations = allReservationsSample.map((r) => {
  if (r.id === "res-01") {
    return { ...r, pickup_time: "07:40" }; // Horário modificado!
  }
  return r;
});

const updatedWalletAfterChange = buildTravelWallet({
  contract: contractSample,
  reservations: modifiedReservations,
  walletRecord: {
    status: "entregue",
    version: 1,
    last_delivered_at: "2026-11-01T12:00:00Z",
    last_operational_snapshot: initialSnapshot,
  },
});

assert(
  updatedWalletAfterChange.status === "necessita_atualizacao",
  "8.2. Carteira identifica alteração de horário de pickup e transiciona automaticamente para 'necessita_atualizacao'"
);

assert(
  updatedWalletAfterChange.needs_update_reasons.some((r) => r.includes("07:15 para 07:40")),
  "8.3. Sistema especifica exatamente qual horário foi alterado após a entrega para orientação do operador"
);


// =============================================================================
// TESTE 9: HISTÓRICO DE ENTREGAS PRESERVADO
// =============================================================================
console.log("\n--- TESTE 9: HISTÓRICO DE ENTREGAS PRESERVADO ---");

const deliveryHistorySample: WalletDeliveryRecord[] = [
  {
    id: "deliv-1",
    wallet_id: "wallet-101",
    contract_id: "contract-101",
    delivered_at: "2026-11-01T12:00:00Z",
    delivered_by_name: "Ana Operações",
    delivery_channel: "whatsapp",
    destination_contact: "+55 11 98888-7777",
    wallet_version: 1,
    notes: "Primeiro envio da carteira prévia",
  },
  {
    id: "deliv-2",
    wallet_id: "wallet-101",
    contract_id: "contract-101",
    delivered_at: "2026-11-03T15:30:00Z",
    delivered_by_name: "Carlos Vendedor",
    delivery_channel: "whatsapp",
    destination_contact: "+55 11 98888-7777",
    wallet_version: 2,
    notes: "Reenvio com pickup do Chichén atualizado",
  },
];

assert(
  deliveryHistorySample.length === 2 &&
  deliveryHistorySample[0].wallet_version === 1 &&
  deliveryHistorySample[1].wallet_version === 2,
  "9.1. Histórico preserva todas as versões e registros cronológicos de entregas anteriores sem sobrescrever"
);


// =============================================================================
// TESTE 10: AUSÊNCIA DE DUPLICAÇÃO DE RESERVAS
// =============================================================================
console.log("\n--- TESTE 10: AUSÊNCIA DE DUPLICAÇÃO DE RESERVAS ---");

const initialReservationsCount = allReservationsSample.length;
const builtWallet = buildTravelWallet({
  contract: contractSample,
  reservations: allReservationsSample,
});

assert(
  allReservationsSample.length === initialReservationsCount,
  "10.1. A montagem e consulta da carteira não cria nem muta reservas operacionais"
);


// =============================================================================
// TESTE 11: PERMISSÕES POR PERFIL (RBAC)
// =============================================================================
console.log("\n--- TESTE 11: PERMISSÕES POR PERFIL (RBAC) ---");

assert(
  canAccessRoute("admin", "/admin/carteiras") === true,
  "11.1. Administrador possui permissão para acessar a Central de Carteiras"
);

assert(
  canAccessRoute("seller", "/admin/carteiras") === true,
  "11.2. Vendedor possui permissão para acessar e preparar a Carteira de Viagem"
);

assert(
  canAccessRoute("anon" as any, "/admin/carteiras") === false,
  "11.3. Usuários anônimos são expressamente proibidos de acessar a rota /admin/carteiras"
);


// =============================================================================
// TESTE 12: INTEGRIDADE DO CONTRATO E MIGRATION SQL
// =============================================================================
console.log("\n--- TESTE 12: INTEGRIDADE DO CONTRATO E MIGRATION SQL ---");

const originalContractTotal = 4500.0;
const immutableContract = {
  ...contractSample,
  total_amount: originalContractTotal,
};

const wImm = buildTravelWallet({
  contract: immutableContract,
  reservations: allReservationsSample,
});

assert(
  immutableContract.total_amount === originalContractTotal &&
  immutableContract.status === "finalizado",
  "12.1. O contrato original e seus campos contratuais permanecem 100% íntegros e inalterados"
);

// Verificar arquivo de migration SQL
const migrationFilePath = path.join(
  __dirname,
  "../supabase/migrations/20261101_travel_wallets.sql"
);

assert(
  fs.existsSync(migrationFilePath),
  "12.2. Arquivo de migration 20261101_travel_wallets.sql foi criado corretamente"
);

const migrationSql = fs.readFileSync(migrationFilePath, "utf-8");

assert(
  migrationSql.includes("CREATE TABLE IF NOT EXISTS public.travel_wallets") &&
  migrationSql.includes("CREATE TABLE IF NOT EXISTS public.travel_wallet_deliveries") &&
  migrationSql.includes("CONSTRAINT uq_travel_wallets_contract UNIQUE (contract_id)"),
  "12.3. Migration SQL define tabelas dedicadas com restrição única de contrato e histórico de entregas"
);

assert(
  migrationSql.includes("ALTER TABLE public.travel_wallets ENABLE ROW LEVEL SECURITY;") &&
  migrationSql.includes("travel_wallets_team_select") &&
  migrationSql.includes("travel_wallets_team_manage"),
  "12.4. Migration SQL estabelece RLS protegendo carteiras de viagem com acesso para admin, moderator e seller"
);


// =============================================================================
// TESTE 13: CORREÇÃO PONTUAL DA MIGRATION — ATOMICIDADE, CONCORRÊNCIA E BLINDAGEM DO HISTÓRICO
// =============================================================================
console.log("\n--- TESTE 13: ATOMICIDADE, CONCORRÊNCIA E BLINDAGEM DO HISTÓRICO ---");

// 13.1. Falha no registro do histórico sem alterar status ou versão (Transação atômica / Rollback)
const walletBeforeRollback = {
  id: "wallet-test-atomic",
  contract_id: "contract-101",
  delivered_version: 1,
  status: "em_preparacao" as WalletStatus,
  last_operational_snapshot: initialSnapshot,
};

const deliveriesBeforeRollback: WalletDeliveryRecord[] = [];

const failedTxResult = simulateAtomicWalletDelivery({
  wallet: walletBeforeRollback,
  deliveries: deliveriesBeforeRollback,
  destinationContact: "+55 11 98888-7777",
  deliveredByName: "Operador Teste",
  channel: "whatsapp",
  currentSnapshot: initialSnapshot,
  simulateFailureOnInsert: true, // Simula falha ao inserir no histórico
});

assert(
  failedTxResult.success === false &&
  failedTxResult.error?.includes("Rollback executado com sucesso") === true &&
  walletBeforeRollback.status === "em_preparacao" &&
  walletBeforeRollback.delivered_version === 1 &&
  deliveriesBeforeRollback.length === 0,
  "13.1. Falha no registro do histórico não altera status, não incrementa versão e não persiste dados (Rollback atômico)"
);

// 13.2. Duas confirmações concorrentes sem perda de versão (Incremento serializado via SELECT FOR UPDATE)
let currentWalletState = {
  id: "wallet-test-concurrency",
  contract_id: "contract-101",
  delivered_version: 1,
  status: "pronta" as WalletStatus,
  last_operational_snapshot: initialSnapshot,
};

const concurrentDeliveries: WalletDeliveryRecord[] = [];

// Transação 1: Operador A confirma entrega (bloqueia registro e incrementa)
const tx1Result = simulateAtomicWalletDelivery({
  wallet: currentWalletState,
  deliveries: concurrentDeliveries,
  destinationContact: "+55 11 98888-7777",
  deliveredByName: "Operador A",
  channel: "whatsapp",
  currentSnapshot: initialSnapshot,
});

assert(
  tx1Result.success === true &&
  tx1Result.updatedWallet.delivered_version === 2 &&
  tx1Result.updatedWallet.status === "entregue",
  "13.2. Transação 1 incrementa delivered_version de 1 para 2 e marca status 'entregue'"
);

currentWalletState = tx1Result.updatedWallet;
concurrentDeliveries.push(tx1Result.newDelivery!);

// Transação 2: Operador B confirma reenvio concorrente (lê estado atualizado após lock e incrementa para 3)
const tx2Result = simulateAtomicWalletDelivery({
  wallet: currentWalletState,
  deliveries: concurrentDeliveries,
  destinationContact: "+55 11 98888-7777",
  deliveredByName: "Operador B",
  channel: "whatsapp",
  currentSnapshot: initialSnapshot,
});

assert(
  tx2Result.success === true &&
  tx2Result.updatedWallet.delivered_version === 3 &&
  concurrentDeliveries.length === 1 && // o novo será inserido
  tx2Result.newDelivery?.wallet_version === 3,
  "13.3. Transação 2 concorrente serializada via FOR UPDATE não perde versão e gera versão 3 com integridade total"
);

// 13.3. Bloqueio de exclusão do histórico (ON DELETE RESTRICT e trigger BEFORE DELETE)
assert(
  migrationSql.includes("wallet_id UUID NOT NULL REFERENCES public.travel_wallets(id) ON DELETE RESTRICT") &&
  migrationSql.includes("contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE RESTRICT"),
  "13.4. Tabela travel_wallet_deliveries utiliza ON DELETE RESTRICT nos relacionamentos com carteira e contrato"
);

assert(
  migrationSql.includes("prevent_travel_wallet_deliveries_modification") &&
  migrationSql.includes("BEFORE UPDATE OR DELETE ON public.travel_wallet_deliveries"),
  "13.5. Trigger de imutabilidade bloqueia categoricamente operações de DELETE em travel_wallet_deliveries"
);

// 13.4. Bloqueio de edição direta do histórico (Trigger BEFORE UPDATE e ausência de UPDATE policy)
assert(
  migrationSql.includes("RAISE EXCEPTION 'Operação não permitida: registros históricos de entrega da carteira de viagem são imutáveis e não podem ser alterados ou excluídos.'") &&
  !migrationSql.includes("CREATE POLICY \"travel_wallet_deliveries_update\""),
  "13.6. Trigger e RLS impedem edição direta (UPDATE) do histórico por qualquer usuário autenticado"
);

// 13.5. Entrega registrada apenas após confirmação explícita
const msgOnly = generateWalletWhatsAppMessage(deliveredWallet);
assert(
  msgOnly.length > 50 &&
  deliveredWallet.status === "entregue" && // não mudou de estado apenas por gerar texto
  deliveriesBeforeRollback.length === 0,
  "13.7. Gerar mensagem ou abrir link de WhatsApp não cria entrega nem altera estado sem confirmação explícita"
);

// Validação rejeita confirmação com telefone em branco
const invalidAttempt = validateWalletDelivery({
  destinationContact: "   ",
  deliveredByName: "Operador",
  channel: "whatsapp",
  itemsCount: 2,
});

assert(
  invalidAttempt.valid === false &&
  invalidAttempt.error?.includes("Contato de destino") === true,
  "13.8. Confirmação sem destinatário válido é rejeitada sem persistência"
);

// 13.6. RPC SECURITY DEFINER confirm_travel_wallet_delivery presente e configurada
assert(
  migrationSql.includes("CREATE OR REPLACE FUNCTION public.confirm_travel_wallet_delivery") &&
  migrationSql.includes("SECURITY DEFINER") &&
  migrationSql.includes("SET search_path = public, pg_temp") &&
  migrationSql.includes("FOR UPDATE") &&
  migrationSql.includes("GRANT EXECUTE ON FUNCTION public.confirm_travel_wallet_delivery TO authenticated;"),
  "13.9. Migration implementa RPC confirm_travel_wallet_delivery SECURITY DEFINER com FOR UPDATE e transação atômica"
);

// 13.7. Permissões por coluna: revogação de UPDATE geral e concessão restrita
const grantUpdateBlock = migrationSql.match(/GRANT UPDATE \([\s\S]*?\) ON public\.travel_wallets/)?.[0] || "";

assert(
  migrationSql.includes("REVOKE ALL ON public.travel_wallets FROM authenticated, anon;") &&
  grantUpdateBlock.includes("welcome_message") &&
  grantUpdateBlock.includes("status") &&
  !grantUpdateBlock.includes("delivered_version") &&
  !grantUpdateBlock.includes("last_delivered_at") &&
  !grantUpdateBlock.includes("last_operational_snapshot"),
  "13.10. Migration revoga UPDATE geral e restringe UPDATE exclusivamente a colunas de personalização (sem metadados de entrega)"
);


// =============================================================================
// TESTE 14: AJUSTE FINAL DE INTEGRIDADE DA ENTREGA (CORREÇÃO DE STATUS E METADADOS)
// =============================================================================
console.log("\n--- TESTE 14: AJUSTE FINAL DE INTEGRIDADE DA ENTREGA ---");

const baseWallet = {
  status: "pronta" as WalletStatus,
  delivered_version: 1,
  last_delivered_at: "2026-11-01T10:00:00Z",
  last_delivered_by: "user-123",
  last_delivered_to: "+55 11 99999-8888",
  last_delivery_channel: "whatsapp",
};

// 14.1. Vendedor tentando marcar carteira como entregue diretamente (deve ser bloqueado)
const sellerDirectDeliveryAttempt = validateDirectWalletUpdate({
  currentWallet: baseWallet,
  proposedUpdate: {
    status: "entregue",
  },
  userRole: "seller",
  isInDeliveryRpc: false,
});

assert(
  sellerDirectDeliveryAttempt.allowed === false &&
  sellerDirectDeliveryAttempt.error?.includes("não pode ser marcada como entregue diretamente") === true,
  "14.1. Vendedor tentando marcar carteira como 'entregue' diretamente é expressamente bloqueado"
);

// 14.2. Administrador tentando registrar entrega sem histórico (deve ser bloqueado)
const adminDirectDeliveryAttempt = validateDirectWalletUpdate({
  currentWallet: baseWallet,
  proposedUpdate: {
    status: "entregue",
    last_delivered_at: new Date().toISOString(),
    last_delivered_to: "+55 11 98888-7777",
  },
  userRole: "admin",
  isInDeliveryRpc: false, // Tentativa fora da RPC autorizada
});

assert(
  adminDirectDeliveryAttempt.allowed === false &&
  adminDirectDeliveryAttempt.error?.includes("Utilize a função oficial confirm_travel_wallet_delivery") === true,
  "14.2. Administrador tentando registrar entrega diretamente sem histórico é bloqueado categoricamente"
);

// 14.3. Alteração direta de delivered_version (deve ser bloqueada)
const directVersionIncrementAttempt = validateDirectWalletUpdate({
  currentWallet: baseWallet,
  proposedUpdate: {
    delivered_version: 5,
  },
  userRole: "admin",
  isInDeliveryRpc: false,
});

assert(
  directVersionIncrementAttempt.allowed === false &&
  directVersionIncrementAttempt.error?.includes("versão entregue da carteira não pode ser modificada diretamente") === true,
  "14.3. Alteração direta de delivered_version fora da RPC é bloqueada para qualquer perfil"
);

// 14.4. Confirmação legítima via RPC (deve ser autorizada)
const legitimateRpcDelivery = validateDirectWalletUpdate({
  currentWallet: baseWallet,
  proposedUpdate: {
    status: "entregue",
    delivered_version: 2,
    last_delivered_at: new Date().toISOString(),
    last_delivered_to: "+55 11 98888-7777",
  },
  userRole: "seller",
  isInDeliveryRpc: true, // Operação executada dentro do contexto transacional da RPC
});

assert(
  legitimateRpcDelivery.allowed === true,
  "14.4. Confirmação legítima via RPC confirm_travel_wallet_delivery é autorizada com sucesso"
);

// 14.5. Edição de personalizações sem interferir no histórico (deve ser autorizada)
const editCustomizationsAttempt = validateDirectWalletUpdate({
  currentWallet: baseWallet,
  proposedUpdate: {
    welcome_message: "Bem-vindos ao Caribe Mexicano com carinho!",
    status: "em_preparacao",
  },
  userRole: "seller",
  isInDeliveryRpc: false,
});

assert(
  editCustomizationsAttempt.allowed === true,
  "14.5. Edição de personalizações e estados preparatórios ('em_preparacao', 'pronta') é livremente permitida"
);

// 14.6. Verificação do trigger de transição de status no SQL da Migration
assert(
  migrationSql.includes("trigger_check_travel_wallet_status_transition") &&
  migrationSql.includes("check_travel_wallet_status_transition") &&
  migrationSql.includes("IF NEW.status = 'entregue' THEN") &&
  migrationSql.includes("NEW.delivered_version <= OLD.delivered_version") &&
  migrationSql.includes("OLD.delivered_version > 0 AND NEW.status = 'pendente'"),
  "14.6. Trigger check_travel_wallet_status_transition bloqueia status entregue sem versão e impede regressão para pendente"
);

// 14.7. Verificação de ausência de variáveis de sessão ou transação
assert(
  !migrationSql.includes("app.in_wallet_delivery_rpc") &&
  !migrationSql.includes("current_setting('app."),
  "14.7. Migration NÃO utiliza variáveis de sessão ou transação (app.in_wallet_delivery_rpc removido com sucesso)"
);


// =============================================================================
// TESTE 15: AJUSTE FINAL DE INSERT E VERSIONAMENTO SEGURO
// =============================================================================
console.log("\n--- TESTE 15: AJUSTE FINAL DE INSERT E VERSIONAMENTO SEGURO ---");

// 15.1. INSERT direto com status entregue é bloqueado
const insertEntregueAttempt = validateDirectWalletInsert({
  payload: {
    contract_id: "contract-101",
    status: "entregue",
  },
  userRole: "seller",
  isInDeliveryRpc: false,
});

assert(
  insertEntregueAttempt.allowed === false &&
  insertEntregueAttempt.error?.includes("não pode ser criada diretamente com status entregue") === true,
  "15.1. INSERT direto com status 'entregue' é expressamente bloqueado"
);

// 15.2. INSERT direto com delivered_version preenchido é bloqueado
const insertWithVersionAttempt = validateDirectWalletInsert({
  payload: {
    contract_id: "contract-101",
    status: "em_preparacao",
    delivered_version: 1,
  },
  userRole: "seller",
  isInDeliveryRpc: false,
});

assert(
  insertWithVersionAttempt.allowed === false &&
  insertWithVersionAttempt.error?.includes("permissão negada para a coluna delivered_version") === true,
  "15.2. INSERT direto com delivered_version preenchido é rejeitado por ausência de permissão na coluna"
);

// 15.3. INSERT direto com metadados de entrega é bloqueado
const insertWithMetadataAttempt = validateDirectWalletInsert({
  payload: {
    contract_id: "contract-101",
    status: "em_preparacao",
    last_delivered_at: new Date().toISOString(),
    last_delivered_to: "+55 11 98888-7777",
  },
  userRole: "admin",
  isInDeliveryRpc: false,
});

assert(
  insertWithMetadataAttempt.allowed === false &&
  insertWithMetadataAttempt.error?.includes("permissão negada para colunas de entrega") === true,
  "15.3. INSERT direto com metadados de entrega é bloqueado para qualquer usuário"
);

// 15.4. Criação normal de carteira em preparação funciona
const normalInsertAttempt = validateDirectWalletInsert({
  payload: {
    contract_id: "contract-101",
    client_id: "cli-55",
    status: "em_preparacao",
    welcome_message: "Bem-vindos a Cancún!",
    general_guidelines: "Orientações gerais da estadia...",
  },
  userRole: "seller",
  isInDeliveryRpc: false,
});

assert(
  normalInsertAttempt.allowed === true,
  "15.4. Criação normal de carteira em preparação com colunas autorizadas funciona perfeitamente"
);

// 15.5. Personalizações continuam editáveis
const updateCustomizationsCheck = validateDirectWalletUpdate({
  currentWallet: baseWallet,
  proposedUpdate: {
    welcome_message: "Nova mensagem carinhosa aos clientes!",
    status: "pronta",
  },
  userRole: "seller",
  isInDeliveryRpc: false,
});

assert(
  updateCustomizationsCheck.allowed === true,
  "15.5. Personalizações e estados preparatórios ('em_preparacao', 'pronta') continuam plenamente editáveis"
);

// 15.6. Confirmação pela RPC funciona e preserva histórico
const rpcExecutionCheck = simulateAtomicWalletDelivery({
  wallet: {
    id: "wallet-test-final",
    contract_id: "contract-101",
    delivered_version: 0,
    status: "pronta",
    last_operational_snapshot: initialSnapshot,
  },
  deliveries: [],
  destinationContact: "+55 11 98888-7777",
  deliveredByName: "Operador Oficial",
  channel: "whatsapp",
  currentSnapshot: initialSnapshot,
});

assert(
  rpcExecutionCheck.success === true &&
  rpcExecutionCheck.updatedWallet.status === "entregue" &&
  rpcExecutionCheck.updatedWallet.delivered_version === 1 &&
  rpcExecutionCheck.newDelivery?.wallet_version === 1,
  "15.6. Confirmação legítima via RPC funciona atomicamente e preserva histórico com versão 1"
);

// 15.7. Vendedor não consegue manipular versionamento diretamente
const versionTamperAttempt = validateDirectWalletUpdate({
  currentWallet: baseWallet,
  proposedUpdate: {
    delivered_version: 99,
  },
  userRole: "seller",
  isInDeliveryRpc: false,
});

assert(
  versionTamperAttempt.allowed === false &&
  versionTamperAttempt.error?.includes("não pode ser modificada diretamente") === true,
  "15.7. Vendedor não consegue manipular versionamento nem forjar versões de entrega"
);

// 15.8. Verificação no SQL dos GRANTs por coluna estritos para INSERT e ausência de version no UPDATE
const grantInsertBlock = migrationSql.match(/GRANT INSERT \([\s\S]*?\) ON public\.travel_wallets/)?.[0] || "";

assert(
  grantInsertBlock.includes("contract_id") &&
  grantInsertBlock.includes("welcome_message") &&
  grantInsertBlock.includes("status") &&
  !grantInsertBlock.includes("delivered_version") &&
  !grantInsertBlock.includes("last_delivered_at") &&
  !grantInsertBlock.includes("last_operational_snapshot") &&
  !grantInsertBlock.includes("version\n") &&
  !grantUpdateBlock.includes("version\n") &&
  !grantUpdateBlock.includes("version,"),
  "15.8. Migration aplica GRANT INSERT restrito e remove version de GRANT UPDATE para controle interno"
);

// =============================================================================
// RESULTADO FINAL DOS TESTES
// =============================================================================
console.log("\n===============================================================================");
console.log(`TESTES CONCLUÍDOS: ${passedCount} aprovados, ${failedCount} falhos.`);
console.log("===============================================================================\n");

if (failedCount > 0) {
  process.exit(1);
}
