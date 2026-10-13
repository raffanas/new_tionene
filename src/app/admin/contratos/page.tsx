"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { TOURS as DEFAULT_TOURS } from "@/data/tours";
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
  ShieldCheck
} from "lucide-react";

interface HotelSchedule {
  hotel_name: string;
  checkin: string;
  checkout: string;
}

interface ContractItem {
  id?: string;
  tour_id?: string;
  tour_name: string;
  tour_date: string;
  adults_count: number;
  children_count: number;
  sale_price: number;
  cost_applied: number;
  calculated_total_cost: number;
  supplier_id?: string;
  supplier_name?: string;
  voucher_ref?: string;
  included?: string;
  not_included?: string;
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
  status: "rascunho" | "emitido" | "assinado" | "cancelado";
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

function ContractsContent() {
  const searchParams = useSearchParams();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Suppliers, Tours & Clientes para seleção
  const [availableSuppliers, setAvailableSuppliers] = useState<any[]>([]);
  const [availableTours, setAvailableTours] = useState<any[]>([]);
  const [availableClients, setAvailableClients] = useState<any[]>([]);

  // Modais
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
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
    hotels_schedule: [{ hotel_name: "Hotel Riu Cancún", checkin: "", checkout: "" }],
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
            items: (c.contract_items || []).map((i: any) => ({
              id: i.id,
              tour_id: i.tour_id,
              tour_name: i.tour_name_snapshot,
              tour_date: i.tour_date,
              adults_count: i.adults_count,
              children_count: i.children_count,
              sale_price: Number(i.sale_price || 0),
              cost_applied: Number(i.cost_applied || 0),
              calculated_total_cost: Number(i.calculated_total_cost || 0),
              supplier_id: i.supplier_id,
              supplier_name: i.supplier_name_snapshot,
              voucher_ref: i.voucher_ref,
              included: i.tour_included_snapshot,
              not_included: i.tour_not_included_snapshot,
            })),
          }))
        );
      }

      // 2. Fornecedores
      const { data: suppData } = await supabase.from("suppliers").select("id, name, currency_default");
      if (suppData) setAvailableSuppliers(suppData);

      // 3. Passeios
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

      // 4. Clientes para autocompletar
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
        const cost = Math.round(sale * 0.65);

        mappedItems.push({
          tour_id: match?.slug || it.id || undefined,
          tour_name: it.name || match?.name || "Passeio",
          tour_date: itemDate,
          adults_count: parsed.adults_count ?? 2,
          children_count: parsed.children_count ?? 0,
          sale_price: sale,
          cost_applied: cost,
          calculated_total_cost: cost,
          supplier_id: availableSuppliers[0]?.id || null,
          supplier_name: availableSuppliers[0]?.name || "Operadora Local",
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
      const cost = Math.round(sale * 0.65);

      mappedItems.push({
        tour_id: match?.slug || undefined,
        tour_name: associatedLead.interest_name,
        tour_date: itemDate,
        adults_count: parsed.adults_count ?? 2,
        children_count: parsed.children_count ?? 0,
        sale_price: sale,
        cost_applied: cost,
        calculated_total_cost: cost,
        supplier_id: availableSuppliers[0]?.id || null,
        supplier_name: availableSuppliers[0]?.name || "Operadora Local",
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
                items: (data.contract_items || []).map((i: any) => ({
                  id: i.id,
                  tour_id: i.tour_id,
                  tour_name: i.tour_name_snapshot,
                  tour_date: i.tour_date,
                  adults_count: i.adults_count,
                  children_count: i.children_count,
                  sale_price: Number(i.sale_price || 0),
                  cost_applied: Number(i.cost_applied || 0),
                  calculated_total_cost: Number(i.calculated_total_cost || 0),
                  supplier_id: i.supplier_id,
                  supplier_name: i.supplier_name_snapshot,
                  voucher_ref: i.voucher_ref,
                  included: i.tour_included_snapshot,
                  not_included: i.tour_not_included_snapshot,
                })),
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
                items: (c.contract_items || []).map((i: any) => ({
                  id: i.id,
                  tour_id: i.tour_id,
                  tour_name: i.tour_name_snapshot,
                  tour_date: i.tour_date,
                  adults_count: i.adults_count,
                  children_count: i.children_count,
                  sale_price: Number(i.sale_price || 0),
                  cost_applied: Number(i.cost_applied || 0),
                  calculated_total_cost: Number(i.calculated_total_cost || 0),
                  supplier_id: i.supplier_id,
                  supplier_name: i.supplier_name_snapshot,
                  voucher_ref: i.voucher_ref,
                  included: i.tour_included_snapshot,
                  not_included: i.tour_not_included_snapshot,
                })),
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

  // Adicionar Passeio no Contrato
  const addTourItem = (tourSlugOrId: string) => {
    const t = availableTours.find((x) => x.id === tourSlugOrId || x.slug === tourSlugOrId);
    if (!t) return;

    const adults = Number(formData.adults_count || 1);
    const children = Number(formData.children_count || 0);
    const unitPrice = Number(t.price || 0);
    const salePrice = unitPrice * adults + unitPrice * children * 0.8;

    const newItem: ContractItem = {
      tour_id: t.id,
      tour_name: t.name,
      tour_date: formData.arrival_date || new Date().toISOString().split("T")[0],
      adults_count: adults,
      children_count: children,
      sale_price: salePrice,
      cost_applied: Math.round(salePrice * 0.65), // Custo padrão estimado caso não haja tabela
      calculated_total_cost: Math.round(salePrice * 0.65),
      supplier_id: availableSuppliers[0]?.id || null,
      supplier_name: availableSuppliers[0]?.name || "Operadora Local",
      voucher_ref: "",
      included: Array.isArray(t.included) ? t.included.join(", ") : t.included || "",
      not_included: Array.isArray(t.not_included) ? t.not_included.join(", ") : t.not_included || "",
    };

    const updatedItems = [...formItems, newItem];
    setFormItems(updatedItems);
    recalcTotal(updatedItems);
  };

  const removeTourItem = (idx: number) => {
    const list = [...formItems];
    list.splice(idx, 1);
    setFormItems(list);
    recalcTotal(list);
  };

  const updateTourItem = (idx: number, field: keyof ContractItem, val: any) => {
    const list = [...formItems];
    list[idx] = { ...list[idx], [field]: val };

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

      if (contractId) {
        // Atualizar contrato existente
        const { error: updErr } = await supabase
          .from("contracts")
          .update({
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
            updated_at: new Date().toISOString(),
          })
          .eq("id", contractId);

        if (updErr) throw updErr;

        // Limpar itens antigos e recriar
        await supabase.from("contract_items").delete().eq("contract_id", contractId);
      } else {
        // Criar novo contrato
        const { data: newContract, error: insErr } = await supabase
          .from("contracts")
          .insert([
            {
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
            },
          ])
          .select()
          .single();

        if (insErr) throw insErr;
        contractId = newContract.id;
      }

      // Salvar Itens de Passeios (Snapshots)
      if (contractId && formItems.length > 0) {
        const itemsToInsert = formItems.map((item) => ({
          contract_id: contractId,
          tour_id: item.tour_id?.length === 36 ? item.tour_id : null,
          supplier_id: item.supplier_id || null,
          tour_date: item.tour_date || formData.arrival_date,
          tour_name_snapshot: item.tour_name,
          tour_included_snapshot: item.included || null,
          tour_not_included_snapshot: item.not_included || null,
          supplier_name_snapshot: item.supplier_name || null,
          adults_count: item.adults_count || formData.adults_count || 1,
          children_count: item.children_count || formData.children_count || 0,
          sale_price: item.sale_price || 0,
          cost_applied: item.cost_applied || 0,
          calculated_total_cost: item.calculated_total_cost || item.cost_applied || 0,
          cost_status: "calculado",
          voucher_ref: item.voucher_ref || null,
          status: "agendado",
        }));

        const { error: itemsErr } = await supabase.from("contract_items").insert(itemsToInsert);
        if (itemsErr) console.error("Erro ao salvar itens:", itemsErr);
      }

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
                        c.status === "assinado" ? "badge-green" : c.status === "emitido" ? "badge-blue" : "badge-amber"
                      }`}
                      style={{ fontSize: "11px" }}
                    >
                      {c.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
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

                      <button
                        type="button"
                        className="adm-btn adm-btn-outline adm-btn-sm"
                        onClick={() => openEditModal(c)}
                        title="Editar Contrato"
                      >
                        <Edit2 size={13} />
                      </button>

                      <button
                        type="button"
                        className="adm-btn adm-btn-outline adm-btn-sm"
                        style={{ color: "var(--adm-rose)" }}
                        onClick={() => handleDelete(c.id, c.contract_number)}
                        title="Excluir"
                      >
                        <Trash2 size={13} />
                      </button>
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

                {/* 3. RESUMO DE HOTÉIS */}
                <div style={{ borderTop: "1px solid var(--adm-border)", paddingTop: "18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <h4 style={{ fontSize: "15px", color: "var(--adm-wine)", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Building size={16} color="var(--adm-clay)" />
                      <span>3. Resumo de Hotéis Durante a Estadia</span>
                    </h4>
                    <button type="button" className="adm-btn adm-btn-outline adm-btn-sm" onClick={addHotelRow}>
                      <Plus size={13} />
                      <span>Adicionar Hotel</span>
                    </button>
                  </div>

                  {(formData.hotels_schedule || []).map((h, hIdx) => (
                    <div key={hIdx} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
                      <input
                        type="text"
                        className="adm-input"
                        placeholder="Nome do Hotel / Resort"
                        value={h.hotel_name}
                        onChange={(e) => {
                          const list = [...(formData.hotels_schedule || [])];
                          list[hIdx].hotel_name = e.target.value;
                          setFormData({ ...formData, hotels_schedule: list });
                        }}
                      />
                      <input
                        type="date"
                        className="adm-input"
                        title="Check-in"
                        value={h.checkin}
                        onChange={(e) => {
                          const list = [...(formData.hotels_schedule || [])];
                          list[hIdx].checkin = e.target.value;
                          setFormData({ ...formData, hotels_schedule: list });
                        }}
                      />
                      <input
                        type="date"
                        className="adm-input"
                        title="Check-out"
                        value={h.checkout}
                        onChange={(e) => {
                          const list = [...(formData.hotels_schedule || [])];
                          list[hIdx].checkout = e.target.value;
                          setFormData({ ...formData, hotels_schedule: list });
                        }}
                      />
                      <button
                        type="button"
                        className="adm-btn adm-btn-icon adm-btn-outline adm-btn-sm"
                        style={{ color: "var(--adm-rose)" }}
                        onClick={() => removeHotelRow(hIdx)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* 4. PASSEIOS CONTRATADOS */}
                <div style={{ borderTop: "1px solid var(--adm-border)", paddingTop: "18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <div>
                      <h4 style={{ fontSize: "15px", color: "var(--adm-wine)", display: "flex", alignItems: "center", gap: "6px" }}>
                        <CheckCircle2 size={16} color="var(--adm-clay)" />
                        <span>4. Passeios e Serviços Contratados</span>
                      </h4>
                      <p style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                        Selecione passeios do catálogo. Os custos de fornecedor são calculados automaticamente.
                      </p>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
                        <option value="">+ Selecionar Passeio do Catálogo...</option>
                        {availableTours.map((t) => (
                          <option key={t.id} value={t.slug || t.id}>
                            {t.name} (R$ {t.price})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {formItems.length === 0 ? (
                    <div style={{ padding: "20px", background: "var(--adm-surface-alt)", borderRadius: "10px", textAlign: "center", border: "1px dashed var(--adm-border)" }}>
                      <span style={{ fontSize: "13px", color: "var(--adm-text-muted)" }}>Nenhum passeio adicionado. Selecione no menu acima.</span>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {formItems.map((item, itIdx) => (
                        <div
                          key={itIdx}
                          style={{
                            padding: "12px 14px",
                            background: "var(--adm-surface-alt)",
                            borderRadius: "10px",
                            border: "1px solid var(--adm-border)",
                            display: "grid",
                            gridTemplateColumns: "130px 1fr 140px 140px 100px auto",
                            gap: "8px",
                            alignItems: "center"
                          }}
                        >
                          <div>
                            <label style={{ fontSize: "10px", textTransform: "uppercase", color: "var(--adm-text-muted)" }}>Data do Passeio</label>
                            <input
                              type="date"
                              className="adm-input"
                              value={item.tour_date}
                              onChange={(e) => updateTourItem(itIdx, "tour_date", e.target.value)}
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: "10px", textTransform: "uppercase", color: "var(--adm-text-muted)" }}>Passeio</label>
                            <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--adm-wine)" }}>{item.tour_name}</div>
                            <input
                              type="text"
                              className="adm-input"
                              style={{ fontSize: "11px", height: "26px", marginTop: "2px" }}
                              placeholder="Inclusões resumidas..."
                              value={item.included || ""}
                              onChange={(e) => updateTourItem(itIdx, "included", e.target.value)}
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: "10px", textTransform: "uppercase", color: "var(--adm-text-muted)" }}>Fornecedor</label>
                            <select
                              className="adm-select"
                              style={{ fontSize: "12px", height: "34px" }}
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

                          <div>
                            <label style={{ fontSize: "10px", textTransform: "uppercase", color: "var(--adm-text-muted)" }}>Preço Venda (Total)</label>
                            <input
                              type="number"
                              className="adm-input"
                              value={item.sale_price}
                              onChange={(e) => updateTourItem(itIdx, "sale_price", Number(e.target.value))}
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: "10px", textTransform: "uppercase", color: "var(--adm-text-muted)" }}>Custo Fornec.</label>
                            <input
                              type="number"
                              className="adm-input"
                              value={item.cost_applied}
                              onChange={(e) => updateTourItem(itIdx, "cost_applied", Number(e.target.value))}
                            />
                          </div>

                          <button
                            type="button"
                            className="adm-btn adm-btn-icon adm-btn-outline adm-btn-sm"
                            style={{ color: "var(--adm-rose)" }}
                            onClick={() => removeTourItem(itIdx)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
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
                <button type="button" className="adm-btn adm-btn-outline" onClick={() => setFormModalOpen(false)}>
                  Cancelar
                </button>
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
                          <td style={{ padding: "7px 10px", border: "1px solid #cbd5e1" }}>{h.hotel_name || "—"}</td>
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
