"use client";

import React, { useEffect, useState } from "react";
import { Tour, getTourBySlug } from "@/data/tours";
import { SITE_CONFIG } from "@/config/site";

interface TourDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  tourSlug: string | null;
  onAddToTrip?: (tourId: string, tourName: string) => void;
}

export default function TourDetailModal({
  isOpen,
  onClose,
  tourSlug,
  onAddToTrip,
}: TourDetailModalProps) {
  const [addedToast, setAddedToast] = useState(false);

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

  // Reset toast when changing tour or opening
  useEffect(() => {
    if (isOpen) {
      setAddedToast(false);
    }
  }, [isOpen, tourSlug]);

  if (!isOpen || !tourSlug) return null;

  const tour: Tour | undefined = getTourBySlug(tourSlug);
  if (!tour) return null;

  const handleAddClick = () => {
    if (onAddToTrip) {
      onAddToTrip(tour.slug, tour.name);
      setAddedToast(true);
      setTimeout(() => {
        setAddedToast(false);
      }, 3000);
    }
  };

  const handleWhatsAppInquiry = () => {
    const whatsapp = (SITE_CONFIG.whatsapp || "529981234567").replace(/\D/g, "");
    const message = [
      "Olá, equipe Tio Nenê! Gostaria de solicitar informações sobre o passeio:",
      "",
      `*PASSEIO:* ${tour.name}`,
      `*CATEGORIA:* ${tour.category}`,
      `*DURAÇÃO:* ${tour.duration}`,
      `*VALOR A PARTIR DE:* ${tour.currency} ${tour.priceFrom.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} por pessoa`,
      "",
      "Poderiam me enviar mais detalhes sobre disponibilidade e reserva?",
    ].join("\n");

    const whatsappUrl = `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className="package-modal-overlay trip-modal-overlay tour-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="trip-modal-dialog tour-modal-dialog">
        {/* 1. Imagem de Capa com Botão Fechar em Sobreposição */}
        <div className="trip-modal-banner tour-modal-banner">
          <img
            src={tour.heroImage}
            alt={tour.name}
            className="trip-modal-banner-img tour-modal-banner-img"
          />
          <button
            type="button"
            className="trip-modal-banner-close tour-modal-banner-close"
            onClick={onClose}
            aria-label="Fechar detalhes do passeio"
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

        {/* 2. Conteúdo Textual em Fundo Claro Uniforme */}
        <div className="trip-modal-content tour-modal-content">
          <div className="trip-modal-body tour-modal-body">
            {/* Eyebrow / Categoria */}
            <span className="trip-modal-tag tour-modal-tag">
              {tour.category}
            </span>

            {/* Título do Passeio */}
            <h2 className="trip-modal-title tour-modal-title" id="tour-modal-title">
              {tour.name}
            </h2>

            {/* Linha de Características com Ícones Terracota */}
            <div className="trip-modal-features tour-modal-features">
              {/* Duração */}
              {tour.duration && (
                <div className="trip-modal-feature-item">
                  <span className="trip-modal-feature-icon" aria-hidden="true">
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </span>
                  <span className="trip-modal-feature-text">{tour.duration}</span>
                </div>
              )}

              {/* Localização */}
              {tour.location && (
                <div className="trip-modal-feature-item">
                  <span className="trip-modal-feature-icon" aria-hidden="true">
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </span>
                  <span className="trip-modal-feature-text">{tour.location}</span>
                </div>
              )}

              {/* Idade Mínima */}
              {tour.minimumAge && (
                <div className="trip-modal-feature-item">
                  <span className="trip-modal-feature-icon" aria-hidden="true">
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <span className="trip-modal-feature-text">{tour.minimumAge}</span>
                </div>
              )}
            </div>

            {/* Subtítulo / Resumo Editorial */}
            <div className="trip-modal-intro tour-modal-intro">
              {tour.shortDescription && (
                <p className="trip-modal-subtitle tour-modal-subtitle">
                  {tour.shortDescription}
                </p>
              )}
              <p className="trip-modal-desc tour-modal-desc">{tour.description}</p>
            </div>

            {/* Conteúdo em Duas Colunas: O Que Inclui & O Que Levar */}
            <div className="trip-modal-columns tour-modal-columns">
              {/* Coluna 1: O QUE ESTÁ INCLUSO */}
              {tour.included && tour.included.length > 0 && (
                <div className="trip-modal-col tour-modal-col">
                  <span className="trip-modal-section-title tour-modal-section-title">
                    O QUE ESTÁ INCLUSO
                  </span>
                  <ul className="trip-modal-composed-list tour-modal-composed-list">
                    {tour.included.map((item, idx) => (
                      <li key={idx} className="trip-modal-composed-item tour-modal-composed-item">
                        <span className="trip-modal-check-mark" aria-hidden="true">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Coluna 2: O QUE LEVAR / INFORMAÇÕES ÚTEIS */}
              <div className="trip-modal-col tour-modal-col">
                <span className="trip-modal-section-title tour-modal-section-title">
                  O QUE LEVAR
                </span>
                <ul className="trip-modal-composed-list tour-modal-composed-list">
                  {tour.whatToBring && tour.whatToBring.length > 0 ? (
                    tour.whatToBring.map((item, idx) => (
                      <li key={idx} className="trip-modal-composed-item tour-modal-composed-item">
                        <span className="trip-modal-check-mark" aria-hidden="true">•</span>
                        <span>{item}</span>
                      </li>
                    ))
                  ) : (
                    <li className="trip-modal-composed-item tour-modal-composed-item">
                      <span>Protetor solar biodegradável, roupas leves e câmera.</span>
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* Roteiro / Programação do Passeio */}
            {tour.itinerary && tour.itinerary.length > 0 && (
              <div className="trip-modal-itinerary-section tour-modal-itinerary-section">
                <span className="trip-modal-section-title tour-modal-section-title">
                  PROGRAMAÇÃO DO PASSEIO
                </span>
                <ul className="trip-modal-itinerary-list tour-modal-itinerary-list">
                  {tour.itinerary.map((step, idx) => (
                    <li key={idx} className="trip-modal-itinerary-item tour-modal-itinerary-item">
                      <span className="trip-modal-arrow-mark" aria-hidden="true">→</span>
                      <span>
                        <strong>{step.time ? `${step.time} — ` : ""}{step.title}:</strong>{" "}
                        {step.description}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Preço no Rodapé */}
            <div className="trip-modal-price-section tour-modal-price-section">
              <span className="trip-modal-price-prefix">a partir de</span>
              <div className="trip-modal-price-row">
                <strong className="trip-modal-price-amount">
                  {tour.currency} {tour.priceFrom.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </strong>
                <span className="trip-modal-price-suffix">por pessoa</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="trip-modal-ctas tour-modal-ctas">
              <button
                type="button"
                className="trip-modal-btn-primary tour-modal-btn-primary"
                onClick={handleAddClick}
              >
                {addedToast ? "✓ Adicionado ao seu roteiro!" : "+ Adicionar ao meu roteiro"}
              </button>

              <button
                type="button"
                className="trip-modal-btn-secondary tour-modal-btn-secondary"
                onClick={handleWhatsAppInquiry}
              >
                Consultar no WhatsApp
              </button>
            </div>

            {/* Disclaimer Final */}
            <p className="trip-modal-disclaimer tour-modal-disclaimer">
              {tour.cancellationPolicy ||
                "Cancelamento gratuito com até 24 horas de antecedência ao dia do passeio."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
