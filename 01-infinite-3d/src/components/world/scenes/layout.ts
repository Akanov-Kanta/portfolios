/**
 * World layout in metres. Room floor is y = 0; the room's inner corner is at (-2, 0, -2):
 * back wall along x at z = -2, side wall along z at x = -2, open toward +x/+z (dollhouse view).
 * Kenney pieces have their origin at the front-left corner (x 0..w, z -d..0), so a piece
 * placed at [x, 0, z] with rotation 0 occupies x..x+w and z-d..z.
 */
import { site } from "@/content/site";
import { rng } from "./rng";

export const DEVICE_SPACING = 6;
/** where the project devices stack starts (device i is at y = VOID.y - i * DEVICE_SPACING); far below the room so nothing overlaps */
export const VOID = { x: 0, y: -40, z: -20 } as const;
/** y of the last device; everything after the projects station hangs below it */
export const STACK_BOTTOM = VOID.y - (site.projects.length - 1) * DEVICE_SPACING;
export const SERVER = { x: 0, y: STACK_BOTTOM - 12, z: -37 } as const;

export type Placement = {
  piece: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  /** semantic tag used by Room.tsx to attach lights/screens */
  tag?: "monitorL" | "monitorR" | "laptop" | "lamp" | "floorLamp" | "tv";
};

const R = Math.PI / 2;

export const ROOM: Placement[] = [
  // shell: back wall (z = -2) is 4 m wide = 2 wall pieces (2 m each); side wall (x = -2)
  { piece: "wallWindow", position: [-2, 0, -2], rotation: [0, 0, 0] },
  { piece: "wall", position: [0, 0, -2], rotation: [0, 0, 0] },
  { piece: "wallDoorway", position: [-2, 0, 2], rotation: [0, R, 0] },
  { piece: "wall", position: [-2, 0, 0], rotation: [0, R, 0] },
  // desk corner in the corner, monitors on it
  { piece: "deskCorner", position: [-1.95, 0, -0.05], rotation: [0, 0, 0] },
  { piece: "computerScreen", position: [-1.5, 0.76, -1.55], rotation: [0, 0.35, 0], tag: "monitorL" },
  { piece: "computerScreen", position: [-0.6, 0.76, -1.6], rotation: [0, -0.1, 0], tag: "monitorR" },
  { piece: "computerKeyboard", position: [-1.2, 0.76, -1.05], rotation: [0, 0.05, 0] },
  { piece: "computerMouse", position: [-0.5, 0.76, -1.0], rotation: [0, 0, 0] },
  { piece: "laptop", position: [-1.85, 0.76, -0.35], rotation: [0, R * 0.9, 0] },
  { piece: "speakerSmall", position: [-1.95, 0.76, -1.95], rotation: [0, 0.4, 0] },
  { piece: "speakerSmall", position: [-0.05, 0.76, -1.95], rotation: [0, -0.4, 0] },
  { piece: "lampRoundTable", position: [-0.45, 0.76, -1.95], rotation: [0, 0, 0], tag: "lamp" },
  { piece: "chairDesk", position: [-1.05, 0, 0.1], rotation: [0, Math.PI + 0.3, 0] },
  // dressing
  { piece: "bookcaseOpen", position: [0.9, 0, -1.95], rotation: [0, 0, 0] },
  { piece: "books", position: [1.0, 0.84, -1.75], rotation: [0, 0, 0] },
  { piece: "shelfDecorated", position: [-1.95, 1.75, -1.0], rotation: [0, R, 0] },
  { piece: "pottedPlant", position: [1.6, 0, 0.9], rotation: [0, 0.6, 0] },
  { piece: "plantSmall1", position: [0.05, 0.76, -1.85], rotation: [0, 0, 0] },
  { piece: "cactus", position: [1.35, 1.36, -1.7], rotation: [0, 0, 0] },
  { piece: "lampSquareFloor", position: [-1.95, 0, 1.1], rotation: [0, R, 0], tag: "floorLamp" },
  { piece: "rugRectangle", position: [-1.5, 0.001, 1.6], rotation: [0, 0, 0] },
  { piece: "cardboardBoxClosed", position: [1.3, 0, -1.2], rotation: [0, 0.3, 0] },
  { piece: "sideTable", position: [-1.95, 0, 1.95], rotation: [0, R, 0] },
  { piece: "radio", position: [-1.85, 0.5, 1.75], rotation: [0, R, 0] },
  { piece: "pictureFrame", position: [-1.7, 1.78, -1.3], rotation: [0, R, 0] },
  { piece: "trashcan", position: [-0.3, 0, 0.2], rotation: [0, 0, 0] },
];

/** intro assembly delay (0..1) per ROOM entry; Room's pieces and ContactShadows' blobs share it */
export const ROOM_INTRO_DELAYS: readonly number[] = (() => {
  const r = rng(5);
  return ROOM.map(() => r());
})();
