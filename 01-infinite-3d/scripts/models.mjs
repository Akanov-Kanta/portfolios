// Builds public/models/*.glb from the raw kits in assets-src/ (git-ignored).
//   node scripts/models.mjs
// kit.glb     : every furniture piece as a named, hidden-by-default node (scaled to metres)
// devices.glb : the three project devices (CC0 Poly Haven models, PBR kept), one named node each;
//               missing sources are downloaded from the Poly Haven API into assets-src/polyhaven/
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, draco, mergeDocuments, prune, textureCompress, unpartition } from "@gltf-transform/functions";
import draco3d from "draco3dgltf";
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const SRC = "assets-src";
const OUT = "public/models";
const KENNEY = (n) => path.join(SRC, "kenney/Models/GLTF format", `${n}.glb`);
const KAYKIT = (n) => path.join(SRC, "kaykit", `${n}.gltf`);

// name → { file, scale }  (Kenney's kit is built at ~0.5 m per unit; KayKit is roughly metres)
const PIECES = {
  // room shell
  wall: { file: KENNEY("wall"), scale: 2 },
  wallWindow: { file: KENNEY("wallWindow"), scale: 2 },
  wallDoorway: { file: KENNEY("wallDoorway"), scale: 2 },
  wallCorner: { file: KENNEY("wallCorner"), scale: 2 },
  floorFull: { file: KENNEY("floorFull"), scale: 2 },
  doorway: { file: KENNEY("doorway"), scale: 2 },
  // desk setup
  deskCorner: { file: KENNEY("deskCorner"), scale: 2 },
  desk: { file: KENNEY("desk"), scale: 2 },
  computerScreen: { file: KENNEY("computerScreen"), scale: 2 },
  computerKeyboard: { file: KENNEY("computerKeyboard"), scale: 2 },
  computerMouse: { file: KENNEY("computerMouse"), scale: 2 },
  laptop: { file: KENNEY("laptop"), scale: 2 },
  chairDesk: { file: KENNEY("chairDesk"), scale: 2 },
  speaker: { file: KENNEY("speaker"), scale: 2 },
  speakerSmall: { file: KENNEY("speakerSmall"), scale: 2 },
  televisionModern: { file: KENNEY("televisionModern"), scale: 2 },
  televisionVintage: { file: KENNEY("televisionVintage"), scale: 2 },
  // dressing
  bookcaseOpen: { file: KENNEY("bookcaseOpen"), scale: 2 },
  books: { file: KENNEY("books"), scale: 2 },
  plantSmall1: { file: KENNEY("plantSmall1"), scale: 2 },
  pottedPlant: { file: KENNEY("pottedPlant"), scale: 2 },
  rugRectangle: { file: KENNEY("rugRectangle"), scale: 2 },
  lampRoundTable: { file: KENNEY("lampRoundTable"), scale: 2 },
  lampSquareFloor: { file: KENNEY("lampSquareFloor"), scale: 2 },
  cardboardBoxClosed: { file: KENNEY("cardboardBoxClosed"), scale: 2 },
  sideTable: { file: KENNEY("sideTable"), scale: 2 },
  radio: { file: KENNEY("radio"), scale: 2 },
  trashcan: { file: KENNEY("trashcan"), scale: 2 },
  shelfDecorated: { file: KAYKIT("shelf_B_large_decorated"), scale: 0.9 },
  bookSet: { file: KAYKIT("book_set"), scale: 0.9 },
  lampTable: { file: KAYKIT("lamp_table"), scale: 0.9 },
  cactus: { file: KAYKIT("cactus_small_A"), scale: 0.9 },
  pictureFrame: { file: KAYKIT("pictureframe_standing_A"), scale: 0.9 },
};

// project device → Poly Haven asset (https://polyhaven.com/a/<id>, CC0). Kept in metres; Devices.tsx scales them.
const DEVICES = {
  monitor: { id: "television_02", name: "Television 02", author: "Benny Weimer" },
  laptop: { id: "classic_laptop", name: "Classic Laptop", author: "Arrangemonk" },
  tv: { id: "Television_01", name: "Television 01", author: "Gabriel Radić" },
};

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  "draco3d.encoder": await draco3d.createEncoderModule(),
  "draco3d.decoder": await draco3d.createDecoderModule(),
});

/** Strip KHR_materials_unlit so the pieces respond to our lights, and give them a matte finish. */
function relight(doc) {
  for (const m of doc.getRoot().listMaterials()) {
    m.setExtension("KHR_materials_unlit", null);
    m.setMetallicFactor(0);
    m.setRoughnessFactor(0.85);
  }
  for (const e of doc.getRoot().listExtensionsUsed()) if (e.extensionName === "KHR_materials_unlit") e.dispose();
}

/** Wrap the source scene's children in one node named `name`, scaled to metres. */
function wrap(doc, name, scale) {
  const scene = doc.getRoot().listScenes()[0];
  const wrapper = doc.createNode(name).setScale([scale, scale, scale]);
  for (const child of scene.listChildren()) {
    scene.removeChild(child);
    wrapper.addChild(child);
  }
  scene.addChild(wrapper);
  return wrapper;
}

async function buildKit() {
  const target = io.createDocument ? io.createDocument() : null;
  const { Document } = await import("@gltf-transform/core");
  const doc = target ?? new Document();
  const mainScene = doc.createScene("kit");
  doc.getRoot().setDefaultScene(mainScene);
  const report = [];
  for (const [name, { file, scale }] of Object.entries(PIECES)) {
    const src = await io.read(file);
    relight(src);
    wrap(src, name, scale);
    const map = mergeDocuments(doc, src);
    // the merged scene is the last one; move its wrapper into the main scene
    const scenes = doc.getRoot().listScenes();
    const merged = scenes[scenes.length - 1];
    for (const child of merged.listChildren()) {
      merged.removeChild(child);
      mainScene.addChild(child);
    }
    merged.dispose();
    void map;
    report.push(name);
  }
  await doc.transform(dedup(), prune(), unpartition());
  await doc.transform(draco({ method: "edgebreaker" }));
  const out = path.join(OUT, "kit.glb");
  await io.write(out, doc);
  console.log(`kit.glb: ${report.length} pieces, ${(fs.statSync(out).size / 1024).toFixed(0)} KB`);
}

/** Download a Poly Haven asset's 1k glTF (+ bin + textures) unless it's already in assets-src/. */
async function fetchPolyHaven(id) {
  const dir = path.join(SRC, "polyhaven", id);
  const gltf = path.join(dir, `${id}_1k.gltf`);
  if (fs.existsSync(gltf)) return gltf;
  const files = await (await fetch(`https://api.polyhaven.com/files/${id}`)).json();
  const { url, include } = files.gltf["1k"].gltf;
  const get = async (u, rel) => {
    const res = await fetch(u);
    if (!res.ok) throw new Error(`${u}: ${res.status}`);
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), Buffer.from(await res.arrayBuffer()));
  };
  await get(url, path.basename(gltf));
  for (const [rel, f] of Object.entries(include)) await get(f.url, rel);
  return gltf;
}

async function buildDevices() {
  const { Document } = await import("@gltf-transform/core");
  const doc = new Document();
  const mainScene = doc.createScene("devices");
  doc.getRoot().setDefaultScene(mainScene);
  for (const [name, { id }] of Object.entries(DEVICES)) {
    const src = await io.read(await fetchPolyHaven(id));
    wrap(src, name, 1);
    mergeDocuments(doc, src);
    const scenes = doc.getRoot().listScenes();
    const merged = scenes[scenes.length - 1];
    for (const child of merged.listChildren()) {
      merged.removeChild(child);
      mainScene.addChild(child);
    }
    merged.dispose();
  }
  await doc.transform(
    dedup(),
    prune(),
    unpartition(),
    // colour and normal maps keep 1k (a device fills ~half the frame; the normals carry grilles and keys);
    // metal-roughness is low-frequency under this lighting, so 512 is visually identical and ~25% of the file
    textureCompress({ encoder: sharp, targetFormat: "webp", slots: /^(?!metallicRoughness)/, resize: [1024, 1024] }),
    textureCompress({ encoder: sharp, targetFormat: "webp", slots: /^metallicRoughness/, resize: [512, 512] }),
    draco({ method: "edgebreaker" }),
  );
  const out = path.join(OUT, "devices.glb");
  await io.write(out, doc);
  console.log(`devices.glb: ${Object.keys(DEVICES).join(", ")}, ${(fs.statSync(out).size / 1024).toFixed(0)} KB`);
}

fs.mkdirSync(OUT, { recursive: true });
await buildKit();
await buildDevices();
fs.writeFileSync(
  path.join(OUT, "CREDITS.md"),
  `# 3D model credits

All models are composed from these kits (nothing is copied from igloo.inc).

| File | Contents | Author | License | Source |
|---|---|---|---|---|
| kit.glb | ${Object.keys(PIECES).filter((k) => PIECES[k].file.includes("kenney")).join(", ")} | Kenney | CC0 1.0 | https://kenney.nl/assets/furniture-kit |
| kit.glb | ${Object.keys(PIECES).filter((k) => PIECES[k].file.includes("kaykit")).join(", ")} | KayKit (Kay Lousberg) | CC0 1.0 | https://github.com/KayKit-Game-Assets/KayKit-Furniture-Bits-1.0 |
${Object.entries(DEVICES)
  .map(([k, d]) => `| devices.glb | ${k}: ${d.name} | ${d.author} (Poly Haven) | CC0 1.0 | https://polyhaven.com/a/${d.id} |`)
  .join("\n")}

Pipeline: scripts/models.mjs (KHR_materials_unlit removed, scaled to metres, dedup + prune + Draco).
`,
);
