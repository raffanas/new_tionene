/**
 * GESTÃO FINANCEIRA DE FORNECEDORES & CONTAS A PAGAR — TÍO NENÊ v0.1.43
 *
 * Módulo exclusivo para Administradores.
 * Gerencia aprovação de custos finais, pagamentos parciais e integrais,
 * saldos pendentes na moeda original do fornecedor e estornos auditáveis.
 *
 * REGRAS FINANCEIRAS CRÍTICAS:
 * 1. NUNCA misturar moedas (USD, MXN, BRL) em somas ou KPIs.
 * 2. Custos desconhecidos / sob consulta devem permanecer NULL, nunca convertidos em zero.
 * 3. Uma obrigação só é considerada 'paga' quando o saldo pendente for zero.
 * 4. Pagamentos parciais não marcam a obrigação como paga (status: 'parcialmente_pago').
 * 5. Pagamentos superiores ao saldo aprovado são estritamente impedidos.
 * 6. Estornos preservam o histórico original marcando is_reversed = true e recalculando o saldo.
 */

import type {
  SupplierPayable,
  SupplierPaymentEntry,
  SupplierPaymentStatus,
} from "../../types/operational";

export interface CurrencyKpiSummary {
  currency: string;
  totalEstimated: number;
  totalApproved: number;
  totalPaid: number;
  pendingBalance: number;
  unknownCostCount: number;
  awaitingApprovalCount: number;
  payablesCount: number;
}

/**
 * Calcula o saldo e o valor efetivo de uma obrigação financeira individual.
 */
export function calculatePayableBalance(payable: SupplierPayable): {
  effectiveAmount: number | null;
  paidAmount: number;
  pendingBalance: number | null;
  isUnknown: boolean;
} {
  const isUnknown =
    Boolean(payable.is_unknown_cost) ||
    (payable.amount_final === null || payable.amount_final === undefined) &&
    (payable.amount_estimated === null || payable.amount_estimated === undefined);

  const paidAmount = Number(payable.paid_amount || 0);

  if (isUnknown) {
    return {
      effectiveAmount: null,
      paidAmount,
      pendingBalance: null,
      isUnknown: true,
    };
  }

  const effectiveAmount =
    payable.amount_final !== null && payable.amount_final !== undefined
      ? Number(payable.amount_final)
      : Number(payable.amount_estimated || 0);

  const pendingBalance = Math.max(0, effectiveAmount - paidAmount);

  return {
    effectiveAmount,
    paidAmount,
    pendingBalance,
    isUnknown: false,
  };
}

/**
 * Calcula indicadores financeiros segregados rigorosamente por moeda.
 * Não soma USD com MXN como se fossem a mesma moeda.
 */
export function calculateSupplierFinancialKpis(
  payables: SupplierPayable[]
): Record<string, CurrencyKpiSummary> {
  const summaries: Record<string, CurrencyKpiSummary> = {};

  for (const item of payables) {
    const curr = (item.currency || "USD").toUpperCase().trim();

    if (!summaries[curr]) {
      summaries[curr] = {
        currency: curr,
        totalEstimated: 0,
        totalApproved: 0,
        totalPaid: 0,
        pendingBalance: 0,
        unknownCostCount: 0,
        awaitingApprovalCount: 0,
        payablesCount: 0,
      };
    }

    const s = summaries[curr];
    s.payablesCount += 1;

    const { effectiveAmount, paidAmount, pendingBalance, isUnknown } =
      calculatePayableBalance(item);

    if (isUnknown) {
      s.unknownCostCount += 1;
      s.totalPaid += paidAmount;
    } else {
      if (item.amount_estimated !== null && item.amount_estimated !== undefined) {
        s.totalEstimated += Number(item.amount_estimated);
      }
      if (item.amount_final !== null && item.amount_final !== undefined) {
        s.totalApproved += Number(item.amount_final);
      }
      s.totalPaid += paidAmount;
      if (pendingBalance !== null) {
        s.pendingBalance += pendingBalance;
      }
    }

    if (item.payment_status === "aguardando_aprovacao" || (isUnknown && item.payment_status !== "cancelado")) {
      s.awaitingApprovalCount += 1;
    }
  }

  return summaries;
}

/**
 * Aprova ou ajusta o custo final do fornecedor (Exclusivo Admin via RPC oficial).
 * Não realiza mutações diretas na tabela; delega exclusivamente a approve_supplier_payable_cost.
 */
export async function approveSupplierPayableCost(
  supabase: any,
  params: {
    payableId: string;
    amountFinal: number | null;
    notes?: string;
    isAdmin: boolean;
  }
): Promise<{
  success: boolean;
  message: string;
  payableId?: string;
  amountFinal?: number | null;
  paidAmount?: number;
  pendingBalance?: number | null;
  paymentStatus?: string;
}> {
  const { payableId, amountFinal, notes, isAdmin } = params;

  if (!isAdmin) {
    throw new Error("Acesso negado: apenas administradores podem aprovar custos de fornecedores.");
  }

  if (!payableId) {
    throw new Error("ID de obrigação financeira inválido.");
  }

  if (amountFinal !== null && amountFinal < 0) {
    throw new Error("O custo final não pode ser negativo.");
  }

  const { data: rpcData, error: rpcErr } = await supabase.rpc(
    "approve_supplier_payable_cost",
    {
      p_payable_id: payableId,
      p_amount_final: amountFinal,
      p_notes: notes || null,
    }
  );

  if (rpcErr) {
    throw new Error(rpcErr.message || "Erro ao aprovar custo do fornecedor no servidor.");
  }

  if (!rpcData || rpcData.success === false) {
    throw new Error(rpcData?.message || "Operação de aprovação rejeitada pelo servidor.");
  }

  return {
    success: true,
    message: rpcData.message || "Custo final aprovado com sucesso.",
    payableId: rpcData.payable_id,
    amountFinal: rpcData.amount_final,
    paidAmount: rpcData.paid_amount,
    pendingBalance: rpcData.pending_balance,
    paymentStatus: rpcData.payment_status,
  };
}

/**
 * Registra um pagamento parcial ou integral a um fornecedor (Exclusivo Admin via RPC oficial).
 * Não realiza mutações diretas nas tabelas; delega exclusivamente a record_supplier_payment.
 */
export async function recordSupplierPayment(
  supabase: any,
  params: {
    payableId: string;
    amount: number;
    paymentMethod?: string;
    paymentDate?: string;
    reference?: string;
    notes?: string;
    idempotencyKey?: string;
    isAdmin: boolean;
  }
): Promise<{
  success: boolean;
  message: string;
  entryId?: string;
  payableId?: string;
  amountPaid?: number;
  totalPaid?: number;
  pendingBalance?: number;
  paymentStatus?: string;
  currency?: string;
  isIdempotentReplay?: boolean;
}> {
  const {
    payableId,
    amount,
    paymentMethod = "transferencia",
    paymentDate = new Date().toISOString().split("T")[0],
    reference,
    notes,
    idempotencyKey,
    isAdmin,
  } = params;

  if (!isAdmin) {
    throw new Error("Acesso negado: apenas administradores podem registrar pagamentos a fornecedores.");
  }

  if (!payableId) {
    throw new Error("ID de obrigação financeira inválido.");
  }

  if (!amount || amount <= 0) {
    throw new Error("O valor do pagamento deve ser maior que zero.");
  }

  const { data: rpcData, error: rpcErr } = await supabase.rpc(
    "record_supplier_payment",
    {
      p_payable_id: payableId,
      p_amount: amount,
      p_payment_method: paymentMethod,
      p_payment_date: paymentDate,
      p_reference: reference || null,
      p_notes: notes || null,
      p_idempotency_key: idempotencyKey || null,
    }
  );

  if (rpcErr) {
    throw new Error(rpcErr.message || "Erro ao registrar pagamento no servidor.");
  }

  if (!rpcData || rpcData.success === false) {
    throw new Error(rpcData?.message || "Registro de pagamento rejeitado pelo servidor.");
  }

  return {
    success: true,
    message: rpcData.message || "Pagamento registrado com sucesso.",
    entryId: rpcData.entry_id,
    payableId: rpcData.payable_id,
    amountPaid: rpcData.amount_paid,
    totalPaid: rpcData.total_paid,
    pendingBalance: rpcData.pending_balance,
    paymentStatus: rpcData.payment_status,
    currency: rpcData.currency,
    isIdempotentReplay: rpcData.is_idempotent_replay,
  };
}

/**
 * Estorna um lançamento de pagamento incorreto de forma auditável (Exclusivo Admin via RPC oficial).
 * Não realiza mutações diretas nas tabelas; delega exclusivamente a reverse_supplier_payment.
 */
export async function reverseSupplierPayment(
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
  payableId?: string;
  reversedAmount?: number;
  recalculatedPaidAmount?: number;
  pendingBalance?: number | null;
  newPaymentStatus?: string;
  currency?: string;
}> {
  const { paymentEntryId, reversalReason, isAdmin } = params;

  if (!isAdmin) {
    throw new Error("Acesso negado: apenas administradores podem estornar pagamentos de fornecedores.");
  }

  if (!paymentEntryId) {
    throw new Error("ID de lançamento de pagamento inválido.");
  }

  if (!reversalReason || !reversalReason.trim()) {
    throw new Error("É obrigatório informar a justificativa do estorno para fins de auditoria.");
  }

  const { data: rpcData, error: rpcErr } = await supabase.rpc(
    "reverse_supplier_payment",
    {
      p_payment_entry_id: paymentEntryId,
      p_reversal_reason: reversalReason.trim(),
    }
  );

  if (rpcErr) {
    throw new Error(rpcErr.message || "Erro ao estornar pagamento no servidor.");
  }

  if (!rpcData || rpcData.success === false) {
    throw new Error(rpcData?.message || "Operação de estorno rejeitada pelo servidor.");
  }

  return {
    success: true,
    message: rpcData.message || "Pagamento estornado com sucesso.",
    paymentEntryId: rpcData.payment_entry_id,
    payableId: rpcData.payable_id,
    reversedAmount: rpcData.reversed_amount,
    recalculatedPaidAmount: rpcData.recalculated_paid_amount,
    pendingBalance: rpcData.pending_balance,
    newPaymentStatus: rpcData.new_payment_status,
    currency: rpcData.currency,
  };
}
