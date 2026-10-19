import Intro from "@/components/sections/Intro";
import Nav from "@/components/sections/Nav";
import Hero from "@/components/sections/Hero";
import Ticker from "@/components/sections/Ticker";
import MenuScreen from "@/components/sections/MenuScreen";
import Story from "@/components/sections/Story";
import Chef from "@/components/sections/Chef";
import Visit from "@/components/sections/Visit";
import Reserve from "@/components/sections/Reserve";
import Footer from "@/components/sections/Footer";
import Motion from "@/components/motion/Motion";

export default function Home() {
  return (
    <>
      <Intro />
      <Nav />
      <main>
        <Hero />
        <Ticker />
        <MenuScreen />
        <Story />
        <Chef />
        <Visit />
        <Reserve />
      </main>
      <Footer />
      <Motion />
    </>
  );
}
