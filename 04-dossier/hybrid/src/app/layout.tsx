import type { Metadata, Viewport } from "next";
import { fontVariables } from "@/styles/fonts";
import { site } from "@/content/site";
import { INTRO_SCRIPT } from "@/lib/intro";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import "./globals.css";

export const metadata: Metadata = {
  title: `${site.name} — ${site.role}`,
  description: `${site.name}, ${site.role.toLowerCase()} in ${site.location.city}. ${site.bio[0]}`,
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fontVariables} antialiased`} suppressHydrationWarning>
      <head>
        {/* decides, before first paint, whether the cold open plays (lib/intro.ts) */}
        <script dangerouslySetInnerHTML={{ __html: INTRO_SCRIPT }} />
      </head>
      <body>
        <SmoothScroll>{children}</SmoothScroll>
        <div id="cf-flash" aria-hidden className="flash" />
      </body>
    </html>
  );
}
