import { Credits, LoopWave } from "@/components/film/Credits";
import { Film } from "@/components/film/Film";
import { ColdOpen, FilmChrome } from "@/components/film/Overlays";
import { Shot1Moon } from "@/components/film/Shot1Moon";
import { Shot2Bamboo } from "@/components/film/Shot2Bamboo";
import { Shot3Corridor } from "@/components/film/Shot3Corridor";
import { Shot4Duel } from "@/components/film/Shot4Duel";
import { Shot5Roofs } from "@/components/film/Shot5Roofs";
import { Shot6Rider } from "@/components/film/Shot6Rider";
import { Nav } from "@/components/Nav";

/**
 * The portfolio as a short anime film in six shots, end credits, and a wave that carries it back to the start.
 * Server-rendered as plain stacked sections; <Film> turns them into one scroll-scrubbed stage.
 */
export default function Home() {
  return (
    <>
      <a href="#about" className="label sr-only z-[90] bg-vermilion p-3 text-rice focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
        Skip to content
      </a>
      <Nav />
      <main className="film">
        <Shot1Moon />
        <Shot2Bamboo />
        <Shot3Corridor />
        <Shot4Duel />
        <Shot5Roofs />
        <Shot6Rider />
        <Credits />
        <LoopWave />
      </main>
      <div className="film-track" aria-hidden="true" />
      <FilmChrome />
      <div className="grain" aria-hidden="true" />
      <ColdOpen />
      <Film />
    </>
  );
}
