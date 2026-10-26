"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuthProfile } from "@/lib/auth/AuthContext";
import {
  OperationalReservation,
  OperationalReservationStatus,
  OperationalReservationHistoryEntry,
} from "@/types/operational";
import {
  generateSupplierConfirmationMessage,
  formatWhatsAppLink,
  detectReservationPendencies,
} from "@/lib/operational/supplierMessaging";
import { updateOperationalReservation } from "@/lib/operational/updateReservation";
import {
  CalendarCheck,
  Search,
  Edit2,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  X,
  Hotel,
  Users,
  Calendar,
  MapPin,
  Ticket,
  ChevronRight,
  Info,
  DollarSign,
  AlertTriangle,
  FileText,
  Filter,
  ExternalLink,
  Send,
  MessageSquare,
  Copy,
  History,
  AlertCircle,
  Phone,
  Check,
  Eye,
  SlidersHorizontal,
  CalendarDays,
  ShieldCheck,
  ArrowUpDown,
  Wallet,
  ShieldAlert,
  CheckSquare,
} from "lucide-react";

interface ReservationDisplay extends OperationalReservation {
  contract_number?: string;
  client_phone?: string;
  client_email?: string;
  supplier_phone?: string | null;
  supplier_whatsapp?: string | null;
  supplier_contact_name?: string | null;
}

const STATUS_CONFIG: Record<
  OperationalReservationStatus,
  { label: string; bg: string; color: string; border: string; desc: string }
> = {
  pendente: {
    label: "Pendente",
    bg: "#fef3c7",
    color: "#b45309",
    border: "#fde68a",
    desc: "Aguardando envio de solicitação ao fornecedor",
  },
  solicitada: {
    label: "Solicitada",
    bg: "#e0e7ff",
    color: "#4338ca",
    border: "#c7d2fe",
    desc: "Mensagem de reserva enviada ao fornecedor",
  },
  aguardando_fornecedor: {
    label: "Aguardando Fornecedor",
    bg: "#f3e8ff",
    color: "#7e22ce",
    border: "#e9d5ff",
    desc: "Aguardando confirmação do código e horário pelo fornecedor",
  },
  confirmada: {
    label: "Confirmada",
    bg: "#dcfce7",
    color: "#15803d",
    border: "#86efac",
    desc: "Confirmada pelo fornecedor com código / voucher emitido",
  },
  realizada: {
    label: "Realizada",
    bg: "#f1f5f9",
    color: "#475569",
    border: "#cbd5e1",
    desc: "Passeio ou transfer executado com sucesso",
  },
  pendente_info: {
    label: "Pendente de Info",
    bg: "#ffedd5",
    color: "#c2410c",
    border: "#fed7aa",
    desc: "Faltam dados essenciais do cliente ou logística",
  },
  cancelada: {
    label: "Cancelada",
    bg: "#fee2e2",
    color: "#b91c1c",
    border: "#fca5a5",
    desc: "Reserva cancelada pelo cliente ou fornecedor",
  },
};

export default function AdminReservationsPage() {
  const { role, hasPermission } = useAuthProfile();
  const isAdmin = role === "admin";
  // Custos e dados financeiros de fornecedores são estritamente exclusivos de Administrador (Tarefa 20)
  const canViewCosts = isAdmin;

  const [reservations, setReservations] = useState<ReservationDisplay[]>([]);
  const [suppliersMap, setSuppliersMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [dateEndFilter, setDateEndFilter] = useState("");
  const [onlyPendencies, setOnlyPendencies] = useState(false);
  const [onlyToday, setOnlyToday] = useState(false);
  const [sortBy, setSortBy] = useState<"date_asc" | "date_desc" | "client">("date_asc");

  // Modais
  const [whatsappModal, setWhatsappModal] = useState<{
    open: boolean;
    reservation: ReservationDisplay | null;
    customMessage: string;
    targetPhone: string;
    copied: boolean;
    channel: string;
    submitting: boolean;
  }>({
    open: false,
    reservation: null,
    customMessage: "",
    targetPhone: "",
    copied: false,
    channel: "whatsapp",
    submitting: false,
  });

  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    reservation: ReservationDisplay | null;
    supplierConfirmationCode: string;
    pickupTime: string;
    pickupLocation: string;
    voucherRef: string;
    notes: string;
    submitting: boolean;
  }>({
    open: false,
    reservation: null,
    supplierConfirmationCode: "",
    pickupTime: "",
    pickupLocation: "",
    voucherRef: "",
    notes: "",
    submitting: false,
  });

  const [editModal, setEditModal] = useState<{
    open: boolean;
    reservation: ReservationDisplay | null;
    status: OperationalReservationStatus;
    pickupTime: string;
    pickupLocation: string;
    supplierConfirmationCode: string;
    voucherRef: string;
    specialInstructions: string;
    notes: string;
    actualCost: number | null;
    submitting: boolean;
  }>({
    open: false,
    reservation: null,
    status: "pendente",
    pickupTime: "",
    pickupLocation: "",
    supplierConfirmationCode: "",
    voucherRef: "",
    specialInstructions: "",
    notes: "",
    actualCost: null,
    submitting: false,
  });

  const [historyModal, setHistoryModal] = useState<{
    open: boolean;
    reservation: ReservationDisplay | null;
  }>({
    open: false,
    reservation: null,
  });

  // Carregar dados
  const fetchReservations = async () => {
    setLoading(true);
    try {
      // 1. Carregar fornecedores com telefones/whatsapp para comunicação
      const { data: suppliersData } = await supabase
        .from("suppliers")
        .select("id, name, trade_name, contact_name, phone, whatsapp, email");

      const sMap: Record<string, any> = {};
      (suppliersData || []).forEach((s: any) => {
        sMap[s.id] = s;
        if (s.name) sMap[s.name.toLowerCase().trim()] = s;
        if (s.trade_name) sMap[s.trade_name.toLowerCase().trim()] = s;
      });
      setSuppliersMap(sMap);

      // 2. Buscar da tabela oficial `operational_reservations`
      const { data: opData, error: opError } = await supabase
        .from("operational_reservations")
        .select(`
          *,
          contracts (
            contract_number,
            client_phone,
            client_email
          )
        `)
        .order("tour_date", { ascending: true });

      if (!opError && opData && opData.length > 0) {
        const mapped: ReservationDisplay[] = opData.map((item: any) => {
          const suppInfo =
            item.supplier_id && sMap[item.supplier_id]
              ? sMap[item.supplier_id]
              : item.supplier_name
              ? sMap[item.supplier_name.toLowerCase().trim()]
              : null;

          return {
            ...item,
            contract_number: item.contracts?.contract_number || "TN-XXXX",
            client_phone: item.contracts?.client_phone || "",
            client_email: item.contracts?.client_email || "",
            supplier_phone: suppInfo?.whatsapp || suppInfo?.phone || null,
            supplier_whatsapp: suppInfo?.whatsapp || null,
            supplier_contact_name: suppInfo?.contact_name || null,
          };
        });
        setReservations(mapped);
        return;
      }

      // 3. Fallback: Se ainda não tiver registros na tabela operacional,
      // busca dos contratos com status finalizado ou emitido
      const { data: contractsData, error: contractsError } = await supabase
        .from("contracts")
        .select(`
          id,
          contract_number,
          client_id,
          client_name,
          client_phone,
          client_email,
          status,
          hotels_schedule,
          contract_items (*)
        `)
        .order("arrival_date", { ascending: false });

      if (contractsError) throw contractsError;

      const fallbackList: ReservationDisplay[] = [];
      (contractsData || []).forEach((c: any) => {
        const hotelName = c.hotels_schedule?.[0]?.hotel_name || null;
        const hotelZone = c.hotels_schedule?.[0]?.zone || null;

        (c.contract_items || []).forEach((it: any) => {
          const suppInfo =
            it.supplier_id && sMap[it.supplier_id]
              ? sMap[it.supplier_id]
              : it.supplier_name_snapshot
              ? sMap[it.supplier_name_snapshot.toLowerCase().trim()]
              : null;

          fallbackList.push({
            id: it.id || `${c.id}-${it.tour_id || Math.random()}`,
            contract_id: c.id,
            contract_item_id: it.id,
            client_id: c.client_id,
            client_name: c.client_name,
            client_phone: c.client_phone,
            client_email: c.client_email,
            contract_number: c.contract_number,
            supplier_id: it.supplier_id,
            supplier_name: it.supplier_name_snapshot || "Operadora Local",
            supplier_phone: suppInfo?.whatsapp || suppInfo?.phone || null,
            supplier_whatsapp: suppInfo?.whatsapp || null,
            supplier_contact_name: suppInfo?.contact_name || null,
            product_name: it.tour_name_snapshot || "Passeio",
            tour_id_code: it.tour_id_code_snapshot || null,
            rate_id_code: it.rate_id_snapshot || it.tariff_code_snapshot || null,
            tour_date: it.tour_date || c.arrival_date,
            pickup_time: it.pickup_time || null,
            pickup_location: hotelName,
            hotel_zone: hotelZone,
            adults_count: it.adults_count || 1,
            children_count: it.children_count || 0,
            infants_count: 0,
            units_count: it.units_count || 1,
            legs_count: it.legs_count || 1,
            supplier_confirmation_code: it.supplier_confirmation_code || null,
            voucher_ref: it.voucher_ref || null,
            status:
              c.status === "finalizado"
                ? it.voucher_ref
                  ? "confirmada"
                  : "pendente"
                : "pendente",
            is_unknown_cost: it.is_unknown_cost ?? false,
            cost_currency: it.native_currency || it.cost_currency || "USD",
            estimated_cost:
              it.native_calculated_total_cost ??
              it.calculated_total_cost ??
              it.cost_applied ??
              0,
            actual_cost: null,
            special_instructions: it.tour_included_snapshot || null,
            notes: it.notes || null,
            created_at: c.created_at || new Date().toISOString(),
            updated_at: c.updated_at || new Date().toISOString(),
          });
        });
      });

      setReservations(fallbackList);
    } catch (err: any) {
      console.error("Erro ao carregar reservas:", err);
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("search") || params.get("q") || params.get("id");
      if (q) setSearchTerm(q);
    }
  }, []);

  // Lista única de Fornecedores para o filtro
  const uniqueSuppliers = useMemo(() => {
    const set = new Set<string>();
    reservations.forEach((r) => {
      if (r.supplier_name) set.add(r.supplier_name);
    });
    return Array.from(set).sort();
  }, [reservations]);

  // Data de Hoje
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Filtragem e Ordenação
  const filteredReservations = useMemo(() => {
    return reservations
      .filter((r) => {
        const term = searchTerm.toLowerCase();
        const matchesSearch =
          !searchTerm ||
          r.client_name?.toLowerCase().includes(term) ||
          r.contract_number?.toLowerCase().includes(term) ||
          r.product_name?.toLowerCase().includes(term) ||
          r.voucher_ref?.toLowerCase().includes(term) ||
          r.supplier_confirmation_code?.toLowerCase().includes(term);

        const matchesSupplier =
          supplierFilter === "all" || r.supplier_name === supplierFilter;

        const matchesStatus = statusFilter === "all" || r.status === statusFilter;

        // Filtro de Data
        let matchesDate = true;
        if (onlyToday) {
          matchesDate = r.tour_date === todayStr;
        } else if (dateFilter && dateEndFilter) {
          matchesDate = r.tour_date >= dateFilter && r.tour_date <= dateEndFilter;
        } else if (dateFilter) {
          matchesDate = r.tour_date === dateFilter;
        }

        // Filtro de Pendências
        const pendencies = detectReservationPendencies(r);
        const matchesPendencies = !onlyPendencies || pendencies.length > 0;

        return (
          matchesSearch &&
          matchesSupplier &&
          matchesStatus &&
          matchesDate &&
          matchesPendencies
        );
      })
      .sort((a, b) => {
        if (sortBy === "date_asc") {
          return (a.tour_date || "").localeCompare(b.tour_date || "");
        } else if (sortBy === "date_desc") {
          return (b.tour_date || "").localeCompare(a.tour_date || "");
        } else {
          return (a.client_name || "").localeCompare(b.client_name || "");
        }
      });
  }, [
    reservations,
    searchTerm,
    supplierFilter,
    statusFilter,
    dateFilter,
    dateEndFilter,
    onlyPendencies,
    onlyToday,
    todayStr,
    sortBy,
  ]);

  // KPIs
  const kpis = useMemo(() => {
    const total = reservations.length;
    const hoje = reservations.filter((r) => r.tour_date === todayStr).length;
    const pendentes = reservations.filter(
      (r) =>
        r.status === "pendente" ||
        r.status === "solicitada" ||
        r.status === "aguardando_fornecedor" ||
        r.status === "pendente_info"
    ).length;
    const confirmadas = reservations.filter((r) => r.status === "confirmada").length;
    const comPendencias = reservations.filter(
      (r) => detectReservationPendencies(r).length > 0
    ).length;
    return { total, hoje, pendentes, confirmadas, comPendencias };
  }, [reservations, todayStr]);

  // =========================================================================
  // HANDLERS DE AÇÕES
  // =========================================================================

  // 1. Abrir Modal de Solicitação WhatsApp
  const handleOpenWhatsAppModal = (res: ReservationDisplay) => {
    const message = generateSupplierConfirmationMessage(res);
    setWhatsappModal({
      open: true,
      reservation: res,
      customMessage: message,
      targetPhone: res.supplier_whatsapp || res.supplier_phone || "",
      copied: false,
      channel: "whatsapp",
      submitting: false,
    });
  };

  // 1.1 Copiar mensagem
  const handleCopyMessage = () => {
    if (!whatsappModal.customMessage) return;
    navigator.clipboard.writeText(whatsappModal.customMessage);
    setWhatsappModal((prev) => ({ ...prev, copied: true }));
    setTimeout(() => {
      setWhatsappModal((prev) => ({ ...prev, copied: false }));
    }, 2500);
  };

  // 1.2 Registrar envio da solicitação (atualiza status para solicitada)
  const handleRegisterRequestSent = async () => {
    if (!whatsappModal.reservation) return;
    setWhatsappModal((prev) => ({ ...prev, submitting: true }));
    try {
      await updateOperationalReservation(supabase, {
        reservationId: whatsappModal.reservation.id,
        status: "solicitada",
        supplierRequestedAt: new Date().toISOString(),
        supplierRequestChannel: whatsappModal.channel,
        actionDescription: `Solicitação enviada ao fornecedor via ${whatsappModal.channel}`,
        isAdmin,
      });

      alert("Solicitação registrada com sucesso! Status alterado para 'Solicitada'.");
      setWhatsappModal((prev) => ({ ...prev, open: false, submitting: false }));
      await fetchReservations();
    } catch (err: any) {
      alert("Erro ao registrar solicitação: " + (err.message || "Tente novamente"));
      setWhatsappModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  // 2. Abrir Modal de Confirmação do Fornecedor
  const handleOpenConfirmModal = (res: ReservationDisplay) => {
    setConfirmModal({
      open: true,
      reservation: res,
      supplierConfirmationCode: res.supplier_confirmation_code || "",
      pickupTime: res.pickup_time || "",
      pickupLocation: res.pickup_location || "",
      voucherRef: res.voucher_ref || "",
      notes: res.notes || "",
      submitting: false,
    });
  };

  const handleSaveConfirmation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmModal.reservation) return;

    if (!confirmModal.supplierConfirmationCode && !confirmModal.voucherRef) {
      if (
        !confirm(
          "Deseja confirmar a reserva mesmo sem preencher o Código de Confirmação ou Voucher do fornecedor?"
        )
      ) {
        return;
      }
    }

    setConfirmModal((prev) => ({ ...prev, submitting: true }));
    try {
      await updateOperationalReservation(supabase, {
        reservationId: confirmModal.reservation.id,
        status: "confirmada",
        supplierConfirmationCode: confirmModal.supplierConfirmationCode,
        pickupTime: confirmModal.pickupTime,
        pickupLocation: confirmModal.pickupLocation,
        voucherRef: confirmModal.voucherRef,
        notes: confirmModal.notes,
        supplierConfirmedAt: new Date().toISOString(),
        actionDescription: `Reserva confirmada pelo fornecedor. Cód: ${confirmModal.supplierConfirmationCode || "N/A"}`,
        isAdmin,
      });

      alert("Reserva confirmada com sucesso!");
      setConfirmModal((prev) => ({ ...prev, open: false, submitting: false }));
      await fetchReservations();
    } catch (err: any) {
      alert("Erro ao confirmar reserva: " + (err.message || "Tente novamente"));
      setConfirmModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  // 3. Abrir Modal de Edição Geral
  const handleOpenEditModal = (res: ReservationDisplay) => {
    setEditModal({
      open: true,
      reservation: res,
      status: res.status,
      pickupTime: res.pickup_time || "",
      pickupLocation: res.pickup_location || "",
      supplierConfirmationCode: res.supplier_confirmation_code || "",
      voucherRef: res.voucher_ref || "",
      specialInstructions: res.special_instructions || "",
      notes: res.notes || "",
      actualCost: res.actual_cost ?? null,
      submitting: false,
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal.reservation) return;

    setEditModal((prev) => ({ ...prev, submitting: true }));
    try {
      await updateOperationalReservation(supabase, {
        reservationId: editModal.reservation.id,
        status: editModal.status,
        pickupTime: editModal.pickupTime,
        pickupLocation: editModal.pickupLocation,
        supplierConfirmationCode: editModal.supplierConfirmationCode,
        voucherRef: editModal.voucherRef,
        specialInstructions: editModal.specialInstructions,
        notes: editModal.notes,
        actualCost: isAdmin ? editModal.actualCost : undefined,
        actionDescription: `Edição de dados operacionais (Status: ${editModal.status})`,
        isAdmin,
      });

      alert("Dados operacionais atualizados com sucesso!");
      setEditModal((prev) => ({ ...prev, open: false, submitting: false }));
      await fetchReservations();
    } catch (err: any) {
      alert("Erro ao atualizar reserva: " + (err.message || "Tente novamente"));
      setEditModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  // 4. Abrir Modal de Histórico
  const handleOpenHistoryModal = (res: ReservationDisplay) => {
    setHistoryModal({ open: true, reservation: res });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Cabeçalho */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <span className="admin-brand-tag">CENTRAL DE OPERAÇÕES</span>
          <h2 style={{ fontSize: "28px", color: "var(--adm-wine)" }}>Central Operacional de Reservas</h2>
          <p style={{ color: "var(--adm-text-muted)", fontSize: "14px", marginTop: "2px" }}>
            Acompanhe serviços vendidos, solicite confirmações pelo WhatsApp e gerencie pick-ups e vouchers.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            className={`adm-btn ${onlyToday ? "adm-btn-clay" : "adm-btn-outline"}`}
            onClick={() => {
              setOnlyToday(!onlyToday);
              if (!onlyToday) {
                setDateFilter(todayStr);
                setDateEndFilter("");
              } else {
                setDateFilter("");
              }
            }}
            title="Filtrar passeios agendados para a data de hoje"
          >
            <CalendarDays size={15} />
            <span>Reservas de Hoje ({kpis.hoje})</span>
          </button>

          <button
            type="button"
            className={`adm-btn ${onlyPendencies ? "adm-btn-primary" : "adm-btn-outline"}`}
            onClick={() => setOnlyPendencies(!onlyPendencies)}
            title="Filtrar reservas com horários, vouchers ou confirmações pendentes"
          >
            <AlertTriangle size={15} color={onlyPendencies ? "#fff" : "#d97706"} />
            <span>Pendências ({kpis.comPendencias})</span>
          </button>

          <button
            type="button"
            className="adm-btn adm-btn-outline"
            onClick={fetchReservations}
            disabled={loading}
            title="Atualizar lista de reservas"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Atualizar</span>
          </button>

          <Link href="/admin/vouchers" className="adm-btn adm-btn-outline" title="Acessar Central de Vouchers dos Clientes">
            <Ticket size={15} />
            <span>Vouchers</span>
          </Link>

          <Link href="/admin/carteiras" className="adm-btn adm-btn-outline" title="Acessar Central de Carteiras de Viagem dos Clientes">
            <Wallet size={15} />
            <span>Carteiras</span>
          </Link>

          <Link href="/admin/contratos" className="adm-btn adm-btn-outline">
            <FileText size={15} />
            <span>Contratos</span>
          </Link>

          {isAdmin && (
            <Link href="/admin/financeiro/fornecedores" className="adm-btn adm-btn-clay" title="Acessar Contas a Pagar dos Fornecedores">
              <DollarSign size={15} />
              <span>Contas a Pagar</span>
            </Link>
          )}
        </div>
      </div>

      {/* KPIs Operacionais */}
      <div className="adm-kpi-grid">
        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <span>Total de Passeios</span>
            <CalendarCheck size={18} color="var(--adm-clay)" />
          </div>
          <div className="adm-kpi-value">{kpis.total}</div>
          <div className="adm-kpi-desc">Reservas operacionais registradas</div>
        </div>

        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <span>Para Hoje ({new Date().toLocaleDateString("pt-BR")})</span>
            <Clock size={18} color="var(--adm-wine)" />
          </div>
          <div className="adm-kpi-value" style={{ color: "var(--adm-wine)" }}>
            {kpis.hoje}
          </div>
          <div className="adm-kpi-desc">Passeios com execução hoje</div>
        </div>

        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <span>Aguardando Confirmação</span>
            <AlertCircle size={18} color="#d97706" />
          </div>
          <div className="adm-kpi-value" style={{ color: "#d97706" }}>
            {kpis.pendentes}
          </div>
          <div className="adm-kpi-desc">Pendentes ou solicitadas ao operador</div>
        </div>

        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <span>Confirmadas / Vouchers Prontos</span>
            <CheckCircle2 size={18} color="#059669" />
          </div>
          <div className="adm-kpi-value" style={{ color: "#059669" }}>
            {kpis.confirmadas}
          </div>
          <div className="adm-kpi-desc">Prontas para atendimento do passageiro</div>
        </div>
      </div>

      {/* Barra de Filtros Avançados */}
      <div className="adm-card" style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "14px" }}>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
          {/* Busca por Texto */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: "280px" }}>
            <Search size={16} color="var(--adm-clay)" />
            <input
              type="text"
              className="adm-input"
              placeholder="Buscar por cliente, contrato (TN-XXXX), passeio, voucher ou confirmação..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: "100%", maxWidth: "460px" }}
            />
          </div>

          {/* Filtros Dropdown */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
            {/* Fornecedor */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--adm-text-muted)" }}>Fornecedor:</span>
              <select
                className="adm-select"
                style={{ width: "auto", minWidth: "150px" }}
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
              >
                <option value="all">Todos os Fornecedores</option>
                {uniqueSuppliers.map((sup) => (
                  <option key={sup} value={sup}>
                    {sup}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Operacional */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--adm-text-muted)" }}>Status:</span>
              <select
                className="adm-select"
                style={{ width: "auto", minWidth: "160px" }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Todos os Status</option>
                <option value="pendente">⏳ Pendente</option>
                <option value="solicitada">📩 Solicitada</option>
                <option value="aguardando_fornecedor">⌛ Aguardando Fornecedor</option>
                <option value="confirmada">✅ Confirmada</option>
                <option value="realizada">🎉 Realizada</option>
                <option value="pendente_info">⚠️ Pendente de Info</option>
                <option value="cancelada">❌ Cancelada</option>
              </select>
            </div>

            {/* Intervalo de Datas */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--adm-text-muted)" }}>Data:</span>
              <input
                type="date"
                className="adm-input"
                style={{ width: "auto" }}
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setOnlyToday(false);
                }}
              />
              <span style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>até</span>
              <input
                type="date"
                className="adm-input"
                style={{ width: "auto" }}
                value={dateEndFilter}
                onChange={(e) => {
                  setDateEndFilter(e.target.value);
                  setOnlyToday(false);
                }}
              />
              {(dateFilter || dateEndFilter) && (
                <button
                  type="button"
                  className="adm-btn adm-btn-outline adm-btn-sm"
                  onClick={() => {
                    setDateFilter("");
                    setDateEndFilter("");
                    setOnlyToday(false);
                  }}
                  title="Limpar filtro de data"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Ordenação */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <ArrowUpDown size={14} color="var(--adm-clay)" />
              <select
                className="adm-select"
                style={{ width: "auto" }}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <option value="date_asc">Data (Mais Próxima)</option>
                <option value="date_desc">Data (Mais Futura)</option>
                <option value="client">Nome do Cliente</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ fontSize: "12px", color: "var(--adm-text-muted)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
          <div>
            Exibindo <strong>{filteredReservations.length}</strong> de {reservations.length} reservas operacionais
            {onlyPendencies && <span style={{ color: "#d97706", fontWeight: 600 }}> (Apenas com pendências)</span>}
            {onlyToday && <span style={{ color: "var(--adm-wine)", fontWeight: 600 }}> (Agendadas para hoje)</span>}
          </div>
          <div>
            A comunicação com fornecedores é feita via WhatsApp ou e-mail sem expor preços ou margens comerciais.
          </div>
        </div>
      </div>

      {/* Tabela Operacional */}
      {loading ? (
        <div className="adm-card" style={{ padding: "60px 20px", textAlign: "center" }}>
          <Clock size={28} className="animate-spin" color="var(--adm-clay)" style={{ margin: "0 auto 12px" }} />
          <p style={{ color: "var(--adm-text-muted)" }}>Carregando Central Operacional...</p>
        </div>
      ) : filteredReservations.length === 0 ? (
        <div className="adm-card" style={{ padding: "60px 20px", textAlign: "center" }}>
          <CalendarCheck size={38} color="var(--adm-clay)" style={{ margin: "0 auto 12px", opacity: 0.5 }} />
          <h3>Nenhuma reserva operacional encontrada</h3>
          <p style={{ color: "var(--adm-text-muted)", fontSize: "14px", marginTop: "4px" }}>
            {onlyPendencies
              ? "Parabéns! Não há reservas com pendências pendentes nos filtros atuais."
              : "Ao finalizar a venda de um contrato, as reservas operacionais dos passeios serão geradas automaticamente aqui."}
          </p>
          <div style={{ marginTop: "16px" }}>
            <Link href="/admin/contratos" className="adm-btn adm-btn-clay">
              Ver Contratos
            </Link>
          </div>
        </div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Contrato / Cliente</th>
                <th>Passeio & Produto</th>
                <th>Data & PAX</th>
                <th>Fornecedor</th>
                <th>Hotel & Pick-up</th>
                <th>Confirmação & Voucher</th>
                {canViewCosts && <th>Custo Previsto</th>}
                <th>Status</th>
                <th style={{ textAlign: "right", minWidth: "180px" }}>Ações Operacionais</th>
              </tr>
            </thead>
            <tbody>
              {filteredReservations.map((r) => {
                const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.pendente;
                const pendencies = detectReservationPendencies(r);
                const hasWhatsApp = Boolean(r.supplier_whatsapp || r.supplier_phone);

                return (
                  <tr key={r.id}>
                    {/* Contrato / Cliente */}
                    <td>
                      <div style={{ fontWeight: 700, color: "var(--adm-wine)", fontSize: "14px" }}>
                        {r.contract_number}
                      </div>
                      <div style={{ fontWeight: 600, color: "var(--adm-text-main)" }}>
                        {r.client_name}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>
                        {r.client_phone || r.client_email}
                      </div>
                    </td>

                    {/* Passeio */}
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--adm-text-main)" }}>
                        {r.product_name}
                      </div>
                      {(r.rate_id_code || r.tour_id_code) && (
                        <span
                          style={{
                            fontSize: "10px",
                            fontFamily: "monospace",
                            background: "var(--adm-surface-alt)",
                            border: "1px solid var(--adm-border)",
                            padding: "1px 5px",
                            borderRadius: "4px",
                            color: "var(--adm-clay)",
                          }}
                        >
                          {r.rate_id_code || r.tour_id_code}
                        </span>
                      )}
                    </td>

                    {/* Data & PAX */}
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600 }}>
                        <Calendar size={13} color="var(--adm-clay)" />
                        <span>
                          {r.tour_date
                            ? new Date(r.tour_date + "T12:00:00").toLocaleDateString("pt-BR")
                            : "A definir"}
                        </span>
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--adm-text-muted)", marginTop: "2px" }}>
                        {r.adults_count} ad
                        {r.children_count > 0 ? `, ${r.children_count} ch` : ""}
                        {r.infants_count > 0 ? `, ${r.infants_count} bb` : ""}
                      </div>
                    </td>

                    {/* Fornecedor */}
                    <td>
                      <div style={{ fontWeight: 600, fontSize: "13px" }}>
                        {r.supplier_name || "Operadora Local"}
                      </div>
                      {hasWhatsApp ? (
                        <div style={{ fontSize: "11px", color: "#15803d", display: "flex", alignItems: "center", gap: "3px" }}>
                          <span>📱 {r.supplier_whatsapp || r.supplier_phone}</span>
                        </div>
                      ) : (
                        <div style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>
                          Sem telefone cadastrado
                        </div>
                      )}
                    </td>

                    {/* Hotel & Pickup */}
                    <td>
                      <div style={{ fontSize: "12px", fontWeight: 600 }}>
                        {r.pickup_location || "Hotel a confirmar"}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          fontWeight: r.pickup_time ? 600 : 400,
                          color: r.pickup_time ? "var(--adm-emerald)" : "#d97706",
                        }}
                      >
                        {r.pickup_time ? (
                          <>🕒 {r.pickup_time}</>
                        ) : (
                          <>⚠️ Pick-up pendente</>
                        )}
                      </div>
                    </td>

                    {/* Confirmação & Voucher */}
                    <td>
                      {r.supplier_confirmation_code ? (
                        <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--adm-wine)" }}>
                          Cód: {r.supplier_confirmation_code}
                        </div>
                      ) : (
                        <div style={{ fontSize: "11px", color: "#d97706" }}>
                          ⚠️ Sem cód. fornecedor
                        </div>
                      )}

                      {r.voucher_ref ? (
                        <div style={{ fontSize: "11px", color: "var(--adm-emerald)", fontWeight: 600 }}>
                          🎟️ {r.voucher_ref}
                        </div>
                      ) : (
                        <div style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>
                          Voucher pendente
                        </div>
                      )}
                    </td>

                    {/* Custo Previsto (Admin Only) */}
                    {canViewCosts && (
                      <td>
                        {r.is_unknown_cost ? (
                          <span
                            className="adm-badge badge-amber"
                            style={{ fontSize: "10px", gap: "3px" }}
                            title="Custo sob consulta / cotação manual"
                          >
                            <AlertTriangle size={11} />
                            Sob Consulta
                          </span>
                        ) : (
                          <div style={{ fontWeight: 600, fontSize: "12px" }}>
                            {r.cost_currency} {Number(r.estimated_cost || 0).toFixed(2)}
                          </div>
                        )}
                      </td>
                    )}

                    {/* Status */}
                    <td>
                      <span
                        className="adm-badge"
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          backgroundColor: cfg.bg,
                          color: cfg.color,
                          border: `1px solid ${cfg.border}`,
                        }}
                        title={cfg.desc}
                      >
                        {cfg.label}
                      </span>

                      {pendencies.length > 0 && (
                        <div style={{ marginTop: "4px" }}>
                          <span
                            style={{
                              fontSize: "10px",
                              color: "#b45309",
                              background: "#fef3c7",
                              padding: "1px 4px",
                              borderRadius: "4px",
                              display: "inline-block",
                            }}
                            title={pendencies.join("\n")}
                          >
                            {pendencies.length} pendência{pendencies.length > 1 ? "s" : ""}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Ações Operacionais */}
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px", flexWrap: "wrap" }}>
                        {/* Solicitar via WhatsApp */}
                        <button
                          type="button"
                          className="adm-btn adm-btn-outline adm-btn-sm"
                          style={{
                            background: "rgba(16, 185, 129, 0.08)",
                            color: "#059669",
                            borderColor: "#10b981",
                            fontWeight: 600,
                          }}
                          onClick={() => handleOpenWhatsAppModal(r)}
                          title="Enviar solicitação de reserva ao fornecedor via WhatsApp"
                        >
                          <Send size={12} />
                          <span>Solicitar</span>
                        </button>

                        {/* Registrar Resposta / Confirmar */}
                        <button
                          type="button"
                          className="adm-btn adm-btn-outline adm-btn-sm"
                          style={{
                            background: r.status === "confirmada" ? "var(--adm-surface-alt)" : "#e0e7ff",
                            color: r.status === "confirmada" ? "var(--adm-text-main)" : "#4338ca",
                            borderColor: r.status === "confirmada" ? "var(--adm-border)" : "#c7d2fe",
                          }}
                          onClick={() => handleOpenConfirmModal(r)}
                          title="Registrar confirmação recebida do fornecedor"
                        >
                          <CheckCircle2 size={12} />
                          <span>{r.status === "confirmada" ? "Confirmada" : "Confirmar"}</span>
                        </button>

                        {/* Editar Operacional */}
                        <button
                          type="button"
                          className="adm-btn adm-btn-outline adm-btn-sm"
                          onClick={() => handleOpenEditModal(r)}
                          title="Editar detalhes operacionais (pickup, voucher, notas)"
                        >
                          <Edit2 size={12} />
                        </button>

                        {/* Histórico */}
                        <button
                          type="button"
                          className="adm-btn adm-btn-outline adm-btn-sm"
                          onClick={() => handleOpenHistoryModal(r)}
                          title="Ver histórico de movimentações da reserva"
                        >
                          <History size={12} />
                        </button>

                        {/* Ocorrência Operacional */}
                        <Link
                          href={`/admin/ocorrencias?new=true&contractId=${encodeURIComponent(r.contract_id)}&contractNumber=${encodeURIComponent(r.contract_number || "")}&clientName=${encodeURIComponent(r.client_name || "")}&serviceName=${encodeURIComponent(r.product_name || "")}&serviceDate=${encodeURIComponent(r.tour_date || "")}&supplierName=${encodeURIComponent(r.supplier_name || "")}`}
                          className="adm-btn adm-btn-outline adm-btn-sm"
                          style={{
                            color: "#dc2626",
                            borderColor: "#fca5a5",
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "4px 6px",
                          }}
                          title="Registrar ocorrência para esta reserva"
                        >
                          <ShieldAlert size={12} />
                        </Link>

                        {/* Tarefa Interna */}
                        <Link
                          href={`/admin/tarefas?new=true&contractId=${encodeURIComponent(r.contract_id)}&contractNumber=${encodeURIComponent(r.contract_number || "")}&clientName=${encodeURIComponent(r.client_name || "")}&reservationId=${encodeURIComponent(r.id)}&serviceName=${encodeURIComponent(r.product_name || "")}`}
                          className="adm-btn adm-btn-outline adm-btn-sm"
                          style={{
                            color: "#2563eb",
                            borderColor: "#93c5fd",
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "4px 6px",
                          }}
                          title="Criar tarefa interna para esta reserva"
                        >
                          <CheckSquare size={12} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* =========================================================================
          MODAL 1: SOLICITAÇÃO VIA WHATSAPP AO FORNECEDOR
         ========================================================================= */}
      {whatsappModal.open && whatsappModal.reservation && (
        <div className="adm-modal-backdrop" onClick={() => !whatsappModal.submitting && setWhatsappModal((prev) => ({ ...prev, open: false }))}>
          <div className="adm-modal-card" style={{ maxWidth: "620px" }} onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "#dcfce7",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#15803d",
                  }}
                >
                  <Send size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: "18px", color: "var(--adm-wine)" }}>
                    Solicitar Confirmação ao Fornecedor
                  </h3>
                  <p style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                    {whatsappModal.reservation.supplier_name} — {whatsappModal.reservation.product_name}
                  </p>
                </div>
              </div>
              {!whatsappModal.submitting && (
                <button
                  type="button"
                  className="adm-btn adm-btn-icon adm-btn-outline"
                  onClick={() => setWhatsappModal((prev) => ({ ...prev, open: false }))}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="adm-modal-body" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Telefone do Fornecedor */}
              <div style={{ background: "var(--adm-surface-alt)", padding: "12px 14px", borderRadius: "8px", border: "1px solid var(--adm-border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--adm-text-muted)" }}>
                      DESTINATÁRIO (FORNECEDOR):
                    </span>
                    <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--adm-text-main)" }}>
                      {whatsappModal.reservation.supplier_name}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>WhatsApp:</span>
                    <input
                      type="text"
                      className="adm-input"
                      style={{ width: "170px", padding: "4px 8px", fontSize: "13px" }}
                      placeholder="Ex: 529981234567"
                      value={whatsappModal.targetPhone}
                      onChange={(e) => setWhatsappModal((prev) => ({ ...prev, targetPhone: e.target.value }))}
                    />
                  </div>
                </div>

                {!whatsappModal.targetPhone && (
                  <p style={{ fontSize: "11px", color: "#b45309", marginTop: "6px", marginBottom: 0 }}>
                    ⚠️ Este fornecedor não possui telefone cadastrado. Digite o número acima ou copie a mensagem para enviar por outro canal.
                  </p>
                )}
              </div>

              {/* Mensagem Padronizada Gerada */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label className="adm-label" style={{ marginBottom: 0 }}>Mensagem Padronizada (Editável antes do envio):</label>
                  <button
                    type="button"
                    className="adm-btn adm-btn-outline adm-btn-sm"
                    onClick={handleCopyMessage}
                    style={{ fontSize: "11px" }}
                  >
                    {whatsappModal.copied ? (
                      <>
                        <Check size={12} color="#059669" />
                        <span style={{ color: "#059669" }}>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Copiar Mensagem</span>
                      </>
                    )}
                  </button>
                </div>

                <textarea
                  className="adm-textarea"
                  rows={9}
                  style={{ fontFamily: "inherit", fontSize: "12px", lineHeight: 1.5 }}
                  value={whatsappModal.customMessage}
                  onChange={(e) => setWhatsappModal((prev) => ({ ...prev, customMessage: e.target.value }))}
                />
              </div>

              {/* Regras e Segurança */}
              <div style={{ fontSize: "11px", color: "var(--adm-text-muted)", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "8px 12px", borderRadius: "6px" }}>
                <ShieldCheck size={13} style={{ display: "inline", verticalAlign: "-2px", color: "#16a34a", marginRight: "4px" }} />
                <strong>Privacidade garantida:</strong> Mensagem limpa sem menção a preços de venda ao cliente, margem comercial ou dados financeiros internos.
              </div>

              <div style={{ fontSize: "11px", color: "#b45309", background: "#fef3c7", padding: "8px 12px", borderRadius: "6px" }}>
                <Info size={13} style={{ display: "inline", verticalAlign: "-2px", marginRight: "4px" }} />
                <strong>Atenção:</strong> Abrir o WhatsApp abre o aplicativo para envio manual. Não avança o status automaticamente. Clique em <strong>"Registrar Solicitação Enviada"</strong> após o envio.
              </div>
            </div>

            <div className="adm-modal-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
              <button
                type="button"
                className="adm-btn adm-btn-outline"
                disabled={whatsappModal.submitting}
                onClick={() => setWhatsappModal((prev) => ({ ...prev, open: false }))}
              >
                Fechar
              </button>

              <div style={{ display: "flex", gap: "8px" }}>
                {/* Botão de Abrir WhatsApp */}
                {(() => {
                  const link = formatWhatsAppLink(whatsappModal.targetPhone, whatsappModal.customMessage);
                  if (link) {
                    return (
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="adm-btn adm-btn-outline"
                        style={{ background: "#25D366", color: "#fff", borderColor: "#25D366", fontWeight: 600 }}
                      >
                        <ExternalLink size={14} />
                        <span>Abrir WhatsApp</span>
                      </a>
                    );
                  }
                  return (
                    <button
                      type="button"
                      className="adm-btn adm-btn-outline"
                      disabled
                      title="Informe o número do fornecedor acima para abrir o WhatsApp"
                    >
                      <ExternalLink size={14} />
                      <span>WhatsApp (Sem telefone)</span>
                    </button>
                  );
                })()}

                {/* Botão Registrar Envio */}
                <button
                  type="button"
                  className="adm-btn adm-btn-clay"
                  disabled={whatsappModal.submitting}
                  onClick={handleRegisterRequestSent}
                >
                  {whatsappModal.submitting ? (
                    <>
                      <Clock size={14} className="animate-spin" />
                      <span>Registrando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      <span>Registrar Solicitação Enviada</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: REGISTRAR CONFIRMAÇÃO DO FORNECEDOR
         ========================================================================= */}
      {confirmModal.open && confirmModal.reservation && (
        <div className="adm-modal-backdrop" onClick={() => !confirmModal.submitting && setConfirmModal((prev) => ({ ...prev, open: false }))}>
          <div className="adm-modal-card" style={{ maxWidth: "580px" }} onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "#e0e7ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#4338ca",
                  }}
                >
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: "18px", color: "var(--adm-wine)" }}>
                    Registrar Resposta e Confirmação
                  </h3>
                  <p style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                    {confirmModal.reservation.contract_number} — {confirmModal.reservation.product_name}
                  </p>
                </div>
              </div>
              {!confirmModal.submitting && (
                <button
                  type="button"
                  className="adm-btn adm-btn-icon adm-btn-outline"
                  onClick={() => setConfirmModal((prev) => ({ ...prev, open: false }))}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <form onSubmit={handleSaveConfirmation}>
              <div className="adm-modal-body" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {/* Resumo */}
                <div style={{ background: "var(--adm-surface-alt)", padding: "10px 14px", borderRadius: "8px", fontSize: "12px" }}>
                  <div><strong>Cliente:</strong> {confirmModal.reservation.client_name}</div>
                  <div><strong>Fornecedor:</strong> {confirmModal.reservation.supplier_name}</div>
                  <div>
                    <strong>Data:</strong>{" "}
                    {confirmModal.reservation.tour_date
                      ? new Date(confirmModal.reservation.tour_date + "T12:00:00").toLocaleDateString("pt-BR")
                      : "A definir"}{" "}
                    | <strong>PAX:</strong> {confirmModal.reservation.adults_count} ad
                    {confirmModal.reservation.children_count > 0 ? `, ${confirmModal.reservation.children_count} ch` : ""}
                  </div>
                </div>

                {/* Códigos */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label className="adm-label">Código de Confirmação do Fornecedor *</label>
                    <input
                      type="text"
                      className="adm-input"
                      placeholder="Ex: XC-98214"
                      value={confirmModal.supplierConfirmationCode}
                      onChange={(e) => setConfirmModal({ ...confirmModal, supplierConfirmationCode: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="adm-label">Número do Voucher (Cliente)</label>
                    <input
                      type="text"
                      className="adm-input"
                      placeholder="Ex: VCH-2026-0042"
                      value={confirmModal.voucherRef}
                      onChange={(e) => setConfirmModal({ ...confirmModal, voucherRef: e.target.value })}
                    />
                  </div>
                </div>

                {/* Horário e Ponto de Encontro */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px" }}>
                  <div>
                    <label className="adm-label">Horário de Pick-up Confirmado</label>
                    <input
                      type="text"
                      className="adm-input"
                      placeholder="Ex: 07:15"
                      value={confirmModal.pickupTime}
                      onChange={(e) => setConfirmModal({ ...confirmModal, pickupTime: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="adm-label">Local / Ponto de Encontro Confirmado</label>
                    <input
                      type="text"
                      className="adm-input"
                      placeholder="Ex: Lobby Principal do Hotel"
                      value={confirmModal.pickupLocation}
                      onChange={(e) => setConfirmModal({ ...confirmModal, pickupLocation: e.target.value })}
                    />
                  </div>
                </div>

                {/* Observações da Confirmação */}
                <div>
                  <label className="adm-label">Observações / Requisitos Informados pelo Operador</label>
                  <textarea
                    className="adm-textarea"
                    rows={2}
                    placeholder="Ex: Pediram para estar com 10 min de antecedência e voucher impresso ou no celular."
                    value={confirmModal.notes}
                    onChange={(e) => setConfirmModal({ ...confirmModal, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="adm-modal-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button
                  type="button"
                  className="adm-btn adm-btn-outline"
                  disabled={confirmModal.submitting}
                  onClick={() => setConfirmModal((prev) => ({ ...prev, open: false }))}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="adm-btn adm-btn-clay"
                  style={{ background: "#059669", borderColor: "#059669", color: "#fff", fontWeight: 600 }}
                  disabled={confirmModal.submitting}
                >
                  {confirmModal.submitting ? (
                    <>
                      <Clock size={14} className="animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      <span>Salvar e Marcar como Confirmada</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: EDIÇÃO OPERACIONAL COMPLETA (COM PROTEÇÃO FINANCEIRA)
         ========================================================================= */}
      {editModal.open && editModal.reservation && (
        <div className="adm-modal-backdrop" onClick={() => !editModal.submitting && setEditModal((prev) => ({ ...prev, open: false }))}>
          <div className="adm-modal-card" style={{ maxWidth: "600px" }} onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "var(--adm-wine-faded)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--adm-wine)",
                  }}
                >
                  <Ticket size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: "18px", color: "var(--adm-wine)" }}>
                    Editar Detalhes Operacionais
                  </h3>
                  <p style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                    {editModal.reservation.contract_number} — {editModal.reservation.product_name}
                  </p>
                </div>
              </div>
              {!editModal.submitting && (
                <button
                  type="button"
                  className="adm-btn adm-btn-icon adm-btn-outline"
                  onClick={() => setEditModal((prev) => ({ ...prev, open: false }))}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="adm-modal-body" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {/* Status */}
                <div>
                  <label className="adm-label">Status Operacional</label>
                  <select
                    className="adm-select"
                    value={editModal.status}
                    onChange={(e) => setEditModal({ ...editModal, status: e.target.value as any })}
                  >
                    <option value="pendente">⏳ Pendente (Aguardando Solicitação)</option>
                    <option value="solicitada">📩 Solicitada ao Fornecedor</option>
                    <option value="aguardando_fornecedor">⌛ Aguardando Resposta do Fornecedor</option>
                    <option value="confirmada">✅ Confirmada / Voucher Pronto</option>
                    <option value="realizada">🎉 Passeio Realizado</option>
                    <option value="pendente_info">⚠️ Pendente de Informações</option>
                    <option value="cancelada">❌ Cancelada</option>
                  </select>
                </div>

                {/* Pickup: Horário e Local */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px" }}>
                  <div>
                    <label className="adm-label">Horário de Pick-up</label>
                    <input
                      type="text"
                      className="adm-input"
                      placeholder="Ex: 07:15"
                      value={editModal.pickupTime}
                      onChange={(e) => setEditModal({ ...editModal, pickupTime: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="adm-label">Local de Pick-up / Encontro</label>
                    <input
                      type="text"
                      className="adm-input"
                      placeholder="Ex: Lobby Hotel Hyatt Ziva"
                      value={editModal.pickupLocation}
                      onChange={(e) => setEditModal({ ...editModal, pickupLocation: e.target.value })}
                    />
                  </div>
                </div>

                {/* Códigos */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label className="adm-label">Cód. Confirmação Fornecedor</label>
                    <input
                      type="text"
                      className="adm-input"
                      placeholder="Ex: XC-98214"
                      value={editModal.supplierConfirmationCode}
                      onChange={(e) => setEditModal({ ...editModal, supplierConfirmationCode: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="adm-label">Número do Voucher</label>
                    <input
                      type="text"
                      className="adm-input"
                      placeholder="Ex: VCH-2026-0042"
                      value={editModal.voucherRef}
                      onChange={(e) => setEditModal({ ...editModal, voucherRef: e.target.value })}
                    />
                  </div>
                </div>

                {/* Instruções Especiais */}
                <div>
                  <label className="adm-label">Instruções Especiais para o Cliente</label>
                  <textarea
                    className="adm-textarea"
                    rows={2}
                    placeholder="Ex: Trazer toalha, calçado aquático e protetor biodegradável..."
                    value={editModal.specialInstructions}
                    onChange={(e) => setEditModal({ ...editModal, specialInstructions: e.target.value })}
                  />
                </div>

                {/* Notas Internas */}
                <div>
                  <label className="adm-label">Observações Internas da Agência</label>
                  <textarea
                    className="adm-textarea"
                    rows={2}
                    placeholder="Ex: Fornecedor confirmou por WhatsApp. Voucher enviado ao cliente."
                    value={editModal.notes}
                    onChange={(e) => setEditModal({ ...editModal, notes: e.target.value })}
                  />
                </div>

                {/* Ajuste de Custo Real (APENAS ADMIN) */}
                {isAdmin ? (
                  <div style={{ background: "rgba(247, 241, 221, 0.4)", border: "1px solid var(--adm-gold-border)", padding: "10px 14px", borderRadius: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <label className="adm-label" style={{ marginBottom: "2px", color: "var(--adm-wine)" }}>
                          Custo Real do Fornecedor ({editModal.reservation.cost_currency})
                        </label>
                        <span style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>
                          Apenas Administrador pode ajustar o custo real sem alterar o preço de venda original.
                        </span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        className="adm-input"
                        style={{ width: "130px" }}
                        placeholder="Custo real"
                        value={editModal.actualCost !== null ? editModal.actualCost : ""}
                        onChange={(e) =>
                          setEditModal({
                            ...editModal,
                            actualCost: e.target.value !== "" ? parseFloat(e.target.value) : null,
                          })
                        }
                      />
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>
                    🔒 Custos e valores financeiros de fornecedores são gerenciados exclusivamente pela Administração.
                  </div>
                )}
              </div>

              <div className="adm-modal-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button
                  type="button"
                  className="adm-btn adm-btn-outline"
                  disabled={editModal.submitting}
                  onClick={() => setEditModal((prev) => ({ ...prev, open: false }))}
                >
                  Cancelar
                </button>

                <button type="submit" className="adm-btn adm-btn-clay" disabled={editModal.submitting}>
                  {editModal.submitting ? (
                    <>
                      <Clock size={14} className="animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      <span>Salvar Dados Operacionais</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: HISTÓRICO DE MOVIMENTAÇÕES
         ========================================================================= */}
      {historyModal.open && historyModal.reservation && (
        <div className="adm-modal-backdrop" onClick={() => setHistoryModal((prev) => ({ ...prev, open: false }))}>
          <div className="adm-modal-card" style={{ maxWidth: "600px" }} onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "var(--adm-surface-alt)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--adm-clay)",
                  }}
                >
                  <History size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: "18px", color: "var(--adm-wine)" }}>
                    Histórico Operacional da Reserva
                  </h3>
                  <p style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                    {historyModal.reservation.contract_number} — {historyModal.reservation.product_name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="adm-btn adm-btn-icon adm-btn-outline"
                onClick={() => setHistoryModal((prev) => ({ ...prev, open: false }))}
              >
                <X size={16} />
              </button>
            </div>

            <div className="adm-modal-body" style={{ maxHeight: "400px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
              {(() => {
                const historyList: OperationalReservationHistoryEntry[] = Array.isArray(
                  historyModal.reservation.history
                )
                  ? historyModal.reservation.history
                  : [];

                if (historyList.length === 0) {
                  return (
                    <div style={{ textAlign: "center", padding: "30px 10px", color: "var(--adm-text-muted)", fontSize: "13px" }}>
                      <Clock size={28} style={{ margin: "0 auto 8px", opacity: 0.5 }} />
                      <p>Nenhuma movimentação detalhada registrada ainda.</p>
                      <p style={{ fontSize: "11px", marginTop: "4px" }}>
                        Criada em: {new Date(historyModal.reservation.created_at).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  );
                }

                return historyList.map((entry, idx) => (
                  <div
                    key={idx}
                    style={{
                      borderLeft: "3px solid var(--adm-clay)",
                      paddingLeft: "12px",
                      position: "relative",
                      fontSize: "12px",
                    }}
                  >
                    <div style={{ fontWeight: 600, color: "var(--adm-wine)" }}>
                      {entry.action || "Movimentação operacional"}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>
                      {new Date(entry.timestamp).toLocaleString("pt-BR")}
                      {entry.channel ? ` • Canal: ${entry.channel}` : ""}
                    </div>
                    {entry.status_before && entry.status_after && (
                      <div style={{ fontSize: "11px", marginTop: "2px" }}>
                        Status: <span className="adm-badge badge-amber" style={{ fontSize: "9px" }}>{entry.status_before}</span> →{" "}
                        <span className="adm-badge badge-green" style={{ fontSize: "9px" }}>{entry.status_after}</span>
                      </div>
                    )}
                    {entry.pickup_time && (
                      <div style={{ fontSize: "11px", color: "var(--adm-emerald)" }}>
                        Pick-up: {entry.pickup_time}
                      </div>
                    )}
                    {entry.supplier_confirmation_code && (
                      <div style={{ fontSize: "11px", color: "var(--adm-wine)" }}>
                        Cód. Confirmação: {entry.supplier_confirmation_code}
                      </div>
                    )}
                    {entry.voucher_ref && (
                      <div style={{ fontSize: "11px", color: "var(--adm-emerald)" }}>
                        Voucher: {entry.voucher_ref}
                      </div>
                    )}
                  </div>
                ));
              })()}
            </div>

            <div className="adm-modal-footer" style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="adm-btn adm-btn-outline"
                onClick={() => setHistoryModal((prev) => ({ ...prev, open: false }))}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
