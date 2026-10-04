import React from "react";
import Link from "next/link";
import { Tour } from "@/data/tours";
import { SITE_CONFIG } from "@/config/site";

interface TourCTAProps {
  tour: Tour;
}

export default function TourCTA({ tour }: TourCTAProps) {
  const phone = SITE_CONFIG.whatsapp
    ? SITE_CONFIG.whatsapp.replace(/\D/g, "")
    : "529983972624";
  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(
    `Olá, equipe Tio Nenê! Estou com dúvidas sobre o passeio "${tour.name}" e gostaria de planejar minha experiência.`
  )}`;

  return (
    <section className="tour-detail-cta" id="duvidas">
      <div className="tour-detail-container">
        <div className="tour-detail-cta__card">
          <div className="tour-detail-cta__content">
            <p className="eyebrow tour-detail-cta__eyebrow">
              ATENDIMENTO CONSULTIVO & HUMANO
            </p>
            <h2 className="tour-detail-cta__title">
              Dúvidas sobre o passeio ou quer <em className="accent">personalizar</em> o seu dia?
            </h2>
            <p className="tour-detail-cta__desc">
              Nossa equipe local em Cancún e Riviera Maya está pronta para desenhar a melhor logística, combinar passeios e cuidar de cada detalhe da sua experiência com ritmo e tranquilidade.
            </p>
            <div className="tour-detail-cta__actions">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="tour-detail-cta__btn-primary"
              >
                Falar com consultor no WhatsApp
              </a>
              <Link href="/viagem-completa" className="tour-detail-cta__btn-secondary">
                Conhecer Viagem Completa
              </Link>
            </div>
          </div>
          <div className="tour-detail-cta__perks">
            <div className="tour-detail-cta__perk">
              <span className="tour-detail-cta__perk-icon">✦</span>
              <div>
                <strong>Atendimento 100% em Português</strong>
                <p>Especialistas brasileiros e locais cuidando de você.</p>
              </div>
            </div>
            <div className="tour-detail-cta__perk">
              <span className="tour-detail-cta__perk-icon">✦</span>
              <div>
                <strong>Curadoria sem pegadinhas</strong>
                <p>Apenas os melhores operadores e experiências homologadas.</p>
              </div>
            </div>
            <div className="tour-detail-cta__perk">
              <span className="tour-detail-cta__perk-icon">✦</span>
              <div>
                <strong>Suporte antes e durante a viagem</strong>
                <p>Acompanhamento contínuo em tempo real no destino.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
