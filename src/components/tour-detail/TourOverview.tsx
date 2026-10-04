import React from "react";
import { Tour } from "@/data/tours";

interface TourOverviewProps {
  tour: Tour;
}

export default function TourOverview({ tour }: TourOverviewProps) {
  const paragraphs = tour.description
    ? tour.description.split(/\n+/).filter((p) => p.trim().length > 0)
    : [];

  const hasHighlights = Boolean(tour.highlights && tour.highlights.length > 0);
  const hasIdealFor = Boolean(tour.idealFor && tour.idealFor.length > 0);

  if (!paragraphs.length && !hasHighlights && !hasIdealFor) {
    return null;
  }

  return (
    <section className="tour-detail-overview" id="sobre">
      <div className="tour-detail-container">
        <div className="tour-detail-overview__layout">
          {/* Coluna Principal: Narrativa Editorial */}
          <div className="tour-detail-overview__narrative">
            <p className="eyebrow tour-detail-overview__eyebrow">CONHEÇA A EXPERIÊNCIA</p>
            <h2 className="tour-detail-overview__title">
              A experiência <em className="accent">por dentro</em>.
            </h2>

            <div className="tour-detail-overview__prose">
              {paragraphs.map((para, idx) => (
                <p key={idx} className="tour-detail-overview__paragraph">
                  {para}
                </p>
              ))}
            </div>

            {/* Perfil Recomendado integrado organicamente à narrativa */}
            {hasIdealFor && (
              <div className="tour-detail-overview__recommendation">
                <span className="tour-detail-overview__recommendation-lead">
                  Experiência especialmente indicada para:
                </span>
                <div className="tour-detail-overview__recommendation-tags">
                  {tour.idealFor.map((item, idx) => (
                    <span key={idx} className="tour-detail-overview__tag">
                      <span className="tour-detail-overview__tag-bullet" aria-hidden="true">✦</span>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Coluna Lateral: Destaques Editoriais da Curadoria */}
          {hasHighlights && (
            <aside className="tour-detail-overview__aside">
              <div className="tour-detail-overview__feature-box">
                <p className="eyebrow tour-detail-overview__aside-eyebrow">CURADORIA LOCAL</p>
                <h3 className="tour-detail-overview__aside-title">
                  O que torna este dia especial
                </h3>
                <ul className="tour-detail-overview__feature-list" role="list">
                  {tour.highlights.map((highlight, idx) => (
                    <li key={idx} className="tour-detail-overview__feature-item">
                      <span className="tour-detail-overview__feature-num" aria-hidden="true">
                        0{idx + 1}
                      </span>
                      <p className="tour-detail-overview__feature-text">{highlight}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          )}
        </div>
      </div>
    </section>
  );
}

