// =============================================================================
// MOTOR DE PRECIFICAÇÃO COMERCIAL E CUSTOS DE FORNECEDORES — TÍO NENÊ v0.1.43
// Regras Oficiais: Tio_Nene_Phase_1_v0.1.43 (10 Fornecedores, 52 Produtos, 80 Tarifas)
// =============================================================================

import {
  OfficialSupplier,
  CommercialProduct,
  SupplierRate,
  HotelZoneMapping,
  XcaretSeasonWindow,
  CanonicalHotelZone,
  CommercialPricingParams,
  CommercialPricingResult,
  Season,
  PricingBasis
} from "@/types/supplier-commercial";

import {
  OFFICIAL_SUPPLIERS,
  OFFICIAL_COMMERCIAL_PRODUCTS,
  OFFICIAL_SUPPLIER_RATES,
  OFFICIAL_HOTEL_ZONE_MAPPINGS,
  OFFICIAL_XCARET_SEASONS_2026
} from "@/data/official-supplier-catalog";

/**
 * Busca produto comercial pelo Tour ID estável (ex: 'BAK-001', 'PLY-001', 'MIG-001')
 */
export function getCommercialProductByTourId(tourId: string): CommercialProduct | undefined {
  return OFFICIAL_COMMERCIAL_PRODUCTS.find((p) => p.tour_id === tourId);
}

/**
 * Busca tarifa de fornecedor pelo Rate ID estável (ex: 'BAK-R001', 'PLY-R002', 'MIG-R001')
 */
export function getSupplierRateById(rateId: string): SupplierRate | undefined {
  return OFFICIAL_SUPPLIER_RATES.find((r) => r.rate_id === rateId);
}

/**
 * Lista todas as tarifas de fornecedor vinculadas a um Tour ID comercial
 */
export function getSupplierRatesForTour(tourId: string): SupplierRate[] {
  return OFFICIAL_SUPPLIER_RATES.filter((r) => r.tour_id === tourId);
}

/**
 * Mapeamento da zona canônica do hotel (1 de 8 zonas)
 */
export function resolveHotelZoneMapping(zone?: string | null): HotelZoneMapping | undefined {
  if (!zone) return undefined;
  return OFFICIAL_HOTEL_ZONE_MAPPINGS.find(
    (m) => m.hotel_zone.toLowerCase().trim() === zone.toLowerCase().trim()
  );
}

/**
 * Extrai dia da semana de uma data YYYY-MM-DD (0 = Domingo, 1 = Segunda, ..., 6 = Sábado)
 */
function getDayOfWeek(dateStr?: string): number | null {
  if (!dateStr) return null;
  const parts = dateStr.split("-");
  if (parts.length !== 3) return null;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0);
  return d.getDay();
}

const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const DAY_ABBR = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

/**
 * Resolve a temporada Xcaret para o ano de 2026
 */
export function resolveXcaretSeason(dateStr?: string, tourId?: string): Season | null {
  if (!dateStr) return "Regular"; // Default operacional
  const year = dateStr.substring(0, 4);

  // Regra v0.1.43 / REF-015: Para 2027+, datas são selecionáveis com taxa provisional Regular
  if (year !== "2026") {
    return "Regular";
  }

  const window = OFFICIAL_XCARET_SEASONS_2026.find((w) => {
    if (tourId && !w.applicable_tour_ids.includes(tourId)) {
      return false;
    }
    return dateStr >= w.from_date && dateStr <= w.to_date;
  });

  return window ? window.season : "Regular";
}

/**
 * Validação de elegibilidade de dia da semana para tarifas com restrição
 */
function isDayAllowed(allowedDaysStr: string | null | undefined, dateStr?: string): { allowed: boolean; reason?: string } {
  if (!allowedDaysStr || !dateStr) return { allowed: true };
  const dayIdx = getDayOfWeek(dateStr);
  if (dayIdx === null) return { allowed: true };

  const fullName = DAY_NAMES[dayIdx];
  const abbr = DAY_ABBR[dayIdx];
  const allowedList = allowedDaysStr.split(";").map((d) => d.trim().toLowerCase());

  const matches = allowedList.some((allowed) =>
    allowed === fullName || allowed === abbr || allowed.startsWith(abbr) || fullName.startsWith(allowed)
  );

  if (!matches) {
    return {
      allowed: false,
      reason: `Data (${dateStr}, ${fullName}) não permitida para esta tarifa. Dias válidos: ${allowedDaysStr}`
    };
  }

  return { allowed: true };
}

/**
 * Motor central de cálculo de custos comerciais e seleção de tarifas v0.1.43
 */
export function calculateCommercialPricing(params: CommercialPricingParams): CommercialPricingResult {
  const {
    tourId,
    serviceDate,
    hotelZone,
    adultsCount = 1,
    childrenCount = 0,
    infantsCount = 0,
    legsCount = 1,
    manualCostOverride,
    isManualOverride = false,
    preferredRateId
  } = params;

  const adults = Math.max(0, Number(adultsCount || 0));
  const children = Math.max(0, Number(childrenCount || 0));
  const infants = Math.max(0, Number(infantsCount || 0));
  const totalPax = adults + children; // Base para passageiros pagantes normais
  const legs = Math.max(1, Number(legsCount || 1));
  const warnings: string[] = [];
  let isValidForDate = true;

  // 1. Identificar se tourId é diretamente um Rate ID ou Tour ID
  let rate: SupplierRate | undefined = undefined;
  let product: CommercialProduct | undefined = undefined;

  if (tourId.includes("-R")) {
    // Passou diretamente um Rate ID (ex: 'BAK-R001', 'PLY-R002')
    rate = getSupplierRateById(tourId);
    if (rate) {
      product = getCommercialProductByTourId(rate.tour_id);
    }
  } else {
    // Passou Tour ID (ex: 'PLY-001', 'MIG-001', 'XCA-001')
    product = getCommercialProductByTourId(tourId);
  }

  if (!product && !rate) {
    // Produto não encontrado no catálogo canônico
    return {
      tourId,
      rateId: null,
      displayName: tourId,
      supplierProductName: tourId,
      supplierRateName: null,
      provider: "Desconhecido",
      pricingBasis: null,
      currency: "USD",
      unitCostAdult: null,
      unitCostChild: null,
      unitCostFixed: null,
      adultsCount: adults,
      childrenCount: children,
      infantsCount: infants,
      unitsCount: params.unitsCount ?? 1,
      legsCount: legs,
      calculatedTotalCost: manualCostOverride !== undefined ? manualCostOverride : null,
      formulaApplied: "Item sob cotação ou não cadastrado no catálogo oficial",
      isQuoteRequired: true,
      isUnknownCost: manualCostOverride === undefined || manualCostOverride === null,
      isManualOverride: Boolean(isManualOverride),
      rateStatus: null,
      warnings: ["Produto não localizado no catálogo oficial. Cotação manual requerida."],
      isValidForDate: true
    };
  }

  const effectiveTourId = product ? product.tour_id : rate!.tour_id;
  const displayName = product ? product.display_name : (rate ? rate.supplier_rate_name : effectiveTourId);
  const supplierProductName = product ? product.supplier_product_name : displayName;
  const provider = product ? product.provider : (rate ? rate.tour_id.split("-")[0] : "Operador");

  // 2. Se a tarifa ainda não foi fixada, aplicar as regras oficiais de seleção por fornecedor
  const zoneMapping = resolveHotelZoneMapping(hotelZone);

  if (!rate) {
    const candidateRates = getSupplierRatesForTour(effectiveTourId);

    // Regra Miguel Shuttle (MIG-001)
    if (effectiveTourId === "MIG-001") {
      if (zoneMapping && zoneMapping.miguel_rate_id) {
        rate = candidateRates.find((r) => r.rate_id === zoneMapping.miguel_rate_id);
      }
      if (!rate) {
        // Fallback para MIG-R001 se zona não informada ou padrão
        rate = candidateRates.find((r) => r.rate_id === "MIG-R001");
        if (!hotelZone) {
          warnings.push("Zona hoteleira não informada. Utilizada tarifa padrão MIG-R001 (Cancún).");
        }
      }
    }
    // Regra Playa Mía (PLY-001 - Cozumel el Cielo)
    else if (effectiveTourId === "PLY-001") {
      if (preferredRateId === "PLY-R003") {
        // Seleção manual autorizada de saída Cozumel
        rate = candidateRates.find((r) => r.rate_id === "PLY-R003");
      } else {
        // Regra §H2: Auto-mapeamento pelas 8 zonas canônicas
        if (zoneMapping && zoneMapping.playa_mia_rate_id) {
          rate = candidateRates.find((r) => r.rate_id === zoneMapping.playa_mia_rate_id);
        }
        if (!rate) {
          rate = candidateRates.find((r) => r.rate_id === "PLY-R001"); // Fallback Playa del Carmen
          if (!hotelZone) {
            warnings.push("Zona hoteleira não informada. Utilizada tarifa PLY-R001 (Playa del Carmen).");
          }
        }
      }
    }
    // Regra Xcaret (XCA-001 a XCA-010)
    else if (effectiveTourId.startsWith("XCA-")) {
      const season = resolveXcaretSeason(serviceDate, effectiveTourId);

      // Determinar região alvo
      let targetRegion = "CUN/RM";
      if (effectiveTourId === "XCA-003") {
        targetRegion = zoneMapping ? zoneMapping.xcaret_de_noche_region : "RM";
      } else if (effectiveTourId === "XCA-009") {
        targetRegion = zoneMapping ? zoneMapping.xoximilco_region : "CUN/Playa Mujeres";
      } else if (zoneMapping) {
        targetRegion = zoneMapping.xcaret_core_region;
      }

      // Procurar tarifa com correspondência de Tour + Região + Temporada
      rate = candidateRates.find((r) => {
        const matchRegion = !r.tariff_region || r.tariff_region.trim() === targetRegion.trim();
        const matchSeason = !r.season || r.season === season;
        return matchRegion && matchSeason;
      });

      // Se não encontrou exato por região, tenta só por temporada
      if (!rate) {
        rate = candidateRates.find((r) => !r.season || r.season === season);
      }
      if (!rate && candidateRates.length > 0) {
        rate = candidateRates[0];
      }
    }
    // Regra Coco Bongo (COC-001 a COC-006)
    else if (effectiveTourId.startsWith("COC-")) {
      // Filtrar pelo dia da semana se fornecido
      if (serviceDate) {
        rate = candidateRates.find((r) => {
          const check = isDayAllowed(r.days_of_week, serviceDate);
          return check.allowed;
        });
      }
      if (!rate && candidateRates.length > 0) {
        rate = candidateRates[0];
      }
    }
    // Outros fornecedores (Baktun, MTZ, MUSA, Envatours, Parasailing)
    else {
      rate = candidateRates[0];
    }
  }

  // 3. Se ainda não há tarifa aplicável
  if (!rate) {
    return {
      tourId: effectiveTourId,
      rateId: null,
      displayName,
      supplierProductName,
      supplierRateName: null,
      provider,
      pricingBasis: null,
      currency: "USD",
      unitCostAdult: null,
      unitCostChild: null,
      unitCostFixed: null,
      adultsCount: adults,
      childrenCount: children,
      infantsCount: infants,
      unitsCount: params.unitsCount ?? 1,
      legsCount: legs,
      calculatedTotalCost: manualCostOverride !== undefined ? manualCostOverride : null,
      formulaApplied: "Tarifa não encontrada no catálogo oficial",
      isQuoteRequired: true,
      isUnknownCost: manualCostOverride === undefined || manualCostOverride === null,
      isManualOverride: Boolean(isManualOverride),
      rateStatus: null,
      warnings: ["Tarifa de fornecedor não disponível para os parâmetros informados."],
      isValidForDate: false
    };
  }

  // 4. Validar dia de operação se restrito
  if (rate.days_of_week && serviceDate) {
    const dayCheck = isDayAllowed(rate.days_of_week, serviceDate);
    if (!dayCheck.allowed) {
      isValidForDate = false;
      warnings.push(`Restrição de calendário: ${dayCheck.reason}`);
    }
  }

  // 5. Validação especial de Coco Bongo (Adultos apenas)
  if (effectiveTourId.startsWith("COC-")) {
    if (children > 0 || infants > 0) {
      warnings.push("Coco Bongo é um evento estritamente adulto (18+). Crianças e bebês não são permitidos.");
    }
  }

  // 6. Cálculo conforme Pricing Basis oficial
  let calculatedCost: number | null = null;
  let formula = "";
  let units = params.unitsCount !== undefined && params.unitsCount > 0 ? params.unitsCount : 1;

  // Prioridade para sobrecusto manual aprovado (Sticky override)
  if (isManualOverride && manualCostOverride !== undefined && manualCostOverride !== null) {
    calculatedCost = Number(manualCostOverride);
    formula = `Ajuste manual administrativo aprovado: ${rate.currency} ${calculatedCost}`;
  } else {
    switch (rate.pricing_basis) {
      case "Person": {
        const adultCost = rate.adult_cost;
        const childCost = rate.child_cost;

        if (adultCost === null) {
          calculatedCost = null;
          formula = "Custo de adulto não informado pelo fornecedor (pendente de cotação)";
          warnings.push("Tarifa oficial sem valor unitário de adulto cadastrado.");
        } else {
          // Se não houver custo de criança explícito, verifica se crianças são permitidas ou herdam adulto
          const effectiveChildCost = childCost !== null ? childCost : adultCost;
          calculatedCost = adults * adultCost + children * effectiveChildCost;
          formula = `${adults} ad × ${rate.currency} ${adultCost} + ${children} ch × ${rate.currency} ${effectiveChildCost}`;
        }
        break;
      }

      case "Package": {
        // Ex: Xcaret packages (transporte incluso)
        const adultCost = rate.adult_cost;
        const childCost = rate.child_cost !== null ? rate.child_cost : adultCost;

        if (adultCost === null) {
          calculatedCost = null;
          formula = "Pacote Xcaret sem custo tabelado (cotação necessária)";
        } else {
          calculatedCost = adults * adultCost + children * (childCost || 0);
          formula = `${adults} ad × ${rate.currency} ${adultCost} + ${children} ch × ${rate.currency} ${childCost} (pacote com transporte incluso)`;
        }
        break;
      }

      case "Boat": {
        // Ex: Envatours private boats (ENV-R002, ENV-R004, ENV-R006)
        const fixedCost = rate.fixed_cost;
        units = params.unitsCount !== undefined && params.unitsCount > 0 ? params.unitsCount : 1;

        if (rate.max_passengers && totalPax > rate.max_passengers * units) {
          warnings.push(
            `Capacidade sugerida (${rate.max_passengers * units} pax) superada para ${totalPax} passageiros. Necessário cotar embarcação adicional.`
          );
        }

        if (fixedCost === null) {
          calculatedCost = null;
          formula = "Embarcação privativa sob cotação manual obrigatória";
        } else {
          calculatedCost = fixedCost * units;
          formula = `${units} embarcação(ões) × ${rate.currency} ${fixedCost} (fixo por barco até ${rate.max_passengers || 10} pax)`;
        }
        break;
      }

      case "Equipment": {
        // Ex: Jet Ski (PJS-R002: 30min $90, PJS-R003: 60min $120) - máx 2 pax por equipamento
        const fixedCost = rate.fixed_cost;
        const maxPaxPerUnit = rate.max_passengers || 2;
        const suggestedSkis = Math.max(1, Math.ceil(totalPax / maxPaxPerUnit));

        if (params.unitsCount === undefined || params.unitsCount === 0) {
          units = suggestedSkis;
        } else {
          units = params.unitsCount;
        }

        if (totalPax > units * maxPaxPerUnit) {
          warnings.push(
            `Capacidade de ${units * maxPaxPerUnit} passageiros superada para ${totalPax} passageiros. Sugerido ${suggestedSkis} jet ski(s).`
          );
        }

        if (fixedCost === null) {
          calculatedCost = null;
          formula = "Equipamento sob cotação manual";
        } else {
          calculatedCost = fixedCost * units;
          formula = `${units} equipamento(s) × ${rate.currency} ${fixedCost} (capacidade máx. ${maxPaxPerUnit} pax/unidade)`;
        }
        break;
      }

      case "Vehicle": {
        // Ex: Miguel Shuttle (MIG-001) - máx 7 pax por van, por trecho
        const fixedCost = rate.fixed_cost;
        const maxPaxPerVan = rate.max_passengers || 7;
        const suggestedVans = Math.max(1, Math.ceil(totalPax / maxPaxPerVan));

        if (params.unitsCount === undefined || params.unitsCount === 0) {
          units = suggestedVans;
        } else {
          units = params.unitsCount;
        }

        if (totalPax > units * maxPaxPerVan) {
          warnings.push(
            `Capacidade de ${units * maxPaxPerVan} pax por van superada (${totalPax} passageiros). Alocação de ${suggestedVans} veículo(s) necessária.`
          );
        }

        if (fixedCost === null) {
          calculatedCost = null;
          formula = "Transfer privativo sob cotação manual (rota especial hotel-hotel)";
        } else {
          calculatedCost = fixedCost * legs * units;
          formula = `${units} van(s) × ${legs} trecho(s) × ${rate.currency} ${fixedCost} (tarifa por veículo até ${maxPaxPerVan} pax)`;
        }
        break;
      }
    }
  }

  const isUnknown = calculatedCost === null;

  return {
    tourId: effectiveTourId,
    rateId: rate.rate_id,
    displayName,
    supplierProductName,
    supplierRateName: rate.supplier_rate_name,
    provider,
    pricingBasis: rate.pricing_basis,
    currency: rate.currency,
    unitCostAdult: rate.adult_cost,
    unitCostChild: rate.child_cost,
    unitCostFixed: rate.fixed_cost,
    adultsCount: adults,
    childrenCount: children,
    infantsCount: infants,
    unitsCount: units,
    legsCount: legs,
    calculatedTotalCost: calculatedCost,
    formulaApplied: formula,
    isQuoteRequired: rate.rate_status === "Manual Only" || isUnknown,
    isUnknownCost: isUnknown,
    isManualOverride: Boolean(isManualOverride),
    rateStatus: rate.rate_status,
    warnings,
    isValidForDate
  };
}
