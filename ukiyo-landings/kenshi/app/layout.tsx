import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Shippori_Mincho } from "next/font/google";
import "./globals.css";

const shippori = Shippori_Mincho({
  variable: "--font-shippori",
  weight: ["400", "600", "800"],
  subsets: ["latin"],
  display: "swap",
});

const barlow = Barlow_Condensed({
  variable: "--font-barlow",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "KENSHI — Kendō · Iaidō · Conditioning Dojo",
  description:
    "A sword dojo in the bamboo district. Kendō, iaidō and MMA conditioning for every level. Book a free trial class.",
};

export const viewport: Viewport = {
  themeColor: "#0b1622",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${shippori.variable} ${barlow.variable}`}>
      <body>{children}</body>
    </html>
  );
}
