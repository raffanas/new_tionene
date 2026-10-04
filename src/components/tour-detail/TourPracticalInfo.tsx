import React from "react";
import { Tour } from "@/data/tours";

interface TourPracticalInfoProps {
  tour: Tour;
}

export default function TourPracticalInfo({ tour }: TourPracticalInfoProps) {
  const facts: { label: string; value: string }[] = [];
  if (tour.duration) facts.push({ label: "Duração estimada", value: tour.duration });
  if (tour.startTime) facts.push({ label: "Horário de saída", value: tour.startTime });
  if (tour.endTime) facts.push({ label: "Retorno previsto", value: tour.endTime });
  if (tour.location) facts.push({ label: "Localização", value: tour.location });
  if (tour.minimumAge) facts.push({ label: "Idade recomendada", value: tour.minimumAge });
  if (tour.infantPolicy) facts.push({ label: "Infantes & Crianças", value: tour.infantPolicy });

  const hasFacts = facts.length > 0;
  const hasWhatToBring = Boolean(tour.whatToBring && tour.whatToBring.length > 0);
  const hasAccessibility = Boolean(tour.accessibility && tour.accessibility.trim().length > 0);
  const hasCancellation = Boolean(tour.cancellationPolicy && tour.cancellationPolicy.trim().length > 0);
  const hasImportantInfo = Boolean(tour.importantInfo && tour.importantInfo.length > 0);

  if (!hasFacts && !hasWhatToBring && !hasAccessibility && !hasCancellation && !hasImportantInfo) {
    return null;
  }

  return (
    <section className="tour-detail-practical" id="informacoes">
      <div className="tour-detail-container">
        {/* Cabeçalho Editorial */}
        <div className="tour-detail-practical__header">
          <p className="eyebrow tour-detail-practical__eyebrow">PREPARAÇÃO & LOGÍSTICA</p>
          <h2 className="tour-detail-practical__title">
            Informações práticas para o <em className="accent">seu dia</em>.
          </h2>
          <p className="tour-detail-practical__subtitle">
            Tudo o que você precisa saber com antecedência para viajar com ritmo leve e sem imprevistos.
          </p>
        </div>

        {/* Faixa Contínua de Especificações (estilo .stats do site) */}
        {hasFacts && (
          <div className="tour-detail-practical__strip" role="list">
            {facts.map((fact, idx) => (
              <div key={idx} className="tour-detail-practical__strip-item" role="listitem">
                <span className="tour-detail-practical__strip-label">{fact.label}</span>
                <strong className="tour-detail-practical__strip-value">{fact.value}</strong>
              </div>
            ))}
          </div>
        )}

        {/* Composição Editorial de 2 Colunas (Sem caixas de dashboard) */}
        <div className="tour-detail-practical__content-grid">
          {/* Coluna 1: O Que Levar */}
          {hasWhatToBring && (
            <div className="tour-detail-practical__column">
              <span className="eyebrow tour-detail-practical__col-eyebrow">CHECKLIST</span>
              <h3 className="tour-detail-practical__col-title">O que sugerimos levar</h3>
              <ul className="tour-detail-practical__checklist" role="list">
                {tour.whatToBring.map((item, idx) => (
                  <li key={idx} className="tour-detail-practical__checklist-item">
                    <span className="tour-detail-practical__bullet" aria-hidden="true">✦</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Coluna 2: Observações & Cancelamento */}
          <div className="tour-detail-practical__column">
            {hasAccessibility && (
              <div className="tour-detail-practical__subblock">
                <span className="eyebrow tour-detail-practical__col-eyebrow">ACESSIBILIDADE</span>
                <h3 className="tour-detail-practical__subblock-title">Acessibilidade e mobilidade</h3>
                <p className="tour-detail-practical__text">{tour.accessibility}</p>
              </div>
            )}

            {hasImportantInfo && (
              <div className="tour-detail-practical__subblock">
                <span className="eyebrow tour-detail-practical__col-eyebrow">OBSERVAÇÕES</span>
                <h3 className="tour-detail-practical__subblock-title">Orientações locais</h3>
                <ul className="tour-detail-practical__notes-list" role="list">
                  {tour.importantInfo.map((info, idx) => (
                    <li key={idx} className="tour-detail-practical__note-item">
                      <span className="tour-detail-practical__note-bullet" aria-hidden="true">—</span>
                      <span>{info}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {hasCancellation && (
              <div className="tour-detail-practical__cancellation">
                <span className="eyebrow tour-detail-practical__col-eyebrow">CANCELAMENTO SEGURO</span>
                <h3 className="tour-detail-practical__subblock-title">Política de cancelamento</h3>
                <p className="tour-detail-practical__text">{tour.cancellationPolicy}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

