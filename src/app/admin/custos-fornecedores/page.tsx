"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Truck,
  Users,
  Search,
  Printer,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  Receipt,
  Tag,
  Building2,
  FileText
} from "lucide-react";

interface SupplierCostItem {
  id: string;
  contract_id: string;
  contract_number: string;
  client_name: string;
  tour_name: string;
  tour_date: string;
  adults_count: number;
  children_count: number;
  cost_applied: number;
  cost_currency: string;
  calculated_total_cost: number;
  cost_status: string;
  voucher_ref?: string;
  supplier_id: string;
  supplier_name: string;
}

interface Supplier {
  id: string;
  name: string;
  trade_name?: string;
  currency_default: string;
  payment_terms?: string;
}

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function AdminSupplierCostsPage() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth()); // 0-indexed
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("all");
  const [costItems, setCostItems] = useState<SupplierCostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Carregar Fornecedores
      const { data: suppData } = await supabase
        .from("suppliers")
        .select("id, name, trade_name, currency_default, payment_terms")
        .order("name", { ascending: true });

      if (suppData) {
        setSuppliers(suppData);
      }

      // 2. Carregar Itens de Contrato no Mês (Data do Passeio)
      const firstDay = new Date(selectedYear, selectedMonth, 1).toISOString().split("T")[0];
      const lastDay = new Date(selectedYear, selectedMonth + 1, 0).toISOString().split("T")[0];

      const { data: itemsData, error } = await supabase
        .from("contract_items")
        .select(`
          id,
          contract_id,
          supplier_id,
          tour_name_snapshot,
          supplier_name_snapshot,
          tour_date,
          adults_count,
          children_count,
          cost_applied,
          cost_currency,
          calculated_total_cost,
          cost_status,
          voucher_ref,
          contracts (
            contract_number,
            client_name
          )
        `)
        .gte("tour_date", firstDay)
        .lte("tour_date", lastDay)
        .order("tour_date", { ascending: true });

      if (error) {
        console.warn("Erro ao buscar custos de fornecedores:", error.message);
        setCostItems([]);
      } else if (itemsData) {
        setCostItems(
          itemsData.map((it: any) => ({
            id: it.id,
            contract_id: it.contract_id,
            contract_number: it.contracts?.contract_number || "—",
            client_name: it.contracts?.client_name || "Cliente",
            tour_name: it.tour_name_snapshot,
            tour_date: it.tour_date,
            adults_count: it.adults_count || 1,
            children_count: it.children_count || 0,
            cost_applied: Number(it.cost_applied || 0),
            cost_currency: it.cost_currency || "BRL",
            calculated_total_cost: Number(it.calculated_total_cost || it.cost_applied || 0),
            cost_status: it.cost_status || "calculado",
            voucher_ref: it.voucher_ref,
            supplier_id: it.supplier_id || "unassigned",
            supplier_name: it.supplier_name_snapshot || "Fornecedor não informado",
          }))
        );
      }
    } catch (err) {
      console.error("Erro geral:", err);
      setCostItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedYear, selectedMonth]);

  // Navegação de Mês
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  // Filtragem por Fornecedor e Busca
  const filteredItems = costItems.filter((item) => {
    const matchesSupplier =
      selectedSupplierId === "all" || item.supplier_id === selectedSupplierId;

    const term = searchTerm.toLowerCase();
    const matchesSearch =
      item.client_name.toLowerCase().includes(term) ||
      item.contract_number.toLowerCase().includes(term) ||
      item.tour_name.toLowerCase().includes(term) ||
      (item.voucher_ref && item.voucher_ref.toLowerCase().includes(term));

    return matchesSupplier && matchesSearch;
  });

  // Agrupamento de totais por moeda do fornecedor
  const totalsByCurrency: Record<string, number> = {};
  filteredItems.forEach((it) => {
    const curr = it.cost_currency || "BRL";
    totalsByCurrency[curr] = (totalsByCurrency[curr] || 0) + it.calculated_total_cost;
  });

  const totalPax = filteredItems.reduce((acc, it) => acc + (it.adults_count || 0) + (it.children_count || 0), 0);
  const totalIncomplete = filteredItems.filter((it) => it.cost_status === "incompleto_requer_revisao" || it.calculated_total_cost === 0).length;

  const currentSupplier = suppliers.find((s) => s.id === selectedSupplierId);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Cabeçalho */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <span className="admin-brand-tag">FINANCEIRO OPERACIONAL</span>
          <h2 style={{ fontSize: "28px", color: "var(--adm-wine)" }}>Custos por Fornecedor & Operador</h2>
          <p style={{ color: "var(--adm-text-muted)", fontSize: "14px", marginTop: "2px" }}>
            Totalização de serviços e custos calculados por competência da data do passeio.
          </p>
        </div>

        {/* Seletor de Período */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#fff", padding: "6px 10px", borderRadius: "12px", border: "1px solid var(--adm-border)" }}>
          <button
            type="button"
            className="adm-btn adm-btn-icon adm-btn-outline adm-btn-sm"
            onClick={handlePrevMonth}
            title="Mês Anterior"
          >
            <ChevronLeft size={16} />
          </button>

          <span style={{ fontWeight: 700, color: "var(--adm-wine)", minWidth: "150px", textAlign: "center", fontSize: "15px" }}>
            {MONTH_NAMES[selectedMonth]} {selectedYear}
          </span>

          <button
            type="button"
            className="adm-btn adm-btn-icon adm-btn-outline adm-btn-sm"
            onClick={handleNextMonth}
            title="Próximo Mês"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="adm-kpi-grid">
        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <span>Total a Pagar ({selectedSupplierId === "all" ? "Todos os Fornecedores" : currentSupplier?.name})</span>
            <DollarSign size={18} color="var(--adm-wine)" />
          </div>
          <div className="adm-kpi-value" style={{ fontSize: "22px" }}>
            {Object.keys(totalsByCurrency).length === 0 ? (
              "R$ 0"
            ) : (
              Object.entries(totalsByCurrency).map(([curr, val]) => (
                <div key={curr}>
                  {curr} {val.toLocaleString("pt-BR")}
                </div>
              ))
            )}
          </div>
          <div className="adm-kpi-desc">Custo calculado para os passeios no mês</div>
        </div>

        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <span>Passageiros Atendidos</span>
            <Users size={18} color="var(--adm-blue)" />
          </div>
          <div className="adm-kpi-value">{totalPax}</div>
          <div className="adm-kpi-desc">Pessoas nos serviços operados</div>
        </div>

        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <span>Serviços / Passeios</span>
            <Receipt size={18} color="var(--adm-emerald)" />
          </div>
          <div className="adm-kpi-value">{filteredItems.length}</div>
          <div className="adm-kpi-desc">Linhas de passeios no período</div>
        </div>

        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <span>Requer Revisão</span>
            <AlertCircle size={18} color={totalIncomplete > 0 ? "var(--adm-rose)" : "var(--adm-text-muted)"} />
          </div>
          <div className="adm-kpi-value" style={{ color: totalIncomplete > 0 ? "var(--adm-rose)" : "inherit" }}>
            {totalIncomplete}
          </div>
          <div className="adm-kpi-desc">Serviços sem custo definido</div>
        </div>
      </div>

      {/* Abas e Filtros de Fornecedor */}
      <div className="adm-card" style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: "260px" }}>
            <Search size={18} color="var(--adm-clay)" />
            <input
              type="text"
              className="adm-input"
              style={{ width: "100%", maxWidth: "380px" }}
              placeholder="Buscar por cliente, contrato, passeio ou voucher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              className="adm-btn adm-btn-outline adm-btn-sm"
              onClick={() => window.print()}
            >
              <Printer size={14} />
              <span>Imprimir Extrato</span>
            </button>
          </div>
        </div>

        {/* Abas de Seleção de Fornecedor */}
        <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px", borderTop: "1px solid var(--adm-border)", paddingTop: "12px" }}>
          <button
            type="button"
            className={`adm-btn adm-btn-sm ${selectedSupplierId === "all" ? "adm-btn-clay" : "adm-btn-outline"}`}
            onClick={() => setSelectedSupplierId("all")}
          >
            <span>Todos os Fornecedores</span>
            <span style={{ fontSize: "10px", background: "rgba(0,0,0,0.15)", padding: "1px 6px", borderRadius: "99px", marginLeft: "4px" }}>
              {costItems.length}
            </span>
          </button>

          {suppliers.map((s) => {
            const countForSup = costItems.filter((i) => i.supplier_id === s.id).length;
            const isSelected = selectedSupplierId === s.id;

            return (
              <button
                key={s.id}
                type="button"
                className={`adm-btn adm-btn-sm ${isSelected ? "adm-btn-clay" : "adm-btn-outline"}`}
                onClick={() => setSelectedSupplierId(s.id)}
              >
                <span>{s.trade_name || s.name}</span>
                {countForSup > 0 && (
                  <span
                    style={{
                      fontSize: "10px",
                      background: isSelected ? "rgba(255,255,255,0.25)" : "var(--adm-clay-faded)",
                      color: isSelected ? "#fff" : "var(--adm-clay)",
                      padding: "1px 6px",
                      borderRadius: "99px",
                      marginLeft: "4px",
                      fontWeight: 700
                    }}
                  >
                    {countForSup}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabela de Extrato de Custos */}
      {loading ? (
        <div className="adm-card" style={{ padding: "60px 20px", textAlign: "center" }}>
          <Clock size={28} className="animate-spin" color="var(--adm-clay)" style={{ margin: "0 auto 12px" }} />
          <p style={{ color: "var(--adm-text-muted)" }}>Calculando custos de fornecedores...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="adm-card" style={{ padding: "60px 20px", textAlign: "center" }}>
          <Truck size={38} color="var(--adm-clay)" style={{ margin: "0 auto 12px", opacity: 0.5 }} />
          <h3>Nenhum serviço registrado para o fornecedor em {MONTH_NAMES[selectedMonth]} de {selectedYear}</h3>
          <p style={{ color: "var(--adm-text-muted)", fontSize: "14px", marginTop: "4px" }}>
            Os passeios cadastrados nos contratos com data de realização neste mês aparecerão aqui automaticamente.
          </p>
        </div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Data do Passeio</th>
                <th>Fornecedor</th>
                <th>Passeio</th>
                <th>Cliente / Contrato</th>
                <th>PAX</th>
                <th>Voucher / Ref</th>
                <th>Custo Unitário</th>
                <th style={{ textAlign: "right" }}>Custo Total</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const tourDateObj = new Date(item.tour_date + "T12:00:00");
                const dayOfWeek = tourDateObj.toLocaleDateString("pt-BR", { weekday: "short" });

                return (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: "var(--adm-wine)" }}>
                        {tourDateObj.toLocaleDateString("pt-BR")}
                      </div>
                      <div style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--adm-clay)", fontWeight: 700 }}>
                        {dayOfWeek}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, color: "var(--adm-text-main)" }}>{item.supplier_name}</div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, color: "var(--adm-wine)" }}>{item.tour_name}</div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600 }}>{item.client_name}</div>
                      <Link
                        href="/admin/contratos"
                        style={{ fontSize: "11px", color: "var(--adm-clay)", textDecoration: "none", fontWeight: 600 }}
                      >
                        {item.contract_number}
                      </Link>
                    </td>

                    <td>
                      <span style={{ fontSize: "13px", fontWeight: 600 }}>
                        {item.adults_count} ad{item.children_count > 0 ? `, ${item.children_count} ch` : ""}
                      </span>
                    </td>

                    <td>
                      {item.voucher_ref ? (
                        <span style={{ fontSize: "12px", fontWeight: 600, background: "var(--adm-surface-alt)", padding: "2px 8px", borderRadius: "6px", border: "1px solid var(--adm-border)" }}>
                          {item.voucher_ref}
                        </span>
                      ) : (
                        <span style={{ fontSize: "11px", color: "var(--adm-text-subtle)" }}>A emitir</span>
                      )}
                    </td>

                    <td>
                      <span style={{ fontSize: "13px" }}>
                        {item.cost_currency} {Number(item.cost_applied || 0).toLocaleString("pt-BR")}
                      </span>
                    </td>

                    <td style={{ textAlign: "right" }}>
                      {item.calculated_total_cost > 0 ? (
                        <strong style={{ fontSize: "14px", color: "var(--adm-wine)" }}>
                          {item.cost_currency} {Number(item.calculated_total_cost).toLocaleString("pt-BR")}
                        </strong>
                      ) : (
                        <span className="adm-badge badge-rose" style={{ fontSize: "11px" }}>
                          Requer Revisão
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: "var(--adm-surface-alt)", fontWeight: 700 }}>
                <td colSpan={7} style={{ textAlign: "right", padding: "14px" }}>
                  TOTAL DO FORNECEDOR ({MONTH_NAMES[selectedMonth]}/{selectedYear}):
                </td>
                <td style={{ textAlign: "right", padding: "14px", fontSize: "16px", color: "var(--adm-wine)" }}>
                  {Object.entries(totalsByCurrency).map(([curr, val]) => (
                    <div key={curr}>
                      {curr} {val.toLocaleString("pt-BR")}
                    </div>
                  ))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
