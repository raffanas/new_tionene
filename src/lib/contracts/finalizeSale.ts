/**
 * FINALIZAÇÃO ATÔMICA E IDEMPOTENTE DE VENDAS DE CONTRATOS — TÍO NENÊ v0.1.43
 *
 * Transforma um contrato emitido/assinado em venda finalizada, gerando:
 * 1. Exatamente 1 registro de chegada/atendimento do cliente (public.arrivals)
 * 2. Reservas operacionais com fornecedores para cada passeio/serviço (public.operational_reservations)
 * 3. Previsão financeira de contas a pagar na moeda original do operador (public.supplier_payables)
 * 4. Atualização do status do contrato para 'finalizado' com carimbo finalized_at
 *
 * REGRA MANDATÓRIA (TAREFA 18):
 * Utiliza EXCLUSIVAMENTE a RPC transacional PostgreSQL no Supabase (`finalize_contract_sale`).
 * NÃO realiza INSERTs ou UPDATEs independentes no cliente, garantindo atomicidade real
 * e impedindo operações parcialmente finalizadas.
 */

import { FinalizeSaleResult } from "@/types/operational";

/**
 * Executa a finalização da venda de um contrato exclusivamente via RPC transacional no Supabase.
 */
export async function finalizeContractSale(
  supabase: any,
  contractId: string
): Promise<FinalizeSaleResult> {
  if (!contractId || contractId.trim() === "") {
    throw new Error("Identificador de contrato inválido.");
  }

  // Executa a RPC transacional atômica no Supabase
  const { data: rpcData, error: rpcErr } = await supabase.rpc("finalize_contract_sale", {
    p_contract_id: contractId,
  });

  if (rpcErr) {
    const isRpcMissing =
      rpcErr.code === "PGRST202" ||
      rpcErr.message?.includes("Could not find the function") ||
      rpcErr.message?.includes("function public.finalize_contract_sale");

    if (isRpcMissing) {
      throw new Error(
        "A função transacional 'finalize_contract_sale' ainda não foi executada no banco Supabase. " +
        "Aplique a migration supabase/migrations/20261026_operational_reservations_and_sale_finalization.sql " +
        "no SQL Editor antes de finalizar a venda."
      );
    }

    throw new Error(rpcErr.message || "Erro ao finalizar venda");
  }

  if (!rpcData || !rpcData.success) {
    throw new Error(rpcData?.message || "Falha ao finalizar a venda do contrato.");
  }

  return rpcData as FinalizeSaleResult;
}
