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
  shortDescription: string;
  detailsUrl: string;
}

export interface Client2TripSummaryData {
  arrivalDate: string;
  departureDate: string;
  hotel: string;
  travelers: string;
  roomType?: string;
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
    name: "Isabella",
    greetingTitle: "Isabella, essa é a sua programação de viagem",
    destination: "Cancún, México",
    period: "14 a 21 de Novembro de 2026",
    travelers: "2 adultos + 1 criança",
    hotel: "Grand Fiesta Americana Coral Beach Cancún",
    status: "Viagem Confirmada",
  },

  summary: {
    arrivalDate: "14/11/2026",
    departureDate: "21/11/2026",
    hotel: "Grand Fiesta Americana Coral Beach Cancún",
    travelers: "2 adultos + 1 criança",
    roomType: "Suíte Familiar com Vista para o Mar",
    bookingNotes:
      "Transfer privativo de chegada e retorno já confirmado com receptivo exclusivo no aeroporto de Cancún (cadeirinha infantil inclusa). Suporte local e concierge em português à disposição todos os dias.",
    localConcierge: "Equipe Tio Nenê Cancún",
  },

  tours: [
    {
      id: "tour-isla-mujeres",
      slug: "isla-mujeres",
      name: "Isla Mujeres em Catamarã Exclusivo",
      image: "/passeios/isla-mujeres.jpg",
      date: "16/11/2026",
      time: "08:30",
      duration: "Aprox. 7 horas",
      meetingPoint: "Marina Chac Chi (Zona Hoteleira de Cancún) ou saída da recepção",
      status: "Confirmado",
      shortDescription:
        "Navegação pelas águas cristalinas do mar do Caribe, parada com snorkel no recife de corais, almoço buffet em clube de praia privado e tempo livre para explorar a charmosa ilha.",
      detailsUrl: "/passeios/isla-mujeres",
    },
    {
      id: "tour-chichen-itza",
      slug: "chichen-itza",
      name: "Chichén Itzá Privativo & Cenote Sagrado",
      image: "/passeios/chichen-itza.jpg",
      date: "18/11/2026",
      time: "07:00",
      duration: "Dia todo (aprox. 10 horas)",
      meetingPoint: "Recepção do Grand Fiesta Americana Coral Beach",
      status: "Confirmado",
      shortDescription:
        "Visita guiada a uma das Sete Maravilhas do Mundo com arqueólogo credenciado, seguida de banho revigorante nas águas cristalinas de um cenote sagrado maia e almoço típico yucateco.",
      detailsUrl: "/passeios/chichen-itza",
    },
    {
      id: "tour-xcaret",
      slug: "xcaret",
      name: "Parque Eco-Arqueológico Xcaret Plus",
      image: "/passeios/xcaret.jpg",
      date: "20/11/2026",
      time: "08:00",
      duration: "Dia todo (aprox. 12 horas)",
      meetingPoint: "Recepção do Grand Fiesta Americana Coral Beach",
      status: "Confirmado",
      shortDescription:
        "Rios subterrâneos, aquário de recife de coral, praia caribenha e mais de 50 atrações culturais e naturais, culminando com o espetáculo noturno México Espectacular.",
      detailsUrl: "/passeios/xcaret",
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
