"use client";

import React, { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PartnerModal from "@/components/PartnerModal";
import { SITE_CONFIG } from "@/config/site";

export type PartnerType = "agencia" | "operadora" | "grupos" | "creator";

interface PartnerSelectOption {
  id: PartnerType;
  number: string;
  title: string;
  description: string;
}

const PARTNER_SELECT_OPTIONS: PartnerSelectOption[] = [
  {
    id: "agencia",
    number: "01",
    title: "Agência de viagens",
    description:
      "Quero oferecer experiências em Cancún aos meus clientes e trabalhar com uma operação local.",
  },
  {
    id: "operadora",
    number: "02",
    title: "Operadora de turismo",
    description:
      "Busco um receptivo para integrar à minha operação e aos meus produtos no destino.",
  },
  {
    id: "grupos",
    number: "03",
    title: "Grupos e corporativos",
    description:
      "Organizo grupos, eventos ou viagens corporativas e preciso de apoio local.",
  },
  {
    id: "creator",
    number: "04",
    title: "Influenciador / Creator",
    description:
      "Quero conectar minha audiência às experiências da Tio Nenê e entender os formatos de parceria.",
  },
];

export default function SejaParceiroPage() {
  const [partnerType, setPartnerType] = useState<PartnerType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // WhatsApp oficial da equipe Tio Nenê
  const rawNumber = SITE_CONFIG.whatsapp?.replace(/\D/g, "");
  const directTeamWhatsAppUrl = rawNumber
    ? `https://wa.me/${rawNumber}?text=${encodeURIComponent(
        "Olá! Gostaria de entender melhor como funciona o programa de parcerias da Tio Nenê."
      )}`
    : `https://wa.me/?text=${encodeURIComponent(
        "Olá! Gostaria de entender melhor como funciona o programa de parcerias da Tio Nenê."
      )}`;

  return (
    <div className="partner-page">
      <main>
        {/* ========================================================================= */}
        {/* 1. HERO — PROGRAMA DE PARCERIAS (Prompt 1)                                */}
        {/* ========================================================================= */}
        <section className="partner-hero" id="hero" aria-labelledby="partner-hero-title">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="partner-hero__image"
            src="/images/img-08-2cf9c873.png"
            alt="Vista aérea da costa e mar turquesa de Cancún no Caribe Mexicano"
            fetchPriority="high"
          />

          {/* Header global integrado */}
          <Header currentPage="seja-parceiro" />

          <div className="partner-hero__container">
            <p className="eyebrow partner-hero__eyebrow">PROGRAMA DE PARCERIAS</p>

            <h1 className="partner-hero__title" id="partner-hero-title">
              Leve Cancún para os seus clientes.<br />A operação fica com a gente.
            </h1>

            <p className="partner-hero__text">
              A Tio Nenê atua no Caribe Mexicano com operação local para agências de viagens,
              operadoras, grupos corporativos e parceiros de conteúdo. Você mantém o relacionamento
              com o seu cliente; nós cuidamos da experiência no destino.
            </p>

            <div className="partner-hero__actions">
              <button
                type="button"
                className="button partner-hero__btn-primary"
                onClick={() => setIsModalOpen(true)}
              >
                QUERO SER PARCEIRO
              </button>
              <a href="#como-funciona" className="partner-hero__btn-secondary">
                <span>COMO FUNCIONA</span>
                <span aria-hidden="true">↓</span>
              </a>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. OPERAÇÃO LOCAL NO CARIBE MEXICANO (Prompt 2)                           */}
        {/* ========================================================================= */}
        <section className="partner-operation" id="operacao" aria-labelledby="partner-operation-title">
          <div className="partner-operation__container">
            <div className="partner-operation__content">
              <span className="eyebrow partner-operation__eyebrow">OPERAÇÃO LOCAL</span>
              <h2 className="partner-operation__title" id="partner-operation-title">
                Sua operação local no Caribe Mexicano
              </h2>

              <div className="partner-operation__text">
                <p>
                  Vender Cancún à distância não precisa significar operar sozinho. A Tio Nenê entra como
                  sua estrutura local para transformar o que foi vendido em uma experiência bem executada no destino.
                </p>
                <p>
                  Cuidamos da operação de passeios e experiências, do suporte local e dos detalhes que fazem
                  diferença durante a viagem. Seu cliente continua sendo seu cliente — e encontra no México
                  uma equipe preparada para recebê-lo.
                </p>
                <p>
                  Também desenvolvemos parcerias para grupos, ações corporativas, creators e profissionais que
                  desejam conectar sua audiência às experiências da Tio Nenê.
                </p>
              </div>
            </div>

            <div className="partner-operation__media">
              <div className="partner-operation__image-main-wrap">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="partner-operation__image-main"
                  src="/passeios/isla-mujeres.jpg"
                  alt="Navegação em catamarã pelas águas azul-turquesa no Caribe Mexicano"
                  loading="lazy"
                />
              </div>
              <div className="partner-operation__image-sub-wrap">
                <div className="partner-operation__image-sub-frame">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="partner-operation__image-sub"
                    src="/passeios/ruinas-de-tulum-cenotes.jpg"
                    alt="Cenote natural de águas cristalinas na Riviera Maya"
                    loading="lazy"
                  />
                </div>
                <div className="partner-operation__media-badge">
                  <span className="partner-operation__badge-dot" aria-hidden="true" />
                  <span>Cancún &amp; Riviera Maya</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. PERFIS DE PARCEIROS (Prompt 2)                                         */}
        {/* ========================================================================= */}
        <section className="partner-profiles" id="perfis" aria-labelledby="partner-profiles-title">
          <div className="partner-profiles__container">
            <div className="partner-profiles__header">
              <span className="eyebrow partner-profiles__eyebrow">PERFIS DE PARCERIA</span>
              <h2 className="partner-profiles__title" id="partner-profiles-title">
                Como nos conectamos ao seu trabalho
              </h2>
            </div>

            <div className="partner-profiles__grid">
              {/* 01: Agências de viagens */}
              <article className="partner-profile-card">
                <span className="partner-profile-card__num">01</span>
                <h3 className="partner-profile-card__title">Agências de viagens</h3>
                <p className="partner-profile-card__text">
                  Para profissionais que querem oferecer experiências em Cancún aos seus clientes com apoio de uma operação local.
                </p>
              </article>

              {/* 02: Operadoras */}
              <article className="partner-profile-card">
                <span className="partner-profile-card__num">02</span>
                <h3 className="partner-profile-card__title">Operadoras</h3>
                <p className="partner-profile-card__text">
                  Para empresas que procuram uma estrutura receptiva confiável para integrar à sua operação no destino.
                </p>
              </article>

              {/* 03: Grupos e corporativos */}
              <article className="partner-profile-card">
                <span className="partner-profile-card__num">03</span>
                <h3 className="partner-profile-card__title">Grupos e corporativos</h3>
                <p className="partner-profile-card__text">
                  Para quem organiza viagens em grupo, eventos, ações corporativas ou experiências personalizadas no México.
                </p>
              </article>

              {/* 04: Influenciadores / Creators */}
              <article className="partner-profile-card">
                <span className="partner-profile-card__num">04</span>
                <h3 className="partner-profile-card__title">Influenciadores / Creators</h3>
                <p className="partner-profile-card__text">
                  Para quem deseja conectar sua audiência às experiências Tio Nenê e construir uma parceria comercial com a marca.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. BENEFÍCIOS DA PARCERIA — "O QUE VOCÊ GANHA" (Prompt 3)                 */}
        {/* ========================================================================= */}
        <section className="partner-benefits" id="beneficios" aria-labelledby="partner-benefits-title">
          <div className="partner-benefits__container">
            <div className="partner-benefits__header">
              <span className="eyebrow partner-benefits__eyebrow">PARCERIA TIO NENÊ</span>
              <h2 className="partner-benefits__title" id="partner-benefits-title">
                O que você ganha
              </h2>
            </div>

            <div className="partner-benefits__grid">
              {/* Benefício 1 */}
              <div className="partner-benefit-item">
                <div className="partner-benefit-item__icon-wrap" aria-hidden="true">
                  <svg
                    className="partner-benefit-item__icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <h3 className="partner-benefit-item__title">Operação local em Cancún</h3>
                <p className="partner-benefit-item__text">
                  Uma equipe no destino cuidando da experiência do seu cliente do início ao fim.
                </p>
              </div>

              {/* Benefício 2 */}
              <div className="partner-benefit-item">
                <div className="partner-benefit-item__icon-wrap" aria-hidden="true">
                  <svg
                    className="partner-benefit-item__icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                    <path d="M9 14l2 2 4-4" />
                  </svg>
                </div>
                <h3 className="partner-benefit-item__title">Modelo comercial para parceiros</h3>
                <p className="partner-benefit-item__text">
                  Condições e comissionamento definidos de acordo com o formato da parceria.
                </p>
              </div>

              {/* Benefício 3 */}
              <div className="partner-benefit-item">
                <div className="partner-benefit-item__icon-wrap" aria-hidden="true">
                  <svg
                    className="partner-benefit-item__icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <h3 className="partner-benefit-item__title">Estrutura para grupos e corporativos</h3>
                <p className="partner-benefit-item__text">
                  Apoio para organizar experiências, grupos fechados e demandas especiais no destino.
                </p>
              </div>

              {/* Benefício 4 */}
              <div className="partner-benefit-item">
                <div className="partner-benefit-item__icon-wrap" aria-hidden="true">
                  <svg
                    className="partner-benefit-item__icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  </svg>
                </div>
                <h3 className="partner-benefit-item__title">Suporte próximo</h3>
                <p className="partner-benefit-item__text">
                  Canal direto com nossa equipe para cotações, dúvidas e acompanhamento das solicitações.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. SELEÇÃO DO PERFIL DE PARCERIA (Prompt 4)                             */}
        {/* ========================================================================= */}
        <section
          className="partner-select"
          id="parceria"
          aria-labelledby="partner-select-title"
        >
          <div className="partner-select__container">
            <div className="partner-select__header">
              <span className="eyebrow partner-select__eyebrow">COMO PODEMOS TRABALHAR JUNTOS?</span>
              <h2 className="partner-select__title" id="partner-select-title">
                Qual parceria combina com você?
              </h2>
              <p className="partner-select__subtitle">
                Cada parceiro tem uma dinâmica diferente. Escolha o perfil que mais se aproxima da sua operação.
              </p>
            </div>

            <div
              className="partner-select__grid"
              role="group"
              aria-label="Opções de perfil de parceiro"
            >
              {PARTNER_SELECT_OPTIONS.map((option) => {
                const isSelected = partnerType === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="button"
                    aria-pressed={isSelected}
                    className={`partner-select-card ${
                      isSelected ? "partner-select-card--selected" : ""
                    }`}
                    onClick={() => setPartnerType(option.id)}
                  >
                    <div className="partner-select-card__top">
                      <span className="partner-select-card__number">{option.number}</span>
                      <div className="partner-select-card__indicator" aria-hidden="true">
                        {isSelected ? (
                          <svg
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="partner-select-card__check"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : (
                          <span className="partner-select-card__dot" />
                        )}
                      </div>
                    </div>

                    <div className="partner-select-card__icon-wrap" aria-hidden="true">
                      {option.id === "agencia" && (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="partner-select-card__icon"
                        >
                          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v11z" />
                          <path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                          <path d="M12 11v4" />
                          <path d="M9 13h6" />
                        </svg>
                      )}
                      {option.id === "operadora" && (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="partner-select-card__icon"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="2" y1="12" x2="22" y2="12" />
                          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        </svg>
                      )}
                      {option.id === "grupos" && (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="partner-select-card__icon"
                        >
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                      )}
                      {option.id === "creator" && (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="partner-select-card__icon"
                        >
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                          <circle cx="12" cy="13" r="4" />
                        </svg>
                      )}
                    </div>

                    <h3 className="partner-select-card__title">{option.title}</h3>
                    <p className="partner-select-card__description">{option.description}</p>

                    <div className="partner-select-card__status">
                      <span className="partner-select-card__status-text">
                        {isSelected ? "Perfil selecionado" : "Clique para selecionar"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="partner-select__cta-wrap">
              <button
                type="button"
                className="button partner-select__cta-btn"
                onClick={() => setIsModalOpen(true)}
                aria-label="Quero ser parceiro - abrir formulário com perfil pré-selecionado"
              >
                <span>QUERO SER PARCEIRO</span>
                <span aria-hidden="true">→</span>
              </button>
              {partnerType && (
                <p className="partner-select__cta-feedback" role="status">
                  ✦ Perfil ativo:{" "}
                  <strong>
                    {PARTNER_SELECT_OPTIONS.find((o) => o.id === partnerType)?.title}
                  </strong>{" "}
                  (pré-preenchido no formulário)
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 6. FLUXO 01–04 — COMO FUNCIONA A PARCERIA (Prompt 5)                      */}
        {/* ========================================================================= */}
        <section
          className="partner-flow"
          id="como-funciona"
          aria-labelledby="partner-flow-title"
        >
          <div className="partner-flow__container">
            <div className="partner-flow__header">
              <span className="eyebrow partner-flow__eyebrow">PASSO A PASSO</span>
              <h2 className="partner-flow__title" id="partner-flow-title">
                Como funciona a parceria
              </h2>
            </div>

            <div className="partner-flow__timeline" role="list">
              {/* Etapa 01 */}
              <div className="partner-flow-step" role="listitem">
                <div className="partner-flow-step__top">
                  <span className="partner-flow-step__number">01</span>
                  <div className="partner-flow-step__line" aria-hidden="true" />
                </div>
                <div className="partner-flow-step__body">
                  <h3 className="partner-flow-step__title">Cadastro</h3>
                  <p className="partner-flow-step__text">
                    Conte um pouco sobre você, sua empresa ou projeto e o tipo de parceria que procura.
                  </p>
                </div>
              </div>

              {/* Etapa 02 */}
              <div className="partner-flow-step" role="listitem">
                <div className="partner-flow-step__top">
                  <span className="partner-flow-step__number">02</span>
                  <div className="partner-flow-step__line" aria-hidden="true" />
                </div>
                <div className="partner-flow-step__body">
                  <h3 className="partner-flow-step__title">Recebemos sua solicitação</h3>
                  <p className="partner-flow-step__text">
                    Nossa equipe recebe seus dados e as informações necessárias para conhecer melhor a sua operação.
                  </p>
                </div>
              </div>

              {/* Etapa 03 */}
              <div className="partner-flow-step" role="listitem">
                <div className="partner-flow-step__top">
                  <span className="partner-flow-step__number">03</span>
                  <div className="partner-flow-step__line" aria-hidden="true" />
                </div>
                <div className="partner-flow-step__body">
                  <h3 className="partner-flow-step__title">Análise e aprovação</h3>
                  <p className="partner-flow-step__text">
                    Analisamos o perfil e, quando necessário, solicitamos informações ou documentos complementares.
                  </p>
                </div>
              </div>

              {/* Etapa 04 */}
              <div className="partner-flow-step partner-flow-step--last" role="listitem">
                <div className="partner-flow-step__top">
                  <span className="partner-flow-step__number">04</span>
                  <div className="partner-flow-step__line partner-flow-step__line--last" aria-hidden="true" />
                </div>
                <div className="partner-flow-step__body">
                  <h3 className="partner-flow-step__title">Acesso de parceiro</h3>
                  <p className="partner-flow-step__text">
                    Após a aprovação, você recebe as orientações e os acessos disponíveis para começar a trabalhar com a Tio Nenê.
                  </p>
                </div>
              </div>
            </div>

            <div className="partner-flow__cta-wrap">
              <button
                type="button"
                className="button partner-flow__cta-btn"
                onClick={() => setIsModalOpen(true)}
                aria-label="Quero começar - abrir formulário de cadastro de parceiro"
              >
                <span>QUERO COMEÇAR</span>
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 7. PORTAL DO PARCEIRO (Prompt 6)                                          */}
        {/* ========================================================================= */}
        <section className="partner-portal" id="portal" aria-labelledby="partner-portal-title">
          <div className="partner-portal__container">
            <div className="partner-portal__media">
              <div className="partner-portal__image-frame">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="partner-portal__image"
                  src="/images/img-28-81baf457.png"
                  alt="Ambiente de hospitalidade e recepção exclusiva no México"
                  loading="lazy"
                />
                <div className="partner-portal__badge">
                  <span className="partner-portal__badge-dot" aria-hidden="true" />
                  <span>Área do Parceiro · Em breve</span>
                </div>
              </div>
            </div>

            <div className="partner-portal__content">
              <span className="eyebrow partner-portal__eyebrow">PORTAL DO PARCEIRO</span>
              <h2 className="partner-portal__title" id="partner-portal-title">
                Tudo para facilitar a sua operação
              </h2>

              <p className="partner-portal__description">
                Parceiros aprovados poderão acessar uma área dedicada para consultar informações, organizar solicitações e manter a operação com a Tio Nenê em um só lugar.
              </p>

              <ul className="partner-portal__list" aria-label="Recursos previstos no portal">
                <li className="partner-portal__item">
                  <span className="partner-portal__item-icon" aria-hidden="true">✦</span>
                  <span>Vitrine de passeios e experiências</span>
                </li>
                <li className="partner-portal__item">
                  <span className="partner-portal__item-icon" aria-hidden="true">✦</span>
                  <span>Informações comerciais para parceiros</span>
                </li>
                <li className="partner-portal__item">
                  <span className="partner-portal__item-icon" aria-hidden="true">✦</span>
                  <span>Materiais de apoio</span>
                </li>
                <li className="partner-portal__item">
                  <span className="partner-portal__item-icon" aria-hidden="true">✦</span>
                  <span>Solicitação de cotações</span>
                </li>
                <li className="partner-portal__item">
                  <span className="partner-portal__item-icon" aria-hidden="true">✦</span>
                  <span>Acompanhamento de solicitações</span>
                </li>
                <li className="partner-portal__item">
                  <span className="partner-portal__item-icon" aria-hidden="true">✦</span>
                  <span>Conteúdos e documentos atualizados</span>
                </li>
                <li className="partner-portal__item">
                  <span className="partner-portal__item-icon" aria-hidden="true">✦</span>
                  <span>Canal direto com nossa equipe</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 8. CTA FINAL (Prompt 6)                                                   */}
        {/* ========================================================================= */}
        <section className="partner-final-cta" id="contato-parceria" aria-labelledby="partner-final-cta-title">
          <div className="partner-final-cta__container">
            <div className="partner-final-cta__content">
              <span className="eyebrow partner-final-cta__eyebrow">VAMOS CONVERSAR?</span>
              <h2 className="partner-final-cta__title" id="partner-final-cta-title">
                Quer entender primeiro como a parceria pode funcionar para você?
              </h2>
              <p className="partner-final-cta__text">
                Fale com nossa equipe. A gente entende o seu modelo de trabalho e indica o melhor caminho para começar.
              </p>

              <div className="partner-final-cta__actions">
                <button
                  type="button"
                  className="button partner-final-cta__btn-primary"
                  onClick={() => setIsModalOpen(true)}
                >
                  QUERO SER PARCEIRO
                </button>

                <a
                  href={directTeamWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="partner-final-cta__btn-secondary"
                  aria-label="Falar com a equipe pelo WhatsApp"
                >
                  <span>FALAR COM A EQUIPE</span>
                  <svg
                    className="partner-final-cta__wa-icon"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.539 1.772.82 2.791.82 3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.587-5.806-5.768-5.806zm3.374 8.232c-.143.402-.83.743-1.15.789-.319.046-.732.062-2.127-.487-1.396-.549-2.275-1.979-2.345-2.073-.07-.094-.564-.75-.564-1.428 0-.678.354-1.011.48-1.152.125-.141.274-.176.365-.176.091 0 .183.001.263.005.084.004.197-.032.308.234.114.274.388.948.423 1.018.034.07.057.153.011.246-.046.094-.069.153-.137.234-.069.082-.144.183-.206.246-.069.07-.14.146-.06.284.08.138.355.586.762.949.524.467.965.611 1.103.68.137.069.217.058.297-.034.08-.093.343-.4.434-.537.092-.138.183-.115.309-.069.126.046.799.377.936.446.137.069.229.103.263.161.034.057.034.331-.109.733z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Modal Quero ser Parceiro */}
      <PartnerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedPartnerType={partnerType}
      />

      {/* Footer global institucional */}
      <Footer />
    </div>
  );
}



