/**
 * PAINEL FINANCEIRO CONSOLIDADO E RESULTADO OPERACIONAL — TÍO NENÊ v0.1.43
 * Arquivo: src/lib/financial/consolidatedFinance.ts
 *
 * Módulo exclusivo para Administradores.
 * Consolida contratos da agência, recebíveis de clientes, contas a pagar a fornecedores
 * e desembolsos efetivos, sem duplicar lançamentos e com segregação cambial estrita.
 *
 * REGRAS CRÍTICAS DE NEGÓCIO E SEGURANÇA:
 * 1. SEGREGAÇÃO DE MOEDAS:
 *    NUNCA somar USD, BRL e MXN diretamente. Indicadores apresentados por moeda.
 *    Sem base cambial suficiente, consolidação global exibe "Resultado indisponível — conversão pendente".
 * 2. CUSTOS DESCONHECIDOS (NULL):
 *    Custos desconhecidos / sob consulta NUNCA são tratados como zero.
 *    Quando existirem custos pendentes de aprovação ou desconhecidos, o resultado operacional
 *    é classificado como "parcial_provisorio".
 * 3. EXCLUSÃO DE ESTORNOS:
 *    Lançamentos estornados (is_reversed = true) são estritamente excluídos dos totais realizados.
 * 4. CONCORRÊNCIA E IDEMPOTÊNCIA:
 *    Contratos e obrigações são indexados por seus identificadores únicos para evitar duplicidade.
 * 5. ACESSO RESTRITO:
 *    Indicadores de custos, margem e resultado são restritos a administradores.
 */

import type {
  ClientReceivable,
  ClientPaymentEntry,
  SupplierPayable,
  SupplierPaymentEntry,
  ClientPaymentStatus,
  SupplierPaymentStatus,
} from "../../types/operational";

// =============================================================================
// INTERFACES E TIPOS
// =============================================================================

export interface CurrencyFinancialIndicator {
  currency: string;

  // Contratos / Clientes (Vendas)
  totalContracted: number;          // Valor total de contratos elegíveis
  totalReceivedFromClients: number; // Total recebido de clientes amortizado no contrato
  totalPendingFromClients: number;  // Saldo residual a receber de clientes
  contractsEligibleCount: number;   // Quantidade de contratos elegíveis
  contractsPartialCount: number;    // Quantidade de contratos com recebimento parcial
  contractsPaidCount: number;       // Quantidade de contratos quitados
  contractsPendingCount: number;    // Quantidade de contratos sem nenhum recebimento

  // Fornecedores / Contas a Pagar (Custos Operacionais)
  totalPayableApproved: number;     // Total de custos finais aprovados (amount_final)
  totalPayableEstimated: number;    // Total previsto aguardando aprovação (amount_estimated)
  totalPayableEffective: number;    // Total efetivo apurado (Aprovado + Previsto)
  totalPaidToSuppliers: number;     // Total efetivamente pago a fornecedores
  totalPendingToSuppliers: number;  // Saldo pendente com fornecedores
  unknownCostCount: number;         // Custos desconhecidos / sob consulta (NULL)
  awaitingApprovalCount: number;    // Custos aguardando aprovação
  payablesCount: number;            // Quantidade de obrigações com fornecedores
  suppliersWithPendingCount: number;// Quantidade de fornecedores com pagamentos pendentes

  // Caixa Realizado na Moeda
  cashReceivedRealized: number;     // Total em dinheiro recebido nessa moeda (client entries ativas)
  cashPaidRealized: number;         // Total em dinheiro pago a fornecedores nessa moeda (supplier entries ativas)
  netCashFlowRealized: number;      // Fluxo financeiro líquido realizado (Entradas - Saídas)

  // Resultado Operacional por Competência
  accrualResultApproved: number | null;  // Receita Contratual - Custos Aprovados
  accrualResultEstimated: number | null; // Receita Contratual - (Custos Aprovados + Previstos)
  marginPercentageApproved: number | null; // Margem % sobre receita (se aplicável)

  // Diagnóstico do Resultado
  resultStatus: "consolidado" | "parcial_provisorio" | "indisponivel";
  resultMessage: string;
}

export interface ConsolidatedFinancialSummary {
  byCurrency: Record<string, CurrencyFinancialIndicator>;
  currencies: string[];

  // Contadores globais não monetários (seguros para somar pois são contagens)
  totalEligibleContracts: number;
  totalPartialContracts: number;
  totalPaidContracts: number;
  totalSuppliersWithPending: number;
  totalUnknownCosts: number;
  totalAwaitingApprovalCosts: number;

  // Consolidação Global Multi-Moeda
  globalConsolidationStatus: "indisponivel" | "parcial_provisorio" | "consolidado";
  globalConsolidationMessage: string;
}

export interface FinancialFilters {
  startDate?: string;
  endDate?: string;
  contractStatus?: string; // "todos" | "finalizado" | "emitido" | "assinado" | "concluido"
  sellerName?: string;     // "todos" | nome do vendedor
  supplierId?: string;     // "todos" | uuid do fornecedor
  currency?: string;       // "todas" | "USD" | "BRL" | "MXN"
}

// =============================================================================
// CÁLCULO FINANCEIRO CONSOLIDADO
// =============================================================================

/**
 * Calcula os indicadores financeiros consolidados segregados rigorosamente por moeda.
 */
export function calculateConsolidatedFinancialKpis(params: {
  contracts: Array<Partial<ClientReceivable> & { id: string; total_amount?: number; currency?: string; status?: string; client_paid_amount?: number; seller_name?: string; sale_date?: string; created_at?: string }>;
  clientEntries: ClientPaymentEntry[];
  payables: SupplierPayable[];
  supplierEntries: SupplierPaymentEntry[];
}): ConsolidatedFinancialSummary {
  const { contracts, clientEntries, payables, supplierEntries } = params;

  // Mapas para desduplicação
  const uniqueContracts = new Map<string, typeof contracts[0]>();
  const uniquePayables = new Map<string, SupplierPayable>();
  const uniqueClientEntries = new Map<string, ClientPaymentEntry>();
  const uniqueSupplierEntries = new Map<string, SupplierPaymentEntry>();

  // 1. Processar contratos únicos
  for (const c of contracts) {
    if (c.id && !uniqueContracts.has(c.id)) {
      uniqueContracts.set(c.id, c);
    }
  }

  // 2. Processar obrigações a pagar únicas
  for (const p of payables) {
    if (p.id && !uniquePayables.has(p.id)) {
      uniquePayables.set(p.id, p);
    }
  }

  // 3. Processar lançamentos de clientes únicos
  for (const ce of clientEntries) {
    if (ce.id && !uniqueClientEntries.has(ce.id)) {
      uniqueClientEntries.set(ce.id, ce);
    }
  }

  // 4. Processar lançamentos de fornecedores únicos
  for (const se of supplierEntries) {
    if (se.id && !uniqueSupplierEntries.has(se.id)) {
      uniqueSupplierEntries.set(se.id, se);
    }
  }

  const summaries: Record<string, CurrencyFinancialIndicator> = {};

  const ensureCurrency = (currency: string): CurrencyFinancialIndicator => {
    const curr = (currency || "USD").toUpperCase().trim();
    if (!summaries[curr]) {
      summaries[curr] = {
        currency: curr,
        totalContracted: 0,
        totalReceivedFromClients: 0,
        totalPendingFromClients: 0,
        contractsEligibleCount: 0,
        contractsPartialCount: 0,
        contractsPaidCount: 0,
        contractsPendingCount: 0,

        totalPayableApproved: 0,
        totalPayableEstimated: 0,
        totalPayableEffective: 0,
        totalPaidToSuppliers: 0,
        totalPendingToSuppliers: 0,
        unknownCostCount: 0,
        awaitingApprovalCount: 0,
        payablesCount: 0,
        suppliersWithPendingCount: 0,

        cashReceivedRealized: 0,
        cashPaidRealized: 0,
        netCashFlowRealized: 0,

        accrualResultApproved: null,
        accrualResultEstimated: null,
        marginPercentageApproved: null,

        resultStatus: "consolidado",
        resultMessage: "",
      };
    }
    return summaries[curr];
  };

  // ---------------------------------------------------------------------------
  // PROCESSAMENTO DE CONTRATOS (RECEITA CONTRATUAL E AMORTIZAÇÃO)
  // ---------------------------------------------------------------------------
  const eligibleStatuses = ["emitido", "assinado", "finalizado", "concluido"];

  for (const c of uniqueContracts.values()) {
    // Ignorar rascunho e cancelado
    if (!c.status || !eligibleStatuses.includes(c.status)) {
      continue;
    }

    const curr = (c.currency || "USD").toUpperCase().trim();
    const ind = ensureCurrency(curr);

    const totalAmt = Number(c.total_amount || 0);
    const paidAmt = Number(c.client_paid_amount || 0);
    const pendingAmt = Math.max(0, totalAmt - paidAmt);

    ind.contractsEligibleCount += 1;
    ind.totalContracted = round2(ind.totalContracted + totalAmt);
    ind.totalReceivedFromClients = round2(ind.totalReceivedFromClients + paidAmt);
    ind.totalPendingFromClients = round2(ind.totalPendingFromClients + pendingAmt);

    if (totalAmt > 0 && pendingAmt <= 0.005) {
      ind.contractsPaidCount += 1;
    } else if (paidAmt > 0.005) {
      ind.contractsPartialCount += 1;
    } else {
      ind.contractsPendingCount += 1;
    }
  }

  // ---------------------------------------------------------------------------
  // PROCESSAMENTO DE OBRIGAÇÕES COM FORNECEDORES (CUSTOS OPERACIONAIS)
  // ---------------------------------------------------------------------------
  // Rastreamento de fornecedores com saldo pendente por moeda
  const suppliersPendingByCurrency: Record<string, Set<string>> = {};

  for (const p of uniquePayables.values()) {
    // Ignorar obrigações canceladas
    if (p.payment_status === "cancelado") {
      continue;
    }

    const curr = (p.currency || "USD").toUpperCase().trim();
    const ind = ensureCurrency(curr);

    if (!suppliersPendingByCurrency[curr]) {
      suppliersPendingByCurrency[curr] = new Set<string>();
    }

    ind.payablesCount += 1;

    const isUnknown =
      Boolean(p.is_unknown_cost) ||
      ((p.amount_final === null || p.amount_final === undefined) &&
        (p.amount_estimated === null || p.amount_estimated === undefined));

    const paidAmount = Number(p.paid_amount || 0);
    ind.totalPaidToSuppliers = round2(ind.totalPaidToSuppliers + paidAmount);

    if (isUnknown) {
      // Custo desconhecido NUNCA é tratado como zero
      ind.unknownCostCount += 1;
      if (p.supplier_id || p.supplier_name) {
        suppliersPendingByCurrency[curr].add(p.supplier_id || p.supplier_name || "");
      }
    } else {
      const hasFinal = p.amount_final !== null && p.amount_final !== undefined;
      const finalAmt = hasFinal ? Number(p.amount_final) : null;
      const estimatedAmt = p.amount_estimated !== null && p.amount_estimated !== undefined ? Number(p.amount_estimated) : null;

      if (hasFinal && finalAmt !== null) {
        ind.totalPayableApproved = round2(ind.totalPayableApproved + finalAmt);
        ind.totalPayableEffective = round2(ind.totalPayableEffective + finalAmt);
        const pend = Math.max(0, finalAmt - paidAmount);
        ind.totalPendingToSuppliers = round2(ind.totalPendingToSuppliers + pend);

        if (pend > 0.005 && (p.supplier_id || p.supplier_name)) {
          suppliersPendingByCurrency[curr].add(p.supplier_id || p.supplier_name || "");
        }
      } else {
        // Aguardando aprovação final
        ind.awaitingApprovalCount += 1;
        const est = estimatedAmt || 0;
        ind.totalPayableEstimated = round2(ind.totalPayableEstimated + est);
        ind.totalPayableEffective = round2(ind.totalPayableEffective + est);
        const pend = Math.max(0, est - paidAmount);
        ind.totalPendingToSuppliers = round2(ind.totalPendingToSuppliers + pend);

        if (pend > 0.005 && (p.supplier_id || p.supplier_name)) {
          suppliersPendingByCurrency[curr].add(p.supplier_id || p.supplier_name || "");
        }
      }
    }
  }

  for (const curr of Object.keys(suppliersPendingByCurrency)) {
    if (summaries[curr]) {
      summaries[curr].suppliersWithPendingCount = suppliersPendingByCurrency[curr].size;
    }
  }

  // ---------------------------------------------------------------------------
  // PROCESSAMENTO DE FLUXO DE CAIXA REALIZADO (ENTRADAS E SAÍDAS ATIVAS)
  // ---------------------------------------------------------------------------
  // Entradas ativas de clientes (exclui estornos)
  for (const ce of uniqueClientEntries.values()) {
    if (ce.is_reversed) {
      continue;
    }
    const curr = (ce.received_currency || "BRL").toUpperCase().trim();
    const ind = ensureCurrency(curr);
    ind.cashReceivedRealized = round2(ind.cashReceivedRealized + Number(ce.amount_received || 0));
  }

  // Saídas ativas para fornecedores (exclui estornos)
  for (const se of uniqueSupplierEntries.values()) {
    if (se.is_reversed) {
      continue;
    }
    const curr = (se.currency || "USD").toUpperCase().trim();
    const ind = ensureCurrency(curr);
    ind.cashPaidRealized = round2(ind.cashPaidRealized + Number(se.amount || 0));
  }

  // ---------------------------------------------------------------------------
  // APURAÇÃO DE RESULTADO OPERACIONAL POR MOEDA
  // ---------------------------------------------------------------------------
  const currencyKeys = Object.keys(summaries).sort();

  for (const curr of currencyKeys) {
    const ind = summaries[curr];

    ind.netCashFlowRealized = round2(ind.cashReceivedRealized - ind.cashPaidRealized);

    const hasCosts = ind.payablesCount > 0;
    const hasRevenue = ind.totalContracted > 0;

    if (!hasCosts && !hasRevenue) {
      ind.resultStatus = "indisponivel";
      ind.resultMessage = `Sem movimentação financeira registrada para ${curr}.`;
      continue;
    }

    if (ind.unknownCostCount > 0 || ind.awaitingApprovalCount > 0) {
      ind.resultStatus = "parcial_provisorio";
      const pendCount = ind.unknownCostCount + ind.awaitingApprovalCount;
      ind.resultMessage = `Resultado Provisório: Existem ${pendCount} custo(s) pendente(s) de aprovação ou sob consulta.`;

      ind.accrualResultApproved = round2(ind.totalContracted - ind.totalPayableApproved);
      ind.accrualResultEstimated = round2(ind.totalContracted - ind.totalPayableEffective);

      if (ind.totalContracted > 0) {
        ind.marginPercentageApproved = round2((ind.accrualResultApproved / ind.totalContracted) * 100);
      }
    } else {
      ind.resultStatus = "consolidado";
      ind.resultMessage = `Resultado Consolidado: Todos os custos de fornecedores em ${curr} foram aprovados.`;

      ind.accrualResultApproved = round2(ind.totalContracted - ind.totalPayableApproved);
      ind.accrualResultEstimated = ind.accrualResultApproved;

      if (ind.totalContracted > 0) {
        ind.marginPercentageApproved = round2((ind.accrualResultApproved / ind.totalContracted) * 100);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // CONSOLIDAÇÃO GLOBAL
  // ---------------------------------------------------------------------------
  let totalEligibleContracts = 0;
  let totalPartialContracts = 0;
  let totalPaidContracts = 0;
  const globalSuppliersWithPending = new Set<string>();
  let totalUnknownCosts = 0;
  let totalAwaitingApprovalCosts = 0;

  for (const curr of currencyKeys) {
    const ind = summaries[curr];
    totalEligibleContracts += ind.contractsEligibleCount;
    totalPartialContracts += ind.contractsPartialCount;
    totalPaidContracts += ind.contractsPaidCount;
    totalUnknownCosts += ind.unknownCostCount;
    totalAwaitingApprovalCosts += ind.awaitingApprovalCount;

    const set = suppliersPendingByCurrency[curr];
    if (set) {
      for (const s of set) {
        if (s) globalSuppliersWithPending.add(s);
      }
    }
  }

  // Se houver mais de uma moeda com movimentação, consolidação direta é indisponível
  const activeCurrencies = currencyKeys.filter(
    (k) => summaries[k].totalContracted > 0 || summaries[k].totalPayableEffective > 0 || summaries[k].cashReceivedRealized > 0 || summaries[k].cashPaidRealized > 0
  );

  let globalConsolidationStatus: "indisponivel" | "parcial_provisorio" | "consolidado" = "indisponivel";
  let globalConsolidationMessage = "";

  if (activeCurrencies.length <= 1) {
    const singleCurr = activeCurrencies[0];
    if (singleCurr) {
      globalConsolidationStatus = summaries[singleCurr].resultStatus;
      globalConsolidationMessage = summaries[singleCurr].resultMessage;
    } else {
      globalConsolidationStatus = "indisponivel";
      globalConsolidationMessage = "Nenhuma movimentação financeira no período selecionado.";
    }
  } else {
    globalConsolidationStatus = "indisponivel";
    globalConsolidationMessage =
      `Resultado consolidado global indisponível — conversão pendente entre moedas distintas (${activeCurrencies.join(", ")}). Não é permitido somar valores de moedas diferentes diretamente. Consulte os painéis segregados por moeda abaixo.`;
  }

  return {
    byCurrency: summaries,
    currencies: currencyKeys,
    totalEligibleContracts,
    totalPartialContracts,
    totalPaidContracts,
    totalSuppliersWithPending: globalSuppliersWithPending.size,
    totalUnknownCosts,
    totalAwaitingApprovalCosts,
    globalConsolidationStatus,
    globalConsolidationMessage,
  };
}

// =============================================================================
// FUNÇÕES AUXILIARES DE FILTRAGEM
// =============================================================================

/**
 * Aplica critérios de filtragem coerentes por domínio temporal e dimensional.
 */
export function filterFinancialData(params: {
  contracts: Array<Partial<ClientReceivable> & { id: string; total_amount?: number; currency?: string; status?: string; client_paid_amount?: number; seller_name?: string; sale_date?: string; created_at?: string; finalized_at?: string }>;
  clientEntries: ClientPaymentEntry[];
  payables: SupplierPayable[];
  supplierEntries: SupplierPaymentEntry[];
  filters: FinancialFilters;
}) {
  const { contracts, clientEntries, payables, supplierEntries, filters } = params;
  const { startDate, endDate, contractStatus, sellerName, supplierId, currency } = filters;

  // 1. Mapeamento de contratos relacionados ao fornecedor (quando filtrado por fornecedor)
  const contractsWithSupplier = new Set(
    supplierId && supplierId !== "todos"
      ? payables.filter((p) => p.supplier_id === supplierId).map((p) => p.contract_id)
      : []
  );

  // 2. Filtrar contratos (Fato gerador: Data da Venda)
  const filteredContracts = contracts.filter((c) => {
    if (currency && currency !== "todas" && c.currency?.toUpperCase() !== currency.toUpperCase()) {
      return false;
    }
    if (contractStatus && contractStatus !== "todos" && c.status !== contractStatus) {
      return false;
    }
    if (sellerName && sellerName !== "todos" && c.seller_name !== sellerName) {
      return false;
    }
    if (supplierId && supplierId !== "todos" && !contractsWithSupplier.has(c.id)) {
      return false;
    }
    const rawDate = c.sale_date || c.finalized_at || c.created_at;
    const cDate = rawDate ? rawDate.split("T")[0] : null;
    if (startDate && (!cDate || cDate < startDate)) {
      return false;
    }
    if (endDate && (!cDate || cDate > endDate)) {
      return false;
    }
    return true;
  });

  const filteredContractIds = new Set(filteredContracts.map((c) => c.id));

  // 3. Filtrar recebimentos de clientes (Fato gerador: Data do Recebimento)
  const filteredClientEntries = clientEntries.filter((ce) => {
    if (ce.is_reversed) return false;
    if (
      currency &&
      currency !== "todas" &&
      ce.received_currency?.toUpperCase() !== currency.toUpperCase() &&
      ce.contract_currency?.toUpperCase() !== currency.toUpperCase()
    ) {
      return false;
    }
    const rawDate = ce.payment_date || ce.created_at;
    const eDate = rawDate ? rawDate.split("T")[0] : null;
    if (startDate && (!eDate || eDate < startDate)) {
      return false;
    }
    if (endDate && (!eDate || eDate > endDate)) {
      return false;
    }
    // Vinculação com os contratos que passaram nos filtros de vendedor, status ou fornecedor
    if (
      (sellerName && sellerName !== "todos") ||
      (contractStatus && contractStatus !== "todos") ||
      (supplierId && supplierId !== "todos")
    ) {
      if (!filteredContractIds.has(ce.contract_id)) {
        return false;
      }
    }
    return true;
  });

  // 4. Filtrar contas a pagar (Fato gerador: Data do Serviço / Competência Operacional)
  const filteredPayables = payables.filter((p) => {
    if (p.payment_status === "cancelado") return false;
    if (currency && currency !== "todas" && p.currency?.toUpperCase() !== currency.toUpperCase()) {
      return false;
    }
    if (supplierId && supplierId !== "todos" && p.supplier_id !== supplierId) {
      return false;
    }
    // Vinculação com os contratos do vendedor ou status filtrado
    if (
      (sellerName && sellerName !== "todos") ||
      (contractStatus && contractStatus !== "todos")
    ) {
      if (!filteredContractIds.has(p.contract_id)) {
        return false;
      }
    }
    const rawDate = p.service_date || p.created_at;
    const sDate = rawDate ? rawDate.split("T")[0] : null;
    if (startDate && (!sDate || sDate < startDate)) {
      return false;
    }
    if (endDate && (!sDate || sDate > endDate)) {
      return false;
    }
    return true;
  });

  const filteredPayableIds = new Set(filteredPayables.map((p) => p.id));

  // 5. Filtrar pagamentos a fornecedores (Fato gerador: Data do Pagamento / Liquidação)
  const filteredSupplierEntries = supplierEntries.filter((se) => {
    if (se.is_reversed) return false;
    if (currency && currency !== "todas" && se.currency?.toUpperCase() !== currency.toUpperCase()) {
      return false;
    }
    if (supplierId && supplierId !== "todos" && se.supplier_id !== supplierId && !filteredPayableIds.has(se.payable_id)) {
      return false;
    }
    // Se houve filtro de vendedor ou status, o pagamento deve pertencer a uma obrigação do escopo
    if (
      (sellerName && sellerName !== "todos") ||
      (contractStatus && contractStatus !== "todos")
    ) {
      if (!filteredPayableIds.has(se.payable_id)) {
        return false;
      }
    }
    const rawDate = se.payment_date || se.created_at;
    const pDate = rawDate ? rawDate.split("T")[0] : null;
    if (startDate && (!pDate || pDate < startDate)) {
      return false;
    }
    if (endDate && (!pDate || pDate > endDate)) {
      return false;
    }
    return true;
  });

  return {
    filteredContracts,
    filteredClientEntries,
    filteredPayables,
    filteredSupplierEntries,
  };
}

/**
 * Arredonda valor para 2 casas decimais com precisão financeira.
 */
function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}
