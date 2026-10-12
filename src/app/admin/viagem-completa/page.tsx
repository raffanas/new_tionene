"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  Star,
  RefreshCw,
  X,
  Calendar,
  DollarSign,
  Check,
  CheckCircle2,
  ListChecks
} from "lucide-react";

interface TravelPackage {
  id: string;
  name: string;
  slug: string;
  slogan?: string;
  description?: string;
  duration_days: number;
  duration_info?: string;
  price_value?: number;
  price_label?: string;
  inclusions?: string[];
  itinerary?: any[];
  suggested_hotels?: string[];
  image_url?: string;
  is_featured?: boolean;
  is_active?: boolean;
}

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<TravelPackage[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<TravelPackage | null>(null);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState<Partial<TravelPackage>>({
    name: "",
    slug: "",
    slogan: "",
    description: "",
    duration_days: 7,
    duration_info: "7 dias / 6 noites",
    price_value: 9800,
    price_label: "por pessoa",
    inclusions: [],
    image_url: "",
    is_featured: false,
    is_active: true,
  });

  const [newInclusion, setNewInclusion] = useState("");

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("travel_packages")
        .select("*")
        .order("duration_days", { ascending: true });

      if (error) throw error;
      setPackages(data || []);
    } catch (err) {
      console.error("Erro ao carregar pacotes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleOpenCreate = () => {
    setEditingPkg(null);
    setFormData({
      name: "",
      slug: "",
      slogan: "A experiência ideal no Caribe",
      description: "",
      duration_days: 7,
      duration_info: "7 dias / 6 noites",
      price_value: 8500,
      price_label: "por pessoa",
      inclusions: ["Hospedagem selecionada com café da manhã", "Transfers in/out privativos aeroporto", "2 passeios exclusivos com guia"],
      image_url: "",
      is_featured: false,
      is_active: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (pkg: TravelPackage) => {
    setEditingPkg(pkg);
    setFormData({
      ...pkg,
      inclusions: Array.isArray(pkg.inclusions) ? pkg.inclusions : [],
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.slug) {
      alert("Preencha nome e slug.");
      return;
    }

    setSaving(true);
    try {
      if (editingPkg) {
        const { error } = await supabase
          .from("travel_packages")
          .update({
            name: formData.name,
            slug: formData.slug,
            slogan: formData.slogan,
            description: formData.description,
            duration_days: formData.duration_days,
            duration_info: formData.duration_info,
            price_value: formData.price_value,
            price_label: formData.price_label,
            inclusions: formData.inclusions,
            image_url: formData.image_url,
            is_featured: formData.is_featured,
            is_active: formData.is_active,
          })
          .eq("id", editingPkg.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("travel_packages").insert([
          {
            name: formData.name,
            slug: formData.slug,
            slogan: formData.slogan,
            description: formData.description,
            duration_days: formData.duration_days || 7,
            duration_info: formData.duration_info || `${formData.duration_days} dias`,
            price_value: formData.price_value || 0,
            price_label: formData.price_label || "por pessoa",
            inclusions: formData.inclusions || [],
            image_url: formData.image_url,
            is_featured: formData.is_featured ?? false,
            is_active: formData.is_active ?? true,
          },
        ]);

        if (error) throw error;
      }

      setModalOpen(false);
      fetchPackages();
    } catch (err: any) {
      alert("Erro ao salvar pacote: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Deseja realmente remover o pacote "${name}"?`)) return;
    try {
      const { error } = await supabase.from("travel_packages").delete().eq("id", id);
      if (error) throw error;
      fetchPackages();
    } catch (err: any) {
      alert("Erro ao remover: " + err.message);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2>Pacotes de Viagem Completa</h2>
          <p style={{ color: "var(--adm-text-muted)", fontSize: "14px", marginTop: "4px" }}>
            Roteiros fechados de múltiplos dias com logística, passeios e assessoria integrada.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button type="button" className="adm-btn adm-btn-outline adm-btn-icon" onClick={fetchPackages} title="Atualizar">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button type="button" className="adm-btn adm-btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} />
            <span>Novo Pacote</span>
          </button>
        </div>
      </div>

      {/* Cards Grid dos Pacotes */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
        {loading ? (
          <div style={{ padding: "40px", color: "var(--adm-text-muted)" }}>Carregando pacotes...</div>
        ) : packages.length > 0 ? (
          packages.map((pkg) => (
            <div key={pkg.id} className="adm-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <span className="adm-badge badge-wine">{pkg.duration_days} DIAS</span>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      type="button"
                      className="adm-btn adm-btn-outline adm-btn-icon"
                      onClick={() => handleOpenEdit(pkg)}
                      title="Editar"
                    >
                      <Edit2 size={13} color="var(--adm-wine)" />
                    </button>
                    <button
                      type="button"
                      className="adm-btn adm-btn-outline adm-btn-icon"
                      onClick={() => handleDelete(pkg.id, pkg.name)}
                      title="Excluir"
                    >
                      <Trash2 size={13} color="var(--adm-rose)" />
                    </button>
                  </div>
                </div>

                <h3 style={{ fontSize: "22px", color: "var(--adm-wine)", marginBottom: "4px" }}>{pkg.name}</h3>
                <p style={{ fontSize: "13px", color: "var(--adm-clay)", fontWeight: 600, marginBottom: "12px" }}>
                  {pkg.slogan || "Roteiro exclusivo Tio Nenê"}
                </p>

                <p style={{ fontSize: "14px", color: "var(--adm-text-muted)", lineHeight: "1.4", marginBottom: "16px" }}>
                  {pkg.description || "Pacote personalizado com curadoria de experiências, transfers e hotéis selecionados."}
                </p>

                {/* Inclusões Resumo */}
                <div style={{ borderTop: "1px solid var(--adm-border)", paddingTop: "12px", marginTop: "12px" }}>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--adm-text-muted)", fontWeight: 700 }}>
                    Principais Inclusões:
                  </span>
                  <ul style={{ paddingLeft: "18px", margin: "8px 0 0", fontSize: "13px", color: "var(--adm-text-main)", lineHeight: "1.5" }}>
                    {(pkg.inclusions || []).slice(0, 3).map((inc, i) => (
                      <li key={i}>{inc}</li>
                    ))}
                    {(pkg.inclusions || []).length > 3 && (
                      <li style={{ color: "var(--adm-text-muted)" }}>+ {pkg.inclusions!.length - 3} itens adicionais</li>
                    )}
                  </ul>
                </div>
              </div>

              <div
                style={{
                  marginTop: "20px",
                  paddingTop: "14px",
                  borderTop: "1px solid var(--adm-border)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <div>
                  <span style={{ fontSize: "11px", color: "var(--adm-text-muted)", textTransform: "uppercase" }}>Investimento</span>
                  <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--adm-wine)", fontFamily: "Georgia, serif" }}>
                    R$ {pkg.price_value?.toLocaleString("pt-BR") || "Sob consulta"}
                  </div>
                </div>

                <span className={`adm-badge ${pkg.is_active ? "badge-green" : "badge-rose"}`}>
                  {pkg.is_active ? "Ativo" : "Inativo"}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div style={{ padding: "40px", color: "var(--adm-text-muted)" }}>Nenhum pacote cadastrado.</div>
        )}
      </div>

      {/* Modal de Criação / Edição de Pacote */}
      {modalOpen && (
        <div className="adm-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="adm-modal adm-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <div>
                <h3 style={{ fontSize: "20px" }}>{editingPkg ? "Editar Pacote de Viagem" : "Novo Pacote"}</h3>
                <p style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>Ajuste valores, duração e inclusões</p>
              </div>
              <button type="button" className="adm-btn adm-btn-icon adm-btn-outline" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="adm-modal-body">
                <div className="adm-form-grid">
                  <div className="adm-form-full">
                    <label className="adm-label">Nome do Pacote</label>
                    <input
                      type="text"
                      className="adm-input"
                      required
                      placeholder="Ex: Cancún Oficial"
                      value={formData.name || ""}
                      onChange={(e) => {
                        const name = e.target.value;
                        setFormData({
                          ...formData,
                          name,
                          slug: editingPkg
                            ? formData.slug
                            : name
                                .toLowerCase()
                                .normalize("NFD")
                                .replace(/[\u0300-\u036f]/g, "")
                                .replace(/[^a-z0-9]/g, "-"),
                        });
                      }}
                    />
                  </div>

                  <div>
                    <label className="adm-label">Slug</label>
                    <input
                      type="text"
                      className="adm-input"
                      required
                      value={formData.slug || ""}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="adm-label">Duração em Dias</label>
                    <input
                      type="number"
                      className="adm-input"
                      value={formData.duration_days || 7}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          duration_days: parseInt(e.target.value) || 1,
                          duration_info: `${e.target.value} dias / ${Math.max(1, parseInt(e.target.value) - 1)} noites`,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="adm-label">Preço Base (R$)</label>
                    <input
                      type="number"
                      className="adm-input"
                      value={formData.price_value || 0}
                      onChange={(e) => setFormData({ ...formData, price_value: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div>
                    <label className="adm-label">Rótulo de Preço</label>
                    <input
                      type="text"
                      className="adm-input"
                      value={formData.price_label || "por pessoa"}
                      onChange={(e) => setFormData({ ...formData, price_label: e.target.value })}
                    />
                  </div>

                  <div className="adm-form-full">
                    <label className="adm-label">Slogan / Chamada Curta</label>
                    <input
                      type="text"
                      className="adm-input"
                      placeholder="Ex: O roteiro mais equilibrado para primeira viagem"
                      value={formData.slogan || ""}
                      onChange={(e) => setFormData({ ...formData, slogan: e.target.value })}
                    />
                  </div>

                  <div className="adm-form-full">
                    <label className="adm-label">Descrição do Pacote</label>
                    <textarea
                      className="adm-textarea"
                      placeholder="Descreva o perfil de passageiro ideal e os destaques deste pacote..."
                      value={formData.description || ""}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  {/* Gerenciador de Inclusões */}
                  <div className="adm-form-full">
                    <label className="adm-label">Itens Inclusos no Pacote</label>
                    <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                      <input
                        type="text"
                        className="adm-input"
                        placeholder="Adicionar item incluso (ex: Hospedagem 4 estrelas)..."
                        value={newInclusion}
                        onChange={(e) => setNewInclusion(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (newInclusion.trim()) {
                              setFormData({
                                ...formData,
                                inclusions: [...(formData.inclusions || []), newInclusion.trim()],
                              });
                              setNewInclusion("");
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="adm-btn adm-btn-outline"
                        onClick={() => {
                          if (newInclusion.trim()) {
                            setFormData({
                              ...formData,
                              inclusions: [...(formData.inclusions || []), newInclusion.trim()],
                            });
                            setNewInclusion("");
                          }
                        }}
                      >
                        Adicionar
                      </button>
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {(formData.inclusions || []).map((inc, idx) => (
                        <span key={idx} className="adm-badge badge-wine" style={{ display: "inline-flex", gap: "6px" }}>
                          {inc}
                          <X
                            size={12}
                            style={{ cursor: "pointer" }}
                            onClick={() => {
                              const list = [...(formData.inclusions || [])];
                              list.splice(idx, 1);
                              setFormData({ ...formData, inclusions: list });
                            }}
                          />
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={formData.is_active ?? true}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      />
                      <span style={{ fontSize: "14px", fontWeight: 600 }}>Pacote Ativo</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="adm-modal-footer">
                <button type="button" className="adm-btn adm-btn-outline" onClick={() => setModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="adm-btn adm-btn-primary" disabled={saving}>
                  {saving ? "Salvando..." : "Salvar Pacote"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
