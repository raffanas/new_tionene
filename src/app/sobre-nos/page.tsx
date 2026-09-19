"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SITE_CONFIG } from "@/config/site";

export default function SobreNosPage() {
  const historyImages = [
    "/images/img-08-2cf9c873.png",
    "/images/img-19-71bc3bec.png"
  ];
  const [historyIndex, setHistoryIndex] = useState(0);
  const familyTrackRef = useRef<HTMLDivElement>(null);

  const prevHistory = () => setHistoryIndex((i) => (i - 1 + historyImages.length) % historyImages.length);
  const nextHistory = () => setHistoryIndex((i) => (i + 1) % historyImages.length);

  const scrollFamily = (direction: number) => {
    if (familyTrackRef.current) {
      familyTrackRef.current.scrollBy({
        left: direction * 300,
        behavior: "smooth"
      });
    }
  };

  return (
    <>
      <div className="about-page">
<main>

<section className="about-hero" id="sobre">
<Header currentPage="sobre-nos" />

<div className="about-hero__heading">
<p className="eyebrow">SOBRE NÓS</p>
<h1>Muito antes de existir uma agência de viagens, existia uma família <em className="accent">apaixonada</em> pelo México.</h1>
</div>
<div className="about-hero__aside">
<img className="about-hero__symbol" alt="" src="/images/img-26-77aae682.png" />
<p>A Tio Nenê não nasceu de um plano de negócios. Nasceu de uma história de família, de encontros e de um país que, aos poucos, acabou mudando o rumo das nossas vidas.</p>
</div>
</section>
<section className="about-quote" aria-label="Uma frase do Tio Nenê">
<blockquote>“Viajar é bom. Mas ser bem recebido faz toda a diferença.”</blockquote>
<p className="eyebrow">• TIO NENÊ</p>
</section>
<section className="founder">
<img className="founder__photo" alt="Tio Nenê, pai da Bella, usando chapéu e camisa azul" src="/images/img-27-3f03bfec.png" />
<div className="founder__body">
<p className="eyebrow">QUEM É O TIO NENÊ?</p>
<h2>Sim, ele existe. E é o Tio Nenê de verdade.</h2>
<p>Tio Nenê é o apelido carinhoso do pai da Bella, conhecido pela família e pelos amigos pelo jeito acolhedor de receber as pessoas, contar histórias e fazer qualquer um se sentir em casa. Foi esse espírito de hospitalidade que inspirou o nome da empresa. Até hoje, o Tio Nenê continua fazendo parte da nossa história e representa exatamente a forma como acreditamos que uma viagem deve acontecer: com proximidade, cuidado e pessoas que fazem você se sentir bem-vindo, mesmo estando longe de casa.</p>
</div>
</section>
<section className="history">
<p className="eyebrow">NOSSA HISTÓRIA</p>
<h2>Uma história que começou muito <em className="accent">antes</em> da empresa existir.</h2>
<p className="history__text">Tudo começou em 1986, durante a Copa do Mundo, quando o Tio Nenê veio ao México pela primeira vez para visitar amigos. O que seria apenas uma viagem se transformou em dois anos vivendo em Cancún — e em uma paixão pelas pessoas, pela cultura, pelos sabores e pela forma como o México transforma momentos simples em experiências inesquecíveis. Ao voltar ao Brasil, levou consigo uma certeza: um dia voltaria. Bella cresceu ouvindo essas histórias, imaginando as pescarias, os amigos e um Cancún que ainda era desconhecido entre os brasileiros. Quando visitou Cancún pela primeira vez, aos 17 anos, parecia estar chegando a um lugar que já fazia parte da sua vida. Em 2014, ao retornar para visitar uma amiga, começou ajudando brasileiros em fóruns de viagem, respondendo dúvidas e compartilhando o que descobria. As pessoas passaram a confiar naquele olhar — e foi assim que nasceu a Tio Nenê.</p>
</section>
<section className="history-gallery" aria-label="Paisagens de Cancún">
<img className="history-gallery__image" src={historyImages[historyIndex]} alt="História Tio Nenê" />
<div className="about-controls">
<button type="button" className="about-controls__button about-controls__button--previous" data-gallery="history" data-direction="-1" aria-label="Imagem anterior">
<img className="about-controls__icon" alt="" src="/images/img-04-f9b50443.png" />
</button>
<button type="button" className="about-controls__button " data-gallery="history" data-direction="1" aria-label="Imagem seguinte">
<img className="about-controls__icon" alt="" src="/images/img-04-f9b50443.png" />
</button>
</div>
</section>
<section className="bella" id="bella">
<img className="bella__photo" alt="Bella diante de uma construção amarela no México" src="/images/img-29-7d854e7b.png" />
<div className="bella__body">
<p className="eyebrow">CONHEÇA A BELLA</p>
<h2>A curadoria por trás da Tio Nenê</h2>
<div className="bella__text">
<p>Ao longo dessa trajetória, Bella sempre esteve à frente da criação de novos projetos dentro da Tio Nenê. Foi uma das responsáveis por transformar a empresa de uma receptiva de passeios em uma operadora completa, desenvolvendo novos produtos, viagens em grupo e experiências personalizadas.</p>
<p>Com o tempo, expandiu esse trabalho para além da agência: criou projetos ligados a eventos, comunidades e experiências, organizou viagens para diferentes destinos e aprofundou seus estudos sobre comportamento humano, hospitalidade e design de experiências.</p>
<p>Hoje, toda essa bagagem volta para a Tio Nenê através da sua curadoria especial:</p>
</div>
<blockquote>“O México que você não encontraria sozinho.”</blockquote>
<p className="bella__ending">Um olhar para quem deseja viver um México mais autêntico, menos turístico e muito mais conectado com a cultura local, sempre através de experiências desenhadas de acordo com o perfil de cada viajante.</p>
<a className="bella__link" href="/curadoria-bella" data-page="curadoria-bella">CONHEÇA A CURADORIA DA BELLA</a>
</div>
</section>
<section className="beliefs">
<p className="eyebrow">O QUE ACREDITAMOS</p>
<h2>Mais do que vender uma viagem, acreditamos em apresentar um México mais humano, autêntico e <em className="accent">surpreendente</em>.</h2>
<div className="beliefs__grid">
<article className="belief ">
<p>01</p>
<h3>Segurança</h3>
<p className="belief__text">Continuamos vivendo aqui e explorando novos hotéis, restaurantes, cidades, praias, cenotes e experiências para que cada recomendação venha daquilo que realmente conhecemos.</p>
</article>
<article className="belief belief--wine">
<p>02</p>
<h3>Curadoria</h3>
<p className="belief__text">Uma boa viagem não é feita apenas pelos lugares que você visita. Ela é construída pelas escolhas certas, pelas pessoas que encontra e pelas experiências que vive.</p>
</article>
<article className="belief belief--blue">
<p>03</p>
<h3>Cuidado</h3>
<p className="belief__text">Desde 2014, cuidamos de cada viajante com experiência, sensibilidade e atenção ao que torna cada história única.</p>
</article>
</div>
<img className="beliefs__symbol" alt="" src="/images/img-26-77aae682.png" />
</section>
<section className="services">
<img className="services__image" alt="Hotéis e paisagem de Cancún" src="/images/img-28-81baf457.png" />
<p className="eyebrow services__label">O QUE FAZEMOS</p>
<div className="services__copy">
<h2>Cada escolha<br />da viagem, no mesmo lugar.</h2>
<p>Passeios em Cancún e Riviera Maya · Viagens completas · Hospedagem · Transfers · Roteiros personalizados · Atendimento local durante toda a viagem · Operação para grupos · Parcerias B2B</p>
</div>
<div className="about-controls">
<button type="button" className="about-controls__button about-controls__button--previous" data-gallery="services" data-direction="-1" aria-label="Imagem anterior">
<img className="about-controls__icon" alt="" src="/images/img-04-f9b50443.png" />
</button>
<button type="button" className="about-controls__button " data-gallery="services" data-direction="1" aria-label="Imagem seguinte">
<img className="about-controls__icon" alt="" src="/images/img-04-f9b50443.png" />
</button>
</div>
</section>
<section className="family">
<p className="eyebrow">FEITA POR PESSOAS</p>
<h2>Antes de sermos uma empresa, sempre fomos uma <em className="accent">família</em>.</h2>
<p className="family__text">A Cris acompanha a história da Tio Nenê desde os primeiros anos no México e representa a atenção aos detalhes, a disponibilidade para ajudar e a sensação de estar acompanhado por alguém que realmente se importa. E existe também um integrante muito especial: Oliver, nosso mascote oficial — presente em embarques, aeroportos, passeios e nas memórias de quem volta anos depois perguntando como ele está. São esses pequenos detalhes que fizeram da Tio Nenê muito mais do que uma agência de viagens. Construíram uma empresa feita de relações.</p>
</section>
<section className="family-gallery" aria-label="Galeria de viagens">
<div className="family-gallery__track" ref={familyTrackRef}>
<img className="family-gallery__image" alt="Paisagem de Cancún" src="/images/img-11-cb103045.png" />
<img className="family-gallery__image" alt="Paisagem de Cancún" src="/images/img-11-cb103045.png" />
<img className="family-gallery__image" alt="Paisagem de Cancún" src="/images/img-11-cb103045.png" />
<img className="family-gallery__image" alt="Paisagem de Cancún" src="/images/img-11-cb103045.png" />
<img className="family-gallery__image" alt="Paisagem de Cancún" src="/images/img-11-cb103045.png" />
</div>
<div className="about-controls">
<button type="button" className="about-controls__button about-controls__button--previous" data-gallery="family" data-direction="-1" aria-label="Imagem anterior">
<img className="about-controls__icon" alt="" src="/images/img-04-f9b50443.png" />
</button>
<button type="button" className="about-controls__button " data-gallery="family" data-direction="1" aria-label="Imagem seguinte">
<img className="about-controls__icon" alt="" src="/images/img-04-f9b50443.png" />
</button>
</div>
</section>
<section className="about-contact" id="contato">
<p className="eyebrow">MAIS QUE TURISMO</p>
<h2>A melhor forma de conhecer um destino é aquela que foi pensada para <em className="accent">você</em>.</h2>
<a className="button" href="/passeios#catalogo">
<img className="button__icon" alt="" src="/images/img-02-fa3a6973.png" />Planejar minha viagem</a>
</section>

      </main>
</div>
      <Footer />
    </>
  );
}
