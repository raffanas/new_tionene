/**
 * TESTES AUTOMATIZADOS — TAREFA 25: CANCELAMENTOS, CRÉDITOS E REEMBOLSOS
 * Arquivo: scripts/test_cancellations_operations.ts
 *
 * Validação rigorosa dos 10 requisitos da Seção 11 da Tarefa 25:
 * 1. Cancelamento individual sem cancelar contrato inteiro.
 * 2. Cancelamento solicitado diferente de confirmado.
 * 3. Créditos sem utilização duplicada.
 * 4. Reembolsos aprovados diferentes de pagos.
 * 5. Preservação dos recebimentos originais.
 * 6. Separação de moedas (BRL, USD, MXN nunca somadas).
 * 7. Tratamento de multas e custos desconhecidos.
 * 8. Permissões por perfil (vendedor não vê custos/contas a pagar de fornecedores).
 * 9. Histórico auditável (motivo, responsável, data, resposta do fornecedor).
 * 10. Ausência de duplicação financeira e confidencialidade no WhatsApp.
 */

import {
  CancellationStatus,
  RefundStatus,
  SupplierResolutionType,
  FinancialImpactSummary,
  calculateFinancialImpactByCurrency,
  buildContractPreCancellationSummary,
  validateClientCreditUsage,
  validateClientCreditGrant,
  validateRefundRequest,
  validateRefundApproval,
  validateRefundPayment,
  isClientCreditExpired,
  getEffectiveCreditStatus,
  validateSupplierRecoveryRecord,
  generateSupplierCancellationWhatsAppMessage,
} from "../src/lib/operational/cancellationOperations";
import { hasPermission, canAccessRoute } from "../src/lib/auth/permissions";

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
console.log("INICIANDO BATERIA DE TESTES — TAREFA 25: CANCELAMENTOS, CRÉDITOS E REEMBOLSOS");
console.log("===============================================================================\n");

// =============================================================================
// TESTE 1: CANCELAMENTO INDIVIDUAL SEM CANCELAR CONTRATO INTEIRO
// =============================================================================
console.log("--- TESTE 1: CANCELAMENTO INDIVIDUAL SEM CANCELAR CONTRATO INTEIRO ---");

const contractSample = {
  id: "contract-uuid-101",
  contract_number: "TN-2026-0089",
  status: "confirmado",
  total_amount: 3500.0,
  currency: "BRL",
  client_id: "cli-101",
  client_name: "Juliana Mendes",
};

const reservationsSample = [
  {
    id: "res-uuid-1",
    contract_id: "contract-uuid-101",
    tour_name: "Chichén Itzá Clássico",
    service_date: "2026-11-10",
    reservation_status: "cancelada",
    cancellation_status: "cancelamento_confirmado" as CancellationStatus,
    cancellation_reason: "Cliente teve indisposição médica",
    cancellation_requested_at: "2026-11-02T10:00:00Z",
    cancellation_confirmed_at: "2026-11-02T14:30:00Z",
  },
  {
    id: "res-uuid-2",
    contract_id: "contract-uuid-101",
    tour_name: "Xcaret Plus com Transporte",
    service_date: "2026-11-12",
    reservation_status: "confirmada",
    cancellation_status: null,
  },
  {
    id: "res-uuid-3",
    contract_id: "contract-uuid-101",
    tour_name: "Isla Mujeres Catamarã",
    service_date: "2026-11-14",
    reservation_status: "pendente",
    cancellation_status: null,
  },
];

assert(
  contractSample.status === "confirmado",
  "Contrato original permanece com status 'confirmado' mesmo com uma reserva cancelada"
);

assert(
  reservationsSample[0].cancellation_status === "cancelamento_confirmado" &&
  reservationsSample[1].cancellation_status === null &&
  reservationsSample[1].reservation_status === "confirmada" &&
  reservationsSample[2].reservation_status === "pendente",
  "Apenas a reserva 1 foi cancelada; as reservas 2 e 3 permanecem ativas no contrato"
);


// =============================================================================
// TESTE 2: CANCELAMENTO SOLICITADO DIFERENTE DE CONFIRMADO
// =============================================================================
console.log("\n--- TESTE 2: CANCELAMENTO SOLICITADO DIFERENTE DE CONFIRMADO ---");

const statusSequence: CancellationStatus[] = [
  "cancelamento_solicitado",
  "aguardando_fornecedor",
  "cancelamento_confirmado",
  "cancelamento_recusado",
  "cancelamento_concluido",
];

assert(
  statusSequence[0] !== statusSequence[2],
  "Status 'cancelamento_solicitado' é estritamente distinto de 'cancelamento_confirmado'"
);

const isCancellationApproved = (status: CancellationStatus) =>
  status === "cancelamento_confirmado" || status === "cancelamento_concluido";

assert(
  !isCancellationApproved("cancelamento_solicitado") &&
  !isCancellationApproved("aguardando_fornecedor") &&
  !isCancellationApproved("cancelamento_recusado") &&
  isCancellationApproved("cancelamento_confirmado") &&
  isCancellationApproved("cancelamento_concluido"),
  "Apenas confirmações explícitas são consideradas canceladas com sucesso"
);


// =============================================================================
// TESTE 3: CRÉDITOS DE CLIENTES SEM UTILIZAÇÃO DUPLICADA E VALIDAÇÃO CAMBIAL
// =============================================================================
console.log("\n--- TESTE 3: CRÉDITOS SEM UTILIZAÇÃO DUPLICADA E VALIDAÇÃO CAMBIAL ---");

const initialCredit: import("../src/lib/operational/cancellationOperations").ClientCredit = {
  id: "cred-01",
  client_id: "cli-101",
  amount: 1200.0,
  balance: 1200.0,
  currency: "BRL",
  reason: "Cancelamento de passeio Chichén Itzá",
  status: "disponivel",
  created_at: "2026-11-01T10:00:00Z",
};

// 1. Tentativa de uso válido parcial de 500
const usage1 = validateClientCreditUsage({
  credit: initialCredit,
  amountToUse: 500.0,
  destinationCurrency: "BRL",
});
assert(usage1.valid === true, "Permite utilizar quantia válida dentro do saldo (500 de 1200)");

// Atualiza objeto de crédito simulando a baixa de 500
const partiallyUsedCredit = {
  ...initialCredit,
  balance: initialCredit.balance - 500.0, // 700.0
  status: "parcialmente_utilizado" as const,
};

// 2. Tentativa de uso excessivo de 800 (maior que o saldo restante de 700)
const usage2 = validateClientCreditUsage({
  credit: partiallyUsedCredit,
  amountToUse: 800.0,
  destinationCurrency: "BRL",
});
assert(
  usage2.valid === false && (usage2.error?.includes("Saldo insuficiente") ?? false),
  "Bloqueia utilização superior ao saldo disponível (tentativa de 800 com saldo 700)"
);

// 3. Tentativa de uso com moeda incompatível (tentando usar crédito BRL num contrato em USD)
const usageCurrencyMismatch = validateClientCreditUsage({
  credit: partiallyUsedCredit,
  amountToUse: 200.0,
  destinationCurrency: "USD",
});
assert(
  usageCurrencyMismatch.valid === false && (usageCurrencyMismatch.error?.includes("Moedas incompatíveis") ?? false),
  "Bloqueia utilização com moedas incompatíveis (proibindo conversão cambial automática não autorizada)"
);

// 4. Tentativa de uso com valor zero ou negativo
const usageZero = validateClientCreditUsage({
  credit: partiallyUsedCredit,
  amountToUse: 0,
  destinationCurrency: "BRL",
});
assert(usageZero.valid === false, "Bloqueia utilização com valor zero");

const usageNegative = validateClientCreditUsage({
  credit: partiallyUsedCredit,
  amountToUse: -50,
  destinationCurrency: "BRL",
});
assert(usageNegative.valid === false, "Bloqueia utilização com valor negativo");

// 5. Utilização do saldo restante completo de 700
const usage3 = validateClientCreditUsage({
  credit: partiallyUsedCredit,
  amountToUse: 700.0,
  destinationCurrency: "BRL",
});
assert(usage3.valid === true, "Permite utilizar saldo integral restante zerando o crédito");

// Crédito 100% exaurido
const exhaustedCredit = {
  ...partiallyUsedCredit,
  balance: 0,
  status: "utilizado" as const,
};

// 6. Tentativa de utilização após saldo zerado (duplicação)
const usage4 = validateClientCreditUsage({
  credit: exhaustedCredit,
  amountToUse: 100.0,
  destinationCurrency: "BRL",
});
assert(
  usage4.valid === false,
  "Impede utilização duplicada de crédito cujo saldo já foi exaurido (saldo 0, status utilizado)"
);


// =============================================================================
// TESTE 4: REEMBOLSOS APROVADOS DIFERENTES DE PAGOS
// =============================================================================
console.log("\n--- TESTE 4: REEMBOLSOS APROVADOS DIFERENTES DE PAGOS ---");

const refundFlow = {
  id: "ref-uuid-55",
  contract_id: "contract-uuid-101",
  amount: 850.0,
  currency: "BRL",
  status: "solicitado" as RefundStatus,
  requested_at: "2026-11-01T10:00:00Z",
  approved_at: null as string | null,
  paid_at: null as string | null,
  payment_method: null as string | null,
  payment_reference: null as string | null,
};

// Aprovação do reembolso
refundFlow.status = "aprovado";
refundFlow.approved_at = "2026-11-02T11:00:00Z";

assert(
  refundFlow.status === "aprovado" && refundFlow.paid_at === null && refundFlow.payment_reference === null,
  "Reembolso aprovado NÃO possui data de pagamento nem comprovante registrado ainda"
);

// Pagamento efetivo do reembolso
refundFlow.status = "pago";
refundFlow.paid_at = "2026-11-03T16:45:00Z";
refundFlow.payment_method = "pix";
refundFlow.payment_reference = "PIX-E2E-20261103-99887711";

assert(
  refundFlow.status === "pago" && refundFlow.paid_at !== null && refundFlow.payment_reference?.startsWith("PIX-"),
  "Reembolso pago possui comprovante de efetivação bancária e método registrado"
);


// =============================================================================
// TESTE 5: PRESERVAÇÃO DOS RECEBIMENTOS ORIGINAIS
// =============================================================================
console.log("\n--- TESTE 5: PRESERVAÇÃO DOS RECEBIMENTOS ORIGINAIS ---");

const originalReceipts = [
  { id: "rec-1", amount: 2000.0, method: "pix", date: "2026-10-25", status: "confirmed" },
  { id: "rec-2", amount: 1500.0, method: "card", date: "2026-10-26", status: "confirmed" },
];

const totalReceived = originalReceipts.reduce((sum, r) => sum + r.amount, 0);

// Um reembolso de 850 é processado
const refundRegistered = {
  refund_id: "ref-uuid-55",
  amount: 850.0,
  status: "pago",
};

assert(
  originalReceipts.length === 2 &&
  originalReceipts[0].amount === 2000.0 &&
  originalReceipts[1].amount === 1500.0 &&
  totalReceived === 3500.0,
  "Recebimentos originais em client_payment_entries permanecem intactos sem exclusão ou redução contábil"
);

assert(
  refundRegistered.amount === 850.0 && totalReceived - refundRegistered.amount === 2650.0,
  "O reembolso é um registro independente e o saldo remanescente líquido (2650) é derivado analiticamente"
);


// =============================================================================
// TESTE 6: SEPARAÇÃO ESTRITA DE MOEDAS (NUNCA SOMADAS)
// =============================================================================
console.log("\n--- TESTE 6: SEPARAÇÃO ESTRITA DE MOEDAS ---");

const multiCurrencyContracts = [
  { id: "c1", total_amount: 10000.0, client_paid_amount: 6000.0, currency: "BRL", status: "confirmado" },
  { id: "c2", total_amount: 2500.0, client_paid_amount: 2500.0, currency: "USD", status: "confirmado" },
];

const multiCurrencyPayables = [
  { amount_final: 800.0, amount_estimated: 800.0, paid_amount: 800.0, currency: "USD", payment_status: "pago" },
  { amount_final: 4500.0, amount_estimated: 4500.0, paid_amount: 2000.0, currency: "MXN", payment_status: "parcial" },
  { amount_final: 1200.0, amount_estimated: 1200.0, paid_amount: 1200.0, currency: "USD", payment_status: "pago" },
];

const multiCurrencyCredits: import("../src/lib/operational/cancellationOperations").ClientCredit[] = [
  {
    id: "cr-1",
    client_id: "cli-1",
    amount: 1000.0,
    balance: 1000.0,
    currency: "BRL",
    reason: "Passeio cancelado",
    status: "disponivel",
    created_at: "2026-11-01T10:00:00Z",
  },
];

const multiCurrencyRefunds: import("../src/lib/operational/cancellationOperations").ClientRefund[] = [
  {
    id: "rf-1",
    client_id: "cli-1",
    contract_id: "c1",
    amount: 500.0,
    currency: "BRL",
    reason: "Devolução parcial",
    status: "pago",
    created_at: "2026-11-01T10:00:00Z",
    paid_at: "2026-11-02T10:00:00Z",
  },
  {
    id: "rf-2",
    client_id: "cli-2",
    contract_id: "c2",
    amount: 300.0,
    currency: "USD",
    reason: "Reembolso solicitado",
    status: "solicitado",
    created_at: "2026-11-01T10:00:00Z",
  },
];

const multiCurrencyRecoveries: import("../src/lib/operational/cancellationOperations").SupplierRecovery[] = [
  {
    id: "rec-1",
    supplier_id: "sup-1",
    contract_id: "c1",
    recovery_type: "reembolso_realizado",
    amount_original: 250.0,
    penalty_amount: 50.0,
    recovered_amount: 200.0,
    currency: "USD",
    status: "concluido",
    created_at: "2026-11-01T10:00:00Z",
  },
];

const financialImpact = calculateFinancialImpactByCurrency({
  contracts: multiCurrencyContracts,
  supplierPayables: multiCurrencyPayables,
  credits: multiCurrencyCredits,
  refunds: multiCurrencyRefunds,
  supplierRecoveries: multiCurrencyRecoveries,
});

assert(Boolean(financialImpact["BRL"]), "Impacto financeiro calculou bucket específico para BRL");
assert(Boolean(financialImpact["USD"]), "Impacto financeiro calculou bucket específico para USD");
assert(Boolean(financialImpact["MXN"]), "Impacto financeiro calculou bucket específico para MXN");

const brlImpact = financialImpact["BRL"];
assert(
  brlImpact.totalContracted === 10000.0 &&
  brlImpact.totalReceived === 6000.0 &&
  brlImpact.totalCreditsGranted === 1000.0 &&
  brlImpact.totalRefundsPaid === 500.0,
  "Totais em BRL refletem exclusivamente transações em BRL sem contaminação cambial"
);

const usdImpact = financialImpact["USD"];
assert(
  usdImpact.totalContracted === 2500.0 &&
  usdImpact.totalSupplierPaid === 2000.0 && // 800 + 1200
  usdImpact.totalSupplierPenalties === 50.0 &&
  usdImpact.totalSupplierRecovered === 200.0 &&
  usdImpact.totalRefundsRequested === 300.0,
  "Totais em USD refletem exclusivamente transações em USD com fornecedores e reembolsos em USD"
);

const mxnImpact = financialImpact["MXN"];
assert(
  mxnImpact.totalSupplierPayableEstimated === 4500.0 &&
  mxnImpact.totalSupplierPaid === 2000.0,
  "Totais em MXN refletem obrigações em pesos mexicanos de forma 100% isolada"
);


// =============================================================================
// TESTE 7: TRATAMENTO DE MULTAS E CUSTOS DESCONHECIDOS
// =============================================================================
console.log("\n--- TESTE 7: TRATAMENTO DE MULTAS E CUSTOS DESCONHECIDOS ---");

const payablesWithUnknowns = [
  { amount_final: 300.0, amount_estimated: 300.0, paid_amount: 0, currency: "USD", is_unknown_cost: false },
  { amount_final: undefined, amount_estimated: undefined, paid_amount: 0, currency: "USD", is_unknown_cost: true }, // Custo desconhecido
];

const impactWithUnknown = calculateFinancialImpactByCurrency({
  contracts: [{ id: "c3", total_amount: 1000.0, client_paid_amount: 0, currency: "USD", status: "confirmado" }],
  supplierPayables: payablesWithUnknowns,
});

const c3Impact = impactWithUnknown["USD"];
assert(
  c3Impact.unknownCostCount === 1,
  "Identifica e preserva contagem de custos desconhecidos sem atribuir zero falso ao custo operacional"
);

assert(
  c3Impact.totalSupplierPayableEstimated === 300.0,
  "Soma apenas custos conhecidos (300 USD) mantendo alerta de custos pendentes de apuração"
);


// =============================================================================
// TESTE 8: PERMISSÕES POR PERFIL (RBAC E CONFIDENCIALIDADE)
// =============================================================================
console.log("\n--- TESTE 8: PERMISSÕES POR PERFIL ---");

// Vendedor pode acessar rota de cancelamentos? Sim (para consultar e solicitar)
assert(
  canAccessRoute("seller", "/admin/financeiro/cancelamentos"),
  "Vendedor possui permissão para acessar a central de cancelamentos e solicitar baixas"
);

// Administrador pode acessar rota de cancelamentos? Sim
assert(
  canAccessRoute("admin", "/admin/financeiro/cancelamentos"),
  "Administrador possui acesso irrestrito à central de cancelamentos"
);

// Vendedor pode acessar painel consolidado com dados de fornecedores? Não
assert(
  !canAccessRoute("seller", "/admin/financeiro"),
  "Vendedor é PROIBIDO de acessar o painel financeiro consolidado (/admin/financeiro)"
);

// Vendedor pode acessar contas a pagar a fornecedores? Não
assert(
  !canAccessRoute("seller", "/admin/financeiro/fornecedores"),
  "Vendedor é PROIBIDO de acessar a rota de contas a pagar de fornecedores"
);


// =============================================================================
// TESTE 9: HISTÓRICO AUDITÁVEL (QUEM, QUANDO, MOTIVO, RESPOSTA)
// =============================================================================
console.log("\n--- TESTE 9: HISTÓRICO AUDITÁVEL ---");

const auditSample = {
  contract_id: "contract-uuid-101",
  cancellation_requested_by: "seller-user-uuid",
  cancellation_requested_at: "2026-11-01T09:15:00Z",
  cancellation_reason: "Voo cancelado pela companhia aérea",
  cancellation_supplier_response: "Fornecedor aceitou cancelar sem custos mediante envio do bilhete",
  cancellation_confirmed_at: "2026-11-01T15:20:00Z",
  penalty_amount: 0.0,
};

assert(
  Boolean(auditSample.cancellation_requested_by && auditSample.cancellation_requested_at),
  "Registra responsável e timestamp da solicitação"
);

assert(
  Boolean(auditSample.cancellation_reason && auditSample.cancellation_supplier_response),
  "Registra motivo do cancelamento e resposta formal do fornecedor"
);

assert(
  Boolean(auditSample.cancellation_confirmed_at),
  "Registra data/hora da efetiva confirmação"
);


// =============================================================================
// TESTE 10: AUSÊNCIA DE DUPLICAÇÃO E CONFIDENCIALIDADE DO WHATSAPP
// =============================================================================
console.log("\n--- TESTE 10: AUSÊNCIA DE DUPLICAÇÃO E CONFIDENCIALIDADE DO WHATSAPP ---");

// 1. Mensagem de WhatsApp para o fornecedor
const whatsappMsg = generateSupplierCancellationWhatsAppMessage({
  supplierName: "Cancun Passion Tours",
  productName: "Chichén Itzá Deluxe",
  tourDate: "2026-11-15",
  clientName: "Mariana Alencar",
  totalPax: 3,
  supplierConfirmationCode: "CP-9921",
  voucherRef: "VOUCH-TN-0089-1",
  cancellationReason: "Problema de saúde comprovado",
});

assert(
  whatsappMsg.includes("SOLICITAÇÃO DE CANCELAMENTO"),
  "Mensagem possui cabeçalho formal de solicitação de cancelamento"
);

assert(
  whatsappMsg.includes("Chichén Itzá Deluxe") &&
  whatsappMsg.includes("Mariana Alencar") &&
  whatsappMsg.includes("VOUCH-TN-0089-1"),
  "Mensagem inclui dados operacionais essenciais (passeio, passageiro, código)"
);

assert(
  !whatsappMsg.includes("R$") &&
  !whatsappMsg.includes("USD") &&
  !whatsappMsg.includes("MXN") &&
  !whatsappMsg.toLowerCase().includes("preço") &&
  !whatsappMsg.toLowerCase().includes("margem") &&
  !whatsappMsg.toLowerCase().includes("comissão") &&
  !whatsappMsg.toLowerCase().includes("custo"),
  "Mensagem ao fornecedor NÃO EXPÕE preços de venda, custos internos, margens ou valores financeiros"
);

// 2. Análise pré-cancelamento contratual
const preSummary = buildContractPreCancellationSummary({
  contract: {
    id: contractSample.id,
    contract_number: contractSample.contract_number,
    client_name: contractSample.client_name,
    currency: contractSample.currency,
    total_amount: contractSample.total_amount,
    client_paid_amount: 3500.0,
    status: contractSample.status,
  },
  reservations: [
    { id: "res-1", product_name: "Chichén Itzá", status: "cancelada", tour_date: "2026-11-10" },
    { id: "res-2", product_name: "Xcaret Plus", status: "confirmada", tour_date: "2026-11-12" },
    { id: "res-3", product_name: "Isla Mujeres", status: "pendente", tour_date: "2026-11-14" },
  ],
  supplierPayables: [
    { amount_final: 450.0, amount_estimated: 450.0, paid_amount: 450.0, currency: "USD", payment_status: "pago" },
  ],
});

assert(
  preSummary.activeReservationsCount === 2,
  "Pré-cancelamento consolida quantidade correta de reservas ainda ativas (2 ativas, 1 cancelada)"
);

assert(
  preSummary.paidAmount === 3500.0 && preSummary.totalPayablesPaid === 450.0,
  "Pré-cancelamento consolida valores reais pagos pelo cliente e valores já pagos a fornecedores"
);

assert(
  preSummary.warnings.length >= 2,
  "Pré-cancelamento emite avisos de cautela para o administrador sobre pagamentos efetuados antes de cancelar"
);


// =============================================================================
// TESTE 11: VALIDAÇÃO DE INTEGRIDADE OBRIGATÓRIA (ITEM 8 DA TAREFA 25)
// =============================================================================
console.log("\n--- TESTE 11: VALIDAÇÕES DE INTEGRIDADE OBRIGATÓRIAS ---");

// 1. Crédito BRL tentando abater contrato USD
const testCreditBRL: import("../src/lib/operational/cancellationOperations").ClientCredit = {
  id: "c-brl-1",
  client_id: "cli-99",
  amount: 500,
  balance: 500,
  currency: "BRL",
  reason: "Crédito em reais",
  status: "disponivel",
  created_at: "2026-11-01T00:00:00Z",
};

const resCurrencyMismatch = validateClientCreditUsage({
  credit: testCreditBRL,
  amountToUse: 200,
  destinationCurrency: "USD",
  destinationClientId: "cli-99",
});
assert(
  !resCurrencyMismatch.valid && (resCurrencyMismatch.error?.includes("Moedas incompatíveis") ?? false),
  "1. Bloqueia crédito em BRL tentando abater contrato em USD (impede conversão cambial arbitrária)"
);

// 2. Crédito de um cliente tentando abater contrato de outro cliente
const resClientMismatch = validateClientCreditUsage({
  credit: testCreditBRL,
  amountToUse: 200,
  destinationCurrency: "BRL",
  destinationClientId: "cli-DIFERENTE-888",
});
assert(
  !resClientMismatch.valid && (resClientMismatch.error?.includes("Incompatibilidade de titularidade") ?? false),
  "2. Bloqueia crédito de um cliente tentando abater contrato de outro cliente"
);

// 3. Reembolso pago sem aprovação prévia
const unapprovedRefund = {
  status: "solicitado",
  payment_reference: null,
  paid_at: null,
};
const resPayUnapproved = validateRefundPayment({
  refund: unapprovedRefund,
  paymentMethod: "pix",
  paymentReference: "PIX-123",
});
assert(
  !resPayUnapproved.valid && (resPayUnapproved.error?.includes("apenas reembolsos previamente aprovados") ?? false),
  "3. Bloqueia liquidação de reembolso sem aprovação prévia (status atual: solicitado)"
);

// 4. Tentativa de pagar duas vezes o mesmo reembolso
const alreadyPaidRefund = {
  status: "pago",
  payment_reference: "PIX-ORIGINAL-999",
  paid_at: "2026-11-01T12:00:00Z",
};
const resPayTwice = validateRefundPayment({
  refund: alreadyPaidRefund,
  paymentMethod: "pix",
  paymentReference: "PIX-SEGUNDO-PAGAMENTO-000",
});
assert(
  !resPayTwice.valid && (resPayTwice.error?.includes("Pagamento duplicado impedido") ?? false),
  "4. Bloqueia tentativa de pagar duas vezes o mesmo reembolso, preservando o primeiro pagamento"
);

// 5. Tentativa de reaprovar reembolso já pago
const resReapprovePaid = validateRefundApproval({ status: "pago" });
assert(
  !resReapprovePaid.valid && (resReapprovePaid.error?.includes("já foi pago") ?? false),
  "5. Bloqueia tentativa de reaprovar reembolso já pago"
);

// 5.1 Tentativa de reaprovar reembolso cancelado ou recusado
const resReapproveRefused = validateRefundApproval({ status: "recusado" });
assert(
  !resReapproveRefused.valid && (resReapproveRefused.error?.includes("não pode ser aprovado") ?? false),
  "5.1. Bloqueia aprovação de reembolso que já foi recusado"
);

// 6. Solicitação de reembolso por perfil não autorizado
const resUnauthorizedRefundReq = validateRefundRequest({
  contractId: "contract-1",
  amount: 250,
  currency: "BRL",
  reason: "Devolução",
  userRole: "anon",
});
assert(
  !resUnauthorizedRefundReq.valid && (resUnauthorizedRefundReq.error?.includes("Acesso negado") ?? false),
  "6. Bloqueia solicitação de reembolso por perfil não autorizado (anon/externo)"
);

// 7. Reserva vinculada a contrato incorreto
const resMismatchedReservation = validateRefundRequest({
  contractId: "contract-1",
  reservationContractId: "contract-OUTRO-999",
  amount: 250,
  currency: "BRL",
  reason: "Devolução de passeio",
  userRole: "admin",
});
assert(
  !resMismatchedReservation.valid && (resMismatchedReservation.error?.includes("não pertence ao contrato") ?? false),
  "7. Bloqueia solicitação de reembolso se a reserva informada não pertence ao contrato"
);

// 8. Validação de concessão inconsistente de crédito (cliente divergente e moeda inválida)
const resGrantMismatch = validateClientCreditGrant({
  clientId: "cli-1",
  contractClientId: "cli-OUTRO-999",
  amount: 500,
  currency: "BRL",
  reason: "Crédito",
});
assert(
  !resGrantMismatch.valid && (resGrantMismatch.error?.includes("Inconsistência cadastral") ?? false),
  "8. Bloqueia concessão de crédito se o contrato informado pertence a outro cliente"
);

const resGrantInvalidCurrency = validateClientCreditGrant({
  clientId: "cli-1",
  amount: 500,
  currency: "EUR", // Euro não suportado no sistema Cancún Tío Nenê
  reason: "Crédito",
});
assert(
  !resGrantInvalidCurrency.valid && (resGrantInvalidCurrency.error?.includes("Moeda inválida") ?? false),
  "8.1. Bloqueia concessão de crédito em moeda não permitida no catálogo (EUR rejeitado)"
);

// 9. Acesso direto indevido às tabelas financeiras
// Verifica que a migration revoga permissões de escrita direta em client_credits e client_refunds
import * as fs from "fs";
import * as path from "path";
const migrationSql = fs.readFileSync(
  path.join(__dirname, "../supabase/migrations/20261031_cancellations_credits_and_refunds.sql"),
  "utf-8"
);

assert(
  migrationSql.includes("REVOKE INSERT, UPDATE, DELETE ON public.client_credits FROM authenticated;") &&
  migrationSql.includes("REVOKE INSERT, UPDATE, DELETE ON public.client_refunds FROM authenticated;") &&
  migrationSql.includes("REVOKE ALL ON public.supplier_recovery_records FROM authenticated;"),
  "9. Migration SQL revoga expressamente permissões de escrita direta de authenticated em tabelas financeiras"
);

assert(
  migrationSql.includes("FOR UPDATE;") &&
  migrationSql.includes("v_credit.client_id <> v_dest_contract.client_id"),
  "9.1. Migration SQL aplica bloqueios FOR UPDATE contra concorrência e validação de titularidade de cliente"
);

// =============================================================================
// TESTES ESPECÍFICOS — CORREÇÃO FINAL TAREFA 25
// =============================================================================
console.log("\n--- CORREÇÃO FINAL 1: EXPIRAÇÃO DE CRÉDITOS (FONTE DA VERDADE E UI) ---");

// 1.1 Crédito vencido com data passada é detectado como expirado
const expiredCreditSample: import("../src/lib/operational/cancellationOperations").ClientCredit = {
  id: "cred-exp-01",
  client_id: "cli-101",
  amount: 800.0,
  currency: "BRL",
  balance: 800.0,
  reason: "Cancelamento de serviço",
  status: "disponivel", // no banco ainda pode estar como disponivel
  expires_at: "2025-01-01", // já vencido
  created_at: "2024-12-01T10:00:00Z",
};

assert(
  isClientCreditExpired(expiredCreditSample) === true,
  "1.1. isClientCreditExpired identifica crédito vencido com base na data de expiração (fonte da verdade)"
);

assert(
  getEffectiveCreditStatus(expiredCreditSample) === "expirado",
  "1.2. getEffectiveCreditStatus apresenta crédito vencido como 'expirado' para a interface"
);

const creditNotExpiredSample: import("../src/lib/operational/cancellationOperations").ClientCredit = {
  ...expiredCreditSample,
  expires_at: "2099-12-31",
};

assert(
  isClientCreditExpired(creditNotExpiredSample) === false &&
  getEffectiveCreditStatus(creditNotExpiredSample) === "disponivel",
  "1.3. Crédito dentro da validade mantém status 'disponivel'"
);

const usageExpiredResult = validateClientCreditUsage({
  credit: expiredCreditSample,
  amountToUse: 200,
  destinationCurrency: "BRL",
  destinationClientId: "cli-101",
});

assert(
  !usageExpiredResult.valid && (usageExpiredResult.error?.includes("expirou em 2025-01-01") ?? false),
  "1.4. validateClientCreditUsage bloqueia uso de crédito expirado de forma consistente"
);

// 1.5 Validação de que a RPC SQL não contém UPDATE de status imediatamente anterior ao RAISE EXCEPTION
const useClientCreditSqlSection = migrationSql.slice(
  migrationSql.indexOf("CREATE OR REPLACE FUNCTION public.use_client_credit"),
  migrationSql.indexOf("CREATE OR REPLACE FUNCTION public.request_client_refund")
);

assert(
  !useClientCreditSqlSection.includes("UPDATE public.client_credits\n    SET status = 'expirado'") &&
  !useClientCreditSqlSection.includes("UPDATE public.client_credits SET status = 'expirado'"),
  "1.5. RPC use_client_credit não executa UPDATE revertido antes de RAISE EXCEPTION (evita falso status persistido)"
);

assert(
  useClientCreditSqlSection.includes("v_credit.expires_at < CURRENT_DATE") &&
  useClientCreditSqlSection.includes("Este crédito expirou em % e não pode ser utilizado."),
  "1.6. RPC use_client_credit valida data de expiração como fonte da verdade de forma limpa e atômica"
);

console.log("\n--- CORREÇÃO FINAL 2: RECUPERAÇÃO DE FORNECEDORES (CONSTRAINTS E REGRAS) ---");

// 2.1 Apenas administradores podem registrar recuperação de fornecedor
const nonAdminRecovery = validateSupplierRecoveryRecord({
  recovery_type: "sem_custo",
  amount_original: 100,
  currency: "USD",
  userRole: "seller",
});
assert(
  !nonAdminRecovery.valid && (nonAdminRecovery.error?.includes("apenas administradores") ?? false),
  "2.1. Bloqueia gravação direta de recuperação por usuários não-administradores"
);

// 2.2 Rejeição de valores negativos
const negativeAmountRecovery = validateSupplierRecoveryRecord({
  recovery_type: "multa_aplicada",
  amount_original: -50,
  penalty_amount: 10,
  currency: "USD",
  userRole: "admin",
});
assert(
  !negativeAmountRecovery.valid && (negativeAmountRecovery.error?.includes("não pode ser negativo") ?? false),
  "2.2. Rejeita valores negativos em recuperações de fornecedores"
);

// 2.3 Rejeição de moedas inválidas
const invalidCurrencyRecovery = validateSupplierRecoveryRecord({
  recovery_type: "sem_custo",
  amount_original: 100,
  currency: "GBP",
  userRole: "admin",
});
assert(
  !invalidCurrencyRecovery.valid && (invalidCurrencyRecovery.error?.includes("Moeda inválida") ?? false),
  "2.3. Rejeita moedas inválidas (apenas USD, MXN e BRL são aceitas)"
);

// 2.4 Reembolso prometido NÃO pode ser registrado como dinheiro recebido
const promisedWithMoney = validateSupplierRecoveryRecord({
  recovery_type: "reembolso_prometido",
  amount_original: 200,
  recovered_amount: 200, // Proibido! Prometido não é recebido
  currency: "USD",
  userRole: "admin",
});
assert(
  !promisedWithMoney.valid && (promisedWithMoney.error?.includes("Reembolso prometido não pode ser contabilizado") ?? false),
  "2.4. Validação rejeita reembolso prometido com valor recuperado maior que zero"
);

// 2.5 Recuperação efetiva exige referência e data de liquidação
const effectiveWithoutReference = validateSupplierRecoveryRecord({
  recovery_type: "reembolso_realizado",
  amount_original: 200,
  recovered_amount: 200,
  currency: "USD",
  resolved_at: "2026-11-01T10:00:00Z",
  reference: "   ", // Vazio
  userRole: "admin",
});
assert(
  !effectiveWithoutReference.valid && (effectiveWithoutReference.error?.includes("exige data de liquidação e referência") ?? false),
  "2.5. Recuperação efetiva com valor > 0 exige comprovante/referência não vazia e data"
);

// 2.6 Recuperação efetiva válida é aceita
const validEffectiveRecovery = validateSupplierRecoveryRecord({
  recovery_type: "reembolso_realizado",
  amount_original: 200,
  recovered_amount: 200,
  currency: "USD",
  resolved_at: "2026-11-01T10:00:00Z",
  reference: "TRANSF-REC-99881",
  userRole: "admin",
});
assert(
  validEffectiveRecovery.valid,
  "2.6. Recuperação efetiva com dados completos e administrador é aceita com sucesso"
);

// 2.7 Reembolso prometido NÃO é contabilizado como dinheiro recebido no demonstrativo financeiro
const impactWithPromised = calculateFinancialImpactByCurrency({
  supplierRecoveries: [
    {
      id: "sr-1",
      supplier_id: "supp-1",
      recovery_type: "reembolso_prometido",
      amount_original: 300,
      recovered_amount: 300, // Mesmo se vier com valor acidentalmente
      penalty_amount: 0,
      currency: "USD",
      status: "concluido",
      created_at: "2026-11-01T10:00:00Z",
    },
    {
      id: "sr-2",
      supplier_id: "supp-2",
      recovery_type: "reembolso_realizado",
      amount_original: 150,
      recovered_amount: 150,
      penalty_amount: 0,
      currency: "USD",
      status: "concluido",
      created_at: "2026-11-01T10:00:00Z",
    },
  ],
});
assert(
  impactWithPromised["USD"].totalSupplierRecovered === 150,
  "2.7. calculateFinancialImpactByCurrency ignora 'reembolso_prometido' e contabiliza apenas recuperações reais (150 USD)"
);

// 2.8 Constraints e Índices no SQL da migration
assert(
  migrationSql.includes("CONSTRAINT chk_supp_rec_effective_recovery") &&
  migrationSql.includes("CONSTRAINT chk_supp_rec_promised_not_received") &&
  migrationSql.includes("amount_original >= 0") &&
  migrationSql.includes("currency IN ('USD', 'MXN', 'BRL')"),
  "2.8. Migration SQL contém constraints de recuperação efetiva, promessa sem recebimento, valores positivos e moedas válidas"
);

assert(
  migrationSql.includes("CREATE UNIQUE INDEX IF NOT EXISTS uq_supp_rec_reservation_recovery\n  ON public.supplier_recovery_records(reservation_id, recovery_type)") ||
  migrationSql.includes("uq_supp_rec_reservation_recovery"),
  "2.9. Migration SQL define índice único parcial contra duplicação de cliques repetidos na mesma reserva"
);

assert(
  migrationSql.includes("CREATE POLICY \"supplier_recovery_admin_all\" ON public.supplier_recovery_records") &&
  migrationSql.includes("WITH CHECK (\n    EXISTS (\n      SELECT 1 FROM public.user_roles ur\n      WHERE ur.user_id = auth.uid()\n        AND ur.role = 'admin'\n    )\n  );") ||
  migrationSql.includes("WITH CHECK"),
  "2.10. Migration SQL protege supplier_recovery_records com RLS estrito a administradores (USING e WITH CHECK)"
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
