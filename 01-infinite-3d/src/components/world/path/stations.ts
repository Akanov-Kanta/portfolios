import type { StationId } from "../state/world-store";
import { SERVER, STACK_BOTTOM, VOID } from "../scenes/layout";

type V3 = [number, number, number];
export interface Ctrl {
  pos: V3;
  target: V3;
  fov?: number;
  station?: StationId;
}

/**
 * Closed camera path. Control point i sits exactly at t = i/N (three's closed CatmullRom
 * parameterises getPoint by point index, not arc length). Stations dwell on their point;
 * the points in between are the "gates" the camera flies through during a transition.
 * World units: the room floor is y = 0, the desk corner is near the origin; 1 unit ≈ 1 m.
 * First-pass values: tuned visually in P4.
 */
export const CONTROL: Ctrl[] = [
  { station: "hero",     pos: [3.6, 1.9, 4.2],     target: [0.2, 0.9, 0.2], fov: 38 },   // 0  doorway 3/4 view of the room
  {                      pos: [2.4, 1.6, 2.4],     target: [-0.4, 1.1, -0.6] },          // 1  gate: stepping in
  { station: "about",    pos: [1.1, 1.45, 1.4],    target: [-1.2, 1.3, -1.4], fov: 42 }, // 2  eye level, bookcase / monitors
  {                      pos: [0.2, 1.3, 0.2],     target: [0, 1.2, -2] },               // 3  gate: into the monitor
  { station: "projects", pos: [VOID.x, STACK_BOTTOM, VOID.z + 6], target: [VOID.x, STACK_BOTTOM, VOID.z], fov: 40 }, // 4  the void, posed on the LAST device; CameraRig lifts to earlier devices during the hold, so the outgoing flight starts exactly on the curve
  {                      pos: [0, STACK_BOTTOM - 7, -19],   target: [0, STACK_BOTTOM - 10, -30] },            // 5  gate: dive well under the last device (7 below, still in front of its plane) toward the server room
  { station: "contact",  pos: [SERVER.x, SERVER.y + 2.0, SERVER.z + 7], target: [SERVER.x, SERVER.y + 1.75, SERVER.z], fov: 45 }, // 6  server room: orb logo above the plinth, plinth low in frame (igloo)
  {                      pos: [2.5, SERVER.y + 8, -24],     target: [2, SERVER.y + 16, -12] },                // 7  gate: rising out
  {                      pos: [4.8, 2.6, 5.6],     target: [0.2, 0.9, 0.2] },            // 8  descent onto the hero pose (closes onto 0)
];

const N = CONTROL.length;
export const STATION_T = Object.fromEntries(
  CONTROL.flatMap((c, i) => (c.station ? [[c.station, i / N]] : [])),
) as Record<StationId, number>;

/** Inner routes park at a station. */
export function routeStation(pathname: string): StationId {
  if (pathname.startsWith("/projects")) return "projects";
  if (pathname.startsWith("/about")) return "about";
  if (pathname.startsWith("/contact")) return "contact";
  return "hero";
}
