"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuthProfile } from "@/lib/auth/AuthContext";
import AccessDenied from "@/components/admin/AccessDenied";
import {
  SupplierPayable,
  SupplierPaymentEntry,
  SupplierPaymentStatus,
  OperationalReservation,
} from "@/types/operational";
import {
  calculatePayableBalance,
  calculateSupplierFinancialKpis,
  approveSupplierPayableCost,
  recordSupplierPayment,
  reverseSupplierPayment,
  CurrencyKpiSummary,
} from "@/lib/financial/supplierFinance";
import {
  DollarSign,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Receipt,
  Building2,
  Calendar,
  FileText,
  X,
  CreditCard,
  Plus,
  RefreshCw,
  AlertCircle,
  Eye,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  TrendingDown,
  ShieldAlert,
} from "lucide-react";

const STATUS_CONFIG: Record<
  SupplierPaymentStatus,
  { label: string; bg: string; color: string; border: string; desc: string }
> = {
  previsto: {
    label: "Previsto",
    bg: "#fef3c7",
    color: "#b45309",
    border: "#fde68a",
    desc: "Custo previsto gerado na finalização. Aguarda aprovação final.",
  },
  aguardando_aprovacao: {
    label: "Aguardando Aprovação",
    bg: "#ffedd5",
    color: "#c2410c",
    border: "#fed7aa",
    desc: "Custo desconhecido ou sob consulta aguardando definição.",
  },
  aprovado: {
    label: "Aprovado",
    bg: "#e0e7ff",
    color: "#4338ca",
    border: "#c7d2fe",
    desc: "Custo final aprovado pela diretoria. Pronto para pagamento.",
  },
  parcialmente_pago: {
    label: "Parcialmente Pago",
    bg: "#dbeafe",
    color: "#1d4ed8",
    border: "#bfdbfe",
    desc: "Parte do valor já foi paga. Saldo pendente existente.",
  },
  pago: {
    label: "Pago",
    bg: "#dcfce7",
    color: "#15803d",
    border: "#86efac",
    desc: "Obrigação integralmente quitada. Saldo zero.",
  },
  cancelado: {
    label: "Cancelado",
    bg: "#fee2e2",
    color: "#b91c1c",
    border: "#fca5a5",
    desc: "Compromisso financeiro cancelado por cancelamento do serviço.",
  },
};

export default function AdminSupplierFinancePage() {
  const { role, loading: authLoading } = useAuthProfile();
  const isAdmin = role === "admin";

  const [payables, setPayables] = useState<SupplierPayable[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCurrencyTab, setSelectedCurrencyTab] = useState<string>("all");

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currencyFilter, setCurrencyFilter] = useState("all");
  const [dateStartFilter, setDateStartFilter] = useState("");
  const [dateEndFilter, setDateEndFilter] = useState("");
  const [onlyPendingBalance, setOnlyPendingBalance] = useState(false);
  const [groupBySupplier, setGroupBySupplier] = useState(false);

  // Modais
  const [approveModal, setApproveModal] = useState<{
    open: boolean;
    payable: SupplierPayable | null;
    amountFinal: string;
    isUnknown: boolean;
    notes: string;
    submitting: boolean;
  }>({
    open: false,
    payable: null,
    amountFinal: "",
    isUnknown: false,
    notes: "",
    submitting: false,
  });

  const [paymentModal, setPaymentModal] = useState<{
    open: boolean;
    payable: SupplierPayable | null;
    amount: string;
    paymentMethod: string;
    paymentDate: string;
    reference: string;
    notes: string;
    submitting: boolean;
  }>({
    open: false,
    payable: null,
    amount: "",
    paymentMethod: "transferencia",
    paymentDate: new Date().toISOString().split("T")[0],
    reference: "",
    notes: "",
    submitting: false,
  });

  const [historyModal, setHistoryModal] = useState<{
    open: boolean;
    payable: SupplierPayable | null;
    entries: SupplierPaymentEntry[];
    loadingEntries: boolean;
    reversingId: string | null;
    reversalReason: string;
  }>({
    open: false,
    payable: null,
    entries: [],
    loadingEntries: false,
    reversingId: null,
    reversalReason: "",
  });

  const [reservationModal, setReservationModal] = useState<{
    open: boolean;
    reservation: OperationalReservation | null;
    loading: boolean;
  }>({
    open: false,
    reservation: null,
    loading: false,
  });

  // Carregar obrigações financeiras do banco
  const fetchPayables = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      // 1. Buscar da tabela oficial supplier_payables com dados do contrato
      const { data: payData, error: payErr } = await supabase
        .from("supplier_payables")
        .select(`
          *,
          contracts (
            contract_number,
            client_name,
            client_phone,
            client_email
          )
        `)
        .order("service_date", { ascending: true });

      if (!payErr && payData && payData.length > 0) {
        const mapped: SupplierPayable[] = payData.map((p: any) => {
          const { pendingBalance } = calculatePayableBalance(p);
          return {
            ...p,
            contract_number: p.contracts?.contract_number || "TN-XXXX",
            client_name: p.contracts?.client_name || "Cliente",
            client_phone: p.contracts?.client_phone || "",
            client_email: p.contracts?.client_email || "",
            pending_balance: pendingBalance,
          };
        });
        setPayables(mapped);
        return;
      }

      // 2. Fallback: Se ainda não tiver registros em supplier_payables,
      // carrega a partir dos contratos finalizados / operacionais
      const { data: contractsData } = await supabase
        .from("contracts")
        .select(`
          id,
          contract_number,
          client_name,
          client_phone,
          client_email,
          status,
          contract_items (*)
        `)
        .in("status", ["finalizado", "emitido"]);

      const fallbackList: SupplierPayable[] = [];
      (contractsData || []).forEach((c: any) => {
        (c.contract_items || []).forEach((it: any) => {
          const cost =
            it.native_calculated_total_cost ??
            it.calculated_total_cost ??
            it.cost_applied ??
            null;
          const curr = it.native_currency || it.cost_currency || "USD";
          const isUnknown = it.is_unknown_cost ?? (cost === null || cost === 0);

          const itemObj: SupplierPayable = {
            id: it.id || `${c.id}-${it.tour_id || Math.random()}`,
            contract_id: c.id,
            contract_item_id: it.id,
            supplier_id: it.supplier_id,
            supplier_name: it.supplier_name_snapshot || "Fornecedor Local",
            service_date: it.tour_date || c.arrival_date || new Date().toISOString().split("T")[0],
            description: it.tour_name_snapshot || "Passeio / Serviço",
            currency: curr,
            amount_estimated: isUnknown ? null : Number(cost),
            amount_final: null,
            is_unknown_cost: isUnknown,
            payment_status: isUnknown ? "aguardando_aprovacao" : "previsto",
            paid_amount: 0,
            contract_number: c.contract_number,
            client_name: c.client_name,
            client_phone: c.client_phone,
            client_email: c.client_email,
            created_at: it.created_at || new Date().toISOString(),
            updated_at: it.updated_at || new Date().toISOString(),
          };

          const { pendingBalance } = calculatePayableBalance(itemObj);
          itemObj.pending_balance = pendingBalance;
          fallbackList.push(itemObj);
        });
      });

      setPayables(fallbackList);
    } catch (err: any) {
      console.error("Erro ao carregar contas a pagar:", err);
      setPayables([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchPayables();
    }
  }, [isAdmin]);

  // Lista de fornecedores únicos
  const uniqueSuppliers = useMemo(() => {
    const set = new Set<string>();
    payables.forEach((p) => {
      if (p.supplier_name) set.add(p.supplier_name);
    });
    return Array.from(set).sort();
  }, [payables]);

  // Moedas disponíveis
  const availableCurrencies = useMemo(() => {
    const set = new Set<string>();
    payables.forEach((p) => {
      if (p.currency) set.add(p.currency.toUpperCase());
    });
    return Array.from(set).sort();
  }, [payables]);

  // KPIs por moeda (NUNCA misturando USD com MXN)
  const currencyKpis = useMemo(() => {
    return calculateSupplierFinancialKpis(payables);
  }, [payables]);

  // Filtros aplicados
  const filteredPayables = useMemo(() => {
    return payables.filter((p) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        p.supplier_name?.toLowerCase().includes(term) ||
        p.contract_number?.toLowerCase().includes(term) ||
        p.client_name?.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term) ||
        p.payment_reference?.toLowerCase().includes(term);

      const matchesSupplier =
        supplierFilter === "all" || p.supplier_name === supplierFilter;

      const matchesStatus =
        statusFilter === "all" || p.payment_status === statusFilter;

      const matchesCurrency =
        currencyFilter === "all" ||
        p.currency.toUpperCase() === currencyFilter.toUpperCase();

      const matchesTabCurrency =
        selectedCurrencyTab === "all" ||
        p.currency.toUpperCase() === selectedCurrencyTab.toUpperCase();

      let matchesDate = true;
      if (dateStartFilter && dateEndFilter) {
        matchesDate =
          p.service_date >= dateStartFilter && p.service_date <= dateEndFilter;
      } else if (dateStartFilter) {
        matchesDate = p.service_date >= dateStartFilter;
      }

      let matchesPending = true;
      if (onlyPendingBalance) {
        const { pendingBalance, isUnknown } = calculatePayableBalance(p);
        matchesPending = isUnknown || (pendingBalance !== null && pendingBalance > 0);
      }

      return (
        matchesSearch &&
        matchesSupplier &&
        matchesStatus &&
        matchesCurrency &&
        matchesTabCurrency &&
        matchesDate &&
        matchesPending
      );
    });
  }, [
    payables,
    searchTerm,
    supplierFilter,
    statusFilter,
    currencyFilter,
    selectedCurrencyTab,
    dateStartFilter,
    dateEndFilter,
    onlyPendingBalance,
  ]);

  // Agrupamento por fornecedor quando selecionado
  const groupedPayables = useMemo(() => {
    if (!groupBySupplier) return null;
    const groups: Record<string, SupplierPayable[]> = {};
    filteredPayables.forEach((p) => {
      const key = p.supplier_name || "Sem Fornecedor";
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    return groups;
  }, [filteredPayables, groupBySupplier]);

  // =========================================================================
  // HANDLERS DOS MODAIS
  // =========================================================================

  // 1. Abrir Modal de Aprovação de Custo
  const handleOpenApproveModal = (p: SupplierPayable) => {
    setApproveModal({
      open: true,
      payable: p,
      amountFinal:
        p.amount_final !== null && p.amount_final !== undefined
          ? String(p.amount_final)
          : p.amount_estimated !== null && p.amount_estimated !== undefined
          ? String(p.amount_estimated)
          : "",
      isUnknown: p.is_unknown_cost,
      notes: p.cost_approval_notes || "",
      submitting: false,
    });
  };

  const handleSaveApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approveModal.payable) return;

    setApproveModal((prev) => ({ ...prev, submitting: true }));
    try {
      const finalVal = approveModal.isUnknown
        ? null
        : approveModal.amountFinal !== ""
        ? parseFloat(approveModal.amountFinal)
        : null;

      await approveSupplierPayableCost(supabase, {
        payableId: approveModal.payable.id,
        amountFinal: finalVal,
        notes: approveModal.notes,
        isAdmin,
      });

      alert("Custo do fornecedor aprovado com sucesso!");
      setApproveModal((prev) => ({ ...prev, open: false, submitting: false }));
      await fetchPayables();
    } catch (err: any) {
      alert("Erro ao aprovar custo: " + (err.message || "Tente novamente"));
      setApproveModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  // 2. Abrir Modal de Pagamento
  const handleOpenPaymentModal = (p: SupplierPayable) => {
    if (p.payment_status === "cancelado") {
      alert("Esta obrigação financeira está cancelada. Não é permitido registrar pagamentos.");
      return;
    }

    if (p.is_unknown_cost || p.amount_final === null || p.amount_final === undefined) {
      alert(
        "Esta obrigação ainda não possui custo final aprovado pelo administrador. O custo estimado não autoriza pagamentos. Por favor, aprove o custo final antes de realizar lançamentos."
      );
      handleOpenApproveModal(p);
      return;
    }

    const { pendingBalance } = calculatePayableBalance(p);

    if (pendingBalance !== null && pendingBalance <= 0) {
      alert("Esta obrigação já está 100% quitada (saldo zero).");
      return;
    }

    setPaymentModal({
      open: true,
      payable: p,
      amount: pendingBalance !== null ? String(pendingBalance) : "",
      paymentMethod: "transferencia",
      paymentDate: new Date().toISOString().split("T")[0],
      reference: "",
      notes: "",
      submitting: false,
    });
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModal.payable) return;

    const val = parseFloat(paymentModal.amount);
    if (isNaN(val) || val <= 0) {
      alert("Informe um valor de pagamento válido maior que zero.");
      return;
    }

    const { pendingBalance } = calculatePayableBalance(paymentModal.payable);
    if (pendingBalance !== null && val > pendingBalance + 0.005) {
      alert(
        `O valor informado (${val.toFixed(2)} ${paymentModal.payable.currency}) excede o saldo pendente aprovado (${pendingBalance.toFixed(2)} ${paymentModal.payable.currency}). Não é permitido pagamento superior ao saldo.`
      );
      return;
    }

    const idempotencyKey =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `pay-${paymentModal.payable.id}-${Date.now()}`;

    setPaymentModal((prev) => ({ ...prev, submitting: true }));
    try {
      const res = await recordSupplierPayment(supabase, {
        payableId: paymentModal.payable.id,
        amount: val,
        paymentMethod: paymentModal.paymentMethod,
        paymentDate: paymentModal.paymentDate,
        reference: paymentModal.reference,
        notes: paymentModal.notes,
        idempotencyKey,
        isAdmin,
      });

      alert(res.message || "Pagamento registrado com sucesso!");
      setPaymentModal((prev) => ({ ...prev, open: false, submitting: false }));
      await fetchPayables();
    } catch (err: any) {
      alert("Erro ao registrar pagamento: " + (err.message || "Tente novamente"));
      setPaymentModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  // 3. Abrir Modal de Histórico e Estorno
  const handleOpenHistoryModal = async (p: SupplierPayable) => {
    setHistoryModal({
      open: true,
      payable: p,
      entries: [],
      loadingEntries: true,
      reversingId: null,
      reversalReason: "",
    });

    try {
      const { data: entriesData } = await supabase
        .from("supplier_payment_entries")
        .select("*")
        .eq("payable_id", p.id)
        .order("payment_date", { ascending: false });

      setHistoryModal((prev) => ({
        ...prev,
        entries: entriesData || [],
        loadingEntries: false,
      }));
    } catch (err) {
      setHistoryModal((prev) => ({ ...prev, loadingEntries: false }));
    }
  };

  const handleExecuteReversal = async (entryId: string) => {
    if (!historyModal.reversalReason || !historyModal.reversalReason.trim()) {
      alert("Por favor, preencha o motivo/justificativa do estorno.");
      return;
    }

    if (!confirm("Confirma o estorno auditável deste pagamento? O saldo pendente será recalculado automaticamente.")) {
      return;
    }

    try {
      await reverseSupplierPayment(supabase, {
        paymentEntryId: entryId,
        reversalReason: historyModal.reversalReason,
        isAdmin,
      });

      alert("Pagamento estornado com sucesso!");
      if (historyModal.payable) {
        await handleOpenHistoryModal(historyModal.payable);
        await fetchPayables();
      }
    } catch (err: any) {
      alert("Erro ao estornar: " + (err.message || "Tente novamente"));
    }
  };

  // 4. Abrir Detalhes da Reserva Operacional vinculada
  const handleOpenReservationModal = async (p: SupplierPayable) => {
    if (!p.reservation_id) {
      alert("Esta obrigação não possui vínculo direto com uma reserva operacional individual.");
      return;
    }

    setReservationModal({ open: true, reservation: null, loading: true });
    try {
      const { data: resData } = await supabase
        .from("operational_reservations")
        .select("*")
        .eq("id", p.reservation_id)
        .single();

      setReservationModal({ open: true, reservation: resData || null, loading: false });
    } catch (err) {
      setReservationModal({ open: true, reservation: null, loading: false });
    }
  };

  // Verificação de Segurança (Exclusivo Admin)
  if (!authLoading && !isAdmin) {
    return (
      <AccessDenied
        currentRole={role}
        pathname="/admin/financeiro/fornecedores"
        moduleName="Contas a Pagar · Fornecedores"
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Cabeçalho */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <span className="admin-brand-tag">MÓDULO FINANCEIRO CONFIDENCIAL</span>
          <h2 style={{ fontSize: "28px", color: "var(--adm-wine)" }}>
            Contas a Pagar · Fornecedores Locais
          </h2>
          <p style={{ color: "var(--adm-text-muted)", fontSize: "14px", marginTop: "2px" }}>
            Acompanhe compromissos em USD e MXN, aprove custos finais, registre pagamentos parciais e controle saldos pendentes.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            className={`adm-btn ${onlyPendingBalance ? "adm-btn-clay" : "adm-btn-outline"}`}
            onClick={() => setOnlyPendingBalance(!onlyPendingBalance)}
            title="Exibir apenas obrigações que possuem saldo pendente a pagar"
          >
            <TrendingDown size={15} />
            <span>Apenas com Saldo Pendente</span>
          </button>

          <button
            type="button"
            className={`adm-btn ${groupBySupplier ? "adm-btn-primary" : "adm-btn-outline"}`}
            onClick={() => setGroupBySupplier(!groupBySupplier)}
            title="Alternar entre lista contínua e agrupamento por fornecedor"
          >
            <Building2 size={15} />
            <span>Agrupar por Fornecedor</span>
          </button>

          <button
            type="button"
            className="adm-btn adm-btn-outline"
            onClick={fetchPayables}
            disabled={loading}
            title="Atualizar lista de contas a pagar"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Atualizar</span>
          </button>

          <Link href="/admin/reservas" className="adm-btn adm-btn-outline">
            <Calendar size={15} />
            <span>Central de Reservas</span>
          </Link>
        </div>
      </div>

      {/* Seletor de Abas por Moeda & Indicadores */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ display: "flex", gap: "8px", borderBottom: "2px solid var(--adm-border)", paddingBottom: "2px" }}>
          <button
            type="button"
            className={`adm-btn adm-btn-sm ${selectedCurrencyTab === "all" ? "adm-btn-clay" : "adm-btn-outline"}`}
            onClick={() => setSelectedCurrencyTab("all")}
            style={{ borderRadius: "8px 8px 0 0" }}
          >
            Todas as Moedas
          </button>
          {availableCurrencies.map((curr) => (
            <button
              key={curr}
              type="button"
              className={`adm-btn adm-btn-sm ${selectedCurrencyTab === curr ? "adm-btn-clay" : "adm-btn-outline"}`}
              onClick={() => setSelectedCurrencyTab(curr)}
              style={{ borderRadius: "8px 8px 0 0" }}
            >
              Moeda: {curr}
            </button>
          ))}
        </div>

        {/* Grade de KPIs Separados por Moeda (REQUISITO: NUNCA SOMAR USD COM MXN) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {Object.entries(currencyKpis)
            .filter(([curr]) => selectedCurrencyTab === "all" || selectedCurrencyTab === curr)
            .map(([curr, kpi]) => (
              <div
                key={curr}
                className="adm-card"
                style={{ padding: "16px 20px", background: "var(--adm-surface)", border: "1px solid var(--adm-border)" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        background: curr === "USD" ? "var(--adm-emerald-bg)" : "var(--adm-gold-light)",
                        color: curr === "USD" ? "var(--adm-emerald)" : "var(--adm-wine)",
                        padding: "3px 10px",
                        borderRadius: "6px",
                        fontWeight: 700,
                        fontSize: "13px",
                        border: "1px solid var(--adm-border)",
                      }}
                    >
                      {curr} (Moeda Original)
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                      {kpi.payablesCount} compromisso{kpi.payablesCount > 1 ? "s" : ""}
                    </span>
                  </div>
                  {kpi.unknownCostCount > 0 && (
                    <span className="adm-badge badge-amber" style={{ fontSize: "11px" }}>
                      ⚠️ {kpi.unknownCostCount} com custo sob consulta
                    </span>
                  )}
                </div>

                <div className="adm-kpi-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "12px" }}>
                  <div className="adm-kpi-card" style={{ padding: "12px 14px" }}>
                    <div className="adm-kpi-header">
                      <span>Total Previsto</span>
                      <Clock size={15} color="var(--adm-clay)" />
                    </div>
                    <div className="adm-kpi-value" style={{ fontSize: "20px" }}>
                      {curr} {kpi.totalEstimated.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="adm-kpi-desc">Base de custo inicial</div>
                  </div>

                  <div className="adm-kpi-card" style={{ padding: "12px 14px" }}>
                    <div className="adm-kpi-header">
                      <span>Total Aprovado</span>
                      <CheckCircle2 size={15} color="var(--adm-wine)" />
                    </div>
                    <div className="adm-kpi-value" style={{ fontSize: "20px", color: "var(--adm-wine)" }}>
                      {curr} {kpi.totalApproved.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="adm-kpi-desc">Obrigações homologadas</div>
                  </div>

                  <div className="adm-kpi-card" style={{ padding: "12px 14px" }}>
                    <div className="adm-kpi-header">
                      <span>Total Já Pago</span>
                      <Receipt size={15} color="#059669" />
                    </div>
                    <div className="adm-kpi-value" style={{ fontSize: "20px", color: "#059669" }}>
                      {curr} {kpi.totalPaid.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="adm-kpi-desc">Pagamentos liquidados</div>
                  </div>

                  <div className="adm-kpi-card" style={{ padding: "12px 14px", background: kpi.pendingBalance > 0 ? "rgba(254, 243, 199, 0.3)" : "inherit" }}>
                    <div className="adm-kpi-header">
                      <span>Saldo Pendente</span>
                      <DollarSign size={15} color={kpi.pendingBalance > 0 ? "#b45309" : "#059669"} />
                    </div>
                    <div className="adm-kpi-value" style={{ fontSize: "20px", color: kpi.pendingBalance > 0 ? "#b45309" : "#059669" }}>
                      {curr} {kpi.pendingBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="adm-kpi-desc">A liquidar com operadores</div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="adm-card" style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
          {/* Busca por Texto */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: "280px" }}>
            <Search size={16} color="var(--adm-clay)" />
            <input
              type="text"
              className="adm-input"
              placeholder="Buscar por fornecedor, contrato (TN-XXXX), cliente ou comprovante..."
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
                style={{ width: "auto", minWidth: "160px" }}
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

            {/* Status */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--adm-text-muted)" }}>Status:</span>
              <select
                className="adm-select"
                style={{ width: "auto", minWidth: "160px" }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Todos os Status</option>
                <option value="previsto">⏳ Previsto</option>
                <option value="aguardando_aprovacao">⚠️ Aguardando Aprovação</option>
                <option value="aprovado">📋 Aprovado</option>
                <option value="parcialmente_pago">💳 Parcialmente Pago</option>
                <option value="pago">✅ Pago</option>
                <option value="cancelado">❌ Cancelado</option>
              </select>
            </div>

            {/* Moeda */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--adm-text-muted)" }}>Moeda:</span>
              <select
                className="adm-select"
                style={{ width: "auto" }}
                value={currencyFilter}
                onChange={(e) => setCurrencyFilter(e.target.value)}
              >
                <option value="all">Todas</option>
                {availableCurrencies.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Data do Serviço */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--adm-text-muted)" }}>Data Serviço:</span>
              <input
                type="date"
                className="adm-input"
                style={{ width: "auto" }}
                value={dateStartFilter}
                onChange={(e) => setDateStartFilter(e.target.value)}
              />
              <span style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>até</span>
              <input
                type="date"
                className="adm-input"
                style={{ width: "auto" }}
                value={dateEndFilter}
                onChange={(e) => setDateEndFilter(e.target.value)}
              />
              {(dateStartFilter || dateEndFilter) && (
                <button
                  type="button"
                  className="adm-btn adm-btn-outline adm-btn-sm"
                  onClick={() => {
                    setDateStartFilter("");
                    setDateEndFilter("");
                  }}
                  title="Limpar filtro de data"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
        </div>

        <div style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
          Exibindo <strong>{filteredPayables.length}</strong> de {payables.length} compromissos financeiros.
        </div>
      </div>

      {/* Conteúdo: Tabela ou Grupos por Fornecedor */}
      {loading ? (
        <div className="adm-card" style={{ padding: "60px 20px", textAlign: "center" }}>
          <Clock size={28} className="animate-spin" color="var(--adm-clay)" style={{ margin: "0 auto 12px" }} />
          <p style={{ color: "var(--adm-text-muted)" }}>Carregando Contas a Pagar dos Fornecedores...</p>
        </div>
      ) : filteredPayables.length === 0 ? (
        <div className="adm-card" style={{ padding: "60px 20px", textAlign: "center" }}>
          <Receipt size={38} color="var(--adm-clay)" style={{ margin: "0 auto 12px", opacity: 0.5 }} />
          <h3>Nenhuma obrigação financeira encontrada</h3>
          <p style={{ color: "var(--adm-text-muted)", fontSize: "14px", marginTop: "4px" }}>
            Ao finalizar a venda de contratos na Central de Contratos, os compromissos com fornecedores são gerados aqui automaticamente.
          </p>
        </div>
      ) : groupBySupplier && groupedPayables ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {Object.entries(groupedPayables).map(([suppName, items]) => (
            <div key={suppName} className="adm-card" style={{ padding: "16px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", borderBottom: "1px solid var(--adm-border)", paddingBottom: "8px" }}>
                <div>
                  <h3 style={{ fontSize: "18px", color: "var(--adm-wine)" }}>{suppName}</h3>
                  <span style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                    {items.length} serviço{items.length > 1 ? "s" : ""} contratado{items.length > 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              {renderPayablesTable(items)}
            </div>
          ))}
        </div>
      ) : (
        <div className="adm-table-wrap">
          {renderPayablesTable(filteredPayables)}
        </div>
      )}

      {/* =========================================================================
          MODAIS: APROVAÇÃO, PAGAMENTO, HISTÓRICO & RESERVA
         ========================================================================= */}

      {/* MODAL 1: APROVAÇÃO DE CUSTO FINAL */}
      {approveModal.open && approveModal.payable && (
        <div className="adm-modal-backdrop" onClick={() => !approveModal.submitting && setApproveModal((prev) => ({ ...prev, open: false }))}>
          <div className="adm-modal-card" style={{ maxWidth: "520px" }} onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--adm-wine-faded)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--adm-wine)" }}>
                  <DollarSign size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: "18px", color: "var(--adm-wine)" }}>Aprovar Custo Final do Fornecedor</h3>
                  <p style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                    {approveModal.payable.supplier_name} — {approveModal.payable.contract_number}
                  </p>
                </div>
              </div>
              <button type="button" className="adm-btn adm-btn-icon adm-btn-outline" onClick={() => setApproveModal((prev) => ({ ...prev, open: false }))}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveApproval}>
              <div className="adm-modal-body" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ background: "var(--adm-surface-alt)", padding: "10px 14px", borderRadius: "8px", fontSize: "12px" }}>
                  <div><strong>Serviço:</strong> {approveModal.payable.description}</div>
                  <div><strong>Data do Passeio:</strong> {new Date(approveModal.payable.service_date + "T12:00:00").toLocaleDateString("pt-BR")}</div>
                  <div>
                    <strong>Custo Estimado Original:</strong>{" "}
                    {approveModal.payable.amount_estimated !== null && approveModal.payable.amount_estimated !== undefined
                      ? `${approveModal.payable.currency} ${Number(approveModal.payable.amount_estimated).toFixed(2)}`
                      : "Sob Consulta (Desconhecido)"}
                  </div>
                  <div><strong>Total Já Pago:</strong> {approveModal.payable.currency} {Number(approveModal.payable.paid_amount || 0).toFixed(2)}</div>
                </div>

                <div>
                  <label className="adm-label">
                    Custo Final Homologado ({approveModal.payable.currency}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    disabled={approveModal.isUnknown}
                    className="adm-input"
                    placeholder="Ex: 390.00"
                    value={approveModal.amountFinal}
                    onChange={(e) => setApproveModal({ ...approveModal, amountFinal: e.target.value })}
                    required={!approveModal.isUnknown}
                  />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input
                    type="checkbox"
                    id="chk-unknown"
                    checked={approveModal.isUnknown}
                    onChange={(e) =>
                      setApproveModal({
                        ...approveModal,
                        isUnknown: e.target.checked,
                        amountFinal: e.target.checked ? "" : approveModal.amountFinal,
                      })
                    }
                  />
                  <label htmlFor="chk-unknown" style={{ fontSize: "13px", cursor: "pointer", color: "var(--adm-text-main)" }}>
                    Manter como custo desconhecido / sob consulta (NULL)
                  </label>
                </div>

                <div>
                  <label className="adm-label">Justificativa / Observações da Aprovação</label>
                  <textarea
                    className="adm-textarea"
                    rows={2}
                    placeholder="Ex: Tarifa acordada conforme tabela oficial v0.1.43 sem taxas adicionais..."
                    value={approveModal.notes}
                    onChange={(e) => setApproveModal({ ...approveModal, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="adm-modal-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button type="button" className="adm-btn adm-btn-outline" onClick={() => setApproveModal((prev) => ({ ...prev, open: false }))}>
                  Cancelar
                </button>
                <button type="submit" className="adm-btn adm-btn-clay" disabled={approveModal.submitting}>
                  {approveModal.submitting ? "Salvando..." : "Salvar e Aprovar Custo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REGISTRO DE PAGAMENTO (PARCIAL OU INTEGRAL) */}
      {paymentModal.open && paymentModal.payable && (
        <div className="adm-modal-backdrop" onClick={() => !paymentModal.submitting && setPaymentModal((prev) => ({ ...prev, open: false }))}>
          <div className="adm-modal-card" style={{ maxWidth: "540px" }} onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", color: "#15803d" }}>
                  <Receipt size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: "18px", color: "var(--adm-wine)" }}>Registrar Pagamento ao Fornecedor</h3>
                  <p style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                    {paymentModal.payable.supplier_name} — {paymentModal.payable.contract_number}
                  </p>
                </div>
              </div>
              <button type="button" className="adm-btn adm-btn-icon adm-btn-outline" onClick={() => setPaymentModal((prev) => ({ ...prev, open: false }))}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSavePayment}>
              <div className="adm-modal-body" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {/* Resumo do Saldo */}
                {(() => {
                  const { effectiveAmount, paidAmount, pendingBalance } = calculatePayableBalance(paymentModal.payable);
                  return (
                    <div style={{ background: "var(--adm-surface-alt)", padding: "12px 14px", borderRadius: "8px", border: "1px solid var(--adm-border)", fontSize: "13px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span>Custo Total Aprovado:</span>
                        <strong>{paymentModal.payable.currency} {effectiveAmount?.toFixed(2)}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", color: "#059669" }}>
                        <span>Total Já Pago:</span>
                        <span>{paymentModal.payable.currency} {paidAmount.toFixed(2)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "6px", borderTop: "1px dashed var(--adm-border)", color: "#b45309", fontWeight: 700, fontSize: "14px" }}>
                        <span>Saldo Pendente Atual:</span>
                        <span>{paymentModal.payable.currency} {pendingBalance?.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Valor a pagar */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <label className="adm-label" style={{ marginBottom: 0 }}>
                      Valor deste Pagamento ({paymentModal.payable.currency}) *
                    </label>
                    {(() => {
                      const { pendingBalance } = calculatePayableBalance(paymentModal.payable);
                      if (pendingBalance !== null && pendingBalance > 0) {
                        return (
                          <button
                            type="button"
                            className="adm-btn adm-btn-outline adm-btn-sm"
                            style={{ fontSize: "11px", padding: "2px 8px" }}
                            onClick={() => setPaymentModal((prev) => ({ ...prev, amount: String(pendingBalance) }))}
                          >
                            Pagar Saldo Total ({pendingBalance.toFixed(2)})
                          </button>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="adm-input"
                    placeholder="0.00"
                    value={paymentModal.amount}
                    onChange={(e) => setPaymentModal({ ...paymentModal, amount: e.target.value })}
                    required
                  />
                  <span style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>
                    Você pode lançar pagamentos parciais. O status mudará para "Parcialmente Pago" até o saldo zerar.
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label className="adm-label">Data do Pagamento *</label>
                    <input
                      type="date"
                      className="adm-input"
                      value={paymentModal.paymentDate}
                      onChange={(e) => setPaymentModal({ ...paymentModal, paymentDate: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="adm-label">Forma de Pagamento *</label>
                    <select
                      className="adm-select"
                      value={paymentModal.paymentMethod}
                      onChange={(e) => setPaymentModal({ ...paymentModal, paymentMethod: e.target.value })}
                    >
                      <option value="transferencia">Transferência Bancária</option>
                      <option value="pix">PIX</option>
                      <option value="wise">Wise / Remessa</option>
                      <option value="cartao">Cartão Corporativo</option>
                      <option value="especie">Espécie / Dinheiro</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="adm-label">Comprovante / Código de Referência</label>
                  <input
                    type="text"
                    className="adm-input"
                    placeholder="Ex: TED-98214, TX-Cancun-01..."
                    value={paymentModal.reference}
                    onChange={(e) => setPaymentModal({ ...paymentModal, reference: e.target.value })}
                  />
                </div>

                <div>
                  <label className="adm-label">Observações</label>
                  <textarea
                    className="adm-textarea"
                    rows={2}
                    placeholder="Ex: Primeira parcela paga via transferência bancária..."
                    value={paymentModal.notes}
                    onChange={(e) => setPaymentModal({ ...paymentModal, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="adm-modal-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button type="button" className="adm-btn adm-btn-outline" onClick={() => setPaymentModal((prev) => ({ ...prev, open: false }))}>
                  Cancelar
                </button>
                <button type="submit" className="adm-btn adm-btn-clay" disabled={paymentModal.submitting}>
                  {paymentModal.submitting ? "Registrando..." : "Confirmar Pagamento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: HISTÓRICO DE PAGAMENTOS E ESTORNOS AUDITÁVEIS */}
      {historyModal.open && historyModal.payable && (
        <div className="adm-modal-backdrop" onClick={() => setHistoryModal((prev) => ({ ...prev, open: false }))}>
          <div className="adm-modal-card" style={{ maxWidth: "640px" }} onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--adm-surface-alt)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--adm-clay)" }}>
                  <Receipt size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: "18px", color: "var(--adm-wine)" }}>Extrato de Pagamentos & Auditoria</h3>
                  <p style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                    {historyModal.payable.supplier_name} — {historyModal.payable.contract_number}
                  </p>
                </div>
              </div>
              <button type="button" className="adm-btn adm-btn-icon adm-btn-outline" onClick={() => setHistoryModal((prev) => ({ ...prev, open: false }))}>
                <X size={16} />
              </button>
            </div>

            <div className="adm-modal-body" style={{ maxHeight: "420px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
              {historyModal.loadingEntries ? (
                <div style={{ textAlign: "center", padding: "30px", color: "var(--adm-text-muted)" }}>
                  <Clock size={20} className="animate-spin" style={{ margin: "0 auto 8px" }} />
                  Carregando lançamentos...
                </div>
              ) : historyModal.entries.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px", color: "var(--adm-text-muted)" }}>
                  <Receipt size={32} style={{ margin: "0 auto 8px", opacity: 0.5 }} />
                  <p>Nenhum pagamento registrado nesta obrigação.</p>
                  <p style={{ fontSize: "11px", marginTop: "4px" }}>
                    Total registrado como pago no cabeçalho: {historyModal.payable.currency} {Number(historyModal.payable.paid_amount || 0).toFixed(2)}
                  </p>
                </div>
              ) : (
                historyModal.entries.map((entry) => (
                  <div
                    key={entry.id}
                    style={{
                      padding: "12px 14px",
                      borderRadius: "8px",
                      border: `1px solid ${entry.is_reversed ? "#fca5a5" : "var(--adm-border)"}`,
                      background: entry.is_reversed ? "#fff1f2" : "var(--adm-surface-alt)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      position: "relative",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <strong style={{ fontSize: "15px", color: entry.is_reversed ? "#991b1b" : "var(--adm-wine)" }}>
                          {entry.currency} {Number(entry.amount).toFixed(2)}
                        </strong>
                        <span style={{ fontSize: "11px", background: "var(--adm-surface)", padding: "1px 6px", borderRadius: "4px", border: "1px solid var(--adm-border)" }}>
                          {entry.payment_method}
                        </span>
                        {entry.is_reversed && (
                          <span className="adm-badge badge-red" style={{ fontSize: "10px" }}>
                            ESTORNADO
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                        {new Date(entry.payment_date + "T12:00:00").toLocaleDateString("pt-BR")}
                      </span>
                    </div>

                    <div style={{ fontSize: "12px", color: "var(--adm-text-main)" }}>
                      {entry.reference ? <><strong>Ref / Comprovante:</strong> {entry.reference} • </> : null}
                      {entry.notes ? <span>{entry.notes}</span> : null}
                    </div>

                    {entry.is_reversed ? (
                      <div style={{ fontSize: "11px", color: "#991b1b", marginTop: "4px", paddingTop: "4px", borderTop: "1px dashed #fca5a5" }}>
                        <strong>Motivo do estorno:</strong> {entry.reversal_reason || "Não informado"}
                        {entry.reversed_at && <> (em {new Date(entry.reversed_at).toLocaleString("pt-BR")})</>}
                      </div>
                    ) : (
                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
                        {historyModal.reversingId === entry.id ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%", background: "#fff", padding: "8px", borderRadius: "6px", border: "1px solid #fca5a5" }}>
                            <span style={{ fontSize: "11px", fontWeight: 600, color: "#991b1b" }}>Justificativa do Estorno:</span>
                            <input
                              type="text"
                              className="adm-input"
                              placeholder="Informe o motivo para cancelar este lançamento..."
                              value={historyModal.reversalReason}
                              onChange={(e) => setHistoryModal({ ...historyModal, reversalReason: e.target.value })}
                            />
                            <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                              <button
                                type="button"
                                className="adm-btn adm-btn-outline adm-btn-sm"
                                onClick={() => setHistoryModal({ ...historyModal, reversingId: null, reversalReason: "" })}
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                className="adm-btn adm-btn-sm"
                                style={{ background: "#dc2626", color: "#fff", borderColor: "#dc2626" }}
                                onClick={() => handleExecuteReversal(entry.id)}
                              >
                                Confirmar Estorno
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="adm-btn adm-btn-outline adm-btn-sm"
                            style={{ fontSize: "11px", color: "#b91c1c", borderColor: "#fca5a5" }}
                            onClick={() => setHistoryModal({ ...historyModal, reversingId: entry.id, reversalReason: "" })}
                          >
                            <RotateCcw size={11} />
                            <span>Estornar este Pagamento</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="adm-modal-footer" style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="button" className="adm-btn adm-btn-outline" onClick={() => setHistoryModal((prev) => ({ ...prev, open: false }))}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: DETALHES DA RESERVA OPERACIONAL VINCULADA */}
      {reservationModal.open && (
        <div className="adm-modal-backdrop" onClick={() => setReservationModal((prev) => ({ ...prev, open: false }))}>
          <div className="adm-modal-card" style={{ maxWidth: "560px" }} onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--adm-wine-faded)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--adm-wine)" }}>
                  <Calendar size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: "18px", color: "var(--adm-wine)" }}>Reserva Operacional Vinculada</h3>
                  <p style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                    Conciliação entre módulo financeiro e central de operações
                  </p>
                </div>
              </div>
              <button type="button" className="adm-btn adm-btn-icon adm-btn-outline" onClick={() => setReservationModal((prev) => ({ ...prev, open: false }))}>
                <X size={16} />
              </button>
            </div>

            <div className="adm-modal-body">
              {reservationModal.loading ? (
                <div style={{ textAlign: "center", padding: "30px", color: "var(--adm-text-muted)" }}>
                  <Clock size={20} className="animate-spin" style={{ margin: "0 auto 8px" }} />
                  Carregando dados operacionais...
                </div>
              ) : reservationModal.reservation ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
                  <div><strong>Passeio / Produto:</strong> {reservationModal.reservation.product_name}</div>
                  <div>
                    <strong>Data de Realização:</strong>{" "}
                    {new Date(reservationModal.reservation.tour_date + "T12:00:00").toLocaleDateString("pt-BR")}
                  </div>
                  <div>
                    <strong>Passageiros:</strong> {reservationModal.reservation.adults_count} adultos
                    {reservationModal.reservation.children_count > 0 ? `, ${reservationModal.reservation.children_count} crianças` : ""}
                  </div>
                  <div><strong>Hotel / Ponto de Encontro:</strong> {reservationModal.reservation.pickup_location || "A confirmar"}</div>
                  <div><strong>Horário de Pick-up:</strong> {reservationModal.reservation.pickup_time || "Pendente"}</div>
                  <div><strong>Cód. Confirmação Fornecedor:</strong> {reservationModal.reservation.supplier_confirmation_code || "Não informado"}</div>
                  <div><strong>Voucher Cliente:</strong> {reservationModal.reservation.voucher_ref || "Não gerado"}</div>
                  <div><strong>Status Operacional:</strong> <span className="adm-badge badge-amber">{reservationModal.reservation.status}</span></div>
                  {reservationModal.reservation.notes && (
                    <div><strong>Notas:</strong> {reservationModal.reservation.notes}</div>
                  )}
                </div>
              ) : (
                <p style={{ color: "var(--adm-text-muted)" }}>Reserva não localizada.</p>
              )}
            </div>

            <div className="adm-modal-footer" style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="button" className="adm-btn adm-btn-outline" onClick={() => setReservationModal((prev) => ({ ...prev, open: false }))}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Renderizador da tabela de compromissos
  function renderPayablesTable(items: SupplierPayable[]) {
    return (
      <table className="adm-table">
        <thead>
          <tr>
            <th>Fornecedor</th>
            <th>Contrato / Cliente</th>
            <th>Serviço / Passeio</th>
            <th>Data Serviço</th>
            <th>Moeda</th>
            <th>Custo Estimado</th>
            <th>Custo Aprovado</th>
            <th>Já Pago</th>
            <th>Saldo Pendente</th>
            <th>Status</th>
            <th style={{ textAlign: "right", minWidth: "160px" }}>Ações Financeiras</th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => {
            const { effectiveAmount, paidAmount, pendingBalance, isUnknown } = calculatePayableBalance(p);
            const cfg = STATUS_CONFIG[p.payment_status] || STATUS_CONFIG.previsto;

            return (
              <tr key={p.id}>
                {/* Fornecedor */}
                <td>
                  <div style={{ fontWeight: 700, color: "var(--adm-wine)", fontSize: "14px" }}>
                    {p.supplier_name || "Operador Local"}
                  </div>
                </td>

                {/* Contrato & Cliente */}
                <td>
                  <div style={{ fontWeight: 600, color: "var(--adm-wine)" }}>
                    {p.contract_number}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--adm-text-main)" }}>
                    {p.client_name}
                  </div>
                </td>

                {/* Serviço */}
                <td>
                  <div style={{ fontWeight: 600, fontSize: "13px" }}>{p.description}</div>
                  {p.reservation_id && (
                    <button
                      type="button"
                      onClick={() => handleOpenReservationModal(p)}
                      style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        color: "var(--adm-clay)",
                        fontSize: "11px",
                        cursor: "pointer",
                        textDecoration: "underline",
                        display: "flex",
                        alignItems: "center",
                        gap: "2px",
                        marginTop: "2px",
                      }}
                    >
                      <Eye size={10} />
                      <span>Ver Reserva</span>
                    </button>
                  )}
                </td>

                {/* Data Serviço */}
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px" }}>
                    <Calendar size={12} color="var(--adm-clay)" />
                    <span>{new Date(p.service_date + "T12:00:00").toLocaleDateString("pt-BR")}</span>
                  </div>
                </td>

                {/* Moeda */}
                <td>
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontWeight: 700,
                      background: "var(--adm-surface-alt)",
                      border: "1px solid var(--adm-border)",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      fontSize: "11px",
                    }}
                  >
                    {p.currency}
                  </span>
                </td>

                {/* Custo Estimado */}
                <td>
                  {p.amount_estimated !== null && p.amount_estimated !== undefined ? (
                    <span style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                      {Number(p.amount_estimated).toFixed(2)}
                    </span>
                  ) : (
                    <span className="adm-badge badge-amber" style={{ fontSize: "10px" }}>
                      Sob Consulta
                    </span>
                  )}
                </td>

                {/* Custo Aprovado */}
                <td>
                  {p.amount_final !== null && p.amount_final !== undefined ? (
                    <span style={{ fontWeight: 700, color: "var(--adm-wine)", fontSize: "13px" }}>
                      {Number(p.amount_final).toFixed(2)}
                    </span>
                  ) : (
                    <span style={{ fontSize: "11px", color: "var(--adm-text-muted)", fontStyle: "italic" }}>
                      Aguardando
                    </span>
                  )}
                </td>

                {/* Já Pago */}
                <td>
                  <span
                    style={{
                      fontWeight: paidAmount > 0 ? 600 : 400,
                      color: paidAmount > 0 ? "#059669" : "var(--adm-text-muted)",
                      fontSize: "12px",
                    }}
                  >
                    {paidAmount.toFixed(2)}
                  </span>
                </td>

                {/* Saldo Pendente */}
                <td>
                  {isUnknown ? (
                    <span className="adm-badge badge-amber" style={{ fontSize: "10px" }}>
                      Indefinido
                    </span>
                  ) : (
                    <span
                      style={{
                        fontWeight: 700,
                        color: pendingBalance && pendingBalance > 0 ? "#b45309" : "#059669",
                        fontSize: "13px",
                      }}
                    >
                      {pendingBalance !== null ? pendingBalance.toFixed(2) : "—"}
                    </span>
                  )}
                </td>

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
                </td>

                {/* Ações */}
                <td style={{ textAlign: "right" }}>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px", flexWrap: "wrap" }}>
                    {/* Botão Aprovar Custo */}
                    <button
                      type="button"
                      className="adm-btn adm-btn-outline adm-btn-sm"
                      onClick={() => handleOpenApproveModal(p)}
                      title="Aprovar ou ajustar o custo final do fornecedor"
                    >
                      <DollarSign size={12} />
                      <span>{p.amount_final !== null ? "Ajustar" : "Aprovar"}</span>
                    </button>

                    {/* Botão Registrar Pagamento */}
                    <button
                      type="button"
                      className="adm-btn adm-btn-outline adm-btn-sm"
                      style={{
                        background: p.payment_status === "pago" ? "var(--adm-surface-alt)" : "rgba(16, 185, 129, 0.08)",
                        color: p.payment_status === "pago" ? "var(--adm-text-muted)" : "#059669",
                        borderColor: p.payment_status === "pago" ? "var(--adm-border)" : "#10b981",
                        fontWeight: 600,
                      }}
                      onClick={() => handleOpenPaymentModal(p)}
                      title="Registrar pagamento parcial ou integral"
                    >
                      <Receipt size={12} />
                      <span>Pagar</span>
                    </button>

                    {/* Botão Extrato / Histórico */}
                    <button
                      type="button"
                      className="adm-btn adm-btn-outline adm-btn-sm"
                      onClick={() => handleOpenHistoryModal(p)}
                      title="Ver extrato de pagamentos e efetuar estornos auditáveis"
                    >
                      <Clock size={12} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }
}
