"use client";

import React, { useRef } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CalendarIcon from "@/components/CalendarIcon";
import { SITE_CONFIG } from "@/config/site";

export default function CuradoriaBellaPage() {
  const scrollTrack = (trackId: string, direction: number) => {
    const el = document.getElementById(trackId);
    if (el) {
      el.scrollBy({
        left: direction * 320,
        behavior: "smooth"
      });
    }
  };

  return (
    <>
      <div className="curadoria">
<main>

<section className="bella-hero" id="curadoria">
<Header currentPage="curadoria-bella" />

<h1>O México que você não encontraria sozinho</h1>
<p className="eyebrow bella-hero__label">CURADORIA DE VIAGENS AUTORAIS POR BELLA</p>
<p className="bella-hero__aside">Viagens personalizadas para quem procura experiências fora do óbvio.</p>
<a className="button" href="#contato">
<CalendarIcon className="button__icon" />Planejar minha viagem</a>
</section>
<section className="bella-intro">
<p className="eyebrow bella-label">seu roteiro, do seu jeito.</p>
<h2 className="bella-title">A minha forma<br />de <em className="accent">olhar</em>.</h2>
<p className="bella-intro__text">Durante mais de dez anos à frente da Tio Nenê, ajudei milhares de brasileiros a descobrirem Cancún. Foi aqui que transformamos uma receptiva em uma operadora completa, criamos novos produtos, começamos a trabalhar com grupos e passamos a desenhar viagens inteiras, muito além dos passeios.</p>
</section>
<section className="bella-gallery" aria-label="Viagens da Bella">
<div className="bella-gallery__track" id="bella-galeria">
<img className="bella-gallery__image" alt="Bella diante de uma construção amarela no México" src="/images/img-03-61e2f30d.png" />
<img className="bella-gallery__image" alt="Bella diante de uma construção amarela no México" src="/images/img-03-61e2f30d.png" />
<img className="bella-gallery__image" alt="Bella diante de uma construção amarela no México" src="/images/img-03-61e2f30d.png" />
<img className="bella-gallery__image" alt="Bella diante de uma construção amarela no México" src="/images/img-03-61e2f30d.png" />
<img className="bella-gallery__image" alt="Bella diante de uma construção amarela no México" src="/images/img-03-61e2f30d.png" />
</div>
<div className="bella-controls">
<button type="button" className="bella-controls__button bella-controls__button--previous" data-track="bella-galeria" data-direction="-1" aria-label="Anterior" onClick={() => scrollTrack("bella-galeria", Number("-1"))}>
<img className="bella-controls__icon" alt="" src="/images/img-04-f9b50443.png" />
</button>
<button type="button" className="bella-controls__button " data-track="bella-galeria" data-direction="1" aria-label="Próximo" onClick={() => scrollTrack("bella-galeria", Number("1"))}>
<img className="bella-controls__icon" alt="" src="/images/img-04-f9b50443.png" />
</button>
</div>
</section>
<section className="bella-story">
<h2>Mas, enquanto a empresa crescia, uma <em className="accent">curiosidade</em> também crescia em mim.</h2>
<p className="bella-story__copy">Eu queria entender por que algumas viagens ficam para sempre na <strong>memória</strong> e outras <strong>desaparecem</strong> poucos dias depois.<br />
<br />Essa pergunta me levou muito além do turismo. Passei a criar eventos, viagens cocriadas com comunidades, expedições, experiências autorais e projetos em diferentes lugares do mundo. Vivi temporadas em países diferentes, conheci centenas de hotéis, restaurantes, bairros, pessoas e culturas.</p>
</section>
<section className="bella-experiences">
<div className="bella-experiences__quote">
<p className="eyebrow bella-label">E, aos poucos, percebi que meu<br />trabalho nunca foi vender destinos.</p>
<h2>Sempre foi desenhar <em className="accent">experiências</em>.</h2>
</div>
<div className="bella-experiences__body">
<div>
<p className="eyebrow bella-label">experiências</p>
<h2>Existem dois tipos de viagem.</h2>
</div>
<p className="bella-experiences__copy">Aquela em que você conhece os pontos turísticos. E aquela em que você conhece um lugar.<br />
<br />Hoje volto para a Tio Nenê trazendo esse novo olhar: menos preocupado em marcar atrações em um mapa e mais interessado em entender quem é você, como gosta de viajar e que tipo de lembrança quer levar para casa.</p>
</div>
</section>
<section className="bella-audience">
<p className="eyebrow bella-label">para quem é a curadoria</p>
<h2 className="bella-title">Para quem quer viver o México <em className="accent">além</em> do roteiro tradicional.</h2>
<ol className="bella-audience__list">
<li>01 &nbsp;Para quem já veio a Cancún e quer descobrir outros lugares.</li>
<li>02 &nbsp;Para quem busca uma lua de mel realmente única.</li>
<li>03 &nbsp;Para famílias que preferem experiências a checklists.</li>
<li>04 &nbsp;Para viajantes curiosos.</li>
<li>05 &nbsp;Para quem acredita que viajar amplia repertório.</li>
<li>06 &nbsp;Para quem quer uma viagem com a sua própria medida.</li>
</ol>
</section>
<section className="bella-banner" aria-label="Cancún, México">
<img className="bella-banner__image" alt="Bella em frente à arquitetura amarela mexicana" src="/images/test_banner_v1.png" />
<p className="eyebrow bella-banner__label">CANCÚN, MÉXICO</p>
<h2>cancún</h2>
<div className="bella-controls">
<button type="button" className="bella-controls__button bella-controls__button--previous" disabled aria-disabled="true" data-track="banner" data-direction="-1" aria-label="Anterior" onClick={() => scrollTrack("banner", Number("-1"))}>
<img className="bella-controls__icon" alt="" src="/images/img-04-f9b50443.png" />
</button>
<button type="button" className="bella-controls__button " disabled aria-disabled="true" data-track="banner" data-direction="1" aria-label="Próximo" onClick={() => scrollTrack("banner", Number("1"))}>
<img className="bella-controls__icon" alt="" src="/images/img-04-f9b50443.png" />
</button>
</div>
</section>
<section className="bella-together">
<p className="eyebrow bella-label">O que fazemos juntos</p>
<h2 className="bella-title">Cada viagem nasce a partir da <em className="accent">sua</em> história.</h2>
<p className="bella-together__text">Podemos desenhar uma viagem completa pelo México ou um roteiro que combine hotéis, gastronomia, natureza, cultura, bem-estar e experiências locais. O objetivo não é fazer você conhecer mais lugares. É fazer você viver melhor cada lugar.</p>
</section>
<section className="bella-series">
<p className="eyebrow bella-label">a série</p>
<h2>O México que você não encontraria sozinho.</h2>
<p className="bella-series__description">Quatro capítulos sobre as histórias, referências e descobertas que formaram o meu olhar.</p>
<div className="bella-series__track" id="bella-episodios">
<article className="bella-episode">
<p>EPISÓDIO 01</p>
<h3>Antes de morar aqui, eu já conhecia o México</h3>
</article>
<article className="bella-episode">
<p>EPISÓDIO 01</p>
<h3>Antes de morar aqui, eu já conhecia o México</h3>
</article>
<article className="bella-episode">
<p>EPISÓDIO 01</p>
<h3>Antes de morar aqui, eu já conhecia o México</h3>
</article>
<article className="bella-episode">
<p>EPISÓDIO 01</p>
<h3>Antes de morar aqui, eu já conhecia o México</h3>
</article>
</div>
<div className="bella-controls">
<button type="button" className="bella-controls__button " data-track="bella-episodios" data-direction="1" aria-label="Próximo" onClick={() => scrollTrack("bella-episodios", Number("1"))}>
<img className="bella-controls__icon" alt="" src="/images/img-04-f9b50443.png" />
</button>
</div>
</section>
<section className="bella-atlas">
<p className="eyebrow bella-label">ATLAS DE REFERÊNCIA</p>
<h2 className="bella-title">Os lugares que <em className="accent">mudaram</em> meu olhar.</h2>
<p className="bella-atlas__intro">Viajar pelo mundo não me afastou do México. Me deu novas referências para enxergá-lo.</p>
<div className="bella-atlas__track" id="bella-atlas">
<article className="bella-place">
<img className="bella-place__image" alt="Vista de Cancún ao entardecer, fotografia do atlas de referência" src="/images/img-06-b766bd7f.png" />
<h3>A cor, a rua e a cultura que ocupa o cotidiano.</h3>
<p className="bella-place__copy">Uma lembrança de que as experiências mais vivas quase nunca estão isoladas em um roteiro: elas acontecem no ritmo real de um lugar.</p>
<p className="bella-place__label">COLOMBIA<br />COR</p>
</article>
<article className="bella-place">
<img className="bella-place__image" alt="Vista de Cancún ao entardecer, fotografia do atlas de referência" src="/images/img-07-56639b33.png" />
<h3>Um Caribe que não tenta ser igual a todos os outros.</h3>
<span className="bella-place__arrow" aria-hidden={true}>
<img className="" alt="" src="/images/img-04-f9b50443.png" />
</span>
<p className="bella-place__label">CURAÇAO<br />IDENTIDADE</p>
</article>
<article className="bella-place">
<img className="bella-place__image" alt="Vista de Cancún ao entardecer, fotografia do atlas de referência" src="/images/img-07-56639b33.png" />
<h3>Experiências que começam antes de chegar.</h3>
<span className="bella-place__arrow" aria-hidden={true}>
<img className="" alt="" src="/images/img-04-f9b50443.png" />
</span>
<p className="bella-place__label">ÁFRICA DO SUL<br />PAISAGEM</p>
</article>
<article className="bella-place">
<img className="bella-place__image" alt="Vista de Cancún ao entardecer, fotografia do atlas de referência" src="/images/img-07-56639b33.png" />
<h3>Hospitalidade como linguagem.</h3>
<span className="bella-place__arrow" aria-hidden={true}>
<img className="" alt="" src="/images/img-04-f9b50443.png" />
</span>
<p className="bella-place__label">TAILÂNDIA<br />HOSPITALIDADE</p>
</article>
<article className="bella-place">
<img className="bella-place__image" alt="Vista de Cancún ao entardecer, fotografia do atlas de referência" src="/images/img-07-56639b33.png" />
<h3>Hospitalidade como linguagem.</h3>
<span className="bella-place__arrow" aria-hidden={true}>
<img className="" alt="" src="/images/img-04-f9b50443.png" />
</span>
<p className="bella-place__label">TAILÂNDIA<br />HOSPITALIDADE</p>
</article>
</div>
<div className="bella-controls">
<button type="button" className="bella-controls__button bella-controls__button--previous" data-track="bella-atlas" data-direction="-1" aria-label="Anterior" onClick={() => scrollTrack("bella-atlas", Number("-1"))}>
<img className="bella-controls__icon" alt="" src="/images/img-04-f9b50443.png" />
</button>
<button type="button" className="bella-controls__button " data-track="bella-atlas" data-direction="1" aria-label="Próximo" onClick={() => scrollTrack("bella-atlas", Number("1"))}>
<img className="bella-controls__icon" alt="" src="/images/img-04-f9b50443.png" />
</button>
</div>
<p className="bella-atlas__closing">Cada lugar que conheci mudou um pouco a forma como hoje apresento o México.</p>
</section>
<section className="bella-contact" id="contato">
<p className="eyebrow bella-label">mais que turismo</p>
<h2>Sua próxima viagem não precisa parecer com a de ninguém.</h2>
<p className="bella-contact__text">Se você acredita que sua próxima viagem merece mais do que um roteiro pronto, vamos começar uma conversa.</p>
<a className="button" href="/passeios#catalogo">
<CalendarIcon className="button__icon" />Planejar minha viagem</a>
</section>

      </main>
</div>
      <Footer />
    </>
  );
}
