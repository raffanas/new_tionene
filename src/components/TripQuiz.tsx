"use client";

import React, { useState } from "react";
import { SITE_CONFIG } from "@/config/site";

export default function TripQuiz() {
  const [status, setStatus] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const whatsapp = SITE_CONFIG.whatsapp;
    if (whatsapp) {
      const lines = [
        "Olá! Quero planejar minha viagem com a Tio Nenê.",
        ...Array.from(formData.entries()).map(([k, v]) => `${k}: ${v}`),
      ];
      const text = lines.join("\n");
      const url = `https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
      window.open(url, "_blank");
    } else {
      setStatus("O atendimento para envio do roteiro ainda não está disponível no momento.");
      const contatoSection = document.querySelector("#contato");
      if (contatoSection) {
        contatoSection.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <section className="quiz" id="trip-quiz" aria-labelledby="quiz-title">
      <div className="quiz__top">
        <div>
          <p className="eyebrow">Descubra sua viagem ideal</p>
          <h2 id="quiz-title">Não sabe por onde começar?</h2>
        </div>
        <p className="quiz__intro">
          Em 5 perguntas rápidas, encontramos o <strong>melhor caminho</strong> para a sua viagem ao México.
        </p>
      </div>
      <form className="quiz__fields" onSubmit={handleSubmit}>
        <label>
          <span className="sr-only">Quando você vem?</span>
          <input
            className="quiz__field"
            type="text"
            name="quando"
            placeholder="01 Quando você vem?"
          />
        </label>
        <label>
          <span className="sr-only">Com quem viaja?</span>
          <input
            className="quiz__field"
            type="text"
            name="companhia"
            placeholder="02 Com quem viaja?"
          />
        </label>
        <label>
          <span className="sr-only">Quantos dias?</span>
          <input
            className="quiz__field"
            type="text"
            name="dias"
            placeholder="03 Quantos dias?"
          />
        </label>
        <label>
          <span className="sr-only">Qual o budget?</span>
          <input
            className="quiz__field"
            type="text"
            name="budget"
            placeholder="04 Qual o budget?"
          />
        </label>
        <button type="submit" className="quiz__submit">
          Ver meu roteiro
        </button>
      </form>
      {status && (
        <p id="quiz-status" role="status" style={{ marginTop: "1rem", color: "var(--wine)", textAlign: "center" }}>
          {status}
        </p>
      )}
    </section>
  );
}
