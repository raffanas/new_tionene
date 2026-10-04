"use client";

import React, { useState, useEffect, useCallback, useId } from "react";
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
  const titleId = useId();

  // 1. Estado da navegação não-linear e respostas
  const [currentQuestionId, setCurrentQuestionId] = useState<string>(INITIAL_QUESTION_ID);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<string[]>([INITIAL_QUESTION_ID]);
  const [result, setResult] = useState<PlannerQuizResultType | null>(null);

  // 2. Estado do formulário final de contato (Prompt 4)
  const [isLeadFormStep, setIsLeadFormStep] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [travelDate, setTravelDate] = useState<string>("");
  const [paxCount, setPaxCount] = useState<string>("2");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // 3. Função de reset completo do quiz (Item 26)
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
  }, []);

  // 4. Ao fechar o modal
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // 5. Bloqueio de scroll da página (Item 20)
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // 6. Fechamento por tecla ESC (Item 21)
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

  // Pergunta atual e derivados
  const currentQuestion = PLANNER_QUIZ_QUESTIONS[currentQuestionId] ?? PLANNER_QUIZ_QUESTIONS[INITIAL_QUESTION_ID];
  const selectedOptionId = answers[currentQuestionId] ?? null;
  const resultData = result ? PLANNER_QUIZ_RESULTS[result] : null;

  // Verifica se o usuário respondeu "Sim" para ter data na Pergunta 1 (Item 6)
  const hasDateInMind = answers["q1"] === "p1_sim";

  // 7. Seleção de opção com limpeza de ramificações incompatíveis (Item 10)
  const handleSelectOption = (optionId: string) => {
    const currentIndex = history.indexOf(currentQuestionId);
    const validHistory = currentIndex !== -1 ? history.slice(0, currentIndex + 1) : [currentQuestionId];

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

  // 8. Avançar pergunta
  const handleNext = () => {
    if (!selectedOptionId) return;

    const chosenOption = currentQuestion.options.find((opt) => opt.id === selectedOptionId);
    if (!chosenOption) return;

    if (chosenOption.resultType) {
      setResult(chosenOption.resultType);
      setIsLeadFormStep(false);
    } else if (chosenOption.nextQuestionId && PLANNER_QUIZ_QUESTIONS[chosenOption.nextQuestionId]) {
      const nextId = chosenOption.nextQuestionId;
      setHistory((prev) => [...prev, nextId]);
      setCurrentQuestionId(nextId);
    }
  };

  // 9. Voltar pelo histórico real percorrido e pelo formulário (Item 25)
  const handleBack = () => {
    if (isLeadFormStep) {
      // Se estiver no formulário final, volta para a tela de resultado (Item 25)
      setIsLeadFormStep(false);
      return;
    }

    if (result !== null) {
      // Se estiver na tela de resultado, volta para a última pergunta
      setResult(null);
      return;
    }

    if (history.length > 1) {
      const newHistory = history.slice(0, -1);
      const prevQuestionId = newHistory[newHistory.length - 1];
      setHistory(newHistory);
      setCurrentQuestionId(prevQuestionId);
    } else {
      handleClose();
    }
  };

  // 10. Formatação do WhatsApp (Item 4)
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

  // 11. Validação, montagem da mensagem e abertura do WhatsApp (Itens 14, 16, 19, 20)
  const handleWhatsAppSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!result) return;

    const errors: Record<string, string> = {};
    const trimmedName = name.trim();
    const cleanDigits = phone.replace(/\D/g, "");
    const trimmedEmail = email.trim();
    const trimmedDate = travelDate.trim();
    const numPax = parseInt(paxCount, 10);

    // Validação Nome (Item 3)
    if (!trimmedName || trimmedName.length < 2) {
      errors.name = "Informe seu nome.";
    }

    // Validação WhatsApp (Item 4)
    if (!cleanDigits || cleanDigits.length < 10) {
      errors.phone = "Informe um WhatsApp válido.";
    }

    // Validação E-mail (Item 5)
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = "Informe um e-mail válido.";
    }

    // Validação Data Pretendida (Item 6)
    if (hasDateInMind && !trimmedDate) {
      errors.travelDate = "Informe a data ou período pretendido.";
    }

    // Validação Quantidade de Pessoas (Item 7)
    if (isNaN(numPax) || numPax < 1) {
      errors.paxCount = "Informe quantas pessoas viajam (mínimo 1).";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});

    // Determina a data amigável (Item 6)
    const finalDate = trimmedDate || (hasDateInMind ? "Não informada" : "Ainda não definido");

    // Monta respostas apenas das perguntas realmente visitadas pelo histórico (Item 17)
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

    // Objeto estruturado preparado para CRM futuro (Itens 28, 29 e 30)
    const leadPayload: PlannerQuizLeadPayload = {
      nome: trimmedName,
      whatsapp: phone,
      email: trimmedEmail,
      dataPretendida: finalDate,
      pessoas: numPax,
      answers: answersList,
      resultId: result,
      resultLabel: getFriendlyResultName(result),
      source: source || "home",
      createdAt: new Date().toISOString(),
    };

    // Monta a mensagem estruturada para WhatsApp (Itens 16, 17, 18)
    const message = buildWhatsAppMessage(leadPayload);

    // Obtém número de WhatsApp configurado no projeto (Item 15)
    const rawNumber = SITE_CONFIG.whatsapp?.replace(/\D/g, "");
    const targetNumber = rawNumber || "529981234567";

    const whatsappUrl = `https://wa.me/${targetNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  if (!isOpen) return null;

  const stepLabel = `ETAPA ${history.length}`;
  const isLastQuestion = currentQuestion.options.find((opt) => opt.id === selectedOptionId)?.resultType !== undefined;
  const nextButtonText = isLastQuestion ? "VER RESULTADO" : "PRÓXIMA";

  const headerBadgeText = !result
    ? stepLabel
    : isLeadFormStep
    ? "QUASE LÁ"
    : "RECOMENDAÇÃO";

  return (
    <div
      className="tp-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={handleClose}
    >
      <div
        className="tp-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CABEÇALHO DO MODAL */}
        <div className="tp-modal-header">
          <div className="tp-modal-step-badge">
            <span className="tp-modal-step-dot" />
            <span className="tp-modal-step-text">{headerBadgeText}</span>
          </div>

          <button
            type="button"
            className="tp-modal-close"
            onClick={handleClose}
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
        </div>

        {/* CONTEÚDO */}
        {!result ? (
          /* ETAPA 1 A N: PERGUNTAS DO QUIZ */
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
          /* ETAPA DE RESULTADO ESPECÍFICO (Prompt 3) */
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
                onClick={handleClose}
                className="tp-modal-result__btn-primary"
              >
                {resultData.primaryCtaText}
              </Link>

              <button
                type="button"
                className="tp-modal-result__btn-secondary"
                onClick={() => setIsLeadFormStep(true)}
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
          /* ETAPA FORMULÁRIO FINAL DE CONTATO (Prompt 4) */
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

            {/* Resumo do caminho recomendado antes do envio (Item 13) */}
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

              {/* Data Pretendida (condicionada à resposta da P1 - Item 6) */}
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

              {/* Quantidade de pessoas (Item 7) */}
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

            {/* Ações e Envio (Item 14, 20 e 22) */}
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

            {/* Rodapé com botão Voltar ao Resultado (Item 25) */}
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
    </div>
  );
}
