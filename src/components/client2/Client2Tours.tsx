"use client";

import React, { useState } from "react";
import type { Client2Tour } from "@/data/mock-client-2";
import Client2TourDrawerModal from "@/components/client2/Client2TourDrawerModal";

interface Client2ToursProps {
  tours: Client2Tour[];
}

export default function Client2Tours({ tours }: Client2ToursProps) {
  const [selectedTour, setSelectedTour] = useState<Client2Tour | null>(null);

  return (
    <>
      <section
        className="client2-tours"
        id="passeios-confirmados"
        aria-labelledby="client2-tours-title"
      >
        <div className="client2-tours__header">
          <span className="client2-tours__eyebrow">ROTEIRO</span>
          <h2 className="client2-tours__title" id="client2-tours-title">
            Seus passeios<br />
            confirmados
          </h2>
          <p className="client2-tours__subtitle">
            Tudo certo para viver experiências incríveis. Qualquer dúvida, é só falar com a gente!
          </p>
        </div>

        <div className="client2-tours__list">
          {tours.map((tour) => (
            <article
              key={tour.id}
              className="client2-tour-card"
              aria-labelledby={`tour-title-${tour.id}`}
            >
              {/* Imagem compacta com bordas arredondadas à esquerda */}
              <div className="client2-tour-card__media">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={tour.image}
                  alt={tour.name}
                  className="client2-tour-card__image"
                  loading="lazy"
                />
              </div>

              {/* Conteúdo à direita com tipografia limpa */}
              <div className="client2-tour-card__content">
                {/* Linha superior: Nome do passeio + Badge Incluso */}
                <div className="client2-tour-card__title-row">
                  <h3
                    className="client2-tour-card__title"
                    id={`tour-title-${tour.id}`}
                  >
                    {tour.name}
                  </h3>
                  <span className="client2-tour-card__badge">
                    {tour.badge || "incluso"}
                  </span>
                </div>

                {/* Descrição curta e objetiva */}
                <p className="client2-tour-card__desc">{tour.shortDescription}</p>

                {/* Metadados: Data (com dia da semana) e Passageiros */}
                <div className="client2-tour-card__meta">
                  <div className="client2-tour-card__meta-item">
                    <svg
                      className="client2-tour-card__meta-svg"
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
                    <span className="client2-tour-card__meta-text">{tour.date}</span>
                  </div>

                  <div className="client2-tour-card__meta-item">
                    <svg
                      className="client2-tour-card__meta-svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span className="client2-tour-card__meta-text">
                      {tour.travelers || "2 adultos"}
                    </span>
                  </div>
                </div>

                {/* Botão de ação: Ver detalhes do passeio */}
                <div className="client2-tour-card__actions">
                  <button
                    type="button"
                    onClick={() => setSelectedTour(tour)}
                    className="client2-tour-card__btn"
                    aria-label={`Ver detalhes do passeio ${tour.name}`}
                  >
                    VER DETALHES DO PASSEIO
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Modal / Drawer Lateral à Direita de Detalhes Completos do Passeio */}
      <Client2TourDrawerModal
        isOpen={!!selectedTour}
        onClose={() => setSelectedTour(null)}
        tour={selectedTour}
      />
    </>
  );
}
