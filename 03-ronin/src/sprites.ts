/**
 * The film's animation. Built into public/art/sprites by scripts/build-sprites.py from generated 2x2
 * sprite sheets (../../art/sprites): every sprite is one horizontal strip of registered frames.
 *
 * `seq` is the exposure sheet: [frame, ms] pairs played in a loop, anime-style — mostly on twos/threes
 * (6–12 drawings a second) with long holds, so the drawings read as key poses, not as a slideshow.
 */

export interface SpriteDef {
  src: string;
  /** one frame, in px of the strip */
  w: number;
  h: number;
  n: number;
  seq: [frame: number, ms: number][];
  /** the wind shader: a soft grayscale mask strip (same frame layout) of where cloth may ripple */
  wind?: { mask: string; amp: number };
  /** a scroll beat (Film.tsx dispatches `film:beat`) that cuts the loop straight to seq[at] */
  beat?: { name: string; at: number };
  /** frames that announce themselves (`film:frame`), e.g. an impact drawing */
  emit?: number[];
  alt?: string;
}

const s = (name: string, w: number, h: number, n: number, seq: SpriteDef["seq"], extra: Partial<SpriteDef> = {}): SpriteDef => ({
  src: `/art/sprites/${name}.webp`,
  w,
  h,
  n,
  seq,
  ...extra,
});

// 6 fps ≈ 167 ms a drawing, 9 fps ≈ 111, 10 fps = 100
export const sprites = {
  // 1 · on the roof: the scarf and sleeves thrash in the wind; now and then he lifts his head and the blade catches the moon
  idle: s(
    "idle",
    720,
    1029,
    4,
    [
      [0, 167], [1, 167], [3, 167], [1, 167],
      [0, 167], [1, 167], [3, 167], [1, 167],
      [0, 167], [1, 167], [3, 167],
      [2, 1100],
      [3, 167], [1, 167],
    ],
    {
      wind: { mask: "/art/sprites/idle-wind.png", amp: 0.016 },
      alt: "A lone rōnin in a straw hat stands on a temple roof under a giant moon, sword drawn, his torn vermilion scarf thrashing in the wind.",
    },
  ),
  // 2 · seiza in the grove: a single drawing, all the life is in the wind shader
  meditate: {
    src: "/art/s2-ronin.webp",
    w: 995,
    h: 876,
    n: 1,
    seq: [[0, 60_000]],
    wind: { mask: "/art/sprites/s2-ronin-wind.png", amp: 0.012 },
    alt: "The rōnin sits in seiza in a misty bamboo grove, eyes closed, sword across his lap, his scarf drifting in the breeze.",
  } satisfies SpriteDef,
  // 3 · the walk away down the corridor, on twos
  walk: s("walk", 544, 945, 4, [[0, 167], [1, 167], [2, 167], [3, 167]], {
    alt: "Seen from behind, the rōnin walks down a corridor of gold-leaf dragon screens.",
  }),
  // 4 · the duel: both fighters share a 2.8 s phrase — the oni thrusts, the rōnin answers with the cut
  oni: s("oni", 816, 1023, 4, [[0, 1300], [1, 250], [2, 450], [3, 800]], {
    alt: "An armoured warlord in a red oni mask thrusts a cross-bladed spear.",
  }),
  strike: s("strike", 1046, 692, 4, [[0, 1700], [1, 84], [2, 216], [3, 800]], {
    beat: { name: "clash", at: 1 },
    emit: [1],
    alt: "The rōnin lunges and cuts, his sword leaving a white arc.",
  }),
  // 5 · the roof run, 10 drawings a second
  run: s("run", 1072, 640, 4, [[0, 100], [1, 100], [2, 100], [3, 100]], {
    alt: "The rōnin runs and leaps across the castle roofs.",
  }),
  // 6 · the gallop, 9 drawings a second
  gallop: s("gallop", 1035, 609, 4, [[0, 111], [1, 111], [2, 111], [3, 111]], {
    alt: "The rōnin gallops on a white horse through the bamboo mist.",
  }),
} satisfies Record<string, SpriteDef>;

export type SpriteName = keyof typeof sprites;
