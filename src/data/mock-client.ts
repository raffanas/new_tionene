export type TourStatus = "Confirmado" | "Pendente" | "Alterado" | "Concluído";
export type TripStatus = "Confirmada" | "Em planejamento" | "Concluída";
export type DocumentStatus = "Disponível" | "Em emissão" | "Pendente";
export type TimelineItemType = "chegada" | "passeio" | "retorno" | "livre";

export interface Client {
  id: string;
  nome: string;
  primeiroNome: string;
  email: string;
  telefone: string;
}

export interface ClientTour {
  id: string;
  slug: string;
  nome: string;
  imagem: string;
  data: string; // formato exibível "14/01/2027"
  horarioSaida: string;
  duracao: string;
  localEncontro: string;
  status: TourStatus;
  descricao: string;
  inclui: string[];
  oQueLevar: string[];
  observacoes: string;
  roteiro: string[];
}

export interface ClientDocument {
  id: string;
  nome: string;
  tipo: string;
  status: DocumentStatus;
  passeioRelacionado?: string;
  descricaoDemonstrativa: string;
}

export interface ClientTimelineItem {
  id: string;
  data: string;
  diaSemana: string;
  tipo: TimelineItemType;
  titulo: string;
  horario?: string;
  descricao?: string;
  passeioSlug?: string;
}

export interface ClientAccommodation {
  nome: string;
  status: string;
  tipoQuarto?: string;
  checkIn?: string;
  checkOut?: string;
}

export interface ClientTravelers {
  adultos: number;
  criancas: number;
  descricao: string;
}

export interface ClientFlightInfo {
  data: string;
  horario: string;
  detalhe?: string;
}

export interface ClientTrip {
  destino: string;
  dataInicio: string; // "2027-01-12"
  dataFim: string; // "2027-01-19"
  periodoFormatado: string; // "12 a 19 de janeiro de 2027"
  status: TripStatus;
  viajantes: ClientTravelers;
  hospedagem: ClientAccommodation;
  chegada: ClientFlightInfo;
  retorno: ClientFlightInfo;
  quantidadePasseios: number;
}

export interface ClientSupportData {
  titulo: string;
  atendimento: string;
  whatsapp: string;
  mensagem: string;
  disponibilidade: string;
}

export interface ClientImportantInfoItem {
  id: string;
  categoria: string;
  titulo: string;
  texto: string;
}

export interface ClientDashboardData {
  cliente: Client;
  viagem: ClientTrip;
  passeios: ClientTour[];
  roteiroTimeline: ClientTimelineItem[];
  documentos: ClientDocument[];
  informacoesImportantes: ClientImportantInfoItem[];
  suporte: ClientSupportData;
}

export const MOCK_CLIENT_DATA: ClientDashboardData = {
  cliente: {
    id: "cliente-demo",
    nome: "Isabella",
    primeiroNome: "Isabella",
    email: "isabella@email.com",
    telefone: "+55 11 99999-9999",
  },

  viagem: {
    destino: "Cancún, México",
    dataInicio: "2027-01-12",
    dataFim: "2027-01-19",
    periodoFormatado: "12 a 19 de janeiro de 2027",
    status: "Confirmada",
    viajantes: {
      adultos: 2,
      criancas: 1,
      descricao: "3 viajantes (2 adultos e 1 criança)",
    },
    hospedagem: {
      nome: "Hotel em Cancún",
      status: "Confirmada",
      tipoQuarto: "Suíte Vista Mar",
      checkIn: "15:00",
      checkOut: "11:00",
    },
    chegada: {
      data: "2027-01-12",
      horario: "15:00",
      detalhe: "Chegada no Aeroporto Internacional de Cancún (CUN)",
    },
    retorno: {
      data: "2027-01-19",
      horario: "11:00",
      detalhe: "Embarque de retorno com saída de Cancún",
    },
    quantidadePasseios: 3,
  },

  passeios: [
    {
      id: "tour-1",
      slug: "chichen-itza",
      nome: "Chichén Itzá & Cenote Sagrado",
      imagem: "/passeios/chichen-itza.jpg",
      data: "14/01/2027",
      horarioSaida: "07:00",
      duracao: "Dia todo (aprox. 10 horas)",
      localEncontro: "Recepção do Hotel (Cancún)",
      status: "Confirmado",
      descricao:
        "Explore a mística pirâmide maia com guia historiador privativo e banho nas águas cristalinas do cenote Ik Kil.",
      inclui: [
        "Transporte executivo climatizado com saída do hotel",
        "Guia historiador certificado bilíngue",
        "Ingresso com acesso arqueológico a Chichén Itzá",
        "Acesso e tempo livre para banho no Cenote Sagrado",
        "Almoço buffet com autêntica gastronomia yucateca",
      ],
      oQueLevar: [
        "Roupas leves e calçados confortáveis de caminhada",
        "Roupa de banho e toalha",
        "Protetor solar biodegradável e repelente ecológico",
        "Documento de identificação com foto",
      ],
      observacoes:
        "O horário exato da van será reconfirmado na véspera via WhatsApp pela equipe de assistência local.",
      roteiro: [
        "Embarque no hotel em Cancún",
        "Visita guiada arqueológica na Pirâmide de Kukulcán",
        "Almoço típico regional yucateco",
        "Mergulho revigorante nas águas do Cenote Sagrado",
        "Retorno previsto para o final da tarde",
      ],
    },
    {
      id: "tour-2",
      slug: "isla-mujeres",
      nome: "Isla Mujeres Exclusiva",
      imagem: "/passeios/isla-mujeres.jpg",
      data: "16/01/2027",
      horarioSaida: "09:00",
      duracao: "Dia todo (aprox. 7 a 8 horas)",
      localEncontro: "Marina de Embarque (Cancún)",
      status: "Confirmado",
      descricao:
        "Navegue em catamarã pelas águas azul-turquesa do Caribe com parada para snorkeling e o encanto de Playa Norte.",
      inclui: [
        "Passeio em catamarã à vela pela baía caribenha",
        "Equipamento higienizado de snorkeling com colete",
        "Open bar de bebidas nacionais selecionadas a bordo",
        "Almoço buffet em clube de praia privativo na ilha",
        "Tempo livre para passear pelo centro e relaxar em Playa Norte",
      ],
      oQueLevar: [
        "Roupa de banho, toalha e muda de roupa seca",
        "Protetor solar biodegradável",
        "Óculos de sol e chapéu com presilha",
        "Dinheiro em espécie para taxa de cais e despesas pessoais",
      ],
      observacoes:
        "A taxa governamental federal de conservação marinha e cais é quitada diretamente no balcão da marina no check-in.",
      roteiro: [
        "Check-in e boas-vindas na marina de Cancún",
        "Navegação com parada para snorkeling no recife de coral",
        "Atracagem e almoço em clube de praia privativo",
        "Tempo livre nas areias mornas de Playa Norte",
        "Navegação relaxante de regresso à marina",
      ],
    },
    {
      id: "tour-3",
      slug: "xcaret",
      nome: "Parque Eco-Arqueológico Xcaret",
      imagem: "/passeios/xcaret.jpg",
      data: "18/01/2027",
      horarioSaida: "08:30",
      duracao: "Dia todo (aprox. 12 horas)",
      localEncontro: "Recepção do Hotel (Cancún)",
      status: "Confirmado",
      descricao:
        "Rios subterrâneos, aquário de recife de coral e o emocionante espetáculo folclórico que homenageia o México.",
      inclui: [
        "Transporte oficial de ida e volta climatizado",
        "Ingresso completo com livre acesso às atrações naturais",
        "Percurso nos 3 rios subterrâneos com coletes e bolsa estanque",
        "Acesso à praia, caletas, aviário monumental e aquário",
        "Assento garantido no grandioso show Xcaret México Espectacular",
      ],
      oQueLevar: [
        "Roupa de banho e sapatilhas aquáticas antiderrapantes",
        "Muda de roupa seca para assistir ao espetáculo noturno",
        "Toalha de banho",
        "Protetor solar 100% biodegradável (exigência do parque)",
      ],
      observacoes:
        "O imperdível espetáculo folclórico Xcaret México Espectacular inicia pontualmente às 19:00 no teatro Gran Tlachco.",
      roteiro: [
        "Chegada e início dos rios subterrâneos",
        "Trilhas ecológicas, aviário e aquário de corais",
        "Pausa nas piscinas naturais e caletas",
        "Apresentações de tradições mexicanas e charraria",
        "Show monumental Xcaret México Espectacular (19h)",
        "Retorno em transporte executivo aos hotéis",
      ],
    },
  ],

  roteiroTimeline: [
    {
      id: "time-1",
      data: "12/01/2027",
      diaSemana: "Terça-feira",
      tipo: "chegada",
      titulo: "Chegada em Cancún & Check-in",
      horario: "15:00",
      descricao:
        "Pouso no México, recepção calorosa da equipe local e traslado exclusivo até o hotel para ambientação e descanso.",
    },
    {
      id: "time-2",
      data: "13/01/2027",
      diaSemana: "Quarta-feira",
      tipo: "livre",
      titulo: "Dia Livre para Ambientação & Praia",
      descricao:
        "Aproveite a estrutura do hotel, relaxe à beira do mar caribenho e sinta o ritmo leve do destino.",
    },
    {
      id: "time-3",
      data: "14/01/2027",
      diaSemana: "Quinta-feira",
      tipo: "passeio",
      titulo: "Chichén Itzá & Cenote Sagrado",
      horario: "07:00",
      descricao:
        "Imersão na grandiosidade da civilização maia e mergulho refrescante nas águas puras do cenote.",
      passeioSlug: "chichen-itza",
    },
    {
      id: "time-4",
      data: "15/01/2027",
      diaSemana: "Sexta-feira",
      tipo: "livre",
      titulo: "Dia Livre ou Gastronomia Mexicana",
      descricao:
        "Dia sem pressa para caminhar, experimentar restaurantes recomendados ou fazer compras no centrinho.",
    },
    {
      id: "time-5",
      data: "16/01/2027",
      diaSemana: "Sábado",
      tipo: "passeio",
      titulo: "Isla Mujeres Exclusiva",
      horario: "09:00",
      descricao:
        "Catamarã sobre tons surreais de azul, vida marinha nos recifes e tarde perfeita em Playa Norte.",
      passeioSlug: "isla-mujeres",
    },
    {
      id: "time-6",
      data: "17/01/2027",
      diaSemana: "Domingo",
      tipo: "livre",
      titulo: "Dia Livre para Curtir Cancún",
      descricao:
        "Manhã de sol e piscina para renovar as energias antes do grande dia de parque ecológico.",
    },
    {
      id: "time-7",
      data: "18/01/2027",
      diaSemana: "Segunda-feira",
      tipo: "passeio",
      titulo: "Parque Eco-Arqueológico Xcaret",
      horario: "08:30",
      descricao:
        "Natureza exuberante, rios subterrâneos e a emoção do maior show folclórico das Américas ao entardecer.",
      passeioSlug: "xcaret",
    },
    {
      id: "time-8",
      data: "19/01/2027",
      diaSemana: "Terça-feira",
      tipo: "retorno",
      titulo: "Check-out & Voo de Retorno",
      horario: "11:00",
      descricao:
        "Despedida do Caribe Mexicano com transfer organizado até o aeroporto para o voo de volta ao Brasil.",
    },
  ],

  documentos: [
    {
      id: "doc-1",
      nome: "Voucher — Chichén Itzá & Cenote Sagrado",
      tipo: "Voucher de Passeio",
      status: "Disponível",
      passeioRelacionado: "Chichén Itzá & Cenote Sagrado",
      descricaoDemonstrativa: "Comprovante oficial de embarque e acesso às atrações.",
    },
    {
      id: "doc-2",
      nome: "Voucher — Isla Mujeres Exclusiva",
      tipo: "Voucher de Passeio",
      status: "Disponível",
      passeioRelacionado: "Isla Mujeres Exclusiva",
      descricaoDemonstrativa: "Acesso ao catamarã, beach club privativo e snorkeling.",
    },
    {
      id: "doc-3",
      nome: "Voucher — Parque Eco-Arqueológico Xcaret",
      tipo: "Voucher de Passeio",
      status: "Disponível",
      passeioRelacionado: "Parque Eco-Arqueológico Xcaret",
      descricaoDemonstrativa: "Ingresso de dia inteiro e assento reservado no show noturno.",
    },
    {
      id: "doc-4",
      nome: "Informações da Viagem & Guia Prático",
      tipo: "Guia & Logística",
      status: "Disponível",
      descricaoDemonstrativa: "Manual de dicas, câmbio, costumes e contatos locais essenciais.",
    },
  ],

  informacoesImportantes: [
    {
      id: "info-1",
      categoria: "Horários & Embarque",
      titulo: "Reconfirmação de horários na véspera",
      texto:
        "Confira o horário de saída de cada passeio no dia anterior. Nossa equipe de assistência local enviará os detalhes para garantir pontualidade e tranquilidade.",
    },
    {
      id: "info-2",
      categoria: "Identificação Pessoal",
      titulo: "Documentos durante os deslocamentos",
      texto:
        "Tenha seus documentos pessoais disponíveis e identificação com foto durante os deslocamentos, aeroportos e na entrada de cada experiência.",
    },
    {
      id: "info-3",
      categoria: "Orientações Específicas",
      titulo: "O que levar para cada experiência",
      texto:
        "Consulte as orientações específicas de cada experiência em ‘Seus Passeios’ (como roupas adequadas, calçados confortáveis e protetor solar biodegradável).",
    },
    {
      id: "info-4",
      categoria: "Atendimento & Apoio",
      titulo: "Suporte contínuo no destino",
      texto:
        "Em caso de qualquer dúvida sobre sua programação ou necessidade de apoio local no México, fale diretamente com a equipe Tio Nenê.",
    },
  ],

  suporte: {
    titulo: "Estamos com você durante toda a viagem.",
    atendimento: "Equipe Tio Nenê",
    whatsapp: "Atendimento local em português",
    mensagem:
      "Se precisar falar com a equipe durante sua experiência no México, entre em contato pelos nossos canais de atendimento.",
    disponibilidade: "Acompanhamento local durante a estadia",
  },
};
