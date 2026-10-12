# -*- coding: utf-8 -*-
"""
Script de geração e consolidação do catálogo canônico de passeios Tio Nenê.
Integra os dados de 03_DEVELOPER_HANDOFF com o design system do site Next.js e Supabase.
"""
import os
import json

TOURS_DATA = [
  {
    "slug": "chichen-itza",
    "name": "Chichén Itzá & Cenote Sagrado",
    "category": "Cultura & História · Dia Todo",
    "categories": ["cenotes", "historico", "natureza"],
    "shortDescription": "Explore a mística pirâmide maia com guia historiador privativo e banho nas águas cristalinas do cenote Ik Kil.",
    "description": "Explore uma das Sete Maravilhas do Mundo Moderno em uma experiência que une a grandiosidade da civilização maia à contemplação da natureza mexicana. Com acompanhamento de guia historiador credenciado, descubra os segredos da astronomia, arquitetura e espiritualidade de Chichén Itzá. Em seguida, desfrute de um mergulho refrescante nas águas sagradas de um cenote ancestral cercado por vegetação exuberante e saboreie um autêntico almoço com as delícias da gastronomia yucateca.",
    "heroImage": "/passeios/chichen-itza.jpg",
    "gallery": [
      "/passeios/chichen-itza.jpg",
      "/passeios/ruinas-de-tulum-cenotes.jpg",
      "/images/img-08-2cf9c873.png",
      "/passeios/isla-mujeres.jpg"
    ],
    "location": "Yucatán / Riviera Maya, México",
    "duration": "Dia todo (aprox. 10 horas)",
    "startTime": "07:00",
    "endTime": "17:30",
    "priceFrom": 650,
    "currency": "R$",
    "adultPrice": 650,
    "childPrice": 650,
    "infantPrice": 480,
    "infant04Price": 0,
    "infantPolicy": "Infantes de 0 a 4 anos possuem entrada cortesia (gratuito). De 5 a 11 anos possuem tarifa reduzida de infante.",
    "minimumAge": "Livre para todas as idades",
    "included": [
      "Transporte ida e volta em van executiva climatizada com saída do seu hotel",
      "Guia historiador certificado bilíngue (português/espanhol)",
      "Entrada expressa sem filas ao sítio arqueológico de Chichén Itzá",
      "Visita e tempo livre para banho no Cenote Ik Kil ou cenote equivalente",
      "Almoço buffet típico da culinária yucateca",
      "Colete salva-vidas no cenote e parada fotográfica no centro histórico de Valladolid"
    ],
    "notIncluded": [
      "Bebidas alcoólicas e refrigerantes engarrafados no almoço",
      "Taxa de preservação de Valladolid (quando aplicável)",
      "Fotografias profissionais e compras pessoais",
      "Gorjetas da tripulação e guias locais (opcional)"
    ],
    "whatToBring": [
      "Roupas leves de algodão ou linho e calçados confortáveis para caminhada",
      "Roupa de banho já por baixo e toalha de banho para o cenote",
      "Chapéu, boné e óculos escuros para proteção contra o sol na esplanada maia",
      "Protetor solar biodegradável (obrigatório para preservação das águas dos cenotes)",
      "Documento oficial de identificação com foto e voucher da reserva digital",
      "Dinheiro em espécie (pesos ou dólares) para bebidas extras, artesanato e gorjetas"
    ],
    "importantInfo": [
      "Embarque pontual no lobby do hotel com apresentação do voucher de confirmação.",
      "O uso de colete salva-vidas é obrigatório para banho no cenote.",
      "O sítio arqueológico possui terreno plano com cascalho e áreas descampadas.",
      "Não é permitida a entrada de tripés profissionais ou drones sem autorização federal do INAH."
    ],
    "itinerary": [
      { "order": 1, "time": "07:00", "title": "Embarque Exclusivo no Hotel", "description": "Saída em van confortável com ar-condicionado em direção ao interior da península de Yucatán." },
      { "order": 2, "time": "09:30", "title": "Visita Guiada a Chichén Itzá", "description": "Chegada antes do calor intenso. Tour imersivo pela Pirâmide de Kukulcán, Campo de Jogo de Bola e Observatório astronômico El Caracol." },
      { "order": 3, "time": "12:30", "title": "Almoço Buffet Típico", "description": "Gastronomia tradicional mexicana com cochinita pibil, tacos, saladas frescas e sobremesas regionais." },
      { "order": 4, "time": "14:00", "title": "Mergulho no Cenote Sagrado", "description": "Momento de renovação nas águas azuis e cristalinas do cenote rodeado por raízes suspensas e paredões rochosos." },
      { "order": 5, "time": "16:00", "title": "Parada Cultural em Valladolid", "description": "Breve passeio pela praça central e pela imponente Igreja de San Servacio na pitoresca cidade colonial." },
      { "order": 6, "time": "17:30", "title": "Retorno ao Hotel", "description": "Viagem de volta tranquila com desembarque direto no seu resort em Cancún ou Riviera Maya." }
    ],
    "highlights": [
      "Pirâmide de Kukulcán com guia historiador credenciado",
      "Banho revigorante nas águas cristalinas do cenote Ik Kil",
      "Gastronomia ancestral yucateca em restaurante selecionado",
      "Visita panorâmica à charmosa cidade colonial de Valladolid"
    ],
    "idealFor": [
      "Famílias e casais que buscam uma experiência cultural profunda sem estresse",
      "Viajantes que valorizam pontualidade, conforto térmico e história autêntica"
    ],
    "accessibility": "Acessibilidade parcial. O sítio arqueológico conta com caminhos planos de terra batida; o cenote possui escadarias de pedra que exigem mobilidade intermediária.",
    "cancellationPolicy": "Cancelamento gratuito e reembolso integral com até 24 horas de antecedência ao horário do passeio.",
    "faqs": [
      {
        "question": "O que devemos levar para o dia de Chichén Itzá e cenote?",
        "answer": "Recomendamos roupas leves, chapéu ou boné, óculos escuros, calçado firme para caminhada nas ruínas, roupa de banho, toalha de praia e protetor solar biodegradável para nadar no cenote."
      },
      {
        "question": "As bebidas estão inclusas durante o almoço buffet?",
        "answer": "O almoço buffet regional está totalmente incluso. Bebidas engarrafadas e alcoólicas costumam ser cobradas à parte no restaurante."
      },
      {
        "question": "Qual é a ordem habitual das paradas?",
        "answer": "A saída ocorre cedo para chegarmos às ruínas antes do pico do calor e das excursões em massa. Em seguida seguimos para o almoço típico, o mergulho relaxante no cenote e a parada cultural em Valladolid."
      }
    ],
    "relatedTours": ["chichen-itza-deluxe", "tulum-coba", "xenotes"]
  },

  {
    "slug": "chichen-itza-deluxe",
    "name": "Chichén Itzá Deluxe & 2 Cenotes",
    "category": "Cultura & Exclusividade · Dia Todo",
    "categories": ["cenotes", "historico", "natureza"],
    "shortDescription": "Versão premium de Chichén Itzá com visita a dois cenotes sagrados (aberto e subterrâneo) e kit de snacks a bordo.",
    "description": "Uma jornada enriquecida para os amantes da arqueologia e das belezas naturais de Yucatán. Além do tour completo pelas lendas maias em Chichén Itzá, você vivencia o contraste de dois cenotes mágicos: um cenote de luz aberta com vegetação suspensa e uma gruta subterrânea com águas calmas. Inclui serviço de bordo refinado e almoço de alta gastronomia.",
    "heroImage": "/passeios/chichen-itza.jpg",
    "gallery": [
      "/passeios/chichen-itza.jpg",
      "/passeios/ruinas-de-tulum-cenotes.jpg",
      "/images/img-08-2cf9c873.png"
    ],
    "location": "Yucatán, México",
    "duration": "Dia todo (aprox. 11 horas)",
    "startTime": "06:30",
    "endTime": "18:00",
    "priceFrom": 780,
    "currency": "R$",
    "adultPrice": 780,
    "childPrice": 780,
    "infantPrice": 520,
    "infant04Price": 0,
    "infantPolicy": "Cortesia para infantes de 0 a 4 anos no colo. De 5 a 11 anos possuem tarifa reduzida.",
    "minimumAge": "Livre para todas as idades",
    "included": [
      "Transporte premium em van executiva com assentos confortáveis e Wi-Fi",
      "Kit snack de boas-vindas e bebidas não alcoólicas a bordo",
      "Acesso e guia privativo em Chichén Itzá",
      "Entrada em 2 Cenotes sagrados exclusivos",
      "Almoço buffet gourmet yucateco",
      "Coletes salva-vidas inclusos em ambos os cenotes",
      "Visita ao centro histórico de Valladolid"
    ],
    "notIncluded": [
      "Bebidas alcoólicas",
      "Taxa governamental de câmeras profissionais (INAH)",
      "Gorjetas voluntárias"
    ],
    "whatToBring": [
      "Roupa leve, sapatilha aquática ou tênis confortável",
      "Duas mudas de roupa ou roupa de banho extra",
      "Toalhas de banho",
      "Protetor solar biodegradável e repelente natural",
      "Documento de identificação com foto"
    ],
    "importantInfo": [
      "Horário de saída antecipado para garantir acesso exclusivo e silencioso.",
      "Ambos os cenotes exigem ducha prévia para preservação do ecossistema aquático."
    ],
    "itinerary": [
      { "order": 1, "time": "06:30", "title": "Embarque Premium", "description": "Saída antecipada para evitar o tráfego rodoviário com distribuição de snack kit." },
      { "order": 2, "time": "09:00", "title": "Sítio de Chichén Itzá", "description": "Tour completo pelas estruturas maias monumentais com guia arqueológico." },
      { "order": 3, "time": "12:00", "title": "Primeiro Cenote (Aberto)", "description": "Mergulho em cenote paradisíaco com luz natural e vegetação exuberante." },
      { "order": 4, "time": "13:30", "title": "Almoço Regional Gourmet", "description": "Buffet exclusivo com pratos típicos e sobremesas artesanais." },
      { "order": 5, "time": "15:00", "title": "Segundo Cenote (Gruta Caverna)", "description": "Experiência mística em cenote de águas cristalinas iluminadas por estalactites." },
      { "order": 6, "time": "16:30", "title": "Passeio em Valladolid e Retorno", "description": "Parada na praça colonial e regresso confortável ao hotel." }
    ],
    "highlights": [
      "Dois cenotes com características geológicas distintas",
      "Kit lanche a bordo na ida",
      "Guia com ritmo tranquilo e tempo livre estendido"
    ],
    "idealFor": [
      "Viajantes que querem a imersão mais completa em cenotes sem correria",
      "Apreciadores de fotografia e história ancestral"
    ],
    "accessibility": "Exige caminhar e descer degraus nos cenotes.",
    "cancellationPolicy": "Cancelamento gratuito com até 24 horas de antecedência.",
    "faqs": [
      {
        "question": "Qual a diferença entre a versão clássica e a de 2 cenotes?",
        "answer": "A versão Deluxe inclui dois cenotes sagrados (um aberto e uma caverna subterrânea), kit snack a bordo e tempo mais amplo de contemplação em cada parada."
      }
    ],
    "relatedTours": ["chichen-itza", "xenotes", "tulum-coba"]
  },

  {
    "slug": "isla-mujeres",
    "name": "Isla Mujeres Exclusiva em Catamarã",
    "category": "Ilhas & Navegação · Dia Todo",
    "categories": ["ilhas", "natureza", "aventura"],
    "shortDescription": "Navegue em catamarã pelas águas azul-turquesa do Caribe com parada para snorkeling e o encanto de Playa Norte.",
    "description": "Navegue pelas águas mais transparentes do Caribe Mexicano a bordo de um catamarã espaçoso. Desfrute da brisa marinha, música ambiente e serviço de open bar nacional durante a travessia. Faça snorkeling nos recifes de corais habitados por peixes coloridos, relaxe em um clube de praia exclusivo com almoço buffet e aproveite tempo livre para descobrir as ruelas charmosas e a deslumbrante Playa Norte.",
    "heroImage": "/passeios/isla-mujeres.jpg",
    "gallery": [
      "/passeios/isla-mujeres.jpg",
      "/images/img-08-2cf9c873.png",
      "/passeios/cozumel-e-al-cielo.jpg"
    ],
    "location": "Isla Mujeres, Quintana Roo, México",
    "duration": "Dia todo (aprox. 8 horas)",
    "startTime": "08:30",
    "endTime": "17:00",
    "priceFrom": 490,
    "currency": "R$",
    "adultPrice": 490,
    "childPrice": 490,
    "infantPrice": 360,
    "infant04Price": 0,
    "infantPolicy": "Crianças de 0 a 4 anos não pagam a navegação. Menores de 5 a 11 anos pagam tarifa infantil.",
    "minimumAge": "Livre para navegação; snorkeling a partir de 10 anos",
    "included": [
      "Transporte ida e volta do hotel até a marina de embarque",
      "Passeio de catamarã com tripulação experiente e marinheiros certificados",
      "Open bar nacional a bordo (cervejas, tequila, rum, vodka, sucos e água)",
      "Parada para snorkeling nos recifes com máscara, tubo novo e colete",
      "Almoço buffet em Beach Club privado na ilha",
      "Tempo livre no centro de Isla Mujeres e na famosa Playa Norte"
    ],
    "notIncluded": [
      "Taxa de preservação marítima e cais federal (paga no check-in da marina em espécie)",
      "Aluguel de carrinho de golfe na ilha (opcional durante o tempo livre)",
      "Toalhas de banho e fotografias profissionais a bordo"
    ],
    "whatToBring": [
      "Roupa de banho e saída de praia confortável",
      "Toalha de banho (os catamarãs não fornecem toalhas)",
      "Protetor solar biodegradável e óculos de sol com cordão",
      "Documento de identificação com foto",
      "Dinheiro em espécie para taxa do cais, aluguel de carrinho de golfe e gorjetas"
    ],
    "importantInfo": [
      "Snorkel sujeito às condições meteorológicas e bandeiras de segurança marítima.",
      "Para passageiros em hotéis diferentes que queiram o mesmo catamarã, solicite no check-in na marina.",
      "Atividade de snorkeling em mar aberto não recomendada para gestantes ou pessoas com problemas cardíacos graves."
    ],
    "itinerary": [
      { "order": 1, "time": "08:30", "title": "Check-in na Marina e Embarque", "description": "Boas-vindas da tripulação, briefing de segurança e partida pelo mar caribenho." },
      { "order": 2, "time": "10:00", "title": "Snorkeling no Recife de Corais", "description": "Mergulho guiado sobre cardumes tropicais com equipamentos esterilizados." },
      { "order": 3, "time": "12:00", "title": "Beach Club & Almoço Buffet", "description": "Desembarque no clube de praia privativo em Isla Mujeres para almoço relaxante." },
      { "order": 4, "time": "14:00", "title": "Tempo Livre em Playa Norte", "description": "Passeio pelo centrinho de artesanato ou banho de mar calmo em Playa Norte." },
      { "order": 5, "time": "16:00", "title": "Navegação Festiva de Retorno", "description": "Voo de spinnaker (se o vento permitir), open bar e música com vista para a costa de Cancún." },
      { "order": 6, "time": "17:00", "title": "Chegada à Marina e Retorno ao Hotel", "description": "Desembarque e transporte de retorno ao resort." }
    ],
    "highlights": [
      "Navegação cênica com vista para os tons de azul de Cancún",
      "Snorkeling com guias e equipamentos completos",
      "Tempo livre em uma das 10 praias mais bonitas do mundo (Playa Norte)",
      "Clube de praia exclusivo com espreguiçadeiras e buffet"
    ],
    "idealFor": [
      "Casais, grupos de amigos e famílias que amam mar, música e praias caribenhas",
      "Quem busca um dia descontraído com bebida liberada e visual paradisíaco"
    ],
    "accessibility": "Acessibilidade moderada no cais e catamarã. O desembarque na praia requer locomoção curta.",
    "cancellationPolicy": "Cancelamento gratuito até 24h antes. Em caso de fechamento do porto pela autoridade marítima por mau tempo, é garantida remarcação prioritária ou reembolso total.",
    "faqs": [
      {
        "question": "As toalhas são fornecidas a bordo do catamarã?",
        "answer": "Não, as toalhas não estão inclusas nos contratos de catamarã. É indispensável trazer sua própria toalha do hotel."
      },
      {
        "question": "Podemos alugar um carrinho de golfe para conhecer a ilha?",
        "answer": "Sim! Durante as 2 horas de tempo livre no centro, você pode alugar carrinhos de golfe facilmente para explorar a Ponta Sul ou passear pela orla."
      },
      {
        "question": "O que acontece se o porto fechar por conta do clima?",
        "answer": "Quando a Capitania dos Portos decreta fechamento do porto por ventos fortes, a saída é remarcada para a melhor data da sua estadia ou reembolsada integralmente."
      }
    ],
    "relatedTours": ["isla-mujeres-vip", "royal-garrafon", "cozumel-el-cielo"]
  },

  {
    "slug": "isla-mujeres-vip",
    "name": "Isla Mujeres Pleasure VIP & Beach Club",
    "category": "Ilhas & Exclusividade · Dia Todo",
    "categories": ["ilhas", "natureza"],
    "shortDescription": "Experiência VIP em catamarã de alto padrão com bar de destilados selecionados e acesso ao setor exclusivo do Beach Club.",
    "description": "Uma versão refinada da travessia para Isla Mujeres. Navegue em catamarãs com capacidade reduzida para maior conforto, aproveite bar com marcas internacionais, almoço servido em área VIP privativa com camas balinesas e atendimento de garçom personalizado.",
    "heroImage": "/passeios/isla-mujeres.jpg",
    "gallery": [
      "/passeios/isla-mujeres.jpg",
      "/images/img-08-2cf9c873.png"
    ],
    "location": "Isla Mujeres, Quintana Roo, México",
    "duration": "Dia todo (aprox. 8 horas)",
    "startTime": "09:00",
    "endTime": "17:30",
    "priceFrom": 680,
    "currency": "R$",
    "adultPrice": 680,
    "childPrice": 680,
    "infantPrice": 450,
    "infant04Price": 0,
    "infantPolicy": "0 a 4 anos cortesia.",
    "minimumAge": "Livre para navegação; 10 anos para snorkel",
    "included": [
      "Transporte executivo privativo ou semi-privativo até a marina",
      "Catamarã com capacidade reduzida e serviço VIP",
      "Open bar premium com destilados internacionais e coquetéis autorais",
      "Equipamentos de snorkel higienizados e guias dedicados",
      "Setor VIP exclusivo no Beach Club com espreguiçadeiras nobres",
      "Almoço buffet gourmet com cortes e opções de frutos do mar"
    ],
    "notIncluded": [
      "Taxa de cais federal",
      "Aluguel de carrinho de golfe na ilha",
      "Fotos profissionais"
    ],
    "whatToBring": [
      "Roupas de banho de qualidade, saída de praia e toalha",
      "Protetor solar biodegradável",
      "Dinheiro em espécie para taxa do cais e compras"
    ],
    "importantInfo": [
      "Serviço indicado para casais e famílias que prezam por tranquilidade e privacidade."
    ],
    "itinerary": [
      { "order": 1, "time": "09:00", "title": "Embarque VIP", "description": "Recepção com drink de boas-vindas e partida sem filas." },
      { "order": 2, "time": "10:30", "title": "Snorkel em Recifes Preservados", "description": "Parada em pontos com visibilidade cristalina e menos embarcações." },
      { "order": 3, "time": "12:30", "title": "Almoço e Descanso no Beach Club VIP", "description": "Área reservada com conforto total e vista para o mar azul." },
      { "order": 4, "time": "15:00", "title": "Tempo Livre na Ilha", "description": "Exploração dos encantos de Playa Norte." },
      { "order": 5, "time": "17:30", "title": "Pôr do Sol no Retorno", "description": "Navegação suave com serviço de coquetelaria fina." }
    ],
    "highlights": [
      "Menor quantidade de passageiros no catamarã",
      "Bebidas premium e área VIP no beach club",
      "Atendimento atencioso e ritmo sem pressa"
    ],
    "idealFor": [
      "Casais em lua de mel, aniversários e viajantes que preferem sossego e serviço de primeira linha"
    ],
    "accessibility": "Acessibilidade parcial.",
    "cancellationPolicy": "Cancelamento gratuito até 24 horas antes do passeio.",
    "faqs": [
      {
        "question": "Quais bebidas estão no Open Bar VIP?",
        "answer": "Marcas internacionais de tequila, vodka, rum, whisky e cervejas geladas, além de coquetéis preparados na hora."
      }
    ],
    "relatedTours": ["isla-mujeres", "royal-garrafon", "columbus-jantar-romantico"]
  },

  {
    "slug": "xcaret",
    "name": "Parque Eco-Arqueológico Xcaret Plus",
    "category": "Natureza & Cultura · Dia Todo",
    "categories": ["natureza", "historico", "cenotes"],
    "shortDescription": "Rios subterrâneos, aquário de recife de coral e o emocionante espetáculo folclórico que homenageia o México.",
    "description": "O parque mais emblemático e premiado do México. Viva um dia mágico nadando em três rios subterrâneos de águas cristalinas, explore o borboletário, o aviário monumental, o aquário de corais e a recriação de uma aldeia maia. Ao entardecer, emocione-se com o grandioso show 'Xcaret México Espectacular', com mais de 300 artistas celebrando a música, a história e as tradições de todas as regiões mexicanas.",
    "heroImage": "/passeios/xcaret.jpg",
    "gallery": [
      "/passeios/xcaret.jpg",
      "/passeios/xel-ha.jpg",
      "/images/img-08-2cf9c873.png"
    ],
    "location": "Playa del Carmen / Riviera Maya, México",
    "duration": "Dia todo (aprox. 12 horas)",
    "startTime": "07:30",
    "endTime": "22:00",
    "priceFrom": 790,
    "currency": "R$",
    "adultPrice": 790,
    "childPrice": 790,
    "infantPrice": 590,
    "infant04Price": 0,
    "infantPolicy": "Entrada cortesia para crianças de 0 a 4 anos (necessário documento oficial). De 5 a 11 anos possuem 50% de desconto na tarifa do parque.",
    "minimumAge": "Livre para todas as idades",
    "included": [
      "Transporte ida e volta com ar-condicionado saindo do hotel",
      "Ingresso modalidade Xcaret Plus com acesso a mais de 50 atrações",
      "Acesso aos 3 rios subterrâneos com bolsa de segurança para transporte de pertences",
      "Almoço buffet completo com especialidades internacionais e mexicanas",
      "Bebidas não alcoólicas ilimitadas (sucos, refrigerantes e água) durante o almoço",
      "Uma cerveja inclusa por adulto durante a refeição",
      "Acesso aos vestiários privativos da Área Plus com armários e duchas",
      "Equipamento de snorkel com tubo cortesia para levar de lembrança",
      "Assento no teatro Gran Tlachco para o show México Espectacular"
    ],
    "notIncluded": [
      "Atividades opcionais com custo extra (nado com golfinhos, Sea Trek, Adrenalina, etc.)",
      "Jantar gourmet durante o espetáculo Tlachco (pode ser contratado separadamente)",
      "Fotografias automáticas do parque (passe de fotos vendido pelo Xcaret)"
    ],
    "whatToBring": [
      "Roupa de banho já por baixo, toalha e muda de roupa seca para a noite",
      "Sapatilhas aquáticas (water shoes) confortáveis para caminhar e nadar",
      "Protetor solar e repelente 100% biodegradáveis (compostos químicos são retidos na entrada)",
      "Mochila pequena ou bolsa impermeável",
      "Casaco leve para a noite (o teatro do show noturno pode ter brisa fresca)",
      "Documento de identificação com foto e voucher do passeio"
    ],
    "importantInfo": [
      "Menores de idade devem estar sempre acompanhados por pelo menos um adulto responsável.",
      "O parque possui grandes dimensões (caminhadas moderadas ao longo do dia).",
      "O transporte de retorno é organizado imediatamente após o encerramento do show México Espectacular."
    ],
    "itinerary": [
      { "order": 1, "time": "07:30", "title": "Transporte até o Parque", "description": "Embarque no hotel com destino à Riviera Maya." },
      { "order": 2, "time": "09:00", "title": "Chegada e Check-in na Área Plus", "description": "Acesso aos armários privativos e início das atividades aquáticas nos rios subterrâneos." },
      { "order": 3, "time": "11:30", "title": "Fauna, Flora e Cultura Maia", "description": "Visita ao Aviário, Borboletário, Aquário de Recifes e Cemitério Mexicano." },
      { "order": 4, "time": "13:30", "title": "Almoço Buffet na Área Plus", "description": "Refeição completa em restaurante de frente para o mar com sucos e cerveja." },
      { "order": 5, "time": "15:30", "title": "Praias Naturais, Lagoas e Caletas", "description": "Tempo para relaxar em redes suspensas, piscinas naturais e snorkel marinho." },
      { "order": 6, "time": "19:00", "title": "Show 'México Espectacular'", "description": "Espetáculo no Gran Tlachco com jogo de bola maia, danças folclóricas e mariachis." },
      { "order": 7, "time": "21:30", "title": "Retorno ao Hotel", "description": "Embarque organizado nos ônibus para retorno seguro ao resort." }
    ],
    "highlights": [
      "Três rios subterrâneos naturais de águas azuis transparentes",
      "Show folclórico de encerramento considerado patrimônio cultural",
      "Infraestrutura completa com alimentação e lockers inclusos",
      "Contato próximo com a fauna e flora protegidas de Quintana Roo"
    ],
    "idealFor": [
      "Famílias inteiras com crianças e idosos, casais e amantes da cultura mexicana",
      "Quem busca um dia completo, seguro e emocionante no México"
    ],
    "accessibility": "Excelente acessibilidade. O parque oferece aluguel de cadeiras de rodas, rampas em grande parte das atrações e coletes especiais para os rios.",
    "cancellationPolicy": "Cancelamento sem custos com até 48 horas de antecedência à data do passeio.",
    "faqs": [
      {
        "question": "O que devemos levar para o dia de Xcaret?",
        "answer": "Traga roupa de banho, toalha, sapatilhas aquáticas, uma muda de roupa seca para a noite, mochila leve e protetor estritamente biodegradável."
      },
      {
        "question": "Como funciona o almoço no Xcaret Plus?",
        "answer": "Inclui um almoço buffet livre com grande variedade gastronômica, refrigerantes e sucos naturais à vontade durante a refeição e 1 cerveja por adulto."
      },
      {
        "question": "Os armários e equipamentos de snorkel são cobrados à parte?",
        "answer": "Na categoria Xcaret Plus, os armários, vestiários e o equipamento de snorkel com tubo novo cortesia estão 100% inclusos."
      },
      {
        "question": "Como é organizado o retorno dos ônibus após o show?",
        "answer": "Ao término do espetáculo México Espectacular (por volta das 21h15), os guias orientam os passageiros até as plataformas de embarque para retorno direto aos seus respectivos hotéis."
      }
    ],
    "relatedTours": ["xelha", "xplor", "xenses"]
  },

  {
    "slug": "xcaret-noche",
    "name": "Xcaret Noturno & Show México Espectacular",
    "category": "Cultura & Espetáculos · Noite",
    "categories": ["noite", "historico", "natureza"],
    "shortDescription": "Visite o parque ao entardecer, assista às cerimônias maias e prestigie o maior espetáculo teatral do México.",
    "description": "Ideal para quem prefere aproveitar a manhã na praia do hotel e vivenciar a atmosfera mágica de Xcaret à noite. Entre no parque no meio da tarde, assista às danças pré-hispânicas na aldeia maia, contemple a iluminação cênica dos rios e encante-se com o show México Espectacular no teatro Gran Tlachco.",
    "heroImage": "/passeios/xcaret.jpg",
    "gallery": [
      "/passeios/xcaret.jpg",
      "/images/img-08-2cf9c873.png"
    ],
    "location": "Riviera Maya, México",
    "duration": "Fim de tarde e noite (aprox. 6 horas)",
    "startTime": "15:00",
    "endTime": "22:00",
    "priceFrom": 590,
    "currency": "R$",
    "adultPrice": 590,
    "childPrice": 590,
    "infantPrice": 420,
    "infant04Price": 0,
    "infantPolicy": "0 a 4 anos cortesia com documento oficial.",
    "minimumAge": "Livre para todas as idades",
    "included": [
      "Transporte ida e volta do resort",
      "Entrada vespertina no Parque Xcaret (a partir das 16h)",
      "Acesso às atrações culturais, aldeia maia e cemitério tradicional",
      "Assento garantido no show México Espectacular"
    ],
    "notIncluded": [
      "Almoço ou jantar (refeições compradas avulsas no parque)",
      "Uso de armários e equipamentos de mergulho"
    ],
    "whatToBring": [
      "Roupas leves e confortáveis para caminhar",
      "Casaco ou xale para a noite",
      "Câmera fotográfica ou smartphone carregado",
      "Documento com foto"
    ],
    "importantInfo": [
      "Modalidade focada no show noturno e na ambientação cultural vespertina."
    ],
    "itinerary": [
      { "order": 1, "time": "15:00", "title": "Saída do Hotel", "description": "Transporte confortável até o parque Xcaret." },
      { "order": 2, "time": "16:30", "title": "Exploração Cultural", "description": "Passeio pelo cemitério mexicano, capela de Guadalupe e danças pré-hispânicas." },
      { "order": 3, "time": "19:00", "title": "Show 'México Espectacular'", "description": "Duas horas ininterruptas de pura emoção e cultura mexicana no teatro Gran Tlachco." },
      { "order": 4, "time": "21:30", "title": "Retorno ao Hotel", "description": "Desembarque no resort." }
    ],
    "highlights": [
      "Preço mais acessível focado nas atrações noturnas",
      "O melhor show cultural da América Latina",
      "Perfeito para quem quer descansar pela manhã"
    ],
    "idealFor": [
      "Casais e viajantes que buscam uma experiência noturna cultural inesquecível"
    ],
    "accessibility": "Acessibilidade completa.",
    "cancellationPolicy": "Cancelamento gratuito com até 48h de antecedência.",
    "faqs": [
      {
        "question": "A partir de que horas é permitida a entrada?",
        "answer": "A entrada na modalidade noturna é liberada a partir das 16h, dando tempo suficiente para explorar as vilas maias antes do início do show às 19h."
      }
    ],
    "relatedTours": ["xcaret", "joya-cirque-du-soleil", "coco-bongo"]
  },

  {
    "slug": "xelha",
    "name": "Xel-Há Parque All-Inclusive",
    "category": "Aquático & Natureza · Dia Todo",
    "categories": ["natureza", "aventura", "cenotes"],
    "shortDescription": "Uma verdadeira enseada natural com snorkeling livre, tirolesas aquáticas e gastronomia completa inclusa.",
    "description": "Considerado o maior aquário natural do mundo, Xel-Há é um paraíso all-inclusive onde águas doces de rios subterrâneos se encontram com o Mar do Caribe. Flutue em boias pelo rio cercado por manguezais, mergulhe entre centenas de espécies de peixes tropicais, salte do penhasco da coragem, desça de tirolesas direto na água e suba o emocionante Farol Mirador de 40 metros para um panorama espetacular e descida em toboágua espiral.",
    "heroImage": "/passeios/xel-ha.jpg",
    "gallery": [
      "/passeios/xel-ha.jpg",
      "/passeios/xcaret.jpg",
      "/images/img-08-2cf9c873.png"
    ],
    "location": "Riviera Maya / Tulum, México",
    "duration": "Dia todo (aprox. 10 horas)",
    "startTime": "07:30",
    "endTime": "18:30",
    "priceFrom": 690,
    "currency": "R$",
    "adultPrice": 690,
    "childPrice": 690,
    "infantPrice": 520,
    "infant04Price": 0,
    "infantPolicy": "Cortesia para infantes de 0 a 4 anos. De 5 a 11 anos desconto de 50% na entrada do parque.",
    "minimumAge": "Livre para todas as idades",
    "included": [
      "Transporte de ida e volta do seu resort em van ou ônibus de luxo",
      "Regime All-Inclusive completo: café da manhã leve, almoço buffet e lanches o dia todo",
      "Open bar nacional ilimitado (cervejas, coquetéis, sucos naturais e refrigerantes)",
      "Uso ilimitado de equipamentos de snorkel com tubo cortesia",
      "Armários privativos (lockers), toalhas de banho e vestiários com duchas",
      "Passeio em boias individuais e duplas pelo rio no manguezal",
      "Subida no Farol Mirador 360° e descida em toboágua de 40 metros de altura",
      "Trilhas na selva, tirolesas aquáticas e Mundo das Crianças"
    ],
    "notIncluded": [
      "Atividades com custo extra (nado com golfinhos, arraias, Sea Trek, lancha veloz)",
      "Serviço de fotografias digitais do parque"
    ],
    "whatToBring": [
      "Roupa de banho já vestida e uma muda de roupa seca",
      "Sapatilhas aquáticas para caminhar nas pedras e decks",
      "Protetor solar e repelente 100% biodegradáveis",
      "Capa à prova d'água para celular",
      "Documento oficial com foto e voucher da reserva"
    ],
    "importantInfo": [
      "O parque oferece toalhas e armários sem custo extra (já inclusos no ingresso).",
      "Para descer no toboágua do Farol Mirador, é exigida altura mínima de 1,05m e peso máximo de 125kg."
    ],
    "itinerary": [
      { "order": 1, "time": "07:30", "title": "Saída do Hotel", "description": "Deslocamento panorâmico até a enseada natural de Xel-Há." },
      { "order": 2, "time": "09:00", "title": "Café da Manhã e Acesso aos Lockers", "description": "Retirada do kit de toalhas e snorkel, seguido por café da manhã com vista para a caleta." },
      { "order": 3, "time": "10:30", "title": "Descida de Boia pelo Rio", "description": "Flutuação calma entre manguezais ancestrais com paradas para salto de pedra e tirolesas." },
      { "order": 4, "time": "12:30", "title": "Snorkel Livre e Farol Mirador", "description": "Encontro com peixes caribenhos e vista panorâmica de 360° no topo do farol." },
      { "order": 5, "time": "14:00", "title": "Almoço Buffet & Open Bar", "description": "Quatro restaurantes temáticos com gastronomia mexicana, internacional e frutos do mar." },
      { "order": 6, "time": "16:00", "title": "Redário e Relaxamento", "description": "Descanso sob coqueiros com coquetéis tropicais até o encerramento do parque." },
      { "order": 7, "time": "17:30", "title": "Embarque de Retorno", "description": "Chegada ao resort no início da noite." }
    ],
    "highlights": [
      "Comida e bebidas liberadas o dia todo sem nenhuma preocupação",
      "Toalhas, armários e equipamentos de snorkel já 100% inclusos",
      "Ideal para crianças e famílias relaxarem na água",
      "Toboágua gigante do Farol Mirador com vista deslumbrante"
    ],
    "idealFor": [
      "Famílias com crianças de todas as idades, grupos de amigos e quem adora comer bem e nadar o dia todo"
    ],
    "accessibility": "Excelente acessibilidade com calçadões planos, cadeiras anfíbias e áreas com sombra contínua.",
    "cancellationPolicy": "Cancelamento gratuito até 48 horas antes da data da atividade.",
    "faqs": [
      {
        "question": "É necessário levar toalha de banho para o Xel-Há?",
        "answer": "Não! Diferente de outros parques, o Xel-Há já inclui toalhas limpas e armários privativos no pacote All-Inclusive."
      },
      {
        "question": "As bebidas e a comida são realmente à vontade?",
        "answer": "Sim, todas as refeições (café da manhã, almoço buffet, petiscos) e bebidas alcoólicas e não alcoólicas nacionais são ilimitadas ao longo de todo o dia."
      }
    ],
    "relatedTours": ["xcaret", "xplor", "xenotes"]
  },

  {
    "slug": "xplor",
    "name": "Xplor Aventura & Tirolesas",
    "category": "Aventura & Adrenalina · Dia Todo",
    "categories": ["aventura", "natureza"],
    "shortDescription": "Tirolesas nas alturas sobre a selva maia, veículos anfíbios e jangadas em cavernas repletas de estalactites.",
    "description": "Viva a maior aventura da Riviera Maya em um parque subterrâneo e aéreo incomparável. Voe pelos dois circuitos de tirolesas mais altos da região (terminando com pouso na água), pilote veículos anfíbios 4x4 por trilhas na selva densa e cavernas inundadas, reme em jangadas individuais sob milhares de estalactites e nade em rios subterrâneos ancestrais com temperatura agradável.",
    "heroImage": "/passeios/Tirolesas.jpg",
    "gallery": [
      "/passeios/Tirolesas.jpg",
      "/passeios/xel-ha.jpg",
      "/passeios/xcaret.jpg"
    ],
    "location": "Playa del Carmen, México",
    "duration": "Dia todo (aprox. 8 horas)",
    "startTime": "08:00",
    "endTime": "17:00",
    "priceFrom": 760,
    "currency": "R$",
    "adultPrice": 760,
    "childPrice": 760,
    "infantPrice": 570,
    "infant04Price": 0,
    "infantPolicy": "Idade mínima obrigatória para entrada de 5 anos completos. Crianças de 5 a 11 anos possuem 50% de desconto.",
    "minimumAge": "5 anos de idade",
    "included": [
      "Transporte ida e volta do hotel",
      "Dois circuitos completos de tirolesas (incluindo a mais alta de Cancún)",
      "Condução de veículos anfíbios por trilhas e cavernas",
      "Remo em jangadas em rios de estalactites",
      "Nado em rio subterrâneo com colete salva-vidas",
      "Almoço buffet com carnes nobres, hambúrgueres artesanais, saladas e sobremesas",
      "Estações contínuas com smoothies, sucos de frutas tropicais e biscoitos",
      "Armário privativo, capacete de segurança obrigatório e vestiários"
    ],
    "notIncluded": [
      "Pacote de fotografias oficiais do parque",
      "Sapatilhas aquáticas (à venda nas lojas do parque caso não leve a sua)"
    ],
    "whatToBring": [
      "Sapatilhas aquáticas (water shoes) que fiquem bem firmes nos pés (obrigatório para tirolesas)",
      "Bermuda leve e camiseta confortável para usar sob o arnês da tirolesa",
      "Roupa de banho e toalha de banho para a saída",
      "Protetor solar biodegradável e repelente",
      "Voucher de confirmação e documento com foto"
    ],
    "importantInfo": [
      "Idade mínima de 5 anos completos. Para pilotar os veículos anfíbios, é exigida idade mínima de 18 anos e habilitação válida.",
      "Peso mínimo para tirolesa: 40 kg; peso máximo: 136 kg.",
      "Não recomendado para gestantes ou pessoas com histórico de cirurgias cardíacas recentes."
    ],
    "itinerary": [
      { "order": 1, "time": "08:00", "title": "Transporte até o Parque", "description": "Embarque no hotel em direção ao coração da Riviera Maya." },
      { "order": 2, "time": "09:30", "title": "Equipamentos e Tirolesas", "description": "Colocação dos capacetes e circuitos de tirolesas com vista aérea panorâmica da selva." },
      { "order": 3, "time": "11:30", "title": "Veículos Anfíbios 4x4", "description": "Pilotagem emocionante por pontes suspensas, caminhos de terra e grutas inundadas." },
      { "order": 4, "time": "13:00", "title": "Buffet Energético & Smoothies", "description": "Almoço buffet farto e bebidas naturais energizantes liberadas." },
      { "order": 5, "time": "14:30", "title": "Cavernas de Estalactites e Jangadas", "description": "Remo com pás manuais e nado de contemplação sob formações geológicas milenares." },
      { "order": 6, "time": "16:30", "title": "Retorno ao Hotel", "description": "Desembarque no resort com sensação de renovação e adrenalina." }
    ],
    "highlights": [
      "Circuito de 14 tirolesas nas alturas sobre as copas das árvores",
      "Pilotagem de veículos 4x4 anfíbios reais na selva",
      "Almoço farto e estações de smoothies liberadas o dia inteiro",
      "Cavernas subterrâneas com milhares de estalactites"
    ],
    "idealFor": [
      "Famílias com adolescentes, casais e viajantes que adoram aventura com segurança de ponta"
    ],
    "accessibility": "Exige esforço físico moderado para subir as torres de tirolesa e caminhar nas cavernas.",
    "cancellationPolicy": "Cancelamento sem custos até 48 horas antes da data reservada.",
    "faqs": [
      {
        "question": "É preciso levar toalha de banho para o Xplor?",
        "answer": "Sim, recomendamos trazer sua toalha do hotel, pois no Xplor diurno as toalhas não estão inclusas no pacote base."
      },
      {
        "question": "Existe uma ordem fixa para fazer as atrações?",
        "answer": "Não! Você é livre para fazer tirolesas, veículos anfíbios, jangadas e rios subterrâneos na ordem e quantas vezes desejar ao longo do dia."
      }
    ],
    "relatedTours": ["xplor-fuego", "xelha", "atv-xperience"]
  },

  {
    "slug": "xplor-fuego",
    "name": "Xplor Fuego Noturno & Tochas",
    "category": "Aventura Noturna · Noite",
    "categories": ["aventura", "noite", "natureza"],
    "shortDescription": "Viva a emoção do Xplor sob o luar: tirolesas com anéis de fogo, veículos 4x4 iluminados por tochas e churrasco buffet.",
    "description": "Quando o sol se põe, a selva se transforma. O Xplor Fuego é a única aventura noturna da Riviera Maya iluminada exclusivamente por tochas e fogueiras. Voe pela tirolesa mais alta da região atravessando um círculo de fogo em chamas, pilote veículos anfíbios em trilhas iluminadas pela lava vermelha e nade em cavernas de estalactites misteriosas antes de saborear um buffet com churrasco (ribs ao barbecue) e sobremesas quentes.",
    "heroImage": "/passeios/Tirolesas.jpg",
    "gallery": [
      "/passeios/Tirolesas.jpg",
      "/passeios/xcaret.jpg"
    ],
    "location": "Playa del Carmen, México",
    "duration": "Noite (aprox. 6 horas)",
    "startTime": "16:30",
    "endTime": "23:00",
    "priceFrom": 720,
    "currency": "R$",
    "adultPrice": 720,
    "childPrice": 720,
    "infantPrice": 540,
    "infant04Price": 0,
    "infantPolicy": "Idade mínima de 5 anos completos.",
    "minimumAge": "5 anos de idade",
    "included": [
      "Transporte ida e volta do hotel",
      "Circuito noturno de 7 tirolesas com anéis de fogo",
      "Veículos anfíbios iluminados por tochas na selva escura",
      "Nado em caverna de lava e estalactites",
      "Jantar buffet completo com churrasco (costelinhas ao barbecue, saladas, doces)",
      "Bebidas não alcoólicas ilimitadas (café de olla, sucos e águas frescas)",
      "Capacete de segurança e armário privativo"
    ],
    "notIncluded": [
      "Pacote de fotografias oficiais",
      "Bebidas alcoólicas"
    ],
    "whatToBring": [
      "Sapatilhas aquáticas e bermuda confortável",
      "Toalha de banho e roupa seca para a volta",
      "Casaco leve para a noite"
    ],
    "importantInfo": [
      "A iluminação por tochas cria uma atmosfera cenográfica única e segura.",
      "Para dirigir o anfíbio, 18 anos e habilitação são obrigatórios."
    ],
    "itinerary": [
      { "order": 1, "time": "16:30", "title": "Saída no Fim de Tarde", "description": "Embarque no hotel rumo à selva mágica de Xplor." },
      { "order": 2, "time": "17:30", "title": "Acendimento das Tochas e Tirolesas", "description": "Início da aventura aérea no crepúsculo sobrevoando a selva iluminada por fogo." },
      { "order": 3, "time": "19:30", "title": "Trilha Noturna de Anfíbios", "description": "Condução 4x4 por caminhos escuros com tochas e cavernas fumegantes." },
      { "order": 4, "time": "20:45", "title": "Jantar das Fogueiras", "description": "Buffet delicioso com ribs, guarnições e chocolate quente." },
      { "order": 5, "time": "22:00", "title": "Nado Subterrâneo Místico", "description": "Flutuação relaxante em águas quentinhas e retorno ao hotel." }
    ],
    "highlights": [
      "Voo na tirolesa com cruzamento de círculo de fogo",
      "Menos calor e atmosfera misteriosa",
      "Jantar churrasco buffet espetacular incluso"
    ],
    "idealFor": [
      "Casais e jovens que procuram uma experiência noturna diferente de baladas"
    ],
    "accessibility": "Exige mobilidade moderada.",
    "cancellationPolicy": "Cancelamento sem custos com até 48 horas de antecedência.",
    "faqs": [
      {
        "question": "A água das cavernas é muito fria à noite?",
        "answer": "A temperatura das águas subterrâneas é constante o ano todo (cerca de 24°C), bastante agradável mesmo durante a noite."
      }
    ],
    "relatedTours": ["xplor", "coco-bongo", "joya-cirque-du-soleil"]
  },

  {
    "slug": "xenses",
    "name": "Xenses Parque Sensorial",
    "category": "Interativo & Ilusões · Meio Dia",
    "categories": ["aventura", "natureza"],
    "shortDescription": "Desafie seus sentidos com mais de 50 ilusões visuais, voo de pássaro, tirolesa e o famoso vilarejo que desafia a gravidade.",
    "description": "Um parque único no mundo dedicado a despertar todos os seus sentidos. Caminhe pelo surpreendente 'Pueblo', uma vila colonial mexicana onde subir parece descer e descer parece subir. Flutue no Rio Salgado onde é impossível afundar, banhe-se no circuito de lodo terapêutico, voe como uma ave no circuito 'Vuelo de Pájaro' e teste sua percepção no 'Xensatorium', um labirinto na escuridão total que recria diversos ecossistemas.",
    "heroImage": "/passeios/xcaret.jpg",
    "gallery": [
      "/passeios/xcaret.jpg",
      "/passeios/xel-ha.jpg"
    ],
    "location": "Playa del Carmen, México",
    "duration": "Meio dia (aprox. 5 horas)",
    "startTime": "08:30",
    "endTime": "14:00",
    "priceFrom": 490,
    "currency": "R$",
    "adultPrice": 490,
    "childPrice": 490,
    "infantPrice": 360,
    "infant04Price": 0,
    "infantPolicy": "Cortesia para infantes de 0 a 4 anos.",
    "minimumAge": "5 anos de idade",
    "included": [
      "Transporte ida e volta do hotel",
      "Acesso completo aos 2 circuitos sensoriais (Circuito sem Sentido e Circuito ConSentido)",
      "Voo de Pássaro (tirolesa deitado)",
      "Rio de Lodo (Lodorama) e Rio Salgado (Riverlaxing)",
      "Toboágua subterrâneo veloz",
      "Uso de armário privativo, vestiários e duchas"
    ],
    "notIncluded": [
      "Alimentos e bebidas (vendidos no café sensorial do parque)",
      "Pacote de fotografias interativas"
    ],
    "whatToBring": [
      "Roupa de banho e toalha",
      "Sapatilhas aquáticas",
      "Muda de roupa seca"
    ],
    "importantInfo": [
      "Duração de meio período: ideal para combinar com uma tarde livre na praia ou em Playa del Carmen."
    ],
    "itinerary": [
      { "order": 1, "time": "08:30", "title": "Saída do Hotel", "description": "Chegada rápida à Riviera Maya." },
      { "order": 2, "time": "09:30", "title": "O Vilarejo Ilusório", "description": "Fotos divertidas na cidade onde as leis da física parecem invertidas." },
      { "order": 3, "time": "11:00", "title": "Tirolesa do Pássaro e Toboágua", "description": "Voo panorâmico e mergulho no toboágua das cavernas." },
      { "order": 4, "time": "12:30", "title": "Lodorama & Relaxamento Salgado", "description": "Banho de argila suave e flutuação nas águas salgadas." },
      { "order": 5, "time": "14:00", "title": "Retorno ao Resort", "description": "Tarde livre no seu hotel." }
    ],
    "highlights": [
      "As fotos mais criativas e divertidas de toda a viagem",
      "Parque leve de meio período que não cansa excessivamente",
      "Experiência relaxante de flutuação no lodo e salmoura"
    ],
    "idealFor": [
      "Crianças, jovens, casais e criadores de conteúdo que adoram ilusões visuais"
    ],
    "accessibility": "Acessibilidade para a maioria das atrações.",
    "cancellationPolicy": "Cancelamento sem custo até 48 horas antes.",
    "faqs": [
      {
        "question": "O Xenses é cansativo?",
        "answer": "Não! Diferente do Xcaret que dura o dia inteiro, o Xenses é um passeio leve de aproximadamente 5 horas, excelente para dias em que você quer descansar à tarde."
      }
    ],
    "relatedTours": ["xoximilco", "xcaret", "xplor"]
  },

  {
    "slug": "xoximilco",
    "name": "Xoximilco Festa Mexicana Flutuante",
    "category": "Vida Noturna & Tradição · Noite",
    "categories": ["noite", "historico"],
    "shortDescription": "Navegue em barcas coloridas (trajineras) por canais festivos com mariachis, open bar de tequila e degustação gastronômica.",
    "description": "Uma celebração autêntica e alegre das tradições do México. A bordo das pitorescas 'trajineras' (embarcações típicas de madeira adornadas com flores e nomes dos estados mexicanos), você percorre canais tranquilos sob as estrelas. Desfrute de open bar de tequila, cervejas e coquetéis, experimente pratos tradicionais das diversas regiões mexicanas e cante junto com mariachis, grupos de marimba e ritmos de banda ao vivo.",
    "heroImage": "/passeios/coco-bongo-show-disco.jpg",
    "gallery": [
      "/passeios/coco-bongo-show-disco.jpg",
      "/images/img-08-2cf9c873.png"
    ],
    "location": "Cancún / Riviera Maya, México",
    "duration": "Noite (aprox. 5 horas)",
    "startTime": "18:30",
    "endTime": "23:30",
    "priceFrom": 630,
    "currency": "R$",
    "adultPrice": 630,
    "childPrice": 630,
    "infantPrice": 460,
    "infant04Price": 0,
    "infantPolicy": "Idade recomendada a partir de 5 anos.",
    "minimumAge": "5 anos de idade",
    "included": [
      "Transporte de ida e volta do resort",
      "Navegação noturna em trajinera compartilhada com anfitrião guia festivo",
      "Degustação de jantar em três tempos com receitas típicas mexicanas",
      "Open bar a bordo (tequila, cervejas mexicanas, rum, vodka, águas frescas e refrigerantes)",
      "Música tradicional ao vivo (Mariachi, Norteño, Marimba e Jarana)",
      "Jogos interativos e quermesse mexicana na chegada"
    ],
    "notIncluded": [
      "Fotografias profissionais",
      "Souvenirs artesanais"
    ],
    "whatToBring": [
      "Roupas confortáveis (calça leve ou bermuda alinhada)",
      "Repelente de insetos biodegradável",
      "Documento de identificação"
    ],
    "importantInfo": [
      "Cada trajinera acomoda até 20 pessoas com muita integração e alegria.",
      "Consumo de bebidas alcoólicas restrito a maiores de 18 anos."
    ],
    "itinerary": [
      { "order": 1, "time": "18:30", "title": "Transporte até Xoximilco", "description": "Embarque no hotel com destino à quermesse de entrada." },
      { "order": 2, "time": "19:30", "title": "Quermesse de Boas-Vindas", "description": "Jogos típicos, música e guloseimas mexicanas." },
      { "order": 3, "time": "20:00", "title": "Embarque nas Trajineras", "description": "Início da navegação pelos canais com brindes e aperitivos." },
      { "order": 4, "time": "21:00", "title": "Música Ao Vivo e Jantar Típico", "description": "Mariachis encostam barco a barco para tocar canções icônicas mexicanas." },
      { "order": 5, "time": "22:30", "title": "Baile e Desembarque", "description": "Festa no cais e regresso seguro ao resort." }
    ],
    "highlights": [
      "Mariachis autênticos tocando clássicos ao vivo no seu barco",
      "Open bar livre de tequila e coquetéis a noite inteira",
      "Clima de festa contagiante e seguro"
    ],
    "idealFor": [
      "Grupos de amigos, famílias festeiras e casais que amam música e celebração"
    ],
    "accessibility": "Acessibilidade com auxílio no embarque das barcas.",
    "cancellationPolicy": "Cancelamento sem custos com até 48 horas de antecedência.",
    "faqs": [
      {
        "question": "Crianças podem ir ao Xoximilco?",
        "answer": "Sim, crianças a partir de 5 anos são muito bem-vindas e adoram as cores, os jogos da quermesse e as músicas ao vivo."
      }
    ],
    "relatedTours": ["coco-bongo", "joya-cirque-du-soleil", "columbus-jantar-romantico"]
  },

  {
    "slug": "xenotes",
    "name": "Xenotes Oasis Maya (4 Cenotes Exclusivos)",
    "category": "Ecoturismo & Exclusividade · Dia Todo",
    "categories": ["cenotes", "natureza", "aventura"],
    "shortDescription": "O tour definitivo de cenotes: explore quatro tipos distintos de cenotes sagrados com rapel, tirolesa, caiaque e piquenique gourmet.",
    "description": "O tour mais exclusivo e requintado do Grupo Xcaret. Em grupos pequenos com atendimento personalizado, você visita quatro cenotes sagrados exclusivos no coração da selva maia, cada um representando um elemento da natureza: cenote aberto (fogo), semiaberto (água), caverna subterrânea (terra) e cenote antigo (ar). Desça de rapel assistido, deslize em tirolesas aquáticas, reme em caiaques e desfrute de um piquenique gourmet no meio da floresta.",
    "heroImage": "/passeios/ruinas-de-tulum-cenotes.jpg",
    "gallery": [
      "/passeios/ruinas-de-tulum-cenotes.jpg",
      "/passeios/chichen-itza.jpg",
      "/images/img-08-2cf9c873.png"
    ],
    "location": "Rota dos Cenotes, Puerto Morelos, México",
    "duration": "Dia todo (aprox. 9 horas)",
    "startTime": "08:00",
    "endTime": "17:00",
    "priceFrom": 840,
    "currency": "R$",
    "adultPrice": 840,
    "childPrice": 840,
    "infantPrice": 630,
    "infant04Price": 0,
    "infantPolicy": "Idade mínima de 6 anos completos.",
    "minimumAge": "6 anos de idade",
    "included": [
      "Transporte exclusivo em van executiva com ar-condicionado e grupo reduzido",
      "Guia bilíngue certificado e fotógrafo dedicado acompanhando o grupo",
      "Visita aos 4 cenotes protegidos com atividades exclusivas",
      "Descida de rapel assistido no cenote de caverna",
      "Tirolesas aquáticas sobre as águas sagradas",
      "Passeio de caiaque individual e duplo entre paredões verdes",
      "Piquenique gourmet com pães artesanais, queijos finos, frios, vinho e cerveja",
      "Café, chocolate quente, frutas frescas e biscoitos ao longo do dia",
      "Coletes salva-vidas, toalha de banho, equipamento de snorkel e armários"
    ],
    "notIncluded": [
      "Pacote de fotografias profissionais"
    ],
    "whatToBring": [
      "Roupa de banho e sapatilhas aquáticas",
      "Muda de roupa seca",
      "Protetor solar biodegradável e repelente (aplicados somente após as atividades nos cenotes)"
    ],
    "importantInfo": [
      "Grupos pequenos de até 19 pessoas por van para garantir silêncio e contato com a natureza.",
      "Idade mínima de 6 anos."
    ],
    "itinerary": [
      { "order": 1, "time": "08:00", "title": "Saída do Hotel", "description": "Embarque em van privativa com guia especializado." },
      { "order": 2, "time": "09:30", "title": "Cenote de Caverna (Lu’um - Terra)", "description": "Descida de rapel assistido nas entranhas da terra com banho místico." },
      { "order": 3, "time": "11:15", "title": "Cenote Semiaberto (Ha’ - Água)", "description": "Passeio de caiaque e nado de observação de formações rochosas aquáticas." },
      { "order": 4, "time": "12:45", "title": "Piquenique Gourmet na Selva", "description": "Mesa farta de pães rústicos, sopas quentes, saladas, vinho e sobremesas." },
      { "order": 5, "time": "14:15", "title": "Cenote Aberto (Iik’ - Vento)", "description": "Voo em tirolesa direto na água e saltos de contemplação." },
      { "order": 6, "time": "15:30", "title": "Cenote Antigo (K’áak’ - Fogo)", "description": "Flutuação relaxante em boias no meio de nenúfares e lírios d’água." },
      { "order": 7, "time": "17:00", "title": "Retorno ao Resort", "description": "Viagem de volta tranquila com desembarque no hotel." }
    ],
    "highlights": [
      "Quatro tipos diferentes de cenotes no mesmo dia",
      "Grupo reduzido com atmosfera privativa e exclusiva",
      "Piquenique de alta gastronomia com vinho no meio da selva",
      "Toalhas, equipamentos e lanches já 100% inclusos"
    ],
    "idealFor": [
      "Amantes da natureza pura, casais e famílias que querem a experiência mais sofisticada de cenotes"
    ],
    "accessibility": "Exige caminhar em trilhas de madeira e escadas de acesso aos cenotes.",
    "cancellationPolicy": "Cancelamento sem custos com até 48 horas de antecedência.",
    "faqs": [
      {
        "question": "O que está incluído no piquenique do Xenotes?",
        "answer": "Inclui pães artesanais frescos, queijos selecionados, frios nobres, sopa de legumes caseira, saladas gourmet, café, cerveja e vinho."
      },
      {
        "question": "As toalhas de banho estão inclusas?",
        "answer": "Sim! O tour do Xenotes fornece toalhas higienizadas, coletes e equipamentos completos."
      }
    ],
    "relatedTours": ["chichen-itza-deluxe", "tulum-akumal", "xelha"]
  },

  {
    "slug": "tulum",
    "name": "Ruínas de Tulum & Cenotes Mágicos",
    "category": "História & Praia · Meio Dia",
    "categories": ["historico", "cenotes", "natureza"],
    "shortDescription": "A clássica cidade murada maia sobre as falésias em frente ao mar caribenho aliada a mergulho em cenote aberto.",
    "description": "Visite o único sítio arqueológico maia construído à beira do Mar do Caribe. Encante-se com a vista deslumbrante de 'El Castillo' sobre o penhasco com o mar turquesa aos seus pés. Aprenda sobre o comércio marítimo ancestral maia com um guia historiador credenciado e finalize a manhã com um mergulho refrescante nas águas cristalinas do famoso complexo de cenotes Casa Tortuga.",
    "heroImage": "/passeios/ruinas-de-tulum-cenotes.jpg",
    "gallery": [
      "/passeios/ruinas-de-tulum-cenotes.jpg",
      "/passeios/chichen-itza.jpg",
      "/images/img-08-2cf9c873.png"
    ],
    "location": "Tulum, Quintana Roo, México",
    "duration": "Meio dia a dia todo (aprox. 6 a 7 horas)",
    "startTime": "07:30",
    "endTime": "14:30",
    "priceFrom": 460,
    "currency": "R$",
    "adultPrice": 460,
    "childPrice": 460,
    "infantPrice": 350,
    "infant04Price": 0,
    "infantPolicy": "0 a 4 anos cortesia.",
    "minimumAge": "Livre para todas as idades",
    "included": [
      "Transporte ida e volta com ar-condicionado",
      "Guia arqueológico credenciado em Tulum",
      "Ingressos de entrada ao sítio arqueológico de Tulum",
      "Entrada no complexo de Cenotes Casa Tortuga",
      "Tempo livre para banho com colete salva-vidas incluso",
      "Almoço ou lanche regional (conforme pacote selecionado)"
    ],
    "notIncluded": [
      "Bebidas alcoólicas extras",
      "Taxa federal de câmeras profissionais",
      "Gorjetas"
    ],
    "whatToBring": [
      "Roupa fresca de algodão, chapéu e óculos de sol",
      "Roupa de banho e toalha para o cenote",
      "Calçado confortável para caminhada",
      "Protetor solar biodegradável e água mineral"
    ],
    "importantInfo": [
      "As ruínas de Tulum têm pouca sombra; chapéu e protetor são fundamentais.",
      "A praia das ruínas pode ter restrição temporária de descida para preservação de ninhos de tartarugas marinhas."
    ],
    "itinerary": [
      { "order": 1, "time": "07:30", "title": "Saída Matinal", "description": "Embarque no hotel com destino a Tulum." },
      { "order": 2, "time": "09:00", "title": "Visita Guiada a Tulum", "description": "História, arquitetura e contemplação das falésias sobre o mar caribenho." },
      { "order": 3, "time": "11:30", "title": "Cenotes Casa Tortuga", "description": "Nado em cenotes abertos e cavernas cristalinas na selva." },
      { "order": 4, "time": "13:30", "title": "Almoço e Retorno", "description": "Refeição regional e desembarque no hotel no meio da tarde." }
    ],
    "highlights": [
      "A vista arqueológica mais bonita e fotografada de todo o México",
      "Passeio dinâmico que deixa a tarde livre para aproveitar o hotel",
      "Banho energizante nos cenotes de Tulum"
    ],
    "idealFor": [
      "Viajantes que buscam história maia com praias fotogênicas e ritmo leve"
    ],
    "accessibility": "Acessibilidade boa em caminhos de terra batida.",
    "cancellationPolicy": "Cancelamento sem custos até 24 horas antes do passeio.",
    "faqs": [
      {
        "question": "Dá tempo de aproveitar o hotel depois do passeio?",
        "answer": "Sim! O retorno acontece por volta das 14h30, permitindo que você almoce e curta a praia ou piscina do seu resort pelo resto do dia."
      }
    ],
    "relatedTours": ["tulum-coba", "tulum-akumal", "chichen-itza"]
  },

  {
    "slug": "tulum-coba",
    "name": "Rota Arqueológica Tulum & Cobá com Cenote",
    "category": "Cultura & Aventura · Dia Todo",
    "categories": ["historico", "cenotes", "natureza"],
    "shortDescription": "Visite as ruínas à beira-mar de Tulum e pedale pela selva ancestral de Cobá até a pirâmide Nohoch Mul.",
    "description": "Uma dobradinha arqueológica imperdível na selva de Quintana Roo. Pela manhã, explore o castelo costeiro de Tulum e suas falésias sobre o mar caribenho. Em seguida, adentre a selva densa de Cobá, uma das maiores metrópoles maias, onde você pode alugar bicicletas ou triciclos táxi para percorrer as trilhas milenares até a imponente pirâmide Nohoch Mul. Conclua com almoço típico e mergulho em cenote.",
    "heroImage": "/passeios/ruinas-de-tulum-cenotes.jpg",
    "gallery": [
      "/passeios/ruinas-de-tulum-cenotes.jpg",
      "/passeios/chichen-itza.jpg"
    ],
    "location": "Tulum & Cobá, Quintana Roo, México",
    "duration": "Dia todo (aprox. 9 horas)",
    "startTime": "07:00",
    "endTime": "16:30",
    "priceFrom": 580,
    "currency": "R$",
    "adultPrice": 580,
    "childPrice": 580,
    "infantPrice": 420,
    "infant04Price": 0,
    "infantPolicy": "0 a 4 anos cortesia.",
    "minimumAge": "Livre para todas as idades",
    "included": [
      "Transporte com ar-condicionado ida e volta",
      "Guia historiador certificado bilíngue",
      "Entradas em Tulum e Cobá inclusas",
      "Aluguel de bicicleta em Cobá (ou opção de triciclo táxi com condutor)",
      "Entrada em cenote exclusivo com colete salva-vidas",
      "Almoço buffet regional tradicional"
    ],
    "notIncluded": [
      "Bebidas engarrafadas no almoço",
      "Gorjetas"
    ],
    "whatToBring": [
      "Roupas esportivas leves e tênis",
      "Roupa de banho e toalha",
      "Repelente natural e protetor solar biodegradável"
    ],
    "importantInfo": [
      "Cobá é um sítio sombreado por árvores com caminhos planos, ideal para passear de bicicleta."
    ],
    "itinerary": [
      { "order": 1, "time": "07:00", "title": "Saída do Hotel", "description": "Embarque antecipado." },
      { "order": 2, "time": "08:30", "title": "Sítio de Tulum", "description": "Tour histórico nas falésias sobre o mar caribenho." },
      { "order": 3, "time": "11:00", "title": "Selva de Cobá", "description": "Passeio de bicicleta entre as árvores centenárias até a grande pirâmide." },
      { "order": 4, "time": "13:30", "title": "Almoço e Banho de Cenote", "description": "Gastronomia yucateca e água fresca no cenote." },
      { "order": 5, "time": "16:30", "title": "Retorno ao Resort", "description": "Chegada no fim da tarde." }
    ],
    "highlights": [
      "Duas cidades maias de perfis totalmente diferentes no mesmo dia",
      "Passeio de bicicleta pela selva exuberante de Cobá",
      "Almoço típico e banho em cenote refrescante"
    ],
    "idealFor": [
      "Viajantes ativos que adoram arqueologia autêntica e natureza"
    ],
    "accessibility": "Triciclos táxi estão disponíveis em Cobá para quem tem mobilidade reduzida.",
    "cancellationPolicy": "Cancelamento sem custos com até 24 horas de antecedência.",
    "faqs": [
      {
        "question": "É obrigatório andar de bicicleta em Cobá?",
        "answer": "Não! Quem não deseja pedalar pode alugar um triciclo conduzido por morador local ('maia táxi') com total conforto na sombra das árvores."
      }
    ],
    "relatedTours": ["tulum", "chichen-itza", "xenotes"]
  },

  {
    "slug": "tulum-akumal",
    "name": "Tulum & Nado com Tartarugas em Akumal",
    "category": "Vida Marinha & História · Dia Todo",
    "categories": ["natureza", "historico", "ilhas"],
    "shortDescription": "Conheça as ruínas costeiras de Tulum e nade livremente ao lado de tartarugas marinhas protegidas na baía de Akumal.",
    "description": "Uma experiência comovente de conexão com a vida selvagem caribenha. Visite as ruínas históricas de Tulum pela manhã e, em seguida, siga para a protegida baía de Akumal. Com coletes especiais e acompanhamento de guia biólogo certificado, nade em águas mansas sobre bancos de ervas marinhas onde tartarugas verdes gigantes e arraias pastam em seu habitat natural e intocado.",
    "heroImage": "/passeios/ruinas-de-tulum-cenotes.jpg",
    "gallery": [
      "/passeios/ruinas-de-tulum-cenotes.jpg",
      "/passeios/isla-mujeres.jpg"
    ],
    "location": "Tulum & Akumal, Quintana Roo, México",
    "duration": "Dia todo (aprox. 7 a 8 horas)",
    "startTime": "07:30",
    "endTime": "15:30",
    "priceFrom": 590,
    "currency": "R$",
    "adultPrice": 590,
    "childPrice": 590,
    "infantPrice": 450,
    "infant04Price": 0,
    "infantPolicy": "Cortesia para 0 a 4 anos.",
    "minimumAge": "Livre para todas as idades",
    "included": [
      "Transporte ida e volta em van executiva",
      "Guia credenciado em Tulum e guia de snorkel certificado em Akumal",
      "Ingressos de Tulum e autorização oficial para acesso ao santuário de Akumal",
      "Equipamentos completos de snorkel (máscara, tubo novo e colete)",
      "Tempo de banho na praia de areia branca de Akumal",
      "Almoço típico mexicano em restaurante à beira-mar"
    ],
    "notIncluded": [
      "Taxa de preservação ambiental local de Akumal",
      "Toalhas de banho",
      "Gorjetas"
    ],
    "whatToBring": [
      "Roupa de banho e toalha",
      "Camiseta de proteção UV (em Akumal é proibido protetor solar comum no mar)",
      "Óculos de sol e chapéu",
      "Dinheiro em espécie"
    ],
    "importantInfo": [
      "É estritamente proibido tocar, perseguir ou alimentar as tartarugas marinhas.",
      "Para proteger a vida marinha, não é permitido o uso de protetor solar comum na água em Akumal (utilize camisas de lycra UV)."
    ],
    "itinerary": [
      { "order": 1, "time": "07:30", "title": "Saída do Hotel", "description": "Embarque no lobby." },
      { "order": 2, "time": "09:00", "title": "Ruínas de Tulum", "description": "Visita histórica às construções maias com vista ao mar." },
      { "order": 3, "time": "11:30", "title": "Santuário das Tartarugas de Akumal", "description": "Snorkel guiado para avistamento de tartarugas e arraias em mar calmo." },
      { "order": 4, "time": "13:30", "title": "Almoço com Vista para o Mar", "description": "Refeição fresca com sabores mexicanos." },
      { "order": 5, "time": "15:30", "title": "Retorno ao Resort", "description": "Desembarque no hotel." }
    ],
    "highlights": [
      "Nadar ao lado de tartarugas marinhas livres em seu santuário natural",
      "Águas calmas e protegidas na baía de Akumal",
      "Combinação perfeita de arqueologia com vida animal marinha"
    ],
    "idealFor": [
      "Famílias com crianças, casais e amantes da biologia marinha"
    ],
    "accessibility": "Acessibilidade parcial.",
    "cancellationPolicy": "Cancelamento sem custos até 24 horas antes.",
    "faqs": [
      {
        "question": "É garantido ver tartarugas?",
        "answer": "A baía de Akumal é uma área de alimentação permanente das tartarugas-verdes; o avistamento é praticamente garantido em 98% das saídas."
      }
    ],
    "relatedTours": ["tulum", "cozumel-el-cielo", "isla-mujeres"]
  },

  {
    "slug": "cozumel-el-cielo",
    "name": "Cozumel Catamarã, El Cielo & Palancar",
    "category": "Snorkeling & Mar · Dia Todo",
    "categories": ["ilhas", "natureza", "aventura"],
    "shortDescription": "Mergulho nos recifes de corais protegidos e o espetacular banco de areia El Cielo, santuário de estrelas-do-mar.",
    "description": "Descubra o destino de mergulho mais aclamado do Caribe Mexicano. Atravesse de ferry para a mágica Ilha de Cozumel e embarque em um catamarã para navegar pelo Parque Nacional Arrecifes de Cozumel. Faça snorkeling guiado nos lendários recifes de Palancar e Colômbia, e depois relaxe nas águas rasas, calmas e cristalinas do banco de areia 'El Cielo', famoso por sua profusão de estrelas-do-mar e arraias.",
    "heroImage": "/passeios/cozumel-e-al-cielo.jpg",
    "gallery": [
      "/passeios/cozumel-e-al-cielo.jpg",
      "/passeios/isla-mujeres.jpg",
      "/images/img-08-2cf9c873.png"
    ],
    "location": "Ilha de Cozumel, Quintana Roo, México",
    "duration": "Dia todo (aprox. 9 horas)",
    "startTime": "07:00",
    "endTime": "17:30",
    "priceFrom": 520,
    "currency": "R$",
    "adultPrice": 520,
    "childPrice": 520,
    "infantPrice": 390,
    "infant04Price": 0,
    "infantPolicy": "Crianças de 0 a 4 anos cortesia no ferry e catamarã.",
    "minimumAge": "5 anos para o catamarã; 10 anos para snorkel aberto",
    "included": [
      "Transporte do hotel até o terminal de ferry de Playa del Carmen",
      "Bilhetes ida e volta de Ferry marítimo para a Ilha de Cozumel",
      "Passeio de catamarã pelos recifes protegidos com tripulação experiente",
      "Snorkeling nos recifes Palancar e Columbia com equipamentos esterilizados",
      "Parada relaxante no banco de areia El Cielo e praia El Cielito",
      "Bebidas a bordo (cervejas, margaritas, sucos, água e refrigerantes)",
      "Refeição leve com tacos de peixe empanado ou frango e frutas frescas"
    ],
    "notIncluded": [
      "Taxa de preservação do Parque Nacional Marinho de Cozumel (paga obrigatoriamente em dinheiro no check-in)",
      "Toalhas de banho",
      "Fotos profissionais submarinas"
    ],
    "whatToBring": [
      "Roupa de banho e toalha de praia",
      "Camiseta com proteção UV",
      "Dinheiro em espécie (pesos ou dólares) para a taxa do parque marinho",
      "Documento de identificação com foto"
    ],
    "importantInfo": [
      "A taxa do Parque Nacional Marinho deve ser paga em dinheiro no check-in da ilha.",
      "É estritamente proibido tocar ou retirar estrelas-do-mar da água.",
      "Por diretrizes de segurança marítima, a atividade de snorkel não é indicada para gestantes."
    ],
    "itinerary": [
      { "order": 1, "time": "07:00", "title": "Transporte até Playa del Carmen", "description": "Embarque no hotel rumo ao cais marítimo." },
      { "order": 2, "time": "08:30", "title": "Travessia de Ferry para Cozumel", "description": "Navegação agradável de 45 minutos no ferry ultramoderno." },
      { "order": 3, "time": "10:00", "title": "Embarque no Catamarã e Recifes", "description": "Mergulho de snorkel nas águas transparentes dos recifes Palancar e Colombia." },
      { "order": 4, "time": "12:30", "title": "Banco de Areia El Cielo & El Cielito", "description": "Águas cristalinas rasas na altura da cintura com estrelas-do-mar e lanche servido na água." },
      { "order": 5, "time": "15:00", "title": "Retorno ao Porto de Cozumel e Ferry", "description": "Tempo livre no centrinho e travessia de volta." },
      { "order": 6, "time": "17:30", "title": "Chegada ao Resort", "description": "Desembarque tranquilo no seu hotel." }
    ],
    "highlights": [
      "A visibilidade submarina mais impressionante do Caribe",
      "Banco de areia El Cielo com estrelas-do-mar em água turquesa calma",
      "Ferry ida e volta e navegação com bebidas e lanche inclusos"
    ],
    "idealFor": [
      "Amantes de snorkeling, casais, famílias e quem quer ver a verdadeira cor azul do Caribe"
    ],
    "accessibility": "Acessibilidade parcial no barco.",
    "cancellationPolicy": "Cancelamento gratuito com até 24 horas de antecedência. Em caso de porto fechado por vento norte, remarcação prioritária sem custo ou reembolso integral.",
    "faqs": [
      {
        "question": "Como é feito o pagamento da taxa do Parque Marinho?",
        "answer": "A taxa de preservação ambiental do Parque Nacional Arrecifes de Cozumel deve ser paga obrigatoriamente no check-in na marina em dinheiro (espécie em pesos ou dólares)."
      },
      {
        "question": "Gestantes podem realizar o passeio de catamarã em Cozumel?",
        "answer": "Por diretrizes operacionais de segurança marítima da capitania e do operador, a atividade em mar aberto e snorkel em Cozumel não é recomendada para gestantes."
      },
      {
        "question": "O ferry entre Playa del Carmen e Cozumel está incluído?",
        "answer": "Sim, as passagens de ida e volta do ferry marítimo já estão completamente inclusas no pacote."
      }
    ],
    "relatedTours": ["isla-mujeres", "barco-de-vidro-cozumel", "jungle-tour"]
  },

  {
    "slug": "barco-de-vidro-cancun",
    "name": "Barco de Vidro Transparente em Cancún",
    "category": "Navegação & Vida Marinha · Meio Dia",
    "categories": ["ilhas", "natureza"],
    "shortDescription": "Navegue em uma embarcação 100% transparente com visão de 360° do fundo do mar e dos recifes sem precisar se molhar.",
    "description": "Uma experiência visual única para toda a família. O barco é totalmente transparente (construído em polímero especial com tecnologia aeroespacial), permitindo que você observe o fundo do mar, formações de corais, cardumes tropicais, arraias e tartarugas enquanto navega confortavelmente pelas águas calmas da lagoa Nichupté e do mar de Cancún.",
    "heroImage": "/passeios/isla-mujeres.jpg",
    "gallery": [
      "/passeios/isla-mujeres.jpg",
      "/passeios/cozumel-e-al-cielo.jpg"
    ],
    "location": "Cancún, Quintana Roo, México",
    "duration": "Aprox. 1 hora e 30 minutos (passeio) / 3 horas totais",
    "startTime": "10:00",
    "endTime": "13:00",
    "priceFrom": 290,
    "currency": "R$",
    "adultPrice": 290,
    "childPrice": 290,
    "infantPrice": 190,
    "infant04Price": 0,
    "infantPolicy": "0 a 4 anos cortesia no colo.",
    "minimumAge": "Livre para todas as idades",
    "included": [
      "Passeio no barco 100% transparente",
      "Guia marítimo bilíngue explicando a vida marinha",
      "Colete salva-vidas de uso obrigatório",
      "Água mineral ou cerveja a bordo"
    ],
    "notIncluded": [
      "Transporte do hotel (pode ser contratado privativo ou ida em táxi/Uber na Zona Hoteleira)",
      "Taxa do cais marítimo",
      "Fotografias profissionais a bordo"
    ],
    "whatToBring": [
      "Roupas leves e frescas",
      "Óculos escuros e chapéu",
      "Câmera ou smartphone para fotos incríveis pelo fundo do barco",
      "Dinheiro em espécie para taxa da marina"
    ],
    "importantInfo": [
      "Check-in necessário 30 minutos antes do horário de partida na marina.",
      "Atividade sem contato direto com a água: você não se molha se não desejar."
    ],
    "itinerary": [
      { "order": 1, "time": "09:30", "title": "Check-in na Marina", "description": "Recepção e embarque no cais de Cancún." },
      { "order": 2, "time": "10:00", "title": "Navegação Transparente", "description": "Passagem pelos canais do manguezal e recife de corais com visão subaquática." },
      { "order": 3, "time": "11:30", "title": "Retorno ao Píer", "description": "Desembarque com tempo livre para curtir a Zona Hoteleira." }
    ],
    "highlights": [
      "Visão submarina sem necessidade de saber nadar ou colocar máscara",
      "Fotos espetaculares com o mar turquesa passando sob os seus pés",
      "Ideal para crianças pequenas e idosos"
    ],
    "idealFor": [
      "Famílias multigeracionais, pessoas que não nadam e quem quer um passeio rápido e encantador"
    ],
    "accessibility": "Excelente acessibilidade.",
    "cancellationPolicy": "Cancelamento gratuito com até 24h de antecedência.",
    "faqs": [
      {
        "question": "A gente se molha no barco de vidro?",
        "answer": "Não! O barco é totalmente seco e fechado na parte inferior; você observa o fundo do mar como se estivesse caminhando sobre a água."
      },
      {
        "question": "Com quanta antecedência devemos chegar à marina?",
        "answer": "Recomendamos chegar 30 minutos antes do horário agendado para realizar o check-in com tranquilidade."
      }
    ],
    "relatedTours": ["jungle-tour", "isla-mujeres", "barco-de-vidro-cozumel"]
  },

  {
    "slug": "barco-de-vidro-cozumel",
    "name": "Barco de Vidro Submarino em Cozumel",
    "category": "Navegação & Snorkel · Meio Dia",
    "categories": ["ilhas", "natureza"],
    "shortDescription": "Observe os famosos recifes de corais de Cozumel através do fundo de vidro e mergulhe em parada de snorkeling opcional.",
    "description": "Navegue pelas águas cristalinas de Cozumel em uma embarcação especial com fundo de vidro. Veja navios naufragados, recifes de corais gigantescos e peixes coloridos sem se molhar, com opção de descer na água para snorkeling guiado em parada protegida.",
    "heroImage": "/passeios/cozumel-e-al-cielo.jpg",
    "gallery": [
      "/passeios/cozumel-e-al-cielo.jpg",
      "/passeios/isla-mujeres.jpg"
    ],
    "location": "Cozumel, Quintana Roo, México",
    "duration": "Aprox. 2 horas",
    "startTime": "10:30",
    "endTime": "13:00",
    "priceFrom": 350,
    "currency": "R$",
    "adultPrice": 350,
    "childPrice": 350,
    "infantPrice": 220,
    "infant04Price": 0,
    "infantPolicy": "0 a 4 anos cortesia.",
    "minimumAge": "Livre para navegação",
    "included": [
      "Passeio de barco com fundo de vidro em Cozumel",
      "Equipamento de snorkel para parada opcional de banho",
      "Bebidas hidratantes a bordo"
    ],
    "notIncluded": [
      "Ferry de Playa del Carmen para Cozumel",
      "Taxa do parque marinho",
      "Transporte do hotel"
    ],
    "whatToBring": [
      "Roupa fresca, toalha e dinheiro em espécie para taxas locais."
    ],
    "importantInfo": [
      "Ponto de encontro no cais central de Cozumel."
    ],
    "itinerary": [
      { "order": 1, "time": "10:30", "title": "Embarque em Cozumel", "description": "Saída pelo litoral oeste da ilha." },
      { "order": 2, "time": "11:15", "title": "Observação dos Corais e Barco Naufragado", "description": "Vista subaquática com explicações do capitão." },
      { "order": 3, "time": "12:30", "title": "Parada de Snorkel e Retorno", "description": "Mergulho opcional e desembarque." }
    ],
    "highlights": [
      "Ideal para quem passa o dia em Cozumel por conta própria",
      "Visão clara de recifes profundos"
    ],
    "idealFor": [
      "Famílias com crianças e idosos que visitam Cozumel"
    ],
    "accessibility": "Acessibilidade moderada.",
    "cancellationPolicy": "Cancelamento sem custos até 24 horas antes.",
    "faqs": [
      {
        "question": "É preciso saber nadar?",
        "answer": "Não é necessário saber nadar para apreciar os corais através do piso panorâmico do barco."
      }
    ],
    "relatedTours": ["cozumel-el-cielo", "barco-de-vidro-cancun"]
  },

  {
    "slug": "jungle-tour",
    "name": "Jungle Tour: Lanchas Rápidas no Manguezal & Snorkel MUSA",
    "category": "Aventura Aquática · Meio Dia",
    "categories": ["aventura", "natureza"],
    "shortDescription": "Pilote sua própria lancha rápida de 2 lugares pelos labirintos da lagoa Nichupté e faça snorkel no Museu Subaquático (MUSA).",
    "description": "Uma das atrações mais tradicionais e eletrizantes de Cancún. Assuma o volante de uma lancha rápida estilo speed-boat para dois passageiros e acelere pelas águas calmas da Lagoa Nichupté através de canais verdejantes de manguezais. Em seguida, saia para o mar aberto para realizar snorkeling no recife de Punta Nizuc e contemplar esculturas do famoso Museu Subaquático de Arte (MUSA).",
    "heroImage": "/passeios/isla-mujeres.jpg",
    "gallery": [
      "/passeios/isla-mujeres.jpg",
      "/passeios/cozumel-e-al-cielo.jpg"
    ],
    "location": "Zona Hoteleira de Cancún, México",
    "duration": "Meio dia (aprox. 3 horas)",
    "startTime": "09:00",
    "endTime": "12:30",
    "priceFrom": 390,
    "currency": "R$",
    "adultPrice": 390,
    "childPrice": 390,
    "infantPrice": 290,
    "infant04Price": 0,
    "infantPolicy": "Idade mínima de 5 anos acompanhado de responsável.",
    "minimumAge": "5 anos de idade; 18 anos para pilotar",
    "included": [
      "Lancha rápida compartilhada para 2 pessoas (ou individual sob consulta)",
      "Guia líder em embarcação de suporte",
      "Equipamentos de snorkel (máscara, tubo novo e colete)",
      "Snorkeling guiado no recife Punta Nizuc e estátuas do MUSA",
      "Garrafa de água mineral"
    ],
    "notIncluded": [
      "Taxa de preservação marítima e da marina (paga em espécie no check-in)",
      "Transporte do resort até a marina na Zona Hoteleira",
      "Fotos profissionais"
    ],
    "whatToBring": [
      "Roupa de banho e toalha",
      "Protetor solar biodegradável",
      "Óculos de sol com cordão de segurança",
      "Dinheiro em espécie para taxa de cais"
    ],
    "importantInfo": [
      "Para conduzir a lancha rápida, é exigida idade mínima de 18 anos.",
      "Em caso de ventos fortes no mar aberto, o snorkel pode ser substituído por navegação estendida pelos manguezais com total segurança."
    ],
    "itinerary": [
      { "order": 1, "time": "09:00", "title": "Check-in e Instruções de Pilotagem", "description": "Apresentação dos comandos da lancha rápida e regras de navegação na marina." },
      { "order": 2, "time": "09:45", "title": "Aceleração pelos Canais de Manguezal", "description": "Pilotagem guiada por curvas estreitas e vegetação exótica da Lagoa Nichupté." },
      { "order": 3, "time": "10:45", "title": "Snorkel no Recife e Esculturas do MUSA", "description": "Parada com 45 minutos de snorkel sobre as esculturas marinhas e corais." },
      { "order": 4, "time": "12:00", "title": "Retorno em Velocidade à Marina", "description": "Volta descontraída e desembarque na Zona Hoteleira." }
    ],
    "highlights": [
      "Você é o piloto da sua própria embarcação",
      "Navegação divertida e veloz pelos canais verdes",
      "Snorkel no incrível Museu Subaquático de Arte (MUSA)"
    ],
    "idealFor": [
      "Casais e amigos que procuram adrenalina, velocidade e snorkel no mesmo passeio"
    ],
    "accessibility": "Exige mobilidade para subir e pilotar a lancha.",
    "cancellationPolicy": "Cancelamento sem custos até 24 horas antes.",
    "faqs": [
      {
        "question": "Precisa de carteira de habilitação náutica para pilotar?",
        "answer": "Não! As lanchas são fáceis de conduzir (apenas volante e alavanca de aceleração) e o guia líder vai na frente orientando todo o percurso."
      }
    ],
    "relatedTours": ["barco-de-vidro-cancun", "isla-mujeres", "atv-xperience"]
  },

  {
    "slug": "columbus-jantar-romantico",
    "name": "Catamarã Espanhol Columbus: Jantar Romântico ao Pôr do Sol",
    "category": "Romance & Gastronomia · Noite",
    "categories": ["noite"],
    "shortDescription": "Navegue pela lagoa de Cancún em um galeão espanhol clássico com saxofone ao vivo, open bar e jantar com lagosta ou carne.",
    "description": "A experiência mais romântica e elegante de Cancún. Embarque no galeão espanhol Columbus ao pôr do sol e navegue pelas águas serenas da Lagoa Nichupté. Ao som suave de saxofonista tocando ao vivo na brisa caribenha, saboreie um jantar exclusivo de quatro tempos acompanhado de vinho e open bar nacional, escolhendo entre cauda de lagosta grelhada, bife de chorizo ou menu vegetariano.",
    "heroImage": "/passeios/isla-mujeres.jpg",
    "gallery": [
      "/passeios/isla-mujeres.jpg",
      "/images/img-08-2cf9c873.png"
    ],
    "location": "Lagoa Nichupté, Zona Hoteleira de Cancún, México",
    "duration": "Noite (aprox. 3 horas)",
    "startTime": "17:00 (Pôr do Sol) ou 19:30 (Noturno)",
    "endTime": "20:30 ou 22:30",
    "priceFrom": 550,
    "currency": "R$",
    "adultPrice": 550,
    "childPrice": 550,
    "infantPrice": 550,
    "infant04Price": 0,
    "infantPolicy": "Passeio recomendado exclusivamente para adultos e casais.",
    "minimumAge": "14 anos de idade",
    "included": [
      "Navegação romântica de 2h30 no galeão espanhol Columbus",
      "Saxofonista ao vivo tocando jazz e clássicos românticos a bordo",
      "Jantar de 4 passos: entrada, salada, prato principal à escolha e sobremesa",
      "Prato principal selecionado: Cauda de Lagosta, Bife de Carne Nobre, Camarões ou Vegetariano",
      "Open bar nacional (vinho tinto, branco, cervejas, coquetéis e digestivos)"
    ],
    "notIncluded": [
      "Taxa do cais da marina",
      "Transporte do resort",
      "Fotografias de casal personalizadas"
    ],
    "whatToBring": [
      "Traje esporte fino ou casual elegante",
      "Casaco leve para a brisa noturna",
      "Documento com foto"
    ],
    "importantInfo": [
      "Passeio exclusivo para casais, aniversários de casamento e pedidos de namoro/noivado.",
      "Navegação na lagoa de águas extremamente calmas (sem enjoo)."
    ],
    "itinerary": [
      { "order": 1, "time": "17:00", "title": "Embarque no Galeão", "description": "Recepção com taça de boas-vindas na marina de Cancún." },
      { "order": 2, "time": "17:45", "title": "Pôr do Sol com Saxofone", "description": "Navegação calma contemplando o entardecer dourado sobre a lagoa." },
      { "order": 3, "time": "18:45", "title": "Jantar Gourmet Servido à Mesa", "description": "Degustação do prato principal (lagosta ou carne) com carta de vinhos." },
      { "order": 4, "time": "20:00", "title": "Brinde e Retorno", "description": "Música ao vivo sob o luar e desembarque no cais." }
    ],
    "highlights": [
      "Música romântica ao vivo com saxofone",
      "Menu gourmet de lagosta grelhada com vinho",
      "Cenário inesquecível para casais e datas especiais"
    ],
    "idealFor": [
      "Casais em lua de mel, noivados, pedidos de casamento e aniversários"
    ],
    "accessibility": "Acessibilidade para embarque.",
    "cancellationPolicy": "Cancelamento sem custos com até 24 horas de antecedência.",
    "faqs": [
      {
        "question": "O barco balança muito?",
        "answer": "Não! A navegação ocorre inteiramente nas águas abrigadas e sem ondas da Lagoa Nichupté, proporcionando um jantar extremamente suave e sem enjoos."
      }
    ],
    "relatedTours": ["isla-mujeres-vip", "joya-cirque-du-soleil", "coco-bongo"]
  },

  {
    "slug": "royal-garrafon",
    "name": "Parque Natural Garrafón VIP (Isla Mujeres)",
    "category": "Parque Natural & Lazer · Dia Todo",
    "categories": ["ilhas", "natureza", "aventura"],
    "shortDescription": "Falésias nobres no extremo sul de Isla Mujeres com tirolesas sobre o mar, piscina de borda infinita, caiaque e buffet VIP.",
    "description": "Localizado na deslumbrante Punta Sur de Isla Mujeres, o Parque Natural Garrafón combina aventura e contemplação em um dos cenários mais espetaculares do Caribe. Voe em tirolesas que cruzam diretamente sobre as ondas do mar turquesa, faça snorkel em recifes de corais, nade na piscina panorâmica de borda infinita e relaxe em redes e espreguiçadeiras com open bar e buffet livre na área VIP.",
    "heroImage": "/passeios/isla-mujeres.jpg",
    "gallery": [
      "/passeios/isla-mujeres.jpg",
      "/passeios/xel-ha.jpg"
    ],
    "location": "Punta Sur, Isla Mujeres, México",
    "duration": "Dia todo (aprox. 8 horas)",
    "startTime": "08:30",
    "endTime": "17:30",
    "priceFrom": 650,
    "currency": "R$",
    "adultPrice": 650,
    "childPrice": 650,
    "infantPrice": 480,
    "infant04Price": 0,
    "infantPolicy": "Cortesia para crianças de 0 a 4 anos.",
    "minimumAge": "Livre para o parque; tirolesas a partir de 1,10m e até 125kg",
    "included": [
      "Travessia marítima ida e volta de Cancún a Isla Mujeres",
      "Acesso completo ao Parque Natural Garrafón",
      "Circuito de tirolesas sobre o mar caribenho",
      "Piscina panorâmica de borda infinita com vista para a baía de Cancún",
      "Equipamentos de snorkel, caiaques e coletes salva-vidas",
      "Almoço buffet internacional e open bar de bebidas nacionais e coquetéis",
      "Área lounge VIP com espreguiçadeiras e armários privativos"
    ],
    "notIncluded": [
      "Taxa de cais marítimo federal",
      "Nado com golfinhos (pode ser combinado no mesmo ingresso)",
      "Fotos profissionais"
    ],
    "whatToBring": [
      "Roupa de banho, toalha e saída de praia",
      "Protetor solar biodegradável",
      "Dinheiro em espécie para taxa de cais"
    ],
    "importantInfo": [
      "Restrições para tirolesa: altura mínima de 1,10m e peso máximo de 125kg."
    ],
    "itinerary": [
      { "order": 1, "time": "08:30", "title": "Check-in na Marina e Barco", "description": "Travessia panorâmica para Isla Mujeres com café continental a bordo." },
      { "order": 2, "time": "10:00", "title": "Entrada no Garrafón VIP", "description": "Tirolesas sobre o mar turquesa e mergulho de snorkel." },
      { "order": 3, "time": "12:30", "title": "Almoço Buffet & Piscina Infinita", "description": "Gastronomia variada e relaxamento no lounge exclusivo." },
      { "order": 4, "time": "15:00", "title": "Passeio em Punta Sur", "description": "Caminhada pelas falésias do ponto mais oriental do México." },
      { "order": 5, "time": "17:30", "title": "Retorno a Cancún", "description": "Travessia de volta e desembarque." }
    ],
    "highlights": [
      "A única tirolesa que sobrevoa o mar aberto no México",
      "Piscina de borda infinita sobre os penhascos de Punta Sur",
      "Buffet internacional e open bar completo"
    ],
    "idealFor": [
      "Famílias e casais que buscam uma mistura equilibrada de lazer, visual e descanso"
    ],
    "accessibility": "Acessibilidade parcial.",
    "cancellationPolicy": "Cancelamento sem custos até 24 horas antes.",
    "faqs": [
      {
        "question": "Quais as regras para a tirolesa do Garrafón?",
        "answer": "A altura mínima é de 1,10m e o peso máximo de 125kg para garantir segurança nos arneses."
      }
    ],
    "relatedTours": ["dolphin-royal-connection", "isla-mujeres", "xelha"]
  },

  {
    "slug": "dolphin-royal-connection",
    "name": "Dolphin Royal Connection & Nado com Golfinhos",
    "category": "Interação Animal · Meio Dia",
    "categories": ["natureza", "ilhas"],
    "shortDescription": "O programa mais completo e emocionante com golfinhos em Isla Mujeres: push pelos pés, dorsal tow, beijo e carinho.",
    "description": "Um dos programas de interação com golfinhos mais premiados do mundo. Realizado no habitat marinho natural de Isla Mujeres, a experiência Royal Connection coloca você em contato íntimo com dois golfinhos inteligentes e dóceis. Sinta a adrenalina do famoso 'foot push' (onde os golfinhos empurram você pelos pés sobre a água), segure-se nas nadadeiras dorsais em alta velocidade e ganhe beijos, abraços e cumprimentos inesquecíveis.",
    "heroImage": "/passeios/isla-mujeres.jpg",
    "gallery": [
      "/passeios/isla-mujeres.jpg",
      "/images/img-08-2cf9c873.png"
    ],
    "location": "Isla Mujeres, Quintana Roo, México",
    "duration": "Meio dia a dia todo (aprox. 6 horas)",
    "startTime": "09:00",
    "endTime": "16:00",
    "priceFrom": 790,
    "currency": "R$",
    "adultPrice": 790,
    "childPrice": 790,
    "infantPrice": 580,
    "infant04Price": 0,
    "infantPolicy": "Crianças a partir de 1 ano podem participar do programa básico (Encounter) com colete salva-vidas ajustado.",
    "minimumAge": "A partir de 1 ano (modalidade Encounter); para Royal Connection exige-se altura mínima de 1,20m e estar acompanhado de adulto",
    "included": [
      "Travessia de ferry ida e volta de Cancún a Isla Mujeres",
      "Interação completa na água com 2 golfinhos (60 minutos de atividade)",
      "Comportamentos dinâmicos: Foot Push, Dorsal Tow, abraço, beijo e aceno",
      "Coletes salva-vidas adequados",
      "Almoço buffet e open bar nacional de bebidas",
      "Acesso à piscina e clube de praia"
    ],
    "notIncluded": [
      "Taxa de preservação marítima e cais federal",
      "Pacote de fotografias profissionais (adquirido no parque)",
      "Toalhas de banho"
    ],
    "whatToBring": [
      "Roupa de banho e toalha",
      "Dinheiro em espécie para taxa do cais e fotos",
      "Documento com foto"
    ],
    "importantInfo": [
      "Não é permitido entrar na água com brincos, correntes, anéis, câmeras ou protetor solar para proteção dos animais.",
      "Para Royal Connection, menores com menos de 1,40m devem estar acompanhados por um adulto pagante no mesmo grupo."
    ],
    "itinerary": [
      { "order": 1, "time": "09:00", "title": "Travessia de Barco", "description": "Navegação até o Dolphin Discovery em Isla Mujeres." },
      { "order": 2, "time": "10:30", "title": "Briefing com os Treinadores", "description": "Instruções sobre fisiologia, comandos e respeito aos animais." },
      { "order": 3, "time": "11:00", "title": "Sessão na Água com os Golfinhos", "description": "Nado, foot push veloz, abraços e fotos emocionantes com dois golfinhos." },
      { "order": 4, "time": "12:30", "title": "Almoço Buffet & Piscina", "description": "Momento relaxante no beach club com comida e bebidas." },
      { "order": 5, "time": "15:00", "title": "Retorno a Cancún", "description": "Travessia de regresso e desembarque." }
    ],
    "highlights": [
      "Dois golfinhos em interação conjunta e veloz",
      "Sensação emocionante do foot push sobre as águas",
      "Buffet e ferry inclusos"
    ],
    "idealFor": [
      "Famílias com crianças, casais e amantes dos animais marinhos"
    ],
    "accessibility": "Acessibilidade assistida.",
    "cancellationPolicy": "Cancelamento sem custos até 24 horas antes.",
    "faqs": [
      {
        "question": "Grávidas podem fazer a interação com golfinhos?",
        "answer": "Para gestantes de até 5 meses, apenas o programa tranquilo 'Dolphin Encounter' é permitido. O programa Royal Connection (com empurrão e velocidade) não é autorizado por precaução."
      },
      {
        "question": "As fotos estão incluídas?",
        "answer": "Não. Pela segurança dos animais, câmeras não entram na água; as fotos são tiradas pela equipe fotográfica do parque e podem ser compradas após a sessão."
      }
    ],
    "relatedTours": ["royal-garrafon", "isla-mujeres", "xelha"]
  },

  {
    "slug": "joya-cirque-du-soleil",
    "name": "JOYÀ Cirque du Soleil Riviera Maya",
    "category": "Espetáculo & Alta Gastronomia · Noite",
    "categories": ["noite"],
    "shortDescription": "O único espetáculo residente do Cirque du Soleil no México, combinando teatro intimista, acrobacias e gastronomia sensorial.",
    "description": "Uma obra-prima das artes cênicas localizada em um teatro deslumbrante construído sobre as águas na selva da Riviera Maya. JOYÀ conta a história emocionante de um alquimista e sua neta em busca dos segredos da vida e da história natural mexicana. Desfrute de um jantar teatral sofisticado de três tempos com champanhe Laurent-Perrier e viva a proximidade única dos acrobatas e músicos em um ambiente intimista.",
    "heroImage": "/passeios/coco-bongo-show-disco.jpg",
    "gallery": [
      "/passeios/coco-bongo-show-disco.jpg",
      "/images/img-08-2cf9c873.png"
    ],
    "location": "Teatro Vidanta, Riviera Maya, México",
    "duration": "Noite (aprox. 4 a 5 horas)",
    "startTime": "18:00 (Primeiro Turno) ou 20:30 (Segundo Turno)",
    "endTime": "22:00 ou 23:45",
    "priceFrom": 750,
    "currency": "R$",
    "adultPrice": 750,
    "childPrice": 750,
    "infantPrice": 750,
    "infant04Price": 0,
    "infantPolicy": "Idade mínima recomendada de 5 anos completos.",
    "minimumAge": "5 anos de idade",
    "included": [
      "Ingresso oficial para o espetáculo JOYÀ do Cirque du Soleil",
      "Lugar marcado conforme categoria escolhida (Show Apenas, Assentos Premium com Bebidas ou Show & Jantar Gourmet)",
      "Jantar de 3 tempos com opções culinárias sensoriais (se selecionada a modalidade com jantar)",
      "Champanhe Laurent-Perrier e coquetéis inclusos na categoria de jantar",
      "Acesso aos decks panorâmicos e lagos do Teatro Vidanta"
    ],
    "notIncluded": [
      "Transporte (disponível com traslado privativo ou transfer oficial Vidanta)",
      "Fotografias profissionais",
      "Gorjetas"
    ],
    "whatToBring": [
      "Traje esporte fino ou elegante",
      "Documento de identificação com foto e voucher oficial"
    ],
    "importantInfo": [
      "Chegar 45 minutos antes do início para desfrutar da passarela dos mangues e do pré-show.",
      "Não é permitida gravação em vídeo ou fotos com flash durante a apresentação acrobática."
    ],
    "itinerary": [
      { "order": 1, "time": "18:00", "title": "Chegada ao Teatro Vidanta", "description": "Caminhada pelas passarelas sobre a lagoa e coquetel de boas-vindas." },
      { "order": 2, "time": "19:00", "title": "Jantar Gastronômico Teatral", "description": "Menu sensorial de alta gastronomia com champanhe à mesa." },
      { "order": 3, "time": "20:15", "title": "Apresentação de JOYÀ", "description": "80 minutos de números acrobáticos surreais, música ao vivo e poesia maia." },
      { "order": 4, "time": "21:45", "title": "Encerramento e Retorno", "description": "Desembarque no resort." }
    ],
    "highlights": [
      "O único Cirque du Soleil com gastronomia e champanhe do mundo",
      "Teatro intimista onde todos os assentos ficam perto do palco",
      "Arquitetura deslumbrante integrada à natureza da Riviera Maya"
    ],
    "idealFor": [
      "Casais, celebrações sofisticadas e apreciadores de cultura e alta gastronomia"
    ],
    "accessibility": "Excelente acessibilidade com rampas e assentos dedicados.",
    "cancellationPolicy": "Cancelamento sem custos até 48 horas antes da sessão.",
    "faqs": [
      {
        "question": "O que diferencia as categorias de ingresso?",
        "answer": "Existem opções apenas com o espetáculo, opções com assentos premium e canapés/champanhe, e a modalidade VIP completa que inclui o jantar sensorial de 3 tempos servido 1 hora antes do show."
      }
    ],
    "relatedTours": ["columbus-jantar-romantico", "xcaret-noche", "coco-bongo"]
  },

  {
    "slug": "coco-bongo",
    "name": "Coco Bongo Show & Disco",
    "category": "Vida Noturna · Noite",
    "categories": ["noite", "aventura"],
    "shortDescription": "O espetáculo mais icônico de Cancún: acrobatas, tributos musicais ao vivo e festa eletrizante na zona hoteleira.",
    "description": "Mais do que uma casa noturna, a Coco Bongo é um mega show estilo Broadway e Las Vegas no coração da Zona Hoteleira de Cancún. Assista a tributos inacreditáveis de Michael Jackson, Queen, Beatles e cinema (Homem-Aranha, Máscara, Mad Max), intercalados com acrobatas voando sobre o público, canhões de confete, chuva de balões e open bar de bebidas durante a noite inteira.",
    "heroImage": "/passeios/coco-bongo-show-disco.jpg",
    "gallery": [
      "/passeios/coco-bongo-show-disco.jpg",
      "/images/img-08-2cf9c873.png"
    ],
    "location": "Zona Hoteleira de Cancún ou Playa del Carmen, México",
    "duration": "Noite (aprox. 5 a 6 horas)",
    "startTime": "21:30",
    "endTime": "03:30",
    "priceFrom": 520,
    "currency": "R$",
    "adultPrice": 520,
    "childPrice": 520,
    "infantPrice": 520,
    "infant04Price": 0,
    "infantPolicy": "Proibida a entrada de menores de 18 anos.",
    "minimumAge": "18 anos (apresentação obrigatória de documento de identidade)",
    "included": [
      "Ingresso com acesso garantido aos shows e à discoteca",
      "Open Bar nacional ou premium (conforme categoria escolhida: Regular, Gold Member ou Front Row)",
      "Shows acrobáticos contínuos e performances ao vivo",
      "Snack kit ou petisco (nas modalidades que contemplam comida)",
      "Atendimento exclusivo e assento reservado nas modalidades VIP"
    ],
    "notIncluded": [
      "Transporte de volta da balada (táxis credenciados abundantes na saída)",
      "Gorjetas aos garçons",
      "Bebidas fora do pacote de open bar contratado"
    ],
    "whatToBring": [
      "Documento oficial de identidade com foto (passaporte ou RG original)",
      "Roupas festivas e sapatos confortáveis para dançar",
      "Dinheiro em espécie ou cartão para compras e gorjetas"
    ],
    "importantInfo": [
      "Entrada estritamente proibida para menores de 18 anos.",
      "As modalidades Gold Member e Front Row contam com entrada preferencial sem filas e garçom dedicado."
    ],
    "itinerary": [
      { "order": 1, "time": "21:30", "title": "Abertura das Portas", "description": "Entrada na festa e início do serviço de bebidas." },
      { "order": 2, "time": "23:00", "title": "Início das Grandes Performances", "description": "Acrobacias nas alturas, tributos cinematográficos e show de luzes." },
      { "order": 3, "time": "01:00", "title": "Pico da Balada", "description": "Chuva de confetes, balões gigantes e os hits musicais mais tocados." },
      { "order": 4, "time": "03:30", "title": "Encerramento", "description": "Fim da festa na Zona Hoteleira." }
    ],
    "highlights": [
      "O espetáculo noturno número 1 de Cancún",
      "Open bar de bebidas liberado a noite inteira",
      "Mais de 40 atores e acrobatas em palco de alta tecnologia"
    ],
    "idealFor": [
      "Grupos de amigos, despedidas de solteiro e casais que amam festa e espetáculo",
      "Quem quer ter uma noite inesquecível e energética em Cancún"
    ],
    "accessibility": "Acessibilidade parcial com elevadores para setores superiores sob solicitação.",
    "cancellationPolicy": "Cancelamento gratuito com até 24 horas de antecedência.",
    "faqs": [
      {
        "question": "Qual a diferença entre o ingresso Regular e o Gold Member?",
        "answer": "O Regular dá acesso à pista com open bar de bebidas nacionais. O Gold Member possui entrada sem filas, área reservada com assentos e open bar de bebidas premium internacionais."
      }
    ],
    "relatedTours": ["joya-cirque-du-soleil", "xoximilco", "isla-mujeres"]
  },

  {
    "slug": "holbox-magico",
    "name": "Expedição Holbox Paradisíaco & Ilha da Paixão",
    "category": "Ecoturismo & Ilhas · Dia Todo",
    "categories": ["ilhas", "natureza"],
    "shortDescription": "Descubra a ilha sem carros com praias de areia branca rasa, flamingos selvagens, carrinho de golfe e cenote Yalahau.",
    "description": "Fuja da agitação e viaje para o refúgio mais preservado do Caribe Mexicano. Holbox é uma ilha mágica com ruas de areia batida, murais artísticos e praias de água calma onde você caminha centenas de metros mar adentro com a água na cintura. O passeio inclui navegação de barco até o cenote Yalahau com águas curativas, visita à Ilha dos Pássaros e à Ilha da Paixão (lar de flamingos cor-de-rosa), almoço em restaurante típico e tempo livre no vilarejo.",
    "heroImage": "/passeios/isla-mujeres.jpg",
    "gallery": [
      "/passeios/isla-mujeres.jpg",
      "/passeios/cozumel-e-al-cielo.jpg",
      "/images/img-08-2cf9c873.png"
    ],
    "location": "Ilha de Holbox, Quintana Roo, México",
    "duration": "Dia todo (aprox. 12 horas)",
    "startTime": "06:30",
    "endTime": "19:00",
    "priceFrom": 690,
    "currency": "R$",
    "adultPrice": 690,
    "childPrice": 690,
    "infantPrice": 490,
    "infant04Price": 0,
    "infantPolicy": "0 a 4 anos cortesia.",
    "minimumAge": "Livre para todas as idades",
    "included": [
      "Transporte executivo com ar-condicionado de ida e volta do seu resort até Chiquilá",
      "Passeio de lancha privativo pelas ilhotas paradisíacas",
      "Entrada e banho no sagrado Cenote Ojo de Agua Yalahau",
      "Passagem pela Ilha da Paixão e bancos de areia com observação de flamingos selvagens",
      "Almoço à beira-mar em restaurante selecionado de Holbox",
      "Tempo livre para caminhar pelo vilarejo artístico e praias de areia branca"
    ],
    "notIncluded": [
      "Bebidas engarrafadas no restaurante",
      "Aluguel de carrinho de golfe ou bicicleta (opcional)",
      "Taxa ambiental municipal de Chiquilá"
    ],
    "whatToBring": [
      "Roupas de praia bem confortáveis e toalha",
      "Protetor solar biodegradável e repelente de insetos",
      "Chapéu, boné e óculos escuros",
      "Dinheiro em espécie (em Holbox muitos locais não aceitam cartão ou têm sinal instável)"
    ],
    "importantInfo": [
      "Em Holbox não circulam carros convencionais; a locomoção é a pé, de bicicleta ou de carrinho de golfe.",
      "Em caso de condições climáticas adversas na travessia, é garantida remarcação prioritária ou reembolso integral."
    ],
    "itinerary": [
      { "order": 1, "time": "06:30", "title": "Saída Rumo ao Porto de Chiquilá", "description": "Deslocamento de van pela península com paisagens do interior." },
      { "order": 2, "time": "09:30", "title": "Embarque na Lancha e Cenote Yalahau", "description": "Banho nas águas cristalinas de nascente do cenote em meio aos mangues." },
      { "order": 3, "time": "11:30", "title": "Ilha da Paixão & Flamingos", "description": "Contemplação dos bancos de areia e aves migratórias selvagens." },
      { "order": 4, "time": "13:00", "title": "Almoço à Beira-Mar em Holbox", "description": "Peixe fresco, frutos do mar e culinária caribenha com pés na areia." },
      { "order": 5, "time": "14:30", "title": "Tempo Livre no Vilarejo", "description": "Passeio pelas lojinhas de artesanato, murais coloridos e banho de mar calmo." },
      { "order": 6, "time": "16:30", "title": "Travessia de Retorno e Estrada", "description": "Volta ao porto e transporte de regresso ao hotel em Cancún." }
    ],
    "highlights": [
      "A ilha mais charmosa, tranquila e intocada do Caribe Mexicano",
      "Banho no cenote Yalahau e avistamento de flamingos",
      "Praias de águas rasas azul-bebê sem ondas"
    ],
    "idealFor": [
      "Casais, viajantes que buscam desconectar e amantes de ecoturismo e praias tranquilas"
    ],
    "accessibility": "Exige caminhar sobre ruas de areia na ilha.",
    "cancellationPolicy": "Cancelamento sem custos até 24 horas antes.",
    "faqs": [
      {
        "question": "O que acontece em caso de mau tempo no dia do tour de Holbox?",
        "answer": "Se as condições marítimas ou de estrada não permitirem uma visita segura, você pode optar por remarcação imediata para o dia seguinte ou reembolso total."
      },
      {
        "question": "O transporte inclui ida e volta até o hotel?",
        "answer": "Sim, buscamos e deixamos você com todo conforto no lobby do seu resort."
      }
    ],
    "relatedTours": ["las-coloradas", "bacalar", "isla-mujeres"]
  },

  {
    "slug": "las-coloradas",
    "name": "Las Coloradas (Lagoas Rosas) & Rio Lagartos",
    "category": "Ecoturismo & Fotografia · Dia Todo",
    "categories": ["natureza"],
    "shortDescription": "Testemunhe o impressionante fenômeno das lagoas cor-de-rosa e navegue de barco pela reserva de biosfera de Rio Lagartos.",
    "description": "Uma das maravilhas visuais mais surpreendentes do planeta. Localizadas na costa norte de Yucatán, as lagoas salinas de Las Coloradas possuem uma tonalidade rosa-choque impressionante devido à alta concentração de sal, microalgas e microrganismos. Combine a visita às salinas com um safári de barco pelos manguezais da Reserva da Biosfera de Rio Lagartos para ver flamingos selvagens, crocodilos e fazer o tradicional banho de argila maia.",
    "heroImage": "/passeios/chichen-itza.jpg",
    "gallery": [
      "/passeios/chichen-itza.jpg",
      "/images/img-08-2cf9c873.png"
    ],
    "location": "Costa Norte de Yucatán, México",
    "duration": "Dia todo (aprox. 12 horas)",
    "startTime": "06:30",
    "endTime": "18:30",
    "priceFrom": 720,
    "currency": "R$",
    "adultPrice": 720,
    "childPrice": 720,
    "infantPrice": 520,
    "infant04Price": 0,
    "infantPolicy": "0 a 4 anos cortesia.",
    "minimumAge": "Livre para todas as idades",
    "included": [
      "Transporte com ar-condicionado de ida e volta",
      "Acesso guiado ao parque salino das Lagoas Rosas de Las Coloradas",
      "Passeio de barco privativo pelos canais da Reserva de Rio Lagartos",
      "Avistamento de flamingos, pelicanos e fauna selvagem",
      "Banho de lama mineral esfoliante (banho maia)",
      "Almoço completo em restaurante de pescadores locais"
    ],
    "notIncluded": [
      "Taxa de preservação da biosfera da CONANP",
      "Bebidas extras no almoço",
      "Gorjetas"
    ],
    "whatToBring": [
      "Roupas leves de cores neutras ou claras para fotos de alto impacto",
      "Roupa de banho e toalha para o banho de argila",
      "Chapéu, protetor solar e repelente",
      "Óculos de sol polarizados (o reflexo do sal é intenso)"
    ],
    "importantInfo": [
      "Não é permitido nadar nas lagoas rosas (área de produção ativa de sal marinho para consumo).",
      "A intensidade do tom rosa varia conforme a luz do sol e o ciclo de colheita do sal."
    ],
    "itinerary": [
      { "order": 1, "time": "06:30", "title": "Saída de Cancún", "description": "Viagem cênica até o norte da península." },
      { "order": 2, "time": "10:00", "title": "Tour nas Lagoas Rosas de Las Coloradas", "description": "Caminhada explicativa com guia e tempo para fotos espetaculares das águas cor-de-rosa." },
      { "order": 3, "time": "12:00", "title": "Safári de Barco em Rio Lagartos", "description": "Navegação entre mangues procurando flamingos e crocodilos." },
      { "order": 4, "time": "13:30", "title": "Banho de Lama Maia e Praia Virgem", "description": "Argila rica em minerais para hidratação da pele e banho de mar." },
      { "order": 5, "time": "14:30", "title": "Almoço Regional", "description": "Refeição de frutos do mar frescos com vista para a foz do rio." },
      { "order": 6, "time": "18:30", "title": "Retorno ao Resort", "description": "Desembarque no hotel." }
    ],
    "highlights": [
      "O cenário fotográfico mais surreal do México",
      "Maior colônia de flamingos cor-de-rosa da península",
      "Experiência esfoliante natural com a lama maia"
    ],
    "idealFor": [
      "Amantes de fotografia, biologia e viajantes que buscam lugares exóticos fora da rota comum"
    ],
    "accessibility": "Acessibilidade moderada.",
    "cancellationPolicy": "Cancelamento sem custos até 24 horas antes.",
    "faqs": [
      {
        "question": "É permitido nadar nas lagoas cor-de-rosa?",
        "answer": "Não. Por ser uma salina de grau alimentício industrial, a entrada na água das lagoas rosas não é permitida. O banho e o mergulho acontecem na praia virgem durante a etapa de Rio Lagartos."
      }
    ],
    "relatedTours": ["holbox-magico", "chichen-itza", "bacalar"]
  },

  {
    "slug": "bacalar",
    "name": "Laguna de Bacalar: A Lagoa das Sete Cores",
    "category": "Ecoturismo Nobre · Dia Todo",
    "categories": ["natureza", "cenotes"],
    "shortDescription": "Navegue pelas águas cristalinas em tons degradê da Lagoa de Bacalar com visita ao Canal dos Piratas e ao Forte de San Felipe.",
    "description": "Conhecida como as 'Maldivas Mexicanas', a Lagoa de Bacalar é um dos tesouros ecológicos mais fascinantes do mundo. Uma lagoa de água doce de mais de 40 quilômetros de extensão com fundo de areia branca e calcário que cria um espetáculo de sete tonalidades visíveis de azul e turquesa. Navegue em pontoon boat privativo pelo Canal dos Piratas, conheça os estromatólitos milenares (estruturas vivas mais antigas do planeta) e banhe-se no Cenote Negro e Cenote Esmeralda.",
    "heroImage": "/passeios/ruinas-de-tulum-cenotes.jpg",
    "gallery": [
      "/passeios/ruinas-de-tulum-cenotes.jpg",
      "/images/img-08-2cf9c873.png"
    ],
    "location": "Bacalar, Sul de Quintana Roo, México",
    "duration": "Dia todo (aprox. 13 horas)",
    "startTime": "06:00",
    "endTime": "19:30",
    "priceFrom": 780,
    "currency": "R$",
    "adultPrice": 780,
    "childPrice": 780,
    "infantPrice": 560,
    "infant04Price": 0,
    "infantPolicy": "0 a 4 anos cortesia.",
    "minimumAge": "Livre para todas as idades",
    "included": [
      "Transporte executivo confortável de longa distância ida e volta",
      "Passeio exclusivo de barco pontoon na Lagoa das 7 Cores",
      "Parada para banho nas águas rasas do Canal dos Piratas",
      "Navegação pelo Cenote Negro, Cenote Esmeralda e Cenote Cocalitos",
      "Observação dos santuários de estromatólitos",
      "Almoço completo em restaurante de frente para a lagoa",
      "Visita panorâmica ao histórico Forte de San Felipe de Bacalar"
    ],
    "notIncluded": [
      "Bebidas engarrafadas no restaurante",
      "Gorjetas"
    ],
    "whatToBring": [
      "Roupa de banho e toalha",
      "Camiseta de proteção UV (para não poluir a água doce cristalina)",
      "Dinheiro em espécie",
      "Almofada de pescoço para a viagem confortável na van"
    ],
    "importantInfo": [
      "Distância de cerca de 3h30 de viagem com parada técnica para café na ida.",
      "Para preservar os estromatólitos, é proibido pisar ou se apoiar sobre as formações rochosas orgânicas."
    ],
    "itinerary": [
      { "order": 1, "time": "06:00", "title": "Saída em Van Executiva", "description": "Viagem com assentos reclináveis até o sul do estado." },
      { "order": 2, "time": "09:45", "title": "Chegada a Bacalar e Embarque", "description": "Subida no pontoon boat espaçoso na lagoa de águas cristalinas." },
      { "order": 3, "time": "10:30", "title": "Cenotes e Estromatólitos", "description": "Navegação pelas áreas de mudança brusca de profundidade e cores azuladas." },
      { "order": 4, "time": "11:45", "title": "Banho no Canal dos Piratas", "description": "Tempo livre nas águas quentes e rasas com fundo de areia macia." },
      { "order": 5, "time": "13:30", "title": "Almoço à Beira da Lagoa", "description": "Gastronomia caribenha fresca com visual deslumbrante." },
      { "order": 6, "time": "15:00", "title": "Forte de San Felipe e Retorno", "description": "Fotos do forte colonial que defendia a cidade de piratas e regresso seguro." }
    ],
    "highlights": [
      "Os sete tons de azul mais límpidos de toda a América Central",
      "Água doce morna e extremamente cristalina sem ondas",
      "Passeio tranquilo e exclusivo de barco pontoon com sombra"
    ],
    "idealFor": [
      "Casais e famílias que querem conhecer a pérola do ecoturismo mexicano"
    ],
    "accessibility": "Acessibilidade boa com auxílio no embarque.",
    "cancellationPolicy": "Cancelamento sem custos até 48 horas antes.",
    "faqs": [
      {
        "question": "A água da lagoa de Bacalar é doce ou salgada?",
        "answer": "É uma lagoa de água 100% doce e morna, alimentada por lençóis freáticos e cenotes subterrâneos cristalinos."
      }
    ],
    "relatedTours": ["tulum-akumal", "xenotes", "holbox-magico"]
  },

  {
    "slug": "atv-xperience",
    "name": "Rota dos Cenotes de Quadriciclo (ATV) & Tirolesas",
    "category": "Adrenalina na Selva · Meio Dia",
    "categories": ["aventura", "cenotes", "natureza"],
    "shortDescription": "Pilote quadriciclos (ATVs) por trilhas de lama e pedra na selva maia, salte em tirolesas e nade em cenote secreto.",
    "description": "Uma dose pura de adrenalina em plena selva tropical mexicana. Suba em um potente quadriciclo ATV (individual ou para casal) e acelere por trilhas sinuosas de terra, rochas e poças de lama no coração da famosa Rota dos Cenotes de Puerto Morelos. Voe em um circuito de tirolesas sobre a vegetação nativa e comemore a vitória mergulhando nas águas transparentes e refrescantes de um cenote sagrado reservado.",
    "heroImage": "/passeios/Tirolesas.jpg",
    "gallery": [
      "/passeios/Tirolesas.jpg",
      "/passeios/ruinas-de-tulum-cenotes.jpg"
    ],
    "location": "Rota dos Cenotes, Puerto Morelos, México",
    "duration": "Meio dia (aprox. 4 horas)",
    "startTime": "08:30 ou 13:00",
    "endTime": "12:30 ou 17:00",
    "priceFrom": 380,
    "currency": "R$",
    "adultPrice": 380,
    "childPrice": 380,
    "infantPrice": 280,
    "infant04Price": 0,
    "infantPolicy": "Idade mínima de 6 anos como passageiro na modalidade dupla.",
    "minimumAge": "6 anos como passageiro; 16/18 anos para pilotar",
    "included": [
      "Transporte ida e volta do seu resort em van climatizada",
      "Quadriciclo ATV potente (opção individual ou dupla compartilhada)",
      "Equipamentos de segurança completos (capacete, bandana e óculos de proteção)",
      "Guia profissional de trilha liderando o percurso",
      "Circuito de tirolesas na selva",
      "Entrada e tempo de banho refrescante no cenote sagrado com colete",
      "Snack leve ou tacos mexicanos com água mineral"
    ],
    "notIncluded": [
      "Seguro facultativo de colisão da moto (pago na base)",
      "Fotografias da trilha",
      "Gorjetas"
    ],
    "whatToBring": [
      "Roupas que possam sujar com lama e poeira",
      "Roupa de banho por baixo e toalha para o cenote",
      "Tênis fechado ou bota de trilha (obrigatório)",
      "Muda de roupa limpa para voltar na van",
      "Dinheiro em espécie"
    ],
    "importantInfo": [
      "Obrigatório o uso de calçado fechado para pilotagem dos quadriciclos.",
      "Não recomendado para gestantes ou pessoas com lesões severas na coluna."
    ],
    "itinerary": [
      { "order": 1, "time": "08:30", "title": "Transporte até a Base na Selva", "description": "Deslocamento até Puerto Morelos." },
      { "order": 2, "time": "09:15", "title": "Instruções e Equipamentos", "description": "Colocação dos capacetes e teste dos comandos dos ATVs." },
      { "order": 3, "time": "09:45", "title": "Trilha Off-Road de Quadriciclos", "description": "Pilotagem emocionante por caminhos de terra, curvas e lama." },
      { "order": 4, "time": "10:45", "title": "Circuito de Tirolesas", "description": "Saltos acrobáticos e sobrevoo da copa das árvores." },
      { "order": 5, "time": "11:30", "title": "Banho de Cenote e Lanche", "description": "Lavagem da lama nas águas puras do cenote sagrado e tacos." },
      { "order": 6, "time": "12:30", "title": "Retorno ao Resort", "description": "Desembarque com a tarde livre no hotel." }
    ],
    "highlights": [
      "Trilha de quadriciclo real com lama e obstáculos naturais",
      "Cenote exclusivo sem multidões para banho revigorante",
      "Passeio rápido de meio período muito divertido"
    ],
    "idealFor": [
      "Grupos de amigos, casais aventureiros e pais com filhos adolescentes"
    ],
    "accessibility": "Exige mobilidade física e equilíbrio para pilotagem.",
    "cancellationPolicy": "Cancelamento sem custos com até 24 horas de antecedência.",
    "faqs": [
      {
        "question": "Pode ir de chinelo ou sandália?",
        "answer": "Não. Pelas normas de segurança, é obrigatório o uso de tênis fechado para apoiar os pés nos pedais do quadriciclo."
      }
    ],
    "relatedTours": ["jungle-tour", "xplor", "xenotes"]
  }
]

def generate_typescript():
    ts_code = []
    ts_code.append("// =============================================================================")
    ts_code.append("// Catálogo Canônico de Passeios da Tio Nenê")
    ts_code.append("// Gerado com dados e regras operacionais de 03_DEVELOPER_HANDOFF")
    ts_code.append("// =============================================================================\n")
    ts_code.append("export interface TourFAQ {")
    ts_code.append("  question: string;")
    ts_code.append("  answer: string;")
    ts_code.append("}\n")
    ts_code.append("export interface TourItineraryItem {")
    ts_code.append("  order: number;")
    ts_code.append("  time?: string;")
    ts_code.append("  title: string;")
    ts_code.append("  description: string;")
    ts_code.append("}\n")
    ts_code.append("export interface Tour {")
    ts_code.append("  slug: string;")
    ts_code.append("  name: string;")
    ts_code.append("  category: string;")
    ts_code.append("  categories: string[];")
    ts_code.append("  shortDescription: string;")
    ts_code.append("  description: string;")
    ts_code.append("  heroImage: string;")
    ts_code.append("  gallery: string[];")
    ts_code.append("  location: string;")
    ts_code.append("  duration: string;")
    ts_code.append("  startTime: string;")
    ts_code.append("  endTime: string;")
    ts_code.append("  priceFrom: number;")
    ts_code.append("  currency: string;")
    ts_code.append("  adultPrice: number;")
    ts_code.append("  childPrice: number;")
    ts_code.append("  infantPrice?: number;")
    ts_code.append("  infant04Price?: number;")
    ts_code.append("  infantPolicy?: string;")
    ts_code.append("  minimumAge: string;")
    ts_code.append("  included: string[];")
    ts_code.append("  notIncluded: string[];")
    ts_code.append("  whatToBring: string[];")
    ts_code.append("  importantInfo: string[];")
    ts_code.append("  itinerary: TourItineraryItem[];")
    ts_code.append("  highlights: string[];")
    ts_code.append("  idealFor: string[];")
    ts_code.append("  accessibility: string;")
    ts_code.append("  cancellationPolicy: string;")
    ts_code.append("  relatedTours: string[];")
    ts_code.append("  faqs?: TourFAQ[];")
    ts_code.append("}\n")
    ts_code.append("export const TOURS: Tour[] = " + json.dumps(TOURS_DATA, ensure_ascii=False, indent=2) + ";\n")
    ts_code.append("export function getTourBySlug(slug: string): Tour | undefined {")
    ts_code.append("  return TOURS.find((tour) => tour.slug === slug);")
    ts_code.append("}\n")
    ts_code.append("export function getAllTours(): Tour[] {")
    ts_code.append("  return TOURS;")
    ts_code.append("}\n")
    ts_code.append("export function getRelatedTours(tour: Tour): Tour[] {")
    ts_code.append("  return tour.relatedTours")
    ts_code.append("    .map((slug) => getTourBySlug(slug))")
    ts_code.append("    .filter((t): t is Tour => t !== undefined && t.slug !== tour.slug)")
    ts_code.append("    .slice(0, 3);")
    ts_code.append("}\n")

    return "\n".join(ts_code)

def generate_sql():
    sql = []
    sql.append("-- =============================================================================")
    sql.append("-- Tio Nenê - Migração do Catálogo Canônico de Passeios")
    sql.append("-- Executável diretamente no Supabase SQL Editor")
    sql.append("-- Data: Outubro de 2026")
    sql.append("-- =============================================================================\n")
    sql.append("-- 1. Garante a estrutura completa da tabela 'tours'")
    sql.append("""CREATE TABLE IF NOT EXISTS public.tours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT[] DEFAULT '{}',
  description TEXT,
  short_description TEXT,
  price NUMERIC DEFAULT 0,
  price_label TEXT DEFAULT 'por pessoa',
  contact_only BOOLEAN DEFAULT false,
  duration TEXT,
  start_time TEXT,
  end_time TEXT,
  location TEXT,
  minimum_age TEXT,
  infant_policy TEXT,
  included TEXT[] DEFAULT '{}',
  not_included TEXT[] DEFAULT '{}',
  what_to_bring TEXT[] DEFAULT '{}',
  important_info TEXT[] DEFAULT '{}',
  highlights TEXT[] DEFAULT '{}',
  cancellation_policy TEXT,
  accessibility TEXT,
  image_url TEXT,
  gallery TEXT[] DEFAULT '{}',
  categories TEXT[] DEFAULT '{}',
  faqs JSONB DEFAULT '[]'::jsonb,
  itinerary JSONB DEFAULT '[]'::jsonb,
  active BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  destination_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
""")
    sql.append("-- 2. Adiciona colunas auxiliares com segurança caso a tabela já existisse")
    sql.append("""ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS category TEXT[] DEFAULT '{}';
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS short_description TEXT;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS start_time TEXT;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS end_time TEXT;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS minimum_age TEXT;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS infant_policy TEXT;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS what_to_bring TEXT[] DEFAULT '{}';
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS important_info TEXT[] DEFAULT '{}';
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS highlights TEXT[] DEFAULT '{}';
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS cancellation_policy TEXT;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS accessibility TEXT;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS gallery TEXT[] DEFAULT '{}';
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}';
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS faqs JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS itinerary JSONB DEFAULT '[]'::jsonb;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'tours' 
      AND column_name = 'category' 
      AND data_type = 'text'
  ) THEN
    ALTER TABLE public.tours ALTER COLUMN category TYPE TEXT[] USING ARRAY[category];
  END IF;
END $$;
""")
    sql.append("-- 3. Habilita RLS com leitura pública liberada para o site")
    sql.append("""ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tours' AND policyname = 'Permitir leitura pública de passeios ativos'
  ) THEN
    CREATE POLICY "Permitir leitura pública de passeios ativos"
      ON public.tours FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tours' AND policyname = 'Permitir gestão de passeios por administradores'
  ) THEN
    CREATE POLICY "Permitir gestão de passeios por administradores"
      ON public.tours FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
""")
    sql.append("-- 4. Inserção e atualização (UPSERT) dos 28 passeios canônicos\n")

    for t in TOURS_DATA:
        slug = t["slug"].replace("'", "''")
        name = t["name"].replace("'", "''")
        short_desc = t["shortDescription"].replace("'", "''")
        desc = t["description"].replace("'", "''")
        price = t["priceFrom"]
        duration = t["duration"].replace("'", "''")
        start_time = t["startTime"].replace("'", "''")
        end_time = t["endTime"].replace("'", "''")
        location = t["location"].replace("'", "''")
        min_age = t["minimumAge"].replace("'", "''")
        infant_pol = (t.get("infantPolicy") or "").replace("'", "''")
        cancellation = t["cancellationPolicy"].replace("'", "''")
        accessibility = t["accessibility"].replace("'", "''")
        hero_img = t["heroImage"].replace("'", "''")

        def array_to_sql(arr):
            if not arr:
                return "ARRAY[]::TEXT[]"
            escaped = [f"'{item.replace(chr(39), chr(39)+chr(39))}'" for item in arr]
            return "ARRAY[" + ", ".join(escaped) + "]::TEXT[]"

        category_sql = array_to_sql([t["category"]])
        included_sql = array_to_sql(t["included"])
        not_included_sql = array_to_sql(t["notIncluded"])
        what_to_bring_sql = array_to_sql(t["whatToBring"])
        important_info_sql = array_to_sql(t["importantInfo"])
        highlights_sql = array_to_sql(t["highlights"])
        gallery_sql = array_to_sql(t["gallery"])
        categories_sql = array_to_sql(t["categories"])

        faqs_json = json.dumps(t.get("faqs", []), ensure_ascii=False).replace("'", "''")
        itinerary_json = json.dumps(t.get("itinerary", []), ensure_ascii=False).replace("'", "''")

        is_featured = "true" if t["slug"] in ["chichen-itza", "isla-mujeres", "xcaret", "xelha"] else "false"

        sql.append(f"""INSERT INTO public.tours (
  slug, name, category, short_description, description, price, duration,
  start_time, end_time, location, minimum_age, infant_policy, cancellation_policy,
  accessibility, image_url, gallery, categories, included, not_included,
  what_to_bring, important_info, highlights, faqs, itinerary, active, featured
) VALUES (
  '{slug}',
  '{name}',
  {category_sql},
  '{short_desc}',
  '{desc}',
  {price},
  '{duration}',
  '{start_time}',
  '{end_time}',
  '{location}',
  '{min_age}',
  '{infant_pol}',
  '{cancellation}',
  '{accessibility}',
  '{hero_img}',
  {gallery_sql},
  {categories_sql},
  {included_sql},
  {not_included_sql},
  {what_to_bring_sql},
  {important_info_sql},
  {highlights_sql},
  '{faqs_json}'::jsonb,
  '{itinerary_json}'::jsonb,
  true,
  {is_featured}
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  short_description = EXCLUDED.short_description,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  duration = EXCLUDED.duration,
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  location = EXCLUDED.location,
  minimum_age = EXCLUDED.minimum_age,
  infant_policy = EXCLUDED.infant_policy,
  cancellation_policy = EXCLUDED.cancellation_policy,
  accessibility = EXCLUDED.accessibility,
  image_url = EXCLUDED.image_url,
  gallery = EXCLUDED.gallery,
  categories = EXCLUDED.categories,
  included = EXCLUDED.included,
  not_included = EXCLUDED.not_included,
  what_to_bring = EXCLUDED.what_to_bring,
  important_info = EXCLUDED.important_info,
  highlights = EXCLUDED.highlights,
  faqs = EXCLUDED.faqs,
  itinerary = EXCLUDED.itinerary,
  updated_at = now();
""")

    return "\n".join(sql)

if __name__ == "__main__":
    ts_content = generate_typescript()
    with open("src/data/tours.ts", "w", encoding="utf-8") as f:
        f.write(ts_content)
    print("Atualizado src/data/tours.ts com 28 passeios canônicos.")

    sql_content = generate_sql()
    with open("supabase/migrations/20261012_import_tours_catalog.sql", "w", encoding="utf-8") as f:
        f.write(sql_content)
    with open("supabase/import_tours_catalog.sql", "w", encoding="utf-8") as f:
        f.write(sql_content)
    print("Gerado arquivo SQL em supabase/import_tours_catalog.sql e supabase/migrations/20261012_import_tours_catalog.sql.")
