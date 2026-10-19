import { SvgDefs } from "@/components/art/SvgDefs";
import { Characters } from "@/components/Characters";
import { Features } from "@/components/Features";
import { Footer } from "@/components/Footer";
import { MotionDirector } from "@/components/MotionDirector";
import { Nav } from "@/components/Nav";
import { Release } from "@/components/Release";
import { SlashStage } from "@/components/SlashStage";
import { Story } from "@/components/Story";
import { Trailer } from "@/components/Trailer";

export default function Home() {
  return (
    <>
      <SvgDefs />
      <Nav />
      <main>
        <SlashStage />
        <Story />
        <Characters />
        <Features />
        <Trailer />
        <Release />
      </main>
      <Footer />
      <MotionDirector />
    </>
  );
}
