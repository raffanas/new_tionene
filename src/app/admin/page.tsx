"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { TOURS as DEFAULT_TOURS } from "@/data/tours";
import {
  Compass,
  FileText,
  Users,
  CalendarDays,
  Sparkles,
  Truck,
  DollarSign,
  UserCheck,
  RefreshCw,
  PlusCircle,
  ArrowUpRight,
  PhoneCall,
  Eye,
  CheckCircle2,
  Clock
} from "lucide-react";

interface Stats {
  leadsCount: number;
  clientsCount: number;
  contractsCount: number;
  monthArrivalsCount: number;
  suppliersCount: number;
  toursCount: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({
    leadsCount: 0,
    clientsCount: 0,
    contractsCount: 0,
    monthArrivalsCount: 0,
    suppliersCount: 0,
    toursCount: 0,
  });
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [recentContracts, setRecentContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
      const startOfMonth = `${currentYear}-${currentMonth}-01`;
      const lastDayOfMonth = new Date(currentYear, now.getMonth() + 1, 0).getDate();
      const endOfMonth = `${currentYear}-${currentMonth}-${String(lastDayOfMonth).padStart(2, "0")}`;

      const [
        leadsRes,
        clientsRes,
        contractsRes,
        monthArrivalsRes,
        suppliersRes,
        toursRes,
        recentLeadsRes,
        recentContractsRes,
      ] = await Promise.all([
        supabase.from("leads").select("*", { count: "exact", head: true }),
        supabase.from("clients").select("*", { count: "exact", head: true }),
        supabase.from("contracts").select("*", { count: "exact", head: true }),
        supabase
          .from("contracts")
          .select("*", { count: "exact", head: true })
          .gte("arrival_date", startOfMonth)
          .lte("arrival_date", endOfMonth),
        supabase.from("suppliers").select("*", { count: "exact", head: true }),
        supabase.from("tours").select("*", { count: "exact", head: true }),
        supabase.from("leads").select("*").order("created_at", { ascending: false }).limit(6),
        supabase.from("contracts").select("*").order("created_at", { ascending: false }).limit(6),
      ]);

      const effectiveToursCount =
        toursRes.count && toursRes.count > 0 ? toursRes.count : DEFAULT_TOURS.length;

      setStats({
        leadsCount: leadsRes.count || 0,
        clientsCount: clientsRes.count || 0,
        contractsCount: contractsRes.count || 0,
        monthArrivalsCount: monthArrivalsRes.count || 0,
        suppliersCount: suppliersRes.count || 0,
        toursCount: effectiveToursCount,
      });

      setRecentLeads(recentLeadsRes.data || []);
      setRecentContracts(recentContractsRes.data || []);
    } catch (err) {
      console.error("Erro ao carregar métricas do dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Banner de Boas-vindas */}
      <div
        className="adm-card"
        style={{
          background: "linear-gradient(135deg, var(--adm-wine) 0%, #20080d 100%)",
          color: "#fff",
          border: "none",
          padding: "32px 36px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "20px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ zIndex: 2, maxWidth: "600px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <img
              src="/img/tio-nene-01.svg"
              alt="Tio Nenê"
              style={{
                height: "22px",
                width: "auto",
                objectFit: "contain",
                filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.3))",
              }}
            />
            <span
              style={{
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                color: "var(--adm-gold)",
                fontWeight: 700,
              }}
            >
              Backoffice V1 · Central Integrada
            </span>
          </div>
          <h2 style={{ color: "#fff", fontSize: "30px", marginTop: "2px", marginBottom: "8px" }}>
            Painel Operacional Tio Nenê
          </h2>
          <p style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "14px", lineHeight: "1.5" }}>
            Acompanhe o funil de leads do site, base de clientes, emissão de contratos e o controle mensal de chegadas e custos por fornecedor.
          </p>
        </div>

        <div style={{ zIndex: 2, display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            type="button"
            className="adm-btn"
            onClick={fetchDashboardData}
            style={{
              background: "rgba(255,255,255,0.12)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Atualizar</span>
          </button>
          <Link href="/admin/clientes" className="adm-btn adm-btn-outline" style={{ background: "#fff", color: "var(--adm-wine)" }}>
            <UserCheck size={14} />
            <span>Clientes</span>
          </Link>
          <Link href="/admin/contratos?autoOpen=true" className="adm-btn adm-btn-clay">
            <PlusCircle size={15} />
            <span>Gerar Contrato</span>
          </Link>
        </div>
      </div>

      {/* Grid de KPIs Operacionais */}
      <div className="adm-kpi-grid">
        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <span>Leads do Site</span>
            <div className="adm-kpi-icon">
              <Sparkles size={18} />
            </div>
          </div>
          <div className="adm-kpi-value">{loading ? "..." : stats.leadsCount}</div>
          <div className="adm-kpi-desc">
            <Link
              href="/admin/leads"
              style={{
                color: "var(--adm-clay)",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span>Gerenciar leads</span> <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>

        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <span>Clientes Cadastrados</span>
            <div className="adm-kpi-icon">
              <UserCheck size={18} />
            </div>
          </div>
          <div className="adm-kpi-value">{loading ? "..." : stats.clientsCount}</div>
          <div className="adm-kpi-desc">
            <Link
              href="/admin/clientes"
              style={{
                color: "var(--adm-clay)",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span>Ver clientes</span> <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>

        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <span>Contratos Emitidos</span>
            <div className="adm-kpi-icon">
              <FileText size={18} />
            </div>
          </div>
          <div className="adm-kpi-value">{loading ? "..." : stats.contractsCount}</div>
          <div className="adm-kpi-desc">
            <Link
              href="/admin/contratos"
              style={{
                color: "var(--adm-clay)",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span>Ver contratos</span> <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>

        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <span>Chegadas no Mês</span>
            <div className="adm-kpi-icon">
              <CalendarDays size={18} />
            </div>
          </div>
          <div className="adm-kpi-value">{loading ? "..." : stats.monthArrivalsCount}</div>
          <div className="adm-kpi-desc">
            <Link
              href="/admin/chegadas"
              style={{
                color: "var(--adm-clay)",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span>Client Ledger</span> <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>

        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <span>Fornecedores Locais</span>
            <div className="adm-kpi-icon">
              <Truck size={18} />
            </div>
          </div>
          <div className="adm-kpi-value">{loading ? "..." : stats.suppliersCount}</div>
          <div className="adm-kpi-desc">
            <Link
              href="/admin/fornecedores"
              style={{
                color: "var(--adm-clay)",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span>Ver parceiros</span> <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>

        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <span>Passeios Ativos</span>
            <div className="adm-kpi-icon">
              <Compass size={18} />
            </div>
          </div>
          <div className="adm-kpi-value">{loading ? "..." : stats.toursCount}</div>
          <div className="adm-kpi-desc">
            <Link
              href="/admin/passeios"
              style={{
                color: "var(--adm-clay)",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span>Ver catálogo</span> <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>
      </div>

      {/* Seção Inferior: Últimos Leads e Últimos Contratos */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "24px" }}>
        {/* Painel: Leads Recentes do Site */}
        <div className="adm-card">
          <div className="adm-card-header">
            <div>
              <h3 className="adm-card-title">Últimos Leads do Site</h3>
              <p className="adm-card-subtitle">Visitantes que solicitaram atendimento via WhatsApp</p>
            </div>
            <Link href="/admin/leads" className="adm-btn adm-btn-outline adm-btn-sm">
              <span>Ver Todos</span>
            </Link>
          </div>

          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--adm-text-muted)" }}>
              Carregando leads...
            </div>
          ) : recentLeads.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {recentLeads.map((lead) => {
                const cleanPhone = (lead.phone || "").replace(/\D/g, "");
                return (
                  <div
                    key={lead.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 16px",
                      background: "var(--adm-surface-alt)",
                      borderRadius: "var(--adm-radius-md)",
                      border: "1px solid var(--adm-border)",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontWeight: 700, color: "var(--adm-wine)", fontSize: "14px" }}>
                          {lead.name}
                        </span>
                        <span
                          className={`adm-badge badge-${
                            lead.status === "convertido"
                              ? "green"
                              : lead.status === "em_atendimento"
                              ? "amber"
                              : "wine"
                          }`}
                          style={{ fontSize: "10px" }}
                        >
                          {lead.status === "convertido"
                            ? "Convertido"
                            : lead.status === "em_atendimento"
                            ? "Em Atendimento"
                            : "Novo"}
                        </span>
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--adm-text-muted)", marginTop: "3px" }}>
                        {lead.interest_name || "Interesse geral"} · {lead.phone}
                      </div>
                    </div>

                    {cleanPhone && (
                      <a
                        href={`https://wa.me/${cleanPhone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="adm-btn adm-btn-outline adm-btn-sm"
                        style={{ color: "var(--adm-emerald)" }}
                        title="Abrir WhatsApp do Lead"
                      >
                        <PhoneCall size={13} />
                        <span>Conversar</span>
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: "36px", textAlign: "center", color: "var(--adm-text-muted)" }}>
              <p>Nenhum lead capturado ainda.</p>
              <span style={{ fontSize: "12px" }}>Os leads aparecerão aqui quando visitantes clicarem em reservar no site.</span>
            </div>
          )}
        </div>

        {/* Painel: Contratos Recentes da Agência */}
        <div className="adm-card">
          <div className="adm-card-header">
            <div>
              <h3 className="adm-card-title">Últimos Contratos da Agência</h3>
              <p className="adm-card-subtitle">Contratos emitidos com valores e chegadas</p>
            </div>
            <Link href="/admin/contratos" className="adm-btn adm-btn-outline adm-btn-sm">
              <span>Ver Todos</span>
            </Link>
          </div>

          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--adm-text-muted)" }}>
              Carregando contratos...
            </div>
          ) : recentContracts.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {recentContracts.map((ct) => (
                <div
                  key={ct.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    background: "var(--adm-surface-alt)",
                    borderRadius: "var(--adm-radius-md)",
                    border: "1px solid var(--adm-border)",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontWeight: 700, color: "var(--adm-wine)", fontSize: "14px" }}>
                        {ct.contract_number}
                      </span>
                      <span className="adm-badge badge-green" style={{ fontSize: "10px" }}>
                        {ct.status}
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--adm-text-muted)", marginTop: "3px" }}>
                      <strong>{ct.client_name}</strong> · Chegada:{" "}
                      {ct.arrival_date
                        ? new Date(ct.arrival_date + "T12:00:00").toLocaleDateString("pt-BR")
                        : "—"}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontWeight: 700, color: "var(--adm-wine)", fontSize: "13px" }}>
                      R$ {Number(ct.total_amount || 0).toLocaleString("pt-BR")}
                    </span>
                    <Link
                      href="/admin/contratos"
                      className="adm-btn adm-btn-outline adm-btn-sm"
                      title="Abrir Contratos"
                    >
                      <Eye size={13} />
                      <span>Ver</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: "36px", textAlign: "center", color: "var(--adm-text-muted)" }}>
              <p>Nenhum contrato emitido ainda.</p>
              <Link
                href="/admin/contratos?autoOpen=true"
                className="adm-btn adm-btn-clay adm-btn-sm"
                style={{ marginTop: "12px" }}
              >
                <PlusCircle size={14} />
                <span>Emitir Primeiro Contrato</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
