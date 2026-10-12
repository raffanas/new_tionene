"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { TOURS as DEFAULT_TOURS } from "@/data/tours";
import {
  Compass,
  Briefcase,
  Star,
  Users,
  CalendarCheck,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
  PhoneCall,
  Clock,
  Eye,
  RefreshCw,
  PlusCircle
} from "lucide-react";

interface Stats {
  toursCount: number;
  packagesCount: number;
  curadoriaCount: number;
  partnerCount: number;
  reservationsCount: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({
    toursCount: 0,
    packagesCount: 0,
    curadoriaCount: 0,
    partnerCount: 0,
    reservationsCount: 0,
  });
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [recentReservations, setRecentReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Tours
      const { count: toursCount } = await supabase.from("tours").select("*", { count: "exact", head: true });
      // 2. Packages
      const { count: packagesCount } = await supabase.from("travel_packages").select("*", { count: "exact", head: true });
      // 3. Curadoria Leads
      const { data: curLeads, count: curadoriaCount } = await supabase
        .from("curadoria_leads")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(5);
      // 4. Partner Leads
      const { data: partLeads, count: partnerCount } = await supabase
        .from("partner_leads")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(5);
      // 5. Reservations
      const { data: resData, count: reservationsCount } = await supabase
        .from("reservations")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(5);

      const effectiveToursCount = (toursCount && toursCount > 0) ? toursCount : DEFAULT_TOURS.length;

      setStats({
        toursCount: effectiveToursCount,
        packagesCount: packagesCount || 0,
        curadoriaCount: curadoriaCount || 0,
        partnerCount: partnerCount || 0,
        reservationsCount: reservationsCount || 0,
      });

      // Combina leads recentes para feed unificado
      const combined = [
        ...(curLeads || []).map((l) => ({ ...l, type: "Curadoria Bella VIP" })),
        ...(partLeads || []).map((l) => ({ ...l, type: "Parceiro B2B" })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setRecentLeads(combined.slice(0, 6));
      setRecentReservations(resData || []);
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
          overflow: "hidden"
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
                filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.3))"
              }}
            />
            <span
              style={{
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                color: "var(--adm-gold)",
                fontWeight: 700
              }}
            >
              Visão Geral em Tempo Real
            </span>
          </div>
          <h2 style={{ color: "#fff", fontSize: "32px", marginTop: "2px", marginBottom: "8px" }}>
            Bem-vindo ao Painel Tio Nenê
          </h2>
          <p style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "15px", lineHeight: "1.5" }}>
            Acompanhe o catálogo de experiências no Caribe Mexicano, leads de alto ticket da Curadoria Bella e o operacional de reservas.
          </p>
        </div>

        <div style={{ zIndex: 2, display: "flex", gap: "12px" }}>
          <button
            type="button"
            className="adm-btn"
            onClick={fetchDashboardData}
            style={{ background: "rgba(255,255,255,0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }}
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            <span>Atualizar Dados</span>
          </button>
          <Link href="/admin/reservas" className="adm-btn adm-btn-clay">
            <PlusCircle size={15} />
            <span>Nova Reserva</span>
          </Link>
        </div>
      </div>

      {/* Grid de KPIs */}
      <div className="adm-kpi-grid">
        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <span>Passeios Cadastrados</span>
            <div className="adm-kpi-icon">
              <Compass size={18} />
            </div>
          </div>
          <div className="adm-kpi-value">{loading ? "..." : stats.toursCount}</div>
          <div className="adm-kpi-desc">
            <Link href="/admin/passeios" style={{ color: "var(--adm-clay)", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
              <span>Ver catálogo</span> <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>

        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <span>Pacotes de Viagem</span>
            <div className="adm-kpi-icon">
              <Briefcase size={18} />
            </div>
          </div>
          <div className="adm-kpi-value">{loading ? "..." : stats.packagesCount}</div>
          <div className="adm-kpi-desc">
            <Link href="/admin/viagem-completa" style={{ color: "var(--adm-clay)", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
              <span>Ver pacotes</span> <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>

        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <span>Curadoria Bella (VIP)</span>
            <div className="adm-kpi-icon">
              <Star size={18} />
            </div>
          </div>
          <div className="adm-kpi-value">{loading ? "..." : stats.curadoriaCount}</div>
          <div className="adm-kpi-desc">
            <Link href="/admin/curadoria" style={{ color: "var(--adm-clay)", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
              <span>Atender clientes</span> <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>

        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <span>Parceiros B2B</span>
            <div className="adm-kpi-icon">
              <Users size={18} />
            </div>
          </div>
          <div className="adm-kpi-value">{loading ? "..." : stats.partnerCount}</div>
          <div className="adm-kpi-desc">
            <Link href="/admin/parceiros" style={{ color: "var(--adm-clay)", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
              <span>Ver agentes & creators</span> <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>

        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <span>Reservas no Sistema</span>
            <div className="adm-kpi-icon">
              <CalendarCheck size={18} />
            </div>
          </div>
          <div className="adm-kpi-value">{loading ? "..." : stats.reservationsCount}</div>
          <div className="adm-kpi-desc">
            <Link href="/admin/reservas" style={{ color: "var(--adm-clay)", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
              <span>Gerenciar vouchers</span> <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>
      </div>

      {/* Seção Inferior: Leads Recentes e Reservas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "24px" }}>
        {/* Card: Leads Recentes */}
        <div className="adm-card">
          <div className="adm-card-header">
            <div>
              <h3 className="adm-card-title">Últimos Leads Recebidos</h3>
              <p className="adm-card-subtitle">Solicitações de Curadoria e Parcerias B2B</p>
            </div>
            <Link href="/admin/curadoria" className="adm-btn adm-btn-outline adm-btn-sm">
              <span>Ver Todos</span>
            </Link>
          </div>

          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--adm-text-muted)" }}>
              Carregando registros...
            </div>
          ) : recentLeads.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {recentLeads.map((lead) => (
                <div
                  key={lead.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 16px",
                    background: "var(--adm-surface-alt)",
                    borderRadius: "var(--adm-radius-md)",
                    border: "1px solid var(--adm-border)"
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontWeight: 700, color: "var(--adm-wine)", fontSize: "15px" }}>{lead.name}</span>
                      <span
                        className="adm-badge"
                        style={{
                          background: lead.type.includes("VIP") ? "var(--adm-gold-light)" : "var(--adm-blue-bg)",
                          color: lead.type.includes("VIP") ? "var(--adm-amber)" : "var(--adm-blue)",
                          fontSize: "10px"
                        }}
                      >
                        {lead.type}
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--adm-text-muted)", marginTop: "4px" }}>
                      {lead.whatsapp || lead.email || "Sem contato informado"}
                      {lead.travel_date && ` · Viagem: ${lead.travel_date}`}
                    </div>
                  </div>

                  {lead.whatsapp && (
                    <a
                      href={`https://wa.me/${lead.whatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="adm-btn adm-btn-outline adm-btn-sm"
                      style={{ color: "var(--adm-emerald)" }}
                      title="Abrir WhatsApp"
                    >
                      <PhoneCall size={14} />
                      <span>WhatsApp</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--adm-text-muted)" }}>
              Nenhum lead registrado recentemente.
            </div>
          )}
        </div>

        {/* Card: Reservas Recentes */}
        <div className="adm-card">
          <div className="adm-card-header">
            <div>
              <h3 className="adm-card-title">Reservas & Viagens</h3>
              <p className="adm-card-subtitle">Últimos vouchers operacionais gerados</p>
            </div>
            <Link href="/admin/reservas" className="adm-btn adm-btn-outline adm-btn-sm">
              <span>Gerenciar</span>
            </Link>
          </div>

          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--adm-text-muted)" }}>
              Carregando reservas...
            </div>
          ) : recentReservations.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {recentReservations.map((res) => (
                <div
                  key={res.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 16px",
                    background: "var(--adm-surface-alt)",
                    borderRadius: "var(--adm-radius-md)",
                    border: "1px solid var(--adm-border)"
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontWeight: 700, color: "var(--adm-wine)", fontSize: "14px" }}>
                        Código: {res.booking_code || "TN-SEM-CODIGO"}
                      </span>
                      <span className={`adm-badge badge-${res.status === "confirmed" ? "green" : "wine"}`}>
                        {res.status}
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--adm-text-muted)", marginTop: "4px" }}>
                      {res.accommodation_name || "Hotel não especificado"} · {res.adults || 1} adultos
                    </div>
                  </div>

                  <Link href="/admin/reservas" className="adm-btn adm-btn-outline adm-btn-sm">
                    <Eye size={14} />
                    <span>Detalhes</span>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--adm-text-muted)" }}>
              <p>Nenhuma reserva registrada ainda.</p>
              <Link href="/admin/reservas" className="adm-btn adm-btn-clay adm-btn-sm" style={{ marginTop: "12px" }}>
                <PlusCircle size={14} />
                <span>Cadastrar Primeira Reserva</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
