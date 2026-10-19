import { ArtDefs } from "@/components/art/Hanko";
import { Disciplines } from "@/components/Disciplines";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { Motion } from "@/components/Motion";
import { Nav } from "@/components/Nav";
import { Philosophy } from "@/components/Philosophy";
import { Plans } from "@/components/Plans";
import { Schedule } from "@/components/Schedule";
import { Senseis } from "@/components/Senseis";
import { TrialForm } from "@/components/TrialForm";

export default function Home() {
  return (
    <>
      <ArtDefs />
      <div className="intro-cut" aria-hidden="true" />
      <div className="flash flash--intro" aria-hidden="true" />
      <a href="#trial" className="label sr-only z-[200] bg-vermilion px-4 py-3 text-rice focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Skip to booking
      </a>
      <Nav />
      <main>
        <Hero />
        <Philosophy />
        <Disciplines />
        <Schedule />
        <Senseis />
        <Plans />
        <TrialForm />
      </main>
      <Footer />
      <Motion />
    </>
  );
}
