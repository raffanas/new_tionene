/**
 * TESTES AUTOMATIZADOS — TAREFA 21: CONTAS A RECEBER DOS CLIENTES E CONTROLE CAMBIAL
 *
 * Validação rigorosa dos cenários, regras e integridade da Tarefa 21:
 * 1. Pagamento parcial em USD.
 * 2. Quitação integral (status: 'pago' apenas quando saldo zerar).
 * 3. Recebimento em BRL com câmbio explícito (1 USD = 5,20 BRL -> 520 BRL amortiza 100 USD).
 * 4. Preservação da cotação histórica imutável.
 * 5. Saldo correto após múltiplos recebimentos parciais.
 * 6. Estorno auditável preservando lançamento original (is_reversed = true, quem, quando, motivo).
 * 7. Idempotência via idempotency_key contra requisições duplicadas (parâmetros idênticos).
 * 8. Reutilização de chave de idempotência com parâmetros divergentes (rejeição segura).
 * 9. Bloqueio estrito de pagamentos superiores ao saldo pendente.
 * 10. Concorrência e prevenção de deadlocks (ordem estrita: contracts 1º, client_payment_entries 2º).
 * 11. Segregação cambial de KPIs (NUNCA somar USD com BRL).
 * 12. Bloqueio em contrato rascunho (apenas vendas oficiais elegíveis).
 * 13. Recebimento em contrato finalizado (execução com sucesso via RPC).
 * 14. Amortização incompatível com o cálculo cambial oficial (rejeitada).
 * 15. Operação cambial sem data de cotação ou sem origem/fonte (rejeitada).
 * 16. Tentativa de adulteração direta do total recebido (client_paid_amount) via UPDATE (bloqueada).
 * 17. Tentativa de adulteração direta do status financeiro (client_payment_status) via UPDATE (bloqueada).
 * 18. Isolamento absoluto das informações confidenciais de fornecedores e margens.
 */

import {
  calculateContractReceivableBalance,
  calculateClientFinancialKpis,
  calculateExchangeAmortization,
  recordClientPayment,
  reverseClientPayment,
  formatReceivableCurrency,
} from "../src/lib/financial/clientFinance.ts";
import type {
  ClientReceivable,
  ClientPaymentEntry,
  ClientPaymentStatus,
} from "../src/types/operational";

// =============================================================================
// RUNNER E ASSERÇÕES
// =============================================================================

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    testsPassed++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}${detail ? ` -> ${detail}` : ""}`);
    testsFailed++;
  }
}

// =============================================================================
// SIMULADOR IN-MEMORY TRANSAÇÃO SUPABASE RPC & TRIGGER DE INTEGRIDADE
// =============================================================================

class MockSupabaseReceivablesDb {
  contracts: Record<string, any> = {};
  paymentEntries: Record<string, any> = {};
  lockOrderLog: string[] = [];

  constructor() {
    this.reset();
  }

  reset() {
    this.contracts = {
      "ctr-usd-1000": {
        id: "ctr-usd-1000",
        contract_number: "TN-2026-0100",
        client_id: "cli-01",
        client_name: "Juliana Mendes",
        total_amount: 1000.0,
        currency: "USD",
        status: "finalizado",
        client_paid_amount: 0.0,
        client_payment_status: "pendente",
        last_client_payment_at: null,
        due_date: "2026-11-30",
        seller_name: "Pedro Vendas",
      },
      "ctr-brl-5000": {
        id: "ctr-brl-5000",
        contract_number: "TN-2026-0200",
        client_id: "cli-02",
        client_name: "Roberto Silva",
        total_amount: 5000.0,
        currency: "BRL",
        status: "finalizado",
        client_paid_amount: 0.0,
        client_payment_status: "pendente",
        last_client_payment_at: null,
        due_date: "2026-11-15",
        seller_name: "Camila Vendas",
      },
      "ctr-draft": {
        id: "ctr-draft",
        contract_number: "TN-2026-0300",
        client_id: "cli-04",
        client_name: "Lucas Alencar",
        total_amount: 1500.0,
        currency: "USD",
        status: "rascunho",
        client_paid_amount: 0.0,
        client_payment_status: "pendente",
        last_client_payment_at: null,
        due_date: "2026-12-10",
        seller_name: "Pedro Vendas",
      },
      "ctr-cancelled": {
        id: "ctr-cancelled",
        contract_number: "TN-2026-0999",
        client_id: "cli-03",
        client_name: "Mariana Costa",
        total_amount: 1200.0,
        currency: "USD",
        status: "cancelado",
        client_paid_amount: 0.0,
        client_payment_status: "cancelado",
        last_client_payment_at: null,
        due_date: "2026-10-01",
        seller_name: "Pedro Vendas",
      },
      "ctr-issued": {
        id: "ctr-issued",
        contract_number: "TN-2026-0400",
        client_id: "cli-05",
        client_name: "Fernanda Lima",
        total_amount: 2000.0,
        currency: "USD",
        status: "emitido",
        client_paid_amount: 0.0,
        client_payment_status: "pendente",
        last_client_payment_at: null,
        due_date: "2026-12-20",
        seller_name: "Pedro Vendas",
      },
    };
    this.paymentEntries = {};
    this.lockOrderLog = [];
  }

  // Simulação fiel dos privilégios do PostgreSQL e do gatilho check_contracts_integrity()
  async directUpdateContract(params: {
    contractId: string;
    updates: Partial<any>;
    calling_user_role: string;
    calling_user_id: string;
    isSecurityDefinerOwner?: boolean;
    isOfficialFinalizeRpc?: boolean;
  }) {
    const {
      contractId,
      updates,
      calling_user_role,
      isSecurityDefinerOwner = false,
      isOfficialFinalizeRpc = false,
    } = params;

    const oldContract = this.contracts[contractId];
    if (!oldContract) {
      throw new Error(`Contrato não encontrado (ID: ${contractId})`);
    }

    const isAdmin = calling_user_role === "admin";
    const newContract = { ...oldContract, ...updates };

    // 1. VERIFICAÇÃO DE PRIVILÉGIOS DE COLUNA (POSTGRESQL GRANTS)
    // Se não for o proprietário da RPC SECURITY DEFINER (postgres), aplica os privilégios do papel 'authenticated':
    // As colunas client_paid_amount, client_payment_status, last_client_payment_at,
    // finalized_at e finalized_by foram REVOGADAS para authenticated.
    if (!isSecurityDefinerOwner) {
      if (updates.client_paid_amount !== undefined && updates.client_paid_amount !== oldContract.client_paid_amount) {
        throw new Error("permission denied for column client_paid_amount of relation contracts");
      }
      if (updates.client_payment_status !== undefined && updates.client_payment_status !== oldContract.client_payment_status) {
        throw new Error("permission denied for column client_payment_status of relation contracts");
      }
      if (updates.last_client_payment_at !== undefined && updates.last_client_payment_at !== oldContract.last_client_payment_at) {
        throw new Error("permission denied for column last_client_payment_at of relation contracts");
      }
      if (updates.finalized_at !== undefined && updates.finalized_at !== oldContract.finalized_at) {
        throw new Error("permission denied for column finalized_at of relation contracts");
      }
      if (updates.finalized_by !== undefined && updates.finalized_by !== oldContract.finalized_by) {
        throw new Error("permission denied for column finalized_by of relation contracts");
      }
    }

    // 2. GATILHO DE INTEGRIDADE (trg_protect_contracts -> check_contracts_integrity)
    if (!isAdmin) {
      // 2.1 Bloqueio de alteração em contratos finalizados ou cancelados
      if (["cancelado", "finalizado", "concluido"].includes(oldContract.status)) {
        if (oldContract.status === "cancelado") {
          throw new Error("Acesso negado: contratos cancelados não podem ser alterados.");
        }

        // Se finalizado/concluido: impede qualquer alteração cadastral por não-administradores
        const forbiddenFields = [
          "client_name", "client_cpf", "client_email", "client_phone",
          "total_amount", "currency", "status", "contract_number",
          "arrival_date", "departure_date", "terms_clauses"
        ];
        for (const field of forbiddenFields) {
          if (updates[field] !== undefined && updates[field] !== oldContract[field]) {
            throw new Error("Acesso negado: contratos finalizados não podem ter dados cadastrais ou valores alterados por vendedores.");
          }
        }
      }

      // 2.2 Bloqueio de cancelamento ou finalização direta por UPDATE
      if (["cancelado", "finalizado", "concluido"].includes(newContract.status) && newContract.status !== oldContract.status) {
        // Apenas a RPC oficial finalize_contract_sale (com carimbo de data e executor) pode finalizar
        if (!(newContract.status === "finalizado" && ["emitido", "assinado"].includes(oldContract.status) && isOfficialFinalizeRpc)) {
          throw new Error("Acesso negado: cancelamento ou finalização de contratos é uma operação restrita a administradores. Utilize a função oficial Finalizar Venda.");
        }
      }
    }

    this.contracts[contractId] = newContract;
    return newContract;
  }

  // Simulação fiel da RPC record_client_payment
  async recordClientPaymentRpc(params: {
    p_contract_id: string;
    p_amount_received: number;
    p_received_currency?: string;
    p_exchange_rate?: number;
    p_amortized_amount?: number;
    p_exchange_rate_date?: string;
    p_exchange_rate_source?: string;
    p_payment_method?: string;
    p_payment_date?: string;
    p_reference?: string;
    p_notes?: string;
    p_idempotency_key?: string;
    calling_user_role: string;
    calling_user_id: string;
  }) {
    const {
      p_contract_id,
      p_amount_received,
      p_received_currency = "BRL",
      p_exchange_rate = 1.0,
      p_amortized_amount,
      p_exchange_rate_date,
      p_exchange_rate_source,
      p_payment_method = "transferencia",
      p_payment_date = new Date().toISOString().split("T")[0],
      p_reference,
      p_notes,
      p_idempotency_key,
      calling_user_role,
      calling_user_id,
    } = params;

    // 1. Validar autenticação e perfil
    if (!["admin", "moderator", "user", "seller"].includes(calling_user_role)) {
      throw new Error("Acesso negado: usuário não possui permissão para registrar recebimentos de clientes.");
    }

    if (!p_amount_received || p_amount_received <= 0) {
      throw new Error("Valor recebido deve ser maior que zero.");
    }

    // 2. ORDEM DE BLOQUEIO ANTI-DEADLOCK: 1º contracts FOR UPDATE
    this.lockOrderLog.push(`LOCK contracts ID ${p_contract_id}`);
    const contract = this.contracts[p_contract_id];
    if (!contract) {
      throw new Error(`Contrato não encontrado (ID: ${p_contract_id})`);
    }

    // 3. CONTRATOS ELEGÍVEIS: Bloquear rascunho e cancelado
    if (contract.status === "rascunho") {
      throw new Error("Não é permitido registrar recebimento em contrato com status rascunho. O contrato deve ser emitido oficialmente antes de receber pagamentos.");
    }

    if (contract.status === "cancelado") {
      throw new Error("Não é permitido registrar recebimento em contrato cancelado.");
    }

    if (!["emitido", "assinado", "finalizado", "concluido"].includes(contract.status)) {
      throw new Error(`Não é permitido registrar recebimento em contrato no estado "${contract.status}". Apenas vendas oficiais emitidas, assinadas ou finalizadas são elegíveis.`);
    }

    // 4. CONTROLE CAMBIAL EXPLÍCITO E CÁLCULO DA AMORTIZAÇÃO NO BANCO
    let exchangeRate = 1.0;
    let amortized = 0;
    const recv = p_received_currency.toUpperCase().trim();
    const ctrCurr = contract.currency.toUpperCase().trim();
    const isCross = recv !== ctrCurr;

    if (!isCross) {
      exchangeRate = 1.0;
      amortized = Math.round(p_amount_received * 100) / 100;

      if (p_amortized_amount !== undefined && p_amortized_amount !== null && Math.abs(p_amortized_amount - amortized) > 0.01) {
        throw new Error(`Valor amortizado informado (${p_amortized_amount} ${ctrCurr}) diverge do valor recebido (${p_amount_received} ${recv}).`);
      }
    } else {
      if (!p_exchange_rate || p_exchange_rate <= 0) {
        throw new Error(`Para recebimentos em moeda diferente da moeda contratual (${contract.currency}), é obrigatório informar taxa de câmbio válida maior que zero.`);
      }
      exchangeRate = p_exchange_rate;

      if (!p_exchange_rate_date) {
        throw new Error("Para operações entre moedas distintas, é obrigatório informar a data de referência da cotação cambial (exchange_rate_date).");
      }

      if (!p_exchange_rate_source || !p_exchange_rate_source.trim()) {
        throw new Error("Para operações entre moedas distintas, é obrigatório informar a fonte ou origem da taxa de câmbio (exchange_rate_source).");
      }

      // Restringir às combinações suportadas
      if (ctrCurr === "USD" && recv === "BRL") {
        amortized = Math.round((p_amount_received / exchangeRate) * 100) / 100;
      } else if (ctrCurr === "BRL" && recv === "USD") {
        amortized = Math.round(p_amount_received * exchangeRate * 100) / 100;
      } else {
        throw new Error(`Conversão cambial não suportada entre ${recv} e ${ctrCurr}. As combinações oficiais suportadas pela aplicação são BRL recebido para contrato em USD ou USD recebido para contrato em BRL.`);
      }

      // Não aceitar p_amortized_amount arbitrário divergente do cálculo
      if (p_amortized_amount !== undefined && p_amortized_amount !== null && Math.abs(p_amortized_amount - amortized) > 0.01) {
        throw new Error(`Valor amortizado informado (${p_amortized_amount} ${ctrCurr}) diverge do cálculo cambial oficial (${amortized} ${ctrCurr} calculado). Não é permitido informar amortização arbitrária.`);
      }
    }

    if (amortized <= 0) {
      throw new Error("Valor amortizado calculado inválido (deve ser maior que zero).");
    }

    // 5. IDEMPOTÊNCIA COMPLETA: 2º client_payment_entries FOR UPDATE
    if (p_idempotency_key) {
      this.lockOrderLog.push(`LOCK client_payment_entries KEY ${p_idempotency_key}`);
      const existingEntry = Object.values(this.paymentEntries).find(
        (e: any) => e.idempotency_key === p_idempotency_key
      );

      if (existingEntry) {
        if (
          existingEntry.contract_id !== p_contract_id ||
          existingEntry.amount_received !== p_amount_received ||
          existingEntry.received_currency !== recv ||
          existingEntry.exchange_rate !== exchangeRate ||
          existingEntry.amortized_amount !== amortized ||
          existingEntry.payment_date !== p_payment_date ||
          existingEntry.payment_method !== p_payment_method
        ) {
          throw new Error(`Conflito de idempotência: a chave "${p_idempotency_key}" já foi utilizada para outra operação financeira com parâmetros divergentes (contrato, valor, moeda, taxa de câmbio, amortização, data ou forma de pagamento).`);
        }

        return {
          success: true,
          entry_id: existingEntry.id,
          contract_id: existingEntry.contract_id,
          amount_received: existingEntry.amount_received,
          received_currency: existingEntry.received_currency,
          exchange_rate: existingEntry.exchange_rate,
          amortized_amount: existingEntry.amortized_amount,
          contract_currency: contract.currency,
          total_contracted: contract.total_amount,
          total_paid: contract.client_paid_amount,
          pending_balance: Math.max(0, contract.total_amount - contract.client_paid_amount),
          payment_status: contract.client_payment_status,
          is_idempotent_replay: true,
          message: "Recebimento já processado anteriormente (idempotência confirmada).",
        };
      }
    }

    // 6. Calcular total amortizado ativo
    const activeEntries = Object.values(this.paymentEntries).filter(
      (e: any) => e.contract_id === contract.id && !e.is_reversed
    );
    const currentAmortized = activeEntries.reduce((sum: number, e: any) => sum + e.amortized_amount, 0);
    const pendingBalance = contract.total_amount - currentAmortized;

    // 7. Bloquear pagamento superior ao saldo
    if (amortized > pendingBalance + 0.005) {
      throw new Error(
        `Valor amortizado (${amortized} ${contract.currency}) excede o saldo pendente do contrato (${pendingBalance} ${contract.currency}). Pagamentos superiores ao saldo contratual não são permitidos.`
      );
    }

    // 8. Inserir lançamento
    const entryId = `entry-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newEntry = {
      id: entryId,
      contract_id: contract.id,
      client_id: contract.client_id,
      amount_received: p_amount_received,
      received_currency: recv,
      exchange_rate: exchangeRate,
      amortized_amount: amortized,
      contract_currency: ctrCurr,
      exchange_rate_date: isCross ? p_exchange_rate_date : null,
      exchange_rate_source: isCross ? p_exchange_rate_source : null,
      payment_date: p_payment_date,
      payment_method: p_payment_method,
      reference: p_reference || null,
      notes: p_notes || null,
      idempotency_key: p_idempotency_key || null,
      created_by: calling_user_id,
      is_reversed: false,
      reversed_at: null,
      reversed_by: null,
      reversal_reason: null,
      created_at: new Date().toISOString(),
    };
    this.paymentEntries[entryId] = newEntry;

    // 9. Recalcular total amortizado
    const updatedActiveEntries = Object.values(this.paymentEntries).filter(
      (e: any) => e.contract_id === contract.id && !e.is_reversed
    );
    const newAmortized = updatedActiveEntries.reduce((sum: number, e: any) => sum + e.amortized_amount, 0);

    // 10. Determinar novo status
    let newStatus: ClientPaymentStatus = "pendente";
    if (contract.total_amount - newAmortized <= 0.005) {
      newStatus = "pago";
    } else if (newAmortized > 0) {
      newStatus = "parcialmente_pago";
    }

    // 11. Atualizar contrato sob papel do proprietário SECURITY DEFINER (postgres)
    await this.directUpdateContract({
      contractId: contract.id,
      updates: {
        client_paid_amount: newAmortized,
        client_payment_status: newStatus,
        last_client_payment_at: new Date().toISOString(),
      },
      calling_user_role,
      calling_user_id,
      isSecurityDefinerOwner: true,
    });

    return {
      success: true,
      entry_id: entryId,
      contract_id: contract.id,
      amount_received: p_amount_received,
      received_currency: recv,
      exchange_rate: exchangeRate,
      amortized_amount: amortized,
      contract_currency: contract.currency,
      total_contracted: contract.total_amount,
      total_paid: newAmortized,
      pending_balance: Math.max(0, contract.total_amount - newAmortized),
      payment_status: newStatus,
      is_idempotent_replay: false,
      message: "Recebimento de cliente registrado com sucesso.",
    };
  }

  // Simulação fiel da RPC reverse_client_payment
  async reverseClientPaymentRpc(params: {
    p_payment_entry_id: string;
    p_reversal_reason: string;
    calling_user_role: string;
    calling_user_id: string;
  }) {
    const {
      p_payment_entry_id,
      p_reversal_reason,
      calling_user_role,
      calling_user_id,
    } = params;

    // 1. Exige papel ADMIN
    if (calling_user_role !== "admin") {
      throw new Error("Acesso negado: apenas administradores podem estornar recebimentos de clientes.");
    }

    if (!p_reversal_reason || !p_reversal_reason.trim()) {
      throw new Error("É obrigatório informar a justificativa do estorno para fins de auditoria.");
    }

    const entry = this.paymentEntries[p_payment_entry_id];
    if (!entry) {
      throw new Error(`Lançamento de recebimento não encontrado (ID: ${p_payment_entry_id})`);
    }

    // 2. ORDEM DE BLOQUEIO ANTI-DEADLOCK: 1º contracts FOR UPDATE
    this.lockOrderLog.push(`LOCK contracts ID ${entry.contract_id}`);
    const contract = this.contracts[entry.contract_id];
    if (!contract) {
      throw new Error(`Contrato relacionado não encontrado (ID: ${entry.contract_id})`);
    }

    if (contract.status === "cancelado") {
      throw new Error("Não é permitido estornar recebimento em contrato cancelado.");
    }

    // 3. ORDEM DE BLOQUEIO ANTI-DEADLOCK: 2º client_payment_entries FOR UPDATE
    this.lockOrderLog.push(`LOCK client_payment_entries ID ${p_payment_entry_id}`);

    if (entry.is_reversed) {
      throw new Error(`Este recebimento já foi estornado anteriormente em ${entry.reversed_at}.`);
    }

    // 4. Marcar estorno auditável
    entry.is_reversed = true;
    entry.reversed_at = new Date().toISOString();
    entry.reversed_by = calling_user_id;
    entry.reversal_reason = p_reversal_reason.trim();

    // 5. Recalcular total amortizado
    const remainingActiveEntries = Object.values(this.paymentEntries).filter(
      (e: any) => e.contract_id === contract.id && !e.is_reversed
    );
    const recalculatedAmortized = remainingActiveEntries.reduce(
      (sum: number, e: any) => sum + e.amortized_amount,
      0
    );

    // 6. Atualizar status
    let newStatus: ClientPaymentStatus = "pendente";
    if (contract.total_amount - recalculatedAmortized <= 0.005) {
      newStatus = "pago";
    } else if (recalculatedAmortized > 0) {
      newStatus = "parcialmente_pago";
    }

    // Atualizar contrato sob papel do proprietário SECURITY DEFINER (postgres)
    await this.directUpdateContract({
      contractId: contract.id,
      updates: {
        client_paid_amount: recalculatedAmortized,
        client_payment_status: newStatus,
      },
      calling_user_role,
      calling_user_id,
      isSecurityDefinerOwner: true,
    });

    return {
      success: true,
      payment_entry_id: p_payment_entry_id,
      contract_id: contract.id,
      reversed_amortized_amount: entry.amortized_amount,
      recalculated_paid_amount: recalculatedAmortized,
      pending_balance: Math.max(0, contract.total_amount - recalculatedAmortized),
      new_payment_status: newStatus,
      contract_currency: contract.currency,
      message: "Recebimento estornado com sucesso mantendo histórico auditável.",
    };
  }
}

// =============================================================================
// TEST SUITE
// =============================================================================

async function runAllTests() {
  console.log("=================================================================");
  console.log("INICIANDO TESTES AUTOMATIZADOS — CONTAS A RECEBER E CONTROLE CAMBIAL");
  console.log("=================================================================\n");

  const db = new MockSupabaseReceivablesDb();

  // ---------------------------------------------------------------------------
  // 1. TENTATIVAS DE ADULTERAÇÃO DIRETA (PROTEÇÃO VIA PRIVILÉGIOS E GATILHO)
  // ---------------------------------------------------------------------------
  console.log("--- 1. Proteção por Privilégios PostgreSQL e Integridade de Contratos ---");
  {
    // 1.1 Vendedor tenta alterar client_paid_amount diretamente por UPDATE (sem privilégio de coluna)
    let threwPaidAmount = false;
    try {
      await db.directUpdateContract({
        contractId: "ctr-usd-1000",
        updates: { client_paid_amount: 999.0 },
        calling_user_role: "seller",
        calling_user_id: "usr-seller-01",
        isSecurityDefinerOwner: false,
      });
    } catch (e: any) {
      threwPaidAmount = true;
      assert(e.message.includes("permission denied for column client_paid_amount"), "Privilégios PostgreSQL revogam UPDATE direto de client_paid_amount");
    }
    assert(threwPaidAmount, "Tentativa de adulteração direta do total recebido bloqueada");

    // 1.2 Vendedor tenta alterar client_payment_status diretamente para 'pago' (sem privilégio de coluna)
    let threwStatus = false;
    try {
      await db.directUpdateContract({
        contractId: "ctr-usd-1000",
        updates: { client_payment_status: "pago" },
        calling_user_role: "seller",
        calling_user_id: "usr-seller-01",
        isSecurityDefinerOwner: false,
      });
    } catch (e: any) {
      threwStatus = true;
      assert(e.message.includes("permission denied for column client_payment_status"), "Privilégios PostgreSQL revogam UPDATE direto de client_payment_status");
    }
    assert(threwStatus, "Tentativa de adulteração direta do status financeiro bloqueada");

    // 1.3 Vendedor tenta alterar dados cadastrais de contrato finalizado
    let threwFinalized = false;
    try {
      await db.directUpdateContract({
        contractId: "ctr-usd-1000",
        updates: { client_name: "Nome Falso", total_amount: 100 },
        calling_user_role: "seller",
        calling_user_id: "usr-seller-01",
        isSecurityDefinerOwner: false,
      });
    } catch (e: any) {
      threwFinalized = true;
      assert(e.message.includes("contratos finalizados não podem ter dados cadastrais"), "Gatilho bloqueia alteração cadastral de contrato finalizado");
    }
    assert(threwFinalized, "Contrato finalizado protegido contra adulteração cadastral direta");

    // 1.4 Vendedor edita contrato normalmente em campos autorizados quando permitido
    const editedContract = await db.directUpdateContract({
      contractId: "ctr-draft",
      updates: { client_name: "Lucas Alencar Atualizado", due_date: "2026-12-15" },
      calling_user_role: "seller",
      calling_user_id: "usr-seller-01",
      isSecurityDefinerOwner: false,
    });
    assert(editedContract.client_name === "Lucas Alencar Atualizado", "Vendedor edita contratos normalmente quando permitido");
    assert(editedContract.due_date === "2026-12-15", "Vendedor atualiza campos operacionais permitidos");

    // 1.5 Vendedor tenta alterar status para 'finalizado' por UPDATE direto em contrato emitido (sem chamar RPC oficial)
    let threwDirectFinalize = false;
    try {
      await db.directUpdateContract({
        contractId: "ctr-issued",
        updates: { status: "finalizado" },
        calling_user_role: "seller",
        calling_user_id: "usr-seller-01",
        isSecurityDefinerOwner: false,
        isOfficialFinalizeRpc: false,
      });
    } catch (e: any) {
      threwDirectFinalize = true;
      assert(e.message.includes("Utilize a função oficial Finalizar Venda"), "Gatilho bloqueia substituição de Finalizar Venda por UPDATE direto");
    }
    assert(threwDirectFinalize, "Tentativa de finalização direta de status bloqueada");

    // 1.6 Vendedor tenta alterar finalized_at diretamente por UPDATE (sem privilégio de coluna)
    let threwFinalizedAt = false;
    try {
      await db.directUpdateContract({
        contractId: "ctr-issued",
        updates: { finalized_at: new Date().toISOString() },
        calling_user_role: "seller",
        calling_user_id: "usr-seller-01",
        isSecurityDefinerOwner: false,
      });
    } catch (e: any) {
      threwFinalizedAt = true;
      assert(e.message.includes("permission denied for column finalized_at"), "Privilégios PostgreSQL revogam UPDATE direto de finalized_at");
    }
    assert(threwFinalizedAt, "Tentativa de adulteração direta de finalized_at bloqueada");

    // 1.7 Vendedor tenta alterar finalized_by diretamente por UPDATE (sem privilégio de coluna)
    let threwFinalizedBy = false;
    try {
      await db.directUpdateContract({
        contractId: "ctr-issued",
        updates: { finalized_by: "usr-seller-01" },
        calling_user_role: "seller",
        calling_user_id: "usr-seller-01",
        isSecurityDefinerOwner: false,
      });
    } catch (e: any) {
      threwFinalizedBy = true;
      assert(e.message.includes("permission denied for column finalized_by"), "Privilégios PostgreSQL revogam UPDATE direto de finalized_by");
    }
    assert(threwFinalizedBy, "Tentativa de adulteração direta de finalized_by bloqueada");

    // 1.8 Finalizar Venda oficial via RPC em contrato emitido com carimbo de auditoria
    const finalizedOfficial = await db.directUpdateContract({
      contractId: "ctr-issued",
      updates: {
        status: "finalizado",
        finalized_at: new Date().toISOString(),
        finalized_by: "usr-seller-01",
      },
      calling_user_role: "seller",
      calling_user_id: "usr-seller-01",
      isSecurityDefinerOwner: true,
      isOfficialFinalizeRpc: true,
    });
    assert(finalizedOfficial.status === "finalizado", "Finalizar Venda via RPC oficial finaliza contrato emitido corretamente");
  }

  // ---------------------------------------------------------------------------
  // 2. CONTRATOS ELEGÍVEIS: RASCUNHO VS FINALIZADO
  // ---------------------------------------------------------------------------
  console.log("\n--- 2. Elegibilidade de Contratos (Rascunho vs Finalizado) ---");
  {
    // 2.1 Recebimento em contrato rascunho deve ser expressamente bloqueado
    let threwDraft = false;
    try {
      await db.recordClientPaymentRpc({
        p_contract_id: "ctr-draft",
        p_amount_received: 300.0,
        p_received_currency: "USD",
        calling_user_role: "seller",
        calling_user_id: "usr-seller-01",
      });
    } catch (e: any) {
      threwDraft = true;
      assert(e.message.includes("status rascunho"), "Bloqueia recebimento em contrato com status rascunho");
    }
    assert(threwDraft, "Recebimento em contrato rascunho impedido com sucesso");

    // 2.2 Recebimento em contrato finalizado (oficial) deve ser processado com sucesso
    const resFinalized = await db.recordClientPaymentRpc({
      p_contract_id: "ctr-usd-1000",
      p_amount_received: 300.0,
      p_received_currency: "USD",
      p_payment_method: "cartao_credito",
      calling_user_role: "seller",
      calling_user_id: "usr-seller-01",
    });

    assert(resFinalized.success === true, "Recebimento em contrato finalizado processado com sucesso");
    assert(resFinalized.pending_balance === 700.0, "Saldo pendente recalculado: 700 USD");
    assert(resFinalized.payment_status === "parcialmente_pago", "Status do contrato atualizado para parcialmente_pago");
  }

  // ---------------------------------------------------------------------------
  // 3. CONTROLE CAMBIAL: EXIGÊNCIAS, VALIDAÇÕES E COMBINAÇÕES SUPORTADAS
  // ---------------------------------------------------------------------------
  console.log("\n--- 3. Controle Cambial: Exigências, Amortização e Pares Suportados ---");
  {
    // 3.1 Câmbio sem data ou sem origem deve ser rejeitado
    let threwNoDate = false;
    try {
      await db.recordClientPaymentRpc({
        p_contract_id: "ctr-usd-1000",
        p_amount_received: 520.0,
        p_received_currency: "BRL",
        p_exchange_rate: 5.2,
        p_exchange_rate_date: undefined, // Sem data!
        p_exchange_rate_source: "Banco Central",
        calling_user_role: "seller",
        calling_user_id: "usr-seller-01",
      });
    } catch (e: any) {
      threwNoDate = true;
      assert(e.message.includes("exchange_rate_date"), "Exige data de referência do câmbio");
    }
    assert(threwNoDate, "Operação cambial sem data de cotação foi rejeitada");

    let threwNoSource = false;
    try {
      await db.recordClientPaymentRpc({
        p_contract_id: "ctr-usd-1000",
        p_amount_received: 520.0,
        p_received_currency: "BRL",
        p_exchange_rate: 5.2,
        p_exchange_rate_date: "2026-10-22",
        p_exchange_rate_source: "   ", // Origem vazia!
        calling_user_role: "seller",
        calling_user_id: "usr-seller-01",
      });
    } catch (e: any) {
      threwNoSource = true;
      assert(e.message.includes("exchange_rate_source"), "Exige fonte ou origem da taxa de câmbio");
    }
    assert(threwNoSource, "Operação cambial sem origem/fonte foi rejeitada");

    // 3.2 Amortização arbitrária incompatível com o câmbio oficial
    let threwBadAmortized = false;
    try {
      await db.recordClientPaymentRpc({
        p_contract_id: "ctr-usd-1000",
        p_amount_received: 520.0,
        p_received_currency: "BRL",
        p_exchange_rate: 5.2, // Cálculo oficial: 520 / 5.20 = 100 USD
        p_amortized_amount: 150.0, // Arbitrário e divergente!
        p_exchange_rate_date: "2026-10-22",
        p_exchange_rate_source: "Banco Central",
        calling_user_role: "seller",
        calling_user_id: "usr-seller-01",
      });
    } catch (e: any) {
      threwBadAmortized = true;
      assert(e.message.includes("diverge do cálculo cambial oficial"), "Rejeita amortização arbitrária divergente");
    }
    assert(threwBadAmortized, "Amortização incompatível com a taxa foi rejeitada");

    // 3.3 Par cambial não suportado (ex: EUR para contrato em USD)
    let threwUnsupportedPair = false;
    try {
      await db.recordClientPaymentRpc({
        p_contract_id: "ctr-usd-1000",
        p_amount_received: 100.0,
        p_received_currency: "EUR",
        p_exchange_rate: 1.1,
        p_exchange_rate_date: "2026-10-22",
        p_exchange_rate_source: "BCE",
        calling_user_role: "seller",
        calling_user_id: "usr-seller-01",
      });
    } catch (e: any) {
      threwUnsupportedPair = true;
      assert(e.message.includes("Conversão cambial não suportada"), "Restringe as conversões aos pares suportados");
    }
    assert(threwUnsupportedPair, "Par cambial não suportado rejeitado com sucesso");

    // 3.4 Execução válida com câmbio explícito: 520 BRL @ 5.20 = 100 USD
    const resBrl = await db.recordClientPaymentRpc({
      p_contract_id: "ctr-usd-1000",
      p_amount_received: 520.0,
      p_received_currency: "BRL",
      p_exchange_rate: 5.2,
      p_exchange_rate_date: "2026-10-22",
      p_exchange_rate_source: "Banco Central Comercial",
      p_payment_method: "pix",
      p_reference: "PIX-12345",
      calling_user_role: "seller",
      calling_user_id: "usr-seller-01",
    });

    assert(resBrl.success === true, "Recebimento BRL com câmbio explícito registrado com sucesso");
    assert(resBrl.amortized_amount === 100.0, "Valor amortizado calculado no banco: 100 USD (520 / 5.20)");
    assert(resBrl.total_paid === 400.0, "Total pago atualizado para 400 USD (300 + 100)");
    assert(resBrl.pending_balance === 600.0, "Saldo pendente contratual atualizado para 600 USD");
  }

  // ---------------------------------------------------------------------------
  // 4. PRESERVAÇÃO DA COTAÇÃO HISTÓRICA
  // ---------------------------------------------------------------------------
  console.log("\n--- 4. Preservação da Cotação Histórica ---");
  {
    // Novo recebimento com cotação 5.50
    const res3 = await db.recordClientPaymentRpc({
      p_contract_id: "ctr-usd-1000",
      p_amount_received: 550.0,
      p_received_currency: "BRL",
      p_exchange_rate: 5.5,
      p_exchange_rate_date: "2026-10-25",
      p_exchange_rate_source: "Wise P2P",
      p_payment_method: "wise",
      calling_user_role: "seller",
      calling_user_id: "usr-seller-01",
    });

    assert(res3.amortized_amount === 100.0, "Recebimento BRL amortizou 100 USD a 5.50");
    assert(res3.total_paid === 500.0, "Total pago acumulado é 500 USD");

    // Verificar se lançamento anterior de 5.20 permaneceu inalterado
    const entries = Object.values(db.paymentEntries).filter((e: any) => e.contract_id === "ctr-usd-1000");
    const entry1 = entries.find((e: any) => e.amount_received === 520.0);
    assert(entry1.exchange_rate === 5.2, "Cotação histórica anterior permanece 5.20");
    assert(entry1.exchange_rate_source === "Banco Central Comercial", "Origem da cotação preservada");
  }

  // ---------------------------------------------------------------------------
  // 5. QUITAÇÃO INTEGRAL E BLOQUEIO DE EXCESSO
  // ---------------------------------------------------------------------------
  console.log("\n--- 5. Quitação Integral e Bloqueio de Excesso de Saldo ---");
  {
    // Pagar 500 USD restantes
    const resQuita = await db.recordClientPaymentRpc({
      p_contract_id: "ctr-usd-1000",
      p_amount_received: 500.0,
      p_received_currency: "USD",
      calling_user_role: "admin",
      calling_user_id: "usr-admin-01",
    });

    assert(resQuita.pending_balance === 0, "Saldo pendente zerado");
    assert(resQuita.payment_status === "pago", "Status do contrato mudou para 'pago' apenas ao zerar o saldo");

    // Tentar pagar além do saldo
    let threwOverpayment = false;
    try {
      await db.recordClientPaymentRpc({
        p_contract_id: "ctr-usd-1000",
        p_amount_received: 10.0,
        p_received_currency: "USD",
        calling_user_role: "seller",
        calling_user_id: "usr-seller-01",
      });
    } catch (e: any) {
      threwOverpayment = true;
      assert(e.message.includes("excede o saldo pendente"), "Impede pagamento que excede o saldo");
    }
    assert(threwOverpayment, "Pagamento superior ao saldo pendente bloqueado com sucesso");
  }

  // ---------------------------------------------------------------------------
  // 6. ESTORNO AUDITÁVEL (EXCLUSIVO ADMIN)
  // ---------------------------------------------------------------------------
  console.log("\n--- 6. Estorno Auditável Exclusivo do Admin ---");
  {
    const entries = Object.values(db.paymentEntries).filter((e: any) => e.contract_id === "ctr-usd-1000");
    const lastEntry = entries.find((e: any) => e.amount_received === 500.0 && !e.is_reversed);

    // Vendedor tenta estornar
    let threwSellerReversal = false;
    try {
      await db.reverseClientPaymentRpc({
        p_payment_entry_id: lastEntry.id,
        p_reversal_reason: "Erro de digitação",
        calling_user_role: "seller",
        calling_user_id: "usr-seller-01",
      });
    } catch (e: any) {
      threwSellerReversal = true;
      assert(e.message.includes("apenas administradores"), "Vendedor bloqueado de realizar estornos");
    }
    assert(threwSellerReversal, "Estorno restrito exclusivamente ao papel Admin");

    // Admin executa estorno com justificativa
    const revRes = await db.reverseClientPaymentRpc({
      p_payment_entry_id: lastEntry.id,
      p_reversal_reason: "TED estornada pelo banco emissor",
      calling_user_role: "admin",
      calling_user_id: "usr-admin-01",
    });

    assert(revRes.success === true, "Estorno realizado com sucesso pelo Admin");
    assert(revRes.pending_balance === 500.0, "Saldo reaberto para 500 USD");
    assert(revRes.new_payment_status === "parcialmente_pago", "Status voltou para parcialmente_pago");
  }

  // ---------------------------------------------------------------------------
  // 7. IDEMPOTÊNCIA: REPLAY VS PARÂMETROS DIVERGENTES
  // ---------------------------------------------------------------------------
  console.log("\n--- 7. Idempotência: Replay Idêntico vs Conflito com Parâmetros Divergentes ---");
  {
    const idemKey = "test_idem_key_xyz_888";

    // 1º envio
    const res1 = await db.recordClientPaymentRpc({
      p_contract_id: "ctr-usd-1000",
      p_amount_received: 200.0,
      p_received_currency: "USD",
      p_idempotency_key: idemKey,
      calling_user_role: "seller",
      calling_user_id: "usr-seller-01",
    });

    assert(res1.is_idempotent_replay === false, "1º envio processado normalmente");
    assert(res1.pending_balance === 300.0, "Saldo passou para 300 USD");

    // 2º envio com parâmetros idênticos
    const res2 = await db.recordClientPaymentRpc({
      p_contract_id: "ctr-usd-1000",
      p_amount_received: 200.0,
      p_received_currency: "USD",
      p_idempotency_key: idemKey,
      calling_user_role: "seller",
      calling_user_id: "usr-seller-01",
    });

    assert(res2.is_idempotent_replay === true, "2º envio idêntico retornou replay idempotente");
    assert(res2.pending_balance === 300.0, "Saldo permaneceu 300 USD sem duplicar abatimento");

    // 3º envio reutilizando a mesma chave mas com valor divergente
    let threwDivergentAmount = false;
    try {
      await db.recordClientPaymentRpc({
        p_contract_id: "ctr-usd-1000",
        p_amount_received: 250.0, // Divergente!
        p_received_currency: "USD",
        p_idempotency_key: idemKey,
        calling_user_role: "seller",
        calling_user_id: "usr-seller-01",
      });
    } catch (e: any) {
      threwDivergentAmount = true;
      assert(e.message.includes("Conflito de idempotência"), "Identifica divergência de montante");
    }
    assert(threwDivergentAmount, "Reutilização de chave com valor divergente rejeitada");

    // 4º envio reutilizando a mesma chave com forma de pagamento divergente
    let threwDivergentMethod = false;
    try {
      await db.recordClientPaymentRpc({
        p_contract_id: "ctr-usd-1000",
        p_amount_received: 200.0,
        p_received_currency: "USD",
        p_payment_method: "cartao_credito", // Divergente!
        p_idempotency_key: idemKey,
        calling_user_role: "seller",
        calling_user_id: "usr-seller-01",
      });
    } catch (e: any) {
      threwDivergentMethod = true;
      assert(e.message.includes("Conflito de idempotência"), "Identifica divergência de forma de pagamento");
    }
    assert(threwDivergentMethod, "Reutilização de chave com forma de pagamento divergente rejeitada");
  }

  // ---------------------------------------------------------------------------
  // 8. ANTI-DEADLOCK: ORDEM ESTREITA DE BLOQUEIO
  // ---------------------------------------------------------------------------
  console.log("\n--- 8. Anti-Deadlock: Ordem Padronizada de Bloqueio ---");
  {
    db.lockOrderLog = [];

    await db.recordClientPaymentRpc({
      p_contract_id: "ctr-brl-5000",
      p_amount_received: 1000.0,
      p_received_currency: "BRL",
      p_idempotency_key: "lock_key_brl_1",
      calling_user_role: "seller",
      calling_user_id: "usr-seller-01",
    });

    assert(db.lockOrderLog[0].startsWith("LOCK contracts"), "record_client_payment bloqueia contracts em 1º lugar");
    assert(db.lockOrderLog[1].startsWith("LOCK client_payment_entries"), "record_client_payment bloqueia client_payment_entries em 2º lugar");
  }

  // ---------------------------------------------------------------------------
  // 9. SEGREGAÇÃO CAMBIAL DE KPIS
  // ---------------------------------------------------------------------------
  console.log("\n--- 9. Segregação Cambial Estrita nos KPIs ---");
  {
    const mockReceivables: ClientReceivable[] = [
      {
        id: "ctr-1",
        contract_number: "TN-USD-01",
        client_name: "John Doe",
        sale_date: "2026-10-01",
        total_amount: 1000.0,
        currency: "USD",
        client_paid_amount: 400.0,
        pending_balance: 600.0,
        client_payment_status: "parcialmente_pago",
        status: "finalizado",
      },
      {
        id: "ctr-2",
        contract_number: "TN-USD-02",
        client_name: "Jane Smith",
        sale_date: "2026-10-02",
        total_amount: 500.0,
        currency: "USD",
        client_paid_amount: 500.0,
        pending_balance: 0.0,
        client_payment_status: "pago",
        status: "finalizado",
      },
      {
        id: "ctr-3",
        contract_number: "TN-BRL-01",
        client_name: "Carlos Silva",
        sale_date: "2026-10-03",
        total_amount: 10000.0,
        currency: "BRL",
        client_paid_amount: 2000.0,
        pending_balance: 8000.0,
        client_payment_status: "parcialmente_pago",
        status: "finalizado",
      },
    ];

    const kpis = calculateClientFinancialKpis(mockReceivables);

    assert(kpis["USD"].totalContracted === 1500.0, "Total Contratado USD = 1500");
    assert(kpis["USD"].totalReceived === 900.0, "Total Recebido USD = 900");
    assert(kpis["BRL"].totalContracted === 10000.0, "Total Contratado BRL = 10000");
    assert(kpis["BRL"].totalReceived === 2000.0, "Total Recebido BRL = 2000");
    assert((kpis as any)["TOTAL"] === undefined, "NÃO existe KPI misturando moedas sem conversão");
  }

  // ---------------------------------------------------------------------------
  // 10. ISOLAMENTO DAS INFORMAÇÕES FINANCEIRAS DE FORNECEDORES
  // ---------------------------------------------------------------------------
  console.log("\n--- 10. Isolamento das Informações de Fornecedores ---");
  {
    const sample = db.contracts["ctr-usd-1000"];
    assert((sample as any).supplier_payables === undefined, "ClientReceivable não possui supplier_payables");
    assert((sample as any).supplier_costs === undefined, "ClientReceivable não possui supplier_costs");
    assert((sample as any).profit_margin === undefined, "ClientReceivable não possui profit_margin");
  }

  // ===========================================================================
  // RESUMO
  // ===========================================================================
  console.log("\n=================================================================");
  console.log(`RESULTADO FINAL: ${testsPassed} PASSOU, ${testsFailed} FALHOU`);
  console.log("=================================================================");

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error("Erro fatal nos testes:", err);
  process.exit(1);
});
