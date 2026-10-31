import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Montserrat,
  Playfair_Display,
} from "next/font/google";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sarita Joyería y Accesorios",
  description:
    "Joyas y accesorios elegidos con cariño para acompañarte todos los días.",
  metadataBase: getSiteUrl(),
  openGraph: {
    type: "website",
    locale: "es_BO",
    siteName: "Sarita Joyería y Accesorios",
    title: "Sarita Joyería y Accesorios",
    description:
      "Joyas y accesorios elegidos con cariño para acompañarte todos los días.",
    images: [
      {
        url: "/logo-luna.png",
        width: 562,
        height: 328,
        alt: "Logo de Sarita Joyería y Accesorios",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sarita Joyería y Accesorios",
    description:
      "Joyas y accesorios elegidos con cariño para acompañarte todos los días.",
    images: ["/logo-luna.png"],
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${playfairDisplay.variable} ${montserrat.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
