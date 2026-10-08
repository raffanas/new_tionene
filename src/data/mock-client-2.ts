/**
 * Dados Mock para a Nova Página do Cliente (/cliente2)
 * Cliente: Isabella
 * Destino: Cancún, México
 */

export interface Client2Info {
  name: string;
  greetingTitle: string;
  destination: string;
  period: string;
  travelers: string;
  hotel: string;
  status: string;
  bookingCode?: string;
  travelerType?: string;
}

export interface Client2TourSchedule {
  hotelDeparture?: string;
  pickupWindow?: string;
  parkArrival?: string;
  returnTime?: string;
  hotelReturn?: string;
  scheduleAlert?: string;
}

export interface Client2TourMeeting {
  location?: string;
  orientation?: string;
  mapUrl?: string;
}

export interface Client2Tour {
  id: string;
  slug: string;
  name: string;
  image: string;
  date: string;
  time: string;
  duration: string;
  meetingPoint: string;
  status: "Confirmado" | "Agendado";
  badge?: string;
  travelers?: string;
  shortDescription: string;
  detailsUrl: string;
  schedule?: Client2TourSchedule;
  meeting?: Client2TourMeeting;
  included?: string[];
  notIncluded?: string[];
  extraFees?: string;
  whatToBring?: string[];
  whatNotToBring?: string[];
  recommendations?: string[];
  importantInfo?: string[];
}

export interface Client2TripSummaryData {
  arrivalDate: string;
  arrivalWeekday?: string;
  departureDate: string;
  departureWeekday?: string;
  duration?: string;
  destinationCity?: string;
  hotel: string;
  travelers: string;
  travelersSub?: string;
  roomType?: string;
  bookingCode?: string;
  bookingNotes: string;
  localConcierge: string;
}

export interface Client2TimelineItem {
  id: string;
  dayLabel: string;
  date: string;
  weekday: string;
  time?: string;
  type: "chegada" | "passeio" | "livre" | "retorno";
  title: string;
  description: string;
}

export interface Client2PageData {
  client: Client2Info;
  tours: Client2Tour[];
  summary: Client2TripSummaryData;
  timeline: Client2TimelineItem[];
}

export const MOCK_CLIENT_2_DATA: Client2PageData = {
  client: {
    name: "Isabelle",
    greetingTitle: "Isabelle, essa é a sua programação de viagem",
    destination: "Cancún, México",
    period: "21 a 28 de julho de 2027",
    travelers: "2 adultos + 1 criança",
    hotel: "Grand Fiesta Americana Coral Beach Cancún",
    status: "Viagem Confirmada",
    bookingCode: "GASHHA4556",
    travelerType: "cliente tio nenê",
  },

  summary: {
    arrivalDate: "21/07/2027",
    arrivalWeekday: "(quarta-feira)",
    departureDate: "28/07/2027",
    departureWeekday: "(quarta-feira)",
    duration: "7 noites / 8 dias",
    destinationCity: "Cancún",
    hotel: "Grand Fiesta Americana Coral Beach",
    travelers: "2 adultos",
    travelersSub: "1 criança",
    roomType: "Suíte Familiar com Vista para o Mar",
    bookingCode: "GASHHA4556",
    bookingNotes:
      "Transfer privativo de chegada e retorno já confirmado com receptivo exclusivo no aeroporto de Cancún (cadeirinha infantil inclusa). Suporte local e concierge em português à disposição todos os dias.",
    localConcierge: "Equipe Tio Nenê Cancún",
  },

  tours: [
    {
      id: "tour-xcaret",
      slug: "xcaret",
      name: "Xcaret",
      image: "/passeios/xcaret.jpg",
      date: "28 de julho de 2027 (terça-feira)",
      time: "08:00",
      duration: "Dia todo",
      meetingPoint: "Lobby principal do hotel",
      status: "Confirmado",
      badge: "incluso",
      travelers: "2 adultos",
      shortDescription:
        "Rios subterrâneos, aquário de corais e espetáculo noturno México Espectacular com mais de 50 atrações culturais.",
      detailsUrl: "/passeios/xcaret",
      schedule: {
        hotelDeparture: "07h10",
        pickupWindow: "entre 07h00 e 07h20",
        parkArrival: "09h00",
        returnTime: "após o espetáculo noturno",
        hotelReturn: "23h30 aproximadamente",
        scheduleAlert:
          "Os horários podem sofrer pequenos ajustes. Confirmaremos o horário exato da sua busca até 1 dia antes do passeio.",
      },
      meeting: {
        location: "Lobby principal do hotel",
        orientation: "esteja no local 10 minutos antes do horário marcado.",
        mapUrl: "https://maps.google.com/?q=Grand+Fiesta+Americana+Coral+Beach+Cancun",
      },
      included: [
        "Transporte de ida e volta",
        "Entrada no parque",
        "Almoço e bebidas (conforme ingresso)",
        "Armários, snorkel e boias",
        "Atividades aquáticas",
        "Espetáculo México Espectacular",
      ],
      notIncluded: [
        "Transporte de ida e volta não oficial",
        "Fotos profissionais no parque",
        "Atividades opcionais com golfinhos / Sea Trek",
        "Bebidas alcoólicas fora do almoço buffet",
        "Despesas pessoais e souvenirs",
        "Gorjetas voluntárias para guias e motoristas",
      ],
      extraFees:
        "Taxa ambiental não inclusa: MXN $33 por pessoa (sujeito a alteração). Pagamento no local: dinheiro ou cartão.",
      whatToBring: [
        "Roupa de banho",
        "Toalha",
        "Troca de roupa",
        "Protetor solar biodegradável",
        "Documento com foto",
        "Cartão de crédito ou dinheiro para extras",
      ],
      whatNotToBring: [
        "Objetos de valor",
        "Grandes quantias em dinheiro",
        "Equipamentos que não possam molhar",
        "Protetor solar comum (não permitido)",
      ],
      recommendations: [
        "Chegue já com a roupa de banho por baixo da roupa e leve uma troca leve para a noite.",
        "O parque é grande, então priorize as atrações que mais combinam com você.",
        "Reserve energia para o espetáculo final — é imperdível!",
        "Almoce entre 13h e 15h para evitar filas e aproveitar melhor o dia.",
      ],
      importantInfo: [
        "Crianças de 0 a 4 anos não pagam (mediante documento).",
        "Algumas atividades possuem restrição de altura e peso.",
        "Não recomendado para gestantes acima de 6 meses.",
        "Cancelamentos com até 48h de antecedência terão reembolso conforme política.",
        "Em caso de chuva, o parque funciona normalmente.",
      ],
    },
    {
      id: "tour-isla-mujeres",
      slug: "isla-mujeres",
      name: "Isla Mujeres em Catamarã",
      image: "/passeios/isla-mujeres.jpg",
      date: "24 de julho de 2027 (quinta-feira)",
      time: "08:30",
      duration: "Aprox. 7 horas",
      meetingPoint: "Marina Chac Chi ou recepção",
      status: "Confirmado",
      badge: "incluso",
      travelers: "2 adultos",
      shortDescription:
        "Navegação em catamarã exclusivo pelas águas cristalinas do mar caribenho com parada para snorkel e almoço em clube privativo.",
      detailsUrl: "/passeios/isla-mujeres",
      schedule: {
        hotelDeparture: "08h00",
        pickupWindow: "entre 07h45 e 08h15",
        parkArrival: "09h00 (embarque)",
        returnTime: "16h30",
        hotelReturn: "17h30 aproximadamente",
        scheduleAlert:
          "Os horários podem sofrer pequenos ajustes de acordo com as condições de navegação da capitania dos portos.",
      },
      meeting: {
        location: "Lobby do Grand Fiesta Americana ou Marina Chac Chi",
        orientation: "esteja pronto no lobby 15 minutos antes do horário.",
        mapUrl: "https://maps.google.com/?q=Marina+Chac+Chi+Cancun",
      },
      included: [
        "Transporte de ida e volta hotel/marina",
        "Passeio em catamarã exclusivo com open bar",
        "Equipamento completo de snorkel",
        "Almoço buffet em clube de praia privado",
        "Tempo livre no centro de Isla Mujeres",
        "Guia bilíngue durante toda a navegação",
      ],
      notIncluded: [
        "Taxa de cais e preservação marinha (aprox. US$ 20 por pessoa)",
        "Aluguel de carrinho de golfe na ilha",
        "Fotos profissionais",
        "Despesas pessoais e gorjetas",
      ],
      extraFees:
        "Taxa de cais e parque marinho: USD $20 por pessoa (pago diretamente no check-in da marina em espécie ou cartão).",
      whatToBring: [
        "Roupa de banho",
        "Toalha de praia",
        "Óculos de sol e chapéu/boné",
        "Capa impermeável para celular",
        "Dinheiro em espécie (dólar ou peso) para aluguel de carrinho",
      ],
      whatNotToBring: [
        "Joias e relógios caros",
        "Passaporte original (leve cópia digital)",
        "Eletrônicos volumosos",
        "Protetores solares químicos não biodegradáveis",
      ],
      recommendations: [
        "Alugue um carrinho de golfe para dar a volta completa na ilha e visitar a ponta sul (Punta Sur).",
        "Tome o café da manhã antes do embarque para aproveitar bem as atividades no mar.",
        "Aproveite as águas rasas e calmas de Playa Norte no final da tarde.",
      ],
      importantInfo: [
        "A atividade de snorkel é voluntária e acompanhada por instrutores credenciados.",
        "Em caso de fechamento do porto por condições climáticas, o passeio será reagendado.",
        "Crianças devem estar sempre acompanhadas por responsáveis.",
      ],
    },
    {
      id: "tour-chichen-itza",
      slug: "chichen-itza",
      name: "Chichén Itzá Privativo & Cenote",
      image: "/passeios/chichen-itza.jpg",
      date: "26 de julho de 2027 (sábado)",
      time: "07:00",
      duration: "Dia todo",
      meetingPoint: "Lobby principal do hotel",
      status: "Confirmado",
      badge: "incluso",
      travelers: "2 adultos",
      shortDescription:
        "Explore a mística pirâmide maia com guia historiador privativo e banho nas águas cristalinas do cenote sagrado.",
      detailsUrl: "/passeios/chichen-itza",
      schedule: {
        hotelDeparture: "06h50",
        pickupWindow: "entre 06h40 e 07h00",
        parkArrival: "09h30 (Chichén Itzá)",
        returnTime: "16h00 (saída do cenote)",
        hotelReturn: "18h30 aproximadamente",
        scheduleAlert:
          "Saída matinal programada para garantir entrada antecipada no sítio arqueológico com temperatura agradável e sem multidões.",
      },
      meeting: {
        location: "Lobby principal do resort",
        orientation: "o motorista privativo aguardará na recepção com placa nominal.",
        mapUrl: "https://maps.google.com/?q=Chichen+Itza",
      },
      included: [
        "Van privativa executiva com ar-condicionado e bebidas geladas",
        "Guia historiador arqueológico credenciado",
        "Ingressos e acessos sem fila a Chichén Itzá",
        "Acesso e banho no Cenote Sagrado Ik Kil",
        "Almoço buffet tradicional yucateco",
      ],
      notIncluded: [
        "Taxa do governo de Yucatán para câmeras profissionais/GoPro",
        "Colete salva-vidas opcional ou armário no cenote (aprox. MXN $50)",
        "Bebidas alcoólicas no almoço",
        "Gorjetas",
      ],
      extraFees:
        "Taxa governamental para equipamentos de filmagem profissional no sítio arqueológico (celulares são gratuitos).",
      whatToBring: [
        "Tênis ou calçado confortável para caminhada",
        "Roupas leves de algodão ou linho",
        "Roupa de banho e toalha para o cenote",
        "Chapéu, óculos de sol e sombrinha",
        "Repelente biodegradável",
      ],
      whatNotToBring: [
        "Drones (proibidos por lei em zonas arqueológicas federais)",
        "Bolsas muito grandes ou malas",
        "Objetos cortantes ou inflamáveis",
      ],
      recommendations: [
        "Leve uma garrafa térmica de água para a caminhada pelas ruínas maias.",
        "Não deixe de nadar no cenote Ik Kil para se refrescar após a visita histórica.",
        "Experimente a autêntica cochinita pibil no almoço típico regional.",
      ],
      importantInfo: [
        "Sítio arqueológico acessível com caminhos planos, mas com sol direto.",
        "Recomendado uso de protetor solar biodegradável para proteger as águas do cenote.",
        "Guia à disposição para fotos e esclarecimento de curiosidades históricas.",
      ],
    },
  ],

  timeline: [
    {
      id: "day-1",
      dayLabel: "Dia 01",
      date: "14/11/2026",
      weekday: "Sábado",
      time: "14:30",
      type: "chegada",
      title: "Boas-vindas a Cancún & Check-in",
      description:
        "Receptivo privativo no aeroporto internacional de Cancún com placa nominal, transfer confortável até o hotel e acomodação no Grand Fiesta Americana Coral Beach.",
    },
    {
      id: "day-2",
      dayLabel: "Dia 02",
      date: "15/11/2026",
      weekday: "Domingo",
      time: "Livre",
      type: "livre",
      title: "Aclimatação & Praias de Cancún",
      description:
        "Dia tranquilo para descansar da viagem, curtir a praia de águas calmas em frente ao resort e desfrutar das piscinas com a família.",
    },
    {
      id: "day-3",
      dayLabel: "Dia 03",
      date: "16/11/2026",
      weekday: "Segunda-feira",
      time: "08:30",
      type: "passeio",
      title: "Isla Mujeres em Catamarã Exclusivo",
      description:
        "Navegação caribenha com snorkel, clube de praia privado e tempo livre para passear de carrinho de golfe pelo centro histórico e praias da ilha.",
    },
    {
      id: "day-4",
      dayLabel: "Dia 04",
      date: "17/11/2026",
      weekday: "Terça-feira",
      time: "Livre",
      type: "livre",
      title: "Dia Livre & Gastronomia Mexicana",
      description:
        "Momento reservado para relaxamento no resort e indicação de restaurante gastronômico à beira da lagoa Nichupté para o jantar em família.",
    },
    {
      id: "day-5",
      dayLabel: "Dia 05",
      date: "18/11/2026",
      weekday: "Quarta-feira",
      time: "07:00",
      type: "passeio",
      title: "Expedição Chichén Itzá & Cenote Sagrado",
      description:
        "Imersão na grandiosidade da civilização maia com guia historiador privativo, almoço tradicional e mergulho no cenote ancestral.",
    },
    {
      id: "day-6",
      dayLabel: "Dia 06",
      date: "19/11/2026",
      weekday: "Quinta-feira",
      time: "Livre",
      type: "livre",
      title: "Dia de Sol & Compras Locais",
      description:
        "Dia relaxante para aproveitar as instalações do hotel e fazer compras artesanais e souvenirs no Shopping La Isla.",
    },
    {
      id: "day-7",
      dayLabel: "Dia 07",
      date: "20/11/2026",
      weekday: "Sexta-feira",
      time: "08:00",
      type: "passeio",
      title: "Parque Xcaret & Show México Espectacular",
      description:
        "Um dia inteiro entre a natureza, rios subterrâneos e a rica cultura mexicana, finalizando com o emocionante espetáculo teatral noturno.",
    },
    {
      id: "day-8",
      dayLabel: "Dia 08",
      date: "21/11/2026",
      weekday: "Sábado",
      time: "11:00",
      type: "retorno",
      title: "Check-out & Transfer para o Aeroporto",
      description:
        "Check-out tranquilo no hotel e transfer privativo agendado para o aeroporto de Cancún com assistência da equipe Tio Nenê.",
    },
  ],
};
