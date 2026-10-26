"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
  Building,
  Search,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Sparkles,
  MapPin,
  Home
} from "lucide-react";

export const CANONICAL_ZONES = [
  "Puerto Juarez",
  "Isla Blanca",
  "Cancun Center",
  "Cancun Hotel Zone",
  "Maya Riviera",
  "Playa del Carmen",
  "Tulum Center",
  "Tulum Hotel Zone"
] as const;

export type CanonicalZone = typeof CANONICAL_ZONES[number];

export interface HotelSchedule {
  hotel_id?: string | null;
  hotel_name: string;
  zone?: string | null;
  is_manual?: boolean;
  checkin: string;
  checkout: string;
}

interface MasterHotel {
  id: string;
  name: string;
  zone: string;
}

interface HotelScheduleRowProps {
  item: HotelSchedule;
  index: number;
  total: number;
  onChange: (updated: HotelSchedule) => void;
  onRemove: () => void;
}

function HotelScheduleRow({ item, index, total, onChange, onRemove }: HotelScheduleRowProps) {
  const [searchTerm, setSearchTerm] = useState(item.hotel_name || "");
  const [results, setResults] = useState<MasterHotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isEditingSelection, setIsEditingSelection] = useState(!item.hotel_name);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Para contratos legados: se tem hotel_name mas não tem zone, tenta resolver automaticamente no catálogo
  useEffect(() => {
    if (item.hotel_name && !item.zone && !item.is_manual) {
      let isMounted = true;
      supabase
        .from("hotels")
        .select("id, name, zone")
        .ilike("name", item.hotel_name.trim())
        .limit(1)
        .then(({ data }) => {
          if (isMounted && data && data.length > 0) {
            onChange({
              ...item,
              hotel_id: data[0].id,
              hotel_name: data[0].name,
              zone: data[0].zone,
              is_manual: false
            });
          }
        });
      return () => {
        isMounted = false;
      };
    }
  }, [item.hotel_name]);

  // Busca com debounce no Supabase
  useEffect(() => {
    if (!isEditingSelection || item.is_manual) {
      setResults([]);
      return;
    }

    const trimmed = searchTerm.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const timer = setTimeout(async () => {
      try {
        const { data, error: qErr } = await supabase
          .from("hotels")
          .select("id, name, zone")
          .eq("active", true)
          .ilike("name", `%${trimmed}%`)
          .order("name")
          .limit(15);

        if (qErr) {
          console.error("Erro ao buscar hotéis:", qErr);
          setError("Falha ao consultar catálogo de hotéis.");
          setResults([]);
        } else {
          setResults(data || []);
        }
      } catch (err: any) {
        console.error("Exceção na busca de hotéis:", err);
        setError("Erro de conexão na consulta.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchTerm, isEditingSelection, item.is_manual]);

  // Se o item já tiver nome e zona vinculados, exibe o card fixo
  const hasSelectedHotel = !isEditingSelection && item.hotel_name.trim().length > 0;

  const handleSelectHotel = (hotel: MasterHotel) => {
    onChange({
      ...item,
      hotel_id: hotel.id,
      hotel_name: hotel.name,
      zone: hotel.zone,
      is_manual: false
    });
    setSearchTerm(hotel.name);
    setIsEditingSelection(false);
    setIsOpen(false);
  };

  const handleSwitchToManual = () => {
    onChange({
      ...item,
      hotel_id: null,
      is_manual: true,
      hotel_name: searchTerm || item.hotel_name || "",
      // Preserva a zona se já existir, ou deixa para seleção explícita
      zone: item.zone || ""
    });
    setIsEditingSelection(true);
    setIsOpen(false);
  };

  const handleSwitchToCatalog = () => {
    onChange({
      ...item,
      is_manual: false,
      hotel_id: null,
      // Não apaga o nome digitado, usa como busca inicial
      hotel_name: item.hotel_name || ""
    });
    setSearchTerm(item.hotel_name || "");
    setIsEditingSelection(true);
  };

  return (
    <div
      style={{
        background: "var(--adm-surface-alt, #fcfbfa)",
        border: "1px solid var(--adm-border, #e8e2d8)",
        borderRadius: "var(--adm-radius-md, 12px)",
        padding: "12px 14px",
        marginBottom: "10px",
        position: "relative"
      }}
    >
      {/* Cabeçalho da Estadia */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px",
          borderBottom: "1px dashed var(--adm-border, #e8e2d8)",
          paddingBottom: "8px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "var(--adm-wine, #3d181f)",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}
          >
            {item.is_manual ? <Home size={14} color="var(--adm-amber, #b45309)" /> : <Building size={14} color="var(--adm-clay, #a55e40)" />}
            Estadia {index + 1} de {total}
          </span>

          {item.is_manual ? (
            <span
              className="adm-badge adm-badge-amber"
              style={{
                fontSize: "11px",
                padding: "2px 8px",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              Hospedagem Manual / Airbnb
            </span>
          ) : (
            <span
              className="adm-badge adm-badge-blue"
              style={{
                fontSize: "11px",
                padding: "2px 8px",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              Catálogo Oficial (1.125 Hotéis)
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {item.is_manual ? (
            <button
              type="button"
              className="adm-btn adm-btn-outline adm-btn-sm"
              onClick={handleSwitchToCatalog}
              title="Voltar para busca no catálogo oficial"
              style={{ fontSize: "11px", padding: "3px 8px" }}
            >
              <RotateCcw size={12} style={{ marginRight: "4px" }} />
              Buscar no Catálogo
            </button>
          ) : (
            <button
              type="button"
              className="adm-btn adm-btn-outline adm-btn-sm"
              onClick={handleSwitchToManual}
              title="Informar hospedagem manual ou Airbnb que não consta no catálogo"
              style={{ fontSize: "11px", padding: "3px 8px", color: "var(--adm-amber, #b45309)" }}
            >
              <Home size={12} style={{ marginRight: "4px" }} />
              Hospedagem Manual / Airbnb
            </button>
          )}

          {total > 1 && (
            <button
              type="button"
              className="adm-btn adm-btn-icon adm-btn-outline adm-btn-sm"
              style={{ color: "var(--adm-rose, #be123c)" }}
              onClick={onRemove}
              title="Remover esta estadia"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Grid de Campos: Hotel/Zona + Checkin + Checkout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: item.is_manual ? "1.8fr 1.2fr 1fr 1fr" : "2.6fr 1fr 1fr",
          gap: "10px",
          alignItems: "start"
        }}
      >
        {/* COLUNA 1: SELEÇÃO OU INPUT DO HOTEL */}
        <div style={{ position: "relative" }} ref={dropdownRef}>
          {item.is_manual ? (
            // Modo Hospedagem Manual (Input Livre)
            <div>
              <label style={{ display: "block", fontSize: "11px", color: "var(--adm-text-muted)", marginBottom: "3px" }}>
                Nome do Estabelecimento / Endereço Manual
              </label>
              <input
                type="text"
                className="adm-input"
                placeholder="Ex.: Airbnb Condomínio Playacar, Casa de Praia..."
                value={item.hotel_name}
                onChange={(e) => {
                  onChange({ ...item, hotel_name: e.target.value });
                  setSearchTerm(e.target.value);
                }}
              />
            </div>
          ) : hasSelectedHotel ? (
            // Modo Catálogo Oficial: Hotel Já Selecionado
            <div>
              <label style={{ display: "block", fontSize: "11px", color: "var(--adm-text-muted)", marginBottom: "3px" }}>
                Hotel Oficial Selecionado
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "#ffffff",
                  border: "1px solid var(--adm-border, #e8e2d8)",
                  borderRadius: "var(--adm-radius-sm, 8px)",
                  padding: "7px 10px",
                  minHeight: "38px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                  <Building size={16} color="var(--adm-wine, #3d181f)" style={{ flexShrink: 0 }} />
                  <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <span style={{ fontWeight: 600, color: "var(--adm-wine, #3d181f)", fontSize: "13px" }}>
                      {item.hotel_name}
                    </span>
                    {item.zone && (
                      <span
                        className="adm-badge adm-badge-blue"
                        style={{ marginLeft: "8px", fontSize: "11px", padding: "1px 6px" }}
                      >
                        {item.zone}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className="adm-btn adm-btn-outline adm-btn-sm"
                  style={{ fontSize: "11px", padding: "2px 8px", marginLeft: "6px", flexShrink: 0 }}
                  onClick={() => {
                    setIsEditingSelection(true);
                    setIsOpen(true);
                  }}
                >
                  Alterar
                </button>
              </div>
            </div>
          ) : (
            // Modo Catálogo Oficial: Campo de Busca com Autocomplete
            <div>
              <label style={{ display: "block", fontSize: "11px", color: "var(--adm-text-muted)", marginBottom: "3px" }}>
                Buscar no Catálogo Oficial (1.125 hotéis)
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  className="adm-input"
                  placeholder="Digite o nome do hotel (ex.: Riu, Hard Rock, Secrets...)"
                  value={searchTerm}
                  onFocus={() => setIsOpen(true)}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setIsOpen(true);
                  }}
                  style={{ paddingLeft: "32px" }}
                />
                <Search
                  size={15}
                  color="var(--adm-text-subtle, #9c918e)"
                  style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }}
                />
              </div>

              {/* Dropdown Flutuante de Resultados */}
              {isOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    zIndex: 60,
                    background: "#ffffff",
                    border: "1px solid var(--adm-border, #e8e2d8)",
                    borderRadius: "var(--adm-radius-md, 12px)",
                    boxShadow: "var(--adm-shadow-lg, 0 12px 32px rgba(61, 24, 31, 0.12))",
                    marginTop: "4px",
                    maxHeight: "260px",
                    overflowY: "auto"
                  }}
                >
                  {loading && (
                    <div style={{ padding: "12px", textAlign: "center", fontSize: "12px", color: "var(--adm-text-muted)" }}>
                      <span>Buscando no catálogo de hotéis...</span>
                    </div>
                  )}

                  {error && (
                    <div style={{ padding: "10px", background: "#fef2f2", color: "var(--adm-rose)", fontSize: "12px" }}>
                      <AlertCircle size={14} style={{ display: "inline", marginRight: "4px" }} />
                      {error}
                    </div>
                  )}

                  {!loading && !error && searchTerm.trim().length < 2 && (
                    <div style={{ padding: "12px", textAlign: "center", fontSize: "12px", color: "var(--adm-text-subtle)" }}>
                      Digite ao menos 2 caracteres para pesquisar...
                    </div>
                  )}

                  {!loading && !error && searchTerm.trim().length >= 2 && results.length === 0 && (
                    <div style={{ padding: "12px", textAlign: "center" }}>
                      <p style={{ fontSize: "12px", color: "var(--adm-text-muted)", margin: "0 0 8px 0" }}>
                        Nenhum hotel oficial encontrado para <strong>"{searchTerm}"</strong>.
                      </p>
                      <button
                        type="button"
                        className="adm-btn adm-btn-clay adm-btn-sm"
                        onClick={handleSwitchToManual}
                        style={{ fontSize: "11px" }}
                      >
                        <Home size={12} style={{ marginRight: "4px" }} />
                        Usar como Hospedagem Manual
                      </button>
                    </div>
                  )}

                  {!loading && results.length > 0 && (
                    <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                      {results.map((hotel) => (
                        <li
                          key={hotel.id}
                          onClick={() => handleSelectHotel(hotel)}
                          style={{
                            padding: "8px 12px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            borderBottom: "1px solid #f1f5f9",
                            fontSize: "13px",
                            transition: "background-color 0.15s ease"
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--adm-bg, #f7f5f0)")}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <Building size={14} color="var(--adm-clay)" />
                            <span style={{ fontWeight: 600, color: "var(--adm-text-main)" }}>{hotel.name}</span>
                          </div>
                          <span
                            className="adm-badge adm-badge-blue"
                            style={{ fontSize: "10px", padding: "1px 6px", whiteSpace: "nowrap" }}
                          >
                            {hotel.zone}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* COLUNA 1.5 (Apenas se Manual): Seleção da Zona Canônica */}
        {item.is_manual && (
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "var(--adm-text-muted)", marginBottom: "3px" }}>
              Zona Canônica Correspondente
            </label>
            <select
              className="adm-input"
              value={item.zone || ""}
              onChange={(e) => onChange({ ...item, zone: e.target.value })}
              style={{ fontSize: "12px" }}
            >
              <option value="">-- Selecione a Zona --</option>
              {CANONICAL_ZONES.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* COLUNA 2: CHECK-IN */}
        <div>
          <label style={{ display: "block", fontSize: "11px", color: "var(--adm-text-muted)", marginBottom: "3px" }}>
            Check-in
          </label>
          <input
            type="date"
            className="adm-input"
            value={item.checkin || ""}
            onChange={(e) => onChange({ ...item, checkin: e.target.value })}
            style={{ fontSize: "12px" }}
          />
        </div>

        {/* COLUNA 3: CHECK-OUT */}
        <div>
          <label style={{ display: "block", fontSize: "11px", color: "var(--adm-text-muted)", marginBottom: "3px" }}>
            Check-out
          </label>
          <input
            type="date"
            className="adm-input"
            value={item.checkout || ""}
            onChange={(e) => onChange({ ...item, checkout: e.target.value })}
            style={{ fontSize: "12px" }}
          />
        </div>
      </div>
    </div>
  );
}

interface HotelScheduleSectionProps {
  schedules: HotelSchedule[];
  onChange: (updated: HotelSchedule[]) => void;
}

export function HotelScheduleSection({ schedules, onChange }: HotelScheduleSectionProps) {
  const currentList = schedules && schedules.length > 0 ? schedules : [{ hotel_name: "", checkin: "", checkout: "" }];

  const handleUpdateItem = (index: number, updated: HotelSchedule) => {
    const list = [...currentList];
    list[index] = updated;
    onChange(list);
  };

  const handleRemoveItem = (index: number) => {
    if (currentList.length <= 1) {
      // Se for o único, limpa os campos em vez de remover a linha
      onChange([{ hotel_name: "", checkin: "", checkout: "" }]);
      return;
    }
    const list = currentList.filter((_, i) => i !== index);
    onChange(list);
  };

  const handleAddItem = () => {
    onChange([
      ...currentList,
      {
        hotel_name: "",
        checkin: "",
        checkout: "",
        is_manual: false
      }
    ]);
  };

  return (
    <div style={{ borderTop: "1px solid var(--adm-border, #e8e2d8)", paddingTop: "18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div>
          <h4
            style={{
              fontSize: "15px",
              color: "var(--adm-wine, #3d181f)",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <Building size={16} color="var(--adm-clay, #a55e40)" />
            <span>3. Resumo de Hotéis e Hospedagem na Estadia</span>
          </h4>
          <p style={{ fontSize: "12px", color: "var(--adm-text-muted)", margin: "2px 0 0 0" }}>
            Selecione no catálogo de 1.125 hotéis para preenchimento automático da zona ou informe hospedagem manual (Airbnb).
          </p>
        </div>

        <button
          type="button"
          className="adm-btn adm-btn-outline adm-btn-sm"
          onClick={handleAddItem}
        >
          <Plus size={13} style={{ marginRight: "4px" }} />
          <span>Adicionar Outra Estadia</span>
        </button>
      </div>

      {currentList.map((item, idx) => (
        <HotelScheduleRow
          key={idx}
          item={item}
          index={idx}
          total={currentList.length}
          onChange={(upd) => handleUpdateItem(idx, upd)}
          onRemove={() => handleRemoveItem(idx)}
        />
      ))}
    </div>
  );
}
