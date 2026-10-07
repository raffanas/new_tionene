"use client";

import React, { useState, useEffect } from "react";
import { SITE_CONFIG } from "@/config/site";

export type TripPackageId = "essencial" | "oficial" | "completo" | "assinatura";

export interface TripPackageFeature {
  icon: "hotel" | "coffee" | "plane" | "compass" | "transfer" | "star" | "resort";
  text: string;
}

export interface TripPackageInfo {
  id: TripPackageId;
  tag: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  price: string;
  features: TripPackageFeature[];
  composedOfTitle: string;
  composedOf: string[];
  itineraryTitle: string;
  itinerary: string[];
  hotelsTitle: string;
  hotels: string[];
  hotelsDisclaimer: string;
}

export const TRIP_PACKAGES_DATA: Record<TripPackageId, TripPackageInfo> = {
  essencial: {
    id: "essencial",
    tag: "6 DIAS · SEM AÉREO",
    title: "Cancún Essencial",
    subtitle: "O básico muito bem resolvido.",
    description:
      "Para quem tem poucos dias e quer aproveitar o máximo do essencial, sem extrapolar o orçamento.",
    image: "/images/package-essencial-modal.jpg",
    price: "R$ 4.900 por pessoa",
    features: [
      { icon: "hotel", text: "hospedagem" },
      { icon: "compass", text: "passeios" },
      { icon: "transfer", text: "transfers" },
    ],
    composedOfTitle: "O PACOTE É COMPOSTO POR",
    composedOf: [
      "5 noites de hospedagem com café da manhã em Cancún",
      "3 passeios do nosso pacote básico",
      "Transfer aeroporto ↔ hotel (ida e volta)",
      "Aéreo por sua conta (podemos cotar à parte)",
    ],
    itineraryTitle: "ROTEIRO DIA A DIA",
    itinerary: [
      "Dia 1 — Chegada, transfer privativo e check-in",
      "Dia 2 — Praia livre + jantar na Zona Hotelera",
      "Dia 3 — Isla Mujeres de catamarã",
      "Dia 4 — Tulum + cenote com guia local",
      "Dia 5 — Dia livre com sugestões de curadoria",
      "Dia 6 — Transfer de saída",
    ],
    hotelsTitle: "HOTÉIS SUGERIDOS",
    hotels: [
      "Zona Hotelera categoria turística",
      "Centro de Cancún (melhor custo-benefício)",
    ],
    hotelsDisclaimer:
      "Sugestões — os hotéis podem ser trocados conforme seu perfil e orçamento.",
  },
  oficial: {
    id: "oficial",
    tag: "7 DIAS · COM AÉREO",
    title: "Cancún Oficial",
    subtitle: "Viagem completa, do voo ao último passeio.",
    description:
      "O pacote redondo: passagem, hospedagem com café da manhã e os passeios clássicos da região.",
    image: "/images/package-oficial-modal.jpg",
    price: "R$ 9.800 por pessoa",
    features: [
      { icon: "hotel", text: "hospedagem" },
      { icon: "coffee", text: "café da manhã" },
      { icon: "plane", text: "passagem" },
    ],
    composedOfTitle: "O PACOTE É COMPOSTO POR",
    composedOf: [
      "Aéreo ida e volta a partir do Brasil",
      "6 noites de hospedagem com café da manhã",
      "3 passeios do pacote básico",
      "Transfers privativos de chegada e saída",
    ],
    itineraryTitle: "ROTEIRO DIA A DIA",
    itinerary: [
      "Dia 1 — Voo e chegada em Cancún",
      "Dia 2 — Praia + city tour pela Zona Hotelera",
      "Dia 3 — Isla Mujeres de catamarã",
      "Dia 4 — Cenote e vilarejo maia",
      "Dia 5 — Tulum e Playa del Carmen",
      "Dia 6 — Dia livre",
      "Dia 7 — Transfer e voo de volta",
    ],
    hotelsTitle: "HOTÉIS SUGERIDOS",
    hotels: [
      "Hotéis 4★ com café da manhã na Zona Hotelera",
      "Playa del Carmen (Quinta Avenida)",
    ],
    hotelsDisclaimer:
      "Sugestões — os hotéis podem ser trocados conforme seu perfil e orçamento.",
  },
  completo: {
    id: "completo",
    tag: "9 DIAS · COM AÉREO",
    title: "Cancún Completo",
    subtitle: "All inclusive e exploração no mesmo roteiro.",
    description:
      "Dias de descanso em all inclusive e dias de passeio com base em hotel bem localizado.",
    image: "/images/package-completo-modal.jpg",
    price: "R$ 14.900 por pessoa",
    features: [
      { icon: "hotel", text: "resort all inclusive" },
      { icon: "compass", text: "passeios guiados" },
      { icon: "plane", text: "passagem" },
    ],
    composedOfTitle: "O PACOTE É COMPOSTO POR",
    composedOf: [
      "Aéreo ida e volta a partir do Brasil",
      "3 noites em resort all inclusive",
      "5 noites em hotel com café da manhã (Cancún centro ou Playa del Carmen)",
      "3 passeios com guia + todos os traslados internos",
    ],
    itineraryTitle: "ROTEIRO DIA A DIA",
    itinerary: [
      "Dias 1–3 — Resort all inclusive: praia e descanso",
      "Dia 4 — Mudança de base e city tour",
      "Dias 5–7 — Isla Mujeres, cenotes e Tulum",
      "Dia 8 — Dia livre / passeio extra",
      "Dia 9 — Transfer e voo de volta",
    ],
    hotelsTitle: "HOTÉIS SUGERIDOS",
    hotels: [
      "Resort all inclusive na Zona Hotelera",
      "Boutique com café da manhã em Playa del Carmen",
    ],
    hotelsDisclaimer:
      "Sugestões — os hotéis podem ser trocados conforme seu perfil e orçamento.",
  },
  assinatura: {
    id: "assinatura",
    tag: "11 DIAS · COM AÉREO",
    title: "Cancún Assinatura",
    subtitle: "A região inteira, sem pressa nenhuma.",
    description:
      "O roteiro mais completo: all inclusive, base para explorar e 5 dias do nosso pacote cultural.",
    image: "/images/package-assinatura-modal.jpg",
    price: "R$ 21.900 por pessoa",
    features: [
      { icon: "star", text: "resort premium" },
      { icon: "compass", text: "pacote cultural" },
      { icon: "plane", text: "passagem" },
    ],
    composedOfTitle: "O PACOTE É COMPOSTO POR",
    composedOf: [
      "Aéreo ida e volta a partir do Brasil",
      "4 noites em resort all inclusive",
      "6 noites em hotel com café da manhã",
      "5 dias de passeios do pacote cultural (Chichén Itzá, cenotes, vilas e gastronomia)",
    ],
    itineraryTitle: "ROTEIRO DIA A DIA",
    itinerary: [
      "Dias 1–4 — Resort all inclusive: praia, catamarã e Isla Mujeres",
      "Dias 5–7 — Chichén Itzá, Valladolid e cenotes",
      "Dias 8–10 — Tulum, Sian Ka'an e experiências privativas",
      "Dia 11 — Transfer e voo de volta",
    ],
    hotelsTitle: "HOTÉIS SUGERIDOS",
    hotels: [
      "Resort all inclusive premium",
      "Hotel de charme em Tulum ou Playa del Carmen",
    ],
    hotelsDisclaimer:
      "Sugestões — os hotéis podem ser trocados conforme seu perfil e orçamento.",
  },
};

const renderFeatureIcon = (icon: string) => {
  switch (icon) {
    case "coffee":
      return (
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
          <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
          <line x1="6" y1="1" x2="6" y2="4" />
          <line x1="10" y1="1" x2="10" y2="4" />
          <line x1="14" y1="1" x2="14" y2="4" />
        </svg>
      );
    case "plane":
      return (
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z" />
        </svg>
      );
    case "compass":
      return (
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" />
        </svg>
      );
    case "transfer":
      return (
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="1" y="3" width="15" height="13" rx="2" />
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      );
    case "star":
      return (
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
    case "hotel":
    case "resort":
    default:
      return (
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 21h18" />
          <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
          <path d="M9 9h1" />
          <path d="M9 13h1" />
          <path d="M9 17h1" />
          <path d="M14 9h1" />
          <path d="M14 13h1" />
          <path d="M14 17h1" />
        </svg>
      );
  }
};

interface TripPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPackageId: TripPackageId | null;
}

export default function TripPackageModal({
  isOpen,
  onClose,
  selectedPackageId,
}: TripPackageModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [intent, setIntent] = useState<"contratar" | "modificar">("contratar");

  // Form State (Step 2)
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset when opening or changing package
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setIntent("contratar");
      setErrors({});
    }
  }, [isOpen, selectedPackageId]);

  // Handle escape key and body scroll lock
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

  if (!isOpen || !selectedPackageId) return null;

  const pkg = TRIP_PACKAGES_DATA[selectedPackageId] || TRIP_PACKAGES_DATA.essencial;

  const formatDateBr = (dateStr: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const handleStartContract = () => {
    setIntent("contratar");
    setStep(2);
  };

  const handleStartModify = () => {
    setIntent("modificar");
    setStep(2);
  };

  const validateForm = () => {
    const errs: Record<string, string> = {};

    if (!name.trim() || name.trim().length < 2) {
      errs.name = "Por favor, informe seu nome completo.";
    }

    const cleanWhatsapp = whatsapp.replace(/\D/g, "");
    if (!whatsapp.trim() || cleanWhatsapp.length < 8) {
      errs.whatsapp = "Informe um WhatsApp válido (com DDD).";
    }

    if (!email.trim() || !email.includes("@") || !email.includes(".")) {
      errs.email = "Informe um e-mail válido para contato.";
    }

    if (!arrivalDate.trim()) {
      errs.arrivalDate = "Informe a data prevista de chegada.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // 1. Estrutura de dados pronta para integração com CRM
    const tripLeadPayload = {
      packageId: pkg.id,
      packageName: pkg.title,
      packageTag: pkg.tag,
      intent: intent === "contratar" ? "Quero contratar esse pacote" : "Quero modificar/personalizar esse pacote",
      name: name.trim(),
      whatsapp: whatsapp.trim(),
      email: email.trim(),
      arrivalDate: arrivalDate.trim(),
      arrivalDateBr: formatDateBr(arrivalDate),
      party: {
        adults,
        children,
        infants,
        total: adults + children + infants,
      },
      source: "pagina-viagem-completa-pacotes",
      createdAt: new Date().toISOString(),
    };

    try {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "tionene_last_trip_package_lead",
          JSON.stringify(tripLeadPayload)
        );
      }
    } catch {
      // Ignora erro de storage restrito
    }

    // 2. Monta mensagem para o WhatsApp com os dados preenchidos
    const messageLines = [
      "Olá, equipe Tio Nenê! Gostaria de solicitar informações sobre o pacote de Viagem Completa:",
      "",
      `*PACOTE ESCOLHIDO:*`,
      `${pkg.title} (${pkg.tag})`,
      `*INTERESSE:* ${tripLeadPayload.intent}`,
      "",
      `*DADOS DO VIAJANTE:*`,
      `• Nome: ${tripLeadPayload.name}`,
      `• WhatsApp: ${tripLeadPayload.whatsapp}`,
      `• E-mail: ${tripLeadPayload.email}`,
      `• Data prevista de chegada: ${tripLeadPayload.arrivalDateBr}`,
      "",
      `*QUEM VIAJA:*`,
      `• Adultos (12+ anos): ${tripLeadPayload.party.adults}`,
      `• Crianças (6 a 11 anos): ${tripLeadPayload.party.children}`,
      `• Crianças menores de 5 anos: ${tripLeadPayload.party.infants}`,
      "",
      "Poderiam me enviar a disponibilidade, cotação e os próximos passos?",
    ];

    const fullMessage = messageLines.join("\n");
    const configuredWhatsapp = (SITE_CONFIG.whatsapp || "529981234567").replace(
      /\D/g,
      ""
    );
    const whatsappUrl = `https://wa.me/${configuredWhatsapp}?text=${encodeURIComponent(
      fullMessage
    )}`;

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    onClose();
  };

  return (
    <div
      className="package-modal-overlay trip-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="trip-package-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="trip-modal-dialog">
        {/* Imagem de Capa com Botão Fechar em Sobreposição */}
        <div className="trip-modal-banner">
          <img
            src={pkg.image}
            alt={pkg.title}
            className="trip-modal-banner-img"
          />
          <button
            type="button"
            className="trip-modal-banner-close"
            onClick={onClose}
            aria-label="Fechar janela"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="1" y1="1" x2="13" y2="13" />
              <line x1="13" y1="1" x2="1" y2="13" />
            </svg>
          </button>
        </div>

        <div className="trip-modal-content">
          {step === 1 ? (
            /* ============================================================== */
            /* ETAPA 1: VISÃO DO PACOTE (LAYOUT EDITORIAL DE REFERÊNCIA)       */
            /* ============================================================== */
            <div className="trip-modal-body">
              {/* 1. Eyebrow / Dias */}
              <span className="trip-modal-tag">{pkg.tag}</span>

              {/* 2. Título do Pacote */}
              <h2 className="trip-modal-title" id="trip-package-title">
                {pkg.title}
              </h2>

              {/* 3. Linha de Características */}
              {pkg.features && pkg.features.length > 0 && (
                <div className="trip-modal-features">
                  {pkg.features.map((feat, idx) => (
                    <div key={idx} className="trip-modal-feature-item">
                      <span className="trip-modal-feature-icon">
                        {renderFeatureIcon(feat.icon)}
                      </span>
                      <span className="trip-modal-feature-text">{feat.text}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* 4. Subtítulo / Resumo Editorial */}
              <div className="trip-modal-intro">
                <p className="trip-modal-subtitle">{pkg.subtitle}</p>
                <p className="trip-modal-desc">{pkg.description}</p>
              </div>

              {/* 5. Conteúdo em Duas Colunas */}
              <div className="trip-modal-columns">
                {/* Coluna Esquerda: O PACOTE É COMPOSTO POR */}
                <div className="trip-modal-col">
                  <span className="trip-modal-section-title">{pkg.composedOfTitle}</span>
                  <ul className="trip-modal-composed-list">
                    {pkg.composedOf.map((item, idx) => (
                      <li key={idx} className="trip-modal-composed-item">
                        <span className="trip-modal-check-mark" aria-hidden="true">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Coluna Direita: HOTÉIS SUGERIDOS */}
                <div className="trip-modal-col">
                  <span className="trip-modal-section-title">{pkg.hotelsTitle}</span>
                  <ul className="trip-modal-hotels-plain-list">
                    {pkg.hotels.map((hotel, idx) => (
                      <li key={idx} className="trip-modal-hotels-plain-item">
                        {hotel}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 6. Roteiro Dia a Dia */}
              <div className="trip-modal-itinerary-section">
                <span className="trip-modal-section-title">{pkg.itineraryTitle}</span>
                <ul className="trip-modal-itinerary-list">
                  {pkg.itinerary.map((item, idx) => (
                    <li key={idx} className="trip-modal-itinerary-item">
                      <span className="trip-modal-arrow-mark" aria-hidden="true">→</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 7. Preço no Rodapé */}
              <div className="trip-modal-price-section">
                <span className="trip-modal-price-prefix">a partir de</span>
                <div className="trip-modal-price-row">
                  <strong className="trip-modal-price-amount">
                    {pkg.price.split("por pessoa")[0]?.trim() || pkg.price}
                  </strong>
                  <span className="trip-modal-price-suffix">por pessoa</span>
                </div>
              </div>

              {/* 8. CTAs: Primário e Secundário */}
              <div className="trip-modal-ctas">
                <button
                  type="button"
                  className="trip-modal-btn-primary"
                  onClick={handleStartContract}
                >
                  Quero contratar esse pacote
                </button>

                <button
                  type="button"
                  className="trip-modal-btn-secondary"
                  onClick={handleStartModify}
                >
                  Quero modificar esse pacote
                </button>
              </div>

              {/* 9. Observação Final */}
              {pkg.hotelsDisclaimer && (
                <p className="trip-modal-disclaimer">{pkg.hotelsDisclaimer}</p>
              )}
            </div>
          ) : (
            /* ============================================================== */
            /* ETAPA 2: FORMULÁRIO DE INFORMAÇÕES                             */
            /* ============================================================== */
            <div className="package-modal-step package-modal-step--form">
              {/* Banner de Confirmação do Pacote */}
              <div className="package-modal-badge">
                <span className="package-modal-badge-eyebrow">
                  {intent === "modificar"
                    ? "VOCÊ QUER PERSONALIZAR"
                    : "VOCÊ ESCOLHEU"}
                </span>
                <h3 className="package-modal-badge-title">
                  {pkg.title} ({pkg.tag})
                </h3>
              </div>

              {/* Título de chamada */}
              <h2 className="package-modal-form-title" id="trip-package-title">
                Só mais alguns dados e a gente continua no WhatsApp.
              </h2>
              <div className="package-modal-accent-line" aria-hidden="true" />

              <form onSubmit={handleSubmit} noValidate>
                {/* Nome Completo */}
                <div className="package-modal-field">
                  <label htmlFor="trip-pkg-name" className="package-modal-label">
                    NOME COMPLETO*
                  </label>
                  <input
                    id="trip-pkg-name"
                    type="text"
                    className={`package-modal-input ${
                      errors.name ? "package-modal-input--error" : ""
                    }`}
                    placeholder="Seu nome completo"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name)
                        setErrors((prev) => ({ ...prev, name: "" }));
                    }}
                    autoComplete="name"
                  />
                  {errors.name && (
                    <span className="package-modal-error-msg">{errors.name}</span>
                  )}
                </div>

                {/* WhatsApp e E-mail */}
                <div className="package-modal-grid-2">
                  <div className="package-modal-field">
                    <label
                      htmlFor="trip-pkg-whatsapp"
                      className="package-modal-label"
                    >
                      WHATSAPP*
                    </label>
                    <input
                      id="trip-pkg-whatsapp"
                      type="tel"
                      className={`package-modal-input ${
                        errors.whatsapp ? "package-modal-input--error" : ""
                      }`}
                      placeholder="(00) 00000-0000"
                      value={whatsapp}
                      onChange={(e) => {
                        setWhatsapp(e.target.value);
                        if (errors.whatsapp)
                          setErrors((prev) => ({ ...prev, whatsapp: "" }));
                      }}
                      autoComplete="tel"
                    />
                    {errors.whatsapp && (
                      <span className="package-modal-error-msg">
                        {errors.whatsapp}
                      </span>
                    )}
                  </div>

                  <div className="package-modal-field">
                    <label
                      htmlFor="trip-pkg-email"
                      className="package-modal-label"
                    >
                      E-MAIL*
                    </label>
                    <input
                      id="trip-pkg-email"
                      type="email"
                      className={`package-modal-input ${
                        errors.email ? "package-modal-input--error" : ""
                      }`}
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email)
                          setErrors((prev) => ({ ...prev, email: "" }));
                      }}
                      autoComplete="email"
                    />
                    {errors.email && (
                      <span className="package-modal-error-msg">
                        {errors.email}
                      </span>
                    )}
                  </div>
                </div>

                {/* Data Prevista de Chegada */}
                <div className="package-modal-field">
                  <label htmlFor="trip-pkg-date" className="package-modal-label">
                    DATA PREVISTA DE CHEGADA*
                  </label>
                  <input
                    id="trip-pkg-date"
                    type="date"
                    className={`package-modal-input ${
                      errors.arrivalDate ? "package-modal-input--error" : ""
                    }`}
                    value={arrivalDate}
                    onChange={(e) => {
                      setArrivalDate(e.target.value);
                      if (errors.arrivalDate)
                        setErrors((prev) => ({ ...prev, arrivalDate: "" }));
                    }}
                  />
                  {errors.arrivalDate && (
                    <span className="package-modal-error-msg">
                      {errors.arrivalDate}
                    </span>
                  )}
                </div>

                {/* Quem Viaja */}
                <div className="package-modal-field">
                  <span className="package-modal-label">QUEM VIAJA</span>

                  <div className="package-modal-steppers-list">
                    {/* Adultos */}
                    <div className="package-modal-stepper-card">
                      <div>
                        <strong className="package-modal-stepper-name">
                          Adultos
                        </strong>
                        <span className="package-modal-stepper-sub">
                          12 anos ou mais
                        </span>
                      </div>
                      <div className="package-modal-stepper-controls">
                        <button
                          type="button"
                          className="package-modal-stepper-btn"
                          onClick={() => setAdults((prev) => Math.max(1, prev - 1))}
                          disabled={adults <= 1}
                          aria-label="Diminuir adultos"
                        >
                          –
                        </button>
                        <span className="package-modal-stepper-val">{adults}</span>
                        <button
                          type="button"
                          className="package-modal-stepper-btn"
                          onClick={() => setAdults((prev) => prev + 1)}
                          aria-label="Aumentar adultos"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Crianças 6 a 11 */}
                    <div className="package-modal-stepper-card">
                      <div>
                        <strong className="package-modal-stepper-name">
                          Crianças
                        </strong>
                        <span className="package-modal-stepper-sub">
                          6 a 11 anos
                        </span>
                      </div>
                      <div className="package-modal-stepper-controls">
                        <button
                          type="button"
                          className="package-modal-stepper-btn"
                          onClick={() => setChildren((prev) => Math.max(0, prev - 1))}
                          disabled={children <= 0}
                          aria-label="Diminuir crianças"
                        >
                          –
                        </button>
                        <span className="package-modal-stepper-val">
                          {children}
                        </span>
                        <button
                          type="button"
                          className="package-modal-stepper-btn"
                          onClick={() => setChildren((prev) => prev + 1)}
                          aria-label="Aumentar crianças"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Crianças menores de 5 anos */}
                    <div className="package-modal-stepper-card">
                      <div>
                        <strong className="package-modal-stepper-name">
                          Crianças menores de 5 anos
                        </strong>
                        <span className="package-modal-stepper-sub">
                          0 a 5 anos
                        </span>
                      </div>
                      <div className="package-modal-stepper-controls">
                        <button
                          type="button"
                          className="package-modal-stepper-btn"
                          onClick={() => setInfants((prev) => Math.max(0, prev - 1))}
                          disabled={infants <= 0}
                          aria-label="Diminuir crianças menores de 5 anos"
                        >
                          –
                        </button>
                        <span className="package-modal-stepper-val">
                          {infants}
                        </span>
                        <button
                          type="button"
                          className="package-modal-stepper-btn"
                          onClick={() => setInfants((prev) => prev + 1)}
                          aria-label="Aumentar crianças menores de 5 anos"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Barra de Ações: Voltar e Solicitar agora */}
                <div className="package-modal-actions">
                  <button
                    type="button"
                    className="package-modal-back-btn"
                    onClick={() => setStep(1)}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="10 13 5 8 10 3" />
                    </svg>
                    <span>Voltar</span>
                  </button>

                  <button type="submit" className="package-modal-submit-btn">
                    <svg
                      className="package-modal-wa-icon"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.539 1.772.82 2.791.82 3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.587-5.806-5.768-5.806zm3.374 8.232c-.143.402-.83.743-1.15.789-.319.046-.732.062-2.127-.487-1.396-.549-2.275-1.979-2.345-2.073-.07-.094-.564-.75-.564-1.428 0-.678.354-1.011.48-1.152.125-.141.274-.176.365-.176.091 0 .183.001.263.005.084.004.197-.032.308.234.114.274.388.948.423 1.018.034.07.057.153.011.246-.046.094-.069.153-.137.234-.069.082-.144.183-.206.246-.069.07-.14.146-.06.284.08.138.355.586.762.949.524.467.965.611 1.103.68.137.069.217.058.297-.034.08-.093.343-.4.434-.537.092-.138.183-.115.309-.069.126.046.799.377.936.446.137.069.229.103.263.161.034.057.034.331-.109.733z" />
                    </svg>
                    <span>Solicitar agora</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
