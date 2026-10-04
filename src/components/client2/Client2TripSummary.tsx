import React from "react";
import type { Client2TripSummaryData } from "@/data/mock-client-2";
import { SITE_CONFIG } from "@/config/site";

interface Client2TripSummaryProps {
  summary: Client2TripSummaryData;
  clientName: string;
}

export default function Client2TripSummary({ summary, clientName }: Client2TripSummaryProps) {
  const rawNumber = SITE_CONFIG.whatsapp?.replace(/\D/g, "");
  const whatsappUrl = rawNumber
    ? `https://wa.me/${rawNumber}?text=${encodeURIComponent(
        `Olá, equipe Tio Nenê! Sou a ${clientName} e gostaria de tirar uma dúvida sobre o resumo e os detalhes da minha viagem a Cancún.`
      )}`
    : "#contato";

  return (
    <aside className="client2-summary" aria-labelledby="client2-summary-title">
      <div className="client2-summary__card">
        {/* ========================================================================= */}
        {/* 1. BLOCO PRINCIPAL: Resumo da sua viagem                                 */}
        {/* ========================================================================= */}
        <div className="client2-summary__header">
          <span className="client2-summary__eyebrow">ESTADIA NO MÉXICO</span>
          <h2 className="client2-summary__title" id="client2-summary-title">
            Resumo da sua viagem
          </h2>
          <p className="client2-summary__subtitle">
            Datas, hospedagem e estrutura confirmadas para a sua estadia.
          </p>
        </div>

        {/* Lista de dados essenciais */}
        <div className="client2-summary__section">
          {/* Hotel */}
          <div className="client2-summary__item">
            <div className="client2-summary__icon-box" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <div className="client2-summary__item-content">
              <span className="client2-summary__item-label">Hotel &amp; Resort</span>
              <strong className="client2-summary__item-val">{summary.hotel}</strong>
              {summary.roomType && (
                <span className="client2-summary__item-subval">{summary.roomType}</span>
              )}
            </div>
          </div>

          {/* Chegada & Retorno */}
          <div className="client2-summary__item">
            <div className="client2-summary__icon-box" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div className="client2-summary__item-content">
              <span className="client2-summary__item-label">Período de Estadia</span>
              <div className="client2-summary__dates-row">
                <div className="client2-summary__date-col">
                  <span className="client2-summary__date-tag">Chegada</span>
                  <strong className="client2-summary__item-val">{summary.arrivalDate}</strong>
                </div>
                <span className="client2-summary__date-sep" aria-hidden="true">→</span>
                <div className="client2-summary__date-col">
                  <span className="client2-summary__date-tag">Retorno</span>
                  <strong className="client2-summary__item-val">{summary.departureDate}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Viajantes */}
          <div className="client2-summary__item">
            <div className="client2-summary__icon-box" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="client2-summary__item-content">
              <span className="client2-summary__item-label">Viajantes</span>
              <strong className="client2-summary__item-val">{summary.travelers}</strong>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. BLOCO SECUNDÁRIO: Informações da reserva                               */}
        {/* ========================================================================= */}
        <div className="client2-summary__reserve-block">
          <div className="client2-summary__block-header">
            <span className="client2-summary__block-tag">RESERVA</span>
            <h3 className="client2-summary__block-title">Informações da reserva</h3>
          </div>
          <p className="client2-summary__reserve-text">
            {summary.bookingNotes}
          </p>
        </div>

        {/* ========================================================================= */}
        {/* 3. BLOCO IMPORTANTE                                                       */}
        {/* ========================================================================= */}
        <div className="client2-summary__important-block">
          <div className="client2-summary__important-header">
            <span className="client2-summary__important-icon" aria-hidden="true">💡</span>
            <strong className="client2-summary__important-title">Importante</strong>
          </div>
          <p className="client2-summary__important-text">
            Confira sempre os horários e orientações de cada passeio antes do dia da experiência.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* 4. CTA LATERAL: FALAR COM NOSSA EQUIPE                                    */}
        {/* ========================================================================= */}
        <div className="client2-summary__cta-wrap">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="client2-summary__cta-btn"
            aria-label="Falar com nossa equipe pelo WhatsApp"
          >
            <span>FALAR COM NOSSA EQUIPE</span>
            <svg
              className="client2-summary__cta-wa-icon"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.539 1.772.82 2.791.82 3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.587-5.806-5.768-5.806zm3.374 8.232c-.143.402-.83.743-1.15.789-.319.046-.732.062-2.127-.487-1.396-.549-2.275-1.979-2.345-2.073-.07-.094-.564-.75-.564-1.428 0-.678.354-1.011.48-1.152.125-.141.274-.176.365-.176.091 0 .183.001.263.005.084.004.197-.032.308.234.114.274.388.948.423 1.018.034.07.057.153.011.246-.046.094-.069.153-.137.234-.069.082-.144.183-.206.246-.069.07-.14.146-.06.284.08.138.355.586.762.949.524.467.965.611 1.103.68.137.069.217.058.297-.034.08-.093.343-.4.434-.537.092-.138.183-.115.309-.069.126.046.799.377.936.446.137.069.229.103.263.161.034.057.034.331-.109.733z" />
            </svg>
          </a>
        </div>
      </div>
    </aside>
  );
}
