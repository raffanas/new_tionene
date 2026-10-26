"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  X,
  Compass,
  Check,
  AlertCircle,
  HelpCircle,
  Layers,
  Sparkles,
  MapPin,
  Calendar,
  Users
} from "lucide-react";
import { CommercialProduct, CanonicalHotelZone } from "@/types/supplier-commercial";
import { calculateCommercialPricing } from "@/lib/commercial-pricing-engine";

interface CommercialProductSelectorModalProps {
  open: boolean;
  onClose: () => void;
  onSelectProduct: (tourId: string) => void;
  commercialProducts: CommercialProduct[];
  arrivalDate?: string;
  adultsCount?: number;
  childrenCount?: number;
  hotelZone?: string | null;
  canViewCosts?: boolean;
}

const PROVIDERS_LIST = [
  "Todos",
  "Baktun",
  "Coco Bongo",
  "Envatours",
  "Miguel Shuttle",
  "MTZ Tours",
  "MUSA",
  "Parasailing & Jet Ski",
  "Playa Mía",
  "The Dolphin Company",
  "Xcaret"
];

const TYPES_LIST = [
  { value: "all", label: "Todas as Categorias" },
  { value: "Tour", label: "Passeios Culturais & Parques (Tour)" },
  { value: "Activity", label: "Atividades & Náutica (Activity)" },
  { value: "Transfer", label: "Transfers Privativos (Transfer)" },
  { value: "Package", label: "Pacotes & Combos (Package)" },
];

export function CommercialProductSelectorModal({
  open,
  onClose,
  onSelectProduct,
  commercialProducts,
  arrivalDate,
  adultsCount = 2,
  childrenCount = 0,
  hotelZone,
  canViewCosts = false,
}: CommercialProductSelectorModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("Todos");
  const [selectedType, setSelectedType] = useState("all");

  const filteredProducts = useMemo(() => {
    return commercialProducts.filter((p) => {
      if (selectedProvider !== "Todos") {
        const matchesProvider =
          p.provider.toLowerCase().includes(selectedProvider.toLowerCase()) ||
          (selectedProvider === "Xcaret" && p.provider_code === "XCA") ||
          (selectedProvider === "Playa Mía" && p.provider_code === "PLY") ||
          (selectedProvider === "Parasailing & Jet Ski" && p.provider_code === "PJS");
        if (!matchesProvider) return false;
      }

      if (selectedType !== "all" && p.product_type !== selectedType) {
        return false;
      }

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = p.display_name.toLowerCase().includes(term);
        const matchesTourId = p.tour_id.toLowerCase().includes(term);
        const matchesProviderName = p.provider.toLowerCase().includes(term);
        const matchesSubtype = p.product_subtype?.toLowerCase().includes(term);
        const matchesNotes = p.ancillary_notes?.toLowerCase().includes(term);
        if (!matchesName && !matchesTourId && !matchesProviderName && !matchesSubtype && !matchesNotes) {
          return false;
        }
      }

      return true;
    });
  }, [commercialProducts, selectedProvider, selectedType, searchTerm]);

  if (!open) return null;

  return (
    <div
      className="adm-modal-overlay"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(44, 40, 37, 0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        className="adm-modal"
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "860px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
          border: "1px solid var(--adm-border)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid var(--adm-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--adm-surface-alt, #faf8f5)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "var(--adm-wine)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Compass size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: "17px", fontWeight: 700, color: "var(--adm-wine)", margin: 0 }}>
                Catálogo Comercial Oficial (52 Produtos)
              </h3>
              <p style={{ fontSize: "12px", color: "var(--adm-text-muted)", margin: "2px 0 0 0" }}>
                Passeios, atrações e transfers oficiais do Tío Nenê (v0.1.43)
              </p>
            </div>
          </div>
          <button
            type="button"
            className="adm-btn adm-btn-icon adm-btn-outline"
            style={{ borderRadius: "50%", width: "32px", height: "32px", padding: 0 }}
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        {/* Barra de Filtros e Busca */}
        <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--adm-border)", display: "flex", flexDirection: "column", gap: "12px", background: "#ffffff" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "10px" }}>
            <div style={{ position: "relative" }}>
              <Search
                size={16}
                style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--adm-text-muted)" }}
              />
              <input
                type="text"
                className="adm-input"
                style={{ paddingLeft: "36px", height: "40px", fontSize: "13px" }}
                placeholder="Buscar por nome, código (ex: XCA-001, MIG-001) ou tipo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>

            <select
              className="adm-select"
              style={{ height: "40px", fontSize: "13px" }}
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              {TYPES_LIST.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro de Fornecedores em Pílulas */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", overflowX: "auto", paddingBottom: "4px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--adm-text-muted)", whiteSpace: "nowrap", marginRight: "4px" }}>
              Fornecedor:
            </span>
            {PROVIDERS_LIST.map((p) => {
              const active = selectedProvider === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSelectedProvider(p)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "20px",
                    fontSize: "11px",
                    fontWeight: active ? 700 : 500,
                    border: active ? "1px solid var(--adm-wine)" : "1px solid var(--adm-border)",
                    background: active ? "var(--adm-wine)" : "#ffffff",
                    color: active ? "#ffffff" : "var(--adm-text)",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 0.15s ease",
                  }}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>

        {/* Lista de Produtos */}
        <div style={{ padding: "16px 24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
          {filteredProducts.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--adm-text-muted)" }}>
              <AlertCircle size={28} style={{ margin: "0 auto 8px", opacity: 0.5 }} />
              <div style={{ fontSize: "14px", fontWeight: 600 }}>Nenhum produto oficial encontrado</div>
              <div style={{ fontSize: "12px", marginTop: "4px" }}>Tente ajustar os termos de pesquisa ou fornecedor selecionado.</div>
            </div>
          ) : (
            filteredProducts.map((p) => {
              // Simulação prévia do cálculo tarifário (apenas informativo)
              const simCalc = calculateCommercialPricing({
                tourId: p.tour_id,
                serviceDate: arrivalDate,
                hotelZone: hotelZone,
                adultsCount: adultsCount,
                childrenCount: childrenCount,
              });

              return (
                <div
                  key={p.tour_id}
                  style={{
                    padding: "14px 16px",
                    borderRadius: "10px",
                    border: "1px solid var(--adm-border)",
                    background: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "14px",
                    transition: "box-shadow 0.15s ease, border-color 0.15s ease",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                      <span
                        className="adm-badge"
                        style={{
                          background: "var(--adm-wine)",
                          color: "#ffffff",
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "2px 7px",
                        }}
                      >
                        {p.tour_id}
                      </span>
                      <span
                        className="adm-badge adm-badge-neutral"
                        style={{ fontSize: "11px", fontWeight: 600 }}
                      >
                        {p.provider}
                      </span>
                      <span
                        className="adm-badge"
                        style={{
                          fontSize: "10px",
                          background: p.product_type === "Transfer" ? "#e0f2fe" : p.product_type === "Activity" ? "#fef3c7" : "#ecfdf5",
                          color: p.product_type === "Transfer" ? "#0369a1" : p.product_type === "Activity" ? "#b45309" : "#047857",
                          fontWeight: 600,
                        }}
                      >
                        {p.product_type} {p.product_subtype ? `· ${p.product_subtype}` : ""}
                      </span>
                      {p.requires_ancillary_booking && (
                        <span className="adm-badge adm-badge-warning" style={{ fontSize: "10px" }}>
                          Requer Transfer Separado
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--adm-text)" }}>
                      {p.display_name}
                    </div>

                    {p.supplier_product_name && p.supplier_product_name !== p.display_name && (
                      <div style={{ fontSize: "11px", color: "var(--adm-text-muted)", marginTop: "2px" }}>
                        Nome no fornecedor: {p.supplier_product_name}
                      </div>
                    )}

                    {/* Informações de Regras e Tarifas */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "6px", fontSize: "11px", color: "var(--adm-text-muted)" }}>
                      {simCalc.pricingBasis && (
                        <span>Modelo: <strong>{simCalc.pricingBasis === "Person" ? "Por Pessoa" : simCalc.pricingBasis === "Vehicle" ? "Por Veículo (Van)" : simCalc.pricingBasis === "Boat" ? "Por Barco" : simCalc.pricingBasis}</strong></span>
                      )}
                      {simCalc.currency && (
                        <span>Moeda Operacional: <strong>{simCalc.currency}</strong></span>
                      )}
                      {canViewCosts && simCalc.calculatedTotalCost !== null && (
                        <span style={{ color: "var(--adm-wine)", fontWeight: 700 }}>
                          Custo Estimado: {simCalc.currency} {simCalc.calculatedTotalCost.toFixed(2)}
                        </span>
                      )}
                      {simCalc.isQuoteRequired && (
                        <span style={{ color: "#d97706", fontWeight: 600 }}>
                          ⚠️ Valor sob consulta (Manual)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Ação */}
                  <button
                    type="button"
                    className="adm-btn adm-btn-primary adm-btn-sm"
                    style={{
                      height: "36px",
                      padding: "0 16px",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      flexShrink: 0,
                    }}
                    onClick={() => onSelectProduct(p.tour_id)}
                  >
                    <Check size={14} />
                    <span>Adicionar</span>
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Rodapé Informativo */}
        <div
          style={{
            padding: "12px 24px",
            borderTop: "1px solid var(--adm-border)",
            background: "var(--adm-surface-alt, #faf8f5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "12px",
            color: "var(--adm-text-muted)",
          }}
        >
          <span>
            Exibindo <strong>{filteredProducts.length}</strong> de <strong>{commercialProducts.length}</strong> produtos comerciais oficiais
          </span>
          <span style={{ fontSize: "11px" }}>
            Os custos e sazonalidades são calculados automaticamente conforme a data e hotel do contrato.
          </span>
        </div>
      </div>
    </div>
  );
}
