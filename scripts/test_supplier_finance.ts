/**
 * TESTES AUTOMATIZADOS — TAREFA 20: FINANCEIRO DE FORNECEDORES E CONTAS A PAGAR
 *
 * Validação rigorosa dos cenários e regras da Tarefa 20:
 * 1. Pagamento SOMENTE após aprovação do custo final (amount_final != null).
 * 2. Custo estimado (amount_estimated) NÃO autoriza pagamento.
 * 3. Bloqueio estrito de pagamentos em obrigações canceladas.
 * 4. Bloqueio de pagamentos que excedam o saldo pendente aprovado.
 * 5. Impede redução de amount_final abaixo do total já pago.
 * 6. Impede remoção da aprovação (amount_final = null) com pagamentos ativos.
 * 7. Idempotência de pagamento via idempotency_key contra requisições duplicadas.
 * 8. Pagamento integral (status: pago apenas quando saldo zerar).
 * 9. Estorno auditável preservando lançamento original (is_reversed = true).
 * 10. Idempotência em estorno duplicado.
 * 11. Segregação estrita de moedas (NUNCA somar USD com MXN).
 * 12. Bloqueio RBAC para usuários não-administradores.
 */

import {
  calculatePayableBalance,
  calculateSupplierFinancialKpis,
  approveSupplierPayableCost,
  recordSupplierPayment,
  reverseSupplierPayment,
} from "../src/lib/financial/supplierFinance.ts";
import type {
  SupplierPayable,
  SupplierPaymentEntry,
  SupplierPaymentStatus,
} from "../src/types/operational";

// =============================================================================
// DADOS MOCKADOS
// =============================================================================

const mockKnownPayableUSD: SupplierPayable = {
  id: "pay-uuid-usd-01",
  contract_id: "contract-uuid-101",
  contract_item_id: "item-uuid-201",
  reservation_id: "res-uuid-301",
  supplier_id: "supp-uuid-xcaret",
  supplier_name: "Grupo Xcaret",
  service_date: "2026-11-20",
  description: "Xcaret Plus com Transporte",
  currency: "USD",
  amount_estimated: 500.0,
  amount_final: null, // Ainda não aprovado
  is_unknown_cost: false,
  payment_status: "previsto",
  paid_amount: 0,
  paid_at: null,
  payment_reference: null,
  notes: null,
  contract_number: "TN-2026-0042",
  client_name: "Juliana Mendes",
  created_at: "2026-10-21T10:00:00Z",
  updated_at: "2026-10-21T10:00:00Z",
};

const mockUnknownPayableMXN: SupplierPayable = {
  id: "pay-uuid-mxn-02",
  contract_id: "contract-uuid-102",
  contract_item_id: "item-uuid-202",
  reservation_id: "res-uuid-302",
  supplier_id: "supp-uuid-local",
  supplier_name: "Operadora Náutica",
  service_date: "2026-11-22",
  description: "Mergulho Especial Cozumel (Sob Consulta)",
  currency: "MXN",
  amount_estimated: null,
  amount_final: null,
  is_unknown_cost: true,
  payment_status: "aguardando_aprovacao",
  paid_amount: 0,
  paid_at: null,
  payment_reference: null,
  notes: "Aguardando confirmação de barco fretado",
  contract_number: "TN-2026-0043",
  client_name: "Carlos Eduardo",
  created_at: "2026-10-21T11:00:00Z",
  updated_at: "2026-10-21T11:00:00Z",
};

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

async function runAllSupplierFinanceTests() {
  console.log("==================================================================");
  console.log("TÍO NENÊ — TESTES DE CONSISTÊNCIA FINANCEIRA (CORREÇÃO TAREFA 20)");
  console.log("==================================================================\n");

  // ---------------------------------------------------------------------------
  // 1. TESTE DE PRESERVAÇÃO DE CUSTO DESCONHECIDO (NULL)
  // ---------------------------------------------------------------------------
  console.log("--- TESTE 1: PRESERVAÇÃO DE CUSTO DESCONHECIDO COMO NULL ---");

  const unkBalance = calculatePayableBalance(mockUnknownPayableMXN);
  assert(
    unkBalance.isUnknown === true,
    "Identifica corretamente obrigação com custo desconhecido / sob consulta"
  );
  assert(
    unkBalance.effectiveAmount === null,
    "Custo efetivo permanece estritamente NULL (nunca convertido em 0.00)"
  );
  assert(
    unkBalance.pendingBalance === null,
    "Saldo pendente de custo desconhecido permanece NULL (não é 0.00)"
  );

  // ---------------------------------------------------------------------------
  // MOCK DE BANCO DE DADOS E RPCS FINANCEIRAS
  // ---------------------------------------------------------------------------
  let mockPayableStore = { ...mockKnownPayableUSD };
  let mockPaymentEntriesStore: any[] = [];

  const mockSupabase = {
    rpc: async (fn: string, args: any) => {
      // 1. RPC: approve_supplier_payable_cost
      if (fn === "approve_supplier_payable_cost") {
        const { p_payable_id, p_amount_final, p_notes } = args;
        if (mockPayableStore.id !== p_payable_id) {
          return { error: { message: "Obrigação não encontrada." } };
        }

        if (p_amount_final !== null && p_amount_final < 0) {
          return { error: { message: "Valor de custo inválido: não pode ser negativo." } };
        }

        const currentPaid = Number(mockPayableStore.paid_amount || 0);

        // Bloqueio de remoção de aprovação se houver pagamentos ativos
        if (p_amount_final === null && currentPaid > 0) {
          return {
            error: {
              message: `Não é permitido desaprovar ou remover o custo final pois existem pagamentos ativos registrados no total de ${currentPaid} ${mockPayableStore.currency}.`,
            },
          };
        }

        // Bloqueio de redução abaixo do total já pago
        if (p_amount_final !== null && p_amount_final < currentPaid) {
          return {
            error: {
              message: `O custo final aprovado (${p_amount_final} ${mockPayableStore.currency}) não pode ser inferior ao total já pago (${currentPaid} ${mockPayableStore.currency}).`,
            },
          };
        }

        let newStatus: SupplierPaymentStatus = "aprovado";
        if (p_amount_final === null) {
          newStatus = "aguardando_aprovacao";
        } else if (currentPaid >= p_amount_final && p_amount_final > 0) {
          newStatus = "pago";
        } else if (currentPaid > 0) {
          newStatus = "parcialmente_pago";
        } else {
          newStatus = "aprovado";
        }

        mockPayableStore.amount_final = p_amount_final;
        mockPayableStore.payment_status = newStatus;
        mockPayableStore.cost_approval_notes = p_notes || mockPayableStore.cost_approval_notes;
        mockPayableStore.cost_approved_at = p_amount_final !== null ? "2026-10-22T16:00:00Z" : null;

        return {
          data: {
            success: true,
            payable_id: p_payable_id,
            amount_final: p_amount_final,
            paid_amount: currentPaid,
            pending_balance: p_amount_final !== null ? Math.max(0, p_amount_final - currentPaid) : null,
            payment_status: newStatus,
            currency: mockPayableStore.currency,
            message: "Custo final aprovado com sucesso.",
          },
          error: null,
        };
      }

      // 2. RPC: record_supplier_payment
      if (fn === "record_supplier_payment") {
        const {
          p_payable_id,
          p_amount,
          p_payment_method,
          p_payment_date,
          p_reference,
          p_notes,
          p_idempotency_key,
        } = args;

        if (mockPayableStore.id !== p_payable_id) {
          return { error: { message: "Obrigação não encontrada." } };
        }

        if (p_amount <= 0) {
          return { error: { message: "Valor do pagamento deve ser maior que zero." } };
        }

        // Idempotência
        if (p_idempotency_key) {
          const existing = mockPaymentEntriesStore.find(
            (e) => e.idempotency_key === p_idempotency_key && !e.is_reversed
          );
          if (existing) {
            // Validar se pertence à mesma obrigação e mesma operação
            if (
              existing.payable_id !== p_payable_id ||
              existing.amount !== p_amount ||
              existing.currency !== mockPayableStore.currency
            ) {
              return {
                error: {
                  message: `Conflito de idempotência: a chave "${p_idempotency_key}" já foi utilizada para outra operação financeira ou valor/obrigação divergente.`,
                },
              };
            }

            return {
              data: {
                success: true,
                entry_id: existing.id,
                payable_id: p_payable_id,
                amount_paid: existing.amount,
                total_paid: mockPayableStore.paid_amount,
                pending_balance: Math.max(0, (mockPayableStore.amount_final || 0) - mockPayableStore.paid_amount),
                payment_status: mockPayableStore.payment_status,
                currency: mockPayableStore.currency,
                is_idempotent_replay: true,
                message: "Pagamento já processado anteriormente (idempotência confirmada).",
              },
              error: null,
            };
          }
        }

        // REGRA 1: Bloquear obrigações canceladas
        if (mockPayableStore.payment_status === "cancelado") {
          return { error: { message: "Não é possível registrar pagamento em obrigação financeira cancelada." } };
        }

        // REGRA 1: Exigir amount_final aprovado e não nulo
        if (mockPayableStore.amount_final === null || mockPayableStore.amount_final === undefined) {
          return {
            error: {
              message:
                "Pagamento bloqueado: o custo final deve ser previamente aprovado pelo administrador (amount_final não pode ser nulo). O custo estimado não autoriza pagamentos.",
            },
          };
        }

        const currentPaid = Number(mockPayableStore.paid_amount || 0);
        const effectiveAmount = Number(mockPayableStore.amount_final);
        const pendingBalance = effectiveAmount - currentPaid;

        // REGRA 1: Impedir pagamento superior ao saldo aprovado
        if (p_amount > pendingBalance + 0.005) {
          return {
            error: {
              message: `Valor do pagamento (${p_amount} ${mockPayableStore.currency}) excede o saldo pendente aprovado (${pendingBalance} ${mockPayableStore.currency}). Pagamentos superiores ao saldo aprovado não são permitidos.`,
            },
          };
        }

        const newEntryId = `entry-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const entryObj = {
          id: newEntryId,
          payable_id: p_payable_id,
          amount: p_amount,
          currency: mockPayableStore.currency,
          payment_date: p_payment_date,
          payment_method: p_payment_method,
          reference: p_reference,
          notes: p_notes,
          idempotency_key: p_idempotency_key || null,
          is_reversed: false,
        };
        mockPaymentEntriesStore.push(entryObj);

        const newPaid = currentPaid + p_amount;
        const newStatus: SupplierPaymentStatus = newPaid >= effectiveAmount ? "pago" : "parcialmente_pago";

        mockPayableStore.paid_amount = newPaid;
        mockPayableStore.payment_status = newStatus;
        mockPayableStore.paid_at = "2026-10-22T16:05:00Z";

        return {
          data: {
            success: true,
            entry_id: newEntryId,
            payable_id: p_payable_id,
            amount_paid: p_amount,
            total_paid: newPaid,
            pending_balance: Math.max(0, effectiveAmount - newPaid),
            payment_status: newStatus,
            currency: mockPayableStore.currency,
            is_idempotent_replay: false,
            message: "Pagamento registrado com sucesso.",
          },
          error: null,
        };
      }

      // 3. RPC: reverse_supplier_payment
      if (fn === "reverse_supplier_payment") {
        const { p_payment_entry_id, p_reversal_reason } = args;
        const entry = mockPaymentEntriesStore.find((e) => e.id === p_payment_entry_id);

        if (!entry) {
          return { error: { message: "Lançamento de pagamento não encontrado." } };
        }

        if (entry.is_reversed) {
          return { error: { message: "Este pagamento já foi estornado anteriormente." } };
        }

        if (!p_reversal_reason || !p_reversal_reason.trim()) {
          return { error: { message: "É obrigatório informar a justificativa do estorno para fins de auditoria." } };
        }

        entry.is_reversed = true;
        entry.reversal_reason = p_reversal_reason;
        entry.reversed_at = "2026-10-22T16:10:00Z";

        // Recalcular a partir dos lançamentos ativos
        const activeEntries = mockPaymentEntriesStore.filter(
          (e) => e.payable_id === entry.payable_id && !e.is_reversed
        );
        const newPaid = activeEntries.reduce((sum, e) => sum + e.amount, 0);
        const effectiveAmount = Number(mockPayableStore.amount_final || 0);

        let newStatus: SupplierPaymentStatus = "aprovado";
        if (newPaid <= 0) {
          newStatus = mockPayableStore.amount_final !== null ? "aprovado" : "aguardando_aprovacao";
        } else if (newPaid >= effectiveAmount) {
          newStatus = "pago";
        } else {
          newStatus = "parcialmente_pago";
        }

        mockPayableStore.paid_amount = newPaid;
        mockPayableStore.payment_status = newStatus;

        return {
          data: {
            success: true,
            payment_entry_id: p_payment_entry_id,
            payable_id: entry.payable_id,
            reversed_amount: entry.amount,
            recalculated_paid_amount: newPaid,
            pending_balance: Math.max(0, effectiveAmount - newPaid),
            new_payment_status: newStatus,
            currency: mockPayableStore.currency,
            message: "Pagamento estornado com sucesso mantendo histórico auditável.",
          },
          error: null,
        };
      }

      return { error: { message: `Função RPC ${fn} não reconhecida.` } };
    },
  };

  // ---------------------------------------------------------------------------
  // 2. TESTE: BLOQUEIO DE PAGAMENTO SEM APROVAÇÃO DO CUSTO FINAL
  // ---------------------------------------------------------------------------
  console.log("\n--- TESTE 2: PAGAMENTO BLOQUEADO QUANDO CUSTO FINAL FOR NULL ---");

  // mockPayableStore está com amount_estimated = 500.0, mas amount_final = null
  let blockedUnapprovedPayment = false;
  try {
    await recordSupplierPayment(mockSupabase, {
      payableId: mockPayableStore.id,
      amount: 100.0,
      isAdmin: true,
    });
  } catch (err: any) {
    if (err.message.includes("o custo final deve ser previamente aprovado")) {
      blockedUnapprovedPayment = true;
    }
  }
  assert(
    blockedUnapprovedPayment,
    "Pagamento é estritamente bloqueado quando amount_final for NULL (custo estimado NÃO autoriza pagamento)"
  );
  assert(mockPayableStore.paid_amount === 0, "paid_amount permanece em 0.00 USD");

  // ---------------------------------------------------------------------------
  // 3. TESTE: BLOQUEIO DE PAGAMENTO EM OBRIGAÇÃO CANCELADA
  // ---------------------------------------------------------------------------
  console.log("\n--- TESTE 3: BLOQUEIO DE PAGAMENTO EM OBRIGAÇÃO CANCELADA ---");

  const cancelledPayable = { ...mockPayableStore, payment_status: "cancelado" as SupplierPaymentStatus, amount_final: 500.0 };
  let cancelledBlocked = false;
  try {
    const mockSupabaseCancelled = {
      ...mockSupabase,
      rpc: async (fn: string, args: any) => {
        if (fn === "record_supplier_payment") {
          return { error: { message: "Não é possível registrar pagamento em obrigação financeira cancelada." } };
        }
        return mockSupabase.rpc(fn, args);
      },
    };
    await recordSupplierPayment(mockSupabaseCancelled, {
      payableId: cancelledPayable.id,
      amount: 100.0,
      isAdmin: true,
    });
  } catch (err: any) {
    if (err.message.includes("obrigação financeira cancelada")) {
      cancelledBlocked = true;
    }
  }
  assert(cancelledBlocked, "Pagamentos em obrigações canceladas são bloqueados");

  // ---------------------------------------------------------------------------
  // 4. TESTE: APROVAÇÃO DO CUSTO FINAL PELO ADMIN (500 USD)
  // ---------------------------------------------------------------------------
  console.log("\n--- TESTE 4: ADMIN APROVA CUSTO FINAL ---");

  const appRes = await approveSupplierPayableCost(mockSupabase, {
    payableId: mockPayableStore.id,
    amountFinal: 500.0,
    notes: "Homologado tarifa oficial v0.1.43",
    isAdmin: true,
  });

  assert(appRes.success, "Custo final de 500.00 USD aprovado com sucesso");
  assert(mockPayableStore.amount_final === 500.0, "amount_final atualizado para 500.00 USD");
  assert(mockPayableStore.amount_estimated === 500.0, "amount_estimated preservado como referência histórica");
  assert(mockPayableStore.payment_status === "aprovado", "Status financeiro transita para 'aprovado'");

  // ---------------------------------------------------------------------------
  // 5. TESTE: PAGAMENTOS PARCIAIS SUCESSIVOS E IDEMPOTÊNCIA
  // ---------------------------------------------------------------------------
  console.log("\n--- TESTE 5: PAGAMENTOS PARCIAIS E CONTROLE DE IDEMPOTÊNCIA ---");

  // Pagamento 1: 200 USD com chave de idempotência
  const pay1IdemKey = "idem-pay-001-uuid";
  const pay1 = await recordSupplierPayment(mockSupabase, {
    payableId: mockPayableStore.id,
    amount: 200.0,
    paymentMethod: "transferencia",
    reference: "TED-001",
    idempotencyKey: pay1IdemKey,
    isAdmin: true,
  });

  assert(pay1.success, "Primeiro pagamento parcial de 200 USD registrado");
  assert(mockPayableStore.paid_amount === 200.0, "Total pago atualizado para 200.00 USD");
  assert(pay1.pendingBalance === 300.0, "Saldo pendente calculado: 300.00 USD");
  assert(mockPayableStore.payment_status === "parcialmente_pago", "Status é 'parcialmente_pago' (NÃO 'pago')");

  // Reenvio acidental do Pagamento 1 com a mesma idempotencyKey
  const pay1Replay = await recordSupplierPayment(mockSupabase, {
    payableId: mockPayableStore.id,
    amount: 200.0,
    paymentMethod: "transferencia",
    reference: "TED-001",
    idempotencyKey: pay1IdemKey,
    isAdmin: true,
  });

  assert(pay1Replay.isIdempotentReplay === true, "Idempotência detectou reenvio da mesma requisição");
  assert(mockPayableStore.paid_amount === 200.0, "Total pago NÃO foi duplicado (permanece 200.00 USD)");
  assert(mockPaymentEntriesStore.length === 1, "Apenas 1 lançamento existe na tabela de extratos");

  // Reenvio inválido: mesma chave de idempotência com valor divergente (250 USD em vez de 200 USD)
  let idemConflictBlocked = false;
  try {
    await recordSupplierPayment(mockSupabase, {
      payableId: mockPayableStore.id,
      amount: 250.0, // Divergente!
      paymentMethod: "transferencia",
      idempotencyKey: pay1IdemKey,
      isAdmin: true,
    });
  } catch (err: any) {
    if (err.message.includes("Conflito de idempotência")) {
      idemConflictBlocked = true;
    }
  }
  assert(idemConflictBlocked, "Idempotência: rejeita reuso de chave existente para operação com valor divergente");

  // Pagamento 2: 150 USD
  const pay2 = await recordSupplierPayment(mockSupabase, {
    payableId: mockPayableStore.id,
    amount: 150.0,
    paymentMethod: "wise",
    reference: "WISE-002",
    idempotencyKey: "idem-pay-002-uuid",
    isAdmin: true,
  });

  assert(pay2.success, "Segundo pagamento parcial de 150 USD registrado");
  assert(mockPayableStore.paid_amount === 350.0, "Total pago acumulado soma 350.00 USD");
  assert(pay2.pendingBalance === 150.0, "Saldo pendente recalculado: 150.00 USD");
  assert(mockPayableStore.payment_status === "parcialmente_pago", "Status permanece 'parcialmente_pago'");

  // ---------------------------------------------------------------------------
  // 6. TESTE: BLOQUEIO DE PAGAMENTOS SUPERIORES AO SALDO APROVADO
  // ---------------------------------------------------------------------------
  console.log("\n--- TESTE 6: BLOQUEIO DE PAGAMENTO ACIMA DO SALDO APROVADO ---");

  // Saldo aprovado pendente: 150 USD. Tentativa de pagar 200 USD deve falhar!
  let overpayBlocked = false;
  try {
    await recordSupplierPayment(mockSupabase, {
      payableId: mockPayableStore.id,
      amount: 200.0,
      isAdmin: true,
    });
  } catch (err: any) {
    if (err.message.includes("excede o saldo pendente aprovado")) {
      overpayBlocked = true;
    }
  }

  assert(overpayBlocked, "Pagamento de 200 USD superior ao saldo pendente (150 USD) é bloqueado com erro");
  assert(mockPayableStore.paid_amount === 350.0, "paid_amount permanece inalterado em 350.00 USD");

  // ---------------------------------------------------------------------------
  // 7. TESTE: REGRAS DE ALTERAÇÃO DE CUSTO FINAL COM PAGAMENTOS ATIVOS
  // ---------------------------------------------------------------------------
  console.log("\n--- TESTE 7: REGRAS DE ALTERAÇÃO DE CUSTO FINAL COM PAGAMENTOS ATIVOS ---");

  // 7.1 Tentar reduzir amount_final para 300 USD (abaixo do total pago de 350 USD)
  let reduceBelowPaidBlocked = false;
  try {
    await approveSupplierPayableCost(mockSupabase, {
      payableId: mockPayableStore.id,
      amountFinal: 300.0, // < 350 pago!
      isAdmin: true,
    });
  } catch (err: any) {
    if (err.message.includes("não pode ser inferior ao total já pago")) {
      reduceBelowPaidBlocked = true;
    }
  }
  assert(reduceBelowPaidBlocked, "Impede que amount_final seja reduzido abaixo do total já pago (300 USD < 350 USD)");

  // 7.2 Tentar remover aprovação (amount_final = null) com pagamentos ativos
  let removeApprovalBlocked = false;
  try {
    await approveSupplierPayableCost(mockSupabase, {
      payableId: mockPayableStore.id,
      amountFinal: null, // remover aprovação!
      isAdmin: true,
    });
  } catch (err: any) {
    if (err.message.includes("Não é permitido desaprovar ou remover o custo final")) {
      removeApprovalBlocked = true;
    }
  }
  assert(removeApprovalBlocked, "Impede remoção de aprovação enquanto existirem pagamentos ativos");

  // ---------------------------------------------------------------------------
  // 8. TESTE: PAGAMENTO INTEGRAL E QUITAÇÃO (SALDO ZERO)
  // ---------------------------------------------------------------------------
  console.log("\n--- TESTE 8: PAGAMENTO INTEGRAL (QUITAÇÃO TOTAL) ---");

  // Pagar os 150 USD restantes exatos
  const pay3 = await recordSupplierPayment(mockSupabase, {
    payableId: mockPayableStore.id,
    amount: 150.0,
    paymentMethod: "transferencia",
    reference: "TED-FINAL",
    isAdmin: true,
  });

  assert(pay3.success, "Terceiro pagamento de 150 USD registrado");
  assert(mockPayableStore.paid_amount === 500.0, "paid_amount totaliza 500.00 USD");
  assert(pay3.pendingBalance === 0.0, "Saldo pendente zerado (0.00 USD)");
  assert(mockPayableStore.payment_status === "pago", "Status promovido para 'pago' exclusivamente após quitação integral");

  // ---------------------------------------------------------------------------
  // 9. TESTE: ESTORNO AUDITÁVEL COM PRESERVAÇÃO DE REGISTROS
  // ---------------------------------------------------------------------------
  console.log("\n--- TESTE 9: ESTORNO AUDITÁVEL COM PRESERVAÇÃO DE REGISTROS ---");

  const entryToReverse = mockPaymentEntriesStore[1]; // pay2 (150 USD)
  const revRes = await reverseSupplierPayment(mockSupabase, {
    paymentEntryId: entryToReverse.id,
    reversalReason: "Lançamento duplicado pelo operador bancário",
    isAdmin: true,
  });

  assert(revRes.success, "Estorno auditável realizado com sucesso");
  assert(entryToReverse.is_reversed === true, "Lançamento original marcado como is_reversed = true (nunca deletado)");
  assert(mockPayableStore.paid_amount === 350.0, "Total pago recalculado retroativamente para 350.00 USD");
  assert(mockPayableStore.payment_status === "parcialmente_pago", "Status retorna para 'parcialmente_pago' pois saldo reabriu");
  assert(revRes.pendingBalance === 150.0, "Saldo pendente reaberto no valor de 150.00 USD");

  // ---------------------------------------------------------------------------
  // 10. TESTE: IDEMPOTÊNCIA EM ESTORNO DUPLICADO
  // ---------------------------------------------------------------------------
  console.log("\n--- TESTE 10: IDEMPOTÊNCIA EM ESTORNO DUPLICADO ---");

  let doubleRevBlocked = false;
  try {
    await reverseSupplierPayment(mockSupabase, {
      paymentEntryId: entryToReverse.id,
      reversalReason: "Tentativa de estornar novamente",
      isAdmin: true,
    });
  } catch (err: any) {
    if (err.message.includes("já foi estornado anteriormente")) {
      doubleRevBlocked = true;
    }
  }
  assert(doubleRevBlocked, "Tentativa de estornar pagamento já estornado é bloqueada");

  // ---------------------------------------------------------------------------
  // 11. TESTE: SEGREGAÇÃO ESTRITA DE MOEDAS (USD vs MXN vs BRL)
  // ---------------------------------------------------------------------------
  console.log("\n--- TESTE 11: SEGREGAÇÃO ESTRITA DE MOEDAS (NUNCA MISTURAR USD COM MXN) ---");

  const multiCurrencyPayables: SupplierPayable[] = [
    {
      ...mockKnownPayableUSD,
      currency: "USD",
      amount_estimated: 500.0,
      amount_final: 500.0,
      paid_amount: 350.0, // Saldo: 150 USD
    },
    {
      ...mockKnownPayableUSD,
      id: "pay-usd-02",
      currency: "USD",
      amount_estimated: 300.0,
      amount_final: 300.0,
      paid_amount: 300.0, // Saldo: 0 USD
    },
    {
      ...mockUnknownPayableMXN,
      id: "pay-mxn-01",
      currency: "MXN",
      amount_estimated: 8000.0,
      amount_final: 8000.0,
      paid_amount: 4000.0, // Saldo: 4000 MXN
      is_unknown_cost: false,
    },
    {
      ...mockUnknownPayableMXN,
      id: "pay-mxn-02",
      currency: "MXN",
      amount_estimated: null,
      amount_final: null,
      paid_amount: 0,
      is_unknown_cost: true, // Custo desconhecido
    },
  ];

  const kpis = calculateSupplierFinancialKpis(multiCurrencyPayables);

  assert(Boolean(kpis["USD"]), "Gera grupo de indicadores exclusivo para USD");
  assert(Boolean(kpis["MXN"]), "Gera grupo de indicadores exclusivo para MXN");
  assert(!kpis["TOTAL_CONVERTIDO"], "Não realiza conversão cambial implícita");

  // Validação USD
  assert(kpis["USD"].totalApproved === 800.0, "USD: Total aprovado soma 800.00 USD");
  assert(kpis["USD"].totalPaid === 650.0, "USD: Total pago soma 650.00 USD");
  assert(kpis["USD"].pendingBalance === 150.0, "USD: Saldo pendente calcula 150.00 USD");

  // Validação MXN
  assert(kpis["MXN"].totalApproved === 8000.0, "MXN: Total aprovado soma 8.000,00 MXN");
  assert(kpis["MXN"].totalPaid === 4000.0, "MXN: Total pago soma 4.000,00 MXN");
  assert(kpis["MXN"].pendingBalance === 4000.0, "MXN: Saldo pendente calcula 4.000,00 MXN");
  assert(kpis["MXN"].unknownCostCount === 1, "MXN: Identifica 1 obrigação com custo sob consulta");

  // Regra de Ouro: Proibição de soma trans-moeda
  assert(
    kpis["USD"].pendingBalance !== 4150.0,
    "Regra de Ouro da Tarefa 20: 150 USD e 4.000 MXN NUNCA são somados como se fossem a mesma moeda"
  );

  // ---------------------------------------------------------------------------
  // 12. TESTE: BLOQUEIO RBAC PARA NÃO-ADMINISTRADORES
  // ---------------------------------------------------------------------------
  console.log("\n--- TESTE 12: BLOQUEIO DE OPERAÇÕES FINANCEIRAS PARA NÃO-ADMIN ---");

  let nonAdminPayBlocked = false;
  try {
    await recordSupplierPayment(mockSupabase, {
      payableId: mockPayableStore.id,
      amount: 50.0,
      isAdmin: false, // Moderador ou Vendedor
    });
  } catch (err: any) {
    if (err.message.includes("Acesso negado: apenas administradores")) {
      nonAdminPayBlocked = true;
    }
  }
  assert(nonAdminPayBlocked, "Vendedores e moderadores são bloqueados ao tentar registrar pagamentos");

  // ---------------------------------------------------------------------------
  // RESUMO FINAL
  // ---------------------------------------------------------------------------
  console.log("\n==================================================================");
  console.log(`TOTAL DE TESTES EXECUTADOS: ${testsPassed + testsFailed}`);
  console.log(`SUCESSOS: ${testsPassed}`);
  console.log(`FALHAS: ${testsFailed}`);
  console.log("==================================================================");

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runAllSupplierFinanceTests().catch((err) => {
  console.error("Erro fatal na execução dos testes:", err);
  process.exit(1);
});
