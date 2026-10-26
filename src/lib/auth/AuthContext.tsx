"use client";

/**
 * CONTEXTO E HOOK DE AUTORIZAÇÃO (CLIENT-SIDE) - TÍO NENÊ v0.1.43
 *
 * Provê estado de autenticação reativo com papel e permissões validadas no banco.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { UserProfile, UserRole, Permission } from "./types";
import { hasPermission as checkPermission, canAccessRoute } from "./permissions";
import { resolveUserProfile } from "./resolveProfile";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  role: UserRole;
  loading: boolean;
  hasPermission: (permission: Permission) => boolean;
  canAccess: (pathname: string) => boolean;
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadUserData = useCallback(async (activeSession: Session | null) => {
    setSession(activeSession);
    const currentUser = activeSession?.user || null;
    setUser(currentUser);

    if (currentUser) {
      const resolved = await resolveUserProfile(supabase, currentUser);
      setProfile(resolved);
    } else {
      setProfile(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Inicialização da sessão
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted) {
        loadUserData(session);
      }
    }).catch((err) => {
      console.error("[AuthContext] Erro ao obter sessão:", err);
      if (isMounted) setLoading(false);
    });

    // Ouvinte para mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!isMounted) return;
        if (event === "SIGNED_OUT" || !newSession) {
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
        } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
          await loadUserData(newSession);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserData]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      const updated = await resolveUserProfile(supabase, user);
      setProfile(updated);
    }
  }, [user]);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("[AuthContext] Erro ao fazer signOut:", err);
    } finally {
      setSession(null);
      setUser(null);
      setProfile(null);
      if (typeof window !== "undefined") {
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (_) {}
        window.location.href = "/admin/login";
      }
    }
  }, []);

  const role: UserRole = profile?.role || "seller";

  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      return checkPermission(role, permission);
    },
    [role]
  );

  const canAccess = useCallback(
    (pathname: string): boolean => {
      return canAccessRoute(role, pathname);
    },
    [role]
  );

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        role,
        loading,
        hasPermission,
        canAccess,
        refreshProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthProfile(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthProfile deve ser utilizado dentro de um <AuthProvider>");
  }
  return context;
}
