/**
 * Configuração central e tipos do Quiz "Descubra sua viagem ideal"
 *
 * Estrutura não-linear / ramificada com 5 perguntas reais e 5 destinos comerciais:
 * - Pacote de Passeios (TOUR_PACKAGE)
 * - Passeios Avulsos (INDIVIDUAL_TOURS)
 * - Viagem Completa — pacote pronto (COMPLETE_TRIP_PACKAGE)
 * - Viagem Completa — personalizada (COMPLETE_TRIP_CUSTOM)
 * - Curadoria Bella (BELLA_CURATION)
 */

// 1. Identificadores internos dos tipos de resultado
export type PlannerQuizResultType =
  | "TOUR_PACKAGE"            // Pacote de Passeios
  | "INDIVIDUAL_TOURS"         // Passeios Avulsos
  | "COMPLETE_TRIP_PACKAGE"    // Viagem Completa — pacote pronto
  | "COMPLETE_TRIP_CUSTOM"     // Viagem Completa — personalizada
  | "BELLA_CURATION";          // Curadoria Bella

// 2. Metadados e conteúdo editorial de cada resultado (Item 22)
export interface PlannerQuizResultDetails {
  id: PlannerQuizResultType;
  eyebrow: string;
  title: string;
  subtitle?: string;
  explanation: string;
  recommendationTitle: string;
  recommendationHighlights: string[];
  primaryCtaText: string;
  primaryCtaLink: string;
  secondaryCtaText: string;
}

export const PLANNER_QUIZ_RESULTS: Record<PlannerQuizResultType, PlannerQuizResultDetails> = {
  TOUR_PACKAGE: {
    id: "TOUR_PACKAGE",
    eyebrow: "SEU MELHOR CAMINHO",
    title: "Pacote de Passeios",
    subtitle: "Praticidade e os melhores dias combinados.",
    explanation:
      "Como você já tem os detalhes essenciais da viagem encaminhados e busca praticidade, a melhor escolha é um pacote estruturado. Selecionamos as experiências mais marcantes de Cancún e Riviera Maya em um ritmo inteligente e com o melhor custo-benefício.",
    recommendationTitle: "O que torna esse caminho ideal para você:",
    recommendationHighlights: [
      "Roteiro testado que aproveita cada dia no tempo certo, sem correria",
      "Passeios consolidados com guias experientes e transporte seguro",
      "Mais conveniência e economia do que contratar cada item separadamente",
    ],
    primaryCtaText: "CONHECER PACOTES DE PASSEIOS",
    primaryCtaLink: "/passeios#pacotes",
    secondaryCtaText: "QUERO SEGUIR COM ESSA VIAGEM",
  },

  INDIVIDUAL_TOURS: {
    id: "INDIVIDUAL_TOURS",
    eyebrow: "SEU MELHOR CAMINHO",
    title: "Passeios Avulsos",
    subtitle: "Total liberdade para montar o seu próprio ritmo.",
    explanation:
      "Com a viagem já organizada, você prefere decidir experiência por experiência sem se prender a uma programação fixa. Nosso catálogo completo permite que você escolha exatamente o que deseja viver, nos dias que fizerem mais sentido para você.",
    recommendationTitle: "Vantagens de escolher avulso:",
    recommendationHighlights: [
      "Flexibilidade para intercalar dias de passeio e dias livres de praia",
      "Acesso completo ao nosso catálogo de ilhas, cenotes, parques e ruínas",
      "Orientação local da nossa equipe para reservar no momento ideal",
    ],
    primaryCtaText: "VER PASSEIOS",
    primaryCtaLink: "/passeios",
    secondaryCtaText: "QUERO SEGUIR COM ESSA VIAGEM",
  },

  COMPLETE_TRIP_PACKAGE: {
    id: "COMPLETE_TRIP_PACKAGE",
    eyebrow: "SEU MELHOR CAMINHO",
    title: "Viagem Completa",
    subtitle: "Um roteiro pronto para você só aproveitar.",
    explanation:
      "Para quem deseja viajar sem o estresse de pesquisar e conectar hotéis, traslados e passeios por conta própria. Criamos viagens estruturadas onde cada detalhe é coordenado previamente, garantindo segurança e tranquilidade do desembarque ao retorno.",
    recommendationTitle: "O que está incluído nesse formato:",
    recommendationHighlights: [
      "Hospedagem selecionada nos melhores hotéis e resorts da região",
      "Traslados privativos e passeios integrados com logística perfeita",
      "Menos decisões e zero preocupação: tudo pronto para o seu embarque",
    ],
    primaryCtaText: "CONHECER VIAGEM COMPLETA",
    primaryCtaLink: "/viagem-completa",
    secondaryCtaText: "QUERO SEGUIR COM ESSA VIAGEM",
  },

  COMPLETE_TRIP_CUSTOM: {
    id: "COMPLETE_TRIP_CUSTOM",
    eyebrow: "SEU MELHOR CAMINHO",
    title: "Viagem Completa Personalizada",
    subtitle: "Uma viagem desenhada exclusivamente para você.",
    explanation:
      "Você busca um planejamento sob medida, com escolhas bem pensadas e atenção aos detalhes que fazem sentido para o seu grupo. Desenvolvemos uma proposta exclusiva, alinhando suas preferências de hospedagem, ritmo de viagem e experiências autorais sob demanda.",
    recommendationTitle: "Como funciona a viagem sob medida:",
    recommendationHighlights: [
      "Consultoria individual para desenhar cada dia de acordo com o seu perfil",
      "Curadoria de hotéis, transporte exclusivo e horários que respeitam seu tempo",
      "Ajuste fino de experiências sem seguir nenhum modelo padrão engessado",
    ],
    primaryCtaText: "CONHECER VIAGEM COMPLETA",
    primaryCtaLink: "/viagem-completa",
    secondaryCtaText: "QUERO SEGUIR COM ESSA VIAGEM",
  },

  BELLA_CURATION: {
    id: "BELLA_CURATION",
    eyebrow: "SEU MELHOR CAMINHO",
    title: "Curadoria Bella",
    subtitle: "Viagens autorais para quem procura o fora do óbvio.",
    explanation:
      "Para viajantes que buscam vivências singulares, gastronomia memorável, refúgios de charme e uma imersão autêntica no México contemporâneo. A consultoria autoral da Bella desenha jornadas com olhar sensível, profundo conhecimento local e relações próximas com os melhores anfitriões do país.",
    recommendationTitle: "A essência da Curadoria Bella:",
    recommendationHighlights: [
      "Acesso a recantos secretos, hotelaria boutique e experiências fora do circuito comercial",
      "Roteiro autoral costurado pessoalmente pela Bella com base em mais de 10 anos no México",
      "Acompanhamento próximo e discreto antes e durante a sua estadia",
    ],
    primaryCtaText: "CONHECER A CURADORIA BELLA",
    primaryCtaLink: "/curadoria-bella",
    secondaryCtaText: "QUERO SEGUIR COM ESSA VIAGEM",
  },
};

// 3. Opção de resposta com ramificação
export interface PlannerQuizOption {
  id: string;
  text: string;
  description?: string;
  nextQuestionId?: string;           // Próxima pergunta condicional
  resultType?: PlannerQuizResultType; // Destino comercial identificado
}

// 4. Pergunta do Quiz
export interface PlannerQuizQuestion {
  id: string;
  eyebrow?: string;
  title: string;
  description?: string;
  options: PlannerQuizOption[];
}

// 5. Pergunta inicial do fluxo
export const INITIAL_QUESTION_ID = "q1";

// 6. Estrutura das 5 perguntas reais e suas ramificações condicionais
export const PLANNER_QUIZ_QUESTIONS: Record<string, PlannerQuizQuestion> = {
  // =========================================================================
  // PERGUNTA 1: DATA DA VIAGEM
  // Não define resultado. Alimenta intenção de data e segue para Pergunta 2.
  // =========================================================================
  q1: {
    id: "q1",
    title: "Você já tem uma data em mente pra viajar?",
    options: [
      {
        id: "p1_sim",
        text: "Sim",
        nextQuestionId: "q2",
      },
      {
        id: "p1_nao",
        text: "Ainda não",
        nextQuestionId: "q2",
      },
    ],
  },

  // =========================================================================
  // PERGUNTA 2: STATUS DO PLANEJAMENTO
  // A → Pergunta 3
  // B, C, D → Pergunta 4
  // =========================================================================
  q2: {
    id: "q2",
    title: "O que você já tem organizado até agora?",
    options: [
      {
        id: "p2_a",
        text: "Já tenho tudo, só preciso de passeios",
        nextQuestionId: "q3",
      },
      {
        id: "p2_b",
        text: "Tenho só a passagem, falta o resto",
        nextQuestionId: "q4",
      },
      {
        id: "p2_c",
        text: "Não tenho nada ainda",
        nextQuestionId: "q4",
      },
      {
        id: "p2_d",
        text: "Já conheço esse destino e busco algo diferente do que já vivi",
        nextQuestionId: "q4",
      },
    ],
  },

  // =========================================================================
  // PERGUNTA 3: FORMATO DOS PASSEIOS
  // Aparece SOMENTE se Pergunta 2 = A.
  // A → TOUR_PACKAGE
  // B → INDIVIDUAL_TOURS
  // =========================================================================
  q3: {
    id: "q3",
    title: "Prefere que a gente já sugira um pacote pronto de passeios, ou monta você mesmo, escolhendo um a um?",
    options: [
      {
        id: "p3_a",
        text: "Pacote pronto",
        resultType: "TOUR_PACKAGE",
      },
      {
        id: "p3_b",
        text: "Escolher um a um",
        resultType: "INDIVIDUAL_TOURS",
      },
    ],
  },

  // =========================================================================
  // PERGUNTA 4: COMO IMAGINA ESSA VIAGEM
  // Aparece SOMENTE se Pergunta 2 = B, C ou D.
  // A → COMPLETE_TRIP_PACKAGE
  // B, C → Pergunta 5
  // =========================================================================
  q4: {
    id: "q4",
    title: "Como você imagina essa viagem?",
    options: [
      {
        id: "p4_a",
        text: "Prática — um roteiro pronto, redondo, sem muita decisão",
        resultType: "COMPLETE_TRIP_PACKAGE",
      },
      {
        id: "p4_b",
        text: "Pensada especialmente pra mim, sem seguir um modelo padrão",
        nextQuestionId: "q5",
      },
      {
        id: "p4_c",
        text: "Uma experiência bem fora do comum, guiada por quem conhece o destino de verdade",
        nextQuestionId: "q5",
      },
    ],
  },

  // =========================================================================
  // PERGUNTA 5: O QUE MAIS COMBINA
  // Aparece SOMENTE se Pergunta 4 = B ou C (ou caminho P2=D que chegou aqui).
  // A → COMPLETE_TRIP_CUSTOM
  // B → BELLA_CURATION
  // =========================================================================
  q5: {
    id: "q5",
    title: "O que mais combina com você nessa viagem?",
    options: [
      {
        id: "p5_a",
        text: "Aproveitar bem, com boas escolhas, sem gastar além da conta",
        resultType: "COMPLETE_TRIP_CUSTOM",
      },
      {
        id: "p5_b",
        text: "Quero o melhor possível — não estou preocupado(a) com o valor, quero algo inesquecível",
        resultType: "BELLA_CURATION",
      },
    ],
  },
};

// =========================================================================
// 7. NOME AMIGÁVEL DO RESULTADO COMERCIAL (Item 18)
// =========================================================================
export function getFriendlyResultName(result: PlannerQuizResultType): string {
  switch (result) {
    case "TOUR_PACKAGE":
      return "Pacote de Passeios";
    case "INDIVIDUAL_TOURS":
      return "Passeios Avulsos";
    case "COMPLETE_TRIP_PACKAGE":
      return "Viagem Completa — pacote pronto";
    case "COMPLETE_TRIP_CUSTOM":
      return "Viagem Completa — personalizada";
    case "BELLA_CURATION":
      return "Curadoria Bella";
    default:
      return result;
  }
}

// =========================================================================
// 8. ESTRUTURA DO PAYLOAD DE LEAD PARA CRM FUTURO (Itens 29 e 30)
// =========================================================================
export interface PlannerQuizLeadAnswerItem {
  questionId: string;
  question: string;
  answerId: string;
  answer: string;
}

export interface PlannerQuizLeadPayload {
  nome: string;
  whatsapp: string;
  email: string;
  dataPretendida: string;
  pessoas: number;
  answers: PlannerQuizLeadAnswerItem[];
  resultId: PlannerQuizResultType;
  resultLabel: string;
  source: string;
  createdAt: string;
}

// =========================================================================
// 9. NOME AMIGÁVEL DA ORIGEM DO LEAD (Prompt 5, Itens 12 e 14)
// =========================================================================
export function getFriendlySourceName(source?: string): string {
  if (!source) return "Home";
  switch (source.toLowerCase()) {
    case "home":
    case "home-quiz":
      return "Home";
    case "passeios":
      return "Página de Passeios";
    case "viagem-completa":
      return "Viagem Completa";
    case "curadoria-bella":
      return "Curadoria Bella";
    case "instagram":
    case "bio":
      return "Instagram";
    case "public-quiz":
    case "descubra-sua-viagem":
      return "Instagram";
    default:
      return source.charAt(0).toUpperCase() + source.slice(1);
  }
}

// =========================================================================
// 10. MONTAGEM DA MENSAGEM DO WHATSAPP (Prompt 4 + Prompt 5)
// =========================================================================
export function buildWhatsAppMessage(payload: PlannerQuizLeadPayload): string {
  const originLabel = getFriendlySourceName(payload.source);

  const lines: string[] = [
    "Olá, equipe Tio Nenê! Acabei de responder ao quiz “Descubra sua viagem ideal”.",
    "",
    `Nome: ${payload.nome}`,
    `E-mail: ${payload.email}`,
    `WhatsApp: ${payload.whatsapp}`,
    `Data pretendida: ${payload.dataPretendida}`,
    `Pessoas: ${payload.pessoas}`,
    `Origem: ${originLabel}`,
    "",
    `Resultado: ${payload.resultLabel}`,
    "",
    "Respostas:",
  ];

  payload.answers.forEach((item) => {
    lines.push(`• ${item.question}`);
    lines.push(`  Resposta: ${item.answer}`);
    lines.push("");
  });

  return lines.join("\n").trim();
}


