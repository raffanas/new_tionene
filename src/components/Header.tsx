"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { SITE_CONFIG } from "@/config/site";

interface HeaderProps {
  currentPage?: "home" | "passeios" | "viagem-completa" | "curadoria-bella" | "sobre-nos" | "programacao" | "seja-parceiro";
  logoSrc?: string;
}

export default function Header({ currentPage, logoSrc }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const logo = logoSrc || (currentPage === "sobre-nos" ? "/img/tio-nene-03.svg" : "/img/tio-nene-01.svg");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    const handleResize = () => {
      if (window.innerWidth > 1024 && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen]);

  const toggleMenu = () => setIsOpen((prev) => !prev);
  const closeMenu = () => setIsOpen(false);

  return (
    <header className="header">
      <Link href={SITE_CONFIG.routes.home} aria-label="Tio Nenê, início" onClick={closeMenu}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="header__logo"
          src={logo}
          alt="Tio Nenê"
        />
      </Link>
      <button
        className="header__toggle"
        type="button"
        aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
        aria-expanded={isOpen}
        aria-controls="navigation"
        onClick={toggleMenu}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
      <nav
        className={`header__nav ${isOpen ? "header__nav--open" : ""}`}
        id="navigation"
        aria-label="Navegação principal"
      >
        <div className="header__nav-inner">
          <Link
            className="header__link"
            href={SITE_CONFIG.routes.home}
            aria-current={currentPage === "home" ? "page" : undefined}
            onClick={closeMenu}
          >
            Home
          </Link>
          <Link
            className="header__link"
            href={SITE_CONFIG.routes.passeios}
            aria-current={currentPage === "passeios" ? "page" : undefined}
            onClick={closeMenu}
          >
            Passeios
          </Link>
          <Link
            className="header__link"
            href={SITE_CONFIG.routes.viagemCompleta}
            aria-current={currentPage === "viagem-completa" ? "page" : undefined}
            onClick={closeMenu}
          >
            Viagem completa
          </Link>
          <Link
            className="header__link"
            href={SITE_CONFIG.routes.curadoriaBella}
            aria-current={currentPage === "curadoria-bella" ? "page" : undefined}
            onClick={closeMenu}
          >
            Curadoria Bella
          </Link>
          <Link
            className="header__link"
            href={SITE_CONFIG.routes.sobreNos}
            aria-current={currentPage === "sobre-nos" ? "page" : undefined}
            onClick={closeMenu}
          >
            Sobre nós
          </Link>
          <Link
            className="header__link"
            href={SITE_CONFIG.routes.sejaParceiro}
            aria-current={currentPage === "seja-parceiro" ? "page" : undefined}
            onClick={closeMenu}
          >
            Seja Parceiro
          </Link>
          <a
            className="header__link header__link--contact"
            href="#contato"
            onClick={closeMenu}
          >
            Fale conosco
          </a>
        </div>
      </nav>
    </header>
  );
}
