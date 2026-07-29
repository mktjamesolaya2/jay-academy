import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// 29/07: o GTM saiu daqui. Este layout envolve TODA página renderizada por
// React — ou seja, o painel admin inteiro e a /apresentacao-pmu — e o container
// só vale na /magicshadow (ver GTM_SLUGS em lib/google-tag.ts). A /magicshadow
// é servida por route handler, não passa por este layout.

// Self-hosted via next/font: sem requisição externa render-blocking,
// pré-carregada e sem flash de fonte (FCP/CLS melhores).
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Jay Academy — Portal",
  description: "Painel administrativo das LPs Jay Academy",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
