"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  CalendarCheck,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  X,
  Hotel,
  Users,
  Calendar,
  MapPin,
  Send,
  Ticket,
  ChevronRight,
  PlusCircle
} from "lucide-react";

interface Reservation {
  id: string;
  created_at?: string;
  booking_code: string;
  user_id?: string;
  destination_id?: string | null;
  package_id?: string | null;
  status: "draft" | "confirmed" | "active" | "completed" | "cancelled";
  checkin_date: string;
  checkout_date: string;
  adults: number;
  children: number;
  infants: number;
  accommodation_name?: string;
  accommodation_notes?: string;
  summary?: string;
  itinerary?: any[];
  internal_notes?: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Rascunho", color: "badge-amber" },
  confirmed: { label: "Confirmada", color: "badge-blue" },
  active: { label: "Em Andamento (Ativa)", color: "badge-green" },
  completed: { label: "Concluída", color: "badge-wine" },
  cancelled: { label: "Cancelada", color: "badge-rose" },
};

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRes, setEditingRes] = useState<Reservation | null>(null);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState<Partial<Reservation>>({
    booking_code: "",
    status: "confirmed",
    checkin_date: "",
    checkout_date: "",
    adults: 2,
    children: 0,
    infants: 0,
    accommodation_name: "",
    accommodation_notes: "",
    summary: "",
    itinerary: [],
    internal_notes: "",
  });

  // Itinerary temporary item
  const [newItineraryDay, setNewItineraryDay] = useState({
    day: 1,
    title: "",
    description: "",
  });

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReservations(data || []);
    } catch (err) {
      console.error("Erro ao carregar reservas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const generateBookingCode = () => {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `TN-${year}-${randomNum}`;
  };

  const handleOpenCreate = () => {
    setEditingRes(null);
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    setFormData({
      booking_code: generateBookingCode(),
      status: "confirmed",
      checkin_date: today.toISOString().split("T")[0],
      checkout_date: nextWeek.toISOString().split("T")[0],
      adults: 2,
      children: 0,
      infants: 0,
      accommodation_name: "Hyatt Ziva Cancún",
      accommodation_notes: "Quarto com vista para o mar. Transfer privativo já incluso.",
      summary: "Roteiro exclusivo com Chichén Itzá VIP e Catamarã para Isla Mujeres.",
      itinerary: [
        { day: 1, title: "Chegada no México & Transfer Privativo", description: "Recepção no aeroporto de Cancún e acomodação no hotel." },
        { day: 2, title: "Chichén Itzá & Cenote Sagrado", description: "Saída 07h30 do lobby com historiador privativo." },
        { day: 3, title: "Dia Livre nas Praias de Cancún", description: "Aproveite a gastronomia do hotel e o descanso caribenho." },
      ],
      internal_notes: "",
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (res: Reservation) => {
    setEditingRes(res);
    setFormData({
      ...res,
      itinerary: Array.isArray(res.itinerary) ? res.itinerary : [],
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.booking_code || !formData.checkin_date) {
      alert("Preencha o código da reserva e data de check-in.");
      return;
    }

    setSaving(true);
    try {
      if (editingRes) {
        const { error } = await supabase
          .from("reservations")
          .update({
            booking_code: formData.booking_code,
            status: formData.status,
            checkin_date: formData.checkin_date,
            checkout_date: formData.checkout_date,
            adults: formData.adults,
            children: formData.children,
            infants: formData.infants,
            accommodation_name: formData.accommodation_name,
            accommodation_notes: formData.accommodation_notes,
            summary: formData.summary,
            itinerary: formData.itinerary,
            internal_notes: formData.internal_notes,
          })
          .eq("id", editingRes.id);

        if (error) throw error;
      } else {
        // Obter id de usuário de fallback para auth foreign key se necessário
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id || "00000000-0000-0000-0000-000000000000";

        const { error } = await supabase.from("reservations").insert([
          {
            booking_code: formData.booking_code,
            user_id: userId,
            status: formData.status || "confirmed",
            checkin_date: formData.checkin_date,
            checkout_date: formData.checkout_date,
            adults: formData.adults || 1,
            children: formData.children || 0,
            infants: formData.infants || 0,
            accommodation_name: formData.accommodation_name,
            accommodation_notes: formData.accommodation_notes,
            summary: formData.summary,
            itinerary: formData.itinerary || [],
            internal_notes: formData.internal_notes,
          },
        ]);

        if (error) throw error;
      }

      setModalOpen(false);
      fetchReservations();
    } catch (err: any) {
      alert("Erro ao salvar reserva: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Deseja realmente remover a reserva "${code}"?`)) return;
    try {
      const { error } = await supabase.from("reservations").delete().eq("id", id);
      if (error) throw error;
      fetchReservations();
    } catch (err: any) {
      alert("Erro ao remover reserva: " + err.message);
    }
  };

  const filteredReservations = reservations.filter((r) => {
    const matchesSearch =
      r.booking_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.accommodation_name && r.accommodation_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2>Operacional de Reservas & Vouchers</h2>
          <p style={{ color: "var(--adm-text-muted)", fontSize: "14px", marginTop: "4px" }}>
            Emissão de cronogramas diários, hotéis, pick-ups e vouchers para passageiros confirmados.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button type="button" className="adm-btn adm-btn-outline adm-btn-icon" onClick={fetchReservations} title="Atualizar">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button type="button" className="adm-btn adm-btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} />
            <span>Nova Reserva</span>
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
                placeholder="Buscar código ou hotel..."
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
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          <span style={{ fontSize: "13px", color: "var(--adm-text-muted)" }}>
            Total: <strong>{filteredReservations.length}</strong> reservas
          </span>
        </div>

        {/* Tabela */}
        <div className="adm-table-responsive">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Hotel / Hospedagem</th>
                <th>Período</th>
                <th>Passageiros</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "40px" }}>
                    Carregando reservas operacionais...
                  </td>
                </tr>
              ) : filteredReservations.length > 0 ? (
                filteredReservations.map((res) => {
                  const statusInfo = STATUS_LABELS[res.status] || STATUS_LABELS.draft;

                  return (
                    <tr key={res.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <Ticket size={16} color="var(--adm-clay)" />
                          <span style={{ fontWeight: 700, color: "var(--adm-wine)", fontSize: "15px", fontFamily: "monospace" }}>
                            {res.booking_code}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: "var(--adm-text-main)" }}>
                          {res.accommodation_name || "Hotel a confirmar"}
                        </div>
                        {res.summary && (
                          <div style={{ fontSize: "12px", color: "var(--adm-text-subtle)", maxWidth: "280px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {res.summary}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: "13px", display: "flex", alignItems: "center", gap: "4px" }}>
                          <Calendar size={13} color="var(--adm-text-muted)" />
                          <span>{res.checkin_date} a {res.checkout_date}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: "13px" }}>
                          {res.adults} adt {res.children > 0 ? `+ ${res.children} chd` : ""}
                        </span>
                      </td>
                      <td>
                        <span className={`adm-badge ${statusInfo.color}`}>{statusInfo.label}</span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            className="adm-btn adm-btn-outline adm-btn-icon"
                            onClick={() => handleOpenEdit(res)}
                            title="Editar Reserva"
                          >
                            <Edit2 size={14} color="var(--adm-wine)" />
                          </button>
                          <button
                            type="button"
                            className="adm-btn adm-btn-outline adm-btn-icon"
                            onClick={() => handleDelete(res.id, res.booking_code)}
                            title="Excluir Reserva"
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
                  <td colSpan={6} style={{ textAlign: "center", padding: "48px" }}>
                    Nenhuma reserva cadastrada no momento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nova / Editar Reserva */}
      {modalOpen && (
        <div className="adm-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="adm-modal adm-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <div>
                <h3 style={{ fontSize: "20px" }}>
                  {editingRes ? `Editar Reserva ${formData.booking_code}` : "Nova Reserva de Viagem"}
                </h3>
                <p style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                  Configure hospedagem, passageiros e itinerário dia a dia
                </p>
              </div>
              <button type="button" className="adm-btn adm-btn-icon adm-btn-outline" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="adm-modal-body">
                <div className="adm-form-grid">
                  <div>
                    <label className="adm-label">Código da Reserva</label>
                    <input
                      type="text"
                      className="adm-input"
                      required
                      value={formData.booking_code || ""}
                      onChange={(e) => setFormData({ ...formData, booking_code: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="adm-label">Status Operacional</label>
                    <select
                      className="adm-select"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    >
                      {Object.entries(STATUS_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="adm-label">Data de Check-in</label>
                    <input
                      type="date"
                      className="adm-input"
                      required
                      value={formData.checkin_date || ""}
                      onChange={(e) => setFormData({ ...formData, checkin_date: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="adm-label">Data de Check-out</label>
                    <input
                      type="date"
                      className="adm-input"
                      required
                      value={formData.checkout_date || ""}
                      onChange={(e) => setFormData({ ...formData, checkout_date: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="adm-label">Adultos (12+ anos)</label>
                    <input
                      type="number"
                      min="1"
                      className="adm-input"
                      value={formData.adults || 1}
                      onChange={(e) => setFormData({ ...formData, adults: parseInt(e.target.value) || 1 })}
                    />
                  </div>

                  <div>
                    <label className="adm-label">Crianças (0-11 anos)</label>
                    <input
                      type="number"
                      min="0"
                      className="adm-input"
                      value={formData.children || 0}
                      onChange={(e) => setFormData({ ...formData, children: parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="adm-form-full">
                    <label className="adm-label">Hotel / Resort em Cancún</label>
                    <input
                      type="text"
                      className="adm-input"
                      placeholder="Ex: Hyatt Ziva Cancún / Hotel Xcaret Arte"
                      value={formData.accommodation_name || ""}
                      onChange={(e) => setFormData({ ...formData, accommodation_name: e.target.value })}
                    />
                  </div>

                  <div className="adm-form-full">
                    <label className="adm-label">Notas de Hospedagem & Transfers</label>
                    <input
                      type="text"
                      className="adm-input"
                      placeholder="Ex: Categoria Ocean Front. Voo de chegada AA123 às 14h20."
                      value={formData.accommodation_notes || ""}
                      onChange={(e) => setFormData({ ...formData, accommodation_notes: e.target.value })}
                    />
                  </div>

                  <div className="adm-form-full">
                    <label className="adm-label">Resumo Executivo da Viagem</label>
                    <textarea
                      className="adm-textarea"
                      placeholder="Breve resumo da proposta para o cliente..."
                      value={formData.summary || ""}
                      onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    />
                  </div>

                  {/* Montador de Itinerário Dia a Dia */}
                  <div className="adm-form-full" style={{ borderTop: "1px solid var(--adm-border)", paddingTop: "18px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <span className="adm-label" style={{ margin: 0 }}>Cronograma Dia a Dia (Itinerário)</span>
                      <span style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                        {formData.itinerary?.length || 0} dias programados
                      </span>
                    </div>

                    {/* Lista dos Dias Existentes */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                      {(formData.itinerary || []).map((item, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "10px 14px",
                            background: "var(--adm-surface-alt)",
                            borderRadius: "8px",
                            border: "1px solid var(--adm-border)"
                          }}
                        >
                          <div>
                            <span style={{ fontWeight: 700, color: "var(--adm-wine)", fontSize: "14px" }}>
                              Dia {item.day || idx + 1}: {item.title}
                            </span>
                            {item.description && (
                              <p style={{ fontSize: "12px", color: "var(--adm-text-muted)", margin: "2px 0 0" }}>
                                {item.description}
                              </p>
                            )}
                          </div>

                          <button
                            type="button"
                            className="adm-btn adm-btn-outline adm-btn-icon"
                            style={{ width: "28px", height: "28px" }}
                            onClick={() => {
                              const list = [...(formData.itinerary || [])];
                              list.splice(idx, 1);
                              setFormData({ ...formData, itinerary: list });
                            }}
                          >
                            <X size={12} color="var(--adm-rose)" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Adicionar Novo Dia */}
                    <div style={{ display: "grid", gridTemplateColumns: "100px 1fr 1fr auto", gap: "8px", alignItems: "end" }}>
                      <div>
                        <label className="adm-label">Dia #</label>
                        <input
                          type="number"
                          className="adm-input"
                          value={newItineraryDay.day}
                          onChange={(e) => setNewItineraryDay({ ...newItineraryDay, day: parseInt(e.target.value) || 1 })}
                        />
                      </div>
                      <div>
                        <label className="adm-label">Título da Atividade</label>
                        <input
                          type="text"
                          className="adm-input"
                          placeholder="Ex: Cenote & Ruínas"
                          value={newItineraryDay.title}
                          onChange={(e) => setNewItineraryDay({ ...newItineraryDay, title: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="adm-label">Horário / Descrição</label>
                        <input
                          type="text"
                          className="adm-input"
                          placeholder="Ex: Saída do hotel às 08h00"
                          value={newItineraryDay.description}
                          onChange={(e) => setNewItineraryDay({ ...newItineraryDay, description: e.target.value })}
                        />
                      </div>
                      <button
                        type="button"
                        className="adm-btn adm-btn-outline"
                        style={{ height: "42px" }}
                        onClick={() => {
                          if (newItineraryDay.title.trim()) {
                            setFormData({
                              ...formData,
                              itinerary: [...(formData.itinerary || []), { ...newItineraryDay }],
                            });
                            setNewItineraryDay({
                              day: (formData.itinerary?.length || 0) + 2,
                              title: "",
                              description: "",
                            });
                          }
                        }}
                      >
                        + Dia
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="adm-modal-footer">
                <button type="button" className="adm-btn adm-btn-outline" onClick={() => setModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="adm-btn adm-btn-primary" disabled={saving}>
                  {saving ? "Salvando..." : "Salvar Reserva"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
