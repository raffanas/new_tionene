"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TripQuiz from "@/components/TripQuiz";
import { SITE_CONFIG } from "@/config/site";

interface TripRow {
  id: string;
  name: string;
  count: number;
}

export default function PasseiosPage() {
  const [activeFilter, setActiveFilter] = useState("todos");
  const [bannerAlt, setBannerAlt] = useState(false);
  const [arrivalDate, setArrivalDate] = useState("");
  const [adults, setAdults] = useState("02");
  const [childrenCount, setChildrenCount] = useState("00");
  const [notification, setNotification] = useState("");
  const [tripRows, setTripRows] = useState<TripRow[]>([
    { id: "isla", name: "Isla Mujeres Exclusiva", count: 2 },
    { id: "cenotes", name: "Cenotes & Cavernas Secretas", count: 2 },
    { id: "chichen", name: "Chichén Itzá & Cenote Sagrado", count: 2 }
  ]);

  const cardsContainerRef = useRef<HTMLDivElement>(null);

  const toggleBanner = () => setBannerAlt((prev) => !prev);
  const heroImageSrc = "/images/img-08-2cf9c873.png";
  const bannerImageSrc = bannerAlt ? "/images/img-08-2cf9c873.png" : "/images/img-19-71bc3bec.png";

  const handleDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 8);
    const masked = raw
      .replace(/^(\d{2})(\d)/, "$1/$2")
      .replace(/^(\d{2}\/\d{2})(\d)/, "$1/$2");
    setArrivalDate(masked);
  };

  const updateCount = (id: string, delta: number) => {
    setTripRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, count: Math.min(99, Math.max(1, r.count + delta)) } : r
      )
    );
  };

  const removeRow = (id: string) => {
    setTripRows((prev) => prev.filter((r) => r.id !== id));
  };

  const addRow = (id: string, name: string) => {
    setTripRows((prev) => {
      const exists = prev.find((r) => r.id === id);
      if (exists) {
        return prev.map((r) => (r.id === id ? { ...r, count: Math.min(99, r.count + 1) } : r));
      }
      return [...prev, { id, name, count: 1 }];
    });
    setNotification(`${name} adicionado ao roteiro.`);
    setTimeout(() => setNotification(""), 4000);
  };

  const handleQuote = () => {
    const whatsapp = SITE_CONFIG.whatsapp;
    const lines = [
      "Olá! Gostaria de uma cotação de passeios.",
      `Chegada: ${arrivalDate || "A definir"}`,
      `Adultos: ${adults}`,
      `Crianças: ${childrenCount}`,
      "Roteiro de Passeios:",
      ...tripRows.map((r) => `- ${r.name}: ${r.count} pessoa(s)`),
    ];
    if (whatsapp) {
      window.open(`https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank");
    } else {
      setNotification("O atendimento para envio da cotação no WhatsApp será conectado em breve.");
    }
  };

  return (
    <>
      <main>

<section className="excursion-hero" aria-labelledby="page-title">
<img className="hero__image" src="/images/img-08-2cf9c873.png" alt="Vista aérea da região hoteleira de Cancún" fetchPriority="high" />
<img className="hero__blur" src="/images/img-09-694ac95d.png" alt=""  />
<Header currentPage="passeios" />

<h1 id="page-title" className="excursion-hero__title">Escolha<br />seus dias.<br />A gente cuida<br />do resto.</h1>
<p className="excursion-hero__label eyebrow">PASSEIOS EM CANCÚN E YUCATÁN</p>
<p className="excursion-hero__description">Do mar turquesa às ruínas maias: monte um roteiro do seu jeito ou deixe a gente indicar o melhor caminho.</p>
<div className="excursion-hero__button">
<a className="button" href="#catalogo">
<img className="button__icon" src="/images/img-02-fa3a6973.png" alt=""  />Planejar minha viagem</a>
</div>
<div className="excursion-hero__dots" aria-hidden={true}>
<i>
</i>
<i>
</i>
<i>
</i>
<i>
</i>
</div>
</section>
<section className="options">
<div className="options__heading">
<p className="eyebrow">Seu roteiro, do seu jeito.</p>
<h2>Três jeitos de preencher seus dias no México.</h2>
</div>
<div className="options__grid">
<article className="option ">
<h3 className="option__title">Escolha passeio por passeio</h3>
<p className="option__description">Monte o seu roteiro com liberdade e tenha tudo organizado antes de chegar.</p>
<a className="option__link" href="#catalogo">montar meu roteiro<img className="option__arrow" src="/images/img-12-59a80b78.png" alt=""  />
</a>
</article>
<article className="option option--wine">
<h3 className="option__title">Receba um pacote pronto</h3>
<p className="option__description">Explorador, Cultural ou Ponderado: descubra o ritmo que combina com a sua viagem.</p>
<a className="option__link" href="#pacotes">conhecer pacotes<img className="option__arrow" src="/images/img-12-59a80b78.png" alt=""  />
</a>
</article>
<article className="option option--blue">
<h3 className="option__title">Deixe a gente indicar</h3>
<p className="option__description">Responda poucas perguntas e encontre seu perfil de viajante em menos de um minuto.</p>
<a className="option__link" href="#trip-quiz">fazer o quiz<img className="option__arrow" src="/images/img-12-59a80b78.png" alt=""  />
</a>
</article>
</div>
</section>
<section className="catalog" id="catalogo" aria-labelledby="catalog-title">
<div className="catalog__filters" role="group" aria-label="Categorias de passeios">
<button className="catalog__filter" type="button" data-filter="todos" aria-pressed="true">Todos</button>
<button className="catalog__filter" type="button" data-filter="cenotes" aria-pressed="false">
<img className="catalog__icon" src="/images/icons/icon-8.svg" alt="" width="16" height="16" />Cenotes</button>
<button className="catalog__filter" type="button" data-filter="praias" aria-pressed="false">
<img className="catalog__icon" src="/images/icons/icon-6.svg" alt="" width="16" height="16" />Praias</button>
<button className="catalog__filter" type="button" data-filter="cultura" aria-pressed="false">
<img className="catalog__icon" src="/images/icons/icon-4.svg" alt="" width="16" height="16" />Cultura</button>
<button className="catalog__filter" type="button" data-filter="aventura" aria-pressed="false">
<img className="catalog__icon" src="/images/icons/icon-11.svg" alt="" width="16" height="16" />Aventura</button>
<button className="catalog__filter" type="button" data-filter="noite" aria-pressed="false">
<img className="catalog__icon" src="/images/icons/icon-10.svg" alt="" width="16" height="16" />Vida Noturna</button>
<button className="catalog__filter" type="button" data-filter="natureza" aria-pressed="false">
<img className="catalog__icon" src="/images/icons/icon-2.svg" alt="" width="16" height="16" />Natureza</button>
</div>
<div className="catalog__heading">
<h2 id="catalog-title">Monte um <em className="accent">roteiro</em>
<br />que tem a sua cara.</h2>
<p>Selecione os melhores passeios para os seus dias no Caribe Mexicano, monte seu roteiro e envie diretamente para nossa equipe no WhatsApp.</p>
</div>
<div className="catalog__cards">
<article className="excursion" data-categories="cenotes cultura aventura natureza" style={{ display: activeFilter === "todos" || "cenotes cultura aventura natureza".split(" ").includes(activeFilter) ? undefined : "none" }}>
<div className="excursion__photo">
<img className="excursion__image" src="/images/img-13-d3d47d85.png" alt="Paisagem de Cancún" loading="lazy" />
</div>
<button className="excursion__add" type="button" aria-label="Adicionar Chichén Itzá e Cenote Sagrado ao roteiro" data-add="chichen">+</button>
<div className="excursion__body">
<h3 className="excursion__title">Chichén Itzá &amp; Cenote Sagrado</h3>
<p className="excursion__description">Explore a mística pirâmide maia com guia historiador privativo e banho nas águas cristalinas do cenote Ik Kil.</p>
<div className="excursion__bottom">
<span className="excursion__tag">
<img className="catalog__icon" src="/images/icons/icon-3.svg" alt="" width="16" height="16" />Natureza</span>
<span className="excursion__tag">
<img className="catalog__icon" src="/images/icons/icon-5.svg" alt="" width="16" height="16" />Aventura</span>
<button className="excursion__details" type="button" data-details aria-disabled="true">VER DETALHES</button>
</div>
</div>
</article>
<article className="excursion" data-categories="cenotes cultura aventura natureza" style={{ display: activeFilter === "todos" || "cenotes cultura aventura natureza".split(" ").includes(activeFilter) ? undefined : "none" }}>
<div className="excursion__photo">
<img className="excursion__image" src="/images/img-13-d3d47d85.png" alt="Paisagem de Cancún" loading="lazy" />
</div>
<button className="excursion__add" type="button" aria-label="Adicionar Chichén Itzá e Cenote Sagrado ao roteiro" data-add="chichen">+</button>
<div className="excursion__body">
<h3 className="excursion__title">Chichén Itzá &amp; Cenote Sagrado</h3>
<p className="excursion__description">Explore a mística pirâmide maia com guia historiador privativo e banho nas águas cristalinas do cenote Ik Kil.</p>
<div className="excursion__bottom">
<span className="excursion__tag">
<img className="catalog__icon" src="/images/icons/icon-3.svg" alt="" width="16" height="16" />Natureza</span>
<span className="excursion__tag">
<img className="catalog__icon" src="/images/icons/icon-5.svg" alt="" width="16" height="16" />Aventura</span>
<button className="excursion__details" type="button" data-details aria-disabled="true">VER DETALHES</button>
</div>
</div>
</article>
<article className="excursion" data-categories="cenotes cultura aventura natureza" style={{ display: activeFilter === "todos" || "cenotes cultura aventura natureza".split(" ").includes(activeFilter) ? undefined : "none" }}>
<div className="excursion__photo">
<img className="excursion__image" src="/images/img-13-d3d47d85.png" alt="Paisagem de Cancún" loading="lazy" />
</div>
<button className="excursion__add" type="button" aria-label="Adicionar Chichén Itzá e Cenote Sagrado ao roteiro" data-add="chichen">+</button>
<div className="excursion__body">
<h3 className="excursion__title">Chichén Itzá &amp; Cenote Sagrado</h3>
<p className="excursion__description">Explore a mística pirâmide maia com guia historiador privativo e banho nas águas cristalinas do cenote Ik Kil.</p>
<div className="excursion__bottom">
<span className="excursion__tag">
<img className="catalog__icon" src="/images/icons/icon-3.svg" alt="" width="16" height="16" />Natureza</span>
<span className="excursion__tag">
<img className="catalog__icon" src="/images/icons/icon-5.svg" alt="" width="16" height="16" />Aventura</span>
<button className="excursion__details" type="button" data-details aria-disabled="true">VER DETALHES</button>
</div>
</div>
</article>
</div>
<p className="catalog__empty" role="status" hidden>Nenhum passeio nesta categoria.</p>
<button type="button" className="catalog__control catalog__control--prev control--previous" data-direction="-1" aria-label="Passeios anteriores">
<img className="control__image" src="/images/img-04-f9b50443.png" alt=""  />
</button>
<button type="button" className="catalog__control catalog__control--next" data-direction="1" aria-label="Próximos passeios">
<img className="control__image" src="/images/img-04-f9b50443.png" alt=""  />
</button>
<div className="trip" id="roteiro">
<div className="trip__travel">
<h3 className="trip__heading">Minha viagem</h3>
<div className="trip__date">
<label className="trip__label" htmlFor="arrival">Data de chegada</label>
<input id="arrival" className="trip__input" type="text" inputMode="numeric" placeholder="dd/mm/aaaa" maxLength={10} value={arrivalDate} onChange={handleDateInput} />
<img className="trip__calendar" src="/images/img-02-fa3a6973.png" alt=""  />
</div>
<div className="trip__people">
<div>
<label className="trip__label" htmlFor="adults">Adultos</label>
<input id="adults" className="trip__input" type="number" min="1" max="99" placeholder="02" value={adults} onChange={(e) => setAdults(e.target.value)} />
</div>
<div>
<label className="trip__label" htmlFor="children">Crianças</label>
<input id="children" className="trip__input" type="number" min="0" max="99" placeholder="02" value={childrenCount} onChange={(e) => setChildrenCount(e.target.value)} />
</div>
</div>
</div>
<div className="trip__selection">
<h3 className="trip__heading">Meu roteiro</h3>
<div className="trip__rows">
{tripRows.map((row) => (
<div key={row.id} className="trip__row" data-row={row.id}>
<span className="trip__name">{row.name}</span>
<button className="trip__step" type="button" data-step="1" aria-label={`Aumentar quantidade de ${row.name}`} onClick={() => updateCount(row.id, 1)}>+</button>
<output className="trip__quantity" aria-label={`Quantidade de ${row.name}`}>{String(row.count).padStart(2, '0')}</output>
<button className="trip__step" type="button" data-step="-1" aria-label={`Diminuir quantidade de ${row.name}`} onClick={() => updateCount(row.id, -1)}>−</button>
<button className="trip__remove" type="button" aria-label={`Remover ${row.name}`} onClick={() => removeRow(row.id)}>
<img className="catalog__icon" src="/images/icons/trash.svg" alt="" width={16} height={16} />
</button>
</div>
))}
{tripRows.length === 0 && (
<p style={{ textAlign: "center", padding: "1.5rem", color: "var(--clay)" }}>Nenhum passeio adicionado ainda. Escolha no catálogo acima!</p>
)}
</div>
</div>
<div className="trip__quote">
<p>Total estimado*</p>
<p className="trip__price" data-price>Sob consulta</p>
<p className="trip__note">*O valor final pode variar de acordo com fatores da<br />viagem como época e quantidade de viajantes.</p>
<button className="button" type="button" id="quote" onClick={handleQuote}>Solicitar cotação</button>
</div>
{notification && (
<p className="trip__message" role="status" style={{ display: "block" }}>{notification}</p>
)}
</div>
</section>
<section className="packages" id="pacotes">
<div className="packages__heading">
<p className="eyebrow">PACOTES PRONTOS, COM RITMO CERTO</p>
<h2>Nem toda viagem pede o <em className="accent">mesmo</em> roteiro.</h2>
</div>
<div className="packages__grid">
<article className="package ">
<img className="package__image" src="/images/img-11-cb103045.png" alt="Paisagem de Cancún" loading="lazy" />
<div className="package__body">
<p className="package__tag">PACOTE BÁSICO</p>
<h3 className="package__title">Viajante Ponderado</h3>
<p className="package__description">Uma viagem tranquila, com o essencial bem resolvido e tempo para curtir cada lugar. Inclui: Isla Mujeres, Chichén Itzá e Barco de vidro.</p>
</div>
<a className="package__link" href="/viagem-completa">
<span>explorar viagem completa</span>
<img className="package__arrow" src="/images/img-12-59a80b78.png" alt=""  />
</a>
</article>
<article className="package package--wine">
<img className="package__image" src="/images/img-11-cb103045.png" alt="Paisagem de Cancún" loading="lazy" />
<img className="package__badge" src="/images/img-10-607f3f54.png" alt="Destaque"  />
<div className="package__body">
<p className="package__tag">PACOTE INTERMEDIÁRIO</p>
<h3 className="package__title">Perfil<br />cultural</h3>
<p className="package__description">Uma viagem tranquila, com o essencial bem resolvido e tempo para curtir cada lugar. Inclui: Isla Mujeres, Chichén Itzá e Barco de vidro.</p>
</div>
<a className="package__link" href="/viagem-completa">
<span>explorar viagem completa</span>
<img className="package__arrow" src="/images/img-12-59a80b78.png" alt=""  />
</a>
</article>
<article className="package package--blue">
<img className="package__image" src="/images/img-11-cb103045.png" alt="Paisagem de Cancún" loading="lazy" />
<div className="package__body">
<p className="package__tag">PACOTE COMPLETO</p>
<h3 className="package__title">Viajante Explorador</h3>
<p className="package__description">Para viver o máximo de Cancún e Yucatán, sem deixar experiências importantes de fora. Inclui: Isla Mujeres, Chichén Itzá, Tulum, Cozumel e Holbox.</p>
</div>
<a className="package__link" href="/viagem-completa">
<span>explorar viagem completa</span>
<img className="package__arrow" src="/images/img-12-59a80b78.png" alt=""  />
</a>
</article>
</div>
</section>
<TripQuiz />
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
