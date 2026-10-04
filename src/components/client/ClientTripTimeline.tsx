import React from "react";
import { ClientTimelineItem } from "@/data/mock-client";

interface ClientTripTimelineProps {
  timeline: ClientTimelineItem[];
}

// Converte DD/MM/YYYY para timestamp para garantir ordenação cronológica rigorosa
function parseTimelineDate(dateStr: string): number {
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    return new Date(year, month - 1, day).getTime();
  }
  return 0;
}

// Extrai partes da data para exibição editorial
function getTimelineDateParts(dateStr: string) {
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
    return {
      day,
      month: monthsShort[monthNum - 1] || "",
      year,
    };
  }
  return { day: dateStr, month: "", year: "" };
}

// Mapeamento humanizado do tipo de evento (sem rótulos técnicos brutos)
function getEventTypeLabel(tipo: string): string {
  switch (tipo) {
    case "chegada":
      return "CHEGADA EM CANCÚN";
    case "retorno":
      return "RETORNO AO BRASIL";
    case "passeio":
      return "PASSEIO CONFIRMADO";
    case "livre":
      return "DIA LIVRE";
    default:
      return "PROGRAMAÇÃO";
  }
}

export default function ClientTripTimeline({
  timeline,
}: ClientTripTimelineProps) {
  // Ordenação cronológica estrita a partir dos dados mockados
  const sortedTimeline = [...timeline].sort(
    (a, b) => parseTimelineDate(a.data) - parseTimelineDate(b.data)
  );

  return (
    <section
      className="client-page-timeline"
      id="roteiro"
      aria-labelledby="client-timeline-title"
    >
      <div className="client-page-container">
        {/* Abertura Editorial da Seção */}
        <div className="client-page-timeline__header">
          <p className="eyebrow client-page-timeline__eyebrow">
            SUA PROGRAMAÇÃO
          </p>
          <h2 id="client-timeline-title" className="client-page-timeline__title">
            Seu roteiro no <em className="accent">México</em>.
          </h2>
          <p className="client-page-timeline__desc">
            Da chegada ao retorno, sua viagem organizada em uma única sequência
            para você visualizar facilmente o ritmo dos seus dias.
          </p>
        </div>

        {/* Lista Cronológica Ordenada e Acessível */}
        <div className="client-page-timeline__wrapper">
          <ol className="client-page-timeline__list">
            {sortedTimeline.map((item, index) => {
              const { day, month, year } = getTimelineDateParts(item.data);
              const typeLabel = getEventTypeLabel(item.tipo);
              const isLast = index === sortedTimeline.length - 1;

              return (
                <li
                  key={item.id}
                  className={`client-page-timeline__item client-page-timeline__item--${item.tipo}`}
                >
                  {/* Coluna da Data com Destaque Editorial */}
                  <div className="client-page-timeline__date-col">
                    <div className="client-page-timeline__date-badge">
                      <span className="client-page-timeline__day">{day}</span>
                      <div className="client-page-timeline__date-sub">
                        <span className="client-page-timeline__month">
                          {month}
                        </span>
                        <span className="client-page-timeline__year">
                          {year}
                        </span>
                      </div>
                    </div>
                    {item.diaSemana && (
                      <span className="client-page-timeline__weekday">
                        {item.diaSemana}
                      </span>
                    )}
                  </div>

                  {/* Eixo Central com Marcador e Linha Conectora */}
                  <div className="client-page-timeline__axis" aria-hidden="true">
                    <div
                      className={`client-page-timeline__marker client-page-timeline__marker--${item.tipo}`}
                    >
                      <span className="client-page-timeline__marker-dot" />
                    </div>
                    {!isLast && (
                      <div className="client-page-timeline__connector" />
                    )}
                  </div>

                  {/* Coluna de Conteúdo Narrativo da Etapa */}
                  <div className="client-page-timeline__content">
                    <div className="client-page-timeline__meta-header">
                      <span
                        className={`client-page-timeline__type-tag client-page-timeline__type-tag--${item.tipo}`}
                      >
                        {typeLabel}
                      </span>
                      {item.horario && (
                        <span className="client-page-timeline__time-pill">
                          às {item.horario}
                        </span>
                      )}
                    </div>

                    <h3 className="client-page-timeline__item-title">
                      {item.titulo}
                    </h3>

                    {item.descricao && (
                      <p className="client-page-timeline__item-desc">
                        {item.descricao}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
