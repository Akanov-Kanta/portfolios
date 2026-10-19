import { Header } from "@/components/case/Header";
import { Loader } from "@/components/case/Loader";
import { Hero } from "@/components/case/Hero";
import { Files } from "@/components/case/Files";
import { Profile } from "@/components/case/Profile";
import { Contact } from "@/components/case/Contact";

/**
 * CASE FILE (reference/top/DIRECTION.md §3A): 00 cold open → 01 subject → 02 files → 03 profile →
 * 04 contact. Everything the file view makes inert lives in #page.
 */
export default function Home() {
  return (
    <>
      <div id="page">
        <Header />
        <main>
          <Hero />
          <Files />
          <Profile />
          <Contact />
        </main>
      </div>
      <Loader />
    </>
  );
}
