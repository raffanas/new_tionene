"use client";

import React, { useState, useEffect } from "react";

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ProfileKey = "ponderado" | "cultural" | "explorador";

interface QuestionOption {
  text: string;
  profile: ProfileKey;
}

interface Question {
  eyebrow: string;
  title: string;
  options: QuestionOption[];
}

const QUESTIONS: Question[] = [
  {
    eyebrow: "PERGUNTA 1 DE 4",
    title: "O intuito da sua viagem é:",
    options: [
      {
        text: "Aproveitar bem os dias que tenho, sem correria e com o essencial resolvido",
        profile: "ponderado",
      },
      {
        text: "Sentir o México de verdade: cultura, comida, história",
        profile: "cultural",
      },
      {
        text: "Ver o máximo possível, sem deixar nada de fora",
        profile: "explorador",
      },
    ],
  },
  {
    eyebrow: "PERGUNTA 2 DE 4",
    title: "Você gosta de:",
    options: [
      {
        text: "Roteiro simples, com poucos imprevistos e tudo já organizado",
        profile: "ponderado",
      },
      {
        text: "Descobrir um restaurante de rua, uma vila colorida, uma história que poucos conhecem",
        profile: "cultural",
      },
      {
        text: "Acordar cedo, voltar tarde, e ainda ter energia pra balada",
        profile: "explorador",
      },
    ],
  },
  {
    eyebrow: "PERGUNTA 3 DE 4",
    title: "Numa viagem pra Cancún, é imperdível que você:",
    options: [
      {
        text: "Curta a praia e o hotel, sem se preocupar em correr atrás de passeio",
        profile: "ponderado",
      },
      {
        text: "Prove a cochinita pibil de um lugar que só quem mora aqui conhece",
        profile: "cultural",
      },
      {
        text: "Visite pelo menos uma ilha ou cenote que a maioria dos turistas nem sabe que existe",
        profile: "explorador",
      },
    ],
  },
  {
    eyebrow: "PERGUNTA 4 DE 4",
    title: "O que você não quer numa viagem:",
    options: [
      {
        text: "Gastar tempo (ou dinheiro) decidindo entre mil opções de passeio",
        profile: "ponderado",
      },
      {
        text: "Sentir que só viu o \"lado turístico\" do México",
        profile: "cultural",
      },
      {
        text: "Voltar pra casa achando que podia ter feito mais",
        profile: "explorador",
      },
    ],
  },
];

const PROFILES: Record<
  ProfileKey,
  {
    title: string;
    description: string;
    cardTitle: string;
    targetAnchor: string;
    bullets: string[];
  }
> = {
  cultural: {
    title: "Perfil Cultural",
    description:
      "Você não quer só ver Cancún, quer sentir o México. Ruínas maias, cenotes escondidos, uma cochinita pibil de verdade, um mezcal local — pra você, viajar é também aprender e se conectar com a cultura do lugar, não só bater a foto de cartão-postal. Seu roteiro ideal equilibra os clássicos com pelo menos uma experiência fora do óbvio: uma vila colorida, um restaurante que só quem mora aqui conhece, um passeio que conta a história por trás do destino. É aqui que Cancún vira Yucatán de verdade.",
    cardTitle: "Perfil Cultural",
    targetAnchor: "#pacote-intermediario",
    bullets: [
      "Tudo do Perfil Ponderado",
      "Chichén Itzá + cenote Ik Kil com guia historiador",
      "Tour gastronômico com cochinita pibil e mezcal",
      "Valladolid ou uma vila colorida fora da rota turística",
    ],
  },
  ponderado: {
    title: "Viajante Ponderado",
    description:
      "Uma viagem tranquila, com o essencial bem resolvido e tempo para curtir cada lugar. Sem correria, você prefere aproveitar a praia, o hotel e focar nas experiências imperdíveis com tudo organizado e sem preocupações. Seu roteiro ideal prioriza o conforto e os passeios essenciais para aproveitar seus dias com tranquilidade.",
    cardTitle: "Viajante Ponderado",
    targetAnchor: "#pacote-basico",
    bullets: [
      "Isla Mujeres em catamarã com open bar",
      "Chichén Itzá clássico + Cenote",
      "Barco de vidro e snorkel nos recifes",
      "Dias livres para curtir a praia e o hotel",
    ],
  },
  explorador: {
    title: "Viajante Explorador",
    description:
      "Para viver o máximo de Cancún e Yucatán, sem deixar experiências importantes de fora. Da adrenalina dos parques ecológicos e baladas lendárias até ilhas paradisíacas e cenotes secretos, você quer uma viagem vibrante e intensa do primeiro ao último dia, aproveitando cada minuto.",
    cardTitle: "Viajante Explorador",
    targetAnchor: "#pacote-completo",
    bullets: [
      "Tudo do Perfil Cultural",
      "Expedição a Cozumel e Holbox",
      "Aventura em cenotes e tirolesas",
      "Ingresso VIP para o Coco Bongo e vida noturna",
    ],
  },
};

export default function QuizModal({ isOpen, onClose }: QuizModalProps) {
  const [currentStep, setCurrentStep] = useState(0); // 0, 1, 2, 3 = Questions; 4 = Result
  const [answers, setAnswers] = useState<number[]>([]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isResultStep = currentStep === 4;

  const handleSelectOption = (optionIndex: number) => {
    const nextAnswers = [...answers];
    nextAnswers[currentStep] = optionIndex;
    setAnswers(nextAnswers);
  };

  const handleNext = () => {
    if (answers[currentStep] === undefined) return;
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    } else {
      onClose();
    }
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setAnswers([]);
  };

  // Determine profile
  const getWinnerProfile = (): ProfileKey => {
    const counts: Record<ProfileKey, number> = {
      ponderado: 0,
      cultural: 0,
      explorador: 0,
    };

    answers.forEach((optIdx, qIdx) => {
      const q = QUESTIONS[qIdx];
      if (q && q.options[optIdx]) {
        counts[q.options[optIdx].profile]++;
      }
    });

    if (counts.cultural >= counts.ponderado && counts.cultural >= counts.explorador) {
      return "cultural";
    }
    if (counts.ponderado >= counts.explorador) {
      return "ponderado";
    }
    return "explorador";
  };

  const profileKey = getWinnerProfile();
  const profileData = PROFILES[profileKey];

  const handleGoToPackage = (anchor: string) => {
    onClose();
    setTimeout(() => {
      const target = document.querySelector(anchor);
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    }, 150);
  };

  const handleGoToCatalog = () => {
    onClose();
    setTimeout(() => {
      const target = document.querySelector("#catalogo");
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    }, 150);
  };

  // Progress percentage
  // Question 1 = 25%, Question 2 = 50%, Question 3 = 75%, Question 4 = 100%, Result = 100%
  const progressPercent = isResultStep ? 100 : (currentStep + 1) * 25;

  return (
    <div
      className="quiz-modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="quiz-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Progress Bar */}
        <div className="quiz-modal-progress">
          <div
            className={`quiz-modal-progress__bar ${isResultStep ? "quiz-modal-progress__bar--full" : ""}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Close Button */}
        <button
          type="button"
          className="quiz-modal-close"
          onClick={onClose}
          aria-label="Fechar quiz"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M15 5L5 15M5 5L15 15"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {!isResultStep ? (
          // ================= QUESTION VIEW =================
          <div className="quiz-modal-content">
            <p className="quiz-modal-eyebrow">
              {QUESTIONS[currentStep].eyebrow}
            </p>

            <h2 className="quiz-modal-question">
              {QUESTIONS[currentStep].title}
            </h2>

            <div className="quiz-modal-options">
              {QUESTIONS[currentStep].options.map((option, idx) => {
                const isSelected = answers[currentStep] === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    className={`quiz-modal-option ${isSelected ? "quiz-modal-option--selected" : ""}`}
                    onClick={() => handleSelectOption(idx)}
                  >
                    <span>{option.text}</span>
                  </button>
                );
              })}
            </div>

            <div className="quiz-modal-footer">
              <button
                type="button"
                className="quiz-modal-back"
                onClick={handleBack}
              >
                &lt; Voltar
              </button>

              <button
                type="button"
                className={`quiz-modal-next ${answers[currentStep] !== undefined ? "quiz-modal-next--active" : ""}`}
                disabled={answers[currentStep] === undefined}
                onClick={handleNext}
              >
                {currentStep === QUESTIONS.length - 1 ? "VER RESULTADO" : "PRÓXIMA"}
              </button>
            </div>
          </div>
        ) : (
          // ================= RESULT VIEW =================
          <div className="quiz-modal-result">
            <p className="quiz-modal-result__eyebrow">
              SEU PERFIL DE VIAGEM É
            </p>

            <h2 className="quiz-modal-result__title">
              {profileData.title}
            </h2>

            <p className="quiz-modal-result__description">
              {profileData.description}
            </p>

            {/* Recommended Package Card */}
            <div className="quiz-modal-recommendation">
              <span className="quiz-modal-badge">
                RECOMENDADO PRA VOCÊ
              </span>
              <h3 className="quiz-modal-recommendation__title">
                {profileData.cardTitle}
              </h3>
              <ul className="quiz-modal-recommendation__list">
                {profileData.bullets.map((bullet, idx) => (
                  <li key={idx} className="quiz-modal-recommendation__item">
                    <span className="quiz-modal-recommendation__bullet">•</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              className="quiz-modal-cta-btn"
              onClick={() => handleGoToPackage(profileData.targetAnchor)}
            >
              VER ESSE PACOTE
            </button>

            <button
              type="button"
              className="quiz-modal-custom-route-btn"
              onClick={handleGoToCatalog}
            >
              Prefiro montar meu próprio roteiro
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
