import React from "react";
import type { Client2TimelineItem } from "@/data/mock-client-2";

interface Client2TimelineProps {
  timeline: Client2TimelineItem[];
}

const TYPE_CONFIG: Record<
  Client2TimelineItem["type"],
  {
    label: string;
    badgeClass: string;
    renderIcon: () => React.ReactNode;
  }
> = {
  chegada: {
    label: "Chegada & Transfer",
    badgeClass: "client2-timeline__badge--arrival",
    renderIcon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M22 17H2" />
        <path d="M2.5 9.5l3.5 1.5 5-2v-4a1.5 1.5 0 0 1 3 0v4l5 2 3.5-1.5" />
        <path d="M12 13v4" />
      </svg>
    ),
  },
  passeio: {
    label: "Passeio Confirmado",
    badgeClass: "client2-timeline__badge--tour",
    renderIcon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  livre: {
    label: "Dia Livre",
    badgeClass: "client2-timeline__badge--free",
    renderIcon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
    ),
  },
  retorno: {
    label: "Check-out & Retorno",
    badgeClass: "client2-timeline__badge--departure",
    renderIcon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M22 17H2" />
        <path d="M4 14l3.5-1.5 5 2v4a1.5 1.5 0 0 0 3 0v-4l5-2 3.5 1.5" />
        <path d="M12 7V3" />
      </svg>
    ),
  },
};

export default function Client2Timeline({ timeline }: Client2TimelineProps) {
  return (
    <section className="client2-timeline" id="roteiro-completo" aria-labelledby="client2-timeline-title">
      <div className="client2-timeline__header">
        <span className="client2-timeline__eyebrow">ROTEIRO</span>
        <h2 className="client2-timeline__title" id="client2-timeline-title">
          Visão geral da viagem
        </h2>
        <p className="client2-timeline__subtitle">
          Sua programação dia a dia no México: momentos de experiências confirmadas e tempo livre para descanso.
        </p>
      </div>

      {/* Grid Semi-Horizontal no Desktop / Vertical no Mobile */}
      <div className="client2-timeline__grid" role="list">
        {timeline.map((item, index) => {
          const config = TYPE_CONFIG[item.type];
          const isFirstInRow = index % 4 === 0;
          const isLastInRow = index % 4 === 3 || index === timeline.length - 1;

          return (
            <article
              key={item.id}
              className={`client2-timeline-card client2-timeline-card--${item.type} ${
                isFirstInRow ? "client2-timeline-card--first-in-row" : ""
              } ${isLastInRow ? "client2-timeline-card--last-in-row" : ""}`}
              role="listitem"
              aria-labelledby={`timeline-title-${item.id}`}
            >
              {/* 1. Datas acima do nó */}
              <div className="client2-timeline-card__date-header">
                <span className="client2-timeline-card__day-tag">{item.dayLabel}</span>
                <strong className="client2-timeline-card__date">{item.date}</strong>
                <span className="client2-timeline-card__weekday">{item.weekday}</span>
              </div>

              {/* 2. Marcador com nó e linha conectora horizontal contínua */}
              <div className="client2-timeline-card__axis" aria-hidden="true">
                <div className="client2-timeline-card__line-before" />
                <div className="client2-timeline-card__node">
                  {config.renderIcon()}
                </div>
                <div className="client2-timeline-card__line-after" />
              </div>

              {/* 3. Conteúdo / Card abaixo do marcador */}
              <div className="client2-timeline-card__body">
                <div className="client2-timeline-card__meta-row">
                  <span className={`client2-timeline__badge ${config.badgeClass}`}>
                    {config.label}
                  </span>
                  {item.time && (
                    <span className="client2-timeline-card__time">
                      <span aria-hidden="true">⏰</span> {item.time}
                    </span>
                  )}
                </div>

                <h3 className="client2-timeline-card__title" id={`timeline-title-${item.id}`}>
                  {item.title}
                </h3>
                <p className="client2-timeline-card__desc">{item.description}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
