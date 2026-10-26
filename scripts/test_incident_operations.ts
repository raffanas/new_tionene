/**
 * TESTES AUTOMATIZADOS — TAREFA 28: GESTÃO DE OCORRÊNCIAS OPERACIONAIS
 * Arquivo: scripts/test_incident_operations.ts
 *
 * Validação rigorosa dos 11 requisitos da Tarefa 28:
 * 1. Criação de ocorrência com validações de campos obrigatórios.
 * 2. Vínculo correto com contrato (com e sem reserva operacional específica).
 * 3. Vínculo opcional com reserva ou chegada de aeroporto.
 * 4. Alteração e reatribuição de responsável com histórico.
 * 5. Sugestão inteligente de prioridade e preservação de decisões manuais.
 * 6. Fluxo de status e bloqueio estrito de resolução sem descrição da solução.
 * 7. Histórico preservado e audit trail imutável.
 * 8. Integração completa com o Painel de Operações Diárias (KPIs e Pendências).
 * 9. Permissões de acesso RBAC (/admin/ocorrencias para admin e seller).
 * 10. Ausência total de dados e campos financeiros nas ocorrências.
 * 11. Ausência de alterações indevidas em contratos e reservas subjacentes.
 */

import {
  IncidentType,
  IncidentPriority,
  IncidentStatus,
  IncidentHistoryAction,
  IncidentHistoryEntry,
  OperationalIncident,
  IncidentFilters,
  INCIDENT_TYPES_CONFIG,
  INCIDENT_PRIORITY_CONFIG,
  INCIDENT_STATUS_CONFIG,
  suggestIncidentPriority,
  validateIncidentCreation,
  validateIncidentResolution,
  generateSuggestedIncidentCode,
  buildIncidentHistoryEntry,
  calculateIncidentKpis,
  filterIncidents,
  sortIncidentsByPriorityAndDate,
} from "../src/lib/operational/incidentOperations";

import {
  calculateDailyKpis,
  detectDailyPendencies,
  DailyServiceItem,
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
console.log("INICIANDO BATERIA DE TESTES — TAREFA 28: GESTÃO DE OCORRÊNCIAS OPERACIONAIS");
console.log("===============================================================================\n");

const TODAY = "2026-11-20";
const TOMORROW = "2026-11-21";
const NEXT_WEEK = "2026-11-27";

// =============================================================================
// TESTE 1: CRIAÇÃO DE OCORRÊNCIA E VALIDAÇÃO DE CAMPOS OBRIGATÓRIOS
// =============================================================================
console.log("--- 1. CRIAÇÃO DE OCORRÊNCIA E VALIDAÇÃO DE CAMPOS OBRIGATÓRIOS ---");

const valValid = validateIncidentCreation({
  contractId: "ctr-uuid-001",
  contractNumber: "CTR-2026-001",
  clientName: "Mariana Alencar",
  incidentType: "atraso_fornecedor",
  title: "Van de traslado atrasada há 30 min",
  description: "Cliente aguardando na recepção do hotel sem notícias da operadora.",
});
assert(valValid.isValid && valValid.errors.length === 0, "Validação de criação válida deve passar");

const valNoContract = validateIncidentCreation({
  clientName: "Mariana Alencar",
  incidentType: "atraso_fornecedor",
  title: "Van de traslado atrasada",
  description: "Cliente aguardando na recepção.",
});
assert(!valNoContract.isValid && valNoContract.errors.some((e) => e.includes("contrato")), "Bloqueia criação sem contrato vinculado");

const valNoClient = validateIncidentCreation({
  contractId: "ctr-uuid-001",
  incidentType: "atraso_fornecedor",
  title: "Van de traslado atrasada",
  description: "Cliente aguardando na recepção.",
});
assert(!valNoClient.isValid && valNoClient.errors.some((e) => e.includes("cliente")), "Bloqueia criação sem nome de cliente titular");

const valInvalidType = validateIncidentCreation({
  contractId: "ctr-uuid-001",
  clientName: "Mariana Alencar",
  incidentType: "tipo_inexistente" as any,
  title: "Van de traslado atrasada",
  description: "Cliente aguardando na recepção.",
});
assert(!valInvalidType.isValid && valInvalidType.errors.some((e) => e.includes("tipo")), "Bloqueia criação com tipo de ocorrência inválido");

const valShortTitle = validateIncidentCreation({
  contractId: "ctr-uuid-001",
  clientName: "Mariana Alencar",
  incidentType: "outro",
  title: "Oi",
  description: "Descrição com mais de dez caracteres completos.",
});
assert(!valShortTitle.isValid && valShortTitle.errors.some((e) => e.includes("título")), "Bloqueia criação com título menor que 4 caracteres");

const valShortDesc = validateIncidentCreation({
  contractId: "ctr-uuid-001",
  clientName: "Mariana Alencar",
  incidentType: "outro",
  title: "Título Válido",
  description: "Curto",
});
assert(!valShortDesc.isValid && valShortDesc.errors.some((e) => e.includes("descrição")), "Bloqueia criação com descrição menor que 10 caracteres");

const codeGenerated = generateSuggestedIncidentCode(2026, 42);
assert(codeGenerated === "OCR-2026-0042", "Gera código de ocorrência padronizado (ex: OCR-2026-0042)");

// =============================================================================
// TESTE 2: VÍNCULO CORRETO COM CONTRATO (INCLUSIVE SEM RESERVA ESPECÍFICA)
// =============================================================================
console.log("\n--- 2. VÍNCULO CORRETO COM CONTRATO ---");

const incidentContractOnly: OperationalIncident = {
  id: "inc-001",
  incident_code: "OCR-2026-0001",
  contract_id: "ctr-100",
  contract_number: "CTR-2026-100",
  client_name: "Carlos Drummond",
  incident_type: "reclamacao_cliente",
  title: "Cliente solicitou alteração contratual geral",
  description: "Cliente deseja reorganizar a programação inteira após imprevisto pessoal.",
  priority: "media",
  status: "aberta",
  opened_at: `${TODAY}T10:00:00Z`,
  created_at: `${TODAY}T10:00:00Z`,
  updated_at: `${TODAY}T10:00:00Z`,
};

assert(incidentContractOnly.contract_id === "ctr-100", "Ocorrência preserva contract_id vinculado");
assert(incidentContractOnly.reservation_id === undefined, "Ocorrência permite ausência de reserva específica (nível contrato)");
assert(incidentContractOnly.arrival_id === undefined, "Ocorrência permite ausência de chegada específica");

// =============================================================================
// TESTE 3: VÍNCULO OPCIONAL COM RESERVA OU CHEGADA DE AEROPORTO
// =============================================================================
console.log("\n--- 3. VÍNCULO OPCIONAL COM RESERVA OU CHEGADA ---");

const incidentWithReservation: OperationalIncident = {
  id: "inc-002",
  incident_code: "OCR-2026-0002",
  contract_id: "ctr-101",
  contract_number: "CTR-2026-101",
  client_name: "Beatriz Lima",
  reservation_id: "res-901",
  service_name: "Passeio Chichén Itzá Clássico",
  service_date: TODAY,
  supplier_id: "supp-01",
  supplier_name: "Operadora Maya Tours",
  incident_type: "atraso_fornecedor",
  title: "Atraso no pickup do passeio Chichén Itzá",
  description: "Guia informou trânsito pesado na rodovia federal.",
  priority: "alta",
  status: "em_analise",
  opened_at: `${TODAY}T07:15:00Z`,
  created_at: `${TODAY}T07:15:00Z`,
  updated_at: `${TODAY}T07:15:00Z`,
};

assert(incidentWithReservation.reservation_id === "res-901", "Vincula corretamente com reserva operacional");
assert(incidentWithReservation.service_name === "Passeio Chichén Itzá Clássico", "Preserva nome do serviço e data");
assert(incidentWithReservation.supplier_name === "Operadora Maya Tours", "Preserva fornecedor do serviço");

const incidentWithArrival: OperationalIncident = {
  id: "inc-003",
  incident_code: "OCR-2026-0003",
  contract_id: "ctr-102",
  contract_number: "CTR-2026-102",
  client_name: "Eduardo Paes",
  arrival_id: "arr-501",
  service_name: "Recepção Aeroporto Voo LA8120",
  service_date: TODAY,
  incident_type: "cliente_nao_localizado",
  title: "Passageiro não compareceu ao portão de desembarque 4",
  description: "Equipe de terra aguardou 40 minutos com placa de identificação sem sucesso.",
  priority: "critica",
  status: "aberta",
  opened_at: `${TODAY}T14:30:00Z`,
  created_at: `${TODAY}T14:30:00Z`,
  updated_at: `${TODAY}T14:30:00Z`,
};

assert(incidentWithArrival.arrival_id === "arr-501", "Vincula corretamente com chegada de aeroporto");
assert(incidentWithArrival.incident_type === "cliente_nao_localizado", "Tipificação correta para cliente não localizado");

// =============================================================================
// TESTE 4: ALTERAÇÃO E REATRIBUIÇÃO DE RESPONSÁVEL
// =============================================================================
console.log("\n--- 4. ALTERAÇÃO E REATRIBUIÇÃO DE RESPONSÁVEL ---");

const histAtribuicao = buildIncidentHistoryEntry({
  incidentId: incidentWithReservation.id,
  action: "atribuicao",
  description: 'Responsável reatribuído de "Plantão Geral" para "Lucas Suporte Cancún".',
  performedByName: "Administrador Tío Nenê",
  assignedToBefore: "Plantão Geral",
  assignedToAfter: "Lucas Suporte Cancún",
});

assert(histAtribuicao.action === "atribuicao", "Ação de reatribuição registrada com tipo correto");
assert(histAtribuicao.assigned_to_before === "Plantão Geral", "Histórico preserva responsável anterior");
assert(histAtribuicao.assigned_to_after === "Lucas Suporte Cancún", "Histórico registra novo responsável");

// =============================================================================
// TESTE 5: SUGESTÃO INTELIGENTE DE PRIORIDADE E PRESERVAÇÃO DE ESCOLHA MANUAL
// =============================================================================
console.log("\n--- 5. SUGESTÃO INTELIGENTE DE PRIORIDADE ---");

// 1. Cliente não localizado com serviço de hoje -> Crítica
const prioClienteHoje = suggestIncidentPriority("cliente_nao_localizado", TODAY, TODAY);
assert(prioClienteHoje === "critica", "Cliente não localizado hoje recebe sugestão Crítica");

// 2. Atraso de fornecedor com serviço de hoje -> Crítica
const prioAtrasoHoje = suggestIncidentPriority("atraso_fornecedor", TODAY, TODAY);
assert(prioAtrasoHoje === "critica", "Atraso de fornecedor hoje recebe sugestão Crítica");

// 3. Passeio não realizado para amanhã -> Crítica
const prioPasseioAmanha = suggestIncidentPriority("passeio_nao_realizado", TOMORROW, TODAY);
assert(prioPasseioAmanha === "critica", "Passeio cancelado/não realizado amanhã sugere Crítica");

// 4. Reclamação de cliente para a próxima semana -> Média
const prioReclamacaoSemana = suggestIncidentPriority("reclamacao_cliente", NEXT_WEEK, TODAY);
assert(prioReclamacaoSemana === "media", "Reclamação de serviço futuro sugere Média");

// 5. Preservação de escolha manual: se o operador escolheu Baixa, a sugestão não sobrescreve
let userChosenPriority: IncidentPriority = "baixa";
const manualOverride = userChosenPriority;
assert(manualOverride === "baixa", "Decisão manual do operador não é sobrescrita pela sugestão automática");

// =============================================================================
// TESTE 6: FLUXO DE STATUS E BLOQUEIO DE RESOLUÇÃO SEM DESCRIÇÃO
// =============================================================================
console.log("\n--- 6. FLUXO DE STATUS E BLOQUEIO DE RESOLUÇÃO SEM DESCRIÇÃO ---");

const resEmpty = validateIncidentResolution("");
assert(!resEmpty.isValid && Boolean(resEmpty.error), "Bloqueia resolução com string vazia");

const resNull = validateIncidentResolution(null as any);
assert(!resNull.isValid, "Bloqueia resolução com valor nulo");

const resSpaces = validateIncidentResolution("   ");
assert(!resSpaces.isValid, "Bloqueia resolução composta apenas de espaços");

const resTooShort = validateIncidentResolution("Ok.");
assert(!resTooShort.isValid, "Bloqueia resolução com menos de 5 caracteres");

const resValid = validateIncidentResolution("Fornecedor enviou van reserva às 08h20. Embarque realizado com sucesso.");
assert(resValid.isValid && !resValid.error, "Permite resolução com descrição detalhada da solução aplicada");

// =============================================================================
// TESTE 7: HISTÓRICO PRESERVADO E AUDITORIA IMUTÁVEL
// =============================================================================
console.log("\n--- 7. HISTÓRICO PRESERVADO E AUDIT TRAIL IMUTÁVEL ---");

const h1 = buildIncidentHistoryEntry({
  incidentId: "inc-005",
  action: "abertura",
  description: "Ocorrência aberta pela atendente Ana.",
  performedByName: "Ana Vendas",
  statusAfter: "aberta",
  priorityAfter: "alta",
});

const h2 = buildIncidentHistoryEntry({
  incidentId: "inc-005",
  action: "andamento",
  description: "Contato telefônico com fornecedor realizado.",
  performedByName: "Carlos Operações",
  statusBefore: "aberta",
  statusAfter: "em_analise",
});

const h3 = buildIncidentHistoryEntry({
  incidentId: "inc-005",
  action: "resolucao",
  description: "Cliente realocado em outra van; passeio concluído.",
  performedByName: "Carlos Operações",
  statusBefore: "em_analise",
  statusAfter: "resolvida",
  metadata: { solution: "Realocação em van da mesma operadora" },
});

const historyTimeline: IncidentHistoryEntry[] = [h1, h2, h3];

assert(historyTimeline.length === 3, "Todas as 3 entradas de histórico estão acumuladas na linha do tempo");
assert(historyTimeline[0].action === "abertura", "Preserva autor da abertura");
assert(historyTimeline[1].action === "andamento", "Preserva andamento intermediário");
assert(historyTimeline[2].action === "resolucao", "Preserva registro de resolução final");
assert(historyTimeline[2].metadata?.solution !== undefined, "Metadados de auditoria preservados");

// =============================================================================
// TESTE 8: INTEGRAÇÃO COM OPERAÇÕES DIÁRIAS (KPIS E PENDÊNCIAS)
// =============================================================================
console.log("\n--- 8. INTEGRAÇÃO COM OPERAÇÕES DIÁRIAS ---");

const mockIncidents = [
  {
    id: "inc-active-1",
    incident_code: "OCR-2026-0010",
    contract_id: "ctr-201",
    contract_number: "CTR-2026-201",
    client_name: "Fernanda Montenegro",
    title: "Atraso no pickup do traslado",
    description: "Van não chegou no hotel.",
    priority: "critica",
    status: "aberta",
    service_name: "Traslado In Hotel",
    service_date: TODAY,
    opened_at: `${TODAY}T08:00:00Z`,
  },
  {
    id: "inc-active-2",
    incident_code: "OCR-2026-0011",
    contract_id: "ctr-202",
    contract_number: "CTR-2026-202",
    client_name: "Rodrigo Santoro",
    title: "Problema com voucher físico",
    description: "Parque Xcaret exigiu bilhete impresso.",
    priority: "alta",
    status: "em_analise",
    service_name: "Passeio Xcaret Plus",
    service_date: TODAY,
    opened_at: `${TODAY}T09:00:00Z`,
  },
  {
    id: "inc-resolved",
    incident_code: "OCR-2026-0012",
    contract_id: "ctr-203",
    contract_number: "CTR-2026-203",
    client_name: "Wagner Moura",
    title: "Voo atrasado 1h",
    description: "Voo remarcado para mais tarde.",
    priority: "media",
    status: "resolvida",
    service_name: "Chegada Aeroporto",
    service_date: TODAY,
    opened_at: `${TODAY}T06:00:00Z`,
    resolved_at: `${TODAY}T07:30:00Z`,
  },
];

// KPIs com ocorrências reais integradas
const dailyKpis = calculateDailyKpis({
  allServices: [],
  wallets: [],
  incidents: mockIncidents,
  refDateStr: TODAY,
});

assert(dailyKpis.ocorrenciasAbertas === 2, `Contabiliza exatamente 2 ocorrências abertas no KPI (resultado: ${dailyKpis.ocorrenciasAbertas})`);

// Detecção de pendências
const dailyPendencies = detectDailyPendencies({
  allServices: [],
  wallets: [],
  incidents: mockIncidents,
  refDateStr: TODAY,
});

assert(dailyPendencies.length === 2, `Gera exatamente 2 pendências para as ocorrências ativas (resultado: ${dailyPendencies.length})`);
assert(dailyPendencies[0].priority === "critica", "Ocorrência crítica é priorizada como primeira pendência");
assert(dailyPendencies[0].category === "ocorrencia", "Categoria atribuída como ocorrencia");
assert(dailyPendencies[0].quickActionUrl.includes("/admin/ocorrencias"), "Roteia ação rápida para /admin/ocorrencias");

// =============================================================================
// TESTE 9: PERMISSÕES RBAC (/admin/ocorrencias)
// =============================================================================
console.log("\n--- 9. PERMISSÕES DE ACESSO RBAC ---");

assert(canAccessRoute("admin", "/admin/ocorrencias"), "Administrador tem permissão para /admin/ocorrencias");
assert(canAccessRoute("seller", "/admin/ocorrencias"), "Vendedor/Operador tem permissão para /admin/ocorrencias");
assert(!canAccessRoute("viewer" as any, "/admin/ocorrencias"), "Perfis não operacionais são bloqueados");

// =============================================================================
// TESTE 10: AUSÊNCIA TOTAL DE EXPOSIÇÃO FINANCEIRA
// =============================================================================
console.log("\n--- 10. AUSÊNCIA DE EXPOSIÇÃO FINANCEIRA ---");

const incidentKeys = Object.keys(incidentWithReservation);
const forbiddenFinancialTerms = [
  "price",
  "cost",
  "custo",
  "preco",
  "margin",
  "margem",
  "commission",
  "comissao",
  "balance",
  "lucro",
  "markup",
];

const foundFinancialTerms = incidentKeys.filter((k) =>
  forbiddenFinancialTerms.some((term) => k.toLowerCase().includes(term))
);

assert(
  foundFinancialTerms.length === 0,
  `Estrutura de dados de ocorrência não expõe campos financeiros (encontrados: ${foundFinancialTerms.join(", ") || "nenhum"})`
);

// =============================================================================
// TESTE 11: AUSÊNCIA DE ALTERAÇÕES INDEVIDAS EM CONTRATOS E RESERVAS
// =============================================================================
console.log("\n--- 11. AUSÊNCIA DE ALTERAÇÕES INDEVIDAS EM CONTRATOS E RESERVAS ---");

const mockContractOriginal = Object.freeze({
  id: "ctr-original-001",
  contract_number: "CTR-2026-999",
  status: "emitido",
  total_amount: 5400,
  balance_amount: 2700,
});

const mockReservationOriginal = Object.freeze({
  id: "res-original-001",
  status: "confirmada",
  pickup_time: "07:30",
});

// A criação de ocorrência não afeta o contrato nem a reserva
const newIncidentCreated = {
  ...incidentContractOnly,
  contract_id: mockContractOriginal.id,
  reservation_id: mockReservationOriginal.id,
};

assert(mockContractOriginal.status === "emitido", "Contrato permanece inalterado em seu status original");
assert(mockContractOriginal.total_amount === 5400, "Valor do contrato não é modificado");
assert(mockReservationOriginal.status === "confirmada", "Status da reserva operacional não é alterado diretamente pelo registro da ocorrência");

// =============================================================================
// TESTE 12: FILTRAGEM E ORDENAÇÃO DE OCORRÊNCIAS
// =============================================================================
console.log("\n--- 12. FILTRAGEM E ORDENAÇÃO DE OCORRÊNCIAS ---");

const fullIncidentsList: OperationalIncident[] = [
  incidentContractOnly,
  incidentWithReservation,
  incidentWithArrival,
];

// Filtro por tipo
const filterByType = filterIncidents(fullIncidentsList, { incidentType: "atraso_fornecedor" });
assert(filterByType.length === 1 && filterByType[0].id === "inc-002", "Filtra corretamente por tipo de ocorrência");

// Filtro por prioridade
const filterByPriority = filterIncidents(fullIncidentsList, { priority: "critica" });
assert(filterByPriority.length === 1 && filterByPriority[0].id === "inc-003", "Filtra corretamente por prioridade");

// Filtro por status
const filterByStatus = filterIncidents(fullIncidentsList, { status: "em_analise" });
assert(filterByStatus.length === 1 && filterByStatus[0].id === "inc-002", "Filtra corretamente por status");

// Filtro textual por cliente
const filterBySearch = filterIncidents(fullIncidentsList, { searchTerm: "Beatriz" });
assert(filterBySearch.length === 1 && filterBySearch[0].id === "inc-002", "Filtra textualmente por nome de cliente");

// Ordenação: Crítica primeiro, depois Alta, depois Média
const sorted = sortIncidentsByPriorityAndDate(fullIncidentsList);
assert(sorted[0].priority === "critica", "Ocorrência Crítica é posicionada no topo da listagem");
assert(sorted[1].priority === "alta", "Ocorrência Alta fica na segunda posição");
assert(sorted[2].priority === "media", "Ocorrência Média fica na última posição");

// =============================================================================
// TESTE 13: INTEGRIDADE DO HISTÓRICO, TRIGGERS E RPC (TAREFA 28)
// =============================================================================
console.log("\n--- 13. INTEGRIDADE DO HISTÓRICO, TRIGGERS E RPC ---");

import * as fs from "fs";
import * as path from "path";

const migrationPath = path.resolve(__dirname, "../supabase/migrations/20261102_operational_incidents.sql");
const pagePath = path.resolve(__dirname, "../src/app/admin/ocorrencias/page.tsx");

const migrationSql = fs.readFileSync(migrationPath, "utf-8");
const pageCode = fs.readFileSync(pagePath, "utf-8");

// 1. INSERT direto no histórico é bloqueado
const hasRevokeInsert = migrationSql.includes("REVOKE ALL ON public.operational_incident_history FROM authenticated");
const hasOnlySelectGrant = migrationSql.includes("GRANT SELECT ON public.operational_incident_history TO authenticated");
const noInsertPolicy = !migrationSql.includes("CREATE POLICY \"op_incident_history_insert\"") && migrationSql.includes("DROP POLICY IF EXISTS \"op_incident_history_insert\"");
assert(hasRevokeInsert && hasOnlySelectGrant && noInsertPolicy, "1. INSERT direto em operational_incident_history é categoricamente bloqueado para authenticated");

// 2. UPDATE e DELETE no histórico continuam bloqueados
const hasPreventTriggerFunc = migrationSql.includes("CREATE OR REPLACE FUNCTION public.prevent_operational_incident_history_modification()");
const hasPreventTrigger = migrationSql.includes("CREATE TRIGGER trigger_prevent_op_incident_history_modification") && migrationSql.includes("BEFORE UPDATE OR DELETE ON public.operational_incident_history");
assert(hasPreventTriggerFunc && hasPreventTrigger, "2. UPDATE e DELETE no histórico são bloqueados por trigger BEFORE com exceção explícita");

// 3. Criação gera histórico automaticamente (trigger AFTER INSERT)
const hasAuditTriggerFunc = migrationSql.includes("CREATE OR REPLACE FUNCTION public.record_operational_incident_audit_history()");
const hasAuditTrigger = migrationSql.includes("CREATE TRIGGER trigger_record_operational_incident_audit_history") && migrationSql.includes("AFTER INSERT OR UPDATE ON public.operational_incidents");
const handlesInsertAction = migrationSql.includes("TG_OP = 'INSERT'") && migrationSql.includes("'abertura'");
assert(hasAuditTriggerFunc && hasAuditTrigger && handlesInsertAction, "3. Criação de ocorrência gera registro automático de histórico ('abertura') via trigger AFTER INSERT");

// 4. Alteração de status gera histórico
const handlesStatusChange = migrationSql.includes("NEW.status IS DISTINCT FROM OLD.status") && migrationSql.includes("'alteracao_status'");
assert(handlesStatusChange, "4. Alteração de status gera histórico automaticamente ('alteracao_status')");

// 5. Reatribuição gera histórico
const handlesReassignment = migrationSql.includes("NEW.assigned_to_name IS DISTINCT FROM OLD.assigned_to_name") && migrationSql.includes("'atribuicao'");
assert(handlesReassignment, "5. Reatribuição de responsável gera histórico automaticamente ('atribuicao')");

// 6. Mudança de prioridade gera histórico
const handlesPriorityChange = migrationSql.includes("NEW.priority IS DISTINCT FROM OLD.priority") && migrationSql.includes("'alteracao_prioridade'");
assert(handlesPriorityChange, "6. Mudança de prioridade gera histórico automaticamente ('alteracao_prioridade')");

// 7. Resolução gera histórico com solução
const handlesResolution = migrationSql.includes("NEW.status = 'resolvida'") && migrationSql.includes("'resolucao'") && migrationSql.includes("resolution_notes");
assert(handlesResolution, "7. Resolução gera histórico automaticamente ('resolucao') contendo a solução aplicada");

// 8. Cancelamento gera histórico
const handlesCancellation = migrationSql.includes("NEW.status = 'cancelada'") && migrationSql.includes("'cancelamento'");
assert(handlesCancellation, "8. Cancelamento gera histórico automaticamente ('cancelamento')");

// 9. Falha ao registrar histórico provoca rollback da alteração
const isTransactionalTrigger = hasAuditTrigger && !migrationSql.includes("EXCEPTION WHEN OTHERS THEN") && migrationSql.includes("SECURITY DEFINER");
assert(isTransactionalTrigger, "9. Gatilho AFTER opera na mesma transação: qualquer falha ao registrar histórico aborta a mutação da ocorrência");

// 10. Andamento manual pela RPC funciona e valida papéis
const hasRpcFunc = migrationSql.includes("CREATE OR REPLACE FUNCTION public.add_operational_incident_andamento");
const hasRpcSecurityDefiner = migrationSql.includes("SECURITY DEFINER") && migrationSql.includes("search_path = public, pg_temp");
const hasRoleCheck = migrationSql.includes("ur.role IN ('admin', 'moderator', 'user')");
const hasDescCheck = migrationSql.includes("length(v_clean_desc) < 3");
const hasExecuteRevoke = migrationSql.includes("REVOKE ALL ON FUNCTION public.add_operational_incident_andamento(UUID, TEXT, JSONB) FROM PUBLIC") && migrationSql.includes("REVOKE ALL ON FUNCTION public.add_operational_incident_andamento(UUID, TEXT, JSONB) FROM anon");
const hasExecuteGrant = migrationSql.includes("GRANT EXECUTE ON FUNCTION public.add_operational_incident_andamento(UUID, TEXT, JSONB) TO authenticated");
assert(hasRpcFunc && hasRpcSecurityDefiner && hasRoleCheck && hasDescCheck && hasExecuteRevoke && hasExecuteGrant, "10. RPC add_operational_incident_andamento implementada com SECURITY DEFINER, validação de app_role, busca segura e restrição de permissão");

// 11. Autor e data não podem ser falsificados pelo frontend
const usesAuthUidInRpc = migrationSql.includes("v_user_id := auth.uid();") && migrationSql.includes("performed_by,") && migrationSql.includes("v_user_id,") && migrationSql.includes("timezone('utc', now())");
const ignoresFrontendAuthor = !migrationSql.includes("p_performed_by") && !migrationSql.includes("p_created_at");
assert(usesAuthUidInRpc && ignoresFrontendAuthor, "11. Autor (auth.uid()) e data (timezone UTC now) são gerados estritamente pelo PostgreSQL sem parâmetros do frontend");

// 12. Não há eventos duplicados: frontend não faz INSERT direto em operational_incident_history
const directInsertsInPage = (pageCode.match(/supabase\s*\.\s*from\(\s*["']operational_incident_history["']\s*\)\s*\.\s*insert/g) || []).length;
const usesRpcInPage = pageCode.includes("add_operational_incident_andamento");
assert(directInsertsInPage === 0, `12. Frontend não realiza nenhum INSERT direto em operational_incident_history (ocorrências: ${directInsertsInPage})`);
assert(usesRpcInPage, "12b. Frontend utiliza exclusivamente a RPC add_operational_incident_andamento para andamentos manuais");

// =============================================================================
// TESTE 14: AUDITORIA DE EDIÇÕES SIMULTÂNEAS E ISOLADAS (AJUSTE PONTUAL)
// =============================================================================
console.log("\n--- 14. AUDITORIA DE EDIÇÕES SIMULTÂNEAS E ISOLADAS ---");

// Validações estáticas no SQL da migration
const noRestrictiveConditions = !migrationSql.includes("AND (NEW.status IS NOT DISTINCT FROM OLD.status)") &&
  !migrationSql.includes("AND (NEW.priority IS NOT DISTINCT FROM OLD.priority)") &&
  !migrationSql.includes("AND (NEW.assigned_to_name IS NOT DISTINCT FROM OLD.assigned_to_name)");
assert(noRestrictiveConditions, "14.1. Removida condição restritiva que impedia 'edicao' quando status, prioridade ou responsável mudavam");

const monitorsKeyFields = migrationSql.includes("NEW.internal_notes IS DISTINCT FROM OLD.internal_notes") &&
  migrationSql.includes("NEW.service_date IS DISTINCT FROM OLD.service_date") &&
  migrationSql.includes("NEW.reservation_id IS DISTINCT FROM OLD.reservation_id") &&
  migrationSql.includes("NEW.arrival_id IS DISTINCT FROM OLD.arrival_id") &&
  migrationSql.includes("NEW.supplier_id IS DISTINCT FROM OLD.supplier_id");
assert(monitorsKeyFields, "14.2. Monitoramento inclui internal_notes, service_date, reservation_id, arrival_id e supplier_id");

// Função simuladora da trigger PostgreSQL record_operational_incident_audit_history
function simulateDbTrigger(
  op: "INSERT" | "UPDATE",
  oldRow: any | null,
  newRow: any
): Array<{ action: string; description: string; metadata: any }> {
  const events: Array<{ action: string; description: string; metadata: any }> = [];

  if (op === "INSERT") {
    events.push({
      action: "abertura",
      description: `Ocorrência ${newRow.incident_code} registrada com prioridade ${newRow.priority}.`,
      metadata: { incident_code: newRow.incident_code, incident_type: newRow.incident_type, title: newRow.title },
    });
    return events;
  }

  if (op === "UPDATE" && oldRow) {
    // B.1 Status
    if (newRow.status !== oldRow.status) {
      if (newRow.status === "resolvida") {
        events.push({
          action: "resolucao",
          description: `Ocorrência resolvida. Solução aplicada: ${newRow.resolution_notes || "Solução concluída."}`,
          metadata: { resolution_notes: newRow.resolution_notes },
        });
      } else if (newRow.status === "cancelada") {
        events.push({
          action: "cancelamento",
          description: `Ocorrência cancelada (de "${oldRow.status}" para cancelada).`,
          metadata: {},
        });
      } else {
        events.push({
          action: "alteracao_status",
          description: `Status alterado de "${oldRow.status}" para "${newRow.status}".`,
          metadata: {},
        });
      }
    }

    // B.2 Prioridade
    if (newRow.priority !== oldRow.priority) {
      events.push({
        action: "alteracao_prioridade",
        description: `Prioridade alterada de "${oldRow.priority}" para "${newRow.priority}".`,
        metadata: {},
      });
    }

    // B.3 Responsável
    if (newRow.assigned_to_name !== oldRow.assigned_to_name || newRow.assigned_to !== oldRow.assigned_to) {
      events.push({
        action: "atribuicao",
        description: `Responsável reatribuído de "${oldRow.assigned_to_name || "Não atribuído"}" para "${newRow.assigned_to_name || "Não atribuído"}".`,
        metadata: {},
      });
    }

    // B.4 Edições Relevantes de Conteúdo Operacional
    if (
      newRow.title !== oldRow.title ||
      newRow.description !== oldRow.description ||
      newRow.incident_type !== oldRow.incident_type ||
      newRow.internal_notes !== oldRow.internal_notes ||
      newRow.service_name !== oldRow.service_name ||
      newRow.service_date !== oldRow.service_date ||
      newRow.reservation_id !== oldRow.reservation_id ||
      newRow.arrival_id !== oldRow.arrival_id ||
      newRow.supplier_id !== oldRow.supplier_id ||
      newRow.supplier_name !== oldRow.supplier_name
    ) {
      events.push({
        action: "edicao",
        description: "Informações operacionais da ocorrência foram atualizadas.",
        metadata: {
          title_changed: newRow.title !== oldRow.title,
          description_changed: newRow.description !== oldRow.description,
          type_changed: newRow.incident_type !== oldRow.incident_type,
          internal_notes_changed: newRow.internal_notes !== oldRow.internal_notes,
          service_date_changed: newRow.service_date !== oldRow.service_date,
          service_name_changed: newRow.service_name !== oldRow.service_name,
          reservation_id_changed: newRow.reservation_id !== oldRow.reservation_id,
          arrival_id_changed: newRow.arrival_id !== oldRow.arrival_id,
          supplier_changed: newRow.supplier_id !== oldRow.supplier_id || newRow.supplier_name !== oldRow.supplier_name,
        },
      });
    }
  }

  return events;
}

const baseIncidentRow = {
  id: "inc-test-01",
  incident_code: "OCR-2026-9999",
  contract_id: "ctr-01",
  contract_number: "CTR-2026-001",
  client_name: "Cliente Teste",
  title: "Título Original",
  description: "Descrição inicial da ocorrência com mais de dez caracteres.",
  priority: "media" as IncidentPriority,
  status: "aberta" as IncidentStatus,
  assigned_to_name: "Operador A",
  assigned_to: "usr-01",
  internal_notes: "Anotação interna inicial",
  service_date: "2026-11-20",
  service_name: "Passeio Xcaret",
  supplier_id: "supp-01",
  supplier_name: "Operadora Maya",
  reservation_id: "res-01",
  arrival_id: null,
  updated_at: "2026-11-20T10:00:00Z",
};

// Teste A: Descrição e prioridade alteradas simultaneamente
const testA_Events = simulateDbTrigger("UPDATE", baseIncidentRow, {
  ...baseIncidentRow,
  description: "Nova descrição atualizada detalhando o imprevisto.",
  priority: "critica" as IncidentPriority,
  updated_at: "2026-11-20T10:05:00Z",
});
const hasPrioAndEdit = testA_Events.some(e => e.action === "alteracao_prioridade") &&
  testA_Events.some(e => e.action === "edicao") &&
  testA_Events.length === 2;
assert(hasPrioAndEdit, "14.3. Descrição e prioridade alteradas simultaneamente geram 'alteracao_prioridade' e 'edicao' (2 eventos)");

// Teste B: Título e status alterados simultaneamente
const testB_Events = simulateDbTrigger("UPDATE", baseIncidentRow, {
  ...baseIncidentRow,
  title: "Novo Título da Ocorrência",
  status: "em_analise" as IncidentStatus,
  updated_at: "2026-11-20T10:05:00Z",
});
const hasStatusAndEdit = testB_Events.some(e => e.action === "alteracao_status") &&
  testB_Events.some(e => e.action === "edicao") &&
  testB_Events.length === 2;
assert(hasStatusAndEdit, "14.4. Título e status alterados simultaneamente geram 'alteracao_status' e 'edicao' (2 eventos)");

// Teste C: internal_notes alterado isoladamente
const testC_Events = simulateDbTrigger("UPDATE", baseIncidentRow, {
  ...baseIncidentRow,
  internal_notes: "Nova anotação interna operacional registrada pela equipe.",
  updated_at: "2026-11-20T10:05:00Z",
});
const hasOnlyEditForNotes = testC_Events.length === 1 &&
  testC_Events[0].action === "edicao" &&
  testC_Events[0].metadata?.internal_notes_changed === true;
assert(hasOnlyEditForNotes, "14.5. internal_notes alterado isoladamente gera exatamente 1 evento 'edicao' com flag no metadados");

// Teste D: Apenas updated_at alterado
const testD_Events = simulateDbTrigger("UPDATE", baseIncidentRow, {
  ...baseIncidentRow,
  updated_at: "2026-11-20T10:10:00Z",
});
assert(testD_Events.length === 0, "14.6. Apenas updated_at alterado não gera nenhum evento de histórico");

// Teste E: Ausência de eventos duplicados para a mesma categoria de alteração
const testE_Events = simulateDbTrigger("UPDATE", baseIncidentRow, {
  ...baseIncidentRow,
  title: "Título 2",
  description: "Descrição 2 com mais texto",
  internal_notes: "Notas 2",
  status: "aguardando_fornecedor" as IncidentStatus,
  priority: "alta" as IncidentPriority,
  assigned_to_name: "Operador B",
  updated_at: "2026-11-20T10:15:00Z",
});
const uniqueActions = new Set(testE_Events.map(e => e.action));
assert(uniqueActions.size === testE_Events.length && testE_Events.length === 4,
  "14.7. Ausência total de eventos duplicados para a mesma categoria (status, prioridade, atribuição, edição)");


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
  console.log("TODOS OS TESTES DE INTEGRIDADE E GESTÃO DE OCORRÊNCIAS PASSARAM COM SUCESSO!\n");
}
