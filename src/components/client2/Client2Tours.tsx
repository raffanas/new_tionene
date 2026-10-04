import React from "react";
import Link from "next/link";
import type { Client2Tour } from "@/data/mock-client-2";

interface Client2ToursProps {
  tours: Client2Tour[];
}

export default function Client2Tours({ tours }: Client2ToursProps) {
  return (
    <section className="client2-tours" id="passeios-confirmados" aria-labelledby="client2-tours-title">
      <div className="client2-tours__header">
        <span className="client2-tours__eyebrow">ROTEIRO</span>
        <h2 className="client2-tours__title" id="client2-tours-title">
          Seus passeios confirmados
        </h2>
        <p className="client2-tours__subtitle">
          Tudo certo para você aproveitar cada experiência com tranquilidade.
        </p>
      </div>

      <div className="client2-tours__list">
        {tours.map((tour, index) => (
          <article key={tour.id} className="client2-tour-card" aria-labelledby={`tour-title-${tour.id}`}>
            {/* Imagem com moldura editorial à esquerda */}
            <div className="client2-tour-card__media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={tour.image}
                alt={tour.name}
                className="client2-tour-card__image"
                loading="lazy"
              />
              <div className="client2-tour-card__status-badge" role="status">
                <span className="client2-tour-card__status-dot" aria-hidden="true" />
                <span>{tour.status}</span>
              </div>
              <span className="client2-tour-card__order">0{index + 1}</span>
            </div>

            {/* Conteúdo à direita */}
            <div className="client2-tour-card__content">
              {/* Metadados práticos: Data, Horário e Duração */}
              <div className="client2-tour-card__meta">
                <div className="client2-tour-card__meta-item">
                  <svg className="client2-tour-card__meta-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span className="client2-tour-card__meta-text"><strong>{tour.date}</strong></span>
                </div>

                <div className="client2-tour-card__meta-item">
                  <svg className="client2-tour-card__meta-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span className="client2-tour-card__meta-text">{tour.time}</span>
                </div>

                <div className="client2-tour-card__meta-item">
                  <svg className="client2-tour-card__meta-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  <span className="client2-tour-card__meta-text">{tour.duration}</span>
                </div>
              </div>

              {/* Título do passeio */}
              <h3 className="client2-tour-card__title" id={`tour-title-${tour.id}`}>
                {tour.name}
              </h3>

              {/* Descrição curta */}
              <p className="client2-tour-card__desc">{tour.shortDescription}</p>

              {/* Ponto / Local de encontro */}
              <div className="client2-tour-card__meeting">
                <div className="client2-tour-card__meeting-header">
                  <svg className="client2-tour-card__meeting-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span className="client2-tour-card__meeting-label">Ponto de Encontro</span>
                </div>
                <span className="client2-tour-card__meeting-text">{tour.meetingPoint}</span>
              </div>

              {/* Botão para ver detalhes do passeio */}
              <div className="client2-tour-card__actions">
                <Link
                  href={tour.detailsUrl}
                  className="client2-tour-card__btn"
                  aria-label={`Ver detalhes do passeio ${tour.name}`}
                >
                  <span>VER DETALHES DO PASSEIO</span>
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
