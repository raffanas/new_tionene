import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Seja Parceiro | Operação Local em Cancún e Caribe Mexicano | Tio Nenê",
  description:
    "Leve Cancún para os seus clientes. A Tio Nenê atua com operação local para agências de viagens, operadoras, grupos corporativos e parceiros de conteúdo.",
};

export default function SejaParceiroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
