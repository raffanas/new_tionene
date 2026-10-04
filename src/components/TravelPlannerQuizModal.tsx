"use client";

import React, { useEffect, useCallback } from "react";
import TravelPlannerQuiz from "./TravelPlannerQuiz";

export interface TravelPlannerQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  source?: string;
}

export default function TravelPlannerQuizModal({
  isOpen,
  onClose,
  source = "home",
}: TravelPlannerQuizModalProps) {
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // 1. Bloqueio de scroll da página enquanto o modal estiver aberto
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // 2. Fechamento por tecla ESC
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  return (
    <div
      className="tp-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Quiz Descubra sua viagem ideal"
      onClick={handleClose}
    >
      <div
        className="tp-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        <TravelPlannerQuiz
          variant="modal"
          source={source}
          onClose={handleClose}
          showIntro={false}
        />
      </div>
    </div>
  );
}
