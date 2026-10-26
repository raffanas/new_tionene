/**
 * TESTES AUTOMATIZADOS — TAREFA 22: PAINEL FINANCEIRO CONSOLIDADO E RESULTADO OPERACIONAL
 * Arquivo: scripts/test_consolidated_finance.ts
 *
 * Validação rigorosa dos cenários e regras da Tarefa 22:
 * 1. Contratos não duplicados (idempotência e integridade de chave).
 * 2. Recebimentos parciais de clientes corretamente somados.
 * 3. Estornos excluídos dos totais de caixa e das somas ativas.
 * 4. Pagamentos parciais de fornecedores calculados corretamente.
 * 5. Custos NULL e sob consulta tratados como desconhecidos (NUNCA como zero).
 * 6. Moedas segregadas estritamente (USD, BRL, MXN nunca somadas diretamente).
 * 7. Resultado global indisponível sem base cambial explícita.
 * 8. Permissões administrativas (Admin autorizado a visualizar custos e margens).
 * 9. Ausência absoluta de exposição de custos de fornecedores e margens para vendedores.
 */

import {
  calculateConsolidatedFinancialKpis,
  filterFinancialData,
  ConsolidatedFinancialSummary,
} from "../src/lib/financial/consolidatedFinance.ts";
import {
  hasPermission,
  canAccessRoute,
  ROUTE_ACCESS_RULES,
  ROLE_PERMISSIONS,
} from "../src/lib/auth/permissions.ts";
import type {
  SupplierPayable,
  SupplierPaymentEntry,
  ClientPaymentEntry,
} from "../src/types/operational";

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

async function runConsolidatedFinanceTests() {
  console.log("=================================================================");
  console.log("INICIANDO TESTES AUTOMATIZADOS — PAINEL FINANCEIRO CONSOLIDADO");
  console.log("=================================================================\n");

  // ---------------------------------------------------------------------------
  // 1. CONTRATOS NÃO DUPLICADOS (DESDUPLICAÇÃO POR ID)
  // ---------------------------------------------------------------------------
  console.log("--- 1. Contratos Não Duplicados por Identificador Único ---");
  {
    const duplicateContracts = [
      {
        id: "ctr-001",
        contract_number: "TN-2026-001",
        total_amount: 1000.0,
        currency: "USD",
        status: "finalizado",
        client_paid_amount: 500.0,
      },
      {
        id: "ctr-001", // Duplicata intencional (ex: múltiplos itens ou joins)
        contract_number: "TN-2026-001",
        total_amount: 1000.0,
        currency: "USD",
        status: "finalizado",
        client_paid_amount: 500.0,
      },
      {
        id: "ctr-002",
        contract_number: "TN-2026-002",
        total_amount: 2000.0,
        currency: "USD",
        status: "finalizado",
        client_paid_amount: 1000.0,
      },
    ];

    const summary = calculateConsolidatedFinancialKpis({
      contracts: duplicateContracts,
      clientEntries: [],
      payables: [],
      supplierEntries: [],
    });

    const usd = summary.byCurrency["USD"];
    assert(usd.contractsEligibleCount === 2, "Desduplica contratos por id (2 contratos únicos)");
    assert(usd.totalContracted === 3000.0, "Total contratado não sofre duplicação (1000 + 2000 = 3000 USD)");
    assert(usd.totalReceivedFromClients === 1500.0, "Total recebido não sofre duplicação (500 + 1000 = 1500 USD)");
    assert(usd.totalPendingFromClients === 1500.0, "Saldo a receber não sofre duplicação (1500 USD)");
  }

  // ---------------------------------------------------------------------------
  // 2. RECEBIMENTOS PARCIAIS DE CLIENTES CORRETAMENTE SOMADOS
  // ---------------------------------------------------------------------------
  console.log("\n--- 2. Recebimentos Parciais de Clientes Somados com Precisão ---");
  {
    const contracts = [
      {
        id: "ctr-partial-1",
        contract_number: "TN-2026-101",
        total_amount: 1000.0,
        currency: "USD",
        status: "finalizado",
        client_paid_amount: 300.0, // Parcial (30%)
      },
      {
        id: "ctr-partial-2",
        contract_number: "TN-2026-102",
        total_amount: 1500.0,
        currency: "USD",
        status: "finalizado",
        client_paid_amount: 750.0, // Parcial (50%)
      },
      {
        id: "ctr-paid-1",
        contract_number: "TN-2026-103",
        total_amount: 500.0,
        currency: "USD",
        status: "finalizado",
        client_paid_amount: 500.0, // Quitado (100%)
      },
    ];

    const summary = calculateConsolidatedFinancialKpis({
      contracts,
      clientEntries: [],
      payables: [],
      supplierEntries: [],
    });

    const usd = summary.byCurrency["USD"];
    assert(usd.contractsPartialCount === 2, "Identifica exatamente 2 contratos com recebimento parcial");
    assert(usd.contractsPaidCount === 1, "Identifica exatamente 1 contrato quitado");
    assert(usd.totalReceivedFromClients === 1550.0, "Soma de recebimentos parciais e integrais: 300 + 750 + 500 = 1550 USD");
    assert(usd.totalPendingFromClients === 1450.0, "Saldo pendente restante: 3000 - 1550 = 1450 USD");
  }

  // ---------------------------------------------------------------------------
  // 3. ESTORNOS EXCLUÍDOS DOS TOTAIS REALIZADOS
  // ---------------------------------------------------------------------------
  console.log("\n--- 3. Exclusão Estrita de Lançamentos Estornados ---");
  {
    const clientEntries: ClientPaymentEntry[] = [
      {
        id: "entry-c-1",
        contract_id: "ctr-001",
        amount_received: 500.0,
        received_currency: "USD",
        exchange_rate: 1.0,
        amortized_amount: 500.0,
        contract_currency: "USD",
        payment_date: "2026-10-10",
        payment_method: "cartao_credito",
        is_reversed: false, // Ativo
        created_at: "2026-10-10T12:00:00Z",
        updated_at: "2026-10-10T12:00:00Z",
      },
      {
        id: "entry-c-2-reversed",
        contract_id: "ctr-001",
        amount_received: 400.0,
        received_currency: "USD",
        exchange_rate: 1.0,
        amortized_amount: 400.0,
        contract_currency: "USD",
        payment_date: "2026-10-11",
        payment_method: "pix",
        is_reversed: true, // ESTORNADO!
        reversal_reason: "TED cancelada pelo cliente",
        created_at: "2026-10-11T12:00:00Z",
        updated_at: "2026-10-12T12:00:00Z",
      },
    ];

    const supplierEntries: SupplierPaymentEntry[] = [
      {
        id: "entry-s-1",
        payable_id: "pay-001",
        amount: 200.0,
        currency: "USD",
        payment_date: "2026-10-12",
        payment_method: "transferencia",
        is_reversed: false, // Ativo
        created_at: "2026-10-12T12:00:00Z",
        updated_at: "2026-10-12T12:00:00Z",
      },
      {
        id: "entry-s-2-reversed",
        payable_id: "pay-001",
        amount: 300.0,
        currency: "USD",
        payment_date: "2026-10-13",
        payment_method: "transferencia",
        is_reversed: true, // ESTORNADO!
        reversal_reason: "Erro de duplicidade de TED",
        created_at: "2026-10-13T12:00:00Z",
        updated_at: "2026-10-14T12:00:00Z",
      },
    ];

    const summary = calculateConsolidatedFinancialKpis({
      contracts: [],
      clientEntries,
      payables: [],
      supplierEntries,
    });

    const usd = summary.byCurrency["USD"];
    assert(usd.cashReceivedRealized === 500.0, "Entradas realizadas em caixa consideram apenas o lançamento ativo de 500 USD (exclui 400 USD estornado)");
    assert(usd.cashPaidRealized === 200.0, "Saídas realizadas em caixa consideram apenas o pagamento ativo de 200 USD (exclui 300 USD estornado)");
    assert(usd.netCashFlowRealized === 300.0, "Fluxo de caixa realizado líquido: 500 - 200 = 300 USD");
  }

  // ---------------------------------------------------------------------------
  // 4. PAGAMENTOS PARCIAIS DE FORNECEDORES
  // ---------------------------------------------------------------------------
  console.log("\n--- 4. Pagamentos Parciais a Fornecedores & Saldo Pendente ---");
  {
    const payables: SupplierPayable[] = [
      {
        id: "pay-01",
        contract_id: "ctr-001",
        contract_item_id: "item-01",
        supplier_id: "sup-01",
        supplier_name: "Receptivo Caribe",
        service_date: "2026-10-20",
        description: "Catamarã Isla Mujeres",
        currency: "USD",
        amount_estimated: 800.0,
        amount_final: 800.0, // Aprovado
        is_unknown_cost: false,
        payment_status: "parcialmente_pago",
        paid_amount: 300.0, // Pago parcial
        created_at: "2026-10-01T10:00:00Z",
        updated_at: "2026-10-20T10:00:00Z",
      },
      {
        id: "pay-02",
        contract_id: "ctr-002",
        contract_item_id: "item-02",
        supplier_id: "sup-02",
        supplier_name: "Xcaret Parks",
        service_date: "2026-10-21",
        description: "Xcaret Plus",
        currency: "USD",
        amount_estimated: 600.0,
        amount_final: 600.0, // Aprovado
        is_unknown_cost: false,
        payment_status: "pago",
        paid_amount: 600.0, // Quitado
        created_at: "2026-10-01T10:00:00Z",
        updated_at: "2026-10-21T10:00:00Z",
      },
    ];

    const summary = calculateConsolidatedFinancialKpis({
      contracts: [],
      clientEntries: [],
      payables,
      supplierEntries: [],
    });

    const usd = summary.byCurrency["USD"];
    assert(usd.totalPayableApproved === 1400.0, "Total de custos aprovados: 800 + 600 = 1400 USD");
    assert(usd.totalPaidToSuppliers === 900.0, "Total pago a fornecedores: 300 + 600 = 900 USD");
    assert(usd.totalPendingToSuppliers === 500.0, "Saldo pendente com fornecedores: 1400 - 900 = 500 USD");
    assert(usd.suppliersWithPendingCount === 1, "Exatamente 1 fornecedor com pagamento pendente ('Receptivo Caribe')");
  }

  // ---------------------------------------------------------------------------
  // 5. CUSTOS NULL / SOB CONSULTA TRATADOS COMO DESCONHECIDOS
  // ---------------------------------------------------------------------------
  console.log("\n--- 5. Custos NULL / Sob Consulta Tratados Como Desconhecidos ---");
  {
    const payablesWithUnknown: SupplierPayable[] = [
      {
        id: "pay-known",
        contract_id: "ctr-001",
        contract_item_id: "item-01",
        service_date: "2026-10-22",
        description: "Chichen Itza Regular",
        currency: "USD",
        amount_estimated: 400.0,
        amount_final: 400.0,
        is_unknown_cost: false,
        payment_status: "aprovado",
        paid_amount: 0.0,
        created_at: "2026-10-01T10:00:00Z",
        updated_at: "2026-10-01T10:00:00Z",
      },
      {
        id: "pay-unknown",
        contract_id: "ctr-001",
        contract_item_id: "item-02",
        service_date: "2026-10-23",
        description: "Passeio Privativo de Iate (Tarifa Sob Consulta)",
        currency: "USD",
        amount_estimated: null, // NULL!
        amount_final: null,     // NULL!
        is_unknown_cost: true,  // Marcado expressamente como desconhecido
        payment_status: "aguardando_aprovacao",
        paid_amount: 0.0,
        created_at: "2026-10-01T10:00:00Z",
        updated_at: "2026-10-01T10:00:00Z",
      },
    ];

    const contracts = [
      {
        id: "ctr-001",
        contract_number: "TN-2026-200",
        total_amount: 1500.0,
        currency: "USD",
        status: "finalizado",
        client_paid_amount: 1500.0,
      },
    ];

    const summary = calculateConsolidatedFinancialKpis({
      contracts,
      clientEntries: [],
      payables: payablesWithUnknown,
      supplierEntries: [],
    });

    const usd = summary.byCurrency["USD"];
    assert(usd.unknownCostCount === 1, "Registra 1 custo desconhecido / sob consulta");
    assert(usd.resultStatus === "parcial_provisorio", "Resultado é classificado como parcial_provisorio devido ao custo desconhecido");
    assert(usd.resultMessage.includes("custo(s) pendente(s)"), "Mensagem de alerta explícita informa custos pendentes ou sob consulta");
    assert(usd.totalPayableApproved === 400.0, "Custo NULL não foi assumido como zero e não distorceu custos aprovados (400 USD)");
  }

  // ---------------------------------------------------------------------------
  // 6. SEGREGAÇÃO CAMBIAL DE MOEDAS (USD, BRL, MXN)
  // ---------------------------------------------------------------------------
  console.log("\n--- 6. Segregação Cambial Rigorosa (NUNCA Somar Moedas Diferentes) ---");
  {
    const mixedContracts = [
      {
        id: "ctr-usd",
        contract_number: "TN-USD-01",
        total_amount: 1000.0,
        currency: "USD",
        status: "finalizado",
        client_paid_amount: 600.0,
      },
      {
        id: "ctr-brl",
        contract_number: "TN-BRL-01",
        total_amount: 5000.0,
        currency: "BRL",
        status: "finalizado",
        client_paid_amount: 2000.0,
      },
    ];

    const mixedPayables: SupplierPayable[] = [
      {
        id: "pay-mxn",
        contract_id: "ctr-usd",
        contract_item_id: "item-01",
        service_date: "2026-10-24",
        description: "Van Receptivo Cancun",
        currency: "MXN",
        amount_estimated: 3500.0,
        amount_final: 3500.0,
        is_unknown_cost: false,
        payment_status: "aprovado",
        paid_amount: 1000.0,
        created_at: "2026-10-01T10:00:00Z",
        updated_at: "2026-10-01T10:00:00Z",
      },
    ];

    const summary = calculateConsolidatedFinancialKpis({
      contracts: mixedContracts,
      clientEntries: [],
      payables: mixedPayables,
      supplierEntries: [],
    });

    assert(summary.byCurrency["USD"] !== undefined, "Existe sumário separado para USD");
    assert(summary.byCurrency["BRL"] !== undefined, "Existe sumário separado para BRL");
    assert(summary.byCurrency["MXN"] !== undefined, "Existe sumário separado para MXN");

    assert(summary.byCurrency["USD"].totalContracted === 1000.0, "USD Total Contratado: 1000 USD isolado");
    assert(summary.byCurrency["BRL"].totalContracted === 5000.0, "BRL Total Contratado: 5000 BRL isolado");
    assert(summary.byCurrency["MXN"].totalPayableApproved === 3500.0, "MXN Custos Aprovados: 3500 MXN isolado");

    assert((summary as any)["totalMoney"] === undefined, "NÃO existe somatório financeiro somando USD + BRL + MXN");
  }

  // ---------------------------------------------------------------------------
  // 7. RESULTADO GLOBAL INDISPONÍVEL SEM CONVERSÃO EXPLÍCITA
  // ---------------------------------------------------------------------------
  console.log("\n--- 7. Diagnóstico de Resultado Global Indisponível sem Conversão ---");
  {
    const mixedContracts = [
      {
        id: "ctr-usd",
        contract_number: "TN-USD-01",
        total_amount: 1000.0,
        currency: "USD",
        status: "finalizado",
      },
      {
        id: "ctr-brl",
        contract_number: "TN-BRL-01",
        total_amount: 5000.0,
        currency: "BRL",
        status: "finalizado",
      },
    ];

    const summary = calculateConsolidatedFinancialKpis({
      contracts: mixedContracts,
      clientEntries: [],
      payables: [],
      supplierEntries: [],
    });

    assert(summary.globalConsolidationStatus === "indisponivel", "Consolidação global marcada como 'indisponivel' quando há múltiplas moedas");
    assert(
      summary.globalConsolidationMessage.includes("Resultado consolidado global indisponível — conversão pendente"),
      "Exibe mensagem formal orientando o usuário a consultar os painéis segregados por moeda"
    );
  }

  // ---------------------------------------------------------------------------
  // 8. PERMISSÕES ADMINISTRATIVAS E ISOLAMENTO DE ACESSO
  // ---------------------------------------------------------------------------
  console.log("\n--- 8. Autorização Administrativa no Painel Consolidado ---");
  {
    const adminCanAccess = canAccessRoute("admin", "/admin/financeiro");
    assert(adminCanAccess === true, "Administrador tem acesso liberado a /admin/financeiro");

    const sellerCanAccess = canAccessRoute("seller", "/admin/financeiro");
    assert(sellerCanAccess === false, "Vendedor tem acesso estritamente bloqueado a /admin/financeiro");
  }

  // ---------------------------------------------------------------------------
  // 9. AUSÊNCIA DE EXPOSIÇÃO DE CUSTOS DE FORNECEDORES PARA VENDEDORES
  // ---------------------------------------------------------------------------
  console.log("\n--- 9. Ausência Absoluta de Permissões de Custos para Vendedores ---");
  {
    const sellerHasSupplierCostsView = hasPermission("seller", "supplier_costs:view");
    assert(sellerHasSupplierCostsView === false, "Vendedor NÃO possui permissão 'supplier_costs:view'");

    const sellerHasSupplierCostsManage = hasPermission("seller", "supplier_costs:manage");
    assert(sellerHasSupplierCostsManage === false, "Vendedor NÃO possui permissão 'supplier_costs:manage'");

    const sellerHasSupplierPayablesView = hasPermission("seller", "supplier_payments:view");
    assert(sellerHasSupplierPayablesView === false, "Vendedor NÃO possui permissão 'supplier_payments:view'");

    const adminHasSupplierCostsView = hasPermission("admin", "supplier_costs:view");
    assert(adminHasSupplierCostsView === true, "Administrador possui permissão 'supplier_costs:view'");
  }

  // ---------------------------------------------------------------------------
  // 10. VALIDAÇÃO FUNCIONAL DOS FILTROS (PERÍODO, VENDEDOR, FORNECEDOR, STATUS E MOEDA)
  // ---------------------------------------------------------------------------
  console.log("\n--- 10. Validação Funcional dos Filtros & Coerência Temporal ---");
  {
    const contractsDataset = [
      {
        id: "ctr-out-seller1",
        contract_number: "TN-OUT-01",
        total_amount: 1000.0,
        currency: "USD",
        status: "finalizado",
        seller_name: "Pedro Vendas",
        client_paid_amount: 1000.0,
        sale_date: "2026-10-05",
      },
      {
        id: "ctr-out-seller2",
        contract_number: "TN-OUT-02",
        total_amount: 2500.0,
        currency: "USD",
        status: "emitido",
        seller_name: "Camila Vendas",
        client_paid_amount: 500.0,
        sale_date: "2026-10-15",
      },
      {
        id: "ctr-nov-seller1",
        contract_number: "TN-NOV-01",
        total_amount: 3000.0,
        currency: "BRL",
        status: "finalizado",
        seller_name: "Pedro Vendas",
        client_paid_amount: 3000.0,
        sale_date: "2026-11-02",
      },
    ];

    const payablesDataset: SupplierPayable[] = [
      {
        id: "pay-s1-supA",
        contract_id: "ctr-out-seller1",
        contract_item_id: "item-01",
        supplier_id: "sup-A",
        supplier_name: "Receptivo A",
        service_date: "2026-10-08",
        description: "Catamarã",
        currency: "USD",
        amount_final: 400.0,
        is_unknown_cost: false,
        payment_status: "pago",
        paid_amount: 400.0,
        created_at: "2026-10-05T10:00:00Z",
        updated_at: "2026-10-05T10:00:00Z",
      },
      {
        id: "pay-s2-supB",
        contract_id: "ctr-out-seller2",
        contract_item_id: "item-02",
        supplier_id: "sup-B",
        supplier_name: "Receptivo B",
        service_date: "2026-10-20",
        description: "Mergulho",
        currency: "USD",
        amount_final: 900.0,
        is_unknown_cost: false,
        payment_status: "aprovado",
        paid_amount: 0.0,
        created_at: "2026-10-15T10:00:00Z",
        updated_at: "2026-10-15T10:00:00Z",
      },
    ];

    const clientEntriesDataset: ClientPaymentEntry[] = [
      {
        id: "ce-1",
        contract_id: "ctr-out-seller1",
        amount_received: 1000.0,
        received_currency: "USD",
        exchange_rate: 1.0,
        amortized_amount: 1000.0,
        contract_currency: "USD",
        payment_date: "2026-10-06",
        payment_method: "cartao_credito",
        is_reversed: false,
        created_at: "2026-10-06T10:00:00Z",
        updated_at: "2026-10-06T10:00:00Z",
      },
      {
        id: "ce-2",
        contract_id: "ctr-out-seller2",
        amount_received: 500.0,
        received_currency: "USD",
        exchange_rate: 1.0,
        amortized_amount: 500.0,
        contract_currency: "USD",
        payment_date: "2026-10-16",
        payment_method: "pix",
        is_reversed: false,
        created_at: "2026-10-16T10:00:00Z",
        updated_at: "2026-10-16T10:00:00Z",
      },
      {
        id: "ce-3",
        contract_id: "ctr-nov-seller1",
        amount_received: 3000.0,
        received_currency: "BRL",
        exchange_rate: 1.0,
        amortized_amount: 3000.0,
        contract_currency: "BRL",
        payment_date: "2026-11-03",
        payment_method: "pix",
        is_reversed: false,
        created_at: "2026-11-03T10:00:00Z",
        updated_at: "2026-11-03T10:00:00Z",
      },
    ];

    const supplierEntriesDataset: SupplierPaymentEntry[] = [
      {
        id: "se-1",
        payable_id: "pay-s1-supA",
        supplier_id: "sup-A",
        amount: 400.0,
        currency: "USD",
        payment_date: "2026-10-09",
        payment_method: "transferencia",
        is_reversed: false,
        created_at: "2026-10-09T10:00:00Z",
        updated_at: "2026-10-09T10:00:00Z",
      },
    ];

    // 10.1 Teste: Filtro por Período (apenas Outubro/2026)
    const filteredOct = filterFinancialData({
      contracts: contractsDataset,
      clientEntries: clientEntriesDataset,
      payables: payablesDataset,
      supplierEntries: supplierEntriesDataset,
      filters: {
        startDate: "2026-10-01",
        endDate: "2026-10-31",
      },
    });

    const summaryOct = calculateConsolidatedFinancialKpis({
      contracts: filteredOct.filteredContracts,
      clientEntries: filteredOct.filteredClientEntries,
      payables: filteredOct.filteredPayables,
      supplierEntries: filteredOct.filteredSupplierEntries,
    });

    assert(filteredOct.filteredContracts.length === 2, "Filtro de período exclui contrato de Novembro (2 contratos em Outubro)");
    assert(summaryOct.byCurrency["USD"].totalContracted === 3500.0, "Total contratado em Outubro: 3500 USD");
    assert(summaryOct.byCurrency["BRL"] === undefined, "Contrato em BRL de Novembro não entra nos indicadores de Outubro");

    // 10.2 Teste: Filtro por Vendedor ("Pedro Vendas")
    const filteredPedro = filterFinancialData({
      contracts: contractsDataset,
      clientEntries: clientEntriesDataset,
      payables: payablesDataset,
      supplierEntries: supplierEntriesDataset,
      filters: {
        sellerName: "Pedro Vendas",
      },
    });

    const summaryPedro = calculateConsolidatedFinancialKpis({
      contracts: filteredPedro.filteredContracts,
      clientEntries: filteredPedro.filteredClientEntries,
      payables: filteredPedro.filteredPayables,
      supplierEntries: filteredPedro.filteredSupplierEntries,
    });

    assert(filteredPedro.filteredContracts.length === 2, "Filtro por vendedor 'Pedro Vendas' retorna apenas seus 2 contratos");
    assert(summaryPedro.byCurrency["USD"].totalContracted === 1000.0, "USD contratado de Pedro Vendas é exatamente 1000 USD (exclui 2500 USD de Camila)");
    assert(filteredPedro.filteredPayables.length === 1, "Obrigações a pagar filtradas contêm apenas o passeio vendido por Pedro Vendas");
    assert(summaryPedro.byCurrency["USD"].totalPayableApproved === 400.0, "Custos aprovados de Pedro Vendas são 400 USD (exclui 900 USD de Camila)");

    // 10.3 Teste: Filtro por Fornecedor ("Receptivo B" / sup-B)
    const filteredSupB = filterFinancialData({
      contracts: contractsDataset,
      clientEntries: clientEntriesDataset,
      payables: payablesDataset,
      supplierEntries: supplierEntriesDataset,
      filters: {
        supplierId: "sup-B",
      },
    });

    const summarySupB = calculateConsolidatedFinancialKpis({
      contracts: filteredSupB.filteredContracts,
      clientEntries: filteredSupB.filteredClientEntries,
      payables: filteredSupB.filteredPayables,
      supplierEntries: filteredSupB.filteredSupplierEntries,
    });

    assert(filteredSupB.filteredPayables.length === 1, "Filtro por fornecedor 'sup-B' retorna exatamente 1 obrigação");
    assert(summarySupB.byCurrency["USD"].totalPayableApproved === 900.0, "Custos aprovados de sup-B são 900 USD (exclui 400 USD de sup-A)");
    assert(filteredSupB.filteredContracts.length === 1, "Contratos filtrados contêm apenas o contrato que contratou sup-B");

    // 10.4 Teste: Filtro por Status do Contrato ("finalizado")
    const filteredFinalizados = filterFinancialData({
      contracts: contractsDataset,
      clientEntries: clientEntriesDataset,
      payables: payablesDataset,
      supplierEntries: supplierEntriesDataset,
      filters: {
        contractStatus: "finalizado",
      },
    });

    const summaryFinalizados = calculateConsolidatedFinancialKpis({
      contracts: filteredFinalizados.filteredContracts,
      clientEntries: filteredFinalizados.filteredClientEntries,
      payables: filteredFinalizados.filteredPayables,
      supplierEntries: filteredFinalizados.filteredSupplierEntries,
    });

    assert(filteredFinalizados.filteredContracts.length === 2, "Filtro por status 'finalizado' exclui contrato com status 'emitido'");
    assert(summaryFinalizados.byCurrency["USD"].totalContracted === 1000.0, "USD contratado apenas de finalizados: 1000 USD");

    // 10.5 Teste: Filtro por Moeda ("USD")
    const filteredUSD = filterFinancialData({
      contracts: contractsDataset,
      clientEntries: clientEntriesDataset,
      payables: payablesDataset,
      supplierEntries: supplierEntriesDataset,
      filters: {
        currency: "USD",
      },
    });

    const summaryUSD = calculateConsolidatedFinancialKpis({
      contracts: filteredUSD.filteredContracts,
      clientEntries: filteredUSD.filteredClientEntries,
      payables: filteredUSD.filteredPayables,
      supplierEntries: filteredUSD.filteredSupplierEntries,
    });

    assert(summaryUSD.currencies.length === 1 && summaryUSD.currencies[0] === "USD", "Filtro de moeda 'USD' isola exclusivamente USD");
    assert(summaryUSD.byCurrency["BRL"] === undefined, "Moeda BRL foi completamente excluída do resultado filtrado");
  }

  // ===========================================================================
  // RESUMO DOS TESTES
  // ===========================================================================
  console.log("\n=================================================================");
  console.log(`RESULTADO FINAL: ${testsPassed} PASSOU, ${testsFailed} FALHOU`);
  console.log("=================================================================");

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runConsolidatedFinanceTests().catch((err) => {
  console.error("Erro fatal ao rodar testes consolidados:", err);
  process.exit(1);
});
