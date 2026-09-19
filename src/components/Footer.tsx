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
            <p>📍 &nbsp;{SITE_CONFIG.location}</p>
            <p>🇧🇷 &nbsp;{SITE_CONFIG.supportLang}</p>
          </address>
        </div>

        <nav className="footer__column" aria-label="Navegação do rodapé">
          <h2 className="footer__heading">Navegação</h2>
          <Link href={SITE_CONFIG.routes.home}>Início</Link>
          <Link href={SITE_CONFIG.routes.passeios}>Passeios</Link>
          <Link href={SITE_CONFIG.routes.viagemCompleta}>Viagem completa</Link>
          <Link href={SITE_CONFIG.routes.curadoriaBella}>Curadoria Bella</Link>
          <Link href={SITE_CONFIG.routes.sobreNos}>Sobre nós</Link>
        </nav>

        <div className="footer__column">
          <h2 className="footer__heading">Experiências</h2>
          <Link href={SITE_CONFIG.routes.passeios}>Chichén Itzá Premium</Link>
          <Link href={SITE_CONFIG.routes.passeios}>Isla Mujeres Exclusiva</Link>
          <Link href={SITE_CONFIG.routes.passeios}>Cenotes Secretos</Link>
          <Link href={SITE_CONFIG.routes.curadoriaBella}>Curadoria Gastronômica</Link>
          <Link href={SITE_CONFIG.routes.programacao}>Roteiro Personalizado</Link>
        </div>

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
