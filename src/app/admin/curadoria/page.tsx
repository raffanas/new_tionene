"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Star,
  Search,
  PhoneCall,
  Mail,
  Calendar,
  Users,
  DollarSign,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  Plus,
  X,
  MessageSquare,
  FileText
} from "lucide-react";

interface CuradoriaLead {
  id: string;
  created_at: string;
  name: string;
  whatsapp: string;
  email?: string;
  origin_city?: string;
  destination_interest?: string;
  travel_date?: string;
  duration?: string;
  adults?: number;
  children?: number;
  budget_range?: string;
  notes?: string;
  status: string;
}

const STATUS_OPTIONS = [
  { value: "novo", label: "Novo Lead", color: "badge-amber" },
  { value: "em_atendimento", label: "Em Atendimento", color: "badge-blue" },
  { value: "proposta_enviada", label: "Proposta Enviada", color: "badge-wine" },
  { value: "fechado", label: "Fechado / Convertido", color: "badge-green" },
  { value: "arquivado", label: "Arquivado", color: "badge-rose" },
];

export default function AdminCuradoriaPage() {
  const [leads, setLeads] = useState<CuradoriaLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Lead Details Modal
  const [selectedLead, setSelectedLead] = useState<CuradoriaLead | null>(null);
  const [editingNotes, setEditingNotes] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Modal Novo Lead Manual
  const [newLeadModal, setNewLeadModal] = useState(false);
  const [newLeadData, setNewLeadData] = useState({
    name: "",
    whatsapp: "",
    email: "",
    origin_city: "São Paulo, SP",
    destination_interest: "Cancún & Riviera Maya",
    travel_date: "Dezembro 2026",
    duration: "7 a 10 dias",
    adults: 2,
    children: 0,
    budget_range: "Acima de R$ 25.000",
    notes: "",
    status: "novo",
  });

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("curadoria_leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (err) {
      console.error("Erro ao carregar leads de curadoria:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleOpenLead = (lead: CuradoriaLead) => {
    setSelectedLead(lead);
    setEditingNotes(lead.notes || "");
  };

  const handleUpdateStatus = async (leadId: string, newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from("curadoria_leads")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", leadId);

      if (error) throw error;

      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead({ ...selectedLead, status: newStatus });
      }
      setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)));
    } catch (err: any) {
      alert("Erro ao atualizar status: " + err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedLead) return;
    try {
      const { error } = await supabase
        .from("curadoria_leads")
        .update({ notes: editingNotes, updated_at: new Date().toISOString() })
        .eq("id", selectedLead.id);

      if (error) throw error;
      setSelectedLead({ ...selectedLead, notes: editingNotes });
      setLeads((prev) => prev.map((l) => (l.id === selectedLead.id ? { ...l, notes: editingNotes } : l)));
      alert("Observações salvas com sucesso!");
    } catch (err: any) {
      alert("Erro ao salvar anotações: " + err.message);
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from("curadoria_leads").insert([newLeadData]);
      if (error) throw error;
      setNewLeadModal(false);
      fetchLeads();
      alert("Lead registrado com sucesso!");
    } catch (err: any) {
      alert("Erro ao cadastrar lead: " + err.message);
    }
  };

  // Filtros
  const filteredLeads = leads.filter((l) => {
    const matchesSearch =
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.email && l.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (l.whatsapp && l.whatsapp.includes(searchTerm));

    const matchesStatus = statusFilter === "all" || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <h2>Curadoria Bella · Clientes Alto Padrão (VIP)</h2>
            <span className="adm-badge badge-amber" style={{ display: "inline-flex", gap: "4px" }}>
              <Star size={11} fill="currentColor" /> Alto Ticket
            </span>
          </div>
          <p style={{ color: "var(--adm-text-muted)", fontSize: "14px", marginTop: "4px" }}>
            Leads qualificados com intenção de consultoria exclusiva e roteiro desenhado a dois.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button type="button" className="adm-btn adm-btn-outline adm-btn-icon" onClick={fetchLeads} title="Atualizar">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button type="button" className="adm-btn adm-btn-clay" onClick={() => setNewLeadModal(true)}>
            <Plus size={16} />
            <span>Cadastrar Lead Manual</span>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="adm-table-container">
        <div className="adm-table-toolbar">
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <div className="adm-search-input">
              <Search size={16} color="var(--adm-text-muted)" />
              <input
                type="text"
                placeholder="Buscar por nome, e-mail ou WhatsApp..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="adm-select"
              style={{ width: "200px" }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Todos os Status</option>
              {STATUS_OPTIONS.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>

          <span style={{ fontSize: "13px", color: "var(--adm-text-muted)" }}>
            Total: <strong>{filteredLeads.length}</strong> clientes
          </span>
        </div>

        {/* Tabela de Leads */}
        <div className="adm-table-responsive">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Cliente</th>
                <th>Contato</th>
                <th>Viagem Prevista</th>
                <th>Grupo / Pax</th>
                <th>Orçamento</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px" }}>
                    Carregando leads da Curadoria Bella...
                  </td>
                </tr>
              ) : filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => {
                  const statusObj = STATUS_OPTIONS.find((s) => s.value === lead.status) || STATUS_OPTIONS[0];

                  return (
                    <tr key={lead.id}>
                      <td style={{ color: "var(--adm-text-muted)", fontSize: "13px", whiteSpace: "nowrap" }}>
                        {lead.created_at ? new Date(lead.created_at).toLocaleDateString("pt-BR") : "--"}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: "var(--adm-wine)", fontSize: "15px" }}>{lead.name}</div>
                        {lead.origin_city && (
                          <div style={{ fontSize: "12px", color: "var(--adm-text-subtle)" }}>{lead.origin_city}</div>
                        )}
                      </td>
                      <td>
                        <div>{lead.whatsapp}</div>
                        {lead.email && <div style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>{lead.email}</div>}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{lead.travel_date || "A definir"}</div>
                        <div style={{ fontSize: "12px", color: "var(--adm-text-subtle)" }}>{lead.duration || ""}</div>
                      </td>
                      <td>
                        <span style={{ fontSize: "13px" }}>
                          {lead.adults || 1} adultos {lead.children ? `+ ${lead.children} crianças` : ""}
                        </span>
                      </td>
                      <td>
                        <span className="adm-badge badge-amber">{lead.budget_range || "Alto Padrão"}</span>
                      </td>
                      <td>
                        <span className={`adm-badge ${statusObj.color}`}>{statusObj.label}</span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                          {lead.whatsapp && (
                            <a
                              href={`https://wa.me/${lead.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
                                `Olá ${lead.name}! Sou da equipe Tio Nenê / Curadoria Bella. Recebemos seu pedido de consultoria para o México e adoraríamos conversar sobre seu roteiro!`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="adm-btn adm-btn-outline adm-btn-icon"
                              title="Abrir WhatsApp"
                              style={{ color: "var(--adm-emerald)" }}
                            >
                              <PhoneCall size={14} />
                            </a>
                          )}
                          <button
                            type="button"
                            className="adm-btn adm-btn-outline adm-btn-icon"
                            onClick={() => handleOpenLead(lead)}
                            title="Ver Detalhes do Lead"
                          >
                            <Eye size={14} color="var(--adm-wine)" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "48px" }}>
                    Nenhum lead de Curadoria encontrado no momento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalhes do Lead */}
      {selectedLead && (
        <div className="adm-modal-backdrop" onClick={() => setSelectedLead(null)}>
          <div className="adm-modal adm-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <div>
                <h3 style={{ fontSize: "22px" }}>Ficha do Cliente: {selectedLead.name}</h3>
                <p style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                  Registrado em {new Date(selectedLead.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <button type="button" className="adm-btn adm-btn-icon adm-btn-outline" onClick={() => setSelectedLead(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="adm-modal-body">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px", marginBottom: "24px" }}>
                <div style={{ background: "var(--adm-surface-alt)", padding: "16px", borderRadius: "12px", border: "1px solid var(--adm-border)" }}>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--adm-text-muted)", fontWeight: 700 }}>Dados de Contato</span>
                  <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div><strong>WhatsApp:</strong> {selectedLead.whatsapp}</div>
                    <div><strong>E-mail:</strong> {selectedLead.email || "Não informado"}</div>
                    <div><strong>Origem:</strong> {selectedLead.origin_city || "Não informada"}</div>
                  </div>
                </div>

                <div style={{ background: "var(--adm-surface-alt)", padding: "16px", borderRadius: "12px", border: "1px solid var(--adm-border)" }}>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--adm-text-muted)", fontWeight: 700 }}>Perfil da Viagem</span>
                  <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div><strong>Previsão:</strong> {selectedLead.travel_date || "A definir"}</div>
                    <div><strong>Duração:</strong> {selectedLead.duration || "Não especificada"}</div>
                    <div><strong>Grupo:</strong> {selectedLead.adults || 1} adultos, {selectedLead.children || 0} crianças</div>
                    <div><strong>Orçamento:</strong> {selectedLead.budget_range || "VIP"}</div>
                  </div>
                </div>
              </div>

              {/* Status do Lead */}
              <div style={{ marginBottom: "24px" }}>
                <label className="adm-label">Mudar Status do Lead no Funil</label>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {STATUS_OPTIONS.map((st) => (
                    <button
                      key={st.value}
                      type="button"
                      className={`adm-btn adm-btn-sm ${selectedLead.status === st.value ? "adm-btn-primary" : "adm-btn-outline"}`}
                      disabled={updatingStatus}
                      onClick={() => handleUpdateStatus(selectedLead.id, st.value)}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notas Internas da Agência */}
              <div>
                <label className="adm-label">Anotações da Equipe / Histórico de Contato</label>
                <textarea
                  className="adm-textarea"
                  placeholder="Escreva detalhes da conversa no WhatsApp, preferências de hotel ou passeios solicitados..."
                  value={editingNotes}
                  onChange={(e) => setEditingNotes(e.target.value)}
                  style={{ minHeight: "110px" }}
                />
                <button
                  type="button"
                  className="adm-btn adm-btn-clay adm-btn-sm"
                  onClick={handleSaveNotes}
                  style={{ marginTop: "8px" }}
                >
                  Salvar Observações
                </button>
              </div>
            </div>

            <div className="adm-modal-footer">
              {selectedLead.whatsapp && (
                <a
                  href={`https://wa.me/${selectedLead.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
                    `Olá ${selectedLead.name}! Sou da equipe Tio Nenê / Curadoria Bella.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="adm-btn adm-btn-primary"
                  style={{ background: "#25D366", borderColor: "#25D366" }}
                >
                  <PhoneCall size={16} />
                  <span>Conversar no WhatsApp</span>
                </a>
              )}
              <button type="button" className="adm-btn adm-btn-outline" onClick={() => setSelectedLead(null)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cadastro de Lead Manual */}
      {newLeadModal && (
        <div className="adm-modal-backdrop" onClick={() => setNewLeadModal(false)}>
          <div className="adm-modal adm-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <div>
                <h3 style={{ fontSize: "20px" }}>Cadastrar Novo Lead Curadoria VIP</h3>
                <p style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>Inserção manual de lead recebido</p>
              </div>
              <button type="button" className="adm-btn adm-btn-icon adm-btn-outline" onClick={() => setNewLeadModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateLead}>
              <div className="adm-modal-body">
                <div className="adm-form-grid">
                  <div>
                    <label className="adm-label">Nome Completo</label>
                    <input
                      type="text"
                      className="adm-input"
                      required
                      placeholder="Ex: Dra. Mariana Costa"
                      value={newLeadData.name}
                      onChange={(e) => setNewLeadData({ ...newLeadData, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="adm-label">WhatsApp com DDD</label>
                    <input
                      type="text"
                      className="adm-input"
                      required
                      placeholder="Ex: 5511999998888"
                      value={newLeadData.whatsapp}
                      onChange={(e) => setNewLeadData({ ...newLeadData, whatsapp: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="adm-label">E-mail</label>
                    <input
                      type="email"
                      className="adm-input"
                      placeholder="cliente@email.com"
                      value={newLeadData.email}
                      onChange={(e) => setNewLeadData({ ...newLeadData, email: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="adm-label">Cidade de Origem</label>
                    <input
                      type="text"
                      className="adm-input"
                      placeholder="Ex: Belo Horizonte, MG"
                      value={newLeadData.origin_city}
                      onChange={(e) => setNewLeadData({ ...newLeadData, origin_city: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="adm-label">Data Prevista da Viagem</label>
                    <input
                      type="text"
                      className="adm-input"
                      placeholder="Ex: Novembro / Dezembro"
                      value={newLeadData.travel_date}
                      onChange={(e) => setNewLeadData({ ...newLeadData, travel_date: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="adm-label">Faixa de Orçamento Estimada</label>
                    <input
                      type="text"
                      className="adm-input"
                      placeholder="Ex: Acima de R$ 25.000"
                      value={newLeadData.budget_range}
                      onChange={(e) => setNewLeadData({ ...newLeadData, budget_range: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="adm-modal-footer">
                <button type="button" className="adm-btn adm-btn-outline" onClick={() => setNewLeadModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="adm-btn adm-btn-clay">
                  Cadastrar Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
