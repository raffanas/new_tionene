"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plane,
  Building,
  Users,
  Search,
  Eye,
  FileText,
  Clock,
  PhoneCall,
  DollarSign,
  Compass,
  CheckCircle2,
  X
} from "lucide-react";

interface HotelSchedule {
  hotel_name: string;
  checkin: string;
  checkout: string;
}

interface ContractItem {
  id?: string;
  tour_name: string;
  tour_date: string;
  adults_count: number;
  children_count: number;
  sale_price: number;
  cost_applied: number;
  supplier_name?: string;
  voucher_ref?: string;
}

interface ContractArrival {
  id: string;
  contract_number: string;
  client_name: string;
  client_cpf: string;
  client_phone: string;
  client_email: string;
  arrival_date: string;
  departure_date: string;
  arrival_flight_number: string;
  arrival_flight_time: string;
  depart_flight_number: string;
  depart_flight_time: string;
  adults_count: number;
  children_count: number;
  infants_count: number;
  hotels_schedule: HotelSchedule[];
  deposit_amount: number;
  balance_amount: number;
  total_amount: number;
  currency: string;
  status: string;
  items: ContractItem[];
}

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function AdminArrivalsLedgerPage() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth()); // 0-indexed
  const [arrivals, setArrivals] = useState<ContractArrival[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal de Detalhes da Chegada
  const [selectedArrival, setSelectedArrival] = useState<ContractArrival | null>(null);

  const fetchArrivals = async () => {
    setLoading(true);
    try {
      // Calcular primeiro e último dia do mês selecionado
      const firstDay = new Date(selectedYear, selectedMonth, 1).toISOString().split("T")[0];
      const lastDay = new Date(selectedYear, selectedMonth + 1, 0).toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("contracts")
        .select(`
          *,
          contract_items (*)
        `)
        .gte("arrival_date", firstDay)
        .lte("arrival_date", lastDay)
        .order("arrival_date", { ascending: true });

      if (error) {
        console.warn("Erro ao buscar chegadas:", error.message);
        setArrivals([]);
      } else if (data) {
        setArrivals(
          data.map((c: any) => ({
            ...c,
            items: (c.contract_items || []).map((i: any) => ({
              id: i.id,
              tour_name: i.tour_name_snapshot,
              tour_date: i.tour_date,
              adults_count: i.adults_count,
              children_count: i.children_count,
              sale_price: Number(i.sale_price || 0),
              cost_applied: Number(i.cost_applied || 0),
              supplier_name: i.supplier_name_snapshot,
              voucher_ref: i.voucher_ref,
            })),
          }))
        );
      }
    } catch (err) {
      console.error("Erro geral:", err);
      setArrivals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArrivals();
  }, [selectedYear, selectedMonth]);

  // Navegação de Mês
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const handleCurrentMonth = () => {
    const now = new Date();
    setSelectedYear(now.getFullYear());
    setSelectedMonth(now.getMonth());
  };

  // Filtragem local
  const filteredArrivals = arrivals.filter((a) => {
    const term = searchTerm.toLowerCase();
    const hotelNames = (a.hotels_schedule || []).map((h) => h.hotel_name.toLowerCase()).join(" ");
    return (
      a.client_name.toLowerCase().includes(term) ||
      a.contract_number.toLowerCase().includes(term) ||
      (a.client_phone && a.client_phone.includes(term)) ||
      hotelNames.includes(term)
    );
  });

  // Métricas do Mês
  const totalPaxAdults = arrivals.reduce((acc, a) => acc + (a.adults_count || 0), 0);
  const totalPaxChildren = arrivals.reduce((acc, a) => acc + (a.children_count || 0), 0);
  const totalToursInMonth = arrivals.reduce((acc, a) => acc + (a.items?.length || 0), 0);
  const totalBalanceInCancun = arrivals.reduce((acc, a) => acc + Number(a.balance_amount || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Cabeçalho */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <span className="admin-brand-tag">CLIENT LEDGER</span>
          <h2 style={{ fontSize: "28px", color: "var(--adm-wine)" }}>Visão Mensal de Chegadas</h2>
          <p style={{ color: "var(--adm-text-muted)", fontSize: "14px", marginTop: "2px" }}>
            Acompanhe a escala cronológica de clientes chegando em Cancún e seus passeios agendados.
          </p>
        </div>

        {/* Seletor de Mês e Ano */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#fff", padding: "6px 10px", borderRadius: "12px", border: "1px solid var(--adm-border)" }}>
          <button
            type="button"
            className="adm-btn adm-btn-icon adm-btn-outline adm-btn-sm"
            onClick={handlePrevMonth}
            title="Mês Anterior"
          >
            <ChevronLeft size={16} />
          </button>

          <span style={{ fontWeight: 700, color: "var(--adm-wine)", minWidth: "150px", textAlign: "center", fontSize: "15px" }}>
            {MONTH_NAMES[selectedMonth]} {selectedYear}
          </span>

          <button
            type="button"
            className="adm-btn adm-btn-icon adm-btn-outline adm-btn-sm"
            onClick={handleNextMonth}
            title="Próximo Mês"
          >
            <ChevronRight size={16} />
          </button>

          <button
            type="button"
            className="adm-btn adm-btn-outline adm-btn-sm"
            onClick={handleCurrentMonth}
            style={{ fontSize: "11px", padding: "4px 8px" }}
          >
            Hoje
          </button>
        </div>
      </div>

      {/* Cards de Métricas do Mês */}
      <div className="adm-kpi-grid">
        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <span>Chegadas Previstas</span>
            <Plane size={18} color="var(--adm-clay)" />
          </div>
          <div className="adm-kpi-value">{arrivals.length}</div>
          <div className="adm-kpi-desc">Famílias / grupos no mês</div>
        </div>

        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <span>Passageiros (PAX)</span>
            <Users size={18} color="var(--adm-blue)" />
          </div>
          <div className="adm-kpi-value">
            {totalPaxAdults + totalPaxChildren} <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--adm-text-muted)" }}>({totalPaxAdults} ad, {totalPaxChildren} ch)</span>
          </div>
          <div className="adm-kpi-desc">Total de passageiros no período</div>
        </div>

        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <span>Passeios no Roteiro</span>
            <Compass size={18} color="var(--adm-emerald)" />
          </div>
          <div className="adm-kpi-value">{totalToursInMonth}</div>
          <div className="adm-kpi-desc">Serviços a operar na agência</div>
        </div>

        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <span>Saldo a Cobrar em Cancún</span>
            <DollarSign size={18} color="var(--adm-amber)" />
          </div>
          <div className="adm-kpi-value">
            R$ {totalBalanceInCancun.toLocaleString("pt-BR")}
          </div>
          <div className="adm-kpi-desc">A acertar no check-in / transfer</div>
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
            placeholder="Buscar por cliente, contrato, telefone ou hotel..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Lista de Chegadas Cronológica */}
      {loading ? (
        <div className="adm-card" style={{ padding: "60px 20px", textAlign: "center" }}>
          <Clock size={28} className="animate-spin" color="var(--adm-clay)" style={{ margin: "0 auto 12px" }} />
          <p style={{ color: "var(--adm-text-muted)" }}>Buscando chegadas de {MONTH_NAMES[selectedMonth]} {selectedYear}...</p>
        </div>
      ) : filteredArrivals.length === 0 ? (
        <div className="adm-card" style={{ padding: "60px 20px", textAlign: "center" }}>
          <CalendarDays size={38} color="var(--adm-clay)" style={{ margin: "0 auto 12px", opacity: 0.5 }} />
          <h3>Nenhuma chegada programada para {MONTH_NAMES[selectedMonth]} de {selectedYear}</h3>
          <p style={{ color: "var(--adm-text-muted)", fontSize: "14px", marginTop: "4px" }}>
            Os contratos cadastrados para este mês aparecerão automaticamente aqui em ordem cronológica.
          </p>
          <Link href="/admin/contratos" className="adm-btn adm-btn-clay" style={{ marginTop: "16px", display: "inline-flex" }}>
            <span>Ir para Contratos</span>
          </Link>
        </div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Data Chegada</th>
                <th>Voo & Horário</th>
                <th>Cliente & Contato</th>
                <th>Hospedagem</th>
                <th>PAX</th>
                <th>Passeios Agendados</th>
                <th>Saldo Cancún</th>
                <th style={{ textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredArrivals.map((arr) => {
                const arrDateObj = new Date(arr.arrival_date + "T12:00:00");
                const dayOfWeek = arrDateObj.toLocaleDateString("pt-BR", { weekday: "short" });
                const mainHotel = arr.hotels_schedule?.[0]?.hotel_name || "A confirmar";

                return (
                  <tr key={arr.id} style={{ cursor: "pointer" }} onClick={() => setSelectedArrival(arr)}>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--adm-wine)" }}>
                        {arrDateObj.toLocaleDateString("pt-BR")}
                      </div>
                      <div style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--adm-clay)", fontWeight: 700 }}>
                        {dayOfWeek}
                      </div>
                    </td>

                    <td>
                      {arr.arrival_flight_number ? (
                        <div>
                          <div style={{ fontWeight: 600 }}>{arr.arrival_flight_number}</div>
                          <div style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>{arr.arrival_flight_time || "Horário s/ inf."}</div>
                        </div>
                      ) : (
                        <span style={{ fontSize: "12px", color: "var(--adm-text-subtle)" }}>Sem voo cadastrado</span>
                      )}
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, color: "var(--adm-text-main)" }}>{arr.client_name}</div>
                      <div style={{ fontSize: "11px", color: "var(--adm-clay)", display: "flex", alignItems: "center", gap: "4px" }}>
                        <PhoneCall size={11} />
                        <span>{arr.client_phone || "Sem telefone"}</span>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Building size={13} color="var(--adm-text-muted)" />
                        <span style={{ fontSize: "13px", fontWeight: 500 }}>{mainHotel}</span>
                      </div>
                      {arr.hotels_schedule && arr.hotels_schedule.length > 1 && (
                        <div style={{ fontSize: "10px", color: "var(--adm-text-muted)" }}>
                          +{arr.hotels_schedule.length - 1} outro(s) hotel(is)
                        </div>
                      )}
                    </td>

                    <td>
                      <span style={{ fontSize: "13px", fontWeight: 600 }}>
                        {arr.adults_count} ad{arr.children_count > 0 ? `, ${arr.children_count} ch` : ""}
                      </span>
                    </td>

                    <td>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", maxWidth: "260px" }}>
                        {(arr.items || []).map((it, itIdx) => (
                          <span
                            key={itIdx}
                            style={{
                              fontSize: "10px",
                              background: "var(--adm-surface-alt)",
                              border: "1px solid var(--adm-border)",
                              padding: "2px 6px",
                              borderRadius: "6px",
                              whiteSpace: "nowrap"
                            }}
                          >
                            {new Date(it.tour_date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} · {it.tour_name}
                          </span>
                        ))}
                        {(!arr.items || arr.items.length === 0) && (
                          <span style={{ fontSize: "11px", color: "var(--adm-text-subtle)" }}>Nenhum passeio</span>
                        )}
                      </div>
                    </td>

                    <td>
                      {arr.balance_amount > 0 ? (
                        <strong style={{ color: "var(--adm-amber)", fontSize: "13px" }}>
                          R$ {Number(arr.balance_amount).toLocaleString("pt-BR")}
                        </strong>
                      ) : (
                        <span style={{ fontSize: "12px", color: "var(--adm-emerald)", fontWeight: 600 }}>Quitado</span>
                      )}
                    </td>

                    <td style={{ textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="adm-btn adm-btn-outline adm-btn-sm"
                        onClick={() => setSelectedArrival(arr)}
                      >
                        <Eye size={13} />
                        <span>Ver Ficha</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* =========================================================================
          DRAWER / MODAL DE DETALHES OPERACIONAIS DA CHEGADA
         ========================================================================= */}
      {selectedArrival && (
        <div className="adm-modal-backdrop" onClick={() => setSelectedArrival(null)}>
          <div
            className="adm-modal-card"
            style={{ maxWidth: "680px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="adm-modal-header">
              <div>
                <span className="admin-brand-tag">FICHA OPERACIONAL DE CHEGADA</span>
                <h3 style={{ fontSize: "20px" }}>{selectedArrival.client_name}</h3>
                <span style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                  Contrato {selectedArrival.contract_number} · Chegada em {new Date(selectedArrival.arrival_date + "T12:00:00").toLocaleDateString("pt-BR")}
                </span>
              </div>
              <button type="button" className="adm-btn adm-btn-icon adm-btn-outline" onClick={() => setSelectedArrival(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="adm-modal-body" style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {/* Voos & Contato */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "var(--adm-surface-alt)", padding: "14px", borderRadius: "10px", border: "1px solid var(--adm-border)" }}>
                <div>
                  <div style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--adm-text-muted)", fontWeight: 700 }}>Voo de Chegada</div>
                  <div style={{ fontWeight: 600, fontSize: "14px", marginTop: "2px" }}>
                    {selectedArrival.arrival_flight_number || "Sem nº de voo"} {selectedArrival.arrival_flight_time ? `às ${selectedArrival.arrival_flight_time}` : ""}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                    Data: {selectedArrival.arrival_date ? new Date(selectedArrival.arrival_date + "T12:00:00").toLocaleDateString("pt-BR") : "—"}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--adm-text-muted)", fontWeight: 700 }}>Voo de Saída</div>
                  <div style={{ fontWeight: 600, fontSize: "14px", marginTop: "2px" }}>
                    {selectedArrival.depart_flight_number || "Sem nº de voo"} {selectedArrival.depart_flight_time ? `às ${selectedArrival.depart_flight_time}` : ""}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                    Data: {selectedArrival.departure_date ? new Date(selectedArrival.departure_date + "T12:00:00").toLocaleDateString("pt-BR") : "—"}
                  </div>
                </div>

                <div style={{ borderTop: "1px dashed var(--adm-border)", paddingTop: "8px", gridColumn: "span 2" }}>
                  <span style={{ fontSize: "12px" }}>
                    <strong>Contato:</strong> {selectedArrival.client_phone || "—"} | <strong>E-mail:</strong> {selectedArrival.client_email || "—"}
                  </span>
                </div>
              </div>

              {/* Hotéis da Estadia */}
              <div>
                <h4 style={{ fontSize: "14px", color: "var(--adm-wine)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Building size={14} color="var(--adm-clay)" />
                  <span>Hotéis durante a estadia</span>
                </h4>
                {(selectedArrival.hotels_schedule || []).map((h, idx) => (
                  <div key={idx} style={{ padding: "8px 12px", background: "#fff", border: "1px solid var(--adm-border)", borderRadius: "6px", marginBottom: "6px", fontSize: "13px", display: "flex", justifyContent: "space-between" }}>
                    <strong>{h.hotel_name || "Hotel não informado"}</strong>
                    <span style={{ color: "var(--adm-text-muted)", fontSize: "12px" }}>
                      Check-in: {h.checkin ? new Date(h.checkin + "T12:00:00").toLocaleDateString("pt-BR") : "—"} | Check-out: {h.checkout ? new Date(h.checkout + "T12:00:00").toLocaleDateString("pt-BR") : "—"}
                    </span>
                  </div>
                ))}
              </div>

              {/* Cronograma de Passeios */}
              <div>
                <h4 style={{ fontSize: "14px", color: "var(--adm-wine)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Compass size={14} color="var(--adm-clay)" />
                  <span>Cronograma de Passeios Contratados</span>
                </h4>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {(selectedArrival.items || []).map((it, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "10px 14px",
                        background: "#fff",
                        border: "1px solid var(--adm-border)",
                        borderRadius: "8px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "13px" }}>{it.tour_name}</div>
                        <div style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>
                          Operador: <strong>{it.supplier_name || "Operadora Local"}</strong> {it.voucher_ref ? `· Voucher: ${it.voucher_ref}` : ""}
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <span className="adm-badge badge-wine" style={{ fontSize: "11px" }}>
                          {new Date(it.tour_date + "T12:00:00").toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financeiro */}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", background: "var(--adm-surface-alt)", borderRadius: "8px", border: "1px solid var(--adm-border)" }}>
                <div>
                  <span style={{ fontSize: "11px", color: "var(--adm-text-muted)", display: "block" }}>Total Contrato</span>
                  <strong style={{ fontSize: "15px", color: "var(--adm-wine)" }}>
                    R$ {Number(selectedArrival.total_amount || 0).toLocaleString("pt-BR")}
                  </strong>
                </div>

                <div>
                  <span style={{ fontSize: "11px", color: "var(--adm-text-muted)", display: "block" }}>Depósito Pago</span>
                  <strong style={{ fontSize: "15px", color: "var(--adm-emerald)" }}>
                    R$ {Number(selectedArrival.deposit_amount || 0).toLocaleString("pt-BR")}
                  </strong>
                </div>

                <div>
                  <span style={{ fontSize: "11px", color: "var(--adm-text-muted)", display: "block" }}>Saldo em Cancún</span>
                  <strong style={{ fontSize: "15px", color: "var(--adm-amber)" }}>
                    R$ {Number(selectedArrival.balance_amount || 0).toLocaleString("pt-BR")}
                  </strong>
                </div>
              </div>
            </div>

            <div className="adm-modal-footer">
              <Link href="/admin/contratos" className="adm-btn adm-btn-outline adm-btn-sm">
                <FileText size={14} />
                <span>Abrir em Contratos</span>
              </Link>

              <button type="button" className="adm-btn adm-btn-clay adm-btn-sm" onClick={() => setSelectedArrival(null)}>
                <span>Fechar Ficha</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
