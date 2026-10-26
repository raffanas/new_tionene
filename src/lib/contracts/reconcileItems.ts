/**
 * reconcileItems.ts
 * 
 * Estratégia segura de reconciliação e sincronização diferencial de itens de contrato.
 * Evita a destruição sistemática de UUIDs causada por DELETE seguido de INSERT.
 * Preserva identificadores existentes, integridade de pagamentos a fornecedores
 * e futuras referências operacionais.
 * 
 * Suporta execução atômica via RPC PostgreSQL (public.reconcile_contract_items)
 * com fallback inteligente para modo diferencial transacional no cliente.
 */

export interface ContractItemFormInput {
  id?: string;
  tour_id?: string | null;
  tour_name: string;
  tour_date?: string | null;
  adults_count?: number;
  children_count?: number;
  units_count?: number;
  sale_price?: number;
  cost_applied?: number;
  cost_currency?: string;
  calculated_total_cost?: number;
  supplier_id?: string | null;
  supplier_name?: string | null;
  voucher_ref?: string | null;
  included?: string | null;
  not_included?: string | null;
  tariff_code?: string | null;
  pricing_model?: string | null;
  calculation_formula?: string | null;
  external_fees?: string | null;
  status?: string;
  notes?: string | null;

  // Evolução v0.1.43 — Snapshots de Tarifas Oficiais e Overrides Manuais
  rate_id_snapshot?: string | null;
  tour_id_code_snapshot?: string | null;
  is_manual_quote?: boolean;
  is_manual_override?: boolean;
  manual_override_reason?: string | null;
  hotel_zone_snapshot?: string | null;
  native_currency?: string;
  native_cost_applied?: number | null;
  native_calculated_total_cost?: number | null;
  legs_count?: number;
}

export interface ContractFormContext {
  arrival_date?: string;
  adults_count?: number;
  children_count?: number;
}

export interface ReconcileResult {
  updatedCount: number;
  insertedCount: number;
  deletedCount: number;
  canceledCount: number;
  updatedIds: string[];
  insertedIds: string[];
  deletedIds: string[];
  canceledIds: string[];
}

export interface ReconcileOptions {
  /**
   * Por padrão é FALSE para impedir que edições críticas em produção usem
   * fallback multi-query cliente quando a RPC transacional não estiver aplicada.
   * Se a RPC estiver ausente e allowNonTransactionalFallback for false,
   * uma exceção descritiva é lançada para preservar a integridade dos dados e o formulário.
   */
  allowNonTransactionalFallback?: boolean;
}

/**
 * Validação rigorosa e preventiva dos itens de contrato antes de qualquer escrita no banco de dados.
 * Impede que o contrato principal seja salvo se algum dos seus itens contiver erro ou estiver inconsistente.
 */
export function validateContractItems(
  items: ContractItemFormInput[],
  context: ContractFormContext = {}
): void {
  if (!items || !Array.isArray(items)) {
    return;
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const itemNum = i + 1;

    if (!item.tour_name || !item.tour_name.trim()) {
      throw new Error(`Validação falhou no passeio #${itemNum}: Nome do passeio é obrigatório.`);
    }

    const dateVal = item.tour_date || context.arrival_date;
    if (!dateVal || !dateVal.trim()) {
      throw new Error(`Validação falhou no passeio #${itemNum} ("${item.tour_name}"): Data do passeio é obrigatória.`);
    }

    if (isNaN(new Date(dateVal).getTime())) {
      throw new Error(`Validação falhou no passeio #${itemNum} ("${item.tour_name}"): Formato de data inválido (${dateVal}).`);
    }

    if (item.adults_count !== undefined && item.adults_count < 0) {
      throw new Error(`Validação falhou no passeio #${itemNum}: Quantidade de adultos não pode ser negativa.`);
    }

    if (item.children_count !== undefined && item.children_count < 0) {
      throw new Error(`Validação falhou no passeio #${itemNum}: Quantidade de crianças não pode ser negativa.`);
    }

    if (item.units_count !== undefined && item.units_count < 1) {
      throw new Error(`Validação falhou no passeio #${itemNum}: Quantidade de unidades deve ser no mínimo 1.`);
    }

    if (item.sale_price !== undefined && item.sale_price < 0) {
      throw new Error(`Validação falhou no passeio #${itemNum}: Preço de venda não pode ser negativo.`);
    }

    if (item.cost_applied !== undefined && item.cost_applied < 0) {
      throw new Error(`Validação falhou no passeio #${itemNum}: Custo aplicado não pode ser negativo.`);
    }
  }
}

/**
 * Constrói o payload para gravação de um item de contrato no banco de dados.
 */
export function buildContractItemDbPayload(
  item: ContractItemFormInput,
  contractId: string,
  context: ContractFormContext = {}
) {
  if (!item.tour_name || !item.tour_name.trim()) {
    throw new Error("Validação falhou: Nome do passeio (tour_name) é obrigatório.");
  }

  const isTourIdUuid = item.tour_id && item.tour_id.length === 36;
  const tourDate = item.tour_date || context.arrival_date || new Date().toISOString().split("T")[0];
  const pricingModel = item.pricing_model || "per_person";
  const costApplied = item.cost_applied ?? 0;
  const totalCost = item.calculated_total_cost ?? costApplied;

  return {
    contract_id: contractId,
    tour_id: isTourIdUuid ? item.tour_id : null,
    supplier_id: item.supplier_id || null,
    tour_date: tourDate,
    tour_name_snapshot: item.tour_name.trim(),
    tour_included_snapshot: item.included || null,
    tour_not_included_snapshot: item.not_included || null,
    supplier_name_snapshot: item.supplier_name || null,
    adults_count: Math.max(0, item.adults_count ?? context.adults_count ?? 1),
    children_count: Math.max(0, item.children_count ?? context.children_count ?? 0),
    units_count: Math.max(1, item.units_count ?? 1),
    sale_price: Math.max(0, item.sale_price ?? 0),
    cost_applied: Math.max(0, costApplied),
    cost_currency: item.cost_currency || "USD",
    cost_type: pricingModel,
    calculated_total_cost: Math.max(0, totalCost),
    cost_status: item.tariff_code ? "calculado" : "pendente",
    tariff_code_snapshot: item.tariff_code || null,
    pricing_model_snapshot: pricingModel,
    external_fees_snapshot: item.external_fees || null,
    // Snapshots e integridade comercial v0.1.43
    rate_id_snapshot: item.rate_id_snapshot || (item.tariff_code && !item.tariff_code.startsWith("TN-") ? item.tariff_code : null),
    tour_id_code_snapshot: item.tour_id_code_snapshot || null,
    is_manual_quote: Boolean(item.is_manual_quote),
    is_manual_override: Boolean(item.is_manual_override),
    manual_override_reason: item.manual_override_reason || null,
    hotel_zone_snapshot: item.hotel_zone_snapshot || null,
    native_currency: item.native_currency || item.cost_currency || "USD",
    native_cost_applied: item.native_cost_applied !== undefined ? item.native_cost_applied : null,
    native_calculated_total_cost: item.native_calculated_total_cost !== undefined ? item.native_calculated_total_cost : null,
    legs_count: item.legs_count || 1,
    calculation_breakdown: {
      formula: item.calculation_formula || "",
      tariff_code: item.tariff_code || null,
      rate_id_snapshot: item.rate_id_snapshot || (item.tariff_code && !item.tariff_code.startsWith("TN-") ? item.tariff_code : null),
      tour_id_code_snapshot: item.tour_id_code_snapshot || null,
      is_manual_quote: Boolean(item.is_manual_quote),
      is_manual_override: Boolean(item.is_manual_override),
      manual_override_reason: item.manual_override_reason || null,
      hotel_zone_snapshot: item.hotel_zone_snapshot || null,
      native_currency: item.native_currency || item.cost_currency || "USD",
      native_cost_applied: item.native_cost_applied !== undefined ? item.native_cost_applied : null,
      native_calculated_total_cost: item.native_calculated_total_cost !== undefined ? item.native_calculated_total_cost : null,
      legs_count: item.legs_count || 1,
    },
    notes: item.tariff_code
      ? `[${item.tariff_code}] ${item.calculation_formula || ""}${item.external_fees ? ` | Taxas ext: ${item.external_fees}` : ""}`
      : (item.calculation_formula || item.notes || null),
    voucher_ref: item.voucher_ref || null,
    status: item.status || "agendado",
  };
}

/**
 * Executa a reconciliação diferencial de itens de um contrato existente.
 * 
 * Regras de Segurança:
 * 1. Valida rigorosamente todos os itens antes de qualquer tentativa de persistência.
 * 2. Tenta a RPC atômica public.reconcile_contract_items no Supabase.
 * 3. Se a RPC não estiver disponível:
 *    - Por padrão (allowNonTransactionalFallback = false), lança erro claro e interrompe a operação
 *      para evitar salvamentos parciais não-transacionais que corrompem a integridade dos dados.
 *    - O formulário no cliente é preservado sem fechamento ou perda de estado.
 * 4. Quando o fallback for expressamente autorizado (ex: testes de ambiente):
 *    - Itens existentes são atualizados preservando rigorosamente seus UUIDs.
 *    - Itens com vínculos (alocações financeiras, vouchers ou status confirmado/realizado)
 *      NUNCA sofrem DELETE; são marcados como status='cancelado'.
 *    - Itens novos são inseridos.
 *    - Sequestro de IDs (itens de outros contratos) é estritamente bloqueado.
 */
export async function reconcileContractItemsDifferential(
  supabase: any,
  contractId: string,
  formItems: ContractItemFormInput[],
  context: ContractFormContext = {},
  options: ReconcileOptions = {}
): Promise<ReconcileResult> {
  if (!contractId || contractId.trim() === "") {
    throw new Error("Parâmetro inválido: contractId é obrigatório para reconciliação de itens.");
  }

  // 1. Validação prévia de todos os itens antes de tocar no banco
  validateContractItems(formItems, context);

  // Preparar payloads de cada item do formulário
  const preparedPayloads = formItems.map((item) => ({
    id: item.id || null,
    ...buildContractItemDbPayload(item, contractId, context),
  }));

  // 2. Tentar execução via RPC transacional no Supabase (atômica no PostgreSQL)
  try {
    const { data: rpcData, error: rpcErr } = await supabase.rpc("reconcile_contract_items", {
      p_contract_id: contractId,
      p_items: preparedPayloads,
    });

    if (!rpcErr && rpcData) {
      return {
        updatedCount: rpcData.updated || 0,
        insertedCount: rpcData.inserted || 0,
        deletedCount: rpcData.deleted || 0,
        canceledCount: rpcData.canceled || 0,
        updatedIds: [],
        insertedIds: [],
        deletedIds: [],
        canceledIds: [],
      };
    }

    const isRpcMissing =
      rpcErr &&
      (rpcErr.code === "PGRST202" ||
        rpcErr.message?.includes("Could not find the function") ||
        rpcErr.message?.includes("function public.reconcile_contract_items"));

    if (isRpcMissing) {
      if (!options.allowNonTransactionalFallback) {
        throw new Error(
          "A RPC transacional 'reconcile_contract_items' não está instalada no Supabase. " +
          "Para garantir a integridade referencial e financeira dos passeios e prevenir salvamentos parciais inconsistentes, " +
          "a edição de contratos exige a aplicação da migration no banco de dados. O formulário foi preservado sem alterações."
        );
      }
    } else if (rpcErr) {
      throw new Error(`Erro na RPC de reconciliação de itens: ${rpcErr.message}`);
    }
  } catch (err: any) {
    if (
      err.message &&
      !err.message.includes("Could not find the function") &&
      !err.message.includes("PGRST202")
    ) {
      throw err;
    }
    if (!options.allowNonTransactionalFallback) {
      throw new Error(
        "A RPC transacional 'reconcile_contract_items' não está disponível no Supabase. " +
        "Para evitar inconsistências ou salvamento parcial, a alteração foi interrompida com segurança. O formulário permanece intacto."
      );
    }
  }

  // 3. Fallback: Reconciliação diferencial cliente (apenas quando expressamente habilitado)
  const result: ReconcileResult = {
    updatedCount: 0,
    insertedCount: 0,
    deletedCount: 0,
    canceledCount: 0,
    updatedIds: [],
    insertedIds: [],
    deletedIds: [],
    canceledIds: [],
  };

  // Consultar os itens atualmente persistidos no banco para este contrato
  const { data: dbItems, error: fetchErr } = await supabase
    .from("contract_items")
    .select("id, status, voucher_ref, cost_status")
    .eq("contract_id", contractId);

  if (fetchErr) {
    throw new Error(`Erro ao verificar itens do contrato no banco: ${fetchErr.message}`);
  }

  const existingDbIds = new Set<string>((dbItems || []).map((it: any) => it.id));
  const currentFormIds = new Set<string>(
    formItems.filter((it) => it.id && existingDbIds.has(it.id)).map((it) => it.id!)
  );

  // Proteção contra manipulação de IDs: verificar se algum item fornecido com ID pertence a outro contrato
  const suspiciousItems = formItems.filter((it) => it.id && !existingDbIds.has(it.id));
  if (suspiciousItems.length > 0) {
    const suspiciousIds = suspiciousItems.map((it) => it.id!);
    const { data: alienItems } = await supabase
      .from("contract_items")
      .select("id, contract_id")
      .in("id", suspiciousIds);

    if (alienItems && alienItems.length > 0) {
      throw new Error(
        `Violação de integridade: O item ${alienItems[0].id} pertence a outro contrato e não pode ser transferido.`
      );
    }
  }

  // Identificar itens removidos do formulário
  const removedDbItems = (dbItems || []).filter((it: any) => !currentFormIds.has(it.id));
  const removedIds: string[] = removedDbItems.map((it: any) => it.id);

  if (removedIds.length > 0) {
    let safeToDeleteIds: string[] = [];
    let protectedIds: string[] = [];

    // Checagem de vínculos em pagamentos de fornecedores
    let linkedPaymentItemIds = new Set<string>();
    try {
      const { data: linkedAllocations, error: allocErr } = await supabase
        .from("supplier_payment_allocations")
        .select("contract_item_id")
        .in("contract_item_id", removedIds);

      if (!allocErr && linkedAllocations && linkedAllocations.length > 0) {
        linkedPaymentItemIds = new Set(linkedAllocations.map((a: any) => a.contract_item_id));
      }
    } catch (allocErr) {
      console.warn("Aviso ao checar vínculos financeiros para itens removidos:", allocErr);
    }

    // Avaliar cada item removido
    for (const item of removedDbItems) {
      const hasPaymentAllocation = linkedPaymentItemIds.has(item.id);
      const hasVoucher = Boolean(item.voucher_ref && item.voucher_ref.trim() !== "");
      const isConfirmedOrDone = item.status === "confirmado_fornecedor" || item.status === "realizado";

      if (hasPaymentAllocation || hasVoucher || isConfirmedOrDone) {
        protectedIds.push(item.id);
      } else {
        safeToDeleteIds.push(item.id);
      }
    }

    // Itens com vínculos: NÃO realiza exclusão física.
    // Marca como cancelado para manter histórico e evitar exclusão em cascata.
    if (protectedIds.length > 0) {
      const { error: cancelErr } = await supabase
        .from("contract_items")
        .update({
          status: "cancelado",
          notes: "[Item cancelado em revisão contratual - mantido no banco por integridade financeira/operacional]",
          updated_at: new Date().toISOString(),
        })
        .in("id", protectedIds);

      if (cancelErr) {
        throw new Error(`Falha ao cancelar itens com vínculos: ${cancelErr.message}`);
      }
      result.canceledCount = protectedIds.length;
      result.canceledIds = protectedIds;
    }

    // Itens sem vínculos: exclusão segura
    if (safeToDeleteIds.length > 0) {
      const { error: delErr } = await supabase
        .from("contract_items")
        .delete()
        .in("id", safeToDeleteIds);

      if (delErr) {
        throw new Error(`Falha ao excluir itens desvinculados: ${delErr.message}`);
      }
      result.deletedCount = safeToDeleteIds.length;
      result.deletedIds = safeToDeleteIds;
    }
  }

  // Separar itens entre atualização e inserção
  const itemsToUpdate = formItems.filter((it) => it.id && existingDbIds.has(it.id));
  const itemsToInsert = formItems.filter((it) => !it.id || !existingDbIds.has(it.id));

  // Atualizar itens existentes preservando rigorosamente seus UUIDs
  for (const item of itemsToUpdate) {
    const payload = {
      ...buildContractItemDbPayload(item, contractId, context),
      updated_at: new Date().toISOString(),
    };

    const { error: updErr } = await supabase
      .from("contract_items")
      .update(payload)
      .eq("id", item.id!);

    if (updErr) {
      throw new Error(`Falha ao atualizar item ${item.tour_name} (ID: ${item.id}): ${updErr.message}`);
    }

    result.updatedCount++;
    result.updatedIds.push(item.id!);
  }

  // Inserir apenas itens realmente novos
  if (itemsToInsert.length > 0) {
    const payloads = itemsToInsert.map((item) => buildContractItemDbPayload(item, contractId, context));
    const { data: insertedData, error: insErr } = await supabase
      .from("contract_items")
      .insert(payloads)
      .select("id");

    if (insErr) {
      throw new Error(`Falha ao inserir novos itens do contrato: ${insErr.message}`);
    }

    result.insertedCount = itemsToInsert.length;
    if (insertedData) {
      result.insertedIds = insertedData.map((d: any) => d.id);
    }
  }

  return result;
}

/**
 * Salva o cabeçalho do contrato e reconcilia todos os itens em uma única chamada atômica.
 * Utiliza a RPC public.save_contract_with_items para garantir que contrato e itens sejam
 * persistidos de forma 100% transacional no PostgreSQL. Se os itens falharem, o contrato NÃO é salvo.
 */
export async function saveContractWithItemsAtomic(
  supabase: any,
  contractPayload: any,
  formItems: ContractItemFormInput[],
  context: ContractFormContext = {}
): Promise<{ success: boolean; contractId: string; itemsResult: any }> {
  // 1. Validação preliminar rigorosa de todos os itens
  validateContractItems(formItems, context);

  const contractId = contractPayload.id || null;
  const preparedPayloads = formItems.map((item) => ({
    id: item.id || null,
    ...buildContractItemDbPayload(item, contractId || "00000000-0000-0000-0000-000000000000", context),
  }));

  // 2. Chamar RPC atômica única no Supabase
  const { data, error } = await supabase.rpc("save_contract_with_items", {
    p_contract: contractPayload,
    p_items: preparedPayloads,
  });

  if (!error && data && data.success) {
    return {
      success: true,
      contractId: data.contract_id,
      itemsResult: data.items,
    };
  }

  const isRpcMissing =
    error &&
    (error.code === "PGRST202" ||
      error.message?.includes("Could not find the function") ||
      error.message?.includes("save_contract_with_items"));

  if (isRpcMissing) {
    throw new Error(
      "A RPC transacional 'save_contract_with_items' não está instalada no Supabase. " +
      "Para salvar contrato e passeios de forma atômica sem risco de inconsistências, é necessário executar a migration '20261023_security_rbac_policies.sql'. " +
      "O formulário foi preservado integralmente sem alteração nos dados remotos."
    );
  }

  throw new Error(`Erro ao salvar contrato e itens: ${error?.message || "Falha desconhecida"}`);
}

/**
 * Reconstrói um item de contrato lido do banco de dados (tabela contract_items),
 * extraindo os snapshots de tarifas e parâmetros operacionais de ambas as camadas
 * (colunas de primeira classe e JSON calculation_breakdown).
 */
export function formatDbContractItem(i: any): any {
  const bd = i.calculation_breakdown || {};
  const rateIdSnapshot = i.rate_id_snapshot || bd.rate_id_snapshot || undefined;
  const tourIdCodeSnapshot = i.tour_id_code_snapshot || bd.tour_id_code_snapshot || undefined;
  const codeMatch = rateIdSnapshot || i.tariff_code_snapshot || i.notes?.match(/^\[(TN-\d{3}|[A-Z]{3}-R\d{3})\]/)?.[1];

  return {
    id: i.id,
    tour_id: i.tour_id,
    tour_name: i.tour_name_snapshot,
    tour_date: i.tour_date,
    adults_count: i.adults_count || 1,
    children_count: i.children_count || 0,
    units_count: i.units_count || 1,
    legs_count: i.legs_count || bd.legs_count || 1,
    sale_price: Number(i.sale_price || 0),
    cost_applied: Number(i.cost_applied || 0),
    cost_currency: i.cost_currency || bd.native_currency || "USD",
    calculated_total_cost: Number(i.calculated_total_cost || i.cost_applied || 0),
    supplier_id: i.supplier_id,
    supplier_name: i.supplier_name_snapshot,
    voucher_ref: i.voucher_ref,
    included: i.tour_included_snapshot,
    not_included: i.tour_not_included_snapshot,
    tariff_code: codeMatch || undefined,
    pricing_model: i.pricing_model_snapshot || i.cost_type,
    calculation_formula: bd.formula || i.notes || undefined,
    external_fees: i.external_fees_snapshot || undefined,
    rate_id_snapshot: rateIdSnapshot,
    tour_id_code_snapshot: tourIdCodeSnapshot,
    is_manual_quote: Boolean(i.is_manual_quote ?? bd.is_manual_quote),
    is_manual_override: Boolean(i.is_manual_override ?? bd.is_manual_override),
    manual_override_reason: i.manual_override_reason || bd.manual_override_reason || undefined,
    hotel_zone_snapshot: i.hotel_zone_snapshot || bd.hotel_zone_snapshot || undefined,
    native_currency: i.native_currency || bd.native_currency || i.cost_currency || "USD",
    native_cost_applied: i.native_cost_applied !== null && i.native_cost_applied !== undefined
      ? Number(i.native_cost_applied)
      : (bd.native_cost_applied !== undefined && bd.native_cost_applied !== null ? Number(bd.native_cost_applied) : undefined),
    native_calculated_total_cost: i.native_calculated_total_cost !== null && i.native_calculated_total_cost !== undefined
      ? Number(i.native_calculated_total_cost)
      : (bd.native_calculated_total_cost !== undefined && bd.native_calculated_total_cost !== null ? Number(bd.native_calculated_total_cost) : undefined),
  };
}

