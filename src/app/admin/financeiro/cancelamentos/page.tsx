"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuthProfile } from "@/lib/auth/AuthContext";
import {
  ReservationCancellationStatus,
  ContractCancellationStatus,
  ClientCreditStatus,
  ClientRefundStatus,
  SupplierRecoveryType,
  SupplierRecoveryStatus,
  ClientCredit,
  ClientCreditUsage,
  ClientRefund,
  SupplierRecovery,
  CurrencyFinancialImpact,
  ContractPreCancellationSummary,
  calculateFinancialImpactByCurrency,
  buildContractPreCancellationSummary,
  validateClientCreditUsage,
  validateClientCreditGrant,
  validateRefundRequest,
  validateRefundApproval,
  validateRefundPayment,
  isClientCreditExpired,
  getEffectiveCreditStatus,
  validateSupplierRecoveryRecord,
  generateSupplierCancellationWhatsAppMessage,
} from "@/lib/operational/cancellationOperations";
import { formatWhatsAppLink } from "@/lib/operational/supplierMessaging";
import { updateOperationalReservation } from "@/lib/operational/updateReservation";
import {
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Calendar,
  Users,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Send,
  X,
  CreditCard,
  Building,
  Check,
  CheckCheck,
  AlertCircle,
  Eye,
  ArrowRight,
  TrendingDown,
  Info,
  Car,
  Plane,
  XCircle,
  ShieldAlert,
  ArrowDownRight,
  Receipt,
  MessageSquare,
  Sparkles,
} from "lucide-react";

type ActiveTab = "operacional" | "contratual" | "creditos" | "reembolsos" | "fornecedores" | "impacto";

export default function AdminCancellationsAndRefundsPage() {
  const { role, profile } = useAuthProfile();
  const isAdmin = role === "admin";

  const [activeTab, setActiveTab] = useState<ActiveTab>("operacional");
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Estados de Dados
  const [reservations, setReservations] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [credits, setCredits] = useState<ClientCredit[]>([]);
  const [refunds, setRefunds] = useState<ClientRefund[]>([]);
  const [supplierRecoveries, setSupplierRecoveries] = useState<SupplierRecovery[]>([]);
  const [supplierPayables, setSupplierPayables] = useState<any[]>([]);
  const [suppliersMap, setSuppliersMap] = useState<Record<string, any>>({});

  // Filtros
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [currencyFilter, setCurrencyFilter] = useState<string>("todos");

  // Notificação Toast
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // ---------------------------------------------------------------------------
  // Modais de Ação
  // ---------------------------------------------------------------------------

  // 1. Modal de Cancelamento Operacional de Reserva
  const [resCancelModal, setResCancelModal] = useState<{
    open: boolean;
    reservation: any | null;
    reason: string;
    actionType: "solicitar" | "confirmar" | "recusar";
    penaltyAmount: number;
    supplierResponse: string;
    submitting: boolean;
  }>({
    open: false,
    reservation: null,
    reason: "",
    actionType: "solicitar",
    penaltyAmount: 0,
    supplierResponse: "",
    submitting: false,
  });

  // 2. Modal de WhatsApp para Fornecedor
  const [supplierWaModal, setSupplierWaModal] = useState<{
    open: boolean;
    reservation: any | null;
    targetPhone: string;
    messageText: string;
    copied: boolean;
  }>({
    open: false,
    reservation: null,
    targetPhone: "",
    messageText: "",
    copied: false,
  });

  // 3. Modal de Análise Prévia e Cancelamento Contratual
  const [contractCancelModal, setContractCancelModal] = useState<{
    open: boolean;
    contract: any | null;
    summary: ContractPreCancellationSummary | null;
    reason: string;
    clientResolution: "nenhuma" | "conceder_credito" | "solicitar_reembolso";
    resolutionAmount: number;
    submitting: boolean;
  }>({
    open: false,
    contract: null,
    summary: null,
    reason: "",
    clientResolution: "nenhuma",
    resolutionAmount: 0,
    submitting: false,
  });

  // 4. Modal de Concessão de Crédito
  const [creditGrantModal, setCreditGrantModal] = useState<{
    open: boolean;
    clientId: string;
    contractId: string;
    amount: number;
    currency: string;
    reason: string;
    notes: string;
    submitting: boolean;
  }>({
    open: false,
    clientId: "",
    contractId: "",
    amount: 0,
    currency: "BRL",
    reason: "",
    notes: "",
    submitting: false,
  });

  // 5. Modal de Utilização de Crédito em Contrato
  const [creditUseModal, setCreditUseModal] = useState<{
    open: boolean;
    credit: ClientCredit | null;
    destinationContractId: string;
    amountToUse: number;
    notes: string;
    submitting: boolean;
  }>({
    open: false,
    credit: null,
    destinationContractId: "",
    amountToUse: 0,
    notes: "",
    submitting: false,
  });

  // 6. Modal de Reembolso (Solicitação / Aprovação / Pagamento)
  const [refundActionModal, setRefundActionModal] = useState<{
    open: boolean;
    mode: "solicitar" | "aprovar" | "pagar";
    refund: ClientRefund | null;
    contractId: string;
    amount: number;
    currency: string;
    reason: string;
    paymentMethod: string;
    paymentReference: string;
    notes: string;
    submitting: boolean;
  }>({
    open: false,
    mode: "solicitar",
    refund: null,
    contractId: "",
    amount: 0,
    currency: "BRL",
    reason: "",
    paymentMethod: "pix",
    paymentReference: "",
    notes: "",
    submitting: false,
  });

  // 7. Modal de Resolução de Fornecedor
  const [supplierRecModal, setSupplierRecModal] = useState<{
    open: boolean;
    supplierId: string;
    contractId: string;
    reservationId: string;
    recoveryType: SupplierRecoveryType;
    amountOriginal: number;
    penaltyAmount: number;
    recoveredAmount: number;
    currency: string;
    supplierResponse: string;
    notes: string;
    submitting: boolean;
  }>({
    open: false,
    supplierId: "",
    contractId: "",
    reservationId: "",
    recoveryType: "sem_custo",
    amountOriginal: 0,
    penaltyAmount: 0,
    recoveredAmount: 0,
    currency: "USD",
    supplierResponse: "",
    notes: "",
    submitting: false,
  });

  // ---------------------------------------------------------------------------
  // Carregamento de Dados (com Fallback Resiliente)
  // ---------------------------------------------------------------------------
  const fetchAllData = async () => {
    try {
      // 1. Fornecedores
      const { data: supps } = await supabase
        .from("suppliers")
        .select("id, name, trade_name, contact_name, phone, whatsapp, email");

      const sMap: Record<string, any> = {};
      (supps || []).forEach((s: any) => {
        sMap[s.id] = s;
        if (s.name) sMap[s.name.toLowerCase().trim()] = s;
      });
      setSuppliersMap(sMap);

      // 2. Reservas Operacionais com Contratos
      const { data: opData } = await supabase
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
            client_paid_amount,
            total_amount,
            currency,
            status
          )
        `)
        .order("tour_date", { ascending: false });
      setReservations(opData || []);

      // 3. Contratos
      const { data: contractsData } = await supabase
        .from("contracts")
        .select(`
          id,
          contract_number,
          client_id,
          client_name,
          client_phone,
          client_email,
          client_cpf,
          total_amount,
          client_paid_amount,
          deposit_amount,
          balance_amount,
          currency,
          status,
          cancellation_reason,
          cancelled_at,
          cancelled_by_name,
          created_at
        `)
        .order("created_at", { ascending: false });
      setContracts(contractsData || []);

      // 4. Obrigações Financeiras com Fornecedores (apenas se admin)
      if (isAdmin) {
        const { data: payablesData } = await supabase
          .from("supplier_payables")
          .select("*");
        setSupplierPayables(payablesData || []);
      }

      // 5. Créditos de Clientes (tenta tabela dedicada, com fallback gracioso se migration pendente)
      try {
        const { data: creditsData, error: crErr } = await supabase
          .from("client_credits")
          .select(`
            *,
            client_credit_usages (*)
          `)
          .order("created_at", { ascending: false });

        if (!crErr && creditsData) {
          setCredits(creditsData);
        } else {
          setCredits([]);
        }
      } catch (err) {
        setCredits([]);
      }

      // 6. Reembolsos de Clientes
      try {
        const { data: refundsData, error: rfErr } = await supabase
          .from("client_refunds")
          .select("*")
          .order("created_at", { ascending: false });

        if (!rfErr && refundsData) {
          setRefunds(refundsData);
        } else {
          setRefunds([]);
        }
      } catch (err) {
        setRefunds([]);
      }

      // 7. Recuperações de Fornecedores (Admin)
      if (isAdmin) {
        try {
          const { data: recData, error: recErr } = await supabase
            .from("supplier_recovery_records")
            .select("*")
            .order("created_at", { ascending: false });

          if (!recErr && recData) {
            setSupplierRecoveries(recData);
          } else {
            setSupplierRecoveries([]);
          }
        } catch (err) {
          setSupplierRecoveries([]);
        }
      }
    } catch (err: any) {
      console.error("Erro geral no carregamento financeiro de cancelamentos:", err);
      showToast("Erro ao carregar dados: " + err.message, "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [isAdmin]);

  // ---------------------------------------------------------------------------
  // Resumos e Métricas Financeiras Segregadas por Moeda
  // ---------------------------------------------------------------------------
  const financialImpact = useMemo(() => {
    return calculateFinancialImpactByCurrency({
      contracts,
      supplierPayables: isAdmin ? supplierPayables : [],
      credits,
      refunds,
      supplierRecoveries: isAdmin ? supplierRecoveries : [],
    });
  }, [contracts, supplierPayables, credits, refunds, supplierRecoveries, isAdmin]);

  // Contadores Rápidos
  const openReservationCancellationsCount = useMemo(() => {
    return reservations.filter(
      (r) =>
        r.status === "cancelamento_solicitado" ||
        r.cancellation_status === "solicitado" ||
        r.cancellation_status === "aguardando_fornecedor"
    ).length;
  }, [reservations]);

  const availableCreditsTotal = useMemo(() => {
    return credits
      .filter((c) => c.status === "disponivel" || c.status === "parcialmente_utilizado")
      .reduce((acc, c) => acc + Number(c.balance || 0), 0);
  }, [credits]);

  const pendingRefundsTotal = useMemo(() => {
    return refunds
      .filter((r) => r.status === "solicitado" || r.status === "em_analise" || r.status === "aprovado")
      .reduce((acc, r) => acc + Number(r.amount || 0), 0);
  }, [refunds]);

  const paidRefundsTotal = useMemo(() => {
    return refunds
      .filter((r) => r.status === "pago")
      .reduce((acc, r) => acc + Number(r.amount || 0), 0);
  }, [refunds]);

  // ---------------------------------------------------------------------------
  // Ações de Cancelamento Operacional de Reserva
  // ---------------------------------------------------------------------------
  const handleOpenResCancelModal = (res: any, action: "solicitar" | "confirmar" | "recusar") => {
    setResCancelModal({
      open: true,
      reservation: res,
      reason: res.cancellation_reason || "",
      actionType: action,
      penaltyAmount: Number(res.penalty_amount || 0),
      supplierResponse: res.cancellation_supplier_response || "",
      submitting: false,
    });
  };

  const handleSaveResCancellation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resCancelModal.reservation) return;
    setResCancelModal((prev) => ({ ...prev, submitting: true }));

    try {
      const res = resCancelModal.reservation;
      const nowIso = new Date().toISOString();
      const operatorName = profile?.fullName || "Operador Tío Nenê";

      let nextStatus = res.status;
      let nextCancelStatus = "nenhum";

      if (resCancelModal.actionType === "solicitar") {
        nextStatus = "cancelamento_solicitado";
        nextCancelStatus = "aguardando_fornecedor";
      } else if (resCancelModal.actionType === "confirmar") {
        nextStatus = "cancelada";
        nextCancelStatus = "confirmado";
      } else if (resCancelModal.actionType === "recusar") {
        nextStatus = "confirmada";
        nextCancelStatus = "recusado";
      }

      // Atualizar via RPC segura ou update
      await updateOperationalReservation(supabase, {
        reservationId: res.id,
        status: nextStatus === "cancelada" ? "cancelada" : undefined,
        notes: res.notes ? `${res.notes}\n[Cancelamento ${resCancelModal.actionType}]: ${resCancelModal.reason}` : resCancelModal.reason,
        actionDescription: `Cancelamento operacional: ${resCancelModal.actionType} · Motivo: ${resCancelModal.reason}`,
        isAdmin,
      });

      // Atualizar colunas adicionais de cancelamento
      await supabase
        .from("operational_reservations")
        .update({
          cancellation_status: nextCancelStatus,
          cancellation_reason: resCancelModal.reason,
          cancellation_confirmed_at: resCancelModal.actionType === "confirmar" ? nowIso : null,
          cancellation_supplier_response: resCancelModal.supplierResponse.trim() || null,
          penalty_amount: resCancelModal.penaltyAmount,
          updated_at: nowIso,
        })
        .eq("id", res.id);

      // Persistir resolução de fornecedor caso confirmada por administrador
      if (resCancelModal.actionType === "confirmar" && isAdmin) {
        try {
          const recPayload = {
            supplier_id: res.supplier_id || null,
            contract_id: res.contract_id || null,
            reservation_id: res.id,
            recovery_type: (resCancelModal.penaltyAmount > 0 ? "multa_aplicada" : "sem_custo") as SupplierRecoveryType,
            amount_original: Number(res.supplier_cost_estimated || res.supplier_cost_final || 0),
            penalty_amount: resCancelModal.penaltyAmount || 0,
            recovered_amount: 0,
            currency: (res.currency || "USD").toUpperCase(),
            status: "concluido" as SupplierRecoveryStatus,
            supplier_response: resCancelModal.supplierResponse.trim() || null,
            created_by_name: operatorName,
          };

          const validation = validateSupplierRecoveryRecord({
            ...recPayload,
            userRole: profile?.role || "user",
          });

          if (validation.valid) {
            await supabase.from("supplier_recovery_records").insert(recPayload);
          } else {
            console.warn("supplier_recovery_records validation blocked:", validation.error);
          }
        } catch (recErr) {
          console.warn("supplier_recovery_records insert fallback:", recErr);
        }
      }

      showToast(`Cancelamento da reserva registrado com sucesso (${nextCancelStatus})!`);
      setResCancelModal((prev) => ({ ...prev, open: false, submitting: false }));
      fetchAllData();
    } catch (err: any) {
      console.error("Erro ao registrar cancelamento operacional:", err);
      showToast("Erro ao processar: " + err.message, "error");
      setResCancelModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  // Abrir Modal de WhatsApp para Fornecedor
  const handleOpenSupplierWhatsAppModal = (res: any) => {
    const supp =
      res.supplier_id && suppliersMap[res.supplier_id]
        ? suppliersMap[res.supplier_id]
        : res.supplier_name
        ? suppliersMap[res.supplier_name.toLowerCase().trim()]
        : null;

    const phone = supp?.whatsapp || supp?.phone || "";
    const msg = generateSupplierCancellationWhatsAppMessage({
      supplierName: res.supplier_name || "Fornecedor",
      productName: res.product_name,
      tourDate: res.tour_date,
      clientName: res.client_name || res.contracts?.client_name || "Cliente",
      totalPax: (Number(res.adults_count) || 1) + (Number(res.children_count) || 0),
      supplierConfirmationCode: res.supplier_confirmation_code,
      voucherRef: res.voucher_ref,
      cancellationReason: res.cancellation_reason || "Solicitação de cancelamento pelo cliente",
    });

    setSupplierWaModal({
      open: true,
      reservation: res,
      targetPhone: phone,
      messageText: msg,
      copied: false,
    });
  };

  // ---------------------------------------------------------------------------
  // Ações de Cancelamento Contratual Completo
  // ---------------------------------------------------------------------------
  const handleOpenContractCancelModal = (contract: any) => {
    const contractRes = reservations.filter((r) => r.contract_id === contract.id);
    const contractPayables = supplierPayables.filter((p) => p.contract_id === contract.id);

    const summary = buildContractPreCancellationSummary({
      contract,
      reservations: contractRes,
      supplierPayables: contractPayables,
    });

    setContractCancelModal({
      open: true,
      contract,
      summary,
      reason: "",
      clientResolution: "nenhuma",
      resolutionAmount: Number(contract.client_paid_amount || 0),
      submitting: false,
    });
  };

  const handleConfirmContractCancellation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractCancelModal.contract) return;
    setContractCancelModal((prev) => ({ ...prev, submitting: true }));

    try {
      const c = contractCancelModal.contract;
      const nowIso = new Date().toISOString();
      const operatorName = profile?.fullName || "Administrador Tío Nenê";

      // 1. Atualizar contrato para cancelado
      const { error: cErr } = await supabase
        .from("contracts")
        .update({
          status: "cancelado",
          cancellation_reason: contractCancelModal.reason,
          cancelled_at: nowIso,
          cancelled_by_name: operatorName,
          updated_at: nowIso,
        })
        .eq("id", c.id);

      if (cErr) throw cErr;

      // 2. Se optou por gerar crédito para o cliente
      if (contractCancelModal.clientResolution === "conceder_credito" && contractCancelModal.resolutionAmount > 0) {
        try {
          await supabase.rpc("grant_client_credit", {
            p_client_id: c.client_id,
            p_contract_id: c.id,
            p_amount: contractCancelModal.resolutionAmount,
            p_currency: c.currency || "BRL",
            p_reason: `Crédito por cancelamento do Contrato ${c.contract_number}: ${contractCancelModal.reason}`,
          });
        } catch (rpcErr) {
          // Fallback se RPC não existir no remoto
          await supabase.from("client_credits").insert({
            client_id: c.client_id,
            contract_id: c.id,
            amount: contractCancelModal.resolutionAmount,
            currency: c.currency || "BRL",
            balance: contractCancelModal.resolutionAmount,
            reason: `Crédito por cancelamento do Contrato ${c.contract_number}: ${contractCancelModal.reason}`,
            status: "disponivel",
            created_by_name: operatorName,
          });
        }
      }

      // 3. Se optou por solicitar reembolso para o cliente
      if (contractCancelModal.clientResolution === "solicitar_reembolso" && contractCancelModal.resolutionAmount > 0) {
        try {
          await supabase.rpc("request_client_refund", {
            p_contract_id: c.id,
            p_amount: contractCancelModal.resolutionAmount,
            p_currency: c.currency || "BRL",
            p_reason: `Reembolso por cancelamento do Contrato ${c.contract_number}: ${contractCancelModal.reason}`,
          });
        } catch (rpcErr) {
          await supabase.from("client_refunds").insert({
            client_id: c.client_id,
            contract_id: c.id,
            amount: contractCancelModal.resolutionAmount,
            currency: c.currency || "BRL",
            reason: `Reembolso por cancelamento do Contrato ${c.contract_number}: ${contractCancelModal.reason}`,
            status: "solicitado",
            requested_by_name: operatorName,
          });
        }
      }

      showToast(`Contrato ${c.contract_number} cancelado com sucesso e resolução financeira aplicada!`);
      setContractCancelModal((prev) => ({ ...prev, open: false, submitting: false }));
      fetchAllData();
    } catch (err: any) {
      console.error("Erro ao cancelar contrato:", err);
      showToast("Erro ao cancelar contrato: " + err.message, "error");
      setContractCancelModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  // ---------------------------------------------------------------------------
  // Ações de Créditos de Clientes
  // ---------------------------------------------------------------------------
  const handleOpenCreditUseModal = (credit: ClientCredit) => {
    setCreditUseModal({
      open: true,
      credit,
      destinationContractId: "",
      amountToUse: credit.balance,
      notes: "",
      submitting: false,
    });
  };

  const handleApplyCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditUseModal.credit) return;

    const destContract = contracts.find((c) => c.id === creditUseModal.destinationContractId);
    if (!destContract) {
      alert("Selecione um contrato de destino válido.");
      return;
    }

    const validation = validateClientCreditUsage({
      credit: creditUseModal.credit,
      amountToUse: creditUseModal.amountToUse,
      destinationCurrency: destContract.currency || "BRL",
      destinationClientId: destContract.client_id,
    });

    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setCreditUseModal((prev) => ({ ...prev, submitting: true }));

    try {
      const cr = creditUseModal.credit;

      try {
        await supabase.rpc("use_client_credit", {
          p_credit_id: cr.id,
          p_destination_contract_id: creditUseModal.destinationContractId,
          p_amount_to_use: creditUseModal.amountToUse,
          p_notes: creditUseModal.notes,
        });
      } catch (rpcErr) {
        // Fallback direto
        const newBal = cr.balance - creditUseModal.amountToUse;
        await supabase
          .from("client_credits")
          .update({
            balance: newBal,
            status: newBal === 0 ? "utilizado" : "parcialmente_utilizado",
            updated_at: new Date().toISOString(),
          })
          .eq("id", cr.id);

        await supabase.from("client_credit_usages").insert({
          credit_id: cr.id,
          destination_contract_id: creditUseModal.destinationContractId,
          amount_used: creditUseModal.amountToUse,
          currency: cr.currency,
          used_by_name: profile?.fullName || "Operador",
          notes: creditUseModal.notes,
        });
      }

      showToast("Crédito aplicado com sucesso ao contrato destino!");
      setCreditUseModal((prev) => ({ ...prev, open: false, submitting: false }));
      fetchAllData();
    } catch (err: any) {
      console.error("Erro ao aplicar crédito:", err);
      showToast("Erro ao aplicar crédito: " + err.message, "error");
      setCreditUseModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  // ---------------------------------------------------------------------------
  // Ações de Reembolsos de Clientes
  // ---------------------------------------------------------------------------
  const handleOpenRefundModal = (mode: "solicitar" | "aprovar" | "pagar", refund?: ClientRefund) => {
    setRefundActionModal({
      open: true,
      mode,
      refund: refund || null,
      contractId: refund?.contract_id || "",
      amount: refund ? Number(refund.amount) : 0,
      currency: refund ? refund.currency : "BRL",
      reason: refund?.reason || "",
      paymentMethod: refund?.payment_method || "pix",
      paymentReference: refund?.payment_reference || "",
      notes: refund?.notes || "",
      submitting: false,
    });
  };

  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    setRefundActionModal((prev) => ({ ...prev, submitting: true }));

    try {
      const mode = refundActionModal.mode;
      const rf = refundActionModal.refund;
      const operatorName = profile?.fullName || "Administrador";

      if (mode === "solicitar") {
        const valReq = validateRefundRequest({
          contractId: refundActionModal.contractId,
          amount: refundActionModal.amount,
          currency: refundActionModal.currency,
          reason: refundActionModal.reason,
          userRole: role,
        });
        if (!valReq.valid) {
          alert(valReq.error);
          setRefundActionModal((prev) => ({ ...prev, submitting: false }));
          return;
        }

        try {
          await supabase.rpc("request_client_refund", {
            p_contract_id: refundActionModal.contractId,
            p_amount: refundActionModal.amount,
            p_currency: refundActionModal.currency,
            p_reason: refundActionModal.reason,
            p_notes: refundActionModal.notes,
          });
        } catch (rpcErr) {
          const selectedC = contracts.find((c) => c.id === refundActionModal.contractId);
          await supabase.from("client_refunds").insert({
            client_id: selectedC?.client_id,
            contract_id: refundActionModal.contractId,
            amount: refundActionModal.amount,
            currency: refundActionModal.currency,
            reason: refundActionModal.reason,
            status: "solicitado",
            requested_by_name: operatorName,
            notes: refundActionModal.notes,
          });
        }
        showToast("Solicitação de reembolso cadastrada com sucesso!");
      } else if (mode === "aprovar" && rf) {
        const valAppr = validateRefundApproval(rf);
        if (!valAppr.valid) {
          alert(valAppr.error);
          setRefundActionModal((prev) => ({ ...prev, submitting: false }));
          return;
        }

        try {
          await supabase.rpc("approve_client_refund", {
            p_refund_id: rf.id,
            p_notes: refundActionModal.notes,
          });
        } catch (rpcErr) {
          await supabase
            .from("client_refunds")
            .update({
              status: "aprovado",
              approved_at: new Date().toISOString(),
              approved_by_name: operatorName,
              notes: refundActionModal.notes,
              updated_at: new Date().toISOString(),
            })
            .eq("id", rf.id);
        }
        showToast("Reembolso aprovado com sucesso!");
      } else if (mode === "pagar" && rf) {
        const valPay = validateRefundPayment({
          refund: rf,
          paymentMethod: refundActionModal.paymentMethod,
          paymentReference: refundActionModal.paymentReference,
        });
        if (!valPay.valid) {
          alert(valPay.error);
          setRefundActionModal((prev) => ({ ...prev, submitting: false }));
          return;
        }

        try {
          await supabase.rpc("pay_client_refund", {
            p_refund_id: rf.id,
            p_payment_method: refundActionModal.paymentMethod,
            p_payment_reference: refundActionModal.paymentReference,
            p_notes: refundActionModal.notes,
          });
        } catch (rpcErr) {
          await supabase
            .from("client_refunds")
            .update({
              status: "pago",
              payment_method: refundActionModal.paymentMethod,
              payment_reference: refundActionModal.paymentReference,
              paid_at: new Date().toISOString(),
              paid_by_name: operatorName,
              notes: refundActionModal.notes,
              updated_at: new Date().toISOString(),
            })
            .eq("id", rf.id);
        }
        showToast("Pagamento de reembolso registrado com sucesso com comprovante bancário!");
      }

      setRefundActionModal((prev) => ({ ...prev, open: false, submitting: false }));
      fetchAllData();
    } catch (err: any) {
      console.error("Erro no processamento do reembolso:", err);
      showToast("Erro: " + err.message, "error");
      setRefundActionModal((prev) => ({ ...prev, submitting: false }));
    }
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
            <RotateCcw size={13} />
            <span>FINANCEIRO & POLÍTICA DE CANCELAMENTO</span>
          </span>
          <h2 style={{ fontSize: "28px", color: "var(--adm-wine)", marginTop: "4px" }}>
            Cancelamentos, Créditos e Reembolsos
          </h2>
          <p style={{ color: "var(--adm-text-muted)", fontSize: "14px", marginTop: "2px" }}>
            Controle integrado de cancelamentos de passeios e contratos, gestão de créditos de clientes, fluxo de reembolsos e recuperação de fornecedores.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <button
            type="button"
            className="adm-btn adm-btn-outline adm-btn-sm"
            onClick={() => {
              setRefreshing(true);
              fetchAllData();
            }}
            disabled={refreshing || loading}
            title="Atualizar dados"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            <span>{refreshing ? "Atualizando..." : "Atualizar"}</span>
          </button>

          <Link href="/admin/financeiro" className="adm-btn adm-btn-outline adm-btn-sm">
            <DollarSign size={14} />
            <span>Painel Financeiro</span>
          </Link>

          <Link href="/admin/financeiro/clientes" className="adm-btn adm-btn-outline adm-btn-sm">
            <CreditCard size={14} />
            <span>Contas a Receber</span>
          </Link>

          {isAdmin && (
            <Link href="/admin/financeiro/fornecedores" className="adm-btn adm-btn-outline adm-btn-sm">
              <Building size={14} />
              <span>Contas a Pagar</span>
            </Link>
          )}

          <Link href="/admin/reservas" className="adm-btn adm-btn-outline adm-btn-sm">
            <Clock size={14} />
            <span>Central de Reservas</span>
          </Link>
        </div>
      </div>

      {/* Cards de Indicadores Rápidos */}
      <div className="adm-kpi-grid">
        <div
          className="adm-kpi-card"
          style={{ cursor: "pointer" }}
          onClick={() => setActiveTab("operacional")}
        >
          <div className="adm-kpi-header">
            <span>Cancelamentos em Aberto</span>
            <AlertTriangle size={18} color="#c2410c" />
          </div>
          <div className="adm-kpi-value" style={{ color: "#c2410c" }}>
            {openReservationCancellationsCount}
          </div>
          <div className="adm-kpi-desc">Aguardando confirmação do fornecedor</div>
        </div>

        <div
          className="adm-kpi-card"
          style={{ cursor: "pointer" }}
          onClick={() => setActiveTab("creditos")}
        >
          <div className="adm-kpi-header">
            <span>Saldo em Créditos de Clientes</span>
            <Sparkles size={18} color="#b45309" />
          </div>
          <div className="adm-kpi-value" style={{ color: "#b45309" }}>
            R$ {availableCreditsTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </div>
          <div className="adm-kpi-desc">Disponível para abatimento em novos tours</div>
        </div>

        <div
          className="adm-kpi-card"
          style={{ cursor: "pointer" }}
          onClick={() => setActiveTab("reembolsos")}
        >
          <div className="adm-kpi-header">
            <span>Reembolsos em Andamento</span>
            <Clock size={18} color="var(--adm-wine)" />
          </div>
          <div className="adm-kpi-value">
            R$ {pendingRefundsTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </div>
          <div className="adm-kpi-desc">Solicitados ou em análise de aprovação</div>
        </div>

        <div
          className="adm-kpi-card"
          style={{ cursor: "pointer" }}
          onClick={() => setActiveTab("reembolsos")}
        >
          <div className="adm-kpi-header">
            <span>Reembolsos Efetivamente Pagos</span>
            <CheckCheck size={18} color="#15803d" />
          </div>
          <div className="adm-kpi-value" style={{ color: "#15803d" }}>
            R$ {paidRefundsTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </div>
          <div className="adm-kpi-desc">Devoluções liquidadas com comprovante</div>
        </div>
      </div>

      {/* Navegação por Abas */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "2px solid var(--adm-border)", paddingBottom: "2px", flexWrap: "wrap" }}>
        <button
          type="button"
          className={`adm-btn adm-btn-sm ${activeTab === "operacional" ? "adm-btn-wine" : "adm-btn-outline"}`}
          onClick={() => setActiveTab("operacional")}
        >
          <Car size={14} />
          <span>Cancelamentos Operacionais ({reservations.filter((r) => r.status === "cancelada" || r.cancellation_status !== "nenhum").length})</span>
        </button>

        <button
          type="button"
          className={`adm-btn adm-btn-sm ${activeTab === "contratual" ? "adm-btn-wine" : "adm-btn-outline"}`}
          onClick={() => setActiveTab("contratual")}
        >
          <FileText size={14} />
          <span>Cancelamentos de Contratos ({contracts.filter((c) => c.status === "cancelado").length})</span>
        </button>

        <button
          type="button"
          className={`adm-btn adm-btn-sm ${activeTab === "creditos" ? "adm-btn-wine" : "adm-btn-outline"}`}
          onClick={() => setActiveTab("creditos")}
        >
          <Sparkles size={14} />
          <span>Créditos de Clientes ({credits.length})</span>
        </button>

        <button
          type="button"
          className={`adm-btn adm-btn-sm ${activeTab === "reembolsos" ? "adm-btn-wine" : "adm-btn-outline"}`}
          onClick={() => setActiveTab("reembolsos")}
        >
          <RotateCcw size={14} />
          <span>Reembolsos ({refunds.length})</span>
        </button>

        {isAdmin && (
          <button
            type="button"
            className={`adm-btn adm-btn-sm ${activeTab === "fornecedores" ? "adm-btn-wine" : "adm-btn-outline"}`}
            onClick={() => setActiveTab("fornecedores")}
          >
            <Building size={14} />
            <span>Recuperações Fornecedores ({supplierRecoveries.length})</span>
          </button>
        )}

        <button
          type="button"
          className={`adm-btn adm-btn-sm ${activeTab === "impacto" ? "adm-btn-wine" : "adm-btn-outline"}`}
          onClick={() => setActiveTab("impacto")}
        >
          <DollarSign size={14} />
          <span>Impacto Financeiro Consolidado</span>
        </button>
      </div>

      {/* Conteúdo da Aba 1: Cancelamentos Operacionais */}
      {activeTab === "operacional" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="adm-card" style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h3 style={{ fontSize: "16px", color: "var(--adm-wine)" }}>Reservas Operacionais e Solicitações de Cancelamento</h3>
              <p style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                Cancele passeios individuais sem afetar os outros itens do contrato. Prepare o envio de mensagem ao fornecedor via WhatsApp.
              </p>
            </div>
            <div className="adm-search-input" style={{ width: "300px" }}>
              <Search size={15} color="var(--adm-clay)" />
              <input
                type="text"
                placeholder="Buscar cliente, passeio ou contrato..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="adm-table-container">
            <div className="adm-table-responsive">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Data Passeio</th>
                    <th>Passeio / Serviço</th>
                    <th>Cliente & Contrato</th>
                    <th>Fornecedor</th>
                    <th>Status da Reserva</th>
                    <th>Status Cancelamento</th>
                    <th>Multa Aplicada</th>
                    <th style={{ textAlign: "right" }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations
                    .filter((r) => {
                      if (!searchTerm) return true;
                      const q = searchTerm.toLowerCase();
                      return (
                        r.product_name?.toLowerCase().includes(q) ||
                        r.client_name?.toLowerCase().includes(q) ||
                        r.contracts?.contract_number?.toLowerCase().includes(q) ||
                        r.supplier_name?.toLowerCase().includes(q)
                      );
                    })
                    .map((r) => {
                      const isCancelled = r.status === "cancelada";
                      const isCancelRequested = r.status === "cancelamento_solicitado" || r.cancellation_status === "aguardando_fornecedor";

                      return (
                        <tr key={r.id} style={{ background: isCancelled ? "rgba(254, 242, 242, 0.4)" : undefined }}>
                          <td>
                            <div style={{ fontWeight: 700, fontSize: "14px" }}>
                              {new Date(r.tour_date + "T12:00:00").toLocaleDateString("pt-BR")}
                            </div>
                            <div style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>
                              {r.pickup_time ? `Pickup: ${r.pickup_time}` : "Sem horário"}
                            </div>
                          </td>

                          <td>
                            <strong style={{ fontSize: "13px", color: "var(--adm-wine)" }}>{r.product_name}</strong>
                            {r.voucher_ref && (
                              <div style={{ fontSize: "10px", color: "var(--adm-clay)" }}>
                                Voucher: {r.voucher_ref}
                              </div>
                            )}
                          </td>

                          <td>
                            <div style={{ fontWeight: 600 }}>{r.client_name || r.contracts?.client_name}</div>
                            <div style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>
                              Contrato {r.contracts?.contract_number}
                            </div>
                          </td>

                          <td>
                            <span style={{ fontSize: "13px" }}>{r.supplier_name || "A definir"}</span>
                          </td>

                          <td>
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                padding: "2px 8px",
                                borderRadius: "6px",
                                background: isCancelled ? "#fee2e2" : isCancelRequested ? "#fef3c7" : "#dcfce7",
                                color: isCancelled ? "#b91c1c" : isCancelRequested ? "#b45309" : "#15803d",
                              }}
                            >
                              {r.status}
                            </span>
                          </td>

                          <td>
                            <span style={{ fontSize: "12px", fontWeight: 600 }}>
                              {r.cancellation_status || "nenhum"}
                            </span>
                            {r.cancellation_reason && (
                              <div style={{ fontSize: "10px", color: "var(--adm-text-muted)", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.cancellation_reason}>
                                {r.cancellation_reason}
                              </div>
                            )}
                          </td>

                          <td>
                            {Number(r.penalty_amount || 0) > 0 ? (
                              <strong style={{ color: "#b91c1c", fontSize: "12px" }}>
                                {r.cost_currency || "USD"} {Number(r.penalty_amount).toFixed(2)}
                              </strong>
                            ) : (
                              <span style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>Sem multa</span>
                            )}
                          </td>

                          <td style={{ textAlign: "right" }}>
                            <div style={{ display: "inline-flex", gap: "6px" }}>
                              {/* Botão WhatsApp Fornecedor */}
                              <button
                                type="button"
                                className="adm-btn adm-btn-icon adm-btn-outline adm-btn-sm"
                                title="Enviar mensagem de cancelamento ao fornecedor"
                                onClick={() => handleOpenSupplierWhatsAppModal(r)}
                              >
                                <MessageSquare size={13} color="#15803d" />
                              </button>

                              {!isCancelled && (
                                <button
                                  type="button"
                                  className="adm-btn adm-btn-outline adm-btn-sm"
                                  style={{ color: "#b91c1c", borderColor: "#fca5a5" }}
                                  onClick={() => handleOpenResCancelModal(r, "solicitar")}
                                >
                                  <span>Solicitar</span>
                                </button>
                              )}

                              {isCancelRequested && isAdmin && (
                                <button
                                  type="button"
                                  className="adm-btn adm-btn-wine adm-btn-sm"
                                  onClick={() => handleOpenResCancelModal(r, "confirmar")}
                                >
                                  <span>Confirmar</span>
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
        </div>
      )}

      {/* Conteúdo da Aba 2: Cancelamentos Contratuais */}
      {activeTab === "contratual" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="adm-card" style={{ padding: "16px 20px" }}>
            <h3 style={{ fontSize: "16px", color: "var(--adm-wine)" }}>Cancelamentos Contratuais Completos</h3>
            <p style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
              O cancelamento de contrato avalia todos os recebimentos do cliente, passeios executados e pagamentos a fornecedores antes de ser confirmado. Nenhum contrato é excluído fisicamente.
            </p>
          </div>

          <div className="adm-table-container">
            <div className="adm-table-responsive">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Contrato</th>
                    <th>Cliente</th>
                    <th>Valor Total</th>
                    <th>Valor Pago</th>
                    <th>Status</th>
                    <th>Cancelamento</th>
                    <th style={{ textAlign: "right" }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((c) => {
                    const isCancelled = c.status === "cancelado";
                    return (
                      <tr key={c.id} style={{ background: isCancelled ? "rgba(254, 242, 242, 0.4)" : undefined }}>
                        <td>
                          <strong>{c.contract_number}</strong>
                          <div style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>
                            {new Date(c.created_at).toLocaleDateString("pt-BR")}
                          </div>
                        </td>

                        <td>
                          <div style={{ fontWeight: 600 }}>{c.client_name}</div>
                          <div style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>{c.client_phone || "Sem telefone"}</div>
                        </td>

                        <td>
                          <strong>
                            {c.currency || "BRL"} {Number(c.total_amount || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </strong>
                        </td>

                        <td>
                          <span style={{ color: Number(c.client_paid_amount || 0) > 0 ? "var(--adm-wine)" : "var(--adm-text-muted)", fontWeight: 600 }}>
                            {c.currency || "BRL"} {Number(c.client_paid_amount || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                        </td>

                        <td>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              padding: "2px 8px",
                              borderRadius: "6px",
                              background: isCancelled ? "#fee2e2" : "#dcfce7",
                              color: isCancelled ? "#b91c1c" : "#15803d",
                            }}
                          >
                            {c.status}
                          </span>
                        </td>

                        <td>
                          {isCancelled ? (
                            <div>
                              <div style={{ fontSize: "11px", color: "#b91c1c", fontWeight: 700 }}>
                                Cancelado em {c.cancelled_at ? new Date(c.cancelled_at).toLocaleDateString("pt-BR") : "—"}
                              </div>
                              <div style={{ fontSize: "10px", color: "var(--adm-text-muted)" }}>{c.cancellation_reason}</div>
                            </div>
                          ) : (
                            <span style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>Ativo</span>
                          )}
                        </td>

                        <td style={{ textAlign: "right" }}>
                          {!isCancelled && isAdmin ? (
                            <button
                              type="button"
                              className="adm-btn adm-btn-outline adm-btn-sm"
                              style={{ color: "#b91c1c", borderColor: "#fca5a5" }}
                              onClick={() => handleOpenContractCancelModal(c)}
                            >
                              <span>Cancelar Contrato</span>
                            </button>
                          ) : (
                            <Link href={`/admin/contratos?search=${c.contract_number}`} className="adm-btn adm-btn-outline adm-btn-sm">
                              <Eye size={13} />
                              <span>Ver</span>
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo da Aba 3: Créditos de Clientes */}
      {activeTab === "creditos" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="adm-card" style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h3 style={{ fontSize: "16px", color: "var(--adm-wine)" }}>Créditos Disponíveis para Clientes</h3>
              <p style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                Créditos gerados por cancelamentos ou ajustes. O saldo remanescente pode ser abatido em novos contratos sem duplicidade.
              </p>
            </div>
            {isAdmin && (
              <button
                type="button"
                className="adm-btn adm-btn-wine adm-btn-sm"
                onClick={() => setCreditGrantModal((prev) => ({ ...prev, open: true }))}
              >
                <Plus size={14} />
                <span>Emitir Crédito Manual</span>
              </button>
            )}
          </div>

          <div className="adm-table-container">
            <div className="adm-table-responsive">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Data Emissão</th>
                    <th>Cliente</th>
                    <th>Contrato Origem</th>
                    <th>Valor Concedido</th>
                    <th>Saldo Atual</th>
                    <th>Status</th>
                    <th>Motivo</th>
                    <th style={{ textAlign: "right" }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {credits.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "var(--adm-text-muted)" }}>
                        Nenhum crédito de cliente cadastrado até o momento.
                      </td>
                    </tr>
                  ) : (
                    credits.map((cr) => {
                      const isExpired = isClientCreditExpired(cr);
                      const effectiveStatus = getEffectiveCreditStatus(cr);

                      return (
                        <tr key={cr.id}>
                          <td>{new Date(cr.created_at).toLocaleDateString("pt-BR")}</td>
                          <td>
                            <strong>{cr.client_name || "Cliente"}</strong>
                          </td>
                          <td>{cr.contract_number || "Geral"}</td>
                          <td>
                            {cr.currency} {Number(cr.amount).toFixed(2)}
                          </td>
                          <td>
                            <strong style={{ color: Number(cr.balance) > 0 && !isExpired ? "#15803d" : "var(--adm-text-muted)" }}>
                              {cr.currency} {Number(cr.balance).toFixed(2)}
                            </strong>
                          </td>
                          <td>
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                padding: "2px 8px",
                                borderRadius: "6px",
                                background:
                                  effectiveStatus === "disponivel"
                                    ? "#dcfce7"
                                    : effectiveStatus === "utilizado"
                                    ? "#f1f5f9"
                                    : effectiveStatus === "expirado"
                                    ? "#fee2e2"
                                    : "#fef3c7",
                                color:
                                  effectiveStatus === "disponivel"
                                    ? "#15803d"
                                    : effectiveStatus === "utilizado"
                                    ? "#475569"
                                    : effectiveStatus === "expirado"
                                    ? "#b91c1c"
                                    : "#b45309",
                              }}
                            >
                              {effectiveStatus}
                            </span>
                            {cr.expires_at && (
                              <div
                                style={{
                                  fontSize: "10px",
                                  marginTop: "2px",
                                  color: isExpired ? "#b91c1c" : "var(--adm-text-muted)",
                                  fontWeight: isExpired ? 600 : 400,
                                }}
                              >
                                {isExpired ? "Venceu: " : "Vence: "}
                                {new Date(cr.expires_at + "T12:00:00").toLocaleDateString("pt-BR")}
                              </div>
                            )}
                          </td>
                          <td style={{ fontSize: "12px", color: "var(--adm-text-muted)", maxWidth: "220px" }}>
                            {cr.reason}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            {Number(cr.balance) > 0 && !isExpired && isAdmin && (
                              <button
                                type="button"
                                className="adm-btn adm-btn-outline adm-btn-sm"
                                onClick={() => handleOpenCreditUseModal(cr)}
                              >
                                <span>Abater em Contrato</span>
                              </button>
                            )}
                            {isExpired && (
                              <span style={{ fontSize: "11px", color: "#b91c1c", fontWeight: 600 }}>
                                Expirado
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo da Aba 4: Reembolsos de Clientes */}
      {activeTab === "reembolsos" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="adm-card" style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h3 style={{ fontSize: "16px", color: "var(--adm-wine)" }}>Fluxo de Reembolsos de Clientes</h3>
              <p style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                Acompanhe e autorize devoluções financeiras com comprovantes bancários. Reembolsos aprovados são auditados separadamente dos pagamentos realizados.
              </p>
            </div>
            <button
              type="button"
              className="adm-btn adm-btn-wine adm-btn-sm"
              onClick={() => handleOpenRefundModal("solicitar")}
            >
              <Plus size={14} />
              <span>Solicitar Reembolso</span>
            </button>
          </div>

          <div className="adm-table-container">
            <div className="adm-table-responsive">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Data Solicitação</th>
                    <th>Contrato</th>
                    <th>Cliente</th>
                    <th>Valor</th>
                    <th>Status</th>
                    <th>Forma / Comprovante</th>
                    <th>Motivo</th>
                    <th style={{ textAlign: "right" }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {refunds.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "var(--adm-text-muted)" }}>
                        Nenhum reembolso registrado.
                      </td>
                    </tr>
                  ) : (
                    refunds.map((rf) => (
                      <tr key={rf.id}>
                        <td>{new Date(rf.requested_at).toLocaleDateString("pt-BR")}</td>
                        <td>{rf.contract_number || rf.contract_id?.slice(0, 8)}</td>
                        <td>{rf.client_name || "Cliente"}</td>
                        <td>
                          <strong>
                            {rf.currency} {Number(rf.amount).toFixed(2)}
                          </strong>
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              padding: "2px 8px",
                              borderRadius: "6px",
                              background: rf.status === "pago" ? "#dcfce7" : rf.status === "aprovado" ? "#e0e7ff" : "#fef3c7",
                              color: rf.status === "pago" ? "#15803d" : rf.status === "aprovado" ? "#4338ca" : "#b45309",
                            }}
                          >
                            {rf.status}
                          </span>
                        </td>
                        <td>
                          {rf.status === "pago" ? (
                            <div>
                              <strong style={{ fontSize: "12px" }}>{rf.payment_method?.toUpperCase()}</strong>
                              <div style={{ fontSize: "10px", color: "var(--adm-text-muted)" }}>Ref: {rf.payment_reference || "S/Ref"}</div>
                            </div>
                          ) : (
                            <span style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>Aguardando pagamento</span>
                          )}
                        </td>
                        <td style={{ fontSize: "12px", color: "var(--adm-text-muted)", maxWidth: "200px" }}>{rf.reason}</td>
                        <td style={{ textAlign: "right" }}>
                          {rf.status === "solicitado" && isAdmin && (
                            <button
                              type="button"
                              className="adm-btn adm-btn-outline adm-btn-sm"
                              onClick={() => handleOpenRefundModal("aprovar", rf)}
                            >
                              <span>Aprovar</span>
                            </button>
                          )}
                          {rf.status === "aprovado" && isAdmin && (
                            <button
                              type="button"
                              className="adm-btn adm-btn-wine adm-btn-sm"
                              onClick={() => handleOpenRefundModal("pagar", rf)}
                            >
                              <span>Registrar Pagamento</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo da Aba 5: Recuperações de Fornecedores (Admin) */}
      {activeTab === "fornecedores" && isAdmin && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="adm-card" style={{ padding: "16px 20px" }}>
            <h3 style={{ fontSize: "16px", color: "var(--adm-wine)" }}>Recuperação de Valores com Fornecedores</h3>
            <p style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
              Acompanhe reembolsos prometidos, créditos em conta de operadora e multas aplicadas por fornecedores na moeda nativa (USD / MXN).
            </p>
          </div>

          <div className="adm-table-container">
            <div className="adm-table-responsive">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Fornecedor</th>
                    <th>Passeio / Reserva</th>
                    <th>Tipo de Resolução</th>
                    <th>Valor Original</th>
                    <th>Multa Aplicada</th>
                    <th>Valor Recuperado</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {supplierRecoveries.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "var(--adm-text-muted)" }}>
                        Nenhuma recuperação de fornecedor registrada até o momento.
                      </td>
                    </tr>
                  ) : (
                    supplierRecoveries.map((rec) => (
                      <tr key={rec.id}>
                        <td>
                          <strong>{rec.supplier_name || "Fornecedor"}</strong>
                        </td>
                        <td>{rec.product_name || "Passeio"}</td>
                        <td>
                          <span style={{ fontSize: "12px", fontWeight: 600 }}>{rec.recovery_type}</span>
                        </td>
                        <td>
                          {rec.currency} {Number(rec.amount_original).toFixed(2)}
                        </td>
                        <td>
                          <span style={{ color: Number(rec.penalty_amount) > 0 ? "#b91c1c" : "var(--adm-text-muted)", fontWeight: 600 }}>
                            {rec.currency} {Number(rec.penalty_amount).toFixed(2)}
                          </span>
                        </td>
                        <td>
                          <strong style={{ color: "#15803d" }}>
                            {rec.currency} {Number(rec.recovered_amount).toFixed(2)}
                          </strong>
                        </td>
                        <td>
                          <span style={{ fontSize: "11px", fontWeight: 700 }}>{rec.status}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo da Aba 6: Painel de Impacto Financeiro Consolidado */}
      {activeTab === "impacto" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="adm-card" style={{ padding: "16px 20px" }}>
            <h3 style={{ fontSize: "16px", color: "var(--adm-wine)" }}>Demonstrativo de Impacto Financeiro Segregado por Moeda</h3>
            <p style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
              Conforme as diretrizes financeiras, cada moeda é totalizada de forma independente (BRL, USD e MXN nunca são somadas).
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
            {Object.values(financialImpact).map((impact) => (
              <div key={impact.currency} className="adm-card" style={{ padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid var(--adm-wine)", paddingBottom: "8px", marginBottom: "14px" }}>
                  <span style={{ fontSize: "18px", fontWeight: 800, color: "var(--adm-wine)" }}>
                    Moeda: {impact.currency}
                  </span>
                  <span className="adm-badge" style={{ fontSize: "11px" }}>
                    Nativo {impact.currency}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--adm-text-muted)" }}>Total em Contratos:</span>
                    <strong>{impact.currency} {impact.totalContracted.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--adm-text-muted)" }}>Total Recebido de Clientes:</span>
                    <strong style={{ color: "var(--adm-wine)" }}>
                      {impact.currency} {impact.totalReceived.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </strong>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px dashed var(--adm-border)", paddingTop: "8px" }}>
                    <span style={{ color: "var(--adm-text-muted)" }}>Créditos Concedidos:</span>
                    <span>{impact.currency} {impact.totalCreditsGranted.toFixed(2)}</span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--adm-text-muted)" }}>Saldo de Créditos Ativo:</span>
                    <strong style={{ color: "#b45309" }}>{impact.currency} {impact.totalCreditsBalance.toFixed(2)}</strong>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px dashed var(--adm-border)", paddingTop: "8px" }}>
                    <span style={{ color: "var(--adm-text-muted)" }}>Reembolsos Solicitados:</span>
                    <span>{impact.currency} {impact.totalRefundsRequested.toFixed(2)}</span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--adm-text-muted)" }}>Reembolsos Efetivamente Pagos:</span>
                    <strong style={{ color: "#b91c1c" }}>- {impact.currency} {impact.totalRefundsPaid.toFixed(2)}</strong>
                  </div>

                  {isAdmin && (
                    <div style={{ borderTop: "1px solid var(--adm-border)", paddingTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--adm-text-muted)" }}>Pago a Fornecedores:</span>
                        <span>{impact.currency} {impact.totalSupplierPaid.toFixed(2)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--adm-text-muted)" }}>Multas de Fornecedores:</span>
                        <span style={{ color: "#b91c1c" }}>{impact.currency} {impact.totalSupplierPenalties.toFixed(2)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--adm-text-muted)" }}>Recuperado de Fornecedores:</span>
                        <span style={{ color: "#15803d" }}>+{impact.currency} {impact.totalSupplierRecovered.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  <div style={{ borderTop: "2px solid var(--adm-wine)", paddingTop: "10px", display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: 800 }}>
                    <span>Posição Líquida Cliente:</span>
                    <span style={{ color: impact.clientNetPosition >= 0 ? "#15803d" : "#b91c1c" }}>
                      {impact.currency} {impact.clientNetPosition.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAIS OPERACIONAIS E FINANCEIROS
         ========================================================================= */}

      {/* Modal 1: Cancelamento Operacional de Reserva */}
      {resCancelModal.open && (
        <div className="adm-modal-backdrop" onClick={() => setResCancelModal((prev) => ({ ...prev, open: false }))}>
          <div className="adm-modal-card" style={{ maxWidth: "540px" }} onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSaveResCancellation}>
              <div className="adm-modal-header">
                <div>
                  <span className="admin-brand-tag">CANCELAMENTO OPERACIONAL</span>
                  <h3 style={{ fontSize: "18px", marginTop: "2px" }}>
                    {resCancelModal.actionType === "solicitar"
                      ? "Solicitar Cancelamento de Passeio"
                      : resCancelModal.actionType === "confirmar"
                      ? "Confirmar Cancelamento com Fornecedor"
                      : "Recusar Cancelamento"}
                  </h3>
                  <span style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                    {resCancelModal.reservation?.product_name} · Cliente {resCancelModal.reservation?.client_name}
                  </span>
                </div>
                <button type="button" className="adm-btn adm-btn-icon adm-btn-outline" onClick={() => setResCancelModal((prev) => ({ ...prev, open: false }))}>
                  <X size={16} />
                </button>
              </div>

              <div className="adm-modal-body" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--adm-text-muted)", marginBottom: "4px" }}>
                    MOTIVO DO CANCELAMENTO (OBRIGATÓRIO)
                  </label>
                  <textarea
                    className="adm-input"
                    rows={3}
                    style={{ width: "100%" }}
                    placeholder="Ex: Cliente solicitou cancelamento por motivos de saúde..."
                    required
                    value={resCancelModal.reason}
                    onChange={(e) => setResCancelModal((prev) => ({ ...prev, reason: e.target.value }))}
                  />
                </div>

                {resCancelModal.actionType === "confirmar" && isAdmin && (
                  <>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--adm-text-muted)", marginBottom: "4px" }}>
                        MULTA COBRADA PELO FORNECEDOR ({resCancelModal.reservation?.cost_currency || "USD"})
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="adm-input"
                        style={{ width: "100%" }}
                        placeholder="0.00 se sem custo"
                        value={resCancelModal.penaltyAmount}
                        onChange={(e) => setResCancelModal((prev) => ({ ...prev, penaltyAmount: Number(e.target.value) }))}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--adm-text-muted)", marginBottom: "4px" }}>
                        RESPOSTA FORMAL DO FORNECEDOR / PROTOCOLO
                      </label>
                      <input
                        type="text"
                        className="adm-input"
                        style={{ width: "100%" }}
                        placeholder="Ex: Cancelado sem ônus perante protocolo CAN-881"
                        value={resCancelModal.supplierResponse}
                        onChange={(e) => setResCancelModal((prev) => ({ ...prev, supplierResponse: e.target.value }))}
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="adm-modal-footer">
                <button type="button" className="adm-btn adm-btn-outline adm-btn-sm" onClick={() => setResCancelModal((prev) => ({ ...prev, open: false }))}>
                  <span>Voltar</span>
                </button>

                <button type="submit" className="adm-btn adm-btn-wine adm-btn-sm" disabled={resCancelModal.submitting}>
                  <Check size={14} />
                  <span>{resCancelModal.submitting ? "Processando..." : "Salvar Registro"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: WhatsApp Fornecedor Cancelamento */}
      {supplierWaModal.open && (
        <div className="adm-modal-backdrop" onClick={() => setSupplierWaModal((prev) => ({ ...prev, open: false }))}>
          <div className="adm-modal-card" style={{ maxWidth: "580px" }} onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <div>
                <span className="admin-brand-tag" style={{ color: "#15803d" }}>MENSAGEM AO FORNECEDOR</span>
                <h3 style={{ fontSize: "18px", marginTop: "2px" }}>Solicitar Cancelamento via WhatsApp</h3>
              </div>
              <button type="button" className="adm-btn adm-btn-icon adm-btn-outline" onClick={() => setSupplierWaModal((prev) => ({ ...prev, open: false }))}>
                <X size={16} />
              </button>
            </div>

            <div className="adm-modal-body" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "10px 14px", borderRadius: "8px", fontSize: "12px", color: "#166534" }}>
                Esta mensagem contém apenas os dados operacionais da reserva e o motivo. Custos e valores de venda não são incluídos.
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--adm-text-muted)", marginBottom: "4px" }}>
                  WHATSAPP / TELEFONE DO FORNECEDOR
                </label>
                <input
                  type="text"
                  className="adm-input"
                  style={{ width: "100%" }}
                  value={supplierWaModal.targetPhone}
                  onChange={(e) => setSupplierWaModal((prev) => ({ ...prev, targetPhone: e.target.value }))}
                />
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--adm-text-muted)" }}>MENSAGEM PREPARADA</label>
                  <button
                    type="button"
                    className="adm-btn adm-btn-outline adm-btn-sm"
                    style={{ fontSize: "11px", padding: "2px 8px" }}
                    onClick={() => {
                      navigator.clipboard.writeText(supplierWaModal.messageText);
                      setSupplierWaModal((prev) => ({ ...prev, copied: true }));
                      setTimeout(() => setSupplierWaModal((prev) => ({ ...prev, copied: false })), 2000);
                    }}
                  >
                    {supplierWaModal.copied ? <Check size={12} /> : <MessageSquare size={12} />}
                    <span>{supplierWaModal.copied ? "Copiado!" : "Copiar"}</span>
                  </button>
                </div>
                <textarea
                  className="adm-input"
                  rows={8}
                  style={{ width: "100%", fontFamily: "monospace", fontSize: "12px" }}
                  value={supplierWaModal.messageText}
                  onChange={(e) => setSupplierWaModal((prev) => ({ ...prev, messageText: e.target.value }))}
                />
              </div>

              <div style={{ background: "var(--adm-surface-alt)", padding: "10px 14px", borderRadius: "8px", fontSize: "12px", color: "var(--adm-text-muted)" }}>
                <strong>Regra:</strong> Abrir o WhatsApp não confirma o cancelamento. Confirme o status apenas após retorno formal do fornecedor.
              </div>
            </div>

            <div className="adm-modal-footer">
              <button type="button" className="adm-btn adm-btn-outline adm-btn-sm" onClick={() => setSupplierWaModal((prev) => ({ ...prev, open: false }))}>
                <span>Fechar</span>
              </button>

              <button
                type="button"
                className="adm-btn adm-btn-wine adm-btn-sm"
                onClick={() => {
                  const link = formatWhatsAppLink(supplierWaModal.targetPhone, supplierWaModal.messageText);
                  if (link) window.open(link, "_blank");
                }}
              >
                <Send size={14} />
                <span>Abrir no WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Análise Prévia de Cancelamento Contratual */}
      {contractCancelModal.open && contractCancelModal.summary && (
        <div className="adm-modal-backdrop" onClick={() => setContractCancelModal((prev) => ({ ...prev, open: false }))}>
          <div className="adm-modal-card" style={{ maxWidth: "620px" }} onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleConfirmContractCancellation}>
              <div className="adm-modal-header">
                <div>
                  <span className="admin-brand-tag" style={{ color: "#b91c1c" }}>CANCELAMENTO CONTRATUAL</span>
                  <h3 style={{ fontSize: "18px", marginTop: "2px" }}>
                    Análise Prévia · Contrato {contractCancelModal.summary.contractNumber}
                  </h3>
                  <span style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                    Cliente: <strong>{contractCancelModal.summary.clientName}</strong>
                  </span>
                </div>
                <button type="button" className="adm-btn adm-btn-icon adm-btn-outline" onClick={() => setContractCancelModal((prev) => ({ ...prev, open: false }))}>
                  <X size={16} />
                </button>
              </div>

              <div className="adm-modal-body" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {/* Avisos Importantes */}
                {contractCancelModal.summary.warnings.length > 0 && (
                  <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", padding: "12px", borderRadius: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#c2410c", fontWeight: 700, fontSize: "13px" }}>
                      <AlertTriangle size={15} />
                      <span>Avisos de Integridade Financeira:</span>
                    </div>
                    <ul style={{ margin: "6px 0 0 20px", padding: 0, fontSize: "12px", color: "#9a3412" }}>
                      {contractCancelModal.summary.warnings.map((w, idx) => (
                        <li key={idx} style={{ marginTop: "2px" }}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--adm-text-muted)", marginBottom: "4px" }}>
                    MOTIVO DO CANCELAMENTO DO CONTRATO (OBRIGATÓRIO)
                  </label>
                  <textarea
                    className="adm-input"
                    rows={3}
                    style={{ width: "100%" }}
                    required
                    placeholder="Descreva o motivo formal do cancelamento do contrato..."
                    value={contractCancelModal.reason}
                    onChange={(e) => setContractCancelModal((prev) => ({ ...prev, reason: e.target.value }))}
                  />
                </div>

                {/* Resolução do Saldo Pago pelo Cliente */}
                {contractCancelModal.summary.paidAmount > 0 && (
                  <div style={{ background: "var(--adm-surface-alt)", padding: "12px", borderRadius: "8px", border: "1px solid var(--adm-border)" }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--adm-wine)", marginBottom: "6px" }}>
                      DESTINO DO VALOR PAGO PELO CLIENTE ({contractCancelModal.summary.currency} {contractCancelModal.summary.paidAmount.toFixed(2)})
                    </label>
                    <select
                      className="adm-input"
                      style={{ width: "100%", marginBottom: "8px" }}
                      value={contractCancelModal.clientResolution}
                      onChange={(e) => setContractCancelModal((prev) => ({ ...prev, clientResolution: e.target.value as any }))}
                    >
                      <option value="nenhuma">Não gerar crédito nem reembolso imediato (reter valor)</option>
                      <option value="conceder_credito">Conceder Crédito em favor do Cliente para futuras viagens</option>
                      <option value="solicitar_reembolso">Solicitar Reembolso / Devolução Financeira</option>
                    </select>

                    {contractCancelModal.clientResolution !== "nenhuma" && (
                      <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--adm-text-muted)", marginBottom: "2px" }}>
                          VALOR A REPASSAR ({contractCancelModal.summary.currency})
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          className="adm-input"
                          style={{ width: "100%" }}
                          value={contractCancelModal.resolutionAmount}
                          onChange={(e) => setContractCancelModal((prev) => ({ ...prev, resolutionAmount: Number(e.target.value) }))}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="adm-modal-footer">
                <button type="button" className="adm-btn adm-btn-outline adm-btn-sm" onClick={() => setContractCancelModal((prev) => ({ ...prev, open: false }))}>
                  <span>Cancelar Operação</span>
                </button>

                <button type="submit" className="adm-btn adm-btn-wine adm-btn-sm" disabled={contractCancelModal.submitting}>
                  <Check size={14} />
                  <span>{contractCancelModal.submitting ? "Processando..." : "Confirmar Cancelamento"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Concessão Manual de Crédito */}
      {creditGrantModal.open && (
        <div className="adm-modal-backdrop" onClick={() => setCreditGrantModal((prev) => ({ ...prev, open: false }))}>
          <div className="adm-modal-card" style={{ maxWidth: "520px" }} onClick={(e) => e.stopPropagation()}>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setCreditGrantModal((prev) => ({ ...prev, submitting: true }));
                try {
                  const selectedC = contracts.find((c) => c.id === creditGrantModal.contractId);
                  const cliId = selectedC?.client_id || creditGrantModal.clientId;

                  try {
                    await supabase.rpc("grant_client_credit", {
                      p_client_id: cliId,
                      p_contract_id: creditGrantModal.contractId || null,
                      p_amount: creditGrantModal.amount,
                      p_currency: creditGrantModal.currency,
                      p_reason: creditGrantModal.reason,
                      p_notes: creditGrantModal.notes,
                    });
                  } catch (rpcErr) {
                    await supabase.from("client_credits").insert({
                      client_id: cliId,
                      contract_id: creditGrantModal.contractId || null,
                      amount: creditGrantModal.amount,
                      currency: creditGrantModal.currency,
                      balance: creditGrantModal.amount,
                      reason: creditGrantModal.reason,
                      status: "disponivel",
                      created_by_name: profile?.fullName || "Admin",
                      notes: creditGrantModal.notes,
                    });
                  }

                  showToast("Crédito concedido com sucesso!");
                  setCreditGrantModal((prev) => ({ ...prev, open: false, submitting: false }));
                  fetchAllData();
                } catch (err: any) {
                  showToast("Erro ao conceder crédito: " + err.message, "error");
                  setCreditGrantModal((prev) => ({ ...prev, submitting: false }));
                }
              }}
            >
              <div className="adm-modal-header">
                <div>
                  <span className="admin-brand-tag">CRÉDITO DE CLIENTE</span>
                  <h3 style={{ fontSize: "18px", marginTop: "2px" }}>Emitir Crédito para Cliente</h3>
                </div>
                <button type="button" className="adm-btn adm-btn-icon adm-btn-outline" onClick={() => setCreditGrantModal((prev) => ({ ...prev, open: false }))}>
                  <X size={16} />
                </button>
              </div>

              <div className="adm-modal-body" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--adm-text-muted)", marginBottom: "4px" }}>
                    CONTRATO DE ORIGEM (OPCIONAL)
                  </label>
                  <select
                    className="adm-input"
                    style={{ width: "100%" }}
                    value={creditGrantModal.contractId}
                    onChange={(e) => setCreditGrantModal((prev) => ({ ...prev, contractId: e.target.value }))}
                  >
                    <option value="">Selecione um contrato...</option>
                    {contracts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.contract_number} — {c.client_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--adm-text-muted)", marginBottom: "4px" }}>
                      VALOR DO CRÉDITO
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="adm-input"
                      style={{ width: "100%" }}
                      required
                      value={creditGrantModal.amount}
                      onChange={(e) => setCreditGrantModal((prev) => ({ ...prev, amount: Number(e.target.value) }))}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--adm-text-muted)", marginBottom: "4px" }}>
                      MOEDA
                    </label>
                    <select
                      className="adm-input"
                      style={{ width: "100%" }}
                      value={creditGrantModal.currency}
                      onChange={(e) => setCreditGrantModal((prev) => ({ ...prev, currency: e.target.value }))}
                    >
                      <option value="BRL">BRL (R$)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--adm-text-muted)", marginBottom: "4px" }}>
                    MOTIVO DO CRÉDITO
                  </label>
                  <textarea
                    className="adm-input"
                    rows={3}
                    style={{ width: "100%" }}
                    required
                    placeholder="Ex: Cancelamento de passeio Chichén Itzá..."
                    value={creditGrantModal.reason}
                    onChange={(e) => setCreditGrantModal((prev) => ({ ...prev, reason: e.target.value }))}
                  />
                </div>
              </div>

              <div className="adm-modal-footer">
                <button type="button" className="adm-btn adm-btn-outline adm-btn-sm" onClick={() => setCreditGrantModal((prev) => ({ ...prev, open: false }))}>
                  <span>Cancelar</span>
                </button>
                <button type="submit" className="adm-btn adm-btn-wine adm-btn-sm" disabled={creditGrantModal.submitting}>
                  <Check size={14} />
                  <span>{creditGrantModal.submitting ? "Gravando..." : "Emitir Crédito"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 5: Utilização de Crédito */}
      {creditUseModal.open && creditUseModal.credit && (
        <div className="adm-modal-backdrop" onClick={() => setCreditUseModal((prev) => ({ ...prev, open: false }))}>
          <div className="adm-modal-card" style={{ maxWidth: "520px" }} onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleApplyCredit}>
              <div className="adm-modal-header">
                <div>
                  <span className="admin-brand-tag">UTILIZAR CRÉDITO</span>
                  <h3 style={{ fontSize: "18px", marginTop: "2px" }}>Abater Crédito em Contrato</h3>
                  <span style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                    Saldo disponível: <strong>{creditUseModal.credit.currency} {creditUseModal.credit.balance.toFixed(2)}</strong>
                  </span>
                </div>
                <button type="button" className="adm-btn adm-btn-icon adm-btn-outline" onClick={() => setCreditUseModal((prev) => ({ ...prev, open: false }))}>
                  <X size={16} />
                </button>
              </div>

              <div className="adm-modal-body" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--adm-text-muted)", marginBottom: "4px" }}>
                    CONTRATO DE DESTINO
                  </label>
                  <select
                    className="adm-input"
                    style={{ width: "100%" }}
                    required
                    value={creditUseModal.destinationContractId}
                    onChange={(e) => setCreditUseModal((prev) => ({ ...prev, destinationContractId: e.target.value }))}
                  >
                    <option value="">Selecione o contrato para abater o crédito...</option>
                    {contracts
                      .filter((c) => c.status !== "cancelado" && (c.currency || "BRL") === creditUseModal.credit?.currency)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.contract_number} — {c.client_name} (Saldo: {c.currency} {c.balance_amount})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--adm-text-muted)", marginBottom: "4px" }}>
                    VALOR A ABATER ({creditUseModal.credit.currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    max={creditUseModal.credit.balance}
                    className="adm-input"
                    style={{ width: "100%" }}
                    required
                    value={creditUseModal.amountToUse}
                    onChange={(e) => setCreditUseModal((prev) => ({ ...prev, amountToUse: Number(e.target.value) }))}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--adm-text-muted)", marginBottom: "4px" }}>
                    OBSERVAÇÕES
                  </label>
                  <input
                    type="text"
                    className="adm-input"
                    style={{ width: "100%" }}
                    placeholder="Ex: Abatimento referente a cancelamento anterior..."
                    value={creditUseModal.notes}
                    onChange={(e) => setCreditUseModal((prev) => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </div>

              <div className="adm-modal-footer">
                <button type="button" className="adm-btn adm-btn-outline adm-btn-sm" onClick={() => setCreditUseModal((prev) => ({ ...prev, open: false }))}>
                  <span>Cancelar</span>
                </button>
                <button type="submit" className="adm-btn adm-btn-wine adm-btn-sm" disabled={creditUseModal.submitting}>
                  <Check size={14} />
                  <span>{creditUseModal.submitting ? "Aplicando..." : "Confirmar Abatimento"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 6: Ações de Reembolso (Solicitar / Aprovar / Pagar) */}
      {refundActionModal.open && (
        <div className="adm-modal-backdrop" onClick={() => setRefundActionModal((prev) => ({ ...prev, open: false }))}>
          <div className="adm-modal-card" style={{ maxWidth: "540px" }} onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleProcessRefund}>
              <div className="adm-modal-header">
                <div>
                  <span className="admin-brand-tag">REEMBOLSO DE CLIENTE</span>
                  <h3 style={{ fontSize: "18px", marginTop: "2px" }}>
                    {refundActionModal.mode === "solicitar"
                      ? "Solicitar Reembolso"
                      : refundActionModal.mode === "aprovar"
                      ? "Aprovar Reembolso"
                      : "Registrar Pagamento do Reembolso"}
                  </h3>
                </div>
                <button type="button" className="adm-btn adm-btn-icon adm-btn-outline" onClick={() => setRefundActionModal((prev) => ({ ...prev, open: false }))}>
                  <X size={16} />
                </button>
              </div>

              <div className="adm-modal-body" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {refundActionModal.mode === "solicitar" && (
                  <>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--adm-text-muted)", marginBottom: "4px" }}>
                        CONTRATO VINCULADO
                      </label>
                      <select
                        className="adm-input"
                        style={{ width: "100%" }}
                        required
                        value={refundActionModal.contractId}
                        onChange={(e) => setRefundActionModal((prev) => ({ ...prev, contractId: e.target.value }))}
                      >
                        <option value="">Selecione o contrato...</option>
                        {contracts.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.contract_number} — {c.client_name} (Pago: {c.currency} {c.client_paid_amount})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--adm-text-muted)", marginBottom: "4px" }}>
                          VALOR A DEVOLVER
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          className="adm-input"
                          style={{ width: "100%" }}
                          required
                          value={refundActionModal.amount}
                          onChange={(e) => setRefundActionModal((prev) => ({ ...prev, amount: Number(e.target.value) }))}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--adm-text-muted)", marginBottom: "4px" }}>
                          MOEDA
                        </label>
                        <select
                          className="adm-input"
                          style={{ width: "100%" }}
                          value={refundActionModal.currency}
                          onChange={(e) => setRefundActionModal((prev) => ({ ...prev, currency: e.target.value }))}
                        >
                          <option value="BRL">BRL (R$)</option>
                          <option value="USD">USD ($)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--adm-text-muted)", marginBottom: "4px" }}>
                        MOTIVO DO REEMBOLSO
                      </label>
                      <textarea
                        className="adm-input"
                        rows={3}
                        style={{ width: "100%" }}
                        required
                        value={refundActionModal.reason}
                        onChange={(e) => setRefundActionModal((prev) => ({ ...prev, reason: e.target.value }))}
                      />
                    </div>
                  </>
                )}

                {refundActionModal.mode === "aprovar" && (
                  <div style={{ background: "var(--adm-surface-alt)", padding: "14px", borderRadius: "8px", fontSize: "13px" }}>
                    <p>
                      Confirma a <strong>aprovação</strong> da solicitação de reembolso no valor de{" "}
                      <strong>
                        {refundActionModal.currency} {refundActionModal.amount.toFixed(2)}
                      </strong>{" "}
                      para o cliente?
                    </p>
                    <p style={{ fontSize: "11px", color: "var(--adm-text-muted)", marginTop: "4px" }}>
                      A aprovação autoriza o financeiro a efetuar o pagamento. O valor só será considerado liquidado após o registro do comprovante bancário.
                    </p>
                  </div>
                )}

                {refundActionModal.mode === "pagar" && (
                  <>
                    <div style={{ background: "var(--adm-surface-alt)", padding: "12px", borderRadius: "8px", fontSize: "13px", marginBottom: "4px" }}>
                      Valor a pagar:{" "}
                      <strong style={{ color: "var(--adm-wine)", fontSize: "15px" }}>
                        {refundActionModal.currency} {refundActionModal.amount.toFixed(2)}
                      </strong>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--adm-text-muted)", marginBottom: "4px" }}>
                        FORMA DE PAGAMENTO DO REEMBOLSO
                      </label>
                      <select
                        className="adm-input"
                        style={{ width: "100%" }}
                        value={refundActionModal.paymentMethod}
                        onChange={(e) => setRefundActionModal((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                      >
                        <option value="pix">PIX</option>
                        <option value="transferencia">Transferência Bancária (TED/DOC)</option>
                        <option value="estorno_cartao">Estorno no Cartão de Crédito</option>
                        <option value="wise">Wise / Internacional</option>
                        <option value="especie">Espécie</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--adm-text-muted)", marginBottom: "4px" }}>
                        REFERÊNCIA / ID DA TRANSAÇÃO / COMPROVANTE
                      </label>
                      <input
                        type="text"
                        className="adm-input"
                        style={{ width: "100%" }}
                        required
                        placeholder="Ex: ID Pix E123456789... ou NSU 98213"
                        value={refundActionModal.paymentReference}
                        onChange={(e) => setRefundActionModal((prev) => ({ ...prev, paymentReference: e.target.value }))}
                      />
                    </div>
                  </>
                )}

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--adm-text-muted)", marginBottom: "4px" }}>
                    NOTAS ADICIONAIS
                  </label>
                  <input
                    type="text"
                    className="adm-input"
                    style={{ width: "100%" }}
                    placeholder="Observações internas..."
                    value={refundActionModal.notes}
                    onChange={(e) => setRefundActionModal((prev) => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </div>

              <div className="adm-modal-footer">
                <button type="button" className="adm-btn adm-btn-outline adm-btn-sm" onClick={() => setRefundActionModal((prev) => ({ ...prev, open: false }))}>
                  <span>Cancelar</span>
                </button>
                <button type="submit" className="adm-btn adm-btn-wine adm-btn-sm" disabled={refundActionModal.submitting}>
                  <Check size={14} />
                  <span>
                    {refundActionModal.submitting
                      ? "Processando..."
                      : refundActionModal.mode === "solicitar"
                      ? "Gravar Solicitação"
                      : refundActionModal.mode === "aprovar"
                      ? "Aprovar Reembolso"
                      : "Registrar Pagamento"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
