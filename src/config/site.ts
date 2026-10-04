export const SITE_CONFIG = {
  name: "Tio Nenê",
  title: "Tio Nenê — Viagens e experiências no México",
  description:
    "Viagens e experiências com curadoria local em Cancún e no México. Tio Nenê: viagem completa, passeios e Curadoria Bella.",
  themeColor: "#693039",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "",
  email: "contato@tionene.com",
  location: "Cancún, Quintana Roo – México",
  supportLang: "Atendimento em Português",
  routes: {
    home: "/",
    passeios: "/passeios",
    sobreNos: "/sobre-nos",
    curadoriaBella: "/curadoria-bella",
    viagemCompleta: "/viagem-completa",
    programacao: "/programacao-de-viagem",
    contato: "#contato",
    tripQuiz: "#trip-quiz",
    catalogo: "/passeios#catalogo",
    sejaParceiro: "/seja-parceiro",
  },
};
