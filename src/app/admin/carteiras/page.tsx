"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuthProfile } from "@/lib/auth/AuthContext";
import {
  WalletStatus,
  TravelWalletData,
  TravelWalletItem,
  WalletDeliveryRecord,
  WalletKpis,
  WalletFilters,
  buildTravelWallet,
  buildOperationalSnapshot,
  detectOperationalChangesAfterDelivery,
  generateWalletWhatsAppMessage,
  validateWalletDelivery,
  calculateWalletKpis,
  filterWallets,
  formatDate,
  getWeekdayName,
  DEFAULT_WELCOME_MESSAGE,
  DEFAULT_GENERAL_GUIDELINES,
  DEFAULT_CLIENT_RECOMMENDATIONS,
} from "@/lib/operational/walletOperations";
import { formatWhatsAppLink } from "@/lib/operational/supplierMessaging";
import {
  Wallet,
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
  History,
  ShieldCheck,
  MessageSquare,
  ArrowRight,
} from "lucide-react";

const WALLET_STATUS_CONFIG: Record<
  WalletStatus,
  { label: string; bg: string; color: string; border: string; desc: string }
> = {
  pendente: {
    label: "Pendente de Preparação",
    bg: "#fff7ed",
    color: "#c2410c",
    border: "#fed7aa",
    desc: "Contrato finalizado; aguardando personalização inicial da carteira",
  },
  em_preparacao: {
    label: "Em Preparação",
    bg: "#fef3c7",
    color: "#b45309",
    border: "#fde68a",
    desc: "Carteira com edições e instruções em andamento pelo operador",
  },
  pronta: {
    label: "Pronta para Entrega",
    bg: "#dcfce7",
    color: "#15803d",
    border: "#86efac",
    desc: "Programação e orientações revisadas e prontas para envio ao cliente",
  },
  entregue: {
    label: "Entregue ao Cliente",
    bg: "#e0e7ff",
    color: "#4338ca",
    border: "#c7d2fe",
    desc: "Documento oficial disponibilizado e confirmado com o turista",
  },
  necessita_atualizacao: {
    label: "Necessita Atualização",
    bg: "#fee2e2",
    color: "#b91c1c",
    border: "#fca5a5",
    desc: "Informações operacionais foram modificadas após a entrega",
  },
};

type DatePreset = "all" | "this_month" | "next_30" | "custom";

export default function AdminCarteirasPage() {
  const { role, profile } = useAuthProfile();
  const isAdmin = role === "admin";
  const operatorName = profile?.fullName || "Operador";

  // Estados de Dados Principais
  const [loading, setLoading] = useState<boolean>(true);
  const [contractsList, setContractsList] = useState<any[]>([]);
  const [reservationsList, setReservationsList] = useState<any[]>([]);
  const [arrivalsMap, setArrivalsMap] = useState<Record<string, any>>({});
  const [walletRecordsMap, setWalletRecordsMap] = useState<Record<string, any>>({});
  const [deliveriesList, setDeliveriesList] = useState<WalletDeliveryRecord[]>([]);

  // Filtros
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [onlyWithPendencies, setOnlyWithPendencies] = useState<boolean>(false);

  // Modais
  const [editModal, setEditModal] = useState<{
    open: boolean;
    wallet: TravelWalletData | null;
    welcomeMessage: string;
    generalGuidelines: string;
    clientRecommendations: string;
    serviceCustomizations: Record<
      string,
      { operator_notes?: string; additional_meeting_instructions?: string }
    >;
    targetStatus: WalletStatus;
    submitting: boolean;
  }>({
    open: false,
    wallet: null,
    welcomeMessage: "",
    generalGuidelines: "",
    clientRecommendations: "",
    serviceCustomizations: {},
    targetStatus: "em_preparacao",
    submitting: false,
  });

  const [viewModal, setViewModal] = useState<{
    open: boolean;
    wallet: TravelWalletData | null;
  }>({
    open: false,
    wallet: null,
  });

  const [whatsappModal, setWhatsappModal] = useState<{
    open: boolean;
    wallet: TravelWalletData | null;
    targetPhone: string;
    deliveryChannel: string;
    notes: string;
    messageText: string;
    copied: boolean;
    submitting: boolean;
  }>({
    open: false,
    wallet: null,
    targetPhone: "",
    deliveryChannel: "whatsapp",
    notes: "",
    messageText: "",
    copied: false,
    submitting: false,
  });

  const [historyModal, setHistoryModal] = useState<{
    open: boolean;
    wallet: TravelWalletData | null;
    deliveries: WalletDeliveryRecord[];
  }>({
    open: false,
    wallet: null,
    deliveries: [],
  });

  // Notificação Toast
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Carregar Dados do Banco de Dados
  const fetchAllData = async () => {
    setLoading(true);
    try {
      // 1. Buscar contratos finalizados (ou emitidos com itens válidos)
      const { data: contractsData, error: cErr } = await supabase
        .from("contracts")
        .select(`
          id,
          contract_number,
          client_id,
          client_name,
          client_phone,
          client_email,
          client_cpf,
          status,
          travel_start_date,
          travel_end_date,
          arrival_date,
          departure_date,
          hotel_name,
          hotel_zone,
          adults_count,
          children_count,
          infants_count,
          hotels_schedule,
          created_at
        `)
        .in("status", ["finalizado", "emitido", "assinado"])
        .order("created_at", { ascending: false });

      if (cErr) {
        console.warn("Erro ao buscar contratos para carteiras:", cErr.message);
      }

      const eligibleContracts = contractsData || [];
      setContractsList(eligibleContracts);

      const contractIds = eligibleContracts.map((c) => c.id);

      // 2. Buscar reservas operacionais vinculadas
      if (contractIds.length > 0) {
        const { data: resData, error: rErr } = await supabase
          .from("operational_reservations")
          .select(`
            id,
            contract_id,
            contract_item_id,
            product_name,
            tour_id_code,
            tour_date,
            pickup_time,
            pickup_location,
            hotel_zone,
            supplier_id,
            supplier_name,
            supplier_confirmation_code,
            voucher_ref,
            status,
            cancellation_status,
            adults_count,
            children_count,
            infants_count
          `)
          .in("contract_id", contractIds);

        if (!rErr && resData) {
          setReservationsList(resData);
        } else {
          setReservationsList([]);
        }

        // 3. Buscar chegadas vinculadas
        const { data: arrData } = await supabase
          .from("arrivals")
          .select("*")
          .in("contract_id", contractIds);

        const aMap: Record<string, any> = {};
        (arrData || []).forEach((a) => {
          aMap[a.contract_id] = a;
        });
        setArrivalsMap(aMap);

        // 4. Buscar carteiras de viagem salvas (travel_wallets)
        try {
          const { data: walletsData, error: wErr } = await supabase
            .from("travel_wallets")
            .select("*")
            .in("contract_id", contractIds);

          if (!wErr && walletsData) {
            const wMap: Record<string, any> = {};
            walletsData.forEach((w) => {
              wMap[w.contract_id] = w;
            });
            setWalletRecordsMap(wMap);
          }
        } catch {
          // Fallback gracioso se a migration de persistência ainda não foi executada no Supabase
          setWalletRecordsMap({});
        }

        // 5. Buscar histórico de entregas (travel_wallet_deliveries)
        try {
          const { data: delivData, error: dErr } = await supabase
            .from("travel_wallet_deliveries")
            .select("*")
            .in("contract_id", contractIds)
            .order("delivered_at", { ascending: false });

          if (!dErr && delivData) {
            setDeliveriesList(delivData);
          }
        } catch {
          setDeliveriesList([]);
        }
      }
    } catch (err: any) {
      console.error("Erro ao carregar dados das carteiras:", err);
      showToast("Erro ao carregar carteiras: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search).get("search") || new URLSearchParams(window.location.search).get("q");
      if (q) setSearchTerm(q);
    }
  }, []);

  // Presets de Data
  const handleDatePreset = (preset: DatePreset) => {
    setDatePreset(preset);
    const now = new Date();

    if (preset === "all") {
      setStartDate("");
      setEndDate("");
    } else if (preset === "this_month") {
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
      setStartDate(`${year}-${month}-01`);
      setEndDate(`${year}-${month}-${lastDay}`);
    } else if (preset === "next_30") {
      const startStr = now.toISOString().split("T")[0];
      const future = new Date(now);
      future.setDate(future.getDate() + 30);
      const endStr = future.toISOString().split("T")[0];
      setStartDate(startStr);
      setEndDate(endStr);
    }
  };

  // Construir Lista Consolidada de Carteiras de Viagem
  const allWallets: TravelWalletData[] = useMemo(() => {
    return contractsList.map((contract) => {
      const contractReservations = reservationsList.filter((r) => r.contract_id === contract.id);
      const contractArrival = arrivalsMap[contract.id] || null;
      const contractWalletRecord = walletRecordsMap[contract.id] || null;
      const contractDeliveries = deliveriesList.filter((d) => d.contract_id === contract.id);

      return buildTravelWallet({
        contract,
        reservations: contractReservations,
        arrivals: contractArrival,
        walletRecord: contractWalletRecord,
        deliveries: contractDeliveries,
      });
    });
  }, [contractsList, reservationsList, arrivalsMap, walletRecordsMap, deliveriesList]);

  // Aplicar Filtros
  const filteredWallets: TravelWalletData[] = useMemo(() => {
    return filterWallets(allWallets, {
      searchTerm,
      status: statusFilter,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      onlyWithPendencies,
    });
  }, [allWallets, searchTerm, statusFilter, startDate, endDate, onlyWithPendencies]);

  // KPIs
  const kpis: WalletKpis = useMemo(() => {
    return calculateWalletKpis(allWallets);
  }, [allWallets]);

  // ---------------------------------------------------------------------------
  // AÇÕES: ABRIR MODAIS
  // ---------------------------------------------------------------------------

  const handleOpenEdit = (wallet: TravelWalletData) => {
    setEditModal({
      open: true,
      wallet,
      welcomeMessage: wallet.welcome_message,
      generalGuidelines: wallet.general_guidelines,
      clientRecommendations: wallet.client_recommendations,
      serviceCustomizations: { ...wallet.service_customizations },
      targetStatus:
        wallet.status === "pendente"
          ? "em_preparacao"
          : wallet.status === "entregue"
          ? "pronta"
          : wallet.status,
      submitting: false,
    });
  };

  const handleOpenView = (wallet: TravelWalletData) => {
    setViewModal({
      open: true,
      wallet,
    });
  };

  const handleOpenWhatsApp = (wallet: TravelWalletData) => {
    const rawPhone = wallet.client_phone || "";
    const generatedMsg = generateWalletWhatsAppMessage(wallet);

    setWhatsappModal({
      open: true,
      wallet,
      targetPhone: rawPhone,
      deliveryChannel: "whatsapp",
      notes: "",
      messageText: generatedMsg,
      copied: false,
      submitting: false,
    });
  };

  const handleOpenHistory = (wallet: TravelWalletData) => {
    const records = deliveriesList.filter((d) => d.contract_id === wallet.contract_id);
    setHistoryModal({
      open: true,
      wallet,
      deliveries: records,
    });
  };

  // ---------------------------------------------------------------------------
  // GRAVAÇÃO DE PERSONALIZAÇÕES (EDIÇÃO INDEPENDENTE)
  // ---------------------------------------------------------------------------
  const handleSaveCustomizations = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal.wallet) return;

    setEditModal((prev) => ({ ...prev, submitting: true }));

    const wallet = editModal.wallet;
    const nowIso = new Date().toISOString();
    const currentSnapshot = buildOperationalSnapshot(wallet.items);
    const newVersion = (wallet.version || 1) + 1;

    try {
      const payload = {
        contract_id: wallet.contract_id,
        client_id: wallet.client_id,
        status: editModal.targetStatus === "entregue" ? "pronta" : editModal.targetStatus,
        welcome_message: editModal.welcomeMessage,
        general_guidelines: editModal.generalGuidelines,
        client_recommendations: editModal.clientRecommendations,
        service_customizations: editModal.serviceCustomizations,
        created_by_name: operatorName,
        updated_at: nowIso,
      };

      const { data, error } = await supabase
        .from("travel_wallets")
        .upsert(payload, { onConflict: "contract_id" })
        .select()
        .single();

      if (error) {
        console.warn("travel_wallets upsert aviso (tabela pode estar em migração):", error.message);
        // Fallback local caso tabela ainda não esteja migrada
        setWalletRecordsMap((prev) => ({
          ...prev,
          [wallet.contract_id]: { ...payload, id: "local-" + wallet.contract_id },
        }));
      } else if (data) {
        setWalletRecordsMap((prev) => ({
          ...prev,
          [wallet.contract_id]: data,
        }));
      }

      showToast("Personalizações da Carteira de Viagem salvas com sucesso!");
      setEditModal((prev) => ({ ...prev, open: false, submitting: false }));
      fetchAllData();
    } catch (err: any) {
      console.error("Erro ao salvar carteira:", err);
      showToast("Erro ao salvar: " + err.message, "error");
      setEditModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  // ---------------------------------------------------------------------------
  // CONFIRMAÇÃO EXPLÍCITA DE ENTREGA
  // ---------------------------------------------------------------------------
  const handleConfirmDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whatsappModal.wallet) return;

    const wallet = whatsappModal.wallet;

    const validation = validateWalletDelivery({
      destinationContact: whatsappModal.targetPhone,
      deliveredByName: operatorName,
      channel: whatsappModal.deliveryChannel,
      itemsCount: wallet.items.length,
    });

    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setWhatsappModal((prev) => ({ ...prev, submitting: true }));

    const nowIso = new Date().toISOString();
    const currentSnapshot = buildOperationalSnapshot(wallet.items);
    const deliveredVersion = wallet.version || 1;

    try {
      // 1. Executar entrega atômica via RPC SECURITY DEFINER
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "confirm_travel_wallet_delivery",
        {
          p_wallet_id: wallet.id?.startsWith("local-") ? null : (wallet.id || null),
          p_contract_id: wallet.contract_id,
          p_destination_contact: whatsappModal.targetPhone,
          p_delivery_channel: whatsappModal.deliveryChannel,
          p_delivered_by_name: operatorName,
          p_notes: whatsappModal.notes.trim() || null,
          p_snapshot: currentSnapshot,
        }
      );

      if (rpcError) {
        console.warn(
          "RPC confirm_travel_wallet_delivery fallback local (migração pendente de execução):",
          rpcError.message
        );
        // Fallback defensivo se a migration ainda não foi executada no Supabase
        const walletPayload = {
          contract_id: wallet.contract_id,
          client_id: wallet.client_id,
          status: "entregue",
          welcome_message: wallet.welcome_message,
          general_guidelines: wallet.general_guidelines,
          client_recommendations: wallet.client_recommendations,
          service_customizations: wallet.service_customizations,
          last_operational_snapshot: currentSnapshot,
          delivered_version: deliveredVersion,
          last_delivered_at: nowIso,
          last_delivered_by_name: operatorName,
          last_delivered_to: whatsappModal.targetPhone,
          last_delivery_channel: whatsappModal.deliveryChannel,
          updated_at: nowIso,
        };

        const { data: fallbackWallet } = await supabase
          .from("travel_wallets")
          .upsert(walletPayload, { onConflict: "contract_id" })
          .select()
          .single();

        const walletId = fallbackWallet?.id || wallet.id || "local-" + wallet.contract_id;

        const deliveryPayload = {
          wallet_id: walletId,
          contract_id: wallet.contract_id,
          delivered_at: nowIso,
          delivered_by_name: operatorName,
          delivery_channel: whatsappModal.deliveryChannel,
          destination_contact: whatsappModal.targetPhone,
          wallet_version: deliveredVersion,
          notes: whatsappModal.notes.trim() || null,
          created_at: nowIso,
        };

        try {
          await supabase.from("travel_wallet_deliveries").insert(deliveryPayload);
        } catch (dErr) {
          console.warn("travel_wallet_deliveries insert fallback:", dErr);
        }
      } else if (rpcData) {
        console.log("Entrega confirmada com sucesso via RPC atômica:", rpcData);
      }

      showToast("Entrega da Carteira de Viagem confirmada e registrada com sucesso!");
      setWhatsappModal((prev) => ({ ...prev, open: false, submitting: false }));
      fetchAllData();
    } catch (err: any) {
      console.error("Erro ao registrar entrega:", err);
      showToast("Erro ao confirmar entrega: " + err.message, "error");
      setWhatsappModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  // Abrir WhatsApp Web / App
  const handleOpenWhatsAppLink = () => {
    if (!whatsappModal.targetPhone) {
      alert("Informe o telefone de destino para abrir o WhatsApp.");
      return;
    }
    const link = formatWhatsAppLink(whatsappModal.targetPhone, whatsappModal.messageText);
    if (!link) {
      alert("Número de telefone inválido para o WhatsApp. Verifique o número informado.");
      return;
    }
    window.open(link, "_blank", "noopener,noreferrer");
  };

  // Copiar Texto da Mensagem
  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(whatsappModal.messageText);
      setWhatsappModal((prev) => ({ ...prev, copied: true }));
      setTimeout(() => setWhatsappModal((prev) => ({ ...prev, copied: false })), 3000);
    } catch {
      alert("Não foi possível copiar o texto automaticamente.");
    }
  };

  // Disparar Impressão / Salvar PDF
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="admin-page" style={{ padding: "24px 28px", maxWidth: "1520px", margin: "0 auto" }}>
      {/* Toast de Notificação */}
      {toastMessage && (
        <div
          className={`adm-toast adm-toast-${toastMessage.type}`}
          style={{
            position: "fixed",
            top: "20px",
            right: "24px",
            zIndex: 9999,
            padding: "12px 20px",
            borderRadius: "10px",
            background: toastMessage.type === "success" ? "#15803d" : "#b91c1c",
            color: "#fff",
            fontSize: "13px",
            fontWeight: 600,
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {toastMessage.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Cabeçalho da Página */}
      <div
        className="adm-card adm-no-print"
        style={{
          padding: "24px 28px",
          marginBottom: "24px",
          background: "linear-gradient(135deg, #ffffff 0%, #fcfaf7 100%)",
          border: "1px solid var(--adm-border)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
              <span className="admin-brand-tag" style={{ background: "var(--adm-wine)", color: "#fff", padding: "2px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 700 }}>
                DOCUMENTOS DO CLIENTE
              </span>
              <span style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                Versão v0.1.43 · Tío Nenê Cancún
              </span>
            </div>
            <h1 style={{ fontSize: "24px", color: "var(--adm-wine)", margin: "0 0 6px 0", display: "flex", alignItems: "center", gap: "10px" }}>
              <Wallet size={24} color="var(--adm-wine)" />
              Central de Carteiras de Viagem
            </h1>
            <p style={{ fontSize: "13px", color: "var(--adm-text-muted)", margin: 0, maxWidth: "800px" }}>
              Reúna os serviços contratados, vouchers, horários de pickup, hotel e orientações exclusivas em um documento personalizado para o cliente. Independente dos fornecedores e sem alterar o contrato oficial.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              type="button"
              className="adm-btn adm-btn-outline adm-btn-sm"
              onClick={fetchAllData}
              disabled={loading}
              title="Recarregar dados"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span>Atualizar</span>
            </button>
            <Link href="/admin/vouchers" className="adm-btn adm-btn-outline adm-btn-sm">
              <FileText size={14} />
              <span>Central de Vouchers</span>
            </Link>
            <Link href="/admin/contratos" className="adm-btn adm-btn-outline adm-btn-sm">
              <Building size={14} />
              <span>Contratos</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Grade de KPIs */}
      <div
        className="adm-kpi-grid adm-no-print"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "14px",
          marginBottom: "24px",
        }}
      >
        <div className="adm-card" style={{ padding: "16px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--adm-text-muted)" }}>Elegíveis / Contratos</span>
            <Building size={16} color="var(--adm-wine)" />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--adm-wine)", marginTop: "8px" }}>
            {kpis.totalEligible}
          </div>
          <span style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>Vendas finalizadas</span>
        </div>

        <div className="adm-card" style={{ padding: "16px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#c2410c" }}>Pendente Preparação</span>
            <Clock size={16} color="#c2410c" />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "#c2410c", marginTop: "8px" }}>
            {kpis.pending}
          </div>
          <span style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>Aguardando início</span>
        </div>

        <div className="adm-card" style={{ padding: "16px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#b45309" }}>Em Preparação</span>
            <Edit2 size={16} color="#b45309" />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "#b45309", marginTop: "8px" }}>
            {kpis.inPreparation}
          </div>
          <span style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>Em personalização</span>
        </div>

        <div className="adm-card" style={{ padding: "16px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#15803d" }}>Prontas para Entrega</span>
            <CheckCircle2 size={16} color="#15803d" />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "#15803d", marginTop: "8px" }}>
            {kpis.ready}
          </div>
          <span style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>Revisadas e prontas</span>
        </div>

        <div className="adm-card" style={{ padding: "16px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#4338ca" }}>Entregues ao Cliente</span>
            <CheckCheck size={16} color="#4338ca" />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "#4338ca", marginTop: "8px" }}>
            {kpis.delivered}
          </div>
          <span style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>Enviadas formalmente</span>
        </div>

        <div className="adm-card" style={{ padding: "16px 20px", background: kpis.needsUpdate > 0 ? "#fff1f2" : undefined, border: kpis.needsUpdate > 0 ? "1px solid #fecdd3" : undefined }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#b91c1c" }}>Necessita Atualização</span>
            <AlertTriangle size={16} color="#b91c1c" />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "#b91c1c", marginTop: "8px" }}>
            {kpis.needsUpdate}
          </div>
          <span style={{ fontSize: "11px", color: "#b91c1c" }}>Alteração pós-entrega</span>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div
        className="adm-card adm-no-print"
        style={{
          padding: "18px 22px",
          marginBottom: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          {/* Busca por Texto */}
          <div style={{ position: "relative", flex: "1 1 280px", maxWidth: "420px" }}>
            <Search
              size={16}
              style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--adm-text-muted)" }}
            />
            <input
              type="text"
              className="adm-input"
              placeholder="Buscar cliente, contrato, hotel ou telefone..."
              style={{ width: "100%", paddingLeft: "36px" }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filtro por Status da Carteira */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--adm-text-muted)" }}>Status:</span>
            <select
              className="adm-input"
              style={{ minWidth: "180px" }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Todos os Status</option>
              <option value="pendente">Pendente de Preparação</option>
              <option value="em_preparacao">Em Preparação</option>
              <option value="pronta">Pronta para Entrega</option>
              <option value="entregue">Entregue</option>
              <option value="necessita_atualizacao">⚠️ Necessita Atualização</option>
            </select>
          </div>

          {/* Filtro por Período de Viagem */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            <button
              type="button"
              className={`adm-btn adm-btn-sm ${datePreset === "all" ? "adm-btn-wine" : "adm-btn-outline"}`}
              onClick={() => handleDatePreset("all")}
            >
              Todas as Datas
            </button>
            <button
              type="button"
              className={`adm-btn adm-btn-sm ${datePreset === "this_month" ? "adm-btn-wine" : "adm-btn-outline"}`}
              onClick={() => handleDatePreset("this_month")}
            >
              Este Mês
            </button>
            <button
              type="button"
              className={`adm-btn adm-btn-sm ${datePreset === "next_30" ? "adm-btn-wine" : "adm-btn-outline"}`}
              onClick={() => handleDatePreset("next_30")}
            >
              Próximos 30 dias
            </button>
          </div>

          {/* Checkbox Apenas Pendências */}
          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer", userSelect: "none" }}>
            <input
              type="checkbox"
              checked={onlyWithPendencies}
              onChange={(e) => setOnlyWithPendencies(e.target.checked)}
            />
            <span style={{ color: "var(--adm-text-main)", fontWeight: 600 }}>Apenas com Pendências</span>
          </label>
        </div>

        {/* Datas Customizadas */}
        {datePreset === "custom" && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", borderTop: "1px dashed var(--adm-border)", paddingTop: "10px" }}>
            <span style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>Período personalizado de viagem:</span>
            <input
              type="date"
              className="adm-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>até</span>
            <input
              type="date"
              className="adm-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Listagem / Tabela Principal de Carteiras */}
      <div className="adm-table-container adm-no-print" style={{ background: "#fff", borderRadius: "12px", border: "1px solid var(--adm-border)" }}>
        <div className="adm-table-responsive">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Contrato / Cliente</th>
                <th>Período & Hospedagem</th>
                <th>Serviços Contratados</th>
                <th>Status da Carteira</th>
                <th>Pendências / Alertas</th>
                <th>Última Entrega</th>
                <th style={{ textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "48px", color: "var(--adm-text-muted)" }}>
                    <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 10px" }} />
                    Carregando carteiras de viagem dos contratos...
                  </td>
                </tr>
              ) : filteredWallets.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "48px", color: "var(--adm-text-muted)" }}>
                    Nenhuma carteira de viagem encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredWallets.map((wallet) => {
                  const cfg = WALLET_STATUS_CONFIG[wallet.status];
                  const hasAlerts = wallet.status === "necessita_atualizacao";

                  return (
                    <tr key={wallet.contract_id} style={{ background: hasAlerts ? "#fffdfd" : undefined }}>
                      {/* Contrato / Cliente */}
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <Link
                            href="/admin/contratos"
                            style={{ fontWeight: 800, color: "var(--adm-wine)", textDecoration: "none", fontSize: "14px" }}
                            title="Ver contrato oficial"
                          >
                            {wallet.contract_number}
                          </Link>
                          <strong style={{ fontSize: "13px", color: "var(--adm-text-main)" }}>
                            {wallet.client_name}
                          </strong>
                          <span style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>
                            {wallet.total_pax} PAX ({wallet.adults_count} ADT{wallet.children_count > 0 ? `, ${wallet.children_count} CHD` : ""}{wallet.infants_count > 0 ? `, ${wallet.infants_count} INF` : ""})
                          </span>
                          {wallet.client_phone && (
                            <span style={{ fontSize: "11px", color: "var(--adm-text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                              <Phone size={10} />
                              {wallet.client_phone}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Período & Hospedagem */}
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--adm-text-main)" }}>
                            {wallet.travel_start_date ? formatDate(wallet.travel_start_date) : "Data a definir"}
                            {wallet.travel_end_date ? " a " + formatDate(wallet.travel_end_date) : ""}
                          </span>
                          <span style={{ fontSize: "11px", color: "var(--adm-text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                            <Building size={11} />
                            {wallet.hotel_name || "Hotel a informar"}
                          </span>
                          {wallet.hotel_zone && (
                            <span style={{ fontSize: "10px", color: "var(--adm-text-subtle)" }}>
                              Zona: {wallet.hotel_zone}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Serviços Contratados */}
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--adm-wine)" }}>
                            {wallet.items.length} serviço(s) contratado(s)
                          </span>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", maxWidth: "260px" }}>
                            {wallet.items.slice(0, 3).map((it) => (
                              <span
                                key={it.id}
                                style={{
                                  fontSize: "10px",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  background: "#f1f5f9",
                                  color: "#334155",
                                  whiteSpace: "nowrap",
                                }}
                                title={`${it.product_name} · ${formatDate(it.tour_date)}`}
                              >
                                {it.product_name.length > 22 ? it.product_name.substring(0, 20) + "..." : it.product_name}
                              </span>
                            ))}
                            {wallet.items.length > 3 && (
                              <span style={{ fontSize: "10px", color: "var(--adm-text-muted)", alignSelf: "center" }}>
                                +{wallet.items.length - 3} mais
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Status da Carteira */}
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              padding: "3px 8px",
                              borderRadius: "6px",
                              background: cfg.bg,
                              color: cfg.color,
                              border: `1px solid ${cfg.border}`,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              width: "fit-content",
                            }}
                          >
                            {hasAlerts ? <AlertTriangle size={12} /> : null}
                            {cfg.label}
                          </span>
                          <span style={{ fontSize: "10px", color: "var(--adm-text-muted)" }}>
                            v{wallet.version}
                          </span>
                        </div>
                      </td>

                      {/* Pendências / Alertas */}
                      <td>
                        {hasAlerts ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px", maxWidth: "240px" }}>
                            <span style={{ fontSize: "11px", fontWeight: 700, color: "#b91c1c" }}>
                              {wallet.needs_update_reasons.length} alteração(ões) pós-entrega:
                            </span>
                            {wallet.needs_update_reasons.slice(0, 2).map((r, idx) => (
                              <span key={idx} style={{ fontSize: "10px", color: "#b91c1c" }}>
                                • {r}
                              </span>
                            ))}
                            {wallet.needs_update_reasons.length > 2 && (
                              <span style={{ fontSize: "10px", color: "#b91c1c" }}>
                                +{wallet.needs_update_reasons.length - 2} outra(s)
                              </span>
                            )}
                          </div>
                        ) : wallet.pendencies.length > 0 ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px", maxWidth: "220px" }}>
                            {wallet.pendencies.map((p, idx) => (
                              <span key={idx} style={{ fontSize: "10px", color: "#b45309" }}>
                                • {p}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontSize: "11px", color: "#15803d", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                            <CheckCircle2 size={12} />
                            Dados completos
                          </span>
                        )}
                      </td>

                      {/* Última Entrega */}
                      <td>
                        {wallet.last_delivered_at ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px", fontSize: "11px" }}>
                            <strong style={{ color: "#4338ca" }}>
                              {new Date(wallet.last_delivered_at).toLocaleDateString("pt-BR")}{" "}
                              {new Date(wallet.last_delivered_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                            </strong>
                            <span style={{ color: "var(--adm-text-muted)" }}>
                              Canal: {wallet.last_delivery_channel?.toUpperCase() || "WHATSAPP"}
                            </span>
                            <span style={{ color: "var(--adm-text-subtle)", fontSize: "10px" }}>
                              Por: {wallet.last_delivered_by_name || "Operador"}
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>
                            Não entregue
                          </span>
                        )}
                      </td>

                      {/* Ações */}
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          {/* Visualizar */}
                          <button
                            type="button"
                            className="adm-btn adm-btn-icon adm-btn-outline adm-btn-sm"
                            title="Visualizar Carteira do Cliente"
                            onClick={() => handleOpenView(wallet)}
                          >
                            <Eye size={14} color="var(--adm-wine)" />
                          </button>

                          {/* Preparar / Editar */}
                          <button
                            type="button"
                            className="adm-btn adm-btn-outline adm-btn-sm"
                            title="Personalizar mensagem, orientações e notas dos passeios"
                            onClick={() => handleOpenEdit(wallet)}
                          >
                            <Edit2 size={13} />
                            <span>Editar</span>
                          </button>

                          {/* WhatsApp */}
                          <button
                            type="button"
                            className="adm-btn adm-btn-wine adm-btn-sm"
                            title="Disponibilizar ao cliente via WhatsApp"
                            onClick={() => handleOpenWhatsApp(wallet)}
                          >
                            <Send size={13} />
                            <span>Enviar</span>
                          </button>

                          {/* Histórico de Entregas */}
                          <button
                            type="button"
                            className="adm-btn adm-btn-icon adm-btn-outline adm-btn-sm"
                            title="Ver histórico de entregas desta carteira"
                            onClick={() => handleOpenHistory(wallet)}
                          >
                            <History size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MODAL 1: EDIÇÃO INDEPENDENTE DA CARTEIRA                              */}
      {/* ===================================================================== */}
      {editModal.open && editModal.wallet && (
        <div className="adm-modal-backdrop adm-no-print" onClick={() => !editModal.submitting && setEditModal((prev) => ({ ...prev, open: false }))}>
          <div
            className="adm-modal-card"
            style={{ maxWidth: "880px", maxHeight: "90vh", display: "flex", flexDirection: "column" }}
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSaveCustomizations} style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
              {/* Header do Modal */}
              <div className="adm-modal-header" style={{ padding: "18px 24px", borderBottom: "1px solid var(--adm-border)" }}>
                <div>
                  <span className="admin-brand-tag" style={{ background: "var(--adm-wine)", color: "#fff", padding: "2px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 700 }}>
                    EDIÇÃO INDEPENDENTE DA CARTEIRA
                  </span>
                  <h3 style={{ fontSize: "18px", margin: "4px 0 2px", color: "var(--adm-wine)" }}>
                    Personalizar Carteira — {editModal.wallet.contract_number}
                  </h3>
                  <span style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                    Cliente: <strong>{editModal.wallet.client_name}</strong> · As alterações abaixo são salvas exclusivamente na carteira e não alteram o contrato nem as reservas oficiais.
                  </span>
                </div>
                <button
                  type="button"
                  className="adm-btn adm-btn-icon adm-btn-outline"
                  onClick={() => !editModal.submitting && setEditModal((prev) => ({ ...prev, open: false }))}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Corpo do Modal (Scrollável) */}
              <div className="adm-modal-body" style={{ padding: "20px 24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "20px" }}>
                {/* Status da Carteira */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "#fcfaf7", padding: "12px 16px", borderRadius: "8px", border: "1px solid var(--adm-border)" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--adm-wine)" }}>
                    Definir Status da Carteira:
                  </span>
                  <select
                    className="adm-input"
                    style={{ minWidth: "200px" }}
                    value={editModal.targetStatus}
                    onChange={(e) => setEditModal((prev) => ({ ...prev, targetStatus: e.target.value as WalletStatus }))}
                  >
                    <option value="em_preparacao">Em Preparação</option>
                    <option value="pronta">✓ Pronta para Entrega</option>
                    <option value="pendente">Pendente de Preparação</option>
                  </select>
                  <span style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>
                    Marque como "Pronta" para liberar o envio oficial ao turista.
                  </span>
                </div>

                {/* Mensagem de Boas-Vindas */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--adm-wine)", marginBottom: "4px" }}>
                    MENSAGEM DE BOAS-VINDAS PERSONALIZADA
                  </label>
                  <textarea
                    rows={4}
                    className="adm-input"
                    style={{ width: "100%", fontSize: "13px", lineHeight: "1.5" }}
                    value={editModal.welcomeMessage}
                    onChange={(e) => setEditModal((prev) => ({ ...prev, welcomeMessage: e.target.value }))}
                    placeholder="Escreva uma mensagem calorosa de boas-vindas..."
                  />
                </div>

                {/* Orientações Gerais e Recomendações */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--adm-wine)", marginBottom: "4px" }}>
                      ORIENTAÇÕES GERAIS (FUSO, CÂMBIO, AEROPORTO)
                    </label>
                    <textarea
                      rows={6}
                      className="adm-input"
                      style={{ width: "100%", fontSize: "12px", lineHeight: "1.4" }}
                      value={editModal.generalGuidelines}
                      onChange={(e) => setEditModal((prev) => ({ ...prev, generalGuidelines: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--adm-wine)", marginBottom: "4px" }}>
                      RECOMENDAÇÕES AO CLIENTE (PROTETOR, GORJETAS)
                    </label>
                    <textarea
                      rows={6}
                      className="adm-input"
                      style={{ width: "100%", fontSize: "12px", lineHeight: "1.4" }}
                      value={editModal.clientRecommendations}
                      onChange={(e) => setEditModal((prev) => ({ ...prev, clientRecommendations: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Observações Específicas dos Passeios Contratados */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <label style={{ fontSize: "13px", fontWeight: 700, color: "var(--adm-wine)", margin: 0 }}>
                      OBSERVAÇÕES E INSTRUÇÕES ESPECÍFICAS POR PASSEIO ({editModal.wallet.items.length})
                    </label>
                    <span style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>
                      Insira dicas personalizadas para o cliente em cada atividade
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {editModal.wallet.items.map((it) => {
                      const currentCustom = editModal.serviceCustomizations[it.id] || {};

                      return (
                        <div
                          key={it.id}
                          style={{
                            background: "#fff",
                            border: "1px solid var(--adm-border)",
                            borderRadius: "8px",
                            padding: "12px 16px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <strong style={{ fontSize: "13px", color: "var(--adm-text-main)" }}>
                                {it.product_name}
                              </strong>
                              <span style={{ fontSize: "11px", color: "var(--adm-text-muted)", marginLeft: "8px" }}>
                                ({formatDate(it.tour_date)} · Pickup: {it.pickup_time || "A confirmar"} · Voucher: {it.voucher_ref || "Pendente"})
                              </span>
                            </div>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                            <div>
                              <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--adm-text-muted)", marginBottom: "2px" }}>
                                Observação Exclusiva da Carteira (Dica do Operador):
                              </label>
                              <input
                                type="text"
                                className="adm-input"
                                style={{ width: "100%", fontSize: "12px" }}
                                placeholder="Ex: Solicitar guia que fale português no guichê..."
                                value={currentCustom.operator_notes || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setEditModal((prev) => ({
                                    ...prev,
                                    serviceCustomizations: {
                                      ...prev.serviceCustomizations,
                                      [it.id]: {
                                        ...prev.serviceCustomizations[it.id],
                                        operator_notes: val,
                                      },
                                    },
                                  }));
                                }}
                              />
                            </div>

                            <div>
                              <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--adm-text-muted)", marginBottom: "2px" }}>
                                Instrução Adicional de Embarque:
                              </label>
                              <input
                                type="text"
                                className="adm-input"
                                style={{ width: "100%", fontSize: "12px" }}
                                placeholder="Ex: Aguardar na guarita externa em frente ao portão..."
                                value={currentCustom.additional_meeting_instructions || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setEditModal((prev) => ({
                                    ...prev,
                                    serviceCustomizations: {
                                      ...prev.serviceCustomizations,
                                      [it.id]: {
                                        ...prev.serviceCustomizations[it.id],
                                        additional_meeting_instructions: val,
                                      },
                                    },
                                  }));
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Rodapé do Modal */}
              <div className="adm-modal-footer" style={{ padding: "16px 24px", borderTop: "1px solid var(--adm-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>
                  As alterações ficam permanentemente salvas após atualizar a página.
                </span>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    className="adm-btn adm-btn-outline"
                    onClick={() => setEditModal((prev) => ({ ...prev, open: false }))}
                    disabled={editModal.submitting}
                  >
                    <span>Cancelar</span>
                  </button>
                  <button
                    type="submit"
                    className="adm-btn adm-btn-wine"
                    disabled={editModal.submitting}
                  >
                    <Check size={14} />
                    <span>{editModal.submitting ? "Salvando..." : "Salvar Personalizações"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: VISUALIZAÇÃO DA CARTEIRA E IMPRESSÃO / PDF                   */}
      {/* ===================================================================== */}
      {viewModal.open && viewModal.wallet && (
        <div className="adm-modal-backdrop" onClick={() => setViewModal({ open: false, wallet: null })}>
          <div
            className="adm-modal-card"
            style={{ maxWidth: "960px", maxHeight: "95vh", display: "flex", flexDirection: "column", padding: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Barra Superior do Visualizador (Oculta na impressão) */}
            <div
              className="adm-no-print"
              style={{
                padding: "16px 24px",
                background: "var(--adm-wine)",
                color: "#fff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderTopLeftRadius: "12px",
                borderTopRightRadius: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Wallet size={20} color="#fff" />
                <div>
                  <h3 style={{ fontSize: "16px", color: "#fff", margin: 0 }}>
                    Carteira de Viagem Oficial — {viewModal.wallet.contract_number}
                  </h3>
                  <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.75)" }}>
                    Visualização de Impressão e PDF · Cliente: {viewModal.wallet.client_name}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  type="button"
                  className="adm-btn adm-btn-sm"
                  style={{ background: "#fff", color: "var(--adm-wine)", fontWeight: 700 }}
                  onClick={handlePrint}
                >
                  <Printer size={14} />
                  <span>Imprimir / Salvar em PDF</span>
                </button>
                <button
                  type="button"
                  className="adm-btn adm-btn-icon adm-btn-outline"
                  style={{ color: "#fff", borderColor: "rgba(255,255,255,0.3)" }}
                  onClick={() => setViewModal({ open: false, wallet: null })}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Conteúdo Imprimível da Carteira (Área A4 / Documento Oficial) */}
            <div
              className="printable-wallet"
              style={{
                padding: "36px 44px",
                background: "#ffffff",
                color: "#1e1e1e",
                fontFamily: "'Alegreya Sans', sans-serif",
                overflowY: "auto",
              }}
            >
              {/* Alerta de Atualização Necessária (se aplicável) */}
              {viewModal.wallet.status === "necessita_atualizacao" && (
                <div
                  className="adm-no-print"
                  style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    padding: "12px 16px",
                    borderRadius: "8px",
                    marginBottom: "24px",
                    color: "#991b1b",
                    fontSize: "12px",
                  }}
                >
                  <strong>⚠️ ATENÇÃO: Informações operacionais foram modificadas após a entrega desta carteira:</strong>
                  <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
                    {viewModal.wallet.needs_update_reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Capa e Cabeçalho Oficial Tío Nenê */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  borderBottom: "3px solid #3d181f",
                  paddingBottom: "20px",
                  marginBottom: "24px",
                }}
              >
                <div>
                  <img
                    src="/img/tio-nene-01.svg"
                    alt="Tío Nenê Viagens"
                    style={{ height: "46px", width: "auto", marginBottom: "8px" }}
                  />
                  <div style={{ fontSize: "11px", letterSpacing: "0.15em", color: "#a55e40", fontWeight: 800 }}>
                    AGÊNCIA OFICIAL DE TURISMO EM CANCÚN & RIVIERA MAYA
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <span
                    style={{
                      display: "inline-block",
                      background: "#3d181f",
                      color: "#ffffff",
                      fontSize: "10px",
                      fontWeight: 800,
                      letterSpacing: "0.2em",
                      padding: "4px 10px",
                      borderRadius: "4px",
                      marginBottom: "6px",
                    }}
                  >
                    CARTEIRA DE VIAGEM OFICIAL
                  </span>
                  <div style={{ fontSize: "18px", fontWeight: 800, color: "#3d181f" }}>
                    {viewModal.wallet.contract_number}
                  </div>
                  <div style={{ fontSize: "11px", color: "#6e6360" }}>
                    Emissão Oficial Tío Nenê · v{viewModal.wallet.version}
                  </div>
                </div>
              </div>

              {/* Resumo da Viagem e Dados do Passageiro */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.4fr 1fr",
                  gap: "20px",
                  background: "#fcfaf7",
                  border: "1px solid #e8e2d8",
                  borderRadius: "10px",
                  padding: "18px 22px",
                  marginBottom: "26px",
                }}
              >
                <div>
                  <div style={{ fontSize: "10px", fontWeight: 800, color: "#a55e40", letterSpacing: "0.1em", marginBottom: "2px" }}>
                    TITULAR DA RESERVA
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: 800, color: "#3d181f", marginBottom: "8px" }}>
                    {viewModal.wallet.client_name}
                  </div>
                  <div style={{ fontSize: "12px", color: "#444", display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span>
                      👥 <strong>Passageiros:</strong> {viewModal.wallet.total_pax} pessoa(s) ({viewModal.wallet.adults_count} Adulto(s)
                      {viewModal.wallet.children_count > 0 ? `, ${viewModal.wallet.children_count} Criança(s)` : ""}
                      {viewModal.wallet.infants_count > 0 ? `, ${viewModal.wallet.infants_count} Bebê(s)` : ""})
                    </span>
                    {viewModal.wallet.client_phone && (
                      <span>📞 <strong>Telefone:</strong> {viewModal.wallet.client_phone}</span>
                    )}
                    {viewModal.wallet.client_email && (
                      <span>✉️ <strong>E-mail:</strong> {viewModal.wallet.client_email}</span>
                    )}
                  </div>
                </div>

                <div style={{ borderLeft: "1px solid #e8e2d8", paddingLeft: "18px" }}>
                  <div style={{ fontSize: "10px", fontWeight: 800, color: "#a55e40", letterSpacing: "0.1em", marginBottom: "2px" }}>
                    HOSPEDAGEM & PERÍODO
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 800, color: "#3d181f", marginBottom: "6px" }}>
                    🏨 {viewModal.wallet.hotel_name || "Hotel a informar"}
                  </div>
                  <div style={{ fontSize: "12px", color: "#444", display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span>
                      📅 <strong>Período:</strong>{" "}
                      {viewModal.wallet.travel_start_date ? formatDate(viewModal.wallet.travel_start_date) : "A confirmar"}
                      {viewModal.wallet.travel_end_date ? " a " + formatDate(viewModal.wallet.travel_end_date) : ""}
                    </span>
                    {viewModal.wallet.hotel_zone && (
                      <span>📍 <strong>Região:</strong> {viewModal.wallet.hotel_zone}</span>
                    )}
                    {viewModal.wallet.arrival_flight_number && (
                      <span>✈️ <strong>Voo Chegada:</strong> {viewModal.wallet.arrival_flight_number} ({viewModal.wallet.arrival_flight_time || "Horário a conf."})</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Mensagem de Boas-Vindas */}
              <div
                style={{
                  background: "#ffffff",
                  borderLeft: "4px solid #a55e40",
                  padding: "14px 18px",
                  borderRadius: "0 8px 8px 0",
                  marginBottom: "28px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                <div style={{ fontSize: "13px", lineHeight: "1.6", color: "#333", whiteSpace: "pre-line" }}>
                  {viewModal.wallet.welcome_message}
                </div>
              </div>

              {/* Seção: Programação Diária e Vouchers dos Passeios */}
              <div style={{ marginBottom: "32px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    borderBottom: "2px solid #a55e40",
                    paddingBottom: "8px",
                    marginBottom: "16px",
                  }}
                >
                  <Calendar size={18} color="#a55e40" />
                  <h2 style={{ fontSize: "18px", color: "#3d181f", margin: 0, fontWeight: 800 }}>
                    PROGRAMAÇÃO DIÁRIA & VOUCHERS DOS PASSEIOS
                  </h2>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {viewModal.wallet.items.length === 0 ? (
                    <div style={{ padding: "24px", textAlign: "center", background: "#fcfaf7", borderRadius: "8px", color: "#666" }}>
                      Nenhum passeio contratado cadastrado.
                    </div>
                  ) : (
                    viewModal.wallet.items.map((item, idx) => {
                      const weekday = getWeekdayName(item.tour_date);

                      return (
                        <div
                          key={item.id}
                          style={{
                            border: "1px solid #e2cca0",
                            borderRadius: "10px",
                            overflow: "hidden",
                            background: "#ffffff",
                            pageBreakInside: "avoid",
                          }}
                        >
                          {/* Topo do Passeio: Data e Título */}
                          <div
                            style={{
                              background: "#3d181f",
                              color: "#ffffff",
                              padding: "10px 18px",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              flexWrap: "wrap",
                              gap: "8px",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <span
                                style={{
                                  background: "#a55e40",
                                  color: "#fff",
                                  fontSize: "11px",
                                  fontWeight: 800,
                                  padding: "2px 8px",
                                  borderRadius: "4px",
                                }}
                              >
                                DIA {idx + 1}
                              </span>
                              <span style={{ fontSize: "13px", fontWeight: 700 }}>
                                {formatDate(item.tour_date)} {weekday ? `(${weekday})` : ""}
                              </span>
                              <span style={{ fontSize: "14px", fontWeight: 800, color: "#f2e8b7" }}>
                                · {item.product_name}
                              </span>
                            </div>

                            <div>
                              <span
                                style={{
                                  background: item.voucher_ref ? "#15803d" : "#c2410c",
                                  color: "#ffffff",
                                  fontSize: "11px",
                                  fontWeight: 800,
                                  padding: "3px 8px",
                                  borderRadius: "4px",
                                }}
                              >
                                {item.voucher_ref ? `VOUCHER: ${item.voucher_ref}` : "VOUCHER PENDENTE"}
                              </span>
                            </div>
                          </div>

                          {/* Detalhes de Logística (Pickup & Encontro) */}
                          <div
                            style={{
                              padding: "14px 18px",
                              display: "grid",
                              gridTemplateColumns: "1fr 1.4fr",
                              gap: "14px",
                              background: "#fcfbf9",
                              borderBottom: "1px solid #f0eae1",
                            }}
                          >
                            <div>
                              <div style={{ fontSize: "10px", fontWeight: 700, color: "#6e6360", textTransform: "uppercase" }}>
                                Horário de Pickup / Embarque:
                              </div>
                              <div
                                style={{
                                  fontSize: "16px",
                                  fontWeight: 800,
                                  color: item.pickup_time ? "#3d181f" : "#c2410c",
                                  marginTop: "2px",
                                }}
                              >
                                {item.pickup_time ? `🕒 ${item.pickup_time}` : "🕒 Horário a confirmar"}
                              </div>
                              <span style={{ fontSize: "11px", color: "#6e6360" }}>
                                Esteja no lobby com 10 min de antecedência
                              </span>
                            </div>

                            <div>
                              <div style={{ fontSize: "10px", fontWeight: 700, color: "#6e6360", textTransform: "uppercase" }}>
                                Local de Embarque / Encontro:
                              </div>
                              <div style={{ fontSize: "13px", fontWeight: 700, color: "#241619", marginTop: "2px" }}>
                                📍 {item.pickup_location || "Local de encontro a confirmar"}
                              </div>
                              {item.additional_meeting_instructions && (
                                <div style={{ fontSize: "11px", color: "#a55e40", fontWeight: 600, marginTop: "2px" }}>
                                  Instrução: {item.additional_meeting_instructions}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Observação Exclusiva do Operador (se houver) */}
                          {item.operator_notes && (
                            <div style={{ padding: "8px 18px", background: "#fef3c7", borderBottom: "1px solid #fde68a", fontSize: "12px", color: "#92400e" }}>
                              <strong>💡 Observação Especial Tío Nenê:</strong> {item.operator_notes}
                            </div>
                          )}

                          {/* O Que Levar e Informações Importantes */}
                          <div style={{ padding: "12px 18px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", fontSize: "11px", color: "#444" }}>
                            <div>
                              <strong style={{ display: "block", color: "#3d181f", marginBottom: "4px" }}>
                                🎒 O que levar recomendado:
                              </strong>
                              <ul style={{ margin: 0, paddingLeft: "16px", lineHeight: "1.4" }}>
                                {(item.what_to_bring || []).slice(0, 4).map((w, i) => (
                                  <li key={i}>{w}</li>
                                ))}
                              </ul>
                            </div>

                            <div>
                              <strong style={{ display: "block", color: "#3d181f", marginBottom: "4px" }}>
                                ℹ️ Informações importantes:
                              </strong>
                              <ul style={{ margin: 0, paddingLeft: "16px", lineHeight: "1.4" }}>
                                {(item.important_info || []).slice(0, 3).map((info, i) => (
                                  <li key={i}>{info}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Seção: Informações de Traslados e Chegadas */}
              <div
                style={{
                  background: "#fcfaf7",
                  border: "1px solid #e8e2d8",
                  borderRadius: "10px",
                  padding: "16px 20px",
                  marginBottom: "28px",
                  pageBreakInside: "avoid",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <Plane size={16} color="#a55e40" />
                  <strong style={{ fontSize: "14px", color: "#3d181f" }}>
                    INFORMAÇÕES DE TRASLADO & AEROPORTO DE CANCÚN
                  </strong>
                </div>
                <div style={{ fontSize: "12px", color: "#444", lineHeight: "1.5" }}>
                  <p style={{ margin: "0 0 6px 0" }}>
                    • <strong>Desembarque:</strong> Ao passar pela alfândega e retirar as malas, dirija-se diretamente para a área externa de transporte. Desconsidere abordagens dentro do saguão do aeroporto. Procure a placa oficial com seu nome ou <strong>Tío Nenê Viagens</strong>.
                  </p>
                  <p style={{ margin: 0 }}>
                    • <strong>Retorno / Check-out:</strong> O horário de saída do seu hotel para o aeroporto será confirmado com 24h de antecedência pelo nosso concierge via WhatsApp.
                  </p>
                </div>
              </div>

              {/* Seção: Recomendações e Orientações Gerais */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                  marginBottom: "30px",
                  pageBreakInside: "avoid",
                }}
              >
                <div style={{ background: "#ffffff", border: "1px solid #e8e2d8", borderRadius: "8px", padding: "14px 16px" }}>
                  <strong style={{ display: "block", fontSize: "12px", color: "#3d181f", marginBottom: "6px" }}>
                    📌 Orientações de Estadia:
                  </strong>
                  <div style={{ fontSize: "11px", color: "#555", lineHeight: "1.5", whiteSpace: "pre-line" }}>
                    {viewModal.wallet.general_guidelines}
                  </div>
                </div>

                <div style={{ background: "#ffffff", border: "1px solid #e8e2d8", borderRadius: "8px", padding: "14px 16px" }}>
                  <strong style={{ display: "block", fontSize: "12px", color: "#3d181f", marginBottom: "6px" }}>
                    🌿 Recomendações aos Passageiros:
                  </strong>
                  <div style={{ fontSize: "11px", color: "#555", lineHeight: "1.5", whiteSpace: "pre-line" }}>
                    {viewModal.wallet.client_recommendations}
                  </div>
                </div>
              </div>

              {/* Seção: Contatos de Suporte & Plantão 24h */}
              <div
                style={{
                  background: "#3d181f",
                  color: "#ffffff",
                  borderRadius: "10px",
                  padding: "16px 22px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px",
                  pageBreakInside: "avoid",
                }}
              >
                <div>
                  <div style={{ fontSize: "11px", color: "#f2e8b7", fontWeight: 700, letterSpacing: "0.1em" }}>
                    CENTRAL DE ATENDIMENTO & CONCIERGE TÍO NENÊ
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 800, marginTop: "2px" }}>
                    Estamos com você durante toda a sua viagem em Cancún!
                  </div>
                </div>

                <div style={{ display: "flex", gap: "16px", fontSize: "12px" }}>
                  <div>
                    <span style={{ display: "block", opacity: 0.8, fontSize: "10px" }}>WhatsApp Concierge:</span>
                    <strong>{viewModal.wallet.support_whatsapp}</strong>
                  </div>
                  <div>
                    <span style={{ display: "block", opacity: 0.8, fontSize: "10px" }}>Plantão de Emergência 24h:</span>
                    <strong>{viewModal.wallet.emergency_duty_phone}</strong>
                  </div>
                </div>
              </div>

              {/* Rodapé Oficial da Carteira */}
              <div
                style={{
                  textAlign: "center",
                  marginTop: "24px",
                  paddingTop: "14px",
                  borderTop: "1px solid #e8e2d8",
                  fontSize: "10px",
                  color: "#888",
                }}
              >
                Tío Nenê Viagens Cancún · Blvd. Kukulcán, Zona Hotelera, Cancún, Q.R., México · Documento emitido para uso pessoal e exclusivo do passageiro.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: DISPONIBILIZAR CARTEIRA VIA WHATSAPP COM CONFIRMAÇÃO REAL    */}
      {/* ===================================================================== */}
      {whatsappModal.open && whatsappModal.wallet && (
        <div className="adm-modal-backdrop adm-no-print" onClick={() => !whatsappModal.submitting && setWhatsappModal((prev) => ({ ...prev, open: false }))}>
          <div
            className="adm-modal-card"
            style={{ maxWidth: "620px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleConfirmDelivery}>
              <div className="adm-modal-header" style={{ padding: "18px 24px", borderBottom: "1px solid var(--adm-border)" }}>
                <div>
                  <span className="admin-brand-tag" style={{ background: "#25d366", color: "#fff", padding: "2px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 700 }}>
                    ENTREGA AO CLIENTE
                  </span>
                  <h3 style={{ fontSize: "18px", margin: "4px 0 2px", color: "var(--adm-wine)" }}>
                    Enviar Carteira — {whatsappModal.wallet.contract_number}
                  </h3>
                  <span style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                    Cliente: <strong>{whatsappModal.wallet.client_name}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  className="adm-btn adm-btn-icon adm-btn-outline"
                  onClick={() => !whatsappModal.submitting && setWhatsappModal((prev) => ({ ...prev, open: false }))}
                >
                  <X size={16} />
                </button>
              </div>

              <div className="adm-modal-body" style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "14px" }}>
                {/* Telefone de Destino */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--adm-wine)", marginBottom: "4px" }}>
                    NÚMERO DO WHATSAPP DO CLIENTE (COM DDI E DDD)
                  </label>
                  <input
                    type="text"
                    className="adm-input"
                    style={{ width: "100%", fontSize: "13px" }}
                    placeholder="Ex: +55 11 99999-8888 ou +52 998 123 4567"
                    required
                    value={whatsappModal.targetPhone}
                    onChange={(e) => setWhatsappModal((prev) => ({ ...prev, targetPhone: e.target.value }))}
                  />
                  <span style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>
                    O número deve conter DDI (ex: +55 Brasil, +52 México) e DDD.
                  </span>
                </div>

                {/* Prévia da Mensagem */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--adm-wine)", margin: 0 }}>
                      MENSAGEM PERSONALIZADA (SEM DADOS FINANCEIROS)
                    </label>
                    <button
                      type="button"
                      className="adm-btn adm-btn-outline adm-btn-sm"
                      style={{ padding: "2px 8px", fontSize: "11px" }}
                      onClick={handleCopyMessage}
                    >
                      {whatsappModal.copied ? <Check size={12} color="#15803d" /> : <Copy size={12} />}
                      <span>{whatsappModal.copied ? "Copiado!" : "Copiar Texto"}</span>
                    </button>
                  </div>
                  <textarea
                    rows={8}
                    className="adm-input"
                    style={{ width: "100%", fontSize: "12px", lineHeight: "1.4", fontFamily: "monospace" }}
                    value={whatsappModal.messageText}
                    onChange={(e) => setWhatsappModal((prev) => ({ ...prev, messageText: e.target.value }))}
                  />
                </div>

                {/* Ação de Abrir WhatsApp */}
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "12px 16px", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong style={{ fontSize: "12px", color: "#166534", display: "block" }}>
                      Passo 1: Abrir conversa no WhatsApp
                    </strong>
                    <span style={{ fontSize: "11px", color: "#166534" }}>
                      Inicia a conversa com a mensagem formatada para o passageiro.
                    </span>
                  </div>
                  <button
                    type="button"
                    className="adm-btn adm-btn-sm"
                    style={{ background: "#25d366", color: "#fff", fontWeight: 700 }}
                    onClick={handleOpenWhatsAppLink}
                  >
                    <ExternalLink size={14} />
                    <span>Abrir WhatsApp</span>
                  </button>
                </div>

                {/* Alerta de Auditoria de Entrega */}
                <div
                  style={{
                    background: "#fffbeb",
                    border: "1px solid #fef3c7",
                    padding: "12px 14px",
                    borderRadius: "8px",
                    fontSize: "11px",
                    color: "#92400e",
                    lineHeight: "1.4",
                  }}
                >
                  <strong>⚠️ AVISO DE AUDITORIA:</strong> Abrir o WhatsApp apenas inicia a conversa externa. O sistema NÃO considera a carteira entregue até que você confirme explicitamente abaixo.
                </div>

                {/* Passo 2: Confirmação Explícita de Entrega */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--adm-wine)", marginBottom: "4px" }}>
                    Passo 2: Observação do Registro de Entrega (Opcional):
                  </label>
                  <input
                    type="text"
                    className="adm-input"
                    style={{ width: "100%", fontSize: "12px" }}
                    placeholder="Ex: Cliente confirmou recebimento e horário de pickup do Chichén..."
                    value={whatsappModal.notes}
                    onChange={(e) => setWhatsappModal((prev) => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </div>

              {/* Rodapé do Modal */}
              <div className="adm-modal-footer" style={{ padding: "16px 24px", borderTop: "1px solid var(--adm-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button
                  type="button"
                  className="adm-btn adm-btn-outline"
                  onClick={() => setWhatsappModal((prev) => ({ ...prev, open: false }))}
                  disabled={whatsappModal.submitting}
                >
                  <span>Fechar</span>
                </button>
                <button
                  type="submit"
                  className="adm-btn adm-btn-wine"
                  disabled={whatsappModal.submitting}
                >
                  <CheckCheck size={14} />
                  <span>{whatsappModal.submitting ? "Registrando..." : "Confirmar Entrega Realizada"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 4: HISTÓRICO DE ENTREGAS REALIZADAS                              */}
      {/* ===================================================================== */}
      {historyModal.open && historyModal.wallet && (
        <div className="adm-modal-backdrop adm-no-print" onClick={() => setHistoryModal((prev) => ({ ...prev, open: false }))}>
          <div
            className="adm-modal-card"
            style={{ maxWidth: "680px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="adm-modal-header" style={{ padding: "18px 24px", borderBottom: "1px solid var(--adm-border)" }}>
              <div>
                <span className="admin-brand-tag" style={{ background: "var(--adm-wine)", color: "#fff", padding: "2px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 700 }}>
                  HISTÓRICO AUDITÁVEL
                </span>
                <h3 style={{ fontSize: "18px", margin: "4px 0 2px", color: "var(--adm-wine)" }}>
                  Histórico de Entregas — {historyModal.wallet.contract_number}
                </h3>
                <span style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                  Cliente: <strong>{historyModal.wallet.client_name}</strong>
                </span>
              </div>
              <button
                type="button"
                className="adm-btn adm-btn-icon adm-btn-outline"
                onClick={() => setHistoryModal((prev) => ({ ...prev, open: false }))}
              >
                <X size={16} />
              </button>
            </div>

            <div className="adm-modal-body" style={{ padding: "20px 24px" }}>
              {historyModal.deliveries.length === 0 ? (
                <div style={{ textAlign: "center", padding: "36px 20px", color: "var(--adm-text-muted)" }}>
                  Nenhum registro formal de entrega cadastrado para esta carteira até o momento.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {historyModal.deliveries.map((deliv, idx) => (
                    <div
                      key={deliv.id || idx}
                      style={{
                        padding: "12px 16px",
                        borderRadius: "8px",
                        background: "#fcfaf7",
                        border: "1px solid var(--adm-border)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 800,
                              background: "#e0e7ff",
                              color: "#4338ca",
                              padding: "2px 6px",
                              borderRadius: "4px",
                            }}
                          >
                            v{deliv.wallet_version || 1}
                          </span>
                          <strong style={{ fontSize: "13px", color: "var(--adm-text-main)" }}>
                            {deliv.delivery_channel?.toUpperCase() || "WHATSAPP"}
                          </strong>
                          <span style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>
                            Destino: {deliv.destination_contact}
                          </span>
                        </div>
                        {deliv.notes && (
                          <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                            "{deliv.notes}"
                          </div>
                        )}
                      </div>

                      <div style={{ textAlign: "right", fontSize: "11px", color: "var(--adm-text-muted)" }}>
                        <div>{new Date(deliv.delivered_at).toLocaleDateString("pt-BR")} {new Date(deliv.delivered_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
                        <div style={{ fontSize: "10px", color: "var(--adm-text-subtle)" }}>Por: {deliv.delivered_by_name}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="adm-modal-footer" style={{ padding: "14px 24px", borderTop: "1px solid var(--adm-border)", textAlign: "right" }}>
              <button
                type="button"
                className="adm-btn adm-btn-outline adm-btn-sm"
                onClick={() => setHistoryModal((prev) => ({ ...prev, open: false }))}
              >
                <span>Fechar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Estilos Específicos para Impressão / PDF */}
      <style jsx global>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          .admin-sidebar,
          .admin-header,
          .adm-no-print,
          nav,
          header,
          footer,
          button {
            display: none !important;
          }
          .admin-scope {
            display: block !important;
            min-height: auto !important;
            background: #ffffff !important;
          }
          .admin-page {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
          .adm-modal-backdrop {
            position: static !important;
            background: none !important;
            padding: 0 !important;
            display: block !important;
          }
          .adm-modal-card {
            max-width: 100% !important;
            max-height: none !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            display: block !important;
          }
          .printable-wallet {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
