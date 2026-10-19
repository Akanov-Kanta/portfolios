import AgeGate from "@/components/AgeGate";
import Motion from "@/components/Motion";
import Nav from "@/components/Nav";
import Buy from "@/components/sections/Buy";
import Craft from "@/components/sections/Craft";
import Footer from "@/components/sections/Footer";
import Heritage from "@/components/sections/Heritage";
import Hero from "@/components/sections/Hero";
import Newsletter from "@/components/sections/Newsletter";
import Press from "@/components/sections/Press";
import Range from "@/components/sections/Range";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Heritage />
        <Range />
        <Craft />
        <Press />
        <Buy />
        <Newsletter />
      </main>
      <Footer />
      <AgeGate />
      <Motion />
    </>
  );
}
