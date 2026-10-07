"use client";

import React, { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CalendarIcon from "@/components/CalendarIcon";
import TripPackageModal, { TripPackageId } from "@/components/TripPackageModal";
import VideoModal from "@/components/VideoModal";
import { useTravelPlannerQuiz } from "@/context/TravelPlannerQuizContext";
import { SITE_CONFIG } from "@/config/site";

const DEFAULT_PROTOTYPE_VIDEO_URL = "https://www.youtube.com/watch?v=PAtu5ja1u70&pp=ygUTY2FuY3VuIG1leGljbyBkcm9uZQ%3D%3D";

const TRIP_VIDEOS = [
  {
    id: "hospedagem",
    title: "Onde se hospedar em Cancún e região",
    duration: "VÍDEO · 4 MIN",
    image: "/images/video-thumb-01.jpg",
    bgColor: "#E8A9B4",
    videoUrl: DEFAULT_PROTOTYPE_VIDEO_URL,
  },
  {
    id: "dias",
    title: "Quantos dias ficar",
    duration: "VÍDEO · 3 MIN",
    image: "/images/video-thumb-02.jpg",
    bgColor: "#F4E49B",
    videoUrl: DEFAULT_PROTOTYPE_VIDEO_URL,
  },
  {
    id: "dividir-hospedagem",
    title: "Vale dividir a hospedagem?",
    duration: "VÍDEO · 5 MIN",
    image: "/images/video-thumb-03.jpg",
    bgColor: "#A55F40",
    videoUrl: DEFAULT_PROTOTYPE_VIDEO_URL,
  },
  {
    id: "quanto-custa",
    title: "Quanto custa viajar pro México",
    duration: "VÍDEO · 6 MIN",
    image: "/images/video-thumb-04.jpg",
    bgColor: "#7A968D",
    videoUrl: DEFAULT_PROTOTYPE_VIDEO_URL,
  },
];

export default function ViagemCompletaPage() {
  const { openTravelPlannerQuiz } = useTravelPlannerQuiz();
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [selectedTripPackage, setSelectedTripPackage] = useState<TripPackageId | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<{ url: string; title: string } | null>(null);

  const handleOpenTripModal = (id: TripPackageId) => {
    setSelectedTripPackage(id);
    setIsTripModalOpen(true);
  };

  const handleCloseTripModal = () => {
    setIsTripModalOpen(false);
  };

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
<article
  className="trip-package"
  role="button"
  tabIndex={0}
  onClick={() => handleOpenTripModal("essencial")}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleOpenTripModal("essencial");
    }
  }}
  aria-label="Conhecer pacote Cancún Essencial"
>
  <div className="trip-package__visual">
    <img className="trip-package__image" src="/images/package-essencial-modal.jpg" alt="Cancún Essencial" />
    <span className="trip-package__duration">6 DIAS · SEM AÉREO</span>
  </div>
  <div className="trip-package__content">
    <h3 className="trip-package__title">Cancún Essencial</h3>
    <p className="trip-package__tagline">O básico muito bem resolvido.</p>
    <p className="trip-package__description">Para quem tem poucos dias e quer aproveitar o máximo do essencial, sem extrapolar o orçamento.</p>
    <div className="trip-package__price">
      <span className="trip-package__price-prefix">A PARTIR DE</span>
      <strong className="trip-package__amount">R$2.999</strong>
      <span className="trip-package__person">POR PESSOA</span>
    </div>
    <button
      type="button"
      className="trip-package__button"
      onClick={(e) => {
        e.stopPropagation();
        handleOpenTripModal("essencial");
      }}
      aria-label="Ver mais sobre o pacote Cancún Essencial"
    >
      VER MAIS SOBRE ESSE PACOTE
    </button>
  </div>
</article>

<article
  className="trip-package"
  role="button"
  tabIndex={0}
  onClick={() => handleOpenTripModal("oficial")}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleOpenTripModal("oficial");
    }
  }}
  aria-label="Conhecer pacote Cancún Oficial"
>
  <div className="trip-package__visual">
    <img className="trip-package__image" src="/images/package-oficial-modal.jpg" alt="Cancún Oficial" />
    <span className="trip-package__duration">7 DIAS · COM AÉREO</span>
  </div>
  <div className="trip-package__content">
    <h3 className="trip-package__title">Cancún Oficial</h3>
    <p className="trip-package__tagline">Viagem completa, do voo ao último passeio.</p>
    <p className="trip-package__description">O pacote redondo: passagem, hospedagem com café da manhã e os passeios clássicos da região.</p>
    <div className="trip-package__price">
      <span className="trip-package__price-prefix">A PARTIR DE</span>
      <strong className="trip-package__amount">R$9.800</strong>
      <span className="trip-package__person">POR PESSOA</span>
    </div>
    <button
      type="button"
      className="trip-package__button"
      onClick={(e) => {
        e.stopPropagation();
        handleOpenTripModal("oficial");
      }}
      aria-label="Ver mais sobre o pacote Cancún Oficial"
    >
      VER MAIS SOBRE ESSE PACOTE
    </button>
  </div>
</article>

<article
  className="trip-package"
  role="button"
  tabIndex={0}
  onClick={() => handleOpenTripModal("completo")}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleOpenTripModal("completo");
    }
  }}
  aria-label="Conhecer pacote Cancún Completo"
>
  <div className="trip-package__visual">
    <img className="trip-package__image" src="/images/package-completo-modal.jpg" alt="Cancún Completo" />
    <span className="trip-package__duration">9 DIAS · COM AÉREO</span>
  </div>
  <div className="trip-package__content">
    <h3 className="trip-package__title">Cancún Completo</h3>
    <p className="trip-package__tagline">All inclusive e exploração no mesmo roteiro.</p>
    <p className="trip-package__description">Dias de descanso em all inclusive e dias de passeio com base em hotel bem localizado.</p>
    <div className="trip-package__price">
      <span className="trip-package__price-prefix">A PARTIR DE</span>
      <strong className="trip-package__amount">R$14.900</strong>
      <span className="trip-package__person">POR PESSOA</span>
    </div>
    <button
      type="button"
      className="trip-package__button"
      onClick={(e) => {
        e.stopPropagation();
        handleOpenTripModal("completo");
      }}
      aria-label="Ver mais sobre o pacote Cancún Completo"
    >
      VER MAIS SOBRE ESSE PACOTE
    </button>
  </div>
</article>

<article
  className="trip-package"
  role="button"
  tabIndex={0}
  onClick={() => handleOpenTripModal("assinatura")}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleOpenTripModal("assinatura");
    }
  }}
  aria-label="Conhecer pacote Cancún Assinatura"
>
  <div className="trip-package__visual">
    <img className="trip-package__image" src="/images/package-assinatura-modal.jpg" alt="Cancún Assinatura" />
    <span className="trip-package__duration">11 DIAS · COM AÉREO</span>
  </div>
  <div className="trip-package__content">
    <h3 className="trip-package__title">Cancún Assinatura</h3>
    <p className="trip-package__tagline">A região inteira, sem pressa nenhuma.</p>
    <p className="trip-package__description">O roteiro mais completo: all inclusive, base para explorar e cinco dias do nosso pacote cultural.</p>
    <div className="trip-package__price">
      <span className="trip-package__price-prefix">A PARTIR DE</span>
      <strong className="trip-package__amount">R$21.900</strong>
      <span className="trip-package__person">POR PESSOA</span>
    </div>
    <button
      type="button"
      className="trip-package__button"
      onClick={(e) => {
        e.stopPropagation();
        handleOpenTripModal("assinatura");
      }}
      aria-label="Ver mais sobre o pacote Cancún Assinatura"
    >
      VER MAIS SOBRE ESSE PACOTE
    </button>
  </div>
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
<button 
  type="button" 
  className="button" 
  onClick={() => openTravelPlannerQuiz("viagem-completa-experiencias")}
>
  Planejar minha viagem
</button>
</div>
</section>
<section className="trip-next">
<p className="eyebrow trip-label">A SUA PRÓXIMA CONVERSA</p>
<h2>Vamos desenhar uma viagem que tenha <em className="accent">a sua cara</em>.</h2>
</section>

<section className="trip-videos">
  <div className="trip-videos__header">
    <p className="eyebrow trip-videos__eyebrow">ANTES DE RESERVAR</p>
    <h2 className="trip-videos__title">Quatro vídeos rápidos que respondem quase tudo.</h2>
    <div className="trip-videos__accent-line" aria-hidden="true" />
  </div>

  <div className="trip-videos__grid">
    {TRIP_VIDEOS.map((video) => (
      <article
        key={video.id}
        className="trip-video-card"
        onClick={() => setSelectedVideo({ url: video.videoUrl, title: video.title })}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setSelectedVideo({ url: video.videoUrl, title: video.title });
          }
        }}
        aria-label={`Assistir vídeo: ${video.title}`}
      >
        <div
          className="trip-video-card__frame"
          style={{ backgroundColor: video.bgColor }}
        >
          <div className="trip-video-card__media">
            <img
              className="trip-video-card__image"
              src={video.image}
              alt={video.title}
              loading="lazy"
            />
            <button
              type="button"
              className="trip-video-card__play"
              aria-label={`Assistir: ${video.title}`}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedVideo({ url: video.videoUrl, title: video.title });
              }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="trip-video-card__body">
          <h3 className="trip-video-card__title">{video.title}</h3>
          <p className="trip-video-card__duration">{video.duration}</p>
        </div>
      </article>
    ))}
  </div>
</section>

      </main>
</div>
      <TripPackageModal
        isOpen={isTripModalOpen}
        onClose={handleCloseTripModal}
        selectedPackageId={selectedTripPackage}
      />
      <VideoModal
        isOpen={!!selectedVideo}
        onClose={() => setSelectedVideo(null)}
        videoUrl={selectedVideo?.url || ""}
        title={selectedVideo?.title}
      />
      <Footer />
    </>
  );
}
