import React from "react";
import { ClientImportantInfoItem } from "@/data/mock-client";

interface ClientImportantInfoProps {
  informacoes: ClientImportantInfoItem[];
}

export default function ClientImportantInfo({
  informacoes,
}: ClientImportantInfoProps) {
  return (
    <section
      className="client-page-info"
      id="informacoes-importantes"
      aria-labelledby="client-info-title"
    >
      <div className="client-page-container">
        {/* Cabeçalho Editorial */}
        <div className="client-page-info__header">
          <div className="client-page-info__heading-col">
            <p className="eyebrow client-page-info__eyebrow">ANTES DE SAIR</p>
            <h2 id="client-info-title" className="client-page-info__title">
              Informações <em className="accent">importantes</em>.
            </h2>
          </div>
          <div className="client-page-info__desc-col">
            <p className="client-page-info__desc">
              Orientações práticas para você vivenciar sua estadia no Caribe
              Mexicano com leveza, segurança e sem imprevistos operacionais.
            </p>
          </div>
        </div>

        {/* Bloco Editorial com Divisores Suaves (Não é FAQ corporativo, nem lista de alertas vermelhos) */}
        <div className="client-page-info__panel">
          <div className="client-page-info__grid">
            {informacoes.map((item) => (
              <article key={item.id} className="client-page-info__item">
                <span className="client-page-info__category">
                  {item.categoria}
                </span>
                <h3 className="client-page-info__item-title">{item.titulo}</h3>
                <p className="client-page-info__item-text">{item.texto}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
