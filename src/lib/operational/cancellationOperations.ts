/**
 * GESTÃO DE CANCELAMENTOS, CRÉDITOS E REEMBOLSOS — TÍO NENÊ v0.1.43
 * Arquivo: src/lib/operational/cancellationOperations.ts
 *
 * Módulo operacional e financeiro para:
 * 1. Cancelamentos de reservas operacionais individuais.
 * 2. Cancelamentos contratuais auditáveis.
 * 3. Gestão e histórico de créditos de clientes (anti-duplicação).
 * 4. Ciclo de reembolsos de clientes (solicitado -> em análise -> aprovado -> pago).
 * 5. Recuperações e multas de fornecedores (sem custo, multa, crédito, reembolso).
 * 6. Apuração de impacto financeiro por moeda nativa (BRL, USD, MXN).
 * 7. Mensageria segura de cancelamento para fornecedores via WhatsApp.
 *
 * REGRAS CRÍTICAS DE SEGURANÇA E NEGÓCIO:
 * - NUNCA somar moedas distintas (BRL + USD + MXN).
 * - NUNCA inventar taxas de câmbio presumidas.
 * - Custos desconhecidos permanecem estritamente desconhecidos.
 * - Reembolso aprovado é diferente de reembolso efetivamente pago.
 * - Crédito concedido não é dinheiro devolvido.
 * - Vendedores NUNCA têm acesso a custos, multas ou créditos de fornecedores.
 */

export type ReservationCancellationStatus =
  | "nenhum"
  | "solicitado"
  | "aguardando_fornecedor"
  | "confirmado"
  | "recusado"
  | "concluido";

export type ContractCancellationStatus =
  | "ativo"
  | "em_analise"
  | "cancelado";

export type ClientCreditStatus =
  | "disponivel"
  | "parcialmente_utilizado"
  | "utilizado"
  | "expirado"
  | "cancelado";

export type ClientRefundStatus =
  | "solicitado"
  | "em_analise"
  | "aprovado"
  | "pago"
  | "recusado"
  | "cancelado";

export type SupplierRecoveryType =
  | "sem_custo"
  | "multa_aplicada"
  | "credito_fornecedor"
  | "reembolso_prometido"
  | "reembolso_realizado";

export type SupplierRecoveryStatus =
  | "pendente"
  | "em_processamento"
  | "concluido"
  | "recusado";

export interface ClientCredit {
  id: string;
  client_id: string;
  client_name?: string;
  client_phone?: string | null;
  client_email?: string | null;
  contract_id?: string | null;
  contract_number?: string | null;
  amount: number;
  currency: string;
  balance: number;
  reason: string;
  status: ClientCreditStatus;
  expires_at?: string | null;
  created_by?: string | null;
  created_by_name?: string | null;
  notes?: string | null;
  created_at: string;
  usages?: ClientCreditUsage[];
}

export interface ClientCreditUsage {
  id: string;
  credit_id: string;
  destination_contract_id: string;
  destination_contract_number?: string;
  amount_used: number;
  currency: string;
  used_at: string;
  used_by?: string | null;
  used_by_name?: string | null;
  notes?: string | null;
}

export interface ClientRefund {
  id: string;
  client_id: string;
  client_name?: string;
  client_phone?: string | null;
  client_email?: string | null;
  contract_id: string;
  contract_number?: string;
  reservation_id?: string | null;
  product_name?: string | null;
  amount: number;
  currency: string;
  reason: string;
  status: ClientRefundStatus;
  payment_method?: string | null;
  payment_reference?: string | null;
  requested_at: string;
  requested_by?: string | null;
  requested_by_name?: string | null;
  approved_at?: string | null;
  approved_by?: string | null;
  approved_by_name?: string | null;
  paid_at?: string | null;
  paid_by?: string | null;
  paid_by_name?: string | null;
  rejection_reason?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface SupplierRecovery {
  id: string;
  supplier_id: string;
  supplier_name?: string;
  contract_id?: string | null;
  contract_number?: string | null;
  reservation_id?: string | null;
  product_name?: string | null;
  payable_id?: string | null;
  recovery_type: SupplierRecoveryType;
  amount_original: number;
  penalty_amount: number;
  recovered_amount: number;
  currency: string;
  status: SupplierRecoveryStatus;
  supplier_response?: string | null;
  reference?: string | null;
  resolved_at?: string | null;
  resolved_by?: string | null;
  resolved_by_name?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface CurrencyFinancialImpact {
  currency: string;
  totalContracted: number;
  totalReceived: number;
  totalSupplierPayableEstimated: number;
  totalSupplierPaid: number;
  totalSupplierPenalties: number;
  totalSupplierRecovered: number;
  totalCreditsGranted: number;
  totalCreditsBalance: number;
  totalRefundsRequested: number;
  totalRefundsApproved: number;
  totalRefundsPaid: number;
  clientNetPosition: number; // Recebido - Reembolsos Pagos - Crédito Saldo
  unknownCostCount: number;
}

export interface ContractPreCancellationSummary {
  contractId: string;
  contractNumber: string;
  clientName: string;
  currency: string;
  totalAmount: number;
  paidAmount: number;
  activeReservationsCount: number;
  completedReservationsCount: number;
  totalPayablesCount: number;
  totalPayablesPaid: number;
  canCancelDirectly: boolean;
  warnings: string[];
}

/**
 * Calcula o resumo de impacto financeiro segregado estritamente por moeda nativa.
 * NUNCA soma BRL + USD + MXN.
 */
export function calculateFinancialImpactByCurrency(params: {
  contracts?: Array<{
    id?: string;
    total_amount?: number;
    client_paid_amount?: number;
    currency?: string;
    status?: string;
  }>;
  supplierPayables?: Array<{
    currency?: string;
    amount_estimated?: number;
    amount_final?: number;
    paid_amount?: number;
    is_unknown_cost?: boolean;
    payment_status?: string;
  }>;
  credits?: ClientCredit[];
  refunds?: ClientRefund[];
  supplierRecoveries?: SupplierRecovery[];
}): Record<string, CurrencyFinancialImpact> {
  const result: Record<string, CurrencyFinancialImpact> = {};

  const ensureCurrency = (c: string): CurrencyFinancialImpact => {
    const cur = (c || "BRL").toUpperCase();
    if (!result[cur]) {
      result[cur] = {
        currency: cur,
        totalContracted: 0,
        totalReceived: 0,
        totalSupplierPayableEstimated: 0,
        totalSupplierPaid: 0,
        totalSupplierPenalties: 0,
        totalSupplierRecovered: 0,
        totalCreditsGranted: 0,
        totalCreditsBalance: 0,
        totalRefundsRequested: 0,
        totalRefundsApproved: 0,
        totalRefundsPaid: 0,
        clientNetPosition: 0,
        unknownCostCount: 0,
      };
    }
    return result[cur];
  };

  // 1. Contratos
  (params.contracts || []).forEach((c) => {
    if (c.status === "cancelado") return;
    const bucket = ensureCurrency(c.currency || "BRL");
    bucket.totalContracted += Number(c.total_amount || 0);
    bucket.totalReceived += Number(c.client_paid_amount || 0);
  });

  // 2. Obrigações com fornecedores
  (params.supplierPayables || []).forEach((sp) => {
    if (sp.payment_status === "cancelado") return;
    const cur = sp.currency || "USD";
    const bucket = ensureCurrency(cur);
    if (sp.is_unknown_cost) {
      bucket.unknownCostCount++;
    } else {
      const amt = sp.amount_final ?? sp.amount_estimated ?? 0;
      bucket.totalSupplierPayableEstimated += Number(amt);
    }
    bucket.totalSupplierPaid += Number(sp.paid_amount || 0);
  });

  // 3. Créditos de Clientes
  (params.credits || []).forEach((cr) => {
    if (cr.status === "cancelado") return;
    const bucket = ensureCurrency(cr.currency || "BRL");
    bucket.totalCreditsGranted += Number(cr.amount || 0);
    bucket.totalCreditsBalance += Number(cr.balance || 0);
  });

  // 4. Reembolsos de Clientes
  (params.refunds || []).forEach((rf) => {
    if (rf.status === "recusado" || rf.status === "cancelado") return;
    const bucket = ensureCurrency(rf.currency || "BRL");
    bucket.totalRefundsRequested += Number(rf.amount || 0);
    if (rf.status === "aprovado") {
      bucket.totalRefundsApproved += Number(rf.amount || 0);
    } else if (rf.status === "pago") {
      bucket.totalRefundsApproved += Number(rf.amount || 0);
      bucket.totalRefundsPaid += Number(rf.amount || 0);
    }
  });

  // 5. Recuperações de Fornecedores
  (params.supplierRecoveries || []).forEach((sr) => {
    if (sr.status === "recusado") return;
    const bucket = ensureCurrency(sr.currency || "USD");
    bucket.totalSupplierPenalties += Number(sr.penalty_amount || 0);
    // Registros de reembolso prometido NÃO devem ser contabilizados como dinheiro recebido
    if (sr.recovery_type !== "reembolso_prometido") {
      bucket.totalSupplierRecovered += Number(sr.recovered_amount || 0);
    }
  });

  // 6. Posição líquida do cliente
  Object.values(result).forEach((bucket) => {
    bucket.clientNetPosition =
      bucket.totalReceived - bucket.totalRefundsPaid - bucket.totalCreditsBalance;
  });

  return result;
}

/**
 * Validação prévia de cancelamento de contrato completo (exibe avisos antes de cancelar).
 */
export function buildContractPreCancellationSummary(params: {
  contract: {
    id: string;
    contract_number: string;
    client_name: string;
    currency: string;
    total_amount: number;
    client_paid_amount?: number;
    status: string;
  };
  reservations: Array<{
    id: string;
    product_name: string;
    status: string;
    tour_date: string;
  }>;
  supplierPayables: Array<{
    amount_final?: number;
    amount_estimated?: number;
    paid_amount?: number;
    currency: string;
    payment_status: string;
  }>;
}): ContractPreCancellationSummary {
  const { contract, reservations, supplierPayables } = params;

  let activeReservationsCount = 0;
  let completedReservationsCount = 0;
  const warnings: string[] = [];

  reservations.forEach((r) => {
    if (r.status === "realizada") {
      completedReservationsCount++;
      warnings.push(`Passeio já realizado: "${r.product_name}" em ${r.tour_date}. Avaliar cobrança proporcional.`);
    } else if (r.status !== "cancelada") {
      activeReservationsCount++;
    }
  });

  let totalPayablesPaid = 0;
  supplierPayables.forEach((sp) => {
    if (Number(sp.paid_amount || 0) > 0) {
      totalPayablesPaid += Number(sp.paid_amount || 0);
      warnings.push(
        `Pagamento de ${sp.currency} ${Number(sp.paid_amount).toFixed(2)} já efetuado ao fornecedor. Requer abertura de solicitação de recuperação/reembolso com o operador.`
      );
    }
  });

  const paidAmount = Number(contract.client_paid_amount || 0);
  if (paidAmount > 0) {
    warnings.push(
      `O cliente já pagou ${contract.currency} ${paidAmount.toFixed(2)}. Defina se o saldo remanescente será estornado, convertido em crédito ou retido como taxa contratual.`
    );
  }

  return {
    contractId: contract.id,
    contractNumber: contract.contract_number,
    clientName: contract.client_name,
    currency: contract.currency || "BRL",
    totalAmount: Number(contract.total_amount || 0),
    paidAmount,
    activeReservationsCount,
    completedReservationsCount,
    totalPayablesCount: supplierPayables.length,
    totalPayablesPaid,
    canCancelDirectly: true,
    warnings,
  };
}

/**
 * Verifica se um crédito de cliente está vencido com base na data de expiração (fonte da verdade).
 */
export function isClientCreditExpired(credit: {
  expires_at?: string | null;
  status?: string;
}): boolean {
  if (credit.status === "expirado") return true;
  if (credit.status === "utilizado" || credit.status === "cancelado") return false;
  if (!credit.expires_at) return false;
  const expDate = new Date(credit.expires_at + "T23:59:59");
  return !isNaN(expDate.getTime()) && expDate < new Date();
}

/**
 * Retorna o status efetivo do crédito, apresentando como 'expirado' se a data limite foi atingida.
 */
export function getEffectiveCreditStatus(credit: ClientCredit): ClientCreditStatus {
  if (isClientCreditExpired(credit)) return "expirado";
  return credit.status;
}

/**
 * Validação rigorosa de utilização de crédito para impedir saldo negativo, moedas divergentes ou clientes diferentes.
 */
export function validateClientCreditUsage(params: {
  credit: ClientCredit;
  amountToUse: number;
  destinationCurrency: string;
  destinationClientId?: string;
}): { valid: boolean; error?: string } {
  const { credit, amountToUse, destinationCurrency, destinationClientId } = params;

  if (credit.status === "utilizado" || credit.status === "cancelado" || credit.status === "expirado") {
    return { valid: false, error: `Crédito indisponível para uso (status: ${credit.status}).` };
  }

  if (isClientCreditExpired(credit)) {
    return { valid: false, error: `Este crédito expirou em ${credit.expires_at} e não pode ser utilizado.` };
  }

  if (amountToUse <= 0) {
    return { valid: false, error: "O valor de utilização deve ser superior a zero." };
  }

  if (amountToUse > credit.balance) {
    return {
      valid: false,
      error: `Saldo insuficiente. Saldo disponível: ${credit.currency} ${credit.balance.toFixed(2)}, valor solicitado: ${credit.currency} ${amountToUse.toFixed(2)}.`,
    };
  }

  if (credit.currency.toUpperCase() !== destinationCurrency.toUpperCase()) {
    return {
      valid: false,
      error: `Moedas incompatíveis. O crédito é em ${credit.currency} e o contrato de destino é em ${destinationCurrency}. A conversão automática é proibida perante as regras de integridade cambial.`,
    };
  }

  if (destinationClientId && credit.client_id !== destinationClientId) {
    return {
      valid: false,
      error: "Incompatibilidade de titularidade: o crédito pertence a outro cliente e não pode ser transferido ou aplicado neste contrato.",
    };
  }

  return { valid: true };
}

/**
 * Validação prévia de concessão de crédito.
 */
export function validateClientCreditGrant(params: {
  clientId: string;
  amount: number;
  currency: string;
  reason: string;
  contractClientId?: string | null;
}): { valid: boolean; error?: string } {
  const { clientId, amount, currency, reason, contractClientId } = params;

  if (!clientId || !clientId.trim()) {
    return { valid: false, error: "Cliente é obrigatório para emissão de crédito." };
  }

  if (contractClientId && contractClientId !== clientId) {
    return { valid: false, error: "Inconsistência cadastral: o contrato de origem informado pertence a outro cliente." };
  }

  if (!amount || amount <= 0) {
    return { valid: false, error: "O valor do crédito deve ser superior a zero." };
  }

  const cur = (currency || "").trim().toUpperCase();
  if (!["BRL", "USD", "MXN"].includes(cur)) {
    return { valid: false, error: `Moeda inválida: ${currency}. Moedas aceitas são BRL, USD ou MXN.` };
  }

  if (!reason || !reason.trim()) {
    return { valid: false, error: "Motivo do crédito é obrigatório." };
  }

  return { valid: true };
}

/**
 * Validação prévia de solicitação de reembolso.
 */
export function validateRefundRequest(params: {
  contractId: string;
  amount: number;
  currency: string;
  reason: string;
  userRole: string;
  reservationContractId?: string | null;
}): { valid: boolean; error?: string } {
  const { contractId, amount, currency, reason, userRole, reservationContractId } = params;

  if (!["admin", "moderator", "user", "seller"].includes(userRole)) {
    return { valid: false, error: "Acesso negado: perfil de usuário não autorizado a solicitar reembolsos." };
  }

  if (!contractId) {
    return { valid: false, error: "Contrato vinculado é obrigatório." };
  }

  if (reservationContractId && reservationContractId !== contractId) {
    return { valid: false, error: "Inconsistência cadastral: a reserva operacional informada não pertence ao contrato especificado." };
  }

  if (!amount || amount <= 0) {
    return { valid: false, error: "O valor do reembolso deve ser superior a zero." };
  }

  const cur = (currency || "").trim().toUpperCase();
  if (!["BRL", "USD", "MXN"].includes(cur)) {
    return { valid: false, error: `Moeda inválida: ${currency}. Moedas aceitas são BRL, USD ou MXN.` };
  }

  if (!reason || !reason.trim()) {
    return { valid: false, error: "Motivo da solicitação de reembolso é obrigatório." };
  }

  return { valid: true };
}

/**
 * Validação de transição de estado para aprovação de reembolso.
 */
export function validateRefundApproval(refund: { status: string }): { valid: boolean; error?: string } {
  if (refund.status === "pago") {
    return { valid: false, error: "Operação inválida: o reembolso já foi pago e não pode ser reaprovado." };
  }
  if (refund.status === "recusado" || refund.status === "cancelado") {
    return { valid: false, error: `Operação inválida: o reembolso está ${refund.status} e não pode ser aprovado diretamente.` };
  }
  if (refund.status === "aprovado") {
    return { valid: false, error: "Operação redundante: o reembolso já se encontra aprovado." };
  }
  if (refund.status !== "solicitado" && refund.status !== "em_analise") {
    return { valid: false, error: `Status inválido para aprovação: ${refund.status}.` };
  }
  return { valid: true };
}

/**
 * Validação de transição de estado para liquidação/pagamento de reembolso.
 */
export function validateRefundPayment(params: {
  refund: { status: string; payment_reference?: string | null; paid_at?: string | null };
  paymentMethod: string;
  paymentReference: string;
}): { valid: boolean; error?: string } {
  const { refund, paymentMethod, paymentReference } = params;

  if (refund.status === "pago") {
    return {
      valid: false,
      error: `Operação rejeitada: este reembolso já foi pago anteriormente em ${refund.paid_at || "data registrada"} (Comprovante: ${refund.payment_reference || "N/A"}). Pagamento duplicado impedido.`,
    };
  }

  if (refund.status !== "aprovado") {
    return {
      valid: false,
      error: `Operação rejeitada: apenas reembolsos previamente aprovados podem ser liquidados. Status atual: ${refund.status}.`,
    };
  }

  if (!paymentMethod || !paymentMethod.trim()) {
    return { valid: false, error: "Método de pagamento é obrigatório para registrar a liquidação do reembolso." };
  }

  if (!paymentReference || !paymentReference.trim()) {
    return { valid: false, error: "Referência ou comprovante bancário da operação é obrigatório." };
  }

  return { valid: true };
}

/**
 * Prepara mensagem profissional de solicitação de cancelamento para o fornecedor via WhatsApp.
 * NÃO contém nenhuma informação financeira de venda ao cliente nem margens internas.
 */
export function generateSupplierCancellationWhatsAppMessage(params: {
  supplierName: string;
  productName: string;
  tourDate: string;
  clientName: string;
  totalPax: number;
  supplierConfirmationCode?: string | null;
  voucherRef?: string | null;
  cancellationReason: string;
  agencyName?: string;
}): string {
  const {
    supplierName,
    productName,
    tourDate,
    clientName,
    totalPax,
    supplierConfirmationCode,
    voucherRef,
    cancellationReason,
    agencyName = "Tío Nenê Viagens",
  } = params;

  const formattedDate = tourDate
    ? new Date(tourDate + "T12:00:00").toLocaleDateString("pt-BR")
    : "Data a definir";

  let msg = `🚨 *SOLICITAÇÃO DE CANCELAMENTO DE RESERVA*\n\n`;
  msg += `Olá, equipe *${supplierName}*! Tudo bem?\n\n`;
  msg += `Aqui é da Central de Operações da *${agencyName}* em Cancún.\n`;
  msg += `Gostaríamos de solicitar formalmente o *cancelamento* da seguinte reserva operacional:\n\n`;
  msg += `📋 *Passeio / Serviço:* ${productName}\n`;
  msg += `📅 *Data do Serviço:* ${formattedDate}\n`;
  msg += `👤 *Titular da Reserva:* ${clientName}\n`;
  msg += `👥 *Passageiros:* ${totalPax} PAX\n`;

  if (supplierConfirmationCode && supplierConfirmationCode.trim()) {
    msg += `🔢 *Cód. Confirmação Fornecedor:* ${supplierConfirmationCode.trim()}\n`;
  }
  if (voucherRef && voucherRef.trim()) {
    msg += `🎟️ *Voucher Ref:* ${voucherRef.trim()}\n`;
  }

  if (cancellationReason && cancellationReason.trim()) {
    msg += `ℹ️ *Motivo do Cancelamento:* ${cancellationReason.trim()}\n\n`;
  } else {
    msg += `ℹ️ *Motivo do Cancelamento:* Solicitação do passageiro / ajuste de itinerário\n\n`;
  }

  msg += `Solicitamos a gentileza de nos confirmar o cancelamento no sistema e nos informar se há alguma taxa/multa aplicável ou se será concedido crédito/reembolso sem ônus.\n\n`;
  msg += `Muito obrigado pela costumeira atenção e parceria!\n`;
  msg += `*${agencyName} — Central de Atendimento & Operações*`;

  return msg;
}

/**
 * Validação rigorosa para inserção/atualização de recuperações de fornecedores (supplier_recovery_records).
 * Garante que administradores respeitem constraints financeiras:
 * - Valores não-negativos
 * - Moedas aceitas (USD, MXN, BRL)
 * - Reembolso prometido NÃO pode ser dinheiro recebido (recovered_amount deve ser 0)
 * - Recuperação efetiva (recovered_amount > 0) exige referência/comprovante e data de liquidação
 */
export function validateSupplierRecoveryRecord(record: {
  amount_original?: number;
  penalty_amount?: number;
  recovered_amount?: number;
  currency?: string;
  recovery_type: string;
  reference?: string | null;
  resolved_at?: string | null;
  userRole?: string;
}): { valid: boolean; error?: string } {
  if (record.userRole && record.userRole !== "admin") {
    return { valid: false, error: "Acesso negado: apenas administradores podem registrar recuperações financeiras de fornecedores." };
  }

  if ((record.amount_original ?? 0) < 0) {
    return { valid: false, error: "O valor original não pode ser negativo." };
  }
  if ((record.penalty_amount ?? 0) < 0) {
    return { valid: false, error: "O valor da multa não pode ser negativo." };
  }
  if ((record.recovered_amount ?? 0) < 0) {
    return { valid: false, error: "O valor recuperado não pode ser negativo." };
  }

  const cur = (record.currency || "").trim().toUpperCase();
  if (!["USD", "MXN", "BRL"].includes(cur)) {
    return { valid: false, error: `Moeda inválida: ${record.currency}. Moedas aceitas são USD, MXN ou BRL.` };
  }

  if (record.recovery_type === "reembolso_prometido" && (record.recovered_amount ?? 0) > 0) {
    return { valid: false, error: "Reembolso prometido não pode ser contabilizado como dinheiro recebido (valor recuperado deve ser 0)." };
  }

  if ((record.recovered_amount ?? 0) > 0) {
    if (!record.resolved_at || !record.reference || !record.reference.trim()) {
      return { valid: false, error: "A confirmação de recuperação efetiva exige data de liquidação e referência/comprovante." };
    }
  }

  return { valid: true };
}
