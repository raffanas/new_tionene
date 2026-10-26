"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuthProfile } from "@/lib/auth/AuthContext";
import {
  DailyServiceItem,
  DailyOperationsKpis,
  OperationalPendencyItem,
  DailyOperationsFilters,
  DailyOperationalServiceType,
  DatePreset,
  buildDailyOperationalServices,
  calculateDailyKpis,
  detectDailyPendencies,
  filterDailyServices,
  separateTimeServices,
  formatDateLabel,
  toIsoDate,
} from "@/lib/operational/dailyOperations";
import {
  CalendarClock,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  CalendarDays,
  Users,
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
  Compass,
  Ticket,
  Wallet,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  CheckSquare,
  FileText,
  SlidersHorizontal,
} from "lucide-react";

export default function AdminOperacoesPage() {
  const { role, profile } = useAuthProfile();
  const isAdmin = role === "admin";

  // Data de referência (Hoje)
  const todayStr = useMemo(() => toIsoDate(new Date()), []);

  // Estados Principais de Dados
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>("");
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(0); // 0 = off, 60 = 1min, 300 = 5min

  // Dados Brutos Consolidados
  const [allServices, setAllServices] = useState<DailyServiceItem[]>([]);
  const [suppliersList, setSuppliersList] = useState<Array<{ id: string; name: string }>>([]);
  const [walletsList, setWalletsList] = useState<any[]>([]);
  const [incidentsList, setIncidentsList] = useState<any[]>([]);
  const [tasksList, setTasksList] = useState<any[]>([]);

  // Filtros
  const [datePreset, setDatePreset] = useState<DatePreset>("today");
  const [startDate, setStartDate] = useState<string>(todayStr);
  const [endDate, setEndDate] = useState<string>(todayStr);
  const [serviceTypeFilter, setServiceTypeFilter] = useState<"todos" | DailyOperationalServiceType>("todos");
  const [supplierFilter, setSupplierFilter] = useState<string>("todos");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [pendencyFilter, setPendencyFilter] = useState<"todos" | "com_pendencias" | "sem_pendencias">("todos");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Aba Ativa: "agenda" | "pendencias" | "criticas"
  const [activeTab, setActiveTab] = useState<"agenda" | "pendencias" | "criticas">("agenda");
  const [pendencyPriorityFilter, setPendencyPriorityFilter] = useState<string>("todas");

  // Modal de Detalhes Rápidos
  const [detailModalService, setDetailModalService] = useState<DailyServiceItem | null>(null);
  const [copiedContract, setCopiedContract] = useState<string | null>(null);

  // Copiar código com feedback visual
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedContract(text);
    setTimeout(() => setCopiedContract(null), 2500);
  };

  // Carregar dados operacionais em tempo real (SEM dados financeiros)
  const fetchOperationsData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      // 1. Carregar Fornecedores (apenas nomes e contatos operacionais)
      const { data: supps } = await supabase
        .from("suppliers")
        .select("id, name, phone, whatsapp, email");

      const uniqueSupps: Array<{ id: string; name: string }> = [];
      (supps || []).forEach((s: any) => {
        if (s.name) uniqueSupps.push({ id: s.id, name: s.name });
      });
      setSuppliersList(uniqueSupps);

      // 2. Carregar Reservas Operacionais (Passeios e Traslados) com join em contratos e fornecedores
      // ATENÇÃO: NENHUM campo de custo, valor, comissão ou financeiro é consultado!
      const { data: reservationsData, error: resError } = await supabase
        .from("operational_reservations")
        .select(`
          id,
          contract_id,
          contract_item_id,
          client_id,
          client_name,
          supplier_id,
          supplier_name,
          product_name,
          tour_id_code,
          tour_date,
          pickup_time,
          pickup_location,
          hotel_zone,
          adults_count,
          children_count,
          infants_count,
          supplier_confirmation_code,
          voucher_ref,
          status,
          special_instructions,
          notes,
          history,
          created_at,
          updated_at,
          contracts (
            id,
            contract_number,
            client_id,
            client_name,
            client_phone,
            client_email,
            status,
            hotel_name,
            hotel_zone,
            arrival_date,
            departure_date,
            hotels_schedule
          ),
          suppliers (
            id,
            name,
            phone,
            whatsapp,
            email
          )
        `)
        .order("tour_date", { ascending: true });

      if (resError) {
        console.warn("Aviso ao carregar reservas operacionais:", resError.message);
      }

      // 3. Carregar Chegadas (arrivals)
      const { data: arrivalsData, error: arrError } = await supabase
        .from("arrivals")
        .select(`
          id,
          contract_id,
          client_id,
          client_name,
          client_phone,
          client_email,
          arrival_date,
          departure_date,
          arrival_flight_number,
          arrival_flight_time,
          depart_flight_number,
          depart_flight_time,
          adults_count,
          children_count,
          infants_count,
          hotel_name,
          hotel_zone,
          status,
          assigned_agent,
          notes,
          created_at,
          updated_at,
          contracts (
            id,
            contract_number,
            status,
            hotel_name,
            hotel_zone,
            hotels_schedule
          )
        `)
        .order("arrival_date", { ascending: true });

      if (arrError) {
        console.warn("Aviso ao carregar chegadas:", arrError.message);
      }

      // 4. Carregar Carteiras de Viagem (travel_wallets)
      let wallets: any[] = [];
      try {
        const { data: wData } = await supabase
          .from("travel_wallets")
          .select("id, contract_id, status, last_operational_snapshot, version, delivered_version, last_delivered_at, last_delivered_by_name, updated_at");
        if (wData) wallets = wData;
      } catch {
        wallets = [];
      }
      setWalletsList(wallets);

      // 5. Carregar Ocorrências Operacionais (operational_incidents)
      let incidents: any[] = [];
      try {
        const { data: incData } = await supabase
          .from("operational_incidents")
          .select("id, incident_code, contract_id, contract_number, client_id, client_name, reservation_id, arrival_id, supplier_id, supplier_name, service_name, service_date, incident_type, title, description, priority, status, assigned_to_name, opened_at, resolved_at");
        if (incData) incidents = incData;
      } catch {
        incidents = [];
      }
      setIncidentsList(incidents);

      // 5.1 Carregar Tarefas Internas (internal_tasks)
      let tasks: any[] = [];
      try {
        const { data: taskData } = await supabase
          .from("internal_tasks")
          .select("id, task_code, title, priority, status, due_date, assigned_to_name");
        if (taskData) tasks = taskData;
      } catch {
        tasks = [];
      }
      setTasksList(tasks);

      // 6. Construir lista normalizada de serviços operacionais
      const builtServices = buildDailyOperationalServices({
        reservations: reservationsData || [],
        arrivals: arrivalsData || [],
        refDateStr: todayStr,
      });

      setAllServices(builtServices);
      setLastUpdatedAt(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch (err) {
      console.error("Erro geral ao carregar operações:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [todayStr]);

  // Carga Inicial
  useEffect(() => {
    fetchOperationsData();
  }, [fetchOperationsData]);

  // Atualização Periódica Automática Opcional (se ativada pelo operador)
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;
    const timer = setInterval(() => {
      fetchOperationsData();
    }, autoRefreshInterval * 1000);
    return () => clearInterval(timer);
  }, [autoRefreshInterval, fetchOperationsData]);

  // Manipular Presets de Data
  const handleDatePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    const today = new Date();
    const tStr = toIsoDate(today);

    if (preset === "today") {
      setStartDate(tStr);
      setEndDate(tStr);
    } else if (preset === "tomorrow") {
      const tom = new Date(today);
      tom.setDate(tom.getDate() + 1);
      const tomStr = toIsoDate(tom);
      setStartDate(tomStr);
      setEndDate(tomStr);
    } else if (preset === "next7") {
      const end = new Date(today);
      end.setDate(end.getDate() + 6);
      setStartDate(tStr);
      setEndDate(toIsoDate(end));
    }
  };

  // Calcular Indicadores do Resumo do Dia (KPIs reais, sem inventar números)
  const kpis: DailyOperationsKpis = useMemo(() => {
    return calculateDailyKpis({
      allServices,
      wallets: walletsList,
      incidents: incidentsList,
      tasks: tasksList,
      refDateStr: todayStr,
    });
  }, [allServices, walletsList, incidentsList, tasksList, todayStr]);

  // Filtrar Serviços de Acordo com Filtros Ativos
  const currentFilters: DailyOperationsFilters = useMemo(() => {
    return {
      datePreset,
      startDate,
      endDate,
      serviceType: serviceTypeFilter,
      supplierId: supplierFilter,
      operationalStatus: statusFilter,
      pendencyFilter,
      searchTerm,
    };
  }, [datePreset, startDate, endDate, serviceTypeFilter, supplierFilter, statusFilter, pendencyFilter, searchTerm]);

  const filteredServices = useMemo(() => {
    return filterDailyServices(allServices, currentFilters);
  }, [allServices, currentFilters]);

  // Separar Serviços Com Horário Confirmado vs Aguardando Horário
  const { withConfirmedTime, withoutConfirmedTime } = useMemo(() => {
    return separateTimeServices(filteredServices);
  }, [filteredServices]);

  // Central de Pendências
  const allPendencies = useMemo(() => {
    return detectDailyPendencies({
      allServices,
      wallets: walletsList,
      incidents: incidentsList,
      refDateStr: todayStr,
    });
  }, [allServices, walletsList, incidentsList, todayStr]);

  // Pendências Filtradas pela Aba ou Prioridade
  const filteredPendencies = useMemo(() => {
    if (pendencyPriorityFilter === "todas") return allPendencies;
    return allPendencies.filter((p) => p.priority === pendencyPriorityFilter);
  }, [allPendencies, pendencyPriorityFilter]);

  // Situações Críticas (Urgentes)
  const criticalServices = useMemo(() => {
    return allServices.filter((s) => s.isCritical && !s.isCancelled);
  }, [allServices]);

  // Ocorrências Críticas Ativas
  const criticalIncidents = useMemo(() => {
    return incidentsList.filter(
      (inc) =>
        inc.priority === "critica" &&
        inc.status !== "resolvida" &&
        inc.status !== "cancelada"
    );
  }, [incidentsList]);

  // Resetar Filtros
  const handleResetFilters = () => {
    setDatePreset("today");
    setStartDate(todayStr);
    setEndDate(todayStr);
    setServiceTypeFilter("todos");
    setSupplierFilter("todos");
    setStatusFilter("todos");
    setPendencyFilter("todos");
    setSearchTerm("");
  };

  return (
    <div className="adm-page-container" style={{ paddingBottom: "80px" }}>
      {/* ===================================================================== */}
      {/* CABEÇALHO DO PAINEL */}
      {/* ===================================================================== */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "24px",
          borderBottom: "1px solid var(--adm-border)",
          paddingBottom: "18px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                background: "rgba(212, 175, 55, 0.15)",
                color: "var(--adm-gold)",
                border: "1px solid rgba(212, 175, 55, 0.35)",
                padding: "3px 10px",
                borderRadius: "99px",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              <CalendarClock size={13} />
              Central de Trabalho Operacional
            </span>
            <span
              className="status-dot-pulse"
              style={{ width: "8px", height: "8px", background: "#10b981" }}
              title="Supabase Live Conectado"
            />
          </div>
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "26px",
              fontWeight: 800,
              color: "var(--adm-wine)",
              margin: 0,
            }}
          >
            Painel de Operações Diárias
          </h1>
          <p
            style={{
              fontSize: "13px",
              color: "var(--adm-text-muted)",
              marginTop: "4px",
              marginBottom: 0,
              maxWidth: "680px",
            }}
          >
            Central de controle em tempo real da equipe operacional: acompanhamento de chegadas,
            traslados, passeios, confirmações de fornecedores, vouchers e carteiras de viagem.
          </p>
        </div>

        {/* Atualização e Controles de Sincronismo */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          {lastUpdatedAt && (
            <div
              style={{
                fontSize: "11px",
                color: "var(--adm-text-muted)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "var(--adm-card-bg)",
                border: "1px solid var(--adm-border)",
                padding: "6px 12px",
                borderRadius: "8px",
              }}
            >
              <Clock size={13} style={{ color: "var(--adm-gold)" }} />
              <span>
                Última atualização: <strong>{lastUpdatedAt}</strong>
              </span>
            </div>
          )}

          {/* Seletor de Auto-Refresh */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <label style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>Auto-Sync:</label>
            <select
              value={autoRefreshInterval}
              onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
              className="adm-select"
              style={{ fontSize: "11px", padding: "4px 8px", width: "auto" }}
            >
              <option value={0}>Manual</option>
              <option value={60}>A cada 1 min</option>
              <option value={180}>A cada 3 min</option>
              <option value={300}>A cada 5 min</option>
            </select>
          </div>

          {/* Atalho para Central de Tarefas */}
          <Link
            href="/admin/tarefas"
            className="adm-btn adm-btn-outline adm-btn-sm"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            title="Acessar Central de Tarefas da Equipe"
          >
            <CheckSquare size={14} style={{ color: "var(--adm-gold)" }} />
            <span>Tarefas</span>
            {kpis.tarefasVencidas > 0 && (
              <span
                style={{
                  background: "#ef4444",
                  color: "#ffffff",
                  fontSize: "10px",
                  fontWeight: 800,
                  borderRadius: "10px",
                  padding: "1px 6px",
                }}
              >
                {kpis.tarefasVencidas}
              </span>
            )}
          </Link>

          {/* Botão de Atualização Manual */}
          <button
            type="button"
            onClick={() => fetchOperationsData(true)}
            disabled={loading || refreshing}
            className="adm-btn adm-btn-outline adm-btn-sm"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            title="Sincronizar dados operacionais do Supabase agora"
          >
            <RefreshCw size={14} className={refreshing ? "spin-icon" : ""} />
            <span>{refreshing ? "Sincronizando..." : "Atualizar"}</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SITUAÇÕES CRÍTICAS URGENTES (SE HOUVER) */}
      {/* ===================================================================== */}
      {/* ===================================================================== */}
      {/* SITUAÇÕES CRÍTICAS URGENTES (SE HOUVER) */}
      {/* ===================================================================== */}
      {(criticalServices.length > 0 || criticalIncidents.length > 0) && (
        <div
          style={{
            background: "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)",
            border: "1px solid #fecdd3",
            borderRadius: "12px",
            padding: "14px 18px",
            marginBottom: "24px",
            boxShadow: "0 2px 8px rgba(225, 29, 72, 0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span
                style={{
                  background: "#be123c",
                  color: "#ffffff",
                  padding: "4px",
                  borderRadius: "8px",
                  display: "flex",
                }}
              >
                <AlertTriangle size={18} />
              </span>
              <div>
                <strong style={{ fontSize: "14px", color: "#9f1239" }}>
                  Atenção: {criticalServices.length + criticalIncidents.length} situação(ões) crítica(s) identificada(s)
                  {criticalIncidents.length > 0 && ` (${criticalIncidents.length} ocorrência(s) crítica(s) aberta(s))`}
                </strong>
                <p style={{ fontSize: "12px", color: "#be123c", margin: 0 }}>
                  Serviços iminentes sem confirmação, atrasos ou ocorrências graves que exigem tratativa imediata.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {criticalIncidents.length > 0 && (
                <Link
                  href="/admin/ocorrencias?priority=critica"
                  className="adm-btn adm-btn-sm"
                  style={{
                    background: "#881337",
                    color: "#ffffff",
                    textDecoration: "none",
                    fontSize: "12px",
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <ShieldAlert size={13} />
                  <span>Ver Ocorrências Críticas ({criticalIncidents.length})</span>
                </Link>
              )}

              <button
                type="button"
                onClick={() => {
                  setActiveTab("criticas");
                  setDatePreset("today");
                  setStartDate(todayStr);
                  setEndDate(todayStr);
                }}
                className="adm-btn adm-btn-sm"
                style={{
                  background: "#be123c",
                  color: "#ffffff",
                  border: "none",
                  fontSize: "12px",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>Ver Situações Críticas</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. RESUMO DO DIA (INDICADORES OPERACIONAIS REAIS) */}
      {/* ===================================================================== */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "14px",
          marginBottom: "24px",
        }}
      >
        {/* 1. Chegadas Previstas */}
        <div
          className="adm-card"
          style={{
            padding: "14px",
            borderLeft: "4px solid #38bdf8",
            cursor: "pointer",
            transition: "transform 0.15s ease",
          }}
          onClick={() => {
            setActiveTab("agenda");
            setDatePreset("today");
            setServiceTypeFilter("chegada");
          }}
          title="Ver chegadas de hoje"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--adm-text-muted)", textTransform: "uppercase" }}>
              Chegadas Hoje
            </span>
            <Plane size={16} style={{ color: "#0284c7" }} />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--adm-text)", marginTop: "6px" }}>
            {kpis.chegadasPrevistas}
          </div>
          <span style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>
            Aeroporto de Cancún
          </span>
        </div>

        {/* 2. Traslados Programados */}
        <div
          className="adm-card"
          style={{
            padding: "14px",
            borderLeft: "4px solid #818cf8",
            cursor: "pointer",
            transition: "transform 0.15s ease",
          }}
          onClick={() => {
            setActiveTab("agenda");
            setDatePreset("today");
            setServiceTypeFilter("traslado");
          }}
          title="Ver traslados de hoje"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--adm-text-muted)", textTransform: "uppercase" }}>
              Traslados Hoje
            </span>
            <Car size={16} style={{ color: "#4f46e5" }} />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--adm-text)", marginTop: "6px" }}>
            {kpis.trasladosProgramados}
          </div>
          <span style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>
            Transfers in / out ativos
          </span>
        </div>

        {/* 3. Passeios Programados */}
        <div
          className="adm-card"
          style={{
            padding: "14px",
            borderLeft: "4px solid #34d399",
            cursor: "pointer",
            transition: "transform 0.15s ease",
          }}
          onClick={() => {
            setActiveTab("agenda");
            setDatePreset("today");
            setServiceTypeFilter("passeio");
          }}
          title="Ver passeios de hoje"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--adm-text-muted)", textTransform: "uppercase" }}>
              Passeios Hoje
            </span>
            <Compass size={16} style={{ color: "#059669" }} />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--adm-text)", marginTop: "6px" }}>
            {kpis.passeiosProgramados}
          </div>
          <span style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>
            Atrações e tours ativos
          </span>
        </div>

        {/* 4. Reservas Aguardando Confirmação */}
        <div
          className="adm-card"
          style={{
            padding: "14px",
            borderLeft: `4px solid ${kpis.reservasAguardandoConfirmacao > 0 ? "#f59e0b" : "#cbd5e1"}`,
            background: kpis.reservasAguardandoConfirmacao > 0 ? "rgba(245, 158, 11, 0.05)" : "var(--adm-card-bg)",
            cursor: "pointer",
          }}
          onClick={() => {
            setActiveTab("pendencias");
            setPendencyPriorityFilter("todas");
          }}
          title="Ver reservas aguardando fornecedor"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: kpis.reservasAguardandoConfirmacao > 0 ? "#b45309" : "var(--adm-text-muted)", textTransform: "uppercase" }}>
              Aguardando Fornecedor
            </span>
            <Clock size={16} style={{ color: kpis.reservasAguardandoConfirmacao > 0 ? "#d97706" : "#94a3b8" }} />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: kpis.reservasAguardandoConfirmacao > 0 ? "#b45309" : "var(--adm-text)", marginTop: "6px" }}>
            {kpis.reservasAguardandoConfirmacao}
          </div>
          <span style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>
            Sem confirmação formal
          </span>
        </div>

        {/* 5. Pickups Pendentes */}
        <div
          className="adm-card"
          style={{
            padding: "14px",
            borderLeft: `4px solid ${kpis.pickupsPendentes > 0 ? "#f97316" : "#cbd5e1"}`,
            background: kpis.pickupsPendentes > 0 ? "rgba(249, 115, 22, 0.05)" : "var(--adm-card-bg)",
            cursor: "pointer",
          }}
          onClick={() => {
            setActiveTab("agenda");
            setDatePreset("today");
            setPendencyFilter("com_pendencias");
          }}
          title="Ver serviços de hoje sem pickup"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: kpis.pickupsPendentes > 0 ? "#c2410c" : "var(--adm-text-muted)", textTransform: "uppercase" }}>
              Pickups Pendentes
            </span>
            <AlertTriangle size={16} style={{ color: kpis.pickupsPendentes > 0 ? "#ea580c" : "#94a3b8" }} />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: kpis.pickupsPendentes > 0 ? "#c2410c" : "var(--adm-text)", marginTop: "6px" }}>
            {kpis.pickupsPendentes}
          </div>
          <span style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>
            Sem horário confirmado hoje
          </span>
        </div>

        {/* 6. Vouchers Pendentes */}
        <div
          className="adm-card"
          style={{
            padding: "14px",
            borderLeft: `4px solid ${kpis.vouchersPendentes > 0 ? "#eab308" : "#cbd5e1"}`,
            background: kpis.vouchersPendentes > 0 ? "rgba(234, 179, 8, 0.05)" : "var(--adm-card-bg)",
            cursor: "pointer",
          }}
          onClick={() => {
            setActiveTab("pendencias");
            setPendencyPriorityFilter("todas");
          }}
          title="Ver vouchers pendentes"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: kpis.vouchersPendentes > 0 ? "#a16207" : "var(--adm-text-muted)", textTransform: "uppercase" }}>
              Vouchers Pendentes
            </span>
            <Ticket size={16} style={{ color: kpis.vouchersPendentes > 0 ? "#ca8a04" : "#94a3b8" }} />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: kpis.vouchersPendentes > 0 ? "#a16207" : "var(--adm-text)", marginTop: "6px" }}>
            {kpis.vouchersPendentes}
          </div>
          <span style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>
            Aguardando preparação
          </span>
        </div>

        {/* 7. Carteiras Necessitam Atualização */}
        <div
          className="adm-card"
          style={{
            padding: "14px",
            borderLeft: `4px solid ${kpis.carteirasNecessitamAtualizacao > 0 ? "#be123c" : "#cbd5e1"}`,
            background: kpis.carteirasNecessitamAtualizacao > 0 ? "rgba(190, 18, 60, 0.05)" : "var(--adm-card-bg)",
            cursor: "pointer",
          }}
          onClick={() => {
            setActiveTab("pendencias");
            setPendencyPriorityFilter("todas");
          }}
          title="Ver carteiras desatualizadas"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: kpis.carteirasNecessitamAtualizacao > 0 ? "#be123c" : "var(--adm-text-muted)", textTransform: "uppercase" }}>
              Carteiras Desatualizadas
            </span>
            <Wallet size={16} style={{ color: kpis.carteirasNecessitamAtualizacao > 0 ? "#be123c" : "#94a3b8" }} />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: kpis.carteirasNecessitamAtualizacao > 0 ? "#be123c" : "var(--adm-text)", marginTop: "6px" }}>
            {kpis.carteirasNecessitamAtualizacao}
          </div>
          <span style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>
            Alteradas pós-entrega
          </span>
        </div>

        {/* 8. Ocorrências em Aberto */}
        <Link
          href="/admin/ocorrencias"
          className="adm-card"
          style={{
            padding: "14px",
            borderLeft: `4px solid ${kpis.ocorrenciasAbertas > 0 ? "#ef4444" : "#cbd5e1"}`,
            background: kpis.ocorrenciasAbertas > 0 ? "rgba(239, 68, 68, 0.06)" : "var(--adm-card-bg)",
            cursor: "pointer",
            textDecoration: "none",
            display: "block",
          }}
          title="Acessar Central de Ocorrências Operacionais"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: kpis.ocorrenciasAbertas > 0 ? "#dc2626" : "var(--adm-text-muted)", textTransform: "uppercase" }}>
              Ocorrências Abertas
            </span>
            <AlertCircle size={16} style={{ color: kpis.ocorrenciasAbertas > 0 ? "#dc2626" : "#94a3b8" }} />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: kpis.ocorrenciasAbertas > 0 ? "#dc2626" : "var(--adm-text)", marginTop: "6px" }}>
            {kpis.ocorrenciasAbertas}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2px" }}>
            <span style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>
              {kpis.ocorrenciasAbertas > 0 ? "Acessar Central" : "Nenhuma ativa"}
            </span>
            <ChevronRight size={13} style={{ color: kpis.ocorrenciasAbertas > 0 ? "#dc2626" : "var(--adm-text-muted)" }} />
          </div>
        </Link>

        {/* 9. Tarefas Vencidas */}
        <Link
          href="/admin/tarefas?view=vencidas"
          className="adm-card"
          style={{
            padding: "14px",
            borderLeft: `4px solid ${kpis.tarefasVencidas > 0 ? "#dc2626" : "#cbd5e1"}`,
            background: kpis.tarefasVencidas > 0 ? "rgba(220, 38, 38, 0.06)" : "var(--adm-card-bg)",
            cursor: "pointer",
            textDecoration: "none",
            display: "block",
          }}
          title="Ver tarefas internas vencidas"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: kpis.tarefasVencidas > 0 ? "#b91c1c" : "var(--adm-text-muted)", textTransform: "uppercase" }}>
              Tarefas Vencidas
            </span>
            <Clock size={16} style={{ color: kpis.tarefasVencidas > 0 ? "#dc2626" : "#94a3b8" }} />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: kpis.tarefasVencidas > 0 ? "#dc2626" : "var(--adm-text)", marginTop: "6px" }}>
            {kpis.tarefasVencidas}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2px" }}>
            <span style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>
              {kpis.tarefasVencidas > 0 ? "Atraso no prazo" : "Todas em dia"}
            </span>
            <ChevronRight size={13} style={{ color: kpis.tarefasVencidas > 0 ? "#dc2626" : "var(--adm-text-muted)" }} />
          </div>
        </Link>

        {/* 10. Tarefas Críticas Pendentes */}
        <Link
          href="/admin/tarefas?priority=critica"
          className="adm-card"
          style={{
            padding: "14px",
            borderLeft: `4px solid ${kpis.tarefasCriticasPendentes > 0 ? "#ea580c" : "#cbd5e1"}`,
            background: kpis.tarefasCriticasPendentes > 0 ? "rgba(234, 88, 12, 0.06)" : "var(--adm-card-bg)",
            cursor: "pointer",
            textDecoration: "none",
            display: "block",
          }}
          title="Ver tarefas internas de prioridade crítica"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: kpis.tarefasCriticasPendentes > 0 ? "#c2410c" : "var(--adm-text-muted)", textTransform: "uppercase" }}>
              Tarefas Críticas
            </span>
            <CheckSquare size={16} style={{ color: kpis.tarefasCriticasPendentes > 0 ? "#ea580c" : "#94a3b8" }} />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: kpis.tarefasCriticasPendentes > 0 ? "#ea580c" : "var(--adm-text)", marginTop: "6px" }}>
            {kpis.tarefasCriticasPendentes}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2px" }}>
            <span style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>
              {kpis.tarefasCriticasPendentes > 0 ? "Ação prioritária" : "Nenhuma pendente"}
            </span>
            <ChevronRight size={13} style={{ color: kpis.tarefasCriticasPendentes > 0 ? "#ea580c" : "var(--adm-text-muted)" }} />
          </div>
        </Link>
      </div>

      {/* ===================================================================== */}
      {/* 6. BARRA DE FILTROS E BUSCA COMBINADA */}
      {/* ===================================================================== */}
      <div className="adm-card" style={{ padding: "16px", marginBottom: "24px" }}>
        {/* Linha 1: Presets de Data e Período */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--adm-text)", display: "flex", alignItems: "center", gap: "5px" }}>
              <Calendar size={14} style={{ color: "var(--adm-gold)" }} />
              Período:
            </span>
            <div style={{ display: "inline-flex", background: "var(--adm-bg)", borderRadius: "8px", padding: "3px", border: "1px solid var(--adm-border)" }}>
              <button
                type="button"
                onClick={() => handleDatePresetChange("today")}
                style={{
                  background: datePreset === "today" ? "var(--adm-wine)" : "transparent",
                  color: datePreset === "today" ? "#ffffff" : "var(--adm-text)",
                  border: "none",
                  borderRadius: "6px",
                  padding: "5px 12px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={() => handleDatePresetChange("tomorrow")}
                style={{
                  background: datePreset === "tomorrow" ? "var(--adm-wine)" : "transparent",
                  color: datePreset === "tomorrow" ? "#ffffff" : "var(--adm-text)",
                  border: "none",
                  borderRadius: "6px",
                  padding: "5px 12px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Amanhã
              </button>
              <button
                type="button"
                onClick={() => handleDatePresetChange("next7")}
                style={{
                  background: datePreset === "next7" ? "var(--adm-wine)" : "transparent",
                  color: datePreset === "next7" ? "#ffffff" : "var(--adm-text)",
                  border: "none",
                  borderRadius: "6px",
                  padding: "5px 12px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Próximos 7 dias
              </button>
              <button
                type="button"
                onClick={() => setDatePreset("custom")}
                style={{
                  background: datePreset === "custom" ? "var(--adm-wine)" : "transparent",
                  color: datePreset === "custom" ? "#ffffff" : "var(--adm-text)",
                  border: "none",
                  borderRadius: "6px",
                  padding: "5px 12px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Personalizado
              </button>
            </div>
          </div>

          {/* Seletor de Datas Personalizadas */}
          {datePreset === "custom" && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <label style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>De:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="adm-input"
                  style={{ fontSize: "12px", padding: "4px 8px", width: "auto" }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <label style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>Até:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="adm-input"
                  style={{ fontSize: "12px", padding: "4px 8px", width: "auto" }}
                />
              </div>
            </div>
          )}

          {/* Rótulo de Intervalo Ativo */}
          <div style={{ fontSize: "12px", color: "var(--adm-wine)", fontWeight: 700 }}>
            {startDate === endDate
              ? formatDateLabel(startDate)
              : `${formatDateLabel(startDate)} até ${formatDateLabel(endDate)}`}
          </div>
        </div>

        {/* Linha 2: Filtros Combinados e Campo de Busca */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "10px",
            alignItems: "center",
          }}
        >
          {/* Busca Textual */}
          <div style={{ position: "relative", gridColumn: "span 2" }}>
            <Search
              size={15}
              style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--adm-text-muted)" }}
            />
            <input
              type="text"
              placeholder="Buscar cliente, contrato, hotel, passeio ou fornecedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="adm-input"
              style={{ paddingLeft: "32px", fontSize: "12px" }}
            />
          </div>

          {/* Tipo de Serviço */}
          <div>
            <select
              value={serviceTypeFilter}
              onChange={(e) => setServiceTypeFilter(e.target.value as any)}
              className="adm-select"
              style={{ fontSize: "12px" }}
            >
              <option value="todos">Todos os Serviços</option>
              <option value="passeio">Apenas Passeios</option>
              <option value="traslado">Apenas Traslados</option>
              <option value="chegada">Apenas Chegadas</option>
            </select>
          </div>

          {/* Fornecedor */}
          <div>
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

          {/* Status Operacional */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="adm-select"
              style={{ fontSize: "12px" }}
            >
              <option value="todos">Todos os Status</option>
              <option value="confirmada">Confirmada</option>
              <option value="pendente">Pendente de Solicitação</option>
              <option value="solicitada">Solicitação Enviada</option>
              <option value="aguardando_fornecedor">Aguardando Fornecedor</option>
              <option value="realizada">Realizada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>

          {/* Filtro de Pendências */}
          <div>
            <select
              value={pendencyFilter}
              onChange={(e) => setPendencyFilter(e.target.value as any)}
              className="adm-select"
              style={{ fontSize: "12px" }}
            >
              <option value="todos">Todas as Situações</option>
              <option value="com_pendencias">Apenas com Pendências</option>
              <option value="sem_pendencias">Apenas 100% Confirmados</option>
            </select>
          </div>

          {/* Botão Limpar Filtros */}
          <div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="adm-btn adm-btn-outline"
              style={{ width: "100%", fontSize: "12px", padding: "8px" }}
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* ABAS DO PAINEL OPERACIONAL */}
      {/* ===================================================================== */}
      <div
        style={{
          display: "flex",
          borderBottom: "2px solid var(--adm-border)",
          marginBottom: "20px",
          gap: "8px",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("agenda")}
          style={{
            background: "transparent",
            border: "none",
            borderBottom: activeTab === "agenda" ? "3px solid var(--adm-wine)" : "3px solid transparent",
            padding: "10px 18px",
            fontSize: "13px",
            fontWeight: 700,
            color: activeTab === "agenda" ? "var(--adm-wine)" : "var(--adm-text-muted)",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <CalendarDays size={16} />
          <span>Agenda Operacional</span>
          <span
            style={{
              background: activeTab === "agenda" ? "var(--adm-wine)" : "var(--adm-bg)",
              color: activeTab === "agenda" ? "#ffffff" : "var(--adm-text)",
              fontSize: "11px",
              padding: "1px 7px",
              borderRadius: "99px",
              fontWeight: 800,
            }}
          >
            {filteredServices.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("pendencias")}
          style={{
            background: "transparent",
            border: "none",
            borderBottom: activeTab === "pendencias" ? "3px solid var(--adm-wine)" : "3px solid transparent",
            padding: "10px 18px",
            fontSize: "13px",
            fontWeight: 700,
            color: activeTab === "pendencias" ? "var(--adm-wine)" : "var(--adm-text-muted)",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <AlertTriangle size={16} style={{ color: allPendencies.length > 0 ? "#d97706" : "inherit" }} />
          <span>Central de Pendências</span>
          <span
            style={{
              background: allPendencies.length > 0 ? "#fef3c7" : "var(--adm-bg)",
              color: allPendencies.length > 0 ? "#b45309" : "var(--adm-text)",
              fontSize: "11px",
              padding: "1px 7px",
              borderRadius: "99px",
              fontWeight: 800,
            }}
          >
            {allPendencies.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("criticas")}
          style={{
            background: "transparent",
            border: "none",
            borderBottom: activeTab === "criticas" ? "3px solid #be123c" : "3px solid transparent",
            padding: "10px 18px",
            fontSize: "13px",
            fontWeight: 700,
            color: activeTab === "criticas" ? "#be123c" : "var(--adm-text-muted)",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <AlertCircle size={16} style={{ color: "#be123c" }} />
          <span>Situações Críticas</span>
          <span
            style={{
              background: criticalServices.length > 0 ? "#fee2e2" : "var(--adm-bg)",
              color: criticalServices.length > 0 ? "#b91c1c" : "var(--adm-text)",
              fontSize: "11px",
              padding: "1px 7px",
              borderRadius: "99px",
              fontWeight: 800,
            }}
          >
            {criticalServices.length}
          </span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* ABA 1: AGENDA OPERACIONAL CRONOLÓGICA */}
      {/* ===================================================================== */}
      {activeTab === "agenda" && (
        <div>
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <span className="status-dot-pulse" style={{ width: "16px", height: "16px" }} />
              <p style={{ marginTop: "12px", color: "var(--adm-text-muted)", fontSize: "14px" }}>
                Carregando agenda operacional em tempo real...
              </p>
            </div>
          ) : filteredServices.length === 0 ? (
            <div
              className="adm-card"
              style={{
                textAlign: "center",
                padding: "60px 20px",
                border: "2px dashed var(--adm-border)",
              }}
            >
              <CalendarClock size={36} style={{ color: "var(--adm-text-muted)", margin: "0 auto 12px" }} />
              <h3 style={{ fontSize: "16px", color: "var(--adm-text)", margin: "0 0 6px" }}>
                Nenhum serviço programado para os filtros selecionados
              </h3>
              <p style={{ fontSize: "13px", color: "var(--adm-text-muted)", margin: "0 0 16px" }}>
                Não há passeios, traslados ou chegadas cadastrados para esta data ou combinação de filtros.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="adm-btn adm-btn-outline adm-btn-sm"
              >
                Restaurar Filtros Padrão
              </button>
            </div>
          ) : (
            <div>
              {/* SEÇÃO A: SERVIÇOS COM HORÁRIO CONFIRMADO */}
              <div style={{ marginBottom: "32px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "12px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "15px",
                      fontWeight: 700,
                      color: "var(--adm-wine)",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      margin: 0,
                    }}
                  >
                    <Clock size={16} />
                    Agenda com Horário Confirmado ({withConfirmedTime.length})
                  </h3>
                  <span style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                    Ordenação cronológica estrita por horário de embarque / voo
                  </span>
                </div>

                {withConfirmedTime.length === 0 ? (
                  <div
                    style={{
                      padding: "20px",
                      background: "var(--adm-bg)",
                      border: "1px solid var(--adm-border)",
                      borderRadius: "8px",
                      fontSize: "13px",
                      color: "var(--adm-text-muted)",
                      textAlign: "center",
                    }}
                  >
                    Nenhum serviço do período possui horário confirmado ainda. Consulte a seção de horários a confirmar abaixo.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {withConfirmedTime.map((s) => (
                      <ServiceCardRow
                        key={s.id}
                        service={s}
                        onOpenDetail={setDetailModalService}
                        onCopy={handleCopy}
                        copiedContract={copiedContract}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* SEÇÃO B: SERVIÇOS AGUARDANDO DEFINIÇÃO DE HORÁRIO */}
              <div style={{ marginTop: "32px" }}>
                <div
                  style={{
                    background: "rgba(245, 158, 11, 0.08)",
                    border: "1px solid #fde68a",
                    borderRadius: "10px",
                    padding: "14px 18px",
                    marginBottom: "14px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <AlertTriangle size={18} style={{ color: "#d97706", flexShrink: 0 }} />
                    <div>
                      <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#92400e" }}>
                        Serviços Aguardando Definição de Horário ({withoutConfirmedTime.length})
                      </h4>
                      <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#b45309" }}>
                        Estes serviços estão contratados para este período, mas <strong>NÃO</strong> possuem
                        horário de pickup confirmado. Não atribuímos horários fictícios. A equipe deve contatar o
                        fornecedor ou verificar com o hotel para preencher o embarque.
                      </p>
                    </div>
                  </div>
                </div>

                {withoutConfirmedTime.length === 0 ? (
                  <div
                    style={{
                      padding: "16px",
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "#166534",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <CheckCircle2 size={16} />
                    <span>Excelente! Todos os serviços deste período possuem horários de pickup definidos.</span>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {withoutConfirmedTime.map((s) => (
                      <ServiceCardRow
                        key={s.id}
                        service={s}
                        onOpenDetail={setDetailModalService}
                        onCopy={handleCopy}
                        copiedContract={copiedContract}
                        isUnscheduledSection
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* ABA 2: CENTRAL DE PENDÊNCIAS */}
      {/* ===================================================================== */}
      {activeTab === "pendencias" && (
        <div>
          {/* Barra de Filtro de Prioridade */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px",
              marginBottom: "16px",
            }}
          >
            <div>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--adm-text)" }}>
                Classificação por Prioridade Operacional
              </span>
              <p style={{ fontSize: "12px", color: "var(--adm-text-muted)", margin: "2px 0 0" }}>
                A prioridade combina proximidade temporal da execução do serviço e gravidade da intervenção necessária.
              </p>
            </div>

            <div style={{ display: "inline-flex", background: "var(--adm-bg)", borderRadius: "8px", padding: "3px", border: "1px solid var(--adm-border)" }}>
              <button
                type="button"
                onClick={() => setPendencyPriorityFilter("todas")}
                style={{
                  background: pendencyPriorityFilter === "todas" ? "var(--adm-wine)" : "transparent",
                  color: pendencyPriorityFilter === "todas" ? "#ffffff" : "var(--adm-text)",
                  border: "none",
                  borderRadius: "6px",
                  padding: "4px 10px",
                  fontSize: "11px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Todas ({allPendencies.length})
              </button>
              <button
                type="button"
                onClick={() => setPendencyPriorityFilter("critica")}
                style={{
                  background: pendencyPriorityFilter === "critica" ? "#be123c" : "transparent",
                  color: pendencyPriorityFilter === "critica" ? "#ffffff" : "var(--adm-text)",
                  border: "none",
                  borderRadius: "6px",
                  padding: "4px 10px",
                  fontSize: "11px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Crítica ({allPendencies.filter((p) => p.priority === "critica").length})
              </button>
              <button
                type="button"
                onClick={() => setPendencyPriorityFilter("alta")}
                style={{
                  background: pendencyPriorityFilter === "alta" ? "#d97706" : "transparent",
                  color: pendencyPriorityFilter === "alta" ? "#ffffff" : "var(--adm-text)",
                  border: "none",
                  borderRadius: "6px",
                  padding: "4px 10px",
                  fontSize: "11px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Alta ({allPendencies.filter((p) => p.priority === "alta").length})
              </button>
              <button
                type="button"
                onClick={() => setPendencyPriorityFilter("media")}
                style={{
                  background: pendencyPriorityFilter === "media" ? "#4338ca" : "transparent",
                  color: pendencyPriorityFilter === "media" ? "#ffffff" : "var(--adm-text)",
                  border: "none",
                  borderRadius: "6px",
                  padding: "4px 10px",
                  fontSize: "11px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Média ({allPendencies.filter((p) => p.priority === "media").length})
              </button>
              <button
                type="button"
                onClick={() => setPendencyPriorityFilter("baixa")}
                style={{
                  background: pendencyPriorityFilter === "baixa" ? "#64748b" : "transparent",
                  color: pendencyPriorityFilter === "baixa" ? "#ffffff" : "var(--adm-text)",
                  border: "none",
                  borderRadius: "6px",
                  padding: "4px 10px",
                  fontSize: "11px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Baixa ({allPendencies.filter((p) => p.priority === "baixa").length})
              </button>
            </div>
          </div>

          {filteredPendencies.length === 0 ? (
            <div
              className="adm-card"
              style={{
                textAlign: "center",
                padding: "60px 20px",
                border: "2px dashed #86efac",
                background: "#f0fdf4",
              }}
            >
              <CheckCircle2 size={36} style={{ color: "#16a34a", margin: "0 auto 12px" }} />
              <h3 style={{ fontSize: "16px", color: "#15803d", margin: "0 0 6px" }}>
                Nenhuma pendência para o filtro selecionado
              </h3>
              <p style={{ fontSize: "13px", color: "#166534", margin: 0 }}>
                Todas as reservas, vouchers, chegadas e carteiras estão em dia.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {filteredPendencies.map((pend) => (
                <PendencyCardRow key={pend.id} item={pend} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* ABA 3: SITUAÇÕES CRÍTICAS (VISÃO URGÊNCIAS) */}
      {/* ===================================================================== */}
      {activeTab === "criticas" && (
        <div>
          <div
            style={{
              background: "#fff1f2",
              border: "1px solid #fecdd3",
              borderRadius: "10px",
              padding: "16px",
              marginBottom: "16px",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "15px", color: "#9f1239", fontWeight: 700 }}>
              Situações que Exigem Intervenção Imediata
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#be123c" }}>
              Serviços de hoje ou amanhã com risco operacional direto: ausência de confirmação do fornecedor,
              ausência de horário de pickup, chegadas sem número de voo, inconsistências de cancelamento ou carteiras
              entregues que necessitam de atualização antes do embarque.
            </p>
          </div>

          {criticalServices.length === 0 ? (
            <div
              className="adm-card"
              style={{
                textAlign: "center",
                padding: "50px 20px",
                border: "2px dashed #bbf7d0",
                background: "#f0fdf4",
              }}
            >
              <ShieldCheck size={36} style={{ color: "#16a34a", margin: "0 auto 12px" }} />
              <h3 style={{ fontSize: "16px", color: "#15803d", margin: "0 0 6px" }}>
                Nenhuma situação crítica detectada!
              </h3>
              <p style={{ fontSize: "13px", color: "#166534", margin: 0 }}>
                Todos os serviços iminentes de hoje e amanhã estão devidamente confirmados e instruídos.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {criticalServices.map((s) => (
                <ServiceCardRow
                  key={s.id}
                  service={s}
                  onOpenDetail={setDetailModalService}
                  onCopy={handleCopy}
                  copiedContract={copiedContract}
                  forceCriticalHighlight
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* 5. MODAL DE AÇÕES RÁPIDAS E DETALHES OPERACIONAIS */}
      {/* ===================================================================== */}
      {detailModalService && (
        <div
          className="adm-modal-backdrop"
          onClick={() => setDetailModalService(null)}
          style={{ zIndex: 100 }}
        >
          <div
            className="adm-modal"
            style={{ maxWidth: "650px", width: "95%", maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                borderBottom: "1px solid var(--adm-border)",
                paddingBottom: "12px",
                marginBottom: "16px",
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: "var(--adm-gold)",
                    letterSpacing: "0.08em",
                  }}
                >
                  {detailModalService.serviceType.toUpperCase()} OPERACIONAL
                </span>
                <h3
                  style={{
                    margin: "2px 0 0",
                    fontSize: "18px",
                    fontWeight: 800,
                    color: "var(--adm-wine)",
                  }}
                >
                  {detailModalService.title}
                </h3>
              </div>
              <button
                type="button"
                className="adm-btn adm-btn-icon adm-btn-outline"
                onClick={() => setDetailModalService(null)}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Alerta se Crítico */}
              {detailModalService.isCritical && (
                <div
                  style={{
                    background: "#fff1f2",
                    border: "1px solid #fecdd3",
                    padding: "10px 14px",
                    borderRadius: "8px",
                  }}
                >
                  <strong style={{ fontSize: "12px", color: "#be123c", display: "flex", alignItems: "center", gap: "6px" }}>
                    <AlertTriangle size={14} />
                    Situação Crítica que Exige Atenção:
                  </strong>
                  <ul style={{ margin: "4px 0 0 18px", padding: 0, fontSize: "12px", color: "#9f1239" }}>
                    {detailModalService.criticalReasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Grid de Informações Logísticas */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                  background: "var(--adm-bg)",
                  padding: "12px",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              >
                <div>
                  <span style={{ color: "var(--adm-text-muted)", display: "block" }}>Cliente Titular:</span>
                  <strong style={{ color: "var(--adm-text)", fontSize: "13px" }}>{detailModalService.clientName}</strong>
                  {detailModalService.clientPhone && (
                    <div style={{ color: "var(--adm-text-muted)", fontSize: "11px", marginTop: "2px" }}>
                      WhatsApp: {detailModalService.clientPhone}
                    </div>
                  )}
                </div>

                <div>
                  <span style={{ color: "var(--adm-text-muted)", display: "block" }}>Contrato:</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <strong style={{ color: "var(--adm-wine)" }}>{detailModalService.contractNumber}</strong>
                    <button
                      type="button"
                      onClick={() => handleCopy(detailModalService.contractNumber)}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                      title="Copiar número do contrato"
                    >
                      {copiedContract === detailModalService.contractNumber ? (
                        <Check size={12} style={{ color: "#16a34a" }} />
                      ) : (
                        <Copy size={12} style={{ color: "var(--adm-text-muted)" }} />
                      )}
                    </button>
                  </div>
                  <span style={{ fontSize: "10px", color: "var(--adm-text-muted)" }}>
                    Status: {detailModalService.contractStatus}
                  </span>
                </div>

                <div>
                  <span style={{ color: "var(--adm-text-muted)", display: "block" }}>Data do Serviço:</span>
                  <strong style={{ color: "var(--adm-text)" }}>{formatDateLabel(detailModalService.date)}</strong>
                </div>

                <div>
                  <span style={{ color: "var(--adm-text-muted)", display: "block" }}>Horário de Embarque / Voo:</span>
                  {detailModalService.hasConfirmedTime ? (
                    <strong style={{ color: "#16a34a", fontSize: "14px" }}>
                      {detailModalService.time}
                    </strong>
                  ) : (
                    <span style={{ color: "#b45309", fontWeight: 700 }}>A Confirmar</span>
                  )}
                </div>

                <div>
                  <span style={{ color: "var(--adm-text-muted)", display: "block" }}>Hotel / Ponto de Encontro:</span>
                  <strong style={{ color: "var(--adm-text)" }}>
                    {detailModalService.pickupLocation || detailModalService.hotelName || "Não informado"}
                  </strong>
                  {detailModalService.hotelZone && (
                    <div style={{ color: "var(--adm-text-muted)", fontSize: "11px" }}>
                      Região: {detailModalService.hotelZone}
                    </div>
                  )}
                </div>

                <div>
                  <span style={{ color: "var(--adm-text-muted)", display: "block" }}>Passageiros:</span>
                  <strong style={{ color: "var(--adm-text)" }}>
                    {detailModalService.totalPax} pax ({detailModalService.adultsCount} ad, {detailModalService.childrenCount} ch, {detailModalService.infantsCount} inf)
                  </strong>
                </div>

                <div>
                  <span style={{ color: "var(--adm-text-muted)", display: "block" }}>Fornecedor:</span>
                  <strong style={{ color: "var(--adm-text)" }}>{detailModalService.supplierName}</strong>
                  {detailModalService.supplierConfirmationCode && (
                    <div style={{ fontSize: "11px", color: "#16a34a" }}>
                      Cód. Confirmação: <strong>{detailModalService.supplierConfirmationCode}</strong>
                    </div>
                  )}
                </div>

                <div>
                  <span style={{ color: "var(--adm-text-muted)", display: "block" }}>Voucher Operacional:</span>
                  {detailModalService.voucherRef ? (
                    <strong style={{ color: "#4338ca" }}>{detailModalService.voucherRef}</strong>
                  ) : (
                    <span style={{ color: "#b45309" }}>Pendente de Emissão</span>
                  )}
                  <div style={{ fontSize: "10px", color: "var(--adm-text-muted)" }}>
                    Situação: {detailModalService.voucherStatus}
                  </div>
                </div>
              </div>

              {/* Instruções Especiais / Observações */}
              {detailModalService.specialInstructions && (
                <div style={{ fontSize: "12px", background: "var(--adm-bg)", padding: "10px", borderRadius: "6px" }}>
                  <span style={{ color: "var(--adm-text-muted)", fontWeight: 700 }}>Instruções Especiais:</span>
                  <p style={{ margin: "4px 0 0", color: "var(--adm-text)" }}>
                    {detailModalService.specialInstructions}
                  </p>
                </div>
              )}

              {/* SEÇÃO DE AÇÕES RÁPIDAS (REUTILIZAÇÃO DE MÓDULOS EXISTENTES) */}
              <div style={{ borderTop: "1px solid var(--adm-border)", paddingTop: "14px" }}>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: "var(--adm-text-muted)",
                    letterSpacing: "0.08em",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  Acessar Módulos Especializados (Sem Duplicações)
                </span>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "8px" }}>
                  <Link
                    href={`/admin/contratos?openContractId=${encodeURIComponent(detailModalService.contractId)}`}
                    className="adm-btn adm-btn-outline adm-btn-sm"
                    style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "5px", textDecoration: "none" }}
                    title="Abrir contrato oficial"
                  >
                    <FileText size={13} />
                    <span>Ver Contrato</span>
                  </Link>

                  <Link
                    href={`/admin/reservas?search=${encodeURIComponent(detailModalService.contractNumber)}`}
                    className="adm-btn adm-btn-outline adm-btn-sm"
                    style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "5px", textDecoration: "none" }}
                    title="Confirmar com fornecedor ou editar pickup"
                  >
                    <CalendarClock size={13} />
                    <span>Reserva</span>
                  </Link>

                  <Link
                    href={`/admin/vouchers?search=${encodeURIComponent(detailModalService.contractNumber)}`}
                    className="adm-btn adm-btn-outline adm-btn-sm"
                    style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "5px", textDecoration: "none" }}
                    title="Editar ou entregar voucher ao cliente"
                  >
                    <Ticket size={13} />
                    <span>Voucher</span>
                  </Link>

                  <Link
                    href={`/admin/carteiras?search=${encodeURIComponent(detailModalService.contractNumber)}`}
                    className="adm-btn adm-btn-outline adm-btn-sm"
                    style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "5px", textDecoration: "none" }}
                    title="Visualizar ou atualizar Carteira de Viagem"
                  >
                    <Wallet size={13} />
                    <span>Carteira</span>
                  </Link>

                  <Link
                    href={`/admin/chegadas?search=${encodeURIComponent(detailModalService.contractNumber)}`}
                    className="adm-btn adm-btn-outline adm-btn-sm"
                    style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "5px", textDecoration: "none" }}
                    title="Ver logística de chegada no aeroporto"
                  >
                    <Plane size={13} />
                    <span>Chegada</span>
                  </Link>

                  <Link
                    href={`/admin/ocorrencias?new=true&contractId=${encodeURIComponent(detailModalService.contractId)}&contractNumber=${encodeURIComponent(detailModalService.contractNumber)}&clientName=${encodeURIComponent(detailModalService.clientName)}&serviceName=${encodeURIComponent(detailModalService.title)}&serviceDate=${encodeURIComponent(detailModalService.date)}&supplierName=${encodeURIComponent(detailModalService.supplierName || "")}`}
                    className="adm-btn adm-btn-outline adm-btn-sm"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "5px",
                      textDecoration: "none",
                      color: "#dc2626",
                      borderColor: "#fca5a5",
                    }}
                    title="Registrar ocorrência para este serviço"
                  >
                    <ShieldAlert size={13} />
                    <span>Ocorrência</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// COMPONENTE: LINHA DO CARD DO SERVIÇO NA AGENDA
// =============================================================================

function ServiceCardRow({
  service,
  onOpenDetail,
  onCopy,
  copiedContract,
  isUnscheduledSection = false,
  forceCriticalHighlight = false,
}: {
  service: DailyServiceItem;
  onOpenDetail: (s: DailyServiceItem) => void;
  onCopy: (text: string) => void;
  copiedContract: string | null;
  isUnscheduledSection?: boolean;
  forceCriticalHighlight?: boolean;
}) {
  const isCritical = service.isCritical || forceCriticalHighlight;

  return (
    <div
      className="adm-card"
      style={{
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        flexWrap: "wrap",
        background: isCritical
          ? "rgba(254, 242, 242, 0.5)"
          : isUnscheduledSection
          ? "rgba(254, 243, 199, 0.2)"
          : "var(--adm-card-bg)",
        borderLeft: isCritical
          ? "4px solid #be123c"
          : isUnscheduledSection
          ? "4px solid #f59e0b"
          : "4px solid #10b981",
        transition: "box-shadow 0.15s ease",
      }}
    >
      {/* Coluna 1: Horário & Tipo */}
      <div style={{ minWidth: "90px" }}>
        {service.hasConfirmedTime ? (
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <Clock size={14} style={{ color: "#10b981" }} />
            <strong style={{ fontSize: "15px", color: "var(--adm-text)" }}>
              {service.time}
            </strong>
          </div>
        ) : (
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "#b45309",
              background: "#fef3c7",
              border: "1px solid #fde68a",
              padding: "2px 6px",
              borderRadius: "4px",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Clock size={11} />
            A confirmar
          </span>
        )}

        <div style={{ marginTop: "3px" }}>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 800,
              textTransform: "uppercase",
              color:
                service.serviceType === "passeio"
                  ? "#059669"
                  : service.serviceType === "traslado"
                  ? "#4f46e5"
                  : "#0284c7",
            }}
          >
            {service.serviceType}
          </span>
        </div>
      </div>

      {/* Coluna 2: Serviço, Cliente e Contrato */}
      <div style={{ flex: "1 1 240px", minWidth: "220px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <strong style={{ fontSize: "14px", color: "var(--adm-wine)" }}>
            {service.title}
          </strong>
          {isCritical && (
            <span
              style={{
                fontSize: "10px",
                background: "#fee2e2",
                color: "#be123c",
                padding: "2px 6px",
                borderRadius: "4px",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: "3px",
              }}
              title={service.criticalReasons.join("; ")}
            >
              <AlertTriangle size={11} />
              URGENTE
            </span>
          )}
        </div>

        <div style={{ fontSize: "12px", color: "var(--adm-text)", marginTop: "2px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span>
            Cliente: <strong>{service.clientName}</strong> ({service.totalPax} pax)
          </span>
          <span style={{ color: "var(--adm-text-muted)" }}>•</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            Contrato: <strong style={{ color: "var(--adm-text-muted)" }}>{service.contractNumber}</strong>
            <button
              type="button"
              onClick={() => onCopy(service.contractNumber)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
              title="Copiar número do contrato"
            >
              {copiedContract === service.contractNumber ? (
                <Check size={11} style={{ color: "#16a34a" }} />
              ) : (
                <Copy size={11} style={{ color: "var(--adm-text-muted)" }} />
              )}
            </button>
          </span>
        </div>
      </div>

      {/* Coluna 3: Hotel & Região */}
      <div style={{ flex: "1 1 180px", minWidth: "160px", fontSize: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "var(--adm-text)" }}>
          <Building size={13} style={{ color: "var(--adm-gold)", flexShrink: 0 }} />
          <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {service.hotelName || service.pickupLocation || "Hotel não informado"}
          </span>
        </div>
        {service.hotelZone && (
          <span style={{ fontSize: "11px", color: "var(--adm-text-muted)", marginLeft: "18px" }}>
            {service.hotelZone}
          </span>
        )}
      </div>

      {/* Coluna 4: Fornecedor e Status */}
      <div style={{ flex: "1 1 160px", minWidth: "140px", fontSize: "12px" }}>
        <div style={{ color: "var(--adm-text)", fontWeight: 600 }}>
          {service.supplierName}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "3px" }}>
          <span
            style={{
              fontSize: "10px",
              padding: "2px 6px",
              borderRadius: "4px",
              fontWeight: 700,
              background:
                service.operationalStatus === "confirmada"
                  ? "#dcfce7"
                  : service.operationalStatus === "pendente" || service.operationalStatus === "solicitada"
                  ? "#fef3c7"
                  : "#f1f5f9",
              color:
                service.operationalStatus === "confirmada"
                  ? "#15803d"
                  : service.operationalStatus === "pendente" || service.operationalStatus === "solicitada"
                  ? "#b45309"
                  : "#475569",
            }}
          >
            {service.operationalStatus}
          </span>

          {service.voucherRef ? (
            <span
              style={{
                fontSize: "10px",
                background: "#e0e7ff",
                color: "#4338ca",
                padding: "2px 5px",
                borderRadius: "4px",
                fontWeight: 600,
              }}
              title={`Voucher: ${service.voucherRef}`}
            >
              Voucher OK
            </span>
          ) : (
            <span
              style={{
                fontSize: "10px",
                background: "#fff7ed",
                color: "#c2410c",
                padding: "2px 5px",
                borderRadius: "4px",
                fontWeight: 600,
              }}
            >
              Sem Voucher
            </span>
          )}
        </div>
      </div>

      {/* Coluna 5: Ações Rápidas */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <button
          type="button"
          onClick={() => onOpenDetail(service)}
          className="adm-btn adm-btn-outline adm-btn-sm"
          style={{ fontSize: "11px", padding: "4px 8px" }}
          title="Ver detalhes operacionais consolidados"
        >
          Detalhes
        </button>

        <Link
          href={`/admin/reservas?search=${encodeURIComponent(service.contractNumber)}`}
          className="adm-btn adm-btn-sm"
          style={{
            background: "var(--adm-wine)",
            color: "#ffffff",
            fontSize: "11px",
            padding: "4px 8px",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "3px",
          }}
          title="Acessar reserva na Central de Reservas"
        >
          <span>Operação</span>
          <ChevronRight size={12} />
        </Link>
      </div>
    </div>
  );
}

// =============================================================================
// COMPONENTE: CARD DA CENTRAL DE PENDÊNCIAS
// =============================================================================

function PendencyCardRow({ item }: { item: OperationalPendencyItem }) {
  const priorityConfig: Record<
    string,
    { label: string; bg: string; color: string; border: string; icon: React.ElementType }
  > = {
    critica: {
      label: "CRÍTICA",
      bg: "#fee2e2",
      color: "#b91c1c",
      border: "#fca5a5",
      icon: AlertTriangle,
    },
    alta: {
      label: "ALTA",
      bg: "#fef3c7",
      color: "#b45309",
      border: "#fde68a",
      icon: AlertCircle,
    },
    media: {
      label: "MÉDIA",
      bg: "#e0e7ff",
      color: "#4338ca",
      border: "#c7d2fe",
      icon: Clock,
    },
    baixa: {
      label: "BAIXA",
      bg: "#f1f5f9",
      color: "#475569",
      border: "#cbd5e1",
      icon: Info,
    },
  };

  const pConfig = priorityConfig[item.priority] || priorityConfig.media;
  const IconComp = pConfig.icon;

  const proximityLabel =
    item.daysUntilService === 0
      ? "Hoje"
      : item.daysUntilService === 1
      ? "Amanhã"
      : item.daysUntilService < 0
      ? `Retroativa (${Math.abs(item.daysUntilService)}d atrás)`
      : `Em ${item.daysUntilService} dias (${formatDateLabel(item.serviceDate)})`;

  return (
    <div
      className="adm-card"
      style={{
        padding: "14px 18px",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "16px",
        flexWrap: "wrap",
        borderLeft: `4px solid ${pConfig.color}`,
      }}
    >
      <div style={{ flex: "1 1 300px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 800,
              background: pConfig.bg,
              color: pConfig.color,
              border: `1px solid ${pConfig.border}`,
              padding: "2px 6px",
              borderRadius: "4px",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <IconComp size={11} />
            {pConfig.label}
          </span>

          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: item.daysUntilService <= 1 ? "#be123c" : "var(--adm-text-muted)",
            }}
          >
            {proximityLabel}
          </span>
        </div>

        <h4 style={{ margin: "4px 0 2px", fontSize: "14px", fontWeight: 700, color: "var(--adm-text)" }}>
          {item.title}
        </h4>

        <p style={{ margin: "0 0 6px", fontSize: "12px", color: "var(--adm-text-muted)" }}>
          {item.description}
        </p>

        <div style={{ fontSize: "11px", color: "var(--adm-text-muted)", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <span>Cliente: <strong style={{ color: "var(--adm-text)" }}>{item.clientName}</strong></span>
          <span>•</span>
          <span>Contrato: <strong style={{ color: "var(--adm-wine)" }}>{item.contractNumber}</strong></span>
          <span>•</span>
          <span>Serviço: <strong>{item.serviceName}</strong></span>
        </div>
      </div>

      {/* Ação Rápida */}
      <div style={{ alignSelf: "center" }}>
        <Link
          href={item.quickActionUrl}
          className="adm-btn adm-btn-sm"
          style={{
            background: "var(--adm-wine)",
            color: "#ffffff",
            fontSize: "11px",
            fontWeight: 600,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "6px 12px",
          }}
          title="Abrir módulo especializado para solucionar esta pendência"
        >
          <span>Resolver no Módulo</span>
          <ExternalLink size={12} />
        </Link>
      </div>
    </div>
  );
}
