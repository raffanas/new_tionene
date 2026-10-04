"use client";

import React from "react";
import { useTravelPlannerQuiz } from "@/context/TravelPlannerQuizContext";

export interface HomeTravelPlannerCtaProps {
  source?: string;
}

export default function HomeTravelPlannerCta({
  source = "home",
}: HomeTravelPlannerCtaProps) {
  const { openTravelPlannerQuiz } = useTravelPlannerQuiz();

  return (
    <section className="home-quiz-callout" id="descubra-viagem" aria-labelledby="home-quiz-title">
      <div className="home-quiz-callout__container">
        <div className="home-quiz-callout__header">
          <p className="eyebrow home-quiz-callout__eyebrow">DESCUBRA SUA VIAGEM IDEAL</p>
          <h2 className="home-quiz-callout__title" id="home-quiz-title">
            Não sabe por onde começar?
          </h2>
        </div>

        <div className="home-quiz-callout__body">
          <p className="home-quiz-callout__text">
            Responda algumas perguntas rápidas e descubra qual caminho combina mais com a sua viagem ao México.
          </p>
          <p className="home-quiz-callout__support">
            Passeios, Viagem Completa ou Curadoria Bella — a gente te ajuda a encontrar o melhor ponto de partida.
          </p>

          <div className="home-quiz-callout__action">
            <button
              type="button"
              className="button home-quiz-callout__btn"
              onClick={() => openTravelPlannerQuiz(source)}
            >
              DESCOBRIR MINHA VIAGEM IDEAL
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
