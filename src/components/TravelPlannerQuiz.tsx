"use client";

import React, { useState, useCallback, useId, useRef } from "react";
import Link from "next/link";
import { SITE_CONFIG } from "@/config/site";
import {
  PLANNER_QUIZ_QUESTIONS,
  INITIAL_QUESTION_ID,
  PLANNER_QUIZ_RESULTS,
  PlannerQuizResultType,
  PlannerQuizLeadPayload,
  getFriendlyResultName,
  buildWhatsAppMessage,
} from "@/data/travel-planner-quiz";

export interface TravelPlannerQuizProps {
  source?: string;
  variant?: "modal" | "page";
  showIntro?: boolean;
  onClose?: () => void;
}

export default function TravelPlannerQuiz({
  source = "home",
  variant = "modal",
  showIntro = false,
  onClose,
}: TravelPlannerQuizProps) {
  const titleId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  // 0. Transição suave de scroll para o topo do quiz no modo página
  const scrollToQuizTop = useCallback(() => {
    if (variant !== "page" || typeof window === "undefined") return;
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.top < 60) {
        containerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [variant]);

  // 1. Estado de início (quando showIntro está habilitado)
  const [hasStarted, setHasStarted] = useState<boolean>(!showIntro);

  // 2. Estado da navegação não-linear e respostas
  const [currentQuestionId, setCurrentQuestionId] = useState<string>(INITIAL_QUESTION_ID);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<string[]>([INITIAL_QUESTION_ID]);
  const [result, setResult] = useState<PlannerQuizResultType | null>(null);

  // 3. Estado do formulário final de contato
  const [isLeadFormStep, setIsLeadFormStep] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [travelDate, setTravelDate] = useState<string>("");
  const [paxCount, setPaxCount] = useState<string>("2");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // 4. Função de reset completo do quiz (na rota pública retorna para a introdução)
  const resetQuiz = useCallback(() => {
    setCurrentQuestionId(INITIAL_QUESTION_ID);
    setAnswers({});
    setHistory([INITIAL_QUESTION_ID]);
    setResult(null);
    setIsLeadFormStep(false);
    setName("");
    setPhone("");
    setEmail("");
    setTravelDate("");
    setPaxCount("2");
    setFormErrors({});
    if (showIntro) {
      setHasStarted(false);
    }
    scrollToQuizTop();
  }, [showIntro, scrollToQuizTop]);

  // Pergunta atual e derivados
  const currentQuestion =
    PLANNER_QUIZ_QUESTIONS[currentQuestionId] ?? PLANNER_QUIZ_QUESTIONS[INITIAL_QUESTION_ID];
  const selectedOptionId = answers[currentQuestionId] ?? null;
  const resultData = result ? PLANNER_QUIZ_RESULTS[result] : null;

  // Verifica se o usuário respondeu "Sim" para ter data na Pergunta 1
  const hasDateInMind = answers["q1"] === "p1_sim";

  // 5. Iniciar quiz a partir da tela de introdução
  const handleStartQuiz = () => {
    setHasStarted(true);
    scrollToQuizTop();
  };

  // 6. Seleção de opção com limpeza de ramificações incompatíveis
  const handleSelectOption = (optionId: string) => {
    const currentIndex = history.indexOf(currentQuestionId);
    const validHistory =
      currentIndex !== -1 ? history.slice(0, currentIndex + 1) : [currentQuestionId];

    const validQuestionIds = new Set(validHistory);
    const updatedAnswers: Record<string, string> = {};
    Object.entries(answers).forEach(([qId, ansId]) => {
      if (validQuestionIds.has(qId) && qId !== currentQuestionId) {
        updatedAnswers[qId] = ansId;
      }
    });

    updatedAnswers[currentQuestionId] = optionId;

    setAnswers(updatedAnswers);
    setHistory(validHistory);
    setResult(null);
    setIsLeadFormStep(false);
  };

  // 7. Avançar pergunta
  const handleNext = () => {
    if (!selectedOptionId) return;

    const chosenOption = currentQuestion.options.find((opt) => opt.id === selectedOptionId);
    if (!chosenOption) return;

    if (chosenOption.resultType) {
      setResult(chosenOption.resultType);
      setIsLeadFormStep(false);
      scrollToQuizTop();
    } else if (chosenOption.nextQuestionId && PLANNER_QUIZ_QUESTIONS[chosenOption.nextQuestionId]) {
      const nextId = chosenOption.nextQuestionId;
      setHistory((prev) => [...prev, nextId]);
      setCurrentQuestionId(nextId);
      scrollToQuizTop();
    }
  };

  // 8. Voltar pelo histórico real percorrido e pelo formulário
  const handleBack = () => {
    if (isLeadFormStep) {
      setIsLeadFormStep(false);
      scrollToQuizTop();
      return;
    }

    if (result !== null) {
      setResult(null);
      scrollToQuizTop();
      return;
    }

    if (history.length > 1) {
      const newHistory = history.slice(0, -1);
      const prevQuestionId = newHistory[newHistory.length - 1];
      setHistory(newHistory);
      setCurrentQuestionId(prevQuestionId);
      scrollToQuizTop();
    } else {
      // Estamos na primeira pergunta do fluxo (q1)
      if (showIntro && hasStarted) {
        setHasStarted(false);
        scrollToQuizTop();
      } else if (variant === "modal" && onClose) {
        onClose();
      }
    }
  };

  // 9. Formatação do WhatsApp
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    let formatted = "";
    if (raw.length === 0) {
      formatted = "";
    } else if (raw.length <= 2) {
      formatted = `(${raw}`;
    } else if (raw.length <= 6) {
      formatted = `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
    } else if (raw.length <= 10) {
      formatted = `(${raw.slice(0, 2)}) ${raw.slice(2, 6)}-${raw.slice(6)}`;
    } else if (raw.length <= 11) {
      formatted = `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`;
    } else {
      formatted = `+${raw.slice(0, 2)} ${raw.slice(2, 4)} ${raw.slice(4, 8)}-${raw.slice(8, 15)}`;
    }
    setPhone(formatted);
    if (formErrors.phone) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next.phone;
        return next;
      });
    }
  };

  // 10. Validação, montagem da mensagem e abertura do WhatsApp
  const handleWhatsAppSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!result) return;

    const errors: Record<string, string> = {};
    const trimmedName = name.trim();
    const cleanDigits = phone.replace(/\D/g, "");
    const trimmedEmail = email.trim();
    const trimmedDate = travelDate.trim();
    const numPax = parseInt(paxCount, 10);

    if (!trimmedName || trimmedName.length < 2) {
      errors.name = "Informe seu nome.";
    }

    if (!cleanDigits || cleanDigits.length < 10) {
      errors.phone = "Informe um WhatsApp válido.";
    }

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = "Informe um e-mail válido.";
    }

    if (hasDateInMind && !trimmedDate) {
      errors.travelDate = "Informe a data ou período pretendido.";
    }

    if (isNaN(numPax) || numPax < 1) {
      errors.paxCount = "Informe quantas pessoas viajam (mínimo 1).";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});

    const finalDate = trimmedDate || (hasDateInMind ? "Não informada" : "Ainda não definido");

    const answersList = history
      .map((qId) => {
        const question = PLANNER_QUIZ_QUESTIONS[qId];
        const answerId = answers[qId];
        const option = question?.options.find((opt) => opt.id === answerId);
        if (!question || !option) return null;
        return {
          questionId: qId,
          question: question.title,
          answerId: option.id,
          answer: option.text,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    const leadPayload: PlannerQuizLeadPayload = {
      nome: trimmedName,
      whatsapp: phone,
      email: trimmedEmail,
      dataPretendida: finalDate,
      pessoas: numPax,
      answers: answersList,
      resultId: result,
      resultLabel: getFriendlyResultName(result),
      source: source || "instagram",
      createdAt: new Date().toISOString(),
    };

    const message = buildWhatsAppMessage(leadPayload);

    const rawNumber = SITE_CONFIG.whatsapp?.replace(/\D/g, "");
    const targetNumber = rawNumber || "529981234567";

    const whatsappUrl = `https://wa.me/${targetNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  const stepLabel = `ETAPA ${history.length}`;
  const isLastQuestion =
    currentQuestion.options.find((opt) => opt.id === selectedOptionId)?.resultType !== undefined;
  const nextButtonText = isLastQuestion ? "VER RESULTADO" : "PRÓXIMA";

  const headerBadgeText = !result
    ? stepLabel
    : isLeadFormStep
    ? "QUASE LÁ"
    : "RECOMENDAÇÃO";

  // ETAPA 0: INTRODUÇÃO DA PÁGINA PÚBLICA (Opção preferencial Prompt 10)
  if (showIntro && !hasStarted) {
    return (
      <div ref={containerRef} className="tp-quiz-intro">
        <div className="tp-modal-header">
          <div className="tp-modal-step-badge">
            <span className="tp-modal-step-dot" />
            <span className="tp-modal-step-text">DESCUBRA SUA VIAGEM IDEAL</span>
          </div>
        </div>

        <div className="tp-modal-content">
          <p className="tp-modal-eyebrow">DESCUBRA SUA VIAGEM IDEAL</p>
          <h1 className="tp-modal-title" id={titleId}>
            Descubra qual caminho combina mais com a sua viagem ao México
          </h1>
          <p className="tp-modal-desc">
            Responda algumas perguntas rápidas e a gente te ajuda a encontrar o melhor ponto de partida.
          </p>

          <div className="tp-quiz-intro__features">
            <div className="tp-quiz-intro__feature">
              <span className="tp-quiz-intro__feature-icon" aria-hidden="true">⏱</span>
              <span>Leva menos de 1 minuto para responder</span>
            </div>
            <div className="tp-quiz-intro__feature">
              <span className="tp-quiz-intro__feature-icon" aria-hidden="true">🌴</span>
              <span>Passeios, Viagem Completa ou Curadoria Bella</span>
            </div>
            <div className="tp-quiz-intro__feature">
              <span className="tp-quiz-intro__feature-icon" aria-hidden="true">✨</span>
              <span>Recomendação personalizada para o seu estilo</span>
            </div>
          </div>

          <div className="tp-quiz-intro__action">
            <button
              type="button"
              className="button tp-quiz-intro__btn"
              onClick={handleStartQuiz}
            >
              COMEÇAR
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`tp-quiz-wrapper tp-quiz-wrapper--${variant}`}>
      {/* CABEÇALHO */}
      <div className="tp-modal-header">
        <div className="tp-modal-step-badge">
          <span className="tp-modal-step-dot" />
          <span className="tp-modal-step-text">{headerBadgeText}</span>
        </div>

        {/* Botão Fechar SOMENTE no modo modal */}
        {variant === "modal" && onClose && (
          <button
            type="button"
            className="tp-modal-close"
            onClick={onClose}
            aria-label="Fechar quiz"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M15 5L5 15M5 5L15 15"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>

      {/* CONTEÚDO */}
      {!result ? (
        /* ETAPAS DE PERGUNTAS */
        <div className="tp-modal-content">
          <p className="tp-modal-eyebrow">DESCUBRA SUA VIAGEM IDEAL</p>
          <h2 className="tp-modal-title" id={titleId}>
            {currentQuestion.title}
          </h2>

          {currentQuestion.description && (
            <p className="tp-modal-desc">{currentQuestion.description}</p>
          )}

          {/* OPÇÕES CLICÁVEIS */}
          <div className="tp-modal-options" role="radiogroup" aria-labelledby={titleId}>
            {currentQuestion.options.map((option) => {
              const isSelected = selectedOptionId === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`tp-modal-option ${isSelected ? "tp-modal-option--selected" : ""}`}
                  onClick={() => handleSelectOption(option.id)}
                >
                  <span className="tp-modal-option-indicator">
                    <span className="tp-modal-option-dot" />
                  </span>
                  <span className="tp-modal-option-body">
                    <span className="tp-modal-option-text">{option.text}</span>
                    {option.description && (
                      <span className="tp-modal-option-subtext">{option.description}</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {/* RODAPÉ COM AÇÕES */}
          <div className="tp-modal-footer">
            <button
              type="button"
              className="tp-modal-btn-back"
              onClick={handleBack}
            >
              ← Voltar
            </button>

            <button
              type="button"
              className={`tp-modal-btn-next ${selectedOptionId ? "tp-modal-btn-next--active" : ""}`}
              disabled={!selectedOptionId}
              onClick={handleNext}
            >
              {nextButtonText}
            </button>
          </div>
        </div>
      ) : !isLeadFormStep && resultData ? (
        /* ETAPA DE RESULTADO ESPECÍFICO */
        <div className="tp-modal-result">
          <div className="tp-modal-result__header">
            <p className="tp-modal-result__eyebrow">{resultData.eyebrow}</p>
            <h2 className="tp-modal-result__title" id={titleId}>
              {resultData.title}
            </h2>
            {resultData.subtitle && (
              <p className="tp-modal-result__subtitle">{resultData.subtitle}</p>
            )}
            <p className="tp-modal-result__explanation">{resultData.explanation}</p>
          </div>

          {/* Bloco de recomendação */}
          <div className="tp-modal-result__card">
            <h3 className="tp-modal-result__card-title">
              {resultData.recommendationTitle}
            </h3>
            <ul className="tp-modal-result__list">
              {resultData.recommendationHighlights.map((highlight, index) => (
                <li key={index} className="tp-modal-result__item">
                  <span className="tp-modal-result__item-bullet" aria-hidden="true">•</span>
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Ações / CTAs */}
          <div className="tp-modal-result__actions">
            <Link
              href={resultData.primaryCtaLink}
              onClick={() => {
                if (variant === "modal" && onClose) onClose();
              }}
              className="tp-modal-result__btn-primary"
            >
              {resultData.primaryCtaText}
            </Link>

            <button
              type="button"
              className="tp-modal-result__btn-secondary"
              onClick={() => {
                setIsLeadFormStep(true);
                scrollToQuizTop();
              }}
            >
              {resultData.secondaryCtaText}
            </button>
          </div>

          {/* Ferramentas inferiores: voltar e refazer */}
          <div className="tp-modal-result__footer-tools">
            <button
              type="button"
              className="tp-modal-result__tool-btn"
              onClick={handleBack}
            >
              ← Voltar à pergunta anterior
            </button>
            <button
              type="button"
              className="tp-modal-result__tool-btn"
              onClick={resetQuiz}
            >
              Refazer quiz
            </button>
          </div>
        </div>
      ) : isLeadFormStep && resultData ? (
        /* ETAPA FORMULÁRIO FINAL DE CONTATO */
        <form className="tp-modal-form" onSubmit={handleWhatsAppSubmit} noValidate>
          <div className="tp-modal-form__header">
            <p className="tp-modal-form__eyebrow">QUASE LÁ</p>
            <h2 className="tp-modal-form__title" id={titleId}>
              Vamos continuar sua viagem?
            </h2>
            <p className="tp-modal-form__text">
              Preencha seus dados para seguir com a equipe Tio Nenê pelo WhatsApp.
            </p>
          </div>

          {/* Resumo do caminho recomendado antes do envio */}
          <div className="tp-modal-form__summary">
            <div className="tp-modal-form__summary-left">
              <span className="tp-modal-form__summary-label">Seu caminho recomendado</span>
              <span className="tp-modal-form__summary-value">{getFriendlyResultName(result)}</span>
            </div>
            <span className="tp-modal-form__summary-badge">Personalizado</span>
          </div>

          <div className="tp-modal-form__grid">
            {/* Nome */}
            <div className="tp-modal-form__field tp-modal-form__field--full">
              <label htmlFor="tp-form-name" className="tp-modal-form__label">
                Nome *
              </label>
              <input
                id="tp-form-name"
                type="text"
                className={`tp-modal-form__input ${formErrors.name ? "tp-modal-form__input--error" : ""}`}
                placeholder="Como gostaria de ser chamado(a)?"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: "" }));
                }}
                autoComplete="name"
              />
              {formErrors.name && (
                <span className="tp-modal-form__error-msg">{formErrors.name}</span>
              )}
            </div>

            {/* WhatsApp */}
            <div className="tp-modal-form__field">
              <label htmlFor="tp-form-whatsapp" className="tp-modal-form__label">
                WhatsApp *
              </label>
              <input
                id="tp-form-whatsapp"
                type="tel"
                className={`tp-modal-form__input ${formErrors.phone ? "tp-modal-form__input--error" : ""}`}
                placeholder="(DDD) 99999-9999"
                value={phone}
                onChange={handlePhoneChange}
                autoComplete="tel"
              />
              {formErrors.phone && (
                <span className="tp-modal-form__error-msg">{formErrors.phone}</span>
              )}
            </div>

            {/* E-mail */}
            <div className="tp-modal-form__field">
              <label htmlFor="tp-form-email" className="tp-modal-form__label">
                E-mail *
              </label>
              <input
                id="tp-form-email"
                type="email"
                className={`tp-modal-form__input ${formErrors.email ? "tp-modal-form__input--error" : ""}`}
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: "" }));
                }}
                autoComplete="email"
              />
              {formErrors.email && (
                <span className="tp-modal-form__error-msg">{formErrors.email}</span>
              )}
            </div>

            {/* Data Pretendida */}
            <div className="tp-modal-form__field">
              <label htmlFor="tp-form-date" className="tp-modal-form__label">
                {hasDateInMind ? "Data ou período pretendido *" : "Quando imagina viajar? (Opcional)"}
              </label>
              <input
                id="tp-form-date"
                type="text"
                className={`tp-modal-form__input ${formErrors.travelDate ? "tp-modal-form__input--error" : ""}`}
                placeholder={hasDateInMind ? "Ex: Outubro/2026 ou 15 a 22/10" : "Ex: Final do ano, ou deixe em branco"}
                value={travelDate}
                onChange={(e) => {
                  setTravelDate(e.target.value);
                  if (formErrors.travelDate) setFormErrors((prev) => ({ ...prev, travelDate: "" }));
                }}
              />
              {formErrors.travelDate && (
                <span className="tp-modal-form__error-msg">{formErrors.travelDate}</span>
              )}
            </div>

            {/* Quantidade de pessoas */}
            <div className="tp-modal-form__field">
              <label htmlFor="tp-form-pax" className="tp-modal-form__label">
                Quantas pessoas viajam? *
              </label>
              <input
                id="tp-form-pax"
                type="number"
                min="1"
                className={`tp-modal-form__input ${formErrors.paxCount ? "tp-modal-form__input--error" : ""}`}
                placeholder="2"
                value={paxCount}
                onChange={(e) => {
                  setPaxCount(e.target.value);
                  if (formErrors.paxCount) setFormErrors((prev) => ({ ...prev, paxCount: "" }));
                }}
              />
              {formErrors.paxCount && (
                <span className="tp-modal-form__error-msg">{formErrors.paxCount}</span>
              )}
            </div>
          </div>

          {/* Ações e Envio */}
          <div className="tp-modal-form__actions">
            <button
              type="submit"
              className="tp-modal-form__btn-submit"
            >
              <svg className="tp-modal-form__whatsapp-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.539 1.772.82 2.791.82 3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.587-5.806-5.768-5.806zm3.374 8.232c-.143.402-.83.743-1.15.789-.319.046-.732.062-2.127-.487-1.396-.549-2.275-1.979-2.345-2.073-.07-.094-.564-.75-.564-1.428 0-.678.354-1.011.48-1.152.125-.141.274-.176.365-.176.091 0 .183.001.263.005.084.004.197-.032.308.234.114.274.388.948.423 1.018.034.07.057.153.011.246-.046.094-.069.153-.137.234-.069.082-.144.183-.206.246-.069.07-.14.146-.06.284.08.138.355.586.762.949.524.467.965.611 1.103.68.137.069.217.058.297-.034.08-.093.343-.4.434-.537.092-.138.183-.115.309-.069.126.046.799.377.936.446.137.069.229.103.263.161.034.057.034.331-.109.733z" />
              </svg>
              CONTINUAR PELO WHATSAPP
            </button>
            <p className="tp-modal-form__privacy-note">
              Ao continuar, você inicia o atendimento com a equipe Tio Nenê pelo WhatsApp.
            </p>
          </div>

          {/* Rodapé com botão Voltar ao Resultado */}
          <div className="tp-modal-form__footer-tools">
            <button
              type="button"
              className="tp-modal-form__btn-back"
              onClick={handleBack}
            >
              ← Voltar ao resultado
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
