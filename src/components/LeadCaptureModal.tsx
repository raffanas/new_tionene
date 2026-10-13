"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { SITE_CONFIG } from "@/config/site";
import {
  MessageCircle,
  X,
  User,
  Phone,
  Mail,
  Sparkles,
  CheckCircle2,
  Lock
} from "lucide-react";

interface LeadCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  interestType: "tour" | "package" | "roteiro";
  interestName: string;
  interestSlug?: string;
  priceFrom?: number;
  currency?: string;
  selectedItems?: any[];
  notes?: string;
  customWhatsappMessage?: (clientName: string) => string;
}

export default function LeadCaptureModal({
  isOpen,
  onClose,
  interestType,
  interestName,
  interestSlug,
  priceFrom,
  currency = "R$",
  selectedItems,
  notes,
  customWhatsappMessage,
}: LeadCaptureModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+55"); // Padrão Brasil
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert("Por favor, preencha seu nome e WhatsApp.");
      return;
    }

    setSubmitting(true);
    const fullPhone = `${countryCode} ${phone.replace(/\D/g, "")}`;

    try {
      // 1. Salvar Lead no Supabase
      const sourceMap: Record<string, string> = {
        tour: "site_tour",
        package: "site_package",
        roteiro: "site_roteiro",
      };

      const { error } = await supabase.from("leads").insert([
        {
          name: name.trim(),
          phone: fullPhone,
          email: email.trim() || null,
          source: sourceMap[interestType] || "site_roteiro",
          interest_type: interestType,
          interest_name: interestName,
          interest_slug: interestSlug || null,
          selected_items: selectedItems || [],
          notes: notes || null,
          status: "novo",
        },
      ]);

      if (error) {
        console.warn("Aviso ao salvar lead no Supabase:", error.message);
      }

      // 2. Montar mensagem personalizada para o WhatsApp
      const fallbackNumber = "5541991998512";
      const whatsappNumber = (SITE_CONFIG.whatsapp || fallbackNumber).replace(/\D/g, "");

      let message = "";
      if (customWhatsappMessage) {
        message = customWhatsappMessage(name.trim());
      } else {
        message = [
          "Olá, equipe Tio Nenê!",
          "",
          `Meu nome é *${name.trim()}*.`,
          `Gostaria de solicitar informações sobre o ${interestType === "tour" ? "passeio" : interestType === "package" ? "pacote" : "roteiro"}:`,
          `*${interestName}*`,
          priceFrom ? `*Valor de referência:* ${currency} ${priceFrom.toLocaleString("pt-BR")}` : "",
          "",
          "Poderiam me enviar mais detalhes sobre datas e disponibilidade?",
        ]
          .filter(Boolean)
          .join("\n");
      }

      // 3. Redirecionar para o WhatsApp
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");

      onClose();
    } catch (err) {
      console.error("Erro inesperado:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "rgba(10, 5, 8, 0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        fontFamily: "'Alegreya Sans', sans-serif"
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "24px",
          maxWidth: "460px",
          width: "100%",
          padding: "32px 28px",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.35)",
          border: "1px solid rgba(255, 255, 255, 0.6)",
          position: "relative",
          animation: "fadeInUp 0.25s ease-out"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão Fechar */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: "absolute",
            top: "18px",
            right: "18px",
            background: "#f3f4f6",
            border: "none",
            borderRadius: "50%",
            width: "32px",
            height: "32px",
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
            color: "#6b7280"
          }}
        >
          <X size={18} />
        </button>

        {/* Cabeçalho */}
        <div style={{ textAlign: "center", marginBottom: "22px" }}>
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "16px",
              background: "rgba(37, 211, 102, 0.12)",
              color: "#16a34a",
              display: "grid",
              placeItems: "center",
              margin: "0 auto 12px"
            }}
          >
            <MessageCircle size={28} />
          </div>

          <span
            style={{
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              color: "#a55e40",
              fontWeight: 700
            }}
          >
            Atendimento Especializado
          </span>
          <h3
            style={{
              fontFamily: "'Ibarra Real Nova', Georgia, serif",
              fontSize: "24px",
              color: "#3d181f",
              marginTop: "4px",
              lineHeight: 1.2
            }}
          >
            Falar com a Equipe Tio Nenê
          </h3>
          <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "6px" }}>
            Informe seus dados para abrirmos sua solicitação de reserva para:
          </p>
          <div
            style={{
              background: "#faf5f0",
              padding: "8px 12px",
              borderRadius: "10px",
              marginTop: "8px",
              fontSize: "13px",
              fontWeight: 700,
              color: "#3d181f",
              border: "1px solid #ebdccc"
            }}
          >
            {interestName}
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
              <User size={13} color="#a55e40" />
              <span>Seu Nome Completo *</span>
            </label>
            <input
              type="text"
              required
              placeholder="Como podemos te chamar?"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: "10px",
                border: "1px solid #d1d5db",
                fontSize: "14px",
                outline: "none"
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Phone size={13} color="#a55e40" />
              <span>Seu WhatsApp com DDD *</span>
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                style={{
                  padding: "11px 10px",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db",
                  background: "#f9fafb",
                  fontSize: "13px",
                  fontWeight: 600
                }}
              >
                <option value="+55">🇧🇷 +55 (BR)</option>
                <option value="+52">🇲🇽 +52 (MX)</option>
                <option value="+1">🇺🇸 +1 (US)</option>
                <option value="+351">🇵🇹 +351 (PT)</option>
              </select>
              <input
                type="tel"
                required
                placeholder="(11) 99999-9999"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{
                  flex: 1,
                  padding: "11px 14px",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db",
                  fontSize: "14px",
                  outline: "none"
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Mail size={13} color="#a55e40" />
              <span>E-mail (opcional para envio de roteiro)</span>
            </label>
            <input
              type="email"
              placeholder="seu.email@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: "10px",
                border: "1px solid #d1d5db",
                fontSize: "14px",
                outline: "none"
              }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              marginTop: "8px",
              padding: "14px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #22c55e 0%, #15803d 100%)",
              color: "#ffffff",
              border: "none",
              fontSize: "15px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: "0 6px 18px rgba(34, 197, 94, 0.35)",
              transition: "transform 0.15s ease"
            }}
          >
            <MessageCircle size={18} />
            <span>{submitting ? "Iniciando atendimento..." : "Continuar no WhatsApp →"}</span>
          </button>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "11px", color: "#9ca3af", marginTop: "4px" }}>
            <Lock size={11} />
            <span>Seus dados estão protegidos pela equipe Tio Nenê Tours.</span>
          </div>
        </form>
      </div>
    </div>
  );
}
