"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Users,
  Search,
  PhoneCall,
  Mail,
  MapPin,
  Building2,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  Plus,
  X,
  Eye,
  FileText
} from "lucide-react";

interface PartnerLead {
  id: string;
  created_at: string;
  name: string;
  email: string;
  whatsapp: string;
  location: string;
  profile: "agente" | "operadora" | "grupo" | "creator";
  details?: any;
  message?: string;
  status: "novo" | "contatado" | "documentos" | "onboarding" | "ativo" | "arquivado";
}

const PROFILE_OPTIONS = [
  { value: "agente", label: "Agente de Viagens" },
  { value: "operadora", label: "Operadora" },
  { value: "grupo", label: "Líder de Grupo" },
  { value: "creator", label: "Creator / Influencer" },
];

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  novo: { label: "Novo Cadastro", color: "badge-amber" },
  contatado: { label: "Contatado", color: "badge-blue" },
  documentos: { label: "Em Análise Doc", color: "badge-wine" },
  onboarding: { label: "Onboarding", color: "badge-clay" },
  ativo: { label: "Parceiro Ativo", color: "badge-green" },
  arquivado: { label: "Arquivado", color: "badge-rose" },
};

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<PartnerLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [profileFilter, setProfileFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Detalhes Modal
  const [selectedPartner, setSelectedPartner] = useState<PartnerLead | null>(null);

  // Cadastro Manual Modal
  const [newPartnerModal, setNewPartnerModal] = useState(false);
  const [newPartnerData, setNewPartnerData] = useState<Partial<PartnerLead>>({
    name: "",
    email: "",
    whatsapp: "",
    location: "São Paulo, SP",
    profile: "agente",
    message: "",
    status: "novo",
  });

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("partner_leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPartners(data || []);
    } catch (err) {
      console.error("Erro ao carregar parceiros:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: any) => {
    try {
      const { error } = await supabase.from("partner_leads").update({ status: newStatus }).eq("id", id);
      if (error) throw error;

      if (selectedPartner && selectedPartner.id === id) {
        setSelectedPartner({ ...selectedPartner, status: newStatus });
      }
      setPartners((prev) => prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p)));
    } catch (err: any) {
      alert("Erro ao atualizar status: " + err.message);
    }
  };

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from("partner_leads").insert([newPartnerData]);
      if (error) throw error;
      setNewPartnerModal(false);
      fetchPartners();
      alert("Parceiro registrado com sucesso!");
    } catch (err: any) {
      alert("Erro ao cadastrar parceiro: " + err.message);
    }
  };

  const filteredPartners = partners.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.whatsapp.includes(searchTerm) ||
      p.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesProfile = profileFilter === "all" || p.profile === profileFilter;
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesProfile && matchesStatus;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2>CRM de Parceiros B2B</h2>
          <p style={{ color: "var(--adm-text-muted)", fontSize: "14px", marginTop: "4px" }}>
            Agentes de viagens, operadoras de turismo, organizadores de grupos e criadores de conteúdo.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button type="button" className="adm-btn adm-btn-outline adm-btn-icon" onClick={fetchPartners} title="Atualizar">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button type="button" className="adm-btn adm-btn-primary" onClick={() => setNewPartnerModal(true)}>
            <Plus size={16} />
            <span>Novo Parceiro</span>
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
                placeholder="Buscar por nome, agência, e-mail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="adm-select"
              style={{ width: "190px" }}
              value={profileFilter}
              onChange={(e) => setProfileFilter(e.target.value)}
            >
              <option value="all">Todos os Perfis</option>
              {PROFILE_OPTIONS.map((pr) => (
                <option key={pr.value} value={pr.value}>
                  {pr.label}
                </option>
              ))}
            </select>

            <select
              className="adm-select"
              style={{ width: "190px" }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Todos os Status</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          <span style={{ fontSize: "13px", color: "var(--adm-text-muted)" }}>
            Total: <strong>{filteredPartners.length}</strong> parceiros
          </span>
        </div>

        {/* Tabela */}
        <div className="adm-table-responsive">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Parceiro / Responsável</th>
                <th>Perfil</th>
                <th>Localização</th>
                <th>Contato</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "40px" }}>
                    Carregando parceiros...
                  </td>
                </tr>
              ) : filteredPartners.length > 0 ? (
                filteredPartners.map((partner) => {
                  const statusInfo = STATUS_CONFIG[partner.status] || STATUS_CONFIG.novo;

                  return (
                    <tr key={partner.id}>
                      <td style={{ color: "var(--adm-text-muted)", fontSize: "13px", whiteSpace: "nowrap" }}>
                        {partner.created_at ? new Date(partner.created_at).toLocaleDateString("pt-BR") : "--"}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: "var(--adm-wine)", fontSize: "15px" }}>{partner.name}</div>
                        <div style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>{partner.email}</div>
                      </td>
                      <td>
                        <span className="adm-badge badge-wine" style={{ textTransform: "capitalize" }}>
                          {partner.profile}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: "13px" }}>{partner.location}</span>
                      </td>
                      <td>{partner.whatsapp}</td>
                      <td>
                        <span className={`adm-badge ${statusInfo.color}`}>{statusInfo.label}</span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                          {partner.whatsapp && (
                            <a
                              href={`https://wa.me/${partner.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
                                `Olá ${partner.name}! Vimos seu interesse na parceria comercial com a Tio Nenê em Cancún.`
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
                            onClick={() => setSelectedPartner(partner)}
                            title="Ver Detalhes"
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
                  <td colSpan={7} style={{ textAlign: "center", padding: "48px" }}>
                    Nenhum parceiro cadastrado no momento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detalhes do Parceiro */}
      {selectedPartner && (
        <div className="adm-modal-backdrop" onClick={() => setSelectedPartner(null)}>
          <div className="adm-modal adm-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <div>
                <h3 style={{ fontSize: "22px" }}>Parceiro: {selectedPartner.name}</h3>
                <p style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                  Perfil: <strong>{selectedPartner.profile.toUpperCase()}</strong> · Cadastrado em{" "}
                  {new Date(selectedPartner.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <button type="button" className="adm-btn adm-btn-icon adm-btn-outline" onClick={() => setSelectedPartner(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="adm-modal-body">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px", marginBottom: "20px" }}>
                <div style={{ background: "var(--adm-surface-alt)", padding: "16px", borderRadius: "12px", border: "1px solid var(--adm-border)" }}>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--adm-text-muted)", fontWeight: 700 }}>Contatos</span>
                  <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div><strong>WhatsApp:</strong> {selectedPartner.whatsapp}</div>
                    <div><strong>E-mail:</strong> {selectedPartner.email}</div>
                    <div><strong>Cidade/Estado:</strong> {selectedPartner.location}</div>
                  </div>
                </div>

                <div style={{ background: "var(--adm-surface-alt)", padding: "16px", borderRadius: "12px", border: "1px solid var(--adm-border)" }}>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--adm-text-muted)", fontWeight: 700 }}>Status do Onboarding</span>
                  <div style={{ marginTop: "12px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                      <button
                        key={k}
                        type="button"
                        className={`adm-btn adm-btn-sm ${selectedPartner.status === k ? "adm-btn-primary" : "adm-btn-outline"}`}
                        onClick={() => handleUpdateStatus(selectedPartner.id, k)}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {selectedPartner.message && (
                <div style={{ background: "#fff", padding: "16px", borderRadius: "12px", border: "1px solid var(--adm-border)", marginBottom: "20px" }}>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--adm-text-muted)", fontWeight: 700 }}>Mensagem do Parceiro</span>
                  <p style={{ marginTop: "6px", fontSize: "14px", lineHeight: "1.5", color: "var(--adm-text-main)" }}>
                    "{selectedPartner.message}"
                  </p>
                </div>
              )}
            </div>

            <div className="adm-modal-footer">
              <a
                href={`https://wa.me/${selectedPartner.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
                  `Olá ${selectedPartner.name}! Sou da equipe de parcerias da Tio Nenê em Cancún.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="adm-btn adm-btn-primary"
                style={{ background: "#25D366", borderColor: "#25D366" }}
              >
                <PhoneCall size={16} />
                <span>Iniciar Conversa no WhatsApp</span>
              </a>
              <button type="button" className="adm-btn adm-btn-outline" onClick={() => setSelectedPartner(null)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cadastro de Parceiro Manual */}
      {newPartnerModal && (
        <div className="adm-modal-backdrop" onClick={() => setNewPartnerModal(false)}>
          <div className="adm-modal adm-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <div>
                <h3 style={{ fontSize: "20px" }}>Cadastrar Parceiro B2B</h3>
                <p style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>Agência, operador ou creator</p>
              </div>
              <button type="button" className="adm-btn adm-btn-icon adm-btn-outline" onClick={() => setNewPartnerModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreatePartner}>
              <div className="adm-modal-body">
                <div className="adm-form-grid">
                  <div>
                    <label className="adm-label">Nome da Empresa / Parceiro</label>
                    <input
                      type="text"
                      className="adm-input"
                      required
                      placeholder="Ex: Agência Rota das Ilhas"
                      value={newPartnerData.name}
                      onChange={(e) => setNewPartnerData({ ...newPartnerData, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="adm-label">Perfil de Atuação</label>
                    <select
                      className="adm-select"
                      value={newPartnerData.profile}
                      onChange={(e) => setNewPartnerData({ ...newPartnerData, profile: e.target.value as any })}
                    >
                      {PROFILE_OPTIONS.map((pr) => (
                        <option key={pr.value} value={pr.value}>
                          {pr.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="adm-label">WhatsApp com DDD</label>
                    <input
                      type="text"
                      className="adm-input"
                      required
                      placeholder="Ex: 5511999998888"
                      value={newPartnerData.whatsapp}
                      onChange={(e) => setNewPartnerData({ ...newPartnerData, whatsapp: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="adm-label">E-mail Comercial</label>
                    <input
                      type="email"
                      className="adm-input"
                      required
                      placeholder="contato@agencia.com.br"
                      value={newPartnerData.email}
                      onChange={(e) => setNewPartnerData({ ...newPartnerData, email: e.target.value })}
                    />
                  </div>

                  <div className="adm-form-full">
                    <label className="adm-label">Cidade / Estado / País</label>
                    <input
                      type="text"
                      className="adm-input"
                      placeholder="Ex: Curitiba, PR"
                      value={newPartnerData.location}
                      onChange={(e) => setNewPartnerData({ ...newPartnerData, location: e.target.value })}
                    />
                  </div>

                  <div className="adm-form-full">
                    <label className="adm-label">Observações / Detalhes</label>
                    <textarea
                      className="adm-textarea"
                      placeholder="Informações adicionais sobre o volume de passageiros ou nicho do parceiro..."
                      value={newPartnerData.message || ""}
                      onChange={(e) => setNewPartnerData({ ...newPartnerData, message: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="adm-modal-footer">
                <button type="button" className="adm-btn adm-btn-outline" onClick={() => setNewPartnerModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="adm-btn adm-btn-primary">
                  Cadastrar Parceiro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
