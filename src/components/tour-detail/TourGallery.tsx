import React from "react";
import { Tour } from "@/data/tours";

interface TourGalleryProps {
  tour: Tour;
}

export default function TourGallery({ tour }: TourGalleryProps) {
  // Garantir que as imagens venham unicamente de tour.gallery (com fallback suave para heroImage se vazio)
  const images =
    tour.gallery && tour.gallery.length > 0 ? tour.gallery : [tour.heroImage];
  const count = images.length;

  return (
    <section className="tour-detail-gallery" id="galeria">
      <div className="tour-detail-container">
        {/* Cabeçalho Editorial da Galeria */}
        <div className="tour-detail-gallery__header">
          <span className="tour-detail-gallery__label">REGISTROS VISUAIS</span>
          <h2 className="tour-detail-gallery__title">Galeria da Experiência</h2>
          <p className="tour-detail-gallery__subtitle">
            Cenários reais e momentos que você irá vivenciar em {tour.name}.
          </p>
        </div>

        {/* Grid Adaptativo conforme quantidade de imagens (1, 2, 3 ou 4+) */}
        <div
          className={`tour-detail-gallery__grid tour-detail-gallery__grid--count-${Math.min(
            count,
            4
          )}`}
        >
          {images.slice(0, 4).map((imgSrc, idx) => (
            <div
              key={idx}
              className={`tour-detail-gallery__item ${
                idx === 0 ? "tour-detail-gallery__item--primary" : ""
              }`}
            >
              <img
                src={imgSrc}
                alt={`${tour.name} — fotografia ${idx + 1}`}
                className="tour-detail-gallery__img"
                loading="lazy"
              />
            </div>
          ))}
        </div>

        {/* Botão visual discreto quando há 4 ou mais fotos */}
        {count >= 4 && (
          <div className="tour-detail-gallery__action">
            <button
              type="button"
              className="tour-detail-gallery__btn-all"
              aria-label="Ver todas as fotos do passeio"
            >
              <span className="tour-detail-gallery__btn-icon">✦</span>
              <span>VER TODAS AS FOTOS ({count})</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
