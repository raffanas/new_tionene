/**
 * GESTÃO DE OCORRÊNCIAS OPERACIONAIS — TÍO NENÊ v0.1.43
 * Arquivo: src/lib/operational/incidentOperations.ts
 *
 * Módulo de domínio para registro, acompanhamento, histórico imutável e resolução
 * de ocorrências operacionais da equipe da Tío Nenê Viagens.
 *
 * REGRAS CRÍTICAS DE NEGÓCIO E SEGURANÇA (TAREFA 28):
 * 1. TIPOS RIGOROSOS DE OCORRÊNCIA:
 *    10 tipos padronizados cobrindo fornecedores, clientes, pickup, passeios, vouchers e hotéis.
 *    Não gera automaticamente ocorrência apenas por existir pendência operacional.
 * 2. FLUXO DE STATUS E RESOLUÇÃO:
 *    Aberta -> Em análise -> Aguardando fornecedor -> Aguardando cliente -> Resolvida | Cancelada.
 *    É expressamente PROIBIDO marcar como resolvida sem descrição da solução aplicada.
 * 3. HISTÓRICO E AUDITORIA IMUTÁVEIS:
 *    Histórico acumulativo persistente: autor, responsável, mudanças de status, prioridade e andamentos.
 *    Sem exclusão física de registros de ocorrência.
 * 4. PRIORIDADES INTELIGENTES:
 *    Baixa, Média, Alta, Crítica. Sugestões automáticas baseadas no tipo e proximidade
 *    da data do serviço, sem sobrescrever decisões manuais do operador.
 * 5. CONFIDENCIALIDADE FINANCEIRA:
 *    NENHUM dado de custos, margens, comissões ou preços é consultado ou manipulado.
 * 6. NÃO-MUTABILIDADE DE CONTRATOS E RESERVAS:
 *    O módulo não altera diretamente contratos, reservas, pagamentos ou contas financeiras.
 */

// =============================================================================
// TIPOS E ENUMS DO DOMÍNIO
// =============================================================================

export type IncidentType =
  | "atraso_fornecedor"
  | "cliente_nao_localizado"
  | "problema_pickup"
  | "passeio_nao_realizado"
  | "servico_divergente"
  | "problema_voucher"
  | "problema_traslado"
  | "reclamacao_cliente"
  | "problema_hotel"
  | "outro";

export type IncidentPriority = "baixa" | "media" | "alta" | "critica";

export type IncidentStatus =
  | "aberta"
  | "em_analise"
  | "aguardando_fornecedor"
  | "aguardando_cliente"
  | "resolvida"
  | "cancelada";

export type IncidentHistoryAction =
  | "abertura"
  | "atribuicao"
  | "alteracao_prioridade"
  | "alteracao_status"
  | "andamento"
  | "resolucao"
  | "cancelamento"
  | "edicao";

export interface IncidentHistoryEntry {
  id: string;
  incident_id: string;
  action: IncidentHistoryAction;
  description: string;
  status_before?: string | null;
  status_after?: string | null;
  priority_before?: string | null;
  priority_after?: string | null;
  assigned_to_before?: string | null;
  assigned_to_after?: string | null;
  performed_by?: string | null;
  performed_by_name: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface OperationalIncident {
  id: string;
  incident_code: string; // Ex: OCR-2026-0001
  contract_id: string;
  contract_number: string;
  client_id?: string | null;
  client_name: string;
  client_phone?: string | null;
  client_email?: string | null;

  // Vínculos operacionais opcionais
  reservation_id?: string | null;
  arrival_id?: string | null;
  service_name?: string | null;
  service_date?: string | null;
  supplier_id?: string | null;
  supplier_name?: string | null;

  // Conteúdo e Tipificação
  incident_type: IncidentType;
  title: string;
  description: string;

  // Gravidade e Status
  priority: IncidentPriority;
  status: IncidentStatus;

  // Atribuição
  assigned_to?: string | null;
  assigned_to_name?: string | null;

  // Resolução
  opened_at: string;
  resolved_at?: string | null;
  resolved_by?: string | null;
  resolved_by_name?: string | null;
  resolution_notes?: string | null;
  internal_notes?: string | null;

  // Rastreabilidade
  created_by?: string | null;
  created_by_name?: string | null;
  created_at: string;
  updated_at: string;

  // Histórico anexado
  history?: IncidentHistoryEntry[];
}

export interface IncidentKpiSummary {
  totalIncidents: number;
  openCount: number;
  inAnalysisCount: number;
  awaitingSupplierCount: number;
  awaitingClientCount: number;
  resolvedCount: number;
  criticalOpenCount: number;
}

export interface IncidentFilters {
  searchTerm?: string;
  incidentType?: string; // "todos" ou IncidentType
  priority?: string; // "todos" ou IncidentPriority
  status?: string; // "todos" | "ativos" | IncidentStatus
  assignedTo?: string; // "todos" ou nome do responsável
  supplierId?: string; // "todos" ou ID/Nome
  startDate?: string;
  endDate?: string;
  serviceDateStart?: string;
  serviceDateEnd?: string;
}

// =============================================================================
// CONFIGURAÇÕES VISUAIS E METADADOS
// =============================================================================

export const INCIDENT_TYPES_CONFIG: Record<
  IncidentType,
  { label: string; description: string; defaultPriority: IncidentPriority; iconName: string }
> = {
  atraso_fornecedor: {
    label: "Atraso de Fornecedor",
    description: "Van ou guia da operadora não se apresentou no horário previsto",
    defaultPriority: "alta",
    iconName: "Clock",
  },
  cliente_nao_localizado: {
    label: "Cliente Não Localizado",
    description: "Turista não compareceu ao lobby/embarque no horário combinado",
    defaultPriority: "critica",
    iconName: "UserX",
  },
  problema_pickup: {
    label: "Problema no Pickup",
    description: "Endereço incorreto, hotel divergente ou ponto de encontro inacessível",
    defaultPriority: "alta",
    iconName: "MapPin",
  },
  passeio_nao_realizado: {
    label: "Passeio Não Realizado",
    description: "Serviço cancelado pelo operador, clima adverso ou no-show",
    defaultPriority: "critica",
    iconName: "XCircle",
  },
  servico_divergente: {
    label: "Serviço Diferente do Contratado",
    description: "Categoria de van, idioma do guia ou inclusões divergentes",
    defaultPriority: "alta",
    iconName: "AlertTriangle",
  },
  problema_voucher: {
    label: "Problema com Voucher",
    description: "Fornecedor não reconheceu o código ou divergência de bilhetes",
    defaultPriority: "alta",
    iconName: "Ticket",
  },
  problema_traslado: {
    label: "Problema com Traslado",
    description: "Logística de aeroporto, voo alterado de última hora ou bagagem",
    defaultPriority: "alta",
    iconName: "Car",
  },
  reclamacao_cliente: {
    label: "Reclamação do Cliente",
    description: "Insatisfação manifestada pelo turista durante a prestação do serviço",
    defaultPriority: "media",
    iconName: "MessageSquareWarning",
  },
  problema_hotel: {
    label: "Problema com Hotel",
    description: "Check-in recusado, atraso de acomodação ou divergência de reserva",
    defaultPriority: "media",
    iconName: "Building",
  },
  outro: {
    label: "Outro Problema Operacional",
    description: "Situações operacionais atípicas não enquadradas nas categorias padrão",
    defaultPriority: "media",
    iconName: "FileWarning",
  },
};

export const INCIDENT_PRIORITY_CONFIG: Record<
  IncidentPriority,
  { label: string; bg: string; color: string; border: string; rank: number }
> = {
  critica: {
    label: "Crítica (Urgente)",
    bg: "#fee2e2",
    color: "#b91c1c",
    border: "#fca5a5",
    rank: 0,
  },
  alta: {
    label: "Alta",
    bg: "#fef3c7",
    color: "#b45309",
    border: "#fde68a",
    rank: 1,
  },
  media: {
    label: "Média",
    bg: "#e0e7ff",
    color: "#4338ca",
    border: "#c7d2fe",
    rank: 2,
  },
  baixa: {
    label: "Baixa",
    bg: "#f1f5f9",
    color: "#475569",
    border: "#cbd5e1",
    rank: 3,
  },
};

export const INCIDENT_STATUS_CONFIG: Record<
  IncidentStatus,
  { label: string; bg: string; color: string; border: string; desc: string }
> = {
  aberta: {
    label: "Aberta",
    bg: "#fee2e2",
    color: "#b91c1c",
    border: "#fca5a5",
    desc: "Ocorrência registrada, aguardando início de tratativa",
  },
  em_analise: {
    label: "Em Análise",
    bg: "#fef3c7",
    color: "#b45309",
    border: "#fde68a",
    desc: "Operador assumiu e está em contato com cliente ou fornecedor",
  },
  aguardando_fornecedor: {
    label: "Aguardando Fornecedor",
    bg: "#f3e8ff",
    color: "#7e22ce",
    border: "#e9d5ff",
    desc: "Aguardando retorno, remarcação ou estorno da operadora",
  },
  aguardando_cliente: {
    label: "Aguardando Cliente",
    bg: "#e0f2fe",
    color: "#0369a1",
    border: "#bae6fd",
    desc: "Aguardando manifestação ou confirmação de novo horário pelo cliente",
  },
  resolvida: {
    label: "Resolvida",
    bg: "#dcfce7",
    color: "#15803d",
    border: "#86efac",
    desc: "Problema sanado com providência devidamente documentada",
  },
  cancelada: {
    label: "Cancelada",
    bg: "#f1f5f9",
    color: "#64748b",
    border: "#cbd5e1",
    desc: "Registrada por equívoco ou cancelada sem necessidade de ação",
  },
};

// =============================================================================
// FUNÇÕES DE SUGESTÃO E VALIDAÇÃO DE DOMÍNIO
// =============================================================================

/**
 * Sugere a prioridade inicial com base no tipo e na proximidade da data do serviço.
 * Nunca sobrescreve uma decisão explícita feita manualmente pelo operador.
 */
export function suggestIncidentPriority(
  type: IncidentType,
  serviceDate?: string | null,
  refDateStr?: string
): IncidentPriority {
  const baseConfig = INCIDENT_TYPES_CONFIG[type];
  const defaultPrio = baseConfig ? baseConfig.defaultPriority : "media";

  // Se o serviço é hoje ou amanhã, eleva a criticidade
  if (serviceDate) {
    const today = refDateStr || new Date().toISOString().split("T")[0];
    const [sy, sm, sd] = serviceDate.split("-").map(Number);
    const [ty, tm, td] = today.split("-").map(Number);
    const dService = new Date(sy, sm - 1, sd);
    const dRef = new Date(ty, tm - 1, td);
    const diffDays = Math.round((dService.getTime() - dRef.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      // Serviço de hoje ou passado recente
      if (type === "cliente_nao_localizado" || type === "atraso_fornecedor" || type === "problema_pickup" || type === "passeio_nao_realizado") {
        return "critica";
      }
      return "alta";
    }

    if (diffDays === 1) {
      // Serviço de amanhã
      if (type === "cliente_nao_localizado" || type === "passeio_nao_realizado") {
        return "critica";
      }
      if (defaultPrio === "media") return "alta";
    }
  }

  return defaultPrio;
}

/**
 * Validação rigorosa dos dados de criação de ocorrência.
 */
export function validateIncidentCreation(params: {
  contractId?: string;
  contractNumber?: string;
  clientName?: string;
  incidentType?: string;
  title?: string;
  description?: string;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!params.contractId || params.contractId.trim() === "") {
    errors.push("O contrato vinculado é obrigatório");
  }
  if (!params.clientName || params.clientName.trim() === "") {
    errors.push("O nome do cliente titular é obrigatório");
  }
  if (!params.incidentType || !INCIDENT_TYPES_CONFIG[params.incidentType as IncidentType]) {
    errors.push("Selecione um tipo de ocorrência válido");
  }
  if (!params.title || params.title.trim().length < 4) {
    errors.push("O título deve ter no mínimo 4 caracteres descritivos");
  }
  if (!params.description || params.description.trim().length < 10) {
    errors.push("A descrição do problema deve ter no mínimo 10 caracteres informativos");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validação rigorosa de resolução de ocorrência:
 * Exige expressamente descrição detalhada da solução antes de marcar como 'resolvida'.
 */
export function validateIncidentResolution(
  resolutionNotes?: string | null
): { isValid: boolean; error?: string } {
  if (!resolutionNotes || resolutionNotes.trim() === "") {
    return {
      isValid: false,
      error: "É obrigatório registrar a solução aplicada e as providências tomadas para resolver a ocorrência.",
    };
  }

  if (resolutionNotes.trim().length < 5) {
    return {
      isValid: false,
      error: "A descrição da solução deve conter no mínimo 5 caracteres detalhando a providência tomada.",
    };
  }

  return { isValid: true };
}

/**
 * Gera um código legível para a ocorrência (ex: OCR-2026-0001).
 */
export function generateSuggestedIncidentCode(year?: number, seq?: number): string {
  const currentYear = year || new Date().getFullYear();
  const currentSeq = seq || Math.floor(1000 + Math.random() * 9000);
  return `OCR-${currentYear}-${String(currentSeq).padStart(4, "0")}`;
}

// =============================================================================
// HISTÓRICO E AUDITORIA IMUTÁVEIS
// =============================================================================

/**
 * Cria uma entrada padronizada de histórico operacional para a ocorrência.
 */
export function buildIncidentHistoryEntry(params: {
  incidentId: string;
  action: IncidentHistoryAction;
  description: string;
  performedByName: string;
  performedBy?: string | null;
  statusBefore?: string | null;
  statusAfter?: string | null;
  priorityBefore?: string | null;
  priorityAfter?: string | null;
  assignedToBefore?: string | null;
  assignedToAfter?: string | null;
  metadata?: Record<string, any>;
}): IncidentHistoryEntry {
  return {
    id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    incident_id: params.incidentId,
    action: params.action,
    description: params.description,
    status_before: params.statusBefore || null,
    status_after: params.statusAfter || null,
    priority_before: params.priorityBefore || null,
    priority_after: params.priorityAfter || null,
    assigned_to_before: params.assignedToBefore || null,
    assigned_to_after: params.assignedToAfter || null,
    performed_by: params.performedBy || null,
    performed_by_name: params.performedByName || "Operador",
    metadata: params.metadata || {},
    created_at: new Date().toISOString(),
  };
}

// =============================================================================
// CÁLCULO DE KPIS E FILTRAGEM COMBINADA
// =============================================================================

/**
 * Calcula os indicadores rápidos da Central de Ocorrências.
 */
export function calculateIncidentKpis(incidents: OperationalIncident[]): IncidentKpiSummary {
  let openCount = 0;
  let inAnalysisCount = 0;
  let awaitingSupplierCount = 0;
  let awaitingClientCount = 0;
  let resolvedCount = 0;
  let criticalOpenCount = 0;

  incidents.forEach((inc) => {
    if (inc.status === "aberta") {
      openCount++;
      if (inc.priority === "critica") criticalOpenCount++;
    } else if (inc.status === "em_analise") {
      inAnalysisCount++;
      if (inc.priority === "critica") criticalOpenCount++;
    } else if (inc.status === "aguardando_fornecedor") {
      awaitingSupplierCount++;
      if (inc.priority === "critica") criticalOpenCount++;
    } else if (inc.status === "aguardando_cliente") {
      awaitingClientCount++;
      if (inc.priority === "critica") criticalOpenCount++;
    } else if (inc.status === "resolvida") {
      resolvedCount++;
    }
  });

  return {
    totalIncidents: incidents.length,
    openCount,
    inAnalysisCount,
    awaitingSupplierCount,
    awaitingClientCount,
    resolvedCount,
    criticalOpenCount,
  };
}

/**
 * Filtra ocorrências combinando busca livre, tipo, prioridade, status, fornecedor, responsável e datas.
 */
export function filterIncidents(
  incidents: OperationalIncident[],
  filters: IncidentFilters
): OperationalIncident[] {
  const {
    searchTerm,
    incidentType,
    priority,
    status,
    assignedTo,
    supplierId,
    startDate,
    endDate,
    serviceDateStart,
    serviceDateEnd,
  } = filters;

  const term = (searchTerm || "").toLowerCase().trim();

  return incidents.filter((inc) => {
    // 1. Tipo
    if (incidentType && incidentType !== "todos") {
      if (inc.incident_type !== incidentType) return false;
    }

    // 2. Prioridade
    if (priority && priority !== "todos") {
      if (inc.priority !== priority) return false;
    }

    // 3. Status
    if (status && status !== "todos") {
      if (status === "ativas") {
        if (inc.status === "resolvida" || inc.status === "cancelada") return false;
      } else if (inc.status !== status) {
        return false;
      }
    }

    // 4. Responsável
    if (assignedTo && assignedTo !== "todos") {
      const respName = (inc.assigned_to_name || "").toLowerCase();
      if (!respName.includes(assignedTo.toLowerCase())) return false;
    }

    // 5. Fornecedor
    if (supplierId && supplierId !== "todos") {
      const matchId = inc.supplier_id === supplierId;
      const matchName = (inc.supplier_name || "").toLowerCase().includes(supplierId.toLowerCase());
      if (!matchId && !matchName) return false;
    }

    // 6. Data de abertura
    if (startDate) {
      const openDate = (inc.opened_at || inc.created_at || "").split("T")[0];
      if (openDate < startDate) return false;
    }
    if (endDate) {
      const openDate = (inc.opened_at || inc.created_at || "").split("T")[0];
      if (openDate > endDate) return false;
    }

    // 7. Data do serviço
    if (serviceDateStart && inc.service_date) {
      if (inc.service_date < serviceDateStart) return false;
    }
    if (serviceDateEnd && inc.service_date) {
      if (inc.service_date > serviceDateEnd) return false;
    }

    // 8. Busca textual global
    if (term) {
      const matchCode = (inc.incident_code || "").toLowerCase().includes(term);
      const matchClient = (inc.client_name || "").toLowerCase().includes(term);
      const matchContract = (inc.contract_number || "").toLowerCase().includes(term);
      const matchTitle = (inc.title || "").toLowerCase().includes(term);
      const matchDesc = (inc.description || "").toLowerCase().includes(term);
      const matchService = (inc.service_name || "").toLowerCase().includes(term);
      const matchSupp = (inc.supplier_name || "").toLowerCase().includes(term);

      if (!matchCode && !matchClient && !matchContract && !matchTitle && !matchDesc && !matchService && !matchSupp) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Ordena ocorrências colocando prioridades maiores no topo (crítica > alta > media > baixa)
 * e desempatando por data mais recente.
 */
export function sortIncidentsByPriorityAndDate(incidents: OperationalIncident[]): OperationalIncident[] {
  return [...incidents].sort((a, b) => {
    const rankA = INCIDENT_PRIORITY_CONFIG[a.priority]?.rank ?? 99;
    const rankB = INCIDENT_PRIORITY_CONFIG[b.priority]?.rank ?? 99;
    if (rankA !== rankB) return rankA - rankB;

    const dateA = a.opened_at || a.created_at || "";
    const dateB = b.opened_at || b.created_at || "";
    return dateB.localeCompare(dateA);
  });
}

