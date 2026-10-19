import { Hero } from "@/components/home/Hero";
import { About } from "@/components/home/About";
import { Projects } from "@/components/home/Projects";
import { Contact } from "@/components/home/Contact";
import { LoopClone } from "@/components/world/scroll/LoopClone";
import { HomeLoop } from "@/components/world/scroll/HomeLoop";

export default function Home() {
  return (
    <main id="loop-root">
      <HomeLoop />
      <Hero />
      <About />
      <Projects />
      <Contact />
      <LoopClone />
    </main>
  );
}
