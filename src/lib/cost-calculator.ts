// =============================================================================
// MOTOR DE CÁLCULO DE CUSTOS DE FORNECEDORES — TÍO NENÊ
// Implementação pura, reprodutível e testada das regras de cálculo de fornecedores
// Base de Referência: Prompt_Antigravity_Tio_Nene.md (Regras 1 a 14)
// =============================================================================

import {
  SupplierCostOption,
  PricingModel,
  SUPPLIER_COST_OPTIONS
} from "@/data/supplier-catalog";

export interface CostCalculationParams {
  adultsCount?: number;
  childrenCount?: number;
  unitsCount?: number; // Embarcações, jet skis ou veículos
  legsCount?: number; // Trechos de transfer (ex: 1 para ida, 2 para ida e volta)
  serviceDate?: string; // YYYY-MM-DD para validação de dia da semana (ex: Coco Bongo)
  manualCostOverride?: number; // Custo manual confirmado para itens sob cotação (ex: TN-042)
}

export interface CostCalculationResult {
  optionCode: string;
  supplierName: string;
  serviceName: string;
  variant?: string;
  pricingModel: PricingModel;
  currency: "USD" | "MXN" | "BRL";
  unitCostAdult: number;
  unitCostChild: number;
  unitCostFixed: number;
  adultsCount: number;
  childrenCount: number;
  unitsCount: number;
  legsCount: number;
  calculatedTotalCost: number;
  formulaApplied: string;
  externalFeesNote?: string;
  isQuoteRequired: boolean;
  warnings: string[];
  isValidForDate: boolean;
}

export interface CostSnapshot {
  tariff_code: string;
  supplier_name: string;
  service_name: string;
  variant?: string;
  pricing_model: PricingModel;
  currency: "USD" | "MXN" | "BRL";
  cost_adult: number;
  cost_child: number;
  cost_fixed: number;
  adults_count: number;
  children_count: number;
  units_count: number;
  legs_count: number;
  calculated_total_cost: number;
  formula: string;
  external_fees?: string;
  snapshot_date: string;
}

/**
 * Mapeia dia da semana da data (0 = Domingo, 1 = Segunda, ..., 6 = Sábado)
 */
function getDayOfWeek(dateStr?: string): number | null {
  if (!dateStr) return null;
  const parts = dateStr.split("-");
  if (parts.length !== 3) return null;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0);
  return d.getDay();
}

/**
 * Valida se uma data é compatível com os dias de operação da opção Coco Bongo
 */
export function validateCocoBongoDay(optionCode: string, dateStr?: string): { valid: boolean; reason?: string } {
  if (!dateStr) return { valid: true };
  const day = getDayOfWeek(dateStr);
  if (day === null) return { valid: true };

  // 0: Dom, 1: Seg, 2: Ter, 3: Qua, 4: Qui, 5: Sex, 6: Sáb
  switch (optionCode) {
    case "TN-004": // Drink Pack (Dom—Qua)
    case "TN-007": // Premium (Dom—Qua)
    case "TN-009": // Royal Service (Dom—Qua)
    case "TN-010": // Gold Member (Dom—Qua)
    case "TN-012": // Front Row (Dom—Qua)
      if (day > 3) {
        return { valid: false, reason: "Opção válida apenas de Domingo a Quarta-feira." };
      }
      return { valid: true };

    case "TN-005": // Regular (Dom—Qui)
      if (day === 5 || day === 6) {
        return { valid: false, reason: "Opção válida apenas de Domingo a Quinta-feira." };
      }
      return { valid: true };

    case "TN-006": // Regular (Sexta-feira)
      if (day !== 5) {
        return { valid: false, reason: "Opção válida estritamente para Sexta-feira." };
      }
      return { valid: true };

    case "TN-008": // Premium (Qui—Sáb)
    case "TN-011": // Gold Member (Qui—Sáb)
    case "TN-013": // Front Row (Qui—Sáb)
      if (day < 4) {
        return { valid: false, reason: "Opção válida apenas de Quinta-feira a Sábado." };
      }
      return { valid: true };

    default:
      return { valid: true };
  }
}

/**
 * Calcula o custo devido ao fornecedor para qualquer opção TN-001 a TN-042
 */
export function calculateSupplierCost(
  optionOrCode: SupplierCostOption | string,
  params: CostCalculationParams
): CostCalculationResult {
  const option = typeof optionOrCode === "string" ? getCostOptionByCode(optionOrCode) : optionOrCode;
  if (!option) {
    throw new Error(`Opção de custo não encontrada: ${optionOrCode}`);
  }

  const adults = Math.max(0, Number(params.adultsCount || 0));
  const children = Math.max(0, Number(params.childrenCount || 0));
  const totalPax = adults + children;
  const legs = Math.max(1, Number(params.legsCount || 1));
  const warnings: string[] = [];

  let units = Math.max(1, Number(params.unitsCount || 1));
  let calculatedCost = 0;
  let formula = "";
  let isValidForDate = true;

  // Validação específica para Coco Bongo
  if (option.supplierName === "Coco Bongo" && params.serviceDate) {
    const dayCheck = validateCocoBongoDay(option.code, params.serviceDate);
    if (!dayCheck.valid) {
      isValidForDate = false;
      warnings.push(`Data incompatível com a tarifa: ${dayCheck.reason}`);
    }
  }

  // Validação para MUSA (checar domingos)
  if (option.code === "TN-028" && params.serviceDate) {
    const day = getDayOfWeek(params.serviceDate);
    if (day === 0) {
      warnings.push("Operação do MUSA aos domingos é pendente de confirmação com o operador.");
    }
  }

  switch (option.pricingModel) {
    case "per_person": {
      const adultRate = Number(option.costAdult || 0);
      const childRate = Number(option.costChild ?? option.costAdult ?? 0);

      // Regra 1: Puerto Maya Jungle Tour (transporte USD 8 já incluso)
      if (option.code === "TN-036") {
        // Adulto 33 (25 + 8) / Criança 23 (15 + 8)
        calculatedCost = adults * 33 + children * 23;
        formula = `${adults} ad × USD 33 + ${children} ch × USD 23 (transporte de USD 8 já incluso no total)`;
        warnings.push("Tarifa estimada: confirmar valor definitivo com o fornecedor.");
      } else {
        calculatedCost = adults * adultRate + children * childRate;
        formula = `${adults} ad × ${option.currency} ${adultRate} + ${children} ch × ${option.currency} ${childRate}`;
      }
      break;
    }

    case "fixed_vessel": {
      const fixedRate = Number(option.costFixed || 0);
      calculatedCost = fixedRate * units;
      formula = `${units} embarcação(ões) × ${option.currency} ${fixedRate} (preço fixo)`;

      if (option.maxCapacityPerUnit && totalPax > option.maxCapacityPerUnit * units) {
        warnings.push(
          `Capacidade sugerida (${option.maxCapacityPerUnit * units} pax) foi superada para ${totalPax} passageiros.`
        );
      }
      break;
    }

    case "fixed_jetski": {
      const fixedRate = Number(option.costFixed || 0);
      // Cada jet ski aceita até 2 pessoas
      const suggestedUnits = Math.max(1, Math.ceil(totalPax / 2));
      if (params.unitsCount === undefined || params.unitsCount === 0) {
        units = suggestedUnits;
      }
      calculatedCost = fixedRate * units;
      formula = `${units} jet ski(s) × ${option.currency} ${fixedRate} (capacidade máx. 2 pessoas por unidade)`;
      break;
    }

    case "per_vehicle_leg": {
      const legRate = Number(option.costFixed || 0);
      // Máximo 7 passageiros por veículo (Regra 2 - Miguel Shuttle)
      const suggestedVehicles = Math.max(1, Math.ceil(totalPax / 7));
      if (params.unitsCount === undefined || params.unitsCount === 0) {
        units = suggestedVehicles;
      }

      if (totalPax > 7 * units) {
        warnings.push(
          `Capacidade máxima de 7 passageiros por van superada (${totalPax} passageiros). Necessário ${suggestedVehicles} veículo(s).`
        );
      }

      calculatedCost = legRate * legs * units;
      formula = `${units} van(s) × ${legs} trecho(s) × ${option.currency} ${legRate} (capacidade máx. 7 pax/veículo)`;
      break;
    }

    case "quote_required": {
      if (params.manualCostOverride !== undefined && params.manualCostOverride > 0) {
        calculatedCost = Number(params.manualCostOverride);
        formula = `Cotação manual confirmada para ${units} veículo(s) e ${legs} trecho(s): ${option.currency} ${calculatedCost}`;
      } else {
        calculatedCost = 0;
        formula = "Sob cotação manual — valor pendente de confirmação com Miguel";
        warnings.push("Tarifa hotel ↔ hotel exige cotação individual caso a caso.");
      }
      break;
    }
  }

  return {
    optionCode: option.code,
    supplierName: option.supplierName,
    serviceName: option.serviceName,
    variant: option.variant,
    pricingModel: option.pricingModel,
    currency: option.currency,
    unitCostAdult: Number(option.costAdult || 0),
    unitCostChild: Number(option.costChild || 0),
    unitCostFixed: Number(option.costFixed || 0),
    adultsCount: adults,
    childrenCount: children,
    unitsCount: units,
    legsCount: legs,
    calculatedTotalCost: calculatedCost,
    formulaApplied: formula,
    externalFeesNote: option.externalFeesNote,
    isQuoteRequired: option.pricingModel === "quote_required",
    warnings,
    isValidForDate,
  };
}

/**
 * Encontra opção de custo pelo código canônico (ex: 'TN-001')
 */
export function getCostOptionByCode(code: string): SupplierCostOption | undefined {
  return SUPPLIER_COST_OPTIONS.find((opt) => opt.code === code);
}

/**
 * Cria snapshot imutável para ser gravado em contract_items
 */
export function createCostSnapshot(calc: CostCalculationResult): CostSnapshot {
  return {
    tariff_code: calc.optionCode,
    supplier_name: calc.supplierName,
    service_name: calc.serviceName,
    variant: calc.variant,
    pricing_model: calc.pricingModel,
    currency: calc.currency,
    cost_adult: calc.unitCostAdult,
    cost_child: calc.unitCostChild,
    cost_fixed: calc.unitCostFixed,
    adults_count: calc.adultsCount,
    children_count: calc.childrenCount,
    units_count: calc.unitsCount,
    legs_count: calc.legsCount,
    calculated_total_cost: calc.calculatedTotalCost,
    formula: calc.formulaApplied,
    external_fees: calc.externalFeesNote,
    snapshot_date: new Date().toISOString(),
  };
}

/**
 * Mapeia inteligentemente um passeio ou serviço para a opção de custo canônica padrão
 */
export function findDefaultCostOptionForTour(tourSlugOrName: string): SupplierCostOption | undefined {
  if (!tourSlugOrName) return undefined;
  const s = tourSlugOrName.toLowerCase();

  if (s.includes("chichen") || s.includes("chichén")) return getCostOptionByCode("TN-001");
  if (s.includes("tulum") && (s.includes("coba") || s.includes("cobá"))) return getCostOptionByCode("TN-003");
  if (s.includes("tulum")) return getCostOptionByCode("TN-002");
  if (s.includes("coco bongo")) return getCostOptionByCode("TN-005");
  if (s.includes("catamarã") || s.includes("catamara") || (s.includes("isla") && s.includes("mujeres"))) return getCostOptionByCode("TN-018");
  if (s.includes("barco pirata") || s.includes("capitán") || s.includes("capitan")) return getCostOptionByCode("TN-014");
  if (s.includes("musa") || s.includes("escultura") || s.includes("subaquat")) return getCostOptionByCode("TN-024");
  if (s.includes("parasail")) return getCostOptionByCode("TN-029");
  if (s.includes("playa mia") || s.includes("cozumel")) return getCostOptionByCode("TN-030");
  if (s.includes("puerto maya") || s.includes("speed boat") || s.includes("lancha")) return getCostOptionByCode("TN-032");
  if (s.includes("coloradas") || s.includes("lagartos")) return getCostOptionByCode("TN-021");
  if (s.includes("transfer") || s.includes("aeroporto") || s.includes("shuttle")) return getCostOptionByCode("TN-037");

  return undefined;
}
