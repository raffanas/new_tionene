/**
 * CAMADA DE AUTORIZAÇÃO SERVER-SIDE - TÍO NENÊ v0.1.43
 *
 * Funções seguras para verificação de permissões e papéis em Server Components,
 * Server Actions e Route Handlers.
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { UserRole, Permission, UserProfile } from "./types";
import { ROLE_PERMISSIONS, hasPermission, normalizeRole } from "./permissions";

/**
 * Resolve o papel do usuário no lado do servidor consultando o banco
 */
export async function getServerUserRole(
  supabase: SupabaseClient,
  userId: string
): Promise<UserRole> {
  if (!userId) return "seller";

  try {
    // 1. RPC has_role para admin
    const { data: isAdmin, error: rpcError } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });

    if (!rpcError && isAdmin === true) {
      return "admin";
    }

    // 2. Consulta direta à tabela user_roles
    const { data: roleRow, error: tableError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (!tableError && roleRow?.role) {
      return normalizeRole(roleRow.role);
    }
  } catch (err) {
    console.error("[ServerAuth] Erro ao obter papel do usuário no servidor:", err);
  }

  return "seller";
}

/**
 * Valida a sessão e autorização do usuário no lado do servidor
 */
export async function verifyServerAuthorization(
  supabase: SupabaseClient,
  requiredPermission?: Permission,
  allowedRoles?: UserRole[]
): Promise<{
  authorized: boolean;
  userId: string | null;
  role: UserRole | null;
  error?: string;
}> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        authorized: false,
        userId: null,
        role: null,
        error: "Sessão inválida ou usuário não autenticado.",
      };
    }

    const role = await getServerUserRole(supabase, user.id);

    // Validação de papéis explícitos
    if (allowedRoles && allowedRoles.length > 0) {
      if (!allowedRoles.includes(role)) {
        return {
          authorized: false,
          userId: user.id,
          role,
          error: `Acesso negado: o papel '${role}' não possui permissão para esta operação.`,
        };
      }
    }

    // Validação de permissão específica
    if (requiredPermission) {
      if (!hasPermission(role, requiredPermission)) {
        return {
          authorized: false,
          userId: user.id,
          role,
          error: `Acesso negado: permissão '${requiredPermission}' necessária.`,
        };
      }
    }

    return {
      authorized: true,
      userId: user.id,
      role,
    };
  } catch (err: any) {
    return {
      authorized: false,
      userId: null,
      role: null,
      error: err?.message || "Erro interno na verificação de autorização.",
    };
  }
}
