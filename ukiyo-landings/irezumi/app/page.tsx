import Motion from "@/components/Motion";
import Nav from "@/components/Nav";
import Artists from "@/components/sections/Artists";
import Booking from "@/components/sections/Booking";
import Faq from "@/components/sections/Faq";
import Footer from "@/components/sections/Footer";
import Gallery from "@/components/sections/Gallery";
import Hero from "@/components/sections/Hero";
import Philosophy from "@/components/sections/Philosophy";
import Pricing from "@/components/sections/Pricing";
import Process from "@/components/sections/Process";

export default function Home() {
  return (
    <>
      <a href="#philosophy" className="label sr-only z-[90] bg-vermilion px-4 py-3 text-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Skip to content
      </a>
      <Nav />
      <main>
        <Hero />
        <Philosophy />
        <Artists />
        <Gallery />
        <Process />
        <Pricing />
        <Booking />
        <Faq />
      </main>
      <Footer />
      <Motion />
    </>
  );
}
