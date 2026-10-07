"use client";

import React, { useState } from "react";
import { Tour } from "@/data/tours";
import { SITE_CONFIG } from "@/config/site";

interface TourBookingBoxProps {
  tour: Tour;
}

// Helper para formatação monetária padrão pt-BR
function formatCurrency(amount: number, currency: string = "R$"): string {
  const code = currency === "USD" ? "USD" : "BRL";
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  }
}

export default function TourBookingBox({ tour }: TourBookingBoxProps) {
  // Data mínima: data atual do navegador (evita datas passadas)
  const today = new Date().toISOString().split("T")[0];

  const [selectedDate, setSelectedDate] = useState("");
  const [adults, setAdults] = useState(2);
  const [childrenCount, setChildrenCount] = useState(0);
  const [infants511, setInfants511] = useState(0);
  const [infants04, setInfants04] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Valores de referência da fonte central de dados
  const adultRate = tour.adultPrice || tour.priceFrom || 0;
  const childRate = tour.childPrice || adultRate;
  const infant511Rate =
    tour.infantPrice !== undefined
      ? tour.infantPrice
      : (tour.childPrice > 0 ? tour.childPrice : Math.round(adultRate * 0.75));
  const infant04Rate = 0; // Cortesia gratuita
  const hasPrices = adultRate > 0;

  // Cálculo local da estimativa
  const calculatedTotal = hasPrices
    ? adults * adultRate +
      childrenCount * childRate +
      infants511 * infant511Rate +
      infants04 * infant04Rate
    : 0;

  // Submissão do fluxo comercial
  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault();

    // Payload estruturado preparado para contratação / integração
    const bookingPayload = {
      slug: tour.slug,
      tourName: tour.name,
      selectedDate: selectedDate || null,
      adults,
      children1217: childrenCount,
      infants511,
      infants04,
      estimatedTotal: calculatedTotal > 0 ? calculatedTotal : null,
      currency: tour.currency || "USD",
      source: "detalhe_passeio",
    };

    console.info("Payload de reserva preparado:", bookingPayload);
    setIsSubmitted(true);

    // Integração via helper global de WhatsApp caso configurado
    if (SITE_CONFIG.whatsapp) {
      const cleanPhone = SITE_CONFIG.whatsapp.replace(/\D/g, "");
      if (cleanPhone) {
        const formattedDateText = selectedDate
          ? ` para a data ${new Date(selectedDate + "T12:00:00").toLocaleDateString("pt-BR")}`
          : "";
        const paxDetails: string[] = [];
        paxDetails.push(`${adults} adulto(s)`);
        if (childrenCount > 0) paxDetails.push(`${childrenCount} criança(s) (12-17 anos)`);
        if (infants511 > 0) paxDetails.push(`${infants511} infante(s) (5-11 anos)`);
        if (infants04 > 0) paxDetails.push(`${infants04} infante(s) (0-4 anos)`);
        const paxText = paxDetails.join(", ");

        const totalText =
          calculatedTotal > 0
            ? ` | Estimativa: ${formatCurrency(calculatedTotal, tour.currency)}`
            : "";

        const message = `Olá, equipe Tio Nenê! Gostaria de reservar o passeio *${tour.name}* (${paxText}${formattedDateText})${totalText}. Podem verificar a disponibilidade?`;
        const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
          message
        )}`;
        window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      }
    }
  };

  return (
    <div className="tour-detail-booking" id="bloco-reserva">
      {/* Coluna Esquerda: Contexto Editorial & Apresentação Comercial */}
      <div className="tour-detail-booking__intro">
        <p className="eyebrow tour-detail-booking__eyebrow">RESERVA & COTAÇÃO PERSONALIZADA</p>
        <h2 className="tour-detail-booking__title">
          Planeje sua experiência em <em className="accent">{tour.name}</em>.
        </h2>
        <p className="tour-detail-booking__desc">
          Selecione a data pretendida e o número de pessoas. Nossa equipe local em Cancún confirma a disponibilidade em tempo real e cuida de cada detalhe do seu roteiro sem compromisso.
        </p>

        {/* Card de Preço Base em Destaque */}
        <div className="tour-detail-booking__price-card">
          <span className="tour-detail-booking__price-tag">TARIFA DE REFERÊNCIA</span>
          <div className="tour-detail-booking__price-main">
            <span className="tour-detail-booking__price-starting">A partir de</span>
            <div className="tour-detail-booking__price-display">
              {hasPrices ? (
                <>
                  <strong className="tour-detail-booking__price-amount">
                    {formatCurrency(tour.priceFrom || adultRate, tour.currency)}
                  </strong>
                  <span className="tour-detail-booking__price-unit"> / por pessoa</span>
                </>
              ) : (
                <strong className="tour-detail-booking__price-amount">
                  Valor sob consulta
                </strong>
              )}
            </div>
          </div>

          {hasPrices && (
            <div className="tour-detail-booking__rates">
              <span className="tour-detail-booking__rate-item">
                Adulto: <strong>{formatCurrency(adultRate, tour.currency)}</strong>
              </span>
              <span className="tour-detail-booking__rate-item">
                Crianças (12-17 anos): <strong>{formatCurrency(childRate, tour.currency)}</strong>
              </span>
              <span className="tour-detail-booking__rate-item">
                Infantes (5-11 anos):{" "}
                <strong>
                  {infant511Rate > 0
                    ? formatCurrency(infant511Rate, tour.currency)
                    : "Sob consulta"}
                </strong>
              </span>
              <span className="tour-detail-booking__rate-item">
                Infantes (0-4 anos):{" "}
                <strong style={{ color: "#F2E8B7" }}>Gratuito</strong>
              </span>
            </div>
          )}
        </div>

        {/* Selos de Confiança e Tranquilidade */}
        <div className="tour-detail-booking__perks">
          <div className="tour-detail-booking__perk">
            <span className="tour-detail-booking__perk-icon">✦</span>
            <span>Infantes de 0 a 4 anos possuem cortesia</span>
          </div>
          <div className="tour-detail-booking__perk">
            <span className="tour-detail-booking__perk-icon">✦</span>
            <span>Sem cobrança imediata no site</span>
          </div>
          <div className="tour-detail-booking__perk">
            <span className="tour-detail-booking__perk-icon">✦</span>
            <span>Atendimento 100% em Português</span>
          </div>
          <div className="tour-detail-booking__perk">
            <span className="tour-detail-booking__perk-icon">✦</span>
            <span>Flexibilidade de alteração de datas</span>
          </div>
        </div>
      </div>

      {/* Coluna Direita: Formulário Interativo de Intenção e Estimativa */}
      <div className="tour-detail-booking__form-wrapper">
        <form className="tour-detail-booking__form" onSubmit={handleSubmitBooking}>
          <div className="tour-detail-booking__form-header">
            <h3 className="tour-detail-booking__form-title">Dados da sua experiência</h3>
            <p className="tour-detail-booking__form-subtitle">Informe suas preferências para calcular a estimativa</p>
          </div>

          {/* Campo Seleção de Data */}
          <div className="tour-detail-booking__field">
            <label htmlFor="booking-date" className="tour-detail-booking__label">
              Data preferencial da experiência
            </label>
            <input
              id="booking-date"
              type="date"
              min={today}
              className="tour-detail-booking__input"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setIsSubmitted(false);
              }}
              aria-describedby="booking-date-hint"
            />
            <small id="booking-date-hint" className="tour-detail-booking__hint">
              Intenção de data. A disponibilidade será confirmada diretamente com você.
            </small>
          </div>

          {/* Seletores de Pessoas (Adultos, Crianças 12-17, Infantes 5-11, Infantes 0-4) */}
          <div className="tour-detail-booking__passengers">
            {/* Adultos (Mínimo 1) */}
            <div className="tour-detail-booking__passenger-type">
              <span className="tour-detail-booking__label">Adultos</span>
              <div className="tour-detail-booking__stepper">
                <button
                  type="button"
                  className="tour-detail-booking__stepper-btn"
                  onClick={() => {
                    setAdults((prev) => Math.max(1, prev - 1));
                    setIsSubmitted(false);
                  }}
                  disabled={adults <= 1}
                  aria-label="Diminuir quantidade de adultos"
                >
                  −
                </button>
                <span
                  className="tour-detail-booking__stepper-value"
                  aria-live="polite"
                >
                  {String(adults).padStart(2, "0")}
                </span>
                <button
                  type="button"
                  className="tour-detail-booking__stepper-btn"
                  onClick={() => {
                    setAdults((prev) => prev + 1);
                    setIsSubmitted(false);
                  }}
                  aria-label="Aumentar quantidade de adultos"
                >
                  +
                </button>
              </div>
            </div>

            {/* Crianças (12 - 17 anos) */}
            <div className="tour-detail-booking__passenger-type">
              <span className="tour-detail-booking__label">
                Crianças (12 - 17 anos)
              </span>
              <div className="tour-detail-booking__stepper">
                <button
                  type="button"
                  className="tour-detail-booking__stepper-btn"
                  onClick={() => {
                    setChildrenCount((prev) => Math.max(0, prev - 1));
                    setIsSubmitted(false);
                  }}
                  disabled={childrenCount <= 0}
                  aria-label="Diminuir quantidade de crianças"
                >
                  −
                </button>
                <span
                  className="tour-detail-booking__stepper-value"
                  aria-live="polite"
                >
                  {String(childrenCount).padStart(2, "0")}
                </span>
                <button
                  type="button"
                  className="tour-detail-booking__stepper-btn"
                  onClick={() => {
                    setChildrenCount((prev) => prev + 1);
                    setIsSubmitted(false);
                  }}
                  aria-label="Aumentar quantidade de crianças"
                >
                  +
                </button>
              </div>
            </div>

            {/* Infantes (5 - 11 anos) */}
            <div className="tour-detail-booking__passenger-type">
              <span className="tour-detail-booking__label">
                Infantes (5 - 11 anos)
              </span>
              <div className="tour-detail-booking__stepper">
                <button
                  type="button"
                  className="tour-detail-booking__stepper-btn"
                  onClick={() => {
                    setInfants511((prev) => Math.max(0, prev - 1));
                    setIsSubmitted(false);
                  }}
                  disabled={infants511 <= 0}
                  aria-label="Diminuir quantidade de infantes (5 a 11 anos)"
                >
                  −
                </button>
                <span
                  className="tour-detail-booking__stepper-value"
                  aria-live="polite"
                >
                  {String(infants511).padStart(2, "0")}
                </span>
                <button
                  type="button"
                  className="tour-detail-booking__stepper-btn"
                  onClick={() => {
                    setInfants511((prev) => prev + 1);
                    setIsSubmitted(false);
                  }}
                  aria-label="Aumentar quantidade de infantes (5 a 11 anos)"
                >
                  +
                </button>
              </div>
            </div>

            {/* Infantes (0 - 4 anos) */}
            <div className="tour-detail-booking__passenger-type">
              <span className="tour-detail-booking__label">
                Infantes (0 - 4 anos)
              </span>
              <div className="tour-detail-booking__stepper">
                <button
                  type="button"
                  className="tour-detail-booking__stepper-btn"
                  onClick={() => {
                    setInfants04((prev) => Math.max(0, prev - 1));
                    setIsSubmitted(false);
                  }}
                  disabled={infants04 <= 0}
                  aria-label="Diminuir quantidade de infantes (0 a 4 anos)"
                >
                  −
                </button>
                <span
                  className="tour-detail-booking__stepper-value"
                  aria-live="polite"
                >
                  {String(infants04).padStart(2, "0")}
                </span>
                <button
                  type="button"
                  className="tour-detail-booking__stepper-btn"
                  onClick={() => {
                    setInfants04((prev) => prev + 1);
                    setIsSubmitted(false);
                  }}
                  aria-label="Aumentar quantidade de infantes (0 a 4 anos)"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Valor Estimado de Referência */}
          {hasPrices && (
            <div className="tour-detail-booking__summary">
              <div className="tour-detail-booking__summary-line">
                <span>{adults} adulto(s) × {formatCurrency(adultRate, tour.currency)}</span>
                <strong>{formatCurrency(adults * adultRate, tour.currency)}</strong>
              </div>

              {childrenCount > 0 && (
                <div className="tour-detail-booking__summary-line">
                  <span>
                    {childrenCount} criança(s) (12 - 17 anos) × {formatCurrency(childRate, tour.currency)}
                  </span>
                  <strong>{formatCurrency(childrenCount * childRate, tour.currency)}</strong>
                </div>
              )}

              {infants511 > 0 && (
                <div className="tour-detail-booking__summary-line">
                  <span>
                    {infants511} infante(s) (5 - 11 anos) × {formatCurrency(infant511Rate, tour.currency)}
                  </span>
                  <strong>{formatCurrency(infants511 * infant511Rate, tour.currency)}</strong>
                </div>
              )}

              {infants04 > 0 && (
                <div className="tour-detail-booking__summary-line">
                  <span>
                    {infants04} infante(s) (0 - 4 anos) × Cortesia
                  </span>
                  <strong style={{ color: "#2E7D32" }}>Gratuito</strong>
                </div>
              )}

              <div className="tour-detail-booking__total">
                <span className="tour-detail-booking__total-label">VALOR ESTIMADO</span>
                <strong className="tour-detail-booking__total-amount">
                  {formatCurrency(calculatedTotal, tour.currency)}
                </strong>
              </div>

              <p className="tour-detail-booking__total-note">
                Confirmação final pela equipe. O valor é uma estimativa de referência.
              </p>
            </div>
          )}

          {/* Feedback de envio consultivo */}
          {isSubmitted && (
            <div className="tour-detail-booking__success-message" role="status">
              <span>✓</span>
              <p>
                Solicitação iniciada com sucesso! Conectando com nossa consultoria para verificar datas e disponibilidade.
              </p>
            </div>
          )}

          {/* CTA Principal */}
          <div className="tour-detail-booking__actions">
            <button type="submit" className="tour-detail-booking__cta-btn">
              QUERO RESERVAR ESTE PASSEIO
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
