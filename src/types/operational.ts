/**
 * TIPOS OPERACIONAIS E LOGÍSTICOS — TÍO NENÊ v0.1.43
 *
 * Entidades geradas após a finalização da venda de um contrato:
 * - Arrival: Logística de chegada no aeroporto e transfer para hotel
 * - OperationalReservation: Reserva operacional do passeio com fornecedor
 * - SupplierPayable: Obrigação financeira / contas a pagar previsto na moeda do fornecedor
 */

export type ArrivalStatus = "agendada" | "em_transito" | "atendido" | "cancelado";

export type OperationalReservationStatus =
  | "pendente"
  | "solicitada"
  | "confirmada"
  | "realizada"
  | "cancelada"
  | "pendente_info"
  | "aguardando_fornecedor";

export type SupplierPaymentStatus =
  | "previsto"
  | "aguardando_aprovacao"
  | "aprovado"
  | "parcialmente_pago"
  | "pago"
  | "cancelado";

export interface SupplierPaymentEntry {
  id: string;
  payable_id: string;
  supplier_id?: string | null;
  amount: number;
  currency: string;
  payment_date: string;
  payment_method: string;
  reference?: string | null;
  notes?: string | null;
  created_by?: string | null;
  created_by_name?: string | null;
  is_reversed: boolean;
  reversed_at?: string | null;
  reversed_by?: string | null;
  reversal_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export type ClientPaymentStatus =
  | "pendente"
  | "parcialmente_pago"
  | "pago"
  | "vencido"
  | "cancelado";

export interface ClientPaymentEntry {
  id: string;
  contract_id: string;
  client_id?: string | null;
  amount_received: number;
  received_currency: string;
  exchange_rate: number;
  amortized_amount: number;
  contract_currency: string;
  exchange_rate_date?: string | null;
  exchange_rate_source?: string | null;
  payment_date: string;
  payment_method: string;
  reference?: string | null;
  notes?: string | null;
  idempotency_key?: string | null;
  created_by?: string | null;
  created_by_name?: string | null;
  is_reversed: boolean;
  reversed_at?: string | null;
  reversed_by?: string | null;
  reversed_by_name?: string | null;
  reversal_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientReceivable {
  id: string;
  contract_number: string;
  client_id?: string | null;
  client_name: string;
  client_phone?: string | null;
  client_email?: string | null;
  seller_name?: string | null;
  sale_date: string;
  due_date?: string | null;
  total_amount: number;
  currency: string;
  client_paid_amount: number;
  pending_balance: number;
  client_payment_status: ClientPaymentStatus;
  last_client_payment_at?: string | null;
  status: string;
  payment_entries?: ClientPaymentEntry[];
}


export interface Arrival {
  id: string;
  contract_id: string;
  client_id?: string | null;
  client_name: string;
  client_phone?: string | null;
  client_email?: string | null;
  arrival_date: string;
  departure_date?: string | null;
  arrival_flight_number?: string | null;
  arrival_flight_time?: string | null;
  depart_flight_number?: string | null;
  depart_flight_time?: string | null;
  adults_count: number;
  children_count: number;
  infants_count: number;
  hotel_name?: string | null;
  hotel_zone?: string | null;
  hotels_schedule?: any[];
  status: ArrivalStatus;
  assigned_agent?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface OperationalReservationHistoryEntry {
  timestamp: string;
  user_id?: string;
  user_name?: string;
  action: string;
  status_before?: string;
  status_after?: string;
  pickup_time?: string | null;
  supplier_confirmation_code?: string | null;
  voucher_ref?: string | null;
  channel?: string | null;
  notes?: string | null;
}

export interface OperationalReservation {
  id: string;
  contract_id: string;
  contract_item_id: string;
  client_id?: string | null;
  client_name: string;
  supplier_id?: string | null;
  supplier_name?: string | null;
  product_name: string;
  tour_id_code?: string | null;
  rate_id_code?: string | null;
  tour_date: string;
  pickup_time?: string | null;
  pickup_location?: string | null;
  hotel_zone?: string | null;
  adults_count: number;
  children_count: number;
  infants_count: number;
  units_count: number;
  legs_count: number;
  supplier_confirmation_code?: string | null;
  voucher_ref?: string | null;
  status: OperationalReservationStatus;
  is_unknown_cost: boolean;
  cost_currency: string;
  estimated_cost?: number | null;
  actual_cost?: number | null;
  special_instructions?: string | null;
  notes?: string | null;
  supplier_requested_at?: string | null;
  supplier_request_channel?: "whatsapp" | "email" | "telefone" | "portal" | string | null;
  supplier_confirmed_at?: string | null;
  history?: OperationalReservationHistoryEntry[];
  created_at: string;
  updated_at: string;

  // Joined / Display fields
  contract_number?: string;
  client_phone?: string | null;
  client_email?: string | null;
  supplier_phone?: string | null;
  supplier_whatsapp?: string | null;
  supplier_email?: string | null;
}

export interface SupplierPayable {
  id: string;
  contract_id: string;
  contract_item_id: string;
  reservation_id?: string | null;
  supplier_id?: string | null;
  supplier_name?: string | null;
  service_date: string;
  description: string;
  currency: string;
  amount_estimated?: number | null;
  amount_final?: number | null;
  is_unknown_cost: boolean;
  payment_status: SupplierPaymentStatus;
  paid_amount: number;
  paid_at?: string | null;
  payment_reference?: string | null;
  notes?: string | null;
  cost_approved_at?: string | null;
  cost_approved_by?: string | null;
  cost_approval_notes?: string | null;
  created_at: string;
  updated_at: string;

  // Joined / Computed fields
  contract_number?: string;
  client_name?: string;
  client_phone?: string;
  client_email?: string;
  pending_balance?: number | null;
  payment_entries?: SupplierPaymentEntry[];
}

export interface FinalizeSaleResult {
  success: boolean;
  contract_id: string;
  contract_number?: string;
  arrival_id?: string;
  reservations_count: number;
  payables_count: number;
  status: string;
  already_finalized?: boolean;
  message: string;
}
