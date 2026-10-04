"use client";

import React, { useState } from "react";
import { ClientTour } from "@/data/mock-client";

interface ClientToursProps {
  passeios: ClientTour[];
}

// Utilitário local para formatação humana e editorial de datas dos passeios
function parseTourDate(dateStr: string) {
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    const day = parts[0];
    const monthNum = parseInt(parts[1], 10);
    const year = parts[2];
    const monthsShort = [
      "JAN",
      "FEV",
      "MAR",
      "ABR",
      "MAI",
      "JUN",
      "JUL",
      "AGO",
      "SET",
      "OUT",
      "NOV",
      "DEZ",
    ];
    const monthsFull = [
      "janeiro",
      "fevereiro",
      "março",
      "abril",
      "maio",
      "junho",
      "julho",
      "agosto",
      "setembro",
      "outubro",
      "novembro",
      "dezembro",
    ];
    const monthIdx = monthNum - 1;
    return {
      day,
      monthShort: monthsShort[monthIdx] || "",
      monthFull: monthsFull[monthIdx] || "",
      year,
      displayFull: `${parseInt(day, 10)} de ${monthsFull[monthIdx] || ""} de ${year}`,
      displayBadge: `${day} ${monthsShort[monthIdx] || ""}`,
    };
  }
  return {
    day: dateStr,
    monthShort: "",
    monthFull: "",
    year: "",
    displayFull: dateStr,
    displayBadge: dateStr,
  };
}

export default function ClientTours({ passeios }: ClientToursProps) {
  // Todos os passeios iniciam fechados; apenas um aberto por vez
  const [expandedTourId, setExpandedTourId] = useState<string | null>(null);

  const toggleDetails = (tourId: string) => {
    setExpandedTourId((prev) => (prev === tourId ? null : tourId));
  };

  return (
    <section
      className="client-page-tours"
      id="passeios"
      aria-labelledby="client-tours-title"
    >
      <div className="client-page-container">
        {/* Abertura Editorial com presença de destaque */}
        <div className="client-page-tours__header">
          <div className="client-page-tours__heading-col">
            <p className="eyebrow client-page-tours__eyebrow">SUAS EXPERIÊNCIAS</p>
            <h2 id="client-tours-title" className="client-page-tours__title">
              Seus <em className="accent">passeios</em>.
            </h2>
          </div>
          <div className="client-page-tours__desc-col">
            <p className="client-page-tours__desc">
              Tudo o que você escolheu para viver no México, organizado com
              horários de saída, pontos de encontro e roteiros detalhados.
            </p>
          </div>
        </div>

        {/* Lista Dinâmica de Passeios Contratados */}
        <div className="client-page-tours__list">
          {passeios.map((tour) => {
            const isExpanded = expandedTourId === tour.id;
            const dateInfo = parseTourDate(tour.data);

            return (
              <article
                key={tour.id}
                className={`client-page-tour-card ${
                  isExpanded ? "client-page-tour-card--open" : ""
                }`}
              >
                {/* Layout Principal do Card (Horizontal no Desktop) */}
                <div className="client-page-tour-card__layout">
                  {/* Fotografia de Grande Presença */}
                  <div className="client-page-tour-card__media">
                    <img
                      src={tour.imagem}
                      alt={tour.nome}
                      className="client-page-tour-card__image"
                      loading="lazy"
                    />
                    {/* Badge de Data Flutuante na Imagem */}
                    <div className="client-page-tour-card__media-badge">
                      <span className="client-page-tour-card__media-badge-day">
                        {dateInfo.day}
                      </span>
                      <span className="client-page-tour-card__media-badge-month">
                        {dateInfo.monthShort}
                      </span>
                    </div>
                  </div>

                  {/* Informações Principais Integradas */}
                  <div className="client-page-tour-card__content">
                    {/* Linha Superior: Data por extenso & Selo de Status */}
                    <div className="client-page-tour-card__meta-top">
                      <span className="client-page-tour-card__date-text">
                        {dateInfo.displayFull}
                      </span>
                      <span className="client-page-seal client-page-seal--confirmed">
                        <span
                          className="client-page-seal__dot"
                          aria-hidden="true"
                        />
                        {tour.status}
                      </span>
                    </div>

                    {/* Título Serifado Nobre */}
                    <h3
                      id={`tour-title-${tour.id}`}
                      className="client-page-tour-card__name"
                    >
                      {tour.nome}
                    </h3>

                    {/* Descrição Curta Editorial */}
                    {tour.descricao && (
                      <p className="client-page-tour-card__description">
                        {tour.descricao}
                      </p>
                    )}

                    {/* Agrupamento Operacional Integrado (Sem mini-cards soltos) */}
                    <div className="client-page-tour-card__specs-row">
                      <div className="client-page-tour-card__spec-item">
                        <span className="client-page-tour-card__spec-label">
                          SAÍDA
                        </span>
                        <strong className="client-page-tour-card__spec-val">
                          {tour.horarioSaida}
                        </strong>
                      </div>

                      <div
                        className="client-page-tour-card__spec-sep"
                        aria-hidden="true"
                      />

                      <div className="client-page-tour-card__spec-item">
                        <span className="client-page-tour-card__spec-label">
                          DURAÇÃO
                        </span>
                        <strong className="client-page-tour-card__spec-val">
                          {tour.duracao}
                        </strong>
                      </div>

                      <div
                        className="client-page-tour-card__spec-sep"
                        aria-hidden="true"
                      />

                      <div className="client-page-tour-card__spec-item client-page-tour-card__spec-item--wide">
                        <span className="client-page-tour-card__spec-label">
                          LOCAL DE ENCONTRO
                        </span>
                        <strong className="client-page-tour-card__spec-val">
                          {tour.localEncontro}
                        </strong>
                      </div>
                    </div>

                    {/* Botão de Ação / Accordion */}
                    <div className="client-page-tour-card__actions">
                      <button
                        type="button"
                        className="client-page-tour-card__toggle-btn"
                        onClick={() => toggleDetails(tour.id)}
                        aria-expanded={isExpanded}
                        aria-controls={`tour-details-${tour.id}`}
                      >
                        <span>
                          {isExpanded
                            ? "FECHAR INFORMAÇÕES"
                            : "VER INFORMAÇÕES"}
                        </span>
                        <svg
                          className={`client-page-tour-card__chevron ${
                            isExpanded
                              ? "client-page-tour-card__chevron--rotated"
                              : ""
                          }`}
                          width="12"
                          height="8"
                          viewBox="0 0 12 8"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          aria-hidden="true"
                        >
                          <path
                            d="M1.5 1.75L6 6.25L10.5 1.75"
                            stroke="currentColor"
                            strokeWidth="1.75"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Conteúdo Expandido dos Detalhes (Sem rota externa, sem modal) */}
                {isExpanded && (
                  <div
                    id={`tour-details-${tour.id}`}
                    className="client-page-tour-card__expanded"
                    role="region"
                    aria-labelledby={`tour-title-${tour.id}`}
                  >
                    {/* Grade de 2 Colunas: O que inclui & O que levar */}
                    <div className="client-page-tour-card__expanded-grid">
                      {/* O que está incluído */}
                      {tour.inclui && tour.inclui.length > 0 && (
                        <div className="client-page-tour-card__expanded-col">
                          <span className="client-page-tour-card__expanded-label">
                            O QUE ESTÁ INCLUÍDO
                          </span>
                          <ul className="client-page-tour-card__list">
                            {tour.inclui.map((item, idx) => (
                              <li key={idx}>
                                <span
                                  className="client-page-tour-card__check"
                                  aria-hidden="true"
                                >
                                  ✓
                                </span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* O que sugerimos levar */}
                      {tour.oQueLevar && tour.oQueLevar.length > 0 && (
                        <div className="client-page-tour-card__expanded-col">
                          <span className="client-page-tour-card__expanded-label">
                            O QUE SUGERIMOS LEVAR
                          </span>
                          <ul className="client-page-tour-card__list">
                            {tour.oQueLevar.map((item, idx) => (
                              <li key={idx}>
                                <span
                                  className="client-page-tour-card__bullet"
                                  aria-hidden="true"
                                >
                                  ✦
                                </span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Roteiro da Programação do Dia */}
                    {tour.roteiro && tour.roteiro.length > 0 && (
                      <div className="client-page-tour-card__itinerary-section">
                        <span className="client-page-tour-card__expanded-label">
                          ROTEIRO DA EXPERIÊNCIA
                        </span>
                        <div className="client-page-tour-card__itinerary-timeline">
                          {tour.roteiro.map((etapa, idx) => (
                            <div
                              key={idx}
                              className="client-page-tour-card__itinerary-step"
                            >
                              <span className="client-page-tour-card__step-num">
                                {String(idx + 1).padStart(2, "0")}
                              </span>
                              <span className="client-page-tour-card__step-desc">
                                {etapa}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Observações Operacionais e Recomendações */}
                    {tour.observacoes && (
                      <div className="client-page-tour-card__note-box">
                        <span
                          className="client-page-tour-card__note-icon"
                          aria-hidden="true"
                        >
                          ⓘ
                        </span>
                        <div className="client-page-tour-card__note-text">
                          <strong>Observação importante:</strong>{" "}
                          {tour.observacoes}
                        </div>
                      </div>
                    )}

                    {/* Reforço das Informações Operacionais no Rodapé Expandido */}
                    <div className="client-page-tour-card__expanded-footer">
                      <div className="client-page-tour-card__footer-item">
                        <span className="client-page-tour-card__footer-label">
                          DATA CONFIRMADA
                        </span>
                        <strong>{dateInfo.displayFull}</strong>
                      </div>
                      <div className="client-page-tour-card__footer-item">
                        <span className="client-page-tour-card__footer-label">
                          HORÁRIO DE EMBARQUE
                        </span>
                        <strong>{tour.horarioSaida}</strong>
                      </div>
                      <div className="client-page-tour-card__footer-item">
                        <span className="client-page-tour-card__footer-label">
                          LOCALIZAÇÃO
                        </span>
                        <strong>{tour.localEncontro}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
