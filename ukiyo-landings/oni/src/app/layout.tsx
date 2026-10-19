import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Shippori_Mincho_B1 } from "next/font/google";
import "./globals.css";

const mincho = Shippori_Mincho_B1({
  variable: "--font-mincho",
  weight: ["500", "700", "800"],
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
  title: "ONI — Late-night ramen & izakaya",
  description:
    "ONI is a twenty-seat ramen bar and izakaya under the rail bridge. Eighteen-hour broth, small plates off the binchotan, cold sake. Open until 4 a.m.",
};

export const viewport: Viewport = {
  themeColor: "#0B1622",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${mincho.variable} ${barlow.variable}`}>
      <body>
        {children}
        <div className="grain" aria-hidden="true" />
      </body>
    </html>
  );
}
