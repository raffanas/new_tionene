/**
 * GESTÃO DE VOUCHERS E DOCUMENTOS OPERACIONAIS — TÍO NENÊ v0.1.43
 * Arquivo: src/lib/operational/voucherOperations.ts
 *
 * Módulo para preparação, validação, ciclo de vida e entrega de vouchers
 * aos clientes da Tío Nenê Viagens.
 *
 * REGRAS CRÍTICAS DE NEGÓCIO E SEGURANÇA (TAREFA 24):
 * 1. INDEPENDÊNCIA ENTRE VOUCHER E FORNECEDOR:
 *    O voucher é o documento entregue ao turista. A confirmação do fornecedor
 *    é um registro operacional à parte. O voucher pode ser preparado mesmo se a
 *    reserva ainda estiver pendente de confirmação com fornecedor.
 * 2. CONFIDENCIALIDADE FINANCEIRA:
 *    NENHUM dado de custo de fornecedor, valor de venda, saldo, margem ou comissão
 *    deve constar no voucher ou na mensagem de envio ao cliente.
 * 3. ENTREGA EXPLÍCITA:
 *    Abrir o WhatsApp não marca o voucher como entregue. Exige confirmação explícita
 *    do operador para registrar a entrega e o timestamp.
 * 4. INTEGRIDADE DOS DADOS CONTRATUAIS:
 *    A edição operacional do voucher afeta exclusivamente as orientações logísticas
 *    de embarque, código do voucher e notas. Não altera o contrato original nem PDFs históricos.
 * 5. DADOS AUSENTES:
 *    Informações não confirmadas aparecem como "A confirmar" ou "Não informado", sem inventar dados.
 */

import { OperationalReservationStatus } from "@/types/operational";

export type VoucherOperationalStatus =
  | "pendente"        // Pendente de preparação: sem código ou orientações
  | "em_preparacao"   // Em preparação: operador iniciou ajustes mas ainda não finalizou
  | "pronto"          // Pronto: código de voucher e orientações prontas para entrega
  | "entregue"        // Entregue: entregue formalmente ao cliente (WhatsApp / impresso)
  | "cancelado";      // Cancelado: passeio ou contrato cancelado

export interface VoucherDisplayItem {
  id: string; // ID da reserva operacional
  contract_id: string;
  contract_number: string;
  contract_status: string;
  contract_item_id: string;

  // Cliente
  client_id?: string | null;
  client_name: string;
  client_phone?: string | null;
  client_email?: string | null;
  client_cpf?: string | null;

  // Passeio / Serviço
  product_name: string;
  tour_id_code?: string | null;
  tour_date: string;
  supplier_id?: string | null;
  supplier_name?: string | null;
  supplier_confirmation_code?: string | null; // Código da operadora
  reservation_status: OperationalReservationStatus;

  // Logística de Embarque / Encontro
  hotel_name?: string | null;
  hotel_zone?: string | null;
  pickup_location?: string | null;
  pickup_time?: string | null;

  // Passageiros
  adults_count: number;
  children_count: number;
  infants_count: number;
  total_pax: number;

  // Voucher Operacional
  voucher_ref?: string | null; // Código do voucher para o cliente (ex: VCH-TN-2026-0042-01)
  voucher_status: VoucherOperationalStatus;
  special_instructions?: string | null; // Instruções ao cliente / o que levar / regras
  notes?: string | null; // Observações operacionais internas

  // Entrega
  delivered_at?: string | null;
  delivered_to?: string | null;
  delivered_by?: string | null;
  delivery_channel?: string | null;

  // Pendências e Histórico
  pendencies: string[];
  history: any[];
  created_at: string;
  updated_at: string;
}

export interface VoucherKpis {
  totalVouchers: number;
  pendingPreparation: number;
  inPreparation: number;
  ready: number;
  delivered: number;
  toursToday: number;
  toursTomorrow: number;
}

export interface VoucherFilters {
  startDate?: string;
  endDate?: string;
  voucherStatus?: string;
  supplierId?: string;
  productName?: string;
  clientOrContract?: string;
  onlyWithPendencies?: boolean;
}

/**
 * Deriva o status do voucher a partir da reserva operacional, seu histórico e dados contratuais.
 */
export function deriveVoucherStatus(
  res: {
    status?: string | null;
    voucher_ref?: string | null;
    special_instructions?: string | null;
    pickup_time?: string | null;
    pickup_location?: string | null;
    history?: any[] | null;
  },
  contractStatus?: string | null
): VoucherOperationalStatus {
  // 1. Cancelamento
  if (
    contractStatus === "cancelado" ||
    contractStatus === "cancelada" ||
    res.status === "cancelada" ||
    res.status === "cancelado"
  ) {
    return "cancelado";
  }

  const history = Array.isArray(res.history) ? res.history : [];

  // 2. Verificar se foi formalmente entregue (registro em histórico)
  const deliveryEntry = history.find(
    (h) =>
      h.action === "voucher_delivery_confirmed" ||
      h.action?.toLowerCase().includes("voucher entregue") ||
      h.voucher_status === "entregue"
  );
  if (deliveryEntry) {
    return "entregue";
  }

  // 3. Verificar se há indicação de status no histórico mais recente
  for (let i = history.length - 1; i >= 0; i--) {
    const entry = history[i];
    if (entry.voucher_status === "pronto") return "pronto";
    if (entry.voucher_status === "em_preparacao") return "em_preparacao";
    if (entry.voucher_status === "pendente") return "pendente";
  }

  // 4. Se possui voucher_ref preenchido e não vazio
  const hasVoucherRef = Boolean(res.voucher_ref && res.voucher_ref.trim() !== "");
  const hasInstructions = Boolean(res.special_instructions && res.special_instructions.trim() !== "");
  const hasPickup = Boolean(res.pickup_time && res.pickup_time.trim() !== "");

  if (hasVoucherRef) {
    return "pronto";
  }

  // 5. Se já foi editado com instruções ou local de encontro, mas ainda sem código final
  if (hasInstructions || hasPickup || Boolean(res.pickup_location && res.pickup_location.trim() !== "")) {
    return "em_preparacao";
  }

  // 6. Padrão inicial
  return "pendente";
}

/**
 * Extrai detalhes da última entrega de voucher registrada no histórico.
 */
export function extractVoucherDeliveryDetails(history: any[] | undefined): {
  delivered_at: string | null;
  delivered_to: string | null;
  delivered_by: string | null;
  delivery_channel: string | null;
} {
  if (!Array.isArray(history)) {
    return { delivered_at: null, delivered_to: null, delivered_by: null, delivery_channel: null };
  }

  for (let i = history.length - 1; i >= 0; i--) {
    const h = history[i];
    if (
      h.action === "voucher_delivery_confirmed" ||
      h.action?.toLowerCase().includes("voucher entregue") ||
      h.voucher_status === "entregue"
    ) {
      return {
        delivered_at: h.timestamp || h.delivered_at || null,
        delivered_to: h.delivered_to || h.channel_target || null,
        delivered_by: h.user_name || h.operator_name || null,
        delivery_channel: h.channel || "whatsapp",
      };
    }
  }

  return { delivered_at: null, delivered_to: null, delivered_by: null, delivery_channel: null };
}

/**
 * Detecta pendências operacionais específicas para preparação e entrega do voucher.
 */
export function detectVoucherPendencies(voucher: Partial<VoucherDisplayItem>): string[] {
  const pendencies: string[] = [];

  // Código do voucher
  if (!voucher.voucher_ref || voucher.voucher_ref.trim() === "") {
    pendencies.push("Referência ou código do voucher não definido");
  }

  // Horário de pickup
  if (!voucher.pickup_time || voucher.pickup_time.trim() === "") {
    pendencies.push("Horário de pickup a confirmar");
  }

  // Ponto de encontro / Hotel
  if (!voucher.pickup_location && !voucher.hotel_name) {
    pendencies.push("Ponto de encontro ou hotel não informado");
  }

  // Telefone para envio ao cliente
  if (!voucher.client_phone || voucher.client_phone.trim() === "") {
    pendencies.push("Cliente sem telefone cadastrado para envio");
  }

  // Aviso informativo do fornecedor (independente, sem bloquear o voucher)
  if (voucher.reservation_status === "pendente" || voucher.reservation_status === "solicitada") {
    pendencies.push("Reserva operacional aguardando confirmação do fornecedor");
  }

  return pendencies;
}

/**
 * Calcula os indicadores rápidos da Central de Vouchers.
 */
export function calculateVoucherKpis(vouchers: VoucherDisplayItem[], refDateStr?: string): VoucherKpis {
  const ref = refDateStr ? new Date(refDateStr + "T12:00:00") : new Date();
  const todayStr = ref.toISOString().split("T")[0];

  const tomorrow = new Date(ref);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  let pendingPreparation = 0;
  let inPreparation = 0;
  let ready = 0;
  let delivered = 0;
  let toursToday = 0;
  let toursTomorrow = 0;

  for (const v of vouchers) {
    if (v.voucher_status === "cancelado") continue;

    if (v.tour_date === todayStr) toursToday++;
    if (v.tour_date === tomorrowStr) toursTomorrow++;

    if (v.voucher_status === "pendente") pendingPreparation++;
    else if (v.voucher_status === "em_preparacao") inPreparation++;
    else if (v.voucher_status === "pronto") ready++;
    else if (v.voucher_status === "entregue") delivered++;
  }

  return {
    totalVouchers: vouchers.length,
    pendingPreparation,
    inPreparation,
    ready,
    delivered,
    toursToday,
    toursTomorrow,
  };
}

/**
 * Filtra vouchers conforme múltiplos critérios.
 */
export function filterVouchers(
  vouchers: VoucherDisplayItem[],
  filters: VoucherFilters
): VoucherDisplayItem[] {
  const {
    startDate,
    endDate,
    voucherStatus,
    supplierId,
    productName,
    clientOrContract,
    onlyWithPendencies,
  } = filters;

  return vouchers.filter((v) => {
    // Filtro por Data Inicial
    if (startDate && v.tour_date < startDate) return false;

    // Filtro por Data Final
    if (endDate && v.tour_date > endDate) return false;

    // Filtro por Status do Voucher
    if (voucherStatus && voucherStatus !== "todos") {
      if (v.voucher_status !== voucherStatus) return false;
    }

    // Filtro por Fornecedor
    if (supplierId && supplierId !== "todos") {
      if (v.supplier_id !== supplierId) return false;
    }

    // Filtro por Passeio / Produto
    if (productName && productName.trim() !== "") {
      const q = productName.toLowerCase().trim();
      if (!v.product_name.toLowerCase().includes(q)) return false;
    }

    // Filtro por Cliente, Contrato ou Código de Voucher
    if (clientOrContract && clientOrContract.trim() !== "") {
      const q = clientOrContract.toLowerCase().trim();
      const matchClient = v.client_name.toLowerCase().includes(q);
      const matchContract = v.contract_number.toLowerCase().includes(q);
      const matchVoucherRef = v.voucher_ref?.toLowerCase().includes(q);
      const matchHotel = v.hotel_name?.toLowerCase().includes(q);
      if (!matchClient && !matchContract && !matchVoucherRef && !matchHotel) return false;
    }

    // Filtro por Pendências
    if (onlyWithPendencies) {
      if (v.pendencies.length === 0) return false;
    }

    return true;
  });
}

/**
 * Sugere um código de referência padrão para voucher baseado no contrato e índice.
 */
export function generateSuggestedVoucherRef(contractNumber: string, itemIndex: number = 1): string {
  const cleanContract = (contractNumber || "TN-2026").replace(/[^a-zA-Z0-9-]/g, "");
  const padIndex = String(itemIndex).padStart(2, "0");
  return `VCH-${cleanContract}-${padIndex}`;
}

/**
 * Prepara mensagem profissional de envio de voucher para o WhatsApp do cliente.
 * NÃO contém nenhuma informação de custos de fornecedor, comissões, saldo devedor ou margens.
 */
export function generateVoucherWhatsAppMessage(
  voucher: VoucherDisplayItem,
  agencyName: string = "Tío Nenê Viagens"
): string {
  const formattedDate = voucher.tour_date
    ? new Date(voucher.tour_date + "T12:00:00").toLocaleDateString("pt-BR")
    : "Data a definir";

  const paxParts: string[] = [];
  if (voucher.adults_count > 0) paxParts.push(`${voucher.adults_count} adulto${voucher.adults_count > 1 ? "s" : ""}`);
  if (voucher.children_count > 0) paxParts.push(`${voucher.children_count} criança${voucher.children_count > 1 ? "s" : ""}`);
  if (voucher.infants_count > 0) paxParts.push(`${voucher.infants_count} bebê${voucher.infants_count > 1 ? "s" : ""}`);
  const paxStr = paxParts.length > 0 ? paxParts.join(", ") : `${voucher.total_pax || 1} passageiro(s)`;

  const pickupLocation = voucher.pickup_location?.trim() || voucher.hotel_name?.trim() || "A confirmar com seu assessor";
  const pickupTime = voucher.pickup_time?.trim() || "Horário exato informado na véspera (até às 20h)";
  const voucherCode = voucher.voucher_ref?.trim() || "Em emissão";

  let msg = `Olá, *${voucher.client_name}*! Tudo bem?\n\n`;
  msg += `Aqui é da equipe de Atendimento e Operações da *${agencyName}* em Cancún.\n`;
  msg += `Segue o seu *Voucher Oficial de Confirmação* do passeio:\n\n`;
  msg += `🎟️ *Voucher Ref:* ${voucherCode}\n`;
  msg += `📋 *Passeio:* ${voucher.product_name}\n`;
  msg += `📅 *Data:* ${formattedDate}\n`;
  msg += `👥 *Passageiros:* ${paxStr}\n`;
  msg += `📍 *Ponto de Encontro / Embarque:* ${pickupLocation}\n`;
  msg += `⏰ *Horário de Pickup:* ${pickupTime}\n`;

  if (voucher.hotel_zone) {
    msg += `🏨 *Região:* ${voucher.hotel_zone}\n`;
  }

  if (voucher.special_instructions && voucher.special_instructions.trim()) {
    msg += `\n📌 *Orientações Importantes e Recomendações:*\n${voucher.special_instructions.trim()}\n`;
  } else {
    msg += `\n📌 *Orientações Gerais:*\n`;
    msg += `• Chegar ao lobby ou ponto de encontro com 10 minutos de antecedência.\n`;
    msg += `• Apresentar documento oficial de identificação com foto e este voucher no celular.\n`;
    msg += `• Usar roupas confortáveis, roupa de banho por baixo e protetor biodegradável.\n`;
  }

  msg += `\nEstamos à disposição para tornar sua experiência inesquecível!\n`;
  msg += `📞 *Suporte Tío Nenê em Cancún:* +52 998 123 4567\n`;
  msg += `*${agencyName} — Vivencie o melhor de Cancún e Riviera Maya*`;

  return msg;
}
