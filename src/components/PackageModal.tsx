"use client";

import React, { useState, useEffect } from "react";
import { SITE_CONFIG } from "@/config/site";

export type PackageProfileId = "ponderado" | "cultural" | "explorador";

export interface PackageProfileInfo {
  id: PackageProfileId;
  badge: string;
  cardTitle: string;
  modalTitle: string;
  eyebrow: string;
  description: string;
  included: string[];
  priceFrom: string;
  priceUnit: string;
  disclaimer: string;
}

export const PACKAGES_DATA: Record<PackageProfileId, PackageProfileInfo> = {
  ponderado: {
    id: "ponderado",
    badge: "PACOTE BÁSICO",
    cardTitle: "Viajante Ponderado",
    modalTitle: "Perfil Ponderado",
    eyebrow: "PACOTE IDEAL PARA O SEU PERFIL",
    description:
      "Você quer aproveitar Cancún sem estresse e sem abrir mão do conforto. Seu roteiro ideal tem o essencial muito bem resolvido: praias bonitas, um ou dois passeios marcantes e tempo de sobra pra curtir o hotel. Você não quer ficar decidindo entre mil opções nem correndo contra o relógio — prefere que a gente já chegue com tudo organizado, dentro do orçamento e sem pegadinha. É o perfil ideal pra quem viaja em família, com criança pequena ou idosos, ou simplesmente tem poucos dias e quer aproveitar cada um deles com tranquilidade.",
    included: [
      "Transfer aeroporto ↔ hotel (ida e volta)",
      "1 dia de praia em Isla Mujeres com catamarã",
      "Tulum + cenote com guia local",
      "Suporte da equipe no destino via WhatsApp",
      "Ingressos e traslados dos passeios inclusos",
    ],
    priceFrom: "a partir de R$ 480",
    priceUnit: "/pessoa",
    disclaimer:
      "Valores e inclusões preliminares — ajustamos conforme suas datas e número de pessoas.",
  },
  cultural: {
    id: "cultural",
    badge: "PACOTE INTERMEDIÁRIO",
    cardTitle: "Perfil cultural",
    modalTitle: "Perfil Cultural",
    eyebrow: "PACOTE IDEAL PARA O SEU PERFIL",
    description:
      "Você não quer só ver Cancún, quer sentir o México. Ruínas maias, cenotes escondidos, uma cochinita pibil de verdade, um mezcal local — pra você, viajar é também aprender e se conectar com a cultura do lugar, não só bater a foto de cartão-postal. Seu roteiro ideal equilibra os clássicos com pelo menos uma experiência fora do óbvio: uma vila colorida, um restaurante que só quem mora aqui conhece, um passeio que conta a história por trás do destino. É aqui que Cancún vira Yucatán de verdade.",
    included: [
      "Tudo do Perfil Ponderado",
      "Chichén Itzá + cenote Ik Kil com guia historiador",
      "Tour gastronômico com cochinita pibil e mezcal",
      "Valladolid ou uma vila colorida fora da rota turística",
      "Playa del Carmen com tempo livre na Quinta Avenida",
    ],
    priceFrom: "a partir de R$ 890",
    priceUnit: "/pessoa",
    disclaimer:
      "Valores e inclusões preliminares — ajustamos conforme suas datas e número de pessoas.",
  },
  explorador: {
    id: "explorador",
    badge: "PACOTE COMPLETO",
    cardTitle: "Viajante Explorador",
    modalTitle: "Perfil Explorador",
    eyebrow: "PACOTE IDEAL PARA O SEU PERFIL",
    description:
      "Descansar você descansa depois. Sua viagem ideal não cabe em 7 dias: quanto mais tempo, melhor, porque você quer ver tudo — as ilhas que a maioria nem sabe que existe, os cenotes menos badalados, os parques que vão além do óbvio, e ainda sobrar energia pra balada à noite. Hospedagem chique não é prioridade, o que importa é o roteiro cheio. Pra esse perfil, a gente monta um plano ambicioso (mas realista) pra você não desperdiçar nenhum dia — e ainda voltar pra casa com a sensação de que valeu cada centavo.",
    included: [
      "Tudo do Perfil Cultural",
      "Holbox ou Isla Contoy (ilha fora do circuito)",
      "Mergulho no MUSA + cenotes menos badalados",
      "Sian Ka'an, Reserva da Biosfera da UNESCO",
      "1 noite de vida noturna (Coco Bongo ou similar)",
      "Roteiro dia a dia montado com a equipe local",
    ],
    priceFrom: "a partir de R$ 1.450",
    priceUnit: "/pessoa",
    disclaimer:
      "Valores e inclusões preliminares — ajustamos conforme suas datas e número de pessoas.",
  },
};

interface PackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPackage: PackageProfileId | null;
}

export default function PackageModal({
  isOpen,
  onClose,
  selectedPackage,
}: PackageModalProps) {
  const [step, setStep] = useState<1 | 2>(1);

  // Form State (Step 2)
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset step whenever modal opens or package changes
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setErrors({});
    }
  }, [isOpen, selectedPackage]);

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

  if (!isOpen || !selectedPackage) return null;

  const pkg = PACKAGES_DATA[selectedPackage] || PACKAGES_DATA.ponderado;

  const formatDateBr = (dateStr: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
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

    // 1. Estruturação do payload (pronto para futura integração com CRM)
    const packageLeadPayload = {
      packageId: pkg.id,
      packageName: `Pacote ${pkg.modalTitle}`,
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
      source: "pagina-passeios-pacotes",
      createdAt: new Date().toISOString(),
    };

    // Salva para histórico ou debug local
    try {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "tionene_last_package_lead",
          JSON.stringify(packageLeadPayload)
        );
      }
    } catch {
      // Ignora erro em navegadores restritivos
    }

    // 2. Construção da mensagem formatada para o WhatsApp
    const messageLines = [
      "Olá, equipe Tio Nenê! Gostaria de solicitar informações sobre o pacote pelo site:",
      "",
      `*PACOTE ESCOLHIDO:*`,
      `Pacote ${pkg.modalTitle}`,
      "",
      `*DADOS DO VIAJANTE:*`,
      `• Nome: ${packageLeadPayload.name}`,
      `• WhatsApp: ${packageLeadPayload.whatsapp}`,
      `• E-mail: ${packageLeadPayload.email}`,
      `• Data prevista de chegada: ${packageLeadPayload.arrivalDateBr}`,
      "",
      `*QUEM VIAJA:*`,
      `• Adultos (12+ anos): ${packageLeadPayload.party.adults}`,
      `• Crianças (6 a 11 anos): ${packageLeadPayload.party.children}`,
      `• Crianças menores de 5 anos: ${packageLeadPayload.party.infants}`,
      "",
      "Poderiam me enviar a disponibilidade e os próximos passos?",
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
      className="package-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="package-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="package-modal-dialog">
        {/* Botão Fechar */}
        <button
          type="button"
          className="package-modal-close"
          onClick={onClose}
          aria-label="Fechar janela"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="1" y1="1" x2="13" y2="13" />
            <line x1="13" y1="1" x2="1" y2="13" />
          </svg>
        </button>

        {step === 1 ? (
          /* ============================================================== */
          /* ETAPA 1: DETALHES DO PACOTE ESCOLHIDO                           */
          /* ============================================================== */
          <div className="package-modal-step package-modal-step--details">
            <span className="eyebrow package-modal-eyebrow">{pkg.eyebrow}</span>
            <h2 className="package-modal-title" id="package-modal-title">
              {pkg.modalTitle}
            </h2>

            <p className="package-modal-desc">{pkg.description}</p>

            {/* Caixa O QUE INCLUI */}
            <div className="package-modal-included-card">
              <span className="package-modal-included-title">O QUE INCLUI</span>
              <ul className="package-modal-included-list">
                {pkg.included.map((item, idx) => (
                  <li key={idx} className="package-modal-included-item">
                    <svg
                      className="package-modal-check-icon"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="3.5 8.5 6.5 11.5 12.5 4.5" />
                    </svg>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="package-modal-price-box">
                <span className="package-modal-price-val">
                  {pkg.priceFrom}
                  <span className="package-modal-price-unit"> {pkg.priceUnit}</span>
                </span>
                <p className="package-modal-disclaimer">{pkg.disclaimer}</p>
              </div>
            </div>

            {/* CTA para avançar ao formulário */}
            <div className="package-modal-cta-wrapper">
              <button
                type="button"
                className="package-modal-cta-btn"
                onClick={() => setStep(2)}
              >
                QUERO ESSE PACOTE
              </button>
            </div>
          </div>
        ) : (
          /* ============================================================== */
          /* ETAPA 2: FORMULÁRIO DE INFORMAÇÕES                             */
          /* ============================================================== */
          <div className="package-modal-step package-modal-step--form">
            {/* Banner de Confirmação do Pacote */}
            <div className="package-modal-badge">
              <span className="package-modal-badge-eyebrow">VOCÊ ESCOLHEU</span>
              <h3 className="package-modal-badge-title">Pacote {pkg.modalTitle}</h3>
            </div>

            {/* Título de chamada */}
            <h2 className="package-modal-form-title" id="package-modal-title">
              Só mais alguns dados e a gente continua no WhatsApp.
            </h2>
            <div className="package-modal-accent-line" aria-hidden="true" />

            <form onSubmit={handleSubmit} noValidate>
              {/* Nome Completo */}
              <div className="package-modal-field">
                <label htmlFor="pkg-name" className="package-modal-label">
                  NOME COMPLETO*
                </label>
                <input
                  id="pkg-name"
                  type="text"
                  className={`package-modal-input ${
                    errors.name ? "package-modal-input--error" : ""
                  }`}
                  placeholder="Seu nome completo"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
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
                  <label htmlFor="pkg-whatsapp" className="package-modal-label">
                    WHATSAPP*
                  </label>
                  <input
                    id="pkg-whatsapp"
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
                  <label htmlFor="pkg-email" className="package-modal-label">
                    E-MAIL*
                  </label>
                  <input
                    id="pkg-email"
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
                    <span className="package-modal-error-msg">{errors.email}</span>
                  )}
                </div>
              </div>

              {/* Data Prevista de Chegada */}
              <div className="package-modal-field">
                <label htmlFor="pkg-date" className="package-modal-label">
                  DATA PREVISTA DE CHEGADA*
                </label>
                <input
                  id="pkg-date"
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
                      <strong className="package-modal-stepper-name">Adultos</strong>
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
                      <strong className="package-modal-stepper-name">Crianças</strong>
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
                      <span className="package-modal-stepper-val">{children}</span>
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
                      <span className="package-modal-stepper-sub">0 a 5 anos</span>
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
                      <span className="package-modal-stepper-val">{infants}</span>
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
  );
}
