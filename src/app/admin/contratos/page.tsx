"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { TOURS as DEFAULT_TOURS } from "@/data/tours";
import {
  SUPPLIER_COST_OPTIONS,
  SupplierCostOption
} from "@/data/supplier-catalog";
import {
  calculateSupplierCost,
  getCostOptionByCode,
  findDefaultCostOptionForTour,
  validateCocoBongoDay,
} from "@/lib/cost-calculator";
import {
  FileText,
  Plus,
  Search,
  Printer,
  Edit2,
  Trash2,
  Calendar,
  Users,
  Plane,
  Building,
  CheckCircle2,
  Clock,
  DollarSign,
  AlertCircle,
  Eye,
  X,
  PlusCircle,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Layers,
  Info,
  Calculator,
  Sparkles,
  RotateCcw,
  Lock,
  Ticket,
  Wallet,
  ShieldAlert,
  CheckSquare,
} from "lucide-react";

import { HotelScheduleSection, HotelSchedule, CANONICAL_ZONES } from "@/components/admin/HotelScheduleSection";
import { useAuthProfile } from "@/lib/auth/AuthContext";
import {
  calculateCommercialPricing,
  getCommercialProductByTourId,
  getSupplierRateById
} from "@/lib/commercial-pricing-engine";
import { CommercialProduct, CanonicalHotelZone } from "@/types/supplier-commercial";
import { OFFICIAL_COMMERCIAL_PRODUCTS } from "@/data/official-supplier-catalog";
import { CommercialProductSelectorModal } from "@/components/admin/CommercialProductSelectorModal";
import {
  reconcileContractItemsDifferential,
  buildContractItemDbPayload,
  validateContractItems,
  saveContractWithItemsAtomic,
} from "@/lib/contracts/reconcileItems";
import { finalizeContractSale } from "@/lib/contracts/finalizeSale";

interface ContractItem {
  id?: string;
  tour_id?: string;
  tour_name: string;
  tour_date: string;
  adults_count: number;
  children_count: number;
  sale_price: number;
  cost_applied: number;
  cost_currency?: string;
  calculated_total_cost: number;
  supplier_id?: string;
  supplier_name?: string;
  voucher_ref?: string;
  included?: string;
  not_included?: string;
  tariff_code?: string;
  pricing_model?: string;
  units_count?: number;
  legs_count?: number;
  calculation_formula?: string;
  external_fees?: string;

  // Evolução v0.1.43 — Snapshots de Tarifas Oficiais e Overrides Manuais
  rate_id_snapshot?: string;
  tour_id_code_snapshot?: string;
  is_manual_quote?: boolean;
  is_manual_override?: boolean;
  manual_override_reason?: string;
  hotel_zone_snapshot?: string;
  native_currency?: string;
  native_cost_applied?: number;
  native_calculated_total_cost?: number;
}

interface Contract {
  id: string;
  contract_number: string;
  client_id?: string;
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
  deposit_observation: string;
  balance_amount: number;
  balance_observation: string;
  total_amount: number;
  currency: string;
  status: "rascunho" | "emitido" | "assinado" | "cancelado" | "finalizado";
  finalized_at?: string;
  terms_clauses?: string;
  internal_notes?: string;
  created_at: string;
  items?: ContractItem[];
}

const DEFAULT_TERMS = `TERMOS DE CONTRATO

As partes acima identificadas têm, entre si, justo e acertado o presente Contrato de Prestação de Serviços, que se regerá pelas cláusulas seguintes e pelas condições de preço, forma e termo de pagamento descritas no presente:

Cláusula 1ª. É objeto do presente contrato a prestação do serviço de assessoria aos passeios descritos acima, nas datas e condições pré-estabelecidas e, fornecimento de suporte e esclarecimentos durante a estadia do contratante no período e locais descritos acima.

Cláusula 2ª. O CONTRATANTE é responsável pelo fornecimento dos dados pessoais, dados do voo e dados de estadia, como local e data durante o período da contratação dos serviços, ficando a critério do CONTRATANTE a conferência e confirmação das informações e serviços acima descritos.

Cláusula 3ª. O CONTRATANTE deverá efetuar o pagamento na forma e condições estabelecidas acima, neste presente contrato.

Cláusula 4ª. O CONTRATANTE é responsável por estar no local e horário agendado pela equipe de assessoramento presencial, conforme fornecidos antes da realização dos serviços e informados ao CONTRATANTE durante atendimento e comprovados com documento físico ou virtual (vouchers de acesso), a fim de garantir a realização de cada serviço descrito acima. Em caso de não comparecimento do CONTRATANTE, o serviço poderá ser somente reagendado, sendo vetado o reembolso integral ou parcial do serviço.

Cláusula 5ª. O CONTRATADO oferece ao contratante a cópia do presente instrumento, contendo todo o detalhamento dos serviços solicitados durante o período acima descrito.

Cláusula 6ª. O CONTRATADO fornecerá todos os documentos físicos (vouchers de acesso) e informações necessárias para a realização dos serviços contratados acima garantindo a execução dos mesmos, sendo responsável pelo repasse de informações sobre horários e locais de realização de cada serviço, após efetuação do pagamento conforme acordado neste contrato.

Cláusula 7ª. O CONTRATADO é isento de qualquer ação, pensamento ou conduta de funcionários de operadores terceirizados que não estejam sobre sua responsabilidade trabalhista.

Cláusula 8ª. O CONTRATADO tem, devido a fatores externos (tráfego, acidentes, etc), o risco de superar o horário previamente agendado para realização do serviço e, terá nessa situação a responsabilidade de alertar ao CONTRATANTE sobre tal situação, a fim de garantir a realização do serviço prestado.

Cláusula 9ª. Poderá ser rescindido pelo CONTRATANTE os serviços contratados, até 24 horas antes do início dos serviços, mediante a apresentação de atestado médico certificado que impossibilite a realização deles, sem que haja qualquer tipo de multa ou cobranças administrativas.

Cláusula 10ª. Caso o CONTRATANTE já tenha realizado o pagamento pelo serviço, parcial ou total, e mesmo assim, requisite a rescisão imotivada do presente contrato, não haverá por parte do CONTRATADO reembolso de nenhum valor.

Cláusula 11ª. Caso o CONTRATANTE já tenha realizado o pagamento pelo serviço, parcial ou total, e mesmo assim, requisite a rescisão imotivada do presente contrato faltando menos de 30 dias para a data da viagem, será cobrada uma multa no valor de 30% do valor do contrato, que deverá ser paga via transferência bancária ou PIX fornecido pelo CONTRATADO. Caso seja antes do prazo de 30 dias, o valor pago como entrada será perdido.

Cláusula 12ª. Caso a rescisão de algum serviço aqui descrito seja realizada devido a fatores externos (tempestades tropicais e condições climatológicas) que apresentem risco de segurança ao CONTRATANTE, comprovado e informados pelas autoridades locais, o CONTRATADO poderá reagendar o serviço para a próxima data disponível do CONTRATANTE. Caso não haja disponibilidade para reagendamento, o CONTRATADO é responsável pelo reembolso integral deste serviço exclusivo.

Cláusula 13ª. O CONTRATADO é isento de reembolso, parcial ou integral, de serviços relacionados aos parques e/ou interligados a denominada REDE EXPERIENCIA XCARET, independentemente da situação.

Cláusula 14ª. O CONTRATADO terá a condição de realizar alteração de valores previamente acordados caso haja alteração no cronograma, inclusão ou exclusão de qualquer serviço aqui descrito solicitado pelo CONTRATANTE.

Cláusula 15ª. O CONTRATADO se estiver hospedado em hotéis no centro de Cancun ou em Playa Del Carmen, o transfer oferecido pelo CONTRATANTE dos passeios será realizado através de pontos de encontro e não no próprio hotel do CONTRATADO.

Cláusula 16ª. O CONTRATADO tem um prazo para usufruir dos serviços contratados de 12 meses. Caso a viagem seja remarcada, adiada, cancelada o valor já pago será perdido ou utilizado como forma de crédito (por um período não maior que 12 - doze - meses). Caso o valor seja utilizado como crédito, os preços podem sofrer alterações com a mudança da data da viagem.

Cláusula 17ª. O contrato tem 1 ano de validade após o fechamento da emissão.

Cláusula 18ª. Os valores de cada passeio podem sofrer alteração de última hora por alta ou baixa temporada sem aviso prévio. Caso isso ocorra, comunicaremos ao CONTRATANTE e daremos a opção de substituição por outro passeio.`;

function parseLeadNotes(notesText?: string | null) {
  if (!notesText) return {};
  const result: {
    arrival_date?: string;
    departure_date?: string;
    adults_count?: number;
    children_count?: number;
    infants_count?: number;
    flight_number?: string;
    flight_time?: string;
    hotel?: string;
  } = {};

  const dateMatch = notesText.match(/chegada:?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4}|\d{4}[\/\-]\d{2}[\/\-]\d{2})/i);
  if (dateMatch) {
    const raw = dateMatch[1];
    if (raw.includes("/")) {
      const [d, m, y] = raw.split("/");
      result.arrival_date = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    } else {
      result.arrival_date = raw;
    }
  }

  const adultsMatch = notesText.match(/adultos?:?\s*(\d+)/i);
  if (adultsMatch) result.adults_count = Number(adultsMatch[1]);

  const childMatch = notesText.match(/crian[çc]as?(?:\s*\([^)]*\))?:?\s*(\d+)/i);
  if (childMatch) result.children_count = Number(childMatch[1]);

  const infantMatch = notesText.match(/infantes?(?:\s*\([^)]*\))?:?\s*(\d+)/i);
  if (infantMatch) result.infants_count = Number(infantMatch[1]);

  const flightMatch = notesText.match(/voo:?\s*([A-Z0-9\s]+?)(?:\||\n|$)/i);
  if (flightMatch) result.flight_number = flightMatch[1].trim();

  const flightTimeMatch = notesText.match(/hor[áa]rio(?:\s*voo)?:?\s*(\d{2}:\d{2})/i);
  if (flightTimeMatch) result.flight_time = flightTimeMatch[1].trim();

  const hotelMatch = notesText.match(/hotel:?\s*([^|\n]+)/i);
  if (hotelMatch) result.hotel = hotelMatch[1].trim();

  return result;
}

function formatDbContractItem(i: any): ContractItem {
  const bd = i.calculation_breakdown || {};
  const rateIdSnapshot = i.rate_id_snapshot || bd.rate_id_snapshot || undefined;
  const tourIdCodeSnapshot = i.tour_id_code_snapshot || bd.tour_id_code_snapshot || undefined;
  const codeMatch = rateIdSnapshot || i.tariff_code_snapshot || i.notes?.match(/^\[(TN-\d{3}|[A-Z]{3}-R\d{3})\]/)?.[1];

  return {
    id: i.id,
    tour_id: i.tour_id,
    tour_name: i.tour_name_snapshot,
    tour_date: i.tour_date,
    adults_count: i.adults_count || 1,
    children_count: i.children_count || 0,
    units_count: i.units_count || 1,
    legs_count: i.legs_count || bd.legs_count || 1,
    sale_price: Number(i.sale_price || 0),
    cost_applied: Number(i.cost_applied || 0),
    cost_currency: i.cost_currency || bd.native_currency || "USD",
    calculated_total_cost: Number(i.calculated_total_cost || i.cost_applied || 0),
    supplier_id: i.supplier_id,
    supplier_name: i.supplier_name_snapshot,
    voucher_ref: i.voucher_ref,
    included: i.tour_included_snapshot,
    not_included: i.tour_not_included_snapshot,
    tariff_code: codeMatch || undefined,
    pricing_model: i.pricing_model_snapshot || i.cost_type,
    calculation_formula: bd.formula || i.notes || undefined,
    external_fees: i.external_fees_snapshot || undefined,
    rate_id_snapshot: rateIdSnapshot,
    tour_id_code_snapshot: tourIdCodeSnapshot,
    is_manual_quote: Boolean(i.is_manual_quote ?? bd.is_manual_quote),
    is_manual_override: Boolean(i.is_manual_override ?? bd.is_manual_override),
    manual_override_reason: i.manual_override_reason || bd.manual_override_reason || undefined,
    hotel_zone_snapshot: i.hotel_zone_snapshot || bd.hotel_zone_snapshot || undefined,
    native_currency: i.native_currency || bd.native_currency || i.cost_currency || "USD",
    native_cost_applied: i.native_cost_applied !== null && i.native_cost_applied !== undefined
      ? Number(i.native_cost_applied)
      : (bd.native_cost_applied !== undefined && bd.native_cost_applied !== null ? Number(bd.native_cost_applied) : undefined),
    native_calculated_total_cost: i.native_calculated_total_cost !== null && i.native_calculated_total_cost !== undefined
      ? Number(i.native_calculated_total_cost)
      : (bd.native_calculated_total_cost !== undefined && bd.native_calculated_total_cost !== null ? Number(bd.native_calculated_total_cost) : undefined),
  };
}

function ContractsContent() {
  const { role, hasPermission } = useAuthProfile();
  const canViewCosts = role === "admin" || hasPermission("supplier_costs:view") || hasPermission("suppliers:manage");
  const searchParams = useSearchParams();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Suppliers, Tours, Catálogo Oficial & Clientes para seleção
  const [availableSuppliers, setAvailableSuppliers] = useState<any[]>([]);
  const [availableTours, setAvailableTours] = useState<any[]>([]);
  const [availableClients, setAvailableClients] = useState<any[]>([]);
  const [commercialProducts, setCommercialProducts] = useState<CommercialProduct[]>(OFFICIAL_COMMERCIAL_PRODUCTS);

  // Modais
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [catalogModalOpen, setCatalogModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<Contract>>({
    contract_number: "",
    client_name: "",
    client_cpf: "",
    client_phone: "",
    client_email: "",
    arrival_date: "",
    departure_date: "",
    arrival_flight_number: "",
    arrival_flight_time: "",
    depart_flight_number: "",
    depart_flight_time: "",
    adults_count: 2,
    children_count: 0,
    infants_count: 0,
    hotels_schedule: [{ hotel_name: "", checkin: "", checkout: "" }],
    deposit_amount: 0,
    deposit_observation: "Depósito via PIX",
    balance_amount: 0,
    balance_observation: "Saldo a acertar no check-in em Cancún",
    total_amount: 0,
    currency: "BRL",
    status: "emitido",
    terms_clauses: DEFAULT_TERMS,
    internal_notes: "",
  });

  const [formItems, setFormItems] = useState<ContractItem[]>([]);

  // Diálogo para quando o cliente já possui contratos existentes
  const [clientExistingModal, setClientExistingModal] = useState<{
    open: boolean;
    clientName: string;
    clientId: string;
    existingContracts: any[];
  }>({
    open: false,
    clientName: "",
    clientId: "",
    existingContracts: [],
  });

  // Modal de Confirmação de Finalização de Venda
  const [finalizeModal, setFinalizeModal] = useState<{
    open: boolean;
    contract: Contract | null;
    processing: boolean;
  }>({
    open: false,
    contract: null,
    processing: false,
  });

  const handleOpenFinalize = (contract: Contract) => {
    if (contract.status === "rascunho") {
      alert("Contratos em rascunho não podem gerar reservas operacionais. Abra o contrato e emita o documento oficial primeiro.");
      return;
    }
    setFinalizeModal({ open: true, contract, processing: false });
  };

  const handleConfirmFinalize = async () => {
    if (!finalizeModal.contract) return;
    setFinalizeModal((prev) => ({ ...prev, processing: true }));
    try {
      const res = await finalizeContractSale(supabase, finalizeModal.contract.id);
      alert(res.message || "Venda finalizada com sucesso!");
      setFinalizeModal({ open: false, contract: null, processing: false });
      await loadData();
    } catch (err: any) {
      alert("Erro ao finalizar venda: " + (err.message || "Tente novamente"));
      setFinalizeModal((prev) => ({ ...prev, processing: false }));
    }
  };

  // Carregar dados
  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Contratos
      const { data: contractsData, error: contractsError } = await supabase
        .from("contracts")
        .select(`
          *,
          contract_items (*)
        `)
        .order("created_at", { ascending: false });

      if (contractsError) {
        console.warn("Aviso ao carregar contratos:", contractsError.message);
      } else if (contractsData) {
        setContracts(
          contractsData.map((c: any) => ({
            ...c,
            items: (c.contract_items || []).map(formatDbContractItem),
          }))
        );
      }

      // 2. Fornecedores
      const { data: suppData } = await supabase.from("suppliers").select("id, name, currency_default");
      if (suppData) setAvailableSuppliers(suppData);

      // 3. Passeios Legados
      const { data: toursData } = await supabase.from("tours").select("id, name, slug, price, included, not_included");
      if (toursData && toursData.length > 0) {
        setAvailableTours(toursData);
      } else {
        setAvailableTours(
          DEFAULT_TOURS.map((t) => ({
            id: t.slug,
            name: t.name,
            slug: t.slug,
            price: t.priceFrom,
            included: t.included,
            not_included: t.notIncluded,
          }))
        );
      }

      // 4. Catálogo Oficial de Produtos Comerciais (v0.1.43)
      const { data: commProdData, error: commProdErr } = await supabase
        .from("commercial_products")
        .select("*")
        .eq("active", true)
        .order("display_name");
      if (!commProdErr && commProdData && commProdData.length > 0) {
        setCommercialProducts(commProdData);
      } else {
        setCommercialProducts(OFFICIAL_COMMERCIAL_PRODUCTS);
      }

      // 5. Clientes para autocompletar
      const { data: clientsData } = await supabase
        .from("clients")
        .select("id, name, phone, email, cpf, default_hotel, notes")
        .order("name");
      if (clientsData) setAvailableClients(clientsData);
    } catch (err) {
      console.error("Erro geral:", err);
    } finally {
      setLoading(false);
    }
  };

  // Preencher formulário e passeios automaticamente a partir de cliente e lead
  const populateContractFromClientAndLead = async (
    clientId?: string,
    clientName?: string,
    clientPhone?: string,
    clientCpf?: string,
    clientEmail?: string
  ) => {
    let associatedLead: any = null;
    let clientRecord: any = null;

    if (clientId) {
      const { data: cData } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .single();
      if (cData) clientRecord = cData;

      const { data: lData } = await supabase
        .from("leads")
        .select("*")
        .eq("converted_client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(1);
      if (lData && lData.length > 0) associatedLead = lData[0];
    }

    const effectivePhone = clientRecord?.phone || clientRecord?.whatsapp || clientPhone || "";
    const effectiveEmail = clientRecord?.email || clientEmail || "";

    if (!associatedLead && (effectivePhone || effectiveEmail)) {
      const cleanP = effectivePhone.replace(/\D/g, "");
      let query = supabase.from("leads").select("*");
      if (cleanP && effectiveEmail) {
        query = query.or(`phone.ilike.%${cleanP}%,email.eq.${effectiveEmail}`);
      } else if (cleanP) {
        query = query.ilike("phone", `%${cleanP}%`);
      } else if (effectiveEmail) {
        query = query.eq("email", effectiveEmail);
      }
      const { data: lData } = await query.order("created_at", { ascending: false }).limit(1);
      if (lData && lData.length > 0) associatedLead = lData[0];
    }

    const notesToParse = `${associatedLead?.notes || ""} \n ${clientRecord?.notes || ""}`;
    const parsed = parseLeadNotes(notesToParse);

    const arrival = parsed.arrival_date || new Date().toISOString().split("T")[0];
    const nextNum = `TN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const mappedItems: ContractItem[] = [];
    const rawTours = associatedLead?.selected_items;

    if (Array.isArray(rawTours) && rawTours.length > 0) {
      rawTours.forEach((it: any, idx: number) => {
        const match = DEFAULT_TOURS.find(
          (t) => t.slug === it.id || t.name.toLowerCase() === (it.name || "").toLowerCase()
        );
        const itemDate = new Date(new Date(arrival).getTime() + (idx + 1) * 86400000)
          .toISOString()
          .split("T")[0];
        const qty = Number(it.quantity || it.count || parsed.adults_count || 2);
        const unit = Number(it.unitPrice || match?.priceFrom || 0);
        const sale = Number(it.totalPrice || unit * qty || 0);

        const defaultCostOpt = findDefaultCostOptionForTour(match?.name || it.name || "");
        let costApplied = 0;
        let costCurrency = "USD";
        let totalCost = 0;
        let formula = "";
        let supplierName = "Operadora Local";
        let tariffCode: string | undefined = defaultCostOpt?.code;
        let pricingModel = defaultCostOpt?.pricingModel;

        if (defaultCostOpt) {
          const calc = calculateSupplierCost(defaultCostOpt.code, {
            adultsCount: parsed.adults_count ?? 2,
            childrenCount: parsed.children_count ?? 0,
            serviceDate: itemDate,
          });
          costApplied = calc.unitCostAdult || calc.calculatedTotalCost;
          costCurrency = calc.currency;
          totalCost = calc.calculatedTotalCost;
          formula = calc.formulaApplied;
          supplierName = calc.supplierName;
        }

        const matchedSupplier = availableSuppliers.find((s) =>
          s.name.toLowerCase().includes(supplierName.toLowerCase()) ||
          supplierName.toLowerCase().includes(s.name.toLowerCase())
        );

        mappedItems.push({
          tour_id: match?.slug || it.id || undefined,
          tour_name: it.name || match?.name || "Passeio",
          tour_date: itemDate,
          adults_count: parsed.adults_count ?? 2,
          children_count: parsed.children_count ?? 0,
          units_count: 1,
          sale_price: sale,
          cost_applied: costApplied,
          cost_currency: costCurrency,
          calculated_total_cost: totalCost,
          tariff_code: tariffCode,
          pricing_model: pricingModel,
          calculation_formula: formula,
          external_fees: defaultCostOpt?.externalFeesNote || "",
          supplier_id: matchedSupplier?.id || availableSuppliers[0]?.id || null,
          supplier_name: supplierName,
          voucher_ref: "",
          included: match?.included ? (Array.isArray(match.included) ? match.included.join(", ") : match.included) : "Transporte e acessos inclusos",
          not_included: match?.notIncluded ? (Array.isArray(match.notIncluded) ? match.notIncluded.join(", ") : match.notIncluded) : "",
        });
      });
    } else if (associatedLead?.interest_name) {
      const match = DEFAULT_TOURS.find(
        (t) => t.slug === associatedLead.interest_slug || t.name.toLowerCase() === associatedLead.interest_name.toLowerCase()
      );
      const itemDate = new Date(new Date(arrival).getTime() + 86400000).toISOString().split("T")[0];
      const qty = parsed.adults_count || 2;
      const unit = Number(match?.priceFrom || 0);
      const sale = unit * qty;

      const defaultCostOpt = findDefaultCostOptionForTour(match?.name || associatedLead.interest_name);
      let costApplied = 0;
      let costCurrency = "USD";
      let totalCost = 0;
      let formula = "";
      let supplierName = "Operadora Local";
      let tariffCode: string | undefined = defaultCostOpt?.code;
      let pricingModel = defaultCostOpt?.pricingModel;

      if (defaultCostOpt) {
        const calc = calculateSupplierCost(defaultCostOpt.code, {
          adultsCount: parsed.adults_count ?? 2,
          childrenCount: parsed.children_count ?? 0,
          serviceDate: itemDate,
        });
        costApplied = calc.unitCostAdult || calc.calculatedTotalCost;
        costCurrency = calc.currency;
        totalCost = calc.calculatedTotalCost;
        formula = calc.formulaApplied;
        supplierName = calc.supplierName;
      }

      const matchedSupplier = availableSuppliers.find((s) =>
        s.name.toLowerCase().includes(supplierName.toLowerCase()) ||
        supplierName.toLowerCase().includes(s.name.toLowerCase())
      );

      mappedItems.push({
        tour_id: match?.slug || undefined,
        tour_name: associatedLead.interest_name,
        tour_date: itemDate,
        adults_count: parsed.adults_count ?? 2,
        children_count: parsed.children_count ?? 0,
        units_count: 1,
        sale_price: sale,
        cost_applied: costApplied,
        cost_currency: costCurrency,
        calculated_total_cost: totalCost,
        tariff_code: tariffCode,
        pricing_model: pricingModel,
        calculation_formula: formula,
        external_fees: defaultCostOpt?.externalFeesNote || "",
        supplier_id: matchedSupplier?.id || availableSuppliers[0]?.id || null,
        supplier_name: supplierName,
        voucher_ref: "",
        included: match?.included ? (Array.isArray(match.included) ? match.included.join(", ") : match.included) : "",
        not_included: match?.notIncluded ? (Array.isArray(match.notIncluded) ? match.notIncluded.join(", ") : match.notIncluded) : "",
      });
    }

    const totalSum = mappedItems.reduce((acc, it) => acc + (it.sale_price || 0), 0);
    const deposit = Math.round(totalSum * 0.3);
    const balance = totalSum - deposit;

    setSelectedContract(null);
    setFormData({
      contract_number: nextNum,
      client_id: clientId || clientRecord?.id || undefined,
      client_name: clientRecord?.name || clientName || "",
      client_cpf: clientRecord?.cpf || clientCpf || "",
      client_phone: effectivePhone,
      client_email: effectiveEmail,
      arrival_date: arrival,
      departure_date: "",
      arrival_flight_number: parsed.flight_number || "",
      arrival_flight_time: parsed.flight_time || "",
      depart_flight_number: "",
      depart_flight_time: "",
      adults_count: parsed.adults_count ?? 2,
      children_count: parsed.children_count ?? 0,
      infants_count: parsed.infants_count ?? 0,
      hotels_schedule: (clientRecord?.default_hotel || parsed.hotel)
        ? [{ hotel_name: clientRecord?.default_hotel || parsed.hotel, checkin: arrival, checkout: "" }]
        : [{ hotel_name: "", checkin: "", checkout: "" }],
      deposit_amount: deposit,
      deposit_observation: "Sinal via PIX",
      balance_amount: balance,
      balance_observation: "Saldo a acertar no check-in em Cancún",
      total_amount: totalSum,
      currency: "BRL",
      status: "emitido",
      terms_clauses: DEFAULT_TERMS,
      internal_notes: associatedLead ? `Origem: Lead do site (${associatedLead.interest_name || "Roteiro"})` : "",
    });
    setFormItems(mappedItems);
    setFormModalOpen(true);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Abrir criação de contrato para uma nova viagem de cliente cadastrado
  const openNewTripForClient = async (clientId: string, clientName?: string) => {
    let clientRecord: any = null;
    if (clientId) {
      const { data } = await supabase.from("clients").select("*").eq("id", clientId).single();
      if (data) clientRecord = data;
    }

    const nextNum = `TN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const effectiveName = clientRecord?.name || clientName || "";
    const effectivePhone = clientRecord?.phone || clientRecord?.whatsapp || "";
    const effectiveCpf = clientRecord?.cpf || "";
    const effectiveEmail = clientRecord?.email || "";
    const today = new Date().toISOString().split("T")[0];

    setSelectedContract(null); // Cria novo registro, preservando histórico
    setFormData({
      contract_number: nextNum,
      client_id: clientId,
      client_name: effectiveName,
      client_cpf: effectiveCpf,
      client_phone: effectivePhone,
      client_email: effectiveEmail,
      arrival_date: today,
      departure_date: "",
      arrival_flight_number: "",
      arrival_flight_time: "",
      depart_flight_number: "",
      depart_flight_time: "",
      adults_count: 2,
      children_count: 0,
      infants_count: 0,
      hotels_schedule: clientRecord?.default_hotel
        ? [{ hotel_name: clientRecord.default_hotel, checkin: today, checkout: "" }]
        : [{ hotel_name: "", checkin: "", checkout: "" }],
      deposit_amount: 0,
      deposit_observation: "Sinal via PIX",
      balance_amount: 0,
      balance_observation: "Saldo a acertar no check-in em Cancún",
      total_amount: 0,
      currency: "BRL",
      status: "emitido",
      terms_clauses: DEFAULT_TERMS,
      internal_notes: `Nova viagem / Pacote adicional para cliente cadastrado (${effectiveName})`,
    });
    setFormItems([]);
    setFormModalOpen(true);
  };

  // Preencher formulário ou abrir contrato existente automaticamente via URL
  useEffect(() => {
    if (!searchParams) return;
    const openContractId = searchParams.get("openContractId");
    const printMode = searchParams.get("print") === "true";
    const autoOpen = searchParams.get("autoOpen") === "true";
    const clientId = searchParams.get("clientId") || undefined;
    const newTrip = searchParams.get("newTrip") === "true";
    const search = searchParams.get("search");

    if (search) {
      setSearchTerm(search);
    }

    // 1. Abrir contrato específico diretamente por ID
    if (openContractId) {
      const found = contracts.find((c) => c.id === openContractId);
      if (found) {
        if (printMode) openPrintModal(found);
        else openEditModal(found);
      } else {
        supabase
          .from("contracts")
          .select("*, contract_items(*)")
          .eq("id", openContractId)
          .single()
          .then(({ data }) => {
            if (data) {
              const formatted: Contract = {
                ...data,
                items: (data.contract_items || []).map(formatDbContractItem),
              };
              if (printMode) openPrintModal(formatted);
              else openEditModal(formatted);
            }
          });
      }
      return;
    }

    // 2. Veio de Clientes com autoOpen
    if (autoOpen && clientId) {
      if (newTrip) {
        openNewTripForClient(clientId, searchParams.get("clientName") || "");
        return;
      }

      // Checa se este cliente já tem contratos emitidos no banco
      supabase
        .from("contracts")
        .select("*, contract_items(*)")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .then(({ data: existing }) => {
          if (existing && existing.length > 0) {
            setClientExistingModal({
              open: true,
              clientName: searchParams.get("clientName") || existing[0].client_name || "Cliente",
              clientId: clientId,
              existingContracts: existing.map((c: any) => ({
                ...c,
                items: (c.contract_items || []).map(formatDbContractItem),
              })),
            });
          } else {
            populateContractFromClientAndLead(
              clientId,
              searchParams.get("clientName") || "",
              searchParams.get("clientPhone") || "",
              searchParams.get("clientCpf") || "",
              searchParams.get("clientEmail") || ""
            );
          }
        });
    }
  }, [searchParams, contracts.length]);

  // Abrir Modal de Criação
  const openCreateModal = () => {
    const nextNum = `TN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    setSelectedContract(null);
    setFormData({
      contract_number: nextNum,
      client_name: "",
      client_cpf: "",
      client_phone: "",
      client_email: "",
      arrival_date: new Date().toISOString().split("T")[0],
      departure_date: "",
      arrival_flight_number: "",
      arrival_flight_time: "",
      depart_flight_number: "",
      depart_flight_time: "",
      adults_count: 2,
      children_count: 0,
      infants_count: 0,
      hotels_schedule: [{ hotel_name: "", checkin: "", checkout: "" }],
      deposit_amount: 0,
      deposit_observation: "Sinal via PIX",
      balance_amount: 0,
      balance_observation: "Saldo a pagar em Cancún",
      total_amount: 0,
      currency: "BRL",
      status: "emitido",
      terms_clauses: DEFAULT_TERMS,
      internal_notes: "",
    });
    setFormItems([]);
    setFormModalOpen(true);
  };

  // Abrir Modal de Edição
  const openEditModal = (contract: Contract) => {
    setSelectedContract(contract);
    setFormData({ ...contract });
    setFormItems(contract.items || []);
    setFormModalOpen(true);
  };

  // Abrir Modal de Visualização/Impressão
  const openPrintModal = (contract: Contract) => {
    setSelectedContract(contract);
    setPrintModalOpen(true);
  };

  // Adicionar Hotel na lista
  const addHotelRow = () => {
    setFormData({
      ...formData,
      hotels_schedule: [...(formData.hotels_schedule || []), { hotel_name: "", checkin: "", checkout: "" }],
    });
  };

  const removeHotelRow = (idx: number) => {
    const list = [...(formData.hotels_schedule || [])];
    list.splice(idx, 1);
    setFormData({ ...formData, hotels_schedule: list });
  };

  // Adicionar Passeio do Catálogo no Contrato
  const addTourItem = (tourSlugOrId: string) => {
    const t = availableTours.find((x) => x.id === tourSlugOrId || x.slug === tourSlugOrId);
    if (!t) return;

    const adults = Number(formData.adults_count || 1);
    const children = Number(formData.children_count || 0);
    const unitPrice = Number(t.price || 0);
    const salePrice = unitPrice * adults + unitPrice * children * 0.8;
    const itemDate = formData.arrival_date || new Date().toISOString().split("T")[0];

    const defaultCostOpt = findDefaultCostOptionForTour(t.slug || t.name);
    let costApplied = 0;
    let costCurrency = "USD";
    let totalCost = 0;
    let formula = "";
    let supplierName = "Operadora Local";
    let tariffCode: string | undefined = defaultCostOpt?.code;
    let pricingModel = defaultCostOpt?.pricingModel;

    if (defaultCostOpt) {
      const calc = calculateSupplierCost(defaultCostOpt.code, {
        adultsCount: adults,
        childrenCount: children,
        serviceDate: itemDate,
      });
      costApplied = calc.unitCostAdult || calc.calculatedTotalCost;
      costCurrency = calc.currency;
      totalCost = calc.calculatedTotalCost;
      formula = calc.formulaApplied;
      supplierName = calc.supplierName;
    }

    const matchedSupplier = availableSuppliers.find((s) =>
      s.name.toLowerCase().includes(supplierName.toLowerCase()) ||
      supplierName.toLowerCase().includes(s.name.toLowerCase())
    );

    const newItem: ContractItem = {
      tour_id: t.id,
      tour_name: t.name,
      tour_date: itemDate,
      adults_count: adults,
      children_count: children,
      units_count: 1,
      sale_price: salePrice,
      cost_applied: costApplied,
      cost_currency: costCurrency,
      calculated_total_cost: totalCost,
      supplier_id: matchedSupplier?.id || availableSuppliers[0]?.id || null,
      supplier_name: supplierName,
      voucher_ref: "",
      tariff_code: tariffCode,
      pricing_model: pricingModel,
      calculation_formula: formula,
      external_fees: defaultCostOpt?.externalFeesNote || "",
      included: Array.isArray(t.included) ? t.included.join(", ") : t.included || "",
      not_included: Array.isArray(t.not_included) ? t.not_included.join(", ") : t.not_included || "",
    };

    const updatedItems = [...formItems, newItem];
    setFormItems(updatedItems);
    recalcTotal(updatedItems);
  };

  // Adicionar Opção Direta de Fornecedor Homologado (TN-001 a TN-042)
  const addSupplierOptionItem = (optionCode: string) => {
    const opt = getCostOptionByCode(optionCode);
    if (!opt) return;

    const adults = Number(formData.adults_count || 2);
    const children = Number(formData.children_count || 0);
    const itemDate = formData.arrival_date || new Date().toISOString().split("T")[0];

    const calc = calculateSupplierCost(opt.code, {
      adultsCount: adults,
      childrenCount: children,
      unitsCount: 1,
      legsCount: 1,
      serviceDate: itemDate,
    });

    const matchedSupplier = availableSuppliers.find((s) =>
      s.name.toLowerCase().includes(opt.supplierName.toLowerCase()) ||
      opt.supplierName.toLowerCase().includes(s.name.toLowerCase())
    );

    // Estimativa de venda sugerida para transfer ou passeio (editável pelo operador)
    let suggestedSale = 0;
    if (opt.currency === "USD") {
      suggestedSale = Math.round(calc.calculatedTotalCost * 6.5);
    } else if (opt.currency === "MXN") {
      suggestedSale = Math.round(calc.calculatedTotalCost * 0.35);
    }

    const newItem: ContractItem = {
      tour_id: undefined,
      tour_name: `[${opt.supplierName}] ${opt.serviceName}${opt.variant ? ` (${opt.variant})` : ""}`,
      tour_date: itemDate,
      adults_count: adults,
      children_count: children,
      units_count: 1,
      legs_count: 1,
      sale_price: suggestedSale,
      cost_applied: calc.unitCostAdult || calc.calculatedTotalCost,
      cost_currency: calc.currency,
      calculated_total_cost: calc.calculatedTotalCost,
      supplier_id: matchedSupplier?.id || null,
      supplier_name: opt.supplierName,
      voucher_ref: "",
      tariff_code: opt.code,
      pricing_model: opt.pricingModel,
      calculation_formula: calc.formulaApplied,
      included: opt.included || "",
      not_included: opt.notIncluded || "",
      external_fees: opt.externalFeesNote || "",
    };

    const updatedItems = [...formItems, newItem];
    setFormItems(updatedItems);
    recalcTotal(updatedItems);
  };

  // Adicionar Produto do Catálogo Oficial (52 Produtos Comerciais v0.1.43)
  const addOfficialProductItem = (tourId: string) => {
    const prod = commercialProducts.find((p) => p.tour_id === tourId) || getCommercialProductByTourId(tourId);
    if (!prod) return;

    const adults = Number(formData.adults_count || 2);
    const children = Number(formData.children_count || 0);
    const infants = Number(formData.infants_count || 0);
    const itemDate = formData.arrival_date || new Date().toISOString().split("T")[0];
    const hotelZone = (formData.hotels_schedule?.[0]?.zone as CanonicalHotelZone) || undefined;

    const calc = calculateCommercialPricing({
      tourId: prod.tour_id,
      serviceDate: itemDate,
      hotelZone: hotelZone,
      adultsCount: adults,
      childrenCount: children,
      infantsCount: infants,
      legsCount: 1,
    });

    const matchedSupplier = availableSuppliers.find((s) =>
      s.name?.toLowerCase().includes(calc.provider.toLowerCase()) ||
      calc.provider.toLowerCase().includes(s.name?.toLowerCase() || "")
    );

    // Sugestão de venda inicial (o vendedor ou admin pode ajustar livremente)
    let suggestedSale = 0;
    if (calc.calculatedTotalCost !== null && calc.calculatedTotalCost > 0) {
      if (calc.currency === "USD") {
        suggestedSale = Math.round(calc.calculatedTotalCost * 6.5);
      } else if (calc.currency === "MXN") {
        suggestedSale = Math.round(calc.calculatedTotalCost * 0.35);
      } else {
        suggestedSale = Math.round(calc.calculatedTotalCost * 1.3);
      }
    }

    const unitCost = calc.unitCostAdult || calc.unitCostFixed || (calc.calculatedTotalCost !== null ? calc.calculatedTotalCost : 0);

    const newItem: ContractItem = {
      tour_id: undefined,
      tour_name: `[${calc.provider}] ${calc.displayName}`,
      tour_date: itemDate,
      adults_count: adults,
      children_count: children,
      units_count: calc.unitsCount || 1,
      legs_count: calc.legsCount || 1,
      sale_price: suggestedSale,
      cost_applied: unitCost,
      cost_currency: calc.currency,
      calculated_total_cost: calc.calculatedTotalCost !== null ? calc.calculatedTotalCost : 0,
      supplier_id: matchedSupplier?.id || null,
      supplier_name: calc.provider,
      voucher_ref: "",
      tariff_code: calc.rateId || calc.tourId,
      pricing_model: calc.pricingBasis || undefined,
      calculation_formula: calc.formulaApplied,
      included: prod.ancillary_notes || "",
      not_included: prod.requires_ancillary_booking ? "Requer transfer separado" : "",
      external_fees: "",

      // Snapshots Oficiais v0.1.43
      rate_id_snapshot: calc.rateId || undefined,
      tour_id_code_snapshot: calc.tourId,
      is_manual_quote: Boolean(calc.isQuoteRequired),
      is_manual_override: false,
      manual_override_reason: undefined,
      hotel_zone_snapshot: hotelZone || undefined,
      native_currency: calc.currency,
      native_cost_applied: calc.calculatedTotalCost !== null ? unitCost : undefined,
      native_calculated_total_cost: calc.calculatedTotalCost !== null ? calc.calculatedTotalCost : undefined,
    };

    const updatedItems = [...formItems, newItem];
    setFormItems(updatedItems);
    recalcTotal(updatedItems);
    setCatalogModalOpen(false);
  };

  const removeTourItem = (idx: number) => {
    const list = [...formItems];
    list.splice(idx, 1);
    setFormItems(list);
    recalcTotal(list);
  };

  const updateTourItem = (idx: number, field: keyof ContractItem, val: any) => {
    const list = [...formItems];
    const current = { ...list[idx], [field]: val };

    // 1. Produto Comercial Oficial v0.1.43 (possui tour_id_code_snapshot)
    if (current.tour_id_code_snapshot) {
      if (field === "is_manual_override" && val === false) {
        // Restaurar para tarifa oficial do catálogo
        current.is_manual_override = false;
        current.manual_override_reason = undefined;
        const calc = calculateCommercialPricing({
          tourId: current.tour_id_code_snapshot,
          preferredRateId: current.rate_id_snapshot,
          serviceDate: current.tour_date,
          hotelZone: (current.hotel_zone_snapshot || formData.hotels_schedule?.[0]?.zone) as CanonicalHotelZone,
          adultsCount: Number(current.adults_count || 1),
          childrenCount: Number(current.children_count || 0),
          unitsCount: Number(current.units_count || 1),
          legsCount: Number(current.legs_count || 1),
        });
        current.rate_id_snapshot = calc.rateId || current.rate_id_snapshot;
        current.cost_applied = calc.unitCostAdult || calc.unitCostFixed || (calc.calculatedTotalCost !== null ? calc.calculatedTotalCost : 0);
        current.calculated_total_cost = calc.calculatedTotalCost !== null ? calc.calculatedTotalCost : 0;
        current.cost_currency = calc.currency;
        current.native_currency = calc.currency;
        current.native_cost_applied = current.cost_applied;
        current.native_calculated_total_cost = current.calculated_total_cost;
        current.calculation_formula = calc.formulaApplied;
        current.pricing_model = calc.pricingBasis || current.pricing_model;
        current.is_manual_quote = Boolean(calc.isQuoteRequired);
      } else if (field === "cost_applied") {
        // Ajuste manual de custo operacional (Admin): ativa manual override
        current.is_manual_override = true;
        current.native_cost_applied = Number(val);
        const adults = Number(current.adults_count || 1);
        const children = Number(current.children_count || 0);
        const units = Number(current.units_count || 1);
        const legs = Number(current.legs_count || 1);

        if (current.pricing_model === "Vehicle") {
          current.calculated_total_cost = Number(val) * legs;
        } else if (current.pricing_model === "Person" || !current.pricing_model) {
          current.calculated_total_cost = Number(val) * (adults + children);
        } else {
          current.calculated_total_cost = Number(val) * units;
        }
        current.native_calculated_total_cost = current.calculated_total_cost;
        current.calculation_formula = `Custo ajustado manualmente: ${current.cost_currency || "USD"} ${Number(val).toFixed(2)} (Manual Override)`;
      } else if (
        field === "adults_count" ||
        field === "children_count" ||
        field === "units_count" ||
        field === "legs_count" ||
        field === "tour_date" ||
        field === "hotel_zone_snapshot"
      ) {
        if (current.is_manual_override) {
          // Mantém valor unitário manual fixado, só ajusta quantidade
          const adults = Number(current.adults_count || 1);
          const children = Number(current.children_count || 0);
          const units = Number(current.units_count || 1);
          const legs = Number(current.legs_count || 1);
          const unit = Number(current.cost_applied || 0);

          if (current.pricing_model === "Vehicle") {
            current.calculated_total_cost = unit * legs;
          } else if (current.pricing_model === "Person") {
            current.calculated_total_cost = unit * (adults + children);
          } else {
            current.calculated_total_cost = unit * units;
          }
          current.native_calculated_total_cost = current.calculated_total_cost;
        } else {
          // Recálculo dinâmico usando o motor oficial v0.1.43
          const calc = calculateCommercialPricing({
            tourId: current.tour_id_code_snapshot,
            preferredRateId: current.rate_id_snapshot,
            serviceDate: current.tour_date,
            hotelZone: (current.hotel_zone_snapshot || formData.hotels_schedule?.[0]?.zone) as CanonicalHotelZone,
            adultsCount: Number(current.adults_count || 1),
            childrenCount: Number(current.children_count || 0),
            unitsCount: Number(current.units_count || 1),
            legsCount: Number(current.legs_count || 1),
          });
          current.rate_id_snapshot = calc.rateId || current.rate_id_snapshot;
          current.cost_applied = calc.unitCostAdult || calc.unitCostFixed || (calc.calculatedTotalCost !== null ? calc.calculatedTotalCost : 0);
          current.calculated_total_cost = calc.calculatedTotalCost !== null ? calc.calculatedTotalCost : 0;
          current.cost_currency = calc.currency;
          current.native_currency = calc.currency;
          current.native_cost_applied = current.cost_applied;
          current.native_calculated_total_cost = current.calculated_total_cost;
          current.calculation_formula = calc.formulaApplied;
          current.pricing_model = calc.pricingBasis || current.pricing_model;
          current.tariff_code = calc.rateId || current.tariff_code;
          current.is_manual_quote = Boolean(calc.isQuoteRequired);
        }
      }
    } else {
      // 2. Itens Legados (TN-001 a TN-042 ou catálogo antigo)
      if (
        (field === "adults_count" || field === "children_count" || field === "units_count" || field === "legs_count" || field === "tour_date" || field === "tariff_code") &&
        current.tariff_code
      ) {
        const calc = calculateSupplierCost(current.tariff_code, {
          adultsCount: Number(current.adults_count || 1),
          childrenCount: Number(current.children_count || 0),
          unitsCount: Number(current.units_count || 1),
          legsCount: Number(current.legs_count || 1),
          serviceDate: current.tour_date,
          manualCostOverride: current.cost_applied,
        });

        current.cost_applied = calc.unitCostAdult || calc.calculatedTotalCost;
        current.calculated_total_cost = calc.calculatedTotalCost;
        current.cost_currency = calc.currency;
        current.calculation_formula = calc.formulaApplied;
        current.pricing_model = calc.pricingModel;
      } else if (field === "cost_applied") {
        // Ajuste manual de custo
        const adults = Number(current.adults_count || 1);
        const units = Number(current.units_count || 1);
        if (current.pricing_model === "per_person" || !current.pricing_model) {
          current.calculated_total_cost = Number(val) * adults;
        } else {
          current.calculated_total_cost = Number(val) * units;
        }
      }
    }

    list[idx] = current;

    if (field === "sale_price" || field === "cost_applied") {
      recalcTotal(list);
    }
    setFormItems(list);
  };

  const recalcTotal = (items: ContractItem[]) => {
    const sum = items.reduce((acc, curr) => acc + Number(curr.sale_price || 0), 0);
    setFormData((prev) => ({
      ...prev,
      total_amount: sum,
      deposit_amount: Math.round(sum * 0.3), // 30% padrão de sinal
      balance_amount: sum - Math.round(sum * 0.3),
    }));
  };

  // Salvar Contrato
  const handleSaveContract = async (
    e?: React.FormEvent,
    statusOverride?: "rascunho" | "emitido" | "assinado"
  ) => {
    if (e) e.preventDefault();
    if (!formData.client_name) {
      alert("Por favor, preencha o Nome do Cliente.");
      return;
    }

    const finalStatus = statusOverride || formData.status || "emitido";
    if (finalStatus !== "rascunho" && !formData.arrival_date) {
      alert("Por favor, preencha a Data de Chegada para emitir o contrato oficial.");
      return;
    }

    setSaving(true);
    try {
      let contractId = selectedContract?.id;
      let effectiveClientId = formData.client_id;

      // 1. Sincronizar ou cadastrar automaticamente o cliente na tabela 'clients'
      if (formData.client_name) {
        if (!effectiveClientId) {
          const cleanPhone = (formData.client_phone || "").trim();
          const cleanName = formData.client_name.trim();

          let existingClient: any = null;
          if (cleanPhone) {
            const { data: byPhone } = await supabase
              .from("clients")
              .select("id, name, phone, email, cpf")
              .or(`phone.eq.${cleanPhone},whatsapp.eq.${cleanPhone}`)
              .limit(1);
            if (byPhone && byPhone.length > 0) existingClient = byPhone[0];
          }

          if (!existingClient && formData.client_email) {
            const { data: byEmail } = await supabase
              .from("clients")
              .select("id, name, phone, email, cpf")
              .eq("email", formData.client_email.trim())
              .limit(1);
            if (byEmail && byEmail.length > 0) existingClient = byEmail[0];
          }

          if (existingClient) {
            effectiveClientId = existingClient.id;
            await supabase
              .from("clients")
              .update({
                cpf: formData.client_cpf || existingClient.cpf || null,
                phone: formData.client_phone || existingClient.phone || null,
                whatsapp: formData.client_phone || existingClient.phone || null,
                email: formData.client_email || existingClient.email || null,
                updated_at: new Date().toISOString(),
              })
              .eq("id", effectiveClientId);
          } else {
            // Cadastra novo cliente automaticamente na tabela clients
            const { data: createdClient, error: clientCreateErr } = await supabase
              .from("clients")
              .insert([
                {
                  name: cleanName,
                  cpf: formData.client_cpf || null,
                  phone: formData.client_phone || null,
                  whatsapp: formData.client_phone || null,
                  email: formData.client_email || null,
                  notes: `Cadastrado automaticamente na emissão do contrato ${formData.contract_number}`,
                },
              ])
              .select("id")
              .single();

            if (!clientCreateErr && createdClient) {
              effectiveClientId = createdClient.id;
            }
          }
        } else {
          // Atualiza dados caso tenham sido corrigidos no contrato
          await supabase
            .from("clients")
            .update({
              name: formData.client_name.trim(),
              cpf: formData.client_cpf || null,
              phone: formData.client_phone || null,
              whatsapp: formData.client_phone || null,
              email: formData.client_email || null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", effectiveClientId);
        }
      }

      // 1. Validação prévia de integridade de todos os itens antes de tocar no banco de dados.
      // Impede que cabeçalho de contrato seja alterado se qualquer passeio contiver erro.
      validateContractItems(formItems, {
        arrival_date: formData.arrival_date,
        adults_count: formData.adults_count,
        children_count: formData.children_count,
      });

      // 100% ATÔMICO VIA RPC TRANSACIONAL: save_contract_with_items
      // Salva contrato e itens em transação única no banco de dados.
      // Se qualquer validação ou persistência falhar, nenhum dado parcial é gravado,
      // e o formulário permanece aberto com todos os dados digitados intactos.
      const contractPayload = {
        id: selectedContract ? selectedContract.id : undefined,
        contract_number: formData.contract_number,
        client_id: effectiveClientId || null,
        client_name: formData.client_name,
        client_cpf: formData.client_cpf || null,
        client_phone: formData.client_phone || null,
        client_email: formData.client_email || null,
        arrival_date: formData.arrival_date || new Date().toISOString().split("T")[0],
        departure_date: formData.departure_date || null,
        arrival_flight_number: formData.arrival_flight_number || null,
        arrival_flight_time: formData.arrival_flight_time || null,
        depart_flight_number: formData.depart_flight_number || null,
        depart_flight_time: formData.depart_flight_time || null,
        adults_count: formData.adults_count || 1,
        children_count: formData.children_count || 0,
        infants_count: formData.infants_count || 0,
        hotels_schedule: formData.hotels_schedule || [],
        deposit_amount: formData.deposit_amount || 0,
        deposit_observation: formData.deposit_observation || null,
        balance_amount: formData.balance_amount || 0,
        balance_observation: formData.balance_observation || null,
        total_amount: formData.total_amount || 0,
        currency: formData.currency || "BRL",
        status: finalStatus,
        terms_clauses: formData.terms_clauses || null,
        internal_notes: formData.internal_notes || null,
      };

      await saveContractWithItemsAtomic(
        supabase,
        contractPayload,
        formItems,
        {
          arrival_date: formData.arrival_date,
          adults_count: formData.adults_count,
          children_count: formData.children_count,
        }
      );

      setFormModalOpen(false);
      await loadData();
      if (finalStatus === "rascunho") {
        alert("Rascunho de contrato salvo com sucesso! Você pode continuar editando os voos e pagamentos a qualquer momento.");
      } else {
        alert(selectedContract ? "Contrato atualizado com sucesso!" : "Contrato oficial gerado e salvo com sucesso!");
      }
    } catch (err: any) {
      alert("Erro ao salvar contrato: " + (err.message || "Tente novamente"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!hasPermission("contracts:delete")) {
      alert("Operação restrita: apenas administradores podem excluir contratos.");
      return;
    }
    if (!confirm(`Deseja realmente excluir o contrato ${code}?`)) return;
    try {
      const { error } = await supabase.from("contracts").delete().eq("id", id);
      if (error) throw error;
      loadData();
    } catch (err: any) {
      alert("Erro ao excluir: " + err.message);
    }
  };

  // Filtragem
  const filteredContracts = contracts.filter((c) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      c.contract_number.toLowerCase().includes(term) ||
      c.client_name.toLowerCase().includes(term) ||
      (c.client_cpf && c.client_cpf.toLowerCase().includes(term)) ||
      (c.client_phone && c.client_phone.toLowerCase().includes(term));

    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      {/* PAINEL PRINCIPAL (DASHBOARD) - OCULTO NA IMPRESSÃO */}
      <div className="adm-no-print admin-dashboard-content" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Cabeçalho */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <span className="admin-brand-tag">OPERAÇÃO & CONTRATOS</span>
            <h2 style={{ fontSize: "28px", color: "var(--adm-wine)" }}>Contratos & Reservas da Agência</h2>
            <p style={{ color: "var(--adm-text-muted)", fontSize: "14px", marginTop: "2px" }}>
              Cadastre contratos com voos, hotéis, passeios e condições financeiras em um único lugar.
            </p>
          </div>

          <button type="button" className="adm-btn adm-btn-clay" onClick={openCreateModal}>
            <Plus size={16} />
            <span>Novo Contrato</span>
          </button>
        </div>

      {/* Cards de Resumo */}
      <div className="adm-kpi-grid">
        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <span>Contratos Cadastrados</span>
            <FileText size={18} color="var(--adm-clay)" />
          </div>
          <div className="adm-kpi-value">{contracts.length}</div>
          <div className="adm-kpi-desc">Total gerado no sistema</div>
        </div>

        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <span>Volume Total Fechado</span>
            <DollarSign size={18} color="var(--adm-emerald)" />
          </div>
          <div className="adm-kpi-value">
            R$ {contracts.reduce((acc, c) => acc + Number(c.total_amount || 0), 0).toLocaleString("pt-BR")}
          </div>
          <div className="adm-kpi-desc">Soma de contratos emitidos</div>
        </div>

        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <span>Saldo a Receber em Cancún</span>
            <DollarSign size={18} color="var(--adm-amber)" />
          </div>
          <div className="adm-kpi-value">
            R$ {contracts.reduce((acc, c) => acc + Number(c.balance_amount || 0), 0).toLocaleString("pt-BR")}
          </div>
          <div className="adm-kpi-desc">Valores previstos no check-in</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="adm-card" style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: "260px" }}>
          <Search size={18} color="var(--adm-clay)" />
          <input
            type="text"
            className="adm-input"
            style={{ width: "100%", maxWidth: "420px" }}
            placeholder="Buscar por código, nome do cliente, CPF ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--adm-text-muted)" }}>Status:</span>
          <select className="adm-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">Todos os Status</option>
            <option value="finalizado">✓ Venda Finalizada</option>
            <option value="emitido">Emitido</option>
            <option value="assinado">Assinado</option>
            <option value="rascunho">Rascunho</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
      </div>

      {/* Tabela de Contratos */}
      {loading ? (
        <div className="adm-card" style={{ padding: "60px 20px", textAlign: "center" }}>
          <Clock size={28} className="animate-spin" color="var(--adm-clay)" style={{ margin: "0 auto 12px" }} />
          <p style={{ color: "var(--adm-text-muted)" }}>Carregando contratos...</p>
        </div>
      ) : filteredContracts.length === 0 ? (
        <div className="adm-card" style={{ padding: "60px 20px", textAlign: "center" }}>
          <FileText size={38} color="var(--adm-clay)" style={{ margin: "0 auto 12px", opacity: 0.5 }} />
          <h3>Nenhum contrato cadastrado ainda</h3>
          <p style={{ color: "var(--adm-text-muted)", fontSize: "14px", marginTop: "4px" }}>
            Clique no botão acima para criar o primeiro contrato de cliente.
          </p>
        </div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Código / Ref</th>
                <th>Cliente</th>
                <th>Chegada & Voos</th>
                <th>PAX</th>
                <th>Passeios</th>
                <th>Total / Saldo</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredContracts.map((c) => (
                <tr key={c.id}>
                  <td>
                    <strong style={{ color: "var(--adm-wine)", fontSize: "14px" }}>{c.contract_number}</strong>
                    <div style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>
                      {new Date(c.created_at).toLocaleDateString("pt-BR")}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: "var(--adm-text-main)" }}>{c.client_name}</div>
                    <div style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>{c.client_phone || c.client_email}</div>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600 }}>
                      <Calendar size={13} color="var(--adm-clay)" />
                      <span>{c.arrival_date ? new Date(c.arrival_date + "T12:00:00").toLocaleDateString("pt-BR") : "—"}</span>
                    </div>
                    {c.arrival_flight_number && (
                      <div style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>
                        Voo {c.arrival_flight_number} {c.arrival_flight_time ? `(${c.arrival_flight_time})` : ""}
                      </div>
                    )}
                  </td>
                  <td>
                    <span style={{ fontSize: "13px", fontWeight: 600 }}>
                      {c.adults_count} ad{c.children_count > 0 ? `, ${c.children_count} ch` : ""}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", maxWidth: "240px" }}>
                      {(c.items || []).map((it, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: "11px",
                            background: "var(--adm-surface-alt)",
                            border: "1px solid var(--adm-border)",
                            padding: "2px 6px",
                            borderRadius: "6px",
                            whiteSpace: "nowrap"
                          }}
                        >
                          {it.tour_name}
                        </span>
                      ))}
                      {(!c.items || c.items.length === 0) && (
                        <span style={{ fontSize: "12px", color: "var(--adm-text-subtle)" }}>Nenhum passeio</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: "var(--adm-wine)" }}>
                      {c.currency} {Number(c.total_amount || 0).toLocaleString("pt-BR")}
                    </div>
                    {c.balance_amount > 0 && (
                      <div style={{ fontSize: "11px", color: "var(--adm-amber)" }}>
                        Saldo: {c.currency} {Number(c.balance_amount).toLocaleString("pt-BR")}
                      </div>
                    )}
                  </td>
                  <td>
                    <span
                      className={`adm-badge ${
                        c.status === "finalizado"
                          ? "badge-green"
                          : c.status === "assinado"
                          ? "badge-green"
                          : c.status === "emitido"
                          ? "badge-blue"
                          : c.status === "rascunho"
                          ? "badge-amber"
                          : "badge-gray"
                      }`}
                      style={{
                        fontSize: "11px",
                        fontWeight: c.status === "finalizado" ? 700 : 500,
                        backgroundColor: c.status === "finalizado" ? "#dcfce7" : undefined,
                        color: c.status === "finalizado" ? "#15803d" : undefined,
                        border: c.status === "finalizado" ? "1px solid #86efac" : undefined
                      }}
                    >
                      {c.status === "finalizado" ? "✓ VENDA FINALIZADA" : c.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                      {c.status !== "finalizado" && c.status !== "cancelado" && (
                        <button
                          type="button"
                          className="adm-btn adm-btn-outline adm-btn-sm"
                          style={{
                            background: c.status === "rascunho" ? "var(--adm-surface-alt)" : "rgba(16, 185, 129, 0.1)",
                            color: c.status === "rascunho" ? "var(--adm-text-muted)" : "#059669",
                            borderColor: c.status === "rascunho" ? "var(--adm-border)" : "#10b981",
                            fontWeight: 600,
                          }}
                          onClick={() => handleOpenFinalize(c)}
                          title={c.status === "rascunho" ? "Rascunhos não geram reservas (emita primeiro)" : "Finalizar venda e gerar reservas operacionais"}
                        >
                          <CheckCircle2 size={13} />
                          <span>Finalizar Venda</span>
                        </button>
                      )}

                      {c.status === "finalizado" && (
                        <Link
                          href={`/admin/carteiras?search=${encodeURIComponent(c.contract_number)}`}
                          className="adm-btn adm-btn-outline adm-btn-sm"
                          style={{
                            background: "rgba(165, 94, 64, 0.08)",
                            color: "var(--adm-clay)",
                            borderColor: "rgba(165, 94, 64, 0.3)",
                            fontWeight: 600,
                          }}
                          title="Ver ou Preparar Carteira de Viagem do Cliente"
                        >
                          <Wallet size={13} />
                          <span>Carteira</span>
                        </Link>
                      )}

                      {/* Contas a Receber / Pagamentos do Cliente */}
                      <Link
                        href={`/admin/financeiro/clientes?contract_id=${c.id}`}
                        className="adm-btn adm-btn-outline adm-btn-sm"
                        style={{
                          background: "rgba(2, 132, 199, 0.08)",
                          color: "#0284c7",
                          borderColor: "rgba(2, 132, 199, 0.3)",
                        }}
                        title="Ver Contas a Receber e Extrato Financeiro do Cliente"
                      >
                        <DollarSign size={13} />
                        <span>Receber</span>
                      </Link>

                      <button
                        type="button"
                        className="adm-btn adm-btn-outline adm-btn-sm"
                        style={{ background: "var(--adm-wine-faded)", color: "var(--adm-wine)" }}
                        onClick={() => openPrintModal(c)}
                        title="Visualizar e Imprimir Contrato"
                      >
                        <Printer size={13} />
                        <span>Contrato</span>
                      </button>

                      {/* Ocorrências do Contrato */}
                      <Link
                        href={`/admin/ocorrencias?search=${encodeURIComponent(c.contract_number)}`}
                        className="adm-btn adm-btn-outline adm-btn-sm"
                        style={{
                          background: "rgba(239, 68, 68, 0.06)",
                          color: "#dc2626",
                          borderColor: "rgba(239, 68, 68, 0.25)",
                        }}
                        title="Ver ou registrar ocorrências deste contrato"
                      >
                        <ShieldAlert size={13} />
                        <span>Ocorrências</span>
                      </Link>

                      <button
                        type="button"
                        className="adm-btn adm-btn-outline adm-btn-sm"
                        onClick={() => openEditModal(c)}
                        title="Editar Contrato"
                      >
                        <Edit2 size={13} />
                      </button>

                      {hasPermission("contracts:delete") && (
                        <button
                          type="button"
                          className="adm-btn adm-btn-outline adm-btn-sm"
                          style={{ color: "var(--adm-rose)" }}
                          onClick={() => handleDelete(c.id, c.contract_number)}
                          title="Excluir"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </div>

      {/* =========================================================================
          MODAL DE CRIAÇÃO / EDIÇÃO DE CONTRATO
         ========================================================================= */}
      {formModalOpen && (
        <div className="adm-modal-backdrop adm-no-print" onClick={() => setFormModalOpen(false)}>
          <div
            className="adm-modal-card"
            style={{ maxWidth: "860px", maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="adm-modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <span className="admin-brand-tag">CONTRATO DA AGÊNCIA</span>
                <h3 style={{ fontSize: "20px" }}>
                  {selectedContract ? `Editar Contrato ${formData.contract_number}` : "Novo Contrato de Prestação de Serviços"}
                </h3>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--adm-wine)" }}>Status:</label>
                  <select
                    className="adm-select"
                    style={{ width: "auto", padding: "4px 8px", fontSize: "12px", height: "32px", minWidth: "150px" }}
                    value={formData.status || "emitido"}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  >
                    <option value="rascunho">📝 Rascunho (Pré-contrato)</option>
                    <option value="emitido">📄 Emitido (Aguardando Assinatura)</option>
                    <option value="assinado">✅ Assinado</option>
                    <option value="finalizado">✓ Venda Finalizada</option>
                    <option value="cancelado">❌ Cancelado</option>
                  </select>
                </div>
                <button type="button" className="adm-btn adm-btn-icon adm-btn-outline" onClick={() => setFormModalOpen(false)}>
                  <X size={16} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveContract}>
              <div className="adm-modal-body" style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
                {/* 1. DADOS DO CLIENTE */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
                    <h4 style={{ fontSize: "15px", color: "var(--adm-wine)", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
                      <Users size={16} color="var(--adm-clay)" />
                      <span>1. Dados do Cliente & Passageiros</span>
                    </h4>
                    {availableClients && availableClients.length > 0 && !selectedContract && (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>Carregar Cliente:</span>
                        <select
                          className="adm-select"
                          style={{ width: "auto", minWidth: "200px", padding: "4px 8px", fontSize: "12px" }}
                          value={formData.client_id || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val) {
                              populateContractFromClientAndLead(val);
                            }
                          }}
                        >
                          <option value="">-- Selecione para preencher --</option>
                          {availableClients.map((cl) => (
                            <option key={cl.id} value={cl.id}>
                              {cl.name} {cl.phone ? `(${cl.phone})` : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px", marginBottom: "10px" }}>
                    <div>
                      <label className="adm-label">Nome Completo do Cliente *</label>
                      <input
                        type="text"
                        required
                        className="adm-input"
                        placeholder="Ex: Mariana Silva e Souza"
                        value={formData.client_name || ""}
                        onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="adm-label">CPF / Documento</label>
                      <input
                        type="text"
                        className="adm-input"
                        placeholder="000.000.000-00"
                        value={formData.client_cpf || ""}
                        onChange={(e) => setFormData({ ...formData, client_cpf: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                    <div>
                      <label className="adm-label">WhatsApp com DDI</label>
                      <input
                        type="text"
                        className="adm-input"
                        placeholder="+55 11 99999-9999"
                        value={formData.client_phone || ""}
                        onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="adm-label">E-mail</label>
                      <input
                        type="email"
                        className="adm-input"
                        placeholder="cliente@email.com"
                        value={formData.client_email || ""}
                        onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="adm-label">Adultos / Crianças / Infantes</label>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <input
                          type="number"
                          min="1"
                          className="adm-input"
                          title="Adultos"
                          placeholder="Adultos"
                          value={formData.adults_count ?? 1}
                          onChange={(e) => setFormData({ ...formData, adults_count: Number(e.target.value) })}
                        />
                        <input
                          type="number"
                          min="0"
                          className="adm-input"
                          title="Crianças"
                          placeholder="Crianças"
                          value={formData.children_count ?? 0}
                          onChange={(e) => setFormData({ ...formData, children_count: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. LOGÍSTICA DE VOOS & ESTADIA */}
                <div style={{ borderTop: "1px solid var(--adm-border)", paddingTop: "18px" }}>
                  <h4 style={{ fontSize: "15px", color: "var(--adm-wine)", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Plane size={16} color="var(--adm-clay)" />
                    <span>2. Logística de Voos e Chegada</span>
                  </h4>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "10px" }}>
                    <div>
                      <label className="adm-label">Data de Chegada em Cancún *</label>
                      <input
                        type="date"
                        required
                        className="adm-input"
                        value={formData.arrival_date || ""}
                        onChange={(e) => setFormData({ ...formData, arrival_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="adm-label">Nº Voo Chegada</label>
                      <input
                        type="text"
                        className="adm-input"
                        placeholder="Ex: LA 8124"
                        value={formData.arrival_flight_number || ""}
                        onChange={(e) => setFormData({ ...formData, arrival_flight_number: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="adm-label">Horário Chegada</label>
                      <input
                        type="text"
                        className="adm-input"
                        placeholder="Ex: 14:35"
                        value={formData.arrival_flight_time || ""}
                        onChange={(e) => setFormData({ ...formData, arrival_flight_time: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                    <div>
                      <label className="adm-label">Data de Saída / Retorno</label>
                      <input
                        type="date"
                        className="adm-input"
                        value={formData.departure_date || ""}
                        onChange={(e) => setFormData({ ...formData, departure_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="adm-label">Nº Voo Saída</label>
                      <input
                        type="text"
                        className="adm-input"
                        placeholder="Ex: LA 8125"
                        value={formData.depart_flight_number || ""}
                        onChange={(e) => setFormData({ ...formData, depart_flight_number: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="adm-label">Horário Saída</label>
                      <input
                        type="text"
                        className="adm-input"
                        placeholder="Ex: 18:20"
                        value={formData.depart_flight_time || ""}
                        onChange={(e) => setFormData({ ...formData, depart_flight_time: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* 3. RESUMO DE HOTÉIS E HOSPEDAGEM */}
                <HotelScheduleSection
                  schedules={formData.hotels_schedule || []}
                  onChange={(updated) => setFormData({ ...formData, hotels_schedule: updated })}
                />


                {/* 4. PASSEIOS CONTRATADOS */}
                <div style={{ borderTop: "1px solid var(--adm-border)", paddingTop: "18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
                    <div>
                      <h4 style={{ fontSize: "15px", color: "var(--adm-wine)", display: "flex", alignItems: "center", gap: "6px" }}>
                        <CheckCircle2 size={16} color="var(--adm-clay)" />
                        <span>4. Passeios e Serviços Contratados</span>
                      </h4>
                      <p style={{ fontSize: "12px", color: "var(--adm-text-muted)", marginTop: "2px" }}>
                        Catálogo oficial homologado (52 produtos / 80 tarifas v0.1.43) com compatibilidade legada (TN-001 a TN-042). Os custos e moedas são calculados automaticamente conforme data e zona de hotel.
                      </p>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      {/* Botão de Abertura do Modal do Catálogo Oficial */}
                      <button
                        type="button"
                        className="adm-btn adm-btn-primary"
                        style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700 }}
                        onClick={() => setCatalogModalOpen(true)}
                      >
                        <Sparkles size={15} />
                        <span>Catálogo Oficial (52 Produtos)</span>
                      </button>

                      {/* Dropdown de Seleção Rápida de Produtos Comerciais Oficiais */}
                      <select
                        className="adm-select"
                        style={{ width: "auto", fontWeight: 600, borderColor: "var(--adm-wine)", color: "var(--adm-wine)", background: "#fff" }}
                        onChange={(e) => {
                          if (e.target.value) {
                            addOfficialProductItem(e.target.value);
                            e.target.value = "";
                          }
                        }}
                      >
                        <option value="">+ Seleção Rápida Oficial...</option>
                        {Array.from(new Set(commercialProducts.map((p) => p.provider))).sort().map((prov) => (
                          <optgroup key={prov} label={`Fornecedor: ${prov}`}>
                            {commercialProducts.filter((p) => p.provider === prov).map((p) => (
                              <option key={p.tour_id} value={p.tour_id}>
                                [{p.tour_id}] {p.display_name} ({p.product_type})
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>

                      {/* Seletor de Opções Homologadas Legadas TN-001 a TN-042 */}
                      <select
                        className="adm-select"
                        style={{ width: "auto", borderColor: "var(--adm-border)", color: "var(--adm-text)" }}
                        onChange={(e) => {
                          if (e.target.value) {
                            addSupplierOptionItem(e.target.value);
                            e.target.value = "";
                          }
                        }}
                      >
                        <option value="">+ Tabela Legada (TN-001 a TN-042)...</option>
                        {Array.from(new Set(SUPPLIER_COST_OPTIONS.map((o) => o.supplierName))).map((supName) => (
                          <optgroup key={supName} label={`Legado: ${supName}`}>
                            {SUPPLIER_COST_OPTIONS.filter((o) => o.supplierName === supName).map((o) => (
                              <option key={o.code} value={o.code}>
                                [{o.code}] {o.serviceName} {o.variant ? `(${o.variant})` : ""} {canViewCosts ? `— ${o.currency} ${o.costAdult || o.costFixed || "Sob cotação"}` : ""}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>

                      {/* Seletor de Passeio Geral Legado */}
                      <select
                        className="adm-select"
                        style={{ width: "auto" }}
                        onChange={(e) => {
                          if (e.target.value) {
                            addTourItem(e.target.value);
                            e.target.value = "";
                          }
                        }}
                      >
                        <option value="">+ Passeio Geral Legado...</option>
                        {availableTours.map((t) => (
                          <option key={t.id} value={t.slug || t.id}>
                            {t.name} (R$ {t.price})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {formItems.length === 0 ? (
                    <div style={{ padding: "28px", background: "var(--adm-surface-alt)", borderRadius: "10px", textAlign: "center", border: "1px dashed var(--adm-border)" }}>
                      <span style={{ fontSize: "13px", color: "var(--adm-text-muted)" }}>
                        Nenhum passeio ou serviço adicionado ao contrato. Clique em <strong>Catálogo Oficial (52 Produtos)</strong> ou utilize os seletores acima.
                      </span>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {formItems.map((item, itIdx) => {
                        const cocoCheck = item.tariff_code?.startsWith("TN-00")
                          ? validateCocoBongoDay(item.tariff_code, item.tour_date)
                          : { valid: true };

                        const isOfficial = Boolean(item.tour_id_code_snapshot);
                        const isVehicleOrTransfer = item.pricing_model === "Vehicle" ||
                          item.tour_id_code_snapshot?.startsWith("MIG") ||
                          item.tour_name.toLowerCase().includes("transfer") ||
                          item.tour_name.toLowerCase().includes("shuttle");

                        return (
                          <div
                            key={itIdx}
                            style={{
                              padding: "14px 16px",
                              background: "#ffffff",
                              borderRadius: "10px",
                              border: item.is_manual_override ? "1px solid #f59e0b" : "1px solid var(--adm-border)",
                              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                              display: "flex",
                              flexDirection: "column",
                              gap: "10px",
                            }}
                          >
                            {/* Linha Principal de Dados */}
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "130px 1.4fr 120px 130px 140px 140px auto",
                                gap: "10px",
                                alignItems: "center",
                              }}
                            >
                              {/* 1. Data */}
                              <div>
                                <label style={{ fontSize: "10px", textTransform: "uppercase", color: "var(--adm-text-muted)", fontWeight: 700 }}>
                                  Data do Serviço
                                </label>
                                <input
                                  type="date"
                                  className="adm-input"
                                  value={item.tour_date}
                                  onChange={(e) => updateTourItem(itIdx, "tour_date", e.target.value)}
                                />
                              </div>

                              {/* 2. Nome do Serviço & Badges Oficiais */}
                              <div>
                                <label style={{ fontSize: "10px", textTransform: "uppercase", color: "var(--adm-text-muted)", fontWeight: 700 }}>
                                  Serviço & Fornecedor
                                </label>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                                  {item.tour_id_code_snapshot ? (
                                    <span
                                      className="adm-badge"
                                      style={{ background: "var(--adm-wine)", color: "#ffffff", fontSize: "10px", fontWeight: 700, padding: "2px 6px" }}
                                    >
                                      {item.tour_id_code_snapshot}
                                    </span>
                                  ) : item.tariff_code ? (
                                    <span
                                      className="adm-badge adm-badge-success"
                                      style={{ fontSize: "10px", fontWeight: 700, padding: "2px 6px" }}
                                    >
                                      {item.tariff_code}
                                    </span>
                                  ) : (
                                    <span
                                      className="adm-badge adm-badge-neutral"
                                      style={{ fontSize: "10px", padding: "2px 6px" }}
                                    >
                                      Personalizado
                                    </span>
                                  )}

                                  {canViewCosts && item.rate_id_snapshot && (
                                    <span
                                      className="adm-badge adm-badge-neutral"
                                      style={{ fontSize: "10px", padding: "2px 5px" }}
                                      title="Tarifa oficial de fornecedor snapshot v0.1.43"
                                    >
                                      Tarifa: {item.rate_id_snapshot}
                                    </span>
                                  )}

                                  {item.is_manual_quote && (
                                    <span
                                      className="adm-badge adm-badge-warning"
                                      style={{ fontSize: "10px", fontWeight: 700, padding: "2px 6px" }}
                                    >
                                      ⚠️ Sob Cotação
                                    </span>
                                  )}

                                  {item.is_manual_override && (
                                    <span
                                      className="adm-badge"
                                      style={{ background: "#fef3c7", color: "#b45309", border: "1px solid #fde68a", fontSize: "10px", fontWeight: 700, padding: "2px 6px" }}
                                    >
                                      🛠️ Override Manual
                                    </span>
                                  )}

                                  <span style={{ fontWeight: 600, fontSize: "13px", color: "var(--adm-wine)" }}>
                                    {item.tour_name}
                                  </span>
                                </div>
                                <div style={{ fontSize: "11px", color: "var(--adm-text-muted)", marginTop: "2px" }}>
                                  Fornecedor: <strong>{item.supplier_name || "Não informado"}</strong>
                                </div>
                              </div>

                              {/* 3. Passageiros / Unidades */}
                              <div>
                                <label style={{ fontSize: "10px", textTransform: "uppercase", color: "var(--adm-text-muted)", fontWeight: 700 }}>
                                  Adultos / Crianças
                                </label>
                                <div style={{ display: "flex", gap: "4px" }}>
                                  <input
                                    type="number"
                                    min="1"
                                    className="adm-input"
                                    title="Adultos"
                                    placeholder="Ad"
                                    value={item.adults_count}
                                    onChange={(e) => updateTourItem(itIdx, "adults_count", Number(e.target.value))}
                                  />
                                  <input
                                    type="number"
                                    min="0"
                                    className="adm-input"
                                    title="Crianças"
                                    placeholder="Cr"
                                    value={item.children_count}
                                    onChange={(e) => updateTourItem(itIdx, "children_count", Number(e.target.value))}
                                  />
                                </div>
                              </div>

                              {/* 4. Fornecedor Vinculado */}
                              <div>
                                <label style={{ fontSize: "10px", textTransform: "uppercase", color: "var(--adm-text-muted)", fontWeight: 700 }}>
                                  Operador
                                </label>
                                <select
                                  className="adm-select"
                                  style={{ fontSize: "11px", height: "34px" }}
                                  value={item.supplier_id || ""}
                                  onChange={(e) => {
                                    const sup = availableSuppliers.find((s) => s.id === e.target.value);
                                    updateTourItem(itIdx, "supplier_id", e.target.value);
                                    if (sup) updateTourItem(itIdx, "supplier_name", sup.name);
                                  }}
                                >
                                  <option value="">Selecione...</option>
                                  {availableSuppliers.map((s) => (
                                    <option key={s.id} value={s.id}>
                                      {s.name}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* 5. Preço Venda Total R$ (Definido pelo Vendedor/Admin) */}
                              <div>
                                <label style={{ fontSize: "10px", textTransform: "uppercase", color: "var(--adm-text-muted)", fontWeight: 700 }}>
                                  Venda (Total R$)
                                </label>
                                <input
                                  type="number"
                                  className="adm-input"
                                  style={{ fontWeight: 600 }}
                                  value={item.sale_price}
                                  onChange={(e) => updateTourItem(itIdx, "sale_price", Number(e.target.value))}
                                />
                              </div>

                              {/* 6. Custo Operacional (RBAC: Estritamente Confidencial para Seller) */}
                              {canViewCosts ? (
                                <div>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <label style={{ fontSize: "10px", textTransform: "uppercase", color: "var(--adm-text-muted)", fontWeight: 700 }}>
                                      Custo ({item.native_currency || item.cost_currency || "USD"})
                                    </label>
                                    {item.is_manual_override && (
                                      <button
                                        type="button"
                                        style={{ border: "none", background: "none", color: "var(--adm-wine)", fontSize: "10px", textDecoration: "underline", cursor: "pointer", padding: 0 }}
                                        onClick={() => updateTourItem(itIdx, "is_manual_override", false)}
                                        title="Restaurar tarifa oficial da tabela"
                                      >
                                        Restaurar
                                      </button>
                                    )}
                                  </div>
                                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                    <input
                                      type="number"
                                      step="0.01"
                                      className="adm-input"
                                      style={{
                                        fontWeight: 600,
                                        color: item.is_manual_override ? "#b45309" : "var(--adm-wine)",
                                        borderColor: item.is_manual_override ? "#f59e0b" : undefined
                                      }}
                                      title="Custo Unitário ou Aplicado"
                                      value={item.cost_applied}
                                      onChange={(e) => updateTourItem(itIdx, "cost_applied", Number(e.target.value))}
                                    />
                                    <span style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>
                                      Total: <strong>{item.native_currency || item.cost_currency || "USD"} {Number(item.calculated_total_cost || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <label style={{ fontSize: "10px", textTransform: "uppercase", color: "var(--adm-text-muted)", fontWeight: 700 }}>
                                    Custo Operacional
                                  </label>
                                  <div style={{ height: "34px", display: "flex", alignItems: "center" }}>
                                    <span
                                      className="adm-badge"
                                      style={{
                                        background: "#fef2f2",
                                        color: "#991b1b",
                                        border: "1px solid #fecaca",
                                        fontSize: "11px",
                                        padding: "4px 8px",
                                        fontWeight: 600,
                                      }}
                                      title="Custos internos e margens são estritamente confidenciais"
                                    >
                                      🔒 Confidencial
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* 7. Excluir */}
                              <button
                                type="button"
                                className="adm-btn adm-btn-icon adm-btn-outline adm-btn-sm"
                                style={{ color: "var(--adm-rose)" }}
                                onClick={() => removeTourItem(itIdx)}
                                title="Remover Passeio"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>

                            {/* Linha de Logística, Auditoria, Inclusões e Controles Avançados */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px", paddingTop: "8px", borderTop: "1px dashed var(--adm-border)" }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", fontSize: "11px" }}>
                                  {/* Seletor de Zona Canônica de Hotel do Passeio */}
                                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                    <span style={{ fontSize: "10px", color: "var(--adm-text-muted)", fontWeight: 600 }}>Zona Hotel:</span>
                                    <select
                                      className="adm-select"
                                      style={{ fontSize: "10px", height: "24px", padding: "0 6px", width: "auto" }}
                                      value={item.hotel_zone_snapshot || formData.hotels_schedule?.[0]?.zone || ""}
                                      onChange={(e) => updateTourItem(itIdx, "hotel_zone_snapshot", e.target.value)}
                                    >
                                      <option value="">(Zona do Contrato: {formData.hotels_schedule?.[0]?.zone || "Geral"})</option>
                                      {CANONICAL_ZONES.map((z) => (
                                        <option key={z} value={z}>
                                          {z}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  {/* Seletor de Trechos / Legs para Transfers Privativos */}
                                  {isVehicleOrTransfer && (
                                    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                      <span style={{ fontSize: "10px", color: "var(--adm-text-muted)", fontWeight: 600 }}>Trechos:</span>
                                      <select
                                        className="adm-select"
                                        style={{ fontSize: "10px", height: "24px", padding: "0 6px", width: "auto" }}
                                        value={item.legs_count || 1}
                                        onChange={(e) => updateTourItem(itIdx, "legs_count", Number(e.target.value))}
                                      >
                                        <option value={1}>1 Trecho (Só Ida ou Só Volta)</option>
                                        <option value={2}>2 Trechos (Ida e Volta / Round-Trip)</option>
                                      </select>
                                    </div>
                                  )}

                                  {/* Fórmula Operacional Interna (apenas visível a quem tem acesso a custos) */}
                                  {canViewCosts && item.calculation_formula && (
                                    <span style={{ color: "var(--adm-text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                                      <Calculator size={13} color="var(--adm-clay)" />
                                      <strong>Fórmula:</strong> {item.calculation_formula}
                                    </span>
                                  )}

                                  {/* Motivo de Override Manual (se aplicável, para Admin) */}
                                  {canViewCosts && item.is_manual_override && (
                                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                      <span style={{ color: "#b45309", fontWeight: 600, fontSize: "10px" }}>Motivo Override:</span>
                                      <input
                                        type="text"
                                        className="adm-input"
                                        style={{ fontSize: "10px", height: "22px", padding: "0 6px", width: "160px" }}
                                        placeholder="Ex: Tarifa acordada comercialmente"
                                        value={item.manual_override_reason || ""}
                                        onChange={(e) => updateTourItem(itIdx, "manual_override_reason", e.target.value)}
                                      />
                                    </div>
                                  )}

                                  {item.external_fees && (
                                    <span style={{ color: "#d97706", display: "flex", alignItems: "center", gap: "4px", fontWeight: 600 }}>
                                      <AlertCircle size={13} />
                                      <strong>Taxa adicional:</strong> {item.external_fees}
                                    </span>
                                  )}

                                  {!cocoCheck.valid && (
                                    <span style={{ color: "#b91c1c", display: "flex", alignItems: "center", gap: "4px", fontWeight: 700 }}>
                                      <AlertCircle size={13} />
                                      {cocoCheck.reason}
                                    </span>
                                  )}
                                </div>

                                {/* Reatribuir Código Legado TN-xxx se desejado */}
                                {!isOfficial && (
                                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <span style={{ fontSize: "10px", color: "var(--adm-text-muted)" }}>Tabela Legada:</span>
                                    <select
                                      className="adm-select"
                                      style={{ fontSize: "10px", height: "24px", padding: "0 6px", width: "auto" }}
                                      value={item.tariff_code || ""}
                                      onChange={(e) => updateTourItem(itIdx, "tariff_code", e.target.value || undefined)}
                                    >
                                      <option value="">(Sem tabela vinculada)</option>
                                      {SUPPLIER_COST_OPTIONS.map((o) => (
                                        <option key={o.code} value={o.code}>
                                          {o.code} — {o.supplierName} ({o.serviceName})
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                )}
                              </div>

                              <input
                                type="text"
                                className="adm-input"
                                style={{ fontSize: "11px", height: "26px" }}
                                placeholder="Inclusões resumidas que aparecerão no contrato do cliente..."
                                value={item.included || ""}
                                onChange={(e) => updateTourItem(itIdx, "included", e.target.value)}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 5. FORMA DE PAGAMENTO */}
                <div style={{ borderTop: "1px solid var(--adm-border)", paddingTop: "18px" }}>
                  <h4 style={{ fontSize: "15px", color: "var(--adm-wine)", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <DollarSign size={16} color="var(--adm-clay)" />
                    <span>5. Forma de Pagamento & Remuneração</span>
                  </h4>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                    <div>
                      <label className="adm-label">Depósito (Sinal) - Valor</label>
                      <input
                        type="number"
                        className="adm-input"
                        value={formData.deposit_amount || 0}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setFormData({
                            ...formData,
                            deposit_amount: val,
                            balance_amount: Number(formData.total_amount || 0) - val,
                          });
                        }}
                      />
                    </div>

                    <div>
                      <label className="adm-label">Saldo em Cancún - Valor</label>
                      <input
                        type="number"
                        className="adm-input"
                        value={formData.balance_amount || 0}
                        onChange={(e) => setFormData({ ...formData, balance_amount: Number(e.target.value) })}
                      />
                    </div>

                    <div>
                      <label className="adm-label">Total do Contrato</label>
                      <input
                        type="number"
                        className="adm-input"
                        style={{ fontWeight: 700, color: "var(--adm-wine)" }}
                        value={formData.total_amount || 0}
                        onChange={(e) => setFormData({ ...formData, total_amount: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label className="adm-label">Observação do Depósito</label>
                      <input
                        type="text"
                        className="adm-input"
                        placeholder="Ex: PIX no ato do contrato"
                        value={formData.deposit_observation || ""}
                        onChange={(e) => setFormData({ ...formData, deposit_observation: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="adm-label">Observação do Saldo</label>
                      <input
                        type="text"
                        className="adm-input"
                        placeholder="Ex: Em espécie USD no primeiro dia do roteiro"
                        value={formData.balance_observation || ""}
                        onChange={(e) => setFormData({ ...formData, balance_observation: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* 6. CLÁUSULAS CONTRATUAIS */}
                <div style={{ borderTop: "1px solid var(--adm-border)", paddingTop: "18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
                    <div>
                      <label className="adm-label" style={{ marginBottom: "2px" }}>Termos e Cláusulas Contratuais (Editável)</label>
                      <span style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                        Você pode editar livremente as 12 cláusulas, prazos ou regras de cancelamento para este contrato.
                      </span>
                    </div>
                    <button
                      type="button"
                      className="adm-btn adm-btn-outline adm-btn-sm"
                      style={{ fontSize: "11px" }}
                      onClick={() => {
                        if (confirm("Deseja restaurar as cláusulas para o texto padrão da Tio Nenê?")) {
                          setFormData((prev) => ({ ...prev, terms_clauses: DEFAULT_TERMS }));
                        }
                      }}
                    >
                      Restaurar Cláusulas Padrão
                    </button>
                  </div>
                  <textarea
                    className="adm-textarea"
                    rows={8}
                    style={{ fontFamily: "inherit", fontSize: "12px", lineHeight: 1.6 }}
                    value={formData.terms_clauses || ""}
                    onChange={(e) => setFormData({ ...formData, terms_clauses: e.target.value })}
                    placeholder="Digite ou edite as cláusulas deste contrato..."
                  />
                </div>
              </div>

              <div className="adm-modal-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <button type="button" className="adm-btn adm-btn-outline" onClick={() => setFormModalOpen(false)}>
                    Cancelar
                  </button>

                  {selectedContract && selectedContract.status !== "finalizado" && selectedContract.status !== "cancelado" && selectedContract.status !== "rascunho" && (
                    <button
                      type="button"
                      className="adm-btn adm-btn-outline"
                      style={{
                        background: "rgba(16, 185, 129, 0.1)",
                        color: "#059669",
                        borderColor: "#10b981",
                        fontWeight: 600,
                      }}
                      onClick={() => {
                        setFormModalOpen(false);
                        handleOpenFinalize(selectedContract);
                      }}
                      title="Finalizar venda e gerar chegadas e reservas operacionais"
                    >
                      <CheckCircle2 size={15} />
                      <span>Finalizar Venda</span>
                    </button>
                  )}
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    className="adm-btn adm-btn-outline"
                    disabled={saving}
                    onClick={(e) => handleSaveContract(e, "rascunho")}
                    title="Salva como Rascunho para você ir pré-cadastrando voos, datas e hotéis aos poucos durante o atendimento no WhatsApp"
                  >
                    {saving ? "Salvando..." : "📝 Salvar como Rascunho"}
                  </button>
                  <button
                    type="submit"
                    className="adm-btn adm-btn-clay"
                    disabled={saving}
                    onClick={() => {
                      if (!formData.status || formData.status === "rascunho") {
                        setFormData((prev) => ({ ...prev, status: "emitido" }));
                      }
                    }}
                  >
                    {saving ? "Salvando..." : selectedContract ? "Atualizar Contrato" : "Gerar Contrato Oficial"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL DE SELEÇÃO DO CATÁLOGO OFICIAL (52 PRODUTOS COMERCIAIS v0.1.43)
         ========================================================================= */}
      <CommercialProductSelectorModal
        open={catalogModalOpen}
        onClose={() => setCatalogModalOpen(false)}
        onSelectProduct={addOfficialProductItem}
        commercialProducts={commercialProducts}
        arrivalDate={formData.arrival_date}
        adultsCount={formData.adults_count}
        childrenCount={formData.children_count}
        hotelZone={formData.hotels_schedule?.[0]?.zone || null}
        canViewCosts={canViewCosts}
      />

      {/* =========================================================================
          MODAL DE ESCOLHA QUANDO O CLIENTE JÁ TEM CONTRATO(S) EXISTENTE(S)
         ========================================================================= */}
      {clientExistingModal.open && (
        <div className="adm-modal-backdrop" onClick={() => setClientExistingModal((prev) => ({ ...prev, open: false }))}>
          <div
            className="adm-modal-card"
            style={{ maxWidth: "580px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="adm-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--adm-gold-light)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--adm-wine)" }}>
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: "18px", color: "var(--adm-wine)" }}>Contratos Encontrados</h3>
                  <p style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                    Este cliente já possui contrato(s) no sistema
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="adm-btn adm-btn-icon adm-btn-outline"
                onClick={() => setClientExistingModal((prev) => ({ ...prev, open: false }))}
              >
                <X size={16} />
              </button>
            </div>

            <div className="adm-modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ background: "rgba(247, 241, 221, 0.4)", border: "1px solid var(--adm-gold-border)", borderRadius: "10px", padding: "14px 16px" }}>
                <p style={{ fontSize: "14px", color: "var(--adm-wine)", fontWeight: 600 }}>
                  Atenção: O cliente <u>{clientExistingModal.clientName}</u> já possui {clientExistingModal.existingContracts.length} contrato(s) registrado(s).
                </p>
                <p style={{ fontSize: "12px", color: "var(--adm-text-muted)", marginTop: "4px" }}>
                  Para evitar duplicidades acidentais, selecione abaixo se deseja <strong>editar o contrato existente</strong> ou <strong>emitir um novo contrato</strong> (para outra viagem/pacote futuro).
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <label className="adm-label" style={{ marginBottom: "2px" }}>Contratos Cadastrados deste Cliente:</label>
                {clientExistingModal.existingContracts.map((c: any) => (
                  <div
                    key={c.id}
                    style={{
                      border: "1px solid var(--adm-border)",
                      borderRadius: "10px",
                      padding: "12px 16px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "#fff",
                      gap: "12px"
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <strong style={{ fontSize: "15px", color: "var(--adm-wine)" }}>{c.contract_number}</strong>
                        <span className={`adm-badge ${c.status === "emitido" ? "badge-blue" : c.status === "assinado" ? "badge-green" : "badge-amber"}`} style={{ fontSize: "10px" }}>
                          {c.status}
                        </span>
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--adm-text-muted)", marginTop: "2px" }}>
                        Chegada: {c.arrival_date ? new Date(c.arrival_date + "T12:00:00").toLocaleDateString("pt-BR") : "—"} | Total: R$ {Number(c.total_amount || 0).toLocaleString("pt-BR")}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        type="button"
                        className="adm-btn adm-btn-outline adm-btn-sm"
                        onClick={() => {
                          setClientExistingModal((prev) => ({ ...prev, open: false }));
                          openPrintModal(c);
                        }}
                        title="Visualizar e Imprimir Contrato"
                      >
                        <Eye size={13} />
                        <span>Ver</span>
                      </button>

                      <button
                        type="button"
                        className="adm-btn adm-btn-primary adm-btn-sm"
                        onClick={() => {
                          setClientExistingModal((prev) => ({ ...prev, open: false }));
                          openEditModal(c);
                        }}
                        title="Editar Contrato Existente"
                      >
                        <Edit2 size={13} />
                        <span>Editar</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="adm-modal-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
              <button
                type="button"
                className="adm-btn adm-btn-outline"
                onClick={() => setClientExistingModal((prev) => ({ ...prev, open: false }))}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="adm-btn adm-btn-clay"
                onClick={() => {
                  setClientExistingModal((prev) => ({ ...prev, open: false }));
                  openNewTripForClient(clientExistingModal.clientId, clientExistingModal.clientName);
                }}
                title="Emitir um contrato adicional para este cliente mantendo os anteriores intactos"
              >
                <Plus size={15} />
                <span>+ Emitir Novo Contrato (Outra Viagem)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL DE VISUALIZAÇÃO / IMPRESSÃO (MODELO FIEL DE 3 PÁGINAS)
         ========================================================================= */}
      {printModalOpen && selectedContract && (
        <div className="adm-modal-backdrop" onClick={() => setPrintModalOpen(false)}>
          <div
            className="adm-modal-card"
            style={{ maxWidth: "860px", maxHeight: "95vh", overflowY: "auto", padding: "0", background: "#262e38" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Barra de Ações do Documento */}
            <div
              className="contract-toolbar"
              style={{
                position: "sticky",
                top: 0,
                zIndex: 20,
                background: "var(--adm-wine)",
                color: "#fff",
                padding: "12px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <FileText size={18} color="var(--adm-gold)" />
                <span style={{ fontWeight: 600 }}>Contrato {selectedContract.contract_number}</span>
                <span style={{ fontSize: "12px", opacity: 0.8 }}>({selectedContract.client_name})</span>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  className="adm-btn adm-btn-sm"
                  style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)" }}
                  onClick={() => {
                    const c = selectedContract;
                    setPrintModalOpen(false);
                    openEditModal(c);
                  }}
                  title="Editar valores, passeios ou texto do contrato"
                >
                  <Edit2 size={14} />
                  <span>Editar Contrato / Cláusulas</span>
                </button>
                <Link
                  href={`/admin/financeiro/clientes?contract_id=${selectedContract.id}`}
                  className="adm-btn adm-btn-sm"
                  style={{ background: "rgba(2, 132, 199, 0.4)", color: "#fff", border: "1px solid rgba(255,255,255,0.4)" }}
                  title="Ver Contas a Receber e Extrato Financeiro do Cliente"
                  onClick={() => setPrintModalOpen(false)}
                >
                  <DollarSign size={14} />
                  <span>Recebimentos</span>
                </Link>
                <Link
                  href={`/admin/vouchers?search=${selectedContract.contract_number}`}
                  className="adm-btn adm-btn-sm"
                  style={{ background: "rgba(217, 119, 6, 0.4)", color: "#fff", border: "1px solid rgba(255,255,255,0.4)" }}
                  title="Ver e Gerenciar Vouchers dos Passeios do Contrato"
                  onClick={() => setPrintModalOpen(false)}
                >
                  <Ticket size={14} />
                  <span>Vouchers</span>
                </Link>
                <Link
                  href={`/admin/ocorrencias?new=true&contractId=${selectedContract.id}&contractNumber=${selectedContract.contract_number}&clientName=${encodeURIComponent(selectedContract.client_name)}`}
                  className="adm-btn adm-btn-sm"
                  style={{ background: "rgba(220, 38, 38, 0.4)", color: "#fff", border: "1px solid rgba(255,255,255,0.4)" }}
                  title="Abrir Ocorrência Operacional para este Contrato"
                  onClick={() => setPrintModalOpen(false)}
                >
                  <ShieldAlert size={14} />
                  <span>Ocorrência</span>
                </Link>
                <Link
                  href={`/admin/tarefas?new=true&contractId=${selectedContract.id}&contractNumber=${selectedContract.contract_number}&clientName=${encodeURIComponent(selectedContract.client_name)}`}
                  className="adm-btn adm-btn-sm"
                  style={{ background: "rgba(37, 99, 235, 0.4)", color: "#fff", border: "1px solid rgba(255,255,255,0.4)" }}
                  title="Criar Tarefa Interna para este Contrato"
                  onClick={() => setPrintModalOpen(false)}
                >
                  <CheckSquare size={14} />
                  <span>Tarefa</span>
                </Link>
                <button
                  type="button"
                  className="adm-btn adm-btn-sm"
                  style={{ background: "#fff", color: "var(--adm-wine)" }}
                  onClick={() => window.print()}
                >
                  <Printer size={14} />
                  <span>Imprimir / Salvar PDF</span>
                </button>
                <button
                  type="button"
                  className="adm-btn adm-btn-icon adm-btn-sm"
                  style={{
                    background: "rgba(255, 255, 255, 0.2)",
                    border: "1px solid rgba(255, 255, 255, 0.4)",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    padding: 0
                  }}
                  onClick={() => setPrintModalOpen(false)}
                  title="Fechar visualização"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* DOCUMENTO DO CONTRATO (FORMATO A4 / MODELO TIO NENÊ) */}
            <div className="printable-contract" style={{ padding: "24px 20px" }}>
              {/* PÁGINA 1: DADOS, VOOS E HOTÉIS */}
              <div className="contract-page contract-page-1">
                {/* Header Página 1 */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <img
                      src="/img/tio-nene-03.svg"
                      alt="Tio Nenê"
                      style={{ height: "46px", width: "auto", display: "block" }}
                    />
                  </div>

                  <div style={{ textAlign: "right", fontSize: "12px", fontFamily: "sans-serif" }}>
                    <div>
                      <strong>DATA DE EMISSÃO:</strong> {new Date(selectedContract.created_at || new Date()).toLocaleDateString("pt-BR")}
                    </div>
                    <div style={{ color: "var(--adm-clay)", fontWeight: 700, marginTop: "2px" }}>
                      REFERÊNCIA: {selectedContract.contract_number}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: "11px", color: "#666", lineHeight: 1.4, marginBottom: "16px", borderBottom: "1px solid #ddd", paddingBottom: "8px" }}>
                  Calle Ocote, Lote 53, 10, SM 44, M3 - CEP 77506 - CANCÚN, Q.R. | contato@tionenetours.com.br
                </div>

                <div style={{ fontSize: "13.5px", lineHeight: 1.5, marginBottom: "18px" }}>
                  <p style={{ margin: "0 0 4px 0" }}><strong>Prezado cliente,</strong></p>
                  <p style={{ margin: 0 }}>
                    Nós da Equipe <strong>Tio Nenê Tours</strong>, RFC no. BCT140723D5A, confirmamos a contratação de nossos serviços durante sua estadia na cidade de Cancún - Quintana Roo.
                  </p>
                </div>

                {/* Tabela de Dados do Cliente e Voos */}
                <div style={{ background: "#fbfbfb", border: "1px solid #e5e5e5", borderRadius: "8px", padding: "14px 16px", marginBottom: "20px", fontSize: "12.5px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "8px", marginBottom: "8px" }}>
                    <div><strong>NOME:</strong> {selectedContract.client_name}</div>
                    <div><strong>CPF:</strong> {selectedContract.client_cpf || "Não informado"}</div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "8px", marginBottom: "8px" }}>
                    <div><strong>PAX:</strong> {selectedContract.adults_count} Adulto(s){selectedContract.children_count > 0 ? `, ${selectedContract.children_count} Criança(s)` : ""}{selectedContract.infants_count > 0 ? `, ${selectedContract.infants_count} Bebê(s)` : ""}</div>
                    <div><strong>CONTATO:</strong> {selectedContract.client_phone || "—"}</div>
                  </div>
                  <div style={{ marginBottom: "12px" }}>
                    <strong>EMAIL:</strong> {selectedContract.client_email || "—"}
                  </div>

                  <div style={{ borderTop: "1px dashed #ccc", paddingTop: "10px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <div><strong>NÚMERO DE VOO CHEGADA:</strong> {selectedContract.arrival_flight_number || "—"}</div>
                      <div><strong>HORÁRIO DE CHEGADA:</strong> {selectedContract.arrival_flight_time || "—"}</div>
                      <div><strong>DATA DE CHEGADA:</strong> {selectedContract.arrival_date ? new Date(selectedContract.arrival_date + "T12:00:00").toLocaleDateString("pt-BR") : "—"}</div>
                    </div>

                    <div>
                      <div><strong>NÚMERO DE VOO SAÍDA:</strong> {selectedContract.depart_flight_number || "—"}</div>
                      <div><strong>HORÁRIO DE SAÍDA:</strong> {selectedContract.depart_flight_time || "—"}</div>
                      <div><strong>DATA DE SAÍDA:</strong> {selectedContract.departure_date ? new Date(selectedContract.departure_date + "T12:00:00").toLocaleDateString("pt-BR") : "—"}</div>
                    </div>
                  </div>
                </div>

                {/* Resumo de Hotéis */}
                <div style={{ marginBottom: "20px" }}>
                  <div style={{ background: "#e8eff7", padding: "7px 12px", fontWeight: 700, fontSize: "12.5px", color: "#1e3a8a", border: "1px solid #cbd5e1" }}>
                    Resumo de hotéis durante a estadia:
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11.5px" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "1px solid #cbd5e1" }}>
                        <th style={{ padding: "7px 10px", textAlign: "left", border: "1px solid #cbd5e1" }}>Hotel</th>
                        <th style={{ padding: "7px 10px", textAlign: "left", border: "1px solid #cbd5e1", width: "130px" }}>Data Check In</th>
                        <th style={{ padding: "7px 10px", textAlign: "left", border: "1px solid #cbd5e1", width: "130px" }}>Data Check Out</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedContract.hotels_schedule || []).map((h, hIdx) => (
                        <tr key={hIdx}>
                          <td style={{ padding: "7px 10px", border: "1px solid #cbd5e1" }}>
                            <strong>{h.hotel_name || "—"}</strong>
                            {h.zone ? (
                              <span style={{ fontSize: "11px", color: "var(--adm-clay, #a55e40)", marginLeft: "6px" }}>
                                ({h.zone})
                              </span>
                            ) : null}
                            {h.is_manual ? (
                              <span style={{ fontSize: "10px", color: "var(--adm-amber, #b45309)", marginLeft: "6px", fontStyle: "italic" }}>
                                [Hospedagem Manual]
                              </span>
                            ) : null}
                          </td>
                          <td style={{ padding: "7px 10px", border: "1px solid #cbd5e1" }}>{h.checkin ? new Date(h.checkin + "T12:00:00").toLocaleDateString("pt-BR") : "—"}</td>
                          <td style={{ padding: "7px 10px", border: "1px solid #cbd5e1" }}>{h.checkout ? new Date(h.checkout + "T12:00:00").toLocaleDateString("pt-BR") : "—"}</td>
                        </tr>
                      ))}
                      {(!selectedContract.hotels_schedule || selectedContract.hotels_schedule.length === 0) && (
                        <tr>
                          <td colSpan={3} style={{ padding: "7px 10px", border: "1px solid #cbd5e1", textAlign: "center", color: "#888" }}>
                            Nenhum hotel informado
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Rodapé Padrão de Assinatura */}
                <div className="contract-footer">
                  <div>Assinado com Assinatura Eletrônica (Lei 14.063/2020 | Regulamento 910/2014/EC)</div>
                  <div style={{ fontSize: "10px", color: "#888" }}>Hash SHA256 do original: aab79c30f572f8ad9d12af29e51268f5bb3060321ddf3bea26bf37e0525af73f</div>
                  <div style={{ fontSize: "10px", color: "var(--adm-clay)" }}>https://valida.as/tionene-{selectedContract.contract_number.toLowerCase()}</div>
                </div>
              </div>

              {/* PÁGINA 2: SERVIÇOS & PAGAMENTOS */}
              <div className="contract-page contract-page-2" style={{ marginTop: "30px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", borderBottom: "1px solid #ddd", paddingBottom: "8px" }}>
                  <img src="/img/tio-nene-03.svg" alt="Tio Nenê" style={{ height: "36px", width: "auto" }} />
                  <span style={{ fontSize: "12px", color: "#666" }}>Ref: {selectedContract.contract_number} · Página 2</span>
                </div>

                {/* Serviços Contratados */}
                <div style={{ marginBottom: "18px" }}>
                  <div style={{ background: "#fffbeb", padding: "7px 12px", fontWeight: 700, fontSize: "12.5px", color: "#92400e", border: "1px solid #fef3c7" }}>
                    Os serviços contratados são:
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }}>
                    {(selectedContract.items || []).map((it, idx) => (
                      <div key={idx} className="contract-tour-item" style={{ padding: "8px 12px", border: "1px solid #e5e5e5", borderRadius: "6px", fontSize: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", marginBottom: "3px" }}>
                          <strong style={{ color: "#111" }}>
                            Data: {it.tour_date ? new Date(it.tour_date + "T12:00:00").toLocaleDateString("pt-BR") : "—"} — {it.tour_name}
                          </strong>
                          <span style={{ fontWeight: 700, color: "var(--adm-wine)", whiteSpace: "nowrap" }}>
                            R$ {Number(it.sale_price || 0).toLocaleString("pt-BR")}
                          </span>
                        </div>
                        {it.included && (
                          <div className="tour-includes" style={{ fontSize: "11px", color: "#166534", marginTop: "2px", lineHeight: 1.35 }}>
                            <strong>Inclui:</strong> {it.included}
                          </div>
                        )}
                        {it.not_included && (
                          <div className="tour-not-includes" style={{ fontSize: "11px", color: "#991b1b", marginTop: "2px", lineHeight: 1.35 }}>
                            <strong>Não inclui:</strong> {it.not_included}
                          </div>
                        )}
                      </div>
                    ))}
                    {(!selectedContract.items || selectedContract.items.length === 0) && (
                      <div style={{ padding: "12px", textAlign: "center", color: "#888", fontStyle: "italic", fontSize: "12px" }}>
                        Nenhum passeio contratado neste documento.
                      </div>
                    )}
                  </div>
                </div>

                {/* Remuneração & Pagamento */}
                <div style={{ marginBottom: "20px" }}>
                  <div style={{ background: "#dcfce7", padding: "7px 12px", fontWeight: 700, fontSize: "12.5px", color: "#166534", border: "1px solid #bbf7d0" }}>
                    Os serviços serão remunerados da seguinte maneira:
                  </div>

                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", marginTop: "8px" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc" }}>
                        <th style={{ padding: "8px 10px", textAlign: "left", border: "1px solid #cbd5e1", width: "180px" }}>Forma de pagamento</th>
                        <th style={{ padding: "8px 10px", textAlign: "left", border: "1px solid #cbd5e1", width: "140px" }}>Valor</th>
                        <th style={{ padding: "8px 10px", textAlign: "left", border: "1px solid #cbd5e1" }}>Observação</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: "8px 10px", border: "1px solid #cbd5e1", fontWeight: 600 }}>Depósito</td>
                        <td style={{ padding: "8px 10px", border: "1px solid #cbd5e1", fontWeight: 700 }}>
                          R$ {Number(selectedContract.deposit_amount || 0).toLocaleString("pt-BR")}
                        </td>
                        <td style={{ padding: "8px 10px", border: "1px solid #cbd5e1" }}>{selectedContract.deposit_observation || "—"}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: "8px 10px", border: "1px solid #cbd5e1", fontWeight: 600 }}>Saldo</td>
                        <td style={{ padding: "8px 10px", border: "1px solid #cbd5e1", fontWeight: 700, color: "var(--adm-amber)" }}>
                          R$ {Number(selectedContract.balance_amount || 0).toLocaleString("pt-BR")}
                        </td>
                        <td style={{ padding: "8px 10px", border: "1px solid #cbd5e1" }}>{selectedContract.balance_observation || "—"}</td>
                      </tr>
                      <tr style={{ background: "#fef9c3" }}>
                        <td style={{ padding: "8px 10px", border: "1px solid #cbd5e1", fontWeight: 700, color: "var(--adm-wine)" }}>Total do Contrato</td>
                        <td style={{ padding: "8px 10px", border: "1px solid #cbd5e1", fontWeight: 800, fontSize: "13.5px", color: "var(--adm-wine)" }}>
                          R$ {Number(selectedContract.total_amount || 0).toLocaleString("pt-BR")}
                        </td>
                        <td style={{ padding: "8px 10px", border: "1px solid #cbd5e1", fontSize: "11px", color: "#555" }}>Valor total da contratação</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="contract-footer">
                  <div>Assinado com Assinatura Eletrônica (Lei 14.063/2020 | Regulamento 910/2014/EC)</div>
                  <div style={{ fontSize: "10px", color: "#888" }}>Hash SHA256 do original: aab79c30f572f8ad9d12af29e51268f5bb3060321ddf3bea26bf37e0525af73f</div>
                  <div style={{ fontSize: "10px", color: "var(--adm-clay)" }}>https://valida.as/tionene-{selectedContract.contract_number.toLowerCase()}</div>
                </div>
              </div>

              {/* PÁGINA 3: TERMOS E CLÁUSULAS */}
              <div className="contract-page contract-page-3" style={{ marginTop: "30px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", borderBottom: "1px solid #ddd", paddingBottom: "8px" }}>
                  <img src="/img/tio-nene-03.svg" alt="Tio Nenê" style={{ height: "36px", width: "auto" }} />
                  <span style={{ fontSize: "12px", color: "#666" }}>Ref: {selectedContract.contract_number} · Página 3</span>
                </div>

                <div style={{ textAlign: "center", fontWeight: 800, fontSize: "13.5px", color: "var(--adm-wine)", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  TERMOS DE CONTRATO
                </div>

                <div className="contract-clauses-body">
                  {(() => {
                    const rawText = (selectedContract.terms_clauses || DEFAULT_TERMS)
                      .replace(/\u00A0/g, " ")
                      .replace(/\r\n/g, "\n");
                    const normalized = rawText.replace(/([^\n])\s*(Cláusula\s+\d+ª)/gi, "$1\n\n$2");
                    return normalized.split(/\n+/).map((paragraph, pIdx) => {
                      const trimmed = paragraph.trim();
                      if (!trimmed) return null;
                      if (trimmed.toUpperCase() === "TERMOS DE CONTRATO") return null;

                      const isClause = /^Cláusula\s+\d+ª/i.test(trimmed);
                      if (isClause) {
                        const clauseMatch = trimmed.match(/^(Cláusula\s+\d+ª(?:\.|\s*[-–:]\s*)?)/i);
                        const prefix = clauseMatch ? clauseMatch[1] : "";
                        const rest = clauseMatch ? trimmed.substring(clauseMatch[0].length).trim() : trimmed;
                        return (
                          <p
                            key={pIdx}
                            className="contract-clause-p"
                          >
                            <strong style={{ color: "var(--adm-wine)", fontWeight: 700 }}>
                              {prefix}{" "}
                            </strong>
                            <span>{rest.trim()}</span>
                          </p>
                        );
                      }

                      return (
                        <p
                          key={pIdx}
                          className="contract-intro-p"
                        >
                          {trimmed}
                        </p>
                      );
                    });
                  })()}
                </div>

                <div className="contract-footer">
                  <div>Assinado com Assinatura Eletrônica (Lei 14.063/2020 | Regulamento 910/2014/EC)</div>
                  <div style={{ fontSize: "10px", color: "#888" }}>Hash SHA256 do original: aab79c30f572f8ad9d12af29e51268f5bb3060321ddf3bea26bf37e0525af73f</div>
                  <div style={{ fontSize: "10px", color: "var(--adm-clay)" }}>https://valida.as/tionene-{selectedContract.contract_number.toLowerCase()}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL DE CONFIRMAÇÃO DE FINALIZAÇÃO DE VENDA (GERAÇÃO DE RESERVAS)
         ========================================================================= */}
      {finalizeModal.open && finalizeModal.contract && (
        <div className="adm-modal-backdrop adm-no-print" onClick={() => !finalizeModal.processing && setFinalizeModal((prev) => ({ ...prev, open: false }))}>
          <div
            className="adm-modal-card"
            style={{ maxWidth: "620px", maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="adm-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "50%",
                    background: "#dcfce7",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#15803d",
                  }}
                >
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: "18px", color: "var(--adm-wine)" }}>
                    Finalizar Venda — {finalizeModal.contract.contract_number}
                  </h3>
                  <p style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                    Cliente: <strong>{finalizeModal.contract.client_name}</strong>
                  </p>
                </div>
              </div>
              {!finalizeModal.processing && (
                <button
                  type="button"
                  className="adm-btn adm-btn-icon adm-btn-outline"
                  onClick={() => setFinalizeModal((prev) => ({ ...prev, open: false }))}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="adm-modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "14px 16px" }}>
                <div style={{ fontWeight: 600, color: "#166534", fontSize: "14px", marginBottom: "4px" }}>
                  Ações que serão executadas automaticamente:
                </div>
                <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13px", color: "#15803d", lineHeight: 1.6 }}>
                  <li>O status do contrato passa para <strong>VENDA FINALIZADA</strong>.</li>
                  <li>Criação de <strong>1 registro de chegada/atendimento</strong> em Cancún (logística de aeroporto e hotel).</li>
                  <li>
                    Geração de <strong>{(finalizeModal.contract.items || []).length} reserva(s) operacional(is)</strong> para emissão de vouchers e controle de execução com fornecedores.
                  </li>
                  <li>
                    Lançamento de <strong>{(finalizeModal.contract.items || []).length} obrigação(ões) financeira(s) a pagar</strong> para fornecedores em moedas originais (USD / MXN).
                  </li>
                </ul>
              </div>

              {/* Resumo dos Itens do Contrato */}
              <div>
                <label className="adm-label" style={{ marginBottom: "6px" }}>
                  Serviços e Passeios Contratados ({(finalizeModal.contract.items || []).length}):
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "200px", overflowY: "auto", border: "1px solid var(--adm-border)", borderRadius: "8px", padding: "8px" }}>
                  {(finalizeModal.contract.items || []).length === 0 ? (
                    <div style={{ padding: "12px", textAlign: "center", color: "var(--adm-text-muted)", fontSize: "12px" }}>
                      Nenhum item contratado.
                    </div>
                  ) : (
                    finalizeModal.contract.items?.map((it, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "8px 10px",
                          background: "var(--adm-surface-alt)",
                          borderRadius: "6px",
                          fontSize: "12px",
                        }}
                      >
                        <div>
                          <strong>{it.tour_name}</strong>
                          <div style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>
                            Data: {it.tour_date ? new Date(it.tour_date + "T12:00:00").toLocaleDateString("pt-BR") : "A definir"} | {it.adults_count} ad{it.children_count > 0 ? `, ${it.children_count} ch` : ""}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span className="adm-badge badge-blue" style={{ fontSize: "10px" }}>
                            {it.supplier_name || "Operadora"}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div style={{ fontSize: "12px", color: "var(--adm-text-muted)", background: "var(--adm-surface-alt)", padding: "10px 12px", borderRadius: "8px" }}>
                <Info size={14} style={{ display: "inline", verticalAlign: "-2px", marginRight: "4px" }} />
                <strong>Operação atômica e idempotente:</strong> Se a venda for finalizada novamente, os registros existentes serão sincronizados sem duplicação de reservas ou contas a pagar.
              </div>
            </div>

            <div className="adm-modal-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button
                type="button"
                className="adm-btn adm-btn-outline"
                disabled={finalizeModal.processing}
                onClick={() => setFinalizeModal((prev) => ({ ...prev, open: false }))}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="adm-btn adm-btn-clay"
                style={{ background: "#059669", borderColor: "#059669", color: "#fff", fontWeight: 600 }}
                disabled={finalizeModal.processing}
                onClick={handleConfirmFinalize}
              >
                {finalizeModal.processing ? (
                  <>
                    <Clock size={15} className="animate-spin" />
                    <span>Finalizando Venda...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Confirmar e Finalizar Venda</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ESTILOS DE IMPRESSÃO */}
      <style jsx global>{`
        .contract-page {
          background: #ffffff;
          padding: 36px 40px;
          border-radius: 8px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
          max-width: 800px;
          margin: 0 auto;
          color: #222;
          font-family: 'Alegreya Sans', sans-serif;
          position: relative;
          box-sizing: border-box;
        }

        .contract-footer {
          margin-top: 24px;
          border-top: 1px solid #e5e5e5;
          padding-top: 8px;
          font-size: 10.5px;
          color: #777;
          line-height: 1.4;
        }

        .contract-clauses-body {
          column-count: 2;
          column-gap: 22px;
          text-align: justify;
          margin-bottom: 16px;
        }

        .contract-intro-p {
          column-span: all;
          margin: 0 0 10px 0;
          text-align: justify;
          font-style: italic;
          font-size: 11px;
          line-height: 1.45;
          color: #444;
        }

        .contract-clause-p {
          margin: 0 0 6px 0;
          text-align: justify;
          word-break: break-word;
          overflow-wrap: break-word;
          white-space: normal;
          line-height: 1.4;
          font-size: 10px;
          break-inside: avoid;
          page-break-inside: avoid;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }

          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Ocultar toda a estrutura do admin, dashboard, KPIs, tabelas e barras de controle */
          .admin-sidebar,
          .admin-topbar,
          .admin-dashboard-content,
          .adm-no-print,
          .adm-kpi-grid,
          .adm-kpi-card,
          .adm-table-wrap,
          .adm-table,
          .adm-card,
          .adm-header,
          .adm-filters,
          .adm-modal-header,
          .adm-modal-footer,
          .contract-toolbar,
          header,
          nav,
          aside,
          button {
            display: none !important;
            visibility: hidden !important;
          }

          /* Resetar containers do layout para não aplicarem margem lateral nem offset */
          .admin-scope {
            display: block !important;
            min-height: auto !important;
            height: auto !important;
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }

          .admin-main {
            display: block !important;
            margin: 0 !important;
            margin-left: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: auto !important;
            height: auto !important;
            background: #ffffff !important;
          }

          .admin-content-area {
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }

          /* O modal se torna parte do fluxo normal da folha */
          .adm-modal-backdrop {
            position: static !important;
            inset: auto !important;
            display: block !important;
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            backdrop-filter: none !important;
            z-index: auto !important;
          }

          .adm-modal-card {
            position: static !important;
            display: block !important;
            max-width: 100% !important;
            width: 100% !important;
            height: auto !important;
            min-height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          .printable-contract {
            display: block !important;
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
          }

          /* Enquadramento exato por página */
          .contract-page {
            display: flex !important;
            flex-direction: column !important;
            justify-content: flex-start !important;
            box-sizing: border-box !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            margin-top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: 260mm !important;
            background: #ffffff !important;
            color: #111111 !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            position: relative !important;
          }

          .contract-page:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
            min-height: auto !important;
          }

          .contract-footer {
            margin-top: auto !important;
            padding-top: 2.5mm !important;
            border-top: 1px solid #ddd !important;
            font-size: 7.2pt !important;
            line-height: 1.3 !important;
            color: #777 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /* Ajuste dos itens de passeios */
          .contract-tour-item {
            padding: 5px 8px !important;
            margin-bottom: 1.8mm !important;
            font-size: 8pt !important;
            line-height: 1.3 !important;
          }

          .contract-tour-item .tour-includes,
          .contract-tour-item .tour-not-includes {
            font-size: 7.2pt !important;
            line-height: 1.25 !important;
          }

          /* Ajuste das Cláusulas: 2 colunas para caber na folha sem cortes */
          .contract-clauses-body {
            column-count: 2 !important;
            column-gap: 5mm !important;
            text-align: justify !important;
            margin-bottom: 2mm !important;
          }

          .contract-intro-p {
            column-span: all !important;
            margin: 0 0 2mm 0 !important;
            font-size: 7.2pt !important;
            line-height: 1.3 !important;
            font-style: italic !important;
            text-align: justify !important;
          }

          .contract-clause-p {
            margin: 0 0 1.6mm 0 !important;
            font-size: 7.2pt !important;
            line-height: 1.32 !important;
            text-align: justify !important;
            word-break: break-word !important;
            overflow-wrap: break-word !important;
            white-space: normal !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </>
  );
}

export default function AdminContractsPage() {
  return (
    <Suspense
      fallback={
        <div className="adm-page" style={{ padding: "40px", textAlign: "center" }}>
          <div className="adm-card" style={{ maxWidth: "400px", margin: "40px auto", padding: "30px" }}>
            <h3 style={{ color: "var(--adm-wine)", marginBottom: "8px" }}>Carregando Contratos...</h3>
            <p style={{ color: "var(--adm-text-muted)", fontSize: "14px" }}>Aguarde um instante.</p>
          </div>
        </div>
      }
    >
      <ContractsContent />
    </Suspense>
  );
}
