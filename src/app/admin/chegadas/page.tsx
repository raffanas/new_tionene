"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuthProfile } from "@/lib/auth/AuthContext";
import {
  ArrivalDisplayItem,
  ArrivalOperationalStatus,
  ArrivalKpiSummary,
  ArrivalFilters,
  isTransferProduct,
  deriveArrivalStatus,
  detectArrivalPendencies,
  calculateArrivalKpis,
  filterArrivals,
  generateArrivalWhatsAppMessage,
} from "@/lib/operational/arrivalOperations";
import { formatWhatsAppLink } from "@/lib/operational/supplierMessaging";
import { updateOperationalReservation } from "@/lib/operational/updateReservation";
import {
  Plane,
  Calendar,
  CalendarDays,
  Clock,
  Users,
  Building,
  MapPin,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  XCircle,
  MessageSquare,
  Send,
  Copy,
  Check,
  Edit2,
  Eye,
  FileText,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Phone,
  X,
  ShieldCheck,
  Car,
  UserCheck,
  Info,
  ArrowRight,
  CheckCheck,
  Ticket,
  Wallet,
  ShieldAlert,
  CheckSquare,
} from "lucide-react";

const STATUS_DETAILS: Record<
  ArrivalOperationalStatus,
  { label: string; bg: string; color: string; border: string; desc: string }
> = {
  pendente_info: {
    label: "Pendente de Info",
    bg: "#fff7ed",
    color: "#c2410c",
    border: "#fed7aa",
    desc: "Faltam voo ou hotel de destino",
  },
  aguardando_solicitacao: {
    label: "Aguardando Solicitação",
    bg: "#fef3c7",
    color: "#b45309",
    border: "#fde68a",
    desc: "Dados completos; solicitar ao fornecedor",
  },
  solicitada: {
    label: "Solicitação Enviada",
    bg: "#e0e7ff",
    color: "#4338ca",
    border: "#c7d2fe",
    desc: "Mensagem enviada ao fornecedor/motorista",
  },
  confirmada: {
    label: "Confirmada",
    bg: "#dcfce7",
    color: "#15803d",
    border: "#86efac",
    desc: "Agendamento e voucher confirmados",
  },
  em_atendimento: {
    label: "Em Atendimento",
    bg: "#e0f2fe",
    color: "#0369a1",
    border: "#bae6fd",
    desc: "Cliente no aeroporto / em trânsito",
  },
  concluida: {
    label: "Concluída",
    bg: "#f1f5f9",
    color: "#475569",
    border: "#cbd5e1",
    desc: "Turista recepcionado e acomodado",
  },
  cancelada: {
    label: "Cancelada",
    bg: "#fee2e2",
    color: "#b91c1c",
    border: "#fca5a5",
    desc: "Chegada ou viagem cancelada",
  },
};

type DatePreset = "all" | "today" | "tomorrow" | "next7" | "this_month" | "custom";

export default function AdminArrivalsCenterPage() {
  const { role } = useAuthProfile();
  const isAdmin = role === "admin";

  // Estado Principal de Dados
  const [arrivals, setArrivals] = useState<ArrivalDisplayItem[]>([]);
  const [suppliersList, setSuppliersList] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filtros
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [supplierFilter, setSupplierFilter] = useState<string>("todos");
  const [hotelOrZoneFilter, setHotelOrZoneFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Modais
  const [selectedArrival, setSelectedArrival] = useState<ArrivalDisplayItem | null>(null);

  // Modal de WhatsApp
  const [whatsappModal, setWhatsappModal] = useState<{
    open: boolean;
    arrival: ArrivalDisplayItem | null;
    customMessage: string;
    targetPhone: string;
    copied: boolean;
    submitting: boolean;
  }>({
    open: false,
    arrival: null,
    customMessage: "",
    targetPhone: "",
    copied: false,
    submitting: false,
  });

  // Modal de Edição Operacional
  const [editModal, setEditModal] = useState<{
    open: boolean;
    arrival: ArrivalDisplayItem | null;
    status: ArrivalOperationalStatus;
    assignedAgent: string;
    notes: string;
    pickupTime: string;
    voucherRef: string;
    submitting: boolean;
  }>({
    open: false,
    arrival: null,
    status: "confirmada",
    assignedAgent: "",
    notes: "",
    pickupTime: "",
    voucherRef: "",
    submitting: false,
  });

  // Notificação Toast
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Carregar dados oficiais do banco de dados (100% integrados, sem inventar chegadas)
  const fetchArrivalsData = async () => {
    try {
      // 1. Carregar fornecedores para contato telefônico
      const { data: supps } = await supabase
        .from("suppliers")
        .select("id, name, trade_name, contact_name, phone, whatsapp, email");

      const sMap: Record<string, any> = {};
      const uniqueSuppliers: Array<{ id: string; name: string }> = [];

      (supps || []).forEach((s: any) => {
        sMap[s.id] = s;
        if (s.name) {
          sMap[s.name.toLowerCase().trim()] = s;
          uniqueSuppliers.push({ id: s.id, name: s.name });
        }
        if (s.trade_name) sMap[s.trade_name.toLowerCase().trim()] = s;
      });
      setSuppliersList(uniqueSuppliers);

      // 2. Carregar reservas operacionais para vincular traslados
      const { data: opReservations } = await supabase
        .from("operational_reservations")
        .select(`
          id,
          contract_id,
          contract_item_id,
          supplier_id,
          supplier_name,
          product_name,
          tour_date,
          pickup_time,
          pickup_location,
          voucher_ref,
          supplier_confirmation_code,
          status,
          special_instructions,
          notes
        `);

      // Mapear reservas de traslado por contract_id
      const transferByContract: Record<string, any> = {};
      (opReservations || []).forEach((r: any) => {
        if (isTransferProduct(r.product_name)) {
          // Se houver mais de uma (ex: in e out), prioriza a do in/chegada
          if (!transferByContract[r.contract_id] || (r.product_name || "").toLowerCase().includes("in")) {
            transferByContract[r.contract_id] = r;
          }
        }
      });

      // 3. Buscar chegadas oficiais geradas pelo fluxo de Finalizar Venda
      const { data: arrivalsRows, error: arrError } = await supabase
        .from("arrivals")
        .select(`
          *,
          contracts (
            id,
            contract_number,
            client_id,
            client_name,
            client_phone,
            client_email,
            client_cpf,
            status,
            created_by,
            sellers:created_by (name),
            contract_items (
              id,
              tour_name_snapshot,
              tour_date,
              adults_count,
              children_count,
              supplier_id,
              supplier_name_snapshot,
              voucher_ref
            )
          )
        `)
        .order("arrival_date", { ascending: true });

      if (arrError) {
        console.warn("Aviso ao carregar public.arrivals:", arrError.message);
        setArrivals([]);
        return;
      }

      const items: ArrivalDisplayItem[] = (arrivalsRows || []).map((arr: any) => {
        const contract = arr.contracts || {};
        const transferRes = transferByContract[arr.contract_id];

        // Buscar contato do fornecedor de traslado
        let transferSupp = null;
        if (transferRes) {
          if (transferRes.supplier_id && sMap[transferRes.supplier_id]) {
            transferSupp = sMap[transferRes.supplier_id];
          } else if (transferRes.supplier_name && sMap[transferRes.supplier_name.toLowerCase().trim()]) {
            transferSupp = sMap[transferRes.supplier_name.toLowerCase().trim()];
          }
        }

        const hasTransfer = Boolean(transferRes);

        const status = deriveArrivalStatus({
          rawStatus: arr.status,
          hasTransfer,
          transferStatus: transferRes?.status,
          flightNumber: arr.arrival_flight_number,
          flightTime: arr.arrival_flight_time,
          hotelName: arr.hotel_name,
        });

        const totalPax =
          (Number(arr.adults_count) || 1) +
          (Number(arr.children_count) || 0) +
          (Number(arr.infants_count) || 0);

        const displayItem: ArrivalDisplayItem = {
          id: arr.id,
          contract_id: arr.contract_id,
          contract_number: contract.contract_number || "TN-XXXX",
          contract_status: contract.status || "confirmado",
          seller_name: contract.sellers?.name || null,
          client_id: arr.client_id || contract.client_id || null,
          client_name: arr.client_name || contract.client_name || "Cliente não informado",
          client_phone: arr.client_phone || contract.client_phone || null,
          client_email: arr.client_email || contract.client_email || null,
          client_cpf: contract.client_cpf || null,

          arrival_date: arr.arrival_date,
          departure_date: arr.departure_date || null,
          arrival_flight_number: arr.arrival_flight_number || null,
          arrival_flight_time: arr.arrival_flight_time || null,
          depart_flight_number: arr.depart_flight_number || null,
          depart_flight_time: arr.depart_flight_time || null,

          adults_count: Number(arr.adults_count) || 1,
          children_count: Number(arr.children_count) || 0,
          infants_count: Number(arr.infants_count) || 0,
          total_pax: totalPax,

          hotel_name: arr.hotel_name || null,
          hotel_zone: arr.hotel_zone || null,
          hotels_schedule: Array.isArray(arr.hotels_schedule) ? arr.hotels_schedule : [],

          status,
          raw_arrival_status: arr.status,
          assigned_agent: arr.assigned_agent || null,
          notes: arr.notes || null,
          created_at: arr.created_at,
          updated_at: arr.updated_at,

          has_transfer: hasTransfer,
          transfer_reservation_id: transferRes?.id || null,
          transfer_contract_item_id: transferRes?.contract_item_id || null,
          transfer_product_name: transferRes?.product_name || null,
          transfer_supplier_id: transferRes?.supplier_id || null,
          transfer_supplier_name: transferRes?.supplier_name || null,
          transfer_supplier_phone: transferSupp?.phone || transferSupp?.whatsapp || null,
          transfer_supplier_whatsapp: transferSupp?.whatsapp || transferSupp?.phone || null,
          transfer_status: transferRes?.status || null,
          transfer_pickup_time: transferRes?.pickup_time || null,
          transfer_voucher_ref: transferRes?.voucher_ref || null,
          transfer_confirmation_code: transferRes?.supplier_confirmation_code || null,

          pendencies: [],
        };

        displayItem.pendencies = detectArrivalPendencies(displayItem);
        return displayItem;
      });

      setArrivals(items);
    } catch (err: any) {
      console.error("Erro geral na busca de chegadas:", err);
      showToast("Erro ao carregar chegadas: " + err.message, "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchArrivalsData();
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search).get("search") || new URLSearchParams(window.location.search).get("q");
      if (q) setSearchTerm(q);
    }
  }, []);

  // Atalhos de Data
  const handleDatePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    if (preset === "all") {
      setStartDate("");
      setEndDate("");
    } else if (preset === "today") {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === "tomorrow") {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];
      setStartDate(tomorrowStr);
      setEndDate(tomorrowStr);
    } else if (preset === "next7") {
      const next7 = new Date(today);
      next7.setDate(next7.getDate() + 7);
      setStartDate(todayStr);
      setEndDate(next7.toISOString().split("T")[0]);
    } else if (preset === "this_month") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split("T")[0];
      setStartDate(firstDay);
      setEndDate(lastDay);
    }
  };

  // KPIs
  const kpis: ArrivalKpiSummary = useMemo(() => {
    return calculateArrivalKpis(arrivals);
  }, [arrivals]);

  // Lista Filtrada
  const filteredArrivals: ArrivalDisplayItem[] = useMemo(() => {
    const filters: ArrivalFilters = {
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      status: statusFilter !== "todos" ? statusFilter : undefined,
      supplierId: supplierFilter !== "todos" ? supplierFilter : undefined,
      hotelOrZone: hotelOrZoneFilter || undefined,
      clientName: searchTerm || undefined,
    };
    return filterArrivals(arrivals, filters);
  }, [arrivals, startDate, endDate, statusFilter, supplierFilter, hotelOrZoneFilter, searchTerm]);

  // Abrir Modal de WhatsApp
  const handleOpenWhatsAppModal = (arrival: ArrivalDisplayItem) => {
    const message = generateArrivalWhatsAppMessage(arrival);
    const phone = arrival.transfer_supplier_whatsapp || arrival.transfer_supplier_phone || "";
    setWhatsappModal({
      open: true,
      arrival,
      customMessage: message,
      targetPhone: phone,
      copied: false,
      submitting: false,
    });
  };

  // Abrir WhatsApp Web (Ação explícita — NÃO altera status automaticamente)
  const handleOpenWhatsAppLink = () => {
    if (!whatsappModal.targetPhone) {
      alert("Por favor, informe o telefone do fornecedor ou responsável pelo traslado.");
      return;
    }
    const link = formatWhatsAppLink(whatsappModal.targetPhone, whatsappModal.customMessage);
    if (!link) {
      alert("Telefone inválido para envio de WhatsApp.");
      return;
    }
    window.open(link, "_blank");
  };

  // Confirmar Envio da Solicitação (Ação explícita de atualização)
  const handleConfirmWhatsAppSent = async () => {
    if (!whatsappModal.arrival) return;
    setWhatsappModal((prev) => ({ ...prev, submitting: true }));

    try {
      const arr = whatsappModal.arrival;

      // 1. Atualizar status na tabela arrivals
      const { error: arrErr } = await supabase
        .from("arrivals")
        .update({
          status: "solicitada",
          updated_at: new Date().toISOString(),
        })
        .eq("id", arr.id);

      if (arrErr) throw arrErr;

      // 2. Se houver reserva de traslado vinculada, atualizar também
      if (arr.transfer_reservation_id) {
        await updateOperationalReservation(supabase, {
          reservationId: arr.transfer_reservation_id,
          status: "solicitada",
          supplierRequestedAt: new Date().toISOString(),
          supplierRequestChannel: "whatsapp",
          actionDescription: "Solicitação de traslado enviada via WhatsApp na Central de Chegadas",
          isAdmin,
        });
      }

      showToast("Solicitação de traslado marcada como enviada com sucesso!");
      setWhatsappModal({
        open: false,
        arrival: null,
        customMessage: "",
        targetPhone: "",
        copied: false,
        submitting: false,
      });

      // Recarregar dados
      fetchArrivalsData();
    } catch (err: any) {
      console.error("Erro ao confirmar envio:", err);
      showToast("Erro ao confirmar envio: " + err.message, "error");
      setWhatsappModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  // Abrir Modal de Edição Operacional
  const handleOpenEditModal = (arrival: ArrivalDisplayItem) => {
    setEditModal({
      open: true,
      arrival,
      status: arrival.status,
      assignedAgent: arrival.assigned_agent || "",
      notes: arrival.notes || "",
      pickupTime: arrival.transfer_pickup_time || "",
      voucherRef: arrival.transfer_voucher_ref || "",
      submitting: false,
    });
  };

  // Salvar Edição Operacional
  const handleSaveOperationalEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal.arrival) return;

    setEditModal((prev) => ({ ...prev, submitting: true }));

    try {
      const arr = editModal.arrival;

      // 1. Salvar alterações operacionais autorizadas na tabela arrivals
      // (Não toca valores de venda, margem, itens ou PDF do contrato)
      const { error: arrErr } = await supabase
        .from("arrivals")
        .update({
          status: editModal.status,
          assigned_agent: editModal.assignedAgent.trim() || null,
          notes: editModal.notes.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", arr.id);

      if (arrErr) throw arrErr;

      // 2. Se houver reserva de traslado vinculada, sincronizar dados operacionais da reserva
      if (arr.transfer_reservation_id) {
        let opStatus: any = "pendente";
        if (editModal.status === "concluida") opStatus = "realizada";
        else if (editModal.status === "confirmada") opStatus = "confirmada";
        else if (editModal.status === "solicitada") opStatus = "solicitada";
        else if (editModal.status === "cancelada") opStatus = "cancelada";
        else if (editModal.status === "pendente_info") opStatus = "pendente_info";

        await updateOperationalReservation(supabase, {
          reservationId: arr.transfer_reservation_id,
          status: opStatus,
          pickupTime: editModal.pickupTime.trim() || null,
          voucherRef: editModal.voucherRef.trim() || null,
          notes: editModal.notes.trim() || null,
          actionDescription: "Atualização operacional pela Central de Chegadas",
          isAdmin,
        });
      }

      showToast("Dados operacionais da chegada atualizados com sucesso!");
      setEditModal((prev) => ({ ...prev, open: false, submitting: false }));

      // Atualizar no modal de detalhes caso esteja aberto
      if (selectedArrival && selectedArrival.id === arr.id) {
        setSelectedArrival((prev) =>
          prev
            ? {
                ...prev,
                status: editModal.status,
                assigned_agent: editModal.assignedAgent.trim() || null,
                notes: editModal.notes.trim() || null,
                transfer_pickup_time: editModal.pickupTime.trim() || null,
                transfer_voucher_ref: editModal.voucherRef.trim() || null,
              }
            : null
        );
      }

      fetchArrivalsData();
    } catch (err: any) {
      console.error("Erro ao salvar dados operacionais:", err);
      showToast("Erro ao salvar: " + err.message, "error");
      setEditModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  // Limpar Filtros
  const handleClearFilters = () => {
    setDatePreset("all");
    setStartDate("");
    setEndDate("");
    setStatusFilter("todos");
    setSupplierFilter("todos");
    setHotelOrZoneFilter("");
    setSearchTerm("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 9999,
            padding: "14px 20px",
            borderRadius: "10px",
            background: toastMessage.type === "success" ? "#15803d" : "#b91c1c",
            color: "#fff",
            fontWeight: 600,
            fontSize: "14px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          {toastMessage.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Cabeçalho */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <span className="admin-brand-tag" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <Plane size={13} />
            <span>CENTRAL OPERACIONAL</span>
          </span>
          <h2 style={{ fontSize: "28px", color: "var(--adm-wine)", marginTop: "4px" }}>
            Chegadas e Traslados Cancún
          </h2>
          <p style={{ color: "var(--adm-text-muted)", fontSize: "14px", marginTop: "2px" }}>
            Monitore o desembarque de turistas, coordene traslados e envie solicitações operacionais sem expor dados financeiros.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            className="adm-btn adm-btn-outline adm-btn-sm"
            onClick={() => {
              setRefreshing(true);
              fetchArrivalsData();
            }}
            disabled={refreshing || loading}
            title="Atualizar lista"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            <span>{refreshing ? "Atualizando..." : "Atualizar"}</span>
          </button>

          <Link href="/admin/reservas" className="adm-btn adm-btn-outline adm-btn-sm">
            <Car size={14} />
            <span>Reservas de Passeios</span>
          </Link>

          <Link href="/admin/vouchers" className="adm-btn adm-btn-outline adm-btn-sm">
            <Ticket size={14} />
            <span>Central de Vouchers</span>
          </Link>

          <Link href="/admin/carteiras" className="adm-btn adm-btn-outline adm-btn-sm" style={{ color: "var(--adm-clay)", borderColor: "var(--adm-clay)" }}>
            <Wallet size={14} />
            <span>Carteiras de Viagem</span>
          </Link>

          <Link href="/admin/contratos" className="adm-btn adm-btn-outline adm-btn-sm">
            <FileText size={14} />
            <span>Contratos de Venda</span>
          </Link>
        </div>
      </div>

      {/* Grid de Indicadores Operacionais */}
      <div className="adm-kpi-grid">
        <div
          className="adm-kpi-card"
          style={{ cursor: "pointer" }}
          onClick={() => handleDatePresetChange("today")}
          title="Clique para filtrar chegadas de hoje"
        >
          <div className="adm-kpi-header">
            <span>Chegadas Hoje</span>
            <Plane size={18} color="var(--adm-wine)" />
          </div>
          <div className="adm-kpi-value">{kpis.arrivalsTodayCount}</div>
          <div className="adm-kpi-desc">Desembarques previstos para a data atual</div>
        </div>

        <div
          className="adm-kpi-card"
          style={{ cursor: "pointer" }}
          onClick={() => handleDatePresetChange("tomorrow")}
          title="Clique para filtrar chegadas de amanhã"
        >
          <div className="adm-kpi-header">
            <span>Chegadas Amanhã</span>
            <CalendarDays size={18} color="var(--adm-clay)" />
          </div>
          <div className="adm-kpi-value">{kpis.arrivalsTomorrowCount}</div>
          <div className="adm-kpi-desc">Preparação de escala de receptivo</div>
        </div>

        <div
          className="adm-kpi-card"
          style={{ cursor: "pointer" }}
          onClick={() => setStatusFilter("pendente_info")}
          title="Clique para filtrar pendentes de info"
        >
          <div className="adm-kpi-header">
            <span>Pendentes de Informações</span>
            <AlertTriangle size={18} color="#c2410c" />
          </div>
          <div className="adm-kpi-value" style={{ color: "#c2410c" }}>
            {kpis.pendingInfoCount}
          </div>
          <div className="adm-kpi-desc">Sem voo definido ou hotel a confirmar</div>
        </div>

        <div
          className="adm-kpi-card"
          style={{ cursor: "pointer" }}
          onClick={() => setStatusFilter("aguardando_solicitacao")}
          title="Clique para filtrar aguardando envio/confirmação"
        >
          <div className="adm-kpi-header">
            <span>Aguardando Confirmação</span>
            <Clock size={18} color="#b45309" />
          </div>
          <div className="adm-kpi-value" style={{ color: "#b45309" }}>
            {kpis.awaitingConfirmationCount}
          </div>
          <div className="adm-kpi-desc">Prontas para envio ou aguardando voucher</div>
        </div>

        <div
          className="adm-kpi-card"
          style={{ cursor: "pointer" }}
          onClick={() => setStatusFilter("confirmada")}
          title="Clique para filtrar confirmadas"
        >
          <div className="adm-kpi-header">
            <span>Confirmadas</span>
            <CheckCircle2 size={18} color="#15803d" />
          </div>
          <div className="adm-kpi-value" style={{ color: "#15803d" }}>
            {kpis.confirmedCount}
          </div>
          <div className="adm-kpi-desc">Voo, hotel e traslados assegurados</div>
        </div>

        <div
          className="adm-kpi-card"
          style={{ cursor: "pointer" }}
          onClick={() => setStatusFilter("concluida")}
          title="Clique para filtrar concluídas"
        >
          <div className="adm-kpi-header">
            <span>Concluídas</span>
            <CheckCheck size={18} color="#475569" />
          </div>
          <div className="adm-kpi-value" style={{ color: "#475569" }}>
            {kpis.completedCount}
          </div>
          <div className="adm-kpi-desc">Turistas já recepcionados em Cancún</div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="adm-card" style={{ padding: "20px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Linha 1: Atalhos de Data e Busca Textual */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            {/* Atalhos Rápidos de Data */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--adm-text-muted)", marginRight: "4px" }}>
                PERÍODO:
              </span>
              {(
                [
                  { id: "all", label: "Todas" },
                  { id: "today", label: "Hoje" },
                  { id: "tomorrow", label: "Amanhã" },
                  { id: "next7", label: "Próximos 7 Dias" },
                  { id: "this_month", label: "Este Mês" },
                  { id: "custom", label: "Personalizado" },
                ] as const
              ).map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={`adm-btn adm-btn-sm ${datePreset === preset.id ? "adm-btn-wine" : "adm-btn-outline"}`}
                  onClick={() => handleDatePresetChange(preset.id)}
                  style={{ fontSize: "12px", padding: "5px 12px" }}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Busca Rápida por Texto */}
            <div className="adm-search-input" style={{ width: "340px" }}>
              <Search size={16} color="var(--adm-clay)" />
              <input
                type="text"
                placeholder="Cliente, voo, hotel ou contrato..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  style={{ background: "transparent", border: 0, cursor: "pointer", padding: "2px" }}
                >
                  <X size={14} color="var(--adm-text-muted)" />
                </button>
              )}
            </div>
          </div>

          {/* Linha 2: Filtros Específicos (Status, Fornecedor, Hotel/Zona, Datas Customizadas) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "12px",
              paddingTop: "12px",
              borderTop: "1px solid var(--adm-border)",
            }}
          >
            {/* Status Operacional */}
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--adm-text-muted)", marginBottom: "4px" }}>
                STATUS OPERACIONAL
              </label>
              <select
                className="adm-input"
                style={{ width: "100%", fontSize: "13px" }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="todos">Todos os Status</option>
                <option value="pendente_info">Pendente de Informações</option>
                <option value="aguardando_solicitacao">Aguardando Solicitação</option>
                <option value="solicitada">Solicitação Enviada</option>
                <option value="confirmada">Confirmada</option>
                <option value="em_atendimento">Em Atendimento</option>
                <option value="concluida">Concluída</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>

            {/* Fornecedor de Traslado */}
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--adm-text-muted)", marginBottom: "4px" }}>
                FORNECEDOR DE TRASLADO
              </label>
              <select
                className="adm-input"
                style={{ width: "100%", fontSize: "13px" }}
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
              >
                <option value="todos">Todos os Fornecedores</option>
                {suppliersList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Hotel ou Zona */}
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--adm-text-muted)", marginBottom: "4px" }}>
                HOTEL OU ZONA
              </label>
              <input
                type="text"
                className="adm-input"
                style={{ width: "100%", fontSize: "13px" }}
                placeholder="Ex: Riu, Moon Palace, Zona Hotelera..."
                value={hotelOrZoneFilter}
                onChange={(e) => setHotelOrZoneFilter(e.target.value)}
              />
            </div>

            {/* Seletor de Data Inicial (quando custom ou geral) */}
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--adm-text-muted)", marginBottom: "4px" }}>
                DATA INICIAL
              </label>
              <input
                type="date"
                className="adm-input"
                style={{ width: "100%", fontSize: "13px" }}
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset("custom");
                }}
              />
            </div>

            {/* Seletor de Data Final */}
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--adm-text-muted)", marginBottom: "4px" }}>
                DATA FINAL
              </label>
              <input
                type="date"
                className="adm-input"
                style={{ width: "100%", fontSize: "13px" }}
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset("custom");
                }}
              />
            </div>
          </div>

          {/* Rodapé da Barra de Filtros */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px" }}>
            <span style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
              Exibindo <strong>{filteredArrivals.length}</strong> de <strong>{arrivals.length}</strong> chegadas registradas
            </span>

            {(datePreset !== "all" ||
              statusFilter !== "todos" ||
              supplierFilter !== "todos" ||
              hotelOrZoneFilter ||
              searchTerm ||
              startDate ||
              endDate) && (
              <button
                type="button"
                className="adm-btn adm-btn-outline adm-btn-sm"
                onClick={handleClearFilters}
                style={{ fontSize: "11px" }}
              >
                <X size={12} />
                <span>Limpar Filtros</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Listagem Operacional de Chegadas */}
      {loading ? (
        <div className="adm-card" style={{ padding: "60px 20px", textAlign: "center" }}>
          <Clock size={32} className="animate-spin" color="var(--adm-clay)" style={{ margin: "0 auto 12px" }} />
          <p style={{ color: "var(--adm-text-muted)" }}>Carregando dados operacionais de chegadas e traslados...</p>
        </div>
      ) : filteredArrivals.length === 0 ? (
        <div className="adm-card" style={{ padding: "60px 20px", textAlign: "center" }}>
          <Plane size={44} color="var(--adm-clay)" style={{ margin: "0 auto 14px", opacity: 0.5 }} />
          <h3 style={{ fontSize: "18px", color: "var(--adm-wine)" }}>Nenhuma chegada encontrada para os filtros selecionados</h3>
          <p style={{ color: "var(--adm-text-muted)", fontSize: "14px", marginTop: "4px", maxWidth: "480px", margin: "4px auto 0" }}>
            As chegadas são geradas automaticamente ao finalizar uma venda no sistema. Ajuste os filtros acima para consultar outros períodos.
          </p>
          <div style={{ marginTop: "16px", display: "flex", justifyContent: "center", gap: "10px" }}>
            <button type="button" className="adm-btn adm-btn-clay adm-btn-sm" onClick={handleClearFilters}>
              <span>Ver Todas as Chegadas</span>
            </button>
            <Link href="/admin/contratos" className="adm-btn adm-btn-outline adm-btn-sm">
              <span>Ir para Contratos</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="adm-table-container">
          <div className="adm-table-responsive">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Data Chegada</th>
                  <th>Voo & Horário</th>
                  <th>Cliente Responsável</th>
                  <th>Passageiros (PAX)</th>
                  <th>Hotel & Zona</th>
                  <th>Serviço de Traslado</th>
                  <th>Status Operacional</th>
                  <th style={{ textAlign: "right" }}>Ações Operacionais</th>
                </tr>
              </thead>
              <tbody>
                {filteredArrivals.map((arr) => {
                  const arrDateObj = new Date(arr.arrival_date + "T12:00:00");
                  const dayOfWeek = arrDateObj.toLocaleDateString("pt-BR", { weekday: "short" });
                  const formattedDate = arrDateObj.toLocaleDateString("pt-BR");

                  const statusConf = STATUS_DETAILS[arr.status] || STATUS_DETAILS.confirmada;
                  const hasPendencies = arr.pendencies.length > 0;

                  return (
                    <tr
                      key={arr.id}
                      style={{ cursor: "pointer", background: arr.status === "cancelada" ? "rgba(254, 242, 242, 0.4)" : undefined }}
                      onClick={() => setSelectedArrival(arr)}
                    >
                      {/* Data da Chegada */}
                      <td>
                        <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--adm-wine)" }}>
                          {formattedDate}
                        </div>
                        <div style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--adm-clay)", fontWeight: 700 }}>
                          {dayOfWeek}
                        </div>
                        <div style={{ fontSize: "10px", color: "var(--adm-text-subtle)", marginTop: "2px" }}>
                          Contrato {arr.contract_number}
                        </div>
                      </td>

                      {/* Voo e Horário */}
                      <td>
                        {arr.arrival_flight_number ? (
                          <div>
                            <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                              <Plane size={13} color="var(--adm-clay)" />
                              <span>{arr.arrival_flight_number}</span>
                            </div>
                            <div style={{ fontSize: "12px", color: "var(--adm-text-muted)", marginTop: "2px" }}>
                              {arr.arrival_flight_time ? `Previsto: ${arr.arrival_flight_time}` : "Horário a confirmar"}
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#c2410c", fontSize: "12px", fontWeight: 600 }}>
                            <AlertCircle size={13} />
                            <span>Não informado</span>
                          </div>
                        )}
                      </td>

                      {/* Cliente Responsável */}
                      <td>
                        <div style={{ fontWeight: 600, color: "var(--adm-text-main)" }}>{arr.client_name}</div>
                        <div style={{ fontSize: "11px", color: "var(--adm-text-muted)", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                          <Phone size={11} />
                          <span>{arr.client_phone || "Sem telefone"}</span>
                        </div>
                      </td>

                      {/* Quantidade de Passageiros */}
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Users size={14} color="var(--adm-clay)" />
                          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--adm-wine)" }}>
                            {arr.total_pax} PAX
                          </span>
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--adm-text-muted)", marginTop: "2px" }}>
                          {arr.adults_count} ad
                          {arr.children_count > 0 ? `, ${arr.children_count} ch` : ""}
                          {arr.infants_count > 0 ? `, ${arr.infants_count} bb` : ""}
                        </div>
                      </td>

                      {/* Hotel de Destino e Zona */}
                      <td>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}>
                          <Building size={14} color="var(--adm-text-muted)" style={{ marginTop: "2px", flexShrink: 0 }} />
                          <div>
                            <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--adm-text-main)" }}>
                              {arr.hotel_name || "Hotel não informado"}
                            </div>
                            {arr.hotel_zone ? (
                              <div style={{ fontSize: "11px", color: "var(--adm-clay)", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                                <MapPin size={10} />
                                <span>{arr.hotel_zone}</span>
                              </div>
                            ) : (
                              <div style={{ fontSize: "10px", color: "var(--adm-text-subtle)" }}>Zona não especificada</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Serviço de Traslado Vinculado */}
                      <td>
                        {arr.has_transfer ? (
                          <div>
                            <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--adm-wine)" }}>
                              {arr.transfer_product_name || "Traslado Aeroporto"}
                            </div>
                            <div style={{ fontSize: "11px", color: "var(--adm-text-muted)", marginTop: "2px" }}>
                              Fornecedor: <strong>{arr.transfer_supplier_name || "A definir"}</strong>
                            </div>
                            {arr.transfer_voucher_ref && (
                              <div style={{ fontSize: "10px", color: "var(--adm-clay)" }}>
                                Voucher: {arr.transfer_voucher_ref}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <span
                              style={{
                                fontSize: "11px",
                                background: "var(--adm-surface-alt)",
                                border: "1px solid var(--adm-border)",
                                padding: "2px 8px",
                                borderRadius: "4px",
                                color: "var(--adm-text-muted)",
                              }}
                            >
                              Não contratado
                            </span>
                            <div style={{ fontSize: "10px", color: "var(--adm-text-subtle)", marginTop: "3px" }}>
                              Recepção aeroporto
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Situação Operacional */}
                      <td>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "4px 10px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: 700,
                            background: statusConf.bg,
                            color: statusConf.color,
                            border: `1px solid ${statusConf.border}`,
                          }}
                        >
                          {statusConf.label}
                        </span>

                        {hasPendencies && (
                          <div style={{ marginTop: "4px" }}>
                            <span
                              style={{
                                fontSize: "10px",
                                color: "#c2410c",
                                fontWeight: 600,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "3px",
                              }}
                            >
                              <AlertTriangle size={10} />
                              <span>{arr.pendencies.length} pendência(s)</span>
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Ações Operacionais */}
                      <td style={{ textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          {/* Ação WhatsApp para Traslado */}
                          <button
                            type="button"
                            className="adm-btn adm-btn-icon adm-btn-outline adm-btn-sm"
                            title="Preparar mensagem para fornecedor via WhatsApp"
                            onClick={() => handleOpenWhatsAppModal(arr)}
                          >
                            <MessageSquare size={14} color="#15803d" />
                          </button>

                          {/* Ação Edição Operacional */}
                          <button
                            type="button"
                            className="adm-btn adm-btn-icon adm-btn-outline adm-btn-sm"
                            title="Editar informações operacionais"
                            onClick={() => handleOpenEditModal(arr)}
                          >
                            <Edit2 size={14} />
                          </button>

                          {/* Ação Ver Ficha Completa */}
                          <button
                            type="button"
                            className="adm-btn adm-btn-outline adm-btn-sm"
                            onClick={() => setSelectedArrival(arr)}
                          >
                            <Eye size={13} />
                            <span>Ficha</span>
                          </button>

                          {/* Registrar Ocorrência */}
                          <Link
                            href={`/admin/ocorrencias?new=true&contractId=${encodeURIComponent(arr.contract_id)}&contractNumber=${encodeURIComponent(arr.contract_number || "")}&clientName=${encodeURIComponent(arr.client_name || "")}&serviceName=Chegada Aeroporto&serviceDate=${encodeURIComponent(arr.arrival_date || "")}&supplierName=${encodeURIComponent(arr.transfer_supplier_name || "")}`}
                            className="adm-btn adm-btn-icon adm-btn-outline adm-btn-sm"
                            style={{ color: "#dc2626", borderColor: "#fca5a5" }}
                            title="Registrar ocorrência para esta chegada"
                          >
                            <ShieldAlert size={14} />
                          </Link>

                          {/* Criar Tarefa */}
                          <Link
                            href={`/admin/tarefas?new=true&contractId=${encodeURIComponent(arr.contract_id)}&contractNumber=${encodeURIComponent(arr.contract_number || "")}&clientName=${encodeURIComponent(arr.client_name || "")}&arrivalId=${encodeURIComponent(arr.id)}&serviceName=Chegada%20Aeroporto`}
                            className="adm-btn adm-btn-icon adm-btn-outline adm-btn-sm"
                            style={{ color: "#2563eb", borderColor: "#93c5fd" }}
                            title="Criar tarefa interna para esta chegada"
                          >
                            <CheckSquare size={14} />
                          </Link>
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

      {/* =========================================================================
          DRAWER / MODAL DE DETALHES COMPLETOS DA CHEGADA
         ========================================================================= */}
      {selectedArrival && (
        <div className="adm-modal-backdrop" onClick={() => setSelectedArrival(null)}>
          <div
            className="adm-modal-card"
            style={{ maxWidth: "760px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="adm-modal-header">
              <div>
                <span className="admin-brand-tag" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <Plane size={11} />
                  <span>FICHA OPERACIONAL DE CHEGADA</span>
                </span>
                <h3 style={{ fontSize: "20px", marginTop: "2px" }}>{selectedArrival.client_name}</h3>
                <span style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                  Chegada em {new Date(selectedArrival.arrival_date + "T12:00:00").toLocaleDateString("pt-BR")} · Contrato {selectedArrival.contract_number}
                </span>
              </div>
              <button
                type="button"
                className="adm-btn adm-btn-icon adm-btn-outline"
                onClick={() => setSelectedArrival(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="adm-modal-body" style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {/* Alerta de Pendências se houver */}
              {selectedArrival.pendencies.length > 0 && (
                <div
                  style={{
                    background: "#fff7ed",
                    border: "1px solid #fed7aa",
                    borderRadius: "8px",
                    padding: "12px 16px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#c2410c", fontWeight: 700, fontSize: "13px" }}>
                    <AlertTriangle size={16} />
                    <span>Atenção: Existem pendências operacionais</span>
                  </div>
                  <ul style={{ margin: "6px 0 0 24px", padding: 0, fontSize: "12px", color: "#9a3412" }}>
                    {selectedArrival.pendencies.map((p, idx) => (
                      <li key={idx} style={{ marginTop: "2px" }}>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Informações dos Voos e Passageiros */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "14px",
                  background: "var(--adm-surface-alt)",
                  padding: "16px",
                  borderRadius: "10px",
                  border: "1px solid var(--adm-border)",
                }}
              >
                {/* Voo de Chegada */}
                <div>
                  <div style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--adm-text-muted)", fontWeight: 700 }}>
                    Voo de Chegada (Inbound)
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "16px", color: "var(--adm-wine)", marginTop: "2px" }}>
                    {selectedArrival.arrival_flight_number || "Não informado"}
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--adm-text-main)", marginTop: "2px" }}>
                    Horário: <strong>{selectedArrival.arrival_flight_time || "Não informado"}</strong>
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--adm-text-muted)", marginTop: "2px" }}>
                    Data: {new Date(selectedArrival.arrival_date + "T12:00:00").toLocaleDateString("pt-BR")}
                  </div>
                </div>

                {/* Voo de Retorno */}
                <div>
                  <div style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--adm-text-muted)", fontWeight: 700 }}>
                    Voo de Retorno (Outbound)
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "16px", color: "var(--adm-wine)", marginTop: "2px" }}>
                    {selectedArrival.depart_flight_number || "Não informado"}
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--adm-text-main)", marginTop: "2px" }}>
                    Horário: <strong>{selectedArrival.depart_flight_time || "Não informado"}</strong>
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--adm-text-muted)", marginTop: "2px" }}>
                    Data: {selectedArrival.departure_date ? new Date(selectedArrival.departure_date + "T12:00:00").toLocaleDateString("pt-BR") : "Não informada"}
                  </div>
                </div>

                {/* Passageiros e Contato */}
                <div style={{ borderTop: "1px dashed var(--adm-border)", paddingTop: "12px", gridColumn: "span 2", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <span style={{ fontSize: "11px", color: "var(--adm-text-muted)", display: "block" }}>PASSAGEIROS</span>
                    <strong style={{ fontSize: "14px" }}>
                      {selectedArrival.total_pax} PAX ({selectedArrival.adults_count} Adultos, {selectedArrival.children_count} Crianças, {selectedArrival.infants_count} Bebês)
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "var(--adm-text-muted)", display: "block" }}>CONTATOS DO CLIENTE</span>
                    <span style={{ fontSize: "13px" }}>
                      Telefone: <strong>{selectedArrival.client_phone || "Não informado"}</strong> | E-mail: <strong>{selectedArrival.client_email || "Não informado"}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Seção Hotel e Hospedagem */}
              <div>
                <h4 style={{ fontSize: "14px", color: "var(--adm-wine)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Building size={15} color="var(--adm-clay)" />
                  <span>Hotel de Destino e Região</span>
                </h4>
                <div style={{ padding: "12px 14px", background: "#fff", border: "1px solid var(--adm-border)", borderRadius: "8px", fontSize: "13px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong>{selectedArrival.hotel_name || "Hotel não informado"}</strong>
                    <span style={{ fontSize: "12px", color: "var(--adm-clay)", fontWeight: 600 }}>
                      Zona: {selectedArrival.hotel_zone || "Não informada"}
                    </span>
                  </div>

                  {selectedArrival.hotels_schedule && selectedArrival.hotels_schedule.length > 1 && (
                    <div style={{ marginTop: "10px", borderTop: "1px solid var(--adm-border)", paddingTop: "8px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--adm-text-muted)", textTransform: "uppercase" }}>
                        Itinerário de Troca de Hotéis ({selectedArrival.hotels_schedule.length} hotéis)
                      </span>
                      {selectedArrival.hotels_schedule.map((h: any, idx: number) => (
                        <div key={idx} style={{ fontSize: "12px", color: "var(--adm-text-main)", marginTop: "4px" }}>
                          • <strong>{h.hotel_name || "Hotel"}</strong> (Check-in: {h.checkin || "—"} / Check-out: {h.checkout || "—"})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Seção Serviço de Traslado */}
              <div>
                <h4 style={{ fontSize: "14px", color: "var(--adm-wine)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Car size={15} color="var(--adm-clay)" />
                  <span>Serviço de Traslado Aeroporto</span>
                </h4>

                {selectedArrival.has_transfer ? (
                  <div style={{ padding: "14px", background: "#fff", border: "1px solid var(--adm-border)", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--adm-wine)" }}>
                          {selectedArrival.transfer_product_name || "Traslado Contratado"}
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--adm-text-muted)", marginTop: "2px" }}>
                          Fornecedor Responsável: <strong>{selectedArrival.transfer_supplier_name || "Não definido"}</strong>
                        </div>
                      </div>

                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: "6px",
                          background: "#e0e7ff",
                          color: "#4338ca",
                        }}
                      >
                        Status: {selectedArrival.transfer_status || "pendente"}
                      </span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "12px", background: "var(--adm-surface-alt)", padding: "10px", borderRadius: "6px" }}>
                      <div>
                        <span style={{ color: "var(--adm-text-muted)" }}>Horário de Pickup:</span>{" "}
                        <strong>{selectedArrival.transfer_pickup_time || "Não informado"}</strong>
                      </div>
                      <div>
                        <span style={{ color: "var(--adm-text-muted)" }}>Código / Voucher:</span>{" "}
                        <strong>{selectedArrival.transfer_voucher_ref || selectedArrival.transfer_confirmation_code || "Não emitido"}</strong>
                      </div>
                      <div>
                        <span style={{ color: "var(--adm-text-muted)" }}>WhatsApp Fornecedor:</span>{" "}
                        <strong>{selectedArrival.transfer_supplier_whatsapp || selectedArrival.transfer_supplier_phone || "Não cadastrado"}</strong>
                      </div>
                      <div>
                        <span style={{ color: "var(--adm-text-muted)" }}>Reserva Operacional:</span>{" "}
                        <Link href="/admin/reservas" style={{ color: "var(--adm-wine)", textDecoration: "underline", fontWeight: 600 }}>
                          Ver em Reservas →
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: "14px", background: "var(--adm-surface-alt)", border: "1px dashed var(--adm-border)", borderRadius: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--adm-text-muted)", fontSize: "13px" }}>
                      <Info size={15} />
                      <span><strong>Traslado não contratado neste pacote:</strong> O cliente cuidará do próprio transporte ou será recepcionado diretamente no ponto de encontro.</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Responsável e Observações Operacionais */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--adm-text-muted)", textTransform: "uppercase" }}>
                    Responsável / Agente Operacional
                  </label>
                  <div style={{ fontSize: "13px", fontWeight: 600, marginTop: "4px" }}>
                    {selectedArrival.assigned_agent || "Não atribuído"}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--adm-text-muted)", textTransform: "uppercase" }}>
                    Vendedor do Contrato
                  </label>
                  <div style={{ fontSize: "13px", fontWeight: 600, marginTop: "4px" }}>
                    {selectedArrival.seller_name || "Agência Tío Nenê"}
                  </div>
                </div>

                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--adm-text-muted)", textTransform: "uppercase" }}>
                    Observações Operacionais
                  </label>
                  <div style={{ fontSize: "13px", color: "var(--adm-text-main)", background: "#fff", padding: "10px", border: "1px solid var(--adm-border)", borderRadius: "6px", marginTop: "4px", minHeight: "44px" }}>
                    {selectedArrival.notes || "Nenhuma observação interna cadastrada."}
                  </div>
                </div>
              </div>
            </div>

            <div className="adm-modal-footer">
              <div style={{ display: "flex", gap: "8px" }}>
                <Link
                  href={`/admin/contratos?search=${selectedArrival.contract_number}`}
                  className="adm-btn adm-btn-outline adm-btn-sm"
                  title="Acessar contrato e itinerário"
                >
                  <FileText size={14} />
                  <span>Ver Contrato</span>
                </Link>

                {selectedArrival.has_transfer && (
                  <Link href="/admin/reservas" className="adm-btn adm-btn-outline adm-btn-sm" title="Acessar central de reservas">
                    <Car size={14} />
                    <span>Ver Reserva</span>
                  </Link>
                )}
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className="adm-btn adm-btn-outline adm-btn-sm"
                  onClick={() => handleOpenWhatsAppModal(selectedArrival)}
                >
                  <MessageSquare size={14} color="#15803d" />
                  <span>WhatsApp</span>
                </button>

                <button
                  type="button"
                  className="adm-btn adm-btn-wine adm-btn-sm"
                  onClick={() => handleOpenEditModal(selectedArrival)}
                >
                  <Edit2 size={14} />
                  <span>Editar Operacional</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL DE ENVIO VIA WHATSAPP COM CONFIRMAÇÃO EXPLÍCITA (TAREFA 19 / TAREFA 23)
         ========================================================================= */}
      {whatsappModal.open && (
        <div className="adm-modal-backdrop" onClick={() => setWhatsappModal((prev) => ({ ...prev, open: false }))}>
          <div
            className="adm-modal-card"
            style={{ maxWidth: "620px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="adm-modal-header">
              <div>
                <span className="admin-brand-tag" style={{ color: "#15803d" }}>COMUNICAÇÃO OPERACIONAL VIA WHATSAPP</span>
                <h3 style={{ fontSize: "18px", marginTop: "2px" }}>Solicitação de Traslado / Chegada</h3>
                <span style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                  Cliente: <strong>{whatsappModal.arrival?.client_name}</strong> · Contrato {whatsappModal.arrival?.contract_number}
                </span>
              </div>
              <button
                type="button"
                className="adm-btn adm-btn-icon adm-btn-outline"
                onClick={() => setWhatsappModal((prev) => ({ ...prev, open: false }))}
              >
                <X size={16} />
              </button>
            </div>

            <div className="adm-modal-body" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "10px 14px", borderRadius: "8px", fontSize: "12px", color: "#166534" }}>
                <strong>Segurança e Confidencialidade:</strong> Esta mensagem contém estritamente informações logísticas de voo, hotel e passageiros. Valores de venda, custos e margens nunca são incluídos.
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--adm-text-muted)", marginBottom: "4px" }}>
                  TELEFONE / WHATSAPP DO DESTINATÁRIO
                </label>
                <input
                  type="text"
                  className="adm-input"
                  style={{ width: "100%" }}
                  placeholder="Ex: 5511999999999 ou 529981234567"
                  value={whatsappModal.targetPhone}
                  onChange={(e) => setWhatsappModal((prev) => ({ ...prev, targetPhone: e.target.value }))}
                />
                <span style={{ fontSize: "11px", color: "var(--adm-text-muted)", marginTop: "2px", display: "block" }}>
                  Número pré-carregado do fornecedor de traslado ou receptivo.
                </span>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--adm-text-muted)" }}>
                    MENSAGEM PREPARADA (EDITÁVEL)
                  </label>
                  <button
                    type="button"
                    className="adm-btn adm-btn-outline adm-btn-sm"
                    style={{ fontSize: "11px", padding: "2px 8px" }}
                    onClick={() => {
                      navigator.clipboard.writeText(whatsappModal.customMessage);
                      setWhatsappModal((prev) => ({ ...prev, copied: true }));
                      setTimeout(() => setWhatsappModal((prev) => ({ ...prev, copied: false })), 2000);
                    }}
                  >
                    {whatsappModal.copied ? <Check size={12} /> : <Copy size={12} />}
                    <span>{whatsappModal.copied ? "Copiado!" : "Copiar Texto"}</span>
                  </button>
                </div>
                <textarea
                  className="adm-input"
                  rows={9}
                  style={{ width: "100%", fontFamily: "monospace", fontSize: "12px", lineHeight: "1.5" }}
                  value={whatsappModal.customMessage}
                  onChange={(e) => setWhatsappModal((prev) => ({ ...prev, customMessage: e.target.value }))}
                />
              </div>

              <div style={{ background: "var(--adm-surface-alt)", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--adm-border)", fontSize: "12px", color: "var(--adm-text-muted)" }}>
                <strong>Regra Operacional:</strong> Clicar em "Abrir no WhatsApp" não altera o status automaticamente. Após enviar a mensagem pelo WhatsApp, utilize o botão <strong>"Confirmar Envio"</strong> para avançar o status para <em>Solicitada</em>.
              </div>
            </div>

            <div className="adm-modal-footer">
              <button
                type="button"
                className="adm-btn adm-btn-outline adm-btn-sm"
                onClick={() => setWhatsappModal((prev) => ({ ...prev, open: false }))}
              >
                <span>Cancelar</span>
              </button>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className="adm-btn adm-btn-outline adm-btn-sm"
                  style={{ color: "#15803d", borderColor: "#86efac" }}
                  onClick={handleOpenWhatsAppLink}
                >
                  <MessageSquare size={14} />
                  <span>Abrir no WhatsApp</span>
                </button>

                <button
                  type="button"
                  className="adm-btn adm-btn-wine adm-btn-sm"
                  onClick={handleConfirmWhatsAppSent}
                  disabled={whatsappModal.submitting}
                >
                  <Send size={14} />
                  <span>{whatsappModal.submitting ? "Confirmando..." : "Confirmar Envio"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL DE EDIÇÃO OPERACIONAL AUTORIZADA
         ========================================================================= */}
      {editModal.open && (
        <div className="adm-modal-backdrop" onClick={() => setEditModal((prev) => ({ ...prev, open: false }))}>
          <div
            className="adm-modal-card"
            style={{ maxWidth: "560px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSaveOperationalEdit}>
              <div className="adm-modal-header">
                <div>
                  <span className="admin-brand-tag">EDIÇÃO OPERACIONAL</span>
                  <h3 style={{ fontSize: "18px", marginTop: "2px" }}>Ajustar Dados Logísticos</h3>
                  <span style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                    Cliente: <strong>{editModal.arrival?.client_name}</strong> · Contrato {editModal.arrival?.contract_number}
                  </span>
                </div>
                <button
                  type="button"
                  className="adm-btn adm-btn-icon adm-btn-outline"
                  onClick={() => setEditModal((prev) => ({ ...prev, open: false }))}
                >
                  <X size={16} />
                </button>
              </div>

              <div className="adm-modal-body" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ background: "var(--adm-surface-alt)", border: "1px solid var(--adm-border)", padding: "10px 14px", borderRadius: "8px", fontSize: "12px", color: "var(--adm-text-muted)" }}>
                  <strong>Integridade Contratual:</strong> Esta edição afeta exclusivamente a logística operacional (status, motorista e notas). Não modifica os valores da venda, dados fiscais ou o PDF emitido.
                </div>

                {/* Status Operacional */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--adm-text-muted)", marginBottom: "4px" }}>
                    STATUS OPERACIONAL DA CHEGADA
                  </label>
                  <select
                    className="adm-input"
                    style={{ width: "100%" }}
                    value={editModal.status}
                    onChange={(e) => setEditModal((prev) => ({ ...prev, status: e.target.value as ArrivalOperationalStatus }))}
                  >
                    <option value="pendente_info">Pendente de Informações</option>
                    <option value="aguardando_solicitacao">Aguardando Solicitação</option>
                    <option value="solicitada">Solicitação Enviada</option>
                    <option value="confirmada">Confirmada</option>
                    <option value="em_atendimento">Em Atendimento</option>
                    <option value="concluida">Concluída</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>

                {/* Agente / Motorista Responsável */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--adm-text-muted)", marginBottom: "4px" }}>
                    AGENTE / MOTORISTA OPERACIONAL RESPONSÁVEL
                  </label>
                  <input
                    type="text"
                    className="adm-input"
                    style={{ width: "100%" }}
                    placeholder="Ex: Carlos (Van 04), Receptivo Tío Nenê..."
                    value={editModal.assignedAgent}
                    onChange={(e) => setEditModal((prev) => ({ ...prev, assignedAgent: e.target.value }))}
                  />
                </div>

                {/* Se houver reserva de traslado vinculada, permitir editar campos do traslado */}
                {editModal.arrival?.has_transfer && (
                  <div style={{ background: "#fff", border: "1px solid var(--adm-border)", borderRadius: "8px", padding: "12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--adm-text-muted)", marginBottom: "4px" }}>
                        HORÁRIO DO PICKUP
                      </label>
                      <input
                        type="text"
                        className="adm-input"
                        style={{ width: "100%", fontSize: "13px" }}
                        placeholder="Ex: 14:30"
                        value={editModal.pickupTime}
                        onChange={(e) => setEditModal((prev) => ({ ...prev, pickupTime: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--adm-text-muted)", marginBottom: "4px" }}>
                        CÓDIGO DE VOUCHER / CONFIRMAÇÃO
                      </label>
                      <input
                        type="text"
                        className="adm-input"
                        style={{ width: "100%", fontSize: "13px" }}
                        placeholder="Ex: TRF-98214"
                        value={editModal.voucherRef}
                        onChange={(e) => setEditModal((prev) => ({ ...prev, voucherRef: e.target.value }))}
                      />
                    </div>
                  </div>
                )}

                {/* Observações Operacionais */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--adm-text-muted)", marginBottom: "4px" }}>
                    OBSERVAÇÕES OPERACIONAIS INTERNAS
                  </label>
                  <textarea
                    className="adm-input"
                    rows={4}
                    style={{ width: "100%" }}
                    placeholder="Ex: Passageiro solicitou cadeirinha de bebê. Aguardará no portão 4 do terminal 3."
                    value={editModal.notes}
                    onChange={(e) => setEditModal((prev) => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </div>

              <div className="adm-modal-footer">
                <button
                  type="button"
                  className="adm-btn adm-btn-outline adm-btn-sm"
                  onClick={() => setEditModal((prev) => ({ ...prev, open: false }))}
                >
                  <span>Cancelar</span>
                </button>

                <button
                  type="submit"
                  className="adm-btn adm-btn-wine adm-btn-sm"
                  disabled={editModal.submitting}
                >
                  <Check size={14} />
                  <span>{editModal.submitting ? "Salvando..." : "Salvar Alterações"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
