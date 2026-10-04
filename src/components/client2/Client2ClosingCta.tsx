import React from "react";
import { SITE_CONFIG } from "@/config/site";

interface Client2ClosingCtaProps {
  clientName: string;
}

export default function Client2ClosingCta({ clientName }: Client2ClosingCtaProps) {
  const rawNumber = SITE_CONFIG.whatsapp?.replace(/\D/g, "");
  const whatsappUrl = rawNumber
    ? `https://wa.me/${rawNumber}?text=${encodeURIComponent(
        `Olá, equipe Tio Nenê! Sou a ${clientName} e gostaria de falar com vocês sobre a minha viagem ao México.`
      )}`
    : "#contato";

  return (
    <section className="client2-closing" aria-labelledby="client2-closing-title">
      <div className="client2-closing__container">
        {/* Coluna da Esquerda: Eyebrow + Título Editorial */}
        <div className="client2-closing__col-left">
          <span className="client2-closing__eyebrow">EXPERIÊNCIAS</span>
          <h2 className="client2-closing__title" id="client2-closing-title">
            Criamos <em>memórias</em>, não apenas roteiros.
          </h2>
        </div>

        {/* Coluna da Direita: Texto Emocional + CTA de Atendimento */}
        <div className="client2-closing__col-right">
          <p className="client2-closing__text">
            Cada detalhe da sua viagem foi pensado para que você aproveite o destino com mais tranquilidade, presença e boas lembranças.
          </p>

          <div className="client2-closing__actions">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="client2-closing__btn"
              aria-label="Fale com nossa equipe pelo WhatsApp"
            >
              <span>FALE COM NOSSA EQUIPE</span>
              <svg
                className="client2-closing__wa-icon"
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
  );
}
