import React from "react";
import { Client, ClientTrip } from "@/data/mock-client";

interface ClientTripHeroProps {
  cliente: Client;
  viagem: ClientTrip;
  totalPasseios?: number;
}

// Formatação simples e humana para os viajantes sem bibliotecas externas
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

export default function ClientTripHero({
  cliente,
  viagem,
  totalPasseios,
}: ClientTripHeroProps) {
  const countPasseios = totalPasseios ?? viagem.quantidadePasseios ?? 3;
  const travelersText = formatTravelers(
    viagem.viajantes.adultos,
    viagem.viajantes.criancas
  );

  return (
    <section className="client-page-hero" aria-labelledby="client-hero-title">
      <div className="client-page-container">
        <div className="client-page-hero__frame">
          {/* Lado Principal: Saudação, Título, Período e Texto Acolhedor */}
          <div className="client-page-hero__primary">
            <p className="client-page-hero__salutation">
              OLÁ, {cliente.primeiroNome || cliente.nome}
            </p>

            <h1 id="client-hero-title" className="client-page-hero__title">
              Sua viagem para {viagem.destino.split(",")[0]} está chegando.
            </h1>

            <p className="client-page-hero__dates">
              <span className="client-page-hero__dates-icon" aria-hidden="true">
                🗓
              </span>
              {viagem.periodoFormatado}
            </p>

            <p className="client-page-hero__intro">
              Aqui está todo o planejamento dos seus dias no México. Cada
              experiência, horário e detalhe foi organizado para você e sua
              família viverem momentos inesquecíveis com a tranquilidade do
              nosso suporte local em português.
            </p>
          </div>

          {/* Lado Complementar: Resumo visual unificado da viagem */}
          <aside
            className="client-page-hero__complement"
            aria-label="Status e resumo da reserva"
          >
            <div className="client-page-hero__card-unified">
              <div className="client-page-hero__card-header">
                <span className="client-page-hero__card-tag">STATUS DA RESERVA</span>
                <span className="client-page-seal client-page-seal--confirmed">
                  <span className="client-page-seal__dot" aria-hidden="true" />
                  {viagem.status}
                </span>
              </div>

              <div className="client-page-hero__card-body">
                <div className="client-page-hero__metric">
                  <span className="client-page-hero__metric-label">DESTINO</span>
                  <span className="client-page-hero__metric-value">
                    {viagem.destino}
                  </span>
                </div>

                <div className="client-page-hero__card-sep" aria-hidden="true" />

                <div className="client-page-hero__metric">
                  <span className="client-page-hero__metric-label">VIAJANTES</span>
                  <span className="client-page-hero__metric-value">
                    {travelersText}
                  </span>
                </div>

                <div className="client-page-hero__card-sep" aria-hidden="true" />

                <div className="client-page-hero__metric">
                  <span className="client-page-hero__metric-label">EXPERIÊNCIAS</span>
                  <span className="client-page-hero__metric-value">
                    {countPasseios}{" "}
                    {countPasseios === 1
                      ? "experiência confirmada"
                      : "experiências confirmadas"}
                  </span>
                </div>
              </div>

              <div className="client-page-hero__card-footer">
                <span className="client-page-hero__concierge-badge">
                  Curadoria &amp; Assistência Local Tio Nenê
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
