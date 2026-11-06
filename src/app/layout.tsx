import type { Metadata } from "next";
import { Inter, Newsreader } from "next/font/google";
import "./globals.css";

// latin-ext is required: the plain "latin" subset has no ə, ğ, ı, İ, ş.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
});

// Display serif for headlines only (editorial look). The UI spec's Inter stays the face for body text and product screens.
// "opsz" lets the font redraw itself for large sizes, which is what makes big headlines look refined.
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: "Voxis — CV lazım deyil",
  description: "Səslə müraciət: telefonla QR kodu skan edin, suallara cavab verin. HR isə uyğunluğu izahlı görür.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="az" className={`${inter.variable} ${newsreader.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
