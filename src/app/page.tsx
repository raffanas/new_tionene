"use client";

import React, { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TripQuiz from "@/components/TripQuiz";
import { SITE_CONFIG } from "@/config/site";

export default function HomePage() {
  const [storyIndex, setStoryIndex] = useState(0);
  const [bannerAlt, setBannerAlt] = useState(false);

  const maxStories = 3;
  const prevStory = () => setStoryIndex((i) => Math.max(0, i - 1));
  const nextStory = () => setStoryIndex((i) => Math.min(maxStories, i + 1));
  const toggleBanner = () => setBannerAlt((prev) => !prev);

  const heroImageSrc = "/images/img-08-2cf9c873.png";
  const bannerImageSrc = bannerAlt ? "/images/img-08-2cf9c873.png" : "/images/img-19-71bc3bec.png";

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
<a className="button" href="#contato">
<img className="button__icon" src="/images/img-02-fa3a6973.png" alt=""  />Planejar minha viagem</a>
</div>
<div className="hero__dots" aria-hidden={true}>
<span className="hero__dot">
</span>
<span className="hero__dot">
</span>
<span className="hero__dot">
</span>
<span className="hero__dot">
</span>
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
<article className="way " id="viagem-completa">
<img className="way__badge" src="/images/img-10-607f3f54.png" alt="Destaque"  />
<img className="way__image" src="/images/img-11-cb103045.png" alt="Paisagem de Cancún — Viagem completa" loading="lazy" />
<div className="way__body">
<p className="way__tag">PACOTES 6 A 10 DIAS</p>
<h3 className="way__title">Viagem completa</h3>
<p className="way__description">Viagem completa<br />Hospedagem, deslocamentos, experiências e um roteiro inteiro pensado para você.</p>
</div>
<a className="way__link" href="/viagem-completa">
<span>explorar viagem completa</span>
<img className="way__arrow" src="/images/img-12-59a80b78.png" alt=""  />
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
<img className="way__arrow" src="/images/img-12-59a80b78.png" alt=""  />
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
<img className="way__arrow" src="/images/img-12-59a80b78.png" alt=""  />
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
<a className="button" href="/passeios">
<img className="button__icon" src="/images/img-02-fa3a6973.png" alt=""  />Planejar minha viagem</a>
</div>
<div className="tours__cards">
<article className="tour tour--featured">
<img className="tour__image" src="/images/img-06-b766bd7f.png" alt="Vista da região hoteleira de Cancún" loading="lazy" />
<div className="tour__body">
<p className="tour__label">CULTURA &amp; HISTÓRIA · DIA TODO</p>
<h3 className="tour__title">Chichén Itzá &amp; Cenote Sagrado</h3>
<p className="tour__description">Explore a mística pirâmide maia com guia historiador privativo e banho nas águas cristalinas do cenote Ik Kil.</p>
<a className="button" href="/passeios">
<img className="button__icon" src="/images/img-02-fa3a6973.png" alt=""  />Planejar minha viagem</a>
</div>
</article>
<article className="tour ">
<img className="tour__image" src="/images/img-07-56639b33.png" alt="Vista da região hoteleira de Cancún" loading="lazy" />
<div className="tour__body">
<h3 className="tour__title">Chichén Itzá &amp; Cenote Sagrado</h3>
</div>
<a className="tour__arrow" href="/passeios" aria-label="Consultar passeio">
<img className="arrow__image" src="/images/img-04-f9b50443.png" alt=""  />
</a>
</article>
<article className="tour ">
<img className="tour__image" src="/images/img-07-56639b33.png" alt="Vista da região hoteleira de Cancún" loading="lazy" />
<div className="tour__body">
<h3 className="tour__title">Chichén Itzá &amp; Cenote Sagrado</h3>
</div>
<a className="tour__arrow" href="/passeios" aria-label="Consultar passeio">
<img className="arrow__image" src="/images/img-04-f9b50443.png" alt=""  />
</a>
</article>
<article className="tour ">
<img className="tour__image" src="/images/img-07-56639b33.png" alt="Vista da região hoteleira de Cancún" loading="lazy" />
<div className="tour__body">
<h3 className="tour__title">Chichén Itzá &amp; Cenote Sagrado</h3>
</div>
<a className="tour__arrow" href="/passeios" aria-label="Consultar passeio">
<img className="arrow__image" src="/images/img-04-f9b50443.png" alt=""  />
</a>
</article>
</div>
<div className="tours__controls" aria-label="Navegar pelos passeios">
<button className="tours__control control--previous" type="button" aria-label="Passeio anterior" data-direction="-1">
<img className="control__image" src="/images/img-15-07b4863d.png" alt=""  />
</button>
<button className="tours__control" type="button" aria-label="Próximo passeio" data-direction="1">
<img className="control__image" src="/images/img-16-59630f35.png" alt=""  />
</button>
</div>
</section>
<TripQuiz />
<section className="stories">
<div className="stories__heading">
<p className="eyebrow">O que ficou com quem viajou</p>
<h2>Histórias que vêm de quem <em className="accent">viveu</em>.</h2>
</div>
<div className="stories__viewport">
<div className="stories__list" id="depoimentos">
<figure className="story">
<div className="story__quote" aria-hidden={true}>“</div>
<blockquote className="story__text">Vivemos um México que não teria aparecido em nenhum roteiro pronto. Esse olhar de quem vive aqui faz toda a diferença.</blockquote>
<img className="story__stars" src="/images/img-17-5d9abe0e.png" alt="5 estrelas" loading="lazy" />
<figcaption>BIA &amp; RAFA<br />
<span className="story__place">Holbox · Bacalar · Mérida</span>
</figcaption>
</figure>
<figure className="story">
<div className="story__quote" aria-hidden={true}>“</div>
<blockquote className="story__text">Vivemos um México que não teria aparecido em nenhum roteiro pronto. Esse olhar de quem vive aqui faz toda a diferença.</blockquote>
<img className="story__stars" src="/images/img-17-5d9abe0e.png" alt="5 estrelas" loading="lazy" />
<figcaption>BIA &amp; RAFA<br />
<span className="story__place">Holbox · Bacalar · Mérida</span>
</figcaption>
</figure>
<figure className="story">
<div className="story__quote" aria-hidden={true}>“</div>
<blockquote className="story__text">Vivemos um México que não teria aparecido em nenhum roteiro pronto. Esse olhar de quem vive aqui faz toda a diferença.</blockquote>
<img className="story__stars" src="/images/img-17-5d9abe0e.png" alt="5 estrelas" loading="lazy" />
<figcaption>BIA &amp; RAFA<br />
<span className="story__place">Holbox · Bacalar · Mérida</span>
</figcaption>
</figure>
<figure className="story">
<div className="story__quote" aria-hidden={true}>“</div>
<blockquote className="story__text">Vivemos um México que não teria aparecido em nenhum roteiro pronto. Esse olhar de quem vive aqui faz toda a diferença.</blockquote>
<img className="story__stars" src="/images/img-17-5d9abe0e.png" alt="5 estrelas" loading="lazy" />
<figcaption>BIA &amp; RAFA<br />
<span className="story__place">Holbox · Bacalar · Mérida</span>
</figcaption>
</figure>
<figure className="story">
<div className="story__quote" aria-hidden={true}>“</div>
<blockquote className="story__text">Vivemos um México que não teria aparecido em nenhum roteiro pronto. Esse olhar de quem vive aqui faz toda a diferença.</blockquote>
<img className="story__stars" src="/images/img-17-5d9abe0e.png" alt="5 estrelas" loading="lazy" />
<figcaption>BIA &amp; RAFA<br />
<span className="story__place">Holbox · Bacalar · Mérida</span>
</figcaption>
</figure>
</div>
</div>
<div className="stories__controls">
<button type="button" className="stories__control control--previous" onClick={prevStory} aria-label="Depoimento anterior">
<img className="control__image" src="/images/img-04-f9b50443.png" alt=""  />
</button>
<button type="button" className="stories__control" onClick={nextStory} aria-label="Próximo depoimento">
<img className="control__image" src="/images/img-04-f9b50443.png" alt=""  />
</button>
</div>
</section>
<section className="mood">
<div className="mood__content">
<p className="eyebrow">Mood da viagem</p>
<h2>Comece sua viagem<br />antes do <em className="accent">embarque</em>.</h2>
<p>Dê o play na trilha sonora que embala nossos dias em Cancún e <strong>entre no clima</strong> das suas próximas férias.</p>
<a className="button" href="#playlist">Descobrir playlist</a>
</div>
<img className="mood__image" src="/images/img-18-c8472a1f.png" alt="Playlist Tio nenê no Spotify, conforme a imagem apresentada no design" id="playlist" loading="lazy" />
</section>
<section className="banner" aria-label="Cancún, México">
<img className="banner__image" src={bannerImageSrc} alt="Cancún e México" />
<p className="banner__title">cancún</p>
<p className="banner__location eyebrow">Cancún, México</p>
<div className="banner__controls">
<button type="button" className="banner__control" onClick={toggleBanner} aria-label="Alternar foto">
<img className="control__image" src="/images/img-04-f9b50443.png" alt=""  />
</button>
<button type="button" className="banner__control" onClick={toggleBanner} aria-label="Alternar foto">
<img className="control__image" src="/images/img-04-f9b50443.png" alt=""  />
</button>
</div>
</section>
<section className="contact" id="contato">
<p className="eyebrow">Fale com a gente</p>
<h2>Sua viagem do jeito<br />que você <em className="accent">sonha</em>.</h2>
<p className="contact__description">A GENTE COMEÇA ENTENDENDO VOCÊ.<br />O RESTO, DESENHAMOS JUNTOS.</p>
<a className="button" role="link" aria-disabled="true" data-whatsapp>
<img className="button__icon" src="/images/img-02-fa3a6973.png" alt=""  />Planejar minha viagem</a>
</section>

      </main>
      <Footer />
    </>
  );
}
