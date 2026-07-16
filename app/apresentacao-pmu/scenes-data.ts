/**
 * Conteúdo das cenas da apresentação PMU CLASS.
 * Separado do componente pra ficar fácil de editar texto sem mexer no layout.
 *
 * Cada cena pode ter um `chatgptSuggestion` — card destacado com sugestão
 * de melhoria que o James propõe ao time ao vivo.
 */

export type ChatGPTSuggestion = {
  title: string;
  before?: string;
  after?: string;
  rationale?: string;
};

export const PMU_LINK = "/pmuclass"; // relativo: funciona no vercel.app e no domínio final

export const CHATGPT_SUGGESTIONS: Record<string, ChatGPTSuggestion[]> = {
  vitrine: [
    {
      title: "Headline da primeira dobra mais explícita",
      before: "Banner de destaque com curso featured",
      after:
        '"Escolha sua próxima formação em micropigmentação com James Olaya"',
      rationale:
        "Em poucos segundos a pessoa precisa entender que é uma vitrine de cursos do James.",
    },
    {
      title: "Hierarquia de CTAs na home",
      after:
        "Primário: Descobrir meu curso ideal · Secundário: Ver todos os cursos · Apoio: Falar com a equipe",
      rationale: "Muitos caminhos sem hierarquia confundem.",
    },
  ],
  cursos: [
    {
      title: "Seção 'pra quem é' e 'pra quem não é'",
      after:
        "Cada página de curso ganha um bloco claro mostrando o perfil ideal — e o perfil que ainda não tá pronto pra esse curso.",
      rationale:
        "Reduz dúvida, aumenta confiança, evita reembolso de aluno errado.",
    },
    {
      title: "Comparador de cursos",
      after:
        "Tabela com nome, nível, técnica, melhor pra quem, formato e CTA — lado a lado.",
      rationale: "Com vários cursos, o aluno fica em dúvida sobre qual escolher.",
    },
  ],
  ferramentas: [
    {
      title: "Quiz vira diagnóstico personalizado",
      before: "Quiz responde \"Qual seu nível?\"",
      after:
        "Tela final com perfil do aluno (ex: \"Profissional em evolução\"), diagnóstico textual, trilha recomendada e CTA pra receber no WhatsApp.",
      rationale:
        "Vira ferramenta de captura de lead — não fica só interativo, gera dado comercial.",
    },
    {
      title: "Prova social perto dos CTAs",
      after:
        "Antes/depois e depoimento aparecem logo antes do botão de compra, não enterrados no meio.",
      rationale: "Prova social vale ouro no ponto de decisão.",
    },
  ],
  metricas: [
    {
      title: "Plug de analytics em todo clique",
      after:
        "Rastrear: cliques por curso, uso do quiz, uso da IA, cliques no WhatsApp, cliques pro Hotmart, abandono por dobra, dúvidas mais frequentes, conversão por rota.",
      rationale:
        "Transforma o microsite em ferramenta de inteligência comercial.",
    },
  ],
};

export const SCENES = [
  {
    id: "intro",
    label: "Abertura",
  },
  {
    id: "antes",
    label: "O antes",
  },
  {
    id: "virou",
    label: "O agora",
  },
  {
    id: "conceito",
    label: "O conceito",
  },
  {
    id: "vitrine",
    label: "A vitrine",
  },
  {
    id: "cursos",
    label: "Páginas de curso",
  },
  {
    id: "caminhos",
    label: "Caminhos do aluno",
  },
  {
    id: "ferramentas",
    label: "Quiz · IA · WhatsApp",
  },
  {
    id: "diferenciais",
    label: "Diferenciais",
  },
  {
    id: "fim",
    label: "Conclusão",
  },
] as const;

export type SceneId = (typeof SCENES)[number]["id"];
