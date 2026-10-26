// =============================================================================
// TIPOS CANÔNICOS DE FORNECEDORES, PRODUTOS COMERCIAIS E TARIFAS OFICIAIS
// TÍO NENÊ — v0.1.43 (10 Fornecedores, 52 Produtos Comerciais, 80 Tarifas)
// =============================================================================

export type SupplierCurrency = "USD" | "MXN" | "BRL";

export type PricingBasis = "Person" | "Boat" | "Vehicle" | "Equipment" | "Package";

export type ProductType = "Tour" | "Activity" | "Transfer" | "Package";

export type RateStatus = "Active" | "Manual Only" | "Review Required" | "Inactive";

export type Season = "Regular" | "High";

export type CanonicalHotelZone =
  | "Puerto Juarez"
  | "Isla Blanca"
  | "Cancun Center"
  | "Cancun Hotel Zone"
  | "Maya Riviera"
  | "Playa del Carmen"
  | "Tulum Center"
  | "Tulum Hotel Zone";

export interface OfficialSupplier {
  id: string;
  code: string; // BAK, COC, ENV, MIG, MTZ, MUS, PJS, PLY, DOL, XCA
  name: string;
  trade_name: string;
  category: string;
  currency_default: SupplierCurrency;
  notes?: string;
  active: boolean;
  status: "ativo" | "inativo";
}

export interface CommercialProduct {
  tour_id: string; // Ex: 'BAK-001', 'PLY-001', 'MIG-001', 'XCA-001'
  provider: string; // Nome do fornecedor (ex: 'Baktun', 'Playa Mía', 'Xcaret')
  provider_code: string; // BAK, COC, ENV, MIG, MTZ, MUS, PJS, PLY, DOL, XCA
  supplier_product_name: string; // Nome original operacional no fornecedor
  display_name: string; // Nome exibido para vendedor e nos contratos dos clientes
  product_type: ProductType;
  product_subtype?: string; // Private Boat, Jet Ski, Nightclub Ticket, Airport Transfer, etc.
  seller_visible: boolean; // Visível para seleção por vendedores
  status: "Active" | "Inactive";
  pricing_model_default?: PricingBasis;
  requires_ancillary_booking?: boolean; // Ex: iate privativo requer transfer separado
  ancillary_notes?: string;
}

export interface SupplierRate {
  rate_id: string; // Ex: 'BAK-R001', 'PLY-R002', 'MIG-R001', 'XCA-R015'
  tour_id: string; // Chave estrangeira lógica para CommercialProduct.tour_id
  supplier_rate_name: string; // Nome exato da tarifa no fornecedor
  pricing_basis: PricingBasis;
  adult_cost: number | null; // NULL se desconhecido ou não aplicável (NUNCA forçado para 0)
  child_cost: number | null; // NULL se desconhecido ou não aplicável (NUNCA forçado para 0)
  infant_cost?: number | null; // NULL se não cotado
  fixed_cost: number | null; // Custo fixo por unidade para Boat/Vehicle/Equipment
  currency: SupplierCurrency;
  tariff_region?: string | null;
  season?: Season | string | null;
  days_of_week?: string | null; // Semicolon separated, ex: "Sun;Mon;Tue;Wed"
  departure_area?: string | null;
  route?: string | null;
  min_passengers?: number | null;
  max_passengers?: number | null;
  transportation_included: boolean;
  additional_charges?: string | null;
  effective_from?: string | null;
  effective_to?: string | null;
  rate_status: RateStatus;
  notes?: string | null;
}

export interface HotelZoneMapping {
  hotel_zone: CanonicalHotelZone;
  miguel_tariff_name: string;
  miguel_rate_id: string;
  miguel_usd_vehicle: number;
  playa_mia_departure: string;
  playa_mia_rate_id: string;
  xcaret_core_region: string;
  xcaret_de_noche_region: string;
  xoximilco_region: string;
}

export interface XcaretSeasonWindow {
  from_date: string; // YYYY-MM-DD (inclusive)
  to_date: string; // YYYY-MM-DD (inclusive)
  season: Season;
  applicable_tour_ids: string[];
}

export interface CommercialPricingParams {
  tourId: string; // Tour ID (ex: 'PLY-001') ou Rate ID direto ('PLY-R002')
  serviceDate?: string; // YYYY-MM-DD
  hotelZone?: CanonicalHotelZone | string | null;
  adultsCount?: number;
  childrenCount?: number;
  infantsCount?: number;
  unitsCount?: number; // Para barco, van, jet ski
  legsCount?: number; // Para transfer Miguel (1 = ida, 2 = ida e volta)
  manualCostOverride?: number | null; // Sobrecusto manual aprovado
  isManualOverride?: boolean;
  preferredRateId?: string; // Para seleção manual autorizada (ex: PLY-R003 Cozumel)
}

export interface CommercialPricingResult {
  tourId: string;
  rateId: string | null;
  displayName: string;
  supplierProductName: string;
  supplierRateName: string | null;
  provider: string;
  pricingBasis: PricingBasis | null;
  currency: SupplierCurrency;
  unitCostAdult: number | null;
  unitCostChild: number | null;
  unitCostFixed: number | null;
  adultsCount: number;
  childrenCount: number;
  infantsCount: number;
  unitsCount: number;
  legsCount: number;
  calculatedTotalCost: number | null; // NULL se custo desconhecido ou sob cotação!
  formulaApplied: string;
  isQuoteRequired: boolean;
  isUnknownCost: boolean;
  isManualOverride: boolean;
  rateStatus: RateStatus | null;
  warnings: string[];
  isValidForDate: boolean;
}

export interface ContractItemCommercialSnapshot {
  rate_id_snapshot: string | null;
  tour_id_code_snapshot: string | null;
  is_manual_quote: boolean;
  is_manual_override: boolean;
  manual_override_reason?: string | null;
  hotel_zone_snapshot?: string | null;
  native_currency: SupplierCurrency;
  native_cost_applied: number | null;
  native_calculated_total_cost: number | null;
  legs_count: number;
}

