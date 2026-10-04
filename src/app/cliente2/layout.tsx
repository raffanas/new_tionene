import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Isabella · Programação de Viagem | Tio Nenê",
  description:
    "Área exclusiva para acompanhar os passeios confirmados, detalhes da hospedagem e a linha do tempo dia a dia da viagem da Isabella em Cancún.",
};

export default function Cliente2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
