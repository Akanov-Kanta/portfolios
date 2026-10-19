/** Shared by Drop and Dossier so the cut between the two chapters lands on an identical frame. */
export const BURST = { seed: 3, cx: 0.5, cy: 0.97, radius: 0.5 } as const;
export const GIANT_EYE_SEED = 31;
/** Drop's pinned length, as a share of the viewport height (Dossier's overlap assumes its pin ends there) */
export const DROP_PIN = 1.3;
