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
        `Olá, equipe Tio Nenê! Sou a ${client.name} e gostaria de falar sobre a minha programação de viagem a Cancún.`
      )}`
    : "#contato";

  return (
    <section className="client2-hero" aria-labelledby="client2-hero-title">
      {/* Imagem de fundo sutil do destino Cancún com overlay em vinho profundo */}
      <div className="client2-hero__backdrop" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/img-08-2cf9c873.png"
          alt=""
          className="client2-hero__backdrop-image"
          loading="eager"
        />
        <div className="client2-hero__backdrop-overlay" />
      </div>

      <div className="client2-hero__container">
        {/* Eyebrow & Status da Viagem */}
        <div className="client2-hero__top-row">
          <span className="client2-hero__eyebrow">SUA VIAGEM</span>
          <div className="client2-hero__badge" role="status" aria-label="Status da viagem: Viagem Confirmada">
            <span className="client2-hero__badge-dot" aria-hidden="true" />
            <span>{client.status}</span>
          </div>
        </div>

        {/* Título Personalizado & Texto de Apoio */}
        <h1 className="client2-hero__title" id="client2-hero-title">
          {client.greetingTitle}
        </h1>
        <p className="client2-hero__support">
          Planejada com carinho para você aproveitar o melhor do México.
        </p>

        {/* Linha Editorial com as Informações Rápidas da Viagem (sem cara de dashboard) */}
        <div
          className="client2-hero__strip"
          role="region"
          aria-label="Dados principais da viagem"
        >
          {/* Período da Viagem */}
          <div className="client2-hero__strip-item">
            <div className="client2-hero__strip-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div className="client2-hero__strip-body">
              <span className="client2-hero__strip-label">Período da Viagem</span>
              <strong className="client2-hero__strip-val">{client.period}</strong>
            </div>
          </div>

          <div className="client2-hero__strip-divider" aria-hidden="true" />

          {/* Quantidade de Viajantes */}
          <div className="client2-hero__strip-item">
            <div className="client2-hero__strip-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="client2-hero__strip-body">
              <span className="client2-hero__strip-label">Viajantes</span>
              <strong className="client2-hero__strip-val">{client.travelers}</strong>
            </div>
          </div>

          <div className="client2-hero__strip-divider" aria-hidden="true" />

          {/* Destino */}
          <div className="client2-hero__strip-item">
            <div className="client2-hero__strip-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <div className="client2-hero__strip-body">
              <span className="client2-hero__strip-label">Destino</span>
              <strong className="client2-hero__strip-val">{client.destination}</strong>
            </div>
          </div>

          <div className="client2-hero__strip-divider" aria-hidden="true" />

          {/* Hospedagem / Hotel */}
          <div className="client2-hero__strip-item">
            <div className="client2-hero__strip-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <div className="client2-hero__strip-body">
              <span className="client2-hero__strip-label">Hospedagem</span>
              <strong className="client2-hero__strip-val">{client.hotel}</strong>
            </div>
          </div>
        </div>

        {/* CTA Principal do Hero */}
        <div className="client2-hero__footer">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="client2-hero__cta"
            aria-label="Fale com nossa equipe pelo WhatsApp sobre sua programação de viagem"
          >
            <span>FALE COM NOSSA EQUIPE</span>
            <svg
              className="client2-hero__wa-icon"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.539 1.772.82 2.791.82 3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.587-5.806-5.768-5.806zm3.374 8.232c-.143.402-.83.743-1.15.789-.319.046-.732.062-2.127-.487-1.396-.549-2.275-1.979-2.345-2.073-.07-.094-.564-.75-.564-1.428 0-.678.354-1.011.48-1.152.125-.141.274-.176.365-.176.091 0 .183.001.263.005.084.004.197-.032.308.234.114.274.388.948.423 1.018.034.07.057.153.011.246-.046.094-.069.153-.137.234-.069.082-.144.183-.206.246-.069.07-.14.146-.06.284.08.138.355.586.762.949.524.467.965.611 1.103.68.137.069.217.058.297-.034.08-.093.343-.4.434-.537.092-.138.183-.115.309-.069.126.046.799.377.936.446.137.069.229.103.263.161.034.057.034.331-.109.733z" />
            </svg>
          </a>

          <p className="client2-hero__note">
            <span className="client2-hero__note-star" aria-hidden="true">✦</span>
            <span>Concierge exclusivo e atendimento em português à sua disposição durante toda a estadia.</span>
          </p>
        </div>
      </div>
    </section>
  );
}
