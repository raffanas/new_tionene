"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, FileText, LayoutDashboard, Lock } from "lucide-react";
import { UserRole } from "@/lib/auth/types";
import { getRoleDisplayName, findMatchingRouteRule } from "@/lib/auth/permissions";

interface AccessDeniedProps {
  currentRole?: UserRole;
  pathname?: string;
  moduleName?: string;
}

export default function AccessDenied({
  currentRole = "seller",
  pathname = "",
  moduleName,
}: AccessDeniedProps) {
  const rule = pathname ? findMatchingRouteRule(pathname) : undefined;
  const displayModule = moduleName || rule?.moduleName || "Módulo Restrito";
  const roleName = getRoleDisplayName(currentRole);

  return (
    <div
      style={{
        minHeight: "70vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
      }}
    >
      <div
        className="adm-card"
        style={{
          maxWidth: "560px",
          width: "100%",
          padding: "40px 36px",
          borderRadius: "20px",
          border: "1px solid rgba(190, 18, 60, 0.25)",
          background: "linear-gradient(180deg, #ffffff 0%, #fff7f7 100%)",
          boxShadow: "0 16px 40px rgba(61, 24, 31, 0.08)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "20px",
            background: "rgba(190, 18, 60, 0.1)",
            color: "var(--adm-rose, #be123c)",
            display: "grid",
            placeItems: "center",
            margin: "0 auto 20px",
            boxShadow: "0 4px 16px rgba(190, 18, 60, 0.15)",
          }}
        >
          <ShieldAlert size={32} />
        </div>

        <span
          style={{
            fontSize: "11px",
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            color: "var(--adm-rose, #be123c)",
            fontWeight: 700,
          }}
        >
          Permissão Insuficiente · v0.1.43
        </span>

        <h2
          style={{
            fontFamily: "'Ibarra Real Nova', Georgia, serif",
            fontSize: "26px",
            color: "var(--adm-wine, #3d181f)",
            margin: "8px 0 12px",
          }}
        >
          Acesso Restrito ao Administrador
        </h2>

        <p
          style={{
            fontSize: "14px",
            color: "var(--adm-text-muted, #78716c)",
            lineHeight: 1.6,
            marginBottom: "24px",
          }}
        >
          O módulo <strong>{displayModule}</strong> contém informações financeiras confidenciais de fornecedores ou configurações restritas, acessíveis exclusivamente por administradores da agência.
        </p>

        {/* Quadro informativo de contexto */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.9)",
            border: "1px solid rgba(190, 18, 60, 0.15)",
            borderRadius: "14px",
            padding: "16px 20px",
            textAlign: "left",
            marginBottom: "28px",
            fontSize: "13px",
            color: "#44403c",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ color: "var(--adm-text-muted)" }}>Seu perfil atual:</span>
            <span style={{ fontWeight: 700, color: "var(--adm-wine)" }}>{roleName}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ color: "var(--adm-text-muted)" }}>Acesso comercial autorizado:</span>
            <span style={{ fontWeight: 600, color: "#15803d" }}>✓ Clientes & Contratos</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--adm-text-muted)" }}>Custos & fornecedores:</span>
            <span style={{ fontWeight: 600, color: "var(--adm-rose)" }}>Restrito ao Admin</span>
          </div>
        </div>

        {/* Botões de Ação */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/admin"
            className="adm-btn adm-btn-outline"
            style={{
              padding: "10px 18px",
              borderRadius: "10px",
              fontSize: "13px",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <LayoutDashboard size={15} />
            <span>Voltar ao Dashboard</span>
          </Link>

          <Link
            href="/admin/contratos"
            className="adm-btn adm-btn-primary"
            style={{
              padding: "10px 18px",
              borderRadius: "10px",
              fontSize: "13px",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <FileText size={15} />
            <span>Ver Meus Contratos</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
