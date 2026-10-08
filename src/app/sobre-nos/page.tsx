"use client";

import React from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function SobreNosPage() {
  return (
    <>
      <div className="about-page">
        <main>
          {/* ========================================================================= */}
          {/* HERO ATUAL — PRESERVADO INTACTO CONFORME DIRETRIZ DA BELLA               */}
          {/* ========================================================================= */}
          <section className="about-hero" id="sobre">
            <Header currentPage="sobre-nos" />

            <div className="about-hero__heading">
              <p className="eyebrow">SOBRE NÓS</p>
              <h1>
                Muito antes de existir uma agência de viagens, existia uma família{" "}
                <em className="accent">apaixonada</em> pelo México.
              </h1>
            </div>
            <div className="about-hero__aside">
              <img
                className="about-hero__symbol"
                alt="Símbolo Tio Nenê"
                src="/img/icon-sol-2.png"
              />
              <p>
                A Tio Nenê não nasceu de um plano de negócios. Nasceu de uma
                história de família, de encontros e de um país que, aos poucos,
                acabou mudando o rumo das nossas vidas.
              </p>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 1. QUEM É O TIO NENÊ?                                                     */}
          {/* ========================================================================= */}
          <section className="about-section about-founder" id="quem-e-tio-nene">
            <div className="about-founder__container">
              <div className="about-founder__image-wrap">
                <img
                  className="about-founder__image"
                  src="/img/sobre-tio-nene.avif"
                  alt="Tio Nenê com boné branco e camisa azul em Cancún"
                />
              </div>
              <div className="about-founder__content">
                <span className="about-eyebrow about-founder__eyebrow">
                  QUEM É O TIO NENÊ?
                </span>
                <h2 className="about-founder__title">
                  Sim, ele existe. E é o<br className="about-founder__br" />
                  Tio Nenê de verdade.
                </h2>
                <div className="about-founder__text">
                  <p>
                    Tio Nenê é o apelido carinhoso do pai da Bella, conhecido pela
                    família e pelos amigos pelo jeito acolhedor de receber as pessoas,
                    contar histórias e fazer qualquer um se sentir em casa. Foi esse
                    espírito de hospitalidade que inspirou o nome da empresa. Até hoje,
                    o Tio Nenê continua fazendo parte da nossa história e representa
                    exatamente a forma como acreditamos que uma viagem deve acontecer:
                    com proximidade, cuidado e pessoas que fazem você se sentir
                    bem-vindo, mesmo estando longe de casa.
                  </p>
                </div>
                <div className="about-founder__quote-box">
                  <blockquote>
                    “Viajar é bom. Mas ser bem recebido faz toda a diferença.”
                  </blockquote>
                  <cite>— TIO NENÊ</cite>
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 2. NOSSA HISTÓRIA                                                         */}
          {/* ========================================================================= */}
          <section className="about-section about-history" id="nossa-historia">
            <div className="about-history__container">
              <span className="about-eyebrow">01 — NOSSA HISTÓRIA</span>
              <h2 className="about-title about-title--center">
                Uma história que começou muito antes da empresa existir.
              </h2>
              <div className="about-history__text">
                <p>
                  Tudo começou em 1986, durante a Copa do Mundo, quando o Tio
                  Nenê veio ao México pela primeira vez para visitar amigos. O que
                  seria apenas uma viagem se transformou em dois anos vivendo em
                  Cancún — e em uma paixão pelas pessoas, pela cultura, pelos
                  sabores e pela forma como o México transforma momentos simples
                  em experiências inesquecíveis. Ao voltar ao Brasil, levou
                  consigo uma certeza: um dia voltaria. Bella cresceu ouvindo
                  essas histórias, imaginando as pescarias, os amigos e um Cancún
                  que ainda era desconhecido entre os brasileiros. Quando visitou
                  Cancún pela primeira vez, aos 17 anos, parecia estar chegando a
                  um lugar que já fazia parte da sua vida. Em 2014, ao retornar
                  para visitar uma amiga, começou ajudando brasileiros em fóruns
                  de viagem, respondendo dúvidas e compartilhando o que
                  descobria. As pessoas passaram a confiar naquele olhar — e foi
                  assim que nasceu a Tio Nenê.
                </p>
              </div>
              <div className="about-history__media">
                <img
                  className="about-history__image"
                  src="/img/sobre-historia.avif"
                  alt="História da Tio Nenê em Cancún desde 2014"
                />
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 3. A CURADORIA POR TRÁS DA TIO NENÊ (BLOCO VINHO)                         */}
          {/* ========================================================================= */}
          <section className="about-section about-curadoria" id="curadoria">
            <div className="about-curadoria__container">
              <div className="about-curadoria__image-wrap">
                <img
                  className="about-curadoria__image"
                  src="/img/sobre-curadoria-bella.avif"
                  alt="Bella diante da arquitetura colonial amarela no México"
                />
              </div>
              <div className="about-curadoria__content">
                <span className="about-eyebrow about-eyebrow--light">
                  CONHEÇA A BELLA
                </span>
                <h2 className="about-title about-title--light">
                  A curadoria por trás da Tio Nenê
                </h2>
                <div className="about-text about-text--light">
                  <p>
                    Ao longo dessa trajetória, Bella sempre esteve à frente da
                    criação de novos projetos dentro da Tio Nenê. Foi uma das
                    responsáveis por transformar a empresa de uma receptiva de
                    passeios em uma operadora completa, desenvolvendo novos
                    produtos, viagens em grupo e experiências personalizadas.
                  </p>
                  <p>
                    Com o tempo, expandiu esse trabalho para além da agência:
                    criou projetos ligados a eventos, comunidades e experiências,
                    organizou viagens para diferentes destinos e aprofundou seus
                    estudos sobre comportamento humano, hospitalidade e design de
                    experiências.
                  </p>
                  <p>
                    Hoje, toda essa bagagem volta para a Tio Nenê através da sua
                    curadoria especial:
                  </p>
                  <p className="about-curadoria__manifesto">
                    “O México que você não encontraria sozinho.”
                  </p>
                  <p>
                    Um olhar para quem deseja viver um México mais autêntico,
                    menos turístico e muito mais conectado com a cultura local,
                    sempre através de experiências desenhadas de acordo com o
                    perfil de cada viajante.
                  </p>
                </div>
                <div className="about-curadoria__cta">
                  <Link href="/curadoria-bella" className="about-link-arrow">
                    CONHEÇA A CURADORIA DA BELLA <span>→</span>
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 4. O QUE ACREDITAMOS (CONTINUIDADE VISUAL VINHO)                           */}
          {/* ========================================================================= */}
          <section className="about-section about-beliefs" id="o-que-acreditamos">
            <div className="about-beliefs__container">
              <div className="about-beliefs__header">
                <span className="about-eyebrow about-eyebrow--light">
                  O QUE ACREDITAMOS
                </span>
                <h2 className="about-title about-title--light about-title--center">
                  Mais do que vender uma viagem, acreditamos em apresentar um
                  México mais humano, autêntico e surpreendente.
                </h2>
              </div>
              <div className="about-beliefs__grid">
                <article className="about-belief-card about-belief-card--cream">
                  <span className="about-belief-card__number">01</span>
                  <h3 className="about-belief-card__title">Segurança</h3>
                  <p className="about-belief-card__description">
                    Continuamos vivendo aqui e explorando novos hotéis,
                    restaurantes, cidades, praias, cenotes e experiências para que
                    cada recomendação venha daquilo que realmente conhecemos.
                  </p>
                </article>
                <article className="about-belief-card about-belief-card--rose">
                  <span className="about-belief-card__number">02</span>
                  <h3 className="about-belief-card__title">Curadoria</h3>
                  <p className="about-belief-card__description">
                    Uma boa viagem não é feita apenas pelos lugares que você
                    visita. Ela é construída pelas escolhas certas, pelas pessoas
                    que encontra e pelas experiências que vive.
                  </p>
                </article>
                <article className="about-belief-card about-belief-card--sage">
                  <span className="about-belief-card__number">03</span>
                  <h3 className="about-belief-card__title">Cuidado</h3>
                  <p className="about-belief-card__description">
                    Desde 2014, cuidamos de cada viajante com experiência,
                    sensibilidade e atenção ao que torna cada história única.
                  </p>
                </article>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 5. CADA ESCOLHA DA VIAGEM, NO MESMO LUGAR (FUNDO CREME)                  */}
          {/* ========================================================================= */}
          <section className="about-section about-services" id="o-que-fazemos">
            <div className="about-services__container">
              <div className="about-services__content">
                <span className="about-eyebrow">O QUE FAZEMOS</span>
                <h2 className="about-title">
                  Cada escolha da viagem, no mesmo lugar.
                </h2>
                <div className="about-text">
                  <p>
                    Passeios em Cancún e Riviera Maya · Viagens completas ·
                    Hospedagem · Transfers · Roteiros personalizados ·
                    Atendimento local durante toda a viagem · Operação para
                    grupos · Parcerias B2B
                  </p>
                </div>
              </div>
              <div className="about-services__image-wrap">
                <img
                  className="about-services__image"
                  src="/img/sobre-mulher-sentada.avif"
                  alt="Equipe Tio Nenê em Cancún"
                />
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 6. UMA EMPRESA FEITA POR PESSOAS (3 FOTOGRAFIAS)                          */}
          {/* ========================================================================= */}
          <section className="about-section about-people" id="feita-por-pessoas">
            <div className="about-people__container">
              <div className="about-people__header">
                <span className="about-eyebrow">UMA EMPRESA FEITA POR PESSOAS</span>
                <h2 className="about-title about-title--center">
                  Antes de sermos uma empresa, sempre fomos uma família.
                </h2>
                <div className="about-people__text">
                  <p>
                    A Cris acompanha a história da Tio Nenê desde os primeiros
                    anos no México e representa a atenção aos detalhes, a
                    disponibilidade para ajudar e a sensação de estar acompanhado
                    por alguém que realmente se importa. E existe também um
                    integrante muito especial: Oliver, nosso mascote oficial —
                    presente em embarques, aeroportos, passeios e nas memórias de
                    quem volta anos depois perguntando como ele está. São esses
                    pequenos detalhes que fizeram da Tio Nenê muito mais do que
                    uma agência de viagens. Construíram uma empresa feita de
                    relações.
                  </p>
                </div>
              </div>
              <div className="about-people__gallery">
                <div className="about-people__photo-wrap">
                  <img
                    className="about-people__photo"
                    src="/img/sobre-familia-arvore.avif"
                    alt="Cris e família na escultura mágica em Cancún"
                  />
                </div>
                <div className="about-people__photo-wrap">
                  <img
                    className="about-people__photo"
                    src="/img/sobre-tio-nene-crianca.avif"
                    alt="Tio Nenê e criança compartilhando momentos no México"
                  />
                </div>
                <div className="about-people__photo-wrap">
                  <img
                    className="about-people__photo"
                    src="/img/sobre-tio-nene.avif"
                    alt="Tio Nenê presente em Cancún"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 7. CTA FINAL (FUNDO AMARELO/CREME SUAVE)                                   */}
          {/* ========================================================================= */}
          <section className="about-section about-cta" id="contato">
            <div className="about-cta__container">
              <span className="about-eyebrow">MAIS DO QUE TURISMO</span>
              <h2 className="about-title about-title--center">
                A melhor forma de conhecer um destino é aquela que foi pensada
                para você.
              </h2>
              <div className="about-cta__text">
                <p>
                  Seja para alguns dias em Cancún, uma viagem completa ou uma
                  experiência totalmente personalizada, teremos o prazer de
                  ajudar você a descobrir um México que vai muito além do óbvio.
                </p>
              </div>
              <div className="about-cta__action">
                <Link href="/viagem-completa" className="about-button-primary">
                  PLANEJAR MINHA VIAGEM <span>→</span>
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
