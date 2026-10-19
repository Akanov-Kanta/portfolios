import { Intro } from "@/components/chapters/Intro";
import { Title } from "@/components/chapters/Title";
import { Drop } from "@/components/chapters/Drop";
import { Dossier } from "@/components/chapters/Dossier";
import { Invert } from "@/components/chapters/Invert";
import { Outro } from "@/components/chapters/Outro";
import { SoundToggle } from "@/components/ui/SoundToggle";

export default function Home() {
  return (
    <>
      <main>
        <Intro />
        <Title />
        <Drop />
        <Dossier />
        <Invert />
      </main>
      <Outro />
      <SoundToggle />
    </>
  );
}
