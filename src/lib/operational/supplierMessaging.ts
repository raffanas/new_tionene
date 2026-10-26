/**
 * COMUNICAÇÃO COM FORNECEDORES & WHATSAPP — TÍO NENÊ v0.1.43
 *
 * Gera mensagens profissionais e padronizadas para solicitação de confirmação
 * aos fornecedores homologados, links de WhatsApp e detecção de pendências.
 *
 * REGRAS DE SEGURANÇA E NEGÓCIO (TAREFA 19):
 * 1. NUNCA incluir preço de venda ao cliente.
 * 2. NUNCA incluir margem comercial ou markup.
 * 3. NUNCA incluir dados financeiros internos da agência.
 * 4. NUNCA incluir dados pessoais desnecessários (CPF, dados de cartão, etc.).
 * 5. Não avançar status automaticamente ao abrir o link do WhatsApp.
 */

import { OperationalReservation } from "@/types/operational";

/**
 * Gera mensagem profissional, respeitosa e objetiva para o fornecedor.
 */
export function generateSupplierConfirmationMessage(
  res: OperationalReservation,
  agencyName: string = "Tío Nenê Viagens"
): string {
  const formattedDate = res.tour_date
    ? new Date(res.tour_date + "T12:00:00").toLocaleDateString("pt-BR")
    : "Data a definir";

  // Formatação de PAX
  const paxParts: string[] = [];
  if (res.adults_count > 0) {
    paxParts.push(`${res.adults_count} adulto${res.adults_count > 1 ? "s" : ""}`);
  }
  if (res.children_count > 0) {
    paxParts.push(`${res.children_count} criança${res.children_count > 1 ? "s" : ""}`);
  }
  if (res.infants_count > 0) {
    paxParts.push(`${res.infants_count} bebê${res.infants_count > 1 ? "s" : ""}`);
  }
  const paxString = paxParts.length > 0 ? paxParts.join(", ") : `${res.adults_count || 1} pax`;

  const hotelOrLocation = res.pickup_location?.trim() || "Hotel a confirmar pelo passageiro";
  const pickupTimeStr = res.pickup_time?.trim()
    ? res.pickup_time.trim()
    : "Aguardando confirmação do operador";

  const codeRef = res.rate_id_code || res.tour_id_code ? ` [Ref: ${res.rate_id_code || res.tour_id_code}]` : "";

  let msg = `Olá, equipe ${res.supplier_name || "Operadora"}! Tudo bem?\n\n`;
  msg += `Aqui é da Central de Operações da *${agencyName}* em Cancún.\n`;
  msg += `Gostaríamos de solicitar a confirmação da seguinte reserva:\n\n`;
  msg += `📋 *Serviço:* ${res.product_name}${codeRef}\n`;
  msg += `📅 *Data:* ${formattedDate}\n`;
  msg += `👥 *Passageiros:* ${paxString}\n`;
  msg += `👤 *Titular:* ${res.client_name}\n`;
  msg += `🏨 *Local / Hotel:* ${hotelOrLocation}\n`;
  msg += `⏰ *Horário de Pick-up Solicitado:* ${pickupTimeStr}\n`;

  if (res.special_instructions && res.special_instructions.trim()) {
    msg += `ℹ️ *Instruções / Observações:* ${res.special_instructions.trim()}\n`;
  }

  msg += `\nSolicitamos a gentileza de nos enviar o *código de confirmação*, o *horário exato de pick-up* no lobby e o voucher de atendimento, se houver.\n\n`;
  msg += `Muito obrigado pela parceria e excelente atendimento!\n`;
  msg += `*${agencyName} — Central de Reservas*`;

  return msg;
}

/**
 * Normaliza e gera link direto de WhatsApp para o fornecedor.
 * Retorna null se não houver telefone cadastrado.
 */
export function formatWhatsAppLink(
  phone: string | null | undefined,
  message: string
): string | null {
  if (!phone || typeof phone !== "string") return null;

  // Remove caracteres não numéricos
  let clean = phone.replace(/\D/g, "");
  if (!clean || clean.length < 8) return null;

  // Se for número mexicano sem DDI (10 dígitos), adiciona 52
  if (clean.length === 10 && !clean.startsWith("52") && !clean.startsWith("55")) {
    clean = `52${clean}`;
  }

  const encoded = encodeURIComponent(message);
  return `https://wa.me/${clean}?text=${encoded}`;
}

/**
 * Detecta pendências operacionais críticas de uma reserva.
 */
export function detectReservationPendencies(res: OperationalReservation): string[] {
  const pendencies: string[] = [];

  // Fornecedor
  if (
    !res.supplier_name ||
    res.supplier_name.trim() === "" ||
    res.supplier_name.toLowerCase().includes("local") ||
    !res.supplier_id
  ) {
    pendencies.push("Fornecedor não definido");
  }

  // Data
  if (!res.tour_date) {
    pendencies.push("Data do passeio não definida");
  }

  // Horário de Pickup
  if (!res.pickup_time || res.pickup_time.trim() === "") {
    pendencies.push("Horário de pick-up pendente");
  }

  // Local / Hotel
  if (
    !res.pickup_location ||
    res.pickup_location.trim() === "" ||
    res.pickup_location.toLowerCase().includes("confirmar")
  ) {
    pendencies.push("Hotel / Ponto de encontro a confirmar");
  }

  // Código de Confirmação do Fornecedor
  if (!res.supplier_confirmation_code || res.supplier_confirmation_code.trim() === "") {
    pendencies.push("Sem código de confirmação do fornecedor");
  }

  // Voucher
  if (!res.voucher_ref || res.voucher_ref.trim() === "") {
    pendencies.push("Voucher do cliente pendente");
  }

  return pendencies;
}
