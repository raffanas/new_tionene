"use client";

import React, { useState, useEffect } from "react";
import { SITE_CONFIG } from "@/config/site";
import type { PartnerType } from "@/app/seja-parceiro/page";

interface PartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPartnerType?: PartnerType | null;
}

const PARTNER_TYPE_LABELS: Record<PartnerType, string> = {
  agencia: "Agência de viagens",
  operadora: "Operadora",
  grupos: "Grupos e corporativos",
  creator: "Influenciador / Creator",
};

export default function PartnerModal({
  isOpen,
  onClose,
  selectedPartnerType,
}: PartnerModalProps) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [location, setLocation] = useState("");
  const [partnerType, setPartnerType] = useState<string>("");
  const [websiteOrInstagram, setWebsiteOrInstagram] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sincroniza com a seleção do perfil feita na página
  useEffect(() => {
    if (selectedPartnerType && PARTNER_TYPE_LABELS[selectedPartnerType]) {
      setPartnerType(PARTNER_TYPE_LABELS[selectedPartnerType]);
    }
  }, [selectedPartnerType]);

  // Tecla Escape e bloqueio do scroll do body
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const validateForm = () => {
    const errs: Record<string, string> = {};

    if (!name.trim() || name.trim().length < 2) {
      errs.name = "Por favor, informe seu nome completo.";
    }

    if (!email.trim() || !email.includes("@") || !email.includes(".")) {
      errs.email = "Informe um e-mail válido para contato.";
    }

    const cleanWhatsapp = whatsapp.replace(/\D/g, "");
    if (!whatsapp.trim() || cleanWhatsapp.length < 8) {
      errs.whatsapp = "Informe um WhatsApp válido com DDD ou código do país.";
    }

    if (!partnerType) {
      errs.partnerType = "Selecione o tipo de parceria que você procura.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // 1. Payload estruturado e padronizado para integração futura com CRM
    const partnerLeadPayload = {
      name: name.trim(),
      company: company.trim() || undefined,
      email: email.trim(),
      whatsapp: whatsapp.trim(),
      location: location.trim() || undefined,
      partnerType: partnerType,
      websiteOrInstagram: websiteOrInstagram.trim() || undefined,
      message: message.trim() || undefined,
      source: "seja-parceiro",
      createdAt: new Date().toISOString(),
    };

    // 2. Construção da mensagem estruturada para atendimento no WhatsApp
    const messageLines = [
      "Olá, equipe Tio Nenê! Tenho interesse em ser parceiro.",
      "",
      `Nome: ${partnerLeadPayload.name}`,
    ];

    if (partnerLeadPayload.company) {
      messageLines.push(`Empresa/Marca: ${partnerLeadPayload.company}`);
    }

    messageLines.push(`E-mail: ${partnerLeadPayload.email}`);
    messageLines.push(`WhatsApp: ${partnerLeadPayload.whatsapp}`);

    if (partnerLeadPayload.location) {
      messageLines.push(`Cidade/País: ${partnerLeadPayload.location}`);
    }

    messageLines.push(`Perfil: ${partnerLeadPayload.partnerType}`);

    if (partnerLeadPayload.websiteOrInstagram) {
      messageLines.push(`Site/Instagram: ${partnerLeadPayload.websiteOrInstagram}`);
    }

    if (partnerLeadPayload.message) {
      messageLines.push("");
      messageLines.push(`Mensagem: ${partnerLeadPayload.message}`);
    }

    messageLines.push("");
    messageLines.push("Origem: Página Seja Parceiro");

    const fullMessage = messageLines.join("\n");

    // 3. Resgate do número oficial configurado no projeto
    const rawNumber = SITE_CONFIG.whatsapp?.replace(/\D/g, "");
    const waUrl = rawNumber
      ? `https://wa.me/${rawNumber}?text=${encodeURIComponent(fullMessage)}`
      : `https://wa.me/?text=${encodeURIComponent(fullMessage)}`;

    window.open(waUrl, "_blank", "noopener,noreferrer");
    onClose();
  };

  return (
    <div
      className="partner-modal-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="partner-modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="partner-modal-title"
      >
        <button
          type="button"
          className="partner-modal-close"
          onClick={onClose}
          aria-label="Fechar modal"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="partner-modal-header">
          <span className="eyebrow partner-modal-eyebrow">PROGRAMA DE PARCERIAS</span>
          <h2 className="partner-modal-title" id="partner-modal-title">
            Quero ser parceiro
          </h2>
          <p className="partner-modal-subtitle">
            Preencha seus dados para conectar sua operação ou projeto à equipe local da Tio Nenê no México.
          </p>
        </div>

        <form className="partner-modal-form" onSubmit={handleSubmit} noValidate>
          <div className="partner-modal-grid">
            {/* Nome Completo */}
            <div className="partner-modal-field partner-modal-field--full">
              <label htmlFor="pm-name" className="partner-modal-label">
                Nome completo *
              </label>
              <input
                id="pm-name"
                type="text"
                className={`partner-modal-input ${errors.name ? "partner-modal-input--error" : ""}`}
                placeholder="Como prefere ser chamado(a)?"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
                }}
                autoComplete="name"
              />
              {errors.name && <span className="partner-modal-error-msg">{errors.name}</span>}
            </div>

            {/* Empresa / Marca */}
            <div className="partner-modal-field">
              <label htmlFor="pm-company" className="partner-modal-label">
                Empresa / Marca
              </label>
              <input
                id="pm-company"
                type="text"
                className="partner-modal-input"
                placeholder="Nome da sua agência ou marca"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                autoComplete="organization"
              />
            </div>

            {/* Tipo de Parceiro */}
            <div className="partner-modal-field">
              <label htmlFor="pm-type" className="partner-modal-label">
                Tipo de parceiro *
              </label>
              <select
                id="pm-type"
                className={`partner-modal-select ${
                  errors.partnerType ? "partner-modal-input--error" : ""
                }`}
                value={partnerType}
                onChange={(e) => {
                  setPartnerType(e.target.value);
                  if (errors.partnerType) {
                    setErrors((prev) => ({ ...prev, partnerType: "" }));
                  }
                }}
              >
                <option value="">Selecione um perfil...</option>
                <option value="Agência de viagens">Agência de viagens</option>
                <option value="Operadora">Operadora</option>
                <option value="Grupos e corporativos">Grupos e corporativos</option>
                <option value="Influenciador / Creator">Influenciador / Creator</option>
                <option value="Outro">Outro</option>
              </select>
              {errors.partnerType && (
                <span className="partner-modal-error-msg">{errors.partnerType}</span>
              )}
            </div>

            {/* E-mail */}
            <div className="partner-modal-field">
              <label htmlFor="pm-email" className="partner-modal-label">
                E-mail *
              </label>
              <input
                id="pm-email"
                type="email"
                className={`partner-modal-input ${errors.email ? "partner-modal-input--error" : ""}`}
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
                }}
                autoComplete="email"
              />
              {errors.email && <span className="partner-modal-error-msg">{errors.email}</span>}
            </div>

            {/* WhatsApp */}
            <div className="partner-modal-field">
              <label htmlFor="pm-whatsapp" className="partner-modal-label">
                WhatsApp *
              </label>
              <input
                id="pm-whatsapp"
                type="tel"
                className={`partner-modal-input ${
                  errors.whatsapp ? "partner-modal-input--error" : ""
                }`}
                placeholder="+55 (11) 99999-9999"
                value={whatsapp}
                onChange={(e) => {
                  setWhatsapp(e.target.value);
                  if (errors.whatsapp) setErrors((prev) => ({ ...prev, whatsapp: "" }));
                }}
                autoComplete="tel"
              />
              {errors.whatsapp && (
                <span className="partner-modal-error-msg">{errors.whatsapp}</span>
              )}
            </div>

            {/* Cidade / País */}
            <div className="partner-modal-field">
              <label htmlFor="pm-location" className="partner-modal-label">
                Cidade / País
              </label>
              <input
                id="pm-location"
                type="text"
                className="partner-modal-input"
                placeholder="Ex: São Paulo, Brasil"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            {/* Site ou Instagram */}
            <div className="partner-modal-field">
              <label htmlFor="pm-website" className="partner-modal-label">
                Site ou Instagram
              </label>
              <input
                id="pm-website"
                type="text"
                className="partner-modal-input"
                placeholder="@seuperfil ou www.suaagencia.com"
                value={websiteOrInstagram}
                onChange={(e) => setWebsiteOrInstagram(e.target.value)}
              />
            </div>

            {/* Mensagem / Descrição */}
            <div className="partner-modal-field partner-modal-field--full">
              <label htmlFor="pm-message" className="partner-modal-label">
                Mensagem / Descrição da parceria
              </label>
              <textarea
                id="pm-message"
                rows={3}
                className="partner-modal-textarea"
                placeholder="Conte um pouco sobre suas viagens, público ou formatos que imagina para a parceria..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
          </div>

          <div className="partner-modal-actions">
            <button type="submit" className="partner-modal-submit-btn">
              <svg
                className="partner-modal-wa-icon"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.539 1.772.82 2.791.82 3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.587-5.806-5.768-5.806zm3.374 8.232c-.143.402-.83.743-1.15.789-.319.046-.732.062-2.127-.487-1.396-.549-2.275-1.979-2.345-2.073-.07-.094-.564-.75-.564-1.428 0-.678.354-1.011.48-1.152.125-.141.274-.176.365-.176.091 0 .183.001.263.005.084.004.197-.032.308.234.114.274.388.948.423 1.018.034.07.057.153.011.246-.046.094-.069.153-.137.234-.069.082-.144.183-.206.246-.069.07-.14.146-.06.284.08.138.355.586.762.949.524.467.965.611 1.103.68.137.069.217.058.297-.034.08-.093.343-.4.434-.537.092-.138.183-.115.309-.069.126.046.799.377.936.446.137.069.229.103.263.161.034.057.034.331-.109.733z" />
              </svg>
              <span>CONTINUAR PELO WHATSAPP</span>
            </button>
            <p className="partner-modal-privacy">
              Ao continuar, sua mensagem será formatada e você iniciará o contato direto com a nossa equipe no WhatsApp.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
