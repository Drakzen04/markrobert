import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono, Fraunces } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });
const fraunces = Fraunces({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "Casper Bot — Analyse par capture (Order Block / ICT)",
  description: "Dépose une capture de graphique, obtiens une analyse selon la grille 5 étoiles order block / ICT, valide et exécute sur ton compte MT5."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} ${plexMono.variable} ${fraunces.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
