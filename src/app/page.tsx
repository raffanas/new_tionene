"use client";

import React, { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HomeTravelPlannerCta from "@/components/HomeTravelPlannerCta";
import CalendarIcon from "@/components/CalendarIcon";
import { SITE_CONFIG } from "@/config/site";

interface TourItem {
  id: string;
  name: string;
  compactName: string;
  label: string;
  description: string;
  image: string;
  alt: string;
}

const TOURS: TourItem[] = [
  {
    id: "chichen-itza",
    name: "Chichén Itzá & Cenote Sagrado",
    compactName: "Chichén Itzá",
    label: "CULTURA & HISTÓRIA · DIA TODO",
    description: "Explore a mística pirâmide maia com guia historiador privativo e banho nas águas cristalinas do cenote Ik Kil.",
    image: "/passeios/chichen-itza.jpg",
    alt: "Pirâmide de Chichén Itzá no México",
  },
  {
    id: "isla-mujeres",
    name: "Isla Mujeres Exclusiva",
    compactName: "Isla Mujeres",
    label: "ILHAS & NAVEGAÇÃO · DIA TODO",
    description: "Navegue em catamarã pelas águas azul-turquesa do Caribe com parada para snorkeling e o encanto de Playa Norte.",
    image: "/passeios/isla-mujeres.jpg",
    alt: "Águas cristalinas de Isla Mujeres",
  },
  {
    id: "xcaret",
    name: "Parque Eco-Arqueológico Xcaret",
    compactName: "Xcaret",
    label: "NATUREZA & CULTURA · DIA TODO",
    description: "Rios subterrâneos, aquário de recife de coral e o emocionante espetáculo folclórico que homenageia o México.",
    image: "/passeios/xcaret.jpg",
    alt: "Parque eco-arqueológico Xcaret",
  },
  {
    id: "xelha",
    name: "Xel-Há Parque All-Inclusive",
    compactName: "Xel-Há",
    label: "AQUÁTICO & NATUREZA · DIA TODO",
    description: "Uma verdadeira enseada natural com snorkeling livre, tirolesas aquáticas e gastronomia completa inclusa.",
    image: "/passeios/xel-ha.jpg",
    alt: "Enseada natural e águas de Xel-Há",
  },
  {
    id: "xplor",
    name: "Xplor Aventura & Tirolesas",
    compactName: "Xplor",
    label: "AVENTURA & ADRENALINA · DIA TODO",
    description: "Tirolesas nas alturas sobre a selva maia, veículos anfíbios e jangadas em cavernas repletas de estalactites.",
    image: "/passeios/Tirolesas.jpg",
    alt: "Aventuras e tirolesas no parque Xplor",
  },
  {
    id: "cozumel-el-cielo",
    name: "Cozumel & El Cielo",
    compactName: "Cozumel El Cielo",
    label: "SNORKELING & MAR · DIA TODO",
    description: "Mergulho nos recifes de corais protegidos e o espetacular banco de areia El Cielo, santuário de estrelas-do-mar.",
    image: "/passeios/cozumel-e-al-cielo.jpg",
    alt: "Águas azul-turquesa de Cozumel El Cielo",
  },
  {
    id: "tulum",
    name: "Ruínas de Tulum & Cenotes",
    compactName: "Tulum",
    label: "HISTÓRIA & PRAIA · MEIO DIA",
    description: "A clássica cidade murada maia sobre as falésias em frente ao mar caribenho aliada a mergulho em cenote aberto.",
    image: "/passeios/ruinas-de-tulum-cenotes.jpg",
    alt: "Ruínas maias de Tulum à beira do mar caribenho",
  },
  {
    id: "coco-bongo",
    name: "Coco Bongo Show & Disco",
    compactName: "Coco Bongo",
    label: "VIDA NOTURNA · SHOW & DISCO",
    description: "O espetáculo mais icônico de Cancún: acrobatas, tributos musicais ao vivo e festa eletrizante na zona hoteleira.",
    image: "/passeios/coco-bongo-show-disco.jpg",
    alt: "Espetáculo musical e festa na Coco Bongo",
  },
];

interface TestimonialItem {
  id: number;
  quote: string;
  author: string;
  place: string;
}

const TESTIMONIALS: TestimonialItem[] = [
  {
    id: 1,
    quote: "Vivemos um México que não teria aparecido em nenhum roteiro pronto. Esse olhar de quem vive aqui faz toda a diferença.",
    author: "BIA & RAFA",
    place: "Holbox · Bacalar · Mérida",
  },
  {
    id: 2,
    quote: "A curadoria foi impecável! Cenotes sem multidões, gastronomia autêntica e suporte rápido em tempo real no WhatsApp.",
    author: "CAROLINA & GUSTAVO",
    place: "Cancún · Tulum · Isla Mujeres",
  },
  {
    id: 3,
    quote: "Viajar com crianças para o México parecia complexo, mas o Tio Nenê organizou a logística perfeita com conforto e zero estresse.",
    author: "FAMÍLIA MENDES",
    place: "Riviera Maya · Xcaret · Xel-Há",
  },
  {
    id: 4,
    quote: "O passeio privativo em Chichén Itzá e o catamarã para Isla Mujeres foram o ponto alto das nossas férias. Recomendo de olhos fechados!",
    author: "MARCELO & BEATRIZ",
    place: "Chichén Itzá · Cozumel El Cielo",
  },
  {
    id: 5,
    quote: "A atenção aos mínimos detalhes transformou nossa lua de mel em algo inesquecível. Experiências exclusivas e gastronomia espetacular.",
    author: "LUCAS & THAÍS",
    place: "Tulum · Sian Ka'an · Bacalar",
  },
  {
    id: 6,
    quote: "Segurança total, carros novos, guias incríveis e pontualidade britânica. Melhor consultoria de viagem do Caribe mexicano!",
    author: "RODRIGO & AMIGOS",
    place: "Cancún · Coco Bongo · Xplor",
  },
  {
    id: 7,
    quote: "A indicação dos hotéis boutique e a rota dos cenotes secretos fizeram nossa viagem ser autêntica e emocionante a cada dia.",
    author: "JULIANA & FELIPE",
    place: "Valladolid · Las Coloradas · Tulum",
  },
  {
    id: 8,
    quote: "Conhecer Cancún com quem mora lá é outro nível. Economizamos tempo, dinheiro e fugimos de todas as furadas de turista.",
    author: "PATRÍCIA & ANDRÉ",
    place: "Cancún · Playa del Carmen · Cozumel",
  },
  {
    id: 9,
    quote: "A consultoria antes de embarcar nos salvou nos dias certos de passeios. Eles sabem exatamente o que fazer em cada época do ano.",
    author: "MARIANA & TIAGO",
    place: "Isla Holbox · Cancún",
  },
  {
    id: 10,
    quote: "Fomos em família com avós e crianças pequenas. A van privativa e a paciência dos guias fizeram as férias serem perfeitas!",
    author: "FAMÍLIA ALBUQUERQUE",
    place: "Cancún · Xcaret · Chichén Itzá",
  },
];

export default function HomePage() {
  const [storyIndex, setStoryIndex] = useState(0);
  const [tourIndex, setTourIndex] = useState(0);

  const prevTour = () => {
    setTourIndex((current) => (current - 1 + TOURS.length) % TOURS.length);
  };

  const nextTour = () => {
    setTourIndex((current) => (current + 1) % TOURS.length);
  };

  const visibleTours = [
    TOURS[tourIndex % TOURS.length],
    TOURS[(tourIndex + 1) % TOURS.length],
    TOURS[(tourIndex + 2) % TOURS.length],
    TOURS[(tourIndex + 3) % TOURS.length],
  ];

  const prevStory = () => {
    setStoryIndex((i) => (i > 0 ? i - 1 : TESTIMONIALS.length - 1));
  };
  const nextStory = () => {
    setStoryIndex((i) => (i < TESTIMONIALS.length - 1 ? i + 1 : 0));
  };

  const renderedStories = [...TESTIMONIALS, ...TESTIMONIALS.slice(0, 5)];
  const heroImageSrc = "/images/img-08-2cf9c873.png";
  const bannerImageSrc = "/images/img-19-71bc3bec.png";

  return (
    <>
      <main>

<section className="hero" aria-labelledby="hero-title">
<img className="hero__image" src="/images/img-08-2cf9c873.png" alt="Vista aérea dos hotéis e da lagoa de Cancún" fetchPriority="high" />
<img className="hero__blur" src="/images/img-09-694ac95d.png" alt=""  />
<Header currentPage="home" />

<p className="hero__description">Viagens e experiências com curadoria local para transformar cada dia em uma história que só poderia ser sua.</p>
<h1 className="hero__title" id="hero-title">cancún</h1>
<p className="hero__location eyebrow">Cancún, México</p>
<div className="hero__cta">
<Link className="button" href={SITE_CONFIG.routes.passeios}>
<CalendarIcon className="button__icon" />Planejar minha viagem</Link>
</div>
</section>
<section className="stats" aria-label="Nossa experiência">
<div className="stats__item">
<strong className="stats__number">12+</strong>
<span className="stats__label">anos em cancún</span>
</div>
<div className="stats__item">
<strong className="stats__number">+500</strong>
<span className="stats__label">famílias atendidas</span>
</div>
<div className="stats__item">
<strong className="stats__number">4.9</strong>
<span className="stats__label">no tripadvisor</span>
</div>
<div className="stats__item">
<strong className="stats__number">100%</strong>
<span className="stats__label">operação local</span>
</div>
</section>
<section className="manifesto" id="sobre">
<div className="manifesto__heading">
<p className="eyebrow">Nosso manifesto</p>
<h2>Mais do que<br />destinos, criamos<br />caminhos para<br />você se conectar<br />com a <em className="accent">essência</em>
<br />de cada lugar.</h2>
</div>
<div className="manifesto__values">
<article className="manifesto__value">
<h3>Curadoria local</h3>
<p>Recomendamos o que conhecemos de perto, não o que todo mundo vende.</p>
</article>
<article className="manifesto__value">
<h3>Operação própria</h3>
<p>Vivemos em Cancún. A logística é nossa, o conforto é seu.</p>
</article>
<article className="manifesto__value">
<h3>Experiências reais</h3>
<p>Destinos que transformam, não apenas fotos bonitas para o feed.</p>
</article>
<article className="manifesto__value">
<h3>Suporte completo</h3>
<p>Antes, durante e depois da viagem — sempre disponíveis.</p>
</article>
</div>
</section>
<section className="ways">
<div className="ways__heading">
<p className="eyebrow">Escolha como quer viajar</p>
<h2>Três jeitos de conhecer o<br />
<em>México</em> com a gente.</h2>
</div>
        <div className="ways__cards">
          <article className="way" id="viagem-completa">
            <img className="way__image" src="/images/img-11-cb103045.png" alt="Paisagem de Cancún — Viagem completa" loading="lazy" />
            <div className="way__body">
              <p className="way__tag">PACOTES 6 A 10 DIAS</p>
              <h3 className="way__title">Viagem completa</h3>
              <p className="way__description">Hospedagem, deslocamentos, experiências e um roteiro inteiro pensado para você.</p>
            </div>
            <a className="way__link" href="/viagem-completa">
              <span>explorar viagem completa</span>
              <svg className="way__arrow" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M1.25 1.5L6.75 7L1.25 12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </article>
          <article className="way way--tours" id="opcoes-passeios">
            <img className="way__image" src="/images/img-13-d3d47d85.png" alt="Paisagem de Cancún — Passeios no México" loading="lazy" />
            <div className="way__body">
              <p className="way__tag">EXPERIÊNCIAS AVULSAS</p>
              <h3 className="way__title">Passeios no México</h3>
              <p className="way__description">Já tem sua hospedagem? Monte sua seleção personalizada de tours por Cancún, Tulum, Cozumel, Holbox e Chichén Itzá.</p>
            </div>
            <a className="way__link" href="/passeios">
              <span>explorar passeios</span>
              <svg className="way__arrow" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M1.25 1.5L6.75 7L1.25 12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </article>
          <article className="way way--bella" id="curadoria-bella">
            <img className="way__image" src="/images/img-14-7b5a01f4.png" alt="Paisagem de Cancún — Curadoria Bella" loading="lazy" />
            <div className="way__body">
              <p className="way__tag">HIGH-END &amp; EXCLUSIVO</p>
              <h3 className="way__title">Curadoria Bella</h3>
              <p className="way__description">Assessoria autoral, ritmo sem pressa, gastronomia de raiz e acesso aos segredos mais refinados do México.</p>
            </div>
            <a className="way__link" href="/curadoria-bella">
              <span>conhecer a curadoria</span>
              <svg className="way__arrow" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M1.25 1.5L6.75 7L1.25 12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </article>
        </div>
</section>
<section className="tours" id="passeios">
<div className="tours__heading">
<div>
<p className="eyebrow">Nossos passeios</p>
<h2>Dias que você vai <em className="accent">lembrar</em>
<br />pelo resto da vida.</h2>
</div>
</div>
        <div className="tours__cards">
          {visibleTours.map((tour, idx) => {
            if (idx === 0) {
              return (
                <article key={tour.id} className="tour tour--featured">
                  <img
                    className="tour__image"
                    src={tour.image}
                    alt={tour.alt}
                    loading="lazy"
                  />
                  <div className="tour__body">
                    <p className="tour__label">{tour.label}</p>
                    <h3 className="tour__title">{tour.name}</h3>
                    <p className="tour__description">{tour.description}</p>
                    <Link className="button" href={SITE_CONFIG.routes.passeios}>
                      <CalendarIcon className="button__icon" />Ver passeio
                    </Link>
                  </div>
                </article>
              );
            }

            return (
              <article
                key={tour.id}
                className="tour tour--compact"
                style={{ cursor: "pointer" }}
                onClick={() => setTourIndex((current) => (current + idx) % TOURS.length)}
                title={`Ver ${tour.name}`}
              >
                <img
                  className="tour__image"
                  src={tour.image}
                  alt={tour.alt}
                  loading="lazy"
                />
                <div className="tour__body">
                  <h3 className="tour__title">{tour.compactName}</h3>
                </div>
                <Link
                  className="tour__arrow"
                  href={SITE_CONFIG.routes.passeios}
                  aria-label={`Ver passeio ${tour.name}`}
                  title="Ver passeio"
                  onClick={(e) => e.stopPropagation()}
                >
                  <svg
                    className="tour__arrow-icon arrow__image"
                    viewBox="0 0 10 18"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M2 2.5L8 9L2 15.5"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
              </article>
            );
          })}
        </div>
        <div className="tours__footer">
          <div className="tours__controls" aria-label="Navegar pelos passeios">
            <button
              className="tours__control control--previous"
              type="button"
              aria-label="Passeio anterior"
              onClick={prevTour}
            >
              <svg
                className="tours__control-icon control__image"
                viewBox="0 0 29 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M27 8H2M9 2L2 8L9 14"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              className="tours__control control--next"
              type="button"
              aria-label="Próximo passeio"
              onClick={nextTour}
            >
              <svg
                className="tours__control-icon control__image"
                viewBox="0 0 29 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M2 8H27M20 2L27 8L20 14"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          <Link className="button tours__cta" href={SITE_CONFIG.routes.passeios}>
            <CalendarIcon className="button__icon" />Planejar minha viagem
          </Link>
        </div>
</section>
<HomeTravelPlannerCta />
<section className="stories">
<div className="stories__heading">
<p className="eyebrow">O que ficou com quem viajou</p>
<h2>Histórias que vêm de quem <em className="accent">viveu</em>.</h2>
</div>
        <div className="stories__viewport">
          <div
            className="stories__list"
            id="depoimentos"
            style={{ "--story-index": storyIndex } as React.CSSProperties}
          >
            {renderedStories.map((story, i) => (
              <figure className="story" key={`${story.id}-${i}`}>
                <div className="story__quote" aria-hidden={true}>“</div>
                <blockquote className="story__text">{story.quote}</blockquote>
                <div className="story__stars" aria-label="5 estrelas">
                  {[...Array(5)].map((_, s) => (
                    <svg key={s} className="story__star" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M8 0.5L10.3 5.2L15.5 5.9L11.7 9.6L12.6 14.8L8 12.4L3.4 14.8L4.3 9.6L0.5 5.9L5.7 5.2L8 0.5Z" />
                    </svg>
                  ))}
                </div>
                <figcaption>
                  {story.author}<br />
                  <span className="story__place">{story.place}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
        <div className="stories__controls">
          <button
            type="button"
            className="stories__control control--previous"
            onClick={prevStory}
            aria-label="Depoimento anterior"
          >
            <svg className="control__svg" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M6.5 1.5L1.5 7L6.5 12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            className="stories__control"
            onClick={nextStory}
            aria-label="Próximo depoimento"
          >
            <svg className="control__svg" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M1.5 1.5L6.5 7L1.5 12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
</section>
<section className="mood">
<div className="mood__content">
<p className="eyebrow">Mood da viagem</p>
<h2>Comece sua viagem<br />antes do <em className="accent">embarque</em>.</h2>
<p>Dê o play na trilha sonora que embala nossos dias em Cancún e <strong>entre no clima</strong> das suas próximas férias.</p>
<a
  className="button"
  href="https://open.spotify.com/playlist/4E1wNPMRieJXE87DE4PjXy?pi=NYvCSgPeS-GT3&si=rWJd9r7GS2mrWZlwPfWI6w"
  target="_blank"
  rel="noopener noreferrer"
>
  Descobrir playlist
</a>
</div>
<a
  className="mood__image-link"
  href="https://open.spotify.com/playlist/4E1wNPMRieJXE87DE4PjXy?pi=NYvCSgPeS-GT3&si=rWJd9r7GS2mrWZlwPfWI6w"
  target="_blank"
  rel="noopener noreferrer"
  title="Abrir playlist do Tio Nenê no Spotify"
  aria-label="Abrir playlist do Tio Nenê no Spotify"
>
  <img
    className="mood__image"
    src="/img/capa-spotify.png"
    alt="Playlist Tio nenê no Spotify"
    id="playlist"
    loading="lazy"
  />
</a>
</section>
<section className="banner" aria-label="Cancún, México">
<img className="banner__image" src={bannerImageSrc} alt="Cancún e México" loading="lazy" />
<p className="banner__title">cancún</p>
<p className="banner__location eyebrow">Cancún, México</p>
</section>
<section className="contact" id="contato">
<p className="eyebrow">Fale com a gente</p>
<h2>Sua viagem do jeito<br />que você <em className="accent">sonha</em>.</h2>
<p className="contact__description">A GENTE COMEÇA ENTENDENDO VOCÊ.<br />O RESTO, DESENHAMOS JUNTOS.</p>
<Link className="button" href={SITE_CONFIG.routes.passeios}>
<CalendarIcon className="button__icon" />Planejar minha viagem</Link>
</section>

      </main>
      <Footer />
    </>
  );
}
