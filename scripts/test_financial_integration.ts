/**
 * BATERIA DE TESTES DE INTEGRAÇÃO FINANCEIRA PONTA A PONTA — TAREFA 31
 * Projeto: Tío Nenê — Agência de Turismo (v0.1.43)
 * Arquivo: scripts/test_financial_integration.ts
 *
 * Escopo Completo da Auditoria:
 * 1. Schema Financeiro & Integridade Estrutural
 * 2. Contas a Receber dos Clientes (USD, BRL com FX explícito, quitação, estorno, idempotência, anti-mistura)
 * 3. Contas a Pagar a Fornecedores (MXN, USD, custos NULL, aprovação, pagamentos parciais, quitação, estorno, idempotência de finalização)
 * 4. Cancelamentos, Créditos e Reembolsos (cancelamento parcial vs total, créditos sem duplicidade, reembolsos pagos vs aprovados, recuperações)
 * 5. Painel Financeiro Consolidado (segregação por moeda, fluxo de caixa realizado vs competência, custos provisórios, exclusão de estornos)
 * 6. Segurança e RBAC (Admin completo vs Vendedor isolado, proteções em banco e API)
 */

import {
  calculateContractReceivableBalance,
  calculateClientFinancialKpis,
  calculateExchangeAmortization,
  recordClientPayment,
  reverseClientPayment,
  formatReceivableCurrency,
  ClientReceivableKpiSummary,
} from "../src/lib/financial/clientFinance";

import {
  calculatePayableBalance,
  calculateSupplierFinancialKpis,
  approveSupplierPayableCost,
  recordSupplierPayment,
  reverseSupplierPayment,
  CurrencyKpiSummary,
} from "../src/lib/financial/supplierFinance";

import {
  calculateConsolidatedFinancialKpis,
  filterFinancialData,
  formatFinancialCurrency,
  ConsolidatedFinancialSummary,
} from "../src/lib/financial/consolidatedFinance";

import {
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
  ClientCredit,
  ClientCreditUsage,
  ClientRefund,
  SupplierRecovery,
} from "../src/lib/operational/cancellationOperations";

import {
  hasPermission,
  canAccessRoute,
  ROUTE_ACCESS_RULES,
  ROLE_PERMISSIONS,
} from "../src/lib/auth/permissions";

import type {
  ClientReceivable,
  ClientPaymentEntry,
  SupplierPayable,
  SupplierPaymentEntry,
  ClientPaymentStatus,
  SupplierPaymentStatus,
} from "../src/types/operational";

// =============================================================================
// RUNNER E CONTADORES
// =============================================================================

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}${detail ? ` -> ${detail}` : ""}`);
    failedTests++;
  }
}

// =============================================================================
// BANCO DE DADOS EM MEMÓRIA PARA SIMULAR SUPABASE RPCs E CONCORRÊNCIA
// =============================================================================

class MockFinancialDatabase {
  contracts: Map<string, any> = new Map();
  clientPaymentEntries: Map<string, any> = new Map();
  supplierPayables: Map<string, any> = new Map();
  supplierPaymentEntries: Map<string, any> = new Map();
  clientCredits: Map<string, any> = new Map();
  clientCreditUsages: Map<string, any> = new Map();
  clientRefunds: Map<string, any> = new Map();
  supplierRecoveries: Map<string, any> = new Map();
  currentUser: { id: string; role: "admin" | "moderator" | "user" } = {
    id: "usr-admin-01",
    role: "admin",
  };

  setUser(id: string, role: "admin" | "moderator" | "user") {
    this.currentUser = { id, role };
  }

  // Simulação RPC: record_client_payment
  async rpcRecordClientPayment(params: {
    p_contract_id: string;
    p_amount_received: number;
    p_received_currency?: string;
    p_exchange_rate?: number;
    p_amortized_amount?: number | null;
    p_exchange_rate_date?: string | null;
    p_exchange_rate_source?: string | null;
    p_payment_method?: string;
    p_payment_date?: string;
    p_reference?: string | null;
    p_notes?: string | null;
    p_idempotency_key?: string | null;
  }) {
    if (!this.currentUser) {
      return { data: null, error: { message: "Acesso negado: operação requer usuário autenticado." } };
    }

    if (!["admin", "moderator", "user"].includes(this.currentUser.role)) {
      return { data: null, error: { message: "Acesso negado: usuário não possui permissão para registrar recebimentos." } };
    }

    const contract = this.contracts.get(params.p_contract_id);
    if (!contract) {
      return { data: null, error: { message: `Contrato não encontrado (ID: ${params.p_contract_id})` } };
    }

    if (contract.status === "rascunho") {
      return { data: null, error: { message: "Não é permitido registrar recebimento em contrato com status rascunho." } };
    }

    if (contract.status === "cancelado") {
      return { data: null, error: { message: "Não é permitido registrar recebimento em contrato cancelado." } };
    }

    if (!params.p_amount_received || params.p_amount_received <= 0) {
      return { data: null, error: { message: "Valor recebido deve ser maior que zero." } };
    }

    const recvCurr = (params.p_received_currency || "BRL").toUpperCase().trim();
    const ctrCurr = (contract.currency || "USD").toUpperCase().trim();

    let rate = 1.0;
    let amortized = 0;

    if (recvCurr === ctrCurr) {
      rate = 1.0;
      amortized = Math.round(params.p_amount_received * 100) / 100;
    } else {
      if (!params.p_exchange_rate || params.p_exchange_rate <= 0) {
        return { data: null, error: { message: "Para recebimentos em moeda diferente, é obrigatório taxa maior que zero." } };
      }
      if (!params.p_exchange_rate_date) {
        return { data: null, error: { message: "Para operações cambiais, é obrigatório informar a data da cotação." } };
      }
      if (!params.p_exchange_rate_source || !params.p_exchange_rate_source.trim()) {
        return { data: null, error: { message: "Para operações cambiais, é obrigatório informar a fonte da cotação." } };
      }

      rate = params.p_exchange_rate;
      if (ctrCurr === "USD" && recvCurr === "BRL") {
        amortized = Math.round((params.p_amount_received / rate) * 100) / 100;
      } else if (ctrCurr === "BRL" && recvCurr === "USD") {
        amortized = Math.round(params.p_amount_received * rate * 100) / 100;
      } else {
        return { data: null, error: { message: `Conversão cambial não suportada entre ${recvCurr} e ${ctrCurr}.` } };
      }
    }

    // Idempotência
    if (params.p_idempotency_key) {
      for (const entry of this.clientPaymentEntries.values()) {
        if (entry.idempotency_key === params.p_idempotency_key) {
          if (
            entry.contract_id !== params.p_contract_id ||
            entry.amount_received !== params.p_amount_received ||
            entry.received_currency !== recvCurr ||
            entry.exchange_rate !== rate
          ) {
            return { data: null, error: { message: `Conflito de idempotência: a chave já foi utilizada com parâmetros divergentes.` } };
          }
          return {
            data: {
              success: true,
              entry_id: entry.id,
              contract_id: entry.contract_id,
              amount_received: entry.amount_received,
              received_currency: entry.received_currency,
              exchange_rate: entry.exchange_rate,
              amortized_amount: entry.amortized_amount,
              contract_currency: contract.currency,
              total_contracted: contract.total_amount,
              total_paid: contract.client_paid_amount,
              pending_balance: Math.max(0, contract.total_amount - contract.client_paid_amount),
              payment_status: contract.client_payment_status,
              is_idempotent_replay: true,
              message: "Recebimento já processado anteriormente (idempotência confirmada).",
            },
            error: null,
          };
        }
      }
    }

    // Validar saldo pendente
    const currentPaid = contract.client_paid_amount || 0;
    const pendingBalance = contract.total_amount - currentPaid;
    if (amortized > pendingBalance + 0.005) {
      return { data: null, error: { message: `Valor amortizado (${amortized} ${ctrCurr}) excede o saldo pendente (${pendingBalance} ${ctrCurr}).` } };
    }

    const newEntryId = `entry-cli-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newEntry: any = {
      id: newEntryId,
      contract_id: contract.id,
      client_id: contract.client_id,
      amount_received: params.p_amount_received,
      received_currency: recvCurr,
      exchange_rate: rate,
      amortized_amount: amortized,
      contract_currency: ctrCurr,
      exchange_rate_date: params.p_exchange_rate_date || null,
      exchange_rate_source: params.p_exchange_rate_source || null,
      payment_date: params.p_payment_date || new Date().toISOString().split("T")[0],
      payment_method: params.p_payment_method || "transferencia",
      reference: params.p_reference || null,
      notes: params.p_notes || null,
      idempotency_key: params.p_idempotency_key || null,
      created_by: this.currentUser.id,
      is_reversed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.clientPaymentEntries.set(newEntryId, newEntry);

    const newPaidTotal = currentPaid + amortized;
    const newPending = Math.max(0, contract.total_amount - newPaidTotal);
    let newStatus: ClientPaymentStatus = "pendente";
    if (newPending <= 0.005) {
      newStatus = "pago";
    } else if (newPaidTotal > 0) {
      newStatus = "parcialmente_pago";
    }

    contract.client_paid_amount = newPaidTotal;
    contract.client_payment_status = newStatus;
    contract.last_client_payment_at = new Date().toISOString();

    return {
      data: {
        success: true,
        entry_id: newEntryId,
        contract_id: contract.id,
        amount_received: params.p_amount_received,
        received_currency: recvCurr,
        exchange_rate: rate,
        amortized_amount: amortized,
        contract_currency: ctrCurr,
        total_contracted: contract.total_amount,
        total_paid: newPaidTotal,
        pending_balance: newPending,
        payment_status: newStatus,
        is_idempotent_replay: false,
        message: "Recebimento de cliente registrado com sucesso.",
      },
      error: null,
    };
  }

  // Simulação RPC: reverse_client_payment
  async rpcReverseClientPayment(params: {
    p_payment_entry_id: string;
    p_reversal_reason: string;
  }) {
    if (!this.currentUser || this.currentUser.role !== "admin") {
      return { data: null, error: { message: "Acesso negado: apenas administradores podem estornar recebimentos de clientes." } };
    }

    if (!params.p_reversal_reason || !params.p_reversal_reason.trim()) {
      return { data: null, error: { message: "É obrigatório informar a justificativa do estorno para fins de auditoria." } };
    }

    const entry = this.clientPaymentEntries.get(params.p_payment_entry_id);
    if (!entry) {
      return { data: null, error: { message: `Lançamento não encontrado: ${params.p_payment_entry_id}` } };
    }

    if (entry.is_reversed) {
      return { data: null, error: { message: "Este recebimento já foi estornado anteriormente." } };
    }

    const contract = this.contracts.get(entry.contract_id);
    if (!contract) {
      return { data: null, error: { message: "Contrato associado não encontrado." } };
    }

    // Marcar estorno
    entry.is_reversed = true;
    entry.reversed_at = new Date().toISOString();
    entry.reversed_by = this.currentUser.id;
    entry.reversal_reason = params.p_reversal_reason;

    // Recalcular saldo contratual a partir dos lançamentos ativos
    let activePaidTotal = 0;
    for (const e of this.clientPaymentEntries.values()) {
      if (e.contract_id === contract.id && !e.is_reversed) {
        activePaidTotal += e.amortized_amount;
      }
    }

    const newPending = Math.max(0, contract.total_amount - activePaidTotal);
    let newStatus: ClientPaymentStatus = "pendente";
    if (activePaidTotal > 0 && newPending > 0.005) {
      newStatus = "parcialmente_pago";
    } else if (newPending <= 0.005 && contract.total_amount > 0) {
      newStatus = "pago";
    }

    contract.client_paid_amount = activePaidTotal;
    contract.client_payment_status = newStatus;

    return {
      data: {
        success: true,
        payment_entry_id: entry.id,
        contract_id: contract.id,
        reversed_amortized_amount: entry.amortized_amount,
        recalculated_paid_amount: activePaidTotal,
        pending_balance: newPending,
        new_payment_status: newStatus,
        message: "Estorno de recebimento executado com sucesso.",
      },
      error: null,
    };
  }

  // Simulação RPC: approve_supplier_cost
  async rpcApproveSupplierCost(params: {
    p_payable_id: string;
    p_amount_final: number | null;
    p_is_unknown_cost?: boolean;
    p_notes?: string;
  }) {
    if (!this.currentUser || this.currentUser.role !== "admin") {
      return { data: null, error: { message: "Acesso negado: apenas administradores podem aprovar custos de fornecedores." } };
    }

    const payable = this.supplierPayables.get(params.p_payable_id);
    if (!payable) {
      return { data: null, error: { message: "Obrigação com fornecedor não encontrada." } };
    }

    if (params.p_is_unknown_cost) {
      payable.is_unknown_cost = true;
      payable.amount_final = null;
      payable.payment_status = "aguardando_aprovacao";
    } else {
      if (params.p_amount_final === null || params.p_amount_final === undefined || params.p_amount_final < 0) {
        return { data: null, error: { message: "Valor final do custo deve ser maior ou igual a zero." } };
      }
      payable.is_unknown_cost = false;
      payable.amount_final = params.p_amount_final;
      payable.cost_approved_at = new Date().toISOString();
      payable.cost_approved_by = this.currentUser.id;
      payable.cost_approval_notes = params.p_notes || null;

      if (payable.paid_amount >= payable.amount_final && payable.amount_final > 0) {
        payable.payment_status = "pago";
      } else if (payable.paid_amount > 0) {
        payable.payment_status = "parcialmente_pago";
      } else {
        payable.payment_status = "aprovado";
      }
    }

    return {
      data: {
        success: true,
        payable_id: payable.id,
        amount_final: payable.amount_final,
        payment_status: payable.payment_status,
      },
      error: null,
    };
  }

  // Simulação RPC: record_supplier_payment
  async rpcRecordSupplierPayment(params: {
    p_payable_id: string;
    p_amount: number;
    p_payment_method?: string;
    p_payment_date?: string;
    p_reference?: string;
    p_notes?: string;
  }) {
    if (!this.currentUser || this.currentUser.role !== "admin") {
      return { data: null, error: { message: "Acesso negado: apenas administradores podem registrar pagamentos a fornecedores." } };
    }

    const payable = this.supplierPayables.get(params.p_payable_id);
    if (!payable) {
      return { data: null, error: { message: "Obrigação não encontrada." } };
    }

    if (payable.payment_status === "cancelado") {
      return { data: null, error: { message: "Não é permitido pagar obrigação cancelada." } };
    }

    if (payable.is_unknown_cost || payable.amount_final === null || payable.amount_final === undefined) {
      return { data: null, error: { message: "Não é permitido pagar obrigação com custo desconhecido ou não aprovado." } };
    }

    const currentPaid = payable.paid_amount || 0;
    const pendingBalance = payable.amount_final - currentPaid;
    if (params.p_amount > pendingBalance + 0.005) {
      return { data: null, error: { message: `Valor informado excede o saldo pendente aprovado (${pendingBalance} ${payable.currency}).` } };
    }

    const entryId = `entry-sup-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newEntry = {
      id: entryId,
      payable_id: payable.id,
      supplier_id: payable.supplier_id,
      amount: params.p_amount,
      currency: payable.currency,
      payment_date: params.p_payment_date || new Date().toISOString().split("T")[0],
      payment_method: params.p_payment_method || "transferencia",
      reference: params.p_reference || null,
      notes: params.p_notes || null,
      created_by: this.currentUser.id,
      is_reversed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.supplierPaymentEntries.set(entryId, newEntry);

    const newPaid = currentPaid + params.p_amount;
    const newPending = Math.max(0, payable.amount_final - newPaid);
    payable.paid_amount = newPaid;
    payable.payment_status = newPending <= 0.005 ? "pago" : "parcialmente_pago";

    return {
      data: {
        success: true,
        entry_id: entryId,
        payable_id: payable.id,
        amount_paid: params.p_amount,
        total_paid: newPaid,
        new_paid_total: newPaid,
        pending_balance: newPending,
        payment_status: payable.payment_status,
        currency: payable.currency,
      },
      error: null,
    };
  }

  // Simulação RPC: reverse_supplier_payment
  async rpcReverseSupplierPayment(params: {
    p_payment_entry_id: string;
    p_reversal_reason: string;
  }) {
    if (!this.currentUser || this.currentUser.role !== "admin") {
      return { data: null, error: { message: "Acesso negado: apenas administradores podem estornar pagamentos a fornecedores." } };
    }

    if (!params.p_reversal_reason || !params.p_reversal_reason.trim()) {
      return { data: null, error: { message: "É obrigatório informar a justificativa do estorno." } };
    }

    const entry = this.supplierPaymentEntries.get(params.p_payment_entry_id);
    if (!entry) {
      return { data: null, error: { message: "Lançamento de pagamento não encontrado." } };
    }

    if (entry.is_reversed) {
      return { data: null, error: { message: "Este pagamento já foi estornado anteriormente." } };
    }

    const payable = this.supplierPayables.get(entry.payable_id);
    if (!payable) {
      return { data: null, error: { message: "Obrigação relacionada não encontrada." } };
    }

    entry.is_reversed = true;
    entry.reversed_at = new Date().toISOString();
    entry.reversed_by = this.currentUser.id;
    entry.reversal_reason = params.p_reversal_reason;

    // Recalcular a partir dos ativos
    let activePaid = 0;
    for (const e of this.supplierPaymentEntries.values()) {
      if (e.payable_id === payable.id && !e.is_reversed) {
        activePaid += e.amount;
      }
    }

    payable.paid_amount = activePaid;
    const targetAmount = payable.amount_final !== null ? payable.amount_final : payable.amount_estimated || 0;
    const newPending = Math.max(0, targetAmount - activePaid);

    if (activePaid === 0) {
      payable.payment_status = payable.amount_final !== null ? "aprovado" : "previsto";
    } else if (newPending <= 0.005) {
      payable.payment_status = "pago";
    } else {
      payable.payment_status = "parcialmente_pago";
    }

    return {
      data: {
        success: true,
        entry_id: entry.id,
        payment_entry_id: entry.id,
        payable_id: payable.id,
        reversed_amount: entry.amount,
        recalculated_paid_amount: activePaid,
        new_paid_total: activePaid,
        pending_balance: newPending,
        new_payment_status: payable.payment_status,
        payment_status: payable.payment_status,
        currency: payable.currency,
      },
      error: null,
    };
  }

  // Wrapper compatível com o cliente Supabase
  createSupabaseClient() {
    const self = this;
    return {
      rpc: async (funcName: string, args: any) => {
        if (funcName === "record_client_payment") {
          return self.rpcRecordClientPayment(args);
        }
        if (funcName === "reverse_client_payment") {
          return self.rpcReverseClientPayment(args);
        }
        if (funcName === "approve_supplier_payable_cost" || funcName === "approve_supplier_cost") {
          return self.rpcApproveSupplierCost(args);
        }
        if (funcName === "record_supplier_payment") {
          return self.rpcRecordSupplierPayment(args);
        }
        if (funcName === "reverse_supplier_payment") {
          return self.rpcReverseSupplierPayment(args);
        }
        return { data: null, error: { message: `Função RPC desconhecida: ${funcName}` } };
      },
      from: (table: string) => {
        return {
          select: (columns: string) => ({
            eq: (col: string, val: any) => ({
              order: (ord: string, opt: any) => {
                let items: any[] = [];
                if (table === "client_payment_entries") {
                  items = Array.from(self.clientPaymentEntries.values()).filter((e) => e[col] === val);
                } else if (table === "supplier_payment_entries") {
                  items = Array.from(self.supplierPaymentEntries.values()).filter((e) => e[col] === val);
                }
                return Promise.resolve({ data: items, error: null });
              },
            }),
            order: (ord: string, opt: any) => {
              let items: any[] = [];
              if (table === "contracts") items = Array.from(self.contracts.values());
              if (table === "supplier_payables") items = Array.from(self.supplierPayables.values());
              if (table === "client_payment_entries") items = Array.from(self.clientPaymentEntries.values());
              if (table === "supplier_payment_entries") items = Array.from(self.supplierPaymentEntries.values());
              return Promise.resolve({ data: items, error: null });
            },
          }),
        };
      },
    };
  }
}

// =============================================================================
// EXECUÇÃO DA BATERIA DE AUDITORIA
// =============================================================================

async function runFinancialIntegrationAudit() {
  console.log("===============================================================================");
  console.log("AUDITORIA DE INTEGRAÇÃO FINANCEIRA PONTA A PONTA — TÍO NENÊ v0.1.43");
  console.log("===============================================================================\n");

  const db = new MockFinancialDatabase();
  const mockSupabase = db.createSupabaseClient();

  // ---------------------------------------------------------------------------
  // SEÇÃO 1: AUDITORIA DO SCHEMA E MIGRATIONS
  // ---------------------------------------------------------------------------
  console.log("--- SEÇÃO 1: SCHEMA FINANCEIRO & INTEGRIDADE DE MIGRATIONS ---");

  // Verificar contratos elegíveis e status suportados
  assert(
    typeof calculateContractReceivableBalance === "function",
    "Função calculateContractReceivableBalance disponível para cálculo de saldos"
  );
  assert(
    typeof calculateExchangeAmortization === "function",
    "Função calculateExchangeAmortization disponível para controle cambial explícito"
  );
  assert(
    typeof calculateSupplierFinancialKpis === "function",
    "Função calculateSupplierFinancialKpis disponível para segregação de fornecedores"
  );
  assert(
    typeof calculateConsolidatedFinancialKpis === "function",
    "Função calculateConsolidatedFinancialKpis disponível para painel financeiro consolidado"
  );

  // ---------------------------------------------------------------------------
  // SEÇÃO 2: CONTAS A RECEBER DOS CLIENTES & CONTROLE CAMBIAL
  // ---------------------------------------------------------------------------
  console.log("\n--- SEÇÃO 2: CONTAS A RECEBER DOS CLIENTES & CONTROLE CAMBIAL ---");

  // 1. Contrato com valor em USD 1.200,00
  const contractUSDId = "contract-usd-audit-01";
  db.contracts.set(contractUSDId, {
    id: contractUSDId,
    contract_number: "TN-2026-USD01",
    client_id: "client-marcos-01",
    client_name: "Marcos Vinicius",
    status: "finalizado",
    total_amount: 1200.0,
    currency: "USD",
    client_paid_amount: 0,
    client_payment_status: "pendente",
  });

  // Validação inicial do saldo do contrato
  const bal0 = calculateContractReceivableBalance(db.contracts.get(contractUSDId));
  assert(bal0.pendingBalance === 1200.0, "Saldo inicial a receber é exatamente USD 1.200,00");
  assert(bal0.status === "pendente", "Status inicial é 'pendente'");

  // 2. Recebimento parcial em USD: USD 400,00
  db.setUser("usr-vendedor-01", "user"); // Vendedor autorizado a registrar
  const res1 = await recordClientPayment(mockSupabase, {
    contractId: contractUSDId,
    amountReceived: 400.0,
    receivedCurrency: "USD",
    exchangeRate: 1.0,
    paymentMethod: "cartao_credito",
    reference: "AUTH_CC_9918",
  });

  assert(res1.success === true, "Recebimento parcial de USD 400 registrado com sucesso");
  assert(res1.amortizedAmount === 400.0, "Amortizado no contrato USD 400.00");
  assert(res1.pendingBalance === 800.0, "Saldo pendente recalculado para USD 800.00");
  assert(res1.paymentStatus === "parcialmente_pago", "Status atualizado para 'parcialmente_pago'");

  // 3. Recebimento parcial em BRL: R$ 2.600,00 com taxa explícita 5,20 BRL/USD
  // Amortização oficial: 2.600 / 5,20 = USD 500,00
  const fxCalc = calculateExchangeAmortization(2600.0, "BRL", "USD", 5.20);
  assert(fxCalc.amortizedAmount === 500.0, "Cálculo oficial de conversão cambial: R$ 2.600 ÷ 5.20 = USD 500.00");
  assert(fxCalc.isCrossCurrency === true, "Identificado corretamente como operação multi-moeda (cross-currency)");

  const idempotencyKeyBRL = "idem-pay-brl-500usd";
  const res2 = await recordClientPayment(mockSupabase, {
    contractId: contractUSDId,
    amountReceived: 2600.0,
    receivedCurrency: "BRL",
    exchangeRate: 5.20,
    amortizedAmount: 500.0,
    exchangeRateDate: "2026-10-26",
    exchangeRateSource: "Cotação Comercial do Dia",
    paymentMethod: "pix",
    reference: "PIX_E2E_881923",
    idempotencyKey: idempotencyKeyBRL,
  });

  assert(res2.success === true, "Recebimento em BRL registrado com taxa explícita");
  assert(res2.amortizedAmount === 500.0, "Valor amortizado no contrato em USD foi de exatamente 500.00");
  assert(res2.pendingBalance === 300.0, "Saldo pendente após pagamento em BRL é de USD 300.00");
  assert(res2.totalPaid === 900.0, "Total pago acumulado no contrato é de USD 900.00");

  // 4. Tentativa de duplicação com mesma chave de idempotência
  const resDup = await recordClientPayment(mockSupabase, {
    contractId: contractUSDId,
    amountReceived: 2600.0,
    receivedCurrency: "BRL",
    exchangeRate: 5.20,
    amortizedAmount: 500.0,
    exchangeRateDate: "2026-10-26",
    exchangeRateSource: "Cotação Comercial do Dia",
    paymentMethod: "pix",
    reference: "PIX_E2E_881923",
    idempotencyKey: idempotencyKeyBRL,
  });

  assert(resDup.success === true, "Reenvio idempotente acolhido sem erro");
  assert(resDup.isIdempotentReplay === true, "Sinalizador isIdempotentReplay = true confirmado");
  assert(resDup.totalPaid === 900.0, "Saldo e total pago não foram duplicados (total continua USD 900.00)");

  // 5. Tentativa de violação com parâmetros divergentes na mesma chave de idempotência
  let dupConflict = false;
  try {
    await recordClientPayment(mockSupabase, {
      contractId: contractUSDId,
      amountReceived: 1000.0, // Divergente
      receivedCurrency: "BRL",
      exchangeRate: 5.20,
      amortizedAmount: 192.31,
      exchangeRateDate: "2026-10-26",
      exchangeRateSource: "Cotação Comercial",
      paymentMethod: "pix",
      idempotencyKey: idempotencyKeyBRL,
    });
  } catch (err: any) {
    dupConflict = true;
  }
  assert(dupConflict, "Conflito de idempotência rejeitado quando parâmetros divergem");

  // 6. Quitação do saldo residual: USD 300,00
  const resQuit = await recordClientPayment(mockSupabase, {
    contractId: contractUSDId,
    amountReceived: 300.0,
    receivedCurrency: "USD",
    exchangeRate: 1.0,
    paymentMethod: "transferencia",
    reference: "TED_FINAL_QUIT",
  });

  assert(resQuit.success === true, "Quitação de USD 300.00 realizada com sucesso");
  assert(resQuit.pendingBalance === 0.0, "Saldo pendente zerado (USD 0.00)");
  assert(resQuit.paymentStatus === "pago", "Status final do contrato atualizado para 'pago' (quitado)");

  // 7. Tentativa de pagamento excedente em contrato já quitado
  let overpayBlocked = false;
  try {
    await recordClientPayment(mockSupabase, {
      contractId: contractUSDId,
      amountReceived: 50.0,
      receivedCurrency: "USD",
      exchangeRate: 1.0,
      paymentMethod: "especie",
    });
  } catch (err: any) {
    overpayBlocked = true;
  }
  assert(overpayBlocked, "Pagamento superior ao saldo pendente foi estritamente bloqueado");

  // 8. Tentativa de estorno por vendedor (deve ser rejeitada: exclusivo admin)
  let sellerReversalBlocked = false;
  try {
    await reverseClientPayment(mockSupabase, {
      paymentEntryId: resQuit.entryId!,
      reversalReason: "Tentativa de estorno por vendedor",
      isAdmin: false,
    });
  } catch (err: any) {
    sellerReversalBlocked = true;
  }
  assert(sellerReversalBlocked, "Vendedor impedido de executar estorno de recebimento");

  // 9. Estorno legítimo por Administrador
  db.setUser("usr-admin-01", "admin");
  const revRes = await reverseClientPayment(mockSupabase, {
    paymentEntryId: resQuit.entryId!,
    reversalReason: "Estorno auditado: TED devolvida pelo banco emissor por divergência de titularidade",
    isAdmin: true,
  });

  assert(revRes.success === true, "Estorno executado com sucesso pelo administrador");
  assert(revRes.reversedAmortizedAmount === 300.0, "Amortização estornada de USD 300.00");
  assert(revRes.recalculatedPaidAmount === 900.0, "Total pago recalculado para USD 900.00");
  assert(revRes.pendingBalance === 300.0, "Saldo pendente reaberto para USD 300.00");
  assert(revRes.newPaymentStatus === "parcialmente_pago", "Status redefinido para 'parcialmente_pago'");

  // 10. Garantir que lançamento estornado não foi deletado do banco
  const reversedEntry = db.clientPaymentEntries.get(resQuit.entryId!);
  assert(reversedEntry !== undefined, "Registro estornado continua existindo no banco de dados");
  assert(reversedEntry.is_reversed === true, "Flag is_reversed = true gravada de forma permanente");
  assert(reversedEntry.reversal_reason.includes("TED devolvida"), "Motivo da auditoria gravado com precisão");

  // 11. Segregação estrita de moedas nos KPIs
  const clientKpis = calculateClientFinancialKpis([
    {
      id: contractUSDId,
      contract_number: "TN-2026-USD01",
      total_amount: 1200.0,
      currency: "USD",
      client_paid_amount: 900.0,
      pending_balance: 300.0,
      client_payment_status: "parcialmente_pago",
      sale_date: "2026-10-26",
      client_name: "Marcos Vinicius",
      status: "finalizado",
    },
  ]);

  assert(clientKpis["USD"] !== undefined, "KPI de USD gerado com sucesso");
  assert(clientKpis["USD"].totalContracted === 1200.0, "USD total contratado = 1.200,00");
  assert(clientKpis["USD"].totalReceived === 900.0, "USD total recebido = 900,00");
  assert(clientKpis["USD"].totalPending === 300.0, "USD total pendente = 300,00");
  assert(clientKpis["BRL"] === undefined, "BRL não misturado na soma de contratos em USD");

  // ---------------------------------------------------------------------------
  // SEÇÃO 3: CONTAS A PAGAR A FORNECEDORES (USD, MXN, CUSTOS NULL)
  // ---------------------------------------------------------------------------
  console.log("\n--- SEÇÃO 3: CONTAS A PAGAR A FORNECEDORES & CUSTOS CONFIDENCIAIS ---");

  // Finalização gerando obrigações:
  // Fornecedor 1: Dolphin Discovery em USD (previsto 350.00)
  const payableUSD: SupplierPayable = {
    id: "pay-dolphin-usd",
    contract_id: contractUSDId,
    contract_item_id: "item-dolphin-01",
    supplier_id: "supp-dolphin",
    supplier_name: "Dolphin Discovery",
    service_date: "2026-11-15",
    description: "Nado com Golfinhos Swim Adventure",
    currency: "USD",
    amount_estimated: 350.0,
    amount_final: null, // Aguardando aprovação
    is_unknown_cost: false,
    payment_status: "previsto",
    paid_amount: 0,
    created_at: "2026-10-26T10:00:00Z",
    updated_at: "2026-10-26T10:00:00Z",
  };
  db.supplierPayables.set(payableUSD.id, payableUSD);

  // Fornecedor 2: Xcaret Park em MXN (previsto 4.500 MXN)
  const payableMXN: SupplierPayable = {
    id: "pay-xcaret-mxn",
    contract_id: contractUSDId,
    contract_item_id: "item-xcaret-02",
    supplier_id: "supp-xcaret",
    supplier_name: "Grupo Xcaret",
    service_date: "2026-11-16",
    description: "Entrada Parque Xcaret Plus",
    currency: "MXN",
    amount_estimated: 4500.0,
    amount_final: null, // Aguardando aprovação
    is_unknown_cost: false,
    payment_status: "previsto",
    paid_amount: 0,
    created_at: "2026-10-26T10:00:00Z",
    updated_at: "2026-10-26T10:00:00Z",
  };
  db.supplierPayables.set(payableMXN.id, payableMXN);

  // Fornecedor 3: Custo sob consulta / Desconhecido (NULL)
  const payableUnknown: SupplierPayable = {
    id: "pay-yacht-unknown",
    contract_id: contractUSDId,
    contract_item_id: "item-yacht-03",
    supplier_id: "supp-marina",
    supplier_name: "Marina Private Charter",
    service_date: "2026-11-17",
    description: "Aluguel de Iate Privativo 42ft - Sob Consulta",
    currency: "USD",
    amount_estimated: null,
    amount_final: null,
    is_unknown_cost: true,
    payment_status: "aguardando_aprovacao",
    paid_amount: 0,
    created_at: "2026-10-26T10:00:00Z",
    updated_at: "2026-10-26T10:00:00Z",
  };
  db.supplierPayables.set(payableUnknown.id, payableUnknown);

  // 1. Custos desconhecidos permanecem estritamente NULL
  const balUnk = calculatePayableBalance(payableUnknown);
  assert(balUnk.isUnknown === true, "Obrigação identificada como custo desconhecido");
  assert(balUnk.effectiveAmount === null, "Valor efetivo de custo desconhecido é estritamente NULL (nunca 0.00)");
  assert(balUnk.pendingBalance === null, "Saldo pendente de custo desconhecido é estritamente NULL");

  // 2. Tentativa de pagar custo desconhecido ou não aprovado é bloqueada
  let unapprovedPaymentBlocked = false;
  try {
    await recordSupplierPayment(mockSupabase, {
      payableId: payableUnknown.id,
      amount: 100.0,
      isAdmin: true,
    });
  } catch (err: any) {
    unapprovedPaymentBlocked = true;
  }
  assert(unapprovedPaymentBlocked, "Pagamento em obrigação com custo desconhecido/não aprovado é rejeitado");

  // 3. Aprovação do custo final em MXN pelo Admin
  const appMXN = await approveSupplierPayableCost(mockSupabase, {
    payableId: payableMXN.id,
    amountFinal: 4200.0, // Negociação com desconto
    notes: "Desconto de 300 MXN obtido para grupo",
    isAdmin: true,
  });
  assert(appMXN.success === true, "Custo final de 4.200 MXN aprovado pelo admin");

  // 4. Pagamento parcial em MXN: MXN 2.000,00
  const supPay1 = await recordSupplierPayment(mockSupabase, {
    payableId: payableMXN.id,
    amount: 2000.0,
    paymentMethod: "transferencia",
    reference: "SPEI_MXN_01928",
    isAdmin: true,
  });
  assert(supPay1.success === true, "Pagamento parcial de 2.000 MXN registrado");
  assert(supPay1.pendingBalance === 2200.0, "Saldo pendente de MXN 2.200 calculado");
  assert(supPay1.paymentStatus === "parcialmente_pago", "Status da obrigação é 'parcialmente_pago'");

  // 5. Quitação do saldo restante em MXN: MXN 2.200,00
  const supPayQuit = await recordSupplierPayment(mockSupabase, {
    payableId: payableMXN.id,
    amount: 2200.0,
    paymentMethod: "transferencia",
    reference: "SPEI_MXN_QUIT",
    isAdmin: true,
  });
  assert(supPayQuit.success === true, "Quitação de 2.200 MXN concluída");
  assert(supPayQuit.pendingBalance === 0.0, "Saldo pendente em MXN zerado");
  assert(supPayQuit.paymentStatus === "pago", "Status atualizado para 'pago'");

  // 6. Reversão auditável de pagamento ao fornecedor
  const supRev = await reverseSupplierPayment(mockSupabase, {
    paymentEntryId: supPayQuit.entryId!,
    reversalReason: "Estorno de TED mexicano devolvido por conta destino incorreta",
    isAdmin: true,
  });
  assert(supRev.success === true, "Estorno de pagamento a fornecedor executado com sucesso");
  assert(supRev.pendingBalance === 2200.0, "Saldo pendente reaberto para 2.200 MXN");
  assert(supRev.newPaymentStatus === "parcialmente_pago", "Status restaurado para 'parcialmente_pago'");

  // 7. KPIs de fornecedores segregados por moeda (MXN vs USD nunca somados)
  const suppKpis = calculateSupplierFinancialKpis([payableUSD, payableMXN, payableUnknown]);
  assert(suppKpis["USD"] !== undefined, "KPI de fornecedor em USD gerado");
  assert(suppKpis["MXN"] !== undefined, "KPI de fornecedor em MXN gerado");
  assert(suppKpis["MXN"].totalApproved === 4200.0, "MXN total aprovado = 4.200,00");
  assert(suppKpis["MXN"].totalPaid === 2000.0, "MXN total pago = 2.000,00 (apenas ativo)");
  assert(suppKpis["MXN"].pendingBalance === 2200.0, "MXN saldo pendente = 2.200,00");
  assert(suppKpis["USD"].unknownCostCount === 1, "USD registrou exatamente 1 custo sob consulta/desconhecido");

  // ---------------------------------------------------------------------------
  // SEÇÃO 4: CANCELAMENTOS, CRÉDITOS E REEMBOLSOS
  // ---------------------------------------------------------------------------
  console.log("\n--- SEÇÃO 4: CANCELAMENTOS, CRÉDITOS E REEMBOLSOS ---");

  // 1. Cancelamento parcial de item de reserva sem cancelar o contrato
  const preSummary = buildContractPreCancellationSummary({
    contract: {
      id: contractUSDId,
      contract_number: "TN-2026-USD01",
      client_name: "Marcos Vinicius",
      total_amount: 1200.0,
      client_paid_amount: 900.0,
      currency: "USD",
      status: "finalizado",
    },
    reservations: [
      { id: "res-01", status: "confirmada", product_name: "Xcaret Plus", tour_date: "2026-11-20" },
      { id: "res-02", status: "confirmada", product_name: "Dolphin Swim", tour_date: "2026-11-21" },
    ],
    supplierPayables: [payableUSD, payableMXN],
  });

  assert(preSummary.activeReservationsCount === 2, "Pré-resumo identifica 2 reservas operacionais ativas");
  assert(preSummary.warnings.length > 0, "Pré-resumo gerou alertas financeiros sobre pagamentos realizados");

  // 2. Concessão de crédito ao cliente
  const creditGrantValid = validateClientCreditGrant({
    clientId: "client-marcos-01",
    amount: 300.0,
    currency: "USD",
    reason: "Crédito referente a cancelamento com 48h de antecedência",
    validityDays: 180,
  });
  assert(creditGrantValid.valid === true, "Validação de concessão de crédito aprovada");

  const mockCredit: ClientCredit = {
    id: "cred-marcos-300",
    client_id: "client-marcos-01",
    contract_id: contractUSDId,
    amount: 300.0,
    currency: "USD",
    balance: 300.0,
    reason: "Crédito por cancelamento",
    status: "disponivel",
    created_at: new Date().toISOString(),
  };

  // 3. Utilização parcial de crédito em novo contrato
  const usage1 = validateClientCreditUsage({
    credit: mockCredit,
    amountToUse: 100.0,
    destinationCurrency: "USD",
  });
  assert(usage1.valid === true, "Uso parcial de USD 100 do crédito autorizado");

  // 4. Tentativa de usar valor superior ao saldo do crédito
  const usageExceed = validateClientCreditUsage({
    credit: { ...mockCredit, balance: 200.0 },
    amountToUse: 250.0,
    destinationCurrency: "USD",
  });
  assert(usageExceed.valid === false, "Uso de crédito além do saldo disponível rejeitado");

  // 5. Ciclo de reembolso financeiro (solicitado -> aprovado -> pago)
  const refReq = validateRefundRequest({
    contractId: contractUSDId,
    amount: 150.0,
    currency: "USD",
    reason: "Reembolso proporcional por item cancelado",
    userRole: "admin",
  });
  assert(refReq.valid === true, "Solicitação de reembolso validada com sucesso");

  const mockRefund: ClientRefund = {
    id: "ref-001",
    client_id: "client-marcos-01",
    contract_id: contractUSDId,
    amount: 150.0,
    currency: "USD",
    reason: "Item cancelado",
    status: "solicitado",
    created_at: new Date().toISOString(),
  };

  const refApprove = validateRefundApproval(mockRefund);
  assert(refApprove.valid === true, "Aprovação do reembolso validada");

  // Reembolso aprovado NÃO é dinheiro pago
  const mockApprovedRefund: ClientRefund = { ...mockRefund, status: "aprovado" };
  const refPay = validateRefundPayment({
    refund: mockApprovedRefund,
    paymentMethod: "pix",
    paymentReference: "TRANSF_COMPROV_99182",
  });
  assert(refPay.valid === true, "Pagamento do reembolso validado com dados bancários e comprovante");

  // 6. Recuperação junto ao fornecedor
  const suppRec = validateSupplierRecoveryRecord({
    payableId: payableUSD.id,
    recoveryType: "reembolso_realizado",
    amountRecovered: 350.0,
    currency: "USD",
    reason: "Cancelamento tempestivo acatado integralmente pelo parque",
  });
  assert(suppRec.valid === true, "Registro de recuperação de fornecedor validado");

  // 7. Impacto financeiro consolidado por moeda (crédito não é dinheiro pago nem recebido)
  const impact = calculateFinancialImpactByCurrency({
    contracts: [
      {
        id: contractUSDId,
        total_amount: 1200.0,
        client_paid_amount: 900.0,
        currency: "USD",
        status: "cancelado",
      },
    ],
    supplierPayables: [payableUSD],
    credits: [mockCredit],
    refunds: [mockApprovedRefund], // Apenas aprovado, ainda não pago
    supplierRecoveries: [],
  });

  assert(impact["USD"] !== undefined, "Impacto financeiro apurado para balde USD");
  assert(impact["USD"].totalCreditsGranted === 300.0, "Crédito concedido apurado separadamente como USD 300.00");
  assert(impact["USD"].totalRefundsPaid === 0.0, "Reembolso aprovado NÃO foi contabilizado como desembolso pago (0.00)");

  // ---------------------------------------------------------------------------
  // SEÇÃO 5: CONFERIR PAINEL FINANCEIRO CONSOLIDADO
  // ---------------------------------------------------------------------------
  console.log("\n--- SEÇÃO 5: PAINEL FINANCEIRO CONSOLIDADO & RESULTADO OPERACIONAL ---");

  const consolidatedSummary = calculateConsolidatedFinancialKpis({
    contracts: [
      {
        id: contractUSDId,
        contract_number: "TN-2026-USD01",
        total_amount: 1200.0,
        client_paid_amount: 900.0,
        currency: "USD",
        status: "finalizado",
        sale_date: "2026-10-26",
      },
    ],
    clientEntries: Array.from(db.clientPaymentEntries.values()),
    payables: [payableUSD, payableMXN, payableUnknown],
    supplierEntries: Array.from(db.supplierPaymentEntries.values()),
  });

  // Reconciliação dos baldes
  const usdSummary = consolidatedSummary.byCurrency["USD"];
  assert(usdSummary !== undefined, "Balde USD presente no consolidado");
  assert(usdSummary.totalContracted === 1200.0, "Total a receber contratado USD = 1.200,00");
  assert(usdSummary.totalReceivedFromClients === 900.0, "Total recebido amortizado USD = 900,00");
  assert(usdSummary.totalPendingFromClients === 300.0, "Saldo pendente de clientes USD = 300,00");
  assert(usdSummary.unknownCostCount === 1, "Exatamente 1 custo desconhecido computado no balde USD");
  assert(
    usdSummary.resultStatus === "parcial_provisorio",
    "Resultado operacional classificado como 'parcial_provisorio' devido ao custo sob consulta"
  );

  const mxnSummary = consolidatedSummary.byCurrency["MXN"];
  assert(mxnSummary !== undefined, "Balde MXN presente no consolidado");
  assert(mxnSummary.totalPayableApproved === 4200.0, "Total a pagar aprovado MXN = 4.200,00");
  assert(mxnSummary.totalPaidToSuppliers === 2000.0, "Total pago a fornecedores MXN = 2.000,00");
  assert(mxnSummary.totalPendingToSuppliers === 2200.0, "Saldo pendente a fornecedores MXN = 2.200,00");

  // Reconciliação dos lançamentos estornados: exclusão rigorosa do fluxo de caixa
  const brlSummary = consolidatedSummary.byCurrency["BRL"];
  assert(brlSummary !== undefined, "Balde BRL registrado pelas entradas em espécie/PIX");
  assert(brlSummary.cashReceivedRealized === 2600.0, "Caixa realizado em BRL = 2.600,00 (ativo)");

  // Consolidação multi-moeda sem taxa implícita
  assert(
    consolidatedSummary.globalConsolidationStatus === "indisponivel",
    "Consolidação global bloqueada ('indisponivel') sem conversão explícita prévia"
  );

  // ---------------------------------------------------------------------------
  // SEÇÃO 6: VALIDAR SEGURANÇA & RBAC
  // ---------------------------------------------------------------------------
  console.log("\n--- SEÇÃO 6: SEGURANÇA, PRIVACIDADE & CONTROLE DE ACESSO ---");

  // 1. Admin acessa financeiro completo
  assert(
    canAccessRoute("admin", "/admin/financeiro"),
    "Admin tem permissão para acessar o Painel Financeiro Geral"
  );
  assert(
    canAccessRoute("admin", "/admin/financeiro/fornecedores"),
    "Admin tem permissão para acessar Contas a Pagar Fornecedores"
  );
  assert(
    canAccessRoute("admin", "/admin/financeiro/clientes"),
    "Admin tem permissão para acessar Contas a Receber Clientes"
  );

  // 2. Vendedor (seller/user) não acessa contas a pagar nem painel consolidado
  assert(
    !canAccessRoute("seller", "/admin/financeiro"),
    "Vendedor NÃO pode acessar Painel Financeiro Consolidado (/admin/financeiro)"
  );
  assert(
    !canAccessRoute("seller", "/admin/financeiro/fornecedores"),
    "Vendedor NÃO pode acessar Contas a Pagar (/admin/financeiro/fornecedores)"
  );

  // 3. Vendedor acessa contas a receber de clientes
  assert(
    canAccessRoute("seller", "/admin/financeiro/clientes"),
    "Vendedor tem autorização para acessar Contas a Receber (/admin/financeiro/clientes)"
  );

  // 4. Permissões de estorno e aprovação de custos exclusivas de admin
  // 4. Permissões de estorno e aprovação de custos exclusivas de admin
  assert(
    hasPermission("admin", "receipts:reverse_refund"),
    "Admin possui permissão receipts:reverse_refund"
  );
  assert(
    !hasPermission("seller", "receipts:reverse_refund"),
    "Vendedor NÃO possui permissão receipts:reverse_refund"
  );
  assert(
    hasPermission("admin", "supplier_costs:view"),
    "Admin possui permissão supplier_costs:view"
  );
  assert(
    !hasPermission("seller", "supplier_costs:view"),
    "Vendedor NÃO possui permissão de ver custos confidenciais de fornecedores"
  );

  // 5. Mensagens para fornecedores no WhatsApp preservam confidencialidade comercial
  const whatsAppMsg = generateSupplierCancellationWhatsAppMessage({
    supplierName: "Grupo Xcaret",
    productName: "Xcaret Plus",
    tourDate: "2026-11-20",
    clientName: "Marcos Vinicius",
    totalPax: 2,
    supplierConfirmationCode: "XC-99812",
    cancellationReason: "Cancelamento solicitado pelo passageiro",
  });

  assert(
    whatsAppMsg.includes("XC-99812"),
    "Mensagem ao fornecedor inclui código da reserva operacional"
  );
  assert(
    !whatsAppMsg.includes("1200") && !whatsAppMsg.includes("4200"),
    "Mensagem ao fornecedor NÃO expõe valores pagos pelo cliente nem margens internas"
  );

  // ---------------------------------------------------------------------------
  // RESUMO GERAL DOS RESULTADOS
  // ---------------------------------------------------------------------------
  console.log("\n===============================================================================");
  console.log(`TOTAL DE ASSERÇÕES: ${totalTests}`);
  console.log(`PASSOU: ${passedTests}`);
  console.log(`FALHOU: ${failedTests}`);
  console.log("===============================================================================");

  if (failedTests > 0) {
    throw new Error(`A bateria de integração financeira falhou com ${failedTests} erros.`);
  }
}

// Executar auditoria
runFinancialIntegrationAudit().catch((err) => {
  console.error("Falha na auditoria financeira:", err);
  process.exit(1);
});
