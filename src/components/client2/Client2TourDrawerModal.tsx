"use client";

import React, { useEffect } from "react";
import type { Client2Tour } from "@/data/mock-client-2";
import { SITE_CONFIG } from "@/config/site";

interface Client2TourDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tour: Client2Tour | null;
  clientName?: string;
}

export default function Client2TourDrawerModal({
  isOpen,
  onClose,
  tour,
  clientName = "Isabelle",
}: Client2TourDrawerModalProps) {
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

  if (!isOpen || !tour) return null;

  const rawNumber = SITE_CONFIG.whatsapp?.replace(/\D/g, "");
  const whatsappUrl = rawNumber
    ? `https://wa.me/${rawNumber}?text=${encodeURIComponent(
        `Olá, equipe Tio Nenê! Sou ${clientName} e gostaria de tirar uma dúvida sobre o passeio confirmado: ${tour.name}.`
      )}`
    : "#contato";

  const handleDownloadItinerary = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div
      className="client2-drawer-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="client2-drawer-tour-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="client2-drawer-dialog">
        {/* Botão Fechar no Topo */}
        <button
          type="button"
          onClick={onClose}
          className="client2-drawer-close-btn"
          aria-label="Fechar detalhes do passeio"
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
          >
            <line x1="1" y1="1" x2="13" y2="13" />
            <line x1="13" y1="1" x2="1" y2="13" />
          </svg>
        </button>

        {/* 1. Header do Passeio: Título + Badge + Metadados */}
        <div className="client2-drawer-header">
          <div className="client2-drawer-title-row">
            <h2 className="client2-drawer-title" id="client2-drawer-tour-title">
              {tour.name}
            </h2>
            <span className="client2-drawer-badge">{tour.badge || "incluso"}</span>
          </div>

          <div className="client2-drawer-meta-row">
            <div className="client2-drawer-meta-item">
              <svg
                className="client2-drawer-meta-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>{tour.date}</span>
            </div>

            <div className="client2-drawer-meta-item">
              <svg
                className="client2-drawer-meta-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span>{tour.travelers || "2 adultos"}</span>
            </div>
          </div>
        </div>

        {/* 2. Banner do Passeio */}
        <div className="client2-drawer-banner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={tour.image}
            alt={tour.name}
            className="client2-drawer-banner-img"
          />
        </div>

        {/* 3. Barra de Apoio e Botão Baixar Roteiro */}
        <div className="client2-drawer-support-bar">
          <div className="client2-drawer-support-left">
            <span className="client2-drawer-heart-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </span>
            <p className="client2-drawer-support-text">
              Tudo o que você precisa saber para aproveitar seu dia com tranquilidade.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDownloadItinerary}
            className="client2-drawer-download-btn"
            aria-label="Baixar meu roteiro"
          >
            BAIXAR MEU ROTEIRO
          </button>
        </div>

        <hr className="client2-drawer-divider" />

        {/* 4. Seção Horários */}
        <div className="client2-drawer-section">
          <div className="client2-drawer-section-header">
            <span className="client2-drawer-section-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </span>
            <h3 className="client2-drawer-section-title">Horários</h3>
          </div>

          <ul className="client2-drawer-schedule-list">
            <li>
              <strong>Saída do hotel:</strong> {tour.schedule?.hotelDeparture || "07h10"}
            </li>
            <li>
              <strong>Horário de busca:</strong> {tour.schedule?.pickupWindow || "entre 07h00 e 07h20"}
            </li>
            <li>
              <strong>Chegada prevista ao parque:</strong> {tour.schedule?.parkArrival || "09h00"}
            </li>
            <li>
              <strong>Retorno:</strong> {tour.schedule?.returnTime || "após o espetáculo noturno"}
            </li>
            <li>
              <strong>Chegada prevista ao hotel:</strong> {tour.schedule?.hotelReturn || "23h30 aproximadamente"}
            </li>
          </ul>

          <div className="client2-drawer-alert-box">
            <span className="client2-drawer-alert-icon" aria-hidden="true">ⓘ</span>
            <p className="client2-drawer-alert-text">
              {tour.schedule?.scheduleAlert ||
                "Os horários podem sofrer pequenos ajustes. Confirmaremos o horário exato da sua busca até 1 dia antes do passeio."}
            </p>
          </div>
        </div>

        <hr className="client2-drawer-divider" />

        {/* 5. Seção Ponto de encontro */}
        <div className="client2-drawer-section">
          <div className="client2-drawer-section-header">
            <span className="client2-drawer-section-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </span>
            <h3 className="client2-drawer-section-title">Ponto de encontro</h3>
          </div>

          <div className="client2-drawer-meeting-body">
            <p>
              <strong>Local:</strong> {tour.meeting?.location || "Lobby principal do hotel"}
            </p>
            <p>
              <strong>Orientação:</strong> {tour.meeting?.orientation || "esteja no local 10 minutos antes do horário marcado."}
            </p>

            <a
              href={tour.meeting?.mapUrl || "https://maps.google.com"}
              target="_blank"
              rel="noopener noreferrer"
              className="client2-drawer-map-btn"
            >
              Ver localização no mapa
            </a>
          </div>
        </div>

        {/* 6. Seção O que está incluído / O que não está incluído */}
        <div className="client2-drawer-included-box">
          {/* Incluído */}
          <div className="client2-drawer-included-col">
            <h4 className="client2-drawer-included-heading">
              <span className="client2-drawer-check-icon" aria-hidden="true">✓</span>
              <span>O que está incluído</span>
            </h4>
            <ul className="client2-drawer-bullet-list">
              {(tour.included && tour.included.length > 0
                ? tour.included
                : [
                    "Transporte de ida e volta",
                    "Entrada no parque",
                    "Almoço e bebidas (conforme ingresso)",
                    "Armários, snorkel e boias",
                    "Atividades aquáticas",
                    "Espetáculo México Espectacular",
                  ]
              ).map((item, idx) => (
                <li key={idx}>· {item}</li>
              ))}
            </ul>
          </div>

          {/* Não Incluído */}
          <div className="client2-drawer-included-col">
            <h4 className="client2-drawer-included-heading">
              <span className="client2-drawer-cross-icon" aria-hidden="true">✕</span>
              <span>
                O que <em>não</em> está incluído
              </span>
            </h4>
            <ul className="client2-drawer-bullet-list">
              {(tour.notIncluded && tour.notIncluded.length > 0
                ? tour.notIncluded
                : [
                    "Transporte de ida e volta não oficial",
                    "Fotos profissionais no parque",
                    "Atividades opcionais com golfinhos / Sea Trek",
                    "Bebidas alcoólicas fora do almoço buffet",
                    "Despesas pessoais e souvenirs",
                    "Gorjetas voluntárias para guias e motoristas",
                  ]
              ).map((item, idx) => (
                <li key={idx}>· {item}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* 7. Taxas e valores extras */}
        {tour.extraFees && (
          <div className="client2-drawer-section">
            <div className="client2-drawer-section-header">
              <span className="client2-drawer-section-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </span>
              <h3 className="client2-drawer-section-title">Taxas e valores extras</h3>
            </div>
            <p className="client2-drawer-text">{tour.extraFees}</p>
          </div>
        )}

        <hr className="client2-drawer-divider" />

        {/* 8. O que levar */}
        <div className="client2-drawer-section">
          <div className="client2-drawer-section-header">
            <span className="client2-drawer-section-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </span>
            <h3 className="client2-drawer-section-title">O que levar</h3>
          </div>
          <div className="client2-drawer-chips-wrap">
            {(tour.whatToBring && tour.whatToBring.length > 0
              ? tour.whatToBring
              : ["Roupa de banho", "Toalha", "Troca de roupa", "Protetor solar biodegradável"]
            ).map((chip, idx) => (
              <div key={idx} className="client2-drawer-chip">
                <span className="client2-drawer-chip-dot" aria-hidden="true" />
                <span>{chip}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 9. O que não recomendamos levar */}
        <div className="client2-drawer-section">
          <div className="client2-drawer-section-header">
            <span className="client2-drawer-section-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </span>
            <h3 className="client2-drawer-section-title">O que não recomendamos levar</h3>
          </div>
          <ul className="client2-drawer-bullet-list">
            {(tour.whatNotToBring && tour.whatNotToBring.length > 0
              ? tour.whatNotToBring
              : [
                  "Objetos de valor",
                  "Grandes quantias em dinheiro",
                  "Equipamentos que não possam molhar",
                  "Protetor solar comum (não permitido)",
                ]
            ).map((item, idx) => (
              <li key={idx}>· {item}</li>
            ))}
          </ul>
        </div>

        <hr className="client2-drawer-divider" />

        {/* 10. Recomendações da Tio Nenê */}
        <div className="client2-drawer-section">
          <div className="client2-drawer-section-header">
            <span className="client2-drawer-section-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </span>
            <h3 className="client2-drawer-section-title">Recomendações da Tio Nenê</h3>
          </div>
          <ul className="client2-drawer-bullet-list">
            {(tour.recommendations && tour.recommendations.length > 0
              ? tour.recommendations
              : [
                  "Chegue já com a roupa de banho por baixo da roupa e leve uma troca leve para a noite.",
                  "O parque é grande, então priorize as atrações que mais combinam com você.",
                  "Reserve energia para o espetáculo final — é imperdível!",
                  "Almoce entre 13h e 15h para evitar filas e aproveitar melhor o dia.",
                ]
            ).map((rec, idx) => (
              <li key={idx}>· {rec}</li>
            ))}
          </ul>
        </div>

        <hr className="client2-drawer-divider" />

        {/* 11. Informações importantes */}
        <div className="client2-drawer-section">
          <div className="client2-drawer-section-header">
            <span className="client2-drawer-section-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </span>
            <h3 className="client2-drawer-section-title">Informações importantes</h3>
          </div>
          <ul className="client2-drawer-bullet-list">
            {(tour.importantInfo && tour.importantInfo.length > 0
              ? tour.importantInfo
              : [
                  "Crianças de 0 a 4 anos não pagam (mediante documento).",
                  "Algumas atividades possuem restrição de altura e peso.",
                  "Não recomendado para gestantes acima de 6 meses.",
                  "Cancelamentos com até 48h de antecedência terão reembolso conforme política.",
                  "Em caso de chuva, o parque funciona normalmente.",
                ]
            ).map((info, idx) => (
              <li key={idx}>· {info}</li>
            ))}
          </ul>
        </div>

        {/* 12. Card Final: Ainda ficou com alguma dúvida? */}
        <div className="client2-drawer-contact-card">
          <div className="client2-drawer-contact-icon-bubble" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <line x1="9" y1="9" x2="15" y2="9" />
              <line x1="9" y1="13" x2="13" y2="13" />
            </svg>
          </div>
          <h4 className="client2-drawer-contact-title">Ainda ficou com alguma dúvida?</h4>
          <p className="client2-drawer-contact-text">
            Nossa equipe está disponível para ajudar você antes e durante o passeio.
          </p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="client2-drawer-contact-btn"
          >
            FALE CONOSCO
          </a>
        </div>
      </div>
    </div>
  );
}
