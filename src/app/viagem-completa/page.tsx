"use client";

import React from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SITE_CONFIG } from "@/config/site";

export default function ViagemCompletaPage() {
  const handlePackageClick = (packageName: string) => {
    const whatsapp = SITE_CONFIG.whatsapp;
    const text = `Olá! Gostaria de saber mais sobre o pacote de Viagem Completa: ${packageName}.`;
    if (whatsapp) {
      window.open(`https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`, "_blank");
    } else {
      const el = document.querySelector("#contato");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <div className="trip-page">
<main>

<section className="trip-hero" id="viagem-completa">
<img className="trip-hero__image" src="/images/img-08-2cf9c873.png" alt="Vista aérea de Cancún e seus hotéis junto ao mar" />
<img className="trip-hero__blur" src="/images/img-09-694ac95d.png" alt="" />
<Header currentPage="viagem-completa" />

<h1 className="trip-hero__heading">Não é só chegar.<br />É começar a viver<br />antes de pousar.</h1>
<p className="eyebrow trip-hero__label">OPERAÇÃO LOCAL · ATENDIMENTO HUMANO · ROTEIRO VIVO</p>
<div className="trip-hero__dots" aria-hidden={true}>
<span>
</span>
<span>
</span>
<span>
</span>
<span>
</span>
</div>
<p className="trip-hero__aside">Uma viagem desenhada por quem conhece o México por dentro — com ritmo, repertório e tudo organizado para você simplesmente viver.</p>
<a className="button" href="#contato">
<img className="button__icon" src="/images/img-02-fa3a6973.png" alt="" />Planejar minha viagem</a>
</section>
<section className="trip-stats" aria-label="Nossa operação">
<div className="trip-stats__item">
<p className="trip-stats__number">
</p>
<p className="trip-stats__label">anos em cancún</p>
</div>
<div className="trip-stats__item">
<p className="trip-stats__number">+500</p>
<p className="trip-stats__label">famílias atendidas</p>
</div>
<div className="trip-stats__item">
<p className="trip-stats__number">4.9</p>
<p className="trip-stats__label">no tripadvisor</p>
</div>
<div className="trip-stats__item">
<p className="trip-stats__number">100%</p>
<p className="trip-stats__label">operação local</p>
</div>
</section>
<section className="trip-conversation">
<div>
<p className="eyebrow trip-label">VIAGEM COMPLETA · MÉXICO</p>
<h2>A viagem inteira cabe em uma <em className="accent">boa conversa</em>.</h2>
</div>
<div className="trip-conversation__aside">
<p>Aéreo, hospedagem, transfers, experiências e reservas especiais não precisam virar uma lista cansativa. A gente organiza cada escolha para que o roteiro tenha o seu ritmo — e o México apareça do jeito certo, na hora certa.</p>
<a className="button" href="#contato">Planejar minha viagem</a>
</div>
</section>
<section className="trip-packages" id="pacotes">
<p className="eyebrow trip-label">PACOTES PRONTOS</p>
<h2>Quatro roteiros que já funcionam — e ainda assim são seus.</h2>
<div className="trip-packages__grid">
<article className="trip-package">
<div className="trip-package__visual">
<img className="trip-package__image" src="/images/img-30-f34f7b7e.png" alt="Paisagem de Cancún e hotéis cercados pela natureza" />
<p className="trip-package__duration">6 DIAS · SEM AÉREO</p>
<h3>Cancún<br />Essencial</h3>
<p className="trip-package__tagline">O básico muito bem resolvido.</p>
</div>
<p className="trip-package__description">Para quem tem poucos dias e quer aproveitar o máximo do essencial, sem extrapolar o orçamento.</p>
<p className="trip-package__price">A PARTIR DE<strong className="trip-package__amount">R$2.999</strong>
<span className="trip-package__person">POR PESSOA</span>
</p>
<a className="trip-package__button" role="link" aria-disabled="true" data-package="essencial">VER MAIS SOBRE ESSE PACOTE</a>
</article>
<article className="trip-package">
<div className="trip-package__visual">
<img className="trip-package__image" src="/images/img-30-f34f7b7e.png" alt="Paisagem de Cancún e hotéis cercados pela natureza" />
<p className="trip-package__duration">7 DIAS · COM AÉREO</p>
<h3>Cancún<br />Oficial</h3>
<p className="trip-package__tagline">Viagem completa, do<br />voo ao último passeio.</p>
</div>
<img className="trip-package__badge" src="/images/img-10-607f3f54.png" alt="" />
<p className="trip-package__description">O pacote redondo: passagem, hospedagem com café da manhã e os passeios clássicos da região.</p>
<p className="trip-package__price">A PARTIR DE<strong className="trip-package__amount">R$9.800</strong>
<span className="trip-package__person">POR PESSOA</span>
</p>
<a className="trip-package__button" role="link" aria-disabled="true" data-package="oficial">VER MAIS SOBRE ESSE PACOTE</a>
</article>
<article className="trip-package">
<div className="trip-package__visual">
<img className="trip-package__image" src="/images/img-30-f34f7b7e.png" alt="Paisagem de Cancún e hotéis cercados pela natureza" />
<p className="trip-package__duration">9 DIAS · COM AÉREO</p>
<h3>Cancún<br />Completo</h3>
<p className="trip-package__tagline">All inclusive e exploração<br />no mesmo roteiro.</p>
</div>
<p className="trip-package__description">Dias de descanso em all inclusive e dias de passeio com base em hotel bem localizado.</p>
<p className="trip-package__price">A PARTIR DE<strong className="trip-package__amount">R$14.900</strong>
<span className="trip-package__person">POR PESSOA</span>
</p>
<a className="trip-package__button" role="link" aria-disabled="true" data-package="completo">VER MAIS SOBRE ESSE PACOTE</a>
</article>
<article className="trip-package">
<div className="trip-package__visual">
<img className="trip-package__image" src="/images/img-30-f34f7b7e.png" alt="Paisagem de Cancún e hotéis cercados pela natureza" />
<p className="trip-package__duration">11 DIAS · COM AÉREO</p>
<h3>Cancún<br />Assinatura</h3>
<p className="trip-package__tagline">A região inteira,<br />sem pressa nenhuma.</p>
</div>
<p className="trip-package__description">O roteiro mais completo: all inclusive, base para explorar e cinco dias do nosso pacote cultural.</p>
<p className="trip-package__price">A PARTIR DE<strong className="trip-package__amount">R$21.900</strong>
<span className="trip-package__person">POR PESSOA</span>
</p>
<a className="trip-package__button" role="link" aria-disabled="true" data-package="assinatura">VER MAIS SOBRE ESSE PACOTE</a>
</article>
</div>
</section>
<section className="trip-includes">
<div>
<p className="eyebrow trip-label">experiências</p>
<h2>O que a sua viagem pode <em className="accent">incluir</em>.</h2>
</div>
<div className="trip-includes__aside">
<p>Hospedagem escolhida com critério · Transfers privativos · Passeios e experiências · Gastronomia e reservas especiais · Roteiro personalizado · Suporte antes, durante e depois da viagem</p>
<a className="button" href="#contato">Planejar minha viagem</a>
</div>
</section>
<section className="trip-next">
<p className="eyebrow trip-label">A SUA PRÓXIMA CONVERSA</p>
<h2>Vamos desenhar uma viagem que tenha <em className="accent">a sua cara</em>.</h2>
</section>
<section className="trip-videos">
<p className="eyebrow trip-label">ANTES DE RESERVAR</p>
<h2>Quatro vídeos rápidos que respondem quase tudo.</h2>
<div className="trip-videos__grid">
<article className="trip-video">
<img className="trip-video__image" src="/images/img-30-f34f7b7e.png" alt="Vista de Cancún, capa do vídeo sobre hospedagem" />
<div className="trip-video__body">
<h3>Onde se hospedar em Cancún</h3>
<p className="trip-video__duration">VÍDEO · 4 MIN</p>
</div>
</article>
<article className="trip-video">
<img className="trip-video__image" src="/images/img-30-f34f7b7e.png" alt="Vista de Cancún, capa do vídeo sobre hospedagem" />
<div className="trip-video__body">
<h3>Onde se hospedar em Cancún</h3>
<p className="trip-video__duration">VÍDEO · 4 MIN</p>
</div>
</article>
<article className="trip-video">
<img className="trip-video__image" src="/images/img-30-f34f7b7e.png" alt="Vista de Cancún, capa do vídeo sobre hospedagem" />
<div className="trip-video__body">
<h3>Onde se hospedar em Cancún</h3>
<p className="trip-video__duration">VÍDEO · 4 MIN</p>
</div>
</article>
<article className="trip-video">
<img className="trip-video__image" src="/images/img-30-f34f7b7e.png" alt="Vista de Cancún, capa do vídeo sobre hospedagem" />
<div className="trip-video__body">
<h3>Onde se hospedar em Cancún</h3>
<p className="trip-video__duration">VÍDEO · 4 MIN</p>
</div>
</article>
</div>
</section>
<section className="trip-banner" aria-label="Cancún, México">
<img className="trip-banner__image" src="/images/img-19-71bc3bec.png" alt="Vista panorâmica de hotéis e vegetação de Cancún" />
<p className="eyebrow trip-banner__label">CANCÚN, MÉXICO</p>
<h2>cancún</h2>
<div className="trip-banner__controls">
<button className="trip-banner__arrow trip-banner__arrow--previous" type="button" disabled aria-label="Imagem anterior">
<img className="" src="/images/img-04-f9b50443.png" alt="" />
</button>
<button className="trip-banner__arrow " type="button" disabled aria-label="Próxima imagem">
<img className="" src="/images/img-04-f9b50443.png" alt="" />
</button>
</div>
</section>
<section className="trip-contact" id="contato">
<p className="eyebrow trip-label">fale com a gente</p>
<h2>Sua viagem do jeito<br />que você <em className="accent">sonha</em>.</h2>
<p className="trip-contact__copy">A GENTE COMEÇA ENTENDENDO VOCÊ.<br />O RESTO, DESENHAMOS JUNTOS.</p>
<a className="button" role="link" aria-disabled="true" data-whatsapp>
<img className="button__icon" src="/images/img-02-fa3a6973.png" alt="" />Planejar minha viagem</a>
</section>

      </main>
</div>
      <Footer />
    </>
  );
}
