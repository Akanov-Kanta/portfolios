/**
 * Every image the film uses. Built into public/art by scripts/build-art.py:
 * - s*-*: generated anime-cel layers (the characters themselves are animated sprites, see sprites.ts) (gpt-image, character sheet in ../../art/ronin/sheet.png), keyed and composited by hand
 * - pd-*: public-domain prints from The Met and the Art Institute of Chicago, recoloured toward the palette
 */

export interface Art {
  src: string;
  width: number;
  height: number;
  alt: string;
}

const a = (name: string, width: number, height: number, alt: string): Art => ({ src: `/art/${name}.webp`, width, height, alt });

export const art = {
  s1Sky: a("s1-sky", 2880, 1920, ""),
  s1Roof: a("s1-roof", 1536, 703, ""),
  s2Bg: a("s2-bg", 1536, 1024, ""),
  s3Bg: a("s3-bg", 1536, 1024, ""),
  s4Bg: a("s4-bg", 1536, 1024, ""),
  s5Bg: a("s5-bg", 1536, 1024, ""),
  s6Bg: a("s6-bg", 1536, 1024, ""),

  pdGanku: a("pd-ganku-tiger", 1440, 1230, "Detail of Kishi Ganku's gold-leaf screen “Dragon and Tiger”."),
  pdKorin: a("pd-korin-waves", 2400, 2173, "Ogata Kōrin's screen “Rough Waves”."),
  pdWave: a("pd-great-wave", 2400, 1661, "Hokusai's “Under the Wave off Kanagawa”."),
  pdMoon: a("pd-giant-moon", 2400, 1216, "Yoshitoshi's print of Kezori Kuemon before an enormous moon."),
  pdTsuna: a("pd-tsuna-demon", 1708, 2250, "Shunshō's print of Watanabe no Tsuna fighting the demon at Rashōmon."),
  pdNight: a("pd-night-attack", 2400, 1674, "Kuniyoshi's print of the forty-seven rōnin's night attack in the snow."),
  pdPlum: a("pd-plum-moon", 2400, 1832, "Hiroshige's “A Red Plum Branch against the Summer Moon”."),
} satisfies Record<string, Art>;

/** the paintings inside the film, credited at the end */
export const paintings = [
  { art: art.pdPlum, title: "A Red Plum Branch against the Summer Moon", artist: "Utagawa Hiroshige", date: "c. mid-1840s", museum: "Art Institute of Chicago", url: "https://www.artic.edu/artworks/47686" },
  { art: art.pdGanku, title: "Dragon and Tiger", artist: "Kishi Ganku", date: "1835", museum: "Art Institute of Chicago", url: "https://www.artic.edu/artworks/236656" },
  { art: art.pdKorin, title: "Rough Waves", artist: "Ogata Kōrin", date: "ca. 1704–09", museum: "The Metropolitan Museum of Art", url: "https://www.metmuseum.org/art/collection/search/44918" },
  { art: art.pdTsuna, title: "The Warrior Watanabe no Tsuna Fighting the Demon at Rashōmon", artist: "Katsukawa Shunshō", date: "about 1770", museum: "Art Institute of Chicago", url: "https://www.artic.edu/artworks/28302" },
  { art: art.pdNight, title: "Act 11: The Night Attack, from “Treasury of Loyal Retainers (Chūshingura)”", artist: "Utagawa Kuniyoshi", date: "c. 1831/32", museum: "Art Institute of Chicago", url: "https://www.artic.edu/artworks/50554" },
  { art: art.pdMoon, title: "Ichikawa Danjūrō IX as Kezori Kuemon", artist: "Tsukioka Yoshitoshi", date: "about 1890", museum: "Art Institute of Chicago", url: "https://www.artic.edu/artworks/102617" },
  { art: art.pdWave, title: "Under the Wave off Kanagawa (The Great Wave)", artist: "Katsushika Hokusai", date: "1830/33", museum: "Art Institute of Chicago", url: "https://www.artic.edu/artworks/77333" },
] as const;
