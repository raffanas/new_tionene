"use client";

import React from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CalendarIcon from "@/components/CalendarIcon";
import { SITE_CONFIG } from "@/config/site";

export default function ViagemCompletaPage() {
  const handlePackageClick = (packageName: string) => {
    const whatsapp = SITE_CONFIG.whatsapp;
    const text = `Olá! Gostaria de saber mais sobre o pacote de Viagem Completa: ${packageName}.`;
    if (whatsapp) {
      window.open(`https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`, "_blank");
    } else {
      const el = document.querySelector("#pacotes");
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
<p className="trip-hero__aside">Uma viagem desenhada por quem conhece o México por dentro — com ritmo, repertório e tudo organizado para você simplesmente viver.</p>
<a className="button" href="#pacotes">
<CalendarIcon className="button__icon" />Ver pacotes</a>
</section>
<section className="trip-stats" aria-label="Nossa operação">
<div className="trip-stats__item">
<p className="trip-stats__number">12+</p>
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
<a className="button" href="#pacotes">Conheça nossos pacotes</a>
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
<h2>Uma operação própria<br />em <em className="accent">Cancún</em>.</h2>
</div>
<div className="trip-includes__aside">
<p>A Tio Nenê opera no destino desde 2014, com equipe própria, hotéis e fornecedores homologados e atendimento em português antes, durante e depois da viagem.</p>
<a 
  className="button" 
  href={SITE_CONFIG.whatsapp ? `https://wa.me/${SITE_CONFIG.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent("Olá! Gostaria de planejar minha viagem completa com a Tio Nenê.")}` : "#pacotes"}
  target={SITE_CONFIG.whatsapp ? "_blank" : undefined}
  rel="noopener noreferrer"
>
  Planejar minha viagem
</a>
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

      </main>
</div>
      <Footer />
    </>
  );
}
