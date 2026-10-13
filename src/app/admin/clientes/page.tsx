"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  PhoneCall,
  Mail,
  FileText,
  Clock,
  RefreshCw,
  CheckCircle2,
  X,
  ExternalLink,
  ChevronRight,
  ShieldCheck
} from "lucide-react";

interface Client {
  id: string;
  name: string;
  cpf?: string | null;
  document_id?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  default_hotel?: string | null;
  notes?: string | null;
  contract_id?: string | null;
  created_at: string;
}

function ClientsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightClientId = searchParams?.get("clientId");

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal de Criação / Edição de Cliente
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<Partial<Client>>({
    name: "",
    cpf: "",
    phone: "",
    email: "",
    default_hotel: "",
    notes: "",
  });

  const fetchClients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Erro ao buscar clientes:", error.message);
        setClients([]);
      } else if (data) {
        setClients(data as Client[]);
      }
    } catch (err) {
      console.error("Erro inesperado:", err);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const openCreateModal = () => {
    setEditingClient(null);
    setFormData({
      name: "",
      cpf: "",
      phone: "",
      email: "",
      default_hotel: "",
      notes: "",
    });
    setModalOpen(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      cpf: client.cpf || "",
      phone: client.phone || client.whatsapp || "",
      email: client.email || "",
      default_hotel: client.default_hotel || "",
      notes: client.notes || "",
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    setSaving(true);
    try {
      if (editingClient) {
        const { error } = await supabase
          .from("clients")
          .update({
            name: formData.name,
            cpf: formData.cpf || null,
            phone: formData.phone || null,
            whatsapp: formData.phone || null,
            email: formData.email || null,
            default_hotel: formData.default_hotel || null,
            notes: formData.notes || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingClient.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("clients").insert([
          {
            name: formData.name,
            cpf: formData.cpf || null,
            phone: formData.phone || null,
            whatsapp: formData.phone || null,
            email: formData.email || null,
            default_hotel: formData.default_hotel || null,
            notes: formData.notes || null,
          },
        ]);

        if (error) throw error;
      }

      setModalOpen(false);
      fetchClients();
    } catch (err: any) {
      alert("Erro ao salvar cliente: " + (err.message || "Tente novamente"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Deseja realmente remover o cliente "${name}"?`)) return;

    try {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
      fetchClients();
    } catch (err: any) {
      alert("Erro ao excluir: " + (err.message || "Erro"));
    }
  };

  // Gerar Contrato para este cliente
  const handleGenerateContract = (client: Client) => {
    // Redireciona para /admin/contratos com os parâmetros do cliente
    const params = new URLSearchParams({
      clientId: client.id,
      clientName: client.name,
      clientPhone: client.phone || client.whatsapp || "",
      clientCpf: client.cpf || "",
      clientEmail: client.email || "",
      autoOpen: "true",
    });
    router.push(`/admin/contratos?${params.toString()}`);
  };

  const filteredClients = clients.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      (c.cpf && c.cpf.includes(term)) ||
      (c.phone && c.phone.includes(term)) ||
      (c.email && c.email.toLowerCase().includes(term))
    );
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Cabeçalho */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <span className="admin-brand-tag">BASE DE CLIENTES</span>
          <h2 style={{ fontSize: "28px", color: "var(--adm-wine)" }}>Clientes Cadastrados</h2>
          <p style={{ color: "var(--adm-text-muted)", fontSize: "14px", marginTop: "2px" }}>
            Cadastro centralizado de clientes. A partir daqui, você pode emitir o contrato oficial em um clique.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            className="adm-btn adm-btn-outline"
            onClick={fetchClients}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            <span>Atualizar</span>
          </button>

          <button
            type="button"
            className="adm-btn adm-btn-clay"
            onClick={openCreateModal}
          >
            <Plus size={16} />
            <span>Novo Cliente</span>
          </button>
        </div>
      </div>

      {/* Busca */}
      <div className="adm-card" style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Search size={18} color="var(--adm-clay)" />
          <input
            type="text"
            className="adm-input"
            style={{ width: "100%", maxWidth: "420px" }}
            placeholder="Buscar cliente por nome, CPF, WhatsApp ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabela de Clientes */}
      {loading ? (
        <div className="adm-card" style={{ padding: "60px 20px", textAlign: "center" }}>
          <Clock size={28} className="animate-spin" color="var(--adm-clay)" style={{ margin: "0 auto 12px" }} />
          <p style={{ color: "var(--adm-text-muted)" }}>Carregando clientes...</p>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="adm-card" style={{ padding: "60px 20px", textAlign: "center" }}>
          <Users size={38} color="var(--adm-clay)" style={{ margin: "0 auto 12px", opacity: 0.5 }} />
          <h3>Nenhum cliente cadastrado</h3>
          <p style={{ color: "var(--adm-text-muted)", fontSize: "14px", marginTop: "4px" }}>
            Converta um lead na aba <strong>Leads do Site</strong> ou clique em "Novo Cliente" acima.
          </p>
        </div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>CPF / Documento</th>
                <th>WhatsApp / Telefone</th>
                <th>E-mail</th>
                <th>Cadastro</th>
                <th>Contrato</th>
                <th style={{ textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => {
                const isHighlight = highlightClientId === client.id;

                return (
                  <tr
                    key={client.id}
                    style={{
                      background: isHighlight ? "rgba(247, 241, 221, 0.4)" : undefined,
                      transition: "background 0.3s ease"
                    }}
                  >
                    <td>
                      <strong style={{ fontSize: "14px", color: "var(--adm-wine)" }}>{client.name}</strong>
                      {client.notes && (
                        <div style={{ fontSize: "11px", color: "var(--adm-text-muted)", maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {client.notes}
                        </div>
                      )}
                    </td>

                    <td>
                      <span style={{ fontSize: "13px" }}>{client.cpf || "—"}</span>
                    </td>

                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <PhoneCall size={13} color="var(--adm-clay)" />
                        <span style={{ fontWeight: 600, fontSize: "13px" }}>{client.phone || client.whatsapp || "—"}</span>
                      </div>
                    </td>

                    <td>
                      <span style={{ fontSize: "13px", color: "var(--adm-text-muted)" }}>{client.email || "—"}</span>
                    </td>

                    <td>
                      <span style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                        {new Date(client.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="adm-btn adm-btn-clay adm-btn-sm"
                        onClick={() => handleGenerateContract(client)}
                        title="Emitir ou abrir contrato para este cliente"
                      >
                        <FileText size={13} />
                        <span>Gerar Contrato</span>
                      </button>
                    </td>

                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                        <button
                          type="button"
                          className="adm-btn adm-btn-outline adm-btn-sm"
                          onClick={() => openEditModal(client)}
                          title="Editar Cliente"
                        >
                          <Edit2 size={13} />
                        </button>

                        <button
                          type="button"
                          className="adm-btn adm-btn-outline adm-btn-sm"
                          style={{ color: "var(--adm-rose)" }}
                          onClick={() => handleDelete(client.id, client.name)}
                          title="Excluir Cliente"
                        >
                          <Trash2 size={13} />
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

      {/* Modal de Criação / Edição de Cliente */}
      {modalOpen && (
        <div className="adm-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div
            className="adm-modal-card"
            style={{ maxWidth: "520px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="adm-modal-header">
              <h3>{editingClient ? "Editar Cliente" : "Cadastrar Novo Cliente"}</h3>
              <button
                type="button"
                className="adm-btn adm-btn-icon adm-btn-outline"
                onClick={() => setModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="adm-modal-body" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label className="adm-label">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    className="adm-input"
                    placeholder="Ex: Carlos Eduardo de Oliveira"
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label className="adm-label">CPF / Documento</label>
                    <input
                      type="text"
                      className="adm-input"
                      placeholder="000.000.000-00"
                      value={formData.cpf || ""}
                      onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="adm-label">WhatsApp com DDI</label>
                    <input
                      type="text"
                      className="adm-input"
                      placeholder="+55 11 99999-9999"
                      value={formData.phone || ""}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="adm-label">E-mail</label>
                  <input
                    type="email"
                    className="adm-input"
                    placeholder="cliente@email.com"
                    value={formData.email || ""}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="adm-label">Hotel / Resort em Cancún</label>
                  <input
                    type="text"
                    className="adm-input"
                    placeholder="Ex: Riu Cancun, Secrets The Vine, Occidental..."
                    value={formData.default_hotel || ""}
                    onChange={(e) => setFormData({ ...formData, default_hotel: e.target.value })}
                  />
                </div>

                <div>
                  <label className="adm-label">Observações do Cliente</label>
                  <textarea
                    className="adm-textarea"
                    rows={2}
                    placeholder="Preferências, hotel habitual ou observações da negociação..."
                    value={formData.notes || ""}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="adm-modal-footer">
                <button
                  type="button"
                  className="adm-btn adm-btn-outline"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="adm-btn adm-btn-clay"
                  disabled={saving}
                >
                  {saving ? "Salvando..." : editingClient ? "Salvar Alterações" : "Criar Cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminClientsPage() {
  return (
    <Suspense fallback={<div className="adm-card" style={{ padding: "40px", textAlign: "center" }}>Carregando clientes...</div>}>
      <ClientsContent />
    </Suspense>
  );
}
