"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuthProfile } from "@/lib/auth/AuthContext";
import AccessDenied from "@/components/admin/AccessDenied";
import {
  ClientReceivable,
  ClientPaymentEntry,
  ClientPaymentStatus,
} from "@/types/operational";
import {
  calculateContractReceivableBalance,
  calculateClientFinancialKpis,
  calculateExchangeAmortization,
  recordClientPayment,
  reverseClientPayment,
  formatReceivableCurrency,
  formatClientPaymentMethod,
  ClientReceivableKpiSummary,
} from "@/lib/financial/clientFinance";
import {
  DollarSign,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Receipt,
  Calendar,
  FileText,
  X,
  CreditCard,
  Plus,
  RefreshCw,
  AlertCircle,
  Eye,
  ChevronRight,
  TrendingDown,
  ShieldCheck,
  ShieldAlert,
  ArrowRightLeft,
  UserCheck,
  Info,
} from "lucide-react";

const STATUS_CONFIG: Record<
  ClientPaymentStatus,
  { label: string; bg: string; color: string; border: string; desc: string }
> = {
  pendente: {
    label: "Pendente",
    bg: "#fef3c7",
    color: "#b45309",
    border: "#fde68a",
    desc: "Nenhum recebimento registrado. Saldo contratual total pendente.",
  },
  parcialmente_pago: {
    label: "Parcialmente Pago",
    bg: "#dbeafe",
    color: "#1d4ed8",
    border: "#bfdbfe",
    desc: "Pagamento parcial registrado. Saldo pendente residual a receber.",
  },
  pago: {
    label: "Quitado",
    bg: "#dcfce7",
    color: "#15803d",
    border: "#86efac",
    desc: "Contrato 100% quitado. Saldo contratual zero.",
  },
  vencido: {
    label: "Vencido",
    bg: "#fee2e2",
    color: "#b91c1c",
    border: "#fca5a5",
    desc: "Data de vencimento expirada e contrato ainda com saldo em aberto.",
  },
  cancelado: {
    label: "Cancelado",
    bg: "#f3f4f6",
    color: "#4b5563",
    border: "#e5e7eb",
    desc: "Contrato cancelado. Cobranças suspensas.",
  },
};

function ClientReceivablesContent() {
  const searchParams = useSearchParams();
  const filterContractIdParam = searchParams.get("contract_id");

  const { role, loading: authLoading } = useAuthProfile();
  const isAdmin = role === "admin";
  const isAuthorized = role === "admin" || role === "seller";

  const [receivables, setReceivables] = useState<ClientReceivable[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [sellerFilter, setSellerFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [currencyFilter, setCurrencyFilter] = useState("todas");
  const [onlyPending, setOnlyPending] = useState(false);
  const [selectedCurrencyTab, setSelectedCurrencyTab] = useState<string>("USD");

  // Modal Registrar Recebimento
  const [paymentModal, setPaymentModal] = useState<{
    open: boolean;
    contract: ClientReceivable | null;
    amountReceived: string;
    receivedCurrency: string;
    exchangeRate: string;
    amortizedAmount: string;
    exchangeRateDate: string;
    exchangeRateSource: string;
    paymentDate: string;
    paymentMethod: string;
    reference: string;
    notes: string;
    submitting: boolean;
    error: string | null;
  }>({
    open: false,
    contract: null,
    amountReceived: "",
    receivedCurrency: "BRL",
    exchangeRate: "5.20",
    amortizedAmount: "",
    exchangeRateDate: new Date().toISOString().split("T")[0],
    exchangeRateSource: "Cotação Comercial",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "pix",
    reference: "",
    notes: "",
    submitting: false,
    error: null,
  });

  // Modal Histórico & Estorno
  const [historyModal, setHistoryModal] = useState<{
    open: boolean;
    contract: ClientReceivable | null;
    entries: ClientPaymentEntry[];
    loading: boolean;
    reversingId: string | null;
    reversalReason: string;
    submittingReversal: boolean;
    error: string | null;
  }>({
    open: false,
    contract: null,
    entries: [],
    loading: false,
    reversingId: null,
    reversalReason: "",
    submittingReversal: false,
    error: null,
  });

  // Carregar dados de recebíveis
  const loadReceivables = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // 1. Carregar contratos oficiais (com fallback gracioso se migration 20261029 estiver pendente)
      let contractsData: any[] | null = null;
      const { data: fullData, error: contractsError } = await supabase
        .from("contracts")
        .select(`
          id,
          contract_number,
          client_id,
          client_name,
          client_phone,
          client_email,
          arrival_date,
          departure_date,
          total_amount,
          currency,
          status,
          finalized_at,
          created_at,
          seller_name,
          due_date,
          client_paid_amount,
          client_payment_status,
          last_client_payment_at
        `)
        .order("created_at", { ascending: false });

      if (contractsError) {
        console.warn("Consulta estendida de contratos falhou (possível pendência da migration 20261029), tentando colunas base:", contractsError.message);
        const { data: baseData, error: baseErr } = await supabase
          .from("contracts")
          .select(`
            id,
            contract_number,
            client_id,
            client_name,
            client_phone,
            client_email,
            arrival_date,
            departure_date,
            total_amount,
            currency,
            status,
            finalized_at,
            created_at
          `)
          .order("created_at", { ascending: false });

        if (baseErr) {
          throw new Error(baseErr.message || "Erro ao carregar contratos.");
        }
        contractsData = baseData;
      } else {
        contractsData = fullData;
      }

      // 2. Mapear para entidades de recebíveis com cálculos atualizados
      const list: ClientReceivable[] = (contractsData || []).map((c: any) => {
        const balanceInfo = calculateContractReceivableBalance({
          total_amount: Number(c.total_amount || 0),
          client_paid_amount: Number(c.client_paid_amount || 0),
          currency: c.currency || "USD",
          due_date: c.due_date || null,
          status: c.status,
        });

        return {
          id: c.id,
          contract_number: c.contract_number,
          client_id: c.client_id,
          client_name: c.client_name,
          client_phone: c.client_phone,
          client_email: c.client_email,
          seller_name: c.seller_name || null,
          sale_date: c.finalized_at || c.created_at,
          due_date: c.due_date || null,
          total_amount: Number(c.total_amount || 0),
          currency: (c.currency || "USD").toUpperCase().trim(),
          client_paid_amount: balanceInfo.paidAmount,
          pending_balance: balanceInfo.pendingBalance,
          client_payment_status: balanceInfo.status,
          last_client_payment_at: c.last_client_payment_at || null,
          status: c.status,
        };
      });

      setReceivables(list);

      // Se houver parâmetro de contrato na URL, abrir automaticamente o histórico ou focar nele
      if (filterContractIdParam) {
        const target = list.find((item) => item.id === filterContractIdParam);
        if (target) {
          handleOpenHistory(target);
        }
      }
    } catch (err: any) {
      console.error("Erro ao carregar contas a receber:", err);
      setErrorMsg(err.message || "Falha ao carregar recebíveis.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReceivables();
  }, [filterContractIdParam]);

  // Vendedores únicos para o filtro
  const availableSellers = useMemo(() => {
    const sellers = new Set<string>();
    receivables.forEach((r) => {
      if (r.seller_name && r.seller_name.trim()) {
        sellers.add(r.seller_name.trim());
      }
    });
    return Array.from(sellers).sort();
  }, [receivables]);

  // KPIs segregados rigorosamente por moeda
  const currencyKpis = useMemo(() => {
    return calculateClientFinancialKpis(receivables);
  }, [receivables]);

  const availableCurrencies = useMemo(() => {
    const keys = Object.keys(currencyKpis);
    return keys.length > 0 ? keys : ["USD", "BRL"];
  }, [currencyKpis]);

  // Definir aba padrão se não existir na lista
  useEffect(() => {
    if (availableCurrencies.length > 0 && !availableCurrencies.includes(selectedCurrencyTab)) {
      setSelectedCurrencyTab(availableCurrencies[0]);
    }
  }, [availableCurrencies, selectedCurrencyTab]);

  // Filtragem dos contratos
  const filteredReceivables = useMemo(() => {
    return receivables.filter((r) => {
      // Se URL tiver contract_id específico
      if (filterContractIdParam && r.id !== filterContractIdParam) {
        return false;
      }

      // Busca por número de contrato, cliente ou e-mail
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesContract = r.contract_number.toLowerCase().includes(q);
        const matchesClient = r.client_name.toLowerCase().includes(q);
        const matchesEmail = r.client_email?.toLowerCase().includes(q);
        if (!matchesContract && !matchesClient && !matchesEmail) {
          return false;
        }
      }

      // Filtro de vendedor
      if (sellerFilter !== "todos" && r.seller_name !== sellerFilter) {
        return false;
      }

      // Filtro de status
      if (statusFilter !== "todos" && r.client_payment_status !== statusFilter) {
        return false;
      }

      // Filtro de moeda
      if (currencyFilter !== "todas" && r.currency !== currencyFilter) {
        return false;
      }

      // Filtro apenas pendentes
      if (onlyPending && r.pending_balance <= 0.005) {
        return false;
      }

      return true;
    });
  }, [
    receivables,
    filterContractIdParam,
    searchTerm,
    sellerFilter,
    statusFilter,
    currencyFilter,
    onlyPending,
  ]);

  // Abrir Modal de Pagamento
  const handleOpenPaymentModal = (contract: ClientReceivable) => {
    if (contract.status === "rascunho") {
      alert("Não é permitido registrar recebimento em contrato com status rascunho. O contrato deve ser emitido oficialmente antes de receber pagamentos.");
      return;
    }
    if (contract.status === "cancelado") {
      alert("Não é permitido registrar recebimento em contrato cancelado.");
      return;
    }

    const isUSD = contract.currency === "USD";
    const initialReceivedCurrency = isUSD ? "BRL" : contract.currency;
    const initialExchangeRate = "5.20";

    setPaymentModal({
      open: true,
      contract,
      amountReceived: "",
      receivedCurrency: initialReceivedCurrency,
      exchangeRate: initialExchangeRate,
      amortizedAmount: "",
      exchangeRateDate: new Date().toISOString().split("T")[0],
      exchangeRateSource: "Cotação Comercial",
      paymentDate: new Date().toISOString().split("T")[0],
      paymentMethod: "pix",
      reference: "",
      notes: "",
      submitting: false,
      error: null,
    });
  };

  // Recalcular amortização no modal em tempo real
  const handlePaymentAmountOrRateChange = (
    newAmount: string,
    newRate: string,
    newRecvCurr: string
  ) => {
    const amt = parseFloat(newAmount.replace(",", "."));
    const rate = parseFloat(newRate.replace(",", "."));
    const ctrCurr = paymentModal.contract?.currency || "USD";

    if (!isNaN(amt) && amt > 0) {
      if (newRecvCurr.toUpperCase() === ctrCurr.toUpperCase()) {
        setPaymentModal((prev) => ({
          ...prev,
          amountReceived: newAmount,
          exchangeRate: "1.00",
          amortizedAmount: amt.toFixed(2),
          receivedCurrency: newRecvCurr,
        }));
      } else if (!isNaN(rate) && rate > 0) {
        try {
          const calc = calculateExchangeAmortization(amt, newRecvCurr, ctrCurr, rate);
          setPaymentModal((prev) => ({
            ...prev,
            amountReceived: newAmount,
            exchangeRate: newRate,
            amortizedAmount: calc.amortizedAmount.toFixed(2),
            receivedCurrency: newRecvCurr,
          }));
        } catch (err: any) {
          setPaymentModal((prev) => ({
            ...prev,
            amountReceived: newAmount,
            exchangeRate: newRate,
            receivedCurrency: newRecvCurr,
            error: err.message || "Erro na conversão cambial.",
          }));
        }
      }
    } else {
      setPaymentModal((prev) => ({
        ...prev,
        amountReceived: newAmount,
        exchangeRate: newRate,
        amortizedAmount: "",
        receivedCurrency: newRecvCurr,
      }));
    }
  };

  // Confirmar registro do recebimento
  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModal.contract) return;

    if (paymentModal.contract.status === "rascunho") {
      setPaymentModal((prev) => ({ ...prev, error: "Contratos em rascunho não podem receber pagamentos." }));
      return;
    }
    if (paymentModal.contract.status === "cancelado") {
      setPaymentModal((prev) => ({ ...prev, error: "Contratos cancelados não podem receber pagamentos." }));
      return;
    }

    const amt = parseFloat(paymentModal.amountReceived.replace(",", "."));
    if (isNaN(amt) || amt <= 0) {
      setPaymentModal((prev) => ({ ...prev, error: "Informe um valor recebido válido maior que zero." }));
      return;
    }

    const rate = parseFloat(paymentModal.exchangeRate.replace(",", "."));
    const isCross = paymentModal.receivedCurrency.toUpperCase() !== paymentModal.contract.currency.toUpperCase();
    if (isCross) {
      if (isNaN(rate) || rate <= 0) {
        setPaymentModal((prev) => ({ ...prev, error: "Informe uma taxa de câmbio válida maior que zero." }));
        return;
      }
      if (!paymentModal.exchangeRateDate) {
        setPaymentModal((prev) => ({ ...prev, error: "Informe a data de referência da cotação cambial." }));
        return;
      }
      if (!paymentModal.exchangeRateSource || !paymentModal.exchangeRateSource.trim()) {
        setPaymentModal((prev) => ({ ...prev, error: "Informe a origem/fonte da taxa de câmbio utilizada." }));
        return;
      }
    }

    const amortized = paymentModal.amortizedAmount ? parseFloat(paymentModal.amortizedAmount.replace(",", ".")) : undefined;

    // Validação preventiva do saldo
    if (amortized && amortized > (paymentModal.contract.pending_balance + 0.005)) {
      setPaymentModal((prev) => ({
        ...prev,
        error: `O valor amortizado (${formatReceivableCurrency(amortized, paymentModal.contract?.currency)}) excede o saldo pendente do contrato (${formatReceivableCurrency(paymentModal.contract?.pending_balance, paymentModal.contract?.currency)}).`,
      }));
      return;
    }

    setPaymentModal((prev) => ({ ...prev, submitting: true, error: null }));

    try {
      // Idempotency key única para a tentativa
      const idempotencyKey = `cli_pay_${paymentModal.contract.id}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const res = await recordClientPayment(supabase, {
        contractId: paymentModal.contract.id,
        amountReceived: amt,
        receivedCurrency: paymentModal.receivedCurrency,
        exchangeRate: isCross ? rate : 1.0,
        amortizedAmount: amortized,
        exchangeRateDate: isCross ? paymentModal.exchangeRateDate : undefined,
        exchangeRateSource: isCross ? paymentModal.exchangeRateSource : undefined,
        paymentMethod: paymentModal.paymentMethod,
        paymentDate: paymentModal.paymentDate,
        reference: paymentModal.reference || undefined,
        notes: paymentModal.notes || undefined,
        idempotencyKey,
      });

      alert(res.message || "Recebimento registrado com sucesso!");
      setPaymentModal((prev) => ({ ...prev, open: false, submitting: false }));
      await loadReceivables();
    } catch (err: any) {
      console.error("Erro ao registrar recebimento:", err);
      setPaymentModal((prev) => ({
        ...prev,
        submitting: false,
        error: err.message || "Erro inesperado ao registrar recebimento.",
      }));
    }
  };

  // Abrir Histórico & Extrato
  const handleOpenHistory = async (contract: ClientReceivable) => {
    setHistoryModal({
      open: true,
      contract,
      entries: [],
      loading: true,
      reversingId: null,
      reversalReason: "",
      submittingReversal: false,
      error: null,
    });

    try {
      const { data, error } = await supabase
        .from("client_payment_entries")
        .select("*")
        .eq("contract_id", contract.id)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(error.message || "Erro ao consultar histórico de recebimentos.");
      }

      setHistoryModal((prev) => ({
        ...prev,
        entries: data || [],
        loading: false,
      }));
    } catch (err: any) {
      setHistoryModal((prev) => ({
        ...prev,
        loading: false,
        error: err.message || "Falha ao carregar lançamentos.",
      }));
    }
  };

  // Executar Estorno (Exclusivo Admin)
  const handleExecuteReversal = async (entryId: string) => {
    if (!isAdmin) {
      alert("Acesso negado: apenas administradores podem estornar recebimentos de clientes.");
      return;
    }

    if (!historyModal.reversalReason || !historyModal.reversalReason.trim()) {
      alert("É obrigatório preencher a justificativa para realizar o estorno.");
      return;
    }

    setHistoryModal((prev) => ({ ...prev, submittingReversal: true, error: null }));

    try {
      const res = await reverseClientPayment(supabase, {
        paymentEntryId: entryId,
        reversalReason: historyModal.reversalReason.trim(),
        isAdmin: true,
      });

      alert(res.message || "Recebimento estornado com sucesso mantendo histórico auditável.");

      // Recarregar lançamentos do contrato
      if (historyModal.contract) {
        const { data } = await supabase
          .from("client_payment_entries")
          .select("*")
          .eq("contract_id", historyModal.contract.id)
          .order("created_at", { ascending: false });

        setHistoryModal((prev) => ({
          ...prev,
          entries: data || [],
          reversingId: null,
          reversalReason: "",
          submittingReversal: false,
        }));
      }

      await loadReceivables();
    } catch (err: any) {
      console.error("Erro ao estornar recebimento:", err);
      setHistoryModal((prev) => ({
        ...prev,
        submittingReversal: false,
        error: err.message || "Falha ao realizar estorno.",
      }));
    }
  };

  if (authLoading) {
    return (
      <div className="admin-page-container">
        <div className="admin-loading-state">
          <span className="status-dot-pulse" />
          <span>Verificando autorização...</span>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <AccessDenied
        currentRole={role || "seller"}
        pathname="/admin/financeiro/clientes"
        moduleName="Contas a Receber dos Clientes & Controle Cambial"
      />
    );
  }

  const activeKpi = currencyKpis[selectedCurrencyTab] || {
    currency: selectedCurrencyTab,
    totalContracted: 0,
    totalReceived: 0,
    totalPending: 0,
    contractsPaidCount: 0,
    contractsPartialCount: 0,
    contractsNoPaymentCount: 0,
    contractsOverdueCount: 0,
    totalContractsCount: 0,
  };

  return (
    <div className="admin-page-container">
      {/* CABEÇALHO */}
      <div className="admin-page-header">
        <div>
          <div className="admin-breadcrumb">
            <Link href="/admin">Dashboard</Link>
            <ChevronRight size={14} />
            <Link href="/admin/contratos">Contratos</Link>
            <ChevronRight size={14} />
            <span>Contas a Receber dos Clientes</span>
          </div>
          <h1 className="admin-page-title">
            <DollarSign className="admin-page-title-icon" style={{ color: "#0284c7" }} />
            <span>Contas a Receber dos Clientes & Controle Cambial</span>
          </h1>
          <p className="admin-page-subtitle">
            Gestão integrada de saldos contratuais, recebimentos parciais e controle cambial explícito (USD/BRL).
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            type="button"
            className="adm-btn adm-btn-outline"
            onClick={loadReceivables}
            disabled={loading}
            title="Atualizar lista de contratos e saldos"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            <span>Atualizar</span>
          </button>

          <Link
            href="/admin/contratos"
            className="adm-btn adm-btn-outline"
            title="Ir para a Central de Contratos"
          >
            <FileText size={15} />
            <span>Ver Contratos</span>
          </Link>
        </div>
      </div>

      {/* ALERTA DE SEGREGAÇÃO CAMBIAL */}
      <div
        style={{
          background: "rgba(2, 132, 199, 0.08)",
          border: "1px solid rgba(2, 132, 199, 0.25)",
          borderRadius: "8px",
          padding: "12px 16px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
        }}
      >
        <Info size={18} style={{ color: "#0284c7", flexShrink: 0, marginTop: "2px" }} />
        <div style={{ fontSize: "13px", color: "var(--adm-text-main)", lineHeight: 1.5 }}>
          <strong>Segregação Cambial Rigorosa:</strong> Totais contratuais e recebíveis são agrupados separadamente por moeda contratual oficial.
          Valores em <strong>USD</strong> e <strong>BRL</strong> não são consolidados em uma soma única para evitar distorções de cotação. Recebimentos em moeda estrangeira possuem cotação explícita imutável.
        </div>
      </div>

      {/* ABAS DE MOEDA PARA KPIS */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "12px", alignItems: "center" }}>
        <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--adm-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Indicadores por Moeda:
        </span>
        {availableCurrencies.map((curr) => (
          <button
            key={curr}
            type="button"
            className={`adm-btn adm-btn-sm ${selectedCurrencyTab === curr ? "" : "adm-btn-outline"}`}
            style={{
              background: selectedCurrencyTab === curr ? "var(--adm-wine)" : "transparent",
              color: selectedCurrencyTab === curr ? "#fff" : "var(--adm-text-main)",
              borderColor: selectedCurrencyTab === curr ? "var(--adm-wine)" : "var(--adm-border)",
              fontWeight: 700,
            }}
            onClick={() => setSelectedCurrencyTab(curr)}
          >
            {curr}
          </button>
        ))}
      </div>

      {/* PAINEL DE KPIS DA MOEDA SELECIONADA */}
      <div className="admin-stats-grid" style={{ marginBottom: "24px" }}>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: "rgba(14, 165, 233, 0.12)", color: "#0284c7" }}>
            <FileText size={20} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Total Contratado ({activeKpi.currency})</span>
            <span className="admin-stat-value" style={{ color: "#0284c7" }}>
              {formatReceivableCurrency(activeKpi.totalContracted, activeKpi.currency)}
            </span>
            <span className="admin-stat-help">
              {activeKpi.totalContractsCount} contrato(s) nesta moeda
            </span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#059669" }}>
            <CheckCircle2 size={20} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Total Recebido ({activeKpi.currency})</span>
            <span className="admin-stat-value" style={{ color: "#059669" }}>
              {formatReceivableCurrency(activeKpi.totalReceived, activeKpi.currency)}
            </span>
            <span className="admin-stat-help">
              {activeKpi.contractsPaidCount} quitado(s) • {activeKpi.contractsPartialCount} parcial(is)
            </span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: "rgba(245, 158, 11, 0.12)", color: "#d97706" }}>
            <Clock size={20} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Saldo Pendente ({activeKpi.currency})</span>
            <span className="admin-stat-value" style={{ color: "#d97706" }}>
              {formatReceivableCurrency(activeKpi.totalPending, activeKpi.currency)}
            </span>
            <span className="admin-stat-help">
              {activeKpi.contractsNoPaymentCount} sem recebimentos
            </span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: "rgba(239, 68, 68, 0.12)", color: "#dc2626" }}>
            <AlertTriangle size={20} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Valores Vencidos</span>
            <span className="admin-stat-value" style={{ color: activeKpi.contractsOverdueCount > 0 ? "#dc2626" : "var(--adm-text-main)" }}>
              {activeKpi.contractsOverdueCount}
            </span>
            <span className="admin-stat-help">
              Contratos com prazo expirado
            </span>
          </div>
        </div>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="admin-card" style={{ marginBottom: "20px", padding: "16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", alignItems: "flex-end" }}>
          <div>
            <label className="adm-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Search size={14} />
              <span>Buscar Contrato ou Cliente</span>
            </label>
            <input
              type="text"
              className="adm-input"
              placeholder="Ex: TN-2026-0001 ou Juliana..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <label className="adm-label">Vendedor Responsável</label>
            <select
              className="adm-input"
              value={sellerFilter}
              onChange={(e) => setSellerFilter(e.target.value)}
            >
              <option value="todos">Todos os vendedores</option>
              {availableSellers.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="adm-label">Situação Financeira</label>
            <select
              className="adm-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="todos">Todas as situações</option>
              <option value="pendente">Pendente (Sem pagamentos)</option>
              <option value="parcialmente_pago">Parcialmente Pago</option>
              <option value="pago">Quitado (100% Pago)</option>
              <option value="vencido">Vencido</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          <div>
            <label className="adm-label">Moeda Contratual</label>
            <select
              className="adm-input"
              value={currencyFilter}
              onChange={(e) => setCurrencyFilter(e.target.value)}
            >
              <option value="todas">Todas as moedas</option>
              <option value="USD">USD (Dólar Americano)</option>
              <option value="BRL">BRL (Real Brasileiro)</option>
              <option value="MXN">MXN (Peso Mexicano)</option>
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", height: "40px", gap: "8px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={onlyPending}
                onChange={(e) => setOnlyPending(e.target.checked)}
                style={{ width: "16px", height: "16px", accentColor: "var(--adm-wine)" }}
              />
              <span>Apenas com Saldo Pendente</span>
            </label>
          </div>
        </div>

        {filterContractIdParam && (
          <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--adm-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "var(--adm-wine)", fontWeight: 600 }}>
              Filtro ativo por contrato específico (ID: {filterContractIdParam})
            </span>
            <Link href="/admin/financeiro/clientes" className="adm-btn adm-btn-outline adm-btn-sm">
              <X size={12} />
              <span>Limpar Filtro de Contrato</span>
            </Link>
          </div>
        )}
      </div>

      {/* TABELA DE CONTAS A RECEBER */}
      <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px", borderBottom: "1px solid var(--adm-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ fontSize: "15px", fontWeight: 700, margin: 0, color: "var(--adm-wine)" }}>
              Contratos e Recebimentos dos Clientes
            </h3>
            <span style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
              Exibindo {filteredReceivables.length} de {receivables.length} contratos
            </span>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <span className="status-dot-pulse" />
            <span style={{ display: "block", marginTop: "12px", fontSize: "13px", color: "var(--adm-text-muted)" }}>
              Carregando contas a receber...
            </span>
          </div>
        ) : filteredReceivables.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--adm-text-muted)" }}>
            <Receipt size={36} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
            <p style={{ margin: 0, fontSize: "14px" }}>Nenhum contrato encontrado para os filtros selecionados.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Contrato</th>
                  <th>Cliente</th>
                  <th>Vendedor</th>
                  <th>Data da Venda</th>
                  <th style={{ textAlign: "right" }}>Total Contratado</th>
                  <th style={{ textAlign: "right" }}>Total Recebido</th>
                  <th style={{ textAlign: "right" }}>Saldo Pendente</th>
                  <th style={{ textAlign: "center" }}>Situação</th>
                  <th>Último Recebimento</th>
                  <th style={{ textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredReceivables.map((r) => {
                  const statusConf = STATUS_CONFIG[r.client_payment_status] || STATUS_CONFIG.pendente;
                  const isZeroBalance = r.pending_balance <= 0.005;

                  return (
                    <tr key={r.id}>
                      {/* NÚMERO DO CONTRATO */}
                      <td>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <Link
                            href={`/admin/contratos?contract_id=${r.id}`}
                            className="admin-code-badge"
                            style={{ textDecoration: "none", color: "var(--adm-wine)", fontWeight: 700 }}
                            title="Abrir contrato oficial"
                          >
                            {r.contract_number}
                          </Link>
                          {r.status === "rascunho" && (
                            <span style={{ fontSize: "10px", color: "#f59e0b", fontWeight: 600 }}>
                              RASCUNHO
                            </span>
                          )}
                        </div>
                      </td>

                      {/* CLIENTE */}
                      <td>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <strong style={{ fontSize: "13px" }}>{r.client_name}</strong>
                          {r.client_phone && (
                            <span style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>
                              {r.client_phone}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* VENDEDOR */}
                      <td>
                        <span style={{ fontSize: "12px", color: r.seller_name ? "var(--adm-text-main)" : "var(--adm-text-muted)" }}>
                          {r.seller_name || "—"}
                        </span>
                      </td>

                      {/* DATA VENDA */}
                      <td>
                        <span style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                          {r.sale_date ? new Date(r.sale_date).toLocaleDateString("pt-BR") : "—"}
                        </span>
                      </td>

                      {/* TOTAL CONTRATADO */}
                      <td style={{ textAlign: "right" }}>
                        <strong style={{ fontSize: "13px", color: "var(--adm-text-main)" }}>
                          {formatReceivableCurrency(r.total_amount, r.currency)}
                        </strong>
                      </td>

                      {/* TOTAL RECEBIDO */}
                      <td style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: r.client_paid_amount > 0 ? "#059669" : "var(--adm-text-muted)" }}>
                          {formatReceivableCurrency(r.client_paid_amount, r.currency)}
                        </span>
                      </td>

                      {/* SALDO PENDENTE */}
                      <td style={{ textAlign: "right" }}>
                        <strong
                          style={{
                            fontSize: "13px",
                            color: isZeroBalance ? "#059669" : "#d97706",
                          }}
                        >
                          {formatReceivableCurrency(r.pending_balance, r.currency)}
                        </strong>
                      </td>

                      {/* SITUAÇÃO */}
                      <td style={{ textAlign: "center" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "3px 8px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: 700,
                            background: statusConf.bg,
                            color: statusConf.color,
                            border: `1px solid ${statusConf.border}`,
                          }}
                          title={statusConf.desc}
                        >
                          {statusConf.label}
                        </span>
                      </td>

                      {/* ÚLTIMO RECEBIMENTO */}
                      <td>
                        <span style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>
                          {r.last_client_payment_at
                            ? new Date(r.last_client_payment_at).toLocaleDateString("pt-BR")
                            : "—"}
                        </span>
                      </td>

                      {/* AÇÕES */}
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                          {/* Registrar Recebimento */}
                          {!isZeroBalance && r.status !== "cancelado" && (
                            <button
                              type="button"
                              className="adm-btn adm-btn-outline adm-btn-sm"
                              style={{
                                background: "rgba(16, 185, 129, 0.1)",
                                color: "#059669",
                                borderColor: "#10b981",
                                fontWeight: 600,
                              }}
                              onClick={() => handleOpenPaymentModal(r)}
                              title="Registrar pagamento ou recebimento do cliente"
                            >
                              <Plus size={13} />
                              <span>Receber</span>
                            </button>
                          )}

                          {/* Extrato & Histórico */}
                          <button
                            type="button"
                            className="adm-btn adm-btn-outline adm-btn-sm"
                            onClick={() => handleOpenHistory(r)}
                            title="Consultar extrato e histórico de pagamentos"
                          >
                            <Receipt size={13} />
                            <span>Extrato</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* MODAL REGISTRAR RECEBIMENTO                                           */}
      {/* ===================================================================== */}
      {paymentModal.open && paymentModal.contract && (
        <div className="adm-modal-backdrop">
          <div className="adm-modal" style={{ maxWidth: "560px" }}>
            <div className="adm-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Receipt className="text-wine" size={20} />
                <h3 className="adm-modal-title">Registrar Recebimento de Cliente</h3>
              </div>
              <button
                type="button"
                className="adm-btn-icon"
                onClick={() => setPaymentModal((prev) => ({ ...prev, open: false }))}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmPayment}>
              <div className="adm-modal-body" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {paymentModal.error && (
                  <div
                    style={{
                      background: "#fee2e2",
                      border: "1px solid #fca5a5",
                      color: "#991b1b",
                      padding: "10px 12px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <AlertCircle size={16} />
                    <span>{paymentModal.error}</span>
                  </div>
                )}

                {/* RESUMO DO CONTRATO */}
                <div
                  style={{
                    background: "var(--adm-surface-alt)",
                    border: "1px solid var(--adm-border)",
                    borderRadius: "6px",
                    padding: "12px",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "8px",
                    fontSize: "12px",
                  }}
                >
                  <div>
                    <span style={{ color: "var(--adm-text-muted)", display: "block" }}>Contrato:</span>
                    <strong>{paymentModal.contract.contract_number}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--adm-text-muted)", display: "block" }}>Cliente:</span>
                    <strong>{paymentModal.contract.client_name}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--adm-text-muted)", display: "block" }}>Total Contratado:</span>
                    <strong>{formatReceivableCurrency(paymentModal.contract.total_amount, paymentModal.contract.currency)}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--adm-text-muted)", display: "block" }}>Saldo Pendente Atual:</span>
                    <strong style={{ color: "#d97706" }}>
                      {formatReceivableCurrency(paymentModal.contract.pending_balance, paymentModal.contract.currency)}
                    </strong>
                  </div>
                </div>

                {/* VALOR E MOEDA RECEBIDA */}
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "10px" }}>
                  <div>
                    <label className="adm-label">Valor Efetivamente Recebido *</label>
                    <input
                      type="text"
                      className="adm-input"
                      placeholder="0.00"
                      required
                      value={paymentModal.amountReceived}
                      onChange={(e) =>
                        handlePaymentAmountOrRateChange(
                          e.target.value,
                          paymentModal.exchangeRate,
                          paymentModal.receivedCurrency
                        )
                      }
                    />
                  </div>

                  <div>
                    <label className="adm-label">Moeda Recebida *</label>
                    <select
                      className="adm-input"
                      value={paymentModal.receivedCurrency}
                      onChange={(e) =>
                        handlePaymentAmountOrRateChange(
                          paymentModal.amountReceived,
                          paymentModal.exchangeRate,
                          e.target.value
                        )
                      }
                    >
                      <option value="BRL">BRL (R$)</option>
                      <option value="USD">USD ($)</option>
                      <option value="MXN">MXN ($)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>
                </div>

                {/* CONTROLE CAMBIAL EXPLÍCITO (CROSS-CURRENCY) */}
                {paymentModal.receivedCurrency.toUpperCase() !== paymentModal.contract.currency.toUpperCase() && (
                  <div
                    style={{
                      background: "rgba(2, 132, 199, 0.05)",
                      border: "1px solid rgba(2, 132, 199, 0.3)",
                      borderRadius: "6px",
                      padding: "12px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#0284c7", fontWeight: 700, fontSize: "12px" }}>
                      <ArrowRightLeft size={14} />
                      <span>Controle Cambial Explícito ({paymentModal.receivedCurrency} → {paymentModal.contract.currency})</span>
                    </div>

                    <div style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>
                      Contrato em <strong>{paymentModal.contract.currency}</strong> recebendo em <strong>{paymentModal.receivedCurrency}</strong>.
                      Convenção oficial: <strong>1 USD = X BRL</strong>. Valor amortizado = Valor recebido ÷ Taxa de câmbio.
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <div>
                        <label className="adm-label" style={{ fontSize: "11px" }}>
                          Taxa de Câmbio (BRL por USD) *
                        </label>
                        <input
                          type="text"
                          className="adm-input"
                          placeholder="Ex: 5.2000"
                          value={paymentModal.exchangeRate}
                          onChange={(e) =>
                            handlePaymentAmountOrRateChange(
                              paymentModal.amountReceived,
                              e.target.value,
                              paymentModal.receivedCurrency
                            )
                          }
                        />
                      </div>

                      <div>
                        <label className="adm-label" style={{ fontSize: "11px" }}>
                          Valor Amortizado ({paymentModal.contract.currency}) *
                        </label>
                        <input
                          type="text"
                          className="adm-input"
                          placeholder="Calculado automaticamente"
                          value={paymentModal.amortizedAmount}
                          onChange={(e) =>
                            setPaymentModal((prev) => ({ ...prev, amortizedAmount: e.target.value }))
                          }
                        />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <div>
                        <label className="adm-label" style={{ fontSize: "11px" }}>Data da Cotação Cambial</label>
                        <input
                          type="date"
                          className="adm-input"
                          value={paymentModal.exchangeRateDate}
                          onChange={(e) =>
                            setPaymentModal((prev) => ({ ...prev, exchangeRateDate: e.target.value }))
                          }
                        />
                      </div>

                      <div>
                        <label className="adm-label" style={{ fontSize: "11px" }}>Origem / Fonte da Taxa</label>
                        <input
                          type="text"
                          className="adm-input"
                          placeholder="Ex: Banco Central Comercial, Wise..."
                          value={paymentModal.exchangeRateSource}
                          onChange={(e) =>
                            setPaymentModal((prev) => ({ ...prev, exchangeRateSource: e.target.value }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* DATA E FORMA DE PAGAMENTO */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label className="adm-label">Data do Recebimento *</label>
                    <input
                      type="date"
                      className="adm-input"
                      required
                      value={paymentModal.paymentDate}
                      onChange={(e) =>
                        setPaymentModal((prev) => ({ ...prev, paymentDate: e.target.value }))
                      }
                    />
                  </div>

                  <div>
                    <label className="adm-label">Forma de Pagamento *</label>
                    <select
                      className="adm-input"
                      value={paymentModal.paymentMethod}
                      onChange={(e) =>
                        setPaymentModal((prev) => ({ ...prev, paymentMethod: e.target.value }))
                      }
                    >
                      <option value="pix">PIX</option>
                      <option value="cartao_credito">Cartão de Crédito</option>
                      <option value="cartao_debito">Cartão de Débito</option>
                      <option value="transferencia">Transferência Bancária</option>
                      <option value="especie">Espécie / Dinheiro</option>
                      <option value="wise">Wise / Remessa Internacional</option>
                      <option value="link_pagamento">Link de Pagamento Online</option>
                      <option value="outro">Outro Meio</option>
                    </select>
                  </div>
                </div>

                {/* REFERÊNCIA E OBSERVAÇÕES */}
                <div>
                  <label className="adm-label">Referência / Código do Comprovante</label>
                  <input
                    type="text"
                    className="adm-input"
                    placeholder="Ex: TXID PIX, código de autorização, NSU..."
                    value={paymentModal.reference}
                    onChange={(e) =>
                      setPaymentModal((prev) => ({ ...prev, reference: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="adm-label">Observações Internas</label>
                  <textarea
                    className="adm-input"
                    rows={2}
                    placeholder="Informações adicionais sobre o recebimento..."
                    value={paymentModal.notes}
                    onChange={(e) =>
                      setPaymentModal((prev) => ({ ...prev, notes: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="adm-modal-footer">
                <button
                  type="button"
                  className="adm-btn adm-btn-outline"
                  onClick={() => setPaymentModal((prev) => ({ ...prev, open: false }))}
                  disabled={paymentModal.submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="adm-btn adm-btn-primary"
                  disabled={paymentModal.submitting}
                  style={{ background: "#059669", borderColor: "#059669" }}
                >
                  {paymentModal.submitting ? (
                    <>
                      <span className="status-dot-pulse" style={{ width: "8px", height: "8px" }} />
                      <span>Processando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      <span>Confirmar Recebimento</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL EXTRATO & HISTÓRICO DE RECEBIMENTOS                             */}
      {/* ===================================================================== */}
      {historyModal.open && historyModal.contract && (
        <div className="adm-modal-backdrop">
          <div className="adm-modal" style={{ maxWidth: "680px" }}>
            <div className="adm-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Receipt className="text-wine" size={20} />
                <h3 className="adm-modal-title">Extrato de Recebimentos do Contrato</h3>
              </div>
              <button
                type="button"
                className="adm-btn-icon"
                onClick={() => setHistoryModal((prev) => ({ ...prev, open: false }))}
              >
                <X size={18} />
              </button>
            </div>

            <div className="adm-modal-body" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* CABEÇALHO DO CONTRATO */}
              <div
                style={{
                  background: "var(--adm-surface-alt)",
                  border: "1px solid var(--adm-border)",
                  borderRadius: "6px",
                  padding: "12px",
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "8px",
                  fontSize: "12px",
                }}
              >
                <div>
                  <span style={{ color: "var(--adm-text-muted)", display: "block" }}>Contrato:</span>
                  <strong>{historyModal.contract.contract_number}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--adm-text-muted)", display: "block" }}>Cliente:</span>
                  <strong>{historyModal.contract.client_name}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--adm-text-muted)", display: "block" }}>Total Contratado:</span>
                  <strong>{formatReceivableCurrency(historyModal.contract.total_amount, historyModal.contract.currency)}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--adm-text-muted)", display: "block" }}>Saldo Pendente:</span>
                  <strong style={{ color: historyModal.contract.pending_balance > 0 ? "#d97706" : "#059669" }}>
                    {formatReceivableCurrency(historyModal.contract.pending_balance, historyModal.contract.currency)}
                  </strong>
                </div>
              </div>

              {historyModal.error && (
                <div
                  style={{
                    background: "#fee2e2",
                    border: "1px solid #fca5a5",
                    color: "#991b1b",
                    padding: "10px 12px",
                    borderRadius: "6px",
                    fontSize: "12px",
                  }}
                >
                  {historyModal.error}
                </div>
              )}

              {/* LISTA DE LANÇAMENTOS */}
              <h4 style={{ fontSize: "13px", fontWeight: 700, margin: "8px 0 0", color: "var(--adm-text-main)" }}>
                Lançamentos de Recebimentos Realizados ({historyModal.entries.length})
              </h4>

              {historyModal.loading ? (
                <div style={{ padding: "20px", textAlign: "center" }}>
                  <span className="status-dot-pulse" />
                  <span style={{ display: "block", marginTop: "8px", fontSize: "12px", color: "var(--adm-text-muted)" }}>
                    Carregando extrato...
                  </span>
                </div>
              ) : historyModal.entries.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "var(--adm-text-muted)", fontSize: "13px" }}>
                  Nenhum recebimento registrado para este contrato até o momento.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "360px", overflowY: "auto" }}>
                  {historyModal.entries.map((entry) => {
                    const isCross = entry.received_currency.toUpperCase() !== entry.contract_currency.toUpperCase();

                    return (
                      <div
                        key={entry.id}
                        style={{
                          background: entry.is_reversed ? "#fef2f2" : "#fff",
                          border: `1px solid ${entry.is_reversed ? "#fecaca" : "var(--adm-border)"}`,
                          borderRadius: "6px",
                          padding: "12px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                          opacity: entry.is_reversed ? 0.8 : 1,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <strong style={{ fontSize: "14px", color: entry.is_reversed ? "#991b1b" : "#059669" }}>
                              {formatReceivableCurrency(entry.amount_received, entry.received_currency)}
                            </strong>

                            <span
                              style={{
                                fontSize: "11px",
                                background: "var(--adm-surface)",
                                padding: "1px 6px",
                                borderRadius: "4px",
                                border: "1px solid var(--adm-border)",
                              }}
                            >
                              {formatClientPaymentMethod(entry.payment_method)}
                            </span>

                            {entry.is_reversed && (
                              <span
                                style={{
                                  fontSize: "10px",
                                  fontWeight: 700,
                                  background: "#fee2e2",
                                  color: "#991b1b",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  border: "1px solid #fca5a5",
                                }}
                              >
                                ESTORNADO
                              </span>
                            )}
                          </div>

                          <span style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                            {new Date(entry.payment_date + "T12:00:00").toLocaleDateString("pt-BR")}
                          </span>
                        </div>

                        {/* DETALHES DE CÂMBIO E AMORTIZAÇÃO */}
                        {isCross && (
                          <div
                            style={{
                              fontSize: "11px",
                              color: "var(--adm-wine)",
                              background: "rgba(128, 0, 32, 0.04)",
                              padding: "4px 8px",
                              borderRadius: "4px",
                            }}
                          >
                            <strong>Câmbio Aplicado:</strong> 1 USD = {Number(entry.exchange_rate).toFixed(4)} {entry.received_currency}
                            {entry.exchange_rate_source ? ` (${entry.exchange_rate_source})` : ""}
                            {" • "}
                            <strong>Valor Amortizado:</strong> {formatReceivableCurrency(entry.amortized_amount, entry.contract_currency)}
                          </div>
                        )}

                        <div style={{ fontSize: "12px", color: "var(--adm-text-main)" }}>
                          {entry.reference && (
                            <>
                              <strong>Ref / Comprovante:</strong> {entry.reference} •{" "}
                            </>
                          )}
                          {entry.notes && <span>{entry.notes}</span>}
                        </div>

                        {/* ESTORNO AUDITADO */}
                        {entry.is_reversed ? (
                          <div
                            style={{
                              fontSize: "11px",
                              color: "#991b1b",
                              marginTop: "4px",
                              paddingTop: "4px",
                              borderTop: "1px dashed #fca5a5",
                            }}
                          >
                            <strong>Motivo do Estorno:</strong> {entry.reversal_reason || "Não informado"}
                            {entry.reversed_at && (
                              <> (em {new Date(entry.reversed_at).toLocaleString("pt-BR")})</>
                            )}
                          </div>
                        ) : (
                          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
                            {historyModal.reversingId === entry.id ? (
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "6px",
                                  width: "100%",
                                  background: "#fff",
                                  padding: "8px",
                                  borderRadius: "6px",
                                  border: "1px solid #fca5a5",
                                }}
                              >
                                <span style={{ fontSize: "11px", fontWeight: 700, color: "#991b1b" }}>
                                  Justificativa Obrigatória do Estorno:
                                </span>
                                <input
                                  type="text"
                                  className="adm-input"
                                  placeholder="Informe o motivo para cancelar este lançamento..."
                                  value={historyModal.reversalReason}
                                  onChange={(e) =>
                                    setHistoryModal((prev) => ({ ...prev, reversalReason: e.target.value }))
                                  }
                                />
                                <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                                  <button
                                    type="button"
                                    className="adm-btn adm-btn-outline adm-btn-sm"
                                    onClick={() =>
                                      setHistoryModal((prev) => ({
                                        ...prev,
                                        reversingId: null,
                                        reversalReason: "",
                                      }))
                                    }
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    type="button"
                                    className="adm-btn adm-btn-sm"
                                    style={{ background: "#dc2626", color: "#fff", borderColor: "#dc2626" }}
                                    onClick={() => handleExecuteReversal(entry.id)}
                                    disabled={historyModal.submittingReversal}
                                  >
                                    {historyModal.submittingReversal ? "Estornando..." : "Confirmar Estorno"}
                                  </button>
                                </div>
                              </div>
                            ) : isAdmin ? (
                              <button
                                type="button"
                                className="adm-btn adm-btn-outline adm-btn-sm"
                                style={{ color: "#dc2626", borderColor: "#fca5a5" }}
                                onClick={() =>
                                  setHistoryModal((prev) => ({
                                    ...prev,
                                    reversingId: entry.id,
                                    reversalReason: "",
                                  }))
                                }
                                title="Estornar recebimento (operação auditável exclusiva do Admin)"
                              >
                                <RotateCcw size={12} />
                                <span>Estornar</span>
                              </button>
                            ) : null}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="adm-modal-footer">
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

export default function AdminClientReceivablesPage() {
  return (
    <Suspense
      fallback={
        <div className="admin-page-container">
          <div className="admin-loading-state">
            <span className="status-dot-pulse" />
            <span>Carregando Central de Contas a Receber...</span>
          </div>
        </div>
      }
    >
      <ClientReceivablesContent />
    </Suspense>
  );
}
