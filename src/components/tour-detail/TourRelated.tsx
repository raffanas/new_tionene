import React from "react";
import Link from "next/link";
import { Tour, getRelatedTours } from "@/data/tours";

interface TourRelatedProps {
  currentTour: Tour;
}

export default function TourRelated({ currentTour }: TourRelatedProps) {
  const related = getRelatedTours(currentTour);

  if (!related || related.length === 0) {
    return null;
  }

  return (
    <section className="tour-detail-related" id="relacionados">
      <div className="tour-detail-container">
        <div className="tour-detail-related__header">
          <p className="eyebrow tour-detail-related__eyebrow">CONTINUE EXPLORANDO</p>
          <h2 className="tour-detail-related__title">
            Mais passeios para o seu <em className="accent">roteiro</em>.
          </h2>
          <p className="tour-detail-related__subtitle">
            Outras experiências curadas para enriquecer os seus dias no Caribe Mexicano.
          </p>
        </div>

        <div className="tour-detail-related__grid">
          {related.map((item) => (
            <article key={item.slug} className="tour-detail-related__card">
              <Link
                href={`/passeios/${item.slug}`}
                className="tour-detail-related__photo-link"
                aria-label={`Ver detalhes de ${item.name}`}
              >
                <img
                  src={item.heroImage}
                  alt={item.name}
                  className="tour-detail-related__image"
                  loading="lazy"
                />
              </Link>

              <div className="tour-detail-related__top-tags">
                <span className="tour-detail-related__category-tag">
                  {item.category.split("·")[0].trim()}
                </span>
                {item.duration && (
                  <span className="tour-detail-related__duration-tag">
                    {item.duration}
                  </span>
                )}
              </div>

              <div className="tour-detail-related__body">
                <h3 className="tour-detail-related__card-title">
                  <Link
                    href={`/passeios/${item.slug}`}
                    className="tour-detail-related__title-link"
                  >
                    {item.name}
                  </Link>
                </h3>
                <p className="tour-detail-related__card-desc">
                  {item.shortDescription}
                </p>
                <div className="tour-detail-related__bottom">
                  {item.priceFrom > 0 && (
                    <div className="tour-detail-related__price-pill">
                      <span className="tour-detail-related__price-from">A partir de</span>
                      <strong className="tour-detail-related__price-val">
                        {item.currency} ${item.priceFrom}
                      </strong>
                    </div>
                  )}
                  <Link
                    href={`/passeios/${item.slug}`}
                    className="tour-detail-related__btn"
                  >
                    VER DETALHES
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
