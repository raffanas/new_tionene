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
  ShieldCheck,
  Eye,
  Calendar,
  MapPin,
  Plane,
  Building,
  DollarSign,
  MessageCircle,
  FilePlus,
  Sparkles,
} from "lucide-react";
import { useAuthProfile } from "@/lib/auth/AuthContext";

interface ContractItemData {
  id: string;
  tour_name_snapshot: string;
  tour_date: string;
  adults_count: number;
  children_count: number;
  sale_price: number;
  cost_applied?: number;
  supplier_name_snapshot?: string | null;
  status?: string | null;
}

interface ClientContract {
  id: string;
  contract_number: string;
  status: string;
  arrival_date: string;
  departure_date?: string | null;
  arrival_flight_number?: string | null;
  arrival_flight_time?: string | null;
  depart_flight_number?: string | null;
  depart_flight_time?: string | null;
  hotels_schedule?: Array<{ hotel_name?: string; checkin?: string; checkout?: string }>;
  deposit_amount?: number;
  deposit_observation?: string | null;
  balance_amount?: number;
  balance_observation?: string | null;
  total_amount: number;
  currency: string;
  created_at: string;
  contract_items?: ContractItemData[];
}

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
  contracts?: ClientContract[];
}

function ClientsContent() {
  const { role, hasPermission } = useAuthProfile();
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightClientId = searchParams?.get("clientId");

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal de Criação / Edição Cadastral de Cliente
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [saving, setSaving] = useState(false);

  // Modal da Ficha Completa do Cliente (Histórico 360°, Contratos e Passeios)
  const [sheetClient, setSheetClient] = useState<Client | null>(null);

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
        .select(`
          *,
          contracts (
            id,
            contract_number,
            status,
            arrival_date,
            departure_date,
            arrival_flight_number,
            arrival_flight_time,
            depart_flight_number,
            depart_flight_time,
            hotels_schedule,
            deposit_amount,
            deposit_observation,
            balance_amount,
            balance_observation,
            total_amount,
            currency,
            created_at,
            contract_items (
              id,
              tour_name_snapshot,
              tour_date,
              adults_count,
              children_count,
              sale_price,
              cost_applied,
              supplier_name_snapshot,
              status
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Erro ao buscar clientes:", error.message);
        setClients([]);
      } else if (data) {
        const processed: Client[] = (data as any[]).map((c) => ({
          ...c,
          contracts: (c.contracts || []).sort(
            (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          ),
        }));
        setClients(processed);

        // Se veio highlightClientId na URL, abrir automaticamente a ficha do cliente
        if (highlightClientId) {
          const target = processed.find((item) => item.id === highlightClientId);
          if (target) {
            setSheetClient(target);
          }
        }
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
      await fetchClients();
    } catch (err: any) {
      alert("Erro ao salvar cliente: " + (err.message || "Tente novamente"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!hasPermission("contracts:delete")) {
      alert("Operação restrita: apenas administradores podem excluir clientes.");
      return;
    }
    if (!confirm(`Deseja realmente remover o cliente "${name}"? Os contratos associados serão mantidos.`)) return;

    try {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
      if (sheetClient?.id === id) setSheetClient(null);
      fetchClients();
    } catch (err: any) {
      alert("Erro ao excluir: " + (err.message || "Erro"));
    }
  };

  // Gerar Primeiro Contrato para cliente que ainda não possui
  const handleGenerateContract = (client: Client) => {
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

  // Emitir Novo Contrato para uma Nova Viagem (mantendo anteriores intactos!)
  const handleNewTrip = (client: Client) => {
    const params = new URLSearchParams({
      clientId: client.id,
      clientName: client.name,
      clientPhone: client.phone || client.whatsapp || "",
      clientCpf: client.cpf || "",
      clientEmail: client.email || "",
      autoOpen: "true",
      newTrip: "true",
    });
    router.push(`/admin/contratos?${params.toString()}`);
  };

  // Abrir Ficha do Cliente
  const openClientSheet = (client: Client) => {
    const found = clients.find((c) => c.id === client.id) || client;
    setSheetClient(found);
  };

  // Link para WhatsApp
  const openWhatsApp = (phone?: string | null) => {
    if (!phone) return;
    const clean = phone.replace(/\D/g, "");
    if (clean) {
      window.open(`https://wa.me/${clean}`, "_blank");
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const filteredClients = clients.filter((c) => {
    const term = searchTerm.toLowerCase();
    const hasContractMatch = c.contracts?.some((ct) => ct.contract_number.toLowerCase().includes(term));
    return (
      c.name.toLowerCase().includes(term) ||
      (c.cpf && c.cpf.includes(term)) ||
      (c.phone && c.phone.includes(term)) ||
      (c.email && c.email.toLowerCase().includes(term)) ||
      hasContractMatch
    );
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Cabeçalho */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <span className="admin-brand-tag">BASE DE CLIENTES</span>
          <h2 style={{ fontSize: "28px", color: "var(--adm-wine)" }}>Clientes & Histórico de Viagens</h2>
          <p style={{ color: "var(--adm-text-muted)", fontSize: "14px", marginTop: "2px" }}>
            Ficha individual de clientes com histórico de todos os contratos, viagens, voos e passeios contratados.
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
            style={{ width: "100%", maxWidth: "460px" }}
            placeholder="Buscar por nome, CPF, WhatsApp, e-mail ou nº do contrato..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabela de Clientes */}
      {loading ? (
        <div className="adm-card" style={{ padding: "60px 20px", textAlign: "center" }}>
          <Clock size={28} className="animate-spin" color="var(--adm-clay)" style={{ margin: "0 auto 12px" }} />
          <p style={{ color: "var(--adm-text-muted)" }}>Carregando clientes e histórico...</p>
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
                <th>Contratos / Viagens</th>
                <th style={{ textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => {
                const isHighlight = highlightClientId === client.id;
                const contracts = client.contracts || [];

                return (
                  <tr
                    key={client.id}
                    style={{
                      background: isHighlight ? "rgba(247, 241, 221, 0.45)" : undefined,
                      transition: "background 0.3s ease"
                    }}
                  >
                    <td>
                      <button
                        type="button"
                        onClick={() => openClientSheet(client)}
                        style={{
                          background: "none",
                          border: "none",
                          padding: 0,
                          textAlign: "left",
                          cursor: "pointer",
                          display: "block"
                        }}
                        title="Clique para abrir a Ficha Completa deste cliente"
                      >
                        <strong style={{ fontSize: "14px", color: "var(--adm-wine)", textDecoration: "underline", textDecorationColor: "var(--adm-clay)" }}>
                          {client.name}
                        </strong>
                      </button>
                      {client.default_hotel && (
                        <div style={{ fontSize: "11px", color: "var(--adm-clay)", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                          <Building size={11} />
                          <span>{client.default_hotel}</span>
                        </div>
                      )}
                      {client.notes && (
                        <div style={{ fontSize: "11px", color: "var(--adm-text-muted)", maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
                      {contracts.length === 0 ? (
                        <button
                          type="button"
                          className="adm-btn adm-btn-clay adm-btn-sm"
                          onClick={() => handleGenerateContract(client)}
                          title="Emitir o primeiro contrato para este cliente"
                        >
                          <FileText size={13} />
                          <span>Gerar Contrato</span>
                        </button>
                      ) : contracts.length === 1 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <button
                            type="button"
                            onClick={() => router.push(`/admin/contratos?openContractId=${contracts[0].id}`)}
                            className="adm-btn adm-btn-outline adm-btn-sm"
                            style={{
                              borderColor: "var(--adm-clay)",
                              color: "var(--adm-wine)",
                              fontWeight: 700,
                              justifyContent: "flex-start",
                              padding: "4px 8px",
                              fontSize: "12px",
                            }}
                            title="Abrir este contrato para ver ou editar"
                          >
                            <FileText size={12} color="var(--adm-clay)" />
                            <span>{contracts[0].contract_number}</span>
                            <span
                              className={`adm-badge ${contracts[0].status === "emitido" ? "badge-blue" : contracts[0].status === "assinado" ? "badge-green" : "badge-amber"}`}
                              style={{ fontSize: "9px", padding: "1px 5px", marginLeft: "auto" }}
                            >
                              {contracts[0].status}
                            </span>
                          </button>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px" }}>
                            <button
                              type="button"
                              onClick={() => openClientSheet(client)}
                              style={{ background: "none", border: "none", padding: 0, color: "var(--adm-clay)", cursor: "pointer", textDecoration: "underline" }}
                            >
                              Ver Ficha
                            </button>
                            <span style={{ color: "var(--adm-border)" }}>•</span>
                            <button
                              type="button"
                              onClick={() => handleNewTrip(client)}
                              style={{ background: "none", border: "none", padding: 0, color: "var(--adm-emerald)", cursor: "pointer", fontWeight: 600 }}
                              title="Emitir um contrato adicional para outra viagem deste cliente"
                            >
                              + Nova Viagem
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <button
                            type="button"
                            onClick={() => openClientSheet(client)}
                            className="adm-btn adm-btn-sm"
                            style={{
                              background: "var(--adm-wine)",
                              color: "#fff",
                              fontWeight: 600,
                              justifyContent: "flex-start",
                              padding: "4px 8px",
                              fontSize: "12px",
                            }}
                            title="Ver histórico de todos os contratos deste cliente"
                          >
                            <FileText size={12} color="var(--adm-gold)" />
                            <span>{contracts.length} Contratos / Viagens</span>
                          </button>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px" }}>
                            <span style={{ color: "var(--adm-text-muted)" }}>
                              Último: {contracts[0].contract_number}
                            </span>
                            <span style={{ color: "var(--adm-border)" }}>•</span>
                            <button
                              type="button"
                              onClick={() => handleNewTrip(client)}
                              style={{ background: "none", border: "none", padding: 0, color: "var(--adm-emerald)", cursor: "pointer", fontWeight: 600 }}
                              title="Emitir um contrato adicional para outra viagem deste cliente"
                            >
                              + Nova Viagem
                            </button>
                          </div>
                        </div>
                      )}
                    </td>

                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                        <button
                          type="button"
                          className="adm-btn adm-btn-outline adm-btn-sm"
                          style={{ color: "var(--adm-wine)", borderColor: "var(--adm-clay)" }}
                          onClick={() => openClientSheet(client)}
                          title="Abrir Ficha Completa do Cliente (Histórico, Contratos e Passeios)"
                        >
                          <Eye size={13} />
                          <span>Ficha</span>
                        </button>

                        <button
                          type="button"
                          className="adm-btn adm-btn-outline adm-btn-sm"
                          onClick={() => openEditModal(client)}
                          title="Editar Cadastro do Cliente"
                        >
                          <Edit2 size={13} />
                        </button>

                        {hasPermission("contracts:delete") && (
                          <button
                            type="button"
                            className="adm-btn adm-btn-outline adm-btn-sm"
                            style={{ color: "var(--adm-rose)" }}
                            onClick={() => handleDelete(client.id, client.name)}
                            title="Excluir Cliente"
                          >
                            <Trash2 size={13} />
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
      )}

      {/* =========================================================================
          MODAL: FICHA COMPLETA DO CLIENTE (HISTÓRICO 360°, CONTRATOS & PASSEIOS)
         ========================================================================= */}
      {sheetClient && (
        <div className="adm-modal-backdrop" onClick={() => setSheetClient(null)}>
          <div
            className="adm-modal-card"
            style={{ maxWidth: "940px", maxHeight: "92vh", overflowY: "auto", padding: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header da Ficha */}
            <div
              className="adm-modal-header"
              style={{
                background: "var(--adm-surface-alt)",
                padding: "20px 26px",
                borderBottom: "1px solid var(--adm-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "14px"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    background: "var(--adm-wine)",
                    color: "#fff",
                    border: "2px solid var(--adm-gold)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                  }}
                >
                  {getInitials(sheetClient.name)}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <h3 style={{ fontSize: "22px", color: "var(--adm-wine)", margin: 0 }}>
                      {sheetClient.name}
                    </h3>
                    <span className="adm-badge badge-clay" style={{ fontSize: "10px" }}>
                      CLIENTE DA AGÊNCIA
                    </span>
                  </div>
                  <p style={{ fontSize: "12px", color: "var(--adm-text-muted)", margin: "3px 0 0" }}>
                    Cadastrado em {new Date(sheetClient.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="adm-btn adm-btn-icon adm-btn-outline"
                onClick={() => setSheetClient(null)}
              >
                <X size={16} />
              </button>
            </div>

            {/* Barra de Ações Rápidas */}
            <div
              style={{
                padding: "12px 26px",
                background: "rgba(61, 24, 31, 0.03)",
                borderBottom: "1px solid var(--adm-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <button
                type="button"
                className="adm-btn adm-btn-clay adm-btn-sm"
                onClick={() => handleNewTrip(sheetClient)}
                title="Emitir um contrato adicional para este cliente mantendo os anteriores intactos"
              >
                <Plus size={14} />
                <span>+ Emitir Novo Contrato (Nova Viagem)</span>
              </button>

              <div style={{ display: "flex", gap: "8px" }}>
                {(sheetClient.phone || sheetClient.whatsapp) && (
                  <button
                    type="button"
                    className="adm-btn adm-btn-outline adm-btn-sm"
                    style={{ color: "#16a34a", borderColor: "rgba(22, 163, 74, 0.3)" }}
                    onClick={() => openWhatsApp(sheetClient.phone || sheetClient.whatsapp)}
                    title="Iniciar conversa no WhatsApp"
                  >
                    <MessageCircle size={14} />
                    <span>WhatsApp</span>
                  </button>
                )}

                <button
                  type="button"
                  className="adm-btn adm-btn-outline adm-btn-sm"
                  onClick={() => {
                    const c = sheetClient;
                    setSheetClient(null);
                    openEditModal(c);
                  }}
                  title="Editar dados cadastrais deste cliente"
                >
                  <Edit2 size={13} />
                  <span>Editar Cadastro</span>
                </button>
              </div>
            </div>

            {/* Corpo da Ficha */}
            <div className="adm-modal-body" style={{ padding: "26px", display: "flex", flexDirection: "column", gap: "22px" }}>
              {/* Cards de Métricas do Cliente */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "14px",
                }}
              >
                <div className="adm-kpi-card" style={{ padding: "16px" }}>
                  <div className="adm-kpi-header">
                    <span>Viagens / Contratos</span>
                    <FileText size={16} color="var(--adm-clay)" />
                  </div>
                  <div className="adm-kpi-value" style={{ fontSize: "24px" }}>
                    {sheetClient.contracts?.length || 0}
                  </div>
                  <div className="adm-kpi-desc">Contrato(s) emitido(s)</div>
                </div>

                <div className="adm-kpi-card" style={{ padding: "16px" }}>
                  <div className="adm-kpi-header">
                    <span>Total Investido</span>
                    <DollarSign size={16} color="var(--adm-emerald)" />
                  </div>
                  <div className="adm-kpi-value" style={{ fontSize: "24px", color: "var(--adm-emerald)" }}>
                    R$ {(sheetClient.contracts || [])
                      .reduce((acc, c) => acc + Number(c.total_amount || 0), 0)
                      .toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </div>
                  <div className="adm-kpi-desc">Soma de todas as viagens</div>
                </div>

                <div className="adm-kpi-card" style={{ padding: "16px" }}>
                  <div className="adm-kpi-header">
                    <span>Passeios Contratados</span>
                    <Sparkles size={16} color="var(--adm-gold)" />
                  </div>
                  <div className="adm-kpi-value" style={{ fontSize: "24px" }}>
                    {(sheetClient.contracts || []).reduce((acc, c) => acc + (c.contract_items?.length || 0), 0)}
                  </div>
                  <div className="adm-kpi-desc">Total de experiências</div>
                </div>

                <div className="adm-kpi-card" style={{ padding: "16px" }}>
                  <div className="adm-kpi-header">
                    <span>Hotel Habitual</span>
                    <Building size={16} color="var(--adm-wine)" />
                  </div>
                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: 700,
                      color: "var(--adm-wine)",
                      marginTop: "6px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={sheetClient.default_hotel || "Não informado"}
                  >
                    {sheetClient.default_hotel || "Não informado"}
                  </div>
                  <div className="adm-kpi-desc">Resort preferido</div>
                </div>
              </div>

              {/* Informações Cadastrais Detalhadas */}
              <div
                style={{
                  background: "var(--adm-surface-alt)",
                  border: "1px solid var(--adm-border)",
                  borderRadius: "12px",
                  padding: "18px 20px",
                }}
              >
                <h4 style={{ fontSize: "14px", color: "var(--adm-wine)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Dados de Contato & Negociação
                </h4>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px", fontSize: "13px" }}>
                  <div>
                    <span style={{ color: "var(--adm-text-muted)", display: "block", fontSize: "11px" }}>CPF / Passaporte:</span>
                    <strong>{sheetClient.cpf || "Não informado"}</strong>
                  </div>

                  <div>
                    <span style={{ color: "var(--adm-text-muted)", display: "block", fontSize: "11px" }}>Telefone / WhatsApp:</span>
                    <strong>{sheetClient.phone || sheetClient.whatsapp || "Não informado"}</strong>
                  </div>

                  <div>
                    <span style={{ color: "var(--adm-text-muted)", display: "block", fontSize: "11px" }}>E-mail:</span>
                    <strong>{sheetClient.email || "Não informado"}</strong>
                  </div>
                </div>

                {sheetClient.notes && (
                  <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px dashed var(--adm-border)" }}>
                    <span style={{ color: "var(--adm-text-muted)", display: "block", fontSize: "11px", marginBottom: "4px" }}>
                      Observações & Roteiro Inicial:
                    </span>
                    <p style={{ margin: 0, fontSize: "12px", color: "var(--adm-text-main)", whiteSpace: "pre-wrap", background: "#fff", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--adm-border)" }}>
                      {sheetClient.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Seção de Contratos e Viagens */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <h3 style={{ fontSize: "18px", color: "var(--adm-wine)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                      <FileText size={18} color="var(--adm-clay)" />
                      <span>Histórico de Viagens e Contratos ({sheetClient.contracts?.length || 0})</span>
                    </h3>
                    <p style={{ fontSize: "12px", color: "var(--adm-text-muted)", margin: "2px 0 0" }}>
                      Todos os pacotes emitidos, voos, hotéis e passeios da história deste cliente.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="adm-btn adm-btn-clay adm-btn-sm"
                    onClick={() => handleNewTrip(sheetClient)}
                  >
                    <Plus size={13} />
                    <span>Nova Viagem</span>
                  </button>
                </div>

                {(!sheetClient.contracts || sheetClient.contracts.length === 0) ? (
                  <div
                    style={{
                      padding: "40px 20px",
                      textAlign: "center",
                      background: "var(--adm-surface-alt)",
                      border: "1px dashed var(--adm-border)",
                      borderRadius: "12px",
                    }}
                  >
                    <FileText size={32} color="var(--adm-clay)" style={{ margin: "0 auto 10px", opacity: 0.6 }} />
                    <h4 style={{ color: "var(--adm-wine)", marginBottom: "4px" }}>Nenhum contrato emitido para este cliente</h4>
                    <p style={{ fontSize: "13px", color: "var(--adm-text-muted)", marginBottom: "16px" }}>
                      Gere o primeiro contrato oficial com roteiro, voos e passeios.
                    </p>
                    <button
                      type="button"
                      className="adm-btn adm-btn-clay adm-btn-sm"
                      onClick={() => handleGenerateContract(sheetClient)}
                    >
                      <Plus size={14} />
                      <span>Emitir Primeiro Contrato</span>
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {sheetClient.contracts.map((c, cIdx) => {
                      const items = c.contract_items || [];
                      const arrivalStr = c.arrival_date ? new Date(c.arrival_date + "T12:00:00").toLocaleDateString("pt-BR") : "—";
                      const departStr = c.departure_date ? new Date(c.departure_date + "T12:00:00").toLocaleDateString("pt-BR") : "—";

                      return (
                        <div
                          key={c.id}
                          style={{
                            background: "#fff",
                            border: "1px solid var(--adm-border)",
                            borderRadius: "14px",
                            padding: "20px",
                            boxShadow: "0 2px 8px rgba(61, 24, 31, 0.04)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "16px",
                          }}
                        >
                          {/* Topo do Contrato */}
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              flexWrap: "wrap",
                              gap: "12px",
                              paddingBottom: "14px",
                              borderBottom: "1px solid var(--adm-border)",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                              <span
                                style={{
                                  background: "var(--adm-wine)",
                                  color: "#fff",
                                  fontSize: "12px",
                                  fontWeight: 700,
                                  padding: "3px 8px",
                                  borderRadius: "6px",
                                }}
                              >
                                #{sheetClient.contracts!.length - cIdx}
                              </span>
                              <strong style={{ fontSize: "17px", color: "var(--adm-wine)" }}>
                                {c.contract_number}
                              </strong>
                              <span
                                className={`adm-badge ${c.status === "emitido" ? "badge-blue" : c.status === "assinado" ? "badge-green" : "badge-amber"}`}
                              >
                                {c.status}
                              </span>
                              <span style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                                Emitido em {new Date(c.created_at).toLocaleDateString("pt-BR")}
                              </span>
                            </div>

                            <div style={{ display: "flex", gap: "8px" }}>
                              <button
                                type="button"
                                className="adm-btn adm-btn-outline adm-btn-sm"
                                onClick={() => router.push(`/admin/contratos?openContractId=${c.id}&print=true`)}
                                title="Visualizar e Imprimir Contrato em PDF"
                              >
                                <Eye size={13} />
                                <span>Ver / Imprimir (PDF)</span>
                              </button>

                              <button
                                type="button"
                                className="adm-btn adm-btn-primary adm-btn-sm"
                                onClick={() => router.push(`/admin/contratos?openContractId=${c.id}`)}
                                title="Editar dados e passeios deste contrato"
                              >
                                <Edit2 size={13} />
                                <span>Editar Contrato</span>
                              </button>
                            </div>
                          </div>

                          {/* Dados da Viagem e Financeiro */}
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                              gap: "14px",
                              background: "var(--adm-surface-alt)",
                              padding: "14px 16px",
                              borderRadius: "10px",
                              fontSize: "13px",
                            }}
                          >
                            <div>
                              <span style={{ color: "var(--adm-text-muted)", fontSize: "11px", display: "block" }}>
                                Período em Cancún:
                              </span>
                              <strong>{arrivalStr}</strong> até <strong>{departStr}</strong>
                            </div>

                            <div>
                              <span style={{ color: "var(--adm-text-muted)", fontSize: "11px", display: "block" }}>
                                Voos Chegada / Partida:
                              </span>
                              <span>
                                {c.arrival_flight_number ? `${c.arrival_flight_number} (${c.arrival_flight_time || "—"})` : "Sem voo cadastrado"}
                              </span>
                            </div>

                            <div>
                              <span style={{ color: "var(--adm-text-muted)", fontSize: "11px", display: "block" }}>
                                Hotel / Resort:
                              </span>
                              <strong>{c.hotels_schedule?.[0]?.hotel_name || sheetClient.default_hotel || "A definir"}</strong>
                            </div>

                            <div>
                              <span style={{ color: "var(--adm-text-muted)", fontSize: "11px", display: "block" }}>
                                Condições Financeiras:
                              </span>
                              <div>
                                <strong style={{ color: "var(--adm-wine)" }}>
                                  Total: R$ {Number(c.total_amount || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                </strong>
                              </div>
                              <div style={{ fontSize: "11px", color: "var(--adm-text-muted)", marginTop: "2px" }}>
                                Sinal: R$ {Number(c.deposit_amount || 0).toLocaleString("pt-BR")} | Saldo: R$ {Number(c.balance_amount || 0).toLocaleString("pt-BR")}
                              </div>
                            </div>
                          </div>

                          {/* Passeios Inclusos neste Contrato */}
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                              <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--adm-wine)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                Passeios Inclusos neste Pacote ({items.length})
                              </span>
                            </div>

                            {items.length === 0 ? (
                              <p style={{ margin: 0, fontSize: "12px", color: "var(--adm-text-muted)", fontStyle: "italic" }}>
                                Nenhum passeio individual vinculado neste contrato.
                              </p>
                            ) : (
                              <div style={{ overflowX: "auto" }}>
                                <table className="adm-table" style={{ fontSize: "12px" }}>
                                  <thead>
                                    <tr>
                                      <th style={{ padding: "8px 12px" }}>Data</th>
                                      <th style={{ padding: "8px 12px" }}>Passeio</th>
                                      <th style={{ padding: "8px 12px" }}>Passageiros</th>
                                      <th style={{ padding: "8px 12px" }}>Fornecedor</th>
                                      <th style={{ padding: "8px 12px", textAlign: "right" }}>Valor Venda</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {items.map((it) => (
                                      <tr key={it.id}>
                                        <td style={{ padding: "8px 12px", whiteSpace: "nowrap" }}>
                                          {it.tour_date ? new Date(it.tour_date + "T12:00:00").toLocaleDateString("pt-BR") : "—"}
                                        </td>
                                        <td style={{ padding: "8px 12px" }}>
                                          <strong>{it.tour_name_snapshot}</strong>
                                        </td>
                                        <td style={{ padding: "8px 12px", whiteSpace: "nowrap" }}>
                                          {it.adults_count} ad.{it.children_count > 0 ? ` + ${it.children_count} ch.` : ""}
                                        </td>
                                        <td style={{ padding: "8px 12px", color: "var(--adm-text-muted)" }}>
                                          {it.supplier_name_snapshot || "Operador Local"}
                                        </td>
                                        <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600 }}>
                                          R$ {Number(it.sale_price || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Rodapé da Ficha */}
            <div className="adm-modal-footer" style={{ display: "flex", justifyContent: "space-between" }}>
              <button
                type="button"
                className="adm-btn adm-btn-outline"
                onClick={() => setSheetClient(null)}
              >
                Fechar Ficha
              </button>

              <button
                type="button"
                className="adm-btn adm-btn-clay"
                onClick={() => handleNewTrip(sheetClient)}
              >
                <Plus size={15} />
                <span>+ Emitir Novo Contrato (Outra Viagem)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL DE CADASTRO / EDIÇÃO DE DADOS DO CLIENTE
         ========================================================================= */}
      {modalOpen && (
        <div className="adm-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div
            className="adm-modal-card"
            style={{ maxWidth: "520px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="adm-modal-header">
              <h3>{editingClient ? "Editar Cadastro de Cliente" : "Cadastrar Novo Cliente"}</h3>
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
                  <label className="adm-label">Hotel / Resort Habitual em Cancún</label>
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
