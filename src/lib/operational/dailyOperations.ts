/**
 * PAINEL DE OPERAÇÕES DIÁRIAS — TÍO NENÊ v0.1.43
 * Arquivo: src/lib/operational/dailyOperations.ts
 *
 * Módulo de domínio para consolidação operacional em tempo real:
 * - Acompanhamento de chegadas, traslados, passeios, reservas, vouchers e carteiras.
 * - Resumo do dia e cálculo estrito de KPIs operacionais (sem inventar números).
 * - Agenda cronológica com separação explícita de serviços sem horário confirmado.
 * - Central de Pendências classificada por matriz de prioridade (proximidade e gravidade).
 * - Identificação e destaque de situações críticas urgentes.
 * - Ações rápidas com roteamento para os módulos especializados.
 * - Confidencialidade absoluta: ZERO dados financeiros consultados ou expostos.
 */

import { OperationalReservationStatus } from "@/types/operational";
import { VoucherOperationalStatus, deriveVoucherStatus } from "@/lib/operational/voucherOperations";
import {
  ArrivalOperationalStatus,
  isTransferProduct,
  deriveArrivalStatus,
} from "@/lib/operational/arrivalOperations";
import { WalletStatus } from "@/lib/operational/walletOperations";

// =============================================================================
// TIPOS E MODELOS DE DADOS
// =============================================================================

export type DailyOperationalServiceType = "passeio" | "traslado" | "chegada";

export type DailyPickupStatus =
  | "confirmado"       // Horário e local definidos
  | "pendente_horario" // Local definido, horário pendente
  | "pendente_local"   // Horário definido, local pendente
  | "pendente_total"   // Horário e local pendentes
  | "nao_aplicavel";   // Não se aplica (ex: recepção geral aeroporto sem transfer)

export interface DailyServiceItem {
  id: string; // ID da reserva operacional ou da chegada
  serviceType: DailyOperationalServiceType;
  title: string; // Nome do passeio, traslado ou voo
  date: string; // YYYY-MM-DD
  time: string | null; // HH:mm (ou null se não confirmado)
  hasConfirmedTime: boolean;

  // Cliente e Contrato
  clientId?: string | null;
  clientName: string;
  clientPhone?: string | null;
  clientEmail?: string | null;
  contractId: string;
  contractNumber: string;
  contractStatus: string;

  // Localização e Logística
  hotelName?: string | null;
  hotelZone?: string | null;
  pickupLocation?: string | null;
  pickupStatus: DailyPickupStatus;

  // Passageiros
  adultsCount: number;
  childrenCount: number;
  infantsCount: number;
  totalPax: number;

  // Fornecedor Responsável
  supplierId?: string | null;
  supplierName: string;
  supplierPhone?: string | null;
  supplierWhatsapp?: string | null;
  supplierConfirmationCode?: string | null;

  // Status Operacional e Documental
  operationalStatus: OperationalReservationStatus | ArrivalOperationalStatus;
  voucherStatus: VoucherOperationalStatus | "nao_aplicavel";
  voucherRef?: string | null;

  // Instruções e Notas Operacionais
  specialInstructions?: string | null;
  notes?: string | null;

  // Gravidade e Pendências
  isCritical: boolean;
  criticalReasons: string[];
  pendencies: string[];
  isCancelled: boolean;
  isCancelledInconsistency: boolean; // Contrato cancelado com reserva ainda ativa
}

export interface DailyOperationsKpis {
  chegadasPrevistas: number;
  trasladosProgramados: number;
  passeiosProgramados: number;
  reservasAguardandoConfirmacao: number;
  pickupsPendentes: number;
  vouchersPendentes: number;
  carteirasNecessitamAtualizacao: number;
  ocorrenciasAbertas: number;
  tarefasVencidas: number;
  tarefasCriticasPendentes: number;
}

export type OperationalPendencyPriority = "critica" | "alta" | "media" | "baixa";

export type OperationalPendencyCategory =
  | "fornecedor_pendente"
  | "pickup_ausente"
  | "local_ausente"
  | "voucher_pendente"
  | "chegada_incompleta"
  | "carteira_desatualizada"
  | "inconsistencia_cancelamento"
  | "ocorrencia";

export interface OperationalPendencyItem {
  id: string;
  priority: OperationalPendencyPriority;
  category: OperationalPendencyCategory;
  title: string;
  description: string;
  clientName: string;
  contractId: string;
  contractNumber: string;
  serviceId?: string;
  serviceName: string;
  serviceDate: string;
  daysUntilService: number; // 0 = hoje, 1 = amanhã, < 0 = passado
  quickActionType: "contrato" | "reserva" | "chegada" | "voucher" | "carteira" | "ocorrencia";
  quickActionUrl: string;
}

export type DatePreset = "today" | "tomorrow" | "next7" | "custom";

export interface DailyOperationsFilters {
  datePreset: DatePreset;
  startDate?: string;
  endDate?: string;
  serviceType: "todos" | DailyOperationalServiceType;
  supplierId: string; // "todos" ou ID
  operationalStatus: string; // "todos" ou status específico
  pendencyFilter: "todos" | "com_pendencias" | "sem_pendencias";
  searchTerm: string;
}

// =============================================================================
// UTILITÁRIOS DE DATA E INTERVALO
// =============================================================================

/**
 * Retorna a data no formato YYYY-MM-DD em horário local seguro.
 */
export function toIsoDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Calcula a diferença em dias corridos entre uma data de serviço (YYYY-MM-DD) e a data de referência.
 */
export function getDaysDiff(serviceDate: string, refDateStr?: string): number {
  const refStr = refDateStr || toIsoDate(new Date());
  const [sy, sm, sd] = serviceDate.split("-").map(Number);
  const [ry, rm, rd] = refStr.split("-").map(Number);

  const dService = new Date(sy, sm - 1, sd);
  const dRef = new Date(ry, rm - 1, rd);

  const diffTime = dService.getTime() - dRef.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Retorna as datas de início e fim para cada preset temporal.
 */
export function getDateRangeForPreset(
  preset: DatePreset,
  refDateStr?: string,
  customStart?: string,
  customEnd?: string
): { startDate: string; endDate: string } {
  const base = refDateStr ? new Date(refDateStr + "T12:00:00") : new Date();
  const todayStr = toIsoDate(base);

  if (preset === "today") {
    return { startDate: todayStr, endDate: todayStr };
  }

  if (preset === "tomorrow") {
    const tom = new Date(base);
    tom.setDate(tom.getDate() + 1);
    const tomStr = toIsoDate(tom);
    return { startDate: tomStr, endDate: tomStr };
  }

  if (preset === "next7") {
    const end = new Date(base);
    end.setDate(end.getDate() + 6); // Próximos 7 dias incluindo hoje
    return { startDate: todayStr, endDate: toIsoDate(end) };
  }

  // Custom
  return {
    startDate: customStart || todayStr,
    endDate: customEnd || customStart || todayStr,
  };
}

/**
 * Formata um rótulo legível em português para a data (ex: "Seg, 26/10/2026").
 */
export function formatDateLabel(dateStr: string): string {
  if (!dateStr || !dateStr.includes("-")) return "A definir";
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const dayName = weekdays[dt.getDay()];
  return `${dayName}, ${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
}

// =============================================================================
// VALIDAÇÃO E DERIVAÇÃO DE PICKUP E CRITICIDADE
// =============================================================================

/**
 * Determina o status do pickup a partir do horário e ponto de encontro.
 */
export function derivePickupStatus(
  time?: string | null,
  location?: string | null,
  hotel?: string | null
): DailyPickupStatus {
  const effectiveLoc = (location || hotel || "").trim();
  const hasTime = Boolean(
    time &&
      time.trim() !== "" &&
      !time.toLowerCase().includes("confirmar") &&
      !time.toLowerCase().includes("definir")
  );
  const hasLoc = Boolean(
    effectiveLoc &&
      !effectiveLoc.toLowerCase().includes("confirmar") &&
      !effectiveLoc.toLowerCase().includes("definir")
  );

  if (hasTime && hasLoc) return "confirmado";
  if (hasLoc && !hasTime) return "pendente_horario";
  if (hasTime && !hasLoc) return "pendente_local";
  return "pendente_total";
}

/**
 * Identifica se uma situação é operacionalmente crítica, exigindo atenção urgente.
 */
export function isServiceCritical(
  service: {
    date: string;
    operationalStatus: string;
    hasConfirmedTime: boolean;
    pickupStatus: DailyPickupStatus;
    voucherStatus: string;
    isCancelled: boolean;
    isCancelledInconsistency?: boolean;
    serviceType: DailyOperationalServiceType;
    hotelName?: string | null;
  },
  refDateStr?: string
): { isCritical: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const diff = getDaysDiff(service.date, refDateStr);

  // Inconsistência de cancelamento: Contrato cancelado mas serviço ativo
  if (service.isCancelledInconsistency) {
    reasons.push("Contrato cancelado, porém serviço ainda consta ativo na operação");
  }

  // Não alertar registros que já estão cancelados de forma consistente
  if (service.isCancelled && !service.isCancelledInconsistency) {
    return { isCritical: false, reasons: [] };
  }

  // SERVIÇOS DE HOJE (diff === 0)
  if (diff === 0) {
    const isUnconfirmed =
      service.operationalStatus === "pendente" ||
      service.operationalStatus === "solicitada" ||
      service.operationalStatus === "aguardando_fornecedor" ||
      service.operationalStatus === "pendente_info";

    if (isUnconfirmed) {
      reasons.push("Serviço de hoje sem confirmação do fornecedor");
    }

    if (!service.hasConfirmedTime) {
      reasons.push("Serviço de hoje sem horário de pickup confirmado");
    }

    if (service.pickupStatus === "pendente_local" || service.pickupStatus === "pendente_total") {
      reasons.push("Serviço de hoje sem ponto de encontro ou hotel definido");
    }

    if (service.voucherStatus === "pendente" || service.voucherStatus === "em_preparacao") {
      reasons.push("Serviço de hoje com voucher ainda pendente de emissão");
    }
  }

  // SERVIÇOS DE AMANHÃ (diff === 1)
  if (diff === 1) {
    const isUnconfirmed =
      service.operationalStatus === "pendente" ||
      service.operationalStatus === "solicitada" ||
      service.operationalStatus === "aguardando_fornecedor";

    if (isUnconfirmed) {
      reasons.push("Serviço de amanhã aguardando confirmação do fornecedor");
    }

    if (!service.hasConfirmedTime) {
      reasons.push("Serviço de amanhã sem horário de pickup definido");
    }

    if (service.voucherStatus === "pendente") {
      reasons.push("Voucher pendente próximo da data do serviço (amanhã)");
    }
  }

  // CHEGADA IMINENTE COM DADOS INCOMPLETOS (Hoje ou amanhã)
  if (service.serviceType === "chegada" && (diff === 0 || diff === 1)) {
    if (service.operationalStatus === "pendente_info" || !service.hotelName) {
      reasons.push("Chegada iminente com dados incompletos (voo ou hotel ausente)");
    }
  }

  return {
    isCritical: reasons.length > 0,
    reasons,
  };
}

// =============================================================================
// CONSTRUÇÃO UNIFICADA DE SERVIÇOS OPERACIONAIS
// =============================================================================

/**
 * Constrói a lista normalizada de serviços a partir das reservas operacionais e chegadas,
 * respeitando os nomes oficiais e cruzando dados existentes.
 */
export function buildDailyOperationalServices(params: {
  reservations: any[];
  arrivals?: any[];
  refDateStr?: string;
}): DailyServiceItem[] {
  const { reservations = [], arrivals = [], refDateStr } = params;
  const items: DailyServiceItem[] = [];

  // 1. Processar Reservas Operacionais (Passeios e Traslados)
  reservations.forEach((r) => {
    const contract = r.contracts || {};
    const contractStatus = (contract.status || "").toLowerCase().trim();
    const resStatus = (r.status || "pendente").toLowerCase().trim();

    const isContractCancelled = contractStatus === "cancelado" || contractStatus === "cancelada";
    const isResCancelled = resStatus === "cancelada" || resStatus === "cancelado";

    // Detectar inconsistência de cancelamento
    const isCancelledInconsistency = isContractCancelled && !isResCancelled;

    // Tipo de serviço: Passeio vs Traslado
    const isTransfer = isTransferProduct(r.product_name, r.tour_id_code);
    const serviceType: DailyOperationalServiceType = isTransfer ? "traslado" : "passeio";

    // Horário de pickup
    const rawTime = r.pickup_time ? String(r.pickup_time).trim() : null;
    const hasConfirmedTime = Boolean(
      rawTime &&
        rawTime !== "" &&
        !rawTime.toLowerCase().includes("confirmar") &&
        !rawTime.toLowerCase().includes("definir")
    );

    // Hotel e local
    const hotel =
      r.pickup_location ||
      contract.hotel_name ||
      contract.hotels_schedule?.[0]?.hotel_name ||
      null;

    const zone =
      r.hotel_zone ||
      contract.hotel_zone ||
      contract.hotels_schedule?.[0]?.zone ||
      null;

    const pickupStatus = derivePickupStatus(rawTime, r.pickup_location, hotel);

    // Status do Voucher
    const vStatus = deriveVoucherStatus(r, contract.status);

    // Passageiros
    const adults = Number(r.adults_count ?? 1);
    const children = Number(r.children_count ?? 0);
    const infants = Number(r.infants_count ?? 0);
    const totalPax = adults + children + infants;

    // Fornecedor
    const supp = r.suppliers || {};
    const supplierName = r.supplier_name || supp.name || "Operadora Local";
    const supplierPhone = supp.whatsapp || supp.phone || r.supplier_phone || null;

    // Pendências específicas
    const pendencies: string[] = [];
    if (resStatus === "pendente" || resStatus === "solicitada" || resStatus === "aguardando_fornecedor") {
      pendencies.push("Fornecedor ainda não confirmado");
    }
    if (!hasConfirmedTime) {
      pendencies.push("Horário de pickup ausente");
    }
    if (!hotel && !r.pickup_location) {
      pendencies.push("Ponto de encontro ausente");
    }
    if (vStatus === "pendente" || vStatus === "em_preparacao") {
      pendencies.push("Voucher pendente de emissão");
    }
    if (isCancelledInconsistency) {
      pendencies.push("Serviço ativo vinculado a contrato cancelado");
    }

    // Criticidade
    const crit = isServiceCritical(
      {
        date: r.tour_date,
        operationalStatus: resStatus,
        hasConfirmedTime,
        pickupStatus,
        voucherStatus: vStatus,
        isCancelled: isResCancelled,
        isCancelledInconsistency,
        serviceType,
        hotelName: hotel,
      },
      refDateStr
    );

    items.push({
      id: r.id,
      serviceType,
      title: r.product_name || "Serviço Operacional",
      date: r.tour_date,
      time: hasConfirmedTime ? rawTime : null,
      hasConfirmedTime,
      clientId: r.client_id || contract.client_id || null,
      clientName: r.client_name || contract.client_name || "Cliente",
      clientPhone: r.client_phone || contract.client_phone || null,
      clientEmail: r.client_email || contract.client_email || null,
      contractId: r.contract_id,
      contractNumber: r.contract_number || contract.contract_number || "S/N",
      contractStatus: contractStatus || "emitido",
      hotelName: hotel,
      hotelZone: zone,
      pickupLocation: r.pickup_location || hotel,
      pickupStatus,
      adultsCount: adults,
      childrenCount: children,
      infantsCount: infants,
      totalPax,
      supplierId: r.supplier_id || supp.id || null,
      supplierName,
      supplierPhone,
      supplierWhatsapp: supp.whatsapp || null,
      supplierConfirmationCode: r.supplier_confirmation_code || null,
      operationalStatus: resStatus as OperationalReservationStatus,
      voucherStatus: vStatus,
      voucherRef: r.voucher_ref || null,
      specialInstructions: r.special_instructions || null,
      notes: r.notes || null,
      isCritical: crit.isCritical,
      criticalReasons: crit.reasons,
      pendencies,
      isCancelled: isResCancelled || isContractCancelled,
      isCancelledInconsistency,
    });
  });

  // 2. Processar Chegadas de Aeroporto (arrivals)
  arrivals.forEach((a) => {
    const contract = a.contracts || {};
    const contractStatus = (contract.status || "").toLowerCase().trim();
    const rawStatus = (a.status || "agendada").toLowerCase().trim();
    const isCancelled = rawStatus === "cancelado" || contractStatus === "cancelado";

    // Verificar se a chegada tem horário de voo
    const rawFlightTime = a.arrival_flight_time ? String(a.arrival_flight_time).trim() : null;
    const hasConfirmedTime = Boolean(
      rawFlightTime &&
        rawFlightTime !== "" &&
        !rawFlightTime.toLowerCase().includes("confirmar")
    );

    const hotel = a.hotel_name || contract.hotel_name || contract.hotels_schedule?.[0]?.hotel_name || null;
    const zone = a.hotel_zone || contract.hotel_zone || contract.hotels_schedule?.[0]?.zone || null;

    const opStatus = deriveArrivalStatus({
      rawStatus,
      hasTransfer: false,
      flightNumber: a.arrival_flight_number,
      flightTime: a.arrival_flight_time,
      hotelName: hotel,
    });

    const pendencies: string[] = [];
    if (!a.arrival_flight_number || a.arrival_flight_number.trim() === "") {
      pendencies.push("Número de voo não informado");
    }
    if (!hasConfirmedTime) {
      pendencies.push("Horário de chegada do voo não informado");
    }
    if (!hotel) {
      pendencies.push("Hotel de destino não informado");
    }

    const title = a.arrival_flight_number
      ? `Recepção Voo ${a.arrival_flight_number}`
      : "Recepção Chegada Cancún";

    const crit = isServiceCritical(
      {
        date: a.arrival_date,
        operationalStatus: opStatus,
        hasConfirmedTime,
        pickupStatus: hasConfirmedTime ? "confirmado" : "pendente_horario",
        voucherStatus: "nao_aplicavel",
        isCancelled,
        serviceType: "chegada",
        hotelName: hotel,
      },
      refDateStr
    );

    const adults = Number(a.adults_count ?? 1);
    const children = Number(a.children_count ?? 0);
    const infants = Number(a.infants_count ?? 0);

    items.push({
      id: a.id,
      serviceType: "chegada",
      title,
      date: a.arrival_date,
      time: hasConfirmedTime ? rawFlightTime : null,
      hasConfirmedTime,
      clientId: a.client_id || contract.client_id || null,
      clientName: a.client_name || contract.client_name || "Cliente",
      clientPhone: a.client_phone || contract.client_phone || null,
      clientEmail: a.client_email || contract.client_email || null,
      contractId: a.contract_id,
      contractNumber: contract.contract_number || "S/N",
      contractStatus: contractStatus || "emitido",
      hotelName: hotel,
      hotelZone: zone,
      pickupLocation: "Aeroporto Internacional de Cancún",
      pickupStatus: hasConfirmedTime ? "confirmado" : "pendente_horario",
      adultsCount: adults,
      childrenCount: children,
      infantsCount: infants,
      totalPax: adults + children + infants,
      supplierId: null,
      supplierName: "Equipe de Recepção Tío Nenê",
      supplierPhone: null,
      supplierWhatsapp: null,
      supplierConfirmationCode: null,
      operationalStatus: opStatus,
      voucherStatus: "nao_aplicavel",
      voucherRef: null,
      specialInstructions: null,
      notes: a.notes || null,
      isCritical: crit.isCritical,
      criticalReasons: crit.reasons,
      pendencies,
      isCancelled,
      isCancelledInconsistency: false,
    });
  });

  return items;
}

// =============================================================================
// SEPARAÇÃO E ORDENAÇÃO CRONOLÓGICA
// =============================================================================

/**
 * Ordena os serviços estritamente por cronologia:
 * 1. Data crescente (YYYY-MM-DD).
 * 2. Horário crescente ("06:30", "07:15", "14:00").
 * 3. Serviços sem horário confirmado vão para o final de cada data.
 */
export function sortDailyServicesChronologically(services: DailyServiceItem[]): DailyServiceItem[] {
  return [...services].sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }
    if (a.hasConfirmedTime && b.hasConfirmedTime) {
      return (a.time || "").localeCompare(b.time || "");
    }
    if (a.hasConfirmedTime && !b.hasConfirmedTime) return -1;
    if (!a.hasConfirmedTime && b.hasConfirmedTime) return 1;
    return a.title.localeCompare(b.title);
  });
}

/**
 * Separa os serviços de uma lista entre:
 * - Com horário confirmado (para a timeline cronológica)
 * - Aguardando definição de horário (para seção própria sem horários fictícios)
 */
export function separateTimeServices(services: DailyServiceItem[]): {
  withConfirmedTime: DailyServiceItem[];
  withoutConfirmedTime: DailyServiceItem[];
} {
  const withConfirmedTime: DailyServiceItem[] = [];
  const withoutConfirmedTime: DailyServiceItem[] = [];

  services.forEach((s) => {
    if (s.hasConfirmedTime) {
      withConfirmedTime.push(s);
    } else {
      withoutConfirmedTime.push(s);
    }
  });

  return {
    withConfirmedTime: sortDailyServicesChronologically(withConfirmedTime),
    withoutConfirmedTime: [...withoutConfirmedTime].sort((a, b) => a.date.localeCompare(b.date)),
  };
}

// =============================================================================
// CÁLCULO DOS INDICADORES DO RESUMO DO DIA (KPIs)
// =============================================================================

/**
 * Calcula os indicadores reais do Resumo do Dia:
 * - Chegadas previstas no dia de referência.
 * - Traslados programados no dia de referência.
 * - Passeios programados no dia de referência.
 * - Reservas aguardando confirmação do fornecedor.
 * - Pickups pendentes de definição.
 * - Vouchers pendentes de emissão.
 * - Carteiras de viagem que necessitam atualização.
 * - Ocorrências operacionais em aberto.
 */
export function calculateDailyKpis(params: {
  allServices: DailyServiceItem[];
  wallets?: Array<{ status: string; id: string; contract_id: string }>;
  incidents?: Array<{ id: string; status: string; priority: string }>;
  tasks?: Array<{ id?: string; status: string; priority: string; due_date?: string | null }>;
  refDateStr?: string;
}): DailyOperationsKpis {
  const { allServices = [], wallets = [], incidents = [], tasks = [], refDateStr } = params;
  const targetDate = refDateStr || toIsoDate(new Date());

  // Serviços ativos do dia de referência
  const activeTodayServices = allServices.filter(
    (s) => s.date === targetDate && !s.isCancelled
  );

  let chegadasPrevistas = 0;
  let trasladosProgramados = 0;
  let passeiosProgramados = 0;
  let reservasAguardandoConfirmacao = 0;
  let pickupsPendentes = 0;
  let vouchersPendentes = 0;

  activeTodayServices.forEach((s) => {
    if (s.serviceType === "chegada") {
      chegadasPrevistas++;
    } else if (s.serviceType === "traslado") {
      trasladosProgramados++;
    } else if (s.serviceType === "passeio") {
      passeiosProgramados++;
    }

    // Reservas aguardando confirmação (passeios e traslados)
    if (
      s.serviceType !== "chegada" &&
      (s.operationalStatus === "pendente" ||
        s.operationalStatus === "solicitada" ||
        s.operationalStatus === "aguardando_fornecedor" ||
        s.operationalStatus === "pendente_info")
    ) {
      reservasAguardandoConfirmacao++;
    }

    // Pickups pendentes de horário ou local
    if (!s.hasConfirmedTime || s.pickupStatus !== "confirmado") {
      pickupsPendentes++;
    }

    // Vouchers pendentes
    if (
      s.serviceType !== "chegada" &&
      (s.voucherStatus === "pendente" || s.voucherStatus === "em_preparacao")
    ) {
      vouchersPendentes++;
    }
  });

  // Carteiras que necessitam atualização
  const carteirasNecessitamAtualizacao = wallets.filter(
    (w) => w.status === "necessita_atualizacao"
  ).length;

  // Ocorrências operacionais em aberto
  // Se houver incidentes registrados no banco, conta os não resolvidos/cancelados
  const openIncidentsCount = incidents.filter(
    (inc) => inc.status !== "resolvida" && inc.status !== "cancelada"
  ).length;

  const inconsistenciesCount = allServices.filter((s) => s.isCancelledInconsistency).length;

  // Se a lista de incidentes foi explicitamente fornecida pelo chamador, utiliza a contagem real
  // Caso contrário, recorre à heurística de inconsistências e serviços críticos do dia
  const ocorrenciasAbertas = params.incidents !== undefined
    ? openIncidentsCount + inconsistenciesCount
    : (openIncidentsCount > 0
        ? openIncidentsCount + inconsistenciesCount
        : allServices.filter((s) => {
            if (s.isCancelledInconsistency) return true;
            if (s.date === targetDate && s.isCritical && !s.isCancelled) return true;
            return false;
          }).length);

  // Tarefas internas: vencidas e críticas pendentes (calculadas de forma estritamente independente)
  const openTasks = tasks.filter(
    (t) => t.status !== "concluida" && t.status !== "cancelada"
  );
  const tarefasVencidas = openTasks.filter(
    (t) => t.due_date && t.due_date.split("T")[0] < targetDate
  ).length;
  const tarefasCriticasPendentes = openTasks.filter(
    (t) => t.priority === "critica"
  ).length;

  return {
    chegadasPrevistas,
    trasladosProgramados,
    passeiosProgramados,
    reservasAguardandoConfirmacao,
    pickupsPendentes,
    vouchersPendentes,
    carteirasNecessitamAtualizacao,
    ocorrenciasAbertas,
    tarefasVencidas,
    tarefasCriticasPendentes,
  };
}

// =============================================================================
// CENTRAL DE PENDÊNCIAS E CLASSIFICAÇÃO DE PRIORIDADES
// =============================================================================

/**
 * Matriz de priorização operacional:
 * - Crítica: Serviços de hoje/amanhã com pendência grave ou inconsistência
 * - Alta: Serviços nos próximos 7 dias com pendência operacional ou carteira desatualizada
 * - Média: Serviços em 8-14 dias com pendências a preencher
 * - Baixa: Serviços com >14 dias de antecedência
 */
export function classifyPendencyPriority(
  category: OperationalPendencyCategory,
  daysUntilService: number
): OperationalPendencyPriority {
  // Inconsistência de cancelamento é sempre urgente/crítica
  if (category === "inconsistencia_cancelamento") {
    return daysUntilService <= 7 ? "critica" : "alta";
  }

  // HOJE
  if (daysUntilService <= 0) {
    return "critica";
  }

  // AMANHÃ
  if (daysUntilService === 1) {
    if (
      category === "fornecedor_pendente" ||
      category === "pickup_ausente" ||
      category === "local_ausente" ||
      category === "chegada_incompleta" ||
      category === "carteira_desatualizada"
    ) {
      return "critica";
    }
    return "alta"; // voucher_pendente para amanhã
  }

  // PRÓXIMOS 7 DIAS (2 a 7 dias)
  if (daysUntilService >= 2 && daysUntilService <= 7) {
    if (
      category === "fornecedor_pendente" ||
      category === "pickup_ausente" ||
      category === "chegada_incompleta" ||
      category === "carteira_desatualizada"
    ) {
      return "alta";
    }
    return "media";
  }

  // MÉDIO PRAZO (8 a 14 dias)
  if (daysUntilService >= 8 && daysUntilService <= 14) {
    return "media";
  }

  // LONGO PRAZO (> 14 dias)
  return "baixa";
}

/**
 * Detecta e consolida todas as pendências operacionais ativas que exigem intervenção da equipe.
 */
export function detectDailyPendencies(params: {
  allServices: DailyServiceItem[];
  wallets?: Array<{
    id: string;
    contract_id: string;
    contract_number?: string;
    client_name?: string;
    status: WalletStatus;
    needs_update_reasons?: string[];
    travel_start_date?: string | null;
  }>;
  incidents?: Array<{
    id: string;
    contract_id: string;
    contract_number?: string;
    client_name?: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    service_name?: string | null;
    service_date?: string | null;
    reservation_id?: string | null;
    arrival_id?: string | null;
    opened_at?: string;
  }>;
  refDateStr?: string;
}): OperationalPendencyItem[] {
  const { allServices = [], wallets = [], incidents = [], refDateStr } = params;
  const pendencies: OperationalPendencyItem[] = [];

  // 1. Varrer todos os serviços operacionais
  allServices.forEach((s) => {
    // Serviços cancelados de forma consistente não geram pendências na agenda ativa
    if (s.isCancelled && !s.isCancelledInconsistency) return;

    const days = getDaysDiff(s.date, refDateStr);

    // Inconsistência de cancelamento
    if (s.isCancelledInconsistency) {
      pendencies.push({
        id: `pend-inconsist-${s.id}`,
        priority: classifyPendencyPriority("inconsistencia_cancelamento", days),
        category: "inconsistencia_cancelamento",
        title: "Serviço ativo em contrato cancelado",
        description: `O contrato ${s.contractNumber} foi cancelado, porém o serviço "${s.title}" ainda consta como ativo. Requer cancelamento formal da reserva operacional.`,
        clientName: s.clientName,
        contractId: s.contractId,
        contractNumber: s.contractNumber,
        serviceId: s.id,
        serviceName: s.title,
        serviceDate: s.date,
        daysUntilService: days,
        quickActionType: "reserva",
        quickActionUrl: `/admin/reservas?search=${encodeURIComponent(s.contractNumber)}`,
      });
      return;
    }

    // Chegadas incompletas
    if (s.serviceType === "chegada") {
      if (s.pendencies.length > 0) {
        pendencies.push({
          id: `pend-arr-${s.id}`,
          priority: classifyPendencyPriority("chegada_incompleta", days),
          category: "chegada_incompleta",
          title: "Chegada aeroporto com dados incompletos",
          description: `Chegada de ${s.clientName}: ${s.pendencies.join(", ")}.`,
          clientName: s.clientName,
          contractId: s.contractId,
          contractNumber: s.contractNumber,
          serviceId: s.id,
          serviceName: s.title,
          serviceDate: s.date,
          daysUntilService: days,
          quickActionType: "chegada",
          quickActionUrl: `/admin/chegadas?search=${encodeURIComponent(s.contractNumber)}`,
        });
      }
      return;
    }

    // Fornecedor ainda não confirmado
    if (
      s.operationalStatus === "pendente" ||
      s.operationalStatus === "solicitada" ||
      s.operationalStatus === "aguardando_fornecedor"
    ) {
      pendencies.push({
        id: `pend-supp-${s.id}`,
        priority: classifyPendencyPriority("fornecedor_pendente", days),
        category: "fornecedor_pendente",
        title: "Fornecedor ainda não confirmado",
        description: `O serviço "${s.title}" com o fornecedor "${s.supplierName}" aguarda confirmação oficial e código de confirmação.`,
        clientName: s.clientName,
        contractId: s.contractId,
        contractNumber: s.contractNumber,
        serviceId: s.id,
        serviceName: s.title,
        serviceDate: s.date,
        daysUntilService: days,
        quickActionType: "reserva",
        quickActionUrl: `/admin/reservas?search=${encodeURIComponent(s.contractNumber)}`,
      });
    }

    // Horário de pickup ausente
    if (!s.hasConfirmedTime) {
      pendencies.push({
        id: `pend-pick-${s.id}`,
        priority: classifyPendencyPriority("pickup_ausente", days),
        category: "pickup_ausente",
        title: "Horário de pickup ausente",
        description: `Passeio/traslado "${s.title}" em ${s.hotelName || "hotel não definido"} ainda não possui horário de embarque confirmado.`,
        clientName: s.clientName,
        contractId: s.contractId,
        contractNumber: s.contractNumber,
        serviceId: s.id,
        serviceName: s.title,
        serviceDate: s.date,
        daysUntilService: days,
        quickActionType: "reserva",
        quickActionUrl: `/admin/reservas?search=${encodeURIComponent(s.contractNumber)}`,
      });
    }

    // Ponto de encontro ou hotel ausente
    if (!s.hotelName && !s.pickupLocation) {
      pendencies.push({
        id: `pend-loc-${s.id}`,
        priority: classifyPendencyPriority("local_ausente", days),
        category: "local_ausente",
        title: "Ponto de encontro ou hotel ausente",
        description: `Nenhum hotel ou ponto de encontro vinculado ao serviço "${s.title}".`,
        clientName: s.clientName,
        contractId: s.contractId,
        contractNumber: s.contractNumber,
        serviceId: s.id,
        serviceName: s.title,
        serviceDate: s.date,
        daysUntilService: days,
        quickActionType: "reserva",
        quickActionUrl: `/admin/reservas?search=${encodeURIComponent(s.contractNumber)}`,
      });
    }

    // Voucher pendente de preparação ou entrega
    if (s.voucherStatus === "pendente" || s.voucherStatus === "em_preparacao") {
      pendencies.push({
        id: `pend-vch-${s.id}`,
        priority: classifyPendencyPriority("voucher_pendente", days),
        category: "voucher_pendente",
        title: "Voucher pendente de emissão",
        description: `Documento operacional do cliente para "${s.title}" ainda não foi gerado ou validado.`,
        clientName: s.clientName,
        contractId: s.contractId,
        contractNumber: s.contractNumber,
        serviceId: s.id,
        serviceName: s.title,
        serviceDate: s.date,
        daysUntilService: days,
        quickActionType: "voucher",
        quickActionUrl: `/admin/vouchers?search=${encodeURIComponent(s.contractNumber)}`,
      });
    }
  });

  // 2. Varrer Carteiras de Viagem que Necessitam Atualização
  wallets.forEach((w) => {
    if (w.status === "necessita_atualizacao") {
      const travelDate = w.travel_start_date || toIsoDate(new Date());
      const days = getDaysDiff(travelDate, refDateStr);
      const reasons =
        Array.isArray(w.needs_update_reasons) && w.needs_update_reasons.length > 0
          ? w.needs_update_reasons.join("; ")
          : "Alterações operacionais em horários, locais ou vouchers após a entrega";

      pendencies.push({
        id: `pend-wallet-${w.id}`,
        priority: classifyPendencyPriority("carteira_desatualizada", days),
        category: "carteira_desatualizada",
        title: "Carteira entregue necessita atualização",
        description: `A carteira do cliente ${w.client_name || "Turista"} foi entregue, mas houve modificações operacionais subsequentes: ${reasons}.`,
        clientName: w.client_name || "Cliente",
        contractId: w.contract_id,
        contractNumber: w.contract_number || "S/N",
        serviceName: "Carteira de Viagem do Cliente",
        serviceDate: travelDate,
        daysUntilService: days,
        quickActionType: "carteira",
        quickActionUrl: `/admin/carteiras?search=${encodeURIComponent(w.contract_number || "")}`,
      });
    }
  });

  // 3. Varrer Ocorrências Operacionais em Aberto
  incidents.forEach((inc) => {
    if (inc.status === "aberta" || inc.status === "em_analise" || inc.status === "aguardando_fornecedor" || inc.status === "aguardando_cliente") {
      const incDate = inc.service_date || (inc.opened_at ? inc.opened_at.split("T")[0] : toIsoDate(new Date()));
      const days = getDaysDiff(incDate, refDateStr);
      const prio: OperationalPendencyPriority =
        inc.priority === "critica"
          ? "critica"
          : inc.priority === "alta"
          ? "alta"
          : inc.priority === "media"
          ? "media"
          : "baixa";

      pendencies.push({
        id: `pend-inc-${inc.id}`,
        priority: prio,
        category: "ocorrencia",
        title: `Ocorrência: ${inc.title}`,
        description: inc.description || "Ocorrência operacional registrada aguardando tratativa da equipe.",
        clientName: inc.client_name || "Cliente",
        contractId: inc.contract_id,
        contractNumber: inc.contract_number || "S/N",
        serviceId: inc.reservation_id || inc.arrival_id || undefined,
        serviceName: inc.service_name || "Ocorrência Operacional",
        serviceDate: incDate,
        daysUntilService: days,
        quickActionType: "ocorrencia",
        quickActionUrl: `/admin/ocorrencias?search=${encodeURIComponent(inc.contract_number || "")}`,
      });
    }
  });

  // Ordenar pendências:
  // 1. Prioridade decrescente: crítica (0) > alta (1) > media (2) > baixa (3)
  // 2. Proximidade da data (dias crescentes)
  const priorityRank: Record<OperationalPendencyPriority, number> = {
    critica: 0,
    alta: 1,
    media: 2,
    baixa: 3,
  };

  return pendencies.sort((a, b) => {
    const rankDiff = priorityRank[a.priority] - priorityRank[b.priority];
    if (rankDiff !== 0) return rankDiff;
    return a.daysUntilService - b.daysUntilService;
  });
}

// =============================================================================
// FILTRAGEM COMBINADA DE SERVIÇOS
// =============================================================================

/**
 * Aplica filtros combinados de data/período, tipo de serviço, fornecedor,
 * status operacional, presença de pendências e busca por texto livre.
 */
export function filterDailyServices(
  services: DailyServiceItem[],
  filters: DailyOperationsFilters,
  refDateStr?: string
): DailyServiceItem[] {
  const {
    datePreset,
    startDate,
    endDate,
    serviceType,
    supplierId,
    operationalStatus,
    pendencyFilter,
    searchTerm,
  } = filters;

  const dateRange = getDateRangeForPreset(datePreset, refDateStr, startDate, endDate);
  const term = (searchTerm || "").toLowerCase().trim();

  return services.filter((s) => {
    // 1. Excluir serviços cancelados por padrão da agenda ativa, exceto se pesquisado explicitamente
    if (s.isCancelled && !s.isCancelledInconsistency && operationalStatus !== "cancelada") {
      return false;
    }

    // 2. Filtro de Data / Período
    if (dateRange.startDate && s.date < dateRange.startDate) return false;
    if (dateRange.endDate && s.date > dateRange.endDate) return false;

    // 3. Tipo de Serviço
    if (serviceType !== "todos" && s.serviceType !== serviceType) {
      return false;
    }

    // 4. Fornecedor
    if (supplierId && supplierId !== "todos") {
      if (s.supplierId !== supplierId && !s.supplierName.toLowerCase().includes(supplierId.toLowerCase())) {
        return false;
      }
    }

    // 5. Status Operacional
    if (operationalStatus && operationalStatus !== "todos") {
      if (s.operationalStatus !== operationalStatus) {
        return false;
      }
    }

    // 6. Existência de Pendências
    if (pendencyFilter === "com_pendencias") {
      if (s.pendencies.length === 0 && !s.isCritical) return false;
    } else if (pendencyFilter === "sem_pendencias") {
      if (s.pendencies.length > 0 || s.isCritical) return false;
    }

    // 7. Busca Textual Combinada
    if (term) {
      const matchClient = s.clientName.toLowerCase().includes(term);
      const matchContract = s.contractNumber.toLowerCase().includes(term);
      const matchHotel = (s.hotelName || "").toLowerCase().includes(term);
      const matchTour = s.title.toLowerCase().includes(term);
      const matchSupplier = s.supplierName.toLowerCase().includes(term);
      const matchVoucher = (s.voucherRef || "").toLowerCase().includes(term);

      if (!matchClient && !matchContract && !matchHotel && !matchTour && !matchSupplier && !matchVoucher) {
        return false;
      }
    }

    return true;
  });
}
