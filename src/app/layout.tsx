import type { Metadata } from "next";
import localFont from "next/font/local";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const playfairDisplayLatin = localFont({
  src: [
    { path: "./fonts/playfair-display-latin-400-normal.woff2", weight: "400" },
    { path: "./fonts/playfair-display-latin-400-italic.woff2", weight: "400", style: "italic" },
    { path: "./fonts/playfair-display-latin-600-normal.woff2", weight: "600" },
    { path: "./fonts/playfair-display-latin-600-italic.woff2", weight: "600", style: "italic" },
    { path: "./fonts/playfair-display-latin-700-normal.woff2", weight: "700" },
    { path: "./fonts/playfair-display-latin-700-italic.woff2", weight: "700", style: "italic" },
  ],
  display: "swap",
  declarations: [
    { prop: "font-family", value: "Playfair Display" },
    {
      prop: "unicode-range",
      value:
        "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
    },
  ],
});

const playfairDisplayLatinExt = localFont({
  src: [
    { path: "./fonts/playfair-display-latin-ext-400-normal.woff2", weight: "400" },
    { path: "./fonts/playfair-display-latin-ext-400-italic.woff2", weight: "400", style: "italic" },
    { path: "./fonts/playfair-display-latin-ext-600-normal.woff2", weight: "600" },
    { path: "./fonts/playfair-display-latin-ext-600-italic.woff2", weight: "600", style: "italic" },
    { path: "./fonts/playfair-display-latin-ext-700-normal.woff2", weight: "700" },
    { path: "./fonts/playfair-display-latin-ext-700-italic.woff2", weight: "700", style: "italic" },
  ],
  display: "swap",
  declarations: [
    { prop: "font-family", value: "Playfair Display" },
    {
      prop: "unicode-range",
      value:
        "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF",
    },
  ],
});

const montserratLatin = localFont({
  src: [
    { path: "./fonts/montserrat-latin-400-normal.woff2", weight: "400" },
    { path: "./fonts/montserrat-latin-500-normal.woff2", weight: "500" },
    { path: "./fonts/montserrat-latin-600-normal.woff2", weight: "600" },
  ],
  display: "swap",
  declarations: [
    { prop: "font-family", value: "Montserrat" },
    {
      prop: "unicode-range",
      value:
        "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
    },
  ],
});

const montserratLatinExt = localFont({
  src: [
    { path: "./fonts/montserrat-latin-ext-400-normal.woff2", weight: "400" },
    { path: "./fonts/montserrat-latin-ext-500-normal.woff2", weight: "500" },
    { path: "./fonts/montserrat-latin-ext-600-normal.woff2", weight: "600" },
  ],
  display: "swap",
  declarations: [
    { prop: "font-family", value: "Montserrat" },
    {
      prop: "unicode-range",
      value:
        "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF",
    },
  ],
});

const geistLatin = localFont({
  src: "./fonts/geist-latin-wght-normal.woff2",
  weight: "100 900",
  display: "swap",
  declarations: [
    { prop: "font-family", value: "Geist" },
    {
      prop: "unicode-range",
      value:
        "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
    },
  ],
});

const geistLatinExt = localFont({
  src: "./fonts/geist-latin-ext-wght-normal.woff2",
  weight: "100 900",
  display: "swap",
  declarations: [
    { prop: "font-family", value: "Geist" },
    {
      prop: "unicode-range",
      value:
        "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF",
    },
  ],
});

const geistMonoLatin = localFont({
  src: "./fonts/geist-mono-latin-wght-normal.woff2",
  weight: "100 900",
  display: "swap",
  declarations: [
    { prop: "font-family", value: "Geist Mono" },
    {
      prop: "unicode-range",
      value:
        "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
    },
  ],
});

const geistMonoLatinExt = localFont({
  src: "./fonts/geist-mono-latin-ext-wght-normal.woff2",
  weight: "100 900",
  display: "swap",
  declarations: [
    { prop: "font-family", value: "Geist Mono" },
    {
      prop: "unicode-range",
      value:
        "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF",
    },
  ],
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
      className={`${playfairDisplayLatin.className} ${playfairDisplayLatinExt.className} ${montserratLatin.className} ${montserratLatinExt.className} ${geistLatin.className} ${geistLatinExt.className} ${geistMonoLatin.className} ${geistMonoLatinExt.className} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
