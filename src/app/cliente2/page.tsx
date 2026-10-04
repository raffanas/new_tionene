import React from "react";
import ClientHeader from "@/components/client/ClientHeader";
import Footer from "@/components/Footer";
import Client2Hero from "@/components/client2/Client2Hero";
import Client2Tours from "@/components/client2/Client2Tours";
import Client2TripSummary from "@/components/client2/Client2TripSummary";
import Client2Timeline from "@/components/client2/Client2Timeline";
import Client2ClosingCta from "@/components/client2/Client2ClosingCta";
import { MOCK_CLIENT_2_DATA } from "@/data/mock-client-2";

export default function Cliente2Page() {
  const { client, tours, summary, timeline } = MOCK_CLIENT_2_DATA;

  return (
    <div className="client2-page">
      {/* 1. Header do Cliente com Logo + Botão Sair (mesmo de /cliente) */}
      <ClientHeader />

      <main className="client2-main">
        {/* 1. Hero personalizado da viagem */}
        <Client2Hero client={client} />

        {/* Container principal: 2. Seção “Seus passeios confirmados” + 3. Resumo lateral da viagem */}
        <div className="client2-container">
          <div className="client2-layout">
            <div className="client2-layout__primary">
              <Client2Tours tours={tours} />
            </div>
            <div className="client2-layout__secondary">
              <Client2TripSummary summary={summary} clientName={client.name} />
            </div>
          </div>
        </div>

        {/* 4. Linha do tempo “Visão geral da viagem” */}
        <div className="client2-container">
          <Client2Timeline timeline={timeline} />
        </div>

        {/* 5. Bloco emocional final */}
        <Client2ClosingCta clientName={client.name} />
      </main>

      {/* 6. Footer global existente */}
      <Footer />
    </div>
  );
}
