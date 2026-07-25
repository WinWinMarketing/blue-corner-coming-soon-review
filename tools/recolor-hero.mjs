/**
 * Blue Corner hero: recolour the ORIGINAL reference photograph rather than
 * regenerate it, so the stool, floor, shadow and corner geometry stay exactly
 * as photographed. Only two things change hue: the ropes (white -> brand
 * yellow) and the wall + corner pad (black -> brand blue). Every ramp is keyed
 * on the source luminance, so the real braid texture, cylindrical shading and
 * pad sheen survive instead of being flattened into pasted colour.
 *
 * The wall is the hard part: 76% of it sits under L=0.01, i.e. RGB 0-3, so
 * lifting it into blue also amplifies the source webp's 8x8 block artifacts and
 * quantisation banding. A mask-aware blur (blur(L*mask)/blur(mask)) smooths the
 * wall WITHOUT bleeding rope or floor brightness into it, which a plain blur
 * would do — that halo is exactly the "freaky stuff" to avoid.
 */
import { createRequire } from "node:module";
const require = createRequire("c:/Users/sanja/Projects/blue-corner/package.json"); // sharp lives in the sibling app
const sharp = require("sharp");

const SRC = "c:/Users/sanja/Projects/blue-corner-coming-soon-review/assets/art/blue-corner-reference-ring.webp";
const OUT = process.argv[2] || "assets/art/blue-corner-reference-ring-brand-v3.webp";

const { data, info } = await sharp(SRC).raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: C } = info;
const N = W * H;

const L = new Float32Array(N);
for (let p = 0; p < N; p++) {
  const i = p * C;
  L[p] = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
}

// Floor plane, least-squares fitted from the photo: two straight canvas edges
// meeting at the ring corner (x=1275, y=658). Reproduces every clean column.
const LEFT = { m: -0.21319434141018379, b: 929.8688674532845 };
const RIGHT = { m: 0.2823896378280148, b: 297.83206479336604 };
const floorTop = new Float32Array(W);
for (let x = 0; x < W; x++) floorTop[x] = Math.max(LEFT.m * x + LEFT.b, RIGHT.m * x + RIGHT.b);

// Stool silhouette. Below y=592 the legs and the wall behind them are the same
// black in the source — genuinely indistinguishable — so the whole under-seat
// block is preserved as photographed and reads as the stool's shadow mass.
const SEAT = { cx: 1274, cy: 566, rx: 84, ry: 29 };
const UNDER = { x0: 1194, x1: 1356, y0: 566, y1: 664 };
const stoolWeight = (x, y) => {
  const e = ((x - SEAT.cx) / SEAT.rx) ** 2 + ((y - SEAT.cy) / SEAT.ry) ** 2;
  let w = e <= 1 ? 1 : Math.max(0, 1 - (Math.sqrt(e) - 1) * 12);
  if (y >= UNDER.y0 && y <= UNDER.y1) {
    const dx = Math.min(x - UNDER.x0, UNDER.x1 - x);
    const dy = UNDER.y1 - y;
    if (dx >= 0) w = Math.max(w, Math.min(1, dx / 4, dy / 4 + 1));
  }
  return w;
};

const ROPE_LO = 0.26;
const ROPE_HI = 0.34;

// --- mask-aware smoothing of the wall luminance -----------------------------
const WALL_MAX = 0.045;                 // above this we keep the sharp value (pad sheen, ropes)
const wallMask = new Float32Array(N);
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const p = y * W + x;
    wallMask[p] = (y < floorTop[x] && L[p] < WALL_MAX && stoolWeight(x, y) < 0.5) ? 1 : 0;
  }
}
const boxBlur = (src, radius) => {
  const tmp = new Float32Array(N), dst = new Float32Array(N);
  for (let y = 0; y < H; y++) {
    let sum = 0;
    const row = y * W;
    for (let x = -radius; x <= radius; x++) sum += src[row + Math.min(W - 1, Math.max(0, x))];
    for (let x = 0; x < W; x++) {
      tmp[row + x] = sum / (2 * radius + 1);
      sum -= src[row + Math.min(W - 1, Math.max(0, x - radius))];
      sum += src[row + Math.min(W - 1, Math.max(0, x + radius + 1))];
    }
  }
  for (let x = 0; x < W; x++) {
    let sum = 0;
    for (let y = -radius; y <= radius; y++) sum += tmp[Math.min(H - 1, Math.max(0, y)) * W + x];
    for (let y = 0; y < H; y++) {
      dst[y * W + x] = sum / (2 * radius + 1);
      sum -= tmp[Math.min(H - 1, Math.max(0, y - radius)) * W + x];
      sum += tmp[Math.min(H - 1, Math.max(0, y + radius + 1)) * W + x];
    }
  }
  return dst;
};
let num = new Float32Array(N), den = new Float32Array(N);
for (let p = 0; p < N; p++) { num[p] = L[p] * wallMask[p]; den[p] = wallMask[p]; }
for (let pass = 0; pass < 3; pass++) { num = boxBlur(num, 9); den = boxBlur(den, 9); }
const smoothWall = new Float32Array(N);
for (let p = 0; p < N; p++) smoothWall[p] = den[p] > 1e-4 ? num[p] / den[p] : L[p];

// --- colour ramps -----------------------------------------------------------
const lerp = (a, b, t) => a + (b - a) * t;
const ramp = (stops, v) => {
  for (let i = 0; i < stops.length - 1; i++) {
    if (v <= stops[i + 1][0] || i === stops.length - 2) {
      const t = Math.max(0, Math.min(1, (v - stops[i][0]) / (stops[i + 1][0] - stops[i][0])));
      return [lerp(stops[i][1][0], stops[i + 1][1][0], t), lerp(stops[i][1][1], stops[i + 1][1][1], t), lerp(stops[i][1][2], stops[i + 1][1][2], t)];
    }
  }
  return stops[stops.length - 1][1];
};
const BLUE = [
  [0.000, [8, 46, 116]],
  [0.020, [13, 74, 166]],
  [0.100, [25, 124, 227]],
  [0.190, [104, 174, 243]],
];
// Median rope luminance is 0.626, pinned to brand yellow; shading rides either side.
const YELLOW = [
  [0.300, [140, 112, 16]],
  [0.626, [239, 200, 44]],
  [1.000, [251, 236, 158]],
];
const smoothstep = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };

const out = Buffer.alloc(N * 3);
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const p = y * W + x;
    const i = p * C, o = p * 3;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const l = L[p];

    // Canvas floor, its shadow, and anything dark resting on it: untouched.
    const sw = y >= floorTop[x] ? 1 : stoolWeight(x, y);
    if (sw >= 1) { out[o] = r; out[o + 1] = g; out[o + 2] = b; continue; }

    // Wall value uses the smoothed luminance, fading to the sharp value as the
    // pixel brightens so the corner pad keeps its crisp edge and its sheen.
    const wSmooth = 1 - smoothstep(0.018, WALL_MAX, l);
    const lWall = lerp(l, smoothWall[p], wSmooth);
    const blue = ramp(BLUE, lWall);

    let col;
    if (l <= ROPE_LO) col = blue;
    else if (l >= ROPE_HI) col = ramp(YELLOW, l);
    else {
      // A rope edge pixel is a blend of rope and the wall BEHIND it, so it must
      // fade toward the surrounding wall colour. Feeding its own (bright)
      // luminance to the blue ramp instead paints a pale halo along every rope.
      const t = (l - ROPE_LO) / (ROPE_HI - ROPE_LO);
      const behind = ramp(BLUE, smoothWall[p]);
      const yel = ramp(YELLOW, l);
      col = [lerp(behind[0], yel[0], t), lerp(behind[1], yel[1], t), lerp(behind[2], yel[2], t)];
    }
    // Feathered stool edge.
    if (sw > 0) col = [lerp(col[0], r, sw), lerp(col[1], g, sw), lerp(col[2], b, sw)];

    out[o] = Math.max(0, Math.min(255, col[0]));
    out[o + 1] = Math.max(0, Math.min(255, col[1]));
    out[o + 2] = Math.max(0, Math.min(255, col[2]));
  }
}

await sharp(out, { raw: { width: W, height: H, channels: 3 } }).webp({ quality: 90, effort: 6 }).toFile(OUT);
console.log("wrote", OUT, W + "x" + H);
