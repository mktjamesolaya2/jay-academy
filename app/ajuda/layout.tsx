import { Libre_Baskerville, Poppins } from "next/font/google";

/**
 * As fontes da marca, **só nesta página**.
 *
 * ⚠️ Não vão no layout raiz de propósito: aquele envolve o painel inteiro, que
 * é Inter e tem outro DNA (SaaS escuro). Misturar deixaria o admin com cara de
 * material de marca e a marca com cara de painel.
 *
 * Self-hosted pelo `next/font`: sem pedido a servidor de fora, sem piscar de
 * fonte quando carrega — e é justo a primeira coisa que a aluna vê.
 */

const serifada = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-marca",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
  variable: "--font-corpo",
});

export default function AjudaLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={`${serifada.variable} ${poppins.variable}`}>{children}</div>
  );
}
