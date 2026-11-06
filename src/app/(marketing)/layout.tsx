import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";

// Loaded here, not in the root layout, so these two fonts are only downloaded for the landing page.
// Product screens keep Inter and the light theme from the UI spec.
const geist = Geist({ variable: "--font-geist", subsets: ["latin", "latin-ext"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin", "latin-ext"] });

export default function MarketingLayout({ children }: { children: ReactNode }) {
  // "landing-root" is the hook globals.css uses to paint the whole page dark (see the :has() rules there).
  return (
    <div className={`${geist.variable} ${geistMono.variable} landing-root flex flex-1 flex-col font-mono text-white`}>
      {children}
    </div>
  );
}
