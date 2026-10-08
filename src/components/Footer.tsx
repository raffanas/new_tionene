import React from "react";
import Link from "next/link";
import { SITE_CONFIG } from "@/config/site";

export default function Footer() {
  const whatsappUrl = SITE_CONFIG.whatsapp
    ? `https://wa.me/${SITE_CONFIG.whatsapp.replace(/\D/g, "")}`
    : "#contato";

  return (
    <footer className="footer">
      <div className="footer__grid">
        <div className="footer__brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="footer__logo"
            src="/img/tio-nene-01.svg"
            alt="Tio Nenê — Viagens e experiências"
          />
          <p className="footer__description">
            Agência boutique brasileira com operação própria em Cancún desde 2014. Especialistas em transformar sua jornada pelo México em uma memória inesquecível.
          </p>
          <address className="footer__address">
            <p style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span aria-hidden="true">📍</span>
              <span>{SITE_CONFIG.location}</span>
            </p>
            <p style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <svg
                width="18"
                height="13"
                viewBox="0 0 20 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                  display: "inline-block",
                  borderRadius: "2px",
                  overflow: "hidden",
                  flexShrink: 0,
                  boxShadow: "0 0 2px rgba(0,0,0,0.35)",
                }}
                aria-label="Bandeira do Brasil"
                role="img"
              >
                <rect width="20" height="14" fill="#009739" />
                <polygon points="10,1.8 18.2,7 10,12.2 1.8,7" fill="#FED100" />
                <circle cx="10" cy="7" r="3.4" fill="#002776" />
                <path
                  d="M6.8 6.8C7.6 5.9 9.8 5.7 13.2 7.2"
                  stroke="#FFFFFF"
                  strokeWidth="0.8"
                  fill="none"
                />
              </svg>
              <span>{SITE_CONFIG.supportLang}</span>
            </p>
          </address>
        </div>

        <nav className="footer__column" aria-label="Navegação do rodapé">
          <h2 className="footer__heading">Navegação</h2>
          <Link href={SITE_CONFIG.routes.home}>Início</Link>
          <Link href={SITE_CONFIG.routes.sobreNos}>Sobre nós</Link>
          <Link href={SITE_CONFIG.routes.viagemCompleta}>Viagem completa</Link>
          <Link href={SITE_CONFIG.routes.passeios}>Catálogo de passeios</Link>
          <Link href={SITE_CONFIG.routes.curadoriaBella}>Curadoria Bella</Link>
          <a href="#">Roteiro sob medida</a>
        </nav>

        <nav className="footer__column" aria-label="Institucional">
          <h2 className="footer__heading">Institucional</h2>
          <Link href={SITE_CONFIG.routes.sejaParceiro}>Seja Parceiro</Link>
          <Link href="#">Perguntas Frequentes</Link>
          <Link href="#">Políticas de Privacidade</Link>
          <Link href="#">Termos de Uso</Link>
        </nav>

        <div className="footer__column footer__contact">
          <h2 className="footer__heading">Atendimento Direto</h2>
          <p>
            Fale diretamente com nossa equipe no WhatsApp para desenhar seu roteiro sob medida.
          </p>
          <a
            className="footer__button"
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            FALAR NO WHATSAPP
          </a>
        </div>
      </div>

      <div className="footer__bottom">
        <p>© {new Date().getFullYear()} Tio Nenê. Todos os direitos reservados.</p>
        <div>
          <a href="#">Política de Privacidade</a>
          <a href="#">Termos e Condições</a>
        </div>
      </div>
    </footer>
  );
}
