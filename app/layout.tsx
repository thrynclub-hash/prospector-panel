import type { Metadata } from "next";
import { Unbounded, Manrope } from "next/font/google";
import "./globals.css";

// Identidade visual "Signal Ledger" do ecossistema — mesma dupla de fontes
// do Toqy/ZapFlow: Unbounded pro display, Manrope pro corpo.
const unbounded = Unbounded({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Prospector de Sites",
  description: "Encontre negócios locais com site fraco, redesenhe e feche clientes — tudo num painel só.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${unbounded.variable} ${manrope.variable}`}>
      <body className="min-h-screen font-body antialiased">{children}</body>
    </html>
  );
}
