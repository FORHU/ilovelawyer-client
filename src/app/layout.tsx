import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Providers } from "@/components/providers";
import "./globals.css";

// Fonts are self-hosted (src/app/fonts) so `next build` never depends on reaching Google Fonts.
const inter = localFont({
  src: "./fonts/inter-latin.woff2",
  variable: "--font-inter",
  weight: "400 800",
});

// Accented Latin beyond Western European, Cyrillic, Greek and Vietnamese. It sits ahead of Latin in
// --font-sans and its unicode-range keeps it to those characters, so a browser only downloads it
// when a page actually shows one, like a Polish surname.
const interExtended = localFont({
  src: "./fonts/inter-extended.woff2",
  variable: "--font-inter-extended",
  weight: "400 800",
  preload: false,
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0300-0303,U+0309,U+0323,U+0370-03FF,U+0400-052F,U+1C80-1C8A,U+1D00-1DBF,U+1E00-1EFF,U+1F00-1FFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2116,U+2C60-2C7F,U+2DE0-2DFF,U+A640-A69F,U+A720-A7FF,U+FE2E-FE2F",
    },
  ],
});

const caslon = localFont({
  src: "./fonts/libre-caslon-text.woff2",
  variable: "--font-caslon",
  weight: "400",
  adjustFontFallback: "Times New Roman",
});

export const metadata: Metadata = {
  title: "ilovelawyer",
  description:
    "Free cases, pay only for the chat credits you use. Chat with the AI, bring in a lawyer when it matters.",
  icons: { icon: "/brand/mark-light.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // The tour keeps its control bar clear of the phone's home indicator (env(safe-area-inset-bottom)).
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${interExtended.variable} ${caslon.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
