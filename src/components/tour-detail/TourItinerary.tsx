import React from "react";
import { Tour } from "@/data/tours";

interface TourItineraryProps {
  tour: Tour;
}

export default function TourItinerary({ tour }: TourItineraryProps) {
  // Se itinerary estiver vazio ou ausente, oculta elegantemente toda a seção
  if (!tour.itinerary || tour.itinerary.length === 0) {
    return null;
  }

  return (
    <section className="tour-detail-itinerary" id="roteiro">
      <div className="tour-detail-container tour-detail-container--itinerary">
        {/* 1. CABEÇALHO DA SEÇÃO (Ibarra Real Nova, peso 400) */}
        <div className="tour-detail-itinerary__header">
          <span className="tour-detail-itinerary__label">ROTEIRO DA EXPERIÊNCIA</span>
          <h2 className="tour-detail-itinerary__title">O que você vai viver</h2>
          <p className="tour-detail-itinerary__subtitle">
            Uma narrativa planejada etapa por etapa para garantir um ritmo leve, confortável e memorável.
          </p>
        </div>

        {/* 2. TIMELINE VERTICAL EDITORIAL */}
        <div className="tour-detail-itinerary__timeline">
          {tour.itinerary.map((step, idx) => {
            const stepNumber = step.order ?? idx + 1;
            const formattedNumber =
              stepNumber < 10 ? `0${stepNumber}` : `${stepNumber}`;
            const isLast = idx === tour.itinerary.length - 1;

            return (
              <div
                key={step.order || idx}
                className={`tour-detail-itinerary__step ${
                  isLast ? "tour-detail-itinerary__step--last" : ""
                }`}
              >
                {/* Marcador Discreto e Trilha Conectora */}
                <div className="tour-detail-itinerary__marker">
                  <div
                    className="tour-detail-itinerary__bullet"
                    aria-label={`Etapa ${formattedNumber}`}
                  >
                    <span>{formattedNumber}</span>
                  </div>
                  {!isLast && (
                    <div className="tour-detail-itinerary__line" aria-hidden="true" />
                  )}
                </div>

                {/* Conteúdo da Etapa */}
                <div className="tour-detail-itinerary__body">
                  {step.time && step.time.trim().length > 0 && (
                    <span className="tour-detail-itinerary__time">
                      {step.time}
                    </span>
                  )}
                  <h3 className="tour-detail-itinerary__step-title">{step.title}</h3>
                  <p className="tour-detail-itinerary__step-desc">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
