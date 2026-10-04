"use client";

import React from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function CuradoriaBellaPage() {
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
                <h1>O México que você não encontraria sozinho</h1>
                <p className="curadoria-hero__aside">
                  Viagens personalizadas para quem procura experiências fora do óbvio.
                </p>
                <a href="#contato" className="curadoria-button">
                  Planejar minha viagem <span>→</span>
                </a>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 2. BLOCO MANIFESTO / INTRODUÇÃO                                           */}
          {/* ========================================================================= */}
          <section className="curadoria-section curadoria-manifesto" id="manifesto">
            <div className="curadoria-manifesto__container">
              <span className="curadoria-eyebrow">SEU ROTEIRO, DO SEU JEITO</span>
              <h2 className="curadoria-title curadoria-title--center">
                A minha forma de olhar.
              </h2>
              <div className="curadoria-text curadoria-manifesto__text">
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
              </div>
              <div className="curadoria-manifesto__highlight">
                <blockquote>
                  “E, aos poucos, percebi que meu trabalho nunca foi vender destinos.
                  Sempre foi desenhar experiências.”
                </blockquote>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 3. “EXISTEM DOIS TIPOS DE VIAGEM” (GRANDE BLOCO VINHO)                    */}
          {/* ========================================================================= */}
          <section className="curadoria-section curadoria-two-types" id="dois-tipos-de-viagem">
            <div className="curadoria-two-types__container">
              <span className="curadoria-eyebrow curadoria-eyebrow--light">
                EXPERIÊNCIAS
              </span>
              <h2 className="curadoria-title curadoria-title--light curadoria-title--center">
                Existem dois tipos de viagem.
              </h2>
              <div className="curadoria-text curadoria-text--light curadoria-two-types__text">
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
          </section>

          {/* ========================================================================= */}
          {/* 4. “PARA QUEM QUER VIVER O MÉXICO ALÉM DO ROTEIRO TRADICIONAL”           */}
          {/* ========================================================================= */}
          <section className="curadoria-section curadoria-audience" id="para-quem-e">
            <div className="curadoria-audience__container">
              <span className="curadoria-eyebrow">PARA QUEM É A CURADORIA</span>
              <h2 className="curadoria-title curadoria-title--center">
                Para quem quer viver o México além do roteiro tradicional.
              </h2>
              <div className="curadoria-audience__grid">
                <div className="curadoria-audience__item">
                  <span className="curadoria-audience__num">01</span>
                  <p className="curadoria-audience__desc">
                    Para quem já veio a Cancún e quer descobrir outros lugares.
                  </p>
                </div>
                <div className="curadoria-audience__item">
                  <span className="curadoria-audience__num">02</span>
                  <p className="curadoria-audience__desc">
                    Para quem busca uma lua de mel realmente única.
                  </p>
                </div>
                <div className="curadoria-audience__item">
                  <span className="curadoria-audience__num">03</span>
                  <p className="curadoria-audience__desc">
                    Para famílias que preferem experiências a checklists.
                  </p>
                </div>
                <div className="curadoria-audience__item">
                  <span className="curadoria-audience__num">04</span>
                  <p className="curadoria-audience__desc">
                    Para viajantes curiosos.
                  </p>
                </div>
                <div className="curadoria-audience__item">
                  <span className="curadoria-audience__num">05</span>
                  <p className="curadoria-audience__desc">
                    Para quem acredita que viajar amplia repertório.
                  </p>
                </div>
                <div className="curadoria-audience__item">
                  <span className="curadoria-audience__num">06</span>
                  <p className="curadoria-audience__desc">
                    Para quem quer uma viagem com a sua própria medida.
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
              <span className="curadoria-eyebrow">O QUE FAZEMOS JUNTOS</span>
              <h2 className="curadoria-title curadoria-title--center">
                Cada viagem nasce a partir da sua história.
              </h2>
              <div className="curadoria-text curadoria-origin__text">
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
                <span className="curadoria-eyebrow">A SÉRIE</span>
                <h2 className="curadoria-title curadoria-title--center">
                  O México que você não encontraria sozinho.
                </h2>
                <p className="curadoria-series__subtitle">
                  Quatro capítulos sobre as histórias, referências e descobertas que
                  formaram o meu olhar.
                </p>
              </div>

              <div className="curadoria-series__grid">
                <article className="curadoria-series-card curadoria-series-card--clay">
                  <span className="curadoria-series-card__tag">CAPÍTULO 01</span>
                  <h3 className="curadoria-series-card__title">
                    Antes de morar aqui, eu já conhecia o México
                  </h3>
                  <p className="curadoria-series-card__desc">
                    As primeiras memórias, as histórias de família e como Cancún se
                    transformou em parte da minha história.
                  </p>
                </article>

                <article className="curadoria-series-card curadoria-series-card--blue">
                  <span className="curadoria-series-card__tag">CAPÍTULO 02</span>
                  <h3 className="curadoria-series-card__title">
                    O olhar que transforma o destino
                  </h3>
                  <p className="curadoria-series-card__desc">
                    Como dez anos de experiência no México me ensinaram a enxergar
                    além dos pontos turísticos tradicionais.
                  </p>
                </article>

                <article className="curadoria-series-card curadoria-series-card--cream">
                  <span className="curadoria-series-card__tag">CAPÍTULO 03</span>
                  <h3 className="curadoria-series-card__title">
                    A cultura que não está nos guias
                  </h3>
                  <p className="curadoria-series-card__desc">
                    A riqueza dos cenotes secretos, gastronomia de raiz e os encontros
                    que tornam cada dia único.
                  </p>
                </article>

                <article className="curadoria-series-card curadoria-series-card--rose">
                  <span className="curadoria-series-card__tag">CAPÍTULO 04</span>
                  <h3 className="curadoria-series-card__title">
                    O México autêntico e contemporâneo
                  </h3>
                  <p className="curadoria-series-card__desc">
                    A combinação entre hospitalidade de alto padrão, design autoral e
                    vivências desenhadas sob medida.
                  </p>
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
                <span className="curadoria-eyebrow">ATLAS DE REFERÊNCIA</span>
                <h2 className="curadoria-title curadoria-title--center">
                  Os lugares que mudaram meu olhar.
                </h2>
                <p className="curadoria-places__subtitle">
                  Viajar pelo mundo não me afastou do México. Me deu novas
                  referências para enxergá-lo.
                </p>
              </div>

              <div className="curadoria-places__list">
                {/* Bloco 1: Imagem Esquerda / Texto Direita */}
                <article className="curadoria-place-item">
                  <div className="curadoria-place-item__media">
                    <img
                      className="curadoria-place-item__image"
                      src="/images/img-06-b766bd7f.png"
                      alt="Colômbia, referência visual de cor e cultura"
                    />
                  </div>
                  <div className="curadoria-place-item__content">
                    <span className="curadoria-eyebrow">COLÔMBIA · COR</span>
                    <h3 className="curadoria-title">
                      A cor, a rua e a cultura que ocupa o cotidiano.
                    </h3>
                    <div className="curadoria-text">
                      <p>
                        Uma lembrança de que as experiências mais vivas quase nunca
                        estão isoladas em um roteiro: elas acontecem no ritmo real de
                        um lugar.
                      </p>
                    </div>
                  </div>
                </article>

                {/* Bloco 2: Texto Esquerda / Imagem Direita */}
                <article className="curadoria-place-item curadoria-place-item--reversed">
                  <div className="curadoria-place-item__media">
                    <img
                      className="curadoria-place-item__image"
                      src="/images/img-07-56639b33.png"
                      alt="Curaçao, referência de identidade caribenha"
                    />
                  </div>
                  <div className="curadoria-place-item__content">
                    <span className="curadoria-eyebrow">CURAÇAO · IDENTIDADE</span>
                    <h3 className="curadoria-title">
                      Um Caribe que não tenta ser igual a todos os outros.
                    </h3>
                    <div className="curadoria-text">
                      <p>
                        A importância de valorizar a singularidade de cada cultura,
                        arquitetura e ritmo local em vez de reproduzir padrões
                        genéricos.
                      </p>
                    </div>
                  </div>
                </article>

                {/* Bloco 3: Imagem Esquerda / Texto Direita */}
                <article className="curadoria-place-item">
                  <div className="curadoria-place-item__media">
                    <img
                      className="curadoria-place-item__image"
                      src="/images/img-28-81baf457.png"
                      alt="África do Sul, referência de paisagem e escala natural"
                    />
                  </div>
                  <div className="curadoria-place-item__content">
                    <span className="curadoria-eyebrow">ÁFRICA DO SUL · PAISAGEM</span>
                    <h3 className="curadoria-title">
                      Experiências que começam antes de chegar.
                    </h3>
                    <div className="curadoria-text">
                      <p>
                        A imensidão natural e a forma como a escala dos cenários nos
                        convida a desacelerar e contemplar com reverência.
                      </p>
                    </div>
                  </div>
                </article>

                {/* Bloco 4: Texto Esquerda / Imagem Direita */}
                <article className="curadoria-place-item curadoria-place-item--reversed">
                  <div className="curadoria-place-item__media">
                    <img
                      className="curadoria-place-item__image"
                      src="/images/img-29-7d854e7b.png"
                      alt="Tailândia, referência de hospitalidade como linguagem"
                    />
                  </div>
                  <div className="curadoria-place-item__content">
                    <span className="curadoria-eyebrow">TAILÂNDIA · HOSPITALIDADE</span>
                    <h3 className="curadoria-title">
                      Hospitalidade como linguagem.
                    </h3>
                    <div className="curadoria-text">
                      <p>
                        A delicadeza nos detalhes, a generosidade no receber e a
                        percepção de que o verdadeiro luxo mora na gentileza humana.
                      </p>
                    </div>
                  </div>
                </article>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 8. FRASE DE FECHAMENTO                                                    */}
          {/* ========================================================================= */}
          <section className="curadoria-closing" id="fechamento">
            <div className="curadoria-closing__container">
              <blockquote>
                “Cada lugar que conheci mudou um pouco a forma como hoje apresento o México.”
              </blockquote>
              <cite>— BELLA</cite>
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
                <Link href="/viagem-completa" className="curadoria-button">
                  Planejar minha viagem <span>→</span>
                </Link>
              </div>
            </div>
          </section>
        </main>
      </div>
      <Footer />
    </>
  );
}
