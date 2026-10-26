/**
 * CARTEIRA DE VIAGEM DO CLIENTE — TÍO NENÊ v0.1.43
 * Arquivo: src/lib/operational/walletOperations.ts
 *
 * Módulo para preparação, ciclo de vida, persistência e entrega da Carteira
 * de Viagem personalizada aos clientes da Tío Nenê Viagens.
 *
 * REGRAS CRÍTICAS DE NEGÓCIO E SEGURANÇA (TAREFA 26):
 * 1. INDEPENDÊNCIA E NÃO-MUTABILIDADE DO CONTRATO:
 *    A carteira é um documento operacional exclusivo do passageiro.
 *    Não altera o contrato oficial, nem seus PDFs históricos, nem as reservas operacionais.
 * 2. CONFIDENCIALIDADE FINANCEIRA ABSOLUTA:
 *    NENHUM valor de venda, custo de fornecedor, comissão interna ou margem
 *    pode constar na carteira, na mensagem de WhatsApp ou no PDF impresso.
 * 3. ORDENAÇÃO CRONOLÓGICA E APENAS SERVIÇOS CONTRATADOS:
 *    A programação diária deve ser estritamente cronológica e exibir apenas
 *    os serviços que constam nos itens do contrato.
 * 4. DADOS AUSENTES E INDEPENDÊNCIA DE FORNECEDORES:
 *    A falta de confirmação de fornecedor não impede a preparação da carteira.
 *    Dados pendentes aparecem como "Horário a confirmar", "Local de encontro a confirmar"
 *    e "Voucher pendente", sem inventar informações.
 * 5. CONFIRMAÇÃO EXPLÍCITA DE ENTREGA:
 *    Abrir o WhatsApp não marca a carteira como entregue. Exige confirmação
 *    explícita com registro de data, operador, canal e contato de destino.
 * 6. DETECÇÃO INTELIGENTE DE "NECESSITA ATUALIZAÇÃO":
 *    Compara o snapshot operacional no momento da entrega com as reservas atuais.
 *    Se horários, locais, datas ou vouchers forem alterados após a entrega,
 *    a carteira sinaliza "necessita_atualizacao" sem apagar o histórico de entregas.
 */

import { TOURS } from "@/data/tours";

export type WalletStatus =
  | "pendente"              // Contrato finalizado, carteira ainda não iniciada
  | "em_preparacao"         // Operador iniciou personalização e ajustes
  | "pronta"                // Carteira completa e validada, pronta para envio
  | "entregue"              // Formalmente entregue ao cliente (WhatsApp / impresso)
  | "necessita_atualizacao"; // Informações operacionais foram alteradas após a entrega

export interface TravelWalletItem {
  id: string; // ID da reserva operacional
  contract_item_id: string;
  product_name: string;
  tour_id_code?: string | null;
  tour_date: string;
  pickup_time?: string | null; // ex: "07:15" ou null
  pickup_location?: string | null; // ex: "Lobby Hotel Riu Palace" ou null
  hotel_zone?: string | null;
  voucher_ref?: string | null; // ex: "VCH-TN-2026-0042-01"
  supplier_confirmation_code?: string | null;
  supplier_id?: string | null;
  supplier_name?: string | null;
  reservation_status?: string | null;

  // Passageiros
  adults_count: number;
  children_count: number;
  infants_count: number;
  total_pax: number;

  // Orientações oficiais do passeio e personalizações do operador na carteira
  default_instructions?: string[];
  what_to_bring?: string[];
  important_info?: string[];
  operator_notes?: string | null; // Customização do operador para este passeio na carteira
  additional_meeting_instructions?: string | null;

  // Pendências
  has_pickup_pending: boolean;
  has_location_pending: boolean;
  has_voucher_pending: boolean;
}

export interface TravelWalletData {
  id?: string;
  contract_id: string;
  contract_number: string;
  client_id?: string | null;
  client_name: string;
  client_phone?: string | null;
  client_email?: string | null;
  client_cpf?: string | null;

  // Hotel e Estadia
  hotel_name?: string | null;
  hotel_zone?: string | null;
  travel_start_date?: string | null;
  travel_end_date?: string | null;

  // Logística de Voo / Aeroporto (quando disponível em arrivals ou contrato)
  arrival_flight_number?: string | null;
  arrival_flight_time?: string | null;
  depart_flight_number?: string | null;
  depart_flight_time?: string | null;

  // Passageiros
  adults_count: number;
  children_count: number;
  infants_count: number;
  total_pax: number;

  // Contatos de Suporte Oficial
  agency_name: string;
  support_contact_name: string;
  support_phone: string;
  support_whatsapp: string;
  emergency_duty_phone: string;

  // Conteúdo Personalizável da Carteira
  welcome_message: string;
  general_guidelines: string;
  client_recommendations: string;
  service_customizations: Record<
    string,
    { operator_notes?: string; additional_meeting_instructions?: string }
  >;

  // Programação Cronológica dos Serviços Contratados
  items: TravelWalletItem[];

  // Estado e Auditoria
  status: WalletStatus;
  version: number;
  pendencies: string[];
  needs_update_reasons: string[];

  // Dados da Última Entrega
  last_delivered_at?: string | null;
  last_delivered_by?: string | null;
  last_delivered_by_name?: string | null;
  last_delivered_to?: string | null;
  last_delivery_channel?: string | null;

  // Metadados
  created_at?: string;
  updated_at?: string;
}

export interface WalletDeliveryRecord {
  id: string;
  wallet_id: string;
  contract_id: string;
  delivered_at: string;
  delivered_by?: string | null;
  delivered_by_name: string;
  delivery_channel: string;
  destination_contact: string;
  wallet_version: number;
  notes?: string | null;
  created_at?: string;
}

export interface WalletKpis {
  totalEligible: number;
  pending: number;
  inPreparation: number;
  ready: number;
  delivered: number;
  needsUpdate: number;
}

export interface WalletFilters {
  searchTerm?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  onlyWithPendencies?: boolean;
}

// -----------------------------------------------------------------------------
// TEXTOS PADRÃO OFICIAIS TÍO NENÊ (PERSONALIZÁVEIS PELO OPERADOR)
// -----------------------------------------------------------------------------

export const DEFAULT_WELCOME_MESSAGE = `Bem-vindo a Cancún e à Riviera Maya! 🌴☀️

É um privilégio para a equipe Tío Nenê Viagens cuidar de cada detalhe da sua experiência no Caribe Mexicano.

Preparamos esta Carteira de Viagem exclusiva reunindo toda a sua programação diária, horários de embarque, orientações de cada passeio e contatos diretos do nosso concierge e plantão 24h.

Desejamos dias inesquecíveis, repletos de memórias mágicas!`;

export const DEFAULT_GENERAL_GUIDELINES = `📌 ORIENTAÇÕES ESSENCIAIS PARA SUA ESTADIA:

1. FUSO HORÁRIO:
Quintana Roo (Cancún, Riviera Maya e Tulum) opera no fuso horário do Leste (EST / UTC-5) e NÃO altera para horário de verão. Verifique o relógio do seu celular na chegada para garantir que está sincronizado.

2. MOEDA E CÂMBIO:
A moeda oficial é o Peso Mexicano (MXN), mas dólares americanos (USD) e cartões de débito/crédito internacionais (Wise, Nomad, etc.) são amplamente aceitos. Recomendamos ter uma pequena quantia em pesos mexicanos para gorjetas e pequenas compras artesanais.

3. TRASLADO NO AEROPORTO DE CANCÚN (ÁREA DE DESEMBARQUE):
Ao desembarcar e retirar suas bagagens, passe direto pelo saguão interno ("área dos tubarões" / vendedores de timeshare e táxis piratas). Dirija-se EXCLUSIVAMENTE para a área externa de transporte, onde nosso representante oficial estará aguardando com a placa da Tío Nenê ou seu nome.

4. HORÁRIOS DE PICKUP:
Recomendamos estar no lobby ou ponto de encontro indicado com pelo menos 10 minutos de antecedência ao horário previsto. Devido à logística dos hotéis, o transfer pode ter uma janela de tolerância de 10 a 15 minutos.`;

export const DEFAULT_CLIENT_RECOMMENDATIONS = `🌿 DICAS E RECOMENDAÇÕES PARA OS PASSEIOS:

• PROTETOR SOLAR E REPELENTE: Parques ecológicos (Xcaret, Xel-Há) e cenotes sagrados exigem OBRIGATORIAMENTE produtos 100% biodegradáveis sem químicos que prejudiquem os recifes de corais e a vida marinha.
• CALÇADOS: Em passeios arqueológicos (Chichén Itzá, Tulum) e parques aquáticos, utilize calçados confortáveis (tênis fechado ou sapatilhas aquáticas aquashoes).
• VESTIMENTA E TOALHAS: Lembre-se de retirar toalhas de praia no seu hotel antes de sair para passeios de barco e cenotes. Leve uma muda de roupa seca para a volta.
• GORJETAS NO MÉXICO: No México, a gorjeta (propina) é um costume cultural fortemente arraigado para guias, motoristas e garçons. O valor usual varia entre 10% e 15%.`;

export const DEFAULT_AGENCY_SUPPORT = {
  agency_name: "Tío Nenê Viagens Cancún",
  support_contact_name: "Equipe de Atendimento & Concierge",
  support_phone: "+52 998 845 2200",
  support_whatsapp: "+52 998 845 2200",
  emergency_duty_phone: "+52 998 123 4567 (Plantão 24h Operacional)",
};

// -----------------------------------------------------------------------------
// FUNÇÕES DE MONTAGEM E VALIDAÇÃO DA CARTEIRA
// -----------------------------------------------------------------------------

/**
 * Normaliza e busca informações ricas de orientações a partir do catálogo oficial de passeios.
 */
export function getTourCatalogGuidance(productName: string): {
  what_to_bring: string[];
  important_info: string[];
} {
  const norm = (productName || "").toLowerCase().trim();
  const matchedTour = TOURS.find(
    (t) =>
      norm.includes(t.slug.toLowerCase()) ||
      norm.includes(t.name.toLowerCase()) ||
      t.name.toLowerCase().includes(norm)
  );

  if (matchedTour) {
    return {
      what_to_bring: matchedTour.whatToBring || [],
      important_info: matchedTour.importantInfo || [],
    };
  }

  // Orientações genéricas de turismo seguro em Cancún caso passeio não mapeado
  return {
    what_to_bring: [
      "Documento de identificação com foto (ou cópia)",
      "Protetor solar e repelente 100% biodegradáveis",
      "Óculos de sol, chapéu ou boné",
      "Calçado confortável e toalha de praia",
      "Dinheiro em espécie (pesos mexicanos ou dólares) para despesas extras",
    ],
    important_info: [
      "Apresente-se no ponto de embarque com 10 minutos de antecedência.",
      "Mantenha o voucher ou cópia digital em mãos.",
      "Em caso de dúvidas ou atraso, contate imediatamente o plantão Tío Nenê.",
    ],
  };
}

/**
 * Constrói a Carteira de Viagem completa a partir dos dados do contrato,
 * reservas operacionais, chegadas e registros de personalização existentes.
 * Garante que APENAS serviços contratados sejam incluídos e ordenados cronologicamente.
 */
export function buildTravelWallet(params: {
  contract: any;
  reservations: any[];
  arrivals?: any | null;
  walletRecord?: any | null;
  deliveries?: WalletDeliveryRecord[];
}): TravelWalletData {
  const { contract, reservations = [], arrivals = null, walletRecord = null, deliveries = [] } = params;

  const contractId = contract.id;
  const contractNumber = contract.contract_number || "S/N";
  const clientName = contract.client_name || "Cliente";
  const clientPhone = contract.client_phone || null;
  const clientEmail = contract.client_email || null;
  const clientCpf = contract.client_cpf || null;

  // Estadia e Hotel
  const hotelName =
    arrivals?.hotel_name ||
    contract.hotel_name ||
    contract.hotels_schedule?.[0]?.hotel_name ||
    null;

  const hotelZone =
    arrivals?.hotel_zone ||
    contract.hotel_zone ||
    contract.hotels_schedule?.[0]?.zone ||
    null;

  const travelStartDate = arrivals?.arrival_date || contract.travel_start_date || contract.arrival_date || null;
  const travelEndDate = arrivals?.departure_date || contract.travel_end_date || contract.departure_date || null;

  // Passageiros
  const adultsCount = Number(contract.adults_count ?? arrivals?.adults_count ?? 1);
  const childrenCount = Number(contract.children_count ?? arrivals?.children_count ?? 0);
  const infantsCount = Number(contract.infants_count ?? arrivals?.infants_count ?? 0);
  const totalPax = adultsCount + childrenCount + infantsCount;

  // Personalizações existentes do operador
  const welcomeMessage =
    walletRecord?.welcome_message || DEFAULT_WELCOME_MESSAGE;
  const generalGuidelines =
    walletRecord?.general_guidelines || DEFAULT_GENERAL_GUIDELINES;
  const clientRecommendations =
    walletRecord?.client_recommendations || DEFAULT_CLIENT_RECOMMENDATIONS;
  const serviceCustomizations =
    walletRecord?.service_customizations || {};

  // Mapear apenas reservas ativas vinculadas a este contrato (NÃO incluir itens não contratados nem cancelados)
  const validReservations = reservations.filter(
    (r) =>
      r.contract_id === contractId &&
      r.status !== "cancelada" &&
      r.status !== "cancelado" &&
      r.cancellation_status !== "confirmado" &&
      r.cancellation_status !== "concluido"
  );

  // Ordenar cronologicamente por tour_date (serviços sem data vão para o final)
  validReservations.sort((a, b) => {
    const dateA = a.tour_date || "9999-12-31";
    const dateB = b.tour_date || "9999-12-31";
    if (dateA !== dateB) return dateA.localeCompare(dateB);
    const timeA = a.pickup_time || "23:59";
    const timeB = b.pickup_time || "23:59";
    return timeA.localeCompare(timeB);
  });

  const walletItems: TravelWalletItem[] = validReservations.map((r) => {
    const custom = serviceCustomizations[r.id] || {};
    const guidance = getTourCatalogGuidance(r.product_name);

    const hasPickupPending = !r.pickup_time || r.pickup_time.trim() === "";
    const hasLocationPending = !r.pickup_location || r.pickup_location.trim() === "";
    const hasVoucherPending = !r.voucher_ref || r.voucher_ref.trim() === "";

    return {
      id: r.id,
      contract_item_id: r.contract_item_id,
      product_name: r.product_name,
      tour_id_code: r.tour_id_code || null,
      tour_date: r.tour_date,
      pickup_time: r.pickup_time?.trim() || null,
      pickup_location: r.pickup_location?.trim() || hotelName || null,
      hotel_zone: r.hotel_zone || hotelZone || null,
      voucher_ref: r.voucher_ref?.trim() || null,
      supplier_confirmation_code: r.supplier_confirmation_code || null,
      supplier_id: r.supplier_id || null,
      supplier_name: r.supplier_name || null,
      reservation_status: r.status,
      adults_count: Number(r.adults_count || 1),
      children_count: Number(r.children_count || 0),
      infants_count: Number(r.infants_count || 0),
      total_pax:
        Number(r.adults_count || 1) +
        Number(r.children_count || 0) +
        Number(r.infants_count || 0),
      default_instructions: guidance.important_info,
      what_to_bring: guidance.what_to_bring,
      important_info: guidance.important_info,
      operator_notes: custom.operator_notes || null,
      additional_meeting_instructions: custom.additional_meeting_instructions || null,
      has_pickup_pending: hasPickupPending,
      has_location_pending: hasLocationPending,
      has_voucher_pending: hasVoucherPending,
    };
  });

  // Lista de pendências gerais da carteira
  const pendencies: string[] = [];
  if (!hotelName) pendencies.push("Hotel de hospedagem não informado");
  if (!clientPhone) pendencies.push("Telefone do cliente não cadastrado");

  const pendingPickups = walletItems.filter((i) => i.has_pickup_pending).length;
  if (pendingPickups > 0) {
    pendencies.push(`${pendingPickups} horário(s) de pickup a confirmar`);
  }

  const pendingVouchers = walletItems.filter((i) => i.has_voucher_pending).length;
  if (pendingVouchers > 0) {
    pendencies.push(`${pendingVouchers} voucher(s) pendente(s) de emissão`);
  }

  // Detecção de status da carteira e alterações operacionais após a entrega
  const lastDeliveredAt = walletRecord?.last_delivered_at || null;
  const lastSnapshot = walletRecord?.last_operational_snapshot || null;

  const changesAfterDelivery = detectOperationalChangesAfterDelivery({
    currentItems: walletItems,
    lastSnapshot,
    lastDeliveredAt,
  });

  let computedStatus: WalletStatus = "pendente";

  if (walletRecord?.status) {
    computedStatus = walletRecord.status;
  }

  // Se já foi entregue mas houve alteração operacional subsequente -> necessita_atualizacao
  if (lastDeliveredAt && changesAfterDelivery.length > 0) {
    computedStatus = "necessita_atualizacao";
  } else if (lastDeliveredAt) {
    computedStatus = "entregue";
  } else if (walletRecord?.status === "pronta") {
    computedStatus = "pronta";
  } else if (
    walletRecord?.status === "em_preparacao" ||
    Object.keys(serviceCustomizations).length > 0 ||
    walletRecord?.welcome_message
  ) {
    computedStatus = "em_preparacao";
  } else {
    computedStatus = "pendente";
  }

  return {
    id: walletRecord?.id,
    contract_id: contractId,
    contract_number: contractNumber,
    client_id: contract.client_id || null,
    client_name: clientName,
    client_phone: clientPhone,
    client_email: clientEmail,
    client_cpf: clientCpf,
    hotel_name: hotelName,
    hotel_zone: hotelZone,
    travel_start_date: travelStartDate,
    travel_end_date: travelEndDate,
    arrival_flight_number: arrivals?.arrival_flight_number || null,
    arrival_flight_time: arrivals?.arrival_flight_time || null,
    depart_flight_number: arrivals?.depart_flight_number || null,
    depart_flight_time: arrivals?.depart_flight_time || null,
    adults_count: adultsCount,
    children_count: childrenCount,
    infants_count: infantsCount,
    total_pax: totalPax,
    agency_name: DEFAULT_AGENCY_SUPPORT.agency_name,
    support_contact_name: DEFAULT_AGENCY_SUPPORT.support_contact_name,
    support_phone: DEFAULT_AGENCY_SUPPORT.support_phone,
    support_whatsapp: DEFAULT_AGENCY_SUPPORT.support_whatsapp,
    emergency_duty_phone: DEFAULT_AGENCY_SUPPORT.emergency_duty_phone,
    welcome_message: welcomeMessage,
    general_guidelines: generalGuidelines,
    client_recommendations: clientRecommendations,
    service_customizations: serviceCustomizations,
    items: walletItems,
    status: computedStatus,
    version: walletRecord?.version || 1,
    pendencies,
    needs_update_reasons: changesAfterDelivery,
    last_delivered_at: lastDeliveredAt,
    last_delivered_by: walletRecord?.last_delivered_by || null,
    last_delivered_by_name: walletRecord?.last_delivered_by_name || null,
    last_delivered_to: walletRecord?.last_delivered_to || null,
    last_delivery_channel: walletRecord?.last_delivery_channel || null,
    created_at: walletRecord?.created_at,
    updated_at: walletRecord?.updated_at,
  };
}

/**
 * Cria o snapshot operacional das reservas vinculadas ao contrato para posterior auditoria.
 */
export function buildOperationalSnapshot(items: TravelWalletItem[]): Record<string, any> {
  const snapshot: Record<string, any> = {};
  items.forEach((item) => {
    snapshot[item.id] = {
      product_name: item.product_name,
      tour_date: item.tour_date,
      pickup_time: item.pickup_time,
      pickup_location: item.pickup_location,
      voucher_ref: item.voucher_ref,
      supplier_confirmation_code: item.supplier_confirmation_code,
      reservation_status: item.reservation_status,
    };
  });
  return snapshot;
}

/**
 * Detecta alterações operacionais ocorridas após a entrega da carteira de viagem.
 * Compara os dados atuais das reservas com o snapshot gravado na última entrega.
 */
export function detectOperationalChangesAfterDelivery(params: {
  currentItems: TravelWalletItem[];
  lastSnapshot?: Record<string, any> | null;
  lastDeliveredAt?: string | null;
}): string[] {
  const { currentItems, lastSnapshot, lastDeliveredAt } = params;

  if (!lastDeliveredAt || !lastSnapshot || typeof lastSnapshot !== "object") {
    return [];
  }

  const reasons: string[] = [];

  currentItems.forEach((curr) => {
    const snap = lastSnapshot[curr.id];
    if (!snap) {
      reasons.push(`Novo serviço contratado adicionado à programação: ${curr.product_name}`);
      return;
    }

    if (snap.tour_date && curr.tour_date && snap.tour_date !== curr.tour_date) {
      reasons.push(
        `Data do passeio "${curr.product_name}" alterada de ${formatDate(snap.tour_date)} para ${formatDate(curr.tour_date)}`
      );
    }

    if ((snap.pickup_time || "") !== (curr.pickup_time || "")) {
      const oldTime = snap.pickup_time || "A confirmar";
      const newTime = curr.pickup_time || "A confirmar";
      reasons.push(
        `Horário de pickup de "${curr.product_name}" alterado de ${oldTime} para ${newTime}`
      );
    }

    if ((snap.pickup_location || "") !== (curr.pickup_location || "")) {
      const oldLoc = snap.pickup_location || "A confirmar";
      const newLoc = curr.pickup_location || "A confirmar";
      reasons.push(
        `Local de embarque de "${curr.product_name}" alterado de ${oldLoc} para ${newLoc}`
      );
    }

    if ((snap.voucher_ref || "") !== (curr.voucher_ref || "")) {
      const oldVch = snap.voucher_ref || "Pendente";
      const newVch = curr.voucher_ref || "Pendente";
      reasons.push(
        `Voucher de "${curr.product_name}" atualizado de ${oldVch} para ${newVch}`
      );
    }
  });

  // Verificar se algum item que estava no snapshot foi removido / cancelado
  Object.keys(lastSnapshot).forEach((id) => {
    const found = currentItems.some((i) => i.id === id);
    if (!found) {
      const oldItemName = lastSnapshot[id]?.product_name || "Serviço";
      reasons.push(`Serviço "${oldItemName}" foi cancelado ou removido da viagem.`);
    }
  });

  return reasons;
}

/**
 * Validação prévia dos dados para registro de entrega da carteira de viagem.
 */
export function validateWalletDelivery(params: {
  destinationContact?: string | null;
  deliveredByName?: string | null;
  channel?: string | null;
  itemsCount?: number;
}): { valid: boolean; error?: string } {
  const { destinationContact, deliveredByName, channel, itemsCount = 0 } = params;

  if (!destinationContact || destinationContact.trim() === "") {
    return {
      valid: false,
      error: "Contato de destino (telefone ou e-mail) é obrigatório para registrar a entrega.",
    };
  }

  // Validação simples de número de telefone (mínimo 8 dígitos)
  const digitsOnly = destinationContact.replace(/\D/g, "");
  if (digitsOnly.length < 8) {
    return {
      valid: false,
      error: "Número de telefone de destino inválido. Informe o número com DDD/DDI.",
    };
  }

  if (!deliveredByName || deliveredByName.trim() === "") {
    return {
      valid: false,
      error: "Responsável pelo envio é obrigatório para auditoria da entrega.",
    };
  }

  if (!channel || channel.trim() === "") {
    return {
      valid: false,
      error: "Canal de entrega (WhatsApp, E-mail ou Presencial) é obrigatório.",
    };
  }

  if (itemsCount === 0) {
    return {
      valid: false,
      error: "A carteira não possui serviços contratados para entrega.",
    };
  }

  return { valid: true };
}

/**
 * Executa uma entrega atômica simulada (espelhando a lógica transacional da RPC confirm_travel_wallet_delivery)
 * para testes rigorosos de concorrência, consistência transacional e integridade de rollback.
 */
export function simulateAtomicWalletDelivery(params: {
  wallet: {
    id: string;
    contract_id: string;
    delivered_version: number;
    status: WalletStatus;
    last_operational_snapshot?: Record<string, any>;
  };
  deliveries: WalletDeliveryRecord[];
  destinationContact: string;
  deliveredByName: string;
  channel: string;
  notes?: string | null;
  currentSnapshot: Record<string, any>;
  simulateFailureOnInsert?: boolean;
}): {
  success: boolean;
  error?: string;
  updatedWallet?: any;
  newDelivery?: WalletDeliveryRecord;
} {
  const {
    wallet,
    destinationContact,
    deliveredByName,
    channel,
    notes,
    currentSnapshot,
    simulateFailureOnInsert = false,
  } = params;

  // 1. Validação de parâmetros
  const val = validateWalletDelivery({
    destinationContact,
    deliveredByName,
    channel,
    itemsCount: 1,
  });

  if (!val.valid) {
    return { success: false, error: val.error };
  }

  // 2. Simulação de falha no meio da transação (Rollback garantido)
  if (simulateFailureOnInsert) {
    return {
      success: false,
      error: "Falha na transação ao gravar histórico: Rollback executado com sucesso.",
    };
  }

  // 3. Incremento atômico de delivered_version exatamente uma vez
  const newVersion = (wallet.delivered_version || 0) + 1;
  const nowIso = new Date().toISOString();
  const deliveryId = "deliv-" + Math.random().toString(36).substring(2, 9);

  const newDelivery: WalletDeliveryRecord = {
    id: deliveryId,
    wallet_id: wallet.id,
    contract_id: wallet.contract_id,
    delivered_at: nowIso,
    delivered_by_name: deliveredByName,
    delivery_channel: channel,
    destination_contact: destinationContact,
    wallet_version: newVersion,
    notes: notes || null,
    created_at: nowIso,
  };

  const updatedWallet = {
    ...wallet,
    status: "entregue" as WalletStatus,
    delivered_version: newVersion,
    last_operational_snapshot: currentSnapshot,
    last_delivered_at: nowIso,
    last_delivered_by_name: deliveredByName,
    last_delivered_to: destinationContact,
    last_delivery_channel: channel,
  };

  return {
    success: true,
    updatedWallet,
    newDelivery,
  };
}

/**
 * Validação rigorosa de segurança para tentativas de criação direta (INSERT) na tabela travel_wallets.
 * Espelha os GRANTs por coluna e o trigger check_travel_wallet_status_transition.
 */
export function validateDirectWalletInsert(params: {
  payload: {
    contract_id: string;
    client_id?: string | null;
    status?: WalletStatus;
    welcome_message?: string;
    general_guidelines?: string;
    client_recommendations?: string;
    service_customizations?: Record<string, any>;
    version?: number;
    delivered_version?: number;
    last_delivered_at?: string | null;
    last_delivered_to?: string | null;
    last_operational_snapshot?: Record<string, any>;
  };
  userRole: "admin" | "moderator" | "user" | "seller";
  isInDeliveryRpc?: boolean;
}): { allowed: boolean; error?: string } {
  const { payload, isInDeliveryRpc = false } = params;

  if (isInDeliveryRpc) {
    return { allowed: true };
  }

  // 1. Bloqueio de INSERT direto com status 'entregue'
  if (payload.status === "entregue") {
    return {
      allowed: false,
      error:
        "Acesso negado: a carteira não pode ser criada diretamente com status entregue. Utilize a função oficial confirm_travel_wallet_delivery.",
    };
  }

  // 2. Bloqueio de INSERT direto com delivered_version preenchido
  if (payload.delivered_version !== undefined && payload.delivered_version > 0) {
    return {
      allowed: false,
      error:
        "Acesso negado: permissão negada para a coluna delivered_version na criação direta de carteiras.",
    };
  }

  // 3. Bloqueio de INSERT direto com metadados de entrega preenchidos
  if (
    payload.last_delivered_at ||
    payload.last_delivered_to ||
    payload.last_operational_snapshot
  ) {
    return {
      allowed: false,
      error:
        "Acesso negado: permissão negada para colunas de entrega e snapshot na criação direta de carteiras.",
    };
  }

  // 4. Bloqueio de manipulação direta de version no INSERT
  if (payload.version !== undefined && payload.version !== 1) {
    return {
      allowed: false,
      error:
        "Acesso negado: permissão negada para a coluna version na criação direta de carteiras.",
    };
  }

  return { allowed: true };
}

/**
 * Validação rigorosa de segurança para tentativas de atualização direta na tabela travel_wallets.
 * Espelha as regras do trigger check_travel_wallet_status_transition e permissões por coluna.
 */
export function validateDirectWalletUpdate(params: {
  currentWallet: {
    status: WalletStatus;
    delivered_version: number;
    last_delivered_at?: string | null;
    last_delivered_by?: string | null;
    last_delivered_to?: string | null;
    last_delivery_channel?: string | null;
  };
  proposedUpdate: {
    status?: WalletStatus;
    delivered_version?: number;
    welcome_message?: string;
    last_delivered_at?: string | null;
    last_delivered_to?: string | null;
    last_delivery_channel?: string | null;
  };
  userRole: "admin" | "moderator" | "user" | "seller";
  isInDeliveryRpc?: boolean;
}): { allowed: boolean; error?: string } {
  const { currentWallet, proposedUpdate, isInDeliveryRpc = false } = params;

  // Se a operação estiver dentro do contexto da RPC legítima confirm_travel_wallet_delivery:
  if (isInDeliveryRpc) {
    return { allowed: true };
  }

  // 1. Bloqueio categorico para qualquer usuário de marcar status como 'entregue' diretamente
  if (proposedUpdate.status === "entregue") {
    return {
      allowed: false,
      error:
        "Acesso negado: a carteira não pode ser marcada como entregue diretamente. Utilize a função oficial confirm_travel_wallet_delivery para assegurar a auditoria e o registro no histórico de entregas.",
    };
  }

  // 2. Bloqueio de alteração direta de delivered_version fora da RPC
  if (
    proposedUpdate.delivered_version !== undefined &&
    proposedUpdate.delivered_version !== currentWallet.delivered_version
  ) {
    return {
      allowed: false,
      error:
        "Acesso negado: a versão entregue da carteira não pode ser modificada diretamente fora da função confirm_travel_wallet_delivery.",
    };
  }

  // 3. Bloqueio de alteração direta de metadados de entrega fora da RPC
  if (
    (proposedUpdate.last_delivered_at !== undefined &&
      proposedUpdate.last_delivered_at !== currentWallet.last_delivered_at) ||
    (proposedUpdate.last_delivered_to !== undefined &&
      proposedUpdate.last_delivered_to !== currentWallet.last_delivered_to) ||
    (proposedUpdate.last_delivery_channel !== undefined &&
      proposedUpdate.last_delivery_channel !== currentWallet.last_delivery_channel)
  ) {
    return {
      allowed: false,
      error:
        "Acesso negado: metadados de entrega não podem ser modificados diretamente fora da função confirm_travel_wallet_delivery.",
    };
  }

  // 4. Bloqueio de regressão indevida para 'pendente' se já possui histórico de entregas
  if (currentWallet.delivered_version > 0 && proposedUpdate.status === "pendente") {
    return {
      allowed: false,
      error:
        "Operação inválida: uma carteira com histórico de entregas não pode ser redefinida para pendente.",
    };
  }

  // 5. Edição de personalizações e status preparatórios ('em_preparacao', 'pronta') é permitida
  return { allowed: true };
}

/**
 * Gera mensagem personalizada e profissional para envio pelo WhatsApp ao cliente.
 * NÃO contém nenhuma informação financeira de venda nem custos internos.
 */
export function generateWalletWhatsAppMessage(wallet: TravelWalletData): string {
  const firstName = wallet.client_name ? wallet.client_name.split(" ")[0] : "Cliente";

  let msg = `Olá, *${firstName}*! Tudo bem?\n\n`;
  msg += `Aqui é da *${wallet.agency_name}* em Cancún! 🇲🇽✨\n\n`;
  msg += `É com muita alegria que preparamos e disponibilizamos a sua *Carteira de Viagem Oficial* (Contrato *${wallet.contract_number}*).\n\n`;

  if (wallet.travel_start_date) {
    const startStr = formatDate(wallet.travel_start_date);
    const endStr = wallet.travel_end_date ? formatDate(wallet.travel_end_date) : "";
    msg += `📅 *Período da Viagem:* ${startStr}${endStr ? " até " + endStr : ""}\n`;
  }
  if (wallet.hotel_name) {
    msg += `🏨 *Hospedagem:* ${wallet.hotel_name}${wallet.hotel_zone ? " (" + wallet.hotel_zone + ")" : ""}\n`;
  }
  msg += `👥 *Passageiros:* ${wallet.total_pax} pessoa(s)\n\n`;

  msg += `📋 *PROGRAMAÇÃO DOS SEUS PASSEIOS:*\n`;

  if (wallet.items.length === 0) {
    msg += `(Nenhum passeio agendado no momento)\n`;
  } else {
    wallet.items.forEach((item, idx) => {
      const dateFormatted = formatDate(item.tour_date);
      const pickupFormatted = item.pickup_time ? item.pickup_time : "A confirmar";
      const vchFormatted = item.voucher_ref ? `[${item.voucher_ref}]` : "";

      msg += `\n*${idx + 1}. ${item.product_name}*\n`;
      msg += `   • Data: ${dateFormatted}\n`;
      msg += `   • Horário de Pickup: ${pickupFormatted}\n`;
      if (item.pickup_location) {
        msg += `   • Local de Embarque: ${item.pickup_location}\n`;
      }
      if (vchFormatted) {
        msg += `   • Voucher: ${vchFormatted}\n`;
      }
      if (item.operator_notes && item.operator_notes.trim()) {
        msg += `   • Observação: ${item.operator_notes.trim()}\n`;
      }
    });
  }

  msg += `\n📌 *DICAS RÁPIDAS:*\n`;
  msg += `• Chegue ao lobby 10 minutos antes do horário de pickup.\n`;
  msg += `• Use protetor solar 100% biodegradável para preservação dos recifes e cenotes.\n`;
  msg += `• Qualquer imprevisto, contate nosso Plantão 24h: *${wallet.emergency_duty_phone}*.\n\n`;

  msg += `Desejamos a você e sua família momentos mágicos no Caribe!\n`;
  msg += `*${wallet.agency_name} — Sempre com você em Cancún*`;

  return msg;
}

/**
 * Calcula os indicadores rápidos de desempenho das carteiras.
 */
export function calculateWalletKpis(wallets: TravelWalletData[]): WalletKpis {
  let pending = 0;
  let inPreparation = 0;
  let ready = 0;
  let delivered = 0;
  let needsUpdate = 0;

  wallets.forEach((w) => {
    switch (w.status) {
      case "pendente":
        pending++;
        break;
      case "em_preparacao":
        inPreparation++;
        break;
      case "pronta":
        ready++;
        break;
      case "entregue":
        delivered++;
        break;
      case "necessita_atualizacao":
        needsUpdate++;
        break;
    }
  });

  return {
    totalEligible: wallets.length,
    pending,
    inPreparation,
    ready,
    delivered,
    needsUpdate,
  };
}

/**
 * Filtra as carteiras com base nos parâmetros de busca e status.
 */
export function filterWallets(
  wallets: TravelWalletData[],
  filters: WalletFilters
): TravelWalletData[] {
  return wallets.filter((w) => {
    // 1. Termo de busca (cliente, contrato, hotel)
    if (filters.searchTerm && filters.searchTerm.trim() !== "") {
      const term = filters.searchTerm.toLowerCase().trim();
      const matchClient = w.client_name.toLowerCase().includes(term);
      const matchContract = w.contract_number.toLowerCase().includes(term);
      const matchHotel = (w.hotel_name || "").toLowerCase().includes(term);
      const matchPhone = (w.client_phone || "").includes(term);
      if (!matchClient && !matchContract && !matchHotel && !matchPhone) {
        return false;
      }
    }

    // 2. Status da carteira
    if (filters.status && filters.status !== "all") {
      if (w.status !== filters.status) {
        return false;
      }
    }

    // 3. Período da viagem (data de início)
    if (filters.startDate && w.travel_start_date) {
      if (w.travel_start_date < filters.startDate) return false;
    }
    if (filters.endDate && w.travel_start_date) {
      if (w.travel_start_date > filters.endDate) return false;
    }

    // 4. Apenas com pendências
    if (filters.onlyWithPendencies) {
      if (w.pendencies.length === 0) return false;
    }

    return true;
  });
}

/**
 * Formata data ISO para padrão brasileiro (DD/MM/AAAA).
 */
export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "A confirmar";
  try {
    const parts = dateStr.split("T")[0].split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return new Date(dateStr).toLocaleDateString("pt-BR");
  } catch {
    return dateStr;
  }
}

/**
 * Retorna o dia da semana em português a partir da data ISO.
 */
export function getWeekdayName(dateStr?: string | null): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr + "T12:00:00");
    const weekdays = [
      "Domingo",
      "Segunda-feira",
      "Terça-feira",
      "Quarta-feira",
      "Quinta-feira",
      "Sexta-feira",
      "Sábado",
    ];
    return weekdays[date.getDay()] || "";
  } catch {
    return "";
  }
}
