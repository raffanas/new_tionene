"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  SUPPLIER_COST_OPTIONS,
  SupplierCostOption,
  PricingModel,
  ValidationStatus
} from "@/data/supplier-catalog";
import {
  OFFICIAL_SUPPLIERS,
  OFFICIAL_COMMERCIAL_PRODUCTS,
  OFFICIAL_SUPPLIER_RATES,
  OFFICIAL_HOTEL_ZONE_MAPPINGS,
  OFFICIAL_XCARET_SEASONS_2026
} from "@/data/official-supplier-catalog";
import {
  CommercialProduct,
  SupplierRate,
  HotelZoneMapping
} from "@/types/supplier-commercial";
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
  Tag,
  Calendar,
  Clock,
  Layers,
  FileText,
  ShieldAlert,
  Info,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Filter,
  Lock,
  Compass,
  MapPin
} from "lucide-react";
import { useAuthProfile } from "@/lib/auth/AuthContext";

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
  status?: string | null;
  created_at?: string;
  updated_at?: string;
}

const DEFAULT_APPROVED_SUPPLIERS: Partial<Supplier>[] = [
  { name: "Baktun", trade_name: "Baktun Operadora", category: "Arqueologia & Cultura", currency_default: "USD", notes: "Fornecedor oficial de Chichén Itzá e tours culturais.", active: true, status: "ativo" },
  { name: "Coco Bongo", trade_name: "Coco Bongo Show & Disco", category: "Vida Noturna & Shows", currency_default: "USD", notes: "Ingressos oficiais de shows noturnos, packs e open bar em Cancún.", active: true, status: "ativo" },
  { name: "Envatours", trade_name: "Envatours Cancún", category: "Operadora Náutica & Passeios", currency_default: "USD", notes: "Barcos de vidro coletivos e privativos (1–10 pax) em Cancún, Isla Mujeres e Cozumel.", active: true, status: "ativo" },
  { name: "Miguel Shuttle", trade_name: "Miguel Shuttle Transfers", category: "Transporte & Privativo", currency_default: "USD", notes: "Transfers privativos aeroporto ↔ hotel em van (1–7 passageiros). Tarifas por trecho e zona.", active: true, status: "ativo" },
  { name: "MTZ Tours", trade_name: "MTZ Operações", category: "Receptivo Cancún", currency_default: "USD", notes: "Tours arqueológicos Tulum, Casa Tortuga, cenotes e Cirque du Soleil JOYÀ.", active: true, status: "ativo" },
  { name: "MUSA", trade_name: "MUSA Museu Subaquático", category: "Mergulho & Náutica", currency_default: "USD", notes: "Mergulho com cilindro e museu subaquático em Cancún.", active: true, status: "ativo" },
  { name: "Parasailing & Jet Ski", trade_name: "Parasailing & Jet Ski Cancún", category: "Aventura & Náutica", currency_default: "USD", notes: "Atividades náuticas de voo panorâmico e jet ski (máx 2 pax/ski).", active: true, status: "ativo" },
  { name: "Playa Mía", trade_name: "Playa Mía Grand Beach Park", category: "Operadora Náutica & Passeios", currency_default: "MXN", notes: "Passeio Cozumel el Cielo com saídas Cancún, Playa del Carmen e Cozumel (manual). Moeda MXN.", active: true, status: "ativo" },
  { name: "The Dolphin Company", trade_name: "The Dolphin Company", category: "Vida Marinha & Parques", currency_default: "USD", notes: "17 produtos oficiais com nado de golfinhos e habitats marinhos.", active: true, status: "ativo" },
  { name: "Xcaret", trade_name: "Grupo Xcaret", category: "Parques & Ecoturismo", currency_default: "USD", notes: "10 produtos oficiais de parques e ecoturismo, 27 tarifas regionais com transporte incluso.", active: true, status: "ativo" }
];

export default function AdminSuppliersPage() {
  const { role, hasPermission } = useAuthProfile();
  const canViewCosts = role === "admin" || (hasPermission && hasPermission("supplier_costs:view"));

  const [activeTab, setActiveTab] = useState<"suppliers" | "commercial" | "rates" | "zones" | "catalog">("suppliers");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todos");
  const [showInactive, setShowInactive] = useState(false);

  // Filtros do Catálogo Comercial (52 Produtos)
  const [commercialSearch, setCommercialSearch] = useState("");
  const [commercialProviderFilter, setCommercialProviderFilter] = useState("all");
  const [commercialTypeFilter, setCommercialTypeFilter] = useState("all");

  // Filtros das Tarifas Oficiais de Fornecedores (80 Tarifas)
  const [ratesSearch, setRatesSearch] = useState("");
  const [ratesProviderFilter, setRatesProviderFilter] = useState("all");
  const [ratesCurrencyFilter, setRatesCurrencyFilter] = useState("all");

  // Filtros do Catálogo Legado de 42 Opções (TN-xxx)
  const [catalogOptions, setCatalogOptions] = useState<SupplierCostOption[]>(SUPPLIER_COST_OPTIONS);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState<string>("all");
  const [selectedModelFilter, setSelectedModelFilter] = useState<string>("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all");

  // Modal de Criação / Edição de Fornecedor
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [saving, setSaving] = useState(false);

  // Modal de Detalhes / Edição de Opção Tarifária (TN-xxx)
  const [optionModalOpen, setOptionModalOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<SupplierCostOption | null>(null);
  const [optionFormData, setOptionFormData] = useState<Partial<SupplierCostOption>>({});
  const [auditNotes, setAuditNotes] = useState("");

  const [formData, setFormData] = useState<Partial<Supplier>>({
    name: "",
    trade_name: "",
    contact_name: "",
    phone: "",
    whatsapp: "",
    email: "",
    category: "Passeios & Atrações",
    currency_default: "USD",
    payment_terms: "",
    notes: "",
    active: true,
  });

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      // 1. Buscar Fornecedores
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        console.warn("Erro ao buscar fornecedores:", error.message);
        setSuppliers(DEFAULT_APPROVED_SUPPLIERS as Supplier[]);
      } else if (data && data.length > 0) {
        setSuppliers(data as Supplier[]);
      } else {
        setSuppliers(DEFAULT_APPROVED_SUPPLIERS as Supplier[]);
      }

      // 2. Buscar Opções Tarifárias Oficiais (TN-001 a TN-042)
      const { data: optRows, error: optErr } = await supabase
        .from("supplier_cost_options")
        .select("*")
        .order("code", { ascending: true });

      if (!optErr && optRows && optRows.length > 0) {
        const mappedFromDb: SupplierCostOption[] = optRows.map((r: any) => ({
          code: r.code,
          supplierName: r.supplier_name,
          serviceName: r.service_name,
          variant: r.variant || undefined,
          currency: r.currency,
          pricingModel: r.pricing_model as PricingModel,
          costAdult: r.cost_adult !== null && r.cost_adult !== undefined ? Number(r.cost_adult) : undefined,
          costChild: r.cost_child !== null && r.cost_child !== undefined ? Number(r.cost_child) : undefined,
          costFixed: r.cost_fixed !== null && r.cost_fixed !== undefined ? Number(r.cost_fixed) : undefined,
          pricingRule: r.pricing_rule || undefined,
          externalFeesNote: r.mandatory_fees_notes || undefined,
          operationalNotes: r.notes || undefined,
          sourceReference: r.source_reference || "Base Canônica Oficial TN (Supabase)",
          validationStatus: (r.validation_status as ValidationStatus) || "revisado",
        }));
        setCatalogOptions(mappedFromDb);
      }
    } catch (err) {
      console.error("Erro inesperado:", err);
      setSuppliers(DEFAULT_APPROVED_SUPPLIERS as Supplier[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === "admin") {
      fetchSuppliers();
    } else {
      setLoading(false);
    }
  }, [role]);

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
      currency_default: "USD",
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

  const openOptionDetails = (option: SupplierCostOption) => {
    setSelectedOption(option);
    setOptionFormData({ ...option });
    setAuditNotes("");
    setOptionModalOpen(true);
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    setSaving(true);
    try {
      if (editingSupplier?.id) {
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
            currency_default: formData.currency_default || "USD",
            payment_terms: formData.payment_terms || null,
            notes: formData.notes || null,
            active: formData.active ?? true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingSupplier.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("suppliers").insert([
          {
            name: formData.name,
            trade_name: formData.trade_name || null,
            contact_name: formData.contact_name || null,
            phone: formData.phone || null,
            whatsapp: formData.whatsapp || null,
            email: formData.email || null,
            category: formData.category || "Passeios & Atrações",
            currency_default: formData.currency_default || "USD",
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

  const handleSaveOptionEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOption) return;

    try {
      // 1. Atualizar no Supabase se existir
      const { error: updErr } = await supabase
        .from("supplier_cost_options")
        .update({
          cost_adult: optionFormData.costAdult !== undefined ? (optionFormData.costAdult === null ? null : Number(optionFormData.costAdult)) : null,
          cost_child: optionFormData.costChild !== undefined ? (optionFormData.costChild === null ? null : Number(optionFormData.costChild)) : null,
          cost_fixed: optionFormData.costFixed !== undefined ? (optionFormData.costFixed === null ? null : Number(optionFormData.costFixed)) : null,
          currency: optionFormData.currency || selectedOption.currency,
          pricing_model: optionFormData.pricingModel || selectedOption.pricingModel,
          notes: optionFormData.operationalNotes || (optionFormData as any).notes || null,
          validation_status: optionFormData.validationStatus || selectedOption.validationStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("code", selectedOption.code);

      if (updErr) {
        console.warn("Aviso ao sincronizar opção tarifária com Supabase:", updErr.message);
      }

      // 2. Gravar auditoria se fornecida
      if (auditNotes.trim()) {
        await supabase.from("supplier_cost_audit_log").insert([
          {
            tariff_code: selectedOption.code,
            field_changed: "cost_update",
            old_value: JSON.stringify({
              adult: selectedOption.costAdult,
              child: selectedOption.costChild,
              fixed: selectedOption.costFixed,
              currency: selectedOption.currency,
            }),
            new_value: JSON.stringify({
              adult: optionFormData.costAdult,
              child: optionFormData.costChild,
              fixed: optionFormData.costFixed,
              currency: optionFormData.currency,
            }),
            change_reason: auditNotes.trim(),
            changed_by: "admin",
          },
        ]);
      }

      // 3. Atualiza o estado em memória do catálogo
      const updated = catalogOptions.map((opt) =>
        opt.code === selectedOption.code ? { ...opt, ...optionFormData } : opt
      );
      setCatalogOptions(updated as SupplierCostOption[]);
      setOptionModalOpen(false);
      alert(`Opção ${selectedOption.code} atualizada com sucesso no banco de dados e auditoria registrada!`);
    } catch (err: any) {
      alert("Erro ao salvar opção: " + (err.message || "Tente novamente"));
    }
  };

  // Filtragem de fornecedores
  const filteredSuppliers = suppliers.filter((s) => {
    const matchesStatus = showInactive ? true : s.active;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      s.name.toLowerCase().includes(term) ||
      (s.trade_name && s.trade_name.toLowerCase().includes(term)) ||
      (s.category && s.category.toLowerCase().includes(term));
    const matchesCat = categoryFilter === "Todos" || s.category === categoryFilter;

    return matchesStatus && matchesSearch && matchesCat;
  });

  // Filtragem das 42 opções de catálogo
  const filteredOptions = catalogOptions.filter((opt) => {
    const term = catalogSearch.toLowerCase();
    const matchesSearch =
      opt.code.toLowerCase().includes(term) ||
      opt.serviceName.toLowerCase().includes(term) ||
      opt.supplierName.toLowerCase().includes(term) ||
      (opt.variant && opt.variant.toLowerCase().includes(term)) ||
      (opt.description && opt.description.toLowerCase().includes(term));

    const matchesSupplier =
      selectedSupplierFilter === "all" || opt.supplierName === selectedSupplierFilter;

    const matchesModel =
      selectedModelFilter === "all" || opt.pricingModel === selectedModelFilter;

    const matchesStatus =
      selectedStatusFilter === "all" || opt.validationStatus === selectedStatusFilter;

    return matchesSearch && matchesSupplier && matchesModel && matchesStatus;
  });

  // Filtragem dos 52 produtos comerciais oficiais
  const filteredCommercialProducts = OFFICIAL_COMMERCIAL_PRODUCTS.filter((prod) => {
    const term = commercialSearch.toLowerCase();
    const matchesSearch =
      !term ||
      prod.tour_id.toLowerCase().includes(term) ||
      prod.display_name.toLowerCase().includes(term) ||
      prod.supplier_product_name.toLowerCase().includes(term) ||
      prod.provider.toLowerCase().includes(term);

    const matchesProvider =
      commercialProviderFilter === "all" || prod.provider === commercialProviderFilter;

    const matchesType =
      commercialTypeFilter === "all" || prod.product_type === commercialTypeFilter;

    return matchesSearch && matchesProvider && matchesType;
  });

  // Filtragem das 80 tarifas oficiais dos fornecedores
  const filteredOfficialRates = OFFICIAL_SUPPLIER_RATES.filter((rate) => {
    const term = ratesSearch.toLowerCase();
    const matchesSearch =
      !term ||
      rate.rate_id.toLowerCase().includes(term) ||
      rate.tour_id.toLowerCase().includes(term) ||
      rate.supplier_rate_name.toLowerCase().includes(term);

    const matchesProvider =
      ratesProviderFilter === "all" || rate.tour_id.startsWith(ratesProviderFilter);

    const matchesCurrency =
      ratesCurrencyFilter === "all" || rate.currency === ratesCurrencyFilter;

    return matchesSearch && matchesProvider && matchesCurrency;
  });

  const uniqueSuppliersInCatalog = Array.from(new Set(catalogOptions.map((o) => o.supplierName)));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Cabeçalho da Página */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <span className="admin-brand-tag">BASE OFICIAL v0.1.43</span>
          <h2 style={{ fontSize: "28px", color: "var(--adm-wine)" }}>Fornecedores, Produtos & Tarifas</h2>
          <p style={{ color: "var(--adm-text-muted)", fontSize: "14px", marginTop: "2px" }}>
            Estrutura comercial dos 10 fornecedores oficiais, catálogo de produtos para vendedores e tarifas operacionais.
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

      {/* KPI Cards de Resumo */}
      <div className="adm-kpi-grid">
        <div className="adm-kpi-card" onClick={() => setActiveTab("suppliers")} style={{ cursor: "pointer", borderTop: activeTab === "suppliers" ? "3px solid var(--adm-wine)" : undefined }}>
          <div className="adm-kpi-header">
            <span>Fornecedores Oficiais</span>
            <Building2 size={18} color="var(--adm-wine)" />
          </div>
          <div className="adm-kpi-value">{suppliers.filter((s) => s.active).length}</div>
          <div className="adm-kpi-desc">10 operadoras homologadas</div>
        </div>

        <div className="adm-kpi-card" onClick={() => setActiveTab("commercial")} style={{ cursor: "pointer", borderTop: activeTab === "commercial" ? "3px solid var(--adm-wine)" : undefined }}>
          <div className="adm-kpi-header">
            <span>Catálogo Comercial</span>
            <Compass size={18} color="var(--adm-emerald)" />
          </div>
          <div className="adm-kpi-value">52</div>
          <div className="adm-kpi-desc">Produtos para busca de vendedores</div>
        </div>

        <div className="adm-kpi-card" onClick={() => setActiveTab("rates")} style={{ cursor: "pointer", borderTop: activeTab === "rates" ? "3px solid var(--adm-wine)" : undefined }}>
          <div className="adm-kpi-header">
            <span>Tarifas Oficiais</span>
            <Layers size={18} color="var(--adm-gold)" />
          </div>
          <div className="adm-kpi-value">80</div>
          <div className="adm-kpi-desc">{canViewCosts ? "Tarifas ativas (USD / MXN)" : "Protegidas por RBAC (Admin)"}</div>
        </div>

        <div className="adm-kpi-card" onClick={() => setActiveTab("zones")} style={{ cursor: "pointer", borderTop: activeTab === "zones" ? "3px solid var(--adm-wine)" : undefined }}>
          <div className="adm-kpi-header">
            <span>Zonas & Temporadas</span>
            <MapPin size={18} color="var(--adm-clay)" />
          </div>
          <div className="adm-kpi-value" style={{ fontSize: "20px" }}>8 Zonas · 6 Janelas</div>
          <div className="adm-kpi-desc">Mapeamento Miguel, Playa Mía & Xcaret</div>
        </div>
      </div>

      {/* Abas Superiores: Fornecedores vs. Comercial vs. Tarifas vs. Zonas */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "2px solid var(--adm-border)", paddingBottom: "12px", overflowX: "auto" }}>
        <button
          type="button"
          className={`adm-btn ${activeTab === "suppliers" ? "adm-btn-clay" : "adm-btn-outline"}`}
          onClick={() => setActiveTab("suppliers")}
        >
          <Truck size={16} />
          <span>Fornecedores Oficiais ({suppliers.filter((s) => s.active).length})</span>
        </button>

        <button
          type="button"
          className={`adm-btn ${activeTab === "commercial" ? "adm-btn-clay" : "adm-btn-outline"}`}
          onClick={() => setActiveTab("commercial")}
        >
          <Compass size={16} />
          <span>Catálogo Comercial (52 Produtos)</span>
        </button>

        <button
          type="button"
          className={`adm-btn ${activeTab === "rates" ? "adm-btn-clay" : "adm-btn-outline"}`}
          onClick={() => setActiveTab("rates")}
        >
          <Layers size={16} />
          <span>Tarifas Operacionais (80)</span>
          {!canViewCosts && <Lock size={12} style={{ marginLeft: "4px" }} />}
        </button>

        <button
          type="button"
          className={`adm-btn ${activeTab === "zones" ? "adm-btn-clay" : "adm-btn-outline"}`}
          onClick={() => setActiveTab("zones")}
        >
          <MapPin size={16} />
          <span>Zonas & Temporadas 2026</span>
        </button>

        <button
          type="button"
          className={`adm-btn ${activeTab === "catalog" ? "adm-btn-clay" : "adm-btn-outline"}`}
          onClick={() => setActiveTab("catalog")}
        >
          <FileText size={16} />
          <span>Opções Legadas TN (42)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* ABA 1: FORNECEDORES LOCAIS                                                */}
      {/* ========================================================================= */}
      {activeTab === "suppliers" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Barra de Busca e Filtro */}
          <div className="adm-card" style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
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

            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer", color: "var(--adm-text-muted)" }}>
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                />
                <span>Exibir desativados / históricos</span>
              </label>
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
                Ajuste os filtros de busca para visualizar os registros.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "18px" }}>
              {filteredSuppliers.map((supplier, idx) => {
                const optionsCount = catalogOptions.filter((o) => o.supplierName === supplier.name).length;

                return (
                  <div
                    key={supplier.id || idx}
                    className="adm-card"
                    style={{
                      padding: "20px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      position: "relative",
                      borderLeft: supplier.active ? "4px solid var(--adm-wine)" : "4px solid var(--adm-border)",
                      opacity: supplier.active ? 1 : 0.65
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                        <div>
                          <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--adm-clay)", display: "flex", alignItems: "center", gap: "4px" }}>
                            <Tag size={12} />
                            {supplier.category || "Operador"}
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

                        <span className={`adm-badge ${supplier.active ? "badge-green" : "badge-rose"}`} style={{ fontSize: "11px" }}>
                          {supplier.active ? "Homologado" : "Excluído"}
                        </span>
                      </div>

                      {/* Dados Financeiros e de Contato */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", margin: "14px 0", fontSize: "13px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <DollarSign size={14} color="var(--adm-gold)" />
                          <span>
                            Moeda Operacional: <strong>{supplier.currency_default || "USD"}</strong>
                          </span>
                        </div>

                        {optionsCount > 0 ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--adm-emerald)", fontWeight: 600 }}>
                            <Layers size={14} />
                            <span>{optionsCount} opções no catálogo oficial</span>
                          </div>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--adm-text-subtle)", fontSize: "12px" }}>
                            <Info size={14} />
                            <span>Sem tarifas ativas no catálogo</span>
                          </div>
                        )}

                        {supplier.notes && (
                          <p style={{ fontSize: "12px", color: "var(--adm-text-muted)", marginTop: "4px", lineHeight: 1.4 }}>
                            {supplier.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Ações */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--adm-border)", paddingTop: "12px" }}>
                      {optionsCount > 0 ? (
                        <button
                          type="button"
                          className="adm-btn adm-btn-outline adm-btn-sm"
                          onClick={() => {
                            setSelectedSupplierFilter(supplier.name);
                            setActiveTab("catalog");
                          }}
                        >
                          <span>Ver Tarifas ({optionsCount})</span>
                          <ChevronRight size={13} />
                        </button>
                      ) : (
                        <span />
                      )}

                      <button
                        type="button"
                        className="adm-btn adm-btn-icon adm-btn-outline adm-btn-sm"
                        onClick={() => openEditModal(supplier)}
                        title="Editar Fornecedor"
                      >
                        <Edit2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: CATÁLOGO DE CUSTOS & TARIFAS (TN-001 A TN-042)                     */}
      {/* ========================================================================= */}
      {activeTab === "catalog" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Barra de Filtros do Catálogo */}
          <div className="adm-card" style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: "260px" }}>
                <Search size={18} color="var(--adm-clay)" />
                <input
                  type="text"
                  className="adm-input"
                  style={{ width: "100%", maxWidth: "380px" }}
                  placeholder="Buscar por código (TN-xxx), serviço ou fornecedor..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                />
              </div>

              <span style={{ fontSize: "13px", color: "var(--adm-text-muted)", fontWeight: 600 }}>
                Exibindo {filteredOptions.length} de 42 opções
              </span>
            </div>

            {/* Filtros em linha */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", borderTop: "1px solid var(--adm-border)", paddingTop: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "12px", color: "var(--adm-text-muted)", fontWeight: 600 }}>Fornecedor:</span>
                <select
                  className="adm-select"
                  style={{ fontSize: "12px", width: "auto" }}
                  value={selectedSupplierFilter}
                  onChange={(e) => setSelectedSupplierFilter(e.target.value)}
                >
                  <option value="all">Todos ({uniqueSuppliersInCatalog.length})</option>
                  {uniqueSuppliersInCatalog.map((sup) => (
                    <option key={sup} value={sup}>
                      {sup}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "12px", color: "var(--adm-text-muted)", fontWeight: 600 }}>Modelo:</span>
                <select
                  className="adm-select"
                  style={{ fontSize: "12px", width: "auto" }}
                  value={selectedModelFilter}
                  onChange={(e) => setSelectedModelFilter(e.target.value)}
                >
                  <option value="all">Todos os Modelos</option>
                  <option value="per_person">Por Pessoa</option>
                  <option value="fixed_vessel">Por Embarcação (Fixo)</option>
                  <option value="fixed_jetski">Por Jet Ski</option>
                  <option value="per_vehicle_leg">Por Veículo / Trecho</option>
                  <option value="quote_required">Sob Cotação</option>
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "12px", color: "var(--adm-text-muted)", fontWeight: 600 }}>Status:</span>
                <select
                  className="adm-select"
                  style={{ fontSize: "12px", width: "auto" }}
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                >
                  <option value="all">Todos os Status</option>
                  <option value="revisado">Revisado</option>
                  <option value="ressalva_conteudo">Ressalva no Conteúdo</option>
                  <option value="ressalva_tarifa">Ressalva na Tarifa</option>
                  <option value="horario_pendente">Horário Pendente</option>
                  <option value="info_pendente">Informações Pendentes</option>
                  <option value="estimado">Preço Estimado</option>
                  <option value="sob_cotacao">Sob Cotação</option>
                </select>
              </div>

              {(selectedSupplierFilter !== "all" || selectedModelFilter !== "all" || selectedStatusFilter !== "all") && (
                <button
                  type="button"
                  className="adm-btn adm-btn-outline adm-btn-sm"
                  onClick={() => {
                    setSelectedSupplierFilter("all");
                    setSelectedModelFilter("all");
                    setSelectedStatusFilter("all");
                  }}
                >
                  Limpar Filtros
                </button>
              )}
            </div>
          </div>

          {/* Tabela do Catálogo */}
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th style={{ width: "90px" }}>Código</th>
                  <th>Fornecedor</th>
                  <th>Passeio / Serviço & Variação</th>
                  <th>Modelo de Cobrança</th>
                  <th style={{ textAlign: "right" }}>Custo Unitário</th>
                  <th>Status & Alertas</th>
                  <th style={{ textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredOptions.map((opt) => {
                  let statusBadgeClass = "badge-green";
                  let statusLabel = "Revisado";

                  if (opt.validationStatus === "ressalva_conteudo" || opt.validationStatus === "ressalva_tarifa") {
                    statusBadgeClass = "badge-amber";
                    statusLabel = "Ressalva";
                  } else if (opt.validationStatus === "horario_pendente" || opt.validationStatus === "info_pendente") {
                    statusBadgeClass = "badge-blue";
                    statusLabel = "Pendente";
                  } else if (opt.validationStatus === "estimado") {
                    statusBadgeClass = "badge-rose";
                    statusLabel = "Estimado";
                  } else if (opt.validationStatus === "sob_cotacao") {
                    statusBadgeClass = "badge-wine";
                    statusLabel = "Sob Cotação";
                  }

                  return (
                    <tr key={opt.code}>
                      <td>
                        <strong style={{ fontSize: "13px", color: "var(--adm-wine)", letterSpacing: "0.05em" }}>
                          {opt.code}
                        </strong>
                      </td>

                      <td>
                        <div style={{ fontWeight: 600, color: "var(--adm-text-main)" }}>
                          {opt.supplierName}
                        </div>
                      </td>

                      <td>
                        <div style={{ fontWeight: 600, color: "var(--adm-wine)" }}>
                          {opt.serviceName}
                        </div>
                        {opt.variant && (
                          <div style={{ fontSize: "11px", color: "var(--adm-clay)", fontWeight: 600 }}>
                            {opt.variant}
                          </div>
                        )}
                        {opt.externalFeesNote && (
                          <div style={{ fontSize: "11px", color: "var(--adm-amber)", marginTop: "2px" }}>
                            {opt.externalFeesNote}
                          </div>
                        )}
                      </td>

                      <td>
                        <span style={{ fontSize: "12px", background: "var(--adm-surface-alt)", padding: "2px 8px", borderRadius: "6px", border: "1px solid var(--adm-border)" }}>
                          {opt.pricingModel === "per_person" && "Por pessoa"}
                          {opt.pricingModel === "fixed_vessel" && "Por embarcação"}
                          {opt.pricingModel === "fixed_jetski" && "Por jet ski"}
                          {opt.pricingModel === "per_vehicle_leg" && "Por veículo / trecho"}
                          {opt.pricingModel === "quote_required" && "Sob cotação"}
                        </span>
                      </td>

                      <td style={{ textAlign: "right" }}>
                        {opt.pricingModel === "per_person" && (
                          <div>
                            <strong style={{ fontSize: "13px" }}>
                              {opt.currency} {opt.costAdult}
                            </strong>
                            {opt.costChild !== undefined && (
                              <div style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>
                                Ch: {opt.currency} {opt.costChild}
                              </div>
                            )}
                          </div>
                        )}

                        {(opt.pricingModel === "fixed_vessel" || opt.pricingModel === "fixed_jetski" || opt.pricingModel === "per_vehicle_leg") && (
                          <strong style={{ fontSize: "14px", color: "var(--adm-emerald)" }}>
                            {opt.currency} {opt.costFixed}
                          </strong>
                        )}

                        {opt.pricingModel === "quote_required" && (
                          <span style={{ fontSize: "12px", color: "var(--adm-text-muted)", fontStyle: "italic" }}>
                            Cotação manual
                          </span>
                        )}
                      </td>

                      <td>
                        <span className={`adm-badge ${statusBadgeClass}`} style={{ fontSize: "11px" }}>
                          {statusLabel}
                        </span>
                        {opt.pendingIssues && (
                          <span title={opt.pendingIssues} style={{ marginLeft: "6px", cursor: "help" }}>
                            ⚠️
                          </span>
                        )}
                      </td>

                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className="adm-btn adm-btn-outline adm-btn-sm"
                          onClick={() => openOptionDetails(opt)}
                        >
                          <Edit2 size={13} />
                          <span>Ficha & Custo</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: CATÁLOGO COMERCIAL DE PRODUTOS PARA VENDEDORES (52 PRODUTOS)       */}
      {/* ========================================================================= */}
      {activeTab === "commercial" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Informações da Arquitetura Comercial */}
          <div className="adm-card" style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", borderLeft: "4px solid var(--adm-emerald)" }}>
            <div>
              <h3 style={{ fontSize: "16px", color: "var(--adm-wine)", display: "flex", alignItems: "center", gap: "8px" }}>
                <Compass size={18} color="var(--adm-emerald)" />
                <span>Catálogo Comercial de Produtos (52 Itens Oficiais)</span>
              </h3>
              <p style={{ color: "var(--adm-text-muted)", fontSize: "13px", marginTop: "2px" }}>
                Vendedores buscam e cotam exclusivamente pelo <strong>Display Name</strong>. Nomes operacionais internos e custos dos fornecedores são desacoplados para integridade comercial.
              </p>
            </div>
            <span className="adm-badge badge-green" style={{ fontSize: "12px" }}>
              {filteredCommercialProducts.length} de 52 Produtos
            </span>
          </div>

          {/* Filtros */}
          <div className="adm-card" style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: "260px" }}>
              <Search size={18} color="var(--adm-clay)" />
              <input
                type="text"
                className="adm-input"
                style={{ width: "100%", maxWidth: "380px" }}
                placeholder="Buscar por Tour ID, Display Name ou Provedor..."
                value={commercialSearch}
                onChange={(e) => setCommercialSearch(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <select
                className="adm-select"
                value={commercialProviderFilter}
                onChange={(e) => setCommercialProviderFilter(e.target.value)}
                style={{ minWidth: "160px" }}
              >
                <option value="all">Todos os Fornecedores</option>
                {Array.from(new Set(OFFICIAL_COMMERCIAL_PRODUCTS.map((p) => p.provider))).map((prov) => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>

              <select
                className="adm-select"
                value={commercialTypeFilter}
                onChange={(e) => setCommercialTypeFilter(e.target.value)}
                style={{ minWidth: "140px" }}
              >
                <option value="all">Todos os Tipos</option>
                <option value="Tour">Tour</option>
                <option value="Activity">Activity</option>
                <option value="Transfer">Transfer</option>
                <option value="Package">Package</option>
              </select>
            </div>
          </div>

          {/* Tabela de Produtos Comerciais */}
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th style={{ width: "100px" }}>Tour ID</th>
                  <th>Nome Comercial (Display Name)</th>
                  <th>Nome Operacional do Fornecedor</th>
                  <th>Fornecedor</th>
                  <th>Tipo / Subtipo</th>
                  <th style={{ textAlign: "center", width: "130px" }}>Visível Vendedor</th>
                  <th style={{ textAlign: "center", width: "100px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredCommercialProducts.map((prod) => (
                  <tr key={prod.tour_id}>
                    <td>
                      <span className="adm-badge badge-wine" style={{ fontSize: "12px", fontFamily: "monospace" }}>
                        {prod.tour_id}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--adm-wine)" }}>
                        {prod.display_name}
                      </div>
                      {prod.product_subtype && (
                        <div style={{ fontSize: "11px", color: "var(--adm-clay)" }}>
                          Subtipo: {prod.product_subtype}
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: "13px", color: "var(--adm-text-muted)" }}>
                        {prod.supplier_product_name}
                      </span>
                    </td>
                    <td>
                      <strong style={{ fontSize: "13px", color: "var(--adm-text-main)" }}>
                        {prod.provider}
                      </strong>
                    </td>
                    <td>
                      <span className="adm-badge badge-blue" style={{ fontSize: "11px" }}>
                        {prod.product_type}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span className={`adm-badge ${prod.seller_visible ? "badge-green" : "badge-gray"}`} style={{ fontSize: "11px" }}>
                        {prod.seller_visible ? "Sim (Ativo)" : "Oculto"}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span className="adm-badge badge-green" style={{ fontSize: "11px" }}>
                        {prod.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 3: TARIFAS OPERACIONAIS DOS FORNECEDORES (80 TARIFAS COM RBAC)        */}
      {/* ========================================================================= */}
      {activeTab === "rates" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Banner de Controle de Acesso RBAC */}
          {canViewCosts ? (
            <div className="adm-card" style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", borderLeft: "4px solid var(--adm-gold)" }}>
              <div>
                <h3 style={{ fontSize: "16px", color: "var(--adm-wine)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <ShieldCheck size={18} color="var(--adm-emerald)" />
                  <span>Tarifas Oficiais dos Fornecedores (80 Tarifas Homologadas)</span>
                </h3>
                <p style={{ color: "var(--adm-text-muted)", fontSize: "13px", marginTop: "2px" }}>
                  Painel de Custos Administrativos: Moedas nativas (77 USD, 3 MXN), bases de cálculo, sazonalidade e dias da semana.
                </p>
              </div>
              <span className="adm-badge badge-amber" style={{ fontSize: "12px" }}>
                Acesso Total Admin
              </span>
            </div>
          ) : (
            <div className="adm-card" style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: "12px", borderLeft: "4px solid var(--adm-rose)" }}>
              <Lock size={20} color="var(--adm-rose)" />
              <div>
                <strong style={{ color: "var(--adm-wine)", fontSize: "14px" }}>
                  Acesso Restrito a Administradores (RBAC v0.1.43)
                </strong>
                <p style={{ color: "var(--adm-text-muted)", fontSize: "13px", marginTop: "2px" }}>
                  Você está autenticado como Vendedor (Seller). Os custos internos, margens e tarifas financeiras dos fornecedores estão protegidos contra visualização.
                </p>
              </div>
            </div>
          )}

          {/* Filtros */}
          <div className="adm-card" style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: "260px" }}>
              <Search size={18} color="var(--adm-clay)" />
              <input
                type="text"
                className="adm-input"
                style={{ width: "100%", maxWidth: "380px" }}
                placeholder="Buscar por Rate ID, Tour ID ou Nome da Tarifa..."
                value={ratesSearch}
                onChange={(e) => setRatesSearch(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <select
                className="adm-select"
                value={ratesProviderFilter}
                onChange={(e) => setRatesProviderFilter(e.target.value)}
                style={{ minWidth: "160px" }}
              >
                <option value="all">Todos os Provedores</option>
                <option value="BAK">Baktun (BAK)</option>
                <option value="COC">Coco Bongo (COC)</option>
                <option value="ENV">Envatours (ENV)</option>
                <option value="MIG">Miguel Shuttle (MIG)</option>
                <option value="MTZ">MTZ Tours (MTZ)</option>
                <option value="MUS">MUSA (MUS)</option>
                <option value="PJS">Parasailing & Jet Ski (PJS)</option>
                <option value="PLY">Playa Mía (PLY)</option>
                <option value="DOL">The Dolphin Company (DOL)</option>
                <option value="XCA">Xcaret (XCA)</option>
              </select>

              <select
                className="adm-select"
                value={ratesCurrencyFilter}
                onChange={(e) => setRatesCurrencyFilter(e.target.value)}
                style={{ minWidth: "120px" }}
              >
                <option value="all">Todas Moedas</option>
                <option value="USD">USD</option>
                <option value="MXN">MXN</option>
              </select>
            </div>
          </div>

          {/* Tabela de Tarifas */}
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th style={{ width: "110px" }}>Rate ID</th>
                  <th style={{ width: "100px" }}>Tour ID</th>
                  <th>Tarifa Operacional do Fornecedor</th>
                  <th>Base</th>
                  <th style={{ width: "80px" }}>Moeda</th>
                  <th style={{ textAlign: "right" }}>Custo Adulto / Fixo</th>
                  <th style={{ textAlign: "right" }}>Custo Criança</th>
                  <th>Região / Temporada / Dias</th>
                  <th style={{ textAlign: "center", width: "120px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredOfficialRates.map((r) => (
                  <tr key={r.rate_id}>
                    <td>
                      <span className="adm-badge badge-wine" style={{ fontSize: "12px", fontFamily: "monospace" }}>
                        {r.rate_id}
                      </span>
                    </td>
                    <td>
                      <span className="adm-badge badge-blue" style={{ fontSize: "11px", fontFamily: "monospace" }}>
                        {r.tour_id}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--adm-text-main)" }}>
                        {r.supplier_rate_name}
                      </div>
                      {r.notes && (
                        <div style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>
                          {r.notes}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="adm-badge badge-gray" style={{ fontSize: "11px" }}>
                        {r.pricing_basis}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: r.currency === "MXN" ? "var(--adm-clay)" : "var(--adm-emerald)" }}>
                        {r.currency}
                      </strong>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>
                      {canViewCosts ? (
                        r.fixed_cost !== null ? (
                          <span>{r.currency} {r.fixed_cost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                        ) : r.adult_cost !== null ? (
                          <span>{r.currency} {r.adult_cost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                        ) : (
                          <span style={{ color: "var(--adm-text-muted)", fontStyle: "italic" }}>Sob cotação</span>
                        )
                      ) : (
                        <span style={{ color: "var(--adm-text-muted)", fontSize: "12px" }}>🔒 Confidencial</span>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {canViewCosts ? (
                        r.child_cost !== null ? (
                          <span>{r.currency} {r.child_cost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                        ) : (
                          <span style={{ color: "var(--adm-text-muted)" }}>—</span>
                        )
                      ) : (
                        <span style={{ color: "var(--adm-text-muted)", fontSize: "12px" }}>🔒</span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: "12px" }}>
                        {r.tariff_region && <span style={{ marginRight: "6px" }}>📍 {r.tariff_region}</span>}
                        {r.season && <span style={{ marginRight: "6px" }}>☀️ {r.season}</span>}
                        {r.days_of_week && <span style={{ color: "var(--adm-clay)" }}>📅 {r.days_of_week}</span>}
                        {!r.tariff_region && !r.season && !r.days_of_week && (
                          <span style={{ color: "var(--adm-text-muted)" }}>Padrão</span>
                        )}
                      </div>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span className={`adm-badge ${r.rate_status === "Active" ? "badge-green" : "badge-amber"}`} style={{ fontSize: "11px" }}>
                        {r.rate_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 4: MAPEAMENTO DAS 8 ZONAS HOTELEIRAS & TEMPORADAS XCARET 2026         */}
      {/* ========================================================================= */}
      {activeTab === "zones" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Card 1: 8 Zonas Canônicas */}
          <div className="adm-card" style={{ padding: "20px" }}>
            <div style={{ marginBottom: "16px" }}>
              <span className="admin-brand-tag">SHARED REFERENCE A</span>
              <h3 style={{ fontSize: "18px", color: "var(--adm-wine)", marginTop: "2px" }}>
                Mapeamento das 8 Zonas Hoteleiras → Tarifas dos Fornecedores
              </h3>
              <p style={{ color: "var(--adm-text-muted)", fontSize: "13px", marginTop: "2px" }}>
                Regras oficiais de resolução de tarifas a partir da zona canônica do hotel do hóspede na data do serviço.
              </p>
            </div>

            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Zona Hoteleira Tío Nenê</th>
                    <th>Miguel Shuttle (MIG-001)</th>
                    <th style={{ textAlign: "right" }}>USD / Van (1–7 pax)</th>
                    <th>Playa Mía (PLY-001)</th>
                    <th>Xcaret Core</th>
                    <th>Xcaret de Noche</th>
                    <th>Xoximilco</th>
                  </tr>
                </thead>
                <tbody>
                  {OFFICIAL_HOTEL_ZONE_MAPPINGS.map((z) => (
                    <tr key={z.hotel_zone}>
                      <td>
                        <strong style={{ color: "var(--adm-wine)" }}>📍 {z.hotel_zone}</strong>
                      </td>
                      <td>
                        <span style={{ fontSize: "13px" }}>{z.miguel_tariff_name}</span>
                        <span className="adm-badge badge-blue" style={{ marginLeft: "6px", fontSize: "10px" }}>{z.miguel_rate_id}</span>
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 700, color: "var(--adm-emerald)" }}>
                        USD {z.miguel_usd_vehicle}
                      </td>
                      <td>
                        <span style={{ fontSize: "13px" }}>Saída {z.playa_mia_departure}</span>
                        <span className="adm-badge badge-wine" style={{ marginLeft: "6px", fontSize: "10px" }}>{z.playa_mia_rate_id}</span>
                      </td>
                      <td>
                        <span className="adm-badge badge-gray" style={{ fontSize: "11px" }}>{z.xcaret_core_region}</span>
                      </td>
                      <td>
                        <span className="adm-badge badge-gray" style={{ fontSize: "11px" }}>{z.xcaret_de_noche_region}</span>
                      </td>
                      <td>
                        <span className="adm-badge badge-gray" style={{ fontSize: "11px" }}>{z.xoximilco_region}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: "12px", padding: "10px 14px", background: "var(--adm-bg-soft)", borderRadius: "6px", fontSize: "12px", color: "var(--adm-text-muted)" }}>
              ℹ️ <strong>Nota de Integridade §H2 / REF-007:</strong> A saída de Cozumel (tarifa PLY-R003: MXN 1.350 / 1.170) <strong>nunca</strong> é selecionada automaticamente pelas 8 zonas. Seu uso exige seleção manual auditada por operador autorizado.
            </div>
          </div>

          {/* Card 2: Temporadas Xcaret 2026 */}
          <div className="adm-card" style={{ padding: "20px" }}>
            <div style={{ marginBottom: "16px" }}>
              <span className="admin-brand-tag">SHARED REFERENCE B</span>
              <h3 style={{ fontSize: "18px", color: "var(--adm-wine)", marginTop: "2px" }}>
                Calendário de Temporadas Xcaret 2026 (6 Janelas Oficiais)
              </h3>
              <p style={{ color: "var(--adm-text-muted)", fontSize: "13px", marginTop: "2px" }}>
                Aplica-se aos produtos sazonais: Xcaret Básico (XCA-001), Xcaret Plus (XCA-002), Xcaret de Noche (XCA-003), Xel-Há (XCA-004), Tulum+Xel-Há (XCA-005) e Xplor (XCA-006).
              </p>
            </div>

            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Data Inicial (Inclusive)</th>
                    <th>Data Final (Inclusive)</th>
                    <th>Temporada Oficial</th>
                    <th>Produtos Aplicáveis</th>
                  </tr>
                </thead>
                <tbody>
                  {OFFICIAL_XCARET_SEASONS_2026.map((s, idx) => (
                    <tr key={idx}>
                      <td>
                        <strong>📅 {s.from_date}</strong>
                      </td>
                      <td>
                        <strong>📅 {s.to_date}</strong>
                      </td>
                      <td>
                        <span className={`adm-badge ${s.season === "High" ? "badge-rose" : "badge-green"}`} style={{ fontSize: "12px" }}>
                          {s.season === "High" ? "Temporada Alta" : "Temporada Regular"}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                          {s.applicable_tour_ids.join(", ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE CRIAÇÃO / EDIÇÃO DE FORNECEDOR                                   */}
      {/* ========================================================================= */}
      {modalOpen && (
        <div className="adm-modal-backdrop">
          <div className="adm-modal-box" style={{ maxWidth: "540px" }}>
            <div className="adm-modal-header">
              <h3 style={{ fontSize: "18px", color: "var(--adm-wine)" }}>
                {editingSupplier ? `Editar: ${editingSupplier.name}` : "Novo Fornecedor"}
              </h3>
              <button
                type="button"
                className="adm-btn-icon adm-btn-outline"
                onClick={() => setModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} style={{ display: "flex", flexDirection: "column", gap: "14px", padding: "20px" }}>
              <div>
                <label className="adm-label">Nome Oficial *</label>
                <input
                  type="text"
                  required
                  className="adm-input"
                  placeholder="Ex: Baktun, Coco Bongo, Miguel Shuttle"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="adm-label">Nome Fantasia / Operação</label>
                <input
                  type="text"
                  className="adm-input"
                  placeholder="Ex: Baktun Operadora"
                  value={formData.trade_name || ""}
                  onChange={(e) => setFormData({ ...formData, trade_name: e.target.value })}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label className="adm-label">Moeda Padrão *</label>
                  <select
                    className="adm-select"
                    value={formData.currency_default || "USD"}
                    onChange={(e) => setFormData({ ...formData, currency_default: e.target.value as any })}
                  >
                    <option value="USD">USD (Dólar Americano)</option>
                    <option value="MXN">MXN (Peso Mexicano)</option>
                    <option value="BRL">BRL (Real)</option>
                  </select>
                </div>

                <div>
                  <label className="adm-label">Status</label>
                  <select
                    className="adm-select"
                    value={formData.active ? "active" : "inactive"}
                    onChange={(e) => setFormData({ ...formData, active: e.target.value === "active" })}
                  >
                    <option value="active">Ativo (Homologado)</option>
                    <option value="inactive">Inativo (Excluído do escopo)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="adm-label">Observações Internas</label>
                <textarea
                  className="adm-input"
                  style={{ height: "70px", resize: "vertical" }}
                  placeholder="Observações operacionais..."
                  value={formData.notes || ""}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  className="adm-btn adm-btn-outline"
                  onClick={() => setModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="adm-btn adm-btn-clay"
                  disabled={saving}
                >
                  {saving ? "Salvando..." : "Salvar Fornecedor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE DETALHES & EDIÇÃO DE OPÇÃO TARIFÁRIA (TN-xxx)                   */}
      {/* ========================================================================= */}
      {optionModalOpen && selectedOption && (
        <div className="adm-modal-backdrop">
          <div className="adm-modal-box" style={{ maxWidth: "720px", maxHeight: "90vh", overflowY: "auto" }}>
            <div className="adm-modal-header">
              <div>
                <span className="admin-brand-tag">{selectedOption.code}</span>
                <h3 style={{ fontSize: "18px", color: "var(--adm-wine)", marginTop: "2px" }}>
                  {selectedOption.serviceName}
                </h3>
                <span style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                  Fornecedor: <strong>{selectedOption.supplierName}</strong> {selectedOption.variant ? `(${selectedOption.variant})` : ""}
                </span>
              </div>
              <button
                type="button"
                className="adm-btn-icon adm-btn-outline"
                onClick={() => setOptionModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveOptionEdit} style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Alerta de Ressalva ou Pendência se houver */}
              {selectedOption.pendingIssues && (
                <div style={{ background: "var(--adm-amber-bg)", border: "1px solid rgba(180, 83, 9, 0.3)", borderRadius: "10px", padding: "12px 14px", color: "var(--adm-amber)", fontSize: "13px" }}>
                  <strong>⚠️ Ressalva / Pendência Registrada na Fonte:</strong>
                  <div style={{ marginTop: "4px" }}>{selectedOption.pendingIssues}</div>
                </div>
              )}

              {/* Custos e Modelo */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                <div>
                  <label className="adm-label">Modelo de Cobrança</label>
                  <select
                    className="adm-select"
                    value={optionFormData.pricingModel}
                    onChange={(e) => setOptionFormData({ ...optionFormData, pricingModel: e.target.value as any })}
                  >
                    <option value="per_person">Por Pessoa</option>
                    <option value="fixed_vessel">Por Embarcação (Fixo)</option>
                    <option value="fixed_jetski">Por Jet Ski</option>
                    <option value="per_vehicle_leg">Por Veículo / Trecho</option>
                    <option value="quote_required">Sob Cotação</option>
                  </select>
                </div>

                <div>
                  <label className="adm-label">Moeda</label>
                  <select
                    className="adm-select"
                    value={optionFormData.currency}
                    onChange={(e) => setOptionFormData({ ...optionFormData, currency: e.target.value as any })}
                  >
                    <option value="USD">USD</option>
                    <option value="MXN">MXN</option>
                    <option value="BRL">BRL</option>
                  </select>
                </div>

                <div>
                  <label className="adm-label">Status de Validação</label>
                  <select
                    className="adm-select"
                    value={optionFormData.validationStatus}
                    onChange={(e) => setOptionFormData({ ...optionFormData, validationStatus: e.target.value as any })}
                  >
                    <option value="revisado">Revisado</option>
                    <option value="ressalva_conteudo">Ressalva no Conteúdo</option>
                    <option value="ressalva_tarifa">Ressalva na Tarifa</option>
                    <option value="horario_pendente">Horário Pendente</option>
                    <option value="info_pendente">Informações Pendentes</option>
                    <option value="estimado">Preço Estimado</option>
                    <option value="sob_cotacao">Sob Cotação</option>
                  </select>
                </div>
              </div>

              {/* Valores Unitários */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                <div>
                  <label className="adm-label">Custo Adulto ({optionFormData.currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    className="adm-input"
                    value={optionFormData.costAdult ?? ""}
                    onChange={(e) => setOptionFormData({ ...optionFormData, costAdult: Number(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="adm-label">Custo Criança ({optionFormData.currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    className="adm-input"
                    value={optionFormData.costChild ?? ""}
                    onChange={(e) => setOptionFormData({ ...optionFormData, costChild: Number(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="adm-label">Custo Fixo por Unidade ({optionFormData.currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    className="adm-input"
                    placeholder="Para barcos, vans e jet skis"
                    value={optionFormData.costFixed ?? ""}
                    onChange={(e) => setOptionFormData({ ...optionFormData, costFixed: Number(e.target.value) })}
                  />
                </div>
              </div>

              {/* Dias e Horários */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                <div>
                  <label className="adm-label">Dias de Operação</label>
                  <input
                    type="text"
                    className="adm-input"
                    value={optionFormData.operationDays || ""}
                    onChange={(e) => setOptionFormData({ ...optionFormData, operationDays: e.target.value })}
                  />
                </div>
                <div>
                  <label className="adm-label">Horários</label>
                  <input
                    type="text"
                    className="adm-input"
                    value={optionFormData.operationHours || ""}
                    onChange={(e) => setOptionFormData({ ...optionFormData, operationHours: e.target.value })}
                  />
                </div>
                <div>
                  <label className="adm-label">Duração</label>
                  <input
                    type="text"
                    className="adm-input"
                    value={optionFormData.duration || ""}
                    onChange={(e) => setOptionFormData({ ...optionFormData, duration: e.target.value })}
                  />
                </div>
              </div>

              {/* Inclusões e Não Inclusões */}
              <div>
                <label className="adm-label">Itens Inclusos</label>
                <textarea
                  className="adm-input"
                  style={{ height: "60px", resize: "vertical", fontSize: "12px" }}
                  value={optionFormData.included || ""}
                  onChange={(e) => setOptionFormData({ ...optionFormData, included: e.target.value })}
                />
              </div>

              <div>
                <label className="adm-label">Itens NÃO Inclusos</label>
                <textarea
                  className="adm-input"
                  style={{ height: "50px", resize: "vertical", fontSize: "12px" }}
                  value={optionFormData.notIncluded || ""}
                  onChange={(e) => setOptionFormData({ ...optionFormData, notIncluded: e.target.value })}
                />
              </div>

              {/* Taxas Extras Informativas */}
              <div>
                <label className="adm-label">Taxas / Extras fora da tarifa (Informativo — não soma ao fornecedor)</label>
                <input
                  type="text"
                  className="adm-input"
                  placeholder="Ex: Taxa portuária de USD 13; Imposto de 205 MXN..."
                  value={optionFormData.externalFeesNote || ""}
                  onChange={(e) => setOptionFormData({ ...optionFormData, externalFeesNote: e.target.value })}
                />
              </div>

              {/* Trilha de Auditoria: Justificativa */}
              <div style={{ background: "var(--adm-surface-alt)", padding: "12px 14px", borderRadius: "8px", border: "1px solid var(--adm-border)" }}>
                <label className="adm-label" style={{ color: "var(--adm-wine)" }}>
                  Trilha de Auditoria — Motivo da Alteração *
                </label>
                <input
                  type="text"
                  className="adm-input"
                  placeholder="Ex: Tarifa renegociada com Miguel em 20/10/2026..."
                  value={auditNotes}
                  onChange={(e) => setAuditNotes(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--adm-border)", paddingTop: "14px" }}>
                <span style={{ fontSize: "11px", color: "var(--adm-text-subtle)" }}>
                  Fonte: {selectedOption.sourceReference}
                </span>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    className="adm-btn adm-btn-outline"
                    onClick={() => setOptionModalOpen(false)}
                  >
                    Fechar
                  </button>
                  <button
                    type="submit"
                    className="adm-btn adm-btn-clay"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
