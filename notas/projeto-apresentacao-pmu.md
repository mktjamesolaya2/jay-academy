# 🎬 Projeto Apresentação PMU CLASS

**Status**: em desenvolvimento (iniciado 2026-06-02)

## O que é

Microsite-apresentação dentro do portal pra James usar quando apresentar o projeto PMU CLASS pro time. Inspirado em keynote da Apple + estética streaming (mesmo DNA da própria PMU CLASS).

**URL**: `jay-academy.vercel.app/apresentacao-pmu`

## Por que existe

João (TI do James) desenvolveu o `/pmuclass` e James pediu apresentação. ChatGPT entregou briefing extenso com:
- Definição estratégica (microsite educacional de vendas, não landing page)
- Anatomia das páginas
- Pontos positivos
- **Sugestões de melhoria** ← isso vira card destacado nas cenas pra James propor mudanças ao vivo
- Fluxo do usuário (6 caminhos)

## Decisões (2026-06-02)

- **Localização**: rota no portal (`portal/app/apresentacao-pmu/`)
- **Navegação**: scroll-snap + setas + teclado (←/→/Espaço)
- **Vinheta**: Netflix "tudum" — fundo preto, logo PMU CLASS pulse + gradient
- **Estilo**: dark `#0a0a0a` + gradient pink→orange + Fraunces italic + Inter (DNA PMU CLASS)
- **Sugestões do ChatGPT**: aparecem como cards destacados nas cenas, marcadas como "💡 Sugestão" pra James propor mudanças no site real ao vivo

## Estrutura de 10 cenas

0. Vinheta (logo PMU CLASS)
1. **O antes** — link da bio → WhatsApp frio
2. **O virou** — microsite educacional de vendas
3. **O conceito** — Netflix dos cursos do James
4. **A vitrine** — hero / carrossel / categorias
5. **As páginas de curso** — identidade por curso
6. **Os caminhos** — 6 rotas do aluno até a compra
7. **As ferramentas** — quiz / IA / WhatsApp / Hotmart
8. **Diferenciais + próximos passos**
9. **Cena final** — "transforma o link da bio em jornada"

## Conteúdo bruto recebido

Briefing completo na sessão de chat 2026-06-02 (do João pro ChatGPT, repassado pelo James). Inclui:
- Análise estratégica
- Anatomia das dobras
- 7 tipos de landing page e como o projeto se encaixa
- 6 caminhos de usuário
- Lista de pontos positivos
- Lista de sugestões de melhoria (clareza no topo, hierarquia CTAs, quiz como diagnóstico, comparador de cursos, mais prova social, métricas, "para quem é" por curso)

## How to apply

- Mantém DNA visual da PMU CLASS — paleta sagrada de [[feedback-estetica]]
- NÃO confundir com DNA do portal admin (este é apresentação comercial, segue regras de LP)
- Sugestões do ChatGPT viram CARDS destacados — não enterrar no fluxo, deixar bem visíveis
- Mobile-first: deve funcionar bem no celular pra James abrir em qualquer lugar
- Vinheta inicial só uma vez por sessão (ou opcional via botão "ver novamente")
