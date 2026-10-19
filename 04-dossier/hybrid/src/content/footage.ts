/**
 * Where the edit's footage goes (times = seconds in the source edit, 960x572 frames with burned-in text
 * removed). CASE FILE uses one block: the drop collage (figure + ink burst + eye strip), as the hero.
 */
export const REELS = {
  drop: [4.7, 6.97],
} as const;

/**
 * The hero's footage: the edit's block 4 (the drop collage), played forward at real time, independent of
 * scroll, looping with a soft crossfade at the seam. Starts after the drop's white flash (4.70–4.9 s); the
 * edit's own cut at 5.72 s stays in (it is the footage, not one of ours).
 */
export const HERO_LOOP = { from: 4.95, to: 6.95, crossfade: 0.4, poster: 6.5 } as const;

/**
 * Phones show a portrait crop of the loop; block 4 has two shots with the figure on opposite sides
 * (the edit cuts at 5.72 s), so the crop follows the face: focusX per shot (0 = left edge, 1 = right).
 */
export const HERO_PORTRAIT_FOCUS: readonly { until: number; focusX: number; focusY: number }[] = [
  { until: 5.72, focusX: 0.16, focusY: 0.3 }, // t_05.50: figure left
  { until: 99, focusX: 0.86, focusY: 0.3 }, //   t_06.50: figure right
];

/**
 * The edit's eye strip (t_06.50, left), the contact's still: a 2x asset made from the full-quality edit
 * frame (reference/frames/t_06.50.jpg, crop x 150–566, y 212–322), Lanczos 2x, unsharp, film grain.
 * w/h are its pixel size; it should not be displayed much wider than w / 1.5 CSS px.
 */
export const EYE_STRIP = { src: "/media/eye-strip@2x.jpg", w: 832, h: 220 } as const;
