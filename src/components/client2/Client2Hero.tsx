"use client";

import React from "react";
import type { Client2Info } from "@/data/mock-client-2";
import { SITE_CONFIG } from "@/config/site";

interface Client2HeroProps {
  client: Client2Info;
}

export default function Client2Hero({ client }: Client2HeroProps) {
  const rawNumber = SITE_CONFIG.whatsapp?.replace(/\D/g, "");
  const whatsappUrl = rawNumber
    ? `https://wa.me/${rawNumber}?text=${encodeURIComponent(
        `Olá, equipe Tio Nenê! Sou ${client.name} e gostaria de falar sobre a minha programação de viagem.`
      )}`
    : "#contato";

  return (
    <section className="client2-hero" aria-labelledby="client2-hero-title">
      <div className="client2-hero__main">
        {/* Conteúdo Principal do Hero: Título à esquerda e Subtítulo + CTA à direita */}
        <div className="client2-hero__content-row">
          {/* Coluna Esquerda: Título Grande */}
          <div className="client2-hero__left">
            <h1 className="client2-hero__title" id="client2-hero-title">
              {client.name || "Isabelle"}, essa é a<br />
              sua programação<br />
              de viagem
            </h1>
          </div>

          {/* Coluna Direita: Subtítulo Editorial + Botão CTA */}
          <div className="client2-hero__right">
            <p className="client2-hero__support">
              planejada com carinho<br />
              para você <em className="client2-hero__accent">aproveitar</em> o<br />
              melhor do méxico.
            </p>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="client2-hero__cta-pill"
              aria-label="Fale com nossa equipe sobre a sua viagem"
            >
              Fale com nossa equipe
            </a>
          </div>
        </div>

        {/* Faixa Inferior com os 4 Dados da Viagem */}
        <div
          className="client2-hero__strip"
          role="region"
          aria-label="Dados principais da reserva"
        >
          {/* 1. Sua Viagem */}
          <div className="client2-hero__strip-item">
            <div className="client2-hero__strip-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div className="client2-hero__strip-body">
              <span className="client2-hero__strip-label">SUA VIAGEM</span>
              <strong className="client2-hero__strip-val">{client.period || "21 a 28 de julho de 2027"}</strong>
            </div>
          </div>

          <div className="client2-hero__strip-divider" aria-hidden="true" />

          {/* 2. Viajante */}
          <div className="client2-hero__strip-item">
            <div className="client2-hero__strip-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
                <path d="M16 11c1.5 0 2.5 1 2.5 2.5" />
              </svg>
            </div>
            <div className="client2-hero__strip-body">
              <span className="client2-hero__strip-label">VIAJANTE</span>
              <strong className="client2-hero__strip-val">{client.travelerType || "cliente tio nenê"}</strong>
            </div>
          </div>

          <div className="client2-hero__strip-divider" aria-hidden="true" />

          {/* 3. Destino */}
          <div className="client2-hero__strip-item">
            <div className="client2-hero__strip-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <div className="client2-hero__strip-body">
              <span className="client2-hero__strip-label">DESTINO</span>
              <strong className="client2-hero__strip-val">{client.destination || "Cancún, México"}</strong>
            </div>
          </div>

          <div className="client2-hero__strip-divider" aria-hidden="true" />

          {/* 4. Código da Reserva */}
          <div className="client2-hero__strip-item">
            <div className="client2-hero__strip-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <circle cx="2" cy="12" r="2" />
                <circle cx="22" cy="12" r="2" />
                <line x1="9" y1="9" x2="9" y2="15" strokeDasharray="2 2" />
              </svg>
            </div>
            <div className="client2-hero__strip-body">
              <span className="client2-hero__strip-label">CÓDIGO DA RESERVA</span>
              <strong className="client2-hero__strip-val">{client.bookingCode || "GASHHA4556"}</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
