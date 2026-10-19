import type { Metadata, Viewport } from "next";
import { captionFont } from "@/styles/fonts";
import { site } from "@/content/site";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { FxLayer } from "@/components/fx/FxLayer";
import "./globals.css";

export const metadata: Metadata = {
  title: `${site.name.toUpperCase()} // DOSSIER`,
  description: `${site.name}, ${site.role.toLowerCase()}. ${site.bio[0]}`,
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${captionFont.variable} antialiased`}>
      <body>
        <SmoothScroll>{children}</SmoothScroll>
        <FxLayer />
      </body>
    </html>
  );
}
