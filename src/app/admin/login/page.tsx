"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import "../admin.css";
import { Shield, Lock, Mail, ArrowRight } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data?.session) {
        if (typeof window !== "undefined") {
          window.location.href = "/admin";
        } else {
          router.push("/admin");
        }
      }
    } catch (err: any) {
      console.error("Erro no login:", err);
      setErrorMsg(
        err.message === "Invalid login credentials"
          ? "E-mail ou senha incorretos."
          : err.message || "Erro ao conectar com o serviço de autenticação."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        width: "100%",
        flex: 1,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(ellipse at top center, #4a1c25 0%, #240c11 50%, #150609 100%)",
        padding: "32px 20px",
        fontFamily: "'Alegreya Sans', sans-serif"
      }}
    >
      <div style={{ width: "100%", maxWidth: "440px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* Logotipo Oficial */}
        <Link
          href="/"
          title="Tio Nenê Viagens · Ir para o site"
          style={{
            marginBottom: "28px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            textDecoration: "none",
            transition: "transform 0.2s ease, opacity 0.2s ease"
          }}
        >
          <img
            src="/img/tio-nene-01.svg"
            alt="Tio Nenê Viagens"
            style={{
              height: "52px",
              width: "auto",
              maxWidth: "280px",
              objectFit: "contain",
              filter: "drop-shadow(0 6px 20px rgba(0, 0, 0, 0.45))"
            }}
          />
        </Link>

        <div
          className="adm-card"
          style={{
            width: "100%",
            padding: "40px 36px",
            background: "#ffffff",
            borderRadius: "24px",
            boxShadow: "0 20px 48px rgba(0, 0, 0, 0.4)",
            border: "1px solid rgba(255, 255, 255, 0.2)"
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "16px",
                background: "var(--adm-wine-faded)",
                color: "var(--adm-wine)",
                display: "grid",
                placeItems: "center",
                margin: "0 auto 16px"
              }}
            >
              <Shield size={28} />
            </div>

            <span
              style={{
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.25em",
                color: "var(--adm-clay)",
                fontWeight: 700
              }}
            >
              Portal Administrativo
            </span>
            <h1
              style={{
                fontFamily: "'Ibarra Real Nova', Georgia, serif",
                fontSize: "28px",
                color: "var(--adm-wine)",
                marginTop: "4px"
              }}
            >
              Acesso ao Painel
            </h1>
            <p style={{ fontSize: "14px", color: "var(--adm-text-muted)", marginTop: "6px" }}>
              Entre com suas credenciais de administrador
            </p>
          </div>

        {errorMsg && (
          <div
            style={{
              padding: "12px 16px",
              background: "var(--adm-rose-bg)",
              color: "var(--adm-rose)",
              borderRadius: "10px",
              fontSize: "13px",
              marginBottom: "20px",
              border: "1px solid rgba(190, 18, 60, 0.2)"
            }}
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div>
            <label className="adm-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Mail size={14} color="var(--adm-clay)" />
              <span>E-mail</span>
            </label>
            <input
              type="email"
              required
              className="adm-input"
              placeholder="seu.email@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="adm-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Lock size={14} color="var(--adm-clay)" />
              <span>Senha</span>
            </label>
            <input
              type="password"
              required
              className="adm-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="adm-btn adm-btn-primary"
            disabled={loading}
            style={{
              marginTop: "10px",
              padding: "13px",
              fontSize: "15px",
              borderRadius: "12px"
            }}
          >
            <span>{loading ? "Verificando..." : "Entrar no Painel"}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div
          style={{
            marginTop: "24px",
            paddingTop: "16px",
            borderTop: "1px solid var(--adm-border)",
            textAlign: "center"
          }}
        >
          <Link
            href="/"
            style={{
              fontSize: "13px",
              color: "var(--adm-text-muted)",
              textDecoration: "none"
            }}
          >
            ← Voltar para a Página Inicial
          </Link>
        </div>
      </div>
    </div>
  </div>
);
}
