import { Matrix4, Vector2, type Camera, type Material, type Mesh, type Object3D, type Scene, type WebGLRenderer, type WebGLRenderTarget } from "three";
import { fogShared } from "../scenes/fog-chunks";

type Uniforms = Record<string, { value: unknown } | undefined>;

/**
 * Renders the scene from a secondary camera into a (smaller) render target so that it matches what
 * the main camera would draw from that pose. Screen-space shaders read the drawing-buffer size
 * (backdrop gradient uRes, fog uFogRes, motion uRes) and point sizes read uDpr; those are swapped to
 * the target's size for the pass. Motion-stretched points (Sky, GlyphRain: uPrevVP) get this camera's
 * own previous view-projection, so the offscreen frame never smears with the main camera's motion.
 * Used by IceCutRender and MonitorDive. The uniform scan runs on activation (scenes mount lazily).
 */
export class Offscreen {
  private res = new Set<Vector2>();
  private dpr = new Set<{ value: number }>();
  private prevVP = new Set<Matrix4>();
  // per-uniform backups, allocated once and reused every render (no per-frame clones)
  private savedRes = new Map<Vector2, Vector2>();
  private savedDpr = new Map<{ value: number }, number>();
  private savedVP = new Map<Matrix4, Matrix4>();
  private lastVP = new Matrix4();
  private vp = new Matrix4();
  private hasLast = false;

  /** collect the uniforms to swap; call on (re)activation */
  scan(scene: Scene) {
    this.res.clear();
    this.dpr.clear();
    this.prevVP.clear();
    this.savedRes.clear();
    this.savedDpr.clear();
    this.savedVP.clear();
    scene.traverse((o: Object3D) => {
      const mat = (o as Mesh).material as Material | Material[] | undefined;
      if (!mat) return;
      for (const m of Array.isArray(mat) ? mat : [mat]) {
        const u = (m as Material & { uniforms?: Uniforms }).uniforms;
        if (!u) continue;
        if (u.uRes?.value instanceof Vector2) this.res.add(u.uRes.value);
        if (u.uDpr && typeof u.uDpr.value === "number") this.dpr.add(u.uDpr as { value: number });
        if (u.uPrevVP?.value instanceof Matrix4) this.prevVP.add(u.uPrevVP.value);
      }
    });
    this.hasLast = false;
  }

  /** the next render starts a new motion history (no streaks on the first frame) */
  reset() {
    this.hasLast = false;
  }

  /** every motion-stretch matrix, e.g. to re-express last frame in a teleported camera's space */
  get motionMatrices(): ReadonlySet<Matrix4> {
    return this.prevVP;
  }

  render(gl: WebGLRenderer, scene: Scene, cam: Camera, rt: WebGLRenderTarget, dprScale: number, hide?: Object3D | null) {
    cam.updateMatrixWorld();
    this.vp.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
    for (const v of this.res) {
      let bak = this.savedRes.get(v);
      if (!bak) this.savedRes.set(v, (bak = new Vector2()));
      bak.copy(v);
      v.set(rt.width, rt.height);
    }
    for (const d of this.dpr) {
      this.savedDpr.set(d, d.value);
      d.value *= dprScale;
    }
    for (const m of this.prevVP) {
      let bak = this.savedVP.get(m);
      if (!bak) this.savedVP.set(m, (bak = new Matrix4()));
      bak.copy(m);
      m.copy(this.hasLast ? this.lastVP : this.vp);
    }
    const fx = fogShared.res.x, fy = fogShared.res.y;
    fogShared.res.x = rt.width;
    fogShared.res.y = rt.height;
    const wasVisible = hide ? hide.visible : false;
    if (hide) hide.visible = false;

    const prev = gl.getRenderTarget();
    gl.setRenderTarget(rt);
    gl.clear();
    gl.render(scene, cam);
    gl.setRenderTarget(prev);

    if (hide) hide.visible = wasVisible;
    fogShared.res.x = fx;
    fogShared.res.y = fy;
    for (const v of this.res) v.copy(this.savedRes.get(v)!);
    for (const d of this.dpr) d.value = this.savedDpr.get(d)!;
    for (const m of this.prevVP) m.copy(this.savedVP.get(m)!);
    this.lastVP.copy(this.vp);
    this.hasLast = true;
  }
}
