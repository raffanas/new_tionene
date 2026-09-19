"use client";

import React from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SITE_CONFIG } from "@/config/site";

export default function ProgramacaoViagemPage() {
  const handleAction = (action: string) => {
    if (action === "download") {
      window.print();
    } else {
      const whatsapp = SITE_CONFIG.whatsapp;
      const text = "Olá! Gostaria de tirar dúvidas sobre minha programação de viagem no México.";
      if (whatsapp) {
        window.open(`https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`, "_blank");
      } else {
        const el = document.querySelector("#contato");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <>
      <div className="itinerary">
<main>

<section className="itinerary-hero">
<Header currentPage="programacao" />

<h1>Fulano, essa é a sua programação<br />de viagem</h1>
<p className="itinerary-hero__aside">Planejada com carinho para você <em className="accent">aproveitar</em> o melhor do México.</p>
<div className="itinerary-hero__facts">
<div className="itinerary-hero__fact">
<img src="/images/img-20-fe179f5b.png" alt="" className="itinerary__icon" />
<div>
<p className="eyebrow itinerary__label">sua viagem</p>
<p>21 a 28 de julho de 2027</p>
</div>
</div>
<div className="itinerary-hero__fact">
<img src="/images/img-21-c179f48d.png" alt="" className="itinerary__icon" />
<div>
<p className="eyebrow itinerary__label">viajante</p>
<p>cliente tio nenê</p>
</div>
</div>
<div className="itinerary-hero__fact">
<img src="/images/icons/icon-9.svg" alt="" className="itinerary__icon" />
<div>
<p className="eyebrow itinerary__label">destino</p>
<p>Cancún, México</p>
</div>
</div>
<div className="itinerary-hero__fact">
<img src="/images/img-22-3d9c00f9.png" alt="" className="itinerary__icon" />
<div>
<p className="eyebrow itinerary__label">código da reserva</p>
<p>GASHHA4556</p>
</div>
</div>
</div>
<a className="button" href="#contato">Fale com nossa equipe</a>
</section>
<section className="itinerary-tours">
<p className="eyebrow itinerary__label">roteiro</p>
<h2>Seus passeios<br />confirmados</h2>
<p className="itinerary-tours__intro">Tudo certo para viver experiências incríveis. Qualquer dúvida, é só falar com a gente!</p>
<div className="itinerary-tours__layout">
<div className="itinerary-tours__list">
<article className="itinerary-tour">
<img src="/images/img-23-753c86ca.png" alt="Vista de hotéis e vegetação em Cancún, imagem do passeio" className="itinerary-tour__photo" />
<div className="itinerary-tour__body">
<div className="itinerary-tour__heading">
<h3>Xcaret</h3>
<span className="itinerary-tour__badge">incluso</span>
</div>
<p className="itinerary-tour__description">Explore a mística pirâmide maia com guia historiador privativo e banho nas águas cristalinas do cenote Ik Kil.</p>
<div className="itinerary-tour__facts">
<p>
<img src="/images/img-20-fe179f5b.png" alt="" className="itinerary__icon" />22/07 (terça-feira)</p>
<p>
<img src="/images/img-21-c179f48d.png" alt="" className="itinerary__icon" />2 adultos</p>
</div>
<a className="itinerary__button" role="link" aria-disabled="true" data-action="tour" onClick={(e) => { e.preventDefault(); handleAction("tour"); }}>VER DETALHES DO PASSEIO</a>
</div>
</article>
<article className="itinerary-tour">
<img src="/images/img-23-753c86ca.png" alt="Vista de hotéis e vegetação em Cancún, imagem do passeio" className="itinerary-tour__photo" />
<div className="itinerary-tour__body">
<div className="itinerary-tour__heading">
<h3>Xcaret</h3>
<span className="itinerary-tour__badge">incluso</span>
</div>
<p className="itinerary-tour__description">Explore a mística pirâmide maia com guia historiador privativo e banho nas águas cristalinas do cenote Ik Kil.</p>
<div className="itinerary-tour__facts">
<p>
<img src="/images/img-20-fe179f5b.png" alt="" className="itinerary__icon" />22/07 (terça-feira)</p>
<p>
<img src="/images/img-21-c179f48d.png" alt="" className="itinerary__icon" />2 adultos</p>
</div>
<a className="itinerary__button" role="link" aria-disabled="true" data-action="tour" onClick={(e) => { e.preventDefault(); handleAction("tour"); }}>VER DETALHES DO PASSEIO</a>
</div>
</article>
<article className="itinerary-tour">
<img src="/images/img-23-753c86ca.png" alt="Vista de hotéis e vegetação em Cancún, imagem do passeio" className="itinerary-tour__photo" />
<div className="itinerary-tour__body">
<div className="itinerary-tour__heading">
<h3>Xcaret</h3>
<span className="itinerary-tour__badge">incluso</span>
</div>
<p className="itinerary-tour__description">Explore a mística pirâmide maia com guia historiador privativo e banho nas águas cristalinas do cenote Ik Kil.</p>
<div className="itinerary-tour__facts">
<p>
<img src="/images/img-20-fe179f5b.png" alt="" className="itinerary__icon" />22/07 (terça-feira)</p>
<p>
<img src="/images/img-21-c179f48d.png" alt="" className="itinerary__icon" />2 adultos</p>
</div>
<a className="itinerary__button" role="link" aria-disabled="true" data-action="tour" onClick={(e) => { e.preventDefault(); handleAction("tour"); }}>VER DETALHES DO PASSEIO</a>
</div>
</article>
<article className="itinerary-tour">
<img src="/images/img-23-753c86ca.png" alt="Vista de hotéis e vegetação em Cancún, imagem do passeio" className="itinerary-tour__photo" />
<div className="itinerary-tour__body">
<div className="itinerary-tour__heading">
<h3>Xcaret</h3>
<span className="itinerary-tour__badge">incluso</span>
</div>
<p className="itinerary-tour__description">Explore a mística pirâmide maia com guia historiador privativo e banho nas águas cristalinas do cenote Ik Kil.</p>
<div className="itinerary-tour__facts">
<p>
<img src="/images/img-20-fe179f5b.png" alt="" className="itinerary__icon" />22/07 (terça-feira)</p>
<p>
<img src="/images/img-21-c179f48d.png" alt="" className="itinerary__icon" />2 adultos</p>
</div>
<a className="itinerary__button" role="link" aria-disabled="true" data-action="tour" onClick={(e) => { e.preventDefault(); handleAction("tour"); }}>VER DETALHES DO PASSEIO</a>
</div>
</article>
</div>
<aside className="itinerary-summary" aria-label="Resumo da sua viagem">
<h2>Resumo da<br />sua viagem</h2>
<div className="itinerary-summary__dates">
<div>
<p className="eyebrow itinerary__label">check in</p>
<p className="itinerary-summary__date">21/12/2026</p>
<p className="itinerary-summary__weekday">(segunda-feira)</p>
</div>
<div>
<p className="eyebrow itinerary__label">check out</p>
<p className="itinerary-summary__date">28/12/2026</p>
<p className="itinerary-summary__weekday">(segunda-feira)</p>
</div>
</div>
<div className="itinerary-summary__facts">
<div className="itinerary-summary__fact">
<img src="/images/img-24-45e971fd.png" alt="" className="itinerary__icon" />
<div>
<p className="eyebrow itinerary__label">duração</p>
<p>7 noites / 8 dias</p>
</div>
</div>
<div className="itinerary-summary__fact">
<img src="/images/icons/icon-7.svg" alt="" className="itinerary__icon" />
<div>
<p className="eyebrow itinerary__label">hospedagem</p>
<p>Cancún</p>
<p className="itinerary-summary__hint">A definir</p>
</div>
</div>
<div className="itinerary-summary__fact">
<img src="/images/img-21-c179f48d.png" alt="" className="itinerary__icon" />
<div>
<p className="eyebrow itinerary__label">Viajantes</p>
<p>2 adultos</p>
<p className="itinerary-summary__hint">Inserir dados</p>
</div>
</div>
</div>
<section className="itinerary-summary__reservation">
<h3>Informações da reserva</h3>
<p className="eyebrow itinerary__label">CÓDIGO DA RESERVA</p>
<p>HASJK454</p>
<p className="eyebrow itinerary__label">Informações</p>
<p className="itinerary-summary__copy">Lorem ipsum dolor sit amet. Est officiis omnis id internos explicabo et praesentium asperiores est itaque rerum eum magni officiis.</p>
</section>
<a className="itinerary__button" role="link" aria-disabled="true" data-action="download" onClick={(e) => { e.preventDefault(); handleAction("download"); }}>BAIXAR MEU ROTEIRO</a>
<section className="itinerary-summary__important">
<h3>Importante</h3>
<p>Os horários de busca serão confirmados até 1 dia antes de cada passeio. Todos os passeios incluem transporte ida e volta saindo da sua hospedagem.</p>
</section>
<section className="itinerary-summary__help" id="contato">
<img src="/images/icons/icon-1.svg" alt="" className="itinerary__icon" />
<h3>Precisa de algo?</h3>
<p>Estamos aqui para personalizar ainda mais a sua experiência.</p>
<a className="itinerary__button" role="link" aria-disabled="true" data-action="whatsapp" onClick={(e) => { e.preventDefault(); handleAction("whatsapp"); }}>FALE CONOSCO</a>
</section>
</aside>
</div>
</section>
<section className="itinerary-overview">
<p className="eyebrow itinerary__label">roteiro</p>
<h2>Visão geral da viagem</h2>
<ol className="itinerary-overview__days">
<li className="itinerary-day">
<p className="itinerary-day__date">21<span>JUL</span>
</p>
<p className="itinerary-day__weekday">seg</p>
<div className="itinerary-day__dot" aria-hidden={true}>
</div>
<div className="itinerary-day__copy">
<strong>Chegada em Cancún</strong>
<p>Seja bem-vindo! Nossa equipe estará aguardando você.</p>
</div>
</li>
<li className="itinerary-day">
<p className="itinerary-day__date">21<span>JUL</span>
</p>
<p className="itinerary-day__weekday">seg</p>
<div className="itinerary-day__dot" aria-hidden={true}>
</div>
<div className="itinerary-day__copy">
<strong>Chegada em Cancún</strong>
<p>Seja bem-vindo! Nossa equipe estará aguardando você.</p>
</div>
</li>
<li className="itinerary-day">
<p className="itinerary-day__date">21<span>JUL</span>
</p>
<p className="itinerary-day__weekday">seg</p>
<div className="itinerary-day__dot" aria-hidden={true}>
</div>
<div className="itinerary-day__copy">
<strong>Chegada em Cancún</strong>
<p>Seja bem-vindo! Nossa equipe estará aguardando você.</p>
</div>
</li>
<li className="itinerary-day">
<p className="itinerary-day__date">21<span>JUL</span>
</p>
<p className="itinerary-day__weekday">seg</p>
<div className="itinerary-day__dot" aria-hidden={true}>
</div>
<div className="itinerary-day__copy">
<strong>Chegada em Cancún</strong>
<p>Seja bem-vindo! Nossa equipe estará aguardando você.</p>
</div>
</li>
<li className="itinerary-day">
<p className="itinerary-day__date">21<span>JUL</span>
</p>
<p className="itinerary-day__weekday">seg</p>
<div className="itinerary-day__dot" aria-hidden={true}>
</div>
<div className="itinerary-day__copy">
<strong>Chegada em Cancún</strong>
<p>Seja bem-vindo! Nossa equipe estará aguardando você.</p>
</div>
</li>
<li className="itinerary-day">
<p className="itinerary-day__date">21<span>JUL</span>
</p>
<p className="itinerary-day__weekday">seg</p>
<div className="itinerary-day__dot" aria-hidden={true}>
</div>
<div className="itinerary-day__copy">
<strong>Chegada em Cancún</strong>
<p>Seja bem-vindo! Nossa equipe estará aguardando você.</p>
</div>
</li>
<li className="itinerary-day">
<p className="itinerary-day__date">21<span>JUL</span>
</p>
<p className="itinerary-day__weekday">seg</p>
<div className="itinerary-day__dot" aria-hidden={true}>
</div>
<div className="itinerary-day__copy">
<strong>Chegada em Cancún</strong>
<p>Seja bem-vindo! Nossa equipe estará aguardando você.</p>
</div>
</li>
</ol>
</section>
<section className="itinerary-memories">
<div>
<p className="eyebrow itinerary__label">experiências</p>
<h2>Criamos <em className="accent">memórias</em>, não apenas roteiros.</h2>
</div>
<div className="itinerary-memories__aside">
<p>Cada detalhe da sua viagem foi pensado com carinho para que você viva o México de um jeito autêntico, seguro e inesquecível.</p>
<a className="itinerary__button" role="link" aria-disabled="true" data-action="whatsapp" onClick={(e) => { e.preventDefault(); handleAction("whatsapp"); }}>Fale com nossa equipe</a>
</div>
</section>

      </main>
</div>
      <Footer />
    </>
  );
}
