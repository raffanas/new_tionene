"use client";

import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useTravelPlannerQuiz } from "@/context/TravelPlannerQuizContext";

export default function CuradoriaBellaPage() {
  const { openTravelPlannerQuiz } = useTravelPlannerQuiz();

  return (
    <>
      <div className="curadoria-page">
        <main>
          {/* ========================================================================= */}
          {/* 1. HERO (2 COLUNAS)                                                       */}
          {/* ========================================================================= */}
          <section className="curadoria-hero" id="hero">
            <Header currentPage="curadoria-bella" logoSrc="/img/tio-nene-03.svg" />

            <div className="curadoria-hero__container">
              <div className="curadoria-hero__media">
                <img
                  className="curadoria-hero__image"
                  src="/img/sobre-curadoria-bella.avif"
                  alt="Bella diante da arquitetura mexicana"
                />
              </div>
              <div className="curadoria-hero__content">
                <span className="curadoria-eyebrow">
                  CURADORIA DE VIAGENS AUTORAIS POR BELLA
                </span>
                <h1>
                  O México que você não<br className="curadoria-hero__br" />
                  encontraria sozinho
                </h1>
                <p className="curadoria-hero__aside">
                  Viagens personalizadas para quem procura experiências fora do óbvio.
                </p>
                <button
                  type="button"
                  className="curadoria-button"
                  onClick={() => openTravelPlannerQuiz("curadoria-bella-hero")}
                >
                  Planejar minha viagem
                </button>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 2. BLOCO MANIFESTO / INTRODUÇÃO                                           */}
          {/* ========================================================================= */}
          <section className="curadoria-section curadoria-manifesto" id="manifesto">
            <div className="curadoria-manifesto__container">
              <span className="curadoria-eyebrow curadoria-manifesto__eyebrow">
                01 &nbsp;—&nbsp; A MINHA FORMA DE OLHAR
              </span>
              
              <div className="curadoria-manifesto__text">
                <p>
                  Durante mais de dez anos à frente da Tio Nenê, ajudei milhares de
                  brasileiros a descobrirem Cancún. Foi aqui que transformamos uma
                  receptiva em uma operadora completa, criamos novos produtos,
                  começamos a trabalhar com grupos e passamos a desenhar viagens
                  inteiras, muito além dos passeios.
                </p>
                <p>
                  Mas, enquanto a empresa crescia, uma curiosidade também crescia em
                  mim. Eu queria entender por que algumas viagens ficam para sempre
                  na memória e outras desaparecem poucos dias depois.
                </p>
                <p>
                  Essa pergunta me levou muito além do turismo. Passei a criar
                  eventos, viagens cocriadas com comunidades, expedições, experiências
                  autorais e projetos em diferentes lugares do mundo. Vivi temporadas
                  em países diferentes, conheci centenas de hotéis, restaurantes,
                  bairros, pessoas e culturas.
                </p>
                <p className="curadoria-manifesto__p-lead">
                  E, aos poucos, percebi que meu trabalho nunca foi vender destinos.
                </p>
              </div>

              <h2 className="curadoria-manifesto__conclusion">
                Sempre foi desenhar experiências.
              </h2>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 3. “EXISTEM DOIS TIPOS DE VIAGEM” (GRANDE BLOCO VINHO)                    */}
          {/* ========================================================================= */}
          <section className="curadoria-section curadoria-two-types" id="dois-tipos-de-viagem">
            <div className="curadoria-two-types__container">
              <div className="curadoria-two-types__aside">
                <span className="curadoria-two-types__eyebrow">
                  02<br />VIAGEM
                </span>
              </div>
              <div className="curadoria-two-types__content">
                <h2 className="curadoria-two-types__title">
                  Existem dois tipos de viagem.
                </h2>
                <div className="curadoria-two-types__text">
                  <p>
                    Aquela em que você conhece os pontos turísticos. E aquela em que
                    você conhece um lugar.
                  </p>
                  <p>
                    Hoje volto para a Tio Nenê trazendo esse novo olhar: menos preocupado
                    em marcar atrações em um mapa e mais interessado em entender quem é
                    você, como gosta de viajar e que tipo de lembrança quer levar para
                    casa.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 4. “PARA QUEM QUER VIVER O MÉXICO ALÉM DO ROTEIRO TRADICIONAL”           */}
          {/* ========================================================================= */}
          <section className="curadoria-section curadoria-audience" id="para-quem-e">
            <div className="curadoria-audience__container">
              <span className="curadoria-eyebrow curadoria-audience__eyebrow">
                03 &nbsp;—&nbsp; PARA QUEM É ESSA CURADORIA?
              </span>
              <h2 className="curadoria-audience__title">
                Para quem quer viver o México<br className="curadoria-hero__br" />
                além do roteiro tradicional.
              </h2>
              <div className="curadoria-audience__grid">
                <div className="curadoria-audience__item">
                  <p className="curadoria-audience__desc">
                    <span className="curadoria-audience__num">01</span> Para quem já veio a Cancún e quer descobrir outros lugares.
                  </p>
                </div>
                <div className="curadoria-audience__item">
                  <p className="curadoria-audience__desc">
                    <span className="curadoria-audience__num">02</span> Para quem busca uma lua de mel realmente única.
                  </p>
                </div>
                <div className="curadoria-audience__item">
                  <p className="curadoria-audience__desc">
                    <span className="curadoria-audience__num">03</span> Para famílias que preferem experiências a checklists.
                  </p>
                </div>
                <div className="curadoria-audience__item">
                  <p className="curadoria-audience__desc">
                    <span className="curadoria-audience__num">04</span> Para viajantes curiosos.
                  </p>
                </div>
                <div className="curadoria-audience__item">
                  <p className="curadoria-audience__desc">
                    <span className="curadoria-audience__num">05</span> Para quem acredita que viajar amplia repertório.
                  </p>
                </div>
                <div className="curadoria-audience__item">
                  <p className="curadoria-audience__desc">
                    <span className="curadoria-audience__num">06</span> Para quem quer uma viagem com a sua própria medida.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 5. “CADA VIAGEM NASCE A PARTIR DA SUA HISTÓRIA”                           */}
          {/* ========================================================================= */}
          <section className="curadoria-section curadoria-origin" id="como-funciona">
            <div className="curadoria-origin__container">
              <span className="curadoria-eyebrow curadoria-origin__eyebrow">
                O QUE FAZEMOS JUNTOS
              </span>
              <h2 className="curadoria-origin__title">
                Cada viagem nasce a<br className="curadoria-hero__br" />
                partir da sua história.
              </h2>
              <div className="curadoria-origin__text">
                <p>
                  Podemos desenhar uma viagem completa pelo México ou um roteiro que
                  combine hotéis, gastronomia, natureza, cultura, bem-estar e
                  experiências locais. O objetivo não é fazer você conhecer mais
                  lugares. É fazer você viver melhor cada lugar.
                </p>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 6. BLOCO “O MÉXICO QUE VOCÊ NÃO ENCONTRARIA SOZINHO” (4 CARDS)            */}
          {/* ========================================================================= */}
          <section className="curadoria-section curadoria-series" id="serie">
            <div className="curadoria-series__container">
              <div className="curadoria-series__header">
                <span className="curadoria-eyebrow curadoria-series__eyebrow">A SÉRIE</span>
                <h2 className="curadoria-series__title">
                  O México que você não<br className="curadoria-hero__br" />
                  encontraria sozinho.
                </h2>
                <p className="curadoria-series__subtitle">
                  Quatro capítulos sobre as histórias, referências<br className="curadoria-hero__br" />
                  e descobertas que formaram o meu olhar.
                </p>
              </div>

              <div className="curadoria-series__grid">
                <article className="curadoria-series-card curadoria-series-card--1">
                  <span className="curadoria-series-card__tag">EPISÓDIO 01</span>
                  <h3 className="curadoria-series-card__title">
                    Antes de morar aqui, eu já conhecia o México
                  </h3>
                  <span className="curadoria-series-card__status">SÉRIE EM BREVE</span>
                </article>

                <article className="curadoria-series-card curadoria-series-card--2">
                  <span className="curadoria-series-card__tag">EPISÓDIO 02</span>
                  <h3 className="curadoria-series-card__title">
                    Sempre fui a pessoa que inventava moda
                  </h3>
                  <span className="curadoria-series-card__status">SÉRIE EM BREVE</span>
                </article>

                <article className="curadoria-series-card curadoria-series-card--3">
                  <span className="curadoria-series-card__tag">EPISÓDIO 03</span>
                  <h3 className="curadoria-series-card__title">
                    O México mudou. Eu também.
                  </h3>
                  <span className="curadoria-series-card__status">SÉRIE EM BREVE</span>
                </article>

                <article className="curadoria-series-card curadoria-series-card--4">
                  <span className="curadoria-series-card__tag">EPISÓDIO 04</span>
                  <h3 className="curadoria-series-card__title">
                    O México que você não encontraria sozinho
                  </h3>
                  <span className="curadoria-series-card__status">SÉRIE EM BREVE</span>
                </article>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 7. “OS LUGARES QUE MUDARAM MEU OLHAR” (BLOCOS ALTERNADOS)                 */}
          {/* ========================================================================= */}
          <section className="curadoria-section curadoria-places" id="lugares">
            <div className="curadoria-places__container">
              <div className="curadoria-places__header">
                <span className="curadoria-eyebrow curadoria-places__eyebrow">
                  ATLAS DE REFERÊNCIAS
                </span>
                <h2 className="curadoria-places__title">
                  Os lugares que<br className="curadoria-hero__br" />
                  mudaram meu olhar.
                </h2>
                <p className="curadoria-places__subtitle">
                  Viajar pelo mundo não me afastou do México.<br className="curadoria-hero__br" />
                  Me deu novas referências para enxergá-lo.
                </p>
              </div>

              <div className="curadoria-places__list">
                {/* Bloco 1: Colômbia (Box Esquerda / Texto Direita) */}
                <article className="curadoria-place-item">
                  <div className="curadoria-place-item__media">
                    <div className="curadoria-place-box curadoria-place-box--colombia">
                      <span>SUA FOTO DA COLÔMBIA</span>
                    </div>
                  </div>
                  <div className="curadoria-place-item__content">
                    <span className="curadoria-place-item__eyebrow">
                      COLÔMBIA &nbsp;—&nbsp; COR
                    </span>
                    <h3 className="curadoria-place-item__title">
                      A cor, a rua e a cultura que ocupa o cotidiano.
                    </h3>
                    <p className="curadoria-place-item__desc">
                      Uma lembrança de que as experiências mais vivas quase nunca
                      estão isoladas em um roteiro: elas acontecem no ritmo real de
                      um lugar.
                    </p>
                  </div>
                </article>

                {/* Bloco 2: Curaçao (Texto Esquerda / Box Direita) */}
                <article className="curadoria-place-item curadoria-place-item--reversed">
                  <div className="curadoria-place-item__media">
                    <div className="curadoria-place-box curadoria-place-box--curacao">
                      <span>SUA FOTO DE CURAÇAO</span>
                    </div>
                  </div>
                  <div className="curadoria-place-item__content">
                    <span className="curadoria-place-item__eyebrow">
                      CURAÇAO &nbsp;—&nbsp; IDENTIDADE
                    </span>
                    <h3 className="curadoria-place-item__title">
                      Um Caribe que não tenta ser igual a todos os outros.
                    </h3>
                    <p className="curadoria-place-item__desc">
                      Uma referência para olhar mar, arquitetura e hospitalidade com mais
                      personalidade — e para lembrar que cada destino tem sua própria
                      linguagem.
                    </p>
                  </div>
                </article>

                {/* Bloco 3: África do Sul (Box Esquerda / Texto Direita) */}
                <article className="curadoria-place-item">
                  <div className="curadoria-place-item__media">
                    <div className="curadoria-place-box curadoria-place-box--africa">
                      <span>SUA FOTO DA ÁFRICA DO SUL</span>
                    </div>
                  </div>
                  <div className="curadoria-place-item__content">
                    <span className="curadoria-place-item__eyebrow">
                      ÁFRICA DO SUL &nbsp;—&nbsp; PAISAGEM
                    </span>
                    <h3 className="curadoria-place-item__title">
                      Experiências que começam antes de chegar.
                    </h3>
                    <p className="curadoria-place-item__desc">
                      A paisagem, o contraste e a expectativa também fazem parte de uma
                      viagem. O percurso pode ser tão marcante quanto o destino.
                    </p>
                  </div>
                </article>

                {/* Bloco 4: Tailândia (Texto Esquerda / Box Direita) */}
                <article className="curadoria-place-item curadoria-place-item--reversed">
                  <div className="curadoria-place-item__media">
                    <div className="curadoria-place-box curadoria-place-box--thailand">
                      <span>SUA FOTO DA TAILÂNDIA</span>
                    </div>
                  </div>
                  <div className="curadoria-place-item__content">
                    <span className="curadoria-place-item__eyebrow">
                      TAILÂNDIA &nbsp;—&nbsp; HOSPITALIDADE
                    </span>
                    <h3 className="curadoria-place-item__title">
                      Hospitalidade como linguagem.
                    </h3>
                    <p className="curadoria-place-item__desc">
                      Cuidado, ritmo, gastronomia e pequenos detalhes: tudo aquilo que
                      faz uma pessoa se sentir recebida antes mesmo de entender o lugar.
                    </p>
                  </div>
                </article>

                {/* Bloco 5: México (Box Esquerda / Texto Direita) */}
                <article className="curadoria-place-item">
                  <div className="curadoria-place-item__media">
                    <div className="curadoria-place-box curadoria-place-box--mexico">
                      <span>SUA FOTO DO MÉXICO</span>
                    </div>
                  </div>
                  <div className="curadoria-place-item__content">
                    <span className="curadoria-place-item__eyebrow">
                      MÉXICO &nbsp;—&nbsp; RETORNO
                    </span>
                    <h3 className="curadoria-place-item__title">
                      O lugar para onde todas as referências voltam.
                    </h3>
                    <p className="curadoria-place-item__desc">
                      Tudo o que conheci fora amplia a forma como hoje apresento o
                      México: com mais contexto, mais intenção e escolhas que fazem
                      sentido para cada pessoa.
                    </p>
                  </div>
                </article>
              </div>

              {/* Frase de Fechamento Integrada */}
              <div className="curadoria-places__closing">
                <h2 className="curadoria-places__closing-text">
                  Cada lugar que conheci mudou um pouco<br className="curadoria-hero__br" />
                  a forma como hoje apresento o México.
                </h2>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 9. CTA FINAL                                                              */}
          {/* ========================================================================= */}
          <section className="curadoria-section curadoria-cta" id="contato">
            <div className="curadoria-cta__container">
              <span className="curadoria-eyebrow">MAIS QUE TURISMO</span>
              <h2 className="curadoria-title curadoria-title--center">
                Sua próxima viagem não precisa parecer com a de ninguém.
              </h2>
              <p className="curadoria-cta__text">
                Se você acredita que sua próxima viagem merece mais do que um roteiro
                pronto, vamos começar uma conversa.
              </p>
              <div className="curadoria-cta__action">
                <button
                  type="button"
                  className="curadoria-button"
                  onClick={() => openTravelPlannerQuiz("curadoria-bella-cta")}
                >
                  Planejar minha viagem <span>→</span>
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
      <Footer />
    </>
  );
}
