import React from "react";
import type { Metadata } from "next";
import ClientHeader from "@/components/client/ClientHeader";
import Footer from "@/components/Footer";
import ClientTripHero from "@/components/client/ClientTripHero";
import ClientTripSummary from "@/components/client/ClientTripSummary";
import ClientTours from "@/components/client/ClientTours";
import ClientTripTimeline from "@/components/client/ClientTripTimeline";
import ClientDocuments from "@/components/client/ClientDocuments";
import ClientImportantInfo from "@/components/client/ClientImportantInfo";
import ClientSupport from "@/components/client/ClientSupport";
import { MOCK_CLIENT_DATA } from "@/data/mock-client";

export const metadata: Metadata = {
  title: "Minha Viagem | Área do Cliente · Tio Nenê",
  description: "Acompanhe seus passeios contratados, vouchers e roteiro no Caribe Mexicano.",
};

export default function ClientePage() {
  const {
    cliente,
    viagem,
    passeios,
    roteiroTimeline,
    documentos,
    informacoesImportantes,
    suporte,
  } = MOCK_CLIENT_DATA;

  return (
    <div className="client-page">
      {/* 1. Header Exclusivo da Área do Cliente */}
      <ClientHeader />

      <main className="client-page__main">
        {/* 1. Abertura / Hero do Cliente */}
        <ClientTripHero
          cliente={cliente}
          viagem={viagem}
          totalPasseios={passeios.length}
        />

        {/* 2. Resumo da Viagem */}
        <ClientTripSummary
          viagem={viagem}
          totalPasseios={passeios.length}
        />

        {/* 3. Seus Passeios (Principal seção) */}
        <ClientTours passeios={passeios} />

        {/* 4. Seu Roteiro no México (Timeline) */}
        <ClientTripTimeline timeline={roteiroTimeline} />

        {/* 5. Seus Documentos (Vouchers) */}
        <ClientDocuments
          documentos={documentos}
          clienteNome={cliente.nome}
        />

        {/* 6. Informações Importantes */}
        <ClientImportantInfo informacoes={informacoesImportantes} />

        {/* 7. Suporte & Concierge Local */}
        <ClientSupport
          suporte={suporte}
          clienteNome={cliente.nome}
        />
      </main>

      {/* 8. Footer Global Existente */}
      <Footer />
    </div>
  );
}
