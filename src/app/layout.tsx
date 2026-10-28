import type { Metadata, Viewport } from "next";
import { Inter, Libre_Caslon_Text } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const caslon = Libre_Caslon_Text({
  variable: "--font-caslon",
  subsets: ["latin"],
  weight: "400",
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
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${caslon.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
