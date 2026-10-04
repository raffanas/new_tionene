"use client";

import React, { useState } from "react";
import { ClientSupportData } from "@/data/mock-client";
import { SITE_CONFIG } from "@/config/site";

interface ClientSupportProps {
  suporte: ClientSupportData;
  clienteNome?: string;
}

export default function ClientSupport({
  suporte,
  clienteNome = "Isabella",
}: ClientSupportProps) {
  const [showToast, setShowToast] = useState(false);

  const handleSupportClick = () => {
    const rawNumber = SITE_CONFIG.whatsapp?.replace(/\D/g, "");
    if (rawNumber) {
      const text = `Olá, Equipe Tio Nenê! Estou acessando minha Área do Cliente (${clienteNome}) e gostaria de falar com o suporte.`;
      window.open(
        `https://wa.me/${rawNumber}?text=${encodeURIComponent(text)}`,
        "_blank"
      );
    } else {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4500);
    }
  };

  return (
    <section
      className="client-page-support"
      id="suporte"
      aria-labelledby="client-support-title"
    >
      <div className="client-page-container">
        {/* Painel Nobre em Tom Vinho (Inspirado nos grandes blocos de fechamento do Tio Nenê) */}
        <div className="client-page-support__card">
          <div className="client-page-support__main">
            <p className="eyebrow client-page-support__eyebrow">
              PRECISA DE AJUDA?
            </p>
            <h2
              id="client-support-title"
              className="client-page-support__title"
            >
              {suporte.titulo}
            </h2>
            <p className="client-page-support__desc">{suporte.mensagem}</p>

            <div className="client-page-support__meta">
              <div className="client-page-support__meta-item">
                <span className="client-page-support__meta-label">
                  ATENDIMENTO OFICIAL
                </span>
                <strong className="client-page-support__meta-val">
                  {suporte.atendimento}
                </strong>
              </div>

              <div
                className="client-page-support__meta-divider"
                aria-hidden="true"
              />

              <div className="client-page-support__meta-item">
                <span className="client-page-support__meta-label">
                  DISPONIBILIDADE
                </span>
                <strong className="client-page-support__meta-val">
                  {suporte.disponibilidade}
                </strong>
              </div>
            </div>

            <div className="client-page-support__actions">
              <button
                type="button"
                className="client-page-support__btn"
                onClick={handleSupportClick}
              >
                <span>FALAR COM A EQUIPE</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
              </button>

              {showToast && (
                <div className="client-page-support__toast" role="status">
                  ✦ Canal de concierge exclusivo conectado ao suporte local no
                  WhatsApp na versão oficial da sua viagem.
                </div>
              )}
            </div>
          </div>

          {/* Pilares de Tranquilidade e Presença Local */}
          <div className="client-page-support__perks">
            <div className="client-page-support__perk">
              <span
                className="client-page-support__perk-icon"
                aria-hidden="true"
              >
                ✦
              </span>
              <div>
                <strong>Acompanhamento em tempo real</strong>
                <p>
                  Confirmação prévia dos horários de saída de cada van no seu
                  hotel.
                </p>
              </div>
            </div>

            <div className="client-page-support__perk">
              <span
                className="client-page-support__perk-icon"
                aria-hidden="true"
              >
                ✦
              </span>
              <div>
                <strong>Atendimento 100% em português</strong>
                <p>
                  Comunicação acolhedora e direta com quem vive e conhece o
                  México por dentro.
                </p>
              </div>
            </div>

            <div className="client-page-support__perk">
              <span
                className="client-page-support__perk-icon"
                aria-hidden="true"
              >
                ✦
              </span>
              <div>
                <strong>Dicas e recomendações extras</strong>
                <p>
                  Indicações dos melhores restaurantes, praias calmas e segredos
                  locais.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
