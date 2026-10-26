"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuthProfile } from "@/lib/auth/AuthContext";
import AccessDenied from "@/components/admin/AccessDenied";
import {
  ClientReceivable,
  ClientPaymentEntry,
  SupplierPayable,
  SupplierPaymentEntry,
} from "@/types/operational";
import {
  calculateConsolidatedFinancialKpis,
  filterFinancialData,
  FinancialFilters,
  ConsolidatedFinancialSummary,
  CurrencyFinancialIndicator,
} from "@/lib/financial/consolidatedFinance";
import { formatReceivableCurrency } from "@/lib/financial/clientFinance";
import {
  BarChart3,
  DollarSign,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Receipt,
  Building2,
  Calendar,
  FileText,
  X,
  CreditCard,
  RefreshCw,
  AlertCircle,
  Eye,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  ArrowRightLeft,
  CalendarCheck,
  Percent,
  Wallet,
  Scale,
  Sparkles,
} from "lucide-react";

export default function AdminConsolidatedFinancePage() {
  const { role, loading: authLoading } = useAuthProfile();
  const isAdmin = role === "admin";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Raw data from Supabase
  const [contracts, setContracts] = useState<any[]>([]);
  const [clientEntries, setClientEntries] = useState<ClientPaymentEntry[]>([]);
  const [payables, setPayables] = useState<SupplierPayable[]>([]);
  const [supplierEntries, setSupplierEntries] = useState<SupplierPaymentEntry[]>([]);
  const [suppliersList, setSuppliersList] = useState<{ id: string; name: string }[]>([]);
  const [sellersList, setSellersList] = useState<string[]>([]);

  // Filtros
  const [filters, setFilters] = useState<FinancialFilters>({
    startDate: "",
    endDate: "",
    contractStatus: "todos",
    sellerName: "todos",
    supplierId: "todos",
    currency: "todas",
  });

  const [activeCurrencyTab, setActiveCurrencyTab] = useState<string>("TODAS");

  // Carregar dados reais existentes das tabelas oficiais
  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      // 1. Carregar Contratos
      const { data: contractsData, error: contractsError } = await supabase
        .from("contracts")
        .select(`
          id,
          contract_number,
          client_id,
          client_name,
          total_amount,
          currency,
          status,
          seller_name,
          created_at,
          due_date,
          client_paid_amount,
          client_payment_status,
          last_client_payment_at,
          finalized_at
        `)
        .order("created_at", { ascending: false });

      if (contractsError) {
        console.error("Erro ao carregar contratos:", contractsError);
      } else if (contractsData) {
        const mappedContracts = contractsData.map((c: any) => ({
          ...c,
          sale_date: c.finalized_at ? c.finalized_at.split("T")[0] : c.created_at ? c.created_at.split("T")[0] : null,
        }));
        setContracts(mappedContracts);

        // Extrair lista de vendedores
        const sellers = Array.from(
          new Set(
            contractsData
              .map((c: any) => c.seller_name)
              .filter((s: any): s is string => Boolean(s && s.trim().length > 0))
          )
        ).sort();
        setSellersList(sellers);
      }

      // 2. Carregar Lançamentos de Recebimentos de Clientes (client_payment_entries)
      const { data: clientEntriesData, error: clientEntriesError } = await supabase
        .from("client_payment_entries")
        .select("*")
        .order("payment_date", { ascending: false });

      if (clientEntriesError) {
        console.error("Erro ao carregar lançamentos de clientes:", clientEntriesError);
      } else if (clientEntriesData) {
        setClientEntries(clientEntriesData as ClientPaymentEntry[]);
      }

      // 3. Carregar Obrigações Financeiras com Fornecedores (supplier_payables)
      const { data: payablesData, error: payablesError } = await supabase
        .from("supplier_payables")
        .select(`
          id,
          contract_id,
          contract_item_id,
          supplier_id,
          service_date,
          description,
          currency,
          amount_estimated,
          amount_final,
          is_unknown_cost,
          payment_status,
          paid_amount,
          cost_approved_at,
          cost_approved_by,
          created_at,
          suppliers (
            id,
            name
          )
        `)
        .order("service_date", { ascending: false });

      if (payablesError) {
        console.error("Erro ao carregar contas a pagar:", payablesError);
      } else if (payablesData) {
        const mappedPayables: SupplierPayable[] = payablesData.map((p: any) => ({
          ...p,
          supplier_name: p.suppliers?.name || "Fornecedor",
        }));
        setPayables(mappedPayables);
      }

      // 4. Carregar Lançamentos de Pagamentos a Fornecedores (supplier_payment_entries)
      const { data: supplierEntriesData, error: supplierEntriesError } = await supabase
        .from("supplier_payment_entries")
        .select("*")
        .order("payment_date", { ascending: false });

      if (supplierEntriesError) {
        console.error("Erro ao carregar lançamentos de fornecedores:", supplierEntriesError);
      } else if (supplierEntriesData) {
        setSupplierEntries(supplierEntriesData as SupplierPaymentEntry[]);
      }

      // 5. Carregar Fornecedores para os filtros
      const { data: suppsData } = await supabase
        .from("suppliers")
        .select("id, name")
        .order("name", { ascending: true });

      if (suppsData) {
        setSuppliersList(suppsData);
      }
    } catch (err) {
      console.error("Erro fatal ao carregar dados consolidados:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchFinancialData();
    }
  }, [isAdmin]);

  // Aplicar filtros estruturados
  const filteredData = useMemo(() => {
    return filterFinancialData({
      contracts,
      clientEntries,
      payables,
      supplierEntries,
      filters,
    });
  }, [contracts, clientEntries, payables, supplierEntries, filters]);

  // Calcular KPIs consolidados
  const summary: ConsolidatedFinancialSummary = useMemo(() => {
    return calculateConsolidatedFinancialKpis({
      contracts: filteredData.filteredContracts,
      clientEntries: filteredData.filteredClientEntries,
      payables: filteredData.filteredPayables,
      supplierEntries: filteredData.filteredSupplierEntries,
    });
  }, [filteredData]);

  // Se estiver carregando autenticação
  if (authLoading) {
    return (
      <div className="admin-page-container" style={{ padding: "40px", textAlign: "center" }}>
        <p style={{ color: "var(--adm-text-muted)" }}>Verificando credenciais e autorização...</p>
      </div>
    );
  }

  // Se não for administrador, bloquear acesso estrito
  if (!isAdmin) {
    return (
      <AccessDenied
        currentRole={role || "seller"}
        pathname="/admin/financeiro"
        moduleName="Painel Financeiro Consolidado & Resultado Operacional"
      />
    );
  }

  // Atalhos de período
  const applyPeriodShortcut = (type: "this_month" | "last_month" | "last_90" | "this_year" | "all") => {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();

    if (type === "this_month") {
      const start = new Date(y, m, 1).toISOString().split("T")[0];
      const end = new Date(y, m + 1, 0).toISOString().split("T")[0];
      setFilters((prev) => ({ ...prev, startDate: start, endDate: end }));
    } else if (type === "last_month") {
      const start = new Date(y, m - 1, 1).toISOString().split("T")[0];
      const end = new Date(y, m, 0).toISOString().split("T")[0];
      setFilters((prev) => ({ ...prev, startDate: start, endDate: end }));
    } else if (type === "last_90") {
      const d = new Date();
      d.setDate(d.getDate() - 90);
      setFilters((prev) => ({
        ...prev,
        startDate: d.toISOString().split("T")[0],
        endDate: today.toISOString().split("T")[0],
      }));
    } else if (type === "this_year") {
      setFilters((prev) => ({
        ...prev,
        startDate: `${y}-01-01`,
        endDate: `${y}-12-31`,
      }));
    } else {
      setFilters((prev) => ({ ...prev, startDate: "", endDate: "" }));
    }
  };

  // Moedas disponíveis no resultado
  const activeCurrencies = summary.currencies.length > 0 ? summary.currencies : ["USD", "BRL", "MXN"];

  return (
    <div className="admin-page-container" style={{ padding: "28px 32px", maxWidth: "1600px", margin: "0 auto" }}>
      {/* ===================================================================== */}
      {/* CABEÇALHO BOUTIQUE & STATUS DE SEGURANÇA                              */}
      {/* ===================================================================== */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                padding: "3px 10px",
                borderRadius: "4px",
                background: "var(--adm-wine)",
                color: "#fff",
              }}
            >
              Exclusivo Diretoria
            </span>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--adm-emerald)",
                background: "var(--adm-emerald-bg)",
                padding: "3px 10px",
                borderRadius: "4px",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <ShieldCheck size={14} /> Dados Consolidados & Isolamento RBAC Ativo
            </span>
          </div>

          <h1 style={{ fontSize: "28px", color: "var(--adm-wine)", fontWeight: 700, margin: 0 }}>
            Painel Financeiro Consolidado & Resultado Operacional
          </h1>
          <p style={{ fontSize: "14px", color: "var(--adm-text-muted)", marginTop: "4px", margin: 0 }}>
            Visão unificada de vendas contratadas, recebimentos de clientes, obrigações a pagar e custos operacionais aprovados.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            onClick={() => {
              setRefreshing(true);
              fetchFinancialData();
            }}
            disabled={loading || refreshing}
            className="adm-btn"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "#fff",
              border: "1px solid var(--adm-border)",
              color: "var(--adm-wine)",
              padding: "9px 16px",
              borderRadius: "var(--adm-radius-sm)",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
            title="Atualizar dados financeiros"
          >
            <RefreshCw size={15} className={loading || refreshing ? "spin-animation" : ""} />
            Atualizar Indicadores
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* BARRA DE ATALHOS PARA DETALHAMENTO DOS MÓDULOS                        */}
      {/* ===================================================================== */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "14px",
          marginBottom: "24px",
        }}
      >
        <Link
          href="/admin/financeiro/clientes"
          style={{ textDecoration: "none" }}
          className="adm-nav-shortcut-card"
        >
          <div
            style={{
              background: "#fff",
              border: "1px solid var(--adm-border)",
              borderRadius: "var(--adm-radius-md)",
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: "var(--adm-shadow-sm)",
              transition: "transform 0.15s, border-color 0.15s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "8px",
                  background: "#dcfce7",
                  color: "#15803d",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <DollarSign size={20} />
              </div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--adm-wine)" }}>
                  Contas a Receber Clientes
                </div>
                <div style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                  Extratos de entradas & câmbio
                </div>
              </div>
            </div>
            <ChevronRight size={18} color="var(--adm-text-subtle)" />
          </div>
        </Link>

        <Link
          href="/admin/financeiro/fornecedores"
          style={{ textDecoration: "none" }}
          className="adm-nav-shortcut-card"
        >
          <div
            style={{
              background: "#fff",
              border: "1px solid var(--adm-border)",
              borderRadius: "var(--adm-radius-md)",
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: "var(--adm-shadow-sm)",
              transition: "transform 0.15s, border-color 0.15s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "8px",
                  background: "#fee2e2",
                  color: "#b91c1c",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Building2 size={20} />
              </div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--adm-wine)" }}>
                  Contas a Pagar Fornecedores
                </div>
                <div style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                  Aprovação de custos & saídas
                </div>
              </div>
            </div>
            <ChevronRight size={18} color="var(--adm-text-subtle)" />
          </div>
        </Link>

        <Link
          href="/admin/contratos"
          style={{ textDecoration: "none" }}
          className="adm-nav-shortcut-card"
        >
          <div
            style={{
              background: "#fff",
              border: "1px solid var(--adm-border)",
              borderRadius: "var(--adm-radius-md)",
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: "var(--adm-shadow-sm)",
              transition: "transform 0.15s, border-color 0.15s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "8px",
                  background: "#e0e7ff",
                  color: "#4338ca",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FileText size={20} />
              </div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--adm-wine)" }}>
                  Contratos da Agência
                </div>
                <div style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                  Vendas oficiais & clientes
                </div>
              </div>
            </div>
            <ChevronRight size={18} color="var(--adm-text-subtle)" />
          </div>
        </Link>

        <Link
          href="/admin/reservas"
          style={{ textDecoration: "none" }}
          className="adm-nav-shortcut-card"
        >
          <div
            style={{
              background: "#fff",
              border: "1px solid var(--adm-border)",
              borderRadius: "var(--adm-radius-md)",
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: "var(--adm-shadow-sm)",
              transition: "transform 0.15s, border-color 0.15s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "8px",
                  background: "#fef3c7",
                  color: "#b45309",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CalendarCheck size={20} />
              </div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--adm-wine)" }}>
                  Central Operacional
                </div>
                <div style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                  Reservas & vouchers
                </div>
              </div>
            </div>
            <ChevronRight size={18} color="var(--adm-text-subtle)" />
          </div>
        </Link>
      </div>

      {/* ===================================================================== */}
      {/* SEÇÃO DE FILTROS                                                      */}
      {/* ===================================================================== */}
      <div
        style={{
          background: "var(--adm-surface)",
          border: "1px solid var(--adm-border)",
          borderRadius: "var(--adm-radius-md)",
          padding: "20px 24px",
          marginBottom: "24px",
          boxShadow: "var(--adm-shadow-sm)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Filter size={18} color="var(--adm-wine)" />
            <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--adm-wine)" }}>
              Filtros Estruturados & Temporalidade por Operação
            </span>
          </div>

          {/* Atalhos Rápidos de Período */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "12px", color: "var(--adm-text-muted)", alignSelf: "center", marginRight: "4px" }}>
              Período:
            </span>
            <button
              onClick={() => applyPeriodShortcut("this_month")}
              className="adm-btn-tag"
              style={{
                fontSize: "12px",
                padding: "4px 10px",
                borderRadius: "4px",
                background: "var(--adm-bg)",
                border: "1px solid var(--adm-border)",
                cursor: "pointer",
              }}
            >
              Este Mês
            </button>
            <button
              onClick={() => applyPeriodShortcut("last_month")}
              className="adm-btn-tag"
              style={{
                fontSize: "12px",
                padding: "4px 10px",
                borderRadius: "4px",
                background: "var(--adm-bg)",
                border: "1px solid var(--adm-border)",
                cursor: "pointer",
              }}
            >
              Mês Anterior
            </button>
            <button
              onClick={() => applyPeriodShortcut("last_90")}
              className="adm-btn-tag"
              style={{
                fontSize: "12px",
                padding: "4px 10px",
                borderRadius: "4px",
                background: "var(--adm-bg)",
                border: "1px solid var(--adm-border)",
                cursor: "pointer",
              }}
            >
              Últimos 90 Dias
            </button>
            <button
              onClick={() => applyPeriodShortcut("this_year")}
              className="adm-btn-tag"
              style={{
                fontSize: "12px",
                padding: "4px 10px",
                borderRadius: "4px",
                background: "var(--adm-bg)",
                border: "1px solid var(--adm-border)",
                cursor: "pointer",
              }}
            >
              Este Ano
            </button>
            <button
              onClick={() => applyPeriodShortcut("all")}
              className="adm-btn-tag"
              style={{
                fontSize: "12px",
                padding: "4px 10px",
                borderRadius: "4px",
                background: "var(--adm-bg)",
                border: "1px solid var(--adm-border)",
                cursor: "pointer",
              }}
            >
              Todo o Histórico
            </button>
            {(filters.startDate || filters.endDate || filters.contractStatus !== "todos" || filters.sellerName !== "todos" || filters.supplierId !== "todos" || filters.currency !== "todas") && (
              <button
                onClick={() => {
                  setFilters({
                    startDate: "",
                    endDate: "",
                    contractStatus: "todos",
                    sellerName: "todos",
                    supplierId: "todos",
                    currency: "todas",
                  });
                  setActiveCurrencyTab("TODAS");
                }}
                className="adm-btn-tag"
                style={{
                  fontSize: "12px",
                  padding: "4px 10px",
                  borderRadius: "4px",
                  background: "#fee2e2",
                  border: "1px solid #fca5a5",
                  color: "#b91c1c",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
                title="Redefinir todos os filtros"
              >
                <X size={12} /> Limpar Filtros
              </button>
            )}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "14px",
          }}
        >
          {/* Data Inicial */}
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--adm-text-muted)", marginBottom: "4px" }}>
              Data Inicial (Venda/Movimento)
            </label>
            <input
              type="date"
              value={filters.startDate || ""}
              onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: "6px",
                border: "1px solid var(--adm-border)",
                fontSize: "13px",
              }}
            />
          </div>

          {/* Data Final */}
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--adm-text-muted)", marginBottom: "4px" }}>
              Data Final (Venda/Movimento)
            </label>
            <input
              type="date"
              value={filters.endDate || ""}
              onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: "6px",
                border: "1px solid var(--adm-border)",
                fontSize: "13px",
              }}
            />
          </div>

          {/* Status do Contrato */}
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--adm-text-muted)", marginBottom: "4px" }}>
              Status do Contrato
            </label>
            <select
              value={filters.contractStatus || "todos"}
              onChange={(e) => setFilters((prev) => ({ ...prev, contractStatus: e.target.value }))}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: "6px",
                border: "1px solid var(--adm-border)",
                fontSize: "13px",
                background: "#fff",
              }}
            >
              <option value="todos">Todos os Elegíveis</option>
              <option value="finalizado">Apenas Finalizados (Oficiais)</option>
              <option value="emitido">Emitidos</option>
              <option value="assinado">Assinados</option>
              <option value="concluido">Concluídos</option>
            </select>
          </div>

          {/* Vendedor */}
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--adm-text-muted)", marginBottom: "4px" }}>
              Vendedor
            </label>
            <select
              value={filters.sellerName || "todos"}
              onChange={(e) => setFilters((prev) => ({ ...prev, sellerName: e.target.value }))}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: "6px",
                border: "1px solid var(--adm-border)",
                fontSize: "13px",
                background: "#fff",
              }}
            >
              <option value="todos">Todos os Vendedores</option>
              {sellersList.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Fornecedor */}
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--adm-text-muted)", marginBottom: "4px" }}>
              Fornecedor (Custos)
            </label>
            <select
              value={filters.supplierId || "todos"}
              onChange={(e) => setFilters((prev) => ({ ...prev, supplierId: e.target.value }))}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: "6px",
                border: "1px solid var(--adm-border)",
                fontSize: "13px",
                background: "#fff",
              }}
            >
              <option value="todos">Todos os Fornecedores</option>
              {suppliersList.map((sup) => (
                <option key={sup.id} value={sup.id}>
                  {sup.name}
                </option>
              ))}
            </select>
          </div>

          {/* Moeda */}
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--adm-text-muted)", marginBottom: "4px" }}>
              Filtro de Moeda
            </label>
            <select
              value={filters.currency || "todas"}
              onChange={(e) => {
                const val = e.target.value;
                setFilters((prev) => ({ ...prev, currency: val }));
                if (val && val !== "todas") {
                  setActiveCurrencyTab(val);
                } else {
                  setActiveCurrencyTab("TODAS");
                }
              }}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: "6px",
                border: "1px solid var(--adm-border)",
                fontSize: "13px",
                background: "#fff",
              }}
            >
              <option value="todas">Todas as Moedas</option>
              <option value="USD">USD — Dólar Americano</option>
              <option value="BRL">BRL — Real Brasileiro</option>
              <option value="MXN">MXN — Peso Mexicano</option>
            </select>
          </div>
        </div>

        {/* Banner de status dos filtros ativos */}
        {(filters.startDate || filters.endDate || filters.contractStatus !== "todos" || filters.sellerName !== "todos" || filters.supplierId !== "todos" || filters.currency !== "todas") && (
          <div
            style={{
              marginTop: "14px",
              padding: "10px 14px",
              borderRadius: "6px",
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              fontSize: "12px",
              color: "#1e40af",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Filter size={15} color="#1d4ed8" />
              <span>
                <strong>Filtros ativos alterando os indicadores:</strong>
                {filters.startDate ? ` De ${filters.startDate}` : ""}
                {filters.endDate ? ` Até ${filters.endDate}` : ""}
                {filters.contractStatus !== "todos" ? ` · Status: ${filters.contractStatus}` : ""}
                {filters.sellerName !== "todos" ? ` · Vendedor: ${filters.sellerName}` : ""}
                {filters.supplierId !== "todos" ? ` · Fornecedor: ${suppliersList.find((s) => s.id === filters.supplierId)?.name || filters.supplierId}` : ""}
                {filters.currency !== "todas" ? ` · Moeda: ${filters.currency}` : ""}
                {" — Exibindo exclusivamente os dados do escopo filtrado."}
              </span>
            </div>
            <span style={{ fontSize: "11px", fontWeight: 700, background: "#dbeafe", padding: "2px 8px", borderRadius: "10px", color: "#1d4ed8" }}>
              {filteredData.filteredContracts.length} contratos · {filteredData.filteredPayables.length} obrigações
            </span>
          </div>
        )}

        {/* Nota explicativa de consistência temporal */}
        <div
          style={{
            marginTop: "12px",
            padding: "8px 12px",
            borderRadius: "6px",
            background: "var(--adm-bg)",
            border: "1px solid var(--adm-border)",
            fontSize: "12px",
            color: "var(--adm-text-muted)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Clock size={14} color="var(--adm-clay)" />
          <span>
            <strong>Temporalidade Coerente:</strong> Contratos são filtrados por data da venda; recebimentos de clientes por data da entrada financeira; obrigações a pagar por data da prestação do serviço; pagamentos a fornecedores por data do desembolso.
          </span>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* ALERTA DE CONSOLIDAÇÃO GLOBAL & REGRAS CAMBIAIS                       */}
      {/* ===================================================================== */}
      {summary.globalConsolidationStatus === "indisponivel" && (
        <div
          style={{
            background: "#fffbeb",
            border: "1px solid #fde68a",
            borderRadius: "var(--adm-radius-md)",
            padding: "16px 20px",
            marginBottom: "24px",
            display: "flex",
            alignItems: "flex-start",
            gap: "14px",
          }}
        >
          <Scale size={24} color="#b45309" style={{ flexShrink: 0, marginTop: "2px" }} />
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#92400e", marginBottom: "4px" }}>
              Segregação Cambial Estrita Ativa — Moedas Distintas
            </div>
            <div style={{ fontSize: "13px", color: "#78350f", lineHeight: "1.5" }}>
              {summary.globalConsolidationMessage}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SELETOR DE ABAS POR MOEDA                                             */}
      {/* ===================================================================== */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", borderBottom: "1px solid var(--adm-border)", paddingBottom: "12px" }}>
        <button
          onClick={() => setActiveCurrencyTab("TODAS")}
          style={{
            padding: "8px 18px",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
            border: "none",
            background: activeCurrencyTab === "TODAS" ? "var(--adm-wine)" : "transparent",
            color: activeCurrencyTab === "TODAS" ? "#fff" : "var(--adm-text-muted)",
          }}
        >
          Visão Geral (Todas as Moedas)
        </button>
        {activeCurrencies.map((curr) => (
          <button
            key={curr}
            onClick={() => setActiveCurrencyTab(curr)}
            style={{
              padding: "8px 18px",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              border: "none",
              background: activeCurrencyTab === curr ? "var(--adm-wine)" : "transparent",
              color: activeCurrencyTab === curr ? "#fff" : "var(--adm-text-muted)",
            }}
          >
            {curr} ({summary.byCurrency[curr]?.contractsEligibleCount || 0} contratos / {summary.byCurrency[curr]?.payablesCount || 0} obrigações)
          </button>
        ))}
      </div>

      {/* ===================================================================== */}
      {/* CARDS DE INDICADORES PRINCIPAIS POR MOEDA                             */}
      {/* ===================================================================== */}
      {activeCurrencies
        .filter((curr) => activeCurrencyTab === "TODAS" || activeCurrencyTab === curr)
        .map((curr) => {
          const ind = summary.byCurrency[curr];
          if (!ind) return null;

          const isUSD = curr === "USD";
          const isBRL = curr === "BRL";
          const isMXN = curr === "MXN";

          return (
            <div
              key={curr}
              style={{
                background: "#fff",
                border: "1px solid var(--adm-border)",
                borderRadius: "var(--adm-radius-md)",
                padding: "24px",
                marginBottom: "28px",
                boxShadow: "var(--adm-shadow-sm)",
              }}
            >
              {/* Header do Bloco da Moeda */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid var(--adm-border)",
                  paddingBottom: "14px",
                  marginBottom: "20px",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "6px",
                      background: isUSD ? "#dbeafe" : isBRL ? "#dcfce7" : "#ffedd5",
                      color: isUSD ? "#1d4ed8" : isBRL ? "#15803d" : "#c2410c",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: "13px",
                    }}
                  >
                    {curr}
                  </div>
                  <div>
                    <h2 style={{ fontSize: "18px", color: "var(--adm-wine)", margin: 0, fontWeight: 700 }}>
                      Consolidação Financeira em {curr}
                    </h2>
                    <span style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                      {ind.contractsEligibleCount} vendas elegíveis · {ind.payablesCount} compromissos com fornecedores
                    </span>
                  </div>
                </div>

                {/* Status do Resultado Operacional */}
                <div>
                  {ind.resultStatus === "consolidado" ? (
                    <span
                      style={{
                        padding: "5px 12px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: 700,
                        background: "#dcfce7",
                        color: "#15803d",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <CheckCircle2 size={14} /> Resultado Consolidado
                    </span>
                  ) : ind.resultStatus === "parcial_provisorio" ? (
                    <span
                      style={{
                        padding: "5px 12px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: 700,
                        background: "#fef3c7",
                        color: "#b45309",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <AlertTriangle size={14} /> Resultado Parcial / Custos Provisórios
                    </span>
                  ) : (
                    <span
                      style={{
                        padding: "5px 12px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: 600,
                        background: "#f3f4f6",
                        color: "#6b7280",
                      }}
                    >
                      Resultado Indisponível
                    </span>
                  )}
                </div>
              </div>

              {/* Grid de Métricas Principais da Moeda */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "16px",
                  marginBottom: "20px",
                }}
              >
                {/* 1. Total Contratado (Vendas) */}
                <div
                  style={{
                    background: "var(--adm-bg)",
                    border: "1px solid var(--adm-border)",
                    borderRadius: "var(--adm-radius-sm)",
                    padding: "16px",
                  }}
                >
                  <div style={{ fontSize: "12px", color: "var(--adm-text-muted)", fontWeight: 600, marginBottom: "4px" }}>
                    Total em Contratos Elegíveis
                  </div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--adm-wine)" }}>
                    {formatReceivableCurrency(ind.totalContracted, curr)}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--adm-text-subtle)", marginTop: "6px" }}>
                    {ind.contractsPaidCount} quitados · {ind.contractsPartialCount} parciais
                  </div>
                </div>

                {/* 2. Total Recebido de Clientes */}
                <div
                  style={{
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: "var(--adm-radius-sm)",
                    padding: "16px",
                  }}
                >
                  <div style={{ fontSize: "12px", color: "#166534", fontWeight: 600, marginBottom: "4px" }}>
                    Total Recebido de Clientes
                  </div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "#15803d" }}>
                    {formatReceivableCurrency(ind.totalReceivedFromClients, curr)}
                  </div>
                  <div style={{ fontSize: "11px", color: "#166534", marginTop: "6px" }}>
                    Amortizado nas vendas da agência
                  </div>
                </div>

                {/* 3. Saldo a Receber de Clientes */}
                <div
                  style={{
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    borderRadius: "var(--adm-radius-sm)",
                    padding: "16px",
                  }}
                >
                  <div style={{ fontSize: "12px", color: "#1e40af", fontWeight: 600, marginBottom: "4px" }}>
                    Saldo a Receber de Clientes
                  </div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "#1d4ed8" }}>
                    {formatReceivableCurrency(ind.totalPendingFromClients, curr)}
                  </div>
                  <div style={{ fontSize: "11px", color: "#1e40af", marginTop: "6px" }}>
                    {ind.contractsPendingCount} contratos sem recebimento
                  </div>
                </div>

                {/* 4. Total de Contas a Pagar a Fornecedores */}
                <div
                  style={{
                    background: "var(--adm-bg)",
                    border: "1px solid var(--adm-border)",
                    borderRadius: "var(--adm-radius-sm)",
                    padding: "16px",
                  }}
                >
                  <div style={{ fontSize: "12px", color: "var(--adm-text-muted)", fontWeight: 600, marginBottom: "4px" }}>
                    Total a Pagar a Fornecedores
                  </div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "#991b1b" }}>
                    {formatReceivableCurrency(ind.totalPayableEffective, curr)}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--adm-text-subtle)", marginTop: "6px" }}>
                    Aprovado: {formatReceivableCurrency(ind.totalPayableApproved, curr)}
                  </div>
                </div>

                {/* 5. Total Pago aos Fornecedores */}
                <div
                  style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: "var(--adm-radius-sm)",
                    padding: "16px",
                  }}
                >
                  <div style={{ fontSize: "12px", color: "#991b1b", fontWeight: 600, marginBottom: "4px" }}>
                    Total Pago aos Fornecedores
                  </div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "#b91c1c" }}>
                    {formatReceivableCurrency(ind.totalPaidToSuppliers, curr)}
                  </div>
                  <div style={{ fontSize: "11px", color: "#991b1b", marginTop: "6px" }}>
                    Líquido de estornos auditados
                  </div>
                </div>

                {/* 6. Saldo Pendente Fornecedores */}
                <div
                  style={{
                    background: "#fff7ed",
                    border: "1px solid #fed7aa",
                    borderRadius: "var(--adm-radius-sm)",
                    padding: "16px",
                  }}
                >
                  <div style={{ fontSize: "12px", color: "#9a3412", fontWeight: 600, marginBottom: "4px" }}>
                    Saldo Pendente com Fornecedores
                  </div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "#c2410c" }}>
                    {formatReceivableCurrency(ind.totalPendingToSuppliers, curr)}
                  </div>
                  <div style={{ fontSize: "11px", color: "#9a3412", marginTop: "6px" }}>
                    {ind.suppliersWithPendingCount} fornecedor(es) com pendências
                  </div>
                </div>
              </div>

              {/* Seção Destaque: Resultado Operacional por Competência vs Caixa Realizado */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                  gap: "16px",
                  background: "var(--adm-bg)",
                  border: "1px solid var(--adm-border)",
                  borderRadius: "var(--adm-radius-md)",
                  padding: "18px 20px",
                }}
              >
                {/* Resultado por Competência */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <Scale size={16} color="var(--adm-wine)" />
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--adm-wine)" }}>
                      Resultado Operacional por Competência ({curr})
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
                    <span
                      style={{
                        fontSize: "24px",
                        fontWeight: 900,
                        color:
                          (ind.accrualResultApproved || 0) >= 0 ? "var(--adm-emerald)" : "var(--adm-rose)",
                      }}
                    >
                      {formatReceivableCurrency(ind.accrualResultApproved, curr)}
                    </span>
                    {ind.marginPercentageApproved !== null && (
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "4px",
                          background:
                            ind.marginPercentageApproved >= 0 ? "var(--adm-emerald-bg)" : "var(--adm-rose-bg)",
                          color:
                            ind.marginPercentageApproved >= 0 ? "var(--adm-emerald)" : "var(--adm-rose)",
                        }}
                      >
                        {ind.marginPercentageApproved > 0 ? "+" : ""}
                        {ind.marginPercentageApproved.toFixed(1)}% Margem
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--adm-text-muted)", marginTop: "6px", lineHeight: "1.4" }}>
                    Receita Contratual ({formatReceivableCurrency(ind.totalContracted, curr)}) − Custos de Fornecedores Aprovados ({formatReceivableCurrency(ind.totalPayableApproved, curr)}).
                    {ind.awaitingApprovalCount > 0 && (
                      <span style={{ display: "block", color: "#b45309", marginTop: "4px", fontWeight: 600 }}>
                        ⚠️ {ind.awaitingApprovalCount} custo(s) aguardando aprovação final ({formatReceivableCurrency(ind.totalPayableEstimated, curr)} estimados).
                      </span>
                    )}
                    {ind.unknownCostCount > 0 && (
                      <span style={{ display: "block", color: "#b91c1c", marginTop: "4px", fontWeight: 600 }}>
                        ⚠️ {ind.unknownCostCount} custo(s) sob consulta (NULL) não tratados como zero.
                      </span>
                    )}
                  </div>
                </div>

                {/* Fluxo Financeiro Realizado */}
                <div style={{ borderLeft: "1px solid var(--adm-border)", paddingLeft: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <Wallet size={16} color="var(--adm-clay)" />
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--adm-clay)" }}>
                      Fluxo Financeiro Realizado em Caixa ({curr})
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
                    <span
                      style={{
                        fontSize: "24px",
                        fontWeight: 900,
                        color: ind.netCashFlowRealized >= 0 ? "#15803d" : "#b91c1c",
                      }}
                    >
                      {formatReceivableCurrency(ind.netCashFlowRealized, curr)}
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                      Superávit / Déficit Efetivo
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--adm-text-muted)", marginTop: "6px", lineHeight: "1.4" }}>
                    Entradas em Dinheiro ({formatReceivableCurrency(ind.cashReceivedRealized, curr)}) − Pagamentos a Fornecedores ({formatReceivableCurrency(ind.cashPaidRealized, curr)}).
                    <span style={{ display: "block", color: "var(--adm-text-subtle)", marginTop: "4px" }}>
                      Não confundir fluxo de caixa realizado com resultado econômico por competência.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

      {/* ===================================================================== */}
      {/* SEÇÃO DE ALERTAS E PENDÊNCIAS OPERACIONAIS                             */}
      {/* ===================================================================== */}
      <div
        style={{
          background: "#fff",
          border: "1px solid var(--adm-border)",
          borderRadius: "var(--adm-radius-md)",
          padding: "24px",
          marginBottom: "28px",
          boxShadow: "var(--adm-shadow-sm)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <AlertCircle size={20} color="var(--adm-wine)" />
          <h2 style={{ fontSize: "18px", color: "var(--adm-wine)", margin: 0, fontWeight: 700 }}>
            Alertas Financeiros & Pendências Críticas
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
          {/* Card Alerta 1: Contratos Parciais */}
          <div
            style={{
              padding: "16px",
              borderRadius: "8px",
              border: "1px solid #bfdbfe",
              background: "#eff6ff",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <Receipt size={16} color="#1d4ed8" />
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#1e40af" }}>
                Recebimentos Parciais em Aberto
              </span>
            </div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "#1d4ed8", margin: "4px 0" }}>
              {summary.totalPartialContracts} contrato(s)
            </div>
            <p style={{ fontSize: "12px", color: "#1e40af", margin: 0 }}>
              Contratos com adiantamento recebido aguardando liquidação integral do saldo.
            </p>
            <Link
              href="/admin/financeiro/clientes"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "12px",
                fontWeight: 600,
                color: "#1d4ed8",
                marginTop: "10px",
                textDecoration: "underline",
              }}
            >
              Ver contas a receber <ChevronRight size={14} />
            </Link>
          </div>

          {/* Card Alerta 2: Fornecedores com Pagamentos Pendentes */}
          <div
            style={{
              padding: "16px",
              borderRadius: "8px",
              border: "1px solid #fed7aa",
              background: "#fff7ed",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <Building2 size={16} color="#c2410c" />
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#9a3412" }}>
                Fornecedores com Saldo Pendente
              </span>
            </div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "#c2410c", margin: "4px 0" }}>
              {summary.totalSuppliersWithPending} fornecedor(es)
            </div>
            <p style={{ fontSize: "12px", color: "#9a3412", margin: 0 }}>
              Obrigações operacionais confirmadas com saldo pendente de pagamento.
            </p>
            <Link
              href="/admin/financeiro/fornecedores"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "12px",
                fontWeight: 600,
                color: "#c2410c",
                marginTop: "10px",
                textDecoration: "underline",
              }}
            >
              Liquidar compromissos <ChevronRight size={14} />
            </Link>
          </div>

          {/* Card Alerta 3: Custos Pendentes de Aprovação */}
          <div
            style={{
              padding: "16px",
              borderRadius: "8px",
              border: "1px solid #fde68a",
              background: "#fffbeb",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <Clock size={16} color="#b45309" />
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#92400e" }}>
                Custos Aguardando Aprovação
              </span>
            </div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "#b45309", margin: "4px 0" }}>
              {summary.totalAwaitingApprovalCosts} obrigação(ões)
            </div>
            <p style={{ fontSize: "12px", color: "#92400e", margin: 0 }}>
              Custos previstos aguardando homologação do montante final pela diretoria.
            </p>
            <Link
              href="/admin/financeiro/fornecedores"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "12px",
                fontWeight: 600,
                color: "#b45309",
                marginTop: "10px",
                textDecoration: "underline",
              }}
            >
              Aprovar custos finais <ChevronRight size={14} />
            </Link>
          </div>

          {/* Card Alerta 4: Custos Sob Consulta (NULL) */}
          <div
            style={{
              padding: "16px",
              borderRadius: "8px",
              border: "1px solid #fca5a5",
              background: "#fef2f2",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <AlertTriangle size={16} color="#b91c1c" />
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#991b1b" }}>
                Custos Desconhecidos / Sob Consulta
              </span>
            </div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "#b91c1c", margin: "4px 0" }}>
              {summary.totalUnknownCosts} passeio(s)
            </div>
            <p style={{ fontSize: "12px", color: "#991b1b", margin: 0 }}>
              Itens sem custo contratual pré-definido. Requer cotação junto ao receptivo.
            </p>
            <Link
              href="/admin/custos-fornecedores"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "12px",
                fontWeight: 600,
                color: "#b91c1c",
                marginTop: "10px",
                textDecoration: "underline",
              }}
            >
              Consultar tarifas <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* ORIGEM DOS VALORES: TABELAS SINTÉTICAS COM LINKS DIRETOS              */}
      {/* ===================================================================== */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(480px, 1fr))", gap: "24px" }}>
        {/* Painel Esquerdo: Vendas Elegíveis Recentes */}
        <div
          style={{
            background: "#fff",
            border: "1px solid var(--adm-border)",
            borderRadius: "var(--adm-radius-md)",
            padding: "20px 24px",
            boxShadow: "var(--adm-shadow-sm)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ fontSize: "16px", color: "var(--adm-wine)", fontWeight: 700, margin: 0 }}>
                Origem das Vendas Contratadas
              </h3>
              <span style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                Últimos contratos elegíveis do período
              </span>
            </div>
            <Link
              href="/admin/contratos"
              style={{ fontSize: "12px", fontWeight: 600, color: "var(--adm-wine)", textDecoration: "underline" }}
            >
              Ver todos ({filteredData.filteredContracts.length})
            </Link>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--adm-border)", textAlign: "left", color: "var(--adm-text-muted)" }}>
                  <th style={{ padding: "8px 6px" }}>Contrato</th>
                  <th style={{ padding: "8px 6px" }}>Cliente</th>
                  <th style={{ padding: "8px 6px" }}>Total</th>
                  <th style={{ padding: "8px 6px" }}>Recebido</th>
                  <th style={{ padding: "8px 6px" }}>Saldo</th>
                  <th style={{ padding: "8px 6px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.filteredContracts.slice(0, 5).map((c) => {
                  const tot = Number(c.total_amount || 0);
                  const paid = Number(c.client_paid_amount || 0);
                  const pend = Math.max(0, tot - paid);
                  return (
                    <tr key={c.id} style={{ borderBottom: "1px solid var(--adm-border)" }}>
                      <td style={{ padding: "10px 6px", fontWeight: 700, color: "var(--adm-wine)" }}>
                        {c.contract_number}
                      </td>
                      <td style={{ padding: "10px 6px", color: "var(--adm-text-main)" }}>
                        {c.client_name}
                      </td>
                      <td style={{ padding: "10px 6px", fontWeight: 700 }}>
                        {formatReceivableCurrency(tot, c.currency)}
                      </td>
                      <td style={{ padding: "10px 6px", color: "#15803d" }}>
                        {formatReceivableCurrency(paid, c.currency)}
                      </td>
                      <td style={{ padding: "10px 6px", color: pend > 0 ? "#b91c1c" : "var(--adm-text-muted)", fontWeight: pend > 0 ? 700 : 400 }}>
                        {formatReceivableCurrency(pend, c.currency)}
                      </td>
                      <td style={{ padding: "10px 6px" }}>
                        <span
                          style={{
                            fontSize: "11px",
                            padding: "2px 8px",
                            borderRadius: "12px",
                            background:
                              c.client_payment_status === "pago"
                                ? "#dcfce7"
                                : c.client_payment_status === "parcialmente_pago"
                                ? "#dbeafe"
                                : "#fef3c7",
                            color:
                              c.client_payment_status === "pago"
                                ? "#15803d"
                                : c.client_payment_status === "parcialmente_pago"
                                ? "#1d4ed8"
                                : "#b45309",
                            fontWeight: 700,
                          }}
                        >
                          {c.client_payment_status === "pago"
                            ? "Quitado"
                            : c.client_payment_status === "parcialmente_pago"
                            ? "Parcial"
                            : "Pendente"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {filteredData.filteredContracts.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: "20px", textAlign: "center", color: "var(--adm-text-muted)" }}>
                      Nenhum contrato localizado com os filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Painel Direito: Obrigações Recentes com Fornecedores */}
        <div
          style={{
            background: "#fff",
            border: "1px solid var(--adm-border)",
            borderRadius: "var(--adm-radius-md)",
            padding: "20px 24px",
            boxShadow: "var(--adm-shadow-sm)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ fontSize: "16px", color: "var(--adm-wine)", fontWeight: 700, margin: 0 }}>
                Origem das Contas a Pagar
              </h3>
              <span style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                Últimos compromissos operacionais com receptivos
              </span>
            </div>
            <Link
              href="/admin/financeiro/fornecedores"
              style={{ fontSize: "12px", fontWeight: 600, color: "var(--adm-wine)", textDecoration: "underline" }}
            >
              Ver todos ({filteredData.filteredPayables.length})
            </Link>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--adm-border)", textAlign: "left", color: "var(--adm-text-muted)" }}>
                  <th style={{ padding: "8px 6px" }}>Fornecedor</th>
                  <th style={{ padding: "8px 6px" }}>Serviço</th>
                  <th style={{ padding: "8px 6px" }}>Custo</th>
                  <th style={{ padding: "8px 6px" }}>Pago</th>
                  <th style={{ padding: "8px 6px" }}>Saldo</th>
                  <th style={{ padding: "8px 6px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.filteredPayables.slice(0, 5).map((p) => {
                  const hasFinal = p.amount_final !== null && p.amount_final !== undefined;
                  const cost = hasFinal ? Number(p.amount_final) : p.amount_estimated !== null && p.amount_estimated !== undefined ? Number(p.amount_estimated) : null;
                  const paid = Number(p.paid_amount || 0);
                  const pend = cost !== null ? Math.max(0, cost - paid) : null;

                  return (
                    <tr key={p.id} style={{ borderBottom: "1px solid var(--adm-border)" }}>
                      <td style={{ padding: "10px 6px", fontWeight: 700, color: "var(--adm-wine)" }}>
                        {p.supplier_name || "Fornecedor"}
                      </td>
                      <td style={{ padding: "10px 6px", color: "var(--adm-text-muted)" }}>
                        {p.description || "Passeio"}
                      </td>
                      <td style={{ padding: "10px 6px", fontWeight: 700 }}>
                        {cost !== null ? formatReceivableCurrency(cost, p.currency) : "Sob Consulta"}
                      </td>
                      <td style={{ padding: "10px 6px", color: "#b91c1c" }}>
                        {formatReceivableCurrency(paid, p.currency)}
                      </td>
                      <td style={{ padding: "10px 6px", color: (pend || 0) > 0 ? "#c2410c" : "var(--adm-text-muted)", fontWeight: (pend || 0) > 0 ? 700 : 400 }}>
                        {pend !== null ? formatReceivableCurrency(pend, p.currency) : "—"}
                      </td>
                      <td style={{ padding: "10px 6px" }}>
                        <span
                          style={{
                            fontSize: "11px",
                            padding: "2px 8px",
                            borderRadius: "12px",
                            background:
                              p.payment_status === "pago"
                                ? "#dcfce7"
                                : p.payment_status === "aprovado"
                                ? "#e0e7ff"
                                : p.payment_status === "parcialmente_pago"
                                ? "#dbeafe"
                                : "#fef3c7",
                            color:
                              p.payment_status === "pago"
                                ? "#15803d"
                                : p.payment_status === "aprovado"
                                ? "#4338ca"
                                : p.payment_status === "parcialmente_pago"
                                ? "#1d4ed8"
                                : "#b45309",
                            fontWeight: 700,
                          }}
                        >
                          {p.payment_status === "pago"
                            ? "Pago"
                            : p.payment_status === "aprovado"
                            ? "Aprovado"
                            : p.payment_status === "parcialmente_pago"
                            ? "Parcial"
                            : "Previsto"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {filteredData.filteredPayables.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: "20px", textAlign: "center", color: "var(--adm-text-muted)" }}>
                      Nenhuma conta a pagar localizada com os filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
