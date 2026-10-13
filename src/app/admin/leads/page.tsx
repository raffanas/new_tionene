"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Users,
  Search,
  MessageCircle,
  Mail,
  UserCheck,
  Clock,
  RefreshCw,
  Tag,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronRight,
  Sparkles
} from "lucide-react";

interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  source: string;
  interest_type: "tour" | "package" | "roteiro" | "geral";
  interest_name?: string | null;
  interest_slug?: string | null;
  selected_items?: any;
  notes?: string | null;
  status: "novo" | "em_atendimento" | "convertido" | "perdido";
  converted_client_id?: string | null;
  created_at: string;
}

export default function AdminLeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [convertingId, setConvertingId] = useState<string | null>(null);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Erro ao buscar leads:", error.message);
        setLeads([]);
      } else if (data) {
        setLeads(data as Lead[]);
      }
    } catch (err) {
      console.error("Erro inesperado:", err);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // Converter Lead em Cliente
  const handleConvertToClient = async (lead: Lead) => {
    if (!confirm(`Deseja converter o lead "${lead.name}" em Cliente da agência?`)) return;

    setConvertingId(lead.id);
    try {
      // Monta notas completas preservando todo o histórico capturado do lead
      const noteParts: string[] = [
        `Convertido do Lead do site (${lead.interest_name || "Sem interesse especificado"}).`,
      ];
      if (lead.notes) {
        noteParts.push(`Detalhes da Viagem: ${lead.notes}`);
      }
      if (Array.isArray(lead.selected_items) && lead.selected_items.length > 0) {
        const items = lead.selected_items
          .map((item: any) => `${item.name || item.tour_name} (${item.quantity || item.count || 1}x)`)
          .join(", ");
        noteParts.push(`Passeios de interesse: ${items}`);
      }

      // 1. Criar cliente na tabela `clients` (apenas com campos reais da tabela)
      const { data: newClient, error: clientErr } = await supabase
        .from("clients")
        .insert([
          {
            name: lead.name,
            phone: lead.phone,
            whatsapp: lead.phone,
            email: lead.email || null,
            notes: noteParts.join("\n"),
          },
        ])
        .select()
        .single();

      if (clientErr) throw clientErr;

      // 2. Atualizar status do Lead para 'convertido'
      await supabase
        .from("leads")
        .update({
          status: "convertido",
          converted_client_id: newClient.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", lead.id);

      // 3. Atualizar localmente a lista de leads
      setLeads((prev) =>
        prev.map((l) =>
          l.id === lead.id
            ? { ...l, status: "convertido", converted_client_id: newClient.id }
            : l
        )
      );

      // 4. Redirecionar para a Ficha do Cliente
      router.push(`/admin/clientes?clientId=${newClient.id}`);
    } catch (err: any) {
      alert("Erro ao converter lead: " + (err.message || "Tente novamente"));
      setConvertingId(null);
    }
  };

  // Alterar status rápido (ex: em atendimento)
  const handleUpdateStatus = async (leadId: string, newStatus: Lead["status"]) => {
    try {
      await supabase
        .from("leads")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", leadId);
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
      );
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
    }
  };

  const filteredLeads = leads.filter((l) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      l.name.toLowerCase().includes(term) ||
      l.phone.includes(term) ||
      (l.email && l.email.toLowerCase().includes(term)) ||
      (l.interest_name && l.interest_name.toLowerCase().includes(term));

    const matchesStatus = statusFilter === "all" || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const countNovos = leads.filter((l) => l.status === "novo").length;
  const countAtendimento = leads.filter((l) => l.status === "em_atendimento").length;
  const countConvertidos = leads.filter((l) => l.status === "convertido").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Cabeçalho */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <span className="admin-brand-tag">FUNIL DE VENDAS</span>
          <h2 style={{ fontSize: "28px", color: "var(--adm-wine)" }}>Leads Capturados no Site</h2>
          <p style={{ color: "var(--adm-text-muted)", fontSize: "14px", marginTop: "2px" }}>
            Visitantes que clicaram em reservar passeios ou pacotes. Converta em clientes para gerar o contrato.
          </p>
        </div>

        <button
          type="button"
          className="adm-btn adm-btn-outline"
          onClick={fetchLeads}
          disabled={loading}
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          <span>Atualizar Leads</span>
        </button>
      </div>

      {/* KPIs do Funil */}
      <div className="adm-kpi-grid">
        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <span>Novos Leads</span>
            <Sparkles size={18} color="var(--adm-amber)" />
          </div>
          <div className="adm-kpi-value" style={{ color: "var(--adm-amber)" }}>{countNovos}</div>
          <div className="adm-kpi-desc">Aguardando primeiro contato</div>
        </div>

        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <span>Em Atendimento WhatsApp</span>
            <MessageCircle size={18} color="var(--adm-blue)" />
          </div>
          <div className="adm-kpi-value">{countAtendimento}</div>
          <div className="adm-kpi-desc">Conversando e montando roteiro</div>
        </div>

        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <span>Convertidos em Clientes</span>
            <UserCheck size={18} color="var(--adm-emerald)" />
          </div>
          <div className="adm-kpi-value" style={{ color: "var(--adm-emerald)" }}>{countConvertidos}</div>
          <div className="adm-kpi-desc">Negócios fechados com contrato</div>
        </div>
      </div>

      {/* Busca e Filtros */}
      <div className="adm-card" style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: "260px" }}>
          <Search size={18} color="var(--adm-clay)" />
          <input
            type="text"
            className="adm-input"
            style={{ width: "100%", maxWidth: "420px" }}
            placeholder="Buscar por nome, WhatsApp ou passeio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--adm-text-muted)" }}>Status:</span>
          <select className="adm-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">Todos os Leads</option>
            <option value="novo">Novos</option>
            <option value="em_atendimento">Em Atendimento</option>
            <option value="convertido">Convertidos</option>
            <option value="perdido">Perdidos</option>
          </select>
        </div>
      </div>

      {/* Tabela de Leads */}
      {loading ? (
        <div className="adm-card" style={{ padding: "60px 20px", textAlign: "center" }}>
          <Clock size={28} className="animate-spin" color="var(--adm-clay)" style={{ margin: "0 auto 12px" }} />
          <p style={{ color: "var(--adm-text-muted)" }}>Carregando leads do site...</p>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="adm-card" style={{ padding: "60px 20px", textAlign: "center" }}>
          <Users size={38} color="var(--adm-clay)" style={{ margin: "0 auto 12px", opacity: 0.5 }} />
          <h3>Nenhum lead encontrado</h3>
          <p style={{ color: "var(--adm-text-muted)", fontSize: "14px", marginTop: "4px" }}>
            Quando visitantes do site clicarem em reservar passeios ou pacotes, eles aparecerão instantaneamente aqui.
          </p>
        </div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Data & Hora</th>
                <th>Nome do Lead</th>
                <th>Contato WhatsApp</th>
                <th>Passeio / Pacote Escolhido</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => {
                const dateObj = new Date(lead.created_at);
                const rawPhone = lead.phone.replace(/\D/g, "");
                const waLink = `https://wa.me/${rawPhone}?text=${encodeURIComponent(`Olá ${lead.name}, tudo bem? Aqui é da equipe Tio Nenê Tours em Cancún!`)}`;

                return (
                  <tr key={lead.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: "13px" }}>
                        {dateObj.toLocaleDateString("pt-BR")}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>
                        {dateObj.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </td>

                    <td>
                      <strong style={{ fontSize: "14px", color: "var(--adm-wine)" }}>{lead.name}</strong>
                      {lead.email && (
                        <div style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>{lead.email}</div>
                      )}
                    </td>

                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontWeight: 600, fontSize: "13px" }}>{lead.phone}</span>
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noreferrer"
                          className="adm-btn adm-btn-icon adm-btn-sm"
                          style={{ background: "#22c55e", color: "#fff", width: "24px", height: "24px", padding: 0 }}
                          title="Abrir WhatsApp"
                          onClick={() => {
                            if (lead.status === "novo") handleUpdateStatus(lead.id, "em_atendimento");
                          }}
                        >
                          <MessageCircle size={13} />
                        </a>
                      </div>
                    </td>

                    <td>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "var(--adm-clay)",
                          background: "var(--adm-surface-alt)",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          border: "1px solid var(--adm-border)"
                        }}
                      >
                        {lead.interest_name || "Passeio do Site"}
                      </span>
                    </td>

                    <td>
                      <select
                        className="adm-select"
                        style={{ fontSize: "11px", height: "30px", width: "auto" }}
                        value={lead.status}
                        onChange={(e) => handleUpdateStatus(lead.id, e.target.value as any)}
                      >
                        <option value="novo">Novo Lead</option>
                        <option value="em_atendimento">Em Atendimento</option>
                        <option value="convertido">Convertido</option>
                        <option value="perdido">Perdido</option>
                      </select>
                    </td>

                    <td style={{ textAlign: "right" }}>
                      {lead.status === "convertido" && lead.converted_client_id ? (
                        <Link
                          href={`/admin/clientes?clientId=${lead.converted_client_id}`}
                          className="adm-btn adm-btn-outline adm-btn-sm"
                        >
                          <UserCheck size={13} color="var(--adm-emerald)" />
                          <span>Ver Cliente</span>
                        </Link>
                      ) : (
                        <button
                          type="button"
                          className="adm-btn adm-btn-clay adm-btn-sm"
                          disabled={convertingId === lead.id}
                          onClick={() => handleConvertToClient(lead)}
                        >
                          <UserCheck size={13} />
                          <span>{convertingId === lead.id ? "Convertendo..." : "Converter em Cliente"}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
