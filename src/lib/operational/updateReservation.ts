/**
 * ATUALIZAÇÃO SEGURA DE RESERVAS OPERACIONAIS — TÍO NENÊ v0.1.43
 *
 * Persiste alterações de status, pickup, código do fornecedor, voucher e histórico.
 *
 * REGRA MANDATÓRIA (TAREFA 19):
 * - Prioriza a RPC transacional `update_operational_reservation_authorized`.
 * - Não-administradores NÃO podem alterar `actual_cost`, `estimated_cost`,
 *   `cost_currency` ou `is_unknown_cost`.
 * - Registra entradas cronológicas no histórico da reserva.
 */

import { OperationalReservationStatus, OperationalReservationHistoryEntry } from "@/types/operational";

export interface UpdateOperationalReservationParams {
  reservationId: string;
  status?: OperationalReservationStatus;
  pickupTime?: string | null;
  pickupLocation?: string | null;
  supplierConfirmationCode?: string | null;
  voucherRef?: string | null;
  specialInstructions?: string | null;
  notes?: string | null;
  supplierRequestedAt?: string | null;
  supplierRequestChannel?: string | null;
  supplierConfirmedAt?: string | null;
  actualCost?: number | null; // Apenas Admin
  actionDescription?: string;
  isAdmin?: boolean;
}

export async function updateOperationalReservation(
  supabase: any,
  params: UpdateOperationalReservationParams
): Promise<{ success: boolean; message: string }> {
  const {
    reservationId,
    status,
    pickupTime,
    pickupLocation,
    supplierConfirmationCode,
    voucherRef,
    specialInstructions,
    notes,
    supplierRequestedAt,
    supplierRequestChannel,
    supplierConfirmedAt,
    actualCost,
    actionDescription = "Atualização operacional",
    isAdmin = false,
  } = params;

  if (!reservationId) {
    throw new Error("ID de reserva inválido.");
  }

  // 1. Tentar executar via RPC segura no Supabase
  try {
    const { data: rpcData, error: rpcErr } = await supabase.rpc(
      "update_operational_reservation_authorized",
      {
        p_reservation_id: reservationId,
        p_status: status || null,
        p_pickup_time: pickupTime ?? null,
        p_pickup_location: pickupLocation ?? null,
        p_supplier_confirmation_code: supplierConfirmationCode ?? null,
        p_voucher_ref: voucherRef ?? null,
        p_special_instructions: specialInstructions ?? null,
        p_notes: notes ?? null,
        p_supplier_requested_at: supplierRequestedAt ?? null,
        p_supplier_request_channel: supplierRequestChannel ?? null,
        p_supplier_confirmed_at: supplierConfirmedAt ?? null,
        p_actual_cost: isAdmin ? (actualCost ?? null) : null,
        p_action_description: actionDescription,
      }
    );

    if (!rpcErr && rpcData?.success) {
      return { success: true, message: rpcData.message || "Reserva atualizada com sucesso." };
    }

    const isRpcMissing =
      rpcErr &&
      (rpcErr.code === "PGRST202" ||
        rpcErr.message?.includes("Could not find the function") ||
        rpcErr.message?.includes("function public.update_operational_reservation_authorized"));

    if (rpcErr && !isRpcMissing) {
      throw new Error(`Erro ao atualizar reserva: ${rpcErr.message}`);
    }
  } catch (err: any) {
    if (
      !err.message?.includes("Could not find the function") &&
      !err.message?.includes("PGRST202")
    ) {
      throw err;
    }
  }

  // 2. Fallback controlado caso a migration 20261027 ainda não tenha sido aplicada no Supabase remoto
  // Obtém reserva atual para atualizar histórico
  const { data: currentRes, error: fetchErr } = await supabase
    .from("operational_reservations")
    .select("*")
    .eq("id", reservationId)
    .single();

  if (fetchErr || !currentRes) {
    throw new Error(`Reserva não encontrada: ${fetchErr?.message || ""}`);
  }

  // Verifica proteção financeira: se não for admin e tentar alterar actual_cost
  if (!isAdmin && actualCost !== undefined && actualCost !== currentRes.actual_cost) {
    throw new Error("Acesso negado: apenas administradores podem alterar custos de fornecedores.");
  }

  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id;

  const historyEntry: OperationalReservationHistoryEntry = {
    timestamp: new Date().toISOString(),
    user_id: userId,
    action: actionDescription,
    status_before: currentRes.status,
    status_after: status || currentRes.status,
    pickup_time: pickupTime ?? currentRes.pickup_time,
    supplier_confirmation_code: supplierConfirmationCode ?? currentRes.supplier_confirmation_code,
    voucher_ref: voucherRef ?? currentRes.voucher_ref,
    channel: supplierRequestChannel ?? currentRes.supplier_request_channel,
    notes: notes ?? currentRes.notes,
  };

  const existingHistory = Array.isArray(currentRes.history) ? currentRes.history : [];
  const updatedHistory = [...existingHistory, historyEntry];

  const updatePayload: any = {
    status: status || currentRes.status,
    pickup_time: pickupTime !== undefined ? pickupTime : currentRes.pickup_time,
    pickup_location: pickupLocation !== undefined ? pickupLocation : currentRes.pickup_location,
    supplier_confirmation_code:
      supplierConfirmationCode !== undefined
        ? supplierConfirmationCode
        : currentRes.supplier_confirmation_code,
    voucher_ref: voucherRef !== undefined ? voucherRef : currentRes.voucher_ref,
    special_instructions:
      specialInstructions !== undefined ? specialInstructions : currentRes.special_instructions,
    notes: notes !== undefined ? notes : currentRes.notes,
    supplier_requested_at:
      supplierRequestedAt !== undefined ? supplierRequestedAt : currentRes.supplier_requested_at,
    supplier_request_channel:
      supplierRequestChannel !== undefined
        ? supplierRequestChannel
        : currentRes.supplier_request_channel,
    supplier_confirmed_at:
      supplierConfirmedAt !== undefined ? supplierConfirmedAt : currentRes.supplier_confirmed_at,
    history: updatedHistory,
    updated_at: new Date().toISOString(),
  };

  // Apenas Admin pode atualizar custo real
  if (isAdmin && actualCost !== undefined) {
    updatePayload.actual_cost = actualCost;
  }

  const { error: updateErr } = await supabase
    .from("operational_reservations")
    .update(updatePayload)
    .eq("id", reservationId);

  if (updateErr) {
    throw new Error(`Erro ao salvar dados operacionais: ${updateErr.message}`);
  }

  // Sincronizar voucher_ref no item de contrato se informado
  if (voucherRef && currentRes.contract_item_id) {
    await supabase
      .from("contract_items")
      .update({ voucher_ref: voucherRef })
      .eq("id", currentRes.contract_item_id);
  }

  return { success: true, message: "Dados operacionais atualizados com sucesso." };
}
