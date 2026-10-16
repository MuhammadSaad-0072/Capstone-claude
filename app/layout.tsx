import type { Metadata } from "next";
import type { ReactNode } from "react";
import { IBM_Plex_Sans, Newsreader } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const serif = Newsreader({ subsets: ["latin"], variable: "--font-serif", display: "swap" });
const sans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: "Paper Tape: learn to read market data",
  description:
    "An educational trading decision-support app. Explore market data, indicators and plain-language explanations, and practice with a paper-trading portfolio. No real trades.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:bg-panel focus:px-3 focus:py-2"
        >
          Skip to content
        </a>
        <Header />
        <main id="main" className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          {children}
        </main>
        <footer className="mx-auto max-w-6xl border-t border-rule px-4 py-6 text-xs text-muted sm:px-6">
          Paper Tape is a learning project. Indicators and explanations describe past prices only. They are not predictions,
          recommendations or financial advice, and no real trades are ever placed.
        </footer>
      </body>
    </html>
  );
}
