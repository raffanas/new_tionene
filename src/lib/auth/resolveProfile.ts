/**
 * RESOLUÇÃO SEGURA DE PERFIL E PAPEL (DATABASE-FIRST) - TÍO NENÊ v0.1.43
 *
 * Princípios de Segurança:
 * 1. Não utiliza user_metadata editável pelo próprio usuário.
 * 2. Consulta a autoridade do banco de dados (RPC has_role / tabela user_roles).
 * 3. Não expõe chave administrativa ou de serviço no frontend.
 * 4. Fallback seguro e fail-closed: na ausência de permissão de admin comprovada,
 *    o usuário é tratado como 'seller'.
 */

import { SupabaseClient, User } from "@supabase/supabase-js";
import { UserProfile, UserRole } from "./types";
import { ROLE_PERMISSIONS, normalizeRole } from "./permissions";

/**
 * Resolve o perfil completo e o papel do usuário consultando o banco de dados
 */
export async function resolveUserProfile(
  supabase: SupabaseClient,
  user: User | null
): Promise<UserProfile | null> {
  if (!user || !user.id) return null;

  try {
    let resolvedRole: UserRole = "seller";

    // 1. Verificação Primária: RPC 'has_role' com verificação de 'admin'
    try {
      const { data: isAdmin, error: rpcError } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });

      if (!rpcError && isAdmin === true) {
        resolvedRole = "admin";
      } else {
        // 2. Verificação Secundária: Tabela 'user_roles'
        const { data: roleRow, error: tableError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!tableError && roleRow?.role) {
          resolvedRole = normalizeRole(roleRow.role);
        }
      }
    } catch (err) {
      console.warn("[Auth] Erro ao verificar user_roles, aplicando fallback seguro 'seller':", err);
      resolvedRole = "seller";
    }

    // 3. Buscar informações cadastrais na tabela 'profiles'
    let fullName = user.email ? user.email.split("@")[0] : "Colaborador";
    let avatarUrl: string | null = null;

    try {
      const { data: profileRow, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (!profileError && profileRow) {
        if (profileRow.full_name && profileRow.full_name.trim().length > 0) {
          fullName = profileRow.full_name.trim();
        }
        if (profileRow.avatar_url) {
          avatarUrl = profileRow.avatar_url;
        }
      }
    } catch (profileErr) {
      console.warn("[Auth] Aviso ao buscar dados de profiles:", profileErr);
    }

    return {
      id: user.id,
      email: user.email || null,
      fullName,
      avatarUrl,
      role: resolvedRole,
      permissions: ROLE_PERMISSIONS[resolvedRole],
    };
  } catch (err) {
    console.error("[Auth] Erro crítico ao resolver perfil de autorização:", err);
    // Em caso de falha catastrófica, retorna o menor privilégio ('seller')
    return {
      id: user.id,
      email: user.email || null,
      fullName: user.email ? user.email.split("@")[0] : "Usuário",
      avatarUrl: null,
      role: "seller",
      permissions: ROLE_PERMISSIONS["seller"],
    };
  }
}
