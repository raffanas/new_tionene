"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HomeTravelPlannerCta from "@/components/HomeTravelPlannerCta";
import QuizModal from "@/components/QuizModal";
import CalendarIcon from "@/components/CalendarIcon";
import { SITE_CONFIG } from "@/config/site";

interface TripRow {
  id: string;
  name: string;
  count: number;
}

interface CatalogTour {
  id: string;
  name: string;
  categoryLabel: string;
  duration: string;
  priceFrom: number;
  currency: string;
  description: string;
  image: string;
  alt: string;
  categories: string[];
  tags?: { icon: string; text: string }[];
}

const CATALOG_TOURS: CatalogTour[] = [
  {
    id: "chichen-itza",
    name: "Chichén Itzá & Cenote Sagrado",
    categoryLabel: "Cultura & História",
    duration: "Dia todo (aprox. 10 horas)",
    priceFrom: 119,
    currency: "USD",
    description: "Explore a mística pirâmide maia com guia historiador privativo e banho nas águas cristalinas do cenote Ik Kil.",
    image: "/passeios/chichen-itza.jpg",
    alt: "Pirâmide de Chichén Itzá no México",
    categories: ["cenotes", "historico", "natureza"],
  },
  {
    id: "isla-mujeres",
    name: "Isla Mujeres Exclusiva",
    categoryLabel: "Ilhas & Navegação",
    duration: "Dia todo (aprox. 8 horas)",
    priceFrom: 89,
    currency: "USD",
    description: "Navegue em catamarã pelas águas azul-turquesa do Caribe com parada para snorkeling e o encanto de Playa Norte.",
    image: "/passeios/isla-mujeres.jpg",
    alt: "Águas cristalinas de Isla Mujeres",
    categories: ["ilhas", "natureza"],
  },
  {
    id: "xcaret",
    name: "Parque Eco-Arqueológico Xcaret",
    categoryLabel: "Natureza & Cultura",
    duration: "Dia todo (aprox. 12 horas)",
    priceFrom: 145,
    currency: "USD",
    description: "Rios subterrâneos, aquário de recife de coral e o emocionante espetáculo folclórico que homenageia o México.",
    image: "/passeios/xcaret.jpg",
    alt: "Parque eco-arqueológico Xcaret",
    categories: ["natureza", "historico", "aventura"],
  },
  {
    id: "xelha",
    name: "Xel-Há Parque All-Inclusive",
    categoryLabel: "Aquático & Natureza",
    duration: "Dia todo (aprox. 10 horas)",
    priceFrom: 125,
    currency: "USD",
    description: "Uma verdadeira enseada natural com snorkeling livre, tirolesas aquáticas e gastronomia completa inclusa.",
    image: "/passeios/xel-ha.jpg",
    alt: "Enseada natural e águas de Xel-Há",
    categories: ["natureza", "aventura", "cenotes"],
  },
  {
    id: "xplor",
    name: "Xplor Aventura & Tirolesas",
    categoryLabel: "Aventura & Adrenalina",
    duration: "Dia todo (aprox. 8 horas)",
    priceFrom: 139,
    currency: "USD",
    description: "Tirolesas nas alturas sobre a selva maia, veículos anfíbios e jangadas em cavernas repletas de estalactites.",
    image: "/passeios/Tirolesas.jpg",
    alt: "Aventuras e tirolesas no parque Xplor",
    categories: ["aventura", "natureza"],
  },
  {
    id: "cozumel-el-cielo",
    name: "Cozumel & El Cielo",
    categoryLabel: "Snorkeling & Mar",
    duration: "Dia todo (aprox. 9 horas)",
    priceFrom: 95,
    currency: "USD",
    description: "Mergulho nos recifes de corais protegidos e o espetacular banco de areia El Cielo, santuário de estrelas-do-mar.",
    image: "/passeios/cozumel-e-al-cielo.jpg",
    alt: "Águas azul-turquesa de Cozumel El Cielo",
    categories: ["ilhas", "natureza", "aventura"],
  },
  {
    id: "tulum",
    name: "Ruínas de Tulum & Cenotes",
    categoryLabel: "História & Praia",
    duration: "Meio dia (aprox. 6 horas)",
    priceFrom: 85,
    currency: "USD",
    description: "A clássica cidade murada maia sobre as falésias em frente ao mar caribenho aliada a mergulho em cenote aberto.",
    image: "/passeios/ruinas-de-tulum-cenotes.jpg",
    alt: "Ruínas maias de Tulum à beira do mar caribenho",
    categories: ["historico", "cenotes", "natureza"],
  },
  {
    id: "coco-bongo",
    name: "Coco Bongo Show & Disco",
    categoryLabel: "Vida Noturna",
    duration: "Noite (aprox. 5 horas)",
    priceFrom: 95,
    currency: "USD",
    description: "O espetáculo mais icônico de Cancún: acrobatas, tributos musicais ao vivo e festa eletrizante na zona hoteleira.",
    image: "/passeios/coco-bongo-show-disco.jpg",
    alt: "Espetáculo musical e festa na Coco Bongo",
    categories: ["noite", "aventura"],
  },
];

export default function PasseiosPage() {
  const [activeFilter, setActiveFilter] = useState("todos");
  const [arrivalDate, setArrivalDate] = useState("");
  const [adults, setAdults] = useState("02");
  const [childrenCount, setChildrenCount] = useState("00");
  const [infants511, setInfants511] = useState("00");
  const [infants04, setInfants04] = useState("00");
  const [notification, setNotification] = useState("");
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [tripRows, setTripRows] = useState<TripRow[]>([
    { id: "isla", name: "Isla Mujeres Exclusiva", count: 2 },
    { id: "cenotes", name: "Cenotes & Cavernas Secretas", count: 2 },
    { id: "chichen", name: "Chichén Itzá & Cenote Sagrado", count: 2 }
  ]);

  const filteredTours = CATALOG_TOURS.filter((tour) => {
    if (activeFilter === "todos") return true;
    return tour.categories.includes(activeFilter);
  });

  const cardsContainerRef = useRef<HTMLDivElement>(null);
  const datePickerRef = useRef<HTMLInputElement>(null);

  const heroImageSrc = "/images/img-08-2cf9c873.png";
  const bannerImageSrc = "/images/img-19-71bc3bec.png";

  const handleDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 8);
    const masked = raw
      .replace(/^(\d{2})(\d)/, "$1/$2")
      .replace(/^(\d{2}\/\d{2})(\d)/, "$1/$2");
    setArrivalDate(masked);

    if (raw.length === 8 && datePickerRef.current) {
      const day = raw.slice(0, 2);
      const month = raw.slice(2, 4);
      const year = raw.slice(4, 8);
      datePickerRef.current.value = `${year}-${month}-${day}`;
    }
  };

  const handleNativeDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      const [year, month, day] = val.split("-");
      if (year && month && day) {
        setArrivalDate(`${day}/${month}/${year}`);
      }
    }
  };

  const handleCalendarClick = () => {
    if (datePickerRef.current) {
      if (typeof datePickerRef.current.showPicker === "function") {
        datePickerRef.current.showPicker();
      } else {
        datePickerRef.current.focus();
      }
    }
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
      `Adultos: ${adults || "0"}`,
      `Crianças (12 - 17 anos): ${childrenCount || "0"}`,
      `Infantes (5 - 11 anos): ${infants511 || "0"}`,
      `Infantes (0 - 4 anos): ${infants04 || "0"}`,
      "",
      "Roteiro de Passeios:",
      ...(tripRows.length > 0
        ? tripRows.map((r) => `- ${r.name}: ${r.count} pessoa(s)`)
        : ["(Nenhum passeio selecionado no roteiro)"]),
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
<p className="excursion-hero__label eyebrow">PASSEIOS EM CANCÚN &amp; REGIÃO</p>
<p className="excursion-hero__description">Do mar turquesa às ruínas maias: monte um roteiro do seu jeito ou deixe a gente indicar o melhor caminho.</p>
<div className="excursion-hero__button">
<a className="button" href="#catalogo">
<CalendarIcon className="button__icon" />Conheça os passeios</a>
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
<a className="option__link" href="#catalogo">
<span>montar meu roteiro</span>
<svg className="option__arrow" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<path d="M1.25 1.5L6.75 7L1.25 12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
</svg>
</a>
</article>
<article className="option option--wine">
<h3 className="option__title">Receba um pacote pronto</h3>
<p className="option__description">Explorador, Cultural ou Ponderado: descubra o ritmo que combina com a sua viagem.</p>
<a className="option__link" href="#pacotes">
<span>conhecer pacotes</span>
<svg className="option__arrow" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<path d="M1.25 1.5L6.75 7L1.25 12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
</svg>
</a>
</article>
<article className="option option--blue" style={{ cursor: "pointer" }} onClick={() => setIsQuizOpen(true)}>
<h3 className="option__title">Deixe a gente indicar</h3>
<p className="option__description">Responda poucas perguntas e encontre seu perfil de viajante em menos de um minuto.</p>
<button type="button" className="option__link" onClick={(e) => { e.stopPropagation(); setIsQuizOpen(true); }} aria-label="Abrir quiz de perfil de viagem">
<span>fazer o quiz</span>
<svg className="option__arrow" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<path d="M1.25 1.5L6.75 7L1.25 12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
</svg>
</button>
</article>
</div>
</section>
<section className="catalog" id="catalogo" aria-labelledby="catalog-title">
<div className="catalog__filters" role="group" aria-label="Categorias de passeios">
<button className="catalog__filter" type="button" data-filter="todos" aria-pressed={activeFilter === "todos"} onClick={() => setActiveFilter("todos")}>Todos</button>
<button className="catalog__filter" type="button" data-filter="ilhas" aria-pressed={activeFilter === "ilhas"} onClick={() => setActiveFilter("ilhas")}>
<img className="catalog__icon" src="/images/icons/icon-6.svg" alt="" width="16" height="16" />Ilhas</button>
<button className="catalog__filter" type="button" data-filter="cenotes" aria-pressed={activeFilter === "cenotes"} onClick={() => setActiveFilter("cenotes")}>
<img className="catalog__icon" src="/images/icons/icon-8.svg" alt="" width="16" height="16" />Cenotes</button>
<button className="catalog__filter" type="button" data-filter="historico" aria-pressed={activeFilter === "historico"} onClick={() => setActiveFilter("historico")}>
<img className="catalog__icon" src="/images/icons/icon-4.svg" alt="" width="16" height="16" />Histórico</button>
<button className="catalog__filter" type="button" data-filter="aventura" aria-pressed={activeFilter === "aventura"} onClick={() => setActiveFilter("aventura")}>
<img className="catalog__icon" src="/images/icons/icon-11.svg" alt="" width="16" height="16" />Aventura</button>
<button className="catalog__filter" type="button" data-filter="noite" aria-pressed={activeFilter === "noite"} onClick={() => setActiveFilter("noite")}>
<img className="catalog__icon" src="/images/icons/icon-10.svg" alt="" width="16" height="16" />Vida Noturna</button>
<button className="catalog__filter" type="button" data-filter="natureza" aria-pressed={activeFilter === "natureza"} onClick={() => setActiveFilter("natureza")}>
<img className="catalog__icon" src="/images/icons/icon-2.svg" alt="" width="16" height="16" />Natureza</button>
</div>
<div className="catalog__heading">
<h2 id="catalog-title">Monte um <em className="accent">roteiro</em>
<br />que tem a sua cara.</h2>
<p>Selecione os melhores passeios para os seus dias no Caribe Mexicano, monte seu roteiro e envie diretamente para nossa equipe no WhatsApp.</p>
</div>
<div className="catalog__cards">
  {filteredTours.map((tour) => (
    <article key={tour.id} className="excursion" data-categories={tour.categories.join(" ")}>
      <Link href={`/passeios/${tour.id}`} className="excursion__photo-link" aria-label={`Ver detalhes de ${tour.name}`}>
        <img className="excursion__image" src={tour.image} alt={tour.alt} loading="lazy" />
      </Link>
      <div className="excursion__top-tags">
        <span className="excursion__category-tag">{tour.categoryLabel}</span>
        {tour.duration && (
          <span className="excursion__duration-tag">{tour.duration}</span>
        )}
      </div>
      <button
        className="excursion__add"
        type="button"
        aria-label={`Adicionar ${tour.name} ao roteiro`}
        title={`Adicionar ${tour.name} ao roteiro`}
        onClick={() => addRow(tour.id, tour.name)}
      >
        +
      </button>
      <div className="excursion__body">
        <h3 className="excursion__title">
          <Link href={`/passeios/${tour.id}`} className="excursion__title-link">
            {tour.name}
          </Link>
        </h3>
        <p className="excursion__description">{tour.description}</p>
        <div className="excursion__bottom">
          {tour.priceFrom > 0 && (
            <div className="excursion__price-pill">
              <span className="excursion__price-from">A partir de</span>
              <strong className="excursion__price-val">
                {tour.currency} ${tour.priceFrom}
              </strong>
            </div>
          )}
          <Link
            href={`/passeios/${tour.id}`}
            className="excursion__details"
          >
            VER DETALHES
          </Link>
        </div>
      </div>
    </article>
  ))}
</div>
{filteredTours.length === 0 && (
  <p className="catalog__empty" role="status" style={{ display: "block" }}>Nenhum passeio nesta categoria.</p>
)}
<div className="trip" id="roteiro">
<div className="trip__travel">
<h3 className="trip__heading">Minha viagem</h3>
<div className="trip__date">
<label className="trip__label" htmlFor="arrival">Data de chegada</label>
<div className="trip__date-wrapper">
<input id="arrival" className="trip__input" type="text" inputMode="numeric" placeholder="dd/mm/aaaa" maxLength={10} value={arrivalDate} onChange={handleDateInput} />
<input ref={datePickerRef} type="date" className="trip__hidden-date" tabIndex={-1} aria-hidden="true" onChange={handleNativeDateChange} />
<button type="button" className="trip__calendar-btn" onClick={handleCalendarClick} aria-label="Abrir calendário para escolher data">
<CalendarIcon className="trip__calendar" />
</button>
</div>
</div>
<div className="trip__people">
<div>
<label className="trip__label" htmlFor="adults">Adultos</label>
<input id="adults" className="trip__input" type="number" min="1" max="99" placeholder="02" value={adults} onChange={(e) => setAdults(e.target.value)} />
</div>
<div>
<label className="trip__label" htmlFor="children">Crianças (12 - 17 anos)</label>
<input id="children" className="trip__input" type="number" min="0" max="99" placeholder="00" value={childrenCount} onChange={(e) => setChildrenCount(e.target.value)} />
</div>
<div>
<label className="trip__label" htmlFor="infants511">Infantes (5 - 11 anos)</label>
<input id="infants511" className="trip__input" type="number" min="0" max="99" placeholder="00" value={infants511} onChange={(e) => setInfants511(e.target.value)} />
</div>
<div>
<label className="trip__label" htmlFor="infants04">Infantes (0 - 4 anos)</label>
<input id="infants04" className="trip__input" type="number" min="0" max="99" placeholder="00" value={infants04} onChange={(e) => setInfants04(e.target.value)} />
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
          <article className="package package--basic" id="pacote-basico">
            <img className="package__image" src="/images/img-11-cb103045.png" alt="Paisagem de Cancún" loading="lazy" />
            <div className="package__body">
              <p className="package__tag">PACOTE BÁSICO</p>
              <h3 className="package__title">Viajante Ponderado</h3>
              <p className="package__description">Uma viagem tranquila, com o essencial bem resolvido e tempo para curtir cada lugar. Inclui: Isla Mujeres, Chichén Itzá e Barco de vidro.</p>
            </div>
            <a className="package__link" href="/viagem-completa">
              <span>explorar viagem completa</span>
              <svg className="package__arrow" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M1.25 1.5L6.75 7L1.25 12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </article>
          <article className="package package--wine" id="pacote-intermediario">
            <img className="package__image" src="/images/img-11-cb103045.png" alt="Paisagem de Cancún" loading="lazy" />
            <div className="package__body">
              <p className="package__tag">PACOTE INTERMEDIÁRIO</p>
              <h3 className="package__title">Perfil<br />cultural</h3>
              <p className="package__description">Uma viagem tranquila, com o essencial bem resolvido e tempo para curtir cada lugar. Inclui: Isla Mujeres, Chichén Itzá e Barco de vidro.</p>
            </div>
            <a className="package__link" href="/viagem-completa">
              <span>explorar viagem completa</span>
              <svg className="package__arrow" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M1.25 1.5L6.75 7L1.25 12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </article>
          <article className="package package--blue" id="pacote-completo">
            <img className="package__image" src="/images/img-11-cb103045.png" alt="Paisagem de Cancún" loading="lazy" />
            <div className="package__body">
              <p className="package__tag">PACOTE COMPLETO</p>
              <h3 className="package__title">Viajante Explorador</h3>
              <p className="package__description">Para viver o máximo de Cancún e Yucatán, sem deixar experiências importantes de fora. Inclui: Isla Mujeres, Chichén Itzá, Tulum, Cozumel e Holbox.</p>
            </div>
            <a className="package__link" href="/viagem-completa">
              <span>explorar viagem completa</span>
              <svg className="package__arrow" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M1.25 1.5L6.75 7L1.25 12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </article>
        </div>
      </section>
<HomeTravelPlannerCta source="passeios" />
<section className="banner" aria-label="Cancún, México">
<img className="banner__image" src={bannerImageSrc} alt="Cancún e México" loading="lazy" />
<p className="banner__title">cancún</p>
<p className="banner__location eyebrow">Cancún, México</p>
</section>
<section className="contact" id="contato">
<p className="eyebrow">Fale com a gente</p>
<h2>Sua viagem do jeito<br />que você <em className="accent">sonha</em>.</h2>
<p className="contact__description">A GENTE COMEÇA ENTENDENDO VOCÊ.<br />O RESTO, DESENHAMOS JUNTOS.</p>
<a className="button" href="#catalogo">
<CalendarIcon className="button__icon" />Planejar minha viagem</a>
</section>

      </main>
      <QuizModal isOpen={isQuizOpen} onClose={() => setIsQuizOpen(false)} />
      <Footer />
    </>
  );
}
