"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuthProfile } from "@/lib/auth/AuthContext";
import {
  VoucherDisplayItem,
  VoucherOperationalStatus,
  VoucherKpis,
  VoucherFilters,
  deriveVoucherStatus,
  detectVoucherPendencies,
  calculateVoucherKpis,
  filterVouchers,
  generateSuggestedVoucherRef,
  generateVoucherWhatsAppMessage,
  extractVoucherDeliveryDetails,
} from "@/lib/operational/voucherOperations";
import { formatWhatsAppLink } from "@/lib/operational/supplierMessaging";
import { updateOperationalReservation } from "@/lib/operational/updateReservation";
import { TOURS as DEFAULT_TOURS } from "@/data/tours";
import {
  Ticket,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  Printer,
  Edit2,
  Eye,
  FileText,
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
  CheckCheck,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Info,
  Car,
  Plane,
  AlertCircle,
  Wallet,
} from "lucide-react";

const VOUCHER_STATUS_CONFIG: Record<
  VoucherOperationalStatus,
  { label: string; bg: string; color: string; border: string; desc: string }
> = {
  pendente: {
    label: "Pendente de Preparação",
    bg: "#fff7ed",
    color: "#c2410c",
    border: "#fed7aa",
    desc: "Aguardando código ou orientações de embarque",
  },
  em_preparacao: {
    label: "Em Preparação",
    bg: "#fef3c7",
    color: "#b45309",
    border: "#fde68a",
    desc: "Ajustes de pickup e instruções em andamento",
  },
  pronto: {
    label: "Pronto para Entrega",
    bg: "#dcfce7",
    color: "#15803d",
    border: "#86efac",
    desc: "Voucher emitido e pronto para disponibilizar ao cliente",
  },
  entregue: {
    label: "Entregue ao Cliente",
    bg: "#e0e7ff",
    color: "#4338ca",
    border: "#c7d2fe",
    desc: "Documento enviado e confirmado com o turista",
  },
  cancelado: {
    label: "Cancelado",
    bg: "#fee2e2",
    color: "#b91c1c",
    border: "#fca5a5",
    desc: "Serviço ou contrato cancelado",
  },
};

type DatePreset = "all" | "today" | "tomorrow" | "next7" | "this_month" | "custom";

export default function AdminVouchersPage() {
  const { role, profile } = useAuthProfile();
  const isAdmin = role === "admin";

  // Estado Principal
  const [vouchers, setVouchers] = useState<VoucherDisplayItem[]>([]);
  const [suppliersList, setSuppliersList] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filtros
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [supplierFilter, setSupplierFilter] = useState<string>("todos");
  const [productNameFilter, setProductNameFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [onlyPendencies, setOnlyPendencies] = useState<boolean>(false);

  // Modais
  const [selectedVoucherForView, setSelectedVoucherForView] = useState<VoucherDisplayItem | null>(null);

  // Modal de Edição Operacional do Voucher
  const [editModal, setEditModal] = useState<{
    open: boolean;
    voucher: VoucherDisplayItem | null;
    voucherRef: string;
    pickupTime: string;
    pickupLocation: string;
    voucherStatus: VoucherOperationalStatus;
    specialInstructions: string;
    notes: string;
    submitting: boolean;
  }>({
    open: false,
    voucher: null,
    voucherRef: "",
    pickupTime: "",
    pickupLocation: "",
    voucherStatus: "pronto",
    specialInstructions: "",
    notes: "",
    submitting: false,
  });

  // Modal de Envio ao Cliente via WhatsApp
  const [whatsappModal, setWhatsappModal] = useState<{
    open: boolean;
    voucher: VoucherDisplayItem | null;
    targetPhone: string;
    messageText: string;
    copied: boolean;
    submitting: boolean;
  }>({
    open: false,
    voucher: null,
    targetPhone: "",
    messageText: "",
    copied: false,
    submitting: false,
  });

  // Notificação Toast
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Carregar Dados das Reservas Operacionais e Contratos
  const fetchVouchersData = async () => {
    try {
      // 1. Carregar fornecedores
      const { data: supps } = await supabase
        .from("suppliers")
        .select("id, name, trade_name, contact_name, phone, whatsapp, email");

      const sMap: Record<string, any> = {};
      const uniqueSupps: Array<{ id: string; name: string }> = [];
      (supps || []).forEach((s: any) => {
        sMap[s.id] = s;
        if (s.name) {
          sMap[s.name.toLowerCase().trim()] = s;
          uniqueSupps.push({ id: s.id, name: s.name });
        }
      });
      setSuppliersList(uniqueSupps);

      // 2. Carregar dados de operational_reservations com join em contracts e suppliers
      const { data: opData, error: opError } = await supabase
        .from("operational_reservations")
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

      if (opError) {
        console.warn("Erro ao buscar reservas operacionais:", opError.message);
        setVouchers([]);
        return;
      }

      const items: VoucherDisplayItem[] = (opData || []).map((r: any) => {
        const contract = r.contracts || {};
        const supplier = r.suppliers || (r.supplier_id && sMap[r.supplier_id]) || null;

        const mainHotel =
          contract.hotels_schedule?.[0]?.hotel_name ||
          r.pickup_location ||
          null;

        const mainZone =
          r.hotel_zone ||
          contract.hotels_schedule?.[0]?.zone ||
          null;

        const totalPax =
          (Number(r.adults_count) || 1) +
          (Number(r.children_count) || 0) +
          (Number(r.infants_count) || 0);

        const deliveryDetails = extractVoucherDeliveryDetails(r.history);

        const vStatus = deriveVoucherStatus(
          {
            status: r.status,
            voucher_ref: r.voucher_ref,
            special_instructions: r.special_instructions,
            pickup_time: r.pickup_time,
            pickup_location: r.pickup_location,
            history: r.history,
          },
          contract.status
        );

        const displayItem: VoucherDisplayItem = {
          id: r.id,
          contract_id: r.contract_id,
          contract_number: contract.contract_number || "TN-XXXX",
          contract_status: contract.status || "confirmado",
          contract_item_id: r.contract_item_id,

          client_id: r.client_id || contract.client_id || null,
          client_name: r.client_name || contract.client_name || "Cliente a identificar",
          client_phone: contract.client_phone || null,
          client_email: contract.client_email || null,
          client_cpf: contract.client_cpf || null,

          product_name: r.product_name,
          tour_id_code: r.tour_id_code || null,
          tour_date: r.tour_date,
          supplier_id: r.supplier_id || null,
          supplier_name: r.supplier_name || supplier?.name || null,
          supplier_confirmation_code: r.supplier_confirmation_code || null,
          reservation_status: r.status || "pendente",

          hotel_name: mainHotel,
          hotel_zone: mainZone,
          pickup_location: r.pickup_location || mainHotel || null,
          pickup_time: r.pickup_time || null,

          adults_count: Number(r.adults_count) || 1,
          children_count: Number(r.children_count) || 0,
          infants_count: Number(r.infants_count) || 0,
          total_pax: totalPax,

          voucher_ref: r.voucher_ref || null,
          voucher_status: vStatus,
          special_instructions: r.special_instructions || null,
          notes: r.notes || null,

          delivered_at: deliveryDetails.delivered_at,
          delivered_to: deliveryDetails.delivered_to,
          delivered_by: deliveryDetails.delivered_by,
          delivery_channel: deliveryDetails.delivery_channel,

          pendencies: [],
          history: Array.isArray(r.history) ? r.history : [],
          created_at: r.created_at,
          updated_at: r.updated_at,
        };

        displayItem.pendencies = detectVoucherPendencies(displayItem);
        return displayItem;
      });

      setVouchers(items);
    } catch (err: any) {
      console.error("Erro geral na busca de vouchers:", err);
      showToast("Erro ao carregar vouchers: " + err.message, "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVouchersData();
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search).get("search") || new URLSearchParams(window.location.search).get("q");
      if (q) setSearchTerm(q);
    }
  }, []);

  // Atalhos de Período
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
  const kpis: VoucherKpis = useMemo(() => {
    return calculateVoucherKpis(vouchers);
  }, [vouchers]);

  // Vouchers Filtrados
  const filteredVouchers: VoucherDisplayItem[] = useMemo(() => {
    const filters: VoucherFilters = {
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      voucherStatus: statusFilter !== "todos" ? statusFilter : undefined,
      supplierId: supplierFilter !== "todos" ? supplierFilter : undefined,
      productName: productNameFilter || undefined,
      clientOrContract: searchTerm || undefined,
      onlyWithPendencies: onlyPendencies || undefined,
    };
    return filterVouchers(vouchers, filters);
  }, [vouchers, startDate, endDate, statusFilter, supplierFilter, productNameFilter, searchTerm, onlyPendencies]);

  // Abrir Modal de Edição Operacional
  const handleOpenEditModal = (v: VoucherDisplayItem) => {
    // Buscar recomendações padrão se instruções vazias
    let defaultInstructions = v.special_instructions || "";
    if (!defaultInstructions) {
      const foundTour = DEFAULT_TOURS.find((t) =>
        t.name.toLowerCase().includes(v.product_name.toLowerCase()) ||
        v.product_name.toLowerCase().includes(t.name.toLowerCase())
      );
      if (foundTour) {
        const parts: string[] = [];
        if (foundTour.importantInfo && foundTour.importantInfo.length > 0) {
          parts.push("Orientações de Embarque:\n• " + foundTour.importantInfo.join("\n• "));
        }
        if (foundTour.whatToBring && foundTour.whatToBring.length > 0) {
          parts.push("O que Levar:\n• " + foundTour.whatToBring.join("\n• "));
        }
        defaultInstructions = parts.join("\n\n");
      }
    }

    setEditModal({
      open: true,
      voucher: v,
      voucherRef: v.voucher_ref || "",
      pickupTime: v.pickup_time || "",
      pickupLocation: v.pickup_location || v.hotel_name || "",
      voucherStatus: v.voucher_status === "cancelado" ? "pendente" : v.voucher_status,
      specialInstructions: defaultInstructions,
      notes: v.notes || "",
      submitting: false,
    });
  };

  // Sugerir Código de Voucher Automático
  const handleSuggestVoucherRef = () => {
    if (!editModal.voucher) return;
    const suggested = generateSuggestedVoucherRef(editModal.voucher.contract_number, 1);
    setEditModal((prev) => ({ ...prev, voucherRef: suggested }));
  };

  // Salvar Edição Operacional do Voucher
  const handleSaveVoucherEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal.voucher) return;

    setEditModal((prev) => ({ ...prev, submitting: true }));

    try {
      const v = editModal.voucher;
      const cleanVoucherRef = editModal.voucherRef.trim() || null;
      const cleanPickupTime = editModal.pickupTime.trim() || null;
      const cleanPickupLocation = editModal.pickupLocation.trim() || null;
      const cleanInstructions = editModal.specialInstructions.trim() || null;
      const cleanNotes = editModal.notes.trim() || null;

      // Atualizar via RPC segura ou update direto com histórico
      await updateOperationalReservation(supabase, {
        reservationId: v.id,
        voucherRef: cleanVoucherRef,
        pickupTime: cleanPickupTime,
        pickupLocation: cleanPickupLocation,
        specialInstructions: cleanInstructions,
        notes: cleanNotes,
        actionDescription: `Voucher operacional ajustado: Ref [${cleanVoucherRef || "s/ref"}] · Status [${editModal.voucherStatus}]`,
        isAdmin,
      });

      // Também registrar status operacional específico no histórico se solicitado
      if (editModal.voucherStatus !== v.voucher_status) {
        const existingHistory = v.history || [];
        const newEntry = {
          timestamp: new Date().toISOString(),
          action: "voucher_status_update",
          voucher_status: editModal.voucherStatus,
          user_name: profile?.fullName || "Operador Tío Nenê",
          notes: cleanNotes,
        };
        await supabase
          .from("operational_reservations")
          .update({
            history: [...existingHistory, newEntry],
            updated_at: new Date().toISOString(),
          })
          .eq("id", v.id);
      }

      showToast("Dados do voucher operacional salvos com sucesso!");
      setEditModal((prev) => ({ ...prev, open: false, submitting: false }));

      // Atualizar no modal de visualização se aberto
      if (selectedVoucherForView && selectedVoucherForView.id === v.id) {
        setSelectedVoucherForView((prev) =>
          prev
            ? {
                ...prev,
                voucher_ref: cleanVoucherRef,
                pickup_time: cleanPickupTime,
                pickup_location: cleanPickupLocation,
                special_instructions: cleanInstructions,
                notes: cleanNotes,
                voucher_status: editModal.voucherStatus,
              }
            : null
        );
      }

      fetchVouchersData();
    } catch (err: any) {
      console.error("Erro ao salvar voucher:", err);
      showToast("Erro ao salvar voucher: " + err.message, "error");
      setEditModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  // Abrir Modal de Envio via WhatsApp
  const handleOpenWhatsAppModal = (v: VoucherDisplayItem) => {
    const msg = generateVoucherWhatsAppMessage(v);
    setWhatsappModal({
      open: true,
      voucher: v,
      targetPhone: v.client_phone || "",
      messageText: msg,
      copied: false,
      submitting: false,
    });
  };

  // Abrir Link no WhatsApp (Ação não-automática — NÃO altera status)
  const handleOpenWhatsAppLink = () => {
    if (!whatsappModal.targetPhone) {
      alert("Por favor, informe o número de WhatsApp do cliente.");
      return;
    }
    const link = formatWhatsAppLink(whatsappModal.targetPhone, whatsappModal.messageText);
    if (!link) {
      alert("Telefone do cliente inválido para envio de WhatsApp.");
      return;
    }
    window.open(link, "_blank");
  };

  // Confirmar Entrega do Voucher (Confirmação explícita do operador)
  const handleConfirmVoucherDelivery = async () => {
    if (!whatsappModal.voucher) return;
    setWhatsappModal((prev) => ({ ...prev, submitting: true }));

    try {
      const v = whatsappModal.voucher;
      const targetPhone = whatsappModal.targetPhone.trim();
      const nowIso = new Date().toISOString();

      const existingHistory = v.history || [];
      const deliveryEntry = {
        timestamp: nowIso,
        action: "voucher_delivery_confirmed",
        voucher_status: "entregue",
        delivered_at: nowIso,
        delivered_to: targetPhone,
        channel: "whatsapp",
        user_name: profile?.fullName || "Operador Tío Nenê",
        notes: "Voucher oficial entregue ao cliente via WhatsApp",
      };

      const { error: opErr } = await supabase
        .from("operational_reservations")
        .update({
          history: [...existingHistory, deliveryEntry],
          updated_at: nowIso,
        })
        .eq("id", v.id);

      if (opErr) throw opErr;

      showToast("Voucher marcado como formalmente entregue ao cliente!");
      setWhatsappModal({
        open: false,
        voucher: null,
        targetPhone: "",
        messageText: "",
        copied: false,
        submitting: false,
      });

      if (selectedVoucherForView && selectedVoucherForView.id === v.id) {
        setSelectedVoucherForView((prev) =>
          prev
            ? {
                ...prev,
                voucher_status: "entregue",
                delivered_at: nowIso,
                delivered_to: targetPhone,
                delivery_channel: "whatsapp",
              }
            : null
        );
      }

      fetchVouchersData();
    } catch (err: any) {
      console.error("Erro ao registrar entrega:", err);
      showToast("Erro ao registrar entrega: " + err.message, "error");
      setWhatsappModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  // Limpar Todos os Filtros
  const handleClearFilters = () => {
    setDatePreset("all");
    setStartDate("");
    setEndDate("");
    setStatusFilter("todos");
    setSupplierFilter("todos");
    setProductNameFilter("");
    setSearchTerm("");
    setOnlyPendencies(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Toast de Notificação */}
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

      {/* Cabeçalho da Central de Vouchers */}
      <div
        className="adm-no-print"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}
      >
        <div>
          <span className="admin-brand-tag" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <Ticket size={13} />
            <span>DOCUMENTAÇÃO OPERACIONAL</span>
          </span>
          <h2 style={{ fontSize: "28px", color: "var(--adm-wine)", marginTop: "4px" }}>
            Central de Vouchers dos Clientes
          </h2>
          <p style={{ color: "var(--adm-text-muted)", fontSize: "14px", marginTop: "2px" }}>
            Prepare, edite, gere o documento oficial em PDF e envie os vouchers aos turistas com segurança e independência da confirmação de fornecedores.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <button
            type="button"
            className="adm-btn adm-btn-outline adm-btn-sm"
            onClick={() => {
              setRefreshing(true);
              fetchVouchersData();
            }}
            disabled={refreshing || loading}
            title="Atualizar lista"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            <span>{refreshing ? "Atualizando..." : "Atualizar"}</span>
          </button>

          <Link href="/admin/reservas" className="adm-btn adm-btn-outline adm-btn-sm">
            <Clock size={14} />
            <span>Central de Reservas</span>
          </Link>

          <Link href="/admin/chegadas" className="adm-btn adm-btn-outline adm-btn-sm">
            <Plane size={14} />
            <span>Chegadas & Traslados</span>
          </Link>

          <Link href="/admin/contratos" className="adm-btn adm-btn-outline adm-btn-sm">
            <FileText size={14} />
            <span>Contratos</span>
          </Link>

          <Link href="/admin/carteiras" className="adm-btn adm-btn-outline adm-btn-sm" style={{ color: "var(--adm-clay)", borderColor: "var(--adm-clay)" }}>
            <Wallet size={14} />
            <span>Carteiras de Viagem</span>
          </Link>
        </div>
      </div>

      {/* Grid de Indicadores (KPIs) */}
      <div className="adm-kpi-grid adm-no-print">
        <div
          className="adm-kpi-card"
          style={{ cursor: "pointer" }}
          onClick={() => handleClearFilters()}
          title="Ver todos os vouchers"
        >
          <div className="adm-kpi-header">
            <span>Total de Vouchers</span>
            <Ticket size={18} color="var(--adm-wine)" />
          </div>
          <div className="adm-kpi-value">{kpis.totalVouchers}</div>
          <div className="adm-kpi-desc">Serviços contratados no sistema</div>
        </div>

        <div
          className="adm-kpi-card"
          style={{ cursor: "pointer" }}
          onClick={() => setStatusFilter("pendente")}
          title="Filtrar pendentes de preparação"
        >
          <div className="adm-kpi-header">
            <span>Pendentes de Preparação</span>
            <AlertTriangle size={18} color="#c2410c" />
          </div>
          <div className="adm-kpi-value" style={{ color: "#c2410c" }}>
            {kpis.pendingPreparation}
          </div>
          <div className="adm-kpi-desc">Sem código ou instruções definidas</div>
        </div>

        <div
          className="adm-kpi-card"
          style={{ cursor: "pointer" }}
          onClick={() => setStatusFilter("em_preparacao")}
          title="Filtrar em preparação"
        >
          <div className="adm-kpi-header">
            <span>Em Preparação</span>
            <Clock size={18} color="#b45309" />
          </div>
          <div className="adm-kpi-value" style={{ color: "#b45309" }}>
            {kpis.inPreparation}
          </div>
          <div className="adm-kpi-desc">Operador realizando ajustes logísticos</div>
        </div>

        <div
          className="adm-kpi-card"
          style={{ cursor: "pointer" }}
          onClick={() => setStatusFilter("pronto")}
          title="Filtrar prontos para entrega"
        >
          <div className="adm-kpi-header">
            <span>Prontos para Entrega</span>
            <CheckCircle2 size={18} color="#15803d" />
          </div>
          <div className="adm-kpi-value" style={{ color: "#15803d" }}>
            {kpis.ready}
          </div>
          <div className="adm-kpi-desc">Código e orientações validadas</div>
        </div>

        <div
          className="adm-kpi-card"
          style={{ cursor: "pointer" }}
          onClick={() => setStatusFilter("entregue")}
          title="Filtrar entregues ao cliente"
        >
          <div className="adm-kpi-header">
            <span>Entregues ao Cliente</span>
            <CheckCheck size={18} color="#4338ca" />
          </div>
          <div className="adm-kpi-value" style={{ color: "#4338ca" }}>
            {kpis.delivered}
          </div>
          <div className="adm-kpi-desc">Documento transmitido com confirmação</div>
        </div>

        <div
          className="adm-kpi-card"
          style={{ cursor: "pointer" }}
          onClick={() => handleDatePresetChange("today")}
          title="Filtrar passeios de hoje"
        >
          <div className="adm-kpi-header">
            <span>Passeios Hoje / Amanhã</span>
            <Calendar size={18} color="var(--adm-clay)" />
          </div>
          <div className="adm-kpi-value">
            {kpis.toursToday}{" "}
            <span style={{ fontSize: "16px", fontWeight: 600, color: "var(--adm-text-muted)" }}>
              / {kpis.toursTomorrow} amanhã
            </span>
          </div>
          <div className="adm-kpi-desc">Operações nos próximos dias</div>
        </div>
      </div>

      {/* Barra de Filtros e Busca Rápida */}
      <div className="adm-card adm-no-print" style={{ padding: "20px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Linha 1: Atalhos de Data e Busca Geral */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--adm-text-muted)", marginRight: "4px" }}>
                DATA DO PASSEIO:
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

            <div className="adm-search-input" style={{ width: "360px" }}>
              <Search size={16} color="var(--adm-clay)" />
              <input
                type="text"
                placeholder="Cliente, contrato, voucher ref ou hotel..."
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

          {/* Linha 2: Filtros Específicos */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "12px",
              paddingTop: "12px",
              borderTop: "1px solid var(--adm-border)",
            }}
          >
            {/* Status do Voucher */}
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--adm-text-muted)", marginBottom: "4px" }}>
                STATUS DO VOUCHER
              </label>
              <select
                className="adm-input"
                style={{ width: "100%", fontSize: "13px" }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="todos">Todos os Status</option>
                <option value="pendente">Pendente de Preparação</option>
                <option value="em_preparacao">Em Preparação</option>
                <option value="pronto">Pronto para Entrega</option>
                <option value="entregue">Entregue ao Cliente</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>

            {/* Fornecedor */}
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--adm-text-muted)", marginBottom: "4px" }}>
                FORNECEDOR RESPONSÁVEL
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

            {/* Passeio */}
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--adm-text-muted)", marginBottom: "4px" }}>
                NOME DO PASSEIO
              </label>
              <input
                type="text"
                className="adm-input"
                style={{ width: "100%", fontSize: "13px" }}
                placeholder="Ex: Xcaret, Chichén, Catamarã..."
                value={productNameFilter}
                onChange={(e) => setProductNameFilter(e.target.value)}
              />
            </div>

            {/* Datas Customizadas */}
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

          {/* Rodapé dos Filtros */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "6px" }}>
            <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px" }}>
              <input
                type="checkbox"
                checked={onlyPendencies}
                onChange={(e) => setOnlyPendencies(e.target.checked)}
                style={{ width: "16px", height: "16px", cursor: "pointer" }}
              />
              <span style={{ fontWeight: 600, color: "var(--adm-wine)" }}>
                Exibir somente vouchers com pendências
              </span>
            </label>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                Exibindo <strong>{filteredVouchers.length}</strong> de <strong>{vouchers.length}</strong> vouchers
              </span>

              {(datePreset !== "all" ||
                statusFilter !== "todos" ||
                supplierFilter !== "todos" ||
                productNameFilter ||
                searchTerm ||
                onlyPendencies ||
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
      </div>

      {/* Listagem de Vouchers */}
      {loading ? (
        <div className="adm-card adm-no-print" style={{ padding: "60px 20px", textAlign: "center" }}>
          <Clock size={32} className="animate-spin" color="var(--adm-clay)" style={{ margin: "0 auto 12px" }} />
          <p style={{ color: "var(--adm-text-muted)" }}>Carregando central de vouchers e documentos operacionais...</p>
        </div>
      ) : filteredVouchers.length === 0 ? (
        <div className="adm-card adm-no-print" style={{ padding: "60px 20px", textAlign: "center" }}>
          <Ticket size={44} color="var(--adm-clay)" style={{ margin: "0 auto 14px", opacity: 0.5 }} />
          <h3 style={{ fontSize: "18px", color: "var(--adm-wine)" }}>Nenhum voucher encontrado para os filtros selecionados</h3>
          <p style={{ color: "var(--adm-text-muted)", fontSize: "14px", marginTop: "4px", maxWidth: "480px", margin: "4px auto 0" }}>
            Os vouchers são originados dos passeios contratados nas vendas finalizadas. Ajuste os filtros acima para consultar outros períodos.
          </p>
          <div style={{ marginTop: "16px", display: "flex", justifyContent: "center", gap: "10px" }}>
            <button type="button" className="adm-btn adm-btn-clay adm-btn-sm" onClick={handleClearFilters}>
              <span>Ver Todos os Vouchers</span>
            </button>
            <Link href="/admin/contratos" className="adm-btn adm-btn-outline adm-btn-sm">
              <span>Ir para Contratos</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="adm-table-container adm-no-print">
          <div className="adm-table-responsive">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Data Passeio</th>
                  <th>Cliente & Contrato</th>
                  <th>Passeio Contratado</th>
                  <th>Ponto Encontro & Pickup</th>
                  <th>PAX</th>
                  <th>Código Voucher</th>
                  <th>Status Voucher</th>
                  <th>Reserva Operador</th>
                  <th style={{ textAlign: "right" }}>Ações Operacionais</th>
                </tr>
              </thead>
              <tbody>
                {filteredVouchers.map((v) => {
                  const tourDateObj = new Date(v.tour_date + "T12:00:00");
                  const dayOfWeek = tourDateObj.toLocaleDateString("pt-BR", { weekday: "short" });
                  const formattedDate = tourDateObj.toLocaleDateString("pt-BR");

                  const statusConf = VOUCHER_STATUS_CONFIG[v.voucher_status] || VOUCHER_STATUS_CONFIG.pendente;
                  const hasPendencies = v.pendencies.length > 0;

                  return (
                    <tr
                      key={v.id}
                      style={{ cursor: "pointer", background: v.voucher_status === "cancelado" ? "rgba(254, 242, 242, 0.4)" : undefined }}
                      onClick={() => setSelectedVoucherForView(v)}
                    >
                      {/* Data do Passeio */}
                      <td>
                        <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--adm-wine)" }}>
                          {formattedDate}
                        </div>
                        <div style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--adm-clay)", fontWeight: 700 }}>
                          {dayOfWeek}
                        </div>
                      </td>

                      {/* Cliente e Contrato */}
                      <td>
                        <div style={{ fontWeight: 600, color: "var(--adm-text-main)" }}>{v.client_name}</div>
                        <div style={{ fontSize: "11px", color: "var(--adm-text-muted)", marginTop: "2px" }}>
                          Contrato <strong>{v.contract_number}</strong>
                        </div>
                        {v.client_phone ? (
                          <div style={{ fontSize: "11px", color: "var(--adm-text-muted)", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                            <Phone size={10} />
                            <span>{v.client_phone}</span>
                          </div>
                        ) : (
                          <div style={{ fontSize: "10px", color: "#c2410c", fontWeight: 600, marginTop: "2px" }}>
                            Sem telefone
                          </div>
                        )}
                      </td>

                      {/* Passeio e Fornecedor */}
                      <td>
                        <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--adm-wine)" }}>
                          {v.product_name}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--adm-text-muted)", marginTop: "2px" }}>
                          Fornecedor: <strong>{v.supplier_name || "A definir"}</strong>
                        </div>
                      </td>

                      {/* Ponto de Encontro & Pickup */}
                      <td>
                        <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--adm-text-main)" }}>
                          {v.pickup_location || v.hotel_name || "A confirmar"}
                        </div>
                        <div style={{ fontSize: "11px", color: v.pickup_time ? "var(--adm-wine)" : "var(--adm-clay)", marginTop: "2px" }}>
                          Horário: <strong>{v.pickup_time ? v.pickup_time : "A confirmar na véspera"}</strong>
                        </div>
                        {v.hotel_zone && (
                          <div style={{ fontSize: "10px", color: "var(--adm-text-subtle)", marginTop: "1px" }}>
                            Zona: {v.hotel_zone}
                          </div>
                        )}
                      </td>

                      {/* Passageiros (PAX) */}
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Users size={14} color="var(--adm-clay)" />
                          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--adm-wine)" }}>
                            {v.total_pax} PAX
                          </span>
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--adm-text-muted)", marginTop: "2px" }}>
                          {v.adults_count} ad
                          {v.children_count > 0 ? `, ${v.children_count} ch` : ""}
                          {v.infants_count > 0 ? `, ${v.infants_count} bb` : ""}
                        </div>
                      </td>

                      {/* Código do Voucher */}
                      <td>
                        {v.voucher_ref ? (
                          <span
                            style={{
                              fontFamily: "monospace",
                              fontWeight: 700,
                              fontSize: "12px",
                              color: "var(--adm-wine)",
                              background: "var(--adm-surface-alt)",
                              padding: "3px 8px",
                              borderRadius: "6px",
                              border: "1px solid var(--adm-border)",
                              display: "inline-block",
                            }}
                          >
                            {v.voucher_ref}
                          </span>
                        ) : (
                          <span style={{ fontSize: "12px", color: "var(--adm-text-subtle)", fontStyle: "italic" }}>
                            Não gerado
                          </span>
                        )}
                      </td>

                      {/* Status do Voucher */}
                      <td>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "3px 10px",
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

                        {v.delivered_at && (
                          <div style={{ fontSize: "10px", color: "var(--adm-text-muted)", marginTop: "3px" }}>
                            Entregue em {new Date(v.delivered_at).toLocaleDateString("pt-BR")}
                          </div>
                        )}

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
                              <span>{v.pendencies.length} pendência(s)</span>
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Status da Reserva com Fornecedor (Informativo) */}
                      <td>
                        <span
                          style={{
                            fontSize: "11px",
                            color: "var(--adm-text-muted)",
                            background: "var(--adm-surface-alt)",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            border: "1px solid var(--adm-border)",
                          }}
                        >
                          {v.reservation_status === "confirmada"
                            ? "Confirmada com Forn."
                            : v.reservation_status === "solicitada"
                            ? "Solicitada ao Forn."
                            : v.reservation_status === "realizada"
                            ? "Realizada"
                            : v.reservation_status === "cancelada"
                            ? "Cancelada"
                            : "Aguardando Forn."}
                        </span>
                      </td>

                      {/* Ações */}
                      <td style={{ textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          {/* Visualizar / Imprimir PDF */}
                          <button
                            type="button"
                            className="adm-btn adm-btn-icon adm-btn-outline adm-btn-sm"
                            title="Visualizar documento e imprimir PDF"
                            onClick={() => setSelectedVoucherForView(v)}
                          >
                            <Printer size={14} color="var(--adm-wine)" />
                          </button>

                          {/* Enviar ao Cliente via WhatsApp */}
                          <button
                            type="button"
                            className="adm-btn adm-btn-icon adm-btn-outline adm-btn-sm"
                            title="Preparar envio do voucher ao cliente via WhatsApp"
                            onClick={() => handleOpenWhatsAppModal(v)}
                          >
                            <Send size={14} color="#15803d" />
                          </button>

                          {/* Editar Voucher Operacional */}
                          <button
                            type="button"
                            className="adm-btn adm-btn-icon adm-btn-outline adm-btn-sm"
                            title="Editar código, pickup e instruções do voucher"
                            onClick={() => handleOpenEditModal(v)}
                          >
                            <Edit2 size={14} />
                          </button>
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
          MODAL DE VISUALIZAÇÃO E IMPRESSÃO DO VOUCHER EM PDF (TÍO NENÊ MODEL)
         ========================================================================= */}
      {selectedVoucherForView && (
        <div
          className="adm-modal-backdrop"
          onClick={() => setSelectedVoucherForView(null)}
          style={{ overflowY: "auto", padding: "20px" }}
        >
          <div
            className="adm-modal-card"
            style={{ maxWidth: "800px", margin: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Barra de Ações Superior do Modal (Oculta na impressão) */}
            <div
              className="adm-modal-header adm-no-print"
              style={{ borderBottom: "1px solid var(--adm-border)", paddingBottom: "12px" }}
            >
              <div>
                <span className="admin-brand-tag">DOCUMENTO OPERACIONAL</span>
                <h3 style={{ fontSize: "18px", marginTop: "2px" }}>Visualização do Voucher Oficial</h3>
                <span style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                  Cliente: <strong>{selectedVoucherForView.client_name}</strong> · Contrato {selectedVoucherForView.contract_number}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  type="button"
                  className="adm-btn adm-btn-wine adm-btn-sm"
                  onClick={() => window.print()}
                >
                  <Printer size={14} />
                  <span>Imprimir / Salvar PDF</span>
                </button>

                <button
                  type="button"
                  className="adm-btn adm-btn-outline adm-btn-sm"
                  onClick={() => {
                    handleOpenWhatsAppModal(selectedVoucherForView);
                  }}
                >
                  <Send size={14} color="#15803d" />
                  <span>Enviar WhatsApp</span>
                </button>

                <button
                  type="button"
                  className="adm-btn adm-btn-outline adm-btn-sm"
                  onClick={() => {
                    handleOpenEditModal(selectedVoucherForView);
                  }}
                >
                  <Edit2 size={14} />
                  <span>Editar</span>
                </button>

                <button
                  type="button"
                  className="adm-btn adm-btn-icon adm-btn-outline"
                  onClick={() => setSelectedVoucherForView(null)}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* CONTEÚDO IMPRIMÍVEL DO VOUCHER (ESTILO BOUTIQUE A4 / CARD CELULAR) */}
            <div className="printable-voucher" style={{ padding: "32px", background: "#fff", color: "#1e1e1e" }}>
              {/* Header do Voucher com Logo */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  borderBottom: "2px solid var(--adm-wine)",
                  paddingBottom: "18px",
                  marginBottom: "24px",
                }}
              >
                <div>
                  <img
                    src="/img/tio-nene-03.svg"
                    alt="Tio Nenê Viagens"
                    style={{ height: "48px", width: "auto", display: "block" }}
                  />
                  <div style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--adm-clay)", fontWeight: 700, marginTop: "6px" }}>
                    CANCÚN & RIVIERA MAYA · RECEPTIVO OFICIAL
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      display: "inline-block",
                      padding: "4px 12px",
                      background: "var(--adm-wine)",
                      color: "#fff",
                      fontSize: "12px",
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      borderRadius: "6px",
                    }}
                  >
                    VOUCHER DE SERVIÇO
                  </div>
                  <div style={{ fontFamily: "monospace", fontSize: "16px", fontWeight: 700, color: "var(--adm-wine)", marginTop: "6px" }}>
                    {selectedVoucherForView.voucher_ref || "EM EMISSÃO"}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>
                    Emitido em: {new Date().toLocaleDateString("pt-BR")}
                  </div>
                </div>
              </div>

              {/* Informações Principais do Cliente e do Passeio */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.2fr 0.8fr",
                  gap: "20px",
                  marginBottom: "24px",
                  background: "#fcfaf7",
                  border: "1px solid #ebd9c8",
                  padding: "18px",
                  borderRadius: "10px",
                }}
              >
                {/* Coluna 1: Passeio e Passageiros */}
                <div>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--adm-clay)", textTransform: "uppercase" }}>
                    PASSEIO CONTRATADO
                  </span>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--adm-wine)", marginTop: "2px" }}>
                    {selectedVoucherForView.product_name}
                  </div>
                  <div style={{ fontSize: "14px", color: "#333", marginTop: "4px" }}>
                    Data do Passeio:{" "}
                    <strong>
                      {new Date(selectedVoucherForView.tour_date + "T12:00:00").toLocaleDateString("pt-BR", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </strong>
                  </div>
                  <div style={{ fontSize: "13px", color: "#555", marginTop: "4px" }}>
                    Passageiros (PAX):{" "}
                    <strong>
                      {selectedVoucherForView.total_pax} ({selectedVoucherForView.adults_count} Adultos
                      {selectedVoucherForView.children_count > 0 ? `, ${selectedVoucherForView.children_count} Crianças` : ""}
                      {selectedVoucherForView.infants_count > 0 ? `, ${selectedVoucherForView.infants_count} Bebês` : ""})
                    </strong>
                  </div>
                </div>

                {/* Coluna 2: Dados do Cliente e Contrato */}
                <div style={{ borderLeft: "1px dashed #d1c0af", paddingLeft: "20px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--adm-clay)", textTransform: "uppercase" }}>
                    TITULAR DA RESERVA
                  </span>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--adm-wine)", marginTop: "2px" }}>
                    {selectedVoucherForView.client_name}
                  </div>
                  {selectedVoucherForView.client_cpf && (
                    <div style={{ fontSize: "12px", color: "#555", marginTop: "2px" }}>
                      CPF: {selectedVoucherForView.client_cpf}
                    </div>
                  )}
                  <div style={{ fontSize: "12px", color: "#555", marginTop: "2px" }}>
                    Telefone: <strong>{selectedVoucherForView.client_phone || "Não informado"}</strong>
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--adm-clay)", fontWeight: 600, marginTop: "4px" }}>
                    Contrato Ref: {selectedVoucherForView.contract_number}
                  </div>
                </div>
              </div>

              {/* Informações Logísticas de Embarque / Encontro */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                  marginBottom: "24px",
                  background: "#ffffff",
                  border: "1px solid #e5e5e5",
                  padding: "16px",
                  borderRadius: "10px",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--adm-wine)", fontWeight: 700, fontSize: "13px" }}>
                    <MapPin size={16} />
                    <span>PONTO DE ENCONTRO / EMBARQUE</span>
                  </div>
                  <div style={{ fontSize: "15px", fontWeight: 700, marginTop: "4px", color: "#111" }}>
                    {selectedVoucherForView.pickup_location || selectedVoucherForView.hotel_name || "A confirmar com assessor"}
                  </div>
                  {selectedVoucherForView.hotel_zone && (
                    <div style={{ fontSize: "12px", color: "var(--adm-text-muted)", marginTop: "2px" }}>
                      Região: {selectedVoucherForView.hotel_zone}
                    </div>
                  )}
                </div>

                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--adm-wine)", fontWeight: 700, fontSize: "13px" }}>
                    <Clock size={16} />
                    <span>HORÁRIO PREVISTO DE PICKUP</span>
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: 800, marginTop: "4px", color: "var(--adm-wine)" }}>
                    {selectedVoucherForView.pickup_time || "A confirmar na véspera"}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--adm-text-muted)", marginTop: "2px" }}>
                    {selectedVoucherForView.pickup_time
                      ? "Aguardar pontualmente no lobby com 10 min de antecedência."
                      : "Horário exato informado até as 20h do dia anterior via WhatsApp."}
                  </div>
                </div>
              </div>

              {/* Instruções ao Cliente e Orientações de Embarque */}
              <div style={{ marginBottom: "24px" }}>
                <h4 style={{ fontSize: "13px", fontWeight: 800, color: "var(--adm-wine)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>
                  📌 ORIENTAÇÕES IMPORTANTES E RECOMENDAÇÕES
                </h4>
                <div
                  style={{
                    background: "#fdfcf9",
                    border: "1px solid #e8e2d8",
                    padding: "16px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    lineHeight: "1.6",
                    whiteSpace: "pre-line",
                    color: "#333",
                  }}
                >
                  {selectedVoucherForView.special_instructions ||
                    "• Apresentar documento oficial de identificação com foto e este voucher no celular.\n• Chegar ao local de embarque com 10 minutos de antecedência.\n• Levar toalha de banho, roupas confortáveis, chapéu e protetor solar biodegradável.\n• Não é permitida a entrada de bebidas alcoólicas externas ou drones em sítios arqueológicos."}
                </div>
              </div>

              {/* Informações de Suporte e Atendimento Tío Nenê */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "14px",
                  borderTop: "1px solid #ebd9c8",
                  paddingTop: "16px",
                  fontSize: "12px",
                  color: "#666",
                }}
              >
                <div>
                  <strong style={{ color: "var(--adm-wine)", display: "block" }}>Tío Nenê Viagens — Receptivo Cancún</strong>
                  <span>Suporte e Plantão 24h: <strong>+52 998 123 4567</strong> · E-mail: atendimento@tionene.com</span>
                </div>

                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "11px", color: "var(--adm-text-subtle)", display: "block" }}>
                    Voucher de acesso pessoal e intransferível.
                  </span>
                  <span style={{ fontSize: "11px", color: "var(--adm-clay)", fontWeight: 700 }}>
                    Tenha uma excelente viagem!
                  </span>
                </div>
              </div>
            </div>

            {/* Rodapé do Modal (Oculto na impressão) */}
            <div className="adm-modal-footer adm-no-print">
              <div style={{ display: "flex", gap: "8px" }}>
                <Link
                  href={`/admin/contratos?search=${selectedVoucherForView.contract_number}`}
                  className="adm-btn adm-btn-outline adm-btn-sm"
                >
                  <FileText size={14} />
                  <span>Ver Contrato</span>
                </Link>

                <Link
                  href={`/admin/reservas?id=${selectedVoucherForView.id}`}
                  className="adm-btn adm-btn-outline adm-btn-sm"
                >
                  <Clock size={14} />
                  <span>Ver Reserva</span>
                </Link>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className="adm-btn adm-btn-wine adm-btn-sm"
                  onClick={() => window.print()}
                >
                  <Printer size={14} />
                  <span>Imprimir PDF</span>
                </button>

                <button
                  type="button"
                  className="adm-btn adm-btn-clay adm-btn-sm"
                  onClick={() => setSelectedVoucherForView(null)}
                >
                  <span>Fechar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL DE EDIÇÃO OPERACIONAL DO VOUCHER
         ========================================================================= */}
      {editModal.open && (
        <div className="adm-modal-backdrop" onClick={() => setEditModal((prev) => ({ ...prev, open: false }))}>
          <div
            className="adm-modal-card"
            style={{ maxWidth: "620px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSaveVoucherEdit}>
              <div className="adm-modal-header">
                <div>
                  <span className="admin-brand-tag">EDIÇÃO OPERACIONAL</span>
                  <h3 style={{ fontSize: "18px", marginTop: "2px" }}>Ajustar Dados do Voucher</h3>
                  <span style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                    Passeio: <strong>{editModal.voucher?.product_name}</strong> · Contrato {editModal.voucher?.contract_number}
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
                  <strong>Independência Contratual:</strong> As edições desta tela afetam apenas as orientações logísticas e o código do voucher do cliente. Não modificam preços contratuais, custos de fornecedores nem o PDF emitido da venda.
                </div>

                {/* Código do Voucher */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--adm-text-muted)" }}>
                      CÓDIGO / REFERÊNCIA DO VOUCHER
                    </label>
                    <button
                      type="button"
                      className="adm-btn adm-btn-outline adm-btn-sm"
                      style={{ fontSize: "11px", padding: "2px 8px" }}
                      onClick={handleSuggestVoucherRef}
                    >
                      <Sparkles size={12} />
                      <span>Sugerir Código Automático</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    className="adm-input"
                    style={{ width: "100%", fontFamily: "monospace", fontSize: "13px" }}
                    placeholder="Ex: VCH-TN-2026-0042-01"
                    value={editModal.voucherRef}
                    onChange={(e) => setEditModal((prev) => ({ ...prev, voucherRef: e.target.value }))}
                  />
                </div>

                {/* Status do Voucher e Horário de Pickup */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--adm-text-muted)", marginBottom: "4px" }}>
                      STATUS DO VOUCHER
                    </label>
                    <select
                      className="adm-input"
                      style={{ width: "100%" }}
                      value={editModal.voucherStatus}
                      onChange={(e) => setEditModal((prev) => ({ ...prev, voucherStatus: e.target.value as VoucherOperationalStatus }))}
                    >
                      <option value="pendente">Pendente de Preparação</option>
                      <option value="em_preparacao">Em Preparação</option>
                      <option value="pronto">Pronto para Entrega</option>
                      <option value="entregue">Entregue ao Cliente</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--adm-text-muted)", marginBottom: "4px" }}>
                      HORÁRIO DO PICKUP
                    </label>
                    <input
                      type="text"
                      className="adm-input"
                      style={{ width: "100%" }}
                      placeholder="Ex: 07:15 ou 14:30"
                      value={editModal.pickupTime}
                      onChange={(e) => setEditModal((prev) => ({ ...prev, pickupTime: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Ponto de Encontro / Local de Embarque */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--adm-text-muted)", marginBottom: "4px" }}>
                    PONTO DE ENCONTRO / LOCAL DE EMBARQUE
                  </label>
                  <input
                    type="text"
                    className="adm-input"
                    style={{ width: "100%" }}
                    placeholder="Ex: Lobby do Hotel Riu Palace Peninsula"
                    value={editModal.pickupLocation}
                    onChange={(e) => setEditModal((prev) => ({ ...prev, pickupLocation: e.target.value }))}
                  />
                </div>

                {/* Instruções ao Cliente e Orientações */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--adm-text-muted)", marginBottom: "4px" }}>
                    INSTRUÇÕES AO CLIENTE & O QUE LEVAR
                  </label>
                  <textarea
                    className="adm-input"
                    rows={5}
                    style={{ width: "100%", fontSize: "12px", lineHeight: "1.5" }}
                    placeholder="Orientações de embarque, o que levar, trajes adequados, tolerância de espera..."
                    value={editModal.specialInstructions}
                    onChange={(e) => setEditModal((prev) => ({ ...prev, specialInstructions: e.target.value }))}
                  />
                </div>

                {/* Observações Operacionais Internas */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--adm-text-muted)", marginBottom: "4px" }}>
                    OBSERVAÇÕES OPERACIONAIS INTERNAS
                  </label>
                  <textarea
                    className="adm-input"
                    rows={2}
                    style={{ width: "100%", fontSize: "12px" }}
                    placeholder="Notas internas da agência (não constam no voucher do cliente)..."
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
                  <span>{editModal.submitting ? "Salvando..." : "Salvar Dados do Voucher"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL DE ENVIO VIA WHATSAPP COM CONFIRMAÇÃO EXPLÍCITA DE ENTREGA
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
                <span className="admin-brand-tag" style={{ color: "#15803d" }}>ENVIO DE VOUCHER AO CLIENTE</span>
                <h3 style={{ fontSize: "18px", marginTop: "2px" }}>Disponibilizar Voucher via WhatsApp</h3>
                <span style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                  Cliente: <strong>{whatsappModal.voucher?.client_name}</strong> · {whatsappModal.voucher?.product_name}
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
              {/* Alerta de Contato Válido */}
              {!whatsappModal.targetPhone ? (
                <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", padding: "10px 14px", borderRadius: "8px", fontSize: "12px", color: "#c2410c", display: "flex", alignItems: "center", gap: "8px" }}>
                  <AlertTriangle size={16} />
                  <span><strong>Atenção:</strong> O cliente não possui número de telefone cadastrado no contrato. Insira um número válido abaixo para envio.</span>
                </div>
              ) : (
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "10px 14px", borderRadius: "8px", fontSize: "12px", color: "#166534" }}>
                  <strong>Segurança e Confidencialidade:</strong> Esta mensagem contém exclusivamente os dados logísticos do passeio do turista. Valores de venda, custos e margens de fornecedores nunca são exibidos.
                </div>
              )}

              {/* Telefone do Cliente */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--adm-text-muted)", marginBottom: "4px" }}>
                  TELEFONE / WHATSAPP DO CLIENTE
                </label>
                <input
                  type="text"
                  className="adm-input"
                  style={{ width: "100%" }}
                  placeholder="Ex: 5511999999999"
                  value={whatsappModal.targetPhone}
                  onChange={(e) => setWhatsappModal((prev) => ({ ...prev, targetPhone: e.target.value }))}
                />
              </div>

              {/* Mensagem Formatada */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--adm-text-muted)" }}>
                    MENSAGEM DO VOUCHER (REVISÁVEL)
                  </label>
                  <button
                    type="button"
                    className="adm-btn adm-btn-outline adm-btn-sm"
                    style={{ fontSize: "11px", padding: "2px 8px" }}
                    onClick={() => {
                      navigator.clipboard.writeText(whatsappModal.messageText);
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
                  value={whatsappModal.messageText}
                  onChange={(e) => setWhatsappModal((prev) => ({ ...prev, messageText: e.target.value }))}
                />
              </div>

              {/* Instrução da Confirmação Explícita */}
              <div style={{ background: "var(--adm-surface-alt)", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--adm-border)", fontSize: "12px", color: "var(--adm-text-muted)" }}>
                <strong>Regra Operacional:</strong> Clicar em "Abrir no WhatsApp" abre a conversa mas <em>não marca como entregue</em> automaticamente. Após enviar o voucher ao turista, clique no botão <strong>"Confirmar Entrega do Voucher"</strong> para registrar a entrega formal no sistema.
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
                  disabled={!whatsappModal.targetPhone}
                >
                  <Send size={14} />
                  <span>Abrir no WhatsApp</span>
                </button>

                <button
                  type="button"
                  className="adm-btn adm-btn-wine adm-btn-sm"
                  onClick={handleConfirmVoucherDelivery}
                  disabled={whatsappModal.submitting}
                >
                  <CheckCheck size={14} />
                  <span>{whatsappModal.submitting ? "Registrando..." : "Confirmar Entrega do Voucher"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estilos Scoped de Impressão para o Voucher */}
      <style jsx global>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }

          .adm-no-print,
          .admin-sidebar,
          .admin-topbar,
          .adm-modal-header,
          .adm-modal-footer {
            display: none !important;
            visibility: hidden !important;
          }

          .adm-modal-backdrop {
            position: static !important;
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
          }

          .adm-modal-card {
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            display: block !important;
          }

          .printable-voucher {
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}
