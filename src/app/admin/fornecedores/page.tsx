"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Truck,
  Search,
  Plus,
  Edit2,
  Trash2,
  PhoneCall,
  Mail,
  Building2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  X,
  DollarSign,
  AlertCircle,
  Tag
} from "lucide-react";

interface Supplier {
  id: string;
  name: string;
  trade_name?: string | null;
  contact_name?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  category?: string | null;
  currency_default: "BRL" | "USD" | "MXN";
  payment_terms?: string | null;
  notes?: string | null;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

const CATEGORIES = [
  "Todos",
  "Passeios & Atrações",
  "Parques Temáticos",
  "Transporte & Privativo",
  "Operadora Náutica & Passeios",
  "Vida Noturna & Shows",
  "Arqueologia & Cultura",
  "Locação de Veículos",
  "Outros",
];

const DEFAULT_SUPPLIERS: Partial<Supplier>[] = [
  {
    name: "Grupo Xcaret",
    trade_name: "Xcaret Parques",
    category: "Parques Temáticos",
    currency_default: "USD",
    notes: "Parques Xcaret, Xel-Há, Xplor, Xenotes e Xoximilco.",
    active: true,
  },
  {
    name: "Envatours",
    trade_name: "Envatours Cancún",
    category: "Operadora Náutica & Passeios",
    currency_default: "BRL",
    notes: "Passeios de catamarã, Isla Mujeres e Cozumel.",
    active: true,
  },
  {
    name: "The Dolphin Company",
    trade_name: "Dolphin Discovery",
    category: "Passeios & Atrações",
    currency_default: "USD",
    notes: "Nado com golfinhos em Isla Mujeres, Cozumel e Maroma.",
    active: true,
  },
  {
    name: "Neftali Transportes",
    trade_name: "Neftali Transfers",
    category: "Transporte & Privativo",
    currency_default: "USD",
    notes: "Transfers privativos de aeroporto e vans com motorista.",
    active: true,
  },
  {
    name: "Coco Bongo",
    trade_name: "Coco Bongo Show & Disco",
    category: "Vida Noturna & Shows",
    currency_default: "USD",
    notes: "Ingressos regulares, Gold Member e Front Row.",
    active: true,
  },
  {
    name: "Baktun Tours",
    trade_name: "Baktun Operadora",
    category: "Arqueologia & Cultura",
    currency_default: "BRL",
    notes: "Tours arqueológicos para Chichén Itzá, Tulum e Cobá.",
    active: true,
  },
];

export default function AdminSuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todos");
  const [tableMissing, setTableMissing] = useState(false);

  // Modal de Criação / Edição
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<Partial<Supplier>>({
    name: "",
    trade_name: "",
    contact_name: "",
    phone: "",
    whatsapp: "",
    email: "",
    category: "Passeios & Atrações",
    currency_default: "BRL",
    payment_terms: "",
    notes: "",
    active: true,
  });

  const fetchSuppliers = async () => {
    setLoading(true);
    setTableMissing(false);
    try {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        if (error.code === "42P01") {
          // Tabela ainda não existe no banco
          setTableMissing(true);
          setSuppliers(DEFAULT_SUPPLIERS as Supplier[]);
        } else {
          console.error("Erro ao carregar fornecedores:", error);
        }
      } else if (data && data.length > 0) {
        setSuppliers(data as Supplier[]);
      } else {
        // Tabela vazia
        setSuppliers(DEFAULT_SUPPLIERS as Supplier[]);
      }
    } catch (err) {
      console.error("Erro inesperado:", err);
      setSuppliers(DEFAULT_SUPPLIERS as Supplier[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const openCreateModal = () => {
    setEditingSupplier(null);
    setFormData({
      name: "",
      trade_name: "",
      contact_name: "",
      phone: "",
      whatsapp: "",
      email: "",
      category: "Passeios & Atrações",
      currency_default: "BRL",
      payment_terms: "",
      notes: "",
      active: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({ ...supplier });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    setSaving(true);
    try {
      if (editingSupplier?.id) {
        // Atualizar
        const { error } = await supabase
          .from("suppliers")
          .update({
            name: formData.name,
            trade_name: formData.trade_name || null,
            contact_name: formData.contact_name || null,
            phone: formData.phone || null,
            whatsapp: formData.whatsapp || null,
            email: formData.email || null,
            category: formData.category || "Passeios & Atrações",
            currency_default: formData.currency_default || "BRL",
            payment_terms: formData.payment_terms || null,
            notes: formData.notes || null,
            active: formData.active ?? true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingSupplier.id);

        if (error) throw error;
      } else {
        // Criar
        const { error } = await supabase.from("suppliers").insert([
          {
            name: formData.name,
            trade_name: formData.trade_name || null,
            contact_name: formData.contact_name || null,
            phone: formData.phone || null,
            whatsapp: formData.whatsapp || null,
            email: formData.email || null,
            category: formData.category || "Passeios & Atrações",
            currency_default: formData.currency_default || "BRL",
            payment_terms: formData.payment_terms || null,
            notes: formData.notes || null,
            active: formData.active ?? true,
          },
        ]);

        if (error) throw error;
      }

      setModalOpen(false);
      fetchSuppliers();
    } catch (err: any) {
      alert("Erro ao salvar fornecedor: " + (err.message || "Tente novamente"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Deseja realmente remover o fornecedor "${name}"?`)) return;

    try {
      const { error } = await supabase.from("suppliers").delete().eq("id", id);
      if (error) throw error;
      fetchSuppliers();
    } catch (err: any) {
      alert("Erro ao excluir: " + (err.message || "Erro desconhecido"));
    }
  };

  const filteredSuppliers = suppliers.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.trade_name && s.trade_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.contact_name && s.contact_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      categoryFilter === "Todos" || s.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Aviso se a tabela ainda não tiver sido criada no Supabase */}
      {tableMissing && (
        <div
          style={{
            background: "var(--adm-amber-bg)",
            border: "1px solid rgba(180, 83, 9, 0.3)",
            borderRadius: "14px",
            padding: "16px 20px",
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
            color: "var(--adm-amber)"
          }}
        >
          <AlertCircle size={22} style={{ flexShrink: 0, marginTop: "2px" }} />
          <div>
            <strong style={{ display: "block", fontSize: "15px", marginBottom: "4px" }}>
              Tabela de Fornecedores não criada no Supabase
            </strong>
            <span style={{ fontSize: "13px", lineHeight: 1.5, opacity: 0.9 }}>
              Execute o arquivo <code>supabase/backoffice_v1_schema.sql</code> no SQL Editor do Supabase para ativar a persistência definitiva.
              Exibindo dados de referência abaixo.
            </span>
          </div>
        </div>
      )}

      {/* Cabeçalho da Página */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <span className="admin-brand-tag">CADASTROS CENTRAIS</span>
          <h2 style={{ fontSize: "28px", color: "var(--adm-wine)" }}>Fornecedores & Operadores Locais</h2>
          <p style={{ color: "var(--adm-text-muted)", fontSize: "14px", marginTop: "2px" }}>
            Gerencie operadoras, embarcações, parques e regras de custos para cálculo automático de contratos.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            className="adm-btn adm-btn-outline"
            onClick={fetchSuppliers}
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
            <span>Novo Fornecedor</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div
        className="adm-card"
        style={{
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: "260px" }}>
          <Search size={18} color="var(--adm-clay)" />
          <input
            type="text"
            className="adm-input"
            style={{ width: "100%", maxWidth: "380px" }}
            placeholder="Buscar por nome, contato ou operadora..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--adm-text-muted)" }}>Categoria:</span>
          <select
            className="adm-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ width: "auto" }}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid de Fornecedores */}
      {loading ? (
        <div className="adm-card" style={{ padding: "60px 20px", textAlign: "center" }}>
          <RefreshCw size={28} className="animate-spin" color="var(--adm-clay)" style={{ margin: "0 auto 12px" }} />
          <p style={{ color: "var(--adm-text-muted)" }}>Carregando fornecedores...</p>
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <div className="adm-card" style={{ padding: "60px 20px", textAlign: "center" }}>
          <Building2 size={36} color="var(--adm-clay)" style={{ margin: "0 auto 12px", opacity: 0.5 }} />
          <h3>Nenhum fornecedor encontrado</h3>
          <p style={{ color: "var(--adm-text-muted)", fontSize: "14px", marginTop: "4px" }}>
            Tente mudar os termos de busca ou adicione um novo fornecedor.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "18px" }}>
          {filteredSuppliers.map((supplier, idx) => (
            <div
              key={supplier.id || idx}
              className="adm-card"
              style={{
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                position: "relative",
                transition: "transform 0.2s ease, box-shadow 0.2s ease"
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: "var(--adm-clay)",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                    >
                      <Tag size={12} />
                      {supplier.category || "Geral"}
                    </span>
                    <h3 style={{ fontSize: "18px", color: "var(--adm-wine)", marginTop: "4px" }}>
                      {supplier.name}
                    </h3>
                    {supplier.trade_name && supplier.trade_name !== supplier.name && (
                      <span style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                        {supplier.trade_name}
                      </span>
                    )}
                  </div>

                  <span
                    className={`adm-badge ${supplier.active ? "badge-green" : "badge-rose"}`}
                    style={{ fontSize: "11px" }}
                  >
                    {supplier.active ? "Ativo" : "Inativo"}
                  </span>
                </div>

                {/* Moeda & Contato */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", margin: "14px 0", fontSize: "13px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--adm-text-main)" }}>
                    <DollarSign size={14} color="var(--adm-gold)" />
                    <span>
                      Moeda Padrão: <strong>{supplier.currency_default || "BRL"}</strong>
                    </span>
                  </div>

                  {(supplier.whatsapp || supplier.phone) && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--adm-text-muted)" }}>
                      <PhoneCall size={14} color="var(--adm-clay)" />
                      <span>{supplier.whatsapp || supplier.phone}</span>
                    </div>
                  )}

                  {supplier.email && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--adm-text-muted)" }}>
                      <Mail size={14} color="var(--adm-clay)" />
                      <span>{supplier.email}</span>
                    </div>
                  )}

                  {supplier.notes && (
                    <p
                      style={{
                        fontSize: "12px",
                        color: "var(--adm-text-muted)",
                        background: "var(--adm-surface-alt)",
                        padding: "8px 10px",
                        borderRadius: "8px",
                        border: "1px solid var(--adm-border)",
                        marginTop: "4px",
                        lineHeight: 1.4
                      }}
                    >
                      {supplier.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Ações */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "8px",
                  paddingTop: "14px",
                  borderTop: "1px solid var(--adm-border)",
                  marginTop: "12px"
                }}
              >
                <button
                  type="button"
                  className="adm-btn adm-btn-outline adm-btn-sm"
                  onClick={() => openEditModal(supplier)}
                  title="Editar Fornecedor"
                >
                  <Edit2 size={13} />
                  <span>Editar</span>
                </button>

                {supplier.id && (
                  <button
                    type="button"
                    className="adm-btn adm-btn-outline adm-btn-sm"
                    style={{ color: "var(--adm-rose)" }}
                    onClick={() => handleDelete(supplier.id, supplier.name)}
                    title="Excluir Fornecedor"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Criação / Edição */}
      {modalOpen && (
        <div className="adm-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div
            className="adm-modal-card"
            style={{ maxWidth: "560px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="adm-modal-header">
              <h3>{editingSupplier ? "Editar Fornecedor" : "Cadastrar Novo Fornecedor"}</h3>
              <button
                type="button"
                className="adm-btn adm-btn-icon adm-btn-outline"
                onClick={() => setModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="adm-modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label className="adm-label">Nome Oficial do Fornecedor *</label>
                  <input
                    type="text"
                    required
                    className="adm-input"
                    placeholder="Ex: Grupo Xcaret, Envatours"
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label className="adm-label">Nome Fantasia / Operação</label>
                    <input
                      type="text"
                      className="adm-input"
                      placeholder="Ex: Xcaret Parques"
                      value={formData.trade_name || ""}
                      onChange={(e) => setFormData({ ...formData, trade_name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="adm-label">Categoria</label>
                    <select
                      className="adm-select"
                      value={formData.category || "Passeios & Atrações"}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      {CATEGORIES.filter((c) => c !== "Todos").map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label className="adm-label">Moeda Padrão de Custo</label>
                    <select
                      className="adm-select"
                      value={formData.currency_default || "BRL"}
                      onChange={(e) => setFormData({ ...formData, currency_default: e.target.value as any })}
                    >
                      <option value="BRL">BRL (R$ Real)</option>
                      <option value="USD">USD ($ Dólar)</option>
                      <option value="MXN">MXN ($ Peso Mexicano)</option>
                    </select>
                  </div>

                  <div>
                    <label className="adm-label">Pessoa de Contato</label>
                    <input
                      type="text"
                      className="adm-input"
                      placeholder="Ex: Juan Ramirez"
                      value={formData.contact_name || ""}
                      onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label className="adm-label">WhatsApp Operacional</label>
                    <input
                      type="text"
                      className="adm-input"
                      placeholder="+52 998 123 4567"
                      value={formData.whatsapp || ""}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="adm-label">E-mail</label>
                    <input
                      type="email"
                      className="adm-input"
                      placeholder="reservas@fornecedor.com"
                      value={formData.email || ""}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="adm-label">Condições de Pagamento / Cobrança</label>
                  <input
                    type="text"
                    className="adm-input"
                    placeholder="Ex: Pagamento quinzenal no cartão corporativo, fatura mensal"
                    value={formData.payment_terms || ""}
                    onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                  />
                </div>

                <div>
                  <label className="adm-label">Observações Internas</label>
                  <textarea
                    className="adm-textarea"
                    rows={2}
                    placeholder="Procedimento para vouchers, prazos de confirmação..."
                    value={formData.notes || ""}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px" }}>
                  <input
                    type="checkbox"
                    id="supplier-active"
                    checked={formData.active ?? true}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    style={{ width: "16px", height: "16px", accentColor: "var(--adm-clay)" }}
                  />
                  <label htmlFor="supplier-active" style={{ fontSize: "14px", fontWeight: 600, color: "var(--adm-text-main)", cursor: "pointer" }}>
                    Fornecedor Ativo (disponível para vincular em passeios e contratos)
                  </label>
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
                  {saving ? "Salvando..." : editingSupplier ? "Salvar Alterações" : "Criar Fornecedor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
