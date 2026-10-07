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
    departureDate: "28/07/2027",
    hotel: "Grand Fiesta Americana Coral Beach Cancún",
    travelers: "2 adultos + 1 criança",
    roomType: "Suíte Familiar com Vista para o Mar",
    bookingNotes:
      "Transfer privativo de chegada e retorno já confirmado com receptivo exclusivo no aeroporto de Cancún (cadeirinha infantil inclusa). Suporte local e concierge em português à disposição todos os dias.",
    localConcierge: "Equipe Tio Nenê Cancún",
  },

  tours: [
    {
      id: "tour-xcaret",
      slug: "xcaret",
      name: "Xcaret Plus",
      image: "/passeios/xcaret.jpg",
      date: "22/07 (terça-feira)",
      time: "08:00",
      duration: "Dia todo",
      meetingPoint: "Recepção do Hotel",
      status: "Confirmado",
      badge: "incluso",
      travelers: "2 adultos",
      shortDescription:
        "Rios subterrâneos, aquário de corais e espetáculo noturno México Espectacular com mais de 50 atrações culturais.",
      detailsUrl: "/passeios/xcaret",
    },
    {
      id: "tour-isla-mujeres",
      slug: "isla-mujeres",
      name: "Isla Mujeres",
      image: "/passeios/isla-mujeres.jpg",
      date: "24/07 (quinta-feira)",
      time: "08:30",
      duration: "Aprox. 7 horas",
      meetingPoint: "Marina Chac Chi ou recepção",
      status: "Confirmado",
      badge: "incluso",
      travelers: "2 adultos",
      shortDescription:
        "Navegação em catamarã exclusivo pelas águas cristalinas do mar caribenho com parada para snorkel e almoço em clube privativo.",
      detailsUrl: "/passeios/isla-mujeres",
    },
    {
      id: "tour-chichen-itza",
      slug: "chichen-itza",
      name: "Chichén Itzá",
      image: "/passeios/chichen-itza.jpg",
      date: "26/07 (sábado)",
      time: "07:00",
      duration: "Dia todo",
      meetingPoint: "Recepção do Hotel",
      status: "Confirmado",
      badge: "incluso",
      travelers: "2 adultos",
      shortDescription:
        "Explore a mística pirâmide maia com guia historiador privativo e banho nas águas cristalinas do cenote sagrado.",
      detailsUrl: "/passeios/chichen-itza",
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
