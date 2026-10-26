/**
 * TIPOS CENTRAIS DE AUTORIZAÇÃO E SEGURANÇA (RBAC) - TÍO NENÊ v0.1.43
 *
 * Papéis Oficiais:
 * - 'admin': Acesso irrestrito a operações, finanças globais de fornecedores, catálogos e configurações.
 * - 'seller': Acesso operacional e comercial (clientes, leads, chegadas, catálogo de passeios)
 *             e permissão compartilhada para visualizar e editar contratos de toda a equipe (QC42-025 / SC-007).
 *             Sem acesso a custos internos de fornecedores, margens globais e dados administrativos restritos.
 */

export type UserRole = "admin" | "seller";

/**
 * Permissões granulares do sistema
 */
export type Permission =
  // Comercial & Contratos (Compartilhado entre Admin e Seller - QC42-025)
  | "contracts:view"
  | "contracts:create"
  | "contracts:edit"
  | "contracts:delete"
  | "clients:view"
  | "clients:manage"
  | "leads:view"
  | "leads:manage"
  // Recebimentos de Clientes (REC-005, REC-006, SC-139, SC-140)
  | "receipts:create"
  | "receipts:view"
  | "receipts:reverse_refund"
  // Operações & Logística
  | "arrivals:view"
  | "arrivals:manage"
  | "catalog:view"
  // Fornecedores & Financeiro Restrito (Admin Only)
  | "suppliers:view"
  | "suppliers:manage"
  | "supplier_costs:view"
  | "supplier_costs:manage"
  | "supplier_payments:view"
  | "supplier_payments:manage"
  // Configurações & Segurança
  | "settings:manage"
  | "users:manage";

/**
 * Perfil autenticado com autoridade verificada no banco de dados
 */
export interface UserProfile {
  id: string;
  email: string | null;
  fullName: string;
  avatarUrl: string | null;
  role: UserRole;
  permissions: Permission[];
}

/**
 * Regra de acesso a rotas do painel
 */
export interface RouteAccessRule {
  path: string;
  exact?: boolean;
  requiredPermissions: Permission[];
  allowedRoles: UserRole[];
  moduleName: string;
}
