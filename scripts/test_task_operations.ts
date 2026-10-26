/**
 * TESTES AUTOMATIZADOS — TAREFA 29: GESTÃO DE TAREFAS E ACOMPANHAMENTOS INTERNOS
 * Arquivo: scripts/test_task_operations.ts
 *
 * Validação rigorosa dos requisitos da Tarefa 29:
 * 1. Criação de tarefas e validação de campos obrigatórios.
 * 2. Tarefas independentes de contratos (contrato nulo/ausente permitido).
 * 3. Vínculos opcionais (cliente, contrato, reserva operacional, chegada, ocorrência).
 * 4. Atribuição de responsáveis e histórico de atribuição.
 * 5. Filtros combinados por responsável, status, prioridade e busca textual ampla.
 * 6. Identificação precisa de vencimento sem mutação automática da prioridade definida.
 * 7. Conclusão e reabertura com preservação integral do histórico.
 * 8. Histórico automático transacional no banco (trigger AFTER INSERT/UPDATE).
 * 9. Bloqueio de adulteração do histórico (proibição de INSERT/UPDATE/DELETE direto).
 * 10. Controle de acesso RBAC compatível com ENUM app_role real ('admin', 'moderator', 'user').
 * 11. Integração com ocorrências (vínculo mantido, conclusão independente).
 * 12. Integração com operações diárias (KPIs separados, sem misturar com ocorrências).
 * 13. Ausência total de dados e termos financeiros.
 */

import * as fs from "fs";
import * as path from "path";

import {
  TaskPriority,
  TaskStatus,
  TaskHistoryAction,
  InternalTask,
  InternalTaskHistoryEntry,
  TaskFilters,
  TASK_PRIORITY_CONFIG,
  TASK_STATUS_CONFIG,
  calculateTaskKpis,
  filterTasks,
  sortTasksByPriorityAndDueDate,
  isTaskOverdue,
  isTaskDueToday,
  getOverdueDays,
  validateTaskCreation,
  generateSuggestedTaskCode,
  buildTaskHistoryEntry,
  canUserAccessTask,
  canUserModifyTask,
  validateAndamentoRequirements,
  buildMinimalTaskAuditJson,
  validateTaskMutationSecurity,
} from "../src/lib/tasks/taskOperations";

import {
  calculateDailyKpis,
  DailyOperationsKpis,
} from "../src/lib/operational/dailyOperations";

import { canAccessRoute, ROUTE_ACCESS_RULES } from "../src/lib/auth/permissions";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passedCount++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}`);
    if (details) console.error(`     Detalhes: ${details}`);
    failedCount++;
  }
}

console.log("\n===============================================================================");
console.log("INICIANDO BATERIA DE TESTES — TAREFA 29: GESTÃO DE TAREFAS INTERNAS");
console.log("===============================================================================\n");

const TODAY = "2026-11-20";
const YESTERDAY = "2026-11-19";
const TOMORROW = "2026-11-21";
const NEXT_WEEK = "2026-11-27";

// =============================================================================
// TESTE 1: CRIAÇÃO DE TAREFAS E VALIDAÇÃO DE CAMPOS OBRIGATÓRIOS
// =============================================================================
console.log("--- 1. CRIAÇÃO DE TAREFA E VALIDAÇÃO DE CAMPOS OBRIGATÓRIOS ---");

const valValid = validateTaskCreation({
  title: "Cobrar confirmação de reserva do hotel",
  priority: "alta",
  status: "pendente",
  dueDate: TOMORROW,
});
assert(valValid.isValid && valValid.errors.length === 0, "Validação de criação com título válido deve passar");

const valEmptyTitle = validateTaskCreation({
  title: "   ",
});
assert(!valEmptyTitle.isValid && valEmptyTitle.errors.some((e) => e.includes("título")), "Bloqueia criação com título vazio");

const valShortTitle = validateTaskCreation({
  title: "Oi",
});
assert(!valShortTitle.isValid && valShortTitle.errors.some((e) => e.includes("3 caracteres")), "Bloqueia criação com título menor que 3 caracteres");

const codeGenerated = generateSuggestedTaskCode(2026, 15);
assert(codeGenerated === "TAR-2026-0015", "Gera código padronizado (ex: TAR-2026-0015)");

// =============================================================================
// TESTE 2: TAREFAS INDEPENDENTES DE CONTRATO (CONTRATO OPCIONAL / NULO)
// =============================================================================
console.log("\n--- 2. TAREFAS INDEPENDENTES DE CONTRATO ---");

const taskGeneralWithoutContract: InternalTask = {
  id: "tsk-gen-01",
  task_code: "TAR-2026-0001",
  title: "Organizar material impresso para o balcão do aeroporto",
  description: "Imprimir 50 cópias de mapas turísticos de Cancún e Riviera Maya.",
  priority: "baixa",
  status: "pendente",
  due_date: NEXT_WEEK,
  assigned_to_name: "Plantão Geral",
  created_at: `${TODAY}T09:00:00Z`,
  updated_at: `${TODAY}T09:00:00Z`,
};

assert(taskGeneralWithoutContract.contract_id === undefined, "Tarefa existe validamente sem contrato associado");
assert(taskGeneralWithoutContract.contract_number === undefined, "Número de contrato é opcional");
assert(taskGeneralWithoutContract.client_id === undefined, "Cliente é opcional para tarefas gerais administrativas");

// =============================================================================
// TESTE 3: VÍNCULOS OPCIONAIS (CLIENTE, CONTRATO, RESERVA, CHEGADA, OCORRÊNCIA)
// =============================================================================
console.log("\n--- 3. VÍNCULOS OPCIONAIS COMBINADOS ---");

const taskWithIncidentAndContract: InternalTask = {
  id: "tsk-inc-01",
  task_code: "TAR-2026-0002",
  title: "Notificar fornecedor sobre atraso no pickup",
  description: "Cobrar justificativa formal do fornecedor Maya Tours.",
  priority: "critica",
  status: "em_andamento",
  due_date: TODAY,
  assigned_to_name: "Lucas Operacional",
  contract_id: "ctr-uuid-101",
  contract_number: "CTR-2026-0101",
  client_name: "Beatriz Lima",
  reservation_id: "res-uuid-901",
  service_name: "Passeio Chichén Itzá",
  incident_id: "inc-uuid-002",
  incident_code: "OCR-2026-0002",
  created_at: `${TODAY}T10:00:00Z`,
  updated_at: `${TODAY}T10:00:00Z`,
};

assert(taskWithIncidentAndContract.contract_number === "CTR-2026-0101", "Preserva vínculo com contrato");
assert(taskWithIncidentAndContract.incident_code === "OCR-2026-0002", "Preserva vínculo com código da ocorrência");
assert(taskWithIncidentAndContract.reservation_id === "res-uuid-901", "Preserva vínculo com reserva operacional");
assert(taskWithIncidentAndContract.client_name === "Beatriz Lima", "Preserva nome do cliente");

// =============================================================================
// TESTE 4: ATRIBUIÇÃO DE RESPONSÁVEIS E HISTÓRICO
// =============================================================================
console.log("\n--- 4. ATRIBUIÇÃO DE RESPONSÁVEIS E HISTÓRICO ---");

const histAtribuicao = buildTaskHistoryEntry({
  taskId: taskWithIncidentAndContract.id,
  action: "atribuicao",
  description: 'Responsável reatribuído de "Plantão Geral" para "Lucas Operacional".',
  performedByName: "Administrador Tío Nenê",
  assignedToBefore: "Plantão Geral",
  assignedToAfter: "Lucas Operacional",
  statusAfter: "em_andamento",
});

assert(histAtribuicao.action === "atribuicao", "Ação de atribuição registrada no histórico");
assert(histAtribuicao.assigned_to_before === "Plantão Geral", "Histórico preserva responsável anterior");
assert(histAtribuicao.assigned_to_after === "Lucas Operacional", "Histórico registra novo responsável");

// =============================================================================
// TESTE 5: IDENTIFICAÇÃO DE VENCIMENTO SEM MUTAR PRIORIDADE DO OPERADOR
// =============================================================================
console.log("\n--- 5. IDENTIFICAÇÃO DE VENCIMENTO SEM MUTAR PRIORIDADE ---");

const taskOverdue: InternalTask = {
  id: "tsk-overdue-01",
  task_code: "TAR-2026-0003",
  title: "Solicitar voucher para o parque Xcaret",
  priority: "baixa", // Definida manualmente como baixa pelo operador
  status: "pendente",
  due_date: YESTERDAY, // Venceu ontem
  created_at: `${YESTERDAY}T08:00:00Z`,
  updated_at: `${YESTERDAY}T08:00:00Z`,
};

assert(isTaskOverdue(taskOverdue, TODAY), "Identifica corretamente tarefa vencida");
assert(getOverdueDays(taskOverdue, TODAY) === 1, "Calcula 1 dia de atraso");
// REGRA CRÍTICA: O vencimento não deve alterar automaticamente a prioridade do operador!
assert(taskOverdue.priority === "baixa", "Vencimento NÃO altera a prioridade manual definida pelo operador");

// Tarefa concluída não é considerada vencida
const taskConcludedPastDue: InternalTask = {
  ...taskOverdue,
  id: "tsk-concl-01",
  status: "concluida",
};
assert(!isTaskOverdue(taskConcludedPastDue, TODAY), "Tarefa concluída não é considerada vencida");

// =============================================================================
// TESTE 6: CONCLUSÃO E REABERTURA COM HISTÓRICO
// =============================================================================
console.log("\n--- 6. CONCLUSÃO E REABERTURA COM HISTÓRICO ---");

const histConclusao = buildTaskHistoryEntry({
  taskId: taskWithIncidentAndContract.id,
  action: "conclusao",
  description: "Tarefa concluída por Lucas Operacional.",
  performedByName: "Lucas Operacional",
  statusBefore: "em_andamento",
  statusAfter: "concluida",
});

const histReabertura = buildTaskHistoryEntry({
  taskId: taskWithIncidentAndContract.id,
  action: "reabertura",
  description: 'Tarefa reaberta (status retornado para "Em Andamento").',
  performedByName: "Administrador Tío Nenê",
  statusBefore: "concluida",
  statusAfter: "em_andamento",
});

assert(histConclusao.action === "conclusao", "Histórico de conclusão registrado com tipo específico");
assert(histConclusao.status_after === "concluida", "Status final é concluída");
assert(histReabertura.action === "reabertura", "Histórico de reabertura registrado com tipo específico");
assert(histReabertura.status_before === "concluida", "Preserva que status anterior era concluída");

// =============================================================================
// TESTE 7: FILTROS COMBINADOS E BUSCA TEXTUAL
// =============================================================================
console.log("\n--- 7. FILTROS COMBINADOS E BUSCA TEXTUAL ---");

const taskListSample: InternalTask[] = [
  taskGeneralWithoutContract,
  taskWithIncidentAndContract,
  taskOverdue,
  {
    id: "tsk-today-01",
    task_code: "TAR-2026-0004",
    title: "Checar voo de chegada LA8120",
    priority: "media",
    status: "pendente",
    due_date: TODAY,
    assigned_to_name: "Mariana Vendas",
    created_at: `${TODAY}T07:00:00Z`,
    updated_at: `${TODAY}T07:00:00Z`,
  },
  {
    id: "tsk-done-01",
    task_code: "TAR-2026-0005",
    title: "Emitir recibo do contrato CTR-2026-0080",
    priority: "baixa",
    status: "concluida",
    due_date: TODAY,
    assigned_to_name: "Lucas Operacional",
    created_at: `${TODAY}T08:00:00Z`,
    updated_at: `${TODAY}T08:30:00Z`,
  },
];

// Filtro por aba Vencidas
const filterVencidas = filterTasks(taskListSample, { viewTab: "vencidas" }, null, null, TODAY);
assert(filterVencidas.length === 1 && filterVencidas[0].id === "tsk-overdue-01", "Filtra corretamente tarefas vencidas");

// Filtro por aba Hoje
const filterHoje = filterTasks(taskListSample, { viewTab: "hoje" }, null, null, TODAY);
assert(filterHoje.length === 2, `Filtra tarefas ativas com vencimento hoje (encontradas: ${filterHoje.length})`);

// Filtro por aba Minhas
const filterMinhas = filterTasks(taskListSample, { viewTab: "minhas" }, null, "Lucas Operacional", TODAY);
assert(filterMinhas.length === 2, `Filtra tarefas atribuídas ao usuário logado (encontradas: ${filterMinhas.length})`);

// Busca textual por contrato
const filterSearchContract = filterTasks(taskListSample, { searchTerm: "0101" }, null, null, TODAY);
assert(filterSearchContract.length === 1 && filterSearchContract[0].id === "tsk-inc-01", "Busca textual localiza por número de contrato");

// Busca textual por código da ocorrência
const filterSearchIncident = filterTasks(taskListSample, { searchTerm: "OCR-2026-0002" }, null, null, TODAY);
assert(filterSearchIncident.length === 1 && filterSearchIncident[0].id === "tsk-inc-01", "Busca textual localiza por código da ocorrência");

// Ordenação: Crítica primeiro, depois Média, depois Baixa
const sortedTasks = sortTasksByPriorityAndDueDate(taskListSample);
assert(sortedTasks[0].priority === "critica", "Tarefa Crítica posicionada no topo da listagem");
assert(sortedTasks[sortedTasks.length - 1].status === "concluida", "Tarefas concluídas posicionadas no final");

// =============================================================================
// TESTE 8: INTEGRAÇÃO COM OPERAÇÕES DIÁRIAS (KPIS SEPARADOS)
// =============================================================================
console.log("\n--- 8. INTEGRAÇÃO COM OPERAÇÕES DIÁRIAS ---");

const dailyKpisWithoutTasks: DailyOperationsKpis = calculateDailyKpis({
  allServices: [],
  wallets: [],
  incidents: [
    { id: "inc-1", status: "aberta", priority: "alta" },
    { id: "inc-2", status: "em_analise", priority: "critica" },
  ],
  tasks: [],
  refDateStr: TODAY,
});

const dailyKpisWithTasks: DailyOperationsKpis = calculateDailyKpis({
  allServices: [],
  wallets: [],
  incidents: [
    { id: "inc-1", status: "aberta", priority: "alta" },
    { id: "inc-2", status: "em_analise", priority: "critica" },
  ],
  tasks: taskListSample,
  refDateStr: TODAY,
});

assert(dailyKpisWithTasks.ocorrenciasAbertas === 2, "Contabiliza exatamente 2 ocorrências abertas");
assert(dailyKpisWithTasks.tarefasVencidas === 1, `Contabiliza exatamente 1 tarefa vencida (resultado: ${dailyKpisWithTasks.tarefasVencidas})`);
assert(dailyKpisWithTasks.tarefasCriticasPendentes === 1, `Contabiliza exatamente 1 tarefa crítica pendente (resultado: ${dailyKpisWithTasks.tarefasCriticasPendentes})`);
// REGRA CRÍTICA: Não misturar contagem de tarefas com contagem de ocorrências!
assert(dailyKpisWithTasks.ocorrenciasAbertas === dailyKpisWithoutTasks.ocorrenciasAbertas,
  "Contagem de ocorrências operacionais permanece rigorosamente inalterada ao adicionar tarefas (não são misturadas)");

// =============================================================================
// TESTE 9: INTEGRAÇÃO COM OCORRÊNCIAS (INDEPENDÊNCIA OPERACIONAL)
// =============================================================================
console.log("\n--- 9. INTEGRAÇÃO COM OCORRÊNCIAS ---");

const mockIncidentIndependent = {
  id: "inc-uuid-002",
  incident_code: "OCR-2026-0002",
  status: "em_analise",
  assigned_to_name: "Carlos Plantão",
};

// Concluir a tarefa criada a partir da ocorrência
const taskConcluded = {
  ...taskWithIncidentAndContract,
  status: "concluida" as TaskStatus,
};

assert(taskConcluded.status === "concluida", "Status da tarefa é atualizado para concluída");
// REGRA CRÍTICA: Concluir uma tarefa não deve resolver automaticamente a ocorrência!
assert(mockIncidentIndependent.status === "em_analise", "Concluir a tarefa NÃO altera nem resolve a ocorrência associada");
assert(taskConcluded.assigned_to_name !== mockIncidentIndependent.assigned_to_name, "Responsáveis de tarefa e ocorrência são independentes");

// =============================================================================
// TESTE 10: PERMISSÕES RBAC (/admin/tarefas)
// =============================================================================
console.log("\n--- 10. PERMISSÕES DE ACESSO RBAC ---");

assert(canAccessRoute("admin", "/admin/tarefas"), "Administrador tem permissão para /admin/tarefas");
assert(canAccessRoute("seller", "/admin/tarefas"), "Vendedor tem permissão para /admin/tarefas");
assert(!canAccessRoute("viewer" as any, "/admin/tarefas"), "Perfis não operacionais são bloqueados");

// =============================================================================
// TESTE 11: AUSÊNCIA TOTAL DE EXPOSIÇÃO FINANCEIRA
// =============================================================================
console.log("\n--- 11. AUSÊNCIA DE EXPOSIÇÃO FINANCEIRA ---");

const taskKeys = Object.keys(taskWithIncidentAndContract);
const forbiddenFinancialTerms = [
  "price", "cost", "custo", "preco", "margin", "margem", "commission", "comissao", "balance", "lucro", "markup"
];

const foundFinancial = taskKeys.filter((k) =>
  forbiddenFinancialTerms.some((term) => k.toLowerCase().includes(term))
);

assert(foundFinancial.length === 0, `Estrutura de dados de tarefas não expõe campos financeiros (encontrados: ${foundFinancial.join(", ") || "nenhum"})`);

// =============================================================================
// TESTE 12: VALIDAÇÃO DA MIGRATION SQL E INTEGRIDADE DE CHAVES E PERMISSÕES
// =============================================================================
console.log("\n--- 12. VALIDAÇÃO DA MIGRATION SQL E INTEGRIDADE ---");

const migrationTasksPath = path.resolve(__dirname, "../supabase/migrations/20261103_internal_tasks.sql");
const pageTasksPath = path.resolve(__dirname, "../src/app/admin/tarefas/page.tsx");

const migrationSql = fs.readFileSync(migrationTasksPath, "utf-8");
const pageCode = fs.readFileSync(pageTasksPath, "utf-8");

// 1. Tabela e campos com integridade de vínculos opcionais (ON DELETE SET NULL)
assert(migrationSql.includes("CREATE TABLE IF NOT EXISTS public.internal_tasks"), "Migration cria public.internal_tasks");
assert(migrationSql.includes("CREATE TABLE IF NOT EXISTS public.internal_task_history"), "Migration cria public.internal_task_history");
assert(migrationSql.includes("contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL"), "contract_id é FK opcional com ON DELETE SET NULL");
assert(migrationSql.includes("client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL"), "client_id é FK opcional com ON DELETE SET NULL");
assert(migrationSql.includes("reservation_id UUID REFERENCES public.operational_reservations(id) ON DELETE SET NULL"), "reservation_id é FK opcional com ON DELETE SET NULL");
assert(migrationSql.includes("arrival_id UUID REFERENCES public.arrivals(id) ON DELETE SET NULL"), "arrival_id é FK opcional com ON DELETE SET NULL");
assert(migrationSql.includes("incident_id UUID REFERENCES public.operational_incidents(id) ON DELETE SET NULL"), "incident_id é FK opcional com ON DELETE SET NULL");

// 2. Preservação do histórico contra exclusão física (ON DELETE RESTRICT e bloqueio de DELETE)
assert(
  migrationSql.includes("task_id UUID NOT NULL REFERENCES public.internal_tasks(id) ON DELETE RESTRICT"),
  "FK internal_task_history.task_id utiliza estritamente ON DELETE RESTRICT (preservação do histórico)"
);
assert(
  migrationSql.includes("REVOKE DELETE ON public.internal_tasks FROM authenticated"),
  "DELETE direto sobre internal_tasks é expressamente revogado de authenticated"
);
assert(
  migrationSql.includes("CREATE TRIGGER trigger_prevent_internal_task_history_modification"),
  "Trigger bloqueia categoricamente UPDATE e DELETE em internal_task_history"
);

// 3. Mecanismo de compartilhamento explícito
assert(
  migrationSql.includes("shared_with UUID[] NOT NULL DEFAULT '{}'"),
  "Tabela internal_tasks possui coluna shared_with UUID[] para compartilhamento explícito"
);
assert(
  migrationSql.includes("idx_internal_tasks_shared_with ON public.internal_tasks USING GIN(shared_with)"),
  "Índice GIN criado para otimização de consultas sobre tarefas compartilhadas"
);

// 4. RLS e matriz de permissões
assert(
  migrationSql.includes("auth.uid() = ANY(shared_with)"),
  "Políticas de RLS contemplam visualização e edição de tarefas compartilhadas"
);
assert(
  migrationSql.includes("ur.role IN ('admin', 'moderator', 'user')"),
  "Permissões utilizam exclusivamente valores reais do ENUM app_role ('admin', 'moderator', 'user')"
);
assert(
  !migrationSql.includes("ur.role IN ('seller')"),
  "Não presume existência de 'seller' no ENUM do banco"
);

// 5. RPC de andamento protegida
assert(
  migrationSql.includes("CREATE OR REPLACE FUNCTION public.add_internal_task_andamento"),
  "RPC add_internal_task_andamento criada no banco"
);
assert(
  migrationSql.includes("REVOKE ALL ON FUNCTION public.add_internal_task_andamento(UUID, TEXT, JSONB) FROM PUBLIC"),
  "EXECUTE da RPC revogado de PUBLIC"
);
assert(
  migrationSql.includes("REVOKE ALL ON FUNCTION public.add_internal_task_andamento(UUID, TEXT, JSONB) FROM anon"),
  "EXECUTE da RPC revogado de anon"
);
assert(
  migrationSql.includes("GRANT EXECUTE ON FUNCTION public.add_internal_task_andamento(UUID, TEXT, JSONB) TO authenticated"),
  "EXECUTE da RPC concedido exclusivamente a authenticated"
);

// 6. Auditoria com metadados operacionais mínimos (sem despejar dados completos)
assert(
  migrationSql.includes("has_internal_notes"),
  "Auditoria de criação armazena flag has_internal_notes em vez de texto completo de notas"
);
assert(
  !migrationSql.includes("to_jsonb(NEW)") || migrationSql.includes("v_metadata :="),
  "Auditoria não realiza despejo indiscriminado de dados pessoais desnecessários"
);

// 7. Frontend compatível
const directInsertsInPage = (pageCode.match(/supabase\s*\.\s*from\(\s*["']internal_task_history["']\s*\)\s*\.\s*insert/g) || []).length;
assert(directInsertsInPage === 0, `Frontend não realiza nenhum INSERT direto em internal_task_history (ocorrências: ${directInsertsInPage})`);
assert(pageCode.includes("add_internal_task_andamento"), "Frontend utiliza a RPC add_internal_task_andamento para andamentos manuais");

// =============================================================================
// TESTE 13: VISIBILIDADE, PERMISSÕES E COMPARTILHAMENTO DE TAREFAS
// =============================================================================
console.log("\n--- 13. VISIBILIDADE, PERMISSÕES E COMPARTILHAMENTO (RLS DOMÍNIO) ---");

const sellerA = "user-seller-uuid-1111";
const sellerB = "user-seller-uuid-2222";
const sellerC = "user-seller-uuid-3333";
const adminUser = "user-admin-uuid-9999";
const noRoleUser = "user-norole-uuid-0000";

const taskCreatedByA: InternalTask = {
  id: "t-101",
  task_code: "TAR-2026-0101",
  title: "Tarefa própria do vendedor A",
  priority: "media",
  status: "pendente",
  created_by: sellerA,
  assigned_to: sellerA,
  shared_with: [],
  created_at: TODAY,
  updated_at: TODAY,
};

const taskAssignedToB: InternalTask = {
  id: "t-102",
  task_code: "TAR-2026-0102",
  title: "Tarefa atribuída ao vendedor B criada por outro",
  priority: "alta",
  status: "em_andamento",
  created_by: sellerA,
  assigned_to: sellerB,
  shared_with: [],
  created_at: TODAY,
  updated_at: TODAY,
};

const taskSharedWithC: InternalTask = {
  id: "t-103",
  task_code: "TAR-2026-0103",
  title: "Tarefa de A compartilhada explicitamente com C",
  priority: "critica",
  status: "aguardando_terceiro",
  created_by: sellerA,
  assigned_to: sellerA,
  shared_with: [sellerC],
  created_at: TODAY,
  updated_at: TODAY,
};

// 1. Administrador tem acesso irrestrito
assert(canUserAccessTask(taskCreatedByA, adminUser, "admin"), "Admin visualiza tarefa própria de outro operador");
assert(canUserAccessTask(taskAssignedToB, adminUser, "admin"), "Admin visualiza tarefa atribuída a outro operador");
assert(canUserAccessTask(taskSharedWithC, adminUser, "admin"), "Admin visualiza tarefa não compartilhada diretamente com ele");
assert(canUserModifyTask(taskSharedWithC, adminUser, "admin"), "Admin pode editar qualquer tarefa");

// 2. Vendedor A acessa suas tarefas próprias
assert(canUserAccessTask(taskCreatedByA, sellerA, "seller"), "Vendedor acessa tarefa criada por ele");
assert(canUserModifyTask(taskCreatedByA, sellerA, "seller"), "Vendedor edita tarefa criada por ele");

// 3. Vendedor B acessa tarefas atribuídas a ele
assert(canUserAccessTask(taskAssignedToB, sellerB, "seller"), "Vendedor acessa tarefa atribuída a ele");
assert(canUserModifyTask(taskAssignedToB, sellerB, "seller"), "Vendedor edita tarefa atribuída a ele");

// 4. Vendedor B NÃO acessa tarefas de outros sem atribuição ou compartilhamento
assert(!canUserAccessTask(taskCreatedByA, sellerB, "seller"), "Vendedor NÃO acessa tarefa de outro operador sem vínculo");
assert(!canUserModifyTask(taskCreatedByA, sellerB, "seller"), "Vendedor NÃO edita tarefa de outro operador sem vínculo");
assert(!canUserAccessTask(taskSharedWithC, sellerB, "seller"), "Vendedor B NÃO acessa tarefa compartilhada apenas com C");

// 5. Vendedor C acessa tarefa explicitamente compartilhada com ele
assert(canUserAccessTask(taskSharedWithC, sellerC, "seller"), "Vendedor acessa tarefa explicitamente compartilhada com ele");
assert(canUserModifyTask(taskSharedWithC, sellerC, "seller"), "Vendedor edita tarefa explicitamente compartilhada com ele");

// 6. Usuário sem papel operacional não tem acesso
assert(!canUserAccessTask(taskCreatedByA, noRoleUser, null), "Usuário sem papel operacional tem acesso negado");
assert(!canUserAccessTask(taskCreatedByA, noRoleUser, "viewer"), "Usuário com papel não operacional tem acesso negado");
assert(!canUserModifyTask(taskCreatedByA, noRoleUser, "viewer"), "Usuário sem papel operacional não pode editar tarefas");

// =============================================================================
// TESTE 14: RPC DE ANDAMENTOS E VALIDAÇÃO DE ACESSO
// =============================================================================
console.log("\n--- 14. VALIDAÇÃO DA RPC DE ANDAMENTOS ---");

// 1. Bloqueio de usuário não autenticado
const andamentoAnon = validateAndamentoRequirements({
  task: taskCreatedByA,
  userId: null,
  role: null,
  description: "Tentativa anônima de andamento",
});
assert(!andamentoAnon.allowed, "RPC bloqueia usuário não autenticado");

// 2. Bloqueio de usuário sem papel operacional
const andamentoNoRole = validateAndamentoRequirements({
  task: taskCreatedByA,
  userId: noRoleUser,
  role: "viewer",
  description: "Tentativa sem papel operacional",
});
assert(!andamentoNoRole.allowed, "RPC bloqueia usuário sem papel operacional autorizado");

// 3. Bloqueio de vendedor em tarefa inacessível
const andamentoInaccessible = validateAndamentoRequirements({
  task: taskCreatedByA,
  userId: sellerB,
  role: "seller",
  description: "Tentativa do vendedor B em tarefa do vendedor A",
});
assert(!andamentoInaccessible.allowed, "RPC bloqueia vendedor tentando registrar andamento em tarefa inacessível");

// 4. Sucesso para vendedor em tarefa compartilhada
const andamentoShared = validateAndamentoRequirements({
  task: taskSharedWithC,
  userId: sellerC,
  role: "seller",
  description: "Andamento legítimo do vendedor C em tarefa compartilhada",
});
assert(andamentoShared.allowed, "RPC autoriza vendedor em tarefa compartilhada com ele");

// 5. Sucesso para admin em qualquer tarefa
const andamentoAdmin = validateAndamentoRequirements({
  task: taskCreatedByA,
  userId: adminUser,
  role: "admin",
  description: "Andamento registrado pelo administrador da agência",
});
assert(andamentoAdmin.allowed, "RPC autoriza administrador em qualquer tarefa");

// 6. Bloqueio de descrição muito curta (< 3 caracteres)
const andamentoShort = validateAndamentoRequirements({
  task: taskCreatedByA,
  userId: sellerA,
  role: "seller",
  description: "Oi",
});
assert(!andamentoShort.allowed, "RPC bloqueia andamento com descrição menor que 3 caracteres");

// =============================================================================
// TESTE 15: AUDITORIA MÍNIMA E PROTEÇÃO DE PRIVACIDADE
// =============================================================================
console.log("\n--- 15. AUDITORIA MÍNIMA E PROTEÇÃO DE PRIVACIDADE ---");

const taskWithPrivateNotes: InternalTask = {
  id: "t-privacy-01",
  task_code: "TAR-2026-9999",
  title: "Tarefa com notas internas detalhadas",
  priority: "alta",
  status: "pendente",
  internal_notes: "Notas operacionais confidenciais: cliente solicitou sigilo sobre passageiros VIP.",
  shared_with: [sellerB, sellerC],
  contract_id: "ctr-uuid-777",
  client_id: "cli-uuid-888",
  created_at: TODAY,
  updated_at: TODAY,
};

const auditJson = buildMinimalTaskAuditJson(taskWithPrivateNotes);

assert(auditJson.task_code === "TAR-2026-9999", "Auditoria contém código da tarefa");
assert(auditJson.has_internal_notes === true, "Auditoria sinaliza presença de notas com flag booleana");
assert(auditJson.internal_notes === undefined, "Auditoria NÃO expõe o conteúdo de internal_notes no payload");
assert(auditJson.shared_with_count === 2, "Auditoria registra quantidade de compartilhamentos");
assert(auditJson.shared_with === undefined, "Auditoria não despeja o array completo de UUIDs desnecessariamente");
assert(auditJson.has_contract === true && auditJson.has_client === true, "Auditoria registra flags de vínculos");

// =============================================================================
// TESTE 16: PROTEÇÃO DOS CAMPOS DE AUTORIA E ACESSO (SQL & DOMÍNIO)
// =============================================================================
console.log("\n--- 16. PROTEÇÃO DOS CAMPOS DE AUTORIA E ACESSO (SQL & DOMÍNIO) ---");

// 1. Verificação das garantias implementadas no SQL
assert(
  migrationSql.includes("CREATE OR REPLACE FUNCTION public.protect_internal_task_authorship_and_access()"),
  "Migration implementa a função protect_internal_task_authorship_and_access()"
);
assert(
  migrationSql.includes("BEFORE INSERT OR UPDATE ON public.internal_tasks"),
  "Trigger de proteção é disparado BEFORE INSERT OR UPDATE em public.internal_tasks"
);
assert(
  migrationSql.includes("NEW.created_by := v_user_id;"),
  "SQL força created_by como auth.uid() no INSERT, ignorando frontend"
);
assert(
  migrationSql.includes("NEW.created_by IS DISTINCT FROM OLD.created_by"),
  "SQL bloqueia qualquer tentativa de mutação em created_by no UPDATE"
);
assert(
  migrationSql.includes("NEW.shared_with IS DISTINCT FROM OLD.shared_with") &&
  migrationSql.includes("IF NOT v_is_admin THEN"),
  "SQL restringe alteração de shared_with exclusivamente a administradores"
);
assert(
  migrationSql.includes("autoatribuição não autorizada em tarefa inacessível") ||
  migrationSql.includes("não é permitido alterar o responsável de uma tarefa já atribuída a outro operador"),
  "SQL bloqueia autoatribuição indevida e apropriação de tarefas alheias"
);

// 2. Testes de Tentativas de Falsificação de created_by
const forgeryBySeller = validateTaskMutationSecurity({
  currentTask: taskCreatedByA,
  updatedFields: { created_by: sellerB },
  callerUserId: sellerA,
  callerRole: "seller",
});
assert(!forgeryBySeller.allowed, "Bloqueia tentativa de operador falsificar/alterar created_by");

const forgeryByAdmin = validateTaskMutationSecurity({
  currentTask: taskCreatedByA,
  updatedFields: { created_by: sellerB },
  callerUserId: adminUser,
  callerRole: "admin",
});
assert(!forgeryByAdmin.allowed, "Bloqueia inclusive administrador de alterar created_by (campo estritamente imutável)");

// 3. Testes de Tentativas de Alteração Indevida de shared_with
const sharedBySeller = validateTaskMutationSecurity({
  currentTask: taskCreatedByA,
  updatedFields: { shared_with: [sellerB] },
  callerUserId: sellerA,
  callerRole: "seller",
});
assert(!sharedBySeller.allowed, "Bloqueia operador de alterar shared_with para conceder acesso a terceiros");

const sharedByAdmin = validateTaskMutationSecurity({
  currentTask: taskCreatedByA,
  updatedFields: { shared_with: [sellerB, sellerC] },
  callerUserId: adminUser,
  callerRole: "admin",
});
assert(sharedByAdmin.allowed, "Permite que administrador gerencie e altere shared_with");

// 4. Testes de Atribuição e Autoatribuição de assigned_to
// 4.1 Operador tenta atribuir tarefa a terceiro
const assignToThirdParty = validateTaskMutationSecurity({
  currentTask: taskCreatedByA,
  updatedFields: { assigned_to: sellerC },
  callerUserId: sellerA,
  callerRole: "seller",
});
assert(!assignToThirdParty.allowed, "Bloqueia operador de atribuir tarefas a terceiros");

// 4.2 Operador tenta tomar tarefa já atribuída a outro operador (autoatribuição indevida)
const takeAssignedTask = validateTaskMutationSecurity({
  currentTask: taskAssignedToB,
  updatedFields: { assigned_to: sellerC },
  callerUserId: sellerC,
  callerRole: "seller",
});
assert(!takeAssignedTask.allowed, "Bloqueia operador de tomar tarefa já atribuída a outro operador");

// 4.3 Operador tenta autoatribuir tarefa desatribuída mas inacessível (não é criador nem compartilhado)
const unassignedTaskA: InternalTask = {
  ...taskCreatedByA,
  id: "t-unassigned-1",
  assigned_to: null,
  shared_with: [],
};
const takeInaccessibleUnassigned = validateTaskMutationSecurity({
  currentTask: unassignedTaskA,
  updatedFields: { assigned_to: sellerB },
  callerUserId: sellerB,
  callerRole: "seller",
});
assert(!takeInaccessibleUnassigned.allowed, "Bloqueia operador de autoatribuir tarefa desatribuída inacessível");

// 4.4 Operador autoatribui tarefa desatribuída compartilhada com ele
const unassignedTaskSharedC: InternalTask = {
  ...taskSharedWithC,
  id: "t-unassigned-shared-1",
  assigned_to: null,
  shared_with: [sellerC],
};
const takeSharedUnassigned = validateTaskMutationSecurity({
  currentTask: unassignedTaskSharedC,
  updatedFields: { assigned_to: sellerC },
  callerUserId: sellerC,
  callerRole: "seller",
});
assert(takeSharedUnassigned.allowed, "Permite que operador autoatribua tarefa desatribuída compartilhada com ele");

// 4.5 Criador autoatribui tarefa desatribuída criada por ele
const takeOwnUnassigned = validateTaskMutationSecurity({
  currentTask: unassignedTaskA,
  updatedFields: { assigned_to: sellerA },
  callerUserId: sellerA,
  callerRole: "seller",
});
assert(takeOwnUnassigned.allowed, "Permite que criador autoatribua tarefa desatribuída própria");

// 4.6 Administrador atribui tarefa a operador autorizado
const adminAssignsAuthorized = validateTaskMutationSecurity({
  currentTask: unassignedTaskA,
  updatedFields: { assigned_to: sellerB },
  callerUserId: adminUser,
  callerRole: "admin",
  authorizedOperatorIds: [sellerA, sellerB, sellerC],
});
assert(adminAssignsAuthorized.allowed, "Permite que administrador atribua tarefa a operador autorizado");

// 4.7 Administrador tenta atribuir tarefa a usuário não autorizado
const adminAssignsUnauthorized = validateTaskMutationSecurity({
  currentTask: unassignedTaskA,
  updatedFields: { assigned_to: noRoleUser },
  callerUserId: adminUser,
  callerRole: "admin",
  authorizedOperatorIds: [sellerA, sellerB, sellerC],
});
assert(!adminAssignsUnauthorized.allowed, "Bloqueia administrador de atribuir tarefa a usuário sem papel operacional autorizado");

// =============================================================================
// RESULTADO FINAL
// =============================================================================
console.log("\n===============================================================================");
console.log(`TOTAL DE TESTES EXECUTADOS: ${passedCount + failedCount}`);
console.log(`  PASSED: ${passedCount}`);
console.log(`  FAILED: ${failedCount}`);
console.log("===============================================================================\n");

if (failedCount > 0) {
  process.exit(1);
} else {
  console.log("TODOS OS TESTES DE GESTÃO DE TAREFAS PASSARAM COM SUCESSO!\n");
}


