/**
 * CENTRAL DE CHEGADAS E TRASLADOS — TÍO NENÊ v0.1.43
 * Arquivo: src/lib/operational/arrivalOperations.ts
 *
 * Módulo para consolidação, enriquecimento, derivação de status e mensageria
 * das chegadas de turistas a Cancún e reservas operacionais de traslado vinculadas.
 *
 * REGRAS CRÍTICAS DE SEGURANÇA E NEGÓCIO:
 * 1. DADOS FINANCEIROS ISOLADOS:
 *    NUNCA incluir valores de venda, custos de fornecedores, margens ou dados financeiros
 *    em mensagens de WhatsApp, componentes ou consultas acessíveis a vendedores.
 * 2. FONTE ÚNICA DA VERDADE:
 *    O status da chegada é derivado e sincronizado com a reserva de traslado correspondente,
 *    evitando duplicidade de estados.
 * 3. TRASLADO NÃO CONTRATADO:
 *    Quando o contrato não possuir serviço de traslado, indicar claramente "Não contratado"
 *    e acompanhar a chegada como recepção/atendimento no aeroporto. Nunca criar traslado fictício.
 * 4. DADOS AUSENTES:
 *    Apresentar claramente "Não informado" ou "A confirmar", sem inventar voos ou hotéis.
 */

export type ArrivalOperationalStatus =
  | "pendente_info"          // Faltam dados críticos (voo ou hotel)
  | "aguardando_solicitacao"   // Dados completos, solicitação de transfer ainda não enviada
  | "solicitada"             // Solicitação de transfer enviada ao fornecedor
  | "confirmada"             // Traslado ou chegada confirmada com código/voucher
  | "em_atendimento"         // Turista no aeroporto / em trânsito
  | "concluida"              // Turista recebido e acomodado no hotel
  | "cancelada";             // Chegada ou contrato cancelado

export interface ArrivalDisplayItem {
  id: string; // Arrival ID
  contract_id: string;
  contract_number: string;
  contract_status: string;
  seller_name?: string | null;
  client_id?: string | null;
  client_name: string;
  client_phone?: string | null;
  client_email?: string | null;
  client_cpf?: string | null;

  // Informações de Voo e Logística
  arrival_date: string;
  departure_date?: string | null;
  arrival_flight_number?: string | null;
  arrival_flight_time?: string | null;
  depart_flight_number?: string | null;
  depart_flight_time?: string | null;

  // Passageiros
  adults_count: number;
  children_count: number;
  infants_count: number;
  total_pax: number;

  // Hotel e Região
  hotel_name?: string | null;
  hotel_zone?: string | null;
  hotels_schedule?: any[];

  // Status e Atendimento
  status: ArrivalOperationalStatus;
  raw_arrival_status: string;
  assigned_agent?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;

  // Traslado Vinculado (se contratado)
  has_transfer: boolean;
  transfer_reservation_id?: string | null;
  transfer_contract_item_id?: string | null;
  transfer_product_name?: string | null;
  transfer_supplier_id?: string | null;
  transfer_supplier_name?: string | null;
  transfer_supplier_phone?: string | null;
  transfer_supplier_whatsapp?: string | null;
  transfer_status?: string | null;
  transfer_pickup_time?: string | null;
  transfer_voucher_ref?: string | null;
  transfer_confirmation_code?: string | null;

  // Pendências Detectadas
  pendencies: string[];
}

export interface ArrivalKpiSummary {
  arrivalsTodayCount: number;
  arrivalsTomorrowCount: number;
  pendingInfoCount: number;
  awaitingConfirmationCount: number;
  confirmedCount: number;
  completedCount: number;
  totalArrivalsCount: number;
}

export interface ArrivalFilters {
  startDate?: string;
  endDate?: string;
  status?: string; // "todos" | ArrivalOperationalStatus
  hotelOrZone?: string;
  supplierId?: string;
  flightNumber?: string;
  clientName?: string;
}

/**
 * Detecta se o nome do produto ou código representa um serviço de traslado/transfer.
 */
export function isTransferProduct(productName?: string | null, tourCode?: string | null): boolean {
  if (!productName && !tourCode) return false;
  const p = (productName || "").toLowerCase();
  const c = (tourCode || "").toLowerCase();
  return (
    p.includes("transfer") ||
    p.includes("traslado") ||
    p.includes("aeroporto") ||
    p.includes("in/out") ||
    p.includes("in out") ||
    p.includes("chegada") ||
    c.startsWith("trf") ||
    c.includes("transfer") ||
    c.includes("traslado")
  );
}

/**
 * Deriva o status operacional único da chegada, sincronizando com a reserva de traslado quando houver.
 */
export function deriveArrivalStatus(params: {
  rawStatus?: string | null;
  hasTransfer: boolean;
  transferStatus?: string | null;
  flightNumber?: string | null;
  flightTime?: string | null;
  hotelName?: string | null;
}): ArrivalOperationalStatus {
  const { rawStatus, hasTransfer, transferStatus, flightNumber, flightTime, hotelName } = params;

  // 1. Cancelamento
  if (
    rawStatus === "cancelado" ||
    rawStatus === "cancelada" ||
    (hasTransfer && transferStatus === "cancelada")
  ) {
    return "cancelada";
  }

  // 2. Concluído / Atendido
  if (
    rawStatus === "atendido" ||
    rawStatus === "concluido" ||
    rawStatus === "concluida" ||
    (hasTransfer && transferStatus === "realizada")
  ) {
    return "concluida";
  }

  // 3. Em atendimento / Trânsito
  if (rawStatus === "em_transito" || rawStatus === "em_atendimento") {
    return "em_atendimento";
  }

  // 4. Detecção de informações ausentes obrigatórias
  const missingFlight = !flightNumber || flightNumber.trim() === "";
  const missingTime = !flightTime || flightTime.trim() === "";
  const missingHotel =
    !hotelName ||
    hotelName.trim() === "" ||
    hotelName.toLowerCase().includes("confirmar") ||
    hotelName.toLowerCase().includes("definir");

  if (missingFlight || missingTime || missingHotel || rawStatus === "pendente_info") {
    return "pendente_info";
  }

  // 5. Se possui traslado contratado, o status deriva da reserva operacional do traslado
  if (hasTransfer) {
    if (transferStatus === "confirmada") {
      return "confirmada";
    }
    if (transferStatus === "solicitada" || transferStatus === "aguardando_fornecedor") {
      return "solicitada";
    }
    if (transferStatus === "pendente_info") {
      return "pendente_info";
    }
    return "aguardando_solicitacao";
  }

  // 6. Chegada sem traslado (recepção geral)
  if (rawStatus === "confirmada") {
    return "confirmada";
  }

  return "confirmada"; // Dados completos e agendada
}

/**
 * Detecta pendências operacionais críticas de uma chegada.
 */
export function detectArrivalPendencies(arrival: Partial<ArrivalDisplayItem>): string[] {
  const pendencies: string[] = [];

  const flightNum = arrival.arrival_flight_number?.trim();
  const flightTime = arrival.arrival_flight_time?.trim();
  const hotel = arrival.hotel_name?.trim();

  if (!flightNum) {
    pendencies.push("Número do voo de chegada não informado");
  }
  if (!flightTime) {
    pendencies.push("Horário previsto do voo não informado");
  }
  if (!hotel || hotel.toLowerCase().includes("confirmar") || hotel.toLowerCase().includes("definir")) {
    pendencies.push("Hotel de destino a confirmar");
  }

  if (arrival.has_transfer) {
    if (!arrival.transfer_supplier_name) {
      pendencies.push("Traslado sem fornecedor definido");
    }
    if (arrival.transfer_status === "pendente" || arrival.status === "aguardando_solicitacao") {
      pendencies.push("Solicitação de traslado aguardando envio ao fornecedor");
    } else if (arrival.transfer_status === "solicitada") {
      pendencies.push("Aguardando confirmação e voucher do fornecedor de traslado");
    }
  }

  return pendencies;
}

/**
 * Calcula os indicadores rápidos da Central de Chegadas.
 */
export function calculateArrivalKpis(
  arrivals: ArrivalDisplayItem[],
  referenceDateStr?: string
): ArrivalKpiSummary {
  const ref = referenceDateStr ? new Date(referenceDateStr + "T12:00:00") : new Date();
  const todayStr = ref.toISOString().split("T")[0];

  const tomorrow = new Date(ref);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  let arrivalsTodayCount = 0;
  let arrivalsTomorrowCount = 0;
  let pendingInfoCount = 0;
  let awaitingConfirmationCount = 0;
  let confirmedCount = 0;
  let completedCount = 0;

  for (const item of arrivals) {
    if (item.status === "cancelada") {
      continue;
    }

    if (item.arrival_date === todayStr) {
      arrivalsTodayCount++;
    }
    if (item.arrival_date === tomorrowStr) {
      arrivalsTomorrowCount++;
    }

    if (item.status === "pendente_info" || item.pendencies.length > 0) {
      pendingInfoCount++;
    }
    if (item.status === "aguardando_solicitacao" || item.status === "solicitada") {
      awaitingConfirmationCount++;
    }
    if (item.status === "confirmada") {
      confirmedCount++;
    }
    if (item.status === "concluida") {
      completedCount++;
    }
  }

  return {
    arrivalsTodayCount,
    arrivalsTomorrowCount,
    pendingInfoCount,
    awaitingConfirmationCount,
    confirmedCount,
    completedCount,
    totalArrivalsCount: arrivals.length,
  };
}

/**
 * Aplica os filtros na listagem de chegadas.
 */
export function filterArrivals(
  arrivals: ArrivalDisplayItem[],
  filters: ArrivalFilters
): ArrivalDisplayItem[] {
  const { startDate, endDate, status, hotelOrZone, supplierId, flightNumber, clientName } = filters;

  return arrivals.filter((item) => {
    // Filtro por Data Inicial
    if (startDate && item.arrival_date < startDate) {
      return false;
    }

    // Filtro por Data Final
    if (endDate && item.arrival_date > endDate) {
      return false;
    }

    // Filtro por Status
    if (status && status !== "todos") {
      if (item.status !== status) {
        return false;
      }
    }

    // Filtro por Fornecedor (do traslado)
    if (supplierId && supplierId !== "todos") {
      if (item.transfer_supplier_id !== supplierId) {
        return false;
      }
    }

    // Filtro por Hotel ou Zona
    if (hotelOrZone && hotelOrZone.trim() !== "") {
      const q = hotelOrZone.toLowerCase().trim();
      const matchHotel = item.hotel_name?.toLowerCase().includes(q);
      const matchZone = item.hotel_zone?.toLowerCase().includes(q);
      if (!matchHotel && !matchZone) {
        return false;
      }
    }

    // Filtro por Número do Voo
    if (flightNumber && flightNumber.trim() !== "") {
      const q = flightNumber.toLowerCase().trim();
      const matchArr = item.arrival_flight_number?.toLowerCase().includes(q);
      const matchDep = item.depart_flight_number?.toLowerCase().includes(q);
      if (!matchArr && !matchDep) {
        return false;
      }
    }

    // Filtro por Nome do Cliente / Contrato
    if (clientName && clientName.trim() !== "") {
      const q = clientName.toLowerCase().trim();
      const matchClient = item.client_name?.toLowerCase().includes(q);
      const matchContract = item.contract_number?.toLowerCase().includes(q);
      const matchPhone = item.client_phone?.toLowerCase().includes(q);
      if (!matchClient && !matchContract && !matchPhone) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Prepara mensagem profissional para envio ao fornecedor ou responsável pelo traslado via WhatsApp.
 * NÃO inclui nenhuma informação financeira, preço, margem ou custo.
 */
export function generateArrivalWhatsAppMessage(
  arrival: ArrivalDisplayItem,
  agencyName: string = "Tío Nenê Viagens"
): string {
  const formattedDate = arrival.arrival_date
    ? new Date(arrival.arrival_date + "T12:00:00").toLocaleDateString("pt-BR")
    : "Data a definir";

  const paxParts: string[] = [];
  if (arrival.adults_count > 0) {
    paxParts.push(`${arrival.adults_count} adulto${arrival.adults_count > 1 ? "s" : ""}`);
  }
  if (arrival.children_count > 0) {
    paxParts.push(`${arrival.children_count} criança${arrival.children_count > 1 ? "s" : ""}`);
  }
  if (arrival.infants_count > 0) {
    paxParts.push(`${arrival.infants_count} bebê${arrival.infants_count > 1 ? "s" : ""}`);
  }
  const paxStr = paxParts.length > 0 ? paxParts.join(", ") : `${arrival.total_pax || 1} passageiro(s)`;

  const flightNum = arrival.arrival_flight_number?.trim() || "Não informado";
  const flightTime = arrival.arrival_flight_time?.trim() || "Não informado";
  const hotelStr = arrival.hotel_name?.trim() || "Não informado";
  const zoneStr = arrival.hotel_zone?.trim() ? ` (Zona: ${arrival.hotel_zone.trim()})` : "";
  const contractRef = arrival.contract_number ? ` [Contrato Ref: ${arrival.contract_number}]` : "";
  const serviceName = arrival.transfer_product_name || "Recepção / Traslado Aeroporto de Cancún";

  let msg = `Olá, equipe ${arrival.transfer_supplier_name || "Operacional"}! Tudo bem?\n\n`;
  msg += `Aqui é da Central Operacional de Chegadas da *${agencyName}* em Cancún.\n`;
  msg += `Gostaríamos de confirmar os dados de atendimento do seguinte cliente:\n\n`;
  msg += `📋 *Serviço:* ${serviceName}${contractRef}\n`;
  msg += `📅 *Data de Chegada:* ${formattedDate}\n`;
  msg += `✈️ *Número do Voo:* ${flightNum}\n`;
  msg += `⏰ *Horário Previsto do Voo:* ${flightTime}\n`;
  msg += `👤 *Cliente Responsável:* ${arrival.client_name}\n`;
  msg += `👥 *Passageiros:* ${paxStr}\n`;
  msg += `🏨 *Hotel de Destino:* ${hotelStr}${zoneStr}\n`;

  if (arrival.departure_date) {
    const depDate = new Date(arrival.departure_date + "T12:00:00").toLocaleDateString("pt-BR");
    const depFlight = arrival.depart_flight_number ? ` (Voo ${arrival.depart_flight_number})` : "";
    msg += `🛫 *Data de Retorno Prevista:* ${depDate}${depFlight}\n`;
  }

  if (arrival.notes && arrival.notes.trim()) {
    msg += `ℹ️ *Observações Operacionais:* ${arrival.notes.trim()}\n`;
  }

  msg += `\nSolicitamos a gentileza de nos confirmar a escala e o código/voucher de confirmação.\n\n`;
  msg += `Muito obrigado pelo excelente atendimento!\n`;
  msg += `*${agencyName} — Central de Chegadas e Operações*`;

  return msg;
}
