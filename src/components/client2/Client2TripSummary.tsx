"use client";

import React from "react";
import type { Client2TripSummaryData } from "@/data/mock-client-2";
import { SITE_CONFIG } from "@/config/site";

interface Client2TripSummaryProps {
  summary: Client2TripSummaryData;
  clientName: string;
}

export default function Client2TripSummary({
  summary,
  clientName,
}: Client2TripSummaryProps) {
  const rawNumber = SITE_CONFIG.whatsapp?.replace(/\D/g, "");
  const whatsappUrl = rawNumber
    ? `https://wa.me/${rawNumber}?text=${encodeURIComponent(
        `Olá, equipe Tio Nenê! Sou ${clientName} e gostaria de tirar uma dúvida sobre o resumo da minha viagem.`
      )}`
    : "#contato";

  const handleDownloadItinerary = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <aside className="client2-summary" aria-labelledby="client2-summary-title">
      <div className="client2-summary__card">
        {/* Título Principal */}
        <h2 className="client2-summary__title" id="client2-summary-title">
          Resumo da<br />
          sua viagem
        </h2>

        {/* 1. Box Check In & Check Out */}
        <div className="client2-summary__check-box">
          {/* Check In */}
          <div className="client2-summary__check-col">
            <span className="client2-summary__check-label">CHECK IN</span>
            <strong className="client2-summary__check-date">
              {summary.arrivalDate}
            </strong>
            <span className="client2-summary__check-sub">
              {summary.arrivalWeekday || "(quarta-feira)"}
            </span>
          </div>

          <div className="client2-summary__check-divider" aria-hidden="true" />

          {/* Check Out */}
          <div className="client2-summary__check-col">
            <span className="client2-summary__check-label">CHECK OUT</span>
            <strong className="client2-summary__check-date">
              {summary.departureDate}
            </strong>
            <span className="client2-summary__check-sub">
              {summary.departureWeekday || "(quarta-feira)"}
            </span>
          </div>
        </div>

        {/* 2. Lista de Metadados: Duração, Hospedagem, Viajantes */}
        <div className="client2-summary__meta-list">
          {/* Duração */}
          <div className="client2-summary__meta-row">
            <div className="client2-summary__meta-icon" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className="client2-summary__meta-info">
              <span className="client2-summary__meta-label">DURAÇÃO</span>
              <strong className="client2-summary__meta-val">
                {summary.duration || "7 noites / 8 dias"}
              </strong>
            </div>
          </div>

          {/* Hospedagem */}
          <div className="client2-summary__meta-row">
            <div className="client2-summary__meta-icon" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 9v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9" />
                <path d="M2 14h20" />
                <path d="M6 14v-4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4" />
              </svg>
            </div>
            <div className="client2-summary__meta-info">
              <span className="client2-summary__meta-label">HOSPEDAGEM</span>
              <strong className="client2-summary__meta-val">
                {summary.destinationCity || "Cancún"}
              </strong>
              <span className="client2-summary__meta-subval">
                {summary.hotel || "Grand Fiesta Americana Coral Beach"}
              </span>
            </div>
          </div>

          {/* Viajantes */}
          <div className="client2-summary__meta-row">
            <div className="client2-summary__meta-icon" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="client2-summary__meta-info">
              <span className="client2-summary__meta-label">VIAJANTES</span>
              <strong className="client2-summary__meta-val">
                {summary.travelers}
              </strong>
              {summary.travelersSub && (
                <span className="client2-summary__meta-subval">
                  {summary.travelersSub}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 3. Box Informações da Reserva */}
        <div className="client2-summary__reserve-box">
          <h3 className="client2-summary__reserve-title">Informações da reserva</h3>

          <div className="client2-summary__reserve-field">
            <span className="client2-summary__field-label">CÓDIGO DA RESERVA</span>
            <strong className="client2-summary__code-val">
              {summary.bookingCode || "GASHHA4556"}
            </strong>
          </div>

          <div className="client2-summary__reserve-field">
            <span className="client2-summary__field-label">INFORMAÇÕES</span>
            <p className="client2-summary__reserve-desc">{summary.bookingNotes}</p>
          </div>
        </div>

        {/* 4. Botão Baixar Meu Roteiro */}
        <button
          type="button"
          onClick={handleDownloadItinerary}
          className="client2-summary__download-btn"
          aria-label="Baixar meu roteiro de viagem"
        >
          BAIXAR MEU ROTEIRO
        </button>

        {/* 5. Box Importante (Amarelo Pastel) */}
        <div className="client2-summary__important-box">
          <h3 className="client2-summary__important-heading">Importante</h3>
          <p className="client2-summary__important-body">
            Os horários de busca serão confirmados até 1 dia antes de cada passeio.
            Todos os passeios incluem transporte ida e volta saindo da sua
            hospedagem.
          </p>
        </div>

        {/* 6. Bloco Precisa de algo? + Fale Conosco */}
        <div className="client2-summary__contact-box">
          <div className="client2-summary__contact-icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <line x1="9" y1="9" x2="15" y2="9" />
              <line x1="9" y1="13" x2="13" y2="13" />
            </svg>
          </div>
          <h3 className="client2-summary__contact-title">Precisa de algo?</h3>
          <p className="client2-summary__contact-text">
            Estamos aqui para personalizar ainda mais a sua experiência.
          </p>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="client2-summary__contact-btn"
            aria-label="Fale conosco pelo WhatsApp"
          >
            FALE CONOSCO
          </a>
        </div>
      </div>
    </aside>
  );
}
