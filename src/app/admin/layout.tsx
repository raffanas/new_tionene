"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import "./admin.css";
import {
  LayoutDashboard,
  Compass,
  Briefcase,
  Star,
  Users,
  CalendarCheck,
  ExternalLink,
  Menu,
  X,
  ShieldCheck,
  LogOut,
  Truck,
  FileText,
  CalendarDays,
  DollarSign,
  UserCheck,
  Sparkles,
  User as UserIcon,
  BarChart3,
  Ticket,
  RotateCcw,
  Wallet,
  CalendarClock,
  ShieldAlert,
  CheckSquare,
} from "lucide-react";
import { AuthProvider, useAuthProfile } from "@/lib/auth/AuthContext";
import { getRoleBadgeConfig, getRoleDisplayName } from "@/lib/auth/permissions";
import AccessDenied from "@/components/admin/AccessDenied";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/operacoes", label: "Operações Diárias", icon: CalendarClock },
  { href: "/admin/ocorrencias", label: "Ocorrências", icon: ShieldAlert },
  { href: "/admin/tarefas", label: "Tarefas", icon: CheckSquare },
  { href: "/admin/reservas", label: "Central de Reservas", icon: CalendarCheck },
  { href: "/admin/vouchers", label: "Central de Vouchers", icon: Ticket },
  { href: "/admin/carteiras", label: "Carteiras de Viagem", icon: Wallet },
  { href: "/admin/financeiro", label: "Painel Financeiro Consolidado", icon: BarChart3 },
  { href: "/admin/financeiro/clientes", label: "Contas a Receber Clientes", icon: DollarSign },
  { href: "/admin/financeiro/fornecedores", label: "Contas a Pagar Fornecedores", icon: DollarSign },
  { href: "/admin/financeiro/cancelamentos", label: "Cancelamentos & Reembolsos", icon: RotateCcw },
  { href: "/admin/leads", label: "Leads do Site", icon: Sparkles },
  { href: "/admin/clientes", label: "Clientes", icon: UserCheck },
  { href: "/admin/contratos", label: "Contratos da Agência", icon: FileText },
  { href: "/admin/chegadas", label: "Chegadas no Mês", icon: CalendarDays },
  { href: "/admin/custos-fornecedores", label: "Custos por Fornecedor", icon: DollarSign },
  { href: "/admin/fornecedores", label: "Fornecedores Locais", icon: Truck },
  { href: "/admin/passeios", label: "Catálogo de Passeios", icon: Compass },
  { href: "/admin/viagem-completa", label: "Pacotes de Viagem", icon: Briefcase },
  { href: "/admin/curadoria", label: "Curadoria Bella VIP", icon: Star },
  { href: "/admin/parceiros", label: "Parceiros B2B", icon: Users },
];

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { session, profile, role, loading: checkingAuth, canAccess, logout } = useAuthProfile();

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (!checkingAuth && !session && !isLoginPage) {
      if (typeof window !== "undefined") {
        window.location.href = "/admin/login";
      }
    }
  }, [checkingAuth, session, isLoginPage]);

  if (isLoginPage) {
    return (
      <div
        className="admin-scope admin-scope-login"
        style={{ width: "100vw", minHeight: "100vh", display: "flex", flexDirection: "column" }}
      >
        {children}
      </div>
    );
  }

  if (checkingAuth) {
    return (
      <div
        className="admin-scope"
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          background: "var(--adm-bg)",
          fontFamily: "'Alegreya Sans', sans-serif",
        }}
      >
        <span className="status-dot-pulse" style={{ width: "16px", height: "16px" }} />
        <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--adm-wine)", letterSpacing: "0.05em" }}>
          Verificando autenticação e permissões...
        </span>
      </div>
    );
  }

  if (!session) {
    return null; // O useEffect redirecionará para /admin/login
  }

  // Verificação de Autorização de Rota (RBAC)
  const isRouteAllowed = canAccess(pathname);

  // Filtragem dinâmica de navegação pelo papel do usuário
  const visibleNavItems = NAV_ITEMS.filter((item) => canAccess(item.href));

  // Configuração visual do papel (Admin vs Seller)
  const badgeConfig = getRoleBadgeConfig(role);

  return (
    <div className="admin-scope">
      {/* Overlay Mobile */}
      {mobileMenuOpen && (
        <div
          className="adm-modal-backdrop"
          style={{ zIndex: 40 }}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Boutique */}
      <aside className={`admin-sidebar ${mobileMenuOpen ? "open" : ""}`}>
        <div className="admin-sidebar-header">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <Link
              href="/admin"
              style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}
              title="Tio Nenê Viagens · Painel Administrativo"
            >
              <img
                src="/img/tio-nene-01.svg"
                alt="Tio Nenê Viagens"
                style={{
                  height: "36px",
                  width: "auto",
                  maxWidth: "185px",
                  objectFit: "contain",
                  filter: "drop-shadow(0 2px 8px rgba(0, 0, 0, 0.35))",
                }}
              />
            </Link>
            {mobileMenuOpen && (
              <button
                type="button"
                className="adm-btn adm-btn-icon adm-btn-outline"
                onClick={() => setMobileMenuOpen(false)}
                style={{ background: "transparent", color: "#fff", borderColor: "rgba(255,255,255,0.2)" }}
              >
                <X size={18} />
              </button>
            )}
          </div>
          <span className="admin-brand-tag">PORTAL ADMINISTRATIVO</span>
          <h2 className="admin-brand-title">Gestão & Operação</h2>
          <p className="admin-brand-subtitle">Cancún & Caribe Mexicano</p>
        </div>

        <nav className="admin-nav">
          <div
            style={{
              padding: "0 10px 8px",
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              color: "rgba(255,255,255,0.4)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>Módulos Ativos</span>
            <span
              style={{
                fontSize: "10px",
                background: badgeConfig.badgeBg,
                color: badgeConfig.color,
                padding: "2px 6px",
                borderRadius: "4px",
                fontWeight: 700,
              }}
            >
              {badgeConfig.label}
            </span>
          </div>

          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-nav-item ${isActive ? "active" : ""}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {item.badge && <span className="admin-nav-badge">{item.badge}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-db-status">
            <span className="status-dot-pulse" />
            <span>Supabase Conectado · Live</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <Link href="/" target="_blank" className="admin-site-link">
              <span>Ver Site</span>
              <ExternalLink size={13} />
            </Link>
            <button
              type="button"
              onClick={logout}
              className="admin-site-link"
              style={{ background: "rgba(190, 18, 60, 0.2)", border: "1px solid rgba(190, 18, 60, 0.3)", color: "#fecdd3" }}
              title="Encerrar sessão"
            >
              <span>Sair</span>
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="admin-main">
        <header className="admin-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
              type="button"
              className="adm-btn adm-btn-icon adm-btn-outline"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ display: "none" }}
              id="admin-mobile-toggle"
            >
              <Menu size={20} />
            </button>
            <div className="admin-topbar-title">
              <h1>
                {NAV_ITEMS.find((i) =>
                  i.href === "/admin" ? pathname === "/admin" : pathname.startsWith(i.href)
                )?.label || "Painel de Administração"}
              </h1>
              <p>Tio Nenê Viagens · Hub Operacional</p>
            </div>
          </div>

          <div className="admin-topbar-actions">
            {/* Identificação do Usuário e Papel */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: badgeConfig.bg,
                border: badgeConfig.border,
                padding: "6px 14px 6px 12px",
                borderRadius: "99px",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
              }}
            >
              <img
                src="/img/tio-nene-01.svg"
                alt="Tio Nenê"
                style={{ height: "18px", width: "auto", display: "block" }}
              />
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#ffffff",
                  maxWidth: "140px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={profile?.fullName || session?.user.email || ""}
              >
                {profile?.fullName || session?.user.email?.split("@")[0]}
              </span>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 800,
                  color: badgeConfig.color,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  borderLeft: "1px solid rgba(255,255,255,0.2)",
                  paddingLeft: "8px",
                }}
              >
                {badgeConfig.label}
              </span>
            </div>

            <button
              type="button"
              onClick={logout}
              className="adm-btn adm-btn-outline adm-btn-sm"
              title="Encerrar sessão"
            >
              <LogOut size={14} />
              <span>Sair</span>
            </button>
          </div>
        </header>

        {/* Content Area com Proteção de Rota */}
        <main className="admin-content-area">
          {isRouteAllowed ? (
            children
          ) : (
            <AccessDenied currentRole={role} pathname={pathname} />
          )}
        </main>
      </div>

      <style jsx global>{`
        @media (max-width: 1024px) {
          #admin-mobile-toggle {
            display: inline-flex !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AuthProvider>
  );
}
