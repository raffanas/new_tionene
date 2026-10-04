import React from "react";
import { ClientTrip } from "@/data/mock-client";

interface ClientTripSummaryProps {
  viagem: ClientTrip;
  totalPasseios?: number;
}

// Formatação simples e humana da data para exibição editorial
function formatSimpleDate(isoDate: string): string {
  if (!isoDate) return "";
  const parts = isoDate.split("-");
  if (parts.length === 3) {
    const [year, month, day] = parts;
    const months = [
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
    const monthIndex = parseInt(month, 10) - 1;
    const monthName = months[monthIndex] || month;
    return `${parseInt(day, 10)} de ${monthName} de ${year}`;
  }
  return isoDate;
}

// Formatação para viajantes adaptando plural e ocultando 0 crianças
function formatTravelers(adultos: number, criancas: number): string {
  const parts: string[] = [];

  if (adultos > 0) {
    parts.push(`${adultos} ${adultos === 1 ? "adulto" : "adultos"}`);
  }

  if (criancas > 0) {
    parts.push(`${criancas} ${criancas === 1 ? "criança" : "crianças"}`);
  }

  return parts.length > 0 ? parts.join(" · ") : "Viajante";
}

export default function ClientTripSummary({
  viagem,
  totalPasseios,
}: ClientTripSummaryProps) {
  const countPasseios = totalPasseios ?? viagem.quantidadePasseios ?? 3;
  const travelersText = formatTravelers(
    viagem.viajantes.adultos,
    viagem.viajantes.criancas
  );

  return (
    <section className="client-page-summary" aria-labelledby="client-summary-title">
      <div className="client-page-container">
        {/* Cabeçalho Editorial com ritmo assimétrico natural */}
        <div className="client-page-summary__header">
          <div className="client-page-summary__heading-col">
            <p className="eyebrow client-page-summary__eyebrow">VISÃO GERAL</p>
            <h2 id="client-summary-title" className="client-page-summary__title">
              Resumo da sua <em className="accent">viagem</em>.
            </h2>
          </div>
          <div className="client-page-summary__desc-col">
            <p className="client-page-summary__desc">
              Os principais pontos da sua estadia e logística organizados de forma
              ampla e intuitiva para consulta a qualquer momento.
            </p>
          </div>
        </div>

        {/* Painel Editorial Amplo (Bipartido em Informações Principais e Operacionais — Sem grid de 8 cards) */}
        <div className="client-page-summary__panel">
          {/* Coluna Esquerda: Informações Principais */}
          <div className="client-page-summary__col client-page-summary__col--main">
            <span className="client-page-summary__col-label">
              INFORMAÇÕES PRINCIPAIS
            </span>

            <div className="client-page-summary__group">
              <span className="client-page-summary__item-label">DESTINO</span>
              <p className="client-page-summary__item-value client-page-summary__item-value--strong">
                {viagem.destino}
              </p>
            </div>

            <div className="client-page-summary__group">
              <span className="client-page-summary__item-label">PERÍODO DA ESTADIA</span>
              <p className="client-page-summary__item-value">
                {viagem.periodoFormatado}
              </p>
            </div>

            <div className="client-page-summary__group">
              <span className="client-page-summary__item-label">HOSPEDAGEM</span>
              <p className="client-page-summary__item-value">
                {viagem.hospedagem.nome}
              </p>
              <div className="client-page-summary__lodging-meta">
                <span className="client-page-summary__sub-pill">
                  Reserva {viagem.hospedagem.status}
                </span>
                {viagem.hospedagem.tipoQuarto && (
                  <span className="client-page-summary__sub-text">
                    · {viagem.hospedagem.tipoQuarto}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Divisor Central Sutil */}
          <div className="client-page-summary__divider" aria-hidden="true" />

          {/* Coluna Direita: Informações Operacionais */}
          <div className="client-page-summary__col client-page-summary__col--ops">
            <span className="client-page-summary__col-label">
              LOGÍSTICA &amp; OPERAÇÃO
            </span>

            <div className="client-page-summary__subgrid">
              <div className="client-page-summary__group">
                <span className="client-page-summary__item-label">CHEGADA EM CANCÚN</span>
                <p className="client-page-summary__item-value">
                  {formatSimpleDate(viagem.chegada.data)}
                </p>
                <span className="client-page-summary__time-badge">
                  às {viagem.chegada.horario}
                </span>
              </div>

              <div className="client-page-summary__group">
                <span className="client-page-summary__item-label">RETORNO AO BRASIL</span>
                <p className="client-page-summary__item-value">
                  {formatSimpleDate(viagem.retorno.data)}
                </p>
                <span className="client-page-summary__time-badge">
                  às {viagem.retorno.horario}
                </span>
              </div>
            </div>

            <div className="client-page-summary__subgrid-meta">
              <div className="client-page-summary__group">
                <span className="client-page-summary__item-label">VIAJANTES</span>
                <p className="client-page-summary__item-value">
                  {travelersText}
                </p>
              </div>

              <div className="client-page-summary__group">
                <span className="client-page-summary__item-label">EXPERIÊNCIAS</span>
                <p className="client-page-summary__item-value">
                  {countPasseios}{" "}
                  {countPasseios === 1
                    ? "passeio confirmado"
                    : "passeios confirmados"}
                </p>
              </div>

              <div className="client-page-summary__group">
                <span className="client-page-summary__item-label">STATUS GERAL</span>
                <div className="client-page-summary__seal-wrap">
                  <span className="client-page-seal client-page-seal--confirmed">
                    <span className="client-page-seal__dot" aria-hidden="true" />
                    {viagem.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
