/**
 * CONTAS A RECEBER DOS CLIENTES E CONTROLE CAMBIAL — TÍO NENÊ v0.1.43
 *
 * Módulo de gestão de recebíveis de clientes integrado aos contratos da agência.
 * Permite pagamentos parciais, quitação integral, acompanhamento de saldos pendentes,
 * recebimentos em BRL para contratos em USD com taxa cambial explícita e estornos auditáveis.
 *
 * REGRAS CRÍTICAS DE NEGÓCIO E SEGURANÇA:
 * 1. SEGREGAÇÃO CAMBIAL ESTRITA:
 *    NUNCA somar valores em USD e BRL sem conversão explicitamente registrada.
 *    Os KPIs e totais são segregados rigorosamente por moeda.
 * 2. CONVENÇÃO CAMBIAL EXPLÍCITA (BRL -> USD):
 *    Para contratos denominados em USD recebidos em BRL:
 *    Taxa informada representa: 1 USD = X BRL (ex: 5,20 BRL por USD).
 *    Valor amortizado na moeda contratual (USD) = valor_recebido (BRL) / taxa_cambio.
 *    Exemplo: 520,00 BRL / 5,20 = 100,00 USD amortizados no saldo.
 *    A taxa utilizada, a data de cotação e a fonte são imutáveis e preservadas historicamente.
 * 3. STATUS DERIVADO DO SALDO:
 *    Um contrato só é considerado 'pago' (quitado) quando o saldo pendente for zerado.
 *    Não é permitido marcar contrato como quitado se houver saldo positivo.
 * 4. ESTORNO AUDITÁVEL (EXCLUSIVO ADMIN):
 *    Estornos exigem justificativa obrigatória, registram quem estornou e quando,
 *    marcam is_reversed = true e recalculam o saldo contratual via RPC transacional.
 * 5. MUTAÇÕES EXCLUSIVAS VIA RPC:
 *    Nenhuma mutação financeira direta por INSERT ou UPDATE na tabela client_payment_entries.
 */

import type {
  ClientPaymentStatus,
  ClientPaymentEntry,
  ClientReceivable,
} from "../../types/operational";

export interface ClientReceivableKpiSummary {
  currency: string;
  totalContracted: number;
  totalReceived: number;
  totalPending: number;
  contractsPaidCount: number;
  contractsPartialCount: number;
  contractsNoPaymentCount: number;
  contractsOverdueCount: number;
  totalContractsCount: number;
}

/**
 * Calcula o saldo e o status de recebimento de um contrato individual.
 */
export function calculateContractReceivableBalance(receivable: {
  total_amount: number;
  client_paid_amount?: number | null;
  currency?: string;
  due_date?: string | null;
  status?: string;
}): {
  totalAmount: number;
  paidAmount: number;
  pendingBalance: number;
  status: ClientPaymentStatus;
} {
  const totalAmount = Number(receivable.total_amount || 0);
  const paidAmount = Number(receivable.client_paid_amount || 0);
  const pendingBalance = Math.max(0, totalAmount - paidAmount);

  let status: ClientPaymentStatus = "pendente";

  if (receivable.status === "cancelado") {
    status = "cancelado";
  } else if (totalAmount > 0 && pendingBalance <= 0.005) {
    status = "pago";
  } else if (paidAmount > 0) {
    status = "parcialmente_pago";
  } else if (receivable.due_date) {
    const today = new Date().toISOString().split("T")[0];
    if (receivable.due_date < today) {
      status = "vencido";
    } else {
      status = "pendente";
    }
  } else {
    status = "pendente";
  }

  return {
    totalAmount,
    paidAmount,
    pendingBalance,
    status,
  };
}

/**
 * Calcula indicadores financeiros segregados rigorosamente por moeda.
 * NUNCA soma USD com BRL ou MXN.
 */
export function calculateClientFinancialKpis(
  receivables: ClientReceivable[]
): Record<string, ClientReceivableKpiSummary> {
  const summaries: Record<string, ClientReceivableKpiSummary> = {};

  for (const item of receivables) {
    // Ignorar rascunhos para cálculo financeiro oficial de contas a receber
    if (item.status === "rascunho") {
      continue;
    }

    const curr = (item.currency || "USD").toUpperCase().trim();

    if (!summaries[curr]) {
      summaries[curr] = {
        currency: curr,
        totalContracted: 0,
        totalReceived: 0,
        totalPending: 0,
        contractsPaidCount: 0,
        contractsPartialCount: 0,
        contractsNoPaymentCount: 0,
        contractsOverdueCount: 0,
        totalContractsCount: 0,
      };
    }

    const s = summaries[curr];
    s.totalContractsCount += 1;

    const totalAmt = Number(item.total_amount || 0);
    const paidAmt = Number(item.client_paid_amount || 0);
    const balance = Math.max(0, totalAmt - paidAmt);

    // Contratos cancelados não somam no total a receber
    if (item.status === "cancelado") {
      continue;
    }

    s.totalContracted += totalAmt;
    s.totalReceived += paidAmt;
    s.totalPending += balance;

    if (totalAmt > 0 && balance <= 0.005) {
      s.contractsPaidCount += 1;
    } else if (paidAmt > 0) {
      s.contractsPartialCount += 1;
    } else {
      s.contractsNoPaymentCount += 1;
    }

    // Verificar se possui parcelas vencidas
    const today = new Date().toISOString().split("T")[0];
    if (item.due_date && item.due_date < today && balance > 0.005) {
      s.contractsOverdueCount += 1;
    }
  }

  return summaries;
}

/**
 * Calcula a amortização cambial na moeda do contrato com arredondamento financeiro.
 * Convenção: 1 USD = exchangeRate BRL
 */
export function calculateExchangeAmortization(
  amountReceived: number,
  receivedCurrency: string,
  contractCurrency: string,
  exchangeRate: number
): {
  amortizedAmount: number;
  isCrossCurrency: boolean;
  rateUsed: number;
  explanation: string;
} {
  const recv = (receivedCurrency || "BRL").toUpperCase().trim();
  const ctr = (contractCurrency || "USD").toUpperCase().trim();

  if (recv === ctr) {
    return {
      amortizedAmount: Math.round(amountReceived * 100) / 100,
      isCrossCurrency: false,
      rateUsed: 1.0,
      explanation: `Mesma moeda (${ctr}): amortização de 100% do valor recebido.`,
    };
  }

  if (exchangeRate <= 0) {
    throw new Error("Taxa de câmbio deve ser maior que zero.");
  }

  let amortized = 0;
  let explanation = "";

  if (ctr === "USD" && recv === "BRL") {
    // Convenção oficial: 1 USD = X BRL. Valor recebido em BRL dividido pela taxa (ex: 520 BRL / 5.20 = 100 USD)
    amortized = Math.round((amountReceived / exchangeRate) * 100) / 100;
    explanation = `Conversão BRL -> USD: ${amountReceived.toFixed(2)} BRL ÷ ${exchangeRate.toFixed(4)} = ${amortized.toFixed(2)} USD`;
  } else if (ctr === "BRL" && recv === "USD") {
    // Convenção oficial: 1 USD = X BRL. Valor recebido em USD multiplicado pela taxa (ex: 100 USD * 5.20 = 520 BRL)
    amortized = Math.round(amountReceived * exchangeRate * 100) / 100;
    explanation = `Conversão USD -> BRL: ${amountReceived.toFixed(2)} USD × ${exchangeRate.toFixed(4)} = ${amortized.toFixed(2)} BRL`;
  } else {
    throw new Error(
      `Conversão cambial não suportada entre ${recv} e ${ctr}. As combinações oficiais suportadas pela aplicação são BRL recebido para contrato em USD ou USD recebido para contrato em BRL.`
    );
  }

  return {
    amortizedAmount: amortized,
    isCrossCurrency: true,
    rateUsed: exchangeRate,
    explanation,
  };
}

/**
 * Registra um recebimento de cliente via RPC transacional oficial (record_client_payment).
 * NUNCA executa INSERT direto no client_payment_entries.
 */
export async function recordClientPayment(
  supabase: any,
  params: {
    contractId: string;
    amountReceived: number;
    receivedCurrency?: string;
    exchangeRate?: number;
    amortizedAmount?: number;
    exchangeRateDate?: string;
    exchangeRateSource?: string;
    paymentMethod?: string;
    paymentDate?: string;
    reference?: string;
    notes?: string;
    idempotencyKey?: string;
  }
): Promise<{
  success: boolean;
  message: string;
  entryId?: string;
  contractId?: string;
  amountReceived?: number;
  receivedCurrency?: string;
  exchangeRate?: number;
  amortizedAmount?: number;
  contractCurrency?: string;
  totalContracted?: number;
  totalPaid?: number;
  pendingBalance?: number;
  paymentStatus?: string;
  isIdempotentReplay?: boolean;
}> {
  const {
    contractId,
    amountReceived,
    receivedCurrency = "BRL",
    exchangeRate = 1.0,
    amortizedAmount,
    exchangeRateDate,
    exchangeRateSource,
    paymentMethod = "transferencia",
    paymentDate = new Date().toISOString().split("T")[0],
    reference,
    notes,
    idempotencyKey,
  } = params;

  if (!contractId) {
    throw new Error("ID do contrato não fornecido.");
  }

  if (!amountReceived || amountReceived <= 0) {
    throw new Error("O valor recebido deve ser maior que zero.");
  }

  const { data: rpcData, error: rpcErr } = await supabase.rpc(
    "record_client_payment",
    {
      p_contract_id: contractId,
      p_amount_received: amountReceived,
      p_received_currency: receivedCurrency,
      p_exchange_rate: exchangeRate,
      p_amortized_amount: amortizedAmount || null,
      p_exchange_rate_date: exchangeRateDate || null,
      p_exchange_rate_source: exchangeRateSource || null,
      p_payment_method: paymentMethod,
      p_payment_date: paymentDate,
      p_reference: reference || null,
      p_notes: notes || null,
      p_idempotency_key: idempotencyKey || null,
    }
  );

  if (rpcErr) {
    throw new Error(rpcErr.message || "Erro ao registrar recebimento do cliente no servidor.");
  }

  if (!rpcData || rpcData.success === false) {
    throw new Error(rpcData?.message || "Recebimento rejeitado pelo servidor.");
  }

  return {
    success: true,
    message: rpcData.message || "Recebimento registrado com sucesso.",
    entryId: rpcData.entry_id,
    contractId: rpcData.contract_id,
    amountReceived: rpcData.amount_received,
    receivedCurrency: rpcData.received_currency,
    exchangeRate: rpcData.exchange_rate,
    amortizedAmount: rpcData.amortized_amount,
    contractCurrency: rpcData.contract_currency,
    totalContracted: rpcData.total_contracted,
    totalPaid: rpcData.total_paid,
    pendingBalance: rpcData.pending_balance,
    paymentStatus: rpcData.payment_status,
    isIdempotentReplay: rpcData.is_idempotent_replay,
  };
}

/**
 * Estorna um recebimento de cliente de forma auditável (Exclusivo Admin via RPC reverse_client_payment).
 * NUNCA deleta fisicamente o lançamento.
 */
export async function reverseClientPayment(
  supabase: any,
  params: {
    paymentEntryId: string;
    reversalReason: string;
    isAdmin: boolean;
  }
): Promise<{
  success: boolean;
  message: string;
  paymentEntryId?: string;
  contractId?: string;
  reversedAmortizedAmount?: number;
  recalculatedPaidAmount?: number;
  pendingBalance?: number;
  newPaymentStatus?: string;
  contractCurrency?: string;
}> {
  const { paymentEntryId, reversalReason, isAdmin } = params;

  if (!isAdmin) {
    throw new Error("Acesso negado: apenas administradores podem estornar recebimentos de clientes.");
  }

  if (!paymentEntryId) {
    throw new Error("ID de lançamento de recebimento não fornecido.");
  }

  if (!reversalReason || !reversalReason.trim()) {
    throw new Error("É obrigatório informar a justificativa do estorno para fins de auditoria.");
  }

  const { data: rpcData, error: rpcErr } = await supabase.rpc(
    "reverse_client_payment",
    {
      p_payment_entry_id: paymentEntryId,
      p_reversal_reason: reversalReason.trim(),
    }
  );

  if (rpcErr) {
    throw new Error(rpcErr.message || "Erro ao estornar recebimento no servidor.");
  }

  if (!rpcData || rpcData.success === false) {
    throw new Error(rpcData?.message || "Estorno rejeitado pelo servidor.");
  }

  return {
    success: true,
    message: rpcData.message || "Recebimento estornado com sucesso mantendo histórico auditável.",
    paymentEntryId: rpcData.payment_entry_id,
    contractId: rpcData.contract_id,
    reversedAmortizedAmount: rpcData.reversed_amortized_amount,
    recalculatedPaidAmount: rpcData.recalculated_paid_amount,
    pendingBalance: rpcData.pending_balance,
    newPaymentStatus: rpcData.new_payment_status,
    contractCurrency: rpcData.contract_currency,
  };
}

/**
 * Formata valores monetários com precisão e símbolo correto.
 */
export function formatReceivableCurrency(
  amount: number | null | undefined,
  currency: string = "USD"
): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "—";
  }

  const curr = currency.toUpperCase().trim();

  let locale = "pt-BR";
  if (curr === "USD") locale = "en-US";
  if (curr === "MXN") locale = "es-MX";

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: curr,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${curr} ${amount.toFixed(2)}`;
  }
}

/**
 * Formata método de pagamento para rótulo legível em português.
 */
export function formatClientPaymentMethod(method: string): string {
  const map: Record<string, string> = {
    pix: "PIX",
    cartao_credito: "Cartão de Crédito",
    cartao_debito: "Cartão de Débito",
    transferencia: "Transferência Bancária",
    especie: "Espécie / Dinheiro",
    wise: "Wise / Transferência Internacional",
    link_pagamento: "Link de Pagamento Online",
    outro: "Outro Meio",
  };
  return map[method] || method || "Transferência";
}
