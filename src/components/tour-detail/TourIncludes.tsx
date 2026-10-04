import React from "react";
import { Tour } from "@/data/tours";

interface TourIncludesProps {
  tour: Tour;
}

export default function TourIncludes({ tour }: TourIncludesProps) {
  const hasIncluded = Boolean(tour.included && tour.included.length > 0);
  const hasNotIncluded = Boolean(tour.notIncluded && tour.notIncluded.length > 0);

  // Se ambas as listas estiverem vazias, não renderiza a seção
  if (!hasIncluded && !hasNotIncluded) {
    return null;
  }

  const layoutClass =
    hasIncluded && hasNotIncluded
      ? "tour-detail-includes__grid--two-cols"
      : "tour-detail-includes__grid--single-col";

  return (
    <section className="tour-detail-includes" id="inclusoes">
      <div className="tour-detail-container tour-detail-container--includes">
        {/* Cabeçalho da Seção */}
        <div className="tour-detail-includes__header">
          <span className="tour-detail-includes__label">TRANSPARÊNCIA TOTAL</span>
          <h2 className="tour-detail-includes__main-title">O que esperar do seu dia</h2>
        </div>

        {/* Grid de 2 colunas no desktop, empilhadas no mobile */}
        <div className={`tour-detail-includes__grid ${layoutClass}`}>
          {/* Coluna 1: Inclui */}
          {hasIncluded && (
            <div className="tour-detail-includes__column tour-detail-includes__column--included">
              <div className="tour-detail-includes__col-header">
                <span
                  className="tour-detail-includes__icon-indicator tour-detail-includes__icon-indicator--check"
                  aria-hidden="true"
                >
                  ✓
                </span>
                <h3 className="tour-detail-includes__title">Inclui</h3>
              </div>
              <ul className="tour-detail-includes__list" role="list">
                {tour.included.map((item, idx) => (
                  <li key={idx} className="tour-detail-includes__item">
                    <span
                      className="tour-detail-includes__bullet tour-detail-includes__bullet--check"
                      aria-hidden="true"
                    >
                      ✓
                    </span>
                    <span className="tour-detail-includes__item-text">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Coluna 2: Não inclui */}
          {hasNotIncluded && (
            <div className="tour-detail-includes__column tour-detail-includes__column--not-included">
              <div className="tour-detail-includes__col-header">
                <span
                  className="tour-detail-includes__icon-indicator tour-detail-includes__icon-indicator--dash"
                  aria-hidden="true"
                >
                  —
                </span>
                <h3 className="tour-detail-includes__title">Não inclui</h3>
              </div>
              <ul className="tour-detail-includes__list" role="list">
                {tour.notIncluded.map((item, idx) => (
                  <li key={idx} className="tour-detail-includes__item">
                    <span
                      className="tour-detail-includes__bullet tour-detail-includes__bullet--dash"
                      aria-hidden="true"
                    >
                      —
                    </span>
                    <span className="tour-detail-includes__item-text">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
