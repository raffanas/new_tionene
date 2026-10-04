"use client";

import React, { useState, useEffect } from "react";
import { ClientDocument } from "@/data/mock-client";

interface ClientDocumentsProps {
  documentos: ClientDocument[];
  clienteNome?: string;
}

export default function ClientDocuments({
  documentos,
  clienteNome = "Isabella",
}: ClientDocumentsProps) {
  const [modalDoc, setModalDoc] = useState<ClientDocument | null>(null);

  const handleOpenDoc = (doc: ClientDocument) => {
    setModalDoc(doc);
  };

  const handleCloseModal = () => {
    setModalDoc(null);
  };

  // Suporte a fechamento com tecla ESC para acessibilidade
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setModalDoc(null);
      }
    };
    if (modalDoc) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [modalDoc]);

  return (
    <section
      className="client-page-documents"
      id="documentos"
      aria-labelledby="client-docs-title"
    >
      <div className="client-page-container">
        {/* Cabeçalho Editorial */}
        <div className="client-page-documents__header">
          <div className="client-page-documents__heading-col">
            <p className="eyebrow client-page-documents__eyebrow">SUA VIAGEM</p>
            <h2 id="client-docs-title" className="client-page-documents__title">
              Seus <em className="accent">documentos</em>.
            </h2>
          </div>
          <div className="client-page-documents__desc-col">
            <p className="client-page-documents__desc">
              Tudo o que você precisa levar e consultar durante a viagem, reunido
              em um só lugar de fácil acesso.
            </p>
          </div>
        </div>

        {/* Lista Editorial Ampla de Documentos (Sem tabela administrativa, sem grid genérico de 4 cards) */}
        <div className="client-page-documents__panel">
          <ul className="client-page-documents__list">
            {documentos.map((doc) => (
              <li key={doc.id} className="client-page-documents__item">
                {/* Informações do Documento */}
                <div className="client-page-documents__info">
                  <span className="client-page-documents__type">
                    {doc.tipo}
                  </span>
                  <h3 className="client-page-documents__name">{doc.nome}</h3>
                  {doc.descricaoDemonstrativa && (
                    <p className="client-page-documents__subtext">
                      {doc.descricaoDemonstrativa}
                    </p>
                  )}
                </div>

                {/* Status Discreto */}
                <div className="client-page-documents__status-col">
                  <span className="client-page-seal client-page-seal--confirmed">
                    <span
                      className="client-page-seal__dot"
                      aria-hidden="true"
                    />
                    {doc.status}
                  </span>
                </div>

                {/* Ação Visual Demonstrativa */}
                <div className="client-page-documents__actions">
                  <button
                    type="button"
                    className="client-page-documents__action-btn"
                    onClick={() => handleOpenDoc(doc)}
                    aria-label={`Visualizar documento: ${doc.nome}`}
                  >
                    <span>VISUALIZAR</span>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Modal Demonstrativo Provisório (Visual, sem PDF ou download real) */}
        {modalDoc && (
          <div
            className="client-page-modal-backdrop"
            onClick={handleCloseModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-doc-title"
          >
            <div
              className="client-page-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="client-page-modal__header">
                <div>
                  <span className="eyebrow client-page-modal__eyebrow">
                    {modalDoc.tipo} · PRÉ-VISUALIZAÇÃO
                  </span>
                  <h3 id="modal-doc-title" className="client-page-modal__title">
                    {modalDoc.nome}
                  </h3>
                </div>
                <button
                  type="button"
                  className="client-page-modal__close"
                  onClick={handleCloseModal}
                  aria-label="Fechar pré-visualização do documento"
                >
                  ✕
                </button>
              </div>

              <div className="client-page-modal__content">
                <div className="client-page-modal__preview-box">
                  <div className="client-page-modal__seal">
                    ✦ DOCUMENTO CONFIRMADO PELA EQUIPE ✦
                  </div>
                  <div className="client-page-modal__meta-grid">
                    <p>
                      <strong>Titular da Reserva:</strong> {clienteNome}
                    </p>
                    <p>
                      <strong>Status de Emissão:</strong> {modalDoc.status}
                    </p>
                    <p>
                      <strong>Destino:</strong> Cancún, Quintana Roo – México
                    </p>
                    <p>
                      <strong>Emissor:</strong> Tio Nenê Concierge &amp;
                      Experiências
                    </p>
                  </div>
                  <div className="client-page-modal__note">
                    {modalDoc.descricaoDemonstrativa} Nesta etapa de validação
                    visual, os vouchers e guias completos em formato digital
                    estarão disponíveis na entrega da versão final do sistema.
                  </div>
                </div>
              </div>

              <div className="client-page-modal__footer">
                <button
                  type="button"
                  className="client-page-btn client-page-btn--secondary"
                  onClick={handleCloseModal}
                >
                  FECHAR VISUALIZAÇÃO
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
