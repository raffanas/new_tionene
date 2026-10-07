export interface TourItineraryItem {
  order: number;
  time?: string;
  title: string;
  description: string;
}

export interface Tour {
  slug: string;
  name: string;
  category: string;
  shortDescription: string;
  description: string;
  heroImage: string;
  gallery: string[];
  location: string;
  duration: string;
  startTime: string;
  endTime: string;
  priceFrom: number;
  currency: string;
  adultPrice: number;
  childPrice: number;
  infantPrice?: number;
  infant04Price?: number;
  infantPolicy?: string;
  minimumAge: string;
  included: string[];
  notIncluded: string[];
  whatToBring: string[];
  importantInfo: string[];
  itinerary: TourItineraryItem[];
  highlights: string[];
  idealFor: string[];
  accessibility: string;
  cancellationPolicy: string;
  relatedTours: string[];
}

export const TOURS: Tour[] = [
  {
    slug: "chichen-itza",
    name: "Chichén Itzá & Cenote Sagrado",
    category: "Cultura & História · Dia Todo",
    shortDescription:
      "Explore a mística pirâmide maia com guia historiador privativo e banho nas águas cristalinas do cenote Ik Kil.",
    description:
      "Explore uma das Sete Maravilhas do Mundo Moderno em uma experiência que une a grandiosidade da civilização maia à contemplação da natureza mexicana. Com acompanhamento de guia historiador credenciado, descubra os segredos da astronomia, arquitetura e espiritualidade de Chichén Itzá. Em seguida, desfrute de um mergulho refrescante nas águas sagradas de um cenote ancestral cercado por vegetação exuberante e saboreie um autêntico almoço com as delícias da gastronomia yucateca.",
    heroImage: "/passeios/chichen-itza.jpg",
    gallery: [
      "/passeios/chichen-itza.jpg",
      "/passeios/ruinas-de-tulum-cenotes.jpg",
      "/images/img-08-2cf9c873.png",
      "/passeios/isla-mujeres.jpg"
    ],
    location: "Yucatán / Riviera Maya, México",
    duration: "Dia todo (aprox. 10 horas)",
    startTime: "07:00",
    endTime: "17:30",
    priceFrom: 650,
    currency: "R$",
    adultPrice: 650,
    childPrice: 650,
    infantPrice: 480,
    infant04Price: 0,
    infantPolicy: "Infantes de 0 a 4 anos possuem entrada cortesia (gratuito). De 5 a 11 anos possuem tarifa reduzida de infante.",
    minimumAge: "Livre para todas as idades",
    included: [
      "Transporte ida e volta em van executiva climatizada com saída do seu hotel",
      "Guia historiador certificado bilíngue (português/espanhol)",
      "Ingresso com acesso ao sítio arqueológico de Chichén Itzá",
      "Acesso e tempo livre para banho no Cenote Sagrado",
      "Almoço buffet com culinária típica regional yucateca",
      "Água e bebidas leves durante o trajeto terrestre"
    ],
    notIncluded: [
      "Taxa governamental de preservação cultural / ambiental (informação a definir)",
      "Bebidas alcoólicas e refrigerantes durante o almoço buffet",
      "Uso de colete salva-vidas ou armários no cenote (caso locação à parte)",
      "Fotos profissionais e souvenirs locais",
      "Gorjetas para motorista e guia (opcionais)"
    ],
    whatToBring: [
      "Roupas leves e calçados confortáveis para caminhada em terreno aberto",
      "Roupa de banho e toalha para o mergulho no cenote",
      "Protetor solar biodegradável e repelente ecológico",
      "Chapéu, boné ou sombrinha e óculos de sol",
      "Documento de identificação com foto",
      "Dinheiro em espécie (pesos mexicanos ou dólares) para pequenas despesas"
    ],
    importantInfo: [
      "O horário exato de embarque será confirmado na véspera de acordo com a localização do hotel",
      "A duração do trajeto até Chichén Itzá é de aproximadamente 2h30 a partir de Cancún",
      "Drones e equipamentos de filmagem profissional estão sujeitos a taxa governamental específica na portaria do parque"
    ],
    itinerary: [
      {
        order: 1,
        time: "07:00",
        title: "Embarque no Hotel",
        description:
          "Saída em veículo executivo climatizado com destino ao interior da península de Yucatán, com recepção da equipe e orientações sobre a jornada."
      },
      {
        order: 2,
        time: "09:30",
        title: "Chegada a Chichén Itzá",
        description:
          "Entrada privilegiada no sítio arqueológico nas primeiras horas da manhã, aproveitando temperaturas agradáveis e menor fluxo de visitantes."
      },
      {
        order: 3,
        time: "10:00",
        title: "Visita Guiada Arqueológica",
        description:
          "Circuito cultural completo passando pela icônica Pirâmide de Kukulcán, o Campo do Jogo de Pelota, o Templo dos Guerreiros e o Observatório astronômico maia."
      },
      {
        order: 4,
        time: "12:30",
        title: "Almoço Regional Típico",
        description:
          "Parada em restaurante tradicional para saborear pratos autênticos da gastronomia yucateca, como a cochinita pibil, acompanhamentos frescos e sobremesas locais."
      },
      {
        order: 5,
        time: "14:00",
        title: "Mergulho no Cenote Sagrado",
        description:
          "Banho revigorante nas águas cristalinas do cenote rodeado por paredões rochosos e raízes aéreas da floresta tropical."
      },
      {
        order: 6,
        time: "16:00",
        title: "Retorno a Cancún e Riviera Maya",
        description:
          "Viagem de regresso com previsão de chegada aos hotéis a partir das 17h30/18h00."
      }
    ],
    highlights: [
      "Visita a uma das 7 Maravilhas do Mundo Moderno com guia historiador credenciado",
      "Mergulho em águas cristalinas e puras de um cenote sagrado maia",
      "Almoço típico regional incluso em ambiente acolhedor",
      "Transporte confortável em grupo reduzido com assistência personalizada"
    ],
    idealFor: [
      "Casais e famílias que desejam vivenciar a autêntica história maia",
      "Viajantes que buscam fotos inesquecíveis e contato genuíno com a cultura mexicana",
      "Quem visita Cancún pela primeira vez e prioriza passeios emblemáticos"
    ],
    accessibility:
      "Parcialmente acessível. O sítio de Chichén Itzá conta com caminhos planos de terra batida; o acesso à água no cenote requer descida por escadarias de pedra.",
    cancellationPolicy:
      "Cancelamento gratuito com até 24 horas de antecedência ao horário agendado do embarque.",
    relatedTours: ["isla-mujeres", "xcaret", "tulum"]
  },
  {
    slug: "isla-mujeres",
    name: "Isla Mujeres Exclusiva",
    category: "Ilhas & Navegação · Dia Todo",
    shortDescription:
      "Navegue em catamarã pelas águas azul-turquesa do Caribe com parada para snorkeling e o encanto de Playa Norte.",
    description:
      "Navegue pelas tonalidades mais deslumbrantes do mar caribenho a bordo de um catamarã confortável com destino a Isla Mujeres. Desfrute de parada para snorkeling em recife de corais, open bar a bordo, clube de praia privativo e tempo livre para caminhar pelo charmoso centrinho da ilha e relaxar nas areias calmas de Playa Norte.",
    heroImage: "/passeios/isla-mujeres.jpg",
    gallery: [
      "/passeios/isla-mujeres.jpg",
      "/passeios/cozumel-e-al-cielo.jpg",
      "/images/img-07-56639b33.png"
    ],
    location: "Isla Mujeres / Baía de Cancún, México",
    duration: "Dia todo (aprox. 7 a 8 horas)",
    startTime: "09:00",
    endTime: "17:00",
    priceFrom: 490,
    currency: "R$",
    adultPrice: 490,
    childPrice: 490,
    infantPrice: 360,
    infant04Price: 0,
    infantPolicy: "Infantes de 0 a 4 anos não pagam (cortesia). De 5 a 11 anos contam com tarifa especial reduzida.",
    minimumAge: "Livre para todas as idades",
    included: [
      "Passeio em catamarã à vela pela baía de Cancún até Isla Mujeres",
      "Equipamento completo de snorkeling (máscara, tubo novo e colete)",
      "Bebidas nacionais selecionadas a bordo (open bar)",
      "Acesso ao clube de praia privativo com almoço buffet",
      "Tempo livre no centrinho e na Playa Norte de Isla Mujeres"
    ],
    notIncluded: [
      "Taxa de cais e conservação marinha governamental (informação a definir)",
      "Aluguel de carrinho de golfe na ilha (opcional)",
      "Fotos profissionais e souvenirs",
      "Gorjetas para a tripulação (opcionais)"
    ],
    whatToBring: [
      "Roupa de banho, toalha e muda de roupa seca",
      "Protetor solar biodegradável",
      "Óculos de sol e chapéu com presilha para vento",
      "Dinheiro em espécie para taxa de cais e compras na ilha"
    ],
    importantInfo: [
      "A atividade de snorkeling depende das condições climáticas e marítimas no dia",
      "A taxa portuária federal deve ser paga diretamente na marina no momento do check-in"
    ],
    itinerary: [
      {
        order: 1,
        time: "09:00",
        title: "Embarque na Marina",
        description: "Check-in na marina de Cancún e boas-vindas da tripulação a bordo do catamarã."
      },
      {
        order: 2,
        time: "10:15",
        title: "Snorkeling no Recife",
        description: "Parada em alto mar para mergulho assistido entre peixes tropicais e formações de corais."
      },
      {
        order: 3,
        time: "12:30",
        title: "Clube de Praia & Almoço",
        description: "Atracagem em clube de praia privativo com buffet caribenho e área para descanso."
      },
      {
        order: 4,
        time: "14:30",
        title: "Centro & Playa Norte",
        description: "Tempo livre para caminhar pelas ruelas coloridas da ilha e nadar na famosa Playa Norte."
      },
      {
        order: 5,
        time: "16:30",
        title: "Navegação de Retorno",
        description: "Velejo relaxante de volta a Cancún com música e bebidas a bordo."
      }
    ],
    highlights: [
      "Navegação panorâmica em catamarã pelas águas azul-turquesa do Caribe",
      "Mergulho de superfície em recife de corais preservado",
      "Tempo livre em uma das praias mais bonitas do mundo (Playa Norte)",
      "Atendimento atencioso e descontraído da tripulação"
    ],
    idealFor: [
      "Casais, grupos de amigos e famílias em busca de um dia solar e descontraído",
      "Amantes de mar calmo, água cristalina e boa gastronomia praiana"
    ],
    accessibility:
      "Acessibilidade moderada. O embarque no catamarã e descida na ilha exigem degraus.",
    cancellationPolicy:
      "Cancelamento gratuito com até 24 horas de antecedência ao horário agendado.",
    relatedTours: ["chichen-itza", "cozumel-el-cielo", "xcaret"]
  },
  {
    slug: "xcaret",
    name: "Parque Eco-Arqueológico Xcaret",
    category: "Natureza & Cultura · Dia Todo",
    shortDescription:
      "Rios subterrâneos, aquário de recife de coral e o emocionante espetáculo folclórico que homenageia o México.",
    description:
      "Xcaret é o santuário natural mais emblemático da Riviera Maya. Desfrute de rios subterrâneos de águas cristalinas, fauna local, aviário, aquário de recife de coral, praia paradisíaca e encerre o dia com o grandioso espetáculo 'Xcaret México Espectacular', uma emocionante celebração com mais de 300 artistas em cena.",
    heroImage: "/passeios/xcaret.jpg",
    gallery: [
      "/passeios/xcaret.jpg",
      "/passeios/xel-ha.jpg",
      "/images/img-08-2cf9c873.png"
    ],
    location: "Playa del Carmen / Riviera Maya, México",
    duration: "Dia todo (aprox. 12 horas)",
    startTime: "08:30",
    endTime: "21:30",
    priceFrom: 790,
    currency: "R$",
    adultPrice: 790,
    childPrice: 790,
    infantPrice: 590,
    infant04Price: 0,
    infantPolicy: "Infantes de 0 a 4 anos possuem entrada gratuita no parque. De 5 a 11 anos contam com tarifa especial com desconto.",
    minimumAge: "Livre para todas as idades",
    included: [
      "Transporte ida e volta em ônibus oficial climatizado",
      "Ingresso com acesso completo às atrações naturais e culturais de Xcaret",
      "Percurso nos 3 rios subterrâneos com colete salva-vidas",
      "Acesso ao aquário de recife, aviário, borboletário e praia",
      "Lugar garantido no espetáculo noturno 'Xcaret México Espectacular'"
    ],
    notIncluded: [
      "Atividades opcionais avulsas (nado com golfinhos, Seatrek, spa, etc.)",
      "Almoço e bebidas (opcional no pacote Xcaret Plus)",
      "Fotos profissionais do sistema fotográfico do parque",
      "Gorjetas"
    ],
    whatToBring: [
      "Roupa de banho, sapatilhas aquáticas ou calçado confortável",
      "Muda de roupa seca para a noite",
      "Toalha de banho",
      "Protetor solar 100% biodegradável (obrigatório pelo parque)",
      "Documento de identificação"
    ],
    importantInfo: [
      "O parque conta com armários, vestiários e duchas estruturadas",
      "O show noturno inicia às 19h e é imperdível para toda a família"
    ],
    itinerary: [
      {
        order: 1,
        time: "08:30",
        title: "Chegada a Xcaret",
        description: "Recepção no parque e início das atividades aquáticas nos rios subterrâneos."
      },
      {
        order: 2,
        time: "11:30",
        title: "Trilhas Culturais e Fauna",
        description: "Visita ao aviário monumental, aquário de recifes de corais e vila maia."
      },
      {
        order: 3,
        time: "14:00",
        title: "Praia e Caletas Naturais",
        description: "Tempo para relaxar nas espreguiçadeiras à beira-mar e provar a gastronomia local."
      },
      {
        order: 4,
        time: "17:00",
        title: "Tradições Mexicanas",
        description: "Apresentação dos Voadores de Papantla e demonstrações equestres charras."
      },
      {
        order: 5,
        time: "19:00",
        title: "Xcaret México Espectacular",
        description: "O maior show folclórico do país no teatro Gran Tlachco com história, dança e música viva."
      },
      {
        order: 6,
        time: "21:30",
        title: "Retorno aos Hotéis",
        description: "Embarque no transporte de regresso após o término do espetáculo."
      }
    ],
    highlights: [
      "Rios subterrâneos de águas cristalinas em meio à floresta",
      "Espetáculo noturno emocionante 'Xcaret México Espectacular'",
      "Estrutura impecável para todas as idades com contato autêntico com a natureza",
      "Mais de 50 atrações integradas em um só local"
    ],
    idealFor: [
      "Famílias com crianças, casais e viajantes de todas as idades",
      "Quem busca unir lazer, natureza preservada e a essência da cultura mexicana"
    ],
    accessibility:
      "Alta acessibilidade. O parque oferece rampas, caminhos pavimentados e aluguel de cadeiras de rodas.",
    cancellationPolicy:
      "Cancelamento gratuito com até 24 horas de antecedência ao dia do passeio.",
    relatedTours: ["xelha", "chichen-itza", "tulum"]
  },
  {
    slug: "xelha",
    name: "Xel-Há Parque All-Inclusive",
    category: "Aquático & Natureza · Dia Todo",
    shortDescription:
      "Uma verdadeira enseada natural com snorkeling livre, tirolesas aquáticas e gastronomia completa inclusa.",
    description:
      "Xel-Há é um paraíso aquático 'tudo incluído' onde rios de água doce encontram o mar do Caribe. Nade e mergulhe em meio a centenas de peixes coloridos, desça tirolesas que caem na água, caminhe pela selva, suba no Farol Mirante para uma descida em tobogã de 30 metros e aproveite restaurantes com comidas e bebidas ilimitadas o dia todo.",
    heroImage: "/passeios/xel-ha.jpg",
    gallery: [
      "/passeios/xel-ha.jpg",
      "/passeios/xcaret.jpg",
      "/images/img-08-2cf9c873.png"
    ],
    location: "Riviera Maya (próximo a Tulum), México",
    duration: "Dia todo (aprox. 10 horas)",
    startTime: "08:30",
    endTime: "18:00",
    priceFrom: 690,
    currency: "R$",
    adultPrice: 690,
    childPrice: 690,
    infantPrice: 520,
    infant04Price: 0,
    infantPolicy: "Infantes de 0 a 4 anos têm entrada all-inclusive gratuita. De 5 a 11 anos contam com tarifa infantil reduzida.",
    minimumAge: "Livre para todas as idades",
    included: [
      "Transporte ida e volta em van ou ônibus executivo",
      "Ingresso All-Inclusive para o parque Xel-Há",
      "Alimentos, snacks e bebidas ilimitadas (open bar nacional)",
      "Equipamento de snorkeling completo com tubo novo de presente",
      "Acesso a tirolesas aquáticas, bóias infláveis e tobogã do Farol Mirante",
      "Uso de armários, vestiários, toalhas e duchas"
    ],
    notIncluded: [
      "Atividades opcionais especiais (nado com arraias, peixes-bois, etc.)",
      "Fotos profissionais",
      "Gorjetas"
    ],
    whatToBring: [
      "Roupa de banho e sapatilha aquática",
      "Muda de roupa seca",
      "Protetor solar biodegradável",
      "Documento de identificação"
    ],
    importantInfo: [
      "Todo o consumo de alimentos e bebidas dentro do parque já está incluso no ingresso",
      "Para subir no tobogã do Farol Mirante há exigência de altura mínima de 1,05m"
    ],
    itinerary: [
      {
        order: 1,
        time: "08:30",
        title: "Chegada a Xel-Há",
        description: "Entrada no parque e café da manhã continental nos restaurantes da enseada."
      },
      {
        order: 2,
        time: "10:00",
        title: "Snorkeling e Rio com Bóias",
        description: "Descida relaxante de bóia pelo manguezal e mergulho livre na grande enseada natural."
      },
      {
        order: 3,
        time: "13:00",
        title: "Almoço Buffet & Descanso",
        description: "Variedade de restaurantes temáticos com gastronomia mexicana e internacional à vontade."
      },
      {
        order: 4,
        time: "14:30",
        title: "Farol Mirante e Tirolesas",
        description: "Vista panorâmica 360° da costa da Riviera Maya e descida rápida em tobogã circular."
      },
      {
        order: 5,
        time: "17:30",
        title: "Retorno",
        description: "Saída dos ônibus de volta aos hotéis da Riviera Maya e Cancún."
      }
    ],
    highlights: [
      "Experiência 100% All-Inclusive com gastronomia e bebidas à vontade",
      "Snorkeling ilimitado com enorme diversidade de vida marinha",
      "Farol Mirante com vista espetacular e tobogã aquático",
      "Ambiente relaxante e divertido para curtir sem preocupações"
    ],
    idealFor: [
      "Famílias que buscam comodidade all-inclusive e diversão segura para crianças",
      "Quem quer passar um dia inteiro na água com conforto absoluto"
    ],
    accessibility:
      "Alta acessibilidade com caminhos planos, cadeiras anfíbias disponíveis e sinalização clara.",
    cancellationPolicy:
      "Cancelamento gratuito com até 24 horas de antecedência ao dia do passeio.",
    relatedTours: ["xcaret", "xplor", "isla-mujeres"]
  },
  {
    slug: "tulum",
    name: "Ruínas de Tulum & Cenotes",
    category: "História & Praia · Meio Dia",
    shortDescription:
      "A clássica cidade murada maia sobre as falésias em frente ao mar caribenho aliada a mergulho em cenote aberto.",
    description:
      "Visite um dos cartões-postais mais celebrados do mundo: as ruínas maias de Tulum, erguidas sobre falésias rochosas com vista direta para o mar azul-turquesa. Em seguida, refresque-se em um cenote semiaberto de águas transparentes no coração da selva.",
    heroImage: "/passeios/ruinas-de-tulum-cenotes.jpg",
    gallery: [
      "/passeios/ruinas-de-tulum-cenotes.jpg",
      "/passeios/chichen-itza.jpg",
      "/images/img-08-2cf9c873.png"
    ],
    location: "Tulum, Quintana Roo, México",
    duration: "Meio dia (aprox. 6 horas)",
    startTime: "07:30",
    endTime: "13:30",
    priceFrom: 460,
    currency: "R$",
    adultPrice: 460,
    childPrice: 460,
    infantPrice: 350,
    infant04Price: 0,
    infantPolicy: "Infantes de 0 a 4 anos não pagam (cortesia). De 5 a 11 anos contam com tarifa especial reduzida.",
    minimumAge: "Livre para todas as idades",
    included: [
      "Transporte com ar-condicionado",
      "Guia historiador bilíngue",
      "Ingresso do sítio arqueológico de Tulum",
      "Acesso e banho em cenote",
      "Água mineral a bordo"
    ],
    notIncluded: [
      "Taxa de preservação do Parque Nacional Tulum (informação a definir)",
      "Almoço",
      "Gorjetas"
    ],
    whatToBring: [
      "Roupas leves e calçado confortável",
      "Roupa de banho e toalha",
      "Protetor solar biodegradável",
      "Chapéu e óculos escuros"
    ],
    importantInfo: [
      "O passeio termina no início da tarde, permitindo aproveitar o restante do dia livre"
    ],
    itinerary: [
      {
        order: 1,
        time: "07:30",
        title: "Saída dos Hotéis",
        description: "Embarque pela manhã em direção ao sítio costeiro de Tulum."
      },
      {
        order: 2,
        time: "09:00",
        title: "Visita Arqueológica de Tulum",
        description: "Percurso com guia historiador entre os templos maias em frente ao mar caribenho."
      },
      {
        order: 3,
        time: "11:30",
        title: "Banho em Cenote Natural",
        description: "Mergulho nas águas límpidas de um cenote cercado por mata nativa."
      },
      {
        order: 4,
        time: "13:30",
        title: "Retorno aos Hotéis",
        description: "Chegada aos hotéis com a tarde livre para descanso."
      }
    ],
    highlights: [
      "Vista icônica dos templos maias debruçados sobre o mar do Caribe",
      "Visita ágil e rica em história no período mais fresco da manhã",
      "Mergulho em cenote preservado"
    ],
    idealFor: [
      "Quem deseja conhecer história maia sem comprometer o dia todo",
      "Amantes de fotografia e paisagens paradisíacas"
    ],
    accessibility: "Parcialmente acessível. Caminhos de terra e areia batida.",
    cancellationPolicy: "Cancelamento gratuito com até 24 horas de antecedência.",
    relatedTours: ["chichen-itza", "xcaret", "isla-mujeres"]
  },
  {
    slug: "xplor",
    name: "Xplor Aventura & Tirolesas",
    category: "Aventura & Adrenalina · Dia Todo",
    shortDescription:
      "Tirolesas nas alturas sobre a selva maia, veículos anfíbios e jangadas em cavernas repletas de estalactites.",
    description:
      "Viva a experiência de aventura mais eletrizante do México no parque Xplor. Voe pelas tirolesas mais altas da Riviera Maya, conduza veículos anfíbios por trilhas na selva e cavernas inundadas, navegue de jangada remando com as próprias mãos por rios de estalactites e saboreie um buffet nutritivo e ilimitado de alto padrão para recarregar as energias.",
    heroImage: "/passeios/Tirolesas.jpg",
    gallery: [
      "/passeios/Tirolesas.jpg",
      "/passeios/xel-ha.jpg",
      "/passeios/xcaret.jpg"
    ],
    location: "Playa del Carmen / Riviera Maya, México",
    duration: "Dia todo (aprox. 8 horas)",
    startTime: "09:00",
    endTime: "17:00",
    priceFrom: 760,
    currency: "R$",
    adultPrice: 760,
    childPrice: 760,
    infantPrice: 570,
    infant04Price: 0,
    infantPolicy: "Idade mínima recomendada de 5 anos para circuitos de tirolesas. Crianças de 5 a 11 anos possuem tarifa reduzida especial.",
    minimumAge: "A partir de 5 anos",
    included: [
      "Transporte ida e volta oficial climatizado",
      "Ingresso com acesso ilimitado aos circuitos de tirolesas",
      "Veículos anfíbios na selva e cavernas",
      "Nado e jangadas em rios subterrâneos com estalactites",
      "Almoço buffet com sucos e smoothies energéticos ilimitados",
      "Equipamento de segurança completo (capacete e colete)"
    ],
    notIncluded: [
      "Fotos profissionais do sistema fotográfico de aventura",
      "Gorjetas"
    ],
    whatToBring: [
      "Roupa de banho e sapatilha aquática com solado antiderrapante",
      "Muda de roupa seca",
      "Protetor solar 100% biodegradável",
      "Toalha de banho",
      "Documento de identificação"
    ],
    importantInfo: [
      "O parque exige calçados fechados ou sapatilhas aquáticas amarradas para todas as atividades",
      "Peso mínimo para tirolesa: 40 kg; peso máximo: 136 kg"
    ],
    itinerary: [
      {
        order: 1,
        time: "09:00",
        title: "Chegada a Xplor",
        description: "Equipamento, orientações de segurança e início dos circuitos aéreos."
      },
      {
        order: 2,
        time: "10:00",
        title: "Circuitos de Tirolesas",
        description: "Descidas velozes sobre a copa das árvores com aterrissagem em cenotes cristalinos."
      },
      {
        order: 3,
        time: "12:30",
        title: "Veículos Anfíbios",
        description: "Pilote através de trilhas na floresta maia, pontes suspensas e cavernas."
      },
      {
        order: 4,
        time: "14:00",
        title: "Buffet Energético 'El Troglodita'",
        description: "Almoço saudável e completo com opções grelhadas, saladas e estação de smoothies naturais."
      },
      {
        order: 5,
        time: "15:30",
        title: "Rios Subterrâneos & Jangadas",
        description: "Exploração de cavernas milenares cercadas de formações rochosas exuberantes."
      },
      {
        order: 6,
        time: "17:00",
        title: "Retorno aos Hotéis",
        description: "Embarque no transporte de volta a Cancún e Riviera Maya."
      }
    ],
    highlights: [
      "As tirolesas mais altas e emocionantes do Caribe Mexicano",
      "Condução de veículos anfíbios por trilhas reais na selva",
      "Gastronomia farta e saudável com bebidas naturais ilimitadas",
      "Infraestrutura de ponta com segurança internacional"
    ],
    idealFor: [
      "Viajantes em busca de adrenalina, aventura e contato com a natureza",
      "Famílias com adolescentes e grupos de amigos dinâmicos"
    ],
    accessibility: "Acessibilidade moderada. Exige caminhada por trilhas naturais e cavernas.",
    cancellationPolicy: "Cancelamento gratuito com até 24 horas de antecedência.",
    relatedTours: ["xelha", "xcaret", "tulum"]
  },
  {
    slug: "cozumel-el-cielo",
    name: "Cozumel & El Cielo",
    category: "Snorkeling & Mar · Dia Todo",
    shortDescription:
      "Mergulho nos recifes de corais protegidos e o espetacular banco de areia El Cielo, santuário de estrelas-do-mar.",
    description:
      "Embarque em uma jornada marítima inesquecível rumo aos tesouros subaquáticos de Cozumel. Conhecido internacionalmente por suas águas com visibilidade inacreditável, o arquipélago abriga o banco de areia El Cielo — um santuário raso onde centenas de estrelas-do-mar repousam em areias brancas como pó —, além de recifes repletos de tartarugas, arraias e corais multicoloridos.",
    heroImage: "/passeios/cozumel-e-al-cielo.jpg",
    gallery: [
      "/passeios/cozumel-e-al-cielo.jpg",
      "/passeios/isla-mujeres.jpg",
      "/images/img-08-2cf9c873.png"
    ],
    location: "Ilha de Cozumel, Quintana Roo, México",
    duration: "Dia todo (aprox. 9 horas)",
    startTime: "08:00",
    endTime: "17:30",
    priceFrom: 520,
    currency: "R$",
    adultPrice: 520,
    childPrice: 520,
    infantPrice: 410,
    infant04Price: 0,
    infantPolicy: "Infantes de 0 a 4 anos possuem embarque cortesia (gratuito). De 5 a 11 anos contam com tarifa especial com desconto.",
    minimumAge: "Livre para todas as idades",
    included: [
      "Transporte terrestre e travessia marítima para Cozumel",
      "Passeio de catamarã ou barco confortável pelos recifes e El Cielo",
      "Equipamento de snorkeling higienizado com colete salva-vidas",
      "Bebidas a bordo (cervejas, coquetéis, refrigerantes e água mineral)",
      "Snacks, frutas frescas e almoço leve servido a bordo ou clube de praia",
      "Guia e marinheiro credenciados"
    ],
    notIncluded: [
      "Taxa governamental de parque marinho e cais",
      "Fotos subaquáticas profissionais",
      "Gorjetas da tripulação"
    ],
    whatToBring: [
      "Roupa de banho, toalha e chapéu",
      "Camisa com proteção UV para snorkeling",
      "Protetor solar biodegradável ou ecológico",
      "Dinheiro para taxa portuária e pequenos gastos"
    ],
    importantInfo: [
      "É estritamente proibido tocar ou retirar as estrelas-do-mar da água em El Cielo",
      "A visibilidade subaquática pode variar de acordo com ventos e correntes marítimas"
    ],
    itinerary: [
      {
        order: 1,
        time: "08:00",
        title: "Embarque e Travessia",
        description: "Encontro nos hotéis e travessia panorâmica de balsa para Cozumel."
      },
      {
        order: 2,
        time: "10:00",
        title: "Snorkeling nos Recifes Palancar e Columbia",
        description: "Mergulho assistido em recifes célebres com rica biodiversidade marinha."
      },
      {
        order: 3,
        time: "12:00",
        title: "O Paraíso de El Cielo",
        description: "Navegação até o banco de areia com águas rasas, calmas e estrelas-do-mar."
      },
      {
        order: 4,
        time: "13:30",
        title: "Almoço e El Cielito",
        description: "Parada em piscina natural com águas cristalinas, arraias dóceis e almoço com bebidas a bordo."
      },
      {
        order: 5,
        time: "16:00",
        title: "Retorno a Cancún",
        description: "Travessia de volta ao continente e traslado aos hotéis com chegada prevista às 17h30."
      }
    ],
    highlights: [
      "Visita ao mítico santuário de estrelas-do-mar El Cielo",
      "Snorkeling em um dos cinco melhores destinos de mergulho do planeta",
      "Águas mornas e ultra-transparentes ideais para fotos",
      "Tripulação acolhedora com serviço de bordo atencioso"
    ],
    idealFor: [
      "Amantes de vida marinha, snorkeling e praias cristalinas",
      "Casais e famílias que desejam uma experiência náutica completa"
    ],
    accessibility: "Acessibilidade moderada. O embarque e desembarque nas embarcações exigem pequenos degraus.",
    cancellationPolicy: "Cancelamento gratuito com até 24 horas de antecedência.",
    relatedTours: ["isla-mujeres", "xelha", "tulum"]
  },
  {
    slug: "coco-bongo",
    name: "Coco Bongo Show & Disco",
    category: "Vida Noturna · Show & Disco",
    shortDescription:
      "O espetáculo mais icônico de Cancún: acrobatas, tributos musicais ao vivo e festa eletrizante na zona hoteleira.",
    description:
      "Coco Bongo não é apenas uma balada tradicional: é um gigantesco teatro de entretenimento com tecnologia de ponta, acrobatas suspensos em cordas de tecido, tributos musicais aos maiores astros do pop e rock mundial, chuva de confetes, efeitos especiais e serviço open bar ininterrupto no coração da agitação noturna de Cancún.",
    heroImage: "/passeios/coco-bongo-show-disco.jpg",
    gallery: [
      "/passeios/coco-bongo-show-disco.jpg",
      "/images/img-08-2cf9c873.png",
      "/passeios/chichen-itza.jpg"
    ],
    location: "Zona Hoteleira de Cancún, México",
    duration: "Noite (aprox. 5 a 6 horas)",
    startTime: "21:30",
    endTime: "03:00",
    priceFrom: 520,
    currency: "R$",
    adultPrice: 520,
    childPrice: 520,
    infantPrice: 0,
    infant04Price: 0,
    infantPolicy: "Evento noturno exclusivo para maiores de 18 anos. Entrada restrita a adultos com documento de identidade oficial.",
    minimumAge: "Exclusivo para maiores de 18 anos",
    included: [
      "Ingresso com acesso à casa de espetáculos Coco Bongo",
      "Mais de 10 apresentações e shows musicais ao vivo durante a noite",
      "Open bar de bebidas nacionais selecionadas",
      "Chuva de balões, confetes e projeções visuais de alta definição"
    ],
    notIncluded: [
      "Transporte de ida e volta (Zona Hoteleira de fácil acesso por táxi ou ônibus público)",
      "Bebidas de marcas premium importadas (disponíveis no upgrade VIP / Gold Member)",
      "Mesas reservadas com garçom exclusivo (opcional)",
      "Gorjetas"
    ],
    whatToBring: [
      "Documento de identificação oficial com foto original (passaporte ou RG)",
      "Traje esporte fino / festa confortável",
      "Cartão de crédito ou dinheiro para consumos extras"
    ],
    importantInfo: [
      "A entrada é terminantemente proibida para menores de 18 anos",
      "Recomenda-se chegar com 30 minutos de antecedência para acomodação rápida"
    ],
    itinerary: [
      {
        order: 1,
        time: "21:30",
        title: "Abertura das Portas",
        description: "Recepção, check-in e acomodação com serviço de boas-vindas do open bar."
      },
      {
        order: 2,
        time: "22:30",
        title: "Início dos Grandes Shows",
        description: "Coreografias espetaculares, trapezistas e tributos musicais consagrados (Queen, Michael Jackson, filmes célebres)."
      },
      {
        order: 3,
        time: "00:00",
        title: "Ponto Alto da Festa",
        description: "Momento eletrizante com chuva de serpentinas, fumaça criogênica e hits contemporâneos."
      },
      {
        order: 4,
        time: "03:00",
        title: "Encerramento da Noite",
        description: "Fim do espetáculo e retorno tranquilo até a sua hospedagem."
      }
    ],
    highlights: [
      "O show noturno mais famoso e premiado de toda a América Latina",
      "Acrobacias aéreas sincronizadas e tributos de nível internacional",
      "Open bar nacional incluso com serviço contínuo a noite toda",
      "Ambiente seguro e vibrante no centro da festa de Cancún"
    ],
    idealFor: [
      "Grupos de amigos, despedidas de solteiro e casais que amam festa e espetáculo",
      "Quem quer ter uma noite inesquecível e energética em Cancún"
    ],
    accessibility: "Acessibilidade parcial com elevadores para setores superiores sob solicitação.",
    cancellationPolicy: "Cancelamento gratuito com até 24 horas de antecedência.",
    relatedTours: ["isla-mujeres", "xcaret", "chichen-itza"]
  }
];

export function getTourBySlug(slug: string): Tour | undefined {
  return TOURS.find((tour) => tour.slug === slug);
}

export function getAllTours(): Tour[] {
  return TOURS;
}

export function getRelatedTours(tour: Tour): Tour[] {
  return tour.relatedTours
    .map((slug) => getTourBySlug(slug))
    .filter((t): t is Tour => t !== undefined && t.slug !== tour.slug)
    .slice(0, 3);
}
