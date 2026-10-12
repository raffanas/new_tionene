"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { TOURS as DEFAULT_TOURS } from "@/data/tours";
import {
  Compass,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Star,
  RefreshCw,
  X,
  UploadCloud,
  DollarSign,
  Clock,
  Sparkles
} from "lucide-react";

interface Tour {
  id: string;
  name: string;
  slug: string;
  destination_id?: string | null;
  description?: string;
  price?: number | null;
  price_label?: string;
  contact_only?: boolean;
  duration?: string;
  included?: string[];
  not_included?: string[];
  image_url?: string;
  category?: string[] | string;
  active: boolean;
  featured: boolean;
}

interface Destination {
  id: string;
  name: string;
  slug: string;
}

export default function AdminToursPage() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState<Partial<Tour>>({
    name: "",
    slug: "",
    destination_id: "",
    description: "",
    price: 0,
    price_label: "por adulto",
    contact_only: false,
    duration: "Dia todo",
    included: [],
    not_included: [],
    image_url: "",
    category: ["cultura"],
    active: true,
    featured: false,
  });

  const [newIncludedItem, setNewIncludedItem] = useState("");
  const [newNotIncludedItem, setNewNotIncludedItem] = useState("");

  const fetchTours = async () => {
    setLoading(true);
    try {
      const [toursRes, destsRes] = await Promise.all([
        supabase.from("tours").select("*").order("name", { ascending: true }),
        supabase.from("destinations").select("id, name, slug").order("name", { ascending: true }),
      ]);

      if (toursRes.data && toursRes.data.length > 0) {
        setTours(toursRes.data);
      } else {
        // Fallback dinâmico com o catálogo de passeios mantendo destinos do Supabase
        const defaultDestId = destsRes.data?.[0]?.id || null;
        const mapped = DEFAULT_TOURS.map((t, idx) => ({
          id: `tour-${t.slug}`,
          name: t.name,
          slug: t.slug,
          destination_id: defaultDestId,
          description: t.description || t.shortDescription,
          price: t.priceFrom,
          price_label: "por pessoa",
          contact_only: false,
          duration: t.duration,
          included: t.included,
          not_included: t.notIncluded,
          image_url: t.heroImage,
          category: [t.category],
          active: true,
          featured: idx < 4,
        }));
        setTours(mapped);
      }
      if (destsRes.data) setDestinations(destsRes.data);
    } catch (err) {
      console.error("Erro ao carregar passeios:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTours();
  }, []);

  const handleOpenCreate = () => {
    setEditingTour(null);
    setFormData({
      name: "",
      slug: "",
      destination_id: destinations[0]?.id || "",
      description: "",
      price: 150,
      price_label: "por adulto",
      contact_only: false,
      duration: "Dia todo",
      included: ["Transporte executivo climatizado", "Guia bilíngue credenciado"],
      not_included: ["Bebidas alcoólicas adicionais", "Gorjetas"],
      image_url: "/passeios/chichen-itza.jpg",
      category: ["cultura"],
      active: true,
      featured: false,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (tour: Tour) => {
    setEditingTour(tour);
    setFormData({
      ...tour,
      included: Array.isArray(tour.included) ? tour.included : [],
      not_included: Array.isArray(tour.not_included) ? tour.not_included : [],
      category: Array.isArray(tour.category) ? tour.category : [tour.category || "cultura"],
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.slug) {
      alert("Por favor, preencha o nome e o slug do passeio.");
      return;
    }

    setSaving(true);
    try {
      if (editingTour) {
        const { error } = await supabase
          .from("tours")
          .update({
            name: formData.name,
            slug: formData.slug,
            destination_id: formData.destination_id || null,
            description: formData.description,
            price: formData.price,
            price_label: formData.price_label,
            contact_only: formData.contact_only,
            duration: formData.duration,
            included: formData.included,
            not_included: formData.not_included,
            image_url: formData.image_url,
            category: formData.category,
            active: formData.active,
            featured: formData.featured,
          })
          .eq("id", editingTour.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("tours").insert([
          {
            name: formData.name,
            slug: formData.slug,
            destination_id: formData.destination_id || null,
            description: formData.description,
            price: formData.price,
            price_label: formData.price_label,
            contact_only: formData.contact_only,
            duration: formData.duration,
            included: formData.included,
            not_included: formData.not_included,
            image_url: formData.image_url,
            category: formData.category,
            active: formData.active ?? true,
            featured: formData.featured ?? false,
          },
        ]);

        if (error) throw error;
      }

      setModalOpen(false);
      fetchTours();
    } catch (err: any) {
      console.error("Erro ao salvar passeio:", err);
      alert("Erro ao salvar passeio: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Deseja realmente excluir o passeio "${name}"?`)) return;

    try {
      const { error } = await supabase.from("tours").delete().eq("id", id);
      if (error) throw error;
      fetchTours();
    } catch (err: any) {
      alert("Erro ao excluir: " + err.message);
    }
  };

  // Seed / Sincronizar catálogo inicial caso banco esteja vazio
  const handleSeedTours = async () => {
    if (!confirm("Deseja sincronizar o banco com os passeios padrão do site?")) return;
    setLoading(true);
    try {
      const cancunDest = destinations.find((d) => d.slug.includes("cancun")) || destinations[0];
      const payload = DEFAULT_TOURS.map((t) => ({
        name: t.name,
        slug: t.slug,
        destination_id: cancunDest?.id || null,
        description: t.description || t.shortDescription,
        price: t.adultPrice || t.priceFrom,
        price_label: "por adulto",
        contact_only: false,
        duration: t.duration || "Dia todo",
        included: t.included || [],
        not_included: t.notIncluded || [],
        image_url: t.heroImage || `/passeios/${t.slug}.jpg`,
        category: [t.category.toLowerCase()],
        active: true,
        featured: t.slug === "chichen-itza" || t.slug === "isla-mujeres",
      }));

      const { error } = await supabase.from("tours").upsert(payload, { onConflict: "slug" });
      if (error) throw error;
      alert("Catálogo sincronizado com sucesso!");
      fetchTours();
    } catch (err: any) {
      alert("Erro na sincronização: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filtros
  const filteredTours = tours.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Barra de Topo */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2>Catálogo de Passeios & Experiências</h2>
          <p style={{ color: "var(--adm-text-muted)", fontSize: "14px", marginTop: "4px" }}>
            Gerencie experiências avulsas, valores de venda, itinerários e status de exibição.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {tours.length === 0 && (
            <button type="button" className="adm-btn adm-btn-outline" onClick={handleSeedTours}>
              <UploadCloud size={16} />
              <span>Sincronizar Catálogo Padrão</span>
            </button>
          )}

          <button type="button" className="adm-btn adm-btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} />
            <span>Novo Passeio</span>
          </button>
        </div>
      </div>

      {/* Toolbar & Busca */}
      <div className="adm-table-container">
        <div className="adm-table-toolbar">
          <div className="adm-search-input">
            <Search size={16} color="var(--adm-text-muted)" />
            <input
              type="text"
              placeholder="Buscar por nome ou slug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "var(--adm-text-muted)" }}>
              Total: <strong>{filteredTours.length}</strong> passeios
            </span>
            <button
              type="button"
              className="adm-btn adm-btn-outline adm-btn-icon"
              onClick={fetchTours}
              title="Recarregar tabela"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Tabela de Passeios */}
        <div className="adm-table-responsive">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Passeio</th>
                <th>Destino</th>
                <th>Duração</th>
                <th>Preço</th>
                <th>Destaque</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "40px" }}>
                    Carregando passeios...
                  </td>
                </tr>
              ) : filteredTours.length > 0 ? (
                filteredTours.map((tour) => {
                  const destName = destinations.find((d) => d.id === tour.destination_id)?.name || "Cancún";

                  return (
                    <tr key={tour.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                          <img
                            src={tour.image_url || "/passeios/chichen-itza.jpg"}
                            alt={tour.name}
                            style={{
                              width: "48px",
                              height: "48px",
                              borderRadius: "10px",
                              objectFit: "cover",
                              border: "1px solid var(--adm-border)"
                            }}
                            onError={(e) => {
                              (e.target as any).src = "https://images.unsplash.com/photo-1518638150340-f706e86654de?auto=format&fit=crop&w=150&q=80";
                            }}
                          />
                          <div>
                            <div style={{ fontWeight: 700, color: "var(--adm-wine)", fontSize: "15px" }}>
                              {tour.name}
                            </div>
                            <div style={{ fontSize: "12px", color: "var(--adm-text-subtle)", fontFamily: "monospace" }}>
                              /{tour.slug}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="adm-badge badge-wine">{destName}</span>
                      </td>
                      <td>{tour.duration || "Dia todo"}</td>
                      <td>
                        {tour.contact_only ? (
                          <span style={{ fontSize: "13px", color: "var(--adm-text-muted)" }}>Sob consulta</span>
                        ) : (
                          <span style={{ fontWeight: 700, color: "var(--adm-clay)" }}>
                            ${tour.price} <small style={{ color: "var(--adm-text-subtle)" }}>{tour.price_label || "adulto"}</small>
                          </span>
                        )}
                      </td>
                      <td>
                        {tour.featured ? (
                          <span className="adm-badge badge-amber" style={{ display: "inline-flex", gap: "4px" }}>
                            <Star size={11} fill="currentColor" /> Destaque
                          </span>
                        ) : (
                          <span style={{ color: "var(--adm-text-subtle)", fontSize: "12px" }}>-</span>
                        )}
                      </td>
                      <td>
                        {tour.active ? (
                          <span className="adm-badge badge-green">Ativo</span>
                        ) : (
                          <span className="adm-badge badge-rose">Inativo</span>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            className="adm-btn adm-btn-outline adm-btn-icon"
                            onClick={() => handleOpenEdit(tour)}
                            title="Editar Passeio"
                          >
                            <Edit2 size={14} color="var(--adm-wine)" />
                          </button>
                          <button
                            type="button"
                            className="adm-btn adm-btn-outline adm-btn-icon"
                            onClick={() => handleDelete(tour.id, tour.name)}
                            title="Excluir Passeio"
                          >
                            <Trash2 size={14} color="var(--adm-rose)" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "48px" }}>
                    <p style={{ color: "var(--adm-text-muted)", fontSize: "15px" }}>Nenhum passeio encontrado.</p>
                    <button type="button" className="adm-btn adm-btn-clay adm-btn-sm" onClick={handleSeedTours} style={{ marginTop: "12px" }}>
                      Sincronizar Passeios Padrão
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Criação / Edição */}
      {modalOpen && (
        <div className="adm-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="adm-modal adm-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <div>
                <h3 style={{ fontSize: "20px" }}>{editingTour ? "Editar Passeio" : "Novo Passeio"}</h3>
                <p style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                  Preencha os detalhes e itens inclusos do passeio
                </p>
              </div>
              <button
                type="button"
                className="adm-btn adm-btn-icon adm-btn-outline"
                onClick={() => setModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="adm-modal-body">
                <div className="adm-form-grid">
                  <div className="adm-form-full">
                    <label className="adm-label">Nome do Passeio</label>
                    <input
                      type="text"
                      className="adm-input"
                      required
                      placeholder="Ex: Chichén Itzá & Cenote Sagrado"
                      value={formData.name || ""}
                      onChange={(e) => {
                        const name = e.target.value;
                        setFormData({
                          ...formData,
                          name,
                          slug: editingTour
                            ? formData.slug
                            : name
                                .toLowerCase()
                                .normalize("NFD")
                                .replace(/[\u0300-\u036f]/g, "")
                                .replace(/[^a-z0-9]/g, "-")
                                .replace(/-+/g, "-"),
                        });
                      }}
                    />
                  </div>

                  <div>
                    <label className="adm-label">Slug (URL)</label>
                    <input
                      type="text"
                      className="adm-input"
                      required
                      placeholder="ex: chichen-itza"
                      value={formData.slug || ""}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="adm-label">Destino Vinculado</label>
                    <select
                      className="adm-select"
                      value={formData.destination_id || ""}
                      onChange={(e) => setFormData({ ...formData, destination_id: e.target.value })}
                    >
                      <option value="">Selecione o destino</option>
                      {destinations.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="adm-label">Preço Adulto (USD / R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="adm-input"
                      placeholder="Ex: 159"
                      value={formData.price || ""}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div>
                    <label className="adm-label">Rótulo do Preço</label>
                    <input
                      type="text"
                      className="adm-input"
                      placeholder="Ex: por adulto, por pessoa"
                      value={formData.price_label || ""}
                      onChange={(e) => setFormData({ ...formData, price_label: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="adm-label">Duração Estimada</label>
                    <input
                      type="text"
                      className="adm-input"
                      placeholder="Ex: Dia todo, 8 horas, 4h"
                      value={formData.duration || ""}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="adm-label">URL da Imagem</label>
                    <input
                      type="text"
                      className="adm-input"
                      placeholder="/passeios/chichen-itza.jpg ou URL externa"
                      value={formData.image_url || ""}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    />
                  </div>

                  <div className="adm-form-full">
                    <label className="adm-label">Descrição Completa</label>
                    <textarea
                      className="adm-textarea"
                      placeholder="Descreva a experiência, história, atmosfera e diferenciais..."
                      value={formData.description || ""}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  {/* Gerenciador de Itens Inclusos */}
                  <div className="adm-form-full">
                    <label className="adm-label">O que está incluso</label>
                    <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                      <input
                        type="text"
                        className="adm-input"
                        placeholder="Adicionar item incluso..."
                        value={newIncludedItem}
                        onChange={(e) => setNewIncludedItem(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (newIncludedItem.trim()) {
                              setFormData({
                                ...formData,
                                included: [...(formData.included || []), newIncludedItem.trim()],
                              });
                              setNewIncludedItem("");
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="adm-btn adm-btn-outline"
                        onClick={() => {
                          if (newIncludedItem.trim()) {
                            setFormData({
                              ...formData,
                              included: [...(formData.included || []), newIncludedItem.trim()],
                            });
                            setNewIncludedItem("");
                          }
                        }}
                      >
                        Adicionar
                      </button>
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {(formData.included || []).map((inc, idx) => (
                        <span
                          key={idx}
                          className="adm-badge badge-green"
                          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                        >
                          {inc}
                          <X
                            size={12}
                            style={{ cursor: "pointer" }}
                            onClick={() => {
                              const list = [...(formData.included || [])];
                              list.splice(idx, 1);
                              setFormData({ ...formData, included: list });
                            }}
                          />
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Opções de Ativo / Destaque */}
                  <div>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={formData.active ?? true}
                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      />
                      <span style={{ fontSize: "14px", fontWeight: 600 }}>Passeio Ativo (visível no site)</span>
                    </label>
                  </div>

                  <div>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={formData.featured ?? false}
                        onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      />
                      <span style={{ fontSize: "14px", fontWeight: 600 }}>Destacar na Página Inicial</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="adm-modal-footer">
                <button type="button" className="adm-btn adm-btn-outline" onClick={() => setModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="adm-btn adm-btn-primary" disabled={saving}>
                  {saving ? "Salvando..." : "Salvar Passeio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
