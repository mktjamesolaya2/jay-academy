import type { Metadata } from "next";
import { Presentation } from "./presentation";

export const metadata: Metadata = {
  title: "PMU CLASS — Apresentação do projeto",
  description:
    "O microsite educacional de vendas da Jay Academy — história, conceito, estrutura e próximos passos.",
};

export default function ApresentacaoPmuPage() {
  return <Presentation />;
}
