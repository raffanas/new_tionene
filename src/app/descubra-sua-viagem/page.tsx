import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { SITE_CONFIG } from "@/config/site";
import TravelPlannerQuiz from "@/components/TravelPlannerQuiz";

export const metadata: Metadata = {
  title: "Descubra sua viagem ideal | Tio Nenê Tours",
  description:
    "Responda algumas perguntas rápidas e descubra qual caminho combina mais com a sua viagem ao México: Passeios, Viagem Completa ou Curadoria Bella.",
};

export default function DescubraSuaViagemPage() {
  return (
    <div className="travel-quiz-page">
      {/* Topo focado: Logo institucional e ação discreta de retorno */}
      <header className="travel-quiz-page__header" aria-label="Cabeçalho">
        <div className="travel-quiz-page__header-inner">
          <Link
            href={SITE_CONFIG.routes.home}
            aria-label="Tio Nenê — Ir para a página inicial"
            className="travel-quiz-page__logo-link"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="travel-quiz-page__logo"
              src="/img/tio-nene-01.svg"
              alt="Tio Nenê"
            />
          </Link>

          <Link
            href={SITE_CONFIG.routes.home}
            className="travel-quiz-page__back-link"
            aria-label="Voltar para a página principal do site"
          >
            <span>Voltar ao site</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </header>

      {/* Conteúdo principal com o motor central do quiz incorporado */}
      <main className="travel-quiz-page__main" id="quiz-content">
        <div className="travel-quiz-page__card">
          <TravelPlannerQuiz
            variant="page"
            source="instagram"
            showIntro={true}
          />
        </div>
      </main>

      {/* Rodapé institucional enxuto, sem distrair da experiência do quiz */}
      <footer className="travel-quiz-page__footer" aria-label="Rodapé institucional">
        <div className="travel-quiz-page__footer-inner">
          <p className="travel-quiz-page__footer-brand">
            Tio Nenê &copy; {new Date().getFullYear()} · Operação própria em Cancún &amp; Riviera Maya
          </p>
          <div className="travel-quiz-page__footer-links">
            <Link href={SITE_CONFIG.routes.home}>Início</Link>
            <span aria-hidden="true">•</span>
            <Link href={SITE_CONFIG.routes.passeios}>Passeios</Link>
            <span aria-hidden="true">•</span>
            <Link href={SITE_CONFIG.routes.viagemCompleta}>Viagem Completa</Link>
            <span aria-hidden="true">•</span>
            <Link href={SITE_CONFIG.routes.curadoriaBella}>Curadoria Bella</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
