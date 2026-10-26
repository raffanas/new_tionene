"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuthProfile } from "@/lib/auth/AuthContext";
import {
  InternalTask,
  InternalTaskHistoryEntry,
  TaskPriority,
  TaskStatus,
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
  validateAndamentoRequirements,
} from "@/lib/tasks/taskOperations";
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Search,
  Filter,
  Plus,
  RefreshCw,
  X,
  History,
  User,
  FileText,
  ShieldAlert,
  Send,
  ExternalLink,
  ChevronRight,
  RotateCcw,
  Sparkles,
} from "lucide-react";

// Mock de Fallback para desenvolvimento e testes locais
const MOCK_INITIAL_TASKS: InternalTask[] = [
  {
    id: "tsk-001",
    task_code: "TAR-2026-0001",
    title: "Cobrar confirmação da van de traslado do Hotel Riu Palace",
    description: "Fornecedor Cancun Transfer ainda não retornou o voucher assinado com o número de confirmação para o transfer de amanhã cedo.",
    priority: "critica",
    status: "em_andamento",
    due_date: new Date().toISOString().split("T")[0],
    assigned_to_name: "Plantão Operacional",
    created_by_name: "Administrador",
    contract_number: "CTR-2026-0042",
    client_name: "Mariana Alencar",
    service_name: "Traslado In Hotel",
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    history: [
      {
        id: "hist-001",
        task_id: "tsk-001",
        action: "criacao",
        description: "Tarefa TAR-2026-0001 criada com prioridade crítica.",
        performed_by_name: "Administrador",
        status_after: "pendente",
        priority_after: "critica",
        created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
      {
        id: "hist-002",
        task_id: "tsk-001",
        action: "alteracao_status",
        description: 'Status alterado de "Pendente" para "Em Andamento".',
        performed_by_name: "Plantão Operacional",
        status_before: "pendente",
        status_after: "em_andamento",
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
    ],
  },
  {
    id: "tsk-002",
    task_code: "TAR-2026-0002",
    title: "Esclarecer atraso com fornecedor após ocorrência de pickup",
    description: "Entrar em contato com o receptivo Maya Tours para obter relatório formal sobre a falha no pickup do passeio Chichén Itzá.",
    priority: "alta",
    status: "aguardando_terceiro",
    due_date: new Date(Date.now() - 86400000).toISOString().split("T")[0], // Vencida ontem
    assigned_to_name: "Lucas Suporte Cancún",
    created_by_name: "Carlos Vendas",
    incident_code: "OCR-2026-0002",
    contract_number: "CTR-2026-0101",
    client_name: "Beatriz Lima",
    service_name: "Passeio Chichén Itzá Clássico",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    history: [
      {
        id: "hist-003",
        task_id: "tsk-002",
        action: "criacao",
        description: "Tarefa TAR-2026-0002 criada vinculada à ocorrência OCR-2026-0002.",
        performed_by_name: "Carlos Vendas",
        status_after: "pendente",
        priority_after: "alta",
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
    ],
  },
  {
    id: "tsk-003",
    task_code: "TAR-2026-0003",
    title: "Atualizar voucher com horário reajustado de embarque",
    description: "Reemitir e enviar a carteira de viagem atualizada via WhatsApp para o cliente após confirmação de novo horário pelo parque.",
    priority: "media",
    status: "concluida",
    due_date: new Date(Date.now() - 86400000 * 3).toISOString().split("T")[0],
    completed_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    completed_by_name: "Ana Vendas",
    assigned_to_name: "Ana Vendas",
    created_by_name: "Ana Vendas",
    contract_number: "CTR-2026-0088",
    client_name: "Rodrigo Santoro",
    service_name: "Passeio Xcaret Plus",
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    history: [
      {
        id: "hist-004",
        task_id: "tsk-003",
        action: "criacao",
        description: "Tarefa TAR-2026-0003 criada com prioridade média.",
        performed_by_name: "Ana Vendas",
        status_after: "pendente",
        priority_after: "media",
        created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
      },
      {
        id: "hist-005",
        task_id: "tsk-003",
        action: "conclusao",
        description: "Tarefa concluída por Ana Vendas.",
        performed_by_name: "Ana Vendas",
        status_before: "em_andamento",
        status_after: "concluida",
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
    ],
  },
];

export default function AdminTarefasPage() {
  const { role, profile } = useAuthProfile();
  const searchParams = useSearchParams();

  const currentUserName = profile?.fullName || "Operador Tío Nenê";
  const currentUserId = profile?.id || null;

  // Estados de Dados
  const [tasks, setTasks] = useState<InternalTask[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [dbAvailable, setDbAvailable] = useState<boolean>(true);

  // Estados de Filtro
  const [viewTab, setViewTab] = useState<"todas" | "minhas" | "hoje" | "vencidas" | "concluidas">("todas");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ativas");
  const [priorityFilter, setPriorityFilter] = useState<string>("todas");
  const [assignedFilter, setAssignedFilter] = useState<string>("todos");
  const [startDateFilter, setStartDateFilter] = useState<string>("");
  const [endDateFilter, setEndDateFilter] = useState<string>("");

  // Modais
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [detailTask, setDetailTask] = useState<InternalTask | null>(null);

  // Estado do Formulário de Criação
  const [formTitle, setFormTitle] = useState<string>("");
  const [formDescription, setFormDescription] = useState<string>("");
  const [formPriority, setFormPriority] = useState<TaskPriority>("media");
  const [formStatus, setFormStatus] = useState<TaskStatus>("pendente");
  const [formDueDate, setFormDueDate] = useState<string>("");
  const [formAssignedToName, setFormAssignedToName] = useState<string>(currentUserName);
  const [formInternalNotes, setFormInternalNotes] = useState<string>("");

  // Vínculos Opcionais no Formulário
  const [formContractId, setFormContractId] = useState<string>("");
  const [formContractNumber, setFormContractNumber] = useState<string>("");
  const [formClientId, setFormClientId] = useState<string>("");
  const [formClientName, setFormClientName] = useState<string>("");
  const [formReservationId, setFormReservationId] = useState<string>("");
  const [formServiceName, setFormServiceName] = useState<string>("");
  const [formArrivalId, setFormArrivalId] = useState<string>("");
  const [formIncidentId, setFormIncidentId] = useState<string>("");
  const [formIncidentCode, setFormIncidentCode] = useState<string>("");

  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [submittingCreate, setSubmittingCreate] = useState<boolean>(false);

  // Estado de Andamento Manual
  const [newNoteText, setNewNoteText] = useState<string>("");
  const [submittingNote, setSubmittingNote] = useState<boolean>(false);

  // Data de referência de hoje
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  // ===========================================================================
  // CARREGAR TAREFAS DO SUPABASE (COM FALLBACK CONTROLADO)
  // ===========================================================================
  const fetchTasksFromSupabase = useCallback(async () => {
    try {
      setRefreshing(true);
      const { data: tasksData, error: taskError } = await supabase
        .from("internal_tasks")
        .select("*")
        .order("created_at", { ascending: false });

      if (taskError) {
        console.warn("Tabela internal_tasks aguardando migração:", taskError.message);
        setDbAvailable(false);
        setTasks(MOCK_INITIAL_TASKS);
      } else if (tasksData) {
        setDbAvailable(true);

        // Carregar histórico acumulado
        const taskIds = tasksData.map((t: any) => t.id);
        let historyMap: Record<string, InternalTaskHistoryEntry[]> = {};

        if (taskIds.length > 0) {
          const { data: histData } = await supabase
            .from("internal_task_history")
            .select("*")
            .in("task_id", taskIds)
            .order("created_at", { ascending: true });

          if (histData) {
            histData.forEach((h: any) => {
              if (!historyMap[h.task_id]) historyMap[h.task_id] = [];
              historyMap[h.task_id].push(h);
            });
          }
        }

        const consolidated: InternalTask[] = tasksData.map((t: any) => ({
          ...t,
          history: historyMap[t.id] || [],
        }));

        setTasks(consolidated.length > 0 ? consolidated : MOCK_INITIAL_TASKS);
      }
    } catch (err) {
      console.warn("Erro ao buscar tarefas:", err);
      setDbAvailable(false);
      setTasks(MOCK_INITIAL_TASKS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTasksFromSupabase();
  }, [fetchTasksFromSupabase]);

  // ===========================================================================
  // LEITURA DE QUERY PARAMS (AÇÕES RÁPIDAS DE OUTRAS TELAS)
  // ===========================================================================
  useEffect(() => {
    const isNew = searchParams.get("new");
    const paramTitle = searchParams.get("title");
    const paramContractId = searchParams.get("contractId");
    const paramContractNumber = searchParams.get("contractNumber");
    const paramClientId = searchParams.get("clientId");
    const paramClientName = searchParams.get("clientName");
    const paramReservationId = searchParams.get("reservationId");
    const paramServiceName = searchParams.get("serviceName");
    const paramArrivalId = searchParams.get("arrivalId");
    const paramIncidentId = searchParams.get("incidentId");
    const paramIncidentCode = searchParams.get("incidentCode");
    const paramPriority = searchParams.get("priority");
    const paramView = searchParams.get("view");
    const paramSearch = searchParams.get("search");

    if (paramSearch) {
      setSearchTerm(paramSearch);
    }

    if (paramView && ["todas", "minhas", "hoje", "vencidas", "concluidas"].includes(paramView)) {
      setViewTab(paramView as any);
    }

    if (isNew === "true" || paramContractId || paramIncidentId) {
      if (paramTitle) setFormTitle(paramTitle);
      if (paramContractId) setFormContractId(paramContractId);
      if (paramContractNumber) setFormContractNumber(paramContractNumber);
      if (paramClientId) setFormClientId(paramClientId);
      if (paramClientName) setFormClientName(paramClientName);
      if (paramReservationId) setFormReservationId(paramReservationId);
      if (paramServiceName) setFormServiceName(paramServiceName);
      if (paramArrivalId) setFormArrivalId(paramArrivalId);
      if (paramIncidentId) setFormIncidentId(paramIncidentId);
      if (paramIncidentCode) setFormIncidentCode(paramIncidentCode);
      if (paramPriority && ["baixa", "media", "alta", "critica"].includes(paramPriority)) {
        setFormPriority(paramPriority as TaskPriority);
      }
      setIsCreateModalOpen(true);
    }
  }, [searchParams]);

  // ===========================================================================
  // KPIS E FILTRAGEM
  // ===========================================================================
  const kpis = useMemo(() => {
    return calculateTaskKpis(tasks, currentUserId, currentUserName, todayStr);
  }, [tasks, currentUserId, currentUserName, todayStr]);

  const activeFilters: TaskFilters = useMemo(() => {
    return {
      viewTab,
      searchTerm,
      status: statusFilter,
      priority: priorityFilter,
      assignedTo: assignedFilter,
      startDate: startDateFilter,
      endDate: endDateFilter,
    };
  }, [viewTab, searchTerm, statusFilter, priorityFilter, assignedFilter, startDateFilter, endDateFilter]);

  const filteredTasks = useMemo(() => {
    const list = filterTasks(tasks, activeFilters, currentUserId, currentUserName, todayStr);
    return sortTasksByPriorityAndDueDate(list);
  }, [tasks, activeFilters, currentUserId, currentUserName, todayStr]);

  // Lista única de responsáveis para o filtro
  const uniqueAssignees = useMemo(() => {
    const names = new Set<string>();
    tasks.forEach((t) => {
      if (t.assigned_to_name) names.add(t.assigned_to_name.trim());
    });
    return Array.from(names);
  }, [tasks]);

  // ===========================================================================
  // AÇÃO 1: CRIAR TAREFA
  // ===========================================================================
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]);

    const validation = validateTaskCreation({
      title: formTitle,
      description: formDescription,
      priority: formPriority,
      status: formStatus,
      dueDate: formDueDate,
    });

    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    setSubmittingCreate(true);
    const nowIso = new Date().toISOString();
    const currentYear = new Date().getFullYear();
    const taskCode = generateSuggestedTaskCode(currentYear, tasks.length + 1);

    const initialHistoryEntry = buildTaskHistoryEntry({
      taskId: `tsk-temp-${Date.now()}`,
      action: "criacao",
      description: `Tarefa ${taskCode} criada com prioridade ${TASK_PRIORITY_CONFIG[formPriority].label}.`,
      performedByName: currentUserName,
      performedBy: currentUserId,
      statusAfter: formStatus,
      priorityAfter: formPriority,
      assignedToAfter: formAssignedToName.trim() || undefined,
      dueDateAfter: formDueDate || undefined,
    });

    const assignedUserId =
      formAssignedToName.trim() === currentUserName
        ? currentUserId
        : role === "admin"
        ? null
        : currentUserId;

    const newRecord: InternalTask = {
      id: `tsk-${Date.now()}`,
      task_code: taskCode,
      title: formTitle.trim(),
      description: formDescription.trim() || null,
      priority: formPriority,
      status: formStatus,
      due_date: formDueDate || null,
      internal_notes: formInternalNotes.trim() || null,
      assigned_to: assignedUserId,
      assigned_to_name: formAssignedToName.trim() || null,
      created_by_name: currentUserName,
      created_by: currentUserId,
      shared_with: [],
      contract_id: formContractId || null,
      contract_number: formContractNumber || null,
      client_id: formClientId || null,
      client_name: formClientName || null,
      reservation_id: formReservationId || null,
      service_name: formServiceName || null,
      arrival_id: formArrivalId || null,
      incident_id: formIncidentId || null,
      incident_code: formIncidentCode || null,
      created_at: nowIso,
      updated_at: nowIso,
      history: [initialHistoryEntry],
    };

    try {
      if (dbAvailable) {
        const { error: insertErr } = await supabase
          .from("internal_tasks")
          .insert({
            task_code: newRecord.task_code,
            title: newRecord.title,
            description: newRecord.description,
            priority: newRecord.priority,
            status: newRecord.status,
            due_date: newRecord.due_date,
            internal_notes: newRecord.internal_notes,
            assigned_to: newRecord.assigned_to,
            assigned_to_name: newRecord.assigned_to_name,
            created_by: newRecord.created_by,
            created_by_name: newRecord.created_by_name,
            shared_with: newRecord.shared_with || [],
            contract_id: newRecord.contract_id,
            contract_number: newRecord.contract_number,
            client_id: newRecord.client_id,
            client_name: newRecord.client_name,
            reservation_id: newRecord.reservation_id,
            service_name: newRecord.service_name,
            arrival_id: newRecord.arrival_id,
            incident_id: newRecord.incident_id,
            incident_code: newRecord.incident_code,
          });

        if (insertErr) {
          console.warn("Aviso ao persistir tarefa no banco:", insertErr.message);
        }
        // Nota: O trigger AFTER INSERT registra automaticamente a ação 'criacao' no histórico.
      }

      setTasks((prev) => [newRecord, ...prev]);
      setIsCreateModalOpen(false);

      // Limpar formulário
      setFormTitle("");
      setFormDescription("");
      setFormInternalNotes("");
      setFormDueDate("");
      setFormContractId("");
      setFormContractNumber("");
      setFormClientId("");
      setFormClientName("");
      setFormReservationId("");
      setFormServiceName("");
      setFormArrivalId("");
      setFormIncidentId("");
      setFormIncidentCode("");
    } catch (err) {
      console.error("Erro inesperado na criação da tarefa:", err);
      setTasks((prev) => [newRecord, ...prev]);
      setIsCreateModalOpen(false);
    } finally {
      setSubmittingCreate(false);
    }
  };

  // ===========================================================================
  // AÇÃO 2: ATUALIZAR STATUS (CONCLUIR / REABRIR / CANCELAR)
  // ===========================================================================
  const handleUpdateStatus = async (targetTask: InternalTask, newStatus: TaskStatus) => {
    if (targetTask.status === newStatus) return;

    const prevStatus = targetTask.status;
    const nowIso = new Date().toISOString();

    const isConcluding = newStatus === "concluida";
    const isReopening = prevStatus === "concluida" && newStatus !== "concluida";

    let actionName: any = "alteracao_status";
    let desc = `Status alterado de "${TASK_STATUS_CONFIG[prevStatus].label}" para "${TASK_STATUS_CONFIG[newStatus].label}".`;

    if (isConcluding) {
      actionName = "conclusao";
      desc = `Tarefa concluída por ${currentUserName}.`;
    } else if (isReopening) {
      actionName = "reabertura";
      desc = `Tarefa reaberta por ${currentUserName} (status: "${TASK_STATUS_CONFIG[newStatus].label}").`;
    } else if (newStatus === "cancelada") {
      actionName = "cancelamento";
      desc = `Tarefa cancelada por ${currentUserName}.`;
    }

    const histEntry = buildTaskHistoryEntry({
      taskId: targetTask.id,
      action: actionName,
      description: desc,
      performedByName: currentUserName,
      performedBy: currentUserId,
      statusBefore: prevStatus,
      statusAfter: newStatus,
      dueDateAfter: targetTask.due_date || undefined,
    });

    try {
      if (dbAvailable) {
        // Atualiza apenas a tabela principal. O trigger AFTER UPDATE grava o histórico.
        const updatePayload: any = {
          status: newStatus,
          updated_at: nowIso,
        };

        if (isConcluding) {
          updatePayload.completed_at = nowIso;
          updatePayload.completed_by = currentUserId;
          updatePayload.completed_by_name = currentUserName;
        } else if (isReopening) {
          updatePayload.completed_at = null;
          updatePayload.completed_by = null;
          updatePayload.completed_by_name = null;
        }

        const { error: updErr } = await supabase
          .from("internal_tasks")
          .update(updatePayload)
          .eq("id", targetTask.id);

        if (updErr) {
          console.warn("Aviso ao atualizar status no banco:", updErr.message);
        }
      }

      const updatedTask: InternalTask = {
        ...targetTask,
        status: newStatus,
        completed_at: isConcluding ? nowIso : isReopening ? null : targetTask.completed_at,
        completed_by_name: isConcluding ? currentUserName : isReopening ? null : targetTask.completed_by_name,
        history: [...(targetTask.history || []), histEntry],
        updated_at: nowIso,
      };

      setTasks((prev) => prev.map((t) => (t.id === targetTask.id ? updatedTask : t)));

      if (detailTask && detailTask.id === targetTask.id) {
        setDetailTask(updatedTask);
      }
    } catch (err) {
      console.error("Erro ao alterar status da tarefa:", err);
    }
  };

  // ===========================================================================
  // AÇÃO 3: ATUALIZAR PRIORIDADE
  // ===========================================================================
  const handleUpdatePriority = async (targetTask: InternalTask, newPriority: TaskPriority) => {
    if (targetTask.priority === newPriority) return;

    const prevPriority = targetTask.priority;
    const nowIso = new Date().toISOString();

    const histEntry = buildTaskHistoryEntry({
      taskId: targetTask.id,
      action: "alteracao_prioridade",
      description: `Prioridade alterada de "${TASK_PRIORITY_CONFIG[prevPriority].label}" para "${TASK_PRIORITY_CONFIG[newPriority].label}".`,
      performedByName: currentUserName,
      performedBy: currentUserId,
      priorityBefore: prevPriority,
      priorityAfter: newPriority,
      statusAfter: targetTask.status,
    });

    try {
      if (dbAvailable) {
        await supabase
          .from("internal_tasks")
          .update({ priority: newPriority, updated_at: nowIso })
          .eq("id", targetTask.id);
      }

      const updatedTask: InternalTask = {
        ...targetTask,
        priority: newPriority,
        history: [...(targetTask.history || []), histEntry],
        updated_at: nowIso,
      };

      setTasks((prev) => prev.map((t) => (t.id === targetTask.id ? updatedTask : t)));
      if (detailTask && detailTask.id === targetTask.id) setDetailTask(updatedTask);
    } catch (err) {
      console.error("Erro ao atualizar prioridade:", err);
    }
  };

  // ===========================================================================
  // AÇÃO 4: REATRIBUIR RESPONSÁVEL
  // ===========================================================================
  const handleReassign = async (targetTask: InternalTask, newAssignee: string) => {
    const cleanAssignee = newAssignee.trim();
    if (!cleanAssignee || targetTask.assigned_to_name === cleanAssignee) return;

    // Regras de segurança no frontend
    const isAdmin = role === "admin";
    const isSelfAssign = cleanAssignee === currentUserName;

    if (!isAdmin) {
      if (!isSelfAssign) {
        alert("Acesso negado: apenas administradores podem atribuir tarefas a terceiros.");
        return;
      }
      if (targetTask.assigned_to && targetTask.assigned_to !== currentUserId) {
        alert("Acesso negado: não é permitido alterar o responsável de uma tarefa já atribuída a outro operador.");
        return;
      }
      const isOwnerOrShared =
        targetTask.created_by === currentUserId ||
        (Array.isArray(targetTask.shared_with) && targetTask.shared_with.includes(currentUserId || ""));
      if (!isOwnerOrShared) {
        alert("Acesso negado: autoatribuição não autorizada em tarefa inacessível.");
        return;
      }
    }

    const prevAssignee = targetTask.assigned_to_name || "Não atribuído";
    const nowIso = new Date().toISOString();
    const newAssignedUserId = isSelfAssign ? currentUserId : undefined;

    const histEntry = buildTaskHistoryEntry({
      taskId: targetTask.id,
      action: "atribuicao",
      description: `Responsável reatribuído de "${prevAssignee}" para "${cleanAssignee}".`,
      performedByName: currentUserName,
      performedBy: currentUserId,
      assignedToBefore: prevAssignee,
      assignedToAfter: cleanAssignee,
      statusAfter: targetTask.status,
    });

    try {
      if (dbAvailable) {
        const updatePayload: any = {
          assigned_to_name: cleanAssignee,
          updated_at: nowIso,
        };
        if (newAssignedUserId !== undefined) {
          updatePayload.assigned_to = newAssignedUserId;
        }

        await supabase
          .from("internal_tasks")
          .update(updatePayload)
          .eq("id", targetTask.id);
      }

      const updatedTask: InternalTask = {
        ...targetTask,
        assigned_to: newAssignedUserId !== undefined ? newAssignedUserId : targetTask.assigned_to,
        assigned_to_name: cleanAssignee,
        history: [...(targetTask.history || []), histEntry],
        updated_at: nowIso,
      };

      setTasks((prev) => prev.map((t) => (t.id === targetTask.id ? updatedTask : t)));
      if (detailTask && detailTask.id === targetTask.id) setDetailTask(updatedTask);
    } catch (err) {
      console.error("Erro ao reatribuir responsável:", err);
    }
  };

  // ===========================================================================
  // AÇÃO 5: ADICIONAR ANDAMENTO MANUAL (RPC PROTEGIDA)
  // ===========================================================================
  const handleAddAndamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailTask || !newNoteText.trim()) return;

    setSubmittingNote(true);
    const cleanText = newNoteText.trim();
    const nowIso = new Date().toISOString();

    const validation = validateAndamentoRequirements({
      task: detailTask,
      userId: currentUserId,
      role: role,
      description: cleanText,
    });

    if (!validation.allowed) {
      alert(validation.reason || "Não foi possível registrar o andamento.");
      setSubmittingNote(false);
      return;
    }

    const histEntry = buildTaskHistoryEntry({
      taskId: detailTask.id,
      action: "andamento",
      description: cleanText,
      performedByName: currentUserName,
      performedBy: currentUserId,
      statusBefore: detailTask.status,
      statusAfter: detailTask.status,
      priorityAfter: detailTask.priority,
    });

    try {
      if (dbAvailable) {
        // Utiliza a RPC SECURITY DEFINER add_internal_task_andamento
        const { error: rpcErr } = await supabase.rpc("add_internal_task_andamento", {
          p_task_id: detailTask.id,
          p_description: cleanText,
        });

        if (rpcErr) {
          console.warn("Aviso ao registrar andamento via RPC:", rpcErr.message);
        }
      }

      const updatedTask: InternalTask = {
        ...detailTask,
        history: [...(detailTask.history || []), histEntry],
        updated_at: nowIso,
      };

      setTasks((prev) => prev.map((t) => (t.id === detailTask.id ? updatedTask : t)));
      setDetailTask(updatedTask);
      setNewNoteText("");
    } catch (err) {
      console.error("Erro ao adicionar andamento:", err);
    } finally {
      setSubmittingNote(false);
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* ===================================================================== */}
      {/* 1. CABEÇALHO */}
      {/* ===================================================================== */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <span
              style={{
                background: "rgba(180, 83, 9, 0.12)",
                color: "var(--adm-wine)",
                padding: "8px",
                borderRadius: "10px",
                display: "inline-flex",
              }}
            >
              <CheckSquare size={24} />
            </span>
            <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--adm-text)", margin: 0 }}>
              Central de Tarefas
            </h1>
          </div>
          <p style={{ fontSize: "13px", color: "var(--adm-text-muted)", margin: 0 }}>
            Organização, prazos, acompanhamento e histórico de atividades administrativas e operacionais
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            onClick={fetchTasksFromSupabase}
            disabled={loading || refreshing}
            className="adm-btn adm-btn-outline adm-btn-sm"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            title="Sincronizar tarefas com o banco de dados"
          >
            <RefreshCw size={14} className={refreshing ? "spin-icon" : ""} />
            <span>{refreshing ? "Sincronizando..." : "Atualizar"}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="adm-btn adm-btn-sm"
            style={{
              background: "var(--adm-wine)",
              color: "#ffffff",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontWeight: 700,
            }}
          >
            <Plus size={16} />
            <span>Nova Tarefa</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. CARDS DE INDICADORES (KPIS) */}
      {/* ===================================================================== */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        {/* Abertas */}
        <div
          className="adm-card"
          style={{
            padding: "14px",
            borderLeft: `4px solid ${kpis.abertas > 0 ? "#2563eb" : "#cbd5e1"}`,
            cursor: "pointer",
          }}
          onClick={() => {
            setViewTab("todas");
            setStatusFilter("ativas");
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--adm-text-muted)", textTransform: "uppercase" }}>
              Tarefas Abertas
            </span>
            <CheckSquare size={16} style={{ color: "#2563eb" }} />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "#2563eb", marginTop: "6px" }}>
            {kpis.abertas}
          </div>
          <span style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>
            Atividades em fluxo
          </span>
        </div>

        {/* Em Andamento */}
        <div
          className="adm-card"
          style={{
            padding: "14px",
            borderLeft: `4px solid ${kpis.emAndamento > 0 ? "#d97706" : "#cbd5e1"}`,
            cursor: "pointer",
          }}
          onClick={() => {
            setViewTab("todas");
            setStatusFilter("em_andamento");
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--adm-text-muted)", textTransform: "uppercase" }}>
              Em Andamento
            </span>
            <Clock size={16} style={{ color: "#d97706" }} />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "#d97706", marginTop: "6px" }}>
            {kpis.emAndamento}
          </div>
          <span style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>
            Equipe trabalhando
          </span>
        </div>

        {/* Vencidas */}
        <div
          className="adm-card"
          style={{
            padding: "14px",
            borderLeft: `4px solid ${kpis.vencidas > 0 ? "#dc2626" : "#cbd5e1"}`,
            background: kpis.vencidas > 0 ? "rgba(220, 38, 38, 0.05)" : "var(--adm-card-bg)",
            cursor: "pointer",
          }}
          onClick={() => setViewTab("vencidas")}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: kpis.vencidas > 0 ? "#dc2626" : "var(--adm-text-muted)", textTransform: "uppercase" }}>
              Tarefas Vencidas
            </span>
            <AlertTriangle size={16} style={{ color: kpis.vencidas > 0 ? "#dc2626" : "#94a3b8" }} />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: kpis.vencidas > 0 ? "#dc2626" : "var(--adm-text)", marginTop: "6px" }}>
            {kpis.vencidas}
          </div>
          <span style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>
            Exigem atenção imediata
          </span>
        </div>

        {/* Para Hoje */}
        <div
          className="adm-card"
          style={{
            padding: "14px",
            borderLeft: `4px solid ${kpis.paraHoje > 0 ? "#ea580c" : "#cbd5e1"}`,
            cursor: "pointer",
          }}
          onClick={() => setViewTab("hoje")}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--adm-text-muted)", textTransform: "uppercase" }}>
              Para Hoje
            </span>
            <Calendar size={16} style={{ color: "#ea580c" }} />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "#ea580c", marginTop: "6px" }}>
            {kpis.paraHoje}
          </div>
          <span style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>
            Vencimento nesta data
          </span>
        </div>

        {/* Minhas Tarefas */}
        <div
          className="adm-card"
          style={{
            padding: "14px",
            borderLeft: `4px solid ${kpis.minhas > 0 ? "var(--adm-wine)" : "#cbd5e1"}`,
            cursor: "pointer",
          }}
          onClick={() => setViewTab("minhas")}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--adm-text-muted)", textTransform: "uppercase" }}>
              Minhas Tarefas
            </span>
            <User size={16} style={{ color: "var(--adm-wine)" }} />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--adm-wine)", marginTop: "6px" }}>
            {kpis.minhas}
          </div>
          <span style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>
            Atribuídas a você
          </span>
        </div>

        {/* Concluídas */}
        <div
          className="adm-card"
          style={{
            padding: "14px",
            borderLeft: "4px solid #16a34a",
            cursor: "pointer",
          }}
          onClick={() => setViewTab("concluidas")}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--adm-text-muted)", textTransform: "uppercase" }}>
              Concluídas
            </span>
            <CheckCircle2 size={16} style={{ color: "#16a34a" }} />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "#16a34a", marginTop: "6px" }}>
            {kpis.concluidas}
          </div>
          <span style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>
            Finalizadas com sucesso
          </span>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. ABAS DE VISUALIZAÇÃO E BARRA DE FILTROS */}
      {/* ===================================================================== */}
      <div className="adm-card" style={{ padding: "16px", marginBottom: "20px" }}>
        {/* Abas Rápidas */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", borderBottom: "1px solid var(--adm-border)", paddingBottom: "12px", marginBottom: "14px" }}>
          {[
            { id: "todas", label: `Todas as Tarefas (${kpis.total})` },
            { id: "minhas", label: `Minhas Tarefas (${kpis.minhas})` },
            { id: "hoje", label: `Hoje (${kpis.paraHoje})` },
            { id: "vencidas", label: `Vencidas (${kpis.vencidas})`, badgeColor: kpis.vencidas > 0 ? "#dc2626" : undefined },
            { id: "concluidas", label: `Concluídas (${kpis.concluidas})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setViewTab(tab.id as any);
                if (tab.id === "concluidas") {
                  setStatusFilter("todos");
                }
              }}
              style={{
                background: viewTab === tab.id ? "var(--adm-wine)" : "transparent",
                color: viewTab === tab.id ? "#ffffff" : "var(--adm-text)",
                border: "none",
                borderRadius: "6px",
                padding: "6px 14px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>{tab.label}</span>
              {tab.badgeColor && (
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: tab.badgeColor }} />
              )}
            </button>
          ))}
        </div>

        {/* Filtros Combinados */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
          {/* Busca Textual */}
          <div>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Buscar por título, contrato, cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="adm-input"
                style={{ paddingLeft: "30px", fontSize: "12px" }}
              />
              <Search
                size={14}
                style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--adm-text-muted)" }}
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="adm-select"
              style={{ fontSize: "12px" }}
            >
              <option value="ativas">Status: Apenas Ativas</option>
              <option value="todos">Status: Todos</option>
              <option value="pendente">Pendente</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="aguardando_terceiro">Aguardando Terceiro</option>
              <option value="concluida">Concluída</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>

          {/* Prioridade */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="adm-select"
              style={{ fontSize: "12px" }}
            >
              <option value="todas">Prioridade: Todas</option>
              <option value="critica">Crítica</option>
              <option value="alta">Alta</option>
              <option value="media">Média</option>
              <option value="baixa">Baixa</option>
            </select>
          </div>

          {/* Responsável */}
          <div>
            <select
              value={assignedFilter}
              onChange={(e) => setAssignedFilter(e.target.value)}
              className="adm-select"
              style={{ fontSize: "12px" }}
            >
              <option value="todos">Responsável: Todos</option>
              {uniqueAssignees.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Limpar Filtros */}
          {(searchTerm || statusFilter !== "ativas" || priorityFilter !== "todas" || assignedFilter !== "todos" || viewTab !== "todas") && (
            <div style={{ display: "flex", alignItems: "center" }}>
              <button
                type="button"
                onClick={() => {
                  setViewTab("todas");
                  setSearchTerm("");
                  setStatusFilter("ativas");
                  setPriorityFilter("todas");
                  setAssignedFilter("todos");
                  setStartDateFilter("");
                  setEndDateFilter("");
                }}
                className="adm-btn adm-btn-outline adm-btn-sm"
                style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}
              >
                Limpar Filtros
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 4. LISTA DE TAREFAS */}
      {/* ===================================================================== */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <RefreshCw size={32} className="spin-icon" style={{ color: "var(--adm-wine)", marginBottom: "12px" }} />
          <p style={{ color: "var(--adm-text-muted)", fontSize: "14px" }}>Carregando tarefas internas...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="adm-card" style={{ padding: "40px", textAlign: "center" }}>
          <CheckCircle2 size={42} style={{ color: "#16a34a", margin: "0 auto 12px auto" }} />
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--adm-text)", margin: "0 0 6px 0" }}>
            Nenhuma tarefa encontrada
          </h3>
          <p style={{ fontSize: "13px", color: "var(--adm-text-muted)", margin: "0 0 16px 0" }}>
            Não há tarefas correspondentes aos filtros selecionados.
          </p>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="adm-btn adm-btn-sm"
            style={{ background: "var(--adm-wine)", color: "#ffffff" }}
          >
            Criar Nova Tarefa
          </button>
        </div>
      ) : (
        <div className="adm-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table className="adm-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--adm-bg)", borderBottom: "1px solid var(--adm-border)" }}>
                  <th style={{ padding: "12px 14px", textAlign: "left", fontSize: "11px", textTransform: "uppercase" }}>Código & Status</th>
                  <th style={{ padding: "12px 14px", textAlign: "left", fontSize: "11px", textTransform: "uppercase" }}>Título & Atividade</th>
                  <th style={{ padding: "12px 14px", textAlign: "left", fontSize: "11px", textTransform: "uppercase" }}>Prioridade</th>
                  <th style={{ padding: "12px 14px", textAlign: "left", fontSize: "11px", textTransform: "uppercase" }}>Prazo</th>
                  <th style={{ padding: "12px 14px", textAlign: "left", fontSize: "11px", textTransform: "uppercase" }}>Responsável</th>
                  <th style={{ padding: "12px 14px", textAlign: "left", fontSize: "11px", textTransform: "uppercase" }}>Vínculos</th>
                  <th style={{ padding: "12px 14px", textAlign: "right", fontSize: "11px", textTransform: "uppercase" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => {
                  const overdue = isTaskOverdue(task, todayStr);
                  const overdueDays = overdue ? getOverdueDays(task, todayStr) : 0;
                  const dueToday = isTaskDueToday(task, todayStr);
                  const isConcluded = task.status === "concluida";

                  return (
                    <tr
                      key={task.id}
                      style={{
                        borderBottom: "1px solid var(--adm-border)",
                        background: overdue ? "rgba(220, 38, 38, 0.02)" : "transparent",
                      }}
                    >
                      {/* Código e Status */}
                      <td style={{ padding: "12px 14px", verticalAlign: "top" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <span style={{ fontFamily: "monospace", fontSize: "12px", fontWeight: 700, color: "var(--adm-wine)" }}>
                            {task.task_code}
                          </span>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              color: TASK_STATUS_CONFIG[task.status].color,
                              background: TASK_STATUS_CONFIG[task.status].bg,
                              border: `1px solid ${TASK_STATUS_CONFIG[task.status].border}`,
                              borderRadius: "4px",
                              padding: "2px 6px",
                              display: "inline-block",
                              width: "fit-content",
                            }}
                          >
                            {TASK_STATUS_CONFIG[task.status].label}
                          </span>
                        </div>
                      </td>

                      {/* Título e Descrição */}
                      <td style={{ padding: "12px 14px", verticalAlign: "top", maxWidth: "340px" }}>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--adm-text)", marginBottom: "3px" }}>
                          {task.title}
                        </div>
                        {task.description && (
                          <p style={{ fontSize: "12px", color: "var(--adm-text-muted)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                            {task.description}
                          </p>
                        )}
                      </td>

                      {/* Prioridade */}
                      <td style={{ padding: "12px 14px", verticalAlign: "top" }}>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 800,
                            color: TASK_PRIORITY_CONFIG[task.priority].color,
                            background: TASK_PRIORITY_CONFIG[task.priority].bg,
                            border: `1px solid ${TASK_PRIORITY_CONFIG[task.priority].border}`,
                            borderRadius: "4px",
                            padding: "2px 8px",
                            display: "inline-block",
                          }}
                        >
                          {TASK_PRIORITY_CONFIG[task.priority].label}
                        </span>
                      </td>

                      {/* Prazo */}
                      <td style={{ padding: "12px 14px", verticalAlign: "top" }}>
                        {task.due_date ? (
                          <div>
                            <div style={{ fontSize: "12px", fontWeight: 600, color: overdue ? "#dc2626" : "var(--adm-text)" }}>
                              {new Date(task.due_date + "T00:00:00Z").toLocaleDateString("pt-BR")}
                            </div>
                            {overdue && (
                              <span style={{ fontSize: "10px", color: "#dc2626", fontWeight: 700, display: "inline-block", marginTop: "2px" }}>
                                Vencida há {overdueDays}d
                              </span>
                            )}
                            {dueToday && (
                              <span style={{ fontSize: "10px", color: "#ea580c", fontWeight: 700, display: "inline-block", marginTop: "2px" }}>
                                Vence Hoje
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>Sem prazo</span>
                        )}
                      </td>

                      {/* Responsável */}
                      <td style={{ padding: "12px 14px", verticalAlign: "top" }}>
                        <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--adm-text)" }}>
                          {task.assigned_to_name || "Não atribuído"}
                        </div>
                      </td>

                      {/* Vínculos */}
                      <td style={{ padding: "12px 14px", verticalAlign: "top" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                          {task.contract_number && (
                            <span style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>
                              CTR: <strong>{task.contract_number}</strong>
                            </span>
                          )}
                          {task.client_name && (
                            <span style={{ fontSize: "11px", color: "var(--adm-text)" }}>
                              Cli: {task.client_name}
                            </span>
                          )}
                          {task.incident_code && (
                            <span style={{ fontSize: "10px", background: "rgba(220,38,38,0.1)", color: "#dc2626", padding: "1px 5px", borderRadius: "3px", width: "fit-content" }}>
                              OCR: {task.incident_code}
                            </span>
                          )}
                          {!task.contract_number && !task.client_name && !task.incident_code && (
                            <span style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>Geral / Sem vínculo</span>
                          )}
                        </div>
                      </td>

                      {/* Ações */}
                      <td style={{ padding: "12px 14px", verticalAlign: "top", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          <button
                            type="button"
                            onClick={() => setDetailTask(task)}
                            className="adm-btn adm-btn-outline adm-btn-sm"
                            style={{ fontSize: "11px", padding: "4px 8px" }}
                            title="Ver detalhes e histórico da tarefa"
                          >
                            Detalhes
                          </button>

                          {isConcluded ? (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(task, "em_andamento")}
                              className="adm-btn adm-btn-outline adm-btn-sm"
                              style={{ fontSize: "11px", color: "#d97706", borderColor: "#fcd34d", padding: "4px 8px" }}
                              title="Reabrir tarefa concluída"
                            >
                              <RotateCcw size={12} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(task, "concluida")}
                              className="adm-btn adm-btn-sm"
                              style={{ fontSize: "11px", background: "#16a34a", color: "#ffffff", padding: "4px 8px" }}
                              title="Marcar tarefa como concluída"
                            >
                              <CheckCircle2 size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 1: CRIAR NOVA TAREFA */}
      {/* ===================================================================== */}
      {isCreateModalOpen && (
        <div className="adm-modal-overlay" style={{ zIndex: 9999 }}>
          <div className="adm-modal-card" style={{ maxWidth: "680px", width: "100%", maxHeight: "90vh", overflowY: "auto", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <CheckSquare size={20} style={{ color: "var(--adm-wine)" }} />
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--adm-text)", margin: 0 }}>
                  Nova Tarefa Administrativa / Operacional
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="adm-btn adm-btn-icon adm-btn-outline adm-btn-sm"
              >
                <X size={16} />
              </button>
            </div>

            {formErrors.length > 0 && (
              <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: "8px", padding: "10px 14px", marginBottom: "14px" }}>
                {formErrors.map((err, i) => (
                  <p key={i} style={{ color: "#b91c1c", fontSize: "12px", margin: "2px 0" }}>• {err}</p>
                ))}
              </div>
            )}

            <form onSubmit={handleCreateTask}>
              {/* Título */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--adm-text)", display: "block", marginBottom: "4px" }}>
                  Título da Tarefa: <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Entrar em contato com hotel para confirmar quartos..."
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="adm-input"
                  required
                />
              </div>

              {/* Descrição */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--adm-text)", display: "block", marginBottom: "4px" }}>
                  Descrição Detalhada da Atividade:
                </label>
                <textarea
                  placeholder="Detalhes, passos a seguir ou orientações necessárias..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="adm-input"
                  rows={3}
                />
              </div>

              {/* Prioridade e Status */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--adm-text)", display: "block", marginBottom: "4px" }}>
                    Prioridade:
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as TaskPriority)}
                    className="adm-select"
                  >
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                    <option value="critica">Crítica (Urgência Máxima)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--adm-text)", display: "block", marginBottom: "4px" }}>
                    Status Inicial:
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as TaskStatus)}
                    className="adm-select"
                  >
                    <option value="pendente">Pendente</option>
                    <option value="em_andamento">Em Andamento</option>
                    <option value="aguardando_terceiro">Aguardando Terceiro</option>
                  </select>
                </div>
              </div>

              {/* Prazo e Responsável */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--adm-text)", display: "block", marginBottom: "4px" }}>
                    Prazo de Entrega (Data Limite):
                  </label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="adm-input"
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--adm-text)", display: "block", marginBottom: "4px" }}>
                    Responsável Atribuído:
                  </label>
                  <input
                    type="text"
                    value={formAssignedToName}
                    onChange={(e) => setFormAssignedToName(e.target.value)}
                    className="adm-input"
                    placeholder="Nome do operador ou vendedor"
                  />
                </div>
              </div>

              {/* Vínculos Opcionais (Contrato, Ocorrência, Cliente) */}
              <div style={{ background: "var(--adm-bg)", padding: "12px", borderRadius: "8px", marginBottom: "16px" }}>
                <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--adm-text-muted)", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                  Vínculos Opcionais (A tarefa pode existir sem nenhum vínculo)
                </span>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ fontSize: "11px", color: "var(--adm-text-muted)", display: "block", marginBottom: "2px" }}>
                      Número do Contrato:
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: CTR-2026-0042"
                      value={formContractNumber}
                      onChange={(e) => setFormContractNumber(e.target.value)}
                      className="adm-input"
                      style={{ fontSize: "12px" }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "11px", color: "var(--adm-text-muted)", display: "block", marginBottom: "2px" }}>
                      Nome do Cliente:
                    </label>
                    <input
                      type="text"
                      placeholder="Nome do titular"
                      value={formClientName}
                      onChange={(e) => setFormClientName(e.target.value)}
                      className="adm-input"
                      style={{ fontSize: "12px" }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "11px", color: "var(--adm-text-muted)", display: "block", marginBottom: "2px" }}>
                      Código da Ocorrência:
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: OCR-2026-0002"
                      value={formIncidentCode}
                      onChange={(e) => setFormIncidentCode(e.target.value)}
                      className="adm-input"
                      style={{ fontSize: "12px" }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "11px", color: "var(--adm-text-muted)", display: "block", marginBottom: "2px" }}>
                      Serviço Vinculado:
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Passeio Chichén Itzá"
                      value={formServiceName}
                      onChange={(e) => setFormServiceName(e.target.value)}
                      className="adm-input"
                      style={{ fontSize: "12px" }}
                    />
                  </div>
                </div>
              </div>

              {/* Observações Internas */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--adm-text)", display: "block", marginBottom: "4px" }}>
                  Observações Internas (Equipe):
                </label>
                <input
                  type="text"
                  placeholder="Anotações e instruções operacionais internas..."
                  value={formInternalNotes}
                  onChange={(e) => setFormInternalNotes(e.target.value)}
                  className="adm-input"
                />
              </div>

              {/* Botões do Rodapé */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="adm-btn adm-btn-outline"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingCreate}
                  className="adm-btn"
                  style={{ background: "var(--adm-wine)", color: "#ffffff", fontWeight: 700 }}
                >
                  {submittingCreate ? "Salvando..." : "Criar Tarefa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: DETALHES, HISTÓRICO E ANDAMENTOS */}
      {/* ===================================================================== */}
      {detailTask && (
        <div className="adm-modal-overlay" style={{ zIndex: 9999 }}>
          <div className="adm-modal-card" style={{ maxWidth: "760px", width: "100%", maxHeight: "92vh", overflowY: "auto", padding: "24px" }}>
            {/* Cabeçalho */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <span style={{ fontFamily: "monospace", fontSize: "13px", fontWeight: 800, background: "var(--adm-bg)", border: "1px solid var(--adm-border)", padding: "2px 8px", borderRadius: "4px", color: "var(--adm-wine)" }}>
                    {detailTask.task_code}
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 800,
                      color: TASK_PRIORITY_CONFIG[detailTask.priority].color,
                      background: TASK_PRIORITY_CONFIG[detailTask.priority].bg,
                      border: `1px solid ${TASK_PRIORITY_CONFIG[detailTask.priority].border}`,
                      padding: "2px 8px",
                      borderRadius: "4px",
                    }}
                  >
                    {TASK_PRIORITY_CONFIG[detailTask.priority].label}
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 800,
                      color: TASK_STATUS_CONFIG[detailTask.status].color,
                      background: TASK_STATUS_CONFIG[detailTask.status].bg,
                      border: `1px solid ${TASK_STATUS_CONFIG[detailTask.status].border}`,
                      padding: "2px 8px",
                      borderRadius: "4px",
                    }}
                  >
                    {TASK_STATUS_CONFIG[detailTask.status].label}
                  </span>
                </div>
                <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--adm-text)", margin: "4px 0" }}>
                  {detailTask.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setDetailTask(null)}
                className="adm-btn adm-btn-icon adm-btn-outline adm-btn-sm"
              >
                <X size={16} />
              </button>
            </div>

            {/* Vencimento e Destaque Visual */}
            {isTaskOverdue(detailTask, todayStr) && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <AlertTriangle size={18} style={{ color: "#dc2626" }} />
                <span style={{ fontSize: "12px", color: "#991b1b", fontWeight: 700 }}>
                  Atenção: Esta tarefa está vencida há {getOverdueDays(detailTask, todayStr)} dia(s) (Prazo original: {new Date(detailTask.due_date! + "T00:00:00Z").toLocaleDateString("pt-BR")}).
                </span>
              </div>
            )}

            {/* Metadados da Tarefa */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px", background: "var(--adm-bg)", padding: "12px", borderRadius: "8px", marginBottom: "16px" }}>
              <div>
                <span style={{ fontSize: "11px", color: "var(--adm-text-muted)", display: "block" }}>Responsável:</span>
                <strong style={{ fontSize: "13px", color: "var(--adm-text)" }}>{detailTask.assigned_to_name || "Não atribuído"}</strong>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "var(--adm-text-muted)", display: "block" }}>Prazo:</span>
                <strong style={{ fontSize: "13px", color: detailTask.due_date ? "var(--adm-text)" : "var(--adm-text-muted)" }}>
                  {detailTask.due_date ? new Date(detailTask.due_date + "T00:00:00Z").toLocaleDateString("pt-BR") : "Sem prazo"}
                </strong>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "var(--adm-text-muted)", display: "block" }}>Criado por:</span>
                <strong style={{ fontSize: "13px", color: "var(--adm-text)" }}>{detailTask.created_by_name || "Sistema"}</strong>
              </div>
              {detailTask.completed_at && (
                <div>
                  <span style={{ fontSize: "11px", color: "#16a34a", display: "block" }}>Concluído em:</span>
                  <strong style={{ fontSize: "12px", color: "#15803d" }}>
                    {new Date(detailTask.completed_at).toLocaleString("pt-BR")}
                  </strong>
                </div>
              )}
            </div>

            {/* Descrição */}
            {detailTask.description && (
              <div style={{ marginBottom: "16px" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--adm-text)", display: "block", marginBottom: "4px" }}>
                  Descrição da Atividade:
                </span>
                <div style={{ background: "var(--adm-card-bg)", border: "1px solid var(--adm-border)", borderRadius: "6px", padding: "10px 14px", fontSize: "13px", color: "var(--adm-text)", lineHeight: 1.5 }}>
                  {detailTask.description}
                </div>
              </div>
            )}

            {/* Vínculos Operacionais */}
            {(detailTask.contract_number || detailTask.client_name || detailTask.incident_code || detailTask.service_name) && (
              <div style={{ marginBottom: "16px" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--adm-text)", display: "block", marginBottom: "4px" }}>
                  Vínculos Operacionais:
                </span>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {detailTask.contract_number && (
                    <Link
                      href={`/admin/contratos?search=${encodeURIComponent(detailTask.contract_number)}`}
                      className="adm-btn adm-btn-outline adm-btn-sm"
                      style={{ fontSize: "11px" }}
                    >
                      <FileText size={12} />
                      <span>Contrato {detailTask.contract_number}</span>
                    </Link>
                  )}
                  {detailTask.incident_code && (
                    <Link
                      href={`/admin/ocorrencias?search=${encodeURIComponent(detailTask.incident_code)}`}
                      className="adm-btn adm-btn-outline adm-btn-sm"
                      style={{ fontSize: "11px", color: "#dc2626", borderColor: "#fca5a5" }}
                    >
                      <ShieldAlert size={12} />
                      <span>Ocorrência {detailTask.incident_code}</span>
                    </Link>
                  )}
                  {detailTask.client_name && (
                    <span style={{ fontSize: "12px", color: "var(--adm-text)", background: "var(--adm-bg)", padding: "4px 10px", borderRadius: "6px", border: "1px solid var(--adm-border)" }}>
                      Cliente: <strong>{detailTask.client_name}</strong>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Controles de Mudança Rápida */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", background: "var(--adm-bg)", padding: "12px", borderRadius: "8px", marginBottom: "20px" }}>
              <div>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--adm-text-muted)", display: "block", marginBottom: "4px" }}>
                  Alterar Status:
                </label>
                <select
                  value={detailTask.status}
                  onChange={(e) => handleUpdateStatus(detailTask, e.target.value as TaskStatus)}
                  className="adm-select"
                  style={{ fontSize: "12px" }}
                >
                  <option value="pendente">Pendente</option>
                  <option value="em_andamento">Em Andamento</option>
                  <option value="aguardando_terceiro">Aguardando Terceiro</option>
                  <option value="concluida">Concluída</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--adm-text-muted)", display: "block", marginBottom: "4px" }}>
                  Alterar Prioridade:
                </label>
                <select
                  value={detailTask.priority}
                  onChange={(e) => handleUpdatePriority(detailTask, e.target.value as TaskPriority)}
                  className="adm-select"
                  style={{ fontSize: "12px" }}
                >
                  <option value="critica">Crítica</option>
                  <option value="alta">Alta</option>
                  <option value="media">Média</option>
                  <option value="baixa">Baixa</option>
                </select>
              </div>
            </div>

            {/* Linha do Tempo e Histórico (Audit Trail) */}
            <div style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                <History size={16} style={{ color: "var(--adm-wine)" }} />
                <strong style={{ fontSize: "13px", color: "var(--adm-text)" }}>
                  Histórico de Movimentações (Auditoria no Banco)
                </strong>
              </div>

              <div style={{ background: "var(--adm-bg)", border: "1px solid var(--adm-border)", borderRadius: "8px", padding: "12px", maxHeight: "240px", overflowY: "auto" }}>
                {detailTask.history && detailTask.history.length > 0 ? (
                  detailTask.history.map((hist, idx) => (
                    <div
                      key={hist.id || idx}
                      style={{
                        paddingBottom: "10px",
                        marginBottom: "10px",
                        borderBottom: idx < (detailTask.history?.length || 0) - 1 ? "1px dashed var(--adm-border)" : "none",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--adm-wine)", textTransform: "uppercase" }}>
                          {hist.action.replace("_", " ")}
                        </span>
                        <span style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>
                          {new Date(hist.created_at).toLocaleString("pt-BR")}
                        </span>
                      </div>
                      <p style={{ margin: "2px 0", fontSize: "12px", color: "var(--adm-text)", lineHeight: 1.4 }}>
                        {hist.description}
                      </p>
                      <span style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>
                        Por: <strong>{hist.performed_by_name}</strong>
                      </span>
                    </div>
                  ))
                ) : (
                  <span style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>Nenhum histórico registrado.</span>
                )}
              </div>
            </div>

            {/* Registrar Andamento Manual */}
            <div>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--adm-text)", display: "block", marginBottom: "6px" }}>
                Adicionar Andamento ou Providência Manual:
              </span>
              <form onSubmit={handleAddAndamento} style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  placeholder="Descreva o andamento ou providência realizada..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  className="adm-input"
                  style={{ fontSize: "12px" }}
                />
                <button
                  type="submit"
                  disabled={submittingNote || !newNoteText.trim()}
                  className="adm-btn adm-btn-sm"
                  style={{ background: "var(--adm-wine)", color: "#ffffff", display: "inline-flex", alignItems: "center", gap: "4px" }}
                >
                  <Send size={13} />
                  <span>{submittingNote ? "Salvando..." : "Registrar"}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
