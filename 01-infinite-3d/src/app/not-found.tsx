import Link from "next/link";

export default function NotFound() {
  return (
    <main className="station relative flex min-h-svh max-w-xl flex-col justify-center px-5 pb-24 pt-32 sm:px-8 lg:px-16">
      <p className="label marker-muted">404</p>
      <h1 className="display mt-4 text-5xl sm:text-7xl">Off the path.</h1>
      <p className="prose-ink mt-6 max-w-[38ch] text-lg text-ink/90 sm:text-xl">This page is not on the loop. Head back to the room.</p>
      <Link href="/" className="label link-mono mt-10 self-start">
        Back home
      </Link>
    </main>
  );
}
