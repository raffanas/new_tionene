import React from "react";
import Link from "next/link";
import { Tour } from "@/data/tours";

interface TourHeroProps {
  tour: Tour;
}

export default function TourHero({ tour }: TourHeroProps) {
  const hasPrice = tour.priceFrom && tour.priceFrom > 0;

  return (
    <section className="tour-detail-hero" id="hero">
      <div className="tour-detail-container">
        {/* 1. BREADCRUMB DISCRETO E ELEGANTE */}
        <nav className="tour-detail-hero__breadcrumb" aria-label="Navegação estrutural">
          <Link href="/passeios" className="tour-detail-hero__breadcrumb-link">
            Passeios
          </Link>
          <span className="tour-detail-hero__breadcrumb-sep">/</span>
          <span className="tour-detail-hero__breadcrumb-current" aria-current="page">
            {tour.name}
          </span>
        </nav>

        {/* 2. ESTRUTURA HERO (2 COLUNAS NO DESKTOP, EMPILHADO NO MOBILE) */}
        <div className="tour-detail-hero__layout">
          {/* Coluna Textual */}
          <div className="tour-detail-hero__info">
            {/* Categoria com eyebrow padrão do site */}
            <p className="eyebrow tour-detail-hero__category">{tour.category}</p>

            {/* Título Principal com maior escala — Ibarra Real Nova */}
            <h1 className="tour-detail-hero__title">{tour.name}</h1>

            {/* Descrição curta editorial */}
            <p className="tour-detail-hero__short-desc">{tour.shortDescription}</p>

            {/* Informações rápidas em bloco harmônico */}
            <div className="tour-detail-hero__quick-facts" role="list">
              <div className="tour-detail-hero__fact" role="listitem">
                <span className="tour-detail-hero__fact-label">Duração</span>
                <strong className="tour-detail-hero__fact-value">{tour.duration}</strong>
              </div>
              <div className="tour-detail-hero__fact-divider" aria-hidden="true" />
              <div className="tour-detail-hero__fact" role="listitem">
                <span className="tour-detail-hero__fact-label">Localização</span>
                <strong className="tour-detail-hero__fact-value">{tour.location}</strong>
              </div>
              {tour.startTime && (
                <>
                  <div className="tour-detail-hero__fact-divider" aria-hidden="true" />
                  <div className="tour-detail-hero__fact" role="listitem">
                    <span className="tour-detail-hero__fact-label">Horário</span>
                    <strong className="tour-detail-hero__fact-value">
                      {tour.startTime}
                      {tour.endTime ? ` às ${tour.endTime}` : ""}
                    </strong>
                  </div>
                </>
              )}
            </div>

            {/* Preço de referência em destaque nobre */}
            <div className="tour-detail-hero__pricing">
              <span className="tour-detail-hero__price-label">Tarifa inicial de referência:</span>
              <div className="tour-detail-hero__price-badge">
                {hasPrice ? (
                  <>
                    <span className="tour-detail-hero__price-from">A partir de</span>
                    <strong className="tour-detail-hero__price-val">
                      {tour.currency} ${tour.priceFrom}
                    </strong>
                    <span className="tour-detail-hero__price-person">/ por pessoa</span>
                  </>
                ) : (
                  <strong className="tour-detail-hero__price-val">Sob consulta</strong>
                )}
              </div>
            </div>

            {/* CTA Principal e Secundário com maior presença */}
            <div className="tour-detail-hero__cta-group">
              <a href="#reserva" className="tour-detail-hero__cta-primary">
                QUERO ESTE PASSEIO
              </a>
              <a href="#galeria" className="tour-detail-hero__cta-secondary">
                Ver fotos
              </a>
            </div>
          </div>

          {/* Coluna Imagem Principal */}
          <div className="tour-detail-hero__media">
            <div className="tour-detail-hero__image-frame">
              <img
                src={tour.heroImage}
                alt={tour.name}
                className="tour-detail-hero__image"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
