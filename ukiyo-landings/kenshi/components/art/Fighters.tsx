import { blade, bladeLine, limb, star, type Pt } from "./geometry";

/*
 * Two fighters mid-clash, drawn in the hero's 1600×1000 space.
 * Every body part is a primitive in the same ink so the overlaps fuse into a
 * single silhouette; a steel copy offset behind gives the Animatrix rim-light.
 */

// ── Fighter A · kendōka in men + hakama, lunging in from the left ──────────────
const A = {
  hip: [810, 560] as Pt,
  chest: [866, 404] as Pt,
  head: [890, 352] as Pt,
  kneeF: [930, 650] as Pt,
  ankleF: [944, 796] as Pt,
  toeF: [1000, 810] as Pt,
  kneeB: [712, 660] as Pt,
  ankleB: [612, 758] as Pt,
  toeB: [572, 790] as Pt,
  shR: [884, 414] as Pt,
  elR: [968, 462] as Pt,
  shL: [856, 404] as Pt,
  elL: [944, 446] as Pt,
  hand: [1008, 386] as Pt,
  pommel: [968, 414] as Pt,
  tsuba: [1022, 374] as Pt,
  tip: [1262, 214] as Pt,
};

// ── Fighter B · white-haired rōnin, braced low, blade up to receive ───────────
const B = {
  hip: [1310, 592] as Pt,
  chest: [1332, 424] as Pt,
  head: [1346, 368] as Pt,
  kneeF: [1230, 664] as Pt,
  ankleF: [1172, 800] as Pt,
  toeF: [1128, 812] as Pt,
  kneeB: [1402, 684] as Pt,
  ankleB: [1452, 808] as Pt,
  toeB: [1500, 816] as Pt,
  shR: [1322, 428] as Pt,
  elR: [1244, 494] as Pt,
  shL: [1346, 434] as Pt,
  elL: [1262, 506] as Pt,
  hand: [1208, 416] as Pt,
  pommel: [1240, 450] as Pt,
  tsuba: [1196, 404] as Pt,
  tip: [1012, 210] as Pt,
};

export const CLASH: Pt = [1109, 314];

function FighterA({ fill }: { fill: string }) {
  return (
    <g fill={fill}>
      {/* hakama: angular, flame-like hem thrown back by the lunge */}
      <path d="M772 520 L 716 628 L 640 714 L 560 776 L 486 790 L 556 800 L 512 822 L 600 812 L 646 816 L 724 744 L 842 650 L 896 752 L 934 824 L 1022 818 L 984 724 L 962 640 L 928 572 L 866 526 Z" />
      {/* front foot */}
      <path d="M990 806 L 1044 812 L 1040 824 L 984 824 Z" />
      {/* tare flaps at the waist */}
      <path d="M780 520 L 874 534 L 884 602 L 852 600 L 846 572 L 824 600 L 794 590 Z" />
      {/* torso leaning into the cut */}
      <path d="M776 528 L 826 404 L 852 382 L 900 392 L 922 420 L 918 470 L 880 540 Z" />
      {/* back arm: sleeve, forearm, kote */}
      <path d={limb(A.shL, A.elL, 40, 34)} />
      <path d={limb(A.elL, A.hand, 32, 28)} />
      <path d="M852 410 L 940 446 L 900 486 L 866 470 Z" />
      {/* front arm with a hanging keikogi sleeve */}
      <path d={limb(A.shR, A.elR, 42, 34)} />
      <path d={limb(A.elR, A.hand, 34, 30)} />
      <path d="M884 420 L 962 466 L 918 512 L 890 486 Z" />
      <path d="M990 368 L 1028 380 L 1022 410 L 986 404 Z" />
      {/* men: padded helmet with shoulder flaps */}
      <path d="M842 318 C 850 290 900 284 930 300 C 950 314 952 352 940 384 C 930 404 900 410 870 404 L 836 440 L 794 456 C 808 424 822 398 834 380 C 826 360 832 334 842 318 Z" />
      {/* tsuka */}
      <path d={limb(A.pommel, A.tsuba, 12, 11)} />
    </g>
  );
}

function FighterB({ fill }: { fill: string }) {
  return (
    <g fill={fill}>
      {/* haori tails thrown back by the impact */}
      <path d="M1350 440 L 1420 498 L 1470 566 L 1600 596 L 1508 620 L 1590 664 L 1470 660 L 1410 632 L 1354 548 Z" />
      {/* hakama */}
      <path d="M1286 546 L 1240 640 L 1190 730 L 1104 822 L 1188 826 L 1226 804 L 1252 742 L 1310 668 L 1372 742 L 1430 824 L 1540 824 L 1468 744 L 1404 640 L 1352 546 Z" />
      {/* feet */}
      <path d="M1112 812 L 1160 806 L 1176 826 L 1100 826 Z" />
      <path d="M1520 812 L 1556 820 L 1550 828 L 1500 828 Z" />
      {/* torso leaning back to receive */}
      <path d="M1284 556 L 1296 448 L 1316 420 L 1338 396 L 1366 424 L 1372 480 L 1356 560 Z" />
      {/* arms, both forward-left onto the hilt */}
      <path d={limb(B.shL, B.elL, 38, 32)} />
      <path d={limb(B.elL, B.hand, 30, 26)} />
      <path d={limb(B.shR, B.elR, 40, 34)} />
      <path d={limb(B.elR, B.hand, 32, 28)} />
      <path d="M1324 432 L 1250 496 L 1276 540 L 1312 500 Z" />
      <circle cx={B.hand[0]} cy={B.hand[1]} r={16} />
      {/* head + jaw */}
      <path d="M1316 356 C 1316 330 1340 318 1360 324 C 1378 330 1384 352 1378 372 L 1372 392 C 1360 404 1340 404 1326 398 L 1318 386 L 1306 382 L 1314 372 Z" />
      <path d={limb([1340, 396], [1336, 420], 28, 34)} />
      <path d={limb(B.pommel, B.tsuba, 11, 10)} />
    </g>
  );
}

/** White mane streaming back — rice fill, ink brush outline (the reference's rōnin). */
function Mane() {
  return (
    <g>
      <path
        d="M1324 336 C 1336 300 1380 286 1424 292 L 1612 268 L 1504 316 L 1630 334 L 1506 350 L 1618 402 L 1488 384 L 1566 462 L 1452 412 L 1478 498 L 1412 438 L 1384 450 C 1376 420 1374 396 1380 380 C 1384 362 1368 346 1350 342 Z"
        fill="var(--rice)"
        stroke="var(--ink)"
        strokeWidth={4}
        strokeLinejoin="miter"
      />
      <path
        d="M1410 310 L 1540 296 M1400 334 L 1560 338 M1396 356 L 1540 384 M1392 380 L 1500 432 M1390 402 L 1440 462"
        fill="none"
        stroke="var(--ink)"
        strokeWidth={2.5}
        strokeLinecap="round"
        opacity={0.8}
      />
    </g>
  );
}

/** Helmet grille, dō plate rim, red men-himo — line work over the ink. */
function DetailsA() {
  return (
    <g fill="none" strokeLinecap="round">
      <g stroke="var(--steel)" strokeWidth={3}>
        <path d="M914 318 C 936 330 944 356 936 384" />
        <path d="M904 326 L 934 330 M904 340 L 940 344 M904 354 L 940 358 M902 368 L 936 372 M900 382 L 928 386" opacity={0.85} />
      </g>
      <path d="M836 438 C 860 420 902 424 914 452 C 920 480 908 510 880 528" stroke="var(--steel)" strokeWidth={3} opacity={0.75} />
      <path d="M846 470 C 870 462 896 470 904 486" stroke="var(--ink-2)" strokeWidth={4} />
      <path className="himo" d="M846 352 C 800 340 770 360 740 350 C 710 340 690 316 650 318" stroke="var(--vermilion)" strokeWidth={6} />
      <path className="himo himo--2" d="M842 366 C 800 372 778 396 744 394 C 714 392 694 376 660 384" stroke="var(--vermilion)" strokeWidth={5} />
      <g stroke="var(--ink-2)" strokeWidth={4}>
        <path d="M884 600 C 900 680 930 760 952 812" />
        <path d="M770 610 C 730 680 680 740 620 790" />
      </g>
    </g>
  );
}

function DetailsB() {
  return (
    <g fill="none" strokeLinecap="round">
      <path d="M1320 356 L 1338 352" stroke="var(--steel)" strokeWidth={3} />
      <path d="M1278 560 L 1352 548" stroke="var(--crimson)" strokeWidth={10} />
      <g stroke="var(--ink-2)" strokeWidth={4}>
        <path d="M1300 640 C 1270 700 1230 760 1190 816" />
        <path d="M1330 650 C 1370 710 1420 770 1460 818" />
      </g>
    </g>
  );
}

function BladeA() {
  return (
    <g>
      <path d={blade(A.tsuba, A.tip, 9, -0.05)} fill="var(--rice)" stroke="var(--ink)" strokeWidth={2} />
      <ellipse cx={A.tsuba[0]} cy={A.tsuba[1]} rx={6} ry={17} transform={`rotate(-33 ${A.tsuba[0]} ${A.tsuba[1]})`} fill="var(--ink)" stroke="var(--steel)" strokeWidth={2} />
      <path className="glint-sweep" d={bladeLine(A.tsuba, A.tip, -0.05)} pathLength={100} fill="none" stroke="#fff" strokeWidth={4} strokeLinecap="round" />
    </g>
  );
}

function BladeB() {
  return (
    <g>
      <path d={blade(B.tsuba, B.tip, 9, 0.05)} fill="var(--rice)" stroke="var(--ink)" strokeWidth={2} />
      <ellipse cx={B.tsuba[0]} cy={B.tsuba[1]} rx={6} ry={16} transform={`rotate(44 ${B.tsuba[0]} ${B.tsuba[1]})`} fill="var(--ink)" stroke="var(--steel)" strokeWidth={2} />
      <path className="glint-sweep glint-sweep--late" d={bladeLine(B.tsuba, B.tip, 0.05)} pathLength={100} fill="none" stroke="#fff" strokeWidth={4} strokeLinecap="round" />
    </g>
  );
}

function Sparks() {
  const [cx, cy] = CLASH;
  const shards = [
    [-30, 120, 90],
    [10, 140, 70],
    [50, 110, 60],
    [160, 130, 80],
    [200, 120, 60],
    [250, 150, 70],
    [290, 110, 50],
    [-80, 100, 46],
  ];
  return (
    <g className="sparks">
      {shards.map(([deg, dist, len], i) => {
        const a = (deg * Math.PI) / 180;
        const x1 = cx + Math.cos(a) * 30;
        const y1 = cy + Math.sin(a) * 30;
        const x2 = cx + Math.cos(a) * (30 + dist * 0.4 + len * 0.6);
        const y2 = cy + Math.sin(a) * (30 + dist * 0.4 + len * 0.6);
        return (
          <path
            key={i}
            d={`M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`}
            stroke={i % 3 === 0 ? "var(--rice)" : "var(--vermilion)"}
            strokeWidth={i % 2 ? 3 : 5}
            strokeLinecap="round"
          />
        );
      })}
    </g>
  );
}

export function Fighters() {
  return (
    <g>
      {/* ground: a single dry-brush stroke */}
      <path
        d="M480 822 C 640 806 820 812 1000 818 C 1180 824 1380 812 1600 822 L 1600 834 C 1380 826 1200 836 1000 832 C 820 828 640 826 470 836 Z"
        fill="var(--ink)"
        opacity={0.85}
      />
      <g className="fighter fighter--a">
        <BladeA />
        <g transform="translate(4 -3)">
          <FighterA fill="var(--steel)" />
        </g>
        <FighterA fill="var(--ink)" />
        <DetailsA />
      </g>
      <g className="fighter fighter--b">
        <BladeB />
        <g transform="translate(-4 -3)">
          <FighterB fill="var(--steel)" />
        </g>
        <FighterB fill="var(--ink)" />
        <Mane />
        <DetailsB />
      </g>
      <g className="glint-burst" style={{ transformOrigin: `${CLASH[0]}px ${CLASH[1]}px` }}>
        <path d={star(CLASH[0], CLASH[1], 120, 7, 4, Math.PI / 8)} fill="var(--rice)" />
        <path d={star(CLASH[0], CLASH[1], 54, 5, 4, -Math.PI / 8)} fill="#fff" />
        <circle cx={CLASH[0]} cy={CLASH[1]} r={9} fill="#fff" />
      </g>
      <Sparks />
    </g>
  );
}
