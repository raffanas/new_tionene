/**
 * MATRIZ DE AUTORIZAÇÃO E PERMISSÕES - TÍO NENÊ v0.1.43
 *
 * Implementa as regras oficiais da especificação:
 * - Admin: Gestão completa de fornecedores, custos, pagamentos, configurações e auditoria.
 * - Seller: Gestão comercial, visualização/edição compartilhada de contratos (QC42-025),
 *           registro de recebimentos de clientes (REC-005). Bloqueio estrito a custos de fornecedores.
 */

import { UserRole, Permission, RouteAccessRule } from "./types";

/**
 * Permissões atribuídas por papel
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    "contracts:view",
    "contracts:create",
    "contracts:edit",
    "contracts:delete",
    "clients:view",
    "clients:manage",
    "leads:view",
    "leads:manage",
    "receipts:create",
    "receipts:view",
    "receipts:reverse_refund",
    "arrivals:view",
    "arrivals:manage",
    "catalog:view",
    "suppliers:view",
    "suppliers:manage",
    "supplier_costs:view",
    "supplier_costs:manage",
    "supplier_payments:view",
    "supplier_payments:manage",
    "settings:manage",
    "users:manage",
  ],
  seller: [
    // Comercial & Contratos (Cross-seller access garantido per QC42-025 / SC-007)
    "contracts:view",
    "contracts:create",
    "contracts:edit",
    "clients:view",
    "clients:manage",
    "leads:view",
    "leads:manage",
    // Recebimento de clientes (REC-005, REC-006)
    "receipts:create",
    "receipts:view",
    // Operações de Chegadas e Catálogo
    "arrivals:view",
    "arrivals:manage",
    "catalog:view",
    // NOTE: 'seller' NÃO possui permissões de custos, fornecedores restritos, estornos e exclusão de contratos
  ],
};

/**
 * Regras de acesso às rotas do Portal Administrativo
 */
export const ROUTE_ACCESS_RULES: RouteAccessRule[] = [
  {
    path: "/admin/financeiro/clientes",
    requiredPermissions: ["receipts:view"],
    allowedRoles: ["admin", "seller"],
    moduleName: "Contas a Receber dos Clientes & Controle Cambial",
  },
  {
    path: "/admin/financeiro/fornecedores",
    requiredPermissions: ["supplier_costs:view"],
    allowedRoles: ["admin"],
    moduleName: "Financeiro de Fornecedores & Contas a Pagar",
  },
  {
    path: "/admin/financeiro/cancelamentos",
    requiredPermissions: ["receipts:view"],
    allowedRoles: ["admin", "seller"],
    moduleName: "Central de Cancelamentos, Créditos e Reembolsos",
  },
  {
    path: "/admin/financeiro",
    exact: true,
    requiredPermissions: ["supplier_costs:view"],
    allowedRoles: ["admin"],
    moduleName: "Painel Financeiro Consolidado & Resultado Operacional",
  },
  {
    path: "/admin/custos-fornecedores",
    requiredPermissions: ["supplier_costs:view"],
    allowedRoles: ["admin"],
    moduleName: "Custos por Fornecedor & Margens",
  },
  {
    path: "/admin/operacoes",
    requiredPermissions: ["arrivals:view"],
    allowedRoles: ["admin", "seller"],
    moduleName: "Painel de Operações Diárias",
  },
  {
    path: "/admin/ocorrencias",
    requiredPermissions: ["arrivals:view"],
    allowedRoles: ["admin", "seller"],
    moduleName: "Gestão de Ocorrências Operacionais",
  },
  {
    path: "/admin/tarefas",
    requiredPermissions: ["arrivals:view"],
    allowedRoles: ["admin", "seller"],
    moduleName: "Central de Tarefas e Acompanhamentos Internos",
  },
  {
    path: "/admin/reservas",
    requiredPermissions: ["arrivals:view"],
    allowedRoles: ["admin", "seller"],
    moduleName: "Central Operacional de Reservas",
  },
  {
    path: "/admin/vouchers",
    requiredPermissions: ["arrivals:view"],
    allowedRoles: ["admin", "seller"],
    moduleName: "Central de Vouchers e Documentos Operacionais",
  },
  {
    path: "/admin/carteiras",
    requiredPermissions: ["arrivals:view"],
    allowedRoles: ["admin", "seller"],
    moduleName: "Central de Carteiras de Viagem do Cliente",
  },
  {
    path: "/admin/fornecedores",
    requiredPermissions: ["suppliers:view"],
    allowedRoles: ["admin"],
    moduleName: "Gestão de Fornecedores Locais",
  },
  {
    path: "/admin/contratos",
    requiredPermissions: ["contracts:view"],
    allowedRoles: ["admin", "seller"],
    moduleName: "Contratos da Agência",
  },
  {
    path: "/admin/clientes",
    requiredPermissions: ["clients:view"],
    allowedRoles: ["admin", "seller"],
    moduleName: "Base de Clientes",
  },
  {
    path: "/admin/leads",
    requiredPermissions: ["leads:view"],
    allowedRoles: ["admin", "seller"],
    moduleName: "Leads do Site",
  },
  {
    path: "/admin/chegadas",
    requiredPermissions: ["arrivals:view"],
    allowedRoles: ["admin", "seller"],
    moduleName: "Chegadas e Operações no Mês",
  },
  {
    path: "/admin/passeios",
    requiredPermissions: ["catalog:view"],
    allowedRoles: ["admin", "seller"],
    moduleName: "Catálogo de Passeios",
  },
  {
    path: "/admin/viagem-completa",
    requiredPermissions: ["catalog:view"],
    allowedRoles: ["admin", "seller"],
    moduleName: "Pacotes de Viagem",
  },
  {
    path: "/admin/curadoria",
    requiredPermissions: ["catalog:view"],
    allowedRoles: ["admin", "seller"],
    moduleName: "Curadoria Bella VIP",
  },
  {
    path: "/admin/parceiros",
    requiredPermissions: ["catalog:view"],
    allowedRoles: ["admin", "seller"],
    moduleName: "Parceiros B2B",
  },
  {
    path: "/admin",
    exact: true,
    requiredPermissions: ["catalog:view"],
    allowedRoles: ["admin", "seller"],
    moduleName: "Painel Principal",
  },
];

/**
 * Verifica se um papel possui uma permissão específica
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

/**
 * Encontra a regra de acesso mais específica para um caminho
 */
export function findMatchingRouteRule(pathname: string): RouteAccessRule | undefined {
  // Ordena por comprimento decrescente para priorizar rotas mais aninhadas
  const sorted = [...ROUTE_ACCESS_RULES].sort((a, b) => b.path.length - a.path.length);

  for (const rule of sorted) {
    if (rule.exact) {
      if (pathname === rule.path) return rule;
    } else {
      if (pathname === rule.path || pathname.startsWith(`${rule.path}/`)) {
        return rule;
      }
    }
  }

  // Se estiver dentro de /admin mas não bater em regra explícita, requer permissão base
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    return {
      path: "/admin",
      requiredPermissions: ["catalog:view"],
      allowedRoles: ["admin", "seller"],
      moduleName: "Portal Administrativo",
    };
  }

  return undefined;
}

/**
 * Valida se um usuário com dado papel pode acessar uma URL
 */
export function canAccessRoute(role: UserRole, pathname: string): boolean {
  if (pathname === "/admin/login") return true;

  const rule = findMatchingRouteRule(pathname);
  if (!rule) return true; // Rota pública fora do /admin

  return rule.allowedRoles.includes(role);
}

/**
 * Normaliza strings de role recebidas do banco ou legadas
 */
export function normalizeRole(raw: string | null | undefined): UserRole {
  if (!raw) return "seller";
  const lower = raw.trim().toLowerCase();
  if (lower === "admin" || lower === "administrador") {
    return "admin";
  }
  // 'user', 'vendedor', 'seller', 'moderator' mapeiam para o papel oficial 'seller'
  return "seller";
}

/**
 * Nome legível para exibição na interface
 */
export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case "admin":
      return "Administrador";
    case "seller":
      return "Vendedor";
    default:
      return "Colaborador";
  }
}

/**
 * Configuração visual de badge para o papel
 */
export function getRoleBadgeConfig(role: UserRole) {
  if (role === "admin") {
    return {
      label: "ADMIN",
      bg: "linear-gradient(135deg, var(--adm-wine) 0%, var(--adm-wine-dark) 100%)",
      color: "var(--adm-gold)",
      border: "1px solid rgba(212, 175, 55, 0.4)",
      badgeBg: "rgba(212, 175, 55, 0.15)",
    };
  }

  return {
    label: "VENDEDOR",
    bg: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
    color: "#38bdf8",
    border: "1px solid rgba(56, 189, 248, 0.4)",
    badgeBg: "rgba(56, 189, 248, 0.15)",
  };
}
