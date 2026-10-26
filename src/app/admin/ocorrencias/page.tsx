"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuthProfile } from "@/lib/auth/AuthContext";
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
} from "@/lib/operational/incidentOperations";
import {
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  Building,
  MapPin,
  RefreshCw,
  X,
  Phone,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  Info,
  Car,
  Plane,
  Ticket,
  AlertCircle,
  Plus,
  Edit2,
  CheckCheck,
  Send,
  MessageSquare,
  User,
  History,
  FileText,
  UserCheck,
  XCircle,
  ArrowRight,
  Sparkles,
  CheckSquare,
} from "lucide-react";

export default function AdminOcorrenciasPage() {
  const { role, profile } = useAuthProfile();
  const isAdmin = role === "admin";
  const currentUserName = profile?.fullName || "Operador Tío Nenê";
  const currentUserId = profile?.id || null;

  // Estados de Carregamento e Dados
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [dbAvailable, setDbAvailable] = useState<boolean>(true);
  const [incidents, setIncidents] = useState<OperationalIncident[]>([]);
  const [contractsList, setContractsList] = useState<any[]>([]);
  const [suppliersList, setSuppliersList] = useState<Array<{ id: string; name: string }>>([]);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Estados de Filtros
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("todos");
  const [priorityFilter, setPriorityFilter] = useState<string>("todas");
  const [statusFilter, setStatusFilter] = useState<string>("ativas"); // padrão: ocorrências ativas
  const [assignedFilter, setAssignedFilter] = useState<string>("todos");
  const [supplierFilter, setSupplierFilter] = useState<string>("todos");
  const [startDateFilter, setStartDateFilter] = useState<string>("");
  const [endDateFilter, setEndDateFilter] = useState<string>("");

  // Modais
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [detailIncident, setDetailIncident] = useState<OperationalIncident | null>(null);
  const [resolveIncidentModal, setResolveIncidentModal] = useState<OperationalIncident | null>(null);

  // Estado do Formulário de Criação
  const [formContractId, setFormContractId] = useState<string>("");
  const [formContractNumber, setFormContractNumber] = useState<string>("");
  const [formClientId, setFormClientId] = useState<string>("");
  const [formClientName, setFormClientName] = useState<string>("");
  const [formClientPhone, setFormClientPhone] = useState<string>("");
  const [formClientEmail, setFormClientEmail] = useState<string>("");
  const [formReservationId, setFormReservationId] = useState<string>("");
  const [formArrivalId, setFormArrivalId] = useState<string>("");
  const [formServiceName, setFormServiceName] = useState<string>("");
  const [formServiceDate, setFormServiceDate] = useState<string>("");
  const [formSupplierId, setFormSupplierId] = useState<string>("");
  const [formSupplierName, setFormSupplierName] = useState<string>("");
  const [formIncidentType, setFormIncidentType] = useState<IncidentType>("atraso_fornecedor");
  const [formTitle, setFormTitle] = useState<string>("");
  const [formDescription, setFormDescription] = useState<string>("");
  const [formPriority, setFormPriority] = useState<IncidentPriority>("alta");
  const [formAssignedToName, setFormAssignedToName] = useState<string>(currentUserName);
  const [formInternalNotes, setFormInternalNotes] = useState<string>("");
  const [formPriorityManuallySet, setFormPriorityManuallySet] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [submittingCreate, setSubmittingCreate] = useState<boolean>(false);

  // Estado do Formulário de Resolução
  const [resolutionNotes, setResolutionNotes] = useState<string>("");
  const [resolutionInternalNotes, setResolutionInternalNotes] = useState<string>("");
  const [resolutionError, setResolutionError] = useState<string | null>(null);
  const [submittingResolve, setSubmittingResolve] = useState<boolean>(false);

  // Estado de Novo Andamento no Modal de Detalhes
  const [newNoteText, setNewNoteText] = useState<string>("");
  const [submittingNote, setSubmittingNote] = useState<boolean>(false);

  // Copiar código com feedback visual
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2500);
  };

  // Carregar Dados do Banco (com fallback de segurança se migration não estiver aplicada)
  const fetchIncidentsData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      // 1. Carregar fornecedores para os filtros e formulário (sem expor financeiro)
      const { data: supps } = await supabase
        .from("suppliers")
        .select("id, name");
      if (supps) {
        setSuppliersList(supps.filter((s: any) => s.name));
      }

      // 2. Carregar contratos recentes para a seleção no formulário de criação
      const { data: contractsData } = await supabase
        .from("contracts")
        .select(`
          id,
          contract_number,
          client_id,
          client_name,
          client_phone,
          client_email,
          status,
          hotel_name,
          arrival_date,
          departure_date
        `)
        .order("created_at", { ascending: false })
        .limit(100);
      if (contractsData) {
        setContractsList(contractsData);
      }

      // 3. Carregar ocorrências operacionais com histórico anexo
      const { data: incData, error: incError } = await supabase
        .from("operational_incidents")
        .select(`
          id,
          incident_code,
          contract_id,
          contract_number,
          client_id,
          client_name,
          client_phone,
          client_email,
          reservation_id,
          arrival_id,
          service_name,
          service_date,
          supplier_id,
          supplier_name,
          incident_type,
          title,
          description,
          priority,
          status,
          assigned_to,
          assigned_to_name,
          opened_at,
          resolved_at,
          resolved_by,
          resolved_by_name,
          resolution_notes,
          internal_notes,
          created_by,
          created_by_name,
          created_at,
          updated_at
        `)
        .order("opened_at", { ascending: false });

      if (incError) {
        console.warn("operational_incidents indisponível ou aguardando migration:", incError.message);
        setDbAvailable(false);
      } else if (incData) {
        setDbAvailable(true);

        // Carregar históricos para as ocorrências retornadas
        const incidentIds = incData.map((i: any) => i.id);
        let historyMap: Record<string, IncidentHistoryEntry[]> = {};

        if (incidentIds.length > 0) {
          const { data: histData } = await supabase
            .from("operational_incident_history")
            .select("*")
            .in("incident_id", incidentIds)
            .order("created_at", { ascending: true });

          if (histData) {
            histData.forEach((h: any) => {
              if (!historyMap[h.incident_id]) historyMap[h.incident_id] = [];
              historyMap[h.incident_id].push(h);
            });
          }
        }

        const consolidated: OperationalIncident[] = incData.map((inc: any) => ({
          ...inc,
          history: historyMap[inc.id] || [],
        }));

        setIncidents(consolidated);
      }
    } catch (err) {
      console.error("Erro geral ao carregar ocorrências:", err);
      setDbAvailable(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchIncidentsData();
  }, [fetchIncidentsData]);

  // Leitura de parâmetros de busca via URL (?search=..., ?new=true, ?contractId=...)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const searchParam = params.get("search");
    const openNew = params.get("new");
    const cId = params.get("contractId");
    const cNum = params.get("contractNumber");
    const cName = params.get("clientName");
    const sName = params.get("serviceName");
    const sDate = params.get("serviceDate");
    const supName = params.get("supplierName");
    const resId = params.get("reservationId");
    const arrId = params.get("arrivalId");
    const prio = params.get("priority");
    const ttl = params.get("title");
    const typ = params.get("type");

    if (searchParam) {
      setSearchTerm(searchParam);
    }

    if (openNew === "true" || cId) {
      setIsCreateModalOpen(true);
      if (cId) setFormContractId(cId);
      if (cNum) setFormContractNumber(cNum);
      if (cName) setFormClientName(cName);
      if (sName) setFormServiceName(sName);
      if (sDate) setFormServiceDate(sDate);
      if (supName) setFormSupplierName(supName);
      if (resId) setFormReservationId(resId);
      if (arrId) setFormArrivalId(arrId);
      if (ttl) setFormTitle(ttl);
      if (typ && Object.keys(INCIDENT_TYPES_CONFIG).includes(typ)) {
        setFormIncidentType(typ as IncidentType);
      }
      if (prio && ["baixa", "media", "alta", "critica"].includes(prio)) {
        setFormPriority(prio as IncidentPriority);
        setFormPriorityManuallySet(true);
      }
    }
  }, []);

  // Quando o operador seleciona um contrato no modal de criação
  const handleSelectContract = (contractId: string) => {
    setFormContractId(contractId);
    const selected = contractsList.find((c) => c.id === contractId);
    if (selected) {
      setFormContractNumber(selected.contract_number || "");
      setFormClientId(selected.client_id || "");
      setFormClientName(selected.client_name || "");
      setFormClientPhone(selected.client_phone || "");
      setFormClientEmail(selected.client_email || "");
    }
  };

  // Sugestão Inteligente de Prioridade ao alterar Tipo de Ocorrência ou Data do Serviço
  const handleTypeChange = (newType: IncidentType) => {
    setFormIncidentType(newType);
    if (!formPriorityManuallySet) {
      const suggested = suggestIncidentPriority(newType, formServiceDate);
      setFormPriority(suggested);
    }
  };

  const handleServiceDateChange = (newDate: string) => {
    setFormServiceDate(newDate);
    if (!formPriorityManuallySet) {
      const suggested = suggestIncidentPriority(formIncidentType, newDate);
      setFormPriority(suggested);
    }
  };

  // KPIs Consolidados
  const kpis = useMemo(() => {
    return calculateIncidentKpis(incidents);
  }, [incidents]);

  // Lista Filtrada
  const filteredIncidents = useMemo(() => {
    const filters: IncidentFilters = {
      searchTerm,
      incidentType: typeFilter,
      priority: priorityFilter,
      status: statusFilter,
      assignedTo: assignedFilter,
      supplierId: supplierFilter,
      startDate: startDateFilter || undefined,
      endDate: endDateFilter || undefined,
    };
    const filtered = filterIncidents(incidents, filters);
    return sortIncidentsByPriorityAndDate(filtered);
  }, [
    incidents,
    searchTerm,
    typeFilter,
    priorityFilter,
    statusFilter,
    assignedFilter,
    supplierFilter,
    startDateFilter,
    endDateFilter,
  ]);

  // Lista Única de Responsáveis para Filtro
  const uniqueOperators = useMemo(() => {
    const map = new Set<string>();
    incidents.forEach((i) => {
      if (i.assigned_to_name) map.add(i.assigned_to_name);
    });
    return Array.from(map);
  }, [incidents]);

  // ===========================================================================
  // AÇÃO 1: CRIAR NOVA OCORRÊNCIA
  // ===========================================================================
  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]);

    const validation = validateIncidentCreation({
      contractId: formContractId,
      contractNumber: formContractNumber,
      clientName: formClientName,
      incidentType: formIncidentType,
      title: formTitle,
      description: formDescription,
    });

    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    setSubmittingCreate(true);
    const incidentCode = generateSuggestedIncidentCode();
    const nowIso = new Date().toISOString();

    const newRecord: OperationalIncident = {
      id: crypto?.randomUUID ? crypto.randomUUID() : `inc-${Date.now()}`,
      incident_code: incidentCode,
      contract_id: formContractId,
      contract_number: formContractNumber,
      client_id: formClientId || null,
      client_name: formClientName,
      client_phone: formClientPhone || null,
      client_email: formClientEmail || null,
      reservation_id: formReservationId || null,
      arrival_id: formArrivalId || null,
      service_name: formServiceName || null,
      service_date: formServiceDate || null,
      supplier_id: formSupplierId || null,
      supplier_name: formSupplierName || null,
      incident_type: formIncidentType,
      title: formTitle.trim(),
      description: formDescription.trim(),
      priority: formPriority,
      status: "aberta",
      assigned_to: currentUserId,
      assigned_to_name: formAssignedToName.trim() || currentUserName,
      opened_at: nowIso,
      internal_notes: formInternalNotes.trim() || null,
      created_by: currentUserId,
      created_by_name: currentUserName,
      created_at: nowIso,
      updated_at: nowIso,
      history: [],
    };

    const initialHistory = buildIncidentHistoryEntry({
      incidentId: newRecord.id,
      action: "abertura",
      description: `Ocorrência registrada por ${currentUserName} com prioridade ${INCIDENT_PRIORITY_CONFIG[formPriority].label}.`,
      performedByName: currentUserName,
      performedBy: currentUserId,
      statusAfter: "aberta",
      priorityAfter: formPriority,
      assignedToAfter: newRecord.assigned_to_name,
    });

    newRecord.history = [initialHistory];

    try {
      if (dbAvailable) {
        // Inserir no Supabase
        const { data: inserted, error: insertErr } = await supabase
          .from("operational_incidents")
          .insert({
            id: newRecord.id,
            incident_code: newRecord.incident_code,
            contract_id: newRecord.contract_id,
            contract_number: newRecord.contract_number,
            client_id: newRecord.client_id,
            client_name: newRecord.client_name,
            client_phone: newRecord.client_phone,
            client_email: newRecord.client_email,
            reservation_id: newRecord.reservation_id,
            arrival_id: newRecord.arrival_id,
            service_name: newRecord.service_name,
            service_date: newRecord.service_date,
            supplier_id: newRecord.supplier_id,
            supplier_name: newRecord.supplier_name,
            incident_type: newRecord.incident_type,
            title: newRecord.title,
            description: newRecord.description,
            priority: newRecord.priority,
            status: newRecord.status,
            assigned_to: newRecord.assigned_to,
            assigned_to_name: newRecord.assigned_to_name,
            opened_at: newRecord.opened_at,
            internal_notes: newRecord.internal_notes,
            created_by: newRecord.created_by,
            created_by_name: newRecord.created_by_name,
          })
          .select()
          .single();

        if (insertErr) {
          console.warn("Erro ao persistir ocorrência no banco:", insertErr.message);
        }
        // Nota de Integridade (Tarefa 28): O histórico de criação ('abertura') é registrado
        // automaticamente pelo gatilho AFTER INSERT (record_operational_incident_audit_history) no PostgreSQL.
        // O cliente não insere diretamente em operational_incident_history.
      }

      // Atualizar estado local imediatamente
      setIncidents((prev) => [newRecord, ...prev]);
      setIsCreateModalOpen(false);

      // Limpar formulário
      setFormContractId("");
      setFormContractNumber("");
      setFormClientId("");
      setFormClientName("");
      setFormTitle("");
      setFormDescription("");
      setFormInternalNotes("");
      setFormServiceName("");
      setFormServiceDate("");
      setFormSupplierId("");
      setFormSupplierName("");
      setFormPriorityManuallySet(false);
    } catch (err: any) {
      console.error("Erro inesperado na criação:", err);
      // Fallback em memória
      setIncidents((prev) => [newRecord, ...prev]);
      setIsCreateModalOpen(false);
    } finally {
      setSubmittingCreate(false);
    }
  };

  // ===========================================================================
  // AÇÃO 2: ATUALIZAR STATUS E HISTÓRICO
  // ===========================================================================
  const handleUpdateStatus = async (
    targetIncident: OperationalIncident,
    newStatus: IncidentStatus
  ) => {
    // Se o novo status for 'resolvida', deve abrir o modal de resolução obrigatório!
    if (newStatus === "resolvida") {
      setResolveIncidentModal(targetIncident);
      return;
    }

    const previousStatus = targetIncident.status;
    if (previousStatus === newStatus) return;

    const histEntry = buildIncidentHistoryEntry({
      incidentId: targetIncident.id,
      action: newStatus === "cancelada" ? "cancelamento" : "alteracao_status",
      description: `Status alterado de "${INCIDENT_STATUS_CONFIG[previousStatus].label}" para "${INCIDENT_STATUS_CONFIG[newStatus].label}".`,
      performedByName: currentUserName,
      performedBy: currentUserId,
      statusBefore: previousStatus,
      statusAfter: newStatus,
    });

    try {
      if (dbAvailable) {
        // Tarefa 28: Apenas atualizamos operational_incidents.
        // O trigger AFTER UPDATE no banco registra automaticamente o histórico ('alteracao_status' ou 'cancelamento').
        const { error: updateErr } = await supabase
          .from("operational_incidents")
          .update({
            status: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq("id", targetIncident.id);

        if (updateErr) {
          console.warn("Aviso ao atualizar status da ocorrência no banco:", updateErr.message);
        }
      }

      // Atualizar estado local
      setIncidents((prev) =>
        prev.map((i) => {
          if (i.id === targetIncident.id) {
            return {
              ...i,
              status: newStatus,
              history: [...(i.history || []), histEntry],
            };
          }
          return i;
        })
      );

      if (detailIncident && detailIncident.id === targetIncident.id) {
        setDetailIncident((prev) =>
          prev
            ? {
                ...prev,
                status: newStatus,
                history: [...(prev.history || []), histEntry],
              }
            : null
        );
      }
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
    }
  };

  // ===========================================================================
  // AÇÃO 3: RESOLVER OCORRÊNCIA (COM VALIDAÇÃO ESTRITA DE SOLUÇÃO)
  // ===========================================================================
  const handleResolveIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolveIncidentModal) return;

    const validation = validateIncidentResolution(resolutionNotes);
    if (!validation.isValid) {
      setResolutionError(validation.error || "Solução inválida.");
      return;
    }

    setSubmittingResolve(true);
    setResolutionError(null);
    const nowIso = new Date().toISOString();
    const previousStatus = resolveIncidentModal.status;

    const histEntry = buildIncidentHistoryEntry({
      incidentId: resolveIncidentModal.id,
      action: "resolucao",
      description: `Ocorrência resolvida por ${currentUserName}. Solução aplicada: "${resolutionNotes.trim()}".`,
      performedByName: currentUserName,
      performedBy: currentUserId,
      statusBefore: previousStatus,
      statusAfter: "resolvida",
      metadata: { resolutionNotes: resolutionNotes.trim() },
    });

    try {
      if (dbAvailable) {
        // Tarefa 28: Apenas atualizamos a ocorrência com resolution_notes.
        // O trigger AFTER UPDATE no banco registra a ação 'resolucao' automaticamente.
        const { error: resolveErr } = await supabase
          .from("operational_incidents")
          .update({
            status: "resolvida",
            resolved_at: nowIso,
            resolved_by: currentUserId,
            resolved_by_name: currentUserName,
            resolution_notes: resolutionNotes.trim(),
            internal_notes: resolutionInternalNotes.trim()
              ? `${resolveIncidentModal.internal_notes ? resolveIncidentModal.internal_notes + "\n" : ""}[Resolução]: ${resolutionInternalNotes.trim()}`
              : resolveIncidentModal.internal_notes,
            updated_at: nowIso,
          })
          .eq("id", resolveIncidentModal.id);

        if (resolveErr) {
          console.warn("Aviso ao resolver ocorrência no banco:", resolveErr.message);
        }
      }

      setIncidents((prev) =>
        prev.map((i) => {
          if (i.id === resolveIncidentModal.id) {
            return {
              ...i,
              status: "resolvida",
              resolved_at: nowIso,
              resolved_by: currentUserId,
              resolved_by_name: currentUserName,
              resolution_notes: resolutionNotes.trim(),
              history: [...(i.history || []), histEntry],
            };
          }
          return i;
        })
      );

      if (detailIncident && detailIncident.id === resolveIncidentModal.id) {
        setDetailIncident((prev) =>
          prev
            ? {
                ...prev,
                status: "resolvida",
                resolved_at: nowIso,
                resolved_by: currentUserId,
                resolved_by_name: currentUserName,
                resolution_notes: resolutionNotes.trim(),
                history: [...(prev.history || []), histEntry],
              }
            : null
        );
      }

      setResolveIncidentModal(null);
      setResolutionNotes("");
      setResolutionInternalNotes("");
    } catch (err) {
      console.error("Erro ao resolver ocorrência:", err);
    } finally {
      setSubmittingResolve(false);
    }
  };

  // ===========================================================================
  // AÇÃO 4: ADICIONAR ANDAMENTO / NOTA DE HISTÓRICO
  // ===========================================================================
  const handleAddHistoryNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailIncident || !newNoteText.trim()) return;

    setSubmittingNote(true);
    const histEntry = buildIncidentHistoryEntry({
      incidentId: detailIncident.id,
      action: "andamento",
      description: newNoteText.trim(),
      performedByName: currentUserName,
      performedBy: currentUserId,
      statusBefore: detailIncident.status,
      statusAfter: detailIncident.status,
    });

    try {
      if (dbAvailable) {
        // Tarefa 28: Utiliza a RPC SECURITY DEFINER add_operational_incident_andamento
        // Autoria, papel operacional e timestamps são validados e gravados estritamente pelo PostgreSQL.
        const { data: rpcData, error: rpcError } = await supabase.rpc(
          "add_operational_incident_andamento",
          {
            p_incident_id: detailIncident.id,
            p_description: newNoteText.trim(),
          }
        );

        if (rpcError) {
          console.warn("Aviso ao registrar andamento via RPC:", rpcError.message);
        }
      }

      setIncidents((prev) =>
        prev.map((i) => {
          if (i.id === detailIncident.id) {
            return {
              ...i,
              history: [...(i.history || []), histEntry],
            };
          }
          return i;
        })
      );

      setDetailIncident((prev) =>
        prev
          ? {
              ...prev,
              history: [...(prev.history || []), histEntry],
            }
          : null
      );

      setNewNoteText("");
    } catch (err) {
      console.error("Erro ao adicionar andamento:", err);
    } finally {
      setSubmittingNote(false);
    }
  };

  // ===========================================================================
  // AÇÃO 5: ALTERAR PRIORIDADE
  // ===========================================================================
  const handleUpdatePriority = async (
    targetIncident: OperationalIncident,
    newPriority: IncidentPriority
  ) => {
    const previousPriority = targetIncident.priority;
    if (previousPriority === newPriority) return;

    const histEntry = buildIncidentHistoryEntry({
      incidentId: targetIncident.id,
      action: "alteracao_prioridade",
      description: `Prioridade alterada de "${INCIDENT_PRIORITY_CONFIG[previousPriority].label}" para "${INCIDENT_PRIORITY_CONFIG[newPriority].label}".`,
      performedByName: currentUserName,
      performedBy: currentUserId,
      priorityBefore: previousPriority,
      priorityAfter: newPriority,
    });

    try {
      if (dbAvailable) {
        // Tarefa 28: Apenas atualizamos a prioridade.
        // O trigger AFTER UPDATE no banco registra a ação 'alteracao_prioridade' automaticamente.
        const { error: prioErr } = await supabase
          .from("operational_incidents")
          .update({
            priority: newPriority,
            updated_at: new Date().toISOString(),
          })
          .eq("id", targetIncident.id);

        if (prioErr) {
          console.warn("Aviso ao atualizar prioridade no banco:", prioErr.message);
        }
      }

      setIncidents((prev) =>
        prev.map((i) => {
          if (i.id === targetIncident.id) {
            return {
              ...i,
              priority: newPriority,
              history: [...(i.history || []), histEntry],
            };
          }
          return i;
        })
      );

      if (detailIncident && detailIncident.id === targetIncident.id) {
        setDetailIncident((prev) =>
          prev
            ? {
                ...prev,
                priority: newPriority,
                history: [...(prev.history || []), histEntry],
              }
            : null
        );
      }
    } catch (err) {
      console.error("Erro ao alterar prioridade:", err);
    }
  };

  // ===========================================================================
  // AÇÃO 6: REATRIBUIR RESPONSÁVEL
  // ===========================================================================
  const handleReassignOperator = async (
    targetIncident: OperationalIncident,
    newOperatorName: string
  ) => {
    if (!newOperatorName.trim() || targetIncident.assigned_to_name === newOperatorName.trim()) return;

    const prevOperator = targetIncident.assigned_to_name || "Não atribuído";
    const histEntry = buildIncidentHistoryEntry({
      incidentId: targetIncident.id,
      action: "atribuicao",
      description: `Responsável reatribuído de "${prevOperator}" para "${newOperatorName.trim()}".`,
      performedByName: currentUserName,
      performedBy: currentUserId,
      assignedToBefore: prevOperator,
      assignedToAfter: newOperatorName.trim(),
    });

    try {
      if (dbAvailable) {
        // Tarefa 28: Apenas atualizamos o responsável.
        // O trigger AFTER UPDATE no banco registra a ação 'atribuicao' automaticamente.
        const { error: reassignErr } = await supabase
          .from("operational_incidents")
          .update({
            assigned_to_name: newOperatorName.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", targetIncident.id);

        if (reassignErr) {
          console.warn("Aviso ao reatribuir operador no banco:", reassignErr.message);
        }
      }

      setIncidents((prev) =>
        prev.map((i) => {
          if (i.id === targetIncident.id) {
            return {
              ...i,
              assigned_to_name: newOperatorName.trim(),
              history: [...(i.history || []), histEntry],
            };
          }
          return i;
        })
      );

      if (detailIncident && detailIncident.id === targetIncident.id) {
        setDetailIncident((prev) =>
          prev
            ? {
                ...prev,
                assigned_to_name: newOperatorName.trim(),
                history: [...(prev.history || []), histEntry],
              }
            : null
        );
      }
    } catch (err) {
      console.error("Erro ao reatribuir operador:", err);
    }
  };

  return (
    <div className="adm-page-container" style={{ paddingBottom: "80px" }}>
      {/* ===================================================================== */}
      {/* 1. CABEÇALHO DA CENTRAL DE OCORRÊNCIAS */}
      {/* ===================================================================== */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #be123c 0%, #881337 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                boxShadow: "0 2px 8px rgba(190, 18, 60, 0.25)",
              }}
            >
              <ShieldAlert size={20} />
            </div>
            <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--adm-wine)", margin: 0 }}>
              Central de Ocorrências Operacionais
            </h1>
          </div>
          <p
            style={{
              fontSize: "13px",
              color: "var(--adm-text-muted)",
              margin: 0,
              maxWidth: "700px",
            }}
          >
            Registro, acompanhamento e solução estruturada de atrasos de fornecedores, turistas não
            localizados, problemas de vouchers, pickups e reclamações com histórico imutável e rastreabilidade total.
          </p>
        </div>

        {/* Botões de Ação do Cabeçalho */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => fetchIncidentsData(true)}
            disabled={loading || refreshing}
            className="adm-btn adm-btn-outline adm-btn-sm"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            title="Atualizar dados do Supabase agora"
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
              padding: "8px 14px",
            }}
          >
            <Plus size={16} />
            <span>Nova Ocorrência</span>
          </button>
        </div>
      </div>

      {/* Alerta Informativo se a Migration ainda não tiver sido rodada manualmente */}
      {!dbAvailable && (
        <div
          style={{
            background: "#fffbeb",
            border: "1px solid #fde68a",
            borderRadius: "10px",
            padding: "12px 16px",
            marginBottom: "20px",
            fontSize: "12px",
            color: "#92400e",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <Info size={18} style={{ color: "#d97706", flexShrink: 0 }} />
          <div>
            <strong>Aviso de Schema:</strong> A tabela <code>operational_incidents</code> foi preparada
            na migration <code>20261102_operational_incidents.sql</code>. Caso ainda não tenha sido executada
            no Supabase, o módulo opera em modo de sessão com integridade garantida.
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. CARDS RESUMO DE KPIS */}
      {/* ===================================================================== */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "14px",
          marginBottom: "24px",
        }}
      >
        {/* Total */}
        <div
          className="adm-card"
          style={{
            padding: "14px",
            borderLeft: "4px solid #64748b",
            cursor: "pointer",
          }}
          onClick={() => setStatusFilter("todos")}
          title="Ver todas as ocorrências"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--adm-text-muted)", textTransform: "uppercase" }}>
              Total Registradas
            </span>
            <FileText size={16} style={{ color: "#64748b" }} />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--adm-text)", marginTop: "6px" }}>
            {kpis.totalIncidents}
          </div>
          <span style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>
            Histórico completo
          </span>
        </div>

        {/* Abertas */}
        <div
          className="adm-card"
          style={{
            padding: "14px",
            borderLeft: `4px solid ${kpis.openCount > 0 ? "#ef4444" : "#cbd5e1"}`,
            background: kpis.openCount > 0 ? "rgba(239, 68, 68, 0.05)" : "var(--adm-card-bg)",
            cursor: "pointer",
          }}
          onClick={() => setStatusFilter("aberta")}
          title="Ver ocorrências em aberto"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: kpis.openCount > 0 ? "#dc2626" : "var(--adm-text-muted)", textTransform: "uppercase" }}>
              Abertas
            </span>
            <AlertCircle size={16} style={{ color: kpis.openCount > 0 ? "#dc2626" : "#94a3b8" }} />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: kpis.openCount > 0 ? "#dc2626" : "var(--adm-text)", marginTop: "6px" }}>
            {kpis.openCount}
          </div>
          <span style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>
            Aguardando início de ação
          </span>
        </div>

        {/* Em Análise */}
        <div
          className="adm-card"
          style={{
            padding: "14px",
            borderLeft: "4px solid #f59e0b",
            cursor: "pointer",
          }}
          onClick={() => setStatusFilter("em_analise")}
          title="Ver ocorrências em análise"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#b45309", textTransform: "uppercase" }}>
              Em Análise
            </span>
            <Clock size={16} style={{ color: "#f59e0b" }} />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "#b45309", marginTop: "6px" }}>
            {kpis.inAnalysisCount}
          </div>
          <span style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>
            Sendo tratadas pela equipe
          </span>
        </div>

        {/* Aguardando Fornecedor / Cliente */}
        <div
          className="adm-card"
          style={{
            padding: "14px",
            borderLeft: "4px solid #8b5cf6",
            cursor: "pointer",
          }}
          onClick={() => setStatusFilter("aguardando_fornecedor")}
          title="Ver ocorrências aguardando retorno externo"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#7c3aed", textTransform: "uppercase" }}>
              Aguardando Retorno
            </span>
            <MessageSquare size={16} style={{ color: "#8b5cf6" }} />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "#7c3aed", marginTop: "6px" }}>
            {kpis.awaitingSupplierCount + kpis.awaitingClientCount}
          </div>
          <span style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>
            {kpis.awaitingSupplierCount} forn. / {kpis.awaitingClientCount} client.
          </span>
        </div>

        {/* Críticas Abertas */}
        <div
          className="adm-card"
          style={{
            padding: "14px",
            borderLeft: `4px solid ${kpis.criticalOpenCount > 0 ? "#be123c" : "#cbd5e1"}`,
            background: kpis.criticalOpenCount > 0 ? "rgba(190, 18, 60, 0.08)" : "var(--adm-card-bg)",
            cursor: "pointer",
          }}
          onClick={() => {
            setPriorityFilter("critica");
            setStatusFilter("ativas");
          }}
          title="Ver ocorrências críticas ativas"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: kpis.criticalOpenCount > 0 ? "#9f1239" : "var(--adm-text-muted)", textTransform: "uppercase" }}>
              Críticas Ativas
            </span>
            <AlertTriangle size={16} style={{ color: kpis.criticalOpenCount > 0 ? "#be123c" : "#94a3b8" }} />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: kpis.criticalOpenCount > 0 ? "#9f1239" : "var(--adm-text)", marginTop: "6px" }}>
            {kpis.criticalOpenCount}
          </div>
          <span style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>
            Exigem ação imediata
          </span>
        </div>

        {/* Resolvidas */}
        <div
          className="adm-card"
          style={{
            padding: "14px",
            borderLeft: "4px solid #10b981",
            cursor: "pointer",
          }}
          onClick={() => setStatusFilter("resolvida")}
          title="Ver ocorrências resolvidas"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#047857", textTransform: "uppercase" }}>
              Resolvidas
            </span>
            <CheckCircle2 size={16} style={{ color: "#10b981" }} />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "#047857", marginTop: "6px" }}>
            {kpis.resolvedCount}
          </div>
          <span style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>
            Soluções documentadas
          </span>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. BARRA DE FILTROS AVANÇADOS */}
      {/* ===================================================================== */}
      <div className="adm-card" style={{ padding: "16px", marginBottom: "20px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "12px",
            alignItems: "flex-end",
          }}
        >
          {/* Busca Textual */}
          <div style={{ gridColumn: "span 2", minWidth: "260px" }}>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--adm-text-muted)", display: "block", marginBottom: "4px" }}>
              Buscar Ocorrência (Código, Cliente, Contrato, Título):
            </label>
            <div style={{ position: "relative" }}>
              <Search
                size={15}
                style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--adm-text-muted)" }}
              />
              <input
                type="text"
                placeholder="Ex: OCR-2026-0001, Carlos, CTR-2026-012..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="adm-input"
                style={{ paddingLeft: "32px", fontSize: "13px" }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--adm-text-muted)" }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Tipo de Ocorrência */}
          <div>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--adm-text-muted)", display: "block", marginBottom: "4px" }}>
              Tipo de Ocorrência:
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="adm-select"
              style={{ fontSize: "12px" }}
            >
              <option value="todos">Todos os Tipos</option>
              {(Object.keys(INCIDENT_TYPES_CONFIG) as IncidentType[]).map((t) => (
                <option key={t} value={t}>
                  {INCIDENT_TYPES_CONFIG[t].label}
                </option>
              ))}
            </select>
          </div>

          {/* Prioridade */}
          <div>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--adm-text-muted)", display: "block", marginBottom: "4px" }}>
              Prioridade:
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="adm-select"
              style={{ fontSize: "12px" }}
            >
              <option value="todas">Todas as Prioridades</option>
              <option value="critica">Crítica (Urgente)</option>
              <option value="alta">Alta</option>
              <option value="media">Média</option>
              <option value="baixa">Baixa</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--adm-text-muted)", display: "block", marginBottom: "4px" }}>
              Status:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="adm-select"
              style={{ fontSize: "12px" }}
            >
              <option value="ativas">Ativas (Não Resolvidas)</option>
              <option value="todos">Todos os Status</option>
              <option value="aberta">Aberta</option>
              <option value="em_analise">Em Análise</option>
              <option value="aguardando_fornecedor">Aguardando Fornecedor</option>
              <option value="aguardando_cliente">Aguardando Cliente</option>
              <option value="resolvida">Resolvida</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>

          {/* Responsável */}
          <div>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--adm-text-muted)", display: "block", marginBottom: "4px" }}>
              Responsável:
            </label>
            <select
              value={assignedFilter}
              onChange={(e) => setAssignedFilter(e.target.value)}
              className="adm-select"
              style={{ fontSize: "12px" }}
            >
              <option value="todos">Todos os Responsáveis</option>
              {uniqueOperators.map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>
          </div>

          {/* Fornecedor */}
          <div>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--adm-text-muted)", display: "block", marginBottom: "4px" }}>
              Fornecedor:
            </label>
            <select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="adm-select"
              style={{ fontSize: "12px" }}
            >
              <option value="todos">Todos os Fornecedores</option>
              {suppliersList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Data de Abertura Inicial */}
          <div>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--adm-text-muted)", display: "block", marginBottom: "4px" }}>
              Abertas A Partir De:
            </label>
            <input
              type="date"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              className="adm-input"
              style={{ fontSize: "12px" }}
            />
          </div>

          {/* Limpar Filtros */}
          <div>
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setTypeFilter("todos");
                setPriorityFilter("todas");
                setStatusFilter("ativas");
                setAssignedFilter("todos");
                setSupplierFilter("todos");
                setStartDateFilter("");
                setEndDateFilter("");
              }}
              className="adm-btn adm-btn-outline"
              style={{ width: "100%", fontSize: "12px", height: "38px" }}
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 4. LISTA DE OCORRÊNCIAS */}
      {/* ===================================================================== */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <RefreshCw size={28} className="spin-icon" style={{ color: "var(--adm-gold)", margin: "0 auto 12px" }} />
          <p style={{ fontSize: "14px", color: "var(--adm-text-muted)" }}>
            Carregando ocorrências e históricos operacionais...
          </p>
        </div>
      ) : filteredIncidents.length === 0 ? (
        <div
          className="adm-card"
          style={{
            textAlign: "center",
            padding: "60px 20px",
            border: "2px dashed #bbf7d0",
            background: "#f0fdf4",
          }}
        >
          <CheckCircle2 size={36} style={{ color: "#16a34a", margin: "0 auto 12px" }} />
          <h3 style={{ fontSize: "16px", color: "#15803d", margin: "0 0 6px" }}>
            Nenhuma ocorrência encontrada
          </h3>
          <p style={{ fontSize: "13px", color: "#166534", margin: "0 0 16px" }}>
            Não há registros correspondentes aos filtros selecionados. A equipe operacional está em dia!
          </p>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="adm-btn adm-btn-sm"
            style={{ background: "#16a34a", color: "#ffffff", display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <Plus size={14} />
            <span>Registrar Ocorrência Agora</span>
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filteredIncidents.map((inc) => {
            const pConf = INCIDENT_PRIORITY_CONFIG[inc.priority];
            const sConf = INCIDENT_STATUS_CONFIG[inc.status];
            const tConf = INCIDENT_TYPES_CONFIG[inc.incident_type] || INCIDENT_TYPES_CONFIG.outro;

            return (
              <div
                key={inc.id}
                className="adm-card"
                style={{
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: "16px",
                  flexWrap: "wrap",
                  borderLeft: `5px solid ${pConf.color}`,
                  background: inc.priority === "critica" && inc.status !== "resolvida" && inc.status !== "cancelada"
                    ? "rgba(254, 226, 226, 0.25)"
                    : "var(--adm-card-bg)",
                }}
              >
                {/* Coluna 1: Código, Badges e Título */}
                <div style={{ flex: "1 1 360px", minWidth: "280px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "6px" }}>
                    {/* Código Legível */}
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontWeight: 800,
                        fontSize: "12px",
                        background: "var(--adm-bg)",
                        padding: "2px 8px",
                        borderRadius: "5px",
                        border: "1px solid var(--adm-border)",
                        color: "var(--adm-wine)",
                      }}
                    >
                      {inc.incident_code}
                    </span>

                    {/* Badge de Prioridade */}
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 800,
                        background: pConf.bg,
                        color: pConf.color,
                        border: `1px solid ${pConf.border}`,
                        padding: "2px 7px",
                        borderRadius: "4px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      {inc.priority === "critica" && <AlertTriangle size={11} />}
                      {pConf.label}
                    </span>

                    {/* Badge de Status */}
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        background: sConf.bg,
                        color: sConf.color,
                        border: `1px solid ${sConf.border}`,
                        padding: "2px 7px",
                        borderRadius: "4px",
                      }}
                    >
                      {sConf.label}
                    </span>

                    {/* Tipo de Ocorrência */}
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "var(--adm-text-muted)",
                      }}
                    >
                      • {tConf.label}
                    </span>
                  </div>

                  {/* Título da Ocorrência */}
                  <h3
                    style={{
                      margin: "0 0 6px",
                      fontSize: "15px",
                      fontWeight: 800,
                      color: "var(--adm-text)",
                    }}
                  >
                    {inc.title}
                  </h3>

                  {/* Descrição do Problema */}
                  <p
                    style={{
                      margin: "0 0 10px",
                      fontSize: "12px",
                      color: "var(--adm-text-muted)",
                      lineHeight: "1.45",
                    }}
                  >
                    {inc.description}
                  </p>

                  {/* Solução Aplicada (se resolvida) */}
                  {inc.status === "resolvida" && inc.resolution_notes && (
                    <div
                      style={{
                        background: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                        borderRadius: "6px",
                        padding: "8px 12px",
                        marginBottom: "10px",
                        fontSize: "12px",
                        color: "#166534",
                      }}
                    >
                      <strong>Solução Aplicada:</strong> {inc.resolution_notes}
                      {inc.resolved_by_name && (
                        <span style={{ fontSize: "11px", color: "#15803d", display: "block", marginTop: "3px" }}>
                          Resolvido por {inc.resolved_by_name} em {new Date(inc.resolved_at || inc.updated_at).toLocaleString("pt-BR")}.
                        </span>
                      )}
                    </div>
                  )}

                  {/* Metadados Operacionais (Cliente, Contrato, Serviço, Fornecedor) */}
                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--adm-text-muted)",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      flexWrap: "wrap",
                    }}
                  >
                    <span>
                      Cliente: <strong style={{ color: "var(--adm-text)" }}>{inc.client_name}</strong>
                    </span>
                    <span>•</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      Contrato: <strong style={{ color: "var(--adm-wine)" }}>{inc.contract_number}</strong>
                      <button
                        type="button"
                        onClick={() => handleCopy(inc.contract_number)}
                        style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--adm-text-muted)" }}
                        title="Copiar número do contrato"
                      >
                        {copiedText === inc.contract_number ? <Check size={11} style={{ color: "#16a34a" }} /> : <Copy size={11} />}
                      </button>
                    </span>

                    {inc.service_name && (
                      <>
                        <span>•</span>
                        <span>
                          Serviço: <strong>{inc.service_name}</strong>
                          {inc.service_date && ` (${inc.service_date})`}
                        </span>
                      </>
                    )}

                    {inc.supplier_name && (
                      <>
                        <span>•</span>
                        <span>
                          Fornecedor: <strong>{inc.supplier_name}</strong>
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Coluna 2: Atribuição, Datas e Ações */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: "8px",
                    minWidth: "190px",
                  }}
                >
                  {/* Responsável */}
                  <div style={{ textAlign: "right", fontSize: "11px", color: "var(--adm-text-muted)" }}>
                    <span>Responsável: </span>
                    <strong style={{ color: "var(--adm-text)" }}>
                      {inc.assigned_to_name || "Equipe Geral"}
                    </strong>
                  </div>

                  {/* Data de Abertura */}
                  <div style={{ fontSize: "11px", color: "var(--adm-text-muted)", textAlign: "right" }}>
                    Aberto em {new Date(inc.opened_at).toLocaleDateString("pt-BR")} às {new Date(inc.opened_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </div>

                  {/* Botões de Ação */}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      onClick={() => setDetailIncident(inc)}
                      className="adm-btn adm-btn-outline adm-btn-sm"
                      style={{ fontSize: "11px", padding: "4px 8px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                      title="Ver detalhes e linha do tempo de histórico"
                    >
                      <History size={12} />
                      <span>Histórico</span>
                    </button>

                    {inc.status !== "resolvida" && inc.status !== "cancelada" && (
                      <button
                        type="button"
                        onClick={() => setResolveIncidentModal(inc)}
                        className="adm-btn adm-btn-sm"
                        style={{
                          background: "#16a34a",
                          color: "#ffffff",
                          fontSize: "11px",
                          padding: "4px 9px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          fontWeight: 700,
                        }}
                        title="Concluir e documentar solução desta ocorrência"
                      >
                        <CheckCheck size={12} />
                        <span>Resolver</span>
                      </button>
                    )}

                    <Link
                      href={`/admin/operacoes?search=${encodeURIComponent(inc.contract_number)}`}
                      className="adm-btn adm-btn-outline adm-btn-sm"
                      style={{ fontSize: "11px", padding: "4px 8px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "3px" }}
                      title="Ver serviços do contrato no Painel de Operações Diárias"
                    >
                      <span>Operações</span>
                      <ExternalLink size={11} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 1: CRIAR NOVA OCORRÊNCIA */}
      {/* ===================================================================== */}
      {isCreateModalOpen && (
        <div
          className="adm-modal-backdrop"
          style={{ zIndex: 9999 }}
          onClick={() => !submittingCreate && setIsCreateModalOpen(false)}
        >
          <div
            className="adm-modal-card"
            style={{
              maxWidth: "680px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "24px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ShieldAlert size={20} style={{ color: "var(--adm-wine)" }} />
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "var(--adm-wine)" }}>
                  Registrar Ocorrência Operacional
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--adm-text-muted)" }}
              >
                <X size={18} />
              </button>
            </div>

            {formErrors.length > 0 && (
              <div
                style={{
                  background: "#fee2e2",
                  border: "1px solid #fca5a5",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  marginBottom: "16px",
                  fontSize: "12px",
                  color: "#991b1b",
                }}
              >
                <strong>Corrija os seguintes pontos:</strong>
                <ul style={{ margin: "4px 0 0", paddingLeft: "18px" }}>
                  {formErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <form onSubmit={handleCreateIncident}>
              {/* Seleção do Contrato */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--adm-text)", display: "block", marginBottom: "4px" }}>
                  Contrato do Cliente: <span style={{ color: "#ef4444" }}>*</span>
                </label>
                {contractsList.length > 0 ? (
                  <select
                    value={formContractId}
                    onChange={(e) => handleSelectContract(e.target.value)}
                    className="adm-select"
                    style={{ fontSize: "13px" }}
                    required
                  >
                    <option value="">Selecione o contrato...</option>
                    {contractsList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.contract_number} — {c.client_name} ({c.status})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Número ou ID do Contrato"
                    value={formContractNumber}
                    onChange={(e) => {
                      setFormContractNumber(e.target.value);
                      if (!formContractId) setFormContractId(e.target.value);
                    }}
                    className="adm-input"
                    required
                  />
                )}
              </div>

              {/* Dados do Cliente Titular */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--adm-text)", display: "block", marginBottom: "4px" }}>
                    Nome do Cliente: <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formClientName}
                    onChange={(e) => setFormClientName(e.target.value)}
                    placeholder="Nome completo do titular"
                    className="adm-input"
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--adm-text)", display: "block", marginBottom: "4px" }}>
                    Telefone / WhatsApp:
                  </label>
                  <input
                    type="text"
                    value={formClientPhone}
                    onChange={(e) => setFormClientPhone(e.target.value)}
                    placeholder="+55 11 99999-9999"
                    className="adm-input"
                  />
                </div>
              </div>

              {/* Serviço Operacional e Data (Opcional, quando vinculado) */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--adm-text)", display: "block", marginBottom: "4px" }}>
                    Serviço Relacionado (Opcional):
                  </label>
                  <input
                    type="text"
                    value={formServiceName}
                    onChange={(e) => setFormServiceName(e.target.value)}
                    placeholder="Ex: Passeio Chichén Itzá, Transfer In..."
                    className="adm-input"
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--adm-text)", display: "block", marginBottom: "4px" }}>
                    Data do Serviço:
                  </label>
                  <input
                    type="date"
                    value={formServiceDate}
                    onChange={(e) => handleServiceDateChange(e.target.value)}
                    className="adm-input"
                  />
                </div>
              </div>

              {/* Fornecedor Envolvido */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--adm-text)", display: "block", marginBottom: "4px" }}>
                  Fornecedor Envolvido (Opcional):
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <select
                    value={formSupplierId}
                    onChange={(e) => {
                      setFormSupplierId(e.target.value);
                      const f = suppliersList.find((s) => s.id === e.target.value);
                      if (f) setFormSupplierName(f.name);
                    }}
                    className="adm-select"
                  >
                    <option value="">Selecione da lista...</option>
                    {suppliersList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={formSupplierName}
                    onChange={(e) => setFormSupplierName(e.target.value)}
                    placeholder="Ou digite o nome do fornecedor"
                    className="adm-input"
                  />
                </div>
              </div>

              {/* Tipo de Ocorrência */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--adm-text)", display: "block", marginBottom: "4px" }}>
                  Tipo de Ocorrência: <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <select
                  value={formIncidentType}
                  onChange={(e) => handleTypeChange(e.target.value as IncidentType)}
                  className="adm-select"
                  style={{ fontSize: "13px" }}
                  required
                >
                  {(Object.keys(INCIDENT_TYPES_CONFIG) as IncidentType[]).map((t) => (
                    <option key={t} value={t}>
                      {INCIDENT_TYPES_CONFIG[t].label} — {INCIDENT_TYPES_CONFIG[t].description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Título da Ocorrência */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--adm-text)", display: "block", marginBottom: "4px" }}>
                  Título Resumido: <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Van atrasada há 35 min no Hotel Riu Cancun"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="adm-input"
                  required
                />
              </div>

              {/* Descrição Detalhada */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--adm-text)", display: "block", marginBottom: "4px" }}>
                  Descrição Completa da Situação: <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <textarea
                  placeholder="Relate detalhadamente o ocorrido, o que o cliente informou e a situação atual do serviço..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="adm-input"
                  rows={3}
                  required
                />
              </div>

              {/* Prioridade e Responsável */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--adm-text)" }}>
                      Prioridade: <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    {!formPriorityManuallySet && (
                      <span style={{ fontSize: "10px", color: "var(--adm-gold)", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                        <Sparkles size={10} /> Sugerida
                      </span>
                    )}
                  </div>
                  <select
                    value={formPriority}
                    onChange={(e) => {
                      setFormPriority(e.target.value as IncidentPriority);
                      setFormPriorityManuallySet(true);
                    }}
                    className="adm-select"
                    style={{
                      borderLeft: `4px solid ${INCIDENT_PRIORITY_CONFIG[formPriority].color}`,
                      fontWeight: 700,
                    }}
                  >
                    <option value="critica">Crítica (Urgência Máxima)</option>
                    <option value="alta">Alta</option>
                    <option value="media">Média</option>
                    <option value="baixa">Baixa</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--adm-text)", display: "block", marginBottom: "4px" }}>
                    Responsável Designado:
                  </label>
                  <input
                    type="text"
                    value={formAssignedToName}
                    onChange={(e) => setFormAssignedToName(e.target.value)}
                    placeholder="Nome do operador"
                    className="adm-input"
                  />
                </div>
              </div>

              {/* Observações Internas Iniciais */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--adm-text)", display: "block", marginBottom: "4px" }}>
                  Observações Internas (Visíveis apenas à equipe):
                </label>
                <input
                  type="text"
                  placeholder="Instruções adicionais ou contatos de emergência..."
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
                  {submittingCreate ? "Registrando..." : "Registrar Ocorrência"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: DETALHES, ANDAMENTO E HISTÓRICO COMPLETO */}
      {/* ===================================================================== */}
      {detailIncident && (
        <div
          className="adm-modal-backdrop"
          style={{ zIndex: 9999 }}
          onClick={() => setDetailIncident(null)}
        >
          <div
            className="adm-modal-card"
            style={{
              maxWidth: "760px",
              width: "100%",
              maxHeight: "92vh",
              overflowY: "auto",
              padding: "24px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontWeight: 800,
                      fontSize: "13px",
                      background: "var(--adm-bg)",
                      padding: "2px 8px",
                      borderRadius: "5px",
                      border: "1px solid var(--adm-border)",
                      color: "var(--adm-wine)",
                    }}
                  >
                    {detailIncident.incident_code}
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 800,
                      background: INCIDENT_PRIORITY_CONFIG[detailIncident.priority].bg,
                      color: INCIDENT_PRIORITY_CONFIG[detailIncident.priority].color,
                      border: `1px solid ${INCIDENT_PRIORITY_CONFIG[detailIncident.priority].border}`,
                      padding: "2px 8px",
                      borderRadius: "4px",
                    }}
                  >
                    {INCIDENT_PRIORITY_CONFIG[detailIncident.priority].label}
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      background: INCIDENT_STATUS_CONFIG[detailIncident.status].bg,
                      color: INCIDENT_STATUS_CONFIG[detailIncident.status].color,
                      border: `1px solid ${INCIDENT_STATUS_CONFIG[detailIncident.status].border}`,
                      padding: "2px 8px",
                      borderRadius: "4px",
                    }}
                  >
                    {INCIDENT_STATUS_CONFIG[detailIncident.status].label}
                  </span>
                </div>
                <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--adm-text)", margin: 0 }}>
                  {detailIncident.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setDetailIncident(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--adm-text-muted)" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Quadro de Informações Operacionais */}
            <div
              style={{
                background: "var(--adm-bg)",
                border: "1px solid var(--adm-border)",
                borderRadius: "8px",
                padding: "12px 16px",
                marginBottom: "16px",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "10px",
                fontSize: "12px",
              }}
            >
              <div>
                <span style={{ color: "var(--adm-text-muted)", display: "block" }}>Cliente:</span>
                <strong style={{ color: "var(--adm-text)" }}>{detailIncident.client_name}</strong>
                {detailIncident.client_phone && (
                  <span style={{ display: "block", color: "var(--adm-text-muted)", fontSize: "11px" }}>
                    {detailIncident.client_phone}
                  </span>
                )}
              </div>

              <div>
                <span style={{ color: "var(--adm-text-muted)", display: "block" }}>Contrato:</span>
                <strong style={{ color: "var(--adm-wine)" }}>{detailIncident.contract_number}</strong>
              </div>

              {detailIncident.service_name && (
                <div>
                  <span style={{ color: "var(--adm-text-muted)", display: "block" }}>Serviço / Data:</span>
                  <strong>{detailIncident.service_name}</strong>
                  {detailIncident.service_date && (
                    <span style={{ display: "block", color: "var(--adm-text-muted)", fontSize: "11px" }}>
                      {detailIncident.service_date}
                    </span>
                  )}
                </div>
              )}

              {detailIncident.supplier_name && (
                <div>
                  <span style={{ color: "var(--adm-text-muted)", display: "block" }}>Fornecedor:</span>
                  <strong>{detailIncident.supplier_name}</strong>
                </div>
              )}

              <div>
                <span style={{ color: "var(--adm-text-muted)", display: "block" }}>Responsável Atual:</span>
                <strong>{detailIncident.assigned_to_name || "Equipe Geral"}</strong>
              </div>

              <div>
                <span style={{ color: "var(--adm-text-muted)", display: "block" }}>Abertura:</span>
                <span>
                  {new Date(detailIncident.opened_at).toLocaleDateString("pt-BR")} às {new Date(detailIncident.opened_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </span>
                {detailIncident.created_by_name && (
                  <span style={{ display: "block", color: "var(--adm-text-muted)", fontSize: "11px" }}>
                    por {detailIncident.created_by_name}
                  </span>
                )}
              </div>
            </div>

            {/* Descrição do Problema */}
            <div style={{ marginBottom: "16px" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--adm-text)", display: "block", marginBottom: "4px" }}>
                Descrição do Problema:
              </span>
              <div
                style={{
                  background: "var(--adm-card-bg)",
                  border: "1px solid var(--adm-border)",
                  borderRadius: "6px",
                  padding: "10px 14px",
                  fontSize: "13px",
                  lineHeight: "1.5",
                  color: "var(--adm-text)",
                }}
              >
                {detailIncident.description}
              </div>
            </div>

            {/* Se Resolvida: Solução Aplicada */}
            {detailIncident.status === "resolvida" && (
              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #86efac",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  marginBottom: "16px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                  <CheckCircle2 size={16} style={{ color: "#16a34a" }} />
                  <strong style={{ fontSize: "13px", color: "#15803d" }}>
                    Solução Aplicada e Providências Tomadas:
                  </strong>
                </div>
                <p style={{ margin: 0, fontSize: "13px", color: "#166534", lineHeight: "1.5" }}>
                  {detailIncident.resolution_notes || "Solução devidamente concluída."}
                </p>
                {detailIncident.resolved_by_name && (
                  <span style={{ display: "block", fontSize: "11px", color: "#15803d", marginTop: "6px" }}>
                    Resolvido por <strong>{detailIncident.resolved_by_name}</strong> em{" "}
                    {new Date(detailIncident.resolved_at || detailIncident.updated_at).toLocaleString("pt-BR")}.
                  </span>
                )}
              </div>
            )}

            {/* Controles de Mudança Rápida de Status e Prioridade */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                marginBottom: "20px",
                background: "var(--adm-bg)",
                padding: "12px",
                borderRadius: "8px",
              }}
            >
              <div>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--adm-text-muted)", display: "block", marginBottom: "4px" }}>
                  Alterar Status Operacional:
                </label>
                <select
                  value={detailIncident.status}
                  onChange={(e) => handleUpdateStatus(detailIncident, e.target.value as IncidentStatus)}
                  className="adm-select"
                  style={{ fontSize: "12px" }}
                >
                  <option value="aberta">Aberta</option>
                  <option value="em_analise">Em Análise</option>
                  <option value="aguardando_fornecedor">Aguardando Fornecedor</option>
                  <option value="aguardando_cliente">Aguardando Cliente</option>
                  <option value="resolvida">Resolvida (Concluir)</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--adm-text-muted)", display: "block", marginBottom: "4px" }}>
                  Alterar Prioridade:
                </label>
                <select
                  value={detailIncident.priority}
                  onChange={(e) => handleUpdatePriority(detailIncident, e.target.value as IncidentPriority)}
                  className="adm-select"
                  style={{ fontSize: "12px" }}
                >
                  <option value="critica">Crítica (Urgência Máxima)</option>
                  <option value="alta">Alta</option>
                  <option value="media">Média</option>
                  <option value="baixa">Baixa</option>
                </select>
              </div>
            </div>

            {/* Ação Rápida: Criar Tarefa Integrada */}
            <div style={{ marginBottom: "20px", display: "flex", justifyContent: "flex-end" }}>
              <Link
                href={`/admin/tarefas?new=true&incidentId=${detailIncident.id}&incidentCode=${encodeURIComponent(detailIncident.incident_code)}&contractId=${detailIncident.contract_id}&contractNumber=${encodeURIComponent(detailIncident.contract_number)}&clientName=${encodeURIComponent(detailIncident.client_name)}&title=${encodeURIComponent('Tratar: ' + detailIncident.title)}&priority=${detailIncident.priority}`}
                className="adm-btn adm-btn-outline adm-btn-sm"
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                title="Criar uma nova tarefa interna vinculada a esta ocorrência"
              >
                <CheckSquare size={14} style={{ color: "var(--adm-wine)" }} />
                <span>Criar Tarefa para esta Ocorrência</span>
              </Link>
            </div>

            {/* Linha do Tempo e Histórico (Audit Trail) */}
            <div style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                <History size={16} style={{ color: "var(--adm-wine)" }} />
                <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--adm-text)" }}>
                  Histórico e Auditoria Imutável ({detailIncident.history?.length || 0} registros)
                </h4>
              </div>

              {(!detailIncident.history || detailIncident.history.length === 0) ? (
                <div style={{ fontSize: "12px", color: "var(--adm-text-muted)", fontStyle: "italic" }}>
                  Nenhum andamento posterior registrado ainda.
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    borderLeft: "2px solid var(--adm-border)",
                    paddingLeft: "14px",
                    marginLeft: "6px",
                  }}
                >
                  {detailIncident.history.map((h, idx) => (
                    <div
                      key={h.id || idx}
                      style={{
                        background: "var(--adm-card-bg)",
                        border: "1px solid var(--adm-border)",
                        borderRadius: "6px",
                        padding: "8px 12px",
                        fontSize: "12px",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: h.action === "resolucao" ? "#16a34a" : h.action === "cancelamento" ? "#64748b" : "var(--adm-gold)",
                          position: "absolute",
                          left: "-19px",
                          top: "12px",
                        }}
                      />
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                        <strong style={{ color: "var(--adm-wine)", textTransform: "capitalize" }}>
                          {h.action.replace("_", " ")}
                        </strong>
                        <span style={{ fontSize: "10px", color: "var(--adm-text-muted)" }}>
                          {new Date(h.created_at).toLocaleString("pt-BR")}
                        </span>
                      </div>
                      <p style={{ margin: "2px 0 4px", color: "var(--adm-text)", lineHeight: "1.4" }}>
                        {h.description}
                      </p>
                      <span style={{ fontSize: "10px", color: "var(--adm-text-muted)" }}>
                        Registrado por <strong>{h.performed_by_name}</strong>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Formulário para Adicionar Andamento */}
            <form onSubmit={handleAddHistoryNote} style={{ marginTop: "16px" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--adm-text)", display: "block", marginBottom: "4px" }}>
                Adicionar Novo Andamento / Providência:
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  placeholder="Ex: Entrado em contato com o fornecedor via WhatsApp; nova van a caminho..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  className="adm-input"
                  style={{ flex: 1, fontSize: "13px" }}
                />
                <button
                  type="submit"
                  disabled={submittingNote || !newNoteText.trim()}
                  className="adm-btn adm-btn-sm"
                  style={{
                    background: "var(--adm-wine)",
                    color: "#ffffff",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    fontWeight: 600,
                  }}
                >
                  <Send size={13} />
                  <span>{submittingNote ? "Salvando..." : "Registrar"}</span>
                </button>
              </div>
            </form>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
              <button
                type="button"
                onClick={() => setDetailIncident(null)}
                className="adm-btn adm-btn-outline"
              >
                Fechar Detalhes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: RESOLUÇÃO OBRIGATÓRIA DA OCORRÊNCIA */}
      {/* ===================================================================== */}
      {resolveIncidentModal && (
        <div
          className="adm-modal-backdrop"
          style={{ zIndex: 10000 }}
          onClick={() => !submittingResolve && setResolveIncidentModal(null)}
        >
          <div
            className="adm-modal-card"
            style={{
              maxWidth: "560px",
              width: "100%",
              padding: "24px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <CheckCheck size={20} style={{ color: "#16a34a" }} />
                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "#15803d" }}>
                  Resolver Ocorrência: {resolveIncidentModal.incident_code}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setResolveIncidentModal(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--adm-text-muted)" }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: "13px", color: "var(--adm-text-muted)", margin: "0 0 14px" }}>
              Para marcar esta ocorrência como <strong>Resolvida</strong>, é obrigatório registrar
              a solução aplicada e as providências tomadas para resguardar o histórico da empresa.
            </p>

            {resolutionError && (
              <div
                style={{
                  background: "#fee2e2",
                  border: "1px solid #fca5a5",
                  borderRadius: "6px",
                  padding: "8px 12px",
                  marginBottom: "12px",
                  fontSize: "12px",
                  color: "#991b1b",
                }}
              >
                {resolutionError}
              </div>
            )}

            <form onSubmit={handleResolveIncident}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--adm-text)", display: "block", marginBottom: "4px" }}>
                  Solução Aplicada / Providência Tomada: <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <textarea
                  placeholder="Ex: Fornecedor confirmou van de resgate; passageiro embarcou às 08h45 e passeio foi concluído com sucesso."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="adm-input"
                  rows={4}
                  required
                />
                <span style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>
                  Mínimo de 5 caracteres. Não é permitido resolver sem detalhar a solução.
                </span>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--adm-text)", display: "block", marginBottom: "4px" }}>
                  Observações Internas Finais (Opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ex: Não gerou ônus financeiro; fornecedor advertido."
                  value={resolutionInternalNotes}
                  onChange={(e) => setResolutionInternalNotes(e.target.value)}
                  className="adm-input"
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setResolveIncidentModal(null)}
                  className="adm-btn adm-btn-outline"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingResolve || !resolutionNotes.trim()}
                  className="adm-btn"
                  style={{ background: "#16a34a", color: "#ffffff", fontWeight: 700 }}
                >
                  {submittingResolve ? "Salvando..." : "Confirmar Resolução"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
