/**
 * GESTÃO DE TAREFAS E ACOMPANHAMENTOS INTERNOS — TÍO NENÊ v0.1.43
 * Arquivo: src/lib/tasks/taskOperations.ts
 *
 * Módulo de domínio para criação, atribuição, acompanhamento, auditoria e conclusão
 * de tarefas administrativas e operacionais da equipe da Tío Nenê Viagens.
 *
 * REGRAS CRÍTICAS DE NEGÓCIO E SEGURANÇA (TAREFA 29):
 * 1. TAREFAS INDEPENDENTES E VÍNCULOS OPCIONAIS:
 *    - Uma tarefa pode existir independentemente de contrato.
 *    - Vínculos opcionais com cliente, contrato, reserva, chegada e ocorrência.
 * 2. STATUS E PRIORIDADES:
 *    - Status: 'pendente', 'em_andamento', 'aguardando_terceiro', 'concluida', 'cancelada'.
 *    - Prioridades: 'baixa', 'media', 'alta', 'critica'.
 *    - Tarefas vencidas recebem destaque visual, mas o vencimento não altera automaticamente
 *      a prioridade definida pelo operador.
 * 3. HISTÓRICO PROTEGIDO E IMUTABILIDADE:
 *    - Histórico acumulativo e auditado no banco com autoria e data protegidas.
 *    - Proibição de INSERT/UPDATE/DELETE direto no histórico por clientes.
 * 4. INTEGRAÇÃO COM OCORRÊNCIAS:
 *    - Vínculo mantido com a ocorrência, mas com status e responsáveis independentes.
 *    - Concluir a tarefa não resolve automaticamente a ocorrência.
 * 5. CONFIDENCIALIDADE FINANCEIRA:
 *    - NENHUM dado de custos, margens, comissões ou preços é exposto ou manipulado.
 */

// =============================================================================
// TIPOS E ENUMS DO DOMÍNIO
// =============================================================================

export type TaskPriority = "baixa" | "media" | "alta" | "critica";

export type TaskStatus =
  | "pendente"
  | "em_andamento"
  | "aguardando_terceiro"
  | "concluida"
  | "cancelada";

export type TaskHistoryAction =
  | "criacao"
  | "alteracao_status"
  | "alteracao_prioridade"
  | "atribuicao"
  | "alteracao_prazo"
  | "conclusao"
  | "reabertura"
  | "cancelamento"
  | "edicao"
  | "andamento";

export interface InternalTaskHistoryEntry {
  id: string;
  task_id: string;
  action: TaskHistoryAction;
  description: string;
  status_before?: string | null;
  status_after?: string | null;
  priority_before?: string | null;
  priority_after?: string | null;
  assigned_to_before?: string | null;
  assigned_to_after?: string | null;
  due_date_before?: string | null;
  due_date_after?: string | null;
  performed_by?: string | null;
  performed_by_name: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface InternalTask {
  id: string;
  task_code: string; // Ex: TAR-2026-0001
  title: string;
  description?: string | null;
  priority: TaskPriority;
  status: TaskStatus;

  due_date?: string | null; // Formato YYYY-MM-DD
  completed_at?: string | null;
  completed_by?: string | null;
  completed_by_name?: string | null;

  internal_notes?: string | null;

  assigned_to?: string | null;
  assigned_to_name?: string | null;

  created_by?: string | null;
  created_by_name?: string | null;

  // Compartilhamento Explícito
  shared_with?: string[] | null;

  // Vínculos Opcionais
  client_id?: string | null;
  client_name?: string | null;
  contract_id?: string | null;
  contract_number?: string | null;
  reservation_id?: string | null;
  service_name?: string | null;
  arrival_id?: string | null;
  incident_id?: string | null;
  incident_code?: string | null;

  created_at: string;
  updated_at: string;

  // Histórico associado (carregado para exibição detalhada)
  history?: InternalTaskHistoryEntry[];
}

export interface TaskFilters {
  viewTab?: "todas" | "minhas" | "hoje" | "vencidas" | "concluidas";
  searchTerm?: string;
  status?: string;
  priority?: string;
  assignedTo?: string;
  startDate?: string;
  endDate?: string;
}

export interface TaskKpis {
  total: number;
  abertas: number;
  emAndamento: number;
  vencidas: number;
  paraHoje: number;
  concluidas: number;
  canceladas: number;
  minhas: number;
}

// =============================================================================
// CONFIGURAÇÕES VISUAIS E METADADOS
// =============================================================================

export const TASK_PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; color: string; border: string; bg: string; rank: number }
> = {
  critica: {
    label: "Crítica",
    color: "#dc2626",
    border: "#fca5a5",
    bg: "rgba(220, 38, 38, 0.08)",
    rank: 1,
  },
  alta: {
    label: "Alta",
    color: "#ea580c",
    border: "#fdba74",
    bg: "rgba(234, 88, 12, 0.08)",
    rank: 2,
  },
  media: {
    label: "Média",
    color: "#d97706",
    border: "#fcd34d",
    bg: "rgba(217, 119, 6, 0.08)",
    rank: 3,
  },
  baixa: {
    label: "Baixa",
    color: "#16a34a",
    border: "#86efac",
    bg: "rgba(22, 163, 74, 0.08)",
    rank: 4,
  },
};

export const TASK_STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; color: string; border: string; bg: string; description: string }
> = {
  pendente: {
    label: "Pendente",
    color: "#2563eb",
    border: "#93c5fd",
    bg: "rgba(37, 99, 235, 0.08)",
    description: "Tarefa cadastrada aguardando início de execução",
  },
  em_andamento: {
    label: "Em Andamento",
    color: "#d97706",
    border: "#fcd34d",
    bg: "rgba(217, 119, 6, 0.08)",
    description: "Equipe está ativamente trabalhando na atividade",
  },
  aguardando_terceiro: {
    label: "Aguardando Terceiro",
    color: "#7c3aed",
    border: "#c4b5fd",
    bg: "rgba(124, 58, 237, 0.08)",
    description: "Aguardando resposta de fornecedor, cliente ou parceiro",
  },
  concluida: {
    label: "Concluída",
    color: "#16a34a",
    border: "#86efac",
    bg: "rgba(22, 163, 74, 0.08)",
    description: "Atividade finalizada e entregue com sucesso",
  },
  cancelada: {
    label: "Cancelada",
    color: "#64748b",
    border: "#cbd5e1",
    bg: "rgba(100, 116, 139, 0.08)",
    description: "Tarefa descontinuada ou não mais necessária",
  },
};

// =============================================================================
// VALIDAÇÃO E GERAÇÃO DE CÓDIGO
// =============================================================================

export function generateSuggestedTaskCode(year: number, sequenceNumber: number): string {
  const padSeq = String(sequenceNumber).padStart(4, "0");
  return `TAR-${year}-${padSeq}`;
}

export function validateTaskCreation(params: {
  title: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  const cleanTitle = (params.title || "").trim();
  if (!cleanTitle) {
    errors.push("O título da tarefa é obrigatório.");
  } else if (cleanTitle.length < 3) {
    errors.push("O título da tarefa deve conter no mínimo 3 caracteres.");
  }

  if (params.priority) {
    const validPriorities: TaskPriority[] = ["baixa", "media", "alta", "critica"];
    if (!validPriorities.includes(params.priority)) {
      errors.push("Prioridade informada é inválida.");
    }
  }

  if (params.status) {
    const validStatuses: TaskStatus[] = [
      "pendente",
      "em_andamento",
      "aguardando_terceiro",
      "concluida",
      "cancelada",
    ];
    if (!validStatuses.includes(params.status)) {
      errors.push("Status informado é inválido.");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// =============================================================================
// IDENTIFICAÇÃO DE VENCIMENTO E DATAS
// =============================================================================

/**
 * Retorna true se a tarefa estiver vencida (prazo anterior à data de referência)
 * e o status ainda estiver ativo (pendente, em_andamento ou aguardando_terceiro).
 * NOTA CRÍTICA: O vencimento não altera a prioridade definida pelo operador.
 */
export function isTaskOverdue(task: InternalTask, refDateStr?: string): boolean {
  if (!task.due_date) return false;
  if (task.status === "concluida" || task.status === "cancelada") return false;

  const ref = refDateStr || new Date().toISOString().split("T")[0];
  const taskDate = task.due_date.split("T")[0];
  return taskDate < ref;
}

/**
 * Retorna true se o prazo da tarefa expira na data de referência (hoje).
 */
export function isTaskDueToday(task: InternalTask, refDateStr?: string): boolean {
  if (!task.due_date) return false;
  if (task.status === "concluida" || task.status === "cancelada") return false;

  const ref = refDateStr || new Date().toISOString().split("T")[0];
  const taskDate = task.due_date.split("T")[0];
  return taskDate === ref;
}

/**
 * Calcula o número de dias de atraso de uma tarefa vencida.
 */
export function getOverdueDays(task: InternalTask, refDateStr?: string): number {
  if (!task.due_date) return 0;
  const ref = new Date((refDateStr || new Date().toISOString().split("T")[0]) + "T00:00:00Z");
  const taskDate = new Date(task.due_date.split("T")[0] + "T00:00:00Z");
  const diffTime = ref.getTime() - taskDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

// =============================================================================
// HISTÓRICO E AUDITORIA LOCAL (UI OTIMISTA)
// =============================================================================

export function buildTaskHistoryEntry(params: {
  taskId: string;
  action: TaskHistoryAction;
  description: string;
  performedByName: string;
  performedBy?: string | null;
  statusBefore?: string | null;
  statusAfter?: string | null;
  priorityBefore?: string | null;
  priorityAfter?: string | null;
  assignedToBefore?: string | null;
  assignedToAfter?: string | null;
  dueDateBefore?: string | null;
  dueDateAfter?: string | null;
  metadata?: Record<string, any>;
}): InternalTaskHistoryEntry {
  return {
    id: `hist-task-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    task_id: params.taskId,
    action: params.action,
    description: params.description,
    status_before: params.statusBefore || null,
    status_after: params.statusAfter || null,
    priority_before: params.priorityBefore || null,
    priority_after: params.priorityAfter || null,
    assigned_to_before: params.assignedToBefore || null,
    assigned_to_after: params.assignedToAfter || null,
    due_date_before: params.dueDateBefore || null,
    due_date_after: params.dueDateAfter || null,
    performed_by: params.performedBy || null,
    performed_by_name: params.performedByName || "Operador",
    metadata: params.metadata || {},
    created_at: new Date().toISOString(),
  };
}

// =============================================================================
// CÁLCULO DE KPIS
// =============================================================================

export function calculateTaskKpis(
  tasks: InternalTask[],
  currentUserId?: string | null,
  currentUserName?: string | null,
  refDateStr?: string
): TaskKpis {
  const ref = refDateStr || new Date().toISOString().split("T")[0];
  const userLower = (currentUserName || "").toLowerCase().trim();

  let abertas = 0;
  let emAndamento = 0;
  let vencidas = 0;
  let paraHoje = 0;
  let concluidas = 0;
  let canceladas = 0;
  let minhas = 0;

  tasks.forEach((t) => {
    const isClosed = t.status === "concluida" || t.status === "cancelada";

    if (!isClosed) {
      abertas++;
      if (t.status === "em_andamento") {
        emAndamento++;
      }
      if (isTaskOverdue(t, ref)) {
        vencidas++;
      }
      if (isTaskDueToday(t, ref)) {
        paraHoje++;
      }
    }

    if (t.status === "concluida") {
      concluidas++;
    } else if (t.status === "cancelada") {
      canceladas++;
    }

    // Minhas tarefas (atribuídas ao usuário logado por ID ou nome)
    const isAssignedToMe =
      (currentUserId && t.assigned_to === currentUserId) ||
      (userLower && (t.assigned_to_name || "").toLowerCase().includes(userLower));

    if (isAssignedToMe && !isClosed) {
      minhas++;
    }
  });

  return {
    total: tasks.length,
    abertas,
    emAndamento,
    vencidas,
    paraHoje,
    concluidas,
    canceladas,
    minhas,
  };
}

// =============================================================================
// FILTRAGEM COMBINADA E ORDENAÇÃO
// =============================================================================

export function filterTasks(
  tasks: InternalTask[],
  filters: TaskFilters,
  currentUserId?: string | null,
  currentUserName?: string | null,
  refDateStr?: string
): InternalTask[] {
  const { viewTab = "todas", searchTerm, status, priority, assignedTo, startDate, endDate } = filters;
  const ref = refDateStr || new Date().toISOString().split("T")[0];
  const term = (searchTerm || "").toLowerCase().trim();
  const userLower = (currentUserName || "").toLowerCase().trim();

  return tasks.filter((t) => {
    const isClosed = t.status === "concluida" || t.status === "cancelada";

    // 1. Aba Rápida (ViewTab)
    if (viewTab === "minhas") {
      const isAssigned =
        (currentUserId && t.assigned_to === currentUserId) ||
        (userLower && (t.assigned_to_name || "").toLowerCase().includes(userLower));
      if (!isAssigned) return false;
    } else if (viewTab === "hoje") {
      if (!isTaskDueToday(t, ref)) return false;
    } else if (viewTab === "vencidas") {
      if (!isTaskOverdue(t, ref)) return false;
    } else if (viewTab === "concluidas") {
      if (t.status !== "concluida") return false;
    }

    // 2. Filtro de Status
    if (status && status !== "todos") {
      if (status === "ativas") {
        if (isClosed) return false;
      } else if (t.status !== status) {
        return false;
      }
    }

    // 3. Filtro de Prioridade
    if (priority && priority !== "todas") {
      if (t.priority !== priority) return false;
    }

    // 4. Filtro de Responsável
    if (assignedTo && assignedTo !== "todos") {
      const respName = (t.assigned_to_name || "").toLowerCase();
      if (!respName.includes(assignedTo.toLowerCase())) return false;
    }

    // 5. Filtro de Prazo (Data)
    if (startDate && t.due_date) {
      const taskDate = t.due_date.split("T")[0];
      if (taskDate < startDate) return false;
    }
    if (endDate && t.due_date) {
      const taskDate = t.due_date.split("T")[0];
      if (taskDate > endDate) return false;
    }

    // 6. Busca Textual Ampla
    if (term) {
      const matchCode = (t.task_code || "").toLowerCase().includes(term);
      const matchTitle = (t.title || "").toLowerCase().includes(term);
      const matchDesc = (t.description || "").toLowerCase().includes(term);
      const matchClient = (t.client_name || "").toLowerCase().includes(term);
      const matchContract = (t.contract_number || "").toLowerCase().includes(term);
      const matchIncident = (t.incident_code || "").toLowerCase().includes(term);
      const matchService = (t.service_name || "").toLowerCase().includes(term);
      const matchNotes = (t.internal_notes || "").toLowerCase().includes(term);

      if (
        !matchCode &&
        !matchTitle &&
        !matchDesc &&
        !matchClient &&
        !matchContract &&
        !matchIncident &&
        !matchService &&
        !matchNotes
      ) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Ordena tarefas com base na urgência:
 * - Tarefas ativas antes de concluídas/canceladas
 * - Prioridades maiores primeiro (crítica > alta > media > baixa)
 * - Prazos mais próximos/vencidos primeiro
 * - Data de criação recente como desempate
 */
export function sortTasksByPriorityAndDueDate(tasks: InternalTask[]): InternalTask[] {
  return [...tasks].sort((a, b) => {
    const isClosedA = a.status === "concluida" || a.status === "cancelada" ? 1 : 0;
    const isClosedB = b.status === "concluida" || b.status === "cancelada" ? 1 : 0;
    if (isClosedA !== isClosedB) return isClosedA - isClosedB;

    const rankA = TASK_PRIORITY_CONFIG[a.priority]?.rank ?? 99;
    const rankB = TASK_PRIORITY_CONFIG[b.priority]?.rank ?? 99;
    if (rankA !== rankB) return rankA - rankB;

    const dateA = a.due_date || "9999-99-99";
    const dateB = b.due_date || "9999-99-99";
    if (dateA !== dateB) return dateA.localeCompare(dateB);

    return (b.created_at || "").localeCompare(a.created_at || "");
  });
}

// =============================================================================
// REGRAS DE AUTORIZAÇÃO, VISIBILIDADE E AUDITORIA MÍNIMA (RLS & DOMÍNIO)
// =============================================================================

/**
 * Valida se um usuário possui permissão de leitura sobre uma tarefa:
 * - Admin: visualiza todas as tarefas.
 * - Operador/Vendedor (papel operacional real): visualiza tarefas criadas por ele,
 *   atribuídas a ele ou explicitamente compartilhadas com ele.
 * - Usuário sem papel operacional: nenhum acesso.
 */
export function canUserAccessTask(
  task: InternalTask,
  userId?: string | null,
  role?: string | null
): boolean {
  if (!userId) return false;
  if (role === "admin") return true;

  // Papéis operacionais autorizados (no app 'seller'; no banco 'moderator'/'user')
  const isOperationalRole = role === "seller" || role === "moderator" || role === "user";
  if (!isOperationalRole) return false;

  const isCreator = task.created_by === userId;
  const isAssignee = task.assigned_to === userId;
  const isShared = Array.isArray(task.shared_with) && task.shared_with.includes(userId);

  return isCreator || isAssignee || isShared;
}

/**
 * Valida se um usuário possui permissão de edição (UPDATE) sobre uma tarefa.
 * Mesma regra da matriz de acesso operacional: admin edita tudo; operador edita
 * tarefas próprias, atribuídas ou compartilhadas.
 */
export function canUserModifyTask(
  task: InternalTask,
  userId?: string | null,
  role?: string | null
): boolean {
  return canUserAccessTask(task, userId, role);
}

/**
 * Valida os requisitos para a RPC add_internal_task_andamento:
 * - Usuário autenticado
 * - Papel operacional real
 * - Acesso à tarefa específica
 * - Descrição com no mínimo 3 caracteres
 */
export function validateAndamentoRequirements(params: {
  task: InternalTask;
  userId?: string | null;
  role?: string | null;
  description?: string;
}): { allowed: boolean; reason?: string } {
  if (!params.userId) {
    return { allowed: false, reason: "Acesso negado: operação requer usuário autenticado." };
  }

  const isOperationalRole =
    params.role === "admin" ||
    params.role === "seller" ||
    params.role === "moderator" ||
    params.role === "user";

  if (!isOperationalRole) {
    return { allowed: false, reason: "Acesso negado: usuário não possui papel operacional." };
  }

  if (!canUserAccessTask(params.task, params.userId, params.role)) {
    return {
      allowed: false,
      reason: "Acesso negado: tarefa não encontrada ou usuário não autorizado para registrar andamento.",
    };
  }

  const cleanDesc = (params.description || "").trim();
  if (cleanDesc.length < 3) {
    return {
      allowed: false,
      reason: "A descrição do andamento deve conter no mínimo 3 caracteres informativos.",
    };
  }

  return { allowed: true };
}

/**
 * Gera o payload de metadados operacionais mínimos para auditoria de criação,
 * garantindo que NÃO sejam armazenados textos completos de notas internas
 * nem dados pessoais desnecessários no JSON de histórico.
 */
export function buildMinimalTaskAuditJson(task: InternalTask): Record<string, any> {
  return {
    task_code: task.task_code,
    title: task.title,
    priority: task.priority,
    status: task.status,
    assigned_to: task.assigned_to || null,
    due_date: task.due_date || null,
    has_contract: Boolean(task.contract_id),
    has_client: Boolean(task.client_id),
    has_incident: Boolean(task.incident_id),
    has_reservation: Boolean(task.reservation_id),
    has_arrival: Boolean(task.arrival_id),
    has_internal_notes: Boolean(task.internal_notes && task.internal_notes.trim().length > 0),
    shared_with_count: Array.isArray(task.shared_with) ? task.shared_with.length : 0,
  };
}

/**
 * Valida as regras de segurança para mutação e proteção de campos de autoria e acesso:
 * 1. created_by imutável após a criação.
 * 2. shared_with só pode ser alterado por administradores.
 * 3. assigned_to só pode ser atribuído a terceiros por administradores.
 * 4. Bloqueia autoatribuição indevida em tarefas de terceiros já atribuídas ou inacessíveis.
 */
export function validateTaskMutationSecurity(params: {
  currentTask: InternalTask;
  updatedFields: Partial<InternalTask>;
  callerUserId?: string | null;
  callerRole?: string | null;
  authorizedOperatorIds?: string[];
}): { allowed: boolean; reason?: string } {
  const { currentTask, updatedFields, callerUserId, callerRole, authorizedOperatorIds = [] } = params;
  if (!callerUserId) {
    return { allowed: false, reason: "Acesso negado: operação requer usuário autenticado." };
  }

  const isAdmin = callerRole === "admin";

  // 1. created_by é estritamente imutável
  if (
    updatedFields.created_by !== undefined &&
    updatedFields.created_by !== currentTask.created_by
  ) {
    return {
      allowed: false,
      reason: "Operação não permitida: o campo created_by é estritamente imutável após a criação da tarefa.",
    };
  }

  // 2. shared_with só pode ser alterado por administradores
  if (updatedFields.shared_with !== undefined) {
    const isSharedDifferent =
      JSON.stringify(updatedFields.shared_with || []) !== JSON.stringify(currentTask.shared_with || []);
    if (isSharedDifferent && !isAdmin) {
      return {
        allowed: false,
        reason: "Acesso negado: apenas administradores podem modificar o compartilhamento de tarefas (shared_with).",
      };
    }
  }

  // 3. assigned_to
  if (
    updatedFields.assigned_to !== undefined &&
    updatedFields.assigned_to !== currentTask.assigned_to
  ) {
    const newAssignedTo = updatedFields.assigned_to;
    const oldAssignedTo = currentTask.assigned_to;

    if (isAdmin) {
      if (newAssignedTo && authorizedOperatorIds.length > 0 && !authorizedOperatorIds.includes(newAssignedTo)) {
        return {
          allowed: false,
          reason: "Operação não permitida: o responsável atribuído deve possuir papel operacional autorizado.",
        };
      }
    } else {
      // Não administrador
      // a) Não pode atribuir para terceiro
      if (newAssignedTo && newAssignedTo !== callerUserId) {
        return {
          allowed: false,
          reason: "Acesso negado: apenas administradores podem reatribuir tarefas a outros operadores.",
        };
      }

      // b) Não pode tomar tarefa já atribuída a outro operador
      if (oldAssignedTo && oldAssignedTo !== callerUserId) {
        return {
          allowed: false,
          reason: "Acesso negado: não é permitido alterar o responsável de uma tarefa já atribuída a outro operador.",
        };
      }

      // c) Não pode autoatribuir se não tiver autorização na tarefa
      if (newAssignedTo === callerUserId && !oldAssignedTo) {
        const isOwnerOrShared =
          currentTask.created_by === callerUserId ||
          (Array.isArray(currentTask.shared_with) && currentTask.shared_with.includes(callerUserId));
        if (!isOwnerOrShared) {
          return {
            allowed: false,
            reason: "Acesso negado: autoatribuição não autorizada em tarefa inacessível.",
          };
        }
      }
    }
  }

  return { allowed: true };
}

